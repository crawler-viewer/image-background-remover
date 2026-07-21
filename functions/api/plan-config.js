/**
 * Backend plan config — thin adapter over shared/plan-limits.js.
 * Adds maxFileSizeBytes for Workers file validation.
 */
import {
  PLAN_LIMITS,
  getPlanLimits,
  MAX_BATCH_SIZE,
  GUEST_IP_MONTHLY_LIMIT,
} from "../../shared/plan-limits.js";

function toPlanConfig(limits) {
  return {
    code: limits.code,
    monthlyLimit: limits.monthlyLimit,
    maxFileSizeBytes: limits.maxFileSizeMb * 1024 * 1024,
    maxFileSizeMb: limits.maxFileSizeMb,
  };
}

export const PLAN_CONFIG = Object.fromEntries(
  Object.entries(PLAN_LIMITS).map(([key, limits]) => [key, toPlanConfig(limits)])
);

export function getPlanConfig(planCode) {
  return toPlanConfig(getPlanLimits(planCode));
}

export { PLAN_LIMITS, MAX_BATCH_SIZE, GUEST_IP_MONTHLY_LIMIT, getPlanLimits };
