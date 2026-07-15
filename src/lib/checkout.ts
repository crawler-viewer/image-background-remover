/**
 * Shared PayPal checkout helpers for pricing + credits pages + in-tool upsell.
 */

import { trackBeginCheckout, trackEvent } from "@/lib/analytics";
import { getProduct, isProductId, parseMoneyValueFromProduct } from "@/lib/products";

export type CheckoutResult =
  | { ok: true; approvalUrl: string }
  | { ok: false; error: string; code?: string; needsAuth?: boolean };

export type CheckoutSource = "pricing" | "credits" | "tool";

/** Relative path used after Google login to resume checkout. */
export function checkoutReturnPath(productId: string, source: CheckoutSource): string {
  if (source === "credits" || source === "tool") {
    if (productId.startsWith("credits_")) {
      return `/credits/?buy=${encodeURIComponent(productId)}`;
    }
  }
  return `/pricing/?buy=${encodeURIComponent(productId)}`;
}

export function googleLoginUrl(returnPath: string): string {
  return `/api/auth/google/login?return=${encodeURIComponent(returnPath)}`;
}

/**
 * Create a PayPal checkout session. On 401, returns needsAuth so the UI can redirect to login.
 */
export async function startCheckout(
  productId: string,
  meta?: {
    product_type?: string;
    plan?: string;
    billing_cycle?: string;
    source?: string;
  }
): Promise<CheckoutResult> {
  const product = getProduct(productId);
  const value = parseMoneyValueFromProduct(product);
  const productType =
    meta?.product_type ||
    (product?.type === "credits" ? "credits" : product?.type === "subscription" ? "prepaid_plan" : undefined);

  trackBeginCheckout({
    productId,
    value,
    currency: "USD",
    productType,
    plan: meta?.plan || (product && product.type === "subscription" ? product.planCode : undefined),
    billingCycle:
      meta?.billing_cycle ||
      (product && product.type === "subscription" ? product.period : undefined),
    source: meta?.source,
  });

  try {
    const res = await fetch("/api/payment/create-checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId }),
    });

    const data = (await res.json().catch(() => ({}))) as {
      approvalUrl?: string;
      error?: string;
      code?: string;
    };

    if (res.status === 401) {
      trackEvent("checkout_error", {
        product_id: productId,
        reason: "auth_required",
        value,
      });
      return {
        ok: false,
        error: data.error || "Please sign in first.",
        code: "AUTH_REQUIRED",
        needsAuth: true,
      };
    }

    if (data.approvalUrl) {
      trackEvent("checkout_redirect_paypal", {
        product_id: productId,
        value,
        source: meta?.source,
      });
      return { ok: true, approvalUrl: data.approvalUrl };
    }

    trackEvent("checkout_error", {
      product_id: productId,
      reason: data.error || data.code || "unknown",
      value,
    });
    return {
      ok: false,
      error: data.error || "Failed to create checkout",
      code: data.code,
    };
  } catch {
    trackEvent("checkout_error", { product_id: productId, reason: "network", value });
    return { ok: false, error: "Payment error. Please try again.", code: "NETWORK" };
  }
}

/** Kick off checkout or redirect to Google login with return URL. */
export async function startCheckoutOrLogin(
  productId: string,
  source: CheckoutSource,
  meta?: { product_type?: string; plan?: string; billing_cycle?: string }
): Promise<{ redirected: true } | { redirected: false; error: string }> {
  const result = await startCheckout(productId, { ...meta, source });

  if (result.ok) {
    window.location.href = result.approvalUrl;
    return { redirected: true };
  }

  if (result.needsAuth) {
    trackEvent("checkout_login_redirect", { product_id: productId, source });
    window.location.href = googleLoginUrl(checkoutReturnPath(productId, source));
    return { redirected: true };
  }

  return { redirected: false, error: result.error };
}

export function parseBuyProductId(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const id = raw.trim();
  if (!isProductId(id)) return null;
  return id;
}
