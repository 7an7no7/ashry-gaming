/* ============================================================================
   إيه اللي يجمعهم؟ — PINPOINT: the rounds' rules
   ----------------------------------------------------------------------------
   Moved out of JS_Pinpoint.html for سباق ألغاز (26 Sep 2026): a race's five
   rounds are dealt on the rooms server and every pick judged there, so the
   round maker lives in a file both sides bundle (the page inlines it,
   SHARED_LISTS; the Worker bundles it, FILES in rooms-worker/build.mjs). No
   DOM, nothing that runs at load; every name starts with pin / PIN_. Draws
   with SoloShared.js (soloShuffle, soloCategory) from CHAMELEON_DB.

   A round is a category shown as up to five of its words, one at a time,
   and six categories to choose from. Right after one word is 5 points, after
   five words 1. The choices are made to be close: categories that share a
   word with the answer come first, and the first words shown are the ones
   they share, so one word is rarely enough.
   ========================================================================= */

const PIN_ROUNDS = 5;
const PIN_CLUES = 5;
const PIN_OPTIONS = 6;
// A choice sharing this many words with the answer is never offered: 4 of the 5 clues could
// be its words too, and the round would be a coin toss (the review of 1 Oct 2026: Sports ⚽
// and Olympic Sports 🏅 share 11).
const PIN_DECOY_MAX_SHARED = 4;

/** A word as one plain spelling: no diacritics, أ إ آ as ا, ة as ه, ى as ي, lower case (the page's foldWord, letters only). */
function pinFold(w) {
  return String(w || '').toLowerCase().replace(/[ً-ْٰـ]/g, '').replace(/[أإآٱ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').replace(/\s+/g, ' ').trim();
}

/** One round: { name, icon, clues: [5 words], options: [{ name, icon }], answer } */
function pinMakeRound(cats, target, rnd) {
  const fold = pinFold;
  const own = new Set(target.words.map(fold));
  const overlap = (c) => c.words.filter(w => own.has(fold(w))).length;
  const others = cats.filter(c => c !== target && overlap(c) < PIN_DECOY_MAX_SHARED);
  const neighbours = soloShuffle(others.filter(c => overlap(c) > 0), rnd).slice(0, 3);
  const decoys = neighbours.concat(soloShuffle(others.filter(c => neighbours.indexOf(c) === -1), rnd)).slice(0, PIN_OPTIONS - 1);
  const decoyWords = new Set();
  decoys.forEach(c => c.words.forEach(w => decoyWords.add(fold(w))));
  const shared = soloShuffle(target.words.filter(w => decoyWords.has(fold(w))), rnd).slice(0, 2);
  const unique = soloShuffle(target.words.filter(w => !decoyWords.has(fold(w))), rnd);
  const clues = shared.concat(unique).slice(0, PIN_CLUES);
  const options = soloShuffle([target].concat(decoys), rnd);
  const head = soloCategory(target.category);
  return {
    name: head.name, icon: head.icon, clues: clues,
    options: options.map(c => soloCategory(c.category)),
    answer: options.indexOf(target),
    shown: 1, wrong: [], points: null
  };
}

/* --- سباق ألغاز: the race plug-in (RoomRace.js) --------------------------------------
   Five rounds dealt once for every phone from categories the room hasn't
   dealt lately: each round's six choices go out, its words and its answer
   stay on the server and are told one clue at a time. A phone sends each pick
   (`move { round, i }`): right scores as the solo game (5 down to 1), wrong
   shows the next clue, the fifth wrong is 0. Five rounds answered end the
   board - won with any points, and the race ranks the finished by points,
   then by time (the owner's rule for the quiz games).
   ------------------------------------------------------------------------------ */
const PIN_RACE = {
  deal(rnd, st, pick) {
    const lang = st.lang === 'en' ? 'en' : 'ar';
    const cats = CHAMELEON_DB[lang] || CHAMELEON_DB.ar;
    const picks = pick && pick.many ? pick.many(cats, 'race_pinpoint_' + lang, PIN_ROUNDS) : soloShuffle(cats, rnd).slice(0, PIN_ROUNDS);
    const rounds = picks.map(c => pinMakeRound(cats, c, rnd));
    return { pub: { n: rounds.length, rounds: rounds.map(r => ({ options: r.options })) }, rounds: rounds };
  },
  board: (x) => ({ cur: 0, rounds: x.rounds.map(() => ({ shown: 1, wrong: [], points: null })) }),
  total: (x) => x.rounds.length,
  move(b, x, p) {
    const round = Number(p.k), i = Number(p.i);
    if (round !== b.cur || b.cur >= x.rounds.length) throw new Error('الجولة دي خلصت');
    const r = x.rounds[round], br = b.rounds[round];
    if (!Number.isInteger(i) || i < 0 || i >= r.options.length || br.wrong.indexOf(i) !== -1 || br.points !== null) throw new Error('اختيار مش مظبوط');
    if (i === r.answer) {
      br.points = Math.max(1, PIN_CLUES + 1 - br.shown);
    } else {
      br.wrong.push(i);
      if (br.shown < r.clues.length) { br.shown++; return ''; }
      br.points = 0;
    }
    b.cur++;
    if (b.cur < x.rounds.length) return '';
    return b.rounds.reduce((sum, q) => sum + (q.points || 0), 0) > 0 ? 'won' : 'lost';
  },
  progress: (b) => ({ done: b.cur }),
  // Each round as its own phone may see it: the clues shown so far, its wrong picks, and the answer once it is over.
  view: (b, x) => ({
    cur: b.cur,
    rounds: b.rounds.map((br, k) => Object.assign({ shown: br.shown, wrong: br.wrong.slice(), points: br.points, clues: x.rounds[k].clues.slice(0, br.shown) },
      br.points === null ? {} : { answer: x.rounds[k].answer, name: x.rounds[k].name, icon: x.rounds[k].icon, clues: x.rounds[k].clues.slice() }))
  }),
  score: (b) => b.rounds.reduce((sum, q) => sum + (q.points || 0), 0),
  reveal: (x) => ({ cats: x.rounds.map(r => ({ name: r.name, icon: r.icon })) })
};
