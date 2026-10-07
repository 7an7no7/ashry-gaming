/* ============================================================================
   الأوضة المضلمة — THE DARK ROOM (rooms), the owner's rules of 29 Sep 2026
   ----------------------------------------------------------------------------
   A co-op walk in the dark. One player, the mover, walks on a black screen
   hearing only an echo where a wall or a piece of furniture is beside them;
   every other phone is a guide with the map under a lens, and the table talks
   the mover to the goal: the kid to the fridge in a power cut at home, or the
   explorer to the golden mask in a pharaoh's tomb (the host's choice). A trap
   sends the mover back to the start and costs the team a heart (3 in all);
   reaching the goal wins the level, the next one is bigger with more (and
   moving) traps, and the mover changes. Movement is the host's choice too: a
   step a tap, or continuous with a joystick. 2-8 players, no TV needed.

   What is hidden: the map. It is made from a seed (Dark.js), and the seed is
   room._dark.seed - never in shared. Every guide's phone gets it in its own
   slice ({ g: { seed, story, level } }) to draw the map, and the TV gets it
   through the screen-only slice (room.screenOnly, src/view.js); the mover's
   phone gets neither - only the echo around its own cell. Where a trap is
   (the near misses, the trap that caught the mover) goes the same way: in the
   guides' slices and the screen's, never in shared. Shared holds only what
   the mover lived through: where they stand, what they bumped, which kind of
   trap got them.

   Phases (shared.phase):
     play      the mover walks (from t0: the level's first seconds are its
               intro); the moving traps step on the level's clock
     trap      caught: the moment plays, then (stunUntil) back to the start,
               or game over if that was the last heart
     won       the goal: the celebration, then (nextAt) the next level with
               the next mover
     gameover  the hearts are gone (or fewer than two are left): the levels
               cleared, and the room's best across play again
   Bundled after RoomGames.js (requireHost, requireMoveOn, staleTap, shuffled,
   roomPlayerName) and Dark.js. Every name here starts with dark / DARK_.
   ========================================================================= */
const DARK_INTRO_MS = 2600;      // a level's first moments: the map is shown, the mover gets ready
const DARK_TRAP_MS = 2000;       // the trap's moment before the mover is back at the start
const DARK_WIN_MS = 4600;        // the celebration before the next level
const DARK_STEP_GAP = 110;       // a step closer than this to the last one is a double tap, dropped
const DARK_STICK_DT = 0.35;      // at most this many seconds of joystick are walked in one message
const DARK_NEAR_GAP = 1200;      // a near miss is told at most this often
const DARK_EV_MAX = 12;
const DARK_DIZZY_FROM = 3;       // «دايخ!» (7 Oct 2026): from this level a pillar, or the cat brushing past, makes the mover dizzy…
const DARK_DIZZY_MS = 5000;      // …for this long: left and right swapped, and only the guides (and the TV) are told

/** Left and right the other way round (up and down stay). */
const darkSwapLR = (d) => (d === 'L' ? 'R' : d === 'R' ? 'L' : d);
const darkDizzyNow = (room, now) => ((room._dark || {}).dizzyUntil || 0) > now;
/** «دايخ!»: the mover's left and right swap for DARK_DIZZY_MS; the guides' slices say so, the mover's never. */
const darkDizzy = (room, kind, now) => {
  const s = room.shared, h = room._dark;
  if ((s.level || 0) < DARK_DIZZY_FROM || s.phase !== 'play') return;
  const was = darkDizzyNow(room, now);
  h.dizzyUntil = now + DARK_DIZZY_MS;
  if (!was) darkPev(room, { type: 'dizzy', k: kind, until: h.dizzyUntil });
};

