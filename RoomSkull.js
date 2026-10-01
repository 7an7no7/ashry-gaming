/* ============================================================================
   جمجمة — SKULL (rooms)
   ----------------------------------------------------------------------------
   Bundled into the Worker after RoomGames.js (FILES in rooms-worker/build.mjs),
   whose helpers it uses (shuffled, requireHost, requireMoveOn, staleTap, the
   bot hook, the forced moves). The faces and the bots' judgement are Skull.js,
   shared with the page.

   The owner's rules (28 Sep 2026, every one answered):
     - Rooms and the TV only, 3 to 8 players (computer players count), four
       discs each: three flowers and a skull, the same back.
     - A round: everyone lays one disc face down at once. Then in turn from the
       round's starter, each adds a disc from their hand or opens the bet: a
       number of flowers, 1 up to every disc on the table. From the first bet
       nobody adds: in turn each raises or passes, a pass final for the round,
       until everyone else has passed (or the bet is every disc on the table).
     - «هيعملها؟» (our own touch): before the flips everyone else taps ✅ or ❌,
       a point for guessing right, shown with the result. A side tally.
     - The bidder turns over their own pile first, all of it, then the top
       discs of other piles one at a time until the number is reached. All
       flowers: the bet is won. A skull: the bidder loses a disc for good - one
       of theirs at random that only they see; their own skull, they choose.
     - Two won bets win the game, or the last one in. A player with no discs
       left is out. The skull's owner starts the next round (the bidder, if it
       was their own; a won bet: the bidder), or the next seat still in.
     - A turn clock off by default, 30 or 60 seconds, and the host's "play for"
       a quiet phone (skullAuto).

   Where the discs are:
     room._skull         every disc ({ i, f }), every hand and every pile (ids),
                         the «هيعملها؟» answers. Never projected.
     room.secrets[pid]   that phone's own hand and pile (faces, bottom to top),
                         its own answer, and the faces it has lost (only the
                         bidder learns what a skull took).
     room.shared         the table: seats, colours, the discs each has left,
                         each pile's size, whose turn, the bet and the bids,
                         who passed, who has answered, the discs turned over
                         (faces public once flipped), the bets won, the result
                         (the answers only then), and every move as an event.
   ========================================================================= */
const SKULL_EVENTS = 40;
const SKULL_GRACE_MS = 1500;
const SKULL_GUESS_MS = 8000;          // «هيعملها؟»: the window before the flips
const SKULL_BETWEEN_MS = 6500;        // the result on every screen, then the next round
const SKULL_BOT_MS = [1100, 1900];
const SKULL_BOT_PLACE_MS = [450, 900];
const SKULL_BOT_GUESS_MS = [700, 1700];

const skullHere = (room, id) => room.players.some(p => p.id === id);
const skullRand = (r) => r[0] + Math.floor(Math.random() * (r[1] - r[0]));

const skullAction = (room, playerId, action, payload) => {
  const p = payload || {};
  if (action === 'start' || action === 'playAgain') { skullNewGame(room, playerId, action, p); return; }
  const s = room.shared;
  const g = room._skull;
  if (!s || !s.phase || !g) throw new Error('اللعبة لم تبدأ بعد');
  if (s.phase === 'gameover') return;
  if (action === 'skipTurn') {
    requireMoveOn(room, playerId);
    if (staleTap(p, 'seq', s.turnSeq)) return;
    // In the laying the host's phone names the quiet phones (`pids`): only they are laid for.
    const only = Array.isArray(p.pids) ? p.pids.map(String) : null;
    skullApply(room, () => skullAuto(room, 'host', only));
    return;
  }
  if (action === 'nextRound') {
    requireMoveOn(room, playerId);
    if (s.phase !== 'result' || staleTap(p, 'round', s.round)) return;
    skullApply(room, () => skullDealRound(room, s.nextStarter));
    return;
  }
  if (action === 'place') {
    if (s.phase !== 'place' || staleTap(p, 'round', s.round)) return;
    skullApply(room, () => skullPlace(room, playerId, p.disc));
    return;
  }
  if (action === 'guess') {
    if (s.phase !== 'guess' || staleTap(p, 'round', s.round)) return;
    skullApply(room, () => skullGuess(room, playerId, p.yes));
    return;
  }
  if (staleTap(p, 'seq', s.turnSeq)) return;
  if (action === 'add') { skullApply(room, () => skullAdd(room, playerId, p.disc)); return; }
  if (action === 'bid') { skullApply(room, () => skullBid(room, playerId, p.n)); return; }
  if (action === 'pass') { skullApply(room, () => skullPass(room, playerId)); return; }
  if (action === 'flip') { skullApply(room, () => skullFlip(room, playerId, p.target)); return; }
  if (action === 'lose') { skullApply(room, () => skullLoseChoice(room, playerId, p.disc)); return; }
  throw new Error('إجراء غير معروف');
};

