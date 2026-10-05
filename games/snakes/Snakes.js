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
     - Play on for places; pure classic, no special squares (the third round,
       2 Oct 2026, adds them as switches, off by default: see below).

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
     - The second round (29 Sep 2026) is picked here too, so every screen plays
       the same: each snake head walked past (`pass`: duck, snap or jump), a
       snake's tail square (`tail`, never the same move twice in a row), the
       sneak beside a ladder's foot (`sneak`, about 1 in 3: push or eat, by the
       snake nearest to him), a tail square's move about half the time,
       two on one square (`meet`), the sixes in a row (`sixes`), the drumroll
       from 95 (`tense`), and `rolls` (the TV's day turning to night).
     - The third round (2 Oct 2026), every part optional on a game: the themed
       maps' own moves (`g.theme`), the surprise squares (`g.map.surp`, the
       roll's `surp` and `charmed`, the `nap` event), the moving map (the `move`
       event), teams (`g.teams`, `g.teamPlaces`, a roll's `by`), and the awards
       (`g.stats` as the game is played, `g.awards` at its end).

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
/* The second round (the owner, 29 Sep 2026): more that a roll can show, each picked
   here so every phone and the TV play the same one, and counted in readyAt. */
const SNAKES_TAIL_MOVES = ['tickle', 'trip', 'push', 'seat'];     // landing on a snake's tail square
/* The owner's review (29 Sep 2026): "fun, never annoying" - the extras kept special and short. */
const SNAKES_TAIL_MS = { tickle: 1200, trip: 1400, push: 1300, seat: 1400 };
const SNAKES_TAIL_CHANCE = 0.5;                                   // how often a tail square plays a move (otherwise he just stands)
const SNAKES_SNEAK_ENDS = ['push', 'eat'];                        // the sneak up a ladder next door, and how it ends
const SNAKES_SNEAK_MS = { push: 3500, eat: 3800 };                // he stands, looks round, sneaks; the snake crawls to him and back
const SNAKES_SNEAK_CHANCE = 1 / 3;                                // how often landing beside a ladder's foot is a sneak
const SNAKES_PASS_MS = { duck: 200, snap: 450, jump: 380 };       // walking past a snake's head, on top of the hop
const SNAKES_PASS_JUMP = 0.2;                                     // how often the head comes down and he jumps over it
const SNAKES_PASS_SNAP = 0.15;                                    // of the ducks, how often the snake snaps above him
const SNAKES_MEET_MOVES = ['five', 'bump', 'dance'];              // two on one square
const SNAKES_MEET_MS = 900;
const SNAKES_ONE_MS = 550;           // a 1: «بس كده؟»
const SNAKES_TENSE_MS = 700;         // from 95: the drumroll before the die
const SNAKES_TENSE_FROM = 95;
const SNAKES_SIXES_MS = [700, 900, 1300];    // the first six, the second, the third and after (fireworks)
const SNAKES_LEAVE_MS = 1800;        // a player who leaves picks up a suitcase and walks off
const SNAKES_DIE_MS = 1000;          // the die tumbling and landing
const SNAKES_HOP_MS = 210;           // one square of a walk
const SNAKES_NEAR_MS = 1000;         // a snake snapping at a near miss, a ladder just missed
const SNAKES_SIX_MS = 700;           // the cheer for a six
const SNAKES_WIN_MS = 2800;          // the trophy dance at 100
const SNAKES_BOUNCE_MS = 900;        // bumping into the cup at 100 (it giggles) before walking back
const SNAKES_BUILD_MS = 5600;        // the map built in front of everyone
const SNAKES_TEARDOWN_MS = 2600;     // the old map taken apart first (play again)
const SNAKES_BUILD_VARIANTS = 3;

/* --- the third round (the owner, 2 Oct 2026) ----------------------------------------------------
   Four themed maps (the same rules, the board dressed: النيل, المترو, الصحرا, الحارة, and the classic
   as before), each with its own down and up moves, picked here like the classic's and never the
   same twice in a row; the surprise squares (a switch, off by default); «الخريطة بتتحرك» (a switch,
   off by default: every 3 rounds a snake crawls to a new spot); teams of 2 or 3 in rooms; and the
   awards the podium reveals, from the moments this file records. All of it optional on a game:
   with every switch off and the classic map a game is the same object, rolled the same way. */
const SNAKES_THEMES = ['classic', 'nile', 'metro', 'desert', 'hara'];
/** Each theme's down moves (s) and up moves (l), with how long every screen takes to show each. */
const SNAKES_THEME_MOVES = {
  nile:   { s: { gulp: 3000, ride: 2600, tears: 3200, chase: 3000 }, l: { climb: 1900, rope: 2200, slip: 2700, egret: 2500 } },
  metro:  { s: { whoosh: 2400, spin: 2800, ticket: 3000 }, l: { ride: 2400, run: 1400, broken: 2800, wrong: 2800 } },
  desert: { s: { gulp: 3000, board: 2600, storm: 3000, mizmar: 3200 }, l: { climb: 2100, camel: 3000, balloon: 2800, dates: 2900 } },
  hara:   { s: { chase: 3000, pole: 2600, water: 3000, ride: 2800 }, l: { climb: 2000, sprint: 1300, basket: 2600, pigeons: 2800 } }
};
/** A game's theme: one of SNAKES_THEMES (an old game, or an unknown name, is the classic). */
const snakesTheme = (g) => (g && SNAKES_THEME_MOVES[g.theme] ? g.theme : 'classic');
/** The down (k 's') or up (k 'l') moves of a game's theme. */
const snakesMovesOf = (g, k) => {
  const th = SNAKES_THEME_MOVES[snakesTheme(g)];
  return th ? Object.keys(th[k]) : (k === 's' ? SNAKES_SNAKE_MOVES : SNAKES_LADDER_MOVES);
};
const snakesMoveMs = (theme, k, v) => {
  const th = SNAKES_THEME_MOVES[theme];
  return (th && th[k] && th[k][v]) || SNAKES_MOVE_MS[v] || 2500;
};

/* The surprise squares (the owner, 2 Oct 2026; look ج «حاجة واقفة»): six a map, one of each, four
   good and two bad: 🪈 الحاوي (a charm: the next snake you land on lets you pass), 🔄 swap places with
   the player just ahead of you, ⭐ roll again, 💨 a ladder worker carries you 3-5 squares (never onto a
   snake, a ladder or another surprise), 🍌 a banana peel (back 3), 😴 a nap (you miss your next turn). */
const SNAKES_SURPRISES = ['charm', 'swap', 'again', 'worker', 'peel', 'nap'];
const SNAKES_SURP_MS = { charm: 2200, swap: 2000, again: 1500, worker: 1900, peel: 2200, nap: 1900, none: 1100 };
const SNAKES_WORKER_STEP_MS = 300;    // the worker carries you a square
const SNAKES_CHARMED_MS = 2600;       // the snake sways to the flute and lets you pass
const SNAKES_NAP_MS = 2000;           // «نايم!»: the turn passes the napper by, then he wakes
const SNAKES_PEEL_BACK = 3;
const SNAKES_WORKER_BY = [3, 4, 5];

/* «الخريطة بتتحرك» (the owner, 2 Oct 2026): every 3 rounds - everyone has had 3 turns - one snake
   crawls to a new spot the server picks, the map still fair; a piece on its new head is eaten (it
   slides down to the new tail). */
const SNAKES_MOVE_EVERY = 3;
const SNAKES_MOVE_SNAKE_MS = 3200;    // the crawl to the new spot
const SNAKES_MOVE_EAT_MS = 1500;      // and a piece eaten on its way

/* Teams (rooms only, the owner, 2 Oct 2026): 4 people play as 2 teams of 2; 6 as 3 teams of 2 or 2
   teams of 3 (the host's pick). A team wins when all its members are home; a member home rolls for
   the teammate furthest behind (the lowest square, on a tie the next in turn order). */
const SNAKES_TEAM_SIZES = { 4: [2], 6: [2, 3] };

/* The awards (look ج «لقطة»): up to three a game, the most dramatic, each measured against the most
   it could reasonably be (SNAKES_AWARD_CAP), revealed one by one, the biggest last. */
const SNAKES_AWARD_CAP = { fall: 90, ladder: 90, eaten: 6, sixes: 9 };
const SNAKES_AWARDS_MAX = 3;

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

/** The die: the app's one die (Dice.js). */
const snakesDie = () => fairDie();

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

/**
 * Games simulated on a map: the average number of turns a player takes to reach 100, and the worst.
 * `surp` (the surprise squares, optional) is played as one player alone would meet it: the charm
 * skips the next snake, a star rolls again, the worker carries you on, the peel takes you back, a nap
 * costs a turn (a swap needs someone ahead, so it counts for nothing here).
 */
const snakesFairness = (snakes, ladders, rnd, games, surp) => {
  const jump = {};
  snakes.forEach(s => { jump[s.h] = s.t; });
  ladders.forEach(l => { jump[l.f] = l.t; });
  const heads = {};
  snakes.forEach(s => { heads[s.h] = true; });
  const sp = surp || {};
  const workerTo = (n) => { for (let i = 0; i < SNAKES_WORKER_BY.length; i++) { const t = n + SNAKES_WORKER_BY[i]; if (t < 100 && !jump[t] && !sp[t]) return t; } return n; };
  const n = games || 120;
  let tot = 0, worst = 0;
  for (let g = 0; g < n; g++) {
    let pos = 0, turns = 0, charm = false, nap = false;
    while (pos !== 100 && turns < 400) {
      turns++;
      if (nap) { nap = false; continue; }
      let again = true;
      while (again && pos !== 100) {
        const v = 1 + Math.floor(rnd() * 6);
        again = v === 6;
        let t = pos + v;
        if (t > 100) t = 200 - t;
        if (heads[t] && charm) { charm = false; pos = t; }
        else pos = jump[t] || t;
        const k = sp[pos];
        if (k === 'charm') charm = true;
        else if (k === 'again') again = true;
        else if (k === 'worker') pos = workerTo(pos);
        else if (k === 'peel') pos = Math.max(1, pos - SNAKES_PEEL_BACK);
        else if (k === 'nap') { nap = true; again = false; }
      }
    }
    tot += turns;
    worst = Math.max(worst, turns);
  }
  return { avg: tot / n, worst: worst };
};

/** A seeded Fisher-Yates shuffle (a random comparator in sort() is engine-dependent: Safari and Chrome would differ). */
const snakesShuffle = (list, rnd) => {
  const a = list.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); const x = a[i]; a[i] = a[j]; a[j] = x; }
  return a;
};

