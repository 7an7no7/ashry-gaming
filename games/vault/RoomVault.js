/* ============================================================================
   الخزنة («صندوق جدّو») — the talking safe game (rooms), the owner's rules of 1 Oct 2026
   ----------------------------------------------------------------------------
   Keep Talking and Nobody Explodes, our way: grandpa's old chest in the attic,
   locked with up to four padlocks (Vault.js: the wires, the symbols, the dial,
   the lights). Whoever sees a lock can't read the notebook that opens it, and
   whoever reads the notebook can't see the lock - so the table talks.

   Three ways, the host picks in the lobby:
     one    «واحد بيفتح»: one phone (or the TV, if the host says so) has the safe;
            every other phone a different page of the notebook. The opener
            changes every safe.
     all    «الكل»: every phone one lock of the safe and the page for a lock on
            someone else's phone. Everyone talks at once.
     teams  «فريقين»: two teams, the same safe for both, each with its opener and
            readers. The first to open it wins the safe.
   Mistakes: «٣ غلطات» (each one burns the candle faster, the third sets off the
   alarm and the safe is lost) or «من الوقت» (each one burns 15 s).
   Winning: endless levels (each safe harder; the room's best kept for the
   evening; co-op, nothing on the night's board) or a set of 3 / 5 / 7 safes with
   points (banked on the night's board like every scored game).

   What is hidden, and where (room._vault, never projected):
     seed, manual   the game's notebook (Vault.js vaultManual)
     safe           the safe: its locks' looks and answers (vaultMakeSafe)
     prog           each side's progress on each lock (wires cut, symbols pressed, lights pressed)
   A phone is sent only its own slice (vaultWrite): an opener the looks and its
   progress, never a page; a reader its pages, never a look; «الكل» its one lock
   and its one page. When the TV opens, its looks go to the screens only
   (room.screenOnly). The TV and every phone see the shared state: who holds
   which lock and page, which padlocks are open, the mistakes and the candles.

   Phases (shared.phase):
     ready     the safe's card: the locks and pages are there to read, the candles not yet lit
     play      the candles burn; a side is done when every lock opens, or it runs out
     result    the safe opened (or was lost, in a set); the next safe at nextAt, or the host's nextSafe
     gameover  the levels cleared and the room's best, or the set's board
   Bundled after RoomGames.js (its helpers: requireHost, requireMoveOn, shuffled,
   staleTap, isRoomScreen). Every name here starts with vault / VAULT_.
   ========================================================================= */

const vaultEvent = (room, ev) => {
  const s = room.shared;
  s.eventSeq = (s.eventSeq || 0) + 1;
  s.events = (s.events || []).concat([Object.assign({ seq: s.eventSeq, at: Date.now() }, ev)]).slice(-30);
};

/** The players still at the table, in the room. */
const vaultAlive = (room) => ((room.shared || {}).alive || []).filter(id => room.players.some(p => p.id === id));

const vaultSettings = (payload, was) => {
  const way = ['one', 'all', 'teams'].indexOf(payload.way) !== -1 ? payload.way : (was.way || 'one');
  const mistakes = payload.mistakes === 'time' || payload.mistakes === 'strikes' ? payload.mistakes : (was.mistakes || 'strikes');
  let win = payload.win === 'levels' || payload.win === 'set' ? payload.win : (was.win || 'levels');
  if (way === 'teams') win = 'set';           // a race is scored: two teams, a set of safes
  const count = VAULT_SET_COUNTS.indexOf(Number(payload.count)) !== -1 ? Number(payload.count) : (was.count || 5);
  const opener = payload.opener === 'tv' || payload.opener === 'phone' ? payload.opener : (was.opener || 'phone');
  return { way, mistakes, win, count, opener };
};

