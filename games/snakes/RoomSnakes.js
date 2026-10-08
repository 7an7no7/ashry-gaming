/* ============================================================================
   السلم والتعبان — SNAKES & LADDERS (rooms)
   ----------------------------------------------------------------------------
   Bundled into the Worker after RoomGames.js (FILES in rooms-worker/build.mjs),
   so it uses that file's helpers (requireHost, staleTap, isRoomBot…) and
   registers its computer players in ROOM_BOT_GAMES. The board, the map and the
   rules are Snakes.js, shared with the page; this file is what a room adds:
   the lobby's colours and seats, the dice, the clock, the bots and leaving.

   The owner's rules for a room (28 Sep 2026): 2 to 6 play, each on their own
   phone, the board big on the TV; computer players fill seats, one level
   (there is no skill in it); a turn clock is the host's (off, 15 or 30
   seconds), and when it runs out the server rolls for the player; the host's
   "play for" moves a quiet phone on.

   Nothing is hidden: the whole game is `shared`. The dice are rolled on the
   server, and so is every animation's variant (Snakes.js), so every phone and
   the TV play the same one. A roll carries `seq` (turnSeq); a roll that comes
   before the table has shown the last one (`readyAt`, less a little slack for
   the network) is dropped without a word, and the bots and the clock wait for
   it too.
   ========================================================================= */

const SNAKES_GRACE_MS = 1500;          // the server's clock acts this long after the phones'
const SNAKES_EARLY_MS = 400;           // a roll this close to readyAt is taken (clocks and networks differ)

const snakesRoll6 = () => snakesDie();

/** The players who would play if the game started now: the host's choice, or the first six. */
const snakesLobbySeated = (room) => lobbySeatedOf(room.players, room.shared && room.shared.lobby, SNAKES_MAX_PLAYERS);

const snakesLobby = (room) => {
  room.shared = room.shared || {};
  const lobby = room.shared.lobby || (room.shared.lobby = {});
  if (!lobby.colors) lobby.colors = {};
  if (!Array.isArray(lobby.seated)) lobby.seated = null;
  if (!Array.isArray(lobby.benched)) lobby.benched = [];
  return lobby;
};

const snakesLobbyColors = (room) => {
  const lobby = snakesLobby(room);
  const seated = snakesLobbySeated(room);
  const out = {};
  Object.keys(lobby.colors).forEach(id => { if (seated.indexOf(id) !== -1 && SNAKES_COLORS.indexOf(lobby.colors[id]) !== -1) out[id] = lobby.colors[id]; });
  return out;
};

/** A player in a seat takes a free colour, or lets go of their own with a second tap. */
const snakesPickColor = (room, playerId, p) => {
  if (room.phase !== 'lobby') return;
  const color = String(p.color || '');
  if (SNAKES_COLORS.indexOf(color) === -1) throw new Error('لون غير معروف');
  const who = p.playerId && String(p.playerId) !== playerId ? String(p.playerId) : playerId;
  if (who !== playerId && !(room.hostId === playerId && isRoomBot(room, who))) throw new Error('اختار لونك انت بس');
  if (snakesLobbySeated(room).indexOf(who) === -1) throw new Error('انت بتتفرج الدور ده');
  const lobby = snakesLobby(room);
  const colors = snakesLobbyColors(room);
  if (colors[who] === color) { delete colors[who]; lobby.colors = colors; return; }
  if (Object.keys(colors).some(id => colors[id] === color)) throw new Error('اللون ده اتاخد');
  colors[who] = color;
  lobby.colors = colors;
};

/* --- teams (the owner, 2 Oct 2026) ----------------------------------------------------------
   4 at the table play as 2 teams of 2; 6 as 3 teams of 2 or 2 teams of 3 (the host's pick, `teamSize`
   in the lobby: 0 for each for themselves). The host arranges the teams in the lobby - a tap on one
   name and then on one in another team swaps the two (`teamSwap`) - or «وزّع» draws them (`teamDeal`).
   The arrangement is normalised the same way on the server and every phone (snakesTeamGroups, mirrored
   by snkRoomTeams in JS_RoomSnakes.html), so a join or a leave never leaves a team short. */

/* snakesTeamSizesFor and snakesTeamGroups are in Snakes.js (the page draws the lobby's teams with them too). */

