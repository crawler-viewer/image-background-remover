import {
  getPayPalConfig,
  getPayPalAccessToken,
  extractWebhookCaptureAmount,
  verifyCapturedAmount,
} from "../paypal-lib.js";
import { ensurePaymentSchema, fulfillPaidOrder } from "../fulfill.js";
import { logEvent } from "../../log.js";

async function verifyWebhookSignature(env, headers, body) {
  const { baseUrl } = getPayPalConfig(env);
  const token = await getPayPalAccessToken(env);
  const webhookId = env.PAYPAL_WEBHOOK_ID;

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
    const detail = await res.text().catch(() => "");
    logEvent("error", "paypal_webhook_verify_failed", {
      status: res.status,
      detail: String(detail).slice(0, 200),
    });
    return false;
  }

  const result = await res.json();
  return result.verification_status === "SUCCESS";
}

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    // Fail closed: without a webhook id we cannot tell PayPal apart from anyone
    // who knows a paypal_order_id, and this endpoint grants plans/credits.
    // 503 (not 200) so PayPal keeps retrying once the variable is configured.
    if (!env.PAYPAL_WEBHOOK_ID) {
      logEvent("error", "paypal_webhook_id_missing", {
        hint: "Set PAYPAL_WEBHOOK_ID in Cloudflare Pages; webhooks are rejected until then.",
      });
      return new Response("Webhook not configured", { status: 503 });
    }

    const body = await request.text();

    const valid = await verifyWebhookSignature(env, request.headers, body);
    if (!valid) {
      logEvent("warn", "paypal_webhook_signature_invalid", {
        transmissionId: request.headers.get("paypal-transmission-id") || null,
      });
      return new Response("Invalid signature", { status: 401 });
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
        logEvent("error", "paypal_webhook_order_not_found", { paypalOrderId });
        return new Response("OK", { status: 200 });
      }

      // Same money check as the capture redirect — a signed event still has to
      // pay the amount we recorded, in the currency we recorded.
      const captured = extractWebhookCaptureAmount(capture);
      const check = verifyCapturedAmount(order, captured);
      if (!check.ok) {
        logEvent("error", "paypal_webhook_amount_rejected", {
          paypalOrderId,
          orderId: order.id,
          reason: check.reason,
          captured: captured?.value ?? null,
          capturedCurrency: captured?.currency ?? null,
          expected: order.amount_usd ?? null,
          expectedCurrency: order.currency || "USD",
        });
        // Leave the order pending for manual review; ack so PayPal stops retrying.
        return new Response("OK", { status: 200 });
      }

      const result = await fulfillPaidOrder(db, order, now);
      logEvent("info", "paypal_webhook_fulfilled", {
        orderId: order.id,
        applied: result.applied,
        kind: result.kind || null,
        reason: result.reason || null,
      });
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
