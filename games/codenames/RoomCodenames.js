// Bundled into the rooms server after RoomGames.js (FILES in rooms-worker/build.mjs), whose helpers it uses.
/* ==========================================================================
   أسماء الرموز — CODENAMES
   The board is public; the key card goes only to the two spymasters. That
   split is the game, and it is why it needs separate devices.
   ========================================================================== */
const CODENAMES_LAYOUT = { first: 9, second: 8, neutral: 7, assassin: 1 };  // 25
// Seconds a spymaster has for the clue, and the team again for its guesses. 0: no clock.
// CODENAMES_TIMERS is in rooms/RoomShared.js (the lobby offers them).
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
    if (!t || t.role !== 'spymaster') throw new Error('القائد بس اللي يقول التلميح');
    if (t.team !== s.turn) throw new Error('مش دور فريقك');
    if (s.winner) throw new Error('انتهت اللعبة');
    if (s.clue) throw new Error('التلميح اتقال خلاص');

    const word = String(payload.word || '').trim().slice(0, 24);
    if (!word) throw new Error('اكتب التلميح');
    // A board word, or a clue inside one or around one (idea 547): «شجر» can't point at «شجرة».
    if (s.board.some(c => !c.revealed && codenamesClueClash(word, c.word))) {
      throw new Error('التلميح ما ينفعش يكون كلمة على اللوحة أو جزء منها');
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
    if (!t || t.role !== 'operative' || t.team !== s.turn) throw new Error('مش دور فريقك');
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
    // Picked on a turn that has since passed: the screen's pick would be the other team's guess.
    if (staleTap(payload, 'turn', s.turn)) return;
    // A big screen guesses for whichever team is up: the team gathered at the TV.
    const t = isRoomScreen(room, playerId) ? { team: s.turn, role: 'operative' } : teamOf(playerId);
    if (!t || t.role !== 'operative') throw new Error('اللاعبون فقط يخمنون');
    if (t.team !== s.turn) throw new Error('مش دور فريقك');
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
    if (!t || t.team !== s.turn) throw new Error('مش دور فريقك');
    if (s.winner) throw new Error('انتهت اللعبة');
    // Passing before the clue is given would let a team skip its whole turn.
    if (!s.clue) throw new Error('انتظر تلميح القائد');
    endCodenamesTurn(room);
    return;
  }

  if (action === 'passTurn') {
    // The host moves the game on when a team is stuck: a spymaster who went
    // quiet before the clue, or a team that won't pass.
    requireMoveOn(room, playerId);
    if (room.phase !== 'playing' || s.winner) return;
    // The team the host meant to pass: a double tap would otherwise pass the
    // other team's turn straight back.
    if (staleTap(payload, 'turn', s.turn)) return;
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
    // A finished game waits for «لعبة أخرى» to bank it on the night (the lobby holds no winner).
    if (s.winner) room._restartNight = { game: room.game, board: null, roster: s.roster || null, winner: s.winner };
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
