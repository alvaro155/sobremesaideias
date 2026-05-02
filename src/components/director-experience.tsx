"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";

import type { DirectorData } from "@/types/content";
import { BackgroundVideo } from "@/components/background-video";
import { DirectorsList } from "@/components/directors-list";
import { VideoOverlay } from "@/components/video-overlay";

type DirectorExperienceProps = {
  director: DirectorData;
  directors: DirectorData[];
};

const bioLinkPattern = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;

function renderBioParagraph(paragraph: string): ReactNode {
  const matches = Array.from(paragraph.matchAll(bioLinkPattern));

  if (!matches.length) {
    return paragraph;
  }

  const parts: ReactNode[] = [];
  let lastIndex = 0;

  matches.forEach((match, index) => {
    const matchIndex = match.index ?? 0;

    if (matchIndex > lastIndex) {
      parts.push(paragraph.slice(lastIndex, matchIndex));
    }

    parts.push(
      <a
        className="director-bio__text-link"
        href={match[2]}
        key={`${match[1]}-${index}`}
        target="_blank"
        rel="noreferrer"
      >
        {match[1]}
      </a>,
    );

    lastIndex = matchIndex + match[0].length;
  });

  if (lastIndex < paragraph.length) {
    parts.push(paragraph.slice(lastIndex));
  }

  return parts;
}

export function DirectorExperience({
  director,
  directors,
}: DirectorExperienceProps) {
  const [activeSection, setActiveSection] = useState(
    director.projects[0]?.id ?? "bio",
  );
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null,
  );

  const selectedProject = useMemo(
    () =>
      director.projects.find((project) => project.id === selectedProjectId) ??
      null,
    [director.projects, selectedProjectId],
  );

  const activeProjectIndex = director.projects.findIndex(
    (project) => project.id === activeSection,
  );

  function shouldPreloadProject(projectIndex: number) {
    if (activeProjectIndex >= 0) {
      return Math.abs(projectIndex - activeProjectIndex) <= 1;
    }

    return activeSection === "bio" && projectIndex === director.projects.length - 1;
  }

  useEffect(() => {
    document.documentElement.classList.add("director-scroll-page");
    document.body.classList.add("director-scroll-page");

    return () => {
      document.documentElement.classList.remove("director-scroll-page");
      document.body.classList.remove("director-scroll-page");
    };
  }, [director.slug]);

  useEffect(() => {
    const sections = Array.from(
      document.querySelectorAll<HTMLElement>("[data-anchor-section]"),
    );

    if (!sections.length) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((left, right) => right.intersectionRatio - left.intersectionRatio)
          .at(0);

        if (visible?.target.id) {
          setActiveSection(visible.target.id);
        }
      },
      {
        threshold: [0.3, 0.55, 0.8],
        rootMargin: "-15% 0px -15% 0px",
      },
    );

    sections.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, [director.slug]);

  const navItems = [
    ...director.projects.map((project) => ({
      id: project.id,
      label: project.id,
    })),
    { id: "bio", label: "Bio" },
    { id: "diretores", label: "Diretores" },
  ];

  return (
    <>
      <div className="director-page">
        <nav className="director-page__bullets" aria-label="Seções do diretor">
          <ul>
            {navItems.map((item) => (
              <li key={item.id}>
                <a
                  className={`director-page__bullet${
                    activeSection === item.id
                      ? " director-page__bullet--active"
                      : ""
                  }`}
                  href={`#${item.id}`}
                  aria-label={`Ir para ${item.label}`}
                />
              </li>
            ))}
          </ul>
        </nav>

        {director.projects.map((project, projectIndex) => {
          const videoUrl = project.videoUrl ?? "";
          const hasVideo = Boolean(videoUrl.trim());

          return (
            <section
              className="director-section director-section--project"
              data-anchor-section
              id={project.id}
              key={project.id}
            >
              <BackgroundVideo
                title={`${director.name} ${project.title}`}
                videoUrl={videoUrl}
                posterImage={project.coverImage}
                posterAlt={project.coverImageAlt}
                preload={hasVideo && shouldPreloadProject(projectIndex)}
              />
              <div className="director-section__tint" aria-hidden="true" />

              {hasVideo ? (
                <button
                  className="director-section__hitarea"
                  type="button"
                  onClick={() => setSelectedProjectId(project.id)}
                >
                  <span className="visually-hidden">
                    Abrir vídeo de {project.title}
                  </span>
                </button>
              ) : null}

              <div className="director-section__meta">
                <p>{director.name}</p>
                {hasVideo ? (
                  <button
                    className="director-section__project-link"
                    type="button"
                    onClick={() => setSelectedProjectId(project.id)}
                  >
                    {project.title}
                  </button>
                ) : (
                  <span className="director-section__project-link director-section__project-link--disabled">
                    {project.title}
                  </span>
                )}
                {hasVideo ? <span>Assistir</span> : null}
              </div>
            </section>
          );
        })}

        <section
          className="director-section director-section--bio"
          data-anchor-section
          id="bio"
        >
          <div className="director-bio">
            <div className="director-bio__copy">
              <h1>{director.bioTitle}</h1>

              <div className="director-bio__body">
                {director.bioParagraphs.map((paragraph) => (
                  <p key={paragraph}>{renderBioParagraph(paragraph)}</p>
                ))}

                <div className="director-bio__links">
                  {director.socialLinks.map((link) => (
                    <a
                      href={link.url}
                      key={link.label}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {link.label}
                    </a>
                  ))}
                </div>
              </div>
            </div>

            <div className="director-bio__portrait">
              {director.portrait ? (
                <Image
                  src={director.portrait}
                  alt={director.portraitAlt || director.name}
                  fill
                  sizes="(max-width: 900px) 100vw, 40vw"
                />
              ) : (
                <div className="director-bio__portrait-placeholder" />
              )}
            </div>
          </div>
        </section>

        <section
          className="director-section director-section--footer"
          data-anchor-section
          id="diretores"
        >
          <DirectorsList
            directors={directors}
            title="Diretores"
            variant="footer"
          />
        </section>
      </div>

      <VideoOverlay
        isOpen={Boolean(selectedProject)}
        title={
          selectedProject
            ? `${director.name} - ${selectedProject.title}`
            : director.name
        }
        videoUrl={selectedProject?.videoUrl ?? ""}
        posterImage={selectedProject?.coverImage}
        posterAlt={selectedProject?.coverImageAlt}
        onClose={() => setSelectedProjectId(null)}
      />
    </>
  );
}
