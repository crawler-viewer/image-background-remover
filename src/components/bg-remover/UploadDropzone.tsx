"use client";

import type { ChangeEvent, DragEvent, RefObject } from "react";
import LimitUpsell from "@/components/LimitUpsell";
import { MAX_BATCH_SIZE } from "@/lib/plan-limits";
import type { LimitErrorInfo } from "@/lib/bg-remover/types";

type Props = {
  dragOver: boolean;
  /** Quota exhausted — clicking/keyboard should not open the picker */
  blocked: boolean;
  maxFileSizeMb: number;
  error: string;
  limitError: LimitErrorInfo | null;
  showError: boolean;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onDragOverChange: (over: boolean) => void;
  onDrop: (e: DragEvent) => void;
  onFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
};

export default function UploadDropzone({
  dragOver,
  blocked,
  maxFileSizeMb,
  error,
  limitError,
  showError,
  fileInputRef,
  onDragOverChange,
  onDrop,
  onFileChange,
}: Props) {
  const openPicker = () => {
    if (!blocked) fileInputRef.current?.click();
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openPicker();
        }
      }}
      onDragOver={(e) => {
        e.preventDefault();
        onDragOverChange(true);
      }}
      onDragLeave={() => onDragOverChange(false)}
      onDrop={onDrop}
      onClick={openPicker}
      className={`group relative flex min-h-[260px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-10 text-center transition-all duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 md:min-h-[280px] md:p-14 ${
        dragOver
          ? "scale-[1.01] border-emerald-500 bg-emerald-50/80"
          : "border-neutral-300 bg-stone-50/80 hover:border-neutral-400 hover:bg-stone-100/80"
      }`}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        multiple
        onChange={onFileChange}
        className="hidden"
      />

      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-black/8 bg-white shadow-sm transition-transform duration-300 group-hover:scale-105">
        <svg
          className="h-7 w-7 text-neutral-500 group-hover:text-neutral-800"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
          />
        </svg>
      </div>

      <p className="mb-2 text-lg font-semibold text-neutral-900 md:text-xl">
        Drop images here or{" "}
        <span className="text-emerald-700 underline decoration-emerald-700/30 underline-offset-4">
          browse
        </span>
      </p>
      <p className="text-sm text-neutral-600">
        PNG, JPG, WebP — up to {maxFileSizeMb}MB each · batch up to {MAX_BATCH_SIZE}
      </p>
      <p className="mt-2 text-xs text-neutral-500">
        Drop, browse, or paste (Ctrl/⌘+V) · each success uses 1 removal
      </p>
      <p className="mt-4 max-w-sm text-[11px] leading-relaxed text-neutral-400">
        Images are processed in real time and not stored on our servers. Commercial use OK.
      </p>

      {showError && error && !limitError && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {showError && limitError && (
        <LimitUpsell
          className="mt-5 w-full max-w-md"
          message={limitError.message}
          loggedIn={limitError.loggedIn}
          source="limit_cta_upload"
        />
      )}
    </div>
  );
}
