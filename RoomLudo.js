/* ============================================================================
   لودو — LUDO (rooms)
   ----------------------------------------------------------------------------
   Bundled into the Worker after RoomGames.js (FILES in rooms-worker/build.mjs),
   so it uses that file's helpers (requireHost, staleTap, isRoomBot…) and
   registers its computer players in ROOM_BOT_GAMES. The board and the rules
   are Ludo.js, shared with the page; this file is what a room adds to them:
   the lobby's colours and seats, the dice, the clock, the bots and leaving.

   The owner's rules for a room (21 Sep 2026): 2 to 4 play; with five or more
   in the room the host picks who plays (the first four by default) and the
   rest watch. Everyone picks a colour in the lobby, and whoever doesn't gets
   one at the start; who starts is a roll-off, the highest first, those level
   rolling again - rolled by the server, since nobody has a choice in it. A
   turn clock is the host's (off, 15 or 30 seconds): when it runs out the
   phone rolls and moves for the player. The host can do the same for a phone
   that went quiet. A player with one move only has it made for them (the
   move that brings their last piece home stays theirs), and a roll with
   nothing to move passes by itself.

   Nothing is hidden in لودو: the whole game is in `shared`, and there are no
   secrets. The dice are rolled on the server. Every move carries `seq` (the
   game's turnSeq, raised whenever the turn or its stage changes), so a tap
   that arrives after the table moved on is dropped without a word.
   ========================================================================= */

const LUDO_GRACE_MS = 1500;       // the server's clock acts this long after the phones'

const ludoRoll6 = () => 1 + Math.floor(Math.random() * 6);

/** The players who would play if the game started now: the host's choice, or the first four. */
const ludoLobbySeated = (room) => {
  const ids = room.players.map(p => p.id);
  const lobby = (room.shared && room.shared.lobby) || {};
  if (Array.isArray(lobby.seated)) {
    const kept = lobby.seated.filter(id => ids.indexOf(id) !== -1);
    // Someone left and a seat is free: the next in the room sits down.
    ids.forEach(id => { if (kept.length < LUDO_MAX_PLAYERS && kept.indexOf(id) === -1 && (lobby.benched || []).indexOf(id) === -1) kept.push(id); });
    return kept.slice(0, LUDO_MAX_PLAYERS);
  }
  return ids.slice(0, LUDO_MAX_PLAYERS);
};

const ludoLobby = (room) => {
  room.shared = room.shared || {};
  const lobby = room.shared.lobby || (room.shared.lobby = {});
  if (!lobby.colors) lobby.colors = {};
  if (!Array.isArray(lobby.seated)) lobby.seated = null;
  if (!Array.isArray(lobby.benched)) lobby.benched = [];
  return lobby;
};

/** The colours still held by players in the lobby's seats. */
const ludoLobbyColors = (room) => {
  const lobby = ludoLobby(room);
  const seated = ludoLobbySeated(room);
  const out = {};
  Object.keys(lobby.colors).forEach(id => { if (seated.indexOf(id) !== -1 && LUDO_COLORS.indexOf(lobby.colors[id]) !== -1) out[id] = lobby.colors[id]; });
  return out;
};

/** A player in a seat takes a free colour, or lets go of their own with a second tap. */
const ludoPickColor = (room, playerId, p) => {
  if (room.phase !== 'lobby') return;
  const color = String(p.color || '');
  if (LUDO_COLORS.indexOf(color) === -1) throw new Error('لون غير معروف');
  const seated = ludoLobbySeated(room);
  const who = p.playerId && String(p.playerId) !== playerId ? String(p.playerId) : playerId;
  // The host may pick for a computer player; anyone else only for themselves.
  if (who !== playerId && !(room.hostId === playerId && isRoomBot(room, who))) throw new Error('اختار لونك انت بس');
  if (seated.indexOf(who) === -1) throw new Error('انت بتتفرج الدور ده');
  const lobby = ludoLobby(room);
  const colors = ludoLobbyColors(room);
  if (colors[who] === color) { delete colors[who]; lobby.colors = colors; return; }
  if (Object.keys(colors).some(id => colors[id] === color)) throw new Error('اللون ده اتاخد');
  colors[who] = color;
  lobby.colors = colors;
};

