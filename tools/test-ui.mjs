/**
 * The app on screen, in headless Chrome: what the rules tests and the robots can't see.
 *
 *   npm run test:ui                      (the rooms server running: npm run dev in rooms-worker/)
 *   node test-ui.mjs http://127.0.0.1:8797          another rooms server
 *   ONLY=screens,rooms,fixes,program,mission,site node test-ui.mjs  some parts only
 *   CHROME=/path/to/chrome                          where Chrome is, if not in the usual place
 *
 * It builds its own copy of the app (the preview, and the published site for the offline copy)
 * into a temporary folder - .preview/ and docs/ are left alone - serves it, and checks:
 *
 *   screens  every screen on one phone, at 375x812, 667x375 and 1280x720, Arabic light and
 *            English dark: nothing wider than the screen, no control off it, no text cut off,
 *            no error in the console; and every game started from its setup
 *   rooms    every room game started with five phones (each its own browser profile, so its own
 *            storage) and a big screen: the same checks on every phone and the TV
 *            and the two lobbies the chunks' order broke: the duels' winner stays / tournament
 *            switch (sent, and a tournament drawn), and فوازير إيموجي's three ways
 *   fixes    what the audit of 23 Sep 2026 fixed on the page (and «الشلة»'s page with a night on it): a word being typed in a room survives
 *            the others' moves, a room link fills its code, a chess clock is right after a reload,
 *            Battleship tells no result before the shell lands, Guess Who's face pick has a clock
 *   program  برنامج السهرة: the builder, the table between two games, a reload there, the finale,
 *            on five phones and a TV
 *   mission  المهمة السرية: the host's switch and setup, the file held open on every phone, the
 *            target's memo over a game, the TV's board, ticker and strings, a reload, the reveal
 *   site     the offline copy: the app opens from the phone, and a new build is switched to by
 *            itself on the home screen, never in a game; Settings says which version this is
 *
 * Every check prints ✓ or ✗; the exit code is 1 when any failed, 0 when all pass (a count
 * would wrap: 256 ✗ exit 0 on a POSIX shell).
 */
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here = fileURLToPath(new URL('./', import.meta.url));
const root = path.join(here, '..');
const ROOMS = (process.argv.slice(2).find((a) => /^https?:/.test(a)) || process.env.ROOMS_URL || 'http://127.0.0.1:8787').replace(/\/$/, '');
const ONLY = (process.env.ONLY || 'screens,rooms,fixes,program,mission,site').split(',');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'ashry-ui-'));
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
// Side by side (tools/test-ui-parallel.mjs): which screen sizes this process sweeps, and which
// share of the room games it plays (i/k: every k-th game from the i-th). UI_GAMES=uno,domino plays
// just those room games. UI_PREVIEW / UI_SITE: copies already built, so a shard doesn't build again.
const SIZES = process.env.UI_SIZES ? process.env.UI_SIZES.split(',') : null;
const ROOMS_SHARD = (process.env.UI_ROOMS_SHARD || '0/1').split('/').map(Number);
const ONLY_GAMES = process.env.UI_GAMES ? process.env.UI_GAMES.split(',') : null;

let failed = 0, passed = 0;
const check = (ok, label, detail) => {
  if (ok) passed++; else failed++;
  console.log((ok ? '  ✓ ' : '  ✗ ') + label + (!ok && detail ? '\n      ' + String(detail).slice(0, 600) : ''));
};

/* --- the rooms server has to be there ---------------------------------------------- */
try {
  const res = await fetch(ROOMS + '/health');
  if (!res.ok) throw new Error(res.status);
} catch (e) {
  console.error(`No rooms server at ${ROOMS} (${e.message}). Start one: cd rooms-worker && npm run dev`);
  process.exit(1);
}

/* --- build our own copies --------------------------------------------------------------- */
const build = (script, env) => {
  const r = spawnSync(process.execPath, [path.join(here, script)], { env: Object.assign({}, process.env, env), encoding: 'utf8' });
  if (r.status !== 0) { console.error(r.stdout, r.stderr); process.exit(1); }
};
const PREVIEW = process.env.UI_PREVIEW || path.join(TMP, 'preview');
const SITE = path.join(TMP, 'site');
if (process.env.UI_SITE) {
  // The site part rewrites its copy (a newer stamp), so each process gets one of its own.
  fs.cpSync(process.env.UI_SITE, SITE, { recursive: true });
} else {
  build('build-preview.mjs', { ROOMS_URL: ROOMS, PREVIEW_OUT: PREVIEW });
  fs.mkdirSync(SITE, { recursive: true });
  for (const f of ['icon-180.png', 'icon-192.png', 'icon-512.png', 'favicon-64.png', 'manifest.webmanifest']) {
    if (fs.existsSync(path.join(root, 'docs', f))) fs.copyFileSync(path.join(root, 'docs', f), path.join(SITE, f));
  }
  build('build-site.mjs', { ROOMS_URL: ROOMS, SITE_OUT: SITE });
}

/* --- a static server for both ------------------------------------------------------------ */
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.png': 'image/png', '.webmanifest': 'application/manifest+json', '.json': 'application/json' };
const server = http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);
  const [, top, ...rest] = url.split('/');
  const dir = top === 'site' ? SITE : top === 'preview' ? PREVIEW : null;
  // Like Cloudflare, the site answers its index.html with a redirect to the folder: an offline
  // copy that keeps such an answer can't open a page from it (23 Sep 2026, ERR_FAILED).
  if (top === 'site' && rest.join('/') === 'index.html') { res.writeHead(307, { location: '/site/' }); res.end(); return; }
  let f = dir ? path.join(dir, rest.join('/') || 'index.html') : null;
  if (!f || !f.startsWith(dir)) { res.writeHead(404); res.end(); return; }
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(dir, 'index.html');
  res.writeHead(200, { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream', 'cache-control': 'no-cache' });
  fs.createReadStream(f).pipe(res);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const BASE = `http://127.0.0.1:${server.address().port}`;

/* --- Chrome over the DevTools protocol --------------------------------------------------- */
const chromePath = process.env.CHROME || [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'
].find((p) => fs.existsSync(p));
if (!chromePath) { console.error('Chrome not found: set CHROME=/path/to/chrome'); process.exit(1); }
const profile = path.join(TMP, 'chrome');
const chrome = spawn(chromePath, ['--headless=new', '--remote-debugging-port=0', '--no-first-run', '--no-default-browser-check',
  '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--user-data-dir=' + profile, 'about:blank'], { stdio: 'ignore' });
let wsUrl = null;
for (let i = 0; i < 100 && !wsUrl; i++) {
  await wait(100);
  try { const [port, p] = fs.readFileSync(path.join(profile, 'DevToolsActivePort'), 'utf8').split('\n'); wsUrl = `ws://127.0.0.1:${port}${p}`; } catch (e) {}
}
if (!wsUrl) { console.error('Chrome did not start'); process.exit(1); }
const ws = new WebSocket(wsUrl);
await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
let msgId = 0;
const pending = new Map();
const sessions = new Map();
ws.onmessage = (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); return; }
  const phone = m.sessionId && sessions.get(m.sessionId);
  if (!phone) return;
  const skip = (text) => /fonts\.g(oogleapis|static)\.com|cdn\.jsdelivr\.net|favicon|ERR_INTERNET_DISCONNECTED/.test(text || '');
  if (m.method === 'Runtime.exceptionThrown') {
    const d = m.params.exceptionDetails;
    phone.errors.push('exception: ' + ((d.exception && d.exception.description) || d.text || '').split('\n')[0]);
  } else if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') {
    const text = m.params.args.map((a) => a.value !== undefined ? String(a.value) : (a.description || '')).join(' ');
    if (!skip(text)) phone.errors.push('console.error: ' + text.slice(0, 200));
  } else if (m.method === 'Log.entryAdded' && m.params.entry.level === 'error') {
    const text = (m.params.entry.text || '') + ' ' + (m.params.entry.url || '');
    // A rooms server answering 4xx to a refused move is the app working; only a 5xx is news.
    // The play counter's beacon (/count) is sent as a screen is left; under load the local
    // `wrangler dev` proxy now and then drops one ("Network connection lost") and answers 500.
    // It is a count, not the app: the server's own tests check /count.
    const droppedBeacon = /status of 5\d\d .*\/count$/.test(text.trim());
    if (!skip(text) && !/status of 4\d\d/.test(text) && !droppedBeacon) phone.errors.push('log: ' + text.slice(0, 200));
  }
};
const send = (method, params = {}, sessionId) => new Promise((resolve, reject) => {
  const id = ++msgId;
  pending.set(id, (m) => (m.error ? reject(new Error(method + ': ' + m.error.message)) : resolve(m.result)));
  ws.send(JSON.stringify({ id, method, params, sessionId }));
});

