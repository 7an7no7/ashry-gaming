/* ============================================================================
   المزاد — THE BLUFFING AUCTION (rooms), the owner's rules of 29 Sep 2026
   ----------------------------------------------------------------------------
   Eight boxes, one at a time. Each box hides one thing (a treasure, a scorpion,
   a bill, a thief's mask, a coin for double-or-nothing, a key, or nothing at
   all). Every phone gets one secret clue about the box - always true; lies
   come only from people, out loud. A minute of talk, then everyone bids once,
   in secret, all at the same time; the highest takes the box and pays, and the
   box opens in front of everyone. The most money after the eighth box wins.
   3-8 players, no computer players, the TV optional.

   What is hidden (never in shared until the box opens):
     room._box.deck      the eight boxes' contents, in order
     room._box.clues     every phone's clue for the box on the table
     room._box.bids      the bids sent so far (who sent is public: shared.done)
     room._box.peeks     a key's holder sees the next box: { pid: { box, kind, value } }
   Each phone's slice: { box, clue, bid (its own, once sent), peek }.

   Phases (shared.phase):
     talk      the minute of talk (talkEndsAt); bids may already be sent
     bid       the last call (bidEndsAt) for whoever hasn't sent a bid
     offer     «عرض الحاج» (7 Oct 2026): at two boxes a game the winner may take the old host's
               money and hand the box back unopened (offer.endsAt; no answer opens it)
     open      the bids turned over, the box opened (openAt; the show is
               BOX_SHOW_MS long); the next box on nextAt or the host's nextBox
     gameover  the eighth box is open (or fewer than two are left): the board
   Bundled after RoomGames.js (requireHost, requireMoveOn, staleTap, shuffled,
   roomPlayerName). Every name here starts with box / BOX_.
   ========================================================================= */
const BOX_MIN = 3;
const BOX_MAX = 8;
const BOX_COUNT = 8;
const BOX_START_MONEY = 1000;       // everyone starts with 1,000 جنيه
const BOX_TALK_MS = 60000;          // the minute of talk
const BOX_LAST_CALL_MS = 20000;     // then the last call for bids
const BOX_SHOW_MS = 10600;          // the opening show on every screen (JS_RoomBox.html's timeline): the scorpion's (its effect at 8.8 s)
const BOX_SHOW_SHORT_MS = 8500;     // every other box's (its effect over at 7.7 s); 10600 -> 8500 (the owner, 8 Oct 2026: felt slow)
const BOX_AFTER_MS = 3500;          // the result stays this long after the show, then the next box; 6000 -> 3500 (the owner, 8 Oct 2026: felt slow)
const BOX_GRACE_MS = 600;           // a clock's moment on the server after the phones' own
const BOX_SCORPION = 300;           // the scorpion scatters 300 of the winner's money
const BOX_BILL = 50;                // the bill: 50 to every other player
const BOX_KINDS = ['treasure', 'scorpion', 'bill', 'steal', 'double', 'key', 'empty'];
// The owner's picks of 7 Oct 2026.
const BOX_OFFER_MS = 8000;          // «عرض الحاج»: 8 s to take the money or open it
const BOX_OFFERS = 2;               //   twice a game, at two random boxes, never the finale
const BOX_INSURE = 50;              // «تأمين»: 50 ج while bidding; a scorpion or the thief then costs half
const BOX_FINALE = BOX_COUNT - 1;   // «صندوق الختام»: the eighth box, announced; everything inside counts double

/** How long this box's show lasts (s.result.showMs, which the phones read too): the scorpion's is the long one. */
const boxShowMs = (r) => (r && r.kind === 'scorpion' && !(r.deal !== null && r.deal !== undefined && r.winnerId)) ? BOX_SHOW_MS : BOX_SHOW_SHORT_MS;

const boxHere = (room, id) => room.players.some(p => p.id === id && !p.bot);
/** The roster still in the room. */
const boxPresent = (room) => ((room.shared || {}).roster || []).filter(id => boxHere(room, id));
const boxRound10 = (n) => Math.max(0, Math.floor(n / 10) * 10);

