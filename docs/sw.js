const CACHE = 'ashry-20261008104523';
const CHUNKS = 'g-chunks';
const CDN = 'cdn-pinned';
const GAME_FILES = ["./g/roomshared.c2bebca91a.js","./g/move.b460bc2d3d.js","./g/faces.dfa64cbeb5.js","./g/w-chameleon.8d079d39c8.js","./g/spyfall.f3c8271e96.js","./g/bomb.b5b33f995f.js","./g/w-riddles.a04245bf8f.js","./g/w-monkey.cdd67006bc.js","./g/stop.329e569398.js","./g/streak.db969d49a0.js","./g/screw.ccf79d97b8.js","./g/uno.9e02420535.js","./g/domino.61a58863f5.js","./g/duels.355ee97769.js","./g/dots.5c46dbda19.js","./g/battleship.8ed5a6a889.js","./g/chess.ed2203eae6.js","./g/chessrooms.52e21c559e.js","./g/ludo.8bc90731a9.js","./g/snakes.f010b62a5c.js","./g/bank.8cd21f24c3.js","./g/guesswho.8c6f469283.js","./g/witness.c4d262c0dc.js","./g/dark.1c04387e19.js","./g/hangman.4ab279c752.js","./g/minigolf.613c13b8c9.js","./g/cardslib.01ec52f708.js","./g/cards.c5ff12f5b5.js","./g/wire.6ab5bb8d20.js","./g/vault.2ebba46022.js","./g/hear.4131a4ed46.js","./g/bowling.98962a5bf6.js","./g/xo.ff47e5b86e.js","./g/w-wordle.5bff72e93f.js","./g/w-countries.1cf8342b11.js","./g/solve.c21201274d.js","./g/connections.5c45712f72.js","./g/grids.1c41c2e9d8.js","./g/wordsolo.55f09d2e2b.js","./g/wordwheel.31710faa85.js","./g/chesspuzzles.a6fdbd8782.js","./g/mission.059ff8a4e5.js","./g/laser.c39d94541e.js","./g/whoami.6138317b92.js","./g/guessnum.2699173027.js","./g/tourney.1b036ae877.js","./g/charades.a6bec26ef8.js","./g/describe.7b62f0b767.js","./g/wordle.9e2ecb8623.js","./g/newgames.9d4a769784.js","./g/screwcalc.f7afde9d7d.js","./g/monkey.230a924ea1.js","./g/spy.a38ebecfbf.js","./g/codenames.b4548b0a6f.js","./g/draw.83aaebc3fd.js","./g/trivia.2decf7dcce.js","./g/triviaboard.351f5e7ed4.js","./g/quizmaker.649e48fb71.js","./g/chameleon.57266a72d0.js","./g/timesup.7ccda7c2c7.js","./g/memory.d41078cebc.js","./g/flags.e8c81943b5.js","./g/headsup.de4dfd042d.js","./g/cardscore.b59642075b.js","./g/chooser.2f58d15276.js","./g/smallrooms.48eb120d7b.js","./g/reaction.92eeba4130.js","./g/bumper.1c36df80e7.js","./g/quiz.b07768daf3.js","./g/box.71a840fb76.js","./g/exact.6bc8d48405.js","./g/hum.55153ec360.js","./g/program.b5bb4f4e01.js","./g/flagsmap.b32e71347d.js","./g/crew.bf2024ed0c.js","./g/sf19-lite.js","./g/sf19-lite.wasm"];
const KEEP_FILES = GAME_FILES.concat(["./g/whoami.38242f1897.js","./g/newgames.4d85fe0c56.js","./g/chameleon.7b14d26485.js","./g/chess.b589acf536.js","./g/snakes.3b08564a8b.js","./g/bank.f5b2e0fbe6.js","./g/xo.1c983790b6.js","./g/whoami.c556461a81.js","./g/monkey.764d00cd70.js","./g/spy.7f554d6735.js","./g/triviaboard.cadd4b468d.js","./g/w-riddles.539e0a8f5d.js","./g/charades.11bb6ea640.js"]);
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
        if (txt.indexOf('"20261008104523"') === -1) throw new Error('stale index');
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
