// Bundled into the rooms server after RoomGames.js (FILES in rooms-worker/build.mjs), whose helpers it uses.
/* ==========================================================================
   الليزر — Laser in rooms (the owner's rules of 6 Oct 2026, notes/games/laser.md)
   --------------------------------------------------------------------------
   A round: everyone still standing hides (a spot on the hexagon and an aim, on
   their own phone, until the clock or until all are ready), then everyone
   appears and every laser fires at once. A beam goes through everyone in its
   line (through teammates harmlessly when there are teams); whoever it touches
   loses a heart, and with none left is out. The arena shrinks every round. The
   last one standing (or the last team) wins; if the last ones all go out
   together, only they play on.

   Round two (the owner, 6 Oct 2026): hearts (1-3), a shield once a game
   (blocks every beam, fires nothing), ghosts (whoever is out drops a hidden mine
   a round; with «تبديل الأماكن» a ghost whose mine takes someone out comes back),
   bouncing beams, blocking beams, sudden death after two quiet rounds, the
   hiding time a second shorter each round, a short reveal when nobody is hit,
   hits counted (the tie-break) and the awards, teams seeing their teammates.

   The arena is a flat-topped hexagon of circumradius k (1 in round one), its
   middle at 0,0; a player is a circle of LASER_BODY. Spots, aims, shields and
   mines are room.secrets[pid] until the reveal (nothing about the others is
   seen while hiding, not even who is ready: the owner; a teammate's spot is,
   when the host leaves team sight on). The reveal is shared.shots, .beams and
   .mines; the phones and the TV play it from shared.revealAt.
   ========================================================================== */
const LASER_MIN_PLAYERS = 3;
const LASER_REVEAL_MS = 7000;        // a round with a hit
const LASER_REVEAL_QUIET_MS = 4000;  // nobody hit
const LASER_HIDE_MIN_S = 8;
// LASER_BODY, laserK, laserClamp, laserAngle, laserTrace and laserMineHits are in Laser.js.

/** The game's options from a start payload, every one with its default (the owner's). */
const laserOptsOf = (p) => {
  p = p || {};
  const pick = (v, list, d) => (list.indexOf(Number(v)) !== -1 ? Number(v) : d);
  const on = (v, d) => (v === undefined || v === null ? d : !!v);
  return {
    teams: pick(p.teams, [0, 2, 3, 4], 0),
    hearts: pick(p.hearts, [1, 2, 3], 1),
    time: pick(p.time, [10, 15, 20], 15),
    ghosts: on(p.ghosts, true),
    swap: on(p.swap, false),
    bounce: on(p.bounce, false),
    block: on(p.block, false),
    sight: on(p.sight, true)
  };
};

/** Everyone still standing who is still in the room. */
const laserAlive = (room) => activeRoster(room, room.shared.alive);

/** The ghosts: everyone of the game who is out and still in the room (with ghosts on). */
const laserGhosts = (room) => {
  const s = room.shared;
  if (!s.opts || !s.opts.ghosts) return [];
  return activeRoster(room, s.roster).filter(id => s.alive.indexOf(id) === -1);
};

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

/** With team sight, every standing player's slice carries their standing teammates' spots. */
const laserShareMates = (room) => {
  const s = room.shared;
  if (!s.teams || !s.opts.sight) return;
  s.alive.forEach(pid => {
    const mine = room.secrets[pid];
    if (!mine || mine.ghost) return;
    const mates = {};
    s.alive.forEach(q => {
      const m = room.secrets[q];
      if (q !== pid && s.teams[q] === s.teams[pid] && m && !m.ghost) mates[q] = { x: m.x, y: m.y, a: m.a, shield: !!m.shield };
    });
    mine.mates = mates;
  });
};

/** A hiding phase: everyone's last spot kept (pulled in by the smaller arena), nobody ready. */
const laserHide = (room) => {
  const s = room.shared;
  s.alive.forEach(pid => {
    const old = room.secrets[pid];
    const mine = old && !old.ghost ? old : laserRandomSpot(s.k);
    const p = laserClamp(mine.x, mine.y, s.k);
    room.secrets[pid] = { x: p.x, y: p.y, a: laserAngle(mine.a), ready: false, shield: false, round: s.round };
  });
  laserGhosts(room).forEach(pid => { room.secrets[pid] = { ghost: true, mine: null, round: s.round }; });
  laserShareMates(room);
  s.phase = 'hide';
  s.hideMs = Math.max(LASER_HIDE_MIN_S, s.opts.time - (s.round - 1)) * 1000;
  s.endsAt = Date.now() + s.hideMs;
  ['shots', 'beams', 'mines', 'hit', 'out', 'back', 'revealAt', 'revealMs', 'kNext', 'tieNext', 'suddenNext', 'roundKills'].forEach(f => { delete s[f]; });
};

