import Image from "next/image";

import { getAboutPageData, getSiteData } from "@/lib/content";

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
