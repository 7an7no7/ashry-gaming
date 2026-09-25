/* ============================================================================
   إستميشن — ESTIMATION (rooms)
   ----------------------------------------------------------------------------
   Bundled into the Worker after RoomGames.js (FILES in rooms-worker/build.mjs),
   whose helpers it uses (shuffled, requireHost, staleTap, the bot hook). The
   rules both sides share are Estimation.js; the cards PlayingCards.js.

   The owner's rules (25 Sep 2026, asked one by one):
     - Four players, each for themselves, one deck, 13 cards each; rooms and
       the TV only. Computer players, easy and hard, fill the seats.
     - Before the auction a player may announce a dash (a call of 0), two at
       most a round; a dash doesn't bid and its call is 0.
     - The auction, the Jawaker way: in turn from the left of the dealer (the
       dealer moves on one each round), a number of tricks and a trump suit,
       or a pass; 4 at least; a bid beats the last with more tricks, or the
       same with a higher suit (no trumps > ♠ > ♥ > ♦ > ♣). It ends when the
       others have passed after a bid; everyone passing deals again. The
       winner is the caller: the bid is their call, its suit trumps.
     - Then the others call, 0 to the caller's number, in turn after the
       caller; the last may not bring the total to 13 (the risk).
     - Play: the caller leads; follow suit if you can; the highest trump, or
       the highest of the suit led, takes the trick and leads the next.
     - The score is the score keeper's (Estimation.js, estScoreRound). 18
       rounds by default (13 and five speed rounds) or 13. A speed round has
       no auction: trumps ♠ ♥ ♦ ♣ then none, everyone calls in turn from the
       left of the dealer, the last not making 13, and the first to call leads.
     - A turn clock off by default, 30 or 60 seconds; the host's "play for".

   Where the cards are:
     room._est           every hand (by seat) and the cards played this round.
                         Never projected.
     room.secrets[pid]   that phone's own hand, and its seat.
     room.shared         the table: the seats, the dashes, the bids, the
                         calls, the trick on the table and the last one taken,
                         how many each has taken and holds, the rounds scored,
                         and every move as an event - a card's face only once
                         it is played.
   ========================================================================= */
const EST_CLOCKS = [0, 30, 60];
const EST_EVENTS = 40;
const EST_GRACE_MS = 1500;
const EST_TRICK_PAUSE_MS = 2300;    // a bot leading after a trick waits for it to be seen going to its taker

const estHere = (room, id) => room.players.some(p => p.id === id);
const estSeatOf = (s, pid) => (s.seats || []).indexOf(pid);

const estimationAction = (room, playerId, action, payload) => {
  const p = payload || {};
  if (action === 'start' || action === 'playAgain') { estNewGame(room, playerId, action, p); return; }
  const s = room.shared;
  if (!s || !s.phase || !room._est) throw new Error('اللعبة لم تبدأ بعد');
  if (action === 'nextRound') {
    requireHost(room, playerId);
    if (s.phase !== 'roundOver' || staleTap(p, 'round', s.round)) return;
    estApply(room, () => estNextRound(room));
    return;
  }
  if (action === 'skipTurn') {
    requireHost(room, playerId);
    if (staleTap(p, 'seq', s.turnSeq)) return;
    estApply(room, () => estAuto(room, 'host'));
    return;
  }
  const k = estSeatOf(s, playerId);
  if (k === -1) throw new Error('انت بتتفرج المرة دي');
  if (action === 'dash') {
    // Everyone answers at once, so the deal (not the turn) says which question a tap was for.
    if (s.phase !== 'dash' || staleTap(p, 'deal', s.deal)) return;
    estApply(room, () => estDash(room, k, !!p.yes));
    return;
  }
  if (staleTap(p, 'seq', s.turnSeq)) return;
  if (action === 'bid') { estApply(room, () => estBid(room, k, { n: Number(p.n), s: String(p.s || '') })); return; }
  if (action === 'pass') { estApply(room, () => estPass(room, k)); return; }
  if (action === 'call') { estApply(room, () => estCall(room, k, Number(p.n))); return; }
  if (action === 'play') { estApply(room, () => estPlayCard(room, k, String(p.card || ''))); return; }
  throw new Error('إجراء غير معروف');
};

