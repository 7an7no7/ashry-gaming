// بولينج - the lane, the pins and one throw, as plain arithmetic.
// Shared by the page and the rooms server: a throw is a few whole numbers,
// and every phone and the server run exactly the same steps from them. Only
// + - * / and Math.sqrt / floor / abs / min / max are used, so every
// JavaScript engine gets the same pins down.
//
// Units are metres and seconds. The lane runs along +y from the foul line
// (y = 0) to the pins; x is across, negative on the bowler's left.

const BOWL = {
  LANE_HALF: 0.527,      // 41.5in / 2
  GUTTER: 0.235,
  HEAD_Y: 18.29,         // the head pin, 60ft from the foul line
  DECK_END: 19.25,       // the back of the pin deck
  PIT_Y: 19.8,
  KICK_Y: 17.9,          // the kickbacks start here
  BALL_R: 0.109,
  PIN_R: 0.0605,
  PIN_HEAD: 0.30,        // from the base to where a falling pin's head hits
  HEAD_R: 0.034,
  BALL_M: 7,
  PIN_M: 1.55,
  OIL_END: 12.2,
  DT: 1 / 240,
  MAX_T: 8,
  START_Y: 0.35
};

// Pins 1-10 as a bowler numbers them: 1 the head pin, 7 at the back left.
function bowlPinSpots() {
  const s = 0.3048, r = 0.264;
  const h = BOWL.HEAD_Y;
  return [
    [0, h],
    [-s / 2, h + r], [s / 2, h + r],
    [-s, h + 2 * r], [0, h + 2 * r], [s, h + 2 * r],
    [-1.5 * s, h + 3 * r], [-s / 2, h + 3 * r], [s / 2, h + 3 * r], [1.5 * s, h + 3 * r]
  ];
}

// sin and cos from a polynomial: Math.sin may differ in the last bit from
// one engine to the next, and a pin that falls one way on the server must
// fall the same way on every phone.
function bowlSinCos(a) {
  const TWO_PI = 6.283185307179586, PI = 3.141592653589793, HALF = 1.5707963267948966;
  const k = Math.floor(a / TWO_PI + 0.5);
  let x = a - k * TWO_PI, sc = 1;
  if (x > HALF) { x = PI - x; sc = -1; } else if (x < -HALF) { x = -PI - x; sc = -1; }
  const x2 = x * x;
  const s = x * (1 + x2 * (-1 / 6 + x2 * (1 / 120 + x2 * (-1 / 5040 + x2 * (1 / 362880 + x2 * (-1 / 39916800))))));
  const c = 1 + x2 * (-1 / 2 + x2 * (1 / 24 + x2 * (-1 / 720 + x2 * (1 / 40320 + x2 * (-1 / 3628800 + x2 / 479001600)))));
  return [s, sc * c];
}

// A throw, as whole numbers so it travels and compares exactly:
//   x     where it is let go, in cm from the middle (-40..40)
//   aim   sideways speed per 1000 of the ball's speed (-110..110)
//   speed cm/s (380..1000)
//   spin  -100..100, the hook once the oil runs out (+ hooks right)
function bowlCleanShot(s) {
  const n = (v, lo, hi) => Math.max(lo, Math.min(hi, Math.round(Number(v) || 0)));
  return { x: n(s && s.x, -40, 40), aim: n(s && s.aim, -110, 110), speed: n(s && s.speed, 380, 1000), spin: n(s && s.spin, -100, 100) };
}