/** A phone (or a TV): its own browser profile, so its own storage and its own room session. */
async function newPhone(name, { w = 375, h = 812, mobile = w < 768 } = {}) {
  const { browserContextId } = await send('Target.createBrowserContext', { disposeOnDetach: true });
  const { targetId } = await send('Target.createTarget', { url: 'about:blank', browserContextId });
  const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
  const phone = { name, sessionId, targetId, browserContextId, errors: [] };
  sessions.set(sessionId, phone);
  await send('Runtime.enable', {}, sessionId);
  await send('Page.enable', {}, sessionId);
  await send('Log.enable', {}, sessionId);
  await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile }, sessionId);
  return phone;
}
async function closePhone(phone) {
  try { await send('Target.closeTarget', { targetId: phone.targetId }); } catch (e) {}
  try { await send('Target.disposeBrowserContext', { browserContextId: phone.browserContextId }); } catch (e) {}
  sessions.delete(phone.sessionId);
}
async function resize(phone, w, h) {
  await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: w < 768 }, phone.sessionId);
  await ev(phone, `window.dispatchEvent(new Event('resize')); 1`);
}
/** Runs `expr` in the page (awaited); a page that navigates meanwhile gives undefined. */
async function ev(phone, expr, retried) {
  try {
    const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true }, phone.sessionId);
    if (r.exceptionDetails) throw new Error((r.exceptionDetails.exception && r.exceptionDetails.exception.description) || r.exceptionDetails.text);
    return r.result && r.result.value;
  } catch (e) {
    if (/context was destroyed|Cannot find context|Inspected target navigated/.test(e.message)) return undefined;
    // Caught between two documents (a screen that reloads the page): the app's names aren't there
    // yet. Seen on a busy PC with several shards at once; wait for the app and ask once more.
    if (!retried && /(appState|Room|setView) is not defined/.test(e.message)) {
      if (await appUp(phone, 60000)) return ev(phone, expr, true);
      const href = await send('Runtime.evaluate', { expression: 'location.href + " " + document.readyState', returnByValue: true }, phone.sessionId).catch(() => null);
      throw new Error(e.message + ' (the page: ' + (href && href.result ? href.result.value : '?') + ')');
    }
    throw e;
  }
}
/** A screen whose game's code is still on its way (JS_Lazy.html) is drawn once it has come. */
async function chunkIn(phone, ms = 5000) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    const busy = await ev(phone, `typeof lz !== 'undefined' && lz.busy > 0`).catch(() => false);
    if (!busy) return;
    await wait(40);
  }
}
/** Loads a page and waits for the app to be up (the intro gone). */
async function open(phone, url) {
  await send('Page.navigate', { url }, phone.sessionId);
  return appUp(phone);
}
async function appUp(phone, ms = 20000) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    await wait(200);
    const ok = await ev(phone, `(() => { if (typeof appState === 'undefined' || document.readyState !== 'complete') return false; const l = document.getElementById('app-loader'); return !l || l.style.display === 'none' || l.classList.contains('hidden'); })()`).catch(() => false);
    if (ok) {
      // Still, no transitions: a sweep reads final values (GEMINI.md, Sweeping the UI).
      await ev(phone, `(() => { if (!document.getElementById('__ui_still')) { const s = document.createElement('style'); s.id = '__ui_still'; s.textContent = '*{transition:none!important;animation:none!important}'; document.head.appendChild(s); } return 1; })()`);
      return true;
    }
  }
  return false;
}
const takeErrors = (phone) => { const e = phone.errors.slice(); phone.errors.length = 0; return e; };

/* --- the layout check, run inside the page ------------------------------------------------ */
const SWEEP = `window.__uiCheck = function (root) {
  const W = window.innerWidth, issues = [];
  if (document.documentElement.scrollWidth > W + 1) issues.push('the page scrolls sideways (' + document.documentElement.scrollWidth + 'px)');
  const main = document.getElementById('shell-main');
  if (main && main.scrollWidth > main.clientWidth + 1 && getComputedStyle(main).overflowX !== 'visible') issues.push('the main area scrolls sideways');
  // Text that is only emoji or symbols carries its own size (GEMINI.md, Sweeping the UI).
  const onlySymbols = (s) => !/[\\p{L}\\p{N}]/u.test(s);
  (root || document).querySelectorAll('button, a[href], input:not([type=hidden]), select, textarea, [onclick], [role=button]').forEach(el => {
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height || el.closest('.hidden,[hidden]')) return;
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none' || cs.opacity === '0') return;
    // Inside a row that scrolls sideways, or a board drawn to scale, a control may sit past the edge.
    if (el.closest('[class*="scroll"], .hscroll-fade, [style*="overflow"]') && (r.right > W || r.left < 0)) return;
    const label = (el.getAttribute('aria-label') || el.textContent || el.id || el.className || '').trim().replace(/\\s+/g, ' ').slice(0, 28);
    if (r.right > W + 1 || r.left < -1) issues.push('off the screen: "' + label + '"');
  });
  (root || document).querySelectorAll('h1, h2, h3, button, label, .btn, .badge, .chip').forEach(el => {
    if (!el.offsetWidth || el.closest('.hidden,[hidden]')) return;
    const cs = getComputedStyle(el);
    const clips = cs.overflow === 'hidden' || cs.overflowX === 'hidden' || cs.textOverflow === 'ellipsis' || cs.whiteSpace === 'nowrap';
    const text = el.textContent.trim().replace(/\\s+/g, ' ');
    if (clips && el.scrollWidth > el.clientWidth + 2 && !onlySymbols(text)) issues.push('text cut off: "' + text.slice(0, 30) + '"');
  });
  return [...new Set(issues)].slice(0, 6);
}; 1`;
const sweep = async (phone) => {
  await ev(phone, SWEEP);
  return ev(phone, `__uiCheck(document.getElementById('view-' + appState.currentView) || document.body)`);
};
const setLook = (phone, lang, dark) => ev(phone, `(() => {
  if (appState.lang !== '${lang}') toggleLanguage();
  if (document.body.classList.contains('dark') !== ${dark}) toggleDarkMode();
  window.dispatchEvent(new Event('resize')); return 1; })()`);

/* ========================================================================================== */

