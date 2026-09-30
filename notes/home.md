# The catalog and the home screen

Moved from GEMINI.md on 30 Sep 2026. GEMINI.md keeps the rules that apply to every game and an index; this file keeps the detail, word for word.

### The catalog and the home screen

**«الليلة دي؟» and «ابدأوا بدول»** (the improvement plan, Phase 1, 25 Sep 2026):
the hero's 🎲 button (and the returning phone's fourth tile) opens
`#tonight-modal` (`tonightOpen`, `tonightPaint` in `JS_Catalog.html`): how many
are you (لوحدي / 2 / 3-5 / 6+) and, for more than one, how you're playing (one
phone / own phones / TV), then three games that fit, the ones a first evening
goes best with first (`TONIGHT_ORDER`; the three dealt through `freshPick`
from the best nine, «غيرهم» deals again). The answers are remembered
(`recallOptions('tonight')`). It replaced "pick for us", which picked any one
game at random. A new game that belongs among the first a table should try
goes into `TONIGHT_ORDER`.

**The first visit is a simple start** (the owner, 26 Sep 2026: "people who
open it should not have to do a lot of clicks to start a game; I don't want
them to get lost"). A phone whose recent row is empty (`readRecent()`) gets,
in `renderHome`, «يلا نلعب!» and three big cards (`START_CARDS`, the first
three of `STARTER_SHELF`: الجاسوس, القنبلة, بدون كلام), one button «نلعب كل
واحد بموبايله» (`roomCreateEmpty`) and «الليلة دي؟»; everything else - the
ways in, search, the filters, تحدي اليوم and every section - is folded under
«كل الألعاب (N) ▾» (`#home-all`, `toggleHomeAll`), which opens in place, its
parts rising one after another, scrolled to the top. It replaced «ابدأوا
بدول». Once any game has been opened the phone gets the home as it always
was (the compact hero, recents, sections). A card is `catalogQuickStart`:
the game's setup is drawn (so its remembered options are on it), then its
Start is pressed (`QUICK_START`, the one-phone games whose start works from
their remembered options): الجاسوس asks «مين بيلعب؟» for names it hasn't got,
القنبلة and بدون كلام go straight to playing. A setup left on "own phones"
opens its room instead. The same function is **«▶ العب تاني»** beside a
recent tile (`.recent-item`, `.recent-play`), for the games in `QUICK_START`.
The icon flies to the setup's hero only if the game stops there; back from
the game it flies home to the recent tile (`catalogReturn.kind` 'start').

`GAME_CATALOG` in `JS_Catalog.html` is the registry of everything the app can
play: id, icon, title and description keys, accent, `players: [min, max]` (a
room game that computer players fill says 1, since you can play it alone - the
owner, 26 Sep 2026),
`mins`, `modes` (`device` = pass one phone, `room` = everyone on their own
phone, `tv` = a room shown on a big screen), `group` (one of
`CATALOG_GROUPS`: deduce, words, party, quiz, table, duo, tools), the `setup`
view and an `open` function. **A game that is not in it is not on the menu.**
Three things are drawn from it:

- **The home** (`renderHome`): a hero with the three ways of playing together
  (open a room, join, big screen), a search box, filter chips by how you want
  to play (`HOME_FILTERS`: one phone, own phones, on the TV, two players,
  solo), the games opened recently on this phone (`ashryRecent_v1`, newest
  first, `catalogOpen` records it) and a section per group of cards -
  description, player count, minutes and mode badges. The tools are not on
  it: they have the الأدوات tab (`renderTools`), and the room games are
  listed again under مع بعض (`renderTogether`) with the three ways in and how
  a room works in three lines. `setView('menu')`
  redraws it, so the recent row is current and a search left behind is
  cleared; a language change redraws it through `applyTranslations`
  (`homeRenderedLang`). Search and the chips only toggle `hidden` on the cards
  and sections (`applyHomeFilter`), so the box keeps focus while you type.
- **The hero on every setup screen** (`syncGameHero`, called from
  `applyTranslations`, so it follows every `setView` and every language
  change): the icon, the one-line pitch, players, minutes, the modes as words
  and a 📘 rules button that opens the help sheet on that game. The setup
  screens themselves carry none of this.
- **The help sheet's** "is this a room game?" jump and the search both keep
  working from `HELP_ENTRIES`; the catalog does not replace them.

Descriptions are `cat_<id>` keys: one line, what you do, no emoji (the card
draws the icon). Titles are the game's `setup_<id>` key. A game's card, its
hero and its help entry must all agree on the icon and accent.

**Since 26 Sep 2026 the cards are posters and draw no description** (*The
design system*, the arcade look); the rule below stood from 20 Sep to then and
still applies to the featured poster, the spotlight and the first-visit cards,
which do draw it.

**A description has two lines and no more** (20 Sep 2026). The card clamps at
two, and the strings had been written past it: 31 of 49 in Arabic and 43 of 49
in English ran to three, four, even five lines, so most of the grid ended in
"…" mid-word and the whole home looked unfinished. They are all rewritten to
land inside it - about **48 characters in either language** at 375px, which is
one short sentence that says what you do. A new game's `cat_` key has to fit
the same budget; the way to check it is to lift the clamp and count lines
rather than count characters:

```js
document.querySelectorAll('#view-menu .gcard').forEach(c => {
  const d = c.querySelector('.gcard__desc');
  d.style.cssText = '-webkit-line-clamp:unset;display:block;min-height:0';
  const n = Math.round(d.getBoundingClientRect().height / parseFloat(getComputedStyle(d).lineHeight));
  if (n > 2) console.log(c.dataset.game, n);       // should print nothing
});
```

**The home's first screen belongs to the games** (20 Sep 2026). It had been
570px of hero, search and filters into a 690px scroll area before the first
card - 83% chrome. Two things gave way, neither a control and neither a tap
target, and the first card sits at 445px now, a whole row above the fold:

- a phone that has played before gets **only the ways in** - the four tiles,
  اختارلنا among them, on one row (`home-hero--compact`, 67px against 141).
  The mark and the name are in the header on this screen, so nothing is lost;
  a first visit gets the simple start instead (since 26 Sep 2026, above),
  with the three ways in folded under «كل الألعاب». How
  much a tile says follows **the hero's own width** (it is a container,
  `container-type: inline-size`), not the screen's: icon over name on a phone
  upright, icon beside name from 34rem (a phone on its side, a tablet
  upright), icon beside name and a line under it from 52rem (a laptop, a TV).
  The owner found the first version on a PC with the four tiles bunched into
  the left half of the bar and the rest empty (21 Sep 2026): the wide layout
  makes `.home-hero` a two-column grid, head | ways in, and the returner's
  hero has no head, so the ways in fell into the first column. It is
  `display: block` there now.
