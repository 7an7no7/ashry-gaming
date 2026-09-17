/* ============================================================================
   سكرو (Skrew) — the cards, the versions and the rules that read them.
   ----------------------------------------------------------------------------
   Shared by the page (inlined by tools/build-*.mjs) and the rooms server
   (bundled by rooms-worker/build.mjs): the server deals and judges from this,
   the phones draw and explain the same cards.

   The deck is the owner's standard edition (17 Sep 2026): numbers 1-6 four of
   each; 7 & 8 (look at your own card) and 9 & 10 (look at anyone's) four of
   each; خد وهات four; بصرة four (two in the first print and صاحب صاحبه:
   `basraCount`) and كعب داير two; +20 four; the red screw (25) two; the green screw (0) two; -1
   one. Every version adds its own cards, one copy each, and versions can be
   mixed.

     group   which version brings the card (base is every game)
     count   copies in one deck
     value   what it counts in a hand when the round is revealed
     kind    number | command | penalty | shield | special
     power   what it does when discarded straight after being drawn
     copy    no value of its own: counts as the lowest other card in its hand
     drawn   'play' plays itself at once, 'keep' must go into your hand;
             absent: your choice. (+20 and the red screw used to be 'discard';
             the owner plays them like any other card - keep one to throw it
             on a match later - so they carry no rule since 17 Sep 2026.)
   ========================================================================= */
const SKREW_CARDS = {
  // --- the standard deck -------------------------------------------------------
  n1:     { group: 'base', count: 4, value: 1,  kind: 'number', ar: '1', en: '1' },
  n2:     { group: 'base', count: 4, value: 2,  kind: 'number', ar: '2', en: '2' },
  n3:     { group: 'base', count: 4, value: 3,  kind: 'number', ar: '3', en: '3' },
  n4:     { group: 'base', count: 4, value: 4,  kind: 'number', ar: '4', en: '4' },
  n5:     { group: 'base', count: 4, value: 5,  kind: 'number', ar: '5', en: '5' },
  n6:     { group: 'base', count: 4, value: 6,  kind: 'number', ar: '6', en: '6' },
  p7:     { group: 'base', count: 4, value: 7,  kind: 'command', power: 'peekOwn',  icon: '👁️', ar: 'شوف كارتك', en: 'Peek' },
  p8:     { group: 'base', count: 4, value: 8,  kind: 'command', power: 'peekOwn',  icon: '👁️', ar: 'شوف كارتك', en: 'Peek' },
  s9:     { group: 'base', count: 4, value: 9,  kind: 'command', power: 'spyOther', icon: '🔍', ar: 'شوف كارت غيرك', en: 'Spy' },
  s10:    { group: 'base', count: 4, value: 10, kind: 'command', power: 'spyOther', icon: '🔍', ar: 'شوف كارت غيرك', en: 'Spy' },
  swap:   { group: 'base', count: 4, value: 10, kind: 'command', power: 'blindSwap', icon: '🔄', ar: 'خد وهات', en: 'Blind swap' },
  basra:  { group: 'base', count: 4, value: 10, kind: 'command', power: 'basra',     icon: '🗑️', ar: 'بصرة', en: 'Basra' },
  around: { group: 'base', count: 2, value: 10, kind: 'command', power: 'allAround', icon: '🔁', ar: 'كعب داير', en: 'All around' },
  plus20: { group: 'base', count: 4, value: 20, kind: 'penalty', icon: '➕', ar: '+20', en: '+20' },
  red25:  { group: 'base', count: 2, value: 25, kind: 'penalty', icon: '🔴', ar: 'سكرو أحمر', en: 'Red screw' },
  green0: { group: 'base', count: 2, value: 0,  kind: 'shield', icon: '🟢', ar: 'سكرو أخضر', en: 'Green screw' },
  minus1: { group: 'base', count: 1, value: -1, kind: 'shield', icon: '⭐', ar: '-1', en: '-1' },

  // --- الحرامي --------------------------------------------------------------------
  thief:    { group: 'thief', count: 1, value: 10, kind: 'special', drawn: 'keep', icon: '🦹', ar: 'الحرامي', en: 'The thief' },
  takeOnly: { group: 'thief', count: 1, value: 10, kind: 'command', power: 'give',    icon: '🎁', ar: 'خد بس', en: 'Take only' },
  seeSwap:  { group: 'thief', count: 1, value: 10, kind: 'command', power: 'seeSwap', icon: '🕵️', ar: 'شوف وبدّل', en: 'See & swap' },

  // --- صاحب صاحبه ---------------------------------------------------------------
  ping:      { group: 'sahib', count: 1, value: 10, kind: 'special', drawn: 'play', power: 'ping', icon: '🏓', ar: 'بينج', en: 'Ping' },
  pong:      { group: 'sahib', count: 1, value: 10, kind: 'special', drawn: 'keep', icon: '🎾', ar: 'بونج', en: 'Pong' },
  asYouLike: { group: 'sahib', count: 1, value: 10, kind: 'command', power: 'asYouLike', icon: '🃏', ar: 'على كيفك', en: 'As you like' },

  // --- المسحراتي ------------------------------------------------------------------
  mesaharaty: { group: 'mesaharaty', count: 1, value: 10, kind: 'special', drawn: 'play', power: 'wakeUp', icon: '🥁', ar: 'المسحراتي', en: 'El-Mesaharaty' },
  cannon:     { group: 'mesaharaty', count: 1, value: 10, kind: 'command', power: 'cannon',  icon: '💥', ar: 'المدفع', en: 'The cannon' },
  khoshaf:    { group: 'mesaharaty', count: 1, value: 10, kind: 'command', power: 'khoshaf', icon: '🥣', ar: 'الخشاف', en: 'Khoshaf' },

  // --- أوسكار ---------------------------------------------------------------------
  scream:     { group: 'oscar', count: 1, value: 10, kind: 'command', power: 'scream', icon: '😱', ar: 'صرخة أوسكار', en: "Oscar's scream" },
  boom:       { group: 'oscar', count: 1, value: 10, kind: 'command', power: 'boom', icon: '💣', ar: 'بوم', en: 'Boom' },
  lifeJacket: { group: 'oscar', count: 1, value: 10, kind: 'special', copy: true, icon: '🛟', ar: 'اللايف جاكيت', en: 'Life jacket' }
};

