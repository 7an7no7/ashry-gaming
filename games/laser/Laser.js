/* الليزر — what the phone and the rooms server both need (one copy: SHARED_LISTS on the page,
   FILES on the server, before RoomLaser.js). The arena is a flat-topped hexagon of circumradius
   k, its middle at 0,0 (k is 1 in round one); a player is a circle of LASER_BODY. */
const LASER_BODY = 0.075;
const LASER_K_STEP = 0.1;
const LASER_K_MIN = 0.35;
// Sudden death (the owner, 6 Oct 2026): past the floor the arena goes on shrinking by this step,
// down to this size (a body still fits a few times across).
const LASER_K_SUDDEN_STEP = 0.05;
const LASER_K_SUDDEN_MIN = 0.17;

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

/** Where a ray from x,y along dx,dy meets the hexagon's wall (size k): { t, nx, ny } (the wall's
    inward normal), or t 0 when it doesn't. */
const laserWallHit = (x, y, dx, dy, k) => {
  let best = { t: Infinity, nx: 0, ny: 0 };
  for (let i = 0; i < 6; i++) {
    const a1 = Math.PI / 3 * i, a2 = Math.PI / 3 * (i + 1);
    const x1 = k * Math.cos(a1), y1 = k * Math.sin(a1), ex = k * Math.cos(a2) - x1, ey = k * Math.sin(a2) - y1;
    const den = dx * ey - dy * ex;
    if (Math.abs(den) < 1e-9) continue;
    const t = ((x1 - x) * ey - (y1 - y) * ex) / den, u = ((x1 - x) * dy - (y1 - y) * dx) / den;
    if (t > 1e-9 && u >= -1e-9 && u <= 1 + 1e-9 && t < best.t) {
      const mid = Math.PI / 3 * (i + 0.5);
      best = { t, nx: -Math.cos(mid), ny: -Math.sin(mid) };
    }
  }
  return best.t === Infinity ? { t: 0, nx: 0, ny: 0 } : best;
};

/** How far a ray from x,y at angle a runs before it meets the hexagon's wall (size k). */
const laserToWall = (x, y, a, k) => laserWallHit(x, y, Math.cos(a * Math.PI / 180), Math.sin(a * Math.PI / 180), k).t;

/**
 * Every beam of a round. shots: [{ id, x, y, a, shield }]; o: { k, teams (id → team, or null),
 * bounce (a beam bounces off the wall once), block (a beam stops at the first person it hits) }.
 * A shield fires nothing and stops every beam that reaches it; a teammate is passed through
 * harmlessly and blocks nothing; a beam never hits its own shooter, bounced or not.
 * Returns { beams: [{ id, segs: [[x0, y0, x1, y1]…], hits: [ids] }], near: { id: the closest a
 * beam passed without hitting (the gap between beam and body) } }.
 */
const laserTrace = (shots, o) => {
  o = o || {};
  const B = LASER_BODY;
  const mate = (p, q) => !!(o.teams && o.teams[p.id] !== undefined && o.teams[p.id] === o.teams[q.id]);
  const near = {};
  const beams = [];
  shots.forEach(s => {
    if (s.shield) return;
    const beam = { id: s.id, segs: [], hits: [] };
    let x = s.x, y = s.y;
    let dx = Math.cos(s.a * Math.PI / 180), dy = Math.sin(s.a * Math.PI / 180);
    let bounces = o.bounce ? 1 : 0;
    for (let leg = 0; leg < 2; leg++) {
      const wall = laserWallHit(x, y, dx, dy, o.k || 1);
      let end = wall.t;
      let stop = false;
      const on = [], miss = [];
      shots.forEach(q => {
        if (q === s || mate(s, q)) return;
        const vx = q.x - x, vy = q.y - y;
        const along = vx * dx + vy * dy, perp = Math.abs(vx * dy - vy * dx);
        if (along <= 0 || along > wall.t + B) return;
        if (perp < B) on.push({ q, along, perp });
        else miss.push({ q, along, gap: laserR3(perp - B) });
      });
      on.sort((p, q) => p.along - q.along);
      for (let i = 0; i < on.length; i++) {
        const c = on[i];
        if (c.q.shield) { end = Math.max(0, c.along - Math.sqrt(Math.max(0, B * B - c.perp * c.perp))); stop = true; break; }
        if (beam.hits.indexOf(c.q.id) === -1) beam.hits.push(c.q.id);
        if (o.block) { end = c.along; stop = true; break; }
      }
      miss.forEach(m => { if (m.along < end) near[m.q.id] = Math.min(near[m.q.id] === undefined ? Infinity : near[m.q.id], m.gap); });
      beam.segs.push([laserR3(x), laserR3(y), laserR3(x + dx * end), laserR3(y + dy * end)]);
      if (stop || !bounces || !wall.t) break;
      bounces -= 1;
      x += dx * wall.t; y += dy * wall.t;
      const d = dx * wall.nx + dy * wall.ny;
      dx -= 2 * d * wall.nx; dy -= 2 * d * wall.ny;
      x += dx * 1e-6; y += dy * 1e-6;
    }
    beams.push(beam);
  });
  // A near miss is only one that never hit.
  beams.forEach(b => b.hits.forEach(id => { delete near[id]; }));
  return { beams, near };
};

/** Who a set of shots hits (the plain game: through everyone, no bounce); `teams` spares teammates. */
const laserHits = (shots, teams) => {
  const out = [];
  laserTrace(shots, { k: 10, teams }).beams.forEach(b => b.hits.forEach(id => { if (out.indexOf(id) === -1) out.push(id); }));
  return out;
};

/** Who a ghost's mine at x,y catches: anyone standing whose body covers it (not the ghost's team). */
const laserMineHits = (mine, shots, teams) => shots
  .filter(q => !(teams && teams[q.id] !== undefined && teams[q.id] === teams[mine.id]))
  .filter(q => Math.hypot(q.x - mine.x, q.y - mine.y) < LASER_BODY)
  .map(q => q.id);
