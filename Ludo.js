/* ============================================================================
   لودو — LUDO: the board, the rules and the computer players
   ----------------------------------------------------------------------------
   One copy for both sides: the page inlines this file (SHARED_LISTS in
   tools/build-*.mjs) for a game against the phone and to draw the board, and
   the rooms server bundles it (FILES in rooms-worker/build.mjs) to judge a
   room. No DOM, nothing that runs at load, every name prefixed ludo / LUDO_.

   The owner's rules (21 Sep 2026, asked one at a time):
     - 2 to 4 players, each for themselves, four pieces each.
     - A piece leaves the yard on a 6 only. A 6 gives another roll; a third 6
       in a row is not played and the turn passes.
     - Safe squares: the four start squares and the four stars. Anything else,
       landing on a single piece of another colour sends it back to its yard.
     - Two or more of one player's pieces on one square are a wall: no other
       player can pass it or land on it.
     - Home needs the exact number.
     - The game plays on for places: the first home wins, the rest play for
       second and third, and the last one left takes the last place.

   The board is the classic 15 x 15 cross, left to right in every language
   (a physical board). Columns and rows are counted from the top-left corner.
   The four yards: G top-left, Y top-right, B bottom-right, R bottom-left.
   Pieces go round clockwise, and so do the turns: G, Y, B, R.

   A piece's place is a number from its own start: -1 in the yard, 0..50 on
   the track (0 its start square, 50 the square before its home column),
   51..55 its home column, 56 home (the middle).

   The game is one plain object, shaped like a room's `shared` so the server
   can use it as it is:
     { seats: [pid...] in turn order, colors: { pid: 'G'|'Y'|'B'|'R' },
       pieces: { pid: [p, p, p, p] }, turn: { pid, stage: 'roll'|'move',
       dice, sixes }, movable: [piece...], places: [pid...], phase:
       'play'|'gameover', turnSeq, events: [...], eventSeq }
   Every change is an event (`events`, the last LUDO_EVENTS), which is what the
   screens animate: rolloff, roll, three, nomove, move (with the pieces it
   sent home), finish, over.
   ========================================================================= */

const LUDO_COLORS = ['G', 'Y', 'B', 'R'];
const LUDO_START = { G: 0, Y: 13, B: 26, R: 39 };    // each colour's start square on the shared track
const LUDO_TRACK = 52;
const LUDO_LAST_TRACK = 50;
const LUDO_HOME = 56;
const LUDO_PIECES = 4;
const LUDO_SAFE = [0, 8, 13, 21, 26, 34, 39, 47];   // the four starts and the four stars
const LUDO_STARS = [8, 21, 34, 47];
const LUDO_MIN_PLAYERS = 2;
const LUDO_MAX_PLAYERS = 4;
const LUDO_CLOCKS = [0, 15, 30];
const LUDO_EVENTS = 40;

/** The shared track, square by square from G's start, as [column, row]. */
const LUDO_TRACK_CELLS = [
  [1, 6], [2, 6], [3, 6], [4, 6], [5, 6], [6, 5], [6, 4], [6, 3], [6, 2], [6, 1], [6, 0], [7, 0], [8, 0],
  [8, 1], [8, 2], [8, 3], [8, 4], [8, 5], [9, 6], [10, 6], [11, 6], [12, 6], [13, 6], [14, 6], [14, 7], [14, 8],
  [13, 8], [12, 8], [11, 8], [10, 8], [9, 8], [8, 9], [8, 10], [8, 11], [8, 12], [8, 13], [8, 14], [7, 14], [6, 14],
  [6, 13], [6, 12], [6, 11], [6, 10], [6, 9], [5, 8], [4, 8], [3, 8], [2, 8], [1, 8], [0, 8], [0, 7], [0, 6]
];

/** Each colour's home column, from its first square to the one before the middle. */
const LUDO_HOME_CELLS = {
  G: [[1, 7], [2, 7], [3, 7], [4, 7], [5, 7]],
  Y: [[7, 1], [7, 2], [7, 3], [7, 4], [7, 5]],
  B: [[13, 7], [12, 7], [11, 7], [10, 7], [9, 7]],
  R: [[7, 13], [7, 12], [7, 11], [7, 10], [7, 9]]
};

