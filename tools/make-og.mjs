/**
 * The pictures a room link shows when it is pasted into WhatsApp, Telegram,
 * Facebook or X (the link preview), and the names the preview's title uses.
 *
 *   docs/og/app.jpg        the brand mark on its violet (a room with no game yet)
 *   docs/og/<game>.jpg     one per room game: its colour and its drawn icon, the mark small
 *   docs/og/games.json     { app: { ar, en }, games: { <id>: { ar, en, img } } }
 *
 * The site worker (site-worker/src/index.js) reads games.json for /r/CODE?g=<game>.
 * No text is drawn in the pictures: the title says it, in the reader's language,
 * and Arabic in a picture would need the wordmark's outlines for every name.
 * JPEG, not PNG: a gradient is 150-250 KB as a PNG and 20-40 KB as a JPEG, and
 * WhatsApp skips a preview picture over about 300 KB.
 *
 * Everything comes from the page's own source, so a new room game gets its picture
 * by being a room game in GAME_LIST with a drawn icon (and a removed one loses it):
 *   GAME_LIST (Games.js)           the room games: id, icon, name's i18n key, accent
 *   ICON_ART (JS_Core.html)        the drawn icons (64x64 SVG bodies)
 *   TRANSLATIONS (JS_Core.html)    the games' names
 *   Style.html                     each accent's colours
 *   Logo.html                      the brand mark
 *
 * Run by build-site.mjs (makeOg), or alone: node make-og.mjs [out-dir]
 * Not in sw.js's list: a phone never downloads these.
 */
import { readFile, writeFile, mkdir, readdir, unlink } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, '..');
const W = 1200, H = 630;

/** The text of a literal from `start` to its closing bracket at the start of a line (`  };` / `];`). */
function literalAfter(src, start, close) {
  const at = src.indexOf(start);
  if (at === -1) throw new Error(`make-og: "${start}" not found`);
  const from = src.indexOf(start.slice(-1), at + start.length - 1);
  const end = src.indexOf('\n' + close, from);
  if (end === -1) throw new Error(`make-og: end of "${start}" not found`);
  return src.slice(from, end + close.length + 1).replace(/;\s*$/, '');
}
const evalLiteral = (text) => new Function(`return (${text});`)();

