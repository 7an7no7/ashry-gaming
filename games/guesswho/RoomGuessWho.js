/* ============================================================================
   خمّن مين — GUESS WHO in rooms: two duel, the room watches, winner stays on
   ----------------------------------------------------------------------------
   Bundled into the Worker after RoomDuels.js (FILES in rooms-worker/build.mjs),
   whose line and seats it uses: duelSeatNext, duelEnd, duelWaiting. The faces
   and the questions are GuessWho.js, shared with the page.

   The owner's rules (22 Sep 2026, asked one at a time): a room only, two
   play and everyone else watches on their phone or the TV, the winner stays
   on. Each player has a secret face on their own phone; a turn is one
   question or one guess, never both. A wrong guess loses the game (a
   switch: or only the turn, that face going down). The secret face is dealt
   at random (a switch: each picks their own). 16, 24 or 30 faces; a turn
   clock off, 30 or 60 seconds, passing the turn.

   The owner, 29 Sep 2026: no list of questions ("the player always thinks
   about what he wants to ask") and nothing automatic ("they don't know what
   we will answer"). A question is typed or asked out loud; the other player
   taps yes or no, taken as given; the asker puts the faces down by hand and
   ends the turn. No computer players: they could only ask from a list. The
   clock never answers for anyone: a question left unanswered is dropped and
   the turn passes.

   What is hidden: the two secret faces, in room._gw.secret (never
   projected); each seated phone gets its own in room.secrets[pid].face.
   Everything else is public - the board, which faces each player has put
   down, every question and answer - as it is on a real table.

   shared, beside the duel's fields (seats, line, champ, result, scores…):
     phase     'pick' | 'play' | 'over'
     settings  { size, pick: 'random' | 'choose', wrong: 'lose' | 'turn', turnClock }
     faces     the board (GuessWho.js)
     down      [seat 0's faces down, seat 1's]
     picked    [bool, bool] while each picks their face
     turn      the seat up · stage  'ask' | 'answer' | 'flip'
     turnSeq   raised at every turn and stage; moves carry it as `seq`
     q         the last question or guess { seat, kind: 'loud' | 'typed' | 'guess',
               text, answer (null until answered), face, right }
     log       the last questions and guesses, newest last (and { kind: 'undo' }, an answer taken back)
     endsAt    the turn clock · reveal  [seat 0's face, seat 1's], once over

   «فريق ضد فريق» (teams; the owner, 2 Oct 2026): a lobby switch from GW_TEAMS_MIN people,
   off by default (shared.lobby.teams, the host's `gwTeams { on }`); everyone picks a side on
   their own phone (`side { side }`, shared.lobby.sides { pid: 0 | 1 }), and Start needs at
   least one on each side (lopsided is fine; anyone who hasn't picked joins the smaller side).
   Then a "seat" is a team: settings.teams, teams [[red ids], [blue ids]], down [red's board,
   blue's], turn the team up - so the stages above are the same. Anyone on the team up asks
   and flips (one board for the team, its flips on every phone of the team at once); anyone
   on the other team answers, the first tap counting (q.by, the log's by / byName); only the
   one who answered can take it back. The final guess needs two phones: one proposes a face
   (`propose { face, seq }`), a second teammate taps «متفقين» (`agree { n, seq }`) and only then
   is it a guess; the proposer cancels (`unpropose { n }`, a teammate's «لأ» too), and it lapses
   after GW_AGREE_SECS. A team of one sends it alone. The proposed face is the team's own
   (room._gw.propose, each member's secrets[pid].propose); shared.propose says only who and
   until when. The secret face is always dealt in teams (one per team, room._gw.secret by team,
   each member's secrets[pid].face). No line and no champion: the winning team's members score
   a win each (scores, so the night shares first place between them) and tw counts the teams'
   wins; result { team: true, winner, reason, winners, losers }. «اللعبة الجاية» keeps the sides
   (a latecomer joins the smaller one; `side` in 'over' moves you for the next game) and the
   other team starts (first). Which faces a team put down is public, as in the two-player way
   (the TV and anyone watching see both boards); a team's phones draw only their own board.
   ========================================================================= */
