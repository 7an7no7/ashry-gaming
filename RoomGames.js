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
  room._stopOpts = null;
  room._stopTotals = null;
  room._stopRound = null;
  room._chamSecret = null;
  room._chamId = null;
  room._impSecret = null;
  room._impSpies = null;
  room._impWords = null;
  room._impScores = null;
  room._waScores = null;
  room._spyLoc = null;
  room._spyIds = null;
  room._bombStart = null;
  room._bombEndsAt = null;
  room._tt = null;
  room._card = null;
  room._quizCount = null;
  room._fiveDeck = null;
  room._fiveRounds = null;
  room._chains = null;
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
  'fakeartist', 'wavelength', 'trivia', 'buzzer', 'stop',
  'chameleon', 'spyfall', 'bomb',
  'twotruths', 'emoji', 'proverbs', 'fiveseconds', 'telephone'
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
    const sameName = (a, b) => foldArabicLetters(a).replace(/\s+/g, ' ').trim() === foldArabicLetters(b).replace(/\s+/g, ' ').trim();
    if (room.players.some(p => sameName(p.name, name))) {
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
    case 'buzzer':     buzzerAction(room, playerId, action, payload); break;
    case 'stop':       stopAction(room, playerId, action, payload); break;
    case 'chameleon':  chameleonRoomAction(room, playerId, action, payload); break;
    case 'spyfall':    spyfallRoomAction(room, playerId, action, payload); break;
    case 'bomb':       bombRoomAction(room, playerId, action, payload); break;
    case 'twotruths':  twoTruthsAction(room, playerId, action, payload); break;
    case 'emoji':
    case 'proverbs':   quizAction(room, playerId, action, payload); break;
    case 'fiveseconds': fiveSecondsAction(room, playerId, action, payload); break;
    case 'telephone':  telephoneAction(room, playerId, action, payload); break;
    default: throw new Error('لعبة غير معروفة');
  }

  // Whoever is present when a game is dealt is in it. This can't be inferred
  // from secrets — a Codenames operative and a Just One guesser both have none.
  if ((action === 'start' || action === 'nextRound') && room.shared && !room.shared.roster) {
    room.shared.roster = room.players.map(p => p.id);
  }
};

/* ==========================================================================
   أتوبيس كومبليت — STOP THE BUS (rooms)
   The same paper game, with every phone as the paper. A letter is dealt,
   everyone types an answer per category, and the first to press وقف closes
   the round for the whole table: the other phones get a few seconds to send
   what they had typed. The server then scores by comparing the answers -
   10 for an answer nobody else had, 5 for one somebody shared, 0 for a
   blank or a word that doesn't start with the letter - and the host can
   correct any cell before the points are banked.

   Answers stay in room._answers (never projected) until the round closes,
   so a phone that finished early cannot show its list to the table.
   ========================================================================== */
const STOP_CAT_IDS = ['name', 'animal', 'plant', 'thing', 'country', 'city', 'food', 'brand', 'job', 'color'];
const STOP_LETTERS_BY_LANG = {
  ar: 'ا ب ت ث ج ح خ د ر ز س ش ص ض ط ع غ ف ق ك ل م ن ه و ي'.split(' '),
  en: 'A B C D E F G H I J K L M N O P R S T V W'.split(' ')
};
const STOP_TIMERS = [60, 90, 120, 0];
const STOP_ROUNDS = [3, 5, 7, 10];
const STOP_POINT_STEPS = [10, 5, 0];
const STOP_COLLECT_MS = 4000;     // after وقف, the other phones send what they typed
const STOP_GRACE_MS = 1500;       // the clock ran out: how late a submit still counts

/** One spelling for comparing answers: case, diacritics, hamza forms, the article. */
/**
 * The letters people spell the same word with. Every comparison of typed text
 * goes through this: أسد and اسد, مكتبة and مكتبه, مصطفى and مصطفي, with or
 * without diacritics or a tatweel. The client has the same list in
 * foldWord (JS_Core.html); keep the two identical.
 */
const foldArabicLetters = (text) => String(text || '').toLowerCase()
  .replace(/[\u064B-\u0652\u0670\u0640]/g, '')
  .replace(/[أإآٱ]/g, 'ا').replace(/ة/g, 'ه').replace(/[ىی]/g, 'ي')
  .replace(/ؤ/g, 'و').replace(/ئ/g, 'ي').replace(/ک/g, 'ك');

