// Bundled into the rooms server after RoomGames.js (FILES in rooms-worker/build.mjs), whose helpers it uses.
/* ==========================================================================
   سكرو — SKREW (rooms)
   Every hand lies face down in fixed slots on every phone, and every move
   between slots is public: who swapped which of their cards with which of
   yours, who peeked where, who gave what to whom. Values are not. The cards
   themselves are SkrewCards.js (bundled before this file): the deck, the
   versions, the values and what may be thrown on what.

   Where the cards are:
     room._screw          the deck, the pile, every hand ({ id, card, shown }),
                          the card in the turn player's hand, the khoshaf four,
                          what each player last looked at. Never projected.
     room.secrets[pid]    that phone's slice: the two cards it memorizes at the
                          deal, the card it drew, the khoshaf four, and the last
                          card(s) it looked at, until its next move.
     room.shared.hands    slot ids in order, and `up` only for a card the whole
                          table may see: an exposed hand (the cannon) and
                          everything at the reveal. And `h`, how the card got
                          into that slot - only what the whole table watched
                          (see screwArrived), with `known` for a card the table
                          saw face up and that went back face down (taken from
                          the pile, a wrong throw, a refused بصرة).
   A card of an exposed hand stays face up wherever a public move takes it
   (`shown` travels with the card), and `h.known` travels the same way.

   A round: the deal and the memorize (slots 3 and 4, once), then turns in seat
   order. The first seat moves on one every round; a lap is counted each time
   the turn walks past it, and سكرو can be called from lap `screwFromLap`. The
   call gives everyone else one more turn and protects the caller's hand (in
   teams, their whole side's). A
   round also ends at once when a hand runs out of cards (`finisher`), and -
   with موت مفاجئ on - once everyone has had a last turn after the deck ran
   out (`lastLap`). Then the table's vote on who holds الحرامي (when the thief
   is in the deck), the reveal, and the score - lowest wins. Every game action
   carries `seq` (shared.turnSeq), which moves whenever the phase, the turn or
   its stage does, so the second of a double tap is dropped quietly.
   ========================================================================== */
const SKREW_ROUNDS = [3, 5, 7];
const SKREW_LAPS = [1, 2, 3];
const SKREW_CLOCKS = [0, 30, 60];
const SKREW_MEMORIZE_SECS = [0, 5, 10];  // 0: everyone taps "memorized" (or the host starts)
const SKREW_HAND = 4;                  // cards dealt to each player
const SKREW_MEMORIZE = [2, 3];         // the slots each player looks at once: 3 and 4
const SKREW_PILE_SHOWN = 6;            // the top of the pile phones get
const SKREW_EVENTS = 40;
const SKREW_GRACE_MS = 1500;
const SKREW_THIEF_POINTS = 25;
const SKREW_TEAM_SIZES = [4, 6, 8];
const SKREW_TEAM_KEYS = ['A', 'B'];    // shared.teams[0] and [1]

const screwAction = (room, playerId, action, payload) => {
  const p = payload || {};
  if (action === 'start' || action === 'playAgain') {
    screwNewGame(room, playerId, action, p);
    return;
  }
  const s = room.shared;
  if (!s || !s.phase || !room._screw) throw new Error('اللعبة لم تبدأ بعد');
  // A tap aimed at a turn that has since moved on: dropped without a word.
  if (staleTap(p, 'seq', s.turnSeq)) return;
  screwApply(room, () => screwMove(room, playerId, action, p));
};

/**
 * Runs a change to a round, then moves turnSeq on if the turn or its stage
 * changed, and writes what every phone may see. The action, the clock and a
 * leave all go through here.
 */
const screwApply = (room, change) => {
  const s = room.shared;
  const before = screwTurnSig(room);
  const out = change();
  if (screwTurnSig(room) !== before) s.turnSeq = (s.turnSeq || 0) + 1;
  screwSync(room);
  return out;
};

const screwTurnSig = (room) => {
  const s = room.shared || {};
  const t = s.turn || {};
  return [s.phase, s.round, t.pid, t.stage, t.power, !!t.pongOpen, (room._screw || {}).turns].join('|');
};