const vaultAction = (room, playerId, action, payload) => {
  payload = payload || {};
  if (action === 'start' || action === 'playAgain') {
    requireHost(room, playerId);
    const prev = room.shared || {};
    if (action === 'playAgain' && prev.phase !== 'gameover') return;
    const settings = vaultSettings(payload, prev.settings || {});
    const people = room.players.filter(p => !p.bot).map(p => p.id);
    const min = settings.way === 'teams' ? VAULT_TEAM_MIN : VAULT_MIN;
    if (people.length < min) throw new Error(settings.way === 'teams' ? 'محتاجين 4 لاعبين على الأقل للفريقين' : 'محتاجين لاعبين على الأقل');
    const roster = people.slice(0, VAULT_MAX);
    const tvOpens = settings.way === 'one' && settings.opener === 'tv' && (room.screens || []).length > 0;
    const seed = vaultSeed();
    room._vault = { seed, manual: vaultManual(seed), safe: null, prog: {} };
    room.secrets = {};
    room.screenOnly = null;
    let teams = null;
    if (settings.way === 'teams') {
      const mixed = shuffled(roster);
      teams = { a: mixed.filter((id, i) => i % 2 === 0), b: mixed.filter((id, i) => i % 2 === 1) };
    }
    room.shared = {
      settings,
      way: settings.way,
      roster,
      alive: roster.slice(),
      teams,
      tvOpens,
      safeNo: 0,
      level: 0,
      total: settings.win === 'set' ? settings.count : 0,
      levelsWon: 0,
      best: room._vaultBest || 0,
      newBest: false,
      scores: {},
      board: settings.win === 'set' ? roster.map(id => ({ id, name: roomPlayerName(room, id), score: 0 })) : null,
      serial: '',
      locks: [],
      sides: {},
      result: null,
      // «المفتاح الاحتياطي» (7 Oct 2026): each side's clean safes so far and its spare keys.
      clean: settings.way === 'teams' ? { a: 0, b: 0 } : { x: 0 },
      keys: settings.way === 'teams' ? { a: 0, b: 0 } : { x: 0 },
      events: [], eventSeq: 0,
      phase: 'ready', why: null, startAt: null, nextAt: null
    };
    room.phase = 'play';
    vaultNewSafe(room);
    return;
  }

  const s = room.shared;
  if (!s || room.phase !== 'play') throw new Error('اللعبة لم تبدأ بعد');
  const now = Date.now();
  // A TV that opened the safe and has gone: a phone takes the safe over.
  if (s.tvOpens && !(room.screens || []).length) vaultPhoneTakesOver(room);

  if (action === 'cut' || action === 'sym' || action === 'dial' || action === 'light') {
    if (staleTap(payload, 'safe', s.safeNo)) return;
    if (s.phase !== 'play') return;
    if (vaultCandlesOut(room, now)) { vaultWrite(room); if (s.phase !== 'play') return; }
    const i = Math.floor(Number(payload.i));
    const lock = ((room._vault || {}).safe || {}).locks ? room._vault.safe.locks[i] : null;
    if (!lock) throw new Error('قفل مش موجود');
    const key = vaultSideOfLock(room, playerId, i);
    if (!key) throw new Error('القفل ده مش معاك');
    const side = s.sides[key];
    if (side.done || side.open[i]) return;
    const want = { cut: 'wires', sym: 'symbols', dial: 'dial', light: 'lights' }[action];
    if (lock.k !== want) throw new Error('ده مش القفل ده');
    const pr = room._vault.prog[key][i];
    // `m`: the side's mistakes as the phone saw them (optional, for an older page). A wrong move
    // sent before an earlier mistake reached that phone (a double tap on «جرّب», a wrong symbol
    // twice) is dropped, not counted again; a right one still counts.
    const staleMiss = staleTap(payload, 'm', side.mistakes);
    if (action === 'cut') {
      const w = Math.floor(Number(payload.w));
      if (!(w >= 0 && w < lock.look.wires.length) || pr.cut.indexOf(w) !== -1) return;
      if (w !== lock.sol && staleMiss) return;
      pr.cut.push(w);
      if (w === lock.sol) vaultOpenLock(room, key, i, playerId, now);
      else vaultMistake(room, key, i, playerId, now);
    } else if (action === 'sym') {
      const x = String(payload.s || '');
      if (lock.look.syms.indexOf(x) === -1 || pr.pressed.indexOf(x) !== -1) return;
      if (x === lock.sol[pr.pressed.length]) {
        pr.pressed.push(x);
        if (pr.pressed.length === lock.sol.length) vaultOpenLock(room, key, i, playerId, now);
        else vaultEvent(room, { type: 'step', side: key, i, by: playerId });
      } else {
        if (staleMiss) return;
        pr.pressed = [];
        vaultMistake(room, key, i, playerId, now);
      }
    } else if (action === 'dial') {
      const code = Array.isArray(payload.code) ? payload.code.slice(0, 3).map(d => Math.floor(Number(d))) : [];
      if (code.length !== 3 || code.some(d => !(d >= 0 && d <= 9))) throw new Error('الكود 3 أرقام');
      if (code.join('') === lock.sol.join('')) vaultOpenLock(room, key, i, playerId, now);
      else if (staleMiss) return;
      else vaultMistake(room, key, i, playerId, now);
    } else {
      const c = String(payload.c || '');
      if (VAULT_LIGHT_COLORS.indexOf(c) === -1) throw new Error('لون مش موجود');
      const answer = vaultLightAnswer(room._vault.manual.lights, lock.look.seq, side.mistakes);
      if (c === answer[pr.n]) {
        pr.n += 1;
        if (pr.n >= answer.length) vaultOpenLock(room, key, i, playerId, now);
        else vaultEvent(room, { type: 'step', side: key, i, by: playerId });
      } else {
        if (staleMiss) return;
        pr.n = 0;
        pr.row = vaultLightRowOf(side.mistakes);      // the column that applied, for «ليه كده؟»
        vaultMistake(room, key, i, playerId, now);
      }
    }
    vaultCheckEnd(room, now);
    vaultWrite(room);
    return;
  }
  if (action === 'useKey') {
    // «المفتاح الاحتياطي»: a spare key opens one shut lock outright, from whoever works that lock.
    if (staleTap(payload, 'safe', s.safeNo)) return;
    if (s.phase !== 'play') return;
    if (vaultCandlesOut(room, now)) { vaultWrite(room); if (s.phase !== 'play') return; }
    const i = Math.floor(Number(payload.i));
    if (!s.locks[i]) throw new Error('قفل مش موجود');
    const key = vaultSideOfLock(room, playerId, i);
    if (!key) throw new Error('القفل ده مش معاك');
    const side = s.sides[key];
    if (side.done || side.open[i]) return;
    s.keys = s.keys || {};
    if (!(s.keys[key] > 0)) throw new Error('مفيش مفتاح احتياطي');
    s.keys[key] -= 1;
    vaultEvent(room, { type: 'keyUsed', side: key, i, k: s.locks[i].k, by: playerId });
    vaultOpenLock(room, key, i, playerId, now);
    vaultCheckEnd(room, now);
    vaultWrite(room);
    return;
  }
  if (action === 'nextSafe') {
    requireMoveOn(room, playerId);
    if (s.phase !== 'result' || staleTap(payload, 'safe', s.safeNo)) return;
    vaultAfterResult(room, now);
    return;
  }
  if (action === 'takeOver') {
    // The TV that had the safe isn't showing it (gone, or nobody near it): a phone takes it.
    requireMoveOn(room, playerId);
    // Sent for the safe it was pressed on (optional, for an older page): a double tap does nothing more.
    if (!s.tvOpens || s.phase === 'gameover' || staleTap(payload, 'safe', s.safeNo)) return;
    vaultPhoneTakesOver(room);
    vaultWrite(room);
    return;
  }
  throw new Error('إجراء غير معروف');
};

