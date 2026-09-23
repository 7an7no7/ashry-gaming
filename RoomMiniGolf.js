/* ============================================================================
   ميني جولف — MINI GOLF in rooms
   ----------------------------------------------------------------------------
   Bundled into the Worker after RoomGames.js (whose helpers it uses); the
   holes and the physics are MiniGolf.js, shared with the page.

   The owner's rules for a room (23 Sep 2026, asked one at a time):
   - 3, 6, 9 or 18 holes, 6 by default; the first holes of the course, in order.
   - Two ways to play, the host's choice: all at once (the default) - every
     ball on the same hole together, each player putting from their own phone
     whenever they are ready, the balls passing through each other - or in
     turns, one putt at a time round the table while everyone watches.
   - Par + 3 strokes at most (golfMaxOf: par 3 allows 6), then the ball is
     picked up and the hole counts one more (the owner, 23 Sep 2026).
   - In turns, balls hit each other (the owner, 23 Sep 2026): a putt meets
     every ball lying on the course - a ball is on it once it has been hit
     from the tee, until it drops - and a ball it knocks rolls on with it.
     All at once, the balls still pass through each other.
   - Water puts the ball back where it lay, a stroke added; if another ball
     lies on that spot now, back to the tee. A ball knocked into the water by
     someone else goes back to its own spot with no stroke added (the tee if
     that spot is taken), and one knocked into the cup is holed with its
     strokes so far.
   - A hole moves on once every ball is in the cup or picked up.
   - The aim guide (the path a putt would take) is the host's switch, off by
     default; the short arrow while pulling is always there, it is the control.
   - A putt clock, off by default, 20 or 40 seconds: when it runs out the
     phone putts gently toward the hole for the player (golfAutoShot). The
     host has a "play for" for a phone that went quiet.
   - No computer players. Lowest total wins; the podium at the end.

   A putt: the putter's phone rolls its ball at once from the shot numbers and
   sends { dx, dy, power, t0 }, t0 being the hole's clock (ms since the hole
   started on the server) at the putt, so the windmill, the gate and the
   waterwheel stand where the putter saw them. The server takes the phone's t0
   when it is within MG_T0_SLACK of its own, else its own, runs golfPutt for
   the result, and every other phone and the TV replay the same putt from the
   same start (golfStart/golfStep) and settle on the server's result.

   Nothing is hidden: everything is `shared`.
     phase     'play' | 'between' (the hole's card, then the next) | 'gameover'
     settings  { mode: 'together' | 'turns', holes, guide, clock }
     hole      the hole being played (0-based) · holes  how many
     startedAt the server's clock when this hole started · stamp  when shared last changed
     order     who plays, in turn order for this hole
     balls     { pid: { at, n (strokes counted), done: '' | 'cup' | 'picked', restAt, clockAt } }
     shots     { pid: the last putt: { seq, n, from, dx, dy, power, t0, end, at, add, dur, auto, wet,
                others (in turns: the balls it could hit, [{ id, at }] before it), moved ([{ id, end, at, wet }]) } }
     shotSeq   putts so far this game · turn  whose putt it is (turns)
     card      { pid: [strokes of each hole, null until done] }
     board     [{ id, name, score }] lowest total first · scores  { pid: total }
     nextAt    when 'between' moves on · result  { winners, par }
     wins      games won this evening, kept by play again
   ========================================================================= */
const MG_HOLE_COUNTS = [3, 6, 9, 18];
const MG_CLOCKS = [0, 20, 40];
const MG_T0_SLACK = 1500;       // a phone's hole clock may be this far from the server's
const MG_INTRO_MS = 2500;       // the hole's name card, before its first clock starts
const MG_BETWEEN_MS = 7000;     // the card between two holes
const MG_SPLASH_MS = 900;       // the ball back on its spot after the water

const mgRoomOptions = (payload, prev) => {
  const p = payload || {};
  const was = prev || {};
  const pickN = (list, v, w, dflt) => (list.indexOf(Number(v)) !== -1 ? Number(v) : (list.indexOf(Number(w)) !== -1 ? Number(w) : dflt));
  const mode = p.mode === 'turns' || p.mode === 'together' ? p.mode : (was.mode === 'turns' ? 'turns' : 'together');
  return {
    mode: mode,
    holes: pickN(MG_HOLE_COUNTS, p.holes, was.holes, 6),
    guide: p.guide === undefined ? !!was.guide : !!p.guide,
    clock: pickN(MG_CLOCKS, p.clock, was.clock, 0)
  };
};

