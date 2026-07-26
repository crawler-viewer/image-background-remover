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

/**
 * Guest cookie quota + IP anti-abuse ceiling.
 * Clearing cookies cannot exceed GUEST_IP_MONTHLY_LIMIT removals per UTC month.
 */
export async function assertGuestAccess(env, guestId, clientIp) {
  const db = ensureDb(env);
  const { start, end } = monthRange();
  const ipKey = ipGuestKey(clientIp);

  // Cookie count + IP count in one round trip
  const row = await db
    .prepare(
      `SELECT
         (SELECT COUNT(*) FROM guest_usage_logs
           WHERE guest_key = ? AND action = 'remove_bg'
             AND created_at >= ? AND created_at < ?) AS cookie_used,
         (SELECT COUNT(*) FROM guest_usage_logs
           WHERE guest_key = ? AND action = 'remove_bg'
             AND created_at >= ? AND created_at < ?) AS ip_used`
    )
    .bind(guestId, start, end, ipKey, start, end)
    .first();

  const guestPlan = getPlanConfig("guest");
  const cookieUsed = Number(row?.cookie_used || 0);
  const guestQuota = {
    used: cookieUsed,
    limit: guestPlan.monthlyLimit,
    allowed: cookieUsed < guestPlan.monthlyLimit,
    remaining: Math.max(0, guestPlan.monthlyLimit - cookieUsed),
  };

  const ipUsed = Number(row?.ip_used || 0);
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

/** True only when the failure is "the table has not been migrated yet". */
function isMissingTableError(err) {
  return String(err?.message || err || "")
    .toLowerCase()
    .includes("no such table");
}

/**
 * Sliding 60s window rate limit by IP (and optional user key).
 *
 * One D1 round trip on the happy path: the hit is written and counted in a
 * single batch (D1 runs a batch as one sequential transaction). A rejected
 * request deletes its own hit so a client that keeps retrying is not locked
 * out for longer than the window.
 *
 * Fail-open only when the table is missing (pre-migration). Any other DB
 * failure fails closed — a D1 blip must not silently disable the limiter.
 */
export async function assertRateLimit(env, { clientIp, identityKey = null }) {
  const ip = clientIp || "unknown";
  if (ip === "unknown") {
    return { allowed: true, used: 0, limit: RATE_LIMIT_MAX_PER_WINDOW, retryAfterSec: 0 };
  }

  const retryAfterSec = Math.ceil(RATE_LIMIT_WINDOW_MS / 1000);
  let db;
  try {
    db = ensureDb(env);
    const now = Date.now();
    const windowStart = new Date(now - RATE_LIMIT_WINDOW_MS).toISOString();
    const bucketKey = identityKey ? `id:${identityKey}` : `ip:${ip}`;

    const [insertResult, countResult] = await db.batch([
      db
        .prepare(
          `INSERT INTO rate_limit_logs (bucket_key, action, created_at)
           VALUES (?, ?, ?)`
        )
        .bind(bucketKey, RATE_LIMIT_ACTION, new Date(now).toISOString()),
      db
        .prepare(
          `SELECT COUNT(*) AS count
           FROM rate_limit_logs
           WHERE bucket_key = ?
             AND action = ?
             AND created_at >= ?`
        )
        .bind(bucketKey, RATE_LIMIT_ACTION, windowStart),
    ]);

    // The count includes the hit we just wrote
    const used = Number(countResult?.results?.[0]?.count || 0);
    const hitId = Number(insertResult?.meta?.last_row_id || 0);

    if (used > RATE_LIMIT_MAX_PER_WINDOW) {
      // Do not let a rejected attempt extend its own window
      if (hitId) {
        await db
          .prepare(`DELETE FROM rate_limit_logs WHERE id = ?`)
          .bind(hitId)
          .run()
          .catch(() => {});
      }
      return {
        allowed: false,
        used: used - 1,
        limit: RATE_LIMIT_MAX_PER_WINDOW,
        retryAfterSec,
      };
    }

    // Best-effort cleanup of old rows (keep table small)
    if (used === 1 || used % 20 === 0) {
      const pruneBefore = new Date(now - RATE_LIMIT_WINDOW_MS * 10).toISOString();
      await db
        .prepare(`DELETE FROM rate_limit_logs WHERE created_at < ?`)
        .bind(pruneBefore)
        .run()
        .catch(() => {});
    }

    return {
      allowed: true,
      used,
      limit: RATE_LIMIT_MAX_PER_WINDOW,
      retryAfterSec: 0,
    };
  } catch (err) {
    if (!db || isMissingTableError(err)) {
      // Table not migrated yet — do not block legitimate traffic
      console.error("Rate limit table unavailable (fail-open):", err);
      return { allowed: true, used: 0, limit: RATE_LIMIT_MAX_PER_WINDOW, retryAfterSec: 0 };
    }
    console.error("Rate limit check failed (fail-closed):", err);
    return {
      allowed: false,
      used: 0,
      limit: RATE_LIMIT_MAX_PER_WINDOW,
      retryAfterSec,
      error: true,
    };
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
 * Position of a claimed row within the current UTC month, oldest = 1.
 *
 * Used instead of "count everything again and compare to the limit": when two
 * requests race at the quota boundary, re-counting makes BOTH see a total over
 * the limit and BOTH roll back, so a slot that existed is wasted. Ranking is
 * decided per row (ids are monotonic), so the earlier claim keeps the slot and
 * only the later one is rejected.
 *
 * @returns {Promise<number>} rank ≥ 1, or 0 when the row is gone
 */
export async function getUserUsageRank(env, googleSub, usageId) {
  if (!usageId) return 0;
  const db = ensureDb(env);
  const { start, end } = monthRange();
  const row = await db
    .prepare(
      `SELECT COUNT(*) AS rank
       FROM usage_logs
       WHERE google_sub = ?
         AND action = 'remove_bg'
         AND created_at >= ?
         AND created_at < ?
         AND id <= ?`
    )
    .bind(googleSub, start, end, usageId)
    .first();

  return Number(row?.rank || 0);
}

/**
 * Ranks for a guest claim: the cookie row against the guest plan limit, and
 * the IP mirror row against GUEST_IP_MONTHLY_LIMIT. One round trip.
 *
 * @returns {Promise<{ cookieRank: number, ipRank: number }>}
 */
export async function getGuestUsageRanks(env, { guestKey, clientIp, guestLogId, ipLogId }) {
  const db = ensureDb(env);
  const { start, end } = monthRange();

  const rankSql = `SELECT COUNT(*) FROM guest_usage_logs
                    WHERE guest_key = ? AND action = 'remove_bg'
                      AND created_at >= ? AND created_at < ? AND id <= ?`;

  if (!ipLogId) {
    const row = await db
      .prepare(`SELECT (${rankSql}) AS cookie_rank`)
      .bind(guestKey, start, end, guestLogId)
      .first();
    return { cookieRank: Number(row?.cookie_rank || 0), ipRank: 0 };
  }

  const row = await db
    .prepare(`SELECT (${rankSql}) AS cookie_rank, (${rankSql}) AS ip_rank`)
    .bind(guestKey, start, end, guestLogId, ipGuestKey(clientIp), start, end, ipLogId)
    .first();

  return {
    cookieRank: Number(row?.cookie_rank || 0),
    ipRank: Number(row?.ip_rank || 0),
  };
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

/**
 * Pre-claim guest cookie (+ optional IP) slots before upstream.
 * @returns {{ guestLogId: number, ipLogId: number|null }}
 */
export async function claimGuestUsage(env, { guestKey, sourceFilename = null, clientIp = null }) {
  const db = ensureDb(env);
  const now = new Date().toISOString();
  const insertSql = `INSERT INTO guest_usage_logs (guest_key, action, source_filename, created_at)
                     VALUES (?, 'remove_bg', ?, ?)`;

  const statements = [db.prepare(insertSql).bind(guestKey, sourceFilename, now)];
  const writesIpRow = Boolean(clientIp && clientIp !== "unknown");
  if (writesIpRow) {
    statements.push(db.prepare(insertSql).bind(ipGuestKey(clientIp), sourceFilename, now));
  }

  // Cookie row + IP mirror row in one round trip
  const results = await db.batch(statements);

  const guestLogId = Number(results?.[0]?.meta?.last_row_id || 0);
  if (!guestLogId) {
    throw new Error("Failed to claim guest usage (no row id)");
  }

  const ipLogId = writesIpRow ? Number(results?.[1]?.meta?.last_row_id || 0) || null : null;

  return { guestLogId, ipLogId };
}

export async function rollbackGuestUsage(env, { guestLogId = null, ipLogId = null } = {}) {
  const db = ensureDb(env);
  const ids = [guestLogId, ipLogId].filter(Boolean);
  if (!ids.length) return;

  await db.batch(
    ids.map((id) => db.prepare(`DELETE FROM guest_usage_logs WHERE id = ?`).bind(id))
  );
}
