/* الليزر — what the phone and the rooms server both need (one copy: SHARED_LISTS on the page,
   FILES on the server, before RoomLaser.js). The arena is one of four maps (the owner, 6 Oct 2026:
   a hexagon, a circle, a ring with a hole «الدونات», a cross), its middle at 0,0, sized by k (1 in
   round one); a player is a circle of LASER_BODY. An arena A is { map, k, pillars: [{ x, y }],
   fallen: [tile indexes] } (the falling floor). */
const LASER_BODY = 0.075;
const LASER_K_STEP = 0.1;
const LASER_K_MIN = 0.35;
// Sudden death (the owner, 6 Oct 2026): past the floor the arena goes on shrinking by this step,
// down to a size a body still fits in a few times (the donut and the cross need more).
const LASER_K_SUDDEN_STEP = 0.05;
const LASER_K_SUDDEN_MIN = 0.17;
const LASER_K_SUDDEN_MIN_OF = { hex: 0.17, circle: 0.17, donut: 0.3, cross: 0.26 };
const LASER_MAPS = ['hex', 'circle', 'donut', 'cross'];
const LASER_PILLAR_R = 0.08;   // a pillar's radius
const LASER_TILE = 0.2;        // a falling-floor tile (a flat-topped hexagon's circumradius)
const LASER_PICK_REACH = LASER_BODY + 0.03;   // standing on a pickup: its middle under your body
const LASER_PICKUPS = ['double', 'second', 'shield', 'wide'];

/** The arena's size in a round: a ring smaller every round, down to a floor. */
const laserK = (round) => Math.max(LASER_K_MIN, Math.round((1 - (round - 1) * LASER_K_STEP) * 1000) / 1000);
const laserR3 = (v) => Math.round(v * 1000) / 1000;

/** A map's measures at size k: the circle's radius, the donut's two, the cross's half arm and reach. */
const laserDims = (map, k) => (map === 'circle' ? { R: 0.93 * k } : map === 'donut' ? { R: 0.95 * k, r: 0.34 * k }
  : map === 'cross' ? { a: 0.34 * k, b: 0.95 * k } : { k });

/** The cross's outline (12 corners, size k). */
const laserCrossPts = (k) => {
  const { a, b } = laserDims('cross', k);
  return [[-a, -b], [a, -b], [a, -a], [b, -a], [b, a], [a, a], [a, b], [-a, b], [-a, a], [-b, a], [-b, -a], [-a, -a]];
};
const laserHexPts = (k) => Array.from({ length: 6 }, (_, i) => [k * Math.cos(Math.PI / 3 * i), k * Math.sin(Math.PI / 3 * i)]);

/** Is the point x,y inside the map of size k with room m to spare all round? */
const laserInside = (map, k, x, y, m) => {
  m = m || 0;
  const d = laserDims(map, k), h = Math.hypot(x, y);
  if (map === 'circle') return h <= d.R - m;
  if (map === 'donut') return h <= d.R - m && h >= d.r + m;
  if (map === 'cross') return (Math.abs(x) <= d.a - m && Math.abs(y) <= d.b - m) || (Math.abs(x) <= d.b - m && Math.abs(y) <= d.a - m);
  return Math.abs(y) <= Math.sqrt(3) / 2 * k - m && Math.sqrt(3) * Math.abs(x) + Math.abs(y) <= Math.sqrt(3) * k - 2 * m;
};

/** A number from a phone: anything not a finite number is 0 (1e999 arrives as Infinity, and a spot of
    Infinity / Infinity is NaN, which no beam ever touches). */
const laserNum = (v) => { const n = Number(v); return isFinite(n) ? n : 0; };

/** A spot pulled in toward the middle until the whole body is on the hexagon of size k. */
const laserClamp = (x, y, k) => {
  x = laserNum(x); y = laserNum(y);
  const m = LASER_BODY;
  const r1 = Math.abs(y) / (Math.sqrt(3) / 2 * k - m);
  const r2 = (Math.sqrt(3) * Math.abs(x) + Math.abs(y)) / (Math.sqrt(3) * k - 2 * m);
  const f = Math.max(r1, r2, 1);
  return { x: laserR3(x / f), y: laserR3(y / f) };
};

/** A spot moved onto the map (size k) with the whole body on it: the nearest such place. */
const laserClampMap = (map, k, x, y) => {
  x = laserNum(x); y = laserNum(y);
  const B = LASER_BODY, d = laserDims(map, k), h = Math.hypot(x, y);
  if (map === 'circle') { const f = h > d.R - B ? (d.R - B) / h : 1; return { x: laserR3(x * f), y: laserR3(y * f) }; }
  if (map === 'donut') {
    if (h < 1e-6) return { x: laserR3(d.r + B), y: 0 };
    const to = Math.min(d.R - B, Math.max(d.r + B, h));
    return { x: laserR3(x * to / h), y: laserR3(y * to / h) };
  }
  if (map === 'cross') {
    const a = d.a - B, b = d.b - B;
    const inRect = (w, hh) => ({ x: Math.max(-w, Math.min(w, x)), y: Math.max(-hh, Math.min(hh, y)) });
    const p = inRect(a, b), q = inRect(b, a);
    const best = Math.hypot(p.x - x, p.y - y) <= Math.hypot(q.x - x, q.y - y) ? p : q;
    return { x: laserR3(best.x), y: laserR3(best.y) };
  }
  return laserClamp(x, y, k);
};

