import { capturePayPalOrder, PRODUCTS, calcPlanExpiry } from "../paypal-lib";

export async function onRequestGet(context) {
  const { request, env } = context;

  try {
    const url = new URL(request.url);
    const paypalOrderId = url.searchParams.get("token");

    if (!paypalOrderId) {
      return Response.redirect(`${env.SITE_URL || "https://picturebackgroundremover.xyz"}/pricing?payment=error`, 302);
    }

    // Capture payment
    const capture = await capturePayPalOrder(env, paypalOrderId);

    if (capture.status !== "COMPLETED") {
      console.error("PayPal capture not completed:", capture.status);
      return Response.redirect(`${env.SITE_URL || "https://picturebackgroundremover.xyz"}/pricing?payment=failed`, 302);
    }

    const db = env.DB;
    const now = new Date().toISOString();

    // Find our order
    const order = await db
      .prepare(`SELECT * FROM payment_orders WHERE paypal_order_id = ? LIMIT 1`)
      .bind(paypalOrderId)
      .first();

    if (!order) {
      console.error("Order not found for PayPal ID:", paypalOrderId);
      return Response.redirect(`${env.SITE_URL || "https://picturebackgroundremover.xyz"}/pricing?payment=error`, 302);
    }

    // Prevent duplicate processing
    if (order.status === "paid") {
      console.log("Order already paid, skipping:", order.id);
      return Response.redirect(`${env.SITE_URL || "https://picturebackgroundremover.xyz"}/account?payment=success`, 302);
    }

    // Mark order as paid
    await db
      .prepare(`UPDATE payment_orders SET status = 'paid', paid_at = ? WHERE id = ?`)
      .bind(now, order.id)
      .run();

    // Apply the purchase
    if (order.order_type === "subscription" && order.plan_code) {
      // Find product to determine period
      const productEntry = Object.values(PRODUCTS).find(
        (p) => p.type === "subscription" && p.planCode === order.plan_code && p.amount === order.amount_usd
      );
      const expiresAt = productEntry ? calcPlanExpiry(productEntry) : new Date(Date.now() + 30 * 86400000).toISOString();

      await db
        .prepare(`UPDATE users SET plan = ?, plan_expires_at = ?, updated_at = ? WHERE google_sub = ?`)
        .bind(order.plan_code, expiresAt, now, order.google_sub)
        .run();
    } else if (order.order_type === "credits" && order.credit_amount) {
      // Add credits
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
    }

    return Response.redirect(`${env.SITE_URL || "https://picturebackgroundremover.xyz"}/account?payment=success`, 302);
  } catch (err) {
    console.error("Capture error:", err);
    return Response.redirect(`${env.SITE_URL || "https://picturebackgroundremover.xyz"}/pricing?payment=error`, 302);
  }
}