/**
 * The six surprise squares for a map (one of each kind), from `rnd`: on squares nothing else uses
 * (never 1 or 100, never a snake's or a ladder's end), 5-96, at least 4 apart, clear of the snakes'
 * and the ladders' lines so the object standing at the top of the square shows; the charm low enough
 * that a snake is still ahead of it; the peel's square 3 back and at least one of the worker's 3-5
 * ahead free of anything. Null when the map has no room for them.
 */
const snakesPlaceSurprises = (m, rnd) => {
  const used = new Set([1, 100]);
  m.snakes.forEach(s => { used.add(s.h); used.add(s.t); });
  m.ladders.forEach(l => { used.add(l.f); used.add(l.t); });
  const heads = m.snakes.map(s => s.h);
  const clear = (n) => {
    const q = snakesCellXY(n), top = { x: q.x, y: q.y - 27 };
    let d = 1e9;
    m.snakes.forEach(s => { d = Math.min(d, snakesSegDist(top, snakesCellXY(s.h), snakesCellXY(s.t)) - 22); });
    m.ladders.forEach(l => { d = Math.min(d, snakesSegDist(top, snakesCellXY(l.f), snakesCellXY(l.t)) - 12); });
    return d;
  };
  const cand = [];
  for (let n = 5; n <= 96; n++) if (!used.has(n) && heads.indexOf(n + 1) === -1 && heads.indexOf(n - 1) === -1) cand.push({ n: n, d: clear(n) });
  const maxH = Math.max.apply(null, heads);
  for (let need = 16; need > -10; need -= 6) {
    const ok = snakesShuffle(cand.filter(o => o.d > need), rnd);
    const pick = [];
    ok.forEach(o => { if (pick.length < 6 && pick.every(p => Math.abs(p - o.n) >= 4)) pick.push(o.n); });
    if (pick.length < 6) continue;
    for (let k = 0; k < 24; k++) {
      const kinds = snakesShuffle(SNAKES_SURPRISES, rnd);
      const out = {};
      pick.forEach((n, i) => { out[n] = kinds[i]; });
      const at = (kind) => Number(Object.keys(out).find(n => out[n] === kind));
      const busy = (n) => used.has(n) || !!out[n];
      const c = at('charm'), p = at('peel'), w = at('worker');
      if (c > maxH - 6) continue;
      if (p - SNAKES_PEEL_BACK < 2 || busy(p - SNAKES_PEEL_BACK)) continue;
      if (!SNAKES_WORKER_BY.some(d => w + d < 100 && !busy(w + d))) continue;
      return out;
    }
  }
  return null;
};

