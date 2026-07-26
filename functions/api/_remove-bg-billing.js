/**
 * Phase 2 of /api/remove-bg: who is asking, and who pays for this removal.
 *
 * The reservation is made *before* the upstream call and rolled back on failure,
 * so a failed removal never costs the user a slot or a credit.
 */
import { getUserWithSession } from "./auth/db.js";
import { resolveActivePlan } from "./auth/plan.js";
import { json, readSession } from "./auth/_lib.js";
import {
  assertMonthlyLimit,
  assertGuestAccess,
  getOrCreateGuestId,
  guestCookieString,
  claimUserUsage,
  rollbackUserUsage,
  getUserUsageRank,
  getGuestUsageRanks,
  claimGuestUsage,
  rollbackGuestUsage,
  tryDeductCredit,
  refundCredit,
  recordUsage,
  GUEST_IP_MONTHLY_LIMIT,
} from "./usage.js";
import { getPlanConfig } from "./plan-config.js";
import { logEvent } from "./log.js";

/** Session → user row → effective plan (expired prepaid plans downgrade here). */
export async function resolveIdentity(env, request) {
  const session = await readSession(request, env);
  const user = await getUserWithSession(env, session);
  const active = await resolveActivePlan(env, user?.google_sub ? user : null);

  return { user, planCode: active.planCode, plan: active.plan };
}

function guestJson(body, { status, guestInfo }) {
  const headers = { "Content-Type": "application/json" };
  // Cookie must ride the same response that consumed the guest quota
  if (guestInfo?.isNew) headers["Set-Cookie"] = guestCookieString(guestInfo.guestId);
  return new Response(JSON.stringify(body), { status, headers });
}

const CLAIM_FAILED = { error: "Could not reserve quota. Please try again.", code: "QUOTA_CLAIM_FAILED" };

async function reserveForUser(env, { user, planCode, plan, file, requestId }) {
  const quota = await assertMonthlyLimit(env, user.google_sub, planCode);
  let usedNow = quota.used;

  if (quota.allowed) {
    let claim;
    try {
      claim = await claimUserUsage(env, {
        googleSub: user.google_sub,
        userId: user.id || null,
        sourceFilename: file?.name || null,
      });
    } catch (claimErr) {
      logEvent("error", "user_usage_claim_failed", {
        requestId,
        error: String(claimErr?.message || claimErr),
      });
      return { response: json(CLAIM_FAILED, { status: 503 }) };
    }

    // Rank of this row inside the month, not a fresh total: two requests racing
    // on the last slot get ranks N and N+1, so the earlier one keeps it instead
    // of both rolling back.
    const rank = await getUserUsageRank(env, user.google_sub, claim.id);
    if (rank <= plan.monthlyLimit) {
      return {
        billMode: "quota",
        claims: { userUsageId: claim.id, googleSub: user.google_sub },
      };
    }

    await rollbackUserUsage(env, claim.id);
    usedNow = rank - 1;
  }

  // Over plan quota — credits are the fallback
  const deducted = await tryDeductCredit(env, user.google_sub);
  if (!deducted) {
    return {
      response: json(
        {
          error: "Monthly limit reached. Buy credits or upgrade your plan.",
          code: "MONTHLY_LIMIT_REACHED",
          used: usedNow,
          limit: plan.monthlyLimit,
          plan: planCode,
          credits: 0,
        },
        { status: 429 }
      ),
    };
  }

  return {
    billMode: "credits",
    claims: { creditDeducted: true, googleSub: user.google_sub },
  };
}

