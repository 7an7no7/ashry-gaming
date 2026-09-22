/* ============================================================================
   خمّن مين — GUESS WHO in rooms: two duel, the room watches, winner stays on
   ----------------------------------------------------------------------------
   Bundled into the Worker after RoomDuels.js (FILES in rooms-worker/build.mjs),
   whose line and seats it uses: duelSeatNext, duelEnd, duelWaiting. The faces
   and the questions are GuessWho.js, shared with the page.

   The owner's rules (22 Sep 2026, asked one at a time): a room only, two
   play and everyone else watches on their phone or the TV, the winner stays
   on. Each player has a secret face on their own phone; a turn is one
   question or one guess, never both. A question is picked from the list
   (the server answers it truthfully and the whole room sees it) or asked
   out loud, the other player tapping yes or no. After a list question the
   faces it rules out fall by themselves - a lobby switch, on by default -
   and after an out-loud one the asker flips them by hand, since the phone
   never heard what was asked. A wrong guess loses the game (a switch: or
   only the turn, that face going down). The secret face is dealt at random
   (a switch: each picks their own). 16, 24 or 30 faces; a turn clock off,
   30 or 60 seconds, passing the turn; computer players easy and hard, who
   ask from the list only (an out-loud question can't be put to one).

   What is hidden: the two secret faces, in room._gw.secret (never
   projected); each seated phone gets its own in room.secrets[pid].face.
   Everything else is public - the board, which faces each player has put
   down, every question and answer - as it is on a real table.

   shared, beside the duel's fields (seats, line, champ, result, scores…):
     phase     'pick' | 'play' | 'over'
     settings  { size, pick: 'random' | 'choose', autoFlip, wrong: 'lose' | 'turn', turnClock }
     faces     the board (GuessWho.js)
     down      [seat 0's faces down, seat 1's]
     picked    [bool, bool] while each picks their face
     turn      the seat up · stage  'ask' | 'answer' | 'flip'
     turnSeq   raised at every turn and stage; moves carry it as `seq`
     asked     [list questions seat 0 asked, seat 1's]
     q         the last question { seat, kind: 'list' | 'loud', qi, answer, out }
     log       the last questions and guesses, newest last
     endsAt    the turn clock · reveal  [seat 0's face, seat 1's], once over
   ========================================================================= */
const GW_GRACE_MS = 1500;       // the server's clock acts this long after the phones'
const GW_LOG_MAX = 8;

const gwSeatOf = (s, pid) => (s.seats || []).indexOf(pid);

const gwOptions = (payload, prev) => {
  const p = payload || {};
  const was = prev || {};
  const pickOf = (v) => (v === 'choose' || v === 'random' ? v : null);
  const wrongOf = (v) => (v === 'lose' || v === 'turn' ? v : null);
  return {
    size: gwSize(p.size !== undefined ? p.size : was.size),
    pick: pickOf(p.pick) || pickOf(was.pick) || 'random',
    autoFlip: typeof p.autoFlip === 'boolean' ? p.autoFlip : (typeof was.autoFlip === 'boolean' ? was.autoFlip : true),
    wrong: wrongOf(p.wrong) || wrongOf(was.wrong) || 'lose',
    turnClock: GW_CLOCKS.indexOf(Number(p.turnClock)) !== -1 ? Number(p.turnClock)
      : (GW_CLOCKS.indexOf(Number(was.turnClock)) !== -1 ? Number(was.turnClock) : 0)
  };
};

const gwLog = (s, entry) => {
  s.log = (s.log || []).concat([entry]).slice(-GW_LOG_MAX);
};

