import { getUserWithSession } from "../auth/db";
import { json, readSession } from "../auth/_lib";

export async function onRequestGet(context) {
  const { request, env } = context;

  try {
    const session = await readSession(request, env);
    if (!session?.sub) {
      return json({ items: [] }, { status: 401 });
    }

    const user = await getUserWithSession(env, session);
    if (!user) {
      return json({ items: [] }, { status: 404 });
    }

    const rows = await env.DB
      .prepare(
        `SELECT id, action, source_filename, status, created_at
         FROM usage_logs
         WHERE google_sub = ?
         ORDER BY created_at DESC
         LIMIT 10`
      )
      .bind(user.google_sub)
      .all();

    return json({ items: rows?.results || [] });
  } catch (error) {
    console.error(error);
    return json({ items: [] }, { status: 500 });
  }
}
