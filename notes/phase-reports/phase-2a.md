# Phase 2a Report — The Home and the Room Hub

## Overview
Phase 2, part A implements player count filtering on the home catalog (T2.1), the "اختارلنا" (Pick for us) random game chooser button on the home hero (T2.2), the together / apart (مع بعض / كل واحد في مكان) location filter on the home (T2.5), and the host-only together / apart room hub hint badge (T2.6). All tasks have been executed in sequence, tested with Node mock tests, verified via `npm run check` and `npm run test:rules`, and committed individually in accordance with `notes/ROADMAP_RUNBOOK.md`.

---

## Tasks Summary

### T2.1 — Filter the home by how many people are here
- **Commit:** `6fe30d8`
- **Files touched:**
  - `JS_Catalog.html`
  - `JS_Core.html`
  - `Style.html`
- **Acceptance Criteria:**
  - picking 6 hides every game whose range excludes 6, in every section, and shows the rest: **VERIFIED** (Mock test in `C:/Users/TPC/agy-tests/phase-2a/T2.1.test.js` verified multi-filter simulation on catalog; games with ranges excluding 6 are hidden and games including 6 are shown).
  - picking "off" restores every card: **VERIFIED** (Mock test verified setting player count to `'off'` restores all games).
  - the count combines with a mode chip and with the search box (all three at once): **VERIFIED** (Mock test verified combining mode `'room'`, count `6`, and search term `'maf'` simultaneously filters the catalog down to games matching all three).
  - a section whose cards are all hidden is hidden too, as it already is for the mode chips: **VERIFIED** (Code inspection of `applyHomeFilter()`: `sec.classList.toggle('hidden', !visible)` toggles section visibility based on whether any cards in that section remain visible).
  - the choice is still there after switching the app to English and back: **VERIFIED** (`homePlayers` is stored in module scope and persisted to `rememberOptions('homePlayers', count)`. On language change, `applyTranslations` triggers `renderCatalogViews` -> `renderHome` which draws the chip row with `p === homePlayers` marked active and calls `applyHomeFilter()`). Live browser verification: **UNVERIFIED — needs live test**.
  - a mock test covers the predicate for [2,4] at counts 1, 2, 4, 5 and "8+" against [3,12]: **VERIFIED** (`C:/Users/TPC/agy-tests/phase-2a/T2.1.test.js` covers count 1 (false), count 2 (true), count 4 (true), count 5 (false), count "8+" (false) for `[2, 4]`, and count "8+" (true) against `[3, 12]`).

### T2.2 — اختارلنا: one tap when nobody can decide
- **Commit:** `f69d993`
- **Files touched:**
  - `JS_Catalog.html`
  - `JS_Core.html`
  - `Style.html`
- **Acceptance Criteria:**
  - with a count of 6 set, it never opens a game that does not take 6: **VERIFIED** (Mock test in `C:/Users/TPC/agy-tests/phase-2a/T2.2.test.js` confirmed that games not taking 6 are hidden and never picked by `homePickForUs`).
  - pressing it ten times in a row does not open the same game twice until the pool has gone round: **VERIFIED** (Mock test in `C:/Users/TPC/agy-tests/phase-2a/T2.2.test.js` executed 10 consecutive calls of `homePickForUs` on a pool of 10 visible games, verifying that each of the 10 games is opened exactly once without duplicates).
  - with a search that matches nothing, it does nothing and says so (a toast), rather than throwing: **VERIFIED** (Mock test verified that when no games are visible, `homePickForUs` displays `showToast(t.home_pick_none)` and does not throw an error or call `catalogOpen`).
  - it works on the home only, and the tools tab is unaffected: **VERIFIED** (Code inspection of `homeVisibleGameIds()`: selects only `#view-menu section[data-group]:not([data-group="tools"]):not(.hidden) .gcard:not(.hidden)`. Tools and `#view-tools` are excluded). Live browser verification: **UNVERIFIED — needs live test**.

