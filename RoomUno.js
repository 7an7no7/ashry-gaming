/* ============================================================================
   أونو — UNO (rooms)
   ----------------------------------------------------------------------------
   Bundled into the Worker after RoomGames.js (FILES in rooms-worker/build.mjs),
   so it uses that file's helpers (shuffled, requireHost, staleTap, the bot
   hook) and registers its computer players in ROOM_BOT_GAMES. The cards are
   UnoCards.js, loaded before both files and inlined into the page too.

   Where the cards are:
     room._uno           the deck (its top is the end), the whole pile, every
                         hand, and the card the player up has just drawn and
                         may still play. Never projected.
     room.secrets[pid]   that phone's own hand ({ i, k } each) and, while it
                         decides whether to play the card it drew, its id.
     room.shared         what the table sees: how many cards each hand holds,
                         the top of the pile (a few under it), the colour in
                         play, the direction, whose turn and at what stage, a
                         draw waiting (stacking), who has said UNO and who can
                         be caught, the scores and every move as an event. A
                         card drawn is never in it - its event says "drew 1".

   A turn (turn.stage):
     'color'  the round opened on a wild: the first player picks the colour
              (pickColor), then plays as usual.
     'play'   play a card that fits (play { card, color?, target?, uno? }),
              or draw (draw), or - with a draw waiting on you - take it
              (take), which ends the turn.
     'drawn'  the card just drawn fits: play it (play, that card only) or
              keep it (keep). One that doesn't fit ends the turn by itself.
   Out of turn, anyone may say UNO (callUno), catch a player who went down to
   one card without saying it (catchUno { target }), and - with jump-in on -
   throw the very same card as the one on top (jump { card, top }).

   Every turn action carries `seq` (shared.turnSeq), which moves whenever a
   turn starts or changes stage, so the second tap of a double tap is dropped
   quietly; a jump carries the id of the top card it was aimed at.
   ========================================================================= */
const UNO_ROUNDS = [3, 5, 7];
const UNO_CLOCKS = [0, 30, 60];
const UNO_EVENTS = 40;
const UNO_PILE_SHOWN = 8;          // the top of the pile the phones draw
const UNO_GRACE_MS = 1500;
const UNO_CATCH_DRAW = 2;          // caught without saying UNO: two cards
const UNO_STACK_MODES = ['same', 'mixed'];

const unoAction = (room, playerId, action, payload) => {
  const p = payload || {};
  if (action === 'start' || action === 'playAgain') {
    unoNewGame(room, playerId, action, p);
    return;
  }
  const s = room.shared;
  const g = room._uno;
  if (!s || !s.phase || !g) throw new Error('اللعبة لم تبدأ بعد');

  if (action === 'nextRound') {
    requireHost(room, playerId);
    if (s.phase !== 'roundOver') return;           // a double tap: the round is dealt already
    unoApply(room, () => unoDeal(room));
    return;
  }
  if (action === 'callUno') { unoApply(room, () => unoCall(room, playerId)); return; }
  if (action === 'catchUno') { unoApply(room, () => unoCatch(room, playerId, p)); return; }
  if (action === 'jump') {
    const top = unoTop(g);
    // Aimed at a top card that has since been covered: dropped without a word.
    if (staleTap(p, 'top', top ? top.i : '')) return;
    unoApply(room, () => unoJump(room, playerId, p));
    return;
  }
  if (action === 'skipTurn') {
    requireHost(room, playerId);
    if (staleTap(p, 'seq', s.turnSeq)) return;
    if (s.phase !== 'play' || !s.turn) return;
    unoApply(room, () => unoAuto(room, 'host'));
    return;
  }
  // The turn's own moves. A tap aimed at a turn that has moved on is dropped quietly.
  if (staleTap(p, 'seq', s.turnSeq)) return;
  unoApply(room, () => unoMove(room, playerId, action, p));
};

/** Runs a change, then writes what every phone may see. Actions, the clock and a leave all go through here. */
const unoApply = (room, change) => {
  const out = change();
  unoSync(room);
  return out;
};

/* --- who and where ------------------------------------------------------------ */

const unoHere = (room, id) => room.players.some(p => p.id === id);
const unoSeated = (room) => (room.shared.order || []).filter(id => unoHere(room, id));
const unoTop = (g) => (g && g.pile.length ? g.pile[g.pile.length - 1] : null);

/** The seat `steps` on from `pid` in the direction of play. */
const unoNext = (room, pid, steps) => {
  const s = room.shared;
  const seats = s.order;
  const n = seats.length;
  const at = seats.indexOf(pid);
  if (at === -1 || !n) return seats[0];
  const k = (steps === undefined ? 1 : steps) * (s.dir === -1 ? -1 : 1);
  return seats[(((at + k) % n) + n) % n];
};

const unoEvent = (room, type, fields) => {
  const s = room.shared;
  s.eventSeq = (s.eventSeq || 0) + 1;
  s.events = (s.events || []).concat([Object.assign({ seq: s.eventSeq, type: type }, fields || {})]).slice(-UNO_EVENTS);
};

/* --- a game, a round ------------------------------------------------------------- */

