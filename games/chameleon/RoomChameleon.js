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
    const words = entry.words.slice(0, CHAMELEON_GRID);
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

/** Most votes is accused; a tie lets the chameleon slip away. */
const resolveChameleonVote = (room) => {
  const s = room.shared;
  const results = s.vote.results || [];
  const top = results.reduce((m, r) => Math.max(m, r.count), 0);
  const leaders = results.filter(r => top > 0 && r.count === top);
  const accused = leaders.length === 1 ? leaders[0] : null;
  s.accusedId = accused ? accused.id : null;
  s.accusedName = accused ? accused.label : '';
  if (accused && accused.id === room._chamId) {
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
  s.board = scoreboardOf(room);
  s.phase = 'results';
};
