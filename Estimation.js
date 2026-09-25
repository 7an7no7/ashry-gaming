/* ============================================================================
   إستميشن — ESTIMATION: the rules both sides share
   ----------------------------------------------------------------------------
   One copy for the page and the rooms server, like PlayingCards.js (whose
   deck, ranks and suits it plays with): the page inlines this file (it lights
   the cards you may play, keeps a call off 13, and names a bid) and the
   Worker bundles it (it judges every bid, call and card, and scores the
   round). No DOM, nothing that runs at load, every top-level name starts
   with est / EST_.

   A card is PlayingCards.js's: '7h', '10s', 'Qd', 'Ac'. One deck, so a face
   is its own id. A bid is { n, s }: n tricks (4 to 13) and s a suit, 's' 'h'
   'd' 'c', or 'n' for no trumps (صن). Seats are 0 to 3 in the order of play.

   The scoring is the score keeper's, number for number (CS_GAMES.estimation
   in JS_CardRules.html, researched 16 Sep 2026): rules.mjs plays random
   rounds through both and checks they agree.
   ========================================================================= */
const EST_SEATS = 4;
const EST_TRICKS = 13;
const EST_MIN_BID = 4;
/** Low to high: for the same number of tricks, a higher suit beats a lower one; no trumps beats all. */
const EST_BID_SUITS = ['c', 'd', 'h', 's', 'n'];
/** A trick is taken by the highest card; the ace is high. */
const EST_RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
/** The five speed rounds (14 to 18) have no auction: trumps are fixed, in this order. */
const EST_SPEED_TRUMPS = ['s', 'h', 'd', 'c', 'n'];
const EST_ROUND_CHOICES = [18, 13];
const EST_BASES = [10, 13];
const EST_DASH_WAYS = ['jawaker', 'egypt'];
const EST_MAX_DASH = 2;

const estPower = (c) => EST_RANKS.indexOf(pcRank(c));
const estSpeed = (round) => Number(round) > 13;
const estSpeedTrump = (round) => EST_SPEED_TRUMPS[Math.max(0, Math.min(4, Number(round) - 14))];
const estNext = (k, step) => ((Number(k) + (step || 1)) % EST_SEATS + EST_SEATS) % EST_SEATS;
const estSum = (list) => (list || []).reduce((a, x) => a + (Number(x) || 0), 0);

/* --- the auction --------------------------------------------------------------------- */

/** A bid a table can make at all: 4 to 13 tricks and a suit (or no trumps). */
const estBidOk = (b) => !!b && Number.isInteger(Number(b.n)) && Number(b.n) >= EST_MIN_BID && Number(b.n) <= EST_TRICKS &&
  EST_BID_SUITS.indexOf(b.s) !== -1;

/** A bid's place in the order: more tricks first, then the suit. */
const estBidRank = (b) => Number(b.n) * 10 + EST_BID_SUITS.indexOf(b.s);

/** Does `b` beat the highest bid so far (none: any bid of 4 or more)? */
const estBidBeats = (b, high) => estBidOk(b) && (!high || estBidRank(b) > estBidRank(high));

/** The lowest bid in suit `s` that beats `high`, or null when none can. */
const estLowestBid = (s, high) => {
  for (let n = EST_MIN_BID; n <= EST_TRICKS; n++) if (estBidBeats({ n: n, s: s }, high)) return { n: n, s: s };
  return null;
};

/* --- the calls ----------------------------------------------------------------------- */

/**
 * What a player may call: 0 up to the caller's number (nobody calls more than
 * the caller), or up to 13 in a speed round; and the last to call may not
 * bring the total of the four calls to 13. `sumSoFar` is every call made
 * before this one (dash calls count as 0).
 */
const estCallChoices = (max, sumSoFar, last) => {
  const out = [];
  for (let n = 0; n <= Math.min(EST_TRICKS, Number(max)); n++) {
    if (last && Number(sumSoFar) + n === EST_TRICKS) continue;
    out.push(n);
  }
  return out;
};

/** The risk: every two away from 13 (2-3 off is one level, 4-5 two...). */
const estLevels = (sum) => Math.floor(Math.abs(Number(sum) - EST_TRICKS) / 2);

/* --- a trick --------------------------------------------------------------------------- */

/** The cards of `hand` that may go on `trick` ([{ k, c }], first card led): follow suit if you can. */
const estLegal = (hand, trick) => {
  const cards = (hand || []).slice();
  if (!trick || !trick.length) return cards;
  const led = pcSuit(trick[0].c);
  const same = cards.filter(c => pcSuit(c) === led);
  return same.length ? same : cards;
};

/** Which card of a trick takes it: the highest trump, else the highest of the suit led. */
const estTrickWinner = (trick, trump) => {
  if (!trick || !trick.length) return -1;
  const led = pcSuit(trick[0].c);
  let best = 0;
  const beats = (c, b) => {
    const cs = pcSuit(c);
    const bs = pcSuit(b);
    if (trump && trump !== 'n' && cs === trump && bs !== trump) return true;
    if (cs !== bs) return false;
    return estPower(c) > estPower(b);
  };
  for (let i = 1; i < trick.length; i++) {
    if (pcSuit(trick[i].c) !== led && pcSuit(trick[i].c) !== trump) continue;
    if (beats(trick[i].c, trick[best].c)) best = i;
  }
  return best;
};