/**
 * The eight boxes: three treasures (300-800), a scorpion, and four more drawn
 * from a steal, a double-or-nothing, a key, a bill, an empty box, a fourth
 * treasure and a second scorpion. Shuffled; a key is never the last box (there
 * would be nothing to peek at).
 */
const boxDeal = (rnd) => {
  const r = rnd || Math.random;
  const pick = (list) => list[Math.floor(r() * list.length)];
  const treasure = () => ({ kind: 'treasure', value: pick([300, 400, 500, 600, 700, 800]) });
  const more = ['steal', 'double', 'key', 'bill', 'empty', 'treasure', 'scorpion'];
  for (let i = more.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [more[i], more[j]] = [more[j], more[i]]; }
  const deck = [treasure(), treasure(), treasure(), { kind: 'scorpion', value: BOX_SCORPION }]
    .concat(more.slice(0, 4).map(k => (k === 'treasure' ? treasure() : { kind: k, value: k === 'scorpion' ? BOX_SCORPION : k === 'bill' ? BOX_BILL : null })));
  for (let i = deck.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [deck[i], deck[j]] = [deck[j], deck[i]]; }
  const k = deck.findIndex(b => b.kind === 'key');
  if (k === deck.length - 1) { const j = Math.floor(r() * (deck.length - 1)); [deck[k], deck[j]] = [deck[j], deck[k]]; }
  return deck;
};

/* --- the clues ------------------------------------------------------------------
   A clue is { id, s (strength 1-3), k (the phone's words: box_clue_<k>), v (its
   blanks) }, and it is TRUE for its box. Every candidate below says when it is
   true; a box gets only the ones that are. No clue names the kind outright:
   the strongest narrows it to two.
   ------------------------------------------------------------------------------ */
const BOX_TRAITS = {
  gain:    ['treasure', 'steal'],                              // whoever takes it surely gains money
  lose:    ['scorpion', 'bill'],                               // whoever takes it surely loses more money
  nomoney: ['key', 'empty'],                                   // no money moves at all
  moves:   ['treasure', 'scorpion', 'bill', 'steal'],          // money surely moves (double or nothing may move nothing)
  others:  ['bill', 'steal'],                                  // it touches a player other than the taker
  alone:   ['treasure', 'scorpion', 'double', 'key', 'empty'], // it touches the taker only
  luck:    ['double'],                                         // luck decides
  shiny:   ['treasure', 'key', 'double'],                      // something that shines
  alive:   ['scorpion']                                        // something alive
};
const BOX_TRAIT_STRENGTH = { gain: 2, lose: 2, nomoney: 2, moves: 1, others: 2, alone: 1, luck: 3, shiny: 2, alive: 3 };

