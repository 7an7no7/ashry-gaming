/* ============================================================================
   الدومينو — THE TILES
   ----------------------------------------------------------------------------
   Shared by the page and the rooms server (SHARED_LISTS in tools/build-*.mjs,
   FILES in rooms-worker/build.mjs), so both read a tile, the open ends and a
   move's points the same way. Pure data and functions: no DOM, no room. Every
   top-level name starts with `domino`, because this file shares one scope with
   RoomGames.js on the server and with every JS_*.html on the page.

   A tile is its two numbers, low first: '0-0' … '6-6', the 28 of a double-six
   set. The table (`shared.table` in a room) is:

     line    the tiles end to end, left to right: { t, a, b }, `a` the number
             facing the left end and `b` the one facing the right end (a double
             has a === b and lies across the line);
     root    the first tile of the round, where the drawing starts;
     spinner أمريكاني only: the first double played, open on four sides. Its
             two other arms, `up` and `down` ({ t, a, b }, `a` the number
             touching the spinner, `b` the open one), open once both of its
             sides on the line have a tile.

   The owner's rules (21 Sep 2026): عادي is a line with two open ends; in
   أمريكاني every tile placed scores the open ends when they add up to a
   multiple of 5 (5 = 1 point), a double at an end counting both halves and
   the spinner alone counting both of its halves. The end of a round is
   dominoRoundResult; where the tiles go on a screen is dominoLayout.
   ========================================================================= */

const DOMINO_MAX = 6;
const DOMINO_HAND = 7;                     // tiles dealt to each player
const DOMINO_MIN_PLAYERS = 2;
const DOMINO_MAX_PLAYERS = 4;
const DOMINO_MODES = ['normal', 'american'];
const DOMINO_TARGETS = { normal: [51, 101, 151, 201], american: [30, 50, 100] };
const DOMINO_TARGET_DEFAULT = { normal: 101, american: 50 };
const DOMINO_CLOCKS = [0, 30, 60];
const DOMINO_TEAM_KEYS = ['A', 'B'];       // shared.teams[0] and [1]: seats 1 & 3, seats 2 & 4

/* --- one tile ---------------------------------------------------------------- */

/** The id of the tile with these two numbers, low first. */
const dominoId = (a, b) => Math.min(a, b) + '-' + Math.max(a, b);

/** [low, high], or null for anything that is not a tile of the set. */
const dominoParse = (id) => {
  const m = /^([0-6])-([0-6])$/.exec(String(id == null ? '' : id));
  if (!m) return null;
  const a = Number(m[1]);
  const b = Number(m[2]);
  return a <= b ? [a, b] : null;
};

/** The 28 tiles of a double-six set. */
const dominoSet = () => {
  const out = [];
  for (let a = 0; a <= DOMINO_MAX; a++) for (let b = a; b <= DOMINO_MAX; b++) out.push(a + '-' + b);
  return out;
};

const dominoPips = (id) => { const p = dominoParse(id); return p ? p[0] + p[1] : 0; };
const dominoIsDouble = (id) => { const p = dominoParse(id); return !!p && p[0] === p[1]; };
const dominoHandPips = (hand) => (hand || []).reduce((sum, id) => sum + dominoPips(id), 0);

/* --- the table ----------------------------------------------------------------- */

const dominoNewTable = () => ({ line: [], root: null, spinner: null, up: [], down: [] });

/** Where the spinner lies on the line, or -1. */
const dominoSpinnerAt = (table) => (table && table.spinner ? (table.line || []).findIndex(x => x.t === table.spinner) : -1);

/** The spinner's up and down arms are open once both of its sides on the line have a tile. */
const dominoArmsOpen = (table) => {
  const s = dominoSpinnerAt(table);
  return s > 0 && s < table.line.length - 1;
};

