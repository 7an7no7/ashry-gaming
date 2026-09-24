/* ============================================================================
   شطرنج الأربعة — FOUR-PLAYER CHESS: the board, the rules and the computer players
   ----------------------------------------------------------------------------
   One copy for both sides: the page inlines this file (SHARED_LISTS in
   tools/build-*.mjs) to light a phone's squares and draw the board, and the
   rooms server bundles it (FILES in rooms-worker/build.mjs) to judge a room.
   No DOM, nothing that runs at load, every name prefixed chess4 / CHESS4_
   (`c4` is Connect 4's).

   The owner's rules (24 Sep 2026, notes/BATCH5_RUNBOOK.md), with the standard
   four-player rules (as on chess.com) for the rest:
     - A 14 x 14 board without its four 3 x 3 corners (160 squares). Four
       players: red at the bottom, blue on the left, yellow at the top, green on
       the right; each back row is the 8 squares in the middle of its edge, the
       pawns in front. The kings and queens stand as on the owner's design
       sheet (red Q g1 K h1, yellow K g14 Q h14, blue Q a7 K a8, green K n7
       Q n8): every king faces the queen across the board.
     - The turns go red, blue, yellow, green. Red moves first.
     - Pawns go toward the far side, one square or two from their first row,
       take diagonally forward, no en passant; they become a queen on the 8th
       row from their own side (everyone for themselves) or the 11th (teams).
     - Castling both ways, the usual conditions.
     - Teams: red and yellow against blue and green. Partners never attack each
       other's king. A team wins when either opponent is mated (or resigns, or
       runs out of time). A player with no move and not in check passes.
     - Everyone for themselves (FFA): chess.com's points - a pawn 1, a knight 3,
       a bishop 5, a rook 5, a queen 9 (a promoted one 1); a mate +20 to whoever's
       move gave it; a player stalemated is out and scores +20 themselves. A
       player mated, stalemated, resigning or out of time is out: their pieces
       turn grey and stay as walls (they neither move, attack nor can be taken).
       The game ends when one player is left; the highest score wins.
     - A mate or a stalemate is judged on the player's own turn: someone left
       in check by one player's move still gets to answer it. So a king is
       never taken.
     - Fifty moves each with no capture and no pawn move end the game (FFA: the
       highest score wins; teams: a draw), and so does a game that has run to
       CHESS4_MAX_PLIES.

   Squares are numbered i = y * 14 + x from a1 (x the file a..n, y the rank
   1..14 less one). A piece is a number: its kind (1 pawn, 2 knight, 3 bishop,
   4 rook, 5 queen, 6 king) + 8 × its seat (0 red, 1 blue, 2 yellow, 3 green)
   + 32 for a queen that was a pawn. The game is one plain object, shaped for a
   room's `shared`:
     { mode: 'teams'|'ffa', board: [196], turn, castle: [4], out: [4],
       why: [4], points: [4], giver: [4], quiet, ply, passes, over, result }
   Inside, the rules work on a mailbox of 18 × 18 (two squares of border and
   the corners marked off), so a knight's jump never wraps round an edge.
   ========================================================================= */

const CHESS4_N = 14;
const CHESS4_FILES = 'abcdefghijklmn';
const CHESS4_SEATS = [0, 1, 2, 3];                   // red, blue, yellow, green: the order of play
const CHESS4_COLORS = ['r', 'b', 'y', 'g'];
const CHESS4_MODES = ['teams', 'ffa'];
const CHESS4_CLOCKS = [0, 1, 3, 5];                 // minutes a player, 0 = no clock
const CHESS4_INC_MS = 5000;                         // added after every move
const CHESS4_POINTS = [0, 1, 3, 5, 5, 9, 0];        // FFA: what taking a piece scores (a promoted queen 1)
const CHESS4_MATE_POINTS = 20;
const CHESS4_STALEMATE_POINTS = 20;
const CHESS4_QUIET = 50;                            // moves each with no capture or pawn move
const CHESS4_MAX_PLIES = 600;                       // 150 moves each: a long game ends as fifty quiet moves would
const CHESS4_LETTERS = ' PNBRQK';

const CHESS4_W = 18;                                // the mailbox's width
const CHESS4_OFF = -1;

/** A square on the board (not a cut corner, not off the edge). */
const chess4Valid = (x, y) => x >= 0 && x < CHESS4_N && y >= 0 && y < CHESS4_N && !((x < 3 || x > 10) && (y < 3 || y > 10));
const chess4XY = (i) => [i % CHESS4_N, Math.floor(i / CHESS4_N)];
const chess4Sq = (x, y) => y * CHESS4_N + x;
const chess4SqName = (i) => { const [x, y] = chess4XY(i); return CHESS4_FILES[x] + (y + 1); };
const chess4Owner = (code) => (code >> 3) & 3;
const chess4Kind = (code) => code & 7;
const chess4Team = (seat) => seat % 2;              // 0: red + yellow, 1: blue + green

