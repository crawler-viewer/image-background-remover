/**
 * Short-window rate limit + batch client pacing.
 * Backend: functions/api/usage.js
 * Frontend: src/lib/rate-limit.ts, BgRemover batch loop
 */

/** Sliding window for /api/remove-bg (per IP). */
export const RATE_LIMIT_WINDOW_MS = 60_000;
export const RATE_LIMIT_MAX_PER_WINDOW = 12;
export const RATE_LIMIT_ACTION = "remove_bg";

/**
 * Min pause between batch jobs so a single client stays under the IP window
 * (window / max ≈ 5s). Server still enforces the hard cap.
 */
export const BATCH_MIN_GAP_MS = Math.ceil(
  RATE_LIMIT_WINDOW_MS / Math.max(1, RATE_LIMIT_MAX_PER_WINDOW)
);

/** How many times the batch UI auto-retries after RATE_LIMITED. */
export const BATCH_RATE_LIMIT_MAX_RETRIES = 3;

/** Cap wait time for Retry-After (seconds). */
export const BATCH_RETRY_AFTER_MAX_SEC = 90;

/**
 * Resolve wait seconds from JSON body and/or Retry-After header.
 * @param {{ headerValue?: string|null, bodyRetryAfterSec?: number|null, fallback?: number, max?: number }} opts
 */
export function parseRetryAfterSec(opts = {}) {
  const fallback = opts.fallback ?? 60;
  const max = opts.max ?? BATCH_RETRY_AFTER_MAX_SEC;
  let sec = fallback;

  if (opts.bodyRetryAfterSec != null && opts.bodyRetryAfterSec !== "") {
    const n = Number(opts.bodyRetryAfterSec);
    if (Number.isFinite(n) && n >= 0) sec = n;
  }

  if (opts.headerValue != null && opts.headerValue !== "") {
    const n = Number(opts.headerValue);
    // Support numeric Retry-After only (HTTP-date is rare here)
    if (Number.isFinite(n) && n >= 0) sec = n;
  }

  return Math.min(max, Math.max(1, Math.ceil(sec)));
}

export default {
  RATE_LIMIT_WINDOW_MS,
  RATE_LIMIT_MAX_PER_WINDOW,
  RATE_LIMIT_ACTION,
  BATCH_MIN_GAP_MS,
  BATCH_RATE_LIMIT_MAX_RETRIES,
  BATCH_RETRY_AFTER_MAX_SEC,
  parseRetryAfterSec,
};
