/* ============================================================================
   السلم والتعبان — SNAKES & LADDERS: the board, the map, the rules
   ----------------------------------------------------------------------------
   One copy for both sides: the page inlines this file (SHARED_LISTS in
   tools/build-*.mjs) for a game against the phone and to draw the board, and
   the rooms server bundles it (FILES in rooms-worker/build.mjs) to judge a
   room. No DOM, nothing that runs at load, every name prefixed snakes /
   SNAKES_.

   The owner's rules (28 Sep 2026, asked one at a time):
     - 2 to 6 players, each for themselves; pieces share a square.
     - 100 needs the exact number: too high bounces back (98 + 5 -> 100 -> 97).
     - A 6 rolls again (no penalty for three 6s, no 6 needed to start).
     - The snakes and ladders are placed at random each game, checked fair.
     - Play on for places; pure classic, no special squares.

   Decided here (open to change, each in one place):
     - A piece starts off the board (square 0, on the mat under square 1),
       and the first roll puts it on the board (a 4 lands on 4).
     - The map is made from a seed the server stores (`g.map.seed`), with a
       seeded random source, so every phone and the TV draw the same snakes
       from it, and a test can make the same map again.
     - Every roll is one event carrying everything a screen shows: the die,
       the move, the bounce, the snake or ladder and the variant of its
       animation (picked here, never the same as the last one of its kind),
       a near miss, a six. `readyAt` is when every screen has finished showing
       it (`snakesRollMs`); the next roll waits for it.

   Squares are 1..100 on a 10 x 10 board, boustrophedon from the bottom left
   (1 bottom left, 10 bottom right, 11 above 10, 100 top left). The drawing's
   units are 60 a square, the board 600 x 600 (SNAKES_C).
   ========================================================================= */

const SNAKES_N = 10;
const SNAKES_C = 60;
const SNAKES_MIN_PLAYERS = 2;
const SNAKES_MAX_PLAYERS = 6;
const SNAKES_CLOCKS = [0, 15, 30];
const SNAKES_EVENTS = 40;
const SNAKES_COLORS = ['r', 'b', 'y', 'g', 'p', 'v'];     // red, blue, yellow, green, pink, violet

/** The snake's animations and the ladder's, each with how long every screen takes to show it. */
const SNAKES_SNAKE_MOVES = ['gulp', 'slide', 'chase', 'sneeze', 'flick', 'squeeze', 'hypno'];
const SNAKES_LADDER_MOVES = ['climb', 'sprint', 'slip', 'lift', 'boost'];
const SNAKES_MOVE_MS = {
  gulp: 3000, slide: 2300, chase: 2800, sneeze: 2900, flick: 2600, squeeze: 2800, hypno: 3000,
  climb: 1900, sprint: 1100, slip: 2700, lift: 2100, boost: 1900
};
const SNAKES_DIE_MS = 1000;          // the die tumbling and landing
const SNAKES_HOP_MS = 210;           // one square of a walk
const SNAKES_NEAR_MS = 1300;         // a snake snapping at a near miss, a ladder just missed
const SNAKES_SIX_MS = 800;           // the cheer for a six
const SNAKES_WIN_MS = 2800;          // the trophy dance at 100
const SNAKES_BOUNCE_MS = 700;        // bumping into the cup at 100 before walking back
const SNAKES_BUILD_MS = 5600;        // the map built in front of everyone
const SNAKES_TEARDOWN_MS = 2600;     // the old map taken apart first (play again)
const SNAKES_BUILD_VARIANTS = 3;

/* --- the board --------------------------------------------------------------------------- */

/** A square's centre in the drawing's units. */
const snakesCellXY = (n) => {
  const i = n - 1;
  const r = Math.floor(i / SNAKES_N);
  const k = i % SNAKES_N;
  const col = r % 2 ? SNAKES_N - 1 - k : k;
  return { x: col * SNAKES_C + SNAKES_C / 2, y: (SNAKES_N - 1 - r) * SNAKES_C + SNAKES_C / 2 };
};
const snakesRowOf = (n) => Math.floor((n - 1) / SNAKES_N);

