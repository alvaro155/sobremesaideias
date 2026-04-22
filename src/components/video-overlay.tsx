"use client";

import Image from "next/image";
import { useEffect } from "react";

import { getPlayerEmbedUrl } from "@/lib/video";

type VideoOverlayProps = {
  isOpen: boolean;
  title: string;
  videoUrl: string;
  posterImage?: string | null;
  posterAlt?: string;
  onClose: () => void;
};

export function VideoOverlay({
  isOpen,
  title,
  videoUrl,
  posterImage,
  posterAlt,
  onClose,
}: VideoOverlayProps) {
  const embedUrl = getPlayerEmbedUrl(videoUrl);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="video-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
    >
      <button
        className="video-overlay__close"
        type="button"
        onClick={onClose}
      >
        <span className="visually-hidden">Fechar vídeo</span>
        <span className="ui-close ui-close--circle" aria-hidden="true" />
      </button>
      <div
        className="video-overlay__panel"
        onClick={(event) => event.stopPropagation()}
      >
        {posterImage ? (
          <div className="video-overlay__poster">
            <Image
              src={posterImage}
              alt={posterAlt || title}
              fill
              sizes="80vw"
            />
          </div>
        ) : null}
        {embedUrl ? (
          <iframe
            className="video-overlay__frame"
            src={embedUrl}
            title={title}
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <div className="video-overlay__error">
            <p>Não foi possível carregar este vídeo.</p>
          </div>
        )}
      </div>
    </div>
  );
}
