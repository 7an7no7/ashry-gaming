/*
 * ashry-rooms - the rooms server on Cloudflare Workers + Durable Objects.
 *
 * The app (GitHub Pages) talks to this address:
 *
 *   POST /create  { name, game, screen }         -> { playerId, key, state }
 *   POST /join    { code, name, screen }         -> { playerId, key, state }
 *   POST /act     { code, pid, key, action, payload }
 *   POST /poll    { code, pid, key, v }          (fallback when WebSockets fail)
 *   POST /leave   { code, pid, key }
 *   GET  /ws?code=&pid=&key=                     the live connection
 *   GET  /live                                    -> { players, rooms } playing right now
 *   POST /count   { game }                        a game started on one phone (counted, nothing else kept)
 *   POST /report  { game, text, lang }            «في غلطة؟»: an item a player says is wrong
 *   POST /err     { b, m, f, v }                  an error on a player's phone (build, message, frame, view)
 *   GET|DELETE /errors                            what /err kept (the admin key)
 *   POST /crew/create { name, me }              -> «الشلة»: { code, memberId, key, crew }
 *   POST /crew/join   { code, claim | name }    -> the same, for a member claimed or someone new
 *   POST /crew/peek   { code }                  -> the crew's name and members (the join sheet)
 *   POST /crew/get    { code, key }             -> the crew's page (a member's key)
 *   POST /crew/act    { code, key, action, payload }  rename, renameMember, removeMember, handOver, leave, addPack, removePack
 *   POST /pack/create { kind, pack }             «اعمل مسابقتك» / «كلماتنا»: -> { code, key }
 *   POST /pack/get    { code }                     -> { kind, pack, updated }
 *   POST /pack/save   { code, key, kind, pack }    the author's change (the key the create gave)
 *   POST /pack/played { code }                     a pack played on one phone: its year starts again
 *   GET  /test                                    connection test page
 *
 * Bodies are JSON sent as text/plain, which browsers send without a CORS
 * preflight - one round trip instead of two. Every answer is { ok, ... }; an
 * error is { ok: false, error } with the message the app shows.
 *
 * Anything else is looked up in the built app (docs/, see [assets] in
 * wrangler.toml) before it reaches this code.
 */
import { RULES_HASH, APP_GAME_IDS, APP_REPORT_IDS, CREW_CODE_RE, crewNewCode, PACK_ALPHABET, PACK_CODE_LEN, PACK_CODE_RE, packClean, packCode } from '../generated/rules.js';
import { Room } from './room.js';
import { PromptMemory } from './memory.js';
import { LiveStats } from './live.js';
import { WordLog } from './words.js';
import { Crew } from './crew.js';
import { PackStore } from './packs.js';
import TEST_PAGE from './page.js';

export { Room, PromptMemory, LiveStats, WordLog, Crew, PackStore };

// Every phone looking at the مع بعض tab asks for the count; this Worker asks
// LiveStats at most this often and answers the rest from what it last heard.
const LIVE_CACHE_MS = 15000;
let liveCache = null;   // { at, body }

// No O/0/I/1 - they get misread when someone reads a code out loud.
const ROOM_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const ROOM_CODE_LEN = 4;
const CODE_PATTERN = /^[A-Z0-9]{4,8}$/;
const MAX_BODY = 64 * 1024;

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400'
};

const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...CORS }
});

const cleanCode = (raw) => String(raw || '').trim().toUpperCase();
const roomStub = (env, code) => env.ROOMS.get(env.ROOMS.idFromName(code));

