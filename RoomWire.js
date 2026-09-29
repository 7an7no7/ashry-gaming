/* ============================================================================
   سلك مقطوع — the co-op panic game (rooms), the owner's rules of 29 Sep 2026
   ----------------------------------------------------------------------------
   Every phone is a panel of 4-6 controls with funny names (Wire.js), in one of
   three places: the microbus broken down on the desert road, the kitchen an
   hour before the guests, the wedding with the power cut. Every phone gets an
   order with a draining bar - usually for a control on someone else's panel,
   so it is shouted across the table. A level is won by finishing its orders
   and lost by the damage (every order missed) or the clock, whichever runs
   out first; the levels get harder until the table loses. The room keeps its
   best.

   The server makes every order, knows which phone holds which control and
   judges every change. What is hidden: the panels (which phone holds what,
   and each control's state) - room._wire, each phone its own in
   room.secrets[pid]. What is public (shared): the level, the progress, the
   damage, the clocks, and every phone's current order - the TV shows them in
   every place (the kitchen's fridge lists them all), and a phone draws only
   its own. The holder of an order's control is never in it; who did an order
   is told once it is done (the table heard it anyway).

   Surprises (a lobby switch, on by default): new panels every level, a
   control breaking (smoke to wipe, or turned upside down for a while), and
   «الكل يهز الموبايل!» - an order for everyone at once.

   Phases (shared.phase):
     ready     the level's card; the panels are there to learn, no orders yet
     play      the orders run; won at the target, lost at the damage or the clock
     won       the level is cleared; the next one's card at nextAt, or the host's nextLevel
     gameover  lost (why: 'damage' | 'time' | 'left'); the levels cleared and the room's best
   Bundled after RoomGames.js (its helpers: requireHost, requireMoveOn,
   shuffled, staleTap). Every name here starts with wire / WIRE_.
   ========================================================================= */
const wireRand = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const wirePick = (list) => list[Math.floor(Math.random() * list.length)];

/** The players still at the table, in the room. */
const wireAlive = (room) => ((room.shared || {}).alive || []).filter(id => room.players.some(p => p.id === id));

/** Who holds a control. */
const wireHolder = (room, cid) => {
  const panels = (room._wire || {}).panels || {};
  return Object.keys(panels).find(pid => panels[pid].indexOf(cid) !== -1) || null;
};

const wireEvent = (room, ev) => {
  const s = room.shared;
  s.eventSeq = (s.eventSeq || 0) + 1;
  s.events = (s.events || []).concat([Object.assign({ seq: s.eventSeq, at: Date.now() }, ev)]).slice(-30);
};

