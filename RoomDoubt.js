/* ============================================================================
   كدّاب — I DOUBT IT (rooms)
   ----------------------------------------------------------------------------
   Bundled into the Worker after RoomGames.js (FILES in rooms-worker/build.mjs),
   whose helpers it uses (shuffled, requireHost, staleTap, the bot hook). The
   cards are PlayingCards.js, shared with the page.

   The owner's rules (23 Sep 2026, asked one at a time):
     - 3 to 12 players (computer players count), one deck up to six, two decks
       shuffled together from seven; every card dealt. Computer players, easy
       and hard.
     - The same rank until a call: whoever leads names any rank and lays any
       number of cards face down; everyone after lays cards claiming that same
       rank, or passes.
     - Anyone still holding cards may call كدّاب! on the last play, the first
       tap wins (the order the server heard them in), until the next player
       lays cards or passes.
     - The cards of that play are turned over. A lie: the liar takes the whole
       pile. The truth: the caller takes it. Whoever was right leads the next
       rank.
     - Everyone passes after a play: the pile goes out of the game face down,
       and the last to play leads.
     - The game: a lobby choice, "first out wins" (the default) or "play on
       for places". A last play still has to survive a call: the player is
       out only once the next player lays cards or passes without a call, or
       a call turns their cards over true.
     - Four of a rank is nothing special. A turn clock, off by default, 30 or
       60 seconds: the phone passes, or when leading lays one card truthfully.
       The host's skip does the same for a phone that went quiet.
     - Play again keeps a tally of the games won (the board).

   Where the cards are:
     room._doubt         every hand ({ i, c }), the pile (each play with its
                         cards) and the computer players' choice of caller.
                         Never projected.
     room.secrets[pid]   that phone's own hand, sorted.
     room.shared         the table: how many cards each holds, the rank being
                         claimed, the plays on the pile (who, how many), the
                         play open to a call, who passed, whose turn, the
                         places, and every move as an event - a card's face
                         only once a call has turned it over.

   A player who leaves keeps their seat in shared.order (so "the next seat"
   still means the same thing) but is out of the game: their hand leaves it,
   their last play can no longer be called, and a turn of theirs passes.
   ========================================================================= */
const DOUBT_CLOCKS = [0, 30, 60];
const DOUBT_ENDS = ['first', 'places'];
const DOUBT_EVENTS = 40;
const DOUBT_GRACE_MS = 1500;
const DOUBT_MIN = 3;
const DOUBT_MAX = 12;
const DOUBT_PLAYS_SHOWN = 12;
const DOUBT_BOT_TURN_MS = [1900, 2900];     // long enough for the table to call first
const DOUBT_BOT_CALL_MS = [900, 1800];

const doubtDecksFor = (n) => (n >= 7 ? 2 : 1);
const doubtHere = (room, id) => room.players.some(p => p.id === id);
const doubtRand = (r) => r[0] + Math.floor(Math.random() * (r[1] - r[0]));

const doubtAction = (room, playerId, action, payload) => {
  const p = payload || {};
  if (action === 'start' || action === 'playAgain') { doubtNewGame(room, playerId, action, p); return; }
  const s = room.shared;
  if (!s || !s.phase || !room._doubt) throw new Error('اللعبة لم تبدأ بعد');
  if (s.phase !== 'play') return;
  if (action === 'skipTurn') {
    requireHost(room, playerId);
    if (staleTap(p, 'seq', s.turnSeq)) return;
    doubtApply(room, () => doubtAuto(room, 'host'));
    return;
  }
  if (action === 'call') {
    // Aimed at a play that is no longer the last one: dropped without a word.
    if (!s.last || staleTap(p, 'play', s.last.id)) return;
    doubtApply(room, () => doubtCall(room, playerId));
    return;
  }
  if (staleTap(p, 'seq', s.turnSeq)) return;
  if (action === 'play') { doubtApply(room, () => doubtPlay(room, playerId, p)); return; }
  if (action === 'pass') { doubtApply(room, () => doubtPass(room, playerId)); return; }
  throw new Error('إجراء غير معروف');
};

