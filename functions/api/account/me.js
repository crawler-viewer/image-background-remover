import { getUserWithSession } from "../auth/db.js";
import { json, readSession } from "../auth/_lib.js";
import { planExpiryInfo, resolveActivePlan } from "../auth/plan.js";
import { assertMonthlyLimit, getCreditBalance } from "../usage.js";

export async function onRequestGet(context) {
  const { request, env } = context;

  try {
    const session = await readSession(request, env);
    if (!session?.sub) {
      return json({ user: null }, { status: 401 });
    }

    const user = await getUserWithSession(env, session);
    if (!user) {
      return json({ user: null }, { status: 404 });
    }

    const active = await resolveActivePlan(env, user);
    const planCode = active.planCode;
    const plan = active.plan;

    // When just expired, keep original expiry timestamp so UI can show "expired"
    const expiry = active.expired
      ? planExpiryInfo(active.planExpiresAt, { forceExpired: true })
      : planExpiryInfo(active.planExpiresAt);

    let quota = {
      used: 0,
      limit: plan.monthlyLimit,
      remaining: plan.monthlyLimit,
    };
    try {
      quota = await assertMonthlyLimit(env, user.google_sub, planCode);
    } catch (quotaError) {
      console.error("Failed to load quota for account/me:", quotaError);
    }

    const creditBalance = await getCreditBalance(env, user.google_sub);

    return json({
      user: {
        id: user.id,
        google_sub: user.google_sub,
        email: user.email,
        name: user.name,
        avatar_url: user.avatar_url,
        plan: planCode,
        status: user.status || "active",
        created_at: user.created_at || null,
        updated_at: user.updated_at || null,
        last_seen_at: user.last_seen_at || null,
        last_login_at: user.last_login_at || null,
        plan_expires_at: expiry.plan_expires_at,
        plan_expired: expiry.plan_expired,
        plan_days_remaining: expiry.plan_days_remaining,
        month_used: quota.used,
        monthly_limit: quota.limit,
        remaining: quota.remaining,
        credits: creditBalance,
        max_file_size_mb: Math.round(plan.maxFileSizeBytes / (1024 * 1024)),
      },
    });
  } catch (error) {
    console.error("Failed to load account/me:", error);
    return json({ user: null }, { status: 500 });
  }
}
