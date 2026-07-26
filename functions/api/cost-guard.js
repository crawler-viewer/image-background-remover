/**
 * Optional global daily cap on successful/claimed remove-bg rows (UTC day).
 * Protects upstream Clipdrop/Remove.bg spend when traffic spikes.
 *
 * Env:
 * - DAILY_UPSTREAM_LIMIT — max claimed removals per UTC day (0/empty = disabled)
 * - UPSTREAM_COST_USD — optional estimated USD per image for logs (default 0.04)
 */
import { EXCLUDE_IP_MIRROR_SQL } from "./guest-usage-sql.js";

/**
 * @param {Date} [now]
 * @returns {{ start: string, end: string }}
 */
export function dayRangeUtc(now = new Date()) {
  const start = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0)
  );
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start: start.toISOString(), end: end.toISOString() };
}

/**
 * @param {{ DAILY_UPSTREAM_LIMIT?: string|number }} env
 * @returns {number} 0 means disabled
 */
export function getDailyUpstreamLimit(env) {
  const raw = env?.DAILY_UPSTREAM_LIMIT;
  if (raw === undefined || raw === null || raw === "") return 0;
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.floor(n);
}

/**
 * @param {{ UPSTREAM_COST_USD?: string|number }} env
 */
export function getUpstreamCostUsd(env) {
  const raw = env?.UPSTREAM_COST_USD;
  if (raw === undefined || raw === null || raw === "") return 0.04;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : 0.04;
}

/**
 * Count claimed removals today (login usage + guest cookie keys, not IP mirror rows).
 * @param {{ DB: D1Database }} env
 * @param {Date} [now]
 */
export async function getDailyUpstreamUsage(env, now = new Date()) {
  if (!env?.DB) throw new Error("Missing D1 binding: DB");
  const { start, end } = dayRangeUtc(now);

  // One round trip: logged-in rows + guest cookie rows (mirror rows excluded)
  const row = await env.DB
    .prepare(
      `SELECT
         (SELECT COUNT(*)
            FROM usage_logs
           WHERE action = 'remove_bg'
             AND created_at >= ?
             AND created_at < ?)
       + (SELECT COUNT(*)
            FROM guest_usage_logs
           WHERE action = 'remove_bg'
             AND ${EXCLUDE_IP_MIRROR_SQL}
             AND created_at >= ?
             AND created_at < ?) AS count`
    )
    .bind(start, end, start, end)
    .first();

  return Number(row?.count || 0);
}

/**
 * @param {{ DB?: D1Database, DAILY_UPSTREAM_LIMIT?: string|number }} env
 * @param {Date} [now]
 * @returns {Promise<{
 *   allowed: boolean,
 *   disabled: boolean,
 *   used: number|null,
 *   limit: number|null,
 *   remaining: number|null,
 *   error?: boolean
 * }>}
 */
export async function assertDailyUpstreamBudget(env, now = new Date()) {
  const limit = getDailyUpstreamLimit(env);
  if (limit <= 0) {
    return {
      allowed: true,
      disabled: true,
      used: null,
      limit: null,
      remaining: null,
    };
  }

  try {
    const used = await getDailyUpstreamUsage(env, now);
    const remaining = Math.max(0, limit - used);
    return {
      allowed: used < limit,
      disabled: false,
      used,
      limit,
      remaining,
    };
  } catch (err) {
    // Budget is configured — fail closed so a DB blip cannot open unlimited spend
    console.error(
      JSON.stringify({
        ts: new Date().toISOString(),
        level: "error",
        event: "daily_budget_check_failed",
        error: String(err?.message || err),
      })
    );
    return {
      allowed: false,
      disabled: false,
      used: null,
      limit,
      remaining: 0,
      error: true,
    };
  }
}
