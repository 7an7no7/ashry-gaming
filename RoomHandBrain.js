/* ============================================================================
   المخ والإيد — HAND AND BRAIN in rooms
   ----------------------------------------------------------------------------
   Bundled into the Worker after RoomChess.js (FILES in rooms-worker/build.mjs),
   whose board functions it plays on (chessBoardNew, chessBoardMove,
   chessBoardDeadline, chessBoardFlag, chessBoardResult).

   The owner's rules (24 Sep 2026):
   - 2 against 2: four seats, computer players (easy and hard) fill the empty
     ones. Each team has a Brain and a Hand.
   - On a team's move the Brain names a kind of piece (♔ ♕ ♖ ♗ ♘ ♙ - only the
     kinds with a legal move can be named), then the Hand plays any legal move
     of that kind. What the Brain named is public (it is said out loud in the
     real game); the Brain sees the board and can't move.
   - Roles are fixed for a game and swapped for the next (play again).
   - An optional clock, off by default: 5+0 or 10+0 per team.

   Decided here (open to change, each in one place):
   - The seats are the host's in the lobby, like الدومينو's: drawn at random
     (people first, then computer players), two taps swap two seats, 🔀 draws
     them again. Seat order: White's Brain, White's Hand, Black's Brain, Black's
     Hand. With more than four people the rest watch; with fewer, the empty
     seats are filled with easy computer players at the start (named by the
     host's phone, in its language).
   - Play again swaps each team's roles and the colours (the old Black team has
     White), as two on one phone swaps who has White.
   - A seated player who leaves mid-game: a computer player (easy) takes the
     seat for the rest of the game, so the other three can finish.
   - Resigning: either member of a team, for the team.
   - The host's "play for" a quiet phone does what an easy computer player
     would: names a kind, or plays a move of the named kind.
   - One thing to do is done for you: a Brain with only one kind that can move
     names it after a beat; a Hand with one legal move of the named kind plays
     it - unless it ends the game (a winning move stays a tap).

   shared:
     phase     'play' | 'over'
     settings  { clock: 'off' | '5+0' | '10+0' }
     lobby     { order: [4 ids] }               the host's seats, before a game
     teams     [[brain, hand], [brain, hand]]   index = colour (0 White)
     names     { pid: name }
     stage     'name' | 'move'
     named     { kind, n, by } | null            what the Brain said for move n
     calls     [{ n, team, kind, by }]           the last few names, for the log
     chess     ONE BOARD (chessBoardNew), with the clock chosen
     result    { result, reason, winner: 0 | 1 | null }
     tw        [white team's wins, black team's] - the games each team has won
     scores, board, round, roster
   Nothing is hidden: the whole game is on the table.
   ========================================================================= */

const HB_CLOCKS = ['off', '5+0', '10+0'];
const HB_SEATS = 4;
const HB_CALLS_KEPT = 10;
// A piece's kind as Chess.js numbers it: 1 pawn, 2 knight, 3 bishop, 4 rook, 5 queen, 6 king.
const HB_KINDS = [6, 5, 4, 3, 2, 1];

/** The kind of piece on square `sq` ('e2'). */
const hbKindAt = (g, sq) => g.board[chessSq(sq)] & 7;

/** The kinds that have a legal move now, in the Brain's order (king first). */
const hbKinds = (g) => {
  const have = {};
  chessLegalMoves(g).forEach(m => { have[hbKindAt(g, m.from)] = true; });
  return HB_KINDS.filter(k => have[k]);
};

/** The legal moves of one kind. */
const hbMovesOf = (g, kind) => chessLegalMoves(g).filter(m => hbKindAt(g, m.from) === kind);

/** Who acts now: the Brain of the team to move (naming), or its Hand (moving). */
const hbActor = (s) => {
  if (!s || s.phase !== 'play' || !s.chess || s.chess.result) return null;
  const team = (s.teams || [])[s.chess.g.turn] || [];
  return s.stage === 'name' ? team[0] : team[1];
};

/** Where a player sits: { team, role: 0 brain | 1 hand }, or null. */
const hbSeatOf = (s, pid) => {
  const t = (s && s.teams) || [];
  for (let k = 0; k < 2; k++) {
    const r = (t[k] || []).indexOf(pid);
    if (r !== -1) return { team: k, role: r };
  }
  return null;
};

/* --- the lobby: who sits where ----------------------------------------------------- */

/**
 * The four seats as the room stands: whoever already has a seat keeps it (an
 * id no longer here leaves it empty), then anyone here without one takes an
 * empty seat at random - people before computer players. Empty seats are null
 * (a computer player fills them at the start).
 */
