/* ============================================================================
   شطرنج — CHESS in rooms: two play, the room watches, winner stays on
   ----------------------------------------------------------------------------
   Bundled into the Worker after RoomDuels.js (FILES in rooms-worker/build.mjs),
   whose line and seats it uses (duelSeatNext, duelEnd, duelHere). The rules
   are Chess.js, shared with the page, so the server judges a move with the
   very code the phone lit its squares with.

   The owner's rules (23 Sep 2026): a room duel with the TV - two play, the
   rest watch on their phones and the TV, the winner stays on (the challenger
   has White, which moves first); a chess clock, the host's choice, off by
   default (3+2, 5+0, 10+0), running out losing unless the other side has
   nothing to mate with (a draw); draws offered and accepted, and resigning.
   In winner stays a draw is the duels' draw: the champion keeps the seat.

   Nothing is hidden: the whole game is in shared - except in الوزير المستخبي
   (the hidden queen, settings.variant 'hq', winner stays only): each seated
   player's secret pawn is room._chq (Chess.js's chessHqNew shape, never
   projected) and their own square in room.secrets[pid].hq; shared.chess.hq
   carries only who has picked, the pick clock, the reveals the table saw, and
   both picks once the game is over (chessHqPublic below).

   shared, beside the duel's fields (seats, seatNames, line, champ, result,
   prev, streak, scores, board, round):
     phase     'play' | 'over'
     settings  { clock: 'off' | '3+2' | '5+0' | '10+0' }
     chess     ONE BOARD (chessBoardNew below): the game and everything about it
               seat 0 plays White, seat 1 Black.

   ---------------------------------------------------------------------------
   THE ADAPTER A TOURNAMENT BRACKET NEEDS (the duels' tournament mode plays
   several boards at once; everything a board needs is in these functions,
   none of which touches room.shared or the line):

     chessBoardNew(clockId, opts)  a fresh board: { g, moves, sans, hist, last, lost,
                                   clock, offer, offered, result, armageddon }.
                                   opts.armageddon: a draw on it is Black's win.
     chessBoardMove(bd, seat, payload, now)
                                   seat 0 White / 1 Black plays { from, to,
                                   promo }; throws when it isn't legal or not
                                   their turn; returns the board's result once
                                   the game is over, else null. payload.move is
                                   the stale-tap guard (bd.moves as the phone saw it).
     chessBoardResign(bd, seat)    returns the result.
     chessBoardOffer(bd, seat, now) / chessBoardAnswer(bd, seat, accept)
                                   a draw offered, and the other's answer
                                   (accepted: the result; else null).
     chessBoardDeadline(bd)        when the clock of the side to move runs out
                                   (plus the grace), or null.
     chessBoardFlag(bd, now)       the clock ran out: the result, or null.
     result: { result: 'w' | 'b' | 'd', reason, winner: 0 | 1 | null } -
     winner is the seat; with bd.armageddon a draw comes out as Black's win
     (winner 1, result 'b', drawn: true).
   A drawn match in a bracket is replayed once with the colours swapped, then
   played as Armageddon: chessMatchNext in Chess.js says which game comes next
   and who has White, and who won the match once it is decided. The clock is
   per board (per match game): each game starts a fresh one with the match's
   setting.
   ========================================================================= */

// A move that arrives this long after the mover's time ran out still counts
// (the network's share of the clock); the server's own flag waits as long.
const CHESS_GRACE_MS = 600;

/** A fresh board: the start position, and the clock chosen (or none). */
function chessBoardNew(clockId, opts, startFen) {
  let fen = null;
  let o = opts || {};
  let clkId = clockId;
  if (typeof clockId === 'string' && clockId.indexOf('/') !== -1) {
    fen = clockId;
    clkId = opts;
    o = startFen || {};
  } else if (typeof startFen === 'string') {
    fen = startFen;
  } else if (o && typeof o.start === 'string') {
    fen = o.start;
  }
  const g = fen ? chessFromFen(fen) : chessNew();
  const startStr = fen || chessFen(g);
  const clk = chessClockNew(clkId, o.odds ? { odds: o.odds } : undefined);
  return {
    g: g,
    start: startStr,
    moves: 0,
    sans: [],
    hist: [],                     // the moves as 'e2e4', 'e7e8q': the game's record, for the review
    last: null,
    lost: [[], []],               // what each side has lost, as piece letters, in order
    clock: clk,
    offer: null,                  // { seat, at: moves } - a draw offered and not answered
    offered: [-1, -1],            // the move count at which each side last offered
    result: null,
    armageddon: !!o.armageddon
  };
}