/* --- the falling floor ------------------------------------------------------------------- */
const LASER_TILE_CACHE = {};
/** The tiles of a map (at size 1): flat-topped hexagons that cover the map, the strip by the wall
    included (a tile whose middle is just off the map still holds the floor drawn inside it), so every
    spot stands on a tile that can fall. */
const laserTiles = (map) => {
  if (LASER_TILE_CACHE[map]) return LASER_TILE_CACHE[map];
  const out = [], T = LASER_TILE;
  for (let q = -6; q <= 6; q++) for (let r = -7; r <= 7; r++) {
    const x = 1.5 * T * q, y = Math.sqrt(3) * T * (r + q / 2);
    if (laserInside(map, 1, x, y, -T * 0.85)) out.push({ i: out.length, x: laserR3(x), y: laserR3(y) });
  }
  LASER_TILE_CACHE[map] = out;
  return out;
};
/** The tile under a point on the map (the nearest middle: the tiles cover the whole map). */
const laserTileAt = (map, x, y) => {
  let best = null, bd = Infinity;
  laserTiles(map).forEach(t => { const dd = Math.hypot(t.x - x, t.y - y); if (dd < bd) { bd = dd; best = t; } });
  return best;
};

/** A spot moved onto the arena: on the map, out of every pillar, and off any tile that fell. */
const laserFit = (A, x, y) => {
  const map = A.map || 'hex', k = A.k || 1;
  let p = laserClampMap(map, k, x, y);
  const fallen = A.fallen || [];
  if (fallen.length) {
    const t = laserTileAt(map, p.x, p.y);
    if (!t || fallen.indexOf(t.i) !== -1) {
      // The nearest point of a tile still standing, pulled toward its middle - kept on the map
      // first, and only if it still stands on that floor: a tile by the wall has its middle off
      // the map, and the map's edge pulled the point back onto the fallen tile beside it.
      let best = null, bd = Infinity, near = null, nd = Infinity;
      laserTiles(map).forEach(s => {
        if (fallen.indexOf(s.i) !== -1) return;
        const vx = p.x - s.x, vy = p.y - s.y, l = Math.hypot(vx, vy), reach = LASER_TILE * 0.7;
        if (l < nd) { nd = l; near = s; }
        const c = l > reach ? { x: s.x + vx / l * reach, y: s.y + vy / l * reach } : { x: p.x, y: p.y };
        const cc = laserClampMap(map, k, c.x, c.y);
        const dd = Math.hypot(cc.x - p.x, cc.y - p.y);
        if (dd >= bd) return;
        const tt = laserTileAt(map, cc.x, cc.y);
        if (!tt || fallen.indexOf(tt.i) !== -1) return;
        bd = dd; best = cc;
      });
      if (best) p = best;
      else if (near) p = laserClampMap(map, k, near.x, near.y);
    }
  }
  for (let n = 0; n < 2; n++) {
    (A.pillars || []).forEach(pl => {
      const vx = p.x - pl.x, vy = p.y - pl.y, l = Math.hypot(vx, vy), need = LASER_PILLAR_R + LASER_BODY;
      if (l < need) {
        // The nearest place round the pillar that is still on the map and clear of every pillar (straight
        // out alone could be pulled back into it by the wall of a shrunk arena).
        let best = null, bd = Infinity;
        for (let i = 0; i < 24; i++) {
          const an = i * Math.PI / 12;
          const q = laserClampMap(map, k, pl.x + Math.cos(an) * (need + 0.002), pl.y + Math.sin(an) * (need + 0.002));
          if (!(A.pillars || []).every(o => Math.hypot(q.x - o.x, q.y - o.y) >= need)) continue;
          const dd = Math.hypot(q.x - p.x, q.y - p.y);
          if (dd < bd) { bd = dd; best = q; }
        }
        if (best) p = best;
        else {
          const ux = l > 1e-6 ? vx / l : 1, uy = l > 1e-6 ? vy / l : 0;
          p = laserClampMap(map, k, pl.x + ux * (need + 0.002), pl.y + uy * (need + 0.002));
        }
      }
    });
  }
  return { x: laserR3(p.x), y: laserR3(p.y) };
};

/** An aim in degrees, 0 to 360, one decimal. */
const laserAngle = (a) => { a = laserNum(a); a = ((a % 360) + 360) % 360; return Math.round(a * 10) / 10; };

/** Where a ray from x,y along dx,dy first meets a wall of the arena: { t, nx, ny (the wall's normal,
    toward the ray), stop (a pillar: the beam ends, it never bounces off one) }, or t 0. */
