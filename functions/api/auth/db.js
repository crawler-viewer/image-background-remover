import { json } from "./_lib";

function ensureDb(env) {
  if (!env.DB) {
    throw new Error("Missing D1 binding: DB");
  }
  return env.DB;
}

export async function upsertUser(env, profile) {
  const db = ensureDb(env);
  const now = new Date().toISOString();

  await db
    .prepare(
      `INSERT INTO users (
         google_sub,
         email,
         name,
         avatar_url,
         plan,
         status,
         created_at,
         updated_at,
         last_seen_at,
         last_login_at
       )
       VALUES (?, ?, ?, ?, 'free', 'active', ?, ?, ?, ?)
       ON CONFLICT(google_sub) DO UPDATE SET
         email = excluded.email,
         name = excluded.name,
         avatar_url = excluded.avatar_url,
         updated_at = excluded.updated_at,
         last_seen_at = excluded.last_seen_at,
         last_login_at = excluded.last_login_at`
    )
    .bind(
      profile.sub,
      profile.email || null,
      profile.name || null,
      profile.picture || null,
      now,
      now,
      now,
      now
    )
    .run();
}

export async function getUserByGoogleSub(env, googleSub) {
  const db = ensureDb(env);
  const result = await db
    .prepare(
      `SELECT id, google_sub, email, name, avatar_url, plan, plan_expires_at, status, created_at, updated_at, last_seen_at, last_login_at
       FROM users
       WHERE google_sub = ?
       LIMIT 1`
    )
    .bind(googleSub)
    .first();

  return result || null;
}

export async function getUserWithSession(env, session) {
  if (!session?.sub) return null;
  return getUserByGoogleSub(env, session.sub);
}

export async function handleDbError(error) {
  console.error("D1 error:", error);
  return json({ error: "Database error." }, { status: 500 });
}