const darkHere = (room, id) => room.players.some(p => p.id === id && !p.bot);
/** The roster still in the room, in the mover order. */
const darkPresent = (room) => ((room.shared || {}).order || []).filter(id => darkHere(room, id));
const darkMapOf = (room) => {
  const s = room.shared || {};
  const h = room._dark;
  return h && h.seed ? darkMap(s.story, s.level, h.seed) : null;
};
const darkCellOf = (m, pos) => Math.floor(pos.y) * m.w + Math.floor(pos.x);
const darkEv = (room, e) => {
  const s = room.shared;
  s.evN = (s.evN || 0) + 1;
  s.ev = (s.ev || []).concat([Object.assign({ n: s.evN }, e)]).slice(-DARK_EV_MAX);
};
/** An event with a place in it: for the guides and the screen only. */
const darkPev = (room, e) => {
  const h = room._dark;
  h.pevN = (h.pevN || 0) + 1;
  h.pev = (h.pev || []).concat([Object.assign({ n: h.pevN }, e)]).slice(-8);
};

const darkAction = (room, playerId, action, payload) => {
  if (action === 'start' || action === 'playAgain') {
    requireHost(room, playerId);
    const people = room.players.filter(p => !p.bot).map(p => p.id);
    if (people.length < DARK_MIN) throw new Error('محتاجين لاعبين اتنين على الأقل');
    const prev = room.shared || {};
    if (action === 'playAgain' && prev.phase !== 'gameover') return;
    const pick = (v, list, old, def) => (list.indexOf(v) !== -1 ? v : list.indexOf(old) !== -1 ? old : def);
    const story = pick(payload && payload.story, DARK_STORIES, prev.story, 'home');
    const mode = pick(payload && payload.mode, DARK_MODES, prev.mode, 'steps');
    // «الميكروفون» (7 Oct 2026): a lobby switch, off unless the host turns it on; play again keeps it.
    const mic = payload && typeof payload.mic === 'boolean' ? payload.mic : !!prev.mic;
    const roster = people.slice(0, DARK_MAX);
    room.secrets = {};
    room._dark = { seed: 0, pev: [], pevN: 0, lastStep: 0, lastNear: 0, lastStick: 0, dizzyUntil: 0 };
    room.shared = {
      story, mode,
      mic, micId: null,
      roster,
      order: shuffled(roster),
      turn: -1,
      level: 0,
      hearts: DARK_HEARTS,
      cleared: 0,
      best: room._darkBest || prev.best || 0,
      run: 0,
      ev: [], evN: 0,
      phase: 'play'
    };
    room.phase = 'play';
    darkStartLevel(room, true);
    darkSync(room);
    return;
  }

  const s = room.shared;
  if (!s || room.phase !== 'play' || !room._dark) throw new Error('اللعبة لم تبدأ بعد');
  if (s.phase === 'gameover') return;
  const now = Date.now();

  if (action === 'step') {
    if (staleTap(payload, 'run', s.run)) return;
    if (playerId !== s.moverId || s.mode !== 'steps' || s.phase !== 'play' || now < s.t0) return;
    if (!DARK_DIRS[payload && payload.d]) return;
    const h = room._dark;
    if (now - (h.lastStep || 0) < DARK_STEP_GAP) return;
    h.lastStep = now;
    const m = darkMapOf(room);
    if (darkCatchUp(room, m, now)) { darkSync(room); return; }
    // Dizzy: the arrow pressed is not the way walked (the bump still names the arrow pressed, so the mover isn't told).
    const go = darkDizzyNow(room, now) ? darkSwapLR(payload.d) : payload.d;
    const d = DARK_DIRS[go];
    const x = Math.floor(s.pos.x), y = Math.floor(s.pos.y);
    s.face = go;
    const b = darkBlocked(m, x, y, d[0], d[1]);
    if (b) {
      darkEv(room, { type: 'bump', k: b, d: payload.d });
      if (b === 'pillar') darkDizzy(room, 'pillar', now);
      darkSync(room);
      return;
    }
    s.pos = { x: x + d[0] + 0.5, y: y + d[1] + 0.5 };
    s.steps = (s.steps || 0) + 1;
    darkArrive(room, m, [darkCellOf(m, s.pos)], now);
    darkSync(room);
    return;
  }
  if (action === 'stick') {
    if (staleTap(payload, 'run', s.run)) return;
    if (playerId !== s.moverId || s.mode !== 'stick' || s.phase !== 'play' || now < s.t0) return;
    const h = room._dark;
    const m = darkMapOf(room);
    if (darkCatchUp(room, m, now)) { darkSync(room); return; }
    let vx = Number(payload && payload.vx), vy = Number(payload && payload.vy);
    if (!isFinite(vx) || !isFinite(vy)) { vx = 0; vy = 0; }
    const len = Math.hypot(vx, vy);
    if (len > 1) { vx /= len; vy /= len; }
    const pushed = [vx, vy];
    // Walk what the last push asked for since it came (at most DARK_STICK_DT), then take the new one.
    const old = s.vel || [0, 0];
    const dt = Math.min(DARK_STICK_DT, Math.max(0, (now - (h.lastStick || now)) / 1000));
    h.lastStick = now;
    if ((old[0] || old[1]) && dt > 0) {
      const r = darkAdvance(m, s.pos.x, s.pos.y, old[0], old[1], dt);
      s.pos = { x: Math.round(r.x * 1000) / 1000, y: Math.round(r.y * 1000) / 1000 };
      if (r.bump && !(h.lastBumpAt && now - h.lastBumpAt < 600)) {
        h.lastBumpAt = now;
        darkEv(room, { type: 'bump', k: r.bump, d: darkFaceOf(h.pushed || old) });
        if (r.bump === 'pillar') darkDizzy(room, 'pillar', now);
      }
      darkArrive(room, m, r.cells, now);
    }
    if (s.phase === 'play') {
      // Dizzy: the stick's left and right walk the other way.
      if (darkDizzyNow(room, now)) vx = -vx;
      h.pushed = pushed;
      s.vel = [Math.round(vx * 100) / 100, Math.round(vy * 100) / 100];
      if (vx || vy) s.face = darkFaceOf(s.vel);
    } else s.vel = [0, 0];
    s.at = now;
    darkSync(room);
    return;
  }
  if (action === 'passMic') {
    // «الميكروفون»: the holder passes it to the next guide, the mover calls a guide by name (`to`),
    // or the host (anyone, once the host is away) moves it on. Sent with the holder the phone saw.
    if (!s.mic) return;
    if (staleTap(payload, 'from', s.micId)) return;
    const g = s.guides || [];
    if (g.length < 2) return;
    if (playerId !== s.micId && playerId !== s.moverId) requireMoveOn(room, playerId);
    const to = payload && payload.to !== undefined && payload.to !== null ? String(payload.to) : '';
    if (to && g.indexOf(to) === -1) throw new Error('ده مش من اللي بيوصفوا');
    s.micId = to || g[(g.indexOf(s.micId) + 1) % g.length];
    darkEv(room, { type: 'mic', to: s.micId });
    darkSync(room);
    return;
  }
  if (action === 'passMover') {
    // A mover whose phone went quiet: the next one walks, from the start, with no heart lost.
    requireMoveOn(room, playerId);
    if (staleTap(payload, 'run', s.run)) return;
    if (s.phase !== 'play') return;
    darkNextMover(room);
    darkNewMap(room);
    darkEv(room, { type: 'mover' });
    darkSync(room);
    return;
  }
  throw new Error('إجراء غير معروف');
};

