"use client";

import LimitUpsell from "@/components/LimitUpsell";
import type { LimitErrorInfo } from "@/lib/bg-remover/types";

type Props = {
  error: string;
  limitError: LimitErrorInfo | null;
  retryableCount: number;
  onRetryAll: () => void;
  onReset: () => void;
};

/** Shown when the whole batch failed (nothing succeeded). */
export default function BatchErrorPanel({
  error,
  limitError,
  retryableCount,
  onRetryAll,
  onReset,
}: Props) {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
      {!limitError && <p className="text-sm text-red-800">{error || "Batch failed."}</p>}
      {limitError && (
        <LimitUpsell
          className="mx-auto max-w-md text-left"
          message={limitError.message}
          loggedIn={limitError.loggedIn}
          source="limit_cta_batch_error"
        />
      )}
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {retryableCount > 0 && !limitError && (
          <button
            type="button"
            onClick={onRetryAll}
            className="rounded-xl bg-neutral-950 px-5 py-2 text-sm font-medium text-white hover:bg-neutral-800"
          >
            Retry failed ({retryableCount})
          </button>
        )}
        <button
          type="button"
          onClick={onReset}
          className="text-sm text-neutral-600 underline-offset-2 hover:underline"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
