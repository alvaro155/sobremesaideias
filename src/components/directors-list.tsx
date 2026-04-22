"use client";

import type { CSSProperties } from "react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type DirectorLinkItem = {
  slug: string;
  name: string;
};

type DirectorsListProps = {
  directors: DirectorLinkItem[];
  title?: string;
  variant?: "hero" | "footer";
};

export function DirectorsList({
  directors,
  title,
  variant = "hero",
}: DirectorsListProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [isAnimationReady, setIsAnimationReady] = useState(false);
  const [hasRevealed, setHasRevealed] = useState(false);

  useEffect(() => {
    if (variant !== "footer" || !rootRef.current) {
      return;
    }

    setIsAnimationReady(true);

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || entry.intersectionRatio < 0.3) {
          return;
        }

        setHasRevealed(true);
        observer.disconnect();
      },
      {
        threshold: [0.15, 0.3, 0.55],
        rootMargin: "-10% 0px -10% 0px",
      },
    );

    observer.observe(rootRef.current);

    return () => observer.disconnect();
  }, [variant]);

  return (
    <div
      className={`directors-list directors-list--${variant}${
        isAnimationReady ? " directors-list--ready" : ""
      }${hasRevealed ? " directors-list--revealed" : ""}`}
      ref={rootRef}
    >
      {title ? <p className="directors-list__label">{title}</p> : null}
      <nav aria-label="Diretores">
        <ul className="directors-list__items">
          {directors.map((director, index) => (
            <li
              key={director.slug}
              style={
                {
                  "--stagger-index": index,
                } as CSSProperties
              }
            >
              <Link
                className="directors-list__link"
                href={`/${director.slug}`}
              >
                {director.name.toUpperCase()}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
