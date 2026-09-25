/**
 * Builds the app as a static site in docs/, ready for GitHub Pages or any
 * static host.
 *
 * Same assembly as the preview - include() calls inlined, template values
 * filled in - plus what a top-level page needs: its own manifest, icons and
 * service worker. Rooms talk to the rooms server on Cloudflare (rooms-worker/),
 * whose address comes from site.config.json.
 *
 *   npm run build:site
 *   ROOMS_URL=http://127.0.0.1:8787 npm run build:site    # against wrangler dev
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = fileURLToPath(new URL('./', import.meta.url));
const root = path.join(here, '..');
// SITE_OUT: somewhere else than docs/ (the screen test builds a copy of the site to try its
// offline copy and updates on, without touching what is published).
const out = process.env.SITE_OUT ? path.resolve(process.env.SITE_OUT) : path.join(root, 'docs');
const read = (name) => readFile(path.join(root, `${name}.html`), 'utf8');

const config = JSON.parse(await readFile(path.join(here, 'site.config.json'), 'utf8'));
const roomsUrl = String(process.env.ROOMS_URL || config.roomsUrl || '').replace(/\/+$/, '');
// The icon's version goes on its addresses: a changed address is what makes
// Android refresh an installed icon, and the page compares it with the one an
// iPhone copy was added with (checkIconBanner in JS_Utils.html).
const iconVersion = Number(config.iconVersion || 1);
const V = `?v=${iconVersion}`;
if (!/^https?:\/\/[^\s"'<>]+$/.test(roomsUrl)) {
  throw new Error('site.config.json: roomsUrl must be the rooms server address');
}

// The spy words are code (SpyWords.js), shared with the room server.
const spySource = await readFile(path.join(root, 'SpyWords.js'), 'utf8');
const SPY_WORDS = new Function(spySource + '\nreturn SPY_WORDS;')();

// JSON inside a <script>: "</script>" in a word would end the tag early.
const scriptJson = (value) => JSON.stringify(value).replace(/</g, '\\u003c');

let html = await read('Controller');
// A replacer function, not a string: in a replacement string $&, $' and $` are
// patterns, and any of them in an included file would be silently rewritten.
for (const [tag, name] of [...html.matchAll(/<\?!=\s*include\('([^']+)'\);?\s*\?>/g)]) {
  const body = await read(name);
  html = html.replace(tag, () => body);
}

const HEAD = `<title>عشرى جيمينج</title>
    <link rel="manifest" href="manifest.webmanifest">
    <link rel="apple-touch-icon" href="icon-180.png${V}">
    <link rel="apple-touch-icon" sizes="180x180" href="icon-180.png${V}">
    <link rel="icon" type="image/png" sizes="192x192" href="icon-192.png${V}">
    <link rel="icon" type="image/png" sizes="64x64" href="favicon-64.png${V}">
    <meta name="application-name" content="عشرى جيمينج">
    <!-- Opens the connection to the rooms server early, so creating or joining a room doesn't wait for it. -->
    <link rel="preconnect" href="${roomsUrl}" crossorigin>`;

// Controller.html marks where the title, icons and manifest links go.
const iconNote = /<!-- tools\/build-site\.mjs writes the title, home-screen icons and manifest links in here\. -->/;
if (!iconNote.test(html)) throw new Error('Controller.html: icon comment not found');
html = html.replace(iconNote, () => HEAD);

// The join code and the page's own address are read when the page loads.
html = html
  .replace('<?!= initialSpyData ?>', () => scriptJson(SPY_WORDS))
  .replace('<?!= initialRoom ?>',
    "(function () { var m = /[?&]room=([A-Za-z0-9]{1,8})/.exec(location.search); return m ? m[1].toUpperCase() : ''; })()")
  // Every link the app shares (the app, a room's link and QR) goes to the main address, from
  // either copy, so whoever it reaches lands on the fast one (appUrl in site.config.json).
  .replace('<?!= webAppUrl ?>', () => (config.appUrl ? JSON.stringify(config.appUrl) : 'location.origin + location.pathname'));

// One id for this build: the offline cache's name and the page's own, so an open
// page can tell whether the worker that just took over is a newer build.
const buildId = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);

const RUNTIME = `<script>
      /* The published site. The local preview leaves this out, so it never registers the offline cache. */
      window.STATIC_SITE = true;
      // The rooms server (rooms-worker/), from tools/site.config.json.
      window.ROOMS_URL = ${JSON.stringify(roomsUrl)};
      // Which icon this build ships (tools/site.config.json, iconVersion).
      window.ICON_VERSION = ${iconVersion};
      // This build's id, the same as the offline cache's name in sw.js.
      window.BUILD_ID = ${JSON.stringify(buildId)};
      // ?install=1 is the "open in Safari" link from the icon banner: the
      // page opens straight onto the add-to-home-screen steps.
      window.OPEN_INSTALL = /[?&]install=1/.test(location.search);

      // A join link has done its job once read; leaving ?room= in the address
      // would send a reload straight back to the join screen. The same for ?install=.
      if (/[?&](room|install)=/.test(location.search)) history.replaceState(null, '', location.pathname + location.hash);
    </script>
