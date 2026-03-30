import { getUserWithSession } from "../auth/db";
import { json, readSession } from "../auth/_lib";
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

    let quota = DEFAULT_QUOTA;
    try {
      quota = await assertDailyLimit(env, user.google_sub);
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
        plan: user.plan || "free",
        status: user.status || "active",
        created_at: user.created_at || null,
        updated_at: user.updated_at || null,
        last_seen_at: user.last_seen_at || null,
        last_login_at: user.last_login_at || null,
        today_used: quota.used,
        daily_limit: quota.limit,
        remaining: quota.remaining,
      },
    });
  } catch (error) {
    console.error("Failed to load account/me:", error);
    return json({ user: null }, { status: 500 });
  }
}
