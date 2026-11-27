import type { APIRoute } from 'astro';
import { SITE } from '../consts';

// Content-Signal states how this content may be used once fetched
// (https://contentsignals.org/). Change `ai-train` to `no` if you want your
// posts read and cited by AI tools but not used for model training.
export const GET: APIRoute = () =>
  new Response(
    [
      'User-agent: *',
      'Content-Signal: search=yes, ai-input=yes, ai-train=yes',
      'Allow: /',
      '',
      `Sitemap: ${SITE.url}/sitemap-index.xml`,
      '',
    ].join('\n'),
    { headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
  );