/** The top-left corner of each yard, and the four spots in it (centres, in cells). */
const LUDO_YARD = { G: [0, 0], Y: [9, 0], B: [9, 9], R: [0, 9] };
const LUDO_SPOTS = [[2, 2], [4, 2], [2, 4], [4, 4]];
/** Where a piece that has come home sits in the middle: in its colour's triangle. */
const LUDO_MIDDLE = { G: [6.55, 7.5], Y: [7.5, 6.55], B: [8.45, 7.5], R: [7.5, 8.45] };

/** A place on the shared track (0..51), or null in the yard, the home column or home. */
const ludoGlobal = (color, rel) => (rel >= 0 && rel <= LUDO_LAST_TRACK ? (LUDO_START[color] + rel) % LUDO_TRACK : null);

/**
 * Where a piece is drawn, in cells (its centre): the yard spot of piece `i`,
 * a track square, its home column, or the middle.
 */
const ludoCellOf = (color, rel, i) => {
  if (rel < 0) {
    const y = LUDO_YARD[color];
    const s = LUDO_SPOTS[i % 4];
    return [y[0] + s[0], y[1] + s[1]];
  }
  if (rel <= LUDO_LAST_TRACK) {
    const c = LUDO_TRACK_CELLS[ludoGlobal(color, rel)];
    return [c[0] + 0.5, c[1] + 0.5];
  }
  if (rel < LUDO_HOME) {
    const c = LUDO_HOME_CELLS[color][rel - LUDO_LAST_TRACK - 1];
    return [c[0] + 0.5, c[1] + 0.5];
  }
  return LUDO_MIDDLE[color].slice();
};

/** The squares a piece passes through on a move, the last one where it stops (in `rel`). */
const ludoPath = (from, to) => {
  if (from < 0) return [0];
  const out = [];
  for (let r = from + 1; r <= to; r++) out.push(r);
  return out;
};

/* --- a game ------------------------------------------------------------------- */

/**
 * A new game for these players and colours: every piece in its yard, the
 * seats in the order the turns go (G, Y, B, R), and `first` to play.
 */
const ludoNewGame = (ids, colors, first) => {
  const seats = ids.slice().sort((a, b) => LUDO_COLORS.indexOf(colors[a]) - LUDO_COLORS.indexOf(colors[b]));
  const pieces = {};
  seats.forEach(id => { pieces[id] = [-1, -1, -1, -1]; });
  const cols = {};
  seats.forEach(id => { cols[id] = colors[id]; });
  return {
    seats: seats,
    colors: cols,
    pieces: pieces,
    turn: { pid: seats.indexOf(first) !== -1 ? first : seats[0], stage: 'roll', dice: null, sixes: 0 },
    movable: [],
    places: [],
    phase: 'play',
    turnSeq: 1,
    events: [],
    eventSeq: 0
  };
};

/**
 * The colours for the players who didn't pick one: each takes the free colour
 * furthest from those already taken, so two players sit opposite each other.
 * Nobody picked at all: the first starts at the bottom left (R).
 */
const ludoFillColors = (ids, picked) => {
  const out = {};
  const taken = [];
  ids.forEach(id => {
    const c = picked && picked[id];
    if (LUDO_COLORS.indexOf(c) !== -1 && taken.indexOf(c) === -1) { out[id] = c; taken.push(c); }
  });
  ids.forEach(id => {
    if (out[id]) return;
    const free = LUDO_COLORS.filter(c => taken.indexOf(c) === -1);
    if (!free.length) return;
    let best = taken.length ? free[0] : (free.indexOf('R') !== -1 ? 'R' : free[0]);
    if (taken.length) {
      let bestD = -1;
      free.forEach(c => {
        const d = Math.min.apply(null, taken.map(t => {
          const k = Math.abs(LUDO_COLORS.indexOf(c) - LUDO_COLORS.indexOf(t));
          return Math.min(k, 4 - k);
        }));
        if (d > bestD) { bestD = d; best = c; }
      });
    }
    out[id] = best;
    taken.push(best);
  });
  return out;
};

/**
 * Who starts: everyone rolls once, the highest starts, and those level on top
 * roll again. Returns { first, rounds: [[{ pid, n }...]...] } for the screens
 * to show. `rng` gives a number in [0, 1).
 */
