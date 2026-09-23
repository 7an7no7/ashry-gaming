// ميني جولف - the holes and one putt, as plain arithmetic.
// Shared by the page and the rooms server, like بولينج: a putt is three
// whole numbers and a start time, and every phone and the server roll the
// ball through exactly the same steps (only + - * / and Math.sqrt / floor /
// abs / min / max, never Math.sin or Math.cos, which may differ in the last
// bit from one engine to another). A hole is x to the right and y away from
// the tee, in course units (one unit is about ten centimetres of a real
// course).
//
// What a hole can hold:
//   green     the playing surface (one polygon); its edges are rails
//   walls     more rails inside it, as segments
//   blocks    solid obstacles (a closed polygon each: a rock, the pyramid)
//   sand      bunkers: the ball slows hard
//   water     the ball goes back to where it was hit from, a stroke added
//   hills     a smooth hump (or a dip, push < 0) running along x or y
//   bowls     a round dip that pulls the ball to its middle
//   mills     a windmill: its tunnel's door shut while a sail hangs in front
//   sliders   a gate sliding to and fro
//   spinners  a bar turning round a post
// Every moving piece is on the hole's clock, which every phone shares: a putt
// carries t0, the clock in ms when it was hit.

const GOLF = {
  BALL_R: 0.22,
  CUP_R: 0.42,
  WALL_R: 0.13,           // half a rail's thickness
  MAX_SPEED: 24,
  GREEN: 3.0,             // how fast the green slows the ball, units/s²
  SAND: 13,
  STOP: 0.14,
  REST_SLOPE: 2.4,        // a ball stops only where the ground pulls less than this
  SINK_SPEED: 6.2,        // faster than this over the middle of the cup and it lips out (less at the rim)
  BOUNCE: 0.72,
  DT: 1 / 240,
  MAX_T: 14,
  CAP: 6,                 // strokes, then the ball is picked up and the hole counts CAP + 1
  PENALTY: 1
};

// The steepest a hump's profile gets (the largest of 32u(1-u)(1-2u)), and a bowl's (u(1-u²)).
const GOLF_HUMP_MAX = 3.0792;
const GOLF_BOWL_MAX = 0.3849;

/* --- the course -------------------------------------------------------------------
   Nine holes, played in order: a game of 3 plays the first three, of 6 the
   first six. Each is taller than wide, so it fills a phone held upright.
   Every hole is checked by rooms-worker/test/rules.mjs: a search finds a way
   into the cup within par + 1, and no ball can come to rest where the cup
   can't be reached from. */
