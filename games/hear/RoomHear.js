/* ============================================================================
   ارسم اللي بتسمعه — DRAW WHAT YOU HEAR (rooms), the owner's rules of 1 Oct 2026
   ----------------------------------------------------------------------------
   Each round one player describes (in turn) and everyone else draws. The
   describer's phone shows a picture the app made (Hear.js: shapes on a 3 x 3
   board, or a simple drawing built of shapes), and only theirs: they describe
   it out loud, no pointing, no questions, and never see the drawings while
   the clock runs. Then the app grades every drawing against the picture (a %),
   the three closest take 3 / 2 / 1, every drawing at 50% or more +1, a drawer
   who beats their own last % «اتحسنت» +1 (the owner, 2 Oct 2026), the
   describer a point for every 20% of the drawers' average (at most 3), and the
   table votes «أغرب رسمة» (never your own) for +1. Everyone describes once (or twice, the host's pick); the board
   at the end, the night's points through it.

   What is hidden (never in shared until the grading):
     room._hear.pic     the picture; the describer's slice has it
                        (room.secrets[describer].pic) while they look and talk
     room._hear.ink     every drawing, kept as each phone sends it; no phone
                        is ever sent another's (nor its own back) before the
                        grading publishes them all
     room._ballots      the «أغرب رسمة» votes (the voting engine's)

   Phases (shared.phase):
     ready    the describer looks (and may ask for another picture, HEAR_SWAPS
              times) and taps «يلا» when the table is listening
     draw     the clock (endsAt); the describer's «خلّصت» cuts it to
              HEAR_CUT_MS; a drawer's «سلّمت» hands their page in; all handed
              in: graded at once
     collect  time's up: HEAR_COLLECT_MS for the phones to send the last lines
     grade    the picture and every drawing with its %, the places and the
              points (gradeEndsAt, then the vote opens; the host may open it)
     vote     «أغرب رسمة» until all voted or voteEndsAt
     result   the weirdest and the round's points; the host's nextRound
     gameover the board
   Bundled after RoomGames.js (requireHost, requireMoveOn, staleTap, shuffled,
   nextPrompts, cleanStrokes, openVote, castVote, closeVote, voteDropPlayer,
   addScore, roomPlayerName). Every name here starts with hear / HEAR_.
   ========================================================================= */
const HEAR_LEAD_MS = 400;        // the clock starts as the "go" reaches the phones
const HEAR_GRACE_MS = 800;       // the server's moment after the phones' own clock
const HEAR_COLLECT_MS = 2500;    // time's up: the phones send what they drew
const HEAR_GRADE_BASE_MS = 6000; // the grading on every screen before the vote opens,
const HEAR_GRADE_EACH_MS = 600;  // and this much more a drawing,
const HEAR_GRADE_MAX_MS = 13000; // at most
const HEAR_VOTE_MS = 45000;      // «أغرب رسمة»

const hearHere = (room, id) => room.players.some(p => p.id === id);
const hearPresent = (room) => ((room.shared || {}).roster || []).filter(id => hearHere(room, id));

