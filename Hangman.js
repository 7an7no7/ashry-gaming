/* ============================================================================
   المشنقة — HANGMAN: the letters, the fold, a word, a guess
   ----------------------------------------------------------------------------
   One copy for both sides: the page inlines this file (two on one phone, and
   the keyboard of a room) and the rooms server bundles it (it keeps the word
   and judges every letter). No DOM, nothing that runs at load, and every
   top-level name starts with hm / HM_.

   The owner's rules (22 Sep 2026): a letter that is in the word shows every
   place it stands; one that isn't draws a piece of the man, and the sixth
   (HM_MISSES) finishes him. A whole word may be guessed at once, and a wrong
   one costs a piece like a wrong letter.

   What is guessed (the owner, 23 Sep 2026): one word, or the name of a
   famous person or a film - up to three words (HM_WORDS_MAX), never a
   sentence. It is shown exactly as it was typed, a box a letter and a gap
   between the words, so five letters are five boxes. Only the marks that are
   not letters (the diacritics, the tatweel) are dropped. The writer may add
   a hint, or not (hmCleanHint); a hint that spells the word out is refused.

   The fold works both ways (the owner, 23 Sep 2026): ا finds أ إ آ and أ
   finds ا; ه and ة, ي and ى, و and ؤ, ي and ئ the same, in a letter and in a
   whole word (hmFold). The keyboard has one key for each family. ء and ٱ go
   with ا, decided here.

   A word the app deals (a room's race, hmPool) comes from the app's big
   shared lists, never a small one of its own: every entry of the Chameleon
   boards that fits - a single word of 4 to 9 letters, or a name of two or
   three words (the actors, the footballers, the singers, the historical
   figures) - with its board's category as the hint, and the films of the
   emoji riddles (not their proverbs, which are sentences).
   ========================================================================= */
const HM_MISSES = 6;
const HM_LETTERS = {
  ar: ['ا', 'ب', 'ت', 'ث', 'ج', 'ح', 'خ', 'د', 'ذ', 'ر', 'ز', 'س', 'ش', 'ص', 'ض', 'ط', 'ظ', 'ع', 'غ', 'ف', 'ق', 'ك', 'ل', 'م', 'ن', 'ه', 'و', 'ي'],
  en: 'abcdefghijklmnopqrstuvwxyz'.split('')
};
const HM_WORDS_MAX = 3;           // a name or a title; more is a sentence
const HM_WRITE_MIN = 3;           // letters in all, for a written word
const HM_WRITE_MAX = 20;
const HM_WORD_MAX = 12;           // letters in any one word
const HM_DEAL_MIN = 4;            // a single word the race deals
const HM_DEAL_MAX = 9;
const HM_DEAL_NAME_MAX = 16;      // letters in a name or a title the race deals

const HM_FOLD = { 'أ': 'ا', 'إ': 'ا', 'آ': 'ا', 'ٱ': 'ا', 'ء': 'ا', 'ة': 'ه', 'ى': 'ي', 'ئ': 'ي', 'ؤ': 'و' };

/** The key a letter is typed on: both sides of a guess go through it, so أ and ا find each other. */
const hmFold = (ch) => {
  const c = String(ch || '');
  return HM_FOLD[c] || c.toLowerCase();
};

/** A word as it was typed, without what isn't a letter: the diacritics and the tatweel go, the spaces become single. */
// The diacritics U+064B-U+065F, the superscript alef U+0670 and the tatweel U+0640, built from their
// numbers: an editor that decodes escapes writes the marks themselves into the source (GEMINI.md, Traps).
const HM_MARKS = new RegExp('[' + String.fromCharCode(0x064B) + '-' + String.fromCharCode(0x065F) + String.fromCharCode(0x0670) + String.fromCharCode(0x0640) + ']', 'g');
const hmClean = (text) => String(text || '').replace(HM_MARKS, '').replace(/\s+/g, ' ').trim();

