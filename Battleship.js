/* ============================================================================
   حرب السفن — BATTLESHIP: the fleets, the shots, and the phone as an admiral
   ----------------------------------------------------------------------------
   One copy for both sides, like Connect4.js: the page inlines this file (you
   against the phone) and the rooms server bundles it (rooms-worker/build.mjs),
   so a shot is judged by the same code everywhere. No DOM, nothing that runs
   at load, and every top-level name starts with bs / BS_.

   The owner's rules (23 Sep 2026, asked one at a time): the classic 10 x 10
   sea and five ships - 5, 4, 3, 3, 2 (حاملة طائرات، بارجة، طرّاد، غواصة،
   مدمّرة); ships may not touch, not even at a corner; a hit shoots again, a
   miss passes the turn; a ship sunk is shown whole to the one who sank it,
   and the water round it is marked (nothing can be there).

   A fleet is five placements in BS_SHIPS order: { x, y, d } - x the column
   (0..9, A..J, left to right), y the row (0..9, 1..10, top to bottom), d 'h'
   (running right from x) or 'v' (running down from y). A cell is y * 10 + x.

   A sea is what the other side knows of a fleet: { grid, sunk }. grid is 100
   cells, each BS_SEA (not fired at), BS_MISS, BS_HIT (a ship, still afloat),
   BS_SUNK (a ship that went down) or BS_CLEAR (water round a sunk ship, marked
   by the game); sunk lists the ships gone down, with their placement. A sea
   is public; a fleet is secret until its ship sinks or the game ends.

   The phone's admiral (bsAiShot) reads a sea only - never the fleet: easy
   fires at random at water not marked; medium hunts at random and, after a
   hit, works along the ship; hard counts every way the ships still afloat
   could lie (bsDensity) - on the hits when there are any, on a parity of the
   smallest ship afloat when there are none - and fires where most of them
   meet, knowing that ships never touch.
   ========================================================================= */
const BS_N = 10;
const BS_SHIPS = [
  { id: 'carrier',    len: 5, ar: 'حاملة الطائرات', en: 'Carrier',    arShort: 'حاملة طائرات' },
  { id: 'battleship', len: 4, ar: 'البارجة',        en: 'Battleship', arShort: 'بارجة' },
  { id: 'cruiser',    len: 3, ar: 'الطرّاد',         en: 'Cruiser',    arShort: 'طرّاد' },
  { id: 'submarine',  len: 3, ar: 'الغواصة',        en: 'Submarine',  arShort: 'غواصة' },
  { id: 'destroyer',  len: 2, ar: 'المدمّرة',        en: 'Destroyer',  arShort: 'مدمّرة' }
];
const BS_LEVELS = ['easy', 'medium', 'hard'];
const BS_CLOCKS = [0, 15, 30];
const BS_SEA = 0, BS_MISS = 1, BS_HIT = 2, BS_SUNK = 3, BS_CLEAR = 4;
const BS_COLS = 'ABCDEFGHIJ';

function bsLevel(v) { return BS_LEVELS.indexOf(v) !== -1 ? v : 'medium'; }

/** A cell's name on the board: the column's letter and the row's number, "B7". */
function bsCoord(cell) {
  const c = Number(cell);
  if (!(c >= 0 && c < 100)) return '';
  return BS_COLS[c % BS_N] + String(Math.floor(c / BS_N) + 1);
}

/** A ship's name: 'ar' with its article (البارجة), 'arShort' without, or 'en'. */
function bsShipName(i, lang) {
  const s = BS_SHIPS[i];
  if (!s) return '';
  return lang === 'en' ? s.en : lang === 'arShort' ? s.arShort : s.ar;
}

/** The cells a ship covers, bow first; [] when any of it is off the board. */
function bsShipCells(p, len) {
  if (!p) return [];
  const out = [];
  for (let k = 0; k < len; k++) {
    const x = p.d === 'v' ? p.x : p.x + k;
    const y = p.d === 'v' ? p.y + k : p.y;
    if (x < 0 || y < 0 || x >= BS_N || y >= BS_N) return [];
    out.push(y * BS_N + x);
  }
  return out;
}

/** The up-to-eight cells round a cell. */
function bsNeighbours(cell) {
  const x = cell % BS_N, y = Math.floor(cell / BS_N), out = [];
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (!dx && !dy) continue;
      const nx = x + dx, ny = y + dy;
      if (nx >= 0 && ny >= 0 && nx < BS_N && ny < BS_N) out.push(ny * BS_N + nx);
    }
  }
  return out;
}

