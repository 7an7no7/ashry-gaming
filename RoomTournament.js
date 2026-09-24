/* ============================================================================
   THE DUELS' TOURNAMENT (بطولة) - a knockout for a room of four or more
   ----------------------------------------------------------------------------
   The owner's decisions of 23 Sep 2026, asked one by one: a room duel plays
   "winner stays" (RoomDuels.js, the default) or a knockout tournament, a
   lobby switch shown only when the room has four people or more. The pairs
   are drawn at random, with byes the way a seeded draw sets them when the
   number isn't a power of two (the byes never meet in the first round, as in
   the Tournament Organizer tool); every match of a round is played at the
   same time, each pair on their own phones, while the TV and whoever is out
   or waiting watch the bracket fill in and can watch any match live. A drawn
   game is replayed with the other player starting, until someone wins. The
   end is a podium - the champion, the runner-up and the two semi-finalists -
   and the host deals a new tournament (a new draw) or goes back to winner
   stays.

   Built once for every duel. A match is a small room of its own (tourRoomOf):
   its two players, its own game state (shared.games[match]), its own hidden
   state (room._tourHidden[match], never projected) and its own secrets, which
   reach each seated phone as room.secrets[pid] = { tm: match, ...slice }. The
   game's own rules run on that small room exactly as they run on a whole room
   in winner stays - the same moves, the same checks, the same clock.

   PLUGGING A DUEL IN: one entry in TOUR_KINDS, an adapter:
     options(payload, prev)   the lobby's choices for every match (prev: the last ones)
     settingsOf(shared)       those choices, read back from a winner-stays game
     deal(v, settings, match) a fresh game on v.shared, whose seats, seatNames
                              and round are already set; match.games is how many
                              were dealt before (0 for the first, 1 after a draw…)
     act(v, pid, action, payload)  one move, through the game's own rules
     deadline(v) / timeout(v, now) the game's own clock, if it has one
     left(v, pid)             a seated player leaves: the game ends by forfeit
     stay(room, pid, settings) start winner stays with those choices
     drawRule(match, game)    optional: after a drawn game (match.draws already
                              counted), 'replay' or { winner: seat of that game }.
                              Without it every draw is replayed.
   A game is over when v.shared.phase is 'over'; v.shared.result.winner is the
   seat that won (0 or 1) or null for a draw - what duelEnd writes. The game's
   action function calls tourAction(room, pid, action, payload, game) first, and
   the client's side is one line in TOUR_CLIENT (JS_RoomTournament.html).

   The lobby's start carries `tournament: true`; shared, once it has begun:
     round     the tournament's number (tourNew carries it)
     settings  the lobby's choices, the same for every match
     tour      { no, size, rounds, entrants, names, phase: 'play' | 'over',
                 matches: [{ id, r, k, p: [a, b], out: [bye?, bye?], next, slot,
                             state: 'wait' | 'ready' | 'play' | 'done', startAt,
                             seats, games, draws, winner, loser, reason }],
                 gone, gameSeq, featured, champion, runnerUp, semis }
     games     { match id: that match's game, as the game keeps it }
     scores / board  tournament points (3 the champion, 2 the runner-up, 1 each
               semi-finalist), kept across tournaments until the hub: the
               night's leaderboard banks them
   ========================================================================= */
const TOUR_MIN = 4;             // people, not computer players
const TOUR_DRAW_MS = 4500;      // the draw flies onto every screen before the first matches start
const TOUR_NEXT_MS = 6000;      // a match whose two players are known starts after this
const TOUR_REPLAY_MS = 4000;    // a drawn game is replayed after this
const TOUR_POINTS = [3, 2, 1];  // the champion, the runner-up, each semi-finalist

/** The adapter of a winner-stays duel of RoomDuels.js (كونكت ٤, نقط ومربعات, إكس أو). */
const tourDuelKind = (kind) => ({
  options: (payload, prev) => DUEL_KINDS[kind].options(payload || {}, prev || {}),
  settingsOf: (s) => DUEL_KINDS[kind].options({}, s || {}),
  deal: (v, settings) => { Object.assign(v.shared, settings); duelDeal(v, kind); },
  act: (v, pid, action, payload) => {
    if (action !== 'move') throw new Error('إجراء غير معروف');
    duelAction(v, pid, 'move', payload, kind);
  },
  left: (v, pid) => duelPlayerLeft(v, pid),
  stay: (room, pid, settings) => duelAction(room, pid, 'start', Object.assign({}, settings), kind)
});