const unoNewGame = (room, playerId, action, p) => {
  requireHost(room, playerId);
  const prev = room.shared || {};
  if (action === 'playAgain' && prev.phase !== 'gameover') return;
  const n = room.players.length;
  if (n < 2) throw new Error('أونو محتاج لاعبين على الأقل: ضيف لاعب كمبيوتر');
  const settings = unoSettings(p, action === 'playAgain' ? (prev.settings || {}) : {});
  const order = shuffled(room.players.map(pl => pl.id));
  room.secrets = {};
  room._uno = { deck: [], pile: [], hands: {}, drawnId: null };
  room.shared = {
    settings: settings,
    round: 0,
    rounds: settings.length === 'rounds' ? settings.rounds : 1,
    order: order,
    roster: order.slice(),
    scores: {},
    // One round is won, not scored (the owner: "first out wins, no points"): the
    // wins are counted across play again, and they are the board.
    wins: action === 'playAgain' && prev.wins ? prev.wins : {},
    winners: null,
    // Carried over a play again, so a tap or an animation from the last game is never taken for this one.
    turnSeq: (prev.turnSeq || 0) + 1,
    eventSeq: prev.eventSeq || 0
  };
  unoDeal(room);
  unoSync(room);
};

/** The lobby's options, checked; a play again keeps the last game's. */
const unoSettings = (p, was) => {
  const flag = (key, dflt) => (typeof p[key] === 'boolean' ? p[key] : (typeof was[key] === 'boolean' ? was[key] : dflt));
  const pick = (key, list, dflt) => (list.indexOf(Number(p[key])) !== -1 ? Number(p[key]) : (list.indexOf(Number(was[key])) !== -1 ? Number(was[key]) : dflt));
  const lengthAsked = p.length === 'rounds' || p.length === 'one' ? p.length : (was.length === 'rounds' ? 'rounds' : 'one');
  return {
    // One round, the first out wins (the default); or a number of rounds with points.
    length: lengthAsked,
    rounds: pick('rounds', UNO_ROUNDS, 5),
    // Stacking is on by default (the owner's table plays it): +2 on +2 and +4 on +4,
    // or with 'mixed' a +4 on a +2 as well.
    stacking: flag('stacking', true),
    stackMode: UNO_STACK_MODES.indexOf(p.stackMode) !== -1 ? p.stackMode : (UNO_STACK_MODES.indexOf(was.stackMode) !== -1 ? was.stackMode : 'same'),
    // Draw until a card fits, instead of one card (off: the official rule).
    drawUntil: flag('drawUntil', false),
    // 7 swaps your hand with a player's; 0 passes every hand one seat on.
    sevenO: flag('sevenO', false),
    // The very same card as the top one may be thrown out of turn.
    jumpIn: flag('jumpIn', false),
    turnClock: pick('turnClock', UNO_CLOCKS, 0)
  };
};

/** Deals a round: seven each, a card turned up, and that card's effect on the first player. */
const unoDeal = (room) => {
  const s = room.shared;
  s.order = s.order.filter(id => unoHere(room, id));
  s.round = (s.round || 0) + 1;
  const n = s.order.length;
  const kinds = shuffled(unoDeck(unoDecksFor(n)));
  // Ids at random, so an id says nothing about its card.
  const ids = shuffled(kinds.map((k, j) => j));
  const g = { deck: kinds.map((k, j) => ({ i: ids[j], k: k })), pile: [], hands: {}, drawnId: null };
  room._uno = g;
  // The player after the dealer starts; the dealer moves on one seat every round.
  const start = (s.round - 1) % n;
  s.order.forEach(id => { g.hands[id] = []; });
  for (let c = 0; c < UNO_HAND; c++) {
    for (let k = 0; k < n; k++) g.hands[s.order[(start + k) % n]].push(g.deck.pop());
  }
  // The first card: a wild +4 goes back into the deck and another is turned.
  let first = g.deck.pop();
  let returned = 0;
  while (first.k === 'w4') {
    g.deck.splice(Math.floor(Math.random() * g.deck.length), 0, first);
    returned++;
    first = g.deck.pop();
  }
  g.pile.push(first);
  s.phase = 'play';
  room.phase = 'play';
  s.dir = 1;
  s.color = unoColorOf(first.k);
  s.pending = null;
  s.said = [];
  g.saidAt = {};      // how many cards each call was made on (server-only)
  s.unoCatch = null;
  s.results = null;
  s.turn = null;
  s.endsAt = null;
  s.events = [];
  s.start = s.order[start];
  unoEvent(room, 'deal', { round: s.round, start: s.order[start], first: { i: first.i, k: first.k }, returned: returned });

  // The card turned up acts on the first player (the owner, 21 Sep 2026).
  let up = s.order[start];
  const v = unoValueOf(first.k);
  if (v === 's') {
    unoEvent(room, 'skip', { pid: up });
    up = unoNext(room, up);
  } else if (v === 'v') {
    // Reverse: play goes the other way, so the dealer - the seat before the first player - plays first.
    s.dir = -1;
    unoEvent(room, 'reverse', { pid: null, dir: -1 });
    up = s.order[(start - 1 + n) % n];
  } else if (v === 'd') {
    if (s.settings.stacking) {
      // Stacking on: the first player faces the +2 and may answer it.
      s.pending = { n: 2, kind: 'd' };
    } else {
      unoGive(room, up, 2, 'hit', null);
      unoEvent(room, 'skip', { pid: up });
      up = unoNext(room, up);
    }
  }
  // A wild: the first player picks the colour (stage 'color', by unoStartTurn).
  unoStartTurn(room, up);
};