/** Runs a change, then writes what every phone may see. */
const estApply = (room, change) => {
  change();
  estSync(room);
};

const estEvent = (room, type, fields) => {
  const s = room.shared;
  s.eventSeq = (s.eventSeq || 0) + 1;
  s.events = (s.events || []).concat([Object.assign({ seq: s.eventSeq, type: type }, fields || {})]).slice(-EST_EVENTS);
};

/* --- a game ----------------------------------------------------------------------- */

const estSettings = (p, was) => {
  const pick = (list, v, w, d) => (list.indexOf(v) !== -1 ? v : (list.indexOf(w) !== -1 ? w : d));
  return {
    rounds: pick(EST_ROUND_CHOICES, Number(p.rounds), Number(was.rounds), 18),
    base: pick(EST_BASES, Number(p.base), Number(was.base), 10),
    dash: pick(EST_DASH_WAYS, p.dash, was.dash, 'jawaker'),
    turnClock: pick(EST_CLOCKS, Number(p.turnClock), Number(was.turnClock), 0)
  };
};

/**
 * The four at the table: the people first (with more than four, the first four
 * of a random order, and the rest watch), then the computer players already in
 * the room, and any seat still empty an easy computer player named from the
 * host's phone. The seats in a random order.
 */
const estSeatTable = (room, names) => {
  const people = shuffled(room.players.filter(x => !x.bot).map(x => x.id));
  const bots = room.players.filter(x => x.bot).map(x => x.id);
  const seats = people.concat(bots).slice(0, EST_SEATS);
  const list = Array.isArray(names) ? names : [];
  let i = 0;
  while (seats.length < EST_SEATS) {
    const name = uniqueBotName(room, list[i++] || 'Bot');
    const bot = { id: newBotId() + i, name: name, bot: 'easy' };
    room.players.push(bot);
    roomEvent(room, 'joined', { name: name, bot: true });
    seats.push(bot.id);
  }
  return shuffled(seats);
};

const estNewGame = (room, playerId, action, p) => {
  requireHost(room, playerId);
  const prev = room.shared || {};
  if (action === 'playAgain' && prev.phase !== 'gameover') return;
  if (!room.players.some(x => !x.bot)) throw new Error('محتاجين لاعب واحد على الأقل');
  const was = action === 'playAgain' ? (prev.settings || {}) : {};
  const settings = estSettings(p, was);
  // Play again keeps the table while everyone is still in the room.
  const keep = action === 'playAgain' && Array.isArray(prev.seats) && prev.seats.every(id => estHere(room, id));
  const seats = keep ? prev.seats.slice() : estSeatTable(room, p.botNames);
  const names = {};
  seats.forEach(id => { names[id] = roomPlayerName(room, id); });
  room.secrets = {};
  room.shared = {
    settings: settings,
    seats: seats,
    names: names,
    roster: seats.slice(),
    round: 1,
    // Whoever deals the first round is drawn; the one on their left opens the auction.
    dealer: Math.floor(Math.random() * EST_SEATS),
    deal: prev.deal || 0,
    totals: [0, 0, 0, 0],
    history: [],
    // The games won at this table, counted across play again.
    wins: action === 'playAgain' && prev.wins ? prev.wins : {},
    // Carried over a play again, so a tap or an animation from the last game is never taken for this one.
    turnSeq: (prev.turnSeq || 0) + 1,
    eventSeq: prev.eventSeq || 0,
    dealId: newDealId()
  };
  estDeal(room, false);
  room.phase = 'play';
  estSync(room);
};