const GW_GRACE_MS = 1500;       // the server's clock acts this long after the phones'
const GW_LOG_MAX = 8;
const GW_TYPED_MAX = 80;        // a typed question, in characters

const gwTeamsOn = (s) => !!(s && s.settings && s.settings.teams && Array.isArray(s.teams));
/** The team (0 red, 1 blue) a player is on in the teams' way, or -1. */
const gwTeamOf = (s, pid) => (((s.teams || [])[0] || []).indexOf(pid) !== -1 ? 0 : ((((s.teams || [])[1] || []).indexOf(pid) !== -1) ? 1 : -1));
/** In the teams' way a "seat" is a team: the turn, the boards and the secret faces are each team's. */
const gwSeatOf = (s, pid) => (gwTeamsOn(s) ? gwTeamOf(s, pid) : (s.seats || []).indexOf(pid));
/** The members of team k still in the room. */
const gwTeamHere = (room, k) => (((room.shared.teams || [])[k]) || []).filter(id => room.players.some(p => p.id === id));

const gwOptions = (payload, prev) => {
  const p = payload || {};
  const was = prev || {};
  const pickOf = (v) => (v === 'choose' || v === 'random' ? v : null);
  const wrongOf = (v) => (v === 'lose' || v === 'turn' ? v : null);
  const teams = p.teams === true;
  return {
    size: gwSize(p.size !== undefined ? p.size : was.size),
    // In teams the secret face is always dealt (decided here): one face a team, nobody to pick it alone.
    pick: teams ? 'random' : (pickOf(p.pick) || pickOf(was.pick) || 'random'),
    teams: teams,
    wrong: wrongOf(p.wrong) || wrongOf(was.wrong) || 'lose',
    turnClock: GW_CLOCKS.indexOf(Number(p.turnClock)) !== -1 ? Number(p.turnClock)
      : (GW_CLOCKS.indexOf(Number(was.turnClock)) !== -1 ? Number(was.turnClock) : 0)
  };
};

const gwLog = (s, entry) => {
  s.log = (s.log || []).concat([entry]).slice(-GW_LOG_MAX);
  // The log keeps its last few entries; this number keeps counting, so a phone plays each entry's moment once.
  s.logSeq = (s.logSeq || 0) + 1;
};

// With the turn clock on, picking a secret face has a clock of its own (a face for whoever hasn't picked).
const GW_PICK_SECS = 60;

const gwStartClock = (room) => {
  const s = room.shared;
  const secs = (s.settings || {}).turnClock || 0;
  const len = s.phase === 'pick' ? GW_PICK_SECS : secs;
  s.endsAt = (s.phase === 'play' || s.phase === 'pick') && secs ? Date.now() + len * 1000 : null;
};

/** The secret faces reach their own phones only. */
const gwWriteSecrets = (room) => {
  const s = room.shared;
  const g = room._gw || { secret: [null, null] };
  room.secrets = {};
  if (gwTeamsOn(s)) {
    // Each member of a team holds the team's face, and the face a teammate proposes to guess.
    [0, 1].forEach(k => gwTeamHere(room, k).forEach(pid => {
      if (typeof g.secret[k] !== 'number') return;
      room.secrets[pid] = { face: g.secret[k] };
      if (g.propose && g.propose.team === k) room.secrets[pid].propose = g.propose.face;
    }));
    return;
  }
  (s.seats || []).forEach((pid, seat) => {
    if (typeof g.secret[seat] === 'number') room.secrets[pid] = { face: g.secret[seat] };
  });
};

/** Both faces are chosen: the first to move asks. */
const gwBeginPlay = (room) => {
  const s = room.shared;
  s.phase = 'play';
  room.phase = 'play';
  s.picked = null;
  s.turn = gwTeamsOn(s) ? (s.first || 0) : 0;
  s.stage = 'ask';
  s.turnSeq = (s.turnSeq || 0) + 1;
  gwStartClock(room);
};

