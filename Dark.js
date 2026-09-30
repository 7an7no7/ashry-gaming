/* ============================================================================
   الأوضة المضلمة — THE DARK ROOM: the maps and their rules, both sides keep
   ----------------------------------------------------------------------------
   One player walks through a dark house (or a pharaoh's tomb) seeing nothing
   but an echo where a wall is beside them; everyone else has the map under a
   lens and talks them through. This file is the map: it is made from a seed,
   the same on the rooms server (which judges every step) and on the page of a
   guide or the TV (which draws it). The seed itself is the secret: the mover's
   phone is never sent it (RoomDark.js), so the map is nowhere in its traffic.

   A map is real rooms laid over a hidden grid of cells (a cell is a step):
   the plan is split into rooms (a binary split, so every level looks
   different), the rooms are joined by doors along a spanning tree with a
   loop or two, and each room gets a kind from its story (the kid's bedroom,
   the kitchen, grandpa's room, the living room…; the tomb's entrance, its
   hall of pillars, the sand room, the sarcophagus, the treasure) with the
   furniture that belongs there, placed against its walls so every free cell
   stays reachable. Then the traps of that story: some lie still (a Lego
   brick, a squeaky duck, the creaky floor tile beside grandpa; a pressure
   plate, a sand pit), some move on the server's clock (the cat, a rolling
   ball; a patrolling mummy, a swinging blade). A map is only kept when a
   search over (cell, time) finds a way from the bed to the fridge (or the
   entrance to the golden mask) that no trap touches (darkSolve).

   Time: the moving traps step on a clock of DARK_TICK ms counted from the
   level's start (shared.t0 on the server), so every screen places them the
   same without being told, and the server knows when one walks into the
   mover (darkNextHit).

   No DOM, nothing that runs at load; every top-level name starts with dark /
   DARK_ (the page and the Worker are each one scope). Integer arithmetic for
   everything the rules decide, so the two sides can never disagree.
   ========================================================================= */
const DARK_MIN = 2;
const DARK_MAX = 8;
const DARK_HEARTS = 3;
const DARK_TICK = 350;            // ms: the moving traps' clock
const DARK_STORIES = ['home', 'tomb'];
const DARK_MODES = ['steps', 'stick'];
const DARK_DIRS = { U: [0, -1], D: [0, 1], L: [-1, 0], R: [1, 0] };
const DARK_SPEED = 2.4;           // cells a second at a full push of the joystick
const DARK_BODY = 0.26;           // the mover's radius in cells, against a wall (the joystick)

// Level n's plan: its size, how many rooms, and how many traps of each kind.
const DARK_LEVELS = [
  { w: 10, h: 7,  rooms: 4, still: 3, patrol: 0, roll: 0, loops: 0 },
  { w: 12, h: 8,  rooms: 5, still: 4, patrol: 1, roll: 0, loops: 1 },
  { w: 13, h: 9,  rooms: 6, still: 5, patrol: 1, roll: 1, loops: 1 },
  { w: 15, h: 9,  rooms: 7, still: 6, patrol: 2, roll: 1, loops: 2 },
  { w: 16, h: 10, rooms: 8, still: 7, patrol: 2, roll: 2, loops: 2 }
];
const darkLevelSpec = (level) => DARK_LEVELS[Math.max(0, Math.min(DARK_LEVELS.length - 1, (level | 0) - 1))];

// The rooms a story has: the first is where the walk starts, the second where it ends,
// the third holds the sleeper; the rest fill the plan in turn.
const DARK_ROOMS = {
  home: { start: 'kids', goal: 'kitchen', sleep: 'grandpa', fill: ['salon', 'hall', 'dining', 'salon', 'hall'] },
  tomb: { start: 'entry', goal: 'treasure', sleep: 'sarco', fill: ['pillars', 'sand', 'jars', 'pillars', 'sand'] }
};
// Each room's furniture, in the order it is tried: [kind, width, depth, where].
// 'wall' stands with its back to a wall, 'mid' stands clear of the walls.
const DARK_FURNITURE = {
  kids: [['toybox', 1, 1, 'wall'], ['dresser', 1, 1, 'wall']],
  kitchen: [['counter', 3, 1, 'wall'], ['table', 2, 2, 'mid']],
  grandpa: [['shelf', 1, 1, 'wall'], ['dresser', 1, 1, 'wall']],
  salon: [['sofa', 3, 1, 'wall'], ['tvunit', 3, 1, 'wall'], ['plant', 1, 1, 'wall']],
  hall: [['plant', 1, 1, 'wall'], ['shelf', 1, 1, 'wall']],
  dining: [['table', 2, 2, 'mid'], ['plant', 1, 1, 'wall']],
  entry: [['statue', 1, 1, 'wall'], ['jar', 1, 1, 'wall']],
  treasure: [['jar', 1, 1, 'wall'], ['statue', 1, 1, 'wall']],
  sarco: [['statue', 1, 1, 'wall']],
  pillars: [['pillar', 1, 1, 'mid'], ['pillar', 1, 1, 'mid'], ['pillar', 1, 1, 'mid']],
  sand: [['jar', 1, 1, 'wall'], ['jar', 1, 1, 'wall']],
  jars: [['jar', 1, 1, 'wall'], ['jar', 1, 1, 'wall'], ['jar', 1, 1, 'wall']]
};
// The traps of each story. Still ones lie on a cell; moving ones walk a line (patrol, roll) or swing on one cell (blade).
const DARK_TRAPS = {
  home: { still: ['lego', 'duck'], near: 'creak', patrol: 'cat', roll: 'ball' },
  tomb: { still: ['plate', 'plate', 'sand'], near: 'plate', patrol: 'mummy', roll: 'blade' }
};
const DARK_STEP_TICKS = { cat: 2, mummy: 3, ball: 1 };   // ticks a step
const DARK_BLADE = { period: 8, on: 2 };                 // ticks a swing; deadly for `on` of them