const screwMove = (room, me, action, p) => {
  const s = room.shared;
  const g = room._screw;
  switch (action) {
    case 'ready': {
      if (s.phase !== 'memorize') return;
      if (s.order.indexOf(me) === -1) throw new Error('ستدخل من الجولة القادمة');
      if (s.ready.indexOf(me) === -1) {
        s.ready.push(me);
        delete g.memorize[me];            // looked at once
        screwEvent(room, 'ready', { pid: me });
      }
      if (screwSeated(room).every(id => s.ready.indexOf(id) !== -1)) screwBeginPlay(room);
      return;
    }
    case 'beginRound':
      requireMoveOn(room, me);
      if (s.phase !== 'memorize') return;
      screwBeginPlay(room);
      return;
    case 'draw': {
      screwTurnCheck(room, me, ['choose']);
      screwForget(room, me);
      const card = screwFromDeck(room);
      if (!card) throw new Error('مفيش كروت في الكومة');
      delete s.turn.pongOpen;
      screwEvent(room, 'draw', { pid: me });
      screwLastLapCheck(room, me);
      screwReceive(room, me, card, 'deck');
      return;
    }
    case 'keep': {
      screwTurnCheck(room, me, ['drawn']);
      screwForget(room, me);
      // Any card may be kept, a +20 or the red screw too (the owner, 17 Sep 2026:
      // "each card is treated the same" - a kept +20 can be thrown on a match later).
      const how = g.drawnFrom === 'khoshaf' ? 'khoshaf' : 'deck';
      if (!(g.hands[me] || []).length) {
        // An empty hand: the card takes a new slot, with nothing to put on the pile. (An empty
        // hand ends the round now, so this is only for a room saved before that rule.)
        const slot = screwNewSlot(g, g.drawn);
        g.hands[me] = [slot];
        g.drawn = null;
        g.drawnFrom = null;
        screwEvent(room, 'keep', { pid: me, slot: slot.id, card: null });
        screwArrived(room, slot, how, me, null, { known: null, looks: [me] });
        screwTurnDone(room);
        return;
      }
      const e = screwSlot(room, me, p.slot);
      const old = e.card;
      e.card = g.drawn;
      e.shown = false;
      g.pile.push(old);
      g.drawn = null;
      g.drawnFrom = null;
      screwEvent(room, 'keep', { pid: me, slot: e.id, card: old });
      // The drawer saw what they kept; nobody else did.
      screwArrived(room, e, how, me, null, { known: null, looks: [me] });
      screwTurnDone(room);
      return;
    }
    case 'discard': {
      screwTurnCheck(room, me, ['drawn']);
      screwForget(room, me);
      const card = g.drawn;
      const info = SKREW_CARDS[card];
      if (info.drawn === 'keep') throw new Error('الكارت ده لازم تحتفظ بيه');
      // A الخشاف pick counts as drawn from the deck.
      const fromDeck = g.drawnFrom === 'deck' || g.drawnFrom === 'khoshaf';
      g.pile.push(card);
      g.drawn = null;
      g.drawnFrom = null;
      screwEvent(room, 'discard', { pid: me, card: card });
      // Straight from the deck (or الخشاف), a command card's power may be used (or skipped).
      if (fromDeck && info.power && !info.drawn) {
        s.turn.stage = 'power';
        s.turn.power = info.power;
        return;
      }
      screwTurnDone(room);
      return;
    }
    case 'takePile': {
      screwTurnCheck(room, me, ['choose']);
      if (g.thiefSpent && g.pile[g.pile.length - 1] === 'thief') throw new Error('الحرامي خرج من الجولة');
      screwForget(room, me);
      if (!g.pile.length) throw new Error('مفيش كروت مكشوفة');
      const e = screwSlot(room, me, p.slot);
      const taken = g.pile.pop();
      g.pile.push(e.card);
      e.card = taken;
      e.shown = false;
      delete s.turn.pongOpen;
      screwEvent(room, 'takePile', { pid: me, slot: e.id, card: taken });
      // It lay face up: the whole table knows this card, wherever it goes next.
      screwArrived(room, e, 'pile', me, null, { known: taken, looks: [] });
      screwTurnDone(room);
      return;
    }
    case 'match': {
      // On your own turn only; right or wrong, the card is shown and the turn ends.
      screwTurnCheck(room, me, ['choose']);
      const owner = p.owner === undefined || p.owner === null || p.owner === '' ? me : String(p.owner);
      // بصرة الفريق: a partner's card, when the house rule is on and their side isn't protected; otherwise nothing.
      if (owner !== me && !screwTeamThrowOk(room, me, owner)) return;
      screwForget(room, me);
      const top = g.pile[g.pile.length - 1];
      if (!top) throw new Error('مفيش كروت مكشوفة');
      const e = screwSlot(room, owner, p.slot);
      delete s.turn.pongOpen;
      screwThrow(room, me, e, skrewMatches(top, e.card), 'match', owner);
      if (screwFinished(room, owner)) return;
      screwTurnDone(room);
      return;
    }
    case 'thiefSteal': {
      // سرقة الحرامي: the thief just drawn (or picked with الخشاف), or on top of the pile as the turn
      // starts, played as a steal: look at one card of another player, then swap it for one of yours.
      if (!s.settings.thiefSteal) throw new Error('سرقة الحرامي مش مفعّلة');
      screwTurnCheck(room, me, ['drawn', 'choose']);
      const fromHand = s.turn.stage === 'drawn';
      if (fromHand ? g.drawn !== 'thief' : (g.thiefSpent || g.pile[g.pile.length - 1] !== 'thief')) throw new Error('مفيش حرامي');
      const target = screwTarget(room, me, p.target, true);
      const e = screwSlot(room, target, p.slot);
      screwForget(room, me);
      if (fromHand) {
        g.pile.push(g.drawn);
        g.drawn = null;
        g.drawnFrom = null;
      }
      g.thiefSpent = true;                    // face up on the pile, out for the round
      delete s.turn.pongOpen;
      g.seen[me] = [{ pid: target, slot: e.id, card: e.card }];
      screwLooked(e, me);
      g.look = { target: target, slot: e.id };
      s.turn.stage = 'steal';
      s.turn.look = { target: target, slot: e.id };
      screwEvent(room, 'thiefSteal', { pid: me, target: target, slot: e.id });
      return;
    }
    case 'stealSwap': {
      // The steal's swap is forced: one of your own cards for the one you looked at.
      screwTurnCheck(room, me, ['steal']);
      if (p.slot === undefined || p.slot === null || p.slot === '') throw new Error('اختار كارت من عندك');
      screwSteal(room, screwSlot(room, me, p.slot));
      return;
    }
    case 'screw': {
      screwTurnCheck(room, me, ['choose']);
      if (s.caller) throw new Error('فيه حد قال سكرو خلاص');
      if (s.lastLap) throw new Error('الورق خلص: دي آخر لفة');
      if (s.lap < s.settings.screwFromLap) throw new Error('لسه بدري على سكرو');
      screwForget(room, me);
      delete s.turn.pongOpen;
      const at = s.order.indexOf(me);
      s.caller = me;
      s.finalLeft = s.order.slice(at + 1).concat(s.order.slice(0, at)).filter(id => screwHere(room, id));
      screwEvent(room, 'screw', { pid: me });
      screwTurnDone(room);
      return;
    }
    case 'pong': {
      // Straight after a ping, before the turn is played: a free throw of بونج.
      screwTurnCheck(room, me, ['choose']);
      if (!s.turn.pongOpen) throw new Error('مفيش بينج');
      screwForget(room, me);
      const e = screwSlot(room, me, p.slot);
      delete s.turn.pongOpen;
      screwThrow(room, me, e, e.card === 'pong', 'pong');
      screwFinished(room, me);
      return;
    }
    case 'pass': {
      // Nothing to draw, and no pile to make a new deck of (موت مفاجئ, or a last turn with nothing left).
      screwTurnCheck(room, me, ['choose']);
      if (!screwCantDraw(room)) throw new Error('اسحب كارت');
      screwForget(room, me);
      delete s.turn.pongOpen;
      screwEvent(room, 'pass', { pid: me });
      screwTurnDone(room);
      return;
    }
    case 'power':
      screwTurnCheck(room, me, ['power']);
      screwForget(room, me);
      screwPower(room, me, p);
      return;
    case 'skipPower':
      screwTurnCheck(room, me, ['power']);
      // A card that plays itself has no "without the power": it never reaches
      // this stage, and if one ever did it must not be skippable. s.turn.power
      // is what this stage carries, so the check is on the power's own card.
      if (SKREW_FORCED_POWERS.indexOf(s.turn.power) !== -1) throw new Error('الكارت ده لازم يشتغل');
      screwForget(room, me);
      screwTurnDone(room);
      return;
    case 'seeSwapDo': {
      screwTurnCheck(room, me, ['seeSwap']);
      screwForget(room, me);
      const look = g.look;
      const swap = p.slot !== undefined && p.slot !== null && p.slot !== '';
      if (!swap) {
        screwEvent(room, 'seeSwap', { pid: me, target: look.target, slot: look.slot, swapped: false });
      } else {
        const mine = screwSlot(room, me, p.slot);
        const theirs = screwSlot(room, look.target, look.slot);
        screwEvent(room, 'seeSwap', { pid: me, target: look.target, slot: look.slot, swapped: true, slot2: mine.id });
        screwTrade(room, me, mine, me, theirs, look.target);
      }
      screwTurnDone(room);
      return;
    }
    case 'khoshafPick': {
      screwTurnCheck(room, me, ['khoshaf']);
      screwForget(room, me);
      const i = Number(p.index);
      if (!(Number.isInteger(i) && i >= 0 && i < g.khoshaf.length)) throw new Error('اختار كارت');
      const card = g.khoshaf[i];
      // The other three go to the bottom of the deck (the start of the list).
      g.deck = g.khoshaf.filter((c, k) => k !== i).concat(g.deck);
      g.khoshaf = null;
      screwLastLapCheck(room, me);
      screwReceive(room, me, card, 'khoshaf');
      return;
    }
    case 'thiefGuess':          // a phone on an older page: the caller's guess counts as their vote
    case 'thiefVote': {
      // Who holds الحرامي? Every seated phone votes (the holder too); a vote can change until it closes.
      if (s.phase !== 'thiefGuess') return;
      if (screwSeated(room).indexOf(me) === -1) throw new Error('ستدخل من الجولة القادمة');
      const pick = p.pid === undefined || p.pid === null || p.pid === '' ? null : String(p.pid);
      if (pick !== null && s.order.indexOf(pick) === -1) throw new Error('اختيار غير صحيح');
      if (!g.votes) g.votes = {};
      if (!s.thiefVote) s.thiefVote = { voted: [] };
      g.votes[me] = pick;
      if (s.thiefVote.voted.indexOf(me) === -1) {
        s.thiefVote.voted.push(me);
        screwEvent(room, 'thiefVote', { pid: me });
      }
      if (screwSeated(room).every(id => s.thiefVote.voted.indexOf(id) !== -1)) screwCloseVote(room);
      return;
    }
    case 'closeThiefVote':
      requireMoveOn(room, me);
      if (s.phase !== 'thiefGuess') return;
      screwCloseVote(room);
      return;
    case 'boomPick': {
      // بوم: one of your own cards, face down; final. Nothing about it is shared until all are in.
      if (s.phase !== 'play' || !s.turn || s.turn.stage !== 'boom' || !s.boom) throw new Error('مش دلوقتي');
      if (s.boom.picked.indexOf(me) !== -1) return;
      if (s.boom.waiting.indexOf(me) === -1) throw new Error('مش مطلوب منك');
      const e = screwSlot(room, me, p.slot);
      g.boomPicks[me] = e.id;
      s.boom.waiting = s.boom.waiting.filter(id => id !== me);
      s.boom.picked.push(me);
      if (!s.boom.waiting.length) screwBoomResolve(room);
      return;
    }
    case 'closeBoom':
      requireMoveOn(room, me);
      if (s.phase !== 'play' || !s.turn || s.turn.stage !== 'boom') return;
      screwBoomResolve(room);
      return;
    case 'nextRound':
      requireMoveOn(room, me);
      if (s.phase !== 'reveal') return;
      if (screwSeated(room).length < 2) { screwGameOver(room); return; }
      screwDeal(room);
      return;
    case 'skipTurn':
      // The player up is gone: their drawn card goes to the pile, the turn passes.
      requireMoveOn(room, me);
      screwSkip(room);
      return;
    default:
      throw new Error('إجراء غير معروف');
  }
};

/* --- a game, a round -------------------------------------------------------- */

const screwNewGame = (room, playerId, action, p) => {
  requireHost(room, playerId);
  const prev = room.shared || {};
  if (action === 'playAgain' && prev.phase !== 'gameover') return;
  const n = room.players.length;
  if (n < 2) throw new Error('تحتاج لاعبين على الأقل');
  const settings = screwSettings(p, action === 'playAgain' ? (prev.settings || {}) : {}, n);
  // Seats at random; with teams they alternate, A B A B, so a ping lands on your partner.
  const order = shuffled(room.players.map(pl => pl.id));
  const teams = settings.teams ? [order.filter((id, i) => i % 2 === 0), order.filter((id, i) => i % 2 === 1)] : null;
  room.secrets = {};
  room._screw = { slotSeq: 0, turns: 0 };
  room.shared = {
    settings: settings,
    round: 0,
    rounds: settings.rounds,
    order: order,
    roster: order.slice(),
    teams: teams,
    scores: {},
    teamScores: teams ? { A: 0, B: 0 } : null,
    winners: null,
    // Carried over a play again, so a tap or an animation from the last game is never taken for this one.
    turnSeq: (prev.turnSeq || 0) + 1,
    eventSeq: prev.eventSeq || 0
  };
  screwDeal(room);
  screwSync(room);
};