/** The board's result from the game's: the seat that won, a draw turned into Black's win in Armageddon. */
function chessBoardResult(bd, result, reason) {
  let r = result;
  let drawn = false;
  if (bd.armageddon && r === 'd') { r = 'b'; drawn = true; }
  bd.result = { result: r, reason: reason, winner: r === 'w' ? 0 : r === 'b' ? 1 : null, drawn: drawn };
  bd.offer = null;
  if (bd.clock) {
    // Freeze the clock where it stands.
    const side = bd.g.turn;
    if (bd.clock.at !== null && bd.clock.at !== undefined) bd.clock.left[side] = Math.max(0, chessClockLeft(bd.clock, side, side, bd.endedAt || Date.now()));
    bd.clock.at = null;
  }
  return bd.result;
}

/**
 * One move by `seat`. Returns the result when it ends the game, else null; throws when it can't be
 * played. hq: the hidden queen's secret (room._chq) in that variant - the move is then judged with
 * the mover's hidden queen, and bd.lastHq says what the table saw of it (a reveal, a capture).
 */
function chessBoardMove(bd, seat, payload, now, hq) {
  const p = payload || {};
  if (bd.result) throw new Error('اللعبة خلصت');
  if (bd.hq && bd.hq.picking) throw new Error('استنى لما الاتنين يختاروا الوزير المستخبي');
  if (seat !== bd.g.turn) throw new Error('مش دورك');
  const t = now === undefined ? Date.now() : now;
  if (bd.clock && chessClockFlagged(bd.clock, seat, t, CHESS_GRACE_MS)) {
    bd.endedAt = t;
    return chessBoardResult(bd, chessFlagResult(bd.g.board, seat), 'time');
  }
  const info = hq ? chessHqPlay(bd.g, hq, { from: p.from, to: p.to, promo: p.promo }) : chessPlay(bd.g, { from: p.from, to: p.to, promo: p.promo });
  if (!info) throw new Error('النقلة دي مش مسموحة');
  if (bd.clock) chessClockPress(bd.clock, seat, t, CHESS_GRACE_MS, bd.moves === 0);
  bd.moves++;
  const seen = hq ? info.hq : null;
  bd.sans.push(info.san + (seen && seen.reveal ? CHESS_HQ_MARK : ''));
  bd.hist.push(hq ? info.uci : info.from + info.to + (info.promo || ''));
  if (info.capture) bd.lost[1 - seat].push(info.capture);
  bd.last = { from: info.from, to: info.to, san: info.san, piece: info.piece, capture: info.capture, captureSq: info.captureSq,
    castle: info.castle, promo: info.promo, check: info.check, seat: seat, n: bd.moves };
  // What the table saw of a hidden queen: a reveal, a capture - never a promotion (that secret stays till the end).
  if (seen && (seen.reveal || seen.captured)) bd.last.hq = { reveal: !!seen.reveal, captured: !!seen.captured };
  // Moving is the answer to a draw the other side offered: no.
  if (bd.offer && bd.offer.seat !== seat) bd.offer = null;
  if (info.status.over) {
    bd.endedAt = t;
    return chessBoardResult(bd, info.status.result, info.status.reason);
  }
  return null;
}

function chessBoardResign(bd, seat) {
  if (bd.result) return null;
  bd.endedAt = Date.now();
  return chessBoardResult(bd, seat === 0 ? 'b' : 'w', 'resign');
}

/** A draw offered by `seat`: once a move (a second offer before your next move is refused). */
function chessBoardOffer(bd, seat) {
  if (bd.result) return null;
  if (bd.offer) throw new Error(bd.offer.seat === seat ? 'عرضت التعادل خلاص' : 'فيه عرض تعادل مستنيك');
  if (bd.offered[seat] === bd.moves) throw new Error('استنى نقلة قبل ما تعرض تاني');
  bd.offer = { seat: seat, at: bd.moves };
  bd.offered[seat] = bd.moves;
  return null;
}

/** The other side answers: accepted, a draw; refused, the game goes on. */
function chessBoardAnswer(bd, seat, accept) {
  if (bd.result || !bd.offer || bd.offer.seat === seat) return null;
  if (!accept) { bd.offer = null; return null; }
  bd.endedAt = Date.now();
  return chessBoardResult(bd, 'd', 'agreed');
}

