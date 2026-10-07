/**
 * Two builds of the app side by side, element by element: does every screen look exactly the
 * same? Written for the owner's B1 and B2 of 7 Oct 2026 (each game's screens and styles moved
 * out of the page into its chunk): a move like that must change nothing anyone can see, and
 * this is the proof.
 *
 *   node compare-styles.mjs                        master's preview against this folder's
 *   node compare-styles.mjs --ref=HEAD~1           another commit as the "before"
 *   node compare-styles.mjs --before=DIR --after=DIR   two previews already built
 *   ROOMS_URL=http://127.0.0.1:8811 node compare-styles.mjs --only=rooms   (rooms need a server)
 *   --only=screens,games,motion,rooms   --sizes=375x812,1280x720   --port=4411   CHROME=…
 *
 * The "before" is built from a git commit (git archive into a temporary folder, this folder's
 * node_modules linked in) and the "after" from the working tree, both with build-preview.mjs
 * (no minifying, so the site's minifier is not what is compared). Both are served from one
 * local server and opened in headless Chrome, each in a browser profile of its own, with the
 * same Math.random (seeded) so the games deal the same cards.
 *
 *   screens  every screen (setView) at each size, in Arabic light and English dark: every element
 *            of the screen, the header and the bar, and any popup open, keyed by its path from
 *            the screen (tag and place among its siblings), with the computed value of PROPS.
 *            Zero differences is the bar.
 *   games    every game started from its setup's Start, the screen it lands on, at each size.
 *   motion   the same at one size with Settings → الحركة on «شغّالة» and on «مقفولة»
 *            (applyMotionPref moves the stylesheets' reduced-motion blocks).
 *   rooms    every room game's lobby and its first moments, in one room on two phones and a TV
 *            of the "before" build; each has a twin in the "after" build that is the same
 *            player (its saved session copied, a second socket), so both draw the same state.
 *            Compared as the screens are. A clock's ring or a board still moving can differ by
 *            the moment each twin was read: read those lines, and run the game again.
 *
 * It also lists every lookup by id that finds nothing in the "after" page while the same id
 * was found in the "before" (getElementById / querySelector('#…') wrapped): code reaching for a
 * game's markup before that game's chunk has put it in the page.
 *
 * Prints the differences and exits 1 when there are any. Some games differ from themselves:
 * run it with --after the same folder as --before to see which (on 7 Oct 2026: the snakes'
 * board, always moving; the dice of لودو and بنك الحظ; the team names of the trivia board
 * and the saying of كمّل المثل, dealt with more than Math.random; a chess clock's ring). A
 * difference that shows there too is the game's, not the change's.
 */
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn, spawnSync, execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here = fileURLToPath(new URL('./', import.meta.url));
const root = path.join(here, '..');
const arg = (name, dflt) => { const a = process.argv.find((x) => x.startsWith(`--${name}=`)); return a ? a.slice(name.length + 3) : dflt; };
const ONLY = arg('only', 'screens,games,motion,rooms').split(',');
const SIZES = arg('sizes', '375x812,1280x720').split(',').map((s) => s.split('x').map(Number));
const PORT = Number(arg('port', '4411'));
const ROOMS = (process.env.ROOMS_URL || 'http://127.0.0.1:8787').replace(/\/$/, '');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'ashry-cmp-'));
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

/* --- the two builds ------------------------------------------------------------------- */
function buildPreview(toolsDir, out) {
  const r = spawnSync(process.execPath, [path.join(toolsDir, 'build-preview.mjs')], {
    env: Object.assign({}, process.env, { PREVIEW_OUT: out, ROOMS_URL: ROOMS }), encoding: 'utf8' });
  if (r.status !== 0) { console.error(r.stdout, r.stderr); process.exit(1); }
}
let BEFORE = arg('before', null), AFTER = arg('after', null);
if (!BEFORE) {
  const ref = arg('ref', 'master');
  const src = path.join(TMP, 'src');
  fs.mkdirSync(src);
  const tar = execFileSync('git', ['archive', '--format=tar', ref], { cwd: root, maxBuffer: 1 << 30 });
  fs.writeFileSync(path.join(TMP, 'src.tar'), tar);
  execFileSync('tar', ['-xf', path.join(TMP, 'src.tar'), '-C', src]);
  fs.symlinkSync(path.join(here, 'node_modules'), path.join(src, 'tools', 'node_modules'), 'junction');
  BEFORE = path.join(TMP, 'before');
  buildPreview(path.join(src, 'tools'), BEFORE);
  console.log(`before: ${ref}`);
}
if (!AFTER) { AFTER = path.join(TMP, 'after'); buildPreview(here, AFTER); console.log('after: the working tree'); }
BEFORE = path.resolve(BEFORE); AFTER = path.resolve(AFTER);