/** Runs a change, then writes what every phone may see. */
const skullApply = (room, change) => {
  change();
  skullSync(room);
};

const skullEvent = (room, type, fields) => {
  const s = room.shared;
  s.eventSeq = (s.eventSeq || 0) + 1;
  s.events = (s.events || []).concat([Object.assign({ seq: s.eventSeq, type: type }, fields || {})]).slice(-SKULL_EVENTS);
};

/* --- a game ------------------------------------------------------------------ */

const skullNewGame = (room, playerId, action, p) => {
  requireHost(room, playerId);
  const prev = room.shared || {};
  if (action === 'playAgain' && prev.phase !== 'gameover') return;
  if (room.players.length < SKULL_MIN) throw new Error('جمجمة محتاجة 3 لاعبين على الأقل: ضيف لاعب كمبيوتر');
  if (room.players.length > SKULL_MAX) throw new Error('جمجمة لحد 8 لاعبين');
  const was = action === 'playAgain' ? (prev.settings || {}) : {};
  const clock = SKULL_CLOCKS.indexOf(Number(p.turnClock)) !== -1 ? Number(p.turnClock)
    : (SKULL_CLOCKS.indexOf(Number(was.turnClock)) !== -1 ? Number(was.turnClock) : 0);
  const order = shuffled(room.players.map(pl => pl.id));
  const colors = {};
  const flowers = {};
  order.forEach((id, k) => { colors[id] = k % SKULL_COLORS; flowers[id] = skullFlowerOf(k); });
  // Ids at random across the table, so an id says nothing about its face or its owner.
  const ids = shuffled(order.map((id, k) => [0, 1, 2, 3].map(j => k * 4 + j + 1)).reduce((a, b) => a.concat(b), []));
  const g = { discs: {}, hands: {}, piles: {}, guesses: {}, lost: {} };
  let n = 0;
  order.forEach((id, k) => {
    g.discs[id] = skullStartFaces(k).map(f => ({ i: ids[n++], f: f }));
    g.lost[id] = [];
  });
  room._skull = g;
  room.secrets = {};
  room.shared = {
    settings: { turnClock: clock },
    order: order,
    roster: order.slice(),
    colors: colors,
    flowers: flowers,
    alive: order.slice(),
    wins: {},
    guessPts: {},
    round: 0,
    // The games won at this table, counted across play again: the board.
    tally: action === 'playAgain' && prev.tally ? prev.tally : {},
    // Carried over a play again, so a tap or an animation from the last game is never taken for this one.
    turnSeq: (prev.turnSeq || 0) + 1,
    eventSeq: prev.eventSeq || 0,
    events: [],
    dealId: newDealId()
  };
  room.phase = 'play';
  skullEvent(room, 'deal', { n: order.length });
  skullDealRound(room, order[0]);
  skullSync(room);
};

/** A new round: every disc back in its hand, everyone to lay one. */
const skullDealRound = (room, starter) => {
  const s = room.shared;
  const g = room._skull;
  s.round = (s.round || 0) + 1;
  s.alive.forEach(id => { g.hands[id] = (g.discs[id] || []).map(d => d.i); g.piles[id] = []; });
  Object.keys(g.piles).forEach(id => { if (s.alive.indexOf(id) === -1) { g.piles[id] = []; g.hands[id] = []; } });
  g.guesses = {};
  s.phase = 'place';
  s.starter = skullStarterFrom(room, starter);
  s.placed = [];
  s.turn = null;
  s.bid = null;
  s.bids = [];
  s.passed = [];
  s.guessed = [];
  s.guessEndsAt = null;
  s.flip = null;
  s.flipped = [];
  s.result = null;
  s.nextStarter = null;
  s.nextAt = null;
  s.turnSeq = (s.turnSeq || 0) + 1;
  s.endsAt = s.settings.turnClock ? Date.now() + s.settings.turnClock * 1000 : null;
  skullEvent(room, 'round', { round: s.round, starter: s.starter });
};

/* --- who is still in, and whose turn ------------------------------------------ */

const skullDisc = (room, pid, id) => (room._skull.discs[pid] || []).find(d => String(d.i) === String(id));
const skullFaceOf = (room, pid, id) => (skullDisc(room, pid, id) || {}).f;
const skullTableTotal = (room) => room.shared.alive.reduce((a, id) => a + (room._skull.piles[id] || []).length, 0);

/** `pid` if still in, else the next seat after them that is. */
const skullStarterFrom = (room, pid) => {
  const s = room.shared;
  if (s.alive.indexOf(pid) !== -1) return pid;
  return skullNextSeat(room, pid, () => true);
};

