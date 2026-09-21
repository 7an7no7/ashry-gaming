/* ============================================================================
   الدومينو — DOMINO (rooms)
   ----------------------------------------------------------------------------
   Bundled into the Worker after RoomGames.js (FILES in rooms-worker/build.mjs),
   so it uses that file's helpers (requireHost, staleTap, shuffled,
   roomPlayerName, isRoomBot…) and registers its computer players in
   ROOM_BOT_GAMES. The tiles, the open ends, a move's points and the end of a
   round are DominoTiles.js, shared with the page.

   The owner's rules (21 Sep 2026, asked one by one):
     - 2 to 4 players, people or computer players; everyone for themselves, or
       with four, two teams with partners opposite (seats 1 & 3 against 2 & 4,
       so turns alternate sides). The host seats the partners in the lobby:
       at random, with swaps.
     - The double-six set, 7 tiles each. With 2 or 3 the rest are left to draw
       from: whoever can't play draws until they can, and plays; with nothing
       left, or with 4 players, whoever can't play knocks (دق) and passes.
     - Round 1: whoever holds the double six plays it (or the highest double
       in anyone's hand, or the heaviest tile). Later rounds: the winner of the
       last one leads with any tile.
     - عادي: a line with two ends; going out takes the pips left in the other
       hands (in teams the two opponents' only), a blocked table (قفلة) gives
       the lowest hand the others' pips, a tie for the lowest nobody. Target
       101 by default.
     - أمريكاني: the first double is the spinner; every tile placed scores the
       open ends when they add up to a multiple of 5; a round's pips are
       rounded to the nearest 5 and divided by 5. Target 50 by default.
     - First to the target wins; two past it in the same round, the higher.
     - The helpers (tiles that fit lit up; a move's points shown) and a turn
       clock are the host's, off by default. When the clock runs out the
       phone plays for that player: the first tile that fits, else it draws,
       else it knocks.

   What is hidden: every hand is in room._domino.hands and reaches a phone only
   as its own `room.secrets[pid].hand`; the tiles left to draw never leave the
   server. `shared` carries the table, how many tiles each player holds, how
   many are left to draw, the scores and the events - never a tile in a hand.
   The hands are published in `shared.result` when a round ends, as at a real
   table.

   Every move carries `seq` (shared.turnSeq, raised on every move); a tap that
   arrives after the table moved on is dropped without a word.
   ========================================================================= */

const DOMINO_GRACE_MS = 1500;      // the server's clock acts this long after the phones'
const DOMINO_EVENTS = 40;          // the moves every phone can still animate

/** The table's players in seat order, still in the room. */
const dominoSeated = (room) => (room.shared.order || []).filter(id => room.players.some(p => p.id === id));

/** Who scores together: each player alone, or the two sides. */
const dominoUnits = (room) => {
  const s = room.shared;
  const seated = dominoSeated(room);
  if (Array.isArray(s.teams)) {
    return s.teams.map((t, i) => ({ key: DOMINO_TEAM_KEYS[i], ids: t.filter(id => seated.indexOf(id) !== -1) }));
  }
  return seated.map(id => ({ key: id, ids: [id] }));
};

const dominoEvent = (room, type, fields) => {
  const s = room.shared;
  const clean = {};
  Object.keys(fields || {}).forEach(k => { if (fields[k] !== undefined && fields[k] !== null && fields[k] !== false) clean[k] = fields[k]; });
  s.eventSeq = (s.eventSeq || 0) + 1;
  s.events = (s.events || []).concat([Object.assign({ seq: s.eventSeq, type: type }, clean)]).slice(-DOMINO_EVENTS);
};

/** Points to a player's unit: their own score, or their side's. */
const dominoAddPoints = (room, unit, points) => {
  const s = room.shared;
  if (!points) return;
  s.scores[unit] = (s.scores[unit] || 0) + points;
  s.gained[unit] = (s.gained[unit] || 0) + points;
};

