/* ============================================================================
   حط إيدك! (first called بالظبط ٣!) — HANDS DOWN! (rooms), the owner's rules of 29 Sep 2026
   ----------------------------------------------------------------------------
   A co-op reflex game on everyone's own phone. Each level the table gets one
   order ("exactly 3 of you: hands down!", "nobody press", "in turn", ...),
   read during a short countdown, then a window to do it on the pad. The
   server judges from the phones' own stamps of the server's time (the way
   الكراسي الموسيقية ranks its taps) and knows exactly whose hand was wrong:
   EVERY ORDER IS ABOUT THE PHONE ONLY (the owner: "all related to the phone so
   you know who failed") - counts, timing, order, holding, releasing, tapping a
   number of times, a colour / shape / number / word on your own screen.
   Right: the next level. Wrong: the table spills one of its tea glasses (3),
   and every screen shows whose hand was extra / missing / early / late.
   Until the glasses run out; the level reached is the room's record.

   Phases (shared.phase):
     ready    the order is on every screen (read it) until goAt
     go       the window: presses from goAt to endAt (+ EXACT_LAG_MS for a
              stamped tap still on its way); some orders close early
     reveal   the verdict (shared.result) until nextAt, then the next order,
              or the end once the last glass spilt
     gameover the level reached, the room's best, the clean hands

   What is hidden: each phone's secret (a colour, a shape, a number, a word)
   for the orders that deal one (room._exact.mine, and room.secrets[pid] for
   its own phone) until the verdict publishes them all; every press's exact
   events (room._exact.ev). Shared live: whose hand is down, how many taps,
   the order hands came down in - what a table would see anyway.

   Bundled after RoomGames.js (requireHost, requireMoveOn, staleTap, shuffled,
   roomPlayerName). Every name here starts with exact / EXACT_.
   ========================================================================= */
const EXACT_MIN = 3;
const EXACT_MAX = 12;
const EXACT_LIVES = 3;
const EXACT_GRACE_MS = 150;      // a tap may be stamped this far before go (clock drift)
const EXACT_LAG_MS = 350;        // the window stays open this long after its end for stamped taps on their way
const EXACT_EARLY_CLOSE_MS = 300;// an order already decided closes this long after
const EXACT_OK_MS = 3600;        // a won order's verdict, then the next
const EXACT_BAD_MS = 5400;       // a lost one's: the slap, the bee, the spill
const EXACT_OVER_MS = 4200;      // the last spill before the end
const EXACT_MAX_EVENTS = 60;     // taps a phone may send in one order
const EXACT_REFILL_EVERY = 5;    // every 5th level cleared refills a spilt glass
const EXACT_SHAPES = ['star', 'circle', 'triangle', 'square'];
const EXACT_TOL_MS = 150;        // a pulse beat's / a counter step's slack either side

/**
 * The deck. `from` is the first level an order can come up; `read` how long it
 * is on the screen before go (sum needs talking, so it reads longest).
 */
const EXACT_KINDS = [
  { kind: 'count',     from: 1, w: 3, read: 2600 },
  { kind: 'all',       from: 1, w: 2, read: 2600 },
  { kind: 'taps',      from: 1, w: 2, read: 2600 },
  { kind: 'none',      from: 2, w: 1, read: 2800 },
  { kind: 'seq',       from: 2, w: 2, read: 3400 },
  { kind: 'hold',      from: 3, w: 2, read: 2800 },
  { kind: 'pick',      from: 3, w: 2, read: 3400 },
  { kind: 'total',     from: 3, w: 2, read: 2800 },
  { kind: 'pulse',     from: 4, w: 2, read: 3200 },
  { kind: 'sum',       from: 4, w: 2, read: 6000 },
  { kind: 'letgo',     from: 5, w: 2, read: 3400 },
  { kind: 'release',   from: 5, w: 2, read: 3000 },
  { kind: 'mirror',    from: 5, w: 1, read: 3400 },
  { kind: 'pickcount', from: 6, w: 2, read: 3600 }
];

const exactRand = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const exactPickOf = (arr) => arr[Math.floor(Math.random() * arr.length)];

/** The players of this game still in the room. */
const exactRoster = (room) => ((room.shared || {}).roster || []).filter(id => room.players.some(p => p.id === id && !p.bot));

