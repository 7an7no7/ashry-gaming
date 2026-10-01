/* ============================================================================
   شمس وقمر — TANGO: the puzzle's rules
   ----------------------------------------------------------------------------
   Moved out of JS_Tango.html for سباق ألغاز (26 Sep 2026): a race's grid is
   dealt on the rooms server and the finished grid judged there, so the
   generator and the judge live in a file both sides bundle (the page inlines
   it, SHARED_LISTS; the Worker bundles it, FILES in rooms-worker/build.mjs).
   No DOM, nothing that runs at load; every name starts with tango / TANGO_.
   Draws with SoloShared.js (soloShuffle).

   A 6×6 grid of ☀️ (1) and 🌙 (2): every row and column holds three of each,
   never three of the same side by side, and the signs between cells hold (=
   the same, × different). Made here: a full valid grid at random
   (tangoFill), then clues - given cells and signs - added in a random order
   until tangoDeduce can finish it by reasoning alone (no guess), and taken
   away again while it still can; the level is how much reasoning it takes.
   ========================================================================= */

const TANGO_N = 6;

/** Whether value v fits at i with the rows and columns filled so far (0 empty, 1 sun, 2 moon). */
function tangoFits(g, i, v) {
  const N = TANGO_N;
  const r = Math.floor(i / N), c = i % N;
  let rowCount = 0, colCount = 0;
  for (let k = 0; k < N; k++) {
    if (g[r * N + k] === v) rowCount++;
    if (g[k * N + c] === v) colCount++;
  }
  if (g[i] !== v) { rowCount++; colCount++; }
  if (rowCount > N / 2 || colCount > N / 2) return false;
  const at = (rr, cc) => (rr === r && cc === c) ? v : g[rr * N + cc];
  for (let k = Math.max(0, c - 2); k <= Math.min(N - 3, c); k++) {
    if (at(r, k) === v && at(r, k + 1) === v && at(r, k + 2) === v) return false;
  }
  for (let k = Math.max(0, r - 2); k <= Math.min(N - 3, r); k++) {
    if (at(k, c) === v && at(k + 1, c) === v && at(k + 2, c) === v) return false;
  }
  return true;
}

function tangoFill(rnd) {
  const g = new Array(TANGO_N * TANGO_N).fill(0);
  const go = (i) => {
    if (i === g.length) return true;
    for (const v of soloShuffle([1, 2], rnd)) {
      if (!tangoFits(g, i, v)) continue;
      g[i] = v;
      if (go(i + 1)) return true;
      g[i] = 0;
    }
    return false;
  };
  go(0);
  return g;
}

/** How many solutions (up to limit) given cells and signs [{ a, b, same }]. */
function tangoCount(givens, signs, limit) {
  const g = givens.slice();
  const bySign = {};
  signs.forEach(s => { (bySign[s.a] = bySign[s.a] || []).push(s); (bySign[s.b] = bySign[s.b] || []).push(s); });
  let found = 0;
  const signOk = (i) => (bySign[i] || []).every(s => {
    const x = g[s.a], y = g[s.b];
    return !x || !y || (s.same ? x === y : x !== y);
  });
  const go = (i) => {
    if (i === g.length) { found++; return found >= limit; }
    if (givens[i]) return signOk(i) && go(i + 1);
    for (const v of [1, 2]) {
      if (!tangoFits(g, i, v)) continue;
      g[i] = v;
      if (signOk(i) && go(i + 1)) return true;
      g[i] = 0;
    }
    return false;
  };
  // Given cells must themselves be consistent.
  for (let i = 0; i < g.length; i++) if (g[i]) { const v = g[i]; g[i] = 0; const ok = tangoFits(g, i, v); g[i] = v; if (!ok) return 0; }
  go(0);
  return found;
}

/* --- solving by deduction (the review of 1 Oct 2026) ----------------------------------
   About one board in five (two in five of the hard ones) had exactly one solution but
   could only be finished by trying a cell and seeing it fail. A board is now dealt only
   when it can be finished by what a person reasons, and its level is how much of the
   deeper reasoning it needs:
     the rules, cell by cell: a sign with one side known gives the other; two alike side
       by side (or with a gap between them) give the other side to the cells next to
       them; a line with three of a kind has the other kind in its other cells;
     a whole line at once: of the ways a line can still be filled (three of each, no
       three alike in a row, its own signs), a cell that is the same in all of them is
       known - "if this were a sun, the line would need four moons".
   Signs between two lines carry what one line learns into the other.
   ------------------------------------------------------------------------------------ */
