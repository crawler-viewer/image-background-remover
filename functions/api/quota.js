import { readSession } from "./auth/_lib.js";
import { getUserWithSession } from "./auth/db.js";
import { resolveActivePlan } from "./auth/plan.js";
import {
  assertMonthlyLimit,
  assertGuestAccess,
  getClientIp,
  getOrCreateGuestId,
  guestCookieString,
  getCreditBalance,
} from "./usage.js";
import { getPlanConfig } from "./plan-config.js";

export async function onRequestGet(context) {
  const { request, env } = context;

  try {
    const session = await readSession(request, env);
    const user = await getUserWithSession(env, session);

    if (user?.google_sub) {
      const active = await resolveActivePlan(env, user);
      const planCode = active.planCode;
      const plan = active.plan;
      const quota = await assertMonthlyLimit(env, user.google_sub, planCode);
      const creditBalance = await getCreditBalance(env, user.google_sub);

      return Response.json({
        plan: planCode,
        used: quota.used,
        limit: quota.limit,
        remaining: quota.remaining,
        credits: creditBalance,
        maxFileSizeMb: Math.round(plan.maxFileSizeBytes / (1024 * 1024)),
        loggedIn: true,
        period: "monthly",
        planExpired: active.expired,
      });
    }

    const { guestId, isNew } = getOrCreateGuestId(request);
    const active = await resolveActivePlan(env, null);
    const plan = active.plan;
    const clientIp = getClientIp(request);

    let quota;
    try {
      quota = await assertGuestAccess(env, guestId, clientIp);
    } catch {
      quota = { used: 0, limit: plan.monthlyLimit, remaining: plan.monthlyLimit };
    }

    const res = Response.json({
      plan: "guest",
      used: quota.used,
      limit: quota.limit,
      remaining: quota.remaining,
      maxFileSizeMb: Math.round(plan.maxFileSizeBytes / (1024 * 1024)),
      loggedIn: false,
      period: "monthly",
    });

    if (isNew) {
      const headers = new Headers(res.headers);
      headers.set("Set-Cookie", guestCookieString(guestId));
      return new Response(res.body, { status: res.status, headers });
    }

    return res;
  } catch (err) {
    console.error("Quota API error:", err);
    const guest = getPlanConfig("guest");
    return Response.json({
      plan: "guest",
      used: 0,
      limit: guest.monthlyLimit,
      remaining: guest.monthlyLimit,
      maxFileSizeMb: guest.maxFileSizeMb,
      loggedIn: false,
      period: "monthly",
    });
  }
}
