import { capturePayPalOrder } from "../paypal-lib";
import { ensurePaymentSchema, fulfillPaidOrder } from "../fulfill";

function siteBase(env) {
  return env.SITE_URL || "https://picturebackgroundremover.xyz";
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const base = siteBase(env);

  try {
    const url = new URL(request.url);
    const paypalOrderId = url.searchParams.get("token");

    if (!paypalOrderId) {
      return Response.redirect(`${base}/pricing/?payment=error`, 302);
    }

    const capture = await capturePayPalOrder(env, paypalOrderId);

    if (capture.status !== "COMPLETED") {
      console.error("PayPal capture not completed:", capture.status);
      return Response.redirect(`${base}/pricing/?payment=failed`, 302);
    }

    const db = env.DB;
    await ensurePaymentSchema(db);
    const now = new Date().toISOString();

    const order = await db
      .prepare(`SELECT * FROM payment_orders WHERE paypal_order_id = ? LIMIT 1`)
      .bind(paypalOrderId)
      .first();

    if (!order) {
      console.error("Order not found for PayPal ID:", paypalOrderId);
      return Response.redirect(`${base}/pricing/?payment=error`, 302);
    }

    if (order.status === "paid") {
      return Response.redirect(`${base}/account/?payment=success`, 302);
    }

    const result = await fulfillPaidOrder(db, order, now);
    console.log("Capture fulfill:", order.id, result);

    return Response.redirect(`${base}/account/?payment=success`, 302);
  } catch (err) {
    console.error("Capture error:", err);
    return Response.redirect(`${base}/pricing/?payment=error`, 302);
  }
}