/** The lobby's teams now: null with teams off or a table they don't fit. */
const snakesLobbyTeams = (room) => {
  const lobby = snakesLobby(room);
  const size = Number(lobby.teamSize) || 0;
  return size ? snakesTeamGroups(snakesLobbySeated(room), size, lobby.teams) : null;
};

/** The host turns teams on (2 or 3 a team) or off (0). */
const snakesTeamMode = (room, playerId, p) => {
  requireHost(room, playerId);
  if (room.phase !== 'lobby') return;
  const size = Number(p.size) || 0;
  if ([0, 2, 3].indexOf(size) === -1) throw new Error('حجم الفريق غلط');
  const lobby = snakesLobby(room);
  lobby.teamSize = size;
  // Turned on (or to the other size): drawn at random to start with, and the host may swap people.
  const seated = snakesLobbySeated(room);
  if (size && snakesTeamSizesFor(seated.length).indexOf(size) !== -1) lobby.teams = snakesDealTeams(seated, size);
};

/** «وزّع»: the teams drawn at random. */
const snakesDealTeams = (seated, size) => {
  const order = snakesShuffle(seated, Math.random);
  const out = [];
  for (let k = 0; k < seated.length / size; k++) out.push(order.slice(k * size, k * size + size));
  return out;
};

const snakesTeamDeal = (room, playerId) => {
  requireHost(room, playerId);
  if (room.phase !== 'lobby') return;
  const lobby = snakesLobby(room);
  const size = Number(lobby.teamSize) || 0;
  const seated = snakesLobbySeated(room);
  if (!size || snakesTeamSizesFor(seated.length).indexOf(size) === -1) throw new Error('الفرق محتاجة 4 أو 6 في اللعبة');
  lobby.teams = snakesDealTeams(seated, size);
};

/** The host swaps two people between teams. */
const snakesTeamSwap = (room, playerId, p) => {
  requireHost(room, playerId);
  if (room.phase !== 'lobby') return;
  const teams = snakesLobbyTeams(room);
  if (!teams) return;
  const a = String(p.a || ''), b = String(p.b || '');
  const ta = teams.findIndex(t => t.indexOf(a) !== -1), tb = teams.findIndex(t => t.indexOf(b) !== -1);
  if (ta === -1 || tb === -1 || ta === tb) return;
  teams[ta][teams[ta].indexOf(a)] = b;
  teams[tb][teams[tb].indexOf(b)] = a;
  snakesLobby(room).teams = teams;
};

/** The order teams play in: the teams drawn in a random order, each team's members too, then one of each team in turn (A1 B1 A2 B2). */
const snakesTeamOrder = (teams) => {
  const ts = shuffled(teams.map(t => shuffled(t)));
  const out = [];
  const size = Math.max.apply(null, ts.map(t => t.length));
  for (let k = 0; k < size; k++) ts.forEach(t => { if (t[k]) out.push(t[k]); });
  return out;
};

/** The teams in the order they finished, for the night, the program and «مين هيكسب؟»: null without teams or before the end. */
const snakesTeamResult = (room) => {
  const s = room.shared || {};
  if (!Array.isArray(s.teams) || s.phase !== 'gameover' || !Array.isArray(s.teamPlaces)) return null;
  const out = s.teamPlaces.map(ti => (s.teams[ti] || []).filter(id => (s.seats || []).indexOf(id) !== -1)).filter(t => t.length);
  return out.length ? out : null;
};

/** The host seats or benches a player (only with more than six in the room). */
const snakesSeat = (room, playerId, p) => {
  requireHost(room, playerId);
  if (room.phase !== 'lobby') return;
  const who = String(p.playerId || '');
  if (!room.players.some(x => x.id === who)) return;
  const lobby = snakesLobby(room);
  const seated = snakesLobbySeated(room);
  const on = typeof p.on === 'boolean' ? p.on : seated.indexOf(who) === -1;
  if (on) {
    if (seated.indexOf(who) !== -1) { lobby.seated = seated; return; }
    if (seated.length >= SNAKES_MAX_PLAYERS) throw new Error('٦ بس بيلعبوا: شيل حد الأول');
    lobby.seated = seated.concat([who]);
    lobby.benched = (lobby.benched || []).filter(id => id !== who);
  } else {
    lobby.seated = seated.filter(id => id !== who);
    lobby.benched = (lobby.benched || []).filter(id => id !== who).concat([who]);
    delete lobby.colors[who];
  }
};

