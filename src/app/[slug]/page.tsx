import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { DirectorExperience } from "@/components/director-experience";
import { JsonLd } from "@/components/json-ld";
import { getDirectorBySlug, getDirectors } from "@/lib/content";
import {
  absoluteUrl,
  getDirectorDescription,
  siteUrl,
} from "@/lib/seo";

type DirectorPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateStaticParams() {
  const directors = await getDirectors();

  return directors.map((director) => ({
    slug: director.slug,
  }));
}

export async function generateMetadata({
  params,
}: DirectorPageProps): Promise<Metadata> {
  const { slug } = await params;
  const director = await getDirectorBySlug(slug);

  if (!director) {
    return {};
  }

  const description = getDirectorDescription(director);

  return {
    title: director.name,
    description,
    alternates: {
      canonical: `/${director.slug}`,
    },
    openGraph: {
      title: `${director.name} | Sobremesa Ideias`,
      description,
      url: `/${director.slug}`,
      images: director.portrait
        ? [
            {
              url: director.portrait,
              alt: director.portraitAlt || director.name,
            },
          ]
        : undefined,
    },
    twitter: {
      card: director.portrait ? "summary_large_image" : "summary",
      title: `${director.name} | Sobremesa Ideias`,
      description,
      images: director.portrait ? [director.portrait] : undefined,
    },
  };
}

export default async function DirectorPage({ params }: DirectorPageProps) {
  const { slug } = await params;
  const [director, directors] = await Promise.all([
    getDirectorBySlug(slug),
    getDirectors(),
  ]);

  if (!director) {
    notFound();
  }

  const directorJsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: director.name,
    url: `${siteUrl}/${director.slug}`,
    image: director.portrait ? absoluteUrl(director.portrait) : undefined,
    description: getDirectorDescription(director),
    sameAs: director.socialLinks.map((link) => link.url),
    worksFor: {
      "@type": "Organization",
      name: "Sobremesa Ideias",
      url: siteUrl,
    },
  };

  return (
    <main className="page page--director">
      <JsonLd data={directorJsonLd} />
      <DirectorExperience director={director} directors={directors} />
    </main>
  );
}