const exactAction = (room, playerId, action, payload) => {
  if (action === 'start' || action === 'playAgain') {
    requireHost(room, playerId);
    const people = room.players.filter(p => !p.bot).map(p => p.id);
    if (people.length < EXACT_MIN) throw new Error('محتاجين 3 لاعبين على الأقل');
    const prev = room.shared || {};
    if (action === 'playAgain' && prev.phase !== 'gameover') return;
    const roster = people.slice(0, EXACT_MAX);
    room.secrets = {};
    room._exact = null;
    room.shared = {
      roster,
      round: 0,
      level: 1,
      lives: EXACT_LIVES,
      maxLives: EXACT_LIVES,
      best: room._exactBest || 0,
      record: false,
      seen: [],
      last: [],
      clean: {},
      phase: 'ready',
      board: []
    };
    roster.forEach(id => { room.shared.clean[id] = 0; });
    room.shared.board = exactBoard(room);
    room.phase = 'play';
    exactDeal(room);
    return;
  }

  const s = room.shared;
  if (!s || room.phase !== 'play') throw new Error('اللعبة لم تبدأ بعد');

  if (action === 'down' || action === 'up') {
    if (staleTap(payload, 'round', s.round)) return;
    if (exactRoster(room).indexOf(playerId) === -1) return;          // watching
    const now = Date.now();
    // The phone opens its pad at its own reading of goAt; the server's clock may not have
    // turned the phase yet (its alarm is a moment behind): the tap turns it.
    if (s.phase === 'ready' && now >= s.goAt - EXACT_GRACE_MS) exactGo(room);
    if (s.phase !== 'go') return;
    const h = room._exact;
    let at = payload && typeof payload.at === 'number' && isFinite(payload.at) ? payload.at : now;
    // An honest stamp is never before go (the phone saw go after it happened) and never after
    // its arrival; one outside that is a time the phone couldn't have had: the arrival counts.
    if (at < s.goAt - EXACT_GRACE_MS || at > now) at = now;
    at = Math.max(s.goAt, Math.min(now, at));
    if (at > s.endAt) return;                                        // after the window
    const ev = h.ev[playerId] || (h.ev[playerId] = []);
    if (ev.length >= EXACT_MAX_EVENTS) return;
    const last = ev[ev.length - 1];
    const t = action === 'down' ? 'd' : 'u';
    if (t === 'd' && last && last.t === 'd') return;                  // down already
    if (t === 'u' && (!last || last.t === 'u')) return;               // nothing to lift
    ev.push({ t, at: Math.max(at, last ? last.at : at) });
    exactLive(room);
    exactMaybeClose(room, now);
    return;
  }
  if (action === 'nextRound') {
    requireMoveOn(room, playerId);
    if (staleTap(payload, 'round', s.round)) return;
    if (s.phase !== 'reveal') return;
    exactAfterReveal(room);
    return;
  }
  throw new Error('إجراء غير معروف');
};

/* --- dealing an order ------------------------------------------------------------ */

/** Which order comes next: one not yet seen first (a new one each level), never the same twice in a row. */
const exactChooseKind = (room) => {
  const s = room.shared;
  if (s.round === 1) return 'count';                                   // the game's own name: بالظبط ٣!
  const open = EXACT_KINDS.filter(k => k.from <= s.level);
  const lastKind = s.last[s.last.length - 1];
  const recentTrap = s.last.slice(-2).indexOf('none') !== -1;
  const allowed = open.filter(k => k.kind !== lastKind && !(k.kind === 'none' && recentTrap));
  const fresh = allowed.filter(k => s.seen.indexOf(k.kind) === -1);
  if (fresh.length) return fresh[0].kind;
  const bag = [];
  allowed.forEach(k => { for (let i = 0; i < k.w; i++) bag.push(k.kind); });
  return bag.length ? exactPickOf(bag) : 'count';
};

