/* ============================================================================
   باغ هاوس — BUGHOUSE in rooms: four players, two boards, the hands
   ----------------------------------------------------------------------------
   Bundled into the Worker after RoomChess.js (FILES in rooms-worker/build.mjs).
   The rules are Chess.js's (chessBugPlay and friends, shared with the page),
   so the server judges a move or a drop with the very code the phone lit its
   squares with.

   The owner's rules (24 Sep 2026): four on two boards, partners on different
   boards with opposite colours - A plays White on board 1, their partner
   Black on board 2. What you take goes to your partner's hand, and on your
   move you may drop a piece from your hand instead of moving. The clock is
   always on, 3+0 by default (2+0 / 3+0 / 5+0), and both boards' clocks run
   for the side to move all the time; a flag loses for the team, a mate on
   either board wins for the team that gave it. Computer players (easy, hard)
   fill empty seats; one who leaves is replaced on their board by a computer
   player for the rest of that game, so the other three can finish; play again
   turns the partners round.

   Nothing is hidden: the hands are on the table in bughouse. Everything is in
   shared:
     phase     'play' | 'over'
     round     the game's number (play again adds one)
     settings  { clock: '2+0' | '3+0' | '5+0' }
     seats     four player ids. Seat k plays on board k >> 1 with colour k & 1:
               0 board 1 White, 1 board 1 Black, 2 board 2 White, 3 board 2
               Black. Team A is seats 0 and 3, team B seats 1 and 2, so the
               partner of seat k is seat 3 - k.
     names     their names, as the seats were dealt
     subs      { seat: the name of who left } - a computer player plays on for them
     line      everyone who plays, in the order the seats are dealt from
     startAt   when the clocks start (a moment to look at the boards first)
     boards    two boards: { g (a bughouse game: hand, promoted), moves, sans,
               last, clock } - the clock { base, inc, left: [w, b], at } read
               with chessClockLeft
     result    { team: 'A' | 'B', board, seat (the side that lost), reason:
               'mate' | 'time' | 'resign', winners: [ids] }
     scores / board   games won, and the scoreboard
   ========================================================================= */

const BUG_CLOCKS = ['2+0', '3+0', '5+0'];
const BUG_START_MS = 3000;            // the boards on the screen before the clocks start
const BUG_THINK_MS = { easy: [1800, 3200], hard: [1100, 2300] };

const bugSeatBoard = (k) => k >> 1;
const bugSeatColor = (k) => k & 1;
const bugSeatTeam = (k) => (k === 0 || k === 3 ? 'A' : 'B');
const bugSeatOf = (b, color) => b * 2 + color;
const bugClockId = (v) => (BUG_CLOCKS.indexOf(String(v)) !== -1 ? String(v) : '3+0');

/** A board's clock: always running, from `at` (no free first move in bughouse). */
function bugClockNew(id, at) {
  const mins = Number(String(bugClockId(id)).split('+')[0]);
  return { id: bugClockId(id), base: mins * 60000, inc: 0, left: [mins * 60000, mins * 60000], at: at };
}

const bugBoardNew = (clockId, at) => ({ g: chessBugNew(), moves: 0, sans: [], last: null, clock: bugClockNew(clockId, at) });

/**
 * Who plays: the people in the room, and computer players for the seats left
 * (more than four people: the first four of the line, the rest watch).
 */
function bugDealSeats(room, order) {
  const s = room.shared;
  const four = order.slice(0, 4);
  // The line's first two are partners, and so are the next two.
  s.seats = [four[0], four[2], four[3], four[1]];
  s.names = s.seats.map(id => roomPlayerName(room, id));
  s.subs = {};
  s.line = order.slice();
}

/** The computer players a table short of four needs, named from the host's phone (botNames). */
function bugFillBots(room, need, names) {
  const pool = Array.isArray(names) && names.length ? names : ['Robo', 'Chip', 'Bit', 'Byte'];
  const out = [];
  for (let i = 0; i < need; i++) {
    const name = uniqueBotName(room, pool[i % pool.length]);
    const bot = { id: newBotId() + i, name: name, bot: 'easy' };
    room.players.push(bot);
    roomEvent(room, 'joined', { name: name, bot: true });
    out.push(bot.id);
  }
  return out;
}