/** Everyone at the table, with their wins at this game tonight: the board and the night's table.
    Level wins are told apart by this game's places (`tie`, boardRowKey in RoomGames.js), so one
    game banks 5 / 3 / 2 / 1 and not a 3 for everyone after the winner (the review of 1 Oct 2026). */
const snakesBoard = (room) => {
  const s = room.shared;
  const wins = s.wins || {};
  const places = s.places || [];
  // In teams a player's place is their team's (the owner, 2 Oct 2026: places are per team).
  const teamAt = (id) => { const ti = snakesTeamOf(s, id); const k = ti === -1 ? -1 : (s.teamPlaces || []).indexOf(ti); return k === -1 ? null : k + 1; };
  const placeOf = (id) => (Array.isArray(s.teams) ? teamAt(id) : (places.indexOf(id) === -1 ? null : places.indexOf(id) + 1));
  return (s.seats || [])
    .filter(id => room.players.some(p => p.id === id))
    .map(id => ({ id: id, name: roomPlayerName(room, id), score: wins[id] || 0, tie: placeOf(id) }))
    .sort((a, b) => (b.score - a.score) || ((a.tie || 99) - (b.tie || 99)));
};

/** The game just played, for «مين هيكسب؟»: its places (in teams, the teams'), once it is over. */
ROOM_RESULT_BOARDS.snakes = (room) => {
  const s = room.shared || {};
  const teams = snakesTeamResult(room);
  if (teams) return roomResultRows(room, teams);
  return s.phase === 'gameover' && Array.isArray(s.places) && s.places.length ? roomResultRows(room, s.places.map(id => [id]).concat([s.seats || []])) : null;
};

/** After anything that moved the game on: the clock for the new turn, the board, the winner's win (each member's, in teams). */
const snakesAfter = (room) => {
  const s = room.shared;
  if (s.phase === 'gameover') {
    room.phase = 'gameover';
    s.endsAt = null;
    if (!s.counted && s.places && s.places.length && s.seats.length > 1) {
      s.wins = s.wins || {};
      const teams = snakesTeamResult(room);
      (teams ? teams[0] : [s.places[0]]).forEach(id => { s.wins[id] = (s.wins[id] || 0) + 1; });
      s.counted = true;
    }
  } else if (s.clockSeq !== s.turnSeq) {
    const secs = (s.settings || {}).turnClock || 0;
    // The clock starts once the table has seen the last roll.
    s.endsAt = secs && s.turn && s.turn.pid ? Math.max(Date.now(), s.readyAt || 0) + secs * 1000 : null;
    s.clockSeq = s.turnSeq;
  }
  s.board = snakesBoard(room);
};

