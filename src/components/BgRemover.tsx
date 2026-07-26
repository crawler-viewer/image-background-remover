"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { trackEvent } from "@/lib/analytics";
import { downloadZipBlob } from "@/lib/zip-download";
import { createThumbnailUrl } from "@/lib/image-thumb";
import LimitUpsell from "@/components/LimitUpsell";
import { MAX_BATCH_SIZE, getPlanLimits } from "@/lib/plan-limits";
import {
  BATCH_MIN_GAP_MS,
  BATCH_RATE_LIMIT_MAX_RETRIES,
  parseRetryAfterSec,
} from "@/lib/rate-limit";
import { resolveWhiteExportSize, sizeSlug, solidColorSlug } from "@/lib/bg-remover/canvas";
import { parseExportDeepLink } from "@/lib/bg-remover/deep-link";
import {
  downloadBlob,
  exportSolidBackgroundJpeg,
  fetchResultBlob,
} from "@/lib/bg-remover/export-image";
import {
  DEFAULT_SEC_PER_IMAGE,
  baseName,
  formatEta,
  formatFileSize,
  sleep,
} from "@/lib/bg-remover/format";
import { mapRemovalFailure, type RemovalErrorBody } from "@/lib/bg-remover/removal-errors";
import { resolveBatchAllowance } from "@/lib/bg-remover/batch-allowance";
import { deriveQuotaView } from "@/lib/bg-remover/quota-view";
import { buildBatchZip } from "@/lib/bg-remover/zip-batch";
import type {
  BatchItem,
  CanvasSize,
  LimitErrorInfo,
  QuotaInfo,
  RemovalResult,
  Stage,
  ZipProgress,
} from "@/lib/bg-remover/types";
import QuotaBar from "@/components/bg-remover/QuotaBar";
import UploadDropzone from "@/components/bg-remover/UploadDropzone";
import BatchQueue from "@/components/bg-remover/BatchQueue";
import ProcessingOverlay from "@/components/bg-remover/ProcessingOverlay";
import CompareSlider from "@/components/bg-remover/CompareSlider";
import ResultActions from "@/components/bg-remover/ResultActions";
import ExportOptions from "@/components/bg-remover/ExportOptions";
import BatchZipMenu from "@/components/bg-remover/BatchZipMenu";
import FailedItemPanel from "@/components/bg-remover/FailedItemPanel";
import BatchErrorPanel from "@/components/bg-remover/BatchErrorPanel";

const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
const REQUEST_TIMEOUT_MS = 30_000;
/** Rolling window of per-image durations used for the batch ETA. */
const ETA_SAMPLE_SIZE = 12;

