/* ============================================================================
   نونوجرام — NONOGRAM: the puzzle's rules
   ----------------------------------------------------------------------------
   Moved out of JS_Nonogram.html for سباق ألغاز (26 Sep 2026): a race's board
   is dealt on the rooms server and the painted board judged there, so the
   pictures, the generator and the judge live in a file both sides bundle (the
   page inlines it, SHARED_LISTS; the Worker bundles it, FILES in
   rooms-worker/build.mjs; tools/validate-content.js checks the pictures
   here). No DOM, nothing that runs at load; every name starts with nono /
   NONO_. Draws with SoloShared.js (soloPick).

   The numbers beside each row and above each column are the runs of filled
   cells in that line, in order. A board is either one of NONO_PICTURES (drawn
   by hand) or random; either way it is only used if nonoSolvable can finish
   it line by line - so it has exactly one solution and never needs a guess.
   5×5 easy (random), 8×8 medium and 10×10 hard (pictures or random).
   ========================================================================= */

const NONO_PICTURES = {
  8: [
    { ar: 'قلب', en: 'Heart', e: '❤️', rows: ['.##..##.', '########', '########', '########', '.######.', '..####..', '...##...', '........'] },
    { ar: 'سهم', en: 'Arrow', e: '⬆️', rows: ['...##...', '..####..', '.######.', '########', '...##...', '...##...', '...##...', '...##...'] },
    { ar: 'جرس', en: 'Bell', e: '🔔', rows: ['...##...', '..####..', '.######.', '.######.', '.######.', '########', '########', '...##...'] },
    { ar: 'ألماسة', en: 'Diamond', e: '💎', rows: ['..####..', '.######.', '########', '.######.', '..####..', '...##...', '........', '........'] },
    { ar: 'عربية', en: 'Car', e: '🚗', rows: ['........', '..####..', '.#.##.#.', '########', '########', '.##..##.', '........', '........'] }
  ],
  10: [
    { ar: 'قلب', en: 'Heart', e: '❤️', rows: ['..........', '.##....##.', '####..####', '##########', '##########', '.########.', '..######..', '...####...', '....##....', '..........'] },
    { ar: 'بيت', en: 'House', e: '🏠', rows: ['....##....', '...####...', '..######..', '.########.', '##########', '.########.', '.##....##.', '.##.##.##.', '.##.##.##.', '.########.'] },
    { ar: 'قطة', en: 'Cat', e: '🐱', rows: ['#........#', '##......##', '###....###', '##########', '#.##..##.#', '##########', '####..####', '###.##.###', '.########.', '..######..'] },
    { ar: 'شجرة', en: 'Tree', e: '🌲', rows: ['....##....', '...####...', '..######..', '.########.', '##########', '..######..', '.########.', '##########', '....##....', '....##....'] },
    { ar: 'نجمة', en: 'Star', e: '⭐', rows: ['....##....', '....##....', '...####...', '##########', '.########.', '..######..', '..######..', '.###..###.', '.##....##.', '##......##'] },
    { ar: 'سمكة', en: 'Fish', e: '🐟', rows: ['..........', '....###...', '#..#####..', '##########', '####.#####', '##########', '#..#####..', '....###...', '..........', '..........'] },
    { ar: 'شمسية', en: 'Umbrella', e: '☂️', rows: ['....##....', '..######..', '.########.', '##########', '#.#.##.#.#', '....##....', '....##....', '....##....', '.#..##....', '..###.....'] },
    { ar: 'مركب', en: 'Boat', e: '⛵', rows: ['....#.....', '....##....', '....###...', '....####..', '....#####.', '....#.....', '##########', '.########.', '..######..', '..........'] },
    { ar: 'مشروم', en: 'Mushroom', e: '🍄', rows: ['...####...', '.########.', '##..##..##', '##..##..##', '##########', '.########.', '...#..#...', '...#..#...', '...####...', '..........'] },
    { ar: 'تفاحة', en: 'Apple', e: '🍎', rows: ['.....#....', '....#.....', '.###.###..', '##########', '##########', '##########', '##########', '.########.', '..######..', '...#..#...'] },
    { ar: 'تاج', en: 'Crown', e: '👑', rows: ['..........', '#...##...#', '##..##..##', '###.##.###', '##########', '##########', '##########', '#.#.##.#.#', '##########', '..........'] }
  ]
};
const NONO_SIZES = { easy: 5, medium: 8, hard: 10 };

function nonoRuns(line) {
  const runs = [];
  let run = 0;
  line.forEach(v => { if (v === 1) run++; else if (run) { runs.push(run); run = 0; } });
  if (run) runs.push(run);
  return runs;
}

/**
 * Everything one line can tell: cells (-1 unknown, 1 filled, 0 empty) against
 * its clue. Returns the line with every cell that all placements agree on,
 * or null when no placement fits.
 */
function nonoLineSolve(clue, cells) {
  const L = cells.length;
  const agree = new Array(L).fill(null);
  const line = new Array(L).fill(0);
  let any = false;
  const place = (k, start) => {
    if (k === clue.length) {
      for (let i = start; i < L; i++) if (cells[i] === 1) return;
      any = true;
      for (let i = 0; i < L; i++) agree[i] = agree[i] === null ? line[i] : (agree[i] === line[i] ? line[i] : -1);
      return;
    }
    const len = clue[k];
    let rest = 0;
    for (let j = k + 1; j < clue.length; j++) rest += clue[j] + 1;
    for (let p = start; p + len + rest <= L; p++) {
      if (p > start && cells[p - 1] === 1) break;        // a filled cell can't be left out
      let fits = true;
      for (let i = p; i < p + len; i++) if (cells[i] === 0) { fits = false; break; }
      if (!fits || (p + len < L && cells[p + len] === 1)) continue;
      for (let i = p; i < p + len; i++) line[i] = 1;
      place(k + 1, p + len + 1);
      for (let i = p; i < p + len; i++) line[i] = 0;
    }
  };
  place(0, 0);
  return any ? agree : null;
}

