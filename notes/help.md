# The first-play card and the Help sheet

Moved from GEMINI.md on 30 Sep 2026. GEMINI.md keeps the rules that apply to every game and an index; this file keeps the detail, word for word.

### The first-play card

The first time a phone opens a game's setup screen, or has that game chosen in
a room lobby (never on a big screen), a line under the hero says «📘 أول مرة؟
إزاي نلعب ▾», and a tap opens how to play in three steps in place: the first
three `<li>` of the game's `GAME_RULES` list, as plain text, cut at 140
characters (`firstPlaySteps`, `firstPlayCardHtml` in `JS_Catalog.html`). It was
a card of 230-350px on top of every first setup until 26 Sep 2026 (P9), which
pushed the options and Start down; it is a `<details>` now, kept open across a
lobby's redraws (`firstPlayOpen`). «فهمت» or «📘 القواعد كاملة» marks the game
seen in `ashryFirstPlay_v1` (cleared by "delete all data"). A game whose rules
have no ordered list gets no line, so a new game's rules should keep the shape
the Help sheet asks for.

### The Help sheet

Help is one of the two things in the bottom nav, so it has to earn that slot.
It answers two different questions and the split matters:

1. **"What do I do on this screen?"** — the card at the top. `openHelpModal()`
   resolves `appState.currentView` through `HELP_FOR_VIEW` and renders that
   entry's rules already open, tinted in the game's own accent. In a room lobby
   with a game chosen it resolves to that game instead, because the lobby is not
   the thing you are confused about. On the menu there is no specific screen, so
   it shows a short "what this app is" card instead of a gap.
2. **"What games are there?"** — the list underneath, plus search.

Three pieces have to stay in step, all keyed by the same string:

| where | what it holds |
| --- | --- |
| `GAME_RULES` in `JS_Core.html` | the rules text, `ar` and `en` |
| `HELP_ENTRIES` in `JS_Utils.html` | title key, icon, accent, games-or-tools (a catalog game's icon, accent and title are copied from `GAME_CATALOG` at load, so they can't drift) |
| `HELP_FOR_VIEW` in `JS_Utils.html` | which screens map to it |

**Adding a game means adding to all three.** An entry with no `GAME_RULES` text
is dropped from the list rather than rendered as an accordion that opens onto
nothing, so a missing third piece fails quietly — the browser check for it is
"does every view map to a topic, and does every topic have rules":

```js
[...document.querySelectorAll('[id^="view-"]')].map(v => v.id.replace('view-',''))
  .filter(v => v !== 'menu' && !HELP_FOR_VIEW[v])          // should be empty
```

The registry covers more than games and tools: `players` (the name field, the
shared name list, the 📂 saved-groups picker) and `settings` (everything behind
the gear) are entries too, because those were the two things with no explanation
anywhere in the app and no obvious place to put one.

**The list is grouped the way the home is.** `helpSections()` in
`JS_Utils.html` puts the rooms, the big screen, the players and the settings
under "start here", then a section per `CATALOG_GROUPS` group with its games
in catalog order, then the tools; `HELP_ENTRIES` stays the registry of icon
and accent, and anything registered but not in the catalog lands in a "more"
section at the end. Every card's summary carries the catalog meta (players,
minutes, mode icons) and its body opens with the catalog's one-line pitch
(`.help-lead`) before the rules. The rules themselves have one shape: an
ordered list of how a round goes, then `.help-sub` sub-heads for
📱 separate phones, 📺 the TV, 👥 teams, 🎤 the director or 💡 tips where
they apply. Keep new rules in that shape, and never mention where content is
stored: it is code, and the sheet is not for that. A game with many cases
(سكرو: every card, every way a round ends, scoring examples, each version)
keeps the short ordered list on top and folds each part into a
`<details class="help-more">` with its own heading, so the sheet stays short
and search still reads all of it.

**Search reads the rules, not just the titles** — people search for the thing
they are stuck on ("assassin", "قاتلة"), not for the game's name. It runs
through `helpNormalise`, which folds the Arabic spellings of the same word
together (أ إ آ → ا, ة → ه, ى → ي) and strips diacritics; without that, a search
for `اسماء` misses `أسماء الرموز`. A search that leaves exactly one result opens
it rather than asking for another tap.

**Nothing destructive lives here.** "Delete all data" used to sit in this
footer, one tap away from a rules sheet and styled almost as loudly as Close. It
belongs in Settings, which is where it now is — only.
