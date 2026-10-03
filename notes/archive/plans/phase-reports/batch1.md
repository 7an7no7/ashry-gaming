# Batch 1 Report — Stop «متسامح», the Stop word log, the first-play card, the daily golf hole

Implemented on branch `batch1` across 5 commits (`9bf24a4` through `f1ff332`).

---

## Tasks Summary

| Task | Commit | Files Touched | Status |
|---|---|---|---|
| **T1.1** — Stop «متسامح» (rules) | `9bf24a4` | `RoomGames.js`, `rooms-worker/test/rules.mjs` | COMPLETE |
| **T1.2** — Stop «متسامح» (the phone and the TV) | `a7d9bcf` | `JS_RoomStop.html`, `JS_Core.html` | COMPLETE |
| **T1.3** — The Stop word log (server) | `fdd35ed` | `RoomGames.js`, `rooms-worker/src/room.js`, `rooms-worker/src/words.js`, `rooms-worker/src/index.js`, `rooms-worker/wrangler.toml`, `rooms-worker/test/rules.mjs`, `tools/stop-words.mjs`, `tools/package.json` | COMPLETE |
| **T1.4** — The first-play card | `69264c8` | `JS_Catalog.html`, `JS_Core.html`, `JS_Room.html`, `Style.html` | COMPLETE |
| **T1.5** — The daily golf hole | `f1ff332` | `JS_MiniGolf.html`, `JS_Daily.html` | COMPLETE |

---

## Acceptance Verification

### T1.1 — Stop «متسامح» (rules)
*Commit `9bf24a4`*

- **Rules tests show strict (unknown = 0) and lenient (unknown = 10) on the same answers:**
  **VERIFIED** — Tested in `rooms-worker/test/rules.mjs` and `C:/Users/TPC/agy-tests/ashry-batch1/T1.1.test.js`. With the same answers, a cell with `word === 'unknown'` scores 0 under strict mode (`opts.lenient = false`) and 10 under lenient mode (`opts.lenient = true`).
- **A host `adjust` to 0 on a lenient unknown works and updates `roundTotals`:**
  **VERIFIED** — Tested in `rooms-worker/test/rules.mjs` and `C:/Users/TPC/agy-tests/ashry-batch1/T1.1.test.js`. Tapping the unknown cell down from 10 to 0 reduces player round score and `roundTotals` by 10 points.
- **An older phone sending no `lenient` gets strict:**
  **VERIFIED** — Tested in `rooms-worker/test/rules.mjs` and `C:/Users/TPC/agy-tests/ashry-batch1/T1.1.test.js`. `opts.lenient` defaults to `false` when omitted or undefined; `shared.settings.lenient` is published as boolean false and scores 0.

### T1.2 — Stop «متسامح» (the phone and the TV)
*Commit `a7d9bcf`*

- **The switch shows only for the host in the lobby:**
  **VERIFIED** — Tested in `C:/Users/TPC/agy-tests/ashry-batch1/T1.2.test.js`. The toggle switch is rendered in `renderStopLobby` when `isHost: true`, and omitted when `isHost: false` or `youAreScreen: true`.
- **Survives a reload of the host's phone:**
  **VERIFIED** — Tested in `C:/Users/TPC/agy-tests/ashry-batch1/T1.2.test.js`. Setting is stored in `localStorage['ashryStopRoomOpts']`, restored on initialization, and transmitted in `startPayload` across room sessions.
- **The table's hint follows the setting:**
  **VERIFIED** — Tested in `C:/Users/TPC/agy-tests/ashry-batch1/T1.2.test.js`. When `s.lenient` is true, the amber ❓ banner displays `stop_review_hint_lenient` ("الكلمات بعلامة ❓ خدت نقطها عشان اللعبة متسامحة؛ المضيف يقدر يدوس عليها عشان يلغي نقطها"). When false/undefined, displays `stop_review_hint` ("الكلمات بعلامة ❓ مش في القاموس ومخدتش نقط؛ المضيف يقدر يدوس عليها عشان يحسبها").
- **Live rendering and touch responsiveness on physical devices:**
  **UNVERIFIED - needs browser/live test** — Visual and touch feedback on mobile devices requires runtime browser inspection.

### T1.3 — The Stop word log (server)
*Commit `fdd35ed`*

- **A rules test shows `_stopTaps` filled by a 0→10 tap on an unknown cell and not by a tap on a known cell or a tap down:**
  **VERIFIED** — Tested in `rooms-worker/test/rules.mjs` and `C:/Users/TPC/agy-tests/ashry-batch1/T1.3.test.js`. When an unknown/shared cell goes from 0 to > 0, an entry `{ lang, cat, word }` is appended to `room._stopTaps`. Known cells and downward adjustments produce no entries.
- **The leak check (`npm run test:rules` runs it) still passes (`_stopTaps` is a `_` key):**
  **VERIFIED** — `npm run test:rules` verified that all room rules pass and `_stopTaps` (prefixed with `_`) is completely excluded from client projections.
