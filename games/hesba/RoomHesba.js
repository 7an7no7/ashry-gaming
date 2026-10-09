// Bundled into the rooms server after RoomGames.js (FILES in rooms-worker/build.mjs), whose helpers it uses.
/* ==========================================================================
   حسبة — Numbers in rooms (the owner's rules, 9 Oct 2026)
   --------------------------------------------------------------------------
   The same numbers and target on every phone (dealt here, from a seed, by
   hesbaDeal in Hesba.js: always reachable exactly). Each phone merges its
   tiles and sends its steps; the server replays them (hesbaReplay) and keeps
   each player's closest. The first exact answer takes the round at once; if
   nobody is exact when the clock ends, the closest takes it (a tie shares).
   Then one exact way is shown: the winner's own when it was exact, else the
   solver's. Rounds won are the board. The host picks the time (30/60/90 s),
   the rounds (3/5/7) and the level (سهل/صعب).

   What is hidden until the round closes: the exact way (room._hesba.way)
   and every phone's steps (room.secrets[pid].steps: its own phone only, so
   nobody copies a way). What is shared live: who sent what number and how
   far it is - what a table calling numbers out would hear anyway.

   Phases (shared.phase): play (the clock runs) -> reveal (the result and
   the way; the host's «الجولة الجاية») -> ... -> gameover after the last.
   Every name here starts with hesba / HESBA_.
   ========================================================================== */
const HESBA_MIN_PLAYERS = 1;
const HESBA_SECS = [30, 60, 90];
const HESBA_ROUND_COUNTS = [3, 5, 7];
const HESBA_GRACE_MS = 1500;   // an answer sent at a phone's 0:00 still on its way

/** Everyone dealt in who is still here. */
const hesbaSeated = (room) => activeRoster(room, (room.shared || {}).roster);

/** The night's board: rounds won, best first; the closest answers break a tie. */
const hesbaBoard = (room) => {
  const s = room.shared || {};
  return (s.roster || []).map(pid => ({ id: pid, name: roomPlayerName(room, pid), score: (s.wins || {})[pid] || 0, exact: (s.exacts || {})[pid] || 0, off: (s.offs || {})[pid] || 0 }))
    .sort((a, b) => b.score - a.score || b.exact - a.exact || a.off - b.off);
};

/** Deals round `round`: new numbers and target, nobody has sent, the clock started. */
const hesbaDealRound = (room) => {
  const s = room.shared;
  const seed = (Math.floor(Math.random() * 4294967296) >>> 0) || 1;
  const d = hesbaDeal(s.level, hesbaRng(seed));
  room._hesba = { way: d.way, seed };
  room.secrets = {};
  const now = Date.now();
  Object.assign(s, {
    phase: 'play', nums: d.nums, target: d.target, sent: {}, result: null,
    startedAt: now, endsAt: now + s.secs * 1000
  });
  room.phase = 'play';
};

/** The round closes: its winner (or winners), the way shown, the board; the end after the last. */
const hesbaClose = (room, exactBy) => {
  const s = room.shared;
  if (s.phase !== 'play') return;
  const sent = s.sent || {};
  const ids = Object.keys(sent).filter(pid => s.roster.indexOf(pid) !== -1);
  let winners = [];
  let off = null;
  if (exactBy) { winners = [exactBy]; off = 0; } else if (ids.length) {
    off = Math.min.apply(null, ids.map(pid => sent[pid].d));
    winners = ids.filter(pid => sent[pid].d === off).sort((a, b) => sent[a].at - sent[b].at);
  }
  s.wins = s.wins || {}; s.exacts = s.exacts || {}; s.offs = s.offs || {};
  winners.forEach(pid => { s.wins[pid] = (s.wins[pid] || 0) + 1; });
  ids.forEach(pid => { if (sent[pid].d === 0) s.exacts[pid] = (s.exacts[pid] || 0) + 1; s.offs[pid] = (s.offs[pid] || 0) + sent[pid].d; });
  // The way: the exact winner's own steps, else one the solver found.
  const own = exactBy && room.secrets[exactBy] ? hesbaWayOf(s.nums, room.secrets[exactBy].steps) : null;
  s.result = { winners, off, exact: off === 0, way: own || (room._hesba || {}).way || [], wayOf: own ? exactBy : null, at: exactBy ? sent[exactBy].at : null };
  room.secrets = {};
  room._hesba = null;
  s.endsAt = null;
  s.board = hesbaBoard(room);
  s.phase = s.round >= s.rounds ? 'gameover' : 'reveal';
  room.phase = s.phase === 'gameover' ? 'gameover' : 'play';
};

