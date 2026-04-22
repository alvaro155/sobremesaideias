"use client";

import type { CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import type { SiteData } from "@/types/content";

type SiteHeaderProps = {
  site: SiteData;
};

export function SiteHeader({ site }: SiteHeaderProps) {
  const pathname = usePathname();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const isSvgLogo = site.logoImage?.toLowerCase().endsWith(".svg");

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsDrawerOpen(false);
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => window.removeEventListener("keydown", handleEscape);
  }, []);

  return (
    <>
      <header className="site-header">
        <Link className="site-header__brand" href="/">
          {site.logoImage ? (
            isSvgLogo ? (
              <>
                <span className="visually-hidden">{site.studioName}</span>
                <span
                  className="site-header__logo-image site-header__logo-image--svg"
                  style={
                    {
                      "--logo-image": `url("${site.logoImage}")`,
                    } as CSSProperties
                  }
                  aria-hidden="true"
                />
              </>
            ) : (
              <span className="site-header__logo-image">
                <Image
                  src={site.logoImage}
                  alt={site.studioName}
                  fill
                  sizes="180px"
                />
              </span>
            )
          ) : (
            <span className="site-header__logo-text">{site.logoText}</span>
          )}
        </Link>

        <nav className="site-header__nav" aria-label="Principal">
          <Link
            className={`site-header__link${
              pathname === "/sobre" ? " site-header__link--active" : ""
            }`}
            href="/sobre"
            aria-current={pathname === "/sobre" ? "page" : undefined}
            onClick={() => setIsDrawerOpen(false)}
          >
            {site.header.aboutLabel}
          </Link>
          <button
            className="site-header__link"
            type="button"
            onClick={() => setIsDrawerOpen(true)}
          >
            {site.header.contactLabel}
          </button>
        </nav>
      </header>

      <div
        className={`contact-drawer-backdrop${
          isDrawerOpen ? " contact-drawer-backdrop--open" : ""
        }`}
        onClick={() => setIsDrawerOpen(false)}
      />

      <aside
        className={`contact-drawer${
          isDrawerOpen ? " contact-drawer--open" : ""
        }`}
        aria-hidden={!isDrawerOpen}
      >
        <button
          className="contact-drawer__close"
          type="button"
          onClick={() => setIsDrawerOpen(false)}
        >
          <span className="visually-hidden">Fechar contato</span>
          <span className="ui-close" aria-hidden="true" />
        </button>

        <div className="contact-drawer__content">
          <h2>{site.contactPanel.title}</h2>

          <div className="contact-drawer__details">
            <p>{site.contactPanel.role}</p>
            <p className="contact-drawer__name">{site.contactPanel.name}</p>
            <a href={`tel:${site.contactPanel.phone.replace(/\s+/g, "")}`}>
              {site.contactPanel.phone}
            </a>
            <a href={`mailto:${site.contactPanel.email}`}>
              {site.contactPanel.email}
            </a>
          </div>

          <ul className="contact-drawer__links">
            {site.socialLinks.map((link) => (
              <li key={link.label}>
                <a href={link.url} target="_blank" rel="noreferrer">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </>
  );
}