/** Deals one order: its numbers, the secrets it gives each phone, its timings. */
const exactDeal = (room) => {
  const s = room.shared;
  const ids = exactRoster(room);
  const n = ids.length;
  const L = s.level;
  s.round = (s.round || 0) + 1;
  const kind = exactChooseKind(room);
  const def = EXACT_KINDS.find(k => k.kind === kind);
  const o = { kind, fresh: s.seen.indexOf(kind) === -1 };
  const mine = {};
  const sync = Math.max(220, 800 - 70 * (L - 1));
  const beat = Math.max(450, 1000 - 60 * (L - 1));
  const step = Math.max(600, 1100 - 60 * (L - 1));
  let win = 2600;
  // A split of the table: `inG` of them in the group, never nobody, never everyone.
  const split = (inG) => { const g = shuffled(ids).slice(0, inG); return (id) => g.indexOf(id) !== -1; };
  const groupSize = () => exactRand(1, n - 1);
  if (kind === 'count') {
    o.n = s.round === 1 ? Math.min(3, n - 1) : exactRand(1, n - 1);
    win = 2600;
  } else if (kind === 'none') {
    win = 2800;
  } else if (kind === 'all') {
    o.sync = sync;
    win = 2200;
  } else if (kind === 'taps') {
    o.n = exactRand(2, Math.min(5, 2 + Math.floor((L - 1) / 3)));
    win = 2400 + o.n * 300;
  } else if (kind === 'total') {
    o.n = exactRand(n + 1, n * 2 + Math.min(4, L));
    win = 4000;
  } else if (kind === 'hold') {
    o.n = exactRand(1, n - 1);
    win = 3500;
  } else if (kind === 'seq') {
    o.seq = shuffled(ids).slice(0, Math.min(n, 3 + Math.floor((L - 1) / 2)));
    win = 1400 + o.seq.length * 800;
  } else if (kind === 'pulse') {
    o.seq = shuffled(ids);
    o.beat = beat;
    win = o.seq.length * beat + 500;
  } else if (kind === 'pick' || kind === 'pickcount') {
    const attrs = ['c'].concat(L >= 4 ? ['sh'] : []).concat(L >= 5 ? ['odd'] : []);
    o.attr = exactPickOf(attrs);
    const gSize = kind === 'pickcount' ? exactRand(Math.min(2, n - 1), n - 1) : groupSize();
    const inG = split(gSize);
    if (o.attr === 'c') {
      o.want = exactPickOf(['g', 'r']);
      ids.forEach(id => { mine[id] = { c: inG(id) ? o.want : (o.want === 'g' ? 'r' : 'g') }; });
    } else if (o.attr === 'sh') {
      o.want = exactPickOf(EXACT_SHAPES);
      const others = EXACT_SHAPES.filter(x => x !== o.want);
      ids.forEach(id => { mine[id] = { sh: inG(id) ? o.want : exactPickOf(others) }; });
    } else {
      o.want = exactPickOf(['odd', 'even']);
      const odd = [1, 3, 5, 7, 9], even = [2, 4, 6, 8];
      ids.forEach(id => { mine[id] = { n: exactPickOf((inG(id) ? o.want === 'odd' : o.want !== 'odd') ? odd : even) }; });
    }
    if (kind === 'pickcount') o.n = exactRand(1, Math.max(1, gSize - 1));
    win = 2600;
  } else if (kind === 'mirror') {
    const inG = split(groupSize());
    ids.forEach(id => { mine[id] = { say: inG(id) ? 'stop' : 'press' }; });
    win = 2600;
  } else if (kind === 'sum') {
    ids.forEach(id => { mine[id] = { n: exactRand(1, 6) }; });
    const k = exactRand(2, Math.max(2, Math.min(4, n - 1)));
    o.n = shuffled(ids).slice(0, k).reduce((a, id) => a + mine[id].n, 0);
    win = 3000;
  } else if (kind === 'letgo') {
    ids.forEach(id => { mine[id] = { n: exactRand(1, 5) }; });
    o.lead = 1200;
    o.step = step;
    win = o.lead + 5 * step + 400;
  } else if (kind === 'release') {
    o.lead = 1500;
    o.gap = Math.min(600, 300 + 25 * (L - 1));
    win = o.lead + n * 700 + 800;
  }
  const now = Date.now();
  room._exact = { mine, ev: {} };
  room.secrets = {};
  Object.keys(mine).forEach(id => { room.secrets[id] = { mine: mine[id], round: s.round }; });
  s.order = o;
  s.phase = 'ready';
  s.readAt = now;
  s.goAt = now + def.read;
  s.endAt = s.goAt + win;
  s.closeAt = s.endAt + EXACT_LAG_MS;
  s.nextAt = null;
  s.result = null;
  s.live = { down: {}, taps: {}, order: [] };
  if (s.seen.indexOf(kind) === -1) s.seen.push(kind);
  s.last = s.last.concat([kind]).slice(-4);
};

const exactGo = (room) => {
  const s = room.shared;
  if (s.phase !== 'ready') return;
  s.phase = 'go';
};

