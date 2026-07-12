import { json, readSession } from "../auth/_lib";
import { getUserWithSession } from "../auth/db";
import { createPayPalOrder, PRODUCTS, assertPayPalReady } from "./paypal-lib";
import { ensurePaymentSchema } from "./fulfill";

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

    const paypalOrder = await createPayPalOrder(env, {
      amount: product.amount,
      description: product.label,
      customId: `${internalOrderId}:${productId}`,
    });

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