const darkFaceOf = (v) => (Math.abs(v[0]) > Math.abs(v[1]) ? (v[0] > 0 ? 'R' : 'L') : (v[1] > 0 ? 'D' : 'U'));

/** The mover walked through `cells` (the last is where they are now): a trap, the goal, or a near miss. */
const darkArrive = (room, m, cells, now) => {
  const s = room.shared;
  const h = room._dark;
  const ms = now - s.t0;
  const goal = m.goal[1] * m.w + m.goal[0];
  for (const c of cells) {
    const hurt = darkHurtAt(m, c, ms);
    if (hurt) { darkCaught(room, hurt, c, now); return; }
    if (c === goal && (s.mode === 'steps' || c === cells[cells.length - 1])) { darkWon(room, now); return; }
  }
  const last = cells[cells.length - 1];
  // «دايخ!»: at home, the cat brushing past (on a square beside the mover) makes them dizzy.
  if (s.story === 'home' && (s.level || 0) >= DARK_DIZZY_FROM && darkNear(m, last, ms) === 'cat') darkDizzy(room, 'cat', now);
  // Where the mover now stands was checked up to this tick; the alarm checks the ticks after it.
  h.checkCell = last;
  h.checkK = Math.floor(ms / DARK_TICK);
  if (last !== h.nearCell && now - (h.lastNear || 0) > DARK_NEAR_GAP) {
    const near = darkNear(m, last, ms);
    if (near) {
      h.lastNear = now;
      darkPev(room, { type: 'near', k: near, x: last % m.w, y: Math.floor(last / m.w) });
    }
  }
  h.nearCell = last;
};

