
/* ============================================================================
   MULTIPLAYER ROOMS
   ----------------------------------------------------------------------------
   Everyone plays on their own phone instead of passing one around. One device
   creates a room, the rest join with a 4-letter code (or by scanning its QR),
   and the server holds the truth.

   Apps Script has no WebSockets, so clients poll. That is fine here: every game
   that uses this is turn-based, and a second of latency doesn't show. What the
   design does care about is cost per poll, so:

     - Live state lives in CacheService.getScriptCache(), which is shared across
       all users of the script, holds 100KB per key for up to 6 hours, and has no
       documented quota. PropertiesService is deliberately NOT on this path — it
       is capped at 50,000 reads+writes/day on a consumer account.
     - A poll is a cache read plus a JSON parse. Mutations take a lock; reads
       don't.
     - Rooms are ephemeral by design. If one expires, players are told the room
       ended rather than the app pretending to recover it.

   Hidden information is enforced server-side: `secrets` never leaves the server
   except for the slice belonging to the player who asked. A client can't read
   another player's role by inspecting network traffic.
   ========================================================================= */

// No O/0/I/1 — they get misread when someone reads a code out loud.
const ROOM_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const ROOM_CODE_LEN = 4;
const ROOM_TTL_SECONDS = 21600;   // 6h, the cache maximum
const PRESENCE_TTL_SECONDS = 3600;
const ONLINE_WINDOW_MS = 20000;   // no poll for this long ⇒ shown as away
const LOCK_WAIT_MS = 8000;

const roomKey = (code) => 'room_' + code;
const presenceKey = (code) => 'pres_' + code;

/** The deployed /exec URL, so the host can render a QR that points at it. */
const getWebAppUrl = () => {
  try {
    return ScriptApp.getService().getUrl();
  } catch (err) {
    return '';
  }
};

const randomRoomCode = () => {
  let out = '';
  for (let i = 0; i < ROOM_CODE_LEN; i++) {
    out += ROOM_ALPHABET.charAt(Math.floor(Math.random() * ROOM_ALPHABET.length));
  }
  return out;
};

const newPlayerId = () =>
  'p' + Date.now().toString(36) + Math.floor(Math.random() * 1e6).toString(36);

const readRoom = (code) => {
  const raw = CacheService.getScriptCache().get(roomKey(code));
  return raw ? JSON.parse(raw) : null;
};

const writeRoom = (room) => {
  room.updatedAt = Date.now();
  CacheService.getScriptCache().put(roomKey(room.code), JSON.stringify(room), ROOM_TTL_SECONDS);
  return room;
};

/**
 * Presence is tracked in its own cache entry so an idle poll never has to write
 * the room itself — that keeps polls off the lock entirely.
 */
const touchPresence = (code, playerId) => {
  if (!playerId) return {};
  const cache = CacheService.getScriptCache();
  const raw = cache.get(presenceKey(code));
  const seen = raw ? JSON.parse(raw) : {};
  seen[playerId] = Date.now();
  cache.put(presenceKey(code), JSON.stringify(seen), PRESENCE_TTL_SECONDS);
  return seen;
};

const readPresence = (code) => {
  const raw = CacheService.getScriptCache().get(presenceKey(code));
  return raw ? JSON.parse(raw) : {};
};

/**
 * What a specific player is allowed to see: the shared state, plus their own
 * slice of `secrets` and nothing else.
 */
const projectRoom = (room, playerId, presence) => {
  const now = Date.now();
  const seen = presence || {};
  return {
    code: room.code,
    version: room.version,
    game: room.game,
    phase: room.phase,
    hostId: room.hostId,
    youAreHost: room.hostId === playerId,
    players: room.players.map(p => ({
      id: p.id,
      name: p.name,
      online: (now - (seen[p.id] || 0)) < ONLINE_WINDOW_MS
    })),
    shared: room.shared || {},
    you: (room.secrets && room.secrets[playerId]) || null,
    // False for someone who joined after this game was dealt.
    inGame: !room.shared || !room.shared.roster
      ? true
      : room.shared.roster.indexOf(playerId) !== -1
  };
};

/** Applies a mutation to a room under a lock, then returns the new projection. */
const mutateRoom = (code, playerId, mutator) => {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(LOCK_WAIT_MS)) {
    throw new Error('الخادم مشغول، حاول مرة أخرى');
  }
  try {
    const room = readRoom(code);
    if (!room) throw new Error('ROOM_NOT_FOUND');
    mutator(room);
    room.version++;
    writeRoom(room);
    return projectRoom(room, playerId, touchPresence(code, playerId));
  } finally {
    lock.releaseLock();
  }
};