/* How many of each, and where (the owner, 28 Sep 2026: "the ladders and snakes'
   number and places fit and organised correctly and fairly"). Rows count from the
   bottom, 0 (1-10) to 9 (91-100). Each band gets one snake head (or ladder foot),
   so every map spreads them over the whole board: there is always a snake in the
   last row and in the one before it, and always a ladder in the first two rows.
   A map has 6 to 8 of each (the owner, the same day: "at least 6 and at max 8"),
   drawn per map: the five bands, then one to three extras anywhere in the
   extra band's rows. */
const SNAKES_SNAKE_BANDS = [[9, 9], [8, 8], [6, 7], [4, 5], [2, 3]];
const SNAKES_LADDER_BANDS = [[0, 0], [1, 1], [2, 3], [4, 5], [6, 7]];
const SNAKES_SNAKE_EXTRA = [1, 8];
const SNAKES_LADDER_EXTRA = [0, 6];
const SNAKES_COUNT = [6, 8];             // snakes, and ladders, on a map: at least, at most
const SNAKES_FAIR_TURNS = [14, 32];      // the average turns a player takes to reach 100 on a map
const SNAKES_BALANCE = [0.75, 1.35];     // the snakes' total drop over the ladders' total climb

/**
 * The map for a seed: 6 to 8 snakes and 6 to 8 ladders (SNAKES_COUNT), a snake head
 * in each of SNAKES_SNAKE_BANDS' rows and a ladder foot in each of SNAKES_LADDER_BANDS'
 * (the rest in the extra bands), nothing sharing a square, a snake's head
 * at least a row above its tail and no two snakes crossing, a ladder at least two
 * rows long and never more than two columns aside, the snakes' drop and the
 * ladders' climb in balance (SNAKES_BALANCE), and a game that takes
 * SNAKES_FAIR_TURNS turns on average (simulated, seeded too). The same seed gives
 * the same map everywhere.
 */
