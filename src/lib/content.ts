import { promises as fs } from "node:fs";
import path from "node:path";
import { cache } from "react";

import type {
  AboutPageData,
  DirectorData,
  HomePageData,
  SiteData,
} from "@/types/content";

const DEFAULT_LOCALE = "pt";
const contentRoot = path.join(process.cwd(), "content", DEFAULT_LOCALE);

async function readJsonFile<T>(filePath: string): Promise<T> {
  const raw = await fs.readFile(filePath, "utf8");

  return JSON.parse(raw) as T;
}

export const getSiteData = cache(async () =>
  readJsonFile<SiteData>(path.join(contentRoot, "site.json")),
);

export const getHomePageData = cache(async () =>
  readJsonFile<HomePageData>(path.join(contentRoot, "pages", "home.json")),
);

export const getAboutPageData = cache(async () =>
  readJsonFile<AboutPageData>(path.join(contentRoot, "pages", "sobre.json")),
);

export const getDirectors = cache(async () => {
  const directoryPath = path.join(contentRoot, "directors");
  const files = (await fs.readdir(directoryPath))
    .filter((file) => file.endsWith(".json"))
    .sort();

  const directors = await Promise.all(
    files.map((file) =>
      readJsonFile<DirectorData>(path.join(directoryPath, file)),
    ),
  );

  return directors.sort(
    (left, right) =>
      left.order - right.order ||
      left.name.localeCompare(right.name, "pt-BR", { sensitivity: "base" }),
  );
});

export const getDirectorBySlug = cache(async (slug: string) => {
  const directors = await getDirectors();

  return directors.find((director) => director.slug === slug) ?? null;
});
