/**
 * How many of the selected files may actually be sent, given the batch cap and
 * the quota/credits the server last reported.
 *
 * Pure — the numbers come from `shared/plan-limits.js` via the caller.
 */
import type { QuotaInfo } from "./types";

export type BatchAllowance =
  | { allowed: false; message: string; code: string; loggedIn: boolean }
  | { allowed: true; count: number; notice: string | null };

export function resolveBatchAllowance(opts: {
  quota: QuotaInfo | null;
  fileCount: number;
  maxBatchSize: number;
}): BatchAllowance {
  const { quota, fileCount, maxBatchSize } = opts;

  const credits = quota?.credits ? Number(quota.credits) : 0;
  // Unknown quota → let the batch cap decide; the server still enforces the truth
  const available = (quota?.remaining ?? maxBatchSize) + credits;

  if (available <= 0) {
    const loggedIn = !!quota?.loggedIn;
    return {
      allowed: false,
      loggedIn,
      code: loggedIn ? "MONTHLY_LIMIT_REACHED" : "GUEST_MONTHLY_LIMIT_REACHED",
      message: loggedIn
        ? "Monthly limit reached. Buy credits or upgrade your plan."
        : "Guest monthly limit reached. Sign in to unlock more removals.",
    };
  }

  let count = Math.min(fileCount, maxBatchSize);
  let notice: string | null =
    fileCount > maxBatchSize
      ? `Only the first ${maxBatchSize} images will be processed in this batch.`
      : null;

  // Quota notice is the more specific one, so it replaces the batch-cap notice
  if (available < count) {
    count = Math.max(1, available);
    notice =
      `You have ${available} removal${available === 1 ? "" : "s"} left — ` +
      `processing ${count} image${count === 1 ? "" : "s"}.`;
  }

  return { allowed: true, count, notice };
}
