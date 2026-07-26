"use client";

type Props = {
  message: string;
  retryableCount: number;
  onRetryThis: () => void;
  onRetryAll: () => void;
  onReset: () => void;
};

/** Shown when the selected thumbnail is a failed item. */
export default function FailedItemPanel({
  message,
  retryableCount,
  onRetryThis,
  onRetryAll,
  onReset,
}: Props) {
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center">
      <p className="text-sm text-amber-900">{message}</p>
      <p className="mt-2 text-xs text-amber-800/80">
        Retry this file, retry all failed, or select a successful thumbnail above.
      </p>
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        <button
          type="button"
          onClick={onRetryThis}
          className="rounded-xl border border-amber-400 bg-white px-5 py-2 text-sm font-medium text-amber-950 hover:bg-amber-100"
        >
          Retry this image
        </button>
        {retryableCount > 1 && (
          <button
            type="button"
            onClick={onRetryAll}
            className="rounded-xl border border-amber-300 bg-white px-5 py-2 text-sm font-medium text-amber-950 hover:bg-amber-50"
          >
            Retry all failed ({retryableCount})
          </button>
        )}
        <button
          type="button"
          onClick={onReset}
          className="rounded-xl border border-black/10 bg-white px-5 py-2 text-sm text-neutral-800"
        >
          New images
        </button>
      </div>
    </div>
  );
}
