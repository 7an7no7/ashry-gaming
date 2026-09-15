/* ============================================================================
   ROOM GAME RULES
   ----------------------------------------------------------------------------
   One branch per game, all reached through applyRoomAction. The room server
   (rooms-worker/) never needs to know what any of these games are.

   The rule that shapes everything here: anything a player must not see goes in
   `room.secrets[playerId]`, which the server only ever sends back to that one
   player. `room.shared` goes to everybody. So a Codenames operative cannot read
   the key card out of a network response, and an imposter's word never reaches
   the other phones.
   ========================================================================= */

const shuffled = (arr) => {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = out[i]; out[i] = out[j]; out[j] = tmp;
  }
  return out;
};

const requireHost = (room, playerId) => {
  if (room.hostId !== playerId) throw new Error('المضيف فقط يمكنه فعل ذلك');
};

/**
 * Clears a game down to nothing, but remembers the sides people picked.
 * Boards and keys must never survive; team assignments are tedious to redo, so
 * they're stashed and offered back if the room returns to Codenames.
 */
const clearGameState = (room) => {
  if (room.shared && room.shared.teams) room._teamsMemo = room.shared.teams;
  // Codenames' options and the evening's score come back with the teams.
  if (room.game === 'codenames' && room.shared) {
    room._cnMemo = { settings: room.shared.settings || null, wins: room.shared.wins || null };
  }
  room.shared = {};
  room.secrets = {};
  // Every piece of server-side scratch, or the previous game's answer survives
  // into the next one.
  room._key = null;
  room._assignments = null;
  room._clueText = null;
  room._truth = null;
  room._lies = null;
  room._word = null;
  room._ballots = null;
  room._fakeId = null;
  room._target = null;
  room._deck = null;
  room._qIdx = null;
  room._currentQ = null;
  room._answers = null;
  room._qStart = null;
  room._triviaCount = null;
};

/** The stashed sides, minus anyone who has since left. */
const rememberedTeams = (room) => {
  if (!room._teamsMemo) return null;
  const present = room.players.map(p => p.id);
  const kept = {};
  Object.keys(room._teamsMemo).forEach(id => {
    if (present.indexOf(id) !== -1) kept[id] = room._teamsMemo[id];
  });
  return Object.keys(kept).length ? kept : null;
};

const ROOM_GAME_IDS = [
  'imposter', 'justone', 'whoami', 'codenames',
  'wouldyou', 'mostlikely', 'fibbage', 'drawguess',
  'fakeartist', 'wavelength', 'trivia'
];

// Must match MAX_PLAYERS and MAX_SCREENS in rooms-worker/src/room.js.
const ROOM_MAX_PLAYERS = 12;
const ROOM_MAX_SCREENS = 3;

const applyRoomAction = (room, playerId, action, payload) => {
  // Room-level actions come first: they're about the group, not the game.

  // A device switches between playing and showing the room on a big screen.
  // Between games only: in the middle of a round a player may hold a card.
  if (action === 'becomeScreen' || action === 'becomePlayer') {
    if (room.phase !== 'lobby') throw new Error('غيّر نوع الجهاز بين الجولات');
    room.screens = room.screens || [];
    if (action === 'becomeScreen') {
      if (!room.players.some(p => p.id === playerId)) return;          // already a screen
      if (room.screens.length >= ROOM_MAX_SCREENS) throw new Error('اكتمل عدد الشاشات في الغرفة');
      room.players = room.players.filter(p => p.id !== playerId);
      room.screens.push({ id: playerId });
      if (room.shared && room.shared.teams) delete room.shared.teams[playerId];
      return;
    }
    if (!room.screens.some(s => s.id === playerId)) return;              // already a player
    const name = String((payload && payload.name) || '').trim().slice(0, 24);
    if (!name) throw new Error('اكتب اسمك أولاً');
    if (room.players.length >= ROOM_MAX_PLAYERS) throw new Error('الغرفة ممتلئة');
    if (room.players.some(p => p.name.toLowerCase() === name.toLowerCase())) {
      throw new Error('الاسم مستخدم بالفعل في هذه الغرفة');
    }
    room.screens = room.screens.filter(s => s.id !== playerId);
    room.players.push({ id: playerId, name: name });
    return;
  }

  if (action === 'chooseGame') {
    requireHost(room, playerId);
    const game = String(payload.game || '');
    if (ROOM_GAME_IDS.indexOf(game) === -1) throw new Error('لعبة غير معروفة');

    clearGameState(room);
    room.game = game;
    room.phase = 'lobby';

    if (game === 'codenames') {
      const teams = rememberedTeams(room);
      if (teams) room.shared.teams = teams;
      if (room._cnMemo && room._cnMemo.settings) room.shared.settings = room._cnMemo.settings;
      if (room._cnMemo && room._cnMemo.wins) room.shared.wins = room._cnMemo.wins;
    }
    return;
  }

  if (action === 'backToHub') {
    requireHost(room, playerId);
    clearGameState(room);
    room.game = null;
    room.phase = 'lobby';
    return;
  }

  if (!room.game) throw new Error('اختر لعبة أولاً');

  // Dealing happens once. Without this a second 'start' - a double tap either
  // side of the round trip, or a retry - re-deals a game already under way.
  if (action === 'start' && room.phase !== 'lobby') {
    throw new Error('اللعبة بدأت بالفعل');
  }

  switch (room.game) {
    case 'imposter':  imposterAction(room, playerId, action, payload); break;
    case 'justone':   justOneAction(room, playerId, action, payload); break;
    case 'whoami':    whoAmIAction(room, playerId, action, payload); break;
    case 'codenames': codenamesAction(room, playerId, action, payload); break;
    case 'wouldyou':   wouldYouRatherAction(room, playerId, action, payload); break;
    case 'mostlikely': mostLikelyAction(room, playerId, action, payload); break;
    case 'fibbage':    fibbageAction(room, playerId, action, payload); break;
    case 'drawguess':  drawGuessAction(room, playerId, action, payload); break;
    case 'fakeartist': fakeArtistAction(room, playerId, action, payload); break;
    case 'wavelength': wavelengthAction(room, playerId, action, payload); break;
    case 'trivia':     triviaAction(room, playerId, action, payload); break;
    default: throw new Error('لعبة غير معروفة');
  }

  // Whoever is present when a game is dealt is in it. This can't be inferred
  // from secrets — a Codenames operative and a Just One guesser both have none.
  if ((action === 'start' || action === 'nextRound') && room.shared && !room.shared.roster) {
    room.shared.roster = room.players.map(p => p.id);
  }
};

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
  const words = (getSpyData()[String(category || '')] || []).slice();
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

const imposterAction = (room, playerId, action, payload) => {
  if (action === 'start') {
    requireHost(room, playerId);
    if (room.players.length < 3) throw new Error('تحتاج 3 لاعبين على الأقل');

    const category = String(payload.category || '');
    const words = spyWords(category);
    if (!words.length) throw new Error('اختر مجموعة كلمات');

    const secret = words[Math.floor(Math.random() * words.length)];
    const spyCount = Math.max(1, Math.min(Number(payload.spies) || 1, room.players.length - 2));
    const order = shuffled(room.players.map(p => p.id));
    const spies = order.slice(0, spyCount);

    room.secrets = {};
    room.players.forEach(p => {
      const isSpy = spies.indexOf(p.id) !== -1;
      room.secrets[p.id] = {
        role: isSpy ? 'spy' : 'player',
        word: isSpy ? null : secret,
        category: category
      };
    });

    room.shared = { category: category, spyCount: spyCount, revealed: false };
    room.phase = 'reveal';
    return;
  }

  if (action === 'beginDiscussion') {
    requireHost(room, playerId);
    room.phase = 'discuss';
    room.shared.startedAt = Date.now();
    return;
  }

  if (action === 'revealResult') {
    requireHost(room, playerId);
    // Only now does the answer become public.
    const anyPlayer = room.players.find(p => room.secrets[p.id] && room.secrets[p.id].role === 'player');
    room.shared.revealed = true;
    room.shared.secretWord = anyPlayer ? room.secrets[anyPlayer.id].word : null;
    room.shared.spies = room.players
      .filter(p => room.secrets[p.id] && room.secrets[p.id].role === 'spy')
      .map(p => p.name);
    room.phase = 'result';
    return;
  }

  if (action === 'restart') {
    requireHost(room, playerId);
    room.phase = 'lobby';
    room.secrets = {};
    room.shared = {};
    return;
  }

  throw new Error('إجراء غير معروف');
};