/** A fresh board for the seats just set. */
const gwDeal = (room) => {
  const s = room.shared;
  const faces = gwDealBoard(s.settings.size);
  s.faces = faces;
  s.down = [[], []];
  s.q = null;
  s.log = [];
  s.reveal = null;
  s.asks = null;
  s.result = null;
  s.turn = 0;
  s.stage = null;
  s.endsAt = null;
  s.propose = null;
  s.roster = duelHere(room);
  s.turnSeq = (s.turnSeq || 0) + 1;
  room._gw = { secret: [null, null], propose: null, asks: [[], []] };
  if (s.settings.pick === 'choose') {
    s.phase = 'pick';
    room.phase = 'play';
    s.picked = [false, false];
    gwStartClock(room);
  } else {
    const a = Math.floor(Math.random() * faces.length);
    const b = Math.floor(Math.random() * faces.length);
    room._gw.secret = [a, b];
    gwBeginPlay(room);
  }
  gwWriteSecrets(room);
};

/*
 * «أحسن سؤال» (the owner's pick of 7 Oct 2026, 845): every answered question of a game, with how
 * many faces the asker put down on it (counted when the turn moves on: faces down now that weren't
 * when the answer came, one put back up taking one off). Kept in room._gw.asks by seat while the
 * game is on (the questions are public already, the counts only matter at the end) and published
 * at the end as shared.asks [seat 0's, seat 1's]: [{ kind, text, answer, n }]; the TV replays the
 * winner's and crowns the one that put down the most.
 */
const GW_ASKS_MAX = 40;
const gwAskOpen = (room, seat, q, yes) => {
  const g = room._gw;
  if (!g) return;
  g.asks = g.asks || [[], []];
  const list = g.asks[seat] || (g.asks[seat] = []);
  if (list.length >= GW_ASKS_MAX) return;
  list.push({ kind: q.kind === 'typed' ? 'typed' : 'loud', text: q.kind === 'typed' ? (q.text || '') : '', answer: !!yes,
    before: (room.shared.down[seat] || []).slice(), n: null });
};
/** The asker's turn moves on (or the game ends) while they were putting faces down: count them. */
const gwAskClose = (room) => {
  const s = room.shared;
  const g = room._gw;
  if (!g || !g.asks || s.stage !== 'flip' || typeof s.turn !== 'number') return;
  const list = g.asks[s.turn] || [];
  const last = list[list.length - 1];
  if (!last || last.n !== null) return;
  last.n = (s.down[s.turn] || []).filter(i => last.before.indexOf(i) === -1).length;
};
const gwAsksPublish = (room) => {
  const g = room._gw || {};
  room.shared.asks = [0, 1].map(k => ((g.asks || [])[k] || []).map(a => ({ kind: a.kind, text: a.text, answer: a.answer, n: a.n === null ? 0 : a.n })));
};

/** The game is over: the duel's line moves on, and both faces are shown. */
const gwEnd = (room, winner, reason) => {
  const s = room.shared;
  gwAskClose(room);
  gwAsksPublish(room);
  gwDropPropose(room);
  if (gwTeamsOn(s)) gwTeamEnd(room, winner, reason); else duelEnd(room, winner, reason);
  s.stage = null;
  s.endsAt = null;
  s.reveal = ((room._gw || {}).secret || [null, null]).slice();
};

const gwNextTurn = (room) => {
  const s = room.shared;
  gwAskClose(room);
  gwDropPropose(room);
  s.turn = 1 - s.turn;
  s.stage = 'ask';
  s.turnSeq = (s.turnSeq || 0) + 1;
  gwStartClock(room);
};

/** The question is out: the other player is up, with the clock started again for them. */
const gwWaitAnswer = (room) => {
  const s = room.shared;
  s.stage = 'answer';
  s.turnSeq = (s.turnSeq || 0) + 1;
  gwStartClock(room);
};

