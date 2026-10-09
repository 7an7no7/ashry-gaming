/* ============================================================================
   حسبة — Numbers: the deal, the steps and the solver (9 Oct 2026)
   ----------------------------------------------------------------------------
   One copy for both sides: the page has it in the game's chunk (CHUNKS in
   tools/lazy-split.mjs, SHARED_LISTS) and the rooms server bundles it (FILES
   in rooms-worker/build.mjs), so a phone's board and the server's judge are
   the same arithmetic.

   The game: a few numbers and a target. Two numbers and an operation merge
   into a new number; every number is used at most once; every step is whole
   (no fractions, nothing at or under zero). Levels (the owner, 9 Oct 2026):
     easy  4 numbers from 1-10 (now and then one 25 or 50), a target 10-99
     hard  6 numbers: 1-4 big ones (25 50 75 100) and small ones 1-10, a
           target 101-999
   A deal is only ever one whose target can be reached exactly: it is built
   from a way to reach it (hesbaDeal), and the solver (hesbaSolve) finds the
   shortest exact way, which is the "one exact way" shown after a round.

   Steps travel as [i, op, j]: i and j are places in the pool (the dealt
   numbers 0..n-1, then each step's result in turn: n, n+1, ...), op one of
   + - * /. hesbaReplay(nums, steps) checks them (each place used once, every
   step whole) and returns the pool, or null: the server replays every answer
   it is sent and never trusts a phone's value.
   ========================================================================= */

const HESBA_OPS = ['+', '-', '*', '/'];
const HESBA_BIG = [25, 50, 75, 100];
const HESBA_LEVELS = {
  easy: { count: 4, min: 10, max: 99, steps: [2, 3] },
  hard: { count: 6, min: 101, max: 999, steps: [2, 3, 4] }
};
const HESBA_CAP = 1000000;   // a step past this is no help to a target under 1000

