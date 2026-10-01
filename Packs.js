/* ============================================================================
   «اعمل مسابقتك» and «كلماتنا»: what the family writes itself (30 Sep 2026).

   A pack is either a quiz (kind 'quiz': a title, an emoji and up to 60
   questions, each four choices with one right) or the family word pack (kind
   'words': a title and up to 300 words, names and inside jokes). It is kept on
   the rooms server under a 6-character code (PackStore, rooms-worker/src/
   packs.js) and on the phones that wrote or opened it (JS_PackStore.html).

   This file is the one rule for what a pack may hold. The page checks with it
   before saving (so a mistake is shown on the question it is in) and the
   server checks with it again before keeping anything (never trusting the
   phone). Shared by the page (the shell's lists) and the rooms server
   (bundled by rooms-worker/build.mjs). No DOM, no network.

   packCleanQuiz(raw)  -> { pack } or { error, at }   (at: the question's index)
   packCleanWords(raw) -> { pack } or { error }
   A clean quiz:  { title, emoji, questions: [{ q, e, c: [4 strings], a: 0..3 }] }
   A clean words: { title, words: [string] }
   Errors are codes (the page words them: pk_err_<code> in TRANSLATIONS).
   ========================================================================= */
// No O/0/I/1, like the room codes; six letters, so a pack code is never a room's (four).
const PACK_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const PACK_CODE_LEN = 6;
const PACK_CODE_RE = /^[A-HJ-NP-Z2-9]{6}$/;
const PACK_LIMITS = {
  title: 40,        // a pack's name
  questions: 60,    // questions in a quiz
  q: 140,           // one question
  choice: 60,       // one choice
  emoji: 16,        // a question's emoji (one emoji, a flag or a family is several code units)
  words: 300,       // words in a word pack
  word: 40,         // one word, name or inside joke
  minWords: 6       // a word pack worth offering as a category
};
// A pack not played (nor saved) for a year is deleted (the owner, 30 Sep 2026).
const PACK_TTL_MS = 365 * 24 * 60 * 60 * 1000;

/** A code as typed: capitals, spaces and dashes out, 0/O and 1/I read as the letters we use. */
const packCode = (raw) => String(raw || '').toUpperCase().replace(/[\s-]/g, '').slice(0, 12);

/** One line of text: control characters out, spaces folded, cut to `max`. */
const packText = (raw, max) => String(raw === undefined || raw === null ? '' : raw)
  .replace(/[\u0000-\u001f\u007f\u200b\u2028\u2029]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim()
  .slice(0, max);

/** A choice compared with the others: case, marks, hamza forms and spaces folded. */
const packFold = (raw) => packText(raw, 200).toLowerCase()
  .replace(/[\u064b-\u065f\u0670\u0640]/g, '')
  .replace(/[أإآٱ]/g, 'ا')
  .replace(/ة/g, 'ه')
  .replace(/ى/g, 'ي')
  .replace(/\s+/g, '');

/** An emoji field: a short piece of text with no letters or digits in it (text and emoji only, no photos). */
const packEmoji = (raw) => {
  const e = packText(raw, PACK_LIMITS.emoji);
  if (!e) return '';
  // Letters of any script and digits are not an emoji; a keycap (1️⃣) is kept.
  return /[\p{L}]/u.test(e) || /^[0-9]+$/.test(e) ? '' : e;
};

/**
 * `blind`: a quiz as a phone without its edit key holds it (packHideAnswers): a question with
 * no right choice keeps a: -1 instead of failing. Only the page passes it (the team board);
 * the server always asks for every answer.
 */
function packCleanQuiz(raw, blind) {
  const src = raw && typeof raw === 'object' ? raw : {};
  const title = packText(src.title, PACK_LIMITS.title);
  if (!title) return { error: 'title' };
  const list = Array.isArray(src.questions) ? src.questions : [];
  if (!list.length) return { error: 'no_questions' };
  if (list.length > PACK_LIMITS.questions) return { error: 'too_many' };
  const questions = [];
  for (let i = 0; i < list.length; i++) {
    const item = list[i] && typeof list[i] === 'object' ? list[i] : {};
    const q = packText(item.q, PACK_LIMITS.q);
    if (!q) return { error: 'q_empty', at: i };
    const given = Array.isArray(item.c) ? item.c : [];
    if (given.length !== 4) return { error: 'choices_four', at: i };
    const c = given.map((x) => packText(x, PACK_LIMITS.choice));
    if (c.some((x) => !x)) return { error: 'choice_empty', at: i };
    const folded = c.map(packFold);
    if (new Set(folded).size !== 4) return { error: 'choices_same', at: i };
    let a = Number(item.a);
    if (!(a >= 0 && a <= 3 && a === Math.floor(a))) {
      if (!blind) return { error: 'no_right', at: i };
      a = -1;
    }
    questions.push({ q, e: packEmoji(item.e), c, a });
  }
  return { pack: { title, emoji: packEmoji(src.emoji), questions } };
}

/**
 * A quiz as a phone without its edit key gets it (/pack/get, the review of 1 Oct 2026): every
 * question and its four choices, no right one (a: -1) - so a crew's members can't read the
 * answers before the night. A room deals the quiz on the server; the team board asks for each
 * question's answer as it is played (/pack/answer, packAnswerOf).
 */
const packHideAnswers = (pack) => Object.assign({}, pack, {
  questions: ((pack && pack.questions) || []).map((x) => ({ q: x.q, e: x.e || '', c: (x.c || []).slice(), a: -1 }))
});

/** Question `i`'s right choice when its text is still `q` (else the one question with that text): 0..3, or -1. */
const packAnswerOf = (pack, i, q) => {
  const list = (pack && pack.questions) || [];
  const text = packText(q, PACK_LIMITS.q);
  if (!text) return -1;
  const at = list[i] && list[i].q === text ? list[i] : list.find((x) => x.q === text);
  return at && at.a >= 0 && at.a <= 3 ? at.a : -1;
};

function packCleanWords(raw) {
  const src = raw && typeof raw === 'object' ? raw : {};
  const title = packText(src.title, PACK_LIMITS.title);
  if (!title) return { error: 'title' };
  const list = Array.isArray(src.words) ? src.words : [];
  const seen = new Set();
  const words = [];
  for (const w of list) {
    const word = packText(w, PACK_LIMITS.word);
    const f = packFold(word);
    if (!word || !f || seen.has(f)) continue;   // an empty line or a word written twice: dropped quietly
    seen.add(f);
    words.push(word);
  }
  if (words.length > PACK_LIMITS.words) return { error: 'too_many_words' };
  if (words.length < PACK_LIMITS.minWords) return { error: 'few_words' };
  return { pack: { title, words } };
}

/** Either kind, by its name: { pack } or { error, at }. */
function packClean(kind, raw) {
  if (kind === 'quiz') return packCleanQuiz(raw);
  if (kind === 'words') return packCleanWords(raw);
  return { error: 'kind' };
}