/** Runs a change, then writes what every phone may see. */
const doubtApply = (room, change) => {
  change();
  doubtSync(room);
};

const doubtEvent = (room, type, fields) => {
  const s = room.shared;
  s.eventSeq = (s.eventSeq || 0) + 1;
  s.events = (s.events || []).concat([Object.assign({ seq: s.eventSeq, type: type }, fields || {})]).slice(-DOUBT_EVENTS);
};

/* --- a game --------------------------------------------------------------------- */

const doubtNewGame = (room, playerId, action, p) => {
  requireHost(room, playerId);
  const prev = room.shared || {};
  if (action === 'playAgain' && prev.phase !== 'gameover') return;
  if (room.players.length < DOUBT_MIN) throw new Error('كدّاب محتاج 3 لاعبين على الأقل: ضيف لاعب كمبيوتر');
  if (room.players.length > DOUBT_MAX) throw new Error('كدّاب لحد 12 لاعب');
  const was = action === 'playAgain' ? (prev.settings || {}) : {};
  const end = DOUBT_ENDS.indexOf(p.end) !== -1 ? p.end : (DOUBT_ENDS.indexOf(was.end) !== -1 ? was.end : 'first');
  const clock = DOUBT_CLOCKS.indexOf(Number(p.turnClock)) !== -1 ? Number(p.turnClock) : (DOUBT_CLOCKS.indexOf(Number(was.turnClock)) !== -1 ? Number(was.turnClock) : 0);
  const order = shuffled(room.players.map(pl => pl.id));
  room.secrets = {};
  room.shared = {
    settings: { end: end, turnClock: clock },
    order: order,
    roster: order.slice(),
    decks: doubtDecksFor(order.length),
    // The games won at this table, counted across play again: the board.
    wins: action === 'playAgain' && prev.wins ? prev.wins : {},
    // Carried over a play again, so a tap or an animation from the last game is never taken for this one.
    turnSeq: (prev.turnSeq || 0) + 1,
    eventSeq: prev.eventSeq || 0,
    dealId: newDealId()
  };
  doubtDeal(room);
  doubtSync(room);
};

const doubtDeal = (room) => {
  const s = room.shared;
  const cards = shuffled(pcDeck(s.decks));
  // Ids at random, so an id says nothing about its card.
  const ids = shuffled(cards.map((c, j) => j));
  const g = { hands: {}, pile: [], botCall: {}, nextPlay: 1 };
  room._doubt = g;
  s.order.forEach(id => { g.hands[id] = []; });
  cards.forEach((c, j) => { g.hands[s.order[j % s.order.length]].push({ i: ids[j], c: c }); });
  s.phase = 'play';
  room.phase = 'play';
  s.rank = null;
  s.plays = [];
  s.last = null;
  s.passed = [];
  s.places = [];
  s.pendingOut = null;
  s.winners = null;
  s.events = [];
  s.endsAt = null;
  doubtEvent(room, 'deal', { n: cards.length, decks: s.decks });
  // The seats are shuffled, so the first seat - who leads - is anyone.
  doubtStartTurn(room, s.order[0], 'lead');
};

/* --- who is still playing, and whose turn ----------------------------------------- */

const doubtHand = (room, id) => (room._doubt.hands[id] || []);
/** Those who can still play a card: here, not placed, and holding cards (a player whose last play waits on a call holds none). */
const doubtHolding = (room) => {
  const s = room.shared;
  return (s.order || []).filter(id => doubtHere(room, id) && s.places.indexOf(id) === -1 && doubtHand(room, id).length > 0);
};

/** The next seat after `pid` that holds cards. */
const doubtNextSeat = (room, pid) => {
  const s = room.shared;
  const n = s.order.length;
  const at = s.order.indexOf(pid);
  const holding = doubtHolding(room);
  for (let k = 1; k <= n; k++) {
    const id = s.order[((at === -1 ? n - 1 : at) + k) % n];
    if (holding.indexOf(id) !== -1) return id;
  }
  return null;
};

