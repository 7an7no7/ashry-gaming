/* ============================================================================
   إكس أو — the rules, once, for the page and the rooms server
   ----------------------------------------------------------------------------
   Inlined into the page (SHARED_LISTS in tools/build-*.mjs) for the game on
   one phone (JS_XO.html) and the room's phones (JS_RoomXO.html), and bundled
   into the Worker (FILES in rooms-worker/build.mjs) for the room
   (DUEL_KINDS.xo in RoomDuels.js): a mark on one phone and a mark in a room
   are judged by the same xoMark and xoWinner. No DOM, nothing that runs at
   load; every name starts with xo / XO_, since the page and the Worker are
   each one scope.

   A board is 9 cells ('' | 'X' | 'O'), 0-2 the top row, left to right.
   3 marks only (the owner, 22 Sep 2026): each side keeps XO_KEEP marks; a
   fourth takes the place of that side's oldest (`order[mark]`, oldest first),
   and the new mark can't go on the square of the one leaving - it is still on
   the board while the move is chosen. Six marks never fill nine squares, so
   with the rule there is no draw: play goes on until three in a row.
   ========================================================================= */

const XO_LINES = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
const XO_KEEP = 3;          // marks a side keeps with the 3-marks rule

/** Three in a row ({ mark, line }), a full board ({ mark: 'D', line: null }), or null. */
function xoWinner(board) {
  for (const line of XO_LINES) {
    const a = line[0], b = line[1], c = line[2];
    if (board[a] && board[a] === board[b] && board[a] === board[c]) return { mark: board[a], line: line };
  }
  return board.every(Boolean) ? { mark: 'D', line: null } : null;
}

/**
 * `mark` at `cell` on `board`, in place: null when the square is taken or not
 * on the board; otherwise { gone }, the square the mark took off with the
 * 3-marks rule (-1 when none). `order` is { X: [], O: [] }, kept for the rule.
 */
function xoMark(board, order, rule3, cell, mark) {
  const i = Number(cell);
  if (!(i >= 0 && i < 9 && Math.floor(i) === i) || board[i] || (mark !== 'X' && mark !== 'O')) return null;
  board[i] = mark;
  let gone = -1;
  if (rule3) {
    const mine = order[mark] || (order[mark] = []);
    mine.push(i);
    if (mine.length > XO_KEEP) {
      gone = mine.shift();
      board[gone] = '';
    }
  }
  return { gone: gone };
}

/**
 * The one empty square left for `mark`, when it doesn't make three in a row -
 * played for them in a room (ROOM_FORCED_GAMES.xo); -1 otherwise. With the
 * 3-marks rule there are always three squares free, so never.
 */
function xoOnlyMove(board, rule3, mark) {
  if (rule3) return -1;
  const free = [];
  board.forEach((v, i) => { if (!v) free.push(i); });
  if (free.length !== 1) return -1;
  const b = board.slice();
  b[free[0]] = mark;
  const w = xoWinner(b);
  return w && w.mark === mark ? -1 : free[0];
}

/* ============================================================================
   «إكس أو الكبير» - nine boards in one (the owner, 2 Oct 2026)
   ----------------------------------------------------------------------------
   The size choice «المقاس: عادي / كبير». A big game is
     cells   81 squares, board b's square i at b * 9 + i (each board 0-2 the
             top row, left to right, as the small game's; the boards too)
     minis   9 boards: '' open, 'X' / 'O' won, 'D' full with no line
     send    the board the side to move must play in, or -1: anywhere open
   The square you play sends your opponent to the board in its place; sent to
   a board already won or full, they play in any open board. Three boards won
   in a row win; a drawn board counts for nobody; once no line of boards is
   possible for either side, the most boards won wins, equal is a draw.
   The 3-marks rule is for the normal size only. No move clock.
   ========================================================================= */

const XOB_SIZE = 81;

/** A fresh big game. */
function xoBigNew() {
  return { cells: Array(XOB_SIZE).fill(''), minis: Array(9).fill(''), send: -1 };
}

/** The squares the side to move may play (0-80). */
function xoBigLegal(g) {
  const out = [];
  for (let b = 0; b < 9; b++) {
    if (g.minis[b] || (g.send >= 0 && g.send !== b)) continue;
    for (let i = 0; i < 9; i++) if (!g.cells[b * 9 + i]) out.push(b * 9 + i);
  }
  return out;
}

/** Board b's result after a mark at its square i: 'X' / 'O' (a line through i), 'D' (full), or ''. */
function xoBigMiniAfter(cells, b, i) {
  const m = cells[b * 9 + i];
  for (const line of XO_LINES) {
    if (line.indexOf(i) === -1) continue;
    if (cells[b * 9 + line[0]] === m && cells[b * 9 + line[1]] === m && cells[b * 9 + line[2]] === m) return m;
  }
  for (let k = 0; k < 9; k++) if (!cells[b * 9 + k]) return '';
  return 'D';
}