const mgHere = (room) => room.players.map(p => p.id);

/** Totals so far, lowest first: the holes each player has finished. */
const mgBoard = (room) => {
  const s = room.shared;
  s.scores = {};
  const rows = room.players.map((p, k) => {
    const card = (s.card || {})[p.id] || [];
    let total = 0;
    card.forEach(v => { if (typeof v === 'number') total += v; });
    s.scores[p.id] = total;
    return { id: p.id, name: p.name, score: total, k: k };
  }).filter(r => (s.card || {})[r.id]);
  rows.sort((a, b) => a.score - b.score || a.k - b.k);
  s.board = rows.map(r => ({ id: r.id, name: r.name, score: r.score }));
};

/** The hole's clock for a ball: from when it came to rest (or the hole's name card). */
const mgClockFor = (room, pid, from) => {
  const s = room.shared;
  const b = s.balls[pid];
  if (!b) return;
  b.clockAt = s.settings.clock && !b.done ? from + s.settings.clock * 1000 : null;
};

/** A hole begins: every ball on the tee, the hole's clock at 0. */
const mgStartHole = (room, index) => {
  const s = room.shared;
  const h = GOLF_HOLES[index];
  const now = Date.now();
  s.hole = index;
  s.phase = 'play';
  s.startedAt = now;
  s.nextAt = null;
  s.shots = {};
  // In turns, the best score on the last hole tees off first (the honour); ties keep their order.
  if (index > 0 && s.settings.mode === 'turns') {
    const last = (pid) => ((s.card[pid] || [])[index - 1]) || 0;
    const was = s.order.slice();
    s.order.sort((a, b) => last(a) - last(b) || was.indexOf(a) - was.indexOf(b));
  }
  s.balls = {};
  s.order.forEach(pid => {
    s.balls[pid] = { at: h.tee.slice(), n: 0, done: '', restAt: now, clockAt: null };
  });
  s.turn = s.settings.mode === 'turns' ? (s.order[0] || null) : null;
  s.order.forEach(pid => {
    if (s.settings.mode === 'together' || pid === s.turn) mgClockFor(room, pid, now + MG_INTRO_MS);
  });
};

const mgNewGame = (room, playerId, payload, again) => {
  requireHost(room, playerId);
  if (!room.players.length) throw new Error('مفيش لاعبين');
  const prev = room.shared || {};
  const settings = mgRoomOptions(again ? prev.settings : payload, prev.settings);
  const order = shuffled(mgHere(room));
  const card = {};
  order.forEach(pid => { card[pid] = new Array(settings.holes).fill(null); });
  room.shared = {
    settings: settings,
    holes: settings.holes,
    order: order,
    card: card,
    shotSeq: 0,
    wins: again ? (prev.wins || {}) : {},
    result: null,
    roster: order.slice(),
    dealId: newDealId()
  };
  room.phase = 'play';
  mgStartHole(room, 0);
  mgBoard(room);
};

/** Every ball of the hole is in the cup or picked up. */
const mgAllDone = (room) => {
  const s = room.shared;
  return s.order.every(pid => !s.balls[pid] || s.balls[pid].done);
};

/** The hole is over: its card, then the next hole, or the end of the game. */
const mgEndHole = (room) => {
  const s = room.shared;
  const now = Date.now();
  let settle = now;
  Object.keys(s.balls).forEach(pid => { settle = Math.max(settle, s.balls[pid].restAt || now); });
  s.turn = null;
  Object.keys(s.balls).forEach(pid => { s.balls[pid].clockAt = null; });
  mgBoard(room);
  if (s.hole + 1 >= s.holes) {
    s.phase = 'gameover';
    room.phase = 'gameover';
    s.nextAt = null;
    const rows = (s.board || []).filter(r => s.order.indexOf(r.id) !== -1);
    const best = rows.length ? rows[0].score : null;
    const winners = rows.filter(r => r.score === best).map(r => r.id);
    // One on their own counts no win: there was nobody to beat.
    if (rows.length > 1) winners.forEach(pid => { s.wins[pid] = (s.wins[pid] || 0) + 1; });
    s.result = { winners: winners, par: golfParOf(s.holes), settleAt: settle };
    return;
  }
  s.phase = 'between';
  s.nextAt = settle + MG_BETWEEN_MS;
};

