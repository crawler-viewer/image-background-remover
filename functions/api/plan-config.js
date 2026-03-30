export const PLAN_CONFIG = {
  guest: {
    code: "guest",
    dailyLimit: 3,
    maxFileSizeBytes: 10 * 1024 * 1024,
  },
  free: {
    code: "free",
    dailyLimit: 10,
    maxFileSizeBytes: 25 * 1024 * 1024,
  },
  pro: {
    code: "pro",
    dailyLimit: 100,
    maxFileSizeBytes: 50 * 1024 * 1024,
  },
};

export function getPlanConfig(planCode) {
  return PLAN_CONFIG[planCode] || PLAN_CONFIG.free;
}