/** Which side's lock `i` this device works: a holder of it, or a screen when the TV opens. */
const vaultSideOfLock = (room, pid, i) => {
  const s = room.shared;
  return Object.keys(s.sides).find((key) => {
    const side = s.sides[key];
    if (side.opener === 'tv') return isRoomScreen(room, pid);
    const h = side.holders[pid];
    return !!h && h.locks.indexOf(i) !== -1;
  }) || null;
};

/** The clock on a side's candle now: what is left, burning at its rate since `at`. */
const vaultLeft = (side, now) => Math.max(0, side.left - Math.max(0, now - side.at) * side.rate);
const vaultSideDeadline = (side) => (side.rate > 0 ? side.at + side.left / side.rate : null);

/** The next safe: its locks (seeded), the opener of each side, the pages shared out. */
const vaultNewSafe = (room) => {
  const s = room.shared, v = room._vault;
  const now = Date.now();
  s.safeNo += 1;
  s.level = s.safeNo;
  const L = vaultLevel(s.level, s.way);
  const sideKeys = s.way === 'teams' ? ['a', 'b'] : ['x'];
  const idsOf = (key) => (key === 'x' ? vaultAlive(room) : (s.teams[key] || []).filter(id => vaultAlive(room).indexOf(id) !== -1));
  let kinds;
  if (s.way === 'all') {
    const base = shuffled(VAULT_LOCKS);
    kinds = idsOf('x').map((id, i) => base[i % base.length]);
  } else {
    const pickK = shuffled(VAULT_LOCKS).slice(0, L.locks);
    kinds = VAULT_LOCKS.filter(k => pickK.indexOf(k) !== -1);
  }
  v.safe = vaultMakeSafe(vaultSeed(), v.manual, kinds, L);
  v.prog = {};
  s.serial = v.safe.serial;
  s.locks = kinds.map((k, i) => ({ i, k }));
  s.startAt = now + VAULT_READY_MS;
  s.sides = {};
  sideKeys.forEach((key) => {
    const ids = idsOf(key);
    v.prog[key] = kinds.map(() => ({ cut: [], pressed: [], n: 0, miss: 0 }));
    v.first = {};
    let opener = null;
    if (s.way !== 'all') opener = s.tvOpens ? 'tv' : (ids.length ? ids[(s.safeNo - 1) % ids.length] : null);
    s.sides[key] = {
      ids, opener,
      strikes: 0, mistakes: 0,
      left: L.ms, at: s.startAt, rate: 1, ms: L.ms,
      open: kinds.map(() => false),
      done: null, why: null,
      holders: {}
    };
    vaultDealHolders(room, key);
  });
  s.phase = 'ready';
  s.why = null;
  s.result = null;
  s.nextAt = null;
  vaultEvent(room, { type: 'safe', n: s.safeNo });
  vaultWrite(room);
};

