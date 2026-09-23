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

   Nothing is hidden: the whole game is in shared.

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

     chessBoardNew(clockId, opts)  a fresh board: { g, moves, sans, last, lost,
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
function chessBoardNew(clockId, opts) {
  const o = opts || {};
  return {
    g: chessNew(),
    moves: 0,
    sans: [],
    last: null,
    lost: [[], []],               // what each side has lost, as piece letters, in order
    clock: chessClockNew(clockId),
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

/** One move by `seat`. Returns the result when it ends the game, else null; throws when it can't be played. */
function chessBoardMove(bd, seat, payload, now) {
  const p = payload || {};
  if (bd.result) throw new Error('اللعبة خلصت');
  if (seat !== bd.g.turn) throw new Error('مش دورك');
  const t = now === undefined ? Date.now() : now;
  if (bd.clock && chessClockFlagged(bd.clock, seat, t, CHESS_GRACE_MS)) {
    bd.endedAt = t;
    return chessBoardResult(bd, chessFlagResult(bd.g.board, seat), 'time');
  }
  const info = chessPlay(bd.g, { from: p.from, to: p.to, promo: p.promo });
  if (!info) throw new Error('النقلة دي مش مسموحة');
  if (bd.clock) chessClockPress(bd.clock, seat, t, CHESS_GRACE_MS, bd.moves === 0);
  bd.moves++;
  bd.sans.push(info.san);
  if (info.capture) bd.lost[1 - seat].push(info.capture);
  bd.last = { from: info.from, to: info.to, san: info.san, piece: info.piece, capture: info.capture, captureSq: info.captureSq,
    castle: info.castle, promo: info.promo, check: info.check, seat: seat, n: bd.moves };
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
  return bd.clock.at + bd.clock.left[bd.g.turn] + CHESS_GRACE_MS;
}

function chessBoardFlag(bd, now) {
  if (!bd || bd.result || !bd.clock) return null;
  if (!chessClockFlagged(bd.clock, bd.g.turn, now, CHESS_GRACE_MS)) return null;
  bd.endedAt = now;
  return chessBoardResult(bd, chessFlagResult(bd.g.board, bd.g.turn), 'time');
}

/* --- winner stays on: the room around one board ------------------------------------ */

const chessSeatOf = (s, pid) => (s.seats || []).indexOf(pid);

function chessRoomOptions(payload, prev) {
  const p = payload || {};
  const was = prev || {};
  return { clock: chessClockId(p.clock !== undefined ? p.clock : was.clock) };
}

/** A fresh board for the seats just set. */
function chessRoomDeal(room) {
  const s = room.shared;
  s.chess = chessBoardNew((s.settings || {}).clock);
  s.result = null;
  s.roster = duelHere(room);
  s.phase = 'play';
  room.phase = 'play';
}

/** The board's game is over: the duels' line moves on (a draw keeps the champion in the seat). */
function chessRoomEnd(room, res) {
  duelEnd(room, res.winner, res.reason);
}

function chessAction(room, playerId, action, payload) {
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
    const res = chessBoardMove(bd, seat, p, Date.now());
    if (res) chessRoomEnd(room, res);
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

  if (action === 'answerDraw') {
    if (s.phase !== 'play' || bd.result || !bd.offer) return;
    if (seat === -1 || seat === bd.offer.seat) throw new Error('العرض ده مش ليك');
    const res = chessBoardAnswer(bd, seat, !!p.accept);
    if (res) chessRoomEnd(room, res);
    return;
  }

  throw new Error('إجراء غير معروف');
}

/* --- the clock ------------------------------------------------------------------ */

function chessDeadline(room) {
  const s = room.shared || {};
  return s.phase === 'play' ? chessBoardDeadline(s.chess) : null;
}

function chessTimeout(room, now) {
  const s = room.shared || {};
  if (s.phase !== 'play' || !s.chess) return false;
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
    duelEnd(room, 1 - seat, 'left');
    return;
  }
  if (s.champ === playerId) s.champ = null;
  s.board = scoreboardOf(room);
}
