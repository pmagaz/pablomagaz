/**
 * Generates the static brand assets in public/ that are not part of the
 * design handoff: favicon, apple touch icon and the default social card.
 *
 * Run with `npm run brand:assets` after changing the portrait or tokens.
 * Output is committed, so this is not part of the Netlify build.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const out = resolve(root, 'public');

/**
 * Colours are read out of the design tokens rather than repeated here, so
 * src/styles/tokens.css is the single place any colour is declared.
 */
const tokens = await readFile(resolve(root, 'src/styles/tokens.css'), 'utf8');

/** Accepts either `#rrggbb` or a `250 250 250` channel triple. */
function token(name) {
  const hex = tokens.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{3,8})`));
  if (hex) return hex[1];

  const channels = tokens.match(new RegExp(`--${name}-rgb:\\s*([\\d\\s]+)`));
  if (channels) {
    const [r, g, b] = channels[1].trim().split(/\s+/).map(Number);
    return `#${[r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('')}`;
  }

  throw new Error(`token --${name} not found in tokens.css`);
}

const INK = token('pm-ink');
const RED = token('pm-red');
const ON_INK = token('pm-on-ink');

/** Ink tile with the brand dot — the mark used across favicons. */
const mark = (size, radius, dot) => `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${radius}" fill="${INK}"/>
  <circle cx="${size / 2}" cy="${size / 2}" r="${dot}" fill="${RED}"/>
</svg>`;

async function main() {
  await mkdir(out, { recursive: true });

  // Favicon — SVG, so it stays crisp at any size and needs no raster fallback.
  await writeFile(resolve(out, 'favicon.svg'), `${mark(32, 6, 7).trim()}\n`, 'utf8');

  await sharp(Buffer.from(mark(180, 38, 38)))
    .png()
    .toFile(resolve(out, 'apple-touch-icon.png'));

  // Social card — 1200x630 ink canvas, portrait bleeding off the right edge,
  // brand dot and wordmark on the left. The SVG rasterizer only has system
  // fonts available, so the card uses a generic sans rather than Outfit.
  const card = `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <style>
      .name { font-family: sans-serif; font-size: 74px; font-weight: 600; letter-spacing: -3px; fill: ${ON_INK}; }
      .role { font-family: sans-serif; font-size: 25px; font-weight: 600; letter-spacing: 5px; fill: #9a9aa2; }
    </style>
  </defs>
  <rect width="1200" height="630" fill="${INK}"/>
  <circle cx="82" cy="188" r="11" fill="${RED}"/>
  <text class="name" x="78" y="330">Pablo Magaz</text>
  <text class="role" x="82" y="400">CHIEF TECHNICAL OFFICER</text>
</svg>`;

  const portrait = await sharp(resolve(root, 'src/assets/images/pablo-hero.png'))
    .resize({ height: 610, fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();

  await sharp(Buffer.from(card))
    .composite([{ input: portrait, gravity: 'southeast' }])
    .png({ compressionLevel: 9 })
    .toFile(resolve(out, 'og-default.png'));

  console.log('Wrote favicon.svg, apple-touch-icon.png and og-default.png to public/');
}

await main();