/** The host seats or benches a player (only with more than four in the room). */
const ludoSeat = (room, playerId, p) => {
  requireHost(room, playerId);
  if (room.phase !== 'lobby') return;
  const who = String(p.playerId || '');
  if (!room.players.some(x => x.id === who)) return;
  const lobby = ludoLobby(room);
  const seated = ludoLobbySeated(room);
  const on = typeof p.on === 'boolean' ? p.on : seated.indexOf(who) === -1;
  if (on) {
    if (seated.indexOf(who) !== -1) { lobby.seated = seated; return; }
    if (seated.length >= LUDO_MAX_PLAYERS) throw new Error('٤ بس بيلعبوا: شيل حد الأول');
    lobby.seated = seated.concat([who]);
    lobby.benched = (lobby.benched || []).filter(id => id !== who);
  } else {
    lobby.seated = seated.filter(id => id !== who);
    lobby.benched = (lobby.benched || []).filter(id => id !== who).concat([who]);
    delete lobby.colors[who];
  }
};

/** Everyone at the table, with their wins at this game tonight: the board and the night's table. */
const ludoBoard = (room) => {
  const s = room.shared;
  const wins = s.wins || {};
  return (s.seats || [])
    .filter(id => room.players.some(p => p.id === id))
    .map(id => ({ id: id, name: roomPlayerName(room, id), score: wins[id] || 0 }))
    .sort((a, b) => b.score - a.score);
};

const ludoStartTurnClock = (room) => {
  const s = room.shared;
  const secs = (s.settings || {}).turnClock || 0;
  s.endsAt = s.phase === 'play' && secs && s.turn && s.turn.pid ? Date.now() + secs * 1000 : null;
  s.clockSeq = s.turnSeq;
};

/** After anything that moved the game on: the clock for the new turn, the board, the winner's win. */
const ludoAfter = (room) => {
  const s = room.shared;
  if (s.phase === 'gameover') {
    room.phase = 'gameover';
    s.endsAt = null;
    if (!s.counted && s.places && s.places.length) {
      s.wins = s.wins || {};
      s.wins[s.places[0]] = (s.wins[s.places[0]] || 0) + 1;
      s.counted = true;
    }
  } else if (s.turn && s.turn.stage === 'roll' && s.clockSeq !== s.turnSeq) {
    // A new turn (or another roll after a 6) gets the full time; choosing a piece keeps what is left.
    ludoStartTurnClock(room);
  }
  s.board = ludoBoard(room);
};

const ludoNewRoomGame = (room, playerId, action, p) => {
  requireHost(room, playerId);
  const prev = room.shared || {};
  if (action === 'playAgain' && prev.phase !== 'gameover') return;
  let ids;
  let colors;
  if (action === 'playAgain') {
    // The same table, the same colours: whoever is still here.
    ids = (prev.seats || []).filter(id => room.players.some(x => x.id === id));
    colors = Object.assign({}, prev.colors || {});
  } else {
    ids = ludoLobbySeated(room);
    colors = ludoLobbyColors(room);
  }
  if (ids.length < LUDO_MIN_PLAYERS) throw new Error('لودو محتاج لاعبين على الأقل: ضيف لاعب كمبيوتر');
  if (ids.length > LUDO_MAX_PLAYERS) throw new Error('لودو من 2 لـ 4 لاعبين');
  const was = prev.settings || {};
  const clock = LUDO_CLOCKS.indexOf(Number(p.turnClock)) !== -1 ? Number(p.turnClock)
    : (LUDO_CLOCKS.indexOf(Number(was.turnClock)) !== -1 ? Number(was.turnClock) : 0);
  const filled = ludoFillColors(ids, colors);
  const off = ludoRollOff(ids, Math.random);
  const g = ludoNewGame(ids, filled, off.first);
  // Carried over a play again, so a tap or an animation from the last game is never taken for this one.
  g.turnSeq = (prev.turnSeq || 0) + 1;
  g.eventSeq = prev.eventSeq || 0;
  g.events = [];
  ludoEvent(g, 'rolloff', { rounds: off.rounds, first: off.first });
  room.shared = Object.assign(g, {
    settings: { turnClock: clock },
    roster: room.players.map(x => x.id),
    lobby: prev.lobby || null,
    wins: prev.wins || {},
    counted: false,
    endsAt: null,
    clockSeq: null
  });
  room.phase = 'play';
  ludoAfter(room);
};

/** The phone rolls and moves for a player: the clock ran out, or the host moved a quiet phone on. */
const ludoAuto = (room, why) => {
  const s = room.shared;
  const pid = s.turn && s.turn.pid;
  if (!pid || s.phase !== 'play') return;
  ludoEvent(s, 'auto', { pid: pid, why: why });
  if (s.turn.stage === 'roll') ludoRoll(s, pid, ludoRoll6());
  if (s.phase === 'play' && s.turn.pid === pid && s.turn.stage === 'move') ludoMove(s, pid, ludoBotPick(s, pid, 'easy'));
};