/** The lobby's options, checked; a play again keeps the last game's. */
const screwSettings = (p, was, n) => {
  const asked = String(p.edition || '');
  const known = asked === 'custom' || Object.prototype.hasOwnProperty.call(SKREW_EDITIONS, asked);
  const edition = known ? asked : (was.edition || 'classic');
  let groups;
  if (edition === 'custom') {
    const list = Array.isArray(p.groups) ? p.groups.map(String) : (was.groups || []);
    groups = SKREW_GROUPS.filter(x => x === 'base' || list.indexOf(x) !== -1);
  } else {
    groups = SKREW_EDITIONS[edition].groups.slice();
  }
  const canTeams = SKREW_TEAM_SIZES.indexOf(n) !== -1;
  if (p.teams === true && !canTeams) throw new Error('صاحب صاحبه محتاج 4 أو 6 أو 8 لاعبين');
  const wantTeams = typeof p.teams === 'boolean' ? p.teams
    : (typeof was.teams === 'boolean' ? was.teams : !!(SKREW_EDITIONS[edition] && SKREW_EDITIONS[edition].teams));
  const flag = (key) => (typeof p[key] === 'boolean' ? p[key] : !!was[key]);
  return {
    edition: edition,
    groups: groups,
    teams: wantTeams && canTeams,
    // House rules, off by default. سرقة الحرامي: only with the thief in the deck. بصرة الفريق: only in teams.
    thiefSteal: flag('thiefSteal') && groups.indexOf('thief') !== -1,
    teamBasra: flag('teamBasra') && wantTeams && canTeams,
    rounds: SKREW_ROUNDS.indexOf(Number(p.rounds)) !== -1 ? Number(p.rounds) : (was.rounds || 5),
    screwFromLap: SKREW_LAPS.indexOf(Number(p.screwFromLap)) !== -1 ? Number(p.screwFromLap) : (was.screwFromLap || 2),
    // Seconds to memorize slots 3 and 4 at each deal before play starts by itself (0: until everyone taps).
    memorizeSecs: p.memorizeSecs !== undefined && p.memorizeSecs !== null && SKREW_MEMORIZE_SECS.indexOf(Number(p.memorizeSecs)) !== -1
      ? Number(p.memorizeSecs) : (SKREW_MEMORIZE_SECS.indexOf(Number(was.memorizeSecs)) !== -1 ? Number(was.memorizeSecs) : 0),
    turnClock: p.turnClock !== undefined && p.turnClock !== null && SKREW_CLOCKS.indexOf(Number(p.turnClock)) !== -1
      ? Number(p.turnClock) : (typeof was.turnClock === 'number' ? was.turnClock : 0),
    // موت مفاجئ: the deck running out starts a last lap instead of shuffling the pile into a new deck.
    suddenDeath: typeof p.suddenDeath === 'boolean' ? p.suddenDeath : !!was.suddenDeath,
    // A help for the phones: draw the value of a card the whole table saw face up (shared.hands[].h.known).
    memoryHelp: typeof p.memoryHelp === 'boolean' ? p.memoryHelp : !!was.memoryHelp,
    basraCount: SKREW_BASRA_COUNTS.indexOf(Number(p.basraCount)) !== -1 ? Number(p.basraCount)
      : (SKREW_BASRA_COUNTS.indexOf(Number(was.basraCount)) !== -1 ? Number(was.basraCount) : SKREW_CARDS.basra.count),
    decks: skrewDecksFor(n)
  };
};

/**
 * The cards for these settings (بصرة four a deck, or two), doubled beyond six
 * players - with one thief all the same: the table's vote is about "the" thief.
 */
const screwDeckCards = (settings) => {
  let thief = false;
  return skrewDeck(settings.groups, settings.decks, { basraCount: settings.basraCount }).filter(id => {
    if (id !== 'thief') return true;
    if (thief) return false;
    thief = true;
    return true;
  });
};

/** Deals the next round: four face down each, one face up on the pile, and the memorize. */
const screwDeal = (room) => {
  const s = room.shared;
  const last = room._screw || {};
  // The first seat moves on one every round: the seat after the last round's first, found
  // by who it was (s.round alone skipped a seat once someone before it had left). A first
  // seat who left mid-round left their successor in their seat (startSeat).
  const old = s.order.slice();
  const prevAt = last.startId ? old.indexOf(last.startId) : -1;
  const from = prevAt !== -1 ? prevAt + 1 : (typeof last.startSeat === 'number' ? last.startSeat : 0);
  s.order = s.order.filter(id => screwHere(room, id));
  if (s.teams) s.teams = s.teams.map(t => t.filter(id => s.order.indexOf(id) !== -1));
  s.round = (s.round || 0) + 1;
  let start = 0;
  for (let k = 0; k < old.length; k++) {
    const at = s.order.indexOf(old[(from + k) % old.length]);
    if (at !== -1) { start = at; break; }
  }
  const g = {
    deck: shuffled(screwDeckCards(s.settings)),
    pile: [],
    hands: {},
    memorize: {},
    seen: {},
    drawn: null,
    drawnFrom: null,
    khoshaf: null,
    look: null,
    votes: {},                                // the thief vote, pid -> pid | null; published only with the result
    finisherKey: null,                        // the finisher's unit (pid, or a team key), kept if they leave
    thiefSpent: false,                        // سرقة الحرامي used: the thief is out for the rest of the round
    // Slot ids never repeat within a game, so a phone can't mistake one for last round's.
    slotSeq: last.slotSeq || 0,
    turns: last.turns || 0,
    start: start,
    startId: s.order[start],                  // who it was, for the next round's first seat
    revealed: false
  };
  room._screw = g;
  s.order.forEach(id => {
    g.hands[id] = [];
    for (let i = 0; i < SKREW_HAND; i++) g.hands[id].push(screwNewSlot(g, g.deck.pop()));
    g.memorize[id] = SKREW_MEMORIZE.map(i => ({ slot: g.hands[id][i].id, card: g.hands[id][i].card }));
  });
  g.pile.push(g.deck.pop());
  s.phase = 'memorize';
  s.lap = 1;
  s.ready = [];
  s.turn = null;
  s.endsAt = s.settings.memorizeSecs ? Date.now() + s.settings.memorizeSecs * 1000 : null;
  s.caller = null;
  s.finisher = null;
  s.lastLap = null;
  s.thiefVote = null;
  s.boom = null;
  s.finalLeft = [];
  s.exposed = [];
  s.results = null;
  s.events = [];
  screwEvent(room, 'deal', { round: s.round });
  // Each owner looks at their slots 3 and 4 once.
  s.order.forEach(id => g.hands[id].forEach((e, i) => {
    screwArrived(room, e, 'deal', null, null, { known: null, looks: SKREW_MEMORIZE.indexOf(i) !== -1 ? [id] : [] });
  }));
  room.phase = 'memorize';
};

const screwBeginPlay = (room) => {
  const s = room.shared;
  const g = room._screw;
  g.memorize = {};
  s.phase = 'play';
  room.phase = 'play';
  screwStartTurn(room, s.order[g.start] || s.order[0], null);
};

/** Everyone who is dealt into this round and still in the room. */
const screwSeated = (room) => room.shared.order.filter(id => screwHere(room, id));
const screwHere = (room, id) => room.players.some(p => p.id === id);

/* --- turns -------------------------------------------------------------------- */

const screwStartTurn = (room, pid, pingFrom) => {
  const s = room.shared;
  room._screw.turns++;
  s.turn = { pid: pid, stage: 'choose' };
  if (pingFrom) { s.turn.pingFrom = pingFrom; s.turn.pongOpen = true; }
  s.endsAt = s.settings.turnClock ? Date.now() + s.settings.turnClock * 1000 : null;
};

const screwTurnCheck = (room, me, stages) => {
  const s = room.shared;
  if (s.phase !== 'play' || !s.turn) throw new Error('مش وقت اللعب');
  if (s.turn.pid !== me) throw new Error('مش دورك');
  if (stages.indexOf(s.turn.stage) === -1) throw new Error('مش دلوقتي');
};

