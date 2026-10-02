const CACHE = 'ashry-20261002122127';
const CHUNKS = 'g-chunks';
const CDN = 'cdn-pinned';
const GAME_FILES = ["./g/w-chameleon.dcfcad76b9.js","./g/spyfall.413f09b65a.js","./g/bomb.3beb68a5f6.js","./g/w-riddles.d4f3626a96.js","./g/w-monkey.fc00730343.js","./g/stop.0bb72344e5.js","./g/streak.6f87e2f648.js","./g/screw.f9d0472b6a.js","./g/uno.70fa4a1521.js","./g/domino.f1c232d56f.js","./g/duels.213353e4a1.js","./g/dots.038e25c3ff.js","./g/battleship.306978c3ee.js","./g/chess.5559cb27c2.js","./g/chessrooms.308bbb6a3d.js","./g/ludo.718968cec6.js","./g/snakes.666f2e1453.js","./g/bank.afb18b689e.js","./g/guesswho.aa2196fcf4.js","./g/witness.0419d3bee2.js","./g/dark.3878edc0a4.js","./g/hangman.78c132f2e7.js","./g/minigolf.3d809c203d.js","./g/cardslib.e7bc605e20.js","./g/cards.24e9e63ad9.js","./g/wire.b51515b5c3.js","./g/vault.a5f21b75b6.js","./g/hear.d317442ab1.js","./g/bowling.e0aee16d11.js","./g/xo.5a46c85e42.js","./g/w-wordle.52f91f8c5d.js","./g/w-countries.b2c042a3ce.js","./g/solve.3915cce50f.js","./g/connections.90315b454f.js","./g/grids.54ea7d2610.js","./g/wordsolo.dfd9d7ec10.js","./g/wordwheel.92829f682c.js","./g/chesspuzzles.7feeaefefe.js","./g/mission.0baf26222b.js","./g/whoami.5bbe6b8725.js","./g/guessnum.61cfca2ddc.js","./g/tourney.7e63f49d54.js","./g/charades.8216d36db6.js","./g/describe.d27a76be40.js","./g/wordle.29ebc6cea6.js","./g/newgames.babf5850b7.js","./g/screwcalc.40d788bb8d.js","./g/monkey.8a569d8783.js","./g/spy.a5db563acb.js","./g/codenames.d49b1e33ec.js","./g/draw.fc6409cd42.js","./g/trivia.3f27453030.js","./g/triviaboard.2e27f2772f.js","./g/quizmaker.46226cb627.js","./g/chameleon.0c898f0b61.js","./g/timesup.461fc82421.js","./g/memory.8940400772.js","./g/flags.fe53f67d9a.js","./g/headsup.1c2c08cf85.js","./g/cardscore.41b4b8c342.js","./g/chooser.1503518a9e.js","./g/smallrooms.7a2d3f32fd.js","./g/bumper.ca14273c23.js","./g/quiz.e00d7db0c9.js","./g/box.238fa76dac.js","./g/exact.4d9f1d9776.js","./g/hum.ed910097ff.js","./g/program.e66fa84684.js","./g/crew.9f9acfa017.js"];
const KEEP_FILES = GAME_FILES.concat(["./g/snakes.20e461297e.js","./g/snakes.f5a75c0e3a.js","./g/hangman.12f5119a62.js"]);
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

  // A game's chunk: its name changes whenever its code does, so the copy kept is the answer.
  if (/\/g\/[^/]+\.js$/.test(url.pathname)) {
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
