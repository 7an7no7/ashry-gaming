/* ============================================================================
   كلمات من حروف — THE LETTER WHEEL: the puzzle's rules
   ----------------------------------------------------------------------------
   Moved out of JS_WordWheel.html for سباق ألغاز (26 Sep 2026): a race's wheel
   is dealt on the rooms server and every word judged there, so the
   dictionary, the layout and the judge live in a file both sides bundle (the
   page inlines it, SHARED_LISTS; the Worker bundles it, FILES in
   rooms-worker/build.mjs). No DOM, nothing that runs at load; every name
   starts with wheel / WHEEL_. Draws with SoloShared.js (soloShuffle, soloPick).

   The words are the app's own banks in the games' language (wheelDictionary),
   folded to plain letters (hamza seats and diacritics, and a leading "ال").
   A puzzle is a base word of 5, 6 or 7 letters, every dictionary word its
   letters can spell, and a crossword laid out from those (wheelLayout: each
   word crosses one already placed, touching nothing else). What doesn't fit
   the grid counts as a bonus. Every bank is read with a typeof guard: the
   rooms server has the lists it bundles (Chameleon, Wordle, Stop, Monkey,
   spy, Connections), the page those and its own Describe It, Charades and
   Who Am I lists - so a race's words and bonus words are the server's banks.
   ========================================================================= */

const WHEEL_LEVELS = {
  easy:   { letters: 5, min: 4, max: 6 },
  medium: { letters: 6, min: 5, max: 7 },
  hard:   { letters: 7, min: 6, max: 8 }
};
const WHEEL_DICT = {};

function wheelFold(word, lang) {
  let w = String(word || '').trim().replace(/[ً-ْٰـ]/g, '').replace(/[أإآٱ]/g, 'ا');
  if (lang === 'en') return w.toUpperCase();
  if (w.indexOf('ال') === 0 && w.length >= 5) w = w.slice(2);
  return w;
}

/** Every single word of 3 to 7 plain letters the banks at hand know, in one language. */
function wheelDictionary(lang) {
  if (WHEEL_DICT[lang]) return WHEEL_DICT[lang];
  const re = lang === 'en' ? /^[A-Z]{3,7}$/ : /^[ء-ي]{3,7}$/;
  const set = new Set();
  const add = (w) => { const f = wheelFold(w, lang); if (re.test(f)) set.add(f); };
  const addAll = (list) => (list || []).forEach(add);
  if (typeof CHAMELEON_DB !== 'undefined') (CHAMELEON_DB[lang] || []).forEach(x => addAll(x.words));
  if (typeof WORDLE_DB !== 'undefined' && WORDLE_DB[lang]) Object.values(WORDLE_DB[lang]).forEach(addAll);
  if (typeof STOP_WORDS !== 'undefined' && STOP_WORDS[lang]) ['produce', 'plants', 'colors', 'things', 'animals', 'jobs', 'foods'].forEach(k => addAll(STOP_WORDS[lang][k]));
  if (typeof MONKEY_LISTS !== 'undefined' && MONKEY_LISTS[lang]) ['animals', 'foods'].forEach(k => addAll(MONKEY_LISTS[lang][k]));
  if (lang === 'ar' && typeof SPY_WORDS !== 'undefined') ['حيوانات', 'أكلات', 'مهن', 'أشياء', 'مواصلات', 'رياضات', 'آلات موسيقية'].forEach(k => addAll(SPY_WORDS[k]));
  [typeof CONNECTIONS_EASY !== 'undefined' ? CONNECTIONS_EASY : null,
   typeof CONNECTIONS_DB !== 'undefined' ? CONNECTIONS_DB : null,
   typeof CONNECTIONS_HARD !== 'undefined' ? CONNECTIONS_HARD : null].forEach(db => {
    ((db && db[lang]) || []).forEach(p => p.groups.forEach(g => addAll(g.words)));
  });
  // Describe It's cards and their forbidden words are everyday vocabulary; the
  // Charades and Who Am I lists add things, animals, food and jobs (not titles or people).
  if (typeof DESCRIBE_DB !== 'undefined') (DESCRIBE_DB[lang] || []).forEach(card => { add(card.word); addAll(card.forbidden); });
  const people = /أفلام|مسرحيات|مسلسلات|شخصيات|مشاهير|أنمي|أمثال|دول|League|Movies|TV|Cartoon|Celebrities|Anime|Countries/;
  [typeof CHARADES_DB !== 'undefined' ? CHARADES_DB : null, typeof WHOAMI_DB !== 'undefined' ? WHOAMI_DB : null].forEach(db => {
    const cats = (db && db[lang]) || {};
    Object.keys(cats).filter(k => !people.test(k)).forEach(k => addAll(cats[k]));
  });
  WHEEL_DICT[lang] = [...set];
  return WHEEL_DICT[lang];
}

function wheelCounts(w) {
  const m = {};
  for (const ch of w) m[ch] = (m[ch] || 0) + 1;
  return m;
}

function wheelFitsIn(w, pool) {
  const m = wheelCounts(w);
  return Object.keys(m).every(ch => (pool[ch] || 0) >= m[ch]);
}