/**
 * The open ends: { end: 'L' | 'R' | 'U' | 'D', value, double, played }.
 * `double` is a double lying across that end (its two halves count);
 * `played` is false for an arm of the spinner nothing has gone on yet, which
 * can be played on but adds nothing to the sum. An empty table has no ends:
 * whoever leads plays anything.
 */
const dominoEnds = (table) => {
  const line = (table && table.line) || [];
  if (!line.length) return [];
  const first = line[0];
  const last = line[line.length - 1];
  const ends = [
    { end: 'L', value: first.a, double: dominoIsDouble(first.t), played: true },
    { end: 'R', value: last.b, double: dominoIsDouble(last.t), played: true }
  ];
  if (dominoArmsOpen(table)) {
    const sv = dominoParse(table.spinner)[0];
    [['U', table.up || []], ['D', table.down || []]].forEach(([end, arm]) => {
      const top = arm[arm.length - 1];
      ends.push(top
        ? { end: end, value: top.b, double: dominoIsDouble(top.t), played: true }
        : { end: end, value: sv, double: false, played: false });
    });
  }
  return ends;
};

/** The ends a tile can go on (an empty table takes any tile, on 'R'). */
const dominoFits = (table, id) => {
  const p = dominoParse(id);
  if (!p) return [];
  if (!((table && table.line) || []).length) return ['R'];
  return dominoEnds(table).filter(e => e.value === p[0] || e.value === p[1]).map(e => e.end);
};

/** Whether any tile of a hand goes anywhere. */
const dominoCanPlay = (table, hand) => (hand || []).some(id => dominoFits(table, id).length > 0);

/**
 * The table with `id` played on `end`: { table, spinner } (spinner: this tile
 * became it), or null when it does not go there. In أمريكاني the first double
 * played on the line is the spinner - the lead included.
 */
const dominoPlace = (table, id, end, mode) => {
  const p = dominoParse(id);
  if (!p) return null;
  const t = table || dominoNewTable();
  const out = { line: (t.line || []).slice(), root: t.root || null, spinner: t.spinner || null, up: (t.up || []).slice(), down: (t.down || []).slice() };
  const dbl = p[0] === p[1];
  let spinner = false;
  if (!out.line.length) {
    out.line.push({ t: id, a: p[0], b: p[1] });
    out.root = id;
  } else {
    const e = dominoEnds(t).find(x => x.end === end);
    if (!e || (e.value !== p[0] && e.value !== p[1])) return null;
    const other = e.value === p[0] ? p[1] : p[0];
    if (end === 'L') out.line.unshift({ t: id, a: other, b: e.value });
    else if (end === 'R') out.line.push({ t: id, a: e.value, b: other });
    else (end === 'U' ? out.up : out.down).push({ t: id, a: e.value, b: other });
  }
  if (mode === 'american' && dbl && !out.spinner && (end === 'L' || end === 'R' || out.line.length === 1)) {
    out.spinner = id;
    spinner = true;
  }
  return { table: out, spinner: spinner };
};

/**
 * The open ends added up, the way أمريكاني counts them: each end's number, a
 * double across an end both of its halves, a tile alone on the table both of
 * its halves (the spinner alone too), and a spinner's arm only once something
 * has been played on it.
 */
const dominoEndsSum = (table) => {
  const line = (table && table.line) || [];
  if (!line.length) return 0;
  if (line.length === 1) return dominoPips(line[0].t);
  return dominoEnds(table).reduce((sum, e) => (e.played ? sum + (e.double ? e.value * 2 : e.value) : sum), 0);
};

/** 5 = 1 point, 10 = 2, 15 = 3 …; anything else scores nothing. */
const dominoPointsOf = (sum) => (sum > 0 && sum % 5 === 0 ? sum / 5 : 0);

/** أمريكاني's count at the end of a round: rounded to the nearest 5, then 5 = 1 (12 → 2, 13 → 3). */
const dominoRounded = (pips) => Math.floor((Math.max(0, Number(pips) || 0) + 2) / 5);