const GOLF_HOLES = [
  {
    // A first straight putt, a round rock in the way.
    id: 'first', par: 2,
    tee: [4, 2], cup: [4, 16.5],
    green: [[0, 0], [8, 0], [8, 20], [0, 20]],
    blocks: [{ poly: [[4.924, 9.117], [4.924, 9.883], [4.383, 10.424], [3.617, 10.424], [3.076, 9.883], [3.076, 9.117], [3.617, 8.576], [4.383, 8.576]], look: 'rock' }]
  },
  {
    // The windmill: through the tunnel when no sail hangs in front of it, and
    // round the corner past the pond.
    id: 'mill', par: 3,
    tee: [3, 2], cup: [13, 22],
    green: [[0, 0], [6, 0], [6, 16], [16, 16], [16, 26], [0, 26]],
    blocks: [
      { poly: [[0, 9], [2, 9], [2, 10.6], [0, 10.6]], look: 'mill' },
      { poly: [[4, 9], [6, 9], [6, 10.6], [4, 10.6]], look: 'mill' }
    ],
    walls: [[8.4, 17.6, 9.8, 19.6]],
    sand: [[[10, 17], [12.4, 17.2], [12.6, 19.2], [10.8, 19.8], [9.8, 18.6]]],
    water: [[[0.9, 22.6], [3.6, 22.3], [4.3, 24], [3.2, 25.3], [0.9, 25.2]]],
    mills: [{ x: 3, y: 9, dir: 'y', half: 1, blades: 4, w: 1.3, phase: 0.3, shut: 0.17 }]
  },
  {
    // A narrow bridge over the water, the cup behind a bunker.
    id: 'bridge', par: 3,
    tee: [2.8, 2], cup: [3, 20.5],
    green: [[0, 0], [12, 0], [12, 24], [0, 24]],
    water: [
      [[0, 8], [3.4, 8], [5.8, 15], [0, 15]],
      [[6.2, 8], [12, 8], [12, 15], [8.6, 15]]
    ],
    sand: [[[5, 17.4], [7, 17.1], [7.6, 18.8], [5.8, 19.5], [4.8, 18.6]]]
  },
  {
    // Over the camel's two humps: too soft and it rolls back, too hard and it runs on.
    id: 'humps', par: 3,
    tee: [5, 2], cup: [6.6, 20.5],
    green: [[0, 0], [10, 0], [10, 25], [0, 25]],
    hills: [
      { x0: 0, y0: 5.5, x1: 10, y1: 10.5, axis: 'y', push: 4.4, h: 0.9 },
      { x0: 0, y0: 11.5, x1: 10, y1: 16.5, axis: 'y', push: 4.4, h: 0.9 }
    ],
    blocks: [
      { poly: [[6.6, 17.6], [6.6, 18.4], [6, 18.8], [5.4, 18.4], [5.4, 17.6], [6, 17.2]], look: 'rock' }
    ],
    sand: [[[4.4, 22.6], [8.6, 22.4], [9, 24], [4, 24.2]]]
  },
  {
    // The pyramid in the middle: round it, or off a side wall.
    id: 'pyramid', par: 3,
    tee: [7, 2], cup: [7, 22],
    green: [[0, 0], [14, 0], [14, 22], [10, 26], [4, 26], [0, 22]],
    blocks: [{ poly: [[7, 9.7], [9.8, 12.5], [7, 15.3], [4.2, 12.5]], look: 'pyramid' }],
    sand: [
      [[1, 4], [3.2, 3.6], [3.8, 5.6], [2.4, 6.8], [1, 6.2]],
      [[10.6, 17], [12.8, 16.6], [13.2, 18.6], [11.6, 19.4], [10.4, 18.6]]
    ]
  },
  {
    // The waterwheel's beam turning in the middle of the green.
    id: 'saqia', par: 3,
    tee: [6, 2], cup: [7.8, 20.5],
    green: [[0, 0], [12, 0], [12, 25], [0, 25]],
    spinners: [{ x: 6, y: 11.5, r: 2.8, w: 1.1, phase: 0.4 }],
    blocks: [{ poly: [[8.2, 17.3], [8.2, 18.1], [7.6, 18.5], [7, 18.1], [7, 17.3], [7.6, 16.9]], look: 'jar' }],
    water: [[[0.8, 5.6], [3.2, 5.2], [3.8, 7.8], [2.6, 9.2], [0.8, 8.8]]],
    sand: [[[2.2, 18.6], [4.6, 18.3], [5, 20.3], [2.8, 21]]]
  },
  {
    // Up the column and round the curved wall, the lighthouse at the corner.
    id: 'lighthouse', par: 3,
    tee: [3, 2], cup: [13.5, 18],
    green: [[0, 0], [6, 0], [6, 14], [16, 14], [16, 22], [8, 22], [6.439, 21.846], [4.939, 21.391], [3.555, 20.652],
      [2.343, 19.657], [1.348, 18.445], [0.609, 17.061], [0.154, 15.561], [0, 14]],
    sand: [[[9.4, 14.4], [11.4, 14.4], [11.6, 15.6], [9.6, 15.8]]],
    blocks: [{ poly: [[6, 14], [7.2, 14], [6, 15.2]], look: 'rock' }]
  },
  {
    // The gate: a door sliding in the gap between two towers.
    id: 'gate', par: 3,
    tee: [5, 2], cup: [5, 20],
    green: [[0, 0], [10, 0], [10, 24], [0, 24]],
    blocks: [
      { poly: [[0, 11.4], [2, 11.4], [2, 12.6], [0, 12.6]], look: 'tower' },
      { poly: [[8, 11.4], [10, 11.4], [10, 12.6], [8, 12.6]], look: 'tower' }
    ],
    sliders: [{ x: 5, y: 12, len: 2.4, axis: 'x', travel: 0.9, period: 3.2, phase: 0 }],
    sand: [[[6.6, 16.6], [8.8, 16.8], [9, 18.6], [7, 18.8]]]
  },
  {
    // The oasis: up, across past the pond, and up to a cup in a hollow.
    id: 'oasis', par: 4,
    tee: [11, 2], cup: [3.5, 24],
    green: [[8, 0], [14, 0], [14, 18], [7, 18], [7, 28], [0, 28], [0, 10], [8, 10]],
    water: [[[5.4, 12.6], [7.6, 12.1], [9.6, 12.8], [10, 14.6], [8.4, 15.9], [6, 15.8], [5, 14.6]]],
    sand: [
      [[8.6, 5.8], [10.2, 5.4], [10.8, 7.2], [9.2, 7.8]],
      [[4.8, 19.6], [6.4, 20], [6.2, 21.6], [4.8, 21.4]]
    ],
    bowls: [{ x: 3.5, y: 24, r: 2.4, pull: 2.2, h: 0.4 }]
  }
];

