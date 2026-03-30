import { getUserByGoogleSub } from "../auth/db";
import { debugSession, json, readSession } from "../auth/_lib";

export async function onRequestGet(context) {
  const { request, env } = context;

  try {
    const sessionDebug = await debugSession(request, env);
    const session = await readSession(request, env);

    let user = null;
    let userError = null;

    if (session?.sub) {
      try {
        user = await getUserByGoogleSub(env, session.sub);
      } catch (error) {
        userError = error instanceof Error ? error.message : String(error);
      }
    }

    return json({
      sessionDebug,
      session,
      user,
      userError,
    });
  } catch (error) {
    console.error(error);
    return json({ error: "account_debug_failed" }, { status: 500 });
  }
}
