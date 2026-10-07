/* ==========================================================================
   كونكت ٤ · نقط ومربعات · إكس أو — THE DUELS IN ROOMS: WINNER STAYS ON
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
     result     { winner (seat or null), draw, reason: line | full | boxes | left | away,
                  winnerId, winnerName, loserId, loserName }
     turnAt     when the seat to move got the turn (the server's clock): «خسران غياب» counts from it
     prev       the result of the game before this one, for "last game" lines
     streak     { id, n }: the champion's wins in a row
     scores / board   wins so far, best first: the night's leaderboard banks it
     connect4:  mode (4 | 5 in a row), cols, rows, n, grid, win (the lit cells), last { seat, col, row }
     dots:      size (4 | 6 | 8), lines, boxes, count [seat 0, seat 1], last { seat, edge, boxes }
     xo:        three (the lobby's switch), rule3 (this game's), cells (the 9 squares: board is the
                scoreboard here), order { X, O }, win, last { seat, cell, gone }; size ('normal' |
                'big', the lobby's «المقاس») and big (this game's): a big game's cells are 81,
                minis the nine boards' results, send the board to play in (-1 anywhere), win the
                line of boards, last.took the board's result a move decided; result.reason
                'boards' when no line was left and the most boards won (or a draw)

   A room of four people or more may play a knockout tournament instead
   (RoomTournament.js, the owner's decision of 23 Sep 2026): duelAction hands
   every action to tourAction first, which runs each match's board through
   these same DUEL_KINDS.

   Decided for the owner (21 Sep 2026): a draw keeps the champion in the seat
   and sends the challenger to the back, like a loss; a seated player who
   leaves mid-game loses by forfeit (the other gets the win) and the next in
   line sits down when the game after is dealt; anyone in the room can deal
   the next game, since whoever is left at the table has to be able to.

   The review of 1 Oct 2026 (the owner: "apply the improvements"):
   - One thing to do is done for you: the last column of كونكت ٤, the last
     square of إكس أو and the last line of نقط ومربعات are played for the
     player after a beat (ROOM_FORCED_GAMES at the end) - never when that move
     wins, which stays the player's own tap.
   - «خسران غياب»: a seated phone that has been gone DUEL_AWAY_MS on its turn
     loses this game, as a loss on the board would (the line moves on, the
     player stays in the room; in a tournament it is that game lost). The
     server's clock does it (duelAwayDeadline / duelAwayTimeout), from
     room.lastSeen (room.js: when a phone's last socket went), so no phone
     has to be awake; every other phone and the TV count it down.
   ========================================================================== */
const DUEL_MIN_PLAYERS = 2;
/*
 * The think clock in winner stays (the owner's picks 1022 and 1031, 7 Oct 2026): the host's
 * lobby choice, off by default - كونكت ٤ 15 or 30 seconds a disc, نقط ومربعات 20 or 40 a line.
 * `shared.think` (seconds, 0 off) counts from `turnAt`; at 0 the server plays for the seat up
 * (DUEL_KINDS[kind].auto: a column that hands the other side no win, c4SafeCol; a line that
 * gives no box a third side when there is one) and marks the move `last.auto`. Not in a
 * tournament or كونكت ٤'s teams (their own clocks). The choices, DUEL_THINK, are in Duels.js.
 */
const DUEL_THINK_GRACE_MS = 800;     // the server plays this long after the phones' clocks reach 0
const duelThinkPick = (kind, p, q) => {
  const list = DUEL_THINK[kind] || [0];
  const v = Number((p || {}).think);
  if ((p || {}).think !== undefined && list.indexOf(v) !== -1) return v;
  const w = Number((q || {}).think);
  return list.indexOf(w) !== -1 ? w : 0;
};
// DUEL_AWAY_MS is in rooms/RoomShared.js; who sits down next, duelNextOf, in Duels.js (both read by the phones too).

