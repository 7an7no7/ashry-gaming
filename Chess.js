/* ============================================================================
   شطرنج — CHESS: every rule, the clock and the phone's player, once
   ----------------------------------------------------------------------------
   Shared by the page (inlined, SHARED_LISTS in tools/build-*.mjs) and the
   rooms server (bundled, FILES in rooms-worker/build.mjs), so a move on one
   phone, against the phone and in a room is judged by the very same code.
   No DOM, nothing runs at load but the tables, and every top-level name is
   prefixed chess / CHESS_ (the page and the Worker are each one scope).

   A game is one plain object (JSON, so a room keeps it in shared and a phone
   in appState):
     board  64 numbers, a1 = 0, b1 = 1 … h8 = 63. 0 empty; a piece is its
            kind (1 pawn, 2 knight, 3 bishop, 4 rook, 5 queen, 6 king) plus
            8 for black - so colour = piece >> 3, kind = piece & 7
     turn   0 white to move, 1 black
     castle what castling is still allowed: 1 white short, 2 white long,
            4 black short, 8 black long
     ep     the square a pawn just skipped (en passant), or -1
     half   moves since the last capture or pawn move (the fifty-move rule)
     full   the move number
     keys   the positions since the last capture or pawn move, for threefold
            repetition (chessKey: placement, side, castling, a capturable ep)

   A move from outside is { from, to, promo } with squares named 'e2', 'e4'
   and promo 'q' | 'r' | 'b' | 'n'. chessPlay(g, move) plays it if it is
   legal and returns what happened (its SAN, a capture, check, the end), or
   null. chessStatus(g) says whether the game is over: mate, stalemate,
   threefold repetition, the fifty-move rule (both automatic, as on every
   app a family has played on), or too little to mate on either side.

   The owner's rules (23 Sep 2026): the full rules - castling both ways with
   every condition, en passant, promotion with a choice, check, mate,
   stalemate, threefold, fifty moves, insufficient material, a draw offered
   and accepted, resigning; a clock off by default (3+2, 5+0, 10+0), running
   out losing unless the other side has nothing to mate with (then a draw);
   and in a tournament, a draw replayed once with the colours swapped, then
   an Armageddon game in which a draw counts as a win for Black
   (chessMatchNext below - the bracket's adapter).
   ========================================================================= */

const CHESS_FILES = 'abcdefgh';
const CHESS_START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
const CHESS_LETTERS = ' pnbrqk';            // a kind's letter, lower case
const CHESS_VALUE = [0, 100, 320, 330, 500, 900, 0];

// A move inside the engine is one number: from | to << 6 | promo kind << 12 | flags << 15.
const CHESS_F_CAP = 1, CHESS_F_EP = 2, CHESS_F_CASTLE = 4, CHESS_F_DOUBLE = 8, CHESS_F_PROMO = 16;
const chessMFrom = (m) => m & 63;
const chessMTo = (m) => (m >> 6) & 63;
const chessMPromo = (m) => (m >> 12) & 7;
const chessMFlags = (m) => m >> 15;
const chessMake = (from, to, promo, flags) => from | (to << 6) | (promo << 12) | (flags << 15);

/** 'e4' → 28, and back. -1 / '' when it isn't a square. */
function chessSq(name) {
  const s = String(name || '');
  if (s.length !== 2) return -1;
  const f = CHESS_FILES.indexOf(s[0]), r = s.charCodeAt(1) - 49;
  return f < 0 || r < 0 || r > 7 ? -1 : r * 8 + f;
}
const chessSqName = (sq) => (sq >= 0 && sq < 64 ? CHESS_FILES[sq & 7] + ((sq >> 3) + 1) : '');

/* --- the tables: where a knight, a king and a line can go from each square ------------ */