/** A seeded random source (mulberry32): the same numbers on every side. */
function darkRng(seed) {
  let s = seed >>> 0;
  const r = () => {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  r.int = (n) => Math.floor(r() * n);
  r.pick = (a) => a[Math.floor(r() * a.length)];
  r.shuffle = (a) => { const o = a.slice(); for (let i = o.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); const x = o[i]; o[i] = o[j]; o[j] = x; } return o; };
  return r;
}

/* --- the plan: rooms, doors ------------------------------------------------------ */

/** Splits the plan into `n` rooms, the biggest first, never a room under 3 × 3. */
function darkPartition(w, h, n, rnd) {
  const rooms = [{ x: 0, y: 0, w, h }];
  for (let guard = 0; rooms.length < n && guard < 40; guard++) {
    const order = rooms.map((r, i) => i).sort((a, b) => rooms[b].w * rooms[b].h - rooms[a].w * rooms[a].h);
    let done = false;
    for (const i of order) {
      const r = rooms[i];
      const canV = r.w >= 6, canH = r.h >= 6;
      if (!canV && !canH) continue;
      const vertical = canV && (!canH || r.w > r.h * 1.15 || (r.w * 1.15 >= r.h && rnd() < 0.5));
      if (vertical) {
        const cut = 3 + rnd.int(r.w - 5);
        rooms.splice(i, 1, { x: r.x, y: r.y, w: cut, h: r.h }, { x: r.x + cut, y: r.y, w: r.w - cut, h: r.h });
      } else {
        const cut = 3 + rnd.int(r.h - 5);
        rooms.splice(i, 1, { x: r.x, y: r.y, w: r.w, h: cut }, { x: r.x, y: r.y + cut, w: r.w, h: r.h - cut });
      }
      done = true;
      break;
    }
    if (!done) break;
  }
  return rooms;
}

/** Where two rooms touch: the pairs of cells a door between them could join. */
function darkTouching(a, b) {
  const out = [];
  if (a.x + a.w === b.x || b.x + b.w === a.x) {
    const left = a.x + a.w === b.x ? a : b, right = left === a ? b : a;
    const y0 = Math.max(a.y, b.y), y1 = Math.min(a.y + a.h, b.y + b.h);
    for (let y = y0; y < y1; y++) out.push([left.x + left.w - 1, y, right.x, y, y - y0, y1 - y0]);
  } else if (a.y + a.h === b.y || b.y + b.h === a.y) {
    const top = a.y + a.h === b.y ? a : b, bottom = top === a ? b : a;
    const x0 = Math.max(a.x, b.x), x1 = Math.min(a.x + a.w, b.x + b.w);
    for (let x = x0; x < x1; x++) out.push([x, top.y + top.h - 1, x, bottom.y, x - x0, x1 - x0]);
  }
  return out;
}

/** A door on a shared wall: away from the ends when the wall is long enough. */
function darkDoorOn(a, b, rnd) {
  const c = darkTouching(a, b);
  if (!c.length) return null;
  const inner = c.filter(q => q[5] < 3 || (q[4] > 0 && q[4] < q[5] - 1));
  const q = rnd.pick(inner.length ? inner : c);
  return [q[0], q[1], q[2], q[3]];
}

/* --- the derived map: what a cell is, what stands between two cells ---------------- */