/** What playing `id` on `end` scores in أمريكاني (0 in عادي, or when it doesn't go there). */
const dominoMoveScore = (table, id, end, mode) => {
  if (mode !== 'american') return 0;
  const r = dominoPlace(table, id, end, mode);
  return r ? dominoPointsOf(dominoEndsSum(r.table)) : 0;
};

/* --- a round ------------------------------------------------------------------- */

/**
 * Who opens the first round: whoever holds the double six plays it; nobody
 * holding it (two or three players leave tiles out), the highest double in
 * anyone's hand; no double at all, the heaviest tile. { pid, tile, how }.
 */
const dominoStarter = (hands, order) => {
  const holder = (id) => (order || []).find(pid => ((hands || {})[pid] || []).indexOf(id) !== -1) || null;
  for (let v = DOMINO_MAX; v >= 0; v--) {
    const id = v + '-' + v;
    const pid = holder(id);
    if (pid) return { pid: pid, tile: id, how: v === DOMINO_MAX ? 'double6' : 'double' };
  }
  let best = null;
  (order || []).forEach(pid => ((hands || {})[pid] || []).forEach(id => {
    const p = dominoParse(id);
    if (!p) return;
    const weight = (p[0] + p[1]) * 10 + p[1];
    if (!best || weight > best.weight) best = { pid: pid, tile: id, weight: weight };
  }));
  return best ? { pid: best.pid, tile: best.tile, how: 'heaviest' } : null;
};

/**
 * Who scores at the end of a round. `units` is who scores together: every
 * player alone ({ key: pid, ids: [pid] }), or the two sides ({ key: 'A', ids }).
 *
 *   out      whoever played their last tile: their unit takes the pips left in
 *            every other unit's hands - in teams the two opponents' tiles only,
 *            the partner's leftovers counting for nobody;
 *   blocked  nobody can play and nothing is left to draw (قفلة): the unit with
 *            the lowest hand takes the other units' pips; a tie for the lowest
 *            and nobody scores.
 *
 * In أمريكاني what is taken is rounded to the nearest 5 and divided by 5.
 * `lead` is who opens the next round: the one who went out, or the lowest
 * hand of the winning side; nobody after a tie.
 */
const dominoRoundResult = (o) => {
  const hands = o.hands || {};
  const units = o.units || [];
  const pips = {};
  units.forEach(u => u.ids.forEach(id => { pips[id] = dominoHandPips(hands[id]); }));
  const unitPips = {};
  units.forEach(u => { unitPips[u.key] = u.ids.reduce((sum, id) => sum + (pips[id] || 0), 0); });
  const unitOf = (pid) => (units.find(u => u.ids.indexOf(pid) !== -1) || {}).key || null;
  let winner = null;
  let tie = false;
  let lead = null;
  if (o.how === 'out') {
    winner = unitOf(o.by);
    lead = o.by || null;
  } else if (units.length) {
    const low = Math.min.apply(null, units.map(u => unitPips[u.key]));
    const at = units.filter(u => unitPips[u.key] === low);
    if (at.length === 1) {
      winner = at[0].key;
      // The lowest hand of the side, the first seat of it on a tie.
      lead = at[0].ids.reduce((best, id) => (best === null || pips[id] < pips[best] ? id : best), null);
    } else {
      tie = true;
    }
  }
  const from = winner ? units.filter(u => u.key !== winner).map(u => u.key) : [];
  const raw = from.reduce((sum, k) => sum + unitPips[k], 0);
  const points = o.mode === 'american' ? dominoRounded(raw) : raw;
  return { how: o.how, by: o.by || null, pips: pips, unitPips: unitPips, winner: winner, tie: tie, from: from, raw: raw, points: points, lead: lead };
};

/**
 * The winner of the game once a round is scored, or null to play on: the
 * highest total at or past the target; two level on top, one more round.
 */
