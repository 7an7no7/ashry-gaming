const CACHE = 'ashry-20261006150720';
const CHUNKS = 'g-chunks';
const CDN = 'cdn-pinned';
const GAME_FILES = ["./g/roomshared.252fb3dcd0.js","./g/w-chameleon.dcfcad76b9.js","./g/spyfall.8eb668e3fc.js","./g/bomb.d4c9d4347f.js","./g/w-riddles.d4f3626a96.js","./g/w-monkey.fc00730343.js","./g/stop.2a2b2541dc.js","./g/streak.7ae1c84b24.js","./g/screw.f9d0472b6a.js","./g/uno.0285ae0c18.js","./g/domino.7a25ecf61b.js","./g/duels.f479b7967e.js","./g/dots.35954ae3b3.js","./g/battleship.cf7b6ea26b.js","./g/chess.01ee5dacc0.js","./g/chessrooms.8d51f972c8.js","./g/ludo.f09e971d41.js","./g/snakes.5f41e63df1.js","./g/bank.e75b94114e.js","./g/guesswho.a2a665aaa8.js","./g/witness.6d11393bdd.js","./g/dark.3878edc0a4.js","./g/hangman.b0300a5258.js","./g/minigolf.3d809c203d.js","./g/cardslib.520701bb41.js","./g/cards.97f35a7042.js","./g/wire.b51515b5c3.js","./g/vault.8ca5230ed4.js","./g/hear.6af9fd8964.js","./g/bowling.e0aee16d11.js","./g/xo.6d82f22610.js","./g/w-wordle.52f91f8c5d.js","./g/w-countries.b3013a5a9e.js","./g/solve.74ef572979.js","./g/connections.d158e5ac7b.js","./g/grids.e0b5fb9aa6.js","./g/wordsolo.0d55342239.js","./g/wordwheel.3f6890190a.js","./g/chesspuzzles.e1407a6907.js","./g/mission.0baf26222b.js","./g/laser.d6a2d5bae6.js","./g/whoami.5bbe6b8725.js","./g/guessnum.61cfca2ddc.js","./g/tourney.7e63f49d54.js","./g/charades.8216d36db6.js","./g/describe.d27a76be40.js","./g/wordle.29ebc6cea6.js","./g/newgames.f3faca7e7f.js","./g/screwcalc.f384459ef0.js","./g/monkey.49951beb7b.js","./g/spy.29b2dc5014.js","./g/codenames.3403355cbd.js","./g/draw.fc6409cd42.js","./g/trivia.0b03c3eac6.js","./g/triviaboard.8442766b62.js","./g/quizmaker.5f99317e84.js","./g/chameleon.6bf254544f.js","./g/timesup.461fc82421.js","./g/memory.f1ce142925.js","./g/flags.d029fc2b1e.js","./g/headsup.ca0eb73af4.js","./g/cardscore.5369d71fad.js","./g/chooser.1503518a9e.js","./g/smallrooms.dc5cd63bd4.js","./g/reaction.e01b07949d.js","./g/bumper.0809eacfda.js","./g/quiz.0aac22d96b.js","./g/box.238fa76dac.js","./g/exact.663c680e46.js","./g/hum.ed910097ff.js","./g/program.7a86c307b3.js","./g/flagsmap.f9073d9f0c.js","./g/crew.0de2ae7368.js","./g/sf19-lite.js","./g/sf19-lite.wasm"];
const KEEP_FILES = GAME_FILES.concat(["./g/stop.63ad81e6cf.js","./g/duels.5e00ba7d7c.js","./g/chessrooms.a9468610f1.js","./g/ludo.062ded1b6e.js","./g/snakes.d03705d6c8.js","./g/bank.76e0a8d137.js","./g/connections.90315b454f.js","./g/codenames.d49b1e33ec.js","./g/trivia.3f27453030.js","./g/smallrooms.f3340c631e.js"]);
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
