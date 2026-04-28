import type { Metadata } from "next";

import { BackgroundVideo } from "@/components/background-video";
import { DirectorsList } from "@/components/directors-list";
import { getDirectors, getHomePageData } from "@/lib/content";
import { siteDescription } from "@/lib/seo";

export const metadata: Metadata = {
  alternates: {
    canonical: "/",
  },
  description: siteDescription,
};

export default async function HomePage() {
  const [home, directors] = await Promise.all([
    getHomePageData(),
    getDirectors(),
  ]);

  return (
    <main className="page page--home">
      <section className="home-hero">
        <BackgroundVideo
          eager
          interactive
          title="Sobremesa Ideias"
          videoUrl={home.heroVideoUrl}
        />
        <div className="home-hero__shade" aria-hidden="true" />
        <div className="home-hero__content">
          <DirectorsList
            directors={directors}
            title={home.directorsLabel}
            variant="hero"
          />
        </div>
      </section>
    </main>
  );
}