const snakesNewRoomGame = (room, playerId, action, p) => {
  requireHost(room, playerId);
  const prev = room.shared || {};
  if (action === 'playAgain' && prev.phase !== 'gameover') return;
  let ids;
  let colors;
  if (action === 'playAgain') {
    // Whoever is still here - and a free seat goes to someone who watched (joined late, or a seat
    // emptied), as the lobby would seat them; never to anyone the host benched (the review of
    // 1 Oct 2026: a watcher was never dealt in).
    ids = (prev.seats || []).filter(id => room.players.some(x => x.id === id));
    const benched = (prev.lobby && prev.lobby.benched) || [];
    room.players.forEach(x => { if (ids.length < SNAKES_MAX_PLAYERS && ids.indexOf(x.id) === -1 && benched.indexOf(x.id) === -1) ids.push(x.id); });
    colors = {};
    Object.keys(prev.colors || {}).forEach(id => { if (ids.indexOf(id) !== -1) colors[id] = prev.colors[id]; });
  } else {
    ids = snakesLobbySeated(room);
    colors = snakesLobbyColors(room);
  }
  if (ids.length < SNAKES_MIN_PLAYERS) throw new Error('السلم والتعبان محتاج لاعبين على الأقل: ضيف لاعب كمبيوتر');
  if (ids.length > SNAKES_MAX_PLAYERS) throw new Error('السلم والتعبان من 2 لـ 6 لاعبين');
  const was = prev.settings || {};
  const clock = SNAKES_CLOCKS.indexOf(Number(p.turnClock)) !== -1 ? Number(p.turnClock)
    : (SNAKES_CLOCKS.indexOf(Number(was.turnClock)) !== -1 ? Number(was.turnClock) : 0);
  // The third round's options (every field optional: an older phone's start has none of them, and plays the classic).
  const pick = (k) => (k in p ? p[k] : was[k]);
  const themeOpt = pick('theme');
  const theme = SNAKES_THEMES.indexOf(themeOpt) !== -1 || themeOpt === 'random' ? themeOpt : 'classic';
  const surprises = !!pick('surprises');
  const moving = !!pick('moving');
  const filled = snakesFillColors(ids, colors);
  // Teams: the lobby's (or, on play again, the last game's kept as far as they go).
  const lobby = (prev.lobby && typeof prev.lobby === 'object') ? prev.lobby : snakesLobby(room);
  const size = Number(action === 'playAgain' ? (was.teamSize || 0) : (lobby.teamSize || 0)) || 0;
  const teams = size ? snakesTeamGroups(ids, size, action === 'playAgain' ? prev.teams : lobby.teams) : null;
  if (size && !teams && action !== 'playAgain') throw new Error('الفرق محتاجة 4 أو 6 في اللعبة: شيل الفرق أو كمّل العدد');
  // Who starts: drawn at random; the rest follow in a random order (in teams, one of each team in turn).
  const order = teams ? snakesTeamOrder(teams) : shuffled(ids);   // Fisher-Yates: a random comparator in sort() favours the first seats
  // «خرايطنا» (959, 7 Oct 2026): a kept map comes as its seed (optional; 0 or anything else is a new map).
  // Kept in the settings, so play again deals the same board, as it keeps the look.
  const seedOpt = Number(pick('seed'));
  const seed = Number.isInteger(seedOpt) && seedOpt >= 1 && seedOpt <= 2147483646 ? seedOpt : 0;
  const g = snakesNewGame(order, filled, seed || snakesNewSeed(Math.random), Date.now(), {
    teardown: action === 'playAgain',
    theme: theme === 'random' ? SNAKES_THEMES[Math.floor(Math.random() * SNAKES_THEMES.length)] : theme,
    surprises: surprises, moving: moving, teams: teams || undefined
  });
  // Carried over a play again, so a tap or an animation from the last game is never taken for this one.
  g.turnSeq = (prev.turnSeq || 0) + 1;
  const base = prev.eventSeq || 0;
  g.events.forEach(e => { e.seq += base; });
  g.eventSeq = base + g.eventSeq;
  room.shared = Object.assign(g, {
    settings: { turnClock: clock, theme: theme, surprises: surprises, moving: moving, teamSize: size, seed: seed },   // the size asked for, kept when it didn't fit this time, so a full table's next play again has teams again
    roster: room.players.map(x => x.id),
    lobby: prev.lobby || null,
    wins: prev.wins || {},
    counted: false,
    endsAt: null,
    clockSeq: null
  });
  room.phase = 'play';
  snakesAfter(room);
};

/** The server rolls for a player: the clock ran out, or the host moved a quiet phone on. */
const snakesAuto = (room, why) => {
  const s = room.shared;
  const pid = s.turn && s.turn.pid;
  if (!pid || s.phase !== 'play') return;
  snakesEvent(s, 'auto', { pid: pid, why: why });
  snakesRoll(s, pid, snakesRoll6(), Math.random, Date.now());
};