const CHESS_KNIGHT = [], CHESS_KING = [], CHESS_RAYS = [];
// Rook directions first (0-3), then the bishop's (4-7): [file step, rank step].
const CHESS_DIRS = [[0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [-1, 1], [1, -1], [-1, -1]];
(function chessTables() {
  for (let sq = 0; sq < 64; sq++) {
    const f = sq & 7, r = sq >> 3;
    const jumps = (list) => list.map(([df, dr]) => [f + df, r + dr]).filter(([x, y]) => x >= 0 && x < 8 && y >= 0 && y < 8).map(([x, y]) => y * 8 + x);
    CHESS_KNIGHT[sq] = jumps([[1, 2], [2, 1], [2, -1], [1, -2], [-1, -2], [-2, -1], [-2, 1], [-1, 2]]);
    CHESS_KING[sq] = jumps([[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]]);
    CHESS_RAYS[sq] = CHESS_DIRS.map(([df, dr]) => {
      const out = [];
      for (let x = f + df, y = r + dr; x >= 0 && x < 8 && y >= 0 && y < 8; x += df, y += dr) out.push(y * 8 + x);
      return out;
    });
  }
})();

// Castling rights a move from or to a square takes away (the king's or a rook's home).
const CHESS_CASTLE_KEEP = new Array(64).fill(15);
CHESS_CASTLE_KEEP[4] = 15 & ~3; CHESS_CASTLE_KEEP[7] = 15 & ~1; CHESS_CASTLE_KEEP[0] = 15 & ~2;
CHESS_CASTLE_KEEP[60] = 15 & ~12; CHESS_CASTLE_KEEP[63] = 15 & ~4; CHESS_CASTLE_KEEP[56] = 15 & ~8;

/* --- hashing, for the phone's search (a table of what it has seen, and repetition) ------ */

const CHESS_Z = (function () {
  let seed = 0x9e3779b9;
  const next = () => {          // mulberry32
    seed = (seed + 0x6d2b79f5) | 0;
    let t = seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return (t ^ (t >>> 14)) | 0;
  };
  const lane = () => {
    const piece = new Int32Array(16 * 64), castle = new Int32Array(16), ep = new Int32Array(8);
    for (let i = 0; i < piece.length; i++) piece[i] = next();
    for (let i = 0; i < 16; i++) castle[i] = next();
    for (let i = 0; i < 8; i++) ep[i] = next();
    return { piece, castle, ep, side: next() };
  };
  return [lane(), lane()];
})();

/* --- a position the engine works on: the game, plus the kings and the hash ------------- */

function chessPos(g) {
  const b = g.board.slice();
  const kings = [-1, -1];
  for (let sq = 0; sq < 64; sq++) if ((b[sq] & 7) === 6) kings[b[sq] >> 3] = sq;
  const p = { b: b, side: g.turn ? 1 : 0, castle: g.castle | 0, ep: g.ep === undefined ? -1 : g.ep, half: g.half | 0, kings: kings, lo: 0, hi: 0, stack: [] };
  chessRehash(p);
  return p;
}

function chessRehash(p) {
  let lo = 0, hi = 0;
  for (let sq = 0; sq < 64; sq++) if (p.b[sq]) { lo ^= CHESS_Z[0].piece[p.b[sq] * 64 + sq]; hi ^= CHESS_Z[1].piece[p.b[sq] * 64 + sq]; }
  lo ^= CHESS_Z[0].castle[p.castle]; hi ^= CHESS_Z[1].castle[p.castle];
  if (p.ep >= 0) { lo ^= CHESS_Z[0].ep[p.ep & 7]; hi ^= CHESS_Z[1].ep[p.ep & 7]; }
  if (p.side) { lo ^= CHESS_Z[0].side; hi ^= CHESS_Z[1].side; }
  p.lo = lo; p.hi = hi;
}

/** Is `sq` attacked by side `by` (0 white, 1 black)? */
function chessAttacked(b, sq, by) {
  const f = sq & 7;
  if (by === 0) {
    if (f > 0 && sq >= 9 && b[sq - 9] === 1) return true;
    if (f < 7 && sq >= 7 && b[sq - 7] === 1) return true;
  } else {
    if (f < 7 && sq <= 54 && b[sq + 9] === 9) return true;
    if (f > 0 && sq <= 56 && b[sq + 7] === 9) return true;
  }
  const o = by << 3;
  const kn = CHESS_KNIGHT[sq];
  for (let i = 0; i < kn.length; i++) if (b[kn[i]] === (o | 2)) return true;
  const kg = CHESS_KING[sq];
  for (let i = 0; i < kg.length; i++) if (b[kg[i]] === (o | 6)) return true;
  const rays = CHESS_RAYS[sq];
  for (let d = 0; d < 8; d++) {
    const ray = rays[d];
    for (let i = 0; i < ray.length; i++) {
      const pc = b[ray[i]];
      if (!pc) continue;
      if ((pc >> 3) === by) {
        const k = pc & 7;
        if (k === 5 || (d < 4 ? k === 4 : k === 3)) return true;
      }
      break;
    }
  }
  return false;
}

const chessInCheckPos = (p) => chessAttacked(p.b, p.kings[p.side], p.side ^ 1);

/** Every move the side to move could make, before asking whether it leaves its king in check. */
function chessGen(p, out, capsOnly) {
  const b = p.b, side = p.side, own = side << 3, them = side ^ 1;
  for (let sq = 0; sq < 64; sq++) {
    const pc = b[sq];
    if (!pc || (pc >> 3) !== side) continue;
    const kind = pc & 7;
    if (kind === 1) {
      const dir = side ? -8 : 8, rank = sq >> 3, f = sq & 7;
      const last = side ? 1 : 6, start = side ? 6 : 1;
      const to = sq + dir;
      if (!b[to]) {
        if (rank === last) { for (let k = 5; k >= 2; k--) out.push(chessMake(sq, to, k, CHESS_F_PROMO)); }
        else if (!capsOnly) {
          out.push(chessMake(sq, to, 0, 0));
          if (rank === start && !b[to + dir]) out.push(chessMake(sq, to + dir, 0, CHESS_F_DOUBLE));
        }
      }
      for (let s = -1; s <= 1; s += 2) {
        if ((s < 0 && f === 0) || (s > 0 && f === 7)) continue;
        const t = to + s;
        const tp = b[t];
        if (tp && (tp >> 3) === them) {
          if (rank === last) { for (let k = 5; k >= 2; k--) out.push(chessMake(sq, t, k, CHESS_F_PROMO | CHESS_F_CAP)); }
          else out.push(chessMake(sq, t, 0, CHESS_F_CAP));
        } else if (t === p.ep) out.push(chessMake(sq, t, 0, CHESS_F_EP | CHESS_F_CAP));
      }
    } else if (kind === 2 || kind === 6) {
      const list = kind === 2 ? CHESS_KNIGHT[sq] : CHESS_KING[sq];
      for (let i = 0; i < list.length; i++) {
        const t = list[i], tp = b[t];
        if (!tp) { if (!capsOnly) out.push(chessMake(sq, t, 0, 0)); }
        else if ((tp >> 3) === them) out.push(chessMake(sq, t, 0, CHESS_F_CAP));
      }
      if (kind === 6 && !capsOnly) chessGenCastle(p, sq, out);
    } else {
      const rays = CHESS_RAYS[sq];
      const d0 = kind === 3 ? 4 : 0, d1 = kind === 4 ? 4 : 8;
      for (let d = d0; d < d1; d++) {
        const ray = rays[d];
        for (let i = 0; i < ray.length; i++) {
          const t = ray[i], tp = b[t];
          if (!tp) { if (!capsOnly) out.push(chessMake(sq, t, 0, 0)); continue; }
          if ((tp >> 3) === them) out.push(chessMake(sq, t, 0, CHESS_F_CAP));
          break;
        }
      }
    }
  }
  return out;
}

/** Castling: the rights still there, the squares between empty, and the king not in, through or into check. */
function chessGenCastle(p, sq, out) {
  const b = p.b, side = p.side, them = side ^ 1;
  const home = side ? 60 : 4;
  if (sq !== home) return;
  const short = side ? 4 : 1, long = side ? 8 : 2;
  const rook = (side << 3) | 4;
  if ((p.castle & short) && b[home + 3] === rook && !b[home + 1] && !b[home + 2] &&
      !chessAttacked(b, home, them) && !chessAttacked(b, home + 1, them) && !chessAttacked(b, home + 2, them)) {
    out.push(chessMake(home, home + 2, 0, CHESS_F_CASTLE));
  }
  if ((p.castle & long) && b[home - 4] === rook && !b[home - 1] && !b[home - 2] && !b[home - 3] &&
      !chessAttacked(b, home, them) && !chessAttacked(b, home - 1, them) && !chessAttacked(b, home - 2, them)) {
    out.push(chessMake(home, home - 2, 0, CHESS_F_CASTLE));
  }
}

/** Plays a move on the engine's position (undone by chessUndo). */
function chessDo(p, m) {
  const b = p.b, Z0 = CHESS_Z[0], Z1 = CHESS_Z[1];
  const from = m & 63, to = (m >> 6) & 63, promo = (m >> 12) & 7, flags = m >> 15;
  const pc = b[from], side = p.side;
  let cap = b[to], capSq = to;
  if (flags & CHESS_F_EP) { capSq = side ? to + 8 : to - 8; cap = b[capSq]; }
  p.stack.push(m, cap, p.castle, p.ep, p.half, p.lo, p.hi);
  let lo = p.lo, hi = p.hi;
  if (cap) { b[capSq] = 0; lo ^= Z0.piece[cap * 64 + capSq]; hi ^= Z1.piece[cap * 64 + capSq]; }
  const put = promo ? ((side << 3) | promo) : pc;
  b[from] = 0; lo ^= Z0.piece[pc * 64 + from]; hi ^= Z1.piece[pc * 64 + from];
  b[to] = put; lo ^= Z0.piece[put * 64 + to]; hi ^= Z1.piece[put * 64 + to];
  if (flags & CHESS_F_CASTLE) {
    const rf = to > from ? to + 1 : to - 2, rt = to > from ? to - 1 : to + 1;
    const rk = b[rf];
    b[rf] = 0; b[rt] = rk;
    lo ^= Z0.piece[rk * 64 + rf] ^ Z0.piece[rk * 64 + rt];
    hi ^= Z1.piece[rk * 64 + rf] ^ Z1.piece[rk * 64 + rt];
  }
  if ((pc & 7) === 6) p.kings[side] = to;
  lo ^= Z0.castle[p.castle]; hi ^= Z1.castle[p.castle];
  p.castle &= CHESS_CASTLE_KEEP[from] & CHESS_CASTLE_KEEP[to];
  lo ^= Z0.castle[p.castle]; hi ^= Z1.castle[p.castle];
  if (p.ep >= 0) { lo ^= Z0.ep[p.ep & 7]; hi ^= Z1.ep[p.ep & 7]; }
  p.ep = flags & CHESS_F_DOUBLE ? (from + to) >> 1 : -1;
  if (p.ep >= 0) { lo ^= Z0.ep[p.ep & 7]; hi ^= Z1.ep[p.ep & 7]; }
  p.half = (pc & 7) === 1 || cap ? 0 : p.half + 1;
  p.side = side ^ 1;
  lo ^= Z0.side; hi ^= Z1.side;
  p.lo = lo; p.hi = hi;
}

function chessUndo(p) {
  const st = p.stack, n = st.length;
  const m = st[n - 7], cap = st[n - 6];
  p.castle = st[n - 5]; p.ep = st[n - 4]; p.half = st[n - 3]; p.lo = st[n - 2]; p.hi = st[n - 1];
  st.length = n - 7;
  const b = p.b;
  const from = m & 63, to = (m >> 6) & 63, promo = (m >> 12) & 7, flags = m >> 15;
  p.side ^= 1;
  const side = p.side;
  const moved = b[to];
  b[from] = promo ? ((side << 3) | 1) : moved;
  b[to] = 0;
  if (flags & CHESS_F_EP) b[side ? to + 8 : to - 8] = cap;
  else b[to] = cap;
  if (flags & CHESS_F_CASTLE) {
    const rf = to > from ? to + 1 : to - 2, rt = to > from ? to - 1 : to + 1;
    b[rf] = b[rt]; b[rt] = 0;
  }
  if ((moved & 7) === 6) p.kings[side] = from;
}

// A move that passes (the phone's search: "if I did nothing, could they still not hurt me?").
function chessDoNull(p) {
  p.stack.push(0, 0, p.castle, p.ep, p.half, p.lo, p.hi);
  if (p.ep >= 0) { p.lo ^= CHESS_Z[0].ep[p.ep & 7]; p.hi ^= CHESS_Z[1].ep[p.ep & 7]; }
  p.ep = -1;
  p.side ^= 1;
  p.lo ^= CHESS_Z[0].side; p.hi ^= CHESS_Z[1].side;
}
function chessUndoNull(p) {
  const st = p.stack, n = st.length;
  p.castle = st[n - 5]; p.ep = st[n - 4]; p.half = st[n - 3]; p.lo = st[n - 2]; p.hi = st[n - 1];
  st.length = n - 7;
  p.side ^= 1;
}

/** The legal moves of a position, as engine numbers. */
function chessLegalPos(p, capsOnly) {
  const all = chessGen(p, [], capsOnly);
  const out = [];
  const side = p.side;
  for (let i = 0; i < all.length; i++) {
    chessDo(p, all[i]);
    if (!chessAttacked(p.b, p.kings[side], side ^ 1)) out.push(all[i]);
    chessUndo(p);
  }
  return out;
}

/** Counts the leaf positions `depth` moves deep: the standard check that a move generator is right. */
function chessPerft(g, depth) {
  const p = g.b ? g : chessPos(g);
  const walk = (d) => {
    const moves = chessGen(p, []);
    const side = p.side;
    let n = 0;
    for (let i = 0; i < moves.length; i++) {
      chessDo(p, moves[i]);
      if (!chessAttacked(p.b, p.kings[side], side ^ 1)) n += d <= 1 ? 1 : walk(d - 1);
      chessUndo(p);
    }
    return n;
  };
  return depth <= 0 ? 1 : walk(depth);
}

/* --- FEN, and a game made from it ------------------------------------------------------ */

function chessFromFen(fen) {
  const parts = String(fen || CHESS_START_FEN).trim().split(/\s+/);
  const board = new Array(64).fill(0);
  const rows = (parts[0] || '').split('/');
  if (rows.length !== 8) throw new Error('bad fen');
  rows.forEach((row, i) => {
    let f = 0;
    const r = 7 - i;
    for (const ch of row) {
      if (/\d/.test(ch)) { f += Number(ch); continue; }
      const k = CHESS_LETTERS.indexOf(ch.toLowerCase());
      if (k < 1 || f > 7) throw new Error('bad fen');
      board[r * 8 + f] = k | (ch === ch.toLowerCase() ? 8 : 0);
      f++;
    }
  });
  const c = parts[2] || '-';
  const g = {
    board: board,
    turn: parts[1] === 'b' ? 1 : 0,
    castle: (c.indexOf('K') !== -1 ? 1 : 0) | (c.indexOf('Q') !== -1 ? 2 : 0) | (c.indexOf('k') !== -1 ? 4 : 0) | (c.indexOf('q') !== -1 ? 8 : 0),
    ep: parts[3] && parts[3] !== '-' ? chessSq(parts[3]) : -1,
    half: Number(parts[4]) || 0,
    full: Number(parts[5]) || 1,
    keys: []
  };
  g.keys = [chessKey(g)];
  return g;
}

const chessNew = () => chessFromFen(CHESS_START_FEN);

function chessPlacement(board) {
  let out = '';
  for (let r = 7; r >= 0; r--) {
    let run = 0;
    for (let f = 0; f < 8; f++) {
      const pc = board[r * 8 + f];
      if (!pc) { run++; continue; }
      if (run) { out += run; run = 0; }
      const l = CHESS_LETTERS[pc & 7];
      out += pc >> 3 ? l : l.toUpperCase();
    }
    if (run) out += run;
    if (r) out += '/';
  }
  return out;
}

const chessCastleText = (c) => ((c & 1 ? 'K' : '') + (c & 2 ? 'Q' : '') + (c & 4 ? 'k' : '') + (c & 8 ? 'q' : '')) || '-';

function chessFen(g) {
  return [chessPlacement(g.board), g.turn ? 'b' : 'w', chessCastleText(g.castle), g.ep >= 0 ? chessSqName(g.ep) : '-', g.half | 0, g.full || 1].join(' ');
}

/**
 * The position for threefold repetition: the pieces, the side to move, the
 * castling rights and an en passant square only when a pawn could really take
 * there (FIDE: a position is "the same" only if the same moves are possible).
 */
function chessKey(g) {
  let ep = '-';
  if (g.ep >= 0) {
    const p = chessPos(g);
    if (chessLegalPos(p, true).some(m => (m >> 15) & CHESS_F_EP)) ep = chessSqName(g.ep);
  }
  return [chessPlacement(g.board), g.turn ? 'b' : 'w', chessCastleText(g.castle), ep].join(' ');
}

/* --- the moves, as the page and the room see them ------------------------------------- */

const chessPromoLetter = (k) => (k >= 2 && k <= 5 ? CHESS_LETTERS[k] : '');

/** An engine move as { from, to, promo, san, … } for the page. */
function chessMoveInfo(p, m, legal) {
  const from = chessMFrom(m), to = chessMTo(m), flags = chessMFlags(m);
  const pc = p.b[from];
  return {
    from: chessSqName(from), to: chessSqName(to),
    promo: chessPromoLetter(chessMPromo(m)),
    piece: CHESS_LETTERS[pc & 7],
    capture: !!(flags & CHESS_F_CAP),
    ep: !!(flags & CHESS_F_EP),
    castle: flags & CHESS_F_CASTLE ? (to > from ? 'short' : 'long') : '',
    san: chessSanPos(p, m, legal)
  };
}

/** Every legal move of the game, for the page: which squares a piece can go to. */
function chessLegalMoves(g) {
  const p = chessPos(g);
  const legal = chessLegalPos(p);
  return legal.map(m => ({
    from: chessSqName(chessMFrom(m)), to: chessSqName(chessMTo(m)),
    promo: chessPromoLetter(chessMPromo(m)),
    capture: !!(chessMFlags(m) & CHESS_F_CAP)
  }));
}

/** The engine number for { from, to, promo } if it is legal here, else 0. */
function chessFind(p, mv, legal) {
  if (!mv) return 0;
  const from = typeof mv.from === 'number' ? mv.from : chessSq(mv.from);
  const to = typeof mv.to === 'number' ? mv.to : chessSq(mv.to);
  if (from < 0 || to < 0) return 0;
  const want = CHESS_LETTERS.indexOf(String(mv.promo || '').toLowerCase().slice(0, 1));
  const list = legal || chessLegalPos(p);
  for (let i = 0; i < list.length; i++) {
    const m = list[i];
    if (chessMFrom(m) !== from || chessMTo(m) !== to) continue;
    const pk = chessMPromo(m);
    if (!pk) return m;
    // A promotion needs its piece; one sent without it is the queen.
    if (pk === (want >= 2 && want <= 5 ? want : 5)) return m;
  }
  return 0;
}

/** Standard algebraic notation (Nf3, exd5, O-O, e8=Q+, Qh4#), letters in English; the page draws figurines. */
function chessSanPos(p, m, legal) {
  const from = chessMFrom(m), to = chessMTo(m), flags = chessMFlags(m);
  const pc = p.b[from], kind = pc & 7;
  let san;
  if (flags & CHESS_F_CASTLE) san = to > from ? 'O-O' : 'O-O-O';
  else {
    const cap = !!(flags & CHESS_F_CAP);
    if (kind === 1) {
      san = (cap ? CHESS_FILES[from & 7] + 'x' : '') + chessSqName(to);
      if (flags & CHESS_F_PROMO) san += '=' + CHESS_LETTERS[chessMPromo(m)].toUpperCase();
    } else {
      // Another piece of the same kind that could go to the same square: say which one moved.
      const all = legal || chessLegalPos(p);
      const twins = all.filter(o => o !== m && chessMTo(o) === to && chessMFrom(o) !== from && p.b[chessMFrom(o)] === pc);
      let dis = '';
      if (twins.length) {
        const sameFile = twins.some(o => (chessMFrom(o) & 7) === (from & 7));
        const sameRank = twins.some(o => (chessMFrom(o) >> 3) === (from >> 3));
        if (!sameFile) dis = CHESS_FILES[from & 7];
        else if (!sameRank) dis = String((from >> 3) + 1);
        else dis = chessSqName(from);
      }
      san = CHESS_LETTERS[kind].toUpperCase() + dis + (cap ? 'x' : '') + chessSqName(to);
    }
  }
  chessDo(p, m);
  if (chessInCheckPos(p)) san += chessLegalPos(p).length ? '+' : '#';
  chessUndo(p);
  return san;
}

/** What each side still has on the board: { w: [kinds], b: [kinds] }, without the kings. */
function chessMaterial(board) {
  const out = { w: [], b: [] };
  for (let sq = 0; sq < 64; sq++) {
    const pc = board[sq];
    if (!pc || (pc & 7) === 6) continue;
    out[pc >> 3 ? 'b' : 'w'].push(pc & 7);
  }
  return out;
}

// A bishop's square colour: 0 dark (a1), 1 light.
const chessSqLight = (sq) => ((sq >> 3) + (sq & 7)) & 1;

/**
 * Nobody can mate: king against king; a king and one bishop or one knight
 * against a king; kings and bishops only, every bishop on squares of one colour.
 */
function chessInsufficient(board) {
  let minors = 0, knights = 0;
  const shades = new Set();
  for (let sq = 0; sq < 64; sq++) {
    const k = board[sq] & 7;
    if (!board[sq] || k === 6) continue;
    if (k === 1 || k === 4 || k === 5) return false;
    minors++;
    if (k === 2) knights++;
    else shades.add(chessSqLight(sq));
  }
  if (minors <= 1) return true;
  return knights === 0 && shades.size === 1;
}

/**
 * Could side `color` (0 white, 1 black) mate at all, with the other side's
 * help? Asked when the other side's time runs out: if not, it is a draw. A
 * pawn, a rook or a queen can; a lone king can't; a lone knight or bishops of
 * one colour only when the other side has something of its own to block with;
 * two minors of any other kind can.
 */
function chessCanMate(board, color) {
  let n = 0, b = 0, other = 0;
  const shades = new Set();
  for (let sq = 0; sq < 64; sq++) {
    const pc = board[sq];
    if (!pc || (pc & 7) === 6) continue;
    if ((pc >> 3) !== color) { other++; continue; }
    const k = pc & 7;
    if (k === 1 || k === 4 || k === 5) return true;
    if (k === 2) n++;
    else { b++; shades.add(chessSqLight(sq)); }
  }
  if (!n && !b) return false;
  if (n + b === 1) return other > 0;
  if (!n && shades.size === 1) return other > 0;
  return true;
}

/**
 * Is the game over? { over, result: 'w' | 'b' | 'd', reason, check }.
 * mate, stalemate, repetition (the same position the third time), fifty
 * (fifty moves each with no capture or pawn move), material (nobody can mate).
 */
function chessStatus(g) {
  const p = chessPos(g);
  const check = chessInCheckPos(p);
  const moves = chessLegalPos(p);
  if (!moves.length) return check ? { over: true, result: p.side ? 'w' : 'b', reason: 'mate', check: true } : { over: true, result: 'd', reason: 'stalemate', check: false };
  if (chessInsufficient(g.board)) return { over: true, result: 'd', reason: 'material', check: check };
  const key = (g.keys || [])[g.keys.length - 1];
  if (key && g.keys.filter(k => k === key).length >= 3) return { over: true, result: 'd', reason: 'repetition', check: check };
  if ((g.half | 0) >= 100) return { over: true, result: 'd', reason: 'fifty', check: check };
  return { over: false, result: '', reason: '', check: check };
}

/**
 * Plays { from, to, promo } on the game if it is legal. Returns null when it
 * isn't, else { from, to, promo, piece, capture (the kind taken, or ''), ep,
 * castle ('short' | 'long' | ''), san, check, status } - status is chessStatus
 * after the move.
 */
function chessPlay(g, mv) {
  const p = chessPos(g);
  const legal = chessLegalPos(p);
  const m = chessFind(p, mv, legal);
  if (!m) return null;
  const info = chessMoveInfo(p, m, legal);
  const flags = chessMFlags(m);
  const to = chessMTo(m);
  const capSq = flags & CHESS_F_EP ? (p.side ? to + 8 : to - 8) : to;
  const taken = flags & CHESS_F_CAP ? p.b[capSq] : 0;
  chessDo(p, m);
  g.board = p.b.slice();
  g.castle = p.castle;
  g.ep = p.ep;
  g.half = p.half;
  if (g.turn === 1) g.full = (g.full || 1) + 1;
  g.turn = p.side;
  if (g.half === 0) g.keys = [];
  g.keys = (g.keys || []).concat([chessKey(g)]);
  const status = chessStatus(g);
  info.capture = taken ? CHESS_LETTERS[taken & 7] : '';
  info.captureSq = taken ? chessSqName(capSq) : '';
  info.check = status.check;
  info.status = status;
  return info;
}

/** The king's square when the side to move is in check, else ''. */
function chessCheckSq(g) {
  const p = chessPos(g);
  return chessInCheckPos(p) ? chessSqName(p.kings[p.side]) : '';
}

/* --- the clock --------------------------------------------------------------------- */

// The owner's choices: off, 3+2, 5+0 or 10+0 (minutes + seconds added after every move).
const CHESS_CLOCK_IDS = ['off', '3+2', '5+0', '10+0'];
const CHESS_CLOCK_SPEC = { '3+2': [3, 2], '5+0': [5, 0], '10+0': [10, 0] };

const chessClockId = (v) => (CHESS_CLOCK_IDS.indexOf(String(v)) !== -1 ? String(v) : 'off');

/**
 * A clock for a new game, or null (off). left: each side's time in ms; at: when
 * the side to move's time started running (null until White's first move - the
 * first move is free, the clock starts with Black's).
 */
function chessClockNew(id) {
  const spec = CHESS_CLOCK_SPEC[chessClockId(id)];
  if (!spec) return null;
  return { id: chessClockId(id), base: spec[0] * 60000, inc: spec[1] * 1000, left: [spec[0] * 60000, spec[0] * 60000], at: null };
}

/** How much time side `side` has at `now`. */
function chessClockLeft(clock, side, turn, now) {
  if (!clock) return Infinity;
  const run = clock.at !== null && clock.at !== undefined && side === turn ? Math.max(0, now - clock.at) : 0;
  return clock.left[side] - run;
}

/** Has the side to move run out of time (beyond `grace` ms)? */
const chessClockFlagged = (clock, turn, now, grace) => !!clock && clock.at !== null && clock.at !== undefined && chessClockLeft(clock, turn, turn, now) < -(grace || 0);

/**
 * The side to move has moved at `now`: their time comes off, the increment is
 * added, and the other side's starts. False (and nothing changed) if they had
 * run out of time beyond `grace` first. The first move of the game is free.
 */
function chessClockPress(clock, side, now, grace, firstMove) {
  if (!clock) return true;
  if (chessClockFlagged(clock, side, now, grace)) return false;
  if (clock.at !== null && clock.at !== undefined) clock.left[side] = Math.max(0, chessClockLeft(clock, side, side, now)) + clock.inc;
  else if (!firstMove) clock.left[side] += clock.inc;
  clock.at = now;
  return true;
}

/** Side `side` has run out of time: the other side wins, or it's a draw if they have nothing to mate with. */
const chessFlagResult = (board, side) => (chessCanMate(board, side ^ 1) ? (side ? 'w' : 'b') : 'd');

/* --- a match in a bracket: the tournament's adapter ------------------------------------ */

/**
 * The owner's rule for a drawn match in a tournament: replay once with the
 * colours swapped; drawn again, one Armageddon game, where a draw counts as a
 * win for Black. match = { first: 'a' | 'b' (who has White in game 1),
 * games: [{ white: 'a' | 'b', result: 'w' | 'b' | 'd', armageddon }] }.
 * Returns { done: true, winner: 'a' | 'b' } or { done: false, white, armageddon }.
 * `rnd` picks White for the Armageddon game (drawn by lot).
 */
function chessMatchNext(match, rnd) {
  const games = (match && match.games) || [];
  const first = match && match.first === 'b' ? 'b' : 'a';
  const other = (x) => (x === 'a' ? 'b' : 'a');
  if (!games.length) return { done: false, white: first, armageddon: false };
  const last = games[games.length - 1];
  const result = last.armageddon ? chessArmageddonResult(last.result) : last.result;
  if (result === 'w') return { done: true, winner: last.white };
  if (result === 'b') return { done: true, winner: other(last.white) };
  if (games.length === 1) return { done: false, white: other(last.white), armageddon: false };
  const r = typeof rnd === 'function' ? rnd() : Math.random();
  return { done: false, white: r < 0.5 ? 'a' : 'b', armageddon: true };
}

/** Armageddon: a draw is a win for Black. */
const chessArmageddonResult = (result) => (result === 'd' ? 'b' : result);

/* --- the phone's player --------------------------------------------------------------- */

// Piece-square tables (Tomasz Michniewski's "simplified evaluation function"),
// written from White's side with a8 first: a white piece on sq reads [sq ^ 56].
const CHESS_PST = [
  null,
  [0, 0, 0, 0, 0, 0, 0, 0, 50, 50, 50, 50, 50, 50, 50, 50, 10, 10, 20, 30, 30, 20, 10, 10, 5, 5, 10, 25, 25, 10, 5, 5,
    0, 0, 0, 20, 20, 0, 0, 0, 5, -5, -10, 0, 0, -10, -5, 5, 5, 10, 10, -20, -20, 10, 10, 5, 0, 0, 0, 0, 0, 0, 0, 0],
  [-50, -40, -30, -30, -30, -30, -40, -50, -40, -20, 0, 0, 0, 0, -20, -40, -30, 0, 10, 15, 15, 10, 0, -30, -30, 5, 15, 20, 20, 15, 5, -30,
    -30, 0, 15, 20, 20, 15, 0, -30, -30, 5, 10, 15, 15, 10, 5, -30, -40, -20, 0, 5, 5, 0, -20, -40, -50, -40, -30, -30, -30, -30, -40, -50],
  [-20, -10, -10, -10, -10, -10, -10, -20, -10, 0, 0, 0, 0, 0, 0, -10, -10, 0, 5, 10, 10, 5, 0, -10, -10, 5, 5, 10, 10, 5, 5, -10,
    -10, 0, 10, 10, 10, 10, 0, -10, -10, 10, 10, 10, 10, 10, 10, -10, -10, 5, 0, 0, 0, 0, 5, -10, -20, -10, -10, -10, -10, -10, -10, -20],
  [0, 0, 0, 0, 0, 0, 0, 0, 5, 10, 10, 10, 10, 10, 10, 5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5,
    -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, 0, 0, 0, 5, 5, 0, 0, 0],
  [-20, -10, -10, -5, -5, -10, -10, -20, -10, 0, 0, 0, 0, 0, 0, -10, -10, 0, 5, 5, 5, 5, 0, -10, -5, 0, 5, 5, 5, 5, 0, -5,
    0, 0, 5, 5, 5, 5, 0, -5, -10, 5, 5, 5, 5, 5, 0, -10, -10, 0, 5, 0, 0, 0, 0, -10, -20, -10, -10, -5, -5, -10, -10, -20],
  [-30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30,
    -20, -30, -30, -40, -40, -30, -30, -20, -10, -20, -20, -20, -20, -20, -20, -10, 20, 20, 0, 0, 0, 0, 20, 20, 20, 30, 10, 0, 0, 10, 30, 20]
];
const CHESS_KING_END = [-50, -40, -30, -20, -20, -30, -40, -50, -30, -20, -10, 0, 0, -10, -20, -30, -30, -10, 20, 30, 30, 20, -10, -30, -30, -10, 30, 40, 40, 30, -10, -30,
  -30, -10, 30, 40, 40, 30, -10, -30, -30, -10, 20, 30, 30, 20, -10, -30, -30, -30, 0, 0, 0, 0, -30, -30, -50, -30, -30, -30, -30, -30, -30, -50];
// A pawn further up the board is worth more once the pieces are off: by rank, from its own side.
const CHESS_PAWN_END = [0, 0, 10, 20, 35, 60, 100, 0];
const CHESS_PHASE = [0, 0, 1, 1, 2, 4, 0];

const chessCenterDist = (sq) => Math.max(3 - (sq & 7), (sq & 7) - 4) + Math.max(3 - (sq >> 3), (sq >> 3) - 4);

/** The position from the side to move's point of view, in hundredths of a pawn. */
function chessEvaluate(p) {
  const b = p.b;
  let mg = [0, 0], eg = [0, 0], phase = 0, mat = [0, 0], pawns = [0, 0], bishops = [0, 0];
  for (let sq = 0; sq < 64; sq++) {
    const pc = b[sq];
    if (!pc) continue;
    const c = pc >> 3, k = pc & 7;
    const i = c ? sq : sq ^ 56;
    if (k === 6) { mg[c] += CHESS_PST[6][i]; eg[c] += CHESS_KING_END[i]; continue; }
    const v = CHESS_VALUE[k] + CHESS_PST[k][i];
    mg[c] += v; eg[c] += v;
    mat[c] += CHESS_VALUE[k];
    phase += CHESS_PHASE[k];
    if (k === 1) { pawns[c]++; eg[c] += CHESS_PAWN_END[c ? 7 - (sq >> 3) : sq >> 3]; }
    if (k === 3) bishops[c]++;
  }
  if (bishops[0] >= 2) { mg[0] += 30; eg[0] += 40; }
  if (bishops[1] >= 2) { mg[1] += 30; eg[1] += 40; }
  const ph = Math.min(24, phase);
  let score = Math.round(((mg[0] - mg[1]) * ph + (eg[0] - eg[1]) * (24 - ph)) / 24);
  // Mating a lone king: drive it to the edge and bring your own king close.
  const lead = mat[0] - mat[1];
  if (Math.abs(lead) >= 300) {
    const strong = lead > 0 ? 0 : 1, weak = strong ^ 1;
    if (!pawns[weak] && mat[weak] <= 330) {
      const wk = p.kings[weak], sk = p.kings[strong];
      const dist = Math.abs((wk & 7) - (sk & 7)) + Math.abs((wk >> 3) - (sk >> 3));
      const mop = 10 * chessCenterDist(wk) + 4 * (14 - dist);
      score += strong ? -mop : mop;
    }
  }
  return p.side ? -score : score;
}

const CHESS_MATE = 100000;
const CHESS_INF = 1000000;

/* --- the computer's strength: a rating from 400 to 2000 --------------------------------- */

// The owner's choice (23 Sep 2026): the computer has a rating, 400 to 2000 in
// steps of 100, and its strength really follows the number. A low rating
// looks one move ahead with no look at the captures that follow (so it
// leaves pieces hanging and grabs defended ones), wobbles its judgement, and
// now and then plays a move at random - the way a beginner does; each step
// up looks further, wobbles less and slips less, and 2000 searches for as
// long as a phone can spare (1.5 s) with none of it.
const CHESS_ELO_MIN = 400, CHESS_ELO_MAX = 2000, CHESS_ELO_STEP = 100;
const CHESS_ELO_DEPTH = [1, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 5, 5, 5, 6, 30, 30];

const chessElo = (v) => {
  const n = Math.round((Number(v) || 1200) / CHESS_ELO_STEP) * CHESS_ELO_STEP;
  return Math.max(CHESS_ELO_MIN, Math.min(CHESS_ELO_MAX, n));
};

/** What a rating means to the search: how deep, how long, how many positions, how much it wobbles and slips. */
function chessEloSettings(elo) {
  const e = chessElo(elo);
  const t = (e - CHESS_ELO_MIN) / (CHESS_ELO_MAX - CHESS_ELO_MIN);
  return {
    elo: e,
    depth: CHESS_ELO_DEPTH[(e - CHESS_ELO_MIN) / CHESS_ELO_STEP],
    nodes: Math.round(1500 * Math.pow(400, t)),
    ms: Math.round(120 + 1380 * t),
    noise: Math.round(220 * Math.pow(1 - t, 2)),
    blunder: 0.25 * Math.pow(1 - t, 3),
    qdepth: e < 700 ? 0 : e < 1000 ? 2 : 8
  };
}

/** A rating's name: 'beginner' (400-700), 'intermediate' (800-1200), 'strong' (1300-1600), 'expert' (1700-2000). */
const chessEloBand = (elo) => { const e = chessElo(elo); return e < 800 ? 'beginner' : e < 1300 ? 'intermediate' : e < 1700 ? 'strong' : 'expert'; };

// The old three levels, as ratings.
const CHESS_LEVEL_ELO = { easy: 600, medium: 1200, hard: 1800 };

/**
 * The phone's move: { from, to, promo } (never an illegal one), or null when
 * there is none. Iterative deepening alpha-beta with a table of positions
 * seen, the table's move and captures (the most valuable victim by the least
 * valuable attacker) first, killer moves and history, a check extension, a
 * null move, late moves searched shallower, and a quiescence search of
 * captures at the leaves. It stops at its time budget AND at a ceiling of
 * positions (a clock that stands still - a test, a throttled tab - can't hold
 * it for ever; see Traps), keeping the best move of the last depth it finished.
 * opts: { elo (or level), ms, nodes, depth, rnd, now } - the rating's numbers, overridden.
 */
function chessBestMove(g, opts) {
  const o = opts || {};
  const L = chessEloSettings(o.elo !== undefined ? o.elo : (CHESS_LEVEL_ELO[o.level] || 1200));
  const rnd = typeof o.rnd === 'function' ? o.rnd : Math.random;
  const clockNow = typeof o.now === 'function' ? o.now : () => Date.now();
  const p = chessPos(g);
  const root = chessLegalPos(p);
  if (!root.length) return null;
  const out = (m) => ({ from: chessSqName(chessMFrom(m)), to: chessSqName(chessMTo(m)), promo: chessPromoLetter(chessMPromo(m)) });
  if (root.length === 1) return out(root[0]);
  if (L.blunder && rnd() < L.blunder) return out(root[Math.floor(rnd() * root.length)]);
  const res = chessSearch(p, g, {
    depth: o.depth || L.depth, ms: o.ms || L.ms, nodes: o.nodes || L.nodes, noise: o.noise !== undefined ? o.noise : L.noise,
    qdepth: L.qdepth, rnd: rnd, now: clockNow
  });
  return out(res.move || root[0]);
}

function chessSearch(p, g, o) {
  const start = o.now();
  const deadline = start + o.ms;
  const qmax = o.qdepth === undefined ? 8 : o.qdepth;
  const S = {
    nodes: 0, stop: false, must: true,
    tt: new Map(),
    killers: [], history: new Int32Array(64 * 64),
    path: []          // the hashes on the way here, for repetition
  };
  // The game's own history since the last capture or pawn move: a position met again there is a draw.
  const seen = new Set();
  (g.keys || []).slice(0, -1).forEach(k => {
    try { const q = chessPos(chessFromFen(k + ' 0 1')); seen.add(q.lo + ':' + q.hi); } catch (e) {}
  });
  const timeUp = () => {
    if (S.must) return false;
    if (S.nodes >= o.nodes || o.now() >= deadline) S.stop = true;
    return S.stop;
  };

  const mvvLva = (m) => {
    const t = p.b[chessMTo(m)];
    const victim = chessMFlags(m) & CHESS_F_EP ? 1 : (t & 7);
    return victim * 10 - (p.b[chessMFrom(m)] & 7);
  };
  const order = (moves, ply, ttMove) => {
    const k = S.killers[ply] || [];
    const scored = moves.map(m => {
      let s;
      if (m === ttMove) s = 1e9;
      else if (chessMFlags(m) & (CHESS_F_CAP | CHESS_F_PROMO)) s = 1e8 + mvvLva(m) * 100 + chessMPromo(m);
      else if (m === k[0]) s = 9e7;
      else if (m === k[1]) s = 8e7;
      else s = S.history[chessMFrom(m) * 64 + chessMTo(m)];
      return [s, m];
    });
    scored.sort((a, b) => b[0] - a[0]);
    return scored.map(x => x[1]);
  };

  const quiesce = (alpha, beta, ply, qd) => {
    S.nodes++;
    if ((S.nodes & 1023) === 0 && timeUp()) return 0;
    if (S.stop) return 0;
    const inCheck = chessInCheckPos(p);
    if (!inCheck || qd >= qmax) {
      const stand = chessEvaluate(p);
      if (stand >= beta) return stand;
      if (stand > alpha) alpha = stand;
      if (qd >= qmax) return stand;
    }
    const moves = order(chessGen(p, [], !inCheck), ply, 0);
    const side = p.side;
    let legal = 0;
    for (let i = 0; i < moves.length; i++) {
      const m = moves[i];
      chessDo(p, m);
      if (chessAttacked(p.b, p.kings[side], side ^ 1)) { chessUndo(p); continue; }
      legal++;
      const sc = -quiesce(-beta, -alpha, ply + 1, qd + 1);
      chessUndo(p);
      if (S.stop) return 0;
      if (sc >= beta) return sc;
      if (sc > alpha) alpha = sc;
    }
    if (inCheck && !legal) return -CHESS_MATE + ply;
    return alpha;
  };

  const negamax = (depth, alpha, beta, ply, allowNull) => {
    S.nodes++;
    if ((S.nodes & 1023) === 0 && timeUp()) return 0;
    if (S.stop) return 0;
    const key = p.lo + ':' + p.hi;
    if (ply > 0) {
      if (p.half >= 100) return 0;
      if (seen.has(key) || S.path.indexOf(key) !== -1) return 0;
      // Mate distance: nothing here can be better than mating at once.
      if (alpha < -CHESS_MATE + ply) alpha = -CHESS_MATE + ply;
      if (beta > CHESS_MATE - ply) beta = CHESS_MATE - ply;
      if (alpha >= beta) return alpha;
    }
    const inCheck = chessInCheckPos(p);
    if (inCheck) depth++;
    if (depth <= 0) return quiesce(alpha, beta, ply, 0);
    const ent = S.tt.get(p.lo);
    let ttMove = 0;
    if (ent && ent[0] === p.hi) {
      ttMove = ent[4];
      if (ply > 0 && ent[1] >= depth) {
        let sc = ent[3];
        if (sc > CHESS_MATE - 1000) sc -= ply; else if (sc < -CHESS_MATE + 1000) sc += ply;
        if (ent[2] === 0) return sc;
        if (ent[2] === 1 && sc >= beta) return sc;
        if (ent[2] === 2 && sc <= alpha) return sc;
      }
    }
    const side = p.side;
    // A null move: if passing still leaves us above beta, this line is good enough.
    if (allowNull && !inCheck && depth >= 3 && ply > 0 && beta < CHESS_MATE - 1000) {
      let big = 0;
      for (let sq = 0; sq < 64; sq++) { const pc = p.b[sq]; if (pc && (pc >> 3) === side && (pc & 7) > 1 && (pc & 7) < 6) { big++; break; } }
      if (big && chessEvaluate(p) >= beta) {
        chessDoNull(p);
        S.path.push(key);
        const sc = -negamax(depth - 3, -beta, -beta + 1, ply + 1, false);
        S.path.pop();
        chessUndoNull(p);
        if (S.stop) return 0;
        if (sc >= beta) return beta;
      }
    }
    const moves = order(chessGen(p, []), ply, ttMove);
    const a0 = alpha;
    let best = -CHESS_INF, bestMove = 0, legal = 0;
    S.path.push(key);
    for (let i = 0; i < moves.length; i++) {
      const m = moves[i];
      chessDo(p, m);
      if (chessAttacked(p.b, p.kings[side], side ^ 1)) { chessUndo(p); continue; }
      legal++;
      const quiet = !(chessMFlags(m) & (CHESS_F_CAP | CHESS_F_PROMO));
      let sc;
      if (legal > 4 && depth >= 3 && quiet && !inCheck && !chessInCheckPos(p)) {
        sc = -negamax(depth - 2, -alpha - 1, -alpha, ply + 1, true);
        if (sc > alpha && !S.stop) sc = -negamax(depth - 1, -beta, -alpha, ply + 1, true);
      } else sc = -negamax(depth - 1, -beta, -alpha, ply + 1, true);
      chessUndo(p);
      if (S.stop) { S.path.pop(); return 0; }
      if (sc > best) { best = sc; bestMove = m; }
      if (sc > alpha) alpha = sc;
      if (alpha >= beta) {
        if (quiet) {
          const k = S.killers[ply] || (S.killers[ply] = [0, 0]);
          if (k[0] !== m) { k[1] = k[0]; k[0] = m; }
          S.history[chessMFrom(m) * 64 + chessMTo(m)] += depth * depth;
        }
        break;
      }
    }
    S.path.pop();
    if (!legal) return inCheck ? -CHESS_MATE + ply : 0;
    let store = best;
    if (store > CHESS_MATE - 1000) store += ply; else if (store < -CHESS_MATE + 1000) store -= ply;
    if (S.tt.size > 400000) S.tt.clear();
    S.tt.set(p.lo, [p.hi, depth, best >= beta ? 1 : best <= a0 ? 2 : 0, store, bestMove]);
    return best;
  };

  // The root: every legal move, in the order the last depth ranked them.
  let rootMoves = order(chessLegalPos(p), 0, 0);
  let bestMove = rootMoves[0], bestScore = -CHESS_INF, done = 0;
  const noise = {};
  if (o.noise) rootMoves.forEach(m => { noise[m] = Math.round((o.rnd() * 2 - 1) * o.noise); });
  const rootKey = p.lo + ':' + p.hi;
  for (let depth = 1; depth <= o.depth; depth++) {
    S.must = depth === 1;
    const scores = [];
    let alpha = -CHESS_INF, iterBest = 0, iterScore = -CHESS_INF;
    S.path = [rootKey];
    for (let i = 0; i < rootMoves.length; i++) {
      const m = rootMoves[i];
      chessDo(p, m);
      // With a wobble, every root move gets its real score (a full window); without, alpha-beta.
      const sc = -negamax(depth - 1, -CHESS_INF, o.noise ? CHESS_INF : -alpha, 1, true) + (noise[m] || 0);
      chessUndo(p);
      if (S.stop) break;
      scores.push([sc, m]);
      if (sc > iterScore) { iterScore = sc; iterBest = m; }
      if (sc > alpha) alpha = sc;
    }
    if (S.stop) {
      // A better first move found before time ran out is still better.
      if (iterBest && iterScore > bestScore && scores.length) { bestMove = iterBest; bestScore = iterScore; }
      break;
    }
    bestMove = iterBest; bestScore = iterScore; done = depth;
    scores.sort((a, b) => b[0] - a[0]);
    rootMoves = scores.map(x => x[1]).concat(rootMoves.filter(m => !scores.some(x => x[1] === m)));
    if (Math.abs(bestScore) > CHESS_MATE - 1000) break;       // a mate found: no need to look deeper
  }
  // The line it expects: the best move, then the table's best move from each position after it.
  const pv = [];
  if (o.pv && bestMove) {
    let steps = 0;
    const walk = [bestMove];
    chessDo(p, bestMove); steps++;
    while (steps < 8) {
      const ent = S.tt.get(p.lo);
      if (!ent || ent[0] !== p.hi || !ent[4]) break;
      const m = ent[4];
      if (chessLegalPos(p).indexOf(m) === -1) break;
      walk.push(m);
      chessDo(p, m); steps++;
    }
    while (steps--) chessUndo(p);
    walk.forEach(m => pv.push(m));
  }
  return { move: bestMove, score: bestScore, depth: done, nodes: S.nodes, ms: o.now() - start, pv: pv };
}

/* ============================================================================
   The coach: what the engine sees, said in plain words
   ----------------------------------------------------------------------------
   The owner's coach mode (23 Sep 2026): a live coach against the computer (a
   warning before a blunder, a hint, a word after each of your moves, the
   pieces left hanging) and a review after every game (every move rated, an
   accuracy for each player, the evaluation as a graph, the key moments). All
   of it is worked out here, from the positions: a reason is a key and its
   facts ({ k: 'hang', piece: 'q', sq: 'd4' }), which the page turns into a
   sentence in Arabic or English. Nothing here is vague: a reason is only
   given when the position shows it (a piece that can be taken, a fork, a pin,
   a mate, material won or lost, the king's safety, development and the
   centre in the opening).

   The analysis is the search above with no wobble, bounded by a count of
   positions (not only time), so a review of a stored game comes out the same
   every time on a phone that isn't starved of time.
   ========================================================================= */

const CHESS_ANALYSE_NODES = 30000;

// How much worse than the engine's move (in hundredths of a pawn, after a
// score is held within ±1000 so a won game stays won) makes each verdict.
const CHESS_CLASS_LIMITS = { best: 15, good: 50, inaccuracy: 100, mistake: 300 };

/** A verdict from the centipawns lost: best, good, inaccuracy, mistake or blunder. */
function chessClassify(loss) {
  const l = Math.max(0, Number(loss) || 0);
  if (l <= CHESS_CLASS_LIMITS.best) return 'best';
  if (l < CHESS_CLASS_LIMITS.good) return 'good';
  if (l < CHESS_CLASS_LIMITS.inaccuracy) return 'inaccuracy';
  if (l < CHESS_CLASS_LIMITS.mistake) return 'mistake';
  return 'blunder';
}

/** A score held within ±1000 (a mate counts as the full 1000), for losses, accuracy and the graph. */
const chessClampCp = (score) => Math.max(-1000, Math.min(1000, Math.abs(score) > CHESS_MATE - 1000 ? Math.sign(score) * 1000 : score));

/** Winning chances in percent from a score (Lichess's curve). */
const chessWinPct = (cp) => 50 + 50 * (2 / (1 + Math.exp(-0.00368208 * chessClampCp(cp))) - 1);

/** A move's accuracy from the winning chances it gave away (Lichess's formula): 100 for the engine's move. */
function chessMoveAccuracy(before, after) {
  const drop = Math.max(0, chessWinPct(before) - chessWinPct(after));
  return Math.max(0, Math.min(100, 103.1668 * Math.exp(-0.04354 * drop) - 3.1669));
}

/** Moves to mate from a search score (positive: the side to move mates), or 0. */
const chessMateIn = (score) => (Math.abs(score) > CHESS_MATE - 1000 ? Math.sign(score) * Math.ceil((CHESS_MATE - Math.abs(score)) / 2) : 0);

/**
 * The engine's view of a position: { move, san, score (for the side to move),
 * mate (moves to mate, + for the side to move, - against), pv: [{ from, to,
 * promo, san }] }; a game over has no move. opts: { nodes, ms, now }.
 */
function chessAnalyse(g, opts) {
  const o = opts || {};
  const st = chessStatus(g);
  if (st.over) {
    const mated = st.reason === 'mate';
    return { over: true, move: null, san: '', score: mated ? -CHESS_MATE : 0, mate: 0, mated: mated, pv: [] };
  }
  const p = chessPos(g);
  const res = chessSearch(p, g, {
    depth: o.depth || 30, ms: o.ms || 60000, nodes: o.nodes || CHESS_ANALYSE_NODES, noise: 0, qdepth: 8,
    rnd: () => 0.5, now: typeof o.now === 'function' ? o.now : () => Date.now(), pv: true
  });
  const pv = [];
  res.pv.forEach(m => {
    const legal = chessLegalPos(p);
    pv.push({ from: chessSqName(chessMFrom(m)), to: chessSqName(chessMTo(m)), promo: chessPromoLetter(chessMPromo(m)), san: chessSanPos(p, m, legal) });
    chessDo(p, m);
  });
  for (let i = 0; i < res.pv.length; i++) chessUndo(p);
  const first = pv[0] || null;
  return { over: false, move: first ? { from: first.from, to: first.to, promo: first.promo } : null, san: first ? first.san : '',
    score: res.score, mate: chessMateIn(res.score), pv: pv, depth: res.depth };
}

/* --- what the board shows: attacks, hanging pieces, forks, pins ----------------------- */

/** The squares the piece on `from` attacks. */
function chessAttacksFrom(b, from) {
  const pc = b[from];
  if (!pc) return [];
  const k = pc & 7, c = pc >> 3, f = from & 7;
  if (k === 1) {
    const out = [];
    const d = c ? -8 : 8;
    if (f > 0 && from + d - 1 >= 0 && from + d - 1 < 64) out.push(from + d - 1);
    if (f < 7 && from + d + 1 >= 0 && from + d + 1 < 64) out.push(from + d + 1);
    return out;
  }
  if (k === 2) return CHESS_KNIGHT[from].slice();
  if (k === 6) return CHESS_KING[from].slice();
  const out = [];
  const d0 = k === 3 ? 4 : 0, d1 = k === 4 ? 4 : 8;
  for (let d = d0; d < d1; d++) {
    const ray = CHESS_RAYS[from][d];
    for (let i = 0; i < ray.length; i++) { out.push(ray[i]); if (b[ray[i]]) break; }
  }
  return out;
}

/** Every piece of side `by` that attacks `sq`. */
function chessAttackers(b, sq, by) {
  const out = [];
  for (let s = 0; s < 64; s++) {
    const pc = b[s];
    if (pc && (pc >> 3) === by && chessAttacksFrom(b, s).indexOf(sq) !== -1) out.push(s);
  }
  return out;
}

/**
 * Is the piece on `sq` in danger: attacked and not defended, or attacked by
 * something worth less than it? (A king is never "hanging".)
 */
function chessHanging(b, sq) {
  const pc = b[sq];
  if (!pc || (pc & 7) === 6) return false;
  const c = pc >> 3;
  const att = chessAttackers(b, sq, c ^ 1);
  if (!att.length) return false;
  if (!chessAttacked(b, sq, c)) return true;
  const cheapest = Math.min.apply(null, att.map(s => CHESS_VALUE[b[s] & 7] || 1000));
  return cheapest < CHESS_VALUE[pc & 7];
}

/**
 * The pieces in danger on the board: { w: ['d4', …], b: [...] } - attacked and
 * undefended, or attacked by something cheaper (the coach's "show threats").
 */
function chessThreats(g) {
  const out = { w: [], b: [] };
  for (let sq = 0; sq < 64; sq++) if (chessHanging(g.board, sq)) out[g.board[sq] >> 3 ? 'b' : 'w'].push(chessSqName(sq));
  return out;
}

/** Pieces of side `color` pinned to their king (or queen) by a line piece: [{ sq, by, to: 'k' | 'q' }]. */
function chessPins(b, color) {
  const out = [];
  for (let s = 0; s < 64; s++) {
    const pc = b[s];
    if (!pc || (pc >> 3) !== color || ((pc & 7) !== 6 && (pc & 7) !== 5)) continue;
    for (let d = 0; d < 8; d++) {
      const ray = CHESS_RAYS[s][d];
      let own = -1;
      for (let i = 0; i < ray.length; i++) {
        const q = b[ray[i]];
        if (!q) continue;
        if (own === -1) { if ((q >> 3) === color) { own = ray[i]; continue; } break; }
        const k = q & 7;
        if ((q >> 3) !== color && (k === 5 || (d < 4 ? k === 4 : k === 3)) && CHESS_VALUE[b[own] & 7] < CHESS_VALUE[pc & 7] + ((pc & 7) === 6 ? 10000 : 0)) {
          if (!((pc & 7) === 5 && k === 5)) out.push({ sq: chessSqName(own), by: chessSqName(ray[i]), to: (pc & 7) === 6 ? 'k' : 'q' });
        }
        break;
      }
    }
  }
  return out;
}

/** Material for `color` minus the other side's, in hundredths of a pawn. */
function chessMaterialDiff(b, color) {
  let d = 0;
  for (let s = 0; s < 64; s++) if (b[s] && (b[s] & 7) !== 6) d += (b[s] >> 3) === color ? CHESS_VALUE[b[s] & 7] : -CHESS_VALUE[b[s] & 7];
  return d;
}

const chessCloneGame = (g) => ({ board: g.board.slice(), turn: g.turn, castle: g.castle, ep: g.ep, half: g.half, full: g.full, keys: (g.keys || []).slice() });

/**
 * A line played out from `g` (a list of { from, to, promo }): what side
 * `color` gains or loses in material along it, and the most valuable piece of
 * its own that it loses (with the square it was taken on).
 */
function chessLineMaterial(g, line, color) {
  const q = chessCloneGame(g);
  const before = chessMaterialDiff(q.board, color);
  let lost = null;
  for (let i = 0; i < line.length; i++) {
    const info = chessPlay(q, line[i]);
    if (!info) break;
    if (info.capture && q.turn === color) {
      // The move just made (by the other side) took one of ours.
      const k = CHESS_LETTERS.indexOf(info.capture);
      if (!lost || CHESS_VALUE[k] > CHESS_VALUE[CHESS_LETTERS.indexOf(lost.piece)]) lost = { piece: info.capture, sq: info.captureSq, by: info.piece };
    }
    if (info.status.over) break;
  }
  return { gain: chessMaterialDiff(q.board, color) - before, lost: lost };
}

/** The pieces worth a knight or more (or the king) that the piece on `sq` attacks, for side `color`'s pieces. */
function chessForked(b, sq, victims) {
  const pc = b[sq];
  if (!pc) return [];
  const out = [];
  chessAttacksFrom(b, sq).forEach(t => {
    const v = b[t];
    if (!v || (v >> 3) !== victims) return;
    const k = v & 7;
    if (k === 6 || (k >= 2 && (CHESS_VALUE[k] > CHESS_VALUE[pc & 7] || !chessAttacked(b, t, victims)))) out.push(t);
  });
  return out;
}

const chessIsCentre = (sq) => sq === 27 || sq === 28 || sq === 35 || sq === 36;

/** What a move does, for a hint or praise: mate, a win of material, a fork, a check, castling, development, the centre. */
function chessMoveGood(g, mv, analysis) {
  const out = [];
  const color = g.turn;
  const q = chessCloneGame(g);
  const from = chessSq(mv.from), to = chessSq(mv.to);
  const kind = g.board[from] & 7;
  const wasHanging = chessHanging(g.board, from);
  const info = chessPlay(q, mv);
  if (!info) return out;
  if (analysis && analysis.mate > 0) { out.push({ k: 'mate_in', n: analysis.mate }); return out; }
  if (info.status.reason === 'mate') { out.push({ k: 'mate_in', n: 1 }); return out; }
  const line = analysis && analysis.pv && analysis.pv.length ? analysis.pv.slice(0, 5) : [mv];
  const mat = chessLineMaterial(g, line, color);
  const fork = chessForked(q.board, to, color ^ 1);
  if (fork.length >= 2 && !chessHanging(q.board, to)) out.push({ k: 'fork', piece: CHESS_LETTERS[kind], sq: mv.to, targets: fork.map(chessSqName) });
  else if (mat.gain >= 200 && info.capture) out.push({ k: 'wins', piece: info.capture, san: info.san });
  else if (mat.gain >= 200) out.push({ k: 'wins_later', san: info.san });
  if (wasHanging && !chessHanging(q.board, to)) out.push({ k: 'saves', piece: CHESS_LETTERS[kind] });
  if (info.castle) out.push({ k: 'castle' });
  if ((g.full || 1) <= 10 && (kind === 2 || kind === 3) && ((from >> 3) === (color ? 7 : 0))) out.push({ k: 'develop', piece: CHESS_LETTERS[kind] });
  if ((g.full || 1) <= 10 && kind === 1 && chessIsCentre(to)) out.push({ k: 'centre' });
  if (info.check && !out.length) out.push({ k: 'check' });
  if (!out.length) out.push({ k: 'improves' });
  return out;
}

/**
 * Why a move was worse than the engine's, from the position: what the other
 * side can do now (mate, take a piece left hanging, fork, pin, win material),
 * what the better move would have done (mate, win material), and in the
 * opening the king's safety, development and the centre.
 * gBefore: the position before; played / best: { from, to, promo };
 * before / after: chessAnalyse of the position before and after the move.
 */
function chessMoveBad(gBefore, played, best, before, after) {
  const out = [];
  const color = gBefore.turn;
  const q = chessCloneGame(gBefore);
  const info = chessPlay(q, played);
  if (!info) return out;
  const from = chessSq(played.from), to = chessSq(played.to);
  const kind = gBefore.board[from] & 7;
  // What the other side can do now.
  if (after && after.mate > 0) out.push({ k: 'mate_allowed', n: after.mate, san: after.san });
  else if (after && after.pv && after.pv.length) {
    const mat = chessLineMaterial(q, after.pv.slice(0, 5), color);
    const reply = after.pv[0];
    const rq = chessCloneGame(q);
    chessPlay(rq, reply);
    const rto = chessSq(reply.to);
    const fork = chessForked(rq.board, rto, color);
    const pinsBefore = chessPins(q.board, color).map(x => x.sq);
    const newPin = chessPins(rq.board, color).find(x => pinsBefore.indexOf(x.sq) === -1);
    if (mat.gain <= -150 && mat.lost) {
      const lostSq = chessSq(mat.lost.sq);
      if (chessHanging(q.board, lostSq) && q.board[lostSq]) out.push({ k: 'hang', piece: mat.lost.piece, sq: mat.lost.sq, san: reply.san });
      else if (fork.length >= 2) out.push({ k: 'fork_allowed', piece: CHESS_LETTERS[rq.board[rto] & 7], sq: reply.to, san: reply.san });
      else if (newPin) out.push({ k: 'pin_allowed', piece: CHESS_LETTERS[rq.board[chessSq(newPin.sq)] & 7], sq: newPin.sq, san: reply.san });
      else out.push({ k: 'loses', piece: mat.lost.piece, san: reply.san });
    } else if (fork.length >= 2 && mat.gain < 0) out.push({ k: 'fork_allowed', piece: CHESS_LETTERS[rq.board[rto] & 7], sq: reply.to, san: reply.san });
  }
  // What the better move would have done.
  if (best && (best.from !== played.from || best.to !== played.to || (best.promo || '') !== (played.promo || ''))) {
    if (before && before.mate > 0 && !(after && after.mate < 0)) out.push({ k: 'mate_missed', n: before.mate, san: before.san });
    else if (before && before.pv && before.pv.length) {
      const bm = chessLineMaterial(gBefore, before.pv.slice(0, 5), color);
      const pm = after && after.pv ? chessLineMaterial(q, after.pv.slice(0, 4), color).gain + (info.capture ? CHESS_VALUE[CHESS_LETTERS.indexOf(info.capture)] : 0) : 0;
      if (bm.gain >= 200 && bm.gain - pm >= 150) {
        const bq = chessCloneGame(gBefore);
        const binfo = chessPlay(bq, best);
        out.push({ k: 'win_missed', san: before.san, piece: binfo && binfo.capture ? binfo.capture : '' });
      }
    }
  }
  // The opening: the king, the queen out early, development, the centre.
  if ((gBefore.full || 1) <= 12) {
    const rights = color ? 12 : 3;
    if (kind === 6 && !info.castle && (gBefore.castle & rights)) out.push({ k: 'king_walk' });
    else if (kind === 5 && (gBefore.full || 1) <= 6 && !info.capture) out.push({ k: 'queen_early' });
    if (best && !out.length) {
      const bk = gBefore.board[chessSq(best.from)] & 7;
      const bto = chessSq(best.to);
      if (bk === 6 && Math.abs(chessSq(best.to) - chessSq(best.from)) === 2) out.push({ k: 'castle_better', san: before ? before.san : '' });
      else if ((bk === 2 || bk === 3) && (chessSq(best.from) >> 3) === (color ? 7 : 0)) out.push({ k: 'develop_better', piece: CHESS_LETTERS[bk], san: before ? before.san : '' });
      else if (bk === 1 && chessIsCentre(bto)) out.push({ k: 'centre_better', san: before ? before.san : '' });
    }
  }
  if (!out.length && before && before.san) out.push({ k: 'better', san: before.san });
  void to;
  return out;
}

/**
 * Was a best move a sacrifice? It leaves the piece it moved where it can be
 * taken for less than it is worth, and the engine still likes it.
 */
function chessIsSacrifice(gBefore, mv, scoreAfter) {
  const q = chessCloneGame(gBefore);
  const info = chessPlay(q, mv);
  if (!info || info.status.over) return false;
  const to = chessSq(mv.to);
  const pc = q.board[to];
  if (!pc || (pc & 7) === 1 || (pc & 7) === 6) return false;
  const given = CHESS_VALUE[pc & 7] - (info.capture ? CHESS_VALUE[CHESS_LETTERS.indexOf(info.capture)] : 0);
  return given >= 200 && chessHanging(q.board, to) && scoreAfter >= -50;
}

/**
 * One move judged, from the analyses of the position before it and after it:
 * { cls, loss, accuracy, best: { from, to, promo, san }, reasons, scoreBefore,
 * scoreAfter (for the side that moved), mate }.
 */
function chessJudge(gBefore, played, before, after) {
  const same = before.move && before.move.from === played.from && before.move.to === played.to && (before.move.promo || '') === (played.promo || '');
  const bestScore = before.score;
  // After the move it is the other side's turn: their score, turned round.
  let playedScore = after.over ? (after.mated ? CHESS_MATE - 1 : 0) : -after.score;
  if (same) playedScore = Math.max(playedScore, bestScore);
  const loss = same ? 0 : Math.max(0, chessClampCp(bestScore) - chessClampCp(playedScore));
  let cls = same ? 'best' : chessClassify(loss);
  // Letting a mate slip, or walking into one, is never better than a mistake.
  if (!same && before.mate > 0 && !(playedScore > CHESS_MATE - 1000) && (cls === 'best' || cls === 'good' || cls === 'inaccuracy')) cls = 'mistake';
  if (!same && after.mate > 0 && !(before.mate < 0)) cls = 'blunder';
  if ((cls === 'best') && chessIsSacrifice(gBefore, played, chessClampCp(playedScore))) cls = 'brilliant';
  const reasons = cls === 'best' || cls === 'brilliant' || cls === 'good'
    ? chessMoveGood(gBefore, played, same ? before : null)
    : chessMoveBad(gBefore, played, before.move, before, after);
  if (cls === 'brilliant') reasons.unshift({ k: 'sacrifice' });
  return {
    cls: cls, loss: Math.round(loss),
    accuracy: chessMoveAccuracy(bestScore, playedScore),
    best: before.move ? Object.assign({ san: before.san }, before.move) : null,
    reasons: reasons,
    scoreBefore: bestScore, scoreAfter: playedScore
  };
}

/* --- the review of a whole game, in slices ------------------------------------------ */

/** 'e2e4', 'e7e8q' - a move as four or five letters, for a stored game. */
const chessUci = (m) => (m ? m.from + m.to + (m.promo || '') : '');
const chessFromUci = (s) => ({ from: String(s).slice(0, 2), to: String(s).slice(2, 4), promo: String(s).slice(4, 5) });

/**
 * A review to work through a position at a time (so the page never freezes):
 * record { start (FEN, or '' for the usual start), moves: ['e2e4', …] }.
 * chessReviewStep analyses the next position; chessReviewResult puts it together.
 */
function chessReviewBegin(record) {
  const g = record && record.start ? chessFromFen(record.start) : chessNew();
  const positions = [chessCloneGame(g)];
  const moves = [];
  const sans = [];
  ((record && record.moves) || []).some(u => {
    const mv = chessFromUci(u);
    const info = chessPlay(g, mv);
    if (!info) return true;
    moves.push({ from: info.from, to: info.to, promo: info.promo });
    sans.push(info.san);
    positions.push(chessCloneGame(g));
    return false;
  });
  return { positions: positions, moves: moves, sans: sans, analyses: [], i: 0 };
}

/** Analyses the next position; true once every position is done. opts: chessAnalyse's. */
function chessReviewStep(rv, opts) {
  if (rv.i >= rv.positions.length) return true;
  rv.analyses[rv.i] = chessAnalyse(rv.positions[rv.i], opts);
  rv.i++;
  return rv.i >= rv.positions.length;
}

/**
 * The review: { moves: [{ san, color, cls, loss, accuracy, best, reasons,
 * eval (White's view after the move) }], accuracy: [White's, Black's] (null
 * for a side with no moves), graph: [White's view before the first move, and
 * after each], key: [{ i, kind: 'turn' | 'missed' | 'brilliant' }] }.
 */
function chessReviewResult(rv) {
  const out = { moves: [], accuracy: [null, null], graph: [], key: [] };
  const white = (score, turn) => (turn === 0 ? score : -score);
  const a0 = rv.analyses[0];
  out.graph.push(chessClampCp(white(a0.over ? (a0.mated ? -CHESS_MATE : 0) : a0.score, rv.positions[0].turn)));
  const acc = [[], []];
  for (let i = 0; i < rv.moves.length; i++) {
    const gb = rv.positions[i];
    const j = chessJudge(gb, rv.moves[i], rv.analyses[i], rv.analyses[i + 1]);
    const color = gb.turn;
    j.san = rv.sans[i];
    j.color = color;
    j.eval = chessClampCp(white(j.scoreAfter, color));
    out.moves.push(j);
    out.graph.push(j.eval);
    acc[color].push(j.accuracy);
  }
  out.accuracy = acc.map(list => (list.length ? Math.round(list.reduce((a, b) => a + b, 0) / list.length * 10) / 10 : null));
  // The key moments: the turning points (the biggest swings in winning chances),
  // the chances missed (a mistake answered by another), and any brilliant move.
  const swings = out.moves.map((m, i) => ({ i: i, drop: chessWinPct(m.scoreBefore) - chessWinPct(m.scoreAfter), m: m }))
    .filter(x => x.m.cls === 'mistake' || x.m.cls === 'blunder');
  swings.forEach(x => {
    const prev = out.moves[x.i - 1];
    const missed = prev && (prev.cls === 'mistake' || prev.cls === 'blunder');
    out.key.push({ i: x.i, kind: missed ? 'missed' : 'turn', drop: Math.round(x.drop) });
  });
  out.moves.forEach((m, i) => { if (m.cls === 'brilliant') out.key.push({ i: i, kind: 'brilliant', drop: 0 }); });
  out.key.sort((a, b) => b.drop - a.drop);
  out.key = out.key.slice(0, 8).sort((a, b) => a.i - b.i);
  return out;
}

/** A whole review at once (the tests; a page goes a step at a time). */
function chessReview(record, opts) {
  const rv = chessReviewBegin(record);
  while (!chessReviewStep(rv, opts)) { /* next position */ }
  return chessReviewResult(rv);
}
