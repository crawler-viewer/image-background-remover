import type { Metadata } from "next";
import "./globals.css";

const isProduction = process.env.NEXT_PUBLIC_SITE_ENV === "production";

export const metadata: Metadata = {
  // Align with GSC queries: remove background from photo online, transparent, free, jpg/png
  title: "Remove Background from Photo Online Free | Transparent PNG & White JPG",
  description:
    "Free online photo background remover. Remove background from photos online in seconds — no signup. Download transparent PNG or pure white JPG. Batch up to 20 images. Try BGRemover free.",
  metadataBase: new URL("https://picturebackgroundremover.xyz/"),
  alternates: { canonical: "/" },
  keywords: [
    "remove background from photo online",
    "photo background remover",
    "transparent background remover",
    "remove background free",
    "jpg background remover",
    "png background remover",
    "bg remover",
    "BGRemover",
  ],
  openGraph: {
    title: "Remove Background from Photo Online Free | BGRemover",
    description:
      "AI photo background remover — free to try, no signup. Transparent PNG or Amazon-ready white JPG. Batch upload supported.",
    type: "website",
    url: "/",
    siteName: "BGRemover",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Remove background from photo online free — BGRemover",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Remove Background from Photo Online Free | BGRemover",
    description:
      "Free AI background remover for photos. Transparent PNG or white JPG. No signup to start.",
    images: ["/og-image.png"],
  },
  robots: isProduction
    ? { index: true, follow: true }
    : { index: false, follow: false },
};

const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="icon" href="/favicon.ico" sizes="32x32" />
        <link rel="dns-prefetch" href="https://clipdrop-api.co" />
        <link rel="preconnect" href="https://accounts.google.com" />
        {gaId ? (
          <>
            <script async src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} />
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${gaId}', { anonymize_ip: true });
                `,
              }}
            />
          </>
        ) : null}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              name: "BGRemover — Remove Background from Photo Online",
              alternateName: ["BG Remover", "Image Background Remover", "Photo Background Remover"],
              applicationCategory: "MultimediaApplication",
              operatingSystem: "Web",
              offers: [
                { "@type": "Offer", price: "0", priceCurrency: "USD", name: "Free" },
                { "@type": "Offer", price: "9.9", priceCurrency: "USD", name: "Pro", billingIncrement: "P1M" },
                { "@type": "Offer", price: "29.9", priceCurrency: "USD", name: "Business", billingIncrement: "P1M" },
              ],
              description:
                "Free online tool to remove background from photos. Get transparent PNG or pure white JPG. No signup required to try.",
              url: "https://picturebackgroundremover.xyz/",
              featureList: [
                "Remove background from photo online free",
                "Transparent PNG and white JPG export",
                "Before/after comparison slider",
                "Batch upload up to 20 images",
                "Guest: 5 free removals per month",
                "Free account: 20 removals per month",
                "Pro: 200 removals per month",
                "Business: 500 removals per month",
              ],
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: [
                {
                  "@type": "Question",
                  name: "Can I remove background from a photo online for free?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Yes. Guests get free removals every month with no signup. Sign in for a free account to unlock more monthly removals, or upgrade for higher volume.",
                  },
                },
                {
                  "@type": "Question",
                  name: "Do you support transparent PNG and white JPG?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Yes. Download a transparent PNG for design tools, or export a pure white background JPG for product listings and marketplaces.",
                  },
                },
                {
                  "@type": "Question",
                  name: "Can I remove the background from JPG or JPEG photos?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Yes. JPG, JPEG, PNG, and WebP are supported. Maximum file size depends on your plan.",
                  },
                },
                {
                  "@type": "Question",
                  name: "Is my image data safe?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Your images are processed in real-time and are not stored on our servers. Once processing is complete, the data is discarded.",
                  },
                },
                {
                  "@type": "Question",
                  name: "Can I use the results commercially?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Absolutely. The processed images are yours to use for any purpose — personal or commercial.",
                  },
                },
              ],
            }),
          }}
        />
      </head>
      <body className="min-h-screen bg-stone-50 text-neutral-950 antialiased">
        {children}
      </body>
    </html>
  );
}