/** Fills in what every question about the map reads (never serialised: rebuilt from the seed). */
function darkPrep(m) {
  const W = m.w, H = m.h;
  m.cellRoom = new Array(W * H).fill(-1);
  m.rooms.forEach((r, i) => { for (let y = r.y; y < r.y + r.h; y++) for (let x = r.x; x < r.x + r.w; x++) m.cellRoom[y * W + x] = i; });
  m.cellBlock = new Array(W * H).fill(-1);
  m.blocks.forEach((b, i) => { for (let y = b.y; y < b.y + b.h; y++) for (let x = b.x; x < b.x + b.w; x++) m.cellBlock[y * W + x] = i; });
  m.doorSet = new Set();
  m.doors.forEach(d => { const a = d[1] * W + d[0], b = d[3] * W + d[2]; m.doorSet.add(Math.min(a, b) * 4096 + Math.max(a, b)); });
  m.trapAt = new Map();
  (m.traps || []).forEach((t, i) => m.trapAt.set(t.y * W + t.x, i));
  return m;
}
const darkIn = (m, x, y) => x >= 0 && y >= 0 && x < m.w && y < m.h;
/** Is there a wall between two cells side by side? */
function darkWall(m, x, y, nx, ny) {
  if (!darkIn(m, x, y) || !darkIn(m, nx, ny)) return true;
  const a = y * m.w + x, b = ny * m.w + nx;
  if (m.cellRoom[a] === m.cellRoom[b]) return false;
  return !m.doorSet.has(Math.min(a, b) * 4096 + Math.max(a, b));
}
/** What stops a step from (x, y) by (dx, dy): '' nothing, 'wall', or the furniture's kind. */
function darkBlocked(m, x, y, dx, dy) {
  const nx = x + dx, ny = y + dy;
  if (darkWall(m, x, y, nx, ny)) return 'wall';
  const bi = m.cellBlock[ny * m.w + nx];
  return bi >= 0 ? m.blocks[bi].k : '';
}
const darkFree = (m, i) => i >= 0 && m.cellBlock[i] < 0;
/** The echo the mover hears from a cell: what is beside it on each side. */
function darkEcho(m, x, y) {
  const out = {};
  Object.keys(DARK_DIRS).forEach(k => { const d = DARK_DIRS[k]; out[k] = darkIn(m, x, y) ? darkBlocked(m, x, y, d[0], d[1]) : 'wall'; });
  return out;
}
/** The walls as straight segments on the cells' edges, for drawing ([x0, y0, x1, y1]). */
function darkSegs(m) {
  const segs = [];
  for (let y = 0; y <= m.h; y++) {
    let s = -1;
    for (let x = 0; x <= m.w; x++) {
      const on = x < m.w && ((y === 0 || y === m.h) ? true : darkWall(m, x, y - 1, x, y));
      if (on && s < 0) s = x;
      if (!on && s >= 0) { segs.push([s, y, x, y]); s = -1; }
    }
  }
  for (let x = 0; x <= m.w; x++) {
    let s = -1;
    for (let y = 0; y <= m.h; y++) {
      const on = y < m.h && ((x === 0 || x === m.w) ? true : darkWall(m, x - 1, y, x, y));
      if (on && s < 0) s = y;
      if (!on && s >= 0) { segs.push([x, s, x, y]); s = -1; }
    }
  }
  return segs;
}

/** Every free cell reachable from `from` (steps over walls and furniture, and past `avoid`). */
function darkReach(m, from, avoid) {
  const seen = new Uint8Array(m.w * m.h);
  if (!darkFree(m, from) || (avoid && avoid.has(from))) return seen;
  const q = [from];
  seen[from] = 1;
  while (q.length) {
    const c = q.shift();
    const x = c % m.w, y = (c - x) / m.w;
    for (const k in DARK_DIRS) {
      const d = DARK_DIRS[k];
      if (darkBlocked(m, x, y, d[0], d[1])) continue;
      const n = (y + d[1]) * m.w + x + d[0];
      if (seen[n] || (avoid && avoid.has(n))) continue;
      seen[n] = 1;
      q.push(n);
    }
  }
  return seen;
}
/** The shortest way between two cells past `avoid` (a list of cells), or null. */
function darkPath(m, from, to, avoid) {
  const prev = new Int32Array(m.w * m.h).fill(-2);
  const q = [from];
  prev[from] = -1;
  while (q.length) {
    const c = q.shift();
    if (c === to) break;
    const x = c % m.w, y = (c - x) / m.w;
    for (const k in DARK_DIRS) {
      const d = DARK_DIRS[k];
      if (darkBlocked(m, x, y, d[0], d[1])) continue;
      const n = (y + d[1]) * m.w + x + d[0];
      if (prev[n] !== -2 || (avoid && avoid.has(n))) continue;
      prev[n] = c;
      q.push(n);
    }
  }
  if (prev[to] === -2) return null;
  const out = [];
  for (let c = to; c !== -1; c = prev[c]) out.push(c);
  return out.reverse();
}

/* --- the moving traps on the level's clock ------------------------------------------ */

