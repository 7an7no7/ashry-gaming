/* ============================================================================
   جمجمة — SKULL, the rules both sides share
   ----------------------------------------------------------------------------
   One copy for the page (inlined, SHARED_LISTS in tools/build-*.mjs) and the
   rooms server (bundled, FILES in rooms-worker/build.mjs). No DOM, nothing
   that runs at load, every top-level name starts with skull / SKULL_.

   A disc is a face: 'skull', or its player's flower. Every player's three
   flowers are the same flower (a seat's own: a rose, jasmine or a lotus), so
   a flower flipped never says which of a player's discs it was - with a
   different flower a disc, the table could work out, round by round, which
   disc a player had lost, and whether their skull is still in hand.

   The computer players' judgement is here too, as plain functions of what a
   bot may know: its own discs (hand and pile) and what the table shows (the
   piles' sizes, the bids, the discs left). The server builds that view
   (skullBotView in RoomSkull.js) and never hands a bot anything else.
   ========================================================================= */
const SKULL_FLOWERS = ['rose', 'jasmine', 'lotus'];
const SKULL_FACE = 'skull';
const SKULL_MIN = 3;
const SKULL_MAX = 8;
const SKULL_WINS = 2;                 // two won bets win the game
const SKULL_CLOCKS = [0, 30, 60];
const SKULL_COLORS = 8;               // a seat's colour: --skl-c0 … --skl-c7 in Style.html

const skullIsFlower = (f) => SKULL_FLOWERS.indexOf(f) !== -1;
/** A seat's flower: rose, jasmine, lotus in turn round the table. */
const skullFlowerOf = (seat) => SKULL_FLOWERS[((seat | 0) % 3 + 3) % 3];
/** The four discs a player starts with. */
const skullStartFaces = (seat) => { const f = skullFlowerOf(seat); return [f, f, f, SKULL_FACE]; };
/** The discs on the table: every pile, flipped or not. */
const skullTotal = (piles) => Object.keys(piles || {}).reduce((a, k) => a + (Number(piles[k]) || 0), 0);
/** The numbers a bet can be now: one more than the bid on the table (or 1) up to every disc on it. */
const skullBidRange = (total, bid) => ({ min: bid ? (Number(bid.n) || 0) + 1 : 1, max: Number(total) || 0 });

/* --- the computer players ---------------------------------------------------
   `v` is a bot's view:
     me, hand (faces), pile (faces, bottom to top), piles { pid: count },
     order (the players still in, in seat order), bid { pid, n } | null,
     bids (this round's bids [{ pid, n }]), passed [pid], total,
     flipped [{ owner, f }], flip { n, got, own } (the bet being flipped),
     left { pid: face-down discs still in that pile }, discs (its own count).
   `rnd` is Math.random, or a seeded one in a test.
   --------------------------------------------------------------------------- */

const skullCount = (list, fn) => (list || []).filter(fn).length;

/** The first placing: mostly a flower; now and then the skull (hard: a little more often, to set a trap). */
function skullBotPlace(v, level, rnd) {
  const r = rnd || Math.random;
  const hand = v.hand || [];
  if (hand.length === 1) return hand[0];
  const hasSkull = hand.indexOf(SKULL_FACE) !== -1;
  const flower = hand.find(skullIsFlower);
  const p = level === 'hard' ? 0.34 : 0.25;
  if (hasSkull && (!flower || r() < p)) return SKULL_FACE;
  return flower || hand[0];
}

/** How many flowers this bot expects to be able to turn over safely. */
function skullBotSafe(v, level) {
  const pile = v.pile || [];
  if (pile.indexOf(SKULL_FACE) !== -1) return 0;
  const own = skullCount(pile, skullIsFlower);
  let others = 0;
  Object.keys(v.piles || {}).forEach(pid => {
    if (pid === v.me) return;
    const n = Number(v.piles[pid]) || 0;
    if (!n) return;
    // The top disc of a pile is a flower more often than not; a deeper one less so.
    others += level === 'hard' ? Math.min(n, 1) * 0.62 + Math.max(0, n - 1) * 0.3 : Math.min(n, 1) * 0.5;
  });
  return own + Math.floor(others);
}

