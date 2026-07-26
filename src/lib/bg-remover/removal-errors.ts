/**
 * Maps a failed `/api/remove-bg` response to what the UI should do:
 * retry after a wait, stop the whole batch, or just mark this file failed.
 *
 * Pure so the branch table can be tested directly — it decides whether a paying
 * user's batch keeps going, so a wrong branch is expensive.
 */
import { parseRetryAfterSec } from "@/lib/rate-limit";
import type { AnalyticsParams } from "@/lib/analytics";
import type { RemovalResult } from "./types";

export type RemovalErrorBody = {
  error?: string;
  code?: string;
  plan?: string;
  retryAfterSec?: number;
};

export type MappedRemovalFailure = {
  result: Extract<RemovalResult, { ok: false }>;
  analytics: { event: string; params: AnalyticsParams };
};

export function mapRemovalFailure(opts: {
  status: number;
  data: RemovalErrorBody;
  retryAfterHeader?: string | null;
  planHint: string;
}): MappedRemovalFailure {
  const { status, data, retryAfterHeader = null, planHint } = opts;

  if (status === 429) {
    const code = data.code || "MONTHLY_LIMIT_REACHED";

    // Short-window burst limit or upstream busy — caller may wait + retry
    if (code === "RATE_LIMITED" || code === "UPSTREAM_RATE_LIMITED") {
      const retryAfter = parseRetryAfterSec({
        headerValue: retryAfterHeader,
        bodyRetryAfterSec: data.retryAfterSec,
        fallback: code === "UPSTREAM_RATE_LIMITED" ? 30 : 60,
      });
      return {
        result: {
          ok: false,
          error: data.error || `Too many requests. Waiting ${retryAfter}s before continuing…`,
          hardStop: false,
          rateLimited: true,
          retryAfterSec: retryAfter,
        },
        analytics: {
          event: "remove_error",
          params: { reason: "rate_limited", batch: true, code, retry_after: retryAfter },
        },
      };
    }

    const isGuest =
      code === "GUEST_MONTHLY_LIMIT_REACHED" ||
      code === "GUEST_IP_LIMIT_REACHED" ||
      data.plan === "guest";
    const message =
      data.error ||
      (code === "GUEST_IP_LIMIT_REACHED"
        ? "Too many free removals from this network this month. Sign in to continue."
        : isGuest
          ? "Guest monthly limit reached. Sign in to unlock more removals."
          : "Monthly limit reached. Buy credits or upgrade your plan.");

    return {
      result: {
        ok: false,
        error: message,
        hardStop: true,
        limit: { message, code, loggedIn: !isGuest },
      },
      analytics: {
        event: "limit_reached",
        params: { plan: data.plan || planHint, code, batch: true },
      },
    };
  }

  if (data.code === "DAILY_BUDGET_EXCEEDED") {
    return {
      result: {
        ok: false,
        error: data.error || "Service is at capacity for today. Please try again tomorrow.",
        hardStop: true,
      },
      analytics: { event: "remove_error", params: { reason: "daily_budget", batch: true } },
    };
  }

  return {
    result: {
      ok: false,
      error: data.error || `Server error (${status}). Please try again.`,
    },
    analytics: { event: "remove_error", params: { reason: "server", batch: true } },
  };
}
