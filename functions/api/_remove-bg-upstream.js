/**
 * Phase 3 of /api/remove-bg: the paid upstream call.
 *
 * Clipdrop is preferred when CLIPDROP_API_KEY is set; Remove.bg is the fallback.
 */
const CLIPDROP_URL = "https://clipdrop-api.co/remove-background/v1";
const REMOVE_BG_URL = "https://api.remove.bg/v1.0/removebg";

/**
 * @returns {{ apiKey: string, provider: "clipdrop"|"remove_bg", useClipdrop: boolean } | null}
 *   null when no provider is configured.
 */
export function resolveProvider(env) {
  const useClipdrop = !!env.CLIPDROP_API_KEY;
  const apiKey = env.CLIPDROP_API_KEY || env.REMOVE_BG_API_KEY;
  if (!apiKey) return null;
  return { apiKey, provider: useClipdrop ? "clipdrop" : "remove_bg", useClipdrop };
}

/**
 * @returns {Promise<{ ok: true, buffer: ArrayBuffer, upstreamMs: number }
 *   | { ok: false, status: number, detail: string, upstreamMs: number }>}
 */
export async function removeBackground({ file, apiKey, useClipdrop }) {
  const startedAt = Date.now();
  const form = new FormData();
  form.append("image_file", file);

  let response;
  if (useClipdrop) {
    response = await fetch(CLIPDROP_URL, {
      method: "POST",
      headers: { "x-api-key": apiKey },
      body: form,
    });
  } else {
    form.append("size", "auto");
    response = await fetch(REMOVE_BG_URL, {
      method: "POST",
      headers: { "X-Api-Key": apiKey },
      body: form,
    });
  }

  const upstreamMs = Date.now() - startedAt;

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    return {
      ok: false,
      status: response.status,
      // Truncate provider body — may contain operational detail, not user PII
      detail: String(detail).slice(0, 200),
      upstreamMs,
    };
  }

  return { ok: true, buffer: await response.arrayBuffer(), upstreamMs };
}

/** Client-facing response for an upstream failure (never leaks provider detail). */
export function upstreamErrorResponse(status) {
  if (status === 402) {
    return Response.json(
      { error: "Service quota exceeded. Please try again later." },
      { status: 503 }
    );
  }

  if (status === 429) {
    return new Response(
      JSON.stringify({
        error: "Service is busy. Please try again.",
        code: "UPSTREAM_RATE_LIMITED",
        retryAfterSec: 30,
      }),
      {
        status: 429,
        headers: { "Content-Type": "application/json", "Retry-After": "30" },
      }
    );
  }

  return Response.json(
    { error: "Background removal failed. Please try a different image." },
    { status: 502 }
  );
}