/** The answer to the question waiting, taken as given: the asker puts the faces down by hand, then ends the turn. */
const gwTakeAnswer = (room, yes, by) => {
  const s = room.shared;
  const q = s.q;
  // What «غلطت» puts back: the asker's board as it was when the answer came (server-only), and who answered.
  room._gwUndo = { down: (s.down[s.turn] || []).slice(), by: by || null };
  s.q = Object.assign({}, q, { answer: yes }, gwTeamsOn(s) ? { answerBy: by, answerByName: roomPlayerName(room, by) } : {});
  const entry = q.kind === 'typed' ? { seat: q.seat, kind: 'typed', text: q.text, answer: yes } : { seat: q.seat, kind: 'loud', answer: yes };
  if (gwTeamsOn(s)) { entry.by = q.by; entry.byName = q.byName; }
  gwLog(s, entry);
  gwAskOpen(room, s.turn, q, yes);
  s.stage = 'flip';
  s.turnSeq = (s.turnSeq || 0) + 1;
  room._gwUndo.turnSeq = s.turnSeq;
  room._gwUndo.logSeq = s.logSeq;
  gwStartClock(room);
};

/**
 * «غلطت» (the review of 1 Oct 2026): the one who answered tapped the wrong one. While the
 * asker is still putting faces down, the answer is taken back: the faces they put down on it
 * stand up again, the answer leaves the log, and the question waits for its answer again.
 */
const gwUnanswer = (room) => {
  const s = room.shared;
  const u = room._gwUndo;
  room._gwUndo = null;
  s.down[s.turn] = u.down.slice();
  // «غلطت»: the answer taken back takes its question out of «أحسن سؤال» too.
  const asks = room._gw && room._gw.asks && room._gw.asks[s.turn];
  if (asks && asks.length && asks[asks.length - 1].n === null) asks.pop();
  const log = (s.log || []).slice();
  if (log.length && (log[log.length - 1].kind === 'loud' || log[log.length - 1].kind === 'typed')) log.pop();
  s.log = log;
  gwLog(s, Object.assign({ seat: 1 - s.turn, kind: 'undo' }, gwTeamsOn(s) && u.by ? { by: u.by, byName: roomPlayerName(room, u.by) } : {}));
  s.q = Object.assign({}, s.q, { answer: null, answerBy: undefined, answerByName: undefined });
  gwWaitAnswer(room);
};

