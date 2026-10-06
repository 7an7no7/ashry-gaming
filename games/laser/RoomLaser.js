// Bundled into the rooms server after RoomGames.js (FILES in rooms-worker/build.mjs), whose helpers it uses.
/* ==========================================================================
   الليزر — Laser in rooms (the owner's rules of 6 Oct 2026, notes/games/laser.md)
   --------------------------------------------------------------------------
   A round: everyone still standing hides (a spot on the hexagon and an aim, on
   their own phone, 15 s or until all are ready), then everyone appears and
   every laser fires at once. A beam goes through everyone in its line (through
   teammates harmlessly when there are teams); whoever it touches is out. The
   arena shrinks every round. The last one standing (or the last team) wins; if
   the last ones all go out together, only they play on.

   The arena is a flat-topped hexagon of circumradius k (1 in round one), its
   middle at 0,0; a player is a circle of LASER_BODY. Spots and aims are
   room.secrets[pid] until the reveal (nothing about the others is seen while
   hiding, not even who is ready: the owner). The reveal is shared.shots; the
   phones and the TV play it from shared.revealAt.
   ========================================================================== */
const LASER_MIN_PLAYERS = 3;
const LASER_HIDE_MS = 15000;
const LASER_REVEAL_MS = 7000;
// LASER_BODY, laserK, laserClamp, laserAngle and laserHits are in Laser.js (the phone draws by them too).

/** Everyone still standing who is still in the room. */
const laserAlive = (room) => activeRoster(room, room.shared.alive);

/** A random spot inside the arena and a random aim. */
const laserRandomSpot = (k) => {
  const p = laserClamp((Math.random() * 2 - 1) * k, (Math.random() * 2 - 1) * k, k);
  return { x: p.x, y: p.y, a: laserAngle(Math.random() * 360) };
};

/** Teams dealt at random, as even as the table allows. */
const laserDealTeams = (ids, n) => {
  const teams = {};
  shuffled(ids.slice()).forEach((id, i) => { teams[id] = i % n; });
  return teams;
};

/** A hiding phase: everyone's last spot kept (pulled in by the smaller arena), nobody ready. */
const laserHide = (room) => {
  const s = room.shared;
  s.k = laserK(s.round);
  s.alive.forEach(pid => {
    const mine = room.secrets[pid] || laserRandomSpot(s.k);
    const p = laserClamp(mine.x, mine.y, s.k);
    room.secrets[pid] = { x: p.x, y: p.y, a: laserAngle(mine.a), ready: false, round: s.round };
  });
  s.phase = 'hide';
  s.endsAt = Date.now() + LASER_HIDE_MS;
  delete s.shots; delete s.hit; delete s.revealAt; delete s.kNext;
};

/** A new game: options from the start payload (or the last game's). */
const laserDeal = (room, opts) => {
  const roster = room.players.map(p => p.id);
  const want = [2, 3, 4].indexOf(Number(opts.teams)) !== -1 ? Number(opts.teams) : 0;
  const nTeams = want ? Math.min(want, roster.length - 1) : 0;
  room.secrets = {};
  roster.forEach(pid => { room.secrets[pid] = laserRandomSpot(1); });
  room.shared = {
    phase: 'hide', round: 1, roster, alive: roster.slice(), outRound: {}, opts: { teams: want },
    nTeams: nTeams >= 2 ? nTeams : 0, teams: nTeams >= 2 ? laserDealTeams(roster, nTeams) : null, tie: false
  };
  room.phase = 'play';
  if (room.shared.teams) { room.shared.phase = 'teams'; room.shared.endsAt = null; return; }
  laserHide(room);
};

/** The teams still with someone standing. */
const laserTeamsLeft = (s, alive) => alive.map(id => s.teams[id]).filter((t, i, a) => a.indexOf(t) === i);

/** The end: the board best first (the round you went out in; the winners one past the last). */
const laserOver = (room) => {
  const s = room.shared;
  const top = s.round + 1;
  const alive = laserAlive(room);
  const scoreOf = (pid) => (alive.indexOf(pid) !== -1 ? top : (s.outRound[pid] || 0));
  if (s.teams) {
    const teamScore = {};
    s.roster.forEach(pid => { const t = s.teams[pid]; teamScore[t] = Math.max(teamScore[t] || 0, scoreOf(pid)); });
    s.teamScore = teamScore;
    s.winnerTeam = alive.length ? s.teams[alive[0]] : null;
    s.board = s.roster.map(pid => ({ id: pid, name: roomPlayerName(room, pid), team: s.teams[pid], score: teamScore[s.teams[pid]], out: s.outRound[pid] || 0 }))
      .sort((a, b) => b.score - a.score || a.team - b.team);
  } else {
    s.board = s.roster.map(pid => ({ id: pid, name: roomPlayerName(room, pid), score: scoreOf(pid), out: s.outRound[pid] || 0 }))
      .sort((a, b) => b.score - a.score);
  }
  s.winners = alive;
  s.phase = 'gameover';
  s.endsAt = null;
  room.phase = 'gameover';
};

/** Is it over? One standing (or one team). Else nothing. Returns true when the game ended. */
const laserSettle = (room) => {
  const s = room.shared;
  if (!s || s.phase === 'gameover' || s.phase === 'reveal') return false;
  const alive = laserAlive(room);
  s.alive = alive;
  const left = s.teams ? laserTeamsLeft(s, alive).length : alive.length;
  if (left <= 1) { laserOver(room); return true; }
  return false;
};