// Opening rooms is capped per address, so a script can't spend the free plan's
// requests making them. Far above any real table (a household shares one
// address), and above the robot tests (npm run test:live opens about 20 rooms a
// run from one address). Per Worker instance - a light brake, not a wall.
const CREATE_LIMIT = 60;
const CREATE_WINDOW_MS = 10 * 60 * 1000;
const createdBy = new Map();   // address -> { n, since }
const createAllowed = (request) => {
  const ip = request.headers.get('CF-Connecting-IP') || '';
  if (!ip) return true;
  const now = Date.now();
  if (createdBy.size > 5000) {
    for (const [k, v] of createdBy) if (now - v.since > CREATE_WINDOW_MS) createdBy.delete(k);
  }
  const seen = createdBy.get(ip);
  if (!seen || now - seen.since > CREATE_WINDOW_MS) { createdBy.set(ip, { n: 1, since: now }); return true; }
  seen.n++;
  return seen.n <= CREATE_LIMIT;
};

// «الشلة»: making and joining crews, per address. A family joins a handful of phones;
// a script can't fill the free plan's storage with crews.
const CREW_LIMIT = 30;
const CREW_WINDOW_MS = 10 * 60 * 1000;
const crewedBy = new Map();
const crewAllowed = (request) => {
  const ip = request.headers.get('CF-Connecting-IP') || '';
  if (!ip) return true;
  const now = Date.now();
  if (crewedBy.size > 5000) {
    for (const [k, v] of crewedBy) if (now - v.since > CREW_WINDOW_MS) crewedBy.delete(k);
  }
  const seen = crewedBy.get(ip);
  if (!seen || now - seen.since > CREW_WINDOW_MS) { crewedBy.set(ip, { n: 1, since: now }); return true; }
  seen.n++;
  return seen.n <= CREW_LIMIT;
};
const crewRandom = () => {
  const b = new Uint32Array(1);
  crypto.getRandomValues(b);
  return b[0] / 4294967296;
};

/** «الشلة»'s endpoints (crew.js): every answer { ok, ... }, an error the message the app shows. */
async function handleCrew(env, path, body) {
  if (!env.CREWS) return { ok: false, error: 'unavailable' };
  const stub = (code) => env.CREWS.get(env.CREWS.idFromName(code));
  if (path === '/crew/create') {
    for (let attempt = 0; attempt < 8; attempt++) {
      const code = crewNewCode(crewRandom);
      const res = await stub(code).create(code, body.name, body.me);
      if (!res.taken) return res;
    }
    return { ok: false, error: 'معرفناش نعمل الشلة، جرّب تاني' };
  }
  const code = String(body.code || '').trim().toUpperCase();
  if (!CREW_CODE_RE.test(code)) return { ok: false, error: 'CREW_NOT_FOUND' };
  const crew = stub(code);
  if (path === '/crew/peek') return crew.peek();
  if (path === '/crew/join') return crew.join(body.claim ? String(body.claim) : '', body.name);
  if (path === '/crew/get') return crew.get(String(body.key || ''));
  return crew.act(String(body.key || ''), String(body.action || ''), body.payload);
}
const CREW_API = new Set(['/crew/create', '/crew/join', '/crew/peek', '/crew/get', '/crew/act']);

// A phone starts a game every few minutes; 120 counts an hour from one address
// is a whole busy household, and a script can't fill the count.
const COUNT_LIMIT = 120;
const COUNT_WINDOW_MS = 60 * 60 * 1000;
const countedBy = new Map();
const countAllowed = (request) => {
  const ip = request.headers.get('CF-Connecting-IP') || '';
  if (!ip) return true;
  const now = Date.now();
  if (countedBy.size > 5000) {
    for (const [k, v] of countedBy) if (now - v.since > COUNT_WINDOW_MS) countedBy.delete(k);
  }
  const seen = countedBy.get(ip);
  if (!seen || now - seen.since > COUNT_WINDOW_MS) { countedBy.set(ip, { n: 1, since: now }); return true; }
  seen.n++;
  return seen.n <= COUNT_LIMIT;
};

