/* ============================================================================
   رد الفعل «أسرع إيد» — THE REACTION TEST IN A ROOM, the owner's rules of 2 Oct 2026
   ----------------------------------------------------------------------------
   Every phone (and the TV) is red; at one moment of the server's, nobody knows
   which, every screen turns green and everyone taps. Five rounds; each round
   the fastest three get 3 / 2 / 1, a tap before the green is ✖ for that round.
   A podium after the fifth, and the night's points from it.

   «خدعة» (a lobby switch, on by default): about one round in three a fake
   signal comes before the green - a yellow flash, a 🐱, the word «استنى!» -
   and a tap on it is ✖ («اتضحك عليك!»).

   What is hidden: the green moment and the fakes' moments (which rounds have
   one, when, and what it is). They live in room._reaction, never projected,
   like الكراسي الموسيقية's stop (RoomChairs.js); a fake reaches the phones only
   as it happens (shared.fake), the green only as it happens (shared.greenAt).

   Fair on the network, exactly as the chairs: a tap carries `at`, the phone's
   stamp of the server's time (serverNow / receivedAt). In 'go' the server
   keeps it only inside [the green − REACTION_GRACE_MS, the arrival], no time
   counts under REACTION_MIN_REACT_MS after the green (a changed page could send
   greenAt itself), and taps held to that floor go by arrival. A stamp from
   before the green arriving after it is a tap the phone made on red: ✖.

   Phases (shared.phase):
     wait      red; the green comes at room._reaction.greenAt (a fake may come first)
     go        green since shared.greenAt; taps ranked; closes when everyone
               in has tapped (or is ✖) or REACTION_GO_MS after the green
     result    the round's order and points; the next round at nextAt, or the
               host's nextRound sooner
     gameover  after the fifth: the totals (shared.board), the podium
   Bundled after RoomGames.js (requireHost, requireMoveOn, roomPlayerName,
   staleTap, shuffled). Every name here starts with reaction / REACTION_.
   ========================================================================= */
const REACTION_MIN = 2;
const REACTION_MAX = 12;
const REACTION_ROUNDS = 5;
const REACTION_POINTS = [3, 2, 1];          // the fastest three of a round
const REACTION_WAIT_MS = [2000, 6000];       // red for a random length inside this (the one-phone test's)
const REACTION_WAIT_FAKE_MS = [3200, 6500];  // a round with a fake waits a little longer, so the fake fits
const REACTION_FAKE_MS = 700;               // a fake is on the screens this long
const REACTION_GO_MS = 2500;                // after the green, whoever hasn't tapped has no time this round
const REACTION_BETWEEN_MS = 4500;           // the round's result stays this long before the next
const REACTION_GRACE_MS = 40;               // clock drift a stamp may claim before the green
const REACTION_MIN_REACT_MS = 100;          // no hand is faster: a stamp claiming less counts as this
const REACTION_FAKE_KINDS = ['yellow', 'cat', 'word'];

const reactionRand = (a, b) => a + Math.floor(Math.random() * (b - a + 1));

/** The people in this game still in the room. */
const reactionIn = (room) => (room.shared.roster || []).filter(id => room.players.some(p => p.id === id));

/** Which rounds have a fake: one or two of the five (about one in three), drawn at the start, kept secret. */
const reactionFakePlan = () => {
  const n = Math.random() < 2 / 3 ? 2 : 1;
  return shuffled(Array.from({ length: REACTION_ROUNDS }, (_, i) => i + 1)).slice(0, n);
};