/** Thirteen cards each, and the dash question to everyone. `again`: everyone passed, the same dealer deals again. */
const estDeal = (room, again) => {
  const s = room.shared;
  const cards = shuffled(pcDeck(1));
  const g = { hands: [[], [], [], []], gone: [] };
  cards.forEach((c, j) => { g.hands[j % EST_SEATS].push(c); });
  room._est = g;
  s.deal = (s.deal || 0) + 1;
  s.speed = estSpeed(s.round);
  s.trump = s.speed ? estSpeedTrump(s.round) : null;
  s.dash = [null, null, null, null];
  s.bids = [];
  s.high = null;
  s.passed = [false, false, false, false];
  s.caller = null;
  s.bid = null;
  s.calls = [null, null, null, null];
  s.callOrder = [];
  s.callMax = EST_TRICKS;
  s.risk = null;
  s.took = [0, 0, 0, 0];
  s.trick = [];
  s.lastTrick = null;
  s.tricks = 0;
  s.results = null;
  s.winners = null;
  s.mult = estMult(s.history);
  s.phase = 'dash';
  s.turn = null;
  // The last deal's moves go with it: its faces are in the new hands now.
  s.events = [];
  estEvent(room, 'deal', { round: s.round, dealer: s.dealer, again: !!again, speed: s.speed, trump: s.trump });
  s.turnSeq = (s.turnSeq || 0) + 1;
  s.endsAt = s.settings.turnClock ? Date.now() + s.settings.turnClock * 1000 : null;
};

const estStartTurn = (room, k, stage) => {
  const s = room.shared;
  s.turn = { k: k, pid: s.seats[k], stage: stage };
  s.turnSeq = (s.turnSeq || 0) + 1;
  s.endsAt = s.settings.turnClock ? Date.now() + s.settings.turnClock * 1000 : null;
};

/** The seats from the left of `k` round the table, those that don't take part left out. */
const estRound = (k, skip) => [1, 2, 3, 4].map(d => estNext(k, d)).filter(x => !(skip || []).some(f => f(x)));

/* --- the dash --------------------------------------------------------------------- */

const estDash = (room, k, yes) => {
  const s = room.shared;
  if (s.dash[k] !== null) return;
  if (yes && s.dash.filter(x => x === true).length >= EST_MAX_DASH) throw new Error('اتنين قالوا داش خلاص');
  s.dash[k] = yes;
  estEvent(room, 'dash', { k: k, yes: yes });
  if (s.dash.every(x => x !== null)) estAfterDash(room);
};

const estAfterDash = (room) => {
  const s = room.shared;
  s.dash.forEach((d, k) => { if (d) s.calls[k] = 0; });
  const isDash = (k) => s.dash[k] === true;
  if (s.speed) { estStartCalls(room, estRound(s.dealer, [isDash]), EST_TRICKS); return; }
  s.phase = 'bid';
  estStartTurn(room, estRound(s.dealer, [isDash])[0], 'bid');
};

/* --- the auction ------------------------------------------------------------------ */

const estMyTurn = (s, k, stage) => {
  if (!s.turn || s.turn.k !== k) throw new Error('مش دورك');
  if (s.turn.stage !== stage) throw new Error('مش وقته');
};

const estBid = (room, k, b) => {
  const s = room.shared;
  estMyTurn(s, k, 'bid');
  if (!estBidOk(b)) throw new Error('الطلب من 4 لـ 13 ومعاه نوع');
  if (!estBidBeats(b, s.high)) throw new Error('لازم تطلب أعلى من ' + s.high.n);
  s.high = { k: k, n: b.n, s: b.s };
  s.bids.push({ k: k, n: b.n, s: b.s });
  estEvent(room, 'bid', { k: k, n: b.n, s: b.s });
  estNextBidder(room, k);
};

const estPass = (room, k) => {
  const s = room.shared;
  estMyTurn(s, k, 'bid');
  s.passed[k] = true;
  s.bids.push({ k: k, pass: true });
  estEvent(room, 'pass', { k: k });
  estNextBidder(room, k);
};

/** After a bid or a pass: the auction won, everyone passed (deal again), or the next still in. */
const estNextBidder = (room, from) => {
  const s = room.shared;
  const inIt = (x) => s.dash[x] !== true && !s.passed[x];
  const high = s.high;
  const others = [0, 1, 2, 3].filter(x => inIt(x) && (!high || x !== high.k));
  if (!others.length) {
    if (high) { estAuctionWon(room); return; }
    // Everyone passed: the same dealer deals again (the deal event says so, `again`).
    estDeal(room, true);
    return;
  }
  // The highest bidder stands; the turn goes to the next seat still in.
  estStartTurn(room, estRound(from, [x => !inIt(x), x => !!high && x === high.k])[0], 'bid');
};