const hearAction = (room, playerId, action, payload) => {
  if (action === 'start' || action === 'playAgain') {
    requireHost(room, playerId);
    const people = room.players.filter(p => !p.bot).map(p => p.id);
    if (people.length < HEAR_MIN) throw new Error('محتاجين 3 لاعبين على الأقل');
    const prev = room.shared || {};
    if (action === 'playAgain' && prev.phase !== 'gameover') return;
    const pay = payload || {};
    const pickOf = (list, v, old, dflt) => list.indexOf(v) !== -1 ? v : (list.indexOf(old) !== -1 ? old : dflt);
    const seconds = pickOf(HEAR_SECONDS, Number(pay.seconds), prev.seconds, HEAR_SECONDS_DEFAULT);
    const kind = pickOf(HEAR_KINDS, pay.kind, prev.kind, 'mix');
    const level = pickOf(HEAR_LEVELS, pay.level, prev.level, 'mid');
    const laps = pickOf(HEAR_LAPS, Number(pay.laps), prev.laps, 1);
    const roster = people.slice(0, HEAR_MAX);
    const order = shuffled(roster);
    room.secrets = {};
    room._hear = null;
    room._ballots = null;
    room.shared = {
      roster,
      order,                       // who describes, in turn; round k is order[k % n], around `laps` times
      turn: -1,
      round: 0,
      rounds: order.length * laps,
      laps, seconds, kind, level,
      scores: {},
      gained: {},
      lastPct: {},                 // each drawer's % from the last drawing they made («اتحسنت»)
      board: [],
      history: [],
      phase: 'ready'
    };
    room.phase = 'play';
    hearStartRound(room);
    return;
  }

  const s = room.shared;
  if (!s || room.phase !== 'play') throw new Error('اللعبة لم تبدأ بعد');
  if (s.phase === 'gameover') return;
  const pay = payload || {};
  // Every move but the start says which round it was made in: a tap from the round before does nothing.
  if (staleTap(pay, 'round', s.round)) return;

  if (action === 'swap') {
    if (s.phase !== 'ready' || playerId !== s.describerId || (s.swaps || 0) >= HEAR_SWAPS) return;
    s.swaps = (s.swaps || 0) + 1;
    hearDeal(room);
    return;
  }
  if (action === 'go') {
    if (s.phase !== 'ready' || playerId !== s.describerId) return;
    s.phase = 'draw';
    s.endsAt = Date.now() + HEAR_LEAD_MS + s.seconds * 1000;
    s.cut = false;
    s.handed = [];
    return;
  }
  if (action === 'done') {
    // «خلّصت»: the describer has said it all; the drawers get HEAR_CUT_MS to finish.
    if (s.phase !== 'draw' || playerId !== s.describerId) return;
    const soon = Date.now() + HEAR_CUT_MS;
    if (s.endsAt > soon) { s.endsAt = soon; s.cut = true; }
    return;
  }
  if (action === 'ink' || action === 'hand') {
    if ((s.phase !== 'draw' && s.phase !== 'collect') || (s.drawers || []).indexOf(playerId) === -1) return;
    if ((s.handed || []).indexOf(playerId) !== -1) return;
    if (Array.isArray(pay.strokes)) room._hear.ink[playerId] = cleanStrokes(pay.strokes);
    if (action === 'hand') {
      s.handed = (s.handed || []).concat([playerId]);
      if (hearAllHanded(room)) hearGrade(room);
    }
    return;
  }
  if (action === 'skipTurn') {
    // A describer who never taps «يلا» (a phone asleep): the round is passed over.
    requireMoveOn(room, playerId);
    if (s.phase !== 'ready') return;
    s.skipped = (s.skipped || []).concat([s.describerId]);
    hearStartRound(room);
    return;
  }
  if (action === 'closeDraw') {
    requireMoveOn(room, playerId);
    if (s.phase !== 'draw') return;
    hearCollect(room);
    return;
  }
  if (action === 'toVote') {
    requireMoveOn(room, playerId);
    if (s.phase !== 'grade') return;
    hearOpenVote(room);
    return;
  }
  if (action === 'vote') {
    if (s.phase !== 'vote') return;
    if (castVote(room, playerId, String(pay.option || ''))) hearVoteResult(room);
    return;
  }
  if (action === 'closeVote') {
    requireMoveOn(room, playerId);
    if (s.phase === 'vote' && closeVote(room)) hearVoteResult(room);
    return;
  }
  if (action === 'nextRound') {
    requireMoveOn(room, playerId);
    if (s.phase !== 'result') return;
    hearStartRound(room);
    return;
  }
  throw new Error('إجراء غير معروف');
};

/** The round's picture: a thing through the prompt memory (no thing again until all have come), or shapes. */
const hearDeal = (room) => {
  const s = room.shared;
  const kind = s.kind === 'mix' ? (s.round % 2 === 1 ? 'things' : 'shapes') : s.kind;
  const thing = kind === 'things' ? nextPrompts(room, HEAR_THING_IDS, 'hear_things', 1)[0] : '';
  const pic = hearPicture(Math.floor(Math.random() * 2147483646) + 1, kind, s.level, thing);
  room._hear = { pic, ink: (room._hear && room._hear.ink) || {} };
  room.secrets = {};
  room.secrets[s.describerId] = { pic };
};

/** The next describer still here; everyone else here draws. The game ends when nobody is left to describe. */
const hearStartRound = (room) => {
  const s = room.shared;
  room._hear = null;
  room._ballots = null;
  room.secrets = {};
  const present = hearPresent(room);
  if (present.length < HEAR_MIN) { hearGameOver(room); return; }
  let turn = s.turn;
  let describerId = null;
  while (++turn < s.rounds) {
    const id = s.order[turn % s.order.length];
    if (hearHere(room, id)) { describerId = id; break; }
  }
  if (!describerId) { hearGameOver(room); return; }
  s.turn = turn;
  s.round = (s.round || 0) + 1;
  s.describerId = describerId;
  s.drawers = present.filter(id => id !== describerId);
  s.phase = 'ready';
  s.swaps = 0;
  s.endsAt = null;
  s.cut = false;
  s.handed = [];
  s.collectEndsAt = null;
  s.gradeEndsAt = null;
  s.voteEndsAt = null;
  s.pic = null;
  s.drawings = null;
  s.avg = null;
  s.descPts = 0;
  s.vote = null;
  s.weird = null;
  s.weirdVotes = 0;
  s.gained = {};
  room._hear = { pic: null, ink: {} };
  hearDeal(room);
};

