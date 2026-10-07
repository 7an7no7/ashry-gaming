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
import { PACK_CODE_RE, packCode, roomHostChanged, ROOM_GAME_IDS, applyRoomAction, roomDeadline, roomTimeout, roomTimeoutDeals, withPromptMemory, roomEvent, roomPlayerLeft, sameRoomName, roomSeatAway, roomClaimsPrune, roomClaimAsk, roomClaimAnswer, roomClaimTake, bumperRelaying, bumperJoined, darkRelaying, bankNightPoints, crewNightInput, crewCleanCode, missionJoined, missionPlayerLeft, HUM_SONGS, humSongIndexOf, roomGameIsOff, faceClean } from '../generated/rules.js';
import { roomView } from './view.js';

/* «اعمل وشك» (1282): the face a phone sends on create and join is kept on its player only when
   every digit is within its part (faceClean, rooms/Faces.js); anything else is dropped there, so a
   bad face never keeps anyone out of a room (the rename action refuses it outright). */
const roomWithFace = (player, rawFace) => {
  const face = faceClean(rawFace);
  if (face) player.face = face;
  return player;
};

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
// A host gone this long lets anyone in the room press the host's "move on"
// buttons (the next round, closing a vote, playing for a quiet phone): the owner,
// 28 Sep 2026. The host stays the host; the handover above is unchanged.
const HOST_STAND_IN_MS = 20000;
// A host's socket that has missed a ping (every 25s) by this much is a locked
// phone whose socket never closed: away since it was last heard. Only watched
// while a game is on, so an idle hub doesn't wake the room more often.
const HOST_QUIET_MS = 40000;
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
// Rapid moves (drawing, cheers) are saved at most this often; the phones get them at once.
const QUICK_SAVE_MS = 1000;
const QUICK_ACTIONS = new Set(['addStrokes', 'undoStroke', 'cheer', 'stick', 'ink', 'bzClock', 'draft']);
// Moves that only touch what the server keeps to itself (ارسم اللي بتسمعه's drawings,
// room._hear.ink, sent every second or so by every drawer; المهمة السرية's "the memo was
// shown"): when nothing any phone is shown changed, only the phone that moved gets its
// answer - no version, no broadcast.
// الجرس's bzClock: a phone timing a round trip before its first press, nothing changed.
const SILENT_ACTIONS = new Set(['ink', 'missionSeen', 'bzClock']);
// Moves that change only the mover's own slice (حرب السفن's draft: the fleet being arranged, sent on
// every drag): answered to that phone alone when nobody else's view changed (the audit of 1 Oct 2026).
const SELF_ACTIONS = new Set(['draft']);
// Moves one phone may make in MOVE_WINDOW_MS (a quick move, a stroke or a cheer, counts
// against the bigger number). Far above any person's play - 100 moves a second for 5 s - and
// above the robot tests, which play a whole أونو round as fast as the server answers; a phone
// past it gets a "slow down" instead of a save: one socket in a loop used to be a write per
// message, against the free plan's daily writes (the audit of 7 Oct 2026).
const MOVE_WINDOW_MS = 5000;
const MOVE_LIMIT = 500;
const MOVE_LIMIT_QUICK = 1000;
// Quick actions whose game has a clock that moves with them: the alarm is still
// set for these (the dark room's joystick: its traps and goal come with the walk).
const QUICK_WITH_ALARM = new Set(['stick']);
// The actions that deal prompts, which need the shared prompt memory.
// المهمة السرية deals a mission on these too (RoomMission.js), so the shared memory keeps them fresh.
const DEAL_ACTIONS = new Set(['start', 'nextRound', 'playAgain', 'swap', 'programSkip', 'missionSet', 'missionAnswer', 'missionSwap', 'missionCatch', 'becomePlayer', 'swapWord']);
const MAX_MESSAGE = 64 * 1024;
const MAX_LIVE = 8 * 1024;
// A controller's message (a stick, a ping): a few numbers.
const MAX_DRIVE = 400;
// A controller sends about 15 a second (a ping and a boost besides); more than
// this from one phone in a second is dropped, so a stuck or hostile page can't
// flood the screens and the free plan's requests.
const DRIVE_PER_SEC = 30;
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
    // «الشلة»: the night's last word before the room goes - the game still on the table is
    // banked as the hub would bank it, and the night is sent (it replaces what was sent before).
    if (this.room && this.room.crew) {
      try {
        if (this.room.game && this.room.shared && this.room.shared.board) bankNightPoints(this.room, this.room.shared.board);
      } catch (e) {}
      await this.recordCrew();
    }
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

  touch(active = true) {
    this.room.version++;
    // Only a move somebody is here for keeps the room from idling: a table of
    // computer players moving on the alarm alone used to keep it alive for ever.
    if (active) this.room.updatedAt = Date.now();
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

  /**
   * Since when the host has been away, or null while they are here. A socket
   * still open but not heard for HOST_QUIET_MS counts as away since it was
   * last heard (a locked phone), while a game is on.
   */
  hostAwaySince(online = this.onlineIds(), now = Date.now()) {
    const room = this.room;
    const hostId = room.hostId;
    if (online.has(hostId)) {
      const polled = this.polled.get(hostId);
      if (polled && now - polled < ONLINE_WINDOW_MS) return null;
      if (!this.gameOn()) return null;
      const heard = this.heardAt(hostId);
      return heard !== null && now - heard >= HOST_QUIET_MS ? heard : null;
    }
    return (room.lastSeen && room.lastSeen[hostId]) || this.heardAt(hostId) || null;
  }

  /**
   * A game is on, or برنامج السهرة is running: its standings card between games and its
   * next game waiting for Start move on with the program's buttons, which stand-ins get too.
   */
  gameOn(room = this.room) {
    return !!((room.game && room.phase !== 'lobby') || (room.program && room.program.phase !== 'final'));
  }

  /** True once the host has been away HOST_STAND_IN_MS: anyone may move the game on (requireHost). */
  hostAway(online = this.onlineIds(), now = Date.now()) {
    // Only while a game is on: the hub and the lobby are the host's (choosing, settings).
    if (!this.room || !this.gameOn()) return false;
    const since = this.hostAwaySince(online, now);
    return since !== null && now - since >= HOST_STAND_IN_MS;
  }

  /** What one player may see: the shared state and their own secret (view.js). */
  project(pid, online, away = this.hostAway(online)) {
    return roomView(this.room, pid, online, { hostAway: away });
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
    const away = this.hostAway(online);
    this.awayShown = away;
    const patchText = patch ? JSON.stringify(patch) : null;
    const views = new Map();
    for (const ws of this.openSockets(leaving)) {
      if (ws === skip) continue;
      const pid = this.playerOf(ws);
      if (!pid) continue;
      let text = patchText || views.get(pid);
      if (!text) {
        text = JSON.stringify({ t: 'state', state: this.project(pid, online, away) });
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
    // The game being played (not one waiting in the lobby), for «أكتر لعبة شغالة» (1275): its id only.
    const game = room.game && room.phase !== 'lobby' ? String(room.game) : '';
    const now = Date.now();
    const last = this.lastLive;
    if (last && last.players === players && last.game === game && now - last.at < LIVE_REFRESH_MS) return;
    this.lastLive = { players, game, at: now };
    try {
      await stub.report(room.code, players, game);
    } catch (e) {
      this.lastLive = null;   // try again on the next change
    }
  }

  /* --- «الشلة»: the crew this room's night counts for (crew.js) ------------- */

  crewStub(code) {
    return this.env.CREWS ? this.env.CREWS.get(this.env.CREWS.idFromName(code)) : null;
  }

  /** Sends the night to its crew (server to server; the crew replaces the same night sent before). */
  async recordCrew() {
    const room = this.room;
    if (!room || !room.crew || !room.crewNight) return;
    let input = null;
    try { input = crewNightInput(room); } catch (e) { console.error('crewNightInput', errorText(e)); }
    const stub = this.crewStub(room.crew.code);
    if (!input || !stub) return;
    try { await stub.recordNight(input); } catch (e) { console.error('recordNight', errorText(e)); }
  }

  /**
   * The host opens the night «للشلة» (or for another crew, or none), in the lobby. The
   * phone proves it is a member with its crew key, checked with the crew itself; the key
   * is never kept in the room. A night already sent to another crew is taken back from it.
   */
  async setCrew(pid, payload, ws) {
    if (!this.mayCrew(pid)) return { ok: false, error: 'دي للمضيف بس' };
    if (this.room.game && this.room.phase !== 'lobby') return { ok: false, error: 'غيّر الشلة بين الألعاب' };
    const code = payload.code ? crewCleanCode(payload.code) : '';
    if (payload.code && !code) return { ok: false, error: 'كود الشلة مش صحيح' };
    let verified = null;
    let crown = null;
    if (code) {
      const stub = this.crewStub(code);
      try { verified = stub ? await stub.verify(String(payload.key || '')) : null; } catch (e) { verified = null; }
      if (!verified || !verified.ok) return { ok: false, error: 'إنت مش في الشلة دي على الموبايل ده' };
      // «تاج البطل»: the crew's reigning champion, crowned in this room (never a reason to refuse).
      try { crown = stub && stub.crown ? await stub.crown() : null; } catch (e) { crown = null; }
    }
    // The call let other messages in: look at the room as it is now.
    await this.load();
    const room = this.room;
    if (!room || !this.mayCrew(pid)) return { ok: false, error: 'دي للمضيف بس' };
    const old = room.crew;
    if (old && old.code !== code && room.crewNight) {
      const stub = this.crewStub(old.code);
      if (stub) stub.dropNight(room.crewNight).catch(() => {});
    }
    if (!code) {
      room.crew = null;
      room.crewNight = null;
      room._crewChamp = null;
    } else {
      if (!old || old.code !== code) room.crewNight = room.code + '-' + Date.now().toString(36) + Math.floor(Math.random() * 1e6).toString(36);
      room.crew = { code, name: String(verified.name || '').slice(0, 30) };
      room.crewLinks = room.crewLinks || {};
      room.crewLinks[pid] = verified.memberId;
      room._crewChamp = crown && crown.ok ? { ids: (crown.ids || []).slice(0, 6), names: (crown.names || []).slice(0, 6) } : null;
      this.crewCrownSync();
    }
    this.touch();
    await this.save();
    this.broadcast({ skip: ws });
    if (room.crew) this.recordCrew().catch(() => {});
    if (!ws) this.polled.set(pid, Date.now());
    return { ok: true, state: this.project(pid, this.onlineIds()) };
  }

  /**
   * Who may open the night «للشلة»: the host, or - when the host is a screen (a TV has no
   * crew key) - anyone seated at the table.
   */
  mayCrew(pid) {
    const room = this.room;
    if (room.hostId === pid) return true;
    const hostIsScreen = (room.screens || []).some((x) => x.id === room.hostId);
    return hostIsScreen && room.players.some((p) => p.id === pid && !p.bot);
  }

  /**
   * «تاج البطل» (7 Oct 2026): which players in the room are the crew's reigning champion -
   * the phone that proved it is that member (crewLinks), else an unlinked player of the same
   * name. Only player ids go out (room.crew.crown); the member ids stay in room._crewChamp.
   * Returns true when it changed.
   */
  crewCrownSync() {
    const room = this.room;
    if (!room || !room.crew) return false;
    const ch = room._crewChamp || { ids: [], names: [] };
    const links = room.crewLinks || {};
    const people = room.players.filter((p) => !p.bot);
    const pids = [];
    ch.ids.forEach((m, i) => {
      let p = people.find((x) => links[x.id] === m);
      if (!p && ch.names[i]) p = people.find((x) => !links[x.id] && sameRoomName(x.name, ch.names[i]));
      if (p && pids.indexOf(p.id) === -1) pids.push(p.id);
    });
    const before = JSON.stringify(room.crew.crown || []);
    room.crew.crown = pids;
    return before !== JSON.stringify(pids);
  }

  /** A phone in the room says which member of the room's crew it is (its crew key, checked). */
  async crewMe(pid, payload, ws) {
    const crew = this.room.crew;
    if (!crew || crewCleanCode(payload.code) !== crew.code) return { ok: false, error: 'الغرفة مش للشلة دي' };
    if (!this.room.players.some((p) => p.id === pid && !p.bot)) return { ok: false, error: 'لست في الغرفة' };
    let verified = null;
    const stub = this.crewStub(crew.code);
    try { verified = stub ? await stub.verify(String(payload.key || '')) : null; } catch (e) { verified = null; }
    if (!verified || !verified.ok) return { ok: false, error: 'إنت مش في الشلة دي على الموبايل ده' };
    await this.load();
    if (!this.room || !this.room.crew || this.room.crew.code !== crew.code) return { ok: false, error: 'الغرفة مش للشلة دي' };
    this.room.crewLinks = this.room.crewLinks || {};
    if (this.room.crewLinks[pid] !== verified.memberId) {
      this.room.crewLinks[pid] = verified.memberId;
      // The champion's own phone proving who it is puts the crown on its chip, on every screen.
      const crowned = this.crewCrownSync();
      await this.save();
      if (crowned) this.broadcast({ skip: ws });
      this.recordCrew().catch(() => {});
    }
    if (!ws) this.polled.set(pid, Date.now());
    return { ok: true, state: this.project(pid, this.onlineIds()) };
  }

  /* --- the prompt memory shared by all rooms ------------------------------- */

  memoryStub() {
    return this.env.MEMORY.get(this.env.MEMORY.idFromName('prompts'));
  }

  wordsStub() {
    return this.env.WORDS.get(this.env.WORDS.idFromName('stop'));
  }

  /**
   * A pack the family wrote («اعمل مسابقتك», «كلماتنا»), by its code, for a move that
   * deals with it: the rules never take a quiz's answers or a word list from a phone.
   * Reading it as played starts its year again. null when there is none by that code.
   */
  async readPack(raw) {
    const code = packCode(raw);
    if (!PACK_CODE_RE.test(code) || !this.env.PACKS) return null;
    try {
      const got = await this.env.PACKS.get(this.env.PACKS.idFromName('pack:' + code)).get(true);
      return got ? { code, kind: got.kind, pack: got.pack } : null;
    } catch (e) {
      return null;
    }
  }

  /**
   * The pack the program's next game names in its options (room._progOpts), while the
   * program is between two games - the next move or clock deals it (programDealNext in
   * RoomProgram.js). Its start has no phone to load the pack for it.
   */
  programNextPack() {
    const p = this.room && this.room.program;
    if (!p || p.phase !== 'between') return null;
    const opts = (this.room._progOpts || [])[p.at + 1];
    return (opts && opts.pack) || null;
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
    const times = [deadline, extra, cleanup].filter((t) => Number.isFinite(t));
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

    // A round whose time is up ends, even with every phone asleep. A timeout that
    // deals the next round («التالي لوحده») gets the shared prompt memory, as the
    // host's own «التالي» does; the read lets other messages in, so the room is
    // looked at again after it.
    let memory = null;
    const early = roomDeadline(this.room);
    if (early && now >= early && roomTimeoutDeals(this.room, now)) memory = await this.readMemory();
    // برنامج السهرة's clock dealing a game whose options name a family pack: loaded for it.
    const packRef = early && now >= early ? this.programNextPack() : null;
    const pack = packRef ? await this.readPack(packRef) : null;
    const due = roomDeadline(this.room);
    if (due && now >= due) {
      const next = structuredClone(this.room);
      if (pack) next._packIn = pack;
      try {
        const timedOut = withPromptMemory(memory, () => roomTimeout(next, now));
        delete next._packIn;
        if (timedOut) {
          // «الشلة»: a clock that banked a game on the night (برنامج السهرة moves on by its own
          // clock) sends the night to its crew, as a move does.
          const nightSig = (r) => JSON.stringify([r.night || null, r.nightx || null]);
          const grew = next.crew && nightSig(next) !== nightSig(this.room);
          this.room = next;
          changed = true;
          if (grew) this.recordCrew().catch(() => {});
          if (memory && Object.keys(memory.changed).length) this.memoryStub().write(memory.changed).catch(() => {});
        }
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
    // A phone on the HTTP fallback that stopped asking is away too, since its last ask ran out
    // (a game's clock may read it: the duels' «خسران غياب»).
    for (const [pid, at] of this.polled) {
      if (now - at < ONLINE_WINDOW_MS || online.has(pid)) continue;
      this.polled.delete(pid);
      if (this.room.lastSeen[pid] || !this.room.players.some((p) => p.id === pid)) continue;
      this.room.lastSeen[pid] = at + ONLINE_WINDOW_MS;
      dirty = presence = true;
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
        roomHostChanged(this.room);
        roomEvent(this.room, 'host', { name: heir.name || '📺' });
        changed = true;
      } else if (heir) {
        // The stand-ins' moment first (everyone's phone shows the host's buttons), then the handover.
        if (now < leftAt + HOST_STAND_IN_MS) soonest(leftAt + HOST_STAND_IN_MS);
        soonest(leftAt + HOST_AWAY_MS);
      }
    }

    // While the host holds a socket, look again when it would fall silent: a
    // socket that dies without closing wakes nothing, so nothing else notices.
    // With a game on, sooner: a locked phone missing its pings lets stand-ins in.
    if (online.has(this.room.hostId)) {
      const heard = this.heardAt(this.room.hostId);
      const quiet = this.gameOn() ? HOST_QUIET_MS : SOCKET_SILENT_MS;
      if (heard !== null) {
        soonest(Math.max(heard + SOCKET_SILENT_MS + 1000, now + 5000));
        if (heard + quiet + 1000 > now) soonest(heard + quiet + 1000);
      }
    }

    // The host's buttons open to everyone, or close again: every phone is told.
    if (!changed && this.hostAway(this.onlineIds(), now) !== !!this.awayShown) presence = true;

    if (changed) {
      this.touch(this.onlineIds().size > 0);
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

  async create(code, name, game, screen, test, rawFace) {
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
      // A page loaded before a game was switched off still offers it: the hub then.
      game: ROOM_GAME_IDS.indexOf(game) !== -1 && !roomGameIsOff(game) ? game : null,
      phase: 'lobby',
      hostId,
      // A room opened from a TV has that screen as its host and no players yet.
      players: screen ? [] : [roomWithFace({ id: hostId, name: String(name || '').trim().slice(0, 24) || 'Host' }, rawFace)],
      screens: screen ? [{ id: hostId }] : [],
      shared: {},
      secrets: {},
      keys: { [hostId]: key },
      lastSeen: {},
      createdAt: now,
      // A robot test's room (play-all.mjs says so on /create): played like any other, but not
      // counted in the plays, or the weekly test:live on GitHub would add its games every
      // week and the monthly report would never show a room game nobody started (7 Oct 2026).
      _test: test ? true : undefined,
      updatedAt: now
    };
    await this.save();
    this.polled.set(hostId, now);
    await this.reportLive();
    await this.scheduleAlarm(now + ONLINE_WINDOW_MS + 1000);
    return { ok: true, playerId: hostId, key, state: this.project(hostId, this.onlineIds()) };
  }

  async join(rawName, screen, rawFace) {
    await this.load();
    // المهمة السرية on: whoever comes in later is dealt a file, with the shared memory as a deal
    // has it - read before anything changes, so the room is looked at again after the wait.
    const memory = !screen && this.room && this.room.mission && this.room.mission.on ? await this.readMemory() : null;
    const room = this.room;
    if (!room) return { ok: false, error: 'ROOM_NOT_FOUND' };

    const pid = newPlayerId();
    const key = newKey();
    if (screen) {
      // A big screen: no name, no seat, and never a secret.
      room.screens = room.screens || [];
      if (room.screens.length >= MAX_SCREENS) return { ok: false, error: 'الغرفة فيها شاشات كفاية' };
      room.screens.push({ id: pid });
    } else {
      const name = String(rawName || '').trim().slice(0, 24);
      if (!name) return { ok: false, error: 'اكتب اسمك الأول' };
      if (room.players.length >= MAX_PLAYERS) return { ok: false, error: 'الغرفة اتملت' };
      // Joining mid-game is allowed: the newcomer watches until the next round.
      // أحمد and احمد are one name, as on the phone and when a screen becomes a player.
      const taken = room.players.find((p) => sameRoomName(p.name, name));
      if (taken) {
        // «ده أنا» (1278): who has the name, and whether that seat's phone has been gone over a
        // minute - then this phone may ask for the seat back (claim). Old phones read the error only.
        return { ok: false, error: 'الاسم ده مستخدم في الغرفة، اختار اسم تاني',
          taken: { name: taken.name, away: roomSeatAway(room, taken.id, this.onlineIds(), Date.now()) } };
      }
      room.players.push(roomWithFace({ id: pid, name }, rawFace));
      roomEvent(room, 'joined', { name });
      // المهمة السرية on: whoever comes in later is dealt a file (with the shared memory, as a deal).
      if (room.mission && room.mission.on) {
        try {
          withPromptMemory(memory, () => missionJoined(room));
          if (memory && Object.keys(memory.changed).length) this.memoryStub().write(memory.changed).catch(() => {});
        } catch (err) {
          console.error('missionJoined', errorText(err));
        }
      }
      // «كورة التصادم» mid-match: a newcomer's car is put on the smaller side for good.
      try { bumperJoined(room, pid); } catch (err) { console.error('bumperJoined', errorText(err)); }
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

  /**
   * «ده أنا» (the ideas of 7 Oct 2026, 1272): a phone with no key asks for the seat under its
   * name back (body.name), and then comes for the answer every couple of seconds (body.claim
   * and body.token, the ask's own; body.cancel to give up). The host's phone (or anyone
   * seated, the host away) answers with the room action claimSeat. On yes the answer carries
   * the seat's id and a fresh key, as a join's does; the seat's old key stops working.
   */
  async claim(body) {
    await this.load();
    const room = this.room;
    if (!room) return { ok: false, error: 'ROOM_NOT_FOUND' };
    const now = Date.now();
    const id = String((body && body.claim) || '');
    if (id) {
      if (body.cancel) {
        // Only an ask still waiting goes: an answer stays for its phone until it lapses (audit 7 Oct 2026, S4).
        const c = (room._claims || []).find((x) => x.id === id && x.token === String(body.token || ''));
        if (c && c.status === 'pending') {
          room._claims = room._claims.filter((x) => x !== c);
          this.touch(false);
          await this.save();
          this.broadcast();
        }
        return { ok: true, cancelled: true };
      }
      const pruned = roomClaimsPrune(room, now);
      const c = roomClaimTake(room, id, body.token, now);
      if (!c) {
        if (pruned) { this.touch(false); await this.save(); this.broadcast(); }
        return { ok: false, error: 'CLAIM_GONE' };
      }
      if (c.status === 'pending') {
        if (pruned) { this.touch(false); await this.save(); }
        return { ok: true, waiting: true };
      }
      this.touch(false);
      if (c.status !== 'yes' || !room.keys || room.keys[c.seat] !== c.key || !room.players.some((p) => p.id === c.seat)) {
        await this.save();
        return { ok: false, refused: true, error: 'CLAIM_NO' };
      }
      // This phone is that seat now: here from this moment, as a join is.
      if (room.lastSeen) delete room.lastSeen[c.seat];
      this.polled.set(c.seat, now);
      await this.save();
      this.broadcast();
      await this.reportLive();
      await this.scheduleAlarm(now + ONLINE_WINDOW_MS + 1000);
      return { ok: true, playerId: c.seat, key: c.key, state: this.project(c.seat, this.onlineIds()) };
    }
    let c;
    try {
      c = roomClaimAsk(room, body && body.name, this.onlineIds(), now, 'c' + now.toString(36) + Math.floor(Math.random() * 1e6).toString(36), newKey());
    } catch (err) {
      return { ok: false, error: errorText(err) };
    }
    this.touch(false);
    await this.save();
    this.broadcast();
    // The ask lapses by itself (roomClaimsView hides it); the alarm needn't wake for it.
    return { ok: true, waiting: true, claim: c.id, token: c.token, name: c.name };
  }

  /** The host (or anyone seated, the host away 20 s) answers an ask for a seat back: payload { claim, ok }. */
  async claimSeat(pid, payload, ws) {
    const room = this.room;
    const now = Date.now();
    const online = this.onlineIds();
    const since = this.hostAwaySince(online, now);
    const awayFor = room.hostId === pid || since === null ? 0 : Math.max(0, now - since);
    let c;
    try {
      c = roomClaimAnswer(room, pid, payload && payload.claim, !(payload && payload.ok === false), online, now, awayFor, newKey());
    } catch (err) {
      return { ok: false, error: errorText(err) };
    }
    if (c) {
      // The seat's old phone, if a socket of it is still open somewhere: its key is gone.
      if (c.status === 'yes') {
        for (const sock of this.openSockets()) {
          if (this.playerOf(sock) !== c.seat) continue;
          try { sock.send(JSON.stringify({ t: 'kicked' })); sock.close(4001, 'kicked'); } catch (e) {}
        }
      }
      this.touch();
      await this.save();
      this.broadcast({ skip: ws });
    }
    if (!ws) this.polled.set(pid, now);
    return { ok: true, state: this.project(pid, this.onlineIds()) };
  }

  /** True when this phone has made more moves than MOVE_LIMIT allows in the window (never a computer player). */
  tooFast(pid, action) {
    if (this.room.players.some((p) => p.id === pid && p.bot)) return false;
    const now = Date.now();
    this.moveRate = this.moveRate || new Map();
    const r = this.moveRate.get(pid);
    if (!r || now - r.since > MOVE_WINDOW_MS) { this.moveRate.set(pid, { n: 1, since: now }); return false; }
    r.n++;
    return r.n > (QUICK_ACTIONS.has(action) ? MOVE_LIMIT_QUICK : MOVE_LIMIT);
  }

  /** A move. `ws` is the socket it came in on, if any. */
  async act(pid, key, rawAction, rawPayload, ws) {
    await this.load();
    let problem = this.check(pid, key);
    if (problem) return { ok: false, [problem]: true, error: problem === 'gone' ? 'ROOM_NOT_FOUND' : 'NOT_IN_ROOM' };

    const action = String(rawAction || '');
    const payload = rawPayload && typeof rawPayload === 'object' ? rawPayload : {};
    if (this.tooFast(pid, action)) return { ok: false, error: 'على مهلك شوية' };
    const memory = DEAL_ACTIONS.has(action) ? await this.readMemory() : null;
    // A quiz or word pack chosen in the lobby (payload.pack): loaded here, for this one move.
    // برنامج السهرة's skip from the standings deals its next game, with the pack its options name.
    const packRef = (action === 'start' || action === 'playAgain') ? payload.pack
      : (action === 'programSkip' || action === 'backToHub' ? this.programNextPack() : null);
    const pack = packRef ? await this.readPack(packRef) : null;

    // The memory read let other messages in; look at the room as it is now.
    problem = this.check(pid);
    if (problem) return { ok: false, [problem]: true, error: problem === 'gone' ? 'ROOM_NOT_FOUND' : 'NOT_IN_ROOM' };

    // Taking someone out needs to know who is connected, which only the room knows.
    if (action === 'kick') return this.kick(pid, payload, ws);
    // Handing the room on is the room's too: it has to know who is connected.
    if (action === 'makeHost') return this.makeHost(pid, payload, ws);
    // «الشلة»: checked with the crew's own object, so the room's (the rules' can't wait on it).
    if (action === 'setCrew') return this.setCrew(pid, payload, ws);
    if (action === 'crewMe') return this.crewMe(pid, payload, ws);
    // «ده أنا»: a seat given back is a key the room hands out (claimSeat).
    if (action === 'claimSeat') return this.claimSeat(pid, payload, ws);

    // The rules change the room in place and may throw halfway through a move,
    // so they work on a copy that only replaces the room if the move is legal.
    const before = this.room;
    const next = structuredClone(before);
    // For this one move only: whether the host has been away long enough for
    // anyone to press their "move on" buttons (requireHost in RoomGames.js).
    if (pid !== before.hostId && this.hostAway()) next._hostAway = true;
    // And who is connected, for a "play for" that only a quiet phone may get (بنك الحظ's skipTurn).
    if (action === 'skipTurn') next._online = Array.from(this.onlineIds());
    // The pack for this move only (roomPackAdopt in RoomGames.js keeps what the game needs).
    if (pack) next._packIn = pack;
    // The screens online for this move only (عربيات التصادم starts only with one).
    const onlineNow = this.onlineIds();
    next._onlineScreens = (next.screens || []).filter((x) => x.id === pid || onlineNow.has(x.id)).map((x) => x.id);
    try {
      withPromptMemory(memory, () => applyRoomAction(next, pid, action, payload));
    } catch (err) {
      return { ok: false, error: errorText(err) };
    }
    delete next._hostAway;
    delete next._online;
    delete next._packIn;
    delete next._onlineScreens;
    // A cheer the rules let go (too many too fast, or no game on): nothing changed,
    // so nothing is saved or sent to the others - a tap-happy watcher used to push a
    // whole state to every phone on each tap. The phone that sent it gets its own view.
    const cheerSeq = (r) => (r.cheer && r.cheer.seq) || 0;
    if (action === 'cheer' && cheerSeq(next) === cheerSeq(before)) {
      if (!ws) this.polled.set(pid, Date.now());
      return { ok: true, state: this.project(pid, this.onlineIds()) };
    }
    let stopTaps = null;
    if (next._stopTaps && next._stopTaps.length) {
      stopTaps = next._stopTaps;
      delete next._stopTaps;
    }
    // A silent move that left everything the phones are shown as it was (SILENT_ACTIONS).
    const shown = (r) => JSON.stringify([r.shared || null, r.secrets || null, r.phase || null, r.game || null, r.mission || null, r.screenOnly || null]);
    const others = (r) => JSON.stringify([r.shared || null, Object.keys(r.secrets || {}).filter((k) => k !== pid).sort().map((k) => [k, r.secrets[k]]), r.phase || null, r.game || null, r.mission || null, r.screenOnly || null]);
    const silent = (SILENT_ACTIONS.has(action) && shown(next) === shown(before)) ||
      (SELF_ACTIONS.has(action) && others(next) === others(before));
    this.room = next;
    if (silent) this.room.updatedAt = Date.now(); else this.touch();
    if (!ws) this.polled.set(pid, Date.now());
    // «الشلة»: the night grew (a game banked on the way back to the hub, a guess settled):
    // the crew gets it again, replacing what it had. Not waited on: a move never waits for it.
    const nightSig = (r) => JSON.stringify([r.night || null, r.nightx || null]);
    if (next.crew && nightSig(next) !== nightSig(before)) this.recordCrew().catch(() => {});

    const quick = QUICK_ACTIONS.has(action);
    await this.save(quick);
    if (memory && Object.keys(memory.changed).length) {
      this.memoryStub().write(memory.changed).catch(() => {});
    }
    if (stopTaps && this.env.WORDS) {
      this.wordsStub().add(stopTaps).catch(() => {});
    }
    // How often each game is played (the improvement plan's numbers): a game
    // dealt from the lobby counts once, by the month, as a room or on a TV.
    if (action === 'start' && before.phase === 'lobby' && next.phase !== 'lobby' && next.game && this.env.WORDS && !next._test) {
      const mode = (next.screens || []).length ? 'tv' : 'room';
      this.env.WORDS.get(this.env.WORDS.idFromName('plays'))
        .add([{ lang: mode, cat: new Date().toISOString().slice(0, 7), word: String(next.game), keep: true }]).catch(() => {});
    }
    // The host's move while a game is on: look again when their socket would
    // count as quiet (HOST_QUIET_MS), so a phone locked mid-game lets stand-ins in.
    const watchHost = pid === next.hostId && this.gameOn(next);
    if (!quick || QUICK_WITH_ALARM.has(action)) await this.scheduleAlarm(watchHost ? Date.now() + HOST_QUIET_MS + 1000 : undefined);

    // New strokes go out as just the strokes: resending a whole drawing to every
    // phone a few times a second would be most of a phone's data.
    let patch = null;
    const was = before.shared && before.shared.strokes;
    const now = next.shared && next.shared.strokes;
    if (action === 'addStrokes' && Array.isArray(was) && Array.isArray(now) && now.length >= was.length) {
      patch = { t: 'strokes', from: before.version, v: next.version, add: now.slice(was.length) };
    }

    if (!silent) this.broadcast({ skip: ws, patch });
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
      return { ok: true, same: true, version: this.room.version, online: [...online], hostAway: this.hostAway(online) };
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
   * دندنها (RoomHum.js): the song (its source and id, and its second pin) behind a round's opaque token, for /song
   * (index.js) to stream. Only the song on now answers, and only to its token: the
   * address names nothing, so a guesser's traffic never holds a title or a trackId.
   */
  async songOf(token) {
    await this.load();
    // The song on now, or at the end one of the game's played songs (RoomHum.js, «قايمة أغاني السهرة»).
    const at = humSongIndexOf(this.room, token);
    if (at === -1) return null;
    const song = HUM_SONGS[at];
    return song ? { src: song.src, id: song.id, u: song.u || null, also: song.also || null } : null;
  }

  /**
   * The host takes out a player (or a screen) whose phone is gone, exactly as
   * if they had left - never someone still connected, and never themselves.
   * Somebody already gone is nothing to do.
   */
  async kick(pid, payload, ws) {
    const room = this.room;
    if (room.hostId !== pid) return { ok: false, error: 'دي للمضيف بس' };
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
   * The host hands the room to another person here (the owner, 24 Sep 2026):
   * never a computer player, never a phone that is away, and nothing to do for
   * themselves. Said in the chat like any change of host.
   */
  async makeHost(pid, payload, ws) {
    const room = this.room;
    if (room.hostId !== pid) return { ok: false, error: 'المضيف بس اللي يقدر ينقل المضيف' };
    const target = String((payload && payload.playerId) || '');
    const p = room.players.find((x) => x.id === target);
    if (!p || p.bot) return { ok: false, error: 'مينفعش ده يبقى المضيف' };
    if (target !== pid) {
      if (!this.onlineIds().has(target)) return { ok: false, error: 'ده مش متصل دلوقتي، مينفعش يبقى المضيف' };
      room.hostId = target;
      roomHostChanged(room);
      if (room.lastSeen) delete room.lastSeen[target];
      roomEvent(room, 'host', { name: p.name });
      this.touch();
      await this.save();
      this.broadcast({ skip: ws });
      // The new host's socket is watched, as any host's is.
      await this.scheduleAlarm(Date.now() + SOCKET_SILENT_MS + 1000);
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
      // What only the host may see follows them, as on the alarm's handover and makeHost
      // (a TV host leaving a buzzer family quiz left the new host without the answer).
      roomHostChanged(room);
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

    // المهمة السرية: their file goes, files aimed at them get a new target (or the file pauses).
    if (leaving && room.mission && room.mission.on) {
      try { missionPlayerLeft(room); } catch (err) { console.error('missionPlayerLeft', errorText(err)); }
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
    // The host back from a locked phone (its old socket was still counted as
    // here): everyone's stand-in buttons go away.
    if (!wasOnline || (pid === this.room.hostId && this.awayShown)) {
      this.broadcast({ skip: server });
      await this.reportLive();
    }
    // The host's socket is watched: the alarm looks again when it would fall silent.
    if (pid === this.room.hostId) await this.scheduleAlarm(Date.now() + (this.room.game ? HOST_QUIET_MS : SOCKET_SILENT_MS) + 1000);
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
      // A controller game (عربيات التصادم): each phone's steering to the screens,
      // a screen's answer to one phone. Relayed, never stored.
      if (bumperRelaying(this.room)) {
        this.relayDrive(pid, msg.d, message.length);
        return;
      }
      // الأوضة المضلمة: a guide's lens, to everyone but the mover (and the sender).
      if (darkRelaying(this.room)) {
        this.relayLens(pid, msg.d, message.length);
        return;
      }
      // The line still under the drawer's finger. Relayed, never stored, and
      // only from whoever is drawing right now.
      const s = this.room.shared || {};
      // الفنان المزيف's line as it is drawn (idea 530, 7 Oct 2026): from the artist whose turn it is.
      if (this.room.game === 'fakeartist') {
        if (s.phase !== 'drawing' || s.currentDrawerId !== pid || message.length > MAX_LIVE) return;
        const faText = JSON.stringify({ t: 'live', d: msg.d });
        for (const other of this.openSockets()) {
          if (this.playerOf(other) === pid) continue;
          try { other.send(faText); } catch (e) {}
        }
        return;
      }
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

  /**
   * The controllers' channel (RoomBumper.js). A player's message goes to every
   * screen, stamped with who sent it; a screen's goes to the one phone it names
   * (`to`). Nothing is kept, and nothing reaches another player: a phone only
   * ever hears the screen. This runs many times a second a phone, so it does no
   * more than pick the sockets.
   */
  relayDrive(pid, d, size) {
    if (!d || typeof d !== 'object' || Array.isArray(d) || size > MAX_DRIVE) return;
    const screens = new Set((this.room.screens || []).map((x) => x.id));
    if (screens.has(pid)) {
      if (typeof d.to !== 'string') return;
      const text = JSON.stringify({ t: 'live', d });
      for (const ws of this.openSockets()) {
        if (this.playerOf(ws) === d.to) { try { ws.send(text); } catch (e) {} }
      }
      return;
    }
    if (!this.room.players.some((p) => p.id === pid && !p.bot)) return;
    // A light rate limit per phone: a count in a one-second window.
    const now = Date.now();
    const rates = this.driveRates || (this.driveRates = new Map());
    let r = rates.get(pid);
    if (!r || now - r.since >= 1000) {
      if (rates.size > 64) rates.clear();          // players come and go; never let it grow
      r = { n: 0, since: now };
      rates.set(pid, r);
    }
    if (++r.n > DRIVE_PER_SEC) return;
    const text = JSON.stringify({ t: 'live', d: Object.assign({}, d, { from: pid }) });
    for (const ws of this.openSockets()) {
      if (screens.has(this.playerOf(ws))) { try { ws.send(text); } catch (e) {} }
    }
  }

  /**
   * الأوضة المضلمة's lenses (RoomDark.js): where each guide holds their lens over the
   * map, so every other guide sees it as a dashed ring and the TV lights it. Relayed,
   * never stored, from a guide only, and never to the mover's phone (it says nothing
   * of the map, but the mover's phone has no use for it). The same light rate limit
   * as the controllers'.
   */
  relayLens(pid, d, size) {
    const s = this.room.shared || {};
    if (!d || typeof d !== 'object' || Array.isArray(d) || size > MAX_DRIVE) return;
    if (pid === s.moverId || (s.roster || []).indexOf(pid) === -1) return;
    const now = Date.now();
    const rates = this.driveRates || (this.driveRates = new Map());
    let r = rates.get(pid);
    if (!r || now - r.since >= 1000) {
      if (rates.size > 64) rates.clear();
      r = { n: 0, since: now };
      rates.set(pid, r);
    }
    if (++r.n > DRIVE_PER_SEC) return;
    const text = JSON.stringify({ t: 'live', d: { k: 'lens', x: Number(d.x) || 0, y: Number(d.y) || 0, from: pid } });
    for (const ws of this.openSockets()) {
      const to = this.playerOf(ws);
      if (to === pid || to === s.moverId) continue;
      try { ws.send(text); } catch (e) {}
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
    // The stand-ins' moment first; the alarm then waits for the handover.
    if (pid === this.room.hostId) await this.scheduleAlarm(this.room.lastSeen[pid] + HOST_STAND_IN_MS + 500);
    // A game may have a clock that starts when a phone goes (the duels' «خسران غياب»: roomDeadline reads lastSeen).
    else await this.scheduleAlarm();
  }
}