const hbFitOrder = (room, order) => {
  const ids = room.players.map(p => p.id);
  const out = [null, null, null, null];
  if (Array.isArray(order)) order.slice(0, HB_SEATS).forEach((id, i) => { if (id && ids.indexOf(id) !== -1 && out.indexOf(id) === -1) out[i] = id; });
  const people = shuffled(room.players.filter(p => !p.bot && out.indexOf(p.id) === -1).map(p => p.id));
  const bots = shuffled(room.players.filter(p => p.bot && out.indexOf(p.id) === -1).map(p => p.id));
  const waiting = people.concat(bots);
  const empty = shuffled([0, 1, 2, 3].filter(i => !out[i]));
  while (empty.length && waiting.length) out[empty.pop()] = waiting.shift();
  return out;
};

/** Four seats drawn afresh: people first, at random. */
const hbDrawSeats = (room) => hbFitOrder(room, null);

/** Does `order` hold everyone who can sit, each once, and nobody gone? */
const hbOrderFits = (room, order) => {
  if (!Array.isArray(order) || order.length !== HB_SEATS) return false;
  const fit = hbFitOrder(room, order);
  return fit.every((id, i) => id === order[i]);
};

/** The host's seats: `{ shuffle }` draws again, `{ order }` is the host's own arrangement (two seats swapped), nothing keeps them in step with the room. */
const hbLobbySeats = (room, playerId, p) => {
  requireHost(room, playerId);
  if (room.phase !== 'lobby') return;
  room.shared = room.shared || {};
  const was = room.shared.lobby && room.shared.lobby.order;
  const asked = Array.isArray(p.order) && p.order.length === HB_SEATS ? p.order.map(x => (x ? String(x) : null)) : null;
  room.shared.lobby = { order: p.shuffle ? hbDrawSeats(room) : hbFitOrder(room, asked || was) };
};

/* --- a game ---------------------------------------------------------------------------- */

const hbSettings = (p, was) => ({
  clock: HB_CLOCKS.indexOf(String(p.clock)) !== -1 ? String(p.clock) : (HB_CLOCKS.indexOf(String(was.clock)) !== -1 ? String(was.clock) : 'off')
});

/** Empty seats get easy computer players, named from the host's list (`names`). */
const hbFillSeats = (room, order, names) => {
  const list = Array.isArray(names) ? names : [];
  let i = 0;
  return order.map(id => {
    if (id) return id;
    const name = uniqueBotName(room, list[i++] || 'Bot');
    const bot = { id: newBotId() + i, name: name, bot: 'easy' };
    room.players.push(bot);
    roomEvent(room, 'joined', { name: name, bot: true });
    return bot.id;
  });
};

const hbNewGame = (room, playerId, action, p) => {
  requireHost(room, playerId);
  const prev = room.shared || {};
  if (action === 'playAgain' && prev.phase !== 'over') return;
  if (!room.players.some(x => !x.bot)) throw new Error('محتاجين لاعب واحد على الأقل');
  let teams;
  const here = room.players.map(x => x.id);
  if (action === 'playAgain' && Array.isArray(prev.teams) && prev.teams.every(t => t.every(id => here.indexOf(id) !== -1))) {
    // Roles swap in each team, and the colours swap: the old Black team has White.
    teams = [[prev.teams[1][1], prev.teams[1][0]], [prev.teams[0][1], prev.teams[0][0]]];
  } else {
    const order = hbFillSeats(room, hbFitOrder(room, prev.lobby && prev.lobby.order), p.botNames);
    teams = [[order[0], order[1]], [order[2], order[3]]];
  }
  const seated = teams[0].concat(teams[1]);
  const names = {};
  seated.forEach(id => { names[id] = roomPlayerName(room, id); });
  const settings = hbSettings(p, action === 'playAgain' ? (prev.settings || {}) : {});
  room.shared = {
    phase: 'play',
    settings: settings,
    teams: teams,
    names: names,
    roster: room.players.map(x => x.id),
    round: (action === 'playAgain' ? (prev.round || 1) : 0) + 1,
    scores: action === 'playAgain' ? (prev.scores || {}) : {},
    // Games won by each team, across play again (the teams keep, the colours swap).
    tw: action === 'playAgain' && Array.isArray(prev.tw) ? [prev.tw[1] || 0, prev.tw[0] || 0] : [0, 0],
    chess: chessBoardNew(settings.clock),
    stage: 'name',
    named: null,
    calls: [],
    result: null,
    board: []
  };
  room.shared.board = scoreboardOf(room);
  room.secrets = {};
  room.phase = 'play';
};