/** Where a moving trap stands at tick k: a cell index, or -1 when it covers none (a blade up). */
function darkDynCell(m, d, k) {
  if (d.k === 'blade') return ((k + d.phase) % DARK_BLADE.period) < DARK_BLADE.on ? d.path[0] : -1;
  const n = d.path.length;
  if (n < 2) return d.path[0];
  const cyc = 2 * (n - 1);
  const j = Math.floor(k / d.step) % cyc;
  return d.path[j < n ? j : cyc - j];
}
/** The cells every moving trap covers at tick k (a Set). */
function darkDynCells(m, k) {
  const out = new Set();
  (m.dyn || []).forEach(d => { const c = darkDynCell(m, d, k); if (c >= 0) out.add(c); });
  return out;
}
/** For drawing: each moving trap's place at `ms` into the level, smooth between cells. */
function darkDynAt(m, ms) {
  const t = Math.max(0, ms) / DARK_TICK;
  const k = Math.floor(t);
  return (m.dyn || []).map((d, i) => {
    const w = m.w;
    if (d.k === 'blade') {
      const ph = ((t + d.phase) % DARK_BLADE.period) / DARK_BLADE.period;   // 0..1 round the swing
      const c = d.path[0];
      return { i, k: d.k, x: c % w, y: Math.floor(c / w), swing: ph, on: darkDynCell(m, d, k) >= 0, axis: d.axis };
    }
    const n = d.path.length, cyc = 2 * (n - 1);
    const js = t / d.step;
    const j = Math.floor(js) % cyc;
    const cur = d.path[j < n ? j : cyc - j];
    const j0 = (j - 1 + cyc) % cyc;
    const prev = d.path[j0 < n ? j0 : cyc - j0];
    const f = Math.min(1, (js - Math.floor(js)) * 3);   // it hurries into its new cell, and waits there
    const e = f < 0.5 ? 2 * f * f : 1 - Math.pow(-2 * f + 2, 2) / 2;
    const px = prev % w, py = Math.floor(prev / w), cx = cur % w, cy = Math.floor(cur / w);
    return { i, k: d.k, x: px + (cx - px) * e, y: py + (cy - py) * e, fx: cx - px, fy: cy - py, cell: cur };
  });
}
/** How long a lap of every moving trap takes together, in ticks (the search's clock). */
function darkPeriod(m) {
  const gcd = (a, b) => (b ? gcd(b, a % b) : a);
  let p = 1;
  (m.dyn || []).forEach(d => {
    const q = d.k === 'blade' ? DARK_BLADE.period : 2 * Math.max(1, d.path.length - 1) * d.step;
    p = p / gcd(p, q) * q;
  });
  return Math.min(p, 5040);
}
/** The first moment after `fromMs` (ms into the level) when a moving trap reaches `cell`, or null. */
function darkNextHit(m, cell, fromMs) {
  if (!m.dyn || !m.dyn.length) return null;
  const k0 = Math.floor(Math.max(0, fromMs) / DARK_TICK) + 1;
  const P = darkPeriod(m);
  for (let k = k0; k < k0 + P + 1; k++) {
    for (const d of m.dyn) if (darkDynCell(m, d, k) === cell) return k * DARK_TICK;
  }
  return null;
}
/** Does anything hurt the mover on `cell` at `ms` into the level? The trap's kind, or ''. */
function darkHurtAt(m, cell, ms) {
  const ti = m.trapAt.get(cell);
  if (ti !== undefined) return m.traps[ti].k;
  const k = Math.floor(Math.max(0, ms) / DARK_TICK);
  for (const d of (m.dyn || [])) if (darkDynCell(m, d, k) === cell) return d.k;
  return '';
}
/** What is right beside `cell` at `ms` (for the near misses): a trap's kind, 'sleeper', or ''. */
function darkNear(m, cell, ms) {
  const x = cell % m.w, y = Math.floor(cell / m.w);
  const k = Math.floor(Math.max(0, ms) / DARK_TICK);
  const dyn = darkDynCells(m, k);
  let near = '';
  for (const key in DARK_DIRS) {
    const d = DARK_DIRS[key];
    if (darkWall(m, x, y, x + d[0], y + d[1])) continue;
    const n = (y + d[1]) * m.w + x + d[0];
    const bi = m.cellBlock[n];
    if (bi >= 0 && bi === m.sleeper) near = near || 'sleeper';
    if (dyn.has(n)) {
      const dd = m.dyn.find(z => darkDynCell(m, z, k) === n);
      return dd ? dd.k : 'trap';
    }
    const ti = m.trapAt.get(n);
    if (ti !== undefined && !near) near = m.traps[ti].k;
  }
  return near;
}

/* --- the search: can the level be walked? -------------------------------------------- */

/**
 * The fewest ticks from the start to the goal, walking a cell a tick (or waiting),
 * never on a still trap and never where a moving one is at that tick; -1 when there
 * is no way. The start is never on a moving trap's line, so waiting there is safe,
 * and a walk found from tick 0 works from any tick (a trap sends the mover back at
 * any moment): wait at the start for the right one.
 */
function darkSolve(m) {
  const P = darkPeriod(m);
  const N = m.w * m.h;
  const start = m.start[1] * m.w + m.start[0], goal = m.goal[1] * m.w + m.goal[0];
  const still = new Set(m.traps.map(t => t.y * m.w + t.x));
  const cache = new Map();
  const dynAt = (k) => { const kk = k % P; let s = cache.get(kk); if (!s) { s = darkDynCells(m, kk); cache.set(kk, s); } return s; };
  const seen = new Uint8Array(N * P);
  let front = [start];
  seen[start * P] = 1;
  for (let k = 0; k < N * P + 1 && front.length; k++) {
    const next = [];
    const bad = dynAt(k + 1);
    for (const c of front) {
      if (c === goal) return k;
      const x = c % m.w, y = (c - x) / m.w;
      const tries = [c];
      for (const key in DARK_DIRS) {
        const d = DARK_DIRS[key];
        if (!darkBlocked(m, x, y, d[0], d[1])) tries.push((y + d[1]) * m.w + x + d[0]);
      }
      for (const n of tries) {
        if (still.has(n) || bad.has(n)) continue;
        const s = n * P + ((k + 1) % P);
        if (seen[s]) continue;
        seen[s] = 1;
        next.push(n);
      }
    }
    front = next;
  }
  return -1;
}

