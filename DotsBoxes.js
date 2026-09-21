/* ============================================================================
   نقط ومربعات — DOTS & BOXES: the rules, and the phone as a player
   ----------------------------------------------------------------------------
   One copy for both sides, like Connect4.js: the page inlines it and the rooms
   server bundles it. No DOM, nothing that runs at load, every top-level name
   starts with dots / DOTS_.

   A board of n x n boxes has (n + 1) x (n + 1) dots and 2n(n + 1) lines:
     horizontal line (r, c), r = 0..n, c = 0..n-1  ->  id r*n + c
     vertical line   (r, c), r = 0..n-1, c = 0..n  ->  id n(n+1) + r*(n+1) + c
   A board is { n, lines, boxes }: `lines` holds who drew each line (0 none,
   1 or 2) and `boxes` who owns each box (row by row). Drawing the fourth side
   of a box takes it, and whoever took a box moves again. Most boxes wins; an
   even board can end level.

   The phone's player (dotsBestMove):
     hard   takes a box whenever it can while a safe line is left, never draws
            the third side of a box while a safe line exists, steers the safe
            lines so the other side has to open the first chain when that pays
            (a small search while a dozen or fewer are left: the long-chain
            rule in practice), and in the endgame opens the cheapest chain and
            keeps control with the double-dealing move - taking all but the
            last two boxes of a chain (four of a loop) and leaving them, when
            what is still to come is worth more than the boxes given away.
     medium takes boxes and avoids third sides; in the endgame it opens what
            gives away least, and takes everything it is offered.
     easy   takes a box most of the time, avoids a third side some of the
            time, and otherwise draws anywhere.
   ========================================================================= */
const DOTS_SIZES = [4, 6, 8];
const DOTS_LEVELS = ['easy', 'medium', 'hard'];
const DOTS_BUDGET_MS = 200;
const DOTS_SAFE_SEARCH = 12;       // safe lines left when the hard player starts counting them out
const DOTS_MAX_NODES = 200000;     // a ceiling as well as the clock, should the clock ever stand still

/** 4, 6 or 8 boxes a side; anything else is 4. */
function dotsSize(n) { n = Number(n); return DOTS_SIZES.indexOf(n) !== -1 ? n : 4; }

const DOTS_GEOM_CACHE = {};

/**
 * What a board of n x n boxes looks like, worked out once per size:
 * edges (its lines, each { h, r, c, boxes }), boxEdges (each box's four
 * lines: top, bottom, left, right).
 */
function dotsGeom(n) {
  if (DOTS_GEOM_CACHE[n]) return DOTS_GEOM_CACHE[n];
  const edges = [];
  for (let r = 0; r <= n; r++) {
    for (let c = 0; c < n; c++) {
      const boxes = [];
      if (r > 0) boxes.push((r - 1) * n + c);
      if (r < n) boxes.push(r * n + c);
      edges.push({ h: true, r: r, c: c, boxes: boxes });
    }
  }
  for (let r = 0; r < n; r++) {
    for (let c = 0; c <= n; c++) {
      const boxes = [];
      if (c > 0) boxes.push(r * n + c - 1);
      if (c < n) boxes.push(r * n + c);
      edges.push({ h: false, r: r, c: c, boxes: boxes });
    }
  }
  const boxEdges = [];
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      boxEdges.push([r * n + c, (r + 1) * n + c, n * (n + 1) + r * (n + 1) + c, n * (n + 1) + r * (n + 1) + c + 1]);
    }
  }
  DOTS_GEOM_CACHE[n] = { n: n, edges: edges, boxEdges: boxEdges, lineCount: edges.length };
  return DOTS_GEOM_CACHE[n];
}

function dotsNewBoard(n) {
  const size = dotsSize(n);
  const g = dotsGeom(size);
  const lines = [], boxes = [];
  for (let i = 0; i < g.lineCount; i++) lines.push(0);
  for (let i = 0; i < size * size; i++) boxes.push(0);
  return { n: size, lines: lines, boxes: boxes };
}

function dotsClone(board) {
  return { n: board.n, lines: board.lines.slice(), boxes: board.boxes.slice() };
}

/** How many of box b's four sides are drawn. */
function dotsSides(board, b) {
  const e = dotsGeom(board.n).boxEdges[b];
  return (board.lines[e[0]] ? 1 : 0) + (board.lines[e[1]] ? 1 : 0) + (board.lines[e[2]] ? 1 : 0) + (board.lines[e[3]] ? 1 : 0);
}

/** Boxes each player owns: [nobody, player 1, player 2]. */
function dotsCounts(board) {
  const out = [0, 0, 0];
  board.boxes.forEach(v => { out[v]++; });
  return out;
}