const laserWallHit = (x, y, dx, dy, k, A) => {
  const map = (A && A.map) || 'hex';
  let best = { t: Infinity, nx: 0, ny: 0, stop: false };
  const take = (t, nx, ny, stop) => {
    if (t > 1e-9 && t < best.t) {
      if (nx * dx + ny * dy > 0) { nx = -nx; ny = -ny; }
      best = { t, nx, ny, stop: !!stop };
    }
  };
  const poly = (pts) => {
    for (let i = 0; i < pts.length; i++) {
      const [x1, y1] = pts[i], [x2, y2] = pts[(i + 1) % pts.length];
      const ex = x2 - x1, ey = y2 - y1, den = dx * ey - dy * ex;
      if (Math.abs(den) < 1e-12) continue;
      const t = ((x1 - x) * ey - (y1 - y) * ex) / den, u = ((x1 - x) * dy - (y1 - y) * dx) / den;
      if (u >= -1e-9 && u <= 1 + 1e-9) { const l = Math.hypot(ex, ey); take(t, -ey / l, ex / l); }
    }
  };
  // A circle of radius R round cx,cy: the ray's exit from inside, or its entry from outside.
  const circle = (cx, cy, R, from, stop) => {
    const ox = x - cx, oy = y - cy, b = ox * dx + oy * dy, c = ox * ox + oy * oy - R * R, disc = b * b - c;
    if (disc < 0) return;
    const t = from === 'in' ? -b + Math.sqrt(disc) : -b - Math.sqrt(disc);
    const hx = ox + dx * t, hy = oy + dy * t, l = Math.hypot(hx, hy) || 1;
    take(t, hx / l, hy / l, stop);
  };
  const d = laserDims(map, k);
  if (map === 'circle') circle(0, 0, d.R, 'in');
  else if (map === 'donut') { circle(0, 0, d.R, 'in'); circle(0, 0, d.r, 'out'); }
  else if (map === 'cross') poly(laserCrossPts(k));
  else poly(laserHexPts(k));
  ((A && A.pillars) || []).forEach(pl => circle(pl.x, pl.y, LASER_PILLAR_R, 'out', true));
  return best.t === Infinity ? { t: 0, nx: 0, ny: 0, stop: false } : best;
};

/** How far a ray from x,y at angle a runs before it meets the arena's wall (size k). */
const laserToWall = (x, y, a, k, A) => laserWallHit(x, y, Math.cos(a * Math.PI / 180), Math.sin(a * Math.PI / 180), k, A).t;

/**
 * Every beam of a round. shots: [{ id, x, y, a, shield, rays: [{ a, wide }] (more than one with a
 * pickup; default one ray along a) }]; o: { k, map, pillars, teams (id → team, or null), bounce (a
 * beam bounces off a wall once; never off a pillar), block (a beam stops at the first person it hits) }.
 * A shield fires nothing and stops every beam that reaches it; a teammate is passed through
 * harmlessly and blocks nothing; a beam never hits its own shooter, bounced or not; a wide beam hits
 * whoever it passes within twice the reach.
 * Returns { beams: [{ id, segs: [[x0, y0, x1, y1]…], hits: [ids], wide }], near: { id: the closest a
 * beam passed without hitting } }.
 */
const laserTrace = (shots, o) => {
  o = o || {};
  const B = LASER_BODY;
  const A = { map: o.map || 'hex', pillars: o.pillars || [] };
  const mate = (p, q) => !!(o.teams && o.teams[p.id] !== undefined && o.teams[p.id] === o.teams[q.id]);
  const near = {};
  const beams = [];
  shots.forEach(s => {
    if (s.shield) return;
    (s.rays && s.rays.length ? s.rays : [{ a: s.a }]).forEach(ray => {
      const reach = ray.wide ? 2 * B : B;
      const beam = { id: s.id, segs: [], hits: [], wide: !!ray.wide };
      let x = s.x, y = s.y;
      let dx = Math.cos(ray.a * Math.PI / 180), dy = Math.sin(ray.a * Math.PI / 180);
      let bounces = o.bounce ? 1 : 0;
      for (let leg = 0; leg < 2; leg++) {
        const wall = laserWallHit(x, y, dx, dy, o.k || 1, A);
        let end = wall.t;
        let stop = false;
        const on = [], miss = [];
        shots.forEach(q => {
          if (q === s || mate(s, q)) return;
          const vx = q.x - x, vy = q.y - y;
          const along = vx * dx + vy * dy, perp = Math.abs(vx * dy - vy * dx);
          if (along <= 0 || along > wall.t + B) return;
          // Past the beam's end (a pillar, the donut's hole, a corner) only a body round its tip is touched.
          const r = q.shield ? B : reach, past = along - wall.t;
          if (past > 0 ? Math.hypot(past, perp) < r : perp < r) on.push({ q, along, perp });
          else miss.push({ q, along, gap: laserR3(perp - reach) });
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
        if (stop || wall.stop || !bounces || !wall.t) break;
        bounces -= 1;
        x += dx * wall.t; y += dy * wall.t;
        const dd = dx * wall.nx + dy * wall.ny;
        dx -= 2 * dd * wall.nx; dy -= 2 * dd * wall.ny;
        x += dx * 1e-6; y += dy * 1e-6;
      }
      beams.push(beam);
    });
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