const hbEnd = (room, res) => {
  const s = room.shared;
  s.result = { result: res.result, reason: res.reason, winner: res.winner === 0 || res.winner === 1 ? res.winner : null };
  if (s.result.winner !== null) {
    (s.teams[s.result.winner] || []).forEach(id => addScore(room, id, 1));
    s.tw[s.result.winner] = (s.tw[s.result.winner] || 0) + 1;
  }
  s.board = scoreboardOf(room);
  s.stage = null;
  s.named = null;
  s.phase = 'over';
  room.phase = 'over';
};

/** The Brain names a kind (checked: it has a legal move). */
const hbName = (room, kind) => {
  const s = room.shared;
  const bd = s.chess;
  const k = Number(kind);
  if (hbKinds(bd.g).indexOf(k) === -1) throw new Error('القطعة دي مالهاش نقلة دلوقتي');
  s.named = { kind: k, n: bd.moves, by: hbActor(s) };
  s.calls = (s.calls || []).concat([{ n: bd.moves, team: bd.g.turn, kind: k, by: s.named.by }]).slice(-HB_CALLS_KEPT);
  s.stage = 'move';
};

/** The Hand plays a move of the named kind. */
const hbMove = (room, p, auto) => {
  const s = room.shared;
  const bd = s.chess;
  const from = String(p.from || '');
  if (!s.named || hbKindAt(bd.g, from) !== s.named.kind || (bd.g.board[chessSq(from)] >> 3) !== bd.g.turn) {
    throw new Error('لازم تحرّك القطعة اللي المخ قالها');
  }
  const res = chessBoardMove(bd, bd.g.turn, { from: from, to: p.to, promo: p.promo }, Date.now());
  if (bd.last && bd.last.n === bd.moves) { bd.last.kind = s.named.kind; if (auto) bd.last.auto = auto; }
  if (res) { hbEnd(room, res); return; }
  s.stage = 'name';
  s.named = null;
};

/* --- the computer: a Brain and a Hand ------------------------------------------------- */

/** The kind a computer Brain names: the kind of the move its engine likes. */
const hbBotKind = (g, level) => {
  const mv = level === 'hard'
    ? chessBestMove(g, { elo: 1500, nodes: 1800, ms: 40 })
    : chessBestMove(g, { elo: 600, depth: 1, nodes: 300, ms: 20 });
  const kinds = hbKinds(g);
  const k = mv ? hbKindAt(g, mv.from) : 0;
  return kinds.indexOf(k) !== -1 ? k : kinds[0];
};

/**
 * The move a computer Hand plays of the named kind: a mate at once; otherwise
 * each move looked at one reply deep (captures followed), the best kept. Easy
 * plays one at random now and then. A few hundred positions a move at most:
 * the server's time is short.
 */
const hbBotMove = (g, kind, level) => {
  const moves = hbMovesOf(g, kind);
  if (!moves.length) return null;
  if (moves.length === 1) return moves[0];
  if (level !== 'hard' && Math.random() < 0.35) return moves[Math.floor(Math.random() * moves.length)];
  let best = null, bestScore = -Infinity;
  const nodes = level === 'hard' ? 140 : 50;
  moves.forEach(m => {
    const q = chessCloneGame(g);
    const info = chessPlay(q, m);
    if (!info) return;
    let sc;
    if (info.status.over) sc = info.status.reason === 'mate' ? 1e7 : 0;
    else {
      const a = chessAnalyse(q, { depth: 1, nodes: nodes, ms: 12 });
      sc = -a.score + (Math.random() * (level === 'hard' ? 4 : 30));
    }
    if (sc > bestScore) { bestScore = sc; best = m; }
  });
  return best || moves[0];
};

/** What a computer (or the host's "play for") does in the seat that acts now. */
const hbAutoMove = (room, level) => {
  const s = room.shared;
  const bd = s.chess;
  if (s.stage === 'name') return { action: 'name', payload: { kind: hbBotKind(bd.g, level), n: bd.moves } };
  const m = hbBotMove(bd.g, s.named.kind, level);
  return m ? { action: 'move', payload: { from: m.from, to: m.to, promo: m.promo, move: bd.moves } } : null;
};