async function sources() {
  const core = await readFile(path.join(root, 'JS_Core.html'), 'utf8');
  const gamesJs = await readFile(path.join(root, 'Games.js'), 'utf8');
  const style = await readFile(path.join(root, 'Style.html'), 'utf8');
  const logo = await readFile(path.join(root, 'Logo.html'), 'utf8');
  const T = evalLiteral(literalAfter(core, 'const TRANSLATIONS = {', '  };'));
  const ART = evalLiteral(literalAfter(core, 'const ICON_ART = {', '  };'));
  // A room's list, as ROOM_HUB_GAMES (JS_Room.html) builds it.
  const HUB = new Function(gamesJs + '\nreturn ROOM_GAME_LIST;')()
    .map((r) => ({ id: r.id, icon: r.game.icon, key: r.game.title, accent: r.game.accent }));
  const accents = {};
  for (const m of style.matchAll(/^\[data-accent="(\w+)"\]\s*\{\s*--accent:(#[0-9a-f]{6});\s*--accent-hover:(#[0-9a-f]{6})/gim)) {
    accents[m[1]] = [m[2], m[3]];
  }
  const sym = /<symbol id="ashry-mark" viewBox="0 0 512 512">([\s\S]*?)<\/symbol>/.exec(logo);
  if (!sym) throw new Error('make-og: the mark was not found in Logo.html');
  return { T, ART, HUB, accents, mark: sym[1] };
}

/** Darker by `k` (0..1), for the gradient's far corner. */
function shade(hex, k) {
  const n = parseInt(hex.slice(1), 16);
  const c = [n >> 16, (n >> 8) & 255, n & 255].map((v) => Math.round(v * (1 - k)));
  return '#' + c.map((v) => v.toString(16).padStart(2, '0')).join('');
}

// The mark's ids are made unique per use (it holds gradients and a filter).
const markAt = (mark, x, y, size, tag) =>
  `<svg x="${x}" y="${y}" width="${size}" height="${size}" viewBox="0 0 512 512">` +
  `<clipPath id="mclip-${tag}"><rect width="512" height="512" rx="112"/></clipPath>` +
  `<g clip-path="url(#mclip-${tag})">${mark.replace(/ashry-(\w+)-m\b/g, `ashry-$1-${tag}`)}</g></svg>`;

function appSvg(mark) {
  const size = 440;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#5b21b6"/><stop offset="0.55" stop-color="#3b1680"/><stop offset="1" stop-color="#1e0b4a"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.5" cy="0.45" r="0.55">
      <stop offset="0" stop-color="#a78bfa" stop-opacity="0.45"/><stop offset="1" stop-color="#a78bfa" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect width="${W}" height="${H}" fill="url(#glow)"/>
  <circle cx="1080" cy="560" r="230" fill="#fbbf24" fill-opacity="0.10"/>
  <circle cx="110" cy="70" r="160" fill="#ffffff" fill-opacity="0.06"/>
  ${markAt(mark, (W - size) / 2, (H - size) / 2, size, 'a')}
</svg>`;
}

function gameSvg(art, colours, mark) {
  const [a, b] = colours;
  const icon = 400;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${a}"/><stop offset="0.6" stop-color="${b}"/><stop offset="1" stop-color="${shade(b, 0.35)}"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.5" cy="0.48" r="0.5">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.34"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
    <filter id="sh" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="14" stdDeviation="16" flood-color="#000" flood-opacity="0.35"/>
    </filter>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect width="${W}" height="${H}" fill="url(#glow)"/>
  <circle cx="1090" cy="590" r="240" fill="#ffffff" fill-opacity="0.07"/>
  <circle cx="90" cy="40" r="170" fill="#ffffff" fill-opacity="0.06"/>
  <g filter="url(#sh)"><svg x="${(W - icon) / 2}" y="${(H - icon) / 2}" width="${icon}" height="${icon}" viewBox="0 0 64 64">${art}</svg></g>
  ${markAt(mark, 44, H - 44 - 120, 120, 'g')}
</svg>`;
}

const jpeg = (svg) => sharp(Buffer.from(svg)).jpeg({ quality: 80, mozjpeg: true }).toBuffer();

/** Writes out/og/*. Returns { files, bytes, skipped }. */
export async function makeOg(out) {
  const { T, ART, HUB, accents, mark } = await sources();
  const dir = path.join(out, 'og');
  await mkdir(dir, { recursive: true });
  let bytes = 0, files = 0;
  const skipped = [];
  const put = async (name, buf) => { await writeFile(path.join(dir, name), buf); bytes += buf.length; files++; };

  await put('app.jpg', await jpeg(appSvg(mark)));
  const games = {};
  for (const g of HUB) {
    const name = { ar: T.ar[g.key] || '', en: T.en[g.key] || '' };
    const art = typeof g.icon === 'string' && g.icon.startsWith('art:') ? ART[g.icon.slice(4)] : null;
    const colours = accents[g.accent] || accents.violet;
    let img = 'app.jpg';
    if (art && colours) {
      img = `${g.id}.jpg`;
      await put(img, await jpeg(gameSvg(art, colours, mark)));
    } else {
      skipped.push(g.id);   // an emoji icon (none today): the app's picture, the game's name in the title
    }
    games[g.id] = { ...name, img };
  }
  // A picture of a game that is gone (no longer a room game) goes too.
  const made = new Set(['app.jpg', ...Object.values(games).map((g) => g.img)]);
  for (const f of await readdir(dir)) if (/\.jpg$/.test(f) && !made.has(f)) await unlink(path.join(dir, f));
  const index = { app: { ar: T.ar.title, en: T.en.title }, games };
  const json = JSON.stringify(index);
  await writeFile(path.join(dir, 'games.json'), json, 'utf8');
  bytes += json.length; files++;
  return { files, bytes, skipped };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const out = path.resolve(process.argv[2] || path.join(root, 'docs'));
  const r = await makeOg(out);
  console.log(`og: ${r.files} files, ${(r.bytes / 1024).toFixed(0)} KB in ${path.join(out, 'og')}` + (r.skipped.length ? ` (no drawn icon: ${r.skipped.join(', ')})` : ''));
}
