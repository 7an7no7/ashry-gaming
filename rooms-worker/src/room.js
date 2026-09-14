/*
 * One room: the group of players, whichever game they are playing, and the
 * connections to their phones. There is one of these Durable Objects per room
 * code, and it replaces Rooms.js from the Apps Script days.
 *
 * Every phone keeps a WebSocket open to its room. A move arrives over it, the
 * rules in RoomGames.js are applied, and every phone is sent what it may see -
 * straight away, instead of phones asking every few seconds.
 *
 * Hidden information stays here: `secrets` only ever leaves inside the
 * projection for the player it belongs to, and each player proves who they are
 * with a key only their own phone was given (player ids are visible to all).
 */
import { DurableObject } from 'cloudflare:workers';
import { ROOM_GAME_IDS, applyRoomAction, roomDeadline, roomTimeout, withPromptMemory } from '../generated/rules.js';

const MAX_PLAYERS = 12;
// A phone on the HTTP fallback (no WebSocket) counts as here this long after it last asked.
const ONLINE_WINDOW_MS = 20000;
// A host gone this long while others are still here hands the room on.
const HOST_AWAY_MS = 120000;
// Rooms delete themselves: after this long with no moves and nobody connected...
const IDLE_MS = 6 * 3600 * 1000;
// ...or after this long with no moves at all, even with a forgotten tab open.
const ABANDONED_MS = 24 * 3600 * 1000;
// Rapid moves (drawing, the dial) are saved at most this often; the phones get them at once.
const QUICK_SAVE_MS = 1000;
const QUICK_ACTIONS = new Set(['addStrokes', 'undoStroke', 'setDial']);
// The actions that deal prompts, which need the shared prompt memory.
const DEAL_ACTIONS = new Set(['start', 'nextRound', 'playAgain']);
const MAX_MESSAGE = 64 * 1024;
const MAX_LIVE = 8 * 1024;

const newPlayerId = () => 'p' + Date.now().toString(36) + Math.floor(Math.random() * 1e6).toString(36);

const newKey = () => {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
};

const errorText = (err) => String((err && err.message) || err || 'خطأ');

