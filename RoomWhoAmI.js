// Bundled into the rooms server after RoomGames.js (FILES in rooms-worker/build.mjs), whose helpers it uses.
/* ==========================================================================
   من أنا؟ — WHO AM I
   Each phone shows everyone else's identity and hides its own, which is
   exactly what the sticky-note version does.
   ========================================================================== */
const WHOAMI_ORDER_POINTS = [3, 2, 1];   // the first to get it, the second, everyone after

const whoAmIAction = (room, playerId, action, payload) => {
  if (action === 'start') {
    requireHost(room, playerId);
    if (room.players.length < 2) throw new Error('تحتاج لاعبين على الأقل');

    const words = Array.isArray(payload.words) ? payload.words.slice(0, 2000) : [];
    if (words.length < room.players.length) throw new Error('الكلمات أقل من عدد اللاعبين');

    // Through the shared prompt memory (keyed on the category when the phone names it), so
    // the same characters don't come back night after night.
    const lang = payload.lang === 'en' ? 'en' : payload.lang === 'ar' ? 'ar' : 'x';
    const key = 'whoami_' + lang + '_' + (payload.cat ? String(payload.cat).slice(0, 40) : 'n' + words.length);
    const pool = nextPrompts(room, words, key, room.players.length);
    const assignments = {};
    room.players.forEach((p, i) => { assignments[p.id] = pool[i]; });

    room.secrets = {};
    room.players.forEach(p => {
      room.secrets[p.id] = {
        others: room.players
          .filter(o => o.id !== p.id)
          .map(o => ({ name: o.name, word: assignments[o.id] }))
      };
    });

    room._assignments = assignments;
    room.shared = {
      revealed: false,
      startedAt: Date.now(),
      guessed: [],
      scores: room._waScores || {},
      roster: room.players.map(p => p.id)
    };
    room.shared.board = scoreboardOf(room);
    room.phase = 'playing';
    return;
  }

  const s = room.shared;

  // "I've got it": points for the order, and the round ends by itself once everyone has.
  if (action === 'gotIt') {
    if (room.phase !== 'playing') return;
    if ((s.roster || []).indexOf(playerId) === -1) throw new Error('لست ضمن هذه الجولة');
    if (s.guessed.indexOf(playerId) !== -1) return;
    s.guessed.push(playerId);
    const at = s.guessed.length - 1;
    const points = WHOAMI_ORDER_POINTS[Math.min(at, WHOAMI_ORDER_POINTS.length - 1)];
    // Kept so the press can be taken back for exactly what it paid.
    s.awards = s.awards || {};
    s.awards[playerId] = points;
    addScore(room, playerId, points);
    s.board = scoreboardOf(room);
    if (activeRoster(room, s.roster).every(id => s.guessed.indexOf(id) !== -1)) revealWhoAmI(room);
    return;
  }

  // Pressed by mistake, or said out loud and got it wrong: the points go back
  // and the round waits for them again. Whoever pressed after them keeps what
  // they scored - being honest here shouldn't cost anyone else.
  if (action === 'notYet') {
    if (room.phase !== 'playing') return;
    const at = s.guessed.indexOf(playerId);
    if (at === -1) return;
    s.guessed.splice(at, 1);
    const paid = (s.awards || {})[playerId] || 0;
    if (paid) addScore(room, playerId, -paid);
    if (s.awards) delete s.awards[playerId];
    s.board = scoreboardOf(room);
    return;
  }

  if (action === 'reveal') {
    requireMoveOn(room, playerId);
    if (room.phase !== 'playing') return;
    revealWhoAmI(room);
    return;
  }

  if (action === 'restart') {
    requireHost(room, playerId);
    room._waScores = (s && s.scores) || room._waScores || {};
    room.phase = 'lobby';
    room.secrets = {};
    room.shared = { scores: room._waScores };
    return;
  }

  throw new Error('إجراء غير معروف');
};

const revealWhoAmI = (room) => {
  const s = room.shared;
  s.revealed = true;
  const assigned = room._assignments || {};
  s.all = room.players
    .filter(p => assigned[p.id])          // skips anyone who joined mid-game
    .map(p => ({ id: p.id, name: p.name, word: assigned[p.id], got: s.guessed.indexOf(p.id) + 1 }));
  s.board = scoreboardOf(room);
  room.phase = 'result';
};
