// Bundled into the rooms server after RoomGames.js, RoomDuels.js, RoomTournament.js and RoomProgram.js (FILES in rooms-worker/build.mjs), whose helpers and registries it uses.
/* ==========================================================================
   سد الطريق — Block the Way in rooms (9 Oct 2026; the owner's rules in
   notes/games/blockway.md). The board and its rules are Blockway.js, shared
   with the phones; everything is public (a board has no secrets), so it all
   lives in room.shared.

   Three ways, the lobby's «طريقة اللعب» (payload.way):
   - 'duel' (the default): one against one, the duels' winner stays on and,
     from four people, their knockout tournament. It IS a duel: DUEL_KINDS.blockway
     plugs the board into RoomDuels.js (the line, the champion, «خسران غياب», the
     think clock, the move made for you) and TOUR_KINDS.blockway into
     RoomTournament.js, exactly as كونكت ٤ and نقط ومربعات are.
   - 'four': four on one board, each racing to the opposite side, 5 walls each.
     The first home wins and the game ends; the others are placed by how close
     they were (steps home, by the walls).
   - 'teams': two against two, partners opposite (seats 0 and 2, 1 and 3);
     either partner home wins for both.
   The four-seat ways keep the duel's shape (seats, turn, moves, turnAt, think,
   line: [] and the board fields) so the phones' clocks and chips read them the
   same way, with `multi: true` and `way`.

   shared (beside the duel's fields, RoomDuels.js):
     sides, pos, walls, left   the board (Blockway.js)
     last    { seat, kind: 'step' | 'wall', from, to, jump, wall, before, after, hit, auto }
             before / after: each seat's steps home around the move (the line
             under the board, the TV's ticker); hit: { seat, d } the seat a wall
             cost most
     level   the computer players' level: 'easy' | 'mid' | 'hard'
     think   seconds a move, 0 off (DUEL_THINK.blockway): at 0 a random step
   multi:
     way, seats [4 ids], seatNames, turn (a seat), starts (who moved first),
     sat (everyone who sat this session), scores (wins), teamWins [a, b],
     result { winner (seat), team, reason: home | left, winnerId, winnerName,
              order: [{ seat, id, name, steps, place }] }, board (wins, tie: this game's place)
   ========================================================================== */
const BW_MULTI_SEATS = 4;
const BW_THINK_GRACE_MS = 800;      // the server plays this long after the phones' clocks reach 0
const BW_AI_BUDGET_MS = 60;         // صعب weighs walls this long at most...
const BW_AI_MAX_WALLS = 160;        // ...and never more walls than this, whatever the clock says (traps: a search's ceiling)
const BW_PLACE_POINTS = [5, 3, 2];  // the night's 5 / 3 / 2 / 1 (NIGHT_PLACES), shown on the result

const bwLevelPick = (p, q) => {
  if (BW_LEVELS.indexOf((p || {}).level) !== -1) return p.level;
  return BW_LEVELS.indexOf((q || {}).level) !== -1 ? q.level : 'mid';
};

/** The board inside a room's shared state, as Blockway.js wants it (the same arrays: a move writes through). */
const bwBoardOf = (s) => ({ sides: s.sides, pos: s.pos, walls: s.walls, left: s.left });

/** The teams of a four-seat board: partners sit opposite. */
const bwTeamOf = (seat) => seat % 2;

/** One move by `seat`, applied to the room's board and remembered in s.last; returns bwPlay's answer. */
const bwApply = (s, seat, m, auto) => {
  const b = bwBoardOf(s);
  const before = bwStepsHome(b);
  const out = bwPlay(b, seat, m);
  const after = bwStepsHome(b);
  const last = { seat, kind: out.kind, before, after };
  if (out.kind === 'wall') {
    last.wall = { r: out.wall.r, c: out.wall.c, o: out.wall.o };
    let hit = null;
    after.forEach((d, i) => {
      if (i === seat || d === null || before[i] === null) return;
      if (s.multi && s.way === 'teams' && bwTeamOf(i) === bwTeamOf(seat)) return;
      const gain = d - before[i];
      if (gain > 0 && (!hit || gain > hit.d)) hit = { seat: i, d: gain };
    });
    if (hit) last.hit = hit;
  } else {
    last.from = out.from;
    last.to = s.pos[seat].slice();
    if (out.jump) last.jump = true;
  }
  if (auto) last.auto = true;
  s.last = last;
  return out;
};