/** Hiding is over: everyone appears, every laser fires at once. */
const laserReveal = (room) => {
  const s = room.shared;
  if (s.phase !== 'hide') return;
  const alive = laserAlive(room);
  s.alive = alive;
  s.shots = alive.map(pid => {
    const m = room.secrets[pid] || laserRandomSpot(s.k);
    return { id: pid, x: m.x, y: m.y, a: m.a };
  });
  s.hit = laserHits(s.shots, s.teams);
  s.phase = 'reveal';
  s.revealAt = Date.now();
  s.endsAt = s.revealAt + LASER_REVEAL_MS;
  const after = alive.filter(id => s.hit.indexOf(id) === -1);
  const left = s.teams ? laserTeamsLeft(s, after).length : after.length;
  // The next round's arena, unless this round ends it; a tie plays on, smaller.
  s.kNext = left === 1 ? s.k : laserK(s.round + 1);
  s.tieNext = left === 0;
};

/** After the reveal: the hit go out; the last one (or team) wins; a tie plays on among the tied. */
const laserAfterReveal = (room) => {
  const s = room.shared;
  if (s.phase !== 'reveal') return;
  const hit = (s.hit || []).filter(id => s.roster.indexOf(id) !== -1);
  const present = laserAlive(room);
  let after = present.filter(id => hit.indexOf(id) === -1);
  const left = s.teams ? laserTeamsLeft(s, after).length : after.length;
  s.tie = false;
  if (left === 0) {
    // Everyone left went out together: only they play on, on the smaller arena.
    after = present;
    s.tie = true;
  } else {
    hit.forEach(id => { s.outRound[id] = s.round; });
  }
  s.alive = after;
  s.phase = 'between';
  if (laserSettle(room)) return;
  s.round += 1;
  laserHide(room);
};

/** Everyone still standing is ready: the reveal now. */
const laserCheckReady = (room) => {
  const s = room.shared;
  if (s.phase !== 'hide') return;
  const alive = laserAlive(room);
  if (alive.length && alive.every(pid => (room.secrets[pid] || {}).ready)) laserReveal(room);
};

/** The places of a team game, the winners first (برنامج السهرة and the night's points). */
const laserTeamPlaces = (room) => {
  const s = room.shared || {};
  if (!s.teams || s.phase !== 'gameover' || !s.teamScore) return null;
  const order = Object.keys(s.teamScore).map(Number).sort((a, b) => s.teamScore[b] - s.teamScore[a]);
  const groups = [];
  order.forEach(t => {
    const ids = s.roster.filter(pid => s.teams[pid] === t);
    const same = groups.length && s.teamScore[t] === s.teamScore[groups[groups.length - 1].t];
    if (same) groups[groups.length - 1].ids = groups[groups.length - 1].ids.concat(ids);
    else groups.push({ t, ids });
  });
  return groups.map(g => g.ids);
};
PROGRAM_TEAMS.laser = laserTeamPlaces;

ROOM_RULES.laser = {
  action(room, playerId, action, payload) {
    payload = payload || {};
    if (action === 'start' || action === 'playAgain') {
      requireHost(room, playerId);
      if (room.players.length < LASER_MIN_PLAYERS) throw new Error('تحتاج ٣ لاعبين على الأقل');
      if (action === 'playAgain' && (room.shared || {}).phase !== 'gameover') return;
      laserDeal(room, action === 'playAgain' ? ((room.shared || {}).opts || {}) : payload);
      return;
    }
    const s = room.shared;
    if (!s || !s.phase) throw new Error('اللعبة لم تبدأ بعد');
    if (action === 'shuffle') {
      requireHost(room, playerId);
      if (s.phase !== 'teams') return;
      s.teams = laserDealTeams(s.roster, s.nTeams);
      return;
    }
    if (action === 'go') {
      requireMoveOn(room, playerId);
      if (s.phase !== 'teams') return;
      if (laserSettle(room)) return;
      laserHide(room);
      return;
    }
    const standing = laserAlive(room).indexOf(playerId) !== -1;
    if (action === 'place') {
      if (s.phase !== 'hide' || staleTap(payload, 'round', s.round) || !standing) return;
      const p = laserClamp(payload.x, payload.y, s.k);
      const mine = room.secrets[playerId] || {};
      room.secrets[playerId] = { x: p.x, y: p.y, a: laserAngle(payload.a), ready: !!mine.ready, round: s.round };
      return;
    }
    if (action === 'ready') {
      if (s.phase !== 'hide' || staleTap(payload, 'round', s.round) || !standing) return;
      const mine = room.secrets[playerId];
      if (!mine) return;
      mine.ready = payload.on !== false;
      laserCheckReady(room);
      return;
    }
    if (action === 'next') {
      requireMoveOn(room, playerId);
      if (s.phase !== 'reveal' || staleTap(payload, 'round', s.round)) return;
      laserAfterReveal(room);
      return;
    }
    throw new Error('إجراء غير معروف');
  },
  deadline(room) {
    const s = room.shared || {};
    return (s.phase === 'hide' || s.phase === 'reveal') && s.endsAt ? s.endsAt : null;
  },
  timeout(room, now) {
    const s = room.shared || {};
    if (!s.endsAt || now < s.endsAt) return false;
    if (s.phase === 'hide') { laserReveal(room); return true; }
    if (s.phase === 'reveal') { laserAfterReveal(room); return true; }
    return false;
  },
  left(room) {
    const s = room.shared || {};
    if (!s.phase || s.phase === 'gameover') return;
    if (s.phase === 'reveal') return;   // the reveal plays out; its end counts who is still here
    if (laserSettle(room)) return;
    laserCheckReady(room);
  }
};