const dominoGameWinner = (scores, target) => {
  const keys = Object.keys(scores || {});
  if (!keys.length) return null;
  const top = Math.max.apply(null, keys.map(k => Number(scores[k]) || 0));
  if (top < target) return null;
  const at = keys.filter(k => (Number(scores[k]) || 0) === top);
  return at.length === 1 ? at[0] : null;
};

/* --- where the tiles go ------------------------------------------------------------
   The table in grid units: a tile is 2 × 1, a double lies across the line
   (1 × 2). The line starts at the root (the spinner in أمريكاني, the middle of
   a cross) and each arm runs straight until the next tile would pass the edge,
   then turns a corner and comes back the other way a row further out - a
   snake, as on a real table that is too small, and as domino apps draw it. On
   the left and right of the line the arms snake away from each other (the
   right one down, the left one up); the spinner's up arm snakes to the right
   and its down arm to the left, so the four arms of a cross each have a
   quarter of the table. Every placement is checked against the tiles already
   down, so an arm that reaches another turns instead of running into it.

   A tile placed at a corner, and the tile after it, lie along the line even
   when they are doubles: a double across a corner would run into the row it
   came from. dominoLayout is pure (the grid only); the page scales the result
   to fit its box (dominoFitLayout) and draws it left to right in every
   language - it is a physical table, not a line of text.
   ---------------------------------------------------------------------------------- */

const DOMINO_STEP = { E: [1, 0], W: [-1, 0], S: [0, 1], N: [0, -1] };
const DOMINO_BACK = { E: 'W', W: 'E', N: 'S', S: 'N' };
const dominoAcross = (dir) => dir === 'E' || dir === 'W';

/**
 * One tile laid from `exit` (the middle of the outer edge of the tile before),
 * which was going `from`, now going `to`. Straight on, the tile starts at the
 * exit; round a corner, its first half sits beside the last half of the tile
 * before. `cross`: a double across the line, one unit along it.
 */
const dominoPut = (exit, from, to, cross) => {
  const n = DOMINO_STEP[to];
  if (cross) {
    const w = n[0] ? 1 : 2;
    const h = n[0] ? 2 : 1;
    const cx = exit[0] + n[0] * 0.5;
    const cy = exit[1] + n[1] * 0.5;
    return { x: cx - w / 2, y: cy - h / 2, w: w, h: h, exit: [exit[0] + n[0], exit[1] + n[1]], dir: to, cross: true };
  }
  const o = DOMINO_STEP[from];
  const px = exit[0] + o[0] * 0.5;
  const py = exit[1] + o[1] * 0.5;
  const x1 = px - n[0] * 0.5, y1 = py - n[1] * 0.5;
  const x2 = px + n[0] * 1.5, y2 = py + n[1] * 1.5;
  const w = n[0] ? 2 : 1;
  const h = n[0] ? 1 : 2;
  return { x: (x1 + x2) / 2 - w / 2, y: (y1 + y2) / 2 - h / 2, w: w, h: h, exit: [x2, y2], dir: to, cross: false };
};

/**
 * Does `r` overlap anything placed (but the tile it hangs from)? Another arm
 * keeps a little air, except round the middle, where the first tile of each
 * arm meets the others at a corner.
 */
const dominoHits = (r, placed, prev, arm, first) => placed.some(q => {
  if (q === prev) return false;
  const pad = q.arm === arm || q.arm === 'C' || (first && q.first0) ? 0 : 0.25;
  const ox = Math.min(r.x + r.w, q.x + q.w + pad) - Math.max(r.x, q.x - pad);
  const oy = Math.min(r.y + r.h, q.y + q.h + pad) - Math.max(r.y, q.y - pad);
  return ox > 0.01 && oy > 0.01;
});

/**
 * The table in grid units, with `half` units either side of the middle
 * across and `halfUp` up and down (the spinner's arms): { tiles, ends, minX,
 * minY, maxX, maxY }. A tile: { t, x, y, w, h, first, second, arm } - `first`
 * is the number on its top or left half. An end: { end, x, y, dir }, the
 * middle of where the next tile goes.
 */
