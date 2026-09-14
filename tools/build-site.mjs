/**
 * Builds the app as a static site in docs/, ready for GitHub Pages or any
 * static host.
 *
 * Same assembly as the preview - include() calls inlined, template values
 * filled in - with two differences. There are no server files and no fake
 * server: room calls are relayed through a hidden iframe of the Apps Script
 * deployment named in site.config.json (its ?bridge=1 page, Bridge.html). And
 * the page is the top-level document, so it carries its own manifest, icons and
 * service worker instead of needing the old iframe wrapper.
 *
 *   npm run build:site
 *   APP_URL=https://script.google.com/macros/s/<id>/exec npm run build:site
 */
import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = fileURLToPath(new URL('./', import.meta.url));
const root = path.join(here, '..');
const out = path.join(root, 'docs');
const read = (name) => readFile(path.join(root, `${name}.html`), 'utf8');

const config = JSON.parse(await readFile(path.join(here, 'site.config.json'), 'utf8'));
const appUrl = process.env.APP_URL || config.appUrl;
if (!/^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(appUrl || '')) {
  throw new Error('site.config.json: appUrl must be an Apps Script /exec URL');
}

// The spy words are code now (SpyWords.js), shared with the room server.
const spySource = await readFile(path.join(root, 'SpyWords.js'), 'utf8');
const SPY_WORDS = new Function(spySource + '\nreturn SPY_WORDS;')();

// JSON inside a <script>: "</script>" in a word would end the tag early.
const scriptJson = (value) => JSON.stringify(value).replace(/</g, '\\u003c');

