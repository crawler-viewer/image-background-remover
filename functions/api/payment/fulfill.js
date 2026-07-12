import { PRODUCTS, calcPlanExpiry } from "./paypal-lib";

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
    };
  }

  if (order.order_type === "subscription" && order.plan_code) {
    const product = resolvePlanProduct(order);
    const expiresAt = product
      ? calcPlanExpiry(product)
      : new Date(Date.now() + 30 * 86400000).toISOString();

    await db
      .prepare(
        `UPDATE users SET plan = ?, plan_expires_at = ?, updated_at = ? WHERE google_sub = ?`
      )
      .bind(order.plan_code, expiresAt, now, order.google_sub)
      .run();

    return { applied: true, kind: "plan", plan: order.plan_code, expiresAt };
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

    return { applied: true, kind: "credits", credits: order.credit_amount };
  }

  return { applied: false, reason: "unknown_order_type" };
}
