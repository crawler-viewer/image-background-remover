import {
  amountsEqual,
  capturePayPalOrder,
  extractCapturedAmount,
} from "../paypal-lib.js";
import {
  buildPaymentSuccessQuery,
  ensurePaymentSchema,
  fulfillPaidOrder,
} from "../fulfill.js";

function siteBase(env) {
  return env.SITE_URL || "https://picturebackgroundremover.xyz";
}

function successRedirect(base, order, fulfillResult) {
  const qs = buildPaymentSuccessQuery(order, fulfillResult || {});
  return Response.redirect(`${base}/account/?${qs}`, 302);
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

    // Validate captured amount matches our recorded order (prevents product mismatch)
    const capturedAmount = extractCapturedAmount(capture);
    if (capturedAmount && order.amount_usd && !amountsEqual(capturedAmount, order.amount_usd)) {
      console.error(
        "PayPal amount mismatch:",
        { paypalOrderId, capturedAmount, expected: order.amount_usd, orderId: order.id }
      );
      // Do not fulfill mismatched payments — leave pending for manual review
      return Response.redirect(`${base}/pricing/?payment=error&reason=amount`, 302);
    }

    if (order.status === "paid") {
      return successRedirect(base, order, {
        kind: order.order_type === "credits" ? "credits" : "plan",
        plan: order.plan_code || undefined,
        credits: order.credit_amount || undefined,
      });
    }

    const result = await fulfillPaidOrder(db, order, now);
    console.log("Capture fulfill:", order.id, result);

    if (!result.applied && result.reason !== "already_paid") {
      console.error("Capture fulfill did not apply:", result);
      // Payment captured but fulfill failed — send user to account with pending hint
      return Response.redirect(
        `${base}/account/?payment=pending&token=${encodeURIComponent(paypalOrderId)}`,
        302
      );
    }

    return successRedirect(base, order, result);
  } catch (err) {
    console.error("Capture error:", err);
    return Response.redirect(`${base}/pricing/?payment=error`, 302);
  }
}
