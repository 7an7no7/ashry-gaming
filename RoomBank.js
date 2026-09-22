/* ============================================================================
   بنك الحظ — rooms
   ----------------------------------------------------------------------------
   Bundled into the Worker after RoomGames.js (FILES in rooms-worker/build.mjs),
   so it uses that file's helpers and registers its computer players in
   ROOM_BOT_GAMES. The board, the cards and the rules are BankAlhaz.js, shared
   with the page; this file is what a room adds: the lobby's tokens and seats
   and options, the dice, the clocks, the bots, leaving.

   The owner's rules for a room (21 Sep 2026): 2 to 6 play; with seven or
   more in the room the host picks who plays (the first six by default) and
   the rest watch. Everyone picks a piece in the lobby; who starts is a
   roll-off of the two dice, rolled by the server. The host's options: how
   long a game is (45 minutes by default; 30, 60, or until one is left), the
   free-parking pot and 400 for landing on Start (both off), buying only
   after the first lap (on, 22 Sep 2026), and a turn clock
   (off, 60 or 90 seconds: when it runs out the phone rolls, pays what is
   owed, doesn't buy, and ends the turn).

   What is hidden: the order of the two decks (room._bank), never sent. The
   rest of the game is on the table and in `shared`. A turn's moves carry
   `seq` (turnSeq), managing a place carries `ev` (the eventSeq the phone
   saw), so a double tap never buys, builds or pays twice.
   ========================================================================= */

const BANK_GRACE_MS = 1500;

/** The players who would play if the game started now: the host's choice, or the first six. */
const bankLobbySeated = (room) => {
  const ids = room.players.map(p => p.id);
  const lobby = (room.shared && room.shared.lobby) || {};
  if (Array.isArray(lobby.seated)) {
    const kept = lobby.seated.filter(id => ids.indexOf(id) !== -1);
    ids.forEach(id => { if (kept.length < BANK_MAX_PLAYERS && kept.indexOf(id) === -1 && (lobby.benched || []).indexOf(id) === -1) kept.push(id); });
    return kept.slice(0, BANK_MAX_PLAYERS);
  }
  return ids.slice(0, BANK_MAX_PLAYERS);
};

const bankLobby = (room) => {
  room.shared = room.shared || {};
  const lobby = room.shared.lobby || (room.shared.lobby = {});
  if (!lobby.tokens) lobby.tokens = {};
  if (!Array.isArray(lobby.seated)) lobby.seated = null;
  if (!Array.isArray(lobby.benched)) lobby.benched = [];
  return lobby;
};

const bankLobbyTokens = (room) => {
  const lobby = bankLobby(room);
  const seated = bankLobbySeated(room);
  const out = {};
  Object.keys(lobby.tokens).forEach(id => { if (seated.indexOf(id) !== -1 && BANK_TOKENS.indexOf(lobby.tokens[id]) !== -1) out[id] = lobby.tokens[id]; });
  return out;
};

/** A seated player takes a free piece, or lets go of their own with a second tap. */
const bankPickToken = (room, playerId, p) => {
  if (room.phase !== 'lobby') return;
  const token = String(p.token || '');
  if (BANK_TOKENS.indexOf(token) === -1) throw new Error('قطعة غير معروفة');
  const seated = bankLobbySeated(room);
  if (seated.indexOf(playerId) === -1) throw new Error('انت بتتفرج الدور ده');
  const lobby = bankLobby(room);
  const tokens = bankLobbyTokens(room);
  if (tokens[playerId] === token) { delete tokens[playerId]; lobby.tokens = tokens; return; }
  if (Object.keys(tokens).some(id => tokens[id] === token)) throw new Error('القطعة دي اتاخدت');
  tokens[playerId] = token;
  lobby.tokens = tokens;
};

/** The host seats or benches a player (only with more than six in the room). */
const bankSeat = (room, playerId, p) => {
  requireHost(room, playerId);
  if (room.phase !== 'lobby') return;
  const who = String(p.playerId || '');
  if (!room.players.some(x => x.id === who)) return;
  const lobby = bankLobby(room);
  const seated = bankLobbySeated(room);
  const on = typeof p.on === 'boolean' ? p.on : seated.indexOf(who) === -1;
  if (on) {
    if (seated.indexOf(who) !== -1) { lobby.seated = seated; return; }
    if (seated.length >= BANK_MAX_PLAYERS) throw new Error('٦ بس بيلعبوا: شيل حد الأول');
    lobby.seated = seated.concat([who]);
    lobby.benched = lobby.benched.filter(id => id !== who);
  } else {
    lobby.seated = seated.filter(id => id !== who);
    lobby.benched = lobby.benched.filter(id => id !== who).concat([who]);
    delete lobby.tokens[who];
  }
};

/** Everyone at the table with their wins at this game tonight: the board and the night's table. */
const bankBoard = (room) => {
  const s = room.shared;
  const wins = s.wins || {};
  return (s.seats || []).filter(id => room.players.some(p => p.id === id))
    .map(id => ({ id: id, name: roomPlayerName(room, id), score: wins[id] || 0 }))
    .sort((a, b) => b.score - a.score);
};

