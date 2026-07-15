/**
 * Lightweight GA4 helper. No-ops when gtag is unavailable
 * (local dev without NEXT_PUBLIC_GA_MEASUREMENT_ID).
 *
 * Funnel events (recommended reports):
 *   view_pricing → begin_checkout → checkout_login_redirect? → purchase
 *   remove_start → remove_success → download / export_white_jpg / batch_download
 *   limit_reached → upgrade_click → begin_checkout
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

/** Parse product amount string ("9.90") to number for GA4 value. */
export function parseMoneyValue(amount: string | number | null | undefined): number | undefined {
  if (amount == null) return undefined;
  const n = typeof amount === "number" ? amount : Number(amount);
  if (!Number.isFinite(n)) return undefined;
  return Math.round(n * 100) / 100;
}

/**
 * GA4 recommended ecommerce: begin_checkout
 * https://developers.google.com/analytics/devguides/collection/ga4/reference/events#begin_checkout
 */
export function trackBeginCheckout(opts: {
  productId: string;
  value?: number;
  currency?: string;
  productType?: string;
  plan?: string;
  billingCycle?: string;
  source?: string;
}): void {
  trackEvent("begin_checkout", {
    currency: opts.currency || "USD",
    value: opts.value,
    product_id: opts.productId,
    product_type: opts.productType,
    plan: opts.plan,
    billing_cycle: opts.billingCycle,
    source: opts.source,
    // Also keep legacy name for existing dashboards
  });
  // Mirror as checkout_start for historical continuity
  trackEvent("checkout_start", {
    product_id: opts.productId,
    product_type: opts.productType,
    plan: opts.plan,
    billing_cycle: opts.billingCycle,
    value: opts.value,
    currency: opts.currency || "USD",
    source: opts.source,
  });
}

/**
 * GA4 recommended ecommerce: purchase
 */
export function trackPurchase(opts: {
  productId?: string | null;
  value?: number;
  currency?: string;
  kind?: string | null;
  plan?: string | null;
  credits?: number | null;
  extended?: boolean;
  status?: string;
  source?: string;
  /** Stable id for GA4 purchase dedupe (e.g. payment_orders.id) */
  orderId?: string | number | null;
}): void {
  const transactionId =
    opts.orderId != null
      ? `po_${opts.orderId}`
      : opts.productId
        ? `prod_${opts.productId}_${opts.value ?? "x"}`
        : undefined;

  trackEvent("purchase", {
    currency: opts.currency || "USD",
    value: opts.value,
    transaction_id: transactionId,
    product_id: opts.productId || undefined,
    kind: opts.kind || undefined,
    plan: opts.plan || undefined,
    credits: opts.credits ?? undefined,
    extended: opts.extended ? 1 : 0,
    status: opts.status || "success",
    source: opts.source,
  });
}

export function trackViewPricing(source?: string): void {
  trackEvent("view_pricing", { source: source || "pricing_page" });
}

export function trackViewCredits(source?: string): void {
  trackEvent("view_credits", { source: source || "credits_page" });
}