ROOM_RULES.hesba = {
  action(room, playerId, action, payload) {
    const p = payload || {};
    if (action === 'start' || action === 'playAgain') {
      requireHost(room, playerId);
      if (room.players.length < HESBA_MIN_PLAYERS) throw new Error('تحتاج لاعبين على الأقل');
      const prev = room.shared || {};
      if (action === 'playAgain' && prev.phase !== 'gameover') return;
      const pick = (v, list, def) => (list.indexOf(Number(v)) !== -1 ? Number(v) : def);
      const opts = action === 'playAgain' ? { secs: prev.secs, rounds: prev.rounds, level: prev.level } : p;
      room.shared = {
        roster: room.players.filter(x => !x.bot).map(x => x.id),
        round: 1,
        rounds: pick(opts.rounds, HESBA_ROUND_COUNTS, 5),
        secs: pick(opts.secs, HESBA_SECS, 60),
        level: opts.level === 'hard' ? 'hard' : 'easy',
        wins: {}, exacts: {}, offs: {}, board: []
      };
      room.shared.board = hesbaBoard(room);
      hesbaDealRound(room);
      return;
    }
    const s = room.shared;
    if (!s || !s.phase) throw new Error('اللعبة لم تبدأ بعد');
    if (action === 'send') {
      if (s.phase !== 'play' || staleTap(p, 'round', s.round)) return;
      if (s.roster.indexOf(playerId) === -1) return;                       // watching
      if (Date.now() > s.endsAt + HESBA_GRACE_MS) return;
      // The steps are replayed here: a phone's value is never taken on its word.
      const steps = Array.isArray(p.steps) ? p.steps : [];
      const pool = hesbaReplay(s.nums, steps);
      if (!pool) throw new Error('خطوة مش صحيحة');
      const pickAt = Number(p.pick);
      if (!Number.isInteger(pickAt) || pickAt < 0 || pickAt >= pool.length) throw new Error('خطوة مش صحيحة');
      const v = pool[pickAt];
      const d = Math.abs(s.target - v);
      const was = s.sent[playerId];
      if (was && was.d <= d) return;                                          // not closer than before
      s.sent[playerId] = { v, d, at: Math.max(0, Date.now() - s.startedAt) };
      room.secrets[playerId] = { steps: steps.map(st => [st[0], st[1], st[2]]), pick: pickAt, v };
      if (d === 0) hesbaClose(room, playerId);
      return;
    }
    if (action === 'nextRound') {
      requireMoveOn(room, playerId);
      if (staleTap(p, 'round', s.round) || s.phase !== 'reveal') return;
      s.round += 1;
      hesbaDealRound(room);
      return;
    }
    if (action === 'finish') {
      // The host ends a round before its clock (the table is done thinking).
      requireMoveOn(room, playerId);
      if (staleTap(p, 'round', s.round)) return;
      hesbaClose(room, null);
      return;
    }
    throw new Error('إجراء غير معروف');
  },
  deadline(room) {
    const s = room.shared || {};
    return s.phase === 'play' && s.endsAt ? s.endsAt + HESBA_GRACE_MS : null;
  },
  timeout(room, now) {
    const s = room.shared || {};
    if (s.phase !== 'play' || !s.endsAt || now < s.endsAt + HESBA_GRACE_MS) return false;
    hesbaClose(room, null);
    return true;
  },
  left(room, playerId) {
    const s = room.shared;
    if (!s || !s.roster || s.phase === 'gameover') return;
    if (s.roster.indexOf(playerId) === -1) return;
    // Their answer goes with them, and their place on the board (a board is the roster's).
    if (s.sent) delete s.sent[playerId];
    delete room.secrets[playerId];
    s.roster = s.roster.filter(id => id !== playerId);
    if (!hesbaSeated(room).length) { if (s.phase === 'play') hesbaClose(room, null); s.phase = 'gameover'; room.phase = 'gameover'; }
    s.board = hesbaBoard(room);
  }
};
