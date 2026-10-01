const CACHE = 'ashry-20261001103431';
const CHUNKS = 'g-chunks';
const CDN = 'cdn-pinned';
const GAME_FILES = ["./g/w-chameleon.ceaf2e9e29.js","./g/spyfall.779fa91fe9.js","./g/bomb.3beb68a5f6.js","./g/w-riddles.52995a128f.js","./g/w-monkey.fc00730343.js","./g/stop.0bb72344e5.js","./g/streak.ae6bca100d.js","./g/screw.f9d0472b6a.js","./g/uno.70fa4a1521.js","./g/domino.f1c232d56f.js","./g/duels.a8b27224e1.js","./g/dots.3832a75ff1.js","./g/battleship.306978c3ee.js","./g/chess.5559cb27c2.js","./g/chessrooms.2039c6ce0d.js","./g/ludo.718968cec6.js","./g/snakes.f5a75c0e3a.js","./g/bank.afb18b689e.js","./g/guesswho.5c2d8d9186.js","./g/witness.59b55140f8.js","./g/dark.3878edc0a4.js","./g/hangman.12f5119a62.js","./g/minigolf.433de5753b.js","./g/cardslib.e7bc605e20.js","./g/cards.24e9e63ad9.js","./g/wire.1e28d13880.js","./g/vault.b292b5088d.js","./g/hear.c2702e18ff.js","./g/bowling.b2afdb5f78.js","./g/xo.b0bbf9e44f.js","./g/w-wordle.fb0373d3f6.js","./g/w-countries.b2c042a3ce.js","./g/solve.3915cce50f.js","./g/connections.810da86f8c.js","./g/grids.533366e6ca.js","./g/wordsolo.68aa9d484e.js","./g/wordwheel.8e78fb942d.js","./g/chesspuzzles.310676fba1.js","./g/mission.93764db6f8.js","./g/whoami.5bbe6b8725.js","./g/guessnum.61cfca2ddc.js","./g/tourney.7e63f49d54.js","./g/charades.8216d36db6.js","./g/describe.d27a76be40.js","./g/wordle.b2432a5fa5.js","./g/newgames.babf5850b7.js","./g/screwcalc.40d788bb8d.js","./g/monkey.8a569d8783.js","./g/spy.a5db563acb.js","./g/codenames.d49b1e33ec.js","./g/draw.746c6535b5.js","./g/wavelength.18135b6800.js","./g/trivia.55b768162c.js","./g/triviaboard.1606c1a954.js","./g/quizmaker.46226cb627.js","./g/chameleon.7e54e7ea7a.js","./g/timesup.461fc82421.js","./g/memory.8940400772.js","./g/flags.fe53f67d9a.js","./g/headsup.1c2c08cf85.js","./g/cardscore.41b4b8c342.js","./g/chooser.1503518a9e.js","./g/smallrooms.8955578ae0.js","./g/bumper.13c88b72f7.js","./g/quiz.e00d7db0c9.js","./g/box.238fa76dac.js","./g/exact.4d9f1d9776.js","./g/hum.a78ba39e49.js","./g/program.e66fa84684.js","./g/crew.00f93745a6.js"];
const KEEP_FILES = GAME_FILES.concat(["./g/bomb.dd5f176723.js","./g/stop.780124e894.js","./g/domino.6d8d14dc8b.js","./g/duels.5a5b626e5e.js","./g/dots.0cbf553f5e.js","./g/battleship.0f6098ead3.js","./g/chess.c0148c36e6.js","./g/chessrooms.0fda237494.js","./g/ludo.d83e5345ac.js","./g/snakes.1e3407a1ca.js","./g/guesswho.0db5100dc9.js","./g/hangman.91303956b0.js","./g/minigolf.52b17b5033.js","./g/cards.11e01432ae.js","./g/wire.e4d88ec75b.js","./g/vault.de27f158c3.js","./g/xo.83c6c7eadd.js","./g/connections.d3c84e5940.js","./g/grids.2ea9c7c26c.js","./g/wordsolo.3c15ab20ad.js","./g/wordwheel.3af0aa3636.js","./g/chesspuzzles.df27bcf96d.js","./g/mission.985e411e33.js","./g/wordle.514ee8a4a0.js","./g/screwcalc.010587f7a0.js","./g/monkey.3e4d50697e.js","./g/triviaboard.786aa2f06b.js","./g/quizmaker.cf3928d73a.js","./g/flags.699f599dc1.js","./g/headsup.ebd12941ab.js","./g/cardscore.14f1631553.js","./g/smallrooms.f6f3b605bb.js","./g/bumper.b28466773f.js","./g/hum.0f529d29a6.js","./g/crew.262536cd51.js","./g/spyfall.ca6496e09d.js","./g/bomb.52d305902a.js","./g/streak.e73b7f4737.js","./g/domino.348f048384.js","./g/duels.cbb7ce53bd.js","./g/dots.25223849b8.js","./g/battleship.6b1cbabe88.js","./g/chess.79be2e3bee.js","./g/chessrooms.22e2231d48.js","./g/snakes.57d64fabb1.js","./g/bank.4a975b53ca.js","./g/guesswho.7aad43a8f1.js","./g/witness.257c6129a5.js","./g/minigolf.69066459b7.js","./g/cards.43b92c7e2a.js","./g/wire.fa980bb217.js","./g/bowling.885753058e.js","./g/xo.0e7dcc22b6.js","./g/solve.a26afed4fc.js","./g/grids.507b622b26.js","./g/wordle.f37819e683.js","./g/monkey.d901d7413b.js","./g/spy.7e5db0d574.js","./g/draw.f02d2ebaa7.js","./g/wavelength.af3feee236.js","./g/quizmaker.109f5ae7ae.js","./g/chameleon.6611ae06b9.js","./g/flags.182b8a5483.js","./g/headsup.89b824bb72.js","./g/cardscore.6692035991.js","./g/smallrooms.f7ed926e52.js","./g/quiz.de6b8e60d5.js","./g/exact.2a63084dca.js","./g/program.6a09be5b09.js"]);
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
  if (res && (res.ok || (pinned && res.type === 'opaque'))) { const copy = res.clone(); caches.open(pinned ? CDN : CACHE).then((c) => c.put(req, copy)); }
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
