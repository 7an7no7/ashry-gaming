const CACHE = 'ashry-20261007074633';
const CHUNKS = 'g-chunks';
const CDN = 'cdn-pinned';
const GAME_FILES = ["./g/roomshared.116f07dee2.js","./g/move.d7cebcb5c0.js","./g/w-chameleon.8d079d39c8.js","./g/spyfall.76ea6b1b4f.js","./g/bomb.ac9491d0c1.js","./g/w-riddles.a04245bf8f.js","./g/w-monkey.b8ffa045e6.js","./g/stop.f3f9293a32.js","./g/streak.df5558c495.js","./g/screw.6751804fd5.js","./g/uno.9fa746e68b.js","./g/domino.c38ae339b7.js","./g/duels.1a932d0131.js","./g/dots.bf70a56bcc.js","./g/battleship.7855487868.js","./g/chess.47fc4c7b26.js","./g/chessrooms.2340e7d4cf.js","./g/ludo.e65c3e0c46.js","./g/snakes.9c024c749a.js","./g/bank.ab2c02a50c.js","./g/guesswho.5159d60041.js","./g/witness.86f9985aa0.js","./g/dark.530de3272e.js","./g/hangman.c283011986.js","./g/minigolf.6f0e8e1cc3.js","./g/cardslib.46050a038d.js","./g/cards.88193caf82.js","./g/wire.be8c96e043.js","./g/vault.eceedd7494.js","./g/hear.45222312f4.js","./g/bowling.8925bde317.js","./g/xo.3634176245.js","./g/w-wordle.5bff72e93f.js","./g/w-countries.90e8c690e6.js","./g/solve.cc6c6234e0.js","./g/connections.663ce6bc0a.js","./g/grids.1b881975e0.js","./g/wordsolo.f7af52e805.js","./g/wordwheel.00f561b05a.js","./g/chesspuzzles.a530ee8c10.js","./g/mission.145ff19889.js","./g/laser.01c281ac79.js","./g/whoami.ee3563994d.js","./g/guessnum.2d4329da77.js","./g/tourney.ab38fa8ad5.js","./g/charades.fe97d80200.js","./g/describe.c70a548de4.js","./g/wordle.902b8aa26a.js","./g/newgames.d3029daff0.js","./g/screwcalc.1b608e0303.js","./g/monkey.4401262649.js","./g/spy.4b6fb3bb9a.js","./g/codenames.5bdee8250f.js","./g/draw.7e9591db29.js","./g/trivia.888ef07daa.js","./g/triviaboard.75d21f3405.js","./g/quizmaker.47463b64ef.js","./g/chameleon.411d639994.js","./g/timesup.759945588b.js","./g/memory.51e628e40c.js","./g/flags.20f7ef4f8b.js","./g/headsup.8a149cffa1.js","./g/cardscore.dc9c873f0e.js","./g/chooser.1a19ba60a5.js","./g/smallrooms.84b3ed9d2f.js","./g/reaction.7da882b03c.js","./g/bumper.f2e34c8d26.js","./g/quiz.f4f4cd1992.js","./g/box.b9d18ab899.js","./g/exact.15776860e0.js","./g/hum.3bc47bc53e.js","./g/program.e090f2417c.js","./g/flagsmap.482d739028.js","./g/crew.52d3322f6d.js","./g/sf19-lite.js","./g/sf19-lite.wasm"];
const KEEP_FILES = GAME_FILES.concat(["./g/spyfall.b4544dc68d.js","./g/bomb.0f2d68a5b3.js","./g/stop.aa16713045.js","./g/streak.52fc94c4c9.js","./g/screw.773eb3c593.js","./g/uno.962d1350a2.js","./g/domino.bde8c03e83.js","./g/duels.45b571f3bc.js","./g/dots.a3cb249f8e.js","./g/battleship.ef2c603be4.js","./g/chess.9ca9eca0f8.js","./g/chessrooms.163cedba6a.js","./g/ludo.91e08e24d9.js","./g/snakes.c875979990.js","./g/bank.147a457e3f.js","./g/guesswho.5317895a61.js","./g/witness.db38c0a4b7.js","./g/dark.662a758d54.js","./g/hangman.4f56484954.js","./g/minigolf.fe3978339a.js","./g/cardslib.9c8a0ccfdc.js","./g/cards.36a6572e2f.js","./g/wire.f1ec095acf.js","./g/vault.373e0c7589.js","./g/hear.b20e51ef75.js","./g/bowling.633796ee21.js","./g/xo.7ba409aa16.js","./g/solve.28222162e9.js","./g/connections.61c488de93.js","./g/grids.11d2b2d2b3.js","./g/wordsolo.3ea13955d3.js","./g/wordwheel.a976006518.js","./g/chesspuzzles.d31b8ac2c5.js","./g/mission.a5eda1d995.js","./g/laser.e4724138d0.js","./g/whoami.9555a83cf9.js","./g/guessnum.b9a009b40f.js","./g/tourney.31658de9bc.js","./g/charades.07b7b08cba.js","./g/describe.721c142d5e.js","./g/wordle.8db7698456.js","./g/newgames.7e25f43752.js","./g/screwcalc.7eaf216a16.js","./g/monkey.eaf6061ae7.js","./g/spy.ae146bf9c9.js","./g/codenames.6ad8d8d64d.js","./g/draw.ddd4ab034a.js","./g/trivia.71f1e4cdb2.js","./g/triviaboard.bc00a5f9de.js","./g/quizmaker.73344bc403.js","./g/chameleon.3a2161470b.js","./g/timesup.7a16ca47f7.js","./g/memory.29fa9fd838.js","./g/flags.b4cd169cf7.js","./g/headsup.58c7b23cb4.js","./g/cardscore.33b573c2eb.js","./g/chooser.724de1942d.js","./g/smallrooms.20235a711b.js","./g/reaction.9bb291738c.js","./g/bumper.9b2ac9ce0d.js","./g/quiz.d6e6241db9.js","./g/box.1febed423b.js","./g/exact.6c54919444.js","./g/hum.d9ee1d46d5.js","./g/program.572224eddb.js","./g/flagsmap.8d38b548e8.js","./g/crew.3759e6c5e5.js","./g/roomshared.252fb3dcd0.js","./g/w-chameleon.dcfcad76b9.js","./g/spyfall.8eb668e3fc.js","./g/bomb.d4c9d4347f.js","./g/w-riddles.d4f3626a96.js","./g/w-monkey.fc00730343.js","./g/stop.2a2b2541dc.js","./g/streak.7ae1c84b24.js","./g/screw.f9d0472b6a.js","./g/uno.e4278f812d.js","./g/domino.7a25ecf61b.js","./g/duels.f479b7967e.js","./g/dots.35954ae3b3.js","./g/battleship.cf7b6ea26b.js","./g/chess.24341912bc.js","./g/chessrooms.8d51f972c8.js","./g/ludo.f09e971d41.js","./g/snakes.67a60a3918.js","./g/bank.e75b94114e.js","./g/guesswho.5f95f5f1af.js","./g/witness.3d8effc3f1.js","./g/dark.3878edc0a4.js","./g/hangman.088f6dbc6d.js","./g/minigolf.3d809c203d.js","./g/cardslib.520701bb41.js","./g/cards.97f35a7042.js","./g/wire.b51515b5c3.js","./g/vault.8ca5230ed4.js","./g/hear.6af9fd8964.js","./g/bowling.e0aee16d11.js","./g/xo.c40038f1f2.js","./g/w-wordle.52f91f8c5d.js","./g/w-countries.b3013a5a9e.js","./g/solve.74ef572979.js","./g/connections.d158e5ac7b.js","./g/grids.165a9ec0ce.js","./g/wordsolo.e8b2ce6aea.js","./g/wordwheel.3f6890190a.js","./g/chesspuzzles.e1407a6907.js","./g/mission.0baf26222b.js","./g/laser.9be20fdc71.js","./g/whoami.5bbe6b8725.js","./g/guessnum.61cfca2ddc.js","./g/tourney.7e63f49d54.js","./g/charades.8216d36db6.js","./g/describe.d27a76be40.js","./g/wordle.29ebc6cea6.js","./g/newgames.f3faca7e7f.js","./g/screwcalc.f384459ef0.js","./g/monkey.49951beb7b.js","./g/spy.29b2dc5014.js","./g/codenames.3403355cbd.js","./g/draw.fc6409cd42.js","./g/trivia.0b03c3eac6.js","./g/triviaboard.8442766b62.js","./g/quizmaker.5f99317e84.js","./g/chameleon.6bf254544f.js","./g/timesup.461fc82421.js","./g/memory.f1ce142925.js","./g/flags.bcb764a88e.js","./g/headsup.ca0eb73af4.js","./g/cardscore.5369d71fad.js","./g/chooser.1503518a9e.js","./g/smallrooms.dc5cd63bd4.js","./g/reaction.e01b07949d.js","./g/bumper.b875210116.js","./g/quiz.0aac22d96b.js","./g/box.238fa76dac.js","./g/exact.663c680e46.js","./g/hum.ed910097ff.js","./g/program.7a86c307b3.js","./g/flagsmap.f9073d9f0c.js","./g/crew.0de2ae7368.js"]);
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
