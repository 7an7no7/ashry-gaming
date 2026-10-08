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

   Round two's looks sheet (the owner's picks, 6 Oct 2026): four maps, one at
   random each game (Laser.js); pickups on the floor that everyone sees (taken by
   standing on one and surviving, kept and used in a later round: a double beam, a
   second beam, a shield, a wide beam; two on one break it); pillars that stop
   beams; the floor falling in tiles (cracked a round before they fall, about the
   ring's worth a round) instead of the ring; the best shot kept for the replay.

   The ideas of 7 Oct 2026 (the owner's picks): a practice round before the
   room's first laser game (866: round 0, shared.practice; nobody out, nothing
   counted; the host's «نبدأ علطول» is skipPractice); the turret (867, a switch:
   shared.turret in the middle, its aim public while hiding, a new one each round,
   firing with everyone); mirror pillars (868, «مرايات», only with pillars on:
   pillars with mirror: true reflect a beam, Laser.js).

   The arena is a map of size k (1 in round one), its middle at 0,0
   (shared.map, .k, .pillars, .fallen); a player is a circle of LASER_BODY. Spots, aims, shields and
   mines are room.secrets[pid] until the reveal (nothing about the others is
   seen while hiding, not even who is ready: the owner; a teammate's spot is,
   when the host leaves team sight on). The reveal is shared.shots, .beams and
   .mines; the phones and the TV play it from shared.revealAt.
   ========================================================================== */
const LASER_MIN_PLAYERS = 3;
const LASER_REVEAL_MS = 7000;        // a round with a hit
const LASER_REVEAL_QUIET_MS = 4000;  // nobody hit
const LASER_HIDE_MIN_S = 8;
const LASER_INTRO_MS = 2000;         // round one: the map draws itself before the clock starts
const LASER_IDLE_ROUNDS = 2;         // 871: rounds untouched before a standing player is moved
// LASER_BODY, laserK, the maps, laserFit, laserTiles, laserAngle, laserTrace and laserMineHits are in Laser.js.

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
    sight: on(p.sight, true),
    pickups: on(p.pickups, true),
    pillars: on(p.pillars, false),
    pieces: on(p.pieces, false),
    // The ideas of 7 Oct 2026: the turret (867) and mirror pillars (868, only among the pillars).
    turret: on(p.turret, false),
    mirrors: on(p.mirrors, false) && on(p.pillars, false)
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

/** The arena as Laser.js reads it (the turret is a solid in the middle). */
const laserArena = (s) => ({ map: s.map || 'hex', k: s.k || 1, pillars: s.pillars || [], fallen: s.fallen || [],
  turret: s.turret ? { x: s.turret.x, y: s.turret.y } : null });

/** A random spot on the arena (on the map, off the pillars and the fallen floor) and a random aim. */
const laserRandomSpot = (A) => {
  const k = A.k || 1;
  let x = 0, y = 0;
  for (let i = 0; i < 60; i++) {
    x = (Math.random() * 2 - 1) * k; y = (Math.random() * 2 - 1) * k;
    if (laserInside(A.map || 'hex', k, x, y, LASER_BODY)) break;
  }
  const p = laserFit(A, x, y);
  return { x: p.x, y: p.y, a: laserAngle(Math.random() * 360) };
};

/** The pillars of a game (with pillars on): 1, 2 with 5+ players, 3 with 8+; apart, off the wall, and
    clear of the turret in the middle. With «مرايات» (868) one more, and half of them (rounded up) are
    mirror pillars ({ mirror: true }), which reflect a beam instead of stopping it. */
const laserPlacePillars = (map, players, o) => {
  o = o || {};
  const n = (players >= 8 ? 3 : players >= 5 ? 2 : 1) + (o.mirrors ? 1 : 0), out = [];
  for (let i = 0; i < 600 && out.length < n; i++) {
    const x = Math.random() * 1.6 - 0.8, y = Math.random() * 1.6 - 0.8;
    if (!laserInside(map, 1, x, y, 0.28)) continue;
    if (o.turret && Math.hypot(x, y) < 0.36) continue;
    if (out.some(p => Math.hypot(p.x - x, p.y - y) < 0.45)) continue;
    out.push({ x: laserR3(x), y: laserR3(y) });
  }
  if (o.mirrors) shuffled(out.map((_, i) => i)).slice(0, Math.ceil(out.length / 2)).forEach(i => { out[i].mirror = true; });
  return out;
};

/** The falling floor: the tiles that crack this round (and fall at its end), about as much floor as
    the ring would have taken; two more in sudden death; never the last three. */
const laserCrack = (room) => {
  const s = room.shared;
  s.cracked = [];
  s.suddenCrack = false;
  if (!s.opts.pieces || s.practice) return;
  // The turret's tile never falls (the turret stands in the middle for the whole game).
  const under = s.turret ? laserTileAt(s.map, s.turret.x, s.turret.y) : null;
  const tiles = laserTiles(s.map), standing = tiles.filter(t => s.fallen.indexOf(t.i) === -1 && !(under && t.i === under.i));
  const ringK = laserK(s.round + 1);
  let n = Math.max(0, standing.length - Math.round(tiles.length * ringK * ringK));
  if ((s.quiet || 0) >= 2 && n === 0) { n = 2; s.suddenCrack = true; }
  n = Math.max(0, Math.min(n, standing.length - 3));
  s.cracked = shuffled(standing.slice()).slice(0, n).map(t => t.i).sort((a, b) => a - b);
};

/** The pickups of a round (from round two): one, two with 6+ players, on floor that stays. */
const laserSpawnPickups = (room) => {
  const s = room.shared;
  s.pickups = [];
  if (!s.opts.pickups || s.round < 2) return;
  const n = s.roster.length >= 6 ? 2 : 1;
  const kNext = s.opts.pieces ? s.k : Math.min(s.k, laserK(s.round + 1));
  for (let i = 0; i < 300 && s.pickups.length < n; i++) {
    const x = (Math.random() * 2 - 1) * kNext, y = (Math.random() * 2 - 1) * kNext;
    if (!laserInside(s.map, kNext, x, y, 0.12)) continue;
    if (s.opts.pieces) { const t = laserTileAt(s.map, x, y); if (!t || s.fallen.indexOf(t.i) !== -1 || s.cracked.indexOf(t.i) !== -1) continue; }
    if (laserSolids(laserArena(s)).some(pl => Math.hypot(pl.x - x, pl.y - y) < LASER_PILLAR_R + 0.08)) continue;
    if (s.pickups.some(p => Math.hypot(p.x - x, p.y - y) < 0.3)) continue;
    // Never under a spot someone carries into this round (a pickup there would be theirs for nothing).
    if (s.alive.some(id => { const m = room.secrets[id]; return m && !m.ghost && Math.hypot(m.x - x, m.y - y) < LASER_PICK_REACH + 0.05; })) continue;
    s.pickups.push({ id: s.round * 10 + s.pickups.length, x: laserR3(x), y: laserR3(y), kind: LASER_PICKUPS[Math.floor(Math.random() * LASER_PICKUPS.length)] });
  }
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
  const A = laserArena(s);
  // 871 (7 Oct 2026, the owner's pick, changing «a player who chose nothing stays where they
  // were»): after two rounds untouched (a phone left on the table), a random spot and aim.
  const idle = room._laserIdle || {};
  const moved = [];
  s.alive.forEach(pid => {
    const old = room.secrets[pid];
    const away = !s.practice && (idle[pid] || 0) >= LASER_IDLE_ROUNDS;
    if (away) moved.push(pid);
    const mine = old && !old.ghost && !away ? old : laserRandomSpot(A);
    const p = laserFit(A, mine.x, mine.y);
    room.secrets[pid] = { x: p.x, y: p.y, a: laserAngle(mine.a), a2: laserAngle(mine.a2 === undefined ? mine.a + 90 : mine.a2), ready: false, shield: false, use: false, round: s.round };
  });
  if (moved.length) s.moved = moved; else delete s.moved;
  laserCrack(room);
  laserSpawnPickups(room);
  laserGhosts(room).forEach(pid => { room.secrets[pid] = { ghost: true, mine: null, round: s.round }; });
  laserShareMates(room);
  // The turret (867): a new aim every round, on the table for everyone to read while hiding.
  if (s.turret) s.turret = { x: s.turret.x, y: s.turret.y, a: laserAngle(Math.random() * 360) };
  s.phase = 'hide';
  // The practice round (866) is round 0: the full time, like round one.
  s.hideMs = Math.max(LASER_HIDE_MIN_S, s.opts.time - Math.max(0, s.round - 1)) * 1000;
  s.endsAt = Date.now() + s.hideMs + (s.introUntil && s.introUntil > Date.now() ? s.introUntil - Date.now() : 0);
  ['shots', 'beams', 'mines', 'hit', 'out', 'back', 'revealAt', 'revealMs', 'kNext', 'tieNext', 'suddenNext', 'roundKills', 'fates', 'falling'].forEach(f => { delete s[f]; });
};

/** A new game: options from the start payload (or the last game's). */
const laserDeal = (room, payload) => {
  const roster = room.players.map(p => p.id);
  const opts = laserOptsOf(payload);
  const nTeams = opts.teams ? Math.min(opts.teams, roster.length - 1) : 0;
  // A map at random every game (the owner); a test may name one (the lobby never does).
  const map = LASER_MAPS.indexOf(payload && payload.map) !== -1 ? payload.map : LASER_MAPS[Math.floor(Math.random() * LASER_MAPS.length)];
  const pillars = opts.pillars ? laserPlacePillars(map, roster.length, opts) : [];
  const turret = opts.turret ? { x: 0, y: 0, a: 0 } : null;
  // The practice round (866, the owner: only the room's first laser game; the host can skip it). The
  // room remembers it across games (clearGameState leaves room._laserPracticed). A test may say
  // practice: false, as it may name a map; the lobby never does.
  const practice = !room._laserPracticed && !(payload && payload.practice === false);
  room._laserPracticed = true;
  room.secrets = {};
  room._laserBest = null;
  room._laserIdle = {};
  roster.forEach(pid => { room.secrets[pid] = laserRandomSpot({ map, k: 1, pillars, fallen: [], turret }); });
  const hearts = {};
  roster.forEach(pid => { hearts[pid] = opts.hearts; });
  room.shared = {
    phase: 'hide', round: practice ? 0 : 1, practice, turret, roster, alive: roster.slice(), outRound: {}, opts,
    nTeams: nTeams >= 2 ? nTeams : 0, teams: nTeams >= 2 ? laserDealTeams(roster, nTeams) : null, tie: false,
    k: laserK(1), hearts, shieldUsed: {}, hitsBy: {}, near: {}, kills: [], quiet: 0,
    map, pillars, fallen: [], cracked: [], pickups: [], held: {}, introUntil: Date.now() + LASER_INTRO_MS
  };
  room.phase = 'play';
  if (room.shared.teams) { room.shared.phase = 'teams'; room.shared.endsAt = null; room.shared.introUntil = null; return; }
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
  s.best = room._laserBest || null;
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
  // 871: rounds in a row each standing player chose nothing (no spot, aim, pickup, shield or
  // ready); the practice round counts nothing.
  if (!s.practice) {
    const idle = room._laserIdle || (room._laserIdle = {});
    alive.forEach(pid => { const m = room.secrets[pid]; idle[pid] = m && m.touched ? 0 : (idle[pid] || 0) + 1; });
  }
  const A = laserArena(s);
  s.shots = alive.map(pid => {
    const m = room.secrets[pid] && !room.secrets[pid].ghost ? room.secrets[pid] : laserRandomSpot(A);
    // A pickup this phone chose to use: a second ray, a wider one, or its shield.
    // A firing pickup is kept while this player's own shield is up: a shield fires nothing,
    // so using it then would waste it (the shield pickup itself is still used).
    const ownUp = !!m.shield && !s.shieldUsed[pid];
    const use = m.use && s.held[pid] && !(ownUp && s.held[pid] !== 'shield') ? s.held[pid] : null;
    const shield = use === 'shield' || (!!m.shield && !s.shieldUsed[pid]);
    const shot = { id: pid, x: m.x, y: m.y, a: m.a, shield };
    if (use) { shot.use = use; delete s.held[pid]; }
    if (use === 'double') shot.rays = [{ a: m.a }, { a: laserAngle(m.a + 180) }];
    if (use === 'second') shot.rays = [{ a: m.a }, { a: laserAngle(m.a2 === undefined ? m.a + 90 : m.a2) }];
    if (use === 'wide') shot.rays = [{ a: m.a, wide: true }];
    if (!!m.shield && !s.shieldUsed[pid] && use !== 'shield') shot.ownShield = true;
    return shot;
  });
  // The turret fires along the aim everyone saw (867): a shot with no body, on nobody's team.
  const turretShot = s.turret ? [{ id: LASER_TURRET_ID, x: s.turret.x, y: s.turret.y, a: s.turret.a, shield: false, turret: true }] : [];
  const trace = laserTrace(s.shots.concat(turretShot), { k: s.k, map: s.map, pillars: s.pillars, turret: laserArena(s).turret, teams: s.teams, bounce: s.opts.bounce, block: s.opts.block });
  s.beams = trace.beams;
  // The practice round (866) counts nothing: no near misses, no best shot, no shield spent, nobody out.
  if (!s.practice) Object.keys(trace.near).forEach(id => {
    s.near[id] = typeof s.near[id] === 'number' ? Math.min(s.near[id], trace.near[id]) : trace.near[id];
  });
  s.mines = laserGhosts(room).map(g => {
    const m = (room.secrets[g] || {}).mine;
    return m ? { id: g, x: m.x, y: m.y, hits: laserMineHits({ id: g, x: m.x, y: m.y }, s.shots, s.teams) } : null;
  }).filter(Boolean);
  s.shots.forEach(p => { if (p.ownShield && !s.practice) s.shieldUsed[p.id] = true; delete p.ownShield; });
  // Who hit whom: one heart a round, however many beams or mines.
  const kills = [];
  const once = (k) => { if (!kills.some(x => x.from === k.from && x.to === k.to)) kills.push(k); };
  s.beams.forEach(b => b.hits.forEach(to => once({ r: s.round, from: b.id, to, by: 'beam' })));
  s.mines.forEach(m => m.hits.forEach(to => once({ r: s.round, from: m.id, to, by: 'mine' })));
  // The best shot of the game: the one beam that hit the most people, kept for the replay at the end
  // (on the server only until then: it holds last spots, and nothing is on the table while hiding).
  // (Only a player's shot: the turret is nobody's best shot.)
  s.beams.forEach(b => {
    if (s.practice || b.id === LASER_TURRET_ID) return;
    if (!b.hits.length || (room._laserBest && room._laserBest.n >= b.hits.length)) return;
    room._laserBest = { n: b.hits.length, round: s.round, map: s.map, k: s.k, pillars: s.pillars.slice(), fallen: s.fallen.slice(), shooter: b.id, segs: b.segs, wide: b.wide,
      turret: s.turret ? Object.assign({}, s.turret) : null,
      victims: b.hits.slice(), people: s.shots.map(p => ({ id: p.id, x: p.x, y: p.y, a: p.a, shield: !!p.shield })) };
  });
  s.roundKills = kills;
  s.hit = kills.map(k => k.to).filter((id, i, a) => a.indexOf(id) === i);
  // In the practice round nobody goes out and no heart is lost: the hits are only told to each phone.
  s.out = s.practice ? [] : s.hit.filter(id => (s.hearts[id] || 1) <= 1);
  // A ghost whose mine takes someone out comes back, with «تبديل الأماكن» on.
  s.back = s.opts.swap ? kills.filter(k => k.by === 'mine' && s.out.indexOf(k.to) !== -1).map(k => k.from)
    .filter((id, i, a) => a.indexOf(id) === i) : [];
  const after = alive.filter(id => s.out.indexOf(id) === -1).concat(s.back);
  const left = laserLeftCount(s, after);
  // The next round's arena: smaller each round to the floor; past it, after two rounds with
  // nobody hit, smaller again every round until someone is (sudden death).
  const quiet = s.hit.length ? 0 : (s.quiet || 0) + 1;
  const floorK = LASER_K_SUDDEN_MIN_OF[s.map] || LASER_K_SUDDEN_MIN;
  if (s.opts.pieces) {
    // The falling floor: the arena keeps its size; the cracked tiles fall at the end of the reveal.
    s.kNext = s.k;
    s.falling = left === 1 ? [] : s.cracked.slice();
    s.suddenNext = left !== 1 && !!s.suddenCrack;
  } else {
    const normal = Math.min(s.k, laserK(s.round + 1));
    const sudden = quiet >= 2 && normal >= s.k - 1e-9 && s.k > floorK + 1e-9;
    s.kNext = left === 1 ? s.k : (sudden ? laserR3(Math.max(floorK, s.k - LASER_K_SUDDEN_STEP)) : normal);
    s.suddenNext = left !== 1 && sudden;
  }
  s.tieNext = left === 0;
  if (s.practice) { s.kNext = s.k; s.falling = []; s.suddenNext = false; s.tieNext = false; s.back = []; }
  // The pickups: taken by whoever stood on one alone and is still standing; two or more break it.
  s.fates = (s.pickups || []).map(p => {
    const on = s.shots.filter(q => Math.hypot(q.x - p.x, q.y - p.y) < LASER_PICK_REACH).map(q => q.id);
    if (!on.length) return { id: p.id, fate: 'left' };
    if (on.length > 1) return { id: p.id, fate: 'broken', by: on };
    const kept = !s.tieNext && s.out.indexOf(on[0]) === -1;
    return { id: p.id, fate: kept ? 'taken' : 'lost', by: on[0] };
  });
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
  if (s.practice) { laserEndPractice(room); return; }
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
  // What changed, for the phones' card between rounds.
  s.lastRound = { k: s.k, sudden: !!s.suddenNext, fell: (s.falling || []).length, tie: s.tie };
  s.k = s.kNext || s.k;
  (s.fates || []).forEach(f => {
    const p = (s.pickups || []).find(q => q.id === f.id);
    if (f.fate === 'taken' && p && after.indexOf(f.by) !== -1) s.held[f.by] = p.kind;
  });
  s.pickups = [];
  if (s.opts.pieces) { s.fallen = s.fallen.concat(s.falling || []).sort((a, b) => a - b); s.cracked = []; }
  // A pillar on floor that fell (the ring or a tile) falls with it.
  const onFloor = (pl) => {
    if (!laserInside(s.map, s.k, pl.x, pl.y, LASER_PILLAR_R * 0.5)) return false;
    if (!s.opts.pieces) return true;
    const t = laserTileAt(s.map, pl.x, pl.y);
    return !!t && s.fallen.indexOf(t.i) === -1;
  };
  s.pillars = (s.pillars || []).filter(onFloor);
  Object.keys(s.held).forEach(id => { if (after.indexOf(id) === -1) delete s.held[id]; });
  s.lastKills = s.roundKills || [];
  // The beams that took someone out go to each one hit, in their own slice («ضربك:»): on the table they
  // would show every shooter's spot, which carries into the hiding (it is secret again).
  const lastBeams = (s.beams || []).filter(b => s.lastKills.some(k => k.from === b.id && k.by === 'beam'));
  delete s.lastBeams;
  s.phase = 'between';
  if (laserSettle(room)) return;
  s.round += 1;
  laserHide(room);
  s.lastKills.forEach(k => {
    if (s.alive.indexOf(k.to) !== -1) return;
    const m = room.secrets[k.to] || (room.secrets[k.to] = {});
    if (!m.gotBy) m.gotBy = lastBeams.filter(b => s.lastKills.some(q => q.to === k.to && q.from === b.id && q.by === 'beam'));
  });
};

/** The practice round is over (its reveal ended, or the host skipped it, «نبدأ علطول»): the real game
    starts at round one with everything as it was - nobody out, every heart, every shield. The spots
    carry over as any round's do; the map has drawn itself already. */
const laserEndPractice = (room) => {
  const s = room.shared;
  s.practice = false;
  s.round = 1;
  s.introUntil = null;
  s.lastKills = [];
  s.lastRound = { k: s.k, practice: true };
  s.alive = laserAlive(room);
  s.phase = 'between';
  if (laserSettle(room)) return;
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
      // Dealt over who is still here; anyone gone keeps their old team (they play no part).
      const t = laserDealTeams(activeRoster(room, s.roster), s.nTeams);
      s.roster.forEach(id => { if (t[id] === undefined) t[id] = s.teams[id]; });
      s.teams = t;
      // Mates were for the old teams: laserHide shares them again for these.
      Object.keys(room.secrets || {}).forEach(id => { if (room.secrets[id]) delete room.secrets[id].mates; });
      return;
    }
    if (action === 'go') {
      requireMoveOn(room, playerId);
      if (s.phase !== 'teams') return;
      if (laserSettle(room)) return;
      s.introUntil = Date.now() + LASER_INTRO_MS;
      laserHide(room);
      return;
    }
    if (action === 'skipPractice') {
      // «نبدأ علطول» (866): the host's, from the teams screen, the practice's hiding or its reveal.
      requireHost(room, playerId);
      if (!s.practice || staleTap(payload, 'round', s.round)) return;
      if (s.phase === 'teams') { s.practice = false; s.round = 1; return; }
      if (s.phase !== 'hide' && s.phase !== 'reveal') return;
      laserEndPractice(room);
      return;
    }
    const standing = laserAlive(room).indexOf(playerId) !== -1;
    const mine = room.secrets[playerId];
    if (action === 'place') {
      if (s.phase !== 'hide' || staleTap(payload, 'round', s.round) || !standing || !mine || mine.ghost) return;
      const p = laserFit(laserArena(s), payload.x, payload.y);
      mine.x = p.x; mine.y = p.y; mine.a = laserAngle(payload.a);
      mine.touched = true;
      if (payload.a2 !== undefined && payload.a2 !== null) mine.a2 = laserAngle(payload.a2);
      laserShareMates(room);
      return;
    }
    if (action === 'use') {
      if (s.phase !== 'hide' || staleTap(payload, 'round', s.round) || !standing || !mine || mine.ghost || !s.held[playerId]) return;
      mine.use = payload.on !== false;
      mine.touched = true;
      return;
    }
    if (action === 'shield') {
      if (s.phase !== 'hide' || staleTap(payload, 'round', s.round) || !standing || !mine || mine.ghost || s.shieldUsed[playerId]) return;
      mine.shield = payload.on !== false;
      mine.touched = true;
      laserShareMates(room);
      return;
    }
    if (action === 'mine') {
      if (s.phase !== 'hide' || staleTap(payload, 'round', s.round) || !mine || !mine.ghost) return;
      if (payload.x === undefined || payload.x === null) { mine.mine = null; return; }
      const p = laserClampMap(s.map, s.k, payload.x, payload.y);
      mine.mine = { x: p.x, y: p.y };
      return;
    }
    if (action === 'ready') {
      if (s.phase !== 'hide' || staleTap(payload, 'round', s.round) || !standing || !mine || mine.ghost) return;
      mine.ready = payload.on !== false;
      mine.touched = true;
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
    // Mates are shared while hiding only: on the teams screen a shuffle can still change the
    // teams, and mates built now would hand a phone an opponent's starting spot.
    if (s.phase !== 'hide') return;
    laserShareMates(room);
    laserCheckReady(room);
  }
};
