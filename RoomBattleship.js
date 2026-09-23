/* ============================================================================
   حرب السفن — BATTLESHIP in rooms: two duel, the room watches, winner stays on
   ----------------------------------------------------------------------------
   Bundled into the Worker after RoomDuels.js (FILES in rooms-worker/build.mjs),
   whose line and seats it uses: duelSeatNext, duelEnd, duelHere. The fleets,
   the shots and the checks are Battleship.js, shared with the page.

   The owner's rules (23 Sep 2026, asked one at a time): two play and everyone
   else watches on their phone or the TV, the winner stays on; no computer
   players in rooms. Both place their fleets (drag, turn, or a random fleet),
   each taps ready, and the first seat fires first - picked at random for the
   first game, the challenger after that, as in the duels. A hit shoots again,
   a miss passes the turn. A ship sunk is shown whole to the table and the
   water round it is marked. A turn clock, off by default (15 or 30 seconds),
   fires at a random square for a player who lets it run out; the host has the
   same "play for" a quiet phone.

   What is hidden: the two fleets, in room._bs.fleets (never projected); each
   seated phone gets its own in room.secrets[pid].fleet. The shots and what
   they hit are public - both seas, as the table would see pegs on a real
   board - and a ship's cells become public only when it sinks (seas[k].sunk).
   Both fleets are shown once the game is over (shared.reveal).

   shared, beside the duel's fields (seats, line, champ, result, scores…):
     phase     'place' | 'play' | 'over'
     settings  { turnClock }
     ready     [bool, bool] while placing
     seas      [seat 0's sea, seat 1's] - what the other side knows of each
               fleet: { grid (100 cells, Battleship.js), sunk }; seat k fires at seas[1 - k]
     turn      the seat firing · turnSeq raised at every shot and turn; a shot carries it as `seq`
     shots     how many shots so far · last { seat, cell, res, ship, water } the newest
     tally     [{ shots, hits }, { shots, hits }] for the result
     endsAt    the turn clock (and, with a clock on, the placing one)
     reveal    [seat 0's fleet, seat 1's], once over

   Decided here: with a turn clock on, placing has BS_PLACE_SECS too, after
   which whoever isn't ready sails with the fleet they have on the board (the
   server's random one, or the one they last sent); with the clock off the
   host's "play for" does the same for a quiet phone.
   ========================================================================= */
const BS_GRACE_MS = 1500;       // the server's clock acts this long after the phones'
const BS_PLACE_SECS = 90;

const bsSeatOf = (s, pid) => (s.seats || []).indexOf(pid);

const bsOptions = (payload, prev) => {
  const p = payload || {};
  const was = prev || {};
  const clock = (v) => (BS_CLOCKS.indexOf(Number(v)) !== -1 ? Number(v) : null);
  const c = clock(p.turnClock);
  return { turnClock: c !== null ? c : (clock(was.turnClock) !== null ? clock(was.turnClock) : 0) };
};

/** The clock for whoever must act now: the shot, or (with a clock on) the placing. */
const bsStartClock = (room) => {
  const s = room.shared;
  const secs = (s.settings || {}).turnClock || 0;
  if (!secs) { s.endsAt = null; return; }
  s.endsAt = s.phase === 'play' ? Date.now() + secs * 1000 : s.phase === 'place' ? Date.now() + BS_PLACE_SECS * 1000 : null;
};

/** Each seated phone holds its own fleet, and only its own. */
const bsWriteSecrets = (room) => {
  const s = room.shared;
  const g = room._bs || { fleets: [null, null] };
  room.secrets = {};
  (s.seats || []).forEach((pid, seat) => {
    if (g.fleets[seat]) room.secrets[pid] = { fleet: g.fleets[seat].map(p => ({ x: p.x, y: p.y, d: p.d })) };
  });
};

/** A fresh sea for the seats just set: a random fleet on each board to start from. */
const bsDeal = (room) => {
  const s = room.shared;
  room._bs = { fleets: [bsRandomFleet(), bsRandomFleet()] };
  s.seas = [bsNewSea(), bsNewSea()];
  s.ready = [false, false];
  s.turn = 0;
  s.shots = 0;
  s.last = null;
  s.tally = [{ shots: 0, hits: 0 }, { shots: 0, hits: 0 }];
  s.reveal = null;
  s.result = null;
  s.roster = duelHere(room);
  s.turnSeq = (s.turnSeq || 0) + 1;
  s.phase = 'place';
  room.phase = 'play';
  bsStartClock(room);
  bsWriteSecrets(room);
};

/** Both fleets are at sea: the first seat fires. */
const bsBeginPlay = (room) => {
  const s = room.shared;
  s.phase = 'play';
  room.phase = 'play';
  s.turn = 0;
  s.turnSeq = (s.turnSeq || 0) + 1;
  bsStartClock(room);
};

/** The game is over: the duel's line moves on, and both fleets are shown. */
const bsEnd = (room, winner, reason) => {
  const s = room.shared;
  duelEnd(room, winner, reason);
  s.endsAt = null;
  const f = (room._bs || {}).fleets || [null, null];
  s.reveal = [f[0] ? f[0].slice() : null, f[1] ? f[1].slice() : null];
};

