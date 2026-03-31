import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service - BGRemover",
  description: "Terms of Service for BGRemover background removal service.",
};

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16 text-gray-300">
      <h1 className="text-3xl font-bold text-white">Terms of Service</h1>
      <p className="mt-2 text-sm text-gray-500">Last updated: March 31, 2026</p>

      <div className="mt-8 space-y-8 text-sm leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold text-white">1. Acceptance of Terms</h2>
          <p className="mt-2">
            By accessing or using BGRemover at picturebackgroundremover.xyz (&quot;the Service&quot;), you agree to be bound by these Terms of Service. If you do not agree, do not use the Service.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white">2. Description of Service</h2>
          <p className="mt-2">
            BGRemover provides AI-powered image background removal. The Service is available in multiple tiers: Guest, Free, Pro, and Business, each with different usage limits and features.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white">3. Accounts</h2>
          <ul className="mt-2 list-disc space-y-2 pl-6">
            <li>You may sign in using your Google account.</li>
            <li>You are responsible for maintaining the security of your account.</li>
            <li>You must not share your account with others.</li>
            <li>We reserve the right to suspend or terminate accounts that violate these terms.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white">4. Usage Limits</h2>
          <ul className="mt-2 list-disc space-y-2 pl-6">
            <li>Each plan has a monthly limit on the number of background removals.</li>
            <li>Limits reset on the 1st of each month.</li>
            <li>Unused removals do not roll over to the next month.</li>
            <li>Each successful processing counts as one usage, including repeated processing of the same image.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white">5. Payments and Subscriptions</h2>
          <ul className="mt-2 list-disc space-y-2 pl-6">
            <li>Paid plans (Pro, Business) are billed monthly or yearly via PayPal.</li>
            <li>All prices are in USD.</li>
            <li>You may cancel your subscription at any time. Access continues until the end of the paid period.</li>
            <li>Refunds are handled on a case-by-case basis. Contact us within 7 days of purchase for refund requests.</li>
            <li>We reserve the right to change pricing with 30 days&apos; notice.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white">6. Acceptable Use</h2>
          <p className="mt-2">You agree not to:</p>
          <ul className="mt-2 list-disc space-y-2 pl-6">
            <li>Use the Service for any illegal purpose.</li>
            <li>Upload images that contain illegal, harmful, or offensive content.</li>
            <li>Attempt to bypass usage limits or abuse the Service.</li>
            <li>Use automated tools to access the Service without permission.</li>
            <li>Reverse-engineer or attempt to extract the underlying AI models.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white">7. Intellectual Property</h2>
          <p className="mt-2">
            You retain all rights to images you upload. We claim no ownership over your content. The Service, its design, and underlying technology are our intellectual property.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white">8. Disclaimer of Warranties</h2>
          <p className="mt-2">
            The Service is provided &quot;as is&quot; without warranties of any kind. We do not guarantee that the Service will be uninterrupted, error-free, or that results will meet your expectations. Background removal quality may vary depending on image complexity.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white">9. Limitation of Liability</h2>
          <p className="mt-2">
            To the maximum extent permitted by law, we shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the Service. Our total liability shall not exceed the amount you paid us in the 12 months preceding the claim.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white">10. Changes to Terms</h2>
          <p className="mt-2">
            We may modify these Terms at any time. Continued use of the Service after changes constitutes acceptance of the updated Terms. We will notify users of material changes.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white">11. Contact</h2>
          <p className="mt-2">
            If you have questions about these Terms, please contact us through our website.
          </p>
        </section>
      </div>
    </main>
  );
}