const GOLF_HOLE_COUNTS = [3, 6, 9];

/** The par of the first `n` holes. */
function golfParOf(n) {
  let p = 0;
  for (let i = 0; i < n && i < GOLF_HOLES.length; i++) p += GOLF_HOLES[i].par;
  return p;
}

function golfInPoly(x, y, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i][0], yi = poly[i][1], xj = poly[j][0], yj = poly[j][1];
    if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

// sin and cos from a polynomial (a spinner's bar): the same bits on every engine.
function golfSinCos(a) {
  const TWO_PI = 6.283185307179586, PI = 3.141592653589793, HALF = 1.5707963267948966;
  const k = Math.floor(a / TWO_PI + 0.5);
  let x = a - k * TWO_PI, sc = 1;
  if (x > HALF) { x = PI - x; sc = -1; } else if (x < -HALF) { x = -PI - x; sc = -1; }
  const x2 = x * x;
  const s = x * (1 + x2 * (-1 / 6 + x2 * (1 / 120 + x2 * (-1 / 5040 + x2 * (1 / 362880 + x2 * (-1 / 39916800))))));
  const c = 1 + x2 * (-1 / 2 + x2 * (1 / 24 + x2 * (-1 / 720 + x2 * (1 / 40320 + x2 * (-1 / 3628800 + x2 / 479001600)))));
  return [s, sc * c];
}

/** Every fixed rail of a hole as a segment: the green's edges, the walls, the blocks' edges. Kept per hole. */
const GOLF_SEGS = {};
function golfSegs(h) {
  if (GOLF_SEGS[h.id]) return GOLF_SEGS[h.id];
  const out = [];
  const loop = (poly) => { for (let i = 0; i < poly.length; i++) { const a = poly[i], b = poly[(i + 1) % poly.length]; out.push([a[0], a[1], b[0], b[1]]); } };
  loop(h.green);
  (h.walls || []).forEach(w => out.push(w.slice()));
  (h.blocks || []).forEach(b => loop(b.poly));
  GOLF_SEGS[h.id] = out;
  return out;
}

// Is a windmill's door shut at time t (seconds on the hole's clock)? A blade
// hangs down every 2π/blades of turn; the door is shut while one is within
// a blade's width of hanging straight down. No sin or cos needed.
function golfMillShut(m, t) {
  const TWO_PI = 6.283185307179586;
  const per = TWO_PI / m.blades;
  let a = m.phase + m.w * t;
  a = a - Math.floor(a / per) * per;           // 0..per
  const off = a < per / 2 ? a : per - a;       // distance from hanging down
  return off < (m.shut || 0.2);
}
function golfMillAngle(m, t) { return m.phase + m.w * t; }