/* --- making a level ---------------------------------------------------------------- */

/** The cells a block of this size stands on at (x, y), or null if it doesn't fit the room. */
function darkBlockCells(m, room, x, y, w, h) {
  if (x < room.x || y < room.y || x + w > room.x + room.w || y + h > room.y + room.h) return null;
  const out = [];
  for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) out.push(yy * m.w + xx);
  return out;
}
/** Every way a piece can stand in a room: [x, y, w, h, r], r the wall its back is to (0 top, 1 right, 2 bottom, 3 left). */
function darkSpots(room, w0, d0, where) {
  const out = [];
  if (where === 'mid') {
    for (let y = room.y + 1; y + d0 <= room.y + room.h - 1; y++) for (let x = room.x + 1; x + w0 <= room.x + room.w - 1; x++) out.push([x, y, w0, d0, 0]);
    return out;
  }
  for (let r = 0; r < 4; r++) {
    const w = r % 2 ? d0 : w0, h = r % 2 ? w0 : d0;
    if (w > room.w || h > room.h) continue;
    if (r === 0) for (let x = room.x; x + w <= room.x + room.w; x++) out.push([x, room.y, w, h, 0]);
    if (r === 2) for (let x = room.x; x + w <= room.x + room.w; x++) out.push([x, room.y + room.h - h, w, h, 2]);
    if (r === 1) for (let y = room.y; y + h <= room.y + room.h; y++) out.push([room.x + room.w - w, y, w, h, 1]);
    if (r === 3) for (let y = room.y; y + h <= room.y + room.h; y++) out.push([room.x, y, w, h, 3]);
  }
  return out;
}
/** The cell in front of a 1 × 1 piece (where you stand to open the fridge). */
function darkFront(b) {
  const f = [[0, 1], [-1, 0], [0, -1], [1, 0]][b.r];
  return [b.x + f[0], b.y + f[1]];
}

/**
 * Tries to stand a piece in a room: somewhere it touches no reserved cell and
 * leaves every free cell of the map connected. `need` (optional) checks the spot.
 */
function darkPlace(m, room, k, w0, d0, where, rnd, reserved, need) {
  const spots = rnd.shuffle(darkSpots(room, w0, d0, where));
  for (const s of spots) {
    const cells = darkBlockCells(m, room, s[0], s[1], s[2], s[3]);
    if (!cells || cells.some(c => reserved.has(c) || m.cellBlock[c] >= 0)) continue;
    const b = { k, x: s[0], y: s[1], w: s[2], h: s[3], r: s[4] };
    if (need && !need(b)) continue;
    const i = m.blocks.length;
    m.blocks.push(b);
    cells.forEach(c => { m.cellBlock[c] = i; });
    // Every free cell still joined to every other (no pocket nobody can reach).
    let first = -1, free = 0;
    for (let c = 0; c < m.w * m.h; c++) if (m.cellBlock[c] < 0) { free++; if (first < 0) first = c; }
    const seen = darkReach(m, first);
    let got = 0;
    for (let c = 0; c < m.w * m.h; c++) if (seen[c]) got++;
    if (got === free) return b;
    m.blocks.pop();
    cells.forEach(c => { m.cellBlock[c] = -1; });
  }
  return null;
}

/** The straight lines of free cells in one room, `min` long or more: [cells…]. */
function darkRuns(m, avoid, min) {
  const runs = [];
  const ok = (x, y) => darkIn(m, x, y) && darkFree(m, y * m.w + x) && !avoid.has(y * m.w + x);
  for (let y = 0; y < m.h; y++) {
    let cur = [];
    for (let x = 0; x <= m.w; x++) {
      const c = y * m.w + x;
      if (x < m.w && ok(x, y) && (!cur.length || m.cellRoom[c] === m.cellRoom[cur[0]])) cur.push(c);
      else { if (cur.length >= min) runs.push(cur); cur = x < m.w && ok(x, y) ? [c] : []; }
    }
  }
  for (let x = 0; x < m.w; x++) {
    let cur = [];
    for (let y = 0; y <= m.h; y++) {
      const c = y * m.w + x;
      if (y < m.h && ok(x, y) && (!cur.length || m.cellRoom[c] === m.cellRoom[cur[0]])) cur.push(c);
      else { if (cur.length >= min) runs.push(cur); cur = y < m.h && ok(x, y) ? [c] : []; }
    }
  }
  return runs;
}

