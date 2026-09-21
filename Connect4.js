/* ============================================================================
   كونكت ٤ — CONNECT 4: the rules, and the phone as a player
   ----------------------------------------------------------------------------
   One copy for both sides: the page inlines this file (two on one phone, one
   against the phone) and the rooms server bundles it (rooms-worker/build.mjs),
   so a disc is judged by the same code everywhere. No DOM, nothing that runs
   at load, and every top-level name starts with c4 / C4_ - the page and the
   Worker are each one scope.

   A board is { cols, rows, n, grid }: `grid` is cols x rows cells, row 0 at
   the top, each 0 (empty), 1 or 2. A disc dropped in a column lands on the
   lowest free cell. n in a row wins - 4 on the classic 7 x 6, or 5 on
   Hasbro's 9 x 6 - across, down or on either diagonal. A full board with no
   line is a draw.

   The phone's player (c4BestMove) never holds the page: hard is a negamax
   with alpha-beta, deepened one ply at a time until its time budget
   (C4_BUDGET_MS) runs out, keeping the best move of the last depth it
   finished; medium looks three plies ahead and sometimes settles for its
   second choice; easy takes a win it sees most of the time, blocks one some
   of the time, and otherwise drops near the middle at random.
   ========================================================================= */
const C4_MODES = { 4: { cols: 7, rows: 6 }, 5: { cols: 9, rows: 6 } };
const C4_LEVELS = ['easy', 'medium', 'hard'];
const C4_BUDGET_MS = 250;
const C4_MAX_NODES = 3000000;     // a ceiling as well as the clock, should the clock ever stand still
const C4_WIN = 1000000;
// What a window of n cells is worth to the side that alone has discs in it,
// by how many of its cells are still empty: one short of a line is a threat.
const C4_WINDOW_WORTH = [0, 60, 8, 2, 1, 0];

/** 4 or 5 in a row; anything else is the classic 4. */
function c4Mode(n) { return Number(n) === 5 ? 5 : 4; }

function c4NewBoard(n) {
  const mode = c4Mode(n);
  const size = C4_MODES[mode];
  const grid = [];
  for (let i = 0; i < size.cols * size.rows; i++) grid.push(0);
  return { cols: size.cols, rows: size.rows, n: mode, grid: grid };
}

/** A copy that can be played on without touching the original. */
function c4Clone(board) {
  return { cols: board.cols, rows: board.rows, n: board.n, grid: board.grid.slice() };
}

/** The row a disc dropped in column c lands on, or -1 when the column is full or not a column. */
function c4DropRow(board, c) {
  if (typeof c !== 'number' || c !== Math.floor(c) || c < 0 || c >= board.cols) return -1;
  for (let r = board.rows - 1; r >= 0; r--) if (!board.grid[r * board.cols + c]) return r;
  return -1;
}

/** Columns with room left, left to right. */
function c4LegalCols(board) {
  const out = [];
  for (let c = 0; c < board.cols; c++) if (!board.grid[c]) out.push(c);
  return out;
}

const C4_DIRS = [[0, 1], [1, 0], [1, 1], [1, -1]];   // [down, across] steps: across, down, both diagonals

/**
 * Every cell of every run of n or more that passes through (r, c), each run
 * in order along it (so a winning line can be lit from one end). [] if none.
 */
function c4LinesThrough(board, r, c) {
  const cols = board.cols, rows = board.rows, grid = board.grid;
  const p = grid[r * cols + c];
  if (!p) return [];
  const out = [];
  for (let d = 0; d < C4_DIRS.length; d++) {
    const dr = C4_DIRS[d][0], dc = C4_DIRS[d][1];
    let r0 = r, c0 = c;
    while (r0 - dr >= 0 && r0 - dr < rows && c0 - dc >= 0 && c0 - dc < cols && grid[(r0 - dr) * cols + (c0 - dc)] === p) {
      r0 -= dr; c0 -= dc;
    }
    const run = [];
    let r1 = r0, c1 = c0;
    while (r1 >= 0 && r1 < rows && c1 >= 0 && c1 < cols && grid[r1 * cols + c1] === p) {
      run.push(r1 * cols + c1);
      r1 += dr; c1 += dc;
    }
    if (run.length >= board.n) run.forEach(i => { if (out.indexOf(i) === -1) out.push(i); });
  }
  return out;
}

/**
 * Drops player p's disc in column c. Null when the column is full; otherwise
 * { col, row, cells (the winning run(s), or []), win, draw }.
 */
function c4Play(board, c, p) {
  const row = c4DropRow(board, c);
  if (row < 0 || (p !== 1 && p !== 2)) return null;
  board.grid[row * board.cols + c] = p;
  const cells = c4LinesThrough(board, row, c);
  const full = c4LegalCols(board).length === 0;
  return { col: c, row: row, cells: cells, win: cells.length > 0, draw: !cells.length && full };
}

