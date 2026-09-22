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
   one costs a piece like a wrong letter. In Arabic the keyboard has one key
   a letter: ا opens أ إ آ, ه opens ة, ي opens ى - and, decided here, ء ؤ ئ
   and ٱ go with ا, و and ي the same way (hmFold). The word is always shown
   as it is spelt.

   A word the app deals (a room's race) is a single word of 4 to 9 letters
   from the Chameleon boards, with its category as the hint (hmPool): the
   app's big shared list, never a small one of its own. A word a player
   writes is any single word of 3 to 12 letters in one alphabet.
   ========================================================================= */
const HM_MISSES = 6;
const HM_LETTERS = {
  ar: ['ا', 'ب', 'ت', 'ث', 'ج', 'ح', 'خ', 'د', 'ذ', 'ر', 'ز', 'س', 'ش', 'ص', 'ض', 'ط', 'ظ', 'ع', 'غ', 'ف', 'ق', 'ك', 'ل', 'م', 'ن', 'ه', 'و', 'ي'],
  en: 'abcdefghijklmnopqrstuvwxyz'.split('')
};
const HM_WRITE_MIN = 3;
const HM_WRITE_MAX = 12;
const HM_DEAL_MIN = 4;
const HM_DEAL_MAX = 9;

const HM_FOLD = { 'أ': 'ا', 'إ': 'ا', 'آ': 'ا', 'ٱ': 'ا', 'ء': 'ا', 'ة': 'ه', 'ى': 'ي', 'ئ': 'ي', 'ؤ': 'و' };

/** The key a letter is typed on. */
const hmFold = (ch) => {
  const c = String(ch || '');
  return HM_FOLD[c] || c.toLowerCase();
};

/** A word as it is spelt, without the marks: diacritics and the tatweel go, spaces round it too. */
const hmClean = (text) => String(text || '').replace(/[ً-ٰٟـ]/g, '').trim();

/** 'ar' or 'en' when every letter of the word is on that keyboard, else null. */
const hmAlphaOf = (word) => {
  const chars = Array.from(hmClean(word));
  if (!chars.length) return null;
  for (const lang of ['ar', 'en']) {
    if (chars.every(c => HM_LETTERS[lang].indexOf(hmFold(c)) !== -1)) return lang;
  }
  return null;
};

/** Why a written word can't be played, or '' when it can: one word, one alphabet, 3 to 12 letters. */
const hmWordProblem = (text) => {
  const w = hmClean(text);
  if (!w) return 'empty';
  if (/\s/.test(w)) return 'space';
  if (!hmAlphaOf(w)) return 'letters';
  const n = Array.from(w).length;
  if (n < HM_WRITE_MIN) return 'short';
  if (n > HM_WRITE_MAX) return 'long';
  return '';
};

/** The words a room's race deals in a language: [{ w, c }], single words of 4 to 9 letters with their category. */
const hmPool = (lang) => {
  const out = [];
  const seen = {};
  const boards = (typeof CHAMELEON_DB !== 'undefined' && CHAMELEON_DB[lang]) || [];
  boards.forEach(b => {
    (b.words || []).forEach(raw => {
      const w = hmClean(raw);
      const n = Array.from(w).length;
      if (/\s/.test(w) || n < HM_DEAL_MIN || n > HM_DEAL_MAX || hmAlphaOf(w) !== lang) return;
      const key = Array.from(w).map(hmFold).join('');
      if (seen[key]) return;
      seen[key] = true;
      out.push({ w: w, c: b.category });
    });
  });
  return out;
};

/** The word with only the guessed letters showing: a letter, or '' for a blank. */
const hmPattern = (word, guessed) => Array.from(hmClean(word)).map(c => ((guessed || []).indexOf(hmFold(c)) !== -1 ? c : ''));

/** Every letter of the word has been guessed. */
const hmSolved = (word, guessed) => hmPattern(word, guessed).every(c => c !== '');

/** The same word, as the keyboard types it. */
const hmSameWord = (a, b) => Array.from(hmClean(a)).map(hmFold).join('') === Array.from(hmClean(b)).map(hmFold).join('');

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
    const text = hmClean(guess);
    if (!text || /\s/.test(text)) return '';
    if (hmSameWord(text, word)) {
      Array.from(hmClean(word)).forEach(c => { const k = hmFold(c); if (board.g.indexOf(k) === -1) board.g.push(k); });
      board.state = 'won';
      return 'won';
    }
    if (board.miss.some(m => m.length > 1 && hmSameWord(m, text))) return '';
    board.miss.push(text);
  } else {
    const k = hmFold(Array.from(String(guess || ''))[0] || '');
    if (!k || HM_LETTERS[alpha].indexOf(k) === -1) return '';
    if (board.g.indexOf(k) !== -1 || board.miss.indexOf(k) !== -1) return '';
    if (Array.from(hmClean(word)).some(c => hmFold(c) === k)) {
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