/** Whether a seat still has a turn to play this round: after a سكرو, or in a last lap, only those in finalLeft. */
const screwEligible = (room, id) => {
  const s = room.shared;
  if (!screwHere(room, id)) return false;
  return !(s.caller || s.lastLap) || (id !== s.caller && s.finalLeft.indexOf(id) !== -1);
};

/**
 * The next seat after `from` with a turn to play, or -1. Stepping onto the
 * round's first seat is a new lap, whether or not that seat plays.
 */
const screwWalk = (room, from) => {
  const s = room.shared;
  const n = s.order.length;
  for (let step = 1; step <= n; step++) {
    const at = (from + step) % n;
    if (at === room._screw.start) s.lap++;
    if (screwEligible(room, s.order[at])) return at;
  }
  return -1;
};

const screwTurnDone = (room) => {
  const s = room.shared;
  screwPassTurn(room, s.order.indexOf(s.turn.pid), false);
};

/**
 * Ends the turn of the player up and hands it on from seat `from`. After a
 * سكرو, or in a last lap, their last turn is spent. A ping skips the next
 * player (their last turn too, if it was one) and opens Pong for the one
 * after. Nobody left to play: the round is over.
 */
const screwPassTurn = (room, from, ping) => {
  const s = room.shared;
  const g = room._screw;
  const cur = s.turn ? s.turn.pid : null;
  const last = !!(s.caller || s.lastLap);
  s.turn = null;
  s.endsAt = null;
  g.look = null;
  if (last && cur) s.finalLeft = s.finalLeft.filter(id => id !== cur);
  let at = screwWalk(room, from);
  if (ping) {
    const target = at === -1 ? null : s.order[at];
    if (target && last) s.finalLeft = s.finalLeft.filter(id => id !== target);
    screwEvent(room, 'ping', { pid: cur, target: target });
    if (at !== -1) at = screwWalk(room, at);
  }
  if (at === -1) { screwEndRound(room); return; }
  screwStartTurn(room, s.order[at], ping ? cur : null);
};

/**
 * The host's skip and the clock: whatever the player up held goes, and the
 * turn passes. During the thief vote it closes the vote with the votes cast.
 */
const screwSkip = (room) => {
  const s = room.shared;
  if (s.phase === 'play' && s.turn && s.turn.stage === 'boom') {
    // بوم waiting on phones: whoever hasn't picked gets a card picked at random.
    screwBoomResolve(room);
    return true;
  }
  if (s.phase === 'play' && s.turn && s.turn.stage === 'steal') {
    // A steal is a forced swap: one of the player's own cards, at random.
    const hand = room._screw.hands[s.turn.pid] || [];
    screwSteal(room, hand[Math.floor(Math.random() * hand.length)]);
    return true;
  }
  if (s.phase === 'play' && s.turn) {
    const pid = s.turn.pid;
    const look = s.turn.stage === 'seeSwap' && room._screw.look;
    // The look happened: the log says so, as leaving it or a leaver does.
    if (look) screwEvent(room, 'seeSwap', { pid: pid, target: look.target, slot: look.slot, swapped: false });
    screwDropPending(room, false);
    screwEvent(room, 'skip', { pid: pid });
    screwPassTurn(room, s.order.indexOf(pid), false);
    return true;
  }
  if (s.phase === 'thiefGuess') return screwCloseVote(room);
  return false;
};

/** A card drawn, or picked from the khoshaf four, lands in the player's hand - or plays itself. */
const screwReceive = (room, me, card, from) => {
  const s = room.shared;
  const g = room._screw;
  const info = SKREW_CARDS[card] || {};
  if (info.drawn === 'play') {
    g.pile.push(card);
    // بوم and صرخة أوسكار cannot be kept and cannot be skipped (the owner,
    // 20 Sep 2026: "the power of them must be activated when they are drawn").
    // Off the deck - or picked out of الخشاف - they go straight onto the pile
    // and fire, and each leaves the same player a whole new turn.
    if (info.power === 'boom' || info.power === 'scream') {
      screwEvent(room, 'discard', { pid: me, card: card });
      SKREW_POWERS[info.power](room, me, {});
      return;
    }
    if (info.power === 'wakeUp') {
      // المسحراتي: a سكرو now, called by whoever drew it, with no last turns. After a سكرو
      // it only cuts the last turns short: whoever called stays the caller.
      screwEvent(room, 'wakeUp', { pid: me });
      if (!s.caller) s.caller = me;
      s.finalLeft = [];
      s.turn = null;
      s.endsAt = null;
      screwEndRound(room);
      return;
    }
    screwPassTurn(room, s.order.indexOf(me), true);   // بينج
    return;
  }
  g.drawn = card;
  g.drawnFrom = from;
  s.turn.stage = 'drawn';
};

/**
 * A card the player up still held when their turn was cut short. `toDeck`
 * (they left the room): it goes to the bottom of the deck unseen; otherwise a
 * drawn card is thrown on the pile with no power. The khoshaf four always go
 * back under the deck.
 */
const screwDropPending = (room, toDeck) => {
  const s = room.shared;
  const g = room._screw;
  const pid = s.turn && s.turn.pid;
  const hand = pid ? g.hands[pid] || [] : [];
  if (g.drawn) {
    if (toDeck) g.deck.unshift(g.drawn);
    else if ((SKREW_CARDS[g.drawn] || {}).drawn === 'keep' && hand.length) {
      // الحرامي and بونج can't be thrown (review of 1 Oct 2026: a skip used to put a
      // drawn thief face up on the pile): it goes into one of the player's slots at
      // random, as a steal's skip picks, and that slot's card goes on the pile.
      const e = hand[Math.floor(Math.random() * hand.length)];
      const old = e.card;
      e.card = g.drawn;
      e.shown = false;
      g.pile.push(old);
      screwEvent(room, 'keep', { pid: pid, slot: e.id, card: old });
      screwArrived(room, e, g.drawnFrom === 'khoshaf' ? 'khoshaf' : 'deck', pid, null, { known: null, looks: [pid] });
    } else {
      g.pile.push(g.drawn);
      screwEvent(room, 'discard', { pid: s.turn && s.turn.pid, card: g.drawn });
    }
  }
  if (g.khoshaf) g.deck = g.khoshaf.concat(g.deck);
  g.drawn = null;
  g.drawnFrom = null;
  g.khoshaf = null;
  g.look = null;
  g.boomPicks = null;             // a بوم still waiting is called off
  s.boom = null;
};

/* --- cards and slots ------------------------------------------------------------ */

const screwNewSlot = (g, card, shown) => ({ id: 'c' + (++g.slotSeq), card: card, shown: !!shown });

/*
 * How each card got into its slot, for every phone (shared.hands[pid][i].h),
 * so a player can still tell a card's story at twelve players, where forty
 * events don't reach back to the deal. Only what the whole table watched:
 *   how    'deal' | 'deck' (a drawn card kept) | 'pile' (the top of the pile
 *          taken) | 'penalty' | 'swap' (blind swap, see & swap) | 'give' |
 *          'scream' (dealt again blind: nothing known, no looks) | 'khoshaf'
 *          (a الخشاف pick kept)
 *   by     who made that move (null for the deal)
 *   from   { pid, slot } the card came from (swap, give), or null
 *   at     the eventSeq of that move
 *   known  the card, only when the whole table saw this very card face up: it
 *          lay on the pile before it was taken, or it was thrown and came back
 *          (a wrong throw, a refused بصرة); it travels with the card and goes
 *          when the card leaves the hand
 *   looks  who has looked at this very card since it was dealt or arrived
 *          (the memorize, a peek, a spy, كعب داير, شوف وبدّل's look, the drawer
 *          of a kept card); it travels with the card too
 */
const screwBlankH = () => ({ how: 'deal', by: null, from: null, at: 0, known: null, looks: [] });

/** A slot's history (made for a room saved before histories existed). */
const screwH = (e) => {
  if (!e.h) e.h = screwBlankH();
  return e.h;
};

/**
 * The card in slot `e` has just arrived by the move whose event was just
 * written. `carry` is what the table already knew about this same card when
 * it travels (a swap, a give, the scream): its known value and its looks.
 */
const screwArrived = (room, e, how, by, from, carry) => {
  e.h = {
    how: how,
    by: by || null,
    from: from || null,
    at: room.shared.eventSeq || 0,
    known: carry && carry.known ? carry.known : null,
    looks: carry && Array.isArray(carry.looks) ? carry.looks.slice() : []
  };
  return e.h;
};

/** `pid` has looked at the card in slot `e`. */
const screwLooked = (e, pid) => {
  const h = screwH(e);
  if (h.looks.indexOf(pid) === -1) h.looks.push(pid);
};

