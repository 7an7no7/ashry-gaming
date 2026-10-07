// Bundled into the rooms server after RoomGames.js (FILES in rooms-worker/build.mjs), whose helpers it uses.
/* ==========================================================================
   الجرس — THE BUZZER
   The host asks questions out loud; every phone is a buzzer. "Who was first"
   is settled here and nowhere else. Nothing is secret: the order, the
   verdicts and the scores are all in shared, and the TV shows them.

   The order is by when each phone was pressed, not when its press arrived
   (the owner, 1 Oct 2026 - it was arrival order, and a phone on a slower
   network lost a press it had won). A phone sends its press time read on the
   server's clock ({ at }, JS_RoomBuzzer.html); the server believes it only
   between its arrival less BZ_CLAIM_MAX_MS and its arrival, so a phone can't
   claim a press it never made. A press may still go ahead of one that
   arrived up to BZ_SETTLE_MS before it, never of one settled longer ago
   (the host has seen that order). A phone on an older page sends no time:
   its arrival is its press. Each buzz keeps `at` (its press, which the gaps
   on the screens read) and `arr` (its arrival, when it settles).
   ========================================================================== */
// BZ_SETTLE_MS (a press settles this long after it arrived) is in rooms/RoomShared.js, read by the phones too.
const BZ_CLAIM_MAX_MS = 400;    // a phone's press time is believed at most this long before its arrival

/** Where a press goes in the line: ahead of every unsettled press it beat, behind the rest. */
const buzzerInsert = (buzzes, entry) => {
  let i = buzzes.length;
  while (i > 0) {
    const prev = buzzes[i - 1];
    const prevArr = Number(prev.arr) || Number(prev.at) || 0;
    if (entry.arr - prevArr > BZ_SETTLE_MS || !(Number(prev.at) > entry.at)) break;
    i--;
  }
  buzzes.splice(i, 0, entry);
};

/** The press time a phone claims, held between its arrival less the allowance and its arrival. */
const buzzerPressAt = (payload, arr) => {
  const claim = Number(payload && payload.at);
  if (!isFinite(claim) || claim <= 0) return arr;
  return Math.round(Math.min(arr, Math.max(arr - BZ_CLAIM_MAX_MS, claim)));
};
const buzzerAction = (room, playerId, action, payload) => {
  if (action === 'start') {
    requireHost(room, playerId);
    if (room.players.length < 2) throw new Error('تحتاج لاعبين على الأقل');
    room.secrets = {};
    room.shared = { round: 1, phase: 'armed', buzzes: [], out: [], scores: {}, last: null, roster: room.players.map(p => p.id) };
    buzzerQuizDeal(room, 0);
    buzzerQuizSync(room);
    room.shared.board = scoreboardOf(room);
    room.phase = 'playing';
    return;
  }

  const s = room.shared;
  if (!s || room.phase !== 'playing') throw new Error('اللعبة لم تبدأ بعد');
  try { buzzerQuizMove(room, playerId, action, payload); } finally { buzzerQuizSync(room); }
};

/* «اعمل مسابقتك» on the buzzer: the host reads the family's question out loud,
   every phone sees it and its four choices, and the right one is on the host's
   phone only (room.secrets[host].answer; a TV host gets none - the TV is the
   table's screen - and shows it with «اكشف الإجابة»). A right answer (the host's
   ✅) or the host's reveal shows it to everyone and locks the buzzers until
   «السؤال التالي». The questions: room._bzDeck, choices shuffled at the deal.
   shared.quiz never carries the pack's code: /pack/get answers a code with every answer. */