/** A seeded random source (mulberry32): the same seed gives the same numbers on every device. */
const snakesRng = (seed) => {
  let a = (Number(seed) >>> 0) || 1;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const snakesSegDist = (p, a, b) => {
  const dx = b.x - a.x, dy = b.y - a.y, l = dx * dx + dy * dy;
  let t = l ? ((p.x - a.x) * dx + (p.y - a.y) * dy) / l : 0;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p.x - a.x - dx * t, p.y - a.y - dy * t);
};
const snakesSegCross = (a, b, c, d) => {
  const o = (p, q, r) => Math.sign((q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x));
  return o(a, b, c) !== o(a, b, d) && o(c, d, a) !== o(c, d, b);
};

/* --- a fair random map -------------------------------------------------------------------- */

/** Games simulated on a map: the average number of turns a player takes to reach 100, and the worst. */
const snakesFairness = (snakes, ladders, rnd, games) => {
  const jump = {};
  snakes.forEach(s => { jump[s.h] = s.t; });
  ladders.forEach(l => { jump[l.f] = l.t; });
  const n = games || 120;
  let tot = 0, worst = 0;
  for (let g = 0; g < n; g++) {
    let pos = 0, turns = 0;
    while (pos !== 100 && turns < 400) {
      turns++;
      let again = true;
      while (again && pos !== 100) {
        const v = 1 + Math.floor(rnd() * 6);
        again = v === 6;
        let t = pos + v;
        if (t > 100) t = 200 - t;
        pos = jump[t] || t;
      }
    }
    tot += turns;
    worst = Math.max(worst, turns);
  }
  return { avg: tot / n, worst: worst };
};

/**
 * The map for a seed: 5 snakes and 5 ladders that don't share a square, a snake's
 * head at least a row above its tail and no two snakes crossing, a ladder at least
 * two rows long and never more than two columns aside, a ladder in the first three
 * rows, and a game that takes 12 to 36 turns on average (simulated, seeded too).
 * The same seed gives the same map everywhere.
 */
const snakesGenMap = (seed) => {
  const rnd = snakesRng(seed);
  const C = SNAKES_C;
  const cd = (a, b) => { const p = snakesCellXY(a), q = snakesCellXY(b); return Math.hypot(p.x - q.x, p.y - q.y) / C; };
  let fallback = null;
  for (let tries = 0; tries < 400; tries++) {
    const used = new Set([1, 100]);
    const snakes = [];
    const ladders = [];
    let ok = true;
    for (let i = 0; i < 5 && ok; i++) {
      let placed = false;
      for (let t = 0; t < 120 && !placed; t++) {
        const h = 16 + Math.floor(rnd() * 83);
        const tl = h - (11 + Math.floor(rnd() * 30));
        if (h > 99 || tl < 2 || used.has(h) || used.has(tl)) continue;
        if (snakes.some(s => cd(s.h, h) < 2.1 || cd(s.t, tl) < 1.6 || cd(s.h, tl) < 1.2)) continue;
        const a = snakesCellXY(h), b = snakesCellXY(tl);
        if (Math.abs(a.x - b.x) > 4 * C || a.y - b.y > -C) continue;
        if (snakes.some(o => { const c1 = snakesCellXY(o.h), c2 = snakesCellXY(o.t); return snakesSegCross(a, b, c1, c2) || snakesSegDist(a, c1, c2) < 55 || snakesSegDist(b, c1, c2) < 45 || snakesSegDist(c1, a, b) < 55; })) continue;
        snakes.push({ h: h, t: tl });
        used.add(h); used.add(tl);
        placed = true;
      }
      ok = placed;
    }
    for (let i = 0; i < 5 && ok; i++) {
      let placed = false;
      for (let t = 0; t < 90 && !placed; t++) {
        const f = 2 + Math.floor(rnd() * 80);
        const top = f + 14 + Math.floor(rnd() * 22);
        if (top > 99 || used.has(f) || used.has(top) || snakesRowOf(top) - snakesRowOf(f) < 2) continue;
        const a = snakesCellXY(f), b = snakesCellXY(top);
        if (Math.abs(a.x - b.x) > 2 * C || (a.y - b.y) < Math.abs(a.x - b.x) * 1.1 || Math.hypot(a.x - b.x, a.y - b.y) > 5 * C) continue;
        if (ladders.some(l => { const c1 = snakesCellXY(l.f), c2 = snakesCellXY(l.t); return snakesSegCross(a, b, c1, c2) || snakesSegDist(a, c1, c2) < 32 || snakesSegDist(b, c1, c2) < 32; })) continue;
        if (snakes.some(s => snakesSegDist(snakesCellXY(s.h), a, b) < 40 || snakesSegDist(snakesCellXY(s.t), a, b) < 26)) continue;
        if (snakes.filter(s => snakesSegCross(a, b, snakesCellXY(s.h), snakesCellXY(s.t))).length > 1) continue;
        ladders.push({ f: f, t: top });
        used.add(f); used.add(top);
        placed = true;
      }
      ok = placed;
    }
    if (!ok) continue;
    if (!ladders.some(l => l.f <= 30)) continue;
    const st = snakesFairness(snakes, ladders, rnd, 120);
    const m = { seed: Number(seed) >>> 0, snakes: snakes, ladders: ladders, avg: Math.round(st.avg * 10) / 10 };
    if (!fallback) fallback = m;
    if (st.avg < 12 || st.avg > 36 || st.worst > 200) continue;
    return m;
  }
  return fallback;
};

