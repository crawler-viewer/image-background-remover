import { readSession } from "./auth/_lib";
import { getPlanConfig } from "./plan-config";

function ensureDb(env) {
  if (!env.DB) {
    throw new Error("Missing D1 binding: DB");
  }
  return env.DB;
}

function monthRange() {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0)).toISOString();
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0, 0)).toISOString();
  return { start, end };
}

export async function getCurrentUser(request, env) {
  const session = await readSession(request, env);
  if (!session?.sub) return null;
  return session;
}

export function getGuestKey(request) {
  // Prefer cookie-based guest ID for persistence
  const cookieHeader = request.headers.get("cookie") || "";
  const match = cookieHeader.match(/(?:^|;\s*)__bg_gid=([a-f0-9-]+)/);
  if (match) return match[1];

  // Fallback to IP+UA
  const ip = request.headers.get("cf-connecting-ip") || "unknown";
  const userAgent = request.headers.get("user-agent") || "unknown";
  return `${ip}:${userAgent.slice(0, 80)}`;
}

export function makeGuestCookieHeader(guestKey) {
  // Only set cookie if it's a UUID (not IP-based fallback)
  if (guestKey.includes(":")) return null;
  return null; // already set
}

export function generateGuestId() {
  // crypto.randomUUID() is available in Cloudflare Workers
  return crypto.randomUUID();
}

export function getOrCreateGuestId(request) {
  const cookieHeader = request.headers.get("cookie") || "";
  const match = cookieHeader.match(/(?:^|;\s*)__bg_gid=([a-f0-9-]+)/);
  if (match) return { guestId: match[1], isNew: false };
  return { guestId: generateGuestId(), isNew: true };
}

export function guestCookieString(guestId) {
  // 1 year expiry, SameSite=Lax, HttpOnly
  const maxAge = 365 * 24 * 60 * 60;
  return `__bg_gid=${guestId}; Path=/; Max-Age=${maxAge}; SameSite=Lax; Secure`;
}

export async function getMonthlyUsage(env, googleSub) {
  const db = ensureDb(env);
  const { start, end } = monthRange();
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

export async function getGuestMonthlyUsage(env, guestKey) {
  const db = ensureDb(env);
  const { start, end } = monthRange();
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

export async function assertMonthlyLimit(env, googleSub, planCode = "free") {
  const used = await getMonthlyUsage(env, googleSub);
  const plan = getPlanConfig(planCode);
  return {
    used,
    limit: plan.monthlyLimit,
    allowed: used < plan.monthlyLimit,
    remaining: Math.max(0, plan.monthlyLimit - used),
  };
}

export async function assertGuestMonthlyLimit(env, guestKey) {
  const used = await getGuestMonthlyUsage(env, guestKey);
  const plan = getPlanConfig("guest");
  return {
    used,
    limit: plan.monthlyLimit,
    allowed: used < plan.monthlyLimit,
    remaining: Math.max(0, plan.monthlyLimit - used),
  };
}

export async function recordUsage(env, { googleSub, userId = null, sourceFilename = null }) {
  const db = ensureDb(env);
  const now = new Date().toISOString();
  const result = await db
    .prepare(
      `INSERT INTO usage_logs (user_id, google_sub, action, source_filename, created_at)
       VALUES (?, ?, 'remove_bg', ?, ?)`
    )
    .bind(userId, googleSub, sourceFilename, now)
    .run();

  return result;
}

export async function recordGuestUsage(env, { guestKey, sourceFilename = null }) {
  const db = ensureDb(env);
  const now = new Date().toISOString();
  const result = await db
    .prepare(
      `INSERT INTO guest_usage_logs (guest_key, action, source_filename, created_at)
       VALUES (?, 'remove_bg', ?, ?)`
    )
    .bind(guestKey, sourceFilename, now)
    .run();

  return result;
}
