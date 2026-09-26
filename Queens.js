/* ============================================================================
   الملكات — QUEENS: the puzzle's rules
   ----------------------------------------------------------------------------
   Moved out of JS_Queens.html for سباق ألغاز (26 Sep 2026): a race's board is
   dealt on the rooms server and the finished board judged there, so the
   generator and the judge live in a file both sides bundle (the page inlines
   it, SHARED_LISTS; the Worker bundles it, FILES in rooms-worker/build.mjs).
   No DOM, nothing that runs at load; every name starts with queens / QUEENS_.
   Draws with SoloShared.js (soloShuffle).

   A board is n × n cells split into n coloured regions: one 👑 in every row,
   every column and every region, and no two crowns touching, not even corner
   to corner. It is made here: a random placement of crowns that don't touch
   (queensPlace), one region grown from each crown at random (queensGrow),
   then a fix loop - while queensSolve finds a second solution, one of that
   solution's cells is handed to a neighbouring region - until exactly one
   solution is left. 6×6 easy, 7×7 medium, 8×8 hard.
   ========================================================================= */

const QUEENS_SIZES = { easy: 6, medium: 7, hard: 8 };

/** Columns for each row such that no two crowns share a column or touch. */
function queensPlace(n, rnd) {
  const cols = [];
  const used = new Set();
  const go = (r) => {
    if (r === n) return true;
    for (const c of soloShuffle(Array.from({ length: n }, (_, k) => k), rnd)) {
      if (used.has(c) || (r > 0 && Math.abs(cols[r - 1] - c) <= 1)) continue;
      cols[r] = c; used.add(c);
      if (go(r + 1)) return true;
      used.delete(c);
    }
    return false;
  };
  return go(0) ? cols.slice() : null;
}

/** One region per crown, grown at random until every cell belongs to one. */
function queensGrow(n, cols, rnd) {
  const regions = new Array(n * n).fill(-1);
  cols.forEach((c, r) => { regions[r * n + c] = r; });
  let left = n * n - n;
  while (left > 0) {
    const frontier = [];
    for (let i = 0; i < n * n; i++) {
      if (regions[i] !== -1) continue;
      const r = Math.floor(i / n), c = i % n;
      [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]].forEach(([rr, cc]) => {
        if (rr >= 0 && rr < n && cc >= 0 && cc < n && regions[rr * n + cc] !== -1) frontier.push([i, regions[rr * n + cc]]);
      });
    }
    const [cell, region] = frontier[Math.floor(rnd() * frontier.length)];
    regions[cell] = region;
    left--;
  }
  return regions;
}

/** Up to `limit` solutions, each as the column of the crown in every row. */
function queensSolve(n, regions, limit) {
  const found = [];
  const cols = [];
  const usedCol = new Array(n).fill(false);
  const usedReg = new Array(n).fill(false);
  const go = (r) => {
    if (r === n) { found.push(cols.slice()); return found.length >= limit; }
    for (let c = 0; c < n; c++) {
      const reg = regions[r * n + c];
      if (usedCol[c] || usedReg[reg] || (r > 0 && Math.abs(cols[r - 1] - c) <= 1)) continue;
      cols[r] = c; usedCol[c] = true; usedReg[reg] = true;
      if (go(r + 1)) return true;
      usedCol[c] = false; usedReg[reg] = false;
    }
    return false;
  };
  go(0);
  return found;
}

function queensConnected(n, regions, region, without) {
  const cells = [];
  for (let i = 0; i < n * n; i++) if (regions[i] === region && i !== without) cells.push(i);
  if (!cells.length) return false;
  const seen = new Set([cells[0]]);
  const stack = [cells[0]];
  while (stack.length) {
    const i = stack.pop();
    const r = Math.floor(i / n), c = i % n;
    [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]].forEach(([rr, cc]) => {
      const k = rr * n + cc;
      if (rr >= 0 && rr < n && cc >= 0 && cc < n && k !== without && regions[k] === region && !seen.has(k)) { seen.add(k); stack.push(k); }
    });
  }
  return seen.size === cells.length;
}

