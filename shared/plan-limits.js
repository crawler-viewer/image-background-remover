/**
 * Single source of truth for plan quotas (monthly removals + upload size + batch cap).
 *
 * Used by:
 * - Backend: functions/api/plan-config.js, functions/api/usage.js
 * - Frontend: src/lib/plan-limits.ts, src/lib/pricing.ts, marketing UI
 *
 * Change limits here only — unit tests assert backend + pricing copy stay aligned.
 */
export const PLAN_LIMITS = {
  guest: {
    code: "guest",
    monthlyLimit: 5,
    maxFileSizeMb: 10,
  },
  free: {
    code: "free",
    monthlyLimit: 20,
    maxFileSizeMb: 15,
  },
  pro: {
    code: "pro",
    monthlyLimit: 200,
    maxFileSizeMb: 25,
  },
  business: {
    code: "business",
    // 500 × ~$0.04 API ≈ $20 cost vs $29.90 price → positive full-use margin
    monthlyLimit: 500,
    maxFileSizeMb: 50,
  },
};

/** Hard cap per batch upload (frontend tool + marketing). */
export const MAX_BATCH_SIZE = 20;

/**
 * Soft IP ceiling for guest abuse (UTC month), independent of cookie id.
 * Clearing cookies cannot exceed this network-level cap.
 */
export const GUEST_IP_MONTHLY_LIMIT = 15;

export function getPlanLimits(planCode) {
  return PLAN_LIMITS[planCode] || PLAN_LIMITS.free;
}

export default PLAN_LIMITS;
