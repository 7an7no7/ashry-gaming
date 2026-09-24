/* ============================================================================
   المشنقة — HANGMAN in rooms
   ----------------------------------------------------------------------------
   Bundled into the Worker after RoomGames.js; the letters and the judging are
   Hangman.js, shared with the page.

   The owner's rules for a room (22 Sep 2026): two ways, the host's choice.
   "One writes, the rest guess" (the default): the writer types a word, a
   name or a film (up to three words, a hint if they like), and everyone else guesses it on their own board, each
   with their own man; the writer moves round the table. "A race": the app
   deals one word, with its category as the hint, and everyone races on their
   own board. A word ends when every guesser has solved it or been hanged, on
   the clock (off, 60 or 90 seconds: whoever hasn't solved it by then has
   failed), or when the host closes it. 3, 5 or 10 words make a game.
   Scoring: a solve is 10 plus a bonus by the order the solves came in (+5,
   +4 ... +1), in both ways (the owner, 24 Sep 2026: the first to get it gets
   the most); with a writer, the writer also scores 5 for every guesser who
   didn't. No computer players.

   What is hidden: the word (room._hm.word) until the word ends, and each
   board's letters, which reach their own phone only (room.secrets[pid]); the
   writer's phone gets the word. `shared.progress` is what the table may see
   of each board: how many of the word's letters it shows, how many misses,
   and whether it is solved or hanged - never which letters.

   shared:
     phase     'writing' | 'guessing' | 'result' | 'gameover'
     settings  { mode: 'setter' | 'race', rounds, clock }
     round     the word number (1..rounds) · rounds
     order     the writers' order (setter) · setter, setterName
     len       the word's letters · shape  each word's length, for the blanks
     alpha     'ar' | 'en' · cat  the hint: the race's category, or the writer's (optional)
     progress  { pid: { n, miss, state, at } } · solved  [pid, …] in order
     endsAt    the word's clock
     result    { word, cat, setter, setterName, setterPts, rows: [{ id, name, state, miss, pts }] }
     scores / board   the game's points, best first
   ========================================================================= */
const HM_GRACE_MS = 1500;
const HM_ROUNDS = [3, 5, 10];
const HM_CLOCKS = [0, 60, 90];
const HM_SOLVE_POINTS = 10;
const HM_SPEED_BONUS = [5, 4, 3, 2, 1];
const HM_SETTER_POINTS = 5;

const hmRoomOptions = (payload, prev) => {
  const p = payload || {};
  const was = prev || {};
  const mode = p.mode === 'race' || p.mode === 'setter' ? p.mode : (was.mode === 'race' ? 'race' : 'setter');
  const pickN = (list, v, w, dflt) => (list.indexOf(Number(v)) !== -1 ? Number(v) : (list.indexOf(Number(w)) !== -1 ? Number(w) : dflt));
  return {
    mode: mode,
    rounds: pickN(HM_ROUNDS, p.rounds, was.rounds, 5),
    clock: pickN(HM_CLOCKS, p.clock, was.clock, 0),
    lang: p.lang === 'en' ? 'en' : (p.lang === 'ar' ? 'ar' : (was.lang === 'en' ? 'en' : 'ar'))
  };
};

const hmHere = (room) => room.players.map(p => p.id);

/** Who guesses this word: everyone at the table but the writer. */
const hmGuessers = (room) => {
  const s = room.shared;
  return hmHere(room).filter(id => id !== s.setter);
};

/** Each board's letters to its own phone; the word to the writer's. */
const hmWriteSecrets = (room) => {
  const s = room.shared;
  const h = room._hm || {};
  room.secrets = {};
  if (s.phase !== 'guessing') return;
  Object.keys(h.boards || {}).forEach(pid => {
    const b = h.boards[pid];
    room.secrets[pid] = { g: b.g.slice(), miss: b.miss.slice(), state: b.state, pattern: hmPattern(h.word, b.g) };
  });
  if (s.setter && h.word) room.secrets[s.setter] = { word: h.word };
};

/** What the table sees of one board. */
const hmProgressOf = (word, b, at) => ({
  n: hmFound(hmPattern(word, b.g)),
  miss: b.miss.length,
  state: b.state,
  at: at
});

/** The word is out: every guesser gets a board, the clock starts. */
const hmBeginGuessing = (room, word, cat) => {
  const s = room.shared;
  const guessers = hmGuessers(room);
  room._hm = { word: word, boards: {} };
  s.progress = {};
  guessers.forEach(pid => { room._hm.boards[pid] = hmNewBoard(); s.progress[pid] = hmProgressOf(word, room._hm.boards[pid], null); });
  s.solved = [];
  s.len = hmLettersOf(word).length;
  s.shape = hmShape(word);
  s.alpha = hmAlphaOf(word);
  s.cat = cat || '';
  s.phase = 'guessing';
  s.roster = hmHere(room);
  s.endsAt = s.settings.clock ? Date.now() + s.settings.clock * 1000 : null;
  hmWriteSecrets(room);
};