if (ONLY.includes('screens')) {
  console.log('• every screen on one phone (3 sizes; Arabic light, English dark)');
  const phone = await newPhone('phone');
  const sizes = [[375, 812], [667, 375], [1280, 720]].filter(([w, h]) => !SIZES || SIZES.includes(w + 'x' + h));
  const looks = [['ar', false], ['en', true]];
  for (const [w, h] of sizes) {
    await resize(phone, w, h);
    check(await open(phone, BASE + '/preview/'), `the app opens at ${w}x${h}`);
    takeErrors(phone);
    if (w === 375) {
      // The check itself: a button pushed off the screen and a label cut off have to be caught.
      await ev(phone, SWEEP);
      const caught = await ev(phone, `(() => {
        setView('menu');
        const v = document.getElementById('view-menu');
        const a = document.createElement('button'); a.textContent = 'off the edge'; a.style.cssText = 'position:relative;left:2000px';
        const b = document.createElement('button'); b.textContent = 'a label far too long to fit in its box'; b.style.cssText = 'width:40px;overflow:hidden;white-space:nowrap';
        v.append(a, b);
        const found = __uiCheck(v);
        a.remove(); b.remove();
        return found; })()`);
      check(caught && caught.some((x) => /off the screen/.test(x)) && caught.some((x) => /cut off/.test(x)), 'the layout check catches a control off the screen and a label cut off', JSON.stringify(caught));
    }
    const views = await ev(phone, `[...document.querySelectorAll('[id^="view-"]')].map(v => v.id.slice(5)).filter(id => id.indexOf('room-') !== 0)`);
    for (const [lang, dark] of looks) {
      await setLook(phone, lang, dark);
      const bad = [];
      for (const id of views) {
        await ev(phone, `setView(${JSON.stringify(id)}); closeAllModals(); 1`);
        await wait(40);
        await chunkIn(phone);
        const found = await sweep(phone);
        if (found && found.length) bad.push(id + ': ' + found.join('; '));
      }
      check(!bad.length, `${views.length} screens at ${w}x${h}, ${lang} ${dark ? 'dark' : 'light'}: laid out within the screen`, bad.join('\n      '));
      const errs = takeErrors(phone);
      check(!errs.length, `${w}x${h}, ${lang}: no errors opening every screen`, [...new Set(errs)].join('\n      '));
      // «اعمل مسابقتك»: the editor with a question open, the list, the sheet with the code and
      // its three ways, and a reload in the middle of a question coming back to it.
      await ev(phone, `(() => { localStorage.removeItem('ashryPacks_v1'); setView('setup-quizmaker'); return 1; })()`);
      await chunkIn(phone);
      await ev(phone, `(() => { qmNewQuiz(); const q = packQuizById(qmEdit.id); q.title = 'مسابقة العيد'; q.questions = [
        { q: 'مين أول واحد في العيلة اتجوز؟', e: '💍', c: ['خالو حسن', 'عمو مجدي', 'طنط نادية', 'بابا'], a: 1 },
        { q: 'آخر مصيف روحناه سوا كان فين؟ سؤال طويل شوية عشان نشوف السطر وهو بيتقص في القايمة', e: '', c: ['رأس البر', 'مرسى مطروح', 'الغردقة', 'بلطيم'], a: 0 },
        { q: 'Which year did we move?', e: '🏠', c: ['2010', '2012', '2015', ''], a: -1 }];
        packQuizPut(q); qmOpenQ(1); return 1; })()`);
      await wait(120);
      const qmBad = await sweep(phone);
      check(!(qmBad && qmBad.length), `${w}x${h}, ${lang}: the quiz editor with a question open is laid out within the screen`, (qmBad || []).join('; '));
      await open(phone, BASE + '/preview/');
      await chunkIn(phone);
      const back = await ev(phone, `JSON.stringify({ v: appState.currentView, open: qmEdit.open, q: (document.getElementById('qm-q-in') || {}).value || '' })`);
      check(/"v":"play-quizmaker","open":1/.test(back || '') && /آخر مصيف/.test(back || ''), `${w}x${h}, ${lang}: a reload mid-question comes back to the question, open`, back);
      await ev(phone, `(() => { const q = packQuizById(qmEdit.id); q.code = 'QZ7K2A'; packQuizPut(q); qmOpenSheet(q); return 1; })()`);
      await wait(150);
      await ev(phone, SWEEP);
      const sheetBad = await ev(phone, `__uiCheck(document.getElementById('qm-save-modal'))`);
      check(!(sheetBad && sheetBad.length), `${w}x${h}, ${lang}: the sheet with the code and the three ways fits`, (sheetBad || []).join('; '));
      await ev(phone, `(() => { closeAllModals(); localStorage.removeItem('ashryPacks_v1'); localStorage.removeItem('ashryQuizEdit_v1'); setView('menu'); return 1; })()`);
      const qmErrs = takeErrors(phone);
      check(!qmErrs.length, `${w}x${h}, ${lang}: no errors in the quiz editor`, [...new Set(qmErrs)].join('\n      '));
    }
    // Every game started the way a player starts it: its setup screen's Start.
    if (w !== 667) {
      const setups = await ev(phone, `[...document.querySelectorAll('[id^="view-setup-"]')].map(v => v.id.slice(5))`);
      const bad = [], landed = [];
      await setLook(phone, 'ar', false);
      for (const id of setups) {
        await ev(phone, `setView(${JSON.stringify(id)}); closeAllModals(); 1`);
        await wait(150);
        await chunkIn(phone);
        const started = await ev(phone, `(() => {
          const v = document.getElementById('view-${id}');
          const btn = v && [...v.querySelectorAll('.view-actions--start button, .view-actions button')].find(b => b.offsetWidth && !b.closest('.mode-online-panel'));
          if (!btn) return '';
          btn.click(); return 'clicked'; })()`);
        if (!started) continue;
        await wait(1200);
        const view = await ev(phone, `appState.currentView`);
        landed.push(view);
        if (view && view.indexOf('room-') === 0) { await ev(phone, `(async () => { try { if (Room.state) await Room.leave(); } catch (e) {} return 1; })()`); continue; }
        const found = await sweep(phone);
        if (found && found.length) bad.push(id + ' → ' + view + ': ' + found.join('; '));
        await ev(phone, `closeAllModals(); setView('menu'); 1`);
      }
      check(landed.length > 20 && !bad.length, `${landed.length} games started from their setup at ${w}x${h}: laid out within the screen`, bad.join('\n      '));
      const errs = takeErrors(phone);
      check(!errs.length, `${w}x${h}: no errors starting every game`, [...new Set(errs)].join('\n      '));
    }
  }
  await closePhone(phone);
}

/* --- a room of five phones and a TV ------------------------------------------------------- */
async function roomOfFive() {
  const shapes = [['host', 375, 812, 'ar', false], ['p2', 375, 812, 'en', true], ['p3', 667, 375, 'ar', false], ['p4', 390, 844, 'ar', true], ['p5', 1280, 720, 'en', false]];
  const phones = [];
  for (const [name, w, h, lang, dark] of shapes) {
    const p = await newPhone(name, { w, h });
    await open(p, BASE + '/preview/');
    await setLook(p, lang, dark);
    phones.push(p);
  }
  const tv = await newPhone('tv', { w: 1280, h: 720, mobile: false });
  await open(tv, BASE + '/preview/');
  const code = await ev(phones[0], `(async () => { await Room.create('منى'); return Room.state.code; })()`);
  const names = ['هاني', 'Sara', 'كريم', 'Omar'];
  for (let i = 1; i < phones.length; i++) await ev(phones[i], `(async () => { await Room.join(${JSON.stringify(code)}, ${JSON.stringify(names[i - 1])}); return Room.me; })()`);
  await ev(tv, `(async () => { await Room.join(${JSON.stringify(code)}, 'TV', true); return 1; })()`);
  await wait(800);
  return { phones, tv, code, all: phones.concat([tv]) };
}
const showRoom = (p) => ev(p, `(() => { if (Room.state && appState.currentView.indexOf('room-') !== 0) roomReturnToActive(); return appState.currentView; })()`);

