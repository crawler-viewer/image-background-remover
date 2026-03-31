// PayPal API helper for Cloudflare Workers
// Supports both sandbox and live environments

export function getPayPalConfig(env) {
  const clientId = env.PAYPAL_CLIENT_ID;
  const clientSecret = env.PAYPAL_CLIENT_SECRET;
  const isSandbox = env.PAYPAL_SANDBOX !== "false";

  const baseUrl = isSandbox
    ? "https://api-m.sandbox.paypal.com"
    : "https://api-m.paypal.com";

  return { clientId, clientSecret, baseUrl, isSandbox };
}

export async function getPayPalAccessToken(env) {
  const { clientId, clientSecret, baseUrl } = getPayPalConfig(env);

  const res = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("PayPal token error:", err);
    throw new Error("Failed to get PayPal access token");
  }

  const data = await res.json();
  return data.access_token;
}

export async function createPayPalOrder(env, { amount, currency = "USD", description, customId }) {
  const { baseUrl } = getPayPalConfig(env);
  const token = await getPayPalAccessToken(env);

  const res = await fetch(`${baseUrl}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: { currency_code: currency, value: amount },
          description,
          custom_id: customId,
        },
      ],
      application_context: {
        brand_name: "BGRemover",
        landing_page: "NO_PREFERENCE",
        user_action: "PAY_NOW",
        return_url: `${env.SITE_URL || "https://picturebackgroundremover.xyz"}/api/payment/paypal/capture`,
        cancel_url: `${env.SITE_URL || "https://picturebackgroundremover.xyz"}/pricing?payment=cancelled`,
      },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("PayPal create order error:", err);
    throw new Error("Failed to create PayPal order");
  }

  return await res.json();
}

export async function capturePayPalOrder(env, orderId) {
  const { baseUrl } = getPayPalConfig(env);
  const token = await getPayPalAccessToken(env);

  const res = await fetch(`${baseUrl}/v2/checkout/orders/${orderId}/capture`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("PayPal capture error:", err);
    throw new Error("Failed to capture PayPal order");
  }

  return await res.json();
}

// Product definitions
export const PRODUCTS = {
  // Subscription plans
  pro_monthly: {
    type: "subscription",
    planCode: "pro",
    amount: "9.90",
    period: "monthly",
    label: "Pro Monthly",
  },
  pro_yearly: {
    type: "subscription",
    planCode: "pro",
    amount: "99.00",
    period: "yearly",
    label: "Pro Yearly",
  },
  business_monthly: {
    type: "subscription",
    planCode: "business",
    amount: "29.90",
    period: "monthly",
    label: "Business Monthly",
  },
  business_yearly: {
    type: "subscription",
    planCode: "business",
    amount: "299.00",
    period: "yearly",
    label: "Business Yearly",
  },
  // Credit packs
  credits_20: {
    type: "credits",
    credits: 20,
    amount: "2.90",
    label: "20 Credits",
  },
  credits_100: {
    type: "credits",
    credits: 100,
    amount: "9.90",
    label: "100 Credits",
  },
  credits_300: {
    type: "credits",
    credits: 300,
    amount: "24.90",
    label: "300 Credits",
  },
  credits_800: {
    type: "credits",
    credits: 800,
    amount: "49.90",
    label: "800 Credits",
  },
};
