// Bundled into the rooms server after RoomGames.js (FILES in rooms-worker/build.mjs), whose helpers it uses.
/* ==========================================================================
   العقل — THE MIND
   A cooperative game with no content at all: every phone holds numbers from
   1 to 100 that nobody else can see, and the table has to lay them all down
   in rising order without saying a word. Level n deals n cards each.

   The whole game is the numbers, so they never leave the server: a phone's
   own are in room.secrets[pid].cards (kept sorted, so "play" always means
   the lowest one it holds), and `shared` carries only the level, the lives,
   the pile, what has been thrown away face up, and how many cards each
   player still holds.

   Playing out of turn costs one life, and every card anywhere that was lower
   than the one played goes face up on the discard - the real game's rule,
   and what keeps a level moving instead of stalling on a card somebody has
   already missed. Lives start at the number of players; at zero the game is
   over. Clear the last level and the table has won: 12 levels for two
   players, 10 for three, 8 for four or more (the review of 1 Oct 2026 - "as
   many as the deck can carry" was 50 levels for two, out of reach), and never
   more than the deck can deal (shared.maxLevel, fixed when the game starts).
   ========================================================================== */
const MIND_MAX = 100;          // the numbers are 1..100
const MIND_MIN_PLAYERS = 2;

/** The level that wins the game, by how many sit down at the start. */
const mindMaxLevel = (players) => {
  const n = Math.max(1, Number(players) || 1);
  return Math.max(1, Math.min(n <= 2 ? 12 : n === 3 ? 10 : 8, Math.floor(MIND_MAX / n)));
};

/** Who is still at the table and holding cards, in seating order. */
const mindSeated = (room) => activeRoster(room, room.shared.roster);

/** Every unplayed card still in somebody's hand, lowest first. */
const mindHeld = (room) => {
  const out = [];
  mindSeated(room).forEach(pid => ((room.secrets[pid] || {}).cards || []).forEach(n => out.push(n)));
  return out.sort((a, b) => a - b);
};

/** shared.held: how many each phone still holds, and nothing else about them. */
const mindCounts = (room) => {
  const held = {};
  mindSeated(room).forEach(pid => { held[pid] = ((room.secrets[pid] || {}).cards || []).length; });
  return held;
};

/** Deals level n: n numbers each, no number twice, each hand sorted. */
const dealMindLevel = (room, level) => {
  const s = room.shared;
  const seated = mindSeated(room);
  const need = seated.length * level;
  if (seated.length < MIND_MIN_PLAYERS || need > MIND_MAX) {
    // Nothing left to deal: the table played everything the deck can carry.
    s.phase = 'gameover';
    s.won = true;
    room.phase = 'gameover';
    return;
  }
  const pool = [];
  for (let i = 1; i <= MIND_MAX; i++) pool.push(i);
  const drawn = shuffled(pool).slice(0, need);
  room.secrets = {};
  seated.forEach((pid, i) => {
    room.secrets[pid] = { cards: drawn.slice(i * level, (i + 1) * level).sort((a, b) => a - b) };
  });
  s.level = level;
  s.pile = [];
  s.discarded = [];
  s.lost = null;
  s.last = null;
  s.held = mindCounts(room);
  s.phase = 'play';
  room.phase = 'play';
};

/**
 * Whether the level is finished, the lives are gone, or play carries on.
 * Called after a card goes down and after somebody leaves with cards in hand.
 */
const mindCheckLevel = (room) => {
  const s = room.shared;
  if (s.lives <= 0) {
    s.phase = 'gameover';
    s.won = false;
    room.phase = 'gameover';
    return;
  }
  if (!mindHeld(room).length) {
    // The last level cleared: the table has won (an older game has no maxLevel).
    if (s.maxLevel && s.level >= s.maxLevel) {
      s.phase = 'gameover';
      s.won = true;
      room.phase = 'gameover';
      return;
    }
    s.phase = 'levelDone';
    room.phase = 'levelDone';
  }
};

const mindAction = (room, playerId, action, payload) => {
  if (action === 'start' || action === 'playAgain') {
    requireHost(room, playerId);
    if (room.players.length < MIND_MIN_PLAYERS) throw new Error('تحتاج لاعبين على الأقل');
    if (action === 'playAgain' && (room.shared || {}).phase !== 'gameover') return;
    const roster = room.players.map(p => p.id);
    room.shared = {
      phase: 'play',
      level: 0,
      maxLevel: mindMaxLevel(roster.length),
      lives: roster.length,
      pile: [],
      discarded: [],
      held: {},
      lost: null,
      last: null,
      lostSeq: 0,
      roster: roster
    };
    dealMindLevel(room, 1);
    return;
  }

  const s = room.shared;
  if (!s || !s.phase) throw new Error('اللعبة لم تبدأ بعد');

  if (action === 'play') {
    if (s.phase !== 'play') return;
    const mine = (room.secrets[playerId] || {}).cards || [];
    if (!mine.length) throw new Error('مفيش ورق معاك');
    // Sorted on the deal, so the first is always the lowest this phone holds.
    const card = mine[0];
    // The phone says which card it meant; a double tap's second press names
    // the card already down, and must not play the next one.
    if (staleTap(payload, 'card', card)) return;
    room.secrets[playerId] = { cards: mine.slice(1) };
    s.pile.push(card);
    s.last = { by: playerId, name: roomPlayerName(room, playerId), card: card };

    // Anything still held anywhere that is lower than this was missed. Those
    // cards go face up, so the table can see what it lost, and the level goes
    // on from here.
    const missed = [];
    mindSeated(room).forEach(pid => {
      const cards = (room.secrets[pid] || {}).cards || [];
      cards.forEach(n => { if (n < card) missed.push(n); });
      room.secrets[pid] = { cards: cards.filter(n => n > card) };
    });
    if (missed.length) {
      missed.sort((a, b) => a - b);
      s.discarded = s.discarded.concat(missed);
      s.lives = Math.max(0, s.lives - 1);
      s.lostSeq = (s.lostSeq || 0) + 1;
      s.lost = { seq: s.lostSeq, card: card, missed: missed };
    } else {
      s.lost = null;
    }
    s.held = mindCounts(room);
    mindCheckLevel(room);
    return;
  }

  if (action === 'nextLevel') {
    requireMoveOn(room, playerId);
    if (s.phase !== 'levelDone') return;
    dealMindLevel(room, s.level + 1);
    return;
  }

  throw new Error('إجراء غير معروف');
};

/** العقل: their cards go with them, and the level can still be finished. */
const mindPlayerLeft = (room, playerId) => {
  const s = room.shared;
  if (!s || (s.phase !== 'play' && s.phase !== 'levelDone')) return;
  if (room.secrets) delete room.secrets[playerId];
  s.roster = (s.roster || []).filter(id => id !== playerId);
  if (s.held) delete s.held[playerId];
  if (mindSeated(room).length < MIND_MIN_PLAYERS) {
    s.phase = 'gameover';
    s.won = false;
    room.phase = 'gameover';
    return;
  }
  s.held = mindCounts(room);
  if (s.phase === 'play') mindCheckLevel(room);
};