/** A slider's middle at time t: to and fro along its axis, easing at each end. */
function golfSliderAt(sl, t) {
  let p = t / sl.period + sl.phase;
  p = p - Math.floor(p);
  const q = p < 0.5 ? 1 - 2 * p : 2 * p - 1;        // 1 → 0 → 1
  const e = q * q * (3 - 2 * q);                     // eased
  const off = sl.travel * (2 * e - 1);
  return sl.axis === 'x' ? [sl.x + off, sl.y] : [sl.x, sl.y + off];
}
function golfSliderSeg(sl, t) {
  const c = golfSliderAt(sl, t), hl = sl.len / 2;
  return sl.axis === 'x' ? [c[0] - hl, c[1], c[0] + hl, c[1]] : [c[0], c[1] - hl, c[0], c[1] + hl];
}
/** A spinner's bar at time t: its two ends. */
function golfSpinnerSeg(sp, t) {
  const sc = golfSinCos(sp.phase + sp.w * t);
  const dx = sc[1] * sp.r, dy = sc[0] * sp.r;
  return [sp.x - dx, sp.y - dy, sp.x + dx, sp.y + dy];
}
function golfSpinnerAngle(sp, t) { return sp.phase + sp.w * t; }

/** How high the ground is (display units; hills up, bowls down). The rules only use its slope. */
function golfHeight(h, x, y) {
  let z = 0;
  (h.hills || []).forEach(hl => {
    if (x < hl.x0 || x > hl.x1 || y < hl.y0 || y > hl.y1) return;
    const u = hl.axis === 'y' ? (y - hl.y0) / (hl.y1 - hl.y0) : (x - hl.x0) / (hl.x1 - hl.x0);
    const b = u * (1 - u);
    z += (hl.push < 0 ? -1 : 1) * hl.h * 16 * b * b;
  });
  (h.bowls || []).forEach(bw => {
    const dx = x - bw.x, dy = y - bw.y;
    const d2 = (dx * dx + dy * dy) / (bw.r * bw.r);
    if (d2 >= 1) return;
    z -= bw.h * (1 - d2) * (1 - d2);
  });
  return z;
}

/** The ground's pull at a point: hills and bowls (and any plain slope polygons). */
function golfPull(h, x, y) {
  let ax = 0, ay = 0;
  const slopes = h.slopes || [];
  for (let i = 0; i < slopes.length; i++) if (golfInPoly(x, y, slopes[i].poly)) { ax += slopes[i].ax; ay += slopes[i].ay; }
  const hills = h.hills || [];
  for (let i = 0; i < hills.length; i++) {
    const hl = hills[i];
    if (x < hl.x0 || x > hl.x1 || y < hl.y0 || y > hl.y1) continue;
    const u = hl.axis === 'y' ? (y - hl.y0) / (hl.y1 - hl.y0) : (x - hl.x0) / (hl.x1 - hl.x0);
    const a = -hl.push * (32 * u * (1 - u) * (1 - 2 * u)) / GOLF_HUMP_MAX;   // downhill
    if (hl.axis === 'y') ay += a; else ax += a;
  }
  const bowls = h.bowls || [];
  for (let i = 0; i < bowls.length; i++) {
    const bw = bowls[i];
    const dx = bw.x - x, dy = bw.y - y;
    const d = Math.sqrt(dx * dx + dy * dy);
    if (d >= bw.r || d < 1e-6) continue;
    const u = d / bw.r;
    const a = bw.pull * u * (1 - u * u) / GOLF_BOWL_MAX;
    ax += dx / d * a; ay += dy / d * a;
  }
  return [ax, ay];
}

function golfCleanShot(s) {
  const n = (v, lo, hi) => Math.max(lo, Math.min(hi, Math.round(Number(v) || 0)));
  let dx = n(s && s.dx, -1000, 1000), dy = n(s && s.dy, -1000, 1000);
  if (dx === 0 && dy === 0) dy = 1000;
  return { dx, dy, power: n(s && s.power, 20, 1000), t0: n(s && s.t0, 0, 3600000) };
}