// Board index <-> mailbox index, and the mailbox's empty board.
const CHESS4_MB = [];                               // board i -> mailbox
const CHESS4_BD = new Int16Array(CHESS4_W * CHESS4_W).fill(-1);   // mailbox -> board i (-1 off)
(function () {
  for (let y = 0; y < CHESS4_N; y++) for (let x = 0; x < CHESS4_N; x++) {
    const m = (y + 2) * CHESS4_W + x + 2;
    CHESS4_MB[chess4Sq(x, y)] = m;
    if (chess4Valid(x, y)) CHESS4_BD[m] = chess4Sq(x, y);
  }
})();

const CHESS4_ORTH = [1, -1, CHESS4_W, -CHESS4_W];
const CHESS4_DIAG = [CHESS4_W + 1, CHESS4_W - 1, -CHESS4_W + 1, -CHESS4_W - 1];
const CHESS4_KING = CHESS4_ORTH.concat(CHESS4_DIAG);
const CHESS4_KNIGHT = [2 + CHESS4_W, 2 - CHESS4_W, -2 + CHESS4_W, -2 - CHESS4_W, 1 + 2 * CHESS4_W, 1 - 2 * CHESS4_W, -1 + 2 * CHESS4_W, -1 - 2 * CHESS4_W];
// A pawn's step forward and its two sides, per seat (red up, blue right, yellow down, green left).
const CHESS4_FWD = [CHESS4_W, 1, -CHESS4_W, -1];
const CHESS4_SIDE = [1, CHESS4_W, 1, CHESS4_W];

/** How far along its own way a square is for a seat's pawns: 0 its back row .. 13 the far edge. */
const chess4Along = (seat, x, y) => (seat === 0 ? y : seat === 1 ? x : seat === 2 ? 13 - y : 13 - x);
const chess4PromoRow = (mode) => (mode === 'ffa' ? 7 : 10);

// The starting rows, as on the owner's design sheet.
const CHESS4_BACK = [4, 2, 3, 5, 6, 3, 2, 4];       // r n b q k b n r
function chess4StartBoard() {
  const b = new Array(CHESS4_N * CHESS4_N).fill(0);
  for (let k = 0; k < 8; k++) {
    const p = 3 + k;
    b[chess4Sq(p, 0)] = CHESS4_BACK[k] + 0;                 // red: Q g1, K h1
    b[chess4Sq(p, 1)] = 1 + 0;
    b[chess4Sq(13 - p, 13)] = CHESS4_BACK[k] + 16;          // yellow: K g14, Q h14
    b[chess4Sq(13 - p, 12)] = 1 + 16;
    b[chess4Sq(0, p)] = CHESS4_BACK[k] + 8;                 // blue: Q a7, K a8
    b[chess4Sq(1, p)] = 1 + 8;
    b[chess4Sq(13, 13 - p)] = CHESS4_BACK[k] + 24;          // green: K n7, Q n8
    b[chess4Sq(12, 13 - p)] = 1 + 24;
  }
  return b;
}

// Castling, per seat: the king's square, the two rooks' (the lower first), the step along the back row.
const CHESS4_CASTLE = [
  { k: chess4Sq(7, 0), rooks: [chess4Sq(3, 0), chess4Sq(10, 0)] },
  { k: chess4Sq(0, 7), rooks: [chess4Sq(0, 3), chess4Sq(0, 10)] },
  { k: chess4Sq(6, 13), rooks: [chess4Sq(3, 13), chess4Sq(10, 13)] },
  { k: chess4Sq(13, 6), rooks: [chess4Sq(13, 3), chess4Sq(13, 10)] }
];

/** A new game. */
function chess4NewGame(mode) {
  return {
    mode: mode === 'ffa' ? 'ffa' : 'teams',
    board: chess4StartBoard(),
    turn: 0,
    castle: [3, 3, 3, 3],
    out: [false, false, false, false],
    why: [null, null, null, null],
    points: [0, 0, 0, 0],
    giver: [-1, -1, -1, -1],
    quiet: 0,
    ply: 0,
    passes: 0,
    over: false,
    result: null
  };
}

/* --- the position the rules work on -------------------------------------------------- */

/** The mailbox of a game: { b, kings, out, mode, castle, pts }. */
function chess4Pos(g) {
  const b = new Int16Array(CHESS4_W * CHESS4_W).fill(CHESS4_OFF);
  const kings = [-1, -1, -1, -1];
  for (let i = 0; i < g.board.length; i++) {
    const m = CHESS4_MB[i];
    if (CHESS4_BD[m] < 0) continue;
    const c = g.board[i] || 0;
    b[m] = c;
    if (c && (c & 7) === 6) kings[(c >> 3) & 3] = m;
  }
  return { b: b, kings: kings, out: g.out.slice(), mode: g.mode, castle: g.castle.slice(), pts: g.points.slice() };
}

