import { readSession } from "./auth/_lib";
import { getUserWithSession } from "./auth/db";
import { getPlanConfig } from "./plan-config";
import { assertMonthlyLimit, assertGuestMonthlyLimit, getOrCreateGuestId, guestCookieString } from "./usage";

export async function onRequestGet(context) {
  const { request, env } = context;

  try {
    const session = await readSession(request, env);
    const user = await getUserWithSession(env, session);

    if (user?.google_sub) {
      const planCode = user.plan || "free";
      const plan = getPlanConfig(planCode);
      const quota = await assertMonthlyLimit(env, user.google_sub, planCode);

      // Get credit balance
      let creditBalance = 0;
      try {
        const creditRow = await env.DB
          .prepare(`SELECT balance FROM user_credits WHERE google_sub = ? LIMIT 1`)
          .bind(user.google_sub)
          .first();
        creditBalance = Number(creditRow?.balance || 0);
      } catch {}

      return Response.json({
        plan: planCode,
        used: quota.used,
        limit: quota.limit,
        remaining: quota.remaining,
        credits: creditBalance,
        maxFileSizeMb: Math.round(plan.maxFileSizeBytes / (1024 * 1024)),
        loggedIn: true,
        period: "monthly",
      });
    }

    const { guestId, isNew } = getOrCreateGuestId(request);
    const plan = getPlanConfig("guest");

    let quota;
    try {
      quota = await assertGuestMonthlyLimit(env, guestId);
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
      // Clone response to add Set-Cookie header
      const headers = new Headers(res.headers);
      headers.set("Set-Cookie", guestCookieString(guestId));
      return new Response(res.body, { status: res.status, headers });
    }

    return res;
  } catch (err) {
    console.error("Quota API error:", err);
    return Response.json({
      plan: "guest",
      used: 0,
      limit: 5,
      remaining: 5,
      maxFileSizeMb: 10,
      loggedIn: false,
      period: "monthly",
    });
  }
}
