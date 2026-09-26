/* ============================================================================
   SOLO SHARED — the small pieces every solo puzzle's generator uses
   ----------------------------------------------------------------------------
   Moved out of JS_Solo.html for سباق ألغاز (26 Sep 2026): the puzzle of a
   race is dealt on the rooms server, so the generators (Sudoku.js, Queens.js,
   Tango.js, Nonogram.js, Mines.js, Strands.js, WordWheel.js, Pinpoint.js,
   QuizStreak.js) and what they draw with live in files both sides bundle.
   One copy: the page inlines this file (SHARED_LISTS) and the Worker bundles
   it (FILES in rooms-worker/build.mjs). No DOM, nothing that runs at load.

   - soloHash / soloRng: mulberry32, a small seeded generator, good enough for
     dealing puzzles. A daily puzzle is dealt from the date's seed
     (soloDaySeed in JS_Solo.html), a race from the server's own random.
   - soloShuffle / soloPick / soloRandom: drawing with any `rnd` (Math.random
     or a seeded one).
   - soloCategory: a list's category as its name and its emoji.
   ========================================================================= */

function soloHash(text) {
  let h = 2166136261;
  const s = String(text);
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** mulberry32: a fast seeded generator, good enough for dealing puzzles. */
function soloRng(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A random source: seeded when a seed is given (the daily), Math.random otherwise. */
function soloRandom(seed) {
  return (seed === undefined || seed === null) ? Math.random : soloRng(seed);
}

function soloShuffle(arr, rnd) {
  const r = rnd || Math.random;
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    const tmp = out[i]; out[i] = out[j]; out[j] = tmp;
  }
  return out;
}

function soloPick(arr, rnd) {
  return arr[Math.floor((rnd || Math.random)() * arr.length)];
}

/** A list's category as its name and its emoji: "فواكه 🍎" -> { name, icon }. */
function soloCategory(category) {
  const re = /\p{Extended_Pictographic}[️‍\p{Extended_Pictographic}]*/gu;
  const text = String(category || '');
  return { name: text.replace(re, '').trim(), icon: (text.match(re) || [''])[0] };
}