/** Who is down, how many taps, the order hands first came down: what the table sees. */
const exactLive = (room) => {
  const s = room.shared;
  const ev = room._exact.ev;
  const live = { down: {}, taps: {}, order: [] };
  const firsts = [];
  Object.keys(ev).forEach(id => {
    const list = ev[id];
    const downs = list.filter(e => e.t === 'd');
    if (!downs.length) return;
    live.taps[id] = downs.length;
    if (list[list.length - 1].t === 'd') live.down[id] = true;
    firsts.push({ id, at: downs[0].at });
  });
  firsts.sort((a, b) => a.at - b.at);
  live.order = firsts.map(x => x.id);
  s.live = live;
};

/** An order that is already decided closes a moment later rather than waiting out its window. */
const exactMaybeClose = (room, now) => {
  const s = room.shared;
  const o = s.order;
  const ev = room._exact.ev;
  const ids = exactRoster(room);
  const has = (id) => (ev[id] || []).some(e => e.t === 'd');
  const released = (id) => { const l = ev[id] || []; return l.length > 1 && l[l.length - 1].t === 'u'; };
  let done = false;
  if (o.kind === 'none') done = ids.some(has);                           // someone pressed: the bee is coming
  else if (o.kind === 'all') done = ids.every(has);
  else if (o.kind === 'seq') done = o.seq.filter(id => ids.indexOf(id) !== -1).every(has);
  else if (o.kind === 'release' || o.kind === 'letgo') done = ids.every(released);
  if (done) s.closeAt = Math.min(s.closeAt, now + EXACT_EARLY_CLOSE_MS);
};

/* --- judging ----------------------------------------------------------------------- */

/**
 * The verdict, from every phone's events in ms after go. Returns
 * { ok, bad: { pid: { why, n?, k? } }, short, ... }. `why`:
 *   extra     a hand one too many (the latest to come down)
 *   missing   a hand that should have come down and didn't
 *   wrong     came down, but its screen said it shouldn't
 *   stung     came down in «محدش يحط إيده»
 *   early / late   off the moment (the sync, the pulse, the counter)
 *   taps      the wrong number of taps (n: what it tapped)
 *   together  let go at the same moment as another
 *   order     came down before its turn
 */
