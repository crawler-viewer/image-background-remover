import type { Metadata } from "next";
import UseCaseLayout from "@/components/use-cases/UseCaseLayout";

export const metadata: Metadata = {
  title: "Batch Background Remover Online — Up to 20 Images | BGRemover",
  description:
    "Remove backgrounds from multiple product photos at once. Upload up to 20 images, process them in a queue, then download a ZIP of transparent PNGs or white-background JPGs.",
  alternates: { canonical: "/batch-remove-background/" },
  openGraph: {
    title: "Batch Background Remover Online",
    description:
      "Multi-image AI background removal with queue progress and ZIP download for catalogs.",
    url: "/batch-remove-background/",
    type: "website",
  },
};

const faqs = [
  {
    q: "How many images can I process in one batch?",
    a: "Up to 20 images per run. Each successful removal counts as one against your monthly plan (or credits). If you have fewer removals left, we only queue what your quota allows.",
  },
  {
    q: "Are images processed in parallel?",
    a: "They run one after another. That protects API quality and your rate limits while still being much faster than opening each file manually.",
  },
  {
    q: "Can I download everything as a ZIP?",
    a: "Yes. After the batch finishes, use ZIP all PNG or ZIP all white JPG to get a single archive for your catalog folder.",
  },
  {
    q: "What if I hit my monthly limit mid-batch?",
    a: "Processing stops. Finished images stay available to download; remaining ones are marked skipped. Sign in, buy credits, or upgrade to continue.",
  },
];

export default function BatchRemoveBackgroundPage() {
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <UseCaseLayout
        eyebrow="Catalogs & SKUs"
        title="Batch remove backgrounds from product photos"
        description="Upload a whole folder of listings — process up to 20 images in one queue, preview each result, then download a ZIP of transparent PNGs or Amazon-ready white JPGs."
        primaryCta={{ href: "/#tool", label: "Start batch remove free →" }}
        secondaryCta={{
          href: "/?export=white&size=2000#tool",
          label: "White background export",
        }}
        steps={[
          {
            title: "Select or drop many files",
            body: "PNG, JPG, or WebP. Multi-select in the file picker or drag a stack of images onto the tool.",
          },
          {
            title: "Watch the queue",
            body: "Each file moves through queued → processing → done. Click thumbnails to review the before/after slider.",
          },
          {
            title: "ZIP download",
            body: "Export all transparent PNGs or all pure-white JPGs as a single zip for your PIM, Amazon, or Shopify upload.",
          },
        ]}
        bullets={[
          "Up to 20 images per batch — ideal for small catalog drops",
          "Serial processing respects quotas and rate limits",
          "ZIP packs avoid browser multi-download blockers",
          "Same AI quality as single-image mode; white JPG still available per image",
        ]}
        faqs={faqs}
        related={[
          { href: "/white-background/", label: "White background tool guide" },
          {
            href: "/blog/shopify-product-white-background/",
            label: "Shopify product photos",
          },
          {
            href: "/blog/remove-bg-alternative-free/",
            label: "Free remove.bg alternative",
          },
          { href: "/pricing/", label: "Pricing & limits" },
          { href: "/credits/", label: "Buy credits" },
        ]}
      >
        <div className="mt-10 rounded-2xl border border-black/8 bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
          <h2 className="text-lg font-semibold">Quota tips for batch runs</h2>
          <ul className="mt-4 space-y-2 text-sm text-neutral-600">
            <li>• Guest: 5 removals/month — use batch for a small test set</li>
            <li>• Free account: 20/month — full batch size when you have headroom</li>
            <li>• Pro / Business or credit packs — better for weekly catalog refreshes</li>
            <li>• Each success = 1 removal; failed images are not charged</li>
          </ul>
        </div>
      </UseCaseLayout>
    </>
  );
}
