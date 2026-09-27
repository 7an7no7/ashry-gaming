/* ============================================================================
   سلسلة الإجابات — THE QUIZ STREAK: the questions' rules
   ----------------------------------------------------------------------------
   Moved out of JS_QuizStreak.html for سباق ألغاز (26 Sep 2026): a race's ten
   questions are dealt on the rooms server and every answer judged there, so
   the question makers live in a file both sides bundle (the page inlines it,
   SHARED_LISTS; the Worker bundles it, FILES in rooms-worker/build.mjs). No
   DOM, nothing that runs at load; every name starts with streak / STREAK_.
   Draws with SoloShared.js (soloShuffle).

   Every question comes from a bank the app already has, never a new list:
   - trivia: TRIVIA_QUESTIONS (the room trivia's four-choice questions);
   - board: TRIVIA_BOARD_BANK (دوري المعرفة, JS_TriviaBoardBank.html - on the
     page only, so a race does without it), whose answers are free text, so
     the three wrong ones are other answers from the same category;
   - emoji: EMOJI_RIDDLES, wrong answers from the same kind (films with films);
   - proverbs: PROVERBS, the missing word against other proverbs' words.
   Each bank is read with a typeof guard, so a side that lacks one deals from
   the rest.
   ========================================================================= */

const STREAK_KINDS = ['trivia', 'board', 'emoji', 'proverbs'];

