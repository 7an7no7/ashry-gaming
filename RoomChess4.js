/* ============================================================================
   شطرنج الأربعة — FOUR-PLAYER CHESS (rooms)
   ----------------------------------------------------------------------------
   Bundled into the Worker after RoomChess.js (FILES in rooms-worker/build.mjs),
   so it uses RoomGames.js's helpers (requireHost, staleTap, isRoomBot,
   uniqueBotName…) and registers its computer players in ROOM_BOT_GAMES. The
   board and the rules are Chess4.js, shared with the page; this file is what a
   room adds: the lobby (the way to play, the clock, who sits in which colour),
   the moves, the clock, the host's "play for", leaving, the bots, play again.

   The owner's rules (24 Sep 2026, notes/BATCH5_RUNBOOK.md):
     - Rooms only, every player on their own phone, the TV optional.
     - Two ways, a lobby choice: teams (the default; red + yellow against blue +
       green) and everyone for themselves (FFA, chess.com's points).
     - Computer players (easy, hard) fill the empty colours: the host may seat
       them in the lobby, and any colour still empty at the start gets an easy one.
     - The host places who sits where (partners are the opposite colours);
       play again keeps the table and turns it by one, so red - who moves
       first - is someone else each game.
     - A clock is the host's choice: off, or 1, 3 or 5 minutes each with 5
       seconds added a move. Running out is out (FFA) or the team's loss.
     - The host can "play for" a phone that went quiet: an easy computer move,
       marked as such.
     - Someone who leaves: FFA - out, their pieces grey walls; teams - a
       computer player takes their seat for the rest of the game.

   Nothing is hidden: the whole game is in `shared`. Every move carries `seq`
   (shared.turnSeq, raised whenever the turn moves), so a tap that arrives
   after the table moved on is dropped without a word.
   ========================================================================= */

const CHESS4_GRACE_MS = 600;       // a move reaching the server this long after the flag still counts
const CHESS4_LOG_MAX = 80;

const chess4Shared = (room) => room.shared || (room.shared = {});

/** The lobby: the way to play, the clock, and the colours as the host set them. */
const chess4RoomLobby = (room) => {
  const s = chess4Shared(room);
  const lobby = s.lobby || (s.lobby = {});
  if (CHESS4_MODES.indexOf(lobby.mode) === -1) lobby.mode = 'teams';
  if (CHESS4_CLOCKS.indexOf(Number(lobby.clock)) === -1) lobby.clock = 0;
  if (!Array.isArray(lobby.order)) lobby.order = [null, null, null, null];
  return lobby;
};

/**
 * Who sits in which colour if the game started now: the host's order, anyone
 * missing replaced by the next in the room (people first, then computer
 * players). Mirrored by chess4RoomOrder in JS_RoomChess4.html - keep the two in step.
 */
const chess4LobbyOrder = (room) => {
  const lobby = ((room.shared || {}).lobby) || {};
  const ids = room.players.map(p => p.id);
  const order = [0, 1, 2, 3].map(k => {
    const id = Array.isArray(lobby.order) ? lobby.order[k] : null;
    return id && ids.indexOf(id) !== -1 ? id : null;
  });
  const waiting = room.players.filter(p => !p.bot).concat(room.players.filter(p => p.bot)).map(p => p.id)
    .filter(id => order.indexOf(id) === -1 && (lobby.watch || []).indexOf(id) === -1);
  for (let k = 0; k < 4; k++) if (!order[k] && waiting.length) order[k] = waiting.shift();
  return order;
};

/** The host sets the way to play and the clock (everyone sees them in the lobby). */
const chess4RoomOptions = (room, playerId, p) => {
  requireHost(room, playerId);
  if (room.phase !== 'lobby') return;
  const lobby = chess4RoomLobby(room);
  if (CHESS4_MODES.indexOf(p.mode) !== -1) lobby.mode = p.mode;
  if (CHESS4_CLOCKS.indexOf(Number(p.clock)) !== -1) lobby.clock = Number(p.clock);
};