/* --- the score ------------------------------------------------------------------------- */

/** The round's multiplier: ×2 for every round in a row before it that nobody made (صعايدة). */
const estMult = (history) => {
  let m = 1;
  for (let n = (history || []).length - 1; n >= 0 && history[n].allMissed; n--) m *= 2;
  return m;
};

/**
 * One round's points, by seat - CS_GAMES.estimation.score, number for number.
 * input: { calls: [4], tricks: [4], dash: [4 booleans], caller: seat or null,
 * risk: seat or null }; opts: { base: 10 | 13, dash: 'jawaker' | 'egypt' }.
 *   - Made exactly: base + the call; +10 for the caller or مع (the same call
 *     as the caller); +10 a risk level for the risk player; +10 for the only
 *     one who made it; a plain zero made in an under round +10.
 *   - Missed: minus the tricks off; −10 for the caller or مع; −10 a risk
 *     level; −10 for the only one who missed.
 *   - A dash: ±33 under / ±25 over, or the Egyptian +33 / −23.
 *   - Nobody made it: no points, and the next round counts double.
 */
const estScoreRound = (input, opts, mult) => {
  const o = opts || {};
  const base = EST_BASES.indexOf(Number(o.base)) !== -1 ? Number(o.base) : 10;
  const calls = input.calls.map(Number);
  const tricks = input.tricks.map(Number);
  const dash = input.dash || [];
  const sum = estSum(calls);
  const over = sum > EST_TRICKS;
  const levels = estLevels(sum);
  const made = calls.map((c, i) => c === tricks[i]);
  const makers = made.filter(Boolean).length;
  const caller = input.caller === null || input.caller === undefined || input.caller === '' ? -1 : Number(input.caller);
  const risk = input.risk === null || input.risk === undefined || input.risk === '' ? -1 : Number(input.risk);
  const m = Number(mult) || 1;
  if (makers === 0) return { points: calls.map(() => 0), allMissed: true, over: over, levels: levels };
  const points = calls.map((call, i) => {
    if (dash[i]) {
      if (o.dash === 'egypt') return made[i] ? 33 : -23;
      return (made[i] ? 1 : -1) * (over ? 25 : 33);
    }
    const withCaller = caller !== -1 && (i === caller || call === calls[caller]);
    if (made[i]) {
      let p = base + call;
      if (withCaller) p += 10;
      if (i === risk) p += 10 * levels;
      if (makers === 1) p += 10;
      if (call === 0 && !over) p += 10;
      return p;
    }
    let p = -Math.abs(tricks[i] - call);
    if (withCaller) p -= 10;
    if (i === risk) p -= 10 * levels;
    if (makers === 3) p -= 10;
    return p;
  }).map(p => p * m);
  return { points: points, allMissed: false, over: over, levels: levels };
};

/* --- the computer players -----------------------------------------------------------------
   Only from their own hand and what the table can see: the bids and calls,
   and the cards played (every one of them was on the table face up).
   ----------------------------------------------------------------------------------- */

/** How many tricks a hand looks good for with `trump` (or 'n'): the honours, the trump length, the short suits. */
const estHandTricks = (hand, trump) => {
  const by = { s: [], h: [], d: [], c: [] };
  (hand || []).forEach(c => { by[pcSuit(c)].push(estPower(c)); });
  const trumps = trump && trump !== 'n' ? by[trump].length : 0;
  let total = 0;
  let ruffs = 0;
  Object.keys(by).forEach(s => {
    const p = by[s].sort((a, b) => b - a);
    const len = p.length;
    const isTrump = s === trump;
    const has = (r) => p.indexOf(EST_RANKS.indexOf(r)) !== -1;
    let t = 0;
    if (has('A')) t += 1;
    if (has('K')) t += len >= 2 ? (isTrump ? 0.95 : 0.8) : 0.3;
    if (has('Q')) t += len >= 3 ? (isTrump ? 0.8 : 0.45) : 0.1;
    if (has('J') && len >= 4) t += isTrump ? 0.5 : 0.2;
    if (isTrump) t += Math.max(0, len - 3) * 0.85;
    else if (trump === 'n' && len >= 5 && (has('A') || has('K'))) t += (len - 4) * 0.6;
    total += Math.min(t, len);
    if (!isTrump && trump && trump !== 'n') ruffs += len === 0 ? 0.9 : len === 1 ? 0.55 : len === 2 ? 0.2 : 0;
  });
  // A short suit only takes tricks with trumps to spare for it.
  total += Math.min(ruffs, Math.max(0, trumps - 2) * 0.9);
  return Math.max(0, Math.min(EST_TRICKS, total));
};