if (ONLY.includes('rooms')) {
  console.log('• every room game on five phones and a TV');
  const { phones, tv, all } = await roomOfFive();
  const host = phones[0];
  all.forEach(takeErrors);
  const games = (await ev(host, `ROOM_HUB_GAMES.map(g => g.id)`))
    .filter((g, i) => i % ROOMS_SHARD[1] === ROOMS_SHARD[0] && (!ONLY_GAMES || ONLY_GAMES.includes(g)));
  // What a host does in the lobby before some games: sides and spymasters, or a phone turned
  // into a screen for a game of 2 to 4.
  const PREP = {
    codenames: async () => {
      for (let i = 0; i < phones.length; i++) {
        const team = i % 2 ? 'blue' : 'red', role = i < 2 ? 'spymaster' : 'operative';
        await ev(phones[i], `(async () => { try { await Room.act('setTeam', { team: '${team}', role: '${role}' }); } catch (e) {} return 1; })()`);
      }
    },
    domino: () => ev(phones[4], `(async () => { try { await Room.act('becomeScreen', {}); } catch (e) {} return 1; })()`)
  };
  const AFTER = { domino: () => ev(phones[4], `(async () => { try { await Room.act('becomePlayer', {}); } catch (e) {} return 1; })()`) };
  for (const game of games) {
    const chose = await ev(host, `(async () => { try { await Room.act('chooseGame', { game: ${JSON.stringify(game)} }); return 'ok'; } catch (e) { return 'choose: ' + e.message; } })()`);
    if (PREP[game]) await PREP[game]();
    // The lobby on the host's phone: some games read the host's choices from it.
    await showRoom(host);
    await wait(600);
    const started = chose !== 'ok' ? chose : await ev(host, `(async () => {
      const g = ROOM_GAMES[${JSON.stringify(game)}];
      try { await Room.act('start', g && g.startPayload ? g.startPayload() : {}); } catch (e) { return 'start: ' + e.message; }
      return 'ok'; })()`);
    await wait(1800);
    const bad = [];
    for (const p of all) {
      const view = await showRoom(p);
      await wait(250);
      const found = await sweep(p);
      if (found && found.length) bad.push(p.name + ' (' + view + '): ' + found.join('; '));
    }
    const errs = all.flatMap((p) => takeErrors(p).map((e) => p.name + ': ' + e));
    check(started === 'ok' && !bad.length && !errs.length, `${game}: dealt, and every phone and the TV laid out without errors`,
      [started !== 'ok' ? started : '', ...bad, ...new Set(errs)].filter(Boolean).join('\n      '));
    await ev(host, `(async () => { try { await Room.act('backToHub', {}); } catch (e) {} return 1; })()`);
    if (AFTER[game]) await AFTER[game]();
    await wait(400);
  }
  // Two lobbies the chunks' load order broke on 30 Sep 2026 (tools/lazy-split.mjs checks the
  // order now): the duels' tournament wraps each duel's renderers, and فوازير إيموجي's router
  // holds its three ways. Played once, by the first shard (or when UI_GAMES names the game).
  const wants = (g) => (ONLY_GAMES ? ONLY_GAMES.includes(g) : ROOMS_SHARD[0] === 0);
  const toHub = () => ev(host, `(async () => { try { await Room.act('backToHub', {}); } catch (e) {} return 1; })()`);
  const choose = async (g) => {
    const r = await ev(host, `(async () => { try { await Room.act('chooseGame', { game: ${JSON.stringify(g)} }); return 'ok'; } catch (e) { return 'choose: ' + e.message; } })()`);
    await showRoom(host);
    await wait(800);
    await chunkIn(host);
    for (const p of all) await chunkIn(p);
    return r;
  };
  // Every phone and the TV: on a room screen, laid out, no errors; `extra` is asked on each.
  const lookAll = async (extra) => {
    const bad = [];
    for (const p of all) {
      const view = await showRoom(p);
      await wait(250);
      const found = await sweep(p);
      if (found && found.length) bad.push(p.name + ' (' + view + '): ' + found.join('; '));
      if (!/^room-/.test(view || '') || view === 'room-lobby') bad.push(p.name + ': on ' + view);
      const why = extra ? await ev(p, extra) : '';
      if (why) bad.push(p.name + ': ' + why);
    }
    const errs = all.flatMap((p) => takeErrors(p).map((e) => p.name + ': ' + e));
    return [...bad, ...new Set(errs)];
  };

  for (const g of ['dots', 'xo', 'guesswho', 'battleship', 'chess'].filter(wants)) {
    all.forEach(takeErrors);
    const chose = await choose(g);
    // The host's lobby carries the switch (five people, no computer players), and its payload the choice.
    const lobby = await ev(host, `(() => {
      const g = ROOM_GAMES[${JSON.stringify(g)}];
      if (!g) return 'no ROOM_GAMES.${g}';
      if (!g._tourWrapped) return 'not wrapped by the tournament';
      if (!document.querySelector('#view-room-lobby .tour-lobby')) return 'no winner-stays / tournament switch in the lobby';
      setTourMode(${JSON.stringify(g)}, 'stay');
      if (g.startPayload().tournament) return 'winner stays still sends tournament';
      setTourMode(${JSON.stringify(g)}, 'tour');
      if (g.startPayload().tournament !== true) return 'the tournament choice is not in the start payload';
      return 'ok'; })()`);
    let detail = [chose !== 'ok' ? chose : '', lobby !== 'ok' ? lobby : ''].filter(Boolean);
    // Two of them played as a tournament: every phone and the TV draw it.
    if (!detail.length && (g === 'dots' || g === 'xo')) {
      const started = await ev(host, `(async () => { try { await Room.act('start', ROOM_GAMES[${JSON.stringify(g)}].startPayload()); } catch (e) { return 'start: ' + e.message; } return 'ok'; })()`);
      await wait(1800);
      if (started !== 'ok') detail.push(started);
      else detail = detail.concat(await lookAll(`(() => {
        if (!Room.state || !tourOn(Room.state)) return 'no tournament in the room';
        if (!ROOM_GAMES[${JSON.stringify(g)}]._tourWrapped) return 'its renderer is not wrapped';
        if (Room.state.youAreScreen && !TV_GAMES[${JSON.stringify(g)}]) return 'no TV_GAMES entry';
        const v = document.getElementById('view-' + appState.currentView);
        return v && v.textContent.trim() ? '' : 'an empty screen'; })()`));
    }
    await ev(host, `(() => { setTourMode(${JSON.stringify(g)}, 'stay'); return 1; })()`);
    check(!detail.length, `${g}: the host's lobby offers winner stays or a tournament, and it is sent${g === 'dots' || g === 'xo' ? ' and drawn on every phone and the TV' : ''}`, detail.join('\n      '));
    await toHub();
    await wait(400);
  }

  // كونكت ٤ team against team (2 Oct 2026): the switch, the sides on every phone, the relay on every screen.
  if (wants('connect4')) {
    all.forEach(takeErrors);
    const chose = await choose('connect4');
    const lobby = await ev(host, `(async () => {
      if (!document.querySelector('#view-room-lobby #c4t-switch')) return 'no «فرق» switch in the host\\'s lobby';
      await Room.act('teams', { on: true });
      return 'ok'; })()`);
    for (let i = 0; i < phones.length; i++) await ev(phones[i], `(async () => { try { await Room.act('side', { side: ${i % 2} }); } catch (e) {} return 1; })()`);
    await wait(800);
    const bad = chose !== 'ok' || lobby !== 'ok' ? [chose, lobby].filter((x) => x !== 'ok') : [];
    for (const p of all) {
      const view = await showRoom(p);
      await wait(250);
      const found = await sweep(p);
      if (found && found.length) bad.push(p.name + ' lobby (' + view + '): ' + found.join('; '));
      const sides = await ev(p, `document.querySelectorAll('.c4t-side').length`);
      if (sides < 2) bad.push(p.name + ': the lobby shows no sides');
    }
    if (!bad.length) {
      const started = await ev(host, `(async () => { try { await Room.act('start', ROOM_GAMES.connect4.startPayload()); } catch (e) { return 'start: ' + e.message; } return 'ok'; })()`);
      await wait(1500);
      if (started !== 'ok') bad.push(started);
      // Two discs from whoever is up, then every screen.
      for (let k = 0; k < 2 && started === 'ok'; k++) {
        for (const p of phones) await ev(p, `(async () => { const s = Room.state.shared; if (s.upId === Room.me) { try { await Room.act('move', { col: 3, move: s.moves }); } catch (e) {} } return 1; })()`);
        await wait(700);
      }
      bad.push(...await lookAll(`(() => {
        const s = Room.state.shared;
        if (!s.teamMode) return 'not in teams';
        if (s.moves < 2) return 'the relay did not move (' + s.moves + ')';
        return document.querySelector('#view-' + appState.currentView + ' .c4t') && document.querySelectorAll('#view-' + appState.currentView + ' .c4t-relay').length === 2 ? '' : 'no team board / relay on screen'; })()`));
    }
    await ev(host, `(async () => { try { await Room.act('backToHub', {}); await Room.act('chooseGame', { game: 'connect4' }); await Room.act('teams', { on: false }); } catch (e) {} return 1; })()`);
    check(!bad.length, 'connect4 teams: the switch, every phone\'s side, and the relay drawn on every phone and the TV', bad.join('\n      '));
    await toHub();
    await wait(400);
  }

  if (wants('emoji')) {
    all.forEach(takeErrors);
    const chose = await choose('emoji');
    const router = `(() => (ROOM_GAMES.emoji && ROOM_GAMES.emoji.svRouter && TV_GAMES.emoji && TV_GAMES.emoji.svRouter ? '' : 'the quiz replaced the ways router'))()`;
    const picker = await ev(host, `(() => {
      const r = ${router};
      if (r) return r;
      const ways = [...document.querySelectorAll('#view-room-lobby [onclick*="setSvRoomOpt(\\'emoji\\', \\'way\\'"]')].length;
      return ways === 3 ? 'ok' : 'the lobby shows ' + ways + ' ways, not 3'; })()`);
    check(chose === 'ok' && picker === 'ok', 'emoji: the host\'s lobby offers its three ways', [chose, picker].filter((x) => x !== 'ok').join('\n      '));
    for (const way of ['setter', 'race', 'quiz']) {
      if (chose !== 'ok') break;
      await choose('emoji');
      const started = await ev(host, `(async () => {
        setSvRoomOpt('emoji', 'way', '${way}');
        const p = ROOM_GAMES.emoji.startPayload();
        if (p.way !== '${way}') return 'the payload says ' + p.way;
        try { await Room.act('start', p); } catch (e) { return 'start: ' + e.message; }
        return 'ok'; })()`);
      await wait(1800);
      const solve = way !== 'quiz';
      const bad = started !== 'ok' ? [started] : await lookAll(`(() => {
        const r = ${router};
        if (r) return r;
        if (!!(Room.state.shared && Room.state.shared.solve) !== ${solve}) return 'the room is not on the ${solve ? 'solve engine' : 'quiz'}';
        const v = document.getElementById('view-' + appState.currentView);
        return v && v.textContent.trim() ? '' : 'an empty screen'; })()`);
      check(!bad.length, `emoji, way ${way}: started, drawn on every phone and the TV`, bad.join('\n      '));
      await toHub();
      await wait(400);
    }
    await ev(host, `(() => { setSvRoomOpt('emoji', 'way', 'setter'); return 1; })()`);
  }
  for (const p of all) await closePhone(p);
}