/** What each duel does differently: its options, a fresh board, and one move. */
const DUEL_KINDS = {
  connect4: {
    options: (payload, prev) => ({ mode: c4Mode(payload && payload.mode !== undefined ? payload.mode : (prev || {}).mode), think: duelThinkPick('connect4', payload, prev) }),
    deal: (s) => {
      const b = c4NewBoard(s.mode);
      s.cols = b.cols; s.rows = b.rows; s.n = b.n; s.grid = b.grid;
      s.win = [];
    },
    move: (s, payload, seat) => {
      const board = { cols: s.cols, rows: s.rows, n: s.n, grid: s.grid };
      const col = Number(payload && payload.col);
      // «صدّة!» (7 Oct 2026): the disc lands where the other side would have won next.
      const block = c4DropRow(board, col) >= 0 && c4BlocksAt(board, col, seat + 1);
      const res = c4Play(board, col, seat + 1);
      if (!res) throw new Error('العمود ده مليان');
      s.last = { seat: seat, col: res.col, row: res.row };
      if (block) s.last.block = true;
      if (res.win) { s.win = res.cells; return { end: true, winner: seat, reason: 'line' }; }
      if (res.draw) return { end: true, winner: null, reason: 'full' };
      return { end: false, again: false };
    },
    only: (s, seat) => {
      const col = c4OnlyMove({ cols: s.cols, rows: s.rows, n: s.n, grid: s.grid || [] }, seat + 1);
      return col < 0 ? null : { col: col };
    },
    // The think clock ran out: a column that doesn't hand the other side a win.
    auto: (s, seat) => ({ col: c4SafeCol({ cols: s.cols, rows: s.rows, n: s.n, grid: s.grid.slice() }, seat + 1, Math.random) })
  },
  dots: {
    options: (payload, prev) => ({ size: dotsSize(payload && payload.size !== undefined ? payload.size : (prev || {}).size), think: duelThinkPick('dots', payload, prev) }),
    deal: (s) => {
      const b = dotsNewBoard(s.size);
      s.lines = b.lines; s.boxes = b.boxes;
      s.count = [0, 0];
      s.chain = null;
    },
    move: (s, payload, seat) => {
      const board = { n: s.size, lines: s.lines, boxes: s.boxes };
      const res = dotsPlay(board, Number(payload && payload.edge), seat + 1);
      if (!res) throw new Error('الخط ده اترسم خلاص');
      const c = dotsCounts(board);
      s.count = [c[1], c[2]];
      // «سلسلة» (7 Oct 2026): the run of boxes, counted on every phone (run) and closed with a stamp (runEnd).
      const step = dotsChainStep(s.chain, seat, res.boxes.length, res.over);
      s.chain = step.chain;
      s.last = { seat: seat, edge: res.edge, boxes: res.boxes, run: step.n, runEnd: step.ended };
      if (res.over) return { end: true, winner: c[1] > c[2] ? 0 : (c[2] > c[1] ? 1 : null), reason: 'boxes' };
      return { end: false, again: res.again };
    },
    only: (s, seat) => {
      const e = dotsOnlyMove({ n: s.size, lines: s.lines || [], boxes: s.boxes || [] }, seat + 1);
      return e < 0 ? null : { edge: e };
    },
    // The think clock ran out: a line that gives no box a third side when there is one,
    // else the one that gives the fewest boxes away.
    auto: (s) => {
      const board = { n: s.size, lines: s.lines.slice(), boxes: s.boxes.slice() };
      const safe = dotsSafe(board);
      if (safe.length) return { edge: safe[Math.floor(Math.random() * safe.length)] };
      return { edge: dotsCheapest(board, dotsFree(board), Math.random) };
    }
  },
  // إكس أو in rooms (23 Sep 2026): seat 0 is X and moves first; the lobby's
  // "3 marks only" switch (the owner's rule of 22 Sep 2026) is `three`, and a
  // game keeps the rule it was dealt with (`rule3`). The rules are TicTacToe.js.
  // «إكس أو الكبير» (the owner, 2 Oct 2026): the lobby's «المقاس» is `size`
  // ('normal' | 'big'), and a game keeps the size it was dealt (`big`): 81
  // `cells` (board b's square i at b * 9 + i), `minis` (each board's result),
  // `send` (the board to play in, -1 anywhere), `win` the line of boards. The
  // 3-marks rule is the normal size's only. The rules are TicTacToe.js.
  xo: {
    options: (payload, prev) => {
      const p = payload || {}, q = prev || {};
      const size = p.size === 'big' || p.size === 'normal' ? p.size : (q.size === 'big' ? 'big' : 'normal');
      return { three: typeof p.three === 'boolean' ? p.three : !!q.three, size: size };
    },
    deal: (s) => {
      s.big = s.size === 'big';
      if (s.big) {
        const g = xoBigNew();
        s.cells = g.cells; s.minis = g.minis; s.send = g.send;
      } else {
        s.cells = ['', '', '', '', '', '', '', '', ''];
        delete s.minis; delete s.send;
      }
      s.order = { X: [], O: [] };
      s.rule3 = !!s.three && !s.big;
      s.win = [];
    },
    move: (s, payload, seat) => {
      const mark = seat === 0 ? 'X' : 'O';
      const cell = Number(payload && payload.cell);
      if (s.big) {
        const g = { cells: s.cells, minis: s.minis, send: s.send };
        const r = xoBigMark(g, cell, mark);
        if (!r) throw new Error(s.send >= 0 && Math.floor(cell / 9) !== s.send ? 'العب في اللوحة اللي اتبعتلها' : 'المربع ده مش متاح');
        s.send = g.send;
        s.last = { seat: seat, cell: cell, gone: -1, took: r.took };
        if (!r.took) return { end: false, again: false };
        const w = xoBigWinner(s.minis);
        if (!w) return { end: false, again: false };
        if (w.line) { s.win = w.line; return { end: true, winner: seat, reason: 'line' }; }
        return { end: true, winner: w.mark === 'D' ? null : (w.mark === 'X' ? 0 : 1), reason: 'boards' };
      }
      const placed = xoMark(s.cells, s.order, s.rule3, cell, mark);
      if (!placed) throw new Error('المربع ده مش فاضي');
      s.last = { seat: seat, cell: cell, gone: placed.gone };
      const w = xoWinner(s.cells);
      if (w && w.mark !== 'D') { s.win = w.line; return { end: true, winner: seat, reason: 'line' }; }
      if (w) return { end: true, winner: null, reason: 'full' };
      return { end: false, again: false };
    },
    only: (s, seat) => {
      const cell = s.big ? xoBigOnlyMove({ cells: s.cells || [], minis: s.minis || [], send: s.send }, seat === 0 ? 'X' : 'O')
        : xoOnlyMove(s.cells || [], !!s.rule3, seat === 0 ? 'X' : 'O');
      return cell < 0 ? null : { cell: cell };
    }
  }
};