/**
 * Who holds what on a side: { pid: { locks: [i], pages: [unit] } }. Re-dealt at
 * every safe and whenever someone leaves; a lock's progress belongs to the lock
 * (room._vault.prog), so handing it to another phone loses nothing.
 */
const vaultDealHolders = (room, key) => {
  const s = room.shared;
  const side = s.sides[key];
  const kinds = s.locks.map(l => l.k);
  const ids = side.ids;
  const holders = {};
  ids.forEach(id => { holders[id] = { locks: [], pages: [] }; });
  if (s.way === 'all') {
    // Who held what keeps it (someone left: only the leaver's locks go round, each to whoever
    // holds fewest); at a new safe nobody held anything, so it is dealt round the table as ever.
    const prev = side.holders || {};
    const owner = {};
    ids.forEach(id => ((prev[id] || {}).locks || []).forEach(i => { owner[i] = id; }));
    kinds.forEach((k, i) => { if (owner[i]) holders[owner[i]].locks.push(i); });
    kinds.forEach((k, i) => {
      if (owner[i] || !ids.length) return;
      const id = ids.reduce((b, x) => (holders[x].locks.length < holders[b].locks.length ? x : b), ids[0]);
      holders[id].locks.push(i);
    });
    ids.forEach(id => holders[id].locks.sort((x, y) => x - y));
    // Each phone a page for a lock on someone else's phone, every kind of lock covered.
    const present = kinds.filter((k, i) => kinds.indexOf(k) === i);
    const covered = {};
    const own = (id) => holders[id].locks.map(i => kinds[i]);
    // After people leave, a kind can land on every phone (3 left of 9: a dial each), and a holder
    // never reads its own kind's page, so nobody could. Swap one of its locks for another kind's
    // lock on another phone, keeping a swap only when it leaves fewer such kinds.
    const onAll = () => ids.length > 1 ? present.filter(k => ids.every(id => own(id).indexOf(k) !== -1)).length : 0;
    for (let pass = 0; pass < kinds.length && onAll(); pass++) {
      const before = onAll();
      const k = present.find(q => ids.every(id => own(id).indexOf(q) !== -1));
      let done = false;
      ids.forEach(x => ids.forEach(y => {
        if (done || x === y) return;
        const lx = holders[x].locks, ly = holders[y].locks;
        const a = lx.findIndex(i => kinds[i] === k);
        ly.forEach((j, b) => {
          if (done || a === -1 || kinds[j] === k) return;
          const i = lx[a];
          lx[a] = j; ly[b] = i;
          if (onAll() < before) done = true; else { lx[a] = i; ly[b] = j; }
        });
      }));
      if (!done) break;
    }
    ids.forEach((id, n) => {
      const mine = own(id);
      // The lock after mine first (so the pages go round the table), then any kind still uncovered, then any not mine.
      const next = ids.length > 1 ? own(ids[(n + 1) % ids.length]) : [];
      const choices = present.filter(k => mine.indexOf(k) === -1);
      const pick = choices.find(k => !covered[k] && next.indexOf(k) !== -1) || choices.find(k => !covered[k]) || choices.find(k => next.indexOf(k) !== -1) || choices[0];
      if (pick) { holders[id].pages.push(pick); covered[pick] = true; }
    });
    // A kind nobody reads yet (someone left): to whoever doesn't hold that lock, as a second page.
    present.forEach((k) => {
      if (covered[k]) return;
      // Every phone holds one (no swap could help): the phone with the fewest of it reads it, or no one could.
      const id = ids.find(x => own(x).indexOf(k) === -1) ||
        ids.slice().sort((x, y) => own(x).filter(q => q === k).length - own(y).filter(q => q === k).length)[0];
      if (id) { holders[id].pages.push(k); covered[k] = true; }
    });
  } else {
    let opener = side.opener;
    if (opener !== 'tv' && ids.indexOf(opener) === -1) opener = side.opener = ids[0] || null;
    const readers = ids.filter(id => id !== opener);
    if (opener && opener !== 'tv') holders[opener].locks = kinds.map((k, i) => i);
    const units = vaultUnits(kinds, readers.length);
    if (!readers.length && opener && opener !== 'tv') holders[opener].pages = units.slice();   // alone on a side: the lock and the notebook
    else vaultDealUnits(units, readers).forEach((list, n) => { holders[readers[n]].pages = list; });
  }
  side.holders = holders;
};

