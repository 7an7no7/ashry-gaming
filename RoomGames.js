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
  // Sides kept as a map (أسماء الرموز); سكرو's two lists of seats are dealt afresh.
  if (room.shared && room.shared.teams && !Array.isArray(room.shared.teams)) room._teamsMemo = room.shared.teams;
  // Codenames' options and the evening's score come back with the teams.
  if (room.game === 'codenames' && room.shared) {
    room._cnMemo = { settings: room.shared.settings || null, wins: room.shared.wins || null };
  }
  room.shared = {};
  room.secrets = {};
  // A team's channel belongs to that game; the next one may have other sides.
  if (room.chat) room.chat = room.chat.filter(m => !m.team);
  // Every piece of server-side scratch, or the previous game's answer survives
  // into the next one.
  room._key = null;
  room._assignments = null;
  room._clueText = null;
  room._truth = null;
  room._lies = null;
  room._word = null;
  room._ballots = null;
  room._voteOwners = null;
  room._fibTruthId = null;
  room._joWord = null;
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
  room._herd = null;
  room._mafia = null;
  room._screw = null;
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
  'twotruths', 'emoji', 'proverbs', 'fiveseconds', 'telephone', 'monkey',
  'herd', 'mafia', 'screw'
];

const ROOM_CHAT_MAX = 60;       // lines a room keeps, events included
const ROOM_CHAT_MAX_LEN = 200;  // characters in one

/**
 * Adds a line to the room's chat, keeping only the last ROOM_CHAT_MAX. Ids
 * only ever grow (room.chatSeq): counting on from the last line reused an id
 * once a team's lines had been dropped, and a phone took the new line for one
 * it had already shown.
 */
const pushChat = (room, entry) => {
  const chat = (room.chat || []).slice(-(ROOM_CHAT_MAX - 1));
  const top = chat.reduce((m, x) => Math.max(m, Number(x.id) || 0), Number(room.chatSeq) || 0);
  room.chatSeq = top + 1;
  chat.push(Object.assign({ id: room.chatSeq, at: Date.now() }, entry));
  room.chat = chat;
};

/**
 * Two names for one person: case, spaces, diacritics and the Arabic letters
 * people spell alike (samePlayer on the phone). A room's join and a screen
 * becoming a player both refuse a name that is already taken this way.
 */
const sameRoomName = (a, b) =>
  foldArabicLetters(a).replace(/\s+/g, ' ').trim() === foldArabicLetters(b).replace(/\s+/g, ' ').trim();

/**
 * A tap aimed at a state that has since moved on - the second of a double
 * tap, or a slow phone - carries what its phone saw (the round, the player
 * up), and is dropped without an error when that no longer matches. A phone
 * too old to send it is trusted, as before.
 */
const staleTap = (payload, field, current) => {
  if (!payload || payload[field] === undefined || payload[field] === null) return false;
  return String(payload[field]) !== String(current);
};

/** A fresh `shared.dealId`: phones key "already sent this" on it. */
const newDealId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 10);

/**
 * Something that happened, said in the chat so a player who isn't in the room
 * with the others can follow: who came and went, what started, who hosts now.
 * Stored as a kind and its details (`sys`, `p`), so every phone says it in its
 * own language. They never count as unread.
 */
const roomEvent = (room, kind, details) => pushChat(room, { sys: kind, p: details || {} });

/**
 * The chat one device may read. A team's channel in أسماء الرموز goes only to
 * that team - the other team, and a screen facing everyone, never receive it.
 */
const chatFor = (room, playerId) => {
  const teams = (room.shared && room.shared.teams) || {};
  const mine = teams[playerId];
  return (room.chat || []).filter(m => !m.team || (!!mine && mine.team === m.team));
};

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
    if (room.players.some(p => sameRoomName(p.name, name))) {
      throw new Error('الاسم مستخدم بالفعل في هذه الغرفة');
    }
    room.screens = room.screens.filter(s => s.id !== playerId);
    room.players.push({ id: playerId, name: name });
    return;
  }

  if (action === 'chat') {
    // Short messages between the phones, for a table that isn't at one table.
    // Kept on the room, outside any game, so it survives the hub and every deal.
    const text = String((payload && payload.text) || '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, ROOM_CHAT_MAX_LEN);
    if (!text) throw new Error('اكتب رسالة');
    const who = room.players.find(p => p.id === playerId) || (room.screens || []).find(x => x.id === playerId);
    if (!who) throw new Error('لست في الغرفة');
    const now = Date.now();
    // Five in five seconds is a person; more is a stuck key.
    if ((room.chat || []).filter(m => m.from === playerId && now - m.at < 5000).length >= 5) throw new Error('على مهلك شوية');
    const entry = { from: playerId, name: who.name || '📺', text: text };
    if (payload && payload.to === 'team') {
      // أسماء الرموز: the team's own channel. The projection keeps it from the
      // other team (chatFor). A spymaster in play reads it and can't write to
      // it: the real game lets them hear the table, never talk to it.
      const mine = room.game === 'codenames' && room.shared && room.shared.teams && room.shared.teams[playerId];
      if (!mine) throw new Error('الشات ده للفريق بس');
      if (mine.role === 'spymaster' && room.phase === 'playing') throw new Error('الرئيس بيقرأ بس، مايكتبش لفريقه');
      entry.team = mine.team;
    }
    pushChat(room, entry);
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
    const had = room.game;
    clearGameState(room);
    room.game = null;
    room.phase = 'lobby';
    if (had) roomEvent(room, 'hub');
    return;
  }

  if (!room.game) throw new Error('اختر لعبة أولاً');

  // Dealing happens once. Without this a second 'start' - a double tap either
  // side of the round trip, or a retry - re-deals a game already under way.
  if (action === 'start' && room.phase !== 'lobby') {
    throw new Error('اللعبة بدأت بالفعل');
  }

  // "Next round" sent from a round that is already over - the second tap of a
  // double tap - would deal another round nobody saw. Every game, one place.
  if (action === 'nextRound' && room.shared && room.shared.round !== undefined && staleTap(payload, 'round', room.shared.round)) return;

  // What was there before the move, to tell whether it dealt something new.
  const sharedBefore = room.shared;
  const dealing = action === 'start' || action === 'nextRound' || action === 'playAgain';
  const textBefore = dealing ? JSON.stringify(room.shared || {}) : '';

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
    case 'monkey':     monkeyRoomAction(room, playerId, action, payload); break;
    case 'herd':       herdAction(room, playerId, action, payload); break;
    case 'mafia':      mafiaAction(room, playerId, action, payload); break;
    case 'screw':      screwAction(room, playerId, action, payload); break;
    default: throw new Error('لعبة غير معروفة');
  }

  if (action === 'start' && room.phase !== 'lobby') roomEvent(room, 'started', { game: room.game });

  // Whoever is present when a game is dealt is in it. This can't be inferred
  // from secrets — a Codenames operative and a Just One guesser both have none.
  if ((action === 'start' || action === 'nextRound') && room.shared && !room.shared.roster) {
    room.shared.roster = room.players.map(p => p.id);
  }

  // A new deal - a start, a next round, a play again that changed anything, or
  // a game that replaced its whole state (the next trivia question) - gets a
  // fresh stamp, so a phone's "I already sent this" memory can't carry over.
  if (room.shared && typeof room.shared === 'object' &&
      (room.shared !== sharedBefore || (dealing && JSON.stringify(room.shared) !== textBefore))) {
    room.shared.dealId = newDealId();
  }
};

/* ==========================================================================
   أتوبيس كومبليت — STOP THE BUS (rooms)
   The same paper game, with every phone as the paper. A letter is dealt,
   everyone types an answer per category, and the first to press وقف closes
   the round for the whole table: the other phones get a few seconds to send
   what they had typed. وقف itself is refused until every box of that sheet
   holds a word starting with the letter (stopAnswerFits). The server then
   scores by comparing the answers - 10 for an answer nobody else had, 5 for
   one somebody shared, 0 for a blank or a word that doesn't start with the
   letter - and checks each against the dictionary for its category
   (stopWordKnown, StopWords.js): a word it doesn't know scores 0 and is marked
   for the host (word: 'unknown'), unless another player wrote the same word
   too, which a made-up word almost never is. The host can correct any cell
   before the points are banked.

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

// foldStopAnswer, stopAnswerFits and stopWordKnown are in StopWords.js, shared with the page.

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
    // A sheet from the last round, arriving after the next letter was dealt, is not this round's.
    if (staleTap(payload, 'round', s.round)) return;
    if (s.phase !== 'writing' && s.phase !== 'collecting') return;
    if ((s.roster || []).indexOf(playerId) === -1) throw new Error('لست ضمن هذه الجولة');
    if (s.submitted.indexOf(playerId) !== -1) return;
    const given = (payload && payload.answers) || {};
    const answers = {};
    s.cats.forEach(c => { answers[c] = String(given[c] || '').trim().slice(0, 30); });
    // وقف closes everyone's sheet, so it needs a full one: every box a word on the letter.
    if (s.phase === 'writing' && payload && payload.stop && !s.cats.every(c => stopAnswerFits(answers[c], s.lang, s.letter))) {
      throw new Error('املأ كل الخانات بكلمات بتبدأ بالحرف قبل ما توقف');
    }
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
      folded[pid] = { raw: raw, f: f, ok: ok, known: ok && stopWordKnown(s.lang, cat, raw) !== false };
    });
    const counts = {};
    roster.forEach(pid => { if (folded[pid].ok) counts[folded[pid].f] = (counts[folded[pid].f] || 0) + 1; });
    roster.forEach(pid => {
      const a = folded[pid];
      const shared = a.ok && counts[a.f] > 1;
      // known: in the dictionary; shared: not, but someone else wrote it too; unknown: the host decides.
      const word = !a.ok ? '' : a.known ? 'known' : shared ? 'shared' : 'unknown';
      const pts = !a.ok || word === 'unknown' ? 0 : (shared ? 5 : 10);
      results[pid] = results[pid] || {};
      results[pid][cat] = { text: a.raw, pts: pts, ok: a.ok, word: word, manual: false };
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
// A pass can be sent straight back for this long: the phone cannot hear whether
// anything was said, so the table settles it. The host is not on the clock.
const BOMB_SEND_BACK_MS = 15000;
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
    s.fromId = s.holderId;                 // who it came from, for a send-back
    s.passedAt = Date.now();
    s.holderId = present[(at + 1) % present.length];
    s.holderName = roomPlayerName(room, s.holderId);
    s.passes = (s.passes || 0) + 1;
    return;
  }
  if (action === 'sendBack') {
    // "You passed without saying anything." The phone can't hear the table, so
    // whoever was handed the bomb can hand it straight back, and the host can
    // settle it at any point. The fuse keeps burning through the argument.
    if (s.phase !== 'ticking') return;
    const isHost = room.hostId === playerId;
    if (!s.fromId) throw new Error('مفيش تمريرة ترجع');
    if (!isHost && playerId !== s.holderId) throw new Error('القنبلة مش معاك');
    if (!isHost && Date.now() - (s.passedAt || 0) > BOMB_SEND_BACK_MS) throw new Error('فات وقت الاعتراض');
    if (!room.players.some(p => p.id === s.fromId)) throw new Error('اللاعب ده مش في الغرفة');
    s.holderId = s.fromId;
    s.holderName = roomPlayerName(room, s.holderId);
    s.fromId = null;
    s.passes = Math.max(0, (s.passes || 0) - 1);
    s.sentBack = (s.sentBack || 0) + 1;
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

  // Whoever is here when a question starts is in it: someone who joined during
  // the evening can buzz from the next question, not only after a new game.
  const freshRoster = () => { s.roster = room.players.map(p => p.id); };

  // The first in line answered. Right: a point and a fresh question. Wrong:
  // out of the line, and the next one gets a go at the same question. The
  // verdict names who it was for ({ id }): a double tap on ❌ used to put the
  // next in line out too, without a word from them.
  if (action === 'correct') {
    const first = s.buzzes[0];
    if (staleTap(payload, 'id', first && first.id)) return;
    if (!first) return;
    addScore(room, first.id, 1);
    s.last = { id: first.id, name: first.name, ok: true };
    s.buzzes = [];
    s.round += 1;
    freshRoster();
    s.board = scoreboardOf(room);
    return;
  }
  if (action === 'wrong') {
    if (staleTap(payload, 'id', s.buzzes[0] && s.buzzes[0].id)) return;
    const first = s.buzzes.shift();
    if (!first) return;
    if (payload && payload.penalty) addScore(room, first.id, -1);
    s.last = { id: first.id, name: first.name, ok: false };
    s.board = scoreboardOf(room);
    return;
  }
  if (action === 'reset') { s.buzzes = []; s.last = null; s.round += 1; freshRoster(); return; }
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
    freshRoster();
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
    const prev = room.shared || {};
    // From the result only, so a double tap can't deal a round nobody played.
    if (action === 'nextRound' && prev.phase !== 'result') return;
    if (room.players.length < 3) throw new Error('تحتاج 3 لاعبين على الأقل');

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

    room._clueText = room._clueText || {};
    room._clueText[playerId] = clue;
    if (s.submitted.indexOf(playerId) === -1) s.submitted.push(playerId);

    if (justOneAllWritten(room)) revealJustOneClues(room);
    return;
  }

  if (action === 'closeWriting') {
    // A writer whose phone died must not hold the table: the host goes on with
    // the clues that are in.
    requireHost(room, playerId);
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
    requireHost(room, playerId);
    if (room.shared.phase !== 'guessing') return;
    skipJustOneRound(room);
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
      // Only someone still here holds the slot: a spymaster who left frees it.
      const clash = Object.keys(s.teams).find(id =>
        id !== playerId &&
        room.players.some(p => p.id === id) &&
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
    // A new board, and maybe new sides: last game's team talk goes.
    if (room.chat) room.chat = room.chat.filter(m => !m.team);
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

  if (action === 'passTurn') {
    // The host moves the game on when a team is stuck: a spymaster who went
    // quiet before the clue, or a team that won't pass.
    requireHost(room, playerId);
    if (room.phase !== 'playing' || s.winner) return;
    endCodenamesTurn(room);
    return;
  }

  if (action === 'setSpymaster') {
    // A spymaster left or their phone died: the host hands the key to someone
    // else on that team, and whoever held it goes back to guessing.
    requireHost(room, playerId);
    if (room.phase !== 'playing' || s.winner) return;
    const team = payload.team === 'blue' ? 'blue' : (payload.team === 'red' ? 'red' : null);
    const id = String(payload.playerId || '');
    const t = teamOf(id);
    if (!team || !room.players.some(p => p.id === id) || !t || t.team !== team) {
      throw new Error('اختار لاعب من نفس الفريق');
    }
    if (t.role === 'spymaster') return;
    Object.keys(s.teams).forEach(other => {
      if (s.teams[other].team === team && s.teams[other].role === 'spymaster') {
        s.teams[other] = { team: team, role: 'operative' };
        if (room.secrets) room.secrets[other] = null;
      }
    });
    s.teams[id] = { team: team, role: 'spymaster' };
    room.secrets = room.secrets || {};
    room.secrets[id] = { key: room._key };
    // A spymaster doesn't mark cards.
    Object.keys(s.marks || {}).forEach(idx => {
      const left = s.marks[idx].filter(x => x !== id);
      if (left.length) s.marks[idx] = left; else delete s.marks[idx];
    });
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
 *   opts.hideOwners  when whose option is whose is itself the secret (Fibbage:
 *                    the one option nobody owns is the truth). The owners stay
 *                    in room._voteOwners, the published options carry none, and
 *                    each owner's own slice says which option is theirs
 *                    (`voteOwn`). Once the vote closes the owners are public.
 */
const openVote = (room, options, eligible, opts) => {
  room._ballots = {};
  // The last vote's owners, and every phone's note of which option was its own.
  room._voteOwners = null;
  Object.keys(room.secrets || {}).forEach(id => {
    const slice = room.secrets[id];
    if (!slice || !('voteOwn' in slice)) return;
    delete slice.voteOwn;
    if (!Object.keys(slice).length) delete room.secrets[id];
  });

  let published = options;
  if (opts && opts.hideOwners) {
    room._voteOwners = {};
    room.secrets = room.secrets || {};
    published = options.map(o => {
      const copy = Object.assign({}, o);
      if (copy.ownerId) {
        room._voteOwners[copy.id] = copy.ownerId;
        room.secrets[copy.ownerId] = Object.assign({}, room.secrets[copy.ownerId] || {}, { voteOwn: copy.id });
      }
      delete copy.ownerId;
      return copy;
    });
  }

  room.shared.vote = {
    options: published,
    eligible: eligible || room.players.map(p => p.id),
    voted: [],
    phase: 'voting',
    results: null
  };
};