/**
 * The host places the table: `order` is four player ids (or empty) by colour,
 * red, blue, yellow, green. Anyone in the room left out of it watches.
 */
const chess4RoomSeats = (room, playerId, p) => {
  requireHost(room, playerId);
  if (room.phase !== 'lobby') return;
  const lobby = chess4RoomLobby(room);
  const ids = room.players.map(x => x.id);
  const raw = Array.isArray(p.order) ? p.order.slice(0, 4) : [];
  const order = [0, 1, 2, 3].map(k => {
    const id = raw[k] ? String(raw[k]) : null;
    return id && ids.indexOf(id) !== -1 ? id : null;
  });
  if (new Set(order.filter(Boolean)).size !== order.filter(Boolean).length) throw new Error('كل واحد في لون واحد بس');
  lobby.order = order;
  // Someone the host took off the table watches (and isn't sat down again by the fill).
  lobby.watch = ids.filter(id => order.indexOf(id) === -1 && Array.isArray(p.watch) && p.watch.indexOf(id) !== -1);
};

/** The night's table: everyone who played, with their wins at this game tonight. */
const chess4Board = (room) => {
  const s = room.shared;
  const wins = s.wins || {};
  return (s.seats || [])
    .filter(id => id && room.players.some(p => p.id === id))
    .map(id => ({ id: id, name: roomPlayerName(room, id), score: wins[id] || 0 }))
    .sort((a, b) => b.score - a.score);
};

const chess4Log = (s, entry) => {
  s.eventSeq = (s.eventSeq || 0) + 1;
  entry.n = s.eventSeq;
  s.log = (s.log || []).concat([entry]).slice(-CHESS4_LOG_MAX);
};

/** A bot for an empty colour (or a leaver's seat): an ordinary computer player in the room. */
const chess4SeatBot = (room, name, level) => {
  const bot = { id: newBotId(), name: uniqueBotName(room, name), bot: ROOM_BOT_LEVELS.indexOf(level) !== -1 ? level : 'easy' };
  room.players.push(bot);
  return bot;
};

/** The clock of the player now up: it runs once they have made their first move of the game. */
const chess4ClockTurn = (s, now) => {
  const c = s.clock;
  if (!c) return;
  const g = s.g;
  c.at = !g.over && c.moved[g.turn] ? now : null;
};

/** After anything that moved the game on: the turn's clock, the end, the wins, the board. */
const chess4After = (room, info) => {
  const s = room.shared;
  const g = s.g;
  const now = Date.now();
  (info && info.events ? info.events : info || []).forEach(e => {
    if (e.kind === 'over') return;
    chess4Log(s, Object.assign({ k: e.kind }, e, { kind: undefined }));
  });
  s.turnSeq = (s.turnSeq || 0) + 1;
  if (g.over) {
    s.phase = 'over';
    room.phase = 'gameover';
    if (s.clock) s.clock.at = null;
    if (!s.counted) {
      s.counted = true;
      s.wins = s.wins || {};
      (g.result.winners || []).forEach(k => { const id = s.seats[k]; if (id) s.wins[id] = (s.wins[id] || 0) + 1; });
      chess4Log(s, { k: 'over', reason: g.result.reason, winners: g.result.winners.slice(), team: g.result.team === undefined ? null : g.result.team });
    }
  } else {
    chess4ClockTurn(s, now);
  }
  s.board = chess4Board(room);
};