const exactJudge = (room) => {
  const s = room.shared;
  const o = s.order;
  const h = room._exact;
  const ids = exactRoster(room);
  const go = s.goAt, end = s.endAt;
  const evOf = (id) => (h.ev[id] || []).filter(e => e.at <= end).map(e => ({ t: e.t, ms: e.at - go }));
  const downs = (id) => evOf(id).filter(e => e.t === 'd');
  const first = (id) => { const d = downs(id); return d.length ? d[0].ms : null; };
  const heldAtEnd = (id) => { const l = evOf(id); return l.length > 0 && l[l.length - 1].t === 'd'; };
  const bad = {};
  const mark = (id, why, extra) => { if (!bad[id]) bad[id] = Object.assign({ why }, extra || {}); };
  const pressers = ids.filter(id => first(id) !== null).sort((a, b) => first(a) - first(b));
  const res = { kind: o.kind, short: 0 };
  const mineOf = (id) => (h.mine || {})[id] || {};

  const countOver = (list, want) => {
    if (list.length > want) list.slice(want).forEach(id => mark(id, 'extra'));
    else if (list.length < want) res.short = want - list.length;
  };

  if (o.kind === 'count') {
    countOver(pressers, Math.min(o.n, ids.length));
  } else if (o.kind === 'none') {
    pressers.forEach(id => mark(id, 'stung'));
  } else if (o.kind === 'all') {
    ids.forEach(id => { if (first(id) === null) mark(id, 'missing'); });
    // The widest group of first presses inside o.sync of each other; outside it, early or late.
    const ts = pressers.map(first);
    let bi = 0, bj = -1;
    for (let i = 0, j = 0; i < ts.length; i++) {
      while (j + 1 < ts.length && ts[j + 1] - ts[i] <= o.sync) j++;
      if (j - i > bj - bi) { bi = i; bj = j; }
    }
    pressers.forEach((id, k) => { if (k < bi) mark(id, 'early'); else if (k > bj) mark(id, 'late'); });
    res.spread = ts.length ? ts[ts.length - 1] - ts[0] : 0;
  } else if (o.kind === 'taps') {
    ids.forEach(id => { const k = downs(id).length; if (k !== o.n) mark(id, k ? 'taps' : 'missing', { n: k }); });
  } else if (o.kind === 'total') {
    const all = [];
    ids.forEach(id => downs(id).forEach(d => all.push({ id, ms: d.ms })));
    all.sort((a, b) => a.ms - b.ms);
    res.total = all.length;
    if (all.length > o.n) all.slice(o.n).forEach(x => mark(x.id, 'extra'));
    else if (all.length < o.n) res.short = o.n - all.length;
  } else if (o.kind === 'hold') {
    const lastDown = (id) => { const d = downs(id); return d[d.length - 1].ms; };
    const held = ids.filter(heldAtEnd).sort((a, b) => lastDown(a) - lastDown(b));
    res.held = held;
    countOver(held, Math.min(o.n, ids.length));
  } else if (o.kind === 'seq') {
    const seq = o.seq.filter(id => ids.indexOf(id) !== -1);
    pressers.forEach(id => { if (seq.indexOf(id) === -1) mark(id, 'extra'); });
    let prev = -Infinity;
    seq.forEach(id => {
      const t = first(id);
      if (t === null) { mark(id, 'missing'); return; }
      if (t < prev) mark(id, 'order');
      prev = Math.max(prev, t);
    });
  } else if (o.kind === 'pulse') {
    o.seq.forEach((id, k) => {
      if (ids.indexOf(id) === -1) return;
      const from = k * o.beat, to = (k + 1) * o.beat;
      const d = downs(id);
      if (!d.length) { mark(id, 'missing'); return; }
      if (d[0].ms < from - EXACT_TOL_MS) mark(id, 'early');
      else if (d[0].ms > to + EXACT_TOL_MS) mark(id, 'late');
    });
  } else if (o.kind === 'pick' || o.kind === 'mirror' || o.kind === 'pickcount') {
    const inG = (id) => {
      const m = mineOf(id);
      if (o.kind === 'mirror') return m.say === 'stop';
      if (o.attr === 'c') return m.c === o.want;
      if (o.attr === 'sh') return m.sh === o.want;
      return (m.n % 2 === 1) === (o.want === 'odd');
    };
    pressers.forEach(id => { if (!inG(id)) mark(id, 'wrong'); });
    if (o.kind === 'pickcount') {
      countOver(pressers.filter(inG), Math.min(o.n, ids.filter(inG).length));
    } else {
      ids.forEach(id => { if (inG(id) && first(id) === null) mark(id, 'missing'); });
    }
  } else if (o.kind === 'sum') {
    let acc = 0, over = false;
    pressers.forEach(id => {
      const v = mineOf(id).n || 0;
      if (over || acc + v > o.n) { over = true; mark(id, 'extra'); return; }
      acc += v;
    });
    res.sum = pressers.reduce((a, id) => a + (mineOf(id).n || 0), 0);
    if (!over && acc < o.n) res.short = o.n - acc;
  } else if (o.kind === 'letgo' || o.kind === 'release') {
    // Down when the lead ends, then a let-go: the first 'u' after the down that covered the lead.
    const lets = {};
    ids.forEach(id => {
      const l = evOf(id);
      if (!l.some(e => e.t === 'd')) { mark(id, 'missing'); return; }
      let downAt = null, up = null;
      for (const e of l) {
        if (e.t === 'd') { if (up === null) downAt = e.ms; }
        else if (downAt !== null && up === null) { if (e.ms >= o.lead - EXACT_TOL_MS) up = e.ms; else downAt = null; }
      }
      if (downAt === null || downAt > o.lead + EXACT_TOL_MS) { mark(id, downAt === null ? 'early' : 'late'); return; }
      if (up === null) { mark(id, 'late'); return; }
      lets[id] = up;
      if (o.kind === 'letgo') {
        const want = mineOf(id).n || 1;
        const from = o.lead + (want - 1) * o.step, to = o.lead + want * o.step;
        if (up < from - EXACT_TOL_MS) mark(id, 'early');
        else if (up > to + EXACT_TOL_MS) mark(id, 'late');
      }
    });
    if (o.kind === 'release') {
      const list = Object.keys(lets).sort((a, b) => lets[a] - lets[b]);
      for (let i = 1; i < list.length; i++) {
        if (lets[list[i]] - lets[list[i - 1]] < o.gap) { mark(list[i - 1], 'together'); mark(list[i], 'together'); }
      }
    }
    res.lets = lets;
  }

  res.bad = bad;
  res.ok = !Object.keys(bad).length && !res.short;
  res.presses = pressers.map(id => ({ id, ms: Math.round(first(id)) }));
  res.taps = {};
  ids.forEach(id => { const k = downs(id).length; if (k) res.taps[id] = k; });
  // Every secret, once the order is judged (the table sees whose screen said what).
  if (Object.keys(h.mine || {}).length) res.reveal = Object.assign({}, h.mine);
  return res;
};