/* --- one server for both --------------------------------------------------------------- */
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.wasm': 'application/wasm' };
const server = http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);
  const [, top, ...rest] = url.split('/');
  const dir = top === 'before' ? BEFORE : top === 'after' ? AFTER : null;
  let f = dir ? path.join(dir, rest.join('/') || 'index.html') : null;
  if (!f || !f.startsWith(dir) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream', 'cache-control': 'no-cache' });
  fs.createReadStream(f).pipe(res);
});
await new Promise((r) => server.listen(PORT, '127.0.0.1', r));
const BASE = `http://127.0.0.1:${PORT}`;

/* --- Chrome (as test-ui.mjs) ------------------------------------------------------------ */
const chromePath = process.env.CHROME || ['C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome', '/usr/bin/chromium'].find((p) => fs.existsSync(p));
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
const pending = new Map(), sessions = new Map();
ws.onmessage = (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); return; }
  const tab = m.sessionId && sessions.get(m.sessionId);
  if (tab && m.method === 'Runtime.exceptionThrown') {
    const d = m.params.exceptionDetails;
    tab.errors.push(((d.exception && d.exception.description) || d.text || '').split('\n')[0]);
  }
};
const send = (method, params = {}, sessionId) => new Promise((resolve, reject) => {
  const id = ++msgId;
  pending.set(id, (m) => (m.error ? reject(new Error(method + ': ' + m.error.message)) : resolve(m.result)));
  ws.send(JSON.stringify({ id, method, params, sessionId }));
});

/* Seeded random, and every id lookup that finds nothing written down: before any of the page runs. */
const PRELUDE = `(() => {
  let s = 20261007;
  Math.random = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  const misses = window.__cmpMisses = new Map();
  // Where it was asked from: two frames past the wrapper, the address cut to the file's name.
  const miss = (id) => { if (!misses.has(id)) misses.set(id, (new Error().stack || '').split(String.fromCharCode(10)).slice(3, 5).map(l => l.trim().replace(/https?:[^)]*[/]/, '')).join(' < ')); };
  const gid = Document.prototype.getElementById;
  Document.prototype.getElementById = function (id) { const r = gid.call(this, id); if (!r && id) miss(String(id)); return r; };
  const qs = Document.prototype.querySelector;
  Document.prototype.querySelector = function (sel) { const r = qs.call(this, sel); if (!r && /^#[\\w-]+$/.test(sel)) miss(sel.slice(1)); return r; };
})();`;

