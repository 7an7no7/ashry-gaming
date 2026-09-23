/* ============================================================================
   الشايب — OLD MAID (rooms)
   ----------------------------------------------------------------------------
   Bundled into the Worker after RoomGames.js (FILES in rooms-worker/build.mjs),
   whose helpers it uses (shuffled, requireHost, staleTap). The cards are
   PlayingCards.js, shared with the page.

   The owner's rules (23 Sep 2026, asked one at a time):
     - A room and the TV only; 2 to 8 players; no computer players.
     - A drawn الشايب card is added to the deck, and a pair is two cards of
       the same rank and the same colour (7♥ + 7♦, K♠ + K♣).
     - The deck grows with the table: about 8 pairs a player, at most the 26
       pairs of a whole deck (52 cards), and الشايب. Every card is dealt, and
       the pairs in the dealt hands go out at the start.
     - A turn: draw one card blind from the next player who still holds
       cards; a pair it makes goes out. An empty hand is safe (the order the
       players got out is kept). The last one holding cards holds الشايب and
       loses.
     - How hands are held, a lobby switch: rearranged by dragging (on by
       default) or shuffled by the server after every turn.
     - One loser a game, and a tally across play again (the board: fewest
       times الشايب first).
     - A turn clock, off by default, 15 or 30 seconds: a card is drawn at
       random. The host's skip does the same for a quiet phone.
     - Leaving: that player's cards go into the next hand still playing (and
       its pairs go out); fewer than two left ends the game.

   The draw, as at a real table (designed for the owner): the drawer lifts a
   card of the other hand (lift { pos }), everyone sees which back is up, and
   a second tap takes it (take). Meanwhile the one being drawn from may drag
   their cards about (move { card, to }): the lifted card moves with its card,
   because the aim is kept by card id and only shown as a position. With the
   hands shuffled instead, nobody drags.

   Where the cards are:
     room._om            every hand, in the order it is held ({ i, c }), and
                         the card lifted (aimId). Never projected.
     room.secrets[pid]   that phone's own hand, in its order.
     room.shared         how many cards each holds, whose turn and from whom,
                         where the lifted card is (a position), who is out and
                         in what order, the pairs thrown out (their faces are
                         public, as on a table) and every move as an event.
                         Which card was drawn, and where it went, is never
                         in it: a card's id is seen by its holder only, and a
                         drawn card goes into the drawer's hand at a random
                         place under a fresh id, so the one who gave it up
                         can't follow it.
   ========================================================================= */
const OM_CLOCKS = [0, 15, 30];
const OM_MODES = ['drag', 'shuffle'];
const OM_EVENTS = 40;
const OM_GRACE_MS = 1500;
const OM_MIN = 2;
const OM_MAX = 8;
const OM_PAIRS_EACH = 8;
const OM_ALL_PAIRS = 26;

/** The pairs dealt for `n` players: about eight each, at most a whole deck's 26. */
const omPairsFor = (n) => Math.min(OM_ALL_PAIRS, OM_PAIRS_EACH * Math.max(1, n));
const omHere = (room, id) => room.players.some(p => p.id === id);

const oldMaidAction = (room, playerId, action, payload) => {
  const p = payload || {};
  if (action === 'start' || action === 'playAgain') { omNewGame(room, playerId, action, p); return; }
  const s = room.shared;
  if (!s || !s.phase || !room._om) throw new Error('اللعبة لم تبدأ بعد');
  if (s.phase !== 'play') return;
  if (action === 'skipTurn') {
    requireHost(room, playerId);
    if (staleTap(p, 'seq', s.turnSeq)) return;
    omApply(room, () => omAuto(room, 'host'));
    return;
  }
  if (action === 'move') { omApply(room, () => omMove(room, playerId, p)); return; }
  if (staleTap(p, 'seq', s.turnSeq)) return;
  if (action === 'lift') { omApply(room, () => omLift(room, playerId, p)); return; }
  if (action === 'take') { omApply(room, () => omTake(room, playerId, p)); return; }
  throw new Error('إجراء غير معروف');
};

const omApply = (room, change) => {
  change();
  omSync(room);
};

const omEvent = (room, type, fields) => {
  const s = room.shared;
  s.eventSeq = (s.eventSeq || 0) + 1;
  s.events = (s.events || []).concat([Object.assign({ seq: s.eventSeq, type: type }, fields || {})]).slice(-OM_EVENTS);
};

/* --- a game --------------------------------------------------------------------- */

