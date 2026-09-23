/* ============================================================================
   The playing cards (كوتشينة) — shared by كدّاب and الشايب
   ----------------------------------------------------------------------------
   One copy for both sides, like UnoCards.js: the page inlines this file (it
   draws and sorts the cards) and the rooms server bundles it (it deals them
   and judges every claim). No DOM, nothing that runs at load, and every
   top-level name starts with pc / PC_.

   A card is its rank and its suit, '7h', '10s', 'Qd', 'Ac'; الشايب's own card
   is 'OM'. A card in play carries a random id as well ({ i, c }), so an id
   says nothing about its face.
   ========================================================================= */
const PC_RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const PC_SUITS = ['s', 'h', 'd', 'c'];
const PC_SUIT_GLYPH = { s: '♠', h: '♥', d: '♦', c: '♣' };
const PC_OLD_MAID = 'OM';

/** The whole deck `decks` times over, unshuffled. */
const pcDeck = (decks) => {
  const out = [];
  for (let d = 0; d < (decks || 1); d++) {
    PC_SUITS.forEach(s => PC_RANKS.forEach(r => out.push(r + s)));
  }
  return out;
};

const pcRank = (c) => (c === PC_OLD_MAID ? '' : String(c || '').slice(0, -1));
const pcSuit = (c) => (c === PC_OLD_MAID ? '' : String(c || '').slice(-1));
const pcRed = (c) => pcSuit(c) === 'h' || pcSuit(c) === 'd';
const pcRankIndex = (r) => PC_RANKS.indexOf(r);

/** A hand in the order a player sorts it: by rank, then by suit. */
const pcSorted = (cards, key) => {
  const f = key || (x => x);
  return cards.slice().sort((a, b) => {
    const ca = f(a), cb = f(b);
    if (ca === PC_OLD_MAID || cb === PC_OLD_MAID) return ca === PC_OLD_MAID ? 1 : -1;
    const d = pcRankIndex(pcRank(ca)) - pcRankIndex(pcRank(cb));
    return d || PC_SUITS.indexOf(pcSuit(ca)) - PC_SUITS.indexOf(pcSuit(cb));
  });
};

/** Two cards that make a pair in الشايب: the same rank and the same colour. */
const pcPairs = (a, b) => a !== PC_OLD_MAID && b !== PC_OLD_MAID && pcRank(a) === pcRank(b) && pcRed(a) === pcRed(b) && a !== b;

/** A rank's name as a table says it: آس, ولد, بنت, شايب; the numbers as they are. */
const PC_RANK_NAMES = {
  ar: { A: 'آس', J: 'ولد', Q: 'بنت', K: 'شايب' },
  en: { A: 'Ace', J: 'Jack', Q: 'Queen', K: 'King' }
};
const pcRankName = (r, lang) => (PC_RANK_NAMES[lang === 'en' ? 'en' : 'ar'][r] || r);