const doubtStartTurn = (room, pid, stage) => {
  const s = room.shared;
  if (!pid) return;
  s.turn = { pid: pid, stage: stage };
  s.turnSeq = (s.turnSeq || 0) + 1;
  s.endsAt = s.settings.turnClock ? Date.now() + s.settings.turnClock * 1000 : null;
};

/** The one who leads next: `pid` if they still hold cards, else the next seat after them. */
const doubtLeaderFrom = (room, pid) => (doubtHolding(room).indexOf(pid) !== -1 ? pid : doubtNextSeat(room, pid));

/* --- the moves ------------------------------------------------------------------------ */

/** The window for calling the last play closes: a player whose last cards weren't called is out. */
const doubtCloseCall = (room) => {
  const s = room.shared;
  const out = s.pendingOut;
  s.last = null;
  if (out) doubtFinish(room, out);
};

/** A player is out of cards for good: a place, and perhaps the end. */
const doubtFinish = (room, pid) => {
  const s = room.shared;
  s.pendingOut = null;
  if (s.places.indexOf(pid) !== -1) return;
  s.places.push(pid);
  doubtEvent(room, 'out', { pid: pid, place: s.places.length });
  if (s.settings.end === 'first') { doubtGameOver(room, 'out', true); return; }
  const left = doubtHolding(room);
  if (left.length <= 1) {
    left.forEach(id => { s.places.push(id); });
    doubtGameOver(room, 'places', true);
  }
};

/** The game is over. `counted`: the first place was won at the table (not by everyone else leaving). */
const doubtGameOver = (room, why, counted) => {
  const s = room.shared;
  if (s.phase === 'gameover') return;
  s.phase = 'gameover';
  room.phase = 'gameover';
  s.turn = null;
  s.endsAt = null;
  s.last = null;
  s.pendingOut = null;
  const first = s.places[0] || null;
  s.winners = first ? [first] : [];
  if (first && counted) s.wins[first] = (s.wins[first] || 0) + 1;
  doubtEvent(room, 'win', { pid: first, why: why });
};

const doubtPlay = (room, me, p) => {
  const s = room.shared;
  const g = room._doubt;
  if (!s.turn || s.turn.pid !== me) throw new Error('مش دورك');
  const hand = doubtHand(room, me);
  const want = Array.isArray(p.cards) ? p.cards.map(String) : [];
  const picked = hand.filter(c => want.indexOf(String(c.i)) !== -1);
  if (!picked.length || picked.length !== new Set(want).size) throw new Error('اختار كروت من إيدك');
  const lead = s.turn.stage === 'lead';
  let rank = s.rank;
  if (lead) {
    rank = String(p.rank || '');
    if (PC_RANKS.indexOf(rank) === -1) throw new Error('قول الكروت دي إيه');
  }
  // The play before this one can't be called any more.
  doubtCloseCall(room);
  if (s.phase !== 'play') return;
  g.hands[me] = hand.filter(c => picked.indexOf(c) === -1);
  const id = 'p' + (g.nextPlay++);
  g.pile.push({ id: id, pid: me, cards: picked, rank: rank });
  g.botCall = {};
  s.rank = rank;
  s.last = { id: id, pid: me, n: picked.length, rank: rank };
  s.plays = (s.plays || []).concat([{ id: id, pid: me, n: picked.length }]).slice(-DOUBT_PLAYS_SHOWN);
  s.passed = [];
  doubtEvent(room, 'play', { pid: me, n: picked.length, rank: rank, lead: lead, id: id });
  if (!g.hands[me].length) s.pendingOut = me;
  const next = doubtNextSeat(room, me);
  // Nobody else holds a card: the last play stands, and its player is out.
  if (!next || next === me) { doubtCloseCall(room); return; }
  doubtStartTurn(room, next, 'follow');
};

/** Who made the last play on the pile, open to a call or not. */
const doubtLastPlayer = (room) => {
  const s = room.shared;
  if (s.last) return s.last.pid;
  return s.plays && s.plays.length ? s.plays[s.plays.length - 1].pid : null;
};

/**
 * After a pass (or a turn that passed because its player left): everyone who
 * could answer the last play has passed, so the pile goes out and the last to
 * play leads; otherwise the next seat follows.
 */
