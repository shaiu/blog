import { getCollection, type CollectionEntry } from 'astro:content';
import { SITE } from '../consts';

export type Post = CollectionEntry<'blog'>;

export async function getPosts(): Promise<Post[]> {
  const posts = await getCollection('blog', ({ data }) => !data.draft);
  return posts.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}

export const postPath = (post: Post) => `/posts/${post.id}/`;
export const postUrl = (post: Post) => `${SITE.url}${postPath(post)}`;
export const postMarkdownUrl = (post: Post) => `${SITE.url}/posts/${post.id}.md`;

export const isoDate = (d: Date) => d.toISOString().slice(0, 10);

// 22 November 2026
export const longDate = (d: Date) =>
  d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

export const briefText = (post: Post) =>
  `Claim: ${post.data.brief.claim} Who should care: ${post.data.brief.audience} What to do: ${post.data.brief.action}`;

// The Markdown version of a post: metadata and the brief first, then the body
// exactly as written.
export function toMarkdown(post: Post): string {
  const { data } = post;
  const lines = [
    `# ${data.title}`,
    ...(data.subtitle ? ['', `_${data.subtitle}_`] : []),
    '',
    `- Author: ${SITE.author}`,
    `- Published: ${isoDate(data.pubDate)}`,
    ...(data.updatedDate ? [`- Updated: ${isoDate(data.updatedDate)}`] : []),
    `- Canonical URL: ${postUrl(post)}`,
    ...(data.tags.length ? [`- Tags: ${data.tags.join(', ')}`] : []),
    '',
    '## Brief',
    '',
    `- Claim: ${data.brief.claim}`,
    `- Who should care: ${data.brief.audience}`,
    `- What to do with it: ${data.brief.action}`,
    '',
    '## Post',
    '',
    (post.body ?? '').trim(),
    '',
  ];
  return lines.join('\n');
}