/* --- turns ---------------------------------------------------------------------- */

const unoStartTurn = (room, pid) => {
  const s = room.shared;
  room._uno.drawnId = null;
  s.turn = { pid: pid, stage: s.color ? 'play' : 'color' };
  s.turnSeq = (s.turnSeq || 0) + 1;
  s.endsAt = s.settings.turnClock ? Date.now() + s.settings.turnClock * 1000 : null;
};

const unoTurnCheck = (room, me, stages) => {
  const s = room.shared;
  if (s.phase !== 'play' || !s.turn) throw new Error('مش وقت اللعب');
  if (s.turn.pid !== me) throw new Error('مش دورك');
  if (stages.indexOf(s.turn.stage) === -1) throw new Error('مش دلوقتي');
};

/** A move at the table closes the window for catching whoever forgot to say UNO. */
const unoCloseCatch = (room) => { room.shared.unoCatch = null; };

const unoMove = (room, me, action, p) => {
  const s = room.shared;
  const g = room._uno;
  switch (action) {
    case 'pickColor': {
      unoTurnCheck(room, me, ['color']);
      const color = String(p.color || '');
      if (UNO_COLORS.indexOf(color) === -1) throw new Error('اختار لون');
      unoCloseCatch(room);
      s.color = color;
      unoEvent(room, 'color', { pid: me, color: color });
      s.turn.stage = 'play';
      s.turnSeq++;
      return;
    }
    case 'play':
      unoTurnCheck(room, me, ['play', 'drawn']);
      unoPlay(room, me, p, false);
      return;
    case 'draw': {
      unoTurnCheck(room, me, ['play']);
      if (s.pending) throw new Error('عليك سحب، اسحبهم أو ارمي كارت سحب');
      unoCloseCatch(room);
      unoDrawTurn(room, me, !!s.settings.drawUntil);
      return;
    }
    case 'take': {
      unoTurnCheck(room, me, ['play']);
      if (!s.pending) throw new Error('مفيش سحب عليك');
      unoCloseCatch(room);
      unoTakePending(room, me, false);
      return;
    }
    case 'keep': {
      unoTurnCheck(room, me, ['drawn']);
      unoCloseCatch(room);
      g.drawnId = null;
      unoEvent(room, 'keep', { pid: me });
      unoStartTurn(room, unoNext(room, me));
      return;
    }
    default:
      throw new Error('إجراء غير معروف');
  }
};

/**
 * Plays a card from `me`'s hand: on their turn, or as a jump-in. Everything
 * the card does happens here - the colour, skip, reverse, the draw cards
 * (stacked or not), 7 and 0 - and the turn goes on from `me`.
 */