/** After anything that moved the game on: the turn clock, the winner's win, the board. */
const bankRoomAfter = (room) => {
  const s = room.shared;
  if (s.phase === 'gameover') {
    room.phase = 'gameover';
    s.clockEndsAt = null;
    if (!s.counted && s.places && s.places.length) {
      s.wins = s.wins || {};
      s.wins[s.places[0]] = (s.wins[s.places[0]] || 0) + 1;
      s.counted = true;
    }
  } else {
    // A new player's turn gets the whole clock; another roll after a double keeps it running.
    const secs = s.clock || 0;
    if (!secs) s.clockEndsAt = null;
    else if (s.clockTurnNo !== s.turnNo) { s.clockTurnNo = s.turnNo; s.clockEndsAt = Date.now() + secs * 1000; }
  }
  s.board = bankBoard(room);
};

const bankNewRoomGame = (room, playerId, action, p) => {
  requireHost(room, playerId);
  const prev = room.shared || {};
  if (action === 'playAgain' && prev.phase !== 'gameover') return;
  let ids;
  let tokens;
  if (action === 'playAgain') {
    ids = (prev.seats || []).filter(id => room.players.some(x => x.id === id));
    tokens = Object.assign({}, prev.tokens || {});
  } else {
    ids = bankLobbySeated(room);
    tokens = bankLobbyTokens(room);
  }
  if (ids.length < BANK_MIN_PLAYERS) throw new Error('بنك الحظ محتاج لاعبين على الأقل: ضيف لاعب كمبيوتر');
  if (ids.length > BANK_MAX_PLAYERS) throw new Error('بنك الحظ من 2 لـ 6 لاعبين');
  const was = prev.settings || {};
  const pick = (key, list, dflt) => (list.indexOf(Number(p[key])) !== -1 ? Number(p[key]) : (list.indexOf(Number(was[key])) !== -1 ? Number(was[key]) : dflt));
  const flag = (key) => (typeof p[key] === 'boolean' ? p[key] : !!was[key]);
  const settings = { length: pick('length', BANK_LENGTHS, BANK_LENGTH_DEFAULT), pot: flag('pot'), go400: flag('go400'),
    firstLap: typeof p.firstLap === 'boolean' ? p.firstLap : was.firstLap !== false };
  const clock = pick('turnClock', BANK_CLOCKS, 0);
  const off = bankRollOff(ids, Math.random);
  // The seats go round from whoever starts, the rest in the room's order.
  const made = bankNewGame(ids, bankFillTokens(ids, tokens), off.first, settings, Date.now(), Math.random);
  const g = made.g;
  g.turnSeq = (prev.turnSeq || 0) + 1;
  g.eventSeq = prev.eventSeq || 0;
  bankEvent(g, 'rolloff', { rounds: off.rounds, first: off.first });
  room._bank = made.priv;
  room.shared = Object.assign(g, {
    clock: clock,
    roster: room.players.map(x => x.id),
    lobby: prev.lobby || null,
    wins: prev.wins || {},
    counted: false,
    clockEndsAt: null,
    clockTurnNo: null
  });
  room.phase = 'play';
  bankRoomAfter(room);
};

const bankStale = (s, p, field) => staleTap(p, field === 'ev' ? 'ev' : 'seq', field === 'ev' ? s.eventSeq : s.turnSeq);