async function reserveForGuest(env, { request, clientIp, file, requestId }) {
  const guestInfo = getOrCreateGuestId(request);
  guestInfo.clientIp = clientIp;

  const quota = await assertGuestAccess(env, guestInfo.guestId, clientIp);
  if (!quota.allowed) {
    return {
      guestInfo,
      response: guestJson(
        {
          error: quota.error || "Guest monthly limit reached. Sign in to unlock more removals.",
          code: quota.code || "GUEST_MONTHLY_LIMIT_REACHED",
          used: quota.used,
          limit: quota.limit,
          plan: "guest",
        },
        { status: 429, guestInfo }
      ),
    };
  }

  let guestClaim;
  try {
    guestClaim = await claimGuestUsage(env, {
      guestKey: guestInfo.guestId,
      sourceFilename: file?.name || null,
      clientIp,
    });
  } catch (claimErr) {
    logEvent("error", "guest_usage_claim_failed", {
      requestId,
      error: String(claimErr?.message || claimErr),
    });
    return {
      guestInfo,
      response: json(
        { error: "Could not reserve guest quota. Please try again.", code: "QUOTA_CLAIM_FAILED" },
        { status: 503 }
      ),
    };
  }

  const guestPlan = getPlanConfig("guest");
  const { cookieRank, ipRank } = await getGuestUsageRanks(env, {
    guestKey: guestInfo.guestId,
    clientIp,
    guestLogId: guestClaim.guestLogId,
    ipLogId: guestClaim.ipLogId,
  });
  const overCookie = cookieRank > guestPlan.monthlyLimit;
  const overIp = ipRank > GUEST_IP_MONTHLY_LIMIT;

  if (overCookie || overIp) {
    await rollbackGuestUsage(env, guestClaim);
    return {
      guestInfo,
      response: guestJson(
        overCookie
          ? {
              error: "Guest monthly limit reached. Sign in to unlock more removals.",
              code: "GUEST_MONTHLY_LIMIT_REACHED",
              used: Math.max(0, cookieRank - 1),
              limit: guestPlan.monthlyLimit,
              plan: "guest",
            }
          : {
              error: "Too many free removals from this network this month. Sign in to continue.",
              code: "GUEST_IP_LIMIT_REACHED",
              used: Math.max(0, ipRank - 1),
              limit: GUEST_IP_MONTHLY_LIMIT,
              plan: "guest",
            },
        { status: 429, guestInfo }
      ),
    };
  }

  return { billMode: "quota", claims: { guestClaim }, guestInfo };
}

/**
 * Reserve one removal for the caller.
 * @returns {Promise<{ response: Response, guestInfo?: object }
 *   | { billMode: "quota"|"credits", claims: object, guestInfo?: object }>}
 */
export async function reserveRemoval(env, ctx) {
  return ctx.user?.google_sub ? reserveForUser(env, ctx) : reserveForGuest(env, ctx);
}

/** Roll back pre-claims (usage rows / credits) after upstream failure or error. */
export async function releaseClaims(env, claims) {
  if (!claims) return;
  try {
    if (claims.creditDeducted && claims.googleSub) {
      await refundCredit(env, claims.googleSub);
    }
  } catch (e) {
    logEvent("error", "credit_refund_failed", { error: String(e?.message || e) });
  }
  try {
    if (claims.userUsageId) {
      await rollbackUserUsage(env, claims.userUsageId);
    }
  } catch (e) {
    logEvent("error", "user_usage_rollback_failed", { error: String(e?.message || e) });
  }
  try {
    if (claims.guestClaim) {
      await rollbackGuestUsage(env, claims.guestClaim);
    }
  } catch (e) {
    logEvent("error", "guest_usage_rollback_failed", { error: String(e?.message || e) });
  }
}

/**
 * Credit-funded removals still get a usage_logs row after success, so the
 * account history shows them. Best effort: never fail the request for it.
 */
export async function recordCreditAudit(env, { user, file, requestId }) {
  try {
    await recordUsage(env, {
      googleSub: user.google_sub,
      userId: user.id || null,
      sourceFilename: file?.name || null,
    });
  } catch (usageError) {
    logEvent("error", "credit_usage_audit_failed", {
      requestId,
      error: String(usageError?.message || usageError),
    });
  }
}