/** A typed question, cleaned: one line, no control characters, at most GW_TYPED_MAX. */
const gwCleanTyped = (text) => String(text || '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, GW_TYPED_MAX);

/** A guess at the other player's face. */
const gwGuess = (room, seat, face, by) => {
  const s = room.shared;
  if (!(face >= 0 && face < s.faces.length)) throw new Error('وش غير معروف');
  const right = room._gw.secret[1 - seat] === face;
  s.q = { seat: seat, kind: 'guess', face: face, right: right };
  const entry = { seat: seat, kind: 'guess', face: face, right: right };
  if (gwTeamsOn(s) && by) { entry.by = by; entry.byName = roomPlayerName(room, by); }
  gwLog(s, entry);
  if (right) { gwEnd(room, seat, 'guess'); return; }
  if (s.settings.wrong === 'lose') { gwEnd(room, 1 - seat, 'wrong'); return; }
  if (s.down[seat].indexOf(face) === -1) s.down[seat] = s.down[seat].concat([face]);
  gwNextTurn(room);
};

/** The clock, or the host for a phone that went quiet: the turn passes, with no question. */
const gwAuto = (room, why) => {
  const s = room.shared;
  if (s.phase === 'pick') {
    // Whoever hasn't picked gets a face at random.
    [0, 1].forEach(seat => {
      if (!s.picked[seat]) { room._gw.secret[seat] = Math.floor(Math.random() * s.faces.length); s.picked[seat] = true; }
    });
    gwBeginPlay(room);
    gwWriteSecrets(room);
    return;
  }
  if (s.phase !== 'play') return;
  gwDropPropose(room);
  // Nobody answers for anyone: a question left unanswered is dropped. Who was waited on: the one answering, or the one up (asking, or putting faces down).
  const answering = s.stage === 'answer';
  if (answering) s.q = null;
  gwLog(s, { seat: answering ? 1 - s.turn : s.turn, kind: 'skip', why: why, stage: s.stage || 'ask' });
  gwNextTurn(room);
};

/* --- «فريق ضد فريق»: the teams' way (the owner, 2 Oct 2026) ----------------------- */

/** The lobby's teams switch and the sides people picked: { teams, sides { pid: 0 | 1 } }. */
const gwLobby = (room) => {
  room.shared = room.shared || {};
  const lobby = room.shared.lobby || (room.shared.lobby = {});
  if (!lobby.sides || typeof lobby.sides !== 'object') lobby.sides = {};
  return lobby;
};

/** The sides for a game: whoever picked keeps theirs, anyone here who hasn't joins the smaller one. */
const gwFitTeams = (room, teams) => {
  const here = duelHere(room);
  const out = [0, 1].map(k => ((teams || [])[k] || []).filter((id, i, a) => here.indexOf(id) !== -1 && a.indexOf(id) === i));
  out[1] = out[1].filter(id => out[0].indexOf(id) === -1);
  here.forEach(id => { if (out[0].indexOf(id) === -1 && out[1].indexOf(id) === -1) out[out[0].length <= out[1].length ? 0 : 1].push(id); });
  return out;
};

/** A team's proposal (the final guess before a second teammate agrees) is dropped: the turn moved on, it was cancelled, or it lapsed. */
const gwDropPropose = (room) => {
  const s = room.shared || {};
  const had = !!(room._gw && room._gw.propose) || !!s.propose;
  if (room._gw) room._gw.propose = null;
  s.propose = null;
  if (had) gwWriteSecrets(room);
};

/** The game is over in the teams' way: each member of the winning team still here scores a win. */
const gwTeamEnd = (room, winner, reason) => {
  const s = room.shared;
  const winners = ((s.teams || [])[winner] || []).slice();
  const losers = ((s.teams || [])[1 - winner] || []).slice();
  winners.forEach(id => { if (room.players.some(p => p.id === id)) addScore(room, id, 1); });
  s.tw = (Array.isArray(s.tw) ? s.tw : [0, 0]).slice();
  s.tw[winner] = (s.tw[winner] || 0) + 1;
  s.result = { team: true, winner: winner, reason: reason, winners: winners, losers: losers };
  s.board = scoreboardOf(room);
  s.phase = 'over';
  room.phase = 'over';
};

const gwNewTeamGame = (room, playerId, payload) => {
  requireHost(room, playerId);
  const here = duelHere(room);
  if (here.length < GW_TEAMS_MIN) throw new Error('فريق ضد فريق محتاج ' + GW_TEAMS_MIN + ' على الأقل');
  const prev = room.shared || {};
  const sides = gwLobby(room).sides;
  const picked = [0, 1].map(k => here.filter(id => sides[id] === k));
  if (!picked[0].length || !picked[1].length) throw new Error('محتاجين واحد على الأقل في كل فريق');
  room.shared = {
    round: 1,
    teams: gwFitTeams(room, picked),
    first: Math.random() < 0.5 ? 0 : 1,
    tw: [0, 0],
    scores: {},
    board: [],
    settings: gwOptions(Object.assign({}, payload, { teams: true }), prev.settings),
    turnSeq: prev.turnSeq || 0
  };
  gwDeal(room);
  room.shared.board = scoreboardOf(room);
};

/** A teammate proposes the final guess; a team of one (here) sends it at once. */
const gwPropose = (room, playerId, seat, face) => {
  const s = room.shared;
  if (!(face >= 0 && face < s.faces.length)) throw new Error('وش غير معروف');
  if (room._gw.propose) return;   // one at a time: the one waiting is agreed to or cancelled first
  if (gwTeamHere(room, seat).length < 2) { gwGuess(room, seat, face, playerId); return; }
  s.proposeN = (s.proposeN || 0) + 1;
  const endsAt = Date.now() + GW_AGREE_SECS * 1000;
  room._gw.propose = { team: seat, by: playerId, face: face, n: s.proposeN, endsAt: endsAt };
  s.propose = { team: seat, by: playerId, byName: roomPlayerName(room, playerId), n: s.proposeN, endsAt: endsAt };
  gwWriteSecrets(room);
};

const gwNewRoomGame = (room, playerId, payload) => {
  requireHost(room, playerId);
  if (room.players.length < DUEL_MIN_PLAYERS) throw new Error('تحتاج لاعبين على الأقل');
  const prev = room.shared || {};
  const order = shuffled(duelHere(room));
  room.shared = {
    round: 1,
    seats: [order[0], order[1]],
    seatNames: [roomPlayerName(room, order[0]), roomPlayerName(room, order[1])],
    line: order.slice(2),
    champ: null,
    prev: null,
    streak: null,
    scores: {},
    board: [],
    settings: gwOptions(payload, prev.settings),
    turnSeq: prev.turnSeq || 0
  };
  gwDeal(room);
  room.shared.board = scoreboardOf(room);
};

const guessWhoAction = (room, playerId, action, payload) => {
  const p = payload || {};
  // «فريق ضد فريق»: the lobby's switch and sides, and a start with it on - before the tournament,
  // whose own start the same lobby could ask for (the teams' way wins; its phones hide that choice).
  if (action === 'gwTeams') {
    requireHost(room, playerId);
    if (room.phase !== 'lobby') return;
    gwLobby(room).teams = p.on === true;
    return;
  }
  if (action === 'side') {
    const k = Number(p.side);
    if (k !== 0 && k !== 1) throw new Error('فريق غير معروف');
    if (!room.players.some(x => x.id === playerId)) throw new Error('انت شاشة، مش لاعب');
    if (room.phase === 'lobby') {
      if (!gwLobby(room).teams) return;
      gwLobby(room).sides[playerId] = k;
      return;
    }
    // Between games in the teams' way: you move for the next one. Kept apart from
    // s.teams, which says who played this one (the night's points read it).
    const sv = room.shared || {};
    if (!gwTeamsOn(sv) || sv.phase !== 'over') return;
    const base = sv.nextTeams || sv.teams;
    sv.nextTeams = [0, 1].map(j => (base[j] || []).filter(id => id !== playerId));
    sv.nextTeams[k].push(playerId);
    return;
  }
  if (action === 'start' && room.phase === 'lobby' && gwLobby(room).teams) { gwNewTeamGame(room, playerId, p); return; }
  // A knockout tournament (RoomTournament.js) runs these same rules, one board per match.
  if (tourAction(room, playerId, action, payload, 'guesswho')) return;
  if (action === 'start') { gwNewRoomGame(room, playerId, p); return; }

  const s = room.shared;
  if (!s || !s.phase || !Array.isArray(s.faces)) throw new Error('اللعبة لم تبدأ بعد');

  if (action === 'nextRound') {
    if (s.phase !== 'over') return;
    if (!room.players.some(x => x.id === playerId) && room.hostId !== playerId) throw new Error('لست في الغرفة');
    if (gwTeamsOn(s)) {
      // The same sides (a latecomer on the smaller one, a leaver off), the other team starting.
      const teams = gwFitTeams(room, s.nextTeams || s.teams);
      if (!teams[0].length || !teams[1].length) throw new Error('محتاجين واحد على الأقل في كل فريق');
      s.teams = teams;
      delete s.nextTeams;
      s.first = 1 - (s.first || 0);
      s.prev = s.result;
      s.round = (s.round || 1) + 1;
      gwDeal(room);
      s.board = scoreboardOf(room);
      return;
    }
    duelSeatNext(room);
    s.prev = s.result;
    s.round = (s.round || 1) + 1;
    gwDeal(room);
    return;
  }

  if (action === 'skipTurn') {
    requireMoveOn(room, playerId);
    if ((s.phase !== 'play' && s.phase !== 'pick') || staleTap(p, 'seq', s.turnSeq)) return;
    gwAuto(room, 'host');
    return;
  }

  const seat = gwSeatOf(s, playerId);

  if (action === 'flip') {
    // Your own board, any time in play: a face down or back up. `down` says which, so a double tap is not two flips.
    if (s.phase !== 'play') return;
    if (seat === -1) throw new Error('انت بتتفرج دلوقتي');
    const face = Number(p.face);
    if (!(face >= 0 && face < s.faces.length)) throw new Error('وش غير معروف');
    const isDown = s.down[seat].indexOf(face) !== -1;
    const want = typeof p.down === 'boolean' ? p.down : !isDown;
    if (want && !isDown) s.down[seat] = s.down[seat].concat([face]);
    if (!want && isDown) s.down[seat] = s.down[seat].filter(i => i !== face);
    return;
  }

  if (action === 'pick') {
    if (s.phase !== 'pick') return;
    if (seat === -1) throw new Error('انت بتتفرج دلوقتي');
    if (s.picked[seat]) return;
    const face = Number(p.face);
    if (!(face >= 0 && face < s.faces.length)) throw new Error('وش غير معروف');
    room._gw.secret[seat] = face;
    s.picked[seat] = true;
    s.turnSeq++;
    if (s.picked[0] && s.picked[1]) gwBeginPlay(room);
    gwWriteSecrets(room);
    return;
  }

  if (action === 'answer') {
    // The other player answers the question waiting, out loud or typed: taken as given.
    if (s.phase !== 'play' || s.stage !== 'answer' || !s.q || staleTap(p, 'seq', s.turnSeq)) return;
    if (seat === -1 || seat === s.turn) throw new Error('الإجابة على اللي اتسأل');
    // In teams anyone on the other team answers: the first tap counts (the stage has moved on for the second).
    gwTakeAnswer(room, !!p.yes, playerId);
    return;
  }

  if (action === 'unanswer') {
    // Only the answer just given, before the asker is done: named by the turn's seq and the log's.
    if (s.phase !== 'play' || s.stage !== 'flip' || !s.q || s.q.kind === 'guess') return;
    if (staleTap(p, 'seq', s.turnSeq) || staleTap(p, 'log', s.logSeq)) return;
    if (seat === -1 || seat === s.turn) throw new Error('اللي جاوب بس يقدر يرجّع إجابته');
    const u = room._gwUndo;
    if (!u || u.turnSeq !== s.turnSeq || u.logSeq !== s.logSeq) return;
    // In teams only the one who tapped it takes it back.
    if (gwTeamsOn(s) && u.by && u.by !== playerId) throw new Error('اللي جاوب بس يقدر يرجّع إجابته');
    gwUnanswer(room);
    return;
  }

  if (action === 'propose' || action === 'agree' || action === 'unpropose') {
    // The teams' final guess: one proposes, a second teammate agrees, and then it is a guess.
    if (!gwTeamsOn(s) || s.phase !== 'play') return;
    if (seat === -1) throw new Error('انت بتتفرج دلوقتي');
    if (action === 'unpropose') {
      // The proposer takes it back, or a teammate says «لأ».
      const pr = room._gw.propose;
      if (!pr || pr.team !== seat || staleTap(p, 'n', pr.n)) return;
      gwDropPropose(room);
      return;
    }
    if (staleTap(p, 'seq', s.turnSeq)) return;
    if (seat !== s.turn) throw new Error('مش دور فريقك');
    if (s.stage !== 'ask') return;
    if (action === 'propose') { gwPropose(room, playerId, seat, Number(p.face)); return; }
    const pr = room._gw.propose;
    if (!pr || pr.team !== seat || staleTap(p, 'n', pr.n)) return;
    if (pr.by === playerId) throw new Error('محتاج حد تاني من فريقك يوافق');
    gwGuess(room, seat, pr.face, pr.by);
    return;
  }

  if (action === 'loud' || action === 'typed' || action === 'guess' || action === 'done') {
    if (s.phase !== 'play' || staleTap(p, 'seq', s.turnSeq)) return;
    if (seat === -1) throw new Error('انت بتتفرج دلوقتي، استنى دورك في الطابور');
    if (seat !== s.turn) throw new Error('مش دورك');
    if (action === 'done') {
      if (s.stage !== 'flip') return;
      gwNextTurn(room);
      return;
    }
    if (s.stage !== 'ask') return;
    if (action === 'guess') {
      // In teams a guess is proposed and agreed to (two phones), never sent by one tap.
      if (gwTeamsOn(s)) throw new Error('التخمين في الفرق محتاج اتنين يتفقوا');
      gwGuess(room, seat, Number(p.face));
      return;
    }
    // Asking instead: a guess half agreed is let go.
    gwDropPropose(room);
    // Out loud or typed: the other player answers on their phone.
    if (action === 'typed') {
      const text = gwCleanTyped(p.text);
      if (!text) throw new Error('اكتب السؤال');
      s.q = { seat: seat, kind: 'typed', text: text, answer: null };
    } else {
      s.q = { seat: seat, kind: 'loud', answer: null };
    }
    if (gwTeamsOn(s)) { s.q.by = playerId; s.q.byName = roomPlayerName(room, playerId); }
    gwWaitAnswer(room);
    return;
  }

  throw new Error('إجراء غير معروف');
};

/* --- the clock ------------------------------------------------------------------ */

const gwDeadline = (room) => {
  const s = room.shared || {};
  if (s.phase !== 'play' && s.phase !== 'pick') return null;
  // A team's proposal waiting for «متفقين» lapses on its own clock too.
  const at = [s.endsAt, s.propose && s.propose.endsAt].filter(x => typeof x === 'number' && x > 0);
  return at.length ? Math.min.apply(null, at) + GW_GRACE_MS : null;
};

const gwTimeout = (room, now) => {
  const s = room.shared || {};
  if (s.phase !== 'play' && s.phase !== 'pick') return false;
  let acted = false;
  // Everything due in one pass (a timeout that leaves its deadline in the past rests 30 s).
  if (s.propose && now >= s.propose.endsAt + GW_GRACE_MS) { gwDropPropose(room); acted = true; }
  if (s.endsAt && now >= s.endsAt + GW_GRACE_MS) { gwAuto(room, 'clock'); acted = true; }
  return acted;
};

/* --- someone leaves: a seated player loses by forfeit, as in the duels ----------- */

const gwPlayerLeft = (room, playerId) => {
  const s = room.shared;
  if (!s || !s.phase || !Array.isArray(s.faces)) return;
  if (gwTeamsOn(s)) {
    // The teams' way: a team left with nobody here loses by forfeit; else the game goes on without them.
    const live = s.phase === 'play' || s.phase === 'pick';
    // Their own proposal goes, and so does one their team can no longer agree to (one left here).
    const pr = room._gw && room._gw.propose;
    if (pr && (pr.by === playerId || gwTeamHere(room, pr.team).length < 2)) gwDropPropose(room);
    if (live) {
      const empty = [0, 1].find(k => gwTeamHere(room, k).length === 0);
      if (empty !== undefined) { gwEnd(room, 1 - empty, 'left'); return; }
      gwWriteSecrets(room);
    }
    s.board = scoreboardOf(room);
    return;
  }
  s.line = (s.line || []).filter(id => id !== playerId);
  if (s.streak && s.streak.id === playerId) s.streak = null;
  const seat = gwSeatOf(s, playerId);
  if ((s.phase === 'play' || s.phase === 'pick') && seat !== -1) {
    gwEnd(room, 1 - seat, 'left');
    return;
  }
  if (s.champ === playerId) s.champ = null;
  s.board = scoreboardOf(room);
};