/** The window closed: the verdict, the glasses, the level. */
const exactClose = (room) => {
  const s = room.shared;
  const res = exactJudge(room);
  const ids = exactRoster(room);
  res.livesBefore = s.lives;
  res.levelBefore = s.level;
  ids.forEach(id => { if (!res.bad[id]) s.clean[id] = (s.clean[id] || 0) + 1; });
  if (res.ok) {
    s.level += 1;
    res.food = s.level - 2;                                            // the item this level puts on the table (0-based)
    if ((s.level - 1) % EXACT_REFILL_EVERY === 0 && s.lives < s.maxLives) { s.lives += 1; res.refill = true; }
  } else {
    s.lives = Math.max(0, s.lives - 1);
  }
  res.livesAfter = s.lives;
  res.final = s.lives <= 0;
  s.result = res;
  s.phase = 'reveal';
  s.live = s.live || { down: {}, taps: {}, order: [] };
  room.secrets = {};
  s.nextAt = Date.now() + (res.final ? EXACT_OVER_MS : res.ok ? EXACT_OK_MS : EXACT_BAD_MS);
  s.board = exactBoard(room);
};

/** After a verdict: the next order, or the end once the tea is gone. */
const exactAfterReveal = (room) => {
  const s = room.shared;
  if (s.lives <= 0 || exactRoster(room).length < 2) { exactGameOver(room); return; }
  exactDeal(room);
};

const exactGameOver = (room) => {
  const s = room.shared;
  room._exact = null;
  room.secrets = {};
  s.phase = 'gameover';
  s.nextAt = null;
  s.reached = s.level;
  const cleared = s.level - 1;
  s.record = cleared > 0 && cleared > (room._exactBest || 0);
  room._exactBest = Math.max(room._exactBest || 0, cleared);
  s.best = room._exactBest;
  s.board = exactBoard(room);
};

/** The night's board: each player's clean hands (orders they did right), best first. */
const exactBoard = (room) => {
  const s = room.shared || {};
  const clean = s.clean || {};
  return (s.roster || [])
    .map(id => room.players.find(p => p.id === id))
    .filter(Boolean)
    .map(p => ({ id: p.id, name: p.name, score: clean[p.id] || 0 }))
    .sort((a, b) => b.score - a.score);
};

/* --- the server's clock ------------------------------------------------------------ */
const exactDeadline = (room) => {
  const s = room.shared || {};
  if (room.phase !== 'play') return null;
  if (s.phase === 'ready') return s.goAt;
  if (s.phase === 'go') return s.closeAt;
  if (s.phase === 'reveal') return s.nextAt;
  return null;
};

const exactTimeout = (room, now) => {
  const s = room.shared || {};
  if (room.phase !== 'play') return false;
  if (s.phase === 'ready') {
    if (now < s.goAt) return false;
    exactGo(room);
    return true;
  }
  if (s.phase === 'go') {
    if (now < s.closeAt) return false;
    exactClose(room);
    return true;
  }
  if (s.phase === 'reveal') {
    if (!s.nextAt || now < s.nextAt) return false;
    exactAfterReveal(room);
    return true;
  }
  return false;
};

/**
 * Someone left. Mid-order (reading or doing it) the order is dealt again at the
 * same level - it may have needed their hand, their number or their turn, and the
 * table shouldn't spill a glass for it. Fewer than two ends the game.
 */
const exactPlayerLeft = (room, playerId) => {
  const s = room.shared;
  if (!s || room.phase !== 'play' || s.phase === 'gameover') return;
  if ((s.roster || []).indexOf(playerId) === -1) return;
  s.roster = s.roster.filter(id => id !== playerId);
  delete room.secrets[playerId];
  if (room._exact) { delete room._exact.ev[playerId]; delete room._exact.mine[playerId]; }
  if (exactRoster(room).length < 2) { exactGameOver(room); return; }
  if (s.phase === 'ready' || s.phase === 'go') {
    // A new round number (a tap still on its way for the old order is stale), the same level.
    exactDeal(room);
    s.redealt = s.round;
  }
  s.board = exactBoard(room);
};