/** The one move a seat can make, when it is known and doesn't win: a step, with no walls left to put. */
const bwOnly = (s, seat) => {
  if (!s || !Array.isArray(s.pos) || !s.pos[seat] || (s.left || [])[seat] > 0) return null;
  const steps = bwSteps(bwBoardOf(s), seat);
  if (steps.length !== 1 || bwAtGoal(s.sides[seat], steps[0].r, steps[0].c)) return null;
  return { to: [steps[0].r, steps[0].c] };
};

/** The clock ran out (or the seat is away): a random legal step (the owner's rule). */
const bwRandomStep = (s, seat, rnd) => {
  const steps = bwSteps(bwBoardOf(s), seat);
  if (!steps.length) return null;
  const x = steps[Math.floor((rnd || Math.random)() * steps.length)];
  return { to: [x.r, x.c] };
};

/* --- the duel: a kind of RoomDuels.js and of the tournament ------------------- */

DUEL_KINDS.blockway = {
  options: (payload, prev) => ({ think: duelThinkPick('blockway', payload, prev), level: bwLevelPick(payload, prev) }),
  deal: (s) => {
    const b = bwNewBoard(2);
    s.sides = b.sides; s.pos = b.pos; s.walls = b.walls; s.left = b.left;
  },
  move: (s, payload, seat) => {
    const out = bwApply(s, seat, payload, false);
    return out.home ? { end: true, winner: seat, reason: 'home' } : { end: false, again: false };
  },
  only: (s, seat) => bwOnly(s, seat),
  auto: (s, seat) => bwRandomStep(s, seat) || {}
};
TOUR_KINDS.blockway = tourDuelKind('blockway');

/* --- four on one board: everyone for themselves, or two against two ------------- */

/** Who sits down: those who waited last time first, then last game's seats best-placed first, people before computer players. */
const bwMultiPick = (room, s) => {
  const here = room.players.map(p => p.id);
  const bot = (id) => isRoomBot(room, id);
  const last = (s && s.result && s.result.order ? s.result.order.map(x => x.id) : (s && s.seats) || []).filter(id => here.indexOf(id) !== -1);
  const waited = here.filter(id => last.indexOf(id) === -1);
  const order = waited.filter(id => !bot(id)).concat(last.filter(id => !bot(id)), waited.filter(bot), last.filter(bot));
  return shuffled(order.slice(0, BW_MULTI_SEATS));
};

const bwMultiDeal = (room) => {
  const s = room.shared;
  const seats = bwMultiPick(room, s.seats ? s : null);
  if (seats.length < BW_MULTI_SEATS) throw new Error('الطريقة دي محتاجة ٤ - ضيف كمبيوتر لو ناقصين');
  const b = bwNewBoard(BW_MULTI_SEATS);
  s.seats = seats;
  s.seatNames = seats.map(id => roomPlayerName(room, id));
  s.sat = (s.sat || []).concat(seats).filter((id, i, a) => a.indexOf(id) === i);
  s.sides = b.sides; s.pos = b.pos; s.walls = b.walls; s.left = b.left;
  s.starts = typeof s.starts === 'number' ? (s.starts + 1) % BW_MULTI_SEATS : Math.floor(Math.random() * BW_MULTI_SEATS);
  s.turn = s.starts;
  s.moves = 0;
  s.turnAt = Date.now();
  s.last = null;
  s.result = null;
  s.roster = seats.slice();
  s.line = [];
  s.phase = 'play';
  room.phase = 'play';
};

