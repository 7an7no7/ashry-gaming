// Bundled into the rooms server after RoomGames.js (FILES in rooms-worker/build.mjs), whose helpers it uses.
/* ==========================================================================
   قبل ولا بعد — TIMELINE
   Everyone holds event cards with the year hidden. In turn a player puts one
   on the table's timeline - before the first card, between two of them, or
   after the last. The server knows the real year: right and the card stays
   and the player's hand is one smaller; wrong and the year is shown, the card
   is out, and a replacement is drawn. First to get rid of their hand wins.

   The years of the cards still in a hand are the whole secret, so they live
   in room.secrets[pid].hand and never reach shared. A placed card's year is
   in shared, because by then the whole table has seen it. TimelineEvents.js
   is bundled into the Worker only, for the same reason: the app would
   otherwise ship the answer key.
   ========================================================================== */
const TIMELINE_HAND = 3;
const TIMELINE_MIN_PLAYERS = 2;

/** A card as the table sees it: what happened, and when, once it is down. */
const timelineCard = (ev, lang, n) => ({ id: 't' + n, text: (lang === 'en' ? ev.en : ev.ar), y: ev.y });

/** …and as its holder sees it: the same card with the year taken off. */
const timelineHidden = (card) => ({ id: card.id, text: card.text });

/** The real hands, years included, live here on the server and nowhere else. */
const timelineHand = (room, pid) => ((room._timeline && room._timeline.hands) || {})[pid] || [];

/** shared.hands: how many each player is still holding, never which. */
const timelineCounts = (room) => {
  const held = {};
  activeRoster(room, room.shared.order).forEach(pid => {
    held[pid] = timelineHand(room, pid).length;
  });
  return held;
};

/**
 * Each phone is given its own hand with the years off - and nothing else. The
 * slice used to keep the real hand beside it, and project() sends a player
 * their whole slice, so every phone was sent the years of its own cards.
 */
const timelineWriteSecrets = (room) => {
  (room.shared.order || []).forEach(pid => {
    room.secrets[pid] = { cards: timelineHand(room, pid).map(timelineHidden) };
  });
};

/** The game ends; the most cards put in the right place wins (ties share the podium). */
const timelineEndOnBoard = (room, why) => {
  const s = room.shared;
  s.board = scoreboardOf(room);
  const top = s.board[0];
  // Everyone level at the top shares it, not only the first row (winnerIds / winnerNames;
  // winnerId and winnerName stay for an older phone, the name all of them).
  const tied = top && top.score > 0 ? s.board.filter(p => p.score === top.score) : [];
  s.phase = 'gameover';
  s.ended = why;
  s.winnerIds = tied.map(p => p.id);
  s.winnerNames = tied.map(p => p.name);
  s.winnerId = tied.length ? tied[0].id : null;
  s.winnerName = s.winnerNames.join(' · ');
  room.phase = 'gameover';
};

/** The next card off the deck, or null once it is empty. */
const timelineDraw = (room) => (room._timeline.deck.length ? room._timeline.deck.shift() : null);

/** Whose turn it is next: round the order, skipping anyone who has left. */
const timelineAdvance = (room) => {
  const s = room.shared;
  const seated = activeRoster(room, s.order);
  if (!seated.length) return;
  for (let k = 1; k <= s.order.length; k++) {
    const next = s.order[(s.turn + k) % s.order.length];
    if (seated.indexOf(next) !== -1) {
      s.turn = s.order.indexOf(next);
      s.turnId = next;
      s.turnName = roomPlayerName(room, next);
      return;
    }
  }
};

/** Is the card's year where it was put? Equal years are allowed either side. */
const timelineFits = (line, at, year) =>
  (at === 0 || year >= line[at - 1].y) && (at === line.length || year <= line[at].y);

