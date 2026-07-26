/** Pure formatting helpers for the background-removal tool. */
import type { ItemStatus } from "./types";

export function baseName(file: File | null | undefined): string {
  if (!file) return "removed-bg";
  return file.name.replace(/\.[^.]+$/, "") || "removed-bg";
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function statusLabel(status: ItemStatus): string {
  switch (status) {
    case "queued":
      return "Queued";
    case "processing":
      return "Processing";
    case "done":
      return "Done";
    case "error":
      return "Failed";
    case "skipped":
      return "Skipped";
    default:
      return status;
  }
}

/** Fallback seconds/image before the first sample lands. */
export const DEFAULT_SEC_PER_IMAGE = 8;

/** Human ETA from remaining jobs × average seconds per job. */
export function formatEta(remainingJobs: number, avgSec: number, currentElapsed = 0): string {
  if (remainingJobs <= 0) return "";
  const secPer = avgSec > 0 ? avgSec : DEFAULT_SEC_PER_IMAGE;
  // Current job: remaining portion of avg (floor at 0)
  const currentLeft = Math.max(0, secPer - currentElapsed);
  const queuedLeft = Math.max(0, remainingJobs - 1) * secPer;
  const total = Math.round(currentLeft + queuedLeft);
  if (total < 5) return "a few seconds";
  if (total < 60) return `~${total}s left`;
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  if (mins < 3 && secs > 0) return `~${mins}m ${secs}s left`;
  if (secs < 15) return `~${mins} min left`;
  return `~${mins + 1} min left`;
}

export function planLabel(plan: string | undefined): string {
  switch (plan) {
    case "guest":
      return "Guest";
    case "free":
      return "Free";
    case "pro":
      return "Pro";
    case "business":
      return "Business";
    default:
      return "—";
  }
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(() => resolve(), ms));
}