const TOUR_KINDS = {
  connect4: tourDuelKind('connect4'),
  dots: tourDuelKind('dots'),
  xo: tourDuelKind('xo'),
  guesswho: {
    options: (payload, prev) => gwOptions(payload || {}, prev || {}),
    settingsOf: (s) => gwOptions({}, (s || {}).settings || {}),
    deal: (v, settings) => { v.shared.settings = Object.assign({}, settings); gwDeal(v); },
    act: (v, pid, action, payload) => guessWhoAction(v, pid, action, payload),
    deadline: (v) => gwDeadline(v),
    timeout: (v, now) => gwTimeout(v, now),
    left: (v, pid) => gwPlayerLeft(v, pid),
    stay: (room, pid, settings) => gwNewRoomGame(room, pid, Object.assign({}, settings))
  },
  battleship: {
    options: (payload, prev) => bsOptions(payload || {}, prev || {}),
    settingsOf: (s) => bsOptions({}, (s || {}).settings || {}),
    deal: (v, settings) => { v.shared.settings = Object.assign({}, settings); bsDeal(v); },
    act: (v, pid, action, payload) => battleshipAction(v, pid, action, payload),
    deadline: (v) => bsDeadline(v),
    timeout: (v, now) => bsTimeout(v, now),
    left: (v, pid) => bsPlayerLeft(v, pid),
    stay: (room, pid, settings) => bsNewRoomGame(room, pid, Object.assign({}, settings))
  }
};

/* شطرنج: a drawn game is replayed once with the colours swapped; drawn again, one
   Armageddon game, White drawn by lot, in which a draw counts as a win for Black
   (the owner's rule, chessMatchNext in Chess.js). match.whites keeps who had White
   in each game of the match (public: the table saw it). */
const chessTourRecord = (m) => ({
  first: (m.whites || [])[0] === m.p[1] ? 'b' : 'a',
  games: (m.whites || []).map((w, i) => ({ white: w === m.p[1] ? 'b' : 'a', result: 'd', armageddon: i >= 2 }))
});

TOUR_KINDS.chess = {
  options: (payload, prev) => chessRoomOptions(payload || {}, prev || {}),
  settingsOf: (s) => chessRoomOptions({}, (s || {}).settings || {}),
  deal: (v, settings, m) => {
    const s = v.shared;
    s.settings = Object.assign({}, settings);
    let arma = false;
    if (m.games) {
      // Every earlier game of the match was drawn (or the match would be over).
      const next = chessMatchNext(chessTourRecord(m), Math.random);
      arma = !!next.armageddon;
      const white = next.white === 'b' ? m.p[1] : m.p[0];
      if (s.seats[0] !== white) {
        s.seats.reverse();
        s.seatNames.reverse();
        m.seats = s.seats.slice();
      }
    } else {
      m.whites = [];
    }
    m.whites = (m.whites || []).concat([s.seats[0]]);
    s.line = [];
    if (s.settings.variant === '960') {
      if (!m.start960) m.start960 = chess960Random(Math.random);
    }
    chessRoomDeal(v, { armageddon: arma, start: m.start960, tour: true });
    s.roster = s.seats.slice();
  },
  act: (v, pid, action, payload) => chessAction(v, pid, action, payload),
  deadline: (v) => chessDeadline(v),
  timeout: (v, now) => chessTimeout(v, now),
  left: (v, pid) => chessPlayerLeft(v, pid),
  stay: (room, pid, settings) => chessAction(room, pid, 'start', Object.assign({}, settings)),
  // An Armageddon draw is already Black's win on its board: a draw reaching here is game 1 or 2.
  drawRule: (m, g) => {
    const next = chessMatchNext(chessTourRecord(m), () => 0);
    if (!next.done) return 'replay';
    return { winner: (g.seats || [])[0] === (next.winner === 'b' ? m.p[1] : m.p[0]) ? 0 : 1 };
  }
};