/** The next seat after `pid` still in and passing `ok`. */
const skullNextSeat = (room, pid, ok) => {
  const s = room.shared;
  const n = s.order.length;
  const at = s.order.indexOf(pid);
  for (let k = 1; k <= n; k++) {
    const id = s.order[((at === -1 ? n - 1 : at) + k) % n];
    if (s.alive.indexOf(id) !== -1 && ok(id)) return id;
  }
  return null;
};

const skullStartTurn = (room, pid) => {
  const s = room.shared;
  s.turn = pid ? { pid: pid } : null;
  s.turnSeq = (s.turnSeq || 0) + 1;
  s.endsAt = pid && s.settings.turnClock ? Date.now() + s.settings.turnClock * 1000 : null;
};

const skullMustBeUp = (room, me) => {
  const s = room.shared;
  if (!s.turn || s.turn.pid !== me) throw new Error('مش دورك');
};

/* --- laying discs ------------------------------------------------------------- */

const skullTakeFromHand = (room, me, disc) => {
  const g = room._skull;
  const hand = g.hands[me] || [];
  const at = hand.findIndex(i => String(i) === String(disc));
  if (at === -1) throw new Error('اختار قرص من إيدك');
  const id = hand[at];
  g.hands[me] = hand.slice(0, at).concat(hand.slice(at + 1));
  g.piles[me] = (g.piles[me] || []).concat([id]);
};

const skullPlace = (room, me, disc) => {
  const s = room.shared;
  if (s.alive.indexOf(me) === -1) throw new Error('انت مش في الجولة دي');
  if (s.placed.indexOf(me) !== -1) return;           // already laid: a double tap
  skullTakeFromHand(room, me, disc);
  s.placed.push(me);
  skullEvent(room, 'place', { pid: me });
  skullAfterPlace(room);
};

/** Everyone has laid a disc: the starter is up. */
const skullAfterPlace = (room) => {
  const s = room.shared;
  if (s.phase !== 'place') return;
  if (!s.alive.every(id => s.placed.indexOf(id) !== -1)) return;
  s.phase = 'add';
  skullStartTurn(room, skullStarterFrom(room, s.starter));
};

const skullAdd = (room, me, disc) => {
  const s = room.shared;
  if (s.phase !== 'add') throw new Error('الرهان بدأ: مينفعش تزوّد');
  skullMustBeUp(room, me);
  skullTakeFromHand(room, me, disc);
  skullEvent(room, 'add', { pid: me });
  skullStartTurn(room, skullNextSeat(room, me, () => true));
};

/* --- the bet -------------------------------------------------------------------- */

const skullBid = (room, me, value) => {
  const s = room.shared;
  if (s.phase !== 'add' && s.phase !== 'bid') throw new Error('مش وقت الرهان');
  skullMustBeUp(room, me);
  const n = Math.floor(Number(value));
  const total = skullTableTotal(room);
  const range = skullBidRange(total, s.bid);
  if (!(n >= range.min && n <= range.max)) throw new Error(n > range.max ? 'مفيش أقراص كفاية على الترابيزة' : 'لازم تزوّد عن الرهان اللي قبلك');
  const opening = s.phase === 'add';
  s.phase = 'bid';
  s.bid = { pid: me, n: n };
  s.bids = (s.bids || []).concat([{ pid: me, n: n }]);
  skullEvent(room, 'bid', { pid: me, n: n, open: opening });
  skullAuctionNext(room, me);
};

const skullPass = (room, me) => {
  const s = room.shared;
  if (s.phase !== 'bid') throw new Error(s.phase === 'add' ? 'لازم تزوّد قرص أو تراهن' : 'مش وقت الرهان');
  skullMustBeUp(room, me);
  if (s.passed.indexOf(me) === -1) s.passed.push(me);
  skullEvent(room, 'pass', { pid: me });
  skullAuctionNext(room, me);
};

/** After a bid or a pass: the next still in the auction, or the auction is over. */
const skullAuctionNext = (room, from) => {
  const s = room.shared;
  if (!s.bid) return;
  const open = (id) => id !== s.bid.pid && s.passed.indexOf(id) === -1;
  if (s.bid.n >= skullTableTotal(room) || !s.alive.some(open)) { skullAuctionEnd(room); return; }
  skullStartTurn(room, skullNextSeat(room, from, open));
};

/** The bet stands: «هيعملها؟» on every other phone, then the flips. */
const skullAuctionEnd = (room) => {
  const s = room.shared;
  s.phase = 'guess';
  s.flip = { pid: s.bid.pid, n: s.bid.n, got: 0, own: false };
  s.guessed = [];
  s.guessEndsAt = Date.now() + SKULL_GUESS_MS;
  skullStartTurn(room, null);
  s.endsAt = null;
  skullEvent(room, 'won', { pid: s.bid.pid, n: s.bid.n });
  if (!skullGuessers(room).length) skullStartFlip(room);
};

