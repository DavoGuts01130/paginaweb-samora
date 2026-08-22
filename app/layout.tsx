import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { CartProvider } from "@/components/CartProvider";
import SiteTracker from "@/components/SiteTracker";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://samoraestudiocreativo.com"
).replace(/\/$/, "");

const siteName = "Samora Estudio";
const siteTitle = "Samora Estudio | Fotografía profesional";
const siteDescription =
  "Fotografía profesional para retratos, eventos, productos y recuerdos impresos con un estilo elegante, auténtico y atemporal.";
const whatsappPhone = "+57 313 842 9568";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),

  title: {
    default: siteTitle,
    template: `%s | ${siteName}`,
  },

  description: siteDescription,

  keywords: [
    "Samora Estudio",
    "Samora Estudio Creativo",
    "fotografía profesional",
    "fotógrafo",
    "fotografía de retrato",
    "fotografía de eventos",
    "fotografía de producto",
    "fotografía gastronómica",
    "fotografía en Colombia",
    "recuerdos impresos",
    "portafolio fotográfico",
  ],

  authors: [{ name: siteName }],
  creator: siteName,
  publisher: siteName,

  robots: {
    index: true,
    follow: true,
  },

  icons: {
    icon: [
      {
        url: "/favicon.ico?v=3",
        sizes: "any",
      },
    ],
    shortcut: ["/favicon.ico?v=3"],
  },

  openGraph: {
    type: "website",
    locale: "es_CO",
    url: siteUrl,
    siteName,
    title: siteTitle,
    description: siteDescription,
    images: [
      {
        url: "/og-image.jpg?v=5",
        width: 1200,
        height: 630,
        alt: "Samora Estudio Creativo - Fotografía profesional",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
    images: ["/og-image.jpg?v=5"],
  },
};

const structuredData = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "@id": `${siteUrl}/#organization`,
  name: siteName,
  alternateName: "Samora Estudio Creativo",
  description: siteDescription,
  url: siteUrl,
  image: `${siteUrl}/og-image.jpg`,
  logo: `${siteUrl}/favicon.ico`,
  telephone: whatsappPhone,
  priceRange: "$$",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Guatavita",
    addressRegion: "Cundinamarca",
    addressCountry: "CO",
  },
  areaServed: [
    {
      "@type": "Country",
      name: "Colombia",
    },
    {
      "@type": "AdministrativeArea",
      name: "Cundinamarca",
    },
    {
      "@type": "City",
      name: "Bogotá",
    },
  ],
  contactPoint: [
    {
      "@type": "ContactPoint",
      telephone: whatsappPhone,
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

        <SiteTracker />

        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}