/** A new game: options from the start payload (or the last game's). */
const laserDeal = (room, payload) => {
  const roster = room.players.map(p => p.id);
  const opts = laserOptsOf(payload);
  const nTeams = opts.teams ? Math.min(opts.teams, roster.length - 1) : 0;
  room.secrets = {};
  roster.forEach(pid => { room.secrets[pid] = laserRandomSpot(1); });
  const hearts = {};
  roster.forEach(pid => { hearts[pid] = opts.hearts; });
  room.shared = {
    phase: 'hide', round: 1, roster, alive: roster.slice(), outRound: {}, opts,
    nTeams: nTeams >= 2 ? nTeams : 0, teams: nTeams >= 2 ? laserDealTeams(roster, nTeams) : null, tie: false,
    k: laserK(1), hearts, shieldUsed: {}, hitsBy: {}, near: {}, kills: [], quiet: 0
  };
  room.phase = 'play';
  if (room.shared.teams) { room.shared.phase = 'teams'; room.shared.endsAt = null; return; }
  laserHide(room);
};

/** The teams still with someone standing. */
const laserTeamsLeft = (s, alive) => alive.map(id => s.teams[id]).filter((t, i, a) => a.indexOf(t) === i);
const laserLeftCount = (s, ids) => (s.teams ? laserTeamsLeft(s, ids).length : ids.length);

/** The four awards (the owner, 6 Oct 2026): { key, ids } each, only the ones somebody earned. */
const laserAwards = (s, scoreOf) => {
  const ids = s.roster;
  const hits = (id) => s.hitsBy[id] || 0;
  const out = [];
  const most = Math.max(0, ...ids.map(hits));
  if (most > 0) out.push({ key: 'sniper', ids: ids.filter(id => hits(id) === most), n: most });
  const clean = ids.filter(id => !hits(id));
  if (clean.length) {
    const best = Math.max(...clean.map(scoreOf));
    out.push({ key: 'ghost', ids: clean.filter(id => scoreOf(id) === best) });
  }
  const nears = ids.filter(id => typeof s.near[id] === 'number');
  if (nears.length) {
    const close = Math.min(...nears.map(id => s.near[id]));
    out.push({ key: 'close', ids: nears.filter(id => s.near[id] === close) });
  }
  const both = ids.filter(id => s.outRound[id] && s.kills.some(k => k.from === id && k.r === s.outRound[id]));
  if (both.length) out.push({ key: 'both', ids: both });
  return out;
};

/** The end: the board best first (the round you went out in, the winners one past the last; more
    hits first among those out in the same round), and the awards. */
const laserOver = (room) => {
  const s = room.shared;
  const top = s.round + 1;
  const alive = laserAlive(room);
  const scoreOf = (pid) => (alive.indexOf(pid) !== -1 ? top : (s.outRound[pid] || 0));
  const hits = (pid) => s.hitsBy[pid] || 0;
  if (s.teams) {
    const teamScore = {};
    s.roster.forEach(pid => { const t = s.teams[pid]; teamScore[t] = Math.max(teamScore[t] || 0, scoreOf(pid)); });
    s.teamScore = teamScore;
    s.winnerTeam = alive.length ? s.teams[alive[0]] : null;
    s.board = s.roster.map(pid => ({ id: pid, name: roomPlayerName(room, pid), team: s.teams[pid], score: teamScore[s.teams[pid]], out: s.outRound[pid] || 0, hits: hits(pid) }))
      .sort((a, b) => b.score - a.score || a.team - b.team || b.hits - a.hits);
  } else {
    s.board = s.roster.map(pid => ({ id: pid, name: roomPlayerName(room, pid), score: scoreOf(pid), tie: hits(pid), out: s.outRound[pid] || 0, hits: hits(pid) }))
      .sort((a, b) => b.score - a.score || b.tie - a.tie);
  }
  s.awards = laserAwards(s, scoreOf);
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
  if (laserLeftCount(s, alive) <= 1) { laserOver(room); return true; }
  return false;
};

