/**
 * Builds a local test copy of the app in .preview/: include() calls inlined,
 * template values filled in, and rooms pointed at a rooms server - by default
 * wrangler dev (npm run dev in rooms-worker/). Serve it over http, not
 * file://: the app writes to localStorage, which file:// pages can't.
 *
 *   npm run build:preview
 *   npx http-server ../.preview -p 4321     # or any static server
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const read = (name) => readFile(path.join(root, `${name}.html`), 'utf8');

// Rooms need the rooms server. Locally that is `npm run dev` in rooms-worker/
// (wrangler dev, port 8787); ROOMS_URL=... points the preview elsewhere, such
// as the live server. Two browser tabs then behave like two phones in one room.
const ROOMS_URL = process.env.ROOMS_URL || 'http://127.0.0.1:8787';

// The real spy words, the same ones the published site carries.
const SPY_WORDS = new Function(
  (await readFile(path.join(root, 'SpyWords.js'), 'utf8')) + '\nreturn SPY_WORDS;'
)();
// المختلف's close pairs: the one-phone game deals them too (JS_Imposter.html).
const SPY_PAIRS = new Function(
  (await readFile(path.join(root, 'SpyWords.js'), 'utf8')) + '\nreturn SPY_PAIRS;'
)();
// The English game's words and pairs, dealt when the games' language is English.
const [SPY_WORDS_EN, SPY_PAIRS_EN] = new Function(
  (await readFile(path.join(root, 'SpyWords.js'), 'utf8')) + '\nreturn [SPY_WORDS_EN, SPY_PAIRS_EN];'
)();

const STUB = `<script>window.ROOMS_URL = ${JSON.stringify(ROOMS_URL)};</script>`;

let html = await read('Controller');

// Resolve <?!= include('X'); ?> the way HtmlService would.
const includes = [...html.matchAll(/<\?!=\s*include\('([^']+)'\);?\s*\?>/g)];
for (const [tag, name] of includes) {
  // A replacer function: $&, $' and $` in a replacement string are patterns.
  const body = await read(name);
  html = html.replace(tag, () => body);
}

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
  .replace('</head>', () => `${STUB}\n</head>`);

// Word lists the page shares with the rooms server: one file, both sides.
const SHARED_LISTS = ['ChameleonWords.js', 'SpyfallPlaces.js', 'BombPrompts.js', 'EmojiRiddles.js', 'Proverbs.js', 'MonkeyWords.js', 'StopWords.js', 'TriviaQuestions.js', 'SkrewCards.js', 'UnoCards.js', 'DominoTiles.js', 'Connect4.js', 'DotsBoxes.js', 'Battleship.js', 'Chess.js', 'Chess4.js', 'Ludo.js', 'BankAlhaz.js', 'GuessWho.js', 'Hangman.js', 'MiniGolf.js', 'PlayingCards.js', 'Estimation.js', 'Bowling.js', 'TicTacToe.js', 'WordleWords.js', 'Countries.js', 'SolveGames.js', 'ChessPuzzles.js'];
const sharedListsHtml = (await Promise.all(SHARED_LISTS.map(async (name) =>
  `<script>\n${await readFile(path.join(root, name), 'utf8')}\n</script>`))).join('\n    ');
const listsMark = /<!-- tools\/build-site\.mjs and build-preview\.mjs inline the word lists[^\n]*-->/;
if (!listsMark.test(html)) throw new Error('Controller.html: SHARED_LISTS comment not found');
html = html.replace(listsMark, () => sharedListsHtml);

const leftover = html.match(/<\?!?=?[\s\S]{0,40}\?>/);
if (leftover) throw new Error(`unresolved template tag: ${leftover[0]}`);

// PREVIEW_OUT: somewhere else than .preview/ (the screen test builds its own copy).
const outDir = process.env.PREVIEW_OUT ? path.resolve(process.env.PREVIEW_OUT) : path.join(root, '.preview');
await mkdir(outDir, { recursive: true });
await writeFile(path.join(outDir, 'index.html'), html, 'utf8');

console.log(`.preview/index.html written (${(html.length / 1024).toFixed(0)} KB), rooms via ${ROOMS_URL}`);
