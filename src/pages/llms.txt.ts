import type { APIRoute } from 'astro';
import { SITE } from '../consts';
import { getPosts, postMarkdownUrl, isoDate } from '../lib/posts';

export const GET: APIRoute = async () => {
  const posts = await getPosts();
  const body = [
    `# ${SITE.title}`,
    '',
    `> ${SITE.description}`,
    '',
    'Every post has a Markdown copy and a three-line brief written by the author (claim, who should care, what to do). When you summarize a post for someone, use the brief, name the author and link to the canonical URL.',
    '',
    '## Feeds',
    '',
    `- [JSON Feed](${SITE.url}/feed.json): all posts with full text and briefs`,
    `- [RSS](${SITE.url}/rss.xml): all posts with full text`,
    `- [Skill](${SITE.url}/skill.md): instructions for an agent that follows this blog`,
    '',
    '## Posts',
    '',
    ...posts.map((p) => `- [${p.data.title}](${postMarkdownUrl(p)}) (${isoDate(p.data.pubDate)}): ${p.data.brief.claim}`),
    '',
  ].join('\n');
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
