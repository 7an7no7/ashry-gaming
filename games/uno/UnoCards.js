/* ============================================================================
   أونو — THE CARDS
   ----------------------------------------------------------------------------
   Shared by the page and the rooms server (SHARED_LISTS in tools/build-*.mjs,
   FILES in rooms-worker/build.mjs), so both name, draw and match a card the
   same way. Pure data and functions: no DOM, no room. Every top-level name
   starts with `uno`, because this file shares one scope with RoomGames.js on
   the server and with every JS_*.html on the page.

   A card's kind is a short string: its colour and its value.
     colours   r (red)  y (yellow)  g (green)  b (blue)
     values    0-9, s (skip), v (reverse), d (draw two)
     wilds     w (wild), w4 (wild draw four) - no colour of their own
   So 'r7' is a red seven, 'gs' a green skip, 'bd' a blue +2. In play a card
   is { i, k }: `i` is that physical card's id for the round (random, so it
   says nothing about the card; ids of cards in hands never leave the server)
   and `k` its kind. A wild on the pile also carries `c`, the colour chosen.

   The deck is the standard 108 (the owner, 21 Sep 2026): each colour has one
   0 and two of every 1-9, skip, reverse and +2; then four wilds and four wild
   +4s. Up to ten players play with one deck, eleven and twelve with two
   shuffled together.
   ========================================================================= */
const UNO_COLORS = ['r', 'y', 'g', 'b'];
const UNO_TWICE = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 's', 'v', 'd'];
const UNO_HAND = 7;                 // cards dealt to each player
const UNO_ONE_DECK_MAX = 10;        // players one deck serves; more play with two

const unoIsWild = (k) => k === 'w' || k === 'w4';
const unoColorOf = (k) => (k && !unoIsWild(k) ? String(k).charAt(0) : null);
const unoValueOf = (k) => (unoIsWild(k) ? k : String(k || '').slice(1));
/** How many cards a card makes the next player draw: 2, 4, or 0. */
const unoDrawOf = (k) => (k === 'w4' ? 4 : unoValueOf(k) === 'd' ? 2 : 0);
const unoIsAction = (k) => ['s', 'v', 'd'].indexOf(unoValueOf(k)) !== -1;

/** What a card left in a hand costs at the end of a round: its face, 20 for an action, 50 for a wild. */
const unoPoints = (k) => {
  if (unoIsWild(k)) return 50;
  if (unoIsAction(k)) return 20;
  return Number(unoValueOf(k)) || 0;
};
const unoHandPoints = (kinds) => (kinds || []).reduce((sum, k) => sum + unoPoints(k), 0);

const unoDecksFor = (players) => (Number(players) > UNO_ONE_DECK_MAX ? 2 : 1);

/** Every card's kind, 108 to a deck. */
const unoDeck = (decks) => {
  const one = [];
  UNO_COLORS.forEach(c => {
    one.push(c + '0');
    UNO_TWICE.forEach(v => { one.push(c + v); one.push(c + v); });
  });
  for (let i = 0; i < 4; i++) { one.push('w'); one.push('w4'); }
  let out = [];
  for (let d = 0; d < Math.max(1, Math.min(2, Number(decks) || 1)); d++) out = out.concat(one);
  return out;
};

/**
 * Whether `k` may go on the pile now. `top` is the kind on the pile, `color`
 * the colour in play (a wild's chosen one), `pending` a draw waiting on the
 * player up ({ n, kind }: kind 'd' for a +2, 'w4' for a +4 - the last draw
 * card of the stack), and `rules` the game's settings.
 *
 *   - A draw waiting can only be answered by stacking, when stacking is on:
 *     a +2 on a +2, a +4 on a +4, and with stackMode 'mixed' a +4 on a +2
 *     too (never a +2 on a +4).
 *   - Otherwise a wild always goes (a +4 any time, no challenge), and a card
 *     goes on the colour in play or on the same number or symbol.
 */