/** A swap the table watched: slot `a` of `aOwner` and slot `b` of `bOwner` trade cards, and what is known about them. */
const screwTrade = (room, by, a, aOwner, b, bOwner) => {
  const ha = screwH(a);
  const hb = screwH(b);
  screwSwapCards(a, b);
  screwArrived(room, a, 'swap', by, { pid: bOwner, slot: b.id }, hb);
  screwArrived(room, b, 'swap', by, { pid: aOwner, slot: a.id }, ha);
};

/** One of a player's slots, or an error. */
const screwSlot = (room, pid, slot) => {
  const e = (room._screw.hands[pid] || []).find(x => x.id === String(slot));
  if (!e) throw new Error('الكارت ده مش موجود');
  return e;
};

const screwRemoveSlot = (room, pid, slotId) => {
  const g = room._screw;
  g.hands[pid] = (g.hands[pid] || []).filter(x => x.id !== slotId);
};

/** Two slots trade cards; the slots stay where they are, and a known card stays known. */
const screwSwapCards = (a, b) => {
  const card = a.card, shown = a.shown;
  a.card = b.card; a.shown = b.shown;
  b.card = card; b.shown = shown;
};

/**
 * The top of the deck. An empty deck takes the pile back, all but its top
 * card, shuffled - except with موت مفاجئ, where an empty deck stays empty.
 */
const screwFromDeck = (room) => {
  const g = room._screw;
  if (!g.deck.length && screwRefill(g) > 0 && !room.shared.settings.suddenDeath) {
    const top = g.pile.pop();
    // A thief spent on a steal is out for the round: it doesn't go back into the deck.
    g.deck = shuffled(g.thiefSpent ? g.pile.filter(c => c !== 'thief') : g.pile);
    g.pile = [top];
    screwEvent(room, 'reshuffle', {});
  }
  return g.deck.length ? g.deck.pop() : null;
};

/**
 * A card thrown from a hand (a match, or Pong): right, it goes on the pile.
 * Wrong, the table has seen it flip, and it goes back face down into the same
 * slot (its h.known remembers it); then the top of the deck comes blind, face
 * down into a new slot at the end of the hand - not even its owner looks.
 */
const screwThrow = (room, me, e, ok, type, owner) => {
  const g = room._screw;
  const from = owner || me;           // بصرة الفريق: the card is a partner's; a penalty is still the thrower's
  const fields = { pid: me, slot: e.id, card: e.card, ok: ok };
  if (from !== me) fields.owner = from;
  screwEvent(room, type, fields);
  if (ok) {
    screwRemoveSlot(room, from, e.id);
    g.pile.push(e.card);
    return;
  }
  screwH(e).known = e.card;
  const card = screwFromDeck(room);
  if (!card) return;                    // nothing left to draw (موت مفاجئ): no penalty card
  const slot = screwNewSlot(g, card);
  g.hands[me].push(slot);
  screwEvent(room, 'penalty', { pid: me, slot: slot.id });
  screwArrived(room, slot, 'penalty', me, null, null);
  screwLastLapCheck(room, me);
};

/** بصرة الفريق: may `me` throw a card of `owner`'s? The house rule on, a partner, and their side not protected. */
const screwTeamThrowOk = (room, me, owner) => {
  const s = room.shared;
  if (!s.settings.teamBasra || !s.teams || !screwHere(room, owner) || screwProtected(room, owner)) return false;
  return s.teams.some(t => t.indexOf(me) !== -1 && t.indexOf(owner) !== -1);
};

/** سرقة الحرامي's swap: `mine` (the player up's slot) for the card they looked at; the turn ends. */
const screwSteal = (room, mine) => {
  const s = room.shared;
  const g = room._screw;
  const me = s.turn.pid;
  const look = g.look;
  const theirs = screwSlot(room, look.target, look.slot);
  screwForget(room, me);
  screwEvent(room, 'stealSwap', { pid: me, slot: mine.id, target: look.target, slot2: theirs.id });
  screwTrade(room, me, mine, me, theirs, look.target);
  screwTurnDone(room);
};

/** How many cards an empty deck would get back from the pile: all but its top, less a spent thief. */
const screwRefill = (g) => g.pile.slice(0, -1).filter(c => !(g.thiefSpent && c === 'thief')).length;

/** Nothing can be drawn this turn: the deck is empty and can't be made again from the pile. */
const screwCantDraw = (room) => {
  const g = room._screw;
  return !g.deck.length && (!!room.shared.settings.suddenDeath || screwRefill(g) === 0);
};

/**
 * موت مفاجئ: a move has just taken the deck's last card. With no سكرو called
 * and no last lap yet, everyone else gets one last turn, in seat order after
 * the player up, whose own turn finishes as usual. After a سكرو nothing more
 * happens: the last turns are already running.
 */
const screwLastLapCheck = (room, by) => {
  const s = room.shared;
  const g = room._screw;
  if (!s.settings.suddenDeath || g.deck.length || s.caller || s.lastLap || s.phase !== 'play') return;
  const at = s.order.indexOf(by);
  s.lastLap = { by: by };
  s.finalLeft = s.order.slice(at + 1).concat(s.order.slice(0, at)).filter(id => screwHere(room, id));
  screwEvent(room, 'lastLap', { pid: by });
};

/**
 * A hand has just lost a card (a throw, بصرة, خد بس, Pong, بوم). Empty, the
 * round is over at once: nobody plays on, and that player is the finisher.
 * True when it ended the round.
 */
const screwFinished = (room, pid) => {
  const s = room.shared;
  const g = room._screw;
  if (s.phase !== 'play' || (g.hands[pid] || []).length) return false;
  s.finisher = pid;
  g.finisherKey = s.teams ? (SKREW_TEAM_KEYS[s.teams.findIndex(t => t.indexOf(pid) !== -1)] || pid) : pid;
  screwEvent(room, 'finish', { pid: pid });
  screwEndRound(room);
  return true;
};

/** Forgets what a player last looked at: it lasts until their next move. */
const screwForget = (room, pid) => { delete room._screw.seen[pid]; };

/* --- powers ------------------------------------------------------------------------ */

/**
 * After سكرو the caller's hand is safe from swaps, gives, بوم, the cannon and
 * the scream - in teams the partners' hands too. Looking is still allowed.
 */
const screwProtected = (room, id) => {
  const s = room.shared;
  if (!s.caller) return false;
  if (id === s.caller) return true;
  return !!(s.teams && s.teams.some(t => t.indexOf(s.caller) !== -1 && t.indexOf(id) !== -1));
};

/** Another player a power can aim at. `protect`: not a protected hand (screwProtected). */
const screwTarget = (room, me, target, protect) => {
  const s = room.shared;
  const id = String(target || '');
  if (id === me || s.order.indexOf(id) === -1 || !screwHere(room, id)) throw new Error('اختار لاعب تاني');
  if (protect && screwProtected(room, id)) throw new Error('اللي قال سكرو محمي');
  return id;
};

const screwPower = (room, me, p) => {
  const s = room.shared;
  let power = s.turn.power;
  if (power === 'asYouLike') {
    // على كيفك is a mimic (the owner, 20 Sep 2026): it copies a command card
    // that is already face up on the pile. With none there - turn one, or a
    // pile of nothing but numbers - it is not dead: it is thrown as a plain
    // بصرة, which is all the table has unlocked so far.
    // The same window the phones are shown (SKREW_PILE_SHOWN): you point at a
    // card lying face up where the table can see it, not one buried twenty
    // deep that nobody could name.
    const choices = skrewPileCommands(room._screw.pile.slice(-SKREW_PILE_SHOWN));
    if (!choices.length) {
      power = SKREW_AS_YOU_LIKE_FALLBACK;
      screwEvent(room, 'asYouLike', { pid: me, as: power, from: null });
    } else {
      // The phone names the card it pointed at; an older one names the power.
      const want = String(p.as || '');
      const from = choices.indexOf(want) !== -1 ? want : choices.find(id => SKREW_CARDS[id].power === want);
      if (!from) throw new Error('اختار كارت من الأرض');
      power = SKREW_CARDS[from].power;
      screwEvent(room, 'asYouLike', { pid: me, as: power, from: from });
    }
  }
  const run = SKREW_POWERS[power];
  if (!run) throw new Error('الكارت ده ملوش قوة');
  run(room, me, p);
};