/** A fleet as sent by a phone, made plain: five { x, y, d } with whole numbers, or null. */
function bsCleanFleet(raw) {
  if (!Array.isArray(raw) || raw.length !== BS_SHIPS.length) return null;
  const out = [];
  for (let i = 0; i < raw.length; i++) {
    const p = raw[i] || {};
    const x = Number(p.x), y = Number(p.y);
    if (!(x === Math.floor(x) && y === Math.floor(y))) return null;
    if (p.d !== 'h' && p.d !== 'v') return null;
    out.push({ x: x, y: y, d: p.d });
  }
  return out;
}

/** Which ship is on each cell: 100 numbers, the ship's index + 1, or 0 for water. */
function bsOccupancy(fleet) {
  const occ = [];
  for (let i = 0; i < BS_N * BS_N; i++) occ.push(0);
  (fleet || []).forEach((p, i) => bsShipCells(p, BS_SHIPS[i].len).forEach(c => { if (!occ[c]) occ[c] = i + 1; }));
  return occ;
}

/**
 * Could ship i sit at p, beside the rest of the fleet (every ship but i)?
 * On the board, on no other ship, and touching none - not even at a corner.
 */
function bsCanPlace(fleet, i, p) {
  const cells = bsShipCells(p, BS_SHIPS[i].len);
  if (!cells.length) return false;
  const near = [];
  for (let k = 0; k < BS_N * BS_N; k++) near.push(false);
  (fleet || []).forEach((q, j) => {
    if (j === i || !q) return;
    bsShipCells(q, BS_SHIPS[j].len).forEach(c => { near[c] = true; bsNeighbours(c).forEach(n => { near[n] = true; }); });
  });
  return cells.every(c => !near[c]);
}

/** Why a fleet can't sail, or null: 'shape', 'out', 'overlap' or 'touch'. */
function bsFleetProblem(fleet) {
  const f = bsCleanFleet(fleet);
  if (!f) return 'shape';
  const owner = [];
  for (let k = 0; k < BS_N * BS_N; k++) owner.push(-1);
  for (let i = 0; i < f.length; i++) {
    const cells = bsShipCells(f[i], BS_SHIPS[i].len);
    if (!cells.length) return 'out';
    for (const c of cells) {
      if (owner[c] !== -1) return 'overlap';
      owner[c] = i;
    }
  }
  for (let c = 0; c < owner.length; c++) {
    if (owner[c] === -1) continue;
    if (bsNeighbours(c).some(n => owner[n] !== -1 && owner[n] !== owner[c])) return 'touch';
  }
  return null;
}

/** Every place ship i could go beside the ships already set (fleet[j] for j in `set`). */
function bsPlacesFor(fleet, i) {
  const out = [];
  for (let y = 0; y < BS_N; y++) {
    for (let x = 0; x < BS_N; x++) {
      ['h', 'v'].forEach(d => { const p = { x: x, y: y, d: d }; if (bsCanPlace(fleet, i, p)) out.push(p); });
    }
  }
  return out;
}

/** One random fleet that can sail: each ship, longest first, somewhere it fits. */
function bsRandomFleetOnce(rnd) {
  const r = rnd || Math.random;
  for (let attempt = 0; attempt < 100; attempt++) {
    const fleet = [null, null, null, null, null];
    let ok = true;
    for (let i = 0; i < BS_SHIPS.length; i++) {
      const places = bsPlacesFor(fleet, i);
      if (!places.length) { ok = false; break; }
      fleet[i] = places[Math.floor(r() * places.length)];
    }
    if (ok) return fleet;
  }
  // Never reached in practice (five ships fit a 10 x 10 sea many times over); a fixed fleet that sails.
  return [{ x: 0, y: 0, d: 'h' }, { x: 0, y: 2, d: 'h' }, { x: 0, y: 4, d: 'h' }, { x: 0, y: 6, d: 'h' }, { x: 0, y: 8, d: 'h' }];
}

/**
 * A random fleet. 'hard' deals a dozen and keeps the one hardest to find: the
 * least where a searching admiral looks first (the middle of an empty sea),
 * but never most of the fleet along the edges, which a player learns to comb.
 */
function bsRandomFleet(rnd, level) {
  const r = rnd || Math.random;
  if (level !== 'hard') return bsRandomFleetOnce(r);
  const base = bsDensity(bsNewSea(), []);
  let best = null, bestScore = Infinity;
  for (let k = 0; k < 12; k++) {
    const f = bsRandomFleetOnce(r);
    let score = 0, onEdge = 0;
    f.forEach((p, i) => {
      const cells = bsShipCells(p, BS_SHIPS[i].len);
      cells.forEach(c => { score += base[c]; });
      if (cells.some(c => c % BS_N === 0 || c % BS_N === BS_N - 1 || c < BS_N || c >= BS_N * (BS_N - 1))) onEdge++;
    });
    if (onEdge > 2) score += 400 * (onEdge - 2);
    score += r() * 40;
    if (score < bestScore) { bestScore = score; best = f; }
  }
  return best;
}