const duelHere = (room) => room.players.map(p => p.id);

/**
 * Who is waiting, in order: the line as it was, then anyone in the room who
 * is on it nowhere yet (they joined since), less `exclude` and anyone gone.
 */
const duelWaiting = (room, exclude) => duelWaitingOf(room.players, room.shared, exclude);   // Duels.js

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
  const next = duelNextOf(room.players, s);   // Duels.js: the phones show the same
  if (!next) throw new Error('تحتاج لاعبين على الأقل');
  const seats = next.seats, line = next.line;
  // Everyone who has sat down this session (winner stays): the night banks them all, not
  // only the pair at the table when the room moves on (nightPlayedIds).
  s.sat = (s.sat || []).concat(Array.isArray(s.seats) ? s.seats : [], seats).filter((id, i, a) => id && a.indexOf(id) === i);
  s.seats = seats;
  s.seatNames = seats.map(id => roomPlayerName(room, id));
  s.line = line;
};

/** A fresh board for the seats just set. */
const duelDeal = (room, kind) => {
  const s = room.shared;
  s.turn = 0;
  s.moves = 0;
  s.turnAt = Date.now();
  s.last = null;
  s.result = null;
  s.roster = duelHere(room);
  DUEL_KINDS[kind].deal(s);
  s.phase = 'play';
  room.phase = 'play';
};

