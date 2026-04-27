import type { Metadata } from "next";

import { SiteHeader } from "@/components/site-header";
import { getSiteData } from "@/lib/content";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Sobremesa Ideias",
    template: "%s | Sobremesa Ideias",
  },
  description:
    "Website institucional da Sobremesa Ideias, estúdio de produção de vídeo.",
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

  return (
    <html lang="pt-BR" data-scroll-behavior="smooth">
      <body>
        <SiteHeader site={site} />
        {children}
      </body>
    </html>
  );
}
