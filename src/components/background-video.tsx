"use client";

import Image from "next/image";
import type Player from "@vimeo/player";
import { useEffect, useRef, useState } from "react";

import {
  getBackgroundEmbedUrl,
  isVimeoUrl,
  isYouTubeUrl,
} from "@/lib/video";

type BackgroundVideoProps = {
  videoUrl: string;
  title: string;
  posterImage?: string | null;
  posterAlt?: string;
  eager?: boolean;
  interactive?: boolean;
};

type BackgroundController = {
  play: () => Promise<void>;
  pause: () => Promise<void>;
  destroy: () => Promise<void> | void;
};

export function BackgroundVideo({
  videoUrl,
  title,
  posterImage,
  posterAlt,
  eager = false,
  interactive = false,
}: BackgroundVideoProps) {
  const frameRef = useRef<HTMLDivElement | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const controllerRef = useRef<BackgroundController | null>(null);
  const [isActive, setIsActive] = useState(eager);
  const [isPaused, setIsPaused] = useState(false);
  const embedUrl = getBackgroundEmbedUrl(videoUrl);
  const isVimeo = isVimeoUrl(videoUrl);
  const isYouTube = isYouTubeUrl(videoUrl);
  const canTogglePlayback = interactive && (isVimeo || isYouTube);

  useEffect(() => {
    if (eager || !frameRef.current) {
      setIsActive(true);
      return;
    }

    // Only keep the background player mounted while its section is in view.
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsActive(entry.isIntersecting && entry.intersectionRatio >= 0.45);
      },
      {
        threshold: [0.1, 0.45, 0.8],
      },
    );

    observer.observe(frameRef.current);

    return () => observer.disconnect();
  }, [eager]);

  useEffect(() => {
    if (!canTogglePlayback || !isActive || !iframeRef.current) {
      return;
    }

    let cancelled = false;
    let mountedPlayer: Player | null = null;
    let mountedController: BackgroundController | null = null;
    let handlePlay = () => undefined;
    let handlePause = () => undefined;

    const setupPlayer = async () => {
      if (cancelled || !iframeRef.current) {
        return;
      }

      if (isVimeo) {
        const { default: VimeoPlayer } = await import("@vimeo/player");

        if (cancelled || !iframeRef.current) {
          return;
        }

        mountedPlayer = new VimeoPlayer(iframeRef.current);

        handlePlay = () => {
          setIsPaused(false);
        };

        handlePause = () => {
          setIsPaused(true);
        };

        mountedPlayer.on("play", handlePlay);
        mountedPlayer.on("pause", handlePause);

        mountedController = {
          play: () => mountedPlayer?.play() ?? Promise.resolve(),
          pause: () => mountedPlayer?.pause() ?? Promise.resolve(),
          destroy: () => mountedPlayer?.destroy() ?? Promise.resolve(),
        };

        controllerRef.current = mountedController;

        try {
          await mountedPlayer.ready();

          if (!cancelled) {
            setIsPaused(await mountedPlayer.getPaused());
          }
        } catch {
          if (!cancelled) {
            setIsPaused(false);
          }
        }

        return;
      }

      if (isYouTube) {
        const iframeElement = iframeRef.current;

        mountedController = {
          play: async () => {
            iframeElement?.contentWindow?.postMessage(
              JSON.stringify({
                event: "command",
                func: "playVideo",
                args: [],
              }),
              "*",
            );
          },
          pause: async () => {
            iframeElement?.contentWindow?.postMessage(
              JSON.stringify({
                event: "command",
                func: "pauseVideo",
                args: [],
              }),
              "*",
            );
          },
          destroy: () => undefined,
        };

        controllerRef.current = mountedController;
        setIsPaused(false);
      }
    };

    setupPlayer();

    return () => {
      cancelled = true;

      if (mountedPlayer) {
        mountedPlayer.off("play", handlePlay);
        mountedPlayer.off("pause", handlePause);
      }

      mountedController?.destroy();

      if (controllerRef.current === mountedController) {
        controllerRef.current = null;
      }
    };
  }, [canTogglePlayback, isActive, isVimeo, isYouTube]);

  async function handleTogglePlayback() {
    const controller = controllerRef.current;

    if (!controller) {
      return;
    }

    try {
      if (isPaused) {
        await controller.play();
        setIsPaused(false);
      } else {
        await controller.pause();
        setIsPaused(true);
      }
    } catch {
      // Ignore player control errors and keep the background usable.
    }
  }

  return (
    <div className="video-stage" ref={frameRef}>
      {posterImage ? (
        <div className="video-stage__poster">
          <Image
            src={posterImage}
            alt={posterAlt || title}
            fill
            sizes="100vw"
          />
        </div>
      ) : (
        <div className="video-stage__fallback" aria-hidden="true" />
      )}

      {isActive && embedUrl ? (
        <iframe
          className="video-stage__frame"
          ref={iframeRef}
          src={embedUrl}
          title={`${title} background`}
          allow="autoplay; fullscreen; picture-in-picture"
        />
      ) : null}

      {canTogglePlayback ? (
        <button
          className="video-stage__toggle"
          type="button"
          onClick={handleTogglePlayback}
          aria-label={
            isPaused ? "Reproduzir vídeo de fundo" : "Pausar vídeo de fundo"
          }
        />
      ) : null}
    </div>
  );
}
