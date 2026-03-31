import { getPayPalConfig, getPayPalAccessToken, PRODUCTS, calcPlanExpiry } from "../paypal-lib";

// Verify webhook signature with PayPal
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

    // Verify signature (skip in sandbox if no webhook ID configured)
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
    const now = new Date().toISOString();

    console.log("PayPal webhook event:", eventType);

    if (eventType === "CHECKOUT.ORDER.APPROVED") {
      // Order approved but not yet captured — we capture in the redirect flow
      // This is a safety net; log it
      console.log("Order approved via webhook:", event.resource?.id);
    }

    if (eventType === "PAYMENT.CAPTURE.COMPLETED") {
      const capture = event.resource;
      const paypalOrderId = capture?.supplementary_data?.related_ids?.order_id;

      if (!paypalOrderId) {
        console.log("Capture event without order ID, skipping");
        return new Response("OK", { status: 200 });
      }

      // Check if we already processed this order
      const order = await db
        .prepare(`SELECT * FROM payment_orders WHERE paypal_order_id = ? LIMIT 1`)
        .bind(paypalOrderId)
        .first();

      if (!order) {
        console.error("Webhook: order not found for PayPal ID:", paypalOrderId);
        return new Response("OK", { status: 200 });
      }

      // Already paid? Skip
      if (order.status === "paid") {
        console.log("Webhook: order already paid, skipping:", order.id);
        return new Response("OK", { status: 200 });
      }

      // Mark as paid
      await db
        .prepare(`UPDATE payment_orders SET status = 'paid', paid_at = ? WHERE id = ?`)
        .bind(now, order.id)
        .run();

      // Apply purchase
      if (order.order_type === "subscription" && order.plan_code) {
        const productEntry = Object.values(PRODUCTS).find(
          (p) => p.type === "subscription" && p.planCode === order.plan_code && p.amount === order.amount_usd
        );
        const expiresAt = productEntry ? calcPlanExpiry(productEntry) : new Date(Date.now() + 30 * 86400000).toISOString();

        await db
          .prepare(`UPDATE users SET plan = ?, plan_expires_at = ?, updated_at = ? WHERE google_sub = ?`)
          .bind(order.plan_code, expiresAt, now, order.google_sub)
          .run();
      } else if (order.order_type === "credits" && order.credit_amount) {
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

      console.log("Webhook: order fulfilled:", order.id);
    }

    if (eventType === "PAYMENT.CAPTURE.DENIED" || eventType === "PAYMENT.CAPTURE.REVERSED") {
      // Payment failed or reversed
      const capture = event.resource;
      const paypalOrderId = capture?.supplementary_data?.related_ids?.order_id;

      if (paypalOrderId) {
        await db
          .prepare(`UPDATE payment_orders SET status = ? WHERE paypal_order_id = ? AND status != 'paid'`)
          .bind(eventType === "PAYMENT.CAPTURE.REVERSED" ? "reversed" : "failed", paypalOrderId)
          .run();

        // If reversed, downgrade user back to free
        if (eventType === "PAYMENT.CAPTURE.REVERSED") {
          const order = await db
            .prepare(`SELECT * FROM payment_orders WHERE paypal_order_id = ? LIMIT 1`)
            .bind(paypalOrderId)
            .first();

          if (order && order.order_type === "subscription") {
            await db
              .prepare(`UPDATE users SET plan = 'free', updated_at = ? WHERE google_sub = ?`)
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