/** A small seeded generator (mulberry32): the same seed, the same deal on every phone and the server. */
function hesbaRng(seed) {
  let s = (Number(seed) >>> 0) || 1;
  return function () {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** One step: the whole result of a op b, or null when it isn't whole and above zero. */
function hesbaCalc(a, op, b) {
  let r = null;
  if (op === '+') r = a + b;
  else if (op === '-') r = a - b;
  else if (op === '*') r = a * b;
  else if (op === '/') r = b !== 0 && a % b === 0 ? a / b : null;
  return r !== null && Number.isInteger(r) && r > 0 && r <= HESBA_CAP ? r : null;
}

/** The same two numbers in the order that works (a minus or a divide the other way round), or null. */
function hesbaOrder(a, op, b) {
  if (hesbaCalc(a, op, b) !== null) return [a, b, false];
  if ((op === '-' || op === '/') && hesbaCalc(b, op, a) !== null) return [b, a, true];
  return null;
}

/**
 * Checks a list of steps against the dealt numbers: each place used once, every step whole.
 * Returns the pool (the numbers, then each result), or null.
 */
function hesbaReplay(nums, steps) {
  if (!Array.isArray(nums) || !Array.isArray(steps) || steps.length > nums.length - 1) return null;
  const pool = nums.slice();
  const used = {};
  for (const st of steps) {
    if (!Array.isArray(st) || st.length !== 3) return null;
    const i = st[0], op = st[1], j = st[2];
    if (!Number.isInteger(i) || !Number.isInteger(j) || i === j || HESBA_OPS.indexOf(op) === -1) return null;
    if (i < 0 || j < 0 || i >= pool.length || j >= pool.length || used[i] || used[j]) return null;
    const r = hesbaCalc(pool[i], op, pool[j]);
    if (r === null) return null;
    used[i] = used[j] = true;
    pool.push(r);
  }
  return pool;
}

/** Steps by place as steps by value, [[a, op, b, result], ...] (what is shown), or null. */
function hesbaWayOf(nums, steps) {
  const pool = hesbaReplay(nums, steps);
  if (!pool) return null;
  return steps.map((st, k) => [pool[st[0]], st[1], pool[st[2]], pool[nums.length + k]]);
}

/** The places of a pool not yet used by the steps (what is still on the board). */
function hesbaFree(n, steps) {
  const used = {};
  (steps || []).forEach(st => { used[st[0]] = used[st[2]] = true; });
  const out = [];
  for (let k = 0; k < n + (steps || []).length; k++) if (!used[k]) out.push(k);
  return out;
}

/**
 * The shortest exact way to `target` from `nums` (each used at most once), as steps
 * [[a, op, b, result], ...] of values, or null. Iterative deepening, with every
 * board met at a depth remembered, so it stays quick (a few ms for six numbers).
 * `maxSteps` caps the search (default: all of them).
 */
function hesbaSolve(nums, target, maxSteps) {
  if (nums.indexOf(target) !== -1) return [];
  const limit = Math.min(nums.length - 1, maxSteps || nums.length - 1);
  for (let depth = 1; depth <= limit; depth++) {
    const seen = new Set();
    const path = [];
    const go = (list, left) => {
      if (left === 0) return false;
      const key = list.slice().sort((x, y) => x - y).join(',') + '|' + left;
      if (seen.has(key)) return false;
      seen.add(key);
      for (let x = 0; x < list.length; x++) {
        for (let y = 0; y < list.length; y++) {
          if (x === y) continue;
          const a = list[x], b = list[y];
          for (const op of HESBA_OPS) {
            // + and × once per pair; − and ÷ only bigger by smaller (the other way is never whole and above zero).
            if ((op === '+' || op === '*') && x > y) continue;
            if ((op === '-' || op === '/') && a < b) continue;
            if (op === '*' && (a === 1 || b === 1)) continue;
            if (op === '/' && b === 1) continue;
            const r = hesbaCalc(a, op, b);
            if (r === null) continue;
            path.push([a, op, b, r]);
            if (r === target) return true;
            if (left > 1) {
              const rest = list.filter((_, k) => k !== x && k !== y);
              rest.push(r);
              if (go(rest, left - 1)) return true;
            }
            path.pop();
          }
        }
      }
      return false;
    };
    if (go(nums.slice(), depth)) return path;
  }
  return null;
}

/** Every value reachable in one step or none: a target among them is too easy to deal. */
function hesbaOneStep(nums) {
  const out = new Set(nums);
  for (let x = 0; x < nums.length; x++) {
    for (let y = 0; y < nums.length; y++) {
      if (x === y) continue;
      HESBA_OPS.forEach(op => { const r = hesbaCalc(nums[x], op, nums[y]); if (r !== null) out.add(r); });
    }
  }
  return out;
}

/** The numbers of a deal for a level, from `rnd`. */
function hesbaNumbers(level, rnd) {
  const L = HESBA_LEVELS[level] || HESBA_LEVELS.easy;
  const small = () => 1 + Math.floor(rnd() * 10);
  const nums = [];
  if (level === 'hard') {
    const big = HESBA_BIG.slice();
    const bigCount = 1 + Math.floor(rnd() * 4);
    for (let k = 0; k < bigCount; k++) nums.push(big.splice(Math.floor(rnd() * big.length), 1)[0]);
    // The small ones: at most two of any number, as the cards of the TV show.
    const count = {};
    while (nums.length < L.count) { const v = small(); if ((count[v] || 0) < 2) { count[v] = (count[v] || 0) + 1; nums.push(v); } }
  } else {
    if (rnd() < 0.35) nums.push(rnd() < 0.5 ? 25 : 50);
    const count = {};
    while (nums.length < L.count) { const v = 1 + Math.floor(rnd() * 9) + (rnd() < 0.2 ? 1 : 0); if ((count[v] || 0) < 2) { count[v] = (count[v] || 0) + 1; nums.push(v); } }
  }
  // Shuffled, so the big ones aren't always first.
  for (let k = nums.length - 1; k > 0; k--) { const r = Math.floor(rnd() * (k + 1)); const tmp = nums[k]; nums[k] = nums[r]; nums[r] = tmp; }
  return nums;
}

/**
 * A deal: { level, nums, target, way } - the target is reached by a random chain of whole
 * steps over the numbers (so it is always reachable), kept only when it is in the level's
 * range and more than one step away; `way` is then the shortest exact way the solver finds.
 */
function hesbaDeal(level, rnd) {
  const lv = HESBA_LEVELS[level] ? level : 'easy';
  const L = HESBA_LEVELS[lv];
  for (let tries = 0; tries < 400; tries++) {
    const nums = hesbaNumbers(lv, rnd);
    const easyOnes = hesbaOneStep(nums);
    // Chains make small targets far more often than big ones: a target is wished for evenly
    // over the range, and the chain's result nearest to it is the one dealt.
    const wish = L.min + Math.floor(rnd() * (L.max - L.min + 1));
    const found = [];
    for (let k = 0; k < 40; k++) {
      const want = L.steps[Math.floor(rnd() * L.steps.length)];
      let list = nums.slice();
      for (let s = 0; s < want && list.length > 1; s++) {
        const x = Math.floor(rnd() * list.length);
        let y = Math.floor(rnd() * (list.length - 1));
        if (y >= x) y++;
        const op = HESBA_OPS[Math.floor(rnd() * 4)];
        const ord = hesbaOrder(list[x], op, list[y]);
        if (!ord) { s--; if (rnd() < 0.05) break; continue; }
        const r = hesbaCalc(ord[0], op, ord[1]);
        list = list.filter((_, q) => q !== x && q !== y);
        list.push(r);
      }
      const target = list[list.length - 1];
      if (target < L.min || target > L.max || easyOnes.has(target)) continue;
      found.push(target);
    }
    found.sort((a, b) => Math.abs(a - wish) - Math.abs(b - wish));
    for (const target of found.slice(0, 3)) {
      const way = hesbaSolve(nums, target, L.count - 1);
      if (way && way.length >= 2) return { level: lv, nums, target, way };
    }
  }
  // Never reached in practice; a fixed deal that is known to work.
  return lv === 'hard'
    ? { level: lv, nums: [100, 75, 50, 25, 6, 3], target: 952, way: hesbaSolve([100, 75, 50, 25, 6, 3], 952) }
    : { level: lv, nums: [3, 7, 8, 5], target: 61, way: hesbaSolve([3, 7, 8, 5], 61) };
}

/** Points for an answer `off` from the target (the solo run): 10 exact, 7 up to 5 off, 5 up to 10, else 0. */
function hesbaPoints(off) {
  if (off === 0) return 10;
  if (off <= 5) return 7;
  if (off <= 10) return 5;
  return 0;
}
