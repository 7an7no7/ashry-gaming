/* ============================================================================
   كاسحة الألغام — MINESWEEPER: the field's rules
   ----------------------------------------------------------------------------
   Moved out of JS_Mines.html for سباق ألغاز (26 Sep 2026): a race's mines are
   laid on the rooms server and every cell opened there (the mines are the
   whole secret), so the field's rules live in a file both sides bundle (the
   page inlines it, SHARED_LISTS; the Worker bundles it, FILES in
   rooms-worker/build.mjs). No DOM, nothing that runs at load; every name
   starts with mines / MINES_. Draws with SoloShared.js (soloShuffle).

   A field is { cols, rows, count, mines: [cells], open: [0|1], flags: [0|1] }.
   The mines are laid after the first tap, away from it and its neighbours,
   so the first tap is always safe, and laid so that the field can be cleared
   from there without a guess (minesSolvable); opening a zero opens
   everything round it.
   ========================================================================= */

const MINES_LEVELS = {
  easy:   { cols: 8, rows: 9, mines: 10 },
  medium: { cols: 9, rows: 13, mines: 22 },
  hard:   { cols: 9, rows: 16, mines: 34 }
};

function minesNeighbours(s, i) {
  const r = Math.floor(i / s.cols), c = i % s.cols, out = [];
  for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
    if (!dr && !dc) continue;
    const rr = r + dr, cc = c + dc;
    if (rr >= 0 && rr < s.rows && cc >= 0 && cc < s.cols) out.push(rr * s.cols + cc);
  }
  return out;
}

/* --- no guessing (the review of 1 Oct 2026) -------------------------------------------
   Mines laid at random could leave the daily and the race on a pure 50/50 at the end.
   Mines are laid again until minesSolvable clears the whole field from the safe cell
   by reasoning alone, the way a player does: a number whose mines are all found makes
   its other neighbours safe; a number with as many hidden neighbours as mines left
   makes them all mines; one number's hidden neighbours inside another's tell what is in
   the rest (the 1-2 at a wall); and the count of mines left, at the end. At most
   MINES_TRIES layings; after that the one that got furthest is kept. Every draw is from
   `rnd`, so a daily and a race lay the same field on every phone.
   ------------------------------------------------------------------------------------ */
const MINES_TRIES = 400;

/** Lays the mines anywhere but `safe` and its neighbours, so that the field never needs a guess. */
function minesLay(s, safe, rnd) {
  const keepClear = new Set([safe].concat(minesNeighbours(s, safe)));
  const cells = [];
  for (let i = 0; i < s.cols * s.rows; i++) if (!keepClear.has(i)) cells.push(i);
  let best = null, bestLeft = Infinity;
  for (let k = 0; k < MINES_TRIES; k++) {
    const mines = soloShuffle(cells, rnd).slice(0, s.count).sort((a, b) => a - b);
    const left = minesSolvable({ cols: s.cols, rows: s.rows, count: s.count, mines: mines }, safe);
    if (!left) { s.mines = mines; return; }
    if (left < bestLeft) { best = mines; bestLeft = left; }
  }
  s.mines = best;
}

/**
 * How many safe cells are still closed when reasoning from `safe` gets stuck: 0 means
 * the field can be cleared without a guess.
 */
function minesSolvable(f, safe) {
  const n = f.cols * f.rows;
  const isMine = new Uint8Array(n);
  f.mines.forEach(i => { isMine[i] = 1; });
  const nb = [];
  const num = new Int8Array(n);
  for (let i = 0; i < n; i++) {
    nb.push(minesNeighbours(f, i));
    num[i] = nb[i].reduce((c, k) => c + isMine[k], 0);
  }
  const open = new Uint8Array(n), flag = new Uint8Array(n);
  let opened = 0, flagged = 0;
  const reveal = (start) => {
    const queue = [start];
    while (queue.length) {
      const i = queue.pop();
      if (open[i]) continue;
      open[i] = 1; opened++;
      if (!num[i]) nb[i].forEach(k => { if (!open[k]) queue.push(k); });
    }
  };
  reveal(safe);
  const safeTotal = n - f.mines.length;
  // A number's hidden neighbours and the mines still among them.
  const constraint = (i) => {
    const hidden = [];
    let m = num[i];
    nb[i].forEach(k => { if (flag[k]) m--; else if (!open[k]) hidden.push(k); });
    return { hidden: hidden, m: m };
  };
  for (;;) {
    if (opened === safeTotal) return 0;
    let moved = false;
    const cons = [];
    for (let i = 0; i < n; i++) {
      if (!open[i] || !num[i]) continue;
      const c = constraint(i);
      if (!c.hidden.length) continue;
      if (c.m === 0) { c.hidden.forEach(k => reveal(k)); moved = true; }
      else if (c.m === c.hidden.length) { c.hidden.forEach(k => { if (!flag[k]) { flag[k] = 1; flagged++; } }); moved = true; }
      else cons.push(c);
    }
    if (moved) continue;
    // Two numbers that share hidden cells: A has at least A.m - |A only| mines in the
    // shared cells, so B has at most B.m minus that in its own; when that is 0, B's own
    // cells are safe, and when A's own cells must hold all A has left, they are mines
    // (the 1-2 at a wall, the 1-2-1).
    for (let a = 0; a < cons.length && !moved; a++) {
      const A = cons[a];
      for (let b = 0; b < cons.length && !moved; b++) {
        if (a === b) continue;
        const B = cons[b];
        const shared = A.hidden.filter(k => B.hidden.indexOf(k) !== -1).length;
        if (!shared) continue;
        const onlyA = A.hidden.filter(k => B.hidden.indexOf(k) === -1);
        const onlyB = B.hidden.filter(k => A.hidden.indexOf(k) === -1);
        const inShared = A.m - onlyA.length;                // at least this many of A's mines are shared
        if (onlyB.length && inShared > 0 && B.m - inShared === 0) { onlyB.forEach(k => reveal(k)); moved = true; }
        else if (onlyA.length && A.m - Math.min(B.m, shared) === onlyA.length) { onlyA.forEach(k => { if (!flag[k]) { flag[k] = 1; flagged++; } }); moved = true; }
      }
    }
    if (moved) continue;
    // The count of mines left: all found, or as many as the closed cells.
    const closed = [];
    for (let i = 0; i < n; i++) if (!open[i] && !flag[i]) closed.push(i);
    const minesLeft = f.mines.length - flagged;
    if (minesLeft === 0) { closed.forEach(k => reveal(k)); continue; }
    if (minesLeft === closed.length) return 0;
    return safeTotal - opened;
  }
}