const buzzerQuizDeal = (room, idx) => {
  const s = room.shared;
  const quiz = roomPackQuiz(room);
  if (!quiz) { delete s.quiz; room._bzDeck = null; return; }
  if (idx === 0 || !room._bzDeck) room._bzDeck = roomPackDeck(quiz);
  const q = room._bzDeck[idx];
  if (!q) {
    s.quiz = { title: quiz.pack.title, emoji: quiz.pack.emoji || '', n: room._bzDeck.length, total: room._bzDeck.length, done: true };
    s.phase = 'locked';
    s.buzzes = [];
    return;
  }
  s.quiz = { title: quiz.pack.title, emoji: quiz.pack.emoji || '', n: idx, total: room._bzDeck.length, q: q.q, choices: q.choices, answer: null, done: false };
};

/** The right choice on the host's own phone, while it is still hidden. */
const buzzerQuizSync = (room) => {
  const s = room.shared || {};
  const q = s.quiz && !s.quiz.done && room._bzDeck && room._bzDeck[s.quiz.n];
  room.secrets = {};
  if (q && s.quiz.answer === null && room.players.some(p => p.id === room.hostId)) {
    room.secrets[room.hostId] = { answer: q.answer };
  }
};

/** The host changed (room.js: handed on, or taken over): what only the host may see follows them. */
const roomHostChanged = (room) => {
  try {
    if (room.game === 'buzzer' && room.shared && room.shared.quiz) buzzerQuizSync(room);
  } catch (e) { /* never worth failing a handover */ }
};

const buzzerQuizReveal = (room) => {
  const s = room.shared;
  const q = s.quiz && room._bzDeck && room._bzDeck[s.quiz.n];
  if (!q || s.quiz.answer !== null) return;
  s.quiz.answer = q.answer;
  s.phase = 'locked';
  s.buzzes = [];
};

