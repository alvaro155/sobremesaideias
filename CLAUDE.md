# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Marketing site for **Sobremesa Ideias**, an audiovisual production studio. It presents the studio, its directors, their biographies and projects, plus contact info. Content is entirely in Portuguese (Brazil); the site is single-locale (`pt`).

## Commands

```bash
npm run dev     # start Next.js dev server at http://localhost:3000
npm run build   # production build (also the best way to type-check the whole app)
npm run start    # serve the production build
npm run lint    # ESLint (eslint-config-next: core-web-vitals + typescript)
```

There is no test suite. Verification is done via `npm run build` (catches type errors since `tsconfig` is `strict` with `noEmit`) and `npm run lint`.

## Tech stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript** (strict).
- No CSS framework — all styling lives in a single global stylesheet, `src/app/globals.css`, using plain class names (e.g. `page--home`, `onepager-director`). Components reference these classes; there are no CSS modules or styled-components.
- Video embeds via `@vimeo/player` (Vimeo) and raw YouTube iframes.
- Path alias: `@/*` → `./src/*`.

## Content architecture (most important concept)

There is **no database and no API**. All editable content is static JSON under `content/pt/`, edited through **Pages CMS** (configured in `.pages.yml`). The CMS commits directly to the repo — commits like `Update content/pt/pages/home.json (via Pages CMS)` come from editors, not developers.

Content layout:
- `content/pt/site.json` — global site data (studio name, logo, header labels, contact panel, social links).
- `content/pt/pages/{home,sobre,diretores}.json` — per-page content.
- `content/pt/directors/{slug}.json` — one file per director (collection), each with `order`, bio, `socialLinks`, and a `projects` list.

`src/lib/content.ts` is the single read layer. Every loader is wrapped in React's `cache()`, reads JSON off disk with `node:fs`, and is consumed only by Server Components. Directors are always returned sorted by `order` then name (`pt-BR` locale). When adding a content field, update **three places** in sync:
1. The `.pages.yml` schema (so editors get the field in the CMS).
2. The matching type in `src/types/content.ts`.
3. The actual JSON content file(s).

## Routing & rendering

App Router pages under `src/app/`, all Server Components that fetch from `src/lib/content.ts`:
- `page.tsx` — home (hero background video + directors list).
- `sobre/page.tsx` — about.
- `diretores/page.tsx` — directors index.
- `[slug]/page.tsx` — individual director page; `generateStaticParams` enumerates director slugs, so each director gets a static route at the site root (e.g. `/billy`).
- `diretores-reel/page.tsx` — one-pager reel, intentionally `noindex` (`robots: { index: false }`).

Interactive pieces are isolated as `"use client"` components in `src/components/` (`background-video`, `director-experience`, `site-header`, `video-overlay`, `directors-list`). Server pages pass already-loaded data down to them as props.

## Video handling

`src/lib/video.ts` normalizes pasted Vimeo/YouTube URLs (incl. Vimeo private hashes and various YouTube URL shapes) into embed URLs:
- `getBackgroundEmbedUrl` — muted, looping, chromeless background playback.
- `getPlayerEmbedUrl` — interactive playback (used by the video overlay).

Always route new video URL handling through these helpers rather than building embed URLs inline.

## SEO & metadata

SEO is a first-class concern. `src/lib/seo.ts` centralizes `siteUrl` (override with `NEXT_PUBLIC_SITE_URL`, defaults to `https://sobremesaideias.com.br`), `absoluteUrl`, the canonical description, and text helpers (`stripMarkdownLinks`, `truncateText`, `getDirectorDescription`). Bio paragraphs support inline Markdown links `[text](url)`, which are stripped for meta descriptions and rendered as real links in `director-experience`.

Generated SEO surfaces:
- `layout.tsx` — base metadata + Organization JSON-LD.
- Per-page `generateMetadata` / `metadata` exports with OpenGraph/Twitter and per-page JSON-LD (`src/components/json-ld.tsx`).
- `sitemap.ts`, `robots.ts`, and `llms.txt/route.ts` (a generated `/llms.txt` summarizing the studio for AI assistants) — all driven by the same content loaders, so they stay in sync automatically.

## Media

Images and videos live in `public/media/` (`directors/`, `logos/`, `onepager/`). Content JSON references them by web path (e.g. `/media/directors/billy_boman.png`). Pages CMS uploads land here per the `media` mapping in `.pages.yml`.
