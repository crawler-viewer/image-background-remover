/**
 * Lightweight GA4 helper. No-ops when gtag is unavailable
 * (local dev without NEXT_PUBLIC_GA_MEASUREMENT_ID).
 */

export type AnalyticsParams = Record<string, string | number | boolean | undefined | null>;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export function trackEvent(eventName: string, params?: AnalyticsParams): void {
  if (typeof window === "undefined") return;

  const cleaned: Record<string, string | number | boolean> = {};
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null) continue;
      cleaned[key] = value;
    }
  }

  try {
    if (typeof window.gtag === "function") {
      window.gtag("event", eventName, cleaned);
      return;
    }
    // Queue for gtag bootstrap if script loads later
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(["event", eventName, cleaned]);
  } catch {
    // analytics must never break the product
  }
}
