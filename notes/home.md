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
game at random. Every game with its own card (not a tool, not a way inside a hub)
has a place in `TONIGHT_ORDER`, party and talking games first, then the ones to sit
down to, the duels, and the puzzles last; a game missing from it used to rank last
for ever (every game from 27 Sep on, the review of 1 Oct 2026), so `npm run check`
(`validate-content.js`) now fails on one.

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
play, built from `GAME_LIST` in `Games.js` (2 Oct 2026; the one list the page and the
rooms server share, with each game's `room` and `crew` too, and `open` as a function's
name, defaulting to its setup or a room): id, icon, title and description keys, accent, `players: [min, max]` (a
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
  with the three ways in folded under «كل الألعاب» (on a screen 1280px wide
  and up it opens by itself, `homeAllOpen`, the owner, 3 Oct 2026). How
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

## The sections, reviewed (3 Oct 2026)

With the owner: every game sits in the section whose name is true of it. العقل (a silent cooperative game, no bluffing) and اختبار السرعة (2-12, reflexes) are in حفلة وضحك; أتوبيس كومبليت and على راسك (word games) in كلمات ورسم وتمثيل; خمّن الرقم in the puzzles, now named «ألغاز لوحدك» ("Solo puzzles") beside «كلمات وأسئلة لوحدك». A way inside a card (`hub`) is filed under its card's section (chess's ways under لاتنين على موبايل), which is where a search shows it. A game moved between sections also moves to its new section's block in Games.js, which is the order the section shows.

## The ideas of 7 Oct 2026, second batch (the owner's picks): built

