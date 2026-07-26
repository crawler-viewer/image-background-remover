// PayPal API helper for Cloudflare Workers
// One-time Checkout (CAPTURE) used for prepaid plan periods + credit packs.
// This is NOT PayPal Subscriptions auto-renewal.

// Single source of truth shared with the Next.js frontend (src/lib/products.ts).
import PRODUCTS_RAW from "../../../shared/products.js";

export const PRODUCTS = PRODUCTS_RAW;

export function getPayPalConfig(env) {
  const clientId = env.PAYPAL_CLIENT_ID;
  const clientSecret = env.PAYPAL_CLIENT_SECRET;
  // Production only when explicitly set to "false"
  const isSandbox = env.PAYPAL_SANDBOX !== "false";

  const baseUrl = isSandbox
    ? "https://api-m.sandbox.paypal.com"
    : "https://api-m.paypal.com";

  return { clientId, clientSecret, baseUrl, isSandbox };
}

/**
 * Fail loud when PayPal is misconfigured for production traffic.
 * Call before creating orders.
 */
export function assertPayPalReady(env) {
  const { clientId, clientSecret, isSandbox } = getPayPalConfig(env);

  if (!clientId || !clientSecret) {
    const err = new Error("PayPal is not configured (missing client credentials).");
    err.code = "PAYPAL_NOT_CONFIGURED";
    throw err;
  }

  // Block accidental live site → sandbox unless ALLOW_PAYPAL_SANDBOX=true
  const siteUrl = env.SITE_URL || "";
  const isProdSite =
    siteUrl.includes("picturebackgroundremover.xyz") ||
    env.NEXT_PUBLIC_SITE_ENV === "production" ||
    env.CF_PAGES_BRANCH === "main";

  if (isSandbox && isProdSite && env.ALLOW_PAYPAL_SANDBOX !== "true") {
    const err = new Error(
      "PayPal is still in sandbox mode. Set PAYPAL_SANDBOX=false and use live credentials."
    );
    err.code = "PAYPAL_SANDBOX_ON_PROD";
    throw err;
  }

  return getPayPalConfig(env);
}

export async function getPayPalAccessToken(env) {
  const { clientId, clientSecret, baseUrl } = getPayPalConfig(env);

  const res = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("PayPal token error:", err);
    throw new Error("Failed to get PayPal access token");
  }

  const data = await res.json();
  return data.access_token;
}

export async function createPayPalOrder(env, { amount, currency = "USD", description, customId }) {
  assertPayPalReady(env);
  const { baseUrl } = getPayPalConfig(env);
  const token = await getPayPalAccessToken(env);
  const siteUrl = env.SITE_URL || "https://picturebackgroundremover.xyz";

  const res = await fetch(`${baseUrl}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: { currency_code: currency, value: amount },
          description,
          custom_id: customId,
        },
      ],
      application_context: {
        brand_name: "BGRemover",
        landing_page: "NO_PREFERENCE",
        user_action: "PAY_NOW",
        return_url: `${siteUrl}/api/payment/paypal/capture`,
        cancel_url: `${siteUrl}/pricing/?payment=cancelled`,
      },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("PayPal create order error:", err);
    throw new Error("Failed to create PayPal order");
  }

  return await res.json();
}

export async function capturePayPalOrder(env, orderId) {
  assertPayPalReady(env);
  const { baseUrl } = getPayPalConfig(env);
  const token = await getPayPalAccessToken(env);

  const res = await fetch(`${baseUrl}/v2/checkout/orders/${orderId}/capture`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("PayPal capture error:", err);
    throw new Error("Failed to capture PayPal order");
  }

  return await res.json();
}

/**
 * Compute prepaid plan end date.
 * @param {{ period?: string }} product
 * @param {Date|string|number} [fromDate] - base date to extend from (default: now).
 *   Pass the current plan_expires_at when renewing the same plan so remaining time is kept.
 */
export function calcPlanExpiry(product, fromDate = new Date()) {
  const base =
    fromDate instanceof Date
      ? new Date(fromDate.getTime())
      : new Date(fromDate || Date.now());

  if (Number.isNaN(base.getTime())) {
    const fallback = new Date();
    if (product?.period === "yearly") {
      fallback.setFullYear(fallback.getFullYear() + 1);
    } else {
      fallback.setMonth(fallback.getMonth() + 1);
    }
    return fallback.toISOString();
  }

  if (product?.period === "yearly") {
    base.setFullYear(base.getFullYear() + 1);
  } else {
    base.setMonth(base.getMonth() + 1);
  }
  return base.toISOString();
}

/**
 * Extract captured amount (USD string) from a PayPal capture/order response.
 */
export function extractCapturedAmount(capture) {
  if (!capture || typeof capture !== "object") return null;
  const unit = capture.purchase_units?.[0];
  const captureRow = unit?.payments?.captures?.[0];
  const value = captureRow?.amount?.value || unit?.amount?.value || null;
  if (value == null) return null;
  return String(value);
}

/**
 * Extract { value, currency } from a PAYMENT.CAPTURE.* webhook resource.
 * Webhook capture resources carry the money on the resource itself, not in
 * purchase_units (that shape is only on order/capture API responses).
 */
export function extractWebhookCaptureAmount(resource) {
  if (!resource || typeof resource !== "object") return null;
  const amount = resource.amount;
  if (!amount || amount.value == null) return null;
  return {
    value: String(amount.value),
    currency: amount.currency_code ? String(amount.currency_code) : null,
  };
}

/**
 * Money check shared by the capture redirect and the webhook fulfiller.
 * Fail-closed: a missing/unparsable amount never fulfills.
 *
 * @param {{ amount_usd?: string, currency?: string }|null} order
 * @param {{ value?: string|number|null, currency?: string|null }|null} captured
 * @returns {{ ok: boolean, reason: string|null }}
 */
export function verifyCapturedAmount(order, captured) {
  if (!order) return { ok: false, reason: "missing_order" };
  if (!captured || captured.value == null) return { ok: false, reason: "missing_amount" };
  if (order.amount_usd == null) return { ok: false, reason: "missing_order_amount" };
  if (!amountsEqual(captured.value, order.amount_usd)) {
    return { ok: false, reason: "amount_mismatch" };
  }

  const expected = String(order.currency || "USD").toUpperCase();
  if (captured.currency && String(captured.currency).toUpperCase() !== expected) {
    return { ok: false, reason: "currency_mismatch" };
  }

  return { ok: true, reason: null };
}

/** Compare money amounts as fixed 2-decimal strings. */
export function amountsEqual(a, b) {
  if (a == null || b == null) return false;
  const na = Number(a);
  const nb = Number(b);
  if (!Number.isFinite(na) || !Number.isFinite(nb)) return false;
  return na.toFixed(2) === nb.toFixed(2);
}