/** Who answers «هيعملها؟»: everyone seated at this game and still in the room, but the bidder. */
const skullGuessers = (room) => {
  const s = room.shared;
  return (s.order || []).filter(id => skullHere(room, id) && (!s.flip || id !== s.flip.pid));
};

const skullGuess = (room, me, yes) => {
  const s = room.shared;
  if (skullGuessers(room).indexOf(me) === -1) throw new Error('انت اللي هتقلب');
  if (s.guessed.indexOf(me) !== -1) return;
  room._skull.guesses[me] = !!yes;
  s.guessed.push(me);
  skullEvent(room, 'guessed', { pid: me });
  if (skullGuessers(room).every(id => s.guessed.indexOf(id) !== -1)) skullStartFlip(room);
};

const skullStartFlip = (room) => {
  const s = room.shared;
  if (s.phase !== 'guess') return;
  s.phase = 'flip';
  s.guessEndsAt = null;
  skullStartTurn(room, s.flip.pid);
};

/* --- turning discs over ----------------------------------------------------------- */

/** The face-down discs still in a pile (from the top down). */
const skullLeft = (room, pid) => {
  const pile = room._skull.piles[pid] || [];
  const turned = (room.shared.flipped || []).filter(x => x.owner === pid).length;
  return pile.length - turned;
};

const skullFlip = (room, me, target) => {
  const s = room.shared;
  if (s.phase !== 'flip') throw new Error('مش وقت القلب');
  skullMustBeUp(room, me);
  const g = room._skull;
  const f = s.flip;
  const who = String(target || '');
  if (!f.own) {
    if (who !== me) throw new Error('اقلب أقراصك انت الأول');
    // Your own pile, all of it, from the top down.
    const pile = (g.piles[me] || []).slice().reverse();
    const faces = pile.map(i => skullFaceOf(room, me, i));
    f.own = true;
    faces.forEach(face => s.flipped.push({ owner: me, f: face }));
    const skull = faces.indexOf(SKULL_FACE) !== -1;
    f.got += skullCount(faces, skullIsFlower);
    skullEvent(room, 'flipOwn', { pid: me, faces: faces });
    if (skull) { skullBetLost(room, me); return; }
    if (f.got >= f.n) { skullBetWon(room); return; }
    skullStartTurn(room, me);
    return;
  }
  if (who === me) throw new Error('أقراصك اتقلبت خلاص');
  if (s.alive.indexOf(who) === -1 || skullLeft(room, who) <= 0) throw new Error('مفيش أقراص تتقلب هنا');
  const pile = g.piles[who];
  const id = pile[skullLeft(room, who) - 1];
  const face = skullFaceOf(room, who, id);
  s.flipped.push({ owner: who, f: face });
  skullEvent(room, 'flip', { pid: me, owner: who, f: face });
  if (face === SKULL_FACE) { skullBetLost(room, who); return; }
  f.got += 1;
  if (f.got >= f.n) { skullBetWon(room); return; }
  skullStartTurn(room, me);
};

/* The piles stay on the table until the next round is dealt (skullDealRound
   puts every disc back in its hand), so the screens can show the round's flips
   beside its result. */

const skullBetWon = (room) => {
  const s = room.shared;
  const bidder = s.flip.pid;
  s.wins[bidder] = (s.wins[bidder] || 0) + 1;
  skullEvent(room, 'betWon', { pid: bidder, n: s.flip.n, wins: s.wins[bidder] });
  skullRoundOver(room, { ok: true, skullOwner: null, next: bidder });
};

const skullBetLost = (room, owner) => {
  const s = room.shared;
  const bidder = s.flip.pid;
  skullEvent(room, 'skull', { pid: bidder, owner: owner });
  if (owner === bidder && (room._skull.discs[bidder] || []).length > 1) {
    // Their own skull: they choose what to give up.
    s.phase = 'lose';
    s.result = { bidder: bidder, n: s.flip.n, ok: false, skullOwner: owner, own: true };
    skullStartTurn(room, bidder);
    return;
  }
  const discs = room._skull.discs[bidder] || [];
  const d = owner === bidder ? discs[0] : discs[Math.floor(Math.random() * discs.length)];
  skullLoseDisc(room, bidder, d, owner === bidder);
  skullRoundOver(room, { ok: false, skullOwner: owner, next: owner });
};

const skullLoseChoice = (room, me, disc) => {
  const s = room.shared;
  if (s.phase !== 'lose') throw new Error('مش وقت ده');
  skullMustBeUp(room, me);
  const d = skullDisc(room, me, disc);
  if (!d) throw new Error('اختار قرص من أقراصك');
  skullLoseDisc(room, me, d, true);
  skullRoundOver(room, { ok: false, skullOwner: me, next: me });
};