/** The TV opens the safe and no screen is left in the room. */
const vaultTvGone = (room) => {
  const s = room.shared || {};
  return !!s.tvOpens && s.phase !== 'gameover' && !(room.screens || []).length;
};

/** The TV that held the safe is gone: the side's first phone opens it now. */
const vaultPhoneTakesOver = (room) => {
  const s = room.shared;
  s.tvOpens = false;
  const side = s.sides.x;
  if (side && side.opener === 'tv') {
    side.opener = side.ids[0] || null;
    vaultDealHolders(room, 'x');
  }
};

const vaultOpenLock = (room, key, i, by, now) => {
  const side = room.shared.sides[key];
  side.open[i] = true;
  const v = room._vault;
  if (v.first && v.first[key] === undefined) v.first[key] = i;
  vaultEvent(room, { type: 'open', side: key, i, k: room.shared.locks[i].k, by });
  if (side.open.every(Boolean)) {
    side.done = 'open';
    side.left = vaultLeft(side, now);
    side.at = now;
    side.rate = 0;
  }
};

/** A mistake: a strike (the candle burns faster; the third, the alarm) or time off the candle (15 s, then 30, 45… in one safe). */
const vaultMistake = (room, key, i, by, now) => {
  const s = room.shared;
  const side = s.sides[key];
  side.left = vaultLeft(side, now);
  side.at = now;
  side.mistakes += 1;
  room._vault.prog[key][i].miss += 1;
  let pen = 0;
  if (s.settings.mistakes === 'time') {
    // Each mistake of this safe costs more than the last: 15 s, 30, 45… (side.mistakes starts at 0 every safe).
    pen = vaultPenaltyMs(side.mistakes);
    side.left = Math.max(0, side.left - pen);
  } else {
    side.strikes += 1;
    side.rate = 1 + VAULT_SPEEDUP * side.strikes;
  }
  vaultEvent(room, { type: 'mistake', side: key, i, k: s.locks[i].k, by, n: side.mistakes, pen: pen ? Math.round(pen / 1000) : undefined });
  if (s.settings.mistakes !== 'time' && side.strikes >= VAULT_STRIKES) vaultSideLost(room, key, 'alarm', now);
  else if (side.left <= 0) vaultSideLost(room, key, 'time', now);
};

