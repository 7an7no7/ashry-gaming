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
/* The ideas of 7 Oct 2026 for كمّل المثل: `closeRetry` - a close answer is not spent, the
   player gets one more try worth half (611); `choicesMs` - after 12 s three choices come
   down for whoever hasn't answered, a right pick worth half, a wrong one spends the answer
   (612). Typing stays full points. */
const QUIZ_GAMES = {
  emoji:    { bank: () => EMOJI_RIDDLES, seconds: 45, retry: true,  perGame: 10 },
  proverbs: { bank: () => PROVERBS,      seconds: 25, retry: false, perGame: 10, closeRetry: true, choicesMs: 12000 }
};
const QUIZ_CHOICES = 3;

/** 'right', 'close' or '' for a typed answer against the card's answer and its alternatives. */
const quizAnswerVerdict = (item, text, bank) => guessVerdict(text, [item.a].concat(item.alt || []), bank);

/** This phone's own slice of the card (its close guesses' text, its second try), made on first use. */
const quizSlice = (room, playerId) => {
  room.secrets = room.secrets || {};
  const mine = Object.assign({}, room.secrets[playerId] || {});
  if (!mine.quiz || mine.quiz.q !== room.shared.qIndex) mine.quiz = { q: room.shared.qIndex };
  room.secrets[playerId] = mine;
  return mine.quiz;
};

/** The three choices of a proverb: its word and two other proverbs' words, none from this game's deck. */
const quizChoicesFor = (room, item) => {
  const cfg = QUIZ_GAMES[room.game];
  const bank = cfg.bank();
  const pool = bank[(room.shared && room.shared.lang) || 'ar'] || bank.ar;
  const inDeck = new Set((room._deck || []).map(x => normaliseClue(x.a)));
  const seen = new Set([normaliseClue(item.a)]);
  const decoys = [];
  for (const x of shuffled(pool.slice())) {
    if (decoys.length >= QUIZ_CHOICES - 1) break;
    const key = normaliseClue(x.a);
    if (!key || seen.has(key) || inDeck.has(key)) continue;
    // Never a spelling of this card's own word.
    if (quizAnswerVerdict(item, x.a) !== '') continue;
    seen.add(key);
    decoys.push(x.a);
  }
  const labels = shuffled([item.a].concat(decoys));
  return { labels: labels, right: labels.indexOf(item.a) };
};

/** The choices come down (shared.choices) once their time is up. */
const quizOpenChoices = (room) => {
  const s = room.shared;
  if (s.phase !== 'answering' || s.choices || !room._quizChoices) return;
  s.choices = room._quizChoices.labels.slice();
};

/** When the server looks next: the choices coming down, then the card's end. */
const quizDeadline = (room) => {
  const s = room.shared;
  const end = s.endsAt + QUIZ_GRACE_MS;
  return s.choicesAt && !s.choices ? Math.min(s.choicesAt, end) : end;
};

/** Everything that is due, in one pass: the choices, and the card's end if that is due too. */
const quizTimeout = (room, now) => {
  const s = room.shared;
  if (s.phase === 'answering' && s.choicesAt && !s.choices && now >= s.choicesAt) {
    quizOpenChoices(room);
    if (now < s.endsAt + QUIZ_GRACE_MS) return true;
  }
  closeQuizCard(room);
  return true;
};