const estAuctionWon = (room) => {
  const s = room.shared;
  const h = s.high;
  s.caller = h.k;
  s.bid = { n: h.n, s: h.s };
  s.trump = h.s;
  s.calls[h.k] = h.n;
  estEvent(room, 'won', { k: h.k, n: h.n, s: h.s });
  estStartCalls(room, estRound(h.k, [x => x === h.k, x => s.dash[x] === true]), h.n);
};

/* --- the calls --------------------------------------------------------------------- */

const estStartCalls = (room, order, max) => {
  const s = room.shared;
  s.phase = 'call';
  s.callOrder = order;
  s.callMax = max;
  s.risk = order[order.length - 1];
  estStartTurn(room, order[0], 'call');
};

/** What seat `k` may call now: 0 to the most allowed, the last one kept off 13. */
const estChoicesFor = (s, k) => {
  const last = s.callOrder[s.callOrder.length - 1] === k;
  const sum = estSum(s.calls.filter((c, i) => i !== k && c !== null));
  return estCallChoices(s.callMax, sum, last);
};

const estCall = (room, k, n) => {
  const s = room.shared;
  estMyTurn(s, k, 'call');
  const choices = estChoicesFor(s, k);
  if (choices.indexOf(n) === -1) {
    if (n > s.callMax) throw new Error('محدش يطلب أكتر من الكول (' + s.callMax + ')');
    throw new Error('آخر واحد مينفعش يخلّي المجموع 13');
  }
  s.calls[k] = n;
  estEvent(room, 'call', { k: k, n: n, with: s.caller !== null && k !== s.caller && s.bid && n === s.bid.n });
  const at = s.callOrder.indexOf(k);
  if (at < s.callOrder.length - 1) { estStartTurn(room, s.callOrder[at + 1], 'call'); return; }
  const sum = estSum(s.calls);
  estEvent(room, 'called', { sum: sum, over: sum > EST_TRICKS, levels: estLevels(sum) });
  estStartPlay(room);
};

/* --- the tricks -------------------------------------------------------------------- */

const estStartPlay = (room) => {
  const s = room.shared;
  s.phase = 'play';
  s.trick = [];
  // The caller leads; in a speed round, the first to call.
  estStartTurn(room, s.speed ? s.callOrder[0] : s.caller, 'play');
};

const estPlayCard = (room, k, card) => {
  const s = room.shared;
  const g = room._est;
  estMyTurn(s, k, 'play');
  const hand = g.hands[k];
  if (hand.indexOf(card) === -1) throw new Error('الكارت ده مش معاك');
  if (estLegal(hand, s.trick).indexOf(card) === -1) throw new Error('لازم تلعب من نفس النوع');
  g.hands[k] = hand.filter(c => c !== card);
  g.gone.push(card);
  s.trick = s.trick.concat([{ k: k, c: card }]);
  estEvent(room, 'play', { k: k, c: card, lead: s.trick.length === 1 });
  if (s.trick.length < EST_SEATS) { estStartTurn(room, estNext(k), 'play'); return; }
  const w = s.trick[estTrickWinner(s.trick, s.trump)].k;
  s.took[w]++;
  s.tricks++;
  s.lastTrick = { cards: s.trick, k: w, no: s.tricks };
  estEvent(room, 'trick', { k: w, no: s.tricks, cards: s.trick.map(x => ({ k: x.k, c: x.c })) });
  s.trick = [];
  if (s.tricks >= EST_TRICKS) { estEndRound(room); return; }
  estStartTurn(room, w, 'play');
};

/* --- the end of a round, and of the game ------------------------------------------- */

const estEndRound = (room) => {
  const s = room.shared;
  const res = estScoreRound({ calls: s.calls, tricks: s.took, dash: s.dash.map(Boolean), caller: s.caller, risk: s.risk }, s.settings, s.mult);
  const entry = {
    round: s.round, speed: s.speed, trump: s.trump, dealer: s.dealer, caller: s.caller, bid: s.bid,
    calls: s.calls.slice(), took: s.took.slice(), dash: s.dash.map(Boolean), risk: s.risk,
    points: res.points, allMissed: res.allMissed, over: res.over, levels: res.levels, mult: s.mult
  };
  s.history = (s.history || []).concat([entry]);
  s.totals = s.totals.map((t, k) => t + res.points[k]);
  s.results = entry;
  s.turn = null;
  s.endsAt = null;
  estEvent(room, 'round', { round: s.round, points: res.points, allMissed: res.allMissed });
  if (s.round >= s.settings.rounds) { estGameOver(room); return; }
  s.phase = 'roundOver';
  s.turnSeq = (s.turnSeq || 0) + 1;
};