const SKREW_POWERS = {
  peekOwn: (room, me, p) => {
    const e = screwSlot(room, me, p.slot);
    room._screw.seen[me] = [{ pid: me, slot: e.id, card: e.card }];
    screwLooked(e, me);
    screwEvent(room, 'peekOwn', { pid: me, slot: e.id });
    screwTurnDone(room);
  },
  spyOther: (room, me, p) => {
    const target = screwTarget(room, me, p.target, false);
    const e = screwSlot(room, target, p.slot);
    room._screw.seen[me] = [{ pid: target, slot: e.id, card: e.card }];
    screwLooked(e, me);
    screwEvent(room, 'spyOther', { pid: me, target: target, slot: e.id });
    screwTurnDone(room);
  },
  blindSwap: (room, me, p) => {
    const mine = screwSlot(room, me, p.slot);
    const target = screwTarget(room, me, p.target, true);
    const theirs = screwSlot(room, target, p.slot2);
    screwEvent(room, 'blindSwap', { pid: me, slot: mine.id, target: target, slot2: theirs.id });
    screwTrade(room, me, mine, me, theirs, target);
    screwTurnDone(room);
  },
  basra: (room, me, p) => {
    // Neither the red screw nor the thief can be thrown: turned up, the table sees it, and it goes
    // back face down into its slot (h.known remembers it). An error would let a player test slots.
    const g = room._screw;
    const e = screwSlot(room, me, p.slot);
    const ok = e.card !== 'red25' && e.card !== 'thief';
    screwEvent(room, 'basra', { pid: me, slot: e.id, card: e.card, ok: ok });
    if (ok) {
      screwRemoveSlot(room, me, e.id);
      g.pile.push(e.card);
      if (screwFinished(room, me)) return;
    } else {
      screwH(e).known = e.card;
    }
    screwTurnDone(room);
  },
  allAround: (room, me, p) => {
    const s = room.shared;
    const g = room._screw;
    if (Array.isArray(p.own)) {
      // Two of your own.
      const slots = p.own.map(String).filter((x, i, a) => a.indexOf(x) === i);
      if (slots.length !== Math.min(2, (g.hands[me] || []).length)) throw new Error('اختار كارتين من عندك');
      const looked = slots.map(sl => screwSlot(room, me, sl));
      const seen = looked.map(e => ({ pid: me, slot: e.id, card: e.card }));
      looked.forEach(e => screwLooked(e, me));
      g.seen[me] = seen;
      screwEvent(room, 'allAround', { pid: me, own: seen.map(x => x.slot) });
    } else {
      // One of every other player who holds a card - a caller's too, looking is allowed.
      const others = s.order.filter(id => id !== me && screwHere(room, id) && (g.hands[id] || []).length);
      const picks = Array.isArray(p.picks) ? p.picks : [];
      if (picks.length !== others.length) throw new Error('اختار كارت من كل لاعب');
      const seen = [];
      const looked = [];
      picks.forEach(pk => {
        const target = String((pk && pk.target) || '');
        if (others.indexOf(target) === -1 || seen.some(x => x.pid === target)) throw new Error('اختار كارت من كل لاعب');
        const e = screwSlot(room, target, pk.slot);
        seen.push({ pid: target, slot: e.id, card: e.card });
        looked.push(e);
      });
      looked.forEach(e => screwLooked(e, me));
      g.seen[me] = seen;
      screwEvent(room, 'allAround', { pid: me, picks: seen.map(x => ({ target: x.pid, slot: x.slot })) });
    }
    screwTurnDone(room);
  },
  give: (room, me, p) => {
    const g = room._screw;
    const e = screwSlot(room, me, p.slot);
    const target = screwTarget(room, me, p.target, true);
    screwRemoveSlot(room, me, e.id);
    const slot = screwNewSlot(g, e.card, e.shown);
    g.hands[target].push(slot);
    screwEvent(room, 'give', { pid: me, slot: e.id, target: target, slot2: slot.id });
    screwArrived(room, slot, 'give', me, { pid: me, slot: e.id }, screwH(e));
    if (screwFinished(room, me)) return;
    screwTurnDone(room);
  },
  seeSwap: (room, me, p) => {
    // A look first (a stage of its own), then seeSwapDo swaps or leaves it.
    const s = room.shared;
    const g = room._screw;
    const target = screwTarget(room, me, p.target, true);
    const e = screwSlot(room, target, p.slot);
    g.seen[me] = [{ pid: target, slot: e.id, card: e.card }];
    screwLooked(e, me);
    g.look = { target: target, slot: e.id };
    s.turn.stage = 'seeSwap';
    s.turn.look = { target: target, slot: e.id };
  },
  cannon: (room, me, p) => {
    const s = room.shared;
    const target = screwTarget(room, me, p.target, true);
    if (s.exposed.indexOf(target) === -1) s.exposed.push(target);
    screwEvent(room, 'cannon', { pid: me, target: target });
    screwTurnDone(room);
  },
  khoshaf: (room, me) => {
    const s = room.shared;
    const g = room._screw;
    const four = [];
    for (let i = 0; i < 4; i++) {
      const card = screwFromDeck(room);
      if (!card) break;
      four.push(card);
    }
    screwEvent(room, 'khoshaf', { pid: me });
    // What is left of the deck, up to four; nothing left (موت مفاجئ) and the power ends.
    if (!four.length) { screwTurnDone(room); return; }
    g.khoshaf = four;
    s.turn.stage = 'khoshaf';
  },
  scream: (room, me) => {
    // صرخة أوسكار: every hand outside the protected side is gathered, shuffled and dealt back
    // blind, each player keeping their number of cards (and their slots). Nobody knows any of
    // them now: every look is forgotten. The turn stays with the player: a whole new turn.
    const s = room.shared;
    const g = room._screw;
    const circle = s.order.filter(id => screwHere(room, id) && !screwProtected(room, id));
    const counts = {};
    let cards = [];
    circle.forEach(id => {
      const hand = g.hands[id] || [];
      counts[id] = hand.length;
      cards = cards.concat(hand.map(e => e.card));
    });
    cards = shuffled(cards);
    circle.forEach(id => (g.hands[id] || []).forEach(e => {
      e.card = cards.pop();
      e.shown = s.exposed.indexOf(id) !== -1;     // the cannon exposed the player, not the cards
    }));
    g.seen = {};
    screwEvent(room, 'scream', { pid: me, counts: counts });
    circle.forEach(id => (g.hands[id] || []).forEach(e => screwArrived(room, e, 'scream', me, null, null)));
    screwStartTurn(room, me, null);
  },
  boom: (room, me) => {
    // بوم: every other player with cards (not the protected side) throws one of their own, face
    // down, chosen on their phone (boomPick); all are turned up together once everyone has picked.
    const s = room.shared;
    const at = s.order.indexOf(me);
    const waiting = s.order.slice(at + 1).concat(s.order.slice(0, at))
      .filter(id => screwHere(room, id) && !screwProtected(room, id) && (room._screw.hands[id] || []).length);
    room._screw.boomPicks = {};
    s.boom = { waiting: waiting, picked: [] };
    s.turn.stage = 'boom';
    s.endsAt = s.settings.turnClock ? Date.now() + s.settings.turnClock * 1000 : null;
    screwEvent(room, 'boom', { pid: me });
    if (!waiting.length) screwBoomResolve(room);
  }
};

/**
 * بوم closes: the host's close, the clock, or a leave took the last one waiting. Anyone still
 * waiting has a slot picked at random. Then every picked card goes face up onto the pile, in seat
 * order after the player - whatever it is, the red screw and the thief too. A hand emptied ends
 * the round (the first emptied after the player is the finisher); otherwise the turn stays with
 * the player: a whole new turn.
 */
const screwBoomResolve = (room) => {
  const s = room.shared;
  const g = room._screw;
  const me = s.turn.pid;
  const picks = g.boomPicks || {};
  (s.boom ? s.boom.waiting : []).forEach(id => {
    const hand = g.hands[id] || [];
    if (hand.length) picks[id] = hand[Math.floor(Math.random() * hand.length)].id;
  });
  s.boom = null;
  g.boomPicks = null;
  const at = s.order.indexOf(me);
  const emptied = [];
  s.order.slice(at + 1).concat(s.order.slice(0, at)).forEach(id => {
    if (!Object.prototype.hasOwnProperty.call(picks, id)) return;
    const e = (g.hands[id] || []).find(x => x.id === picks[id]);
    if (!e) return;
    screwRemoveSlot(room, id, e.id);
    g.pile.push(e.card);
    screwEvent(room, 'boomThrow', { pid: id, slot: e.id, card: e.card });
    if (!(g.hands[id] || []).length) emptied.push(id);
  });
  if (emptied.length && screwFinished(room, emptied[0])) return;
  screwStartTurn(room, me, null);
};

/* --- the end of a round: the thief vote, the reveal and the score ----------------- */

/**
 * The round is over (سكرو, المسحراتي, an empty hand, a last lap played out):
 * the table's vote on who holds الحرامي first, whenever the thief is in this
 * deck - even when nobody holds it - then the reveal.
 */