/** A move that comes after a side's candle has burnt down (before the alarm got to it) ends that
 * side for time first, as the alarm would have (and the safe, if that was the last side): true
 * when a side went out by it. */
const vaultCandlesOut = (room, now) => {
  const s = room.shared;
  let out = false;
  Object.keys(s.sides).forEach((k) => {
    const sd = s.sides[k];
    const end = sd.done ? null : vaultSideDeadline(sd);
    if (end !== null && now >= end) { vaultSideLost(room, k, 'time', now); out = true; }
  });
  if (out) vaultCheckEnd(room, now);
  return out;
};

const vaultSideLost = (room, key, why, now) => {
  const side = room.shared.sides[key];
  if (side.done) return;
  side.done = 'lost';
  side.why = why;
  side.left = vaultLeft(side, now);
  side.at = now;
  side.rate = 0;
  vaultEvent(room, { type: 'lost', side: key, why });
};

/** Is the safe over? A side opened it (in «فريقين», the first wins it), or every side lost. */
const vaultCheckEnd = (room, now) => {
  const s = room.shared;
  if (s.phase !== 'play') return;
  const keys = Object.keys(s.sides);
  const winner = keys.find(k => s.sides[k].done === 'open') || null;
  if (!winner && !keys.every(k => s.sides[k].done)) return;
  keys.forEach((k) => {
    const side = s.sides[k];
    if (!side.done) { side.done = 'beaten'; side.left = vaultLeft(side, now); side.at = now; side.rate = 0; }
  });
  const lost = !winner;
  s.result = { open: !lost, side: winner, why: lost ? (keys.map(k => s.sides[k].why).find(Boolean) || 'time') : null };
  // «ليه كده؟»: each side's locks with a mistake on them or left shut, with what the notebook said.
  const explain = vaultExplainAll(room);
  if (explain) s.result.explain = explain;
  vaultEvent(room, { type: lost ? 'safeLost' : 'safeOpen', side: winner, n: s.safeNo });
  // «المفتاح الاحتياطي»: every third safe a side opens with no mistake hangs a brass key on the line.
  if (winner && s.sides[winner].mistakes === 0) {
    s.clean = s.clean || {}; s.keys = s.keys || {};
    s.clean[winner] = (s.clean[winner] || 0) + 1;
    if (s.clean[winner] % VAULT_KEY_EVERY === 0) {
      s.keys[winner] = (s.keys[winner] || 0) + 1;
      vaultEvent(room, { type: 'key', side: winner, n: s.keys[winner] });
    }
  }
  const between = explain ? VAULT_EXPLAIN_MS : VAULT_BETWEEN_MS;
  if (s.settings.win === 'set') {
    if (!lost) vaultScore(room, winner);
    s.phase = 'result';
    s.nextAt = now + between;
    return;
  }
  // Endless: an opened safe is a level cleared; a lost one ends the game.
  if (lost) { vaultGameOver(room, s.result.why); return; }
  s.levelsWon = s.safeNo;
  vaultSetBest(room);
  s.phase = 'result';
  s.nextAt = now + between;
};