const hearAllHanded = (room) => {
  const s = room.shared;
  const left = (s.drawers || []).filter(id => hearHere(room, id));
  return left.length > 0 && left.every(id => (s.handed || []).indexOf(id) !== -1);
};

/** Time's up (or the host closed the drawing): a moment for the phones to send their last lines. */
const hearCollect = (room) => {
  const s = room.shared;
  if (hearAllHanded(room)) { hearGrade(room); return; }
  s.phase = 'collect';
  s.endsAt = null;
  s.collectEndsAt = Date.now() + HEAR_COLLECT_MS;
};

/** Every drawing against the picture: the %, the three closest 3 / 2 / 1, the describer's points. */
const hearGrade = (room) => {
  const s = room.shared;
  const h = room._hear;
  if (!h || !h.pic || (s.phase !== 'draw' && s.phase !== 'collect')) return;
  const drawers = (s.drawers || []).filter(id => hearHere(room, id));
  const drawings = drawers.map(id => ({ id, strokes: h.ink[id] || [], pct: hearScore(h.pic.s, h.ink[id] || []) }));
  // Places by the %: the same % shares a place (and its points); a blank page (0%) takes none.
  const ranked = drawings.filter(d => d.pct > 0).sort((a, b) => b.pct - a.pct);
  drawings.forEach(d => {
    const place = d.pct > 0 ? ranked.findIndex(r => r.pct === d.pct) : -1;
    d.place = place;
    d.pts = place >= 0 && place < HEAR_PLACE_POINTS.length ? HEAR_PLACE_POINTS[place] : 0;
    // The owner's extras of 2 Oct 2026, on top of the places: +1 at 50% or more, and «اتحسنت» +1 for
    // beating your own % from the last drawing you made (shared.lastPct; nothing to beat the first time).
    const prev = (s.lastPct || {})[d.id];
    d.prev = typeof prev === 'number' ? prev : null;
    d.over = d.pct >= HEAR_OVER_PCT ? HEAR_OVER_POINTS : 0;
    d.better = d.prev !== null && d.pct > d.prev ? HEAR_BETTER_POINTS : 0;
    d.bonus = d.over + d.better;
  });
  s.lastPct = Object.assign({}, s.lastPct || {});
  drawings.forEach(d => { s.lastPct[d.id] = d.pct; });
  const avg = drawings.length ? Math.round(drawings.reduce((n, d) => n + d.pct, 0) / drawings.length) : 0;
  const descPts = hearHere(room, s.describerId) ? hearDescPoints(avg) : 0;
  s.gained = {};
  drawings.forEach(d => { const n = d.pts + d.bonus; if (n) { addScore(room, d.id, n); s.gained[d.id] = n; } });
  if (descPts) { addScore(room, s.describerId, descPts); s.gained[s.describerId] = descPts; }
  s.phase = 'grade';
  s.pic = h.pic;
  s.drawings = drawings;
  s.avg = avg;
  s.descPts = descPts;
  s.endsAt = null;
  s.collectEndsAt = null;
  s.handed = [];
  s.gradeEndsAt = Date.now() + Math.min(HEAR_GRADE_MAX_MS, HEAR_GRADE_BASE_MS + HEAR_GRADE_EACH_MS * drawings.length);
  s.history = (s.history || []).concat([{ round: s.round, describerId: s.describerId, avg, kind: h.pic.kind, thing: h.pic.thing }]);
  s.board = hearBoard(room);
  room.secrets = {};
  room._hear = null;
};

/** «أغرب رسمة»: everyone here votes for a drawing that isn't their own. Fewer than two drawings: no vote. */
const hearOpenVote = (room) => {
  const s = room.shared;
  // A drawer who left isn't in it: a vote for them would be a vote for nobody.
  const drawings = (s.drawings || []).filter(d => hearHere(room, d.id));
  s.gradeEndsAt = null;
  if (drawings.length < 2) { hearVoteResult(room); return; }
  const eligible = hearPresent(room);
  openVote(room, drawings.map((d, i) => ({ id: 'd' + (i + 1), label: roomPlayerName(room, d.id) || String(i + 1), ownerId: d.id })), eligible);
  s.phase = 'vote';
  s.voteEndsAt = Date.now() + HEAR_VOTE_MS;
  if (!eligible.length && closeVote(room)) hearVoteResult(room);
};

