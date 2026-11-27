# Blog

A static Astro blog that is equally easy to read for people and for their AI agents.

## Run it

```sh
npm install
npm run dev      # http://localhost:4321
npm run build    # static site in dist/
```

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

## Design

The look follows the Shai Ungar Blog design system: Newsreader for titles and text, Lato for small labels, one accent colour, hairlines instead of boxes, and light and dark themes that follow the reader's system setting. The tokens are CSS custom properties at the top of the global styles in `src/layouts/Base.astro`; change a colour there and it changes everywhere. Both fonts are self-hosted through the `@fontsource` packages, so the site makes no third-party requests.

## What agents get

| Address | What it is |
| --- | --- |
| `/feed.json` | JSON Feed 1.1, full text, with the brief as `_brief` on each item |
| `/rss.xml` | RSS with full text; the item description is the brief |
| `/posts/<name>.md` | Markdown copy of a post, linked from the page with `rel="alternate"` |
| `/llms.txt` | Index of posts with their claims |
| `/skill.md` | Skill a reader can give their agent; also shown on `/agents/` |
| `/robots.txt` | Crawl rules and Content-Signal usage policy |

Each post page also carries schema.org `BlogPosting` JSON-LD.

## Not built yet

- Serving Markdown at the post address when a client sends `Accept: text/markdown`. A static site cannot do this; it needs a rule at the CDN or host.
- Per-post social preview images.
- Audio versions and a podcast feed.
- An MCP server.