const ludoAction = (room, playerId, action, payload) => {
  const p = payload || {};
  if (action === 'color') { ludoPickColor(room, playerId, p); return; }
  if (action === 'seat') { ludoSeat(room, playerId, p); return; }
  if (action === 'start' || action === 'playAgain') { ludoNewRoomGame(room, playerId, action, p); return; }
  const s = room.shared;
  if (!s || !s.phase || !Array.isArray(s.seats)) throw new Error('اللعبة لم تبدأ بعد');

  if (action === 'skipTurn') {
    requireHost(room, playerId);
    if (s.phase !== 'play' || staleTap(p, 'seq', s.turnSeq)) return;
    ludoAuto(room, 'host');
    ludoAfter(room);
    return;
  }

  if (action === 'roll' || action === 'move') {
    if (s.phase !== 'play') return;
    // A tap aimed at a turn that has since moved on: dropped without a word.
    if (staleTap(p, 'seq', s.turnSeq)) return;
    if (s.seats.indexOf(playerId) === -1) throw new Error('انت مش في اللعبة دي');
    if (s.turn.pid !== playerId) throw new Error('مش دورك');
    if (action === 'roll') {
      if (s.turn.stage !== 'roll') return;
      ludoRoll(s, playerId, ludoRoll6());
    } else {
      if (s.turn.stage !== 'move') return;
      ludoMove(s, playerId, p.piece);
    }
    ludoAfter(room);
    return;
  }

  throw new Error('إجراء غير معروف');
};

/* --- the clock ------------------------------------------------------------------ */

const ludoDeadline = (room) => {
  const s = room.shared || {};
  return s.phase === 'play' && s.endsAt ? s.endsAt + LUDO_GRACE_MS : null;
};

const ludoTimeout = (room, now) => {
  const s = room.shared || {};
  if (s.phase !== 'play' || !s.endsAt || now < s.endsAt + LUDO_GRACE_MS) return false;
  ludoAuto(room, 'clock');
  ludoAfter(room);
  return true;
};

/* --- someone leaves -------------------------------------------------------------
   Their pieces leave the board with them and their turn passes on; with one
   player left the game is over and that player takes the next place. A
   player who had already finished keeps their place.
   ------------------------------------------------------------------------------ */
const ludoPlayerLeft = (room, playerId, name) => {
  const s = room.shared;
  if (!s || !Array.isArray(s.seats) || s.seats.indexOf(playerId) === -1) return;
  if (s.phase === 'gameover') return;
  if (s.places.indexOf(playerId) !== -1) return;       // home already: their place stands
  ludoEvent(s, 'left', { pid: playerId, name: name || undefined });
  ludoRemovePlayer(s, playerId);
  ludoAfter(room);
};

/* --- computer players, and a person's only move -------------------------------- */

ROOM_BOT_GAMES.ludo = {
  max: LUDO_MAX_PLAYERS,
  pending: (room) => {
    const s = room.shared || {};
    return s.phase === 'play' && s.turn && s.turn.pid && isRoomBot(room, s.turn.pid) ? { pid: s.turn.pid, key: s.turnSeq } : null;
  },
  decide: (room, pid) => {
    const s = room.shared;
    if (s.phase !== 'play' || s.turn.pid !== pid) return null;
    if (s.turn.stage === 'roll') return { action: 'roll', payload: { seq: s.turnSeq } };
    const piece = ludoBotPick(s, pid, roomBotLevel(room, pid));
    return piece < 0 ? null : { action: 'move', payload: { piece: piece, seq: s.turnSeq } };
  },
  fallback: (room, pid) => {
    const s = room.shared;
    if (s.phase !== 'play' || s.turn.pid !== pid) return null;
    if (s.turn.stage === 'roll') return { action: 'roll', payload: { seq: s.turnSeq } };
    const piece = (s.movable || [])[0];
    return piece === undefined ? null : { action: 'move', payload: { piece: piece, seq: s.turnSeq } };
  }
};

/**
 * One piece can move (or two on the same place, which is the same move): it is
 * moved for the player after a beat. The roll is always the player's own tap,
 * and so is the move that brings their last piece home.
 */
ROOM_FORCED_GAMES.ludo = (room) => {
  const s = room.shared || {};
  if (s.phase !== 'play' || !s.turn || !s.turn.pid || s.turn.stage !== 'move') return null;
  const piece = ludoOnlyMove(s, s.turn.pid);
  if (piece < 0) return null;
  return { pid: s.turn.pid, key: s.turnSeq, move: { action: 'move', payload: { piece: piece, seq: s.turnSeq } }, delay: 900 };
};
