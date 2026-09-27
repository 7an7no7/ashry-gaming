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
   until tangoCount finds exactly one solution, and taken away again while it
   still does. Easy keeps some of the removed givens back; hard stays minimal.
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

function tangoMake(level, rnd) {
  const N = TANGO_N;
  const solution = tangoFill(rnd);
  const pool = [];
  for (let i = 0; i < N * N; i++) {
    pool.push({ kind: 'cell', i: i });
    if (i % N < N - 1) pool.push({ kind: 'sign', a: i, b: i + 1 });
    if (i + N < N * N) pool.push({ kind: 'sign', a: i, b: i + N });
  }
  const chosen = [];
  const build = (list) => {
    const givens = new Array(N * N).fill(0);
    const signs = [];
    list.forEach(cl => {
      if (cl.kind === 'cell') givens[cl.i] = solution[cl.i];
      else signs.push({ a: cl.a, b: cl.b, same: solution[cl.a] === solution[cl.b] });
    });
    return { givens: givens, signs: signs };
  };
  for (const clue of soloShuffle(pool, rnd)) {
    chosen.push(clue);
    const b = build(chosen);
    if (tangoCount(b.givens, b.signs, 2) === 1) break;
  }
  // Take clues away again while the solution stays the only one.
  const removed = [];
  for (const clue of soloShuffle(chosen.slice(), rnd)) {
    const without = chosen.filter(x => x !== clue);
    const b = build(without);
    if (tangoCount(b.givens, b.signs, 2) === 1) { chosen.splice(chosen.indexOf(clue), 1); removed.push(clue); }
  }
  // Easy gets a few of the removed given cells back.
  if (level !== 'hard') {
    const extra = removed.filter(x => x.kind === 'cell').slice(0, level === 'easy' ? 5 : 2);
    extra.forEach(x => chosen.push(x));
  }
  const b = build(chosen);
  return { solution: solution, givens: b.givens, signs: b.signs };
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
