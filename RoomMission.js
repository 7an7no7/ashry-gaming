/* ============================================================================
   🕵️ المهمة السرية — A SECRET MISSION BESIDE EVERY GAME (1 Oct 2026)
   ----------------------------------------------------------------------------
   Not a game picked from the room's list: a switch on the room, like the chat
   and the night's board, that runs beside whatever the room plays all evening.

   The owner's rules (decided):
   - Off by default. The host turns it on in the room's lobby, picking the PLACE
     (البيت / كافيه أو مطعم / بره / أي حتة) and the COMPANY (العيلة / الصحاب); only
     missions that fit both are dealt (Missions.js), through nextPrompts, so they
     stay fresh across rooms. It runs beside every game until the host turns it off.
   - Each person secretly has a target (another person in the room) and a mission.
     Done, they tap «خلصت»; the target's phone asks «… حصل معاك؟» نعم / لأ.
     Yes: the doer scores 1 and gets a fresh target and mission. No: nothing
     happens, they keep their mission. Nobody is ever out.
   - «غيّرها»: a new mission, once every MISSION_SWAP_MS. «كشفتك!»: name who you
     think works on you - right, you score 1 and they get a new file; wrong,
     nothing, and no more guesses for MISSION_CATCH_WAIT_MS (decided while building).
   - Someone joining later is dealt in; someone leaving drops out, and whoever had
     them as a target gets a new one. Fewer than MISSION_MIN_PEOPLE: paused.
   - Turning it off ends the evening's file: the reveal «مين عمل في مين إيه», the
     champion «أشطر عميل سري», and the ranking banked once on the night's board
     (5 / 3 / 2 / 1, bankNightPoints: decided while building).

   State:
     room.mission   public: on, phase ('on' | 'reveal' | 'off'), place, co, the two
                    options, paused, the score, the names, the last few closed
                    files (the TV's ticker), and at the end the reveal.
     room._mission  private: each person's file { to, m, n, at, swapAt, asked }, the
                    open asks, the wrong guesses' times, the log for the reveal.
   A phone's own file and the asks waiting on it reach it through missionView
   (rooms-worker/src/view.js), never anyone else's. Bots and screens take no part.
   No clocks: the waits are times compared when a tap comes.
   ========================================================================== */

const MISSION_MIN_PEOPLE = 3;
const MISSION_SWAP_MS = 10 * 60 * 1000;      // «غيّرها»: the owner's "once every 10 minutes"
const MISSION_CATCH_WAIT_MS = 5 * 60 * 1000; // after a wrong «كشفتك!» (decided while building)
const MISSION_FEED_MAX = 5;                  // closed files the ticker keeps
const MISSION_LOG_MAX = 120;                 // what the reveal tells
const MISSION_EVENT_ACTIONS = ['missionSet', 'missionClose', 'missionDone', 'missionCancel', 'missionSeen', 'missionAnswer', 'missionSwap', 'missionCatch'];

/** The people who take part: players who aren't computer players. */
const missionPeople = (room) => (room.players || []).filter(p => !p.bot);
const missionName = (room, id) => {
  const p = (room.players || []).find(x => x.id === id);
  return p ? p.name : ((room.mission && room.mission.names && room.mission.names[id]) || '');
};
const missionLive = (room) => !!(room.mission && room.mission.on && room.mission.phase === 'on');
const missionHidden = (room) => {
  room._mission = room._mission || {};
  const h = room._mission;
  h.of = h.of || {}; h.asks = h.asks || []; h.wrongAt = h.wrongAt || {}; h.log = h.log || []; h.caught = h.caught || {};
  return h;
};

/** A target for `pid`: the person aimed at by the fewest others, not `avoid` when there is a choice. */
const missionPickTarget = (room, pid, avoid) => {
  const h = missionHidden(room);
  const others = missionPeople(room).map(p => p.id).filter(id => id !== pid);
  if (!others.length) return null;
  const fresh = others.filter(id => id !== avoid);
  const pool = fresh.length ? fresh : others;
  const aimed = {};
  Object.keys(h.of).forEach(k => { if (k !== pid && h.of[k]) aimed[h.of[k].to] = (aimed[h.of[k].to] || 0) + 1; });
  const least = Math.min(...pool.map(id => aimed[id] || 0));
  const best = pool.filter(id => (aimed[id] || 0) === least);
  return best[Math.floor(Math.random() * best.length)];
};

