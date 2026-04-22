import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { DirectorExperience } from "@/components/director-experience";
import { getDirectorBySlug, getDirectors } from "@/lib/content";

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

  return {
    title: director.name,
    description: `${director.name} | Sobremesa Ideias`,
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

  return (
    <main className="page page--director">
      <DirectorExperience director={director} directors={directors} />
    </main>
  );
}