function bugDeal(room) {
  const s = room.shared;
  const now = Date.now();
  s.startAt = now + BUG_START_MS;
  s.boards = [bugBoardNew(s.settings.clock, s.startAt), bugBoardNew(s.settings.clock, s.startAt)];
  s.result = null;
  s.phase = 'play';
  s.roster = s.seats.slice();
  room.phase = 'play';
}

/** The order the seats are dealt from: people first (at random), then the computer players. */
function bugStartOrder(room, payload) {
  const people = shuffled(room.players.filter(p => !p.bot).map(p => p.id));
  let bots = room.players.filter(p => p.bot).map(p => p.id);
  if (people.length >= 4) return people;
  if (people.length + bots.length < 4) bots = bots.concat(bugFillBots(room, 4 - people.length - bots.length, (payload || {}).botNames));
  // Four at most: a person and their partner, then two more - mixed at random.
  return shuffled(people.concat(bots.slice(0, 4 - people.length)));
}

/**
 * Play again: the partners turn round (the first of the line keeps their place,
 * the other three move on one), and anyone who watched comes in first.
 */
function bugNextOrder(room) {
  const s = room.shared;
  const here = (id) => room.players.some(p => p.id === id);
  const isBot = (id) => isRoomBot(room, id);
  const played = [s.seats[0], s.seats[3], s.seats[1], s.seats[2]].filter(here);
  const turned = played.length === 4 ? [played[0], played[2], played[3], played[1]] : played;
  const people = room.players.filter(p => !p.bot).map(p => p.id);
  if (people.length >= 4) {
    // Enough people: the computer players sit out; whoever watched plays first.
    const waiting = (s.line || []).filter(id => here(id) && !isBot(id) && turned.indexOf(id) === -1);
    const newcomers = people.filter(id => turned.indexOf(id) === -1 && waiting.indexOf(id) === -1);
    return waiting.concat(newcomers, turned.filter(id => !isBot(id)));
  }
  // Four seats or fewer people: everyone plays, a person who joined takes a computer player's seat.
  const order = turned.slice();
  people.filter(id => order.indexOf(id) === -1).forEach(id => {
    const b = order.findIndex(isBot);
    if (b !== -1) order[b] = id; else order.push(id);
  });
  room.players.filter(p => p.bot).forEach(p => { if (order.length < 4 && order.indexOf(p.id) === -1) order.push(p.id); });
  return order;
}

/** The game is over: the team, the reason, the scores; both clocks stop where they stand. */
function bugEnd(room, loserSeat, reason, now) {
  const s = room.shared;
  const t = now === undefined ? Date.now() : now;
  s.boards.forEach(bd => {
    const c = bd.clock;
    if (c && c.at !== null && c.at !== undefined) {
      const side = bd.g.turn;
      c.left[side] = Math.max(0, chessClockLeft(c, side, side, t));
      c.at = null;
    }
  });
  const team = bugSeatTeam(loserSeat) === 'A' ? 'B' : 'A';
  const winners = s.seats.filter((id, k) => bugSeatTeam(k) === team);
  s.result = { team: team, board: bugSeatBoard(loserSeat), seat: loserSeat, reason: reason, winners: winners };
  s.phase = 'over';
  room.phase = 'over';
  winners.forEach(id => addScore(room, id, 1));
  s.board = scoreboardOf(room);
}

/** One move or drop by the seat whose turn it is on its board. */
function bugPlay(room, seat, mv, now) {
  const s = room.shared;
  const b = bugSeatBoard(seat), color = bugSeatColor(seat);
  const bd = s.boards[b];
  if (bd.g.turn !== color) throw new Error('مش دورك');
  if (chessClockFlagged(bd.clock, color, now, CHESS_GRACE_MS)) { bugEnd(room, seat, 'time', now); return; }
  const info = chessBugPlay(bd.g, mv.drop ? { drop: mv.drop, to: mv.to } : { from: mv.from, to: mv.to, promo: mv.promo });
  if (!info) throw new Error('النقلة دي مش مسموحة');
  chessClockPress(bd.clock, color, now, CHESS_GRACE_MS, false);
  bd.moves++;
  bd.sans.push(info.san);
  if (info.gives) chessBugGive(s.boards.map(x => x.g), b, color, info.gives);
  bd.last = { from: info.from, to: info.to, drop: info.drop, san: info.san, piece: info.piece, capture: info.capture, captureSq: info.captureSq,
    castle: info.castle, promo: info.promo, check: info.check, gives: info.gives, seat: seat, n: bd.moves };
  if (mv.auto) bd.last.auto = mv.auto;
  if (info.status.over) bugEnd(room, bugSeatOf(b, bd.g.turn), 'mate', now);
}