/** The letters of a word, without its spaces. */
const hmLettersOf = (word) => Array.from(hmClean(word)).filter(c => c !== ' ');

/** The length of each word, which is what the blanks show: [5] for مدرسة, [4, 4] for محمد صلاح. */
const hmShape = (word) => hmClean(word).split(' ').filter(Boolean).map(w => Array.from(w).length);

/** 'ar' or 'en' when every letter of the word is on that keyboard, else null. */
const hmAlphaOf = (word) => {
  const chars = hmLettersOf(word);
  if (!chars.length) return null;
  for (const lang of ['ar', 'en']) {
    if (chars.every(c => HM_LETTERS[lang].indexOf(hmFold(c)) !== -1)) return lang;
  }
  return null;
};

/** Why a written word can't be played, or '' when it can: up to three words, one alphabet, 3 to 20 letters. */
const hmWordProblem = (text) => {
  const w = hmClean(text);
  if (!w) return 'empty';
  const shape = hmShape(w);
  if (shape.length > HM_WORDS_MAX) return 'sentence';
  if (!hmAlphaOf(w)) return 'letters';
  const n = hmLettersOf(w).length;
  if (n < HM_WRITE_MIN) return 'short';
  if (n > HM_WRITE_MAX || shape.some(k => k > HM_WORD_MAX)) return 'long';
  return '';
};

/**
 * The writer's hint (the owner, 23 Sep 2026: optional): a few words the
 * guessers see above the boxes, or nothing. Cleaned like a word, at most
 * HM_HINT_MAX characters.
 */
