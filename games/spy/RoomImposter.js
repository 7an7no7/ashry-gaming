// Bundled into the rooms server after RoomGames.js (FILES in rooms-worker/build.mjs), whose helpers it uses.
/* ==========================================================================
   الجاسوس — IMPOSTER
   Everyone gets the same word except the spies, who get none. Each phone shows
   only its own card, which is the whole point of playing this on separate
   devices.
   ========================================================================== */
/**
 * The words in one category, minus the password.
 *
 * A category whose name carries 🔒 keeps its password as its first word, and
 * the single-device screen slices it off before drawing a word. The
 * room layer did not, so the password could be dealt as the secret word.
 */
const spyWords = (category) => {
  // An English category (SPY_WORDS_EN) is found by its own name: the two lists'
  // names never meet, so the Arabic game deals exactly as before.
  const en = typeof SPY_WORDS_EN !== 'undefined' ? SPY_WORDS_EN : {};
  const words = (getSpyData()[String(category || '')] || en[String(category || '')] || []).slice();
  if (String(category).indexOf('🔒') !== -1) words.shift();
  return words;
};

/** Every unlocked category folded into one bank. */
const unlockedSpyWords = () => {
  const data = getSpyData();
  return Object.keys(data)
    .filter(k => k.indexOf('🔒') === -1)
    .reduce((all, k) => all.concat(data[k]), []);
};

const IMPOSTER_GUESS_OPTIONS = 6;
// The lobby's discussion limit (the review of 1 Oct 2026): off, or these minutes, after
// which the vote opens by itself (roomDeadline / roomTimeout). A moment's grace lets the
// phones' own clocks reach 0 first.
const IMPOSTER_LIMITS = [3, 5, 8];
const IMPOSTER_GRACE_MS = 1500;

/** Anyone still here may ask first, the spy included (as الموقع السري's firstId). */
const imposterPickFirst = (room) => {
  const s = room.shared;
  const here = (s.roster || []).filter(id => room.players.some(p => p.id === id));
  s.firstId = here.length ? here[Math.floor(Math.random() * here.length)] : null;
};

/** The vote on who the spy is: everyone in the round, nobody on themselves. */
const openImposterVote = (room) => {
  const s = room.shared;
  openVote(room, room.players.filter(p => s.roster.indexOf(p.id) !== -1).map(p => ({ id: p.id, label: p.name, ownerId: p.id })), s.roster);
  s.endsAt = null;
  room.phase = 'voting';
};