/** Its turn before any bet: add a disc, or open the bidding. Returns { add: face } or { bid: n }. */
function skullBotTurn(v, level, rnd) {
  const r = rnd || Math.random;
  const hand = v.hand || [];
  const total = Number(v.total) || 1;
  const pile = v.pile || [];
  const flower = hand.find(skullIsFlower);
  if (level !== 'hard') {
    if (hand.length && r() < 0.55) return { add: hand.indexOf(SKULL_FACE) !== -1 && r() < 0.25 ? SKULL_FACE : (flower || hand[0]) };
    return { bid: Math.max(1, Math.min(total, 1 + Math.floor(r() * 2))) };
  }
  if (pile.indexOf(SKULL_FACE) !== -1) {
    // A skull on its own pile: building on it is safe, and a small bid is a trap for whoever outbids it.
    if (flower && r() < 0.6) return { add: flower };
    return { bid: 1 };
  }
  // All flowers: sometimes the skull goes on top to set a trap, sometimes another flower.
  if (hand.indexOf(SKULL_FACE) !== -1 && r() < 0.18) return { add: SKULL_FACE };
  if (flower && total < (v.order || []).length + 2 && r() < 0.45) return { add: flower };
  const safe = skullBotSafe(v, level);
  return { bid: Math.max(1, Math.min(total, safe || 1)) };
}

/** The auction: raise by one while it looks safe, else pass. Returns { bid: n } or { pass: true }. */
function skullBotRaise(v, level, rnd) {
  const r = rnd || Math.random;
  const total = Number(v.total) || 0;
  const cur = v.bid ? Number(v.bid.n) || 0 : 0;
  if (cur >= total) return { pass: true };
  if (level !== 'hard') return r() < 0.33 ? { bid: cur + 1 } : { pass: true };
  const safe = skullBotSafe(v, level);
  if (cur + 1 <= safe) return { bid: cur + 1 };
  // Now and then a bluff one past what looks safe, when the table is small.
  if ((v.pile || []).indexOf(SKULL_FACE) === -1 && cur + 1 <= safe + 1 && total <= 6 && r() < 0.15) return { bid: cur + 1 };
  return { pass: true };
}

/** «هيعملها؟»: will the bidder make it? */
function skullBotGuess(v, level, rnd) {
  const r = rnd || Math.random;
  if (level !== 'hard' || !v.flip) return r() < 0.5;
  const n = Number(v.flip.n) || 0;
  const total = Number(v.total) || 1;
  const bidderPile = Number((v.piles || {})[v.flip.pid]) || 0;
  const mine = v.pile || [];
  // Its own skull is where the bidder will have to go: a no.
  if (mine.indexOf(SKULL_FACE) !== -1) {
    const elsewhere = total - bidderPile - mine.length;
    if (n > bidderPile + elsewhere) return false;
    if (mine[mine.length - 1] === SKULL_FACE) return r() < 0.3;
  }
  return n / total <= 0.5 ? r() < 0.75 : r() < 0.3;
}

/** How much a player's pile looks like it hides a skull, from what the table saw: raises and added discs. */
function skullBotSuspicion(v, pid) {
  const raises = skullCount(v.bids, b => b.pid === pid);
  const added = Math.max(0, (Number((v.piles || {})[pid]) || 0) - 1);
  return raises * 1 + added * 0.8;
}

/** Which pile to turn over next: its own first, then (hard) the least suspect, else any. */
function skullBotFlip(v, level, rnd) {
  const r = rnd || Math.random;
  if (v.flip && !v.flip.own && (Number((v.piles || {})[v.me]) || 0) > 0) return v.me;
  const open = Object.keys(v.left || {}).filter(pid => pid !== v.me && (v.left[pid] || 0) > 0);
  if (!open.length) return null;
  if (level !== 'hard') return open[Math.floor(r() * open.length)];
  const scored = open.map(pid => ({ pid: pid, s: skullBotSuspicion(v, pid) + r() * 0.4 - (v.left[pid] || 0) * 0.05 }));
  scored.sort((a, b) => a.s - b.s);
  return scored[0].pid;
}

/** Its own skull flipped: which of its discs it gives up (hard keeps the skull while it has a flower to give). */
function skullBotLose(v, level, rnd) {
  const r = rnd || Math.random;
  const all = (v.hand || []);
  if (!all.length) return null;
  if (level === 'hard') {
    const flower = all.find(skullIsFlower);
    if (flower && all.length > 1) return flower;
  }
  return all[Math.floor(r() * all.length)];
}