export default function BgRemover() {
  const [stage, setStage] = useState<Stage>("idle");
  const [items, setItems] = useState<BatchItem[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [error, setError] = useState<string>("");
  const [limitError, setLimitError] = useState<LimitErrorInfo | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [sliderPos, setSliderPos] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [processingTime, setProcessingTime] = useState(0);
  const [quota, setQuota] = useState<QuotaInfo | null>(null);
  const [exportingSolid, setExportingSolid] = useState(false);
  const [bgColor, setBgColor] = useState("#FFFFFF");
  const [canvasSize, setCanvasSize] = useState<CanvasSize>("original");
  const [copyState, setCopyState] = useState<"idle" | "ok" | "err">("idle");
  const [batchDownloading, setBatchDownloading] = useState(false);
  const [showBatchMenu, setShowBatchMenu] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [zipProgress, setZipProgress] = useState<ZipProgress>(null);
  /** Prefer Amazon-ready white JPG when opened via ?export=white deep link */
  const [preferWhiteExport, setPreferWhiteExport] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const abortRef = useRef(false);
  /** Rolling average seconds per successful removal (for batch ETA). */
  const avgSecRef = useRef(DEFAULT_SEC_PER_IMAGE);
  const completedSecSamples = useRef<number[]>([]);

  const activeItem = items.find((i) => i.id === activeId) || null;
  const doneCount = items.filter((i) => i.status === "done").length;
  const failCount = items.filter((i) => i.status === "error" || i.status === "skipped").length;
  const retryableCount = items.filter(
    (i) => (i.status === "error" || i.status === "skipped") && !i.resultUrl
  ).length;
  const isBatch = items.length > 1;
  const remainingJobs = items.filter(
    (i) => i.status === "queued" || i.status === "processing"
  ).length;
  const batchEta =
    stage === "processing" && remainingJobs > 0
      ? formatEta(remainingJobs, avgSecRef.current, processingTime)
      : "";

  const fetchQuota = useCallback(async () => {
    try {
      const res = await fetch("/api/quota");
      if (res.ok) {
        const data = await res.json();
        setQuota(data);
        return data as QuotaInfo;
      }
    } catch {
      // silently fail
    }
    return null;
  }, []);

  useEffect(() => {
    fetchQuota();
  }, [fetchQuota]);

  // Deep-link: /#tool?export=white&size=2000 (also supports query on pathname)
  useEffect(() => {
    try {
      const link = parseExportDeepLink(window.location.hash || "", window.location.search || "");
      if (link.preferWhiteExport) setPreferWhiteExport(true);
      if (link.bgColor) setBgColor(link.bgColor);
      if (link.canvasSize) setCanvasSize(link.canvasSize);
      if (link.openExportMenu) setShowExportMenu(true);
      if (link.focusTool) {
        requestAnimationFrame(() => {
          document.getElementById("tool")?.scrollIntoView({ behavior: "smooth", block: "start" });
        });
      }
    } catch {
      // ignore malformed URLs
    }
  }, []);

  const revokeAll = useCallback((list: BatchItem[]) => {
    for (const item of list) {
      URL.revokeObjectURL(item.originalUrl);
      if (item.thumbUrl && item.thumbUrl !== item.originalUrl) {
        URL.revokeObjectURL(item.thumbUrl);
      }
      if (item.resultUrl) URL.revokeObjectURL(item.resultUrl);
    }
  }, []);

  useEffect(() => {
    return () => {
      abortRef.current = true;
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Revoke object URLs only when items are replaced/cleared via reset
  const itemsRef = useRef(items);
  itemsRef.current = items;
  useEffect(() => {
    return () => {
      revokeAll(itemsRef.current);
    };
  }, [revokeAll]);

  const reset = useCallback(() => {
    abortRef.current = true;
    if (timerRef.current) clearInterval(timerRef.current);
    revokeAll(items);
    setItems([]);
    setActiveId(null);
    setStage("idle");
    setError("");
    setLimitError(null);
    setSliderPos(50);
    setProcessingTime(0);
    setExportingSolid(false);
    setCopyState("idle");
    setBatchDownloading(false);
    setShowBatchMenu(false);
    setShowExportMenu(false);
    setCanvasSize("original");
    setZipProgress(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    fetchQuota();
  }, [items, revokeAll, fetchQuota]);

  const validateFile = useCallback((file: File, maxMb: number): string | null => {
    const maxBytes = maxMb * 1024 * 1024;
    if (!ALLOWED_TYPES.includes(file.type)) {
      return `Unsupported format: ${file.type || "unknown"}. Use PNG, JPG, or WebP.`;
    }
    if (file.size > maxBytes) {
      return `File too large (${formatFileSize(file.size)}). Max ${maxMb}MB for your plan.`;
    }
    if (file.size < 100) {
      return "File appears to be empty or corrupted.";
    }
    return null;
  }, []);

  const processSingle = useCallback(
    async (file: File, planHint: string): Promise<RemovalResult> => {
      trackEvent("remove_start", {
        plan: planHint,
        file_size_kb: Math.round(file.size / 1024),
        batch: true,
      });

      const startTime = Date.now();
      const formData = new FormData();
      formData.append("image", file);

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

      try {
        const res = await fetch("/api/remove-bg", {
          method: "POST",
          body: formData,
          signal: controller.signal,
        });
        clearTimeout(timeout);

        if (!res.ok) {
          const data = (await res.json().catch(() => ({}))) as RemovalErrorBody;
          const { result, analytics } = mapRemovalFailure({
            status: res.status,
            data,
            retryAfterHeader: res.headers.get("Retry-After"),
            planHint,
          });
          trackEvent(analytics.event, analytics.params);
          return result;
        }

        const blob = await res.blob();
        if (blob.size < 100) {
          trackEvent("remove_error", { reason: "empty", batch: true });
          return { ok: false, error: "Received empty result. Try a different image." };
        }

        const resultUrl = URL.createObjectURL(blob);
        const processingSec = Math.max(1, Math.round((Date.now() - startTime) / 1000));
        trackEvent("remove_success", {
          plan: planHint,
          processing_sec: processingSec,
          file_size_kb: Math.round(file.size / 1024),
          batch: true,
        });
        return { ok: true, resultUrl, processingSec };
      } catch (err: unknown) {
        clearTimeout(timeout);
        if (err instanceof DOMException && err.name === "AbortError") {
          trackEvent("remove_error", { reason: "timeout", batch: true });
          return { ok: false, error: "Request timed out. Try a smaller image." };
        }
        trackEvent("remove_error", { reason: "network", batch: true });
        return {
          ok: false,
          error: err instanceof Error ? err.message : "Something went wrong.",
        };
      }
    },
    []
  );

  const runBatch = useCallback(
    async (batch: BatchItem[]) => {
      abortRef.current = false;
      setStage("processing");
      setError("");
      setLimitError(null);
      setSliderPos(50);

      trackEvent("batch_start", { plan: quota?.plan || "unknown", count: batch.length });

      let success = 0;
      let failed = 0;
      let stoppedForLimit = false;

      for (let i = 0; i < batch.length; i++) {
        if (abortRef.current) break;

        const item = batch[i];
        setActiveId(item.id);
        setProcessingTime(0);

        const startTime = Date.now();
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
          setProcessingTime(Math.floor((Date.now() - startTime) / 1000));
        }, 1000);

        setItems((prev) =>
          prev.map((row) =>
            row.id === item.id ? { ...row, status: "processing" as const, error: undefined } : row
          )
        );

        let result = await processSingle(item.file, quota?.plan || "unknown");

        // Auto wait + retry on RATE_LIMITED / upstream 429 (respect Retry-After)
        let rateRetries = 0;
        while (
          !result.ok &&
          result.rateLimited &&
          rateRetries < BATCH_RATE_LIMIT_MAX_RETRIES &&
          !abortRef.current
        ) {
          rateRetries += 1;
          const waitSec = parseRetryAfterSec({
            bodyRetryAfterSec: result.retryAfterSec,
            fallback: 60,
          });
          setError(
            `Rate limited — waiting ${waitSec}s then retrying (${rateRetries}/${BATCH_RATE_LIMIT_MAX_RETRIES})…`
          );
          await sleep(waitSec * 1000);
          if (abortRef.current) break;
          setError("");
          result = await processSingle(item.file, quota?.plan || "unknown");
        }

        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }

        if (abortRef.current) break;

        if (result.ok) {
          const doneResult = result;
          success += 1;
          // Update rolling average for ETA
          completedSecSamples.current.push(doneResult.processingSec);
          if (completedSecSamples.current.length > ETA_SAMPLE_SIZE) {
            completedSecSamples.current.shift();
          }
          const samples = completedSecSamples.current;
          avgSecRef.current = samples.reduce((a, b) => a + b, 0) / Math.max(1, samples.length);

          // Refresh strip thumb from result (small) so queue doesn't hold huge bitmaps
          let nextThumb = item.thumbUrl;
          try {
            const t = await createThumbnailUrl(doneResult.resultUrl, 160);
            if (item.thumbUrl && item.thumbUrl !== item.originalUrl) {
              URL.revokeObjectURL(item.thumbUrl);
            }
            nextThumb = t;
          } catch {
            /* keep previous thumb */
          }
          setItems((prev) =>
            prev.map((row) =>
              row.id === item.id
                ? {
                    ...row,
                    status: "done" as const,
                    resultUrl: doneResult.resultUrl,
                    thumbUrl: nextThumb,
                    processingSec: doneResult.processingSec,
                  }
                : row
            )
          );
        } else {
          const failResult = result;
          failed += 1;
          setItems((prev) =>
            prev.map((row) =>
              row.id === item.id
                ? {
                    ...row,
                    status: failResult.hardStop ? ("skipped" as const) : ("error" as const),
                    error: failResult.error,
                  }
                : row
            )
          );

          if (failResult.hardStop) {
            stoppedForLimit = true;
            if (failResult.limit) setLimitError(failResult.limit);
            setError(failResult.error);
            // Mark remaining queued items as skipped
            setItems((prev) =>
              prev.map((row) =>
                row.status === "queued"
                  ? {
                      ...row,
                      status: "skipped" as const,
                      error: "Skipped — monthly limit reached.",
                    }
                  : row
              )
            );
            break;
          }
        }

        await fetchQuota();

        // Pace batch jobs under the shared IP short-window (see shared/rate-limit.js)
        if (i < batch.length - 1 && !abortRef.current) {
          await sleep(BATCH_MIN_GAP_MS);
        }
      }

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      await fetchQuota();

      trackEvent("batch_complete", {
        plan: quota?.plan || "unknown",
        success,
        failed,
        total: batch.length,
        limit_stop: stoppedForLimit,
      });

      // Prefer first successful item for the comparison slider
      setItems((prev) => {
        const firstDone = prev.find((row) => row.status === "done");
        if (firstDone) {
          setActiveId(firstDone.id);
          setStage("done");
        } else if (stoppedForLimit) {
          setStage("error");
        } else {
          setStage("error");
          setError((e) => e || "All images failed. Please try again.");
        }
        return prev;
      });
    },
    [processSingle, fetchQuota, quota?.plan]
  );

  const startWithFiles = useCallback(
    async (fileList: FileList | File[]) => {
      const files = Array.from(fileList);
      if (files.length === 0) return;

      const maxMb = quota?.maxFileSizeMb || getPlanLimits("free").maxFileSizeMb;
      const allowance = resolveBatchAllowance({
        quota,
        fileCount: files.length,
        maxBatchSize: MAX_BATCH_SIZE,
      });

      if (!allowance.allowed) {
        setLimitError({
          message: allowance.message,
          code: allowance.code,
          loggedIn: allowance.loggedIn,
        });
        setError(allowance.message);
        setStage("error");
        trackEvent("limit_reached", { plan: quota?.plan || "unknown", code: "precheck" });
        return;
      }

      if (allowance.notice) setError(allowance.notice);
      const selected = files.slice(0, allowance.count);

      const batch: BatchItem[] = [];
      const validationErrors: string[] = [];

      for (const file of selected) {
        const v = validateFile(file, maxMb);
        if (v) {
          validationErrors.push(`${file.name}: ${v}`);
          continue;
        }
        const originalUrl = URL.createObjectURL(file);
        let thumbUrl: string | null = originalUrl;
        try {
          thumbUrl = await createThumbnailUrl(file, 160);
        } catch {
          thumbUrl = originalUrl;
        }
        batch.push({
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          file,
          originalUrl,
          thumbUrl,
          resultUrl: null,
          status: "queued",
        });
      }

      if (batch.length === 0) {
        setError(validationErrors[0] || "No valid images selected.");
        setLimitError(null);
        setStage("error");
        trackEvent("remove_error", { reason: "validation", batch: true });
        return;
      }

      if (validationErrors.length > 0) {
        setError(
          `${validationErrors.length} file${validationErrors.length === 1 ? "" : "s"} skipped (invalid). Processing ${batch.length}.`
        );
      }

      revokeAll(items);
      setItems(batch);
      setActiveId(batch[0].id);
      setLimitError(null);
      await runBatch(batch);
    },
    [quota, validateFile, items, revokeAll, runBatch]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (e.dataTransfer.files?.length) {
        void startWithFiles(e.dataTransfer.files);
      }
    },
    [startWithFiles]
  );

  // Paste image from clipboard when idle (Cmd/Ctrl+V)
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      if (stage !== "idle" && !(stage === "error" && items.length === 0)) return;
      const target = e.target as HTMLElement | null;
      if (target) {
        const tag = target.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || target.isContentEditable) return;
      }
      const files: File[] = [];
      const itemsList = e.clipboardData?.items;
      if (!itemsList) return;
      for (const item of itemsList) {
        if (item.kind === "file" && item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) files.push(file);
        }
      }
      if (files.length === 0) return;
      e.preventDefault();
      trackEvent("paste_upload", { count: files.length });
      void startWithFiles(files);
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [stage, items.length, startWithFiles]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      void startWithFiles(e.target.files);
    }
  };

  const handleDownloadPng = () => {
    if (!activeItem?.resultUrl) return;
    const name = `${baseName(activeItem.file)}-no-bg.png`;
    const a = document.createElement("a");
    a.href = activeItem.resultUrl;
    a.download = name;
    a.click();
    trackEvent("download", { format: "png", plan: quota?.plan || "unknown", batch: isBatch });
  };

  const handleDownloadSolidJpeg = async (
    color = bgColor,
    size: CanvasSize = canvasSize,
    eventLabel?: string
  ) => {
    if (!activeItem?.resultUrl) return;
    setExportingSolid(true);
    try {
      const blob = await exportSolidBackgroundJpeg(activeItem.resultUrl, color, size);
      const cSlug = solidColorSlug(color);
      downloadBlob(blob, `${baseName(activeItem.file)}-${cSlug}-${sizeSlug(size)}.jpg`);
      trackEvent("download", {
        format: eventLabel || "solid_jpeg",
        color: cSlug,
        canvas: size,
        plan: quota?.plan || "unknown",
        batch: isBatch,
      });
      if (cSlug === "white") {
        trackEvent("export_white_jpg", {
          canvas: size,
          plan: quota?.plan || "unknown",
          source: eventLabel || "manual",
        });
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to export solid background.");
      trackEvent("remove_error", { reason: "solid_export" });
    } finally {
      setExportingSolid(false);
    }
  };

  /** One-click Amazon-style pure white square JPG (default 2000²). */
  const handleDownloadAmazonWhite = async () => {
    await handleDownloadSolidJpeg("#FFFFFF", resolveWhiteExportSize(canvasSize), "amazon_white");
  };

  const handleCopyPng = async () => {
    if (!activeItem?.resultUrl) return;
    try {
      if (!navigator.clipboard || typeof ClipboardItem === "undefined") {
        throw new Error("Clipboard image copy is not supported in this browser.");
      }
      const blob = await fetchResultBlob(activeItem.resultUrl);
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      setCopyState("ok");
      trackEvent("copy_result", { format: "png", plan: quota?.plan || "unknown" });
      window.setTimeout(() => setCopyState("idle"), 2000);
    } catch (err: unknown) {
      setCopyState("err");
      setError(err instanceof Error ? err.message : "Could not copy image.");
      window.setTimeout(() => setCopyState("idle"), 2500);
    }
  };

  const handleRetryFailed = async (onlyActive = false) => {
    if (stage === "processing") return;

    let failed = items.filter(
      (i) => (i.status === "error" || i.status === "skipped") && !i.resultUrl
    );
    if (onlyActive && activeItem) {
      failed = failed.filter((i) => i.id === activeItem.id);
    }
    if (failed.length === 0) return;

    trackEvent("batch_retry", {
      count: failed.length,
      only_active: onlyActive,
      plan: quota?.plan || "unknown",
    });

    const retryBatch: BatchItem[] = failed.map((item) => ({
      ...item,
      status: "queued" as const,
      error: undefined,
      resultUrl: null,
    }));

    setItems((prev) =>
      prev.map((row) => {
        const hit = retryBatch.find((r) => r.id === row.id);
        return hit || row;
      })
    );
    setLimitError(null);
    setError("");
    setActiveId(retryBatch[0].id);
    await runBatch(retryBatch);
  };

  /** Items with a usable result, in queue order. */
  const finishedItems = items.filter(
    (i): i is BatchItem & { resultUrl: string } => i.status === "done" && !!i.resultUrl
  );

  const runZipDownload = async (opts: {
    label: string;
    zipName: (count: number) => string;
    toEntry: (item: BatchItem & { resultUrl: string }) => Promise<{ name: string; blob: Blob }>;
    onDone: (count: number) => void;
    failure: string;
  }) => {
    if (finishedItems.length === 0) return;
    setBatchDownloading(true);
    try {
      const zip = await buildBatchZip({
        items: finishedItems,
        label: opts.label,
        toEntry: opts.toEntry,
        onProgress: setZipProgress,
      });
      downloadZipBlob(zip, opts.zipName(finishedItems.length));
      opts.onDone(finishedItems.length);
    } catch {
      setError(opts.failure);
    } finally {
      setBatchDownloading(false);
      setZipProgress(null);
    }
  };

  const handleDownloadAllPng = () =>
    runZipDownload({
      label: "Packing PNG",
      zipName: (count) => `bg-removed-png-${count}.zip`,
      toEntry: async (item) => ({
        name: `${baseName(item.file)}-no-bg.png`,
        blob: await fetchResultBlob(item.resultUrl),
      }),
      onDone: (count) =>
        trackEvent("batch_download", {
          format: "png_zip",
          count,
          plan: quota?.plan || "unknown",
        }),
      failure: "Failed to build PNG zip. Try downloading images one by one.",
    });

  /**
   * Batch ZIP of marketplace white JPGs.
   * Default: pure white + 2000² (Amazon-ready). If user picked 1000/1600/2000 in
   * export options, honor that size; "original" still upgrades to 2000 for ZIP.
   */
  const handleDownloadAllWhite = () => {
    const zipSize = resolveWhiteExportSize(canvasSize);
    return runZipDownload({
      label: `White JPG ${zipSize}²`,
      zipName: (count) => `bg-removed-white-${sizeSlug(zipSize)}-${count}.zip`,
      toEntry: async (item) => ({
        name: `${baseName(item.file)}-white-${sizeSlug(zipSize)}.jpg`,
        blob: await exportSolidBackgroundJpeg(item.resultUrl, "#FFFFFF", zipSize),
      }),
      onDone: (count) => {
        trackEvent("batch_download", {
          format: "white_jpeg_zip",
          color: "white",
          canvas: zipSize,
          count,
          plan: quota?.plan || "unknown",
        });
        trackEvent("export_white_jpg", {
          canvas: zipSize,
          plan: quota?.plan || "unknown",
          source: "batch_zip",
          count,
        });
      },
      failure: "Failed to build white JPG zip. Try one image at a time.",
    });
  };

  /** ZIP using current solid color + canvas from export options (advanced). */
  const handleDownloadAllCustomSolid = () => {
    const slug = solidColorSlug(bgColor);
    return runZipDownload({
      label: "Exporting solid JPG",
      zipName: (count) => `bg-removed-${slug}-${sizeSlug(canvasSize)}-${count}.zip`,
      toEntry: async (item) => ({
        name: `${baseName(item.file)}-${slug}-${sizeSlug(canvasSize)}.jpg`,
        blob: await exportSolidBackgroundJpeg(item.resultUrl, bgColor, canvasSize),
      }),
      onDone: (count) =>
        trackEvent("batch_download", {
          format: "solid_jpeg_zip",
          color: slug,
          canvas: canvasSize,
          count,
          plan: quota?.plan || "unknown",
        }),
      failure: "Failed to build solid-background zip. Try one image at a time.",
    });
  };

  const handleSliderMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    setSliderPos((x / rect.width) * 100);
  }, []);

  useEffect(() => {
    const handleUp = () => setIsDragging(false);
    const handleMove = (e: MouseEvent) => {
      if (isDragging) {
        e.preventDefault();
        handleSliderMove(e.clientX);
      }
    };
    const handleTouchMove = (e: TouchEvent) => {
      if (isDragging) {
        handleSliderMove(e.touches[0].clientX);
      }
    };

    window.addEventListener("mouseup", handleUp);
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("touchend", handleUp);
    window.addEventListener("touchmove", handleTouchMove, { passive: true });

    return () => {
      window.removeEventListener("mouseup", handleUp);
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("touchend", handleUp);
      window.removeEventListener("touchmove", handleTouchMove);
    };
  }, [isDragging, handleSliderMove]);

  const grabSlider = useCallback(
    (clientX: number) => {
      setIsDragging(true);
      handleSliderMove(clientX);
    },
    [handleSliderMove]
  );

  const quotaView = deriveQuotaView(quota);
  const showQuotaBar =
    stage === "idle" || stage === "error" || stage === "done" || stage === "processing";
  const showUpload = stage === "idle" || (stage === "error" && items.length === 0);
  const showQueue =
    items.length > 0 &&
    (stage === "processing" || stage === "done" || (stage === "error" && items.length > 0));

  return (
    <div className="mx-auto w-full max-w-3xl text-neutral-950">
      {showQuotaBar && <QuotaBar quota={quota} />}

      {showUpload && (
        <UploadDropzone
          dragOver={dragOver}
          blocked={!!limitError}
          maxFileSizeMb={quota?.maxFileSizeMb || getPlanLimits("free").maxFileSizeMb}
          error={error}
          limitError={limitError}
          showError={stage === "error"}
          fileInputRef={fileInputRef}
          onDragOverChange={setDragOver}
          onDrop={handleDrop}
          onFileChange={handleFileChange}
        />
      )}

      {showQueue && (
        <div className="space-y-5">
          <BatchQueue
            items={items}
            activeId={activeId}
            stage={stage}
            doneCount={doneCount}
            failCount={failCount}
            processingTime={processingTime}
            batchEta={batchEta}
            avgSec={avgSecRef.current}
            quota={quota}
            error={error}
            onSelect={(id) => {
              setActiveId(id);
              setSliderPos(50);
            }}
          />

          {stage === "processing" && activeItem && (
            <ProcessingOverlay
              item={activeItem}
              processingTime={processingTime}
              isBatch={isBatch}
              batchEta={batchEta}
              doneCount={doneCount}
              totalCount={items.length}
              onCancel={reset}
            />
          )}

          {stage === "done" && activeItem?.status === "done" && activeItem.resultUrl && (
            <div className="animate-in fade-in space-y-5 duration-500">
              <CompareSlider
                item={activeItem as BatchItem & { resultUrl: string }}
                sliderPos={sliderPos}
                containerRef={containerRef}
                onGrab={grabSlider}
              />

              <ResultActions
                preferWhiteExport={preferWhiteExport}
                exportingSolid={exportingSolid}
                canvasSize={canvasSize}
                copyState={copyState}
                onDownloadPng={handleDownloadPng}
                onDownloadWhiteJpeg={() => void handleDownloadAmazonWhite()}
                onCopyPng={() => void handleCopyPng()}
                onReset={reset}
              />

              <ExportOptions
                open={showExportMenu}
                onToggle={() => setShowExportMenu((v) => !v)}
                previewUrl={activeItem.resultUrl}
                bgColor={bgColor}
                canvasSize={canvasSize}
                exportingSolid={exportingSolid}
                onBgColorChange={setBgColor}
                onCanvasSizeChange={setCanvasSize}
                onExport={() => void handleDownloadSolidJpeg(bgColor, canvasSize)}
              />

              {/* Retry other failed items while viewing a successful result */}
              {retryableCount > 0 && (
                <div className="flex flex-wrap justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => void handleRetryFailed(false)}
                    className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-950 hover:bg-amber-100"
                  >
                    Retry failed ({retryableCount})
                  </button>
                  <p className="w-full text-center text-[11px] text-neutral-500">
                    Select a failed thumbnail, then use “Retry this image” on that view.
                  </p>
                </div>
              )}

              {doneCount > 1 && (
                <BatchZipMenu
                  open={showBatchMenu}
                  onToggle={() => setShowBatchMenu((v) => !v)}
                  doneCount={doneCount}
                  bgColor={bgColor}
                  canvasSize={canvasSize}
                  downloading={batchDownloading}
                  zipProgress={zipProgress}
                  onZipPng={() => void handleDownloadAllPng()}
                  onZipWhiteJpeg={() => void handleDownloadAllWhite()}
                  onZipCurrentSolid={() => void handleDownloadAllCustomSolid()}
                />
              )}

              <p className="text-center text-xs text-neutral-500">
                Transparent PNG · pure white JPG (RGB 255) · canvas 1000/1600/2000
                {isBatch ? " · Tap thumbnails to switch" : ""}
              </p>

              {limitError && (
                <LimitUpsell
                  className="mx-auto max-w-md"
                  message={limitError.message}
                  loggedIn={limitError.loggedIn}
                  source="limit_cta_result"
                  compact
                />
              )}

              {quota && !limitError && (
                <div className="text-center text-sm text-neutral-500">
                  <span>
                    {quota.remaining}/{quota.limit} plan left
                    {quota.loggedIn ? ` · ${quotaView.creditBalance} credits` : ""}
                  </span>
                  {quotaView.usingCreditsNext && (
                    <span className="text-amber-800"> · next uses 1 credit</span>
                  )}
                  {!quota.loggedIn && (
                    <span>
                      {" · "}
                      <a
                        href="/api/auth/google/login?return=%2F%23tool"
                        onClick={() => trackEvent("login_click", { source: "result_hint" })}
                        className="font-medium text-emerald-700 hover:text-emerald-800"
                      >
                        Sign in for more
                      </a>
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          {stage === "done" && activeItem && activeItem.status !== "done" && (
            <FailedItemPanel
              message={activeItem.error || "This image failed."}
              retryableCount={retryableCount}
              onRetryThis={() => void handleRetryFailed(true)}
              onRetryAll={() => void handleRetryFailed(false)}
              onReset={reset}
            />
          )}

          {stage === "error" && items.length > 0 && doneCount === 0 && (
            <BatchErrorPanel
              error={error}
              limitError={limitError}
              retryableCount={retryableCount}
              onRetryAll={() => void handleRetryFailed(false)}
              onReset={reset}
            />
          )}
        </div>
      )}
    </div>
  );
}
