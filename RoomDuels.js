/* ==========================================================================
   كونكت ٤ · نقط ومربعات — THE DUELS IN ROOMS: WINNER STAYS ON
   --------------------------------------------------------------------------
   Two games for two, played by a whole room: two sit down, everyone else
   watches on their phones or the TV, and after each game the loser goes to
   the back of the line and the next in line sits down against the winner.
   The challenger moves first. With exactly two in the room they simply keep
   playing, whoever went second going first next time.

   The moves are judged by the same code the one-phone games use:
   Connect4.js (c4Play) and DotsBoxes.js (dotsPlay), bundled ahead of this
   file. Everything here is public - a board has no secrets - so it all lives
   in room.shared, and the server only has to make sure that the right player
   moved, that the move was legal, and that a double tap (payload.move, the
   number of moves the phone saw) is dropped rather than played twice.

   shared:
     phase      'play' | 'over'
     round      the game number, which "next game" carries (staleTap in applyRoomAction)
     seats      [first to move, second]; seat 0 is red / blue, seat 1 yellow / rose
     seatNames  their names, kept for a result shown after someone has left
     turn       0 | 1, the seat to move; moves  how many moves so far
     line       who is waiting, in order; anyone who joins goes to the back
     champ      set when a game ends: who stays (the winner; on a draw, the
                one who was defending the seat - seats[1])
     result     { winner (seat or null), draw, reason: line | full | boxes | left,
                  winnerId, winnerName, loserId, loserName }
     prev       the result of the game before this one, for "last game" lines
     streak     { id, n }: the champion's wins in a row
     scores / board   wins so far, best first: the night's leaderboard banks it
     connect4:  mode (4 | 5 in a row), cols, rows, n, grid, win (the lit cells), last { seat, col, row }
     dots:      size (4 | 6 | 8), lines, boxes, count [seat 0, seat 1], last { seat, edge, boxes }

   Decided for the owner (21 Sep 2026): a draw keeps the champion in the seat
   and sends the challenger to the back, like a loss; a seated player who
   leaves mid-game loses by forfeit (the other gets the win) and the next in
   line sits down when the game after is dealt; anyone in the room can deal
   the next game, since whoever is left at the table has to be able to.
   ========================================================================== */
const DUEL_MIN_PLAYERS = 2;

/** What each duel does differently: its options, a fresh board, and one move. */
const DUEL_KINDS = {
  connect4: {
    options: (payload, prev) => ({ mode: c4Mode(payload && payload.mode !== undefined ? payload.mode : (prev || {}).mode) }),
    deal: (s) => {
      const b = c4NewBoard(s.mode);
      s.cols = b.cols; s.rows = b.rows; s.n = b.n; s.grid = b.grid;
      s.win = [];
    },
    move: (s, payload, seat) => {
      const board = { cols: s.cols, rows: s.rows, n: s.n, grid: s.grid };
      const res = c4Play(board, Number(payload && payload.col), seat + 1);
      if (!res) throw new Error('العمود ده مليان');
      s.last = { seat: seat, col: res.col, row: res.row };
      if (res.win) { s.win = res.cells; return { end: true, winner: seat, reason: 'line' }; }
      if (res.draw) return { end: true, winner: null, reason: 'full' };
      return { end: false, again: false };
    },
    // The one move left, when there is only one (the last open column).
    only: (s) => {
      const cols = c4LegalCols({ cols: s.cols, rows: s.rows, n: s.n, grid: s.grid });
      return cols.length === 1 ? { col: cols[0] } : null;
    }
  },
  dots: {
    options: (payload, prev) => ({ size: dotsSize(payload && payload.size !== undefined ? payload.size : (prev || {}).size) }),
    deal: (s) => {
      const b = dotsNewBoard(s.size);
      s.lines = b.lines; s.boxes = b.boxes;
      s.count = [0, 0];
    },
    move: (s, payload, seat) => {
      const board = { n: s.size, lines: s.lines, boxes: s.boxes };
      const res = dotsPlay(board, Number(payload && payload.edge), seat + 1);
      if (!res) throw new Error('الخط ده اترسم خلاص');
      const c = dotsCounts(board);
      s.count = [c[1], c[2]];
      s.last = { seat: seat, edge: res.edge, boxes: res.boxes };
      if (res.over) return { end: true, winner: c[1] > c[2] ? 0 : (c[2] > c[1] ? 1 : null), reason: 'boxes' };
      return { end: false, again: res.again };
    },
    // The last line.
    only: (s) => {
      const free = dotsFree({ n: s.size, lines: s.lines, boxes: s.boxes });
      return free.length === 1 ? { edge: free[0] } : null;
    }
  }
};