const wireAction = (room, playerId, action, payload) => {
  payload = payload || {};
  if (action === 'start' || action === 'playAgain') {
    requireHost(room, playerId);
    const people = room.players.filter(p => !p.bot).map(p => p.id);
    if (people.length < WIRE_MIN) throw new Error('محتاجين 3 لاعبين على الأقل');
    const prev = room.shared || {};
    if (action === 'playAgain' && prev.phase !== 'gameover') return;
    const was = prev.settings || {};
    const place = WIRE_PLACES.indexOf(payload.place) !== -1 || payload.place === 'random' ? payload.place : (was.place || 'random');
    const surprises = typeof payload.surprises === 'boolean' ? payload.surprises : was.surprises !== false;
    const roster = people.slice(0, WIRE_MAX);
    room.secrets = {};
    room._wire = { panels: {}, vals: {}, presses: {}, broken: {}, pend: {}, base: {}, last: {}, seq: 0, nextBreak: null, shakeAt: null };
    room.shared = {
      settings: { place, surprises },
      place: place === 'random' ? wirePick(WIRE_PLACES) : place,
      roster,
      alive: roster.slice(),
      level: 0,
      levelsWon: 0,
      best: room._wireBest || 0,
      newBest: false,
      progress: 0, damage: 0, target: 0, dmgMax: WIRE_DMG_MAX,
      orders: {},
      shake: null,
      events: [], eventSeq: 0,
      phase: 'ready', why: null, startAt: null, endsAt: null, nextAt: null
    };
    room.phase = 'play';
    wireDeal(room);
    wireReady(room, 1);
    return;
  }

  const s = room.shared;
  if (!s || room.phase !== 'play') throw new Error('اللعبة لم تبدأ بعد');
  const w = room._wire;
  const now = Date.now();

  if (action === 'ctl' || action === 'press' || action === 'wipe') {
    if (staleTap(payload, 'lv', s.level)) return;
    if (s.phase !== 'ready' && s.phase !== 'play') return;
    const cid = String(payload.c || '');
    if (!w || (w.panels[playerId] || []).indexOf(cid) === -1) throw new Error('دي مش في لوحتك');
    const c = wireControl(cid);
    const broken = w.broken[cid];
    if (action === 'wipe') {
      if (!broken || broken.k !== 'smoke') return;
      broken.left = Math.max(0, broken.left - 1);
      if (broken.left === 0) { delete w.broken[cid]; wireEvent(room, { type: 'fixed', c: cid, pid: playerId }); }
      wireWrite(room);
      return;
    }
    if (broken && broken.k === 'smoke') return;           // covered in smoke: wipe it first
    if (action === 'press') {
      if (c.t !== 'btn') throw new Error('ده مش زرار');
      w.presses[cid] = (w.presses[cid] || 0) + 1;
    } else {
      if (c.t === 'btn') throw new Error('ده زرار');
      const v = Math.round(Number(payload.v));
      const ok = c.t === 'sw' ? (v === 0 || v === 1) : (v >= 1 && v <= WIRE_VALUES);
      if (!ok) throw new Error('قيمة مش مظبوطة');
      if (w.vals[cid] === v) return;
      w.vals[cid] = v;
    }
    if (s.phase === 'play') wireCheck(room, cid, playerId, now);
    wireWrite(room);
    return;
  }
  if (action === 'shake') {
    const sh = s.shake;
    if (!sh || s.phase !== 'play' || staleTap(payload, 'id', sh.id)) return;
    if (wireAlive(room).indexOf(playerId) === -1 || sh.done.indexOf(playerId) !== -1) return;
    sh.done.push(playerId);
    if (wireAlive(room).every(id => sh.done.indexOf(id) !== -1)) wireShakeEnd(room, true, now);
    wireWrite(room);
    return;
  }
  if (action === 'nextLevel') {
    requireMoveOn(room, playerId);
    if (s.phase !== 'won' || staleTap(payload, 'lv', s.level)) return;
    wireReady(room, s.level + 1);
    return;
  }
  throw new Error('إجراء غير معروف');
};

/** New panels for everyone at the table: a place's controls shuffled and shared out. */
const wireDeal = (room) => {
  const s = room.shared, w = room._wire;
  const alive = wireAlive(room);
  const k = wirePanelSize(alive.length);
  const pool = shuffled(WIRE_CONTROLS[s.place].map(c => s.place + '.' + c.id));
  w.panels = {};
  w.vals = {};
  w.presses = {};
  w.broken = {};
  alive.forEach(pid => { w.panels[pid] = pool.splice(0, k); });
  Object.keys(w.panels).forEach(pid => w.panels[pid].forEach(cid => {
    const c = wireControl(cid);
    if (c.t === 'sw') w.vals[cid] = Math.random() < 0.5 ? 0 : 1;
    else if (c.t !== 'btn') w.vals[cid] = wireRand(1, WIRE_VALUES);
  }));
};

/** A level's card: the numbers set, the clock not yet running, no orders. */
const wireReady = (room, level) => {
  const s = room.shared, w = room._wire;
  const now = Date.now();
  const alive = wireAlive(room);
  if (level > 1 && s.settings.surprises) wireDeal(room);      // new panels every level: a surprise
  const L = wireLevel(level, alive.length);
  s.level = level;
  s.target = L.target;
  s.dmgMax = L.dmgMax;
  s.orderMs = L.orderMs;
  s.progress = 0;
  s.damage = 0;
  s.orders = {};
  alive.forEach(pid => { s.orders[pid] = null; });
  s.shake = null;
  s.phase = 'ready';
  s.why = null;
  s.nextAt = null;
  s.startAt = now + WIRE_READY_MS;
  s.endsAt = s.startAt + L.levelMs;
  w.pend = {};
  w.base = {};
  w.last = {};
  w.broken = {};
  w.nextBreak = s.settings.surprises ? s.startAt + wireRand(12000, 20000) : null;
  w.shakeAt = s.settings.surprises && level >= 2 && Math.random() < 0.7 ? s.startAt + wireRand(25000, 50000) : null;
  wireEvent(room, { type: 'level', n: level });
  wireWrite(room);
};