/** A disc gone for good: only its owner's phone is told which (room._skull.lost). */
const skullLoseDisc = (room, pid, d, own) => {
  const g = room._skull;
  if (!d) return;
  g.discs[pid] = (g.discs[pid] || []).filter(x => x !== d);
  // Not taken out of the hand or the pile: their public counts would say where
  // the lost disc was (the skull still in hand, say). skullDealRound rebuilds both.
  g.lost[pid] = (g.lost[pid] || []).concat([{ i: d.i, f: d.f, round: room.shared.round }]);
  skullEvent(room, 'lost', { pid: pid, own: !!own, left: g.discs[pid].length });
};

/** The round is decided: the answers scored, anyone out, the game perhaps over, else the result for a moment. */
const skullRoundOver = (room, r) => {
  const s = room.shared;
  const g = room._skull;
  const bidder = s.flip.pid;
  const guesses = Object.assign({}, g.guesses);
  const right = Object.keys(guesses).filter(id => guesses[id] === r.ok);
  right.forEach(id => { s.guessPts[id] = (s.guessPts[id] || 0) + 1; });
  let out = null;
  if ((g.discs[bidder] || []).length === 0 && s.alive.indexOf(bidder) !== -1) {
    out = bidder;
    s.alive = s.alive.filter(id => id !== bidder);
    skullEvent(room, 'out', { pid: bidder });
  }
  s.result = { bidder: bidder, n: s.flip.n, got: s.flip.got, ok: r.ok, skullOwner: r.skullOwner, own: r.skullOwner === bidder, guesses: guesses, right: right, out: out };
  s.turn = null;
  s.endsAt = null;
  s.turnSeq = (s.turnSeq || 0) + 1;
  s.nextStarter = r.next;
  if (r.ok && (s.wins[bidder] || 0) >= SKULL_WINS) { skullGameOver(room, bidder, 'wins', true); return; }
  if (s.alive.length <= 1) { skullGameOver(room, s.alive[0] || null, 'last', true); return; }
  s.phase = 'result';
  s.nextAt = Date.now() + SKULL_BETWEEN_MS;
};

/** The game is over. `counted`: won at the table (not by everyone else leaving). */
const skullGameOver = (room, winner, why, counted) => {
  const s = room.shared;
  if (s.phase === 'gameover') return;
  s.phase = 'gameover';
  room.phase = 'gameover';
  s.turn = null;
  s.endsAt = null;
  s.nextAt = null;
  s.guessEndsAt = null;
  s.winners = winner ? [winner] : [];
  s.why = why;
  if (winner && counted) s.tally[winner] = (s.tally[winner] || 0) + 1;
  skullEvent(room, 'over', { pid: winner, why: why });
};

/* --- the clock, and the host's "play for" -------------------------------------------- */

/** A flower from the hand if there is one, else the first disc. */
const skullFlowerInHand = (room, pid) => (room._skull.hands[pid] || []).find(i => skullIsFlower(skullFaceOf(room, pid, i)));

const skullAuto = (room, why, only) => {
  const s = room.shared;
  const g = room._skull;
  if (s.phase === 'place') {
    // Everyone still to lay a disc lays one (the clock), or only the quiet phones the host named:
    // a flower if they have one, else the skull.
    s.alive.filter(id => s.placed.indexOf(id) === -1 && (!only || only.indexOf(id) !== -1)).forEach(id => {
      const disc = skullFlowerInHand(room, id) || (g.hands[id] || [])[0];
      if (disc === undefined) return;
      skullEvent(room, 'auto', { pid: id, why: why });
      skullTakeFromHand(room, id, disc);
      s.placed.push(id);
      skullEvent(room, 'place', { pid: id });
    });
    skullAfterPlace(room);
    return;
  }
  if (!s.turn) return;
  const me = s.turn.pid;
  skullEvent(room, 'auto', { pid: me, why: why });
  if (s.phase === 'add') {
    // A flower if they hold one, else the skull: bidding only when the hand holds
    // nothing, so the clock's move never tells the table a hand is the skull alone
    // (review of 1 Oct 2026: it used to bid whenever no flower was left).
    const disc = skullFlowerInHand(room, me);
    const any = disc !== undefined ? disc : (g.hands[me] || [])[0];
    if (any !== undefined) skullAdd(room, me, any);
    else skullBid(room, me, 1);
    return;
  }
  if (s.phase === 'bid') { skullPass(room, me); return; }
  if (s.phase === 'flip') {
    if (!s.flip.own) { skullFlip(room, me, me); return; }
    const open = s.alive.filter(id => id !== me && skullLeft(room, id) > 0);
    if (open.length) skullFlip(room, me, open[Math.floor(Math.random() * open.length)]);
    return;
  }
  if (s.phase === 'lose') {
    const discs = g.discs[me] || [];
    skullLoseChoice(room, me, discs[Math.floor(Math.random() * discs.length)].i);
  }
};