/** The seats whose pieces attack `seat`'s king: the other team, or everyone else; never a player who is out. */
function chess4Foes(p, seat) {
  let mask = 0;
  for (let t = 0; t < 4; t++) {
    if (t === seat || p.out[t]) continue;
    if (p.mode === 'teams' && (t & 1) === (seat & 1)) continue;
    mask |= 1 << t;
  }
  return mask;
}

/** Is square m (mailbox) attacked by any seat in `mask`? */
function chess4Attacked(b, m, mask) {
  if (!mask) return false;
  for (let t = 0; t < 4; t++) {
    if (!(mask & (1 << t))) continue;
    const back = m - CHESS4_FWD[t], side = CHESS4_SIDE[t];
    if (b[back - side] === 1 + 8 * t || b[back + side] === 1 + 8 * t) return true;
  }
  for (let k = 0; k < 8; k++) {
    const c = b[m + CHESS4_KNIGHT[k]];
    if (c > 0 && (c & 7) === 2 && (mask & (1 << ((c >> 3) & 3)))) return true;
  }
  for (let k = 0; k < 8; k++) {
    const c = b[m + CHESS4_KING[k]];
    if (c > 0 && (c & 7) === 6 && (mask & (1 << ((c >> 3) & 3)))) return true;
  }
  for (let k = 0; k < 4; k++) {
    const d = CHESS4_ORTH[k];
    let q = m + d;
    while (b[q] === 0) q += d;
    const c = b[q];
    if (c > 0 && ((c & 7) === 4 || (c & 7) === 5) && (mask & (1 << ((c >> 3) & 3)))) return true;
  }
  for (let k = 0; k < 4; k++) {
    const d = CHESS4_DIAG[k];
    let q = m + d;
    while (b[q] === 0) q += d;
    const c = b[q];
    if (c > 0 && ((c & 7) === 3 || (c & 7) === 5) && (mask & (1 << ((c >> 3) & 3)))) return true;
  }
  return false;
}

const chess4InCheckPos = (p, seat) => p.kings[seat] >= 0 && !p.out[seat] && chess4Attacked(p.b, p.kings[seat], chess4Foes(p, seat));

// A move is a number: from | to << 9 | flags << 18 (mailbox squares, below 512).
const CHESS4_F_CAP = 1, CHESS4_F_PROMO = 2, CHESS4_F_CASTLE = 4;
const chess4MFrom = (mv) => mv & 511;
const chess4MTo = (mv) => (mv >> 9) & 511;
const chess4MFlags = (mv) => mv >> 18;

/** Can `seat` take what stands on q? Another player's piece, not a partner's, not a grey one, never a king. */
function chess4CanTake(p, seat, c) {
  if (c <= 0) return false;
  const o = (c >> 3) & 3;
  if (o === seat || p.out[o] || (c & 7) === 6) return false;
  if (p.mode === 'teams' && (o & 1) === (seat & 1)) return false;
  return true;
}

