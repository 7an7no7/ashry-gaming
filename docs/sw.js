const CACHE = 'ashry-20260930184643';
const CHUNKS = 'g-chunks';
const GAME_FILES = ["./g/w-chameleon.ceaf2e9e29.js","./g/spyfall.b6ef2962d3.js","./g/bomb.badaa43a60.js","./g/w-riddles.52995a128f.js","./g/w-monkey.fc00730343.js","./g/stop.780124e894.js","./g/streak.71d21117a0.js","./g/screw.f9d0472b6a.js","./g/uno.70fa4a1521.js","./g/domino.348f048384.js","./g/duels.df52dcdae1.js","./g/dots.cd5bfe4a5d.js","./g/battleship.6b1cbabe88.js","./g/chess.79be2e3bee.js","./g/chessrooms.22e2231d48.js","./g/ludo.d83e5345ac.js","./g/snakes.57d64fabb1.js","./g/bank.4a975b53ca.js","./g/guesswho.7aad43a8f1.js","./g/witness.257c6129a5.js","./g/dark.3878edc0a4.js","./g/hangman.2579ebe1f5.js","./g/minigolf.69066459b7.js","./g/cardslib.e7bc605e20.js","./g/cards.b54d9e4d0a.js","./g/wire.fa980bb217.js","./g/bowling.885753058e.js","./g/xo.04f9a7ca6a.js","./g/w-wordle.fb0373d3f6.js","./g/w-countries.b2c042a3ce.js","./g/solve.abed564e0e.js","./g/connections.d3c84e5940.js","./g/grids.4e6bec1f8e.js","./g/wordsolo.80821340cd.js","./g/wordwheel.edfdb08d38.js","./g/chesspuzzles.df27bcf96d.js","./g/whoami.7d0fc5a713.js","./g/guessnum.3f12cbdef3.js","./g/tourney.7e63f49d54.js","./g/charades.8216d36db6.js","./g/describe.d27a76be40.js","./g/wordle.f37819e683.js","./g/newgames.ffd10fa2ea.js","./g/screwcalc.010587f7a0.js","./g/monkey.8ef12b729f.js","./g/spy.6e4a9618a5.js","./g/codenames.d49b1e33ec.js","./g/draw.f02d2ebaa7.js","./g/wavelength.af3feee236.js","./g/trivia.55b768162c.js","./g/triviaboard.786aa2f06b.js","./g/quizmaker.109f5ae7ae.js","./g/chameleon.2e8a3d7038.js","./g/timesup.461fc82421.js","./g/memory.8bab4ed756.js","./g/flags.7fc968c954.js","./g/headsup.89b824bb72.js","./g/cardscore.6692035991.js","./g/chooser.1503518a9e.js","./g/smallrooms.bf890c497c.js","./g/bumper.b28466773f.js","./g/quiz.a9fcbb7ce9.js","./g/box.238fa76dac.js","./g/exact.2a63084dca.js","./g/program.6a09be5b09.js","./g/crew.262536cd51.js"];
const KEEP_FILES = GAME_FILES.concat(["./g/program.a20b30c1b1.js"]);
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
    .then((keys) => Promise.all(keys.filter((k) => k !== CACHE && k !== CHUNKS).map((k) => caches.delete(k))))
    .then(() => caches.open(CHUNKS)).then((g) => g.keys().then((reqs) => Promise.all(reqs
      .filter((r) => KEEP_FILES.indexOf('./g/' + new URL(r.url).pathname.split('/').pop()) === -1)
      .map((r) => g.delete(r)))))
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
