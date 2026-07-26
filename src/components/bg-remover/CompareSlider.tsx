"use client";

import type { RefObject } from "react";
import { formatFileSize } from "@/lib/bg-remover/format";
import type { BatchItem } from "@/lib/bg-remover/types";

type Props = {
  item: BatchItem & { resultUrl: string };
  sliderPos: number;
  containerRef: RefObject<HTMLDivElement | null>;
  /** Start dragging from a mouse/touch x position */
  onGrab: (clientX: number) => void;
};

/** Before/after wipe slider for one finished image. */
export default function CompareSlider({ item, sliderPos, containerRef, onGrab }: Props) {
  return (
    <>
      <div
        ref={containerRef}
        className="relative cursor-col-resize select-none overflow-hidden rounded-2xl border border-black/10 shadow-[0_16px_40px_rgba(15,23,42,0.08)]"
        onMouseDown={(e) => onGrab(e.clientX)}
        onTouchStart={(e) => onGrab(e.touches[0].clientX)}
      >
        <div
          className="relative"
          style={{
            background:
              "repeating-conic-gradient(#e7e5e4 0% 25%, #f5f5f4 0% 50%) 50% / 16px 16px",
          }}
        >
          <img
            src={item.resultUrl}
            alt="Background removed result"
            className="block w-full"
            draggable={false}
          />
        </div>

        <div
          className="pointer-events-none absolute inset-0 overflow-hidden"
          style={{ width: `${sliderPos}%` }}
        >
          <img
            src={item.originalUrl}
            alt="Original image"
            className="block h-full object-cover"
            style={{ width: `${containerRef.current?.offsetWidth || 9999}px` }}
            draggable={false}
          />
        </div>

        <div
          className="pointer-events-none absolute bottom-0 top-0 w-0.5 bg-white shadow"
          style={{ left: `${sliderPos}%`, transform: "translateX(-50%)" }}
        >
          <div className="pointer-events-auto absolute left-1/2 top-1/2 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 cursor-col-resize items-center justify-center rounded-full border border-black/10 bg-white shadow-md transition-transform hover:scale-110">
            <svg
              className="h-5 w-5 text-neutral-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l-3 3 3 3m8-6l3 3-3 3" />
            </svg>
          </div>
        </div>

        <div className="pointer-events-none absolute left-3 top-3 rounded-lg bg-black/65 px-3 py-1.5 text-xs font-medium text-white">
          Original
        </div>
        <div className="pointer-events-none absolute right-3 top-3 rounded-lg bg-black/65 px-3 py-1.5 text-xs font-medium text-white">
          Removed
        </div>
      </div>

      <p className="text-center text-xs text-neutral-500">
        Drag the slider to compare · {item.file.name} · {formatFileSize(item.file.size)}
        {item.processingSec ? ` · ${item.processingSec}s` : ""}
      </p>
    </>
  );
}