/** A mission id for this room's place and company, fresh across rooms, not `avoid`. */
const missionPickId = (room, avoid) => {
  const m = room.mission;
  const pool = missionPool(m.place, m.co);
  if (!pool.length) throw new Error('مفيش مهمات للمكان ده');
  const taken = {};
  Object.values(missionHidden(room).of).forEach(f => { if (f) taken[f.m] = true; });
  // A couple of tries for one nobody holds now and not the one just had.
  let id = nextPrompt(room, pool, 'mission_' + m.place + '_' + m.co);
  for (let k = 0; k < 3 && (id === avoid || taken[id]) && pool.length > 2; k++) id = nextPrompt(room, pool, 'mission_' + m.place + '_' + m.co);
  return id;
};

/** A new file for `pid`: a target (kept when `keepTo`) and a mission. */
const missionDeal = (room, pid, opts) => {
  const h = missionHidden(room);
  const old = h.of[pid] || null;
  const o = opts || {};
  const to = o.keepTo && old && old.to ? old.to : missionPickTarget(room, pid, old ? old.to : (o.avoid || null));
  if (!to) { delete h.of[pid]; return; }
  room.mission.fileSeq = (room.mission.fileSeq || 0) + 1;
  h.of[pid] = { to: to, m: missionPickId(room, old ? old.m : null), n: room.mission.fileSeq, at: Date.now(), swapAt: old ? old.swapAt || 0 : 0, asked: false };
  h.asks = h.asks.filter(a => a.by !== pid);
};

/**
 * Keeps every file valid after anything that changed who is here: the names, a
 * pause below MISSION_MIN_PEOPLE, a file for whoever has none, a new target for a
 * file aimed at someone gone (its mission kept), and no ask to or from someone gone.
 */
const missionFill = (room) => {
  const m = room.mission;
  if (!m || !m.on || m.phase !== 'on') return;
  const h = missionHidden(room);
  const people = missionPeople(room);
  const ids = people.map(p => p.id);
  m.names = m.names || {};
  people.forEach(p => { m.names[p.id] = p.name; });
  m.score = m.score || {};
  Object.keys(h.of).forEach(id => { if (ids.indexOf(id) === -1) delete h.of[id]; });
  h.asks = h.asks.filter(a => ids.indexOf(a.by) !== -1 && ids.indexOf(a.to) !== -1 && h.of[a.by] && h.of[a.by].to === a.to);
  m.paused = ids.length < MISSION_MIN_PEOPLE;
  ids.forEach(id => {
    const f = h.of[id];
    if (f && (f.to === id || ids.indexOf(f.to) === -1)) {
      const to = missionPickTarget(room, id, f.to);
      if (to) { f.to = to; f.asked = false; room.mission.fileSeq = (room.mission.fileSeq || 0) + 1; f.n = room.mission.fileSeq; }
      else delete h.of[id];
    }
  });
  if (m.paused) return;
  ids.forEach(id => {
    if (!(id in m.score)) m.score[id] = 0;
    if (!h.of[id]) missionDeal(room, id);
  });
};

/** One line on the TV's ticker (and the phones' toast). */
const missionFeed = (room, entry) => {
  const m = room.mission;
  m.feedSeq = (m.feedSeq || 0) + 1;
  m.feed = (m.feed || []).concat([Object.assign({ seq: m.feedSeq, at: Date.now() }, entry)]).slice(-MISSION_FEED_MAX);
};
const missionLog = (room, entry) => {
  const h = missionHidden(room);
  h.log = h.log.concat([Object.assign({ at: Date.now() }, entry)]).slice(-MISSION_LOG_MAX);
};

/** The end of the evening's file: the story, the champion, the night's points once. */
const missionEnd = (room) => {
  const m = room.mission;
  const h = missionHidden(room);
  const score = m.score || {};
  const ids = Object.keys(score);
  const rows = ids.map(id => ({ id: id, name: missionName(room, id), score: score[id] || 0 }))
    .sort((a, b) => b.score - a.score);
  const top = rows.length && rows[0].score > 0 ? rows[0].score : 0;
  const open = Object.keys(h.of).map(id => ({ k: 'open', by: id, to: h.of[id].to, m: h.of[id].m, at: h.of[id].at }));
  m.reveal = {
    at: Date.now(),
    story: h.log.slice(),
    open: open,
    table: rows,
    champs: top ? rows.filter(r => r.score === top).map(r => r.id) : [],
    caughtBy: Object.assign({}, h.caught)
  };
  // The night's board, once: as any game banks it (bankNightPoints) - but the room may be
  // in the middle of a game, whose roster must not filter the mission's rows.
  if (!m.banked && rows.length >= 2 && top > 0) {
    const keep = { game: room.game, shared: room.shared };
    room.game = null; room.shared = {};
    try { bankNightPoints(room, rows); } finally { room.game = keep.game; room.shared = keep.shared; }
    m.banked = true;
  }
  m.on = false;
  m.phase = 'reveal';
  m.paused = false;
  room._mission = null;
  roomEvent(room, 'missionEnd', { names: m.reveal.champs.map(id => missionName(room, id)).join('، ') });
};