const ludoRollOff = (ids, rng) => {
  const roll = () => 1 + Math.floor((rng || Math.random)() * 6);
  let left = ids.slice();
  const rounds = [];
  for (let k = 0; k < 20 && left.length > 1; k++) {
    const round = left.map(pid => ({ pid: pid, n: roll() }));
    rounds.push(round);
    const top = Math.max.apply(null, round.map(r => r.n));
    left = round.filter(r => r.n === top).map(r => r.pid);
  }
  return { first: left[0], rounds: rounds };
};

const ludoEvent = (g, type, fields) => {
  const clean = {};
  Object.keys(fields || {}).forEach(k => { if (fields[k] !== undefined && fields[k] !== null) clean[k] = fields[k]; });
  g.eventSeq = (g.eventSeq || 0) + 1;
  g.events = (g.events || []).concat([Object.assign({ seq: g.eventSeq, type: type }, clean)]).slice(-LUDO_EVENTS);
};

/** The player whose pieces stand on a track square as a wall (two or more), or null. */
const ludoWallAt = (g, global) => {
  for (const pid of g.seats) {
    const color = g.colors[pid];
    const n = (g.pieces[pid] || []).filter(r => ludoGlobal(color, r) === global).length;
    if (n >= 2) return pid;
  }
  return null;
};

/** Every piece of the other players on a track square: [{ pid, piece }]. */
const ludoOthersAt = (g, pid, global) => {
  const out = [];
  g.seats.forEach(o => {
    if (o === pid) return;
    (g.pieces[o] || []).forEach((r, i) => { if (ludoGlobal(g.colors[o], r) === global) out.push({ pid: o, piece: i }); });
  });
  return out;
};

/**
 * Where `pid`'s piece `i` goes with `dice`, or null when it can't:
 * { from, to, cap: [{ pid, piece }] }.
 */
const ludoTarget = (g, pid, i, dice) => {
  const color = g.colors[pid];
  const from = (g.pieces[pid] || [])[i];
  if (from === undefined || from === LUDO_HOME) return null;
  if (from < 0) {
    if (dice !== 6) return null;
    const start = LUDO_START[color];
    const wall = ludoWallAt(g, start);
    if (wall && wall !== pid) return null;
    // The start square is safe: whoever is there stays.
    return { from: -1, to: 0, cap: [] };
  }
  const to = from + dice;
  if (to > LUDO_HOME) return null;
  // Nobody passes or lands on another player's wall.
  for (let r = from + 1; r <= Math.min(to, LUDO_LAST_TRACK); r++) {
    const wall = ludoWallAt(g, ludoGlobal(color, r));
    if (wall && wall !== pid) return null;
  }
  let cap = [];
  if (to <= LUDO_LAST_TRACK) {
    const at = ludoGlobal(color, to);
    if (LUDO_SAFE.indexOf(at) === -1) cap = ludoOthersAt(g, pid, at);
  }
  return { from: from, to: to, cap: cap };
};

/** The pieces `pid` can move with `dice`. */
const ludoMovable = (g, pid, dice) => {
  const out = [];
  (g.pieces[pid] || []).forEach((r, i) => { if (ludoTarget(g, pid, i, dice)) out.push(i); });
  return out;
};

/**
 * The moves that differ: two pieces on the same place come to the same thing,
 * so only one of them counts (the lowest index).
 */
const ludoDistinct = (g, pid, dice) => {
  const seen = new Set();
  return ludoMovable(g, pid, dice).filter(i => {
    const at = g.pieces[pid][i];
    if (seen.has(at)) return false;
    seen.add(at);
    return true;
  });
};

/** A move that brings a player's last piece home: it wins them their place. */
const ludoIsFinishing = (g, pid, i, dice) => {
  const t = ludoTarget(g, pid, i, dice);
  if (!t || t.to !== LUDO_HOME) return false;
  return g.pieces[pid].every((r, k) => k === i || r === LUDO_HOME);
};

const ludoFinished = (g, pid) => (g.pieces[pid] || []).length > 0 && g.pieces[pid].every(r => r === LUDO_HOME);
const ludoActive = (g) => g.seats.filter(pid => g.places.indexOf(pid) === -1);