const darkCaught = (room, kind, cell, now, at) => {
  const s = room.shared;
  const m = darkMapOf(room);
  s.phase = 'trap';
  s.vel = [0, 0];
  s.hearts = Math.max(0, s.hearts - 1);
  s.stunUntil = now + DARK_TRAP_MS;
  s.trap = kind;
  darkEv(room, { type: 'trap', k: kind, at: at || now });
  darkPev(room, { type: 'trap', k: kind, x: cell % m.w, y: Math.floor(cell / m.w) });
};

const darkWon = (room, now) => {
  const s = room.shared;
  s.phase = 'won';
  s.vel = [0, 0];
  s.cleared = (s.cleared || 0) + 1;
  // The room's best lives outside the shared state, which a trip to the hub clears.
  room._darkBest = Math.max(room._darkBest || 0, s.best || 0, s.cleared);
  s.best = room._darkBest;
  s.nextAt = now + DARK_WIN_MS;
  darkEv(room, { type: 'won', lv: s.level });
};

/** Back where the level starts. */
const darkToStart = (room) => {
  const s = room.shared;
  const m = darkMapOf(room);
  s.pos = { x: m.start[0] + 0.5, y: m.start[1] + 0.5 };
  s.face = 'U';
  s.vel = [0, 0];
  s.at = Date.now();
  s.phase = 'play';
  s.run = (s.run || 0) + 1;
  s.stunUntil = null;
  room._dark.lastStick = 0;
  room._dark.nearCell = -1;
  room._dark.dizzyUntil = 0;
  room._dark.pushed = null;
  room._dark.checkCell = darkCellOf(m, s.pos);
  room._dark.checkK = Math.floor((s.at - s.t0) / DARK_TICK) - 1;   // this tick still to check
};

/** The next one in the order who is still here walks. */
const darkNextMover = (room) => {
  const s = room.shared;
  const o = s.order;
  for (let k = 1; k <= o.length; k++) {
    const t = (s.turn + k) % o.length;
    if (darkHere(room, o[t])) { s.turn = t; s.moverId = o[t]; return; }
  }
};

/** A new level: a new seed, the next mover, a bigger plan. */
const darkStartLevel = (room, first) => {
  const s = room.shared;
  const h = room._dark;
  s.level = (s.level || 0) + 1;
  darkNextMover(room);
  darkNewMap(room);
  darkEv(room, { type: 'level', lv: s.level, first: !!first });
};

/**
 * A new plan for this level (a new seed), from its intro: every level, and
 * when the walk passes to another mover mid-level (the owner, 30 Sep 2026),
 * since the new mover was a guide who saw the old one. The level, the hearts
 * and the levels cleared stay as they are.
 */
