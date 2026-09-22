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
 *   GET  /test                                    connection test page
 *
 * Bodies are JSON sent as text/plain, which browsers send without a CORS
 * preflight - one round trip instead of two. Every answer is { ok, ... }; an
 * error is { ok: false, error } with the message the app shows.
 *
 * Anything else is looked up in the built app (docs/, see [assets] in
 * wrangler.toml) before it reaches this code.
 */
import { RULES_HASH } from '../generated/rules.js';
import { Room } from './room.js';
import { PromptMemory } from './memory.js';
import { LiveStats } from './live.js';
import TEST_PAGE from './page.js';

export { Room, PromptMemory, LiveStats };

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
    return { ok: false, error: 'تعذر إنشاء غرفة، حاول مرة أخرى' };
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
        return json({ ok: false, error: 'تعذر الاتصال بالخادم' }, 500);
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

    if (url.pathname === '/test') {
      return new Response(TEST_PAGE, { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' } });
    }
    // `rules`: the fingerprint of the rules this server was built from (fingerprint.mjs).
    if (url.pathname === '/health') return json({ ok: true, rules: RULES_HASH });

    return new Response('not found', { status: 404 });
  }
};