/** The writer of this word: the next in the order who is still here (latecomers join the end). */
const hmNextSetter = (room) => {
  const s = room.shared;
  const here = hmHere(room);
  s.order = (s.order || []).filter(id => here.indexOf(id) !== -1);
  here.forEach(id => { if (s.order.indexOf(id) === -1) s.order.push(id); });
  if (!s.order.length) return null;
  s.setterAt = ((typeof s.setterAt === 'number' ? s.setterAt : -1) + 1) % s.order.length;
  return s.order[s.setterAt];
};

/** A new word: a writer to write one, or the app's for the race. */
const hmDeal = (room) => {
  const s = room.shared;
  s.result = null;
  s.progress = {};
  s.solved = [];
  s.endsAt = null;
  s.cat = '';
  s.len = 0;
  s.shape = [];
  room._hm = { word: '', boards: {} };
  if (s.settings.mode === 'race') {
    const pool = hmPool(s.settings.lang);
    if (!pool.length) throw new Error('مفيش كلمات');
    const pick = nextPrompt(room, pool, 'hangman_' + s.settings.lang);
    s.setter = null;
    s.setterName = '';
    hmBeginGuessing(room, pick.w, pick.c);
    return;
  }
  s.setter = hmNextSetter(room);
  s.setterName = roomPlayerName(room, s.setter);
  s.phase = 'writing';
  s.roster = hmHere(room);
  room.secrets = {};
};

/** Every guesser still here is done: solved or hanged. */
const hmAllDone = (room) => {
  const s = room.shared;
  const here = hmHere(room);
  return Object.keys(s.progress || {}).filter(id => here.indexOf(id) !== -1).every(id => s.progress[id].state !== 'play');
};

/** The word ends: whoever is still guessing has failed, and the points go on the board. */
const hmEndWord = (room) => {
  const s = room.shared;
  const h = room._hm || { boards: {} };
  if (s.phase !== 'guessing') return;
  const race = s.settings.mode === 'race';
  const here = hmHere(room);
  const rows = [];
  let failed = 0;
  Object.keys(h.boards).forEach(pid => {
    const b = h.boards[pid];
    if (b.state === 'play') b.state = 'lost';
    let pts = 0;
    if (b.state === 'won') {
      const at = s.solved.indexOf(pid);
      pts = HM_SOLVE_POINTS + (at !== -1 ? (HM_SPEED_BONUS[at] || 0) : 0);
    } else if (here.indexOf(pid) !== -1) {
      failed++;
    }
    if (pts) addScore(room, pid, pts);
    s.progress[pid] = hmProgressOf(h.word, b, s.solved.indexOf(pid) === -1 ? null : s.solved.indexOf(pid));
    if (here.indexOf(pid) !== -1) rows.push({ id: pid, name: roomPlayerName(room, pid), state: b.state, miss: b.miss.length, pts: pts });
  });
  let setterPts = 0;
  if (!race && s.setter && here.indexOf(s.setter) !== -1) {
    setterPts = failed * HM_SETTER_POINTS;
    if (setterPts) addScore(room, s.setter, setterPts);
  }
  rows.sort((a, b) => b.pts - a.pts);
  s.result = { word: h.word, cat: s.cat, setter: s.setter || null, setterName: s.setterName || '', setterPts: setterPts, rows: rows };
  s.endsAt = null;
  s.board = scoreboardOf(room);
  s.phase = s.round >= s.rounds ? 'gameover' : 'result';
  room.phase = s.phase === 'gameover' ? 'gameover' : 'play';
  room.secrets = {};
};

/** Room-level: fewer than two left means there is nobody to guess, or nobody to write for. */
const hmTooFew = (room) => room.players.length < 2;

const hmNewRoomGame = (room, playerId, payload, again) => {
  requireHost(room, playerId);
  if (hmTooFew(room)) throw new Error('المشنقة محتاجة لاعبين على الأقل');
  const prev = room.shared || {};
  const settings = hmRoomOptions(again ? prev.settings : payload, prev.settings);
  room.shared = {
    settings: settings,
    round: 1,
    rounds: settings.rounds,
    order: shuffled(hmHere(room)),
    setterAt: -1,
    scores: {},
    board: []
  };
  room.phase = 'play';
  hmDeal(room);
  room.shared.board = scoreboardOf(room);
};