/** Every move `seat` could make, before looking whether it leaves its own king in check. */
function chess4Pseudo(p, seat, out) {
  const b = p.b;
  const list = out || [];
  const promoRow = chess4PromoRow(p.mode);
  for (let m = 0; m < b.length; m++) {
    const c = b[m];
    if (c <= 0 || ((c >> 3) & 3) !== seat) continue;
    const kind = c & 7;
    if (kind === 1) {
      const f = CHESS4_FWD[seat], s = CHESS4_SIDE[seat];
      const bi = CHESS4_BD[m];
      const x = bi % CHESS4_N, y = (bi - x) / CHESS4_N;
      const along = chess4Along(seat, x, y);
      const promoFlag = (along + 1 === promoRow) ? CHESS4_F_PROMO : 0;
      if (b[m + f] === 0) {
        list.push(m | ((m + f) << 9) | (promoFlag << 18));
        if (along === 1 && b[m + 2 * f] === 0 && !promoFlag) list.push(m | ((m + 2 * f) << 9));
      }
      if (chess4CanTake(p, seat, b[m + f - s])) list.push(m | ((m + f - s) << 9) | ((CHESS4_F_CAP | promoFlag) << 18));
      if (chess4CanTake(p, seat, b[m + f + s])) list.push(m | ((m + f + s) << 9) | ((CHESS4_F_CAP | promoFlag) << 18));
      continue;
    }
    if (kind === 2 || kind === 6) {
      const dirs = kind === 2 ? CHESS4_KNIGHT : CHESS4_KING;
      for (let k = 0; k < 8; k++) {
        const q = m + dirs[k], t = b[q];
        if (t === 0) list.push(m | (q << 9));
        else if (chess4CanTake(p, seat, t)) list.push(m | (q << 9) | (CHESS4_F_CAP << 18));
      }
      continue;
    }
    const dirs = kind === 3 ? CHESS4_DIAG : kind === 4 ? CHESS4_ORTH : CHESS4_KING;
    for (let k = 0; k < dirs.length; k++) {
      const d = dirs[k];
      let q = m + d;
      while (b[q] === 0) { list.push(m | (q << 9)); q += d; }
      if (chess4CanTake(p, seat, b[q])) list.push(m | (q << 9) | (CHESS4_F_CAP << 18));
    }
  }
  // Castling: king and rook unmoved, empty between, the king not in check and never crossing an attacked square.
  const rights = p.castle[seat];
  if (rights) {
    const cs = CHESS4_CASTLE[seat];
    const km = CHESS4_MB[cs.k];
    if (b[km] === 6 + 8 * seat) {
      const foes = chess4Foes(p, seat);
      for (let r = 0; r < 2; r++) {
        if (!(rights & (1 << r))) continue;
        const rm = CHESS4_MB[cs.rooks[r]];
        if (b[rm] !== 4 + 8 * seat) continue;
        const d = rm > km ? (rm - km >= CHESS4_W ? CHESS4_W : 1) : (km - rm >= CHESS4_W ? -CHESS4_W : -1);
        let q = km + d, clear = true;
        while (q !== rm) { if (b[q] !== 0) { clear = false; break; } q += d; }
        if (!clear) continue;
        if (chess4Attacked(b, km, foes) || chess4Attacked(b, km + d, foes) || chess4Attacked(b, km + 2 * d, foes)) continue;
        list.push(km | ((km + 2 * d) << 9) | (CHESS4_F_CASTLE << 18));
      }
    }
  }
  return list;
}

/** Plays a move on a position; returns what to undo it with. */
function chess4Make(p, mv, seat) {
  const b = p.b;
  const from = mv & 511, to = (mv >> 9) & 511, fl = mv >> 18;
  const piece = b[from], cap = b[to];
  const u = { mv: mv, piece: piece, cap: cap, castle: p.castle.slice(), king: p.kings[seat], rf: -1, rt: -1, pts: 0 };
  b[to] = (fl & CHESS4_F_PROMO) ? (5 + 8 * seat + 32) : piece;
  b[from] = 0;
  if ((piece & 7) === 6) {
    p.kings[seat] = to;
    p.castle[seat] = 0;
    if (fl & CHESS4_F_CASTLE) {
      const d = (to - from) / 2;
      let r = to + d;
      while (b[r] === 0) r += d;           // the rook at the end of the row
      u.rf = r; u.rt = from + d;
      b[u.rt] = b[r]; b[r] = 0;
    }
  }
  // A rook leaving (or taken on) its first square takes that side's castling with it.
  for (let t = 0; t < 4; t++) {
    if (!p.castle[t]) continue;
    const cs = CHESS4_CASTLE[t];
    for (let r = 0; r < 2; r++) {
      const rm = CHESS4_MB[cs.rooks[r]];
      if (rm === from || rm === to) p.castle[t] &= ~(1 << r);
    }
  }
  if (cap > 0 && p.mode === 'ffa') {
    u.pts = (cap & 32) ? 1 : CHESS4_POINTS[cap & 7];
    p.pts[seat] += u.pts;
  }
  return u;
}

function chess4Unmake(p, u, seat) {
  const b = p.b;
  const from = u.mv & 511, to = (u.mv >> 9) & 511;
  if (u.rf >= 0) { b[u.rf] = b[u.rt]; b[u.rt] = 0; }
  b[from] = u.piece;
  b[to] = u.cap;
  p.kings[seat] = u.king;
  p.castle = u.castle;
  if (u.pts) p.pts[seat] -= u.pts;
}

/** The moves `seat` may really make (its own king never left in check), as numbers. */
function chess4LegalPos(p, seat) {
  const out = [];
  if (p.out[seat] || p.kings[seat] < 0) return out;
  const foes = chess4Foes(p, seat);
  const list = chess4Pseudo(p, seat);
  for (let k = 0; k < list.length; k++) {
    const u = chess4Make(p, list[k], seat);
    if (!chess4Attacked(p.b, p.kings[seat], foes)) out.push(list[k]);
    chess4Unmake(p, u, seat);
  }
  return out;
}