/** The night's table: every seated player with their unit's score, best first. */
const dominoBoard = (room) => {
  const s = room.shared;
  const seated = dominoSeated(room);
  return room.players
    .filter(p => seated.indexOf(p.id) !== -1)
    .map(p => {
      const unit = dominoUnitOf(s.teams, p.id);
      return { id: p.id, name: p.name, score: (s.scores || {})[unit] || 0, team: Array.isArray(s.teams) ? unit : null };
    })
    .sort((a, b) => b.score - a.score);
};

/** Writes every phone's own hand, and what the table may know: counts, the tiles left, the board. */
const dominoSync = (room) => {
  const s = room.shared;
  const g = room._domino;
  if (!s || !g) return;
  room.secrets = {};
  s.counts = {};
  dominoSeated(room).forEach(pid => {
    const hand = (g.hands[pid] || []).slice();
    s.counts[pid] = hand.length;
    room.secrets[pid] = { hand: hand };
  });
  s.bone = s.drawing ? g.bone.length : 0;
  s.board = dominoBoard(room);
};

/* --- the lobby: who sits where --------------------------------------------------- */

/**
 * The host's seating for a game of teams, before it starts: `{ teams, order }`
 * in shared.lobby, so every phone sees who partners whom. With `teams` and no
 * order that fits the four players here (or `shuffle`), the seats are drawn at
 * random - the owner's default - and the host swaps two by sending an order.
 */
const dominoLobbySeats = (room, playerId, p) => {
  requireHost(room, playerId);
  if (room.phase !== 'lobby') return;
  const ids = room.players.map(x => x.id);
  const teams = !!p.teams && ids.length === 4;
  let order = null;
  if (teams) {
    const asked = Array.isArray(p.order) ? p.order.map(String) : null;
    const fits = !!asked && asked.length === 4 && ids.every(id => asked.indexOf(id) !== -1);
    order = fits && !p.shuffle ? asked : shuffled(ids);
  }
  room.shared = room.shared || {};
  room.shared.lobby = { teams: teams, order: order };
};

/* --- a game, a round -------------------------------------------------------------- */

/** The lobby's options, checked; a play again keeps the last game's. */
const dominoSettings = (p, was, n) => {
  const mode = DOMINO_MODES.indexOf(p.mode) !== -1 ? p.mode : (DOMINO_MODES.indexOf(was.mode) !== -1 ? was.mode : 'normal');
  const targets = DOMINO_TARGETS[mode];
  const target = targets.indexOf(Number(p.target)) !== -1 ? Number(p.target)
    : (targets.indexOf(Number(was.target)) !== -1 ? Number(was.target) : DOMINO_TARGET_DEFAULT[mode]);
  if (p.teams === true && n !== 4) throw new Error('الفرق محتاجة 4 لاعبين');
  const teams = (typeof p.teams === 'boolean' ? p.teams : !!was.teams) && n === 4;
  const flag = (key) => (typeof p[key] === 'boolean' ? p[key] : !!was[key]);
  const clock = DOMINO_CLOCKS.indexOf(Number(p.turnClock)) !== -1 ? Number(p.turnClock)
    : (DOMINO_CLOCKS.indexOf(Number(was.turnClock)) !== -1 ? Number(was.turnClock) : 0);
  return {
    mode: mode,
    target: target,
    teams: teams,
    helpFit: flag('helpFit'),
    helpPoints: flag('helpPoints') && mode === 'american',
    turnClock: clock
  };
};