/** A small crossword: every word crosses one already placed and touches nothing else. */
function wheelLayout(words, rnd, max) {
  const cells = new Map();          // "r,c" -> { ch, a, d }
  const placed = [];
  const at = (r, c) => cells.get(r + ',' + c);
  const put = (w, r, c, dir) => {
    for (let k = 0; k < w.length; k++) {
      const rr = dir === 'a' ? r : r + k, cc = dir === 'a' ? c + k : c;
      const key = rr + ',' + cc;
      const cell = cells.get(key) || { ch: w[k], a: false, d: false };
      cell[dir] = true;
      cells.set(key, cell);
    }
    placed.push({ w: w, r: r, c: c, dir: dir });
  };
  const canPut = (w, r, c, dir) => {
    const dr = dir === 'a' ? 0 : 1, dc = dir === 'a' ? 1 : 0;
    if (at(r - dr, c - dc) || at(r + dr * w.length, c + dc * w.length)) return false;
    let crossings = 0;
    for (let k = 0; k < w.length; k++) {
      const rr = r + dr * k, cc = c + dc * k;
      const cell = at(rr, cc);
      if (cell) {
        if (cell.ch !== w[k] || cell[dir]) return false;
        crossings++;
      } else if (dir === 'a' ? (at(rr - 1, cc) || at(rr + 1, cc)) : (at(rr, cc - 1) || at(rr, cc + 1))) {
        return false;
      }
    }
    return crossings > 0;
  };
  put(words[0], 0, 0, 'a');
  for (const w of words.slice(1)) {
    if (placed.length >= max) break;
    const options = [];
    placed.forEach(p => {
      for (let i = 0; i < p.w.length; i++) for (let j = 0; j < w.length; j++) {
        if (p.w[i] !== w[j]) continue;
        const dir = p.dir === 'a' ? 'd' : 'a';
        const r = p.dir === 'a' ? p.r - j : p.r + i;
        const c = p.dir === 'a' ? p.c + i : p.c - j;
        if (canPut(w, r, c, dir)) options.push([r, c, dir]);
      }
    });
    if (options.length) { const [r, c, dir] = soloPick(options, rnd); put(w, r, c, dir); }
  }
  const minR = Math.min(...placed.map(p => p.r)), minC = Math.min(...placed.map(p => p.c));
  let rows = 0, cols = 0;
  placed.forEach(p => {
    p.r -= minR; p.c -= minC;
    rows = Math.max(rows, p.dir === 'a' ? p.r + 1 : p.r + p.w.length);
    cols = Math.max(cols, p.dir === 'a' ? p.c + p.w.length : p.c + 1);
  });
  return { placed: placed, rows: rows, cols: cols };
}

function wheelMake(level, lang, rnd) {
  const L = WHEEL_LEVELS[level] || WHEEL_LEVELS.easy;
  const dict = wheelDictionary(lang);
  const bases = soloShuffle(dict.filter(w => w.length === L.letters && new Set(w).size >= L.letters - 1), rnd);
  for (const base of bases.slice(0, 500)) {
    const pool = wheelCounts(base);
    const subs = dict.filter(w => w !== base && wheelFitsIn(w, pool));
    if (subs.length + 1 < L.min) continue;
    const ordered = [base].concat(soloShuffle(subs, rnd).sort((a, b) => b.length - a.length));
    const layout = wheelLayout(ordered, rnd, L.max);
    if (layout.placed.length < L.min || layout.rows > 9 || layout.cols > 9) continue;
    const inGrid = new Set(layout.placed.map(p => p.w));
    return {
      letters: soloShuffle(base.split(''), rnd),
      words: layout.placed,
      bonus: ordered.filter(w => !inGrid.has(w)),
      rows: layout.rows, cols: layout.cols
    };
  }
  return null;
}

/* --- سباق ألغاز: the race plug-in (RoomRace.js) --------------------------------------
   A medium wheel (6 letters) dealt once for every phone: the letters and the
   crossword's shape (each word's length and place) go out, the words and the
   bonus words stay on the server. A phone sends each word it makes
   (`move { word }`): a grid word comes back in its place, a bonus word is
   counted, anything else or a repeat is nothing. Every grid word found wins.
   ------------------------------------------------------------------------------ */
const WHEEL_RACE_LEVEL = 'medium';
const WHEEL_RACE = {
  deal(rnd, st) {
    const lang = st.lang === 'en' ? 'en' : 'ar';
    const made = wheelMake(WHEEL_RACE_LEVEL, lang, rnd) || wheelMake('easy', lang, rnd);
    return {
      pub: { letters: made.letters, layout: made.words.map(p => ({ len: p.w.length, r: p.r, c: p.c, dir: p.dir })), rows: made.rows, cols: made.cols, lang: lang },
      words: made.words.map(p => p.w),
      bonus: made.bonus
    };
  },
  board: () => ({ found: [], bonus: [], last: '' }),
  total: (x) => x.words.length,
  move(b, x, p, st) {
    const word = wheelFold(String(p.word || ''), x.pub.lang);
    if (!word || word.length < 2) throw new Error('اكتب كلمة');
    const wi = x.words.indexOf(word);
    if (wi !== -1) {
      if (b.found.indexOf(wi) !== -1) { b.last = 'again'; return ''; }
      b.found.push(wi);
      b.last = 'word';
      return b.found.length === x.words.length ? 'won' : '';
    }
    if (x.bonus.indexOf(word) !== -1) {
      if (b.bonus.indexOf(word) !== -1) { b.last = 'again'; return ''; }
      b.bonus.push(word);
      b.last = 'bonus';
      return '';
    }
    b.last = 'none';
    return '';
  },
  progress: (b) => ({ done: b.found.length }),
  view: (b, x) => ({ found: b.found.map(wi => ({ wi: wi, w: x.words[wi] })), bonus: b.bonus.slice(), last: b.last }),
  score: () => 0,
  reveal: (x) => ({ words: x.words.slice(), letters: x.pub.letters.slice() })
};