let html = await read('Controller');
for (const [tag, name] of [...html.matchAll(/<\?!=\s*include\('([^']+)'\);?\s*\?>/g)]) {
  html = html.replace(tag, await read(name));
}

const HEAD = `<title>عشرى جيمينج 🎮</title>
    <link rel="manifest" href="manifest.webmanifest">
    <link rel="apple-touch-icon" href="icon-180.png">
    <link rel="apple-touch-icon" sizes="180x180" href="icon-180.png">
    <link rel="icon" type="image/png" sizes="192x192" href="icon-192.png">
    <link rel="icon" type="image/png" sizes="64x64" href="favicon-64.png">
    <meta name="application-name" content="عشرى جيمينج">`;

// Apps Script's version explains why it cannot set a home-screen icon. This
// page is the top-level document, so it simply sets one.
const iconNote = /<!-- The home-screen icon cannot be set from here\.[\s\S]*?-->/;
if (!iconNote.test(html)) throw new Error('Controller.html: icon comment not found');
html = html.replace(iconNote, HEAD);

// The page can read its own address here, unlike inside Apps Script's frame.
html = html
  .replace('<?!= initialSpyData ?>', scriptJson(SPY_WORDS))
  .replace('<?!= initialRoom ?>',
    "(function () { var m = /[?&]room=([A-Za-z0-9]{1,8})/.exec(location.search); return m ? m[1].toUpperCase() : ''; })()")
  .replace('<?!= webAppUrl ?>', 'location.origin + location.pathname');

const RUNTIME = `<script>
      /* Static site: there is no Apps Script page around this one. */
      window.STATIC_SITE = true;

      // A join link has done its job once read; leaving ?room= in the address
      // would send a reload straight back to the join screen.
      if (/[?&]room=/.test(location.search)) history.replaceState(null, '', location.pathname + location.hash);

      /*
       * google.script.run, for a page Apps Script doesn't serve.
       *
       * The room code calls it exactly as before. Calls are relayed through a
       * hidden iframe of the deployment's ?bridge=1 page (Bridge.html), which
       * makes the real google.script.run call and posts the answer back.
       *
       * A fetch to a doPost was tried first and dropped. Apps Script answers
       * every POST with a redirect that browsers follow as a GET, and under
       * load that GET came back as the whole app page or a Drive "file not
       * found" instead of the answer. The bridge uses the transport the Apps
       * Script page itself uses, and skips the redirect's extra second.
       */
      (function () {
        var APP_URL = ${JSON.stringify(appUrl)};
        var CALLS = ['createRoom', 'joinRoom', 'pollRoom', 'leaveRoom', 'roomAction'];
        // A poll is cheap and repeats anyway, so a lost one gives up quickly; a move
        // may legitimately wait on the room lock (LOCK_WAIT_MS in Rooms.js).
        var LOAD_TIMEOUT = 25000, POLL_TIMEOUT = 12000, CALL_TIMEOUT = 25000;
        var frame = null, bridge = null, bridgeOrigin = '*', queue = [], pending = {}, nextId = 1, loadTimer = null, lastHeard = 0;

        function settle(id, ok, value) {
          var call = pending[id];
          if (!call) return;
          delete pending[id];
          clearTimeout(call.timer);
          // Off the message handler's stack: a bug in a handler is not a lost connection.
          setTimeout(function () {
            if (ok) { if (call.onOk) call.onOk(value); }
            else if (call.onFail) call.onFail(new Error(value || 'تعذر الاتصال بالخادم'));
          }, 0);
        }

        // Forget the bridge; the next call builds a fresh one. After a timeout the
        // frame may be gone (a phone that slept, a dropped connection).
        function reset() {
          clearTimeout(loadTimer);
          if (frame && frame.parentNode) frame.parentNode.removeChild(frame);
          frame = null;
          bridge = null;
        }

        function open() {
          if (frame) return;
          frame = document.createElement('iframe');
          frame.src = APP_URL + '?bridge=1';
          frame.title = 'rooms';
          frame.setAttribute('aria-hidden', 'true');
          frame.tabIndex = -1;
          frame.style.cssText = 'position:fixed;width:1px;height:1px;left:-9px;top:-9px;border:0;opacity:0;pointer-events:none';
          document.body.appendChild(frame);
          loadTimer = setTimeout(function () {
            if (bridge) return;
            var waiting = queue.splice(0);
            reset();
            waiting.forEach(function (m) { settle(m.id, false, 'تعذر الاتصال بالخادم'); });
          }, LOAD_TIMEOUT);
        }

        // Apps Script wraps the page in frames of its own, so the bridge sits a
        // level or two inside our iframe rather than being it.
        function insideFrame(win) {
          for (var i = 0; win && i < 4; i++) {
            if (frame && win === frame.contentWindow) return true;
            if (win === win.parent) return false;
            win = win.parent;
          }
          return false;
        }

        window.addEventListener('message', function (event) {
          var data = event.data;
          if (!data || typeof data !== 'object') return;
          if (data.type === 'ashry-bridge-ready') {
            if (!insideFrame(event.source)) return;
            bridge = event.source;
            lastHeard = Date.now();
            bridgeOrigin = event.origin && event.origin !== 'null' ? event.origin : '*';
            clearTimeout(loadTimer);
            queue.splice(0).forEach(function (m) { bridge.postMessage(m, bridgeOrigin); });
          } else if (data.type === 'ashry-result' && event.source === bridge) {
            lastHeard = Date.now();
            settle(data.id, data.ok, data.value);
          }
        });

        // A lost answer fails only its own call - the next poll just tries again.
        // The bridge is rebuilt only once it has gone quiet altogether, and then
        // everything still waiting on it fails at once instead of each call
        // sitting out its own timer. While it is still loading, the load timer
        // decides.
        function timedOut(id) {
          if (!bridge) {
            queue = queue.filter(function (m) { return m.id !== id; });
            settle(id, false, 'انتهت مهلة الاتصال');
            return;
          }
          if (Date.now() - lastHeard > POLL_TIMEOUT) {
            reset();
            queue = [];
            Object.keys(pending).forEach(function (other) { settle(Number(other), false, 'انتهت مهلة الاتصال'); });
          } else {
            settle(id, false, 'انتهت مهلة الاتصال');
          }
        }

        function runner() {
          var onOk = null, onFail = null;
          var r = {
            withSuccessHandler: function (fn) { onOk = fn; return r; },
            withFailureHandler: function (fn) { onFail = fn; return r; }
          };
          CALLS.forEach(function (name) {
            r[name] = function () {
              var id = nextId++;
              var message = { type: 'ashry-call', id: id, fn: name, args: Array.prototype.slice.call(arguments) };
              pending[id] = {
                onOk: onOk,
                onFail: onFail,
                timer: setTimeout(function () { timedOut(id); }, name === 'pollRoom' ? POLL_TIMEOUT : CALL_TIMEOUT)
              };
              if (bridge) bridge.postMessage(message, bridgeOrigin);
              else { queue.push(message); open(); }
              return r;
            };
          });
          return r;
        }

        window.google = { script: { get run() { return runner(); }, host: { close: function () {}, setHeight: function () {} } } };
      })();
    </script>
</head>`;
if (html.indexOf('</head>') === -1) throw new Error('Controller.html: no </head>');
html = html.replace('</head>', RUNTIME);

const leftover = html.match(/<\?!?=?[\s\S]{0,40}\?>/);
if (leftover) throw new Error(`unresolved template tag: ${leftover[0]}`);

await mkdir(out, { recursive: true });
await writeFile(path.join(out, 'index.html'), html, 'utf8');

/* Offline copy. Network first, so a new version shows on the next open and the
   cache is only the fallback; the pinned CDN files (fonts, confetti, QR) are
   cache-first, since their URLs never change. Room calls are never cached. */
const buildId = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
const SW = `const CACHE = 'ashry-${buildId}';
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

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  if (PINNED.indexOf(url.hostname) !== -1) {
    event.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((res) => {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put(req, copy));
      return res;
    })));
    return;
  }
  if (url.origin !== self.location.origin) return;

  event.respondWith(fetch(req).then((res) => {
    const copy = res.clone();
    caches.open(CACHE).then((c) => c.put(req, copy));
    return res;
  }).catch(() => caches.match(req).then((hit) => hit || caches.match('./index.html'))));
});
`;
await writeFile(path.join(out, 'sw.js'), SW, 'utf8');
// GitHub Pages runs Jekyll otherwise, which skips files and slows the build.
await writeFile(path.join(out, '.nojekyll'), '', 'utf8');

for (const icon of ['icon-180.png', 'icon-192.png', 'icon-512.png', 'favicon-64.png', 'manifest.webmanifest']) {
  if (!existsSync(path.join(out, icon))) console.warn(`warning: docs/${icon} missing - run npm run build:icons`);
}

console.log(`docs/index.html written (${(html.length / 1024).toFixed(0)} KB), rooms via ${appUrl}?bridge=1`);
console.log(`docs/sw.js written (cache ashry-${buildId})`);