/** { n, regions, solution } with exactly one solution. */
function queensMake(level, rnd) {
  const n = QUEENS_SIZES[level] || 6;
  for (let attempt = 0; attempt < 300; attempt++) {
    const cols = queensPlace(n, rnd);
    if (!cols) continue;
    const regions = queensGrow(n, cols, rnd);
    for (let fix = 0; fix < 120; fix++) {
      const sols = queensSolve(n, regions, 2);
      if (sols.length === 1) return { n: n, regions: regions, solution: cols };
      const alt = sols.find(s => s.some((c, r) => c !== cols[r]));
      if (!alt) break;
      // Hand one of the other solution's crown cells to a neighbouring region.
      const rows = soloShuffle(Array.from({ length: n }, (_, r) => r).filter(r => alt[r] !== cols[r]), rnd);
      let moved = false;
      for (const r of rows) {
        const cell = r * n + alt[r];
        const from = regions[cell];
        const c = alt[r];
        const targets = soloShuffle([[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]]
          .filter(([rr, cc]) => rr >= 0 && rr < n && cc >= 0 && cc < n)
          .map(([rr, cc]) => regions[rr * n + cc]).filter(g => g !== from), rnd);
        if (!targets.length || !queensConnected(n, regions, from, cell)) continue;
        regions[cell] = targets[0];
        moved = true;
        break;
      }
      if (!moved) break;
    }
  }
  return null;
}

/** Crowns that break a rule on a board of marks (0 empty, 1 ✕, 2 👑): same row, column or region, or touching. */
function queensConflicts(n, regions, marks) {
  const crowns = [];
  marks.forEach((m, i) => { if (m === 2) crowns.push(i); });
  const bad = new Set();
  for (let a = 0; a < crowns.length; a++) for (let b = a + 1; b < crowns.length; b++) {
    const i = crowns[a], j = crowns[b];
    const ri = Math.floor(i / n), ci = i % n, rj = Math.floor(j / n), cj = j % n;
    if (ri === rj || ci === cj || regions[i] === regions[j] || (Math.abs(ri - rj) <= 1 && Math.abs(ci - cj) <= 1)) { bad.add(i); bad.add(j); }
  }
  return bad;
}

/** Whether the crowns on a board of marks are exactly the solution. */
function queensSolved(n, solution, marks) {
  return marks.filter(m => m === 2).length === n && solution.every((c, r) => marks[r * n + c] === 2);
}

/* --- سباق ألغاز: the race plug-in (RoomRace.js) --------------------------------------
   A 7×7 board (the daily's size) dealt once for every phone; the solution stays
   on the server. A phone plays its own board and sends its marks after every
   change (`move { marks }`): the server counts the crowns for the table's bar
   and says won when they are the solution. Nothing but a board's own marks
   ever reaches a phone.
   ------------------------------------------------------------------------------ */
const QUEENS_RACE_LEVEL = 'medium';
const QUEENS_RACE = {
  deal(rnd) {
    const made = queensMake(QUEENS_RACE_LEVEL, rnd) || queensMake('easy', rnd);
    return { pub: { n: made.n, regions: made.regions }, solution: made.solution };
  },
  board: () => ({ marks: null }),
  total: (x) => x.pub.n,
  move(b, x, p) {
    const n = x.pub.n;
    const marks = Array.isArray(p.marks) ? p.marks.map(m => (m === 1 || m === 2 ? m : 0)) : null;
    if (!marks || marks.length !== n * n) throw new Error('اللوحة مش مظبوطة');
    b.marks = marks;
    return queensSolved(n, x.solution, marks) ? 'won' : '';
  },
  progress: (b, x) => ({ done: Math.min(x.pub.n, (b.marks || []).filter(m => m === 2).length) }),
  view: (b) => ({ marks: b.marks || null }),
  score: () => 0,
  reveal: () => null
};
