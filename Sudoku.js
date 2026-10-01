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
   stops at two) and its grade (sudokuGrade: the hardest technique a person
   needs) stays the level's: easy singles only, medium a pair or a pointing
   step, hard a triple, an X-wing or an XY-wing - never a guess.
   ========================================================================= */

const SUDOKU_GIVENS = { easy: 40, medium: 30, hard: 27 };

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
  return sudokuGrade(grid) === 1;
}

/* --- grading by technique (the review of 1 Oct 2026) ---------------------------------
   Medium used to play like easy (38 of 40 grids solved by singles alone) and hard could
   fall back to singles or need a guess. A grid is now graded the way a person solves
   it: always the plainest step that does something, and the grade is the hardest step
   the solve needed.
     1  naked and hidden singles only;
     2  also naked and hidden pairs, pointing and claiming (a number confined to one
        line of a box, or to one box of a line);
     3  also naked and hidden triples, X-wing, swordfish and the XY-wing;
     0  none of these finish it: it needs a guess, and is never dealt.
   ------------------------------------------------------------------------------------ */
const SUDOKU_ROW = Array.from({ length: 81 }, (_, i) => Math.floor(i / 9));
const SUDOKU_COL = Array.from({ length: 81 }, (_, i) => i % 9);
const SUDOKU_SEES = (() => {
  const m = new Uint8Array(81 * 81);
  SUDOKU_PEERS.forEach((ps, i) => ps.forEach(k => { m[i * 81 + k] = 1; }));
  return m;
})();
const sudokuBits = (m) => { let n = 0; for (; m; m &= m - 1) n++; return n; };
const sudokuLowBit = (m) => 31 - Math.clz32(m & -m);