const doubtAfterPass = (room, from, lastPid) => {
  const s = room.shared;
  const others = doubtHolding(room).filter(id => id !== lastPid);
  if (others.every(id => s.passed.indexOf(id) !== -1)) {
    const n = room._doubt.pile.reduce((a, pl) => a + pl.cards.length, 0);
    room._doubt.pile = [];
    room._doubt.botCall = {};
    s.rank = null;
    s.plays = [];
    s.passed = [];
    const lead = doubtLeaderFrom(room, lastPid);
    doubtEvent(room, 'pileOut', { n: n, lead: lead });
    doubtStartTurn(room, lead, 'lead');
    return;
  }
  doubtStartTurn(room, doubtNextSeat(room, from), 'follow');
};

const doubtPass = (room, me) => {
  const s = room.shared;
  if (!s.turn || s.turn.pid !== me) throw new Error('مش دورك');
  if (s.turn.stage !== 'follow') throw new Error('لازم تبدأ بكروت');
  const lastPid = doubtLastPlayer(room);
  doubtCloseCall(room);
  if (s.phase !== 'play') return;
  s.passed = (s.passed || []).concat([me]);
  doubtEvent(room, 'pass', { pid: me });
  doubtAfterPass(room, me, lastPid);
};

const doubtCall = (room, me) => {
  const s = room.shared;
  const g = room._doubt;
  const last = s.last;
  if (!last) return;
  if (last.pid === me) throw new Error('مينفعش تكدّب نفسك');
  if (doubtHolding(room).indexOf(me) === -1) throw new Error('انت مش في الدور ده');
  const play = g.pile.find(pl => pl.id === last.id);
  if (!play) return;
  const truth = play.cards.every(c => pcRank(c.c) === play.rank);
  const taker = truth ? me : play.pid;
  const all = [];
  g.pile.forEach(pl => pl.cards.forEach(c => all.push(c)));
  g.hands[taker] = doubtHand(room, taker).concat(all);
  g.pile = [];
  g.botCall = {};
  s.rank = null;
  s.plays = [];
  s.passed = [];
  s.last = null;
  // The play's own faces, and nothing else of the pile: the rest goes to the taker face down.
  doubtEvent(room, 'call', { pid: me, target: play.pid, rank: play.rank, cards: play.cards.map(c => c.c), truth: truth, taker: taker, n: all.length, id: play.id });
  // A last play called true: its player is out. Called a lie: they take the pile and play on.
  if (s.pendingOut === play.pid) {
    if (truth) doubtFinish(room, play.pid);
    else s.pendingOut = null;
  }
  if (s.phase !== 'play') return;
  // Whoever was right leads.
  doubtStartTurn(room, doubtLeaderFrom(room, truth ? play.pid : me), 'lead');
};

/** The clock, or the host for a quiet phone: pass, or lead with one card, truthfully. */
const doubtAuto = (room, why) => {
  const s = room.shared;
  if (!s.turn) return;
  const me = s.turn.pid;
  doubtEvent(room, 'auto', { pid: me, why: why });
  if (s.turn.stage === 'follow') { doubtPass(room, me); return; }
  const hand = doubtHand(room, me);
  if (!hand.length) return;
  const rank = doubtMostHeld(hand)[0];
  const card = hand.find(c => pcRank(c.c) === rank);
  doubtPlay(room, me, { cards: [card.i], rank: rank });
};

/** The ranks a hand holds, most copies first. */
const doubtMostHeld = (hand) => {
  const n = {};
  hand.forEach(c => { const r = pcRank(c.c); n[r] = (n[r] || 0) + 1; });
  return Object.keys(n).sort((a, b) => n[b] - n[a] || pcRankIndex(a) - pcRankIndex(b));
};

/* --- what every phone may see ------------------------------------------------------ */