function minesCount(s, i) {
  const set = new Set(s.mines);
  return minesNeighbours(s, i).filter(k => set.has(k)).length;
}

/** Opens a cell and, from a zero, everything connected to it. Returns the cells opened, in order. */
function minesFlood(s, start) {
  const mines = new Set(s.mines);
  const order = [];
  const queue = [start];
  while (queue.length) {
    const i = queue.shift();
    if (s.open[i] || (s.flags && s.flags[i])) continue;
    s.open[i] = 1;
    order.push(i);
    if (mines.has(i)) continue;
    if (minesCount(s, i) === 0) minesNeighbours(s, i).forEach(k => { if (!s.open[k]) queue.push(k); });
  }
  return order;
}

/* --- سباق ألغاز: the race plug-in (RoomRace.js) --------------------------------------
   The medium field (9×13, 22 mines) laid once for every phone round a safe
   cell drawn at random, whose patch is opened at the deal (the owner: the
   first tap's safe cell is part of the deal). The mines stay on the server:
   a phone sends the cells it taps (`move { cells }` - one cell, or the
   unflagged neighbours of a number whose flags are all down; the flags stay on
   the phone) and gets back what opened with each cell's number. A mine puts
   the board out of the round with 0 (the solo game's loss), and that phone
   alone is then shown the mine it hit - the whole field only once the round is
   over, since the others are still racing on it. Every safe cell open wins.
   ------------------------------------------------------------------------------ */
const MINES_RACE_LEVEL = 'medium';
const minesField = (x) => ({ cols: x.pub.cols, rows: x.pub.rows, count: x.pub.count, mines: x.mines });
const MINES_RACE = {
  deal(rnd) {
    const L = MINES_LEVELS[MINES_RACE_LEVEL];
    const field = { cols: L.cols, rows: L.rows, count: L.mines, mines: [] };
    const safe = Math.floor(rnd() * L.cols * L.rows);
    minesLay(field, safe, rnd);
    return { pub: { cols: L.cols, rows: L.rows, count: L.mines, safe: safe }, mines: field.mines };
  },
  // Every board starts with the safe cell's patch open, as a phone's first tap would open it.
  board(x) {
    const f = Object.assign(minesField(x), { open: new Array(x.pub.cols * x.pub.rows).fill(0), flags: [] });
    const opened = minesFlood(f, x.pub.safe);
    return { open: opened.map(i => ({ i: i, n: minesCount(f, i) })), boom: -1 };
  },
  total: (x) => x.pub.cols * x.pub.rows - x.pub.count,
  move(b, x, p) {
    const n = x.pub.cols * x.pub.rows;
    const cells = Array.isArray(p.cells) ? p.cells.map(Number) : [];
    if (!cells.length || cells.length > 9 || cells.some(i => !Number.isInteger(i) || i < 0 || i >= n)) throw new Error('خانة مش مظبوطة');
    const f = Object.assign(minesField(x), { open: new Array(n).fill(0), flags: [] });
    b.open.forEach(o => { f.open[o.i] = 1; });
    const mines = new Set(x.mines);
    let hit = false;
    cells.forEach(i => {
      if (f.open[i]) return;
      minesFlood(f, i).forEach(k => {
        b.open.push({ i: k, n: mines.has(k) ? 9 : minesCount(f, k) });
        if (mines.has(k)) { hit = true; if (b.boom < 0) b.boom = k; }
      });
    });
    if (hit) return 'lost';
    return b.open.filter(o => o.n !== 9).length >= n - x.pub.count ? 'won' : '';
  },
  progress: (b) => ({ done: b.open.filter(o => o.n !== 9).length }),
  // The cells this phone has opened with their numbers; once it has hit a mine, that mine,
  // and every mine only when the round is over (`over`: the others race on the same field).
  view: (b, x, st, over) => (b.boom >= 0 ? { open: b.open, boom: b.boom, mines: over ? x.mines : [b.boom], all: !!over } : { open: b.open, boom: -1 }),
  score: () => 0,
  reveal: () => null
};