/** The grade of a puzzle (an array or an 81-char string): 1, 2, 3, or 0 when it needs a guess. */
function sudokuGrade(grid) {
  const g = Array.from(grid, v => Number(v) || 0);
  const cand = new Array(81).fill(0);
  let left = 0;
  for (let i = 0; i < 81; i++) {
    if (g[i]) continue;
    let mask = 0x3FE;
    for (const k of SUDOKU_PEERS[i]) if (g[k]) mask &= ~(1 << g[k]);
    cand[i] = mask;
    left++;
  }
  const place = (i, v) => {
    g[i] = v; cand[i] = 0; left--;
    const bit = ~(1 << v);
    for (const k of SUDOKU_PEERS[i]) cand[k] &= bit;
  };
  // A step that takes candidates `mask` out of `cells` (but not out of `keep`): whether it changed anything.
  const strip = (cells, mask, keep) => {
    let changed = false;
    for (const k of cells) {
      if (g[k] || (keep && keep.indexOf(k) !== -1) || !(cand[k] & mask)) continue;
      cand[k] &= ~mask; changed = true;
    }
    return changed;
  };
  // A naked or hidden single placed: 1; nothing: 0; a dead end (no number fits somewhere): -1.
  const singles = () => {
    for (let i = 0; i < 81; i++) {
      if (g[i]) continue;
      if (!cand[i]) return -1;
      if ((cand[i] & (cand[i] - 1)) === 0) { place(i, sudokuLowBit(cand[i])); return 1; }
    }
    for (const unit of SUDOKU_UNITS) {
      let seen = 0, twice = 0, have = 0;
      for (const i of unit) {
        if (g[i]) { have |= 1 << g[i]; continue; }
        twice |= seen & cand[i]; seen |= cand[i];
      }
      if ((seen | have) !== 0x3FE) return -1;
      const once = seen & ~twice & ~have;
      if (once) {
        const v = sudokuLowBit(once), bit = 1 << v;
        for (const i of unit) if (!g[i] && (cand[i] & bit)) { place(i, v); return 1; }
      }
    }
    return 0;
  };
  // Pointing and claiming: a number's places in a box all on one line, or a line's all in one box.
  const intersections = () => {
    for (let b = 0; b < 9; b++) {
      const box = SUDOKU_UNITS[18 + b];
      for (let v = 1; v <= 9; v++) {
        const bit = 1 << v;
        const at = box.filter(i => !g[i] && (cand[i] & bit));
        if (at.length < 2) continue;
        if (at.every(i => SUDOKU_ROW[i] === SUDOKU_ROW[at[0]]) && strip(SUDOKU_UNITS[SUDOKU_ROW[at[0]]], bit, box)) return true;
        if (at.every(i => SUDOKU_COL[i] === SUDOKU_COL[at[0]]) && strip(SUDOKU_UNITS[9 + SUDOKU_COL[at[0]]], bit, box)) return true;
      }
    }
    for (let u = 0; u < 18; u++) {
      const line = SUDOKU_UNITS[u];
      for (let v = 1; v <= 9; v++) {
        const bit = 1 << v;
        const at = line.filter(i => !g[i] && (cand[i] & bit));
        if (at.length < 2 || !at.every(i => SUDOKU_BOX[i] === SUDOKU_BOX[at[0]])) continue;
        if (strip(SUDOKU_UNITS[18 + SUDOKU_BOX[at[0]]], bit, line)) return true;
      }
    }
    return false;
  };
  // Naked and hidden subsets of `size` cells in one unit (pairs, triples).
  const subsets = (size) => {
    for (const unit of SUDOKU_UNITS) {
      const open = unit.filter(i => !g[i]);
      if (open.length <= size) continue;
      // Naked: `size` cells whose candidates together are `size` numbers.
      const pick = (from, chosen, mask) => {
        if (chosen.length === size) return sudokuBits(mask) === size && strip(open, mask, chosen);
        for (let j = from; j < open.length; j++) {
          const m = mask | cand[open[j]];
          if (sudokuBits(m) > size) continue;
          if (pick(j + 1, chosen.concat(open[j]), m)) return true;
        }
        return false;
      };
      if (pick(0, [], 0)) return true;
      // Hidden: `size` numbers that fit only in the same `size` cells.
      const vals = [];
      for (let v = 1; v <= 9; v++) {
        const at = open.filter(i => cand[i] & (1 << v));
        if (at.length >= 2 && at.length <= size) vals.push({ bit: 1 << v, at: at });
      }
      const hide = (from, n, bits, cells) => {
        if (n === size) {
          let changed = false;
          cells.forEach(i => { if (cand[i] & ~bits) { cand[i] &= bits; changed = true; } });
          return changed;
        }
        for (let j = from; j < vals.length; j++) {
          const merged = cells.concat(vals[j].at.filter(i => cells.indexOf(i) === -1));
          if (merged.length > size) continue;
          if (hide(j + 1, n + 1, bits | vals[j].bit, merged)) return true;
        }
        return false;
      };
      if (hide(0, 0, 0, [])) return true;
    }
    return false;
  };
  // X-wing (2) and swordfish (3): a number's places in `size` rows all in `size` columns, or the other way.
  const fish = (size) => {
    for (let v = 1; v <= 9; v++) {
      const bit = 1 << v;
      for (const byRow of [true, false]) {
        const lines = [];
        for (let a = 0; a < 9; a++) {
          let spots = 0;
          for (let b = 0; b < 9; b++) {
            const i = byRow ? a * 9 + b : b * 9 + a;
            if (!g[i] && (cand[i] & bit)) spots |= 1 << b;
          }
          const n = sudokuBits(spots);
          if (n >= 2 && n <= size) lines.push({ a: a, spots: spots });
        }
        const go = (from, chosen, spots) => {
          if (chosen.length === size) {
            if (sudokuBits(spots) !== size) return false;
            let changed = false;
            for (let b = 0; b < 9; b++) {
              if (!(spots & (1 << b))) continue;
              for (let a = 0; a < 9; a++) {
                if (chosen.indexOf(a) !== -1) continue;
                const i = byRow ? a * 9 + b : b * 9 + a;
                if (!g[i] && (cand[i] & bit)) { cand[i] &= ~bit; changed = true; }
              }
            }
            return changed;
          }
          for (let j = from; j < lines.length; j++) {
            const m = spots | lines[j].spots;
            if (sudokuBits(m) > size) continue;
            if (go(j + 1, chosen.concat(lines[j].a), m)) return true;
          }
          return false;
        };
        if (go(0, [], 0)) return true;
      }
    }
    return false;
  };
  // XY-wing: a cell {a,b} that sees {a,c} and {b,c}: c leaves every cell that sees both of those.
  const xyWing = () => {
    const two = [];
    for (let i = 0; i < 81; i++) if (!g[i] && sudokuBits(cand[i]) === 2) two.push(i);
    for (const p of two) {
      const pm = cand[p];
      const wings = two.filter(k => k !== p && SUDOKU_SEES[p * 81 + k] && sudokuBits(cand[k] & pm) === 1);
      for (let x = 0; x < wings.length; x++) {
        for (let y = x + 1; y < wings.length; y++) {
          const A = cand[wings[x]], B = cand[wings[y]];
          if ((A & pm) === (B & pm)) continue;
          const c = A & B & ~pm;
          if (sudokuBits(c) !== 1) continue;
          let changed = false;
          for (let i = 0; i < 81; i++) {
            if (g[i] || i === wings[x] || i === wings[y] || !(cand[i] & c)) continue;
            if (SUDOKU_SEES[i * 81 + wings[x]] && SUDOKU_SEES[i * 81 + wings[y]]) { cand[i] &= ~c; changed = true; }
          }
          if (changed) return true;
        }
      }
    }
    return false;
  };
  let grade = 1;
  for (;;) {
    if (!left) return grade;
    const sg = singles();
    if (sg < 0) return 0;
    if (sg) continue;
    if (intersections() || subsets(2)) { grade = Math.max(grade, 2); continue; }
    if (subsets(3) || fish(2) || xyWing() || fish(3)) { grade = 3; continue; }
    return 0;
  }
}

