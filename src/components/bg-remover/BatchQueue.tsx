"use client";

import { statusLabel } from "@/lib/bg-remover/format";
import { deriveQuotaView } from "@/lib/bg-remover/quota-view";
import type { BatchItem, QuotaInfo, Stage } from "@/lib/bg-remover/types";

type Props = {
  items: BatchItem[];
  activeId: string | null;
  stage: Stage;
  doneCount: number;
  failCount: number;
  processingTime: number;
  batchEta: string;
  avgSec: number;
  quota: QuotaInfo | null;
  /** Transient notice (rate-limit wait, partial validation) while processing */
  error: string;
  onSelect: (id: string) => void;
};

/** Progress header + thumbnail strip for the current batch. */
export default function BatchQueue({
  items,
  activeId,
  stage,
  doneCount,
  failCount,
  processingTime,
  batchEta,
  avgSec,
  quota,
  error,
  onSelect,
}: Props) {
  const view = deriveQuotaView(quota);
  const settled = doneCount + failCount;
  const progressPercent = Math.max(
    0,
    Math.min(100, (settled / Math.max(1, items.length)) * 100)
  );

  return (
    <>
      <div className="rounded-xl border border-black/8 bg-stone-50 px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <div className="text-neutral-700">
            {stage === "processing" ? (
              <>
                Processing{" "}
                <span className="font-semibold text-neutral-950">
                  {items.findIndex((i) => i.status === "processing") + 1 || doneCount + 1}
                </span>{" "}
                of <span className="font-semibold text-neutral-950">{items.length}</span>
                {processingTime > 0 && (
                  <span className="text-neutral-500"> · {processingTime}s this image</span>
                )}
                {batchEta && <span className="text-neutral-500"> · {batchEta}</span>}
                {doneCount > 0 && (
                  <span className="text-neutral-500"> · avg {Math.round(avgSec)}s/image</span>
                )}
              </>
            ) : (
              <>
                <span className="font-semibold text-emerald-700">{doneCount}</span> done
                {failCount > 0 && (
                  <>
                    {" · "}
                    <span className="font-semibold text-amber-700">{failCount}</span>{" "}
                    failed/skipped
                  </>
                )}
                {" · "}
                {items.length} total
              </>
            )}
          </div>
          {quota && (
            <span className="text-xs text-neutral-500">
              {quota.remaining}/{quota.limit} plan
              {quota.loggedIn ? ` · ${view.creditBalance} credits` : ""}
              {view.usingCreditsNext ? " · next: 1 credit" : ""}
            </span>
          )}
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-stone-200">
          <div
            className="h-full bg-emerald-500 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        {error && stage === "processing" && <p className="mt-2 text-xs text-amber-700">{error}</p>}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {items.map((item) => {
          const selected = item.id === activeId;
          return (
            <button
              key={item.id}
              type="button"
              aria-label={`${item.file.name} — ${statusLabel(item.status)}`}
              onClick={() => {
                if (item.status === "done" || stage !== "processing") onSelect(item.id);
              }}
              className={`relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl border transition-all ${
                selected
                  ? "border-emerald-600 ring-2 ring-emerald-600/25"
                  : "border-black/10 hover:border-black/20"
              }`}
            >
              <img
                src={item.thumbUrl || item.resultUrl || item.originalUrl}
                alt=""
                className="h-full w-full object-cover"
                loading="lazy"
              />
              <span
                className={`absolute inset-x-0 bottom-0 px-0.5 py-0.5 text-center text-[9px] font-medium ${
                  item.status === "done"
                    ? "bg-emerald-600 text-white"
                    : item.status === "processing"
                      ? "bg-sky-600 text-white"
                      : item.status === "error" || item.status === "skipped"
                        ? "bg-amber-600 text-white"
                        : "bg-neutral-800/80 text-white"
                }`}
              >
                {statusLabel(item.status)}
              </span>
            </button>
          );
        })}
      </div>
    </>
  );
}