/** «ليه كده؟»: { side: [{ i, …vaultExplainLock }] } for the locks a side slipped on or left shut, or null. */
const vaultExplainAll = (room) => {
  const s = room.shared, v = room._vault;
  if (!v || !v.safe) return null;
  const out = {};
  let any = false;
  Object.keys(s.sides).forEach((key) => {
    const side = s.sides[key];
    const list = [];
    s.locks.forEach((l) => {
      const pr = (v.prog[key] || [])[l.i] || {};
      if (!pr.miss && side.open[l.i]) return;
      const row = typeof pr.row === 'number' ? pr.row : side.mistakes;
      list.push(Object.assign({ i: l.i }, vaultExplainLock(v.manual, v.safe.locks[l.i], v.safe.serial, row)));
    });
    if (list.length) { out[key] = list; any = true; }
  });
  return any ? out : null;
};

/** A set of safes: the points of a safe opened (only an opened safe scores). */
const vaultScore = (room, key) => {
  const s = room.shared;
  const side = s.sides[key];
  const add = (id, n) => { if (id && id !== 'tv') s.scores[id] = (s.scores[id] || 0) + n; };
  if (s.way === 'all') {
    const holderOf = (i) => side.ids.filter(id => side.holders[id] && side.holders[id].locks.indexOf(i) !== -1);
    const readersOf = (k) => side.ids.filter(id => side.holders[id] && side.holders[id].pages.indexOf(k) !== -1);
    const v = room._vault;
    s.locks.forEach((l) => {
      const pts = VAULT_PTS_LOCK + (v.prog[key][l.i].miss ? 0 : VAULT_PTS_LOCK_CLEAN) + ((v.first || {})[key] === l.i ? VAULT_PTS_FIRST : 0);
      holderOf(l.i).forEach(id => add(id, pts));
      readersOf(l.k).forEach(id => add(id, VAULT_PTS_PAGE));
    });
  } else {
    add(side.opener, VAULT_PTS_OPENER);
    side.ids.filter(id => id !== side.opener).forEach(id => add(id, VAULT_PTS_READER));
  }
  if (side.mistakes === 0) side.ids.forEach(id => add(id, VAULT_PTS_CLEAN));
  vaultBoard(room);
};

const vaultBoard = (room) => {
  const s = room.shared;
  s.board = s.roster
    .map(id => ({ id, name: roomPlayerName(room, id), score: s.scores[id] || 0 }))
    .sort((a, b) => b.score - a.score);
};

const vaultSetBest = (room) => {
  const s = room.shared;
  if (s.levelsWon > (room._vaultBest || 0)) { room._vaultBest = s.levelsWon; s.newBest = true; }
  s.best = room._vaultBest || 0;
};

const vaultGameOver = (room, why) => {
  const s = room.shared;
  s.phase = 'gameover';
  s.why = why || null;
  s.nextAt = null;
  if (s.settings.win === 'set') vaultBoard(room);
  else { s.levelsWon = Math.max(s.levelsWon || 0, s.result && s.result.open ? s.safeNo : s.safeNo - 1); vaultSetBest(room); }
  vaultEvent(room, { type: 'over', why: s.why });
  vaultWrite(room);
};

/** After a safe's result: the next safe, or the end of the set. */
const vaultAfterResult = (room) => {
  const s = room.shared;
  if (s.settings.win === 'set' && s.safeNo >= s.total) { vaultGameOver(room, 'done'); return; }
  vaultNewSafe(room);
};

