// Content negotiation for post pages. Every other request is served straight
// from the static assets without running this code (see wrangler.jsonc).

// Matches /posts/<name> and /posts/<name>/.
const POST_PATH = /^\/posts\/([^/]+)\/?$/;

// The q-value the client gave a media type, or 0 if it did not name it.
// Wildcards do not count: a client has to ask for Markdown by name.
function quality(accept, type) {
  for (const entry of accept.toLowerCase().split(',')) {
    const [name, ...params] = entry.split(';').map((part) => part.trim());
    if (name !== type) continue;
    const q = params.find((param) => param.startsWith('q='));
    return q ? Number(q.slice(2)) || 0 : 1;
  }
  return 0;
}

export function prefersMarkdown(accept) {
  if (!accept) return false;
  const markdown = quality(accept, 'text/markdown');
  return markdown > 0 && markdown >= quality(accept, 'text/html');
}

function varyOnAccept(response, contentType) {
  const copy = new Response(response.body, response);
  copy.headers.append('Vary', 'Accept');
  if (contentType) copy.headers.set('Content-Type', contentType);
  return copy;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const match = url.pathname.match(POST_PATH);
    if (!match || !['GET', 'HEAD'].includes(request.method)) return env.ASSETS.fetch(request);

    if (prefersMarkdown(request.headers.get('Accept'))) {
      url.pathname = `/posts/${match[1]}.md`;
      const markdown = await env.ASSETS.fetch(new Request(url, request));
      if (markdown.ok) return varyOnAccept(markdown, 'text/markdown; charset=utf-8');
      if (markdown.status === 304) return varyOnAccept(markdown);
    }

    return varyOnAccept(await env.ASSETS.fetch(request));
  },
};