const imposterAction = (room, playerId, action, payload) => {
  if (action === 'start') {
    requireHost(room, playerId);
    if (room.players.length < 3) throw new Error('تحتاج 3 لاعبين على الأقل');

    const undercover = !!payload.undercover;
    // المختلف's pairs in the games' language the host's phone sent.
    const pairsEn = payload.lang === 'en' && typeof SPY_PAIRS_EN !== 'undefined';
    const pairList = pairsEn ? SPY_PAIRS_EN : (typeof SPY_PAIRS !== 'undefined' ? SPY_PAIRS : []);
    const category = undercover ? '' : String(payload.category || '');
    // «كلماتنا»: the family's words, when the lobby chose them (never المختلف: it needs pairs).
    const familyWords = !undercover && payload.pack ? roomPackWords(room) : null;
    const words = undercover ? pairList.map(p => p[0]) : (familyWords ? familyWords.slice() : spyWords(category));
    if (!undercover && !words.length) throw new Error('اختر مجموعة كلمات');

    // PromptMemory keys on the dealt value, so deal the pair as one string.
    const pair = undercover ? nextPrompt(room, pairList.map(p => p[0] + '|' + p[1]), pairsEn ? 'imppair_en' : 'imppair').split('|') : null;
    // Either word can be the odd one: always the second of a list the page ships
    // meant holding "نسكافيه" told you you were the odd one out.
    if (pair && Math.random() < 0.5) pair.reverse();
    const secret = undercover ? pair[0] : nextPrompt(room, words, familyWords ? 'imp_pack_' + room._pack.code : 'imp_' + category);
    const pairOther = undercover ? pair[1] : null;
    const spyCount = Math.max(1, Math.min(Number(payload.spies) || 1, room.players.length - 2));
    const order = shuffled(room.players.map(p => p.id));
    const spies = order.slice(0, spyCount);

    room.secrets = {};
    room.players.forEach(p => {
      const isSpy = spies.indexOf(p.id) !== -1;
      // المختلف: every slice looks the same — a role and a word — so nobody can
      // learn they are the odd one out, not from the screen and not by reading
      // the traffic. room._impSpies is the only record of who is who.
      room.secrets[p.id] = undercover
        ? { role: 'player', word: isSpy ? pairOther : secret, category: category }
        : { role: isSpy ? 'spy' : 'player', word: isSpy ? null : secret, category: category };
    });
    room._impSecret = secret;
    room._impPairOther = pairOther;
    room._impSpies = spies;
    room._impWords = words;

    room.shared = {
      category: category,
      undercover: undercover,
      spyCount: spyCount,
      revealed: false,
      scores: room._impScores || {},
      roster: room.players.map(p => p.id),
      vote: null,
      outcome: null,
      // Minutes of discussion before the vote opens by itself; 0 is no limit (an older phone sends none).
      limit: IMPOSTER_LIMITS.indexOf(Number(payload.limit)) !== -1 ? Number(payload.limit) : 0,
      endsAt: null
    };
    imposterPickFirst(room);
    room.shared.board = scoreboardOf(room);
    room.phase = 'reveal';
    return;
  }

  const s = room.shared;

  if (action === 'beginDiscussion') {
    requireMoveOn(room, playerId);
    if (room.phase !== 'reveal') return;
    room.phase = 'discuss';
    s.startedAt = Date.now();
    s.endsAt = s.limit ? s.startedAt + s.limit * 60000 : null;
    return;
  }

  if (action === 'startVote') {
    requireMoveOn(room, playerId);
    if (room.phase !== 'discuss') return;
    openImposterVote(room);
    return;
  }
  if (action === 'vote') {
    if (room.phase !== 'voting') throw new Error('لا يوجد تصويت الآن');
    if (castVote(room, playerId, String((payload && payload.option) || ''))) resolveImposterVote(room);
    return;
  }
  if (action === 'closeVote') {
    requireMoveOn(room, playerId);
    if (room.phase !== 'voting') return;
    if (closeVote(room)) resolveImposterVote(room);
    return;
  }
  if (action === 'guess') {
    if (room.phase !== 'guess') throw new Error('ليس وقت التخمين');
    if (playerId !== s.guesserId) throw new Error('الجاسوس المتهم فقط يخمّن');
    const word = String((payload && payload.word) || '');
    if ((s.options || []).indexOf(word) === -1) throw new Error('اختيار غير صحيح');
    finishImposter(room, word === room._impSecret ? 'stole' : 'caught', word);
    return;
  }
  if (action === 'skipGuess') {
    requireMoveOn(room, playerId);
    if (room.phase !== 'guess') return;
    finishImposter(room, 'caught', null);
    return;
  }
  if (action === 'revealResult') {
    // The host ends it without a vote: the answer is shown, nobody scores.
    requireMoveOn(room, playerId);
    if (room.phase !== 'discuss' && room.phase !== 'voting') return;
    finishImposter(room, 'revealed', null);
    return;
  }
  if (action === 'restart') {
    requireHost(room, playerId);
    room._impScores = (s && s.scores) || room._impScores || {};
    // A finished round's board waits for the night, server-side (backToHub in RoomGames.js banks it).
    if (room.phase === 'result' && s && s.board) room._restartNight = { game: room.game, board: s.board, roster: s.roster || null };
    room.phase = 'lobby';
    room.secrets = {};
    room.shared = { scores: room._impScores };
    return;
  }

  throw new Error('إجراء غير معروف');
};

/** Most votes is accused; a tie lets the spy escape. An accused spy gets one guess at the word. */
const resolveImposterVote = (room) => {
  const s = room.shared;
  const results = s.vote.results || [];
  const top = results.reduce((m, r) => Math.max(m, r.count), 0);
  const leaders = results.filter(r => top > 0 && r.count === top);
  const accused = leaders.length === 1 ? leaders[0] : null;
  s.accusedId = accused ? accused.id : null;
  s.accusedName = accused ? accused.label : '';
  if (accused && (room._impSpies || []).indexOf(accused.id) !== -1) {
    // المختلف: naming them ends it (the owner, 20 Sep 2026). They are holding a
    // near relative of the table's word, so picking it out of six would be free,
    // and catching them would be worth nothing. الجاسوس keeps its guess.
    if (s.undercover) { finishImposter(room, 'caught', null); return; }
    const others = shuffled((room._impWords || []).filter(w => w !== room._impSecret)).slice(0, IMPOSTER_GUESS_OPTIONS - 1);
    s.options = shuffled(others.concat([room._impSecret]));
    s.guesserId = accused.id;
    s.guesserName = accused.label;
    room.phase = 'guess';
    return;
  }
  finishImposter(room, 'escaped', null);
};

/** Caught: a point to every player. Escaped or guessed the word: two to each spy. Revealed: nothing. */
const finishImposter = (room, outcome, guess) => {
  const s = room.shared;
  const spies = room._impSpies || [];
  s.outcome = outcome;
  s.guess = guess;
  s.revealed = true;
  s.secretWord = room._impSecret;
  if (room._impPairOther) s.pairOther = room._impPairOther;
  s.spies = spies.map(id => roomPlayerName(room, id));
  s.spyIds = spies.slice();
  if (outcome === 'caught') {
    (s.roster || []).forEach(id => { if (spies.indexOf(id) === -1 && room.players.some(p => p.id === id)) addScore(room, id, 1); });
  } else if (outcome === 'escaped' || outcome === 'stole') {
    spies.forEach(id => addScore(room, id, 2));
  }
  s.board = scoreboardOf(room);
  room.phase = 'result';
};