async function newTab(name, w, h) {
  const { browserContextId } = await send('Target.createBrowserContext', { disposeOnDetach: true });
  const { targetId } = await send('Target.createTarget', { url: 'about:blank', browserContextId });
  const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
  const tab = { name, sessionId, targetId, browserContextId, errors: [] };
  sessions.set(sessionId, tab);
  await send('Runtime.enable', {}, sessionId);
  await send('Page.enable', {}, sessionId);
  await send('Page.addScriptToEvaluateOnNewDocument', { source: PRELUDE }, sessionId);
  await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: w < 768 }, sessionId);
  return tab;
}
async function closeTab(tab) {
  try { await send('Target.closeTarget', { targetId: tab.targetId }); } catch (e) {}
  try { await send('Target.disposeBrowserContext', { browserContextId: tab.browserContextId }); } catch (e) {}
  sessions.delete(tab.sessionId);
}
async function ev(tab, expr) {
  const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true }, tab.sessionId);
  if (r.exceptionDetails) throw new Error((r.exceptionDetails.exception && r.exceptionDetails.exception.description) || r.exceptionDetails.text);
  return r.result && r.result.value;
}
async function settle(tab) {
  for (let i = 0; i < 150; i++) {
    const busy = await ev(tab, `typeof lz !== 'undefined' && lz.busy > 0`).catch(() => false);
    if (!busy) break;
    await wait(40);
  }
  await wait(80);
}
async function open(tab, url, motion) {
  await send('Page.navigate', { url }, tab.sessionId);
  let up = false;
  for (let i = 0; i < 150 && !up; i++) {
    await wait(150);
    const ok = await ev(tab, `typeof appState !== 'undefined' && document.readyState === 'complete' && (() => { const l = document.getElementById('app-loader'); return !l || l.style.display === 'none' || l.classList.contains('hidden'); })()`).catch(() => false);
    if (ok) up = true;
  }
  if (!up) throw new Error(tab.name + ': the app did not open at ' + url + ' (' + tab.errors.join(' | ') + ')');
  // The web fonts in, or the first screen is measured in the fallback face in one build and not the other.
  await ev(tab, `document.fonts.ready.then(() => 1)`);
  await wait(400);
  if (motion !== undefined) {
    await ev(tab, `(() => { localStorage.setItem('ashryMotion', ${JSON.stringify(motion)}); applyMotionPref(); return 1; })()`);
  }
  // Still: no transitions or animations mid-way (GEMINI.md, Sweeping the UI). Appended to <body>,
  // where it outweighs the app's own sheets (Traps: a style a test adds to <head> loses).
  await ev(tab, `(() => { const s = document.createElement('style'); s.id = '__cmp_still'; s.textContent = '*,*::before,*::after{transition:none!important;animation:none!important;caret-color:transparent!important}'; document.body.appendChild(s); return 1; })()`);
}
const setLook = (tab, lang, dark) => ev(tab, `(() => {
  if (appState.lang !== '${lang}') toggleLanguage();
  if (document.body.classList.contains('dark') !== ${dark}) toggleDarkMode();
  document.body.classList.remove('theme-transition');
  window.dispatchEvent(new Event('resize')); return 1; })()`);

/* --- what is compared --------------------------------------------------------------------- */
const PROPS = ['display', 'position', 'top', 'right', 'bottom', 'left', 'width', 'height', 'min-width', 'max-width', 'min-height', 'max-height',
  'margin-top', 'margin-right', 'margin-bottom', 'margin-left', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
  'color', 'background-color', 'background-image', 'border-top-width', 'border-right-width', 'border-bottom-width', 'border-left-width',
  'border-top-color', 'border-top-style', 'border-top-left-radius', 'box-shadow', 'outline-style',
  'font-family', 'font-size', 'font-weight', 'font-style', 'line-height', 'letter-spacing', 'text-align', 'text-transform', 'white-space', 'direction',
  'grid-template-columns', 'grid-template-rows', 'grid-column-start', 'grid-row-start', 'column-gap', 'row-gap',
  'flex-direction', 'flex-wrap', 'justify-content', 'align-items', 'align-self', 'flex-grow', 'flex-shrink', 'flex-basis', 'order',
  'transform', 'opacity', 'z-index', 'visibility', 'overflow-x', 'overflow-y', 'aspect-ratio', 'filter', 'clip-path', 'cursor', 'pointer-events'];
const GEOMETRY = new Set(['top', 'right', 'bottom', 'left', 'width', 'height', 'grid-template-columns', 'grid-template-rows', 'flex-basis', 'transform']);

/* Every element of the screen on show, the header, the bar and the open popups: path → values.
   `chain` keys by tags and classes instead of places (rooms: the deals differ). */
