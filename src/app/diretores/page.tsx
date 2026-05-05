import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { BackgroundVideo } from "@/components/background-video";
import { JsonLd } from "@/components/json-ld";
import {
  getDirectors,
  getDirectorsPageData,
  getSiteData,
} from "@/lib/content";
import { absoluteUrl, siteDescription } from "@/lib/seo";
import type { DirectorData, DirectorProject, SiteData } from "@/types/content";

export const metadata: Metadata = {
  title: "Diretores da Casa",
  description:
    "Conheça os diretores da Sobremesa Ideias em uma seleção de reels e projetos audiovisuais.",
  alternates: {
    canonical: "/diretores",
  },
  openGraph: {
    title: "Diretores da Casa | Sobremesa Ideias",
    description:
      "Uma seleção de reels dos diretores da Sobremesa Ideias.",
    url: absoluteUrl("/diretores"),
    type: "website",
  },
};

type FeaturedDirector = {
  director: DirectorData;
  project: DirectorProject | null;
};

function getFeaturedProject(director: DirectorData) {
  const featuredProject = director.featuredProjectId
    ? director.projects.find((project) => project.id === director.featuredProjectId)
    : null;

  return (
    featuredProject ??
    director.projects.find((project) => Boolean(project.videoUrl)) ??
    director.projects[0] ??
    null
  );
}

function getWhatsappUrl(phone: string) {
  const phoneNumber = phone.replace(/\D+/g, "");

  return phoneNumber ? `https://wa.me/${phoneNumber}` : null;
}

function getEndingLinks(site: SiteData) {
  const whatsappUrl = getWhatsappUrl(site.contactPanel.phone);

  return [
    ...site.socialLinks,
    {
      label: "Email",
      url: `mailto:${site.contactPanel.email}`,
    },
    ...(whatsappUrl
      ? [
          {
            label: "Whatsapp",
            url: whatsappUrl,
          },
        ]
      : []),
  ];
}

function getDirectorAnchorId(name: string) {
  return name
    .split(" ")[0]
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export default async function DiretoresPage() {
  const [page, site, directors] = await Promise.all([
    getDirectorsPageData(),
    getSiteData(),
    getDirectors(),
  ]);

  const featuredDirectors: FeaturedDirector[] = directors.map((director) => ({
    director,
    project: getFeaturedProject(director),
  }));

  const endingLinks = getEndingLinks(site);
  const firstDirectorAnchor = featuredDirectors[0]
    ? getDirectorAnchorId(featuredDirectors[0].director.name)
    : "billy";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: page.title,
    description: siteDescription,
    url: absoluteUrl("/diretores"),
    mainEntity: featuredDirectors.map(({ director, project }) => ({
      "@type": "CreativeWork",
      name: `${director.name} - ${project?.title ?? page.reelLabel}`,
      url: absoluteUrl(`/${director.slug}`),
    })),
  };

  return (
    <main className="page page--directors-onepager">
      <JsonLd data={jsonLd} />

      <section className="onepager-hero" aria-labelledby="diretores-title">
        <Image
          className="onepager-hero__background onepager-hero__background--desktop"
          src={page.heroBackgroundDesktop}
          alt=""
          fill
          priority
          sizes="100vw"
        />
        <Image
          className="onepager-hero__background onepager-hero__background--mobile"
          src={page.heroBackgroundMobile}
          alt=""
          fill
          priority
          sizes="100vw"
        />

        <h1 className="onepager-hero__heading" id="diretores-title">
          {page.title}
        </h1>
        <a
          className="onepager-hero__composition"
          href={`#${firstDirectorAnchor}`}
          aria-label="Ver diretores"
        >
          <Image
            className="onepager-hero__composition-image"
            src="/media/onepager/hero.png"
            alt=""
            width={475}
            height={865}
            priority
          />
        </a>
      </section>

      {featuredDirectors.map(({ director, project }, index) => (
        <section
          className="onepager-director"
          id={getDirectorAnchorId(director.name)}
          key={director.slug}
        >
          <div className="onepager-director__media">
            {project?.videoUrl ? (
              <BackgroundVideo
                eager={index === 0}
                preload={index < 5}
                persistWhenLoaded
                interactive={false}
                posterImage={project.coverImage}
                posterAlt={project.coverImageAlt}
                title={`${director.name} - ${project.title}`}
                videoUrl={project.videoUrl}
              />
            ) : project?.coverImage ? (
              <Image
                src={project.coverImage}
                alt={project.coverImageAlt || project.title}
                fill
                sizes="100vw"
              />
            ) : (
              <div className="onepager-director__fallback">
                <span>{director.name}</span>
              </div>
            )}
          </div>

          <div className="onepager-director__stripe">
            <div className="onepager-director__stripe-content">
              <h2>
                <Link
                  className="onepager-director__name-link"
                  href={`/${director.slug}`}
                >
                  {director.name}
                </Link>
              </h2>
              <Link
                className="onepager-director__reel-link"
                href={`/${director.slug}`}
              >
                {page.reelLabel}
              </Link>
            </div>
          </div>
        </section>
      ))}

      <section className="onepager-end" aria-label="Links da Sobremesa Ideias">
        <Image
          className="onepager-end__background onepager-end__background--desktop"
          src={page.endingBackgroundDesktop}
          alt=""
          fill
          sizes="100vw"
        />
        <Image
          className="onepager-end__background onepager-end__background--mobile"
          src={page.endingBackgroundMobile}
          alt=""
          fill
          sizes="100vw"
        />

        {page.endingSymbolImage ? (
          <Image
            className="onepager-end__symbol"
            src={page.endingSymbolImage}
            alt={page.endingSymbolAlt}
            width={721}
            height={1171}
          />
        ) : null}

        <p className="onepager-end__site">{page.websiteLabel}</p>

        <ul className="onepager-end__links" aria-label="Links de contato">
          {endingLinks.map((link) => (
            <li key={`${link.label}-${link.url}`}>
              <a
                href={link.url}
                target={link.url.startsWith("http") ? "_blank" : undefined}
                rel={
                  link.url.startsWith("http") ? "noreferrer" : undefined
                }
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