const bwMultiStart = (room, playerId, payload) => {
  requireHost(room, playerId);
  if (room.players.length < BW_MULTI_SEATS) throw new Error('الطريقة دي محتاجة ٤ - ضيف كمبيوتر لو ناقصين');
  room.shared = Object.assign({
    multi: true,
    way: payload.way === 'teams' ? 'teams' : 'four',
    round: 1,
    scores: {},
    teamWins: [0, 0],
    board: []
  }, DUEL_KINDS.blockway.options(payload, null));
  bwMultiDeal(room);
  room.shared.board = bwMultiBoard(room);
};

/** The next seat still on the board after `seat`. */
const bwNextSeat = (s, seat) => {
  for (let k = 1; k <= BW_MULTI_SEATS; k++) {
    const n = (seat + k) % BW_MULTI_SEATS;
    if (s.pos[n]) return n;
  }
  return seat;
};

/** The table across the games: wins first, then this game's place. */
const bwMultiBoard = (room) => {
  const s = room.shared;
  const ids = (s.sat || []).filter(id => room.players.some(p => p.id === id));
  const placeOf = (id) => { const o = ((s.result || {}).order || []).find(x => x.id === id); return o ? o.place : 99; };
  return ids.map(id => ({ id, name: roomPlayerName(room, id), score: (s.scores || {})[id] || 0, tie: placeOf(id) }))
    .sort((a, b) => (b.score - a.score) || (a.tie - b.tie));
};

/** A four-seat game is over: `seat` got home (or is the last one standing). */
const bwMultiEnd = (room, seat, reason) => {
  const s = room.shared;
  const steps = bwStepsHome(bwBoardOf(s));
  const teams = s.way === 'teams';
  const rows = s.seats.map((id, k) => ({
    seat: k, id, name: s.seatNames[k] || roomPlayerName(room, id),
    steps: k === seat ? 0 : (steps[k] === null ? null : steps[k])
  }));
  const rank = (x) => {
    if (teams) return bwTeamOf(x.seat) === bwTeamOf(seat) ? (x.seat === seat ? 0 : 1) : 2 + (x.steps === null ? 99 : x.steps) / 100;
    return x.seat === seat ? -1 : (x.steps === null ? 999 : x.steps);
  };
  rows.sort((a, b) => rank(a) - rank(b));
  rows.forEach((x, i) => {
    if (teams) x.place = bwTeamOf(x.seat) === bwTeamOf(seat) ? 1 : 2;
    else x.place = x.seat === seat ? 1 : 1 + rows.filter(y => rank(y) < rank(x)).length;
    if (x.steps === null) x.gone = true;
  });
  const winners = teams ? s.seats.filter((id, k) => bwTeamOf(k) === bwTeamOf(seat)) : [s.seats[seat]];
  winners.forEach(id => { if (room.players.some(p => p.id === id)) addScore(room, id, 1); });
  if (teams) { s.teamWins = s.teamWins || [0, 0]; s.teamWins[bwTeamOf(seat)] += 1; }
  s.result = {
    winner: seat,
    team: teams ? bwTeamOf(seat) : null,
    reason,
    winnerId: s.seats[seat],
    winnerName: s.seatNames[seat] || roomPlayerName(room, s.seats[seat]),
    order: rows
  };
  s.phase = 'over';
  room.phase = 'over';
  s.board = bwMultiBoard(room);
};

/** A four-seat move by `seat` (a person, a computer player, or the clock). */
const bwMultiPlay = (room, seat, m, auto) => {
  const s = room.shared;
  const out = bwApply(s, seat, m, auto);
  s.moves = (s.moves || 0) + 1;
  if (out.home) { bwMultiEnd(room, seat, 'home'); return; }
  s.turn = bwNextSeat(s, seat);
  s.turnAt = Date.now();
};