const COLLECT = (chain) => `(() => {
  // Script-driven motion (element.animate) is past the still style: brought to its end.
  document.getAnimations().forEach(a => { try { a.finish(); } catch (e) { try { a.cancel(); } catch (e2) {} } });
  const PROPS = ${JSON.stringify(PROPS)};
  const out = {};
  const key = (el, rootEl, rootName) => {
    const parts = [];
    for (let n = el; n && n !== rootEl; n = n.parentElement) {
      if (${chain}) parts.unshift(n.tagName.toLowerCase() + [...n.classList].filter(c => !/^(is-|has-|view-enter|ripple)/.test(c)).sort().map(c => '.' + c).join(''));
      else { let i = 0; for (let s = n.previousElementSibling; s; s = s.previousElementSibling) i++; parts.unshift(n.tagName.toLowerCase() + ':' + i); }
    }
    return rootName + ' > ' + parts.join(' > ');
  };
  const take = (rootEl, rootName) => {
    if (!rootEl) return;
    [rootEl, ...rootEl.querySelectorAll('*')].forEach(el => {
      if (el.closest('script,style,svg defs')) return;
      const k = key(el, rootEl, rootName);
      if (${chain} && out[k]) return;
      const cs = getComputedStyle(el);
      out[k] = PROPS.map(p => cs.getPropertyValue(p));
      // ::before and ::after, which most of the arcade look is drawn with.
      ['::before', '::after'].forEach(ps => { const c = getComputedStyle(el, ps); if (c.content && c.content !== 'none') out[k + ps] = PROPS.map(p => c.getPropertyValue(p)).concat(c.content); });
    });
  };
  const v = appState.currentView;
  take(document.getElementById('view-' + v), '#view-' + v);
  take(document.querySelector('.shell__header'), 'header');
  take(document.querySelector('.shell__nav'), 'nav');
  document.querySelectorAll('.modal-overlay:not(.hidden)').forEach(m => take(m, '#' + m.id));
  return out;
})()`;

let diffs = 0;
const report = [];
/* A screen read a moment apart in each build can differ while something settles (a margin
   for the frame a setup's hero takes to lay out, a clock's ring): a difference is read again
   a second later, and only one that is still there counts. */
async function compareTwice(label, readA, readB) {
  if (!compare(label, await readA(), await readB(), true, true)) return 0;
  await wait(1000);
  return compare(label, await readA(), await readB());
}
function compare(label, a, b, geometry = true, quiet = false) {
  const lines = [];
  for (const k of Object.keys(a)) {
    if (!(k in b)) { lines.push(`only before: ${k}`); continue; }
    PROPS.forEach((p, i) => {
      if (!geometry && GEOMETRY.has(p)) return;
      if (a[k][i] !== b[k][i]) lines.push(`${k} { ${p}: ${a[k][i]} → ${b[k][i]} }`);
    });
    if (a[k].length > PROPS.length && a[k][PROPS.length] !== b[k][PROPS.length]) lines.push(`${k} { content: ${a[k][PROPS.length]} → ${b[k][PROPS.length]} }`);
  }
  for (const k of Object.keys(b)) if (!(k in a)) lines.push(`only after: ${k}`);
  if (lines.length && !quiet) { diffs += lines.length; report.push(`✗ ${label}: ${lines.length} differences\n    ` + lines.slice(0, 25).join('\n    ') + (lines.length > 25 ? `\n    … and ${lines.length - 25} more` : '')); }
  return lines.length;
}
const missesNew = new Map();
async function checkMisses(before, after) {
  const a = new Map(await ev(before, `[...window.__cmpMisses]`)), b = await ev(after, `[...window.__cmpMisses]`);
  b.filter(([id]) => !a.has(id)).forEach(([id, at]) => { if (!missesNew.has(id)) missesNew.set(id, at); });
}

/* --- every screen ---------------------------------------------------------------------- */
async function screens(w, h, looks, motion) {
  const before = await newTab('before', w, h), after = await newTab('after', w, h);
  await open(before, BASE + '/before/', motion); await open(after, BASE + '/after/', motion);
  const views = await ev(before, `[...document.querySelectorAll('[id^="view-"]')].map(v => v.id.slice(5)).filter(id => id.indexOf('room-') !== 0)`);
  let n = 0, bad = 0;
  for (const [lang, dark] of looks) {
    await setLook(before, lang, dark); await setLook(after, lang, dark);
    for (const v of views) {
      for (const tab of [before, after]) { await ev(tab, `(() => { setView(${JSON.stringify(v)}); closeAllModals(); return 1; })()`); await settle(tab); }
      // The header's title changes over a timer (about 100 ms): both are read once it has.
      await wait(300);
      n++;
      if (await compareTwice(`${v} at ${w}x${h} ${lang} ${dark ? 'dark' : 'light'}${motion ? ' motion ' + motion : ''}`,
        () => ev(before, COLLECT(false)), () => ev(after, COLLECT(false)))) bad++;
    }
  }
  await checkMisses(before, after);
  const errs = [before, after].map((t) => t.errors.splice(0));
  if (errs[1].length > errs[0].length) report.push(`✗ errors only in the after build at ${w}x${h}: ${[...new Set(errs[1])].filter((e) => !errs[0].includes(e)).join(' | ')}`);
  console.log(`  ${n - bad}/${n} screens the same at ${w}x${h}${motion ? ' (motion ' + motion + ')' : ''}`);
  await closeTab(before); await closeTab(after);
}

