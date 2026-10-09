const CACHE = 'ashry-20261009144248';
const CHUNKS = 'g-chunks';
const CDN = 'cdn-pinned';
const GAME_FILES = ["./g/roomshared.c2bebca91a.js","./g/move.b460bc2d3d.js","./g/faces.dfa64cbeb5.js","./g/w-chameleon.8d079d39c8.js","./g/spyfall.f3c8271e96.js","./g/bomb.9fcfb9bf3a.js","./g/w-riddles.a04245bf8f.js","./g/w-monkey.cdd67006bc.js","./g/stop.2f2627296c.js","./g/streak.685505067d.js","./g/screw.c79f60ec72.js","./g/uno.618a0743ae.js","./g/domino.da24716c6d.js","./g/duels.f78507fa88.js","./g/dots.5c46dbda19.js","./g/battleship.b12142ed7e.js","./g/chess.ed2203eae6.js","./g/chessrooms.e3071a4939.js","./g/ludo.4f67a35694.js","./g/snakes.96e7d92959.js","./g/bank.e895aa4e78.js","./g/guesswho.f32bc3699e.js","./g/witness.01df876740.js","./g/dark.59df4efaa1.js","./g/hangman.857aaeb052.js","./g/minigolf.54f1f3a766.js","./g/cardslib.01ec52f708.js","./g/cards.1158cf3f99.js","./g/wire.a333e46ba5.js","./g/vault.1d3d3db4a8.js","./g/hear.4131a4ed46.js","./g/bowling.79f337dfe5.js","./g/xo.ff47e5b86e.js","./g/w-wordle.5bff72e93f.js","./g/w-countries.1cf8342b11.js","./g/solve.befae7cd6d.js","./g/connections.7e3334f0e9.js","./g/grids.6139521987.js","./g/wordsolo.63211b4b4c.js","./g/wordwheel.6daa43d2be.js","./g/boggle.7b16af79b0.js","./g/chesspuzzles.a6fdbd8782.js","./g/mission.e619582dae.js","./g/laser.8350a69644.js","./g/oracle.25556aaa05.js","./g/hesba.ae6ea69987.js","./g/blockway.b0f8a0b7c3.js","./g/whoami.6138317b92.js","./g/guessnum.2699173027.js","./g/tourney.1b036ae877.js","./g/charades.a6bec26ef8.js","./g/describe.7b62f0b767.js","./g/wordle.3a3fcdf93c.js","./g/newgames.789ac19ee3.js","./g/screwcalc.f7afde9d7d.js","./g/monkey.15591e5417.js","./g/spy.f952720b2a.js","./g/codenames.b39477c1cb.js","./g/draw.c233b870ae.js","./g/trivia.047940a48e.js","./g/triviaboard.854d331a8d.js","./g/quizmaker.649e48fb71.js","./g/chameleon.57266a72d0.js","./g/timesup.7ccda7c2c7.js","./g/memory.d41078cebc.js","./g/flags.e8c81943b5.js","./g/headsup.de4dfd042d.js","./g/cardscore.b59642075b.js","./g/chooser.2f58d15276.js","./g/smallrooms.10d6d5222c.js","./g/reaction.92eeba4130.js","./g/bumper.45f6d05cb5.js","./g/quiz.cb6dd6df01.js","./g/box.4bb2487458.js","./g/exact.b454d583fa.js","./g/hum.55153ec360.js","./g/program.b5bb4f4e01.js","./g/flagsmap.b32e71347d.js","./g/crew.98f4593b2f.js","./g/sf19-lite.js","./g/sf19-lite.wasm"];
const KEEP_FILES = GAME_FILES.concat(["./g/oracle.5e0165a6e9.js","./g/oracle.3e68876ee5.js","./g/duels.355ee97769.js"]);
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
      // Only this build's page: an edge still serving the build before (GitHub Pages while
      // it purges) would be kept as this one's. A failed install retries on the next check.
      return res.clone().text().then((txt) => {
        if (txt.indexOf('"20261009144248"') === -1) throw new Error('stale index');
        return Promise.all([c.put('./index.html', res.clone()), c.put('./', res)]);
      });
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
    // Only this app's own builds' caches: on GitHub Pages the origin (7an7no7.github.io) is
    // shared with any other project page of the account, and theirs are not ours to delete.
    .then((keys) => Promise.all(keys.filter((k) => /^ashry-\d+$/.test(k) && k !== CACHE).map((k) => caches.delete(k))))
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
  if (/\/g\/[^/]+\.(js|wasm)$/.test(url.pathname)) {
    event.respondWith(caches.open(CHUNKS).then((g) => g.match(req, { ignoreSearch: true }).then((hit) => hit ||
      fetch(req).then((res) => { if (res.ok) g.put(req, res.clone()); return res; }))));
    return;
  }
  // From this build's cache, never caches.match across the (possibly shared) origin.
  const own = (r) => caches.open(CACHE).then((c) => c.match(r));
  const cached = () => own(req).then((hit) => hit || own('./index.html'));
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
  event.respondWith(own('./index.html').then((hit) => (hit ? clean(hit) :
    fetch(req).then((res) => keep(req, res)).catch(() => cached().then((c) => (c ? clean(c) : Response.error()))))));
});