- together/apart and the eight player counts were a second scrolling row
  stacked straight on the first. They **fold behind one chip**
  (`toggleHomeMore`, `.filter-chip--more`) pinned at the end of the first row
  - pinned, because at the end of a row that *scrolls* it was simply off the
  screen, which is worse than the row it replaced. The chip carries a summary
  of whatever it is hiding (`homeMoreLabel`) and opens by itself when one of
  those filters is remembered from last time, so a filter is never hiding out
  of sight. The row's filtering logic is untouched. The row takes its
  content's width and only shrinks when it must (`flex: 0 1 auto`), so on a
  phone the chip is pinned at the end of a scrolling row and on a laptop,
  where every mode fits, it sits beside the last one instead of across a
  600px hole.

Setup screens whose options live in `appState` (a segmented control, the Stop
categories) are painted by `paintSetupOptions(viewId)` (`SETUP_PAINTERS` in
`JS_Core.html`) whenever the screen is reached - from a card, the back button
or a reload - so a game's `setupX()` entry point is not the only way in that
shows the saved options.

**Choices are remembered on the phone** (the owner, 17 Sep 2026: "I don't want
to make the same settings every time"). Every setup screen and host lobby
opens with the options this phone chose last, and a change is kept the moment
it is made, not on Start. A game whose options live in its `appState` slice
(painted by `SETUP_PAINTERS`) or under its own `ashry…` key keeps doing that.
Anything else goes through `recallOptions(key, defaults)` /
`rememberOptions(key, patch)` in `JS_Core.html` (one key, `ashryOptions_v1`,
cleared by "delete all data"). A plain setup field just gets `data-remember`:
it is kept by id as it changes (typing, `stepField`, `pickTime`, a switch, a
list) and put back by `paintSetupOptions` before the screen's painter runs,
together with the one-phone / own-phones switch (`paintPlayMode`). A list
filled in JS calls `recallField(select)` once its options exist (الجاسوس,
الحرباء). Choices that live on the rooms server are sent by the host's phone
once to a new room whose settings are untouched (أسماء الرموز,
`cnApplyRemembered`). Never mark a secret word, a number to guess, or anything
dealt. A new game with options needs one of these, or it opens on its defaults
every evening. Left alone on purpose: أوصف لي's length and Wordle's word length
are Start buttons, not a selection; the general timer's minutes are the
running timer; the domino single/teams question depends on the table; the
Codenames custom words are not carried to new rooms.
