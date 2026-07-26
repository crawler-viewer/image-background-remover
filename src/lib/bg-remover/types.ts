/** Shared types for the background-removal tool (component + helpers). */

export type Stage = "idle" | "processing" | "done" | "error";

export type ItemStatus = "queued" | "processing" | "done" | "error" | "skipped";

/** Canvas size for solid-background product exports. */
export type CanvasSize = "original" | "1000" | "1600" | "2000";

export type QuotaInfo = {
  plan: string;
  used: number;
  limit: number;
  remaining: number;
  credits?: number;
  maxFileSizeMb: number;
  loggedIn: boolean;
};

export type LimitErrorInfo = {
  message: string;
  code?: string;
  loggedIn: boolean;
};

export type BatchItem = {
  id: string;
  file: File;
  originalUrl: string;
  /** Small JPEG for strip preview — keeps memory down on large batches */
  thumbUrl: string | null;
  resultUrl: string | null;
  status: ItemStatus;
  error?: string;
  processingSec?: number;
};

export type ZipProgress = {
  label: string;
  current: number;
  total: number;
} | null;

/** Result of one `/api/remove-bg` attempt. */
export type RemovalResult =
  | { ok: true; resultUrl: string; processingSec: number }
  | {
      ok: false;
      error: string;
      limit?: LimitErrorInfo;
      /** Stop the rest of the batch (quota / budget exhausted) */
      hardStop?: boolean;
      /** Caller may wait `retryAfterSec` and try the same file again */
      rateLimited?: boolean;
      retryAfterSec?: number;
    };