/** The turn goes round to the next player still playing. */
const ludoNextTurn = (g) => {
  const at = g.seats.indexOf(g.turn.pid);
  for (let k = 1; k <= g.seats.length; k++) {
    const next = g.seats[(at + k + g.seats.length) % g.seats.length];
    if (g.places.indexOf(next) === -1) {
      g.turn = { pid: next, stage: 'roll', dice: null, sixes: 0 };
      g.movable = [];
      g.turnSeq = (g.turnSeq || 0) + 1;
      return;
    }
  }
};

/** Once one player is left, they take the last place and the game is over. */
const ludoCheckOver = (g) => {
  const left = ludoActive(g);
  if (left.length > 1) return false;
  if (left.length === 1) {
    g.places.push(left[0]);
    ludoEvent(g, 'finish', { pid: left[0], place: g.places.length, last: true });
  }
  g.phase = 'gameover';
  g.turn = { pid: null, stage: null, dice: null, sixes: 0 };
  g.movable = [];
  g.turnSeq = (g.turnSeq || 0) + 1;
  ludoEvent(g, 'over', { places: g.places.slice() });
  return true;
};

/**
 * `pid` rolls `n`. A third 6 in a row loses the turn; nothing to move passes
 * it (a 6 still rolls again); otherwise the player picks a piece.
 */
const ludoRoll = (g, pid, n) => {
  if (g.phase !== 'play' || g.turn.pid !== pid || g.turn.stage !== 'roll') throw new Error('مش وقت الزهر');
  const dice = Math.max(1, Math.min(6, Math.floor(Number(n)) || 1));
  const sixes = dice === 6 ? (g.turn.sixes || 0) + 1 : 0;
  ludoEvent(g, 'roll', { pid: pid, n: dice, sixes: sixes || undefined });
  if (sixes >= 3) {
    ludoEvent(g, 'three', { pid: pid });
    ludoNextTurn(g);
    return;
  }
  const movable = ludoMovable(g, pid, dice);
  if (!movable.length) {
    ludoEvent(g, 'nomove', { pid: pid, n: dice });
    if (dice === 6) {
      g.turn = { pid: pid, stage: 'roll', dice: null, sixes: sixes };
      g.movable = [];
      g.turnSeq = (g.turnSeq || 0) + 1;
    } else {
      ludoNextTurn(g);
    }
    return;
  }
  g.turn = { pid: pid, stage: 'move', dice: dice, sixes: sixes };
  g.movable = movable;
  g.turnSeq = (g.turnSeq || 0) + 1;
};

/** `pid` moves piece `i` by the dice rolled. */
const ludoMove = (g, pid, i) => {
  if (g.phase !== 'play' || g.turn.pid !== pid || g.turn.stage !== 'move') throw new Error('مش وقت الحركة');
  const piece = Math.floor(Number(i));
  const dice = g.turn.dice;
  const t = ludoTarget(g, pid, piece, dice);
  if (!t) throw new Error('الحجر ده مايتحركش بالرقم ده');
  g.pieces[pid][piece] = t.to;
  t.cap.forEach(c => { g.pieces[c.pid][c.piece] = -1; });
  ludoEvent(g, 'move', { pid: pid, piece: piece, from: t.from, to: t.to, n: dice, cap: t.cap.length ? t.cap : undefined });
  if (ludoFinished(g, pid)) {
    g.places.push(pid);
    ludoEvent(g, 'finish', { pid: pid, place: g.places.length });
    if (ludoCheckOver(g)) return;
    ludoNextTurn(g);
    return;
  }
  if (dice === 6) {
    g.turn = { pid: pid, stage: 'roll', dice: null, sixes: g.turn.sixes || 0 };
    g.movable = [];
    g.turnSeq = (g.turnSeq || 0) + 1;
    return;
  }
  ludoNextTurn(g);
};

/**
 * A player leaves: their pieces go, their turn passes on, and with one player
 * left the game is over (they take the next place).
 */
const ludoRemovePlayer = (g, pid) => {
  const at = g.seats.indexOf(pid);
  if (at === -1) return;
  const wasUp = g.phase === 'play' && g.turn.pid === pid;
  const next = g.seats[(at + 1) % g.seats.length];
  g.seats = g.seats.filter(x => x !== pid);
  delete g.pieces[pid];
  g.places = g.places.filter(x => x !== pid);
  if (g.phase !== 'play') return;
  if (ludoCheckOver(g)) return;
  if (wasUp) {
    // The seat after theirs, or the next still playing from there.
    g.turn = { pid: next, stage: 'roll', dice: null, sixes: 0 };
    if (g.places.indexOf(next) !== -1) ludoNextTurn(g);
    else { g.movable = []; g.turnSeq = (g.turnSeq || 0) + 1; }
  }
};

