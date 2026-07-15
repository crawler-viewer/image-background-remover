import { PRODUCTS, calcPlanExpiry } from "./paypal-lib.js";

/**
 * Ensure newer payment_orders columns exist (idempotent for D1).
 */
export async function ensurePaymentSchema(db) {
  if (!db) return;
  const alters = [
    `ALTER TABLE payment_orders ADD COLUMN product_id TEXT`,
    `ALTER TABLE payment_orders ADD COLUMN billing_period TEXT`,
  ];
  for (const sql of alters) {
    try {
      await db.prepare(sql).run();
    } catch {
      // column already exists
    }
  }
}

export function getProductById(productId) {
  if (!productId) return null;
  return PRODUCTS[productId] || null;
}

/**
 * Resolve plan product for expiry calculation.
 * Prefer product_id; fall back to plan_code + amount for legacy rows.
 */
export function resolvePlanProduct(order) {
  if (order.product_id && PRODUCTS[order.product_id]) {
    return PRODUCTS[order.product_id];
  }
  if (order.order_type === "subscription" && order.plan_code) {
    return (
      Object.values(PRODUCTS).find(
        (p) =>
          p.type === "subscription" &&
          p.planCode === order.plan_code &&
          p.amount === order.amount_usd
      ) || null
    );
  }
  return null;
}

/**
 * Pick the base date for prepaid period extension.
 * - Renewing the same active plan → extend from current plan_expires_at (keep remaining time).
 * - Upgrade / new plan / expired → start from now.
 *
 * Exported for unit tests.
 */
export function resolvePlanExtensionBase(userRow, newPlanCode, nowMs = Date.now()) {
  const now = new Date(nowMs);
  if (!userRow || !newPlanCode) return now;

  const currentPlan = userRow.plan || "free";
  const expiresAt = userRow.plan_expires_at ? new Date(userRow.plan_expires_at) : null;
  const stillActive =
    expiresAt && !Number.isNaN(expiresAt.getTime()) && expiresAt.getTime() > nowMs;

  // Same prepaid plan still active → stack the new period on top of remaining time
  if (currentPlan === newPlanCode && stillActive) {
    return expiresAt;
  }

  return now;
}

/**
 * Atomically mark order paid and apply plan/credits.
 * Safe if called from both capture redirect and webhook.
 */
export async function fulfillPaidOrder(db, order, now = new Date().toISOString()) {
  if (!db || !order) {
    return { applied: false, reason: "missing" };
  }

  // Claim the pending order so only one fulfiller wins
  const claim = await db
    .prepare(
      `UPDATE payment_orders
       SET status = 'paid', paid_at = ?
       WHERE id = ? AND status = 'pending'`
    )
    .bind(now, order.id)
    .run();

  const changed = Number(claim?.meta?.changes || 0);
  if (changed === 0) {
    // Already paid or missing
    const current = await db
      .prepare(`SELECT status FROM payment_orders WHERE id = ? LIMIT 1`)
      .bind(order.id)
      .first();
    return {
      applied: false,
      reason: current?.status === "paid" ? "already_paid" : "not_pending",
      order,
    };
  }

  if (order.order_type === "subscription" && order.plan_code) {
    const product = resolvePlanProduct(order);

    let userRow = null;
    try {
      userRow = await db
        .prepare(`SELECT plan, plan_expires_at FROM users WHERE google_sub = ? LIMIT 1`)
        .bind(order.google_sub)
        .first();
    } catch (e) {
      console.error("fulfill: failed to load user for plan extension:", e);
    }

    const baseDate = resolvePlanExtensionBase(userRow, order.plan_code, Date.now());
    const expiresAt = product
      ? calcPlanExpiry(product, baseDate)
      : new Date(baseDate.getTime() + 30 * 86400000).toISOString();

    const extended =
      userRow?.plan === order.plan_code &&
      userRow?.plan_expires_at &&
      new Date(userRow.plan_expires_at).getTime() > Date.now();

    await db
      .prepare(
        `UPDATE users SET plan = ?, plan_expires_at = ?, updated_at = ? WHERE google_sub = ?`
      )
      .bind(order.plan_code, expiresAt, now, order.google_sub)
      .run();

    return {
      applied: true,
      kind: "plan",
      plan: order.plan_code,
      expiresAt,
      extended: Boolean(extended),
      productId: order.product_id || null,
    };
  }

  if (order.order_type === "credits" && order.credit_amount) {
    await db
      .prepare(
        `INSERT INTO user_credits (user_id, google_sub, balance, updated_at)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(google_sub) DO UPDATE SET
           balance = balance + excluded.balance,
           updated_at = excluded.updated_at`
      )
      .bind(order.user_id, order.google_sub, order.credit_amount, now)
      .run();

    return {
      applied: true,
      kind: "credits",
      credits: order.credit_amount,
      productId: order.product_id || null,
    };
  }

  return { applied: false, reason: "unknown_order_type", order };
}

/**
 * Build account success redirect query from order + fulfill result.
 * Includes amount for GA4 purchase value tracking on the client.
 */
export function buildPaymentSuccessQuery(order, fulfillResult = {}) {
  const params = new URLSearchParams({ payment: "success" });

  if (order?.id != null) params.set("order", String(order.id));
  if (order?.product_id) params.set("product", String(order.product_id));
  if (order?.amount_usd != null) params.set("amount", String(order.amount_usd));

  if (fulfillResult.kind === "plan" || order?.order_type === "subscription") {
    params.set("kind", "plan");
    const plan = fulfillResult.plan || order?.plan_code;
    if (plan) params.set("plan", String(plan));
    const expiresAt = fulfillResult.expiresAt;
    if (expiresAt) params.set("expires", String(expiresAt));
    if (fulfillResult.extended) params.set("extended", "1");
  } else if (fulfillResult.kind === "credits" || order?.order_type === "credits") {
    params.set("kind", "credits");
    const credits = fulfillResult.credits ?? order?.credit_amount;
    if (credits != null) params.set("credits", String(credits));
  }

  return params.toString();
}
