import { test } from 'node:test';
import assert from 'node:assert/strict';
import worker, { prefersMarkdown } from './index.js';

const CHROME =
  'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8';

// A stand-in for the static assets binding: one post, as HTML and Markdown.
const assets = {
  '/posts/hello/': ['<h1>Hello</h1>', 'text/html; charset=utf-8'],
  '/posts/hello.md': ['# Hello', 'text/markdown; charset=utf-8'],
};
const env = {
  ASSETS: {
    async fetch(request) {
      const { pathname } = new URL(request.url);
      if (pathname === '/posts/hello') {
        return new Response(null, { status: 307, headers: { Location: '/posts/hello/' } });
      }
      const asset = assets[pathname];
      if (!asset) return new Response(null, { status: 404 });
      if (request.headers.get('If-None-Match') === '"v1"') {
        return new Response(null, { status: 304, headers: { ETag: '"v1"' } });
      }
      return new Response(request.method === 'HEAD' ? null : asset[0], {
        headers: { 'Content-Type': asset[1], ETag: '"v1"' },
      });
    },
  },
};

const get = (path, headers = {}, method = 'GET') =>
  worker.fetch(new Request(`https://blog.test${path}`, { headers, method }), env);

test('prefersMarkdown follows the Accept header', () => {
  assert.equal(prefersMarkdown('text/markdown'), true);
  assert.equal(prefersMarkdown('Text/Markdown; charset=utf-8'), true);
  assert.equal(prefersMarkdown('text/markdown, text/html, */*'), true);
  assert.equal(prefersMarkdown('text/markdown, text/html;q=0.9'), true);
  assert.equal(prefersMarkdown('text/html, text/markdown;q=0.5'), false);
  assert.equal(prefersMarkdown('text/markdown;q=0'), false);
  assert.equal(prefersMarkdown(CHROME), false);
  assert.equal(prefersMarkdown('*/*'), false);
  assert.equal(prefersMarkdown('text/*'), false);
  assert.equal(prefersMarkdown(null), false);
});

for (const path of ['/posts/hello', '/posts/hello/']) {
  test(`${path} with Accept: text/markdown returns the Markdown copy`, async () => {
    const res = await get(path, { Accept: 'text/markdown' });
    assert.equal(res.status, 200);
    assert.equal(res.headers.get('Content-Type'), 'text/markdown; charset=utf-8');
    assert.equal(res.headers.get('Vary'), 'Accept');
    assert.equal(await res.text(), '# Hello');
  });
}

test('a browser gets HTML, also marked Vary: Accept', async () => {
  const res = await get('/posts/hello/', { Accept: CHROME });
  assert.equal(res.headers.get('Content-Type'), 'text/html; charset=utf-8');
  assert.equal(res.headers.get('Vary'), 'Accept');
  assert.equal(await res.text(), '<h1>Hello</h1>');
});

test('a browser still gets the trailing-slash redirect', async () => {
  const res = await get('/posts/hello', { Accept: CHROME });
  assert.equal(res.status, 307);
  assert.equal(res.headers.get('Location'), '/posts/hello/');
  assert.equal(res.headers.get('Vary'), 'Accept');
});

test('HEAD negotiates like GET', async () => {
  const res = await get('/posts/hello/', { Accept: 'text/markdown' }, 'HEAD');
  assert.equal(res.headers.get('Content-Type'), 'text/markdown; charset=utf-8');
});

test('revalidation of the Markdown copy stays a 304', async () => {
  const res = await get('/posts/hello/', { Accept: 'text/markdown', 'If-None-Match': '"v1"' });
  assert.equal(res.status, 304);
  assert.equal(res.headers.get('Vary'), 'Accept');
});

test('a post that does not exist is still a 404', async () => {
  const res = await get('/posts/nope/', { Accept: 'text/markdown' });
  assert.equal(res.status, 404);
});

test('deeper paths and other methods are passed through', async () => {
  const deeper = await get('/posts/hello/extra', { Accept: 'text/markdown' });
  assert.equal(deeper.status, 404);
  const post = await get('/posts/hello/', { Accept: 'text/markdown' }, 'POST');
  assert.equal(post.headers.get('Content-Type'), 'text/html; charset=utf-8');
});