/** One try at a level from `seed`; null when the plan didn't come together. */
function darkBuild(story, level, seed) {
  const rnd = darkRng(seed);
  const spec = darkLevelSpec(level);
  const W = spec.w, H = spec.h;
  const m = { story, level, seed, w: W, h: H, rooms: [], doors: [], blocks: [], traps: [], dyn: [], start: null, goal: null, sleeper: -1, startBlock: -1, goalBlock: -1 };
  // Rooms, and the doors between them: a spanning tree, then a loop or two.
  const parts = darkPartition(W, H, spec.rooms, rnd);
  m.rooms = parts.map(r => ({ x: r.x, y: r.y, w: r.w, h: r.h, kind: '' }));
  const R = m.rooms.length;
  const adj = [];
  for (let i = 0; i < R; i++) for (let j = i + 1; j < R; j++) if (darkTouching(m.rooms[i], m.rooms[j]).length) adj.push([i, j]);
  const linked = new Set([rnd.int(R)]);
  const tree = [];
  while (linked.size < R) {
    const edges = adj.filter(e => linked.has(e[0]) !== linked.has(e[1]));
    if (!edges.length) return null;
    const e = rnd.pick(edges);
    tree.push(e);
    linked.add(e[0]); linked.add(e[1]);
  }
  const extra = rnd.shuffle(adj.filter(e => !tree.some(t => t[0] === e[0] && t[1] === e[1]))).slice(0, spec.loops);
  tree.concat(extra).forEach(e => { const d = darkDoorOn(m.rooms[e[0]], m.rooms[e[1]], rnd); if (d) m.doors.push(d); });
  m.blocks = [];
  darkPrep(m);
  // The rooms' graph, for the two farthest apart: the walk starts in one and ends in the other.
  const hops = (from) => {
    const dist = new Array(R).fill(-1);
    dist[from] = 0;
    const q = [from];
    while (q.length) {
      const a = q.shift();
      m.doors.forEach(d => {
        const ra = m.cellRoom[d[1] * W + d[0]], rb = m.cellRoom[d[3] * W + d[2]];
        const b = ra === a ? rb : rb === a ? ra : -1;
        if (b >= 0 && dist[b] < 0) { dist[b] = dist[a] + 1; q.push(b); }
      });
    }
    return dist;
  };
  let best = [0, 0, -1];
  for (let i = 0; i < R; i++) { const d = hops(i); d.forEach((v, j) => { if (v > best[2] || (v === best[2] && rnd() < 0.3)) best = [i, j, v]; }); }
  if (best[2] < 1) return null;
  const [sR, gR] = rnd() < 0.5 ? [best[0], best[1]] : [best[1], best[0]];
  // The sleeper's room: on the way if it can be, so the walk passes by grandpa.
  const dS = hops(sR), dG = hops(gR);
  const between = [];
  for (let i = 0; i < R; i++) if (i !== sR && i !== gR && dS[i] + dG[i] === best[2]) between.push(i);
  const others = [];
  for (let i = 0; i < R; i++) if (i !== sR && i !== gR) others.push(i);
  const zR = between.length ? rnd.pick(between) : (others.length ? rnd.pick(others) : -1);
  const plan = DARK_ROOMS[story];
  let fi = rnd.int(plan.fill.length);
  m.rooms.forEach((r, i) => { r.kind = i === sR ? plan.start : i === gR ? plan.goal : i === zR ? plan.sleep : plan.fill[(fi++) % plan.fill.length]; });

  // What must stay free: both cells of every door.
  const reserved = new Set();
  m.doors.forEach(d => { reserved.add(d[1] * W + d[0]); reserved.add(d[3] * W + d[2]); });
  const home = story === 'home';
  // The start: beside the kid's bed, or on the tomb's entrance steps.
  const sRoom = m.rooms[sR];
  if (home) {
    const bed = darkPlace(m, sRoom, 'bed', 1, 2, 'wall', rnd, reserved, (b) => {
      const f = b.r % 2 ? [b.x + (b.r === 1 ? -1 : b.w), b.y] : [b.x + (b.x > sRoom.x ? -1 : 1), b.y + (b.r === 0 ? 1 : 0)];
      return darkIn(m, f[0], f[1]) && m.cellRoom[f[1] * W + f[0]] === sR && !reserved.has(f[1] * W + f[0]) && m.cellBlock[f[1] * W + f[0]] < 0;
    });
    if (!bed) return null;
    m.startBlock = m.blocks.indexOf(bed);
    m.start = bed.r % 2 ? [bed.x + (bed.r === 1 ? -1 : bed.w), bed.y] : [bed.x + (bed.x > sRoom.x ? -1 : 1), bed.y + (bed.r === 0 ? 1 : 0)];
  } else {
    // The corner of the entrance farthest from its doors.
    let far = -1, at = null;
    for (let y = sRoom.y; y < sRoom.y + sRoom.h; y++) for (let x = sRoom.x; x < sRoom.x + sRoom.w; x++) {
      const c = y * W + x;
      if (reserved.has(c)) continue;
      const d = Math.min.apply(null, m.doors.filter(q => m.cellRoom[q[1] * W + q[0]] === sR || m.cellRoom[q[3] * W + q[2]] === sR)
        .map(q => Math.abs(q[0] - x) + Math.abs(q[1] - y)));
      if (d > far || (d === far && rnd() < 0.3)) { far = d; at = [x, y]; }
    }
    if (!at) return null;
    m.start = at;
  }
  const startCell = m.start[1] * W + m.start[0];
  reserved.add(startCell);
  // The goal: in front of the fridge, or of the golden mask on its pedestal.
  const gRoom = m.rooms[gR];
  const goalPiece = darkPlace(m, gRoom, home ? 'fridge' : 'pedestal', 1, 1, 'wall', rnd, reserved, (b) => {
    const f = darkFront(b);
    const c = f[1] * W + f[0];
    return darkIn(m, f[0], f[1]) && m.cellRoom[c] === gR && m.cellBlock[c] < 0;
  });
  if (!goalPiece) return null;
  m.goalBlock = m.blocks.indexOf(goalPiece);
  m.goal = darkFront(goalPiece);
  reserved.add(m.goal[1] * W + m.goal[0]);
  // The sleeper: grandpa in his armchair, or the mummy in its sarcophagus.
  if (zR >= 0) {
    const sp = home ? darkPlace(m, m.rooms[zR], 'armchair', 1, 1, 'wall', rnd, reserved)
      : darkPlace(m, m.rooms[zR], 'sarco', 2, 1, 'mid', rnd, reserved) || darkPlace(m, m.rooms[zR], 'sarco', 2, 1, 'wall', rnd, reserved);
    if (sp) m.sleeper = m.blocks.indexOf(sp);
  }
  // The rest of the furniture, room by room.
  m.rooms.forEach(r => (DARK_FURNITURE[r.kind] || []).forEach(p => {
    if (r.w * r.h < 12 && p[3] === 'mid') return;
    if (p[0] === 'pillar') { if (r.w >= 4 && r.h >= 4) darkPlace(m, r, p[0], p[1], p[2], p[3], rnd, reserved, (b) => !m.blocks.some(o => o.k === 'pillar' && Math.abs(o.x - b.x) + Math.abs(o.y - b.y) < 3)); return; }
    darkPlace(m, r, p[0], p[1], p[2], p[3], rnd, reserved);
  }));
  darkPrep(m);
  if (darkReach(m, startCell)[m.goal[1] * W + m.goal[0]] !== 1) return null;

  // The still traps: many on the way itself (the guides have to earn it), never making the goal unreachable.
  const traps = DARK_TRAPS[story];
  const nearStart = new Set([startCell]);
  Object.keys(DARK_DIRS).forEach(k => { const d = DARK_DIRS[k]; const x = m.start[0] + d[0], y = m.start[1] + d[1]; if (darkIn(m, x, y)) nearStart.add(y * W + x); });
  const goalCell = m.goal[1] * W + m.goal[0];
  const banned = (c) => nearStart.has(c) || c === goalCell || reserved.has(c) || !darkFree(m, c) || m.trapAt.has(c);
  const still = new Set();
  const tryTrap = (k, c) => {
    if (banned(c) || still.has(c)) return false;
    still.add(c);
    if (!darkPath(m, startCell, goalCell, still)) { still.delete(c); return false; }
    m.traps.push({ k, x: c % W, y: Math.floor(c / W) });
    m.trapAt.set(c, m.traps.length - 1);
    return true;
  };
  // The one that belongs beside the sleeper: the creaky tile by grandpa, a plate by the sarcophagus.
  if (m.sleeper >= 0) {
    const s = m.blocks[m.sleeper];
    const ring = [];
    for (let y = s.y - 1; y <= s.y + s.h; y++) for (let x = s.x - 1; x <= s.x + s.w; x++) {
      const inside = x >= s.x && x < s.x + s.w && y >= s.y && y < s.y + s.h;
      const side = (x >= s.x && x < s.x + s.w) || (y >= s.y && y < s.y + s.h);
      if (!inside && side && darkIn(m, x, y) && m.cellRoom[y * W + x] === m.cellRoom[s.y * W + s.x]) ring.push(y * W + x);
    }
    for (const c of rnd.shuffle(ring)) if (tryTrap(traps.near, c)) break;
  }
  const sandRooms = m.rooms.map((r, i) => (r.kind === 'sand' ? i : -1)).filter(i => i >= 0);
  for (let n = 0, guard = 0; n < spec.still && guard < 200; guard++) {
    let k = traps.still[n % traps.still.length];
    let c;
    const way = darkPath(m, startCell, goalCell, still) || [];
    if (story === 'tomb' && sandRooms.length && rnd() < 0.6) {
      // The sand pits lie in the sand room.
      const r = m.rooms[rnd.pick(sandRooms)];
      c = (r.y + rnd.int(r.h)) * W + r.x + rnd.int(r.w);
      k = 'sand';
    } else if (way.length > 4 && rnd() < 0.55) c = way[1 + rnd.int(way.length - 2)];
    else c = rnd.int(W * H);
    if (tryTrap(k, c)) n++;
  }
  // The moving ones: a line to walk (the cat, the mummy; the ball), or one cell to swing over (the blade).
  const used = new Set([...still, ...nearStart, goalCell]);
  m.doors.forEach(d => { used.add(d[1] * W + d[0]); used.add(d[3] * W + d[2]); });
  const addLine = (k, min, max) => {
    const way = new Set(darkPath(m, startCell, goalCell, still) || []);
    const runs = darkRuns(m, used, min).filter(r => m.rooms[m.cellRoom[r[0]]].kind !== DARK_ROOMS[story].start);
    if (!runs.length) return false;
    // A line that crosses the way matters more.
    const crossing = runs.filter(r => r.some(c => way.has(c)));
    let run = rnd.pick(crossing.length && rnd() < 0.8 ? crossing : runs);
    if (run.length > max) { const s = rnd.int(run.length - max + 1); run = run.slice(s, s + max); }
    run.forEach(c => used.add(c));
    m.dyn.push({ k, path: run, step: DARK_STEP_TICKS[k] });
    return true;
  };
  for (let i = 0; i < spec.patrol; i++) addLine(traps.patrol, 3, 5);
  for (let i = 0; i < spec.roll; i++) {
    if (traps.roll === 'ball') { addLine('ball', 4, 7); continue; }
    // A blade over a cell of the way, swinging along it.
    const way = (darkPath(m, startCell, goalCell, still) || []).filter(c => !used.has(c));
    if (!way.length) continue;
    const c = way[rnd.int(way.length)];
    used.add(c);
    const x = c % W, y = Math.floor(c / W);
    const across = !darkBlocked(m, x, y, 1, 0) || !darkBlocked(m, x, y, -1, 0) ? 'x' : 'y';
    m.dyn.push({ k: 'blade', path: [c], step: 1, phase: rnd.int(DARK_BLADE.period), axis: across });
  }
  // Light: torches on the tomb's walls; the night-light and the window at home.
  m.torches = [];
  m.rooms.forEach(r => {
    const x = r.x + Math.floor(r.w / 2);
    if (r.y === 0 || darkWall(m, x, r.y - 1, x, r.y)) m.torches.push([x + 0.5, r.y + 0.08]);
  });
  const salon = m.rooms.find(r => r.kind === 'salon' && r.y === 0);
  m.window = salon ? [salon.x + Math.floor(salon.w / 2), 0] : null;
  return m;
}