const chess4MoveObj = (mv) => {
  const fl = mv >> 18;
  return { from: CHESS4_BD[mv & 511], to: CHESS4_BD[(mv >> 9) & 511], capture: !!(fl & CHESS4_F_CAP), promo: !!(fl & CHESS4_F_PROMO), castle: !!(fl & CHESS4_F_CASTLE) };
};

/** The legal moves of the player to move (or `seat`), as { from, to, capture, promo, castle } on board squares. */
function chess4Legal(g, seat) {
  const s = seat === undefined ? g.turn : seat;
  if (g.over) return [];
  return chess4LegalPos(chess4Pos(g), s).map(chess4MoveObj);
}

/** Is `seat`'s king attacked right now? */
const chess4InCheck = (g, seat) => chess4InCheckPos(chess4Pos(g), seat);

/** The seats still playing. */
const chess4Active = (g) => CHESS4_SEATS.filter(t => !g.out[t]);

/** The next seat to play after `seat`, skipping anyone out. */
function chess4NextSeat(g, seat) {
  for (let k = 1; k <= 4; k++) {
    const t = (seat + k) % 4;
    if (!g.out[t]) return t;
  }
  return seat;
}

/** A move written for the log: Nf3, exe5, O-O, h8=Q, with + or # added by the caller. */
function chess4San(p, mv) {
  const from = mv & 511, to = (mv >> 9) & 511, fl = mv >> 18;
  if (fl & CHESS4_F_CASTLE) {
    // The rook next to where the king lands is the short side; one square further, the long.
    let r = to + (to - from) / 2, n = 1;
    while (p.b[r] === 0) { r += (to - from) / 2; n++; }
    return n <= 1 ? 'O-O' : 'O-O-O';
  }
  const piece = p.b[from];
  const toName = chess4SqName(CHESS4_BD[to]);
  if ((piece & 7) === 1) {
    const f = chess4SqName(CHESS4_BD[from]);
    return ((fl & CHESS4_F_CAP) ? f.replace(/\d+/, '') + 'x' : '') + toName + ((fl & CHESS4_F_PROMO) ? '=Q' : '');
  }
  return CHESS4_LETTERS[piece & 7] + ((fl & CHESS4_F_CAP) ? 'x' : '') + toName;
}

/* --- the game ------------------------------------------------------------------------- */

/** Writes a position's board and castling back into the game. */
function chess4Store(g, p) {
  for (let i = 0; i < g.board.length; i++) {
    const m = CHESS4_MB[i];
    g.board[i] = CHESS4_BD[m] < 0 ? 0 : p.b[m];
  }
  g.castle = p.castle.slice();
}

/** The game is over. FFA: the highest score wins (ties share it). Teams: `team` wins, or null for a draw. */
function chess4End(g, reason, team, by) {
  g.over = true;
  if (g.mode === 'ffa') {
    const best = Math.max.apply(null, g.points);
    g.result = { reason: reason, winners: CHESS4_SEATS.filter(t => g.points[t] === best) };
  } else {
    g.result = { reason: reason, team: team === 0 || team === 1 ? team : null, by: by === undefined ? -1 : by,
      winners: team === 0 || team === 1 ? CHESS4_SEATS.filter(t => chess4Team(t) === team) : [] };
  }
  return { kind: 'over', reason: reason, winners: g.result.winners.slice(), team: g.result.team };
}

/** A player goes out (FFA): grey walls from now on. */
function chess4Out(g, seat, why, by, pts, events) {
  g.out[seat] = true;
  g.why[seat] = why;
  g.giver[seat] = -1;
  events.push({ kind: 'out', seat: seat, why: why, by: by === undefined ? -1 : by, pts: pts || 0 });
}

/**
 * Whoever's turn it is now: out players are skipped, and a player with no move
 * is judged - mated, stalemated (FFA: out), or passes (teams). Loops until
 * someone can move or the game is over.
 */
