/**
 * Shared ZIP builder for the three batch download flows (PNG / white JPG /
 * current solid options). Reports progress per file and yields between files so
 * the progress bar can paint.
 */
import { blobToUint8Array, createZipBlob, type ZipEntry } from "@/lib/zip-download";
import { sleep } from "./format";
import type { ZipProgress } from "./types";

export async function buildBatchZip<T>(opts: {
  items: T[];
  /** Progress label while packing individual files */
  label: string;
  toEntry: (item: T) => Promise<{ name: string; blob: Blob }>;
  onProgress: (progress: ZipProgress) => void;
}): Promise<Blob> {
  const { items, label, toEntry, onProgress } = opts;
  const total = items.length;
  const entries: ZipEntry[] = [];

  onProgress({ label, current: 0, total });

  for (let i = 0; i < total; i++) {
    onProgress({ label, current: i + 1, total });
    const { name, blob } = await toEntry(items[i]);
    entries.push({ name, data: await blobToUint8Array(blob) });
    await sleep(0);
  }

  onProgress({ label: "Creating ZIP", current: total, total });
  await sleep(0);

  return createZipBlob(entries);
}