const darkNewMap = (room) => {
  const s = room.shared;
  const h = room._dark;
  // A seed nobody can guess (not Math.random's next number, which a phone can't see anyway).
  let seed = 0;
  while (!seed || seed === h.seed) seed = Math.floor(Math.random() * 2147483646) + 1;
  h.seed = seed;
  h.pev = [];
  h.newMap = false;
  s.t0 = Date.now() + DARK_INTRO_MS;
  s.nextAt = null;
  s.steps = 0;
  darkToStart(room);
};

/** The first tick in fromK..toK when a moving trap stands on `cell`, or null (a lap of them at most). */
const darkFirstHitTick = (m, cell, fromK, toK) => {
  if (!m || !m.dyn || !m.dyn.length) return null;
  const a = Math.max(0, fromK);
  const b = Math.min(toK, a + darkPeriod(m));
  for (let k = a; k <= b; k++) {
    for (const d of m.dyn) if (darkDynCell(m, d, k) === cell) return k;
  }
  return null;
};

/**
 * A mover standing still: every tick since the last check on their square, not
 * just the tick the alarm wakes at (the alarm can't come sooner than a second,
 * and a trap passes a square in 350 ms). Caught: true.
 */
const darkCatchUp = (room, m, now) => {
  const s = room.shared;
  const h = room._dark;
  if (s.phase !== 'play' || now < s.t0 || !m) return false;
  const c = darkCellOf(m, s.pos);
  const kNow = Math.floor((now - s.t0) / DARK_TICK);
  const from = h.checkCell === c && typeof h.checkK === 'number' ? h.checkK + 1 : kNow;
  h.checkCell = c;
  h.checkK = kNow;
  const k = darkFirstHitTick(m, c, from, kNow);
  if (k === null) return false;
  const d = m.dyn.find(z => darkDynCell(m, z, k) === c);
  darkCaught(room, d.k, c, now, s.t0 + k * DARK_TICK);
  return true;
};

/** Someone in the room who isn't at the table yet, with room for another guide. */
const darkWantsJoiner = (room) => {
  const s = room.shared;
  if (!s || !s.roster || s.phase === 'gameover') return false;
  if (s.roster.filter(id => darkHere(room, id)).length >= DARK_MAX) return false;
  return room.players.some(p => !p.bot && s.roster.indexOf(p.id) === -1);
};

const darkGameOver = (room, ended) => {
  const s = room.shared;
  s.phase = 'gameover';
  s.ended = ended || 'hearts';
  s.vel = [0, 0];
  s.stunUntil = null;
  s.nextAt = null;
  darkEv(room, { type: 'over' });
};

/**
 * Every phone's slice, rewritten after each move: the guides the map's seed and
 * the near misses with their places; the mover the echo around its cell; the
 * screen the same as a guide (room.screenOnly). Someone who joined since the
 * game was dealt becomes a guide while there are fewer than eight.
 */
const darkSync = (room) => {
  const s = room.shared;
  const h = room._dark;
  if (!s || !h) return;
  room.players.forEach(p => {
    if (p.bot || s.roster.indexOf(p.id) !== -1) return;
    if (s.roster.filter(id => darkHere(room, id)).length >= DARK_MAX) return;
    s.roster.push(p.id);
    s.order.push(p.id);
  });
  s.guides = s.roster.filter(id => id !== s.moverId && darkHere(room, id));
  // «الميكروفون»: always with a guide still here (the first, when its holder walks or leaves).
  if (s.mic) { if (s.guides.indexOf(s.micId) === -1) s.micId = s.guides[0] || null; } else s.micId = null;
  const m = darkMapOf(room);
  const g = { seed: h.seed, story: s.story, level: s.level };
  const pev = h.pev || [];
  // «دايخ!»: until when the mover is dizzy, for the guides and the screen only (0: not dizzy).
  const dz = (h.dizzyUntil || 0) > Date.now() ? h.dizzyUntil : 0;
  room.secrets = {};
  room.players.forEach(p => {
    if (p.bot) return;
    if (p.id === s.moverId) {
      const x = Math.floor(s.pos.x), y = Math.floor(s.pos.y);
      room.secrets[p.id] = { mover: true, echo: m ? darkEcho(m, x, y) : null };
    } else if (s.roster.indexOf(p.id) !== -1) {
      room.secrets[p.id] = { g, pev, dz };
    }
  });
  room.screenOnly = s.phase === 'gameover' ? null : { g, pev, dz };
};