const doubtSync = (room) => {
  const s = room.shared;
  const g = room._doubt;
  if (!s || !g) return;
  const counts = {};
  (s.order || []).forEach(id => { counts[id] = doubtHand(room, id).length; });
  s.counts = counts;
  s.pileCount = g.pile.reduce((a, pl) => a + pl.cards.length, 0);
  room.secrets = {};
  (s.order || []).filter(id => doubtHere(room, id)).forEach(id => {
    room.secrets[id] = { hand: pcSorted(doubtHand(room, id), c => c.c).map(c => ({ i: c.i, c: c.c })) };
  });
  s.board = doubtBoard(room);
};

/** The night's board: the wins at this table, most first. */
const doubtBoard = (room) => {
  const s = room.shared;
  return (s.order || []).filter(id => doubtHere(room, id))
    .map(id => ({ id: id, name: roomPlayerName(room, id), score: (s.wins || {})[id] || 0 }))
    .sort((a, b) => b.score - a.score);
};

/* --- the server's clock ------------------------------------------------------------ */

const doubtDeadline = (room) => {
  const s = room.shared || {};
  return s.phase === 'play' && s.turn && s.endsAt ? s.endsAt + DOUBT_GRACE_MS : null;
};

const doubtTimeout = (room, now) => {
  const s = room.shared || {};
  if (s.phase !== 'play' || !s.turn || !s.endsAt || now < s.endsAt + DOUBT_GRACE_MS || !room._doubt) return false;
  doubtApply(room, () => doubtAuto(room, 'clock'));
  return true;
};

/* --- someone leaves: their cards leave the game, and play goes on ------------------ */

const doubtPlayerLeft = (room, playerId) => {
  const s = room.shared;
  const g = room._doubt;
  if (!s || !g || s.phase !== 'play' || (s.order || []).indexOf(playerId) === -1) return;
  const wasTurn = s.turn && s.turn.pid === playerId;
  const stage = wasTurn ? s.turn.stage : null;
  const lastPid = doubtLastPlayer(room);
  g.hands[playerId] = [];
  if (s.pendingOut === playerId) s.pendingOut = null;
  if (s.last && s.last.pid === playerId) s.last = null;
  s.passed = (s.passed || []).filter(id => id !== playerId);
  doubtEvent(room, 'left', { pid: playerId });
  let holding = doubtHolding(room);
  if (holding.length < 2) {
    // A last play still open stands: its player is out, and may have won.
    if (s.pendingOut) doubtCloseCall(room);
    if (s.phase === 'play') {
      const earned = s.places.length > 0;
      doubtHolding(room).forEach(id => { if (s.places.indexOf(id) === -1) s.places.push(id); });
      doubtGameOver(room, 'left', earned);
    }
  } else if (wasTurn) {
    // Their turn passes: a lead goes to the next seat, a follow counts as a pass.
    if (stage === 'lead' || !s.rank) doubtStartTurn(room, doubtNextSeat(room, playerId), 'lead');
    else doubtAfterPass(room, playerId, lastPid);
  }
  doubtSync(room);
};

/* --- computer players ------------------------------------------------------------------
   From their own hand and what the table saw. On a play, one bot may call: it
   knows a claim is a lie when its own copies of the rank - in its hand and
   the ones it laid on this pile itself - and the claim add up to more than
   the decks hold; otherwise it calls on a hunch, more often on a big claim or
   a player about to go out (hard). On its turn it leads the rank it holds
   most, follows truthfully when it can, and otherwise bluffs a card or passes
   (hard bluffs when the pile is small or its hand nearly empty).
   ------------------------------------------------------------------------------ */

/** The copies of `rank` a bot has seen for itself: in its hand, and the true ones it laid on this pile. */
const doubtBotSeen = (room, id, rank) => {
  const inHand = doubtHand(room, id).filter(c => pcRank(c.c) === rank).length;
  const laid = room._doubt.pile.filter(pl => pl.pid === id)
    .reduce((a, pl) => a + pl.cards.filter(c => pcRank(c.c) === rank).length, 0);
  return inHand + laid;
};