/* The versions as the boxes sell them, and "general" with every card. A room
   can also mix groups by hand (a custom deck). */
const SKREW_GROUPS = ['base', 'thief', 'sahib', 'mesaharaty', 'oscar'];
const SKREW_EDITIONS = {
  classic:    { groups: ['base'],               icon: '🃏', ar: 'كلاسيك',       en: 'Classic' },
  thief:      { groups: ['base', 'thief'],      icon: '🦹', ar: 'الحرامي',      en: 'The thief' },
  sahib:      { groups: ['base', 'sahib'],      icon: '🤝', ar: 'صاحب صاحبه',   en: 'Partners', teams: true },
  mesaharaty: { groups: ['base', 'mesaharaty'], icon: '🥁', ar: 'المسحراتي',    en: 'El-Mesaharaty' },
  oscar:      { groups: ['base', 'oscar'],      icon: '😱', ar: 'أوسكار',       en: 'Oscar' },
  general:    { groups: SKREW_GROUPS.slice(),   icon: '🌀', ar: 'العامة (كل الكروت)', en: 'General (every card)' }
};

/* The powers على كيفك can copy (the owner's list): action cards only, never a
   number, a shield or a penalty - and not أوسكار's بوم. */
const SKREW_AS_YOU_LIKE = ['give', 'blindSwap', 'basra', 'seeSwap'];

/* بصرة copies in one deck: four in the standard deck (the later mass-market
   print, and the default), two in the first print and صاحب صاحبه. A lobby
   option. */
const SKREW_BASRA_COUNTS = [2, 4];

/**
 * Card ids of a shuffled-ready deck (not shuffled) for these groups, `decks`
 * times over. `opts.basraCount` (2 or 4) is the بصرة per deck; without it, four.
 */
function skrewDeck(groups, decks, opts) {
  const want = new Set(groups && groups.length ? groups : ['base']);
  want.add('base');
  const basra = opts && SKREW_BASRA_COUNTS.indexOf(Number(opts.basraCount)) !== -1 ? Number(opts.basraCount) : null;
  const out = [];
  const times = Math.max(1, Math.min(2, Number(decks) || 1));
  for (let d = 0; d < times; d++) {
    Object.keys(SKREW_CARDS).forEach(id => {
      const c = SKREW_CARDS[id];
      if (!want.has(c.group)) return;
      const count = id === 'basra' && basra ? basra : c.count;
      for (let i = 0; i < count; i++) out.push(id);
    });
  }
  return out;
}

/** What a card counts in a revealed hand, on its own (see skrewHandValues for a whole hand). */
function skrewValue(id) {
  const c = SKREW_CARDS[id];
  return c ? c.value : 0;
}

/**
 * Each card's value in a hand, in the same order. A copy card (اللايف جاكيت)
 * counts as the lowest of the other cards that are not copies (next to a -1 it
 * is a second -1); with nothing to copy it counts its own 10.
 */
function skrewHandValues(cards) {
  const list = Array.isArray(cards) ? cards : [];
  const isCopy = (id) => !!(SKREW_CARDS[id] && SKREW_CARDS[id].copy);
  const others = list.filter(id => !isCopy(id)).map(skrewValue);
  const best = others.length ? Math.min.apply(null, others) : null;
  return list.map(id => (isCopy(id) && best !== null ? best : skrewValue(id)));
}

/** What a hand counts at the reveal: the sum of skrewHandValues. */
function skrewHandTotal(cards) {
  return skrewHandValues(cards).reduce((t, v) => t + v, 0);
}

/**
 * Can `card` be thrown on `top` (the top of the discard pile)? Numbers and the
 * 7-10 match on their value; every other card on its own kind (a life jacket
 * only on a life jacket, a boom only on a boom); the red screw also burns on a
 * green screw, which is the one way to be rid of it.
 */
function skrewMatches(top, card) {
  if (!top || !card) return false;
  const a = SKREW_CARDS[top], b = SKREW_CARDS[card];
  if (!a || !b) return false;
  if (card === 'red25') return top === 'red25' || top === 'green0';
  const byValue = (id) => SKREW_CARDS[id].kind === 'number' || /^(p7|p8|s9|s10)$/.test(id);
  if (byValue(top) && byValue(card)) return a.value === b.value;
  return top === card;
}

/** How many players a deck serves: one deck up to six players, two decks beyond. */
function skrewDecksFor(players) {
  return players > 6 ? 2 : 1;
}
