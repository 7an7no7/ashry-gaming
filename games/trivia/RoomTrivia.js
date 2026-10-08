// Bundled into the rooms server after RoomGames.js (FILES in rooms-worker/build.mjs), whose helpers it uses.
/* ==========================================================================
   تحدي المعلومات — TRIVIA
   The host picks how many questions (5, 10, 15 or 20); everyone answers at
   once. A right answer is 10 points, and the fastest right answers get more:
   +5 for the first, +4 for the second, down to +1 for the fifth.
   ========================================================================== */
// TRIVIA_COUNTS, what the host can pick, is in rooms/RoomShared.js (the lobby offers them).
const TRIVIA_PER_GAME = 10;               // when they don't
// Points for a right answer, and the bonus for being among the fastest right
// answers: the first gets all of it, each next one a point less.
const TRIVIA_POINTS = 10;
const TRIVIA_SPEED_BONUS = 5;
const TRIVIA_SECONDS = 15;
// An answer tapped as the clock hits zero is still on its way, and still
// counts. Once this has passed too, the server closes the question itself.
// The phone shows «الوقت خلص!» at its own 0 (JS_RoomTrivia.html), so this is only the wait for an answer in flight.
const TRIVIA_GRACE_MS = 1000;   // 2000 -> 1000 (the owner, 8 Oct 2026: felt slow)

// The categories a host can pick (a question's `c` in TriviaQuestions.js);
// TRIVIA_ROOM_CATS in JS_RoomTrivia.html draws them.
const TRIVIA_CATS = ['egypt', 'geography', 'science', 'sport', 'film', 'general'];
const triviaCategoryOf = (payload, fallback) => {
  const asked = payload && payload.cat;
  if (asked === 'all' || TRIVIA_CATS.indexOf(asked) !== -1) return asked;
  return fallback || 'all';
};

const triviaAction = (room, playerId, action, payload) => {
  if (action === 'start' || action === 'playAgain') {
    requireHost(room, playerId);
    // 'start' is refused outside the lobby, so a finished game restarts here.
    if (action === 'playAgain' && room.shared.phase !== 'gameover') return;

    const lang = roomLangOf(room, payload);
    // «اعمل مسابقتك»: the family's own quiz, every question in the author's order.
    const quiz = roomPackQuiz(room);
    if (quiz) {
      room._deck = roomPackDeck(quiz);
    } else {
      const pool = TRIVIA_QUESTIONS[lang] || TRIVIA_QUESTIONS.ar;
      // Play again comes without a count: it keeps the one this game had.
      const asked = Number(payload && payload.count);
      const count = TRIVIA_COUNTS.indexOf(asked) !== -1 ? asked : (room._triviaCount || TRIVIA_PER_GAME);
      room._triviaCount = count;
      // The host's category (the lobby's «الفئة»): a question's `c`. A phone
      // that sends none (an older page) gets everything; play again keeps it.
      const cat = triviaCategoryOf(payload, action === 'playAgain' ? room._triviaCat : 'all');
      room._triviaCat = cat;
      const accept = cat === 'all' ? null : (q => q.c === cat);
      // The bank puts the right answer second three times in four, so the
      // choices are reordered for every question — otherwise "always B" wins.
      // One memory for the whole list, whatever the category.
      room._deck = nextPrompts(room, pool, 'trivia_' + lang, count, accept).map(q => {
        const order = shuffled(q.choices.map((_, k) => k));
        return { q: q.q, choices: order.map(k => q.choices[k]), answer: order.indexOf(q.answer), c: q.c };
      });
    }
    room._triviaFastest = {};
    room.shared = { scores: {}, lang: lang, roster: room.players.map(p => p.id) };
    // No code in it: /pack/get answers a code with the whole quiz, the right choices included.
    if (quiz) room.shared.quiz = { title: quiz.pack.title, emoji: quiz.pack.emoji || '' };
    dealTriviaQuestion(room, 0);
    return;
  }

  const s = room.shared;

  if (action === 'answer') {
    // Aimed at an earlier question: dropped, or it would land on this one.
    if (staleTap(payload, 'qIndex', s.qIndex)) return;
    if (s.phase !== 'answering') throw new Error('انتهى وقت الإجابة');
    if ((s.roster || []).indexOf(playerId) === -1) throw new Error('لست ضمن هذه الجولة');
    const choice = Number(payload && payload.choice);
    if (!(choice >= 0 && choice < s.choices.length && choice === Math.floor(choice))) {
      throw new Error('اختيار غير صحيح');
    }
    const now = Date.now();
    if (now > s.endsAt + TRIVIA_GRACE_MS) {
      closeTriviaQuestion(room);
      return;
    }
    room._answers = room._answers || {};
    if (room._answers[playerId]) return;
    // seq breaks a tie when two answers land in the same millisecond.
    room._answers[playerId] = { choice: choice, time: Math.min(now, s.endsAt), seq: s.answered.length };
    s.answered.push(playerId);
    if (activeRoster(room, s.roster).every(id => s.answered.indexOf(id) !== -1)) closeTriviaQuestion(room);
    return;
  }

  if (action === 'closeQuestion') {
    // The host can end a question early. Once time is up anyone can, so a host
    // whose phone went to sleep doesn't leave the question open for good.
    if (room.hostId !== playerId && Date.now() < s.endsAt) throw new Error('دي للمضيف بس');
    closeTriviaQuestion(room);
    return;
  }

  if (action === 'nextQuestion') {
    requireMoveOn(room, playerId);
    // From the results only: a double tap must not skip a question unseen.
    if (s.phase !== 'results') return;
    // Pressed for a question that has since moved on (the clock of «التالي لوحده» got there first).
    if (staleTap(payload, 'qIndex', s.qIndex)) return;
    const next = (room._qIdx || 0) + 1;
    if (next >= (room._deck || []).length) {
      s.phase = 'gameover';
      s.board = scoreboardOf(room);
      s.fastest = topTally(room, room._triviaFastest);
      return;
    }
    dealTriviaQuestion(room, next);
    return;
  }

  throw new Error('إجراء غير معروف');
};