if (ONLY.includes('fixes')) {
  console.log('• the fixes of the audit of 23 Sep 2026, on the page');
  const { phones, tv, code, all } = await roomOfFive();
  const [host, p2] = phones;
  // A room link fills its code on the join screen. The published site reads ?room= from the
  // address (the preview has it written in at build time), so the site copy is the one to open.
  const guest = await newPhone('guest');
  await open(guest, BASE + '/site/?room=' + code);
  const joined = await ev(guest, `(() => { const i = [...document.querySelectorAll('input')].find(x => x.offsetWidth && x.value); return { view: appState.currentView, value: i ? i.value : '' }; })()`);
  check(joined && joined.view === 'room-join' && joined.value === code, 'a room link opens the join screen with its code filled in', JSON.stringify(joined));
  await closePhone(guest);

  // المشنقة: a name being typed in the whole-word box survives the others' letters.
  await ev(host, `(async () => { await Room.act('chooseGame', { game: 'hangman' }); await Room.act('start', { mode: 'race', rounds: 3, clock: 0, lang: 'ar' }); return 1; })()`);
  await wait(900);
  await showRoom(p2);
  await wait(400);
  const typed = await ev(p2, `(() => { const i = document.querySelector('#view-room-hangman form.hm-whole input'); if (!i) return false; i.focus(); i.value = 'محمد صل'; i.setSelectionRange(7, 7); return true; })()`);
  await ev(host, `(async () => { for (const l of ['ث', 'ظ', 'غ']) { try { await Room.act('guess', { letter: l, round: Room.state.shared.round }); } catch (e) {} } return 1; })()`);
  await wait(900);
  const kept = await ev(p2, `(() => { const i = document.querySelector('#view-room-hangman form.hm-whole input'); return i ? { value: i.value, focused: document.activeElement === i } : null; })()`);
  check(typed && kept && kept.value === 'محمد صل' && kept.focused, 'hangman: a name half typed in the whole-word box survives the others\' guesses', JSON.stringify(kept));
  await ev(host, `(async () => { await Room.act('backToHub', {}); return 1; })()`);

  // خمّن مين: picking a face has a clock when the turn clock is on.
  await ev(host, `(async () => { await Room.act('chooseGame', { game: 'guesswho' }); await Room.act('start', { pick: 'choose', turnClock: 30, size: 16 }); return 1; })()`);
  await wait(1200);
  const seated = await ev(host, `Room.state.shared.seats`);
  let pickClock = null;
  for (const p of phones) {
    const me = await ev(p, `Room.me`);
    if (seated && seated.indexOf(me) !== -1) { await showRoom(p); await wait(1200); pickClock = await ev(p, `(() => { const c = document.querySelector('#view-room-guesswho [data-gw-clock]'); return c ? c.textContent : null; })()`); break; }
  }
  check(!!pickClock && /\d/.test(pickClock), 'guess who: choosing a secret face shows its clock', pickClock);
  await ev(host, `(async () => { await Room.act('backToHub', {}); return 1; })()`);

  // شطرنج: a room clock is right after a reload (the server's time, not the last move's stamp).
  await ev(host, `(async () => { await Room.act('chooseGame', { game: 'chess' }); await Room.act('start', { clock: '3+2' }); return 1; })()`);
  await wait(800);
  const seats = await ev(host, `Room.state.shared.seats`);
  const byId = {};
  for (const p of phones) byId[await ev(p, `Room.me`)] = p;
  const white = byId[seats[0]], black = byId[seats[1]];
  const move = (p, from, to) => ev(p, `(async () => { await Room.act('move', { from: ${from}, to: ${to}, move: Room.state.shared.chess.moves }); return Room.state.shared.chess.moves; })()`);
  await move(white, 12, 28); await wait(300);
  await move(black, 52, 36); await wait(300);
  await move(white, 6, 21); await wait(300);
  await wait(6000);
  await send('Page.reload', {}, black.sessionId);
  await appUp(black);
  await showRoom(black);
  await wait(1200);
  const clk = await ev(black, `(() => { const st = Room.state; const c = st.shared.chess.clock; return { shown: chRoomClockLeft(st, 1), truth: c.left[1] - (Date.now() - c.at) }; })()`);
  check(clk && Math.abs(clk.shown - clk.truth) < 1500, 'chess: after a reload the running clock shows the time really left', JSON.stringify(clk));
  await ev(host, `(async () => { await Room.act('backToHub', {}); return 1; })()`);

  // حرب السفن: a sinking is not told before its shell lands.
  const held = await ev(host, `(async () => {
    if (typeof lzEnsure === "function") await lzEnsure(lzChunksOfView("room-battleship"));
    const ai = bsRandomFleet(Math.random), sea = { grid: new Array(100).fill(BS_SEA), sunk: [] };
    const cells = bsShipCells(ai[4], BS_SHIPS[4].len);
    let res; cells.forEach(c => { res = bsFire(sea, ai, c); });
    const last = { seat: 0, cell: cells[cells.length - 1], res: 'sunk', ship: 4 };
    const seas = [{ grid: new Array(100).fill(BS_SEA), sunk: [] }, sea];
    return { flying: bsAfloatCount(bsSeaShown(seas, 1, last, true)), landed: bsAfloatCount(bsSeaShown(seas, 1, last, false)) }; })()`);
  check(held && held.flying === 5 && held.landed === 4, 'battleship: the ships afloat count waits for the shell to land', JSON.stringify(held));

  const errs = all.flatMap((p) => takeErrors(p).map((e) => p.name + ': ' + e));
  check(!errs.length, 'no errors on any phone or the TV through all of it', [...new Set(errs)].join('\n      '));
  for (const p of all) await closePhone(p);

  // «الشلة»: a crew with a night on it, its page at every size (the empty page is in the screens part).
  const cp = await newPhone('crew');
  await open(cp, BASE + '/preview/');
  const made = await ev(cp, `(async () => {
    localStorage.setItem('ashryName', 'منى');
    const res = await crewApi('create', { name: 'شلة الاختبار', me: 'منى' });
    if (!res.ok) return null;
    crewRemember({ code: res.code, name: res.crew.name, memberId: res.memberId, key: res.key, me: 'منى' }, true);
    const k = await crewApi('join', { code: res.code, name: 'كريم' });
    // The links (30 Sep 2026): a quiz and the words on the crew, a second quiz on the phone only.
    const keepQuiz = (made, title) => packQuizPut({ id: packNewId(), code: made.code, key: made.key, title, emoji: '🎉', questions: made.pack.questions, updated: Date.now(), savedAt: Date.now(), dirty: false });
    const quiz = { title: 'مسابقة الشلة', emoji: '🎉', questions: [{ q: 'مين وصل الأول؟', c: ['منى', 'كريم', 'سارة', 'نور'], a: 1 }] };
    const q1 = await packApi('/pack/create', { kind: 'quiz', pack: quiz });
    const q2 = await packApi('/pack/create', { kind: 'quiz', pack: Object.assign({}, quiz, { title: 'مسابقة العيد' }) });
    const wp = await packApi('/pack/create', { kind: 'words', pack: { title: 'كلمات الشلة', words: ['القعدة', 'الشاي بالنعناع', 'البلكونة', 'الطاولة', 'فشار', 'سهرة الخميس', 'الريموت'] } });
    if (q1.ok) { keepQuiz(q1, 'مسابقة الشلة'); await crewAddPack(res.code, { code: q1.code, kind: 'quiz', title: 'مسابقة الشلة' }); }
    if (q2.ok) keepQuiz(q2, 'مسابقة العيد');
    if (wp.ok) { const a = await crewAddPack(res.code, { code: wp.code, kind: 'words', title: 'كلمات الشلة' }); if (a && a.crew) crewCacheWrite(res.code, a.crew); }
    // A night of the crew: a room opened for it, a buzzer game won by كريم, back to the hub.
    await Room.create('منى', 'buzzer');
    await Room.act('setCrew', { code: res.code, key: res.key });
    return { code: res.code, room: Room.state.code, kkey: k.key };
  })()`);
  check(!!(made && made.code), 'crew: made from the page', JSON.stringify(made));
  if (made) {
    const kp = await newPhone('crew-k');
    await open(kp, BASE + '/preview/');
    await ev(kp, `(async () => { await Room.join(${JSON.stringify(made.room)}, 'كريم'); return 1; })()`);
    await ev(cp, `(async () => { await Room.act('start', {}); return 1; })()`);
    for (let i = 0; i < 2; i++) {
      await wait(400);
      await ev(kp, `Room.act('buzz', { round: Room.state.shared.round }).then(() => 1)`);
      await wait(400);
      await ev(cp, `Room.act('correct', { id: Room.state.shared.buzzes[0].id }).then(() => 1)`);
    }
    await ev(cp, `Room.act('backToHub', {}).then(() => 1)`);
    await wait(1500);
    await ev(cp, `lzEnsure(lzChunksOfView('crew')).then(() => 1)`);
    const bad = [];
    for (const [w, h] of [[375, 812], [667, 375], [1280, 720], [1920, 1080]]) {
      await resize(cp, w, h);
      for (const [lang, dark] of [['ar', false], ['en', true]]) {
        await setLook(cp, lang, dark);
        for (const tab of ['month', 'champs', 'titles', 'nights']) {
          await ev(cp, `crewPage.at = {}; setView('crew'); closeAllModals(); 1`);
          await wait(120);
          await chunkIn(cp);
          await ev(cp, `crewTab(${JSON.stringify(tab)}); 1`);
          await wait(tab === 'month' ? 900 : 150);
          const found = await sweep(cp);
          if (found && found.length) bad.push(`${w}x${h} ${lang} ${tab}: ` + found.join('; '));
        }
      }
    }
    await ev(cp, `crewPage.tab = 'nights'; crewPage.at = {}; renderCrew(); 1`);
    await wait(1200);
    await ev(cp, `crewTab('month'); 1`);
    await wait(200);
    const podium = await ev(cp, `(() => { const d = crewPage.data[crewPage.code] || {}; return { cast: !!document.querySelector('#crew-pane .podium .pod-cast'), top: (d.table || [])[0], nights: d.nightCount }; })()`);
    check(podium && podium.cast && podium.top && podium.top.name === 'كريم', 'crew: the month opens on the podium, كريم on top', JSON.stringify(podium));
    // The links: the crew's packs under the card, «من الشلة» in the quiz list, the words in the word games,
    // «ضيفها للشلة» on a quiz not on the crew yet, and a night that was a program on the nights tab.
    const packs = await ev(cp, `(() => ({ chips: document.querySelectorAll('#view-crew .crew-pack').length, x: document.querySelectorAll('#view-crew .crew-pack__x').length }))()`);
    check(packs && packs.chips === 2 && packs.x === 2, 'crew link: the crew page shows its quiz and words, each with ✕ for the manager', JSON.stringify(packs));
    await ev(cp, `crewWordsSync().then(() => 1)`);
    await wait(600);
    const words = await ev(cp, `(() => { const p = packWordPacks(); return { names: p.map(x => x.name), spy: Object.keys(spyCategoriesPlus()).slice(0, 3) }; })()`);
    check(words && words.names.some((n) => /كلمات الشلة/.test(n)) && words.spy.some((n) => /كلمات الشلة/.test(n)), "crew link: the crew's words are a category in the word games", JSON.stringify(words));
    await ev(cp, `lzEnsure(lzChunksOfView('setup-quizmaker')).then(() => { setView('setup-quizmaker'); return 1; })`);
    await wait(500);
    const hub = await ev(cp, `(() => ({ rows: document.querySelectorAll('#qm-hub .qm-item--crew').length }))()`);
    check(hub && hub.rows === 2, 'crew link: «من الشلة» in the quiz list, the crew\'s two packs', JSON.stringify(hub));
    const sheet = await ev(cp, `(() => { const q = packsQuizzes().find(x => x.title === 'مسابقة العيد'); if (!q) return null; qmOpenSheet(q); const b = document.querySelector('#qm-save-modal .crew-pack-add'); return b ? { on: !b.disabled, text: b.textContent.trim() } : null; })()`);
    check(sheet && sheet.on, 'crew link: «ضيفها للشلة» on a saved quiz the crew doesn\'t have', JSON.stringify(sheet));
    const hubBad = [];
    for (const [w, h] of [[375, 812], [1280, 720]]) {
      await resize(cp, w, h);
      for (const [lang, dark] of [['ar', false], ['en', true]]) {
        await setLook(cp, lang, dark);
        await ev(cp, `closeAllModals(); qmPaintHub(); 1`);
        await wait(250);
        const f1 = await sweep(cp);
        if (f1 && f1.length) hubBad.push(`${w}x${h} ${lang} hub: ` + f1.join('; '));
        await ev(cp, `(() => { const q = packsQuizzes().find(x => x.title === 'مسابقة العيد'); qmOpenSheet(q); return 1; })()`);
        await wait(300);
        const f2 = await sweep(cp);
        if (f2 && f2.length) hubBad.push(`${w}x${h} ${lang} sheet: ` + f2.join('; '));
        await ev(cp, `closeAllModals(); setView('crew'); 1`);
        await wait(200);
        await ev(cp, `(() => { const c = crewPage.code; crewPage.at[c] = Date.now(); const d = crewPage.data[c]; if (d && d.nights && d.nights[0]) d.nights[0].prog = { n: 1, games: 3, champs: ['كريم'], aw: [{ k: 'buzz', name: 'كريم', v: 180 }, { k: 'prophet', name: 'منى', v: 2 }, { k: 'streak', name: 'كريم', v: 2 }] }; crewPage.tab = 'month'; renderCrew(); crewTab('nights'); return 1; })()`);
        await wait(300);
        const f3 = await sweep(cp);
        if (f3 && f3.length) hubBad.push(`${w}x${h} ${lang} nights: ` + f3.join('; '));
      }
    }
    const badge = await ev(cp, `(() => ({ badge: !!document.querySelector('#crew-pane .crew-prog-badge'), aw: document.querySelectorAll('#crew-pane .crew-night__aw').length }))()`);
    check(badge && badge.badge && badge.aw === 3, 'crew link: a program night shows its badge, champion and awards on the nights tab', JSON.stringify(badge));
    check(!hubBad.length, 'crew link: the quiz list, the sheet and the nights tab laid out within the screen (375x812, 1280x720; Arabic light, English dark)', hubBad.join('\n      '));
    check(!bad.length, 'crew: the page and its four tabs at four sizes, Arabic light and English dark: laid out within the screen', bad.join('\n      '));
    await open(cp, BASE + '/preview/');
    const back = await ev(cp, `appState.currentView === 'crew' && !!document.querySelector('#view-crew .crew-card')`);
    check(back, 'crew: a reload on the crew page comes back to it');
    const errs = [cp, kp].flatMap((p) => takeErrors(p).map((e) => p.name + ': ' + e)).filter((e) => !/navigator\.vibrate/.test(e));
    check(!errs.length, 'crew: no errors', [...new Set(errs)].join('\n      '));
    await closePhone(kp);
  }
  await closePhone(cp);
}