/** One shot by `seat` at the other sea. A hit shoots again, a miss passes the turn. */
const bsShoot = (room, seat, cell) => {
  const s = room.shared;
  const target = 1 - seat;
  const out = bsFire(s.seas[target], room._bs.fleets[target], cell);
  if (!out) throw new Error('المربع ده اتضرب قبل كده');
  s.shots = (s.shots || 0) + 1;
  s.tally[seat].shots++;
  if (out.res !== 'miss') s.tally[seat].hits++;
  s.last = { seat: seat, cell: out.cell, res: out.res, ship: out.res === 'sunk' ? out.ship : null, water: out.water ? out.water.length : 0, n: s.shots };
  s.turnSeq = (s.turnSeq || 0) + 1;
  if (out.over) { bsEnd(room, seat, 'fleet'); return; }
  if (out.res === 'miss') s.turn = target;
  bsStartClock(room);
};

/** The clock, or the host for a phone that went quiet: placing ends with the fleets on the boards; a shot is fired at random. */
const bsAuto = (room) => {
  const s = room.shared;
  if (s.phase === 'place') {
    s.ready = [true, true];
    bsBeginPlay(room);
    return;
  }
  if (s.phase !== 'play') return;
  const cell = bsRandomCell(s.seas[1 - s.turn]);
  if (cell < 0) return;
  bsShoot(room, s.turn, cell);
};

const bsNewRoomGame = (room, playerId, payload) => {
  requireHost(room, playerId);
  if (room.players.length < DUEL_MIN_PLAYERS) throw new Error('تحتاج لاعبين على الأقل');
  const prev = room.shared || {};
  const order = shuffled(duelHere(room));
  room.shared = {
    round: 1,
    seats: [order[0], order[1]],
    seatNames: [roomPlayerName(room, order[0]), roomPlayerName(room, order[1])],
    line: order.slice(2),
    champ: null,
    prev: null,
    streak: null,
    scores: {},
    board: [],
    settings: bsOptions(payload, prev.settings),
    turnSeq: prev.turnSeq || 0
  };
  bsDeal(room);
  room.shared.board = scoreboardOf(room);
};

const battleshipAction = (room, playerId, action, payload) => {
  const p = payload || {};
  // A knockout tournament (RoomTournament.js) runs these same rules, one board per match.
  if (tourAction(room, playerId, action, payload, 'battleship')) return;
  if (action === 'start') { bsNewRoomGame(room, playerId, p); return; }

  const s = room.shared;
  if (!s || !s.phase || !Array.isArray(s.seas)) throw new Error('اللعبة لم تبدأ بعد');

  if (action === 'nextRound') {
    if (s.phase !== 'over') return;
    if (!room.players.some(x => x.id === playerId) && room.hostId !== playerId) throw new Error('لست في الغرفة');
    duelSeatNext(room);
    s.prev = s.result;
    s.round = (s.round || 1) + 1;
    bsDeal(room);
    return;
  }

  if (action === 'skipTurn') {
    requireHost(room, playerId);
    if ((s.phase !== 'play' && s.phase !== 'place') || staleTap(p, 'seq', s.turnSeq)) return;
    bsAuto(room);
    return;
  }

  const seat = bsSeatOf(s, playerId);

  if (action === 'place') {
    // Your fleet as it stands on your board, and ready. Checked here too: on the board, no ship touching another.
    if (s.phase !== 'place') return;
    if (seat === -1) throw new Error('انت بتتفرج دلوقتي');
    if (s.ready[seat]) return;
    const fleet = bsCleanFleet(p.fleet);
    if (!fleet || bsFleetProblem(fleet)) throw new Error('السفن لازم تكون جوه اللوحة ومحدش فيهم لازق في التاني');
    room._bs.fleets[seat] = fleet;
    s.ready[seat] = true;
    s.turnSeq++;
    if (s.ready[0] && s.ready[1]) bsBeginPlay(room);
    bsWriteSecrets(room);
    return;
  }

  if (action === 'unready') {
    // Back to moving your ships, while the other hasn't finished.
    if (s.phase !== 'place' || seat === -1 || !s.ready[seat]) return;
    s.ready[seat] = false;
    s.turnSeq++;
    return;
  }

  if (action === 'fire') {
    if (s.phase !== 'play' || staleTap(p, 'seq', s.turnSeq)) return;
    if (seat === -1) throw new Error('انت بتتفرج دلوقتي، استنى دورك في الطابور');
    if (seat !== s.turn) throw new Error('مش دورك');
    bsShoot(room, seat, Number(p.cell));
    return;
  }

  throw new Error('إجراء غير معروف');
};

/* --- the clock ------------------------------------------------------------------ */

const bsDeadline = (room) => {
  const s = room.shared || {};
  return (s.phase === 'play' || s.phase === 'place') && s.endsAt ? s.endsAt + BS_GRACE_MS : null;
};

const bsTimeout = (room, now) => {
  const s = room.shared || {};
  if ((s.phase !== 'play' && s.phase !== 'place') || !s.endsAt || now < s.endsAt + BS_GRACE_MS) return false;
  bsAuto(room);
  return true;
};

/* --- someone leaves: a seated player loses by forfeit, as in the duels ----------- */

const bsPlayerLeft = (room, playerId) => {
  const s = room.shared;
  if (!s || !s.phase || !Array.isArray(s.seas)) return;
  s.line = (s.line || []).filter(id => id !== playerId);
  if (s.streak && s.streak.id === playerId) s.streak = null;
  const seat = bsSeatOf(s, playerId);
  if ((s.phase === 'play' || s.phase === 'place') && seat !== -1) {
    s.turnSeq = (s.turnSeq || 0) + 1;
    bsEnd(room, 1 - seat, 'left');
    return;
  }
  if (s.champ === playerId) s.champ = null;
  s.board = scoreboardOf(room);
};
