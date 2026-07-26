import type { Metadata } from "next";
import LegalShell from "@/components/LegalShell";
import { SUPPORT_EMAIL, SUPPORT_TOPICS, supportMailto } from "@/lib/support";

export const metadata: Metadata = {
  title: "Contact & Support - BGRemover",
  description:
    "Contact BGRemover for refunds, billing questions, data requests, or bug reports.",
  alternates: { canonical: "/contact/" },
};

const TOPICS = [
  {
    heading: "Refunds",
    body: "Prepaid plans and credit packs are refundable within 7 days of purchase, as described in our Terms. Include your PayPal transaction ID so we can match the payment.",
    topic: SUPPORT_TOPICS.refund,
    cta: "Request a refund",
  },
  {
    heading: "Billing & orders",
    body: "Payment went through but your plan or credits did not update? Send us the order ID from your account page and we will reconcile it against the PayPal receipt.",
    topic: SUPPORT_TOPICS.billing,
    cta: "Ask about billing",
  },
  {
    heading: "Your data",
    body: "You can export or delete your account data yourself from the account page. If you cannot sign in, email us from the address on the account and we will handle it.",
    topic: SUPPORT_TOPICS.data,
    cta: "Make a data request",
  },
  {
    heading: "Something broken",
    body: "A removal failed, a download did not work, or the page misbehaved? Tell us what you did and what happened, and which browser you were on.",
    topic: SUPPORT_TOPICS.bug,
    cta: "Report a bug",
  },
];

export default function Page() {
  return (
    <LegalShell title="Contact & Support" updated="July 26, 2026">
      <section>
        <p>
          Email us at{" "}
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="font-medium text-emerald-700 underline underline-offset-4 hover:text-emerald-800"
          >
            {SUPPORT_EMAIL}
          </a>
          . We read every message. Using one of the links below prefills the details we
          usually have to ask for, which saves a round trip.
        </p>
      </section>

      {TOPICS.map((t) => (
        <section key={t.heading}>
          <h2 className="text-lg font-semibold">{t.heading}</h2>
          <p className="mt-2">{t.body}</p>
          <p className="mt-3">
            <a
              href={supportMailto(t.topic.subject, [...t.topic.lines])}
              className="inline-flex rounded-xl border border-black/10 bg-stone-50 px-4 py-2 text-sm font-medium text-neutral-800 transition-colors hover:bg-stone-100"
            >
              {t.cta}
            </a>
          </p>
        </section>
      ))}

      <section>
        <h2 className="text-lg font-semibold">Before you write in</h2>
        <ul className="mt-2 list-disc space-y-2 pl-6">
          <li>
            Monthly limits reset on the 1st of each month (UTC). Credit pack balances do not
            expire.
          </li>
          <li>
            Prepaid Pro and Business are one-time purchases, not subscriptions — there is
            nothing to cancel, and nothing renews automatically.
          </li>
          <li>
            Uploaded images are processed in real time and are not stored on our servers, so
            we cannot recover a result you have already closed.
          </li>
        </ul>
      </section>
    </LegalShell>
  );
}
