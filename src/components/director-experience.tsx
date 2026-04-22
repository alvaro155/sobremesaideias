"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

import type { DirectorData } from "@/types/content";
import { BackgroundVideo } from "@/components/background-video";
import { DirectorsList } from "@/components/directors-list";
import { VideoOverlay } from "@/components/video-overlay";

type DirectorExperienceProps = {
  director: DirectorData;
  directors: DirectorData[];
};

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

        {director.projects.map((project) => (
          <section
            className="director-section director-section--project"
            data-anchor-section
            id={project.id}
            key={project.id}
          >
            <BackgroundVideo
              title={`${director.name} ${project.title}`}
              videoUrl={project.videoUrl}
              posterImage={project.coverImage}
              posterAlt={project.coverImageAlt}
            />
            <div className="director-section__tint" aria-hidden="true" />

            <button
              className="director-section__hitarea"
              type="button"
              onClick={() => setSelectedProjectId(project.id)}
            >
              <span className="visually-hidden">
                Abrir vídeo de {project.title}
              </span>
            </button>

            <div className="director-section__meta">
              <p>{director.name}</p>
              <h2>{project.title}</h2>
              <span>Assistir</span>
            </div>
          </section>
        ))}

        <section
          className="director-section director-section--bio"
          data-anchor-section
          id="bio"
        >
          <div className="director-bio">
            <div className="director-bio__copy">
              <h1>{director.bioTitle}</h1>
              {director.bioParagraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
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