function chessBoardDeadline(bd) {
  if (!bd || bd.result || !bd.clock || bd.clock.at === null || bd.clock.at === undefined) return null;
  // The first moment the flag counts (chessClockFlagged wants more than the grace).
  return bd.clock.at + bd.clock.left[bd.g.turn] + CHESS_GRACE_MS + 1;
}

function chessBoardFlag(bd, now) {
  if (!bd || bd.result || !bd.clock) return null;
  if (!chessClockFlagged(bd.clock, bd.g.turn, now, CHESS_GRACE_MS)) return null;
  bd.endedAt = now;
  return chessBoardResult(bd, chessFlagResult(bd.g.board, bd.g.turn), 'time');
}

/* --- winner stays on: the room around one board ------------------------------------ */

const chessSeatOf = (s, pid) => (s.seats || []).indexOf(pid);

const CHESS_VARIANTS = ['standard', '960', 'hq'];
const CHESS_ODDS = ['none', 'pawn', 'knight', 'rook', 'queen', 'time'];

function chessRoomOptions(payload, prev) {
  const p = payload || {};
  const was = prev || {};
  const clock = chessClockId(p.clock !== undefined ? p.clock : was.clock);
  // A phone too old to send the variant keeps what the room had; 'hq' is the hidden queen (winner stays only).
  const want = p.variant ? p.variant : was.variant;
  const variant = CHESS_VARIANTS.indexOf(want) !== -1 ? want : 'standard';
  let odds = p.odds !== undefined ? p.odds : was.odds;
  if (CHESS_ODDS.indexOf(odds) === -1) odds = 'none';
  return { clock, variant, odds };
}

/** A fresh board for the seats just set (opts.armageddon: a tournament's third game of a match). */
function chessRoomDeal(room, opts) {
  const o = opts || {};
  const s = room.shared;
  const settings = s.settings || {};
  let startFen = o.start || null;
  let oddsSide = null;

  const isTour = !!(o.tour || (room && room.shared && room.shared.tour));
  // The hidden queen: winner stays only (never a tournament's match), from the usual start, no handicap.
  const hidden = !isTour && settings.variant === 'hq';
  if (!isTour && !hidden) {
    const oddsKind = settings.odds || 'none';
    if (oddsKind !== 'none') {
      const champId = s.champ;
      const champSeat = (s.seats || []).indexOf(champId);
      if (champSeat === 0 || champSeat === 1) {
        oddsSide = champSeat === 0 ? 'w' : 'b';
      }
    }
  }

  // The 960 row first, then the handicap's piece taken off it: a handicap on a
  // 960 room takes the f-pawn or the knight, rook or queen nearest the a-file
  // of that row (time odds take no piece: the clock gives them).
  if (!startFen && settings.variant === '960') {
    startFen = chess960Random(Math.random);
  }
  if (oddsSide && settings.odds !== 'time') {
    startFen = chessOddsFen(startFen || CHESS_START_FEN, settings.odds, oddsSide);
  }

  s.chess = chessBoardNew(settings.clock, {
    armageddon: !!o.armageddon,
    start: startFen,
    odds: oddsSide && settings.odds === 'time' ? oddsSide : undefined
  });
  if (!isTour) {
    // Chess keeps no other secret in winner stays: every deal starts the slices afresh.
    room.secrets = {};
    delete room._chq;
    if (hidden) chessHqDeal(room);
  }
  s.result = null;
  s.roster = duelHere(room);
  s.phase = 'play';
  room.phase = 'play';
}

/* --- الوزير المستخبي in the room: the picks, the secret squares, the reveals ---------------- */

// With the room's clock on, picking has a clock of its own (خمّن مين's GW_PICK_SECS): an unpicked player gets a random pawn.
const CHESS_HQ_PICK_SECS = 60;

/** A hidden-queen deal: nobody has picked; the pick clock when the room plays with a clock. */
function chessHqDeal(room) {
  const s = room.shared;
  const on = chessClockId((s.settings || {}).clock) !== 'off';
  room._chq = chessHqNew();
  s.chess.hq = { picking: true, picked: [false, false], pickEnds: on ? Date.now() + CHESS_HQ_PICK_SECS * 1000 : null, events: [], end: null };
  chessHqSecrets(room);
}

/** Each seated phone's own secret: its hidden pawn's square ('' once gone) and what became of it. */
function chessHqSecrets(room) {
  const s = room.shared;
  const h = room._chq;
  if (!h || !s.chess || !s.chess.hq) return;
  (s.seats || []).forEach((pid, c) => {
    if (!pid) return;
    room.secrets[pid] = Object.assign({}, room.secrets[pid] || {}, { hq: h.sq[c] >= 0 ? chessSqName(h.sq[c]) : '', hqHow: h.how[c] || '' });
  });
}

