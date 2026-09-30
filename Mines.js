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
   so the first tap is always safe; opening a zero opens everything round it.
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

/** Lays the mines anywhere but `safe` and its neighbours. */
function minesLay(s, safe, rnd) {
  const keepClear = new Set([safe].concat(minesNeighbours(s, safe)));
  const cells = [];
  for (let i = 0; i < s.cols * s.rows; i++) if (!keepClear.has(i)) cells.push(i);
  s.mines = soloShuffle(cells, rnd).slice(0, s.count).sort((a, b) => a - b);
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
