import type { APIRoute } from 'astro';
import { SITE } from '../../consts';
import { renderCard } from '../../lib/og-card';

// The social preview for every page that is not a post.
export const GET: APIRoute = async () =>
  new Response(new Uint8Array(await renderCard({ title: SITE.tagline, author: SITE.author })), {
    headers: { 'Content-Type': 'image/png' },
  });
