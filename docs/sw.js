const CACHE = 'ashry-20261007220642';
const CHUNKS = 'g-chunks';
const CDN = 'cdn-pinned';
const GAME_FILES = ["./g/roomshared.c2bebca91a.js","./g/move.5cc4e1d92d.js","./g/faces.dfa64cbeb5.js","./g/w-chameleon.8d079d39c8.js","./g/spyfall.79840196dd.js","./g/bomb.7c0a2cb5f6.js","./g/w-riddles.a04245bf8f.js","./g/w-monkey.cdd67006bc.js","./g/stop.e4522e840a.js","./g/streak.9d4f82d249.js","./g/screw.de03c59b97.js","./g/uno.c096e93530.js","./g/domino.bb0f801448.js","./g/duels.355ee97769.js","./g/dots.5c46dbda19.js","./g/battleship.53fcd95b9c.js","./g/chess.0b80062b8a.js","./g/chessrooms.76bd74ae0f.js","./g/ludo.8dd910ab06.js","./g/snakes.6750d54545.js","./g/bank.2eefa89b5a.js","./g/guesswho.8c6f469283.js","./g/witness.c4d262c0dc.js","./g/dark.9a1f37a502.js","./g/hangman.bd0bb90193.js","./g/minigolf.e4167648e2.js","./g/cardslib.01ec52f708.js","./g/cards.a8a6810305.js","./g/wire.dd73e1e1c9.js","./g/vault.c14f378b0d.js","./g/hear.8d0251ef4e.js","./g/bowling.98962a5bf6.js","./g/xo.1c983790b6.js","./g/w-wordle.5bff72e93f.js","./g/w-countries.90e8c690e6.js","./g/solve.0c169431da.js","./g/connections.545005fbc0.js","./g/grids.a9994460c7.js","./g/wordsolo.1f8356509f.js","./g/wordwheel.9a5907eabf.js","./g/chesspuzzles.a6fdbd8782.js","./g/mission.be47723543.js","./g/laser.8afa177630.js","./g/whoami.cb4ca5b2d5.js","./g/guessnum.2f95df5eeb.js","./g/tourney.1b036ae877.js","./g/charades.a6bec26ef8.js","./g/describe.7b62f0b767.js","./g/wordle.9e2ecb8623.js","./g/newgames.0ac235e91d.js","./g/screwcalc.f7afde9d7d.js","./g/monkey.fca19ba936.js","./g/spy.96fd9ceed7.js","./g/codenames.b4548b0a6f.js","./g/draw.afe9ab1ec9.js","./g/trivia.2decf7dcce.js","./g/triviaboard.d317e966f3.js","./g/quizmaker.649e48fb71.js","./g/chameleon.7b14d26485.js","./g/timesup.792dea27e6.js","./g/memory.d41078cebc.js","./g/flags.e8c81943b5.js","./g/headsup.a2f640abe7.js","./g/cardscore.237f0ae15f.js","./g/chooser.2f58d15276.js","./g/smallrooms.c5cb19ceab.js","./g/reaction.2715f199f1.js","./g/bumper.c7facd4257.js","./g/quiz.b07768daf3.js","./g/box.58744816e2.js","./g/exact.d27b1992fc.js","./g/hum.55153ec360.js","./g/program.afd05329bb.js","./g/flagsmap.b32e71347d.js","./g/crew.bf2024ed0c.js","./g/sf19-lite.js","./g/sf19-lite.wasm"];
const KEEP_FILES = GAME_FILES.concat(["./g/move.52257d7224.js","./g/spyfall.0a68761e45.js","./g/bomb.626d456888.js","./g/stop.255c465bc0.js","./g/streak.d1419be13b.js","./g/screw.e42a8df02d.js","./g/uno.cb71b96eef.js","./g/domino.62beed65f8.js","./g/duels.23b42bd25e.js","./g/dots.8c0ed2f7fd.js","./g/battleship.a9bd69fcbd.js","./g/chess.32f5f1e4c5.js","./g/chessrooms.3bd1aabbfa.js","./g/ludo.25e9a460e2.js","./g/snakes.811d1d62df.js","./g/bank.18ae4e6575.js","./g/guesswho.6b5619060b.js","./g/dark.ecfc683d2f.js","./g/hangman.8b13a3660b.js","./g/minigolf.45a7281003.js","./g/cardslib.f746796b19.js","./g/cards.58ec306bf2.js","./g/wire.93ed38cd89.js","./g/vault.b2756f4df8.js","./g/hear.157125fa36.js","./g/bowling.6c21986276.js","./g/xo.139faf68f4.js","./g/solve.5b681f2d9d.js","./g/connections.04b70806e8.js","./g/grids.1b84d3aa59.js","./g/wordsolo.b93272442e.js","./g/wordwheel.4529df0c6d.js","./g/chesspuzzles.8232230343.js","./g/mission.db780d3840.js","./g/laser.4b6730c1c2.js","./g/whoami.ee3563994d.js","./g/guessnum.9ed5051b9e.js","./g/tourney.7dbe913bd7.js","./g/charades.38b0112ac2.js","./g/describe.1ade333b3f.js","./g/wordle.2c4a7089a3.js","./g/newgames.d5ae87878e.js","./g/screwcalc.99fffffdc6.js","./g/monkey.060e106135.js","./g/spy.6bae26f13d.js","./g/codenames.a8ad062e0f.js","./g/draw.a9d9e51a75.js","./g/trivia.5fccc1d254.js","./g/triviaboard.5980615298.js","./g/quizmaker.27e695c06d.js","./g/chameleon.b7f0f44980.js","./g/timesup.fae7ff45ca.js","./g/memory.619b97b9cc.js","./g/flags.99b05fbbf8.js","./g/headsup.8a149cffa1.js","./g/cardscore.aa3d0c4b4d.js","./g/chooser.1a19ba60a5.js","./g/smallrooms.527a9375eb.js","./g/reaction.e540908f5d.js","./g/bumper.5ac860a9da.js","./g/quiz.29ee125ed2.js","./g/box.b77fd07a35.js","./g/exact.5abcbe1889.js","./g/hum.81bf1ef5fd.js","./g/program.7f7af7c944.js","./g/flagsmap.f8e29a038a.js","./g/crew.3603ac0e07.js","./g/duels.85903da1fd.js","./g/vault.6a6119904e.js","./g/mission.64e6836fa5.js","./g/describe.ee96ca151f.js","./g/newgames.1f8c669dd4.js","./g/memory.108b4d5de6.js","./g/bumper.bf94cc7422.js","./g/stop.94276acc65.js","./g/chess.726fb4bf29.js","./g/program.e89f323744.js","./g/crew.083c877c2a.js"]);
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
  if (/\/g\/[^/]+\.(js|wasm)$/.test(url.pathname)) {
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