// from: where the ball lies. shot.t0 is the hole's clock in ms at the putt.
function golfStart(hole, from, shot) {
  shot = golfCleanShot(shot);
  const l = Math.sqrt(shot.dx * shot.dx + shot.dy * shot.dy);
  const v = GOLF.MAX_SPEED * shot.power / 1000;
  return {
    hole, shot, t: 0,
    x: from[0], y: from[1], sx: from[0], sy: from[1],
    vx: shot.dx / l * v, vy: shot.dy / l * v,
    roll: 0,
    end: null,            // 'rest' | 'cup' | 'water'
    lip: 0,
    sand: false,          // on sand this step (for the puff on screen)
    hits: 0               // rails and pieces hit (for the knock on screen)
  };
}

// A rail against the ball. (wvx, wvy) is how the rail itself moves at the
// point of contact, for a moving piece; 0 for a fixed rail.
function golfSegHit(sim, x1, y1, x2, y2, rr, wvx, wvy) {
  const ex = x2 - x1, ey = y2 - y1;
  const len2 = ex * ex + ey * ey;
  let u = len2 ? ((sim.x - x1) * ex + (sim.y - y1) * ey) / len2 : 0;
  u = u < 0 ? 0 : u > 1 ? 1 : u;
  const px = x1 + ex * u, py = y1 + ey * u;
  const dx = sim.x - px, dy = sim.y - py;
  const d2 = dx * dx + dy * dy;
  if (d2 >= rr * rr) return false;
  const d = Math.sqrt(d2) || 1e-6, nx = dx / d, ny = dy / d;
  sim.x = px + nx * rr; sim.y = py + ny * rr;
  const wx = wvx || 0, wy = wvy || 0;
  const vn = (sim.vx - wx) * nx + (sim.vy - wy) * ny;
  if (vn < 0) {
    sim.vx -= (1 + GOLF.BOUNCE) * vn * nx; sim.vy -= (1 + GOLF.BOUNCE) * vn * ny;
    sim.hits++;
  }
  return true;
}

/** Is the ball where a moving piece will reach it? Then it isn't allowed to stop there. */
function golfInSweep(h, x, y) {
  const rr = GOLF.BALL_R + GOLF.WALL_R;
  const mills = h.mills || [];
  for (let i = 0; i < mills.length; i++) {
    const m = mills[i];
    const along = m.dir === 'y' ? x - m.x : y - m.y, across = m.dir === 'y' ? y - m.y : x - m.x;
    if (Math.abs(across) < rr - 0.02 && Math.abs(along) < m.half) return true;
  }
  const sliders = h.sliders || [];
  for (let i = 0; i < sliders.length; i++) {
    const sl = sliders[i];
    const along = sl.axis === 'x' ? x - sl.x : y - sl.y, across = sl.axis === 'x' ? y - sl.y : x - sl.x;
    if (Math.abs(across) < rr - 0.02 && Math.abs(along) < sl.travel + sl.len / 2) return true;
  }
  const spinners = h.spinners || [];
  for (let i = 0; i < spinners.length; i++) {
    const sp = spinners[i];
    const dx = x - sp.x, dy = y - sp.y;
    const reach = sp.r + rr - 0.02;
    if (dx * dx + dy * dy < reach * reach) return true;
  }
  return false;
}

