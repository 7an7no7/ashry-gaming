// Bundled into the rooms server after RoomGames.js (FILES in rooms-worker/build.mjs), whose helpers it uses.
/* ==========================================================================
   كلمة واحدة — JUST ONE
   The reason to play this on phones: every clue is written at the same time
   instead of passing the device around one writer at a time.
   ========================================================================== */
const justOneAction = (room, playerId, action, payload) => {
  if (action === 'start' || action === 'nextRound') {
    requireHost(room, playerId, action === 'nextRound');
    const prev = room.shared || {};
    // From the result only, so a double tap can't deal a round nobody played.
    if (action === 'nextRound' && prev.phase !== 'result') return;
    if (room.players.length < 3) throw new Error('تحتاج 3 لاعبين على الأقل');

    const roundNo = (prev.round || 0) + 1;
    // Deals against whoever is present right now; the roster is stamped after. The guesser
    // walks a shuffled order (roomTurnStep): `round % players` made someone guess twice when
    // the table changed.
    const turn = roomTurnStep(action === 'start' ? {} : prev, room.players);
    const guesser = turn.player;

    // The host's list is kept for the rounds after: a stand-in's next round (the
    // host away, requireHost) deals from it, never from a list of its own phone's.
    if (room.hostId === playerId && Array.isArray(payload.words) && payload.words.length) {
      room._joWords = payload.words.slice(0, 2000);
      room._joKey = 'justone_' + (payload.lang === 'en' ? 'en' : payload.lang === 'ar' ? 'ar' : 'x');
    } else if (action === 'start') room._joWords = null;
    const own = room._joWords && room._joWords.length;
    const words = own ? room._joWords : unlockedSpyWords();
    // Through the shared prompt memory, so tonight's word isn't one of last night's.
    const secret = nextPrompt(room, words, own ? (room._joKey || 'justone_x') : 'justone_spy');

    room.secrets = {};
    room.players.forEach(p => {
      // The guesser is the only one who doesn't get the word.
      room.secrets[p.id] = { word: p.id === guesser.id ? null : secret };
    });

    room.shared = {
      round: roundNo,
      score: prev.score || 0,
      guesserId: guesser.id,
      guesserName: guesser.name,
      turnOrder: turn.order,
      turnAt: turn.at,
      clues: [],            // {id, name} only — text stays hidden until reveal
      submitted: [],
      phase: 'writing'
    };
    room._clueText = {};    // server-side scratch, never projected
    room._joWord = secret;  // and the word, which the guesser's phone must never see
    room.phase = 'writing';
    return;
  }

  if (action === 'submitClue') {
    const s = room.shared;
    if (s.phase !== 'writing') throw new Error('انتهى وقت الكتابة');
    if (playerId === s.guesserId) throw new Error('أنت المخمّن هذه الجولة');
    if (s.roster && s.roster.indexOf(playerId) === -1) {
      throw new Error('ستدخل من الجولة القادمة');
    }

    const clue = String(payload.clue || '').trim().slice(0, 24);
    if (!clue) throw new Error('اكتب تلميحاً');
    // The word itself would be shown to the guesser; the one-phone game refuses it too.
    if (normaliseClue(clue) === normaliseClue(room._joWord || '')) throw new Error('التلميح مينفعش يكون الكلمة نفسها');

    room._clueText = room._clueText || {};
    room._clueText[playerId] = clue;
    if (s.submitted.indexOf(playerId) === -1) s.submitted.push(playerId);

    if (justOneAllWritten(room)) revealJustOneClues(room);
    return;
  }

  if (action === 'closeWriting') {
    // A writer whose phone died must not hold the table: the host goes on with
    // the clues that are in.
    requireMoveOn(room, playerId);
    if (room.shared.phase !== 'writing') return;
    revealJustOneClues(room);
    return;
  }

  if (action === 'submitGuess') {
    const s = room.shared;
    if (playerId !== s.guesserId) throw new Error('المخمّن فقط');
    if (s.phase !== 'guessing') throw new Error('لم يحن وقت التخمين');

    s.guess = String(payload.guess || '').trim().slice(0, 40);
    s.phase = 'judging';
    room.phase = 'judging';

    // Safe to publish the answer, and the clues that were taken away, now
    // that the guess is locked in.
    s.secretWord = justOneWord(room);
    publishJustOneClues(room);
    return;
  }

  if (action === 'skipGuess') {
    // The guesser has gone quiet: the word is shown and nobody scores.
    requireMoveOn(room, playerId);
    if (room.shared.phase !== 'guessing') return;
    skipJustOneRound(room);
    return;
  }

  if (action === 'judge') {
    requireMoveOn(room, playerId);
    const s = room.shared;
    // Judging twice used to award two points.
    if (s.phase !== 'judging') throw new Error('لا يوجد تخمين للحكم عليه');
    if (payload.correct) s.score = (s.score || 0) + 1;
    s.lastResult = payload.correct ? 'correct' : 'wrong';
    s.phase = 'result';
    room.phase = 'result';
    return;
  }

  throw new Error('إجراء غير معروف');
};