const bwMultiAction = (room, playerId, action, p) => {
  const s = room.shared;
  if (action === 'move') {
    if (s.phase !== 'play') return;
    if (staleTap(p, 'move', s.moves)) return;
    const seat = s.seats.indexOf(playerId);
    if (seat === -1 || !s.pos[seat]) throw new Error('انت بتتفرج دلوقتي، هتلعب الجولة الجاية');
    if (seat !== s.turn) throw new Error('مش دورك');
    bwMultiPlay(room, seat, p, false);
    return;
  }
  if (action === 'playAgain' || action === 'nextRound') {
    if (s.phase !== 'over') return;
    if (staleTap(p, 'round', s.round)) return;
    if (!room.players.some(x => x.id === playerId) && room.hostId !== playerId) throw new Error('لست في الغرفة');
    s.prev = s.result;
    s.round = (s.round || 1) + 1;
    bwMultiDeal(room);
    s.board = bwMultiBoard(room);
    return;
  }
  if (action === 'start') return;
  throw new Error('إجراء غير معروف');
};

/** Someone left: their piece leaves the board (their walls stay); the last one or the last side standing wins. */
const bwMultiLeft = (room, playerId) => {
  const s = room.shared;
  const seat = (s.seats || []).indexOf(playerId);
  if (seat !== -1 && s.phase === 'play' && s.pos[seat]) {
    s.pos[seat] = null;
    s.moves = (s.moves || 0) + 1;
    const on = s.seats.map((id, k) => k).filter(k => s.pos[k]);
    const sidesOn = s.way === 'teams' ? on.map(bwTeamOf).filter((t, i, a) => a.indexOf(t) === i) : on;
    if (sidesOn.length <= 1 && on.length) { bwMultiEnd(room, on[0], 'left'); return; }
    if (s.turn === seat) { s.turn = bwNextSeat(s, seat); s.turnAt = Date.now(); }
  }
  s.board = bwMultiBoard(room);
};

/** The seat up's think clock (and the grace), or their phone gone DUEL_AWAY_MS: the server steps for them. */
const bwMultiDeadline = (room) => {
  const s = room.shared || {};
  if (!s.multi || s.phase !== 'play' || !Array.isArray(s.seats)) return null;
  let due = null;
  const sec = Number(s.think) || 0;
  if (sec && DUEL_THINK.blockway.indexOf(sec) !== -1) due = (Number(s.turnAt) || 0) + sec * 1000 + BW_THINK_GRACE_MS;
  const pid = s.seats[s.turn];
  const since = pid && room.lastSeen ? Number(room.lastSeen[pid]) || 0 : 0;
  if (since) {
    const away = Math.max(since, Number(s.turnAt) || 0) + DUEL_AWAY_MS;
    due = due === null ? away : Math.min(due, away);
  }
  return due;
};

const bwMultiTimeout = (room, now) => {
  const due = bwMultiDeadline(room);
  if (due === null || now < due) return false;
  const s = room.shared;
  const m = bwRandomStep(s, s.turn);
  if (!m) { s.turn = bwNextSeat(s, s.turn); s.turnAt = now; return true; }
  bwMultiPlay(room, s.turn, m, true);
  return true;
};

const bwMultiForced = (room) => {
  const s = room.shared || {};
  if (s.phase !== 'play' || !Array.isArray(s.seats)) return null;
  const m = bwOnly(s, s.turn);
  if (!m) return null;
  return { pid: s.seats[s.turn], key: ['bw', s.round, s.moves].join('|'), move: { action: 'move', payload: Object.assign({ move: s.moves }, m) } };
};

/* --- the rules, registered ------------------------------------------------------ */

ROOM_RULES.blockway = {
  action(room, playerId, action, payload) {
    const p = payload || {};
    if (action === 'start' && room.phase === 'lobby' && (p.way === 'four' || p.way === 'teams')) { bwMultiStart(room, playerId, p); return; }
    const s = room.shared || {};
    if (s.multi && room.phase !== 'lobby') { bwMultiAction(room, playerId, action, p); return; }
    duelAction(room, playerId, action, p, 'blockway');
  },
  deadline(room) {
    const s = room.shared || {};
    return s.multi ? bwMultiDeadline(room) : duelAwayDeadline(room);
  },
  timeout(room, now) {
    const s = room.shared || {};
    return s.multi ? bwMultiTimeout(room, now) : duelAwayTimeout(room, now);
  },
  left(room, playerId) {
    const s = room.shared || {};
    if (!s.phase) return;
    if (s.multi) bwMultiLeft(room, playerId);
    else duelPlayerLeft(room, playerId);
  }
};