/* --- the computer players ---------------------------------------------------------
   From the board alone - it is all on the table. Easy moves any piece that can.
   Hard: takes a piece when it can, brings a piece home or into its column,
   gets a piece out on a 6, runs a piece that could be taken, lands on safe
   squares and walls, and stays out of reach of the pieces behind it.
   ------------------------------------------------------------------------------ */

/** How many of the other players' pieces could reach a track square next roll. */
const ludoThreat = (g, pid, global) => {
  if (global === null || LUDO_SAFE.indexOf(global) !== -1) return 0;
  let n = 0;
  g.seats.forEach(o => {
    if (o === pid || g.places.indexOf(o) !== -1) return;
    const color = g.colors[o];
    (g.pieces[o] || []).forEach(r => {
      if (r < 0 || r > LUDO_LAST_TRACK) return;
      const at = ludoGlobal(color, r);
      const d = (global - at + LUDO_TRACK) % LUDO_TRACK;
      if (d >= 1 && d <= 6 && r + d <= LUDO_LAST_TRACK) n++;
    });
  });
  return n;
};

const ludoMoveScore = (g, pid, i, dice) => {
  const t = ludoTarget(g, pid, i, dice);
  if (!t) return -Infinity;
  const color = g.colors[pid];
  const mine = g.pieces[pid];
  let score = 0;
  if (t.cap.length) score += 100 + t.cap.reduce((sum, c) => sum + Math.max(0, g.pieces[c.pid][c.piece]), 0) * 0.6;
  if (t.to === LUDO_HOME) score += 80;
  else if (t.from <= LUDO_LAST_TRACK && t.to > LUDO_LAST_TRACK) score += 50;
  if (t.from < 0) score += 45 + (mine.filter(r => r >= 0).length === 0 ? 20 : 0);
  const fromG = t.from >= 0 ? ludoGlobal(color, t.from) : null;
  const toG = t.to <= LUDO_LAST_TRACK ? ludoGlobal(color, t.to) : null;
  // Out of reach of what could take it now; into reach is the opposite.
  if (fromG !== null) {
    const alone = mine.filter(r => r === t.from).length === 1;
    if (alone) score += ludoThreat(g, pid, fromG) * 30;
    else score -= 12;            // breaking up a wall
  }
  if (toG !== null) {
    const joins = mine.some((r, k) => k !== i && r === t.to);
    if (LUDO_SAFE.indexOf(toG) !== -1) score += 22;
    else if (joins) score += 20;
    else score -= ludoThreat(Object.assign({}, g, { pieces: Object.assign({}, g.pieces, { [pid]: mine.map((r, k) => (k === i ? t.to : r)) }) }), pid, toG) * 38;
  }
  // A little for getting on: a piece near home is worth securing.
  score += t.to * 0.4;
  return score;
};

/** The piece a computer player moves, or -1 when none can. `rng` gives [0, 1). */
const ludoBotPick = (g, pid, level, rng) => {
  const dice = g.turn && g.turn.dice;
  const moves = ludoDistinct(g, pid, dice);
  if (!moves.length) return -1;
  const r = rng || Math.random;
  if (level !== 'hard') return moves[Math.floor(r() * moves.length)];
  let best = -Infinity;
  let pick = moves[0];
  moves.forEach(i => {
    const v = ludoMoveScore(g, pid, i, dice) + r() * 0.5;
    if (v > best) { best = v; pick = i; }
  });
  return pick;
};

/**
 * The one move a player could make, when there is exactly one (two pieces on
 * the same place count once) and it doesn't bring their last piece home - that
 * moment is theirs to tap. Otherwise -1.
 */
const ludoOnlyMove = (g, pid) => {
  if (g.phase !== 'play' || !g.turn || g.turn.pid !== pid || g.turn.stage !== 'move') return -1;
  const moves = ludoDistinct(g, pid, g.turn.dice);
  if (moves.length !== 1) return -1;
  if (ludoIsFinishing(g, pid, moves[0], g.turn.dice)) return -1;
  return moves[0];
};