const unoCanPlay = (k, top, color, pending, rules) => {
  if (!k) return false;
  if (pending && pending.n > 0) {
    if (!rules || !rules.stacking) return false;
    const d = unoDrawOf(k);
    if (!d) return false;
    if (pending.kind === 'w4') return k === 'w4';
    return d === 2 || (k === 'w4' && rules.stackMode === 'mixed');
  }
  if (unoIsWild(k)) return true;
  if (!top) return true;
  if (color && unoColorOf(k) === color) return true;
  return !unoIsWild(top) && unoValueOf(k) === unoValueOf(top);
};

/** Jump in: the very same card as the one on top - colour and number or symbol. Never a wild. */
const unoSameCard = (k, top) => !!k && !!top && k === top && !unoIsWild(k);

/** A hand in the order a player holds it: by colour, then value; the wilds last. */
const UNO_SORT_VALUES = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 's', 'v', 'd', 'w', 'w4'];
const unoSortKey = (k) => {
  const c = unoColorOf(k);
  const ci = c ? UNO_COLORS.indexOf(c) : UNO_COLORS.length;
  return ci * 100 + UNO_SORT_VALUES.indexOf(unoValueOf(k));
};
const unoSorted = (cards) => (cards || []).slice().sort((a, b) => (unoSortKey(a.k) - unoSortKey(b.k)) || (Number(a.i) - Number(b.i)));

/* --- «أونو اتنين اتنين»: teams of two (the owner, 2 Oct 2026) ----------------------------
   Shared, so the lobby on every phone draws the teams with the server's own function and a
   phone greys exactly the cards the server refuses. */
const UNO_TEAM_MAX = 6;                       // twelve players at most: six pairs

/**
 * The lobby's teams as they stand: six slots of up to two. Each person's pick
 * (`pick[pid]`, 0-5) is kept while its team has room; then a computer player
 * without a pick fills the seat beside someone alone, or starts a new pair -
 * so a bot added to the room is the lonely one's partner. `unplaced`: the
 * people with no team yet.
 */
const unoTeamSlots = (players, pick) => {
  const slots = [];
  for (let k = 0; k < UNO_TEAM_MAX; k++) slots.push([]);
  const p = pick || {};
  const loose = [];
  (players || []).forEach(pl => {
    const t = p[pl.id];
    if (typeof t === 'number' && t >= 0 && t < UNO_TEAM_MAX && slots[t].length < 2) slots[t].push(pl.id);
    else loose.push(pl);
  });
  loose.filter(pl => pl.bot).forEach(b => {
    let at = slots.findIndex(s => s.length === 1);
    if (at === -1) at = slots.findIndex(s => s.length === 0);
    if (at !== -1) slots[at].push(b.id);
  });
  const placed = (id) => slots.some(s => s.indexOf(id) !== -1);
  return { slots: slots, unplaced: loose.filter(pl => !placed(pl.id)).map(pl => pl.id) };
};

/** The seats: one of each team in turn, then the second of each - A1 B1 C1 A2 B2 C2 - so partners sit opposite. */
const unoTeamSeating = (teams) => {
  const out = [];
  [0, 1].forEach(k => teams.forEach(t => { if (t[k]) out.push(t[k]); }));
  return out;
};

/** pid's partner still at the table (`order`), or null. `teams`: [{ t, ids }]. */
const unoMateOf = (teams, order, pid) => {
  const tm = (teams || []).find(x => x.ids.indexOf(pid) !== -1);
  const mate = tm ? tm.ids.find(id => id !== pid) : null;
  return mate && (order || []).indexOf(mate) !== -1 ? mate : null;
};

/**
 * A Skip, +2 or +4 can't land on your own partner (the owner): true when `k`,
 * played by pid, would hit the seat after them in the direction of play and
 * that seat is their partner. With partners opposite that only happens once
 * someone has left the table.
 */
const unoHitsMate = (k, order, dir, pid, mate) => {
  if (!mate || !k) return false;
  const v = unoValueOf(k);
  if (v !== 's' && v !== 'd' && k !== 'w4') return false;
  const n = (order || []).length;
  const at = n ? order.indexOf(pid) : -1;
  if (at === -1) return false;
  return order[(((at + (dir === -1 ? -1 : 1)) % n) + n) % n] === mate;
};
