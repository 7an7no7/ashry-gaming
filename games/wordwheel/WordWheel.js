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
  wheelBankWords(lang).forEach((w) => { const f = wheelFold(w, lang); if (re.test(f)) set.add(f); });
  WHEEL_DICT[lang] = [...set];
  return WHEEL_DICT[lang];
}

/**
 * Every entry of the banks at hand in one language, as written (any length, phrases
 * too): the wheel's dictionary is cut from it, and Wordle's soft "not in our
 * dictionary" check reads it whole (JS_Wordle.html, the review of 1 Oct 2026).
 */
function wheelBankWords(lang) {
  const out = [];
  const add = (w) => { if (w) out.push(String(w)); };
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
  return out;
}

/*
 * Everyday words the banks don't have - verbs, adjectives, the little words (the review of
 * 1 Oct 2026: كتب, لعب, حلو, سريع were "not a word"). They are only ever a bonus ⭐: the
 * grid and the base word still come from wheelDictionary, so a daily's board is the same
 * as it was, it just accepts more. Egyptian everyday Arabic and plain English, family-clean.
 */
const WHEEL_BONUS_WORDS = {
  ar: ('كتب قرا لعب اكل شرب نام قام راح مشي جري وقف قعد رجع خرج دخل فتح قفل غسل طبخ رسم سمع شاف عرف فهم ' +
    'ضحك سافر وصل نزل طلع ركب كسب خسر جاب اخد قال سال لبس مسح كنس زرع صحي درس نجح شال بنى عمل صنع طار عام ' +
    'غنى رقص صلى صام زار حضن ساعد شكر فكر نسي افتكر حلم تعب فرح زعل خاف كسر لمس ذاق دفع سحب رمى مسك جمع ' +
    'طرح قسم حسب وزن قاس لون لصق رتب نضف كوى خبز قلى سلق شوى عجن قطع ملا سخن برد كبر صغر طول قصر ذاكر ' +
    'اشتغل استنى ضحكت كتبت لعبت اكلت شربت نمت رحت مشيت رجعت فتحت سمعت شفت عرفت فهمت حبيت قلت ' +
    'يكتب يقرا يلعب ياكل يشرب ينام يقوم يروح يمشي يجري يقف يقعد يرجع يخرج يدخل يفتح يقفل يغسل يطبخ يرسم ' +
    'يسمع يشوف يعرف يفهم يحب يضحك يسافر يوصل ينزل يطلع يركب يكسب يلبس يساعد يفكر يغني يرقص يطير يعوم ' +
    'يدرس يذاكر يشتغل يحلم يلون يبني يعمل يزرع يصحى يستنى يقول يسال يجيب ياخد ' +
    'اكتب اقرا العب اشرب انام اروح امشي اشوف اعرف احب افتح اقفل ارسم اسمع ' +
    'كبير صغير طويل قصير جميل حلو وحش جديد قديم سريع بطيء تقيل خفيف سخن بارد حار ساقع نضيف فاضي مليان ' +
    'سعيد فرحان زعلان تعبان جعان عطشان شبعان نعسان صاحي نايم غالي رخيص قريب بعيد عالي واطي واسع ضيق ' +
    'ناعم خشن طري ناشف مبلول غني فقير قوي ضعيف ذكي شاطر كسلان هادي مبسوط لطيف ظريف طيب شجاع عريض رفيع ' +
    'صعب سهل مهم كويس جامد حلوة كبيرة صغيرة جميلة جديدة قديمة سريعة طويلة قصيرة نضيفة سهلة صعبة ' +
    'بكرة امبارح دلوقتي النهارده كمان برضه هنا هناك فين امتى ليه ازاي مين ايه كتير قليل شوية خالص اوي ' +
    'جدا دايما ابدا لسه بعدين قبل بعد تحت فوق جنب قدام ورا جوه بره كل بعض اللي لازم ممكن عايز عاوز ' +
    'عارف شايف فاكر جاي رايح ماشي قاعد واقف شكرا اهلا سلام مرحبا صباح مساء يلا تعالى خلاص طبعا').split(' '),
  en: ('and the for but not you are was were his her she they them this that what when then than with from ' +
    'have has had will would could should there their here where which while about after again also always ' +
    'never every other some many much more most very just only even over under into onto upon out off down ' +
    'our ours your yours its who whom whose why how yes nor yet too any all each both few own same such ' +
    'today tonight often soon later early almost maybe please thanks sorry hello inside outside behind ' +
    'before below above around across along among until since ' +
    'act add ask ate bake beat become began begin bend bite blow boil borrow bought break bring brought ' +
    'build built burn buy call came camp can care carry catch caught change chase cheer chew chop clap ' +
    'clean climb close come cook copy count cover crawl cried cross cry cut dance dare dig dive does done ' +
    'draw drawn dream dress drew drink drive drop dry dug eat eaten end enjoy enter fall feed feel fell ' +
    'felt fetch fill find fit fix flew float fly fold follow forget forgot found freeze fry gave get give ' +
    'given glow goes gone got grab grew grin grow grown guess hang happen hear heard held help hide hold ' +
    'hop hope hug hum hunt hurry jog join joke jump keep kept kick knew knit knock know known laid land ' +
    'last laugh lay lead lean learn leave led lend let lie lift like list listen live look lose lost love ' +
    'made make mark may meet melt met might miss mix move must need nod note obey open order owe pack ' +
    'paint pass pay peel pick plan plant play point pour pray press print pull push put race rain ran ' +
    'reach read relax rest ride ring rise roll rub run rush said sail sang sat save saw say see seen sell ' +
    'send sent set sew shake share shine shop shout show shut sing sink sit skate ski skip sleep slept ' +
    'slide slip smell smile snow sold solve sort speak spell spend spent spill spin split spoke stand ' +
    'start stay step stick stir stood stop study swam sweep swim swing take taken talk taste teach tell ' +
    'test thank think threw throw tidy tie told took touch train tried try turn type use used visit wait ' +
    'wake walk want warm wash watch wave wear went win wink wipe wish won wore work worry write wrote ' +
    'yawn yell ' +
    'able afraid alive alone angry asleep awake bad big black blue bold bored brave brief bright brown ' +
    'busy calm cheap clear cold cool cozy cute damp dark dear deep dirty dull easy empty equal extra fair ' +
    'false far fast fine first flat fond free fresh full funny fuzzy giant glad gold good grand gray great ' +
    'green grey happy hard heavy high hot huge humid icy kind large late lazy light little long loose loud ' +
    'lovely low lucky main messy mild minor moist near neat new next nice noisy odd old orange pale ' +
    'perfect pink plain polite poor proud pure purple quick quiet rare raw ready real red rich ripe rough ' +
    'round royal rude sad safe salty shiny short shy sick silly simple slow small smart smooth soft solid ' +
    'sour spare spicy steep sticky stiff still strong sunny super sure sweet tall tame tasty thick thin ' +
    'tiny tired tough true upset usual vast weak wet white whole wide wild windy wise wrong yellow young').split(' ')
};
const WHEEL_BONUS_DICT = {};