const dominoLayout = (table, half, halfUp) => {
  const line = (table && table.line) || [];
  const out = { tiles: [], ends: [], minX: 0, minY: 0, maxX: 0, maxY: 0 };
  if (!line.length) return out;
  const R = Math.max(3, Number(half) || 6);
  const T = Math.max(3, Number(halfUp) || R);
  const s = dominoSpinnerAt(table);
  const centre = s !== -1 ? s : Math.max(0, line.findIndex(x => x.t === table.root));
  const c = line[centre];
  const cDouble = dominoIsDouble(c.t);
  const placed = [];
  placed.push(Object.assign({ t: c.t, first: c.a, second: c.b, arm: 'C' },
    cDouble ? { x: -0.5, y: -1, w: 1, h: 2 } : { x: -1, y: -0.5, w: 2, h: 1 }));
  const side = cDouble ? 0.5 : 1;
  const arms = [
    { end: 'R', exit: [side, 0], dir: 'E', drift: 'S', tiles: line.slice(centre + 1).map(x => ({ t: x.t, inner: x.a, outer: x.b })) },
    { end: 'L', exit: [-side, 0], dir: 'W', drift: 'N', tiles: line.slice(0, centre).reverse().map(x => ({ t: x.t, inner: x.b, outer: x.a })) }
  ];
  if (s !== -1) {
    arms.push({ end: 'U', exit: [0, -1], dir: 'N', drift: 'E', tiles: (table.up || []).map(x => ({ t: x.t, inner: x.a, outer: x.b })) });
    arms.push({ end: 'D', exit: [0, 1], dir: 'S', drift: 'W', tiles: (table.down || []).map(x => ({ t: x.t, inner: x.a, outer: x.b })) });
  }
  const open = dominoArmsOpen(table);
  // A cross gives each arm its quarter: the line's arms keep out of the column
  // above and below the spinner, and its up and down arms out of the row
  // either side of it, however short the arm that will grow there is yet.
  const far = 1e4;
  const walls = s === -1 ? { across: [], upDown: [] } : {
    across: [{ x: -1.25, y: -far, w: 2.5, h: far - 1.25, arm: 'V' }, { x: -1.25, y: 1.25, w: 2.5, h: far, arm: 'V' }],
    upDown: [{ x: -far, y: -1.25, w: far - 1.25, h: 2.5, arm: 'V' }, { x: 1.25, y: -1.25, w: far, h: 2.5, arm: 'V' }]
  };
  const hitsWall = (r, list) => list.some(q => {
    const ox = Math.min(r.x + r.w, q.x + q.w) - Math.max(r.x, q.x);
    const oy = Math.min(r.y + r.h, q.y + q.h) - Math.max(r.y, q.y);
    return ox > 0.01 && oy > 0.01;
  });
  arms.forEach(arm => {
    const along = dominoAcross(arm.dir);          // this arm's rows run across (E/W) or up and down (N/S)
    const lim = along ? R : T;
    const wall = along ? walls.across : walls.upDown;
    const coord = (r) => (along ? [r.x, r.x + r.w] : [r.y, r.y + r.h]);
    const lead = (r) => (along ? r.exit[0] : r.exit[1]);
    let exit = arm.exit;
    let dir = arm.dir;
    let lastMain = arm.dir;
    let afterCorner = false;
    let prev = placed[0];
    arm.tiles.forEach((tile, k) => {
      const dbl = tile.inner === tile.outer;
      const prefs = afterCorner ? [DOMINO_BACK[lastMain], dir, lastMain] : [dir, arm.drift, DOMINO_BACK[arm.drift]];
      let pick = null;
      let soft = null;
      prefs.forEach(to => {
        if (pick || to === DOMINO_BACK[dir]) return;
        const main = dominoAcross(to) === along;
        const r = dominoPut(exit, dir, to, dbl && main && to === dir && !afterCorner);
        // A run stops a unit short of the edge, or of another arm, so the
        // corner that turns it still fits: along the run a tile is checked a
        // unit longer at its leading end.
        const inside = main ? Math.abs(lead(r)) <= lim - 1 + 1e-6 : coord(r)[0] >= -lim - 1e-6 && coord(r)[1] <= lim + 1e-6;
        const n = DOMINO_STEP[to];
        const room = main ? {
          x: n[0] < 0 ? r.x - 1 : r.x, y: n[1] < 0 ? r.y - 1 : r.y,
          w: r.w + Math.abs(n[0]), h: r.h + Math.abs(n[1])
        } : r;
        const clear = !dominoHits(room, placed, prev, arm.end, k === 0) && !hitsWall(room, wall);
        if (clear && inside) pick = r;
        else if (clear && !soft) soft = r;
      });
      const r = pick || soft || dominoPut(exit, dir, dir, false);
      const inFirst = r.dir === 'E' || r.dir === 'S';
      const q = { t: tile.t, x: r.x, y: r.y, w: r.w, h: r.h, first: inFirst ? tile.inner : tile.outer, second: inFirst ? tile.outer : tile.inner, arm: arm.end };
      if (k === 0) q.first0 = true;
      placed.push(q);
      prev = q;
      if (dominoAcross(r.dir) === along) { lastMain = r.dir; afterCorner = false; } else afterCorner = true;
      dir = r.dir;
      exit = r.exit;
    });
    if (arm.end === 'U' || arm.end === 'D') { if (!open) return; }
    const n = DOMINO_STEP[dir];
    out.ends.push({ end: arm.end, x: exit[0] + n[0] * 0.5, y: exit[1] + n[1] * 0.5, dir: dir });
  });
  out.tiles = placed;
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  placed.forEach(q => { minX = Math.min(minX, q.x); minY = Math.min(minY, q.y); maxX = Math.max(maxX, q.x + q.w); maxY = Math.max(maxY, q.y + q.h); });
  out.ends.forEach(e => { minX = Math.min(minX, e.x - 0.5); minY = Math.min(minY, e.y - 0.5); maxX = Math.max(maxX, e.x + 0.5); maxY = Math.max(maxY, e.y + 0.5); });
  Object.assign(out, { minX: minX, minY: minY, maxX: maxX, maxY: maxY });
  return out;
};