/** A hand that can keep out of every trick: no ace or king, nothing long, low cards. */
const estDashLooks = (hand) => {
  const by = { s: 0, h: 0, d: 0, c: 0 };
  let danger = 0;
  (hand || []).forEach(c => {
    by[pcSuit(c)]++;
    const p = estPower(c);
    if (p >= 11) danger += 3;          // K, A
    else if (p === 10) danger += 1.4;  // Q
    else if (p >= 8) danger += 0.5;    // 10, J
  });
  const long = Math.max(by.s, by.h, by.d, by.c);
  return danger + Math.max(0, long - 4) * 1.5;
};

/** A bot's dash: only a hand that looks safe (hard), or now and then a weak one (easy). */
const estBotDash = (hand, level, taken, rnd) => {
  const r = rnd || Math.random;
  if (taken >= EST_MAX_DASH) return false;
  const danger = estDashLooks(hand);
  if (level === 'hard') return danger <= 1.6;
  return danger <= 2.2 && r() < 0.5;
};

/** A bot's bid: the best suit for its hand, at the lowest number that beats the table, or a pass. */
const estBotBid = (hand, high, level, rnd) => {
  const r = rnd || Math.random;
  let best = null;
  EST_BID_SUITS.forEach(s => {
    const est = estHandTricks(hand, s) + (level === 'hard' ? 0 : (r() - 0.5) * 2.2);
    const bid = estLowestBid(s, high);
    if (!bid) return;
    const margin = est - bid.n;
    // A hard bot bids only what its hand holds; an easy one reaches a little.
    if (margin < (level === 'hard' ? -0.25 : -0.8)) return;
    if (!best || margin > best.margin) best = { bid: bid, margin: margin };
  });
  return best ? best.bid : null;
};

/** A bot's call: what its hand looks good for, kept to what the table allows. */
const estBotCall = (hand, trump, choices, level, rnd) => {
  const r = rnd || Math.random;
  if (!choices || !choices.length) return 0;
  let est = estHandTricks(hand, trump);
  if (level !== 'hard') est += (r() - 0.5) * 2;
  const want = Math.round(est);
  return choices.slice().sort((a, b) => Math.abs(a - want) - Math.abs(b - want) || Math.abs(a - est) - Math.abs(b - est))[0];
};

/**
 * A bot's card. `ctx`: { hand, trick, trump, need (tricks still wanted: the
 * call less what it took; 0 or less: it wants no more), gone (cards played
 * this round), after (players still to play on this trick) }.
 * Wanting a trick: win it as cheaply as it can hold, lead a card that is top
 * of its suit. Not wanting one: duck under the card winning, throw its
 * highest danger when it can't win anyway, lead low.
 */
const estBotCard = (ctx, level, rnd) => {
  const r = rnd || Math.random;
  const legal = estLegal(ctx.hand, ctx.trick);
  if (legal.length === 1) return legal[0];
  if (level !== 'hard' && r() < 0.35) return legal[Math.floor(r() * legal.length)];
  const trump = ctx.trump;
  const trick = ctx.trick || [];
  const gone = ctx.gone || [];
  const byPow = (a, b) => estPower(a) - estPower(b);
  const low = (list) => list.slice().sort(byPow)[0];
  const high = (list) => list.slice().sort(byPow).reverse()[0];
  const wins = (c) => estTrickWinner(trick.concat([{ k: -1, c: c }]), trump) === trick.length;
  /** The highest card of its suit still out (every higher one played, or in this hand). */
  const topOfSuit = (c) => {
    const s = pcSuit(c);
    for (let p = estPower(c) + 1; p < EST_RANKS.length; p++) {
      const card = EST_RANKS[p] + s;
      if (gone.indexOf(card) === -1 && ctx.hand.indexOf(card) === -1) return false;
    }
    return true;
  };
  const want = ctx.need > 0;
  if (!trick.length) {
    // Leading.
    if (want) {
      const tops = legal.filter(c => topOfSuit(c) && pcSuit(c) !== trump);
      if (tops.length) return high(tops);
      const trumps = legal.filter(c => pcSuit(c) === trump);
      if (trumps.length >= 3 && trumps.some(topOfSuit)) return high(trumps);
      return low(legal.filter(c => pcSuit(c) !== trump).length ? legal.filter(c => pcSuit(c) !== trump) : legal);
    }
    const safe = legal.filter(c => !topOfSuit(c));
    return low(safe.length ? safe : legal);
  }
  const winners = legal.filter(wins);
  const losers = legal.filter(c => !wins(c));
  if (want) {
    if (winners.length) {
      // The last to play needs only the cheapest winner; earlier, a top card holds.
      if (ctx.after === 0) return low(winners);
      const holding = winners.filter(topOfSuit);
      return holding.length ? low(holding) : (ctx.need >= 2 ? high(winners) : low(winners));
    }
    return low(losers.filter(c => pcSuit(c) !== trump).length ? losers.filter(c => pcSuit(c) !== trump) : losers);
  }
  // Not wanting it: the highest card that still loses, or, made to win, the highest.
  if (losers.length) return high(losers);
  return high(legal);
};
