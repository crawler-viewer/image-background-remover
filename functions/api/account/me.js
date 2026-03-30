import { getUserWithSession } from "../auth/db";
import { json, readSession } from "../auth/_lib";
import { assertDailyLimit } from "../usage";

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

    const quota = await assertDailyLimit(env, user.google_sub);

    return json({
      user: {
        id: user.id,
        google_sub: user.google_sub,
        email: user.email,
        name: user.name,
        avatar_url: user.avatar_url,
        plan: user.plan || "free",
        status: user.status || "active",
        created_at: user.created_at,
        updated_at: user.updated_at || null,
        last_seen_at: user.last_seen_at || null,
        last_login_at: user.last_login_at,
        today_used: quota.used,
        daily_limit: quota.limit,
        remaining: quota.remaining,
      },
    });
  } catch (error) {
    console.error(error);
    return json({ user: null }, { status: 500 });
  }
}