### T2.5 — مع بعض، ولا كل واحد في مكان؟
- **Commit:** `53b6c46`
- **Files touched:**
  - `JS_Catalog.html`
  - `JS_Core.html`
  - `Style.html`
- **Acceptance Criteria:**
  - with `كل واحد في مكان` chosen, مافيا, الجاسوس, من أنا؟ and كلمة واحدة are hidden, and ارسم وخمّن, فيبج, سكرو and تحدي المعلومات are shown: **VERIFIED** (Mock test in `C:/Users/TPC/agy-tests/phase-2a/T2.5.test.js` confirmed `mafia`, `imposter`, `whoami`, `justone` return `false` under `'apart'`, while `drawguess`, `fibbage`, `screw`, `trivia` return `true`).
  - with the same chip chosen, every solo game, every card scorer and بدون كلام are hidden (they are not `room` games): **VERIFIED** (Mock test confirmed that `sudoku`, `g2048`, `mines`, `queens`, `tango`, `nonogram`, `wordwheel`, `pinpoint`, `cs-estimation`, `cs-tarneeb`, `cs-trix`, `cs-konkan`, `cs-basra`, `domino`, and `charades` all return `false` under `'apart'`).
  - `مع بعض` shows everything again: **VERIFIED** (Mock test confirmed `catalogMatchesLocation(g, 'together')` returns `true` for all games in `GAME_CATALOG`).
  - the nine `faceToFace` flags are exactly the nine listed, no more: **VERIFIED** (Mock test verified `GAME_CATALOG` contains `faceToFace: true` on exactly: `imposter`, `chameleon`, `spyfall`, `mafia`, `whoami`, `justone`, `monkey`, `fiveseconds`, `buzzer`, and no others).
  - a mock test covers the predicate for a faceToFace room game, a plain room game and a device-only game, under both chips: **VERIFIED** (`C:/Users/TPC/agy-tests/phase-2a/T2.5.test.js` covered faceToFace room game, plain room game, and device-only game under both `'together'` and `'apart'`).

### T2.6 — The room hub says which games want everyone in one place
- **Commit:** `efd5ad4`
- **Files touched:**
  - `JS_Room.html`
  - `JS_Core.html`
- **Acceptance Criteria:**
  - with the chip on `مع بعض` the hub looks exactly as it does today: **VERIFIED** (Code inspection: when `roomHubLocation === 'together'`, `showHint` is false and `badgeText` reduces to `!enough ? `${g.min}+` : ''`, identical to the baseline markup). Live browser verification: **UNVERIFIED — needs live test**.
  - with `كل واحد في مكان`, the nine face-to-face tiles carry the hint and every tile is still tappable: **VERIFIED** (Code inspection: when `roomHubLocation === 'apart'`, any tile with `CATALOG_BY_ID[g.id].faceToFace === true` includes `t.room_hub_facetoface` in `badgeText`, and `enough ? '' : 'is-disabled'` is unaltered so face-to-face status never disables the tile). Live browser verification: **UNVERIFIED — needs live test**.
  - a player who is not the host sees no chip and no change: **VERIFIED** (Code inspection: `if (!state.youAreHost) return '<div class="waiting-note">...</div>';` returns early before the chip controls are rendered).
  - nothing about this reaches the rooms server: `git diff` for this task touches no file under `rooms-worker/` and not `RoomGames.js`: **VERIFIED** (`git diff efd5ad4~1..efd5ad4` touches only `JS_Core.html` and `JS_Room.html`; 0 changes in `rooms-worker/` or `RoomGames.js`).

---

## Test Execution Output

```
--- Testing T2.1: catalogMatchesPlayers predicate ---
--- Testing T2.1: Multi-filter simulation ---
All T2.1 tests passed successfully!

--- Testing T2.2: homePickForUs & homeVisibleGameIds ---
All T2.2 tests passed successfully!

--- Testing T2.5: catalogMatchesLocation predicate ---
All T2.5 tests passed successfully!

> ashry-gaming-tools@1.0.0 check
> npm run check:content && npm run check:i18n

no problems found
i18n OK

> rooms-worker@1.0.0 test:rules
all room rules pass
```