const estNextRound = (room) => {
  const s = room.shared;
  s.round++;
  s.dealer = estNext(s.dealer);
  estDeal(room, false);
};

const estGameOver = (room) => {
  const s = room.shared;
  s.phase = 'gameover';
  room.phase = 'gameover';
  s.turn = null;
  s.endsAt = null;
  s.turnSeq = (s.turnSeq || 0) + 1;
  const top = Math.max.apply(null, s.totals);
  s.winners = s.seats.filter((id, k) => s.totals[k] === top);
  s.winners.forEach(id => { s.wins[id] = (s.wins[id] || 0) + 1; });
  estEvent(room, 'over', { winners: s.winners });
};

/* --- the clock, or the host for a quiet phone ---------------------------------------- */

/**
 * What the phone does for a player who didn't: no dash, a pass in the auction,
 * a sensible call (what the hand looks good for), the lowest card allowed.
 */
const estAuto = (room, why) => {
  const s = room.shared;
  const g = room._est;
  if (s.phase === 'dash') {
    const quiet = s.dash.map((d, k) => (d === null ? k : -1)).filter(k => k !== -1);
    quiet.forEach(k => estEvent(room, 'auto', { k: k, why: why }));
    quiet.forEach(k => { if (s.phase === 'dash') estDash(room, k, false); });
    return;
  }
  if (!s.turn) return;
  const k = s.turn.k;
  estEvent(room, 'auto', { k: k, why: why });
  if (s.turn.stage === 'bid') { estPass(room, k); return; }
  if (s.turn.stage === 'call') { estCall(room, k, estBotCall(g.hands[k], s.trump, estChoicesFor(s, k), 'hard')); return; }
  const legal = estLegal(g.hands[k], s.trick).sort((a, b) => estPower(a) - estPower(b));
  estPlayCard(room, k, legal[0]);
};

const estDeadline = (room) => {
  const s = room.shared || {};
  const live = s.phase === 'dash' || s.phase === 'bid' || s.phase === 'call' || s.phase === 'play';
  return live && s.endsAt ? s.endsAt + EST_GRACE_MS : null;
};

const estTimeout = (room, now) => {
  const s = room.shared || {};
  const due = estDeadline(room);
  if (!due || now < due || !room._est) return false;
  estApply(room, () => estAuto(room, 'clock'));
  return true;
};

/* --- what every phone may see -------------------------------------------------------- */

/** A hand as a player holds it: by suit, the colours taking turns, each suit high to low. */
const EST_HAND_SUITS = ['s', 'h', 'c', 'd'];
const estSortHand = (hand) => hand.slice().sort((a, b) =>
  EST_HAND_SUITS.indexOf(pcSuit(a)) - EST_HAND_SUITS.indexOf(pcSuit(b)) || estPower(b) - estPower(a));

const estSync = (room) => {
  const s = room.shared;
  const g = room._est;
  if (!s || !g) return;
  s.counts = g.hands.map(h => h.length);
  room.secrets = {};
  s.seats.forEach((id, k) => {
    if (estHere(room, id)) room.secrets[id] = { seat: k, hand: estSortHand(g.hands[k]) };
  });
  s.board = s.seats.map((id, k) => ({ id: id, name: s.names[id] || roomPlayerName(room, id), score: s.totals[k] }))
    .sort((a, b) => b.score - a.score);
};

/* --- someone leaves: a computer player takes the seat -------------------------------- */

/**
 * Four seats can't play three-handed, so the leaver's seat - their hand, their
 * call, their points - goes to a hard computer player under their name, for
 * the rest of the game (المخ والإيد's way).
 */
const estPlayerLeft = (room, playerId, name) => {
  const s = room.shared;
  if (!s || !room._est || s.phase === 'gameover') return;
  const k = estSeatOf(s, playerId);
  if (k === -1) return;
  const bot = { id: newBotId(), name: uniqueBotName(room, '🤖 ' + (name || s.names[playerId] || '')), bot: 'hard' };
  room.players.push(bot);
  s.seats[k] = bot.id;
  s.names[bot.id] = bot.name;
  s.roster = (s.roster || []).concat([bot.id]);
  if (s.turn && s.turn.k === k) s.turn.pid = bot.id;
  estEvent(room, 'took', { k: k, name: name || s.names[playerId] || '' });
  estSync(room);
};