/** The everyday words above, folded, that the banks don't already have: a bonus only. */
function wheelBonusDictionary(lang) {
  if (WHEEL_BONUS_DICT[lang]) return WHEEL_BONUS_DICT[lang];
  const re = lang === 'en' ? /^[A-Z]{3,7}$/ : /^[ء-ي]{3,7}$/;
  const known = new Set(wheelDictionary(lang));
  const out = new Set();
  (WHEEL_BONUS_WORDS[lang] || []).forEach(w => { const f = wheelFold(w, lang); if (re.test(f) && !known.has(f)) out.add(f); });
  WHEEL_BONUS_DICT[lang] = [...out];
  return WHEEL_BONUS_DICT[lang];
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
    // The everyday words that fit join the bonus only (no dice used: a seeded board stays the same).
    const everyday = wheelBonusDictionary(lang).filter(w => wheelFitsIn(w, pool));
    return {
      letters: soloShuffle(base.split(''), rnd),
      words: layout.placed,
      bonus: ordered.filter(w => !inGrid.has(w)).concat(everyday),
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
    // The generator can come back empty: try again (the easy size last), never deal nothing.
    let made = null;
    for (let i = 0; !made && i < 12; i++) made = wheelMake(i < 8 ? WHEEL_RACE_LEVEL : 'easy', lang, rnd);
    if (!made) throw new Error('ماعرفناش نجهّز اللوحة، جرّبوا تاني');
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