const doubtBotCaller = (room) => {
  const s = room.shared;
  const g = room._doubt;
  const last = s.last;
  if (!last) return null;
  if (g.botCall[last.id] !== undefined) return g.botCall[last.id];
  let who = null;
  const copies = 4 * (s.decks || 1);
  const bots = doubtHolding(room).filter(id => id !== last.pid && isRoomBot(room, id));
  for (const id of shuffled(bots)) {
    const level = roomBotLevel(room, id) || 'easy';
    const mine = level === 'hard' ? doubtBotSeen(room, id, last.rank) : doubtHand(room, id).filter(c => pcRank(c.c) === last.rank).length;
    let chance;
    if (mine + last.n > copies) chance = level === 'hard' ? 1 : 0.6;
    else if (s.pendingOut === last.pid) chance = level === 'hard' ? 0.7 : 0.3;
    else if (level === 'hard') chance = (last.n >= 3 ? 0.3 : last.n === 2 ? 0.14 : 0.06) + (mine >= 2 ? 0.1 : 0);
    else chance = 0.1;
    if (Math.random() < chance) { who = id; break; }
  }
  g.botCall = {};
  g.botCall[last.id] = who;
  return who;
};

const doubtBotTurn = (room, pid, level) => {
  const s = room.shared;
  const hand = doubtHand(room, pid);
  const seq = s.turnSeq;
  if (!hand.length) return null;
  const byRank = (r) => hand.filter(c => pcRank(c.c) === r);
  const ranks = doubtMostHeld(hand);
  if (s.turn.stage === 'lead') {
    const rank = level === 'hard' ? ranks[0] : ranks[Math.floor(Math.random() * ranks.length)];
    let cards = byRank(rank);
    // Hard sometimes slips one more card in with the truth.
    if (level === 'hard' && hand.length > cards.length + 2 && Math.random() < 0.25) {
      const extra = byRank(ranks[ranks.length - 1]).find(c => pcRank(c.c) !== rank);
      if (extra) cards = cards.concat([extra]);
    }
    return { action: 'play', payload: { cards: cards.map(c => c.i), rank: rank, seq: seq } };
  }
  const have = byRank(s.rank);
  if (have.length) return { action: 'play', payload: { cards: have.map(c => c.i), seq: seq } };
  const pile = s.pileCount || 0;
  const bluff = level === 'hard' ? (hand.length <= 2 ? 0.6 : pile <= 4 ? 0.45 : 0.22) : 0.3;
  if (Math.random() < bluff) {
    // The card it cares least about: one of the rank it holds fewest of.
    const give = byRank(ranks[ranks.length - 1])[0];
    return { action: 'play', payload: { cards: [give.i], seq: seq } };
  }
  return { action: 'pass', payload: { seq: seq } };
};

ROOM_BOT_GAMES.doubt = {
  max: DOUBT_MAX,
  pending(room) {
    const s = room.shared || {};
    if (s.phase !== 'play' || !s.turn || !room._doubt) return null;
    const caller = doubtBotCaller(room);
    if (caller) return { pid: caller, key: 'call|' + s.last.id, delay: doubtRand(DOUBT_BOT_CALL_MS) };
    if (!isRoomBot(room, s.turn.pid)) return null;
    return { pid: s.turn.pid, key: 'turn|' + s.turnSeq, delay: doubtRand(s.last ? DOUBT_BOT_TURN_MS : [1300, 2000]) };
  },
  decide(room, pid) {
    const s = room.shared || {};
    if (s.phase !== 'play' || !s.turn) return null;
    if (s.last && room._doubt.botCall[s.last.id] === pid) return { action: 'call', payload: { play: s.last.id } };
    if (s.turn.pid === pid) return doubtBotTurn(room, pid, roomBotLevel(room, pid) || 'easy');
    return null;
  },
  fallback(room, pid) {
    const s = room.shared || {};
    if (s.phase !== 'play' || !s.turn || s.turn.pid !== pid) return null;
    if (s.turn.stage === 'follow') return { action: 'pass', payload: { seq: s.turnSeq } };
    const hand = doubtHand(room, pid);
    if (!hand.length) return null;
    return { action: 'play', payload: { cards: [hand[0].i], rank: pcRank(hand[0].c), seq: s.turnSeq } };
  }
};
