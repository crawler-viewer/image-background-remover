import { readSession } from "./auth/_lib";
import { getPlanConfig } from "./plan-config";

function ensureDb(env) {
  if (!env.DB) {
    throw new Error("Missing D1 binding: DB");
  }
  return env.DB;
}

function dayRange() {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0)).toISOString();
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0, 0)).toISOString();
  return { start, end };
}

export async function getCurrentUser(request, env) {
  const session = await readSession(request, env);
  if (!session?.sub) return null;
  return session;
}

export function getGuestKey(request) {
  const ip = request.headers.get("cf-connecting-ip") || "unknown";
  const userAgent = request.headers.get("user-agent") || "unknown";
  return `${ip}:${userAgent.slice(0, 80)}`;
}

export async function getGuestDailyUsage(env, guestKey) {
  const db = ensureDb(env);
  const { start, end } = dayRange();
  const row = await db
    .prepare(
      `SELECT COUNT(*) AS count
       FROM guest_usage_logs
       WHERE guest_key = ?
         AND action = 'remove_bg'
         AND created_at >= ?
         AND created_at < ?`
    )
    .bind(guestKey, start, end)
    .first();

  return Number(row?.count || 0);
}

export async function getDailyUsage(env, googleSub) {
  const db = ensureDb(env);
  const { start, end } = dayRange();
  const row = await db
    .prepare(
      `SELECT COUNT(*) AS count
       FROM usage_logs
       WHERE google_sub = ?
         AND action = 'remove_bg'
         AND created_at >= ?
         AND created_at < ?`
    )
    .bind(googleSub, start, end)
    .first();

  return Number(row?.count || 0);
}

export async function assertDailyLimit(env, googleSub, planCode = "free") {
  const used = await getDailyUsage(env, googleSub);
  const plan = getPlanConfig(planCode);
  return {
    used,
    limit: plan.dailyLimit,
    allowed: used < plan.dailyLimit,
    remaining: Math.max(0, plan.dailyLimit - used),
  };
}

export async function recordUsage(env, { googleSub, userId = null, sourceFilename = null }) {
  const db = ensureDb(env);
  const now = new Date().toISOString();
  await db
    .prepare(
      `INSERT INTO usage_logs (user_id, google_sub, action, source_filename, created_at)
       VALUES (?, ?, 'remove_bg', ?, ?)`
    )
    .bind(userId, googleSub, sourceFilename, now)
    .run();
}

export async function assertGuestDailyLimit(env, guestKey) {
  const used = await getGuestDailyUsage(env, guestKey);
  const plan = getPlanConfig("guest");
  return {
    used,
    limit: plan.dailyLimit,
    allowed: used < plan.dailyLimit,
    remaining: Math.max(0, plan.dailyLimit - used),
  };
}

export async function recordGuestUsage(env, { guestKey, sourceFilename = null }) {
  const db = ensureDb(env);
  const now = new Date().toISOString();
  await db
    .prepare(
      `INSERT INTO guest_usage_logs (guest_key, action, source_filename, created_at)
       VALUES (?, 'remove_bg', ?, ?)`
    )
    .bind(guestKey, sourceFilename, now)
    .run();
}