const gwStartClock = (room) => {
  const s = room.shared;
  const secs = (s.settings || {}).turnClock || 0;
  s.endsAt = s.phase === 'play' && secs ? Date.now() + secs * 1000 : null;
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
  s.asked = [[], []];
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

/** The faces a truthful answer rules out go down on the asker's board. */
const gwFlipOut = (s, seat, qi, answer) => {
  const out = gwRuledOut(s.faces, s.down[seat], qi, answer);
  s.down[seat] = s.down[seat].concat(out);
  return out.length;
};

/** A question from the list, answered by the server. */
const gwAsk = (room, seat, qi) => {
  const s = room.shared;
  if (!GW_QUESTIONS[qi]) throw new Error('سؤال غير معروف');
  if (s.asked[seat].indexOf(qi) !== -1) throw new Error('سألت السؤال ده قبل كده');
  const answer = gwAnswer(qi, s.faces[room._gw.secret[1 - seat]]);
  s.asked[seat] = s.asked[seat].concat([qi]);
  const bot = isRoomBot(room, s.seats[seat]);
  const auto = bot || !!s.settings.autoFlip;
  const out = auto ? gwFlipOut(s, seat, qi, answer) : null;
  s.q = { seat: seat, kind: 'list', qi: qi, answer: answer, out: out };
  gwLog(s, { seat: seat, kind: 'list', qi: qi, answer: answer, out: out });
  if (auto) { gwNextTurn(room); return; }
  // Flipped by hand: the asker puts the faces down, then ends the turn.
  s.stage = 'flip';
  s.turnSeq++;
};

/** A guess at the other player's face. */
const gwGuess = (room, seat, face) => {
  const s = room.shared;
  if (!(face >= 0 && face < s.faces.length)) throw new Error('وش غير معروف');
  const right = room._gw.secret[1 - seat] === face;
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
  if (s.stage === 'answer') s.q = null;      // the question was never answered: it doesn't count
  gwLog(s, { seat: s.turn, kind: 'skip', why: why });
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
    requireHost(room, playerId);
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
    // The other player answers an out-loud question.
    if (s.phase !== 'play' || s.stage !== 'answer' || staleTap(p, 'seq', s.turnSeq)) return;
    if (seat === -1 || seat === s.turn) throw new Error('الإجابة على اللي اتسأل');
    const answer = !!p.yes;
    s.q = Object.assign({}, s.q, { answer: answer });
    gwLog(s, { seat: s.turn, kind: 'loud', answer: answer });
    s.stage = 'flip';
    s.turnSeq++;
    return;
  }

  if (action === 'ask' || action === 'loud' || action === 'guess' || action === 'done') {
    if (s.phase !== 'play' || staleTap(p, 'seq', s.turnSeq)) return;
    if (seat === -1) throw new Error('انت بتتفرج دلوقتي، استنى دورك في الطابور');
    if (seat !== s.turn) throw new Error('مش دورك');
    if (action === 'done') {
      if (s.stage !== 'flip') return;
      gwNextTurn(room);
      return;
    }
    if (s.stage !== 'ask') return;
    if (action === 'ask') { gwAsk(room, seat, Number(p.q)); return; }
    if (action === 'guess') { gwGuess(room, seat, Number(p.face)); return; }
    // Out loud: the other player answers on their phone. A computer player can't hear one.
    if (isRoomBot(room, s.seats[1 - seat])) throw new Error('الكمبيوتر مش بيسمع: اسأل من القائمة');
    s.q = { seat: seat, kind: 'loud', qi: null, answer: null, out: null };
    s.stage = 'answer';
    s.turnSeq++;
    return;
  }

  throw new Error('إجراء غير معروف');
};

/* --- the clock ------------------------------------------------------------------ */

const gwDeadline = (room) => {
  const s = room.shared || {};
  return s.phase === 'play' && s.endsAt ? s.endsAt + GW_GRACE_MS : null;
};

const gwTimeout = (room, now) => {
  const s = room.shared || {};
  if (s.phase !== 'play' || !s.endsAt || now < s.endsAt + GW_GRACE_MS) return false;
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

/* --- computer players ----------------------------------------------------------
   From its own board and the answers everyone saw: the faces still up on its
   side. It picks its face at random, guesses once one face is left (or, easy,
   sometimes when two are), and otherwise asks from the list - hard the
   question that halves what is left, easy any that splits it.
   ------------------------------------------------------------------------------ */
ROOM_BOT_GAMES.guesswho = {
  max: ROOM_MAX_PLAYERS,
  pending: (room) => {
    const s = room.shared || {};
    if (s.phase === 'pick' && Array.isArray(s.picked)) {
      const seat = [0, 1].find(k => !s.picked[k] && isRoomBot(room, s.seats[k]));
      return seat === undefined ? null : { pid: s.seats[seat], key: 'pick|' + s.turnSeq };
    }
    if (s.phase === 'play' && s.stage === 'ask' && isRoomBot(room, s.seats[s.turn])) {
      return { pid: s.seats[s.turn], key: s.turnSeq, delay: 1400 + Math.floor(Math.random() * 900) };
    }
    return null;
  },
  decide: (room, pid) => {
    const s = room.shared;
    const seat = gwSeatOf(s, pid);
    if (seat === -1) return null;
    if (s.phase === 'pick') return { action: 'pick', payload: { face: Math.floor(Math.random() * s.faces.length) } };
    if (s.phase !== 'play' || s.turn !== seat || s.stage !== 'ask') return null;
    const level = roomBotLevel(room, pid);
    const up = gwUp(s.faces, s.down[seat]);
    const guess = (list) => ({ action: 'guess', payload: { face: list[Math.floor(Math.random() * list.length)], seq: s.turnSeq } });
    if (up.length <= 1) return guess(up.length ? up : [0]);
    if (level !== 'hard' && up.length === 2 && Math.random() < 0.5) return guess(up);
    const qi = gwBotQuestion(s.faces, s.down[seat], s.asked[seat], level);
    if (qi < 0) return guess(up);
    return { action: 'ask', payload: { q: qi, seq: s.turnSeq } };
  },
  fallback: (room, pid) => {
    const s = room.shared;
    const seat = gwSeatOf(s, pid);
    if (seat === -1) return null;
    if (s.phase === 'pick') return { action: 'pick', payload: { face: 0 } };
    if (s.phase !== 'play' || s.turn !== seat || s.stage !== 'ask') return null;
    const up = gwUp(s.faces, s.down[seat]);
    return { action: 'guess', payload: { face: up.length ? up[0] : 0, seq: s.turnSeq } };
  }
};