const omNewGame = (room, playerId, action, p) => {
  requireHost(room, playerId);
  const prev = room.shared || {};
  if (action === 'playAgain' && prev.phase !== 'gameover') return;
  if (room.players.length < OM_MIN) throw new Error('الشايب محتاج لاعبين على الأقل');
  if (room.players.length > OM_MAX) throw new Error('الشايب لحد 8 لاعبين');
  const was = action === 'playAgain' ? (prev.settings || {}) : {};
  const mode = OM_MODES.indexOf(p.mode) !== -1 ? p.mode : (OM_MODES.indexOf(was.mode) !== -1 ? was.mode : 'drag');
  const clock = OM_CLOCKS.indexOf(Number(p.turnClock)) !== -1 ? Number(p.turnClock) : (OM_CLOCKS.indexOf(Number(was.turnClock)) !== -1 ? Number(was.turnClock) : 0);
  const order = shuffled(room.players.map(pl => pl.id));
  room.secrets = {};
  room.shared = {
    settings: { mode: mode, turnClock: clock },
    order: order,
    roster: order.slice(),
    // How many times each has been left holding الشايب, across play again.
    losses: action === 'playAgain' && prev.losses ? prev.losses : {},
    turnSeq: (prev.turnSeq || 0) + 1,
    eventSeq: prev.eventSeq || 0,
    dealId: newDealId()
  };
  omDeal(room);
  omSync(room);
};

const omDeal = (room) => {
  const s = room.shared;
  const n = s.order.length;
  // The 26 pairs of a deck are a rank and a colour; the table gets as many as it needs, picked at random.
  const kinds = [];
  PC_RANKS.forEach(r => { kinds.push([r + 'h', r + 'd']); kinds.push([r + 's', r + 'c']); });
  const pairs = shuffled(kinds).slice(0, omPairsFor(n));
  const cards = shuffled([].concat.apply([], pairs).concat([PC_OLD_MAID]));
  const g = { hands: {}, aimId: null, nextId: 1 };
  room._om = g;
  s.order.forEach(id => { g.hands[id] = []; });
  const start = Math.floor(Math.random() * n);
  cards.forEach((c, j) => { g.hands[s.order[(start + j) % n]].push({ i: omNewId(g), c: c }); });
  s.phase = 'play';
  room.phase = 'play';
  s.pairs = pairs.length;
  s.deckSize = cards.length;
  s.thrown = [];
  s.out = [];
  s.loser = null;
  s.reveal = null;
  s.ended = null;
  s.turn = null;
  s.aim = null;
  s.endsAt = null;
  s.events = [];
  omEvent(room, 'deal', { n: cards.length, pairs: pairs.length });
  // The pairs in each dealt hand go out, one player after another.
  s.order.forEach(id => {
    const out = omThrowPairs(room, id);
    if (out.length) omEvent(room, 'pairs', { pid: id, cards: out, deal: true });
  });
  s.order.forEach(id => { if (!g.hands[id].length) omSafe(room, id); });
  if (omHolding(room).length <= 1) { omGameOver(room); return; }
  const first = omHolding(room)[0];
  omStartTurn(room, omHolding(room).indexOf(s.order[0]) !== -1 ? s.order[0] : first);
};

/** A fresh id: random-looking, never reused, and saying nothing about the card. */
const omNewId = (g) => {
  g.nextId = (g.nextId || 1) + 1 + Math.floor(Math.random() * 7);
  return g.nextId;
};

/* --- who is still playing ---------------------------------------------------------- */

const omHand = (room, id) => (room._om.hands[id] || []);
/** Those still holding cards, in seat order. */
const omHolding = (room) => (room.shared.order || []).filter(id => omHere(room, id) && omHand(room, id).length > 0);

/** The next seat after `pid` still holding cards (never `pid` itself). */
const omNextHolding = (room, pid) => {
  const s = room.shared;
  const n = s.order.length;
  const at = s.order.indexOf(pid);
  const holding = omHolding(room);
  for (let k = 1; k < n; k++) {
    const id = s.order[((at === -1 ? n - 1 : at) + k) % n];
    if (id !== pid && holding.indexOf(id) !== -1) return id;
  }
  return null;
};

/** `pid` draws from the next hand still playing. */
const omStartTurn = (room, pid) => {
  const s = room.shared;
  const from = omNextHolding(room, pid);
  if (!pid || !from) { omGameOver(room); return; }
  room._om.aimId = null;
  s.turn = { pid: pid, from: from };
  s.turnSeq = (s.turnSeq || 0) + 1;
  s.endsAt = s.settings.turnClock ? Date.now() + s.settings.turnClock * 1000 : null;
};

/* --- pairs, safety, the end ---------------------------------------------------------- */

