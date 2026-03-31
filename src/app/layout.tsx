import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Image Background Remover - Remove Background from Photos Online Free",
  description:
    "Remove image backgrounds instantly with AI. Free online background remover tool. No signup required. Get transparent PNG backgrounds in seconds.",
  keywords: [
    "image background remover",
    "remove background from photo",
    "remove background from image",
    "transparent background maker",
    "png background remover",
    "background eraser online",
    "free background remover",
    "photo background remover",
    "product photo background remover",
  ],
  metadataBase: new URL("https://picturebackgroundremover.xyz"),
  alternates: { canonical: "/" },
  openGraph: {
    title: "Image Background Remover - Free Online AI Tool",
    description:
      "Remove backgrounds from images instantly with AI. Free, fast, no signup.",
    type: "website",
    url: "/",
    siteName: "BGRemover",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Image Background Remover - Free Online AI Tool",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Image Background Remover",
    description: "Remove backgrounds from images instantly with AI.",
    images: ["/og-image.png"],
  },
  robots: { index: true, follow: true },
};

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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              name: "Image Background Remover",
              applicationCategory: "MultimediaApplication",
              operatingSystem: "Web",
              offers: [
                { "@type": "Offer", price: "0", priceCurrency: "USD", name: "Free" },
                { "@type": "Offer", price: "9.9", priceCurrency: "USD", name: "Pro", billingIncrement: "P1M" },
                { "@type": "Offer", price: "29.9", priceCurrency: "USD", name: "Business", billingIncrement: "P1M" },
              ],
              description:
                "Free online AI tool to remove backgrounds from images instantly.",
              url: "https://picturebackgroundremover.xyz",
              featureList: [
                "AI background removal",
                "Before/after comparison",
                "Transparent PNG download",
                "Guest: 5 free removals per month",
                "Free account: 20 removals per month",
                "Pro: 200 removals per month",
                "Business: 800 removals per month",
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
                  name: "Is this tool free to try?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Yes! Guests get 5 free removals per month. Sign in for a free account to unlock 20 removals per month. Upgrade for even higher limits.",
                  },
                },
                {
                  "@type": "Question",
                  name: "What image formats are supported?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "We support PNG, JPG, JPEG, and WebP formats. Maximum file size depends on your plan: 10MB for guests, 15MB for free accounts, 25MB for Pro, and 50MB for Business.",
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
                {
                  "@type": "Question",
                  name: "What does Pro include?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Pro gives you 200 removals per month, larger upload sizes (up to 25MB), priority processing, and expanded usage history.",
                  },
                },
              ],
            }),
          }}
        />
      </head>
      <body className="bg-gray-950 text-white antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