const unoPlay = (room, me, p, jump) => {
  const s = room.shared;
  const g = room._uno;
  const hand = g.hands[me] || [];
  const at = hand.findIndex(c => String(c.i) === String(p.card));
  if (at === -1) throw new Error('الكارت ده مش معاك');
  const card = hand[at];
  const top = unoTop(g);
  if (jump) {
    if (!top || !unoSameCard(card.k, top.k)) throw new Error('الدخول بنفس الكارت بالظبط بس');
  } else {
    // After drawing, only the card drawn may be played (the official rule).
    if (s.turn.stage === 'drawn' && String(card.i) !== String(g.drawnId)) throw new Error('بعد السحب تقدر تلعب الكارت اللي سحبته بس');
    if (!unoCanPlay(card.k, top ? top.k : null, s.color, s.pending, s.settings)) throw new Error('الكارت ده مينفعش على اللي على الأرض');
  }
  let color = unoColorOf(card.k);
  if (unoIsWild(card.k)) {
    color = String(p.color || '');
    if (UNO_COLORS.indexOf(color) === -1) throw new Error('اختار لون');
  }
  const value = unoValueOf(card.k);
  const leftAfter = hand.length - 1;
  // 7-0: a 7 needs someone to swap with - unless it is the last card, which ends the round.
  let target = null;
  if (s.settings.sevenO && value === '7' && leftAfter > 0) {
    target = String(p.target || '');
    if (target === me || unoSeated(room).indexOf(target) === -1) throw new Error('اختار لاعب تبدّل ورقك معاه');
  }

  unoCloseCatch(room);
  hand.splice(at, 1);
  const onPile = { i: card.i, k: card.k };
  if (unoIsWild(card.k)) onPile.c = color;
  g.pile.push(onPile);
  g.drawnId = null;
  s.color = color;
  // UNO: said with this card, just before it (callUno), or not at all.
  const saidNow = p.uno === true && leftAfter === 1 && s.said.indexOf(me) === -1;
  if (saidNow) { s.said.push(me); (g.saidAt = g.saidAt || {})[me] = leftAfter; }
  const said = s.said.indexOf(me) !== -1;
  const draw = unoDrawOf(card.k);
  unoEvent(room, 'play', {
    pid: me, card: { i: card.i, k: card.k }, color: unoIsWild(card.k) ? color : null, jump: !!jump,
    uno: saidNow, left: leftAfter,
    pending: draw && s.settings.stacking && leftAfter > 0 ? ((s.pending ? s.pending.n : 0) + draw) : null
  });
  // Down to one card without having said it: anyone can catch them until the next move.
  if (leftAfter === 1 && !said) s.unoCatch = me;

  if (leftAfter === 0) {
    // The last card. A draw card still makes the next player draw (the whole stack), and those cards count.
    if (draw) {
      const n = (s.pending ? s.pending.n : 0) + draw;
      s.pending = null;
      unoGive(room, unoNext(room, me), n, 'hit', me);
    }
    unoEndRound(room, me);
    return;
  }

  const n = s.order.length;
  if (value === 's') {
    const skipped = unoNext(room, me);
    unoEvent(room, 'skip', { pid: skipped });
    unoStartTurn(room, unoNext(room, skipped));
    return;
  }
  if (value === 'v') {
    s.dir = s.dir === -1 ? 1 : -1;
    unoEvent(room, 'reverse', { pid: me, dir: s.dir });
    // With two players a reverse is a skip: the same player goes again.
    if (n === 2) {
      unoEvent(room, 'skip', { pid: unoNext(room, me) });
      unoStartTurn(room, me);
    } else {
      unoStartTurn(room, unoNext(room, me));
    }
    return;
  }
  if (draw) {
    if (s.settings.stacking) {
      // The draw waits on the next player, who may stack on it or take it all.
      s.pending = { n: (s.pending ? s.pending.n : 0) + draw, kind: card.k === 'w4' ? 'w4' : 'd' };
      unoStartTurn(room, unoNext(room, me));
    } else {
      const victim = unoNext(room, me);
      unoGive(room, victim, draw, 'hit', me);
      unoEvent(room, 'skip', { pid: victim });
      unoStartTurn(room, unoNext(room, victim));
    }
    return;
  }
  if (s.settings.sevenO && value === '7') {
    const mine = g.hands[me];
    g.hands[me] = g.hands[target];
    g.hands[target] = mine;
    unoForgetUno(room, [me, target]);
    unoEvent(room, 'swap', { pid: me, target: target, n1: g.hands[me].length, n2: g.hands[target].length });
    unoStartTurn(room, unoNext(room, me));
    return;
  }
  if (s.settings.sevenO && value === '0') {
    // Every hand passes one seat on in the direction of play.
    const seats = unoSeated(room);
    const was = {};
    seats.forEach(id => { was[id] = g.hands[id] || []; });
    seats.forEach(id => { g.hands[unoNext(room, id)] = was[id]; });
    unoForgetUno(room, seats);
    unoEvent(room, 'rotate', { pid: me, dir: s.dir });
    unoStartTurn(room, unoNext(room, me));
    return;
  }
  unoStartTurn(room, unoNext(room, me));
};

/** A hand that changed owners (7-0) keeps nobody's UNO: it was said about another hand. */
const unoForgetUno = (room, ids) => {
  const s = room.shared;
  s.said = s.said.filter(id => ids.indexOf(id) === -1);
  if (ids.indexOf(s.unoCatch) !== -1) s.unoCatch = null;
};

/** Jump in: anyone holding the very same card as the top one plays it now, and play carries on from them. */
const unoJump = (room, me, p) => {
  const s = room.shared;
  if (!s.settings.jumpIn) throw new Error('الدخول مش مفعّل في اللعبة دي');
  if (s.phase !== 'play' || !s.turn) throw new Error('مش وقت اللعب');
  if (unoSeated(room).indexOf(me) === -1) throw new Error('ستدخل من الجولة القادمة');
  if (s.turn.pid === me && (s.turn.stage === 'play' || s.turn.stage === 'drawn')) {
    // On your own turn a jump is just a play.
    unoPlay(room, me, p, false);
    return;
  }
  if (s.turn.stage === 'color') throw new Error('استنى اللون الأول');
  // The player up loses the turn; a card they had just drawn stays in their hand.
  unoPlay(room, me, p, true);
};

/**
 * Draws for the player up: one card, or with "draw until you can play" until
 * one fits. A card that fits may be played or kept (stage 'drawn'); one that
 * doesn't ends the turn.
 */
const unoDrawTurn = (room, me, until) => {
  const s = room.shared;
  const g = room._uno;
  const top = unoTop(g);
  const got = [];
  let fits = false;
  for (;;) {
    const one = unoTake(room, 1);
    if (!one.length) break;
    g.hands[me].push(one[0]);
    got.push(one[0]);
    fits = unoCanPlay(one[0].k, top ? top.k : null, s.color, null, s.settings);
    if (fits || !until) break;
  }
  unoEvent(room, 'draw', { pid: me, n: got.length });
  if (fits) {
    g.drawnId = got[got.length - 1].i;
    s.turn.stage = 'drawn';
    s.turnSeq++;
    return;
  }
  if (!got.length) unoEvent(room, 'pass', { pid: me });
  unoStartTurn(room, unoNext(room, me));
};

/** A draw waiting on the player up: they take it all and the turn goes on. */
const unoTakePending = (room, me, auto) => {
  const s = room.shared;
  const n = s.pending ? s.pending.n : 0;
  s.pending = null;
  unoGive(room, me, n, 'take', null, auto);
  unoStartTurn(room, unoNext(room, me));
};