/* --- making a grid --------------------------------------------------------------------
   A full grid at random, then numbers taken away in a random order: one goes only if
   the puzzle keeps exactly one solution and its grade stays at or under the level's.
   The grid is dealt once it has the level's grade and at most the level's numbers
   (easy 40, medium 30, hard 27; one that got there with fewer gets numbers back
   while its grade holds); a grid whose cells ran out first is made again from
   a new full grid (at most SUDOKU_TRIES times, then the closest one is dealt). Every
   draw is from `rnd`, so a daily or a race is the same grid on every phone.
   ------------------------------------------------------------------------------------ */
const SUDOKU_LEVEL_GRADE = { easy: 1, medium: 2, hard: 3 };
const SUDOKU_TRIES = 40;

/** { puzzle, solution, grade } as arrays of 81, with exactly one solution and the level's grade. */
function sudokuMake(level, rnd) {
  const want = SUDOKU_LEVEL_GRADE[level] || 1;
  let best = null;
  for (let k = 0; k < SUDOKU_TRIES; k++) {
    const made = sudokuMakeOnce(level, rnd);
    if (made.grade === want) return made;
    // Closest: the higher grade (never one that needs a guess: those are never kept).
    if (!best || made.grade > best.grade) best = made;
  }
  return best;
}

function sudokuMakeOnce(level, rnd) {
  const want = SUDOKU_LEVEL_GRADE[level] || 1;
  const solution = sudokuFill(rnd);
  const puzzle = solution.slice();
  const target = SUDOKU_GIVENS[level] || SUDOKU_GIVENS.easy;
  let givens = 81, grade = 1;
  const removed = [];
  for (const i of soloShuffle(Array.from({ length: 81 }, (_, k) => k), rnd)) {
    if (givens <= target && grade === want) break;
    const keep = puzzle[i];
    puzzle[i] = 0;
    // With more than 50 numbers left a unique grid is all singles: the grading starts below that.
    const gr = sudokuCount(puzzle, 2) !== 1 ? 0 : givens > 50 ? 1 : sudokuGrade(puzzle);
    if (gr && gr <= want) { givens--; grade = gr; removed.push(i); }
    else puzzle[i] = keep;
  }
  grade = sudokuGrade(puzzle);
  // The grade was reached under the level's numbers: numbers go back while the grade
  // holds, so a medium grid is a plain one with one harder step in it, not a sparse one.
  if (grade === want && givens < target) {
    for (const i of soloShuffle(removed, rnd)) {
      if (givens >= target) break;
      puzzle[i] = solution[i];
      if (sudokuGrade(puzzle) === want) givens++;
      else puzzle[i] = 0;
    }
  }
  return { puzzle: puzzle, solution: solution, grade: grade };
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
