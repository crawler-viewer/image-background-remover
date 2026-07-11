export const PLAN_CONFIG = {
  guest: {
    code: "guest",
    monthlyLimit: 5,
    maxFileSizeBytes: 10 * 1024 * 1024,
  },
  free: {
    code: "free",
    monthlyLimit: 20,
    maxFileSizeBytes: 15 * 1024 * 1024,
  },
  pro: {
    code: "pro",
    monthlyLimit: 200,
    maxFileSizeBytes: 25 * 1024 * 1024,
  },
  business: {
    code: "business",
    // 500 × ~$0.04 API ≈ $20 cost vs $29.90 price → positive full-use margin
    monthlyLimit: 500,
    maxFileSizeBytes: 50 * 1024 * 1024,
  },
};

export function getPlanConfig(planCode) {
  return PLAN_CONFIG[planCode] || PLAN_CONFIG.free;
}