/** Looks over the whole board: { p, cells } for a line of n, 'draw' for a full board, or null. */
function c4Winner(board) {
  for (let i = 0; i < board.grid.length; i++) {
    if (!board.grid[i]) continue;
    const cells = c4LinesThrough(board, Math.floor(i / board.cols), i % board.cols);
    if (cells.length) return { p: board.grid[i], cells: cells };
  }
  return c4LegalCols(board).length ? null : 'draw';
}

/* --- the phone as a player ------------------------------------------------- */

const C4_WINDOW_CACHE = {};

/** Every run of n cells on a board of this size, as lists of cell indices. Worked out once per size. */
function c4Windows(cols, rows, n) {
  const key = cols + 'x' + rows + 'x' + n;
  if (C4_WINDOW_CACHE[key]) return C4_WINDOW_CACHE[key];
  const out = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      for (let d = 0; d < C4_DIRS.length; d++) {
        const dr = C4_DIRS[d][0], dc = C4_DIRS[d][1];
        const rEnd = r + dr * (n - 1), cEnd = c + dc * (n - 1);
        if (rEnd < 0 || rEnd >= rows || cEnd < 0 || cEnd >= cols) continue;
        const w = [];
        for (let k = 0; k < n; k++) w.push((r + dr * k) * cols + (c + dc * k));
        out.push(w);
      }
    }
  }
  C4_WINDOW_CACHE[key] = out;
  return out;
}

/**
 * How good the board looks for player `me`: every window only one side has
 * discs in is worth something to that side (a lot when it is one short of a
 * line), the other side's a little more than ours - a threat not answered
 * loses the game - and discs near the middle column, which sits in the most
 * lines, count a little on their own.
 */
function c4Evaluate(grid, cols, rows, n, me) {
  const opp = 3 - me;
  const windows = c4Windows(cols, rows, n);
  let score = 0;
  for (let w = 0; w < windows.length; w++) {
    const win = windows[w];
    let mine = 0, theirs = 0;
    for (let k = 0; k < win.length; k++) {
      const v = grid[win[k]];
      if (v === me) mine++;
      else if (v === opp) theirs++;
    }
    if (mine && !theirs) score += C4_WINDOW_WORTH[n - mine] || 0;
    else if (theirs && !mine) score -= (C4_WINDOW_WORTH[n - theirs] || 0) * 1.15;
  }
  const mid = (cols - 1) / 2;
  for (let i = 0; i < grid.length; i++) {
    if (!grid[i]) continue;
    const near = mid - Math.abs((i % cols) - mid);
    score += (grid[i] === me ? 2 : -2) * near;
  }
  return score;
}

/** Does the disc just placed at (r, c) make n in a row? The fast check the search uses. */
function c4RunAt(grid, cols, rows, n, r, c, p) {
  for (let d = 0; d < C4_DIRS.length; d++) {
    const dr = C4_DIRS[d][0], dc = C4_DIRS[d][1];
    let count = 1;
    let rr = r + dr, cc = c + dc;
    while (rr >= 0 && rr < rows && cc >= 0 && cc < cols && grid[rr * cols + cc] === p) { count++; rr += dr; cc += dc; }
    rr = r - dr; cc = c - dc;
    while (rr >= 0 && rr < rows && cc >= 0 && cc < cols && grid[rr * cols + cc] === p) { count++; rr -= dr; cc -= dc; }
    if (count >= n) return true;
  }
  return false;
}

/** Columns from the middle out, the order a good move is most likely found in; `rnd` breaks the ties. */
function c4MiddleOut(cols, rnd) {
  const mid = (cols - 1) / 2;
  const list = [];
  for (let c = 0; c < cols; c++) list.push({ c: c, d: Math.abs(c - mid), t: rnd() });
  list.sort((a, b) => (a.d - b.d) || (a.t - b.t));
  return list.map(x => x.c);
}

/** A column where player p would complete a line right now, or -1. */
function c4WinningCol(board, p) {
  const cols = c4LegalCols(board);
  for (let i = 0; i < cols.length; i++) {
    const r = c4DropRow(board, cols[i]);
    board.grid[r * board.cols + cols[i]] = p;
    const wins = c4RunAt(board.grid, board.cols, board.rows, board.n, r, cols[i], p);
    board.grid[r * board.cols + cols[i]] = 0;
    if (wins) return cols[i];
  }
  return -1;
}

const C4_TIMEOUT = { timeout: true };

/** Negamax with alpha-beta, from the side of `p`, who is to move. Throws C4_TIMEOUT past the deadline. */
function c4Negamax(ctx, depth, alpha, beta, p, ply) {
  if ((++ctx.nodes & 1023) === 0 && (Date.now() > ctx.deadline || ctx.nodes > C4_MAX_NODES)) throw C4_TIMEOUT;
  const grid = ctx.grid, cols = ctx.cols, rows = ctx.rows, n = ctx.n, heights = ctx.heights;
  if (depth === 0) return c4Evaluate(grid, cols, rows, n, p);
  let best = -Infinity;
  for (let k = 0; k < ctx.order.length; k++) {
    const c = ctx.order[k];
    if (heights[c] >= rows) continue;
    const r = rows - 1 - heights[c];
    const i = r * cols + c;
    grid[i] = p; heights[c]++; ctx.filled++;
    let score;
    if (c4RunAt(grid, cols, rows, n, r, c, p)) score = C4_WIN - ply;
    else if (ctx.filled === ctx.size) score = 0;
    else score = -c4Negamax(ctx, depth - 1, -beta, -alpha, 3 - p, ply + 1);
    grid[i] = 0; heights[c]--; ctx.filled--;
    if (score > best) best = score;
    if (score > alpha) alpha = score;
    if (alpha >= beta) break;
  }
  return best === -Infinity ? 0 : best;
}

