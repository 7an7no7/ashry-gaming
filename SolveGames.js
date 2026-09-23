/* ============================================================================
   ONE SETS, EVERYONE SOLVES — the rules of the four games on the engine
   ----------------------------------------------------------------------------
   One copy for both sides: the page inlines this file (a setter's form checks
   what it will send, a solver's keyboard and search box) and the rooms server
   bundles it (RoomSolve.js keeps the secret and judges every guess with it).
   No DOM, nothing that runs at load, and every top-level name starts with
   sv / SV_.

   The owner's decisions (23 Sep 2026): the room way of المشنقة - one sets a
   secret, everyone else solves it on their own phone, the setter moving round
   the table, or a race on the app's pick - as an engine, and four games on it:
   خمن الكلمة (Wordle), خمّن الرقم, خمّن الدولة and فوازير إيموجي written by a
   player. What each game adds is here: what a setter may send, what a guess
   is, and how it is answered. The engine itself is RoomSolve.js.

   The lists are the app's own (GEMINI.md, *Decided, and why*): Wordle deals
   from WORDLE_DB (WordleWords.js), the countries are COUNTRIES (Countries.js),
   the race's riddles EMOJI_RIDDLES (EmojiRiddles.js).
   ========================================================================= */

const SV_KINDS = ['wordle', 'guessnum', 'flags', 'emoji'];
const SV_ROUNDS = [3, 5, 10];
// The clock of one secret, per game (the owner: off by default, "60 or 90 like
// Hangman, sensible per game"): five letters six times over takes longer than a number.
const SV_CLOCKS = { wordle: [0, 90, 120], guessnum: [0, 60, 90], flags: [0, 60, 90], emoji: [0, 60, 90] };

// The Arabic marks that are not letters (the diacritics U+064B-U+065F, the
// superscript alef U+0670, the tatweel U+0640), built from their numbers: an
// editor that decodes escapes writes the marks themselves (GEMINI.md, Traps).
const SV_CH = (n) => String.fromCodePoint(n);
const SV_MARKS = new RegExp('[' + SV_CH(0x064B) + '-' + SV_CH(0x065F) + SV_CH(0x0670) + SV_CH(0x0640) + ']', 'g');

/** Typed text without control characters and marks, the spaces single. */
const svClean = (text) => Array.from(String(text || '')).filter(ch => ch.charCodeAt(0) >= 32 && ch.charCodeAt(0) !== 127).join('')
  .replace(SV_MARKS, '').replace(/\s+/g, ' ').trim();

/* --- خمن الكلمة ----------------------------------------------------------------
   A written word is 5 to 8 letters (the lengths the one-phone game plays),
   all on one keypad (WORDLE_LAYOUTS: the alphabet a word may use). No
   dictionary: a word the keypad can type is a word the table can guess, the
   one-phone game takes any guess too, and a list would refuse names and
   dialect. أ إ آ ٱ are typed as ا, as the one-phone game deals them.
   ------------------------------------------------------------------------------ */
const SV_WORDLE_LENGTHS = [5, 6, 7, 8];

/** A word as the keypad types it: marks off, أ إ آ ٱ as ا, English in capitals, no spaces. */
const svWordleFold = (text) => svClean(text).replace(/[أإآٱ]/g, 'ا').replace(/ /g, '').toUpperCase();

const svWordleKeys = (lang) => (typeof WORDLE_LAYOUTS !== 'undefined' && WORDLE_LAYOUTS[lang] ? WORDLE_LAYOUTS[lang].join('') : '');

/** 'ar' or 'en' when every letter of a folded word is on that keypad, else null. */
const svWordleAlpha = (folded) => {
  const chars = Array.from(String(folded || ''));
  if (!chars.length) return null;
  for (const lang of ['ar', 'en']) {
    const keys = svWordleKeys(lang);
    if (chars.every(c => keys.indexOf(c) !== -1)) return lang;
  }
  return null;
};

/** Why a written word can't be played, or '': 'empty', 'letters' (not one keypad) or 'length' (not 5 to 8). */
const svWordleProblem = (text) => {
  const w = svWordleFold(text);
  if (!w) return 'empty';
  if (!svWordleAlpha(w)) return 'letters';
  return SV_WORDLE_LENGTHS.indexOf(Array.from(w).length) === -1 ? 'length' : '';
};

/** The tries a word gets, as on one phone: 6, or 7 for a word of 7 or 8. */
const svWordleTries = (len) => (len > 6 ? 7 : 6);

/**
 * The colours of one guess, a letter each: c (right place), p (in the word,
 * another place), a (not in it). A repeated letter is only yellow as often as
 * the word holds it: the greens are taken first, then each yellow uses up
 * one of the letters left.
 */
const svWordleColours = (guess, target) => {
  const g = Array.from(guess), t = Array.from(target);
  const out = g.map(() => 'a');
  const left = t.slice();
  g.forEach((ch, i) => { if (ch === t[i]) { out[i] = 'c'; left[i] = null; } });
  g.forEach((ch, i) => {
    if (out[i] === 'c') return;
    const k = left.indexOf(ch);
    if (k !== -1) { out[i] = 'p'; left[k] = null; }
  });
  return out.join('');
};

/* --- خمّن الرقم -----------------------------------------------------------------
   The host picks the range, 1 to 50, 100 (the default) or 1000; the setter a
   number in it. A solver has two more tries than halving always needs, so a
   careless guess can cost the number, and a setter's points mean something.
   ------------------------------------------------------------------------------ */
