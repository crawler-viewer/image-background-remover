export type BillingCycle = "monthly" | "yearly";
export type PlanCode = "guest" | "free" | "pro";

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
      "3 removals per day",
      "Up to 10MB per image",
      "Transparent PNG downloads",
      "No account dashboard",
      "No saved history",
    ],
  },
  {
    code: "free",
    name: "Free",
    description: "Best for casual users who want more daily access and an account dashboard.",
    monthlyPriceLabel: "$0",
    ctaLabel: "Sign in for Free",
    ctaHref: "/api/auth/google/login",
    features: [
      "10 removals per day",
      "Up to 25MB per image",
      "Personal account center",
      "Recent activity tracking",
      "Daily quota tracking",
    ],
  },
  {
    code: "pro",
    name: "Pro",
    badge: "Most Popular",
    description: "Built for sellers, creators, and power users who need higher limits.",
    monthlyPriceLabel: "$9.9/mo",
    yearlyPriceLabel: "$79/yr",
    ctaLabel: "Upgrade to Pro",
    ctaHref: "/pricing#upgrade",
    highlight: true,
    features: [
      "100 removals per day",
      "Up to 50MB per image",
      "Priority processing",
      "Expanded usage history",
      "Future premium features",
    ],
  },
];

export const comparisonRows = [
  {
    label: "Daily removals",
    guest: "3/day",
    free: "10/day",
    pro: "100/day",
  },
  {
    label: "Max upload size",
    guest: "10MB",
    free: "25MB",
    pro: "50MB",
  },
  {
    label: "Account dashboard",
    guest: "—",
    free: "Yes",
    pro: "Yes",
  },
  {
    label: "Recent activity",
    guest: "—",
    free: "Basic",
    pro: "Expanded",
  },
  {
    label: "Priority processing",
    guest: "—",
    free: "—",
    pro: "Yes",
  },
];

export const pricingFaqs = [
  {
    q: "Is this tool free to try?",
    a: "Yes. Guests get 3 removals per day, and signed-in users get 10 removals per day for free.",
  },
  {
    q: "Why should I create an account?",
    a: "A free account gives you more daily removals, access to your personal dashboard, and recent activity tracking.",
  },
  {
    q: "What do I get with Pro?",
    a: "Pro gives you higher daily limits, larger upload sizes, faster processing priority, and more account features.",
  },
  {
    q: "Do unused removals roll over?",
    a: "No. Daily free quota resets every day.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. You can cancel anytime.",
  },
  {
    q: "Are uploaded images stored?",
    a: "No. Images are processed in real time and are not permanently stored.",
  },
];
