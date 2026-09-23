/* ============================================================================
   بولينج — BOWLING in rooms
   ----------------------------------------------------------------------------
   Bundled into the Worker after RoomGames.js (FILES in rooms-worker/build.mjs),
   whose helpers it uses (requireHost, staleTap, roomPlayerName…). The lane,
   the pins and a throw are Bowling.js, shared with the page: a throw is four
   whole numbers, and the physics is plain arithmetic, so the server and every
   phone get the same pins down from the same numbers.

   The owner's rules for a room (23 Sep 2026): everyone in the room bowls, in
   turn, and everyone watches every throw on their phone and the TV. 5 or 10
   frames (5 by default), real ten-pin scoring with the last frame's bonus
   balls; no bumpers and no computer players. The aim guide («مساعدة
   التصويب») is the host's switch, off by default. A turn clock is the host's
   too (off, 20 or 40 seconds): when it runs out the phone throws a gentle
   straight ball for the player, and the host can do the same for a phone
   that went quiet.

   How a throw travels: the thrower's phone plays it at once from the shot
   numbers and sends them; the server cleans them (bowlCleanShot), runs the
   throw (bowlRun) for the authoritative result, writes it on the player's
   card and moves the turn on. `shared.last` carries the shot and the pins
   that were up before it, so every other phone and the TV replay the same
   ball and the same pins falling, then settle on the server's card.

   Nothing is hidden: the whole game is `shared`, and there are no secrets.

   shared:
     phase     'play' | 'gameover'
     settings  { frames: 5 | 10, clock: 0 | 20 | 40, guide: bool }
     order     who bowls, in turn · turn { pid } · turnSeq (raised every ball)
     cards     { pid: { frames, standing, total, over } } (bowlNewCard)
     last      { seq, pid, name, shot, before, after, down, kind, frame, ms, auto }
     throwSeq  how many balls have been thrown this game
     readyAt   when the ball in `last` has been watched and the lane is set again
     endsAt    the turn clock, counted from readyAt
     scores    the pins each has so far
     board     everyone's pins, best first - filled when the game is over, not
               before: the TV's strip reads it, and a score there would tell
               the room how a ball went before the pins have fallen on screen
     wins      games won tonight · winners  who won this one
   ========================================================================= */

const BOWL_FRAME_CHOICES = [5, 10];
const BOWL_CLOCKS = [0, 20, 40];
const BOWL_GRACE_MS = 1500;       // the server's clock acts this long after the phones'
const BOWL_SET_MS = 4200;         // the verdict, the sweep and the pins set again, after the pins settle

const bowlRoomOptions = (payload, prev) => {
  const p = payload || {};
  const was = prev || {};
  const pick = (list, v, w, dflt) => (list.indexOf(Number(v)) !== -1 ? Number(v) : (list.indexOf(Number(w)) !== -1 ? Number(w) : dflt));
  return {
    frames: pick(BOWL_FRAME_CHOICES, p.frames, was.frames, 5),
    clock: pick(BOWL_CLOCKS, p.clock, was.clock, 0),
    guide: typeof p.guide === 'boolean' ? p.guide : !!was.guide
  };
};

const bowlHere = (room) => room.players.filter(p => !p.bot).map(p => p.id);

/** The pins each player has, best first: the podium, the TV strip and the night's table. */
const bowlBoardOf = (room) => {
  const s = room.shared;
  const here = bowlHere(room);
  return (s.order || [])
    .filter(id => here.indexOf(id) !== -1 && s.cards[id])
    .map(id => ({ id: id, name: roomPlayerName(room, id), score: bowlTotal(s.cards[id]) }))
    .sort((a, b) => b.score - a.score);
};

const bowlStartClock = (room, fromMs) => {
  const s = room.shared;
  const secs = (s.settings || {}).clock || 0;
  s.endsAt = s.phase === 'play' && secs && s.turn ? fromMs + secs * 1000 : null;
};

/** The next to bowl after `pid`: the next in the order whose card isn't finished. */
const bowlNextUp = (s, pid) => {
  const order = s.order || [];
  const at = order.indexOf(pid);
  for (let k = 1; k <= order.length; k++) {
    const id = order[(Math.max(at, -1) + k + order.length) % order.length];
    if (s.cards[id] && !s.cards[id].over) return id;
  }
  return null;
};

/** The game is over: the board, the winner's win, no clock. */
const bowlFinish = (room) => {
  const s = room.shared;
  s.phase = 'gameover';
  room.phase = 'gameover';
  s.turn = null;
  s.endsAt = null;
  s.board = bowlBoardOf(room);
  if (!s.counted && s.board.length && s.board[0].score > 0) {
    // Two level on top both win.
    const top = s.board[0].score;
    s.wins = s.wins || {};
    s.board.filter(r => r.score === top).forEach(r => { s.wins[r.id] = (s.wins[r.id] || 0) + 1; });
    s.winners = s.board.filter(r => r.score === top).map(r => r.id);
    s.counted = true;
  }
};

