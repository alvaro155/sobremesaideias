import type { Metadata } from "next";
import Image from "next/image";

import { getAboutPageData, getSiteData } from "@/lib/content";
import { siteDescription, truncateText } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const about = await getAboutPageData();
  const description = truncateText(about.paragraphs[0] ?? siteDescription);

  return {
    title: about.title,
    description,
    alternates: {
      canonical: "/sobre",
    },
    openGraph: {
      title: `${about.title} | Sobremesa Ideias`,
      description,
      url: "/sobre",
    },
    twitter: {
      title: `${about.title} | Sobremesa Ideias`,
      description,
    },
  };
}

export default async function AboutPage() {
  const [about, site] = await Promise.all([getAboutPageData(), getSiteData()]);

  return (
    <main className="page page--about">
      <section className="about-page">
        <div className="about-page__copy">
          <h1>{about.intro}</h1>
          {about.paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>

        <aside className="about-page__aside">
          <ul className="about-page__socials">
            {site.socialLinks.map((link) => (
              <li key={link.label}>
                <a href={link.url} target="_blank" rel="noreferrer">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>

          <div className="about-page__art">
            {about.bottomImage ? (
              <Image
                src={about.bottomImage}
                alt={about.bottomImageAlt || about.title}
                fill
                sizes="(max-width: 900px) 100vw, 34vw"
              />
            ) : (
              <div className="about-page__art-placeholder" aria-hidden="true" />
            )}
          </div>
        </aside>
      </section>
    </main>
  );
}
