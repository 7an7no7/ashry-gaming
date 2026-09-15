/**
 * The brand mark, and every icon made from it.
 *
 * One SVG is the source of truth: a rounded square with a bold ع (the first
 * letter of عشرى) and a small round token sitting in its bowl. The letter is
 * the outline of Cairo Black's ع (assets/ain-path.txt, the app's own typeface,
 * extracted once with fontTools; the font itself is not kept here), so the
 * mark needs no font at all - it renders the same in the loader before Cairo
 * has loaded, on a home screen, and in this script.
 *
 * The colours come from a variant (VARIANTS below); `iconVariant` in
 * site.config.json says which one the app ships with. To compare them all:
 *
 *   node make-icons.mjs --preview <dir>     writes icon-<variant>.png for each
 *                                           and icons-sheet.png side by side
 *   node make-icons.mjs                     builds the chosen one (npm run build:icons)
 *   node make-icons.mjs --variant=ocean     builds another without editing the config
 *
 * Written by a build:
 *   ../Logo.html           an <svg><symbol id="ashry-mark"> the page includes
 *                          once; anywhere in the app draws it with
 *                          <svg class="mark"><use href="#ashry-mark"/></svg>
 *   ../docs/icon-180.png   apple-touch-icon. iOS rounds the corners itself,
 *                          so this one is drawn full-bleed.
 *   ../docs/icon-192.png   the Android/Chrome install prompt (rounded).
 *   ../docs/icon-512.png   splash screens and the app listing (rounded).
 *   ../docs/icon-maskable-512.png  Android crops to a circle on some
 *                          launchers: the artwork stays inside the middle 80%
 *                          and the gradient runs to the edge.
 *   ../docs/favicon-64.png the tab icon.
 *
 * Icons are drawn here rather than downloaded so the app never depends on
 * someone else's CDN for its own face: iOS fetches the apple-touch-icon
 * exactly once, when you tap "Add to Home Screen".
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, '..');
const out = path.join(root, 'docs');

// Cairo Black's ع, in font units (1000/em, y up). Bounds x 40..520, y -327..503.
const AIN = (await readFile(path.join(here, 'assets', 'ain-path.txt'), 'utf8')).trim();
const AIN_CX = 280;   // centre of the glyph's bounding box
const AIN_CY = 88;

/**
 * The looks. `bg` is the three stops of the diagonal gradient, `glyph` the
 * letter (a colour, or two stops for a gradient), `token` the ball in its
 * bowl, `light` how strong the top-left sheen is, `shadow` the letter's
 * drop shadow and its opacity.
 */
const VARIANTS = {
  violet:   { bg: ['#8b5cf6', '#6d28d9', '#3b2fa8'], glyph: '#ffffff',              token: '#fbbf24', light: 0.34, shadow: ['#1e1145', 0.5] },
  midnight: { bg: ['#1f2a44', '#0f172a', '#0b1224'], glyph: ['#c4b5fd', '#f0abfc'], token: '#fbbf24', light: 0.10, shadow: ['#000000', 0.6] },
  paper:    { bg: ['#ffffff', '#f7f5ff', '#ebe7fb'], glyph: ['#7c3aed', '#4338ca'], token: '#f59e0b', light: 0.0,  shadow: ['#4c1d95', 0.22] },
  ocean:    { bg: ['#2dd4bf', '#0f9488', '#1e40af'], glyph: '#ffffff',              token: '#fbbf24', light: 0.30, shadow: ['#042f2e', 0.5] },
  sunset:   { bg: ['#fbbf24', '#f97316', '#e11d48'], glyph: '#ffffff',              token: '#4c1d95', light: 0.30, shadow: ['#7c2d12', 0.45] }
};

/**
 * The mark on a 512×512 canvas.
 *   variant  one of VARIANTS
 *   rounded  transparent corners (a rounded square) or full-bleed
 *   inset    scale the artwork towards the centre (the maskable icon)
 *   ids      suffix for gradient ids, so several marks can share one page
 */
