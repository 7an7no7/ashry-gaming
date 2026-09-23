// ميني جولف - the holes and one putt, as plain arithmetic.
// Shared by the page and the rooms server, like بولينج: a putt is three
// whole numbers and a start time, and every phone and the server roll the
// ball through exactly the same steps (only + - * / and Math.sqrt / floor /
// abs / min / max). A hole is x to the right and y away from the tee, in
// course units (one unit is about ten centimetres of a real course).

const GOLF = {
  BALL_R: 0.22,
  CUP_R: 0.42,
  WALL_R: 0.13,           // half a rail's thickness
  MAX_SPEED: 24,
  GREEN: 3.0,             // how fast the green slows the ball, units/s²
  SAND: 13,
  STOP: 0.14,
  SINK_SPEED: 7.5,        // faster than this over the cup and it lips out
  DT: 1 / 240,
  MAX_T: 14,
  CAP: 6,                 // strokes, then the ball is picked up and the hole counts CAP + 1
  PENALTY: 1
};

// The course. Every hole is walls (segments), the green (one polygon), and
// what is on it. Moving pieces are windmills: a tunnel whose door is shut
// while a blade hangs in front of it, on a clock every phone shares.
const GOLF_HOLES = [
  {
    id: 'mill', par: 3,
    tee: [3, 2], cup: [13, 22],
    green: [[0, 0], [6, 0], [6, 16], [16, 16], [16, 26], [0, 26]],
    walls: [
      [0, 0, 6, 0], [6, 0, 6, 16], [6, 16, 16, 16], [16, 16, 16, 26], [16, 26, 0, 26], [0, 26, 0, 0],
      // the windmill's front and back, with a tunnel between
      [0, 9, 2.2, 9], [3.8, 9, 6, 9], [0, 10.6, 2.2, 10.6], [3.8, 10.6, 6, 10.6],
      [2.2, 9, 2.2, 10.6], [3.8, 9, 3.8, 10.6],
      // a rail to bank off on the way to the cup
      [8.4, 17.6, 9.8, 19.6]
    ],
    sand: [[[10, 17], [12.4, 17.2], [12.6, 19.2], [10.8, 19.8], [9.8, 18.6]]],
    water: [[[1.2, 19.4], [4.6, 19], [5.4, 22.4], [3.6, 24.8], [1.2, 24]]],
    slopes: [{ poly: [[0, 12], [6, 12], [6, 15], [0, 15]], ax: 0, ay: -3.2 }],
    mills: [{ x: 3, y: 9, dir: 'y', half: 0.8, blades: 4, w: 1.5, phase: 0.3 }]
  }
];

function golfInPoly(x, y, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i][0], yi = poly[i][1], xj = poly[j][0], yj = poly[j][1];
    if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
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
  return off < 0.2;
}
function golfMillAngle(m, t) { return m.phase + m.w * t; }

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
    lip: 0
  };
}

function golfSegHit(sim, x1, y1, x2, y2, rr) {
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
  const vn = sim.vx * nx + sim.vy * ny;
  if (vn < 0) {
    sim.vx -= (1 + 0.72) * vn * nx; sim.vy -= (1 + 0.72) * vn * ny;
    sim.bounces = (sim.bounces || 0) + 1;
  }
  return true;
}

function golfStep(sim) {
  if (sim.end) return;
  const h = sim.hole, dt = GOLF.DT;
  sim.t += dt;
  const clock = sim.shot.t0 / 1000 + sim.t;

  let ax = 0, ay = 0, slope = 0;
  for (const s of h.slopes || []) if (golfInPoly(sim.x, sim.y, s.poly)) { ax += s.ax; ay += s.ay; slope = Math.sqrt(ax * ax + ay * ay); }
  let drag = GOLF.GREEN;
  for (const p of h.sand || []) if (golfInPoly(sim.x, sim.y, p)) drag = GOLF.SAND;

  sim.vx += ax * dt; sim.vy += ay * dt;
  const sp = Math.sqrt(sim.vx * sim.vx + sim.vy * sim.vy);
  if (sp > 0) {
    const k = sp > drag * dt ? (sp - drag * dt) / sp : 0;
    sim.vx *= k; sim.vy *= k;
  }
  sim.x += sim.vx * dt; sim.y += sim.vy * dt;
  sim.roll += sp * dt / GOLF.BALL_R;

  const rr = GOLF.BALL_R + GOLF.WALL_R;
  for (const w of h.walls) golfSegHit(sim, w[0], w[1], w[2], w[3], rr);
  for (const m of h.mills || []) {
    if (!golfMillShut(m, clock)) continue;
    if (m.dir === 'y') golfSegHit(sim, m.x - m.half, m.y, m.x + m.half, m.y, rr);
    else golfSegHit(sim, m.x, m.y - m.half, m.x, m.y + m.half, rr);
  }

  for (const p of h.water || []) {
    if (golfInPoly(sim.x, sim.y, p)) { sim.end = 'water'; sim.vx = sim.vy = 0; return; }
  }

  // the cup: slow enough and it drops; too fast and it rattles out
  const cx = sim.x - h.cup[0], cy = sim.y - h.cup[1];
  const cd2 = cx * cx + cy * cy;
  const sp2 = Math.sqrt(sim.vx * sim.vx + sim.vy * sim.vy);
  if (cd2 < GOLF.CUP_R * GOLF.CUP_R) {
    if (sp2 < GOLF.SINK_SPEED) { sim.end = 'cup'; sim.x = h.cup[0]; sim.y = h.cup[1]; sim.vx = sim.vy = 0; return; }
    if (!sim.lip) { sim.lip = 1; sim.vx *= 0.7; sim.vy *= 0.7; }
  } else if (sim.lip && cd2 > (GOLF.CUP_R + 0.3) * (GOLF.CUP_R + 0.3)) sim.lip = 0;

  if (sp2 < GOLF.STOP && slope < 2.4) { sim.end = 'rest'; sim.vx = sim.vy = 0; return; }
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
  if (sim.end === 'water') return { end: 'water', at: [from[0], from[1]], strokes: 1 + GOLF.PENALTY, t: sim.t };
  return { end: sim.end, at: [Math.round(sim.x * 1000) / 1000, Math.round(sim.y * 1000) / 1000], strokes: 1, t: sim.t };
}

