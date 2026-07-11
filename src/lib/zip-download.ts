import { zipSync } from "fflate";

export type ZipEntry = {
  name: string;
  data: Uint8Array;
};

/** Ensure unique filenames inside a zip (file.png, file-2.png, …). */
export function uniqueZipName(name: string, used: Set<string>): string {
  if (!used.has(name)) {
    used.add(name);
    return name;
  }
  const dot = name.lastIndexOf(".");
  const base = dot > 0 ? name.slice(0, dot) : name;
  const ext = dot > 0 ? name.slice(dot) : "";
  let i = 2;
  let candidate = `${base}-${i}${ext}`;
  while (used.has(candidate)) {
    i += 1;
    candidate = `${base}-${i}${ext}`;
  }
  used.add(candidate);
  return candidate;
}

export async function blobToUint8Array(blob: Blob): Promise<Uint8Array> {
  const buffer = await blob.arrayBuffer();
  return new Uint8Array(buffer);
}

/**
 * Pack entries into a zip Blob. level 0 = store (PNG/JPEG already compressed).
 */
export function createZipBlob(entries: ZipEntry[]): Blob {
  const files: Record<string, Uint8Array> = {};
  const used = new Set<string>();
  for (const entry of entries) {
    const name = uniqueZipName(entry.name.replace(/^\/+/, ""), used);
    files[name] = entry.data;
  }
  const zipped = zipSync(files, { level: 0 });
  // Copy into a fresh ArrayBuffer-backed view for BlobPart typing.
  const copy = new Uint8Array(zipped.byteLength);
  copy.set(zipped);
  return new Blob([copy], { type: "application/zip" });
}

export function downloadZipBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