/** Cards from the deck into a hand, with their event ('hit', 'take', 'caught' say who and how many - never which). */
const unoGive = (room, pid, n, type, by, auto) => {
  const g = room._uno;
  const got = unoTake(room, n);
  g.hands[pid] = (g.hands[pid] || []).concat(got);
  const ev = { pid: pid, n: got.length };
  if (by) ev.by = by;
  if (auto) ev.auto = true;
  unoEvent(room, type, ev);
  return got;
};

/** Up to n cards off the deck; an empty deck takes back the pile under its top card, shuffled. */
const unoTake = (room, n) => {
  const g = room._uno;
  const out = [];
  for (let k = 0; k < n; k++) {
    if (!g.deck.length && g.pile.length > 1) {
      const top = g.pile.pop();
      // A wild's chosen colour goes with it back into the deck.
      g.deck = shuffled(g.pile.map(c => ({ i: c.i, k: c.k })));
      g.pile = [top];
      unoEvent(room, 'reshuffle', { n: g.deck.length });
    }
    if (!g.deck.length) break;
    out.push(g.deck.pop());
  }
  return out;
};

/**
 * The clock ran out, or the host skipped a phone that went quiet: the phone
 * plays for its player. A draw waiting is taken; otherwise one card is drawn
 * and the turn passes (a card just drawn is kept). A round waiting for its
 * first colour gets one at random first.
 */
const unoAuto = (room, why) => {
  const s = room.shared;
  const g = room._uno;
  const pid = s.turn.pid;
  unoCloseCatch(room);
  unoEvent(room, 'auto', { pid: pid, why: why });
  if (s.turn.stage === 'color') {
    s.color = UNO_COLORS[Math.floor(Math.random() * UNO_COLORS.length)];
    unoEvent(room, 'color', { pid: pid, color: s.color, auto: true });
    s.turn.stage = 'play';
  }
  if (s.turn.stage === 'drawn') {
    g.drawnId = null;
    unoEvent(room, 'keep', { pid: pid, auto: true });
  } else if (s.pending) {
    unoTakePending(room, pid, true);
    return true;
  } else {
    const got = unoTake(room, 1);
    g.hands[pid] = g.hands[pid].concat(got);
    unoEvent(room, 'draw', { pid: pid, n: got.length, auto: true });
  }
  unoStartTurn(room, unoNext(room, pid));
  return true;
};

/* --- UNO! ----------------------------------------------------------------------- */

/**
 * Saying it: with one card left, or with two, just before playing the second
 * to last (the call is forgotten if the hand grows again). Once said, nobody
 * can catch you for that card.
 */
const unoCall = (room, me) => {
  const s = room.shared;
  const g = room._uno;
  if (s.phase !== 'play') return;
  if (unoSeated(room).indexOf(me) === -1) throw new Error('ستدخل من الجولة القادمة');
  const count = (g.hands[me] || []).length;
  if (count < 1 || count > 2) throw new Error('أونو بتتقال لما يفضل معاك كارت أو كارتين');
  if (s.said.indexOf(me) !== -1) return;       // said already: nothing to do
  s.said.push(me);
  (g.saidAt = g.saidAt || {})[me] = count;
  if (s.unoCatch === me) s.unoCatch = null;
  unoEvent(room, 'uno', { pid: me });
};

/** Caught: whoever went down to one card without saying it draws two. Anyone else may catch them, until the next move. */
const unoCatch = (room, me, p) => {
  const s = room.shared;
  const target = String(p.target || '');
  if (s.phase !== 'play') return;
  if (unoSeated(room).indexOf(me) === -1) throw new Error('ستدخل من الجولة القادمة');
  if (target === me) throw new Error('مش هتمسك نفسك');
  // Too late - someone was quicker, they said it, or the next move was made: nothing to do.
  if (!target || s.unoCatch !== target) return;
  s.unoCatch = null;
  unoGive(room, target, UNO_CATCH_DRAW, 'caught', me);
};

/* --- the end of a round, and of the game ------------------------------------------------ */

const unoEndRound = (room, winner) => {
  const s = room.shared;
  const g = room._uno;
  const hands = {};
  const points = {};
  let gained = 0;
  unoSeated(room).forEach(id => {
    hands[id] = (g.hands[id] || []).map(c => c.k);
    points[id] = unoHandPoints(hands[id]);
    if (id !== winner) gained += points[id];
  });
  s.turn = null;
  s.endsAt = null;
  s.pending = null;
  s.unoCatch = null;
  s.results = { round: s.round, winner: winner, hands: hands, points: points, gained: gained };
  unoEvent(room, 'win', { pid: winner, gained: gained });
  if (s.settings.length !== 'rounds') {
    s.wins = s.wins || {};
    s.wins[winner] = (s.wins[winner] || 0) + 1;
  }
  if (s.settings.length === 'rounds') {
    // The round's winner scores the cards left in everyone else's hand.
    s.scores[winner] = (s.scores[winner] || 0) + gained;
    if (s.round < s.rounds) {
      s.phase = 'roundOver';
      room.phase = 'roundOver';
      return;
    }
  }
  unoGameOver(room);
};

