// Bundled into the rooms server after RoomGames.js (FILES in rooms-worker/build.mjs), whose helpers it uses.
/* ==========================================================================
   الحرباء — THE CHAMELEON (rooms)
   Sixteen words on every phone and the big screen. Everyone but the chameleon
   is told which one is secret (an index in their own secret slice); the
   chameleon's slice says only that. Clues go round in `order`, the host opens
   the vote, and a caught chameleon gets one guess at the word. The word itself
   reaches `shared` only when the round is over.
   ========================================================================== */
const CHAMELEON_GRID = 16;

const chameleonRoomAction = (room, playerId, action, payload) => {
  if (action === 'start' || action === 'nextRound') {
    requireHost(room, playerId, action === 'nextRound');
    if (room.players.length < 3) throw new Error('تحتاج 3 لاعبين على الأقل');
    const prev = room.shared || {};
    if (action === 'nextRound' && prev.phase !== 'results') return;
    const lang = roomLangOf(room, payload);
    const pool = CHAMELEON_DB[lang] || CHAMELEON_DB.ar;
    // «كلماتنا»: sixteen of the family's words (a pack of fewer isn't offered for this game).
    const family = roomPackWords(room);
    const entry = family && family.length >= CHAMELEON_GRID
      ? { category: room._pack.pack.title, words: shuffled(family).slice(0, CHAMELEON_GRID) }
      : nextPrompt(room, pool, 'cham_' + lang);
    // Shuffled at every deal (the owner's pick 511, 7 Oct 2026): a board that comes back
    // is not the same grid, so «the third one in the top row» is never remembered.
    const words = shuffled(entry.words.slice(0, CHAMELEON_GRID));
    const secret = Math.floor(Math.random() * words.length);
    const roster = room.players.map(p => p.id);
    const cham = roster[Math.floor(Math.random() * roster.length)];
    room.secrets = {};
    roster.forEach(id => { room.secrets[id] = id === cham ? { role: 'chameleon' } : { role: 'player', secret: secret }; });
    room._chamSecret = secret;
    room._chamId = cham;
    room.shared = {
      round: (prev.round || 0) + 1,
      lang: lang,
      category: entry.category,
      words: words,
      order: shuffled(roster),
      phase: 'clues',
      scores: action === 'start' ? {} : (prev.scores || {}),
      roster: roster,
      vote: null,
      outcome: null
    };
    room.shared.board = scoreboardOf(room);
    room.phase = 'play';
    return;
  }

  const s = room.shared;
  if (!s || room.phase !== 'play') throw new Error('اللعبة لم تبدأ بعد');

  if (action === 'startVote') {
    requireMoveOn(room, playerId);
    if (s.phase !== 'clues') return;
    openVote(room, room.players.filter(p => s.roster.indexOf(p.id) !== -1).map(p => ({ id: p.id, label: p.name, ownerId: p.id })), s.roster);
    s.phase = 'voting';
    return;
  }
  if (action === 'vote') {
    if (s.phase !== 'voting') throw new Error('لا يوجد تصويت الآن');
    if (castVote(room, playerId, String((payload && payload.option) || ''))) resolveChameleonVote(room);
    return;
  }
  if (action === 'closeVote') {
    requireMoveOn(room, playerId);
    if (s.phase !== 'voting') return;
    if (closeVote(room)) resolveChameleonVote(room);
    return;
  }
  if (action === 'revote') {
    // «الإعادة» (the owner's pick 512): the tied have each said one more word; the table
    // votes again between them only. Whoever of them has left is off the ballot.
    requireMoveOn(room, playerId);
    if (s.phase !== 'tiebreak') return;
    const tied = (s.tied || []).filter(id => room.players.some(p => p.id === id));
    s.revote = true;
    if (tied.length < 2) {
      if (tied.length === 1) chameleonAccuse(room, tied[0]);
      else finishChameleon(room, 'escaped', null);
      return;
    }
    openVote(room, tied.map(id => ({ id: id, label: roomPlayerName(room, id), ownerId: id })), s.roster);
    s.phase = 'voting';
    return;
  }
  if (action === 'blame') {
    // «مين فضحها؟» (the owner's pick 513): the chameleon who guessed right names whose clue
    // gave the word away (-1 and «فضحتها» on the board for the round), or nobody (id '').
    // Anyone who may move the round on can only pass it as nobody.
    if (s.phase !== 'results' || !s.blamePending) return;
    const id = String((payload && payload.id) || '');
    if (playerId !== room._chamId) {
      requireMoveOn(room, playerId);
      if (id) throw new Error('الحرباء بس تختار');
    }
    if (id && (id === room._chamId || (s.roster || []).indexOf(id) === -1 || !room.players.some(p => p.id === id))) throw new Error('اختيار غير صحيح');
    s.blamePending = false;
    s.blamedId = id || null;
    s.blamedName = id ? roomPlayerName(room, id) : '';
    if (id) addScore(room, id, -1);
    s.board = scoreboardOf(room);
    return;
  }
  if (action === 'guess') {
    if (s.phase !== 'guess') throw new Error('ليس وقت التخمين');
    if (playerId !== room._chamId) throw new Error('الحرباء فقط تخمّن');
    const i = Number(payload && payload.index);
    if (!(i >= 0 && i < s.words.length && i === Math.floor(i))) throw new Error('اختيار غير صحيح');
    finishChameleon(room, i === room._chamSecret ? 'stole' : 'caught', i);
    return;
  }
  if (action === 'skipGuess') {
    requireMoveOn(room, playerId);
    if (s.phase !== 'guess') return;
    finishChameleon(room, 'caught', null);
    return;
  }
  throw new Error('إجراء غير معروف');
};