/** Whose putt is next in turns: the next ball still in play after `from`, round the table. */
const mgNextTurn = (room, from) => {
  const s = room.shared;
  const n = s.order.length;
  const at = s.order.indexOf(from);
  for (let k = 1; k <= n; k++) {
    const pid = s.order[(at + k + n) % n];
    if (s.balls[pid] && !s.balls[pid].done) return pid;
  }
  return null;
};

/**
 * The balls a putt by `pid` can hit: in turns, every ball lying on the course
 * - hit from the tee at least once, and not yet in or picked up - in the
 * table's order (every phone lists them the same way). All at once, none.
 */
const mgOthers = (s, pid) => {
  if (s.settings.mode !== 'turns') return null;
  return s.order.filter(id => {
    const b = s.balls[id];
    return id !== pid && b && !b.done && b.n > 0;
  }).map(id => ({ id: id, at: s.balls[id].at.slice() }));
};

/** One putt for `pid`: the server's result on the table for every phone to replay. */
const mgPutt = (room, pid, raw, auto) => {
  const s = room.shared;
  const b = s.balls[pid];
  const now = Date.now();
  const h = GOLF_HOLES[s.hole];
  const own = Math.max(0, now - s.startedAt);
  const t0 = !auto && Math.abs((Number(raw.t0) || 0) - own) <= MG_T0_SLACK ? Math.max(0, Math.round(Number(raw.t0) || 0)) : own;
  const shot = golfCleanShot({ dx: raw.dx, dy: raw.dy, power: raw.power, t0: t0 });
  const others = mgOthers(s, pid);
  const r = others ? golfPutt(h, b.at, shot, others) : golfPutt(h, b.at, shot);
  const wetAny = r.end === 'water' || (r.moved || []).some(m => m.end === 'water');
  const dur = Math.round(r.t * 1000) + (wetAny ? MG_SPLASH_MS : 0);
  s.shotSeq = (s.shotSeq || 0) + 1;
  s.shots[pid] = {
    seq: s.shotSeq, n: b.n + r.strokes, from: b.at.slice(),
    dx: shot.dx, dy: shot.dy, power: shot.power, t0: shot.t0,
    end: r.end, at: r.at.slice(), add: r.strokes, dur: dur, auto: !!auto,
    wet: r.wet || null
  };
  if (others) { s.shots[pid].others = others; s.shots[pid].moved = r.moved; }
  const max = golfMaxOf(h);
  b.n += r.strokes;
  b.at = r.at.slice();
  b.restAt = now + dur;
  if (r.end === 'cup') b.done = 'cup';
  else if (b.n >= max) { b.done = 'picked'; b.n = max + 1; }
  if (b.done) (s.card[pid] = s.card[pid] || new Array(s.holes).fill(null))[s.hole] = b.n;
  // The balls it knocked: where they lie now; one knocked in is holed with its strokes so far.
  (r.moved || []).forEach(m => {
    const o = s.balls[m.id];
    if (!o) return;
    o.at = m.at.slice();
    o.restAt = Math.max(o.restAt || 0, now + dur);
    if (m.end === 'cup') {
      o.done = 'cup';
      o.clockAt = null;
      (s.card[m.id] = s.card[m.id] || new Array(s.holes).fill(null))[s.hole] = o.n;
    }
  });
  if (s.settings.mode === 'turns') {
    b.clockAt = null;
    const next = mgNextTurn(room, pid);
    s.turn = next;
    if (next) mgClockFor(room, next, b.restAt);
  } else {
    mgClockFor(room, pid, b.restAt);
  }
  if (mgAllDone(room)) mgEndHole(room);
  else mgBoard(room);
};