/** A sea nobody has fired at. */
function bsNewSea() {
  const grid = [];
  for (let i = 0; i < BS_N * BS_N; i++) grid.push(BS_SEA);
  return { grid: grid, sunk: [] };
}

/** Has every ship of this sea gone down? */
function bsAllSunk(sea) { return !!sea && (sea.sunk || []).length >= BS_SHIPS.length; }

/**
 * One shot at `cell` of a sea whose fleet is `fleet`. Changes the sea and says
 * what happened: { res: 'miss' | 'hit' | 'sunk', cell, ship, cells, water,
 * over } - on 'sunk' the ship, its cells and the water now marked round it,
 * `over` when it was the last. Null for a cell that isn't one or was fired at.
 */
function bsFire(sea, fleet, cell) {
  const c = Number(cell);
  if (!sea || !(c >= 0 && c < BS_N * BS_N && c === Math.floor(c))) return null;
  if (sea.grid[c] !== BS_SEA) return null;
  const who = bsOccupancy(fleet)[c] - 1;
  if (who < 0) { sea.grid[c] = BS_MISS; return { res: 'miss', cell: c }; }
  sea.grid[c] = BS_HIT;
  const p = fleet[who];
  const cells = bsShipCells(p, BS_SHIPS[who].len);
  if (!cells.every(k => sea.grid[k] === BS_HIT)) return { res: 'hit', cell: c, ship: who };
  cells.forEach(k => { sea.grid[k] = BS_SUNK; });
  const water = [];
  cells.forEach(k => bsNeighbours(k).forEach(n => {
    if (sea.grid[n] === BS_SEA) { sea.grid[n] = BS_CLEAR; water.push(n); }
  }));
  sea.sunk.push({ i: who, x: p.x, y: p.y, d: p.d });
  return { res: 'sunk', cell: c, ship: who, cells: cells, water: water, over: bsAllSunk(sea) };
}

/** The cells still open to a shot. */
function bsOpenCells(sea) {
  const out = [];
  (sea.grid || []).forEach((v, i) => { if (v === BS_SEA) out.push(i); });
  return out;
}

/** A random cell not fired at yet (the clock firing for a quiet phone), or -1. */
function bsRandomCell(sea, rnd) {
  const open = bsOpenCells(sea);
  if (!open.length) return -1;
  return open[Math.floor((rnd || Math.random)() * open.length)];
}

/** The lengths of the ships of this sea still afloat. */
function bsAfloat(sea) {
  const gone = (sea.sunk || []).map(s => s.i);
  return BS_SHIPS.map((s, i) => i).filter(i => gone.indexOf(i) === -1);
}

/**
 * How many ways the ships still afloat could cover each cell, from what the
 * shooter knows. A way is out if it covers a miss or marked water, or if a
 * hit touches it without being on it (ships never touch). With hits on the
 * board only the ways through them count, the more hits the more (target);
 * without, every way counts (hunt). `afloat` defaults to the sea's.
 */
function bsDensity(sea, afloatLens) {
  const g = sea.grid;
  const lens = afloatLens && afloatLens.length ? afloatLens : bsAfloat(sea).map(i => BS_SHIPS[i].len);
  const score = [];
  for (let i = 0; i < BS_N * BS_N; i++) score.push(0);
  let target = false;
  for (let i = 0; i < g.length; i++) if (g[i] === BS_HIT) { target = true; break; }
  const count = (onlyHits) => {
    let any = false;
    lens.forEach(len => {
      for (let y = 0; y < BS_N; y++) {
        for (let x = 0; x < BS_N; x++) {
          for (const d of ['h', 'v']) {
            if (len === 1 && d === 'v') continue;
            const cells = bsShipCells({ x: x, y: y, d: d }, len);
            if (!cells.length) continue;
            let hits = 0, blocked = false;
            for (const c of cells) {
              const v = g[c];
              if (v === BS_MISS || v === BS_SUNK || v === BS_CLEAR) { blocked = true; break; }
              if (v === BS_HIT) hits++;
            }
            if (blocked || (onlyHits && !hits)) continue;
            // A hit beside this way but not on it would be another ship touching it.
            let touching = false;
            for (const c of cells) {
              for (const n of bsNeighbours(c)) {
                if (g[n] === BS_HIT && cells.indexOf(n) === -1) { touching = true; break; }
              }
              if (touching) break;
            }
            if (touching) continue;
            const w = onlyHits ? Math.pow(24, hits) : 1;
            cells.forEach(c => { if (g[c] === BS_SEA) { score[c] += w; any = true; } });
          }
        }
      }
    });
    return any;
  };
  if (target && count(true)) return score;
  for (let i = 0; i < score.length; i++) score[i] = 0;
  count(false);
  return score;
}