const dominoNewGame = (room, playerId, action, p) => {
  requireHost(room, playerId);
  const prev = room.shared || {};
  if (action === 'playAgain' && prev.phase !== 'gameover') return;
  const ids = room.players.map(x => x.id);
  if (ids.length < DOMINO_MIN_PLAYERS) throw new Error('الدومينو محتاج لاعبين على الأقل: ضيف لاعب كمبيوتر');
  if (ids.length > DOMINO_MAX_PLAYERS) throw new Error('الدومينو من 2 لـ 4 لاعبين');
  const settings = dominoSettings(p, action === 'playAgain' ? (prev.settings || {}) : {}, ids.length);
  const sameSeats = (list) => Array.isArray(list) && list.length === ids.length && ids.every(id => list.indexOf(id) !== -1);
  // Seats: the host's arrangement for teams, the same table on a play again, else at random.
  let order;
  if (action === 'playAgain' && sameSeats(prev.order)) order = prev.order.slice();
  else if (settings.teams && prev.lobby && sameSeats(prev.lobby.order)) order = prev.lobby.order.slice();
  else order = shuffled(ids);
  const teams = settings.teams ? [[order[0], order[2]], [order[1], order[3]]] : null;
  const scores = {};
  if (teams) { scores.A = 0; scores.B = 0; } else order.forEach(id => { scores[id] = 0; });
  room.shared = {
    settings: settings,
    order: order,
    roster: order.slice(),
    teams: teams,
    round: 0,
    scores: scores,
    gained: {},
    lead: null,
    winners: null,
    winner: null,
    result: null,
    // Carried over a play again, so a tap or an animation from the last game is never taken for this one.
    turnSeq: (prev.turnSeq || 0) + 1,
    eventSeq: prev.eventSeq || 0,
    events: []
  };
  room._domino = { hands: {}, bone: [], aside: [] };
  dominoDeal(room);
};

/**
 * Deals the next round: seven each, the rest to draw from with two or three.
 * The opening of the first round (and of any round after a tie) is not a
 * choice - the double six, or the highest double, or the heaviest tile - so
 * the server plays it; after that the winner of the last round leads.
 */
const dominoDeal = (room) => {
  const s = room.shared;
  s.order = dominoSeated(room);
  if (Array.isArray(s.teams)) s.teams = s.teams.map(t => t.filter(id => s.order.indexOf(id) !== -1));
  s.round = (s.round || 0) + 1;
  const set = shuffled(dominoSet());
  const hands = {};
  s.order.forEach(pid => { hands[pid] = set.splice(0, DOMINO_HAND); });
  s.drawing = s.order.length < DOMINO_MAX_PLAYERS;
  room._domino = { hands: hands, bone: s.drawing ? set : [], aside: s.drawing ? [] : set };
  s.table = dominoNewTable();
  s.phase = 'play';
  room.phase = 'play';
  s.knocked = {};
  s.gained = {};
  s.result = null;
  s.turn = null;
  s.endsAt = null;
  s.events = [];
  const lead = s.lead && s.order.indexOf(s.lead) !== -1 ? s.lead : null;
  dominoEvent(room, 'deal', { round: s.round, lead: lead || undefined });
  if (lead) {
    dominoStartTurn(room, lead);
  } else {
    const first = dominoStarter(hands, s.order);
    s.turn = first.pid;
    s.opening = first.how;
    dominoPlay(room, first.pid, first.tile, 'R', { forced: first.how });
  }
  dominoSync(room);
};

/* --- turns ---------------------------------------------------------------------------- */

const dominoStartTurn = (room, pid) => {
  const s = room.shared;
  s.turn = pid;
  s.turnSeq = (s.turnSeq || 0) + 1;
  s.endsAt = s.settings.turnClock ? Date.now() + s.settings.turnClock * 1000 : null;
};

/** The turn passes to the next seat round the table. */
const dominoNextTurn = (room) => {
  const s = room.shared;
  const seated = dominoSeated(room);
  const at = s.order.indexOf(s.turn);
  for (let k = 1; k <= s.order.length; k++) {
    const next = s.order[(at + k + s.order.length) % s.order.length];
    if (seated.indexOf(next) !== -1) { dominoStartTurn(room, next); return; }
  }
};

/** Nobody can play, and nothing is left to draw: قفلة. */
const dominoBlocked = (room) => {
  const s = room.shared;
  const g = room._domino;
  if (!s.table.line.length) return false;
  if (s.drawing && g.bone.length) return false;
  return !dominoSeated(room).some(pid => dominoCanPlay(s.table, g.hands[pid]));
};

