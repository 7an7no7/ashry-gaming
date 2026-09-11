/* ============================================================================
   ROOM GAME RULES
   ----------------------------------------------------------------------------
   One branch per game, all reached through applyRoomAction. The transport in
   Rooms.js never needs to know what any of these games are.

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

const applyRoomAction = (room, playerId, action, payload) => {
  // Room-level actions come first: they're about the group, not the game.
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
 * A category whose name carries 🔒 keeps its password in the first cell of the
 * column, and the single-device screen slices it off before drawing a word. The
 * room layer did not, so the password could be dealt as the secret word.
 */
const spyWords = (category) => {
  const words = (getSpyData()[String(category || '')] || []).slice();
  if (String(category).indexOf('🔒') !== -1) words.shift();
  return words;
};

/** Every unlocked category folded into one bank, read in a single fetch. */
const unlockedSpyWords = () => {
  const data = getSpyData();     // one spreadsheet read, not one per category
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

const codenamesAction = (room, playerId, action, payload) => {
  if (action === 'setTeam') {
    // Lobby only. Switching mid-game would hand someone the spymaster slot
    // without the key and leave the real spymaster unable to give clues.
    if (room.phase !== 'lobby') throw new Error('لا يمكن تغيير الفريق بعد بدء اللعبة');
    const team = payload.team === 'blue' ? 'blue' : 'red';
    const role = payload.role === 'spymaster' ? 'spymaster' : 'operative';
    room.shared.teams = room.shared.teams || {};

    if (role === 'spymaster') {
      const clash = Object.keys(room.shared.teams).find(id =>
        id !== playerId &&
        room.shared.teams[id].team === team &&
        room.shared.teams[id].role === 'spymaster');
      if (clash) throw new Error('يوجد قائد لهذا الفريق بالفعل');
    }
    room.shared.teams[playerId] = { team: team, role: role };
    return;
  }

  if (action === 'start') {
    requireHost(room, playerId);
    const teams = room.shared.teams || {};
    const of = (team, role) => room.players.filter(p =>
      teams[p.id] && teams[p.id].team === team && teams[p.id].role === role);

    if (!of('red', 'spymaster').length || !of('blue', 'spymaster').length) {
      throw new Error('كل فريق يحتاج قائداً');
    }
    if (!of('red', 'operative').length || !of('blue', 'operative').length) {
      throw new Error('كل فريق يحتاج لاعباً واحداً على الأقل');
    }

    const lang = payload.lang === 'en' ? 'en' : 'ar';
    const pool = shuffled(CODENAMES_WORDS[lang]).slice(0, 25);
    const startingTeam = Math.random() < 0.5 ? 'red' : 'blue';
    const other = startingTeam === 'red' ? 'blue' : 'red';

    const roles = []
      .concat(newArray(CODENAMES_LAYOUT.first, startingTeam))
      .concat(newArray(CODENAMES_LAYOUT.second, other))
      .concat(newArray(CODENAMES_LAYOUT.neutral, 'neutral'))
      .concat(newArray(CODENAMES_LAYOUT.assassin, 'assassin'));
    const key = shuffled(roles);

    room._key = key;
    room.shared.board = pool.map(w => ({ word: w, revealed: false }));
    room.shared.turn = startingTeam;
    room.shared.startingTeam = startingTeam;
    room.shared.lang = lang;
    room.shared.clue = null;
    room.shared.guessesLeft = 0;
    room.shared.remaining = {
      red: startingTeam === 'red' ? CODENAMES_LAYOUT.first : CODENAMES_LAYOUT.second,
      blue: startingTeam === 'blue' ? CODENAMES_LAYOUT.first : CODENAMES_LAYOUT.second
    };
    room.shared.winner = null;
    room.shared.log = [];

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
    const t = (room.shared.teams || {})[playerId];
    if (!t || t.role !== 'spymaster') throw new Error('القائد فقط يعطي التلميح');
    if (t.team !== room.shared.turn) throw new Error('ليس دور فريقك');
    if (room.shared.clue) throw new Error('التلميح معطى بالفعل');

    const word = String(payload.word || '').trim().slice(0, 24);
    const count = Math.max(0, Math.min(Number(payload.count) || 0, 9));
    if (!word) throw new Error('اكتب التلميح');

    room.shared.clue = { word: word, count: count, team: t.team };
    // The classic +1: a team may always risk one extra guess.
    room.shared.guessesLeft = count + 1;
    room.shared.log.push({ type: 'clue', team: t.team, word: word, count: count });
    return;
  }

  if (action === 'guess') {
    const t = (room.shared.teams || {})[playerId];
    if (!t || t.role !== 'operative') throw new Error('اللاعبون فقط يخمنون');
    if (t.team !== room.shared.turn) throw new Error('ليس دور فريقك');
    if (!room.shared.clue) throw new Error('انتظر تلميح القائد');
    if (room.shared.winner) throw new Error('انتهت اللعبة');

    const idx = Number(payload.index);
    const cell = room.shared.board[idx];
    if (!cell || cell.revealed) throw new Error('اختر بطاقة أخرى');

    const colour = room._key[idx];
    cell.revealed = true;
    cell.colour = colour;
    room.shared.log.push({ type: 'guess', team: t.team, word: cell.word, colour: colour });

    if (colour === 'assassin') {
      room.shared.winner = t.team === 'red' ? 'blue' : 'red';
      room.shared.endReason = 'assassin';
      room.phase = 'over';
      revealWholeKey(room);
      return;
    }

    if (colour === 'red' || colour === 'blue') {
      room.shared.remaining[colour] = Math.max(0, room.shared.remaining[colour] - 1);
      if (room.shared.remaining[colour] === 0) {
        room.shared.winner = colour;
        room.shared.endReason = 'cleared';
        room.phase = 'over';
        revealWholeKey(room);
        return;
      }
    }

    // A wrong card — neutral or the other team's — ends the turn immediately.
    if (colour !== t.team) {
      endCodenamesTurn(room);
      return;
    }

    room.shared.guessesLeft--;
    if (room.shared.guessesLeft <= 0) endCodenamesTurn(room);
    return;
  }

  if (action === 'endTurn') {
    const t = (room.shared.teams || {})[playerId];
    if (!t || t.team !== room.shared.turn) throw new Error('ليس دور فريقك');
    if (room.shared.winner) throw new Error('انتهت اللعبة');
    // Passing before the clue is given would let a team skip its whole turn.
    if (!room.shared.clue) throw new Error('انتظر تلميح القائد');
    endCodenamesTurn(room);
    return;
  }

  if (action === 'restart') {
    requireHost(room, playerId);
    room.phase = 'lobby';
    room.secrets = {};
    const teams = room.shared.teams || {};
    room.shared = { teams: teams };   // keep the sides people already picked
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

const endCodenamesTurn = (room) => {
  room.shared.turn = room.shared.turn === 'red' ? 'blue' : 'red';
  room.shared.clue = null;
  room.shared.guessesLeft = 0;
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
 * Pulls a prompt this room hasn't seen, reshuffling once a pool is exhausted.
 *
 * The history is kept per pool: indices into the Would You Rather list mean
 * nothing in the Most Likely To list, and sharing one list made switching games
 * skip prompts that had never been shown.
 */
const nextPrompt = (room, pool, poolKey) => {
  const key = poolKey || ('pool' + pool.length);
  room._used = room._used || {};
  // Older rooms may hold an array from before this was keyed.
  if (Array.isArray(room._used)) room._used = {};
  const used = room._used[key] || [];
  if (used.length >= pool.length) used.length = 0;

  let idx;
  let guard = 0;
  do {
    idx = Math.floor(Math.random() * pool.length);
  } while (used.indexOf(idx) !== -1 && guard++ < 200);

  used.push(idx);
  room._used[key] = used;
  return pool[idx];
};

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
   One player draws, everyone else types guesses. With no push channel the
   drawing cannot stream smoothly — viewers see it arrive in ~1.5s chunks, more
   like a fax than a live canvas. That is a real limitation and the game is
   designed around it: strokes are appended in batches, never re-sent, and the
   round is scored on who gets there first rather than on watching a line move.

   Coordinates are quantised to 0–255 and packed flat ([x,y,x,y,…]) so a full
   drawing stays inside the cache entry alongside the rest of the room.
   ========================================================================== */

const DRAW_MAX_POINTS = 2600;     // ~15KB of JSON; well inside the 100KB cache
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
    const s = room.shared;
    if (s.word) return;         // already revealed
    s.word = room._word;
    s.board = scoreboardOf(room);
    room.phase = 'result';
    return;
  }

  throw new Error('إجراء غير معروف');
};

/* ==========================================================================
   الفنان المزيف — A FAKE ARTIST GOES TO NEW YORK
   ========================================================================== */
const fakeArtistAction = (room, playerId, action, payload) => {
  const lang = (payload && payload.lang === 'en') ? 'en' : 'ar';

  if (action === 'start' || action === 'nextRound') {
    requireHost(room, playerId);
    if (room.players.length < 3) throw new Error('الحد الأدنى 3 لاعبين');

    const order = shuffled(room.players.map(p => p.id));
    const fakeId = order[Math.floor(Math.random() * order.length)];
    const word = nextPrompt(room, DRAW_WORDS[lang], 'draw_' + lang);

    room.secrets = {};
    order.forEach(id => {
      if (id === fakeId) {
        room.secrets[id] = { isFake: true };
      } else {
        room.secrets[id] = { isFake: false, word: word };
      }
    });

    room._word = word;
    room._fakeId = fakeId;

    const colors = {};
    order.forEach((id, i) => {
      colors[id] = DRAW_COLOURS[i % DRAW_COLOURS.length];
    });

    room.shared = {
      round: 1,
      totalRounds: 2,
      drawerOrder: order,
      turnIndex: 0,
      currentDrawerId: order[0],
      colors: colors,
      strokes: [],
      phase: 'drawing',
      lang: lang,
      roster: order
    };
    room.phase = 'play';
    return;
  }

  if (action === 'sendStroke') {
    const s = room.shared;
    if (s.phase !== 'drawing') throw new Error('ليس وقت الرسم');
    if (playerId !== s.currentDrawerId) throw new Error('ليس دورك في الرسم');

    const stroke = payload && payload.stroke;
    if (stroke && stroke.p && stroke.p.length >= 2) {
      stroke.c = s.colors[playerId] || '#111';
      stroke.w = 4;
      s.strokes.push(stroke);
    }

    s.turnIndex++;
    if (s.turnIndex >= s.drawerOrder.length) {
      s.turnIndex = 0;
      s.round++;
    }

    if (s.round > s.totalRounds) {
      s.phase = 'voting';
      const options = s.drawerOrder.map(id => {
        const p = room.players.find(x => x.id === id);
        return { id: id, label: p ? p.name : id };
      });
      openVote(room, options);
    } else {
      s.currentDrawerId = s.drawerOrder[s.turnIndex];
    }
    return;
  }

  if (action === 'vote') {
    castVote(room, playerId, String(payload.option || ''));
    return;
  }

  if (action === 'closeVote') {
    requireHost(room, playerId);
    closeVote(room);
    const s = room.shared;
    s.phase = 'results';

    const top = s.vote && s.vote.results && s.vote.results[0];
    const caught = top && top.id === room._fakeId && top.count > 0;
    s.fakeCaught = caught;
    s.fakeId = room._fakeId;
    s.secretWord = room._word;
    return;
  }

  if (action === 'fakeGuess') {
    if (playerId !== room._fakeId) throw new Error('الفنان المزيف فقط');
    const guess = String((payload && payload.guess) || '').trim();
    const correct = room._word;
    const won = normaliseClue(guess) === normaliseClue(correct);
    room.shared.fakeStoleWin = won;
    room.shared.fakeGuessWord = guess;
    return;
  }

  throw new Error('إجراء غير معروف');
};

/* ==========================================================================
   على نفس الموجة — WAVELENGTH
   ========================================================================== */
const wavelengthAction = (room, playerId, action, payload) => {
  const lang = (payload && payload.lang === 'en') ? 'en' : 'ar';

  if (action === 'start' || action === 'nextRound') {
    requireHost(room, playerId);
    if (room.players.length < 2) throw new Error('الحد الأدنى لاعبان');

    const round = ((room.shared && room.shared.round) || 0) + 1;
    const scores = (room.shared && room.shared.scores) || { team: 0 };
    const psychicIdx = (round - 1) % room.players.length;
    const psychic = room.players[psychicIdx];

    const pairs = WAVELENGTH_PAIRS[lang] || WAVELENGTH_PAIRS.ar;
    const pair = pairs[Math.floor(Math.random() * pairs.length)];
    const target = Math.floor(Math.random() * 75) + 12;

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
      scores: scores,
      lang: lang,
      roster: room.players.map(p => p.id)
    };
    room.phase = 'play';
    return;
  }

  if (action === 'giveClue') {
    const s = room.shared;
    if (playerId !== s.psychicId) throw new Error('القارئ الذهني فقط');
    const clue = String((payload && payload.clue) || '').trim();
    if (!clue) throw new Error('اكتب تلميحاً');
    s.clue = clue;
    s.phase = 'dial';
    return;
  }

  if (action === 'setDial') {
    const s = room.shared;
    if (s.phase !== 'dial') throw new Error('المؤشر مقفل');
    s.dial = Math.max(0, Math.min(100, Math.round(Number(payload && payload.dial) || 50)));
    return;
  }

  if (action === 'lockDial') {
    requireHost(room, playerId);
    const s = room.shared;
    s.phase = 'results';
    s.target = room._target;

    const diff = Math.abs(s.dial - s.target);
    let pts = 0;
    if (diff <= 3) pts = 4;
    else if (diff <= 8) pts = 3;
    else if (diff <= 15) pts = 2;

    s.pointsEarned = pts;
    s.scores.team = (s.scores.team || 0) + pts;
    return;
  }

  throw new Error('إجراء غير معروف');
};

/* ==========================================================================
   مسابقة المعلومات — TRIVIA NIGHT
   ========================================================================== */
const triviaAction = (room, playerId, action, payload) => {
  const lang = (payload && payload.lang === 'en') ? 'en' : 'ar';

  if (action === 'start') {
    requireHost(room, playerId);
    const db = TRIVIA_QUESTIONS[lang] || TRIVIA_QUESTIONS.ar;
    const poolKey = 'trivia_' + lang;
    room._used = room._used || {};
    if (Array.isArray(room._used)) room._used = {};
    let used = room._used[poolKey] || [];
    if (used.length + 10 > db.length) used = [];

    const available = [];
    for (let i = 0; i < db.length; i++) {
      if (used.indexOf(i) === -1) available.push(i);
    }
    const chosen = shuffled(available).slice(0, 10);
    used = used.concat(chosen);
    room._used[poolKey] = used;

    room._deck = chosen.map(i => db[i]);
    room._qIdx = 0;
    room.shared = room.shared || {};
    room.shared.scores = {};
    room.players.forEach(p => { room.shared.scores[p.id] = 0; });
    dealTriviaQuestion(room, 0);
    return;
  }

  if (action === 'nextQuestion') {
    requireHost(room, playerId);
    room._qIdx++;
    if (room._qIdx >= room._deck.length) {
      room.shared.phase = 'gameover';
      room.shared.board = scoreboardOf(room);
      return;
    }
    dealTriviaQuestion(room, room._qIdx);
    return;
  }

  if (action === 'answer') {
    const s = room.shared;
    if (s.phase !== 'answering') throw new Error('انتهى وقت الإجابة');
    room._answers = room._answers || {};
    if (room._answers[playerId] !== undefined) return;

    const choiceIdx = Number(payload && payload.choice);
    const now = Date.now();
    room._answers[playerId] = {
      choice: choiceIdx,
      time: now
    };

    if (s.answered.indexOf(playerId) === -1) {
      s.answered.push(playerId);
    }

    if (s.answered.length >= room.players.length) {
      closeTriviaQuestion(room);
    }
    return;
  }

  if (action === 'closeQuestion') {
    requireHost(room, playerId);
    closeTriviaQuestion(room);
    return;
  }

  throw new Error('إجراء غير معروف');
};

const dealTriviaQuestion = (room, idx) => {
  const q = room._deck[idx];
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
    endsAt: Date.now() + 15000,
    scores: room.shared.scores || {},
    board: scoreboardOf(room),
    roster: room.players.map(p => p.id)
  };
  room.phase = 'play';
};

const closeTriviaQuestion = (room) => {
  const s = room.shared;
  if (s.phase !== 'answering') return;

  s.phase = 'results';
  s.correctAnswer = room._currentQ.answer;

  const choiceCounts = [0, 0, 0, 0];
  const qStart = room._qStart;

  room.players.forEach(p => {
    const ans = (room._answers || {})[p.id];
    if (ans) {
      choiceCounts[ans.choice] = (choiceCounts[ans.choice] || 0) + 1;
      if (ans.choice === s.correctAnswer) {
        const elapsed = Math.max(0, ans.time - qStart);
        const speedRatio = Math.max(0, (15000 - elapsed) / 15000);
        const pts = 1000 + Math.round(speedRatio * 500);
        addScore(room, p.id, pts);
      }
    }
  });

  s.choiceCounts = choiceCounts;
  s.board = scoreboardOf(room);
};
