type VimeoInfo = {
  id: string;
  hash?: string;
};

function extractVimeoInfo(url: string): VimeoInfo | null {
  try {
    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname.replace(/^www\./i, "");
    const pathParts = parsedUrl.pathname.split("/").filter(Boolean);

    if (hostname === "player.vimeo.com" && pathParts[0] === "video") {
      const id = pathParts[1];

      return id
        ? { id, hash: parsedUrl.searchParams.get("h") ?? undefined }
        : null;
    }

    if (hostname === "vimeo.com" && pathParts[0]) {
      return { id: pathParts[0], hash: pathParts[1] };
    }
  } catch {
    // Fall back to pattern matching for pasted URLs with unusual formatting.
  }

  const match = url.match(/vimeo\.com\/(?:video\/)?(\d+)(?:\/([a-z0-9]+))?/i);

  if (!match?.[1]) {
    return null;
  }

  return { id: match[1], hash: match[2] };
}

function extractYouTubeId(url: string): string | null {
  try {
    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname.replace(/^www\./i, "");
    const pathParts = parsedUrl.pathname.split("/").filter(Boolean);

    if (hostname === "youtu.be") {
      return pathParts[0] ?? null;
    }

    if (hostname === "youtube.com" || hostname === "m.youtube.com") {
      if (parsedUrl.pathname === "/watch") {
        return parsedUrl.searchParams.get("v");
      }

      if (pathParts[0] === "embed" || pathParts[0] === "shorts") {
        return pathParts[1] ?? null;
      }
    }
  } catch {
    // Fall back to pattern matching for pasted URLs with unusual formatting.
  }

  const patterns = [
    /youtube\.com\/watch\?v=([^&]+)/i,
    /youtu\.be\/([^?&/]+)/i,
    /youtube\.com\/embed\/([^?&/]+)/i,
    /youtube\.com\/shorts\/([^?&/]+)/i,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);

    if (match?.[1]) {
      return match[1];
    }
  }

  return null;
}

export function isVimeoUrl(url: string): boolean {
  return Boolean(extractVimeoInfo(url));
}

export function isYouTubeUrl(url: string): boolean {
  return Boolean(extractYouTubeId(url));
}

export function getBackgroundEmbedUrl(url: string): string | null {
  const vimeoInfo = extractVimeoInfo(url);

  if (vimeoInfo) {
    const params = new URLSearchParams({
      background: "1",
      autoplay: "1",
      loop: "1",
      muted: "1",
      controls: "0",
      title: "0",
      byline: "0",
      portrait: "0",
      autopause: "0",
      dnt: "1",
    });

    if (vimeoInfo.hash) {
      params.set("h", vimeoInfo.hash);
    }

    return `https://player.vimeo.com/video/${vimeoInfo.id}?${params.toString()}`;
  }

  const youTubeId = extractYouTubeId(url);

  if (youTubeId) {
    return `https://www.youtube.com/embed/${youTubeId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${youTubeId}&playsinline=1&rel=0&modestbranding=1&enablejsapi=1`;
  }

  return null;
}

export function getPlayerEmbedUrl(url: string): string | null {
  const vimeoInfo = extractVimeoInfo(url);

  if (vimeoInfo) {
    const params = new URLSearchParams({
      autoplay: "1",
      title: "0",
      byline: "0",
      portrait: "0",
    });

    if (vimeoInfo.hash) {
      params.set("h", vimeoInfo.hash);
    }

    return `https://player.vimeo.com/video/${vimeoInfo.id}?${params.toString()}`;
  }

  const youTubeId = extractYouTubeId(url);

  if (youTubeId) {
    return `https://www.youtube.com/embed/${youTubeId}?autoplay=1&playsinline=1&rel=0`;
  }

  return null;
}