/** The small board's winning line (its squares 0-8), or null. */
function xoBigMiniLine(cells, b) {
  const w = xoWinner(cells.slice(b * 9, b * 9 + 9));
  return w && w.line ? w.line : null;
}

/**
 * `mark` at square `at` (0-80) of game `g`, in place: null when it isn't a
 * legal move; otherwise { board, cell, took } - took is the board's new
 * result ('X' / 'O' / 'D') when this mark decided it, '' otherwise.
 */
function xoBigMark(g, at, mark) {
  const n = Number(at);
  if (!(n >= 0 && n < XOB_SIZE && Math.floor(n) === n) || (mark !== 'X' && mark !== 'O')) return null;
  const b = Math.floor(n / 9), i = n % 9;
  if (g.minis[b] || g.cells[n] || (g.send >= 0 && g.send !== b)) return null;
  g.cells[n] = mark;
  const took = xoBigMiniAfter(g.cells, b, i);
  if (took) g.minis[b] = took;
  g.send = g.minis[i] ? -1 : i;
  return { board: b, cell: i, took: took };
}

/** Can `m` still make a line of boards? */
const xoBigCanLine = (minis, m) => XO_LINES.some(l => l.every(b => !minis[b] || minis[b] === m));

/**
 * The big game's end: three boards in a row ({ mark, line }); no line possible
 * any more for either side ({ mark: 'X' | 'O' | 'D', line: null, boards: true }:
 * the most boards won, equal a draw); or null while it goes on.
 */
function xoBigWinner(minis) {
  for (const line of XO_LINES) {
    const m = minis[line[0]];
    if (m && m !== 'D' && minis[line[1]] === m && minis[line[2]] === m) return { mark: m, line: line };
  }
  if (xoBigCanLine(minis, 'X') || xoBigCanLine(minis, 'O')) return null;
  let x = 0, o = 0;
  minis.forEach(v => { if (v === 'X') x++; else if (v === 'O') o++; });
  return { mark: x > o ? 'X' : (o > x ? 'O' : 'D'), line: null, boards: true };
}

/** Boards won by each side: { X, O }. */
function xoBigCount(minis) {
  const c = { X: 0, O: 0 };
  (minis || []).forEach(v => { if (v === 'X' || v === 'O') c[v]++; });
  return c;
}

/**
 * The one square left for `mark`, played for them in a room
 * (ROOM_FORCED_GAMES.xo) - never when it takes a board or the game, which
 * stays the player's own tap; -1 otherwise.
 */
function xoBigOnlyMove(g, mark) {
  const legal = xoBigLegal(g);
  if (legal.length !== 1) return -1;
  const c = { cells: g.cells.slice(), minis: g.minis.slice(), send: g.send };
  const r = xoBigMark(c, legal[0], mark);
  return r && (r.took === 'X' || r.took === 'O') ? -1 : legal[0];
}

/* --- the phone as a player on the big board ---------------------------------
   Hard: negamax with alpha-beta over the legal squares (a board taken first,
   a send to a decided board - which frees the other side - last), deepened one
   ply at a time while the time and a node ceiling last (the duels' pattern:
   a clock that stands still in a test can't hold it). Its judgement: each
   line of boards is worth the chance of finishing it - a board won is 1, an
   open board a little more the more of its own lines are on their way, a
   board lost or drawn 0 - the product, summed; plus the boards won, for the
   "most boards" end. Easy looks one move ahead and plays at random 40% of the
   time, always taking the game when it can. */
const XOB_BUDGET_MS = 250;
const XOB_MAX_NODES = 60000;
const XOB_WIN = 100000;

const xoBigOther = (m) => (m === 'X' ? 'O' : 'X');

/** How likely `m` is to take open board b, 0.1 - 0.8, from the lines on its way. */
function xoBigMiniChance(cells, b, m) {
  let v = 0;
  for (const line of XO_LINES) {
    let own = 0, other = false;
    for (const k of line) {
      const c = cells[b * 9 + k];
      if (c === m) own++;
      else if (c) { other = true; break; }
    }
    if (!other) v += own === 2 ? 3 : own;
  }
  return Math.min(0.8, 0.1 + v * 0.05);
}

/** The board for the side to move (s.turn), in points. */
function xoBigJudge(s) {
  const side = (m) => {
    const p = [];
    for (let b = 0; b < 9; b++) {
      const r = s.minis[b];
      p[b] = r === m ? 1 : (r ? 0 : xoBigMiniChance(s.cells, b, m));
    }
    let v = 0;
    for (const l of XO_LINES) v += p[l[0]] * p[l[1]] * p[l[2]] * 100;
    for (let b = 0; b < 9; b++) if (s.minis[b] === m) v += b === 4 ? 14 : (b % 2 === 0 ? 11 : 9);
    return v;
  };
  return side(s.turn) - side(xoBigOther(s.turn)) + (s.send < 0 ? 6 : 0);
}

