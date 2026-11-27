import type { APIRoute } from 'astro';
import { SITE } from '../../../consts';
import { getPosts, type Post } from '../../../lib/posts';
import { renderCard } from '../../../lib/og-card';

export async function getStaticPaths() {
  const posts = await getPosts();
  return posts.map((post) => ({ params: { slug: post.id }, props: { post } }));
}

export const GET: APIRoute = async ({ props }) => {
  const { data } = props.post as Post;
  const png = await renderCard({ kicker: 'Field note', title: data.title, author: SITE.author });
  return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } });
};