// One thing to do is done for you (GEMINI.md): a step, with no walls left, that doesn't win.
ROOM_FORCED_GAMES.blockway = (room) => ((room.shared || {}).multi ? bwMultiForced(room) : duelForced('blockway')(room));

// الشلة / the program: two against two places its sides, the one with more wins first (the last game's side on a tie).
PROGRAM_TEAMS.blockway = (room) => {
  const s = room.shared || {};
  if (!s.multi || s.way !== 'teams' || !Array.isArray(s.seats) || !s.result) return null;
  const sides = [s.seats.filter((id, k) => bwTeamOf(k) === 0), s.seats.filter((id, k) => bwTeamOf(k) === 1)];
  const w = s.teamWins || [0, 0];
  const first = w[0] === w[1] ? s.result.team : (w[0] > w[1] ? 0 : 1);
  return [sides[first], sides[1 - first]];
};

/* --- computer players: سهل, وسط, صعب (the host's lobby choice) ----------------------
   سهل mostly walks its shortest way and now and then wanders or drops a wall near
   someone; وسط walks, and fences off whoever is ahead of it when a wall costs them
   two steps more than it costs itself; صعب weighs every wall along the others'
   shortest ways (BW_AI_BUDGET_MS, at most BW_AI_MAX_WALLS) and puts the one that
   gains it most against the nearest rival, or walks when no wall beats a step. */

/** The squares of `seat`'s shortest way home, from where it stands. */
const bwPathOf = (b, g, seat, map) => {
  const p = b.pos[seat];
  if (!p) return [];
  const d = map || bwDistMap(g, b.sides[seat]);
  const out = [p.slice()];
  let [r, c] = p;
  for (let guard = 0; guard < 81 && d[r * 9 + c] > 0; guard++) {
    const next = BW_DIRS.map(([dr, dc]) => [r + dr, c + dc]).find(([r2, c2]) => bwIn(r2, c2) && bwOpen(g, r, c, r2, c2) && d[r2 * 9 + c2] === d[r * 9 + c] - 1);
    if (!next) break;
    [r, c] = next;
    out.push([r, c]);
  }
  return out;
};

/** The walls that would cut a way between its squares, each once. */
const bwWallsAcross = (path) => {
  const out = [];
  const add = (r, c, o) => { if (r >= 0 && r < 8 && c >= 0 && c < 8 && !out.some(w => w.r === r && w.c === c && w.o === o)) out.push({ r, c, o }); };
  for (let i = 1; i < path.length; i++) {
    const [r1, c1] = path[i - 1], [r2, c2] = path[i];
    if (c1 === c2) { const r = Math.min(r1, r2); add(r, c1, 'h'); add(r, c1 - 1, 'h'); }
    else { const c = Math.min(c1, c2); add(r1, c, 'v'); add(r1 - 1, c, 'v'); }
  }
  return out;
};

/** How a board stands for `seat`: the nearest rival's steps less its own (its side's, in teams). Bigger is better. */
const bwStanding = (s, seat, steps) => {
  const teams = s.multi && s.way === 'teams';
  const mine = (k) => k === seat || (teams && bwTeamOf(k) === bwTeamOf(seat));
  let me = Infinity, them = Infinity;
  steps.forEach((d, k) => {
    if (d === null || d < 0) return;
    if (mine(k)) me = Math.min(me, d); else them = Math.min(them, d);
  });
  return { me, them, v: them - me };
};