/** Everything a level needs, for the page and the server, cached by its seed. */
const DARK_CACHE = new Map();
function darkMap(story, level, seed) {
  story = story === 'tomb' ? 'tomb' : 'home';
  level = Math.max(1, level | 0);
  const key = story + '|' + level + '|' + (seed >>> 0);
  const hit = DARK_CACHE.get(key);
  if (hit) return hit;
  let m = null;
  for (let a = 0; a < 40 && !m; a++) {
    const t = darkBuild(story, level, ((seed >>> 0) + a * 7919) >>> 0);
    if (!t) continue;
    darkPrep(t);
    // Too hard to walk: the last moving trap goes, then the still ones, until a way is found.
    while (darkSolve(t) < 0 && (t.dyn.length || t.traps.length)) {
      if (t.dyn.length) t.dyn.pop(); else { t.traps.pop(); darkPrep(t); }
    }
    if (darkSolve(t) >= 0) m = t;
  }
  if (!m) throw new Error('dark map');
  m.segs = darkSegs(m);
  m.solve = darkSolve(m);
  if (DARK_CACHE.size > 24) DARK_CACHE.delete(DARK_CACHE.keys().next().value);
  DARK_CACHE.set(key, m);
  return m;
}

/* --- the joystick: continuous walking, the same on the server and on a screen ---- */