/** A new order for one phone: usually a control on someone else's panel, never one already asked for. */
const wireIssue = (room, pid, now) => {
  const s = room.shared, w = room._wire;
  const alive = wireAlive(room);
  const L = wireLevel(s.level, alive.length);
  const taken = {};
  Object.keys(s.orders).forEach(id => { const o = s.orders[id]; if (o) taken[o.c] = true; });
  const usable = (cid) => !taken[cid] && !(w.broken[cid] && w.broken[cid].k === 'smoke') && cid !== w.last[pid];
  const own = (w.panels[pid] || []).filter(usable);
  const others = [];
  alive.forEach(x => { if (x !== pid) (w.panels[x] || []).forEach(cid => { if (usable(cid)) others.push(cid); }); });
  const pool = (own.length && Math.random() < WIRE_OWN_CHANCE) || !others.length ? own : others;
  delete w.pend[pid];
  if (!pool.length) { w.pend[pid] = now + 1000; return; }
  const cid = wirePick(pool);
  const c = wireControl(cid);
  w.seq += 1;
  const o = { id: w.seq, c: cid, at: now, ends: now + L.orderMs };
  if (c.t === 'btn') {
    o.n = wireRand(1, L.counts);
    w.base[pid] = w.presses[cid] || 0;
  } else if (c.t === 'sw') {
    o.v = w.vals[cid] ? 0 : 1;
  } else {
    const cur = w.vals[cid];
    const choices = [];
    for (let v = 1; v <= WIRE_VALUES; v++) if (v !== cur) choices.push(v);
    o.v = wirePick(choices);
  }
  s.orders[pid] = o;
  w.last[pid] = cid;
};

/** A control changed: every order it now satisfies is done. */
const wireCheck = (room, cid, by, now) => {
  const s = room.shared, w = room._wire;
  const c = wireControl(cid);
  Object.keys(s.orders).forEach(pid => {
    const o = s.orders[pid];
    if (!o || o.c !== cid || s.phase !== 'play') return;
    const done = c.t === 'btn' ? (w.presses[cid] || 0) - (w.base[pid] || 0) >= o.n : w.vals[cid] === o.v;
    if (!done) return;
    s.orders[pid] = null;
    delete w.base[pid];
    w.pend[pid] = now + WIRE_GAP_MS;
    s.progress += 1;
    wireEvent(room, { type: 'done', to: pid, by, c: cid, id: o.id, v: o.v, n: o.n });
    if (s.progress >= s.target) wireWin(room, now);
  });
};

const wireSetBest = (room) => {
  const s = room.shared;
  if (s.levelsWon > (room._wireBest || 0)) { room._wireBest = s.levelsWon; s.newBest = true; }
  s.best = room._wireBest || 0;
};

const wireClearOrders = (room) => {
  const s = room.shared, w = room._wire;
  Object.keys(s.orders).forEach(pid => { s.orders[pid] = null; });
  s.shake = null;
  w.pend = {};
  w.base = {};
  w.broken = {};
  w.nextBreak = null;
  w.shakeAt = null;
};

const wireWin = (room, now) => {
  const s = room.shared;
  wireClearOrders(room);
  s.phase = 'won';
  s.levelsWon = s.level;
  wireSetBest(room);
  s.nextAt = now + WIRE_BETWEEN_MS;
  wireEvent(room, { type: 'won', n: s.level });
};

const wireLose = (room, why) => {
  const s = room.shared;
  wireClearOrders(room);
  s.phase = 'gameover';
  s.why = why;
  s.levelsWon = Math.max(0, s.level - 1);
  s.nextAt = null;
  wireSetBest(room);
  wireEvent(room, { type: 'lost', why, n: s.level });
};

