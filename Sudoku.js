/* ============================================================================
   سودوكو — SUDOKU: the puzzle's rules
   ----------------------------------------------------------------------------
   Moved out of JS_Sudoku.html for سباق ألغاز (26 Sep 2026): a race's grid is
   dealt on the rooms server and the finished grid judged there, so the
   generator and the judge live in a file both sides bundle (the page inlines
   it, SHARED_LISTS; the Worker bundles it, FILES in rooms-worker/build.mjs).
   No DOM, nothing that runs at load; every name starts with sudoku / SUDOKU_.
   Draws with SoloShared.js (soloShuffle).

   A 9×9 grid made at random (sudokuFill), then numbers taken away one at a
   time as long as the puzzle still has exactly one solution (sudokuCount
   stops at two). Easy keeps 40 numbers, medium 32, hard 26; hard is kept only
   when naked and hidden singles alone can't finish it (sudokuSinglesSolve).
   ========================================================================= */

const SUDOKU_GIVENS = { easy: 40, medium: 32, hard: 26 };

const SUDOKU_BOX = Array.from({ length: 81 }, (_, i) => Math.floor(Math.floor(i / 9) / 3) * 3 + Math.floor((i % 9) / 3));
const SUDOKU_PEERS = Array.from({ length: 81 }, (_, i) => Array.from({ length: 81 }, (_, k) => k)
  .filter(k => k !== i && (Math.floor(k / 9) === Math.floor(i / 9) || k % 9 === i % 9 || SUDOKU_BOX[k] === SUDOKU_BOX[i])));
const SUDOKU_UNITS = [].concat(
  Array.from({ length: 9 }, (_, r) => Array.from({ length: 9 }, (_, c) => r * 9 + c)),
  Array.from({ length: 9 }, (_, c) => Array.from({ length: 9 }, (_, r) => r * 9 + c)),
  Array.from({ length: 9 }, (_, b) => Array.from({ length: 81 }, (_, k) => k).filter(k => SUDOKU_BOX[k] === b)));

/** How many solutions the grid has, counting no further than `limit`; `keep` receives the first solution found. */
function sudokuCount(grid, limit, keep) {
  const rows = new Array(9).fill(0), cols = new Array(9).fill(0), boxes = new Array(9).fill(0);
  const empty = [];
  for (let i = 0; i < 81; i++) {
    const v = grid[i];
    if (v) {
      const bit = 1 << v;
      rows[Math.floor(i / 9)] |= bit; cols[i % 9] |= bit; boxes[SUDOKU_BOX[i]] |= bit;
    } else empty.push(i);
  }
  let found = 0;
  const g = grid.slice();
  const solve = () => {
    // The empty cell with the fewest candidates first: it keeps the search small.
    let best = -1, bestMask = 0, bestCount = 10;
    for (const i of empty) {
      if (g[i]) continue;
      const mask = ~(rows[Math.floor(i / 9)] | cols[i % 9] | boxes[SUDOKU_BOX[i]]) & 0x3FE;
      let n = 0;
      for (let m = mask; m; m &= m - 1) n++;
      if (n < bestCount) { best = i; bestMask = mask; bestCount = n; if (n <= 1) break; }
    }
    if (best === -1) { found++; if (keep && found === 1) keep(g.slice()); return found >= limit; }
    if (!bestCount) return false;
    const r = Math.floor(best / 9), c = best % 9, b = SUDOKU_BOX[best];
    for (let v = 1; v <= 9; v++) {
      const bit = 1 << v;
      if (!(bestMask & bit)) continue;
      g[best] = v; rows[r] |= bit; cols[c] |= bit; boxes[b] |= bit;
      if (solve()) return true;
      g[best] = 0; rows[r] &= ~bit; cols[c] &= ~bit; boxes[b] &= ~bit;
    }
    return false;
  };
  solve();
  return found;
}

/** The solution of a puzzle (an array or an 81-char string), or null. */
function sudokuSolve(puzzle) {
  const grid = Array.from(puzzle, v => Number(v) || 0);
  let out = null;
  sudokuCount(grid, 1, (s) => { out = s; });
  return out;
}

/** A full valid grid, dealt from `rnd`. */
function sudokuFill(rnd) {
  const g = new Array(81).fill(0);
  const ok = (i, v) => {
    const r = Math.floor(i / 9), c = i % 9, b = SUDOKU_BOX[i];
    for (let k = 0; k < 81; k++) {
      if (g[k] === v && (Math.floor(k / 9) === r || k % 9 === c || SUDOKU_BOX[k] === b)) return false;
    }
    return true;
  };
  const fill = (i) => {
    if (i === 81) return true;
    for (const v of soloShuffle([1, 2, 3, 4, 5, 6, 7, 8, 9], rnd)) {
      if (!ok(i, v)) continue;
      g[i] = v;
      if (fill(i + 1)) return true;
      g[i] = 0;
    }
    return false;
  };
  fill(0);
  return g;
}