function chess4Settle(g, events) {
  for (let guard = 0; guard < 12 && !g.over; guard++) {
    const active = chess4Active(g);
    if (g.mode === 'ffa' && active.length <= 1) { events.push(chess4End(g, 'last')); return; }
    if (g.out[g.turn]) { g.turn = chess4NextSeat(g, g.turn); continue; }
    if (g.quiet >= CHESS4_QUIET * active.length) { events.push(chess4End(g, 'fifty', null)); return; }
    if (g.ply >= CHESS4_MAX_PLIES) { events.push(chess4End(g, 'long', null)); return; }
    const p = chess4Pos(g);
    const s = g.turn;
    if (chess4LegalPos(p, s).length) return;
    const check = chess4InCheckPos(p, s);
    if (g.mode === 'teams') {
      if (check) { events.push({ kind: 'mate', seat: s, by: g.giver[s] }); events.push(chess4End(g, 'mate', 1 - chess4Team(s), s)); return; }
      events.push({ kind: 'pass', seat: s });
      g.passes++;
      if (g.passes >= 4) { events.push(chess4End(g, 'stuck', null)); return; }
      g.turn = chess4NextSeat(g, s);
      continue;
    }
    if (check) {
      // The points go to whoever's move gave the check; failing that, a player attacking the king.
      let by = g.giver[s];
      if (by < 0 || g.out[by]) {
        by = -1;
        for (let t = 0; t < 4 && by < 0; t++) if (t !== s && !g.out[t] && chess4Attacked(p.b, p.kings[s], 1 << t)) by = t;
      }
      if (by >= 0) g.points[by] += CHESS4_MATE_POINTS;
      chess4Out(g, s, 'mate', by, by >= 0 ? CHESS4_MATE_POINTS : 0, events);
    } else {
      g.points[s] += CHESS4_STALEMATE_POINTS;
      chess4Out(g, s, 'stalemate', s, CHESS4_STALEMATE_POINTS, events);
    }
    g.turn = chess4NextSeat(g, s);
  }
}

/**
 * The player to move plays { from, to } (board squares). Returns what happened -
 * { seat, from, to, san, cap, pts, castle: [rookFrom, rookTo], promo, events } -
 * or null when the move isn't legal (the game is untouched).
 */
function chess4Play(g, move) {
  if (!g || g.over || !move) return null;
  const s = g.turn;
  if (g.out[s]) return null;
  const from = Number(move.from), to = Number(move.to);
  if (!(from >= 0 && from < 196 && to >= 0 && to < 196)) return null;
  const p = chess4Pos(g);
  const mf = CHESS4_MB[from], mt = CHESS4_MB[to];
  const mv = chess4LegalPos(p, s).find(x => (x & 511) === mf && ((x >> 9) & 511) === mt);
  if (mv === undefined) return null;
  // Who is in check before, to tell whose move gave a check.
  const before = CHESS4_SEATS.map(t => t !== s && chess4InCheckPos(p, t));
  const san = chess4San(p, mv);
  const piece = p.b[mf];
  const u = chess4Make(p, mv, s);
  const info = { seat: s, from: from, to: to, san: san, cap: u.cap > 0 ? u.cap : 0, pts: u.pts, promo: !!((mv >> 18) & CHESS4_F_PROMO), castle: null, events: [] };
  if (u.rf >= 0) info.castle = [CHESS4_BD[u.rf], CHESS4_BD[u.rt]];
  g.points = p.pts.slice();
  chess4Store(g, p);
  g.quiet = (u.cap > 0 || (piece & 7) === 1) ? 0 : g.quiet + 1;
  g.ply++;
  g.passes = 0;
  let checks = 0;
  CHESS4_SEATS.forEach(t => {
    if (t === s || g.out[t]) return;
    const now = chess4InCheckPos(p, t);
    if (now) { checks++; if (!before[t] || g.giver[t] < 0) g.giver[t] = s; }
    else g.giver[t] = -1;
  });
  g.giver[s] = -1;
  g.turn = chess4NextSeat(g, s);
  chess4Settle(g, info.events);
  const mated = info.events.some(e => (e.kind === 'out' && e.why === 'mate' && e.by === s) || e.kind === 'mate');
  info.san += mated ? '#' : checks ? '+' : '';
  return info;
}

/**
 * A player resigns, runs out of time or leaves. FFA: out, grey walls, and the
 * turn moves on if it was theirs. Teams: their team loses. Returns the events.
 */
function chess4Eliminate(g, seat, why) {
  const events = [];
  if (!g || g.over || g.out[seat]) return events;
  if (g.mode === 'teams') {
    events.push({ kind: 'lost', seat: seat, why: why });
    events.push(chess4End(g, why, 1 - chess4Team(seat), seat));
    return events;
  }
  chess4Out(g, seat, why, -1, 0, events);
  if (g.turn === seat) g.turn = chess4NextSeat(g, seat);
  // A wall can take away the only move of the player now up: judge the turn again.
  chess4Settle(g, events);
  return events;
}

/* --- the computer players --------------------------------------------------------------
   easy: one move deep - a capture if there is one (the bigger the better,
   with some chance in it), otherwise any move.
   hard: a "paranoid" alpha-beta - the bot (and, in teams, its partner) against
   everyone else - deepening one ply at a time up to a round of the table,
   inside a node budget (CHESS4_BOT_NODES) so a decision costs the Worker a few
   milliseconds. It weighs material, the points (FFA), pieces left hanging,
   development toward the middle, pawns on their way and the pawns in front of
   the king. In teams it never takes a partner's piece (nobody can) and counts
   the partner's pieces and king as its own.
   ------------------------------------------------------------------------------------- */