/** A move played for whoever is up (the phone, a bot, the host's "play for"). */
const chess4ApplyMove = (room, move, auto) => {
  const s = room.shared;
  const g = s.g;
  const seat = g.turn;
  const now = Date.now();
  const c = s.clock;
  let spent = 0;
  if (c && c.at !== null && c.at !== undefined) spent = now - c.at;
  const info = chess4Play(g, move);
  if (!info) throw new Error('الحركة دي مش مسموحة');
  if (c) {
    if (c.moved[seat]) c.left[seat] = Math.max(0, c.left[seat] - spent) + CHESS4_INC_MS;
    c.moved[seat] = true;
  }
  const entry = { k: 'mv', seat: seat, san: info.san, from: info.from, to: info.to };
  if (info.cap) entry.cap = info.cap;
  if (info.pts) entry.pts = info.pts;
  if (info.castle) entry.castle = info.castle;
  if (info.promo) entry.promo = true;
  if (auto) entry.auto = auto;
  chess4Log(s, entry);
  s.last = { from: info.from, to: info.to, seat: seat };
  chess4After(room, info.events);
};

const chess4NewRoomGame = (room, playerId, action, p) => {
  requireHost(room, playerId);
  const prev = room.shared || {};
  if (action === 'playAgain' && prev.phase !== 'over') return;
  const lobby = chess4RoomLobby(room);
  let order;
  let mode, clock;
  if (action === 'playAgain') {
    // The same table, turned by one: red, who moves first, is someone else.
    const was = prev.seats || [];
    order = [0, 1, 2, 3].map(k => { const id = was[(k + 1) % 4]; return id && room.players.some(x => x.id === id) ? id : null; });
    mode = prev.settings.mode;
    clock = prev.settings.clock;
  } else {
    order = chess4LobbyOrder(room);
    if (CHESS4_MODES.indexOf(p.mode) !== -1) lobby.mode = p.mode;
    if (CHESS4_CLOCKS.indexOf(Number(p.clock)) !== -1) lobby.clock = Number(p.clock);
    mode = lobby.mode;
    clock = lobby.clock;
  }
  // Empty colours get a computer player, named in the host's language.
  const names = Array.isArray(p.botNames) ? p.botNames.map(x => String(x || '')).filter(Boolean) : [];
  for (let k = 0; k < 4; k++) {
    if (order[k]) continue;
    if (room.players.length >= ROOM_MAX_PLAYERS) throw new Error('الغرفة مليانة');
    const bot = chess4SeatBot(room, names[k] || names[0] || 'Bot', 'easy');
    roomEvent(room, 'joined', { name: bot.name, bot: true });
    order[k] = bot.id;
  }
  const g = chess4NewGame(mode);
  const minutes = CHESS4_CLOCKS.indexOf(Number(clock)) !== -1 ? Number(clock) : 0;
  room.shared = {
    phase: 'play',
    settings: { mode: g.mode, clock: minutes },
    seats: order,
    names: order.map(id => roomPlayerName(room, id)),
    replaced: [false, false, false, false],
    g: g,
    clock: minutes ? { left: [0, 1, 2, 3].map(() => minutes * 60000), at: null, moved: [false, false, false, false] } : null,
    last: null,
    log: [],
    eventSeq: prev.eventSeq || 0,
    turnSeq: (prev.turnSeq || 0) + 1,
    round: (prev.round || 0) + 1,
    wins: prev.wins || {},
    counted: false,
    lobby: lobby,
    roster: room.players.map(x => x.id)
  };
  room.phase = 'play';
  chess4Log(room.shared, { k: 'start', mode: g.mode });
  chess4After(room, []);
};

/** Takes a player out of the game: FFA out (grey walls), teams a loss. */
const chess4RoomOut = (room, seat, why) => {
  const s = room.shared;
  const events = chess4Eliminate(s.g, seat, why);
  if (!events.length) return;
  chess4After(room, events);
};