/* --- every game started from its setup's Start (as test-ui.mjs does), on one phone ---------- */
async function games(w, h) {
  const before = await newTab('before', w, h), after = await newTab('after', w, h);
  await open(before, BASE + '/before/'); await open(after, BASE + '/after/');
  const setups = await ev(before, `[...document.querySelectorAll('[id^="view-setup-"]')].map(v => v.id.slice(5))`);
  let n = 0, bad = 0;
  const START = (id) => `(() => {
    const v = document.getElementById('view-${id}');
    const btn = v && [...v.querySelectorAll('.view-actions--start button, .view-actions button')].find(b => b.offsetWidth && !b.closest('.mode-online-panel'));
    if (!btn) return ''; btn.click(); return 'clicked'; })()`;
  for (const id of setups) {
    const went = [];
    for (const tab of [before, after]) {
      await ev(tab, `(() => { setView(${JSON.stringify(id)}); closeAllModals(); return 1; })()`);
      await settle(tab); await wait(150);
      went.push(await ev(tab, START(id)));
      await wait(900); await settle(tab);
    }
    const [va, vb] = [await ev(before, 'appState.currentView'), await ev(after, 'appState.currentView')];
    if (!went[0] || /^room-/.test(va || '')) {
      for (const tab of [before, after]) await ev(tab, `(async () => { try { if (Room.state) await Room.leave(); } catch (e) {} closeAllModals(); setView('menu'); return 1; })()`);
      continue;
    }
    n++;
    if (went[0] !== went[1] || va !== vb) { report.push(`✗ ${id} started: on ${va} before, ${vb} after`); diffs++; bad++; }
    else if (await compareTwice(`${id} → ${va} at ${w}x${h}`, () => ev(before, COLLECT(false)), () => ev(after, COLLECT(false)))) bad++;
    for (const tab of [before, after]) await ev(tab, `(() => { closeAllModals(); setView('menu'); return 1; })()`);
  }
  await checkMisses(before, after);
  const errs = [before, after].map((t) => t.errors.splice(0));
  const only = [...new Set(errs[1])].filter((e) => !errs[0].includes(e));
  if (only.length) report.push(`✗ errors only in the after build, games at ${w}x${h}: ${only.join(' | ')}`);
  console.log(`  ${n - bad}/${n} games the same once started at ${w}x${h}`);
  await closeTab(before); await closeTab(after);
}

/* --- room games ------------------------------------------------------------------------- */
/* One room, played by the "before" build's phones and TV; each of them has a twin in the
   "after" build that is the same player (the same saved room session, a second socket - the
   server takes several per player), so both builds draw exactly the same state. */