const timelineAction = (room, playerId, action, payload) => {
  if (action === 'start' || action === 'playAgain') {
    requireHost(room, playerId);
    if (room.players.length < TIMELINE_MIN_PLAYERS) throw new Error('تحتاج لاعبين على الأقل');
    if (action === 'playAgain' && (room.shared || {}).phase !== 'gameover') return;
    const lang = roomLangOf(room, payload);
    const order = shuffled(room.players.map(p => p.id));
    // One card starts the line, everyone gets the same number after that, and
    // what is left over is the deck a wrong placement draws a replacement from.
    // The bank is small, so the hand size is worked out from the cards that
    // actually came back rather than assumed: a full table gets one each
    // instead of the deal failing.
    const want = Math.min(TIMELINE_EVENTS.length, 1 + order.length * (TIMELINE_HAND + 2));
    const dealt = nextPrompts(room, TIMELINE_EVENTS, 'timeline', want)
      .map((ev, i) => timelineCard(ev, lang, i));
    // At least one spare card per player is kept back for replacements (the
    // owner, 22 Sep 2026): with the whole bank dealt, a wrong placement had
    // nothing to draw and still emptied the hand - and won.
    const hand = Math.max(1, Math.min(TIMELINE_HAND, Math.floor((dealt.length - 1 - order.length) / order.length)));
    const first = dealt.shift();
    room.secrets = {};
    room._timeline = { deck: dealt.slice(order.length * hand), lang: lang, hands: {} };
    order.forEach((pid, i) => {
      room._timeline.hands[pid] = dealt.slice(i * hand, (i + 1) * hand);
    });
    room.shared = {
      phase: 'play',
      lang: lang,
      order: order,
      roster: order.slice(),
      turn: 0,
      turnId: order[0],
      turnName: roomPlayerName(room, order[0]),
      timeline: [first],
      handSize: hand,
      hands: {},
      scores: {},
      last: null,
      lastSeq: 0,
      board: []
    };
    timelineWriteSecrets(room);
    room.shared.hands = timelineCounts(room);
    room.shared.board = scoreboardOf(room);
    room.phase = 'play';
    return;
  }

  const s = room.shared;
  if (!s || !s.phase) throw new Error('اللعبة لم تبدأ بعد');

  if (action === 'place') {
    if (s.phase !== 'play') return;
    if (s.turnId !== playerId) throw new Error('مش دورك');
    const hand = timelineHand(room, playerId);
    const card = hand.find(c => c.id === String(payload && payload.card));
    if (!card) throw new Error('الورقة دي مش معاك');
    const at = Number(payload && payload.at);
    if (!(at >= 0 && at <= s.timeline.length && at === Math.floor(at))) throw new Error('مكان غير صحيح');

    const right = timelineFits(s.timeline, at, card.y);
    room._timeline.hands[playerId] = hand.filter(c => c.id !== card.id);
    s.lastSeq = (s.lastSeq || 0) + 1;
    s.last = {
      seq: s.lastSeq, by: playerId, name: roomPlayerName(room, playerId),
      text: card.text, y: card.y, at: at, right: right
    };
    let deckOut = false;
    if (right) {
      s.timeline = s.timeline.slice(0, at).concat([card], s.timeline.slice(at));
      addScore(room, playerId, 1);
    } else {
      // Out of the game, and a fresh card in its place - so a hand only ever
      // shrinks on a card put in the right spot.
      const replacement = timelineDraw(room);
      if (replacement) room._timeline.hands[playerId] = room._timeline.hands[playerId].concat([replacement]);
      else deckOut = true;
    }
    timelineWriteSecrets(room);
    s.hands = timelineCounts(room);
    s.board = scoreboardOf(room);

    // Only a card put in the right place can empty a hand and win. A wrong one
    // with nothing left to draw ends the game on the board (the owner, 22 Sep 2026).
    if (deckOut) { timelineEndOnBoard(room, 'deck'); return; }
    if (right && !room._timeline.hands[playerId].length) {
      s.phase = 'gameover';
      s.ended = 'out';
      s.winnerId = playerId;
      s.winnerName = roomPlayerName(room, playerId);
      s.winnerIds = [playerId];
      s.winnerNames = [s.winnerName];
      room.phase = 'gameover';
      return;
    }
    timelineAdvance(room);
    return;
  }

  if (action === 'skipTurn') {
    requireMoveOn(room, playerId);
    if (s.phase !== 'play') return;
    // The player the host meant to skip: a double tap, or a skip crossing the
    // player's own move, must not skip the next one too.
    if (staleTap(payload, 'turnId', s.turnId)) return;
    timelineAdvance(room);
    return;
  }

  throw new Error('إجراء غير معروف');
};

/** قبل ولا بعد: their cards go with them, and the turn moves on. */
const timelinePlayerLeft = (room, playerId) => {
  const s = room.shared;
  if (!s || s.phase !== 'play') return;
  const wasUp = s.turnId === playerId;
  if (room.secrets) delete room.secrets[playerId];
  if (room._timeline && room._timeline.hands) delete room._timeline.hands[playerId];
  s.order = (s.order || []).filter(id => id !== playerId);
  if (s.hands) delete s.hands[playerId];
  if (activeRoster(room, s.order).length < TIMELINE_MIN_PLAYERS) {
    s.phase = 'gameover';
    s.winnerId = null;
    s.winnerName = '';
    s.winnerIds = [];
    s.winnerNames = [];
    room.phase = 'gameover';
    return;
  }
  s.hands = timelineCounts(room);
  s.board = scoreboardOf(room);
  if (wasUp) {
    // One before the seat that left, so the advance lands on the player after
    // them. Clamping at 0 skipped that player when seat 0 left.
    s.turn = (s.turn - 1 + s.order.length) % s.order.length;
    timelineAdvance(room);
  } else {
    s.turn = Math.max(0, s.order.indexOf(s.turnId));
  }
};