/* ==========================================================================
   كلمة واحدة — JUST ONE
   The reason to play this on phones: every clue is written at the same time
   instead of passing the device around one writer at a time.
   ========================================================================== */
const justOneAction = (room, playerId, action, payload) => {
  if (action === 'start' || action === 'nextRound') {
    requireHost(room, playerId);
    if (room.players.length < 3) throw new Error('تحتاج 3 لاعبين على الأقل');

    const prev = room.shared || {};
    const roundNo = (prev.round || 0) + 1;
    // Deals against whoever is present right now; the roster is stamped after.
    const guesserIndex = (roundNo - 1) % room.players.length;
    const guesser = room.players[guesserIndex];

    const words = payload.words && payload.words.length
      ? payload.words
      : unlockedSpyWords();
    const secret = words[Math.floor(Math.random() * words.length)];

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
      clues: [],            // {playerId, name} only — text stays hidden until reveal
      submitted: [],
      phase: 'writing'
    };
    room._clueText = {};    // server-side scratch, never projected
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

    room._clueText = room._clueText || {};
    room._clueText[playerId] = clue;
    if (s.submitted.indexOf(playerId) === -1) s.submitted.push(playerId);

    // Once every writer is in, drop the duplicates and hand it to the guesser.
    // Roster, not room.players: someone who joined mid-round isn't a writer and
    // must not hold the round open.
    const writers = activeRoster(room, s.roster).filter(id => id !== s.guesserId);
    if (writers.every(id => s.submitted.indexOf(id) !== -1)) {
      const counts = {};
      writers.forEach(id => {
        const norm = normaliseClue(room._clueText[id]);
        counts[norm] = (counts[norm] || 0) + 1;
      });
      s.clues = writers.map(id => {
        const text = room._clueText[id] || '';
        const dup = counts[normaliseClue(text)] > 1;
        const writer = room.players.find(p => p.id === id);
        return { name: writer ? writer.name : '', text: text, removed: dup };
      });
      s.removedCount = s.clues.filter(c => c.removed).length;
      s.phase = 'guessing';
      room.phase = 'guessing';
    }
    return;
  }

  if (action === 'submitGuess') {
    const s = room.shared;
    if (playerId !== s.guesserId) throw new Error('المخمّن فقط');
    if (s.phase !== 'guessing') throw new Error('لم يحن وقت التخمين');

    s.guess = String(payload.guess || '').trim().slice(0, 40);
    s.phase = 'judging';
    room.phase = 'judging';

    // Safe to publish the answer now that the guess is locked in. Read it from
    // a player who actually holds a secret — "any player who isn't the guesser"
    // could be someone who joined mid-round and has none.
    const holder = room.players.find(p =>
      p.id !== s.guesserId && room.secrets[p.id] && room.secrets[p.id].word);
    s.secretWord = holder ? room.secrets[holder.id].word : null;
    return;
  }

  if (action === 'judge') {
    requireHost(room, playerId);
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

/** Duplicate detection ignores case, tatweel and Arabic diacritics. */
const normaliseClue = (text) =>
  String(text || '')
    .toLowerCase()
    .replace(/[ً-ْـ]/g, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/\s+/g, '')
    .trim();

/* ==========================================================================
   من أنا؟ — WHO AM I
   Each phone shows everyone else's identity and hides its own, which is
   exactly what the sticky-note version does.
   ========================================================================== */
const whoAmIAction = (room, playerId, action, payload) => {
  if (action === 'start') {
    requireHost(room, playerId);
    if (room.players.length < 2) throw new Error('تحتاج لاعبين على الأقل');

    const pool = (payload.words && payload.words.length) ? shuffled(payload.words) : [];
    if (pool.length < room.players.length) throw new Error('الكلمات أقل من عدد اللاعبين');

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
    room.shared = { revealed: false, startedAt: Date.now() };
    room.phase = 'playing';
    return;
  }

  if (action === 'reveal') {
    requireHost(room, playerId);
    room.shared.revealed = true;
    const assigned = room._assignments || {};
    room.shared.all = room.players
      .filter(p => assigned[p.id])          // skips anyone who joined mid-game
      .map(p => ({ name: p.name, word: assigned[p.id] }));
    room.phase = 'result';
    return;
  }

  if (action === 'restart') {
    requireHost(room, playerId);
    room.phase = 'lobby';
    room.secrets = {};
    room.shared = {};
    return;
  }

  throw new Error('إجراء غير معروف');
};

/* ==========================================================================
   أسماء الرموز — CODENAMES
   The board is public; the key card goes only to the two spymasters. That
   split is the game, and it is why it needs separate devices.
   ========================================================================== */
const CODENAMES_LAYOUT = { first: 9, second: 8, neutral: 7, assassin: 1 };  // 25
// Seconds a spymaster has for the clue, and the team again for its guesses. 0: no clock.
const CODENAMES_TIMERS = [0, 60, 90, 120, 180];
const CODENAMES_MAX_CUSTOM = 60;
// guessesLeft after a clue of 0 or ∞: the team goes on until it misses or passes.
const CODENAMES_UNLIMITED = -1;
// A move sent as the clock hits zero is still on its way; after this the server passes the turn.
const CODENAMES_GRACE_MS = 1500;

/** A device showing the room on a big screen instead of playing in it. */
const isRoomScreen = (room, id) => (room.screens || []).some(s => s.id === id);

/** The host's choices, with anything missing or out of range put back to the default. */
const codenamesSettings = (room) => {
  const s = (room.shared && room.shared.settings) || {};
  return {
    timer: CODENAMES_TIMERS.indexOf(s.timer) !== -1 ? s.timer : 0,
    rotate: s.rotate !== false,
    custom: Array.isArray(s.custom) ? s.custom.slice(0, CODENAMES_MAX_CUSTOM) : []
  };
};

/** The room's own words: split on lines and commas, trimmed, each spelling once. */
const parseCodenamesWords = (raw) => {
  const list = Array.isArray(raw) ? raw : String(raw || '').split(/[\n,،]+/);
  const seen = {};
  const out = [];
  list.forEach(item => {
    const word = String(item || '').trim().slice(0, 24);
    const key = normaliseClue(word);
    if (!key || seen[key]) return;
    seen[key] = true;
    out.push(word);
  });
  return out.slice(0, CODENAMES_MAX_CUSTOM);
};

const codenamesAction = (room, playerId, action, payload) => {
  const s = room.shared;
  const teamOf = (id) => (s.teams || {})[id] || null;
  const cardAt = (index) => {
    const idx = Number(index);
    const cell = Number.isInteger(idx) && s.board ? s.board[idx] : null;
    if (!cell || cell.revealed) throw new Error('اختر بطاقة أخرى');
    return { idx: idx, cell: cell };
  };

  if (action === 'setTeam') {
    // Lobby only. Switching mid-game would hand someone the spymaster slot
    // without the key and leave the real spymaster unable to give clues.
    if (room.phase !== 'lobby') throw new Error('لا يمكن تغيير الفريق بعد بدء اللعبة');
    if (isRoomScreen(room, playerId)) throw new Error('شاشة العرض لا تنضم لفريق');
    const team = payload.team === 'blue' ? 'blue' : 'red';
    const role = payload.role === 'spymaster' ? 'spymaster' : 'operative';
    s.teams = s.teams || {};

    if (role === 'spymaster') {
      const clash = Object.keys(s.teams).find(id =>
        id !== playerId &&
        s.teams[id].team === team &&
        s.teams[id].role === 'spymaster');
      if (clash) throw new Error('يوجد قائد لهذا الفريق بالفعل');
    }
    s.teams[playerId] = { team: team, role: role };
    return;
  }

  if (action === 'shuffleTeams') {
    requireHost(room, playerId);
    if (room.phase !== 'lobby') throw new Error('لا يمكن تغيير الفريق بعد بدء اللعبة');
    // Alternating down a shuffled list keeps the sides within one of each
    // other; the first player dealt to each side leads it.
    s.teams = {};
    shuffled(room.players.map(p => p.id)).forEach((id, i) => {
      s.teams[id] = { team: i % 2 === 0 ? 'red' : 'blue', role: i < 2 ? 'spymaster' : 'operative' };
    });
    return;
  }

  if (action === 'setOptions') {
    requireHost(room, playerId);
    if (room.phase !== 'lobby') throw new Error('غيّر الإعدادات قبل بدء اللعبة');
    const settings = codenamesSettings(room);
    if (payload.timer !== undefined) {
      const timer = Number(payload.timer);
      if (CODENAMES_TIMERS.indexOf(timer) === -1) throw new Error('وقت غير صحيح');
      settings.timer = timer;
    }
    if (payload.rotate !== undefined) settings.rotate = !!payload.rotate;
    if (payload.custom !== undefined) settings.custom = parseCodenamesWords(payload.custom);
    s.settings = settings;
    return;
  }

  if (action === 'start') {
    requireHost(room, playerId);
    const teams = s.teams || {};
    const of = (team, role) => room.players.filter(p =>
      teams[p.id] && teams[p.id].team === team && teams[p.id].role === role);

    if (!of('red', 'spymaster').length || !of('blue', 'spymaster').length) {
      throw new Error('كل فريق يحتاج قائداً');
    }
    if (!of('red', 'operative').length || !of('blue', 'operative').length) {
      throw new Error('كل فريق يحتاج لاعباً واحداً على الأقل');
    }

    const lang = payload.lang === 'en' ? 'en' : 'ar';
    const settings = codenamesSettings(room);
    // The room's own words go on first and the list fills the rest. Words from
    // the last boards sit out until the list has gone round.
    const own = shuffled(settings.custom).slice(0, 25);
    const taken = {};
    own.forEach(w => { taken[normaliseClue(w)] = true; });
    const fill = nextPrompts(room, CODENAMES_WORDS[lang], 'codenames_' + lang, 25)
      .filter(w => !taken[normaliseClue(w)]);
    const words = shuffled(own.concat(fill).slice(0, 25));

    const startingTeam = Math.random() < 0.5 ? 'red' : 'blue';
    const other = startingTeam === 'red' ? 'blue' : 'red';
    const roles = []
      .concat(newArray(CODENAMES_LAYOUT.first, startingTeam))
      .concat(newArray(CODENAMES_LAYOUT.second, other))
      .concat(newArray(CODENAMES_LAYOUT.neutral, 'neutral'))
      .concat(newArray(CODENAMES_LAYOUT.assassin, 'assassin'));
    const key = shuffled(roles);

    room._key = key;
    room.shared = {
      teams: teams,
      settings: settings,
      wins: s.wins || { red: 0, blue: 0 },
      // Tells the phones this is a new board, so they forget the last one.
      dealtAt: Date.now(),
      board: words.map(w => ({ word: w, revealed: false })),
      turn: startingTeam,
      startingTeam: startingTeam,
      lang: lang,
      clue: null,
      guessesLeft: 0,
      marks: {},
      remaining: {
        red: startingTeam === 'red' ? CODENAMES_LAYOUT.first : CODENAMES_LAYOUT.second,
        blue: startingTeam === 'blue' ? CODENAMES_LAYOUT.first : CODENAMES_LAYOUT.second
      },
      winner: null,
      log: []
    };
    startCodenamesClock(room);

    // Only the two spymasters ever receive the key.
    room.secrets = {};
    room.players.forEach(p => {
      const t = teams[p.id];
      room.secrets[p.id] = (t && t.role === 'spymaster') ? { key: key } : null;
    });

    room.phase = 'playing';
    return;
  }

  if (action === 'giveClue') {
    const t = teamOf(playerId);
    if (!t || t.role !== 'spymaster') throw new Error('القائد فقط يعطي التلميح');
    if (t.team !== s.turn) throw new Error('ليس دور فريقك');
    if (s.winner) throw new Error('انتهت اللعبة');
    if (s.clue) throw new Error('التلميح معطى بالفعل');

    const word = String(payload.word || '').trim().slice(0, 24);
    if (!word) throw new Error('اكتب التلميح');
    const folded = normaliseClue(word);
    if (s.board.some(c => !c.revealed && normaliseClue(c.word) === folded)) {
      throw new Error('التلميح لا يمكن أن يكون كلمة على اللوحة');
    }
    const count = payload.count === 'inf'
      ? 'inf'
      : Math.max(0, Math.min(Math.floor(Number(payload.count) || 0), 9));

    s.clue = { word: word, count: count, team: t.team };
    // The classic +1: a team may always risk one extra guess. A clue of 0 or ∞
    // has no limit at all - the team goes on until it misses or passes.
    s.guessesLeft = (count === 'inf' || count === 0) ? CODENAMES_UNLIMITED : count + 1;
    s.marks = {};
    s.log.push({ type: 'clue', team: t.team, word: word, count: count });
    startCodenamesClock(room);
    return;
  }

  if (action === 'mark') {
    // "I think it's this one": public, so the team can see where it agrees
    // before anyone commits to a card.
    const t = teamOf(playerId);
    if (!t || t.role !== 'operative' || t.team !== s.turn) throw new Error('ليس دور فريقك');
    if (!s.clue || s.winner) throw new Error('انتظر تلميح القائد');
    const { idx } = cardAt(payload.index);
    s.marks = s.marks || {};
    const now = s.marks[idx] || [];
    const on = payload.on === undefined ? now.indexOf(playerId) === -1 : !!payload.on;
    const next = now.filter(id => id !== playerId);
    if (on) next.push(playerId);
    if (next.length) s.marks[idx] = next;
    else delete s.marks[idx];
    return;
  }

  if (action === 'guess') {
    // A big screen guesses for whichever team is up: the team gathered at the TV.
    const t = isRoomScreen(room, playerId) ? { team: s.turn, role: 'operative' } : teamOf(playerId);
    if (!t || t.role !== 'operative') throw new Error('اللاعبون فقط يخمنون');
    if (t.team !== s.turn) throw new Error('ليس دور فريقك');
    if (!s.clue) throw new Error('انتظر تلميح القائد');
    if (s.winner) throw new Error('انتهت اللعبة');

    const { idx, cell } = cardAt(payload.index);
    const colour = room._key[idx];
    cell.revealed = true;
    cell.colour = colour;
    if (s.marks) delete s.marks[idx];
    s.log.push({ type: 'guess', team: t.team, word: cell.word, colour: colour });

    if (colour === 'assassin') {
      finishCodenames(room, t.team === 'red' ? 'blue' : 'red', 'assassin');
      return;
    }

    if (colour === 'red' || colour === 'blue') {
      s.remaining[colour] = Math.max(0, s.remaining[colour] - 1);
      if (s.remaining[colour] === 0) {
        finishCodenames(room, colour, 'cleared');
        return;
      }
    }

    // A wrong card - neutral or the other team's - ends the turn immediately.
    if (colour !== t.team) {
      endCodenamesTurn(room);
      return;
    }

    if (s.guessesLeft === CODENAMES_UNLIMITED) return;
    s.guessesLeft--;
    if (s.guessesLeft <= 0) endCodenamesTurn(room);
    return;
  }

  if (action === 'endTurn') {
    const t = isRoomScreen(room, playerId) ? { team: s.turn } : teamOf(playerId);
    if (!t || t.team !== s.turn) throw new Error('ليس دور فريقك');
    if (s.winner) throw new Error('انتهت اللعبة');
    // Passing before the clue is given would let a team skip its whole turn.
    if (!s.clue) throw new Error('انتظر تلميح القائد');
    endCodenamesTurn(room);
    return;
  }

  if (action === 'swapWord') {
    // For a word nobody at the table knows. Only before the first clue: after
    // that a spymaster may already be building on it.
    const t = teamOf(playerId);
    if (room.hostId !== playerId && !(t && t.role === 'spymaster')) {
      throw new Error('المضيف أو القائد فقط يبدّل الكلمات');
    }
    if (s.winner || (s.log || []).length) throw new Error('التبديل قبل أول تلميح فقط');
    const { cell } = cardAt(payload.index);
    const onBoard = {};
    s.board.forEach(c => { onBoard[normaliseClue(c.word)] = true; });
    const choices = (CODENAMES_WORDS[s.lang] || CODENAMES_WORDS.ar).filter(w => !onBoard[normaliseClue(w)]);
    if (!choices.length) throw new Error('لا توجد كلمات أخرى');
    cell.word = choices[Math.floor(Math.random() * choices.length)];
    return;
  }

  if (action === 'restart') {
    requireHost(room, playerId);
    const teams = s.teams || {};
    const settings = codenamesSettings(room);
    if (settings.rotate) rotateSpymasters(room, teams);
    room.phase = 'lobby';
    room.secrets = {};
    // The sides, the options and the evening's score carry over.
    room.shared = { teams: teams, settings: settings, wins: s.wins || { red: 0, blue: 0 } };
    room._key = null;
    return;
  }

  throw new Error('إجراء غير معروف');
};

const newArray = (n, value) => {
  const out = [];
  for (let i = 0; i < n; i++) out.push(value);
  return out;
};

/** Starts the clock on whatever the team does next: its clue, or its guesses. */
const startCodenamesClock = (room) => {
  const timer = codenamesSettings(room).timer;
  room.shared.endsAt = timer ? Date.now() + timer * 1000 : null;
};

const endCodenamesTurn = (room) => {
  const s = room.shared;
  s.turn = s.turn === 'red' ? 'blue' : 'red';
  s.clue = null;
  s.guessesLeft = 0;
  s.marks = {};
  startCodenamesClock(room);
};

const finishCodenames = (room, winner, reason) => {
  const s = room.shared;
  s.winner = winner;
  s.endReason = reason;
  s.endsAt = null;
  s.marks = {};
  s.wins = s.wins || { red: 0, blue: 0 };
  s.wins[winner] = (s.wins[winner] || 0) + 1;
  room.phase = 'over';
  revealWholeKey(room);
};

/** Next game: on each side with two or more players, the next one leads. */
const rotateSpymasters = (room, teams) => {
  ['red', 'blue'].forEach(team => {
    const members = room.players.map(p => p.id).filter(id => teams[id] && teams[id].team === team);
    if (members.length < 2) return;
    const current = members.findIndex(id => teams[id].role === 'spymaster');
    members.forEach(id => { teams[id] = { team: team, role: 'operative' }; });
    teams[members[(current + 1) % members.length]].role = 'spymaster';
  });
};

/** At game end the key becomes public so everyone can see the full board. */
const revealWholeKey = (room) => {
  room.shared.board.forEach((cell, i) => { cell.colour = room._key[i]; });
};

/* ==========================================================================
   VOTING ENGINE
   --------------------------------------------------------------------------
   Shared by لو خيروك, مين أكثر واحد and فيبج. Three games, one implementation.

   The rule that makes voting work: **who** voted is public, **what** they voted
   for is not — until the round closes. Choices live in `room._ballots`, which is
   server-side scratch and never projected, so a phone cannot see the tally
   forming and change its mind accordingly.
   ========================================================================== */

/**
 * Opens a vote.
 *   options   [{ id, label, ownerId? }]  ownerId marks whose answer it is, so a
 *                                        player can be stopped from voting for
 *                                        their own (Fibbage).
 *   eligible  player ids allowed to vote; defaults to the whole roster.
 */
const openVote = (room, options, eligible) => {
  room._ballots = {};
  room.shared.vote = {
    options: options,
    eligible: eligible || room.players.map(p => p.id),
    voted: [],
    phase: 'voting',
    results: null
  };
};

const castVote = (room, playerId, optionId) => {
  const v = room.shared.vote;
  if (!v || v.phase !== 'voting') throw new Error('لا يوجد تصويت الآن');
  if (v.eligible.indexOf(playerId) === -1) throw new Error('لست ضمن هذه الجولة');

  const option = v.options.find(o => o.id === optionId);
  if (!option) throw new Error('اختيار غير صحيح');
  if (option.ownerId && option.ownerId === playerId) {
    throw new Error('لا يمكنك التصويت لإجابتك');
  }

  room._ballots = room._ballots || {};
  room._ballots[playerId] = optionId;
  if (v.voted.indexOf(playerId) === -1) v.voted.push(playerId);

  // Close once everyone still in the room has voted. Someone whose phone died
  // must not hold the round open forever.
  const waitingOn = activeRoster(room, v.eligible);
  if (waitingOn.every(id => v.voted.indexOf(id) !== -1)) closeVote(room);
  return v.phase === 'results';
};

/** Tallies and publishes. Only now do the individual choices become visible. */
const closeVote = (room) => {
  const v = room.shared.vote;
  // Returns false when there was nothing to close, so callers don't score a
  // round twice — the host's close button can arrive after the auto-close.
  if (!v || v.phase === 'results') return false;
  const ballots = room._ballots || {};
  const nameOf = (id) => {
    const p = room.players.find(x => x.id === id);
    return p ? p.name : '';
  };

  v.results = v.options.map(o => {
    const voters = Object.keys(ballots).filter(pid => ballots[pid] === o.id);
    return {
      id: o.id,
      label: o.label,
      ownerId: o.ownerId || null,
      count: voters.length,
      voters: voters.map(nameOf)
    };
  });
  v.totalVotes = Object.keys(ballots).length;
  v.phase = 'results';
  return true;
};

/** Running scoreboard, kept across rounds of the same game. */
const addScore = (room, playerId, points) => {
  room.shared.scores = room.shared.scores || {};
  room.shared.scores[playerId] = (room.shared.scores[playerId] || 0) + points;
};

const scoreboardOf = (room) =>
  room.players
    .map(p => ({ name: p.name, id: p.id, score: (room.shared.scores || {})[p.id] || 0 }))
    .sort((a, b) => b.score - a.score);

/**
 * Pulls a prompt that hasn't been dealt lately, reshuffling once a pool is exhausted.
 *
 * The history is kept per pool: indices into the Would You Rather list mean
 * nothing in the Most Likely To list, and sharing one list made switching games
 * skip prompts that had never been shown.
 */
/*
 * What has been dealt is remembered across all rooms, not per room: a room only
 * lasts an evening, and its history used to go with it, so the next evening's
 * room started every list from the top again. The calls below are Apps Script's
 * Script Properties; rooms-worker/build.mjs points them at the PromptMemory
 * Durable Object. Each list is stored as "length|i,j,k": once a list is edited
 * its length changes and it starts over, rather than trusting indices that now
 * point at different prompts.
 */
const SEEN_PROPERTY_PREFIX = 'seen_';

const readSeen = (key, size) => {
  try {
    const raw = PropertiesService.getScriptProperties().getProperty(SEEN_PROPERTY_PREFIX + key);
    if (!raw) return null;
    const bar = raw.indexOf('|');
    if (Number(raw.slice(0, bar)) !== size) return [];
    const rest = raw.slice(bar + 1);
    return rest ? rest.split(',').map(Number) : [];
  } catch (e) {
    return null;   // Properties unavailable: the room's own memory still works
  }
};

const writeSeen = (key, size, used) => {
  try {
    PropertiesService.getScriptProperties().setProperty(SEEN_PROPERTY_PREFIX + key, size + '|' + used.join(','));
  } catch (e) {}
};

/**
 * Deals `count` prompts from `pool` that haven't been dealt lately, starting the
 * list over once all of it has been used. One read and one write however many
 * are dealt, since each Properties call is a round trip.
 */
const nextPrompts = (room, pool, poolKey, count) => {
  const key = poolKey || ('pool' + pool.length);
  room._used = room._used || {};
  // Older rooms may hold an array from before this was keyed.
  if (Array.isArray(room._used)) room._used = {};

  let used = readSeen(key, pool.length) || room._used[key] || [];
  const picks = [];
  const want = Math.min(count, pool.length);
  for (let n = 0; n < want; n++) {
    if (used.length >= pool.length) used = [];
    const taken = {};
    used.forEach(i => { taken[i] = true; });
    picks.forEach(i => { taken[i] = true; });
    const open = [];
    for (let i = 0; i < pool.length; i++) if (!taken[i]) open.push(i);
    const idx = open.length ? open[Math.floor(Math.random() * open.length)] : Math.floor(Math.random() * pool.length);
    picks.push(idx);
    used.push(idx);
  }
  room._used[key] = used;
  writeSeen(key, pool.length, used);
  return picks.map(i => pool[i]);
};

/** A single prompt; see nextPrompts. */
const nextPrompt = (room, pool, poolKey) => nextPrompts(room, pool, poolKey, 1)[0];

/** Roster members who are still in the room — used for "has everyone answered?". */
const activeRoster = (room, roster) => {
  const present = room.players.map(p => p.id);
  return (roster || present).filter(id => present.indexOf(id) !== -1);
};

/* ==========================================================================
   لو خيروك — WOULD YOU RATHER
   No scoring; the point is the argument afterwards.
   ========================================================================== */
const wouldYouRatherAction = (room, playerId, action, payload) => {
  if (action === 'start' || action === 'nextRound') {
    requireHost(room, playerId);
    if (room.players.length < 2) throw new Error('تحتاج لاعبين على الأقل');

    const lang = payload.lang === 'en' ? 'en' : 'ar';
    const pair = nextPrompt(room, WOULD_YOU_RATHER[lang], 'wyr_' + lang);
    const round = ((room.shared && room.shared.round) || 0) + 1;

    room.secrets = {};
    room.shared = { round: round, lang: lang };
    openVote(room, [
      { id: 'a', label: pair[0] },
      { id: 'b', label: pair[1] }
    ]);
    room.phase = 'voting';
    return;
  }

  if (action === 'vote') { castVote(room, playerId, String(payload.option || '')); return; }
  if (action === 'closeVote') { requireHost(room, playerId); closeVote(room); return; }

  throw new Error('إجراء غير معروف');
};

/* ==========================================================================
   مين أكثر واحد — MOST LIKELY TO
   The options are the players, so the ballot is built from the room itself.
   ========================================================================== */
const mostLikelyAction = (room, playerId, action, payload) => {
  if (action === 'start' || action === 'nextRound') {
    requireHost(room, playerId);
    if (room.players.length < 3) throw new Error('تحتاج 3 لاعبين على الأقل');

    const lang = payload.lang === 'en' ? 'en' : 'ar';
    const prompt = nextPrompt(room, MOST_LIKELY_TO[lang], 'mlt_' + lang);
    const round = ((room.shared && room.shared.round) || 0) + 1;
    const scores = (room.shared && room.shared.scores) || {};

    room.secrets = {};
    room.shared = { round: round, lang: lang, prompt: prompt, scores: scores };
    openVote(room, room.players.map(p => ({ id: p.id, label: p.name })));
    room.phase = 'voting';
    return;
  }

  if (action === 'vote') {
    if (castVote(room, playerId, String(payload.option || ''))) scoreMostLikely(room);
    return;
  }

  if (action === 'closeVote') {
    requireHost(room, playerId);
    if (closeVote(room)) scoreMostLikely(room);
    return;
  }

  throw new Error('إجراء غير معروف');
};

/** Whoever the room picked takes the point; a tie shares it. */
const scoreMostLikely = (room) => {
  const results = room.shared.vote.results || [];
  const top = Math.max(0, ...results.map(r => r.count));
  if (top > 0) results.filter(r => r.count === top).forEach(r => addScore(room, r.id, 1));
  room.shared.board = scoreboardOf(room);
  room.shared.phase = 'results';
};

/* ==========================================================================
   فيبج — FIBBAGE
   Everyone invents a fake answer, then the room votes on the pile with the
   real answer hidden among them. Points for spotting the truth, and for every
   person your lie caught.
   ========================================================================== */
const FIBBAGE_TRUTH_POINTS = 1000;
const FIBBAGE_FOOL_POINTS = 500;

const fibbageAction = (room, playerId, action, payload) => {
  if (action === 'start' || action === 'nextRound') {
    requireHost(room, playerId);
    if (room.players.length < 3) throw new Error('تحتاج 3 لاعبين على الأقل');

    const lang = payload.lang === 'en' ? 'en' : 'ar';
    const item = nextPrompt(room, FIBBAGE[lang], 'fib_' + lang);
    const round = ((room.shared && room.shared.round) || 0) + 1;
    const scores = (room.shared && room.shared.scores) || {};

    // The real answer stays server-side until the votes are in.
    room._truth = item.a;
    room._lies = {};
    room.secrets = {};
    room.shared = {
      round: round, lang: lang,
      question: item.q,
      phase: 'writing',
      submitted: [],
      roster: room.players.map(p => p.id),
      scores: scores
    };
    room.phase = 'writing';
    return;
  }

  if (action === 'submitLie') {
    const s = room.shared;
    if (s.phase !== 'writing') throw new Error('انتهى وقت الكتابة');
    if (s.roster.indexOf(playerId) === -1) throw new Error('ستدخل من الجولة القادمة');

    const lie = String(payload.lie || '').trim().slice(0, 40);
    if (!lie) throw new Error('اكتب إجابة');
    // A "lie" that happens to be the truth would be unfair to vote on.
    if (normaliseClue(lie) === normaliseClue(room._truth)) {
      throw new Error('هذه هي الإجابة الصحيحة! اكتب غيرها');
    }
    // Two people inventing the same lie would split their own vote.
    const clash = Object.keys(room._lies).some(id =>
      id !== playerId && normaliseClue(room._lies[id]) === normaliseClue(lie));
    if (clash) throw new Error('حد كتب نفس الإجابة، جرب غيرها');

    room._lies[playerId] = lie;
    if (s.submitted.indexOf(playerId) === -1) s.submitted.push(playerId);

    const liars = activeRoster(room, s.roster);
    if (liars.every(id => s.submitted.indexOf(id) !== -1)) {
      const options = liars
        .filter(id => room._lies[id])
        .map(id => ({ id: 'l_' + id, label: room._lies[id], ownerId: id }));
      options.push({ id: 'truth', label: room._truth, ownerId: null });
      openVote(room, shuffled(options), liars);
      s.phase = 'voting';
      room.phase = 'voting';
    }
    return;
  }

  if (action === 'vote') {
    if (castVote(room, playerId, String(payload.option || ''))) scoreFibbage(room);
    return;
  }

  if (action === 'closeVote') {
    requireHost(room, playerId);
    if (closeVote(room)) scoreFibbage(room);
    return;
  }

  throw new Error('إجراء غير معروف');
};

const scoreFibbage = (room) => {
  const v = room.shared.vote;
  v.results.forEach(r => {
    if (r.id === 'truth') {
      // Everyone who found the real answer scores.
      Object.keys(room._ballots).forEach(pid => {
        if (room._ballots[pid] === 'truth') addScore(room, pid, FIBBAGE_TRUTH_POINTS);
      });
    } else if (r.ownerId && r.count > 0) {
      addScore(room, r.ownerId, FIBBAGE_FOOL_POINTS * r.count);
    }
  });
  room.shared.truth = room._truth;
  room.shared.board = scoreboardOf(room);
  room.shared.phase = 'results';
};

/* ==========================================================================
   رسم وتخمين — DRAW & GUESS
   --------------------------------------------------------------------------
   One player draws, everyone else types guesses. Finished strokes are appended
   in small batches and never re-sent; the line still under the drawer's finger
   is relayed live by the room server without being stored (JS_RoomDraw.html).
   The round goes to whoever gets there first.

   Coordinates are quantised to 0–255 and packed flat ([x,y,x,y,…]) so a whole
   drawing stays small: a phone that reconnects is sent all of it again.
   ========================================================================== */

const DRAW_MAX_POINTS = 2600;     // ~15KB of JSON, however long the round
const DRAW_ROUND_SECONDS = 90;    // the default the host can change
const DRAW_ROUND_MIN = 30;
const DRAW_ROUND_MAX = 240;

/* Tools a stroke may carry. Absent means freehand, which is what every stroke
   made before this existed is, so old rooms replay unchanged. */
const DRAW_TOOLS = ['f', 'l', 'r', 'o', 'b'];
/* How many numbers each tool's `p` must hold. Freehand is variable. */
const DRAW_TOOL_POINTS = { l: 4, r: 4, o: 4, b: 2 };

const drawGuessAction = (room, playerId, action, payload) => {
  if (action === 'start' || action === 'nextRound') {
    requireHost(room, playerId);
    if (room.players.length < 2) throw new Error('تحتاج لاعبين على الأقل');

    const lang = payload.lang === 'en' ? 'en' : 'ar';
    const round = ((room.shared && room.shared.round) || 0) + 1;
    const scores = (room.shared && room.shared.scores) || {};

    // The host picks the length in the lobby; later rounds reuse it rather than
    // asking again. Clamped here because the client is not the authority on it.
    const asked = Number(payload.seconds) || (room.shared && room.shared.roundSeconds);
    const seconds = Math.max(DRAW_ROUND_MIN,
                             Math.min(DRAW_ROUND_MAX, Math.round(asked || DRAW_ROUND_SECONDS)));

    // The drawer rotates so everyone gets a turn.
    const drawer = room.players[(round - 1) % room.players.length];
    const word = nextPrompt(room, DRAW_WORDS[lang], 'draw_' + lang);

    room._word = word;
    room.secrets = {};
    // Only the drawer is told the word.
    room.secrets[drawer.id] = { word: word };

    room.shared = {
      round: round,
      lang: lang,
      drawerId: drawer.id,
      drawerName: drawer.name,
      strokes: [],
      guesses: [],
      winnerId: null,
      roundSeconds: seconds,
      endsAt: Date.now() + seconds * 1000,
      scores: scores,
      roster: room.players.map(p => p.id)
    };
    room.phase = 'drawing';
    return;
  }

  if (action === 'addStrokes') {
    const s = room.shared;
    if (playerId !== s.drawerId) throw new Error('الرسام فقط');
    // s.word is only set once the round is over — by a win or by giving up.
    if (s.word) return;

    const batch = Array.isArray(payload.strokes) ? payload.strokes : [];
    let points = s.strokes.reduce((n, st) => n + (st.p ? st.p.length : 0), 0);

    batch.forEach(st => {
      const room_left = DRAW_MAX_POINTS - points;
      if (room_left < 2) return;

      const tool = DRAW_TOOLS.indexOf(String(st.t || 'f')) !== -1 ? String(st.t || 'f') : 'f';
      let pts = (st.p || []).map(n => Math.max(0, Math.min(255, Math.round(Number(n) || 0))));

      const exact = DRAW_TOOL_POINTS[tool];
      if (exact) {
        // A shape is its two corners. Truncating one would draw nonsense, so a
        // shape that does not fit the budget is dropped instead.
        if (pts.length !== exact || room_left < exact) return;
      } else {
        // Freehand truncates rather than being rejected, keeping pairs intact,
        // so a long stroke draws as far as the budget allows.
        if (pts.length > room_left) pts = pts.slice(0, room_left - (room_left % 2));
        if (pts.length < 2) return;
      }

      const stroke = {
        c: String(st.c || '#111').slice(0, 8),
        w: Math.max(1, Math.min(48, Number(st.w) || 4)),
        p: pts
      };
      // Only carried when it means something, so freehand stays as compact as
      // it was and rooms mid-round keep working.
      if (tool !== 'f') stroke.t = tool;
      s.strokes.push(stroke);
      points += pts.length;
    });
    return;
  }

  if (action === 'clearCanvas') {
    if (playerId !== room.shared.drawerId) throw new Error('الرسام فقط');
    if (room.shared.word) return;      // the round is over
    room.shared.strokes = [];
    return;
  }

  if (action === 'undoStroke') {
    const s = room.shared;
    if (playerId !== s.drawerId) throw new Error('الرسام فقط');
    if (s.word) return;
    // One step per press. Viewers see the list shrink and repaint from scratch,
    // which is already how a clear is handled.
    if (s.strokes.length) s.strokes.pop();
    return;
  }

  if (action === 'guess') {
    const s = room.shared;
    if (playerId === s.drawerId) throw new Error('الرسام لا يخمّن');
    // `word` is set the moment the round ends - by a win or by giving up. It
    // was only checking winnerId, so after a reveal the answer was on screen
    // and could still be typed back in for the points.
    if (s.word) throw new Error('انتهت الجولة');
    if (s.roster.indexOf(playerId) === -1) throw new Error('ستدخل من الجولة القادمة');

    const text = String(payload.guess || '').trim().slice(0, 40);
    if (!text) return;
    const player = room.players.find(p => p.id === playerId);
    const right = normaliseClue(text) === normaliseClue(room._word);

    s.guesses.push({ name: player ? player.name : '', text: text, right: right });
    if (s.guesses.length > 30) s.guesses = s.guesses.slice(-30);

    if (right) {
      s.winnerId = playerId;
      s.word = room._word;          // safe to publish now
      // The guesser and the drawer both score; drawing well is half the game.
      addScore(room, playerId, 2);
      addScore(room, s.drawerId, 1);
      s.board = scoreboardOf(room);
      room.phase = 'result';
    }
    return;
  }

  if (action === 'giveUp') {
    // The drawer can reveal too — they're the one who knows it's hopeless.
    if (room.hostId !== playerId && room.shared.drawerId !== playerId) {
      throw new Error('المضيف أو الرسام فقط');
    }
    revealDrawWord(room);
    return;
  }

  throw new Error('إجراء غير معروف');
};

/** Ends a round nobody guessed: the word goes public. False if it already was. */
const revealDrawWord = (room) => {
  const s = room.shared;
  if (s.word) return false;
  s.word = room._word;
  s.board = scoreboardOf(room);
  room.phase = 'result';
  return true;
};

/* ==========================================================================
   الفنان المزيف — A FAKE ARTIST GOES TO NEW YORK
   Everyone but one draws the same word, one line per turn, two laps round the
   table. The fake only has everyone else's lines to go on.
   ========================================================================== */

/** The language a round is dealt in: what the host sent, else what the game already uses. */
const roomLangOf = (room, payload) => {
  const asked = payload && payload.lang;
  if (asked === 'en' || asked === 'ar') return asked;
  return (room.shared && room.shared.lang === 'en') ? 'en' : 'ar';
};

// Kept here rather than borrowed from DRAW_COLOURS: that list lives in
// JS_RoomDraw.html, which is client code the server never sees. (The preview
// concatenates client and server into one page, which is what hid it.)
// Every colour reads on white paper, and none of them is white.
const FAKE_ARTIST_COLOURS = ['#e11d48', '#2563eb', '#059669', '#d97706', '#7c3aed', '#0891b2',
                             '#db2777', '#65a30d', '#111827', '#78350f', '#ea580c', '#64748b'];
const FAKE_ARTIST_ROUNDS = 2;
// Points per line. A phone that reconnects is sent the whole room again, so
// twelve artists × two laps × this many points is kept small.
const FAKE_ARTIST_MAX_POINTS = 150;

const fakeArtistAction = (room, playerId, action, payload) => {
  if (action === 'start' || action === 'nextRound') {
    requireHost(room, playerId);
    // Only from the results screen, so a double tap can't deal two rounds.
    if (action === 'nextRound' && room.shared.phase !== 'results') return;
    if (room.players.length < 3) throw new Error('الحد الأدنى 3 لاعبين');

    const lang = roomLangOf(room, payload);
    const scores = action === 'nextRound' ? (room.shared.scores || {}) : {};
    const order = shuffled(room.players.map(p => p.id));
    const fakeId = order[Math.floor(Math.random() * order.length)];
    // Opening with nothing on the page to copy is a giveaway, so the fake never goes first.
    if (order[0] === fakeId) order.push(order.shift());
    const word = nextPrompt(room, DRAW_WORDS[lang], 'draw_' + lang);

    room.secrets = {};
    order.forEach(id => {
      room.secrets[id] = id === fakeId ? { isFake: true } : { isFake: false, word: word };
    });
    room._word = word;
    room._fakeId = fakeId;

    const colors = {};
    order.forEach((id, i) => { colors[id] = FAKE_ARTIST_COLOURS[i % FAKE_ARTIST_COLOURS.length]; });

    room.shared = {
      round: 1,
      totalRounds: FAKE_ARTIST_ROUNDS,
      drawerOrder: order,
      turnIndex: 0,
      currentDrawerId: order[0],
      colors: colors,
      strokes: [],
      phase: 'drawing',
      scores: scores,
      lang: lang,
      roster: order.slice()
    };
    room.phase = 'play';
    return;
  }

  const s = room.shared;

  if (action === 'sendStroke') {
    if (s.phase !== 'drawing') throw new Error('ليس وقت الرسم');
    if (playerId !== s.currentDrawerId) throw new Error('ليس دورك في الرسم');
    const raw = payload && payload.stroke && payload.stroke.p;
    if (!Array.isArray(raw) || raw.length < 4) throw new Error('ارسم خطاً أولاً');

    const grid = (v) => Math.max(0, Math.min(255, Math.round(Number(v) || 0)));
    const p = [];
    for (let i = 0; i + 1 < raw.length && p.length < FAKE_ARTIST_MAX_POINTS * 2; i += 2) {
      p.push(grid(raw[i]), grid(raw[i + 1]));
    }
    s.strokes.push({ c: s.colors[playerId] || '#111827', p: p });
    advanceFakeArtistTurn(room);
    return;
  }

  // A drawer whose phone died would hold the table forever; the host moves on.
  if (action === 'skipTurn') {
    requireHost(room, playerId);
    if (s.phase === 'drawing') advanceFakeArtistTurn(room);
    return;
  }

  if (action === 'vote') {
    if (s.phase !== 'voting') throw new Error('لا يوجد تصويت الآن');
    // castVote closes the vote by itself once the last ballot is in, and the
    // reveal has to follow it or the table sits on a finished vote.
    if (castVote(room, playerId, String((payload && payload.option) || ''))) revealFakeArtist(room);
    return;
  }

  if (action === 'closeVote') {
    requireHost(room, playerId);
    if (s.phase !== 'voting') return;
    closeVote(room);
    revealFakeArtist(room);
    return;
  }

  if (action === 'fakeGuess') {
    if (s.phase !== 'guessing') throw new Error('ليس وقت التخمين');
    if (playerId !== room._fakeId) throw new Error('الفنان المزيف فقط');
    const guess = String((payload && payload.guess) || '').trim().slice(0, 40);
    if (!guess) throw new Error('اكتب تخمينك');
    s.fakeGuessWord = guess;
    finishFakeArtist(room, normaliseClue(guess) === normaliseClue(room._word) ? 'fake' : 'artists');
    return;
  }

  // The caught fake left, or won't answer: the host settles it for the artists.
  if (action === 'skipGuess') {
    requireHost(room, playerId);
    if (s.phase === 'guessing') finishFakeArtist(room, 'artists');
    return;
  }

  throw new Error('إجراء غير معروف');
};

/** Hands the pen on, skipping anyone who has left. After the last lap: the vote. */
const advanceFakeArtistTurn = (room) => {
  const s = room.shared;
  const present = room.players.map(p => p.id);
  const turns = s.drawerOrder.length * s.totalRounds;

  for (let guard = 0; guard < turns; guard++) {
    s.turnIndex++;
    if (s.turnIndex >= s.drawerOrder.length) { s.turnIndex = 0; s.round++; }
    if (s.round > s.totalRounds) break;
    if (present.indexOf(s.drawerOrder[s.turnIndex]) !== -1) {
      s.currentDrawerId = s.drawerOrder[s.turnIndex];
      return;
    }
  }

  s.round = s.totalRounds;
  s.currentDrawerId = null;
  s.phase = 'voting';
  const options = s.drawerOrder
    .filter(id => present.indexOf(id) !== -1)
    .map(id => ({ id: id, label: (room.players.find(p => p.id === id) || {}).name || id }));
  openVote(room, options, activeRoster(room, s.roster));
};

/**
 * Caught only by a clear plurality — a tie at the top means the table couldn't
 * agree, and the fake walks. A caught fake still gets to guess, so the word is
 * not published until they have: it would otherwise be on their own screen.
 */
const revealFakeArtist = (room) => {
  const s = room.shared;
  const results = (s.vote && s.vote.results) || [];
  const top = results.reduce((most, r) => Math.max(most, r.count), 0);
  const leaders = results.filter(r => top > 0 && r.count === top);

  s.fakeId = room._fakeId;
  s.fakeCaught = leaders.length === 1 && leaders[0].id === room._fakeId;
  if (s.fakeCaught) s.phase = 'guessing';
  else finishFakeArtist(room, 'fake');
};

/** Publishes the word and scores it: 2 to a fake who wins, 1 to each artist otherwise. */
const finishFakeArtist = (room, winner) => {
  const s = room.shared;
  s.phase = 'results';
  s.winner = winner;
  s.secretWord = room._word;
  (s.roster || []).forEach(id => {
    const isFake = id === room._fakeId;
    if (winner === 'fake' && isFake) addScore(room, id, 2);
    if (winner === 'artists' && !isFake) addScore(room, id, 1);
  });
  s.board = scoreboardOf(room);
};

/* ==========================================================================
   على نفس الموجة — WAVELENGTH
   One psychic sees where the target sits between two opposites and gives a
   clue; everyone else turns the dial. Co-operative, with one shared score.
   ========================================================================== */

// Distance from the target on a 0–100 dial → points. The client draws the same
// bands on the reveal, so the zone you see is the zone that scored.
const WAVELENGTH_BANDS = [
  { within: 3, points: 4 },
  { within: 8, points: 3 },
  { within: 15, points: 2 }
];

const wavelengthAction = (room, playerId, action, payload) => {
  if (action === 'start' || action === 'nextRound') {
    requireHost(room, playerId);
    const prev = room.shared || {};
    // From the results only (a double tap must not skip someone's turn as
    // psychic) — unless the host is deliberately skipping a silent psychic.
    if (action === 'nextRound' && prev.phase !== 'results' && !(payload && payload.skip)) return;
    if (room.players.length < 2) throw new Error('الحد الأدنى لاعبان');

    const lang = roomLangOf(room, payload);
    const round = action === 'start' ? 1 : (prev.round || 0) + 1;
    const psychic = room.players[(round - 1) % room.players.length];
    const pair = nextPrompt(room, WAVELENGTH_PAIRS[lang] || WAVELENGTH_PAIRS.ar, 'wavelength_' + lang);
    // Kept off the very ends, where any clue at all gives it away.
    const target = 8 + Math.floor(Math.random() * 85);

    room.secrets = {};
    room.secrets[psychic.id] = { target: target };
    room._target = target;
    room.shared = {
      round: round,
      psychicId: psychic.id,
      psychicName: psychic.name,
      leftLabel: pair.left,
      rightLabel: pair.right,
      clue: null,
      dial: 50,
      phase: 'clue',
      scores: action === 'start' ? { team: 0 } : (prev.scores || { team: 0 }),
      lang: lang,
      roster: room.players.map(p => p.id)
    };
    room.phase = 'play';
    return;
  }

  const s = room.shared;

  if (action === 'giveClue') {
    if (s.phase !== 'clue') throw new Error('التلميح اتبعت خلاص');
    if (playerId !== s.psychicId) throw new Error('القارئ الذهني فقط');
    const clue = String((payload && payload.clue) || '').trim().slice(0, 60);
    if (!clue) throw new Error('اكتب تلميحاً');
    s.clue = clue;
    s.phase = 'dial';
    return;
  }

  if (action === 'setDial') {
    // A drag that lands just after the lock is not an error worth a toast.
    if (s.phase !== 'dial') return;
    // The psychic knows where the target is; letting them steer ends the game.
    if (playerId === s.psychicId) throw new Error('القارئ الذهني لا يحرك المؤشر');
    const dial = Number(payload && payload.dial);
    if (!isFinite(dial)) throw new Error('قيمة غير صحيحة');
    // Not `|| 50`: zero is a real position, the far left end.
    s.dial = Math.max(0, Math.min(100, Math.round(dial)));
    return;
  }

  if (action === 'lockDial') {
    requireHost(room, playerId);
    // Once only: a second tap must not score the same round twice.
    if (s.phase !== 'dial') return;
    const diff = Math.abs(s.dial - room._target);
    const band = WAVELENGTH_BANDS.find(b => diff <= b.within);
    s.pointsEarned = band ? band.points : 0;
    s.scores.team = (s.scores.team || 0) + s.pointsEarned;
    s.target = room._target;
    s.phase = 'results';
    return;
  }

  throw new Error('إجراء غير معروف');
};

/* ==========================================================================
   تحدي المعلومات — TRIVIA
   The host picks how many questions (5, 10, 15 or 20); everyone answers at
   once. A right answer is 10 points, and the fastest right answers get more:
   +5 for the first, +4 for the second, down to +1 for the fifth.
   ========================================================================== */
const TRIVIA_COUNTS = [5, 10, 15, 20];   // what the host can pick
const TRIVIA_PER_GAME = 10;               // when they don't
// Points for a right answer, and the bonus for being among the fastest right
// answers: the first gets all of it, each next one a point less.
const TRIVIA_POINTS = 10;
const TRIVIA_SPEED_BONUS = 5;
const TRIVIA_SECONDS = 15;
// An answer tapped as the clock hits zero is still on its way, and still
// counts. Once this has passed too, the server closes the question itself.
const TRIVIA_GRACE_MS = 2000;

const triviaAction = (room, playerId, action, payload) => {
  if (action === 'start' || action === 'playAgain') {
    requireHost(room, playerId);
    // 'start' is refused outside the lobby, so a finished game restarts here.
    if (action === 'playAgain' && room.shared.phase !== 'gameover') return;

    const lang = roomLangOf(room, payload);
    const pool = TRIVIA_QUESTIONS[lang] || TRIVIA_QUESTIONS.ar;
    // Play again comes without a count: it keeps the one this game had.
    const asked = Number(payload && payload.count);
    const count = TRIVIA_COUNTS.indexOf(asked) !== -1 ? asked : (room._triviaCount || TRIVIA_PER_GAME);
    room._triviaCount = count;
    // The bank puts the right answer second three times in four, so the
    // choices are reordered for every question — otherwise "always B" wins.
    room._deck = nextPrompts(room, pool, 'trivia_' + lang, count).map(q => {
      const order = shuffled(q.choices.map((_, k) => k));
      return { q: q.q, choices: order.map(k => q.choices[k]), answer: order.indexOf(q.answer) };
    });
    room.shared = { scores: {}, lang: lang, roster: room.players.map(p => p.id) };
    dealTriviaQuestion(room, 0);
    return;
  }

  const s = room.shared;

  if (action === 'answer') {
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
    if (room.hostId !== playerId && Date.now() < s.endsAt) throw new Error('المضيف فقط يمكنه فعل ذلك');
    closeTriviaQuestion(room);
    return;
  }

  if (action === 'nextQuestion') {
    requireHost(room, playerId);
    // From the results only: a double tap must not skip a question unseen.
    if (s.phase !== 'results') return;
    const next = (room._qIdx || 0) + 1;
    if (next >= (room._deck || []).length) {
      s.phase = 'gameover';
      s.board = scoreboardOf(room);
      return;
    }
    dealTriviaQuestion(room, next);
    return;
  }

  throw new Error('إجراء غير معروف');
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

  s.phase = 'results';
  s.correctAnswer = q.answer;
  s.choiceCounts = counts;
  s.picks = picks;
  s.gained = gained;
  s.order = right;
  s.board = scoreboardOf(room);
};

/* ==========================================================================
   CLOCKS THE SERVER KEEPS
   --------------------------------------------------------------------------
   A timed round has to end even when no phone is awake to end it. The room
   server asks roomDeadline when to look at a room again, and calls
   roomTimeout at that moment. Phones still end rounds on time themselves;
   this is the backstop, a moment later.
   ========================================================================== */
const DRAW_TIMEOUT_GRACE_MS = 1500;

/** When this room next needs the server to act on its own, or null. */
const roomDeadline = (room) => {
  const s = room.shared || {};
  if (room.game === 'trivia' && s.phase === 'answering' && s.endsAt) {
    return s.endsAt + TRIVIA_GRACE_MS;
  }
  if (room.game === 'drawguess' && room.phase === 'drawing' && !s.word && s.endsAt) {
    return s.endsAt + DRAW_TIMEOUT_GRACE_MS;
  }
  if (room.game === 'codenames' && room.phase === 'playing' && !s.winner && s.endsAt) {
    return s.endsAt + CODENAMES_GRACE_MS;
  }
  return null;
};

/** Acts on a deadline that has passed. True when the room changed. */
const roomTimeout = (room, now) => {
  const due = roomDeadline(room);
  if (!due || now < due) return false;
  if (room.game === 'trivia') {
    closeTriviaQuestion(room);
    return true;
  }
  if (room.game === 'drawguess') return revealDrawWord(room);
  if (room.game === 'codenames') {
    // No clue, or no guesses, in time: the other team is up.
    endCodenamesTurn(room);
    return true;
  }
  return false;
};
