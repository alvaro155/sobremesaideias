import type { DirectorData } from "@/types/content";

export const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://sobremesaideias.com.br"
).replace(/\/$/, "");

export const siteDescription =
  "Sobremesa Ideias é um estúdio de produção audiovisual que une cinema, publicidade, conteúdo para redes e inteligência artificial com curadoria criativa.";

export function absoluteUrl(pathname = "/") {
  const normalizedPath = pathname.startsWith("/") ? pathname : `/${pathname}`;

  return `${siteUrl}${normalizedPath}`;
}

export function stripMarkdownLinks(text: string) {
  return text.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, "$1");
}

export function truncateText(text: string, maxLength = 155) {
  const cleanText = stripMarkdownLinks(text).replace(/\s+/g, " ").trim();

  if (cleanText.length <= maxLength) {
    return cleanText;
  }

  return `${cleanText.slice(0, maxLength - 1).trimEnd()}…`;
}

export function getDirectorDescription(director: DirectorData) {
  return truncateText(
    director.bioParagraphs[0] ??
      `${director.name}, diretor da Sobremesa Ideias.`,
  );
}