- **1206 Search that knows how people ask.** `applyHomeFilter` asks `catalogSearchHit(g, term, t, other)` (JS_Catalog.html): a game answers to its name and line in both languages as before, to its home section's title (`CATALOG_GROUPS` → «ورق وطاولة», «كلمات ورسم وتمثيل»), and, from three letters, to its rules (`GAME_RULES[lang][id]`, or through `HELP_FOR_VIEW[setup]`), tags stripped, as the Help search reads them. One or two letters don't search the rules (they would match half of them). The normalised text is kept once per language and game (`catalogSearchCache`). «ورق» finds سكرو, أونو, الشايب, كدّاب, إستميشن and the card score keepers; «رسم» every game of «كلمات ورسم وتمثيل» and the drawing games elsewhere (الفنان المزيف, الشاهد).
- **1208 «جديد» on a new game's poster.** A `GAME_LIST` entry may carry `added: 'YYYY-MM-DD'` (Games.js; documented in its header). `catalogIsNew(g)` is true for 14 days from that date (`CATALOG_NEW_DAYS`) and stops as soon as this phone has played the game (`readPlayed`), so it simply expires. `catalogCard` draws an amber ribbon in the poster's free corner (`.gcard > .gcard-new`, opposite the players' badge), the recent tile a small tag after its name (`.gcard-new--sm`: the recent row scrolls, so nothing may stick out of the pill). Dated: الليزر 6 Oct, الخزنة, دندنها, ارسم اللي بتسمعه 1 Oct 2026. Chosen: "the first time a phone sees it" is read as "until this phone plays it". Games.js is in the rooms server's `FILES`, so the release needs the rooms deploy (the field does nothing there).
- **1211 A laptop or TV says «اعرضها على الشاشة».** `homeStartScreenCard(t)` adds a fourth start card, «📺 دي الشاشة؟ اعرض غرفة», after the three on a first visit from 1280px wide (`roomOpenScreen()`), the four in one row (`.home-start__cards--four`), drawn in the room button's frosted glass so it reads as a way to play, not a fourth game. The room button and «الليلة دي؟» stay; a phone's first visit is unchanged.
- **1217 Back to «الليلة دي؟» where it came from.** `tonightPaint(keepIds)` keeps the three games it shows in `tonightShown`; `tonightGo` records `tonightBack = { view, ids }` when it stops on the game's setup screen. A leave hook opens the sheet again (`tonightOpen(ids)`, a tick after setView has closed popups) when that setup is left for the home - the header's arrow or the phone's own back - with the same answers and the same three games. Any other way off the setup (Start, a room) forgets it, and so does a bottom-bar tab (`tonightForget`, called from `navTo` in JS_Core.html): 🏠 goes home and stays there. A game started straight from the sheet (QUICK_START) never sets it.
- **1233 «كمّل» for the card score keepers.** HOME_CONT has the five `play-cs-*` boards (`homeContCardScore(id)`): live while `appState.cardscore[id]` is in `phase: 'play'` with rounds saved (`csHomeLive`, read from appState so it needs no chunk), the line «الجولة N» (`csHomeRoundLine`), back through `continueCardScore` (allowed in `SHELL_USES_OK`, tools/lazy-split.mjs; `homeContGo` waits for the chunk). On the الأدوات tab `catalogToolRow` gives such a row ▶ on its icon's corner (`.tool-icon__cont`) and «كمّل · الجولة ٤» in place of its line (`.tool-cont`), and a tap goes straight back to the sheet; its setup is one back-tap away.

## The ideas of 7 Oct 2026, third batch (the owner's picks): built

- **1207 An empty search that still helps.** `#home-empty` (renderHome) carries two buttons under its line: «🎲 الليلة دي؟» (`tonightOpen`) and «📘 دوّر في القوانين» (`homeEmptyRules`: opens Help through `openHelpModal`, then puts the home's words in `#help-search` and runs `filterHelp`; Help's own code untouched). Styles: `.home-empty__ways`, section 72 of `Style_Talk.html`.
- **1209 «كمّل» with more than one board.** `homeContAll()` lists every board still going (the same tests as before: not hidden, not switched off, its chunk here, `live()`), newest stamp first; `homeContPick()` is its first. `homeContHtml` draws the newest on the card and, when there are others, a «+N» pill (`.home-cont__more`, `homeContToggle`) that unfolds `#home-cont-list` under the card: one row per board (icon, name, its `line`), a tap is `homeContGo(key)`. The list opening slides the home down through `flipGrid` (rows rise in); it stays open across a redraw for the visit (`homeContListOpen`). ✕ hides the card's board and, when others are left (`.has-more`), redraws the card so the next takes its place (`homeContHide` → `homeContRefresh`). Chosen: the pill counts the *other* boards (two boards → «+1»).
- **1210 Counts on the filter chips.** `applyHomeFilter`'s test is one function now (`passes(g, filter)`), and `homeFilterCounts(view, games, passes)` counts, for every chip of `HOME_FILTERS`, the section cards it would leave with the search, the players and the place chips as they are (the same test, so a count never disagrees with the grid). A chip leaving none gets `.is-none` (dimmed, 45%, unless it is the lit one) but stays a button. The count is `.filter-chip__n`: inline after the label from 900px, a small bubble on the chip's corner below that (two wrapped rows at 375px; inline it pushed «مين وكام؟» to a third row). Chosen: the players / place chips carry no counts; a class is written only when it changes.
- **1214 Tap the lit tab again.** `navTo(target)` (JS_Core.html): when the target is the screen showing and it is `menu`, `tools` or `together`, `homeTabAgain(view)` (JS_Catalog.html) runs instead: blur, the main area glides to the top (`auto` under reduced motion), and on the home a search or a «how you play» chip left on is cleared in place (the box emptied, `setHomeFilter('all')`, so the cards slide back through `flipGrid`). Chosen: the players and «كل واحد في مكان» chips stay, as they do when a game is left (`resetHomeFilters`): they are remembered choices. From a room screen, مع بعض still goes to the room (`goTogether`).
- **1222 The mode switch says what each side needs.** `setupModeNeeds(view, g, t)` (JS_Catalog.html, run by `syncGameHero` on every setup with a switch and on the `online` / `offline` events through `setupModeNetChanged`) adds a `.mode-needs` row under the switch: «موبايل واحد بيتلف» (or «على الموبايل ده» for a game one person can play, `players[0] <= 1`) and «كل واحد محتاج نت · من N» (N from `room.min`, said from 2). Offline (`navigator.onLine === false`) the own-phones half and the hero's room / TV pills grey (`.is-offline`, `aria-disabled`), its line says «📶 محتاج نت», a tap only toasts it (`setPlayMode` asks `setupModeBlocked`), and a setup remembered on that side opens on the one phone side (`paintPlayMode`). Only the plain switches (`SETUP_MODE_LABELS`: `mode_device`, `mode_online`, `ludo_mode_phone`): سكرو's and الدومينو's «نلعب في التطبيق» / «على الطاولة» are left as they were. Words: `mode_need_*` in `JS_Translations.html`.
