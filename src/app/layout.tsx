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
  },
  twitter: {
    card: "summary_large_image",
    title: "Image Background Remover",
    description: "Remove backgrounds from images instantly with AI.",
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
              ],
              description:
                "Free online AI tool to remove backgrounds from images instantly.",
              url: "https://picturebackgroundremover.xyz",
              featureList: [
                "AI background removal",
                "Before/after comparison",
                "Transparent PNG download",
                "Guest: 3 free removals per day",
                "Free account: 10 removals per day",
                "Pro: 100 removals per day",
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
                    text: "Yes! Guests get 3 free removals per day. Sign in for a free account to unlock 10 removals per day. Upgrade to Pro for even higher limits.",
                  },
                },
                {
                  "@type": "Question",
                  name: "What image formats are supported?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "We support PNG, JPG, JPEG, and WebP formats. Maximum file size depends on your plan: 10MB for guests, 25MB for free accounts, and 50MB for Pro.",
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
                    text: "Pro gives you 100 removals per day, larger upload sizes (up to 50MB), priority processing, and expanded usage history.",
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
