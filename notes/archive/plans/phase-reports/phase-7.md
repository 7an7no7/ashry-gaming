# Phase 7 — العقل (The Mind)

Written by Claude (the owner asked for the phases to be carried on here while agy was out of quota). One commit, `1f8ba93`.

A cooperative room game with no content at all: every phone holds numbers from 1 to 100 that only it can see, and the table has to lay them all down in rising order without saying a word.

## T7.1 — The rules on the server

`mindAction` in `RoomGames.js`, with `dealMindLevel`, `mindCheckLevel`, `mindCounts`, `mindHeld`, `mindSeated` and `mindPlayerLeft` beside it.

| Criterion | Verdict |
|---|---|
| No phone's state contains another player's unplayed number | VERIFIED — `shared` carries counts (`mindCounts`), the pile and the discard only, and the robot round proves it live: for every bot, `"cards":[n]` appears on no other bot's state (`play-all.mjs`). Also checked as a string search over the whole of `shared` in `rules.mjs` |
| Playing out of order costs exactly one life | VERIFIED — `rules.mjs` "playing out of order costs exactly one life", and again in the robot round |
| …and discards every lower card | VERIFIED — `rules.mjs` compares `shared.discarded` against every card below the one played, and checks nobody is left holding one |
| A level with every card played moves to the next level with one more card each | VERIFIED — `rules.mjs` "the next level deals one more card each"; the robot round checks two cards each at level 2 |
| Lives at zero ends the game | VERIFIED — `rules.mjs` "the last life ends the game", with `won: false` |
| A player leaving mid-level drops their cards and the level can still be finished | VERIFIED — three cases in `rules.mjs`: a leaver's cards go, the level goes on with two, and the level is *done* when the last holder leaves |
| `roomTurnOf` returns this game for a phone still holding a card | VERIFIED — `case 'mind'` returns `turn_up` whenever `shared.held[me] > 0` during play |
| A round in `play-all.mjs` passes | VERIFIED — the whole suite: **1038 passed, 0 failed** against a fresh local server |
| `npm run test:rules` passes | VERIFIED — **all room rules pass**, 26 new checks among them |

Decided while building:

- **The deck runs out, and that is a win.** 1 to 100 cannot deal level *n* to everybody for ever (six players run out at level 17). Rather than an arbitrary cap, `dealMindLevel` ends the game with `won: true` when the next level needs more than 100 numbers. The table played out everything the deck can carry.
- **A hand is kept sorted at the deal**, so `play` never has to be told which card — it is always the lowest that phone holds. That is also what makes the action impossible to cheat with: there is no card id to send.
- **`shared.lost` carries a sequence number** (`lostSeq`), so a phone can tell one mishap from the next and shake once for each.
- **No score board.** The Mind is cooperative, so it publishes no `board` — which means `bankNightPoints` adds nothing to the night's table (the Phase 4 decision, "a game with no scores at all adds nothing") and the Phase 6 share button does not appear. Both fall out of the design rather than needing a special case.

## T7.2 — The screens

`JS_RoomMind.html` (new), with `ROOM_GAMES.mind` and `TV_GAMES.mind`; styles in `Style.html` beside the other room games.

**The checklist, item by item** — each one verified by `T7.test.js` §1 and in the running app:

| Piece | Where | ✓ |
|---|---|---|
| `RoomGames.js` branch | `case 'mind': mindAction(...)` | ✓ |
| `ROOM_GAME_IDS` | `'herd', 'mafia', 'screw', 'mind'` | ✓ |
| `roomPlayerLeft` | `case 'mind': mindPlayerLeft(...)` | ✓ |
| `ROOM_GAMES` renderer | `JS_RoomMind.html` | ✓ |
| `TV_GAMES` renderer | `JS_RoomMind.html` | ✓ |
| `ROOM_HUB_GAMES` | 🧠, teal, `min: 2` | ✓ |
| `roomTurnOf` | `turn_up` while holding a card | ✓ |
| the view | `#view-room-mind`, `data-accent="teal"` | ✓ |
| the include | `include('JS_RoomMind')` | ✓ |
| `VIEW_META` | title, `up: 'menu'`, teal | ✓ |
| `validViews` | `'room-mind'` | ✓ |
| `GAME_CATALOG` | `modes: ['room','tv']`, `players: [2,12]` | ✓ |
| `HELP_ENTRIES` | 🧠, teal, games group | ✓ |
| `HELP_FOR_VIEW` | `'room-mind': 'mind'` | ✓ |
| `GAME_RULES` | both languages | ✓ |
| a round in `play-all.mjs` | ✓ | ✓ |
| its own styles | `.mind-card`, `.mind-hands`, … | ✓ |

| Criterion | Verdict |
|---|---|
| The hub tile is greyed under 2 players | VERIFIED — `min: 2` in `ROOM_HUB_GAMES`, read back in the running app |
| The help sheet opens on it from its own screen | VERIFIED — `openHelpModal()` on `room-mind` opens the العقل card with its rules; every view still maps to a topic (only `tools` is unmapped, as it was before) |
| `faceToFace` is false | VERIFIED — the catalog entry has no `faceToFace` at all; The Mind needs no talking, which is the point of it |
| Your cards big and tappable, the pile's last card, the level and the lives | VERIFIED — seen in a real three-player round at 375×812 |
| A card that goes down flies to the pile | VERIFIED — in the real round, tapping the card left exactly one `.motion-ghost` in flight and the pile then showed it |
| A life lost shakes the screen once | VERIFIED — fires on a new mishap during play, on one that ends the level, and on one that ends the game; does **not** fire on a redraw of the same mishap |
| The TV shows the level, the lives and the pile | VERIFIED — the TV frame renders the level, the hearts, the pile, the last card and the hands strip, the last inside `.tv-scale` |
| The icon agrees across the catalog, the hub and the help sheet | VERIFIED — all three are 🧠 |

**Found and fixed while testing:** the shake was originally inside the play branch, so a heart lost on the *last* card of a level — which costs a heart and clears the level in the same move — never shook anything. It is now checked once, before the phase branches.

**The played-by line has no verb about a player.** "منى نزّل 19" is wrong for a feminine name and "نزّلت" is wrong for a masculine one; a name does not say which. It reads "آخر ورقة من {name}" — the same lesson مافيا's news already carries.

### Tests

- `rooms-worker/test/rules.mjs` — 26 new checks. `npm run test:rules`: **all room rules pass**.
- `rooms-worker/test/play-all.mjs` — a full round. **1038 passed, 0 failed**.
- `C:/Users/TPC/agy-tests/phase-7/T7.test.js` — the checklist, the secrets, the screens, both languages. Passes.
- `cd tools && npm run check` — **no problems found**, **i18n OK**.
- Every `JS_*.html` and root `.js` file parses (`Controller.html` excepted, as always).

> A note for the next robot run: `wrangler dev` re-runs `build.mjs` when `src/` changes but **not** when `RoomGames.js` at the root changes. A server left running from before an edit serves the old rules and the suite silently tests them. Restart it.

## Not verified — needs a live test

- The game on real phones with a real table: whether the silence actually works, and whether the tension reads without a turn indicator. This is the one game in the app whose whole quality is about timing, and it cannot be judged from a screenshot.
- The TV at 1280×720 with the hands strip at eight or twelve players.
- A level at twelve cards each on a 375px phone: the cards wrap, but whether twelve of them are still comfortable to read and tap was not tried with real hands.