const skullDeadline = (room) => {
  const s = room.shared || {};
  if (!room._skull) return null;
  if (s.phase === 'guess') return s.guessEndsAt || null;
  if (s.phase === 'result') return s.nextAt || null;
  if (['place', 'add', 'bid', 'flip', 'lose'].indexOf(s.phase) !== -1 && s.endsAt) return s.endsAt + SKULL_GRACE_MS;
  return null;
};

const skullTimeout = (room, now) => {
  const s = room.shared || {};
  if (!room._skull) return false;
  if (s.phase === 'guess' && s.guessEndsAt && now >= s.guessEndsAt) { skullApply(room, () => skullStartFlip(room)); return true; }
  if (s.phase === 'result' && s.nextAt && now >= s.nextAt) { skullApply(room, () => skullDealRound(room, s.nextStarter)); return true; }
  if (['place', 'add', 'bid', 'flip', 'lose'].indexOf(s.phase) !== -1 && s.endsAt && now >= s.endsAt + SKULL_GRACE_MS) {
    skullApply(room, () => skullAuto(room, 'clock'));
    return true;
  }
  return false;
};

/* --- what every phone may see --------------------------------------------------------- */

const skullSync = (room) => {
  const s = room.shared;
  const g = room._skull;
  if (!s || !g) return;
  const piles = {};
  const discs = {};
  const hands = {};
  (s.order || []).forEach(id => {
    piles[id] = (g.piles[id] || []).length;
    discs[id] = (g.discs[id] || []).length;
    hands[id] = s.alive.indexOf(id) !== -1 ? (g.hands[id] || []).length : 0;
  });
  s.piles = piles;
  s.discs = discs;
  s.hands = hands;
  s.total = skullTotal(piles);
  room.secrets = {};
  (s.order || []).filter(id => skullHere(room, id)).forEach(id => {
    const face = (i) => ({ i: i, f: skullFaceOf(room, id, i) });
    // A disc lost this round is still counted in its hand or pile until the next deal; its owner's list leaves it out.
    const kept = (i) => !!skullDisc(room, id, i);
    const sec = {
      hand: (g.hands[id] || []).filter(kept).map(face),
      pile: (g.piles[id] || []).filter(kept).map(face),
      // Every disc it still has (its own: in hand and on the table), for choosing which to lose.
      discs: (g.discs[id] || []).map(d => ({ i: d.i, f: d.f })),
      lost: (g.lost[id] || []).slice()
    };
    if (g.guesses[id] !== undefined && (s.phase === 'guess' || s.phase === 'flip')) sec.guess = g.guesses[id];
    room.secrets[id] = sec;
  });
  s.board = skullBoard(room);
};

/* The game just played, best first (ROOM_RESULT_BOARDS, RoomGames.js): the night, the program and
   «مين هيكسب؟» count this game's places, not the evening's tally below (the review of 1 Oct 2026:
   with the tally everyone but the winner tied). The winner, then the others still in by bets won
   this game, then the ones out of discs, by bets won. */
ROOM_RESULT_BOARDS.skull = (room) => {
  const s = room.shared || {};
  if (s.phase !== 'gameover') return null;
  const here = (s.order || []).filter(id => skullHere(room, id));
  const winner = (s.winners || [])[0];
  const wins = s.wins || {};
  const byWins = (ids) => ids.map(id => wins[id] || 0).filter((n, i, a) => a.indexOf(n) === i).sort((a, b) => b - a)
    .map(n => ids.filter(id => (wins[id] || 0) === n));
  const alive = s.alive || [];
  return roomResultRows(room, [winner && here.indexOf(winner) !== -1 ? [winner] : []]
    .concat(byWins(here.filter(id => id !== winner && alive.indexOf(id) !== -1)))
    .concat(byWins(here.filter(id => id !== winner && alive.indexOf(id) === -1))));
};

/** The board on the screens: the games won at this table, most first. */
const skullBoard = (room) => {
  const s = room.shared;
  return (s.order || []).filter(id => skullHere(room, id))
    .map(id => ({ id: id, name: roomPlayerName(room, id), score: (s.tally || {})[id] || 0 }))
    .sort((a, b) => b.score - a.score);
};

/* --- someone leaves: their discs leave the game ------------------------------------------ */