/** Points for a right answer by its place; half (rounded up) for a second try or a choice. */
const quizPointsFor = (rank, half) => {
  const full = QUIZ_POINTS + Math.max(0, QUIZ_SPEED_BONUS - rank);
  return half ? Math.ceil(full / 2) : full;
};

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
    const second = !!(room._quizNear && room._quizNear[playerId]);
    // Once the choices are up, typing one of them is a pick: half, as tapping it (the owner, audit 7 Oct 2026, P1).
    const viaChoice = Array.isArray(s.choices) && s.choices.some(c => normaliseClue(c) === normaliseClue(text));
    if (right) {
      room._answers[playerId] = { text: text, time: Math.min(now, s.endsAt), seq: s.solved.length, half: second || viaChoice };
      s.solved.push(playerId);
      s.feed.push({ name: name, right: true });
    } else if (cfg.retry) {
      // A wrong guess is fun for the table to see, and the player tries again. A near miss
      // shows its text on the guesser's phone only (603): the others see «🔥 عمر قرّب»,
      // or the near spelling would hand them the answer.
      const n = s.feedSeq = (s.feedSeq || 0) + 1;
      if (verdict === 'close') {
        s.feed.push({ n: n, name: name, right: false, close: true });
        const mine = quizSlice(room, playerId);
        mine.close = Object.assign({}, mine.close || {}, { [n]: text });
      } else {
        s.feed.push({ n: n, name: name, text: text, right: false });
      }
    } else if (cfg.closeRetry && verdict === 'close' && !second) {
      // Close: not spent. «قرّبت!» on this phone, and one more try worth half (611).
      room._quizNear = room._quizNear || {};
      room._quizNear[playerId] = true;
      Object.assign(quizSlice(room, playerId), { near: text });
    } else {
      room._answers[playerId] = { text: text, wrong: true };
      s.tried.push(playerId);
    }
    if (s.feed.length > 30) s.feed = s.feed.slice(-30);
    if (activeRoster(room, s.roster).every(id => room._answers[id])) closeQuizCard(room);
    return;
  }

  if (action === 'pick') {
    // One of the three choices (612): right is half the points, wrong spends the answer.
    if (staleTap(payload, 'qIndex', s.qIndex)) return;
    if (s.phase !== 'answering' || !Array.isArray(s.choices)) throw new Error('انتهى وقت الإجابة');
    if ((s.roster || []).indexOf(playerId) === -1) throw new Error('لست ضمن هذه الجولة');
    const i = Number(payload && payload.i);
    if (!(i >= 0 && i < s.choices.length && i === Math.floor(i))) throw new Error('اختيار غير صحيح');
    const now = Date.now();
    if (now > s.endsAt + QUIZ_GRACE_MS) { closeQuizCard(room); return; }
    room._answers = room._answers || {};
    if (room._answers[playerId]) return;
    if (i === (room._quizChoices || {}).right) {
      room._answers[playerId] = { text: s.choices[i], time: Math.min(now, s.endsAt), seq: s.solved.length, half: true };
      s.solved.push(playerId);
      s.feed.push({ name: roomPlayerName(room, playerId), right: true });
    } else {
      room._answers[playerId] = { text: s.choices[i], wrong: true };
      s.tried.push(playerId);
    }
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
  room._quizNear = {};
  // Every phone's note of the last card (its close guesses, its second try) goes.
  Object.keys(room.secrets || {}).forEach(id => {
    const slice = room.secrets[id];
    if (!slice || !('quiz' in slice)) return;
    const rest = Object.assign({}, slice);
    delete rest.quiz;
    if (Object.keys(rest).length) room.secrets[id] = rest; else delete room.secrets[id];
  });
  // Everything about the card but its answer.
  const card = {};
  Object.keys(item).forEach(k => { if (k !== 'a' && k !== 'alt') card[k] = item[k]; });
  const now = Date.now();
  room.shared = {
    qIndex: idx,
    total: room._deck.length,
    card: card,
    phase: 'answering',
    seconds: cfg.seconds,
    endsAt: now + cfg.seconds * 1000,
    // When the three choices come down (shared.choices then); the choices wait on the server.
    choicesAt: cfg.choicesMs ? now + cfg.choicesMs : null,
    choices: null,
    retry: cfg.retry,
    solved: [],
    tried: [],
    feed: [],
    scores: prev.scores || {},
    lang: prev.lang,
    roster: prev.roster || room.players.map(p => p.id)
  };
  room._quizChoices = cfg.choicesMs ? quizChoicesFor(room, item) : null;
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
    gained[pid] = quizPointsFor(rank, answers[pid].half);
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