/** Whose option this is, whether it was published or kept on the server. */
const voteOwnerOf = (room, option) =>
  option.ownerId || (room._voteOwners && room._voteOwners[option.id]) || null;

const castVote = (room, playerId, optionId) => {
  const v = room.shared.vote;
  if (!v || v.phase !== 'voting') throw new Error('لا يوجد تصويت الآن');
  if (v.eligible.indexOf(playerId) === -1) throw new Error('لست ضمن هذه الجولة');

  const option = v.options.find(o => o.id === optionId);
  if (!option) throw new Error('اختيار غير صحيح');
  if (voteOwnerOf(room, option) === playerId) {
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
      ownerId: voteOwnerOf(room, o),
      count: voters.length,
      voters: voters.map(nameOf)
    };
  });
  v.totalVotes = Object.keys(ballots).length;
  v.phase = 'results';
  return true;
};

/**
 * Someone left while a vote was open: their ballot goes with them, and the vote
 * closes if everyone still here has voted. True when it closed, so the game
 * can resolve it exactly as after the last ballot.
 */
const voteDropPlayer = (room, playerId) => {
  const v = room.shared && room.shared.vote;
  if (!v || v.phase !== 'voting') return false;
  if (room._ballots) delete room._ballots[playerId];
  v.voted = v.voted.filter(id => id !== playerId);
  v.eligible = v.eligible.filter(id => id !== playerId);
  if (!activeRoster(room, v.eligible).every(id => v.voted.indexOf(id) !== -1)) return false;
  return closeVote(room);
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
    // From the results only: a double tap must not skip a question unseen.
    const vote = room.shared && room.shared.vote;
    if (action === 'nextRound' && !(vote && vote.phase === 'results')) return;
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
    // From the results only: a double tap must not skip a question unseen.
    if (action === 'nextRound' && (room.shared || {}).phase !== 'results') return;
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
    // From the results only: a double tap must not skip a question unseen.
    if (action === 'nextRound' && (room.shared || {}).phase !== 'results') return;
    if (room.players.length < 3) throw new Error('تحتاج 3 لاعبين على الأقل');

    const lang = payload.lang === 'en' ? 'en' : 'ar';
    const item = nextPrompt(room, FIBBAGE[lang], 'fib_' + lang);
    const round = ((room.shared && room.shared.round) || 0) + 1;
    const scores = (room.shared && room.shared.scores) || {};

    // The real answer stays server-side until the votes are in.
    room._truth = item.a;
    room._lies = {};
    room._fibTruthId = null;
    room._voteOwners = null;
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

    if (activeRoster(room, s.roster).every(id => s.submitted.indexOf(id) !== -1)) openFibbageVote(room);
    return;
  }

  if (action === 'closeWriting') {
    // A writer whose phone died must not hold the table: the vote opens on
    // the lies that are in (and on the truth alone, if nobody wrote).
    requireHost(room, playerId);
    if (room.shared.phase !== 'writing') return;
    openFibbageVote(room);
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

/**
 * The pile to vote on. Nothing about an option may say which one is true: the
 * ids are random (they used to be 'truth' and 'l_' + the writer), and whose lie
 * is whose stays on the server (hideOwners) - the one option nobody owned was
 * the truth, in plain sight of any phone that looked.
 */
const openFibbageVote = (room) => {
  const s = room.shared;
  const liars = activeRoster(room, s.roster);
  const taken = {};
  const newId = () => {
    let id;
    do { id = 'o' + Math.random().toString(36).slice(2, 8); } while (taken[id]);
    taken[id] = true;
    return id;
  };
  const options = liars
    .filter(id => room._lies[id])
    .map(id => ({ id: newId(), label: room._lies[id], ownerId: id }));
  room._fibTruthId = newId();
  options.push({ id: room._fibTruthId, label: room._truth });
  openVote(room, shuffled(options), liars, { hideOwners: true });
  s.phase = 'voting';
  room.phase = 'voting';
};

const scoreFibbage = (room) => {
  const v = room.shared.vote;
  // A vote opened before the ids were random still calls the truth 'truth'.
  const truthId = room._fibTruthId || 'truth';
  v.results.forEach(r => {
    if (r.id === truthId) {
      // Everyone who found the real answer scores.
      Object.keys(room._ballots).forEach(pid => {
        if (room._ballots[pid] === truthId) addScore(room, pid, FIBBAGE_TRUTH_POINTS);
      });
    } else if (r.ownerId && r.count > 0) {
      addScore(room, r.ownerId, FIBBAGE_FOOL_POINTS * r.count);
    }
  });
  room.shared.truth = room._truth;
  room.shared.truthId = truthId;
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

/** The word's shape for the guessers: a dash per letter, spaces kept. */
const drawHint = (word) => String(word || '').split('').map(ch => ch === ' ' ? ' ' : '_').join(' ');

/** How alike two folded words are, 0 to 1 (Levenshtein). */
const stringSimilarity = (a, b) => {
  const longer = a.length < b.length ? b : a, shorter = a.length < b.length ? a : b;
  if (!longer.length) return 1;
  const costs = [];
  for (let i = 0; i <= a.length; i++) {
    let last = i;
    for (let j = 0; j <= b.length; j++) {
      if (i === 0) costs[j] = j;
      else if (j > 0) {
        let v = costs[j - 1];
        if (a.charAt(i - 1) !== b.charAt(j - 1)) v = Math.min(v, last, costs[j]) + 1;
        costs[j - 1] = last; last = v;
      }
    }
    if (i > 0) costs[b.length] = last;
  }
  return (longer.length - costs[b.length]) / longer.length;
};

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
    // Once the word is out only (a win or a reveal), so a double tap can't skip a drawer.
    if (action === 'nextRound' && !(room.shared && room.shared.word)) return;
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
      roster: room.players.map(p => p.id),
      hint: drawHint(word)
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
    // A near miss gets a nudge: the word with a letter off, or a longer form of it.
    const close = !right && stringSimilarity(normaliseClue(text), normaliseClue(room._word)) >= 0.7;

    s.guesses.push({ name: player ? player.name : '', text: text, right: right, close: close });
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
  // The tap names the turn it was meant for ({ turn: turnIndex, round }), so a
  // double tap doesn't skip the next artist too.
  if (action === 'skipTurn') {
    requireHost(room, playerId);
    if (staleTap(payload, 'turn', s.turnIndex) || staleTap(payload, 'round', s.round)) return;
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
  if (room.game === 'monkey' && s.phase === 'play' && s.endsAt && !s.timedOut) return s.endsAt + MONKEY_GRACE_MS;
  if (room.game === 'mafia' && (s.phase === 'night' || s.phase === 'day') && s.endsAt) return s.endsAt + MAFIA_GRACE_MS;
  if (room.game === 'screw' && (s.phase === 'memorize' || s.phase === 'play' || s.phase === 'thiefGuess') && s.endsAt) return s.endsAt + SKREW_GRACE_MS;
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
  if (room.game === 'monkey') {
    const s = room.shared;
    if (s.phase !== 'play' || !s.endsAt || s.timedOut) return false;
    if (s.autoPenalty) {
      // Time's up: a quarter to the player up, and on to the next.
      monkeyQuarter(room, s.turnId);
      s.verdict = { kind: 'timeout', loser: s.turnName, loserId: s.turnId };
      if (s.mode === 'letters') s.letters = [];
      if (!monkeyCheckEnd(room)) advanceMonkey(room, s.turn);
    } else {
      s.timedOut = true;      // the host decides from the phones
    }
    return true;
  }
  if (room.game === 'mafia') {
    // The night's clock: whoever hasn't tapped doesn't act. The day's: the vote opens.
    const s = room.shared;
    if (s.phase === 'night') { mafiaEndNight(room); return true; }
    if (s.phase === 'day') { mafiaOpenVote(room); return true; }
    return false;
  }
  if (room.game === 'screw') {
    // The memorize clock ran out: play starts. A turn's (or the vote's) clock: the same as the host's skip.
    if (!room._screw) return false;
    return screwApply(room, () => {
      if (room.shared.phase !== 'memorize') return screwSkip(room);
      screwBeginPlay(room);
      return true;
    });
  }
  return false;
};

/* ==========================================================================
   WHEN SOMEONE LEAVES
   --------------------------------------------------------------------------
   The room server calls roomPlayerLeft once a player has left, or the host
   has removed one whose phone is gone: they are already out of room.players
   and their secret is deleted. Each game lets go of them at once instead of
   waiting on someone who will never answer - the round moves on when they
   were the last one it waited for, a turn or a bomb they held passes, a vote
   they hadn't cast closes, a guess only they could make is settled the way
   the host's skip would settle it. `name` is theirs, since the room no
   longer knows it.

   The server runs it on a copy and keeps the room as it was if it throws, so
   leaving always works.
   ========================================================================== */
const roomPlayerLeft = (room, playerId, name) => {
  const s = room.shared;
  if (!room.game || !s || typeof s !== 'object') return;
  const here = (id) => room.players.some(p => p.id === id);
  const allIn = (list) => activeRoster(room, s.roster).every(id => (list || []).indexOf(id) !== -1);
  // Their ballot goes with them; true when the vote is now complete and closed.
  const voteClosed = () => voteDropPlayer(room, playerId);

  if (room.game === 'codenames') {
    // Their place on a side is free again: a spymaster's slot can be taken in
    // the lobby, or handed on by the host mid-game (setSpymaster).
    if (s.teams) delete s.teams[playerId];
    Object.keys(s.marks || {}).forEach(idx => {
      const left = s.marks[idx].filter(x => x !== playerId);
      if (left.length) s.marks[idx] = left; else delete s.marks[idx];
    });
    return;
  }
  if (room.phase === 'lobby') return;

  switch (room.game) {
    case 'imposter':
      if (room.phase === 'voting' && voteClosed()) resolveImposterVote(room);
      if (room.phase === 'guess' && !here(s.guesserId)) finishImposter(room, 'caught', null);
      return;
    case 'chameleon':
      if (s.phase === 'voting' && voteClosed()) resolveChameleonVote(room);
      if (s.phase === 'guess' && !here(room._chamId)) finishChameleon(room, 'caught', null);
      return;
    case 'spyfall':
      if (s.phase === 'voting' && voteClosed()) resolveSpyfallVote(room);
      if (s.phase === 'guess' && !here(s.guesserId)) finishSpyfall(room, 'caught', null, s.guesserId);
      return;
    case 'justone':
      // Without the guesser there is no round: the word is shown, no point.
      if ((s.phase === 'writing' || s.phase === 'guessing') && !here(s.guesserId)) skipJustOneRound(room);
      else if (s.phase === 'writing' && justOneAllWritten(room)) revealJustOneClues(room);
      return;
    case 'whoami':
      if (room.phase === 'playing' && allIn(s.guessed)) revealWhoAmI(room);
      return;
    case 'wouldyou':
      voteClosed();
      return;
    case 'mostlikely':
      if (voteClosed()) scoreMostLikely(room);
      return;
    case 'fibbage':
      if (s.phase === 'writing' && allIn(s.submitted)) openFibbageVote(room);
      else if (s.phase === 'voting' && voteClosed()) scoreFibbage(room);
      return;
    case 'drawguess':
      if (room.phase === 'drawing' && !s.word && !here(s.drawerId)) revealDrawWord(room);
      return;
    case 'fakeartist':
      if (s.phase === 'drawing' && !here(s.currentDrawerId)) advanceFakeArtistTurn(room);
      else if (s.phase === 'voting' && voteClosed()) revealFakeArtist(room);
      if (s.phase === 'guessing' && !here(room._fakeId)) finishFakeArtist(room, 'artists');
      return;
    case 'trivia':
      if (s.phase === 'answering' && allIn(s.answered)) closeTriviaQuestion(room);
      return;
    case 'emoji':
    case 'proverbs':
      if (s.phase === 'answering' && activeRoster(room, s.roster).every(id => (room._answers || {})[id])) closeQuizCard(room);
      return;
    case 'buzzer':
      if (Array.isArray(s.buzzes)) s.buzzes = s.buzzes.filter(b => b.id !== playerId);
      return;
    case 'stop':
      if ((s.phase === 'writing' || s.phase === 'collecting') && allIn(s.submitted)) scoreStopRound(room);
      return;
    case 'bomb':
      if (s.phase !== 'ticking') return;
      if (s.fromId === playerId) s.fromId = null;
      if (!here(s.holderId)) {
        // The bomb goes on to the next in the seating order after whoever held it.
        const order = s.order || [];
        const at = order.indexOf(s.holderId);
        for (let k = 1; k <= order.length; k++) {
          const id = order[(at + k + order.length) % order.length];
          if (here(id)) { s.holderId = id; s.holderName = roomPlayerName(room, id); s.fromId = null; break; }
        }
      }
      return;
    case 'twotruths':
      if (s.phase === 'writing' && allIn(s.submitted)) {
        if (s.submitted.some(here)) { s.order = shuffled(s.submitted.filter(here)); nextTwoTruthsTurn(room); }
      } else if (s.phase === 'voting') {
        if (!here(s.subjectId)) nextTwoTruthsTurn(room);
        else if (voteClosed()) resolveTwoTruths(room);
      }
      return;
    case 'fiveseconds':
      if ((s.phase === 'ready' || s.phase === 'counting' || s.phase === 'judging') && !here(s.turnId)) advanceFive(room);
      return;
    case 'telephone':
      if ((s.phase === 'working' || s.phase === 'collecting') && allIn(s.submitted)) finishTelephoneStep(room);
      return;
    case 'monkey':
      monkeyPlayerLeft(room, playerId);
      return;
    case 'herd':
      if (s.sheepId === playerId) { s.sheepId = null; s.sheepName = ''; }
      if (s.phase === 'writing' && allIn(s.submitted)) revealHerd(room);
      else if (s.phase === 'reveal') s.groups = herdPresentGroups(room, s.groups);
      return;
    case 'mafia':
      mafiaPlayerLeft(room, playerId, name);
      return;
    case 'screw':
      screwPlayerLeft(room, playerId);
      return;
    default:
      // على نفس الموجة: the host's skip deals the next psychic.
      return;
  }
};

/** ربع قرد: out of the order, and the turn goes on from where they sat. */
const monkeyPlayerLeft = (room, playerId) => {
  const s = room.shared;
  if (s.phase !== 'play' || !Array.isArray(s.order)) return;
  const at = s.order.indexOf(playerId);
  if (at === -1) return;
  const wasUp = s.turnId === playerId;
  s.order = s.order.filter(id => id !== playerId);
  if (s.quarters) delete s.quarters[playerId];
  // A verdict about them can't move a quarter to, or from, someone who isn't here.
  if (s.verdict && (s.verdict.loserId === playerId || s.verdict.otherId === playerId)) s.verdict.canFlip = false;
  s.board = monkeyBoard(room);
  if (monkeyCheckEnd(room)) return;
  const n = s.order.length;
  const up = s.order.indexOf(s.turnId);
  if (wasUp || up === -1) advanceMonkey(room, ((wasUp ? at : 0) - 1 + n) % n);
  else s.turn = up;
};

/** مافيا: out of the game (shown as left), then the same checks as after a night or a vote. */
const mafiaPlayerLeft = (room, playerId, name) => {
  const s = room.shared;
  if (!room._mafia || !Array.isArray(s.alive) || s.phase === 'gameover') return;
  if (s.alive.indexOf(playerId) !== -1) {
    s.alive = s.alive.filter(x => x !== playerId);
    s.out = (s.out || []).concat([{ id: playerId, name: name || '', role: mafiaShownRole(room, playerId), night: s.phase === 'night', left: true }]);
  }
  if (mafiaCheckEnd(room)) return;
  if (s.phase === 'night' && mafiaAlive(room).every(id => (s.acted || []).indexOf(id) !== -1)) { mafiaEndNight(room); return; }
  if (s.phase === 'voting' && voteDropPlayer(room, playerId)) { mafiaResolveVote(room); return; }
  mafiaWriteSecrets(room);
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
  // A storyteller who has left is skipped: nobody could answer for them.
  while (s.turn < s.order.length && !room.players.some(p => p.id === s.order[s.turn])) s.turn++;
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
    // A drawing sent as its step ended, arriving after the next one began, would
    // be filed on someone else's chain as a blank. It belongs to no step now.
    if (staleTap(payload, 'step', s.step)) return;
    if (s.phase !== 'working' && s.phase !== 'collecting') throw new Error('انتهت هذه الخطوة');
    const task = (room.secrets[playerId] || {}).task;
    if (!task) throw new Error('لست ضمن هذه الجولة');
    if (s.submitted.indexOf(playerId) !== -1) return;
    // A phone too old to say its step still gives itself away: a drawing for a
    // step that asks for words, or words for one that asks for a drawing.
    const sent = payload || {};
    if (task.kind === 'draw' ? !Array.isArray(sent.strokes) : sent.text === undefined) return;
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

/* ==========================================================================
   ربع قرد — MONKEY (rooms)
   The classic letter game, the last-letter chain and the name-a-turn
   variant on separate phones, with the server as referee: it holds the
   dictionaries (MonkeyWords.js, plus the spy words for animals and food),
   settles كذاب, notices a closed name, and keeps the quarters. A monkey is
   skipped in the order and cannot act; the host swaps them back in.
   ========================================================================== */
const MONKEY_ROOM_MODES = ['letters', 'chain', 'names'];
const MONKEY_TIMERS = [0, 15, 30, 45, 60];
const MONKEY_GRACE_MS = 1500;

const monkeyRoomAction = (room, playerId, action, payload) => {
  if (action === 'start' || action === 'playAgain') {
    requireHost(room, playerId);
    if (room.players.length < 2) throw new Error('تحتاج لاعبين على الأقل');
    if (action === 'playAgain' && room.shared.phase !== 'gameover') return;
    const prev = (action === 'playAgain' && room.shared) || {};
    const lang = roomLangOf(room, payload);
    const mode = MONKEY_ROOM_MODES.indexOf(payload && payload.mode) !== -1 ? payload.mode : (prev.mode || 'letters');
    const category = MONKEY_CATEGORIES.some(c => c.id === (payload && payload.category)) ? payload.category : (prev.category || 'countries');
    const timer = MONKEY_TIMERS.indexOf(Number(payload && payload.timer)) !== -1 ? Number(payload.timer) : (typeof prev.timer === 'number' ? prev.timer : 30);
    const order = room.players.map(p => p.id);
    const winners = Math.max(1, Math.min(Number(payload && payload.winners) || prev.winners || 1, order.length - 1));
    const autoPenalty = payload && typeof payload.autoPenalty === 'boolean' ? payload.autoPenalty : (typeof prev.autoPenalty === 'boolean' ? prev.autoPenalty : true);
    const quarters = {};
    order.forEach(id => { quarters[id] = 0; });
    room.secrets = {};
    room.shared = {
      phase: 'play', mode: mode, category: category, lang: lang, timer: timer, winners: winners, autoPenalty: autoPenalty,
      order: order, roster: order.slice(), turn: 0, quarters: quarters,
      letters: [], required: '', used: [], history: [], verdict: null, endsAt: null, timedOut: false
    };
    setMonkeyTurn(room, 0);
    room.phase = 'play';
    return;
  }

  const s = room.shared;
  // The host's quarter or skip names the player it was for ({ target }): a
  // double tap would otherwise hand the next player a quarter too. Checked
  // before the end of the game, which the first tap may have brought about.
  if ((action === 'penalty' || action === 'skip') && staleTap(payload, 'target', s.phase === 'play' ? s.turnId : null)) return;
  if (s.phase !== 'play' && action !== 'setQuarters') throw new Error('اللعبة انتهت');
  const isTurn = playerId === s.turnId;
  const me = room.players.find(p => p.id === playerId);

  if (action === 'letter') {
    if (s.mode !== 'letters') throw new Error('ليست لعبة حروف');
    if (!isTurn) throw new Error('دور لاعب آخر');
    const ch = monkeyFold(String((payload && payload.ch) || '')).charAt(0);
    if (!ch) throw new Error('اكتب حرفاً');
    s.letters.push({ ch: ch, by: playerId, name: roomPlayerName(room, playerId) });
    s.verdict = null;
    const word = s.letters.map(l => l.ch).join('');
    const exact = monkeyExact(s.lang, s.category, word);
    if (exact) {
      monkeyQuarter(room, playerId);
      s.history.unshift({ kind: 'word', text: exact, by: roomPlayerName(room, playerId) });
      s.used.unshift(exact);
      s.verdict = { kind: 'closed', word: exact, loser: roomPlayerName(room, playerId), loserId: playerId };
      s.letters = [];
      if (monkeyCheckEnd(room)) return;
      advanceMonkey(room, s.turn);
      return;
    }
    advanceMonkey(room, s.turn);
    return;
  }

  if (action === 'liar') {
    if (s.mode !== 'letters') throw new Error('ليست لعبة حروف');
    if (!s.letters.length) throw new Error('مفيش حروف لسه');
    // Only someone playing this game: a latecomer watching has no quarters to lose.
    if (!me || s.order.indexOf(playerId) === -1) throw new Error('ستدخل من الجولة القادمة');
    if ((s.quarters[playerId] || 0) >= 4) throw new Error('القرد ما يتكلمش');
    const last = s.letters[s.letters.length - 1];
    if (last.by === playerId) throw new Error('ده حرفك انت');
    const word = s.letters.map(l => l.ch).join('');
    const matches = monkeyPrefixWords(s.lang, s.category, word);
    const loserId = matches.length ? playerId : last.by;
    const otherId = matches.length ? last.by : playerId;
    monkeyQuarter(room, loserId);
    s.verdict = {
      kind: matches.length ? 'liar-wrong' : 'liar-right',
      word: word, examples: matches.slice(0, 3),
      loser: roomPlayerName(room, loserId), loserId: loserId, otherId: otherId, canFlip: true
    };
    s.history.unshift({ kind: 'liar', text: word, by: roomPlayerName(room, loserId) });
    s.letters = [];
    if (monkeyCheckEnd(room)) return;
    // The new name starts with the player after the one who lost.
    advanceMonkey(room, Math.max(0, s.order.indexOf(loserId)));
    return;
  }

  if (action === 'flip') {
    // The table disagrees with the dictionary: the quarter moves to the other party.
    requireHost(room, playerId);
    const v = s.verdict;
    if (!v || !v.canFlip || v.flipped) return;
    if ((s.quarters[v.loserId] || 0) > 0) s.quarters[v.loserId]--;
    monkeyQuarter(room, v.otherId);
    v.flipped = true;
    const swap = v.loserId; v.loserId = v.otherId; v.otherId = swap;
    v.loser = roomPlayerName(room, v.loserId);
    v.kind = 'flipped';
    s.board = monkeyBoard(room);
    monkeyCheckEnd(room);
    return;
  }

  if (action === 'name') {
    if (s.mode === 'letters') throw new Error('ليست لعبة أسماء');
    if (!isTurn) throw new Error('دور لاعب آخر');
    const text = String((payload && payload.text) || '').trim().slice(0, 40);
    const f = monkeyFold(text);
    if (!f) throw new Error('اكتب اسماً');
    const hit = monkeyPool(s.lang, s.category).find(n => monkeyFold(n) === f);
    if (!hit) throw new Error('مش لاقيها في القايمة');
    if (s.used.some(n => monkeyFold(n) === f)) throw new Error('اتقالت قبل كده');
    if (s.mode === 'chain' && s.required && f.charAt(0) !== s.required) throw new Error('لازم تبدأ بحرف ' + s.required);
    s.used.unshift(hit);
    s.required = f.slice(-1);
    s.history.unshift({ kind: 'name', text: hit, by: roomPlayerName(room, playerId) });
    s.verdict = null;
    advanceMonkey(room, s.turn);
    return;
  }

  if (action === 'giveUp') {
    if (!isTurn) throw new Error('دور لاعب آخر');
    monkeyQuarter(room, playerId);
    s.verdict = { kind: 'giveup', loser: roomPlayerName(room, playerId), loserId: playerId };
    s.history.unshift({ kind: 'giveup', text: s.mode === 'letters' ? s.letters.map(l => l.ch).join('') : (s.required || ''), by: roomPlayerName(room, playerId) });
    if (s.mode === 'letters') s.letters = [];
    if (monkeyCheckEnd(room)) return;
    advanceMonkey(room, s.turn);
    return;
  }

  if (action === 'penalty') {
    // The host: a quarter to the player up (a timeout the table agreed on), and on.
    requireHost(room, playerId);
    monkeyQuarter(room, s.turnId);
    s.verdict = { kind: 'timeout', loser: s.turnName, loserId: s.turnId };
    if (s.mode === 'letters') s.letters = [];
    if (monkeyCheckEnd(room)) return;
    advanceMonkey(room, s.turn);
    return;
  }

  if (action === 'skip') {
    requireHost(room, playerId);
    advanceMonkey(room, s.turn);
    return;
  }

  if (action === 'undo') {
    requireHost(room, playerId);
    if (s.mode !== 'letters') return;
    const l = s.letters.pop();
    if (!l) return;
    s.verdict = null;
    const at = s.order.indexOf(l.by);
    setMonkeyTurn(room, at === -1 ? s.turn : at);
    return;
  }

  if (action === 'swap') {
    // The monkey talked someone into it: they swap places.
    requireHost(room, playerId);
    const monkeyId = String((payload && payload.monkeyId) || '');
    const targetId = String((payload && payload.targetId) || '');
    if (s.order.indexOf(monkeyId) === -1 || s.order.indexOf(targetId) === -1) throw new Error('تبديل غير صحيح');
    if ((s.quarters[monkeyId] || 0) < 4 || (s.quarters[targetId] || 0) >= 4) throw new Error('تبديل غير صحيح');
    const keep = s.quarters[targetId] || 0;
    s.quarters[targetId] = 4;
    s.quarters[monkeyId] = keep;
    s.verdict = { kind: 'swap', loser: roomPlayerName(room, targetId), loserId: targetId, other: roomPlayerName(room, monkeyId) };
    s.board = monkeyBoard(room);
    if (monkeyCheckEnd(room)) return;
    if (s.turnId === targetId) advanceMonkey(room, s.turn);
    return;
  }

  if (action === 'setQuarters') {
    requireHost(room, playerId);
    const id = String((payload && payload.playerId) || '');
    const n = Number(payload && payload.n);
    if (!(id in s.quarters) || !(n >= 0 && n <= 4)) throw new Error('قيمة غير صحيحة');
    s.quarters[id] = Math.floor(n);
    s.board = monkeyBoard(room);
    if (s.phase === 'play') {
      if (monkeyCheckEnd(room)) return;
      if (s.turnId === id && n >= 4) advanceMonkey(room, s.turn);
    }
    return;
  }

  throw new Error('إجراء غير معروف');
};

const monkeyQuarter = (room, id) => {
  const s = room.shared;
  if (!(id in s.quarters)) s.quarters[id] = 0;
  if (s.quarters[id] < 4) s.quarters[id]++;
  if (s.quarters[id] === 4) s.newMonkey = id;
  s.board = monkeyBoard(room);
};

/** Fewest quarters first, with the monkeys at the bottom. */
const monkeyBoard = (room) => {
  const s = room.shared;
  return room.players
    .filter(p => s.order.indexOf(p.id) !== -1)
    .map(p => ({ id: p.id, name: p.name, quarters: s.quarters[p.id] || 0, monkey: (s.quarters[p.id] || 0) >= 4 }))
    .sort((a, b) => a.quarters - b.quarters);
};

const setMonkeyTurn = (room, at) => {
  const s = room.shared;
  s.turn = at;
  s.turnId = s.order[at];
  s.turnName = roomPlayerName(room, s.turnId);
  s.endsAt = s.timer ? Date.now() + s.timer * 1000 : null;
  s.timedOut = false;
  s.board = monkeyBoard(room);
};

/** The next player after `from` who is not a monkey (and still in the room). */
const advanceMonkey = (room, from) => {
  const s = room.shared;
  const n = s.order.length;
  const present = room.players.map(p => p.id);
  for (let step = 1; step <= n; step++) {
    const at = (from + step) % n;
    const id = s.order[at];
    if ((s.quarters[id] || 0) < 4 && present.indexOf(id) !== -1) { setMonkeyTurn(room, at); return; }
  }
  setMonkeyTurn(room, (from + 1) % n);
};

/**
 * Safe players down to the winners' count: the game is over. Only those still
 * in the room count - someone who left is neither safe nor a monkey - and the
 * winners' count shrinks with the table, or two left of three with two winners
 * would play on forever.
 */
const monkeyCheckEnd = (room) => {
  const s = room.shared;
  const present = s.order.filter(id => room.players.some(p => p.id === id));
  const safe = present.filter(id => (s.quarters[id] || 0) < 4);
  const winners = Math.max(1, Math.min(s.winners, present.length - 1));
  if (present.length >= 2 && safe.length > winners) return false;
  s.phase = 'gameover';
  s.endsAt = null;
  s.turnId = null;
  s.turnName = '';
  s.winnerNames = safe.map(id => roomPlayerName(room, id));
  s.board = monkeyBoard(room);
  room.phase = 'gameover';
  return true;
};

/* ==========================================================================
   زي الكل — HERD MENTALITY
   Everyone answers the same question on their own phone ("one thing from:
   car brands") trying to write what most of the table will write. Answers
   wait in room._herd.answers until everyone has sent (or the host moves on),
   then they are grouped through normaliseClue, so مرسيدس and مرسيدس ‌ are one
   answer; the host can merge two groups that mean the same thing. The single
   biggest group of two or more scores a point each; a tie for biggest scores
   nobody. If exactly one player wrote something nobody else did, they take
   the sheep 🐑, and hold it until someone else is the odd one out: whoever
   holds the sheep can't win. First to the target without the sheep wins.

   The questions are the categories the app already has: the Chameleon
   categories and the bomb's (minus the ones that describe a property).
   ========================================================================== */
const HERD_TARGETS = [5, 8, 10];
const HERD_MAX_LEN = 40;
const HERD_MAX_ROUNDS = 40;

const herdPrompts = (lang) => {
  const cham = (CHAMELEON_DB[lang] || CHAMELEON_DB.ar).map(c => String(c.category).replace(/\p{Extended_Pictographic}[️‍\p{Extended_Pictographic}]*/gu, '').trim());
  const bomb = (BOMB_PROMPTS[lang] || BOMB_PROMPTS.ar).filter(x => !/^حاجات /.test(x) && !/(^Things |things$)/i.test(x));
  const seen = {};
  return cham.concat(bomb).filter(x => {
    const k = normaliseClue(x);
    if (!k || seen[k]) return false;
    seen[k] = true;
    return true;
  });
};

const herdAction = (room, playerId, action, payload) => {
  if (action === 'start' || action === 'playAgain') {
    requireHost(room, playerId);
    if (room.players.length < 3) throw new Error('تحتاج 3 لاعبين على الأقل');
    const prev = room.shared || {};
    if (action === 'playAgain' && prev.phase !== 'gameover') return;
    const target = HERD_TARGETS.indexOf(Number(payload && payload.target)) !== -1 ? Number(payload.target) : (prev.target || 8);
    room.shared = {
      lang: roomLangOf(room, payload),
      target: target,
      round: 0,
      scores: {},
      sheepId: null,
      roster: room.players.map(p => p.id),
      phase: 'writing'
    };
    dealHerdRound(room);
    return;
  }

  const s = room.shared;
  if (!s || !s.phase) throw new Error('اللعبة لم تبدأ بعد');

  if (action === 'nextRound') {
    requireHost(room, playerId);
    if (s.phase !== 'result') return;
    dealHerdRound(room);
    return;
  }

  if (action === 'submit') {
    // An answer to last round's question, arriving after the next was dealt.
    if (staleTap(payload, 'round', s.round)) return;
    if (s.phase !== 'writing') throw new Error('انتهى وقت الكتابة');
    if (s.roster.indexOf(playerId) === -1) throw new Error('ستدخل من الجولة القادمة');
    const text = String((payload && payload.text) || '').replace(/\s+/g, ' ').trim().slice(0, HERD_MAX_LEN);
    if (!text || !normaliseClue(text)) throw new Error('اكتب إجابة');
    room._herd.answers[playerId] = text;
    if (s.submitted.indexOf(playerId) === -1) s.submitted.push(playerId);
    if (activeRoster(room, s.roster).every(id => s.submitted.indexOf(id) !== -1)) revealHerd(room);
    return;
  }

  if (action === 'closeWriting') {
    requireHost(room, playerId);
    if (s.phase !== 'writing') return;
    if (s.submitted.length < 2) throw new Error('لسه محدش كتب كفاية');
    revealHerd(room);
    return;
  }

  if (action === 'merge') {
    // Two answers that mean the same thing ("عربية" and "سيارة"): the host joins them.
    requireHost(room, playerId);
    if (s.phase !== 'reveal') return;
    const from = s.groups.findIndex(g => g.key === String(payload && payload.from));
    const into = s.groups.findIndex(g => g.key === String(payload && payload.into));
    if (from === -1 || into === -1 || from === into) throw new Error('اختيار غير صحيح');
    const a = s.groups[into], b = s.groups[from];
    a.ids = a.ids.concat(b.ids);
    a.names = a.names.concat(b.names);
    a.texts = a.texts.concat(b.texts);
    a.parts = (a.parts || [a.key]).concat(b.parts || [b.key]);
    s.groups.splice(from, 1);
    s.groups.sort((x, y) => y.ids.length - x.ids.length);
    return;
  }

  if (action === 'unmerge') {
    requireHost(room, playerId);
    if (s.phase !== 'reveal') return;
    s.groups = herdGroups(room);
    return;
  }

  if (action === 'score') {
    requireHost(room, playerId);
    if (s.phase !== 'reveal') return;
    scoreHerd(room);
    return;
  }

  throw new Error('إجراء غير معروف');
};

const dealHerdRound = (room) => {
  const s = room.shared;
  s.round = (s.round || 0) + 1;
  s.prompt = nextPrompt(room, herdPrompts(s.lang), 'herd_' + s.lang);
  s.submitted = [];
  s.groups = null;
  s.majorityKey = null;
  s.gained = null;
  s.sheepFrom = null;
  s.winners = null;
  s.roster = room.players.map(p => p.id);
  s.phase = 'writing';
  room._herd = { answers: {} };
  s.board = scoreboardOf(room);
  room.phase = 'writing';
};

/** The answers of everyone still here, grouped: the same word through normaliseClue is one group. */
const herdGroups = (room) => {
  const answers = (room._herd && room._herd.answers) || {};
  const byKey = {};
  Object.keys(answers).filter(pid => room.players.some(p => p.id === pid)).forEach(pid => {
    const key = normaliseClue(answers[pid]);
    if (!byKey[key]) byKey[key] = { key: key, ids: [], names: [], texts: [] };
    byKey[key].ids.push(pid);
    byKey[key].names.push(roomPlayerName(room, pid));
    byKey[key].texts.push(answers[pid]);
  });
  return Object.values(byKey).map(g => Object.assign(g, { label: g.texts[0] })).sort((a, b) => b.ids.length - a.ids.length);
};

const revealHerd = (room) => {
  const s = room.shared;
  s.groups = herdGroups(room);
  s.phase = 'reveal';
  room.phase = 'reveal';
};

/**
 * The groups less anyone who has left since they were drawn (the host's merges
 * kept): an answer from someone gone can't make the herd, or take the sheep.
 */
const herdPresentGroups = (room, groups) => (groups || [])
  .map(g => {
    const keep = g.ids.map((id, i) => i).filter(i => room.players.some(p => p.id === g.ids[i]));
    return Object.assign({}, g, { ids: keep.map(i => g.ids[i]), names: keep.map(i => g.names[i]), texts: keep.map(i => g.texts[i]) });
  })
  .filter(g => g.ids.length)
  .sort((a, b) => b.ids.length - a.ids.length);

const scoreHerd = (room) => {
  const s = room.shared;
  s.groups = herdPresentGroups(room, s.groups);
  const groups = s.groups;
  const top = groups.reduce((m, g) => Math.max(m, g.ids.length), 0);
  const leaders = groups.filter(g => g.ids.length === top);
  const majority = top >= 2 && leaders.length === 1 ? leaders[0] : null;
  s.majorityKey = majority ? majority.key : null;
  s.gained = majority ? majority.ids.slice() : [];
  s.gained.forEach(id => addScore(room, id, 1));
  // Exactly one player on their own takes the sheep from whoever had it.
  const alone = groups.filter(g => g.ids.length === 1);
  s.sheepFrom = null;
  if (alone.length === 1 && alone[0].ids[0] !== s.sheepId) {
    s.sheepFrom = s.sheepId;
    s.sheepId = alone[0].ids[0];
  }
  s.sheepName = s.sheepId ? roomPlayerName(room, s.sheepId) : '';
  s.board = scoreboardOf(room);
  const winners = s.board.filter(p => p.score >= s.target && p.id !== s.sheepId && s.roster.indexOf(p.id) !== -1);
  if (winners.length || s.round >= HERD_MAX_ROUNDS) {
    const best = winners.length ? winners[0].score : 0;
    s.winners = (winners.length ? winners.filter(p => p.score === best) : s.board.filter(p => p.id !== s.sheepId).slice(0, 1)).map(p => p.name);
    s.phase = 'gameover';
    room.phase = 'gameover';
    return;
  }
  s.phase = 'result';
  room.phase = 'result';
};

/* ==========================================================================
   مافيا — MAFIA
   The app is the narrator. Each phone gets a role in its own secret slice:
   Mafia (who also see each other), Citizen, and in the Roles mode the
   Doctor, the Detective and the Lawyer. The Lawyer knows who the Mafia are
   and argues for them as if a citizen; the Mafia don't know the Lawyer; the
   Detective's check says "not Mafia" about the Lawyer; the Lawyer wins with
   the Mafia but counts with the town when the sides are counted.

   How many Mafia is the app's choice, from the number of players (MAFIA_COUNT).
   A night: every living phone taps a name - the Mafia their target (their
   picks are shown to each other; the most picked is it, a tie is decided at
   random), the Doctor someone to protect (not the same person two nights
   running), the Detective someone to check (answered at once, privately),
   and everyone else a suspect nobody sees, so nobody can tell who acted by
   who is busy with their phone. The night ends when everyone has tapped or
   its clock runs out. The morning says who left the game - as a Citizen,
   unless they were Mafia, or the host turned on showing real roles - then a
   discussion clock (the host can open the vote early or add a minute), then
   a vote with "nobody" among the options; a tie sends nobody out. The Mafia
   win when they are as many as everyone else; the town when none are left.
   The words are for a family: "خرج من اللعبة", never killing.
   ========================================================================== */
const MAFIA_MIN_PLAYERS = 5;
const MAFIA_DISCUSS_MINUTES = [2, 3, 5];
const MAFIA_NIGHT_SECONDS = [30, 45, 60];
const MAFIA_GRACE_MS = 1500;
const MAFIA_SKIP = 'nobody';

/** The Mafia for a table of n: one to six players, two to nine, three beyond. */
const mafiaCount = (n) => (n <= 6 ? 1 : n <= 9 ? 2 : 3);

/** The roles for a table of n, in the mode chosen. */
const mafiaRoles = (n, mode) => {
  const roles = [];
  for (let i = 0; i < mafiaCount(n); i++) roles.push('mafia');
  if (mode === 'roles') {
    roles.push('doctor', 'detective');
    if (n >= 6) roles.push('lawyer');
  }
  while (roles.length < n) roles.push('citizen');
  return roles;
};

const mafiaAlive = (room) => room.shared.alive.filter(id => room.players.some(p => p.id === id));

/** What a player who leaves is shown as. */
const mafiaShownRole = (room, id) => {
  const role = room._mafia.roles[id];
  if (role === 'mafia') return 'mafia';
  return room.shared.revealRoles ? role : 'citizen';
};

const mafiaAction = (room, playerId, action, payload) => {
  if (action === 'start' || action === 'playAgain') {
    requireHost(room, playerId);
    const prev = room.shared || {};
    if (action === 'playAgain' && prev.phase !== 'gameover') return;
    const n = room.players.length;
    if (n < MAFIA_MIN_PLAYERS) throw new Error('المافيا محتاجة 5 لاعبين على الأقل');
    const opts = payload || {};
    const mode = opts.mode === 'roles' ? 'roles' : (opts.mode === 'classic' ? 'classic' : (prev.mode || 'classic'));
    const discuss = MAFIA_DISCUSS_MINUTES.indexOf(Number(opts.discuss)) !== -1 ? Number(opts.discuss) : (prev.discuss || 3);
    const night = MAFIA_NIGHT_SECONDS.indexOf(Number(opts.night)) !== -1 ? Number(opts.night) : (prev.nightSeconds || 45);
    const revealRoles = opts.revealRoles === undefined ? !!prev.revealRoles : !!opts.revealRoles;
    const roster = room.players.map(p => p.id);
    const roles = shuffled(mafiaRoles(n, mode));
    room._mafia = { roles: {}, lastSave: null, night: null };
    roster.forEach((id, i) => { room._mafia.roles[id] = roles[i]; });
    room.shared = {
      mode: mode,
      discuss: discuss,
      nightSeconds: night,
      revealRoles: revealRoles,
      mafiaCount: mafiaCount(n),
      roleList: mafiaRoles(n, mode).filter((r, i, a) => a.indexOf(r) === i),
      roster: roster,
      alive: roster.slice(),
      out: [],
      night: 0,
      day: 0,
      news: null,
      scores: action === 'playAgain' ? (prev.scores || {}) : (prev.scores || {}),
      phase: 'roles'
    };
    room.shared.board = scoreboardOf(room);
    mafiaWriteSecrets(room);
    room.phase = 'roles';
    return;
  }

  const s = room.shared;
  if (!s || !s.phase || !room._mafia) throw new Error('اللعبة لم تبدأ بعد');
  const alive = s.alive.indexOf(playerId) !== -1;

  if (action === 'startNight') {
    requireHost(room, playerId);
    if (s.phase !== 'roles' && s.phase !== 'dayResult') return;
    mafiaStartNight(room);
    return;
  }

  if (action === 'nightPick') {
    if (s.phase !== 'night') throw new Error('مش وقت الليل');
    if (!alive) throw new Error('خرجت من اللعبة');
    const target = String((payload && payload.target) || '');
    if (mafiaAlive(room).indexOf(target) === -1) throw new Error('اختيار غير صحيح');
    const role = room._mafia.roles[playerId];
    const night = room._mafia.night;
    if (role === 'mafia') {
      if (room._mafia.roles[target] === 'mafia') throw new Error('ده من المافيا');
      night.kills[playerId] = target;
    } else if (role === 'doctor') {
      if (target === room._mafia.lastSave) throw new Error('مينفعش تحمي نفس الشخص ليلتين ورا بعض');
      night.save = target;
    } else if (role === 'detective') {
      if (target === playerId) throw new Error('اختار حد غيرك');
      if (night.checked) throw new Error('كشفت خلاص الليلة دي');
      night.checked = target;
      const mafia = room._mafia.roles[target] === 'mafia';
      night.checks = night.checks || [];
      room._mafia.checks = (room._mafia.checks || []).concat([{ id: target, name: roomPlayerName(room, target), mafia: mafia, night: s.night }]);
    } else {
      night.suspects[playerId] = target;
    }
    if (s.acted.indexOf(playerId) === -1) s.acted.push(playerId);
    mafiaWriteSecrets(room);
    if (mafiaAlive(room).every(id => s.acted.indexOf(id) !== -1)) mafiaEndNight(room);
    return;
  }

  if (action === 'endNight') {
    requireHost(room, playerId);
    if (s.phase !== 'night') return;
    mafiaEndNight(room);
    return;
  }

  if (action === 'moreTime') {
    requireHost(room, playerId);
    if (s.phase !== 'day' || !s.endsAt) return;
    s.endsAt += 60000;
    return;
  }

  if (action === 'startVote') {
    requireHost(room, playerId);
    if (s.phase !== 'day') return;
    mafiaOpenVote(room);
    return;
  }

  if (action === 'vote') {
    if (s.phase !== 'voting') throw new Error('لا يوجد تصويت الآن');
    if (castVote(room, playerId, String((payload && payload.option) || ''))) mafiaResolveVote(room);
    return;
  }

  if (action === 'closeVote') {
    requireHost(room, playerId);
    if (s.phase !== 'voting') return;
    if (closeVote(room)) mafiaResolveVote(room);
    return;
  }

  throw new Error('إجراء غير معروف');
};

/** Every phone's slice: its role, and what that role knows. */
const mafiaWriteSecrets = (room) => {
  const s = room.shared;
  const m = room._mafia;
  const mafiaIds = Object.keys(m.roles).filter(id => m.roles[id] === 'mafia');
  const night = m.night;
  room.secrets = {};
  s.roster.filter(id => room.players.some(p => p.id === id)).forEach(id => {
    const role = m.roles[id];
    const slice = { role: role };
    if (role === 'mafia' || role === 'lawyer') slice.mafia = mafiaIds.map(x => ({ id: x, name: roomPlayerName(room, x) }));
    if (role === 'mafia' && night) slice.picks = Object.keys(night.kills).map(x => ({ by: roomPlayerName(room, x), byId: x, target: night.kills[x], name: roomPlayerName(room, night.kills[x]) }));
    if (role === 'doctor') { slice.lastSave = m.lastSave; if (night && night.save) slice.pick = night.save; }
    if (role === 'detective') { slice.checks = m.checks || []; if (night && night.checked) slice.pick = night.checked; }
    if ((role === 'citizen' || role === 'lawyer') && night && night.suspects[id]) slice.pick = night.suspects[id];
    if (role === 'mafia' && night && night.kills[id]) slice.pick = night.kills[id];
    room.secrets[id] = slice;
  });
};

const mafiaStartNight = (room) => {
  const s = room.shared;
  s.night = (s.night || 0) + 1;
  s.acted = [];
  s.news = null;
  s.vote = null;
  s.endsAt = Date.now() + s.nightSeconds * 1000;
  s.phase = 'night';
  room._mafia.night = { kills: {}, save: null, checked: null, suspects: {} };
  room.phase = 'night';
  mafiaWriteSecrets(room);
};

const mafiaEndNight = (room) => {
  const s = room.shared;
  const m = room._mafia;
  const night = m.night || { kills: {}, suspects: {} };
  // The Mafia's target: the most picked; a tie is settled at random. Only
  // picks by, and of, someone still in the game.
  const living = mafiaAlive(room);
  const tally = {};
  Object.keys(night.kills).forEach(by => {
    if (living.indexOf(by) === -1) return;
    const t = night.kills[by];
    if (living.indexOf(t) === -1) return;
    tally[t] = (tally[t] || 0) + 1;
  });
  const top = Object.keys(tally).reduce((mx, id) => Math.max(mx, tally[id]), 0);
  const leaders = Object.keys(tally).filter(id => tally[id] === top && top > 0);
  const target = leaders.length ? leaders[Math.floor(Math.random() * leaders.length)] : null;
  m.lastSave = night.save || null;
  if (target && night.save === target) {
    s.news = { kind: 'saved' };
  } else if (target && s.alive.indexOf(target) !== -1) {
    mafiaRemove(room, target);
    s.news = { kind: 'out', id: target, name: roomPlayerName(room, target), role: mafiaShownRole(room, target) };
  } else {
    s.news = { kind: 'quiet' };
  }
  m.night = null;
  s.acted = [];
  if (mafiaCheckEnd(room)) return;
  s.day = (s.day || 0) + 1;
  s.endsAt = Date.now() + s.discuss * 60000;
  s.phase = 'day';
  room.phase = 'day';
  mafiaWriteSecrets(room);
};

const mafiaRemove = (room, id) => {
  const s = room.shared;
  s.alive = s.alive.filter(x => x !== id);
  s.out = s.out.concat([{ id: id, name: roomPlayerName(room, id), role: mafiaShownRole(room, id), night: s.phase === 'night' }]);
};

const mafiaOpenVote = (room) => {
  const s = room.shared;
  const alive = mafiaAlive(room);
  const options = room.players.filter(p => alive.indexOf(p.id) !== -1).map(p => ({ id: p.id, label: p.name, ownerId: p.id }));
  options.push({ id: MAFIA_SKIP, label: '🤷' });
  openVote(room, options, alive);
  s.endsAt = null;
  s.phase = 'voting';
  room.phase = 'voting';
};

/** Most votes leaves the game; a tie, or "nobody" on top, sends nobody out. */
const mafiaResolveVote = (room) => {
  const s = room.shared;
  const results = (s.vote && s.vote.results) || [];
  const top = results.reduce((mx, r) => Math.max(mx, r.count), 0);
  const leaders = results.filter(r => top > 0 && r.count === top);
  const chosen = leaders.length === 1 && leaders[0].id !== MAFIA_SKIP ? leaders[0].id : null;
  if (chosen && s.alive.indexOf(chosen) !== -1) {
    mafiaRemove(room, chosen);
    s.news = { kind: 'voted', id: chosen, name: roomPlayerName(room, chosen), role: mafiaShownRole(room, chosen) };
  } else {
    s.news = { kind: leaders.length > 1 ? 'tie' : 'nobody' };
  }
  if (mafiaCheckEnd(room)) return;
  s.phase = 'dayResult';
  room.phase = 'dayResult';
  mafiaWriteSecrets(room);
};

/**
 * The Mafia as many as everyone else, or no Mafia left: the game is over.
 * Counted among those still in the room, like the night and the vote: a game
 * that counted a player who had left kept going round with nobody able to win.
 */
const mafiaCheckEnd = (room) => {
  const s = room.shared;
  const m = room._mafia;
  const alive = mafiaAlive(room);
  const mafia = alive.filter(id => m.roles[id] === 'mafia').length;
  const others = alive.length - mafia;
  const winner = mafia === 0 ? 'town' : (mafia >= others ? 'mafia' : null);
  if (!winner) return false;
  s.winner = winner;
  s.endsAt = null;
  // Someone who left is no longer in the room; their name is kept on the list of those out.
  const nameOf = (id) => roomPlayerName(room, id) || ((s.out || []).find(o => o.id === id) || {}).name || '';
  s.roles = s.roster.map(id => ({ id: id, name: nameOf(id), role: m.roles[id], alive: alive.indexOf(id) !== -1 }));
  s.roster.forEach(id => {
    const role = m.roles[id];
    const onMafiaSide = role === 'mafia' || role === 'lawyer';
    if (room.players.some(p => p.id === id) && (winner === 'mafia') === onMafiaSide) addScore(room, id, 1);
  });
  s.board = scoreboardOf(room);
  s.phase = 'gameover';
  room.phase = 'gameover';
  mafiaWriteSecrets(room);
  return true;
};

/* ==========================================================================
   سكرو — SKREW (rooms)
   Every hand lies face down in fixed slots on every phone, and every move
   between slots is public: who swapped which of their cards with which of
   yours, who peeked where, who gave what to whom. Values are not. The cards
   themselves are SkrewCards.js (bundled before this file): the deck, the
   versions, the values and what may be thrown on what.

   Where the cards are:
     room._screw          the deck, the pile, every hand ({ id, card, shown }),
                          the card in the turn player's hand, the khoshaf four,
                          what each player last looked at. Never projected.
     room.secrets[pid]    that phone's slice: the two cards it memorizes at the
                          deal, the card it drew, the khoshaf four, and the last
                          card(s) it looked at, until its next move.
     room.shared.hands    slot ids in order, and `up` only for a card the whole
                          table may see: an exposed hand (the cannon) and
                          everything at the reveal. And `h`, how the card got
                          into that slot - only what the whole table watched
                          (see screwArrived), with `known` for a card the table
                          saw face up and that went back face down (taken from
                          the pile, a wrong throw, a refused بصرة).
   A card of an exposed hand stays face up wherever a public move takes it
   (`shown` travels with the card), and `h.known` travels the same way.

   A round: the deal and the memorize (slots 3 and 4, once), then turns in seat
   order. The first seat moves on one every round; a lap is counted each time
   the turn walks past it, and سكرو can be called from lap `screwFromLap`. The
   call gives everyone else one more turn and protects the caller's hand (in
   teams, their whole side's). A
   round also ends at once when a hand runs out of cards (`finisher`), and -
   with موت مفاجئ on - once everyone has had a last turn after the deck ran
   out (`lastLap`). Then the table's vote on who holds الحرامي (when the thief
   is in the deck), the reveal, and the score - lowest wins. Every game action
   carries `seq` (shared.turnSeq), which moves whenever the phase, the turn or
   its stage does, so the second of a double tap is dropped quietly.
   ========================================================================== */
const SKREW_ROUNDS = [3, 5, 7];
const SKREW_LAPS = [1, 2, 3];
const SKREW_CLOCKS = [0, 30, 60];
const SKREW_MEMORIZE_SECS = [0, 5, 10];  // 0: everyone taps "memorized" (or the host starts)
const SKREW_HAND = 4;                  // cards dealt to each player
const SKREW_MEMORIZE = [2, 3];         // the slots each player looks at once: 3 and 4
const SKREW_PILE_SHOWN = 6;            // the top of the pile phones get
const SKREW_EVENTS = 40;
const SKREW_GRACE_MS = 1500;
const SKREW_THIEF_POINTS = 25;
const SKREW_TEAM_SIZES = [4, 6, 8];
const SKREW_TEAM_KEYS = ['A', 'B'];    // shared.teams[0] and [1]

const screwAction = (room, playerId, action, payload) => {
  const p = payload || {};
  if (action === 'start' || action === 'playAgain') {
    screwNewGame(room, playerId, action, p);
    return;
  }
  const s = room.shared;
  if (!s || !s.phase || !room._screw) throw new Error('اللعبة لم تبدأ بعد');
  // A tap aimed at a turn that has since moved on: dropped without a word.
  if (staleTap(p, 'seq', s.turnSeq)) return;
  screwApply(room, () => screwMove(room, playerId, action, p));
};

/**
 * Runs a change to a round, then moves turnSeq on if the turn or its stage
 * changed, and writes what every phone may see. The action, the clock and a
 * leave all go through here.
 */
const screwApply = (room, change) => {
  const s = room.shared;
  const before = screwTurnSig(room);
  const out = change();
  if (screwTurnSig(room) !== before) s.turnSeq = (s.turnSeq || 0) + 1;
  screwSync(room);
  return out;
};

const screwTurnSig = (room) => {
  const s = room.shared || {};
  const t = s.turn || {};
  return [s.phase, s.round, t.pid, t.stage, t.power, !!t.pongOpen, (room._screw || {}).turns].join('|');
};

const screwMove = (room, me, action, p) => {
  const s = room.shared;
  const g = room._screw;
  switch (action) {
    case 'ready': {
      if (s.phase !== 'memorize') return;
      if (s.order.indexOf(me) === -1) throw new Error('ستدخل من الجولة القادمة');
      if (s.ready.indexOf(me) === -1) {
        s.ready.push(me);
        delete g.memorize[me];            // looked at once
        screwEvent(room, 'ready', { pid: me });
      }
      if (screwSeated(room).every(id => s.ready.indexOf(id) !== -1)) screwBeginPlay(room);
      return;
    }
    case 'beginRound':
      requireHost(room, me);
      if (s.phase !== 'memorize') return;
      screwBeginPlay(room);
      return;
    case 'draw': {
      screwTurnCheck(room, me, ['choose']);
      screwForget(room, me);
      const card = screwFromDeck(room);
      if (!card) throw new Error('مفيش كروت في الكومة');
      delete s.turn.pongOpen;
      screwEvent(room, 'draw', { pid: me });
      screwLastLapCheck(room, me);
      screwReceive(room, me, card, 'deck');
      return;
    }
    case 'keep': {
      screwTurnCheck(room, me, ['drawn']);
      screwForget(room, me);
      if (SKREW_CARDS[g.drawn].drawn === 'discard') throw new Error('الكارت ده لازم يترمي');
      const how = g.drawnFrom === 'khoshaf' ? 'khoshaf' : 'deck';
      if (!(g.hands[me] || []).length) {
        // An empty hand: the card takes a new slot, with nothing to put on the pile. (An empty
        // hand ends the round now, so this is only for a room saved before that rule.)
        const slot = screwNewSlot(g, g.drawn);
        g.hands[me] = [slot];
        g.drawn = null;
        g.drawnFrom = null;
        screwEvent(room, 'keep', { pid: me, slot: slot.id, card: null });
        screwArrived(room, slot, how, me, null, { known: null, looks: [me] });
        screwTurnDone(room);
        return;
      }
      const e = screwSlot(room, me, p.slot);
      const old = e.card;
      e.card = g.drawn;
      e.shown = false;
      g.pile.push(old);
      g.drawn = null;
      g.drawnFrom = null;
      screwEvent(room, 'keep', { pid: me, slot: e.id, card: old });
      // The drawer saw what they kept; nobody else did.
      screwArrived(room, e, how, me, null, { known: null, looks: [me] });
      screwTurnDone(room);
      return;
    }
    case 'discard': {
      screwTurnCheck(room, me, ['drawn']);
      screwForget(room, me);
      const card = g.drawn;
      const info = SKREW_CARDS[card];
      if (info.drawn === 'keep') throw new Error('الكارت ده لازم تحتفظ بيه');
      // A الخشاف pick counts as drawn from the deck.
      const fromDeck = g.drawnFrom === 'deck' || g.drawnFrom === 'khoshaf';
      g.pile.push(card);
      g.drawn = null;
      g.drawnFrom = null;
      screwEvent(room, 'discard', { pid: me, card: card });
      // Straight from the deck (or الخشاف), a command card's power may be used (or skipped).
      if (fromDeck && info.power && !info.drawn) {
        s.turn.stage = 'power';
        s.turn.power = info.power;
        return;
      }
      screwTurnDone(room);
      return;
    }
    case 'takePile': {
      screwTurnCheck(room, me, ['choose']);
      if (g.thiefSpent && g.pile[g.pile.length - 1] === 'thief') throw new Error('الحرامي خرج من الجولة');
      screwForget(room, me);
      if (!g.pile.length) throw new Error('مفيش كروت مكشوفة');
      const e = screwSlot(room, me, p.slot);
      const taken = g.pile.pop();
      g.pile.push(e.card);
      e.card = taken;
      e.shown = false;
      delete s.turn.pongOpen;
      screwEvent(room, 'takePile', { pid: me, slot: e.id, card: taken });
      // It lay face up: the whole table knows this card, wherever it goes next.
      screwArrived(room, e, 'pile', me, null, { known: taken, looks: [] });
      screwTurnDone(room);
      return;
    }
    case 'match': {
      // On your own turn only; right or wrong, the card is shown and the turn ends.
      screwTurnCheck(room, me, ['choose']);
      const owner = p.owner === undefined || p.owner === null || p.owner === '' ? me : String(p.owner);
      // بصرة الفريق: a partner's card, when the house rule is on and their side isn't protected; otherwise nothing.
      if (owner !== me && !screwTeamThrowOk(room, me, owner)) return;
      screwForget(room, me);
      const top = g.pile[g.pile.length - 1];
      if (!top) throw new Error('مفيش كروت مكشوفة');
      const e = screwSlot(room, owner, p.slot);
      delete s.turn.pongOpen;
      screwThrow(room, me, e, skrewMatches(top, e.card), 'match', owner);
      if (screwFinished(room, owner)) return;
      screwTurnDone(room);
      return;
    }
    case 'thiefSteal': {
      // سرقة الحرامي: the thief just drawn (or picked with الخشاف), or on top of the pile as the turn
      // starts, played as a steal: look at one card of another player, then swap it for one of yours.
      if (!s.settings.thiefSteal) throw new Error('سرقة الحرامي مش مفعّلة');
      screwTurnCheck(room, me, ['drawn', 'choose']);
      const fromHand = s.turn.stage === 'drawn';
      if (fromHand ? g.drawn !== 'thief' : (g.thiefSpent || g.pile[g.pile.length - 1] !== 'thief')) throw new Error('مفيش حرامي');
      const target = screwTarget(room, me, p.target, true);
      const e = screwSlot(room, target, p.slot);
      screwForget(room, me);
      if (fromHand) {
        g.pile.push(g.drawn);
        g.drawn = null;
        g.drawnFrom = null;
      }
      g.thiefSpent = true;                    // face up on the pile, out for the round
      delete s.turn.pongOpen;
      g.seen[me] = [{ pid: target, slot: e.id, card: e.card }];
      screwLooked(e, me);
      g.look = { target: target, slot: e.id };
      s.turn.stage = 'steal';
      s.turn.look = { target: target, slot: e.id };
      screwEvent(room, 'thiefSteal', { pid: me, target: target, slot: e.id });
      return;
    }
    case 'stealSwap': {
      // The steal's swap is forced: one of your own cards for the one you looked at.
      screwTurnCheck(room, me, ['steal']);
      if (p.slot === undefined || p.slot === null || p.slot === '') throw new Error('اختار كارت من عندك');
      screwSteal(room, screwSlot(room, me, p.slot));
      return;
    }
    case 'screw': {
      screwTurnCheck(room, me, ['choose']);
      if (s.caller) throw new Error('فيه حد قال سكرو خلاص');
      if (s.lastLap) throw new Error('الورق خلص: دي آخر لفة');
      if (s.lap < s.settings.screwFromLap) throw new Error('لسه بدري على سكرو');
      screwForget(room, me);
      delete s.turn.pongOpen;
      const at = s.order.indexOf(me);
      s.caller = me;
      s.finalLeft = s.order.slice(at + 1).concat(s.order.slice(0, at)).filter(id => screwHere(room, id));
      screwEvent(room, 'screw', { pid: me });
      screwTurnDone(room);
      return;
    }
    case 'pong': {
      // Straight after a ping, before the turn is played: a free throw of بونج.
      screwTurnCheck(room, me, ['choose']);
      if (!s.turn.pongOpen) throw new Error('مفيش بينج');
      screwForget(room, me);
      const e = screwSlot(room, me, p.slot);
      delete s.turn.pongOpen;
      screwThrow(room, me, e, e.card === 'pong', 'pong');
      screwFinished(room, me);
      return;
    }
    case 'pass': {
      // Nothing to draw, and no pile to make a new deck of (موت مفاجئ, or a last turn with nothing left).
      screwTurnCheck(room, me, ['choose']);
      if (!screwCantDraw(room)) throw new Error('اسحب كارت');
      screwForget(room, me);
      delete s.turn.pongOpen;
      screwEvent(room, 'pass', { pid: me });
      screwTurnDone(room);
      return;
    }
    case 'power':
      screwTurnCheck(room, me, ['power']);
      screwForget(room, me);
      screwPower(room, me, p);
      return;
    case 'skipPower':
      screwTurnCheck(room, me, ['power']);
      screwForget(room, me);
      screwTurnDone(room);
      return;
    case 'seeSwapDo': {
      screwTurnCheck(room, me, ['seeSwap']);
      screwForget(room, me);
      const look = g.look;
      const swap = p.slot !== undefined && p.slot !== null && p.slot !== '';
      if (!swap) {
        screwEvent(room, 'seeSwap', { pid: me, target: look.target, slot: look.slot, swapped: false });
      } else {
        const mine = screwSlot(room, me, p.slot);
        const theirs = screwSlot(room, look.target, look.slot);
        screwEvent(room, 'seeSwap', { pid: me, target: look.target, slot: look.slot, swapped: true, slot2: mine.id });
        screwTrade(room, me, mine, me, theirs, look.target);
      }
      screwTurnDone(room);
      return;
    }
    case 'khoshafPick': {
      screwTurnCheck(room, me, ['khoshaf']);
      screwForget(room, me);
      const i = Number(p.index);
      if (!(Number.isInteger(i) && i >= 0 && i < g.khoshaf.length)) throw new Error('اختار كارت');
      const card = g.khoshaf[i];
      // The other three go to the bottom of the deck (the start of the list).
      g.deck = g.khoshaf.filter((c, k) => k !== i).concat(g.deck);
      g.khoshaf = null;
      screwLastLapCheck(room, me);
      screwReceive(room, me, card, 'khoshaf');
      return;
    }
    case 'thiefGuess':          // a phone on an older page: the caller's guess counts as their vote
    case 'thiefVote': {
      // Who holds الحرامي? Every seated phone votes (the holder too); a vote can change until it closes.
      if (s.phase !== 'thiefGuess') return;
      if (screwSeated(room).indexOf(me) === -1) throw new Error('ستدخل من الجولة القادمة');
      const pick = p.pid === undefined || p.pid === null || p.pid === '' ? null : String(p.pid);
      if (pick !== null && s.order.indexOf(pick) === -1) throw new Error('اختيار غير صحيح');
      if (!g.votes) g.votes = {};
      if (!s.thiefVote) s.thiefVote = { voted: [] };
      g.votes[me] = pick;
      if (s.thiefVote.voted.indexOf(me) === -1) {
        s.thiefVote.voted.push(me);
        screwEvent(room, 'thiefVote', { pid: me });
      }
      if (screwSeated(room).every(id => s.thiefVote.voted.indexOf(id) !== -1)) screwCloseVote(room);
      return;
    }
    case 'closeThiefVote':
      requireHost(room, me);
      if (s.phase !== 'thiefGuess') return;
      screwCloseVote(room);
      return;
    case 'boomPick': {
      // بوم: one of your own cards, face down; final. Nothing about it is shared until all are in.
      if (s.phase !== 'play' || !s.turn || s.turn.stage !== 'boom' || !s.boom) throw new Error('مش دلوقتي');
      if (s.boom.picked.indexOf(me) !== -1) return;
      if (s.boom.waiting.indexOf(me) === -1) throw new Error('مش مطلوب منك');
      const e = screwSlot(room, me, p.slot);
      g.boomPicks[me] = e.id;
      s.boom.waiting = s.boom.waiting.filter(id => id !== me);
      s.boom.picked.push(me);
      if (!s.boom.waiting.length) screwBoomResolve(room);
      return;
    }
    case 'closeBoom':
      requireHost(room, me);
      if (s.phase !== 'play' || !s.turn || s.turn.stage !== 'boom') return;
      screwBoomResolve(room);
      return;
    case 'nextRound':
      requireHost(room, me);
      if (s.phase !== 'reveal') return;
      if (screwSeated(room).length < 2) { screwGameOver(room); return; }
      screwDeal(room);
      return;
    case 'skipTurn':
      // The player up is gone: their drawn card goes to the pile, the turn passes.
      requireHost(room, me);
      screwSkip(room);
      return;
    default:
      throw new Error('إجراء غير معروف');
  }
};

/* --- a game, a round -------------------------------------------------------- */

const screwNewGame = (room, playerId, action, p) => {
  requireHost(room, playerId);
  const prev = room.shared || {};
  if (action === 'playAgain' && prev.phase !== 'gameover') return;
  const n = room.players.length;
  if (n < 2) throw new Error('تحتاج لاعبين على الأقل');
  const settings = screwSettings(p, action === 'playAgain' ? (prev.settings || {}) : {}, n);
  // Seats at random; with teams they alternate, A B A B, so a ping lands on your partner.
  const order = shuffled(room.players.map(pl => pl.id));
  const teams = settings.teams ? [order.filter((id, i) => i % 2 === 0), order.filter((id, i) => i % 2 === 1)] : null;
  room.secrets = {};
  room._screw = { slotSeq: 0, turns: 0 };
  room.shared = {
    settings: settings,
    round: 0,
    rounds: settings.rounds,
    order: order,
    roster: order.slice(),
    teams: teams,
    scores: {},
    teamScores: teams ? { A: 0, B: 0 } : null,
    winners: null,
    // Carried over a play again, so a tap or an animation from the last game is never taken for this one.
    turnSeq: (prev.turnSeq || 0) + 1,
    eventSeq: prev.eventSeq || 0
  };
  screwDeal(room);
  screwSync(room);
};

/** The lobby's options, checked; a play again keeps the last game's. */
const screwSettings = (p, was, n) => {
  const asked = String(p.edition || '');
  const known = asked === 'custom' || Object.prototype.hasOwnProperty.call(SKREW_EDITIONS, asked);
  const edition = known ? asked : (was.edition || 'classic');
  let groups;
  if (edition === 'custom') {
    const list = Array.isArray(p.groups) ? p.groups.map(String) : (was.groups || []);
    groups = SKREW_GROUPS.filter(x => x === 'base' || list.indexOf(x) !== -1);
  } else {
    groups = SKREW_EDITIONS[edition].groups.slice();
  }
  const canTeams = SKREW_TEAM_SIZES.indexOf(n) !== -1;
  if (p.teams === true && !canTeams) throw new Error('صاحب صاحبه محتاج 4 أو 6 أو 8 لاعبين');
  const wantTeams = typeof p.teams === 'boolean' ? p.teams
    : (typeof was.teams === 'boolean' ? was.teams : !!(SKREW_EDITIONS[edition] && SKREW_EDITIONS[edition].teams));
  const flag = (key) => (typeof p[key] === 'boolean' ? p[key] : !!was[key]);
  return {
    edition: edition,
    groups: groups,
    teams: wantTeams && canTeams,
    // House rules, off by default. سرقة الحرامي: only with the thief in the deck. بصرة الفريق: only in teams.
    thiefSteal: flag('thiefSteal') && groups.indexOf('thief') !== -1,
    teamBasra: flag('teamBasra') && wantTeams && canTeams,
    rounds: SKREW_ROUNDS.indexOf(Number(p.rounds)) !== -1 ? Number(p.rounds) : (was.rounds || 5),
    screwFromLap: SKREW_LAPS.indexOf(Number(p.screwFromLap)) !== -1 ? Number(p.screwFromLap) : (was.screwFromLap || 2),
    // Seconds to memorize slots 3 and 4 at each deal before play starts by itself (0: until everyone taps).
    memorizeSecs: p.memorizeSecs !== undefined && p.memorizeSecs !== null && SKREW_MEMORIZE_SECS.indexOf(Number(p.memorizeSecs)) !== -1
      ? Number(p.memorizeSecs) : (SKREW_MEMORIZE_SECS.indexOf(Number(was.memorizeSecs)) !== -1 ? Number(was.memorizeSecs) : 0),
    turnClock: p.turnClock !== undefined && p.turnClock !== null && SKREW_CLOCKS.indexOf(Number(p.turnClock)) !== -1
      ? Number(p.turnClock) : (typeof was.turnClock === 'number' ? was.turnClock : 0),
    // موت مفاجئ: the deck running out starts a last lap instead of shuffling the pile into a new deck.
    suddenDeath: typeof p.suddenDeath === 'boolean' ? p.suddenDeath : !!was.suddenDeath,
    // A help for the phones: draw the value of a card the whole table saw face up (shared.hands[].h.known).
    memoryHelp: typeof p.memoryHelp === 'boolean' ? p.memoryHelp : !!was.memoryHelp,
    basraCount: SKREW_BASRA_COUNTS.indexOf(Number(p.basraCount)) !== -1 ? Number(p.basraCount)
      : (SKREW_BASRA_COUNTS.indexOf(Number(was.basraCount)) !== -1 ? Number(was.basraCount) : SKREW_CARDS.basra.count),
    decks: skrewDecksFor(n)
  };
};

/**
 * The cards for these settings (بصرة four a deck, or two), doubled beyond six
 * players - with one thief all the same: the table's vote is about "the" thief.
 */
const screwDeckCards = (settings) => {
  let thief = false;
  return skrewDeck(settings.groups, settings.decks, { basraCount: settings.basraCount }).filter(id => {
    if (id !== 'thief') return true;
    if (thief) return false;
    thief = true;
    return true;
  });
};

/** Deals the next round: four face down each, one face up on the pile, and the memorize. */
const screwDeal = (room) => {
  const s = room.shared;
  const last = room._screw || {};
  s.order = s.order.filter(id => screwHere(room, id));
  if (s.teams) s.teams = s.teams.map(t => t.filter(id => s.order.indexOf(id) !== -1));
  s.round = (s.round || 0) + 1;
  const g = {
    deck: shuffled(screwDeckCards(s.settings)),
    pile: [],
    hands: {},
    memorize: {},
    seen: {},
    drawn: null,
    drawnFrom: null,
    khoshaf: null,
    look: null,
    votes: {},                                // the thief vote, pid -> pid | null; published only with the result
    finisherKey: null,                        // the finisher's unit (pid, or a team key), kept if they leave
    thiefSpent: false,                        // سرقة الحرامي used: the thief is out for the rest of the round
    // Slot ids never repeat within a game, so a phone can't mistake one for last round's.
    slotSeq: last.slotSeq || 0,
    turns: last.turns || 0,
    start: (s.round - 1) % s.order.length,   // the first seat moves on one every round
    revealed: false
  };
  room._screw = g;
  s.order.forEach(id => {
    g.hands[id] = [];
    for (let i = 0; i < SKREW_HAND; i++) g.hands[id].push(screwNewSlot(g, g.deck.pop()));
    g.memorize[id] = SKREW_MEMORIZE.map(i => ({ slot: g.hands[id][i].id, card: g.hands[id][i].card }));
  });
  g.pile.push(g.deck.pop());
  s.phase = 'memorize';
  s.lap = 1;
  s.ready = [];
  s.turn = null;
  s.endsAt = s.settings.memorizeSecs ? Date.now() + s.settings.memorizeSecs * 1000 : null;
  s.caller = null;
  s.finisher = null;
  s.lastLap = null;
  s.thiefVote = null;
  s.boom = null;
  s.finalLeft = [];
  s.exposed = [];
  s.results = null;
  s.events = [];
  screwEvent(room, 'deal', { round: s.round });
  // Each owner looks at their slots 3 and 4 once.
  s.order.forEach(id => g.hands[id].forEach((e, i) => {
    screwArrived(room, e, 'deal', null, null, { known: null, looks: SKREW_MEMORIZE.indexOf(i) !== -1 ? [id] : [] });
  }));
  room.phase = 'memorize';
};

const screwBeginPlay = (room) => {
  const s = room.shared;
  const g = room._screw;
  g.memorize = {};
  s.phase = 'play';
  room.phase = 'play';
  screwStartTurn(room, s.order[g.start] || s.order[0], null);
};

/** Everyone who is dealt into this round and still in the room. */
const screwSeated = (room) => room.shared.order.filter(id => screwHere(room, id));
const screwHere = (room, id) => room.players.some(p => p.id === id);

/* --- turns -------------------------------------------------------------------- */

const screwStartTurn = (room, pid, pingFrom) => {
  const s = room.shared;
  room._screw.turns++;
  s.turn = { pid: pid, stage: 'choose' };
  if (pingFrom) { s.turn.pingFrom = pingFrom; s.turn.pongOpen = true; }
  s.endsAt = s.settings.turnClock ? Date.now() + s.settings.turnClock * 1000 : null;
};

const screwTurnCheck = (room, me, stages) => {
  const s = room.shared;
  if (s.phase !== 'play' || !s.turn) throw new Error('مش وقت اللعب');
  if (s.turn.pid !== me) throw new Error('مش دورك');
  if (stages.indexOf(s.turn.stage) === -1) throw new Error('مش دلوقتي');
};

/** Whether a seat still has a turn to play this round: after a سكرو, or in a last lap, only those in finalLeft. */
const screwEligible = (room, id) => {
  const s = room.shared;
  if (!screwHere(room, id)) return false;
  return !(s.caller || s.lastLap) || (id !== s.caller && s.finalLeft.indexOf(id) !== -1);
};

/**
 * The next seat after `from` with a turn to play, or -1. Stepping onto the
 * round's first seat is a new lap, whether or not that seat plays.
 */
const screwWalk = (room, from) => {
  const s = room.shared;
  const n = s.order.length;
  for (let step = 1; step <= n; step++) {
    const at = (from + step) % n;
    if (at === room._screw.start) s.lap++;
    if (screwEligible(room, s.order[at])) return at;
  }
  return -1;
};

const screwTurnDone = (room) => {
  const s = room.shared;
  screwPassTurn(room, s.order.indexOf(s.turn.pid), false);
};

/**
 * Ends the turn of the player up and hands it on from seat `from`. After a
 * سكرو, or in a last lap, their last turn is spent. A ping skips the next
 * player (their last turn too, if it was one) and opens Pong for the one
 * after. Nobody left to play: the round is over.
 */
const screwPassTurn = (room, from, ping) => {
  const s = room.shared;
  const g = room._screw;
  const cur = s.turn ? s.turn.pid : null;
  const last = !!(s.caller || s.lastLap);
  s.turn = null;
  s.endsAt = null;
  g.look = null;
  if (last && cur) s.finalLeft = s.finalLeft.filter(id => id !== cur);
  let at = screwWalk(room, from);
  if (ping) {
    const target = at === -1 ? null : s.order[at];
    if (target && last) s.finalLeft = s.finalLeft.filter(id => id !== target);
    screwEvent(room, 'ping', { pid: cur, target: target });
    if (at !== -1) at = screwWalk(room, at);
  }
  if (at === -1) { screwEndRound(room); return; }
  screwStartTurn(room, s.order[at], ping ? cur : null);
};

/**
 * The host's skip and the clock: whatever the player up held goes, and the
 * turn passes. During the thief vote it closes the vote with the votes cast.
 */
const screwSkip = (room) => {
  const s = room.shared;
  if (s.phase === 'play' && s.turn && s.turn.stage === 'boom') {
    // بوم waiting on phones: whoever hasn't picked gets a card picked at random.
    screwBoomResolve(room);
    return true;
  }
  if (s.phase === 'play' && s.turn && s.turn.stage === 'steal') {
    // A steal is a forced swap: one of the player's own cards, at random.
    const hand = room._screw.hands[s.turn.pid] || [];
    screwSteal(room, hand[Math.floor(Math.random() * hand.length)]);
    return true;
  }
  if (s.phase === 'play' && s.turn) {
    const pid = s.turn.pid;
    screwDropPending(room, false);
    screwEvent(room, 'skip', { pid: pid });
    screwPassTurn(room, s.order.indexOf(pid), false);
    return true;
  }
  if (s.phase === 'thiefGuess') return screwCloseVote(room);
  return false;
};

/** A card drawn, or picked from the khoshaf four, lands in the player's hand - or plays itself. */
const screwReceive = (room, me, card, from) => {
  const s = room.shared;
  const g = room._screw;
  const info = SKREW_CARDS[card] || {};
  if (info.drawn === 'play') {
    g.pile.push(card);
    if (info.power === 'wakeUp') {
      // المسحراتي: a سكرو now, called by whoever drew it, with no last turns. After a سكرو
      // it only cuts the last turns short: whoever called stays the caller.
      screwEvent(room, 'wakeUp', { pid: me });
      if (!s.caller) s.caller = me;
      s.finalLeft = [];
      s.turn = null;
      s.endsAt = null;
      screwEndRound(room);
      return;
    }
    screwPassTurn(room, s.order.indexOf(me), true);   // بينج
    return;
  }
  g.drawn = card;
  g.drawnFrom = from;
  s.turn.stage = 'drawn';
};

/**
 * A card the player up still held when their turn was cut short. `toDeck`
 * (they left the room): it goes to the bottom of the deck unseen; otherwise a
 * drawn card is thrown on the pile with no power. The khoshaf four always go
 * back under the deck.
 */
const screwDropPending = (room, toDeck) => {
  const s = room.shared;
  const g = room._screw;
  if (g.drawn) {
    if (toDeck) g.deck.unshift(g.drawn);
    else {
      g.pile.push(g.drawn);
      screwEvent(room, 'discard', { pid: s.turn && s.turn.pid, card: g.drawn });
    }
  }
  if (g.khoshaf) g.deck = g.khoshaf.concat(g.deck);
  g.drawn = null;
  g.drawnFrom = null;
  g.khoshaf = null;
  g.look = null;
  g.boomPicks = null;             // a بوم still waiting is called off
  s.boom = null;
};

/* --- cards and slots ------------------------------------------------------------ */

const screwNewSlot = (g, card, shown) => ({ id: 'c' + (++g.slotSeq), card: card, shown: !!shown });

/*
 * How each card got into its slot, for every phone (shared.hands[pid][i].h),
 * so a player can still tell a card's story at twelve players, where forty
 * events don't reach back to the deal. Only what the whole table watched:
 *   how    'deal' | 'deck' (a drawn card kept) | 'pile' (the top of the pile
 *          taken) | 'penalty' | 'swap' (blind swap, see & swap) | 'give' |
 *          'scream' (dealt again blind: nothing known, no looks) | 'khoshaf'
 *          (a الخشاف pick kept)
 *   by     who made that move (null for the deal)
 *   from   { pid, slot } the card came from (swap, give), or null
 *   at     the eventSeq of that move
 *   known  the card, only when the whole table saw this very card face up: it
 *          lay on the pile before it was taken, or it was thrown and came back
 *          (a wrong throw, a refused بصرة); it travels with the card and goes
 *          when the card leaves the hand
 *   looks  who has looked at this very card since it was dealt or arrived
 *          (the memorize, a peek, a spy, كعب داير, شوف وبدّل's look, the drawer
 *          of a kept card); it travels with the card too
 */
const screwBlankH = () => ({ how: 'deal', by: null, from: null, at: 0, known: null, looks: [] });

/** A slot's history (made for a room saved before histories existed). */
const screwH = (e) => {
  if (!e.h) e.h = screwBlankH();
  return e.h;
};

/**
 * The card in slot `e` has just arrived by the move whose event was just
 * written. `carry` is what the table already knew about this same card when
 * it travels (a swap, a give, the scream): its known value and its looks.
 */
const screwArrived = (room, e, how, by, from, carry) => {
  e.h = {
    how: how,
    by: by || null,
    from: from || null,
    at: room.shared.eventSeq || 0,
    known: carry && carry.known ? carry.known : null,
    looks: carry && Array.isArray(carry.looks) ? carry.looks.slice() : []
  };
  return e.h;
};

/** `pid` has looked at the card in slot `e`. */
const screwLooked = (e, pid) => {
  const h = screwH(e);
  if (h.looks.indexOf(pid) === -1) h.looks.push(pid);
};

/** A swap the table watched: slot `a` of `aOwner` and slot `b` of `bOwner` trade cards, and what is known about them. */
const screwTrade = (room, by, a, aOwner, b, bOwner) => {
  const ha = screwH(a);
  const hb = screwH(b);
  screwSwapCards(a, b);
  screwArrived(room, a, 'swap', by, { pid: bOwner, slot: b.id }, hb);
  screwArrived(room, b, 'swap', by, { pid: aOwner, slot: a.id }, ha);
};

/** One of a player's slots, or an error. */
const screwSlot = (room, pid, slot) => {
  const e = (room._screw.hands[pid] || []).find(x => x.id === String(slot));
  if (!e) throw new Error('الكارت ده مش موجود');
  return e;
};

const screwRemoveSlot = (room, pid, slotId) => {
  const g = room._screw;
  g.hands[pid] = (g.hands[pid] || []).filter(x => x.id !== slotId);
};

/** Two slots trade cards; the slots stay where they are, and a known card stays known. */
const screwSwapCards = (a, b) => {
  const card = a.card, shown = a.shown;
  a.card = b.card; a.shown = b.shown;
  b.card = card; b.shown = shown;
};

/**
 * The top of the deck. An empty deck takes the pile back, all but its top
 * card, shuffled - except with موت مفاجئ, where an empty deck stays empty.
 */
const screwFromDeck = (room) => {
  const g = room._screw;
  if (!g.deck.length && g.pile.length > 1 && !room.shared.settings.suddenDeath) {
    const top = g.pile.pop();
    // A thief spent on a steal is out for the round: it doesn't go back into the deck.
    g.deck = shuffled(g.thiefSpent ? g.pile.filter(c => c !== 'thief') : g.pile);
    g.pile = [top];
    screwEvent(room, 'reshuffle', {});
  }
  return g.deck.length ? g.deck.pop() : null;
};

/**
 * A card thrown from a hand (a match, or Pong): right, it goes on the pile.
 * Wrong, the table has seen it flip, and it goes back face down into the same
 * slot (its h.known remembers it); then the top of the deck comes blind, face
 * down into a new slot at the end of the hand - not even its owner looks.
 */
const screwThrow = (room, me, e, ok, type, owner) => {
  const g = room._screw;
  const from = owner || me;           // بصرة الفريق: the card is a partner's; a penalty is still the thrower's
  const fields = { pid: me, slot: e.id, card: e.card, ok: ok };
  if (from !== me) fields.owner = from;
  screwEvent(room, type, fields);
  if (ok) {
    screwRemoveSlot(room, from, e.id);
    g.pile.push(e.card);
    return;
  }
  screwH(e).known = e.card;
  const card = screwFromDeck(room);
  if (!card) return;                    // nothing left to draw (موت مفاجئ): no penalty card
  const slot = screwNewSlot(g, card);
  g.hands[me].push(slot);
  screwEvent(room, 'penalty', { pid: me, slot: slot.id });
  screwArrived(room, slot, 'penalty', me, null, null);
  screwLastLapCheck(room, me);
};

/** بصرة الفريق: may `me` throw a card of `owner`'s? The house rule on, a partner, and their side not protected. */
const screwTeamThrowOk = (room, me, owner) => {
  const s = room.shared;
  if (!s.settings.teamBasra || !s.teams || !screwHere(room, owner) || screwProtected(room, owner)) return false;
  return s.teams.some(t => t.indexOf(me) !== -1 && t.indexOf(owner) !== -1);
};

/** سرقة الحرامي's swap: `mine` (the player up's slot) for the card they looked at; the turn ends. */
const screwSteal = (room, mine) => {
  const s = room.shared;
  const g = room._screw;
  const me = s.turn.pid;
  const look = g.look;
  const theirs = screwSlot(room, look.target, look.slot);
  screwForget(room, me);
  screwEvent(room, 'stealSwap', { pid: me, slot: mine.id, target: look.target, slot2: theirs.id });
  screwTrade(room, me, mine, me, theirs, look.target);
  screwTurnDone(room);
};

/** Nothing can be drawn this turn: the deck is empty and can't be made again from the pile. */
const screwCantDraw = (room) => {
  const g = room._screw;
  return !g.deck.length && (!!room.shared.settings.suddenDeath || g.pile.length <= 1);
};

/**
 * موت مفاجئ: a move has just taken the deck's last card. With no سكرو called
 * and no last lap yet, everyone else gets one last turn, in seat order after
 * the player up, whose own turn finishes as usual. After a سكرو nothing more
 * happens: the last turns are already running.
 */
const screwLastLapCheck = (room, by) => {
  const s = room.shared;
  const g = room._screw;
  if (!s.settings.suddenDeath || g.deck.length || s.caller || s.lastLap || s.phase !== 'play') return;
  const at = s.order.indexOf(by);
  s.lastLap = { by: by };
  s.finalLeft = s.order.slice(at + 1).concat(s.order.slice(0, at)).filter(id => screwHere(room, id));
  screwEvent(room, 'lastLap', { pid: by });
};

/**
 * A hand has just lost a card (a throw, بصرة, خد بس, Pong, بوم). Empty, the
 * round is over at once: nobody plays on, and that player is the finisher.
 * True when it ended the round.
 */
const screwFinished = (room, pid) => {
  const s = room.shared;
  const g = room._screw;
  if (s.phase !== 'play' || (g.hands[pid] || []).length) return false;
  s.finisher = pid;
  g.finisherKey = s.teams ? (SKREW_TEAM_KEYS[s.teams.findIndex(t => t.indexOf(pid) !== -1)] || pid) : pid;
  screwEvent(room, 'finish', { pid: pid });
  screwEndRound(room);
  return true;
};

/** Forgets what a player last looked at: it lasts until their next move. */
const screwForget = (room, pid) => { delete room._screw.seen[pid]; };

/* --- powers ------------------------------------------------------------------------ */

/**
 * After سكرو the caller's hand is safe from swaps, gives, بوم, the cannon and
 * the scream - in teams the partners' hands too. Looking is still allowed.
 */
const screwProtected = (room, id) => {
  const s = room.shared;
  if (!s.caller) return false;
  if (id === s.caller) return true;
  return !!(s.teams && s.teams.some(t => t.indexOf(s.caller) !== -1 && t.indexOf(id) !== -1));
};

/** Another player a power can aim at. `protect`: not a protected hand (screwProtected). */
const screwTarget = (room, me, target, protect) => {
  const s = room.shared;
  const id = String(target || '');
  if (id === me || s.order.indexOf(id) === -1 || !screwHere(room, id)) throw new Error('اختار لاعب تاني');
  if (protect && screwProtected(room, id)) throw new Error('اللي قال سكرو محمي');
  return id;
};

const screwPower = (room, me, p) => {
  const s = room.shared;
  let power = s.turn.power;
  if (power === 'asYouLike') {
    // على كيفك: any one of the powers on the owner's list.
    const as = String(p.as || '');
    if (SKREW_AS_YOU_LIKE.indexOf(as) === -1) throw new Error('اختار قوة');
    screwEvent(room, 'asYouLike', { pid: me, as: as });
    power = as;
  }
  const run = SKREW_POWERS[power];
  if (!run) throw new Error('الكارت ده ملوش قوة');
  run(room, me, p);
};

const SKREW_POWERS = {
  peekOwn: (room, me, p) => {
    const e = screwSlot(room, me, p.slot);
    room._screw.seen[me] = [{ pid: me, slot: e.id, card: e.card }];
    screwLooked(e, me);
    screwEvent(room, 'peekOwn', { pid: me, slot: e.id });
    screwTurnDone(room);
  },
  spyOther: (room, me, p) => {
    const target = screwTarget(room, me, p.target, false);
    const e = screwSlot(room, target, p.slot);
    room._screw.seen[me] = [{ pid: target, slot: e.id, card: e.card }];
    screwLooked(e, me);
    screwEvent(room, 'spyOther', { pid: me, target: target, slot: e.id });
    screwTurnDone(room);
  },
  blindSwap: (room, me, p) => {
    const mine = screwSlot(room, me, p.slot);
    const target = screwTarget(room, me, p.target, true);
    const theirs = screwSlot(room, target, p.slot2);
    screwEvent(room, 'blindSwap', { pid: me, slot: mine.id, target: target, slot2: theirs.id });
    screwTrade(room, me, mine, me, theirs, target);
    screwTurnDone(room);
  },
  basra: (room, me, p) => {
    // Neither the red screw nor the thief can be thrown: turned up, the table sees it, and it goes
    // back face down into its slot (h.known remembers it). An error would let a player test slots.
    const g = room._screw;
    const e = screwSlot(room, me, p.slot);
    const ok = e.card !== 'red25' && e.card !== 'thief';
    screwEvent(room, 'basra', { pid: me, slot: e.id, card: e.card, ok: ok });
    if (ok) {
      screwRemoveSlot(room, me, e.id);
      g.pile.push(e.card);
      if (screwFinished(room, me)) return;
    } else {
      screwH(e).known = e.card;
    }
    screwTurnDone(room);
  },
  allAround: (room, me, p) => {
    const s = room.shared;
    const g = room._screw;
    if (Array.isArray(p.own)) {
      // Two of your own.
      const slots = p.own.map(String).filter((x, i, a) => a.indexOf(x) === i);
      if (slots.length !== Math.min(2, (g.hands[me] || []).length)) throw new Error('اختار كارتين من عندك');
      const looked = slots.map(sl => screwSlot(room, me, sl));
      const seen = looked.map(e => ({ pid: me, slot: e.id, card: e.card }));
      looked.forEach(e => screwLooked(e, me));
      g.seen[me] = seen;
      screwEvent(room, 'allAround', { pid: me, own: seen.map(x => x.slot) });
    } else {
      // One of every other player who holds a card - a caller's too, looking is allowed.
      const others = s.order.filter(id => id !== me && screwHere(room, id) && (g.hands[id] || []).length);
      const picks = Array.isArray(p.picks) ? p.picks : [];
      if (picks.length !== others.length) throw new Error('اختار كارت من كل لاعب');
      const seen = [];
      const looked = [];
      picks.forEach(pk => {
        const target = String((pk && pk.target) || '');
        if (others.indexOf(target) === -1 || seen.some(x => x.pid === target)) throw new Error('اختار كارت من كل لاعب');
        const e = screwSlot(room, target, pk.slot);
        seen.push({ pid: target, slot: e.id, card: e.card });
        looked.push(e);
      });
      looked.forEach(e => screwLooked(e, me));
      g.seen[me] = seen;
      screwEvent(room, 'allAround', { pid: me, picks: seen.map(x => ({ target: x.pid, slot: x.slot })) });
    }
    screwTurnDone(room);
  },
  give: (room, me, p) => {
    const g = room._screw;
    const e = screwSlot(room, me, p.slot);
    const target = screwTarget(room, me, p.target, true);
    screwRemoveSlot(room, me, e.id);
    const slot = screwNewSlot(g, e.card, e.shown);
    g.hands[target].push(slot);
    screwEvent(room, 'give', { pid: me, slot: e.id, target: target, slot2: slot.id });
    screwArrived(room, slot, 'give', me, { pid: me, slot: e.id }, screwH(e));
    if (screwFinished(room, me)) return;
    screwTurnDone(room);
  },
  seeSwap: (room, me, p) => {
    // A look first (a stage of its own), then seeSwapDo swaps or leaves it.
    const s = room.shared;
    const g = room._screw;
    const target = screwTarget(room, me, p.target, true);
    const e = screwSlot(room, target, p.slot);
    g.seen[me] = [{ pid: target, slot: e.id, card: e.card }];
    screwLooked(e, me);
    g.look = { target: target, slot: e.id };
    s.turn.stage = 'seeSwap';
    s.turn.look = { target: target, slot: e.id };
  },
  cannon: (room, me, p) => {
    const s = room.shared;
    const target = screwTarget(room, me, p.target, true);
    if (s.exposed.indexOf(target) === -1) s.exposed.push(target);
    screwEvent(room, 'cannon', { pid: me, target: target });
    screwTurnDone(room);
  },
  khoshaf: (room, me) => {
    const s = room.shared;
    const g = room._screw;
    const four = [];
    for (let i = 0; i < 4; i++) {
      const card = screwFromDeck(room);
      if (!card) break;
      four.push(card);
    }
    screwEvent(room, 'khoshaf', { pid: me });
    // What is left of the deck, up to four; nothing left (موت مفاجئ) and the power ends.
    if (!four.length) { screwTurnDone(room); return; }
    g.khoshaf = four;
    s.turn.stage = 'khoshaf';
  },
  scream: (room, me) => {
    // صرخة أوسكار: every hand outside the protected side is gathered, shuffled and dealt back
    // blind, each player keeping their number of cards (and their slots). Nobody knows any of
    // them now: every look is forgotten. The turn stays with the player: a whole new turn.
    const s = room.shared;
    const g = room._screw;
    const circle = s.order.filter(id => screwHere(room, id) && !screwProtected(room, id));
    const counts = {};
    let cards = [];
    circle.forEach(id => {
      const hand = g.hands[id] || [];
      counts[id] = hand.length;
      cards = cards.concat(hand.map(e => e.card));
    });
    cards = shuffled(cards);
    circle.forEach(id => (g.hands[id] || []).forEach(e => {
      e.card = cards.pop();
      e.shown = s.exposed.indexOf(id) !== -1;     // the cannon exposed the player, not the cards
    }));
    g.seen = {};
    screwEvent(room, 'scream', { pid: me, counts: counts });
    circle.forEach(id => (g.hands[id] || []).forEach(e => screwArrived(room, e, 'scream', me, null, null)));
    screwStartTurn(room, me, null);
  },
  boom: (room, me) => {
    // بوم: every other player with cards (not the protected side) throws one of their own, face
    // down, chosen on their phone (boomPick); all are turned up together once everyone has picked.
    const s = room.shared;
    const at = s.order.indexOf(me);
    const waiting = s.order.slice(at + 1).concat(s.order.slice(0, at))
      .filter(id => screwHere(room, id) && !screwProtected(room, id) && (room._screw.hands[id] || []).length);
    room._screw.boomPicks = {};
    s.boom = { waiting: waiting, picked: [] };
    s.turn.stage = 'boom';
    s.endsAt = s.settings.turnClock ? Date.now() + s.settings.turnClock * 1000 : null;
    screwEvent(room, 'boom', { pid: me });
    if (!waiting.length) screwBoomResolve(room);
  }
};

/**
 * بوم closes: the host's close, the clock, or a leave took the last one waiting. Anyone still
 * waiting has a slot picked at random. Then every picked card goes face up onto the pile, in seat
 * order after the player - whatever it is, the red screw and the thief too. A hand emptied ends
 * the round (the first emptied after the player is the finisher); otherwise the turn stays with
 * the player: a whole new turn.
 */
const screwBoomResolve = (room) => {
  const s = room.shared;
  const g = room._screw;
  const me = s.turn.pid;
  const picks = g.boomPicks || {};
  (s.boom ? s.boom.waiting : []).forEach(id => {
    const hand = g.hands[id] || [];
    if (hand.length) picks[id] = hand[Math.floor(Math.random() * hand.length)].id;
  });
  s.boom = null;
  g.boomPicks = null;
  const at = s.order.indexOf(me);
  const emptied = [];
  s.order.slice(at + 1).concat(s.order.slice(0, at)).forEach(id => {
    if (!Object.prototype.hasOwnProperty.call(picks, id)) return;
    const e = (g.hands[id] || []).find(x => x.id === picks[id]);
    if (!e) return;
    screwRemoveSlot(room, id, e.id);
    g.pile.push(e.card);
    screwEvent(room, 'boomThrow', { pid: id, slot: e.id, card: e.card });
    if (!(g.hands[id] || []).length) emptied.push(id);
  });
  if (emptied.length && screwFinished(room, emptied[0])) return;
  screwStartTurn(room, me, null);
};

/* --- the end of a round: the thief vote, the reveal and the score ----------------- */

/**
 * The round is over (سكرو, المسحراتي, an empty hand, a last lap played out):
 * the table's vote on who holds الحرامي first, whenever the thief is in this
 * deck - even when nobody holds it - then the reveal.
 */
const screwEndRound = (room) => {
  const s = room.shared;
  const g = room._screw;
  screwDropPending(room, false);
  s.turn = null;
  s.endsAt = null;
  s.finalLeft = [];
  // With سرقة الحرامي, a thief spent on a steal or lying on the pile is in nobody's hand: no vote.
  const nobodyHolds = s.settings.thiefSteal && (g.thiefSpent || g.pile.indexOf('thief') !== -1);
  if (s.settings.groups.indexOf('thief') !== -1 && !nobodyHolds) {
    g.votes = {};
    s.thiefVote = { voted: [] };
    s.phase = 'thiefGuess';
    room.phase = 'thiefGuess';
    s.endsAt = s.settings.turnClock ? Date.now() + s.settings.turnClock * 1000 : null;
    return;
  }
  screwScoreRound(room, null);
};

/**
 * Closes the thief vote with the votes cast by players still seated (the
 * host's close, the clock, the last vote in, or a leave that leaves everyone
 * voted), and scores the round. False when there was no vote to close.
 */
const screwCloseVote = (room) => {
  const s = room.shared;
  const g = room._screw;
  if (s.phase !== 'thiefGuess') return false;
  const votes = {};
  screwSeated(room).forEach(id => {
    if (g.votes && Object.prototype.hasOwnProperty.call(g.votes, id)) votes[id] = g.votes[id];
  });
  const tally = screwTally(votes, s.caller);
  screwScoreRound(room, { votes: votes, accused: tally.accused, skipped: tally.skipped });
  return true;
};

/**
 * Who the table accused: the choice with the most votes (a player, or null
 * for "no thief"). A tie goes to the caller's vote when it is one of the tied
 * choices, otherwise nobody is accused. No votes at all: nobody, `skipped`.
 */
const screwTally = (votes, caller) => {
  const voters = Object.keys(votes);
  if (!voters.length) return { accused: null, skipped: true };
  const NOBODY = '';
  const keyOf = (v) => (v === null || v === undefined ? NOBODY : String(v));
  const count = {};
  voters.forEach(id => { const k = keyOf(votes[id]); count[k] = (count[k] || 0) + 1; });
  const most = Math.max.apply(null, Object.keys(count).map(k => count[k]));
  const top = Object.keys(count).filter(k => count[k] === most);
  let pick = NOBODY;
  if (top.length === 1) pick = top[0];
  else if (caller && Object.prototype.hasOwnProperty.call(votes, caller) && top.indexOf(keyOf(votes[caller])) !== -1) pick = keyOf(votes[caller]);
  return { accused: pick === NOBODY ? null : pick, skipped: false };
};

/**
 * Every hand face up and the round scored, in this order: hand totals (a life
 * jacket copying the lowest other card), the units (a team adds its
 * partners' hands), the round scores (screwRoundScores), then الحرامي
 * (screwThief). `vote` is the closed thief vote ({ votes, accused, skipped }),
 * or null when the thief is not in this deck.
 */
const screwScoreRound = (room, vote) => {
  const s = room.shared;
  const g = room._screw;
  g.revealed = true;
  const ids = screwSeated(room);
  const hands = {};
  const values = {};
  const sums = {};
  ids.forEach(id => {
    hands[id] = (g.hands[id] || []).map(e => e.card);
    values[id] = skrewHandValues(hands[id]);
    sums[id] = skrewHandTotal(hands[id]);
  });
  const units = screwUnits(room, ids);
  const unitTotals = {};
  units.forEach(u => { unitTotals[u.key] = u.ids.reduce((t, id) => t + sums[id], 0); });
  const callerUnit = s.caller ? units.find(u => u.ids.indexOf(s.caller) !== -1) : null;
  const finisherKey = s.finisher ? (g.finisherKey || s.finisher) : null;
  const scored = screwRoundScores(unitTotals, callerUnit ? callerUnit.key : null, finisherKey, callerUnit ? sums[s.caller] : null);
  const thief = vote ? screwThief(room, units, scored.round, vote) : null;
  const totals = Object.assign({}, unitTotals);
  const round = Object.assign({}, scored.round);
  const lowest = [];
  units.forEach(u => {
    u.ids.forEach(id => {
      addScore(room, id, scored.round[u.key]);
      if (s.teams) { round[id] = scored.round[u.key]; totals[id] = unitTotals[u.key]; }
      if (scored.lowest.indexOf(u.key) !== -1) lowest.push(id);
    });
    if (s.teams) s.teamScores[u.key] = (s.teamScores[u.key] || 0) + scored.round[u.key];
  });
  s.thiefVote = null;
  s.results = {
    hands: hands,
    values: values,
    sums: sums,
    totals: totals,
    thief: thief,
    round: round,
    lowest: lowest,
    caller: s.caller,
    finisher: s.finisher || null,
    callerDouble: scored.callerDouble
  };
  if (thief) screwEvent(room, 'accuse', { accused: thief.accused, caught: thief.caught });
  screwEvent(room, 'reveal', {});
  if (s.round >= s.rounds) { screwGameOver(room); return; }
  s.phase = 'reveal';
  room.phase = 'reveal';
};

/** What is scored together: each player, or in teams the two sides by their keys. */
const screwUnits = (room, ids) => {
  const s = room.shared;
  if (!s.teams) return ids.map(id => ({ key: id, ids: [id] }));
  return s.teams.map((t, i) => ({ key: SKREW_TEAM_KEYS[i], ids: t.filter(id => ids.indexOf(id) !== -1) }));
};

/**
 * One round's points from the units' totals (the owner's rule, 17 Sep 2026;
 * a tie is a successful call):
 *   - a finisher (a hand that ran out): their unit scores 0, every other unit
 *     its total, and a caller's unit that isn't the finisher's is doubled;
 *   - a caller whose total is equal to or lower than every other unit's: the
 *     caller's unit scores 0 and every other unit its own total, a unit that
 *     tied the caller included;
 *   - a caller beaten: the lowest of the others score 0, the caller's unit is
 *     doubled, the rest their totals;
 *   - neither (a last lap played out, or the caller left): the lowest score 0.
 * Doubling is whatever the sign: -1 is -2, 0 stays 0. In teams only the
 * caller's own hand (`callerOwn`) is doubled, then added to the partners'
 * hands; who won the round is still decided on the plain totals. `lowest` is
 * who scored 0 by this rule; `callerDouble` whether the caller was doubled.
 */
const screwRoundScores = (totals, callerKey, finisherKey, callerOwn) => {
  const keys = Object.keys(totals);
  const round = {};
  keys.forEach(k => { round[k] = totals[k]; });
  const has = (k) => k !== null && k !== undefined && keys.indexOf(k) !== -1;
  let lowest = [];
  let callerDouble = false;
  const lowestOf = (list) => {
    if (!list.length) return [];
    const min = Math.min.apply(null, list.map(k => totals[k]));
    return list.filter(k => totals[k] === min);
  };
  if (finisherKey !== null && finisherKey !== undefined) {
    // The finisher may have left since: then nobody scores 0, and the rest is as it was.
    if (has(finisherKey)) lowest = [finisherKey];
    if (has(callerKey) && callerKey !== finisherKey) callerDouble = true;
  } else if (has(callerKey)) {
    const others = keys.filter(k => k !== callerKey);
    if (others.every(k => totals[k] >= totals[callerKey])) {
      lowest = [callerKey];
    } else {
      lowest = lowestOf(others);
      callerDouble = true;
    }
  } else {
    lowest = lowestOf(keys);
  }
  if (callerDouble) round[callerKey] = totals[callerKey] + (typeof callerOwn === 'number' ? callerOwn : totals[callerKey]);
  lowest.forEach(k => { round[k] = 0; });
  return { round: round, lowest: lowest, callerDouble: callerDouble };
};

/**
 * الحرامي, settled on the round scores once they are known (`round`, by unit,
 * changed in place). Kept in one place so the rule can change.
 *   - Nobody holds the thief: nothing.
 *   - Caught (the table accused the holder): the thief's unit takes +25.
 *   - Unnoticed (anyone else accused, or nobody): the thief steals the lowest
 *     round score - their unit's score becomes it - and every unit that had
 *     it takes the +25 instead. A thief whose unit already has the lowest
 *     score changes nothing.
 * `victims` are unit keys (a player, or 'A' / 'B'); `score` the score stolen.
 */
const screwThief = (room, units, round, vote) => {
  const s = room.shared;
  const g = room._screw;
  const holder = s.order.find(id => units.some(u => u.ids.indexOf(id) !== -1) && (g.hands[id] || []).some(e => e.card === 'thief')) || null;
  const out = {
    holder: holder,
    accused: vote.accused,
    votes: vote.votes,
    caught: false,
    stole: false,
    victims: [],
    score: null,
    skipped: !!vote.skipped
  };
  if (!holder) return out;
  const key = units.find(u => u.ids.indexOf(holder) !== -1).key;
  if (vote.accused === holder) {
    round[key] += SKREW_THIEF_POINTS;
    out.caught = true;
    return out;
  }
  const keys = Object.keys(round);
  const low = Math.min.apply(null, keys.map(k => round[k]));
  if (round[key] === low) return out;
  out.victims = keys.filter(k => round[k] === low);
  out.victims.forEach(k => { round[k] += SKREW_THIEF_POINTS; });
  round[key] = low;
  out.stole = true;
  out.score = low;
  return out;
};

/** The last round is scored (or too few are left to play): the lowest total wins. */
const screwGameOver = (room) => {
  const s = room.shared;
  const g = room._screw;
  g.revealed = true;
  s.turn = null;
  s.endsAt = null;
  s.finalLeft = [];
  s.thiefVote = null;
  const ids = screwSeated(room);
  if (s.teams) {
    const live = s.teams.map((t, i) => ({ key: SKREW_TEAM_KEYS[i], ids: t.filter(id => ids.indexOf(id) !== -1) })).filter(u => u.ids.length);
    const best = Math.min.apply(null, live.map(u => s.teamScores[u.key] || 0));
    const won = live.filter(u => (s.teamScores[u.key] || 0) === best);
    s.winnerTeams = won.map(u => u.key);
    s.winners = [].concat.apply([], won.map(u => u.ids));
  } else {
    const best = ids.length ? Math.min.apply(null, ids.map(id => (s.scores || {})[id] || 0)) : 0;
    s.winners = ids.filter(id => ((s.scores || {})[id] || 0) === best);
  }
  s.phase = 'gameover';
  room.phase = 'gameover';
};

/** Lowest total first: the one winning is at the top. */
const screwBoard = (room) => {
  const s = room.shared;
  const teamOf = (id) => !s.teams ? null : SKREW_TEAM_KEYS[s.teams.findIndex(t => t.indexOf(id) !== -1)] || null;
  return room.players
    .filter(p => s.order.indexOf(p.id) !== -1)
    .map(p => ({ id: p.id, name: p.name, score: (s.scores || {})[p.id] || 0, team: teamOf(p.id) }))
    .sort((a, b) => a.score - b.score);
};

/* --- what the table sees -------------------------------------------------------------- */

const screwEvent = (room, type, fields) => {
  const s = room.shared;
  s.eventSeq = (s.eventSeq || 0) + 1;
  s.events = (s.events || []).concat([Object.assign({ seq: s.eventSeq, type: type }, fields)]).slice(-SKREW_EVENTS);
};

/** Writes the hands as the table sees them, the pile, and every phone's own slice. */
const screwSync = (room) => {
  const s = room.shared;
  const g = room._screw;
  if (!g || !g.hands) return;
  const hands = {};
  s.order.forEach(id => {
    const exposed = s.exposed.indexOf(id) !== -1;
    hands[id] = (g.hands[id] || []).map((e, i) => {
      if (exposed) e.shown = true;     // seen by the table, it stays seen wherever it goes
      const h = screwH(e);
      return {
        id: e.id,
        up: g.revealed || e.shown ? e.card : null,
        n: i + 1,
        h: { how: h.how, by: h.by, from: h.from ? { pid: h.from.pid, slot: h.from.slot } : null, at: h.at, known: h.known, looks: h.looks.slice() }
      };
    });
  });
  s.hands = hands;
  s.pile = g.pile.slice(-SKREW_PILE_SHOWN);
  s.deckCount = g.deck.length;
  // سرقة الحرامي: whether this round's thief has been played - public (it went up
  // on the pile), and the phones need it after its event has left the last 40.
  s.thiefSpent = !!g.thiefSpent;
  const playing = s.phase === 'play' || s.phase === 'thiefGuess';
  const t = s.phase === 'play' && s.turn ? s.turn : {};
  room.secrets = {};
  screwSeated(room).forEach(id => {
    room.secrets[id] = {
      memorize: s.phase === 'memorize' && g.memorize[id] ? g.memorize[id] : null,
      drawn: t.pid === id && t.stage === 'drawn' ? g.drawn : null,
      seen: playing && g.seen[id] ? g.seen[id] : null,
      khoshaf: t.pid === id && t.stage === 'khoshaf' ? g.khoshaf : null
    };
  });
  s.board = screwBoard(room);
};

/* --- someone leaves ------------------------------------------------------------------ */

/**
 * Their cards go under the deck unseen and their seat goes; a turn that was
 * theirs passes, a سكرو they called is revealed at once, a thief vote drops
 * theirs (and closes if everyone left has voted), and a table of one (or a
 * side with nobody left) ends the game. A finisher leaving changes nothing:
 * the round is already over.
 */
const screwPlayerLeft = (room, playerId) => {
  const s = room.shared;
  const g = room._screw;
  if (!g || !Array.isArray(s.order)) return;
  const seat = s.order.indexOf(playerId);
  if (seat === -1) return;
  screwApply(room, () => {
    const midRound = s.phase === 'memorize' || s.phase === 'play' || s.phase === 'thiefGuess';
    const wasUp = s.phase === 'play' && s.turn && s.turn.pid === playerId;
    if (wasUp) screwDropPending(room, true);
    if (midRound && g.hands[playerId]) {
      g.deck = g.hands[playerId].map(e => e.card).concat(g.deck);
      delete g.hands[playerId];
    }
    delete g.seen[playerId];
    delete g.memorize[playerId];
    s.order.splice(seat, 1);
    if (seat < g.start) g.start--;
    if (g.start >= s.order.length) g.start = 0;
    if (s.teams) s.teams = s.teams.map(t => t.filter(id => id !== playerId));
    s.finalLeft = (s.finalLeft || []).filter(id => id !== playerId);
    s.exposed = (s.exposed || []).filter(id => id !== playerId);
    s.ready = (s.ready || []).filter(id => id !== playerId);
    if (s.phase === 'gameover') return;
    if (s.order.length < 2 || (s.teams && s.teams.some(t => !t.length))) {
      if (s.turn) screwDropPending(room, false);
      screwGameOver(room);
      return;
    }
    if (s.phase === 'memorize') {
      if (screwSeated(room).every(id => s.ready.indexOf(id) !== -1)) screwBeginPlay(room);
      return;
    }
    if (s.phase === 'thiefGuess') {
      if (g.votes) delete g.votes[playerId];
      if (s.thiefVote) s.thiefVote.voted = s.thiefVote.voted.filter(id => id !== playerId);
      if (s.caller === playerId) s.caller = null;     // scored without a caller, as in play
      if (s.thiefVote && screwSeated(room).every(id => s.thiefVote.voted.indexOf(id) !== -1)) screwCloseVote(room);
      return;
    }
    if (s.phase !== 'play') return;
    if (s.caller === playerId) {
      // Nobody to protect: the round is over, with no caller.
      s.caller = null;
      screwEndRound(room);
      return;
    }
    if (wasUp) {
      // The seat they left is now the next player's: walk on from the one before.
      // Leaving from the round's first seat is no new lap.
      if (seat === g.start) s.lap--;
      screwPassTurn(room, (seat - 1 + s.order.length) % s.order.length, false);
      return;
    }
    if (s.turn && s.turn.stage === 'boom' && s.boom) {
      // A player بوم waits on: dropped; with the last one waiting gone, the cards go up.
      s.boom.waiting = s.boom.waiting.filter(id => id !== playerId);
      s.boom.picked = s.boom.picked.filter(id => id !== playerId);
      if (g.boomPicks) delete g.boomPicks[playerId];
      if (!s.boom.waiting.length) screwBoomResolve(room);
      return;
    }
    if (s.turn && s.turn.stage === 'steal' && g.look && g.look.target === playerId) {
      // The card being stolen has gone with its hand: nothing to swap, the turn ends.
      screwForget(room, s.turn.pid);
      screwTurnDone(room);
      return;
    }
    if (s.turn && s.turn.stage === 'seeSwap' && g.look && g.look.target === playerId) {
      // The card being looked at has gone with its hand: nothing to swap.
      screwForget(room, s.turn.pid);
      screwEvent(room, 'seeSwap', { pid: s.turn.pid, target: playerId, slot: g.look.slot, swapped: false });
      screwTurnDone(room);
    }
  });
};