/** A control breaks: smoke to wipe, or turned upside down for a while. Often the one an order is waiting on. */
const wireBreak = (room, now) => {
  const s = room.shared, w = room._wire;
  const L = wireLevel(s.level, wireAlive(room).length);
  if (Object.keys(w.broken).length >= L.breaksAtOnce) return;
  const all = [];
  wireAlive(room).forEach(pid => (w.panels[pid] || []).forEach(cid => { if (!w.broken[cid]) all.push(cid); }));
  if (!all.length) return;
  const wanted = all.filter(cid => Object.keys(s.orders).some(pid => s.orders[pid] && s.orders[pid].c === cid));
  const cid = wanted.length && Math.random() < 0.5 ? wirePick(wanted) : wirePick(all);
  const k = Math.random() < 0.6 ? 'smoke' : 'flip';
  w.broken[cid] = k === 'smoke' ? { k, left: WIRE_WIPES } : { k, until: now + WIRE_FLIP_MS };
  wireEvent(room, { type: 'break', c: cid, pid: wireHolder(room, cid), k });
};

const wireShakeStart = (room, now) => {
  const s = room.shared, w = room._wire;
  w.seq += 1;
  s.shake = { id: w.seq, at: now, ends: now + WIRE_SHAKE_MS, done: [] };
  w.shakeAt = null;
  // Everyone is shaking: the orders' bars stand still meanwhile.
  Object.keys(s.orders).forEach(pid => { if (s.orders[pid]) s.orders[pid].ends += WIRE_SHAKE_MS; });
  Object.keys(w.pend).forEach(pid => { w.pend[pid] += WIRE_SHAKE_MS; });
  wireEvent(room, { type: 'shake', id: s.shake.id });
};

const wireShakeEnd = (room, ok, now) => {
  const s = room.shared;
  const sh = s.shake;
  s.shake = null;
  if (ok) {
    s.progress += WIRE_SHAKE_BONUS;
    wireEvent(room, { type: 'shakeOk', id: sh.id });
    if (s.progress >= s.target) wireWin(room, now);
  } else {
    s.damage += 1;
    wireEvent(room, { type: 'shakeFail', id: sh.id, miss: wireAlive(room).filter(id => sh.done.indexOf(id) === -1).length });
    if (s.damage >= s.dmgMax) wireLose(room, 'damage');
  }
};

/** What each phone is sent: its own panel, its controls' states and what is broken on it. */
const wireWrite = (room) => {
  const s = room.shared, w = room._wire;
  room.secrets = {};
  if (!w) return;
  wireAlive(room).forEach(pid => {
    room.secrets[pid] = {
      lv: s.level,
      panel: (w.panels[pid] || []).map(cid => {
        const c = wireControl(cid);
        const x = { c: cid };
        if (c.t !== 'btn') x.v = w.vals[cid];
        const b = w.broken[cid];
        if (b) x.b = b.k === 'smoke' ? { k: 'smoke', left: b.left } : { k: 'flip', until: b.until };
        return x;
      })
    };
  });
};

/** The server's next moment: the card's end, an order's bar, a phone's next order, a break, the shake, the clock. */
const wireDeadline = (room) => {
  const s = room.shared || {};
  const w = room._wire;
  if (room.phase !== 'play' || !w) return null;
  if (s.phase === 'ready') return s.startAt;
  if (s.phase === 'won') return s.nextAt || null;
  if (s.phase !== 'play') return null;
  const times = [s.endsAt];
  Object.keys(s.orders || {}).forEach(pid => { const o = s.orders[pid]; if (o) times.push(o.ends + WIRE_GRACE_MS); });
  // While everyone shakes no order goes out: the phones' next orders wait for its end.
  if (!s.shake) Object.keys(w.pend).forEach(pid => times.push(w.pend[pid]));
  if (w.nextBreak) times.push(w.nextBreak);
  if (s.shake) times.push(s.shake.ends);
  else if (w.shakeAt) times.push(w.shakeAt);
  Object.keys(w.broken).forEach(cid => { if (w.broken[cid].k === 'flip') times.push(w.broken[cid].until); });
  return Math.min.apply(null, times.filter(t => typeof t === 'number'));
};