export class Room extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.room = undefined;      // undefined: not read yet; null: there is no room
    this.polled = new Map();    // playerId -> last HTTP poll, for phones without a socket
    this.saveTimer = null;
    // Cloudflare answers "ping" itself, without waking the room, so the phones'
    // heartbeat costs nothing.
    ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair('ping', 'pong'));
  }

  /* --- storage ----------------------------------------------------------- */

  async load() {
    if (this.room === undefined) this.room = (await this.ctx.storage.get('room')) || null;
    return this.room;
  }

  /** Quick moves wait up to QUICK_SAVE_MS so a drawing isn't a write per stroke. */
  save(quick) {
    if (quick) {
      if (!this.saveTimer) {
        this.saveTimer = setTimeout(() => {
          this.saveTimer = null;
          if (this.room) this.ctx.storage.put('room', this.room).catch(() => {});
        }, QUICK_SAVE_MS);
      }
      return Promise.resolve();
    }
    clearTimeout(this.saveTimer);
    this.saveTimer = null;
    return this.ctx.storage.put('room', this.room);
  }

  async destroy() {
    clearTimeout(this.saveTimer);
    this.saveTimer = null;
    this.room = null;
    await this.ctx.storage.deleteAlarm();
    await this.ctx.storage.deleteAll();
  }

  touch() {
    this.room.version++;
    this.room.updatedAt = Date.now();
  }

  /* --- who is here --------------------------------------------------------- */

  openSockets(except) {
    return this.ctx.getWebSockets().filter((ws) => ws !== except && ws.readyState <= 1);
  }

  playerOf(ws) {
    const tag = ws.deserializeAttachment();
    return tag ? tag.pid : null;
  }

  onlineIds(except) {
    const ids = new Set();
    for (const ws of this.openSockets(except)) {
      const pid = this.playerOf(ws);
      if (pid) ids.add(pid);
    }
    const now = Date.now();
    for (const [pid, at] of this.polled) if (now - at < ONLINE_WINDOW_MS) ids.add(pid);
    return ids;
  }

  /** 'gone', 'kicked', or null when pid (and key, if given) belong to this room. */
  check(pid, key) {
    const room = this.room;
    if (!room) return 'gone';
    if (!room.players.some((p) => p.id === pid)) return 'kicked';
    if (key !== undefined && (!key || !room.keys || room.keys[pid] !== key)) return 'kicked';
    return null;
  }

  /** What one player may see: the shared state and their own secret. */
  project(pid, online) {
    const room = this.room;
    return {
      code: room.code,
      version: room.version,
      game: room.game,
      phase: room.phase,
      hostId: room.hostId,
      youAreHost: room.hostId === pid,
      players: room.players.map((p) => ({ id: p.id, name: p.name, online: online.has(p.id) })),
      shared: room.shared || {},
      you: (room.secrets && room.secrets[pid]) || null,
      // False for someone who joined after this game was dealt.
      inGame: !room.shared || !room.shared.roster ? true : room.shared.roster.indexOf(pid) !== -1
    };
  }

  /**
   * Sends every connected phone its view. `patch` replaces the full state with a
   * small message everyone applies the same way (new strokes); `skip` is the
   * socket that already has its answer in an ack; `leaving` is a socket on its
   * way out.
   */
  broadcast({ skip = null, leaving = null, patch = null } = {}) {
    if (!this.room) return;
    const online = this.onlineIds(leaving);
    const patchText = patch ? JSON.stringify(patch) : null;
    const views = new Map();
    for (const ws of this.openSockets(leaving)) {
      if (ws === skip) continue;
      const pid = this.playerOf(ws);
      if (!pid) continue;
      let text = patchText || views.get(pid);
      if (!text) {
        text = JSON.stringify({ t: 'state', state: this.project(pid, online) });
        views.set(pid, text);
      }
      try { ws.send(text); } catch (e) {}
    }
  }

  /* --- the prompt memory shared by all rooms ------------------------------- */

  memoryStub() {
    return this.env.MEMORY.get(this.env.MEMORY.idFromName('prompts'));
  }

  async readMemory() {
    try {
      return { values: await this.memoryStub().read(), changed: {} };
    } catch (e) {
      return null;   // the rules fall back to the room's own memory
    }
  }

  /* --- clocks: game deadlines, a missing host, cleanup --------------------- */

  /** Sets the alarm for whatever is due soonest. Only ever brings it forward, unless `replace`. */
  async scheduleAlarm(extra, replace = false) {
    const room = this.room;
    if (!room) return;
    const times = [roomDeadline(room), extra, room.updatedAt + IDLE_MS].filter((t) => typeof t === 'number');
    const soonest = Math.min(...times);
    const current = replace ? null : await this.ctx.storage.getAlarm();
    if (current === null || soonest < current - 250) await this.ctx.storage.setAlarm(soonest);
  }

  async alarm() {
    await this.load();
    const room = this.room;
    if (!room) return;
    const now = Date.now();
    const idle = now - room.updatedAt;

    if (idle >= ABANDONED_MS || (idle >= IDLE_MS && this.onlineIds().size === 0)) {
      for (const ws of this.openSockets()) {
        try { ws.send(JSON.stringify({ t: 'gone' })); ws.close(4000, 'gone'); } catch (e) {}
      }
      await this.destroy();
      return;
    }

    let changed = false;
    let again;

    // A round whose time is up ends, even with every phone asleep.
    const due = roomDeadline(room);
    if (due && now >= due) {
      const next = structuredClone(room);
      try {
        if (roomTimeout(next, now)) { this.room = next; changed = true; }
      } catch (err) {
        console.error('roomTimeout', errorText(err));
      }
    }

    // A host who has been gone a while hands the room to someone still here.
    const online = this.onlineIds();
    const hostId = this.room.hostId;
    if (!online.has(hostId)) {
      this.room.lastSeen = this.room.lastSeen || {};
      const leftAt = this.room.lastSeen[hostId];
      const heir = this.room.players.find((p) => online.has(p.id));
      if (!leftAt) {
        // Never seen leaving (the HTTP fallback, or a restart): the wait starts now.
        this.room.lastSeen[hostId] = now;
        this.save(true);
        if (heir) again = now + HOST_AWAY_MS;
      } else if (heir && now - leftAt >= HOST_AWAY_MS - 1000) {
        this.room.hostId = heir.id;
        changed = true;
      } else if (heir) {
        again = leftAt + HOST_AWAY_MS;
      }
    }

    if (changed) {
      this.touch();
      await this.save();
      this.broadcast();
    }
    // Inside alarm() the alarm that is running may still read as set; replace it outright.
    await this.scheduleAlarm(again, true);
  }

  /* --- the API (called by the Worker in index.js) -------------------------- */

  async create(code, name, game) {
    await this.load();
    if (this.room) {
      // A code is only reused once its old room has been left for good.
      if (Date.now() - this.room.updatedAt < IDLE_MS || this.openSockets().length) return { taken: true };
      await this.destroy();
    }
    const hostId = newPlayerId();
    const key = newKey();
    const now = Date.now();
    this.room = {
      code,
      version: 1,
      // Optional: a room with no game sits in the hub until the host picks one.
      game: ROOM_GAME_IDS.indexOf(game) !== -1 ? game : null,
      phase: 'lobby',
      hostId,
      players: [{ id: hostId, name: String(name || '').trim().slice(0, 24) || 'Host' }],
      shared: {},
      secrets: {},
      keys: { [hostId]: key },
      lastSeen: {},
      createdAt: now,
      updatedAt: now
    };
    await this.save();
    await this.scheduleAlarm();
    this.polled.set(hostId, now);
    return { ok: true, playerId: hostId, key, state: this.project(hostId, this.onlineIds()) };
  }

  async join(rawName) {
    await this.load();
    const room = this.room;
    if (!room) return { ok: false, error: 'ROOM_NOT_FOUND' };
    const name = String(rawName || '').trim().slice(0, 24);
    if (!name) return { ok: false, error: 'اكتب اسمك أولاً' };
    if (room.players.length >= MAX_PLAYERS) return { ok: false, error: 'الغرفة ممتلئة' };
    // Joining mid-game is allowed: the newcomer watches until the next round.
    if (room.players.some((p) => p.name.toLowerCase() === name.toLowerCase())) {
      return { ok: false, error: 'الاسم مستخدم بالفعل في هذه الغرفة' };
    }

    const pid = newPlayerId();
    const key = newKey();
    room.players.push({ id: pid, name });
    room.keys = room.keys || {};
    room.keys[pid] = key;
    this.touch();
    await this.save();
    this.polled.set(pid, Date.now());
    this.broadcast();
    return { ok: true, playerId: pid, key, state: this.project(pid, this.onlineIds()) };
  }

  /** A move. `ws` is the socket it came in on, if any. */
  async act(pid, key, rawAction, rawPayload, ws) {
    await this.load();
    let problem = this.check(pid, key);
    if (problem) return { ok: false, [problem]: true, error: problem === 'gone' ? 'ROOM_NOT_FOUND' : 'NOT_IN_ROOM' };

    const action = String(rawAction || '');
    const payload = rawPayload && typeof rawPayload === 'object' ? rawPayload : {};
    const memory = DEAL_ACTIONS.has(action) ? await this.readMemory() : null;

    // The memory read let other messages in; look at the room as it is now.
    problem = this.check(pid);
    if (problem) return { ok: false, [problem]: true, error: problem === 'gone' ? 'ROOM_NOT_FOUND' : 'NOT_IN_ROOM' };

    // The rules change the room in place and may throw halfway through a move,
    // so they work on a copy that only replaces the room if the move is legal.
    const before = this.room;
    const next = structuredClone(before);
    try {
      withPromptMemory(memory, () => applyRoomAction(next, pid, action, payload));
    } catch (err) {
      return { ok: false, error: errorText(err) };
    }
    this.room = next;
    this.touch();
    if (!ws) this.polled.set(pid, Date.now());

    const quick = QUICK_ACTIONS.has(action);
    await this.save(quick);
    if (memory && Object.keys(memory.changed).length) {
      this.memoryStub().write(memory.changed).catch(() => {});
    }
    if (!quick) await this.scheduleAlarm();

    // New strokes go out as just the strokes: resending a whole drawing to every
    // phone a few times a second would be most of a phone's data.
    let patch = null;
    const was = before.shared && before.shared.strokes;
    const now = next.shared && next.shared.strokes;
    if (action === 'addStrokes' && Array.isArray(was) && Array.isArray(now) && now.length >= was.length) {
      patch = { t: 'strokes', from: before.version, v: next.version, add: now.slice(was.length) };
    }

    this.broadcast({ skip: ws, patch });
    // A move over HTTP gets the whole state back: that phone has no socket to
    // have been following the drawing on.
    return patch && ws
      ? { ok: true, patch }
      : { ok: true, state: this.project(pid, this.onlineIds()) };
  }

  /** The fallback for a phone whose network won't hold a WebSocket open. */
  async poll(pid, key, version) {
    await this.load();
    const problem = this.check(pid, key);
    if (problem) return { ok: true, [problem]: true };
    const wasOnline = this.onlineIds().has(pid);
    this.polled.set(pid, Date.now());
    if (this.room.lastSeen && this.room.lastSeen[pid]) {
      delete this.room.lastSeen[pid];
      this.save(true);
    }
    if (!wasOnline) this.broadcast();
    const online = this.onlineIds();
    if (Number(version) === this.room.version) {
      return { ok: true, same: true, version: this.room.version, online: [...online] };
    }
    return { ok: true, state: this.project(pid, online) };
  }

  async leave(pid, key) {
    await this.load();
    if (this.check(pid, key)) return { ok: true };
    const room = this.room;
    room.players = room.players.filter((p) => p.id !== pid);
    if (room.secrets) delete room.secrets[pid];
    if (room.keys) delete room.keys[pid];
    this.polled.delete(pid);
    // Hand the room to whoever is left rather than orphaning it.
    if (room.hostId === pid && room.players.length) {
      const online = this.onlineIds();
      room.hostId = (room.players.find((p) => online.has(p.id)) || room.players[0]).id;
    }

    for (const ws of this.openSockets()) {
      if (this.playerOf(ws) !== pid) continue;
      try { ws.send(JSON.stringify({ t: 'left' })); ws.close(4001, 'left'); } catch (e) {}
    }

    if (!room.players.length) {
      await this.destroy();
      return { ok: true };
    }
    this.touch();
    await this.save();
    this.broadcast();
    return { ok: true };
  }

  /* --- WebSockets ---------------------------------------------------------- */

  async fetch(request) {
    if (request.headers.get('Upgrade') !== 'websocket') {
      return new Response('expected a WebSocket', { status: 426 });
    }
    const url = new URL(request.url);
    const pid = url.searchParams.get('pid') || '';
    const key = url.searchParams.get('key') || '';
    await this.load();

    const [client, server] = Object.values(new WebSocketPair());
    const problem = this.check(pid, key);
    if (problem) {
      // Said over the socket, because a browser can't read why an upgrade failed.
      server.accept();
      server.send(JSON.stringify({ t: problem }));
      server.close(4000, problem);
      return new Response(null, { status: 101, webSocket: client });
    }

    const wasOnline = this.onlineIds().has(pid);
    // Hibernation API: the room can sleep between messages without dropping
    // anyone, which is what keeps a quiet room free.
    this.ctx.acceptWebSocket(server);
    server.serializeAttachment({ pid });
    this.polled.delete(pid);
    if (this.room.lastSeen && this.room.lastSeen[pid]) {
      delete this.room.lastSeen[pid];
      this.save(true);
    }
    server.send(JSON.stringify({ t: 'state', state: this.project(pid, this.onlineIds()) }));
    if (!wasOnline) this.broadcast({ skip: server });
    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(ws, message) {
    if (typeof message !== 'string' || message.length > MAX_MESSAGE) return;
    let msg;
    try { msg = JSON.parse(message); } catch (e) { return; }
    if (!msg || typeof msg !== 'object') return;

    await this.load();
    const pid = this.playerOf(ws);
    const problem = this.check(pid);
    if (problem) {
      try { ws.send(JSON.stringify({ t: problem })); ws.close(4000, problem); } catch (e) {}
      return;
    }

    if (msg.t === 'act') {
      const res = await this.act(pid, undefined, msg.action, msg.payload, ws);
      try { ws.send(JSON.stringify(Object.assign({ t: 'ack', id: msg.id }, res))); } catch (e) {}
      return;
    }

    if (msg.t === 'sync') {
      try { ws.send(JSON.stringify({ t: 'state', state: this.project(pid, this.onlineIds()) })); } catch (e) {}
      return;
    }

    if (msg.t === 'live') {
      // The line still under the drawer's finger. Relayed, never stored, and
      // only from whoever is drawing right now.
      const s = this.room.shared || {};
      const drawing = this.room.game === 'drawguess' && this.room.phase === 'drawing' && !s.word;
      if (!drawing || s.drawerId !== pid || message.length > MAX_LIVE) return;
      const text = JSON.stringify({ t: 'live', d: msg.d });
      for (const other of this.openSockets()) {
        if (this.playerOf(other) === pid) continue;
        try { other.send(text); } catch (e) {}
      }
      return;
    }

    if (msg.t === 'leave') {
      await this.leave(pid, this.room.keys && this.room.keys[pid]);
    }
  }

  async webSocketClose(ws) {
    try { ws.close(1000, 'bye'); } catch (e) {}
    await this.gone(ws);
  }

  async webSocketError(ws) {
    await this.gone(ws);
  }

  /** A socket closed. If that was the player's last one, everyone sees them go. */
  async gone(ws) {
    await this.load();
    if (!this.room) return;
    const pid = this.playerOf(ws);
    if (!pid || this.onlineIds(ws).has(pid)) return;
    if (!this.room.players.some((p) => p.id === pid)) return;

    this.room.lastSeen = this.room.lastSeen || {};
    this.room.lastSeen[pid] = Date.now();
    this.save(true);
    this.broadcast({ leaving: ws });
    if (pid === this.room.hostId) await this.scheduleAlarm(Date.now() + HOST_AWAY_MS);
  }
}