function golfStep(sim) {
  if (sim.end) return;
  const h = sim.hole, dt = GOLF.DT;
  sim.t += dt;
  const clock = sim.shot.t0 / 1000 + sim.t;

  const pull = golfPull(h, sim.x, sim.y);
  const ax = pull[0], ay = pull[1];
  const slope = Math.sqrt(ax * ax + ay * ay);
  let drag = GOLF.GREEN;
  sim.sand = false;
  const sand = h.sand || [];
  for (let i = 0; i < sand.length; i++) if (golfInPoly(sim.x, sim.y, sand[i])) { drag = GOLF.SAND; sim.sand = true; }

  sim.vx += ax * dt; sim.vy += ay * dt;
  const sp = Math.sqrt(sim.vx * sim.vx + sim.vy * sim.vy);
  if (sp > 0) {
    const k = sp > drag * dt ? (sp - drag * dt) / sp : 0;
    sim.vx *= k; sim.vy *= k;
  }
  sim.x += sim.vx * dt; sim.y += sim.vy * dt;
  sim.roll += sp * dt / GOLF.BALL_R;

  const rr = GOLF.BALL_R + GOLF.WALL_R;
  const segs = golfSegs(h);
  for (let i = 0; i < segs.length; i++) { const w = segs[i]; golfSegHit(sim, w[0], w[1], w[2], w[3], rr, 0, 0); }
  const mills = h.mills || [];
  for (let i = 0; i < mills.length; i++) {
    const m = mills[i];
    if (!golfMillShut(m, clock)) continue;
    if (m.dir === 'y') golfSegHit(sim, m.x - m.half, m.y, m.x + m.half, m.y, rr, 0, 0);
    else golfSegHit(sim, m.x, m.y - m.half, m.x, m.y + m.half, rr, 0, 0);
  }
  const sliders = h.sliders || [];
  for (let i = 0; i < sliders.length; i++) {
    const sl = sliders[i];
    const s1 = golfSliderSeg(sl, clock), c0 = golfSliderAt(sl, clock - dt), c1 = golfSliderAt(sl, clock);
    golfSegHit(sim, s1[0], s1[1], s1[2], s1[3], rr, (c1[0] - c0[0]) / dt, (c1[1] - c0[1]) / dt);
  }
  const spinners = h.spinners || [];
  for (let i = 0; i < spinners.length; i++) {
    const spn = spinners[i];
    const s1 = golfSpinnerSeg(spn, clock);
    // The bar's own speed where it meets the ball: ω × r.
    const rx = sim.x - spn.x, ry = sim.y - spn.y;
    golfSegHit(sim, s1[0], s1[1], s1[2], s1[3], rr, -spn.w * ry, spn.w * rx);
  }

  const water = h.water || [];
  for (let i = 0; i < water.length; i++) {
    if (golfInPoly(sim.x, sim.y, water[i])) { sim.end = 'water'; sim.vx = sim.vy = 0; return; }
  }

  // the cup: slow enough and it drops; too fast and it rattles out. Over the
  // middle of the cup it takes a firmer ball than across its rim.
  const cx = sim.x - h.cup[0], cy = sim.y - h.cup[1];
  const cd2 = cx * cx + cy * cy;
  const sp2 = Math.sqrt(sim.vx * sim.vx + sim.vy * sim.vy);
  if (cd2 < GOLF.CUP_R * GOLF.CUP_R) {
    if (sp2 < GOLF.SINK_SPEED * (1 - 0.55 * cd2 / (GOLF.CUP_R * GOLF.CUP_R))) { sim.end = 'cup'; sim.x = h.cup[0]; sim.y = h.cup[1]; sim.vx = sim.vy = 0; return; }
    if (!sim.lip) { sim.lip = 1; sim.vx *= 0.7; sim.vy *= 0.7; }
  } else if (sim.lip && cd2 > (GOLF.CUP_R + 0.3) * (GOLF.CUP_R + 0.3)) sim.lip = 0;

  if (sp2 < GOLF.STOP && slope < GOLF.REST_SLOPE && !golfInSweep(h, sim.x, sim.y)) { sim.end = 'rest'; sim.vx = sim.vy = 0; return; }
  if (sim.t >= GOLF.MAX_T) { sim.end = 'rest'; sim.vx = sim.vy = 0; }
}

function golfRun(hole, from, shot) {
  const sim = golfStart(hole, from, shot);
  while (!sim.end) golfStep(sim);
  return sim;
}

