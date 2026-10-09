// Bundled into the rooms server after RoomGames.js (FILES in rooms-worker/build.mjs), whose helpers it uses.
/* ==========================================================================
   سد الطريق — Block the Way in rooms (made by tools/new-game.mjs, 2026-10-09)
   --------------------------------------------------------------------------
   The game every new room game starts as, to be replaced by the real one:
   each person is dealt a secret number (3 to 9) only their own phone sees,
   taps «+1» until they think they have reached it, and says «خلصت». When
   everyone has (or the clock runs out, or the host ends the round), the
   numbers go on the table and the nearest wins.

   What it shows, as the pattern for the real game: a secret in
   room.secrets[pid] and nowhere else until the result; a clock the server
   keeps (deadline, timeout); a tap that says which round it was for
   (staleTap); the host's way forward (finish, requireMoveOn); someone leaving
   mid-round (left); and a board, best first, with a score, for the night's
   points. The rules register themselves: ROOM_RULES in RoomGames.js.
   ========================================================================== */
const BLOCKWAY_MIN_PLAYERS = 2;
const BLOCKWAY_ROUND_MS = 60000;

/** Everyone dealt in who is still here. */
const blockwaySeated = (room) => activeRoster(room, room.shared.roster);

/** Deals a round: a fresh secret each, everyone at 0, the clock started. */
const blockwayDeal = (room) => {
  const roster = room.players.map(p => p.id);
  room.secrets = {};
  roster.forEach(pid => { room.secrets[pid] = { target: 3 + Math.floor(Math.random() * 7) }; });
  room.shared = { phase: 'play', round: 1, roster, counts: {}, done: [], endsAt: Date.now() + BLOCKWAY_ROUND_MS };
  room.phase = 'play';
};

/** The result: every secret on the table, the board best first (the nearest wins). */
const blockwayFinish = (room) => {
  const s = room.shared;
  if (s.phase !== 'play') return;
  const targets = {};
  s.board = s.roster.map(pid => {
    const target = (room.secrets[pid] || {}).target || 0;
    const count = s.counts[pid] || 0;
    targets[pid] = target;
    return { id: pid, name: roomPlayerName(room, pid), count, target, score: Math.max(0, 10 - Math.abs(target - count)) };
  }).sort((a, b) => b.score - a.score);
  s.targets = targets;
  s.phase = 'gameover';
  s.endsAt = null;
  room.phase = 'gameover';
};

/** Everyone still here has said «خلصت»: the result. */
const blockwayCheck = (room) => {
  const s = room.shared;
  if (s.phase === 'play' && blockwaySeated(room).every(pid => s.done.indexOf(pid) !== -1)) blockwayFinish(room);
};

ROOM_RULES.blockway = {
  action(room, playerId, action, payload) {
    if (action === 'start' || action === 'playAgain') {
      requireHost(room, playerId);
      if (room.players.length < BLOCKWAY_MIN_PLAYERS) throw new Error('تحتاج لاعبين على الأقل');
      if (action === 'playAgain' && (room.shared || {}).phase !== 'gameover') return;
      blockwayDeal(room);
      return;
    }
    const s = room.shared;
    if (!s || !s.phase) throw new Error('اللعبة لم تبدأ بعد');
    const mine = s.roster.indexOf(playerId) !== -1 && s.done.indexOf(playerId) === -1;
    if (action === 'tap') {
      if (s.phase !== 'play' || staleTap(payload, 'round', s.round) || !mine) return;
      s.counts[playerId] = (s.counts[playerId] || 0) + 1;
      return;
    }
    if (action === 'done') {
      if (s.phase !== 'play' || staleTap(payload, 'round', s.round) || !mine) return;
      s.done.push(playerId);
      blockwayCheck(room);
      return;
    }
    if (action === 'finish') {
      requireMoveOn(room, playerId);
      if (staleTap(payload, 'round', s.round)) return;
      blockwayFinish(room);
      return;
    }
    throw new Error('إجراء غير معروف');
  },
  deadline(room) {
    const s = room.shared || {};
    return s.phase === 'play' && s.endsAt ? s.endsAt : null;
  },
  timeout(room, now) {
    const s = room.shared || {};
    if (s.phase !== 'play' || !s.endsAt || now < s.endsAt) return false;
    blockwayFinish(room);
    return true;
  },
  left(room) {
    blockwayCheck(room);
  }
};
