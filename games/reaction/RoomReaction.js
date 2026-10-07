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

   The ideas of 7 Oct 2026 (the owner's picks):
   - «ركّز!» (875, settings.focus): no red and green. The pad shows a colour word
     written in another colour («أحمر» in green), a new one every 0.7-1.1 s, and
     the green is the moment the word and its colour agree (shared.word, the
     match). A tap on a word that doesn't agree is ✖ «اتضحك عليك!», as a fake is
     (fakeSeen from the start); the classic fakes are off in this way. What is
     still to come (the words and the match's moment) stays in room._reaction.
   - «خروج المغلوب» (877, settings.mode 'knockout'): each round the worst one is
     out (a ✖ first - the earliest - else whoever didn't tap, else the slowest
     time), shared.alive / outRound / lastOut, until two are left: then a final,
     the best of three (shared.final { ids, wins }, the faster valid time takes
     the round; nobody with a time: the round doesn't count). No points; the
     board ranks by how long each one lasted (the winner, the runner-up, then
     who went out last), level by the best time.

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
// «ركّز!» (875): the colours a word names and is written in, a word's time on the pad, how many
// words that don't agree come before the one that does.
const REACTION_FOCUS_COLOURS = ['red', 'green', 'blue', 'yellow'];
const REACTION_FOCUS_STEP_MS = [700, 1100];
const REACTION_FOCUS_MISSES = [2, 5];
const REACTION_MODES = ['points', 'knockout'];
const REACTION_KO_WINS = 2;                  // the final is the best of three

const reactionRand = (a, b) => a + Math.floor(Math.random() * (b - a + 1));

/** The people in this game still in the room. */
const reactionIn = (room) => (room.shared.roster || []).filter(id => room.players.some(p => p.id === id));
const reactionKo = (s) => !!(s && s.settings && s.settings.mode === 'knockout');
/** Who plays this round: everyone in, or in «خروج المغلوب» everyone still standing. */
const reactionPlaying = (room) => {
  const s = room.shared;
  const ids = reactionIn(room);
  return reactionKo(s) ? ids.filter(id => (s.alive || []).indexOf(id) !== -1) : ids;
};

/** «ركّز!»: a colour word written in another colour (never the same as the last one shown). */
const reactionMiss = (last) => {
  for (let i = 0; i < 20; i++) {
    const w = REACTION_FOCUS_COLOURS[reactionRand(0, REACTION_FOCUS_COLOURS.length - 1)];
    const others = REACTION_FOCUS_COLOURS.filter(c => c !== w);
    const ink = others[reactionRand(0, others.length - 1)];
    if (!last || last.w !== w || last.ink !== ink) return { w, ink };
  }
  return { w: 'red', ink: 'blue' };
};

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
    // Every option from the payload when it is a valid one, else the last game's, else the default
    // (an older phone sends only fakes).
    const was = prev.settings || {};
    const flag = (k, d) => (payload && typeof payload[k] === 'boolean' ? payload[k] : typeof was[k] === 'boolean' ? was[k] : d);
    const focus = flag('focus', false);
    // «ركّز!» has its own fakes (the words that don't agree): the classic ones are off with it.
    const fakes = focus ? false : flag('fakes', true);
    const mode = payload && REACTION_MODES.indexOf(payload.mode) !== -1 ? payload.mode
      : (REACTION_MODES.indexOf(was.mode) !== -1 ? was.mode : 'points');
    const roster = people.slice(0, REACTION_MAX);
    room.secrets = {};
    room.shared = {
      settings: { fakes, focus, mode },
      roster,
      rounds: mode === 'knockout' ? null : REACTION_ROUNDS,
      round: 0,
      phase: 'result',
      points: {},          // id -> points so far
      best: {},            // id -> the best time of the game (ms)
      history: [],         // [{ round, rows }] every round's result, for the end
      taps: [],
      board: []
    };
    if (mode === 'knockout') {
      room.shared.alive = roster.slice();
      room.shared.outRound = {};
      room.shared.final = roster.length === 2 ? { ids: roster.slice(), wins: {} } : null;
    }
    room._reaction = { plan: fakes && mode !== 'knockout' ? reactionFakePlan() : [], greenAt: 0, fake: null, words: [], match: null };
    room.shared.board = reactionBoard(room);
    room.phase = 'play';
    reactionStartRound(room, Date.now());
    return;
  }

  const s = room.shared;
  if (!s || room.phase !== 'play') throw new Error('اللعبة لم تبدأ بعد');

  if (action === 'tap') {
    if (staleTap(payload, 'round', s.round)) return;
    if (reactionPlaying(room).indexOf(playerId) === -1) return;       // watching (or out, in «خروج المغلوب»)
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
  const ids = reactionPlaying(room);
  return ids.length > 0 && ids.every(id => s.taps.some(x => x.id === id));
};

/** A new round: red now; the green (and a fake, in a round the plan holds) kept on the server. */
const reactionStartRound = (room, now) => {
  const s = room.shared;
  if (reactionPlaying(room).length < REACTION_MIN) { reactionGameOver(room); return; }
  s.round = (s.round || 0) + 1;
  const h = room._reaction || (room._reaction = { plan: [], greenAt: 0, fake: null, words: [], match: null });
  const settings = s.settings || {};
  s.phase = 'wait';
  s.startAt = now;
  s.greenAt = null;
  s.fake = null;
  s.fakeSeen = false;
  s.word = null;
  s.lastOut = null;
  s.lastWin = null;
  s.taps = [];
  s.rows = [];
  s.nextAt = null;
  h.fake = null;
  h.words = [];
  h.match = null;
  if (settings.focus) {
    // «ركّز!»: two to five words that don't agree, one shown now and the rest kept here with their
    // moments; then the one that agrees, which is the green. Any tap before it is fooled.
    const n = reactionRand(REACTION_FOCUS_MISSES[0], REACTION_FOCUS_MISSES[1]);
    let at = now, last = null;
    for (let i = 0; i < n; i++) {
      last = Object.assign(reactionMiss(last), { at, n: i });
      h.words.push(last);
      at += reactionRand(REACTION_FOCUS_STEP_MS[0], REACTION_FOCUS_STEP_MS[1]);
    }
    const c = REACTION_FOCUS_COLOURS[reactionRand(0, REACTION_FOCUS_COLOURS.length - 1)];
    h.match = { w: c, ink: c, n };
    h.greenAt = at;
    const first = h.words.shift();
    s.word = { w: first.w, ink: first.ink, n: first.n };
    s.fakeSeen = true;
    return;
  }
  // In «خروج المغلوب» the rounds aren't counted ahead, so a fake is drawn round by round (one in three).
  const withFake = reactionKo(s) ? !!settings.fakes && Math.random() < 1 / 3 : (h.plan || []).indexOf(s.round) !== -1;
  const span = withFake ? REACTION_WAIT_FAKE_MS : REACTION_WAIT_MS;
  const len = reactionRand(span[0], span[1]);
  h.greenAt = now + len;
  h.fake = withFake ? {
    at: now + reactionRand(1400, len - 1100),
    kind: REACTION_FAKE_KINDS[reactionRand(0, REACTION_FAKE_KINDS.length - 1)],
    shown: false
  } : null;
};

/** The green: on every screen at once, from now («ركّز!»: the word that agrees, from now). */
const reactionGreen = (room, now) => {
  const s = room.shared;
  const h = room._reaction || {};
  s.phase = 'go';
  s.greenAt = now;
  s.fake = null;
  if (h.match) { s.word = h.match; h.match = null; h.words = []; }
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
  h.words = [];
  h.match = null;
  s.fake = null;
  const ko = reactionKo(s);
  const ids = reactionPlaying(room);
  ids.forEach(id => { if (!s.taps.some(x => x.id === id)) s.taps.push({ id, name: roomPlayerName(room, id), ms: null, foul: null, arr: now }); });
  reactionSortTaps(s);
  let k = 0;
  s.rows = s.taps.filter(x => ids.indexOf(x.id) !== -1).map(x => {
    const pts = !ko && x.ms !== null ? (REACTION_POINTS[k++] || 0) : 0;
    return { id: x.id, name: x.name, ms: x.ms, foul: x.foul || null, pts };
  });
  s.rows.forEach(r => {
    s.points[r.id] = (s.points[r.id] || 0) + r.pts;
    if (r.ms !== null && (s.best[r.id] === undefined || r.ms < s.best[r.id])) s.best[r.id] = r.ms;
  });
  if (ko && reactionKoSettle(room)) {
    s.history = (s.history || []).concat([{ round: s.round, rows: s.rows }]);
    reactionGameOver(room);
    return;
  }
  s.history = (s.history || []).concat([{ round: s.round, rows: s.rows }]);
  s.board = reactionBoard(room);
  if (!ko && s.round >= (s.rounds || REACTION_ROUNDS)) { reactionGameOver(room); return; }
  s.phase = 'result';
  s.nextAt = now + REACTION_BETWEEN_MS;
};

/**
 * «خروج المغلوب» after a round (877). Before the final: the worst one goes out - a ✖ first (the
 * earliest, who fell for it first), else whoever didn't tap (one at random), else the slowest time -
 * and with two left the final begins. In the final (best of three) the faster valid time takes the
 * round; a round with no valid time doesn't count. Marks the row that went out (`out`) or won
 * (`win`). Returns true when the game is over.
 */
const reactionKoSettle = (room) => {
  const s = room.shared;
  const rows = s.rows || [];
  if (s.final) {
    const w = rows.length && rows[0].ms !== null && s.final.ids.indexOf(rows[0].id) !== -1 ? rows[0].id : null;
    s.lastWin = w;
    if (w) {
      s.final.wins[w] = (s.final.wins[w] || 0) + 1;
      rows[0].win = true;
      if (s.final.wins[w] >= REACTION_KO_WINS) { s.final.winner = w; return true; }
    }
    return false;
  }
  const fouls = rows.filter(r => r.foul), none = rows.filter(r => r.ms === null && !r.foul), timed = rows.filter(r => r.ms !== null);
  const worst = fouls.length ? fouls[0] : none.length ? none[reactionRand(0, none.length - 1)] : timed[timed.length - 1];
  if (!worst) return false;
  worst.out = true;
  s.lastOut = worst.id;
  s.alive = (s.alive || []).filter(id => id !== worst.id);
  s.outRound[worst.id] = s.round;
  const left = reactionPlaying(room);
  if (left.length === 2) s.final = { ids: left.slice(), wins: {} };
  return left.length < 2;
};

const reactionGameOver = (room) => {
  const s = room.shared;
  room._reaction = null;
  s.phase = 'gameover';
  s.nextAt = null;
  s.fake = null;
  s.word = null;
  s.board = reactionBoard(room);
};

/** How long each one lasted in «خروج المغلوب» (the board's score): the round they went out in; the
    runner-up one more than the last round, the winner two more (someone still standing when the game
    ended by a leave: one more). */
const reactionKoScore = (s, id) => {
  const top = (s.round || 0) + 1;
  const f = s.final;
  if (f && f.winner) return id === f.winner ? top + 1 : f.ids.indexOf(id) !== -1 ? top : (s.outRound[id] || 0);
  return (s.alive || []).indexOf(id) !== -1 ? top : ((s.outRound || {})[id] || 0);
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
      const score = reactionKo(s) ? reactionKoScore(s, p.id) : (s.points || {})[p.id] || 0;
      return { id: p.id, name: p.name, score, best: best === undefined ? null : best, tie: best === undefined ? null : best };
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
    if (h.words && h.words.length) return Math.min(h.words[0].at, h.greenAt);
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
    // «ركّز!»: the next word that doesn't agree, as its moment comes (the latest one due).
    while (h.words && h.words.length && now >= h.words[0].at && now < h.greenAt) {
      const w = h.words.shift();
      s.word = { w: w.w, ink: w.ink, n: w.n };
      moved = true;
    }
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
  // «خروج المغلوب»: a finalist who leaves hands the final to the other.
  if (reactionKo(s) && s.final && s.final.ids.indexOf(playerId) !== -1 && !s.final.winner) {
    const other = s.final.ids.find(id => id !== playerId);
    if (other && reactionIn(room).indexOf(other) !== -1) {
      s.final.winner = other;
      s.alive = (s.alive || []).filter(id => id !== playerId);
      if (s.phase === 'wait' || s.phase === 'go') { s.taps = []; s.rows = []; }
      reactionGameOver(room);
      return;
    }
  }
  if (reactionPlaying(room).length < REACTION_MIN) {
    if (s.phase === 'wait' || s.phase === 'go') { s.taps = []; s.rows = []; }
    reactionGameOver(room);
    return;
  }
  // «خروج المغلوب»: down to two by a leave, the final begins (from the next round).
  if (reactionKo(s) && !s.final && reactionPlaying(room).length === 2) {
    s.alive = reactionPlaying(room);
    s.final = { ids: s.alive.slice(), wins: {} };
  }
  if ((s.phase === 'go' || s.phase === 'wait') && reactionAllIn(room)) reactionCloseRound(room, Date.now());
  if (room.shared.phase !== 'gameover') s.board = reactionBoard(room);
};