/** A computer player's move: { to } or { wall }. */
const bwAiMove = (s, seat, level, rnd) => {
  rnd = rnd || Math.random;
  const b = bwBoardOf(s);
  const g = bwGrid(b.walls);
  const map = bwDistMap(g, b.sides[seat]);
  const steps = bwSteps(b, seat, g);
  if (!steps.length) return null;
  const home = steps.find(x => bwAtGoal(b.sides[seat], x.r, x.c));
  if (home) return { to: [home.r, home.c] };
  const best = Math.min.apply(null, steps.map(x => (map[x.r * 9 + x.c] < 0 ? 99 : map[x.r * 9 + x.c])));
  const goods = steps.filter(x => map[x.r * 9 + x.c] === best);
  const walk = () => { const x = goods[Math.floor(rnd() * goods.length)]; return { to: [x.r, x.c] }; };
  const rivals = b.pos.map((p, k) => k).filter(k => k !== seat && b.pos[k] && !(s.multi && s.way === 'teams' && bwTeamOf(k) === bwTeamOf(seat)));
  const hasWalls = (b.left[seat] || 0) > 0 && rivals.length;
  if (level === 'easy') {
    if (hasWalls && rnd() < 0.18) {
      const k = rivals[Math.floor(rnd() * rivals.length)];
      const cands = bwWallsAcross(bwPathOf(b, g, k));
      for (let i = 0; i < 8 && cands.length; i++) {
        const w = cands.splice(Math.floor(rnd() * cands.length), 1)[0];
        if (!bwWallCheck(b, w).why) return { wall: w };
      }
    }
    if (rnd() < 0.25) { const x = steps[Math.floor(rnd() * steps.length)]; return { to: [x.r, x.c] }; }
    return walk();
  }
  if (!hasWalls) return walk();
  const homeSteps = bwStepsHome(b);
  const now = bwStanding(s, seat, homeSteps);
  // A step home makes my side one closer: that is what a wall has to beat.
  const afterStep = now.v + 1;
  // وسط fences off only whoever is level with it or ahead; صعب weighs everyone.
  const targets = level === 'hard' ? rivals : rivals.filter(k => homeSteps[k] !== null && homeSteps[k] <= now.me);
  if (!targets.length) return walk();
  let cands = [];
  targets.forEach(k => { bwWallsAcross(bwPathOf(b, g, k)).forEach(w => { if (!cands.some(x => x.r === w.r && x.c === w.c && x.o === w.o)) cands.push(w); }); });
  if (level === 'mid') cands = cands.slice(0, 40);
  const t0 = Date.now();
  let top = null;
  for (let i = 0; i < cands.length && i < BW_AI_MAX_WALLS; i++) {
    if (level === 'hard' && i > 0 && Date.now() - t0 > BW_AI_BUDGET_MS) break;
    const chk = bwWallCheck(b, cands[i]);
    if (chk.why) continue;
    const v = bwStanding(s, seat, chk.steps).v;
    if (!top || v > top.v || (v === top.v && rnd() < 0.5)) top = { w: cands[i], v };
  }
  // A wall has to beat the step it costs: by one step at least (two steps on the rival for none of
  // mine); صعب also takes an even trade once a rival is three steps from home.
  const need = level === 'hard' && now.them <= 3 ? 0 : 1;
  if (top && top.v - afterStep >= need) return { wall: top.w };
  return walk();
};

ROOM_BOT_GAMES.blockway = {
  max: 8,
  pending(room) {
    const s = room.shared || {};
    if (s.tour || s.phase !== 'play' || !Array.isArray(s.seats)) return null;
    const pid = s.seats[s.turn];
    return pid && isRoomBot(room, pid) ? { pid, key: [s.round, s.moves].join('|') } : null;
  },
  decide(room, pid) {
    const s = room.shared;
    const seat = s.seats.indexOf(pid);
    const m = bwAiMove(s, seat, BW_LEVELS.indexOf(s.level) !== -1 ? s.level : 'mid');
    return m ? { action: 'move', payload: Object.assign({ move: s.moves }, m) } : null;
  },
  fallback(room, pid) {
    const s = room.shared;
    const m = bwRandomStep(s, s.seats.indexOf(pid));
    return m ? { action: 'move', payload: Object.assign({ move: s.moves }, m) } : null;
  }
};