const CHESS4_BOT_NODES = 20000;
const CHESS4_VAL = [0, 100, 300, 330, 500, 900, 0];
const CHESS4_MATE = 50000;
const CHESS4_PTS_W = 40;                             // a point of score, in centipawns

// Centralisation of a mailbox square: 0 at the edge, up to 6 in the middle.
const CHESS4_CENTRE = (function () {
  const t = new Int8Array(CHESS4_W * CHESS4_W);
  for (let m = 0; m < t.length; m++) {
    const bi = CHESS4_BD[m];
    if (bi < 0) continue;
    const x = bi % CHESS4_N, y = (bi - x) / CHESS4_N;
    t[m] = Math.round(6.5 - Math.max(Math.abs(x - 6.5), Math.abs(y - 6.5)));
  }
  return t;
})();

/** The cheapest piece of `mask` attacking square m, or 0. */
function chess4LeastAttacker(b, m, mask) {
  let best = 0;
  const take = (v) => { if (!best || v < best) best = v; };
  for (let t = 0; t < 4; t++) {
    if (!(mask & (1 << t))) continue;
    const back = m - CHESS4_FWD[t], side = CHESS4_SIDE[t];
    if (b[back - side] === 1 + 8 * t || b[back + side] === 1 + 8 * t) return 100;
  }
  for (let k = 0; k < 8; k++) {
    const c = b[m + CHESS4_KNIGHT[k]];
    if (c > 0 && (c & 7) === 2 && (mask & (1 << ((c >> 3) & 3)))) { take(300); break; }
  }
  for (let k = 0; k < 8; k++) {
    const d = k < 4 ? CHESS4_ORTH[k] : CHESS4_DIAG[k - 4];
    let q = m + d;
    while (b[q] === 0) q += d;
    const c = b[q];
    if (c <= 0 || !(mask & (1 << ((c >> 3) & 3)))) continue;
    const kind = c & 7;
    if (kind === 5 || (k < 4 ? kind === 4 : kind === 3)) take(CHESS4_VAL[kind]);
    else if (kind === 6 && q === m + d) take(2000);
  }
  return best;
}

/** The position from the bot's side: `side` is the mask of seats counted as ours. */
function chess4Eval(p, side) {
  const b = p.b;
  const mat = [0, 0, 0, 0];
  for (let m = 0; m < b.length; m++) {
    const c = b[m];
    if (c <= 0) continue;
    const o = (c >> 3) & 3;
    if (p.out[o]) continue;
    const kind = c & 7;
    let v = CHESS4_VAL[kind];
    if (kind === 2 || kind === 3) v += CHESS4_CENTRE[m] * 6;
    else if (kind === 5) v += CHESS4_CENTRE[m] * 2;
    else if (kind === 1) {
      const bi = CHESS4_BD[m], x = bi % CHESS4_N, y = (bi - x) / CHESS4_N;
      v += chess4Along(o, x, y) * 4;
    } else if (kind === 6) {
      // The king: better at home behind its pawns.
      v -= CHESS4_CENTRE[m] * 12;
      for (let k = 0; k < 8; k++) if (b[m + CHESS4_KING[k]] === 1 + 8 * o) v += 12;
    }
    // A piece of ours left hanging: attacked by something cheaper, or not defended.
    if ((side & (1 << o)) && kind > 1 && kind < 6) {
      const foes = chess4Foes(p, o);
      const least = chess4LeastAttacker(b, m, foes);
      if (least && (least < CHESS4_VAL[kind] || !chess4Attacked(b, m, 1 << o))) v -= CHESS4_VAL[kind] * 0.55;
    }
    mat[o] += v;
  }
  let mine = 0, theirs = 0, n = 0;
  for (let t = 0; t < 4; t++) {
    const own = (side & (1 << t)) !== 0;
    const val = mat[t] + (p.mode === 'ffa' ? p.pts[t] * CHESS4_PTS_W : 0);
    if (own) mine += val;
    else if (!p.out[t]) { theirs += val; n++; }
    else if (p.mode === 'ffa') { theirs += p.pts[t] * CHESS4_PTS_W * 0.5; }
  }
  return p.mode === 'teams' ? mine - theirs : mine - (n ? theirs / n : 0);
}

const chess4NextIn = (p, seat) => { for (let k = 1; k <= 4; k++) { const t = (seat + k) % 4; if (!p.out[t]) return t; } return seat; };

/** Captures first, the biggest victim by the smallest attacker. */
function chess4Order(p, list, first) {
  const b = p.b;
  const score = (mv) => {
    if (mv === first) return 1e6;
    const fl = mv >> 18;
    let s = 0;
    if (fl & CHESS4_F_CAP) s += 10 * CHESS4_VAL[b[(mv >> 9) & 511] & 7] - CHESS4_VAL[b[mv & 511] & 7] / 10 + 1000;
    if (fl & CHESS4_F_PROMO) s += 800;
    return s;
  };
  const scored = list.map(mv => [score(mv), mv]);
  scored.sort((a, c) => c[0] - a[0]);
  return scored.map(x => x[1]);
}