/** The most votes (at least HEAR_WEIRD_MIN_VOTES; a tie at the top all win) take +1. */
const hearVoteResult = (room) => {
  const s = room.shared;
  if (s.phase !== 'vote' && s.phase !== 'grade') return;
  // Only drawings whose owner is still here: one who left mid-vote can't take the top and leave it to nobody.
  const res = ((s.vote && s.vote.results) || []).filter(r => r.ownerId && hearHere(room, r.ownerId));
  const most = res.reduce((m, r) => Math.max(m, r.count), 0);
  s.weird = [];
  s.weirdVotes = most;
  if (most >= HEAR_WEIRD_MIN_VOTES) {
    res.filter(r => r.count === most && r.ownerId && hearHere(room, r.ownerId)).forEach(r => {
      addScore(room, r.ownerId, HEAR_WEIRD_POINTS);
      s.gained[r.ownerId] = (s.gained[r.ownerId] || 0) + HEAR_WEIRD_POINTS;
      s.weird.push(r.ownerId);
    });
  }
  s.phase = 'result';
  s.voteEndsAt = null;
  s.gradeEndsAt = null;
  s.board = hearBoard(room);
};

const hearGameOver = (room) => {
  const s = room.shared;
  room._hear = null;
  room.secrets = {};
  s.phase = 'gameover';
  s.endsAt = s.collectEndsAt = s.gradeEndsAt = s.voteEndsAt = null;
  s.board = hearBoard(room);
};

/** The board: everyone who played and is still here, best first. */
const hearBoard = (room) => {
  const s = room.shared || {};
  return (s.roster || [])
    .filter(id => hearHere(room, id))
    .map(id => ({ id, name: roomPlayerName(room, id), score: (s.scores || {})[id] || 0 }))
    .sort((a, b) => b.score - a.score);
};

/** The server's next moment: the drawing's end, the last lines in, the grading's end, the vote's. */
const hearDeadline = (room) => {
  const s = room.shared || {};
  if (room.phase !== 'play') return null;
  if (s.phase === 'draw' && s.endsAt) return s.endsAt + HEAR_GRACE_MS;
  if (s.phase === 'collect' && s.collectEndsAt) return s.collectEndsAt;
  if (s.phase === 'grade' && s.gradeEndsAt) return s.gradeEndsAt;
  if (s.phase === 'vote' && s.voteEndsAt) return s.voteEndsAt + HEAR_GRACE_MS;
  return null;
};

const hearTimeout = (room, now) => {
  const s = room.shared || {};
  if (room.phase !== 'play') return false;
  if (s.phase === 'draw' && s.endsAt && now >= s.endsAt + HEAR_GRACE_MS) { hearCollect(room); return true; }
  if (s.phase === 'collect' && s.collectEndsAt && now >= s.collectEndsAt) { hearGrade(room); return true; }
  if (s.phase === 'grade' && s.gradeEndsAt && now >= s.gradeEndsAt) { hearOpenVote(room); return true; }
  if (s.phase === 'vote' && s.voteEndsAt && now >= s.voteEndsAt + HEAR_GRACE_MS) {
    if (closeVote(room)) hearVoteResult(room);
    return true;
  }
  return false;
};

/**
 * Someone left. Before the clock, a describer gone passes the round over; while
 * drawing, a describer gone sends the pages to the grading as they are, and a
 * drawer gone takes their page with them (everyone else handed in: graded). A
 * voter gone takes their ballot (the vote may close). Fewer than three to start
 * a round ends the game.
 */
const hearPlayerLeft = (room, playerId) => {
  const s = room.shared;
  if (!s || room.phase !== 'play' || s.phase === 'gameover') return;
  s.drawers = (s.drawers || []).filter(id => id !== playerId);
  if (room._hear && room._hear.ink) delete room._hear.ink[playerId];
  if (s.phase === 'ready') {
    if (hearPresent(room).length < HEAR_MIN) { hearGameOver(room); return; }
    if (playerId === s.describerId) { s.skipped = (s.skipped || []).concat([playerId]); hearStartRound(room); }
    return;
  }
  if (s.phase === 'draw' || s.phase === 'collect') {
    s.handed = (s.handed || []).filter(id => id !== playerId);
    if (!s.drawers.some(id => hearHere(room, id))) { hearStartRound(room); return; }
    if (playerId === s.describerId || hearAllHanded(room)) hearGrade(room);
    return;
  }
  if (s.phase === 'vote') {
    if (voteDropPlayer(room, playerId)) hearVoteResult(room);
    s.board = hearBoard(room);
    return;
  }
  s.board = hearBoard(room);
};