/** After a move: a hand emptied ends the round, a blocked table too, or the turn passes on. */
const dominoAfterMove = (room, pid) => {
  const s = room.shared;
  const g = room._domino;
  if (!(g.hands[pid] || []).length) { dominoEndRound(room, 'out', pid); return; }
  if (dominoBlocked(room)) { dominoEndRound(room, 'blocked', null); return; }
  dominoNextTurn(room);
};

/**
 * `pid` plays `tile` on `end`. The end may be left out when the tile goes on
 * one end only (or leads the round); a tile that goes nowhere is refused.
 */
const dominoPlay = (room, pid, tile, end, extra) => {
  const s = room.shared;
  const g = room._domino;
  const hand = g.hands[pid] || [];
  const id = String(tile || '');
  if (hand.indexOf(id) === -1) throw new Error('الحجر ده مش معاك');
  const fits = dominoFits(s.table, id);
  if (!fits.length) throw new Error('الحجر ده مش راكب');
  let at = String(end || '');
  if (fits.indexOf(at) === -1) {
    if (at && s.table.line.length) throw new Error('الحجر ده مش راكب على الناحية دي');
    at = fits[0];
  }
  const placed = dominoPlace(s.table, id, at, s.settings.mode);
  g.hands[pid] = hand.filter(x => x !== id);
  s.table = placed.table;
  let points = 0;
  let sum;
  if (s.settings.mode === 'american') {
    sum = dominoEndsSum(s.table);
    points = dominoPointsOf(sum);
    dominoAddPoints(room, dominoUnitOf(s.teams, pid), points);
  }
  // Knowing what a player lacks came from the ends they knocked on; a tile played shows they didn't lack it.
  if (s.knocked && s.knocked[pid]) s.knocked[pid] = s.knocked[pid].filter(v => dominoParse(id).indexOf(v) === -1);
  dominoEvent(room, 'play', Object.assign({ pid: pid, tile: id, end: at, spinner: placed.spinner, pts: points || undefined, sum: sum }, extra || {}));
  dominoAfterMove(room, pid);
};

/** Draws until a tile that goes on the table comes up, or none are left. How many. */
const dominoDrawUntil = (room, pid) => {
  const s = room.shared;
  const g = room._domino;
  let n = 0;
  while (g.bone.length) {
    const t = g.bone.pop();
    g.hands[pid] = (g.hands[pid] || []).concat([t]);
    n++;
    if (dominoFits(s.table, t).length) break;
  }
  if (n) {
    // New tiles nobody has seen: what they lacked before may have changed.
    if (s.knocked) delete s.knocked[pid];
    dominoEvent(room, 'draw', { pid: pid, n: n });
  }
  s.turnSeq = (s.turnSeq || 0) + 1;
  return n;
};

/** Knocks: nothing goes and nothing is left to draw. The table now knows they lack these numbers. */
const dominoPass = (room, pid) => {
  const s = room.shared;
  const lacks = dominoEnds(s.table).map(e => e.value);
  s.knocked = s.knocked || {};
  s.knocked[pid] = Array.from(new Set((s.knocked[pid] || []).concat(lacks))).sort((a, b) => a - b);
  dominoEvent(room, 'pass', { pid: pid });
  if (dominoBlocked(room)) { dominoEndRound(room, 'blocked', null); return; }
  dominoNextTurn(room);
};

/**
 * The phone plays for a player - the clock ran out, the host moved a quiet
 * phone on, or a computer player's own move was refused: the first tile that
 * fits, else draw (and play what came), else knock.
 */
const dominoAuto = (room, pid, why) => {
  const s = room.shared;
  const g = room._domino;
  const firstFit = () => {
    for (const t of g.hands[pid] || []) { const f = dominoFits(s.table, t); if (f.length) return [t, f[0]]; }
    return null;
  };
  if (why) dominoEvent(room, 'auto', { pid: pid, why: why });
  let move = firstFit();
  if (!move && s.drawing && g.bone.length) {
    dominoDrawUntil(room, pid);
    if (dominoBlocked(room)) { dominoEndRound(room, 'blocked', null); return; }
    move = firstFit();
  }
  if (move) dominoPlay(room, pid, move[0], move[1]);
  else dominoPass(room, pid);
};