const wireTimeout = (room, now) => {
  const s = room.shared || {};
  const w = room._wire;
  if (room.phase !== 'play' || !w) return false;
  let changed = false;
  if (s.phase === 'ready') {
    if (now < s.startAt) return false;
    // The clock starts; the first orders go out below, in this same pass - an alarm must
    // never leave its own deadline in the past (room.js would wait 30 s to look again).
    s.phase = 'play';
    wireAlive(room).forEach((pid, i) => { w.pend[pid] = s.startAt + i * 400; });
    changed = true;
  }
  if (s.phase === 'won') {
    if (!s.nextAt || now < s.nextAt) return false;
    wireReady(room, s.level + 1);
    return true;
  }
  if (s.phase !== 'play') return false;
  // The shake: its end, or its start.
  if (s.shake && now >= s.shake.ends) { wireShakeEnd(room, false, now); changed = true; }
  else if (!s.shake && w.shakeAt && now >= w.shakeAt) { wireShakeStart(room, now); changed = true; }
  // Orders missed: the damage.
  if (s.phase === 'play') {
    Object.keys(s.orders).forEach(pid => {
      const o = s.orders[pid];
      if (!o || s.phase !== 'play' || now < o.ends + WIRE_GRACE_MS) return;
      s.orders[pid] = null;
      delete w.base[pid];
      w.pend[pid] = now + WIRE_GAP_MS;
      s.damage += 1;
      wireEvent(room, { type: 'miss', to: pid, c: o.c, id: o.id, v: o.v, n: o.n });
      changed = true;
      if (s.damage >= s.dmgMax) wireLose(room, 'damage');
    });
  }
  if (s.phase === 'play') {
    Object.keys(w.broken).forEach(cid => {
      const b = w.broken[cid];
      if (b.k === 'flip' && now >= b.until) { delete w.broken[cid]; changed = true; }
    });
    if (w.nextBreak && now >= w.nextBreak) {
      wireBreak(room, now);
      const L = wireLevel(s.level, wireAlive(room).length);
      w.nextBreak = now + wireRand(Math.round(L.breakEvery * 0.8), Math.round(L.breakEvery * 1.2));
      changed = true;
    }
    if (!s.shake) {
      Object.keys(w.pend).forEach(pid => {
        if (now >= w.pend[pid] && s.phase === 'play') { wireIssue(room, pid, now); changed = true; }
      });
    }
    if (now >= s.endsAt) { wireLose(room, 'time'); changed = true; }
  }
  if (changed) wireWrite(room);
  return changed;
};

/**
 * Someone left: their panel goes with them. An order waiting on one of their
 * controls is called off (no damage) and its phone gets another; the shake
 * no longer waits for them. Fewer than two at the table ends the game.
 */
const wirePlayerLeft = (room, playerId) => {
  const s = room.shared, w = room._wire;
  if (!s || !w || room.phase !== 'play') return;
  s.alive = wireAlive(room).filter(id => id !== playerId);
  if (s.phase === 'gameover') { wireWrite(room); return; }
  const now = Date.now();
  const theirs = w.panels[playerId] || [];
  delete w.panels[playerId];
  delete s.orders[playerId];
  delete w.pend[playerId];
  delete w.base[playerId];
  theirs.forEach(cid => { delete w.broken[cid]; });
  Object.keys(s.orders).forEach(pid => {
    const o = s.orders[pid];
    if (o && theirs.indexOf(o.c) !== -1) {
      s.orders[pid] = null;
      delete w.base[pid];
      if (s.phase === 'play') w.pend[pid] = now + WIRE_GAP_MS;
    }
  });
  if (s.alive.length < 2) { wireLose(room, 'left'); wireWrite(room); return; }
  if (s.shake && s.alive.every(id => s.shake.done.indexOf(id) !== -1)) wireShakeEnd(room, true, now);
  wireWrite(room);
};