const isTourRoom = (room) => !!(room && room.shared && room.shared.tour && TOUR_KINDS[room.game]);

/* --- the bracket ------------------------------------------------------------------ */

/** The places of seeds 1..size in a bracket: 1 v size, and so on down, halves kept apart (JS_Tournament.html's). */
const tourSeedOrder = (size) => {
  let order = [1];
  while (order.length < size) {
    const n = order.length * 2;
    order = order.reduce((out, x) => out.concat([x, n + 1 - x]), []);
  }
  return order;
};

/**
 * A knockout for `ids` (already shuffled: the draw): the next power of two,
 * the seeds above the number of players are byes (out[i]), every match knowing
 * where its winner goes (next, slot).
 */
const tourBracket = (ids) => {
  const n = ids.length;
  let size = 2;
  while (size < n) size *= 2;
  const rounds = Math.round(Math.log2(size));
  const matches = [];
  let first = 0;
  for (let r = 1; r <= rounds; r++) {
    const count = size >> r;
    const next = first + count;
    for (let k = 0; k < count; k++) {
      matches.push({
        id: 'm' + (first + k), r: r, k: k, p: [null, null], out: [false, false],
        next: r < rounds ? 'm' + (next + Math.floor(k / 2)) : null, slot: k % 2,
        state: 'wait', startAt: null, seats: null, games: 0, draws: 0, winner: null, loser: null, reason: null
      });
    }
    first = next;
  }
  const order = tourSeedOrder(size);
  for (let k = 0; k < size / 2; k++) {
    const m = matches[k];
    [order[2 * k], order[2 * k + 1]].forEach((seed, i) => {
      if (seed <= n) m.p[i] = ids[seed - 1];
      else m.out[i] = true;
    });
  }
  return { size: size, rounds: rounds, matches: matches };
};

const tourMatch = (t, id) => t.matches.find(m => m.id === id) || null;

/* --- a match as a small room -------------------------------------------------------- */

/** The room one match's rules run on: its two players, its game, its secrets and hidden state. */
const tourRoomOf = (room, m) => {
  const s = room.shared;
  const seats = m.seats || m.p;
  const hidden = (room._tourHidden || {})[m.id] || {};
  const secrets = {};
  seats.forEach(pid => {
    const mine = (room.secrets || {})[pid];
    if (mine && mine.tm === m.id) {
      const copy = Object.assign({}, mine);
      delete copy.tm;
      secrets[pid] = copy;
    }
  });
  const v = {
    code: room.code, game: room.game, hostId: room.hostId, phase: 'play',
    players: room.players.filter(p => seats.indexOf(p.id) !== -1),
    screens: [], shared: s.games[m.id] || {}, secrets: secrets
  };
  Object.keys(hidden).forEach(k => { v[k] = hidden[k]; });
  return v;
};

/** What the small room did goes back into the room: its game, its hidden state, the two phones' secrets. */
const tourCommit = (room, m, v) => {
  room.shared.games[m.id] = v.shared;
  room._tourHidden = room._tourHidden || {};
  const hidden = {};
  Object.keys(v).forEach(k => { if (k.charAt(0) === '_' && v[k] !== undefined) hidden[k] = v[k]; });
  room._tourHidden[m.id] = hidden;
  room.secrets = room.secrets || {};
  (v.shared.seats || []).forEach(pid => {
    if (v.secrets && v.secrets[pid]) room.secrets[pid] = Object.assign({ tm: m.id }, v.secrets[pid]);
    else delete room.secrets[pid];
  });
};

