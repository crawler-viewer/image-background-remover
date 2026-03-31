import { json, readSession } from "../auth/_lib";
import { getUserWithSession } from "../auth/db";
import { createPayPalOrder, PRODUCTS } from "./paypal-lib";

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
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

    // Create order in DB
    const db = env.DB;
    const now = new Date().toISOString();
    const orderType = product.type === "credits" ? "credits" : "subscription";

    const dbResult = await db
      .prepare(
        `INSERT INTO payment_orders (user_id, google_sub, order_type, plan_code, credit_amount, amount_usd, currency, status, created_at)
         VALUES (?, ?, ?, ?, ?, ?, 'USD', 'pending', ?)`
      )
      .bind(
        user.id,
        user.google_sub,
        orderType,
        product.planCode || null,
        product.credits || null,
        product.amount,
        now
      )
      .run();

    const internalOrderId = dbResult.meta?.last_row_id || "unknown";

    // Create PayPal order
    const paypalOrder = await createPayPalOrder(env, {
      amount: product.amount,
      description: product.label,
      customId: `${internalOrderId}`,
    });

    // Save PayPal order ID
    await db
      .prepare(`UPDATE payment_orders SET paypal_order_id = ? WHERE id = ?`)
      .bind(paypalOrder.id, internalOrderId)
      .run();

    // Find approval URL
    const approvalLink = paypalOrder.links?.find((l) => l.rel === "approve");

    if (!approvalLink) {
      return json({ error: "Failed to create payment." }, { status: 500 });
    }

    return json({
      paypalOrderId: paypalOrder.id,
      approvalUrl: approvalLink.href,
      internalOrderId,
    });
  } catch (err) {
    console.error("Create checkout error:", err);
    return json({ error: "Failed to create checkout." }, { status: 500 });
  }
}