/* --- the end of a round, and of a game --------------------------------------------------- */

const dominoEndRound = (room, how, by) => {
  const s = room.shared;
  const g = room._domino;
  const hands = {};
  dominoSeated(room).forEach(pid => { hands[pid] = (g.hands[pid] || []).slice(); });
  const r = dominoRoundResult({ how: how, by: by, hands: hands, units: dominoUnits(room), mode: s.settings.mode });
  if (r.winner && r.points) dominoAddPoints(room, r.winner, r.points);
  s.result = Object.assign(r, { round: s.round, hands: hands, gained: Object.assign({}, s.gained), mode: s.settings.mode });
  s.lead = r.lead;
  s.turn = null;
  s.endsAt = null;
  dominoEvent(room, how === 'out' ? 'out' : 'blocked', { pid: by || undefined, winner: r.winner || undefined, tie: r.tie });
  const won = dominoGameWinner(s.scores, s.settings.target);
  if (won) dominoGameOver(room, won);
  else {
    s.phase = 'roundOver';
    room.phase = 'roundOver';
  }
};

/** The game is decided: `won` is a unit key (a player's id, or a side). */
const dominoGameOver = (room, won) => {
  const s = room.shared;
  s.winner = won || null;
  s.winners = !won ? [] : Array.isArray(s.teams) ? (s.teams[DOMINO_TEAM_KEYS.indexOf(won)] || []).slice() : [won];
  s.turn = null;
  s.endsAt = null;
  s.phase = 'gameover';
  room.phase = 'gameover';
};

/** A game that can't go on (a side lost a player, or one player is left): the scores so far decide it. */
const dominoFinishEarly = (room) => {
  const s = room.shared;
  const units = dominoUnits(room).filter(u => u.ids.length);
  const top = units.length ? Math.max.apply(null, units.map(u => s.scores[u.key] || 0)) : 0;
  const at = units.filter(u => (s.scores[u.key] || 0) === top);
  s.ended = 'left';
  dominoGameOver(room, top > 0 && at.length === 1 ? at[0].key : null);
};

/* --- the moves ------------------------------------------------------------------------------ */

const dominoAction = (room, playerId, action, payload) => {
  const p = payload || {};
  if (action === 'seats') { dominoLobbySeats(room, playerId, p); return; }
  if (action === 'start' || action === 'playAgain') { dominoNewGame(room, playerId, action, p); return; }
  const s = room.shared;
  if (!s || !s.phase || !room._domino) throw new Error('اللعبة لم تبدأ بعد');

  if (action === 'nextRound') {
    requireHost(room, playerId);
    if (s.phase !== 'roundOver') return;
    dominoDeal(room);
    return;
  }

  if (action === 'skipTurn') {
    // The host moves a quiet phone on: the phone plays for it, as the clock would.
    requireHost(room, playerId);
    if (s.phase !== 'play' || !s.turn || staleTap(p, 'seq', s.turnSeq)) return;
    dominoAuto(room, s.turn, 'host');
    dominoSync(room);
    return;
  }

  if (action === 'play' || action === 'draw' || action === 'pass') {
    if (s.phase !== 'play') return;
    // A tap aimed at a turn that has since moved on: dropped without a word.
    if (staleTap(p, 'seq', s.turnSeq)) return;
    if (dominoSeated(room).indexOf(playerId) === -1) throw new Error('انت مش في الدور ده');
    if (s.turn !== playerId) throw new Error('مش دورك');
    const g = room._domino;
    const hand = g.hands[playerId] || [];
    if (action === 'play') {
      dominoPlay(room, playerId, p.tile, p.end);
    } else if (dominoCanPlay(s.table, hand)) {
      throw new Error('معاك حجر راكب');
    } else if (action === 'draw') {
      if (!s.drawing) throw new Error('مفيش سحب في الدور ده');
      if (!g.bone.length) throw new Error('مفيش حجارة تتسحب');
      dominoDrawUntil(room, playerId);
      if (dominoBlocked(room)) dominoEndRound(room, 'blocked', null);
    } else {
      if (s.drawing && g.bone.length) throw new Error('اسحب الأول');
      dominoPass(room, playerId);
    }
    dominoSync(room);
    return;
  }

  throw new Error('إجراء غير معروف');
};

