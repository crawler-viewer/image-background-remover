import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Image Background Remover - Remove Background from Photos Online Free",
  description:
    "Remove image backgrounds instantly with AI. Free online background remover tool. No signup required. Get transparent PNG backgrounds in seconds.",
  keywords: [
    "image background remover",
    "remove background from photo",
    "transparent background maker",
    "png background remover",
    "background eraser online",
    "free background remover",
  ],
  openGraph: {
    title: "Image Background Remover - Free Online AI Tool",
    description:
      "Remove backgrounds from images instantly with AI. Free, fast, no signup.",
    type: "website",
    url: "https://bgremover.example.com",
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
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              name: "Image Background Remover",
              applicationCategory: "MultimediaApplication",
              operatingSystem: "Web",
              offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
              description:
                "Free online AI tool to remove backgrounds from images instantly.",
            }),
          }}
        />
      </head>
      <body className="bg-gray-950 text-white antialiased">{children}</body>
    </html>
  );
}