// standing: ten booleans, the pins up before this ball.
function bowlStart(standing, shot) {
  shot = bowlCleanShot(shot);
  const v = shot.speed / 100, vx = v * shot.aim / 1000;
  const spots = bowlPinSpots();
  return {
    t: 0,
    shot,
    ball: { x: shot.x / 100, y: BOWL.START_Y, vx, vy: Math.sqrt(v * v - vx * vx), roll: 0, gutter: 0, gone: false },
    pins: spots.map(([x, y], i) => ({
      n: i + 1, x, y, vx: 0, vy: 0,
      up: !!standing[i],       // standing when the ball was thrown
      state: standing[i] ? 0 : 3, // 0 standing, 1 falling, 2 down, 3 not in play
      tilt: 0, tw: 0, dx: 0, dy: 1, wob: 0, wobT: 0, spinZ: 0
    })),
    hits: 0,
    done: false
  };
}

function bowlCircles(sim) {
  // every circle that can be hit: each pin's base, and a falling pin's head
  const out = [];
  for (const p of sim.pins) {
    if (p.state === 3 || p.gone) continue;
    out.push({ p, x: p.x, y: p.y, r: BOWL.PIN_R, head: false });
    if (p.state > 0 && p.tilt > 0.35) {
      const [s] = bowlSinCos(p.tilt);
      out.push({ p, x: p.x + p.dx * BOWL.PIN_HEAD * s, y: p.y + p.dy * BOWL.PIN_HEAD * s, r: BOWL.HEAD_R, head: true });
    }
  }
  return out;
}

function bowlKnock(p, dv, nx, ny) {
  if (p.state === 0) {
    if (dv > 0.42) {
      p.state = 1;
      const l = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
      if (l > 0.05) { p.dx = p.vx / l; p.dy = p.vy / l; } else { p.dx = nx; p.dy = ny; }
      p.tilt = 0.06;
      p.tw = 1.6 + dv * 1.8;
      p.spinZ = (nx * 3.1 - ny * 1.7) * dv;
    } else if (dv > 0.08) {
      p.wob = Math.min(0.22, p.wob + dv * 0.4);
      p.wobT = 0;
      p.dx = nx; p.dy = ny;
    }
  }
}