const TANGO_LINES = (() => {
  const out = [];
  for (let m = 0; m < 64; m++) {
    const v = Array.from({ length: 6 }, (_, k) => ((m >> k) & 1) + 1);
    if (v.filter(x => x === 1).length !== 3) continue;
    let ok = true;
    for (let k = 0; k + 2 < 6; k++) if (v[k] === v[k + 1] && v[k] === v[k + 2]) ok = false;
    if (ok) out.push(v);
  }
  return out;
})();
const TANGO_UNITS = [].concat(
  Array.from({ length: TANGO_N }, (_, r) => Array.from({ length: TANGO_N }, (_, c) => r * TANGO_N + c)),
  Array.from({ length: TANGO_N }, (_, c) => Array.from({ length: TANGO_N }, (_, r) => r * TANGO_N + c)));

/**
 * The board worked out the way a person would: { solved, lines (how many times a whole
 * line had to be reasoned at once), cells }. `lineSteps: false` allows the cell rules only.
 */
function tangoDeduce(givens, signs, opts) {
  const o = opts || {};
  const g = givens.slice();
  const bySign = {};
  signs.forEach(s => { (bySign[s.a] = bySign[s.a] || []).push(s); (bySign[s.b] = bySign[s.b] || []).push(s); });
  let lines = 0, left = g.filter(v => !v).length;
  const set = (i, v) => { g[i] = v; left--; };
  const cellRules = () => {
    let moved = false;
    signs.forEach(s => {
      const x = g[s.a], y = g[s.b];
      if (x && !y) { set(s.b, s.same ? x : 3 - x); moved = true; }
      else if (y && !x) { set(s.a, s.same ? y : 3 - y); moved = true; }
    });
    for (const unit of TANGO_UNITS) {
      for (const v of [1, 2]) {
        if (unit.filter(i => g[i] === v).length === TANGO_N / 2) unit.forEach(i => { if (!g[i]) { set(i, 3 - v); moved = true; } });
      }
      for (let k = 0; k + 2 < TANGO_N; k++) {
        const a = unit[k], b = unit[k + 1], c = unit[k + 2];
        if (g[a] && g[a] === g[b] && !g[c]) { set(c, 3 - g[a]); moved = true; }
        if (g[b] && g[b] === g[c] && !g[a]) { set(a, 3 - g[b]); moved = true; }
        if (g[a] && g[a] === g[c] && !g[b]) { set(b, 3 - g[a]); moved = true; }
      }
    }
    return moved;
  };
  const lineStep = () => {
    for (const unit of TANGO_UNITS) {
      if (unit.every(i => g[i])) continue;
      const inLine = new Set(unit);
      const own = [];
      unit.forEach((i, k) => (bySign[i] || []).forEach(s => {
        if (s.a === i && inLine.has(s.b)) own.push({ a: k, b: unit.indexOf(s.b), same: s.same });
      }));
      const fits = TANGO_LINES.filter(p => unit.every((i, k) => !g[i] || g[i] === p[k]) && own.every(s => (p[s.a] === p[s.b]) === s.same));
      if (!fits.length) return false;
      let moved = false;
      unit.forEach((i, k) => {
        if (!g[i] && fits.every(p => p[k] === fits[0][k])) { set(i, fits[0][k]); moved = true; }
      });
      if (moved) { lines++; return true; }
    }
    return false;
  };
  for (;;) {
    while (left && cellRules()) { /* the cell rules as far as they go */ }
    if (!left) break;
    if (o.lineSteps === false || !lineStep()) break;
  }
  return { solved: !left, lines: lines, cells: g };
}

/* --- making a board -------------------------------------------------------------------
   A full grid at random, then clues (given cells and signs) added in a random order
   until tangoDeduce finishes it, and taken away again while it still does: every clue
   left is needed, and nothing needs a guess. The level is how much reasoning that
   leaves (TANGO_LEVELS): hard keeps the fewest clues and needs a whole line reasoned
   at once at least three times; medium needs it once or twice (given cells handed
   back until it does); easy is finished by the cell rules alone, with a few given
   cells more. A board that can't be brought to its level is made again (at most
   TANGO_TRIES times, then the closest one is dealt). Every draw is from `rnd`, so a
   daily or a race is the same board on every phone.
   ------------------------------------------------------------------------------------ */
const TANGO_LEVELS = {
  easy:   { min: 0, max: 0, extra: 2 },
  medium: { min: 1, max: 2, extra: 0 },
  hard:   { min: 3, max: 99, extra: 0 }
};
const TANGO_TRIES = 30;

function tangoMake(level, rnd) {
  const L = TANGO_LEVELS[level] || TANGO_LEVELS.medium;
  let best = null;
  for (let k = 0; k < TANGO_TRIES; k++) {
    const made = tangoMakeOnce(L, rnd);
    if (made.lines >= L.min && made.lines <= L.max) return made;
    const miss = made.lines < L.min ? L.min - made.lines : made.lines - L.max;
    if (!best || miss < best.miss) best = Object.assign(made, { miss: miss });
  }
  delete best.miss;
  return best;
}

