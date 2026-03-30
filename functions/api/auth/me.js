import { getUserByGoogleSub } from "./db";
import { ensureEnv, json, readSession } from "./_lib";

export async function onRequestGet(context) {
  const { request, env } = context;

  try {
    ensureEnv(env);
    const session = await readSession(request, env);
    if (!session?.sub) {
      return json({ user: null });
    }

    const user = await getUserByGoogleSub(env, session.sub);
    return json({
      user:
        user || {
          id: null,
          google_sub: session.sub,
          email: session.email || null,
          name: session.name || null,
          avatar_url: session.picture || null,
          plan: "free",
          status: "active",
          created_at: null,
          updated_at: null,
          last_seen_at: null,
          last_login_at: null,
        },
    });
  } catch (error) {
    console.error(error);
    return json({ user: null }, { status: 200 });
  }
}
