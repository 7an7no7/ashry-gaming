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
   ========================================================================= */
const GW_GRACE_MS = 1500;       // the server's clock acts this long after the phones'
const GW_LOG_MAX = 8;
const GW_TYPED_MAX = 80;        // a typed question, in characters

const gwSeatOf = (s, pid) => (s.seats || []).indexOf(pid);

const gwOptions = (payload, prev) => {
  const p = payload || {};
  const was = prev || {};
  const pickOf = (v) => (v === 'choose' || v === 'random' ? v : null);
  const wrongOf = (v) => (v === 'lose' || v === 'turn' ? v : null);
  return {
    size: gwSize(p.size !== undefined ? p.size : was.size),
    pick: pickOf(p.pick) || pickOf(was.pick) || 'random',
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
  s.turn = 0;
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
  s.result = null;
  s.turn = 0;
  s.stage = null;
  s.endsAt = null;
  s.roster = duelHere(room);
  s.turnSeq = (s.turnSeq || 0) + 1;
  room._gw = { secret: [null, null] };
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

/** The game is over: the duel's line moves on, and both faces are shown. */
const gwEnd = (room, winner, reason) => {
  const s = room.shared;
  duelEnd(room, winner, reason);
  s.stage = null;
  s.endsAt = null;
  s.reveal = ((room._gw || {}).secret || [null, null]).slice();
};

const gwNextTurn = (room) => {
  const s = room.shared;
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
const gwTakeAnswer = (room, yes) => {
  const s = room.shared;
  const q = s.q;
  // What «غلطت» puts back: the asker's board as it was when the answer came (server-only).
  room._gwUndo = { down: (s.down[s.turn] || []).slice() };
  s.q = Object.assign({}, q, { answer: yes });
  gwLog(s, q.kind === 'typed' ? { seat: q.seat, kind: 'typed', text: q.text, answer: yes } : { seat: q.seat, kind: 'loud', answer: yes });
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
  const log = (s.log || []).slice();
  if (log.length && (log[log.length - 1].kind === 'loud' || log[log.length - 1].kind === 'typed')) log.pop();
  s.log = log;
  gwLog(s, { seat: 1 - s.turn, kind: 'undo' });
  s.q = Object.assign({}, s.q, { answer: null });
  gwWaitAnswer(room);
};

/** A typed question, cleaned: one line, no control characters, at most GW_TYPED_MAX. */
const gwCleanTyped = (text) => String(text || '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, GW_TYPED_MAX);

/** A guess at the other player's face. */
const gwGuess = (room, seat, face) => {
  const s = room.shared;
  if (!(face >= 0 && face < s.faces.length)) throw new Error('وش غير معروف');
  const right = room._gw.secret[1 - seat] === face;
  s.q = { seat: seat, kind: 'guess', face: face, right: right };
  gwLog(s, { seat: seat, kind: 'guess', face: face, right: right });
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
  // Nobody answers for anyone: a question left unanswered is dropped. Who was waited on: the one answering, or the one up (asking, or putting faces down).
  const answering = s.stage === 'answer';
  if (answering) s.q = null;
  gwLog(s, { seat: answering ? 1 - s.turn : s.turn, kind: 'skip', why: why, stage: s.stage || 'ask' });
  gwNextTurn(room);
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
  // A knockout tournament (RoomTournament.js) runs these same rules, one board per match.
  if (tourAction(room, playerId, action, payload, 'guesswho')) return;
  if (action === 'start') { gwNewRoomGame(room, playerId, p); return; }

  const s = room.shared;
  if (!s || !s.phase || !Array.isArray(s.faces)) throw new Error('اللعبة لم تبدأ بعد');

  if (action === 'nextRound') {
    if (s.phase !== 'over') return;
    if (!room.players.some(x => x.id === playerId) && room.hostId !== playerId) throw new Error('لست في الغرفة');
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
    gwTakeAnswer(room, !!p.yes);
    return;
  }

  if (action === 'unanswer') {
    // Only the answer just given, before the asker is done: named by the turn's seq and the log's.
    if (s.phase !== 'play' || s.stage !== 'flip' || !s.q || s.q.kind === 'guess') return;
    if (staleTap(p, 'seq', s.turnSeq) || staleTap(p, 'log', s.logSeq)) return;
    if (seat === -1 || seat === s.turn) throw new Error('اللي جاوب بس يقدر يرجّع إجابته');
    const u = room._gwUndo;
    if (!u || u.turnSeq !== s.turnSeq || u.logSeq !== s.logSeq) return;
    gwUnanswer(room);
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
    if (action === 'guess') { gwGuess(room, seat, Number(p.face)); return; }
    // Out loud or typed: the other player answers on their phone.
    if (action === 'typed') {
      const text = gwCleanTyped(p.text);
      if (!text) throw new Error('اكتب السؤال');
      s.q = { seat: seat, kind: 'typed', text: text, answer: null };
    } else {
      s.q = { seat: seat, kind: 'loud', answer: null };
    }
    gwWaitAnswer(room);
    return;
  }

  throw new Error('إجراء غير معروف');
};

/* --- the clock ------------------------------------------------------------------ */

const gwDeadline = (room) => {
  const s = room.shared || {};
  return (s.phase === 'play' || s.phase === 'pick') && s.endsAt ? s.endsAt + GW_GRACE_MS : null;
};

const gwTimeout = (room, now) => {
  const s = room.shared || {};
  if ((s.phase !== 'play' && s.phase !== 'pick') || !s.endsAt || now < s.endsAt + GW_GRACE_MS) return false;
  gwAuto(room, 'clock');
  return true;
};

/* --- someone leaves: a seated player loses by forfeit, as in the duels ----------- */

const gwPlayerLeft = (room, playerId) => {
  const s = room.shared;
  if (!s || !s.phase || !Array.isArray(s.faces)) return;
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
