const CACHE = 'ashry-20260922120535';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icon-180.png', './icon-192.png', './icon-512.png', './favicon-64.png'];
const PINNED = ['cdn.jsdelivr.net', 'fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

const NET_WAIT_MS = 3000;
const keep = (req, res) => {
  if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
  return res;
};

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  if (PINNED.indexOf(url.hostname) !== -1) {
    event.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((res) => keep(req, res))));
    return;
  }
  if (url.origin !== self.location.origin) return;

  const cached = () => caches.match(req).then((hit) => hit || caches.match('./index.html'));
  const net = fetch(req).then((res) => keep(req, res));
  if (req.mode !== 'navigate') { event.respondWith(net.catch(cached)); return; }
  // Opening the app: the network if it answers soon, else the saved copy; the
  // network answer still refreshes the cache for next time.
  event.respondWith(new Promise((resolve) => {
    let done = false;
    const give = (res) => { if (!done && res) { done = true; resolve(res); } };
    const timer = setTimeout(() => cached().then((hit) => { if (hit) give(hit); }), NET_WAIT_MS);
    net.then((res) => { clearTimeout(timer); give(res); })
       .catch(() => { clearTimeout(timer); cached().then((hit) => give(hit || Response.error())); });
  }));
});
