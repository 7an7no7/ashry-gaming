# Phase 8 — قبل ولا بعد (Timeline)

Written by Claude (the owner asked for the phases to be carried on here while agy was out of quota). One commit, `e7cbb26`.

## T8.1 — The bank

`TimelineEvents.js` at the repo root: the 22 events the runbook listed, exactly as listed, 1869 to 2015.

| Criterion | Verdict |
|---|---|
| Every entry has a `y`, an `ar` and an `en` | VERIFIED — `tools/validate-content.js` checks all three, and `T8.test.js` §1 checks the same against the loaded bank |
| No year appears twice | VERIFIED — the validator names both cards when it happens; `npm run check` prints `timeline: 22 events, 1869-2015` |
| `tools/validate-content.js` gained a check for both of those, and `npm run check` runs it | VERIFIED — the new block sits with the other bank checks, and `T8.test.js` §1 fails if either check is removed |

> **Deviation, and the reason.** The task also said to add the bank to the `SHARED_LISTS` inlining in `tools/build-*.mjs`. **It is deliberately not there.** The years of the cards still in a hand are the whole secret of the game; inlining the bank would ship the answer key inside the app, where any player could read it. That is the same reason `PartyContent.js` has always stayed off the page (GEMINI, *Content*). The phone never needs the bank: a card reaches its holder as `{ id, text }` and gains its year only once the table has watched it go down. `rooms-worker/build.mjs` bundles it; the page does not, and the file's own header says why. `T8.test.js` §2 fails if anyone adds it later.

The bank is short, and the game notices. With four players it deals 1 + 12 + spare = 21 of the 22, so a second game in the same evening re-uses most of them. **If the owner wants more events, that is the thing to ask for** — the runbook's ⛔ says not to add one whose year cannot be sourced, and none were added.

## T8.2 — The game

`timelineAction` in `RoomGames.js`, `JS_RoomTimeline.html` for the phones and the TV.

| Criterion | Verdict |
|---|---|
| No phone holds another player's unplayed year | VERIFIED — `timelineHidden` strips `y` from every card before it reaches a phone; `rules.mjs` searches the whole of `shared` for each unplayed year and finds none; the robot round checks that no bot's card id is on another bot's phone or on the line |
| A correct placement keeps the card and the timeline stays sorted | VERIFIED — `rules.mjs` "a card put in the right place stays" and "the line stays in order", and again in the robot round after a real placement |
| A wrong placement reveals that card's year and discards it | VERIFIED — `rules.mjs` sets the line to one card a year earlier so the wrong path is certain, then checks the line is unchanged, the year is published, and the card is gone |
| The same event never appears twice in one game | VERIFIED — dealt through `nextPrompts`; `rules.mjs` gathers the line, every hand and the deck and checks they are all different |
| The whole room-game checklist | VERIFIED — 18 items, listed below, each looked for where it has to be (`T8.test.js` §3) |
| A round in `play-all.mjs` passes | VERIFIED — **1068 passed, 0 failed** |
| `faceToFace` is false | VERIFIED — the catalog entry has no `faceToFace`; every move is a tap |

**The checklist:** `RoomGames.js` branch · `ROOM_GAME_IDS` · `roomPlayerLeft` · `ROOM_GAMES` renderer · `TV_GAMES` renderer · `ROOM_HUB_GAMES` · `roomTurnOf` · the view · the include · `VIEW_META` · `validViews` · `GAME_CATALOG` · `HELP_ENTRIES` · `HELP_FOR_VIEW` · `GAME_RULES` in both languages · a round in `play-all.mjs` · its own styles.

Decided while building:

- **A hand only shrinks on a card placed correctly.** A wrong placement discards the card *and* draws a replacement. Without that, the fastest way to empty your hand would be to play badly on purpose.
- **The running score is cards placed correctly**, so the board and the winner always agree: everyone starts with the same hand, so the first to empty it is also the first to that many correct placements. The night's leaderboard and the Phase 6 share card both work off it without a special case.
- **The hand size comes from the cards that actually arrived**, not from a constant. A bank of 22 cannot give twelve players three each, so a full table gets one each rather than the deal failing. Spare cards are dealt on top for the replacements — the first version dealt exactly enough for the hands, which left the replacement deck empty and was caught by the rules test.
- **The line carries `dir="ltr"` in both languages.** It is a physical axis, like Wavelength's spectrum: mirrored in Arabic it would read 2015 before 1869. One mechanism — the markup attribute — not a CSS `direction` as well.
- **A gap is a button only on your turn and only once you have picked a card**, so the line reads as a line rather than a row of controls. A card picked on a turn that has since moved on is dropped.

### Tests

- `rooms-worker/test/rules.mjs` — 30 new checks. `npm run test:rules`: **all room rules pass**.
- `rooms-worker/test/play-all.mjs` — a full round. **1068 passed, 0 failed**.
- `C:/Users/TPC/agy-tests/phase-8/T8.test.js` — the bank, the server-only rule, the checklist, the axis, both languages. Passes.
- `cd tools && npm run check` — **no problems found**, **i18n OK**, and it now prints the bank's size and span.
- A real three-player round in the preview at 375×812: picked a card, placed it correctly, and the line, the verdict card, the hands strip, the TV frame and the help sheet all read right in Arabic.

Two bugs in the robot round, found and fixed: card ids were compared with a substring search (`t1` is inside `t10`, so it reported a leak that was not there), and one predicate read `s.last` where `waitFor` passes the whole state.

## Not verified — needs a live test

- Whether 22 events is enough for an evening. A second game re-deals most of the same cards; the table will notice before the app does.
- The line on a real TV at 1280×720 once it is ten or twelve cards long — it scrolls horizontally on a phone, and whether that reads on a screen nobody is touching was not tried.
- Whether an Arabic table reads a left-to-right timeline naturally. The rule (a physical axis stays LTR) is the app's own, and the numbers agree with it, but only the owner can say whether it feels right.
