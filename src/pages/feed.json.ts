import type { APIRoute } from 'astro';
import { SITE } from '../consts';
import { getPosts, postUrl, postMarkdownUrl, briefText } from '../lib/posts';

// JSON Feed 1.1 (https://www.jsonfeed.org/version/1.1/). The `_brief`
// extension carries the author's three-line brief for each post.
export const GET: APIRoute = async () => {
  const posts = await getPosts();
  const feed = {
    version: 'https://jsonfeed.org/version/1.1',
    title: SITE.title,
    description: SITE.description,
    home_page_url: SITE.url,
    feed_url: `${SITE.url}/feed.json`,
    language: SITE.language,
    authors: [{ name: SITE.author, url: `${SITE.url}/about/` }],
    items: posts.map((post) => ({
      id: postUrl(post),
      url: postUrl(post),
      title: post.data.title,
      summary: briefText(post),
      content_html: post.rendered?.html ?? '',
      content_text: (post.body ?? '').trim(),
      date_published: post.data.pubDate.toISOString(),
      ...(post.data.updatedDate ? { date_modified: post.data.updatedDate.toISOString() } : {}),
      tags: post.data.tags,
      _brief: post.data.brief,
      _markdown_url: postMarkdownUrl(post),
    })),
  };
  return new Response(JSON.stringify(feed, null, 2), {
    headers: { 'Content-Type': 'application/feed+json; charset=utf-8' },
  });
};
