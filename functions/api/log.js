/**
 * Structured JSON logs for Cloudflare Workers (console → Logpush / dashboard).
 * Never log secrets, full cookies, or raw image payloads.
 */

/**
 * @param {"debug"|"info"|"warn"|"error"} level
 * @param {string} event
 * @param {Record<string, unknown>} [fields]
 */
export function logEvent(level, event, fields = {}) {
  const line = {
    ts: new Date().toISOString(),
    level,
    event,
    ...fields,
  };
  const text = JSON.stringify(line);
  if (level === "error") console.error(text);
  else if (level === "warn") console.warn(text);
  else console.log(text);
}

/** Rough request id for correlating a single remove-bg attempt. */
export function newRequestId() {
  try {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
      return crypto.randomUUID().slice(0, 8);
    }
  } catch {
    /* ignore */
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}
