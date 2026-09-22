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
import { ROOM_GAME_IDS, applyRoomAction, roomDeadline, roomTimeout, withPromptMemory, roomEvent, roomPlayerLeft, sameRoomName } from '../generated/rules.js';
import { roomView } from './view.js';

const MAX_PLAYERS = 12;
// Big screens (a TV, a laptop) showing the room. They take no player seat.
const MAX_SCREENS = 3;
// A phone on the HTTP fallback (no WebSocket) counts as here this long after it last asked.
const ONLINE_WINDOW_MS = 20000;
// A socket nothing has been heard on for this long is dead, whatever its
// readyState says: a phone pings every 25s, so this is two missed pings and
// slack. A phone that locks can leave a socket that never closes.
const SOCKET_SILENT_MS = 70000;
// A host gone this long while others are still here hands the room on.
const HOST_AWAY_MS = 120000;
// A round's timeout that threw is tried again after this, not in a tight loop.
const TIMEOUT_RETRY_MS = 30000;
// Rooms delete themselves: after this long with no moves and nobody connected...
const IDLE_MS = 6 * 3600 * 1000;
// ...or after this long with no moves at all, even with a forgotten tab open.
const ABANDONED_MS = 24 * 3600 * 1000;
// An idle room with a tab still open is looked at again this often. Its idle time
// is already in the past, and an alarm set in the past fires at once, over and
// over: a TV left on overnight used to spin the alarm for up to 18 hours.
const IDLE_RECHECK_MS = 10 * 60 * 1000;
// No alarm is ever set sooner than this, whatever a game's deadline says.
const ALARM_FLOOR_MS = 1000;
// Rapid moves (drawing, the dial) are saved at most this often; the phones get them at once.
const QUICK_SAVE_MS = 1000;
const QUICK_ACTIONS = new Set(['addStrokes', 'undoStroke', 'setDial']);
// The actions that deal prompts, which need the shared prompt memory.
const DEAL_ACTIONS = new Set(['start', 'nextRound', 'playAgain', 'swap']);
const MAX_MESSAGE = 64 * 1024;
const MAX_LIVE = 8 * 1024;
// The count on the مع بعض tab (LiveStats in live.js): a room reports its number
// of players online when it changes, and at least this often while the room is
// in use, so a room that goes quiet can be told from one that has died.
const LIVE_REFRESH_MS = 5 * 60 * 1000;

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
    this.failedDeadline = null; // { due, retryAt }: a deadline whose timeout threw
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
    // Out of the count before the room forgets its own code.
    if (this.room && this.room.code) {
      const stub = this.liveStub();
      if (stub) { try { await stub.report(this.room.code, 0); } catch (e) {} }
    }
    this.lastLive = null;
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

  /** Sockets that can still be written to. Being open is not being here: see onlineIds. */
  openSockets(except) {
    return this.ctx.getWebSockets().filter((ws) => ws !== except && ws.readyState <= 1);
  }

  playerOf(ws) {
    const tag = ws.deserializeAttachment();
    return tag ? tag.pid : null;
  }

  /**
   * When anything was last heard on a socket: its last "ping" (answered by
   * Cloudflare without waking the room, but timed), or its opening. Null for a
   * socket opened before this was kept, which counts as here, as it always did.
   */
  socketHeardAt(ws) {
    let at = null;
    try {
      const ping = this.ctx.getWebSocketAutoResponseTimestamp(ws);
      if (ping) at = ping.getTime();
    } catch (e) {}
    const tag = ws.deserializeAttachment();
    if (tag && tag.at && (at === null || tag.at > at)) at = tag.at;
    return at;
  }

  socketSilent(ws, now = Date.now()) {
    const heard = this.socketHeardAt(ws);
    return heard !== null && now - heard >= SOCKET_SILENT_MS;
  }

  /** The last time any of a device's open sockets was heard from, or null. */
  heardAt(pid) {
    let best = null;
    for (const ws of this.openSockets()) {
      if (this.playerOf(ws) !== pid) continue;
      const at = this.socketHeardAt(ws);
      if (at !== null && (best === null || at > best)) best = at;
    }
    return best;
  }

  onlineIds(except) {
    const ids = new Set();
    const now = Date.now();
    for (const ws of this.openSockets(except)) {
      const pid = this.playerOf(ws);
      if (pid && !this.socketSilent(ws, now)) ids.add(pid);
    }
    for (const [pid, at] of this.polled) if (now - at < ONLINE_WINDOW_MS) ids.add(pid);
    return ids;
  }

  /** 'gone', 'kicked', or null when pid (and key, if given) belong to this room. */
  check(pid, key) {
    const room = this.room;
    if (!room) return 'gone';
    if (!room.players.some((p) => p.id === pid) && !(room.screens || []).some((s) => s.id === pid)) return 'kicked';
    if (key !== undefined && (!key || !room.keys || room.keys[pid] !== key)) return 'kicked';
    return null;
  }

  /** What one player may see: the shared state and their own secret (view.js). */
  project(pid, online) {
    return roomView(this.room, pid, online);
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

  /* --- the count on the مع بعض tab ------------------------------------------ */

  liveStub() {
    return this.env.LIVE ? this.env.LIVE.get(this.env.LIVE.idFromName('live')) : null;
  }

  /**
   * Tells LiveStats how many players this room has online - when that number
   * changed, or when the last report is getting old. Screens are not players.
   * `except` is a socket on its way out. Never throws: a count that can't be
   * sent is not worth failing a move over.
   */
  async reportLive(except) {
    const room = this.room;
    const stub = this.liveStub();
    if (!room || !room.code || !stub) return;
    const online = this.onlineIds(except);
    const players = room.players.filter((p) => online.has(p.id)).length;
    const now = Date.now();
    const last = this.lastLive;
    if (last && last.players === players && now - last.at < LIVE_REFRESH_MS) return;
    this.lastLive = { players, at: now };
    try {
      await stub.report(room.code, players);
    } catch (e) {
      this.lastLive = null;   // try again on the next change
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
    let deadline = roomDeadline(room);
    // A deadline whose timeout threw waits for its retry, or the alarm would
    // be set in the past and fire again at once, over and over.
    const failed = this.failedDeadline;
    if (failed && deadline === failed.due) deadline = Math.max(deadline, failed.retryAt);
    const now = Date.now();
    const idleAt = room.updatedAt + IDLE_MS;
    const cleanup = idleAt > now ? idleAt : Math.min(room.updatedAt + ABANDONED_MS, now + IDLE_RECHECK_MS);
    const times = [deadline, extra, cleanup].filter((t) => typeof t === 'number');
    const soonest = Math.max(Math.min(...times), now + ALARM_FLOOR_MS);
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
    let presence = false;
    let again;
    const soonest = (t) => { again = Math.min(again === undefined ? Infinity : again, t); };

    // A round whose time is up ends, even with every phone asleep.
    const due = roomDeadline(room);
    if (due && now >= due) {
      const next = structuredClone(room);
      try {
        if (roomTimeout(next, now)) { this.room = next; changed = true; }
        // A timeout that left its own deadline due would bring the alarm straight
        // back; treat it like one that threw and look again later.
        const still = roomDeadline(this.room);
        this.failedDeadline = still !== null && still <= now ? { due: still, retryAt: now + TIMEOUT_RETRY_MS } : null;
      } catch (err) {
        console.error('roomTimeout', errorText(err));
        this.failedDeadline = { due, retryAt: now + TIMEOUT_RETRY_MS };
      }
    }

    // Sockets nothing has been heard on for a while are dead: closed, and their
    // phones shown as away once, as if they had closed themselves.
    this.room.lastSeen = this.room.lastSeen || {};
    let dirty = false;
    const online = this.onlineIds();
    for (const ws of this.openSockets()) {
      if (!this.socketSilent(ws, now)) continue;
      const pid = this.playerOf(ws);
      const heard = this.socketHeardAt(ws);
      try { ws.close(4002, 'silent'); } catch (e) {}
      if (pid && !online.has(pid) && !this.room.lastSeen[pid]) {
        this.room.lastSeen[pid] = heard || now;
        dirty = presence = true;
      }
    }

    // A host who has been gone a while hands the room to someone still here.
    const hostId = this.room.hostId;
    if (online.has(hostId)) {
      // Here after all (a quiet socket that pinged again): the wait starts over next time.
      if (this.room.lastSeen[hostId]) { delete this.room.lastSeen[hostId]; dirty = true; }
    } else {
      const heir = this.room.players.find((p) => online.has(p.id)) || (this.room.screens || []).find((s) => online.has(s.id));
      let leftAt = this.room.lastSeen[hostId];
      if (!leftAt) {
        // Never seen leaving (the HTTP fallback, or a restart): gone since last heard, or from now.
        leftAt = this.heardAt(hostId) || now;
        this.room.lastSeen[hostId] = leftAt;
        dirty = true;
      }
      if (heir && now - leftAt >= HOST_AWAY_MS - 1000) {
        this.room.hostId = heir.id;
        roomEvent(this.room, 'host', { name: heir.name || '📺' });
        changed = true;
      } else if (heir) {
        soonest(leftAt + HOST_AWAY_MS);
      }
    }

    // While the host holds a socket, look again when it would fall silent: a
    // socket that dies without closing wakes nothing, so nothing else notices.
    if (online.has(this.room.hostId)) {
      const heard = this.heardAt(this.room.hostId);
      if (heard !== null) soonest(Math.max(heard + SOCKET_SILENT_MS + 1000, now + 5000));
    }

    if (changed) {
      this.touch();
      await this.save();
      this.broadcast();
    } else {
      if (dirty) await this.save();
      if (presence) this.broadcast();
    }

    // A phone on the HTTP fallback leaves no trace when it stops asking, so the
    // live count is checked here too, and the alarm comes back when the next
    // such phone would drop out of "online".
    await this.reportLive();
    const pollEnds = [...this.polled.values()].map((at) => at + ONLINE_WINDOW_MS + 1000).filter((t) => t > now);
    if (pollEnds.length) soonest(Math.min(...pollEnds));

    // Inside alarm() the alarm that is running may still read as set; replace it outright.
    await this.scheduleAlarm(again, true);
  }

  /* --- the API (called by the Worker in index.js) -------------------------- */

  async create(code, name, game, screen) {
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
      // A room opened from a TV has that screen as its host and no players yet.
      players: screen ? [] : [{ id: hostId, name: String(name || '').trim().slice(0, 24) || 'Host' }],
      screens: screen ? [{ id: hostId }] : [],
      shared: {},
      secrets: {},
      keys: { [hostId]: key },
      lastSeen: {},
      createdAt: now,
      updatedAt: now
    };
    await this.save();
    this.polled.set(hostId, now);
    await this.reportLive();
    await this.scheduleAlarm(now + ONLINE_WINDOW_MS + 1000);
    return { ok: true, playerId: hostId, key, state: this.project(hostId, this.onlineIds()) };
  }

  async join(rawName, screen) {
    await this.load();
    const room = this.room;
    if (!room) return { ok: false, error: 'ROOM_NOT_FOUND' };

    const pid = newPlayerId();
    const key = newKey();
    if (screen) {
      // A big screen: no name, no seat, and never a secret.
      room.screens = room.screens || [];
      if (room.screens.length >= MAX_SCREENS) return { ok: false, error: 'اكتمل عدد الشاشات في الغرفة' };
      room.screens.push({ id: pid });
    } else {
      const name = String(rawName || '').trim().slice(0, 24);
      if (!name) return { ok: false, error: 'اكتب اسمك أولاً' };
      if (room.players.length >= MAX_PLAYERS) return { ok: false, error: 'الغرفة ممتلئة' };
      // Joining mid-game is allowed: the newcomer watches until the next round.
      // أحمد and احمد are one name, as on the phone and when a screen becomes a player.
      if (room.players.some((p) => sameRoomName(p.name, name))) {
        return { ok: false, error: 'الاسم مستخدم بالفعل في هذه الغرفة' };
      }
      room.players.push({ id: pid, name });
      roomEvent(room, 'joined', { name });
    }
    room.keys = room.keys || {};
    room.keys[pid] = key;
    this.touch();
    await this.save();
    this.polled.set(pid, Date.now());
    this.broadcast();
    await this.reportLive();
    await this.scheduleAlarm(Date.now() + ONLINE_WINDOW_MS + 1000);
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

    // Taking someone out needs to know who is connected, which only the room knows.
    if (action === 'kick') return this.kick(pid, payload, ws);

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
    // Usually nothing to say; a player turning into a screen changes the count,
    // and a room in play refreshes its entry every few minutes.
    await this.reportLive();
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
    if (!wasOnline) {
      this.broadcast();
      await this.reportLive();
      await this.scheduleAlarm(Date.now() + ONLINE_WINDOW_MS + 1000);
    }
    const online = this.onlineIds();
    if (Number(version) === this.room.version) {
      return { ok: true, same: true, version: this.room.version, online: [...online] };
    }
    return { ok: true, state: this.project(pid, online) };
  }

  async leave(pid, key) {
    await this.load();
    if (this.check(pid, key)) return { ok: true };
    await this.removeDevice(pid, 'left');
    return { ok: true };
  }

  /**
   * The host takes out a player (or a screen) whose phone is gone, exactly as
   * if they had left - never someone still connected, and never themselves.
   * Somebody already gone is nothing to do.
   */
  async kick(pid, payload, ws) {
    const room = this.room;
    if (room.hostId !== pid) return { ok: false, error: 'المضيف فقط يمكنه فعل ذلك' };
    const target = String(payload.playerId || '');
    if (target === pid) return { ok: false, error: 'مينفعش تطلّع نفسك من الغرفة' };
    const inRoom = room.players.some((p) => p.id === target) || (room.screens || []).some((s) => s.id === target);
    if (inRoom) {
      if (this.onlineIds().has(target)) return { ok: false, error: 'ده لسه متصل، مينفعش يطلع' };
      await this.removeDevice(target, 'kicked', ws);
    }
    if (!ws) this.polled.set(pid, Date.now());
    return { ok: true, state: this.project(pid, this.onlineIds()) };
  }

  /**
   * Takes a player or a screen out of the room - they left, or the host
   * removed them (`how`: 'left' or 'kicked', which is what their own phone is
   * told). The game lets go of them too (roomPlayerLeft). `skip` is a socket
   * that gets the new state in its ack.
   */
  async removeDevice(pid, how, skip = null) {
    const room = this.room;
    const leaving = room.players.find((p) => p.id === pid);
    room.players = room.players.filter((p) => p.id !== pid);
    room.screens = (room.screens || []).filter((s) => s.id !== pid);
    if (room.secrets) delete room.secrets[pid];
    if (room.keys) delete room.keys[pid];
    if (room.lastSeen) delete room.lastSeen[pid];
    this.polled.delete(pid);
    // Hand the room to whoever is left rather than orphaning it: a player if
    // there is one, otherwise a screen.
    // A computer player can't host, and a room of nothing but them is empty.
    const people = room.players.filter((p) => !p.bot);
    let newHost = false;
    if (room.hostId === pid && (people.length || room.screens.length)) {
      const online = this.onlineIds();
      const heir = people.find((p) => online.has(p.id)) || people[0] ||
        room.screens.find((s) => online.has(s.id)) || room.screens[0];
      room.hostId = heir.id;
      roomEvent(room, 'host', { name: heir.name || '📺' });
      newHost = true;
    }
    if (leaving) roomEvent(room, 'left', { name: leaving.name });

    for (const ws of this.openSockets()) {
      if (this.playerOf(ws) !== pid) continue;
      try { ws.send(JSON.stringify({ t: how })); ws.close(4001, how); } catch (e) {}
    }

    if (!people.length && !room.screens.length) {
      await this.destroy();
      return;
    }

    // The round stops waiting for them. On a copy: a rule that throws must
    // never stop someone leaving.
    if (leaving && room.game) {
      const next = structuredClone(room);
      try {
        roomPlayerLeft(next, pid, leaving.name);
        this.room = next;
      } catch (err) {
        console.error('roomPlayerLeft', errorText(err));
      }
    }

    this.touch();
    await this.save();
    this.broadcast({ skip });
    await this.reportLive();
    // A round the leave moved on may have a new clock, and a new host is watched.
    await this.scheduleAlarm(newHost ? Date.now() + SOCKET_SILENT_MS + 1000 : undefined);
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
    // `at`: heard from now, until its first ping is (see socketHeardAt).
    server.serializeAttachment({ pid, at: Date.now() });
    this.polled.delete(pid);
    if (this.room.lastSeen && this.room.lastSeen[pid]) {
      delete this.room.lastSeen[pid];
      this.save(true);
    }
    server.send(JSON.stringify({ t: 'state', state: this.project(pid, this.onlineIds()) }));
    if (!wasOnline) {
      this.broadcast({ skip: server });
      await this.reportLive();
    }
    // The host's socket is watched: the alarm looks again when it would fall silent.
    if (pid === this.room.hostId) await this.scheduleAlarm(Date.now() + SOCKET_SILENT_MS + 1000);
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

  /**
   * A socket closed. If that was the device's last one, everyone sees it go -
   * a screen too, since a room hosted from a TV hands over when the TV goes.
   */
  async gone(ws) {
    await this.load();
    if (!this.room) return;
    const pid = this.playerOf(ws);
    if (!pid || this.onlineIds(ws).has(pid)) return;
    if (!this.room.players.some((p) => p.id === pid) && !(this.room.screens || []).some((s) => s.id === pid)) return;

    this.room.lastSeen = this.room.lastSeen || {};
    // Already away since earlier (a silent socket the alarm closed): that is when they went.
    if (!this.room.lastSeen[pid]) this.room.lastSeen[pid] = Date.now();
    this.save(true);
    this.broadcast({ leaving: ws });
    await this.reportLive(ws);
    if (pid === this.room.hostId) await this.scheduleAlarm(Date.now() + HOST_AWAY_MS);
  }
}