const foldStopAnswer = (text, lang, letter) => {
  const raw = String(text || '').trim();
  let out = foldArabicLetters(raw)
    .replace(/[^\p{L}\p{N} ]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
  // The definite article is not the initial: "الأسد" is an أ word, "the sea" an S word.
  // In a round on ا itself a bare "ال…" stays: ألمانيا and إلهام are ا words, and typed
  // without the hamza they look exactly like an article. Only "ال" + a hamza letter
  // (الأسد, الإمارات) is an article for certain there.
  const article = lang === 'ar' && out.length > 3 && out.indexOf('ال') === 0
    && (letter !== 'ا' || /^ال[أإآ]/.test(raw));
  if (article) out = out.slice(2);
  if (lang === 'en' && out.indexOf('the ') === 0) out = out.slice(4);
  return out;
};

const stopAction = (room, playerId, action, payload) => {
  if (action === 'start' || action === 'nextRound' || action === 'playAgain') {
    requireHost(room, playerId);
    if (room.players.length < 2) throw new Error('تحتاج لاعبين على الأقل');
    const prev = room.shared || {};

    if (action === 'start') {
      const lang = roomLangOf(room, payload);
      const cats = (Array.isArray(payload && payload.cats) ? payload.cats : [])
        .map(String).filter((c, i, arr) => STOP_CAT_IDS.indexOf(c) !== -1 && arr.indexOf(c) === i);
      const timer = Number(payload && payload.timer);
      const rounds = Number(payload && payload.rounds);
      room._stopOpts = {
        lang: lang,
        cats: cats.length >= 2 ? cats : ['name', 'animal', 'plant', 'thing', 'country'],
        timer: STOP_TIMERS.indexOf(timer) !== -1 ? timer : 90,
        rounds: STOP_ROUNDS.indexOf(rounds) !== -1 ? rounds : 5
      };
      room._stopTotals = {};
      room._stopRound = 0;
    } else if (action === 'nextRound') {
      // From the review only, and the points as corrected are banked here.
      if (prev.phase !== 'review') return;
      bankStopRound(room);
      if (room._stopRound >= room._stopOpts.rounds) {
        prev.phase = 'done';
        prev.board = stopBoard(room);
        prev.results = null;
        return;
      }
    } else {
      if (prev.phase !== 'done') return;
      room._stopTotals = {};
      room._stopRound = 0;
    }
    dealStopLetter(room);
    return;
  }

  const s = room.shared;
  if (!s || room.game !== 'stop') throw new Error('اللعبة لم تبدأ بعد');

  if (action === 'submit') {
    if (s.phase !== 'writing' && s.phase !== 'collecting') return;
    if ((s.roster || []).indexOf(playerId) === -1) throw new Error('لست ضمن هذه الجولة');
    if (s.submitted.indexOf(playerId) !== -1) return;
    const given = (payload && payload.answers) || {};
    const answers = {};
    s.cats.forEach(c => { answers[c] = String(given[c] || '').trim().slice(0, 30); });
    room._answers = room._answers || {};
    room._answers[playerId] = answers;
    s.submitted.push(playerId);
    if (s.phase === 'writing' && payload && payload.stop) {
      s.stopperId = playerId;
      s.stopperName = (room.players.find(p => p.id === playerId) || {}).name || '';
      s.phase = 'collecting';
      s.collectEndsAt = Date.now() + STOP_COLLECT_MS;
    }
    if (activeRoster(room, s.roster).every(id => s.submitted.indexOf(id) !== -1)) scoreStopRound(room);
    return;
  }

  if (action === 'timeUp') {
    // Anyone may say the clock ran out, but only once it has.
    if (s.phase !== 'writing' || !s.endsAt || Date.now() < s.endsAt) return;
    s.phase = 'collecting';
    s.collectEndsAt = Date.now() + STOP_COLLECT_MS;
    return;
  }

  if (action === 'adjust') {
    requireHost(room, playerId);
    if (s.phase !== 'review') return;
    const pid = String((payload && payload.playerId) || '');
    const cat = String((payload && payload.cat) || '');
    const pts = Number(payload && payload.pts);
    const row = s.results && s.results[pid];
    if (!row || !row[cat] || STOP_POINT_STEPS.indexOf(pts) === -1) return;
    row[cat].pts = pts;
    row[cat].manual = true;
    s.roundTotals[pid] = s.cats.reduce((sum, c) => sum + (row[c] ? row[c].pts : 0), 0);
    return;
  }

  throw new Error('إجراء غير معروف');
};

const dealStopLetter = (room) => {
  const o = room._stopOpts;
  room._stopRound += 1;
  room._answers = {};
  const letter = nextPrompt(room, STOP_LETTERS_BY_LANG[o.lang] || STOP_LETTERS_BY_LANG.ar, 'stop_' + o.lang);
  room.secrets = {};
  room.shared = {
    lang: o.lang,
    cats: o.cats.slice(),
    timer: o.timer,
    rounds: o.rounds,
    round: room._stopRound,
    letter: letter,
    phase: 'writing',
    endsAt: o.timer ? Date.now() + o.timer * 1000 : 0,
    collectEndsAt: 0,
    submitted: [],
    stopperId: null,
    stopperName: '',
    results: null,
    roundTotals: {},
    totals: Object.assign({}, room._stopTotals),
    roster: room.players.map(p => p.id),
    board: stopBoard(room)
  };
  room.phase = 'play';
};

/** Compares the answers and writes the table everybody sees. Safe to call twice. */
const scoreStopRound = (room) => {
  const s = room.shared;
  if (s.phase !== 'writing' && s.phase !== 'collecting') return;
  const answers = room._answers || {};
  const letter = foldStopAnswer(s.letter, s.lang);
  const results = {};
  const roundTotals = {};
  const roster = s.roster || [];

  s.cats.forEach(cat => {
    const folded = {};
    roster.forEach(pid => {
      const raw = (answers[pid] || {})[cat] || '';
      const f = foldStopAnswer(raw, s.lang, letter);
      const ok = f.length >= 2 && f.charAt(0) === letter;
      folded[pid] = { raw: raw, f: f, ok: ok };
    });
    const counts = {};
    roster.forEach(pid => { if (folded[pid].ok) counts[folded[pid].f] = (counts[folded[pid].f] || 0) + 1; });
    roster.forEach(pid => {
      const a = folded[pid];
      const pts = !a.ok ? 0 : (counts[a.f] > 1 ? 5 : 10);
      results[pid] = results[pid] || {};
      results[pid][cat] = { text: a.raw, pts: pts, ok: a.ok, manual: false };
    });
  });
  roster.forEach(pid => {
    roundTotals[pid] = s.cats.reduce((sum, c) => sum + results[pid][c].pts, 0);
  });
  s.results = results;
  s.roundTotals = roundTotals;
  s.phase = 'review';
};

const bankStopRound = (room) => {
  const s = room.shared;
  Object.keys(s.roundTotals || {}).forEach(pid => {
    room._stopTotals[pid] = (room._stopTotals[pid] || 0) + (s.roundTotals[pid] || 0);
  });
  s.totals = Object.assign({}, room._stopTotals);
  s.board = stopBoard(room);
};

const stopBoard = (room) =>
  room.players
    .map(p => ({ id: p.id, name: p.name, score: (room._stopTotals || {})[p.id] || 0 }))
    .sort((a, b) => b.score - a.score);

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
    requireHost(room, playerId);
    if (room.players.length < 3) throw new Error('تحتاج 3 لاعبين على الأقل');
    const prev = room.shared || {};
    if (action === 'nextRound' && prev.phase !== 'results') return;
    const lang = roomLangOf(room, payload);
    const pool = CHAMELEON_DB[lang] || CHAMELEON_DB.ar;
    const entry = nextPrompt(room, pool, 'cham_' + lang);
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
    requireHost(room, playerId);
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
    requireHost(room, playerId);
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
    requireHost(room, playerId);
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
  } else {
    addScore(room, cham, 2);
  }
  s.board = scoreboardOf(room);
  s.phase = 'results';
};