async function rooms() {
  try { const r = await fetch(ROOMS + '/health'); if (!r.ok) throw new Error(r.status); }
  catch (e) { report.push(`✗ rooms: no rooms server at ${ROOMS}`); diffs++; return; }
  const shapes = [['host', 375, 812, 'ar', false], ['phone', 1280, 720, 'en', true], ['tv', 1280, 720, 'ar', true]];
  const A = [], B = [];
  for (const [nm, w, h, lang, dark] of shapes) {
    const a = await newTab('before-' + nm, w, h), b = await newTab('after-' + nm, w, h);
    await open(a, `${BASE}/before/`); await open(b, `${BASE}/after/`);
    await setLook(a, lang, dark); await setLook(b, lang, dark);
    A.push(a); B.push(b);
  }
  const code = await ev(A[0], `(async () => { await Room.create('منى'); return Room.state.code; })()`);
  await ev(A[1], `(async () => { await Room.join(${JSON.stringify(code)}, 'Sara'); return 1; })()`);
  await ev(A[2], `(async () => { await Room.join(${JSON.stringify(code)}, 'TV', true); return 1; })()`);
  for (let i = 0; i < 3; i++) {
    const saved = await ev(A[i], `JSON.stringify({ r: localStorage.getItem('ashryRoom_v2'), n: localStorage.getItem('ashryName') })`);
    await ev(B[i], `(async () => { const s = ${saved}; localStorage.setItem('ashryRoom_v2', s.r); if (s.n) localStorage.setItem('ashryName', s.n); await Room.resume(); return 1; })()`);
  }
  await wait(800);
  const games = await ev(A[0], `ROOM_HUB_GAMES.map(g => g.id)`);
  const show = (t) => ev(t, `(() => { if (Room.state && appState.currentView.indexOf('room-') !== 0) roomReturnToActive(); return appState.currentView; })()`);
  const look = async (label) => {
    let bad = 0;
    for (let i = 0; i < 3; i++) {
      for (const t of [A[i], B[i]]) { await show(t); await settle(t); }
      await wait(400);
      const va = await ev(A[i], 'appState.currentView'), vb = await ev(B[i], 'appState.currentView');
      if (va !== vb) { report.push(`✗ ${label} (${shapes[i][0]}): on ${va} before, ${vb} after`); diffs++; bad++; continue; }
      if (await compareTwice(`${label}, ${shapes[i].slice(0, 3).join(' ')} (${va})`, () => ev(A[i], COLLECT(false)), () => ev(B[i], COLLECT(false)))) bad++;
    }
    return bad;
  };
  let same = 0;
  for (const g of games) {
    await ev(A[0], `(async () => { try { await Room.act('chooseGame', { game: ${JSON.stringify(g)} }); } catch (e) {} return 1; })()`);
    await wait(700);
    let bad = await look(`${g} lobby`);
    await ev(A[0], `(async () => { const x = ROOM_GAMES[${JSON.stringify(g)}]; try { await Room.act('start', x && x.startPayload ? x.startPayload() : {}); } catch (e) {} return 1; })()`);
    await wait(1500);
    bad += await look(`${g} room`);
    if (!bad) same++;
    await ev(A[0], `(async () => { try { await Room.act('backToHub', {}); } catch (e) {} return 1; })()`);
    await wait(400);
  }
  for (let i = 0; i < 3; i++) await checkMisses(A[i], B[i]);
  const errs = [A, B].map((side) => side.flatMap((t) => t.errors.splice(0)));
  const only = [...new Set(errs[1])].filter((e) => !errs[0].includes(e));
  if (only.length) report.push(`✗ errors only in the after build's room: ${only.join(' | ')}`);
  console.log(`  ${same}/${games.length} room games the same, lobby and game, on two phones and a TV`);
  await ev(A[0], `(async () => { try { await Room.leave(); } catch (e) {} return 1; })()`).catch(() => {});
  for (const t of A.concat(B)) await closeTab(t);
}

const LOOKS = [['ar', false], ['en', true]];
try {
  if (ONLY.includes('screens')) { console.log('• every screen'); for (const [w, h] of SIZES) await screens(w, h, LOOKS); }
  if (ONLY.includes('games')) { console.log('• every game started'); for (const [w, h] of SIZES) await games(w, h); }
  if (ONLY.includes('motion')) {
    console.log('• the motion setting');
    const [w, h] = SIZES[0];
    await screens(w, h, [['ar', false]], 'on');
    await screens(w, h, [['en', true]], 'off');
  }
  if (ONLY.includes('rooms')) { console.log('• room games'); await rooms(); }
} finally {
  chrome.kill();
  server.close();
}
// Not counted: a lookup that finds nothing is often a check (playExitRows looks for every game's
// screen, setView's door asks for a screen before its chunk). Each one is to be read: the code
// must cope with null there, or reach the element only once its chunk has come.
if (missesNew.size) console.log(`• looked up by id and not found, only in the after build (where from):\n    ${[...missesNew].map(([id, at]) => id + '  (' + at + ')').join('\n    ')}`);
console.log(report.join('\n'));
console.log(diffs ? `${diffs} differences` : 'No differences.');
try { fs.rmSync(TMP, { recursive: true, force: true }); } catch (e) {}
process.exit(diffs ? 1 : 0);