/** A new game of a match: the first at random who starts, a replay the other way round. */
const tourDeal = (room, m) => {
  const s = room.shared;
  const t = s.tour;
  const kind = TOUR_KINDS[room.game];
  const prev = s.games[m.id];
  const seats = m.games && m.seats ? [m.seats[1], m.seats[0]] : shuffled(m.p);
  t.gameSeq = (t.gameSeq || 0) + 1;
  m.seats = seats;
  const v = tourRoomOf(room, m);
  v.secrets = {};
  Object.keys(v).forEach(k => { if (k.charAt(0) === '_') delete v[k]; });
  v.shared = {
    // Unique across the evening's tournaments too: the phones key their play-once motion on it.
    round: (Number(t.no) || 0) * 1000 + t.gameSeq,
    dealId: m.id + '.' + (m.games + 1),
    seats: seats.slice(),
    seatNames: seats.map(id => t.names[id] || roomPlayerName(room, id)),
    line: [], champ: null, prev: null, streak: null, scores: {}, board: [],
    turnSeq: prev && prev.turnSeq ? prev.turnSeq : 0
  };
  kind.deal(v, s.settings, m);
  m.games++;
  m.state = 'play';
  m.startAt = null;
  tourCommit(room, m, v);
  // Both players have moved on: the games that brought them here aren't needed on every phone any more.
  t.matches.forEach(x => { if (x.next === m.id && x.state === 'done') tourDropGame(room, x.id); });
};

/** A finished match's board and hidden state go (and the TV stops showing it big). */
const tourDropGame = (room, id) => {
  const s = room.shared;
  const t = s.tour;
  if (s.games) delete s.games[id];
  if (room._tourHidden) delete room._tourHidden[id];
  if (t && t.featured === id) t.featured = null;
};

/** A match is decided: the winner goes on to the next one, or the tournament is over. */
const tourFinish = (room, m, winnerId, reason) => {
  const t = room.shared.tour;
  m.state = 'done';
  m.startAt = null;
  m.winner = winnerId || null;
  const other = m.p.find(id => id && id !== winnerId) || null;
  m.loser = winnerId && other ? other : null;
  m.reason = reason || null;
  if (!m.next) { tourOver(room); return; }
  const next = tourMatch(t, m.next);
  if (winnerId) next.p[m.slot] = winnerId;
  else next.out[m.slot] = true;
};

/**
 * Every match that can move on does: both players known makes it ready (it
 * starts `delay` later), one known against a bye or someone who has left is a
 * walkover, nobody at all leaves the slot empty in the next round.
 */
const tourAdvance = (room, now, delay) => {
  const t = room.shared.tour;
  if (!t || t.phase !== 'play') return;
  for (let moved = true; moved && t.phase === 'play';) {
    moved = false;
    for (const m of t.matches) {
      if (m.state !== 'wait') continue;
      if ([0, 1].some(i => !m.p[i] && !m.out[i])) continue;       // a slot not decided yet
      const here = m.p.filter(id => id && !t.gone[id]);
      if (m.p[0] && m.p[1] && here.length === 2) {
        m.state = 'ready';
        m.startAt = now + delay;
      } else {
        // A bye, or a player who has left before the match: a walkover. Nobody there: nobody goes on.
        tourFinish(room, m, here[0] || null, m.p[0] && m.p[1] ? 'left' : 'bye');
      }
      moved = true;
    }
  }
};

/** After a move, the clock or a leave: a game that ended decides the match, or a draw deals a replay. */
const tourCheck = (room, m, now) => {
  const s = room.shared;
  const g = s.games[m.id] || {};
  if (m.state !== 'play' || g.phase !== 'over') return;
  const r = g.result || {};
  const seats = g.seats || m.seats || [];
  if (r.winner === 0 || r.winner === 1) {
    tourFinish(room, m, seats[r.winner], r.reason === 'left' ? 'left' : 'won');
  } else {
    m.draws = (m.draws || 0) + 1;
    const kind = TOUR_KINDS[room.game];
    const rule = kind.drawRule ? kind.drawRule(m, g) : 'replay';
    if (rule && (rule.winner === 0 || rule.winner === 1)) {
      tourFinish(room, m, seats[rule.winner], 'draw');
    } else {
      m.state = 'ready';
      m.startAt = now + TOUR_REPLAY_MS;
    }
  }
  tourAdvance(room, now, TOUR_NEXT_MS);
};