/** What each device is sent: an opener its locks (look and progress), a reader its pages; the TV opener its looks on the screen's slice. */
const vaultWrite = (room) => {
  const s = room.shared, v = room._vault;
  room.secrets = {};
  room.screenOnly = null;
  if (!v || !v.safe || !s || s.phase === 'gameover') return;
  const lockView = (key, i) => {
    const lock = v.safe.locks[i];
    const pr = v.prog[key][i];
    const prog = lock.k === 'wires' ? { cut: pr.cut.slice() } : lock.k === 'symbols' ? { pressed: pr.pressed.slice() } : lock.k === 'lights' ? { n: pr.n } : {};
    return { i, k: lock.k, look: JSON.parse(JSON.stringify(lock.look)), prog };
  };
  Object.keys(s.sides).forEach((key) => {
    const side = s.sides[key];
    Object.keys(side.holders).forEach((pid) => {
      const h = side.holders[pid];
      room.secrets[pid] = {
        side: key,
        safe: s.safeNo,
        locks: h.locks.map(i => lockView(key, i)),
        pages: h.pages.map(u => vaultPageData(v.manual, u))
      };
    });
    if (side.opener === 'tv') room.screenOnly = { side: key, safe: s.safeNo, locks: s.locks.map(l => lockView(key, l.i)) };
  });
};

/** The server's next moment: the card's end, a candle burning out, the next safe. */
const vaultDeadline = (room) => {
  const s = room.shared || {};
  if (room.phase !== 'play' || !room._vault) return null;
  // The TV that opened the safe has gone (a screen leaving never reaches vaultPlayerLeft):
  // look at once, and vaultTimeout hands the safe to a phone (the review of 1 Oct 2026).
  if (vaultTvGone(room)) return Date.now();
  if (s.phase === 'ready') return s.startAt;
  if (s.phase === 'result') return s.nextAt || null;
  if (s.phase !== 'play') return null;
  const times = Object.keys(s.sides).map(k => (s.sides[k].done ? null : vaultSideDeadline(s.sides[k]))).filter(t => typeof t === 'number');
  return times.length ? Math.min.apply(null, times) : null;
};

const vaultTimeout = (room, now) => {
  const s = room.shared || {};
  if (room.phase !== 'play' || !room._vault) return false;
  let changed = false;
  if (vaultTvGone(room)) {
    vaultPhoneTakesOver(room);
    vaultWrite(room);
    changed = true;
  }
  if (s.phase === 'ready') {
    if (now < s.startAt) return changed;
    // The candles light (at = startAt, set with the safe); their ends are in the future.
    s.phase = 'play';
    changed = true;
  }
  if (s.phase === 'result') {
    if (!s.nextAt || now < s.nextAt) return changed;
    vaultAfterResult(room);
    return true;
  }
  if (s.phase === 'play') {
    Object.keys(s.sides).forEach((key) => {
      const side = s.sides[key];
      const end = side.done ? null : vaultSideDeadline(side);
      if (end !== null && now >= end) { vaultSideLost(room, key, 'time', now); changed = true; }
    });
    vaultCheckEnd(room, now);
  }
  if (changed && s.phase !== 'gameover') vaultWrite(room);
  return changed;
};

/**
 * Someone left: they leave their side; what they held - the safe, a lock, a
 * page - is dealt again to who is still there (a lock's progress stays with the
 * lock). A side with nobody left ends the game, and so does a table of one.
 */
const vaultPlayerLeft = (room, playerId) => {
  const s = room.shared, v = room._vault;
  if (!s || !v || room.phase !== 'play') return;
  s.alive = vaultAlive(room).filter(id => id !== playerId);
  if (s.phase === 'gameover') return;
  Object.keys(s.sides).forEach((key) => {
    const side = s.sides[key];
    if (side.ids.indexOf(playerId) === -1) return;
    side.ids = side.ids.filter(id => id !== playerId);
    if (s.teams && s.teams[key]) s.teams[key] = s.teams[key].filter(id => id !== playerId);
    if (side.ids.length) vaultDealHolders(room, key);
  });
  const empty = Object.keys(s.sides).some(k => !s.sides[k].ids.length);
  if (empty || s.alive.length < (s.tvOpens ? 1 : 2)) { vaultGameOver(room, 'left'); return; }
  vaultWrite(room);
};