const duelAction = (room, playerId, action, payload, kind) => {
  // كونكت ٤ team against team (2 Oct 2026, below): its lobby, its start and its whole game.
  if (kind === 'connect4' && c4tAction(room, playerId, action, payload)) return;
  // A knockout tournament (RoomTournament.js) runs the same boards, one per match.
  if (tourAction(room, playerId, action, payload, kind)) return;
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
    duelCountBlock(s, playerId);
    s.moves++;
    if (out.end) { duelEnd(room, out.winner, out.reason); return; }
    if (!out.again) s.turn = 1 - s.turn;
    s.turnAt = Date.now();
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

/**
 * «صدّة!» (كونكت ٤, the owner's pick of 7 Oct 2026): a disc that took the other
 * side's winning square counts a block for whoever dropped it, kept across the
 * room's games (`blocks`, { pid: n }); the result card names the best blocker.
 */
const duelCountBlock = (s, pid) => {
  if (!pid || !s.last || !s.last.block) return;
  s.blocks = s.blocks || {};
  s.blocks[pid] = (Number(s.blocks[pid]) || 0) + 1;
};

const connect4Action = (room, playerId, action, payload) => duelAction(room, playerId, action, payload, 'connect4');
const dotsAction = (room, playerId, action, payload) => duelAction(room, playerId, action, payload, 'dots');
const xoRoomAction = (room, playerId, action, payload) => duelAction(room, playerId, action, payload, 'xo');

/**
 * Someone left. Out of the line; a seated player mid-game loses by forfeit and
 * the other takes the win; a champion who leaves between games leaves the seat
 * to the first two in line.
 */
const duelPlayerLeft = (room, playerId) => {
  const s = room.shared;
  if (!s || !s.phase) return;
  if (s.teamMode) { c4tPlayerLeft(room, playerId); return; }
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

/* --- the review of 1 Oct 2026: the move made for you, and «خسران غياب» ------------- */

/** The seat to move's only move, when it is known and doesn't win: { seat, payload }, or null. */
const duelOnlyMove = (s, kind) => {
  const k = DUEL_KINDS[kind];
  if (!s || s.phase !== 'play' || !k || !k.only || !Array.isArray(s.seats)) return null;
  const payload = k.only(s, s.turn);
  return payload ? { seat: s.turn, payload: payload } : null;
};

/**
 * ROOM_FORCED_GAMES for a duel: the only move of whoever is up - in winner
 * stays, or in a tournament's matches (the first one with such a move; the
 * next once it is made).
 */
const duelForced = (kind) => (room) => {
  const s = room.shared || {};
  if (s.teamMode) return c4tForced(room);
  if (s.tour) {
    const t = s.tour;
    if (t.phase !== 'play') return null;
    for (const m of t.matches) {
      if (m.state !== 'play') continue;
      const g = (s.games || {})[m.id];
      const f = duelOnlyMove(g, kind);
      if (!f) continue;
      return {
        pid: g.seats[f.seat],
        key: ['tm', m.id, m.games, g.moves].join('|'),
        move: { action: 'move', payload: Object.assign({ match: m.id, mg: m.games, move: g.moves }, f.payload) }
      };
    }
    return null;
  }
  const f = duelOnlyMove(s, kind);
  if (!f) return null;
  return { pid: s.seats[f.seat], key: [s.round, s.moves].join('|'), move: { action: 'move', payload: Object.assign({ move: s.moves }, f.payload) } };
};
ROOM_FORCED_GAMES.connect4 = duelForced('connect4');
ROOM_FORCED_GAMES.dots = duelForced('dots');
ROOM_FORCED_GAMES.xo = duelForced('xo');

/**
 * When the seat to move loses by being away: DUEL_AWAY_MS after their phone
 * went (room.lastSeen, kept by room.js), or after the turn came to them if
 * they were gone already. Null while they are here. `v` is the room, or a
 * tournament match's small room (tourRoomOf).
 */
const duelAwayDeadline = (v) => {
  const s = (v && v.shared) || {};
  if (s.phase !== 'play' || !Array.isArray(s.seats)) return null;
  const think = duelThinkDeadline(v);
  const pid = s.seats[s.turn];
  const since = pid && v.lastSeen ? Number(v.lastSeen[pid]) || 0 : 0;
  if (!since) return think;
  const away = Math.max(since, Number(s.turnAt) || 0) + DUEL_AWAY_MS;
  return think === null ? away : Math.min(away, think);
};

/**
 * When the think clock plays for the seat up (its seconds and the grace after `turnAt`), or
 * null: off, not winner stays (a tournament's match has no `line`), or a game with no `auto`.
 */
const duelThinkDeadline = (v) => {
  const s = (v && v.shared) || {};
  const k = DUEL_KINDS[v && v.game];
  if (s.phase !== 'play' || !Array.isArray(s.seats) || !Array.isArray(s.line) || s.teamMode || !k || !k.auto) return null;
  const sec = Number(s.think) || 0;
  if (!sec || (DUEL_THINK[v.game] || []).indexOf(sec) === -1) return null;
  return (Number(s.turnAt) || 0) + sec * 1000 + DUEL_THINK_GRACE_MS;
};

/**
 * The seat to move has been gone long enough: they lose this game; or their think clock ran
 * out: the server plays for them (marked `last.auto`, never counted a block). True when it acted.
 */
const duelAwayTimeout = (v, now) => {
  const due = duelAwayDeadline(v);
  if (due === null || now < due) return false;
  const s = v.shared;
  const think = duelThinkDeadline(v);
  // A seat gone DUEL_AWAY_MS loses by away even with the think clock on: each auto-move
  // resets turnAt, so the away time alone would never come (audit 7 Oct 2026, B1).
  const pid = s.seats[s.turn];
  const since = pid && v.lastSeen ? Number(v.lastSeen[pid]) || 0 : 0;
  const goneLong = !!since && now - since >= DUEL_AWAY_MS;
  if (!goneLong && think !== null && now >= think && due === think) {
    const k = DUEL_KINDS[v.game];
    const seat = s.turn;
    const out = k.move(s, k.auto(s, seat), seat);
    if (s.last) { s.last.auto = true; delete s.last.block; }
    s.moves = (s.moves || 0) + 1;
    if (out.end) { duelEnd(v, out.winner, out.reason); return true; }
    if (!out.again) s.turn = 1 - s.turn;
    s.turnAt = now;
    return true;
  }
  s.moves = (s.moves || 0) + 1;
  duelEnd(v, 1 - s.turn, 'away');
  return true;
};

/* --- كونكت ٤ team against team, «أحمر ضد أصفر» (the owner, 2 Oct 2026) --------------
   A lobby switch «فرق» from four people (off by default; winner stays and the
   tournament are untouched). Everyone picks a side on their own phone (red or
   yellow; the host may move anyone); Start needs at least one on each side,
   lopsided allowed. A relay: the team's members drop the team's disc in turn,
   one by one, 20 seconds a turn on the server's clock; when it runs out the app
   drops in a column that doesn't hand the other team a win (c4SafeCol) and the
   screens say so (shared.auto). The winning team's members each score the win;
   the night places the teams (PROGRAM_TEAMS.connect4: the team with more wins
   first, every member sharing its place).

   shared (in teams, beside the board fields of DUEL_KINDS.connect4):
     teamMode  true          teams   [[red ids in relay order], [yellow ids]]
     turn      the team to move (0 red = disc 1, 1 yellow = disc 2)
     relay     [i0, i1]: each team's next member, counted on (mod the team's size)
     upId      the member up; endsAt  when their 20 s run out (the server's clock)
     starts    the team that moved first this game (the next game the other starts)
     teamWins  [red, yellow] across the games; scores / board  each member's wins
     auto      { team, pid, col, moves } the last disc the clock dropped, until a person drops one
     result    { winner (team or null), draw, reason: line | full | left }
     last      as in winner stays (seat = the team), and pid: who dropped it
   The lobby keeps shared.lobby = { teams, sides: { pid: 0 | 1 } }; the sides are
   remembered on the room (room._c4Sides) for the next time teams are switched on.

   Decided here (open to change): someone who hasn't picked a side when Start is
   pressed goes to the smaller side (a coin on a tie); each team's relay order is
   drawn at the start and kept, its turn carrying on into the next game; the team
   that started goes second next game; latecomers join the smaller side at «ماتش
   كمان», and a side left empty there takes one member of the other side at random;
   the clock never takes a win for the team that ran out unless every other column
   hands the win over; computer players sit teams out.
   ========================================================================== */
const C4T_TURN_MS = 20000;
const C4T_GRACE_MS = 800;          // the server acts this long after the phones' clocks reach 0
const C4T_MIN_PEOPLE = 4;

const c4tPeople = (room) => room.players.filter(p => !p.bot).map(p => p.id);

/** The lobby's sides as they stand: people still here, on 0 or 1. */
const c4tLobbySides = (room) => {
  const l = (room.shared && room.shared.lobby) || {};
  const here = c4tPeople(room);
  const out = {};
  Object.keys(l.sides || {}).forEach(id => { if (here.indexOf(id) !== -1 && (l.sides[id] === 0 || l.sides[id] === 1)) out[id] = l.sides[id]; });
  return out;
};

/** Everyone in `ids` without a side goes to the smaller side (a coin on a tie), in room order. */
const c4tFill = (teams, ids) => {
  ids.forEach(id => {
    if (teams[0].indexOf(id) !== -1 || teams[1].indexOf(id) !== -1) return;
    const k = teams[0].length === teams[1].length ? (Math.random() < 0.5 ? 0 : 1) : (teams[0].length < teams[1].length ? 0 : 1);
    teams[k].push(id);
  });
  return teams;
};

const c4tUp = (s) => {
  const team = (s.teams || [])[s.turn] || [];
  if (!team.length) return null;
  return team[((Number((s.relay || [])[s.turn]) || 0) % team.length + team.length) % team.length];
};

/** The member up gets the turn and 20 seconds. */
const c4tArm = (s) => {
  s.upId = c4tUp(s);
  s.turnAt = Date.now();
  s.endsAt = s.turnAt + C4T_TURN_MS;
};

const c4tDeal = (room) => {
  const s = room.shared;
  s.moves = 0;
  s.last = null;
  s.result = null;
  s.auto = null;
  s.roster = s.teams[0].concat(s.teams[1]);
  DUEL_KINDS.connect4.deal(s);
  s.turn = s.starts;
  s.phase = 'play';
  room.phase = 'play';
  room._c4Sides = {};
  s.teams.forEach((tm, k) => tm.forEach(id => { room._c4Sides[id] = k; }));
  c4tArm(s);
};

const c4tStart = (room, playerId, payload) => {
  requireHost(room, playerId);
  const people = c4tPeople(room);
  if (people.length < C4T_MIN_PEOPLE) throw new Error('الفرق محتاجة 4 على الأقل');
  const sides = c4tLobbySides(room);
  const picked = [people.filter(id => sides[id] === 0), people.filter(id => sides[id] === 1)];
  if (!picked[0].length || !picked[1].length) throw new Error('محتاجين واحد على الأقل في كل فريق');
  const teams = c4tFill(picked, people).map(tm => shuffled(tm));
  room.shared = Object.assign({
    teamMode: true,
    round: 1,
    teams: teams,
    relay: [0, 0],
    starts: Math.random() < 0.5 ? 0 : 1,
    teamWins: [0, 0],
    prev: null,
    scores: {},
    board: []
  }, DUEL_KINDS.connect4.options(payload, null));
  c4tDeal(room);
  room.shared.board = scoreboardOf(room);
};

/** A game is over: the winning team's members each score it. `winner` is a team or null. */
const c4tEnd = (room, winner, reason) => {
  const s = room.shared;
  const won = winner === 0 || winner === 1;
  if (won) {
    s.teamWins = s.teamWins || [0, 0];
    s.teamWins[winner] += 1;
    s.teams[winner].forEach(id => addScore(room, id, 1));
  }
  s.result = { winner: won ? winner : null, draw: !won, reason: reason };
  s.upId = null;
  s.endsAt = null;
  s.board = scoreboardOf(room);
  s.phase = 'over';
  room.phase = 'over';
};

/** The team's disc in column `col`, by the member up (or by the clock, `auto`). */
const c4tDrop = (room, col, auto) => {
  const s = room.shared;
  const team = s.turn;
  const pid = s.upId;
  const out = DUEL_KINDS.connect4.move(s, { col: col }, team);
  s.last.pid = pid;
  // A block the clock's disc made is nobody's.
  if (!auto) duelCountBlock(s, pid);
  else if (s.last.block) delete s.last.block;
  s.moves++;
  s.relay[team] = (Number(s.relay[team]) || 0) + 1;
  s.auto = auto ? { team: team, pid: pid, col: col, moves: s.moves } : null;
  if (out.end) { c4tEnd(room, out.winner, out.reason); return; }
  s.turn = 1 - team;
  c4tArm(s);
};

/** The next game's sides: who is still here, latecomers on the smaller side, never a side empty. */
const c4tNextTeams = (room) => {
  const s = room.shared;
  const here = c4tPeople(room);
  const teams = (s.teams || [[], []]).map(tm => tm.filter(id => here.indexOf(id) !== -1));
  c4tFill(teams, here);
  [0, 1].forEach(k => {
    if (!teams[k].length && teams[1 - k].length >= 2) {
      const from = teams[1 - k];
      const id = from[Math.floor(Math.random() * from.length)];
      teams[1 - k] = from.filter(x => x !== id);
      teams[k] = [id];
    }
  });
  if (!teams[0].length || !teams[1].length) throw new Error('محتاجين واحد على الأقل في كل فريق');
  s.teams = teams;
};

/** Lobby and game actions of the team way; false for anything else (winner stays, the tournament). */
const c4tAction = (room, playerId, action, payload) => {
  const p = payload || {};
  if (room.phase === 'lobby') {
    if (action === 'teams') {
      requireHost(room, playerId);
      room.shared = room.shared || {};
      const l = room.shared.lobby || (room.shared.lobby = { teams: false, sides: {} });
      l.teams = !!p.on;
      // The sides picked the last time teams were played in this room come back.
      if (l.teams && !Object.keys(l.sides || {}).length && room._c4Sides) l.sides = Object.assign({}, room._c4Sides);
      return true;
    }
    if (action === 'side') {
      const l = (room.shared && room.shared.lobby) || {};
      if (!l.teams) throw new Error('الفرق مقفولة');
      const who = p.playerId && String(p.playerId) !== playerId ? String(p.playerId) : playerId;
      if (who !== playerId) requireHost(room, playerId);
      if (c4tPeople(room).indexOf(who) === -1) throw new Error('لست في الغرفة');
      const side = p.side === 0 || p.side === 1 ? p.side : null;
      l.sides = l.sides || {};
      if (side === null) delete l.sides[who]; else l.sides[who] = side;
      return true;
    }
    if (action === 'start' && room.shared && room.shared.lobby && room.shared.lobby.teams) { c4tStart(room, playerId, p); return true; }
    return false;
  }
  const s = room.shared;
  if (!s || !s.teamMode) return false;
  if (action === 'move') {
    if (s.phase !== 'play') return true;
    if (staleTap(p, 'move', s.moves)) return true;
    if (!s.teams.some(tm => tm.indexOf(playerId) !== -1)) throw new Error('انت بتتفرج دلوقتي، هتلعب الماتش الجاي');
    if (playerId !== s.upId) throw new Error('مش دورك');
    if (c4DropRow({ cols: s.cols, rows: s.rows, n: s.n, grid: s.grid }, Number(p.col)) < 0) throw new Error('العمود ده مليان');
    c4tDrop(room, Number(p.col), false);
    return true;
  }
  if (action === 'nextRound') {
    if (s.phase !== 'over') return true;
    if (!room.players.some(x => x.id === playerId) && room.hostId !== playerId) throw new Error('لست في الغرفة');
    c4tNextTeams(room);
    s.prev = s.result;
    s.round = (s.round || 1) + 1;
    s.starts = s.starts === 1 ? 0 : 1;
    c4tDeal(room);
    s.board = scoreboardOf(room);
    return true;
  }
  throw new Error('إجراء غير معروف');
};

/** The server's clock: the member up has had their 20 seconds (and the grace). */
const c4tDeadline = (room) => {
  const s = room.shared || {};
  return s.teamMode && s.phase === 'play' && s.endsAt ? s.endsAt + C4T_GRACE_MS : null;
};

const c4tTimeout = (room, now) => {
  const due = c4tDeadline(room);
  if (due === null || now < due) return false;
  const s = room.shared;
  const col = c4SafeCol({ cols: s.cols, rows: s.rows, n: s.n, grid: s.grid.slice() }, s.turn + 1, Math.random);
  if (col < 0) return false;
  c4tDrop(room, col, true);
  return true;
};

/** Someone left: off their team; their turn passes to the next member; a team left empty loses. */
const c4tPlayerLeft = (room, playerId) => {
  const s = room.shared;
  const k = (s.teams || []).findIndex(tm => tm.indexOf(playerId) !== -1);
  if (k === -1) { s.board = scoreboardOf(room); return; }
  const tm = s.teams[k];
  const at = tm.indexOf(playerId);
  const len = tm.length;
  let next = ((Number(s.relay[k]) || 0) % len + len) % len;
  if (at < next) next -= 1;
  s.teams[k] = tm.filter(id => id !== playerId);
  s.relay[k] = s.teams[k].length ? next % s.teams[k].length : 0;
  if (s.phase === 'play') {
    if (!s.teams[k].length) {
      s.moves = (s.moves || 0) + 1;
      c4tEnd(room, 1 - k, 'left');
      return;
    }
    if (s.upId === playerId) c4tArm(s);
  }
  s.board = scoreboardOf(room);
};

/** One column left that doesn't win: dropped for the member up after a beat (ROOM_FORCED_GAMES). */
const c4tForced = (room) => {
  const s = room.shared || {};
  if (s.phase !== 'play' || !s.upId) return null;
  const col = c4OnlyMove({ cols: s.cols, rows: s.rows, n: s.n, grid: s.grid || [] }, s.turn + 1);
  if (col < 0) return null;
  return { pid: s.upId, key: ['t', s.round, s.moves].join('|'), move: { action: 'move', payload: { col: col, move: s.moves } } };
};

/** The night's places in teams: the side with more wins first, every member sharing its place; level, both first. */
const c4TeamPlaces = (room) => {
  const s = room.shared || {};
  if (!s.teamMode || !Array.isArray(s.teams)) return null;
  const w = s.teamWins || [0, 0];
  if (w[0] === w[1]) return w[0] > 0 || s.phase === 'over' ? [s.teams[0].concat(s.teams[1])] : null;
  const k = w[0] > w[1] ? 0 : 1;
  return [s.teams[k].slice(), s.teams[1 - k].slice()];
};