/** A new seed for a map, from any random source. */
const snakesNewSeed = (rnd) => 1 + Math.floor((rnd || Math.random)() * 2147483646);

/* --- a game ------------------------------------------------------------------------------- */

const snakesEvent = (g, type, data) => {
  g.eventSeq = (g.eventSeq || 0) + 1;
  const e = Object.assign({ type: type, seq: g.eventSeq }, data || {});
  g.events = (g.events || []).concat([e]).slice(-SNAKES_EVENTS);
  return e;
};

/**
 * A new game: the seats in the order they play (the first plays first), their
 * colours (an index into SNAKES_COLORS each), every piece off the board, and
 * the map made from `seed`. `now` starts the build's clock: nobody's roll is
 * waited for until it has been shown (SNAKES_BUILD_MS, and the old map taken
 * apart first when `teardown`).
 */
const snakesNewGame = (seats, colors, seed, now, opts) => {
  const o = opts || {};
  const pos = {};
  seats.forEach(id => { pos[id] = 0; });
  const cols = {};
  seats.forEach(id => { cols[id] = colors[id]; });
  const g = {
    seats: seats.slice(),
    colors: cols,
    pos: pos,
    turn: { pid: seats[0], sixes: 0 },
    places: [],
    phase: 'play',
    turnSeq: 1,
    events: [],
    eventSeq: 0,
    map: snakesGenMap(seed),
    lastS: '',
    lastL: '',
    readyAt: 0
  };
  const buildMs = SNAKES_BUILD_MS + (o.teardown ? SNAKES_TEARDOWN_MS : 0);
  snakesEvent(g, 'build', { v: Math.floor((o.rnd || Math.random)() * SNAKES_BUILD_VARIANTS), teardown: !!o.teardown, ms: buildMs, first: seats[0] });
  g.readyAt = (now || 0) + buildMs;
  return g;
};

/** Colours for those who didn't pick one: the free ones in order. */
const snakesFillColors = (ids, picked) => {
  const out = {};
  const taken = {};
  ids.forEach(id => {
    const c = picked && picked[id];
    if (SNAKES_COLORS.indexOf(c) !== -1 && !taken[c]) { out[id] = c; taken[c] = true; }
  });
  ids.forEach(id => {
    if (out[id]) return;
    const c = SNAKES_COLORS.find(x => !taken[x]);
    out[id] = c;
    taken[c] = true;
  });
  return out;
};

/** A variant of its kind, never the same as the last one. */
const snakesPickMove = (list, last, rnd) => {
  const o = list.filter(v => v !== last);
  return o[Math.floor(rnd() * o.length) % o.length];
};

/** How long every screen takes to show a roll. */
const snakesRollMs = (e) => {
  let ms = SNAKES_DIE_MS;
  if (e.over) ms += (100 - e.from) * SNAKES_HOP_MS + SNAKES_BOUNCE_MS + e.over * SNAKES_HOP_MS;
  else ms += Math.max(1, e.walk - (e.from === 0 ? 0 : e.from)) * SNAKES_HOP_MS;
  if (e.jump) ms += SNAKES_MOVE_MS[e.jump.v] || 2500;
  else if (e.near) ms += SNAKES_NEAR_MS;
  if (e.place) ms += SNAKES_WIN_MS;
  else if (e.n === 6) ms += SNAKES_SIX_MS;
  return ms + 300;
};

