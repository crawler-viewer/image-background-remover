import { getUserWithSession } from "../auth/db";
import { json, readSession } from "../auth/_lib";
import { getPlanConfig } from "../plan-config";
import { assertMonthlyLimit } from "../usage";

const DEFAULT_QUOTA = {
  used: 0,
  limit: 10,
  remaining: 10,
};

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

    const planCode = user.plan || "free";
    const plan = getPlanConfig(planCode);

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

    // Get credit balance
    let creditBalance = 0;
    try {
      const creditRow = await env.DB
        .prepare(`SELECT balance FROM user_credits WHERE google_sub = ? LIMIT 1`)
        .bind(user.google_sub)
        .first();
      creditBalance = Number(creditRow?.balance || 0);
    } catch {}

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
        today_used: quota.used,
        daily_limit: quota.limit,
        monthly_used: quota.used,
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