function bowlStep(sim) {
  if (sim.done) return;
  const dt = BOWL.DT, b = sim.ball;
  sim.t += dt;

  // the ball
  if (!b.gone) {
    if (!b.gutter) {
      const hook = sim.shot.spin / 100;
      const ax = b.y > BOWL.OIL_END ? hook * 1.7 : hook * 0.12;
      b.vx += ax * dt;
      // keep its speed: the hook turns it, it doesn't push it
      const sp = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
      const want = sp - 0.09 * dt;
      b.vx = b.vx * want / sp; b.vy = b.vy * want / sp;
    }
    b.x += b.vx * dt; b.y += b.vy * dt;
    b.roll += Math.sqrt(b.vx * b.vx + b.vy * b.vy) * dt / BOWL.BALL_R;
    if (!b.gutter && b.y < BOWL.DECK_END && (b.x > BOWL.LANE_HALF + 0.02 || b.x < -BOWL.LANE_HALF - 0.02)) {
      b.gutter = b.x > 0 ? 1 : -1;
    }
    if (b.gutter) {
      const cx = b.gutter * (BOWL.LANE_HALF + BOWL.GUTTER / 2);
      b.x += (cx - b.x) * Math.min(1, dt * 12);
      b.vx = 0;
    }
    if (b.y > BOWL.PIT_Y) b.gone = true;
  }

  // the pins move, fall and wobble
  for (const p of sim.pins) {
    if (p.state === 3 || p.gone) continue;
    const sp = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
    if (sp > 0) {
      const fr = (p.state === 0 ? 7 : p.state === 1 ? 2.2 : 3.4) * dt;
      const k = sp > fr ? (sp - fr) / sp : 0;
      p.vx *= k; p.vy *= k;
    }
    p.x += p.vx * dt; p.y += p.vy * dt;
    if (p.state === 1) {
      const [s] = bowlSinCos(p.tilt);
      p.tw += (38 * s + 1.5) * dt;
      p.tilt += p.tw * dt;
      if (p.tilt >= 1.5707963267948966) {
        p.tilt = 1.5707963267948966;
        p.state = 2;
        p.tw = 0;
        // the fall pushes it a little along its length
        p.vx += p.dx * 0.35; p.vy += p.dy * 0.35;
      }
    } else if (p.state === 0 && p.wob > 0) {
      p.wobT += dt;
      p.wob -= p.wob * 3.2 * dt;
      if (p.wob < 0.004) p.wob = 0;
    }
    // off the deck: into the pit or a gutter
    if (p.y > BOWL.DECK_END + 0.12 || p.x > BOWL.LANE_HALF + 0.04 || p.x < -BOWL.LANE_HALF - 0.04) {
      if (p.state === 0) { p.state = 1; p.tilt = 0.3; p.tw = 4; p.dx = p.vx; p.dy = p.vy; const l = Math.sqrt(p.dx * p.dx + p.dy * p.dy) || 1; p.dx /= l; p.dy /= l; }
      if (p.y > BOWL.PIT_Y || p.x > BOWL.LANE_HALF + BOWL.GUTTER || p.x < -BOWL.LANE_HALF - BOWL.GUTTER) p.gone = true;
    }
    // the kickbacks throw pins back in
    const wall = BOWL.LANE_HALF + BOWL.GUTTER;
    if (p.y > BOWL.KICK_Y && (p.x > wall - BOWL.PIN_R || p.x < -wall + BOWL.PIN_R)) {
      p.x = p.x > 0 ? wall - BOWL.PIN_R : -wall + BOWL.PIN_R;
      p.vx = -p.vx * 0.45;
    }
  }

  // collisions: the ball against the pins, the pins against each other
  const cs = bowlCircles(sim);
  if (!b.gone && !b.gutter) {
    for (const c of cs) {
      const dx = c.x - b.x, dy = c.y - b.y, rr = BOWL.BALL_R + c.r;
      const d2 = dx * dx + dy * dy;
      if (d2 >= rr * rr || d2 === 0) continue;
      const d = Math.sqrt(d2), nx = dx / d, ny = dy / d;
      const p = c.p;
      const rel = (b.vx - p.vx) * nx + (b.vy - p.vy) * ny;
      const over = rr - d;
      const im1 = 1 / BOWL.BALL_M, im2 = 1 / BOWL.PIN_M;
      b.x -= nx * over * im1 / (im1 + im2); b.y -= ny * over * im1 / (im1 + im2);
      p.x += nx * over * im2 / (im1 + im2); p.y += ny * over * im2 / (im1 + im2);
      if (rel <= 0) continue;
      const j = (1 + 0.72) * rel / (im1 + im2);
      b.vx -= j * im1 * nx; b.vy -= j * im1 * ny;
      p.vx += j * im2 * nx; p.vy += j * im2 * ny;
      sim.hits++;
      bowlKnock(p, j * im2, nx, ny);
    }
  }
  for (let i = 0; i < cs.length; i++) {
    for (let k = i + 1; k < cs.length; k++) {
      const a = cs[i], c = cs[k];
      if (a.p === c.p) continue;
      if (a.head && c.head) continue;
      const dx = c.x - a.x, dy = c.y - a.y, rr = a.r + c.r;
      const d2 = dx * dx + dy * dy;
      if (d2 >= rr * rr || d2 === 0) continue;
      const d = Math.sqrt(d2), nx = dx / d, ny = dy / d;
      const p = a.p, q = c.p;
      // a falling head carries the fall's own speed
      let avx = p.vx, avy = p.vy, cvx = q.vx, cvy = q.vy;
      if (a.head) { const [, co] = bowlSinCos(p.tilt); avx += p.dx * BOWL.PIN_HEAD * co * p.tw; avy += p.dy * BOWL.PIN_HEAD * co * p.tw; }
      if (c.head) { const [, co] = bowlSinCos(q.tilt); cvx += q.dx * BOWL.PIN_HEAD * co * q.tw; cvy += q.dy * BOWL.PIN_HEAD * co * q.tw; }
      const over = (rr - d) / 2;
      if (!a.head) { p.x -= nx * over; p.y -= ny * over; }
      if (!c.head) { q.x += nx * over; q.y += ny * over; }
      const rel = (avx - cvx) * nx + (avy - cvy) * ny;
      if (rel <= 0) continue;
      const j = (1 + 0.6) * rel / 2;
      p.vx -= j * nx; p.vy -= j * ny;
      q.vx += j * nx; q.vy += j * ny;
      bowlKnock(p, j, -nx, -ny);
      bowlKnock(q, j, nx, ny);
    }
  }

  // over once the ball is gone and nothing moves
  if (b.gone || b.gutter && b.y > BOWL.DECK_END) {
    let still = true;
    for (const p of sim.pins) {
      if (p.state === 3 || p.gone) continue;
      if (p.state === 1 || p.vx * p.vx + p.vy * p.vy > 0.0009 || p.wob > 0.02) { still = false; break; }
    }
    if (still) sim.done = true;
  }
  if (sim.t >= BOWL.MAX_T) sim.done = true;
}