/** Hiding is over: everyone appears, every laser fires at once, every mine goes off. */
const laserReveal = (room) => {
  const s = room.shared;
  if (s.phase !== 'hide') return;
  const alive = laserAlive(room);
  s.alive = alive;
  s.shots = alive.map(pid => {
    const m = room.secrets[pid] && !room.secrets[pid].ghost ? room.secrets[pid] : laserRandomSpot(s.k);
    const shield = !!m.shield && !s.shieldUsed[pid];
    return { id: pid, x: m.x, y: m.y, a: m.a, shield };
  });
  const trace = laserTrace(s.shots, { k: s.k, teams: s.teams, bounce: s.opts.bounce, block: s.opts.block });
  s.beams = trace.beams;
  Object.keys(trace.near).forEach(id => {
    s.near[id] = typeof s.near[id] === 'number' ? Math.min(s.near[id], trace.near[id]) : trace.near[id];
  });
  s.mines = laserGhosts(room).map(g => {
    const m = (room.secrets[g] || {}).mine;
    return m ? { id: g, x: m.x, y: m.y, hits: laserMineHits({ id: g, x: m.x, y: m.y }, s.shots, s.teams) } : null;
  }).filter(Boolean);
  s.shots.forEach(p => { if (p.shield) s.shieldUsed[p.id] = true; });
  // Who hit whom: one heart a round, however many beams or mines.
  const kills = [];
  s.beams.forEach(b => b.hits.forEach(to => kills.push({ r: s.round, from: b.id, to, by: 'beam' })));
  s.mines.forEach(m => m.hits.forEach(to => kills.push({ r: s.round, from: m.id, to, by: 'mine' })));
  s.roundKills = kills;
  s.hit = kills.map(k => k.to).filter((id, i, a) => a.indexOf(id) === i);
  s.out = s.hit.filter(id => (s.hearts[id] || 1) <= 1);
  // A ghost whose mine takes someone out comes back, with «تبديل الأماكن» on.
  s.back = s.opts.swap ? kills.filter(k => k.by === 'mine' && s.out.indexOf(k.to) !== -1).map(k => k.from)
    .filter((id, i, a) => a.indexOf(id) === i) : [];
  const after = alive.filter(id => s.out.indexOf(id) === -1).concat(s.back);
  const left = laserLeftCount(s, after);
  // The next round's arena: smaller each round to the floor; past it, after two rounds with
  // nobody hit, smaller again every round until someone is (sudden death).
  const quiet = s.hit.length ? 0 : (s.quiet || 0) + 1;
  const normal = Math.min(s.k, laserK(s.round + 1));
  const sudden = quiet >= 2 && normal >= s.k - 1e-9 && s.k > LASER_K_SUDDEN_MIN + 1e-9;
  s.kNext = left === 1 ? s.k : (sudden ? laserR3(Math.max(LASER_K_SUDDEN_MIN, s.k - LASER_K_SUDDEN_STEP)) : normal);
  s.suddenNext = left !== 1 && sudden;
  s.tieNext = left === 0;
  s.phase = 'reveal';
  s.revealAt = Date.now();
  s.revealMs = s.hit.length ? LASER_REVEAL_MS : LASER_REVEAL_QUIET_MS;
  s.endsAt = s.revealAt + s.revealMs;
};

/** After the reveal: hearts are lost, the out go out (ghosts come back by a swap); the last one (or
    team) wins; a tie plays on among the tied, each with one heart. */
const laserAfterReveal = (room) => {
  const s = room.shared;
  if (s.phase !== 'reveal') return;
  const present = laserAlive(room);
  const inRoom = activeRoster(room, s.roster);
  const back = (s.back || []).filter(id => inRoom.indexOf(id) !== -1);
  const out = (s.out || []).filter(id => s.roster.indexOf(id) !== -1);
  let after = present.filter(id => out.indexOf(id) === -1).concat(back.filter(id => present.indexOf(id) === -1));
  s.tie = false;
  (s.roundKills || []).forEach(k => {
    s.kills.push(k);
    s.hitsBy[k.from] = (s.hitsBy[k.from] || 0) + 1;
  });
  if (laserLeftCount(s, after) === 0) {
    // Everyone left went out together: only they play on, on the smaller arena, one heart each.
    after = present;
    after.forEach(id => { s.hearts[id] = Math.max(1, (s.hearts[id] || 1) - 1); });
    s.tie = true;
  } else {
    (s.hit || []).forEach(id => { s.hearts[id] = Math.max(0, (s.hearts[id] || 1) - 1); });
    out.forEach(id => { s.outRound[id] = s.round; });
    back.forEach(id => { s.hearts[id] = 1; delete s.outRound[id]; delete room.secrets[id]; });
  }
  s.quiet = (s.hit || []).length ? 0 : (s.quiet || 0) + 1;
  s.alive = after;
  s.k = s.kNext || s.k;
  s.lastKills = s.roundKills || [];
  s.lastBeams = (s.beams || []).filter(b => (s.lastKills || []).some(k => k.from === b.id && k.by === 'beam'));
  s.phase = 'between';
  if (laserSettle(room)) return;
  s.round += 1;
  laserHide(room);
};

/** Everyone still standing is ready: the reveal now (ghosts never hold the round up). */
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
    const mine = room.secrets[playerId];
    if (action === 'place') {
      if (s.phase !== 'hide' || staleTap(payload, 'round', s.round) || !standing || !mine || mine.ghost) return;
      const p = laserClamp(payload.x, payload.y, s.k);
      mine.x = p.x; mine.y = p.y; mine.a = laserAngle(payload.a);
      laserShareMates(room);
      return;
    }
    if (action === 'shield') {
      if (s.phase !== 'hide' || staleTap(payload, 'round', s.round) || !standing || !mine || mine.ghost || s.shieldUsed[playerId]) return;
      mine.shield = payload.on !== false;
      laserShareMates(room);
      return;
    }
    if (action === 'mine') {
      if (s.phase !== 'hide' || staleTap(payload, 'round', s.round) || !mine || !mine.ghost) return;
      if (payload.x === undefined || payload.x === null) { mine.mine = null; return; }
      const p = laserClamp(payload.x, payload.y, s.k);
      mine.mine = { x: p.x, y: p.y };
      return;
    }
    if (action === 'ready') {
      if (s.phase !== 'hide' || staleTap(payload, 'round', s.round) || !standing || !mine || mine.ghost) return;
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
    laserShareMates(room);
    laserCheckReady(room);
  }
};
