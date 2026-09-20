# Phase 4 — The leaderboard of the night

Written by Claude, not agy: agy's quota was exhausted (RESOURCE_EXHAUSTED, resets in ~3h) before this phase started, and the owner asked for the work to continue.

## T4.1 — Bank the placements when a game ends — `65f1b13`

**Files:** `RoomGames.js` (`bankNightPoints`, `NIGHT_PLACES`, the `backToHub` call), `rooms-worker/src/room.js` (`project()`), `rooms-worker/build.mjs` (export for the tests), `rooms-worker/test/rules.mjs` (13 cases)

**Design note — one call site, not fifteen.** The runbook said to call the helper "from the place each game becomes final". Every game becomes final differently, and hooking fifteen of them is fifteen chances to bank twice or not at all. Instead it is banked in `backToHub`, from `shared.board`, immediately before `clearGameState` wipes it: that is the one moment every game has in common, and it cannot run twice for the same game because the second `backToHub` finds `room.game` already null. The cost is that playing one game repeatedly through "play again" and *then* returning to the hub banks once, on the board it finished on. That is written into the helper's comment.

**`room.night` had to be added to `project()`.** It is room-level, like `room.chat`, and the projection sends a fixed set of fields — without this the phones would never see it.

| Acceptance criterion | Verdict |
|---|---|
| A finished game adds 3/2/1 to `room.night`, and playing again adds again | VERIFIED — `night: leaving a game for the hub banks its board`, `night: a second game adds to the first` |
| Going to the hub and playing another keeps the earlier points | VERIFIED — `night: dealing the next game keeps the evening so far` |
| A game where nobody scored adds nothing | VERIFIED — `night: a game nobody scored in adds nothing` |
| ارسم واكتب adds nothing | VERIFIED by construction and by `night: a game that keeps no scores adds nothing`; also confirmed against a real poll — لو خيروك sets no `board` and no `scores` at all, so it banks nothing (`night: a game with no score at all adds nothing to the evening`) |
| Calling the end action twice banks once | VERIFIED — `night: a second tap on the hub banks nothing twice` |
| `room.night` survives `clearGameState` | VERIFIED — it is not one of the fields that function clears; pinned by the "next game" case |
| سكرو banks the lowest total as first | VERIFIED — `night: سكرو banks its lowest total as first`. `screwBoard` sorts ascending, so every game's board is already best-first and the helper needs no per-game case |
| Ties, a single player, an all-zero board, a double call | VERIFIED — five separate cases |
| `npm run test:rules` | VERIFIED — all room rules pass |
| Robot suite | VERIFIED — 1007 passed, 0 failed |

## T4.2 — Show it in the hub — `11f5cbd`

**Files:** `JS_Room.html` (`roomNightBoardHtml`, both branches of `renderRoomHub`), `JS_RoomTv.html` (the lobby side panel), `JS_Core.html` (`room_night_title`, `room_night_hint` in `ar` and `en`)

**Scope change from the runbook:** the board is drawn for **everyone**, not only the host. `renderRoomHub` returns early for non-hosts, so the runbook's "under the game picker" would have hidden the evening's table from every player but one. A leaderboard nobody can see is not a leaderboard.

| Acceptance criterion | Verdict |
|---|---|
| Appears only once a game has been banked | VERIFIED in the browser — an empty `night` and an all-zero `night` both render `''` |
| The numbers match `room.night` | VERIFIED — rendered rows carry `data-pid` / `data-score` matching the input, sorted highest first |
| A player who has played nothing shows 0 | VERIFIED — everyone in the room is listed |
| The hub is unchanged in a room that has played nothing | VERIFIED — the helper returns an empty string |
| Strings in `ar` and `en` | VERIFIED — `npm run check`, i18n OK |
| Rows animate | VERIFIED by inspection: `renderScoreboard` gives each row `data-pid` and `data-score`, which is what `animateScoreboards` reads |

## Not verified

- The board on a real TV at 1280×720 and 1920×1080. It is drawn inside `.tv-scale` next to the player list, but it has only been seen at phone width. **UNVERIFIED — needs a live look on a big screen.**
- Two phones actually finishing a game and watching the points land. The banking is covered by the rules tests and the robot suite, but the moment itself has not been watched. **UNVERIFIED — needs a live test.**