/** The grid the clues alone finish, line by line (one solution, no guessing), or null. */
function nonoSolveLines(n, rowClues, colClues) {
  const g = new Array(n * n).fill(-1);
  let changed = true;
  while (changed) {
    changed = false;
    for (let r = 0; r < n; r++) {
      const line = g.slice(r * n, r * n + n);
      const res = nonoLineSolve(rowClues[r], line);
      if (!res) return null;
      res.forEach((v, c) => { if (v !== -1 && g[r * n + c] === -1) { g[r * n + c] = v; changed = true; } });
    }
    for (let c = 0; c < n; c++) {
      const line = Array.from({ length: n }, (_, r) => g[r * n + c]);
      const res = nonoLineSolve(colClues[c], line);
      if (!res) return null;
      res.forEach((v, r) => { if (v !== -1 && g[r * n + c] === -1) { g[r * n + c] = v; changed = true; } });
    }
  }
  return g.every(v => v !== -1) ? g : null;
}

/** Whether the clues alone finish the grid, line by line. */
function nonoSolvable(n, rowClues, colClues) {
  return !!nonoSolveLines(n, rowClues, colClues);
}

function nonoClues(n, sol) {
  const rows = Array.from({ length: n }, (_, r) => nonoRuns(sol.slice(r * n, r * n + n)));
  const cols = Array.from({ length: n }, (_, c) => nonoRuns(Array.from({ length: n }, (_, r) => sol[r * n + c])));
  return { rows: rows, cols: cols };
}

function nonoFromPicture(pic) {
  return pic.rows.join('').split('').map(ch => (ch === '#' ? 1 : 0));
}

function nonoSolvablePictures(n) {
  return (NONO_PICTURES[n] || []).filter(p => {
    const sol = nonoFromPicture(p);
    const cl = nonoClues(n, sol);
    return nonoSolvable(n, cl.rows, cl.cols);
  });
}

/** { n, solution, pic } for a level. `pic` (a picture chosen by the caller) is used instead of a random draw. */
function nonoMake(level, rnd, pic) {
  const n = NONO_SIZES[level] || 5;
  const pics = nonoSolvablePictures(n);
  if (pics.length && (pic || rnd() < 0.5)) {
    const p = pic || soloPick(pics, rnd);
    return { n: n, solution: nonoFromPicture(p), pic: { ar: p.ar, en: p.en, e: p.e } };
  }
  for (let attempt = 0; attempt < 400; attempt++) {
    const sol = Array.from({ length: n * n }, () => (rnd() < 0.58 ? 1 : 0));
    const cl = nonoClues(n, sol);
    if (cl.rows.some(x => !x.length) || cl.cols.some(x => !x.length)) continue;
    if (nonoSolvable(n, cl.rows, cl.cols)) return { n: n, solution: sol, pic: null };
  }
  return null;
}

/* --- سباق ألغاز: the race plug-in (RoomRace.js) --------------------------------------
   A medium board (8×8, a picture or random) dealt once for every phone with
   its clues only - never the picture's name, which would give it away; the
   solution stays on the server. A phone paints its own board and sends its
   cells after every drag (`move { cells }`): the server counts the cells
   painted for the table's bar and says won when the painted cells are the
   picture. The picture's name and emoji are the reveal at the end.
   ------------------------------------------------------------------------------ */
const NONO_RACE_LEVEL = 'medium';
const NONO_RACE = {
  deal(rnd) {
    // The generator can come back empty: try again, then a drawn picture (always solvable), never deal nothing.
    let made = null;
    for (let i = 0; !made && i < 5; i++) made = nonoMake(NONO_RACE_LEVEL, rnd);
    if (!made) {
      const pics = nonoSolvablePictures(NONO_SIZES[NONO_RACE_LEVEL] || 5);
      if (pics.length) made = nonoMake(NONO_RACE_LEVEL, rnd, soloPick(pics, rnd));
    }
    if (!made) throw new Error('ماعرفناش نجهّز اللوحة، جرّبوا تاني');
    return { pub: { n: made.n, clues: nonoClues(made.n, made.solution) }, solution: made.solution, pic: made.pic };
  },
  board: () => ({ cells: null }),
  total: (x) => x.solution.filter(Boolean).length,
  move(b, x, p) {
    const n = x.pub.n;
    const cells = Array.isArray(p.cells) ? p.cells.map(v => (v === 1 || v === 2 ? v : 0)) : null;
    if (!cells || cells.length !== n * n) throw new Error('اللوحة مش مظبوطة');
    b.cells = cells;
    return cells.every((v, i) => (v === 1 ? 1 : 0) === x.solution[i]) ? 'won' : '';
  },
  progress: (b, x) => ({ done: Math.min(x.solution.filter(Boolean).length, (b.cells || []).filter(v => v === 1).length) }),
  view: (b) => ({ cells: b.cells || null }),
  score: () => 0,
  reveal: (x) => (x.pic ? { pic: x.pic } : null)
};