/* --- برنامج السهرة: the builder, the table between two games and the finale ---------------- */
if (ONLY.includes('program')) {
  console.log('• the night\'s program: the builder, the table between two games, the finale (five phones and a TV)');
  const { phones, tv, all } = await roomOfFive();
  const host = phones[0];
  await showRoom(host);
  await wait(500);
  all.forEach(takeErrors);
  const modalCheck = async () => { await ev(host, SWEEP); return ev(host, `__uiCheck(document.getElementById('prog-modal'))`); };
  // The builder: its door in the room's list, the picker, a game's options, the list.
  const door = await ev(host, `!!document.querySelector('#view-room-lobby .prog-door')`);
  check(door, 'program: the host sees its door at the top of the room\'s list');
  await ev(host, `(() => { localStorage.setItem('ashryProgramDraft_v1', '[]'); prog && (prog.draft = null); return 1; })()`).catch(() => {});
  await ev(host, `roomOpenProgram(); 1`);
  await chunkIn(host, 8000);
  await wait(500);
  await ev(host, `(() => { prog.draft = null; localStorage.setItem('ashryProgramDraft_v1', '[]'); progRenderBuilder(); return 1; })()`);
  let found = await modalCheck();
  check(found && !found.length, 'program: the builder, empty, laid out within the screen', JSON.stringify(found));
  await ev(host, `progPane('pick'); 1`);
  await wait(300);
  found = await modalCheck();
  check(found && !found.length, 'program: the picker laid out within the screen', JSON.stringify(found));
  for (const id of ['trivia', 'buzzer', 'mind']) { await ev(host, `progAdd(${JSON.stringify(id)}); 1`); await wait(600); await chunkIn(host, 8000); }
  await ev(host, `progPane('list'); 1`);
  await wait(800);
  found = await modalCheck();
  const rows = await ev(host, `document.querySelectorAll('#prog-list .prog-row').length`);
  check(rows === 3 && found && !found.length, 'program: three games in the list, laid out within the screen', JSON.stringify({ rows, found }));
  await ev(host, `progOpenOpts(0); 1`);
  await wait(800);
  found = await modalCheck();
  const optsShown = await ev(host, `!!document.querySelector('#prog-opts-body select, #prog-opts-body .segmented, #prog-opts-body input')`);
  check(optsShown && found && !found.length, 'program: a game\'s own options in the sheet', JSON.stringify(found));
  await ev(host, `progOptsDone(); 1`);
  // The drag: the last game to the top, by the handle.
  const moved = await ev(host, `(() => { progMove(2, 0); return progDraftLoad().map(x => x.id).join(','); })()`);
  check(moved === 'mind,trivia,buzzer', 'program: a game moved in the list', moved);
  await ev(host, `progMove(0, 2); 1`);
  const started = await ev(host, `(async () => { await progStart(); return Room.state.program ? Room.state.program.phase : 'none'; })()`);
  check(started === 'between', 'program: started from the builder', started);
  await wait(1500);
  const lookAll = async (label) => {
    const bad = [];
    for (const p of all) {
      const view = await showRoom(p);
      await wait(300);
      const f = await sweep(p);
      if (f && f.length) bad.push(p.name + ' (' + view + '): ' + f.join('; '));
    }
    const errs = all.flatMap((p) => takeErrors(p).map((e) => p.name + ': ' + e));
    check(!bad.length && !errs.length, `program: ${label}, on every phone and the TV, laid out without errors`, [...bad, ...new Set(errs)].join('\n      '));
  };
  const views = async () => Promise.all(all.map((p) => ev(p, `appState.currentView`)));
  await lookAll('the line-up');
  check((await views()).every((v) => v === 'room-program' || v === 'room-tv'), 'program: the line-up is the program\'s own screen');
  // The first game now; cut short at once: the table between two games.
  await ev(host, `(async () => { await Room.act('programSkip', { seq: Room.state.program.seq }); return 1; })()`);
  await wait(1500);
  await ev(host, `(async () => { await Room.act('programSkip', { seq: Room.state.program.seq }); return 1; })()`);
  await wait(1500);
  await lookAll('the table between two games');
  const ring = await ev(tv, `!!document.querySelector('#view-room-tv .prog-ring [data-prog-count]')`);
  check(ring, 'program: the TV\'s next game has its countdown ring');
  // A reload between two games comes back to the table.
  await send('Page.reload', {}, phones[1].sessionId);
  await appUp(phones[1], 20000);
  await wait(2500);
  const back = await showRoom(phones[1]);
  check(back === 'room-program', 'program: a phone reloaded between two games comes back to the table', back);
  // The finale.
  await ev(host, `(async () => { await Room.act('programEnd', {}); return 1; })()`);
  await wait(2500);
  await lookAll('the finale');
  const champ = await ev(tv, `!!document.querySelector('#view-room-tv .prog--final')`);
  check(champ, 'program: the TV shows the finale');
  await ev(host, `(async () => { await Room.act('programClose', {}); return 1; })()`);
  await wait(1000);
  const hub = await showRoom(host);
  check(hub === 'room-lobby', 'program: closed, back to the room\'s list', hub);
  for (const p of all) await closePhone(p);
}