// One putt from start to finish: where the ball lies after it, and how it ended.
// In the water the ball goes back to where it was hit from, a stroke added.
function golfPutt(hole, from, shot) {
  const sim = golfRun(hole, from, shot);
  if (sim.end === 'water') return { end: 'water', at: [from[0], from[1]], strokes: 1 + GOLF.PENALTY, t: sim.t, wet: [Math.round(sim.x * 1000) / 1000, Math.round(sim.y * 1000) / 1000] };
  return { end: sim.end, at: [Math.round(sim.x * 1000) / 1000, Math.round(sim.y * 1000) / 1000], strokes: 1, t: sim.t };
}

/* --- the way to the cup ------------------------------------------------------------
   A grid over the hole, every square the ball could lie on, and how far each
   is from the cup going round rails, blocks and water (moving pieces are left
   out: they open again). The clock's gentle putt aims along it, and the tests
   use it to judge how close a putt got. */
const GOLF_FIELD = {};
const GOLF_CELL = 0.5;

/** Could the ball lie here: on the green, dry, clear of every rail and block. */
function golfOpen(h, x, y) {
  if (!golfInPoly(x, y, h.green)) return false;
  const water = h.water || [];
  for (let i = 0; i < water.length; i++) if (golfInPoly(x, y, water[i])) return false;
  const blocks = h.blocks || [];
  for (let i = 0; i < blocks.length; i++) if (golfInPoly(x, y, blocks[i].poly)) return false;
  const rr = GOLF.BALL_R + GOLF.WALL_R - 0.02;
  const segs = golfSegs(h);
  for (let i = 0; i < segs.length; i++) {
    const w = segs[i];
    const ex = w[2] - w[0], ey = w[3] - w[1], len2 = ex * ex + ey * ey;
    let u = len2 ? ((x - w[0]) * ex + (y - w[1]) * ey) / len2 : 0;
    u = u < 0 ? 0 : u > 1 ? 1 : u;
    const dx = x - (w[0] + ex * u), dy = y - (w[1] + ey * u);
    if (dx * dx + dy * dy < rr * rr) return false;
  }
  return true;
}

function golfField(h) {
  if (GOLF_FIELD[h.id]) return GOLF_FIELD[h.id];
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  h.green.forEach(p => { x0 = Math.min(x0, p[0]); y0 = Math.min(y0, p[1]); x1 = Math.max(x1, p[0]); y1 = Math.max(y1, p[1]); });
  const c = GOLF_CELL;
  const cols = Math.floor((x1 - x0) / c) + 1, rows = Math.floor((y1 - y0) / c) + 1;
  const open = new Array(cols * rows);
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) open[j * cols + i] = golfOpen(h, x0 + (i + 0.5) * c, y0 + (j + 0.5) * c);
  const dist = new Array(cols * rows).fill(Infinity);
  const f = { x0, y0, cols, rows, open, dist };
  // Dijkstra from the cup's square, eight ways round.
  const ci = Math.min(cols - 1, Math.max(0, Math.floor((h.cup[0] - x0) / c)));
  const cj = Math.min(rows - 1, Math.max(0, Math.floor((h.cup[1] - y0) / c)));
  const heap = [];
  const push = (d, k) => {
    heap.push([d, k]);
    let i = heap.length - 1;
    while (i > 0) { const p = (i - 1) >> 1; if (heap[p][0] <= heap[i][0]) break; const t = heap[p]; heap[p] = heap[i]; heap[i] = t; i = p; }
  };
  const pop = () => {
    const top = heap[0], last = heap.pop();
    if (heap.length) {
      heap[0] = last;
      let i = 0;
      for (;;) {
        const l = 2 * i + 1, r = l + 1;
        let m = i;
        if (l < heap.length && heap[l][0] < heap[m][0]) m = l;
        if (r < heap.length && heap[r][0] < heap[m][0]) m = r;
        if (m === i) break;
        const t = heap[m]; heap[m] = heap[i]; heap[i] = t; i = m;
      }
    }
    return top;
  };
  const start = cj * cols + ci;
  dist[start] = 0;
  push(0, start);
  const DIAG = 1.4142135623730951 * c;
  while (heap.length) {
    const top = pop();
    const d = top[0], k = top[1];
    if (d > dist[k]) continue;
    const i = k % cols, j = (k - i) / cols;
    for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
      if (!di && !dj) continue;
      const ni = i + di, nj = j + dj;
      if (ni < 0 || nj < 0 || ni >= cols || nj >= rows) continue;
      const nk = nj * cols + ni;
      if (!open[nk]) continue;
      if (di && dj && (!open[j * cols + ni] || !open[nj * cols + i])) continue;
      const nd = d + (di && dj ? DIAG : c);
      if (nd < dist[nk]) { dist[nk] = nd; push(nd, nk); }
    }
  }
  GOLF_FIELD[h.id] = f;
  return f;
}