const buzzerQuizMove = (room, playerId, action, payload) => {
  const s = room.shared;

  if (action === 'buzz') {
    // A press after the host locked, or a second press: nothing to record.
    if (s.phase !== 'armed') return;
    // A press for a question that has moved on can't lead the next one.
    if (staleTap(payload, 'round', s.round)) return;
    const player = room.players.find(p => p.id === playerId);
    if (!player) return;                                     // a screen can't buzz
    if (s.buzzes.some(b => b.id === playerId)) return;
    // Answered wrong: out until the next question (the owner's rule).
    if ((s.out || []).indexOf(playerId) !== -1) return;
    const arr = Date.now();
    buzzerInsert(s.buzzes, { id: playerId, name: player.name, at: buzzerPressAt(payload, arr), arr: arr });
    return;
  }

  // A phone measuring its clock against the server's before its first press
  // (the answer's serverNow and the round trip): nothing changes, nothing is sent
  // to the others (SILENT_ACTIONS in room.js).
  if (action === 'bzClock') return;

  requireHost(room, playerId);

  // Whoever is here when a question starts is in it: someone who joined during
  // the evening can buzz from the next question, not only after a new game.
  const freshRoster = () => { s.roster = room.players.map(p => p.id); s.out = []; };

  // The first in line answered. Right: a point and a fresh question. Wrong:
  // out of the line, and the next one gets a go at the same question. The
  // verdict names who it was for ({ id }): a double tap on ❌ used to put the
  // next in line out too, without a word from them.
  if (action === 'correct') {
    const first = s.buzzes[0];
    if (staleTap(payload, 'id', first && first.id)) return;
    if (!first) return;
    addScore(room, first.id, 1);
    s.last = { id: first.id, name: first.name, ok: true, seq: (room._bzSeq = (Number(room._bzSeq) || 0) + 1) };
    // What «↶ رجّع» puts back: the question and its line as they were (server-only).
    room._bzUndo = { seq: s.last.seq, pts: 1, round: s.round, buzzes: s.buzzes.slice(), out: (s.out || []).slice(), roster: (s.roster || []).slice(), quiz: !!(s.quiz && !s.quiz.done) };
    s.buzzes = [];
    s.round += 1;
    freshRoster();
    s.board = scoreboardOf(room);
    // A quiz question answered: its answer for everyone, the buzzers off until the next one.
    if (s.quiz && !s.quiz.done) buzzerQuizReveal(room);
    return;
  }
  // «اعمل مسابقتك»: nobody got it - the host shows the answer.
  if (action === 'quizReveal') {
    if (!s.quiz || s.quiz.done) return;
    if (staleTap(payload, 'n', s.quiz.n)) return;
    buzzerQuizReveal(room);
    return;
  }
  // The next question of the quiz (after the last one, the quiz is done).
  if (action === 'quizNext') {
    if (!s.quiz || s.quiz.done) return;
    if (staleTap(payload, 'n', s.quiz.n)) return;
    s.buzzes = [];
    s.last = null;
    s.round += 1;
    freshRoster();
    s.phase = 'armed';
    buzzerQuizDeal(room, s.quiz.n + 1);
    return;
  }
  if (action === 'wrong') {
    if (staleTap(payload, 'id', s.buzzes[0] && s.buzzes[0].id)) return;
    const first = s.buzzes.shift();
    if (!first) return;
    // Out for the rest of this question: no second go at the same one.
    s.out = (s.out || []).concat([first.id]);
    if (payload && payload.penalty) addScore(room, first.id, -1);
    s.last = { id: first.id, name: first.name, ok: false, seq: (room._bzSeq = (Number(room._bzSeq) || 0) + 1) };
    room._bzUndo = { seq: s.last.seq, pts: payload && payload.penalty ? -1 : 0, round: s.round, buzz: first };
    s.board = scoreboardOf(room);
    return;
  }
  // «↶ رجّع»: the last verdict was a mis-tap. A right answer gives its point back and the
  // question its line again (a quiz's answer, once shown, stays shown); a wrong one gives
  // back the point it cost and puts the player first in line again. Named by its `seq`, so
  // a double tap can't undo twice; gone once a new question or verdict has come.
  if (action === 'undoVerdict') {
    const u = room._bzUndo;
    if (!s.last || !u || u.seq !== s.last.seq) return;
    if (staleTap(payload, 'seq', s.last.seq)) return;
    const id = s.last.id;
    if (u.pts) addScore(room, id, -u.pts);
    if (s.last.ok && !u.quiz) {
      s.round = u.round;
      s.buzzes = u.buzzes;
      s.out = u.out;
      s.roster = u.roster;
    } else if (!s.last.ok && s.round === u.round) {
      s.out = (s.out || []).filter(x => x !== id);
      if (s.phase === 'armed' && room.players.some(p => p.id === id) && !s.buzzes.some(b => b.id === id)) s.buzzes.unshift(u.buzz);
    }
    s.last = null;
    room._bzUndo = null;
    s.board = scoreboardOf(room);
    return;
  }
  if (action === 'reset') { s.buzzes = []; s.last = null; s.round += 1; freshRoster(); return; }
  if (action === 'lock')  { s.phase = 'locked'; s.buzzes = []; return; }
  if (action === 'arm')   { s.phase = 'armed'; s.last = null; return; }
  if (action === 'adjust') {
    // 728 «عدّل النقط بإيدك»: the host's − / + on a standings row. `was` (optional) is the
    // score the host's phone showed: a double tap before the board came back counts once.
    const id = String((payload && payload.id) || '');
    const delta = Math.trunc(Number((payload && payload.delta) || 0));
    if (!room.players.some(p => p.id === id) || !delta || Math.abs(delta) > 5) return;
    if (staleTap(payload, 'was', (s.scores || {})[id] || 0)) return;
    addScore(room, id, delta);
    s.board = scoreboardOf(room);
    return;
  }
  if (action === 'playAgain') {
    s.scores = {};
    s.buzzes = [];
    s.last = null;
    s.round = 1;
    s.phase = 'armed';
    freshRoster();
    buzzerQuizDeal(room, 0);
    s.board = scoreboardOf(room);
    return;
  }
  throw new Error('إجراء غير معروف');
};