const reactionAction = (room, playerId, action, payload) => {
  if (action === 'start' || action === 'playAgain') {
    requireHost(room, playerId);
    const people = room.players.filter(p => !p.bot).map(p => p.id);
    if (people.length < REACTION_MIN) throw new Error('محتاجين 2 على الأقل');
    const prev = room.shared || {};
    if (action === 'playAgain' && prev.phase !== 'gameover') return;
    const fakes = payload && typeof payload.fakes === 'boolean' ? payload.fakes
      : (prev.settings && typeof prev.settings.fakes === 'boolean' ? prev.settings.fakes : true);
    room.secrets = {};
    room.shared = {
      settings: { fakes },
      roster: people.slice(0, REACTION_MAX),
      rounds: REACTION_ROUNDS,
      round: 0,
      phase: 'result',
      points: {},          // id -> points so far
      best: {},            // id -> the best time of the game (ms)
      history: [],         // [{ round, rows }] every round's result, for the end
      taps: [],
      board: []
    };
    room._reaction = { plan: fakes ? reactionFakePlan() : [], greenAt: 0, fake: null };
    room.shared.board = reactionBoard(room);
    room.phase = 'play';
    reactionStartRound(room, Date.now());
    return;
  }

  const s = room.shared;
  if (!s || room.phase !== 'play') throw new Error('اللعبة لم تبدأ بعد');

  if (action === 'tap') {
    if (staleTap(payload, 'round', s.round)) return;
    if (reactionIn(room).indexOf(playerId) === -1) return;            // watching
    if (s.taps.some(x => x.id === playerId)) return;                   // one tap a round
    const now = Date.now();
    const stamp = payload && typeof payload.at === 'number' && isFinite(payload.at) ? payload.at : null;
    if (s.phase === 'wait') {
      reactionFoul(room, playerId);
      return;
    }
    if (s.phase !== 'go') return;
    // A stamp from before the green arriving after it: tapped while the phone was still red.
    if (stamp !== null && stamp < s.greenAt - REACTION_GRACE_MS && stamp > s.greenAt - REACTION_GO_MS) {
      reactionFoul(room, playerId);
      return;
    }
    let at = stamp === null || stamp > now || stamp < s.greenAt - REACTION_GRACE_MS ? now : stamp;
    at = Math.max(s.greenAt + REACTION_MIN_REACT_MS, Math.min(now, at));
    s.taps.push({ id: playerId, name: roomPlayerName(room, playerId), ms: Math.round(at - s.greenAt), arr: now });
    reactionSortTaps(s);
    if (reactionAllIn(room)) reactionCloseRound(room, now);
    return;
  }
  if (action === 'nextRound') {
    requireMoveOn(room, playerId);
    if (staleTap(payload, 'round', s.round)) return;
    if (s.phase !== 'result') return;
    reactionStartRound(room, Date.now());
    return;
  }
  throw new Error('إجراء غير معروف');
};

/** Fouls (✖) after the times, the times fastest first, level times by arrival. */
const reactionSortTaps = (s) => {
  s.taps.sort((a, b) => (a.ms === null) - (b.ms === null) || (a.ms || 0) - (b.ms || 0) || (a.arr || 0) - (b.arr || 0));
};

/** A tap before the green: ✖ this round; on a fake that was shown, «اتضحك عليك!». */
const reactionFoul = (room, playerId) => {
  const s = room.shared;
  const why = s.fake || s.fakeSeen ? 'fake' : 'early';
  s.taps.push({ id: playerId, name: roomPlayerName(room, playerId), ms: null, foul: why, arr: Date.now() });
  reactionSortTaps(s);
  if (reactionAllIn(room)) reactionCloseRound(room, Date.now());
};

/** Everyone in has tapped (a time or a ✖). */
const reactionAllIn = (room) => {
  const s = room.shared;
  const ids = reactionIn(room);
  return ids.length > 0 && ids.every(id => s.taps.some(x => x.id === id));
};

/** A new round: red now; the green (and a fake, in a round the plan holds) kept on the server. */
const reactionStartRound = (room, now) => {
  const s = room.shared;
  if (reactionIn(room).length < REACTION_MIN) { reactionGameOver(room); return; }
  s.round = (s.round || 0) + 1;
  const h = room._reaction || (room._reaction = { plan: [], greenAt: 0, fake: null });
  const withFake = (h.plan || []).indexOf(s.round) !== -1;
  const span = withFake ? REACTION_WAIT_FAKE_MS : REACTION_WAIT_MS;
  const len = reactionRand(span[0], span[1]);
  h.greenAt = now + len;
  h.fake = withFake ? {
    at: now + reactionRand(1400, len - 1100),
    kind: REACTION_FAKE_KINDS[reactionRand(0, REACTION_FAKE_KINDS.length - 1)],
    shown: false
  } : null;
  s.phase = 'wait';
  s.startAt = now;
  s.greenAt = null;
  s.fake = null;
  s.fakeSeen = false;
  s.taps = [];
  s.rows = [];
  s.nextAt = null;
};

/** The green: on every screen at once, from now. */
const reactionGreen = (room, now) => {
  const s = room.shared;
  s.phase = 'go';
  s.greenAt = now;
  s.fake = null;
};