/** Throws every pair out of a hand; returns the cards thrown, two by two ([a, b, a, b...]). */
const omThrowPairs = (room, pid) => {
  const s = room.shared;
  const g = room._om;
  const out = [];
  let hand = omHand(room, pid).slice();
  for (let a = 0; a < hand.length; a++) {
    const b = hand.findIndex((x, k) => k > a && pcPairs(hand[a].c, x.c));
    if (b === -1) continue;
    out.push(hand[a].c, hand[b].c);
    s.thrown.push({ pid: pid, cards: [hand[a].c, hand[b].c] });
    hand = hand.filter((x, k) => k !== a && k !== b);
    a--;
  }
  g.hands[pid] = hand;
  return out;
};

/** An empty hand is safe: a place in the order out. */
const omSafe = (room, pid) => {
  const s = room.shared;
  if (s.out.indexOf(pid) !== -1) return;
  s.out.push(pid);
  omEvent(room, 'out', { pid: pid, place: s.out.length });
};

/** One hand still holding cards (الشايب) loses; fewer than two players left ends it with no loser. */
const omGameOver = (room, why) => {
  const s = room.shared;
  if (s.phase === 'gameover') return;
  const holding = omHolding(room);
  const present = (s.order || []).filter(id => omHere(room, id));
  const loser = why !== 'left' && holding.length === 1 && present.length >= 2 ? holding[0] : null;
  s.phase = 'gameover';
  room.phase = 'gameover';
  s.turn = null;
  s.aim = null;
  s.endsAt = null;
  room._om.aimId = null;
  s.loser = loser;
  s.ended = loser ? 'lost' : 'left';
  if (loser) {
    s.losses[loser] = (s.losses[loser] || 0) + 1;
    // Only now is a hand shown: الشايب, turned over in the loser's hand.
    s.reveal = { pid: loser, cards: omHand(room, loser).map(c => c.c) };
  }
  omEvent(room, 'over', { pid: loser });
};

/* --- the moves ----------------------------------------------------------------------- */

const omTurnCheck = (room, me) => {
  const s = room.shared;
  if (!s.turn || s.turn.pid !== me) throw new Error('مش دورك');
};

/** The drawer lifts a card of the other hand, by where it sits now. */
const omLift = (room, me, p) => {
  const s = room.shared;
  omTurnCheck(room, me);
  const hand = omHand(room, s.turn.from);
  const pos = Number(p.pos);
  if (!Number.isInteger(pos) || pos < 0 || pos >= hand.length) throw new Error('اختار كارت');
  room._om.aimId = hand[pos].i;
};

/** Takes the lifted card, or with `pos` the card there (a lift and a take in one). */
const omTake = (room, me, p) => {
  const s = room.shared;
  omTurnCheck(room, me);
  const g = room._om;
  const hand = omHand(room, s.turn.from);
  let at = hand.findIndex(c => c.i === g.aimId);
  if (p.pos !== undefined && p.pos !== null && at === -1) {
    const pos = Number(p.pos);
    if (Number.isInteger(pos) && pos >= 0 && pos < hand.length) at = pos;
  }
  if (at === -1) throw new Error('ارفع كارت الأول');
  omDraw(room, at, null);
};

/** The draw itself: the card at `at` of the other hand goes into the drawer's, and the turn moves on. */
const omDraw = (room, at, why) => {
  const s = room.shared;
  const g = room._om;
  const me = s.turn.pid;
  const from = s.turn.from;
  const theirs = omHand(room, from);
  const card = theirs[at];
  g.hands[from] = theirs.filter((c, k) => k !== at);
  // Into the drawer's hand at a random place, under a fresh id: the one who gave it up can't follow it.
  const mine = omHand(room, me).slice();
  mine.splice(Math.floor(Math.random() * (mine.length + 1)), 0, { i: omNewId(g), c: card.c });
  g.hands[me] = mine;
  g.aimId = null;
  s.aim = null;
  omEvent(room, 'draw', { pid: me, from: from, pos: at, left: g.hands[from].length, auto: why || null });
  const out = omThrowPairs(room, me);
  if (out.length) omEvent(room, 'pairs', { pid: me, cards: out });
  if (!g.hands[from].length) omSafe(room, from);
  if (!g.hands[me].length) omSafe(room, me);
  // Shuffled hands: every hand still playing is shuffled after every turn.
  if (s.settings.mode === 'shuffle') {
    omHolding(room).forEach(id => { g.hands[id] = shuffled(g.hands[id]); });
    omEvent(room, 'shuffle', {});
  }
  if (omHolding(room).length <= 1) { omGameOver(room); return; }
  // The turn goes on round the table: the next still playing after the drawer.
  omStartTurn(room, omNextHolding(room, me));
};