const screwEndRound = (room) => {
  const s = room.shared;
  const g = room._screw;
  screwDropPending(room, false);
  s.turn = null;
  s.endsAt = null;
  s.finalLeft = [];
  // With سرقة الحرامي, a thief spent on a steal or lying on the pile is in nobody's hand: no vote.
  const nobodyHolds = s.settings.thiefSteal && (g.thiefSpent || g.pile.indexOf('thief') !== -1);
  if (s.settings.groups.indexOf('thief') !== -1 && !nobodyHolds) {
    g.votes = {};
    s.thiefVote = { voted: [] };
    s.phase = 'thiefGuess';
    room.phase = 'thiefGuess';
    s.endsAt = s.settings.turnClock ? Date.now() + s.settings.turnClock * 1000 : null;
    return;
  }
  screwScoreRound(room, null);
};

/**
 * Closes the thief vote with the votes cast by players still seated (the
 * host's close, the clock, the last vote in, or a leave that leaves everyone
 * voted), and scores the round. False when there was no vote to close.
 */
const screwCloseVote = (room) => {
  const s = room.shared;
  const g = room._screw;
  if (s.phase !== 'thiefGuess') return false;
  const votes = {};
  screwSeated(room).forEach(id => {
    if (g.votes && Object.prototype.hasOwnProperty.call(g.votes, id)) votes[id] = g.votes[id];
  });
  const tally = screwTally(votes, s.caller);
  screwScoreRound(room, { votes: votes, accused: tally.accused, skipped: tally.skipped });
  return true;
};

/**
 * Who the table accused: the choice with the most votes (a player, or null
 * for "no thief"). A tie goes to the caller's vote when it is one of the tied
 * choices, otherwise nobody is accused. No votes at all: nobody, `skipped`.
 */
const screwTally = (votes, caller) => {
  const voters = Object.keys(votes);
  if (!voters.length) return { accused: null, skipped: true };
  const NOBODY = '';
  const keyOf = (v) => (v === null || v === undefined ? NOBODY : String(v));
  const count = {};
  voters.forEach(id => { const k = keyOf(votes[id]); count[k] = (count[k] || 0) + 1; });
  const most = Math.max.apply(null, Object.keys(count).map(k => count[k]));
  const top = Object.keys(count).filter(k => count[k] === most);
  let pick = NOBODY;
  if (top.length === 1) pick = top[0];
  else if (caller && Object.prototype.hasOwnProperty.call(votes, caller) && top.indexOf(keyOf(votes[caller])) !== -1) pick = keyOf(votes[caller]);
  return { accused: pick === NOBODY ? null : pick, skipped: false };
};

/**
 * Every hand face up and the round scored, in this order: hand totals (a life
 * jacket copying the lowest other card), the units (a team adds its
 * partners' hands), the round scores (screwRoundScores), then الحرامي
 * (screwThief). `vote` is the closed thief vote ({ votes, accused, skipped }),
 * or null when the thief is not in this deck.
 */
const screwScoreRound = (room, vote) => {
  const s = room.shared;
  const g = room._screw;
  g.revealed = true;
  const ids = screwSeated(room);
  const hands = {};
  const values = {};
  const sums = {};
  ids.forEach(id => {
    hands[id] = (g.hands[id] || []).map(e => e.card);
    values[id] = skrewHandValues(hands[id]);
    sums[id] = skrewHandTotal(hands[id]);
  });
  const units = screwUnits(room, ids);
  const unitTotals = {};
  units.forEach(u => { unitTotals[u.key] = u.ids.reduce((t, id) => t + sums[id], 0); });
  const callerUnit = s.caller ? units.find(u => u.ids.indexOf(s.caller) !== -1) : null;
  const finisherKey = s.finisher ? (g.finisherKey || s.finisher) : null;
  const scored = screwRoundScores(unitTotals, callerUnit ? callerUnit.key : null, finisherKey, callerUnit ? sums[s.caller] : null);
  const thief = vote ? screwThief(room, units, scored.round, vote) : null;
  const totals = Object.assign({}, unitTotals);
  const round = Object.assign({}, scored.round);
  const lowest = [];
  units.forEach(u => {
    u.ids.forEach(id => {
      addScore(room, id, scored.round[u.key]);
      if (s.teams) { round[id] = scored.round[u.key]; totals[id] = unitTotals[u.key]; }
      if (scored.lowest.indexOf(u.key) !== -1) lowest.push(id);
    });
    if (s.teams) s.teamScores[u.key] = (s.teamScores[u.key] || 0) + scored.round[u.key];
  });
  s.thiefVote = null;
  s.results = {
    hands: hands,
    values: values,
    sums: sums,
    totals: totals,
    thief: thief,
    round: round,
    lowest: lowest,
    caller: s.caller,
    finisher: s.finisher || null,
    callerDouble: scored.callerDouble
  };
  if (thief) screwEvent(room, 'accuse', { accused: thief.accused, caught: thief.caught });
  screwEvent(room, 'reveal', {});
  if (s.round >= s.rounds) { screwGameOver(room); return; }
  s.phase = 'reveal';
  room.phase = 'reveal';
};

/** What is scored together: each player, or in teams the two sides by their keys. */
const screwUnits = (room, ids) => {
  const s = room.shared;
  if (!s.teams) return ids.map(id => ({ key: id, ids: [id] }));
  return s.teams.map((t, i) => ({ key: SKREW_TEAM_KEYS[i], ids: t.filter(id => ids.indexOf(id) !== -1) }));
};

/**
 * One round's points from the units' totals (the owner's rule, 17 Sep 2026;
 * a tie is a successful call):
 *   - a finisher (a hand that ran out): their unit scores 0, every other unit
 *     its total, and a caller's unit that isn't the finisher's is doubled;
 *   - a caller whose total is equal to or lower than every other unit's: the
 *     caller's unit scores 0 and every other unit its own total, a unit that
 *     tied the caller included;
 *   - a caller beaten: the lowest of the others score 0, the caller's unit is
 *     doubled, the rest their totals;
 *   - neither (a last lap played out, or the caller left): the lowest score 0.
 * Doubling is whatever the sign: -1 is -2, 0 stays 0. In teams only the
 * caller's own hand (`callerOwn`) is doubled, then added to the partners'
 * hands; who won the round is still decided on the plain totals. `lowest` is
 * who scored 0 by this rule; `callerDouble` whether the caller was doubled.
 */
const screwRoundScores = (totals, callerKey, finisherKey, callerOwn) => {
  const keys = Object.keys(totals);
  const round = {};
  keys.forEach(k => { round[k] = totals[k]; });
  const has = (k) => k !== null && k !== undefined && keys.indexOf(k) !== -1;
  let lowest = [];
  let callerDouble = false;
  const lowestOf = (list) => {
    if (!list.length) return [];
    const min = Math.min.apply(null, list.map(k => totals[k]));
    return list.filter(k => totals[k] === min);
  };
  if (finisherKey !== null && finisherKey !== undefined) {
    // The finisher may have left since: then nobody scores 0, and the rest is as it was.
    if (has(finisherKey)) lowest = [finisherKey];
    if (has(callerKey) && callerKey !== finisherKey) callerDouble = true;
  } else if (has(callerKey)) {
    const others = keys.filter(k => k !== callerKey);
    if (others.every(k => totals[k] >= totals[callerKey])) {
      lowest = [callerKey];
    } else {
      lowest = lowestOf(others);
      callerDouble = true;
    }
  } else {
    lowest = lowestOf(keys);
  }
  if (callerDouble) round[callerKey] = totals[callerKey] + (typeof callerOwn === 'number' ? callerOwn : totals[callerKey]);
  lowest.forEach(k => { round[k] = 0; });
  return { round: round, lowest: lowest, callerDouble: callerDouble };
};

/**
 * الحرامي, settled on the round scores once they are known (`round`, by unit,
 * changed in place). Kept in one place so the rule can change.
 *   - Nobody holds the thief: nothing.
 *   - Caught (the table accused the holder): the thief's unit takes +25.
 *   - Unnoticed (anyone else accused, or nobody): the thief steals the lowest
 *     round score - their unit's score becomes it - and every unit that had
 *     it takes the +25 instead. A thief whose unit already has the lowest
 *     score changes nothing.
 * `victims` are unit keys (a player, or 'A' / 'B'); `score` the score stolen.
 */
