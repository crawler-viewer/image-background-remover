import { getPayPalConfig, getPayPalAccessToken } from "../paypal-lib.js";
import { ensurePaymentSchema, fulfillPaidOrder } from "../fulfill.js";

async function verifyWebhookSignature(env, headers, body) {
  const { baseUrl } = getPayPalConfig(env);
  const token = await getPayPalAccessToken(env);
  const webhookId = env.PAYPAL_WEBHOOK_ID;

  if (!webhookId) {
    console.error("Missing PAYPAL_WEBHOOK_ID");
    return false;
  }

  const res = await fetch(`${baseUrl}/v1/notifications/verify-webhook-signature`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      auth_algo: headers.get("paypal-auth-algo"),
      cert_url: headers.get("paypal-cert-url"),
      transmission_id: headers.get("paypal-transmission-id"),
      transmission_sig: headers.get("paypal-transmission-sig"),
      transmission_time: headers.get("paypal-transmission-time"),
      webhook_id: webhookId,
      webhook_event: JSON.parse(body),
    }),
  });

  if (!res.ok) {
    console.error("Webhook verification failed:", await res.text());
    return false;
  }

  const result = await res.json();
  return result.verification_status === "SUCCESS";
}

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const body = await request.text();

    if (env.PAYPAL_WEBHOOK_ID) {
      const valid = await verifyWebhookSignature(env, request.headers, body);
      if (!valid) {
        console.error("Invalid webhook signature");
        return new Response("Invalid signature", { status: 401 });
      }
    }

    const event = JSON.parse(body);
    const eventType = event.event_type;
    const db = env.DB;
    await ensurePaymentSchema(db);
    const now = new Date().toISOString();

    console.log("PayPal webhook event:", eventType);

    if (eventType === "CHECKOUT.ORDER.APPROVED") {
      console.log("Order approved via webhook:", event.resource?.id);
    }

    if (eventType === "PAYMENT.CAPTURE.COMPLETED") {
      const capture = event.resource;
      const paypalOrderId = capture?.supplementary_data?.related_ids?.order_id;

      if (!paypalOrderId) {
        console.log("Capture event without order ID, skipping");
        return new Response("OK", { status: 200 });
      }

      const order = await db
        .prepare(`SELECT * FROM payment_orders WHERE paypal_order_id = ? LIMIT 1`)
        .bind(paypalOrderId)
        .first();

      if (!order) {
        console.error("Webhook: order not found for PayPal ID:", paypalOrderId);
        return new Response("OK", { status: 200 });
      }

      const result = await fulfillPaidOrder(db, order, now);
      console.log("Webhook fulfill:", order.id, result);
    }

    if (eventType === "PAYMENT.CAPTURE.DENIED" || eventType === "PAYMENT.CAPTURE.REVERSED") {
      const capture = event.resource;
      const paypalOrderId = capture?.supplementary_data?.related_ids?.order_id;

      if (paypalOrderId) {
        await db
          .prepare(
            `UPDATE payment_orders SET status = ? WHERE paypal_order_id = ? AND status != 'paid'`
          )
          .bind(
            eventType === "PAYMENT.CAPTURE.REVERSED" ? "reversed" : "failed",
            paypalOrderId
          )
          .run();

        if (eventType === "PAYMENT.CAPTURE.REVERSED") {
          const order = await db
            .prepare(`SELECT * FROM payment_orders WHERE paypal_order_id = ? LIMIT 1`)
            .bind(paypalOrderId)
            .first();

          if (order && order.order_type === "subscription") {
            await db
              .prepare(
                `UPDATE users SET plan = 'free', plan_expires_at = NULL, updated_at = ? WHERE google_sub = ?`
              )
              .bind(now, order.google_sub)
              .run();
          }
        }
      }
    }

    return new Response("OK", { status: 200 });
  } catch (err) {
    console.error("Webhook error:", err);
    return new Response("Error", { status: 500 });
  }
}
