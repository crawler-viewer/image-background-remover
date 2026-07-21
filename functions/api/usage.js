import { readSession } from "./auth/_lib.js";
import { getPlanConfig, GUEST_IP_MONTHLY_LIMIT } from "./plan-config.js";
import {
  RATE_LIMIT_WINDOW_MS,
  RATE_LIMIT_MAX_PER_WINDOW,
  RATE_LIMIT_ACTION,
} from "../../shared/rate-limit.js";

/** Soft ceiling across all guest cookies on the same network (UTC month). */
export { GUEST_IP_MONTHLY_LIMIT };

/** Short-window anti-burst limits for /api/remove-bg (per IP). */
export { RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX_PER_WINDOW, RATE_LIMIT_ACTION };

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

export function getClientIp(request) {
  const cfIp = request.headers.get("cf-connecting-ip");
  if (cfIp) return cfIp.trim();

  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }

  return "unknown";
}

export function ipGuestKey(ip) {
  return `ip:${ip || "unknown"}`;
}

export function getGuestKey(request) {
  // Prefer cookie-based guest ID for persistence
  const cookieHeader = request.headers.get("cookie") || "";
  const match = cookieHeader.match(/(?:^|;\s*)__bg_gid=([a-f0-9-]+)/);
  if (match) return match[1];

  // Fallback to IP+UA
  const ip = getClientIp(request);
  const userAgent = request.headers.get("user-agent") || "unknown";
  return `${ip}:${userAgent.slice(0, 80)}`;
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
  return `__bg_gid=${guestId}; Path=/; Max-Age=${maxAge}; SameSite=Lax; Secure; HttpOnly`;
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

/**
 * Guest cookie quota + IP anti-abuse ceiling.
 * Clearing cookies cannot exceed GUEST_IP_MONTHLY_LIMIT removals per UTC month.
 */
export async function assertGuestAccess(env, guestId, clientIp) {
  const guestQuota = await assertGuestMonthlyLimit(env, guestId);
  const ipKey = ipGuestKey(clientIp);
  const ipUsed = await getGuestMonthlyUsage(env, ipKey);
  const ipLimit = GUEST_IP_MONTHLY_LIMIT;
  const ipRemaining = Math.max(0, ipLimit - ipUsed);

  if (!guestQuota.allowed) {
    return {
      allowed: false,
      reason: "guest_cookie",
      code: "GUEST_MONTHLY_LIMIT_REACHED",
      error: "Guest monthly limit reached. Sign in to unlock more removals.",
      used: guestQuota.used,
      limit: guestQuota.limit,
      remaining: 0,
      ipUsed,
      ipLimit,
    };
  }

  if (ipUsed >= ipLimit) {
    return {
      allowed: false,
      reason: "guest_ip",
      code: "GUEST_IP_LIMIT_REACHED",
      error: "Too many free removals from this network this month. Sign in to continue.",
      used: ipUsed,
      limit: ipLimit,
      remaining: 0,
      ipUsed,
      ipLimit,
    };
  }

  return {
    allowed: true,
    reason: null,
    code: null,
    error: null,
    used: guestQuota.used,
    limit: guestQuota.limit,
    // Surface the tighter remaining so the UI does not over-promise.
    remaining: Math.min(guestQuota.remaining, ipRemaining),
    ipUsed,
    ipLimit,
  };
}

/**
 * Sliding 60s window rate limit by IP (and optional user key).
 * Fail-open if the rate_limit_logs table is missing (pre-migration).
 */
export async function assertRateLimit(env, { clientIp, identityKey = null }) {
  const ip = clientIp || "unknown";
  if (ip === "unknown") {
    return { allowed: true, used: 0, limit: RATE_LIMIT_MAX_PER_WINDOW, retryAfterSec: 0 };
  }

  try {
    const db = ensureDb(env);
    const now = Date.now();
    const windowStart = new Date(now - RATE_LIMIT_WINDOW_MS).toISOString();
    const bucketKey = identityKey ? `id:${identityKey}` : `ip:${ip}`;

    const row = await db
      .prepare(
        `SELECT COUNT(*) AS count
         FROM rate_limit_logs
         WHERE bucket_key = ?
           AND action = ?
           AND created_at >= ?`
      )
      .bind(bucketKey, RATE_LIMIT_ACTION, windowStart)
      .first();

    const used = Number(row?.count || 0);
    if (used >= RATE_LIMIT_MAX_PER_WINDOW) {
      return {
        allowed: false,
        used,
        limit: RATE_LIMIT_MAX_PER_WINDOW,
        retryAfterSec: Math.ceil(RATE_LIMIT_WINDOW_MS / 1000),
      };
    }

    await db
      .prepare(
        `INSERT INTO rate_limit_logs (bucket_key, action, created_at)
         VALUES (?, ?, ?)`
      )
      .bind(bucketKey, RATE_LIMIT_ACTION, new Date(now).toISOString())
      .run();

    // Best-effort cleanup of old rows (keep table small)
    if (used === 0 || used % 20 === 0) {
      const pruneBefore = new Date(now - RATE_LIMIT_WINDOW_MS * 10).toISOString();
      await db
        .prepare(`DELETE FROM rate_limit_logs WHERE created_at < ?`)
        .bind(pruneBefore)
        .run()
        .catch(() => {});
    }

    return {
      allowed: true,
      used: used + 1,
      limit: RATE_LIMIT_MAX_PER_WINDOW,
      retryAfterSec: 0,
    };
  } catch (err) {
    // Table may not exist yet — do not block legitimate traffic
    console.error("Rate limit check failed (fail-open):", err);
    return { allowed: true, used: 0, limit: RATE_LIMIT_MAX_PER_WINDOW, retryAfterSec: 0 };
  }
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

/**
 * Pre-claim a logged-in usage slot before calling the upstream API.
 * Returns last_row_id so the claim can be rolled back on failure.
 */
export async function claimUserUsage(env, { googleSub, userId = null, sourceFilename = null }) {
  const db = ensureDb(env);
  const now = new Date().toISOString();
  const result = await db
    .prepare(
      `INSERT INTO usage_logs (user_id, google_sub, action, source_filename, created_at)
       VALUES (?, ?, 'remove_bg', ?, ?)`
    )
    .bind(userId, googleSub, sourceFilename, now)
    .run();

  const id = Number(result?.meta?.last_row_id || 0);
  if (!id) {
    throw new Error("Failed to claim user usage (no row id)");
  }
  return { id };
}

export async function rollbackUserUsage(env, usageId) {
  if (!usageId) return;
  const db = ensureDb(env);
  await db
    .prepare(`DELETE FROM usage_logs WHERE id = ?`)
    .bind(usageId)
    .run();
}

/**
 * Atomic credit pre-deduct. Returns true only when one credit was taken.
 */
export async function tryDeductCredit(env, googleSub) {
  if (!googleSub) return false;
  const db = ensureDb(env);
  const now = new Date().toISOString();
  const result = await db
    .prepare(
      `UPDATE user_credits
       SET balance = balance - 1, updated_at = ?
       WHERE google_sub = ? AND balance > 0`
    )
    .bind(now, googleSub)
    .run();
  return Number(result?.meta?.changes || 0) > 0;
}

/** Refund one credit after a failed upstream call (best-effort). */
export async function refundCredit(env, googleSub) {
  if (!googleSub) return;
  const db = ensureDb(env);
  const now = new Date().toISOString();
  await db
    .prepare(
      `UPDATE user_credits
       SET balance = balance + 1, updated_at = ?
       WHERE google_sub = ?`
    )
    .bind(now, googleSub)
    .run();
}

export async function getCreditBalance(env, googleSub) {
  if (!googleSub || !env?.DB) return 0;
  try {
    const row = await ensureDb(env)
      .prepare(`SELECT balance FROM user_credits WHERE google_sub = ? LIMIT 1`)
      .bind(googleSub)
      .first();
    return Number(row?.balance || 0);
  } catch {
    return 0;
  }
}

export async function recordGuestUsage(env, { guestKey, sourceFilename = null, clientIp = null }) {
  const claim = await claimGuestUsage(env, { guestKey, sourceFilename, clientIp });
  return claim;
}

/**
 * Pre-claim guest cookie (+ optional IP) slots before upstream.
 * @returns {{ guestLogId: number, ipLogId: number|null }}
 */
export async function claimGuestUsage(env, { guestKey, sourceFilename = null, clientIp = null }) {
  const db = ensureDb(env);
  const now = new Date().toISOString();

  const guestResult = await db
    .prepare(
      `INSERT INTO guest_usage_logs (guest_key, action, source_filename, created_at)
       VALUES (?, 'remove_bg', ?, ?)`
    )
    .bind(guestKey, sourceFilename, now)
    .run();

  const guestLogId = Number(guestResult?.meta?.last_row_id || 0);
  if (!guestLogId) {
    throw new Error("Failed to claim guest usage (no row id)");
  }

  let ipLogId = null;
  if (clientIp && clientIp !== "unknown") {
    const ipResult = await db
      .prepare(
        `INSERT INTO guest_usage_logs (guest_key, action, source_filename, created_at)
         VALUES (?, 'remove_bg', ?, ?)`
      )
      .bind(ipGuestKey(clientIp), sourceFilename, now)
      .run();
    ipLogId = Number(ipResult?.meta?.last_row_id || 0) || null;
  }

  return { guestLogId, ipLogId };
}

export async function rollbackGuestUsage(env, { guestLogId = null, ipLogId = null } = {}) {
  const db = ensureDb(env);
  if (guestLogId) {
    await db.prepare(`DELETE FROM guest_usage_logs WHERE id = ?`).bind(guestLogId).run();
  }
  if (ipLogId) {
    await db.prepare(`DELETE FROM guest_usage_logs WHERE id = ?`).bind(ipLogId).run();
  }
}