/** Who plays after `pid`: the next seat still on the board. */
const snakesNextSeat = (g, pid) => {
  const n = g.seats.length;
  const i = g.seats.indexOf(pid);
  for (let k = 1; k <= n; k++) {
    const id = g.seats[(i + k) % n];
    if (g.places.indexOf(id) === -1) return id;
  }
  return null;
};

/** Everyone still playing. */
const snakesLeft = (g) => g.seats.filter(id => g.places.indexOf(id) === -1);

/** The game is over once one is left: they take the last place. */
const snakesCheckOver = (g) => {
  const left = snakesLeft(g);
  if (left.length <= 1 && g.phase === 'play') {
    if (left.length === 1) g.places.push(left[0]);
    g.phase = 'gameover';
    g.turn = { pid: null, sixes: 0 };
    snakesEvent(g, 'over', { places: g.places.slice() });
    return true;
  }
  return false;
};

/**
 * `pid` rolls `v`: the walk (bouncing off 100), the snake or ladder at the end, a
 * near miss, a six to roll again, a finish. `rnd` picks the variant; `now` is
 * the time the roll is made (readyAt counts from it). Returns the event.
 */
const snakesRoll = (g, pid, v, rnd, now) => {
  if (g.phase !== 'play') throw new Error('اللعبة خلصت');
  if (!g.turn || g.turn.pid !== pid) throw new Error('مش دورك');
  if (!(v >= 1 && v <= 6)) throw new Error('رقم غلط');
  const rand = rnd || Math.random;
  const from = g.pos[pid] || 0;
  let walk = from + v;
  let over = 0;
  if (walk > 100) { over = walk - 100; walk = 100 - over; }
  let to = walk;
  let jump = null;
  const sn = g.map.snakes.find(s => s.h === walk);
  const ld = g.map.ladders.find(l => l.f === walk);
  if (sn) {
    const mv = snakesPickMove(SNAKES_SNAKE_MOVES, g.lastS, rand);
    g.lastS = mv;
    jump = { k: 's', to: sn.t, v: mv };
    to = sn.t;
  } else if (ld) {
    const mv = snakesPickMove(SNAKES_LADDER_MOVES, g.lastL, rand);
    g.lastL = mv;
    jump = { k: 'l', to: ld.t, v: mv };
    to = ld.t;
  }
  let near = null;
  if (!jump && walk > 0 && walk < 100) {
    if (g.map.snakes.some(s => Math.abs(s.h - walk) === 1)) near = 's';
    else if (g.map.ladders.some(l => l.f === walk + 1 || l.f === walk - 1)) near = 'l';
  }
  g.pos[pid] = to;
  let place = 0;
  if (to === 100) {
    g.places.push(pid);
    place = g.places.length;
  }
  const e = snakesEvent(g, 'roll', { pid: pid, n: v, from: from, walk: walk, over: over, to: to, jump: jump, near: near, place: place || undefined });
  e.ms = snakesRollMs(e);
  g.readyAt = (now || 0) + e.ms;
  if (place) snakesEvent(g, 'finish', { pid: pid, place: place });
  if (!snakesCheckOver(g)) {
    if (v === 6 && !place) g.turn = { pid: pid, sixes: (g.turn.sixes || 0) + 1 };
    else g.turn = { pid: snakesNextSeat(g, pid), sixes: 0 };
  }
  g.turnSeq = (g.turnSeq || 0) + 1;
  return e;
};

/** A player leaves the game: their piece goes, their turn passes; one left ends it. */
const snakesRemovePlayer = (g, pid) => {
  if (g.seats.indexOf(pid) === -1) return;
  const wasTurn = g.turn && g.turn.pid === pid;
  const next = wasTurn ? snakesNextSeat(g, pid) : null;
  g.seats = g.seats.filter(id => id !== pid);
  delete g.pos[pid];
  g.places = g.places.filter(id => id !== pid);
  if (g.phase !== 'play') return;
  if (snakesCheckOver(g)) { g.turnSeq = (g.turnSeq || 0) + 1; return; }
  if (wasTurn) {
    g.turn = { pid: next && next !== pid ? next : snakesLeft(g)[0], sixes: 0 };
    g.turnSeq = (g.turnSeq || 0) + 1;
  }
};
