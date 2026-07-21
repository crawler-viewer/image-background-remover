import { getUserWithSession } from "./auth/db.js";
import { resolveActivePlan } from "./auth/plan.js";
import { json, readSession } from "./auth/_lib.js";
import {
  assertMonthlyLimit,
  assertGuestAccess,
  assertRateLimit,
  getClientIp,
  getOrCreateGuestId,
  guestCookieString,
  getMonthlyUsage,
  getGuestMonthlyUsage,
  claimUserUsage,
  rollbackUserUsage,
  claimGuestUsage,
  rollbackGuestUsage,
  tryDeductCredit,
  refundCredit,
  recordUsage,
  ipGuestKey,
  GUEST_IP_MONTHLY_LIMIT,
} from "./usage.js";
import { getPlanConfig } from "./plan-config.js";
import { assertDailyUpstreamBudget, getUpstreamCostUsd } from "./cost-guard.js";
import { logEvent, newRequestId } from "./log.js";

const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp"];

/**
 * Roll back any pre-claims (usage rows / credits) after upstream failure or error.
 */
async function releaseClaims(env, claims) {
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

export async function onRequestPost(context) {
  const { request, env } = context;
  const requestId = newRequestId();
  const startedAt = Date.now();

  const apiKey = env.CLIPDROP_API_KEY || env.REMOVE_BG_API_KEY;
  const useClipdrop = !!env.CLIPDROP_API_KEY;
  const provider = useClipdrop ? "clipdrop" : "remove_bg";

  if (!apiKey) {
    logEvent("error", "remove_bg_no_api_key", { requestId });
    return Response.json(
      { error: "Service temporarily unavailable." },
      { status: 503 }
    );
  }

  /** @type {{ creditDeducted?: boolean, googleSub?: string, userUsageId?: number, guestClaim?: { guestLogId: number, ipLogId: number|null } }|null} */
  let claims = null;
  let planCode = "guest";
  /** @type {"quota"|"credits"|null} */
  let billMode = null;

  try {
    const clientIp = getClientIp(request);

    // Global daily spend guard (optional via DAILY_UPSTREAM_LIMIT)
    const budget = await assertDailyUpstreamBudget(env);
    if (!budget.allowed) {
      logEvent("warn", "daily_budget_exceeded", {
        requestId,
        used: budget.used,
        limit: budget.limit,
        error: budget.error || false,
      });
      return json(
        {
          error: "Service is at capacity for today. Please try again tomorrow.",
          code: "DAILY_BUDGET_EXCEEDED",
          used: budget.used,
          limit: budget.limit,
        },
        { status: 503 }
      );
    }

    const rate = await assertRateLimit(env, { clientIp });
    if (!rate.allowed) {
      logEvent("info", "rate_limited", {
        requestId,
        used: rate.used,
        limit: rate.limit,
        retryAfterSec: rate.retryAfterSec,
      });
      return new Response(
        JSON.stringify({
          error: "Too many requests. Please wait a moment and try again.",
          code: "RATE_LIMITED",
          limit: rate.limit,
          retryAfterSec: rate.retryAfterSec,
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": String(rate.retryAfterSec || 60),
          },
        }
      );
    }

    const session = await readSession(request, env);
    const user = await getUserWithSession(env, session);

    let plan = null;
    let guestInfo = null;

    if (user?.google_sub) {
      const active = await resolveActivePlan(env, user);
      planCode = active.planCode;
      plan = active.plan;
    } else {
      const active = await resolveActivePlan(env, null);
      planCode = active.planCode;
      plan = active.plan;
    }

    // Parse + validate image before any quota claim / credit deduct
    let formData;
    try {
      formData = await request.formData();
    } catch {
      return Response.json(
        { error: "Expected multipart form data with an image file.", code: "INVALID_BODY" },
        { status: 400 }
      );
    }

    const file = formData.get("image");

    if (!file || typeof file === "string") {
      return Response.json(
        { error: "No image provided.", code: "NO_IMAGE" },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return Response.json(
        { error: "Unsupported format. Please upload PNG, JPG, or WebP." },
        { status: 400 }
      );
    }

    if (file.size > plan.maxFileSizeBytes) {
      return Response.json(
        {
          error: `File too large. Maximum size is ${Math.round(
            plan.maxFileSizeBytes / (1024 * 1024)
          )}MB for your current plan.`,
          code: "FILE_TOO_LARGE",
        },
        { status: 400 }
      );
    }

    if (user?.google_sub) {
      const quota = await assertMonthlyLimit(env, user.google_sub, planCode);
      let reservedOnQuota = false;

      if (quota.allowed) {
        try {
          const claim = await claimUserUsage(env, {
            googleSub: user.google_sub,
            userId: user.id || null,
            sourceFilename: file?.name || null,
          });
          claims = { userUsageId: claim.id, googleSub: user.google_sub };

          const usedAfter = await getMonthlyUsage(env, user.google_sub);
          if (usedAfter > plan.monthlyLimit) {
            await rollbackUserUsage(env, claim.id);
            claims = null;
          } else {
            billMode = "quota";
            reservedOnQuota = true;
          }
        } catch (claimErr) {
          logEvent("error", "user_usage_claim_failed", {
            requestId,
            error: String(claimErr?.message || claimErr),
          });
          return json(
            {
              error: "Could not reserve quota. Please try again.",
              code: "QUOTA_CLAIM_FAILED",
            },
            { status: 503 }
          );
        }
      }

      if (!reservedOnQuota) {
        const usedNow = await getMonthlyUsage(env, user.google_sub);
        const deducted = await tryDeductCredit(env, user.google_sub);
        if (!deducted) {
          return json(
            {
              error: "Monthly limit reached. Buy credits or upgrade your plan.",
              code: "MONTHLY_LIMIT_REACHED",
              used: usedNow,
              limit: plan.monthlyLimit,
              plan: planCode,
              credits: 0,
            },
            { status: 429 }
          );
        }
        billMode = "credits";
        claims = { creditDeducted: true, googleSub: user.google_sub };
      }
    } else {
      guestInfo = getOrCreateGuestId(request);
      guestInfo.clientIp = clientIp;
      const quota = await assertGuestAccess(env, guestInfo.guestId, clientIp);
      if (!quota.allowed) {
        const headers = { "Content-Type": "application/json" };
        if (guestInfo.isNew) {
          headers["Set-Cookie"] = guestCookieString(guestInfo.guestId);
        }
        return new Response(
          JSON.stringify({
            error: quota.error || "Guest monthly limit reached. Sign in to unlock more removals.",
            code: quota.code || "GUEST_MONTHLY_LIMIT_REACHED",
            used: quota.used,
            limit: quota.limit,
            plan: "guest",
          }),
          { status: 429, headers }
        );
      }

      try {
        const guestClaim = await claimGuestUsage(env, {
          guestKey: guestInfo.guestId,
          sourceFilename: file?.name || null,
          clientIp: guestInfo.clientIp || clientIp,
        });
        claims = { guestClaim };

        const guestPlan = getPlanConfig("guest");
        const cookieUsed = await getGuestMonthlyUsage(env, guestInfo.guestId);
        const ipUsed = await getGuestMonthlyUsage(env, ipGuestKey(clientIp));
        if (cookieUsed > guestPlan.monthlyLimit || ipUsed > GUEST_IP_MONTHLY_LIMIT) {
          await rollbackGuestUsage(env, guestClaim);
          claims = null;
          const headers = { "Content-Type": "application/json" };
          if (guestInfo.isNew) {
            headers["Set-Cookie"] = guestCookieString(guestInfo.guestId);
          }
          return new Response(
            JSON.stringify({
              error: "Guest monthly limit reached. Sign in to unlock more removals.",
              code: "GUEST_MONTHLY_LIMIT_REACHED",
              used: cookieUsed,
              limit: guestPlan.monthlyLimit,
              plan: "guest",
            }),
            { status: 429, headers }
          );
        }
      } catch (claimErr) {
        logEvent("error", "guest_usage_claim_failed", {
          requestId,
          error: String(claimErr?.message || claimErr),
        });
        return json(
          {
            error: "Could not reserve guest quota. Please try again.",
            code: "QUOTA_CLAIM_FAILED",
          },
          { status: 503 }
        );
      }
    }

    const upstreamStarted = Date.now();
    let response;

    if (useClipdrop) {
      const clipdropForm = new FormData();
      clipdropForm.append("image_file", file);

      response = await fetch("https://clipdrop-api.co/remove-background/v1", {
        method: "POST",
        headers: { "x-api-key": apiKey },
        body: clipdropForm,
      });
    } else {
      const rbFormData = new FormData();
      rbFormData.append("image_file", file);
      rbFormData.append("size", "auto");

      response = await fetch("https://api.remove.bg/v1.0/removebg", {
        method: "POST",
        headers: { "X-Api-Key": apiKey },
        body: rbFormData,
      });
    }

    const upstreamMs = Date.now() - upstreamStarted;

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      logEvent("error", "upstream_error", {
        requestId,
        provider,
        status: response.status,
        plan: planCode,
        billMode,
        upstreamMs,
        // Truncate provider body — may contain operational detail, not user PII
        detail: String(errText).slice(0, 200),
      });
      await releaseClaims(env, claims);
      claims = null;

      if (response.status === 402) {
        return Response.json(
          { error: "Service quota exceeded. Please try again later." },
          { status: 503 }
        );
      }
      if (response.status === 429) {
        return new Response(
          JSON.stringify({
            error: "Service is busy. Please try again.",
            code: "UPSTREAM_RATE_LIMITED",
            retryAfterSec: 30,
          }),
          {
            status: 429,
            headers: { "Content-Type": "application/json", "Retry-After": "30" },
          }
        );
      }

      return Response.json(
        { error: "Background removal failed. Please try a different image." },
        { status: 502 }
      );
    }

    const buffer = await response.arrayBuffer();

    if (billMode === "credits" && user?.google_sub) {
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

    claims = null;

    const costUsd = getUpstreamCostUsd(env);
    logEvent("info", "remove_bg_ok", {
      requestId,
      provider,
      plan: planCode,
      billMode,
      loggedIn: !!user?.google_sub,
      fileSizeKb: Math.round((file.size || 0) / 1024),
      resultBytes: buffer.byteLength,
      upstreamMs,
      totalMs: Date.now() - startedAt,
      costUsdEst: costUsd,
      dailyBudget: budget.disabled
        ? null
        : { used: budget.used, limit: budget.limit, remaining: budget.remaining },
    });

    const responseHeaders = {
      "Content-Type": "image/png",
      "Cache-Control": "no-store",
      "Access-Control-Allow-Origin": "*",
      "X-Request-Id": requestId,
    };

    if (guestInfo?.isNew) {
      responseHeaders["Set-Cookie"] = guestCookieString(guestInfo.guestId);
    }

    return new Response(buffer, {
      status: 200,
      headers: responseHeaders,
    });
  } catch (err) {
    logEvent("error", "remove_bg_internal_error", {
      requestId,
      plan: planCode,
      billMode,
      totalMs: Date.now() - startedAt,
      error: String(err?.message || err),
    });
    await releaseClaims(env, claims);
    return Response.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