/** The last round is scored, or too few are left to play. */
const unoGameOver = (room) => {
  const s = room.shared;
  const ids = unoSeated(room);
  s.turn = null;
  s.endsAt = null;
  s.pending = null;
  s.unoCatch = null;
  if (s.settings.length === 'rounds') {
    const best = ids.length ? Math.max.apply(null, ids.map(id => s.scores[id] || 0)) : 0;
    s.winners = ids.filter(id => (s.scores[id] || 0) === best);
  } else {
    // One round: the first out wins (or, when everyone else left, the one still here).
    const w = s.results && s.results.winner;
    s.winners = w && ids.indexOf(w) !== -1 ? [w] : ids.slice(0, 1);
  }
  s.phase = 'gameover';
  room.phase = 'gameover';
};

/**
 * Best first. Rounds: the running totals. One round: the games won, counted
 * across play again - one round is won, not scored.
 */
const unoBoard = (room) => {
  const s = room.shared;
  const ids = (s.order || []).filter(id => unoHere(room, id));
  const name = (id) => (room.players.find(p => p.id === id) || {}).name || '';
  if (s.settings && s.settings.length === 'rounds') {
    return ids.map(id => ({ id: id, name: name(id), score: s.scores[id] || 0 })).sort((a, b) => b.score - a.score);
  }
  const wins = s.wins || {};
  return ids.map(id => ({ id: id, name: name(id), score: wins[id] || 0 })).sort((a, b) => b.score - a.score);
};

/* --- what the table sees -------------------------------------------------------------- */

/** Writes the counts, the top of the pile, the board and every phone's own hand. */
const unoSync = (room) => {
  const s = room.shared;
  const g = room._uno;
  if (!g || !s) return;
  const counts = {};
  (s.order || []).forEach(id => { counts[id] = (g.hands[id] || []).length; });
  s.counts = counts;
  s.pile = g.pile.slice(-UNO_PILE_SHOWN).map(c => ({ i: c.i, k: c.k, c: c.c || null }));
  s.pileCount = g.pile.length;
  s.deckCount = g.deck.length;
  s.decks = unoDecksFor((s.order || []).length);
  // A call counts for a hand of one or two, and only until the hand grows again:
  // cards drawn after it (one card said, then a draw back to two) mean saying it
  // again. saidAt keeps the smallest the hand has been since the call.
  const saidAt = g.saidAt = g.saidAt || {};
  s.said = (s.said || []).filter(id => {
    const n = counts[id];
    const keep = (n === 1 || n === 2) && !(saidAt[id] !== undefined && n > saidAt[id]);
    if (keep) saidAt[id] = saidAt[id] === undefined ? n : Math.min(saidAt[id], n);
    else delete saidAt[id];
    return keep;
  });
  if (s.unoCatch && counts[s.unoCatch] !== 1) s.unoCatch = null;
  room.secrets = {};
  unoSeated(room).forEach(id => {
    room.secrets[id] = {
      hand: (g.hands[id] || []).map(c => ({ i: c.i, k: c.k })),
      drawn: s.turn && s.turn.pid === id && s.turn.stage === 'drawn' ? g.drawnId : null
    };
  });
  s.board = unoBoard(room);
};

/* --- the server's clock ------------------------------------------------------------ */

const unoDeadline = (room) => {
  const s = room.shared || {};
  if (s.phase === 'play' && s.turn && s.endsAt) return s.endsAt + UNO_GRACE_MS;
  return null;
};

const unoTimeout = (room, now) => {
  const s = room.shared || {};
  if (s.phase !== 'play' || !s.turn || !s.endsAt || now < s.endsAt + UNO_GRACE_MS || !room._uno) return false;
  unoApply(room, () => unoAuto(room, 'clock'));
  return true;
};

/* --- someone leaves -------------------------------------------------------------------- */

/**
 * Their cards go under the deck unseen and their seat goes. A turn that was
 * theirs passes to the next player (a draw waiting stays on the table for
 * them), and fewer than two left ends the game.
 */
const unoPlayerLeft = (room, playerId, name) => {
  const s = room.shared;
  const g = room._uno;
  if (!g || !s || !Array.isArray(s.order)) return;
  const seat = s.order.indexOf(playerId);
  if (seat === -1) return;
  unoApply(room, () => {
    const wasUp = s.phase === 'play' && s.turn && s.turn.pid === playerId;
    const next = s.order.length > 1 ? unoNext(room, playerId) : null;
    if (s.phase === 'play' && g.hands[playerId]) g.deck = g.hands[playerId].concat(g.deck);
    delete g.hands[playerId];
    s.order.splice(seat, 1);
    s.said = (s.said || []).filter(id => id !== playerId);
    if (s.unoCatch === playerId) s.unoCatch = null;
    if (s.phase === 'gameover') return;
    unoEvent(room, 'left', { pid: playerId, name: name || '' });
    if (s.order.length < 2) {
      unoGameOver(room);
      return;
    }
    if (wasUp) unoStartTurn(room, next);
  });
};

/* --- computer players ---------------------------------------------------------------------
   Through the room's bot hook (ROOM_BOT_GAMES in RoomGames.js). A bot decides
   from its own slice (room.secrets[pid]: its hand, the card it drew) and what
   every phone sees (room.shared): the pile, the colour, the counts, who is
   next. Never another hand, never the deck.

   easy  plays the first card that fits, stacks when it can, and forgets to
         say UNO about one time in three - so the table can catch it.
   hard  plays to win: keeps its wilds for when it needs them, names the
         colour it holds most, hits the next player when they are close to
         going out, stacks, sheds its big cards when anyone is about to go
         out, swaps (7) with the smallest hand, always says UNO, catches a
         player who forgot after a human moment, and jumps in with the same
         card when that is on.
   ------------------------------------------------------------------------------------------ */
