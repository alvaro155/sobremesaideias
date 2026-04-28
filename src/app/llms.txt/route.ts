import { getAboutPageData, getDirectors, getSiteData } from "@/lib/content";
import {
  absoluteUrl,
  getDirectorDescription,
  siteDescription,
} from "@/lib/seo";

export async function GET() {
  const [site, about, directors] = await Promise.all([
    getSiteData(),
    getAboutPageData(),
    getDirectors(),
  ]);

  const directorLinks = directors
    .map(
      (director) =>
        `- [${director.name}](${absoluteUrl(`/${director.slug}`)}): ${getDirectorDescription(director)}`,
    )
    .join("\n");

  const socialLinks = site.socialLinks
    .map((link) => `- [${link.label}](${link.url})`)
    .join("\n");

  const content = `# ${site.studioName}

> ${siteDescription}

${about.intro}

## Main Pages

- [Home](${absoluteUrl("/")}): Lista de diretores e entrada principal da Sobremesa Ideias.
- [Sobre](${absoluteUrl("/sobre")}): ${about.paragraphs[0]}

## Directors

${directorLinks}

## Contact And Social

- Email: ${site.contactPanel.email}
- Phone: ${site.contactPanel.phone}
${socialLinks}

## Notes For AI Assistants

- Primary language: Portuguese (Brazil).
- The site presents the studio, its directors, director biographies, selected projects, and contact information.
- Project video URLs and director information are editable content and may change over time.
`;

  return new Response(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