/* ==========================================================================
   الموقع السري — SPYFALL (rooms)
   Everyone is told the place and a job there, in their own secret slice; the
   spy is told only that they are the spy. The full list of places is public
   (it is what the spy guesses from). A clock runs on the server: when it
   runs out the vote opens by itself. The spy may stop the game at any time
   to guess the place.
   ========================================================================== */
const SPYFALL_MINUTES = [5, 8, 10];
const SPYFALL_GRACE_MS = 1500;
const SPYFALL_CARD = 24;         // places shown per round, the real one among them

const spyfallRoomAction = (room, playerId, action, payload) => {
  if (action === 'start' || action === 'nextRound') {
    requireHost(room, playerId);
    if (room.players.length < 3) throw new Error('تحتاج 3 لاعبين على الأقل');
    const prev = room.shared || {};
    if (action === 'nextRound' && prev.phase !== 'results') return;
    const lang = roomLangOf(room, payload);
    const pool = SPYFALL_DB[lang] || SPYFALL_DB.ar;
    const loc = nextPrompt(room, pool, 'spyfall_' + lang);
    const askedMinutes = Number(payload && payload.minutes);
    const minutes = SPYFALL_MINUTES.indexOf(askedMinutes) !== -1 ? askedMinutes : (prev.minutes || 8);
    let spyCount = Number(payload && payload.spies) === 2 ? 2 : (payload && payload.spies ? 1 : (prev.spyCount || 1));
    // Two spies among five leave too few who know the place to catch anyone.
    if (room.players.length < 6) spyCount = 1;
    const roster = room.players.map(p => p.id);
    const order = shuffled(roster);
    const spyIds = order.slice(0, spyCount);
    const jobs = shuffled(loc.roles || []);
    room.secrets = {};
    let j = 0;
    roster.forEach(id => {
      room.secrets[id] = spyIds.indexOf(id) !== -1
        ? { role: 'spy' }
        : { role: 'agent', location: loc.location, job: jobs.length ? jobs[j++ % jobs.length] : '' };
    });
    room._spyLoc = loc.location;
    room._spyIds = spyIds;
    room.shared = {
      round: (prev.round || 0) + 1,
      lang: lang,
      minutes: minutes,
      spyCount: spyCount,
      phase: 'play',
      endsAt: Date.now() + minutes * 60000,
      // A card of 24 places to guess from, the real one among them: the whole
      // list is too long to read on a phone and too dense on a TV.
      locations: shuffled(shuffled(pool.map(l => l.location).filter(l => l !== loc.location)).slice(0, SPYFALL_CARD - 1).concat([loc.location])),
      firstId: order[spyCount] || order[0],
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
    requireHost(room, playerId);
    if (s.phase !== 'play') return;
    openSpyfallVote(room);
    return;
  }
  if (action === 'vote') {
    if (s.phase !== 'voting') throw new Error('لا يوجد تصويت الآن');
    if (castVote(room, playerId, String((payload && payload.option) || ''))) resolveSpyfallVote(room);
    return;
  }
  if (action === 'closeVote') {
    requireHost(room, playerId);
    if (s.phase !== 'voting') return;
    if (closeVote(room)) resolveSpyfallVote(room);
    return;
  }
  if (action === 'spyGuess') {
    if ((room._spyIds || []).indexOf(playerId) === -1) throw new Error('الجاسوس فقط يخمّن');
    const mayGuess = s.phase === 'play' || (s.phase === 'guess' && s.guesserId === playerId);
    if (!mayGuess) throw new Error('ليس وقت التخمين');
    const guess = String((payload && payload.location) || '');
    if (s.locations.indexOf(guess) === -1) throw new Error('اختيار غير صحيح');
    finishSpyfall(room, guess === room._spyLoc ? 'stole' : 'caught', guess, playerId);
    return;
  }
  if (action === 'skipGuess') {
    requireHost(room, playerId);
    if (s.phase !== 'guess') return;
    finishSpyfall(room, 'caught', null, s.guesserId);
    return;
  }
  throw new Error('إجراء غير معروف');
};

const openSpyfallVote = (room) => {
  const s = room.shared;
  openVote(room, room.players.filter(p => s.roster.indexOf(p.id) !== -1).map(p => ({ id: p.id, label: p.name, ownerId: p.id })), s.roster);
  s.phase = 'voting';
};

/** Most votes is accused; a tie lets the spy escape. An accused spy gets one guess. */
const resolveSpyfallVote = (room) => {
  const s = room.shared;
  const results = s.vote.results || [];
  const top = results.reduce((m, r) => Math.max(m, r.count), 0);
  const leaders = results.filter(r => top > 0 && r.count === top);
  const accused = leaders.length === 1 ? leaders[0] : null;
  s.accusedId = accused ? accused.id : null;
  s.accusedName = accused ? accused.label : '';
  if (accused && (room._spyIds || []).indexOf(accused.id) !== -1) {
    s.guesserId = accused.id;
    s.guesserName = accused.label;
    s.phase = 'guess';
    return;
  }
  finishSpyfall(room, 'escaped', null, null);
};

/** Caught: a point to every agent. Escaped or guessed the place: two to each spy. */
const finishSpyfall = (room, outcome, guess, spyId) => {
  const s = room.shared;
  const spies = room._spyIds || [];
  s.outcome = outcome;
  s.guess = guess;
  s.guesserId = spyId || s.guesserId || null;
  s.location = room._spyLoc;
  s.spyIds = spies.slice();
  s.spyNames = spies.map(id => roomPlayerName(room, id));
  if (outcome === 'caught') {
    s.roster.forEach(id => { if (spies.indexOf(id) === -1 && room.players.some(p => p.id === id)) addScore(room, id, 1); });
  } else {
    spies.forEach(id => addScore(room, id, 2));
  }
  s.board = scoreboardOf(room);
  s.phase = 'results';
};

/* ==========================================================================
   القنبلة — PASS THE BOMB (rooms)
   The category is on the big screen and on every phone, and the bomb is on
   one phone at a time: the holder says a word and presses pass, and it jumps
   to the next player in `order`. The fuse is a server clock nobody can read:
   the deadline stays in room._bombEndsAt, and what phones get is `heat`
   (0-3), bumped by the alarm at 40%, 65% and 85% of the fuse, which is what
   makes the ticking speed up. When it goes off the server knows who was
   holding it, so the strike is automatic; the host can still correct it.
   The strikes are the scoreboard - fewest wins.
   ========================================================================== */
const BOMB_FUSES_ROOM = { short: [15, 30], normal: [25, 55], long: [40, 80] };
const BOMB_HEAT_AT = [0.4, 0.65, 0.85];

const bombRoomAction = (room, playerId, action, payload) => {
  if (action === 'start' || action === 'nextRound' || action === 'playAgain') {
    requireHost(room, playerId);
    if (room.players.length < 2) throw new Error('تحتاج لاعبين على الأقل');
    const prev = room.shared || {};
    if (action === 'nextRound' && prev.phase !== 'boom') return;
    const askedMode = payload && payload.mode;
    const askedFuse = payload && payload.fuse;
    dealBomb(room, {
      lang: roomLangOf(room, payload),
      mode: ['category', 'letter', 'mix'].indexOf(askedMode) !== -1 ? askedMode : (prev.mode || 'category'),
      fuse: BOMB_FUSES_ROOM[askedFuse] ? askedFuse : (prev.fuse || 'normal'),
      round: action === 'nextRound' ? (prev.round || 0) + 1 : 1,
      strikes: action === 'nextRound' ? (prev.strikes || {}) : {}
    });
    return;
  }

  const s = room.shared;
  if (!s || room.phase !== 'play') throw new Error('اللعبة لم تبدأ بعد');

  if (action === 'swap') {
    requireHost(room, playerId);
    if (s.phase !== 'ticking') return;
    const next = bombPrompt(room, s.lang, s.mode);
    s.prompt = next.text;
    s.kind = next.kind;
    return;
  }
  if (action === 'pass') {
    // Only the holder passes, and only to the next player still in the room.
    if (s.phase !== 'ticking') return;
    if (playerId !== s.holderId) throw new Error('القنبلة مش معاك');
    const present = s.order.filter(id => room.players.some(p => p.id === id));
    if (present.length < 2) return;
    const at = present.indexOf(s.holderId);
    s.holderId = present[(at + 1) % present.length];
    s.holderName = roomPlayerName(room, s.holderId);
    s.passes = (s.passes || 0) + 1;
    return;
  }
  if (action === 'markLoser') {
    // The host corrects who was holding it: the automatic strike moves.
    requireHost(room, playerId);
    if (s.phase !== 'boom') return;
    const id = String((payload && payload.playerId) || '');
    if (!room.players.some(p => p.id === id)) throw new Error('لاعب غير معروف');
    if (s.loserId && s.loserId !== id) s.strikes[s.loserId] = Math.max(0, (s.strikes[s.loserId] || 0) - 1);
    if (s.loserId !== id) s.strikes[id] = (s.strikes[id] || 0) + 1;
    s.loserId = id;
    s.loserName = roomPlayerName(room, id);
    s.board = bombBoard(room);
    return;
  }
  throw new Error('إجراء غير معروف');
};

/** The bomb went off in the holder's hands. */
const explodeBomb = (room) => {
  const s = room.shared;
  s.phase = 'boom';
  const holder = s.holderId && room.players.some(p => p.id === s.holderId) ? s.holderId : null;
  s.loserId = holder;
  s.loserName = holder ? roomPlayerName(room, holder) : '';
  if (holder) s.strikes[holder] = (s.strikes[holder] || 0) + 1;
  s.board = bombBoard(room);
};

const bombPrompt = (room, lang, mode) => {
  const wantLetter = mode === 'letter' || (mode === 'mix' && Math.random() < 0.35);
  if (wantLetter) return { kind: 'letter', text: nextPrompt(room, BOMB_LETTERS[lang] || BOMB_LETTERS.ar, 'bombl_' + lang) };
  return { kind: 'category', text: nextPrompt(room, BOMB_PROMPTS[lang] || BOMB_PROMPTS.ar, 'bomb_' + lang) };
};

const dealBomb = (room, o) => {
  const range = BOMB_FUSES_ROOM[o.fuse] || BOMB_FUSES_ROOM.normal;
  const seconds = range[0] + Math.floor(Math.random() * (range[1] - range[0] + 1));
  const prompt = bombPrompt(room, o.lang, o.mode);
  const prev = room.shared || {};
  const roster = room.players.map(p => p.id);
  // The seating order, kept from round to round so people don't shuffle;
  // anyone new goes on the end. The last loser starts the next round.
  const kept = (prev.order || []).filter(id => roster.indexOf(id) !== -1);
  const order = kept.length >= 2 ? kept.concat(roster.filter(id => kept.indexOf(id) === -1)) : shuffled(roster);
  const holder = prev.loserId && roster.indexOf(prev.loserId) !== -1 ? prev.loserId : order[Math.floor(Math.random() * order.length)];
  room._bombStart = Date.now();
  room._bombEndsAt = room._bombStart + seconds * 1000;
  room.secrets = {};
  room.shared = {
    round: o.round,
    lang: o.lang,
    mode: o.mode,
    fuse: o.fuse,
    prompt: prompt.text,
    kind: prompt.kind,
    phase: 'ticking',
    heat: 0,
    order: order,
    holderId: holder,
    holderName: roomPlayerName(room, holder),
    passes: 0,
    strikes: o.strikes,
    loserId: null,
    loserName: '',
    roster: roster
  };
  room.shared.board = bombBoard(room);
  room.phase = 'play';
};

/** Fewest strikes first: this board is who is losing least. */
const bombBoard = (room) =>
  room.players
    .map(p => ({ id: p.id, name: p.name, score: (room.shared.strikes || {})[p.id] || 0 }))
    .sort((a, b) => a.score - b.score);

/* ==========================================================================
   الجرس — THE BUZZER
   The host asks questions out loud; every phone is a buzzer. The server keeps
   the order the presses arrived in, so "who was first" is settled here and
   nowhere else. Nothing is secret: the order, the verdicts and the scores are
   all in shared, and the TV shows them.
   ========================================================================== */
const buzzerAction = (room, playerId, action, payload) => {
  if (action === 'start') {
    requireHost(room, playerId);
    if (room.players.length < 2) throw new Error('تحتاج لاعبين على الأقل');
    room.secrets = {};
    room.shared = { round: 1, phase: 'armed', buzzes: [], scores: {}, last: null, roster: room.players.map(p => p.id) };
    room.shared.board = scoreboardOf(room);
    room.phase = 'playing';
    return;
  }

  const s = room.shared;
  if (!s || room.phase !== 'playing') throw new Error('اللعبة لم تبدأ بعد');

  if (action === 'buzz') {
    // A press after the host locked, or a second press: nothing to record.
    if (s.phase !== 'armed') return;
    const player = room.players.find(p => p.id === playerId);
    if (!player) return;                                     // a screen can't buzz
    if (s.buzzes.some(b => b.id === playerId)) return;
    s.buzzes.push({ id: playerId, name: player.name, at: Date.now() });
    return;
  }

  requireHost(room, playerId);

  // The first in line answered. Right: a point and a fresh question. Wrong:
  // out of the line, and the next one gets a go at the same question.
  if (action === 'correct') {
    const first = s.buzzes[0];
    if (!first) return;
    addScore(room, first.id, 1);
    s.last = { id: first.id, name: first.name, ok: true };
    s.buzzes = [];
    s.round += 1;
    s.board = scoreboardOf(room);
    return;
  }
  if (action === 'wrong') {
    const first = s.buzzes.shift();
    if (!first) return;
    if (payload && payload.penalty) addScore(room, first.id, -1);
    s.last = { id: first.id, name: first.name, ok: false };
    s.board = scoreboardOf(room);
    return;
  }
  if (action === 'reset') { s.buzzes = []; s.last = null; s.round += 1; return; }
  if (action === 'lock')  { s.phase = 'locked'; s.buzzes = []; return; }
  if (action === 'arm')   { s.phase = 'armed'; s.last = null; return; }
  if (action === 'adjust') {
    const id = String((payload && payload.id) || '');
    const delta = Number((payload && payload.delta) || 0);
    if (!room.players.some(p => p.id === id) || !delta) return;
    addScore(room, id, delta);
    s.board = scoreboardOf(room);
    return;
  }
  if (action === 'playAgain') {
    s.scores = {};
    s.buzzes = [];
    s.last = null;
    s.round = 1;
    s.phase = 'armed';
    s.board = scoreboardOf(room);
    return;
  }
  throw new Error('إجراء غير معروف');
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

const IMPOSTER_GUESS_OPTIONS = 6;

const imposterAction = (room, playerId, action, payload) => {
  if (action === 'start') {
    requireHost(room, playerId);
    if (room.players.length < 3) throw new Error('تحتاج 3 لاعبين على الأقل');

    const category = String(payload.category || '');
    const words = spyWords(category);
    if (!words.length) throw new Error('اختر مجموعة كلمات');

    // Dealt through the shared memory, so an evening doesn't repeat itself.
    const secret = nextPrompt(room, words, 'imp_' + category);
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
    room._impSecret = secret;
    room._impSpies = spies;
    room._impWords = words;

    room.shared = {
      category: category,
      spyCount: spyCount,
      revealed: false,
      scores: room._impScores || {},
      roster: room.players.map(p => p.id),
      vote: null,
      outcome: null
    };
    room.shared.board = scoreboardOf(room);
    room.phase = 'reveal';
    return;
  }

  const s = room.shared;

  if (action === 'beginDiscussion') {
    requireHost(room, playerId);
    if (room.phase !== 'reveal') return;
    room.phase = 'discuss';
    s.startedAt = Date.now();
    return;
  }

  if (action === 'startVote') {
    requireHost(room, playerId);
    if (room.phase !== 'discuss') return;
    openVote(room, room.players.filter(p => s.roster.indexOf(p.id) !== -1).map(p => ({ id: p.id, label: p.name, ownerId: p.id })), s.roster);
    room.phase = 'voting';
    return;
  }
  if (action === 'vote') {
    if (room.phase !== 'voting') throw new Error('لا يوجد تصويت الآن');
    if (castVote(room, playerId, String((payload && payload.option) || ''))) resolveImposterVote(room);
    return;
  }
  if (action === 'closeVote') {
    requireHost(room, playerId);
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
    requireHost(room, playerId);
    if (room.phase !== 'guess') return;
    finishImposter(room, 'caught', null);
    return;
  }
  if (action === 'revealResult') {
    // The host ends it without a vote: the answer is shown, nobody scores.
    requireHost(room, playerId);
    if (room.phase !== 'discuss' && room.phase !== 'voting') return;
    finishImposter(room, 'revealed', null);
    return;
  }
  if (action === 'restart') {
    requireHost(room, playerId);
    room._impScores = (s && s.scores) || room._impScores || {};
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
    addScore(room, playerId, WHOAMI_ORDER_POINTS[Math.min(at, WHOAMI_ORDER_POINTS.length - 1)]);
    s.board = scoreboardOf(room);
    if (activeRoster(room, s.roster).every(id => s.guessed.indexOf(id) !== -1)) revealWhoAmI(room);
    return;
  }

  if (action === 'reveal') {
    requireHost(room, playerId);
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
  if (room.game === 'spyfall' && s.phase === 'play' && s.endsAt) return s.endsAt + SPYFALL_GRACE_MS;
  if (room.game === 'bomb' && s.phase === 'ticking' && room._bombEndsAt) {
    const total = room._bombEndsAt - room._bombStart;
    const heat = s.heat || 0;
    return heat < BOMB_HEAT_AT.length ? room._bombStart + total * BOMB_HEAT_AT[heat] : room._bombEndsAt;
  }
  if (room.game === 'stop' && s.phase === 'writing' && s.endsAt) return s.endsAt + STOP_GRACE_MS;
  if (room.game === 'stop' && s.phase === 'collecting' && s.collectEndsAt) return s.collectEndsAt + STOP_GRACE_MS;
  if (QUIZ_GAMES[room.game] && s.phase === 'answering' && s.endsAt) return s.endsAt + QUIZ_GRACE_MS;
  if (room.game === 'fiveseconds' && s.phase === 'counting' && s.endsAt) return s.endsAt + FIVE_GRACE_MS;
  if (room.game === 'telephone' && s.phase === 'working' && s.endsAt) return s.endsAt + TELE_GRACE_MS;
  if (room.game === 'telephone' && s.phase === 'collecting' && s.collectEndsAt) return s.collectEndsAt + TELE_GRACE_MS;
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
  if (room.game === 'spyfall') {
    // Time's up: the table has to vote now.
    if (room.shared.phase !== 'play') return false;
    openSpyfallVote(room);
    return true;
  }
  if (room.game === 'bomb') {
    const s = room.shared;
    if (s.phase !== 'ticking') return false;
    if (now >= room._bombEndsAt) { explodeBomb(room); return true; }
    const total = room._bombEndsAt - room._bombStart;
    let bumped = false;
    while ((s.heat || 0) < BOMB_HEAT_AT.length && now >= room._bombStart + total * BOMB_HEAT_AT[s.heat || 0]) {
      s.heat = (s.heat || 0) + 1;
      bumped = true;
    }
    return bumped;
  }
  if (room.game === 'stop') {
    const s = room.shared;
    if (s.phase === 'writing') {
      // Time's up: give the phones a moment to send what they have.
      s.phase = 'collecting';
      s.collectEndsAt = now + STOP_COLLECT_MS;
      return true;
    }
    if (s.phase === 'collecting') { scoreStopRound(room); return true; }
    return false;
  }
  if (QUIZ_GAMES[room.game]) { closeQuizCard(room); return true; }
  if (room.game === 'fiveseconds') {
    if (room.shared.phase !== 'counting') return false;
    room.shared.phase = 'judging';
    return true;
  }
  if (room.game === 'telephone') {
    const s = room.shared;
    if (s.phase === 'working') {
      // Time's up: give the phones a moment to send what they have.
      s.phase = 'collecting';
      s.collectEndsAt = now + TELE_COLLECT_MS;
      return true;
    }
    if (s.phase === 'collecting') { finishTelephoneStep(room); return true; }
    return false;
  }
  return false;
};

/* ==========================================================================
   صدق ولا كذب — TWO TRUTHS AND A LIE
   Everyone writes two true things and one lie about themselves. One player
   at a time, the others vote for the lie: a point for spotting it, and a
   point to the storyteller for every voter fooled. No content bank at all.
   ========================================================================== */
const TT_CATCH_POINTS = 1;
const TT_FOOL_POINTS = 1;
const TT_MAX_LEN = 80;

const twoTruthsAction = (room, playerId, action, payload) => {
  if (action === 'start' || action === 'playAgain') {
    requireHost(room, playerId);
    if (room.players.length < 3) throw new Error('تحتاج 3 لاعبين على الأقل');
    if (action === 'playAgain' && room.shared.phase !== 'gameover') return;
    room._tt = {};
    room.secrets = {};
    room.shared = {
      phase: 'writing',
      submitted: [],
      roster: room.players.map(p => p.id),
      scores: (room.shared && room.shared.scores) || {},
      order: [],
      turn: -1
    };
    room.shared.board = scoreboardOf(room);
    room.phase = 'writing';
    return;
  }

  const s = room.shared;

  if (action === 'submit') {
    if (s.phase !== 'writing') throw new Error('انتهى وقت الكتابة');
    if (s.roster.indexOf(playerId) === -1) throw new Error('ستدخل من الجولة القادمة');
    const list = (Array.isArray(payload && payload.statements) ? payload.statements : [])
      .map(x => String(x || '').trim().slice(0, TT_MAX_LEN));
    const lie = Number(payload && payload.lie);
    if (list.length !== 3 || list.some(x => !x)) throw new Error('اكتب الجمل الثلاث');
    if (!(lie >= 0 && lie <= 2 && lie === Math.floor(lie))) throw new Error('اختر الكذبة');
    // Shuffled once here, so the lie is never "always the third one".
    const order = shuffled([0, 1, 2]);
    room._tt[playerId] = { items: order.map(i => list[i]), lie: order.indexOf(lie) };
    if (s.submitted.indexOf(playerId) === -1) s.submitted.push(playerId);
    if (activeRoster(room, s.roster).every(id => s.submitted.indexOf(id) !== -1)) {
      s.order = shuffled(s.submitted.slice());
      nextTwoTruthsTurn(room);
    }
    return;
  }

  if (action === 'closeWriting') {
    // The host starts with whoever has written; a phone that never sends
    // must not hold the table.
    requireHost(room, playerId);
    if (s.phase !== 'writing') return;
    if (s.submitted.length < 1) throw new Error('محدش كتب لسه');
    s.order = shuffled(s.submitted.slice());
    nextTwoTruthsTurn(room);
    return;
  }

  if (action === 'vote') {
    if (s.phase !== 'voting') throw new Error('لا يوجد تصويت الآن');
    if (castVote(room, playerId, String((payload && payload.option) || ''))) resolveTwoTruths(room);
    return;
  }

  if (action === 'closeVote') {
    requireHost(room, playerId);
    if (s.phase !== 'voting') return;
    if (closeVote(room)) resolveTwoTruths(room);
    return;
  }

  if (action === 'next') {
    requireHost(room, playerId);
    if (s.phase !== 'result') return;
    nextTwoTruthsTurn(room);
    return;
  }

  throw new Error('إجراء غير معروف');
};

const nextTwoTruthsTurn = (room) => {
  const s = room.shared;
  s.turn = s.turn < 0 ? 0 : s.turn + 1;
  s.lieIndex = null;
  s.caught = null;
  s.fooled = null;
  if (s.turn >= s.order.length) {
    s.phase = 'gameover';
    s.subjectId = null;
    s.subjectName = '';
    s.items = null;
    s.vote = null;
    s.board = scoreboardOf(room);
    room.phase = 'gameover';
    return;
  }
  const subject = s.order[s.turn];
  const entry = room._tt[subject];
  s.subjectId = subject;
  s.subjectName = roomPlayerName(room, subject);
  s.items = entry.items;
  // Every option belongs to the storyteller, so the voting engine keeps them out of it.
  openVote(room, entry.items.map((text, i) => ({ id: 'i' + i, label: text, ownerId: subject })),
           s.roster.filter(id => id !== subject));
  s.phase = 'voting';
  room.phase = 'voting';
};

const resolveTwoTruths = (room) => {
  const s = room.shared;
  const entry = room._tt[s.subjectId] || { lie: 0 };
  const lieId = 'i' + entry.lie;
  const ballots = room._ballots || {};
  const caught = [], fooled = [];
  Object.keys(ballots).forEach(pid => { (ballots[pid] === lieId ? caught : fooled).push(pid); });
  caught.forEach(pid => addScore(room, pid, TT_CATCH_POINTS));
  if (fooled.length) addScore(room, s.subjectId, TT_FOOL_POINTS * fooled.length);
  s.lieIndex = entry.lie;
  s.caught = caught.map(id => roomPlayerName(room, id));
  s.fooled = fooled.map(id => roomPlayerName(room, id));
  s.board = scoreboardOf(room);
  s.phase = 'result';
  room.phase = 'result';
};

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

const quizAnswerMatches = (item, text) => {
  const f = normaliseClue(text);
  if (!f) return false;
  return [item.a].concat(item.alt || []).some(a => normaliseClue(a) === f);
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
    if (s.phase !== 'answering') throw new Error('انتهى وقت الإجابة');
    if ((s.roster || []).indexOf(playerId) === -1) throw new Error('لست ضمن هذه الجولة');
    const text = String((payload && payload.text) || '').trim().slice(0, 60);
    if (!text) return;
    const now = Date.now();
    if (now > s.endsAt + QUIZ_GRACE_MS) { closeQuizCard(room); return; }
    room._answers = room._answers || {};
    if (room._answers[playerId]) return;       // already right, or the one try is used
    const right = quizAnswerMatches(room._card, text);
    const name = roomPlayerName(room, playerId);
    if (right) {
      room._answers[playerId] = { text: text, time: Math.min(now, s.endsAt), seq: s.solved.length };
      s.solved.push(playerId);
      s.feed.push({ name: name, right: true });
    } else if (cfg.retry) {
      // A wrong guess is fun for the table to see, and the player tries again.
      s.feed.push({ name: name, text: text, right: false });
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
    if (room.hostId !== playerId && Date.now() < s.endsAt) throw new Error('المضيف فقط يمكنه فعل ذلك');
    closeQuizCard(room);
    return;
  }

  if (action === 'nextQuestion') {
    requireHost(room, playerId);
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
    // From the judging phase, or early: a player who named three things in two
    // seconds doesn't have to wait for the clock.
    requireHost(room, playerId);
    if (s.phase !== 'judging' && s.phase !== 'counting') return;
    const ok = !!(payload && payload.ok);
    if (ok) addScore(room, s.turnId, 1);
    s.verdict = ok;
    s.lastName = s.turnName;
    s.lastPrompt = s.prompt;
    advanceFive(room);
    return;
  }

  if (action === 'skipTurn') {
    requireHost(room, playerId);
    if (s.phase !== 'ready') return;
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

const advanceFive = (room) => {
  const s = room.shared;
  s.turn += 1;
  if (s.turn >= s.order.length) { s.turn = 0; s.round += 1; }
  if (s.round > s.rounds) {
    s.phase = 'gameover';
    s.turnId = null;
    s.turnName = '';
    s.prompt = null;
    s.endsAt = null;
    s.board = scoreboardOf(room);
    return;
  }
  setFiveTurn(room);
};

/* ==========================================================================
   ارسم واكتب — DRAWING TELEPHONE
   Every player starts a chain with a phrase. The next player draws it, the
   one after describes the drawing, the next draws that description... Each
   step everyone works on a different chain at once, and at the end the
   host walks the table through each chain. Nothing is scored: the reveal
   is the game.
   ========================================================================== */
const TELE_MAX_STEPS = 6;          // the phrase and five more
const TELE_DRAW_SECONDS = 75;
const TELE_WRITE_SECONDS = 35;
const TELE_GRACE_MS = 1500;
const TELE_COLLECT_MS = 3000;

/** The same limits Draw & Guess puts on a stroke list, for a whole drawing at once. */
const cleanStrokes = (batch) => {
  const out = [];
  let points = 0;
  (Array.isArray(batch) ? batch : []).forEach(st => {
    const left = DRAW_MAX_POINTS - points;
    if (left < 2) return;
    const tool = DRAW_TOOLS.indexOf(String((st && st.t) || 'f')) !== -1 ? String(st.t || 'f') : 'f';
    let pts = ((st && st.p) || []).map(n => Math.max(0, Math.min(255, Math.round(Number(n) || 0))));
    const exact = DRAW_TOOL_POINTS[tool];
    if (exact) {
      if (pts.length !== exact || left < exact) return;
    } else {
      if (pts.length > left) pts = pts.slice(0, left - (left % 2));
      if (pts.length < 2) return;
    }
    const stroke = { c: String(st.c || '#111').slice(0, 8), w: Math.max(1, Math.min(48, Number(st.w) || 4)), p: pts };
    if (tool !== 'f') stroke.t = tool;
    out.push(stroke);
    points += pts.length;
  });
  return out;
};

const telephoneAction = (room, playerId, action, payload) => {
  if (action === 'start' || action === 'playAgain') {
    requireHost(room, playerId);
    if (room.players.length < 3) throw new Error('تحتاج 3 لاعبين على الأقل');
    if (action === 'playAgain' && room.shared.phase !== 'done') return;
    const lang = roomLangOf(room, payload);
    const roster = room.players.map(p => p.id);
    const phrases = nextPrompts(room, DRAW_WORDS[lang] || DRAW_WORDS.ar, 'tele_' + lang, roster.length);
    room._chains = roster.map((pid, i) => ({ owner: pid, steps: [{ kind: 'text', by: pid, text: phrases[i] }] }));
    room.shared = {
      phase: 'working', lang: lang, roster: roster,
      steps: Math.min(roster.length, TELE_MAX_STEPS),
      step: 0, kind: null, submitted: [], endsAt: null, seconds: 0
    };
    room.phase = 'play';
    startTelephoneStep(room, 1);
    return;
  }

  const s = room.shared;

  if (action === 'submit') {
    if (s.phase !== 'working' && s.phase !== 'collecting') throw new Error('انتهت هذه الخطوة');
    const task = (room.secrets[playerId] || {}).task;
    if (!task) throw new Error('لست ضمن هذه الجولة');
    if (s.submitted.indexOf(playerId) !== -1) return;
    const chain = room._chains[task.chain];
    chain.steps[s.step] = task.kind === 'draw'
      ? { kind: 'draw', by: playerId, strokes: cleanStrokes(payload && payload.strokes) }
      : { kind: 'text', by: playerId, text: String((payload && payload.text) || '').trim().slice(0, 60) };
    s.submitted.push(playerId);
    if (activeRoster(room, s.roster).every(id => s.submitted.indexOf(id) !== -1)) finishTelephoneStep(room);
    return;
  }

  if (action === 'revealNext' || action === 'revealBack') {
    requireHost(room, playerId);
    if (s.phase !== 'reveal') return;
    const r = s.reveal;
    const last = room._chains[r.chain].steps.length - 1;
    if (action === 'revealBack') {
      if (r.step > 0) r.step -= 1;
      else if (r.chain > 0) { r.chain -= 1; r.step = room._chains[r.chain].steps.length - 1; publishTelephoneChain(room); }
      return;
    }
    if (r.step < last) { r.step += 1; return; }
    if (r.chain < room._chains.length - 1) { r.chain += 1; r.step = 0; publishTelephoneChain(room); return; }
    s.phase = 'done';
    s.chain = null;
    s.summary = room._chains.map(ch => ({
      ownerName: roomPlayerName(room, ch.owner),
      first: ch.steps[0].text,
      last: (ch.steps.filter(st => st.kind === 'text').slice(-1)[0] || {}).text || ''
    }));
    return;
  }

  throw new Error('إجراء غير معروف');
};

const startTelephoneStep = (room, k) => {
  const s = room.shared;
  const n = s.roster.length;
  s.step = k;
  s.kind = k % 2 === 1 ? 'draw' : 'write';
  s.submitted = [];
  s.phase = 'working';
  s.seconds = s.kind === 'draw' ? TELE_DRAW_SECONDS : TELE_WRITE_SECONDS;
  s.endsAt = Date.now() + s.seconds * 1000;
  s.collectEndsAt = null;
  room.secrets = {};
  room._chains.forEach((chain, c) => {
    const pid = s.roster[(c + k) % n];
    const prev = chain.steps[k - 1] || { kind: 'text', text: '' };
    room.secrets[pid] = {
      task: {
        chain: c,
        kind: s.kind,
        prev: prev.kind === 'draw' ? { kind: 'draw', strokes: prev.strokes || [] } : { kind: 'text', text: prev.text || '' }
      }
    };
  });
};

const finishTelephoneStep = (room) => {
  const s = room.shared;
  // Whoever never sent leaves a blank in their chain rather than holding the table.
  room._chains.forEach(chain => {
    if (!chain.steps[s.step]) chain.steps[s.step] = s.kind === 'draw' ? { kind: 'draw', by: null, strokes: [] } : { kind: 'text', by: null, text: '' };
  });
  if (s.step + 1 >= s.steps) {
    s.phase = 'reveal';
    s.reveal = { chain: 0, step: 0 };
    s.endsAt = null;
    s.collectEndsAt = null;
    room.secrets = {};
    publishTelephoneChain(room);
    return;
  }
  startTelephoneStep(room, s.step + 1);
};

/** One chain at a time reaches the phones: a whole evening's drawings at once would be most of a phone's data. */
const publishTelephoneChain = (room) => {
  const s = room.shared;
  const ch = room._chains[s.reveal.chain];
  s.chainCount = room._chains.length;
  s.chain = {
    ownerName: roomPlayerName(room, ch.owner),
    steps: ch.steps.map(st => ({ kind: st.kind, byName: st.by ? roomPlayerName(room, st.by) : '', text: st.text, strokes: st.strokes }))
  };
};
