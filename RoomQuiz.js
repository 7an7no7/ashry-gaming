// Bundled into the rooms server after RoomGames.js (FILES in rooms-worker/build.mjs), whose helpers it uses.
/* ==========================================================================
   فوازير إيموجي · كمّل المثل — TYPED QUIZZES
   One engine for both: a card everyone sees, an answer that stays on the
   server until the card closes, a clock, and speed points for the right
   answers (like the trivia). The emoji riddles allow retries and show the
   wrong guesses to everyone; a proverb takes one answer from each player.
   ========================================================================== */
const QUIZ_COUNTS = [5, 10, 15, 20];
const QUIZ_POINTS = 10;
const QUIZ_SPEED_BONUS = 5;
const QUIZ_GRACE_MS = 2000;
const QUIZ_GAMES = {
  emoji:    { bank: () => EMOJI_RIDDLES, seconds: 45, retry: true,  perGame: 10 },
  proverbs: { bank: () => PROVERBS,      seconds: 25, retry: false, perGame: 10 }
};

/** 'right', 'close' or '' for a typed answer against the card's answer and its alternatives. */
const quizAnswerVerdict = (item, text, bank) => guessVerdict(text, [item.a].concat(item.alt || []), bank);

const quizAction = (room, playerId, action, payload) => {
  const cfg = QUIZ_GAMES[room.game];
  if (action === 'start' || action === 'playAgain') {
    requireHost(room, playerId);
    if (action === 'playAgain' && room.shared.phase !== 'gameover') return;
    const lang = roomLangOf(room, payload);
    const bank = cfg.bank();
    const pool = bank[lang] || bank.ar;
    const asked = Number(payload && payload.count);
    const count = QUIZ_COUNTS.indexOf(asked) !== -1 ? asked : (room._quizCount || cfg.perGame);
    room._quizCount = count;
    room._deck = nextPrompts(room, pool, room.game + '_' + lang, count);
    room.shared = { scores: {}, lang: lang, roster: room.players.map(p => p.id) };
    dealQuizCard(room, 0);
    return;
  }

  const s = room.shared;

  if (action === 'guess') {
    // Typed for a card that has since closed: never judged against the next one.
    if (staleTap(payload, 'qIndex', s.qIndex)) return;
    if (s.phase !== 'answering') throw new Error('انتهى وقت الإجابة');
    if ((s.roster || []).indexOf(playerId) === -1) throw new Error('لست ضمن هذه الجولة');
    const text = String((payload && payload.text) || '').trim().slice(0, 60);
    if (!text) return;
    const now = Date.now();
    if (now > s.endsAt + QUIZ_GRACE_MS) { closeQuizCard(room); return; }
    room._answers = room._answers || {};
    if (room._answers[playerId]) return;       // already right, or the one try is used
    const quizBank = cfg.bank();
    const verdict = quizAnswerVerdict(room._card, text, quizBank[s.lang] || quizBank.ar);
    const right = verdict === 'right';
    const name = roomPlayerName(room, playerId);
    if (right) {
      room._answers[playerId] = { text: text, time: Math.min(now, s.endsAt), seq: s.solved.length };
      s.solved.push(playerId);
      s.feed.push({ name: name, right: true });
    } else if (cfg.retry) {
      // A wrong guess is fun for the table to see, and the player tries again; a near miss says so.
      s.feed.push({ name: name, text: text, right: false, close: verdict === 'close' });
    } else {
      room._answers[playerId] = { text: text, wrong: true };
      s.tried.push(playerId);
    }
    if (s.feed.length > 30) s.feed = s.feed.slice(-30);
    if (activeRoster(room, s.roster).every(id => room._answers[id])) closeQuizCard(room);
    return;
  }

  if (action === 'closeQuestion') {
    // The host can end a card early. Once time is up anyone can.
    if (room.hostId !== playerId && Date.now() < s.endsAt) throw new Error('دي للمضيف بس');
    closeQuizCard(room);
    return;
  }

  if (action === 'nextQuestion') {
    requireMoveOn(room, playerId);
    if (s.phase !== 'results') return;
    const next = (room._qIdx || 0) + 1;
    if (next >= (room._deck || []).length) {
      s.phase = 'gameover';
      s.board = scoreboardOf(room);
      return;
    }
    dealQuizCard(room, next);
    return;
  }

  throw new Error('إجراء غير معروف');
};

const dealQuizCard = (room, idx) => {
  const cfg = QUIZ_GAMES[room.game];
  const item = room._deck[idx];
  const prev = room.shared || {};
  room._qIdx = idx;
  room._card = item;
  room._answers = {};
  // Everything about the card but its answer.
  const card = {};
  Object.keys(item).forEach(k => { if (k !== 'a' && k !== 'alt') card[k] = item[k]; });
  room.shared = {
    qIndex: idx,
    total: room._deck.length,
    card: card,
    phase: 'answering',
    seconds: cfg.seconds,
    endsAt: Date.now() + cfg.seconds * 1000,
    retry: cfg.retry,
    solved: [],
    tried: [],
    feed: [],
    scores: prev.scores || {},
    lang: prev.lang,
    roster: prev.roster || room.players.map(p => p.id)
  };
  room.shared.board = scoreboardOf(room);
  room.phase = 'play';
};

const closeQuizCard = (room) => {
  const s = room.shared;
  if (s.phase !== 'answering') return;
  const answers = room._answers || {};
  const right = Object.keys(answers)
    .filter(pid => !answers[pid].wrong)
    .sort((a, b) => (answers[a].time - answers[b].time) || (answers[a].seq - answers[b].seq));
  const gained = {};
  right.forEach((pid, rank) => {
    gained[pid] = QUIZ_POINTS + Math.max(0, QUIZ_SPEED_BONUS - rank);
    addScore(room, pid, gained[pid]);
  });
  s.phase = 'results';
  s.answer = room._card.a;
  s.gained = gained;
  s.order = right;
  // What everyone typed, now that it no longer matters.
  s.answers = Object.keys(answers).map(pid => ({ name: roomPlayerName(room, pid), text: answers[pid].text, right: !answers[pid].wrong }));
  s.board = scoreboardOf(room);
};