const UNO_BOT_FORGETS = 0.33;
const UNO_BOT_CATCH_MS = [1500, 2600];       // how long a hard bot takes to notice a missing UNO
const UNO_BOT_WAIT_MS = [2800, 3600];        // a bot up next leaves the table time to catch first
const UNO_BOT_JUMP_MS = [1100, 1800];

const unoBotRand = (range) => range[0] + Math.floor(Math.random() * (range[1] - range[0]));

/** The hard bots that could catch `target` now. */
const unoBotHunters = (room, target) => unoSeated(room).filter(id => id !== target && roomBotLevel(room, id) === 'hard');

/** A hard bot holding the very card on top, out of turn, when jump-in is on. */
const unoBotJumper = (room) => {
  const s = room.shared;
  const top = s.pile && s.pile[s.pile.length - 1];
  if (!s.settings.jumpIn || !top || unoIsWild(top.k) || !s.turn || s.turn.stage === 'color') return null;
  const id = unoSeated(room).find(pid => pid !== s.turn.pid && roomBotLevel(room, pid) === 'hard' &&
    ((room.secrets[pid] || {}).hand || []).some(c => unoSameCard(c.k, top.k)));
  return id || null;
};

/** The colour a bot names: the one it holds most (a tie, or nothing left, at random). */
const unoBotColor = (hand, without) => {
  const tally = {};
  UNO_COLORS.forEach(c => { tally[c] = 0; });
  hand.forEach(c => { if (String(c.i) !== String(without)) { const col = unoColorOf(c.k); if (col) tally[col]++; } });
  const best = Math.max.apply(null, UNO_COLORS.map(c => tally[c]));
  const pool = UNO_COLORS.filter(c => tally[c] === best);
  return pool[Math.floor(Math.random() * pool.length)];
};

/** Everything a play needs besides the card: a colour for a wild, someone to swap with for a 7, UNO. */
const unoBotPayload = (room, pid, hand, card, level, extra) => {
  const s = room.shared;
  const out = Object.assign({ card: card.i }, extra || {});
  if (unoIsWild(card.k)) out.color = unoBotColor(hand, card.i);
  const left = hand.length - 1;
  if (s.settings.sevenO && unoValueOf(card.k) === '7' && left > 0) {
    const others = unoSeated(room).filter(id => id !== pid);
    const counts = s.counts || {};
    if (level === 'hard') {
      const fewest = Math.min.apply(null, others.map(id => counts[id] || 0));
      const pool = others.filter(id => (counts[id] || 0) === fewest);
      out.target = pool[Math.floor(Math.random() * pool.length)];
    } else {
      out.target = others[Math.floor(Math.random() * others.length)];
    }
  }
  if (left === 1) out.uno = level === 'hard' || Math.random() >= UNO_BOT_FORGETS;
  return out;
};

/** The hard bot's pick among the cards that fit. */
const unoBotBest = (room, pid, hand, legal) => {
  const s = room.shared;
  const counts = s.counts || {};
  const others = unoSeated(room).filter(id => id !== pid);
  const next = unoNext(room, pid);
  const prev = unoNext(room, pid, -1);
  const danger = others.length ? Math.min.apply(null, others.map(id => counts[id] || 0)) : 9;
  const nextClose = (counts[next] || 0) <= 2;
  const late = hand.length <= 2 || danger <= 2;
  const held = {};
  hand.forEach(c => { const col = unoColorOf(c.k); if (col) held[col] = (held[col] || 0) + 1; });
  const score = (c) => {
    const v = unoValueOf(c.k);
    let sc = Math.random() * 2;
    if (unoIsWild(c.k)) sc -= late ? 0 : (c.k === 'w4' ? 45 : 32);        // a wild is kept for when it is needed
    else sc += (held[unoColorOf(c.k)] || 0) * 3;                           // stay in the colour it holds most
    if (nextClose && (v === 's' || v === 'd' || c.k === 'w4')) sc += 38;    // the next player is nearly out: hit them
    if (nextClose && v === 'v' && others.length > 1 && (counts[prev] || 0) > 2) sc += 22;
    sc += unoPoints(c.k) * (danger <= 2 ? 0.6 : 0.12);                     // shed the big ones when someone is close
    if (v === 'd') sc += 5;
    if (s.settings.sevenO && v === '7' && hand.length > 1) {
      const fewest = others.length ? Math.min.apply(null, others.map(id => counts[id] || 0)) : 99;
      sc += fewest < hand.length - 1 ? 26 + (hand.length - 1 - fewest) * 4 : -24;
    }
    if (s.settings.sevenO && v === '0' && hand.length > 1 && others.length) {
      // Every hand moves on one seat: this one takes the hand of the seat before it.
      sc += (counts[prev] || 0) < hand.length - 1 ? 16 : -16;
    }
    return sc;
  };
  return legal.slice().sort((a, b) => score(b) - score(a))[0];
};