const bankAction = (room, playerId, action, payload) => {
  const p = payload || {};
  if (action === 'token') { bankPickToken(room, playerId, p); return; }
  if (action === 'seat') { bankSeat(room, playerId, p); return; }
  if (action === 'start' || action === 'playAgain') { bankNewRoomGame(room, playerId, action, p); return; }
  const s = room.shared;
  const priv = room._bank;
  if (!s || !Array.isArray(s.seats) || !priv) throw new Error('اللعبة لم تبدأ بعد');
  if (s.phase !== 'play') return;
  const now = Date.now();

  if (action === 'skipTurn') {
    requireHost(room, playerId);
    if (bankStale(s, p, 'seq')) return;
    bankEvent(s, 'auto', { pid: s.turn.pid, why: 'host' });
    bankAuto(s, priv, s.turn.pid, Math.random, now);
    bankRoomAfter(room);
    return;
  }

  // An offer is answered by the player it was made to, on anyone's turn.
  if (action === 'answer') {
    bankAnswer(s, playerId, !!p.yes, p.id);
    bankRoomAfter(room);
    return;
  }

  if (s.seats.indexOf(playerId) === -1 || s.out.indexOf(playerId) !== -1) throw new Error('انت مش في اللعبة دي');

  const turnMoves = { roll: 1, buy: 1, payJail: 1, useCard: 1, payDebt: 1, bankrupt: 1, endTurn: 1 };
  const manage = { build: 1, sell: 1, mortgage: 1, unmortgage: 1, offer: 1, cancelOffer: 1 };
  if (turnMoves[action]) {
    if (bankStale(s, p, 'seq')) return;
    if (action === 'roll') {
      if (s.offer) { bankEvent(s, 'refuse', { from: s.offer.from, to: s.offer.to, why: 'turn' }); s.offer = null; }
      bankRoll(s, priv, playerId, [bankRoll6(Math.random), bankRoll6(Math.random)], Math.random);
    } else if (action === 'buy') bankBuy(s, playerId, !!p.yes);
    else if (action === 'payJail') bankPayJail(s, playerId);
    else if (action === 'useCard') bankUseCard(s, priv, playerId);
    else if (action === 'payDebt') bankPayDebt(s, priv, playerId, Math.random);
    else if (action === 'bankrupt') bankBankrupt(s, priv, playerId, now);
    else if (action === 'endTurn') bankEndTurn(s, playerId, now);
    bankRoomAfter(room);
    return;
  }
  if (manage[action]) {
    if (bankStale(s, p, 'ev')) return;
    if (action === 'build') bankBuild(s, playerId, p.sq);
    else if (action === 'sell') bankSell(s, playerId, p.sq);
    else if (action === 'mortgage') bankMortgage(s, playerId, p.sq);
    else if (action === 'unmortgage') bankUnmortgage(s, playerId, p.sq);
    else if (action === 'offer') bankOffer(s, playerId, { to: p.to, give: p.give, get: p.get });
    else if (action === 'cancelOffer') bankCancelOffer(s, playerId);
    bankRoomAfter(room);
    return;
  }
  throw new Error('إجراء غير معروف');
};

/* --- the turn clock ------------------------------------------------------------ */

const bankDeadline = (room) => {
  const s = room.shared || {};
  return s.phase === 'play' && s.clockEndsAt ? s.clockEndsAt + BANK_GRACE_MS : null;
};

const bankTimeout = (room, now) => {
  const s = room.shared || {};
  if (s.phase !== 'play' || !s.clockEndsAt || now < s.clockEndsAt + BANK_GRACE_MS || !room._bank) return false;
  const pid = s.turn.pid;
  bankEvent(s, 'auto', { pid: pid, why: 'clock' });
  bankAuto(s, room._bank, pid, Math.random, now);
  bankRoomAfter(room);
  return true;
};

/* --- someone leaves: out, their places back to the bank, the turn moves on ------- */

const bankPlayerLeft = (room, playerId, name) => {
  const s = room.shared;
  if (!s || !Array.isArray(s.seats) || s.phase !== 'play' || !room._bank) return;
  if (s.seats.indexOf(playerId) === -1 || s.out.indexOf(playerId) !== -1) return;
  bankEvent(s, 'left', { pid: playerId, name: name || undefined });
  bankRemovePlayer(s, room._bank, playerId, Date.now());
  bankRoomAfter(room);
};

/* --- computer players, and a person's only move ----------------------------------- */

ROOM_BOT_GAMES.bank = {
  max: BANK_MAX_PLAYERS,
  pending: (room) => {
    const s = room.shared || {};
    if (s.phase !== 'play') return null;
    if (s.offer && isRoomBot(room, s.offer.to)) return { pid: s.offer.to, key: 'offer' + s.offer.id };
    return s.turn && s.turn.pid && isRoomBot(room, s.turn.pid) ? { pid: s.turn.pid, key: s.turnSeq + '|' + s.eventSeq } : null;
  },
  decide: (room, pid) => {
    const s = room.shared;
    const mv = bankBotMove(s, room._bank, pid, roomBotLevel(room, pid));
    if (!mv) return null;
    return { action: mv.action, payload: Object.assign({ seq: s.turnSeq, ev: s.eventSeq }, mv.payload || {}) };
  },
  fallback: (room, pid) => {
    const s = room.shared;
    if (s.offer && s.offer.to === pid) return { action: 'answer', payload: { yes: false, id: s.offer.id } };
    if (s.turn.pid !== pid) return null;
    const st = s.turn.stage;
    const act = st === 'roll' ? 'roll' : st === 'buy' ? 'buy' : st === 'act' ? 'endTurn' : st === 'debt' ? 'bankrupt' : null;
    return act ? { action: act, payload: { seq: s.turnSeq, yes: false } } : null;
  }
};

/** Bankrupt with nothing left to raise, or a place there is no way to pay for: done for them after a beat. */
ROOM_FORCED_GAMES.bank = (room) => {
  const s = room.shared || {};
  if (s.phase !== 'play' || !s.turn || !s.turn.pid) return null;
  const mv = bankOnlyMove(s, s.turn.pid);
  if (!mv) return null;
  return { pid: s.turn.pid, key: s.turnSeq + '|' + mv.action, move: { action: mv.action, payload: Object.assign({ seq: s.turnSeq }, mv.payload) }, delay: 1400 };
};