/**
 * Every writer still here has a clue in. Roster, not room.players: someone who
 * joined mid-round isn't a writer and must not hold the round open.
 */
const justOneAllWritten = (room) => {
  const s = room.shared;
  return activeRoster(room, s.roster).filter(id => id !== s.guesserId).every(id => s.submitted.indexOf(id) !== -1);
};

/**
 * Drops the duplicates and hands the rest to the guesser: when every clue is
 * in, or when the host goes on with what there is. A removed clue keeps its
 * writer and its place but not its text - `shared` reaches the guesser's phone
 * too, so the text waits in room._clueText until the guess is in.
 */
const revealJustOneClues = (room) => {
  const s = room.shared;
  const clueText = room._clueText || {};
  const writers = activeRoster(room, s.roster)
    .filter(id => id !== s.guesserId && s.submitted.indexOf(id) !== -1 && clueText[id]);
  const counts = {};
  writers.forEach(id => {
    const norm = normaliseClue(clueText[id]);
    counts[norm] = (counts[norm] || 0) + 1;
  });
  s.clues = writers.map(id => {
    const text = clueText[id] || '';
    const dup = counts[normaliseClue(text)] > 1;
    const writer = room.players.find(p => p.id === id);
    return { id: id, name: writer ? writer.name : '', text: dup ? '' : text, removed: dup };
  });
  s.removedCount = s.clues.filter(c => c.removed).length;
  s.phase = 'guessing';
  room.phase = 'guessing';
};

/** The removed clues' text, once it no longer matters. */
const publishJustOneClues = (room) => {
  const clueText = room._clueText || {};
  (room.shared.clues || []).forEach(c => { if (c.removed && c.id && clueText[c.id]) c.text = clueText[c.id]; });
};

/**
 * The round's word. Older rounds kept it only in the writers' secrets, so read
 * it from a player who actually holds one — "any player who isn't the guesser"
 * could be someone who joined mid-round and has none.
 */
const justOneWord = (room) => {
  if (room._joWord) return room._joWord;
  const s = room.shared;
  const holder = room.players.find(p =>
    p.id !== s.guesserId && room.secrets[p.id] && room.secrets[p.id].word);
  return holder ? room.secrets[holder.id].word : null;
};

/** The round ends without a guess: the word and the clues shown, no point. */
const skipJustOneRound = (room) => {
  const s = room.shared;
  s.guess = '';
  s.secretWord = justOneWord(room);
  publishJustOneClues(room);
  s.lastResult = 'skipped';
  s.phase = 'result';
  room.phase = 'result';
};

/**
 * One typed word against another: a Just One clue against the others, a
 * Codenames clue against the board, a Fibbage lie against the truth, a
 * Draw & Guess or Fake Artist guess against the word. Spelling, punctuation,
 * spaces and a leading "ال" or "the" are all folded away, so الأسد, أسد and
 * اسد are one word. (Stop the Bus has its own fold: there the first letter matters.)
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
