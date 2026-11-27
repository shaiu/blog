import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import sharp from 'sharp';
import { lightTokens, wrap, fitTitle, renderCard } from '../src/lib/og-card.ts';

const layout = readFileSync('src/layouts/Base.astro', 'utf8');
const measureChars = (text) => text.length;

test('lightTokens reads the light theme, not the dark one', () => {
  const css = ':root { --ground: #fff; --accent: #a00; }\n@media (prefers-color-scheme: dark) { :root { --ground: #000; } }';
  assert.deepEqual(lightTokens(css), { ground: '#fff', accent: '#a00' });
});

test('lightTokens finds the card colours in Base.astro', () => {
  const tokens = lightTokens(layout);
  for (const name of ['ground', 'ink-strong', 'accent', 'line']) assert.match(tokens[name], /^#[0-9a-f]{6}$/i);
});

test('lightTokens fails loudly without a :root block', () => {
  assert.throws(() => lightTokens('body {}'), /:root/);
});

test('wrap breaks between words', () => {
  assert.deepEqual(wrap('one two three four', 9, measureChars), ['one two', 'three', 'four']);
});

test('wrap splits a word that cannot fit on a line', () => {
  assert.deepEqual(wrap('abcdefghij', 4, measureChars), ['abcd', 'efgh', 'ij']);
});

const measureAt = (text, size) => text.length * size * 0.5;

test('fitTitle keeps a short title large', () => {
  const fit = fitTitle('A short title', measureAt);
  assert.equal(fit.size, 80);
  assert.deepEqual(fit.lines, ['A short title']);
});

test('fitTitle shrinks a long title until it fits the box', () => {
  const fit = fitTitle('word '.repeat(30).trim(), measureAt);
  assert.ok(fit.size < 80);
  assert.ok(fit.lines.length <= 4);
  assert.ok(fit.lines.length * fit.size * 1.12 <= 320);
  assert.ok(fit.lines.every((line) => measureAt(line, fit.size) <= 1040));
});

test('fitTitle ends an endless title with an ellipsis', () => {
  const fit = fitTitle('word '.repeat(200).trim(), measureAt);
  assert.ok(fit.lines.length <= 4);
  assert.ok(fit.lines.at(-1).endsWith('…'));
});

test('renderCard draws a 1200x630 PNG on the light ground colour', async () => {
  const png = await renderCard({ kicker: 'Field note', title: 'Zażółć: a title with Latin Extended letters', author: 'Shai Ungar' });
  const { width, height, format } = await sharp(png).metadata();
  assert.deepEqual([width, height, format], [1200, 630, 'png']);
  const corner = await sharp(png).extract({ left: 0, top: 0, width: 1, height: 1 }).removeAlpha().raw().toBuffer();
  assert.equal(`#${corner.toString('hex')}`, lightTokens(layout).ground.toLowerCase());
});

test('renderCard gives the same bytes for the same input', async () => {
  const card = { title: 'Same every time', author: 'Shai Ungar' };
  assert.deepEqual(await renderCard(card), await renderCard(card));
});

test('renderCard names a character the fonts cannot draw', async () => {
  await assert.rejects(renderCard({ title: 'Shalom שלום', author: 'Shai Ungar' }), /U\+05E9/);
});