function bughouseAction(room, playerId, action, payload) {
  const p = payload || {};
  if (action === 'start') {
    requireHost(room, playerId);
    const prev = room.shared || {};
    room.shared = { round: 1, scores: {}, board: [], settings: { clock: bugClockId(p.clock !== undefined ? p.clock : (prev.settings || {}).clock) } };
    bugDealSeats(room, bugStartOrder(room, p));
    bugDeal(room);
    room.shared.board = scoreboardOf(room);
    return;
  }

  const s = room.shared;
  if (!s || !s.phase || !Array.isArray(s.boards)) throw new Error('اللعبة لم تبدأ بعد');

  if (action === 'playAgain') {
    if (s.phase !== 'over' || staleTap(p, 'round', s.round)) return;
    if (!room.players.some(x => x.id === playerId && !x.bot) && room.hostId !== playerId) throw new Error('لست في الغرفة');
    if (p.clock !== undefined && room.hostId === playerId) s.settings.clock = bugClockId(p.clock);
    let order = bugNextOrder(room);
    if (order.length < 4) order = order.concat(bugFillBots(room, 4 - order.length, p.botNames));
    bugDealSeats(room, order);
    s.round = (s.round || 1) + 1;
    bugDeal(room);
    s.board = scoreboardOf(room);
    return;
  }

  const seat = s.seats.indexOf(playerId);
  const now = Date.now();

  if (action === 'move' || action === 'drop') {
    if (s.phase !== 'play') return;
    if (seat === -1) throw new Error('انت بتتفرج دلوقتي');
    const bd = s.boards[bugSeatBoard(seat)];
    // Drawn for a board that has moved on since: the second tap of a double tap.
    if (staleTap(p, 'move', bd.moves)) return;
    bugPlay(room, seat, action === 'drop' ? { drop: String(p.drop || ''), to: p.to } : { from: p.from, to: p.to, promo: p.promo }, now);
    return;
  }

  if (action === 'resign') {
    if (s.phase !== 'play') return;
    if (seat === -1) throw new Error('انت بتتفرج دلوقتي');
    if (staleTap(p, 'round', s.round)) return;
    bugEnd(room, seat, 'resign', now);
    return;
  }

  if (action === 'skipTurn') {
    // The host plays for a phone that went quiet on that board: the easy computer's move.
    requireHost(room, playerId);
    const b = Number(p.board) === 1 ? 1 : 0;
    const bd = s.boards[b];
    if (s.phase !== 'play' || staleTap(p, 'move', bd.moves)) return;
    const up = bugSeatOf(b, bd.g.turn);
    const mv = chessBugBotMove(bd.g, { level: 'easy' });
    if (!mv) return;               // nothing to play: waiting for a piece
    bugPlay(room, up, Object.assign({ auto: 'host' }, mv), now);
    return;
  }

  throw new Error('إجراء غير معروف');
}

/* --- the clocks: both boards, always running for the side to move --------------- */

function bugBoardDeadline(bd) {
  const c = bd && bd.clock;
  if (!c || c.at === null || c.at === undefined) return null;
  return c.at + c.left[bd.g.turn] + CHESS_GRACE_MS + 1;
}

function bughouseDeadline(room) {
  const s = room.shared || {};
  if (s.phase !== 'play' || !Array.isArray(s.boards)) return null;
  const list = s.boards.map(bugBoardDeadline).filter(x => x !== null);
  return list.length ? Math.min.apply(null, list) : null;
}