const roomPlayerName = (room, id) => {
  const p = room.players.find(x => x.id === id);
  return p ? p.name : '';
};

/**
 * Most votes is accused. A first tie goes to «الإعادة» (512): the tied each say one more
 * word and the table votes again between them only; a second tie lets the chameleon slip away.
 */
const resolveChameleonVote = (room) => {
  const s = room.shared;
  const results = s.vote.results || [];
  const top = results.reduce((m, r) => Math.max(m, r.count), 0);
  const leaders = results.filter(r => top > 0 && r.count === top);
  if (leaders.length > 1 && !s.revote) {
    s.tied = leaders.map(r => r.id);
    s.accusedId = null;
    s.accusedName = '';
    s.phase = 'tiebreak';
    return;
  }
  chameleonAccuse(room, leaders.length === 1 ? leaders[0].id : null);
};

/** The table has named one (or nobody): a caught chameleon guesses, anyone else lets it escape. */
const chameleonAccuse = (room, accusedId) => {
  const s = room.shared;
  s.accusedId = accusedId || null;
  s.accusedName = accusedId ? roomPlayerName(room, accusedId) : '';
  if (accusedId && accusedId === room._chamId) {
    s.chameleonId = room._chamId;
    s.chameleonName = roomPlayerName(room, room._chamId);
    s.phase = 'guess';
    return;
  }
  finishChameleon(room, 'escaped', null);
};

/** Caught: a point to everyone else. Escaped or stole the word: two to the chameleon. */
const finishChameleon = (room, outcome, guessIndex) => {
  const s = room.shared;
  const cham = room._chamId;
  s.outcome = outcome;
  s.guessIndex = guessIndex;
  s.chameleonId = cham;
  s.chameleonName = roomPlayerName(room, cham);
  s.secretIndex = room._chamSecret;
  s.secretWord = s.words[room._chamSecret];
  if (outcome === 'caught') {
    s.roster.forEach(id => { if (id !== cham && room.players.some(p => p.id === id)) addScore(room, id, 1); });
  } else if (outcome !== 'revealed') {
    addScore(room, cham, 2);
  }
  // «مين فضحها؟» (513): a stolen word waits for the chameleon to name who gave it away.
  s.blamePending = outcome === 'stole' && (s.roster || []).some(id => id !== cham && room.players.some(p => p.id === id));
  s.blamedId = null;
  s.blamedName = '';
  s.board = scoreboardOf(room);
  s.phase = 'results';
};