/** A bot's move on its own turn. */
const unoBotTurn = (room, pid, level) => {
  const s = room.shared;
  const mine = room.secrets[pid] || {};
  const hand = mine.hand || [];
  const seq = s.turnSeq;
  const top = s.pile && s.pile[s.pile.length - 1];
  const topK = top ? top.k : null;
  if (s.turn.stage === 'color') return { action: 'pickColor', payload: { color: unoBotColor(hand, null), seq: seq } };
  if (s.turn.stage === 'drawn') {
    const card = hand.find(c => String(c.i) === String(mine.drawn));
    if (!card) return { action: 'keep', payload: { seq: seq } };
    // A hard bot keeps a wild it drew for later, while nobody is close to going out.
    const counts = s.counts || {};
    const danger = Math.min.apply(null, unoSeated(room).filter(id => id !== pid).map(id => counts[id] || 0).concat([9]));
    if (level === 'hard' && unoIsWild(card.k) && hand.length > 3 && danger > 2) return { action: 'keep', payload: { seq: seq } };
    return { action: 'play', payload: unoBotPayload(room, pid, hand, card, level, { seq: seq }) };
  }
  const legal = hand.filter(c => unoCanPlay(c.k, topK, s.color, s.pending, s.settings));
  if (s.pending) {
    if (!legal.length) return { action: 'take', payload: { seq: seq } };
    // Stack: a hard bot answers with a +2 before spending a +4.
    const pickIt = level === 'hard' ? (legal.find(c => c.k !== 'w4') || legal[0]) : legal[0];
    return { action: 'play', payload: unoBotPayload(room, pid, hand, pickIt, level, { seq: seq }) };
  }
  if (!legal.length) return { action: 'draw', payload: { seq: seq } };
  const card = level === 'hard' ? unoBotBest(room, pid, hand, legal) : legal[0];
  return { action: 'play', payload: unoBotPayload(room, pid, hand, card, level, { seq: seq }) };
};

/**
 * A person's turn with nothing in hand that can go (the owner, 21 Sep 2026):
 * the stack waiting is taken for them, or with none a card is drawn - there
 * is nothing else to do. A card drawn that fits still asks: play or keep.
 * While somebody can still be caught it waits as long as a bot would, or the
 * take would close the table's chance to say امسكه!.
 */
ROOM_FORCED_GAMES.uno = (room) => {
  const s = room.shared || {};
  const g = room._uno;
  if (s.phase !== 'play' || !s.turn || !g || s.turn.stage !== 'play') return null;
  const pid = s.turn.pid;
  const top = g.pile[g.pile.length - 1];
  if ((g.hands[pid] || []).some(c => unoCanPlay(c.k, top ? top.k : null, s.color, s.pending, s.settings))) return null;
  const action = s.pending ? 'take' : 'draw';
  return {
    pid: pid,
    key: s.turnSeq + '|' + action,
    delay: s.unoCatch ? unoBotRand(UNO_BOT_WAIT_MS) : ROOM_FORCED_DELAY_MS,
    move: { action: action, payload: { seq: s.turnSeq } }
  };
};

ROOM_BOT_GAMES.uno = {
  max: 12,
  pending(room) {
    const s = room.shared || {};
    if (s.phase !== 'play' || !s.turn || !room._uno) return null;
    // A player who forgot to say UNO: a hard bot notices after a moment.
    if (s.unoCatch) {
      const hunters = unoBotHunters(room, s.unoCatch);
      if (hunters.length) return { pid: hunters[0], key: 'catch|' + s.unoCatch + '|' + s.eventSeq, delay: unoBotRand(UNO_BOT_CATCH_MS) };
    }
    const jumper = unoBotJumper(room);
    if (jumper) {
      const top = s.pile[s.pile.length - 1];
      return { pid: jumper, key: 'jump|' + top.i, delay: unoBotRand(UNO_BOT_JUMP_MS) };
    }
    if (!isRoomBot(room, s.turn.pid)) return null;
    // Up next while someone can still be caught: the table gets the time to do it.
    const out = { pid: s.turn.pid, key: 'turn|' + s.turnSeq + '|' + s.turn.stage };
    if (s.unoCatch) out.delay = unoBotRand(UNO_BOT_WAIT_MS);
    return out;
  },
  decide(room, pid) {
    const s = room.shared || {};
    if (s.phase !== 'play' || !s.turn) return null;
    const level = roomBotLevel(room, pid) || 'easy';
    if (s.unoCatch && s.unoCatch !== pid && level === 'hard') return { action: 'catchUno', payload: { target: s.unoCatch } };
    if (s.turn.pid === pid) return unoBotTurn(room, pid, level);
    if (unoBotJumper(room) === pid) {
      const top = s.pile[s.pile.length - 1];
      const hand = (room.secrets[pid] || {}).hand || [];
      const card = hand.find(c => unoSameCard(c.k, top.k));
      if (card) return { action: 'jump', payload: unoBotPayload(room, pid, hand, card, level, { top: top.i }) };
    }
    return null;
  },
  fallback(room, pid) {
    const s = room.shared || {};
    if (s.phase !== 'play' || !s.turn || s.turn.pid !== pid) return null;
    const seq = s.turnSeq;
    if (s.turn.stage === 'color') return { action: 'pickColor', payload: { color: UNO_COLORS[Math.floor(Math.random() * 4)], seq: seq } };
    if (s.turn.stage === 'drawn') return { action: 'keep', payload: { seq: seq } };
    return s.pending ? { action: 'take', payload: { seq: seq } } : { action: 'draw', payload: { seq: seq } };
  }
};