/* --- Public API called from the client via google.script.run -------------- */

const createRoom = (hostName, gameId) => {
  // gameId is optional: a room with no game sits in the hub until the host
  // picks one, and returns there after every game.
  const name = String(hostName || '').trim().slice(0, 24) || 'Host';
  const cache = CacheService.getScriptCache();

  // Codes are short, so check for a live collision before claiming one.
  let code = null;
  for (let attempt = 0; attempt < 8; attempt++) {
    const candidate = randomRoomCode();
    if (!cache.get(roomKey(candidate))) { code = candidate; break; }
  }
  if (!code) throw new Error('تعذر إنشاء غرفة، حاول مرة أخرى');

  const hostId = newPlayerId();
  const room = {
    code: code,
    version: 1,
    game: gameId || null,
    phase: 'lobby',
    hostId: hostId,
    players: [{ id: hostId, name: name }],
    shared: {},
    secrets: {},
    createdAt: Date.now()
  };
  writeRoom(room);

  return {
    playerId: hostId,
    joinUrl: getWebAppUrl() ? getWebAppUrl() + '?room=' + code : '',
    state: projectRoom(room, hostId, touchPresence(code, hostId))
  };
};

const joinRoom = (rawCode, playerName) => {
  const code = String(rawCode || '').trim().toUpperCase();
  const name = String(playerName || '').trim().slice(0, 24);
  if (!name) throw new Error('اكتب اسمك أولاً');

  const room = readRoom(code);
  if (!room) throw new Error('ROOM_NOT_FOUND');
  if (room.players.length >= 12) throw new Error('الغرفة ممتلئة');
  // Joining mid-game is allowed. The newcomer isn't in the current round's
  // roster, so they watch until it ends and are dealt into the next one.

  const taken = room.players.some(p => p.name.toLowerCase() === name.toLowerCase());
  if (taken) throw new Error('الاسم مستخدم بالفعل في هذه الغرفة');

  const playerId = newPlayerId();
  const state = mutateRoom(code, playerId, (r) => {
    r.players.push({ id: playerId, name: name });
  });
  return { playerId: playerId, state: state };
};

/**
 * The polling endpoint. Deliberately cheap: a presence write, a cache read and
 * a projection. Clients pass the version they already have and re-render only
 * when something actually moved.
 */
const pollRoom = (rawCode, playerId, knownVersion) => {
  const code = String(rawCode || '').trim().toUpperCase();
  const room = readRoom(code);
  if (!room) return { gone: true };

  const presence = touchPresence(code, playerId);
  const known = room.players.some(p => p.id === playerId);
  if (!known) return { kicked: true };

  // Most polls land on a room nobody has touched since the last one. Sending
  // the whole projection again is the single biggest thing this layer spends
  // on the wire, so an unchanged room answers with presence only — who is
  // still here is the one thing that moves without bumping the version.
  if (Number(knownVersion) === room.version) {
    const now = Date.now();
    return {
      same: true,
      version: room.version,
      online: room.players
        .filter(p => (now - (presence[p.id] || 0)) < ONLINE_WINDOW_MS)
        .map(p => p.id)
    };
  }

  return { state: projectRoom(room, playerId, presence) };
};

const leaveRoom = (rawCode, playerId) => {
  const code = String(rawCode || '').trim().toUpperCase();
  const room = readRoom(code);
  if (!room) return { gone: true };
  try {
    mutateRoom(code, playerId, (r) => {
      r.players = r.players.filter(p => p.id !== playerId);
      if (r.secrets) delete r.secrets[playerId];
      // Hand the room to whoever is left rather than orphaning it.
      if (r.hostId === playerId && r.players.length) r.hostId = r.players[0].id;
    });
  } catch (err) {
    if (String(err.message).indexOf('ROOM_NOT_FOUND') === -1) throw err;
  }
  return { left: true };
};

/**
 * Every in-game move goes through here. The game rules live in
 * applyRoomAction below, one branch per game, so the transport stays generic.
 */
const roomAction = (rawCode, playerId, action, payload) => {
  const code = String(rawCode || '').trim().toUpperCase();
  return mutateRoom(code, playerId, (room) => {
    // Every rule downstream assumes the caller is one of the players. Check it
    // once here rather than trusting each game to do it.
    if (!room.players.some(p => p.id === playerId)) {
      throw new Error('NOT_IN_ROOM');
    }
    applyRoomAction(room, playerId, String(action || ''), payload || {});
  });
};
