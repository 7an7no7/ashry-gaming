// Bundled into the rooms server after RoomGames.js (FILES in rooms-worker/build.mjs), whose helpers it uses.
/* ==========================================================================
   خمس ثواني — FIVE SECONDS
   One player at a time: a category, five seconds on the server's clock to
   name three things out loud, and the host (or the screen) says whether
   they made it. The categories are the bomb's, dealt for the whole game at
   the start.
   ========================================================================== */
const FIVE_SECONDS_MS = 5000;
const FIVE_ROUNDS = [1, 2, 3];
const FIVE_GRACE_MS = 300;

const fiveSecondsAction = (room, playerId, action, payload) => {
  if (action === 'start' || action === 'playAgain') {
    requireHost(room, playerId);
    if (room.players.length < 2) throw new Error('تحتاج لاعبين على الأقل');
    if (action === 'playAgain' && room.shared.phase !== 'gameover') return;
    const lang = roomLangOf(room, payload);
    const asked = Number(payload && payload.rounds);
    const rounds = FIVE_ROUNDS.indexOf(asked) !== -1 ? asked : (room._fiveRounds || 2);
    room._fiveRounds = rounds;
    const order = shuffled(room.players.map(p => p.id));
    const pool = BOMB_PROMPTS[lang] || BOMB_PROMPTS.ar;
    room._fiveDeck = nextPrompts(room, pool, 'five_' + lang, order.length * rounds);
    room.shared = {
      phase: 'ready', lang: lang, rounds: rounds, round: 1,
      order: order, turn: 0, scores: {}, roster: order.slice(),
      prompt: null, endsAt: null, verdict: null, lastName: ''
    };
    setFiveTurn(room);
    room.phase = 'play';
    return;
  }

  const s = room.shared;

  if (action === 'go') {
    if (s.phase !== 'ready') return;
    if (playerId !== s.turnId && playerId !== room.hostId) throw new Error('دور لاعب آخر');
    s.prompt = room._fiveDeck.length ? room._fiveDeck.shift() : (BOMB_PROMPTS[s.lang] || BOMB_PROMPTS.ar)[0];
    s.phase = 'counting';
    s.startedAt = Date.now();
    s.endsAt = s.startedAt + FIVE_SECONDS_MS;
    return;
  }

  if (action === 'judge') {
    // Once the five seconds are up (a verdict during the count was a double tap on the
    // last turn's, landing on the next player's), and for the turn the phone saw
    // (`turn`: the round and the place in the order; optional, for an older phone).
    requireMoveOn(room, playerId);
    if (s.phase !== 'judging') return;
    if (staleTap(payload, 'turn', s.round + '.' + s.turn)) return;
    const ok = !!(payload && payload.ok);
    if (ok) addScore(room, s.turnId, 1);
    s.verdict = ok;
    s.lastName = s.turnName;
    s.lastPrompt = s.prompt;
    advanceFive(room);
    return;
  }

  if (action === 'skipTurn') {
    requireMoveOn(room, playerId);
    if (s.phase !== 'ready') return;
    // The player the host meant to skip: a double tap must not skip the next one too.
    if (staleTap(payload, 'turnId', s.turnId)) return;
    advanceFive(room);
    return;
  }

  throw new Error('إجراء غير معروف');
};

const setFiveTurn = (room) => {
  const s = room.shared;
  s.turnId = s.order[s.turn];
  s.turnName = roomPlayerName(room, s.turnId);
  s.prompt = null;
  s.endsAt = null;
  s.phase = 'ready';
  s.board = scoreboardOf(room);
};

/** The next player up who is still in the room; after the last round, the end. */
const advanceFive = (room) => {
  const s = room.shared;
  for (let guard = 0; guard <= s.order.length * s.rounds; guard++) {
    s.turn += 1;
    if (s.turn >= s.order.length) { s.turn = 0; s.round += 1; }
    if (s.round > s.rounds) break;
    if (room.players.some(p => p.id === s.order[s.turn])) { setFiveTurn(room); return; }
  }
  s.phase = 'gameover';
  s.turnId = null;
  s.turnName = '';
  s.prompt = null;
  s.endsAt = null;
  s.board = scoreboardOf(room);
};
