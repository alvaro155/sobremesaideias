import type { Metadata } from "next";

import { JsonLd } from "@/components/json-ld";
import { SiteHeader } from "@/components/site-header";
import { getSiteData } from "@/lib/content";
import { absoluteUrl, siteDescription, siteUrl } from "@/lib/seo";

import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Sobremesa Ideias",
    template: "%s | Sobremesa Ideias",
  },
  description: siteDescription,
  applicationName: "Sobremesa Ideias",
  authors: [{ name: "Sobremesa Ideias" }],
  creator: "Sobremesa Ideias",
  publisher: "Sobremesa Ideias",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Sobremesa Ideias",
    description: siteDescription,
    url: siteUrl,
    siteName: "Sobremesa Ideias",
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Sobremesa Ideias",
    description: siteDescription,
  },
  icons: {
    icon: "/media/logos/favicon.png",
    shortcut: "/media/logos/favicon.png",
    apple: "/media/logos/favicon.png",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const site = await getSiteData();
  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: site.studioName,
    url: siteUrl,
    logo: absoluteUrl(site.logoImage ?? "/media/logos/logo.svg"),
    email: site.contactPanel.email,
    telephone: site.contactPanel.phone,
    sameAs: site.socialLinks.map((link) => link.url),
  };

  return (
    <html lang="pt-BR" data-scroll-behavior="smooth">
      <body>
        <JsonLd data={organizationJsonLd} />
        <SiteHeader site={site} />
        {children}
      </body>
    </html>
  );
}
