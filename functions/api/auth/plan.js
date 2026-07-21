import { getPlanConfig } from "../plan-config.js";

const PREPAID_PLANS = new Set(["pro", "business"]);

export function isPrepaidPlan(planCode) {
  return PREPAID_PLANS.has(planCode);
}

/**
 * @param {string|null|undefined} planExpiresAt
 * @param {Date} [now]
 */
export function isPlanExpired(planExpiresAt, now = new Date()) {
  if (!planExpiresAt) return false;
  const expiresMs = new Date(planExpiresAt).getTime();
  if (Number.isNaN(expiresMs)) return false;
  return expiresMs <= now.getTime();
}

/**
 * Pure helper: effective plan without DB writes. Safe for unit tests.
 *
 * @param {{ plan?: string, plan_expires_at?: string|null }|null|undefined} user
 * @param {Date} [now]
 */
export function computeActivePlan(user, now = new Date()) {
  if (!user) {
    return {
      planCode: "guest",
      expired: false,
      previousPlan: null,
      /** Original expiry timestamp when expired (for UI); null if not prepaid */
      planExpiresAt: null,
      needsDowngrade: false,
    };
  }

  const rawPlan = user.plan || "free";
  const rawExpires = user.plan_expires_at || null;

  if (isPrepaidPlan(rawPlan) && isPlanExpired(rawExpires, now)) {
    return {
      planCode: "free",
      expired: true,
      previousPlan: rawPlan,
      planExpiresAt: rawExpires,
      needsDowngrade: true,
    };
  }

  return {
    planCode: rawPlan,
    expired: false,
    previousPlan: null,
    planExpiresAt: isPrepaidPlan(rawPlan) ? rawExpires : null,
    needsDowngrade: false,
  };
}

/**
 * Resolve plan for a logged-in user row; persist downgrade when prepaid expired.
 *
 * @param {{ DB?: D1Database }} env
 * @param {{ google_sub?: string, plan?: string, plan_expires_at?: string|null }|null|undefined} user
 * @param {Date} [now]
 */
export async function resolveActivePlan(env, user, now = new Date()) {
  const resolved = computeActivePlan(user, now);
  const plan = getPlanConfig(resolved.planCode);

  if (resolved.needsDowngrade && user?.google_sub && env?.DB) {
    try {
      await env.DB
        .prepare(
          `UPDATE users SET plan = 'free', plan_expires_at = NULL, updated_at = ? WHERE google_sub = ?`
        )
        .bind(now.toISOString(), user.google_sub)
        .run();
    } catch (e) {
      console.error("Failed to downgrade expired plan:", e);
    }
  }

  return {
    ...resolved,
    plan,
  };
}

/**
 * Expiry metadata for account UI.
 * @param {string|null|undefined} planExpiresAt
 * @param {{ forceExpired?: boolean }} [options]
 */
export function planExpiryInfo(planExpiresAt, options = {}) {
  if (options.forceExpired && planExpiresAt) {
    return {
      plan_expires_at: planExpiresAt,
      plan_expired: true,
      plan_days_remaining: 0,
    };
  }

  if (!planExpiresAt) {
    return {
      plan_expires_at: null,
      plan_expired: false,
      plan_days_remaining: null,
    };
  }

  const expiresMs = new Date(planExpiresAt).getTime();
  if (Number.isNaN(expiresMs)) {
    return {
      plan_expires_at: planExpiresAt,
      plan_expired: false,
      plan_days_remaining: null,
    };
  }

  const msLeft = expiresMs - Date.now();
  const days = Math.ceil(msLeft / 86400000);

  return {
    plan_expires_at: planExpiresAt,
    plan_expired: msLeft <= 0,
    plan_days_remaining: days,
  };
}