const bowlNewRoomGame = (room, playerId, action, payload) => {
  requireHost(room, playerId);
  const prev = room.shared || {};
  if (action === 'playAgain' && prev.phase !== 'gameover') return;
  const here = bowlHere(room);
  if (!here.length) throw new Error('مفيش حد يلعب');
  const settings = bowlRoomOptions(action === 'playAgain' ? Object.assign({}, prev.settings, payload || {}) : payload, prev.settings);
  // The same order again, whoever is still here first, then anyone who joined since.
  const kept = action === 'playAgain' ? (prev.order || []).filter(id => here.indexOf(id) !== -1) : [];
  here.forEach(id => { if (kept.indexOf(id) === -1) kept.push(id); });
  const cards = {};
  kept.forEach(id => { cards[id] = bowlNewCard(settings.frames); });
  room.shared = {
    phase: 'play',
    settings: settings,
    order: kept,
    cards: cards,
    turn: { pid: kept[0] },
    // Carried over a play again, so a tap or a replay from the last game is never taken for this one.
    turnSeq: (prev.turnSeq || 0) + 1,
    throwSeq: 0,
    last: null,
    readyAt: Date.now(),
    endsAt: null,
    scores: {},
    board: [],
    wins: prev.wins || {},
    counted: false,
    winners: [],
    roster: room.players.map(p => p.id)
  };
  room.phase = 'play';
  bowlStartClock(room, Date.now());
};

/** One ball, by the player whose turn it is (or thrown for them: the clock, the host). */
const bowlDoThrow = (room, pid, shotIn, auto) => {
  const s = room.shared;
  const card = s.cards[pid];
  if (!card || card.over) throw new Error('انت خلّصت');
  const shot = bowlCleanShot(shotIn);
  const before = card.standing.slice();
  const sim = bowlRun(before, shot);
  const after = bowlStanding(sim);
  let down = 0;
  for (let i = 0; i < 10; i++) if (before[i] && !after[i]) down++;
  const frame = card.frames.length - 1;
  const out = bowlApply(card, after, down, !!sim.ball.gutter);
  const ms = Math.round(sim.t * 1000);
  s.throwSeq = (s.throwSeq || 0) + 1;
  s.last = {
    seq: s.throwSeq, pid: pid, name: roomPlayerName(room, pid), shot: shot, before: before, after: after,
    down: down, kind: out.kind, frame: frame, ms: ms, auto: auto || ''
  };
  s.scores[pid] = bowlTotal(card);
  s.turnSeq = (s.turnSeq || 0) + 1;
  s.readyAt = Date.now() + ms + BOWL_SET_MS;
  if (!out.frameDone) s.turn = { pid: pid };
  else {
    const next = bowlNextUp(s, pid);
    if (!next) { bowlFinish(room); return; }
    s.turn = { pid: next };
  }
  bowlStartClock(room, s.readyAt);
};

const bowlingAction = (room, playerId, action, payload) => {
  const p = payload || {};
  if (action === 'start' || action === 'playAgain') { bowlNewRoomGame(room, playerId, action, p); return; }
  const s = room.shared;
  if (!s || !s.settings || !s.cards) throw new Error('اللعبة لم تبدأ بعد');

  if (action === 'throw') {
    if (s.phase !== 'play') return;
    // A throw aimed at a turn that has since moved on: dropped without a word.
    if (staleTap(p, 'seq', s.turnSeq)) return;
    if (!s.cards[playerId]) throw new Error('انت بتتفرج الجيم ده');
    if (!s.turn || s.turn.pid !== playerId) throw new Error('مش دورك');
    bowlDoThrow(room, playerId, p, '');
    return;
  }

  if (action === 'skipTurn') {
    // The host throws a gentle ball for a phone that went quiet.
    requireHost(room, playerId);
    if (s.phase !== 'play' || !s.turn || staleTap(p, 'seq', s.turnSeq)) return;
    bowlDoThrow(room, s.turn.pid, bowlGentleShot(), 'host');
    return;
  }

  throw new Error('إجراء غير معروف');
};

/* --- the clock ------------------------------------------------------------------ */

const bowlDeadline = (room) => {
  const s = room.shared || {};
  return s.phase === 'play' && s.endsAt ? s.endsAt + BOWL_GRACE_MS : null;
};

const bowlTimeout = (room, now) => {
  const s = room.shared || {};
  if (s.phase !== 'play' || !s.endsAt || !s.turn || now < s.endsAt + BOWL_GRACE_MS) return false;
  bowlDoThrow(room, s.turn.pid, bowlGentleShot(), 'clock');
  return true;
};

/* --- someone leaves -------------------------------------------------------------
   Their card leaves the board with them and the turn passes on; with nobody
   left to bowl the game is over.
   ------------------------------------------------------------------------------ */
const bowlPlayerLeft = (room, playerId) => {
  const s = room.shared;
  if (!s || !s.cards || s.phase !== 'play') return;
  if ((s.order || []).indexOf(playerId) === -1) return;
  const wasUp = s.turn && s.turn.pid === playerId;
  const next = wasUp ? bowlNextUp(s, playerId) : null;
  s.order = s.order.filter(id => id !== playerId);
  delete s.cards[playerId];
  delete s.scores[playerId];
  if (wasUp) {
    if (!next || next === playerId) { bowlFinish(room); return; }
    s.turn = { pid: next };
    s.turnSeq = (s.turnSeq || 0) + 1;
    s.readyAt = Math.max(s.readyAt || 0, Date.now());
    bowlStartClock(room, s.readyAt);
  }
  if (!s.order.some(id => s.cards[id] && !s.cards[id].over)) bowlFinish(room);
};