const handBrainAction = (room, playerId, action, payload) => {
  const p = payload || {};
  if (action === 'seats') { hbLobbySeats(room, playerId, p); return; }
  if (action === 'start' || action === 'playAgain') { hbNewGame(room, playerId, action, p); return; }
  const s = room.shared;
  if (!s || !s.phase || !s.chess) throw new Error('اللعبة لم تبدأ بعد');
  const bd = s.chess;
  const seat = hbSeatOf(s, playerId);

  if (action === 'name') {
    if (s.phase !== 'play' || bd.result || s.stage !== 'name') return;
    if (staleTap(p, 'n', bd.moves)) return;
    if (hbActor(s) !== playerId) throw new Error(seat && seat.role === 0 ? 'مش دور فريقك' : 'المخ بس هو اللي يقول القطعة');
    hbName(room, p.kind);
    return;
  }

  if (action === 'move') {
    if (s.phase !== 'play' || bd.result || s.stage !== 'move') return;
    if (staleTap(p, 'move', bd.moves)) return;
    if (hbActor(s) !== playerId) throw new Error(seat && seat.role === 1 ? 'مش دور فريقك' : 'الإيد بس هي اللي تحرّك');
    hbMove(room, p);
    return;
  }

  if (action === 'resign') {
    if (s.phase !== 'play' || bd.result) return;
    if (!seat) throw new Error('انت بتتفرج دلوقتي');
    if (staleTap(p, 'round', s.round)) return;
    bd.endedAt = Date.now();
    hbEnd(room, chessBoardResult(bd, seat.team === 0 ? 'b' : 'w', 'resign'));
    return;
  }

  if (action === 'skipTurn') {
    // The host plays for a phone gone quiet, as an easy computer player would.
    requireHost(room, playerId);
    if (s.phase !== 'play' || bd.result || staleTap(p, 'move', bd.moves) || (p.stage && p.stage !== s.stage)) return;
    const mv = hbAutoMove(room, 'easy');
    if (!mv) return;
    if (mv.action === 'name') hbName(room, mv.payload.kind);
    else hbMove(room, mv.payload, 'host');
    return;
  }

  throw new Error('إجراء غير معروف');
};

/* --- the clock --------------------------------------------------------------------------- */

const hbDeadline = (room) => {
  const s = room.shared || {};
  return s.phase === 'play' ? chessBoardDeadline(s.chess) : null;
};

const hbTimeout = (room, now) => {
  const s = room.shared || {};
  if (s.phase !== 'play' || !s.chess) return false;
  const res = chessBoardFlag(s.chess, now);
  if (!res) return false;
  hbEnd(room, res);
  return true;
};

/* --- someone leaves: a computer player takes the seat ----------------------------------- */

const hbPlayerLeft = (room, playerId, name) => {
  const s = room.shared;
  if (!s) return;
  if (room.phase === 'lobby') {
    if (s.lobby && Array.isArray(s.lobby.order) && s.lobby.order.indexOf(playerId) !== -1) s.lobby = null;
    return;
  }
  const seat = hbSeatOf(s, playerId);
  if (!seat || s.phase !== 'play') { if (s.board) s.board = scoreboardOf(room); return; }
  const bot = { id: newBotId(), name: uniqueBotName(room, '🤖 ' + (name || s.names[playerId] || '')), bot: 'easy' };
  room.players.push(bot);
  s.teams[seat.team][seat.role] = bot.id;
  s.names[bot.id] = bot.name;
  s.roster = (s.roster || []).concat([bot.id]);
  s.took = { id: bot.id, name: name || s.names[playerId] || '' };
  if (s.named && s.named.by === playerId) s.named.by = bot.id;
};

/* --- the computer players and the forced moves --------------------------------------------- */

ROOM_BOT_GAMES.handbrain = {
  max: HB_SEATS,
  pending(room) {
    const s = room.shared;
    const pid = hbActor(s);
    if (!pid || !isRoomBot(room, pid)) return null;
    return { pid: pid, key: ['hb', s.round, s.chess.moves, s.stage].join('|') };
  },
  decide(room, pid) { return hbAutoMove(room, roomBotLevel(room, pid) || 'easy'); },
  fallback(room) {
    const s = room.shared;
    const bd = s.chess;
    if (s.stage === 'name') return { action: 'name', payload: { kind: hbKinds(bd.g)[0], n: bd.moves } };
    const m = hbMovesOf(bd.g, s.named.kind)[0];
    return m ? { action: 'move', payload: { from: m.from, to: m.to, promo: m.promo, move: bd.moves } } : null;
  }
};

ROOM_FORCED_GAMES.handbrain = (room) => {
  const s = room.shared;
  const pid = hbActor(s);
  if (!pid) return null;
  const bd = s.chess;
  const key = ['hb', s.round, bd.moves, s.stage].join('|');
  if (s.stage === 'name') {
    const kinds = hbKinds(bd.g);
    return kinds.length === 1 ? { pid: pid, key: key, move: { action: 'name', payload: { kind: kinds[0], n: bd.moves } } } : null;
  }
  const moves = hbMovesOf(bd.g, s.named.kind);
  if (moves.length !== 1 || moves[0].promo) return null;
  // A move that ends the game stays the player's own tap.
  const info = chessPlay(chessCloneGame(bd.g), moves[0]);
  if (!info || info.status.over) return null;
  return { pid: pid, key: key, move: { action: 'move', payload: { from: moves[0].from, to: moves[0].to, promo: '', move: bd.moves } } };
};