function xoBigApply(s, at) {
  const b = Math.floor(at / 9), i = at % 9;
  const undo = { at: at, mini: s.minis[b], send: s.send };
  s.cells[at] = s.turn;
  const took = xoBigMiniAfter(s.cells, b, i);
  if (took) s.minis[b] = took;
  s.send = s.minis[i] ? -1 : i;
  s.turn = xoBigOther(s.turn);
  undo.took = took;
  return undo;
}

function xoBigUndo(s, u) {
  s.turn = xoBigOther(s.turn);
  s.cells[u.at] = '';
  s.minis[Math.floor(u.at / 9)] = u.mini;
  s.send = u.send;
}

/** The legal squares, the likeliest first. */
function xoBigOrdered(s) {
  const me = s.turn;
  const scored = xoBigLegal(s).map(at => {
    const b = Math.floor(at / 9), i = at % 9;
    s.cells[at] = me;
    const takes = xoBigMiniAfter(s.cells, b, i) === me;
    s.cells[at] = '';
    // A send to a decided board lets the other side play anywhere.
    const frees = !!s.minis[i] || (i === b && takes);
    return { at: at, r: (takes ? 100 : 0) - (frees ? 40 : 0) + (i === 4 ? 2 : 0) };
  });
  scored.sort((a, c) => c.r - a.r);
  return scored.map(x => x.at);
}

/** The game after a move that decided a board: the mover's win (1), loss (-1), a draw (0), or null. */
function xoBigEnd(s, mover) {
  const w = xoBigWinner(s.minis);
  if (!w) return null;
  return w.mark === 'D' ? 0 : (w.mark === mover ? 1 : -1);
}

function xoBigSearch(s, depth, alpha, beta, ply, ctx) {
  ctx.nodes++;
  const moves = xoBigOrdered(s);
  if (!moves.length) return 0;
  let best = -Infinity;
  for (const at of moves) {
    const me = s.turn;
    const u = xoBigApply(s, at);
    const end = u.took ? xoBigEnd(s, me) : null;
    let v;
    if (end !== null) v = end * (XOB_WIN - ply);
    else if (depth <= 1 || ctx.nodes > XOB_MAX_NODES || ctx.now() > ctx.until) v = -xoBigJudge(s);
    else v = -xoBigSearch(s, depth - 1, -beta, -alpha, ply + 1, ctx);
    xoBigUndo(s, u);
    if (v > best) best = v;
    if (v > alpha) alpha = v;
    if (alpha >= beta) break;
  }
  return best;
}

/**
 * The phone's square (0-80) on the big board, for `g` with `mark` to move.
 * level 'easy' | 'hard'; opt: { now (a clock), budget (ms), rand }.
 */
function xoBigBestMove(g, mark, level, opt) {
  opt = opt || {};
  const rand = opt.rand || Math.random;
  const now = opt.now || (() => Date.now());
  const s = { cells: g.cells.slice(), minis: g.minis.slice(), send: g.send, turn: mark };
  const legal = xoBigOrdered(s);
  if (!legal.length) return -1;
  if (legal.length === 1) return legal[0];
  // The game in one move is always taken.
  for (const at of legal) {
    const u = xoBigApply(s, at);
    const end = u.took ? xoBigEnd(s, mark) : null;
    xoBigUndo(s, u);
    if (end === 1) return at;
  }
  // An empty board: the middle board's middle, or one of its corners.
  if (s.cells.every(v => !v)) return 36 + [4, 0, 2, 6, 8][Math.floor(rand() * 5)];
  if (level === 'easy' && rand() < 0.4) return legal[Math.floor(rand() * legal.length)];
  const ctx = { nodes: 0, until: now() + (opt.budget || XOB_BUDGET_MS), now: now };
  const maxDepth = level === 'easy' ? 1 : 9;
  let choices = legal.slice(0, 1);
  for (let depth = 1; depth <= maxDepth; depth++) {
    let best = -Infinity, pick = [];
    for (const at of legal) {
      const u = xoBigApply(s, at);
      const end = u.took ? xoBigEnd(s, mark) : null;
      const v = end !== null ? end * XOB_WIN : (depth === 1 ? -xoBigJudge(s) : -xoBigSearch(s, depth - 1, -Infinity, Infinity, 1, ctx));
      xoBigUndo(s, u);
      if (v > best + 1e-9) { best = v; pick = [at]; }
      else if (Math.abs(v - best) <= 1e-9) pick.push(at);
    }
    // A depth cut short by the clock or the ceiling is not trusted over the last whole one.
    if (depth > 1 && (ctx.nodes > XOB_MAX_NODES || now() > ctx.until)) break;
    choices = pick;
    if (best >= XOB_WIN - 50 || best <= -XOB_WIN + 50) break;
  }
  return choices[Math.floor(rand() * choices.length)];
}