/* --- the clock ---------------------------------------------------------------------------- */

const dominoDeadline = (room) => {
  const s = room.shared || {};
  return s.phase === 'play' && s.endsAt && s.turn ? s.endsAt + DOMINO_GRACE_MS : null;
};

const dominoTimeout = (room, now) => {
  const s = room.shared || {};
  if (s.phase !== 'play' || !s.endsAt || !s.turn || !room._domino || now < s.endsAt + DOMINO_GRACE_MS) return false;
  dominoAuto(room, s.turn, 'clock');
  dominoSync(room);
  return true;
};

/* --- someone leaves ---------------------------------------------------------------------------
   A player on their own: their tiles are set aside (out of this round, seen by
   nobody, counted for nobody), their turn passes on, and the game goes on
   while two are left - one left, and the scores so far decide it. In teams a
   side of one can't play on, so the game ends there, decided by the scores.
   ------------------------------------------------------------------------------------------ */
const dominoPlayerLeft = (room, playerId, name) => {
  const s = room.shared;
  const g = room._domino;
  if (!s || !g || !Array.isArray(s.order)) return;
  const seat = s.order.indexOf(playerId);
  if (seat === -1 || s.phase === 'gameover') return;
  dominoEvent(room, 'left', { pid: playerId, name: name || undefined });
  if (Array.isArray(s.teams)) {
    s.order = s.order.filter(id => id !== playerId);
    s.teams = s.teams.map(t => t.filter(id => id !== playerId));
    delete g.hands[playerId];
    dominoFinishEarly(room);
    dominoSync(room);
    return;
  }
  const wasUp = s.phase === 'play' && s.turn === playerId;
  const next = s.order[(seat + 1) % s.order.length];
  g.aside = (g.aside || []).concat(g.hands[playerId] || []);
  delete g.hands[playerId];
  delete s.scores[playerId];
  if (s.knocked) delete s.knocked[playerId];
  if (s.lead === playerId) s.lead = null;
  s.order = s.order.filter(id => id !== playerId);
  if (s.order.length < DOMINO_MIN_PLAYERS) {
    dominoFinishEarly(room);
    dominoSync(room);
    return;
  }
  if (s.phase === 'play') {
    // Their tiles gone, the table may have nothing left that goes.
    if (dominoBlocked(room)) dominoEndRound(room, 'blocked', null);
    else if (wasUp) dominoStartTurn(room, next);
  }
  dominoSync(room);
};

/* --- computer players ------------------------------------------------------------------------
   A bot knows its own hand (room.secrets, what its phone would be sent) and
   what the table can see: the tiles down, how many each holds, how many are
   left to draw, and the numbers each player knocked on (shared.knocked). The
   easy one plays the first tile that fits. The hard one plays to win: in
   عادي it sheds heavy tiles, keeps a spread of numbers, plays doubles while
   they still go, leaves the next opponent ends they knocked on, and keeps
   ends its partner can follow; in أمريكاني it takes the move that scores
   most now and avoids leaving the next player an easy multiple of five.
   ------------------------------------------------------------------------------------------ */

/** Every legal move for a hand: [{ tile, end }]. */
const dominoMovesOf = (table, hand) => {
  const out = [];
  (hand || []).forEach(t => dominoFits(table, t).forEach(end => out.push({ tile: t, end: end })));
  return out;
};