const skullPlayerLeft = (room, playerId) => {
  const s = room.shared;
  const g = room._skull;
  if (!s || !g || s.phase === 'gameover' || (s.order || []).indexOf(playerId) === -1) return;
  const wasIn = s.alive.indexOf(playerId) !== -1;
  const wasTurn = s.turn && s.turn.pid === playerId;
  const bidder = s.flip ? s.flip.pid : (s.bid ? s.bid.pid : null);
  s.alive = s.alive.filter(id => id !== playerId);
  g.hands[playerId] = [];
  g.piles[playerId] = [];
  delete g.guesses[playerId];
  s.guessed = (s.guessed || []).filter(id => id !== playerId);
  s.passed = (s.passed || []).filter(id => id !== playerId);
  s.placed = (s.placed || []).filter(id => id !== playerId);
  const hadFlipped = (s.flipped || []).filter(x => x.owner === playerId).length;
  s.flipped = (s.flipped || []).filter(x => x.owner !== playerId);
  skullEvent(room, 'left', { pid: playerId });
  if (s.alive.length < 2) {
    // Everyone else went: the one left takes it, but it isn't counted as a win at the table.
    skullGameOver(room, s.alive[0] || null, 'left', false);
    skullSync(room);
    return;
  }
  if (!wasIn) { if (s.phase === 'guess' && skullGuessers(room).every(id => s.guessed.indexOf(id) !== -1)) skullStartFlip(room); skullSync(room); return; }
  const phase = s.phase;
  if (phase === 'place') {
    if (s.starter === playerId) s.starter = skullStarterFrom(room, playerId);
    skullAfterPlace(room);
  } else if (phase === 'add') {
    if (wasTurn) skullStartTurn(room, skullNextSeat(room, playerId, () => true));
  } else if ((phase === 'bid' || phase === 'guess' || phase === 'flip' || phase === 'lose') && bidder === playerId) {
    // The bidder left: the round is called off, nobody wins or loses a thing, the next seat starts.
    skullEvent(room, 'void', { pid: playerId });
    s.result = { bidder: playerId, n: s.bid ? s.bid.n : 0, void: true, guesses: {}, right: [] };
    s.turn = null;
    s.endsAt = null;
    s.guessEndsAt = null;
    s.turnSeq = (s.turnSeq || 0) + 1;
    s.nextStarter = skullNextSeat(room, playerId, () => true);
    s.phase = 'result';
    s.nextAt = Date.now() + SKULL_BETWEEN_MS;
  } else if (phase === 'bid') {
    // Their pile left the table: a bet above what is left shrinks to all of it (and that ends the auction).
    const total = skullTableTotal(room);
    if (s.bid.n > total) { s.bid.n = total; skullEvent(room, 'shrink', { n: total }); }
    if (wasTurn || s.bid.n >= total) skullAuctionNext(room, playerId);
  } else if (phase === 'guess') {
    const total = skullTableTotal(room);
    if (s.flip.n > total) { s.flip.n = total; s.bid.n = total; skullEvent(room, 'shrink', { n: total }); }
    if (skullGuessers(room).every(id => s.guessed.indexOf(id) !== -1)) skullStartFlip(room);
  } else if (phase === 'flip') {
    // Flowers already turned from their pile no longer count; the bet shrinks to what is left.
    s.flip.got = Math.max(0, s.flip.got - hadFlipped);
    const total = skullTableTotal(room);
    if (s.flip.n > total) { s.flip.n = total; skullEvent(room, 'shrink', { n: total }); }
    if (s.flip.own && s.flip.got >= s.flip.n) skullBetWon(room);
  } else if (phase === 'result') {
    if (s.nextStarter === playerId) s.nextStarter = skullNextSeat(room, playerId, () => true);
  }
  skullSync(room);
};

/* --- computer players ------------------------------------------------------------------ */

/** What a bot may know: its own discs and what the table shows. */
const skullBotView = (room, pid) => {
  const s = room.shared;
  const g = room._skull;
  const faces = (ids) => (ids || []).map(i => skullFaceOf(room, pid, i));
  const left = {};
  s.alive.forEach(id => { left[id] = skullLeft(room, id); });
  return {
    me: pid,
    hand: faces(g.hands[pid]),
    pile: faces(g.piles[pid]),
    piles: Object.assign({}, s.piles),
    order: s.alive.slice(),
    bid: s.bid ? Object.assign({}, s.bid) : null,
    bids: (s.bids || []).slice(),
    passed: (s.passed || []).slice(),
    total: skullTableTotal(room),
    flipped: (s.flipped || []).slice(),
    flip: s.flip ? Object.assign({}, s.flip) : null,
    left: left,
    discs: (g.discs[pid] || []).length
  };
};

/** A face this bot holds, as the id of one of its discs (from `list`: its hand, or all its discs). */
const skullIdOfFace = (room, pid, face, list) => {
  const ids = list || room._skull.hands[pid] || [];
  const hit = ids.find(i => skullFaceOf(room, pid, i) === face);
  return hit !== undefined ? hit : ids[0];
};