const screwThief = (room, units, round, vote) => {
  const s = room.shared;
  const g = room._screw;
  const holder = s.order.find(id => units.some(u => u.ids.indexOf(id) !== -1) && (g.hands[id] || []).some(e => e.card === 'thief')) || null;
  const out = {
    holder: holder,
    accused: vote.accused,
    votes: vote.votes,
    caught: false,
    stole: false,
    victims: [],
    score: null,
    skipped: !!vote.skipped
  };
  if (!holder) return out;
  const key = units.find(u => u.ids.indexOf(holder) !== -1).key;
  if (vote.accused === holder) {
    round[key] += SKREW_THIEF_POINTS;
    out.caught = true;
    return out;
  }
  const keys = Object.keys(round);
  const low = Math.min.apply(null, keys.map(k => round[k]));
  if (round[key] === low) return out;
  out.victims = keys.filter(k => round[k] === low);
  out.victims.forEach(k => { round[k] += SKREW_THIEF_POINTS; });
  round[key] = low;
  out.stole = true;
  out.score = low;
  return out;
};

/** The last round is scored (or too few are left to play): the lowest total wins. */
const screwGameOver = (room) => {
  const s = room.shared;
  const g = room._screw;
  g.revealed = true;
  s.turn = null;
  s.endsAt = null;
  s.finalLeft = [];
  s.thiefVote = null;
  const ids = screwSeated(room);
  if (s.teams) {
    const live = s.teams.map((t, i) => ({ key: SKREW_TEAM_KEYS[i], ids: t.filter(id => ids.indexOf(id) !== -1) })).filter(u => u.ids.length);
    const best = Math.min.apply(null, live.map(u => s.teamScores[u.key] || 0));
    const won = live.filter(u => (s.teamScores[u.key] || 0) === best);
    s.winnerTeams = won.map(u => u.key);
    s.winners = [].concat.apply([], won.map(u => u.ids));
  } else {
    const best = ids.length ? Math.min.apply(null, ids.map(id => (s.scores || {})[id] || 0)) : 0;
    s.winners = ids.filter(id => ((s.scores || {})[id] || 0) === best);
  }
  s.phase = 'gameover';
  room.phase = 'gameover';
};

/** Lowest total first: the one winning is at the top. */
const screwBoard = (room) => {
  const s = room.shared;
  const teamOf = (id) => !s.teams ? null : SKREW_TEAM_KEYS[s.teams.findIndex(t => t.indexOf(id) !== -1)] || null;
  return room.players
    .filter(p => s.order.indexOf(p.id) !== -1)
    .map(p => ({ id: p.id, name: p.name, score: (s.scores || {})[p.id] || 0, team: teamOf(p.id) }))
    .sort((a, b) => a.score - b.score);
};

/* --- what the table sees -------------------------------------------------------------- */

const screwEvent = (room, type, fields) => {
  const s = room.shared;
  s.eventSeq = (s.eventSeq || 0) + 1;
  s.events = (s.events || []).concat([Object.assign({ seq: s.eventSeq, type: type }, fields)]).slice(-SKREW_EVENTS);
};

/** Writes the hands as the table sees them, the pile, and every phone's own slice. */
const screwSync = (room) => {
  const s = room.shared;
  const g = room._screw;
  if (!g || !g.hands) return;
  const hands = {};
  s.order.forEach(id => {
    const exposed = s.exposed.indexOf(id) !== -1;
    hands[id] = (g.hands[id] || []).map((e, i) => {
      if (exposed) e.shown = true;     // seen by the table, it stays seen wherever it goes
      const h = screwH(e);
      return {
        id: e.id,
        up: g.revealed || e.shown ? e.card : null,
        n: i + 1,
        h: { how: h.how, by: h.by, from: h.from ? { pid: h.from.pid, slot: h.from.slot } : null, at: h.at, known: h.known, looks: h.looks.slice() }
      };
    });
  });
  s.hands = hands;
  s.pile = g.pile.slice(-SKREW_PILE_SHOWN);
  s.deckCount = g.deck.length;
  // سرقة الحرامي: whether this round's thief has been played - public (it went up
  // on the pile), and the phones need it after its event has left the last 40.
  s.thiefSpent = !!g.thiefSpent;
  const playing = s.phase === 'play' || s.phase === 'thiefGuess';
  const t = s.phase === 'play' && s.turn ? s.turn : {};
  room.secrets = {};
  screwSeated(room).forEach(id => {
    room.secrets[id] = {
      memorize: s.phase === 'memorize' && g.memorize[id] ? g.memorize[id] : null,
      drawn: t.pid === id && t.stage === 'drawn' ? g.drawn : null,
      seen: playing && g.seen[id] ? g.seen[id] : null,
      khoshaf: t.pid === id && t.stage === 'khoshaf' ? g.khoshaf : null,
      // This phone's own thief vote (a player id, or null for "nobody"), so a reload shows
      // what it sent; whether it voted at all is shared.thiefVote.voted.
      thiefVote: s.phase === 'thiefGuess' && g.votes && g.votes[id] !== undefined ? g.votes[id] : null
    };
  });
  s.board = screwBoard(room);
};

/* --- someone leaves ------------------------------------------------------------------ */

/**
 * Their cards go under the deck unseen and their seat goes; a turn that was
 * theirs passes, a سكرو they called is revealed at once, a thief vote drops
 * theirs (and closes if everyone left has voted), and a table of one (or a
 * side with nobody left) ends the game. A finisher leaving changes nothing:
 * the round is already over.
 */
const screwPlayerLeft = (room, playerId) => {
  const s = room.shared;
  const g = room._screw;
  if (!g || !Array.isArray(s.order)) return;
  const seat = s.order.indexOf(playerId);
  if (seat === -1) return;
  screwApply(room, () => {
    const midRound = s.phase === 'memorize' || s.phase === 'play' || s.phase === 'thiefGuess';
    const wasUp = s.phase === 'play' && s.turn && s.turn.pid === playerId;
    if (wasUp) screwDropPending(room, true);
    if (midRound && g.hands[playerId]) {
      g.deck = g.hands[playerId].map(e => e.card).concat(g.deck);
      delete g.hands[playerId];
    }
    delete g.seen[playerId];
    delete g.memorize[playerId];
    if (playerId === g.startId) g.startSeat = seat;
    s.order.splice(seat, 1);
    if (seat < g.start) g.start--;
    if (g.start >= s.order.length) g.start = 0;
    if (s.teams) s.teams = s.teams.map(t => t.filter(id => id !== playerId));
    s.finalLeft = (s.finalLeft || []).filter(id => id !== playerId);
    s.exposed = (s.exposed || []).filter(id => id !== playerId);
    s.ready = (s.ready || []).filter(id => id !== playerId);
    if (s.phase === 'gameover') return;
    if (s.order.length < 2 || (s.teams && s.teams.some(t => !t.length))) {
      if (s.turn) screwDropPending(room, false);
      screwGameOver(room);
      return;
    }
    if (s.phase === 'memorize') {
      if (screwSeated(room).every(id => s.ready.indexOf(id) !== -1)) screwBeginPlay(room);
      return;
    }
    if (s.phase === 'thiefGuess') {
      if (g.votes) delete g.votes[playerId];
      if (s.thiefVote) s.thiefVote.voted = s.thiefVote.voted.filter(id => id !== playerId);
      if (s.caller === playerId) s.caller = null;     // scored without a caller, as in play
      if (s.thiefVote && screwSeated(room).every(id => s.thiefVote.voted.indexOf(id) !== -1)) screwCloseVote(room);
      return;
    }
    if (s.phase !== 'play') return;
    if (s.caller === playerId) {
      // Nobody to protect: the round is over, with no caller.
      s.caller = null;
      screwEndRound(room);
      return;
    }
    if (wasUp) {
      // The seat they left is now the next player's: walk on from the one before.
      // Leaving from the round's first seat is no new lap.
      if (seat === g.start) s.lap--;
      screwPassTurn(room, (seat - 1 + s.order.length) % s.order.length, false);
      return;
    }
    if (s.turn && s.turn.stage === 'boom' && s.boom) {
      // A player بوم waits on: dropped; with the last one waiting gone, the cards go up.
      s.boom.waiting = s.boom.waiting.filter(id => id !== playerId);
      s.boom.picked = s.boom.picked.filter(id => id !== playerId);
      if (g.boomPicks) delete g.boomPicks[playerId];
      if (!s.boom.waiting.length) screwBoomResolve(room);
      return;
    }
    if (s.turn && s.turn.stage === 'steal' && g.look && g.look.target === playerId) {
      // The card being stolen has gone with its hand: nothing to swap, the turn ends.
      screwForget(room, s.turn.pid);
      screwTurnDone(room);
      return;
    }
    if (s.turn && s.turn.stage === 'seeSwap' && g.look && g.look.target === playerId) {
      // The card being looked at has gone with its hand: nothing to swap.
      screwForget(room, s.turn.pid);
      screwEvent(room, 'seeSwap', { pid: s.turn.pid, target: playerId, slot: g.look.slot, swapped: false });
      screwTurnDone(room);
    }
  });
};