/**
 * The layout that shows the table biggest in a box of boxW × boxH pixels, with
 * a unit (the short side of a tile) of at most maxU: { layout, u, half }.
 * `prefer` is the width the table had a move ago - kept while it is nearly as
 * good, so the rows don't jump from one move to the next.
 */
const dominoFitLayout = (table, boxW, boxH, maxU, prefer) => {
  const aspect = boxW > 0 && boxH > 0 ? boxH / boxW : 1;
  const tryHalf = (half) => {
    const layout = dominoLayout(table, half, Math.max(3, Math.round(half * aspect)));
    const w = Math.max(1, layout.maxX - layout.minX);
    const h = Math.max(1, layout.maxY - layout.minY);
    return { layout: layout, half: half, u: Math.max(1, Math.min(maxU, boxW / w, boxH / h)) };
  };
  let best = null;
  for (let half = 4; half <= 22; half++) {
    const f = tryHalf(half);
    if (!best || f.u > best.u + 0.01) best = f;
  }
  if (prefer && prefer >= 4 && prefer <= 22) {
    const kept = tryHalf(prefer);
    if (kept.u >= best.u * 0.88) return kept;
  }
  return best;
};

/* --- after a round, seen from the table ----------------------------------------------- */

/** The unit a player scores in: their own id, or their side's key. */
const dominoUnitOf = (teams, pid) => {
  if (!Array.isArray(teams)) return pid;
  const i = teams.findIndex(t => (t || []).indexOf(pid) !== -1);
  return i === -1 ? pid : DOMINO_TEAM_KEYS[i];
};