/* --- computer players ------------------------------------------------------------------ */

/** What a bot at seat `k` does now: from its own hand and the table. */
const estBotMove = (room, k, level) => {
  const s = room.shared;
  const g = room._est;
  const hand = g.hands[k];
  if (s.phase === 'dash') {
    const yes = s.dash[k] === null && estBotDash(hand, level, s.dash.filter(x => x === true).length);
    return { action: 'dash', payload: { yes: yes, deal: s.deal } };
  }
  const seq = s.turnSeq;
  if (s.turn.stage === 'bid') {
    const b = estBotBid(hand, s.high, level);
    return b ? { action: 'bid', payload: { n: b.n, s: b.s, seq: seq } } : { action: 'pass', payload: { seq: seq } };
  }
  if (s.turn.stage === 'call') {
    return { action: 'call', payload: { n: estBotCall(hand, s.trump, estChoicesFor(s, k), level), seq: seq } };
  }
  const card = estBotCard({
    hand: hand, trick: s.trick, trump: s.trump, gone: g.gone,
    need: (s.calls[k] || 0) - s.took[k], after: EST_SEATS - 1 - s.trick.length
  }, level);
  return { action: 'play', payload: { card: card, seq: seq } };
};

/** A card led just after a trick waits for the trick to be seen going to its taker. */
const estPause = (s) => (s.phase === 'play' && !s.trick.length && s.lastTrick ? EST_TRICK_PAUSE_MS : undefined);

ROOM_BOT_GAMES.estimation = {
  max: EST_SEATS,
  pending(room) {
    const s = room.shared || {};
    if (!room._est || !Array.isArray(s.seats)) return null;
    if (s.phase === 'dash') {
      const k = s.dash.findIndex((d, x) => d === null && isRoomBot(room, s.seats[x]));
      return k === -1 ? null : { pid: s.seats[k], key: 'dash|' + s.deal + '|' + k, delay: 700 + Math.floor(Math.random() * 900) };
    }
    if (!s.turn || !isRoomBot(room, s.turn.pid)) return null;
    return { pid: s.turn.pid, key: 'turn|' + s.turnSeq, delay: estPause(s) };
  },
  decide(room, pid) {
    const s = room.shared || {};
    const k = estSeatOf(s, pid);
    if (k === -1 || !room._est) return null;
    if (s.phase !== 'dash' && (!s.turn || s.turn.k !== k)) return null;
    return estBotMove(room, k, roomBotLevel(room, pid) || 'easy');
  },
  fallback(room, pid) {
    const s = room.shared || {};
    const k = estSeatOf(s, pid);
    if (k === -1 || !room._est) return null;
    if (s.phase === 'dash') return { action: 'dash', payload: { yes: false, deal: s.deal } };
    if (!s.turn || s.turn.k !== k) return null;
    if (s.turn.stage === 'bid') return { action: 'pass', payload: { seq: s.turnSeq } };
    if (s.turn.stage === 'call') return { action: 'call', payload: { n: estChoicesFor(s, k)[0], seq: s.turnSeq } };
    return { action: 'play', payload: { card: estLegal(room._est.hands[k], s.trick)[0], seq: s.turnSeq } };
  }
};

/**
 * One card you may play is played for you, after a beat - the last trick
 * included, where every hand holds one card and there is nothing to judge.
 * A bid, a call or a dash is always a choice.
 */
ROOM_FORCED_GAMES.estimation = (room) => {
  const s = room.shared || {};
  if (s.phase !== 'play' || !s.turn || s.turn.stage !== 'play' || !room._est) return null;
  const legal = estLegal(room._est.hands[s.turn.k], s.trick);
  if (legal.length !== 1) return null;
  const pause = estPause(s);
  return { pid: s.turn.pid, key: 'play|' + s.turnSeq, move: { action: 'play', payload: { card: legal[0], seq: s.turnSeq } }, delay: pause ? pause : undefined };
};