/** The server's next moment: back to the start, the next level, or a moving trap reaching the mover. */
const darkDeadline = (room) => {
  const s = room.shared || {};
  if (room.phase !== 'play' || !room._dark) return null;
  // Someone joined (room.js has no join hook for the rules): the next alarm seats them as a guide.
  if (darkWantsJoiner(room)) return Date.now();
  if (s.phase === 'trap') return s.stunUntil;
  if (s.phase === 'won') return s.nextAt;
  if (s.phase === 'play') {
    const m = darkMapOf(room);
    if (!m || !m.dyn.length) return null;
    // The first tick after the last one checked on the mover's square (darkCatchUp).
    const h = room._dark;
    const c = darkCellOf(m, s.pos);
    const from = h.checkCell === c && typeof h.checkK === 'number' ? h.checkK + 1 : Math.floor(Math.max(0, Date.now() - s.t0) / DARK_TICK);
    const k = darkFirstHitTick(m, c, from, from + darkPeriod(m));
    return k === null ? null : s.t0 + k * DARK_TICK + 20;
  }
  return null;
};

const darkTimeout = (room, now) => {
  const s = room.shared || {};
  if (room.phase !== 'play' || !room._dark) return false;
  if (darkWantsJoiner(room)) { darkSync(room); return true; }
  if (s.phase === 'trap' && s.stunUntil && now >= s.stunUntil) {
    if (s.hearts <= 0) darkGameOver(room, 'hearts');
    else if (room._dark.newMap) { darkNewMap(room); darkEv(room, { type: 'back' }); }
    else { darkToStart(room); darkEv(room, { type: 'back' }); }
    darkSync(room);
    return true;
  }
  if (s.phase === 'won' && s.nextAt && now >= s.nextAt) {
    darkStartLevel(room, false);
    darkSync(room);
    return true;
  }
  if (s.phase === 'play' && now >= s.t0) {
    if (darkCatchUp(room, darkMapOf(room), now)) { darkSync(room); return true; }
  }
  return false;
};

/**
 * Someone left. The mover gone: the next one walks from the start (no heart
 * lost). A guide gone: the lenses grow for the others. Fewer than two left:
 * the game is over.
 */
const darkPlayerLeft = (room, playerId) => {
  const s = room.shared;
  if (!s || room.phase !== 'play' || !room._dark || s.phase === 'gameover') return;
  if (darkPresent(room).length < DARK_MIN) { darkGameOver(room, 'left'); darkSync(room); return; }
  // (After a win the next level picks the next mover anyway; mid-trap the trap's own timeout sends them back.)
  // The new mover was a guide who saw this map: a new one at the same level (at once, or after the trap's moment).
  if (playerId === s.moverId && (s.phase === 'play' || s.phase === 'trap')) {
    darkNextMover(room);
    if (s.phase === 'play') darkNewMap(room);
    else room._dark.newMap = true;
    darkEv(room, { type: 'mover' });
  }
  darkSync(room);
};

/** Is a guide's lens relayed right now (room.js): only while a level is played. */
const darkRelaying = (room) => room.game === 'darkroom' && room.phase === 'play' && !!room._dark && (room.shared || {}).phase !== 'gameover';