</head>`;
if (html.indexOf('</head>') === -1) throw new Error('Controller.html: no </head>');
html = html.replace('</head>', () => RUNTIME);

// Word lists the page shares with the rooms server: one file, both sides.
const SHARED_LISTS = ['ChameleonWords.js', 'SpyfallPlaces.js', 'BombPrompts.js', 'EmojiRiddles.js', 'Proverbs.js', 'MonkeyWords.js', 'StopWords.js', 'TriviaQuestions.js', 'SkrewCards.js', 'UnoCards.js', 'DominoTiles.js', 'Connect4.js', 'DotsBoxes.js', 'Battleship.js', 'Chess.js', 'Chess4.js', 'Ludo.js', 'BankAlhaz.js', 'GuessWho.js', 'Hangman.js', 'MiniGolf.js', 'PlayingCards.js', 'Estimation.js', 'Bowling.js', 'TicTacToe.js', 'WordleWords.js', 'Countries.js', 'SolveGames.js', 'ChessPuzzles.js'];
const sharedListsHtml = (await Promise.all(SHARED_LISTS.map(async (name) =>
  `<script>\n${await readFile(path.join(root, name), 'utf8')}\n</script>`))).join('\n    ');
const listsMark = /<!-- tools\/build-site\.mjs and build-preview\.mjs inline the word lists[^\n]*-->/;
if (!listsMark.test(html)) throw new Error('Controller.html: SHARED_LISTS comment not found');
html = html.replace(listsMark, () => sharedListsHtml);

const leftover = html.match(/<\?!?=?[\s\S]{0,40}\?>/);
if (leftover) throw new Error(`unresolved template tag: ${leftover[0]}`);

await mkdir(out, { recursive: true });
await writeFile(path.join(out, 'index.html'), html, 'utf8');

/* Offline copy, and the app's own copy on the phone. Opening the app answers
   from the copy this build's worker saved when it was installed - at once, however
   slow the network is (23 Sep 2026: GitHub Pages sent the 1.6 MB page at 20-60
   KB/s, and the app sat on its logo for most of a minute). A new build is a new
   sw.js; the browser finds it when the app is opened (and the page asks again
   when it comes back to the screen), installs it in the background - the page
   downloaded once, past the browser's own HTTP cache, and kept under both of its
   addresses - and the open page switches to it (registerServiceWorker in
   JS_Core.html). A phone with no saved copy yet goes to the network, and to the
   saved copy only if that fails. The pinned CDN files (fonts, confetti, QR) are cache-first,
   since their URLs never change; only good answers are kept (a failed one used
   to stay cached for the whole build), and the page asks for them again once
   the worker is in charge, so a first visit is enough to play offline. Room traffic is never cached: it is POSTs
   and WebSockets, which this never touches. */
const SW = `const CACHE = 'ashry-${buildId}';
const SHELL = ['./manifest.webmanifest', './icon-180.png', './icon-192.png', './icon-512.png', './favicon-64.png'];
const PINNED = ['cdn.jsdelivr.net', 'fonts.googleapis.com', 'fonts.gstatic.com'];

// The page is fetched once (not once for './' and again for './index.html'), and past the
// browser's HTTP cache, which could still hold the build before this one for ten minutes.
// From './', the address itself: Cloudflare answers './index.html' with a redirect to './',
// and a page opened from an answer that came through a redirect is refused (ERR_FAILED).
const fresh = (u) => new Request(u, { cache: 'reload' });
// An answer that came through a redirect, made plain again, so a page can be opened from it.
const clean = (res) => (res && res.redirected
  ? res.blob().then((b) => new Response(b, { status: res.status, statusText: res.statusText, headers: res.headers }))
  : Promise.resolve(res));
self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) =>
    fetch(fresh('./')).then(clean).then((res) => {
      if (!res.ok) throw new Error('index ' + res.status);
      return Promise.all([c.put('./index.html', res.clone()), c.put('./', res)]);
    }).then(() => c.addAll(SHELL.map(fresh)))
  ).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

// A good answer is kept. So is an opaque one from the pinned hosts: the fonts'
// stylesheet is asked for without CORS, so its status can't be read - and
// refusing it left the app with no fonts offline.
const keep = (req, res, pinned) => {
  if (res && (res.ok || (pinned && res.type === 'opaque'))) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
  return res;
};

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  if (PINNED.indexOf(url.hostname) !== -1) {
    event.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((res) => keep(req, res, true))));
    return;
  }
  if (url.origin !== self.location.origin) return;

  const cached = () => caches.match(req).then((hit) => hit || caches.match('./index.html'));
  if (req.mode !== 'navigate') { event.respondWith(fetch(req).then((res) => keep(req, res)).catch(cached)); return; }
  // Opening the app (a room link's ?room= too): this build's saved page at once; the
  // network only when there is none yet. A newer build arrives as a newer worker.
  event.respondWith(caches.match('./index.html').then((hit) => (hit ? clean(hit) :
    fetch(req).then((res) => keep(req, res)).catch(() => cached().then((c) => (c ? clean(c) : Response.error()))))));
});
`;
await writeFile(path.join(out, 'sw.js'), SW, 'utf8');

// The manifest is written by hand, but its icon addresses carry the version.
const manifestPath = path.join(out, 'manifest.webmanifest');
if (existsSync(manifestPath)) {
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  (manifest.icons || []).forEach((icon) => { icon.src = icon.src.replace(/\?v=\d+$/, '') + V; });
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n', 'utf8');
}
// GitHub Pages runs Jekyll otherwise, which skips files and slows the build.
await writeFile(path.join(out, '.nojekyll'), '', 'utf8');

for (const icon of ['icon-180.png', 'icon-192.png', 'icon-512.png', 'favicon-64.png', 'manifest.webmanifest']) {
  if (!existsSync(path.join(out, icon))) console.warn(`warning: docs/${icon} missing - run npm run build:icons`);
}

console.log(`docs/index.html written (${(html.length / 1024).toFixed(0)} KB), rooms via ${roomsUrl}`);
console.log(`docs/sw.js written (cache ashry-${buildId})`);
