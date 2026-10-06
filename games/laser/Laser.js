/* الليزر — what the phone and the rooms server both need (one copy: SHARED_LISTS on the page,
   FILES on the server, before RoomLaser.js). The arena is a flat-topped hexagon of circumradius
   k, its middle at 0,0 (k is 1 in round one); a player is a circle of LASER_BODY. */
const LASER_BODY = 0.075;
const LASER_K_STEP = 0.1;
const LASER_K_MIN = 0.35;

/** The arena's size in a round: a ring smaller every round, down to a floor. */
const laserK = (round) => Math.max(LASER_K_MIN, Math.round((1 - (round - 1) * LASER_K_STEP) * 1000) / 1000);
const laserR3 = (v) => Math.round(v * 1000) / 1000;

/** A spot pulled in toward the middle until the whole body is on the hexagon of size k. */
const laserClamp = (x, y, k) => {
  x = Number(x) || 0; y = Number(y) || 0;
  const m = LASER_BODY;
  const r1 = Math.abs(y) / (Math.sqrt(3) / 2 * k - m);
  const r2 = (Math.sqrt(3) * Math.abs(x) + Math.abs(y)) / (Math.sqrt(3) * k - 2 * m);
  const f = Math.max(r1, r2, 1);
  return { x: laserR3(x / f), y: laserR3(y / f) };
};

/** An aim in degrees, 0 to 360, one decimal. */
const laserAngle = (a) => { a = Number(a) || 0; a = ((a % 360) + 360) % 360; return Math.round(a * 10) / 10; };

/** Who a set of shots ({ id, x, y, a }) hits: everyone whose body a beam touches, ahead of its
    shooter, through everyone in its line; `teams` (id → team) spares the shooter's teammates. */
const laserHits = (shots, teams) => {
  const out = [];
  shots.forEach(s => {
    const dx = Math.cos(s.a * Math.PI / 180), dy = Math.sin(s.a * Math.PI / 180);
    shots.forEach(o => {
      if (o === s || (teams && teams[o.id] === teams[s.id])) return;
      const vx = o.x - s.x, vy = o.y - s.y;
      if (vx * dx + vy * dy > 0 && Math.abs(vx * dy - vy * dx) < LASER_BODY && out.indexOf(o.id) === -1) out.push(o.id);
    });
  });
  return out;
};

/** How far a ray from x,y runs before it meets the hexagon's wall (size k). */
const laserToWall = (x, y, a, k) => {
  const dx = Math.cos(a * Math.PI / 180), dy = Math.sin(a * Math.PI / 180);
  let best = Infinity;
  for (let i = 0; i < 6; i++) {
    const a1 = Math.PI / 3 * i, a2 = Math.PI / 3 * (i + 1);
    const x1 = k * Math.cos(a1), y1 = k * Math.sin(a1), ex = k * Math.cos(a2) - x1, ey = k * Math.sin(a2) - y1;
    const den = dx * ey - dy * ex;
    if (Math.abs(den) < 1e-9) continue;
    const t = ((x1 - x) * ey - (y1 - y) * ex) / den, u = ((x1 - x) * dy - (y1 - y) * dx) / den;
    if (t > 0 && u >= -1e-9 && u <= 1 + 1e-9) best = Math.min(best, t);
  }
  return best === Infinity ? 0 : best;
};
