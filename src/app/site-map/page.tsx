import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "Site Map | BGRemover",
  description:
    "HTML site map of BGRemover — tool, pricing, guides, and background removal resources.",
  alternates: { canonical: "/site-map/" },
  robots: { index: true, follow: true },
};

const sections: Array<{
  title: string;
  links: Array<{ href: string; label: string; note?: string }>;
}> = [
  {
    title: "Product",
    links: [
      { href: "/", label: "Home — remove background free", note: "Main tool" },
      { href: "/#tool", label: "Open background remover tool" },
      { href: "/pricing/", label: "Pricing" },
      { href: "/credits/", label: "Credit packs" },
      {
        href: "/white-background/",
        label: "White background product photos",
        note: "Amazon / marketplace JPG",
      },
      {
        href: "/batch-remove-background/",
        label: "Batch background remover",
        note: "Up to 20 images + ZIP",
      },
    ],
  },
  {
    title: "Blog & guides",
    links: [
      { href: "/blog/", label: "Blog index" },
      {
        href: "/blog/remove-bg-alternative-free/",
        label: "Free remove.bg alternative",
      },
      {
        href: "/blog/shopify-product-white-background/",
        label: "Shopify white background photos",
      },
      {
        href: "/blog/remove-background-amazon-product-photos/",
        label: "Amazon product photo backgrounds",
      },
      {
        href: "/blog/best-free-background-remover-tools-2026/",
        label: "Best free background removers 2026",
      },
      {
        href: "/blog/make-transparent-png-logo/",
        label: "Transparent PNG logo",
      },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/privacy/", label: "Privacy Policy" },
      { href: "/terms/", label: "Terms of Service" },
    ],
  },
];

export default function HtmlSiteMapPage() {
  return (
    <div className="flex min-h-screen flex-col bg-stone-50 text-neutral-950">
      <SiteHeader active="other" />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12 md:py-16">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Site map</h1>
        <p className="mt-3 text-neutral-600">
          All public pages on BGRemover. Prefer{" "}
          <a
            href="https://picturebackgroundremover.xyz/"
            className="font-medium text-emerald-700 underline underline-offset-4"
          >
            https://picturebackgroundremover.xyz/
          </a>{" "}
          (no www). XML sitemap:{" "}
          <a
            href="/sitemap.xml"
            className="font-medium text-emerald-700 underline underline-offset-4"
          >
            /sitemap.xml
          </a>
          .
        </p>

        <div className="mt-10 space-y-10">
          {sections.map((section) => (
            <section key={section.title}>
              <h2 className="text-lg font-semibold text-neutral-900">{section.title}</h2>
              <ul className="mt-4 space-y-3">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="font-medium text-emerald-800 underline decoration-emerald-700/30 underline-offset-4 hover:text-emerald-900"
                    >
                      {link.label}
                    </Link>
                    {link.note ? (
                      <span className="ml-2 text-sm text-neutral-500">— {link.note}</span>
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