const chess4Action = (room, playerId, action, payload) => {
  const p = payload || {};
  if (action === 'options') { chess4RoomOptions(room, playerId, p); return; }
  if (action === 'seats') { chess4RoomSeats(room, playerId, p); return; }
  if (action === 'start' || action === 'playAgain') { chess4NewRoomGame(room, playerId, action, p); return; }
  const s = room.shared;
  if (!s || !s.g || !Array.isArray(s.seats)) throw new Error('اللعبة لم تبدأ بعد');
  const g = s.g;

  if (action === 'move') {
    if (s.phase !== 'play') return;
    if (staleTap(p, 'seq', s.turnSeq)) return;
    const seat = s.seats.indexOf(playerId);
    if (seat === -1) throw new Error('انت مش في اللعبة دي');
    if (g.turn !== seat) throw new Error('مش دورك');
    // Past the flag (and the network's share): the clock has already said.
    if (s.clock && s.clock.at !== null && Date.now() > s.clock.at + s.clock.left[seat] + CHESS4_GRACE_MS) {
      chess4RoomOut(room, seat, 'time');
      return;
    }
    chess4ApplyMove(room, { from: p.from, to: p.to }, null);
    return;
  }

  if (action === 'skipTurn') {
    // The host plays one easy move for a phone that went quiet.
    requireHost(room, playerId);
    if (s.phase !== 'play' || staleTap(p, 'seq', s.turnSeq)) return;
    const mv = chess4BotMove(g, 'easy');
    if (mv) chess4ApplyMove(room, mv, 'host');
    return;
  }

  if (action === 'resign') {
    if (s.phase !== 'play') return;
    const seat = s.seats.indexOf(playerId);
    if (seat === -1 || g.out[seat]) return;
    chess4RoomOut(room, seat, 'resign');
    return;
  }

  throw new Error('إجراء غير معروف');
};

/* --- the clock ------------------------------------------------------------------ */

const chess4Deadline = (room) => {
  const s = room.shared || {};
  const c = s.clock;
  if (s.phase !== 'play' || !c || c.at === null || c.at === undefined || !s.g) return null;
  return c.at + c.left[s.g.turn] + CHESS4_GRACE_MS + 1;
};

const chess4Timeout = (room, now) => {
  const d = chess4Deadline(room);
  if (d === null || now < d) return false;
  chess4RoomOut(room, room.shared.g.turn, 'time');
  return true;
};

/* --- someone leaves -------------------------------------------------------------
   FFA: out, their pieces grey walls from now on. Teams: a computer player takes
   their seat (the owner's word), so the partner isn't left alone, under the
   same name with 🤖 beside it on every screen.
   ------------------------------------------------------------------------------ */
const chess4PlayerLeft = (room, playerId, name) => {
  const s = room.shared;
  if (!s || !s.g || !Array.isArray(s.seats) || s.phase !== 'play') return;
  const seat = s.seats.indexOf(playerId);
  if (seat === -1 || s.g.out[seat]) return;
  if (s.g.mode === 'ffa') { chess4RoomOut(room, seat, 'left'); return; }
  const bot = chess4SeatBot(room, name || s.names[seat] || 'Bot', 'hard');
  s.seats[seat] = bot.id;
  s.replaced[seat] = true;
  chess4Log(s, { k: 'bot', seat: seat });
  s.turnSeq = (s.turnSeq || 0) + 1;
  s.board = chess4Board(room);
};

/* --- computer players ---------------------------------------------------------- */

ROOM_BOT_GAMES.chess4 = {
  max: 4,
  pending: (room) => {
    const s = room.shared || {};
    if (s.phase !== 'play' || !s.g || s.g.over) return null;
    const pid = s.seats[s.g.turn];
    return pid && isRoomBot(room, pid) ? { pid: pid, key: s.turnSeq } : null;
  },
  decide: (room, pid) => {
    const s = room.shared;
    if (s.phase !== 'play' || s.seats[s.g.turn] !== pid) return null;
    const mv = chess4BotMove(s.g, roomBotLevel(room, pid) || 'easy');
    return mv ? { action: 'move', payload: { from: mv.from, to: mv.to, seq: s.turnSeq } } : null;
  },
  fallback: (room, pid) => {
    const s = room.shared;
    if (s.phase !== 'play' || s.seats[s.g.turn] !== pid) return null;
    const mv = chess4Legal(s.g)[0];
    return mv ? { action: 'move', payload: { from: mv.from, to: mv.to, seq: s.turnSeq } } : null;
  }
};
