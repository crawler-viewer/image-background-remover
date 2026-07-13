"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { trackEvent } from "@/lib/analytics";
import {
  blobToUint8Array,
  createZipBlob,
  downloadZipBlob,
  type ZipEntry,
} from "@/lib/zip-download";
import { createThumbnailUrl } from "@/lib/image-thumb";

type Stage = "idle" | "processing" | "done" | "error";
type ItemStatus = "queued" | "processing" | "done" | "error" | "skipped";

type QuotaInfo = {
  plan: string;
  used: number;
  limit: number;
  remaining: number;
  credits?: number;
  maxFileSizeMb: number;
  loggedIn: boolean;
};

type LimitErrorInfo = {
  message: string;
  code?: string;
  loggedIn: boolean;
};

type BatchItem = {
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

type ZipProgress = {
  label: string;
  current: number;
  total: number;
} | null;

/** Hard cap per batch to protect UX and upstream costs. */
const MAX_BATCH_SIZE = 20;

function baseName(file: File | null | undefined): string {
  if (!file) return "removed-bg";
  return file.name.replace(/\.[^.]+$/, "") || "removed-bg";
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Composite transparent PNG onto a solid background and export JPEG. */
async function exportSolidBackgroundJpeg(
  pngUrl: string,
  fillStyle = "#FFFFFF",
  quality = 0.92
): Promise<Blob> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error("Failed to load result image."));
    el.src = pngUrl;
  });

  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth || img.width;
  canvas.height = img.naturalHeight || img.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported in this browser.");

  ctx.fillStyle = fillStyle;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0);

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", quality)
  );
  if (!blob) throw new Error("Failed to export solid-background JPEG.");
  return blob;
}

function colorSlug(hex: string): string {
  return hex.replace("#", "").toLowerCase() || "custom";
}