/** The lines nobody has drawn yet. */
function dotsFree(board) {
  const out = [];
  for (let e = 0; e < board.lines.length; e++) if (!board.lines[e]) out.push(e);
  return out;
}

/**
 * Player p draws line e. Null when it is already drawn or not a line;
 * otherwise { edge, boxes (the boxes it took), again (it took one, so p moves
 * again), over (every box is taken) }.
 */
function dotsPlay(board, e, p) {
  if (typeof e !== 'number' || e !== Math.floor(e) || e < 0 || e >= board.lines.length || board.lines[e]) return null;
  if (p !== 1 && p !== 2) return null;
  const g = dotsGeom(board.n);
  board.lines[e] = p;
  const took = [];
  g.edges[e].boxes.forEach(b => {
    if (!board.boxes[b] && dotsSides(board, b) === 4) { board.boxes[b] = p; took.push(b); }
  });
  const over = board.boxes.every(Boolean);
  return { edge: e, boxes: took, again: took.length > 0 && !over, over: over };
}

/* --- the phone as a player ------------------------------------------------- */

/** Lines that take a box right now: the missing side of every box with three. */
function dotsCaptures(board) {
  const g = dotsGeom(board.n);
  const out = [];
  for (let b = 0; b < board.boxes.length; b++) {
    if (board.boxes[b] || dotsSides(board, b) !== 3) continue;
    const e = g.boxEdges[b].find(x => !board.lines[x]);
    if (e !== undefined && out.indexOf(e) === -1) out.push(e);
  }
  return out;
}

/** Lines that give nobody a third side: every box beside them has at most one side drawn. */
function dotsSafe(board) {
  const g = dotsGeom(board.n);
  const out = [];
  for (let e = 0; e < board.lines.length; e++) {
    if (board.lines[e]) continue;
    if (g.edges[e].boxes.every(b => dotsSides(board, b) < 2)) out.push(e);
  }
  return out;
}

/** Draws every line that takes a box, over and over, as a greedy player would. How many boxes that was. */
function dotsGreedyTake(board, p) {
  let took = 0;
  for (;;) {
    const caps = dotsCaptures(board);
    if (!caps.length) return took;
    caps.forEach(e => {
      if (board.lines[e]) return;
      const res = dotsPlay(board, e, p);
      if (res) took += res.boxes.length;
    });
  }
}

/**
 * What is left of the board as chains and loops. The open boxes are linked
 * wherever the line between them is undrawn; the board's edge is "ground".
 * A component is a chain when every box in it has exactly two undrawn sides
 * and it runs to the ground at both ends, a loop when those two sides all
 * lead to each other, and 'complex' otherwise (a box where three ways meet).
 */
function dotsComponents(board) {
  const g = dotsGeom(board.n);
  const seen = {};
  const out = [];
  for (let start = 0; start < board.boxes.length; start++) {
    if (board.boxes[start] || seen[start]) continue;
    const list = [];
    const stack = [start];
    seen[start] = true;
    let simple = true, ground = 0, links = 0;
    while (stack.length) {
      const b = stack.pop();
      list.push(b);
      let open = 0;
      g.boxEdges[b].forEach(e => {
        if (board.lines[e]) return;
        open++;
        const other = g.edges[e].boxes.find(x => x !== b);
        if (other === undefined) { ground++; return; }
        links++;
        if (!seen[other]) { seen[other] = true; stack.push(other); }
      });
      if (open !== 2) simple = false;
    }
    links = links / 2;
    let type = 'complex';
    if (simple && ground === 0 && links === list.length) type = 'loop';
    else if (simple && ground === 2 && links === list.length - 1) type = 'chain';
    out.push({ type: type, size: list.length, boxes: list });
  }
  return out;
}

/**
 * The best the player to move can do from here, in boxes gained minus boxes
 * given, when every chain and loop has to be opened by someone. The player to
 * move opens one; the other side either takes it all and opens the next, or
 * takes all but two of a chain (four of a loop), gives those back and makes
 * the opener open again. A chain of one or two can't be declined: a two is
 * opened in its middle. Worked out exactly over the chains and loops left,
 * which is a handful by then.
 */
function dotsChainValue(comps, memo) {
  const key = comps.map(x => x.type[0] + x.size).sort().join(',');
  if (!comps.length) return 0;
  if (memo[key] !== undefined) return memo[key];
  let best = -Infinity;
  const tried = {};
  for (let i = 0; i < comps.length; i++) {
    const cmp = comps[i];
    const id = cmp.type[0] + cmp.size;
    if (tried[id]) continue;
    tried[id] = true;
    const rest = comps.slice(0, i).concat(comps.slice(i + 1));
    const after = dotsChainValue(rest, memo);
    const L = cmp.size;
    let theirs;
    if (cmp.type === 'loop') theirs = Math.max(L + after, L - 8 - after);
    else if (L <= 2) theirs = L + after;
    else theirs = Math.max(L + after, L - 4 - after);
    if (-theirs > best) best = -theirs;
  }
  memo[key] = best;
  return best;
}

