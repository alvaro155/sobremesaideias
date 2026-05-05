"use client";

import type { CSSProperties, MouseEvent } from "react";
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isSvgLogo = site.logoImage?.toLowerCase().endsWith(".svg");
  const whatsappPhone = site.contactPanel.phone.replace(/\D+/g, "");

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsDrawerOpen(false);
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => window.removeEventListener("keydown", handleEscape);
  }, []);

  useEffect(() => {
    document.body.classList.toggle(
      "mobile-menu-open",
      isMobileMenuOpen || isDrawerOpen,
    );

    return () => document.body.classList.remove("mobile-menu-open");
  }, [isDrawerOpen, isMobileMenuOpen]);

  function handleOpenContact() {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    setIsMobileMenuOpen(false);
    setIsDrawerOpen(true);
  }

  function handleMobileMenuNavigation() {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    setIsMobileMenuOpen(false);
  }

  function handleDirectorsNavigation(event: MouseEvent<HTMLAnchorElement>) {
    event.currentTarget.blur();
    setIsDrawerOpen(false);
    setIsMobileMenuOpen(false);

    if (pathname === "/diretores") {
      event.preventDefault();
      window.requestAnimationFrame(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    }
  }

  function handleMobileMenuButtonClick(event: MouseEvent<HTMLButtonElement>) {
    event.currentTarget.blur();

    if (isDrawerOpen) {
      setIsDrawerOpen(false);
      return;
    }

    setIsMobileMenuOpen((isOpen) => !isOpen);
  }

  function handleBrandClick(event: MouseEvent<HTMLAnchorElement>) {
    event.currentTarget.blur();
    setIsDrawerOpen(false);
    setIsMobileMenuOpen(false);
  }

  const isMobileHeaderControlOpen = isMobileMenuOpen || isDrawerOpen;

  return (
    <>
      <header className="site-header">
        <Link
          className="site-header__brand"
          href="/"
          onClick={handleBrandClick}
        >
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
              pathname === "/diretores" ? " site-header__link--active" : ""
            }`}
            href="/diretores"
            aria-current={pathname === "/diretores" ? "page" : undefined}
            onClick={handleDirectorsNavigation}
          >
            {site.header.directorsLabel}
          </Link>
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

        <button
          className={`site-header__menu-button${
            isMobileHeaderControlOpen ? " site-header__menu-button--open" : ""
          }`}
          type="button"
          aria-expanded={isMobileHeaderControlOpen}
          aria-controls="mobile-menu contact-drawer"
          onClick={handleMobileMenuButtonClick}
        >
          <span className="visually-hidden">
            {isMobileHeaderControlOpen ? "Fechar menu" : "Abrir menu"}
          </span>
          <span className="site-header__menu-lines" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
        </button>
      </header>

      <div
        className={`mobile-menu${isMobileMenuOpen ? " mobile-menu--open" : ""}`}
        id="mobile-menu"
        aria-hidden={!isMobileMenuOpen}
      >
        <nav className="mobile-menu__nav" aria-label="Menu mobile">
          <Link
            className={`mobile-menu__link${
              pathname === "/diretores" ? " mobile-menu__link--active" : ""
            }`}
            href="/diretores"
            aria-current={pathname === "/diretores" ? "page" : undefined}
            onClick={handleDirectorsNavigation}
          >
            {site.header.directorsLabel}
          </Link>
          <Link
            className={`mobile-menu__link${
              pathname === "/sobre" ? " mobile-menu__link--active" : ""
            }`}
            href="/sobre"
            aria-current={pathname === "/sobre" ? "page" : undefined}
            onClick={handleMobileMenuNavigation}
          >
            {site.header.aboutLabel}
          </Link>
          <button
            className="mobile-menu__link"
            type="button"
            onClick={handleOpenContact}
          >
            {site.header.contactLabel}
          </button>
        </nav>

        <ul className="mobile-menu__socials">
          {site.socialLinks.map((link) => (
            <li key={link.label}>
              <a href={link.url} target="_blank" rel="noreferrer">
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </div>

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
        id="contact-drawer"
        aria-hidden={!isDrawerOpen}
      >
        <video
          className="contact-drawer__video"
          src="/media/bg.mp4"
          autoPlay
          muted
          loop
          playsInline
          aria-hidden="true"
        />

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
            <a
              href={`https://wa.me/${whatsappPhone}`}
              target="_blank"
              rel="noreferrer"
              aria-label={`Abrir WhatsApp para ${site.contactPanel.phone}`}
            >
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
