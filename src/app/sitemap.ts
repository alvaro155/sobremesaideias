import type { MetadataRoute } from "next";

import { getDirectors } from "@/lib/content";
import { absoluteUrl } from "@/lib/seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const directors = await getDirectors();
  const now = new Date();

  return [
    {
      url: absoluteUrl("/"),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: absoluteUrl("/sobre"),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    ...directors.map((director) => ({
      url: absoluteUrl(`/${director.slug}`),
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