const SV_NUM_RANGES = [50, 100, 1000];
const svNumTries = (max) => Math.ceil(Math.log2(max)) + 2;     // 8, 9, 12
const svNumProblem = (n, max) => (Number.isInteger(n) && n >= 1 && n <= max ? '' : 'range');
/** 'right', or which way to go: 'higher' when the number is bigger than the guess, 'lower' when smaller. */
const svNumVerdict = (guess, target) => (guess === target ? 'right' : (guess < target ? 'higher' : 'lower'));

/* --- خمّن الدولة -----------------------------------------------------------------
   From the flag (6 guesses) or by distance (8), the host's choice, like the
   one-phone game. The race asks the well-known countries (tier 1) or any, the
   host's choice again; a setter may pick any country on the table.
   ------------------------------------------------------------------------------ */
const SV_FLAG_WAYS = ['flag', 'far'];
const SV_FLAG_LEVELS = ['easy', 'hard'];
const svCountryPool = (level) => COUNTRIES.filter(c => (level === 'hard' ? true : c.tier === 1));
/** After how many misses the continent shows, then the first letter (the one-phone game's numbers). */
const svFlagHintsAt = (clue) => (clue === 'far' ? { cont: 4, letter: 6 } : { cont: 3, letter: 5 });
const svCountryLetter = (c, lang) => flagName(c, lang).replace(/^ال/, '').charAt(0);

/* --- فوازير إيموجي ---------------------------------------------------------------
   A player writes the answer (a film, a proverb, a dish, a place or a thing,
   a chip) and its clue in emoji only. A clue with a letter in it is refused,
   and so is one whose letter emoji (🇪🇬 is the letters E and G, 🅰️, 🆗)
   spell the answer out. Guesses are typed and judged the way the table hears
   them (guessVerdict in RoomGames.js: right, or close), six tries.
   ------------------------------------------------------------------------------ */
const SV_EMOJI_KINDS = ['film', 'proverb', 'dish', 'place', 'thing'];
const SV_EMOJI_TRIES = 6;
const SV_EMOJI_CLUE_MAX = 40;        // characters (an emoji is two or more)
const SV_EMOJI_ANSWER_MAX = 50;
const SV_EMOJI_WORDS_MAX = 8;        // a proverb is a sentence; a paragraph isn't
const SV_EMOJI_GUESS_MAX = 60;

const SV_JOINERS = new RegExp('[' + SV_CH(0x200D) + SV_CH(0xFE0E) + SV_CH(0xFE0F) + SV_CH(0x20E3) + SV_CH(0xE0020) + '-' + SV_CH(0xE007F) + ']', 'gu');
const SV_KEYCAP = new RegExp('[0-9#*]' + SV_CH(0xFE0F) + '?' + SV_CH(0x20E3), 'gu');
const SV_PICTOS = /\p{Extended_Pictographic}|\p{Regional_Indicator}|\p{Emoji_Modifier}/gu;

/** What is left of a clue once every emoji is taken out: '' for a clue of emoji only. */
const svEmojiRest = (clue) => String(clue || '').replace(SV_KEYCAP, '').replace(SV_PICTOS, '').replace(SV_JOINERS, '').replace(/\s+/g, '');

// The emoji that are letters: the flags' regional indicators, the boxed and
// circled capitals, the keycap digits, and the word buttons (🆗 🆕 🆒 …).
const SV_EMOJI_WORDS = {
  0x1F18E: 'ab', 0x1F191: 'cl', 0x1F192: 'cool', 0x1F193: 'free', 0x1F194: 'id', 0x1F195: 'new', 0x1F196: 'ng',
  0x1F197: 'ok', 0x1F198: 'sos', 0x1F199: 'up', 0x1F19A: 'vs', 0x1F519: 'back', 0x1F51A: 'end', 0x1F51B: 'on',
  0x1F51C: 'soon', 0x1F51D: 'top'
};
const svEmojiLetters = (clue) => {
  let out = '';
  for (const ch of String(clue || '')) {
    const n = ch.codePointAt(0);
    const from = [0x1F1E6, 0x1F130, 0x1F150, 0x1F170].find(b => n >= b && n <= b + 25);
    if (from) out += String.fromCharCode(97 + n - from);
    else if (SV_EMOJI_WORDS[n]) out += SV_EMOJI_WORDS[n];
    else if (/[0-9]/.test(ch)) out += ch;
  }
  return out;
};

/** Why an answer can't be played, or '': 'empty', 'long' (over 50 characters or 8 words), 'short' (under two letters). */
const svEmojiAnswerProblem = (text) => {
  const a = svClean(text);
  if (!a) return 'empty';
  if (a.length > SV_EMOJI_ANSWER_MAX || a.split(' ').length > SV_EMOJI_WORDS_MAX) return 'long';
  return Array.from(a).filter(ch => /\p{L}/u.test(ch)).length < 2 ? 'short' : '';
};

/** Why a clue can't go with an answer, or '': 'empty', 'long', 'letters' (not emoji only), 'spells' (its letter emoji spell the answer). */
const svEmojiClueProblem = (clue, answer) => {
  const c = String(clue || '').trim();
  if (!c) return 'empty';
  if (c.length > SV_EMOJI_CLUE_MAX) return 'long';
  if (svEmojiRest(c)) return 'letters';
  const letters = svEmojiLetters(c);
  if (!letters) return '';
  const words = svClean(answer).toLowerCase().normalize('NFD').replace(/[^a-z0-9 ]/g, ' ').split(/\s+/)
    .filter(w => w.length >= 3 && ['the', 'and', 'of'].indexOf(w) === -1);
  const whole = words.join('');
  return (whole.length >= 3 && letters.indexOf(whole) !== -1) || words.some(w => letters.indexOf(w) !== -1) ? 'spells' : '';
};
