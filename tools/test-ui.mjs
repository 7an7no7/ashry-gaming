/**
 * The app on screen, in headless Chrome: what the rules tests and the robots can't see.
 *
 *   npm run test:ui                      (the rooms server running: npm run dev in rooms-worker/)
 *   node test-ui.mjs http://127.0.0.1:8797          another rooms server
 *   ONLY=screens,rooms,fixes,site node test-ui.mjs  some parts only
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
 *   fixes    what the audit of 23 Sep 2026 fixed on the page: a word being typed in a room survives
 *            the others' moves, a room link fills its code, a chess clock is right after a reload,
 *            Battleship tells no result before the shell lands, Guess Who's face pick has a clock
 *   site     the offline copy: the app opens from the phone, and a new build is switched to by
 *            itself on the home screen, never in a game; Settings says which version this is
 *
 * Every check prints ✓ or ✗; the exit code is the number of ✗ (0 when all pass).
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
const ONLY = (process.env.ONLY || 'screens,rooms,fixes,site').split(',');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'ashry-ui-'));
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

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
const PREVIEW = path.join(TMP, 'preview');
const SITE = path.join(TMP, 'site');
build('build-preview.mjs', { ROOMS_URL: ROOMS, PREVIEW_OUT: PREVIEW });
fs.mkdirSync(SITE, { recursive: true });
for (const f of ['icon-180.png', 'icon-192.png', 'icon-512.png', 'favicon-64.png', 'manifest.webmanifest']) {
  if (fs.existsSync(path.join(root, 'docs', f))) fs.copyFileSync(path.join(root, 'docs', f), path.join(SITE, f));
}
build('build-site.mjs', { ROOMS_URL: ROOMS, SITE_OUT: SITE });

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
    if (!skip(text) && !/status of 4\d\d/.test(text)) phone.errors.push('log: ' + text.slice(0, 200));
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
async function ev(phone, expr) {
  try {
    const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true }, phone.sessionId);
    if (r.exceptionDetails) throw new Error((r.exceptionDetails.exception && r.exceptionDetails.exception.description) || r.exceptionDetails.text);
    return r.result && r.result.value;
  } catch (e) {
    if (/context was destroyed|Cannot find context|Inspected target navigated/.test(e.message)) return undefined;
    throw e;
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
  const sizes = [[375, 812], [667, 375], [1280, 720]];
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
        const found = await sweep(phone);
        if (found && found.length) bad.push(id + ': ' + found.join('; '));
      }
      check(!bad.length, `${views.length} screens at ${w}x${h}, ${lang} ${dark ? 'dark' : 'light'}: laid out within the screen`, bad.join('\n      '));
      const errs = takeErrors(phone);
      check(!errs.length, `${w}x${h}, ${lang}: no errors opening every screen`, [...new Set(errs)].join('\n      '));
    }
    // Every game started the way a player starts it: its setup screen's Start.
    if (w !== 667) {
      const setups = await ev(phone, `[...document.querySelectorAll('[id^="view-setup-"]')].map(v => v.id.slice(5))`);
      const bad = [], landed = [];
      await setLook(phone, 'ar', false);
      for (const id of setups) {
        await ev(phone, `setView(${JSON.stringify(id)}); closeAllModals(); 1`);
        await wait(150);
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
  const games = await ev(host, `ROOM_HUB_GAMES.map(g => g.id)`);
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
  const held = await ev(host, `(() => {
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
  check(await buildNow(20000) === next, 'on the home screen, a new build is switched to by itself');
  await appUp(phone);

  // In a game it waits, with the note; back on the home it switches.
  await ev(phone, `(() => { setView('setup-sudoku'); const b = [...document.querySelectorAll('#view-setup-sudoku .view-actions button')].find(x => x.offsetWidth); if (b) b.click(); return appState.currentView; })()`);
  await wait(800);
  const before = await ev(phone, `window.BUILD_ID`);
  const puzzle = await ev(phone, `(appState.sudoku && appState.sudoku.puzzle) || ''`);
  next = newBuild();
  await askUpdate();
  await wait(8000);
  const inGame = await ev(phone, `({ build: window.BUILD_ID, view: appState.currentView, note: !!document.querySelector('.toast--action') })`);
  check(inGame && inGame.build === before && inGame.view === 'play-sudoku' && inGame.note, 'in a game a new build waits, and a note says it is there', JSON.stringify(inGame));
  await ev(phone, `setView('menu'); 1`);
  check(await buildNow(20000) === next, 'back on the home screen, it switches by itself');
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
try { ws.close(); } catch (e) {}
chrome.kill();
server.close();
setTimeout(() => { try { fs.rmSync(TMP, { recursive: true, force: true }); } catch (e) {} process.exit(failed); }, 500);
