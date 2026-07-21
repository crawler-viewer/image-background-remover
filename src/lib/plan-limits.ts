/**
 * Frontend plan limits — re-exports shared/plan-limits.js
 * (same file as Cloudflare Functions plan-config).
 */

import {
  PLAN_LIMITS as PLAN_LIMITS_RAW,
  MAX_BATCH_SIZE as MAX_BATCH_SIZE_RAW,
  GUEST_IP_MONTHLY_LIMIT as GUEST_IP_MONTHLY_LIMIT_RAW,
  getPlanLimits as getPlanLimitsRaw,
} from "../../shared/plan-limits.js";

export type PlanCode = "guest" | "free" | "pro" | "business";

export type PlanLimits = {
  code: PlanCode;
  monthlyLimit: number;
  maxFileSizeMb: number;
};

export const PLAN_LIMITS = PLAN_LIMITS_RAW as Record<PlanCode, PlanLimits>;
export const MAX_BATCH_SIZE = MAX_BATCH_SIZE_RAW as number;
export const GUEST_IP_MONTHLY_LIMIT = GUEST_IP_MONTHLY_LIMIT_RAW as number;

export function getPlanLimits(planCode: string | null | undefined): PlanLimits {
  return getPlanLimitsRaw(planCode) as PlanLimits;
}

/** e.g. "5/mo" */
export function monthlyRemovalsShort(planCode: PlanCode): string {
  return `${getPlanLimits(planCode).monthlyLimit}/mo`;
}

/** e.g. "10MB" */
export function maxUploadShort(planCode: PlanCode): string {
  return `${getPlanLimits(planCode).maxFileSizeMb}MB`;
}