/** A word as one plain spelling (the page's foldWord, letters only). */
function streakFold(w) {
  return String(w || '').toLowerCase().replace(/[ً-ْٰـ]/g, '').replace(/[أإآٱ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').replace(/[^\p{L}\p{N} ]/gu, '').replace(/\s+/g, ' ').trim();
}

function streakDistinct(answer, pool, count, rnd) {
  const seen = new Set([streakFold(answer)]);
  const out = [];
  soloShuffle(pool, rnd).forEach(x => {
    const f = streakFold(x);
    if (out.length >= count || !f || seen.has(f)) return;
    seen.add(f);
    out.push(x);
  });
  return out;
}

/**
 * The number inside an answer written as a number ("1977", "45 دقيقة",
 * "كل 4 سنوات", "42.195 كم"), or null for a word answer. A name with digits
 * stuck to letters (R2-D2) is a word.
 */
function streakNumberOf(answer) {
  const m = String(answer).match(/(^|\s)(-?(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?)(?=\s|$)/);
  if (!m) return null;
  return { text: m[2], value: Number(m[2].replace(/,/g, '')), decimals: (m[2].split('.')[1] || '').length, commas: m[2].indexOf(',') !== -1 };
}

/**
 * Three wrong answers of the same kind as the right one. A number gets
 * numbers near it, written the same way (a year other years, "45 دقيقة"
 * other minutes), so the one number among three words never gives the
 * answer away; a word gets other word answers from its category, the ones
 * about as long first, then from the whole bank.
 */
function streakBoardDecoys(answer, categoryTexts, everyText, rnd) {
  const num = streakNumberOf(answer);
  if (num) {
    const v = num.value;
    let candidates;
    if (num.decimals) {
      candidates = [0.8, 0.9, 0.95, 1.05, 1.1, 1.25].map(f => (v * f).toFixed(num.decimals));
    } else if (v >= 1000 && v <= 2100) {
      candidates = [-30, -20, -12, -8, -5, -3, -2, 2, 3, 4, 6, 9, 13, 21].map(d => v + d).filter(y => y <= 2025);
    } else if (v <= 20) {
      candidates = [-4, -3, -2, -1, 1, 2, 3, 4, 5].map(d => v + d).filter(x => x > 0);
    } else {
      candidates = [0.5, 0.7, 0.8, 0.9, 1.1, 1.2, 1.3, 1.5, 2].map(f => Math.round(v * f));
    }
    if (num.commas) candidates = candidates.map(x => Number(x).toLocaleString('en-US'));
    const seen = new Set([num.text]);
    const picks = [];
    soloShuffle(candidates.map(String), rnd).forEach(c => {
      if (picks.length < 3 && !seen.has(c)) { seen.add(c); picks.push(c); }
    });
    return picks.map(c => String(answer).replace(num.text, c));
  }
  const words = String(answer).trim().split(/\s+/).length;
  const near = categoryTexts.filter(a => a !== answer && Math.abs(a.trim().split(/\s+/).length - words) <= 1);
  const picks = streakDistinct(answer, near, 3, rnd);
  if (picks.length < 3) picks.push(...streakDistinct(answer, categoryTexts.filter(a => picks.indexOf(a) === -1), 3 - picks.length, rnd));
  if (picks.length < 3) picks.push(...streakDistinct(answer, everyText.filter(a => picks.indexOf(a) === -1), 3 - picks.length, rnd));
  return picks.slice(0, 3);
}

/** Four shuffled options with the right one's index. */
function streakOptions(answer, decoys, rnd) {
  const options = soloShuffle([answer].concat(decoys), rnd);
  return { options: options, answer: options.indexOf(answer) };
}

/** The raw items of one kind: { key, make(rnd) -> question } */
function streakPool(kind, lang) {
  if (kind === 'trivia') {
    const list = (typeof TRIVIA_QUESTIONS !== 'undefined' && (TRIVIA_QUESTIONS[lang] || TRIVIA_QUESTIONS.ar)) || [];
    return list.map(x => ({
      key: x.q,
      make: (rnd) => Object.assign({ kind: kind, prompt: x.q, tag: '' }, streakOptions(x.choices[x.answer], x.choices.filter((_, i) => i !== x.answer), rnd))
    }));
  }
  if (kind === 'board') {
    const out = [];
    const bank = typeof TRIVIA_BOARD_BANK !== 'undefined' ? TRIVIA_BOARD_BANK : [];
    // A note in brackets ("1024 (أو 1000 بالنظام العشري)") is for the host
    // reading the board; as an option it would be copied into every wrong one.
    const clean = (a) => String(a).replace(/\s*[(（][^)）]*[)）]/g, '').trim();
    const everyText = [];
    bank.forEach(cat => Object.values(cat.levels).forEach(list => list.forEach(row => {
      const a = clean(lang === 'en' ? row[3] : row[1]);
      if (!streakNumberOf(a)) everyText.push(a);
    })));
    bank.forEach(cat => {
      const items = [];
      Object.values(cat.levels).forEach(list => list.forEach(row => items.push(lang === 'en' ? { q: row[2], a: clean(row[3]) } : { q: row[0], a: clean(row[1]) })));
      const texts = items.map(x => x.a).filter(a => !streakNumberOf(a));
      items.forEach(x => out.push({
        key: x.q,
        make: (rnd) => Object.assign({ kind: kind, prompt: x.q, tag: `${cat.icon} ${lang === 'en' ? cat.en : cat.ar}` },
          streakOptions(x.a, streakBoardDecoys(x.a, texts, everyText, rnd), rnd))
      }));
    });
    return out;
  }
  if (kind === 'emoji') {
    const list = (typeof EMOJI_RIDDLES !== 'undefined' && (EMOJI_RIDDLES[lang] || EMOJI_RIDDLES.ar)) || [];
    return list.map(x => ({
      key: x.e,
      make: (rnd) => {
        const same = list.filter(y => y.c === x.c && y !== x).map(y => y.a);
        const decoys = streakDistinct(x.a, same, 3, rnd);
        if (decoys.length < 3) decoys.push(...streakDistinct(x.a, list.map(y => y.a).filter(a => decoys.indexOf(a) === -1), 3 - decoys.length, rnd));
        return Object.assign({ kind: kind, prompt: '', big: x.e, tag: x.c }, streakOptions(x.a, decoys, rnd));
      }
    }));
  }
  const list = (typeof PROVERBS !== 'undefined' && (PROVERBS[lang] || PROVERBS.ar)) || [];
  return list.map(x => ({
    key: x.p,
    make: (rnd) => Object.assign({ kind: 'proverbs', prompt: x.p, tag: '' }, streakOptions(x.a, streakDistinct(x.a, list.map(y => y.a), 3, rnd), rnd))
  }));
}

/* --- سباق ألغاز: the race plug-in (RoomRace.js) --------------------------------------
   Ten questions dealt once for every phone from the banks the server has
   (trivia, emoji, proverbs - the team board's bank is the page's), through
   the room's memory of what it dealt lately. The questions and their answers
   stay on the server: a phone gets one question at a time and sends its pick
   (`move { q, i }`). No hearts and no question clock in a race (the owner:
   most right, then fastest): the tenth answer ends the board, won with any
   right answer, and the race ranks the finished by right answers, then by time.
   ------------------------------------------------------------------------------ */
const STREAK_RACE_N = 10;
const STREAK_RACE_KINDS = ['trivia', 'emoji', 'proverbs'];
const STREAK_RACE = {
  deal(rnd, st, pick) {
    const lang = st.lang === 'en' ? 'en' : 'ar';
    const qs = [];
    const per = {};
    for (let k = 0; k < STREAK_RACE_N; k++) { const kind = STREAK_RACE_KINDS[k % STREAK_RACE_KINDS.length]; per[kind] = (per[kind] || 0) + 1; }
    const picked = {};
    STREAK_RACE_KINDS.forEach(kind => {
      const pool = streakPool(kind, lang);
      picked[kind] = pick && pick.many ? pick.many(pool, 'race_streak_' + kind + '_' + lang, per[kind]) : soloShuffle(pool, rnd).slice(0, per[kind]);
    });
    const taken = {};
    for (let k = 0; k < STREAK_RACE_N; k++) {
      const kind = STREAK_RACE_KINDS[k % STREAK_RACE_KINDS.length];
      const item = picked[kind][taken[kind] = (taken[kind] || 0)];
      taken[kind]++;
      if (item) qs.push(item.make(rnd));
    }
    return { pub: { n: qs.length }, qs: qs };
  },
  board: () => ({ asked: 0, right: 0, marks: [], last: null }),
  total: (x) => x.qs.length,
  move(b, x, p) {
    const q = Number(p.q), i = Number(p.i);
    if (q !== b.asked || b.asked >= x.qs.length) throw new Error('السؤال ده خلص');
    const question = x.qs[q];
    if (!Number.isInteger(i) || i < -1 || i >= question.options.length) throw new Error('اختيار مش مظبوط');
    const right = i === question.answer;
    if (right) b.right++;
    b.marks.push(right ? '✅' : '❌');
    b.last = { q: q, answer: question.answer, picked: i };
    b.asked++;
    if (b.asked < x.qs.length) return '';
    return b.right > 0 ? 'won' : 'lost';
  },
  progress: (b) => ({ done: b.asked }),
  // The question up, without its answer; the last one's answer, so the phone can colour it.
  view(b, x) {
    const q = b.asked < x.qs.length ? x.qs[b.asked] : null;
    return {
      asked: b.asked, right: b.right, marks: b.marks.slice(), last: b.last,
      q: q ? { kind: q.kind, prompt: q.prompt, big: q.big || '', tag: q.tag || '', options: q.options.slice() } : null
    };
  },
  score: (b) => b.right,
  reveal: () => null
};
