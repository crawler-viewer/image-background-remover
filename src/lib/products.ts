/**
 * Frontend product catalog — re-exports shared/products.json (same file as PayPal backend).
 */

import productsRaw from "../../shared/products.js";

export type PlanProduct = {
  type: "subscription";
  planCode: "pro" | "business";
  amount: string;
  period: "monthly" | "yearly";
  label: string;
};

export type CreditProduct = {
  type: "credits";
  credits: number;
  amount: string;
  label: string;
  badge?: string | null;
};

export type Product = PlanProduct | CreditProduct;

export type ProductId = string;

export const PRODUCTS = productsRaw as Record<string, Product>;

export const PRODUCT_IDS = Object.keys(PRODUCTS) as ProductId[];

export function isProductId(value: string | null | undefined): value is ProductId {
  return !!value && value in PRODUCTS;
}

export function getProduct(id: string): Product | null {
  return PRODUCTS[id] || null;
}

/** Format "9.90" → "$9.90" */
export function formatUsd(amount: string | number): string {
  const n = typeof amount === "number" ? amount : Number(amount);
  if (!Number.isFinite(n)) return `$${amount}`;
  return `$${n.toFixed(2)}`;
}

/** Numeric amount for analytics / GA4 value. */
export function parseMoneyValueFromProduct(product: Product | null | undefined): number | undefined {
  if (!product?.amount) return undefined;
  const n = Number(product.amount);
  if (!Number.isFinite(n)) return undefined;
  return Math.round(n * 100) / 100;
}

/** Short price label for marketing: "9.90" → "$9.9" when trailing zero */
export function formatUsdShort(amount: string | number): string {
  const n = typeof amount === "number" ? amount : Number(amount);
  if (!Number.isFinite(n)) return `$${amount}`;
  const fixed = n.toFixed(2).replace(/\.?0+$/, "");
  return `$${fixed}`;
}

export type CreditPack = {
  id: string;
  credits: number;
  amount: string;
  priceLabel: string;
  perUnitLabel: string;
  badge: string | null;
  label: string;
};

/** Credit packs for /credits and in-tool upsell, sorted by credit count. */
export function getCreditPacks(): CreditPack[] {
  return Object.entries(PRODUCTS)
    .filter((entry): entry is [string, CreditProduct] => entry[1].type === "credits")
    .map(([id, p]) => {
      const per = Number(p.amount) / p.credits;
      return {
        id,
        credits: p.credits,
        amount: p.amount,
        priceLabel: formatUsd(p.amount),
        perUnitLabel: `$${per.toFixed(3).replace(/0+$/, "").replace(/\.$/, "")} per removal`,
        badge: p.badge ?? null,
        label: p.label,
      };
    })
    .sort((a, b) => a.credits - b.credits);
}

/** Smallest credit pack — primary in-tool upsell. */
export function getMinCreditPack(): CreditPack {
  const packs = getCreditPacks();
  return packs[0];
}

/** Popular credit pack (badge) or second-smallest. */
export function getPopularCreditPack(): CreditPack {
  const packs = getCreditPacks();
  return packs.find((p) => p.badge === "Popular") || packs[1] || packs[0];
}

export function planPriceLabel(planCode: "pro" | "business", period: "monthly" | "yearly"): string {
  const id = `${planCode}_${period}`;
  const p = PRODUCTS[id];
  if (!p || p.type !== "subscription") return "";
  const short = formatUsdShort(p.amount);
  return period === "yearly" ? `${short}/yr` : `${short}/mo`;
}
