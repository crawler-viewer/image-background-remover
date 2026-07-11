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
    description: "Built for sellers, creators, and power users who need more volume.",
    monthlyPriceLabel: "$9.9/mo",
    yearlyPriceLabel: "$99/yr",
    ctaLabel: "Upgrade to Pro",
    ctaHref: "/pricing#upgrade",
    highlight: true,
    features: [
      "200 removals per month",
      "Up to 25MB per image",
      "Batch processing + white JPG",
      "Expanded usage history",
    ],
  },
  {
    code: "business",
    name: "Business",
    description: "For teams and high-volume workflows.",
    monthlyPriceLabel: "$29.9/mo",
    yearlyPriceLabel: "$299/yr",
    ctaLabel: "Go Business",
    ctaHref: "/pricing#upgrade",
    features: [
      "500 removals per month",
      "Up to 50MB per image",
      "Batch processing + white JPG",
      "Future API access",
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
    a: "Yes! Guests get 5 free removals per month. Sign in for a free account to unlock 20 removals per month. Upgrade for even higher limits.",
  },
  {
    q: "Why should I create an account?",
    a: "A free account gives you 4x more monthly removals (20/mo vs 5/mo), access to your personal dashboard, and usage tracking.",
  },
  {
    q: "What do I get with Pro?",
    a: "Pro gives you 200 removals per month, larger upload sizes (up to 25MB), transparent PNG and Amazon-ready white JPG export, and expanded usage history.",
  },
  {
    q: "Do unused removals roll over?",
    a: "No. Monthly limits reset on the 1st of each month.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. You can cancel your subscription anytime with no questions asked.",
  },
  {
    q: "Are uploaded images stored?",
    a: "No. Images are processed in real time and are not permanently stored.",
  },
];