// The last possible move of a board plays itself (Forced moves in RoomGames.js).
Object.keys(DUEL_KINDS).forEach(kind => {
  ROOM_FORCED_GAMES[kind] = (room) => {
    const s = room.shared || {};
    if (s.phase !== 'play' || !Array.isArray(s.seats)) return null;
    const payload = DUEL_KINDS[kind].only(s);
    if (!payload) return null;
    return { pid: s.seats[s.turn], key: s.moves, move: { action: 'move', payload: Object.assign({ move: s.moves }, payload) } };
  };
});

const duelHere = (room) => room.players.map(p => p.id);

/**
 * Who is waiting, in order: the line as it was, then anyone in the room who
 * is on it nowhere yet (they joined since), less `exclude` and anyone gone.
 */
const duelWaiting = (room, exclude) => {
  const here = duelHere(room);
  const skip = exclude || [];
  const out = (room.shared.line || []).filter(id => here.indexOf(id) !== -1 && skip.indexOf(id) === -1);
  here.forEach(id => { if (out.indexOf(id) === -1 && skip.indexOf(id) === -1) out.push(id); });
  return out;
};

/** A game is over: the winner scores, the loser goes to the back of the line. `winner` is a seat or null (a draw). */
const duelEnd = (room, winner, reason) => {
  const s = room.shared;
  const here = duelHere(room);
  const seats = s.seats || [];
  const names = s.seatNames || [];
  const won = winner === 0 || winner === 1;
  // On a draw the seat is defended: the second seat (the champion, or whoever
  // sat there in the first game) stays, the challenger goes to the back.
  const stay = won ? winner : 1;
  const champ = seats[stay];
  const loser = seats[1 - stay];
  if (won) {
    addScore(room, champ, 1);
    s.streak = s.streak && s.streak.id === champ ? { id: champ, n: s.streak.n + 1 } : { id: champ, n: 1 };
  }
  const line = duelWaiting(room, seats);
  if (loser && here.indexOf(loser) !== -1) line.push(loser);
  s.line = line;
  s.champ = here.indexOf(champ) !== -1 ? champ : null;
  s.result = {
    winner: won ? winner : null,
    draw: !won,
    reason: reason,
    winnerId: won ? champ : null,
    winnerName: won ? (names[winner] || roomPlayerName(room, champ)) : '',
    loserId: won ? loser : null,
    loserName: won ? (names[1 - winner] || roomPlayerName(room, loser)) : ''
  };
  s.board = scoreboardOf(room);
  s.phase = 'over';
  room.phase = 'over';
};

/**
 * Who sits down for the next game. The champion stays and the first in line
 * challenges, moving first; with only the same two in the room, they swap
 * who goes first; with no champion (they left), the first two in line.
 * Throws when fewer than two are here.
 */