/** How far a point is from the cup, round everything in the way (Infinity: the cup can't be reached from there). */
function golfDistance(h, x, y) {
  const f = golfField(h), c = GOLF_CELL;
  const i = Math.floor((x - f.x0) / c), j = Math.floor((y - f.y0) / c);
  let best = Infinity;
  for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
    const ni = i + di, nj = j + dj;
    if (ni < 0 || nj < 0 || ni >= f.cols || nj >= f.rows) continue;
    const k = nj * f.cols + ni;
    if (!f.open[k] || f.dist[k] === Infinity) continue;
    const cx = f.x0 + (ni + 0.5) * c - x, cy = f.y0 + (nj + 0.5) * c - y;
    best = Math.min(best, f.dist[k] + Math.sqrt(cx * cx + cy * cy));
  }
  return best;
}

/** Can a ball roll straight from a to b without meeting a rail, a block or the water? */
function golfClearLine(h, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay;
  const n = Math.max(1, Math.ceil(Math.sqrt(dx * dx + dy * dy) / 0.2));
  for (let k = 1; k <= n; k++) if (!golfOpen(h, ax + dx * k / n, ay + dy * k / n)) return false;
  return true;
}

/**
 * The phone's putt for a player whose clock ran out (or the host's "play for"):
 * gently toward the cup - straight at it when nothing is in the way, else at the
 * farthest-along point in sight - with only as much as it needs to get there.
 */
function golfAutoShot(h, at, t0) {
  const f = golfField(h), c = GOLF_CELL;
  let tx = h.cup[0], ty = h.cup[1], toCup = golfClearLine(h, at[0], at[1], tx, ty);
  if (!toCup) {
    let best = golfDistance(h, at[0], at[1]), found = false;
    for (let j = 0; j < f.rows; j++) for (let i = 0; i < f.cols; i++) {
      const k = j * f.cols + i;
      if (!f.open[k] || f.dist[k] >= best - 0.25) continue;
      const x = f.x0 + (i + 0.5) * c, y = f.y0 + (j + 0.5) * c;
      const ex = x - at[0], ey = y - at[1];
      if (ex * ex + ey * ey > 100) continue;
      if (!golfClearLine(h, at[0], at[1], x, y)) continue;
      best = f.dist[k]; tx = x; ty = y; found = true;
    }
    if (!found) { tx = h.cup[0]; ty = h.cup[1]; }
  }
  const dx = tx - at[0], dy = ty - at[1];
  const d = Math.sqrt(dx * dx + dy * dy) || 1;
  const reach = Math.min(toCup ? d + 0.6 : d, 12);
  const v = Math.sqrt(2 * GOLF.GREEN * reach);
  return {
    dx: Math.round(dx / d * 1000), dy: Math.round(dy / d * 1000),
    power: Math.max(40, Math.min(700, Math.round(v / GOLF.MAX_SPEED * 1000))),
    t0: Math.max(0, Math.round(Number(t0) || 0))
  };
}

/** A hole's score in words: 'ace', 'albatross', 'eagle', 'birdie', 'par', 'bogey', 'double', 'more'. */
function golfScoreWord(strokes, par) {
  if (strokes === 1) return 'ace';
  const d = strokes - par;
  if (d <= -3) return 'albatross';
  if (d === -2) return 'eagle';
  if (d === -1) return 'birdie';
  if (d === 0) return 'par';
  if (d === 1) return 'bogey';
  if (d === 2) return 'double';
  return 'more';
}
