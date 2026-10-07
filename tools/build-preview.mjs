/**
 * Builds a local test copy of the app in .preview/: include() calls inlined,
 * template values filled in, and rooms pointed at a rooms server - by default
 * wrangler dev (npm run dev in rooms-worker/). Serve it over http, not
 * file://: the app writes to localStorage, which file:// pages can't.
 *
 *   npm run build:preview
 *   npx http-server ../.preview -p 4321     # or any static server
 */
import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { assemble } from './lazy-split.mjs';
import srcMod from './sources.cjs';
const { srcPath } = srcMod;
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));

// Rooms need the rooms server. Locally that is `npm run dev` in rooms-worker/
// (wrangler dev, port 8787); ROOMS_URL=... points the preview elsewhere, such
// as the live server. Two browser tabs then behave like two phones in one room.
const ROOMS_URL = process.env.ROOMS_URL || 'http://127.0.0.1:8787';

// The real spy words, the same ones the published site carries.
const SPY_WORDS = new Function(
  (await readFile(srcPath('SpyWords.js'), 'utf8')) + '\nreturn SPY_WORDS;'
)();
// المختلف's close pairs: the one-phone game deals them too (JS_Imposter.html).
const SPY_PAIRS = new Function(
  (await readFile(srcPath('SpyWords.js'), 'utf8')) + '\nreturn SPY_PAIRS;'
)();
// The English game's words and pairs, dealt when the games' language is English.
const [SPY_WORDS_EN, SPY_PAIRS_EN] = new Function(
  (await readFile(srcPath('SpyWords.js'), 'utf8')) + '\nreturn [SPY_WORDS_EN, SPY_PAIRS_EN];'
)();

const STUB = `<script>window.ROOMS_URL = ${JSON.stringify(ROOMS_URL)};</script>`;

// The page: the shell inlined, each game's code a file of its own in g/, unminified
// with a banner per source file so it reads like the sources (tools/lazy-split.mjs).
// LAZY=0 builds the whole page in one file, as before.
const whole = process.env.LAZY === '0';
// A chunk's name carries its hash, so a static server's cache never hands back an old one.
const hashOf = (code) => createHash('sha1').update(code).digest('hex').slice(0, 10);
// CSS_SPLIT=0 keeps every rule of the stylesheet in the page (tools/css-split.mjs).
const built = await assemble({ root, readFile, path, whole, banner: true, splitCss: process.env.CSS_SPLIT !== '0', name: (c, code) => `${c.id}.${hashOf(code)}.js` });
let html = built.html;

// `--room CODE` opens the preview on the join screen with that code filled in,
// the way a scanned join link opens the published site.
const previewRoom = process.argv.includes('--room')
  ? process.argv[process.argv.indexOf('--room') + 1] || ''
  : '';

html = html
  .replace('<?!= initialSpyData ?>', () => JSON.stringify(SPY_WORDS))
  .replace('<?!= initialSpyPairs ?>', () => JSON.stringify(SPY_PAIRS))
  .replace('<?!= initialSpyDataEn ?>', () => JSON.stringify(SPY_WORDS_EN))
  .replace('<?!= initialSpyPairsEn ?>', () => JSON.stringify(SPY_PAIRS_EN))
  .replace('<?!= initialRoom ?>', () => JSON.stringify(previewRoom))
  // Wherever the preview is served (port 4321 by the launch config): room links,
  // the QR and the share button pointed at a port nothing served.
  .replace('<?!= webAppUrl ?>', 'location.origin + location.pathname')
  .replace('<?!= roomLinks ?>', 'false')
  .replace('</head>', () => `${STUB}\n</head>`);

const leftover = html.match(/<\?!?=?[\s\S]{0,40}\?>/);
if (leftover) throw new Error(`unresolved template tag: ${leftover[0]}`);

// PREVIEW_OUT: somewhere else than .preview/ (the screen test builds its own copy).
const outDir = process.env.PREVIEW_OUT ? path.resolve(process.env.PREVIEW_OUT) : path.join(root, '.preview');
await mkdir(outDir, { recursive: true });
await writeFile(path.join(outDir, 'index.html'), html, 'utf8');
// The chunks (the old ones go: the preview keeps no earlier build).
await rm(path.join(outDir, 'g'), { recursive: true, force: true });
if (built.chunks.length) {
  await mkdir(path.join(outDir, 'g'), { recursive: true });
  for (const c of built.chunks) await writeFile(path.join(outDir, 'g', c.file), c.code, 'utf8');
  console.log(`g/: ${built.chunks.length} chunks`);
}
// Stockfish, the chess coach's engine (vendor/stockfish/README.md), beside the chunks.
await mkdir(path.join(outDir, 'g'), { recursive: true });
for (const f of ['sf19-lite.js', 'sf19-lite.wasm']) await writeFile(path.join(outDir, 'g', f), await readFile(path.join(root, 'vendor', 'stockfish', f)));

console.log(`.preview/index.html written (${(html.length / 1024).toFixed(0)} KB), rooms via ${ROOMS_URL}`);
