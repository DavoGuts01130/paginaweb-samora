import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { CartProvider } from "@/components/CartProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || "https://samora.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Samora Studio | Fotografía profesional",
    template: "%s | Samora Studio",
  },
  description:
    "Samora Studio ofrece fotografía profesional para retratos, eventos, productos y recuerdos impresos con una estética elegante, auténtica y atemporal.",
  keywords: [
    "Samora Studio",
    "fotografía profesional",
    "fotógrafo",
    "fotografía de retrato",
    "fotografía de eventos",
    "fotografía de producto",
    "fotografía en Colombia",
    "recuerdos impresos",
    "portafolio fotográfico",
  ],
  authors: [{ name: "Samora Studio" }],
  creator: "Samora Studio",
  publisher: "Samora Studio",
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    locale: "es_CO",
    url: siteUrl,
    siteName: "Samora Studio",
    title: "Samora Studio | Fotografía profesional",
    description:
      "Fotografía profesional para retratos, eventos, productos y recuerdos impresos con un estilo elegante y auténtico.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Samora Studio - Fotografía profesional",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Samora Studio | Fotografía profesional",
    description:
      "Fotografía profesional para retratos, eventos, productos y recuerdos impresos.",
    images: ["/og-image.jpg"],
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

const structuredData = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "@id": `${siteUrl}/#organization`,
  name: "Samora Studio",
  description:
    "Fotografía profesional para retratos, eventos, productos y recuerdos impresos.",
  url: siteUrl,
  image: `${siteUrl}/og-image.jpg`,
  logo: `${siteUrl}/apple-touch-icon.png`,
  telephone: "+57 319 270 9536",
  priceRange: "$$",
  address: {
    "@type": "PostalAddress",
    addressCountry: "CO",
  },
  areaServed: {
    "@type": "Country",
    name: "Colombia",
  },
  sameAs: [
    "https://instagram.com/samora.studio",
  ],
  contactPoint: [
    {
      "@type": "ContactPoint",
      telephone: "+57 319 270 9536",
      contactType: "customer service",
      areaServed: "CO",
      availableLanguage: ["Spanish"],
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData),
          }}
        />

        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}