const HM_HINT_MAX = 30;
const hmCleanHint = (text) => String(text || '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, HM_HINT_MAX);

/** Why a hint can't go with a word, or '': one that spells the word out gives it away. */
const hmHintProblem = (hint, word) => {
  const h = hmLettersOf(hint).map(hmFold).join('');
  const w = hmLettersOf(word).map(hmFold).join('');
  return h && w && h.indexOf(w) !== -1 ? 'word' : '';
};

/** What the race may deal from one list entry: a single word of 4 to 9 letters, or a name or a title of two or three words. */
const hmDealable = (raw, lang) => {
  const w = hmClean(raw);
  const shape = hmShape(w);
  if (!shape.length || shape.length > HM_WORDS_MAX || hmAlphaOf(w) !== lang) return '';
  const n = hmLettersOf(w).length;
  if (shape.length === 1) return n >= HM_DEAL_MIN && n <= HM_DEAL_MAX ? w : '';
  return n <= HM_DEAL_NAME_MAX && shape.every(k => k >= 2) ? w : '';
};

/**
 * A hint that hands over part of the answer: a word of the category that is a
 * word of the entry («أنواع جبنة» for «جبنة كريمي», «Cheeses» for «Cream
 * Cheese», «رمضان والعيد» for «صلاة العيد»). Compared on the keyboard's
 * letters, the article and a leading و off; one starting the other counts from
 * four letters (مجففة / مجفف, Breads / Bread).
 */
const hmHintGives = (hint, word) => {
  const key = (w) => {
    let k = hmLettersOf(w).map(hmFold).join('');
    if (k.length > 4 && k.indexOf('ال') === 0) k = k.slice(2);
    return k;
  };
  const words = (t) => hmClean(String(t || '').replace(/[^\p{L}\s]/gu, ' ')).split(' ').filter(Boolean);
  const hs = [];
  words(hint).forEach(w => {
    hs.push(key(w));
    if (w.length > 3 && w.charAt(0) === 'و') hs.push(key(w.slice(1)));
  });
  const hk = hs.filter(k => k.length >= 3);
  return words(word).map(key).filter(k => k.length >= 3).some(a => hk.some(b =>
    a === b || (Math.min(a.length, b.length) >= 4 && (a.indexOf(b) === 0 || b.indexOf(a) === 0))));
};

/**
 * The race's words in a language: [{ w, c }], `c` the hint. Every Chameleon
 * entry that fits, with its board's category, and the films of the emoji
 * riddles as "a film"; never one its hint gives away (hmHintGives).
 */
const hmPool = (lang) => {
  const out = [];
  const seen = {};
  const add = (raw, hint) => {
    const w = hmDealable(raw, lang);
    if (!w || hmHintGives(hint, w)) return;
    const key = hmLettersOf(w).map(hmFold).join('');
    if (seen[key]) return;
    seen[key] = true;
    out.push({ w: w, c: hint });
  };
  const boards = (typeof CHAMELEON_DB !== 'undefined' && CHAMELEON_DB[lang]) || [];
  boards.forEach(b => (b.words || []).forEach(raw => add(raw, b.category)));
  const riddles = (typeof EMOJI_RIDDLES !== 'undefined' && EMOJI_RIDDLES[lang]) || [];
  riddles.forEach(r => { if (/أفلام|movie|film/i.test(r.c || '')) add(r.a, r.c + ' 🎬'); });
  return out;
};

/** The word with only the guessed letters showing: a letter, '' for a blank, ' ' between two words. */
const hmPattern = (word, guessed) => Array.from(hmClean(word)).map(c => {
  if (c === ' ') return ' ';
  return (guessed || []).indexOf(hmFold(c)) !== -1 ? c : '';
});

/** How many of the word's letters a pattern shows (spaces are not letters). */
const hmFound = (pattern) => (pattern || []).filter(c => c !== '' && c !== ' ').length;

/** Every letter of the word has been guessed. */
const hmSolved = (word, guessed) => hmPattern(word, guessed).every(c => c !== '');

/** The same word, as the keyboard types it, with or without the spaces. */
const hmSameWord = (a, b) => hmLettersOf(a).map(hmFold).join('') === hmLettersOf(b).map(hmFold).join('');

/**
 * One guess on one board: { g: letters guessed, miss: wrong letters and words,
 * state: 'play' | 'won' | 'lost' }, changed in place. `guess` is a letter, or
 * a whole word when `whole`. Returns 'hit', 'miss', 'won', 'lost', or '' when
 * it was nothing (a letter already tried, not on the keyboard, a board that
 * is over).
 */
const hmApply = (board, word, guess, whole) => {
  if (!board || board.state !== 'play') return '';
  const alpha = hmAlphaOf(word);
  if (whole) {
    // No guess is longer than the longest word that can be written (the field says 28 too).
    const text = hmClean(String(guess || '').slice(0, 64));
    if (!text) return '';
    // One letter typed in the word's box is that letter, not a wrong word.
    if (hmLettersOf(text).length === 1) return hmApply(board, word, text, false);
    if (hmSameWord(text, word)) {
      hmLettersOf(word).forEach(c => { const k = hmFold(c); if (board.g.indexOf(k) === -1) board.g.push(k); });
      board.state = 'won';
      return 'won';
    }
    if (board.miss.some(m => Array.from(m).length > 1 && hmSameWord(m, text))) return '';
    board.miss.push(text);
  } else {
    const k = hmFold(Array.from(String(guess || '').trim())[0] || '');
    if (!k || HM_LETTERS[alpha].indexOf(k) === -1) return '';
    if (board.g.indexOf(k) !== -1 || board.miss.indexOf(k) !== -1) return '';
    if (hmLettersOf(word).some(c => hmFold(c) === k)) {
      board.g.push(k);
      if (hmSolved(word, board.g)) { board.state = 'won'; return 'won'; }
      return 'hit';
    }
    board.miss.push(k);
  }
  if (board.miss.length >= HM_MISSES) { board.state = 'lost'; return 'lost'; }
  return 'miss';
};

/** A fresh board to guess on. */
const hmNewBoard = () => ({ g: [], miss: [], state: 'play' });