async function fetchResultBlob(pngUrl: string): Promise<Blob> {
  const res = await fetch(pngUrl);
  if (!res.ok) throw new Error("Failed to read result image.");
  return res.blob();
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function statusLabel(status: ItemStatus): string {
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
  const [copyState, setCopyState] = useState<"idle" | "ok" | "err">("idle");
  const [batchDownloading, setBatchDownloading] = useState(false);
  const [showBatchMenu, setShowBatchMenu] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [zipProgress, setZipProgress] = useState<ZipProgress>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const abortRef = useRef(false);

  const activeItem = items.find((i) => i.id === activeId) || null;
  const doneCount = items.filter((i) => i.status === "done").length;
  const failCount = items.filter((i) => i.status === "error" || i.status === "skipped").length;
  const retryableCount = items.filter(
    (i) => (i.status === "error" || i.status === "skipped") && !i.resultUrl
  ).length;
  const isBatch = items.length > 1;

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
    setZipProgress(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    fetchQuota();
  }, [items, revokeAll, fetchQuota]);

  const validateFile = useCallback(
    (file: File, maxMb: number): string | null => {
      const maxBytes = maxMb * 1024 * 1024;
      const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
      if (!allowedTypes.includes(file.type)) {
        return `Unsupported format: ${file.type || "unknown"}. Use PNG, JPG, or WebP.`;
      }
      if (file.size > maxBytes) {
        return `File too large (${formatFileSize(file.size)}). Max ${maxMb}MB for your plan.`;
      }
      if (file.size < 100) {
        return "File appears to be empty or corrupted.";
      }
      return null;
    },
    []
  );

  const processSingle = useCallback(
    async (
      file: File,
      planHint: string
    ): Promise<
      | { ok: true; resultUrl: string; processingSec: number }
      | {
          ok: false;
          error: string;
          limit?: LimitErrorInfo;
          hardStop?: boolean;
          rateLimited?: boolean;
          retryAfterSec?: number;
        }
    > => {
      trackEvent("remove_start", {
        plan: planHint,
        file_size_kb: Math.round(file.size / 1024),
        batch: true,
      });

      const startTime = Date.now();
      const formData = new FormData();
      formData.append("image", file);

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);

      try {
        const res = await fetch("/api/remove-bg", {
          method: "POST",
          body: formData,
          signal: controller.signal,
        });
        clearTimeout(timeout);

        if (!res.ok) {
          const data = (await res.json().catch(() => ({}))) as {
            error?: string;
            code?: string;
            plan?: string;
          };

          if (res.status === 429) {
            const code = data.code || "MONTHLY_LIMIT_REACHED";

            // Short-window burst limit — wait and retry once for batch UX
            if (code === "RATE_LIMITED") {
              const retryAfter = Number(
                (data as { retryAfterSec?: number }).retryAfterSec || 60
              );
              trackEvent("remove_error", {
                reason: "rate_limited",
                batch: true,
                retry_after: retryAfter,
              });
              return {
                ok: false,
                error:
                  data.error ||
                  `Too many requests. Waiting ${retryAfter}s before continuing…`,
                hardStop: false,
                rateLimited: true,
                retryAfterSec: retryAfter,
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

            trackEvent("limit_reached", {
              plan: data.plan || planHint,
              code,
              batch: true,
            });

            return {
              ok: false,
              error: message,
              hardStop: true,
              limit: {
                message,
                code,
                loggedIn: !isGuest,
              },
            };
          }

          trackEvent("remove_error", { reason: "server", batch: true });
          return {
            ok: false,
            error: data.error || `Server error (${res.status}). Please try again.`,
          };
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

      trackEvent("batch_start", {
        plan: quota?.plan || "unknown",
        count: batch.length,
      });

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

        // One automatic wait+retry on short-window rate limit (batch-friendly)
        if (!result.ok && result.rateLimited && !abortRef.current) {
          const waitSec = Math.min(90, Math.max(5, result.retryAfterSec || 60));
          setError(`Rate limited — waiting ${waitSec}s then retrying…`);
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

        // Brief pause between jobs to avoid hammering the edge function
        if (i < batch.length - 1 && !abortRef.current) {
          await sleep(250);
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

      const maxMb = quota?.maxFileSizeMb || 25;
      const remaining =
        (quota?.remaining ?? MAX_BATCH_SIZE) + (quota?.credits ? Number(quota.credits) : 0);

      if (remaining <= 0) {
        const message = quota?.loggedIn
          ? "Monthly limit reached. Buy credits or upgrade your plan."
          : "Guest monthly limit reached. Sign in to unlock more removals.";
        setLimitError({
          message,
          code: quota?.loggedIn ? "MONTHLY_LIMIT_REACHED" : "GUEST_MONTHLY_LIMIT_REACHED",
          loggedIn: !!quota?.loggedIn,
        });
        setError(message);
        setStage("error");
        trackEvent("limit_reached", { plan: quota?.plan || "unknown", code: "precheck" });
        return;
      }

      let selected = files.slice(0, MAX_BATCH_SIZE);
      if (files.length > MAX_BATCH_SIZE) {
        setError(`Only the first ${MAX_BATCH_SIZE} images will be processed in this batch.`);
      }

      // Cap by remaining quota when known (credits already folded into remaining above)
      if (remaining < selected.length) {
        selected = selected.slice(0, Math.max(1, remaining));
        setError(
          `You have ${remaining} removal${remaining === 1 ? "" : "s"} left — processing ${selected.length} image${selected.length === 1 ? "" : "s"}.`
        );
      }

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

  const handleDownloadSolidJpeg = async (color = bgColor) => {
    if (!activeItem?.resultUrl) return;
    setExportingSolid(true);
    try {
      const blob = await exportSolidBackgroundJpeg(activeItem.resultUrl, color);
      const slug =
        color.toUpperCase() === "#FFFFFF"
          ? "white"
          : color.toUpperCase() === "#000000"
            ? "black"
            : colorSlug(color);
      downloadBlob(blob, `${baseName(activeItem.file)}-${slug}-bg.jpg`);
      trackEvent("download", {
        format: "solid_jpeg",
        color: slug,
        plan: quota?.plan || "unknown",
        batch: isBatch,
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to export solid background.");
      trackEvent("remove_error", { reason: "solid_export" });
    } finally {
      setExportingSolid(false);
    }
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

  const handleRetryFailed = async () => {
    const failed = items.filter(
      (i) => (i.status === "error" || i.status === "skipped") && !i.resultUrl
    );
    if (failed.length === 0 || stage === "processing") return;

    trackEvent("batch_retry", { count: failed.length, plan: quota?.plan || "unknown" });

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

  const handleDownloadAllPng = async () => {
    const done = items.filter((i) => i.status === "done" && i.resultUrl);
    if (done.length === 0) return;
    setBatchDownloading(true);
    setZipProgress({ label: "Packing PNG", current: 0, total: done.length });
    try {
      const entries: ZipEntry[] = [];
      for (let i = 0; i < done.length; i++) {
        const item = done[i];
        setZipProgress({ label: "Packing PNG", current: i + 1, total: done.length });
        const blob = await fetchResultBlob(item.resultUrl!);
        entries.push({
          name: `${baseName(item.file)}-no-bg.png`,
          data: await blobToUint8Array(blob),
        });
        // Yield so the progress bar can paint
        await sleep(0);
      }
      setZipProgress({ label: "Creating ZIP", current: done.length, total: done.length });
      await sleep(0);
      const zip = createZipBlob(entries);
      downloadZipBlob(zip, `bg-removed-png-${done.length}.zip`);
      trackEvent("batch_download", {
        format: "png_zip",
        count: done.length,
        plan: quota?.plan || "unknown",
      });
    } catch {
      setError("Failed to build PNG zip. Try downloading images one by one.");
    } finally {
      setBatchDownloading(false);
      setZipProgress(null);
    }
  };

  const handleDownloadAllWhite = async () => {
    const done = items.filter((i) => i.status === "done" && i.resultUrl);
    if (done.length === 0) return;
    setBatchDownloading(true);
    setZipProgress({ label: "Exporting white JPG", current: 0, total: done.length });
    try {
      const entries: ZipEntry[] = [];
      for (let i = 0; i < done.length; i++) {
        const item = done[i];
        setZipProgress({
          label: "Exporting solid JPG",
          current: i + 1,
          total: done.length,
        });
        const blob = await exportSolidBackgroundJpeg(item.resultUrl!, bgColor);
        const slug =
          bgColor.toUpperCase() === "#FFFFFF"
            ? "white"
            : bgColor.toUpperCase() === "#000000"
              ? "black"
              : colorSlug(bgColor);
        entries.push({
          name: `${baseName(item.file)}-${slug}-bg.jpg`,
          data: await blobToUint8Array(blob),
        });
        await sleep(0);
      }
      setZipProgress({ label: "Creating ZIP", current: done.length, total: done.length });
      await sleep(0);
      const zip = createZipBlob(entries);
      const zipSlug =
        bgColor.toUpperCase() === "#FFFFFF"
          ? "white"
          : bgColor.toUpperCase() === "#000000"
            ? "black"
            : colorSlug(bgColor);
      downloadZipBlob(zip, `bg-removed-${zipSlug}-${done.length}.zip`);
      trackEvent("batch_download", {
        format: "solid_jpeg_zip",
        color: zipSlug,
        count: done.length,
        plan: quota?.plan || "unknown",
      });
    } catch {
      setError("Failed to build solid-background zip. Try one image at a time.");
    } finally {
      setBatchDownloading(false);
      setZipProgress(null);
    }
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

  const planLabel =
    quota?.plan === "guest"
      ? "Guest"
      : quota?.plan === "free"
        ? "Free"
        : quota?.plan === "pro"
          ? "Pro"
          : quota?.plan === "business"
            ? "Business"
            : "—";

  const showQuotaBar = stage === "idle" || stage === "error";
  const showUpload = stage === "idle" || (stage === "error" && items.length === 0);
  const showQueue = items.length > 0 && (stage === "processing" || stage === "done" || (stage === "error" && items.length > 0));
  return (
    <div className="mx-auto w-full max-w-3xl text-neutral-950">
      {/* Quota Status Bar */}
      {showQuotaBar && (
        <div className="mb-4 rounded-xl border border-black/8 bg-stone-50 px-4 py-3">
          {quota ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex rounded-full border border-black/10 bg-white px-2 py-0.5 text-xs font-medium text-neutral-700">
                    {planLabel}
                  </span>
                  <span className="text-neutral-600">
                    {quota.remaining}/{quota.limit} left this month
                    {quota.credits ? ` · ${quota.credits} credits` : ""}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {!quota.loggedIn && (
                    <a
                      href="/api/auth/google/login"
                      onClick={() => trackEvent("login_click", { source: "quota_bar" })}
                      className="text-xs font-medium text-emerald-700 transition-colors hover:text-emerald-800"
                    >
                      Sign in for 20/mo
                    </a>
                  )}
                  {quota.loggedIn && quota.plan !== "pro" && quota.plan !== "business" && (
                    <a
                      href="/pricing/"
                      onClick={() =>
                        trackEvent("upgrade_click", { source: "quota_bar", plan: quota.plan })
                      }
                      className="text-xs font-medium text-emerald-700 transition-colors hover:text-emerald-800"
                    >
                      Upgrade to Pro
                    </a>
                  )}
                </div>
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-stone-200">
                <div
                  className={`h-full transition-all duration-300 ${
                    quota.used / quota.limit >= 0.9
                      ? "bg-red-500"
                      : quota.used / quota.limit >= 0.6
                        ? "bg-amber-500"
                        : "bg-emerald-500"
                  }`}
                  style={{
                    width: `${Math.max(0, Math.min(100, (quota.used / quota.limit) * 100))}%`,
                  }}
                />
              </div>
            </>
          ) : (
            <div className="h-5 w-40 animate-pulse rounded bg-stone-200" />
          )}
        </div>
      )}

      {/* Upload Zone */}
      {showUpload && (
        <div
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if ((e.key === "Enter" || e.key === " ") && !limitError) {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => {
            if (!limitError) fileInputRef.current?.click();
          }}
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
            onChange={handleFileChange}
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
            PNG, JPG, WebP — up to {quota?.maxFileSizeMb || 25}MB each · batch up to{" "}
            {MAX_BATCH_SIZE}
          </p>
          <p className="mt-2 text-xs text-neutral-500">
            Drop, browse, or paste (Ctrl/⌘+V) · each success uses 1 removal
          </p>
          <p className="mt-4 max-w-sm text-[11px] leading-relaxed text-neutral-400">
            Images are processed in real time and not stored on our servers. Commercial use OK.
          </p>

          {stage === "error" && error && !limitError && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {stage === "error" && limitError && (
            <div
              className="mt-5 w-full max-w-md rounded-xl border border-amber-200 bg-amber-50 p-4 text-left"
              onClick={(e) => e.stopPropagation()}
            >
              <p className="text-sm font-medium text-amber-900">{limitError.message}</p>
              <p className="mt-1 text-xs text-amber-800/80">
                Limits reset on the 1st of each month (UTC).
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {!limitError.loggedIn && (
                  <a
                    href="/api/auth/google/login"
                    onClick={() => trackEvent("login_click", { source: "limit_cta" })}
                    className="inline-flex rounded-lg bg-neutral-950 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-800"
                  >
                    Sign in for 20/mo free
                  </a>
                )}
                <a
                  href="/credits/"
                  onClick={() => trackEvent("upgrade_click", { source: "limit_cta_credits" })}
                  className="inline-flex rounded-lg border border-black/10 bg-white px-4 py-2 text-sm font-medium text-neutral-800 transition-colors hover:bg-stone-100"
                >
                  Buy credits
                </a>
                <a
                  href="/pricing/"
                  onClick={() => trackEvent("upgrade_click", { source: "limit_cta_pricing" })}
                  className="inline-flex rounded-lg border border-black/10 bg-white px-4 py-2 text-sm font-medium text-neutral-800 transition-colors hover:bg-stone-100"
                >
                  View plans
                </a>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Batch queue + active preview */}
      {showQueue && (
        <div className="space-y-5">
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
                      <span className="text-neutral-500"> · {processingTime}s</span>
                    )}
                  </>
                ) : (
                  <>
                    <span className="font-semibold text-emerald-700">{doneCount}</span> done
                    {failCount > 0 && (
                      <>
                        {" · "}
                        <span className="font-semibold text-amber-700">{failCount}</span> failed/skipped
                      </>
                    )}
                    {" · "}
                    {items.length} total
                  </>
                )}
              </div>
              {quota && (
                <span className="text-xs text-neutral-500">
                  {quota.remaining}/{quota.limit} left
                </span>
              )}
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-stone-200">
              <div
                className="h-full bg-emerald-500 transition-all duration-300"
                style={{
                  width: `${Math.max(
                    0,
                    Math.min(100, ((doneCount + failCount) / Math.max(1, items.length)) * 100)
                  )}%`,
                }}
              />
            </div>
            {error && stage === "processing" && (
              <p className="mt-2 text-xs text-amber-700">{error}</p>
            )}
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1">
            {items.map((item, idx) => {
              const selected = item.id === activeId;
              return (
                <button
                  key={item.id}
                  type="button"
                  aria-label={`${item.file.name} — ${statusLabel(item.status)}`}
                  onClick={() => {
                    if (item.status === "done" || stage !== "processing") {
                      setActiveId(item.id);
                      setSliderPos(50);
                    }
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

          {stage === "processing" && activeItem && (
            <div className="py-4 text-center">
              <div className="relative mb-4 inline-block overflow-hidden rounded-2xl border border-black/8">
                <img
                  src={activeItem.originalUrl}
                  alt="Processing"
                  className="max-h-80 opacity-40"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-[2px]">
                  <div className="flex flex-col items-center gap-3 rounded-2xl border border-black/8 bg-white/95 px-6 py-5 shadow-lg">
                    <div className="relative h-12 w-12">
                      <div className="absolute inset-0 rounded-full border-4 border-stone-200" />
                      <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-neutral-900">Removing background…</p>
                      <p className="mt-1 max-w-[220px] truncate text-xs text-neutral-500">
                        {activeItem.file.name}
                        {processingTime > 0 && ` · ${processingTime}s`}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={reset}
                className="text-sm text-neutral-500 underline-offset-2 hover:text-neutral-900 hover:underline"
              >
                Cancel batch
              </button>
            </div>
          )}

          {stage === "done" && activeItem?.status === "done" && activeItem.resultUrl && (
            <div className="animate-in fade-in space-y-5 duration-500">
              <div
                ref={containerRef}
                className="relative cursor-col-resize select-none overflow-hidden rounded-2xl border border-black/10 shadow-[0_16px_40px_rgba(15,23,42,0.08)]"
                onMouseDown={(e) => {
                  setIsDragging(true);
                  handleSliderMove(e.clientX);
                }}
                onTouchStart={(e) => {
                  setIsDragging(true);
                  handleSliderMove(e.touches[0].clientX);
                }}
              >
                <div
                  className="relative"
                  style={{
                    background:
                      "repeating-conic-gradient(#e7e5e4 0% 25%, #f5f5f4 0% 50%) 50% / 16px 16px",
                  }}
                >
                  <img
                    src={activeItem.resultUrl}
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
                    src={activeItem.originalUrl}
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
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M8 9l-3 3 3 3m8-6l3 3-3 3"
                      />
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
                Drag the slider to compare · {activeItem.file.name} ·{" "}
                {formatFileSize(activeItem.file.size)}
                {activeItem.processingSec ? ` · ${activeItem.processingSec}s` : ""}
              </p>

              {/* Primary actions */}
              <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
                <button
                  onClick={handleDownloadPng}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition-all hover:bg-emerald-700 sm:px-6"
                >
                  Download PNG
                </button>
                <button
                  onClick={() => handleDownloadSolidJpeg("#FFFFFF")}
                  disabled={exportingSolid}
                  className="inline-flex items-center gap-2 rounded-xl border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-neutral-900 transition-all hover:bg-stone-50 disabled:opacity-70 sm:px-6"
                >
                  {exportingSolid ? "Exporting…" : "White JPG"}
                </button>
                <button
                  onClick={handleCopyPng}
                  className="inline-flex items-center gap-2 rounded-xl border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-neutral-900 transition-all hover:bg-stone-50 sm:px-6"
                >
                  {copyState === "ok" ? "Copied!" : copyState === "err" ? "Copy failed" : "Copy PNG"}
                </button>
                <button
                  onClick={reset}
                  className="inline-flex rounded-xl border border-black/10 bg-stone-50 px-5 py-3 text-sm font-semibold text-neutral-700 transition-all hover:bg-stone-100 sm:px-6"
                >
                  New images
                </button>
              </div>

              {/* Solid background options */}
              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowExportMenu((v) => !v)}
                  className="text-sm font-medium text-neutral-600 underline-offset-2 hover:text-neutral-900 hover:underline"
                >
                  {showExportMenu ? "Hide background colors" : "More backgrounds ▾"}
                </button>
              </div>
              {showExportMenu && (
                <div className="mx-auto flex max-w-md flex-wrap items-center justify-center gap-3 rounded-2xl border border-black/8 bg-stone-50 px-4 py-3">
                  <button
                    type="button"
                    onClick={() => {
                      setBgColor("#FFFFFF");
                      void handleDownloadSolidJpeg("#FFFFFF");
                    }}
                    disabled={exportingSolid}
                    className="inline-flex items-center gap-2 rounded-lg border border-black/10 bg-white px-3 py-2 text-xs font-medium text-neutral-800"
                  >
                    <span className="h-4 w-4 rounded border border-black/15 bg-white" />
                    White
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setBgColor("#000000");
                      void handleDownloadSolidJpeg("#000000");
                    }}
                    disabled={exportingSolid}
                    className="inline-flex items-center gap-2 rounded-lg border border-black/10 bg-white px-3 py-2 text-xs font-medium text-neutral-800"
                  >
                    <span className="h-4 w-4 rounded border border-black/15 bg-black" />
                    Black
                  </button>
                  <label className="inline-flex items-center gap-2 rounded-lg border border-black/10 bg-white px-3 py-2 text-xs font-medium text-neutral-800">
                    <input
                      type="color"
                      value={bgColor}
                      onChange={(e) => setBgColor(e.target.value)}
                      className="h-5 w-5 cursor-pointer rounded border-0 bg-transparent p-0"
                    />
                    Custom
                  </label>
                  <button
                    type="button"
                    onClick={() => void handleDownloadSolidJpeg(bgColor)}
                    disabled={exportingSolid}
                    className="rounded-lg bg-neutral-950 px-3 py-2 text-xs font-medium text-white disabled:opacity-60"
                  >
                    Export JPG
                  </button>
                </div>
              )}

              {/* Retry failed (only shown in done/error result UI) */}
              {retryableCount > 0 && (
                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={() => void handleRetryFailed()}
                    className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-950 hover:bg-amber-100"
                  >
                    Retry failed ({retryableCount})
                  </button>
                </div>
              )}

              {/* Secondary batch actions */}
              {doneCount > 1 && (
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowBatchMenu((v) => !v)}
                    className="text-sm font-medium text-neutral-600 underline-offset-2 hover:text-neutral-900 hover:underline"
                  >
                    {showBatchMenu ? "Hide batch downloads" : `Batch ZIP (${doneCount}) ▾`}
                  </button>
                  {showBatchMenu && (
                    <div className="flex w-full flex-col items-center gap-2 pt-1">
                      <div className="flex flex-wrap justify-center gap-2">
                        <button
                          onClick={handleDownloadAllPng}
                          disabled={batchDownloading}
                          className="rounded-lg border border-black/10 bg-white px-4 py-2 text-xs font-medium text-neutral-800 hover:bg-stone-50 disabled:opacity-60"
                        >
                          {batchDownloading && zipProgress?.label.includes("PNG")
                            ? "Building…"
                            : "ZIP all PNG"}
                        </button>
                        <button
                          onClick={handleDownloadAllWhite}
                          disabled={batchDownloading}
                          className="rounded-lg border border-black/10 bg-white px-4 py-2 text-xs font-medium text-neutral-800 hover:bg-stone-50 disabled:opacity-60"
                        >
                          {batchDownloading && zipProgress?.label.includes("solid")
                            ? "Building…"
                            : "ZIP solid JPG"}
                        </button>
                      </div>
                      {showBatchMenu && (
                        <p className="text-center text-[11px] text-neutral-500">
                          Solid ZIP uses the color from “More backgrounds” (default white).
                        </p>
                      )}
                      {zipProgress && (
                        <div className="w-full max-w-xs">
                          <div className="mb-1 flex justify-between text-[11px] text-neutral-500">
                            <span>{zipProgress.label}</span>
                            <span>
                              {zipProgress.current}/{zipProgress.total}
                            </span>
                          </div>
                          <div className="h-1.5 overflow-hidden rounded-full bg-stone-200">
                            <div
                              className="h-full bg-emerald-500 transition-all duration-200"
                              style={{
                                width: `${Math.max(
                                  4,
                                  Math.round(
                                    (zipProgress.current / Math.max(1, zipProgress.total)) * 100
                                  )
                                )}%`,
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              <p className="text-center text-xs text-neutral-500">
                Transparent PNG · solid JPG (white / black / custom) · copy for paste into docs
                {isBatch ? " · Tap thumbnails to switch" : ""}
              </p>

              {limitError && (
                <div className="mx-auto max-w-md rounded-xl border border-amber-200 bg-amber-50 p-4 text-left">
                  <p className="text-sm font-medium text-amber-900">{limitError.message}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {!limitError.loggedIn && (
                      <a
                        href="/api/auth/google/login"
                        className="inline-flex rounded-lg bg-neutral-950 px-3 py-1.5 text-xs font-medium text-white"
                      >
                        Sign in
                      </a>
                    )}
                    <a
                      href="/credits/"
                      className="inline-flex rounded-lg border border-black/10 bg-white px-3 py-1.5 text-xs text-neutral-800"
                    >
                      Buy credits
                    </a>
                    <a
                      href="/pricing/"
                      className="inline-flex rounded-lg border border-black/10 bg-white px-3 py-1.5 text-xs text-neutral-800"
                    >
                      View plans
                    </a>
                  </div>
                </div>
              )}

              {quota && (
                <div className="text-center text-sm text-neutral-500">
                  <span>
                    {quota.remaining}/{quota.limit} removals left this month
                  </span>
                  {!quota.loggedIn && (
                    <span>
                      {" · "}
                      <a
                        href="/api/auth/google/login"
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
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center">
              <p className="text-sm text-amber-900">{activeItem.error || "This image failed."}</p>
              <p className="mt-2 text-xs text-amber-800/80">
                Select a green thumbnail above to preview a successful result.
              </p>
              <button
                type="button"
                onClick={reset}
                className="mt-4 rounded-xl border border-black/10 bg-white px-5 py-2 text-sm text-neutral-800"
              >
                New images
              </button>
            </div>
          )}

          {stage === "error" && items.length > 0 && doneCount === 0 && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
              <p className="text-sm text-red-800">
                {limitError?.message || error || "Batch failed."}
              </p>
              {limitError && (
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  {!limitError.loggedIn && (
                    <a
                      href="/api/auth/google/login"
                      className="rounded-lg bg-neutral-950 px-4 py-2 text-sm font-medium text-white"
                    >
                      Sign in
                    </a>
                  )}
                  <a
                    href="/credits/"
                    className="rounded-lg border border-black/10 bg-white px-4 py-2 text-sm text-neutral-800"
                  >
                    Buy credits
                  </a>
                </div>
              )}
              <button
                type="button"
                onClick={reset}
                className="mt-4 text-sm text-neutral-600 underline-offset-2 hover:underline"
              >
                Try again
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