/**
 * The room-level actions. True when `action` was one of them (handled or refused
 * by throwing). Reached from applyRoomAction before any game's own.
 */
const missionAction = (room, pid, action, payload) => {
  if (MISSION_EVENT_ACTIONS.indexOf(action) === -1) return false;
  const p = payload || {};
  const now = Date.now();

  if (action === 'missionSet') {
    requireHost(room, pid);
    const place = MISSION_PLACES.indexOf(p.place) !== -1 ? p.place : ((room.mission && room.mission.place) || 'home');
    const co = MISSION_COMPANIES.indexOf(p.co) !== -1 ? p.co : ((room.mission && room.mission.co) || 'family');
    const swap = p.swap === undefined ? !(room.mission && room.mission.swap === false) : !!p.swap;
    const catchOn = p.catch === undefined ? !(room.mission && room.mission.catch === false) : !!p.catch;
    const on = p.on === undefined ? !!(room.mission && room.mission.on) : !!p.on;
    const was = room.mission && room.mission.on && room.mission.phase === 'on';
    if (!on) {
      if (was) missionEnd(room);
      else if (room.mission) { room.mission.place = place; room.mission.co = co; room.mission.swap = swap; room.mission.catch = catchOn; }
      return true;
    }
    if (!was) {
      // A fresh evening's file (after a reveal too): scores start at nothing.
      room.mission = { on: true, phase: 'on', place: place, co: co, swap: swap, catch: catchOn, paused: false,
        score: {}, names: {}, feed: [], feedSeq: 0, fileSeq: 0, startedAt: now, banked: false, reveal: null };
      room._mission = null;
      missionHidden(room);
      missionFill(room);
      roomEvent(room, 'missionOn', {});
      return true;
    }
    // Already on: a new place or company redeals only the missions that no longer fit (targets kept).
    const m = room.mission;
    m.place = place; m.co = co; m.swap = swap; m.catch = catchOn;
    const h = missionHidden(room);
    Object.keys(h.of).forEach(id => {
      if (!missionFits(missionById(h.of[id].m), place, co)) missionDeal(room, id, { keepTo: true });
    });
    missionFill(room);
    return true;
  }

  if (action === 'missionClose') {
    requireHost(room, pid);
    const m = room.mission;
    if (!m || m.phase !== 'reveal') return true;
    room.mission = { on: false, phase: 'off', place: m.place, co: m.co, swap: m.swap, catch: m.catch };
    room._mission = null;
    return true;
  }

  // Everything else is a person's move in a running file.
  const me = missionPeople(room).find(x => x.id === pid);
  if (!missionLive(room)) throw new Error('المهمة السرية مش شغّالة');
  if (!me) throw new Error('المهمة السرية للاعبين بس');
  if (room.mission.paused) throw new Error('المهمة السرية واقفة لحد ما تبقوا ' + MISSION_MIN_PEOPLE);
  const h = missionHidden(room);
  const file = h.of[pid];

  if (action === 'missionDone') {
    if (!file) throw new Error('مفيش ملف معاك دلوقتي');
    if (staleTap(p, 'n', file.n)) return true;
    if (h.asks.some(a => a.by === pid)) return true;          // already sent: a double tap
    room.mission.askSeq = (room.mission.askSeq || 0) + 1;
    h.asks.push({ id: room.mission.askSeq, by: pid, to: file.to, m: file.m, n: file.n, at: now });
    file.asked = true;
    return true;
  }

  if (action === 'missionCancel') {
    // «اسحبه»: taken back before the target's phone showed the memo (missionSeen), the target
    // never learnt who was after them, so they can still catch you (the review of 1 Oct 2026).
    const mine = h.asks.filter(a => a.by === pid);
    h.asks = h.asks.filter(a => a.by !== pid);
    if (file && mine.length && !mine.some(a => a.seen)) file.asked = false;
    return true;
  }

  if (action === 'missionSeen') {
    // The target's phone has put the memo on the screen: from now on they know.
    const ask = h.asks.find(a => String(a.id) === String(p.id));
    if (ask && ask.to === pid) ask.seen = true;
    return true;
  }

  if (action === 'missionAnswer') {
    const ask = h.asks.find(a => String(a.id) === String(p.id));
    if (!ask) return true;                                    // already answered, or taken back
    if (ask.to !== pid) throw new Error('السؤال ده مش ليك');
    h.asks = h.asks.filter(a => a !== ask);
    const theirs = h.of[ask.by];
    if (!theirs || theirs.n !== ask.n) return true;           // their file moved on meanwhile
    if (!p.yes) { theirs.no = ask.id; return true; }
    room.mission.score[ask.by] = (room.mission.score[ask.by] || 0) + 1;
    missionLog(room, { k: 'done', by: ask.by, to: ask.to, m: ask.m });
    missionFeed(room, { k: 'done', by: ask.by, to: ask.to, m: ask.m });
    missionDeal(room, ask.by, { avoid: ask.to });
    h.of[ask.by].won = ask.id;
    return true;
  }

  if (action === 'missionSwap') {
    if (room.mission.swap === false) throw new Error('«غيّرها» مقفولة في الغرفة دي');
    if (!file) throw new Error('مفيش ملف معاك دلوقتي');
    if (staleTap(p, 'n', file.n)) return true;
    if (h.asks.some(a => a.by === pid)) throw new Error('استنى الهدف يرد الأول');
    if (file.swapAt && now - file.swapAt < MISSION_SWAP_MS) throw new Error('«غيّرها» مرة كل ١٠ دقايق');
    missionDeal(room, pid, { keepTo: true });
    h.of[pid].swapAt = now;
    return true;
  }

  if (action === 'missionCatch') {
    if (room.mission.catch === false) throw new Error('«كشفتك!» مقفولة في الغرفة دي');
    const who = String(p.who || '');
    if (who === pid || !missionPeople(room).some(x => x.id === who)) throw new Error('مش في الغرفة');
    if (h.wrongAt[pid] && now - h.wrongAt[pid] < MISSION_CATCH_WAIT_MS) throw new Error('استنى شوية قبل ما تكشف حد تاني');
    const theirs = h.of[who];
    room.mission.catchSeq = (room.mission.catchSeq || 0) + 1;
    if (theirs && theirs.to === pid) {
      // Asked you already about this very mission: they showed you their hand themselves, so it
      // doesn't count - refused as an ordinary wrong guess, so it says nothing either (the review of 1 Oct 2026).
      if (theirs.asked) {
        h.wrongAt[pid] = now;
        h.lastCatch = h.lastCatch || {};
        h.lastCatch[pid] = { seq: room.mission.catchSeq, who: who, ok: false };
        return true;
      }
      room.mission.score[pid] = (room.mission.score[pid] || 0) + 1;
      h.caught[who] = (h.caught[who] || 0) + 1;
      missionLog(room, { k: 'catch', by: pid, to: who, m: theirs.m });
      missionFeed(room, { k: 'catch', by: pid, to: who });
      missionDeal(room, who, { avoid: pid });
      h.of[who].busted = room.mission.catchSeq;
      h.wrongAt[pid] = 0;
      h.lastCatch = h.lastCatch || {};
      h.lastCatch[pid] = { seq: room.mission.catchSeq, who: who, ok: true };
    } else {
      h.wrongAt[pid] = now;
      h.lastCatch = h.lastCatch || {};
      h.lastCatch[pid] = { seq: room.mission.catchSeq, who: who, ok: false };
    }
    return true;
  }
  return true;
};