/* --- المهمة السرية: the switch, the file, the target's memo, the TV, the reveal ------------ */
if (ONLY.includes('mission')) {
  console.log('• the secret mission: the host\'s switch, the file on every phone, the memo over a game, the TV\'s board, the reveal (five phones and a TV)');
  const { phones, tv, all } = await roomOfFive();
  const host = phones[0];
  for (const p of all) await showRoom(p);
  await wait(500);
  all.forEach(takeErrors);
  const modalCheck = async (p, id) => { await ev(p, SWEEP); return ev(p, `__uiCheck(document.getElementById(${JSON.stringify(id)}))`); };
  const door = await ev(host, `!!document.querySelector('#room-mission .msn-door')`);
  check(door, 'mission: the host sees its switch in the room');
  const noDoor = await ev(phones[1], `!document.querySelector('#room-mission .msn-door')`);
  check(noDoor, 'mission: a player sees no switch while it is off');
  await ev(host, `roomOpenMission(); 1`);
  await chunkIn(host, 8000);
  await wait(600);
  let found = await modalCheck(host, 'mission-modal');
  const tabs = await ev(host, `document.querySelectorAll('#mission-modal .msn-tabs__tab').length`);
  check(tabs === 4 && found && !found.length, 'mission: the setup (four places, two companies) laid out within the screen', JSON.stringify(found));
  await ev(host, `missionSetPlace('out'); missionSetCo('friends'); 1`);
  const ex = await ev(host, `document.querySelectorAll('#mission-modal .msn-ex li').length`);
  check(ex === 3, 'mission: three examples of what the file holds', String(ex));
  await ev(host, `missionSetupGo(); 1`);
  await wait(1500);
  for (const p of all) await chunkIn(p, 8000);
  await wait(800);
  const lookAll = async (label) => {
    const bad = [];
    for (const p of all) {
      const view = await showRoom(p);
      await wait(250);
      const f = await sweep(p);
      if (f && f.length) bad.push(p.name + ' (' + view + '): ' + f.join('; '));
    }
    const errs = all.flatMap((p) => takeErrors(p).map((e) => p.name + ': ' + e));
    check(!bad.length && !errs.length, `mission: ${label}, on every phone and the TV, laid out without errors`, [...bad, ...new Set(errs)].join('\n      '));
  };
  await lookAll('the lobby with it on');
  const fab = await Promise.all(phones.map((p) => ev(p, `getComputedStyle(document.getElementById('mission-fab')).display !== 'none'`)));
  check(fab.every(Boolean), 'mission: the 📁 in the header on every phone', JSON.stringify(fab));
  const board = await ev(tv, `!!document.querySelector('#view-room-tv .msn-cork--board') && !document.getElementById('mission-fab').offsetWidth`);
  check(board, 'mission: the TV shows the cork board, and no 📁');
  // The file on every phone, shut and held open.
  const fileBad = [];
  for (const p of phones) {
    await ev(p, `missionOpenFile(); 1`);
    await wait(400);
    let f = await modalCheck(p, 'mission-modal');
    await ev(p, `missionHoldDown(null); 1`);
    await wait(300);
    const open = await ev(p, `document.getElementById('msn-file').classList.contains('is-peek')`);
    f = (f || []).concat(await modalCheck(p, 'mission-modal') || []);
    await ev(p, `missionHoldUp(); 1`);
    await wait(350);
    const shut = await ev(p, `!document.getElementById('msn-file').classList.contains('is-peek') && !document.getElementById('msn-type-text').textContent`);
    if (!open || !shut || f.length) fileBad.push(p.name + ': ' + JSON.stringify({ open, shut, f }));
    await ev(p, `missionCloseModal(); 1`);
  }
  check(!fileBad.length, 'mission: every phone\'s file opens while held, shuts empty when let go, laid out within the screen', fileBad.join('\n      '));
  // A game; a memo over it at a calm moment, on the target's phone only.
  await ev(host, `(async () => { await Room.act('chooseGame', { game: 'buzzer' }); await Room.act('start', {}); return 1; })()`);
  await wait(1500);
  const doer = phones[1];
  const to = await ev(doer, `Room.state.mission.me.to`);
  const ids = await Promise.all(phones.map((p) => ev(p, `Room.me`)));
  const target = phones[ids.indexOf(to)];
  await ev(doer, `missionDone(); 1`);
  let memo = false;
  for (let i = 0; i < 40 && !memo; i++) { await wait(200); memo = await ev(target, `!document.getElementById('mission-ask').classList.contains('hidden')`); }
  check(memo, 'mission: the target\'s phone gets the memo, over the game');
  found = await modalCheck(target, 'mission-ask');
  check(found && !found.length, 'mission: the memo laid out within the screen', JSON.stringify(found));
  const others = await Promise.all(phones.filter((p) => p !== target).map((p) => ev(p, `document.getElementById('mission-ask').classList.contains('hidden')`)));
  check(others.every(Boolean), 'mission: nobody else gets it');
  await ev(target, `document.querySelector('#mission-ask .msn-stamp--yes').click(); 1`);
  let ticker = false;
  for (let i = 0; i < 30 && !ticker; i++) { await wait(200); ticker = await ev(tv, `!!document.querySelector('#msn-tv-ticker.is-on')`); }
  check(ticker, 'mission: the TV\'s ticker says a file was closed');
  await lookAll('a game with it on');
  // A reload keeps it.
  await send('Page.reload', {}, phones[2].sessionId);
  await appUp(phones[2], 20000);
  await wait(2500);
  await chunkIn(phones[2], 8000);
  const kept = await ev(phones[2], `!!(Room.state && Room.state.mission && Room.state.mission.on && document.body.classList.contains('has-mission'))`);
  check(kept, 'mission: a phone reloaded mid-game still has its file');
  // The end: the story on every phone, the strings and the champion on the TV.
  await ev(host, `(async () => { await Room.act('backToHub', {}); await Room.act('missionSet', { on: false }); return 1; })()`);
  await wait(2500);
  const revealBad = [];
  for (const p of phones) {
    await ev(p, `missionOpenReveal(); 1`);
    await wait(300);
    const f = await modalCheck(p, 'mission-modal');
    const has = await ev(p, `!!document.querySelector('#mission-modal .msn-champ') && document.querySelectorAll('#mission-modal .msn-story__line').length >= 1`);
    if (!has || (f && f.length)) revealBad.push(p.name + ': ' + JSON.stringify({ has, f }));
  }
  check(!revealBad.length, 'mission: the story and the champion on every phone, laid out within the screen', revealBad.join('\n      '));
  const strings = await ev(tv, `document.querySelectorAll('#msn-tv-reveal .msn-strings line').length`);
  check(strings >= 1, 'mission: the TV\'s board joins who did what to whom with red strings', String(strings));
  await ev(host, `(async () => { missionCloseModal(); await Room.act('missionClose', {}); return 1; })()`);
  await wait(1200);
  const gone = await ev(tv, `!document.getElementById('msn-tv-reveal')`);
  check(gone, 'mission: closed - the TV is back to the room');
  const errs = all.flatMap((p) => takeErrors(p).map((e) => p.name + ': ' + e));
  check(!errs.length, 'mission: no console errors', [...new Set(errs)].join('\n      '));
  for (const p of all) await closePhone(p);
}