const hangmanAction = (room, playerId, action, payload) => {
  const p = payload || {};
  if (action === 'start') { hmNewRoomGame(room, playerId, p, false); return; }
  const s = room.shared;
  if (!s || !s.settings) throw new Error('اللعبة لم تبدأ بعد');

  if (action === 'playAgain') {
    if (s.phase !== 'gameover') return;
    hmNewRoomGame(room, playerId, p, true);
    return;
  }

  if (action === 'setWord') {
    if (s.phase !== 'writing' || staleTap(p, 'round', s.round)) return;
    if (playerId !== s.setter) throw new Error('مش انت اللي بتكتب الكلمة دي');
    const problem = hmWordProblem(p.word);
    if (problem) throw new Error(problem === 'sentence' ? 'كلمة أو اسم لحد 3 كلمات بس، مش جملة' : 'اكتب كلمة أو اسم من 3 لـ 20 حرف، حروف بس');
    if (hmGuessers(room).length < 1) throw new Error('مفيش حد يخمّن');
    // The hint is the writer's choice: a few words above the boxes, or nothing.
    const hint = hmCleanHint(p.hint);
    if (hmHintProblem(hint, p.word)) throw new Error('التلميح فيه الكلمة نفسها');
    hmBeginGuessing(room, hmClean(p.word), hint);
    return;
  }

  if (action === 'guess' || action === 'whole') {
    if (s.phase !== 'guessing' || staleTap(p, 'round', s.round)) return;
    const h = room._hm;
    const b = h && h.boards[playerId];
    if (!b) throw new Error(playerId === s.setter ? 'انت اللي كاتب الكلمة' : 'انت بتتفرج الكلمة دي');
    const out = hmApply(b, h.word, action === 'whole' ? p.text : p.letter, action === 'whole');
    if (!out) return;
    if (out === 'won') s.solved.push(playerId);
    s.progress[playerId] = hmProgressOf(h.word, b, out === 'won' ? s.solved.length - 1 : (s.progress[playerId] || {}).at);
    if (hmAllDone(room)) { hmEndWord(room); return; }
    hmWriteSecrets(room);
    return;
  }

  if (action === 'closeWord') {
    requireHost(room, playerId);
    if (s.phase !== 'guessing' || staleTap(p, 'round', s.round)) return;
    hmEndWord(room);
    return;
  }

  if (action === 'skipTurn') {
    // The writer's phone went quiet: the next one writes this word.
    requireHost(room, playerId);
    if (s.phase !== 'writing' || staleTap(p, 'round', s.round)) return;
    hmDeal(room);
    return;
  }

  if (action === 'nextRound') {
    requireHost(room, playerId);
    if (s.phase !== 'result') return;
    if (hmTooFew(room)) throw new Error('المشنقة محتاجة لاعبين على الأقل');
    s.round++;
    room.phase = 'play';
    hmDeal(room);
    return;
  }

  throw new Error('إجراء غير معروف');
};

/* --- the clock ------------------------------------------------------------------ */

const hmDeadline = (room) => {
  const s = room.shared || {};
  return s.phase === 'guessing' && s.endsAt ? s.endsAt + HM_GRACE_MS : null;
};

const hmTimeout = (room, now) => {
  const s = room.shared || {};
  if (s.phase !== 'guessing' || !s.endsAt || now < s.endsAt + HM_GRACE_MS) return false;
  hmEndWord(room);
  return true;
};

/* --- someone leaves -------------------------------------------------------------
   A guesser's board goes with them, and the word may be over without them. A
   writer who leaves before writing hands the word to the next; after writing,
   the word plays on without their points. Fewer than two left ends the game.
   ------------------------------------------------------------------------------ */
const hmPlayerLeft = (room, playerId) => {
  const s = room.shared;
  if (!s || !s.settings || s.phase === 'gameover') return;
  // The next setter is counted from setterAt: someone leaving at or before it moves it back one,
  // or the next one in the order would be skipped (and the one before would set twice).
  const leftAt = (s.order || []).indexOf(playerId);
  if (leftAt !== -1 && typeof s.setterAt === 'number' && leftAt <= s.setterAt) s.setterAt -= 1;
  s.order = (s.order || []).filter(id => id !== playerId);
  if (s.phase === 'guessing' && room._hm && room._hm.boards[playerId]) {
    delete room._hm.boards[playerId];
    delete s.progress[playerId];
    s.solved = (s.solved || []).filter(id => id !== playerId);
  }
  if (hmTooFew(room)) {
    if (s.phase === 'guessing') hmEndWord(room);
    s.phase = 'gameover';
    room.phase = 'gameover';
    s.endsAt = null;
    s.board = scoreboardOf(room);
    room.secrets = {};
    return;
  }
  if (s.phase === 'writing' && s.setter === playerId) {
    // The one who left was up (setterAt has moved back one above): the next in the order writes.
    hmDeal(room);
    return;
  }
  if (s.phase === 'guessing') {
    if (hmAllDone(room)) { hmEndWord(room); return; }
    hmWriteSecrets(room);
  }
  s.board = scoreboardOf(room);
};
