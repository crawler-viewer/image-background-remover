import { readSession } from "./auth/_lib";
import { getUserWithSession } from "./auth/db";
import { getPlanConfig } from "./plan-config";
import { assertMonthlyLimit, assertGuestMonthlyLimit, getGuestKey } from "./usage";

export async function onRequestGet(context) {
  const { request, env } = context;

  try {
    const session = await readSession(request, env);
    const user = await getUserWithSession(env, session);

    if (user?.google_sub) {
      const planCode = user.plan || "free";
      const plan = getPlanConfig(planCode);
      const quota = await assertMonthlyLimit(env, user.google_sub, planCode);

      return Response.json({
        plan: planCode,
        used: quota.used,
        limit: quota.limit,
        remaining: quota.remaining,
        maxFileSizeMb: Math.round(plan.maxFileSizeBytes / (1024 * 1024)),
        loggedIn: true,
        period: "monthly",
      });
    }

    const guestKey = getGuestKey(request);
    const plan = getPlanConfig("guest");

    let quota;
    try {
      quota = await assertGuestMonthlyLimit(env, guestKey);
    } catch {
      quota = { used: 0, limit: plan.monthlyLimit, remaining: plan.monthlyLimit };
    }

    return Response.json({
      plan: "guest",
      used: quota.used,
      limit: quota.limit,
      remaining: quota.remaining,
      maxFileSizeMb: Math.round(plan.maxFileSizeBytes / (1024 * 1024)),
      loggedIn: false,
      period: "monthly",
    });
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