ROOM_BOT_GAMES.skull = {
  max: SKULL_MAX,
  pending(room) {
    const s = room.shared || {};
    if (!room._skull || s.phase === 'gameover' || s.phase === 'result') return null;
    if (s.phase === 'place') {
      const id = s.alive.find(x => s.placed.indexOf(x) === -1 && isRoomBot(room, x));
      return id ? { pid: id, key: 'place|' + s.round, delay: skullRand(SKULL_BOT_PLACE_MS) } : null;
    }
    if (s.phase === 'guess') {
      const id = skullGuessers(room).find(x => s.guessed.indexOf(x) === -1 && isRoomBot(room, x));
      return id ? { pid: id, key: 'guess|' + s.round, delay: skullRand(SKULL_BOT_GUESS_MS) } : null;
    }
    if (!s.turn || !isRoomBot(room, s.turn.pid)) return null;
    return { pid: s.turn.pid, key: 'turn|' + s.turnSeq, delay: skullRand(SKULL_BOT_MS) };
  },
  decide(room, pid) {
    const s = room.shared || {};
    const level = roomBotLevel(room, pid) || 'easy';
    const v = skullBotView(room, pid);
    if (s.phase === 'place') return { action: 'place', payload: { disc: skullIdOfFace(room, pid, skullBotPlace(v, level)), round: s.round } };
    if (s.phase === 'guess') return { action: 'guess', payload: { yes: skullBotGuess(v, level), round: s.round } };
    if (!s.turn || s.turn.pid !== pid) return null;
    const seq = s.turnSeq;
    if (s.phase === 'add') {
      const m = skullBotTurn(v, level);
      if (m.add) return { action: 'add', payload: { disc: skullIdOfFace(room, pid, m.add), seq: seq } };
      return { action: 'bid', payload: { n: m.bid, seq: seq } };
    }
    if (s.phase === 'bid') {
      const m = skullBotRaise(v, level);
      return m.bid ? { action: 'bid', payload: { n: m.bid, seq: seq } } : { action: 'pass', payload: { seq: seq } };
    }
    if (s.phase === 'flip') return { action: 'flip', payload: { target: skullBotFlip(v, level), seq: seq } };
    if (s.phase === 'lose') {
      const all = (room._skull.discs[pid] || []).map(d => d.i);
      return { action: 'lose', payload: { disc: skullIdOfFace(room, pid, skullBotLose({ hand: all.map(i => skullFaceOf(room, pid, i)) }, level), all), seq: seq } };
    }
    return null;
  },
  fallback(room, pid) {
    const s = room.shared || {};
    const g = room._skull;
    if (!g) return null;
    if (s.phase === 'place') return { action: 'place', payload: { disc: (g.hands[pid] || [])[0], round: s.round } };
    if (s.phase === 'guess') return { action: 'guess', payload: { yes: false, round: s.round } };
    if (!s.turn || s.turn.pid !== pid) return null;
    const seq = s.turnSeq;
    if (s.phase === 'add') return (g.hands[pid] || []).length ? { action: 'add', payload: { disc: g.hands[pid][0], seq: seq } } : { action: 'bid', payload: { n: 1, seq: seq } };
    if (s.phase === 'bid') return { action: 'pass', payload: { seq: seq } };
    if (s.phase === 'flip') {
      if (!s.flip.own) return { action: 'flip', payload: { target: pid, seq: seq } };
      const open = s.alive.find(id => id !== pid && skullLeft(room, id) > 0);
      return { action: 'flip', payload: { target: open, seq: seq } };
    }
    if (s.phase === 'lose') return { action: 'lose', payload: { disc: (g.discs[pid] || [])[0].i, seq: seq } };
    return null;
  }
};

/* --- forced moves: only one thing to do ------------------------------------------------
   Never a bet, a pass, an added disc or «هيعملها؟» - those are the game. Only
   laying your one disc when it is all you have left, and turning your own pile
   over (the rule says the flips start there). Your own skull with one disc
   left needs no choice either: skullBetLost takes it at once. */
ROOM_FORCED_GAMES.skull = (room) => {
  const s = room.shared || {};
  const g = room._skull;
  if (!g) return null;
  if (s.phase === 'place') {
    const id = s.alive.find(x => s.placed.indexOf(x) === -1 && !isRoomBot(room, x) && (g.hands[x] || []).length === 1);
    return id ? { pid: id, key: 'place|' + s.round, move: { action: 'place', payload: { disc: g.hands[id][0], round: s.round } } } : null;
  }
  if (s.phase === 'flip' && s.turn && s.flip && !s.flip.own) {
    return { pid: s.turn.pid, key: 'own|' + s.turnSeq, move: { action: 'flip', payload: { target: s.turn.pid, seq: s.turnSeq } } };
  }
  return null;
};