const minigolfAction = (room, playerId, action, payload) => {
  const p = payload || {};
  if (action === 'start') { mgNewGame(room, playerId, p, false); room.shared.stamp = Date.now(); return; }
  const s = room.shared;
  if (!s || !s.settings) throw new Error('اللعبة لم تبدأ بعد');

  if (action === 'playAgain') {
    if (s.phase !== 'gameover') return;
    mgNewGame(room, playerId, p, true);
    room.shared.stamp = Date.now();
    return;
  }

  if (action === 'putt' || action === 'playFor') {
    const target = action === 'playFor' ? String(p.target || '') : playerId;
    if (action === 'playFor') requireHost(room, playerId);
    if (s.phase !== 'play' || staleTap(p, 'hole', s.hole)) return;
    const b = s.balls[target];
    if (!b) throw new Error(action === 'playFor' ? 'اللاعب ده مش في اللعبة' : 'انت بتتفرج الجيم ده');
    if (b.done || staleTap(p, 'n', b.n)) return;
    if (s.settings.mode === 'turns' && s.turn !== target) {
      if (action === 'playFor') return;
      throw new Error('مش دورك');
    }
    if (action === 'playFor') mgPutt(room, target, golfAutoShot(GOLF_HOLES[s.hole], b.at, Date.now() - s.startedAt), true);
    else mgPutt(room, target, p, false);
    s.stamp = Date.now();
    return;
  }

  if (action === 'nextHole') {
    requireHost(room, playerId);
    if (s.phase !== 'between' || staleTap(p, 'hole', s.hole)) return;
    mgStartHole(room, s.hole + 1);
    mgBoard(room);
    s.stamp = Date.now();
    return;
  }

  throw new Error('إجراء غير معروف');
};

/* --- the clocks ------------------------------------------------------------------ */

const mgDeadline = (room) => {
  const s = room.shared || {};
  if (s.phase === 'between') return s.nextAt || null;
  if (s.phase !== 'play') return null;
  let due = null;
  Object.keys(s.balls || {}).forEach(pid => {
    const b = s.balls[pid];
    if (b && !b.done && b.clockAt && (due === null || b.clockAt < due)) due = b.clockAt;
  });
  return due;
};

const mgTimeout = (room, now) => {
  const s = room.shared || {};
  if (s.phase === 'between') {
    if (!s.nextAt || now < s.nextAt) return false;
    mgStartHole(room, s.hole + 1);
    mgBoard(room);
    s.stamp = now;
    return true;
  }
  if (s.phase !== 'play') return false;
  // Every ball whose clock has run out gets the phone's gentle putt.
  const due = s.order.filter(pid => { const b = s.balls[pid]; return b && !b.done && b.clockAt && now >= b.clockAt; });
  if (!due.length) return false;
  const hole = s.hole;
  due.forEach(pid => {
    const b = s.balls[pid];
    if (s.phase !== 'play' || s.hole !== hole || !b || b.done) return;
    if (s.settings.mode === 'turns' && s.turn !== pid) return;
    mgPutt(room, pid, golfAutoShot(GOLF_HOLES[s.hole], b.at, now - s.startedAt), true);
  });
  s.stamp = now;
  return true;
};

/* --- someone leaves ---------------------------------------------------------------
   Their ball leaves the hole and their card the board; the turn, if it was
   theirs, moves on; the hole ends if every ball left is done. With nobody
   left the game is over.
   ------------------------------------------------------------------------------ */
const mgPlayerLeft = (room, playerId) => {
  const s = room.shared;
  if (!s || !s.settings || s.phase === 'gameover') return;
  const had = s.order.indexOf(playerId) !== -1;
  if (!had) return;
  const wasTurn = s.turn === playerId;
  const next = wasTurn ? mgNextTurn(room, playerId) : null;
  s.order = s.order.filter(id => id !== playerId);
  delete s.balls[playerId];
  delete s.shots[playerId];
  delete s.card[playerId];
  s.stamp = Date.now();
  if (!s.order.length) {
    s.phase = 'gameover';
    room.phase = 'gameover';
    s.turn = null;
    s.nextAt = null;
    s.result = { winners: [], par: golfParOf(s.holes), settleAt: Date.now() };
    mgBoard(room);
    return;
  }
  if (s.phase === 'play') {
    if (wasTurn) {
      s.turn = next && next !== playerId ? next : mgNextTurn(room, s.order[0]) || null;
      if (s.turn) mgClockFor(room, s.turn, Date.now());
    }
    if (mgAllDone(room)) { mgEndHole(room); return; }
  }
  mgBoard(room);
};