function chess4Search(p, ctx, seat, depth, alpha, beta, ply) {
  if (ctx.nodes >= ctx.budget) { ctx.abort = true; return 0; }
  if (depth <= 0) return chess4Eval(p, ctx.side);
  const ours = (ctx.side & (1 << seat)) !== 0;
  const foes = chess4Foes(p, seat);
  const list = chess4Order(p, chess4Pseudo(p, seat), -1);
  let legal = 0;
  let best = ours ? -Infinity : Infinity;
  for (let k = 0; k < list.length; k++) {
    const u = chess4Make(p, list[k], seat);
    if (chess4Attacked(p.b, p.kings[seat], foes)) { chess4Unmake(p, u, seat); continue; }
    legal++;
    ctx.nodes++;
    const v = chess4Search(p, ctx, chess4NextIn(p, seat), depth - 1, alpha, beta, ply + 1);
    chess4Unmake(p, u, seat);
    if (ctx.abort) return 0;
    if (ours) { if (v > best) best = v; if (best > alpha) alpha = best; }
    else { if (v < best) best = v; if (best < beta) beta = best; }
    if (alpha >= beta) break;
  }
  if (legal) return best;
  // No move: mated, stalemated, or (teams) a pass.
  const check = chess4InCheckPos(p, seat);
  if (p.mode === 'teams') {
    if (check) return ours ? -CHESS4_MATE + ply : CHESS4_MATE - ply;
    return chess4Search(p, ctx, chess4NextIn(p, seat), depth - 1, alpha, beta, ply + 1);
  }
  if (check) return ours ? -CHESS4_MATE + ply : chess4Eval(p, ctx.side) + CHESS4_MATE_POINTS * CHESS4_PTS_W + 600;
  return chess4Eval(p, ctx.side) + (ours ? 1 : -1) * CHESS4_STALEMATE_POINTS * CHESS4_PTS_W / 3;
}

/**
 * The computer's move for the player to move: { from, to } on board squares,
 * or null when it has none. `level` 'easy' or 'hard'; `rnd` a random source
 * (Math.random by default); `nodes` a different budget.
 */
function chess4BotMove(g, level, opts) {
  const o = opts || {};
  const rnd = o.rnd || Math.random;
  if (!g || g.over) return null;
  const s = g.turn;
  const p = chess4Pos(g);
  const legal = chess4LegalPos(p, s);
  if (!legal.length) return null;
  if (legal.length === 1) return chess4MoveObj(legal[0]);
  if (level !== 'hard') {
    let best = null, bestScore = -Infinity;
    legal.forEach(mv => {
      const fl = mv >> 18;
      let sc = rnd() * 60;
      if (fl & CHESS4_F_CAP) sc += 40 + CHESS4_VAL[p.b[(mv >> 9) & 511] & 7] * (0.4 + rnd() * 0.6) / 4;
      if (fl & CHESS4_F_PROMO) sc += 120;
      if (sc > bestScore) { bestScore = sc; best = mv; }
    });
    return chess4MoveObj(best);
  }
  const side = p.mode === 'teams' ? ((1 << s) | (1 << ((s + 2) % 4))) : (1 << s);
  const ctx = { side: side, nodes: 0, budget: o.nodes || CHESS4_BOT_NODES, abort: false };
  let order = chess4Order(p, legal, -1);
  let bestMove = order[0];
  let scores = null;
  for (let depth = 1; depth <= 4; depth++) {
    const got = [];
    let alpha = -Infinity;
    for (let k = 0; k < order.length; k++) {
      const u = chess4Make(p, order[k], s);
      ctx.nodes++;
      const v = chess4Search(p, ctx, chess4NextIn(p, s), depth - 1, alpha - 15, Infinity, 1);
      chess4Unmake(p, u, s);
      if (ctx.abort) break;
      got.push([v, order[k]]);
      if (v > alpha) alpha = v;
    }
    if (ctx.abort) break;
    got.sort((a, c) => c[0] - a[0]);
    scores = got;
    order = got.map(x => x[1]);
    bestMove = order[0];
    if (got[0][0] >= CHESS4_MATE / 2) break;
  }
  // A little variety among moves as good as the best (a table of bots shouldn't replay itself).
  if (scores && scores.length > 1) {
    const top = scores.filter(x => x[0] >= scores[0][0] - 8);
    bestMove = top[Math.floor(rnd() * top.length)][1];
  }
  return chess4MoveObj(bestMove);
}