/** Every true clue for this box. `prev` is the kind of the box opened before it (or null). */
const boxClueCandidates = (b, prev, rnd) => {
  const r = rnd || Math.random;
  const out = [];
  const others = BOX_KINDS.filter(k => k !== b.kind);
  const shuf = (list) => { const a = list.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  others.forEach(k => out.push({ id: 'not:' + k, s: 1, k: 'not', v: { a: k } }));
  Object.keys(BOX_TRAITS).forEach(t => {
    const yes = BOX_TRAITS[t].indexOf(b.kind) !== -1;
    // A trait held by one kind only would name it: its "yes" is the strongest; its "no" is weak.
    if (yes) out.push({ id: 'is:' + t, s: BOX_TRAIT_STRENGTH[t], k: 'is_' + t, v: {} });
    else if (t === 'luck' || t === 'alive' || t === 'shiny') out.push({ id: 'no:' + t, s: 1, k: 'no_' + t, v: {} });
  });
  const o = shuf(others);
  const two = shuf([b.kind, o[0]]);
  out.push({ id: 'two', s: 3, k: 'two', v: { a: two[0], b: two[1] } });
  const three = shuf([b.kind, o[1], o[2]]);
  out.push({ id: 'three', s: 2, k: 'three', v: { a: three[0], b: three[1], c: three[2] } });
  if (b.kind === 'treasure') {
    if (b.value > 300) out.push({ id: 'gt', s: 2, k: 'gt', v: { x: Math.max(100, b.value - (r() < 0.5 ? 100 : 200)) } });
    if (b.value < 800) out.push({ id: 'lt', s: 2, k: 'lt', v: { x: b.value + (r() < 0.5 ? 100 : 200) } });
  }
  if (prev) {
    if (prev === b.kind) out.push({ id: 'same', s: 3, k: 'same', v: {} });
    else out.push({ id: 'diff', s: 1, k: 'diff', v: {} });
  }
  return out;
};

/** Is this clue true for this box? The same test the tests hold every clue to. */
const boxClueTrue = (c, b, prev) => {
  if (!c || !b) return false;
  const tr = (t) => (BOX_TRAITS[t] || []).indexOf(b.kind) !== -1;
  const [kind, t] = c.id.split(':');
  if (kind === 'not') return b.kind !== t;
  if (kind === 'is') return tr(t);
  if (kind === 'no') return !tr(t);
  if (c.id === 'two') return [c.v.a, c.v.b].indexOf(b.kind) !== -1 && c.v.a !== c.v.b;
  if (c.id === 'three') return [c.v.a, c.v.b, c.v.c].indexOf(b.kind) !== -1;
  if (c.id === 'gt') return b.kind === 'treasure' && b.value > c.v.x;
  if (c.id === 'lt') return b.kind === 'treasure' && b.value < c.v.x;
  if (c.id === 'same') return !!prev && prev === b.kind;
  if (c.id === 'diff') return !!prev && prev !== b.kind;
  return false;
};

/**
 * One clue a player, all different, all true: about a third strong, about a
 * third middling, the rest weak (a bucket that runs short is filled from the
 * next), so the table has something to argue about and no one clue is the
 * same as another's.
 */
const boxDealClues = (b, prev, n, rnd) => {
  const r = rnd || Math.random;
  const cands = boxClueCandidates(b, prev, r).filter(c => boxClueTrue(c, b, prev));
  const shuf = (list) => { const a = list.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const by = { 3: shuf(cands.filter(c => c.s === 3)), 2: shuf(cands.filter(c => c.s === 2)), 1: shuf(cands.filter(c => c.s === 1)) };
  const want = { 3: Math.max(1, Math.floor(n / 3)), 2: Math.ceil(n / 3) };
  want[1] = n - want[3] - want[2];
  const picked = [];
  [3, 2, 1].forEach(s => { picked.push(...by[s].splice(0, want[s])); });
  const rest = shuf(by[2].concat(by[1], by[3]));
  while (picked.length < n && rest.length) picked.push(rest.shift());
  return shuf(picked).slice(0, n);
};

/* --- the game -------------------------------------------------------------------- */
const boxAction = (room, playerId, action, payload) => {
  if (action === 'start' || action === 'playAgain') {
    requireHost(room, playerId);
    const prev = room.shared || {};
    if (action === 'playAgain' && prev.phase !== 'gameover') return;
    const people = room.players.filter(p => !p.bot).map(p => p.id);
    if (people.length < BOX_MIN) throw new Error('محتاجين 3 لاعبين على الأقل');
    const roster = people.slice(0, BOX_MAX);
    const money = {};
    roster.forEach(id => { money[id] = BOX_START_MONEY; });
    room.secrets = {};
    const deck = boxDeal(Math.random);
    // «صندوق الختام»: its treasure, scorpion or bill counts double (the thief and double-or-nothing at the opening).
    const fin = deck[BOX_FINALE];
    if (fin && (fin.kind === 'treasure' || fin.kind === 'scorpion' || fin.kind === 'bill')) fin.value *= 2;
    // «عرض الحاج»: two boxes, never the finale, kept secret until they come.
    const offerAt = shuffled(Array.from({ length: BOX_FINALE }, (_, i) => i)).slice(0, BOX_OFFERS);
    room._box = { deck, clues: {}, bids: {}, insured: {}, peeks: {}, offerAt, pending: null };
    room.shared = {
      roster,
      order: shuffled(roster),     // the podiums, left to right on the stage
      boxes: BOX_COUNT,
      box: -1,
      start: BOX_START_MONEY,
      money,
      opened: [],                  // every box opened so far: { kind, value, winnerId, bid }
      finale: BOX_FINALE,          // the box announced as the finale (×2)
      offer: null,                 // «عرض الحاج» while it is on: { winnerId, bid, amount, endsAt }
      board: [],
      phase: 'talk'
    };
    room.phase = 'play';
    boxNext(room);
    return;
  }

  const s = room.shared;
  if (!s || room.phase !== 'play') throw new Error('اللعبة لم تبدأ بعد');
  if (s.phase === 'gameover') return;

  if (action === 'bid') {
    if (staleTap(payload, 'box', s.box)) return;
    if (s.phase !== 'talk' && s.phase !== 'bid') return;
    if (boxPresent(room).indexOf(playerId) === -1) throw new Error('إنت بتتفرج المرة دي');
    if (s.done.indexOf(playerId) !== -1) return;               // a bid is sent once
    const have = s.money[playerId] || 0;
    // «تأمين»: 50 ج on top of the bid, when there is the money for it (an older phone sends none).
    const insure = !!(payload && payload.insure === true) && have >= BOX_INSURE;
    const n = Math.floor(Number(payload && payload.amount));
    const amount = isFinite(n) ? Math.max(0, Math.min(have - (insure ? BOX_INSURE : 0), n)) : 0;
    room._box.bids[playerId] = amount;
    if (insure) room._box.insured[playerId] = true;
    s.done = s.done.concat([playerId]);
    boxWriteSecrets(room);
    if (boxAllIn(room)) boxOpen(room);
    return;
  }
  if (action === 'openBids') {
    // The talk is over sooner: the host (or a stand-in) calls the bids now.
    requireMoveOn(room, playerId);
    if (staleTap(payload, 'box', s.box)) return;
    if (s.phase !== 'talk') return;
    boxLastCall(room);
    return;
  }
  if (action === 'closeBids') {
    requireMoveOn(room, playerId);
    if (staleTap(payload, 'box', s.box)) return;
    if (s.phase !== 'talk' && s.phase !== 'bid') return;
    boxOpen(room);
    return;
  }
  if (action === 'deal') {
    // «عرض الحاج»: the winner takes the money (take: true) or opens the box.
    if (staleTap(payload, 'box', s.box)) return;
    if (s.phase !== 'offer' || !s.offer || playerId !== s.offer.winnerId) return;
    boxApply(room, !!(payload && payload.take === true));
    return;
  }
  if (action === 'nextBox') {
    requireMoveOn(room, playerId);
    if (staleTap(payload, 'box', s.box)) return;
    if (s.phase !== 'open') return;
    // The show is the star: it plays to its end before anyone moves on.
    if (Date.now() < (s.openAt || 0) + ((s.result && s.result.showMs) || BOX_SHOW_MS) - 400) return;
    boxNext(room);
    return;
  }
  throw new Error('إجراء غير معروف');
};

/** Everyone still here has sent a bid. */
const boxAllIn = (room) => {
  const s = room.shared;
  const here = boxPresent(room);
  return here.length > 0 && here.every(id => s.done.indexOf(id) !== -1);
};

/** The next box on the table (or the end): fresh clues for everyone here, the minute starts. */
const boxNext = (room) => {
  const s = room.shared;
  const h = room._box;
  const here = boxPresent(room);
  if (s.box + 1 >= s.boxes || here.length < 2) { boxGameOver(room); return; }
  s.box += 1;
  const b = h.deck[s.box];
  const prev = s.box > 0 ? h.deck[s.box - 1].kind : null;
  const clues = boxDealClues(b, prev, here.length, Math.random);
  h.clues = {};
  shuffled(here).forEach((id, i) => { h.clues[id] = clues[i % clues.length]; });
  h.bids = {};
  h.insured = {};
  h.pending = null;
  s.offer = null;
  // A key opened on the box before shows this one to its holder until it opens.
  Object.keys(h.peeks || {}).forEach(id => { if (h.peeks[id].box < s.box) delete h.peeks[id]; });
  s.phase = 'talk';
  s.done = [];
  s.talkEndsAt = Date.now() + BOX_TALK_MS;
  s.bidEndsAt = null;
  s.openAt = null;
  s.nextAt = null;
  s.result = null;
  s.board = boxBoard(room);
  boxWriteSecrets(room);
};

const boxLastCall = (room) => {
  const s = room.shared;
  s.phase = 'bid';
  s.talkEndsAt = null;
  s.bidEndsAt = Date.now() + BOX_LAST_CALL_MS;
};

/** What each phone may know: its clue, its own bid once sent, a key's peek. */
const boxWriteSecrets = (room) => {
  const s = room.shared;
  const h = room._box;
  room.secrets = {};
  if (s.phase === 'gameover') return;
  boxPresent(room).forEach(id => {
    const x = { box: s.box };
    if (s.phase === 'talk' || s.phase === 'bid') {
      if (h.clues[id]) x.clue = h.clues[id];
      if (Object.prototype.hasOwnProperty.call(h.bids, id)) x.bid = h.bids[id];
      if ((h.insured || {})[id]) x.insured = true;
    }
    const p = (h.peeks || {})[id];
    // The key's holder knows the next box from the moment the key comes out until that box opens.
    if (p && (p.box === s.box ? s.phase !== 'open' : p.box === s.box + 1)) x.peek = p;
    room.secrets[id] = x;
  });
};

/**
 * The bids turn over: the highest takes the box and pays (a tie goes to the
 * poorer of the tied, then by lot); nobody bidding anything leaves it with
 * nobody. Then the box opens and does what it does.
 */
const boxOpen = (room) => {
  const s = room.shared;
  const h = room._box;
  const here = boxPresent(room);
  const bids = {};
  here.forEach(id => { bids[id] = Object.prototype.hasOwnProperty.call(h.bids, id) ? h.bids[id] : 0; });
  const top = Math.max(0, ...Object.keys(bids).map(id => bids[id]));
  let winnerId = null, tie = false, tieBy = null;
  if (top > 0) {
    let best = Object.keys(bids).filter(id => bids[id] === top);
    if (best.length > 1) {
      tie = true;
      const poorest = Math.min(...best.map(id => s.money[id] || 0));
      const poor = best.filter(id => (s.money[id] || 0) === poorest);
      // «للي فلوسه أقل» only when that settled it: two or more equally poorest are drawn by lot.
      tieBy = poor.length === 1 ? 'poorer' : 'lot';
      best = poor;
    }
    winnerId = best[Math.floor(Math.random() * best.length)];
  }
  h.pending = { bids, winnerId, top, tie, tieBy };
  // «عرض الحاج»: at its two boxes (never the finale) the winner is offered the old host's money first.
  if (winnerId && (h.offerAt || []).indexOf(s.box) !== -1 && s.box !== BOX_FINALE) {
    s.phase = 'offer';
    s.talkEndsAt = s.bidEndsAt = null;
    s.offer = { winnerId, bid: top, amount: boxOfferAmount(room, top), endsAt: Date.now() + BOX_OFFER_MS };
    boxWriteSecrets(room);
    return;
  }
  boxApply(room, false);
};

/**
 * What the old host offers for the box back (the boxes left and the bid): most of the bid back,
 * and some of what the boxes still on the table are worth on average, give or take a tenth.
 */
const boxOfferAmount = (room, bid) => {
  const s = room.shared;
  const h = room._box;
  const n = boxPresent(room).length;
  const left = h.deck.slice(s.box);
  const worth = (b) => (b.kind === 'treasure' ? b.value : b.kind === 'scorpion' ? -b.value : b.kind === 'bill' ? -b.value * Math.max(0, n - 1)
    : b.kind === 'steal' ? 250 : b.kind === 'double' ? bid : 0);
  const ev = left.reduce((a, b) => a + worth(b), 0) / Math.max(1, left.length);
  const base = bid * 0.85 + Math.max(0, ev) * 0.45;
  return Math.max(50, boxRound10(base * (0.9 + Math.random() * 0.2)));
};

/**
 * The box does what it does (or, «عرض الحاج» taken, the winner pockets the offer and the box is
 * only shown): the insured pay their 50, the winner pays the bid, then the effect - doubled in
 * the finale, halved for the insured on a scorpion or the thief.
 */
const boxApply = (room, took) => {
  const s = room.shared;
  const h = room._box;
  const b = h.deck[s.box];
  const here = boxPresent(room);
  const p = h.pending || { bids: {}, winnerId: null, top: 0, tie: false, tieBy: null };
  const bids = p.bids, top = p.top, tie = p.tie, tieBy = p.tieBy;
  const winnerId = p.winnerId && s.money[p.winnerId] !== undefined ? p.winnerId : null;
  const x2 = s.box === BOX_FINALE;
  const offer = s.offer;
  const deal = !!(took && offer && winnerId === offer.winnerId) ? offer.amount : null;
  const before = Object.assign({}, s.money);
  const money = s.money;
  const moves = [];      // money that flies on the screen: { from, to, n } (null is the bank)
  let coin = null, victimId = null, peekFor = null;
  // «تأمين»: everyone insured pays the 50 now, whoever takes the box.
  const insured = here.filter(id => (h.insured || {})[id]);
  const insPaid = {};
  insured.forEach(id => { const n = Math.min(money[id], BOX_INSURE); money[id] -= n; if (n) moves.push({ from: id, to: null, n, at: 'ins' }); });
  if (winnerId && deal !== null) {
    money[winnerId] -= top;
    moves.push({ from: winnerId, to: null, n: top, at: 'pay' });
    money[winnerId] += deal;
    moves.push({ from: null, to: winnerId, n: deal, at: 'deal' });
  } else if (winnerId) {
    money[winnerId] -= top;
    moves.push({ from: winnerId, to: null, n: top, at: 'pay' });
    const w = winnerId;
    if (b.kind === 'treasure') {
      money[w] += b.value;
      moves.push({ from: null, to: w, n: b.value });
    } else if (b.kind === 'scorpion') {
      const full = Math.min(money[w], b.value);
      const n = (h.insured || {})[w] ? Math.min(money[w], boxRound10(b.value / 2)) : full;
      if (full > n) insPaid[w] = full - n;
      money[w] -= n;
      moves.push({ from: w, to: null, n });
    } else if (b.kind === 'bill') {
      here.filter(id => id !== w).forEach(id => {
        const n = Math.min(money[w], b.value);
        if (n <= 0) return;
        money[w] -= n;
        money[id] += n;
        moves.push({ from: w, to: id, n });
      });
    } else if (b.kind === 'steal') {
      const rich = here.filter(id => id !== w).sort((x, y) => (money[y] - money[x]) || (s.order.indexOf(x) - s.order.indexOf(y)))[0];
      if (rich) {
        const full = x2 ? Math.min(money[rich], boxRound10(money[rich] / 2) * 2) : boxRound10(money[rich] / 2);
        const n = (h.insured || {})[rich] ? boxRound10(full / 2) : full;
        if (full > n) insPaid[rich] = full - n;
        victimId = rich;
        money[rich] -= n;
        money[w] += n;
        moves.push({ from: rich, to: w, n });
      }
    } else if (b.kind === 'double') {
      coin = Math.random() < 0.5 ? 'heads' : 'tails';
      const win = top * (x2 ? 4 : 2);
      if (coin === 'heads') { money[w] += win; moves.push({ from: null, to: w, n: win }); }
    } else if (b.kind === 'key') {
      const next = h.deck[s.box + 1];
      if (next) {
        peekFor = w;
        h.peeks[w] = { box: s.box + 1, kind: next.kind, value: next.value };
      }
    }
  }
  const delta = {};
  Object.keys(money).forEach(id => { delta[id] = money[id] - (before[id] || 0); });
  s.result = { box: s.box, kind: b.kind, value: b.value, bids, winnerId, bid: top, tie, tieBy, coin, victimId, peekFor, before, delta, moves,
    insured, insPaid, x2, offer: offer ? offer.amount : null, deal };
  s.result.showMs = boxShowMs(s.result);
  s.opened = s.opened.concat([{ kind: b.kind, value: b.value, winnerId, bid: top, coin, x2, deal }]);
  s.offer = null;
  h.pending = null;
  h.insured = {};
  s.phase = 'open';
  s.talkEndsAt = s.bidEndsAt = null;
  s.openAt = Date.now();
  s.nextAt = s.openAt + s.result.showMs + BOX_AFTER_MS;
  s.board = boxBoard(room);
  h.bids = {};
  h.clues = {};
  boxWriteSecrets(room);
};

const boxGameOver = (room) => {
  const s = room.shared;
  s.phase = 'gameover';
  s.talkEndsAt = s.bidEndsAt = s.nextAt = null;
  s.board = boxBoard(room);
  room._box = null;
  room.secrets = {};
};

/**
 * The board: money, richest first, everyone who played and is still here.
 * While a box is being opened it keeps the money from before the opening: the
 * show tells the table what the box did, and a strip must not tell it first.
 */
const boxBoard = (room) => {
  const s = room.shared || {};
  const money = s.phase === 'open' && s.result && s.result.before ? s.result.before : (s.money || {});
  return (s.roster || [])
    .filter(id => boxHere(room, id))
    .map(id => ({ id, name: roomPlayerName(room, id), score: money[id] || 0 }))
    .sort((a, b) => b.score - a.score);
};

/** The server's next moment: the end of the talk, of the last call, of the show. */
const boxDeadline = (room) => {
  const s = room.shared || {};
  if (room.phase !== 'play') return null;
  if (s.phase === 'talk' && s.talkEndsAt) return s.talkEndsAt + BOX_GRACE_MS;
  if (s.phase === 'bid' && s.bidEndsAt) return s.bidEndsAt + BOX_GRACE_MS;
  if (s.phase === 'offer' && s.offer) return s.offer.endsAt + BOX_GRACE_MS;
  if (s.phase === 'open' && s.nextAt) return s.nextAt;
  return null;
};

const boxTimeout = (room, now) => {
  const s = room.shared || {};
  if (room.phase !== 'play') return false;
  if (s.phase === 'talk' && s.talkEndsAt && now >= s.talkEndsAt + BOX_GRACE_MS) { boxLastCall(room); return true; }
  if (s.phase === 'bid' && s.bidEndsAt && now >= s.bidEndsAt + BOX_GRACE_MS) { boxOpen(room); return true; }
  // No answer to the old host: the box opens.
  if (s.phase === 'offer' && s.offer && now >= s.offer.endsAt + BOX_GRACE_MS) { boxApply(room, false); return true; }
  if (s.phase === 'open' && s.nextAt && now >= s.nextAt) { boxNext(room); return true; }
  return false;
};

/**
 * Someone left: their bid and clue go with them, their money leaves the board;
 * the bids may all be in now. Fewer than two left ends the game.
 */
const boxPlayerLeft = (room, playerId) => {
  const s = room.shared;
  const h = room._box;
  if (!s || room.phase !== 'play' || s.phase === 'gameover') return;
  if (h) { delete h.bids[playerId]; delete h.clues[playerId]; if (h.peeks) delete h.peeks[playerId]; if (h.insured) delete h.insured[playerId]; }
  s.done = (s.done || []).filter(id => id !== playerId);
  if (boxPresent(room).length < 2) { boxGameOver(room); return; }
  if ((s.phase === 'talk' || s.phase === 'bid') && boxAllIn(room)) { boxOpen(room); return; }
  // The one offered the deal left: the box opens on the bids as they stood (nobody takes it if it was them).
  if (s.phase === 'offer' && s.offer && s.offer.winnerId === playerId) { if (h && h.pending) h.pending.winnerId = null; boxApply(room, false); return; }
  s.board = boxBoard(room);
  if (h) boxWriteSecrets(room);
};
