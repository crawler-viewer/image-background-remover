/**
 * Create a small JPEG object URL for strip thumbnails.
 * Falls back to the original object URL if canvas fails.
 */
export async function createThumbnailUrl(
  source: Blob | string,
  maxEdge = 160,
  quality = 0.72
): Promise<string> {
  try {
    const blob =
      typeof source === "string"
        ? await (await fetch(source)).blob()
        : source;

    // createImageBitmap is efficient in modern browsers
    if (typeof createImageBitmap === "function") {
      const bitmap = await createImageBitmap(blob);
      const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
      const w = Math.max(1, Math.round(bitmap.width * scale));
      const h = Math.max(1, Math.round(bitmap.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        bitmap.close();
        return URL.createObjectURL(blob);
      }
      ctx.drawImage(bitmap, 0, 0, w, h);
      bitmap.close();
      const out = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", quality)
      );
      if (!out) return URL.createObjectURL(blob);
      return URL.createObjectURL(out);
    }

    // Fallback via Image element
    const objectUrl = typeof source === "string" ? source : URL.createObjectURL(blob);
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("thumb load failed"));
      el.src = objectUrl;
    });
    const scale = Math.min(1, maxEdge / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.max(1, Math.round(img.naturalWidth * scale));
    const h = Math.max(1, Math.round(img.naturalHeight * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      if (typeof source !== "string") URL.revokeObjectURL(objectUrl);
      return typeof source === "string" ? source : objectUrl;
    }
    ctx.drawImage(img, 0, 0, w, h);
    if (typeof source !== "string") URL.revokeObjectURL(objectUrl);
    const out = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", quality)
    );
    if (!out) return typeof source === "string" ? source : URL.createObjectURL(blob);
    return URL.createObjectURL(out);
  } catch {
    if (typeof source === "string") return source;
    return URL.createObjectURL(source);
  }
}