/** A phone joined (room.js join) or a screen became a player: dealt in. */
const missionJoined = (room) => { missionFill(room); };

/** A phone left (room.js removeDevice): its file goes, files aimed at it get a new target. */
const missionPlayerLeft = (room) => { missionFill(room); };

/**
 * What one device is sent of the mission (view.js): the public part, and for a
 * person in it, their own file, the asks waiting on them and the answers to theirs.
 * A screen gets the public part only.
 */
const missionView = (room, pid) => {
  const m = room.mission;
  if (!m) return null;
  const out = {
    on: !!m.on, phase: m.phase || 'off', place: m.place, co: m.co,
    swap: m.swap !== false, catch: m.catch !== false, paused: !!m.paused,
    score: m.score || {}, names: m.names || {}, feed: m.feed || [], startedAt: m.startedAt || 0,
    reveal: m.reveal || null, me: null, asks: []
  };
  if (!missionLive(room) || !(room.players || []).some(p => p.id === pid && !p.bot)) return out;
  const h = room._mission || {};
  const f = (h.of || {})[pid];
  const lc = (h.lastCatch || {})[pid] || null;
  const wrong = (h.wrongAt || {})[pid] || 0;
  out.me = f ? {
    to: f.to, m: f.m, n: f.n,
    swapAt: f.swapAt ? f.swapAt + MISSION_SWAP_MS : 0,
    catchAt: wrong ? wrong + MISSION_CATCH_WAIT_MS : 0,
    waiting: (h.asks || []).some(a => a.by === pid),
    no: f.no || 0, won: f.won || 0, busted: f.busted || 0,
    caught: lc
  } : { to: null, m: null, n: 0, catchAt: wrong ? wrong + MISSION_CATCH_WAIT_MS : 0, caught: lc };
  out.asks = (h.asks || []).filter(a => a.to === pid).map(a => ({ id: a.id, by: a.by, m: a.m }));
  return out;
};
