import { planPriceLabel } from "@/lib/products";
import {
  PLAN_LIMITS,
  MAX_BATCH_SIZE,
  getPlanLimits,
  monthlyRemovalsShort,
  maxUploadShort,
  type PlanCode,
} from "@/lib/plan-limits";

export type BillingCycle = "monthly" | "yearly";
export type { PlanCode };

export type PricingPlan = {
  code: PlanCode;
  name: string;
  badge?: string;
  description: string;
  monthlyPriceLabel: string;
  yearlyPriceLabel?: string;
  ctaLabel: string;
  ctaHref: string;
  highlight?: boolean;
  features: string[];
};

const proMonthly = planPriceLabel("pro", "monthly");
const proYearly = planPriceLabel("pro", "yearly");
const businessMonthly = planPriceLabel("business", "monthly");
const businessYearly = planPriceLabel("business", "yearly");

const guest = getPlanLimits("guest");
const free = getPlanLimits("free");
const pro = getPlanLimits("pro");
const business = getPlanLimits("business");

function guestFeatures(): string[] {
  return [
    `${guest.monthlyLimit} removals per month`,
    `Up to ${guest.maxFileSizeMb}MB per image`,
    `Batch up to ${MAX_BATCH_SIZE} images`,
    "Transparent PNG + white JPG",
  ];
}

function freeFeatures(): string[] {
  return [
    `${free.monthlyLimit} removals per month`,
    `Up to ${free.maxFileSizeMb}MB per image`,
    `Batch up to ${MAX_BATCH_SIZE} images`,
    "Transparent PNG + white JPG",
  ];
}

function proFeatures(): string[] {
  return [
    `${pro.monthlyLimit} removals per prepaid month`,
    `Up to ${pro.maxFileSizeMb}MB per image`,
    "Batch processing + white JPG",
    "One-time PayPal payment (no auto-renew)",
  ];
}

function businessFeatures(): string[] {
  return [
    `${business.monthlyLimit} removals per prepaid month`,
    `Up to ${business.maxFileSizeMb}MB per image`,
    "Batch processing + white JPG",
    "One-time PayPal payment (no auto-renew)",
  ];
}

export const pricingPlans: PricingPlan[] = [
  {
    code: "guest",
    name: "Guest",
    description: "Try the tool instantly without an account.",
    monthlyPriceLabel: "Free",
    ctaLabel: "Start Free",
    ctaHref: "/#tool",
    features: guestFeatures(),
  },
  {
    code: "free",
    name: "Free",
    description: "Best for casual users who want more monthly usage and a dashboard.",
    monthlyPriceLabel: "$0",
    ctaLabel: "Sign in for Free",
    ctaHref: "/api/auth/google/login",
    features: freeFeatures(),
  },
  {
    code: "pro",
    name: "Pro",
    badge: "Most Popular",
    description:
      "Prepaid plan for sellers and creators — pay once for a month or year of higher limits.",
    monthlyPriceLabel: proMonthly,
    yearlyPriceLabel: proYearly,
    ctaLabel: "Buy Pro (prepaid)",
    ctaHref: "/pricing#upgrade",
    highlight: true,
    features: proFeatures(),
  },
  {
    code: "business",
    name: "Business",
    description: "Prepaid higher volume for catalogs and teams.",
    monthlyPriceLabel: businessMonthly,
    yearlyPriceLabel: businessYearly,
    ctaLabel: "Buy Business (prepaid)",
    ctaHref: "/pricing#upgrade",
    features: businessFeatures(),
  },
];

export const comparisonRows = [
  {
    label: "Monthly removals",
    guest: monthlyRemovalsShort("guest"),
    free: monthlyRemovalsShort("free"),
    pro: monthlyRemovalsShort("pro"),
    business: monthlyRemovalsShort("business"),
  },
  {
    label: "Max upload size",
    guest: maxUploadShort("guest"),
    free: maxUploadShort("free"),
    pro: maxUploadShort("pro"),
    business: maxUploadShort("business"),
  },
  {
    label: "Account dashboard",
    guest: "—",
    free: "Yes",
    pro: "Yes",
    business: "Yes",
  },
  {
    label: "Usage history",
    guest: "—",
    free: "Basic",
    pro: "Expanded",
    business: "Expanded",
  },
  {
    label: "White background JPG export",
    guest: "Yes",
    free: "Yes",
    pro: "Yes",
    business: "Yes",
  },
  {
    label: "Batch upload (max per run)",
    guest: String(MAX_BATCH_SIZE),
    free: String(MAX_BATCH_SIZE),
    pro: String(MAX_BATCH_SIZE),
    business: String(MAX_BATCH_SIZE),
  },
];

export const pricingFaqs = [
  {
    q: "Is this tool free to try?",
    a: `Yes! Guests get ${guest.monthlyLimit} free removals per month. Sign in for a free account to unlock ${free.monthlyLimit} removals per month. Buy prepaid Pro/Business or credits for higher volume.`,
  },
  {
    q: "Is Pro a recurring subscription?",
    a: "No. Pro and Business are prepaid access periods paid once via PayPal. You get the plan limits until the period ends (about 1 month or 1 year from purchase). There is no automatic renewal — buy again when you need more time.",
  },
  {
    q: "What do I get with Pro?",
    a: `Pro includes ${pro.monthlyLimit} removals per month while your prepaid period is active, larger uploads (up to ${pro.maxFileSizeMb}MB), transparent PNG and white JPG export, and batch processing.`,
  },
  {
    q: "Credits vs Pro — which should I buy?",
    a: `Credits never expire and are best for occasional extra removals after you hit free limits. Pro is better if you consistently need ~${pro.monthlyLimit} removals every month. Example: ${proMonthly.replace("/mo", "")} buys either 100 credits or one prepaid month of Pro (${pro.monthlyLimit}/mo).`,
  },
  {
    q: "Do unused removals roll over?",
    a: "Plan monthly limits reset on the 1st of each month (UTC) and do not roll over. Credit pack balances never expire.",
  },
  {
    q: "What if payment succeeds but my plan does not update?",
    a: "Refresh your account page after PayPal redirects you back. If limits are still wrong after a few minutes, contact support with your PayPal receipt — we can match it to your order.",
  },
  {
    q: "Are uploaded images stored?",
    a: "No. Images are processed in real time and are not permanently stored.",
  },
];

/** Compact feature lines for homepage / marketing cards. */
export function compactPlanFeatures(code: PlanCode): string[] {
  const p = getPlanLimits(code);
  return [`${p.monthlyLimit} removals/month`, `Up to ${p.maxFileSizeMb}MB`];
}

/** Re-export limits map for pages that need raw numbers. */
export { PLAN_LIMITS, MAX_BATCH_SIZE };