/**
 * Moves a point body (DARK_BODY) from (x, y) by velocity (vx, vy) cells a second for
 * `dt` seconds, one axis at a time in small steps, stopping at walls and furniture.
 * Returns the new place, what stopped it (bump: '' or a kind), and every cell it
 * passed through in order.
 */
function darkAdvance(m, x, y, vx, vy, dt) {
  const len = Math.hypot(vx, vy);
  if (len > 1) { vx /= len; vy /= len; }
  const dist = Math.hypot(vx, vy) * DARK_SPEED * dt;
  const n = Math.max(1, Math.ceil(dist / 0.12));
  const sx = vx * DARK_SPEED * dt / n, sy = vy * DARK_SPEED * dt / n;
  let bump = '';
  const cells = [];
  const R = DARK_BODY;
  for (let i = 0; i < n; i++) {
    // x first
    if (sx) {
      const cx = Math.floor(x), cy = Math.floor(y);
      let nx = x + sx;
      const dir = sx > 0 ? 1 : -1;
      const edge = dir > 0 ? cx + 1 - R : cx + R;
      if ((dir > 0 && nx > edge) || (dir < 0 && nx < edge)) {
        const b = darkBlocked(m, cx, cy, dir, 0);
        if (b) { nx = dir > 0 ? Math.max(x, edge) : Math.min(x, edge); bump = bump || b; }   // already past it: stay, never back
      }
      x = nx;
    }
    if (sy) {
      const cx = Math.floor(x), cy = Math.floor(y);
      let ny = y + sy;
      const dir = sy > 0 ? 1 : -1;
      const edge = dir > 0 ? cy + 1 - R : cy + R;
      if ((dir > 0 && ny > edge) || (dir < 0 && ny < edge)) {
        const b = darkBlocked(m, cx, cy, 0, dir);
        if (b) { ny = dir > 0 ? Math.max(y, edge) : Math.min(y, edge); bump = bump || b; }
      }
      y = ny;
    }
    const c = Math.floor(y) * m.w + Math.floor(x);
    if (cells[cells.length - 1] !== c) cells.push(c);
  }
  return { x, y, bump, cells };
}

/** How big each guide's lens is (cells), by how many share the map: a lone guide sees it all. */
function darkLensR(m, guides) {
  if (guides <= 1) return 0;
  return Math.max(1.55, Math.sqrt(m.w * m.h * 0.5 / (Math.PI * guides)));
}
