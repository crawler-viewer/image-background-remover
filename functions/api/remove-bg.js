/**
 * POST /api/remove-bg — the one paid path in the product.
 *
 * Orchestration only; each phase lives in its own module:
 *   _remove-bg-guards.js    daily budget → IP burst limit → upload validation
 *   _remove-bg-billing.js   identity → plan → quota/credit reservation
 *   _remove-bg-upstream.js  Clipdrop / Remove.bg call
 *
 * Invariant: the reservation is made before the upstream call and released on
 * any failure, so a user is never charged for a removal they did not receive.
 */
import { getClientIp, guestCookieString } from "./usage.js";
import { getUpstreamCostUsd } from "./cost-guard.js";
import { logEvent, newRequestId } from "./log.js";
import { checkTrafficGuards, readUploadedImage } from "./_remove-bg-guards.js";
import {
  recordCreditAudit,
  releaseClaims,
  reserveRemoval,
  resolveIdentity,
} from "./_remove-bg-billing.js";
import {
  removeBackground,
  resolveProvider,
  upstreamErrorResponse,
} from "./_remove-bg-upstream.js";

function imageResponse(buffer, { requestId, guestInfo }) {
  const headers = {
    "Content-Type": "image/png",
    "Cache-Control": "no-store",
    "Access-Control-Allow-Origin": "*",
    "X-Request-Id": requestId,
  };
  if (guestInfo?.isNew) {
    headers["Set-Cookie"] = guestCookieString(guestInfo.guestId);
  }
  return new Response(buffer, { status: 200, headers });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const requestId = newRequestId();
  const startedAt = Date.now();

  const upstreamConfig = resolveProvider(env);
  if (!upstreamConfig) {
    logEvent("error", "remove_bg_no_api_key", { requestId });
    return Response.json({ error: "Service temporarily unavailable." }, { status: 503 });
  }

  /** @type {{ creditDeducted?: boolean, googleSub?: string, userUsageId?: number, guestClaim?: object }|null} */
  let claims = null;
  let planCode = "guest";
  /** @type {"quota"|"credits"|null} */
  let billMode = null;

  try {
    const clientIp = getClientIp(request);

    const guards = await checkTrafficGuards(env, { requestId, clientIp });
    if (guards.response) return guards.response;

    const identity = await resolveIdentity(env, request);
    const { user, plan } = identity;
    planCode = identity.planCode;

    const upload = await readUploadedImage(request, { plan, planCode, requestId });
    if (upload.response) return upload.response;
    const file = upload.file;

    const reservation = await reserveRemoval(env, {
      request,
      clientIp,
      user,
      planCode,
      plan,
      file,
      requestId,
    });
    if (reservation.response) return reservation.response;

    claims = reservation.claims;
    billMode = reservation.billMode;

    const upstream = await removeBackground({ file, ...upstreamConfig });

    if (!upstream.ok) {
      logEvent("error", "upstream_error", {
        requestId,
        provider: upstreamConfig.provider,
        status: upstream.status,
        plan: planCode,
        billMode,
        upstreamMs: upstream.upstreamMs,
        detail: upstream.detail,
      });
      await releaseClaims(env, claims);
      claims = null;
      return upstreamErrorResponse(upstream.status);
    }

    if (billMode === "credits" && user?.google_sub) {
      await recordCreditAudit(env, { user, file, requestId });
    }

    // Past this point the removal is delivered — nothing left to roll back
    claims = null;

    logEvent("info", "remove_bg_ok", {
      requestId,
      provider: upstreamConfig.provider,
      plan: planCode,
      billMode,
      loggedIn: !!user?.google_sub,
      fileSizeKb: Math.round((file.size || 0) / 1024),
      resultBytes: upstream.buffer.byteLength,
      upstreamMs: upstream.upstreamMs,
      totalMs: Date.now() - startedAt,
      costUsdEst: getUpstreamCostUsd(env),
      // `enforced: false` is the queryable signal that DAILY_UPSTREAM_LIMIT is
      // unset, i.e. this removal had no global spend ceiling behind it. Alert on
      // it rather than failing closed — an unset var must not take the site down.
      dailyBudget: guards.budget.disabled
        ? { enforced: false }
        : {
            enforced: true,
            used: guards.budget.used,
            limit: guards.budget.limit,
            remaining: guards.budget.remaining,
          },
    });

    return imageResponse(upstream.buffer, { requestId, guestInfo: reservation.guestInfo });
  } catch (err) {
    logEvent("error", "remove_bg_internal_error", {
      requestId,
      plan: planCode,
      billMode,
      totalMs: Date.now() - startedAt,
      error: String(err?.message || err),
    });
    await releaseClaims(env, claims);
    return Response.json({ error: "Internal server error." }, { status: 500 });
  }
}