function mark({ variant = 'violet', rounded = true, inset = 1, ids = '' } = {}) {
  const v = VARIANTS[variant];
  if (!v) throw new Error(`unknown icon variant "${variant}" (${Object.keys(VARIANTS).join(', ')})`);
  const rx = rounded ? 112 : 0;
  const glyphScale = 0.415 * inset;                  // ~345px tall at 512
  const token = { x: 256 + 72 * inset, y: 256 - 54 * inset, r: 27 * inset };
  const glyphFill = Array.isArray(v.glyph) ? `url(#ashry-t${ids})` : v.glyph;
  const glyphGrad = Array.isArray(v.glyph) ? `
    <linearGradient id="ashry-t${ids}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${v.glyph[0]}"/>
      <stop offset="1" stop-color="${v.glyph[1]}"/>
    </linearGradient>` : '';
  const paper = variant === 'paper';
  return `
  <defs>
    <linearGradient id="ashry-g${ids}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${v.bg[0]}"/>
      <stop offset="0.52" stop-color="${v.bg[1]}"/>
      <stop offset="1" stop-color="${v.bg[2]}"/>
    </linearGradient>
    <radialGradient id="ashry-hl${ids}" cx="0.2" cy="0.12" r="0.8">
      <stop offset="0" stop-color="#ffffff" stop-opacity="${v.light}"/>
      <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>${glyphGrad}
    <filter id="ashry-sh${ids}" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="${10 * inset}" stdDeviation="${11 * inset}" flood-color="${v.shadow[0]}" flood-opacity="${v.shadow[1]}"/>
    </filter>
  </defs>
  <rect width="512" height="512" rx="${rx}" fill="url(#ashry-g${ids})"/>
  <rect width="512" height="512" rx="${rx}" fill="url(#ashry-hl${ids})"/>
  ${paper ? `<rect x="6" y="6" width="500" height="500" rx="${Math.max(0, rx - 6)}" fill="none" stroke="#7c3aed" stroke-opacity="0.12" stroke-width="12"/>` : ''}
  <circle cx="${256 + 190 * inset}" cy="${256 + 200 * inset}" r="${170 * inset}" fill="${paper ? '#7c3aed' : '#ffffff'}" fill-opacity="${paper ? 0.04 : 0.06}"/>
  <circle cx="${256 - 200 * inset}" cy="${256 - 210 * inset}" r="${120 * inset}" fill="${paper ? '#7c3aed' : '#ffffff'}" fill-opacity="${paper ? 0.03 : 0.05}"/>
  <g filter="url(#ashry-sh${ids})">
    <path transform="translate(256 ${256 + 6 * inset}) scale(${glyphScale} ${-glyphScale}) translate(${-AIN_CX} ${-AIN_CY})"
          d="${AIN}" fill="${glyphFill}"/>
  </g>
  <circle cx="${token.x}" cy="${token.y}" r="${token.r}" fill="${v.token}"/>
  <circle cx="${token.x - token.r * 0.28}" cy="${token.y - token.r * 0.3}" r="${token.r * 0.34}" fill="#ffffff" fill-opacity="0.55"/>`;
}

const svg = (inner) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">${inner}\n</svg>`;
const png = (size, options) => sharp(Buffer.from(svg(mark(options)))).resize(size, size).png().toBuffer();

/* --- which variant --- */
const args = process.argv.slice(2);
const argVariant = (args.find(a => a.startsWith('--variant=')) || '').slice('--variant='.length);
const config = JSON.parse(await readFile(path.join(here, 'site.config.json'), 'utf8'));
const variant = argVariant || process.env.ICON_VARIANT || config.iconVariant || 'violet';

/* --- preview: every variant, side by side --- */
const previewAt = args.indexOf('--preview');
if (previewAt !== -1) {
  const dir = path.resolve(args[previewAt + 1] || path.join(here, '.icons-preview'));
  await mkdir(dir, { recursive: true });
  const names = Object.keys(VARIANTS);
  const TILE = 200, SMALL = 56, PAD = 28;
  const sheetW = PAD + names.length * (TILE + PAD);
  const sheetH = PAD + TILE + PAD / 2 + SMALL + PAD;
  const layers = [];
  for (let i = 0; i < names.length; i++) {
    const big = await png(TILE, { variant: names[i] });
    const small = await png(SMALL, { variant: names[i] });
    await writeFile(path.join(dir, `icon-${names[i]}.png`), await png(512, { variant: names[i] }));
    const left = PAD + i * (TILE + PAD);
    layers.push({ input: big, left, top: PAD });
    layers.push({ input: small, left: left + Math.round((TILE - SMALL) / 2), top: PAD + TILE + PAD / 2 });
  }
  const sheet = await sharp({ create: { width: sheetW, height: sheetH, channels: 4, background: '#f3f4f8' } })
    .composite(layers).png().toBuffer();
  await writeFile(path.join(dir, 'icons-sheet.png'), sheet);
  console.log(`preview: ${names.join(', ')} -> ${dir}`);
  process.exit(0);
}

/* --- the build --- */
await mkdir(out, { recursive: true });

/* The in-page symbol. Every mark in the app is a <use> of this, so the loader,
   the header and the home hero all draw exactly the icon on the home screen. */
const symbol = `<!-- The brand mark (generated by tools/make-icons.mjs, variant "${variant}"; do not edit). -->
<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false">
  <symbol id="ashry-mark" viewBox="0 0 512 512">${mark({ variant, ids: '-m' })}
  </symbol>
</svg>
`;
await writeFile(path.join(root, 'Logo.html'), symbol, 'utf8');

const render = async (name, size, options) => {
  const buf = await png(size, { variant, ...options });
  await writeFile(path.join(out, name), buf);
  console.log(`docs/${name} (${size}px, ${(buf.length / 1024).toFixed(0)} KB)`);
};

await render('icon-180.png', 180, { rounded: false });
await render('icon-192.png', 192, { rounded: true });
await render('icon-512.png', 512, { rounded: true });
await render('icon-maskable-512.png', 512, { rounded: false, inset: 0.8 });
await render('favicon-64.png', 64, { rounded: true });
console.log(`Logo.html written (variant "${variant}")`);
