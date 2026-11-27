import rss from '@astrojs/rss';
import type { APIRoute } from 'astro';
import { SITE } from '../consts';
import { getPosts, postPath, briefText } from '../lib/posts';

// Full-content RSS. The description of each item is the author's brief.
export const GET: APIRoute = async () => {
  const posts = await getPosts();
  return rss({
    title: SITE.title,
    description: SITE.description,
    site: SITE.url,
    items: posts.map((post) => ({
      title: post.data.title,
      link: postPath(post),
      pubDate: post.data.pubDate,
      description: briefText(post),
      categories: post.data.tags,
      author: SITE.author,
      content: post.rendered?.html ?? '',
    })),
    customData: `<language>${SITE.language}</language>`,
  });
};