const snakesAction = (room, playerId, action, payload) => {
  const p = payload || {};
  if (action === 'color') { snakesPickColor(room, playerId, p); return; }
  if (action === 'seat') { snakesSeat(room, playerId, p); return; }
  if (action === 'teamMode') { snakesTeamMode(room, playerId, p); return; }
  if (action === 'teamDeal') { snakesTeamDeal(room, playerId); return; }
  if (action === 'teamSwap') { snakesTeamSwap(room, playerId, p); return; }
  if (action === 'start' || action === 'playAgain') { snakesNewRoomGame(room, playerId, action, p); return; }
  const s = room.shared;
  if (!s || !s.phase || !Array.isArray(s.seats)) throw new Error('اللعبة لم تبدأ بعد');

  if (action === 'skipTurn') {
    requireMoveOn(room, playerId);
    if (s.phase !== 'play' || staleTap(p, 'seq', s.turnSeq)) return;
    if (Date.now() < (s.readyAt || 0) - SNAKES_EARLY_MS) return;
    snakesAuto(room, 'host');
    snakesAfter(room);
    return;
  }

  if (action === 'roll') {
    if (s.phase !== 'play') return;
    // A tap aimed at a turn that has since moved on: dropped without a word.
    if (staleTap(p, 'seq', s.turnSeq)) return;
    if (s.seats.indexOf(playerId) === -1) throw new Error('انت مش في اللعبة دي');
    if (s.turn.pid !== playerId) throw new Error('مش دورك');
    // The table is still watching the last roll: the tap waits for it (dropped; the phone taps again).
    if (Date.now() < (s.readyAt || 0) - SNAKES_EARLY_MS) return;
    snakesRoll(s, playerId, snakesRoll6(), Math.random, Date.now());
    snakesAfter(room);
    return;
  }

  throw new Error('إجراء غير معروف');
};

/* --- the clock ------------------------------------------------------------------ */

const snakesDeadline = (room) => {
  const s = room.shared || {};
  return s.phase === 'play' && s.endsAt ? s.endsAt + SNAKES_GRACE_MS : null;
};

const snakesTimeout = (room, now) => {
  const s = room.shared || {};
  if (s.phase !== 'play' || !s.endsAt || now < s.endsAt + SNAKES_GRACE_MS) return false;
  snakesAuto(room, 'clock');
  snakesAfter(room);
  return true;
};

/* --- someone leaves -------------------------------------------------------------
   Their piece leaves the board with them and their turn passes on; with one
   player left the game is over and that player takes the next place. A player
   who had already reached 100 keeps their place.
   ------------------------------------------------------------------------------ */
const snakesPlayerLeft = (room, playerId, name) => {
  const s = room.shared;
  if (!s || !Array.isArray(s.seats) || s.seats.indexOf(playerId) === -1) return;
  if (s.phase === 'gameover') return;
  if (s.places.indexOf(playerId) !== -1) {
    // Home already: they keep their place - and their name, for the podium, the strip and the
    // awards, which read names from the room's players (they drew «…» once the player was gone).
    if (name) { s.names = s.names || {}; s.names[playerId] = name; }
    // Home already: they keep their place. In a team they no longer roll for the others.
    if (Array.isArray(s.teams) && (s.gone || []).indexOf(playerId) === -1) {
      s.gone = (s.gone || []).concat([playerId]);
      // A nap the pass meets is held from now, not from an old roll's readyAt.
      if (s.turn && s.turn.pid === playerId) { snakesPassTurn(s, playerId, Date.now()); s.turnSeq = (s.turnSeq || 0) + 1; }
      snakesAfter(room);
    }
    return;
  }
  // The leaver picks up a suitcase and walks off the board (29 Sep 2026): the next roll waits for it.
  snakesEvent(s, 'left', { pid: playerId, name: name || undefined, ms: SNAKES_LEAVE_MS });
  s.readyAt = Math.max(s.readyAt || 0, Date.now() + SNAKES_LEAVE_MS);
  snakesRemovePlayer(s, playerId);
  snakesAfter(room);
};

/* --- computer players ---------------------------------------------------------- */

ROOM_BOT_GAMES.snakes = {
  max: SNAKES_MAX_PLAYERS,
  // There is no skill in it: a computer player rolls, a beat after the table has seen the last roll.
  pending: (room) => {
    const s = room.shared || {};
    if (s.phase !== 'play' || !s.turn || !s.turn.pid || !isRoomBot(room, s.turn.pid)) return null;
    const wait = Math.max(0, (s.readyAt || 0) - Date.now());
    return { pid: s.turn.pid, key: s.turnSeq, delay: wait + 500 + Math.floor(Math.random() * 500) };
  },
  decide: (room, pid) => {
    const s = room.shared;
    if (s.phase !== 'play' || s.turn.pid !== pid) return null;
    return { action: 'roll', payload: { seq: s.turnSeq } };
  },
  fallback: (room, pid) => {
    const s = room.shared;
    if (s.phase !== 'play' || s.turn.pid !== pid) return null;
    return { action: 'roll', payload: { seq: s.turnSeq } };
  }
};
