# Blog

A static Astro blog that is equally easy to read for people and for their AI agents.

## Run it

```sh
npm install
npm run dev      # http://localhost:4321 (Astro only)
npm run build    # static site in dist/
npm run preview  # build, then serve through the Cloudflare runtime, as in production
npm test         # tests for the Worker and the social images
```

Needs the Node version in `.node-version`.

## Deploy

The site is a Cloudflare Worker with static assets, at https://blog.shaiungar.me. Cloudflare's Git integration (Workers Builds) builds and deploys each push to `main`. `npm run deploy` does the same from your machine.

| File | What it does |
| --- | --- |
| `wrangler.jsonc` | Worker name, assets directory and the custom domain |
| `public/_headers` | Content types for the feeds and the text files. A static build ignores the headers set in Astro endpoints, so a new machine-readable file may need a rule here |
| `worker/index.js` | Answers `Accept: text/markdown` on a post address with the Markdown copy. It runs only for `/posts/*`; other requests are free static asset requests |

The Git integration's settings live in the Cloudflare dashboard, on the `blog` Worker under Settings, not in this repo. If you ever reconnect it:

| Setting | Value |
| --- | --- |
| Repository and branch | `shaiu/blog`, `main` only |
| Build command | `npm run build` |
| Deploy command | `npx wrangler deploy` |
| Root directory | `/` |
| Enable Preview Builds (under Branch control) | Off. With it on, every other branch fails its check, because `wrangler.jsonc` has no `previews` block |

The build takes its Node version from `.node-version`. It does not run `npm test`, so run that before you push.

Two rules on the `shaiungar.me` zone also live only in the dashboard, under Rules. Another site uses the root domain, so both match the blog's hostname alone. Keep it that way: don't select "All incoming requests", and don't change the zone-wide versions of these settings.

**Configuration Rule `blog: allow agent clients`.** Turns off Browser Integrity Check, which returned a 403 to Python's built-in HTTP client (`Python-urllib`).

- When: `http.host eq "blog.shaiungar.me"`
- Setting: Browser Integrity Check off

**Redirect Rule `blog: http to https`.**

- When: `http.host eq "blog.shaiungar.me" and not ssl`
- Dynamic target: `concat("https://", http.host, http.request.uri.path)`
- Status code 301, with Preserve query string on

## Before you deploy

1. Set your domain in `src/consts.ts` (`SITE.url`). Feeds, canonical links and the skill all use it.
2. Edit `src/pages/about.astro`.
3. Decide on `ai-train` in `src/pages/robots.txt.ts`.
4. Delete the placeholder post.

## Write a post

Add a Markdown file to `src/content/blog/`. The file name becomes the address.

```md
---
title: "Why I gave my AI agent my inbox anyway"
description: "One or two sentences for search results and link previews."
subtitle: "One light line under the title (optional)."
pubDate: 2026-12-01
tags: ["agents"]
brief:
  claim: "The one thing this post argues."
  audience: "Who should care."
  action: "What a reader can do with it."
figures:
  - value: "938"
    caption: "emails archived in one morning"
---

Post text.
```

The build fails if a post has no `brief`. `figures` are optional: up to four real numbers from the post, shown in the margin. Numbered lists in a post are set as the rule list (hairlines and italic numerals). Set `draft: true` to keep a post out of the site and the feeds.

## Social preview images

The build draws a 1200x630 PNG for each post (`/og/posts/<name>.png`) and one for all other pages (`/og/default.png`). `src/lib/og-card.ts` takes the colours from the light theme in `Base.astro` and the fonts from the `@fontsource` packages, and makes no network calls. If a title uses a character these fonts do not have (emoji, Hebrew), the build fails and names the character.

## Design

The look follows the Shai Ungar Blog design system: Newsreader for titles and text, Lato for small labels, one accent colour, hairlines instead of boxes, and light and dark themes that follow the reader's system setting. The tokens are CSS custom properties at the top of the global styles in `src/layouts/Base.astro`; change a colour there and it changes everywhere. Both fonts are self-hosted through the `@fontsource` packages, so the site makes no third-party requests.

## What agents get

| Address | What it is |
| --- | --- |
| `/feed.json` | JSON Feed 1.1, full text, with the brief as `_brief` on each item |
| `/rss.xml` | RSS with full text; the item description is the brief |
| `/posts/<name>.md` | Markdown copy of a post, linked from the page with `rel="alternate"` |
| `/posts/<name>/` with `Accept: text/markdown` | The same Markdown copy, at the post address (`Vary: Accept`) |
| `/llms.txt` | Index of posts with their claims |
| `/skill.md` | Skill a reader can give their agent; also shown on `/agents/` |
| `/robots.txt` | Crawl rules and Content-Signal usage policy |

Each post page also carries schema.org `BlogPosting` JSON-LD.

## Not built yet

- Audio versions and a podcast feed.
- An MCP server.