/** A player moves a card of their own hand to another place (drag mode). */
const omMove = (room, me, p) => {
  const s = room.shared;
  if (s.settings.mode !== 'drag') throw new Error('الورق بيتخلط لوحده في اللعبة دي');
  const hand = omHand(room, me).slice();
  const from = hand.findIndex(c => String(c.i) === String(p.card));
  if (from === -1) return;                         // gone already (drawn meanwhile): nothing to do
  const to = Math.max(0, Math.min(hand.length - 1, Math.floor(Number(p.to))));
  if (!Number.isFinite(to) || to === from) return;
  const [card] = hand.splice(from, 1);
  hand.splice(to, 0, card);
  room._om.hands[me] = hand;
  omEvent(room, 'move', { pid: me, from: from, to: to });
};

/** The clock, or the host for a quiet phone: a card at random (the lifted one, if there is one). */
const omAuto = (room, why) => {
  const s = room.shared;
  if (!s.turn) return;
  const hand = omHand(room, s.turn.from);
  if (!hand.length) return;
  const lifted = hand.findIndex(c => c.i === room._om.aimId);
  omEvent(room, 'auto', { pid: s.turn.pid, why: why });
  omDraw(room, lifted !== -1 ? lifted : Math.floor(Math.random() * hand.length), why);
};

/* --- what every phone may see ------------------------------------------------------ */

const omSync = (room) => {
  const s = room.shared;
  const g = room._om;
  if (!s || !g) return;
  const counts = {};
  (s.order || []).forEach(id => { counts[id] = omHand(room, id).length; });
  s.counts = counts;
  // Where the lifted card sits now in the hand it is being drawn from.
  if (s.phase === 'play' && s.turn && g.aimId !== null) {
    const pos = omHand(room, s.turn.from).findIndex(c => c.i === g.aimId);
    s.aim = pos === -1 ? null : { pos: pos };
    if (pos === -1) g.aimId = null;
  } else {
    s.aim = null;
  }
  room.secrets = {};
  (s.order || []).filter(id => omHere(room, id)).forEach(id => {
    room.secrets[id] = { hand: omHand(room, id).map(c => ({ i: c.i, c: c.c })) };
  });
  s.board = omBoard(room);
};

/** The night's board: the fewest times left holding الشايب first. */
const omBoard = (room) => {
  const s = room.shared;
  return (s.order || []).filter(id => omHere(room, id))
    .map(id => ({ id: id, name: roomPlayerName(room, id), score: (s.losses || {})[id] || 0 }))
    .sort((a, b) => a.score - b.score);
};

/* --- the server's clock ------------------------------------------------------------ */

const omDeadline = (room) => {
  const s = room.shared || {};
  return s.phase === 'play' && s.turn && s.endsAt ? s.endsAt + OM_GRACE_MS : null;
};

const omTimeout = (room, now) => {
  const s = room.shared || {};
  if (s.phase !== 'play' || !s.turn || !s.endsAt || now < s.endsAt + OM_GRACE_MS || !room._om) return false;
  omApply(room, () => omAuto(room, 'clock'));
  return true;
};

/* --- someone leaves: their cards go to the next hand still playing ----------------- */

const omPlayerLeft = (room, playerId) => {
  const s = room.shared;
  const g = room._om;
  if (!s || !g || s.phase !== 'play' || (s.order || []).indexOf(playerId) === -1) return;
  const cards = omHand(room, playerId);
  const drawer = s.turn ? s.turn.pid : null;
  const heir = omNextHolding(room, playerId);
  g.hands[playerId] = [];
  let pairs = [];
  if (cards.length && heir) {
    g.hands[heir] = omHand(room, heir).concat(cards.map(c => ({ i: omNewId(g), c: c.c })));
    if (s.settings.mode === 'shuffle') g.hands[heir] = shuffled(g.hands[heir]);
    pairs = omThrowPairs(room, heir);
  }
  omEvent(room, 'left', { pid: playerId, to: cards.length ? heir : null, n: cards.length });
  if (pairs.length) omEvent(room, 'pairs', { pid: heir, cards: pairs });
  if (heir && !omHand(room, heir).length) omSafe(room, heir);
  const present = (s.order || []).filter(id => omHere(room, id));
  if (present.length < 2) omGameOver(room, 'left');
  else if (omHolding(room).length <= 1) omGameOver(room);
  else if (drawer === playerId || !omHere(room, drawer) || omHolding(room).indexOf(drawer) === -1) {
    // The drawer is gone: the next one still playing draws.
    omStartTurn(room, omNextHolding(room, playerId));
  } else if (s.turn && (s.turn.from === playerId || omHolding(room).indexOf(s.turn.from) === -1)) {
    // The hand being drawn from is gone: the drawer draws from the next one, and lifts again - a new
    // turn, so a tap aimed at the old hand is dropped as stale and the clock starts over.
    omStartTurn(room, drawer);
  }
  omSync(room);
};
