import { planPriceLabel } from "@/lib/products";

export type BillingCycle = "monthly" | "yearly";
export type PlanCode = "guest" | "free" | "pro" | "business";

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

export const pricingPlans: PricingPlan[] = [
  {
    code: "guest",
    name: "Guest",
    description: "Try the tool instantly without an account.",
    monthlyPriceLabel: "Free",
    ctaLabel: "Start Free",
    ctaHref: "/#tool",
    features: [
      "5 removals per month",
      "Up to 10MB per image",
      "Batch up to 20 images",
      "Transparent PNG + white JPG",
    ],
  },
  {
    code: "free",
    name: "Free",
    description: "Best for casual users who want more monthly usage and a dashboard.",
    monthlyPriceLabel: "$0",
    ctaLabel: "Sign in for Free",
    ctaHref: "/api/auth/google/login",
    features: [
      "20 removals per month",
      "Up to 15MB per image",
      "Batch up to 20 images",
      "Transparent PNG + white JPG",
    ],
  },
  {
    code: "pro",
    name: "Pro",
    badge: "Most Popular",
    description: "Prepaid plan for sellers and creators — pay once for a month or year of higher limits.",
    monthlyPriceLabel: proMonthly,
    yearlyPriceLabel: proYearly,
    ctaLabel: "Buy Pro (prepaid)",
    ctaHref: "/pricing#upgrade",
    highlight: true,
    features: [
      "200 removals per prepaid month",
      "Up to 25MB per image",
      "Batch processing + white JPG",
      "One-time PayPal payment (no auto-renew)",
    ],
  },
  {
    code: "business",
    name: "Business",
    description: "Prepaid higher volume for catalogs and teams.",
    monthlyPriceLabel: businessMonthly,
    yearlyPriceLabel: businessYearly,
    ctaLabel: "Buy Business (prepaid)",
    ctaHref: "/pricing#upgrade",
    features: [
      "500 removals per prepaid month",
      "Up to 50MB per image",
      "Batch processing + white JPG",
      "One-time PayPal payment (no auto-renew)",
    ],
  },
];

export const comparisonRows = [
  {
    label: "Monthly removals",
    guest: "5/mo",
    free: "20/mo",
    pro: "200/mo",
    business: "500/mo",
  },
  {
    label: "Max upload size",
    guest: "10MB",
    free: "15MB",
    pro: "25MB",
    business: "50MB",
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
    guest: "20",
    free: "20",
    pro: "20",
    business: "20",
  },
];

export const pricingFaqs = [
  {
    q: "Is this tool free to try?",
    a: "Yes! Guests get 5 free removals per month. Sign in for a free account to unlock 20 removals per month. Buy prepaid Pro/Business or credits for higher volume.",
  },
  {
    q: "Is Pro a recurring subscription?",
    a: "No. Pro and Business are prepaid access periods paid once via PayPal. You get the plan limits until the period ends (about 1 month or 1 year from purchase). There is no automatic renewal — buy again when you need more time.",
  },
  {
    q: "What do I get with Pro?",
    a: "Pro includes 200 removals per month while your prepaid period is active, larger uploads (up to 25MB), transparent PNG and white JPG export, and batch processing.",
  },
  {
    q: "Credits vs Pro — which should I buy?",
    a: `Credits never expire and are best for occasional extra removals after you hit free limits. Pro is better if you consistently need ~200 removals every month. Example: ${proMonthly.replace("/mo", "")} buys either 100 credits or one prepaid month of Pro (200/mo).`,
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