/**
 * The player at the top of a running tally, for a title at the end of a game
 * ("fastest", "best liar"). Nothing at all unless one player is strictly
 * ahead: a title half the table shares is not a title, and a game where
 * nobody scored has no leader to name. Someone who has left the room is not
 * counted either - roomPlayerName has no name for them any more.
 */
const topTally = (room, tally) => {
  const ids = Object.keys(tally || {})
    .filter(id => tally[id] > 0 && room.players.some(p => p.id === id));
  if (!ids.length || room.players.length < 2) return null;
  const best = Math.max.apply(null, ids.map(id => tally[id]));
  const top = ids.filter(id => tally[id] === best);
  if (top.length !== 1) return null;
  return { id: top[0], name: roomPlayerName(room, top[0]), n: best };
};

const dealTriviaQuestion = (room, idx) => {
  const q = room._deck[idx];
  const prev = room.shared || {};
  room._qIdx = idx;
  room._currentQ = q;
  room._answers = {};
  room._qStart = Date.now();
  room.shared = {
    qIndex: idx,
    totalQuestions: room._deck.length,
    question: q.q,
    choices: q.choices,
    phase: 'answering',
    answered: [],
    seconds: TRIVIA_SECONDS,
    endsAt: room._qStart + TRIVIA_SECONDS * 1000,
    scores: prev.scores || {},
    lang: prev.lang,
    roster: prev.roster || room.players.map(p => p.id)
  };
  if (prev.quiz) room.shared.quiz = prev.quiz;
  // 769: a family quiz's section, the question's eyebrow on every phone and the TV.
  if (q.sec) room.shared.section = q.sec;
  room.shared.board = scoreboardOf(room);
  room.phase = 'play';
};

/** Marks the answer, scores it and shows who picked what. Safe to call twice. */
const closeTriviaQuestion = (room) => {
  const s = room.shared;
  if (s.phase !== 'answering') return;
  const q = room._currentQ;
  const answers = room._answers || {};
  const counts = s.choices.map(() => 0);
  const picks = {};
  const gained = {};

  Object.keys(answers).forEach(pid => {
    counts[answers[pid].choice]++;
    picks[pid] = answers[pid].choice;
  });

  // Right answers from fastest to slowest. The fastest gets 10 + 5, the next
  // 10 + 4 ... from the sixth on, the plain 10 - so nobody ties by accident.
  const right = Object.keys(answers)
    .filter(pid => answers[pid].choice === q.answer)
    .sort((a, b) => (answers[a].time - answers[b].time) || ((answers[a].seq || 0) - (answers[b].seq || 0)));
  right.forEach((pid, rank) => {
    gained[pid] = TRIVIA_POINTS + Math.max(0, TRIVIA_SPEED_BONUS - rank);
    addScore(room, pid, gained[pid]);
  });
  // Who got there first, question by question. s.order is overwritten by the
  // next question, so the count has to be kept here to reach the end.
  if (right.length) {
    room._triviaFastest = room._triviaFastest || {};
    room._triviaFastest[right[0]] = (room._triviaFastest[right[0]] || 0) + 1;
  }

  s.phase = 'results';
  s.correctAnswer = q.answer;
  s.choiceCounts = counts;
  s.picks = picks;
  s.gained = gained;
  s.order = right;
  s.board = scoreboardOf(room);
};