function bowlRun(standing, shot) {
  const sim = bowlStart(standing, shot);
  while (!sim.done) bowlStep(sim);
  return sim;
}

// Which pins are still standing after a throw.
function bowlStanding(sim) {
  return sim.pins.map(p => p.state === 0 && !p.gone);
}

// One throw from start to finish: what is left up, and how many went down.
function bowlThrow(standing, shot) {
  const sim = bowlRun(standing, shot);
  const after = bowlStanding(sim);
  let down = 0;
  for (let i = 0; i < 10; i++) if (standing[i] && !after[i]) down++;
  return { after, down, gutter: !!sim.ball.gutter, hits: sim.hits };
}

// ----- the score sheet -----
// frames: [[r1, r2, (r3)]], rolls as pin counts. Real ten-pin scoring for
// any number of frames (5 or 10): the last frame gets its bonus balls.
function bowlScore(frames, total) {
  const rolls = [];
  frames.forEach(f => f.forEach(r => rolls.push(r)));
  const out = [];
  let i = 0, run = 0;
  for (let f = 0; f < total; f++) {
    const fr = frames[f];
    if (!fr || !fr.length) { out.push(null); continue; }
    const last = f === total - 1;
    let score = null;
    if (!last) {
      if (fr[0] === 10) {
        if (rolls.length > i + 2) score = 10 + rolls[i + 1] + rolls[i + 2];
        i += 1;
      } else {
        if (fr.length < 2) { out.push(null); break; }
        if (fr[0] + fr[1] === 10) { if (rolls.length > i + 2) score = 10 + rolls[i + 2]; }
        else score = fr[0] + fr[1];
        i += 2;
      }
    } else {
      const need = fr[0] === 10 || fr[0] + (fr[1] || 0) === 10 ? 3 : 2;
      if (fr.length >= need) score = fr.reduce((a, b) => a + b, 0);
    }
    if (score === null) { out.push(null); for (let g = f + 1; g < total; g++) out.push(null); break; }
    run += score;
    out.push(run);
  }
  while (out.length < total) out.push(null);
  return out;
}

// What a frame needs next: 'done', or how many pins are up for the next ball.
function bowlFrameNext(fr, last) {
  if (!last) {
    if (fr.length === 0) return 'fresh';
    if (fr[0] === 10 || fr.length === 2) return 'done';
    return 'second';
  }
  if (fr.length === 0) return 'fresh';
  if (fr.length === 1) return fr[0] === 10 ? 'fresh' : 'second';
  if (fr.length === 2) {
    if (fr[0] === 10) return fr[1] === 10 ? 'fresh' : 'second';
    return fr[0] + fr[1] === 10 ? 'fresh' : 'done';
  }
  return 'done';
}

