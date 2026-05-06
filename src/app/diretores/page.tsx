import type { Metadata } from "next";

import { DirectorsList } from "@/components/directors-list";
import { JsonLd } from "@/components/json-ld";
import { getDirectors } from "@/lib/content";
import { absoluteUrl, siteDescription } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Diretores",
  description:
    "Conheça os diretores da Sobremesa Ideias e acesse suas páginas de projetos e biografias.",
  alternates: {
    canonical: "/diretores",
  },
  openGraph: {
    title: "Diretores | Sobremesa Ideias",
    description:
      "Conheça os diretores da Sobremesa Ideias e acesse suas páginas de projetos e biografias.",
    url: absoluteUrl("/diretores"),
    type: "website",
  },
};

export default async function DiretoresPage() {
  const directors = await getDirectors();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Diretores",
    description: siteDescription,
    url: absoluteUrl("/diretores"),
    mainEntity: directors.map((director) => ({
      "@type": "Person",
      name: director.name,
      url: absoluteUrl(`/${director.slug}`),
    })),
  };

  return (
    <main className="page page--directors-index">
      <JsonLd data={jsonLd} />

      <section
        className="director-section director-section--footer directors-index"
        aria-labelledby="diretores-title"
      >
        <h1 className="visually-hidden" id="diretores-title">
          Diretores
        </h1>
        <DirectorsList directors={directors} title="Diretores" variant="footer" />
      </section>
    </main>
  );
}
