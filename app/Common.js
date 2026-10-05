/* ============================================================================
   What the phone and the rooms server both run (5 Oct 2026)
   ----------------------------------------------------------------------------
   One copy, loaded by both sides: on the page it is a shared list in the shell
   (SHARED_LISTS and SHELL_LISTS in tools/lazy-split.mjs), on the server the
   first of FILES in rooms-worker/build.mjs. Each of these used to be written
   twice - the phone's copy and the server's - with a comment asking whoever
   came next to keep the two in step.

   Only values and pure functions: nothing here may read the page (document,
   appState, Room) or change a room. A game's own shared code goes in its
   folder's shared file (Chess4.js, games/duels/Duels.js); this file is for
   what several games, or the whole app, need on both sides.
   ========================================================================== */

/* --- One fold for typed text (GEMINI.md, *One fold for typed text*) -------- */

/**
 * The letters people spell the same word with: أسد and اسد, مكتبة and مكتبه,
 * مصطفى and مصطفي, with or without diacritics or a tatweel. Every comparison
 * of typed text goes through this.
 */
const foldArabicLetters = (text) => String(text || '').toLowerCase()
  .replace(/[\u064B-\u0652\u0670\u0640]/g, '')
  .replace(/[أإآٱ]/g, 'ا').replace(/ة/g, 'ه').replace(/[ىی]/g, 'ي')
  .replace(/ؤ/g, 'و').replace(/ئ/g, 'ي').replace(/ک/g, 'ك');

/**
 * One typed word against another: a Just One clue against the others, a
 * Codenames clue against the board, a Fibbage lie against the truth, a
 * Draw & Guess or Fake Artist guess against the word. Spelling, punctuation,
 * spaces and a leading "ال" or "the" are all folded away, so الأسد, أسد and
 * اسد are one word. The page calls it foldWord (JS_Core.html). (Stop the Bus
 * has its own fold, foldStopAnswer: there the first letter matters.)
 */
const normaliseClue = (text) => {
  let out = foldArabicLetters(text)
    .replace(/[^\p{L}\p{N} ]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (out.indexOf('the ') === 0) out = out.slice(4);
  // Twice, because "الألعاب" folds to "الالعاب" and has to meet "ألعاب" and "العاب".
  for (let i = 0; i < 2 && out.length > 3 && out.indexOf('ال') === 0; i++) out = out.slice(2);
  return out.replace(/\s+/g, '');
};

/* --- Rooms: values the phone shows and the server enforces ------------------ */

const TRIVIA_COUNTS = [5, 10, 15, 20];           // تحدي المعلومات: the questions the host can pick
const CODENAMES_TIMERS = [0, 60, 90, 120, 180];  // أسماء الرموز: the clue clock's choices, in seconds (0: none)
const BZ_SETTLE_MS = 150;                        // الجرس: a press settles this long after it arrived
const DUEL_AWAY_MS = 60000;                      // the duels: the seat to move loses after this long away

/**
 * Is the room's game over? The audience's «مين هيكسب؟» closes on it on the
 * phone (audienceGameOver) and the server refuses a late pick with it. A game
 * of one round (الجاسوس, الحرباء, الموقع السري, الفنان المزيف) ends on its
 * result; every other game on 'gameover' / 'over'. `r` is a room on the server
 * or a phone's state: both carry game, phase and shared.
 */
const AUDIENCE_ONE_ROUND = { imposter: true, chameleon: true, spyfall: true, fakeartist: true };
function roomGameIsOver(r) {
  const s = r.shared || {};
  const phases = [r.phase, s.phase];
  if (phases.some(p => p === 'gameover' || p === 'over')) return true;
  if (s.tour && s.tour.phase === 'over') return true;
  return !!AUDIENCE_ONE_ROUND[r.game] && phases.some(p => p === 'result' || p === 'results');
}

/**
 * Who would play if the game started now, in a lobby with seats (لودو, السلم
 * والتعبان, بنك الحظ): the seats the host set, less anyone gone, topped up from
 * the room in order (not the benched), up to `max`; with no seats set, the
 * first `max` in the room.
 */
function lobbySeatedOf(players, lobby, max) {
  const ids = (players || []).map(p => p.id);
  lobby = lobby || {};
  if (Array.isArray(lobby.seated)) {
    const kept = lobby.seated.filter(id => ids.indexOf(id) !== -1);
    // Someone left and a seat is free: the next in the room sits down.
    ids.forEach(id => { if (kept.length < max && kept.indexOf(id) === -1 && (lobby.benched || []).indexOf(id) === -1) kept.push(id); });
    return kept.slice(0, max);
  }
  return ids.slice(0, max);
}