/** The final is decided: the podium, the points, and the board the night's leaderboard banks. */
const tourOver = (room) => {
  const s = room.shared;
  const t = s.tour;
  const final = t.matches[t.matches.length - 1];
  t.phase = 'over';
  t.featured = null;
  t.champion = final.winner || null;
  t.runnerUp = final.loser || null;
  t.semis = t.matches.filter(m => m.r === t.rounds - 1 && m.loser).map(m => m.loser);
  const give = (id, n) => { if (id) s.scores[id] = (s.scores[id] || 0) + n; };
  give(t.champion, TOUR_POINTS[0]);
  give(t.runnerUp, TOUR_POINTS[1]);
  t.semis.forEach(id => give(id, TOUR_POINTS[2]));
  s.board = scoreboardOf(room);
  room.phase = 'over';
};

/* --- starting, and starting again ------------------------------------------------------ */

const tourStart = (room, playerId, payload, game) => {
  requireHost(room, playerId);
  const kind = TOUR_KINDS[game];
  const people = room.players.filter(p => !p.bot);
  if (people.length < TOUR_MIN) throw new Error('البطولة محتاجة ٤ لاعبين على الأقل');
  const prev = room.shared || {};
  const entrants = shuffled(people.map(p => p.id));
  const b = tourBracket(entrants);
  const names = {};
  people.forEach(p => { names[p.id] = p.name; });
  const t = {
    no: prev.tour ? (prev.tour.no || 0) + 1 : 1,
    size: b.size, rounds: b.rounds, entrants: entrants, names: names,
    matches: b.matches, phase: 'play', gone: {}, gameSeq: 0, featured: null,
    champion: null, runnerUp: null, semis: []
  };
  room.shared = {
    round: t.no,
    settings: kind.options(payload, prev.tour ? prev.settings : null),
    tour: t,
    games: {},
    // A new tournament after one keeps the points (like play again); from anything else they start at nothing.
    scores: prev.tour ? Object.assign({}, prev.scores || {}) : {},
    board: [],
    roster: entrants.slice()
  };
  room._tourHidden = {};
  room.secrets = {};
  room.phase = 'play';
  tourAdvance(room, Date.now(), TOUR_DRAW_MS);
  room.shared.board = scoreboardOf(room);
};

/**
 * Once it is over (a tournament, or a winner-stays game): the host deals a new
 * tournament - a new draw - or goes back to winner stays. Changing between the
 * two banks the board so far on the night's leaderboard first, as going back
 * to the hub would; a tournament after a tournament keeps adding up.
 */
const tourNew = (room, playerId, payload, game) => {
  requireHost(room, playerId);
  const kind = TOUR_KINDS[game];
  const s = room.shared || {};
  // A second tap for the same new tournament (or the same switch) is dropped before anything else.
  if (staleTap(payload, 'round', s.round)) return;
  const over = s.tour ? s.tour.phase === 'over' : s.phase === 'over';
  // A tap that carries what it saw and finds the room already moved on is a double tap: dropped quietly.
  if (!over && payload && payload.round !== undefined) return;
  if (!over) throw new Error('استنى لما الماتش يخلص');
  const settings = s.tour ? Object.assign({}, s.settings) : kind.settingsOf(s);
  if (payload.mode === 'tour') {
    if (!s.tour) bankNightPoints(room, s.board);
    tourStart(room, playerId, settings, game);
    return;
  }
  if (!s.tour) return;
  bankNightPoints(room, s.board);
  room.shared = {};
  room.secrets = {};
  room._tourHidden = null;
  kind.stay(room, playerId, settings);
};

/* --- the moves ------------------------------------------------------------------------ */

/**
 * Called first by every duel's action function (duelAction, guessWhoAction,
 * battleshipAction). True when the tournament took the action.
 */
