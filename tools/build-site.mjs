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
import { readFile, writeFile, mkdir, readdir, rm, copyFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { gzipSync } from 'node:zlib';
import { existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { transform } from 'esbuild';
import { assemble } from './lazy-split.mjs';
import srcMod from './sources.cjs';
const { srcPath } = srcMod;
import { makeOg } from './make-og.mjs';

const here = fileURLToPath(new URL('./', import.meta.url));
const root = path.join(here, '..');
// SITE_OUT: somewhere else than docs/ (the screen test builds a copy of the site to try its
// offline copy and updates on, without touching what is published).
const out = process.env.SITE_OUT ? path.resolve(process.env.SITE_OUT) : path.join(root, 'docs');

const config = JSON.parse(await readFile(path.join(here, 'site.config.json'), 'utf8'));
const roomsUrl = String(process.env.ROOMS_URL || config.roomsUrl || '').replace(/\/+$/, '');
// APP_URL=http://127.0.0.1:8798/ builds a copy whose links point at a local site-worker (a test).
const appUrl = process.env.APP_URL || config.appUrl || '';
// The icon's version goes on its addresses: a changed address is what makes
// Android refresh an installed icon, and the page compares it with the one an
// iPhone copy was added with (checkIconBanner in JS_Utils.html).
const iconVersion = Number(config.iconVersion || 1);
const V = `?v=${iconVersion}`;
if (!/^https?:\/\/[^\s"'<>]+$/.test(roomsUrl)) {
  throw new Error('site.config.json: roomsUrl must be the rooms server address');
}

// The spy words are code (SpyWords.js), shared with the room server.
const spySource = await readFile(srcPath('SpyWords.js'), 'utf8');
const SPY_WORDS = new Function(spySource + '\nreturn SPY_WORDS;')();
// المختلف's close pairs: the one-phone game deals them too (JS_Imposter.html).
const SPY_PAIRS = new Function(spySource + '\nreturn SPY_PAIRS;')();
// The English game's words and pairs, dealt when the games' language is English.
const SPY_WORDS_EN = new Function(spySource + '\nreturn SPY_WORDS_EN;')();
const SPY_PAIRS_EN = new Function(spySource + '\nreturn SPY_PAIRS_EN;')();

// JSON inside a <script>: "</script>" in a word would end the tag early.
const scriptJson = (value) => JSON.stringify(value).replace(/</g, '\\u003c');

const MINIFY = process.env.MINIFY !== '0';

/* Minifying, one script at a time: whitespace and comments go and the syntax is
   tightened; names are kept, because every script on the page shares one scope
   and the markup calls functions by name. A script that is ES5 stays ES5 (the
   browser gate must run where nothing else does); the rest never goes past
   ES2017, the page's floor. */
const minifyJs = async (code, es5First = true) => {
  for (const target of es5First ? ['es5', 'es2017'] : ['es2017']) {
    try { return (await transform(code, { loader: 'js', target, minifyWhitespace: true, minifySyntax: true, legalComments: 'none', charset: 'utf8' })).code.trim(); }
    catch (e) { if (target === 'es2017') throw new Error(`minify: ${e.message.slice(0, 300)}`); }
  }
};

/* The page is the shell - the home, the nav, settings, help, the room engine, the
   TV's frame - and each game's code is a file of its own in g/, loaded when the
   game opens (tools/lazy-split.mjs, JS_Lazy.html). A chunk's name carries a hash
   of its code, so it can be kept for ever: a changed game is a new name, and a
   game that didn't change keeps its name (and the copy on the phone) build after
   build. LAZY=0 builds the whole page in one file, as before. */
const whole = process.env.LAZY === '0';
// Markup as the page's is minified below: HTML comments go (none is read by the page; a
// game's screen keeps its place with a comment that starts with "[", which stays) and
// indentation. A game's screens in its chunk (lazy-split.mjs) get the same, so they are
// the same nodes the page had.
const minifyMarkup = (s) => s.replace(/<!--(?!\[)[\s\S]*?-->/g, '').replace(/\n[ \t]+/g, '\n').replace(/\n{2,}/g, '\n');
const minifyCss = async (code) => (await transform(code, { loader: 'css', minify: true, charset: 'utf8', target: ['chrome88', 'safari14', 'firefox78'] })).code.trim();
const hashOf = (code) => createHash('sha1').update(code).digest('hex').slice(0, 10);
const built = await assemble({
  root, readFile, path, whole,
  prepare: (code) => (MINIFY ? minifyJs(code, false) : code),
  prepareMarkup: (h) => (MINIFY ? minifyMarkup(h) : h),
  // A game's own rules (css-split.mjs) minified as the page's styles are below.
  prepareCss: async (css) => (MINIFY ? minifyCss(css) : css),
  splitCss: process.env.CSS_SPLIT !== '0',
  // A game's own words (text-split.mjs) go with it; TEXT_SPLIT=0 keeps every word in the page.
  splitText: process.env.TEXT_SPLIT !== '0',
  name: (c, code) => `${c.id}.${hashOf(code)}.js`
});
let html = built.html;
if (built.plan) {
  const st = built.styles;
  console.log(`markup: ${built.plan.markup.views} screens and ${built.plan.markup.popups} popups come with their chunks` +
    (st ? `; styles: ${st.rules} rules and ${st.keyframes} keyframes of ${st.owned} that are one game's (css-split.mjs) come with theirs` : '') +
    (built.words ? `; words: ${built.words.moved} of ${built.words.keys} keys, each read by one game only (text-split.mjs), come with ${built.words.chunks} chunks` : ''));
}

const HEAD =`<title>عشرى جيمينج</title>
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
  .replace('<?!= initialSpyPairs ?>', () => scriptJson(SPY_PAIRS))
  .replace('<?!= initialSpyDataEn ?>', () => scriptJson(SPY_WORDS_EN))
  .replace('<?!= initialSpyPairsEn ?>', () => scriptJson(SPY_PAIRS_EN))
  // ?room=CODE, or /r/CODE (the room link with a preview, site-worker/): a phone whose
  // offline copy answers /r/CODE itself (a service worker from before the short links)
  // opens the app at that address, so the code is read from the path too.
  .replace('<?!= initialRoom ?>',
    "(function () { var m = /[?&]room=([A-Za-z0-9]{1,8})/.exec(location.search) || /\\/r\\/([A-Za-z0-9]{4,8})\\/?$/.exec(location.pathname); return m ? m[1].toUpperCase() : ''; })()")
  // A room's link is play.3ashry.workers.dev/r/CODE (a page with the room's preview for
  // WhatsApp, then the app): only where the links point at the Cloudflare address.
  .replace('<?!= roomLinks ?>', () => (appUrl ? 'true' : 'false'))
  // Every link the app shares (the app, a room's link and QR) goes to the main address, from
  // either copy, so whoever it reaches lands on the fast one (appUrl in site.config.json).
  .replace('<?!= webAppUrl ?>', () => (appUrl ? JSON.stringify(appUrl) : 'location.origin + location.pathname'));

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
      // ?open= is a shortcut on the app's icon (manifest.webmanifest, 7 Oct 2026):
      // join, daily or tonight, opened by initializeApp (JS_Core.html).
      window.OPEN_SHORTCUT = (location.search.match(/[?&]open=(join|daily|tonight)\\b/) || [])[1] || '';

      // A join link has done its job once read; leaving ?room= in the address
      // would send a reload straight back to the join screen. The same for ?install= and ?open=.
      if (/[?&](room|install|crew|open)=/.test(location.search)) history.replaceState(null, '', location.pathname + location.hash);
      // /s/CODE («الشلة»'s link) opened as the app itself: back to the app's own address.
      if (/\\/s\\/[A-Za-z]{6}\\/?$/.test(location.pathname)) history.replaceState(null, '', location.pathname.replace(/s\\/[A-Za-z]{6}\\/?$/, '') + location.hash);
      // /r/CODE opened as the app itself (an older offline copy answers it): back to the app's own address.
      if (/\\/r\\/[A-Za-z0-9]{4,8}\\/?$/.test(location.pathname)) history.replaceState(null, '', location.pathname.replace(/r\\/[A-Za-z0-9]{4,8}\\/?$/, '') + location.hash);
    </script>
</head>`;
if (html.indexOf('</head>') === -1) throw new Error('Controller.html: no </head>');
html = html.replace('</head>', () => RUNTIME);

const leftover = html.match(/<\?!?=?[\s\S]{0,40}\?>/);
if (leftover) throw new Error(`unresolved template tag: ${leftover[0]}`);

/* The published page is minified (notes/archive/plans/IMPROVEMENT_PLAN.md, Phase 2: the page
   was 7 MB, most of it comments and indentation), with minifyJs above; the chunks
   were minified the same way as they were made. MINIFY=0 leaves both as written. */
if (MINIFY) {
  const before = html.length;
  const parts = html.split(/(<script\b[^>]*>[\s\S]*?<\/script>|<style\b[^>]*>[\s\S]*?<\/style>)/i);
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (i % 2 === 0) {
      // Markup: HTML comments go (none of them is read by the page), and indentation.
      parts[i] = minifyMarkup(part);
      continue;
    }
    const m = /^(<(script|style)\b[^>]*>)([\s\S]*?)(<\/\2>)$/i.exec(part);
    if (!m || !m[3].trim()) continue;
    const [, open, tag, code, close] = m;
    if (tag.toLowerCase() === 'script') {
      if (/\bsrc=/.test(open) || (/\btype=/.test(open) && !/javascript|module/.test(open))) continue;
      parts[i] = open + (await minifyJs(code)) + close;
    } else {
      parts[i] = open + (await minifyCss(code)) + close;
    }
  }
  html = parts.join('');
  console.log(`minified: ${(before / 1e6).toFixed(2)} MB -> ${(html.length / 1e6).toFixed(2)} MB`);
}

/* The size budget (notes/archive/plans/IMPROVEMENT_PLAN.md, Phase 2). What opening the app
   downloads is the page (the shell) compressed; a build past the budget fails, so
   the shell can't creep back up a game at a time. The games' chunks are only
   reported: each comes when its game opens. Raise it on purpose, not by accident.
   (The whole page, before the split: 1,800 KB, 1,751 used.) */
{
  const BUDGET_KB = whole ? 1800 : 760; // 760 from 7 Oct 2026 (the owner: raise it now, make room later); 730 from 6 Oct
  const gz = (s) => gzipSync(Buffer.from(s, 'utf8'), { level: 9 }).length / 1024;
  const kb = Math.round(gz(html));
  const chunksKb = Math.round(built.chunks.reduce((n, c) => n + gz(c.code), 0));
  console.log(`first visit: ${kb} KB compressed (budget ${BUDGET_KB} KB)${whole ? '' : `; the ${built.chunks.length} games' chunks ${chunksKb} KB more, each when its game opens (${kb + chunksKb} KB in all)`}`);
  if (kb > BUDGET_KB && MINIFY) throw new Error(`the page is ${kb} KB compressed, over the ${BUDGET_KB} KB budget`);
}

await mkdir(out, { recursive: true });
await writeFile(path.join(out, 'index.html'), html, 'utf8');

/* The chunks, in g/. The files of the last builds (KEEP_BUILDS) are kept beside this one's:
   a page still open on that build (it switches only when nothing is lost) loads
   its own chunks from there, and so does a phone whose worker hasn't updated yet.
   g/files.json lists this build's files, and becomes the list of the one before. */
const gDir = path.join(out, 'g');
await mkdir(gDir, { recursive: true });
const listPath = path.join(gDir, 'files.json');
// The last few builds' lists, not only the one before: two builds between pushes must
// not delete the files the published build (and a phone still open on it) loads.
const KEEP_BUILDS = 4;
let history = [];
try {
  const was = JSON.parse(await readFile(listPath, 'utf8'));
  history = [was.files || []].concat(was.history || []).slice(0, KEEP_BUILDS - 1);
} catch (e) {}
// And the build that is committed (the one GitHub Pages serves): however many builds run
// before the next push, its files stay - put back from git if they were already deleted.
// Only for docs/: a build into SITE_OUT (the screen test, CI) is nobody's live copy.
let published = [];
if (!process.env.SITE_OUT) {
  try {
    published = JSON.parse(execFileSync('git', ['show', 'HEAD:docs/g/files.json'], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })).files || [];
  } catch (e) { published = []; }
  for (const f of published) {
    const p = path.join(gDir, f);
    if (existsSync(p) || !/^[\w.-]+$/.test(f)) continue;
    try { await writeFile(p, execFileSync('git', ['show', 'HEAD:docs/g/' + f], { cwd: root, stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 64 * 1024 * 1024 })); } catch (e) {}
  }
}
const before = [...new Set(history.flat().concat(published))];
const nowFiles = built.chunks.map((c) => c.file);
for (const c of built.chunks) {
  const p = path.join(gDir, c.file);
  if (!existsSync(p)) await writeFile(p, c.code, 'utf8');
}
// Stockfish, the chess coach's engine (vendor/stockfish/README.md): two files beside the
// chunks, kept and saved for offline like one - the name changes only with its version.
const ENGINE_FILES = ['sf19-lite.js', 'sf19-lite.wasm'];
for (const f of ENGINE_FILES) {
  const p = path.join(gDir, f);
  if (!existsSync(p)) await copyFile(path.join(root, 'vendor', 'stockfish', f), p);
  nowFiles.push(f);
}
const keepFiles = new Set([...nowFiles, ...before, 'files.json']);
for (const f of await readdir(gDir)) if (!keepFiles.has(f)) await rm(path.join(gDir, f), { force: true });
await writeFile(listPath, JSON.stringify({ build: buildId, files: nowFiles, history }) + '\n', 'utf8');
const prevFiles = before.filter((f) => !nowFiles.includes(f));

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
   and WebSockets, which this never touches.

   The games' chunks (g/) live in a cache of their own, g-chunks, kept from build to
   build: installing a build fetches every chunk it doesn't hold yet (a game that
   didn't change keeps its file name, so only the changed ones come), and a chunk is
   answered from there first. Activating keeps this build's chunks and the build
   before's (a page still open on that build loads its own), and drops the rest.
   The pinned CDN files are kept from build to build too, in cdn-pinned: in the
   build's own cache every release deleted three.js, the fonts and the confetti
   and QR copies, and bowling or golf opened once no longer played offline. */
const SW = `const CACHE = 'ashry-${buildId}';
const CHUNKS = 'g-chunks';
const CDN = 'cdn-pinned';
const GAME_FILES = ${JSON.stringify(nowFiles.map((f) => './g/' + f))};
const KEEP_FILES = GAME_FILES.concat(${JSON.stringify(prevFiles.map((f) => './g/' + f))});
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
  ).then(() => caches.open(CHUNKS)).then((g) => Promise.all(GAME_FILES.map((f) =>
    g.match(f).then((hit) => hit || fetch(f).then((res) => { if (!res.ok) throw new Error(f + ' ' + res.status); return g.put(f, res); })))))
  // Everything is here: say so in the build's cache. The cache itself is opened before
  // anything is fetched, so Settings → الإصدار asks for this, not for the cache.
  .then(() => caches.open(CACHE)).then((c) => c.put('./.installed', new Response('1')))
  .then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((k) => k !== CACHE && k !== CHUNKS && k !== CDN).map((k) => caches.delete(k))))
    .then(() => caches.open(CHUNKS)).then((g) => g.keys().then((reqs) => Promise.all(reqs
      .filter((r) => KEEP_FILES.indexOf('./g/' + new URL(r.url).pathname.split('/').pop()) === -1)
      .map((r) => g.delete(r)))))
    .then(() => self.clients.claim()));
});

// A good answer is kept. So is an opaque one from the pinned hosts: the fonts'
// stylesheet is asked for without CORS, so its status can't be read - and
// refusing it left the app with no fonts offline.
const keep = (req, res, pinned) => {
  if (res && (res.ok || (pinned && res.type === 'opaque' && req.mode === 'no-cors'))) { const copy = res.clone(); caches.open(pinned ? CDN : CACHE).then((c) => c.put(req, copy)); }
  return res;
};

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  if (PINNED.indexOf(url.hostname) !== -1) {
    // An opaque copy answers only a no-CORS request: handed to a CORS one (an
    // extension, a preload) the browser turns it into a network error.
    const fits = (hit) => hit && (hit.type !== 'opaque' || req.mode === 'no-cors');
    event.respondWith(caches.match(req).then((hit) => (fits(hit) ? hit :
      fetch(req).then((res) => keep(req, res, true)).catch(() => hit || Response.error()))));
    return;
  }
  if (url.origin !== self.location.origin) return;
  // The worker's own file is never kept or answered from the cache: the page asks
  // for it to learn whether a newer build is out, and offline that has to fail.
  if (url.pathname.endsWith('/sw.js')) return;

  // A game's chunk (or the chess engine's two files): its name changes whenever its code does, so the copy kept is the answer.
  if (/\\/g\\/[^/]+\\.(js|wasm)$/.test(url.pathname)) {
    event.respondWith(caches.open(CHUNKS).then((g) => g.match(req, { ignoreSearch: true }).then((hit) => hit ||
      fetch(req).then((res) => { if (res.ok) g.put(req, res.clone()); return res; }))));
    return;
  }
  const cached = () => caches.match(req).then((hit) => hit || caches.match('./index.html'));
  if (req.mode !== 'navigate') { event.respondWith(fetch(req).then((res) => keep(req, res)).catch(cached)); return; }
  // A room's link with a preview (/r/CODE, site-worker/): the page there only sends a
  // browser on to ./?room=CODE, so a phone with the app goes there at once, on line or off.
  const room = url.pathname.slice(new URL(self.registration.scope).pathname.length).match(/^r[/]([A-Za-z0-9]{4,8})[/]?$/);
  if (room) { event.respondWith(Response.redirect(new URL('./?room=' + room[1].toUpperCase(), self.registration.scope).href, 302)); return; }
  // «الشلة»'s link (/s/CODE) the same way: the app, on its join sheet.
  const crew = url.pathname.slice(new URL(self.registration.scope).pathname.length).match(/^s[/]([A-Za-z]{6})[/]?$/);
  if (crew) { event.respondWith(Response.redirect(new URL('./?crew=' + crew[1].toUpperCase(), self.registration.scope).href, 302)); return; }
  // Opening the app (a room link's ?room= too): this build's saved page at once; the
  // network only when there is none yet. A newer build arrives as a newer worker.
  event.respondWith(caches.match('./index.html').then((hit) => (hit ? clean(hit) :
    fetch(req).then((res) => keep(req, res)).catch(() => cached().then((c) => (c ? clean(c) : Response.error()))))));
});
`;
await writeFile(path.join(out, 'sw.js'), SW, 'utf8');

// The pictures and names a room link's preview shows (og/, read by site-worker/ for /r/CODE).
// Never in the worker's list above: a phone never downloads them.
{
  const og = await makeOg(out);
  console.log(`docs/og/: ${og.files} files, ${(og.bytes / 1024).toFixed(0)} KB` + (og.skipped.length ? ` (the app's picture for ${og.skipped.join(', ')})` : ''));
}

// The manifest is written by hand, but its icon addresses carry the version
// (the shortcuts' icons too: a long press on the app's icon, 7 Oct 2026).
const manifestPath = path.join(out, 'manifest.webmanifest');
if (existsSync(manifestPath)) {
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  (manifest.icons || []).concat(...(manifest.shortcuts || []).map((s) => s.icons || [])).forEach((icon) => { icon.src = icon.src.replace(/\?v=\d+$/, '') + V; });
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n', 'utf8');
}
// GitHub Pages runs Jekyll otherwise, which skips files and slows the build.
await writeFile(path.join(out, '.nojekyll'), '', 'utf8');

for (const icon of ['icon-180.png', 'icon-192.png', 'icon-512.png', 'favicon-64.png', 'manifest.webmanifest']) {
  if (!existsSync(path.join(out, icon))) console.warn(`warning: docs/${icon} missing - run npm run build:icons`);
}

console.log(`docs/index.html written (${(html.length / 1024).toFixed(0)} KB), rooms via ${roomsUrl}`);
console.log(`docs/sw.js written (cache ashry-${buildId})`);