/** Picks a random pawn for every seat that hasn't picked (the clock, the host), and starts the game once both have. */
function chessHqAutoPick(room) {
  const bd = room.shared.chess;
  const h = room._chq;
  if (!bd || !bd.hq || !bd.hq.picking || !h) return false;
  [0, 1].forEach(c => {
    if (bd.hq.picked[c]) return;
    if (chessHqPick(h, bd.g, c, chessHqRandom(bd.g, c))) bd.hq.picked[c] = true;
  });
  chessHqPicked(room);
  return true;
}

/** After a pick: the secrets written, and the game on once both have picked. */
function chessHqPicked(room) {
  const bd = room.shared.chess;
  if (bd.hq.picked[0] && bd.hq.picked[1]) { bd.hq.picking = false; bd.hq.pickEnds = null; }
  chessHqSecrets(room);
}

/** After a move: the reveal or the capture the table saw, and the secrets where the pawn went. */
function chessHqAfterMove(room) {
  const bd = room.shared.chess;
  const h = room._chq;
  if (!bd || !bd.hq || !h) return;
  const last = bd.last;
  if (last && last.hq) {
    if (last.hq.reveal) bd.hq.events.push({ n: last.n, seat: last.seat, kind: 'reveal', sq: last.to });
    if (last.hq.captured) bd.hq.events.push({ n: last.n, seat: 1 - last.seat, kind: 'captured', sq: last.captureSq });
  }
  chessHqSecrets(room);
}

/** The game is over: both secrets shown - the pawn each had picked, and what became of it. */
function chessHqEnd(room) {
  const bd = (room.shared || {}).chess;
  const h = room._chq;
  if (!bd || !bd.hq || !h || bd.hq.end) return;
  bd.hq.picking = false;
  bd.hq.pickEnds = null;
  bd.hq.end = [0, 1].map(c => ({
    pick: h.pick[c] >= 0 ? chessSqName(h.pick[c]) : '',
    how: h.pick[c] >= 0 ? (h.how[c] || 'hidden') : '',
    at: h.sq[c] >= 0 ? chessSqName(h.sq[c]) : (h.at[c] >= 0 ? chessSqName(h.at[c]) : '')
  }));
  chessHqSecrets(room);
}

/** The board's game is over: the duels' line moves on (a draw keeps the champion in the seat). */
function chessRoomEnd(room, res) {
  chessHqEnd(room);
  duelEnd(room, res.winner, res.reason);
}

