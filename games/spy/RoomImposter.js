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

/* «مين يسأل مين؟» in rooms (the owner's pick 503, 7 Oct 2026): the one-phone ask
   director's `random` walk, kept by the server so every phone and the TV show the
   same pair. shared.dir = { turn, askerId, targetId, asked: {id: n}, targeted: {id: n} }:
   the asker is whoever has asked least (not the last asker, from three people),
   the target whoever has been asked least; the first asker is shared.firstId. */
const imposterDirLeast = (counts, pool) => {
  const min = Math.min(...pool.map(id => counts[id] || 0));
  const ties = pool.filter(id => (counts[id] || 0) === min);
  return ties[Math.floor(Math.random() * ties.length)];
};
const imposterDirNext = (room, forceAsker) => {
  const s = room.shared;
  const d = s.dir;
  if (!d) return;
  const here = (s.roster || []).filter(id => room.players.some(p => p.id === id));
  if (here.length < 2) { d.askerId = null; d.targetId = null; return; }
  const prev = d.askerId;
  const asker = forceAsker && here.indexOf(forceAsker) !== -1
    ? forceAsker
    : imposterDirLeast(d.asked, here.filter(id => id !== prev || here.length < 3));
  const target = imposterDirLeast(d.targeted, here.filter(id => id !== asker));
  d.asked[asker] = (d.asked[asker] || 0) + 1;
  d.targeted[target] = (d.targeted[target] || 0) + 1;
  d.turn += 1;
  d.askerId = asker;
  d.targetId = target;
};

/** A spy picks the word from six: caught by the vote, or of their own accord («أنا الجاسوس», 502). */
const imposterOpenGuess = (room, id, name, claim) => {
  const s = room.shared;
  const others = shuffled((room._impWords || []).filter(w => w !== room._impSecret)).slice(0, IMPOSTER_GUESS_OPTIONS - 1);
  s.options = shuffled(others.concat([room._impSecret]));
  s.guesserId = id;
  s.guesserName = name;
  s.claim = !!claim;
  s.endsAt = null;
  room.phase = 'guess';
};

/**
 * 506 (7 Oct 2026): a fairer draw. One spy at a time by weight: a spy of the last round
 * weighs half, everyone else one - never impossible, so nobody can be ruled out.
 */
const imposterPickSpies = (ids, count, last) => {
  const pool = ids.slice();
  const out = [];
  const before = Array.isArray(last) ? last : [];
  while (out.length < count && pool.length) {
    const w = pool.map(id => (before.indexOf(id) !== -1 ? 0.5 : 1));
    let r = Math.random() * w.reduce((a, b) => a + b, 0);
    let i = 0;
    while (i < pool.length - 1 && r >= w[i]) { r -= w[i]; i++; }
    out.push(pool.splice(i, 1)[0]);
  }
  return out;
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
    // 506: last round's spies are half as likely to be dealt it again (never impossible).
    const spies = imposterPickSpies(room.players.map(p => p.id), spyCount, room._impSpies);

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
      endsAt: null,
      // «مين يسأل مين؟» (503): the lobby's switch; an older phone sends none, and gets none.
      director: payload.director === true,
      dir: null,
      claim: false
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
    if (s.director) {
      s.dir = { turn: 0, askerId: null, targetId: null, asked: {}, targeted: {} };
      imposterDirNext(room, s.firstId);
    }
    return;
  }

  if (action === 'dirNext') {
    // The asker's «التالي» (or the host's, or anyone's once the host is away), for the pair it saw.
    if (room.phase !== 'discuss' || !s.dir) return;
    if (playerId !== s.dir.askerId) requireMoveOn(room, playerId);
    if (payload && payload.turn != null && Number(payload.turn) !== s.dir.turn) return;
    imposterDirNext(room, null);
    return;
  }

  if (action === 'spyClaim') {
    // «أنا الجاسوس» (502): a spy stops the discussion and picks the word from six.
    // Right is 3 points and the round; wrong counts as caught. Not in المختلف: nobody knows they are the odd one.
    if (room.phase !== 'discuss' || s.undercover) return;
    if ((room._impSpies || []).indexOf(playerId) === -1) throw new Error('الزرار ده للجاسوس بس');
    imposterOpenGuess(room, playerId, roomPlayerName(room, playerId), true);
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
    finishImposter(room, word === room._impSecret ? (s.claim ? 'claimed' : 'stole') : 'caught', word);
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
    // A spy named after leaving (the other spy still here) has no guess to make: caught.
    if (!room.players.some(p => p.id === accused.id)) { finishImposter(room, 'caught', null); return; }
    // المختلف: naming them ends it (the owner, 20 Sep 2026). They are holding a
    // near relative of the table's word, so picking it out of six would be free,
    // and catching them would be worth nothing. الجاسوس keeps its guess.
    if (s.undercover) { finishImposter(room, 'caught', null); return; }
    imposterOpenGuess(room, accused.id, accused.label, false);
    return;
  }
  finishImposter(room, 'escaped', null);
};

/**
 * Caught: a point to every player who voted for a spy (the owner's pick 501, 7 Oct 2026: «صوتك
 * بيتحسب»; whoever accused an innocent gets nothing), or to every player when no vote
 * decided it (a spy's «أنا الجاسوس» that missed). Escaped or guessed the word after a vote:
 * two to each spy. Guessed it of their own accord («أنا الجاسوس», 502): three to that spy.
 * Revealed: nothing.
 */
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
    const ballots = s.vote && s.vote.phase === 'results' ? (room._ballots || {}) : null;
    s.pointIds = [];
    (s.roster || []).forEach(id => {
      if (spies.indexOf(id) !== -1 || !room.players.some(p => p.id === id)) return;
      if (ballots && spies.indexOf(ballots[id]) === -1) return;
      addScore(room, id, 1);
      s.pointIds.push(id);
    });
  } else if (outcome === 'claimed') {
    if (s.guesserId) addScore(room, s.guesserId, 3);
  } else if (outcome === 'escaped' || outcome === 'stole') {
    spies.forEach(id => addScore(room, id, 2));
  }
  s.board = scoreboardOf(room);
  room.phase = 'result';
};
