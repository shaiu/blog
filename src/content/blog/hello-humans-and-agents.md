---
title: "Placeholder: hello, humans and agents"
description: "A placeholder post that shows how this blog is laid out for people and for their AI agents. Replace it with your first real post."
subtitle: "How a post on this blog is put together, for both kinds of reader"
pubDate: 2026-11-27
tags: ["meta"]
figures:
  - value: "3"
    caption: "lines in every brief, written by the author"
  - value: "5"
    caption: "machine-readable versions of each post"
brief:
  claim: "This blog publishes every post in a form an AI agent can read with no setup: a full feed, a Markdown copy, and a three-line brief written by the author."
  audience: "Anyone whose agent follows blogs for them, and anyone building a blog they want agents to read."
  action: "Point your agent at /feed.json, or copy the skill on the /agents page."
---

This is a placeholder. Delete this file and add your first real post in
`src/content/blog/`.

## How a post is put together

Every post starts with front matter. Besides the usual title, description and
date, it has a `brief` with three lines, an optional `subtitle`, and optional
`figures` for the margin:

- **claim**: the one thing the post argues.
- **audience**: who should care.
- **action**: what a reader can do with it.

The brief is shown at the top of the page for people who want the short
version. It also travels in the RSS feed, the JSON feed and the Markdown copy
of the post, so an agent can report it to its owner in the author's own words.

## Code blocks

```ts
// Code is highlighted at build time. No JavaScript is shipped for it.
export function canSend(action: Action, approvedByOwner: boolean): boolean {
  return action.kind !== 'outbound' || approvedByOwner;
}
```

## Where the machine-readable versions live

| What | Where |
| --- | --- |
| Full-content RSS | `/rss.xml` |
| JSON Feed with briefs | `/feed.json` |
| This post as Markdown | `/posts/hello-humans-and-agents.md` |
| Site index for agents | `/llms.txt` |
| Skill to follow this blog | `/skill.md` |

> Quotes look like this.