if (ONLY.includes('site')) {
  console.log('• the offline copy and updates (a built copy of the site)');
  const phone = await newPhone('site');
  const url = BASE + '/site/';
  await open(phone, url);
  let controlled = false;
  for (let i = 0; i < 60 && !controlled; i++) { await wait(250); controlled = await ev(phone, `!!navigator.serviceWorker.controller`); }
  check(controlled, 'the offline copy is in charge after the first visit');
  await send('Page.reload', {}, phone.sessionId);
  await appUp(phone);
  const nav = await ev(phone, `(() => { const n = performance.getEntriesByType('navigation')[0]; return { worker: n.workerStart > 0, bytes: n.transferSize }; })()`);
  check(nav && nav.worker && nav.bytes === 0, 'the next open is the copy on the phone: nothing downloaded', JSON.stringify(nav));

  // A new build: the same site under a newer stamp.
  const stamp = await ev(phone, `window.BUILD_ID`);
  let current = stamp;
  const newBuild = () => {
    const next = String(Number(current) + 1);
    for (const f of ['sw.js', 'index.html']) {
      const p = path.join(SITE, f);
      fs.writeFileSync(p, fs.readFileSync(p, 'utf8').split(current).join(next));
    }
    current = next;
    return next;
  };
  const askUpdate = () => ev(phone, `(async () => { const r = await navigator.serviceWorker.getRegistration(); if (r) await r.update(); return 1; })()`);
  const buildNow = async (ms) => { const t0 = Date.now(); let b = null; while (Date.now() - t0 < ms) { await wait(400); b = await ev(phone, `window.BUILD_ID`).catch(() => null); if (b === current) break; } return b; };

  let next = newBuild();
  await askUpdate();
  check(await buildNow(40000) === next, 'on the home screen, a new build is switched to by itself');
  await appUp(phone);

  // In a game it waits, with the note; back on the home it switches.
  await ev(phone, `setView('setup-sudoku'); 1`);
  await chunkIn(phone);
  await ev(phone, `(() => { const b = [...document.querySelectorAll('#view-setup-sudoku .view-actions button')].find(x => x.offsetWidth); if (b) b.click(); return appState.currentView; })()`);
  await wait(800);
  const before = await ev(phone, `window.BUILD_ID`);
  const puzzle = await ev(phone, `(appState.sudoku && appState.sudoku.puzzle) || ''`);
  next = newBuild();
  await askUpdate();
  await wait(8000);
  const inGame = await ev(phone, `({ build: window.BUILD_ID, view: appState.currentView, note: !!document.querySelector('.toast--action') })`);
  check(inGame && inGame.build === before && inGame.view === 'play-sudoku' && inGame.note, 'in a game a new build waits, and a note says it is there', JSON.stringify(inGame));
  await ev(phone, `setView('menu'); 1`);
  check(await buildNow(40000) === next, 'back on the home screen, it switches by itself');
  await appUp(phone);
  const kept = await ev(phone, `(appState.sudoku && appState.sudoku.puzzle) || ''`);
  check(!!puzzle && kept === puzzle, 'the game left in the middle is still there after the switch', JSON.stringify({ before: puzzle.slice(0, 12), after: String(kept).slice(0, 12) }));

  // Settings → الإصدار.
  const ver = await ev(phone, `(async () => { openSettings(); await new Promise(r => setTimeout(r, 2500)); return { value: document.getElementById('settings-version-value').textContent, status: appVersionState }; })()`);
  check(ver && ver.value && ver.status === 'latest', 'Settings says when this copy was published, and that it is the latest', JSON.stringify(ver));
  await ev(phone, `closeAllModals(); 1`);
  next = newBuild();
  const newer = await ev(phone, `(async () => { openSettings(); await new Promise(r => setTimeout(r, 4000)); return appVersionState; })()`);
  check(newer === 'downloading' || newer === 'ready', 'Settings says when a newer version is there', newer);
  const errs = takeErrors(phone);
  check(!errs.length, 'no errors through the updates', [...new Set(errs)].join('\n      '));
  await closePhone(phone);
}

console.log(`\n${passed} passed, ${failed} failed`);
if (process.env.UI_CHILD) console.log('@@RESULT ' + JSON.stringify({ passed, failed }));
try { ws.close(); } catch (e) {}
chrome.kill();
server.close();
setTimeout(() => { try { fs.rmSync(TMP, { recursive: true, force: true }); } catch (e) {} process.exit(failed ? 1 : 0); }, 500);