// A page sends at most ten errors a load (JS_Core.html); 40 an hour from one address
// is a household reloading a broken screen, and a script can't fill the log.
const ERR_LIMIT = 40;
const ERR_WINDOW_MS = 60 * 60 * 1000;
const erredBy = new Map();
const errAllowed = (request) => {
  const ip = request.headers.get('CF-Connecting-IP') || '';
  if (!ip) return true;
  const now = Date.now();
  if (erredBy.size > 5000) {
    for (const [k, v] of erredBy) if (now - v.since > ERR_WINDOW_MS) erredBy.delete(k);
  }
  const seen = erredBy.get(ip);
  if (!seen || now - seen.since > ERR_WINDOW_MS) { erredBy.set(ip, { n: 1, since: now }); return true; }
  seen.n++;
  return seen.n <= ERR_LIMIT;
};

/**
 * One error from a page, made safe to keep: the build, the view, a short message
 * with anything that could be a player's text or an address blanked out, and the
 * first frame of the page's own code. The device kind comes from the User-Agent
 * header (never stored whole). Returns null for something not worth keeping.
 */
function errEntry(body, ua) {
  const build = /^[0-9]{8,14}$/.test(String(body.b || '')) ? String(body.b) : 'unknown';
  const view = /^[a-z0-9-]{1,40}$/.test(String(body.v || '')) ? String(body.v) : '?';
  let msg = String(body.m || '').replace(/\s+/g, ' ').trim().slice(0, 300);
  if (!msg) return null;
  msg = msg
    .replace(/https?:\/\/[^\s'"()]+/g, '<url>')
    .replace(/[\w.+-]+@[\w-]+\.[\w.]+/g, '<email>')
    // A quoted piece is kept only when it reads like code (a property, a function name).
    .replace(/(['"`])([^'"`]*)\1/g, (all, q, inner) => (/^[\w$.#\[\]-]{1,40}$/.test(inner) ? all : q + '…' + q))
    .replace(/\d{3,}/g, '#')
    .slice(0, 100);
  const frame = String(body.f || '').replace(/[^\w$.@:<>/-]/g, '').slice(0, 56) || '?';   // 100 + ' @ ' + 56 fits the log's 160
  const s = String(ua || '');
  const os = /iPhone|iPad|iPod/.test(s) ? 'ios' : /Android/.test(s) ? 'android'
    : /SmartTV|SMART-TV|Tizen|Web0S|webOS|CrKey|AFT|BRAVIA/i.test(s) ? 'tv' : 'desktop';
  const br = /FBAN|FBAV|Instagram|TikTok|GSA\//.test(s) ? 'inapp'
    : /SamsungBrowser/.test(s) ? 'samsung'
    : /EdgiOS|EdgA|Edg\//.test(s) ? 'edge'
    : /FxiOS|Firefox\//.test(s) ? 'firefox'
    : /CriOS|Chrome\//.test(s) ? 'chrome'
    : /Safari\//.test(s) ? 'safari' : 'other';
  return { lang: build, cat: view, word: msg + ' @ ' + frame, long: true, keep: true, stamp: true, tag: os + '-' + br };
}

/* --- packs: «اعمل مسابقتك» and «كلماتنا» (30 Sep 2026) -------------------------
   A light brake per address, per Worker instance, like /create: a family writes a
   few quizzes an evening and saves each a few dozen times while writing. */
const limiter = (limit, windowMs) => {
  const by = new Map();
  return (request) => {
    const ip = request.headers.get('CF-Connecting-IP') || '';
    if (!ip) return true;
    const now = Date.now();
    if (by.size > 5000) for (const [k, v] of by) if (now - v.since > windowMs) by.delete(k);
    const seen = by.get(ip);
    if (!seen || now - seen.since > windowMs) { by.set(ip, { n: 1, since: now }); return true; }
    seen.n++;
    return seen.n <= limit;
  };
};
const packCreateAllowed = limiter(20, 10 * 60 * 1000);
const packSaveAllowed = limiter(200, 10 * 60 * 1000);
const packGetAllowed = limiter(400, 10 * 60 * 1000);
// «الشلة»'s lookup by code has its brake too: a hit answers with every member's id, and a
// member is claimed with the code alone, so codes mustn't be tried one after another.
const crewPeekAllowed = limiter(120, 10 * 60 * 1000);
const PACK_KINDS = ['quiz', 'words'];
const packStub = (env, code) => env.PACKS.get(env.PACKS.idFromName('pack:' + code));

const randomOf = (alphabet, n) => {
  const bytes = new Uint8Array(n);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('');
};
/** The edit key's SHA-256, hex: the only form the server keeps it in. */
const keyHash = async (key) => {
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(String(key || '')));
  return Array.from(new Uint8Array(d), (b) => b.toString(16).padStart(2, '0')).join('');
};

async function handlePack(env, request, path, body) {
  if (path === '/pack/create') {
    if (!packCreateAllowed(request)) return { ok: false, error: 'busy' };
    const kind = String(body.kind || '');
    if (PACK_KINDS.indexOf(kind) === -1) return { ok: false, error: 'kind' };
    const clean = packClean(kind, body.pack);
    if (clean.error) return { ok: false, error: clean.error, at: clean.at };
    const key = randomOf('abcdefghijkmnopqrstuvwxyz23456789', 24);
    const hash = await keyHash(key);
    for (let attempt = 0; attempt < 8; attempt++) {
      const code = randomOf(PACK_ALPHABET, PACK_CODE_LEN);
      const res = await packStub(env, code).create(kind, clean.pack, hash);
      if (!res.taken) return { ok: true, code, key, pack: clean.pack };
    }
    return { ok: false, error: 'busy' };
  }
  const code = packCode(body.code);
  if (!PACK_CODE_RE.test(code)) return { ok: false, error: 'not_found' };
  if (path === '/pack/get' || path === '/pack/played') {
    if (!packGetAllowed(request)) return { ok: false, error: 'busy' };
    const got = await packStub(env, code).get(path === '/pack/played');
    if (!got) return { ok: false, error: 'not_found' };
    return path === '/pack/played' ? { ok: true } : { ok: true, code, kind: got.kind, pack: got.pack, updated: got.updated };
  }
  // '/pack/save'
  if (!packSaveAllowed(request)) return { ok: false, error: 'busy' };
  const kind = String(body.kind || '');
  const clean = packClean(kind, body.pack);
  if (clean.error) return { ok: false, error: clean.error, at: clean.at };
  const res = await packStub(env, code).save(kind, clean.pack, await keyHash(body.key));
  if (res.gone) return { ok: false, error: 'not_found' };
  if (res.denied) return { ok: false, error: 'denied' };
  return { ok: true, code, pack: clean.pack, updated: res.updated };
}
const PACK_API = new Set(['/pack/create', '/pack/get', '/pack/save', '/pack/played']);

const randomCode = () => {
  const bytes = new Uint8Array(ROOM_CODE_LEN);
  crypto.getRandomValues(bytes);
  // 32 letters divide 256 exactly, so every code is equally likely.
  return Array.from(bytes, (b) => ROOM_ALPHABET[b % ROOM_ALPHABET.length]).join('');
};

async function handle(env, path, body) {
  if (path === '/create') {
    // Codes are short, so a live one may already hold the name; try another.
    for (let attempt = 0; attempt < 8; attempt++) {
      const code = randomCode();
      const res = await roomStub(env, code).create(code, body.name, body.game, !!body.screen);
      if (!res.taken) return res;
    }
    return { ok: false, error: 'معرفناش نفتح الغرفة، جرّب تاني' };
  }

  const code = cleanCode(body.code);
  const pid = String(body.pid || '');
  const key = String(body.key || '');
  if (!CODE_PATTERN.test(code)) {
    return path === '/poll' || path === '/leave' ? { ok: true, gone: true } : { ok: false, error: 'ROOM_NOT_FOUND' };
  }
  const room = roomStub(env, code);
  if (path === '/join') return room.join(body.name, !!body.screen);
  if (path === '/act') return room.act(pid, key, body.action, body.payload);
  if (path === '/poll') return room.poll(pid, key, body.v);
  return room.leave(pid, key);
}

const API = new Set(['/create', '/join', '/act', '/poll', '/leave']);

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });

    if (url.pathname === '/ws') {
      const code = cleanCode(url.searchParams.get('code'));
      if (!CODE_PATTERN.test(code)) return new Response('bad room code', { status: 400 });
      return roomStub(env, code).fetch(request);
    }

    if (API.has(url.pathname)) {
      if (request.method !== 'POST') return json({ ok: false, error: 'POST only' }, 405);
      let body;
      try {
        const text = await request.text();
        if (text.length > MAX_BODY) throw new Error('too big');
        body = JSON.parse(text || '{}') || {};
      } catch (e) {
        return json({ ok: false, error: 'bad request' }, 400);
      }
      if (url.pathname === '/create' && !createAllowed(request)) {
        return json({ ok: false, error: 'فتحت غرف كتير في وقت قصير، استنى شوية وجرب تاني' }, 429);
      }
      try {
        return json(await handle(env, url.pathname, body));
      } catch (err) {
        console.error(url.pathname, err && err.stack || err);
        return json({ ok: false, error: 'مش قادرين نوصل للسيرفر، جرّب تاني' }, 500);
      }
    }

    if (PACK_API.has(url.pathname)) {
      if (request.method !== 'POST') return json({ ok: false, error: 'POST only' }, 405);
      let body;
      try {
        const text = await request.text();
        if (text.length > MAX_BODY) throw new Error('too big');
        body = JSON.parse(text || '{}') || {};
      } catch (e) {
        return json({ ok: false, error: 'too_big' }, 400);
      }
      try {
        return json(await handlePack(env, request, url.pathname, body));
      } catch (err) {
        console.error(url.pathname, err && err.stack || err);
        return json({ ok: false, error: 'server' }, 500);
      }
    }

    if (CREW_API.has(url.pathname)) {
      if (request.method !== 'POST') return json({ ok: false, error: 'POST only' }, 405);
      let body;
      try {
        const text = await request.text();
        if (text.length > 16 * 1024) throw new Error('too big');
        body = JSON.parse(text || '{}') || {};
      } catch (e) {
        return json({ ok: false, error: 'bad request' }, 400);
      }
      if (((url.pathname === '/crew/create' || url.pathname === '/crew/join') && !crewAllowed(request)) ||
          (url.pathname === '/crew/peek' && !crewPeekAllowed(request))) {
        return json({ ok: false, error: 'حاولت كتير في وقت قصير، استنى شوية وجرب تاني' }, 429);
      }
      try {
        return json(await handleCrew(env, url.pathname, body));
      } catch (err) {
        console.error(url.pathname, err && err.stack || err);
        return json({ ok: false, error: 'مش قادرين نوصل للسيرفر، جرّب تاني' }, 500);
      }
    }

    if (url.pathname === '/live') {
      const now = Date.now();
      if (!liveCache || now - liveCache.at > LIVE_CACHE_MS) {
        try {
          const counts = await env.LIVE.get(env.LIVE.idFromName('live')).read();
          liveCache = { at: now, body: { ok: true, players: counts.players, rooms: counts.rooms } };
        } catch (err) {
          console.error('/live', err && err.stack || err);
          return json({ ok: false, error: 'unavailable' }, 503);
        }
      }
      return json(liveCache.body);
    }

    // A game started on one phone: its id and the month, no name, no address kept.
    if (url.pathname === '/count') {
      if (request.method !== 'POST') return json({ ok: false }, 405);
      try {
        const text = await request.text();
        const body = JSON.parse(text.length < 200 ? text : '{}') || {};
        const game = String(body.game || '');
        // Only a game the app has (GameIds.js): the log keeps what it has once full, so a made-up id is never kept.
        if (APP_GAME_IDS.indexOf(game) !== -1 && countAllowed(request)) {
          await env.WORDS.get(env.WORDS.idFromName('plays'))
            .add([{ lang: 'device', cat: new Date().toISOString().slice(0, 7), word: game, keep: true }]);
        }
      } catch (err) { /* a count is never worth an error */ }
      return json({ ok: true });
    }

    // «في غلطة؟»: a question, a riddle or a card a player says is wrong. The game,
    // the language and the item's text; no name, no address kept.
    if (url.pathname === '/report') {
      if (request.method !== 'POST') return json({ ok: false }, 405);
      try {
        const text = await request.text();
        const body = JSON.parse(text.length < 2000 ? text : '{}') || {};
        const game = String(body.game || '');
        const item = String(body.text || '').trim();
        const lang = body.lang === 'en' ? 'en' : 'ar';
        if (APP_REPORT_IDS.indexOf(game) !== -1 && item && countAllowed(request)) {
          await env.WORDS.get(env.WORDS.idFromName('reports')).add([{ lang, cat: game, word: item, long: true, keep: true }]);
        }
      } catch (err) { /* a report is never worth an error */ }
      return json({ ok: true });
    }

    // An error on a player's phone (JS_Core.html's reporter): no name, no room code, no
    // address kept - the build, the screen, the message and where in the page, and the
    // kind of device. Answered 204 whatever happens: a report is never worth an error.
    if (url.pathname === '/err') {
      if (request.method !== 'POST') return json({ ok: false }, 405);
      try {
        const text = await request.text();
        const body = JSON.parse(text.length < 2000 ? text : '{}') || {};
        const entry = errEntry(body, request.headers.get('User-Agent'));
        if (entry && errAllowed(request)) {
          await env.WORDS.get(env.WORDS.idFromName('errors')).add([entry]);
        }
      } catch (err) { /* never an error about an error */ }
      return new Response(null, { status: 204, headers: CORS });
    }

    // What /err kept, for the owner (npm run errors); DELETE empties it once read.
    if (url.pathname === '/errors') {
      const auth = request.headers.get('Authorization') || '';
      if (!env.ADMIN_KEY || auth !== `Bearer ${env.ADMIN_KEY}`) return new Response('not found', { status: 404 });
      try {
        const log = env.WORDS.get(env.WORDS.idFromName('errors'));
        if (request.method === 'DELETE') { await log.clear(); return json({ ok: true }); }
        if (request.method !== 'GET') return new Response('not found', { status: 404 });
        const list = await log.list();
        list.sort((a, b) => b.n - a.n);
        return json(list);
      } catch (err) {
        return json({ ok: false, error: 'unavailable' }, 500);
      }
    }

    if (url.pathname === '/plays' || url.pathname === '/reports') {
      if (request.method !== 'GET') return new Response('not found', { status: 404 });
      const auth = request.headers.get('Authorization') || '';
      if (!env.ADMIN_KEY || auth !== `Bearer ${env.ADMIN_KEY}`) return new Response('not found', { status: 404 });
      try {
        const list = await env.WORDS.get(env.WORDS.idFromName(url.pathname.slice(1))).list();
        list.sort((a, b) => b.n - a.n);
        return json(list);
      } catch (err) {
        return json({ ok: false, error: 'unavailable' }, 500);
      }
    }

    if (url.pathname === '/stop-words') {
      if (request.method !== 'GET') return new Response('not found', { status: 404 });
      const auth = request.headers.get('Authorization') || '';
      const adminKey = env.ADMIN_KEY;
      if (!adminKey || auth !== `Bearer ${adminKey}`) return new Response('not found', { status: 404 });
      try {
        const list = await env.WORDS.get(env.WORDS.idFromName('stop')).list();
        list.sort((a, b) => b.n - a.n);
        return json(list);
      } catch (err) {
        console.error('/stop-words', (err && err.stack) || err);
        return json({ ok: false, error: 'unavailable' }, 500);
      }
    }

    if (url.pathname === '/test') {
      return new Response(TEST_PAGE, { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' } });
    }
    // `rules`: the fingerprint of the rules this server was built from (fingerprint.mjs).
    if (url.pathname === '/health') return json({ ok: true, rules: RULES_HASH });

    return new Response('not found', { status: 404 });
  }
};
