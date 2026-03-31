import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy - BGRemover",
  description: "Privacy Policy for BGRemover background removal service.",
};

export default function PrivacyPolicyPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16 text-gray-300">
      <h1 className="text-3xl font-bold text-white">Privacy Policy</h1>
      <p className="mt-2 text-sm text-gray-500">Last updated: March 31, 2026</p>

      <div className="mt-8 space-y-8 text-sm leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold text-white">1. Introduction</h2>
          <p className="mt-2">
            BGRemover (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) operates the website picturebackgroundremover.xyz. This Privacy Policy explains how we collect, use, and protect your information when you use our service.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white">2. Information We Collect</h2>
          <ul className="mt-2 list-disc space-y-2 pl-6">
            <li><strong>Account Information:</strong> When you sign in with Google, we receive your name, email address, and profile picture.</li>
            <li><strong>Usage Data:</strong> We track how many background removals you perform to enforce plan limits.</li>
            <li><strong>Payment Information:</strong> Payments are processed by PayPal. We do not store your credit card or PayPal account details.</li>
            <li><strong>Technical Data:</strong> IP address, browser type, and device information collected automatically via Cloudflare.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white">3. How We Use Your Information</h2>
          <ul className="mt-2 list-disc space-y-2 pl-6">
            <li>To provide and maintain the background removal service.</li>
            <li>To manage your account and enforce usage limits.</li>
            <li>To process payments and fulfill subscriptions.</li>
            <li>To improve our service and user experience.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white">4. Image Processing</h2>
          <p className="mt-2">
            Images you upload are processed in real time by our AI service. <strong>We do not permanently store your uploaded images.</strong> Images are transmitted to our processing API, the background is removed, and the result is returned to you. No copies are retained after processing.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white">5. Data Sharing</h2>
          <p className="mt-2">We do not sell your personal information. We share data only with:</p>
          <ul className="mt-2 list-disc space-y-2 pl-6">
            <li><strong>Google:</strong> For authentication (OAuth sign-in).</li>
            <li><strong>PayPal:</strong> For payment processing.</li>
            <li><strong>Cloudflare:</strong> For hosting and content delivery.</li>
            <li><strong>AI Processing API:</strong> Images are sent for background removal only.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white">6. Data Retention</h2>
          <p className="mt-2">
            Account data is retained as long as your account is active. Usage logs are retained for billing and analytics purposes. You may request account deletion by contacting us.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white">7. Cookies</h2>
          <p className="mt-2">
            We use essential cookies for authentication (session tokens). We do not use advertising or tracking cookies.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white">8. Your Rights</h2>
          <p className="mt-2">You have the right to:</p>
          <ul className="mt-2 list-disc space-y-2 pl-6">
            <li>Access the personal data we hold about you.</li>
            <li>Request correction or deletion of your data.</li>
            <li>Withdraw consent for data processing.</li>
            <li>Export your data in a portable format.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white">9. Security</h2>
          <p className="mt-2">
            We use industry-standard security measures including HTTPS encryption, secure authentication, and access controls to protect your data.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white">10. Changes</h2>
          <p className="mt-2">
            We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated date.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white">11. Contact</h2>
          <p className="mt-2">
            If you have questions about this Privacy Policy, please contact us through our website.
          </p>
        </section>
      </div>
    </main>
  );
}
