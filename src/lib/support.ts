/**
 * Single source of truth for how users reach a human.
 *
 * The Terms promise a refund window and the Privacy Policy promises account
 * deletion on request — both are empty promises unless this address actually
 * receives mail. Point it at a real mailbox before shipping (Cloudflare Email
 * Routing on the existing zone is enough).
 */
export const SUPPORT_EMAIL = "support@picturebackgroundremover.xyz";

/** Prefilled mailto for a given topic, so we get the details we need up front. */
export function supportMailto(subject: string, lines: string[] = []): string {
  const body = lines.length ? `\n\n${lines.join("\n")}` : "";
  return `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}${
    body ? `&body=${encodeURIComponent(body.trimStart())}` : ""
  }`;
}

export const SUPPORT_TOPICS = {
  refund: {
    subject: "Refund request",
    lines: ["PayPal transaction ID:", "Order ID (from your account page):", "Reason:"],
  },
  billing: {
    subject: "Billing question",
    lines: ["Account email:", "Order ID (if any):", "Question:"],
  },
  data: {
    subject: "Data request (export or deletion)",
    lines: ["Account email:", "Request: export / deletion", "Details:"],
  },
  bug: {
    subject: "Bug report",
    lines: ["What you did:", "What happened:", "Browser / device:"],
  },
} as const;