function bughouseTimeout(room, now) {
  const s = room.shared || {};
  if (s.phase !== 'play' || !Array.isArray(s.boards)) return false;
  // The board whose time ran out first.
  let first = -1, when = Infinity;
  s.boards.forEach((bd, b) => {
    const d = bugBoardDeadline(bd);
    if (d !== null && chessClockFlagged(bd.clock, bd.g.turn, now, CHESS_GRACE_MS) && d < when) { first = b; when = d; }
  });
  if (first === -1) return false;
  bugEnd(room, bugSeatOf(first, s.boards[first].g.turn), 'time', now);
  return true;
}

/* --- someone leaves: a computer player takes their board for the rest of the game --- */

function bughousePlayerLeft(room, playerId, name) {
  const s = room.shared;
  if (!s || !Array.isArray(s.seats)) return;
  const seat = s.seats.indexOf(playerId);
  if (s.phase === 'play' && seat !== -1) {
    const bot = { id: newBotId(), name: uniqueBotName(room, (name || s.names[seat] || '') + ' 🤖'), bot: 'hard' };
    room.players.push(bot);
    s.seats[seat] = bot.id;
    s.names[seat] = bot.name;
    s.subs = s.subs || {};
    s.subs[seat] = name || s.names[seat];
    s.line = (s.line || []).map(id => (id === playerId ? bot.id : id));
    s.board = scoreboardOf(room);
    return;
  }
  s.line = (s.line || []).filter(id => id !== playerId);
  s.board = scoreboardOf(room);
}

/* --- computer players: each thinks a human moment, measured from when its turn began --- */

/** How long this bot thinks for this move: steady for one moment (the same key, the same number). */
function bugThinkMs(level, key) {
  const [lo, hi] = BUG_THINK_MS[level === 'hard' ? 'hard' : 'easy'];
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) | 0;
  return lo + (Math.abs(h) % (hi - lo));
}

ROOM_BOT_GAMES.bughouse = {
  max: 4,
  pending: (room) => {
    const s = room.shared || {};
    if (s.phase !== 'play' || !Array.isArray(s.boards)) return null;
    const now = Date.now();
    let best = null;
    s.boards.forEach((bd, b) => {
      const pid = s.seats[bugSeatOf(b, bd.g.turn)];
      if (!isRoomBot(room, pid)) return;
      // Nothing to move and nothing to drop: it waits for its partner to send a piece.
      if (!chessLegalMoves(bd.g).length && !chessBugDrops(bd.g).length) return;
      const hand = bd.g.hand[bd.g.turn ? 'b' : 'w'];
      const key = [s.round, b, bd.moves, CHESS_BUG_KINDS.map(l => hand[l]).join('')].join('|');
      const began = Math.max(bd.clock.at || 0, s.startAt || 0);
      const at = began + bugThinkMs(roomBotLevel(room, pid), key);
      if (!best || at < best.at) best = { pid: pid, key: key, at: at };
    });
    return best ? { pid: best.pid, key: best.key, delay: Math.max(250, best.at - now) } : null;
  },
  decide: (room, pid) => {
    const s = room.shared;
    const seat = s.seats.indexOf(pid);
    if (s.phase !== 'play' || seat === -1) return null;
    const bd = s.boards[bugSeatBoard(seat)];
    if (bd.g.turn !== bugSeatColor(seat)) return null;
    const mv = chessBugBotMove(bd.g, { level: roomBotLevel(room, pid) });
    if (!mv) return null;
    return mv.drop ? { action: 'drop', payload: { drop: mv.drop, to: mv.to, move: bd.moves } }
      : { action: 'move', payload: { from: mv.from, to: mv.to, promo: mv.promo || '', move: bd.moves } };
  },
  fallback: (room, pid) => {
    const s = room.shared;
    const seat = s.seats.indexOf(pid);
    if (s.phase !== 'play' || seat === -1) return null;
    const bd = s.boards[bugSeatBoard(seat)];
    const mv = chessLegalMoves(bd.g)[0];
    if (mv) return { action: 'move', payload: { from: mv.from, to: mv.to, promo: mv.promo || '', move: bd.moves } };
    const d = chessBugDrops(bd.g)[0];
    return d ? { action: 'drop', payload: { drop: d.drop, to: d.to, move: bd.moves } } : null;
  }
};
