// Social preview images, drawn at build time with no network calls. Text becomes
// vector paths taken from the installed @fontsource files, so the result does
// not depend on the fonts of the machine that builds the site. Colours come from
// the light theme in Base.astro.
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import * as fontkit from 'fontkit';
import sharp from 'sharp';

const WIDTH = 1200;
const HEIGHT = 630;
const MARGIN = 80;
const TITLE_WIDTH = WIDTH - MARGIN * 2;
const TITLE_HEIGHT = 320;
const TITLE_SIZES = [80, 72, 64, 58, 52, 48];
const TITLE_LEADING = 1.12;
const TITLE_MAX_LINES = 4;

type Measure = (text: string) => number;

export function lightTokens(source: string): Record<string, string> {
  // The first :root block is the light theme; dark overrides it later.
  const root = source.match(/:root\s*\{([^}]*)\}/);
  if (!root) throw new Error('No :root block found in Base.astro');
  return Object.fromEntries([...root[1].matchAll(/--([\w-]+):\s*([^;]+);/g)].map(([, name, value]) => [name, value.trim()]));
}

export function wrap(text: string, maxWidth: number, measure: Measure): string[] {
  const lines: string[] = [];
  let line = '';
  for (let word of text.split(/\s+/).filter(Boolean)) {
    const joined = line ? `${line} ${word}` : word;
    if (measure(joined) <= maxWidth) {
      line = joined;
      continue;
    }
    if (line) lines.push(line);
    while (measure(word) > maxWidth && word.length > 1) {
      let end = word.length - 1;
      while (end > 1 && measure(word.slice(0, end)) > maxWidth) end--;
      lines.push(word.slice(0, end));
      word = word.slice(end);
    }
    line = word;
  }
  if (line) lines.push(line);
  return lines;
}

// Like CSS `text-wrap: balance`: the narrowest width that keeps the line count.
function balance(text: string, lines: string[], measure: Measure): string[] {
  let best = lines;
  for (let width = TITLE_WIDTH - 10; width > 0; width -= 10) {
    const next = wrap(text, width, measure);
    if (next.length > lines.length || next.join(' ') !== lines.join(' ')) break;
    best = next;
  }
  return best;
}

// The largest size at which the title fits its box. A title too long for the
// smallest size is cut off with an ellipsis.
export function fitTitle(title: string, measureAt: (text: string, size: number) => number) {
  for (const size of TITLE_SIZES) {
    const measure: Measure = (text) => measureAt(text, size);
    const lines = wrap(title, TITLE_WIDTH, measure);
    if (lines.length <= TITLE_MAX_LINES && lines.length * size * TITLE_LEADING <= TITLE_HEIGHT) {
      return { size, lines: balance(title, lines, measure) };
    }
  }
  const size = TITLE_SIZES[TITLE_SIZES.length - 1];
  const maxLines = Math.min(TITLE_MAX_LINES, Math.floor(TITLE_HEIGHT / (size * TITLE_LEADING)));
  const lines = wrap(title, TITLE_WIDTH, (text) => measureAt(text, size)).slice(0, maxLines);
  let last = lines[lines.length - 1];
  while (last && measureAt(`${last}…`, size) > TITLE_WIDTH) last = last.slice(0, -1);
  lines[lines.length - 1] = `${last.trimEnd()}…`;
  return { size, lines };
}

const require = createRequire(join(process.cwd(), 'package.json'));
const open = (file: string) => fontkit.create(readFileSync(require.resolve(file)));

// Each family is split into one file per script. A character is drawn with the
// first file that has it.
let loaded: { serif: any[]; sans: any[] } | undefined;
const fonts = () =>
  (loaded ??= {
    // Weight 600 at the largest optical size, as the site sets large titles.
    serif: ['latin', 'latin-ext', 'vietnamese'].map((subset) =>
      open(`@fontsource-variable/newsreader/files/newsreader-${subset}-opsz-normal.woff2`).getVariation({ wght: 600, opsz: 72 }),
    ),
    sans: ['latin', 'latin-ext'].map((subset) => open(`@fontsource/lato/files/lato-${subset}-700-normal.woff2`)),
  });

// Splits text into stretches that one font file can draw, so that each stretch
// keeps the font's own kerning.
function runs(text: string, family: any[]) {
  const result: { font: any; text: string }[] = [];
  for (const char of text.normalize('NFC')) {
    const code = char.codePointAt(0)!;
    const font = family.find((candidate) => candidate.hasGlyphForCodePoint(code));
    if (!font) {
      const hex = code.toString(16).toUpperCase().padStart(4, '0');
      throw new Error(`Social image: the fonts have no glyph for "${char}" (U+${hex}) in "${text}"`);
    }
    const last = result[result.length - 1];
    if (last?.font === font) last.text += char;
    else result.push({ font, text: char });
  }
  return result;
}

// Lays out one line at the origin. `tracking` is letter-spacing in em.
function setLine(text: string, family: any[], size: number, tracking = 0) {
  let x = 0;
  const paths: string[] = [];
  for (const run of runs(text, family)) {
    const scale = size / run.font.unitsPerEm;
    const { glyphs, positions } = run.font.layout(run.text);
    glyphs.forEach((glyph: any, i: number) => {
      const { xAdvance, xOffset, yOffset } = positions[i];
      const d = glyph.path.toSVG();
      // Font outlines have y pointing up; SVG has it pointing down.
      if (d) paths.push(`<path transform="translate(${x + xOffset * scale} ${-yOffset * scale}) scale(${scale} ${-scale})" d="${d}"/>`);
      x += xAdvance * scale + tracking * size;
    });
  }
  return { width: x - (text ? tracking * size : 0), paths: paths.join('') };
}

const place = (line: { paths: string }, y: number, colour: string) =>
  `<g fill="${colour}" transform="translate(${MARGIN} ${y})">${line.paths}</g>`;

export interface Card {
  title: string;
  author: string;
  kicker?: string;
}

export async function renderCard({ title, author, kicker }: Card): Promise<Buffer> {
  const colour = lightTokens(readFileSync(join(process.cwd(), 'src/layouts/Base.astro'), 'utf8'));
  const { serif, sans } = fonts();
  const tracking = -0.012;
  const fit = fitTitle(title, (text, size) => setLine(text, serif, size, tracking).width);
  const titleTop = kicker ? 150 : 100;

  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}">`,
    `<rect width="${WIDTH}" height="${HEIGHT}" fill="${colour.ground}"/>`,
    kicker ? place(setLine(kicker.toUpperCase(), sans, 26, 0.08), 112, colour.accent) : '',
    ...fit.lines.map((text, i) =>
      place(setLine(text, serif, fit.size, tracking), titleTop + fit.size * (0.85 + i * TITLE_LEADING), colour['ink-strong']),
    ),
    `<rect x="${MARGIN}" y="500" width="${TITLE_WIDTH}" height="2" fill="${colour.line}"/>`,
    place(setLine(author, serif, 38), 564, colour['ink-strong']),
    '</svg>',
  ].join('');

  return sharp(Buffer.from(svg)).png().toBuffer();
}