/**
 * The value of an endgame position for the player who must open something
 * next. A tangle where chains meet is counted as one chain of its size,
 * which is roughly how it plays out.
 */
function dotsEndgameValue(board, memo) {
  const comps = dotsComponents(board).map(x => (x.type === 'complex' ? { type: 'chain', size: x.size } : x));
  return dotsChainValue(comps, memo || {});
}

/** How many boxes the other side can take, one after another, if line e is drawn. */
function dotsGiveaway(board, e) {
  const copy = dotsClone(board);
  const res = dotsPlay(copy, e, 1);
  if (!res) return Infinity;
  if (res.boxes.length) return -res.boxes.length;      // it takes a box itself
  return dotsGreedyTake(copy, 2);
}

/** The line that gives the fewest boxes away; ties at random. */
function dotsCheapest(board, lines, rnd) {
  let best = Infinity, picks = [];
  lines.forEach(e => {
    const give = dotsGiveaway(board, e);
    if (give < best) { best = give; picks = [e]; }
    else if (give === best) picks.push(e);
  });
  return picks[Math.floor(rnd() * picks.length)];
}

/** The undrawn line between boxes a and b, or undefined. */
function dotsLineBetween(board, a, b) {
  const g = dotsGeom(board.n);
  return g.boxEdges[a].find(e => !board.lines[e] && g.edges[e].boxes.indexOf(b) !== -1);
}

/**
 * A double-dealing move available right now: the last two boxes of a chain
 * (X with three sides, then Y with two, then the ground or a box that stays
 * safe) or the last four of a loop (X three, Y two, Z two, W three). Returns
 * { edge (the line that leaves them), give (2 or 4), take (the line that
 * would take X instead), keep (their boxes) } or null.
 */
function dotsDoubleDeal(board) {
  const g = dotsGeom(board.n);
  for (let x = 0; x < board.boxes.length; x++) {
    if (board.boxes[x] || dotsSides(board, x) !== 3) continue;
    const ex = g.boxEdges[x].find(e => !board.lines[e]);
    const y = g.edges[ex].boxes.find(b => b !== x);
    if (y === undefined || board.boxes[y] || dotsSides(board, y) !== 2) continue;
    const ey = g.boxEdges[y].find(e => !board.lines[e] && e !== ex);
    const z = g.edges[ey].boxes.find(b => b !== y);
    // A chain's last two: past Y is the ground, or a box that its line leaves with at most two sides.
    if (z === undefined || (!board.boxes[z] && dotsSides(board, z) <= 1)) {
      return { edge: ey, give: 2, take: ex, keep: [x, y] };
    }
    // A loop's last four: X(3) Y(2) Z(2) W(3), W's open side leading back to Z.
    if (!board.boxes[z] && dotsSides(board, z) === 2) {
      const ez = g.boxEdges[z].find(e => !board.lines[e] && e !== ey);
      const w = g.edges[ez].boxes.find(b => b !== z);
      if (w !== undefined && w !== x && !board.boxes[w] && dotsSides(board, w) === 3) {
        return { edge: ey, give: 4, take: ex, keep: [x, y, z, w] };
      }
    }
  }
  return null;
}

/** The best line to open a chain with, when every line gives something away. */
function dotsOpening(board, rnd, memo) {
  const comps = dotsComponents(board);
  if (!comps.length) return undefined;
  if (comps.some(x => x.type === 'complex')) return dotsCheapest(board, dotsFree(board), rnd);
  // Every chain and loop is plain: open the one that costs least, correctly.
  let best = -Infinity, pick = null;
  comps.forEach((cmp, i) => {
    const rest = comps.slice(0, i).concat(comps.slice(i + 1));
    const after = dotsChainValue(rest, memo);
    const L = cmp.size;
    let theirs;
    if (cmp.type === 'loop') theirs = Math.max(L + after, L - 8 - after);
    else if (L <= 2) theirs = L + after;
    else theirs = Math.max(L + after, L - 4 - after);
    if (-theirs > best || (-theirs === best && rnd() < 0.5)) { best = -theirs; pick = cmp; }
  });
  const g = dotsGeom(board.n);
  const own = (e) => g.edges[e].boxes.every(b => pick.boxes.indexOf(b) !== -1);
  if (pick.type === 'chain' && pick.size === 2) {
    // The middle line: two boxes that can't be declined.
    const mid = dotsLineBetween(board, pick.boxes[0], pick.boxes[1]);
    if (mid !== undefined) return mid;
  }
  // A chain from one of its ends (a line to the ground); a loop anywhere.
  const lines = [];
  pick.boxes.forEach(b => g.boxEdges[b].forEach(e => { if (!board.lines[e] && lines.indexOf(e) === -1) lines.push(e); }));
  const ends = lines.filter(e => g.edges[e].boxes.length === 1);
  const from = pick.type === 'chain' && ends.length ? ends : lines.filter(own).concat(ends);
  return from.length ? from[Math.floor(rnd() * from.length)] : dotsCheapest(board, dotsFree(board), rnd);
}