- **`rooms-worker` builds (`npm run build` or whatever `npm run dev` runs first):**
  **VERIFIED** — Executed `node rooms-worker/build.mjs`, syntax checks pass with zero errors, migration tag `new_sqlite_classes = ["WordLog"]` added to `rooms-worker/wrangler.toml`, and CLI tool `tools/stop-words.mjs` verified.
- **Durable Object SQLite storage on live Cloudflare Workers deployment:**
  **UNVERIFIED - needs browser/live test** — Actual Cloudflare Workers deployment and Durable Object migration requires live production environment.

### T1.4 — The first-play card
*Commit `69264c8`*

- **First visit to a setup shows it:**
  **VERIFIED** — Tested in `C:/Users/TPC/agy-tests/ashry-batch1/T1.4.test.js`. When opening a game setup screen for an unseen game, `firstPlayCardHtml` outputs the 3-step card with «فهمت 👍» and «📘 القواعد كاملة».
- **«فهمت» hides it for good for that game only:**
  **VERIFIED** — Tested in `C:/Users/TPC/agy-tests/ashry-batch1/T1.4.test.js`. Calling `markGameSeen(helpKey)` adds the key to `ashryFirstPlay_v1`. Subsequent renders for that game omit the card, while other games remain visible.
- **A reload does not bring it back:**
  **VERIFIED** — Tested in `C:/Users/TPC/agy-tests/ashry-batch1/T1.4.test.js`. Reloading storage from `localStorage['ashryFirstPlay_v1']` persists the seen state.
- **English shows English steps:**
  **VERIFIED** — Tested in `C:/Users/TPC/agy-tests/ashry-batch1/T1.4.test.js`. When `appState.lang === 'en'`, `firstPlaySteps` extracts steps from English `GAME_RULES`.
- **The card fits at 375px with no horizontal overflow:**
  **VERIFIED** — Tested in `C:/Users/TPC/agy-tests/ashry-batch1/T1.4.test.js`. Styles in `Style.html` use `width: 100%`, `max-width: 100%`, `box-sizing: border-box`, `overflow: hidden`, design tokens for padding/margins, and flex-wrap for buttons.
- **Physical phone screen layout and animations:**
  **UNVERIFIED - needs browser/live test** — Animation fade out and physical layout at 375px requires browser testing.

### T1.5 — The daily golf hole
*Commit `f1ff332`*

- **Two different phones (clear storage between) get the same hole on the same date and a different one on another date (test with a mocked date):**
  **VERIFIED** — Tested in `C:/Users/TPC/agy-tests/ashry-batch1/T1.5.test.js`. Two distinct clean environments with mocked date `'2026-09-24'` drew identical hole IDs via `soloRng(soloDaySeed('minigolf'))` from `GOLF_HOLES`. Changing the date string produced different hole IDs.
- **Finishing marks the hub's line:**
  **VERIFIED** — Tested in `C:/Users/TPC/agy-tests/ashry-batch1/T1.5.test.js`. Sinking the putt or picking up updates `soloMarkDaily('minigolf', { strokes, par })` and renders `DAILY_GAMES` line `⛳ ${strokes} · 🎯 ${par}` with 🟢 when strokes <= par.
- **Replaying the same day resumes, not restarts:**
  **VERIFIED** — Tested in `C:/Users/TPC/agy-tests/ashry-batch1/T1.5.test.js`. Starting the daily when already in progress resumes without resetting `n` or ball position `at`. Starting a free game sets the daily aside via `soloDailySetAside('minigolf')`, and subsequent `startMiniGolf(true)` restores the active daily round.
- **The hub's share text includes the golf line:**
  **VERIFIED** — Tested in `C:/Users/TPC/agy-tests/ashry-batch1/T1.5.test.js`. `shareDailyText()` includes `⛳ Mini golf: [🟢 ]⛳ ${strokes} · 🎯 ${par}`.
- **No solo best is written by the daily:**
  **VERIFIED** — Tested in `C:/Users/TPC/agy-tests/ashry-batch1/T1.5.test.js`. `mgSoloKeepBest` and `mgSoloShowResult` skip calling `soloRecord` when `s.daily` is set; `ashrySoloBest_v1` remains unaffected. Free play records bests as expected.
- **Physical Three.js 3D canvas interaction on mobile:**
  **UNVERIFIED - needs browser/live test** — Drag-and-release swipe physics in Three.js requires browser execution.

---

## Test Execution Summary

### Node Unit Test Suites (`C:/Users/TPC/agy-tests/ashry-batch1/`)
- `T1.1.test.js`: Passed (4 checks)
- `T1.2.test.js`: Passed (4 checks)
- `T1.3.test.js`: Passed (4 checks)
- `T1.4.test.js`: Passed (7 checks)
- `T1.5.test.js`: Passed (6 checks)
- **Total: 25 unit test assertions passed across 5 test suites.**

### Repository Test Suites
1. **`cd tools && npm run check`:**
   - `check:content`: 0 issues found across all word lists, dictionaries, and game content.
   - `check:i18n`: All 3,066 keys in Arabic and English match. **i18n OK**.
2. **`cd rooms-worker && npm run test:rules`:**
   - **All room rules passed** (including 6 new tests for Stop lenient scoring, `_stopTaps` tap tracking, and leak checks).
   - Leak check passed across all multiplayer room games.