const snakesGenMap = (seed, opts) => {
  const withSurp = !!(opts && opts.surprises);
  const rnd = snakesRng(seed);
  const C = SNAKES_C;
  const cd = (a, b) => { const p = snakesCellXY(a), q = snakesCellXY(b); return Math.hypot(p.x - q.x, p.y - q.y) / C; };
  const inRows = (lo, hi) => lo * 10 + 1 + Math.floor(rnd() * (hi - lo + 1) * 10);
  let fallback = null;
  // How many, drawn once for the map and kept: a crowded board is harder to fit, and
  // drawing again on every try would leave 8 rare. Only after 200 tries in vain does
  // the larger count give one up (never under SNAKES_COUNT[0]).
  const count = () => SNAKES_COUNT[0] + Math.floor(rnd() * (SNAKES_COUNT[1] - SNAKES_COUNT[0] + 1));
  let nS = count(), nL = count();
  for (let tries = 0; tries < 800; tries++) {
    if (tries && tries % 200 === 0) { if (nS >= nL && nS > SNAKES_COUNT[0]) nS--; else if (nL > SNAKES_COUNT[0]) nL--; }
    const used = new Set([1, 100]);
    const snakes = [];
    const ladders = [];
    const sBands = SNAKES_SNAKE_BANDS.slice(), lBands = SNAKES_LADDER_BANDS.slice();
    for (let k = nS - sBands.length; k > 0; k--) sBands.push(SNAKES_SNAKE_EXTRA);
    for (let k = nL - lBands.length; k > 0; k--) lBands.push(SNAKES_LADDER_EXTRA);
    let ok = true;
    for (let i = 0; i < sBands.length && ok; i++) {
      const band = sBands[i];
      let placed = false;
      for (let t = 0; t < 140 && !placed; t++) {
        const h = inRows(band[0], band[1]);
        const tl = h - (11 + Math.floor(rnd() * 35));
        if (h > 99 || h < 12 || tl < 2 || used.has(h) || used.has(tl)) continue;
        if (snakes.some(s => cd(s.h, h) < 2.1 || cd(s.t, tl) < 1.6 || cd(s.h, tl) < 1.2 || cd(s.t, h) < 1.2)) continue;
        const a = snakesCellXY(h), b = snakesCellXY(tl);
        if (Math.abs(a.x - b.x) > 4 * C || a.y - b.y > -C) continue;
        if (snakes.some(o => { const c1 = snakesCellXY(o.h), c2 = snakesCellXY(o.t); return snakesSegCross(a, b, c1, c2) || snakesSegDist(a, c1, c2) < 55 || snakesSegDist(b, c1, c2) < 45 || snakesSegDist(c1, a, b) < 55; })) continue;
        snakes.push({ h: h, t: tl });
        used.add(h); used.add(tl);
        placed = true;
      }
      ok = placed;
    }
    for (let i = 0; i < lBands.length && ok; i++) {
      const band = lBands[i];
      let placed = false;
      for (let t = 0; t < 140 && !placed; t++) {
        const f = Math.max(2, inRows(band[0], band[1]));
        const top = f + 14 + Math.floor(rnd() * 24);
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
    const drop = snakes.reduce((n, s) => n + s.h - s.t, 0), climb = ladders.reduce((n, l) => n + l.t - l.f, 0);
    const bal = drop / climb;
    if (bal < SNAKES_BALANCE[0] || bal > SNAKES_BALANCE[1]) continue;
    const st = snakesFairness(snakes, ladders, rnd, 120);
    const m = { seed: Number(seed) >>> 0, snakes: snakes, ladders: ladders, avg: Math.round(st.avg * 10) / 10 };
    if (!fallback) fallback = m;
    if (st.avg < SNAKES_FAIR_TURNS[0] || st.avg > SNAKES_FAIR_TURNS[1] || st.worst > 220) continue;
    if (!withSurp) return m;
    // The surprise squares: their own random source (so the classic map of a seed never changes),
    // and the map kept only when it is still fair with them.
    for (let k = 0; k < 12; k++) {
      const sr = snakesRng(((Number(seed) >>> 0) ^ Math.imul(k + 1, 0x9e3779b1) ^ Math.imul(tries + 1, 7919)) >>> 0);
      const surp = snakesPlaceSurprises(m, sr);
      if (!surp) break;
      const sf = snakesFairness(snakes, ladders, sr, 120, surp);
      if (sf.avg < SNAKES_FAIR_TURNS[0] || sf.avg > SNAKES_FAIR_TURNS[1] || sf.worst > 220) continue;
      m.surp = surp;
      m.avg = Math.round(sf.avg * 10) / 10;
      return m;
    }
  }
  if (withSurp && fallback && !fallback.surp) {
    const surp = snakesPlaceSurprises(fallback, snakesRng((Number(seed) >>> 0) ^ 0x51ed27));
    if (surp) fallback.surp = surp;
  }
  return fallback;
};

/** Is square `n` a snake's head, a ladder's foot or a surprise (a square that moves you)? */
const snakesSpecial = (m, n) => n === 100 || m.snakes.some(s => s.h === n) || m.ladders.some(l => l.f === n) || !!(m.surp && m.surp[n]);

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
    map: snakesGenMap(seed, { surprises: !!o.surprises }),
    lastS: '',
    lastL: '',
    lastT: '',
    rolls: 0,
    readyAt: 0
  };
  // The third round's options, each only when it is on (an old phone's game, or the classic, has none of them).
  if (o.theme && SNAKES_THEME_MOVES[o.theme]) g.theme = o.theme;
  if (o.surprises || o.moving) g.opts = { surprises: !!o.surprises, moving: !!o.moving };
  if (o.surprises) { g.charm = {}; g.nap = {}; }
  if (o.moving) { g.took = {}; g.moves = 0; }
  if (Array.isArray(o.teams) && o.teams.length > 1) {
    g.teams = o.teams.map(t => (t || []).filter(id => seats.indexOf(id) !== -1));
    g.teamPlaces = [];
  }
  // What the awards are made of: who was eaten most, the longest ladder, the most sixes, the worst fall.
  g.stats = { eaten: {}, sixes: {}, eats: {}, lead: {}, fall: null, ladder: null };
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

/** How long a surprise takes to show. */
const snakesSurpMs = (s) => {
  if (!s) return 0;
  if (s.none) return SNAKES_SURP_MS.none;
  return (SNAKES_SURP_MS[s.k] || 1500) + (s.k === 'worker' ? (s.by || 0) * SNAKES_WORKER_STEP_MS : 0);
};

/** How long every screen takes to show a roll: every part of it, the second and third rounds' included. */
const snakesRollMs = (e, theme) => {
  let ms = SNAKES_DIE_MS;
  if (e.tense) ms += SNAKES_TENSE_MS;
  if (e.over) ms += (100 - e.from) * SNAKES_HOP_MS + SNAKES_BOUNCE_MS + e.over * SNAKES_HOP_MS;
  else ms += Math.max(1, e.walk - (e.from === 0 ? 0 : e.from)) * SNAKES_HOP_MS;
  (e.pass || []).forEach(x => { ms += SNAKES_PASS_MS[x.v] || 0; });
  if (e.n === 1 && !e.jump && !e.over && !e.place && !e.surp && !e.charmed) ms += SNAKES_ONE_MS;
  if (e.jump) ms += snakesMoveMs(theme || 'classic', e.jump.k, e.jump.v);
  else if (e.charmed) ms += SNAKES_CHARMED_MS;
  else if (e.surp) ms += snakesSurpMs(e.surp);
  else if (e.tail) ms += SNAKES_TAIL_MS[e.tail.v] || 1600;
  else if (e.sneak) ms += SNAKES_SNEAK_MS[e.sneak.v] || 2800;
  else if (e.near) ms += SNAKES_NEAR_MS;
  if (e.meet) ms += SNAKES_MEET_MS;
  if (e.place) ms += SNAKES_WIN_MS;
  else if (e.n === 6) ms += e.sixes ? SNAKES_SIXES_MS[Math.min(e.sixes, 3) - 1] : SNAKES_SIX_MS;
  return ms + 300;
};

/** The squares a walk goes through, its last square left out: up to 100 and back when it bounces. */
const snakesPathOf = (from, v) => {
  const out = [];
  for (let k = 1; k <= v; k++) out.push(from + k <= 100 ? from + k : 200 - (from + k));
  return out.slice(0, -1);
};

/** The snake whose head is nearest to a square: for the sneak, the one nearest to him (his own square) crawls over. */
const snakesNearestSnake = (map, n) => {
  const p = snakesCellXY(n);
  let best = null, bd = 1e9;
  (map.snakes || []).forEach(s => { const q = snakesCellXY(s.h), d = Math.hypot(p.x - q.x, p.y - q.y); if (d < bd) { bd = d; best = s; } });
  return best;
};

/* --- teams (rooms only) -------------------------------------------------------------------- */

/** The team `id` is on (its index in g.teams), or -1 (no teams). */
const snakesTeamOf = (g, id) => (Array.isArray(g.teams) ? g.teams.findIndex(t => t.indexOf(id) !== -1) : -1);

/** A team is done when it still has someone at the table and all of them are home. */
const snakesTeamDone = (g, ti) => {
  const live = ((g.teams || [])[ti] || []).filter(id => g.seats.indexOf(id) !== -1);
  return live.length > 0 && live.every(id => g.places.indexOf(id) !== -1);
};

/** Still playing: a seat not home (each for themselves), or a member of a team not done yet (home or not: a member home rolls for the team). */
const snakesActive = (g, id) => {
  if (g.seats.indexOf(id) === -1 || (g.gone && g.gone.indexOf(id) !== -1)) return false;
  if (!Array.isArray(g.teams)) return g.places.indexOf(id) === -1;
  const ti = snakesTeamOf(g, id);
  if (ti === -1) return g.places.indexOf(id) === -1;
  return (g.teamPlaces || []).indexOf(ti) === -1;
};

/**
 * The piece a roll of `pid` moves: their own; in a team, once they are home, the teammate furthest
 * behind (the lowest square; on a tie the next in turn order after them).
 */
const snakesPieceOf = (g, pid) => {
  if (!Array.isArray(g.teams) || g.places.indexOf(pid) === -1) return pid;
  const team = g.teams[snakesTeamOf(g, pid)] || [];
  const n = g.seats.length, i = g.seats.indexOf(pid);
  let best = null;
  for (let k = 1; k <= n; k++) {
    const id = g.seats[(i + k) % n];
    if (team.indexOf(id) === -1 || g.places.indexOf(id) !== -1) continue;
    if (best === null || (g.pos[id] || 0) < (g.pos[best] || 0)) best = id;
  }
  return best || pid;
};

/** The team sizes this many at the table can play in. */
const snakesTeamSizesFor = (n) => SNAKES_TEAM_SIZES[n] || [];

/**
 * The teams for `seated` with teams of `size`: the lobby's groups kept as far as they go (people no
 * longer seated dropped, the unplaced put in the first team with room, in seat order); when the
 * number of teams no longer fits, everyone in that order cut into teams again. Null when `size`
 * doesn't fit the table (teams off).
 */
const snakesTeamGroups = (seated, size, groups) => {
  if (snakesTeamSizesFor(seated.length).indexOf(size) === -1) return null;
  const count = seated.length / size;
  const kept = (Array.isArray(groups) ? groups : []).map(t => (Array.isArray(t) ? t : []).filter(id => seated.indexOf(id) !== -1));
  const placed = kept.reduce((a, t) => a.concat(t), []);
  if (kept.length === count && kept.every(t => t.length <= size) && placed.length === new Set(placed).size) {
    const out = kept.map(t => t.slice());
    seated.forEach(id => { if (placed.indexOf(id) === -1) { const t = out.find(x => x.length < size); if (t) t.push(id); } });
    if (out.every(t => t.length === size)) return out;
  }
  const order = placed.filter((id, i) => placed.indexOf(id) === i).concat(seated.filter(id => placed.indexOf(id) === -1));
  const out = [];
  for (let k = 0; k < count; k++) out.push(order.slice(k * size, k * size + size));
  return out;
};

/** Who plays after `pid`: the next seat still playing. */
const snakesNextSeat = (g, pid) => {
  const n = g.seats.length;
  const i = g.seats.indexOf(pid);
  for (let k = 1; k <= n; k++) {
    const id = g.seats[(i + k) % n];
    if (snakesActive(g, id)) return id;
  }
  return null;
};

/** Everyone still playing. */
const snakesLeft = (g) => g.seats.filter(id => snakesActive(g, id));

/* --- the end, and the awards -------------------------------------------------------------- */

/** Counts a moment toward an award: `key` 'eaten' or 'sixes'. The first to reach the most keeps it on a tie. */
const snakesCount = (g, key, pid) => {
  const st = g.stats;
  if (!st) return;
  st[key][pid] = (st[key][pid] || 0) + 1;
  const lead = st.lead[key];
  if (!lead || st[key][pid] > lead.val) st.lead[key] = { pid: pid, val: st[key][pid] };
};
/** A piece going down `from` → `to` in one roll (a snake, a peel, a snake that moved onto him): the worst fall. */
const snakesFallen = (g, pid, from, to) => {
  const st = g.stats;
  if (!st || !(from > to)) return;
  if (!st.fall || from - to > st.fall.val) st.fall = { pid: pid, from: from, to: to, val: from - to };
};
/** Eaten by a snake (it lands on its head, or the snake moves onto it): counted, and its squares kept for the replay. */
const snakesEaten = (g, pid, h, t) => {
  const st = g.stats;
  if (!st) return;
  snakesCount(g, 'eaten', pid);
  st.eats[pid] = (st.eats[pid] || []).concat([{ h: h, t: t }]).slice(-6);
  snakesFallen(g, pid, h, t);
};

/**
 * The awards (look ج «لقطة»): of 🐍 the most eaten, 🪜 the longest ladder, 🎲 the most sixes and
 * 😭 the worst fall, up to three, the most dramatic - each over the most it could reasonably be
 * (SNAKES_AWARD_CAP) - in the order they are revealed, the biggest last. Each keeps its moment's
 * squares, so every screen replays the same: a fall's and a ladder's from and to, the snakes that ate.
 */
const snakesAwards = (g) => {
  const st = g.stats;
  if (!st) return [];
  const out = [];
  const lead = st.lead || {};
  if (lead.eaten && lead.eaten.val >= 1) out.push({ k: 'eaten', pid: lead.eaten.pid, val: lead.eaten.val, eats: (st.eats[lead.eaten.pid] || []).slice() });
  if (st.ladder) out.push({ k: 'ladder', pid: st.ladder.pid, val: st.ladder.val, from: st.ladder.from, to: st.ladder.to });
  if (lead.sixes && lead.sixes.val >= 2) out.push({ k: 'sixes', pid: lead.sixes.pid, val: lead.sixes.val });
  if (st.fall) out.push({ k: 'fall', pid: st.fall.pid, val: st.fall.val, from: st.fall.from, to: st.fall.to });
  const score = (a) => a.val / SNAKES_AWARD_CAP[a.k];
  return out.filter(a => g.seats.indexOf(a.pid) !== -1)
    .sort((a, b) => score(b) - score(a)).slice(0, SNAKES_AWARDS_MAX).reverse();
};

const snakesFinish = (g) => {
  g.phase = 'gameover';
  g.turn = { pid: null, sixes: 0 };
  g.awards = snakesAwards(g);
  snakesEvent(g, 'over', Array.isArray(g.teams) ? { places: g.places.slice(), teamPlaces: g.teamPlaces.slice() } : { places: g.places.slice() });
};

/**
 * The game is over once one is left: they take the last place. In teams a team takes its place when
 * all its members are home, and the last team left takes the last.
 */
const snakesCheckOver = (g) => {
  if (g.phase !== 'play') return false;
  if (Array.isArray(g.teams)) {
    g.teamPlaces = g.teamPlaces || [];
    g.teams.forEach((t, ti) => {
      if (g.teamPlaces.indexOf(ti) === -1 && snakesTeamDone(g, ti)) {
        g.teamPlaces.push(ti);
        snakesEvent(g, 'teamDone', { team: ti, place: g.teamPlaces.length });
      }
    });
    const left = g.teams.map((t, ti) => ti).filter(ti => g.teamPlaces.indexOf(ti) === -1 && g.teams[ti].some(id => g.seats.indexOf(id) !== -1));
    if (left.length > 1) return false;
    if (left.length === 1) {
      g.teamPlaces.push(left[0]);
      g.teams[left[0]].filter(id => g.seats.indexOf(id) !== -1 && g.places.indexOf(id) === -1)
        .sort((a, b) => (g.pos[b] || 0) - (g.pos[a] || 0)).forEach(id => g.places.push(id));
    }
    snakesFinish(g);
    return true;
  }
  const left = snakesLeft(g);
  if (left.length <= 1) {
    if (left.length === 1) g.places.push(left[0]);
    snakesFinish(g);
    return true;
  }
  return false;
};

/* --- the moving map ----------------------------------------------------------------------- */

/**
 * A new spot for one snake (the owner, 2 Oct 2026: «الخريطة بتتحرك»): the snake and the spot drawn
 * from `rnd`, the head kept in its band (so a snake still lies near 100), the generator's own rules
 * for where a snake may lie (ends free, none crossing, clear of the ladders), never on a surprise,
 * and the map with it still in balance and fair. Null when no snake has such a spot.
 */
const snakesMoveSpot = (g, rnd) => {
  const m = g.map;
  const C = SNAKES_C;
  const cd = (a, b) => { const p = snakesCellXY(a), q = snakesCellXY(b); return Math.hypot(p.x - q.x, p.y - q.y) / C; };
  const bandOf = (row) => SNAKES_SNAKE_BANDS.find(b => row >= b[0] && row <= b[1]) || SNAKES_SNAKE_EXTRA;
  const order = snakesShuffle(m.snakes.map((s, i) => i), rnd);
  for (let oi = 0; oi < order.length; oi++) {
    const i = order[oi];
    const old = m.snakes[i];
    const others = m.snakes.filter((s, j) => j !== i);
    const used = new Set([1, 100]);
    others.forEach(s => { used.add(s.h); used.add(s.t); });
    m.ladders.forEach(l => { used.add(l.f); used.add(l.t); });
    Object.keys(m.surp || {}).forEach(n => used.add(Number(n)));
    const band = bandOf(snakesRowOf(old.h));
    for (let t = 0; t < 60; t++) {
      const h = band[0] * 10 + 1 + Math.floor(rnd() * (band[1] - band[0] + 1) * 10);
      const tl = h - (11 + Math.floor(rnd() * 35));
      if (h === old.h || h > 99 || h < 12 || tl < 2 || used.has(h) || used.has(tl)) continue;
      if (others.some(s => cd(s.h, h) < 2.1 || cd(s.t, tl) < 1.6 || cd(s.h, tl) < 1.2 || cd(s.t, h) < 1.2)) continue;
      const a = snakesCellXY(h), b = snakesCellXY(tl);
      if (Math.abs(a.x - b.x) > 4 * C || a.y - b.y > -C) continue;
      if (others.some(o => { const c1 = snakesCellXY(o.h), c2 = snakesCellXY(o.t); return snakesSegCross(a, b, c1, c2) || snakesSegDist(a, c1, c2) < 55 || snakesSegDist(b, c1, c2) < 45 || snakesSegDist(c1, a, b) < 55; })) continue;
      if (m.ladders.some(l => { const f = snakesCellXY(l.f), top = snakesCellXY(l.t); return snakesSegDist(a, f, top) < 40 || snakesSegDist(b, f, top) < 26 || snakesSegCross(a, b, f, top); })) continue;
      const snakes = others.concat([{ h: h, t: tl }]);
      const drop = snakes.reduce((n, s) => n + s.h - s.t, 0), climb = m.ladders.reduce((n, l) => n + l.t - l.f, 0);
      if (drop / climb < SNAKES_BALANCE[0] || drop / climb > SNAKES_BALANCE[1]) continue;
      const st = snakesFairness(snakes, m.ladders, rnd, 80, m.surp);
      if (st.avg < SNAKES_FAIR_TURNS[0] || st.avg > SNAKES_FAIR_TURNS[1] || st.worst > 220) continue;
      return { i: i, h: h, t: tl };
    }
  }
  return null;
};

/**
 * Every 3 rounds (everyone still playing has had 3 turns since the last one), one snake crawls to a
 * new spot; anyone standing on its new head is eaten and slides down to the new tail. The snake keeps
 * its colour and face; its new curve is drawn from `w` on every screen (and `was`, the spot it was
 * first drawn at, keeps every other snake's curve as it was). Returns the event or null.
 */
const snakesMaybeMove = (g, rnd) => {
  if (!g.opts || !g.opts.moving || g.phase !== 'play') return null;
  g.took = g.took || {};
  const live = snakesLeft(g);
  if (!live.length) return null;
  const lap = Math.min.apply(null, live.map(id => g.took[id] || 0));
  const due = ((g.moves || 0) + 1) * SNAKES_MOVE_EVERY;
  if (lap < due) return null;
  g.moves = (g.moves || 0) + 1;
  const spot = snakesMoveSpot(g, rnd);
  if (!spot) return null;
  const old = g.map.snakes[spot.i];
  const w = 1 + Math.floor(rnd() * 2147483646);
  g.map.snakes[spot.i] = { h: spot.h, t: spot.t, w: w, was: old.was || { h: old.h, t: old.t } };
  g.map.v = (g.map.v || 0) + 1;
  const eat = g.seats.filter(id => snakesActive(g, id) && g.places.indexOf(id) === -1 && g.pos[id] === spot.h);
  eat.forEach(id => { g.pos[id] = spot.t; snakesEaten(g, id, spot.h, spot.t); });
  const ms = SNAKES_MOVE_SNAKE_MS + (eat.length ? SNAKES_MOVE_EAT_MS : 0);
  const e = snakesEvent(g, 'move', { i: spot.i, from: { h: old.h, t: old.t }, to: { h: spot.h, t: spot.t }, w: w, eat: eat.length ? eat : undefined, ms: ms });
  g.readyAt = (g.readyAt || 0) + ms;
  return e;
};

/**
 * The turn passes on from `pid` (counted as their turn, for the moving map). A piece napping misses
 * the turn that would move it: «نايم!», its nap is used up and the turn goes on (`nap` event, waited
 * for in readyAt).
 */
const snakesPassTurn = (g, pid) => {
  if (g.took) g.took[pid] = (g.took[pid] || 0) + 1;
  let next = snakesNextSeat(g, pid);
  for (let guard = 0; next && g.nap && g.nap[snakesPieceOf(g, next)] && guard < 12; guard++) {
    const who = snakesPieceOf(g, next);
    delete g.nap[who];
    snakesEvent(g, 'nap', { pid: who, by: who !== next ? next : undefined, ms: SNAKES_NAP_MS });
    g.readyAt = (g.readyAt || 0) + SNAKES_NAP_MS;
    if (g.took) g.took[next] = (g.took[next] || 0) + 1;
    next = snakesNextSeat(g, next);
  }
  g.turn = { pid: next, sixes: 0 };
};

/**
 * `pid` rolls `v`: the walk (bouncing off 100), the snake or ladder at the end, a
 * near miss, a six to roll again, a finish. `rnd` picks the variant; `now` is
 * the time the roll is made (readyAt counts from it). Returns the event.
 * In a team, a member already home rolls for the teammate furthest behind (snakesPieceOf): the
 * event's `pid` is the piece that moves, `by` who rolled.
 */
const snakesRoll = (g, pid, v, rnd, now) => {
  if (g.phase !== 'play') throw new Error('اللعبة خلصت');
  if (!g.turn || g.turn.pid !== pid) throw new Error('مش دورك');
  if (!(v >= 1 && v <= 6)) throw new Error('رقم غلط');
  const rand = rnd || Math.random;
  const theme = snakesTheme(g);
  const mover = snakesPieceOf(g, pid);
  const from = g.pos[mover] || 0;
  let walk = from + v;
  let over = 0;
  if (walk > 100) { over = walk - 100; walk = 100 - over; }
  let to = walk;
  let jump = null, charmed = null;
  const sn = g.map.snakes.find(s => s.h === walk);
  const ld = g.map.ladders.find(l => l.f === walk);
  if (sn && g.charm && g.charm[mover]) {
    // 🪈 The charm: the snake sways to the flute and lets him pass; the charm is used up.
    delete g.charm[mover];
    charmed = { h: sn.h };
  } else if (sn) {
    const mv = snakesPickMove(snakesMovesOf(g, 's'), g.lastS, rand);
    g.lastS = mv;
    jump = { k: 's', to: sn.t, v: mv };
    to = sn.t;
  } else if (ld) {
    const mv = snakesPickMove(snakesMovesOf(g, 'l'), g.lastL, rand);
    g.lastL = mv;
    jump = { k: 'l', to: ld.t, v: mv };
    to = ld.t;
  }
  const sk = !jump && !charmed && g.map.surp ? g.map.surp[walk] || null : null;
  let near = null;
  if (!jump && !charmed && !sk && walk > 0 && walk < 100) {
    if (g.map.snakes.some(s => Math.abs(s.h - walk) === 1)) near = 's';
    else if (g.map.ladders.some(l => l.f === walk + 1 || l.f === walk - 1)) near = 'l';
  }
  // The second round (29 Sep 2026), picked here and in this order, so one random source
  // gives the same roll everywhere: each snake head walked past (ducked under, snapped at,
  // or jumped over), a snake's tail square, the sneak beside a ladder's foot, two on one square.
  const pass = [];
  snakesPathOf(from, v).forEach(n => {
    if (!g.map.snakes.some(s => s.h === n)) return;
    pass.push({ h: n, v: rand() < SNAKES_PASS_JUMP ? 'jump' : rand() < SNAKES_PASS_SNAP ? 'snap' : 'duck' });
  });
  let tail = null, sneak = null;
  const tailOf = !jump && !charmed && !sk && walk > 0 && walk < 100 ? g.map.snakes.find(s => s.t === walk) : null;
  if (tailOf) {
    // About half the time the tail plays with him; otherwise he just stands (no near miss either).
    if (rand() < SNAKES_TAIL_CHANCE) {
      const tv = snakesPickMove(SNAKES_TAIL_MOVES, g.lastT, rand);
      g.lastT = tv;
      tail = { v: tv, h: tailOf.h };
    }
    near = null;
  } else if (near === 'l' && rand() < SNAKES_SNEAK_CHANCE) {
    const ld2 = g.map.ladders.find(l => l.f === walk + 1 || l.f === walk - 1);
    const sn2 = snakesNearestSnake(g.map, walk);
    if (sn2) sneak = { f: ld2.f, h: sn2.h, v: SNAKES_SNEAK_ENDS[Math.floor(rand() * SNAKES_SNEAK_ENDS.length) % SNAKES_SNEAK_ENDS.length] };
  }
  // The third round: a surprise square (its object acts; decided here, so every screen shows the same).
  let surp = null, extra = false, napNow = false;
  if (sk) {
    surp = { k: sk, n: walk };
    if (sk === 'charm') g.charm[mover] = true;
    else if (sk === 'again') extra = true;
    else if (sk === 'nap') { g.nap[mover] = true; napNow = true; }
    else if (sk === 'peel') { to = Math.max(1, walk - SNAKES_PEEL_BACK); surp.to = to; snakesFallen(g, mover, walk, to); }
    else if (sk === 'worker') {
      const d = snakesShuffle(SNAKES_WORKER_BY, rand).find(x => walk + x < 100 && !snakesSpecial(g.map, walk + x));
      if (d) { to = walk + d; surp.by = d; surp.to = to; } else surp.none = true;
    } else if (sk === 'swap') {
      let ahead = null;
      g.seats.forEach(id => {
        if (id === mover || g.places.indexOf(id) !== -1) return;
        const q = g.pos[id] || 0;
        if (q > walk && q < 100 && (ahead === null || q < g.pos[ahead])) ahead = id;
      });
      if (ahead) { to = g.pos[ahead]; g.pos[ahead] = walk; surp.with = ahead; surp.to = to; } else surp.none = true;
    }
  }
  const sixes = v === 6 ? ((g.turn && g.turn.sixes) || 0) + 1 : 0;
  g.pos[mover] = to;
  let meet = null;
  if (to > 0 && to < 100) {
    const other = g.seats.find(id => id !== mover && g.pos[id] === to && g.places.indexOf(id) === -1);
    if (other) meet = { v: SNAKES_MEET_MOVES[Math.floor(rand() * SNAKES_MEET_MOVES.length) % SNAKES_MEET_MOVES.length], with: other };
  }
  g.rolls = (g.rolls || 0) + 1;
  // The moments the awards are made of.
  if (jump && jump.k === 's') snakesEaten(g, mover, walk, to);
  if (jump && jump.k === 'l' && g.stats && (!g.stats.ladder || to - walk > g.stats.ladder.val)) g.stats.ladder = { pid: mover, from: walk, to: to, val: to - walk };
  if (v === 6) snakesCount(g, 'sixes', pid);
  let place = 0;
  if (to === 100) {
    g.places.push(mover);
    place = g.places.length;
  }
  const e = snakesEvent(g, 'roll', {
    pid: mover, by: mover !== pid ? pid : undefined, n: v, from: from, walk: walk, over: over, to: to, jump: jump, near: near, place: place || undefined,
    pass: pass.length ? pass : undefined, tail: tail || undefined, sneak: sneak || undefined, meet: meet || undefined,
    sixes: sixes || undefined, tense: from >= SNAKES_TENSE_FROM && from < 100 ? true : undefined, rolls: g.rolls,
    charmed: charmed || undefined, surp: surp || undefined
  });
  e.ms = snakesRollMs(e, theme);
  g.readyAt = (now || 0) + e.ms;
  if (place) snakesEvent(g, 'finish', { pid: mover, place: place });
  if (!snakesCheckOver(g)) {
    if ((v === 6 || extra) && !place && !napNow) g.turn = { pid: pid, sixes: v === 6 ? (g.turn.sixes || 0) + 1 : (g.turn.sixes || 0) };
    else snakesPassTurn(g, pid);
    snakesMaybeMove(g, rand);
  }
  g.turnSeq = (g.turnSeq || 0) + 1;
  return e;
};

/** A player leaves the game: their piece goes, their turn passes; one left ends it (in teams, one team). */
const snakesRemovePlayer = (g, pid) => {
  if (g.seats.indexOf(pid) === -1) return;
  const wasTurn = g.turn && g.turn.pid === pid;
  const at = g.seats.indexOf(pid);
  g.seats = g.seats.filter(id => id !== pid);
  delete g.pos[pid];
  g.places = g.places.filter(id => id !== pid);
  if (Array.isArray(g.teams)) g.teams = g.teams.map(t => t.filter(id => id !== pid));
  ['charm', 'nap', 'took'].forEach(k => { if (g[k]) delete g[k][pid]; });
  if (g.phase !== 'play') return;
  if (snakesCheckOver(g)) { g.turnSeq = (g.turnSeq || 0) + 1; return; }
  if (wasTurn || !snakesActive(g, g.turn && g.turn.pid)) {
    // The next seat still playing after the leaver's place.
    const n = g.seats.length;
    let next = null;
    for (let k = 0; k < n && !next; k++) { const id = g.seats[(at + k) % n]; if (snakesActive(g, id)) next = id; }
    g.turn = { pid: next || snakesLeft(g)[0] || null, sixes: 0 };
    g.turnSeq = (g.turnSeq || 0) + 1;
  }
};