const tourAction = (room, playerId, action, payload, game) => {
  const kind = TOUR_KINDS[game];
  if (!kind) return false;
  const p = payload || {};
  const s = room.shared || {};
  // `tournament`, not `mode`: كونكت ٤'s own lobby choice is already called mode (4 or 5 in a row).
  if (action === 'start' && p.tournament === true) { tourStart(room, playerId, p, game); return true; }
  if (action === 'tourNew') { tourNew(room, playerId, p, game); return true; }
  if (!s.tour) return false;
  const t = s.tour;
  if (action === 'tourFeature') {
    // The match the TV shows big (null: the bracket).
    requireHost(room, playerId);
    // 'bracket' (the TV's own button) is kept as it is: with no pick at all (null) the TV shows
    // the only match being played, so the button has to say "the bracket" in so many words.
    const id = p.match === 'bracket' ? 'bracket' : (p.match ? String(p.match) : null);
    if (!id || id === 'bracket' || tourMatch(t, id)) t.featured = id;
    return true;
  }
  // Winner stays' own "next game", or a second start: nothing to do in a tournament.
  if (action === 'start' || action === 'nextRound' || action === 'playAgain') return true;
  if (t.phase !== 'play') return true;
  const m = tourMatch(t, String(p.match || ''));
  if (!m) throw new Error('الماتش ده مش موجود');
  // A tap drawn for a match (or a game of it) that has moved on: the second tap of a double tap.
  if (m.state !== 'play' || staleTap(p, 'mg', m.games)) return true;
  const v = tourRoomOf(room, m);
  kind.act(v, playerId, action, p);
  tourCommit(room, m, v);
  tourCheck(room, m, Date.now());
  return true;
};

/* --- the clocks ----------------------------------------------------------------------- */

/** The soonest thing due: a match about to start, or a match's own clock. */
const tourDeadline = (room) => {
  const s = room.shared || {};
  const t = s.tour;
  if (!t || t.phase !== 'play') return null;
  const kind = TOUR_KINDS[room.game];
  let due = null;
  const sooner = (x) => { if (typeof x === 'number' && (due === null || x < due)) due = x; };
  t.matches.forEach(m => {
    if (m.state === 'ready') sooner(m.startAt);
    else if (m.state === 'play' && kind.deadline) sooner(kind.deadline({ shared: s.games[m.id] || {} }));
  });
  return due;
};

const tourTimeout = (room, now) => {
  const s = room.shared || {};
  const t = s.tour;
  if (!t || t.phase !== 'play') return false;
  const kind = TOUR_KINDS[room.game];
  let changed = false;
  t.matches.forEach(m => {
    if (t.phase !== 'play') return;
    if (m.state === 'ready' && typeof m.startAt === 'number' && now >= m.startAt) {
      tourDeal(room, m);
      changed = true;
    } else if (m.state === 'play' && kind.timeout && kind.deadline) {
      const due = kind.deadline({ shared: s.games[m.id] || {} });
      if (!due || now < due) return;
      const v = tourRoomOf(room, m);
      if (kind.timeout(v, now)) {
        tourCommit(room, m, v);
        tourCheck(room, m, now);
        changed = true;
      }
    }
  });
  return changed;
};

/* --- someone leaves ---------------------------------------------------------------------
   Their match is lost by forfeit - the game being played ends as it does in
   winner stays, a match about to start is a walkover - and so is any match
   they would have gone on to: the slot is kept, and the one who meets it
   walks over. A match both players have left sends nobody on, and the match
   after it is a walkover for whoever comes out of the other side; a final
   with nobody left ends the tournament with no champion. A latecomer watches
   the bracket and plays the next tournament.
   ------------------------------------------------------------------------------------ */
const tourPlayerLeft = (room, playerId) => {
  const s = room.shared;
  const t = s.tour;
  const now = Date.now();
  if (t.entrants.indexOf(playerId) !== -1) t.gone[playerId] = true;
  if (t.phase === 'play') {
    const kind = TOUR_KINDS[room.game];
    t.matches.forEach(m => {
      if (t.phase !== 'play' || m.p.indexOf(playerId) === -1) return;
      if (m.state === 'play') {
        const v = tourRoomOf(room, m);
        kind.left(v, playerId);
        tourCommit(room, m, v);
        tourCheck(room, m, now);
        // A game that didn't end on the leave (it can't here, but a new duel might): the match does.
        if (m.state === 'play') {
          const other = m.p.find(id => id !== playerId);
          tourFinish(room, m, other && !t.gone[other] ? other : null, 'left');
          tourAdvance(room, now, TOUR_NEXT_MS);
        }
      } else if (m.state === 'ready') {
        const other = m.p.find(id => id !== playerId);
        tourFinish(room, m, other && !t.gone[other] ? other : null, 'left');
        tourAdvance(room, now, TOUR_NEXT_MS);
      }
    });
  }
  s.board = scoreboardOf(room);
};
