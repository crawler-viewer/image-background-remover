import type { Metadata } from "next";
import UseCaseLayout from "@/components/use-cases/UseCaseLayout";

export const metadata: Metadata = {
  title: "White Background Product Photos (RGB 255) Online Free | BGRemover",
  description:
    "Create Amazon-ready pure white background product photos. Remove the background with AI, then export a white JPG (RGB 255, 255, 255) in one click — free to try.",
  alternates: { canonical: "/white-background/" },
  openGraph: {
    title: "White Background Product Photos Online Free",
    description:
      "AI remove background + one-click pure white JPG export for Amazon and marketplaces.",
    url: "/white-background/",
    type: "website",
  },
};

const faqs = [
  {
    q: "What is a pure white background for Amazon?",
    a: "Amazon main images typically require a pure white background: RGB 255, 255, 255. Off-white or gray can cause listing issues. BGRemover exports a white JPG at full white so you do not need a second editor.",
  },
  {
    q: "Do I need Photoshop or Canva?",
    a: "No. Upload your product photo, remove the background, then click White background JPG. The cutout is composited onto pure white in your browser.",
  },
  {
    q: "Is this free?",
    a: "Guests get free monthly removals without an account. Sign in for a higher free limit, or upgrade for more volume. Each successful removal counts as one credit against your plan.",
  },
  {
    q: "Can I still download a transparent PNG?",
    a: "Yes. Download PNG keeps transparency for design tools. White background JPG is for marketplace main images and catalogs.",
  },
];

export default function WhiteBackgroundPage() {
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
        eyebrow="Marketplace images"
        title="White background product photos in seconds"
        description="Remove cluttered backgrounds with AI, then export a pure white JPG (RGB 255, 255, 255) ready for Amazon, Shopify, eBay, and catalog uploads — without opening Photoshop."
        primaryCta={{
          href: "/?export=white&size=2000#tool",
          label: "Create white background free →",
        }}
        secondaryCta={{ href: "/batch-remove-background/", label: "Batch many SKUs" }}
        steps={[
          {
            title: "Upload any product photo",
            body: "Shoot on a table, shelf, or busy room. Good lighting helps edges; a studio is optional.",
          },
          {
            title: "AI removes the background",
            body: "Get a clean transparent cutout with a before/after slider so you can check hair, straps, and reflections.",
          },
          {
            title: "Export white JPG",
            body: "Click White background JPG. We place your subject on pure white and download a marketplace-friendly JPEG.",
          },
        ]}
        bullets={[
          "One-click pure white (RGB 255) — no Canva white canvas step",
          "Also download transparent PNG for ads, social, and design tools",
          "Works for apparel, electronics, beauty, home goods, and more",
          "Guest free tier to try; batch up to 20 images when you have catalog volume",
        ]}
        faqs={faqs}
        related={[
          { href: "/batch-remove-background/", label: "Batch background remover" },
          {
            href: "/blog/shopify-product-white-background/",
            label: "Shopify white background",
          },
          {
            href: "/blog/remove-background-amazon-product-photos/",
            label: "Amazon product photo guide",
          },
          { href: "/blog/remove-bg-alternative-free/", label: "remove.bg alternative" },
          { href: "/pricing/", label: "Pricing" },
          { href: "/?export=white&size=2000#tool", label: "Open tool (white JPG)" },
        ]}
      >
        <div className="mt-10 rounded-2xl border border-black/8 bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
          <h2 className="text-lg font-semibold">Amazon main image checklist</h2>
          <ul className="mt-4 space-y-2 text-sm text-neutral-600">
            <li>• Pure white background (RGB 255, 255, 255)</li>
            <li>• Product fills most of the frame (~85%+)</li>
            <li>• Longest side preferably 1600px+ for zoom</li>
            <li>• No watermarks, logos, or lifestyle props on the main image</li>
          </ul>
        </div>
      </UseCaseLayout>
    </>
  );
}
