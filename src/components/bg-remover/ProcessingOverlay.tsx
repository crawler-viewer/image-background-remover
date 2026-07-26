"use client";

import type { BatchItem } from "@/lib/bg-remover/types";

type Props = {
  item: BatchItem;
  processingTime: number;
  isBatch: boolean;
  batchEta: string;
  doneCount: number;
  totalCount: number;
  onCancel: () => void;
};

export default function ProcessingOverlay({
  item,
  processingTime,
  isBatch,
  batchEta,
  doneCount,
  totalCount,
  onCancel,
}: Props) {
  return (
    <div className="py-4 text-center">
      <div className="relative mb-4 inline-block overflow-hidden rounded-2xl border border-black/8">
        <img src={item.originalUrl} alt="Processing" className="max-h-80 opacity-40" />
        <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-[2px]">
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-black/8 bg-white/95 px-6 py-5 shadow-lg">
            <div className="relative h-12 w-12">
              <div className="absolute inset-0 rounded-full border-4 border-stone-200" />
              <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-neutral-900">Removing background…</p>
              <p className="mt-1 max-w-[240px] truncate text-xs text-neutral-500">
                {item.file.name}
                {processingTime > 0 && ` · ${processingTime}s`}
              </p>
              {isBatch && batchEta && (
                <p className="mt-1 text-xs font-medium text-emerald-700">
                  {doneCount}/{totalCount} done · {batchEta}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
      <button
        type="button"
        onClick={onCancel}
        className="text-sm text-neutral-500 underline-offset-2 hover:text-neutral-900 hover:underline"
      >
        Cancel batch
      </button>
    </div>
  );
}
