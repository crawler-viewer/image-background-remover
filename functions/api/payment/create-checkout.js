import { json, readSession } from "../auth/_lib.js";
import { getUserWithSession } from "../auth/db.js";
import { createPayPalOrder, PRODUCTS, assertPayPalReady } from "./paypal-lib.js";
import { ensurePaymentSchema } from "./fulfill.js";
import {
  CHECKOUT_MAX_PER_WINDOW,
  CHECKOUT_WINDOW_MS,
} from "../../../shared/rate-limit.js";

/**
 * Cap how many orders one account can open per hour. Every call writes a row
 * and creates a PayPal order, so an unthrottled loop both grows the table and
 * eats the PayPal API quota real buyers depend on.
 *
 * Counted by user_id — it is the indexed column, and the session already
 * identifies the caller.
 *
 * @returns {Promise<number>} orders opened inside the window
 */
async function recentCheckoutCount(db, userId, now = Date.now()) {
  const windowStart = new Date(now - CHECKOUT_WINDOW_MS).toISOString();
  const row = await db
    .prepare(
      `SELECT COUNT(*) AS count
       FROM payment_orders
       WHERE user_id = ?
         AND created_at >= ?`
    )
    .bind(userId, windowStart)
    .first();

  return Number(row?.count || 0);
}

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    try {
      assertPayPalReady(env);
    } catch (cfgErr) {
      console.error("PayPal config:", cfgErr.message);
      return json(
        {
          error:
            cfgErr.code === "PAYPAL_SANDBOX_ON_PROD"
              ? "Payments are temporarily unavailable (sandbox mode on production)."
              : "Payments are temporarily unavailable. Please try again later.",
          code: cfgErr.code || "PAYPAL_ERROR",
        },
        { status: 503 }
      );
    }

    const session = await readSession(request, env);
    const user = await getUserWithSession(env, session);

    if (!user) {
      return json({ error: "Please sign in first." }, { status: 401 });
    }

    const body = await request.json();
    const productId = body.productId;

    if (!productId || !PRODUCTS[productId]) {
      return json({ error: "Invalid product." }, { status: 400 });
    }

    const product = PRODUCTS[productId];
    const db = env.DB;
    await ensurePaymentSchema(db);

    const opened = await recentCheckoutCount(db, user.id);
    if (opened >= CHECKOUT_MAX_PER_WINDOW) {
      console.error(
        JSON.stringify({
          ts: new Date().toISOString(),
          level: "warn",
          event: "checkout_rate_limited",
          userId: user.id,
          opened,
          limit: CHECKOUT_MAX_PER_WINDOW,
        })
      );
      return json(
        {
          error: "Too many checkout attempts. Please wait a few minutes and try again.",
          code: "CHECKOUT_RATE_LIMITED",
          limit: CHECKOUT_MAX_PER_WINDOW,
        },
        {
          status: 429,
          headers: { "Retry-After": String(Math.ceil(CHECKOUT_WINDOW_MS / 1000)) },
        }
      );
    }

    const now = new Date().toISOString();
    // Keep order_type values for backward compatibility; plans are prepaid periods.
    const orderType = product.type === "credits" ? "credits" : "subscription";
    const billingPeriod = product.period || null;

    const dbResult = await db
      .prepare(
        `INSERT INTO payment_orders (
           user_id, google_sub, order_type, plan_code, credit_amount,
           amount_usd, currency, status, created_at, product_id, billing_period
         ) VALUES (?, ?, ?, ?, ?, ?, 'USD', 'pending', ?, ?, ?)`
      )
      .bind(
        user.id,
        user.google_sub,
        orderType,
        product.planCode || null,
        product.credits || null,
        product.amount,
        now,
        productId,
        billingPeriod
      )
      .run();

    const internalOrderId = dbResult.meta?.last_row_id || "unknown";

    let paypalOrder;
    try {
      paypalOrder = await createPayPalOrder(env, {
        amount: product.amount,
        description: product.label,
        customId: `${internalOrderId}:${productId}`,
      });
    } catch (payPalErr) {
      // Do not leave a `pending` row with no PayPal id behind — it can never be
      // fulfilled, so it would only pollute the orders table and the admin
      // report. It still counts toward the window: the PayPal call was made.
      await db
        .prepare(`UPDATE payment_orders SET status = 'failed' WHERE id = ? AND status = 'pending'`)
        .bind(internalOrderId)
        .run()
        .catch(() => {});
      throw payPalErr;
    }

    await db
      .prepare(`UPDATE payment_orders SET paypal_order_id = ? WHERE id = ?`)
      .bind(paypalOrder.id, internalOrderId)
      .run();

    const approvalLink = paypalOrder.links?.find((l) => l.rel === "approve");

    if (!approvalLink) {
      return json({ error: "Failed to create payment." }, { status: 500 });
    }

    return json({
      paypalOrderId: paypalOrder.id,
      approvalUrl: approvalLink.href,
      internalOrderId,
      productId,
      prepaid: product.type === "subscription",
    });
  } catch (err) {
    console.error("Create checkout error:", err);
    return json(
      {
        error: err.message?.includes("sandbox")
          ? err.message
          : "Failed to create checkout.",
        code: err.code || "CHECKOUT_ERROR",
      },
      { status: 500 }
    );
  }
}
