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
          sub: session.sub,
          email: session.email || null,
          name: session.name || null,
          avatar_url: session.picture || null,
        },
    });
  } catch (error) {
    console.error(error);
    return json({ user: null }, { status: 200 });
  }
}
