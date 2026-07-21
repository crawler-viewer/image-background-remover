/**
 * Frontend rate-limit + batch pacing — shared/rate-limit.js
 */

import {
  RATE_LIMIT_WINDOW_MS as WINDOW_RAW,
  RATE_LIMIT_MAX_PER_WINDOW as MAX_RAW,
  BATCH_MIN_GAP_MS as GAP_RAW,
  BATCH_RATE_LIMIT_MAX_RETRIES as RETRIES_RAW,
  BATCH_RETRY_AFTER_MAX_SEC as MAX_SEC_RAW,
  parseRetryAfterSec as parseRetryAfterSecRaw,
} from "../../shared/rate-limit.js";

export const RATE_LIMIT_WINDOW_MS = WINDOW_RAW as number;
export const RATE_LIMIT_MAX_PER_WINDOW = MAX_RAW as number;
export const BATCH_MIN_GAP_MS = GAP_RAW as number;
export const BATCH_RATE_LIMIT_MAX_RETRIES = RETRIES_RAW as number;
export const BATCH_RETRY_AFTER_MAX_SEC = MAX_SEC_RAW as number;

export function parseRetryAfterSec(opts: {
  headerValue?: string | null;
  bodyRetryAfterSec?: number | null;
  fallback?: number;
  max?: number;
}): number {
  return parseRetryAfterSecRaw(opts) as number;
}