/** The tiles a bot can't see anywhere: not in its hand, not on the table. */
const dominoUnseen = (table, hand) => {
  const down = new Set();
  (table.line || []).concat(table.up || [], table.down || []).forEach(x => down.add(x.t));
  (hand || []).forEach(t => down.add(t));
  return dominoSet().filter(t => !down.has(t));
};

const dominoBotScore = (room, pid, move, hand) => {
  const s = room.shared;
  const mode = s.settings.mode;
  const placed = dominoPlace(s.table, move.tile, move.end, mode);
  if (!placed) return -Infinity;
  const after = placed.table;
  const rest = hand.filter(t => t !== move.tile);
  const ends = dominoEnds(after).map(e => e.value);
  const order = s.order;
  const at = order.indexOf(pid);
  const next = order[(at + 1) % order.length];
  const partner = Array.isArray(s.teams) ? (s.teams.find(t => t.indexOf(pid) !== -1) || []).find(id => id !== pid) : null;
  const knocked = s.knocked || {};
  let score = 0;
  // Shed the heavy ones, and play doubles while they still go somewhere.
  score += dominoPips(move.tile) * (mode === 'american' ? 0.3 : 1);
  if (dominoIsDouble(move.tile)) score += 3;
  // Keep a spread of numbers, and ends this hand can follow.
  const numbers = new Set();
  rest.forEach(t => dominoParse(t).forEach(v => numbers.add(v)));
  score += numbers.size * 1.2;
  score += rest.filter(t => dominoFits(after, t).length).length * 0.8;
  // The next opponent knocked on these numbers: leave them nothing.
  const nextLacks = next && next !== partner ? (knocked[next] || []) : [];
  const blocked = ends.filter(v => nextLacks.indexOf(v) !== -1).length;
  score += blocked * 4 + (ends.length && blocked === ends.length ? 8 : 0);
  // The partner knocked on these: don't leave them.
  if (partner) score -= ends.filter(v => (knocked[partner] || []).indexOf(v) !== -1).length * 3;
  if (mode === 'american') {
    score += dominoPointsOf(dominoEndsSum(after)) * 12;
    // What the next player could score from here: the tiles unseen that go, and what each would make.
    const unseen = dominoUnseen(after, rest).filter(t => !dominoParse(t).some(v => nextLacks.indexOf(v) !== -1));
    if (unseen.length) {
      let total = 0;
      unseen.forEach(t => {
        let best = 0;
        dominoFits(after, t).forEach(end => { best = Math.max(best, dominoMoveScore(after, t, end, mode)); });
        total += best;
      });
      score -= (total / unseen.length) * (next === partner ? -3 : 6);
    }
  }
  return score;
};

/** A bot's move: what its phone would send. */
const dominoBotMove = (room, pid, level) => {
  const s = room.shared;
  if (s.phase !== 'play' || s.turn !== pid) return null;
  const hand = ((room.secrets[pid] || {}).hand || []).slice();
  const moves = dominoMovesOf(s.table, hand);
  if (!moves.length) return { action: s.drawing && s.bone > 0 ? 'draw' : 'pass', payload: { seq: s.turnSeq } };
  let pick = moves[0];
  if (level === 'hard') {
    let best = -Infinity;
    moves.forEach(m => {
      const v = dominoBotScore(room, pid, m, hand);
      if (v > best) { best = v; pick = m; }
    });
  }
  return { action: 'play', payload: { tile: pick.tile, end: pick.end, seq: s.turnSeq } };
};

ROOM_BOT_GAMES.domino = {
  max: DOMINO_MAX_PLAYERS,
  pending: (room) => {
    const s = room.shared || {};
    return s.phase === 'play' && s.turn && isRoomBot(room, s.turn) ? { pid: s.turn, key: s.turnSeq } : null;
  },
  decide: (room, pid) => dominoBotMove(room, pid, roomBotLevel(room, pid)),
  fallback: (room, pid) => dominoBotMove(room, pid, 'easy')
};
