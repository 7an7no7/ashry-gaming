const CACHE = 'ashry-20261007131626';
const CHUNKS = 'g-chunks';
const CDN = 'cdn-pinned';
const GAME_FILES = ["./g/roomshared.116f07dee2.js","./g/move.bfb043ca4e.js","./g/w-chameleon.8d079d39c8.js","./g/spyfall.0a68761e45.js","./g/bomb.626d456888.js","./g/w-riddles.a04245bf8f.js","./g/w-monkey.cdd67006bc.js","./g/stop.55da462f28.js","./g/streak.d1419be13b.js","./g/screw.e42a8df02d.js","./g/uno.cb71b96eef.js","./g/domino.39f8a42d26.js","./g/duels.ba764c9f0b.js","./g/dots.8c0ed2f7fd.js","./g/battleship.a9bd69fcbd.js","./g/chess.726fb4bf29.js","./g/chessrooms.3bd1aabbfa.js","./g/ludo.25e9a460e2.js","./g/snakes.811d1d62df.js","./g/bank.18ae4e6575.js","./g/guesswho.50c08fb564.js","./g/witness.e5106b00f2.js","./g/dark.da2c11f47f.js","./g/hangman.2314a095f8.js","./g/minigolf.45a7281003.js","./g/cardslib.1146d238a0.js","./g/cards.9f26495729.js","./g/wire.93ed38cd89.js","./g/vault.6e70741669.js","./g/hear.157125fa36.js","./g/bowling.6c21986276.js","./g/xo.139faf68f4.js","./g/w-wordle.5bff72e93f.js","./g/w-countries.90e8c690e6.js","./g/solve.5b681f2d9d.js","./g/connections.04b70806e8.js","./g/grids.1b84d3aa59.js","./g/wordsolo.b93272442e.js","./g/wordwheel.831c40cafb.js","./g/chesspuzzles.8232230343.js","./g/mission.64e6836fa5.js","./g/laser.4b6730c1c2.js","./g/whoami.ee3563994d.js","./g/guessnum.9ed5051b9e.js","./g/tourney.7dbe913bd7.js","./g/charades.38b0112ac2.js","./g/describe.ee96ca151f.js","./g/wordle.2c4a7089a3.js","./g/newgames.1f8c669dd4.js","./g/screwcalc.99fffffdc6.js","./g/monkey.060e106135.js","./g/spy.6bae26f13d.js","./g/codenames.a8ad062e0f.js","./g/draw.a9d9e51a75.js","./g/trivia.5fccc1d254.js","./g/triviaboard.6699769367.js","./g/quizmaker.a36a83b52e.js","./g/chameleon.b7f0f44980.js","./g/timesup.a27266acb2.js","./g/memory.108b4d5de6.js","./g/flags.99b05fbbf8.js","./g/headsup.8a149cffa1.js","./g/cardscore.aa3d0c4b4d.js","./g/chooser.1a19ba60a5.js","./g/smallrooms.e310cc6773.js","./g/reaction.b70837b5d6.js","./g/bumper.449786c727.js","./g/quiz.49c9581d0e.js","./g/box.b77fd07a35.js","./g/exact.5abcbe1889.js","./g/hum.81bf1ef5fd.js","./g/program.e89f323744.js","./g/flagsmap.f8e29a038a.js","./g/crew.083c877c2a.js","./g/sf19-lite.js","./g/sf19-lite.wasm"];
const KEEP_FILES = GAME_FILES.concat(["./g/move.d7cebcb5c0.js","./g/spyfall.4fd7988ffe.js","./g/bomb.612c73519f.js","./g/stop.ede6736eed.js","./g/uno.390fa1cea5.js","./g/domino.c38ae339b7.js","./g/duels.e35b856376.js","./g/dots.2b6e284a61.js","./g/battleship.9d47220976.js","./g/chess.165e837813.js","./g/chessrooms.ecd27741b4.js","./g/ludo.e65c3e0c46.js","./g/snakes.7cea486733.js","./g/bank.483fcff13e.js","./g/guesswho.78244f7d2b.js","./g/witness.82635d3e99.js","./g/dark.71a328e73a.js","./g/hangman.c283011986.js","./g/minigolf.fe616c3381.js","./g/cards.d7b2134405.js","./g/wire.318f4f8afc.js","./g/vault.f83d3e334d.js","./g/hear.45222312f4.js","./g/xo.edd84d5f9d.js","./g/solve.5c823a971b.js","./g/connections.adef3a79bf.js","./g/grids.0ef7b4b4ac.js","./g/wordsolo.f7af52e805.js","./g/wordwheel.7ae6e7ad04.js","./g/mission.0671ea77f9.js","./g/laser.b7978f930f.js","./g/guessnum.2c31da44b6.js","./g/charades.84594161a9.js","./g/describe.c70a548de4.js","./g/wordle.b5e3a5f1c0.js","./g/newgames.aa49aeada8.js","./g/screwcalc.06f42be1ed.js","./g/spy.4b6fb3bb9a.js","./g/trivia.888ef07daa.js","./g/triviaboard.831917091e.js","./g/quizmaker.f3c2224acc.js","./g/timesup.759945588b.js","./g/memory.a1efe89fc5.js","./g/flags.e84243232c.js","./g/smallrooms.9a0f37261a.js","./g/bumper.a1d0980710.js","./g/quiz.783c544cfb.js","./g/box.0df4ebc164.js","./g/exact.a2da88d64d.js","./g/hum.58024574ae.js","./g/program.94c703556b.js","./g/flagsmap.7f870de5dd.js","./g/spyfall.76ea6b1b4f.js","./g/bomb.ac9491d0c1.js","./g/w-monkey.b8ffa045e6.js","./g/streak.df5558c495.js","./g/screw.d6feed45b8.js","./g/uno.9fa746e68b.js","./g/duels.1a932d0131.js","./g/dots.bf70a56bcc.js","./g/battleship.7855487868.js","./g/chess.47fc4c7b26.js","./g/chessrooms.2340e7d4cf.js","./g/snakes.9c024c749a.js","./g/bank.ab2c02a50c.js","./g/guesswho.5159d60041.js","./g/witness.429a87c25e.js","./g/dark.530b324933.js","./g/minigolf.6f0e8e1cc3.js","./g/cardslib.46050a038d.js","./g/cards.88193caf82.js","./g/wire.9427e060f3.js","./g/vault.aba2ad733f.js","./g/bowling.8925bde317.js","./g/xo.3634176245.js","./g/solve.cc6c6234e0.js","./g/connections.663ce6bc0a.js","./g/grids.1b881975e0.js","./g/wordwheel.00f561b05a.js","./g/chesspuzzles.a530ee8c10.js","./g/mission.8ad3633084.js","./g/guessnum.2d4329da77.js","./g/tourney.ab38fa8ad5.js","./g/wordle.902b8aa26a.js","./g/screwcalc.1b608e0303.js","./g/monkey.4401262649.js","./g/draw.6b6be72f45.js","./g/triviaboard.75d21f3405.js","./g/quizmaker.47463b64ef.js","./g/chameleon.e4064f10ad.js","./g/memory.51e628e40c.js","./g/flags.20f7ef4f8b.js","./g/cardscore.dc9c873f0e.js","./g/smallrooms.e2a757cc04.js","./g/box.3da11e6380.js","./g/exact.b46616568c.js","./g/hum.dc86c889be.js","./g/program.13acd9e484.js","./g/flagsmap.482d739028.js","./g/crew.52d3322f6d.js","./g/screw.6751804fd5.js"]);
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