/**
 * Whether the two plainest steps alone finish the grid: a cell with one
 * possible number (naked single), or a number with one possible cell in its
 * row, column or box (hidden single).
 */
function sudokuSinglesSolve(grid) {
  const g = grid.slice();
  let progress = true;
  while (progress) {
    progress = false;
    const cand = new Array(81).fill(0);
    for (let i = 0; i < 81; i++) {
      if (g[i]) continue;
      let mask = 0x3FE;
      for (const k of SUDOKU_PEERS[i]) if (g[k]) mask &= ~(1 << g[k]);
      if (!mask) return false;
      if ((mask & (mask - 1)) === 0) { g[i] = 31 - Math.clz32(mask); progress = true; }
      else cand[i] = mask;
    }
    if (progress) continue;
    for (const unit of SUDOKU_UNITS) {
      for (let v = 1; v <= 9; v++) {
        const bit = 1 << v;
        let spot = -1, count = 0, placed = false;
        for (const i of unit) {
          if (g[i] === v) { placed = true; break; }
          if (!g[i] && (cand[i] & bit)) { spot = i; count++; }
        }
        if (!placed && count === 1) { g[spot] = v; progress = true; }
      }
    }
  }
  return g.every(Boolean);
}

/** { puzzle, solution } as arrays of 81, with exactly one solution; hard needs more than singles. */
function sudokuMake(level, rnd) {
  const tries = level === 'hard' ? 12 : 1;
  let made = null;
  for (let k = 0; k < tries; k++) {
    made = sudokuMakeOnce(level, rnd);
    if (level !== 'hard' || !sudokuSinglesSolve(made.puzzle)) return made;
  }
  return made;
}

function sudokuMakeOnce(level, rnd) {
  const solution = sudokuFill(rnd);
  const puzzle = solution.slice();
  const target = SUDOKU_GIVENS[level] || SUDOKU_GIVENS.easy;
  let givens = 81;
  for (const i of soloShuffle(Array.from({ length: 81 }, (_, k) => k), rnd)) {
    if (givens <= target) break;
    const keep = puzzle[i];
    puzzle[i] = 0;
    if (sudokuCount(puzzle, 2) === 1) givens--;
    else puzzle[i] = keep;
  }
  return { puzzle: puzzle, solution: solution };
}

/** The cells whose number is in their row, column or box twice (an 81-char string or an array): what a race marks red. */
function sudokuConflicts(cells) {
  const bad = new Set();
  const g = Array.from(cells, v => Number(v) || 0);
  for (const unit of SUDOKU_UNITS) {
    const at = {};
    unit.forEach(i => { if (g[i]) (at[g[i]] = at[g[i]] || []).push(i); });
    Object.keys(at).forEach(v => { if (at[v].length > 1) at[v].forEach(i => bad.add(i)); });
  }
  return bad;
}

/* --- سباق ألغاز: the race plug-in (RoomRace.js) --------------------------------------
   An easy grid (the owner: easy only) dealt once for every phone; the solution
   stays on the server. A phone plays its own grid and sends its cells after
   every change (`move { cells }`, the 81-char string): the server counts the
   cells filled for the table's bar and says won when they are the solution.
   ------------------------------------------------------------------------------ */
const SUDOKU_RACE_LEVEL = 'easy';
const SUDOKU_RACE = {
  deal(rnd) {
    const made = sudokuMake(SUDOKU_RACE_LEVEL, rnd);
    return { pub: { puzzle: made.puzzle.join('') }, solution: made.solution.join('') };
  },
  board: () => ({ cells: null }),
  total: (x) => Array.from(x.pub.puzzle).filter(ch => ch === '0').length,
  move(b, x, p) {
    const cells = String(p.cells || '');
    if (!/^[0-9]{81}$/.test(cells) || Array.from(x.pub.puzzle).some((ch, i) => ch !== '0' && cells[i] !== ch)) throw new Error('اللوحة مش مظبوطة');
    b.cells = cells;
    return cells === x.solution ? 'won' : '';
  },
  progress: (b, x) => ({ done: b.cells ? Array.from(b.cells).filter((ch, i) => ch !== '0' && x.pub.puzzle[i] === '0').length : 0 }),
  view: (b) => ({ cells: b.cells || null }),
  score: () => 0,
  reveal: () => null
};