/** Each legal column's score for `me` searched `depth` plies deep, best first. */
function c4ScoreRoot(ctx, me, depth, order) {
  const out = [];
  let alpha = -Infinity;
  for (let k = 0; k < order.length; k++) {
    const c = order[k];
    if (ctx.heights[c] >= ctx.rows) continue;
    const r = ctx.rows - 1 - ctx.heights[c];
    const i = r * ctx.cols + c;
    ctx.grid[i] = me; ctx.heights[c]++; ctx.filled++;
    let score;
    try {
      if (c4RunAt(ctx.grid, ctx.cols, ctx.rows, ctx.n, r, c, me)) score = C4_WIN;
      else if (ctx.filled === ctx.size) score = 0;
      else score = -c4Negamax(ctx, depth - 1, -Infinity, -alpha, 3 - me, 1);
    } finally {
      ctx.grid[i] = 0; ctx.heights[c]--; ctx.filled--;
    }
    out.push({ c: c, score: score });
    if (score > alpha) alpha = score;
  }
  out.sort((a, b) => b.score - a.score);
  return out;
}

function c4SearchContext(board, deadline) {
  const heights = [];
  let filled = 0;
  for (let c = 0; c < board.cols; c++) {
    let h = 0;
    for (let r = board.rows - 1; r >= 0; r--) if (board.grid[r * board.cols + c]) h++;
    heights.push(h);
    filled += h;
  }
  return {
    grid: board.grid.slice(), cols: board.cols, rows: board.rows, n: board.n,
    heights: heights, filled: filled, size: board.cols * board.rows,
    order: null, nodes: 0, deadline: deadline
  };
}

/**
 * The column the phone plays for player `me` at `level`. Always a legal
 * column while the board has one (-1 on a full board). `opts.rnd` replaces
 * Math.random (the tests), `opts.budget` the hard level's time in ms.
 */
function c4BestMove(board, me, level, opts) {
  const o = opts || {};
  const rnd = o.rnd || Math.random;
  const legal = c4LegalCols(board);
  if (!legal.length) return -1;
  if (legal.length === 1) return legal[0];
  const opp = 3 - me;
  const work = c4Clone(board);
  const win = c4WinningCol(work, me);
  const block = c4WinningCol(work, opp);
  const order = c4MiddleOut(board.cols, rnd).filter(c => legal.indexOf(c) !== -1);

  if (level === 'easy') {
    if (win !== -1 && rnd() < 0.75) return win;
    if (block !== -1 && rnd() < 0.5) return block;
    // Near the middle more often than the edges, the way a child plays.
    const mid = (board.cols - 1) / 2;
    const weights = legal.map(c => 1 + (mid - Math.abs(c - mid)));
    let pick = rnd() * weights.reduce((a, b) => a + b, 0);
    for (let i = 0; i < legal.length; i++) { pick -= weights[i]; if (pick <= 0) return legal[i]; }
    return legal[legal.length - 1];
  }

  if (win !== -1) return win;
  if (block !== -1) return block;

  if (level === 'medium') {
    const ctx = c4SearchContext(board, Date.now() + Math.min(o.budget || C4_BUDGET_MS, 150));
    ctx.order = order;
    let scored;
    try { scored = c4ScoreRoot(ctx, me, 3, order); } catch (e) { return order[0]; }
    // A quarter of the time the second choice, as long as it doesn't hand over the game.
    if (scored.length > 1 && rnd() < 0.25 && scored[1].score > -C4_WIN / 2) return scored[1].c;
    return scored[0].c;
  }

  // Hard: deeper and deeper until the time is up, keeping the last depth that finished.
  const ctx = c4SearchContext(board, Date.now() + (o.budget || C4_BUDGET_MS));
  ctx.order = order;
  let best = order[0];
  let rootOrder = order.slice();
  const maxDepth = ctx.size - ctx.filled;
  for (let depth = 1; depth <= maxDepth; depth++) {
    let scored;
    try { scored = c4ScoreRoot(ctx, me, depth, rootOrder); } catch (e) { break; }
    if (!scored.length) break;
    best = scored[0].c;
    // The next depth looks at this depth's best first, which is what makes alpha-beta cut.
    rootOrder = scored.map(x => x.c);
    if (scored[0].score >= C4_WIN - 64 || scored[0].score <= -(C4_WIN - 64)) {
      // A forced result either way is known; losing, prefer the move that loses latest.
      break;
    }
  }
  return best;
}