function tangoMakeOnce(L, rnd) {
  const N = TANGO_N;
  const solution = tangoFill(rnd);
  const pool = [];
  for (let i = 0; i < N * N; i++) {
    pool.push({ kind: 'cell', i: i });
    if (i % N < N - 1) pool.push({ kind: 'sign', a: i, b: i + 1 });
    if (i + N < N * N) pool.push({ kind: 'sign', a: i, b: i + N });
  }
  const build = (list) => {
    const givens = new Array(N * N).fill(0);
    const signs = [];
    list.forEach(cl => {
      if (cl.kind === 'cell') givens[cl.i] = solution[cl.i];
      else signs.push({ a: cl.a, b: cl.b, same: solution[cl.a] === solution[cl.b] });
    });
    return { givens: givens, signs: signs };
  };
  const solve = (list, opts) => { const b = build(list); return tangoDeduce(b.givens, b.signs, opts); };
  const chosen = [];
  for (const clue of soloShuffle(pool, rnd)) {
    chosen.push(clue);
    if (solve(chosen).solved) break;
  }
  // Take clues away again while it can still be worked out.
  const removed = [];
  for (const clue of soloShuffle(chosen.slice(), rnd)) {
    const without = chosen.filter(x => x !== clue);
    if (solve(without).solved) { chosen.splice(chosen.indexOf(clue), 1); removed.push(clue); }
  }
  let res = solve(chosen);
  // Too deep for the level: given cells back (the ones taken away first, then any) until it isn't.
  const given = new Set(chosen.filter(x => x.kind === 'cell').map(x => x.i));
  const back = removed.filter(x => x.kind === 'cell').concat(soloShuffle(solution.map((_, i) => i).filter(i => !given.has(i)), rnd).map(i => ({ kind: 'cell', i: i })))
    .filter((x, k, all) => all.findIndex(y => y.i === x.i) === k);
  while (res.lines > L.max && back.length) {
    chosen.push(back.shift());
    res = solve(chosen);
  }
  // Easy: a few given cells more than it needs.
  for (let k = 0; k < L.extra && back.length; k++) chosen.push(back.shift());
  if (L.extra) res = solve(chosen);
  const b = build(chosen);
  return { solution: solution, givens: b.givens, signs: b.signs, lines: res.lines };
}

/** Cells breaking a rule right now: a row or column over three of a kind, three in a row, a sign. */
function tangoProblems(cells, signs) {
  const N = TANGO_N;
  const g = cells;
  const bad = new Set();
  for (let k = 0; k < N; k++) {
    [1, 2].forEach(v => {
      const row = [], col = [];
      for (let j = 0; j < N; j++) { if (g[k * N + j] === v) row.push(k * N + j); if (g[j * N + k] === v) col.push(j * N + k); }
      if (row.length > N / 2) row.forEach(i => bad.add(i));
      if (col.length > N / 2) col.forEach(i => bad.add(i));
    });
    for (let j = 0; j <= N - 3; j++) {
      const a = k * N + j;
      if (g[a] && g[a] === g[a + 1] && g[a] === g[a + 2]) [a, a + 1, a + 2].forEach(i => bad.add(i));
      const b = j * N + k;
      if (g[b] && g[b] === g[b + N] && g[b] === g[b + 2 * N]) [b, b + N, b + 2 * N].forEach(i => bad.add(i));
    }
  }
  signs.forEach(x => {
    if (g[x.a] && g[x.b] && (x.same ? g[x.a] !== g[x.b] : g[x.a] === g[x.b])) { bad.add(x.a); bad.add(x.b); }
  });
  return bad;
}

/* --- سباق ألغاز: the race plug-in (RoomRace.js) --------------------------------------
   A medium grid (the daily's level) dealt once for every phone; the solution
   stays on the server. A phone plays its own grid and sends its cells after
   every change (`move { cells }`): the server counts the cells filled for the
   table's bar and says won when they are the solution.
   ------------------------------------------------------------------------------ */
const TANGO_RACE_LEVEL = 'medium';
const TANGO_RACE = {
  deal(rnd) {
    const made = tangoMake(TANGO_RACE_LEVEL, rnd);
    return { pub: { givens: made.givens, signs: made.signs }, solution: made.solution };
  },
  board: () => ({ cells: null }),
  total: (x) => x.pub.givens.filter(v => !v).length,
  move(b, x, p) {
    const n = TANGO_N * TANGO_N;
    const cells = Array.isArray(p.cells) ? p.cells.map(v => (v === 1 || v === 2 ? v : 0)) : null;
    if (!cells || cells.length !== n || x.pub.givens.some((g, i) => g && cells[i] !== g)) throw new Error('اللوحة مش مظبوطة');
    b.cells = cells;
    return cells.every((v, i) => v === x.solution[i]) ? 'won' : '';
  },
  progress: (b, x) => ({ done: (b.cells || []).filter((v, i) => v && !x.pub.givens[i]).length }),
  view: (b) => ({ cells: b.cells || null }),
  score: () => 0,
  reveal: () => null
};