function chessAction(room, playerId, action, payload) {
  // A tournament takes its own actions, and runs every match's moves back through this function.
  if (tourAction(room, playerId, action, payload, 'chess')) return;
  const p = payload || {};
  if (action === 'start') {
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
      settings: chessRoomOptions(p, prev.settings)
    };
    chessRoomDeal(room);
    room.shared.board = scoreboardOf(room);
    return;
  }

  const s = room.shared;
  if (!s || !s.phase || !s.chess) throw new Error('اللعبة لم تبدأ بعد');

  if (action === 'nextRound') {
    // The round number was checked in applyRoomAction; this is the phase.
    if (s.phase !== 'over') return;
    if (!room.players.some(x => x.id === playerId) && room.hostId !== playerId) throw new Error('لست في الغرفة');
    duelSeatNext(room);
    s.prev = s.result;
    s.round = (s.round || 1) + 1;
    chessRoomDeal(room);
    return;
  }

  const seat = chessSeatOf(s, playerId);
  const bd = s.chess;

  if (action === 'move') {
    if (s.phase !== 'play' || bd.result) return;
    // Drawn for a board that has moved on since: the second tap of a double tap.
    if (staleTap(p, 'move', bd.moves)) return;
    if (seat === -1) throw new Error('انت بتتفرج دلوقتي، استنى دورك في الطابور');
    const res = chessBoardMove(bd, seat, p, Date.now(), bd.hq ? room._chq : undefined);
    chessHqAfterMove(room);
    if (res) chessRoomEnd(room, res);
    return;
  }

  if (action === 'hqPick') {
    // الوزير المستخبي: a seated player picks one of their own pawns, once, before the first move.
    if (s.phase !== 'play' || bd.result || !bd.hq || !bd.hq.picking || !room._chq) return;
    if (staleTap(p, 'round', s.round)) return;
    if (seat === -1) throw new Error('انت بتتفرج دلوقتي');
    if (bd.hq.picked[seat]) return;
    if (!chessHqPick(room._chq, bd.g, seat, String(p.sq || ''))) throw new Error('اختار عسكري من عساكرك');
    bd.hq.picked[seat] = true;
    chessHqPicked(room);
    return;
  }

  if (action === 'resign') {
    if (s.phase !== 'play' || bd.result) return;
    if (seat === -1) throw new Error('انت بتتفرج دلوقتي');
    if (staleTap(p, 'round', s.round)) return;
    chessRoomEnd(room, chessBoardResign(bd, seat));
    return;
  }

  if (action === 'offerDraw') {
    if (s.phase !== 'play' || bd.result) return;
    if (seat === -1) throw new Error('انت بتتفرج دلوقتي');
    if (staleTap(p, 'move', bd.moves)) return;
    chessBoardOffer(bd, seat);
    return;
  }

  if (action === 'skipTurn') {
    // The host plays for a phone that went quiet: the computer's move at a low rating (chessHostMove).
    requireHost(room, playerId);
    if (s.phase !== 'play' || bd.result || staleTap(p, 'move', bd.moves)) return;
    // The hidden queen's pick waiting on a quiet phone: a random pawn for whoever hasn't picked.
    if (bd.hq && bd.hq.picking) { chessHqAutoPick(room); return; }
    const up = bd.g.turn;
    const hq = bd.hq ? room._chq : undefined;
    const mv = chessHostMove(bd.g, hq ? hq.sq[up] : -1);
    if (!mv) return;
    const res = chessBoardMove(bd, up, mv, Date.now(), hq);
    if (bd.last && bd.last.n === bd.moves) bd.last.auto = 'host';
    chessHqAfterMove(room);
    if (res) chessRoomEnd(room, res);
    return;
  }

  if (action === 'answerDraw') {
    if (s.phase !== 'play' || bd.result || !bd.offer) return;
    if (seat === -1 || seat === bd.offer.seat) throw new Error('العرض ده مش ليك');
    const res = chessBoardAnswer(bd, seat, !!p.accept);
    if (res) chessRoomEnd(room, res);
    return;
  }

  throw new Error('إجراء غير معروف');
}

/**
 * The host's "play for" (the owner's duels have it for a phone gone quiet): a
 * legal move chosen by the phone's computer at a low rating - a sensible move,
 * never a brilliant one, since it is the player's game and not the host's. One
 * ply with the captures after it and a few hundred positions at most: the
 * server's time budget on the free plan is a few milliseconds.
 */
const CHESS_HOST_ELO = 800;
function chessHostMove(g, hq) {
  return chessBestMove(g, { elo: CHESS_HOST_ELO, depth: 1, nodes: 600, ms: 40, noise: 60, hq: typeof hq === 'number' ? hq : -1 });
}

/* --- the clock ------------------------------------------------------------------ */

function chessDeadline(room) {
  const s = room.shared || {};
  const hq = s.chess && s.chess.hq;
  if (s.phase === 'play' && hq && hq.picking) return hq.pickEnds || null;
  return s.phase === 'play' ? chessBoardDeadline(s.chess) : null;
}

function chessTimeout(room, now) {
  const s = room.shared || {};
  if (s.phase !== 'play' || !s.chess) return false;
  const hq = s.chess.hq;
  if (hq && hq.picking) return !!hq.pickEnds && now >= hq.pickEnds && chessHqAutoPick(room);
  const res = chessBoardFlag(s.chess, now);
  if (!res) return false;
  chessRoomEnd(room, res);
  return true;
}

/* --- someone leaves: a seated player loses by forfeit, as in the duels ----------- */

function chessPlayerLeft(room, playerId) {
  const s = room.shared;
  if (!s || !s.phase || !s.chess) return;
  s.line = (s.line || []).filter(id => id !== playerId);
  if (s.streak && s.streak.id === playerId) s.streak = null;
  const seat = chessSeatOf(s, playerId);
  if (s.phase === 'play' && seat !== -1) {
    const bd = s.chess;
    if (!bd.result) {
      bd.endedAt = Date.now();
      chessBoardResult(bd, seat === 0 ? 'b' : 'w', 'left');
      bd.result.drawn = false;
    }
    chessHqEnd(room);
    duelEnd(room, 1 - seat, 'left');
    return;
  }
  if (s.champ === playerId) s.champ = null;
  s.board = scoreboardOf(room);
}