/** The highest-scoring cells among `cells` (ties kept, for a random pick). */
function bsBest(score, cells) {
  let top = -1, out = [];
  cells.forEach(c => {
    if (score[c] > top) { top = score[c]; out = [c]; }
    else if (score[c] === top) out.push(c);
  });
  return top > 0 ? out : [];
}

/** The hits still afloat, in groups of touching cells (one ship each, since ships never touch). */
function bsHitGroups(sea) {
  const g = sea.grid, seen = {}, groups = [];
  for (let i = 0; i < g.length; i++) {
    if (g[i] !== BS_HIT || seen[i]) continue;
    const group = [], stack = [i];
    seen[i] = true;
    while (stack.length) {
      const c = stack.pop();
      group.push(c);
      const x = c % BS_N, y = Math.floor(c / BS_N);
      [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => {
        const nx = x + dx, ny = y + dy, n = ny * BS_N + nx;
        if (nx >= 0 && ny >= 0 && nx < BS_N && ny < BS_N && g[n] === BS_HIT && !seen[n]) { seen[n] = true; stack.push(n); }
      });
    }
    groups.push(group.sort((a, b) => a - b));
  }
  return groups;
}

/** Medium's target mode: the open cells that carry on a group of hits (along its line once it has two). */
function bsTargetCells(sea) {
  const g = sea.grid, out = [];
  const add = (x, y) => { const n = y * BS_N + x; if (x >= 0 && y >= 0 && x < BS_N && y < BS_N && g[n] === BS_SEA && out.indexOf(n) === -1) out.push(n); };
  bsHitGroups(sea).forEach(group => {
    const xs = group.map(c => c % BS_N), ys = group.map(c => Math.floor(c / BS_N));
    if (group.length >= 2 && ys.every(y => y === ys[0])) {
      add(Math.min.apply(null, xs) - 1, ys[0]); add(Math.max.apply(null, xs) + 1, ys[0]);
    } else if (group.length >= 2 && xs.every(x => x === xs[0])) {
      add(xs[0], Math.min.apply(null, ys) - 1); add(xs[0], Math.max.apply(null, ys) + 1);
    } else {
      group.forEach(c => { const x = c % BS_N, y = Math.floor(c / BS_N); add(x + 1, y); add(x - 1, y); add(x, y + 1); add(x, y - 1); });
    }
  });
  return out;
}

/**
 * The phone's shot at a sea, from what the table can see of it. Always a cell
 * not fired at yet (or -1 when there is none).
 */
function bsAiShot(sea, level, rnd) {
  const r = rnd || Math.random;
  const open = bsOpenCells(sea);
  if (!open.length) return -1;
  const any = (list) => list[Math.floor(r() * list.length)];
  const lv = bsLevel(level);
  if (lv === 'easy') return any(open);
  if (lv === 'medium') {
    const t = bsTargetCells(sea);
    return t.length ? any(t) : any(open);
  }
  const score = bsDensity(sea);
  const hunting = !sea.grid.some(v => v === BS_HIT);
  let pool = open;
  if (hunting) {
    // Parity: the smallest ship afloat covers one cell in every `m` along a line.
    const lens = bsAfloat(sea).map(i => BS_SHIPS[i].len);
    const m = Math.max(1, Math.min.apply(null, lens.length ? lens : [1]));
    if (m > 1) {
      // The class of cells the most ways run through.
      let bestK = 0, bestSum = -1;
      for (let k = 0; k < m; k++) {
        let sum = 0;
        open.forEach(c => { if (((c % BS_N) + Math.floor(c / BS_N)) % m === k) sum += score[c]; });
        if (sum > bestSum) { bestSum = sum; bestK = k; }
      }
      const parity = open.filter(c => ((c % BS_N) + Math.floor(c / BS_N)) % m === bestK);
      if (parity.length) pool = parity;
    }
  }
  const best = bsBest(score, pool);
  if (best.length) return any(best);
  const fallback = bsBest(score, open);
  return any(fallback.length ? fallback : open);
}
