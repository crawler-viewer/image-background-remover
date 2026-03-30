import { getUserWithSession } from "../auth/db";
import { json, readSession } from "../auth/_lib";
import { getPlanConfig } from "../plan-config";
import { assertDailyLimit } from "../usage";

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
      limit: plan.dailyLimit,
      remaining: plan.dailyLimit,
    };
    try {
      quota = await assertDailyLimit(env, user.google_sub, planCode);
    } catch (quotaError) {
      console.error("Failed to load quota for account/me:", quotaError);
    }

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
        remaining: quota.remaining,
        max_file_size_mb: Math.round(plan.maxFileSizeBytes / (1024 * 1024)),
      },
    });
  } catch (error) {
    console.error("Failed to load account/me:", error);
    return json({ user: null }, { status: 500 });
  }
}