/** The round closes: the fastest three score 3 / 2 / 1; ✖ and no tap score nothing. */
const reactionCloseRound = (room, now) => {
  const s = room.shared;
  if (s.phase !== 'go' && s.phase !== 'wait') return;
  const h = room._reaction || {};
  if (s.phase === 'wait') {
    // Everyone fouled before the green: the round ends red, its green never shown.
    s.greenAt = null;
  }
  h.greenAt = 0;
  h.fake = null;
  s.fake = null;
  const ids = reactionIn(room);
  ids.forEach(id => { if (!s.taps.some(x => x.id === id)) s.taps.push({ id, name: roomPlayerName(room, id), ms: null, foul: null, arr: now }); });
  reactionSortTaps(s);
  let k = 0;
  s.rows = s.taps.filter(x => ids.indexOf(x.id) !== -1).map(x => {
    const pts = x.ms !== null ? (REACTION_POINTS[k++] || 0) : 0;
    return { id: x.id, name: x.name, ms: x.ms, foul: x.foul || null, pts };
  });
  s.rows.forEach(r => {
    s.points[r.id] = (s.points[r.id] || 0) + r.pts;
    if (r.ms !== null && (s.best[r.id] === undefined || r.ms < s.best[r.id])) s.best[r.id] = r.ms;
  });
  s.history = (s.history || []).concat([{ round: s.round, rows: s.rows }]);
  s.board = reactionBoard(room);
  if (s.round >= (s.rounds || REACTION_ROUNDS)) { reactionGameOver(room); return; }
  s.phase = 'result';
  s.nextAt = now + REACTION_BETWEEN_MS;
};

const reactionGameOver = (room) => {
  const s = room.shared;
  room._reaction = null;
  s.phase = 'gameover';
  s.nextAt = null;
  s.fake = null;
  s.board = reactionBoard(room);
};

/**
 * The game's board: the points, best first, for the people in this game (its roster);
 * level points told apart by the best time of the game (`tie`, boardRowKey), so the night
 * and the podium place them.
 */
const reactionBoard = (room) => {
  const s = room.shared || {};
  const roster = Array.isArray(s.roster) ? s.roster : [];
  return room.players
    .filter(p => roster.indexOf(p.id) !== -1)
    .map(p => {
      const best = (s.best || {})[p.id];
      return { id: p.id, name: p.name, score: (s.points || {})[p.id] || 0, best: best === undefined ? null : best, tie: best === undefined ? null : best };
    })
    .sort((a, b) => (b.score - a.score) || ((a.best === null ? 1e9 : a.best) - (b.best === null ? 1e9 : b.best)));
};

/** The server's next moment: a fake's start or end, the green, the window's close, the next round. */
const reactionDeadline = (room) => {
  const s = room.shared || {};
  if (room.phase !== 'play') return null;
  const h = room._reaction;
  if (s.phase === 'wait') {
    if (!h) return null;
    if (s.fake) return Math.min(s.fake.until, h.greenAt);
    if (h.fake && !h.fake.shown && h.fake.at < h.greenAt) return h.fake.at;
    return h.greenAt;
  }
  if (s.phase === 'go') return (s.greenAt || 0) + REACTION_GO_MS;
  if (s.phase === 'result') return s.nextAt || null;
  return null;
};

const reactionTimeout = (room, now) => {
  const s = room.shared || {};
  if (room.phase !== 'play') return false;
  if (s.phase === 'wait') {
    const h = room._reaction;
    if (!h) return false;
    let moved = false;
    if (s.fake && now >= s.fake.until) { s.fake = null; moved = true; }
    if (h.fake && !h.fake.shown && now >= h.fake.at && now < h.greenAt) {
      h.fake.shown = true;
      s.fake = { kind: h.fake.kind, at: h.fake.at, until: h.fake.at + REACTION_FAKE_MS };
      s.fakeSeen = true;
      moved = true;
      if (now >= s.fake.until) s.fake = null;
    }
    if (now >= h.greenAt) { reactionGreen(room, now); return true; }
    return moved;
  }
  if (s.phase === 'go') {
    if (now < (s.greenAt || 0) + REACTION_GO_MS) return false;
    reactionCloseRound(room, now);
    return true;
  }
  if (s.phase === 'result') {
    if (!s.nextAt || now < s.nextAt) return false;
    reactionStartRound(room, now);
    return true;
  }
  return false;
};

/** Someone left: their tap goes; fewer than two ends the game; a round waiting only on them closes. */
const reactionPlayerLeft = (room, playerId) => {
  const s = room.shared;
  if (!s || room.phase !== 'play' || s.phase === 'gameover') return;
  if (s.taps) s.taps = s.taps.filter(x => x.id !== playerId);
  if (reactionIn(room).length < REACTION_MIN) {
    if (s.phase === 'wait' || s.phase === 'go') { s.taps = []; s.rows = []; }
    reactionGameOver(room);
    return;
  }
  if ((s.phase === 'go' || s.phase === 'wait') && reactionAllIn(room)) reactionCloseRound(room, Date.now());
  s.board = reactionBoard(room);
};
