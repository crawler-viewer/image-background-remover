/**
 * Single source of truth for prepaid plans + credit packs.
 * Used by PayPal backend (functions/) and Next.js frontend (src/lib/products.ts).
 */
export default {
  pro_monthly: {
    type: "subscription",
    planCode: "pro",
    amount: "9.90",
    period: "monthly",
    label: "Pro — 1 month prepaid",
  },
  pro_yearly: {
    type: "subscription",
    planCode: "pro",
    amount: "99.00",
    period: "yearly",
    label: "Pro — 1 year prepaid",
  },
  business_monthly: {
    type: "subscription",
    planCode: "business",
    amount: "29.90",
    period: "monthly",
    label: "Business — 1 month prepaid",
  },
  business_yearly: {
    type: "subscription",
    planCode: "business",
    amount: "299.00",
    period: "yearly",
    label: "Business — 1 year prepaid",
  },
  credits_20: {
    type: "credits",
    credits: 20,
    amount: "2.90",
    label: "20 Credits",
    badge: null,
  },
  credits_100: {
    type: "credits",
    credits: 100,
    amount: "9.90",
    label: "100 Credits",
    badge: "Popular",
  },
  credits_300: {
    type: "credits",
    credits: 300,
    amount: "24.90",
    label: "300 Credits",
    badge: null,
  },
  credits_800: {
    type: "credits",
    credits: 800,
    amount: "49.90",
    label: "800 Credits",
    badge: "Best Value",
  },
};
