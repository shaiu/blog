import type { APIRoute } from 'astro';
import { getPosts, toMarkdown, type Post } from '../../lib/posts';

export async function getStaticPaths() {
  const posts = await getPosts();
  return posts.map((post) => ({ params: { slug: post.id }, props: { post } }));
}

export const GET: APIRoute = ({ props }) =>
  new Response(toMarkdown(props.post as Post), {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  });