const DOTS_TIMEOUT = { timeout: true };

/**
 * The safe lines counted out to the end: which one leaves the other side to
 * open the first chain on the worst terms for them. Null when it takes longer
 * than the deadline allows.
 */
function dotsSafeSearch(board, deadline, memo, rnd) {
  const seen = {};
  let nodes = 0;
  const value = (b) => {
    if ((++nodes & 255) === 0 && (Date.now() > deadline || nodes > DOTS_MAX_NODES)) throw DOTS_TIMEOUT;
    const key = b.lines.map(v => (v ? 1 : 0)).join('');
    if (seen[key] !== undefined) return seen[key];
    const safe = dotsSafe(b);
    let best;
    if (!safe.length) best = dotsEndgameValue(b, memo);
    else {
      best = -Infinity;
      for (let i = 0; i < safe.length; i++) {
        b.lines[safe[i]] = 1;
        const v = -value(b);
        b.lines[safe[i]] = 0;
        if (v > best) best = v;
      }
    }
    seen[key] = best;
    return best;
  };
  const work = dotsClone(board);
  const safe = dotsSafe(work);
  let best = -Infinity, picks = [];
  try {
    for (let i = 0; i < safe.length; i++) {
      work.lines[safe[i]] = 1;
      const v = -value(work);
      work.lines[safe[i]] = 0;
      if (v > best) { best = v; picks = [safe[i]]; }
      else if (v === best) picks.push(safe[i]);
    }
  } catch (e) {
    return null;
  }
  return picks.length ? picks[Math.floor(rnd() * picks.length)] : null;
}

/**
 * The line the phone draws for player `me` at `level`: always one that is
 * free while the board has one (-1 on a finished board). `opts.rnd` replaces
 * Math.random (the tests), `opts.budget` the hard level's time in ms.
 */
function dotsBestMove(board, me, level, opts) {
  const o = opts || {};
  const rnd = o.rnd || Math.random;
  const free = dotsFree(board);
  if (!free.length) return -1;
  const pick = (list) => list[Math.floor(rnd() * list.length)];
  const caps = dotsCaptures(board);
  const safe = dotsSafe(board);

  if (level === 'easy') {
    if (caps.length && rnd() < 0.7) return pick(caps);
    if (safe.length && rnd() < 0.55) return pick(safe);
    return pick(free);
  }

  if (level === 'medium') {
    if (caps.length) return pick(caps);
    if (safe.length) return pick(safe);
    return dotsCheapest(board, free, rnd);
  }

  // Hard.
  const memo = {};
  if (caps.length) {
    // With safe lines still left after taking everything, just take.
    const after = dotsClone(board);
    dotsGreedyTake(after, me);
    if (dotsSafe(after).length || after.boxes.every(Boolean)) return pick(caps);
    // The endgame. Boxes that aren't the end of what is being handed over go first.
    const deal = dotsDoubleDeal(board);
    if (!deal) return pick(caps);
    const others = caps.filter(e => e !== deal.take && dotsGeom(board.n).edges[e].boxes.every(b => deal.keep.indexOf(b) === -1));
    if (others.length) return pick(others);
    // Take them all, or give them back and keep control: whichever leaves more.
    const rest = dotsClone(board);
    deal.keep.forEach(b => { rest.boxes[b] = me; dotsGeom(board.n).boxEdges[b].forEach(e => { if (!rest.lines[e]) rest.lines[e] = me; }); });
    dotsGreedyTake(rest, me);
    if (rest.boxes.every(Boolean)) return deal.take;
    const v = dotsEndgameValue(rest, memo);        // for whoever has to open next
    const takeAll = deal.give + v;                 // we take them and open next
    const decline = -deal.give - v;                // they take them and open next
    return decline > takeAll ? deal.edge : deal.take;
  }
  if (safe.length) {
    if (safe.length <= DOTS_SAFE_SEARCH) {
      const chosen = dotsSafeSearch(board, Date.now() + (o.budget || DOTS_BUDGET_MS), memo, rnd);
      if (chosen !== null && chosen !== undefined) return chosen;
    }
    return pick(safe);
  }
  const open = dotsOpening(board, rnd, memo);
  return open === undefined ? pick(free) : open;
}
