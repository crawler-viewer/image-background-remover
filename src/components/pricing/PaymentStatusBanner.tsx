"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { parseMoneyValue, trackEvent, trackPurchase } from "@/lib/analytics";

type Banner = {
  tone: "ok" | "warn" | "danger" | "info";
  title: string;
  body: string;
};

export function PaymentStatusBanner() {
  const [banner, setBanner] = useState<Banner | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const payment = params.get("payment");
    if (!payment) return;

    if (payment === "cancelled") {
      setBanner({
        tone: "warn",
        title: "Checkout cancelled",
        body: "You left PayPal before completing payment. No charge was made. You can try again anytime.",
      });
      trackEvent("checkout_error", { reason: "cancelled" });
    } else if (payment === "failed") {
      setBanner({
        tone: "danger",
        title: "Payment not completed",
        body: "PayPal did not confirm the capture. Please try again, or use a different payment method in PayPal.",
      });
      trackEvent("checkout_error", { reason: "failed" });
    } else if (payment === "error") {
      const reason = params.get("reason");
      setBanner({
        tone: "danger",
        title: "Something went wrong",
        body:
          reason === "amount"
            ? "PayPal amount did not match the order. No plan/credits were applied. Contact support with your PayPal receipt if you were charged."
            : "We could not finish activating your purchase. If PayPal charged you, open Account in a few minutes or contact support with your receipt.",
      });
      trackEvent("checkout_error", { reason: reason || "error" });
    } else if (payment === "success") {
      setBanner({
        tone: "ok",
        title: "Payment successful",
        body: "Prepaid access or credits should now be active. Open your account to confirm limits and expiry.",
      });
      trackPurchase({
        status: "success",
        source: "pricing",
        productId: params.get("product"),
        value: parseMoneyValue(params.get("amount")),
        orderId: params.get("order"),
        kind: params.get("kind"),
        plan: params.get("plan"),
        credits: params.get("credits") ? Number(params.get("credits")) : null,
        extended: params.get("extended") === "1",
      });
    }

    for (const key of [
      "payment",
      "reason",
      "kind",
      "plan",
      "credits",
      "product",
      "amount",
      "order",
      "extended",
      "expires",
    ]) {
      params.delete(key);
    }
    const next = window.location.pathname + (params.toString() ? `?${params.toString()}` : "");
    window.history.replaceState({}, "", next);
  }, []);

  if (!banner) return null;

  const styles =
    banner.tone === "ok"
      ? "border-emerald-500/30 bg-emerald-50 text-emerald-950"
      : banner.tone === "warn"
        ? "border-amber-500/30 bg-amber-50 text-amber-950"
        : banner.tone === "danger"
          ? "border-red-500/30 bg-red-50 text-red-950"
          : "border-black/10 bg-white text-neutral-800";

  return (
    <div className="mx-auto max-w-5xl px-4 pt-6">
      <div className={`rounded-2xl border px-5 py-4 text-sm shadow-sm ${styles}`}>
        <p className="font-semibold">{banner.title}</p>
        <p className="mt-1 opacity-90">{banner.body}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {banner.tone === "ok" ? (
            <Link
              href="/account/"
              className="inline-flex rounded-lg bg-neutral-950 px-3 py-1.5 text-xs font-medium text-white"
            >
              View account
            </Link>
          ) : (
            <>
              <button
                type="button"
                onClick={() => window.scrollTo({ top: 400, behavior: "smooth" })}
                className="inline-flex rounded-lg bg-neutral-950 px-3 py-1.5 text-xs font-medium text-white"
              >
                Try checkout again
              </button>
              <Link
                href="/credits/"
                className="inline-flex rounded-lg border border-black/10 bg-white px-3 py-1.5 text-xs font-medium text-neutral-800"
              >
                Buy credits instead
              </Link>
            </>
          )}
          <button
            type="button"
            onClick={() => setBanner(null)}
            className="inline-flex rounded-lg px-3 py-1.5 text-xs text-neutral-600 underline-offset-2 hover:underline"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