const duelSeatNext = (room) => {
  const s = room.shared;
  const here = duelHere(room);
  const last = s.seats || [];
  const champ = s.champ && here.indexOf(s.champ) !== -1 ? s.champ : null;
  const waiting = duelWaiting(room, champ ? [champ] : []);
  let seats, line;
  if (champ && waiting.length === 1 && here.length === 2 && last.indexOf(waiting[0]) !== -1 && last.indexOf(champ) !== -1) {
    seats = [last[1], last[0]];
    line = [];
  } else if (champ && waiting.length) {
    seats = [waiting[0], champ];
    line = waiting.slice(1);
  } else if (!champ && waiting.length >= 2) {
    seats = [waiting[0], waiting[1]];
    line = waiting.slice(2);
  } else {
    throw new Error('تحتاج لاعبين على الأقل');
  }
  s.seats = seats;
  s.seatNames = seats.map(id => roomPlayerName(room, id));
  s.line = line;
};

/** A fresh board for the seats just set. */
const duelDeal = (room, kind) => {
  const s = room.shared;
  s.turn = 0;
  s.moves = 0;
  s.last = null;
  s.result = null;
  s.roster = duelHere(room);
  DUEL_KINDS[kind].deal(s);
  s.phase = 'play';
  room.phase = 'play';
};

const duelAction = (room, playerId, action, payload, kind) => {
  const k = DUEL_KINDS[kind];
  if (action === 'start') {
    requireHost(room, playerId);
    if (room.players.length < DUEL_MIN_PLAYERS) throw new Error('تحتاج لاعبين على الأقل');
    const order = shuffled(duelHere(room));
    room.shared = Object.assign({
      round: 1,
      seats: [order[0], order[1]],
      seatNames: [roomPlayerName(room, order[0]), roomPlayerName(room, order[1])],
      line: order.slice(2),
      champ: null,
      prev: null,
      streak: null,
      scores: {},
      board: []
    }, k.options(payload, null));
    duelDeal(room, kind);
    room.shared.board = scoreboardOf(room);
    return;
  }

  const s = room.shared;
  if (!s || !s.phase) throw new Error('اللعبة لم تبدأ بعد');

  if (action === 'move') {
    if (s.phase !== 'play') return;
    // Drawn for a board that has moved on since: the second tap of a double tap.
    if (staleTap(payload, 'move', s.moves)) return;
    const seat = (s.seats || []).indexOf(playerId);
    if (seat === -1) throw new Error('انت بتتفرج دلوقتي، استنى دورك في الطابور');
    if (seat !== s.turn) throw new Error('مش دورك');
    const out = k.move(s, payload, seat);
    s.moves++;
    if (out.end) { duelEnd(room, out.winner, out.reason); return; }
    if (!out.again) s.turn = 1 - s.turn;
    return;
  }

  if (action === 'nextRound') {
    // The round number was checked in applyRoomAction; this is the phase.
    if (s.phase !== 'over') return;
    if (!room.players.some(p => p.id === playerId) && room.hostId !== playerId) throw new Error('لست في الغرفة');
    duelSeatNext(room);
    s.prev = s.result;
    s.round = (s.round || 1) + 1;
    duelDeal(room, kind);
    return;
  }

  throw new Error('إجراء غير معروف');
};

const connect4Action = (room, playerId, action, payload) => duelAction(room, playerId, action, payload, 'connect4');
const dotsAction = (room, playerId, action, payload) => duelAction(room, playerId, action, payload, 'dots');

/**
 * Someone left. Out of the line; a seated player mid-game loses by forfeit and
 * the other takes the win; a champion who leaves between games leaves the seat
 * to the first two in line.
 */
const duelPlayerLeft = (room, playerId) => {
  const s = room.shared;
  if (!s || !s.phase) return;
  s.line = (s.line || []).filter(id => id !== playerId);
  if (s.streak && s.streak.id === playerId) s.streak = null;
  const seat = (s.seats || []).indexOf(playerId);
  if (s.phase === 'play' && seat !== -1) {
    s.moves = (s.moves || 0) + 1;
    duelEnd(room, 1 - seat, 'left');
    return;
  }
  if (s.champ === playerId) s.champ = null;
  s.board = scoreboardOf(room);
};
