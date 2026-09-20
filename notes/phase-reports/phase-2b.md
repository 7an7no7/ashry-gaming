# Phase 2b Report — Daily Archive and Stats

## Overview
Phase 2, part B delivers the archive of past daily challenges (T2.3) and the personal stats and bests dashboard "أرقامي" (T2.4).
All tasks were implemented strictly according to `notes/ROADMAP_RUNBOOK.md`, tested with Node test suites in `C:/Users/TPC/agy-tests/phase-2b/`, validated against `npm run check` (with 0 content errors and "i18n OK"), and committed individually on `feature/roadmap`.

---

## Tasks Summary

### T2.3 — The archive of past dailies
- **Commit:** `c8969c6`
- **Files touched:**
  - `Controller.html`
  - `JS_Core.html`
  - `JS_Daily.html`
  - `JS_Solo.html`
  - `JS_Utils.html`
  - `Style.html`
- **Acceptance Criteria:**
  - starting yesterday's puzzle deals the same board as yesterday's seed (prove it: same `soloDaySeed(id, day)` in, same first cells out): **VERIFIED** (Tested in `C:/Users/TPC/agy-tests/phase-2b/T2.3.test.js`: checked that yesterday's date seed produces the identical puzzle seed when loaded directly and when routed through `soloArchiveDay`).
  - finishing an archive puzzle leaves `ashryDaily_v1` byte-identical and `soloStreak()` unchanged: **VERIFIED** (Tested in `C:/Users/TPC/agy-tests/phase-2b/T2.3.test.js`: `soloMarkDaily` is bypassed when `s.archive` is active; `ashryDaily_v1` in `localStorage` was compared byte-for-byte before and after archive completion and remained identical, leaving `soloStreak()` unchanged).
  - today's own daily still records and still counts: **VERIFIED** (Tested in `C:/Users/TPC/agy-tests/phase-2b/T2.3.test.js`: completing today's daily with `daily: true` correctly writes the result to `ashryDaily_v1` and updates streak).
  - the archive board is visibly marked as archive while playing: **VERIFIED** (`soloArchiveBadge(t)` injects an archive badge `<span class="solo-archive-badge badge badge--amber">...</span>` on the board container while `s.archive` is set).
  - a reload on an archive board comes back to it, or to the archive screen — not to today's daily: **VERIFIED** (`soloArchiveDay` is set on the game state and persisted to local state; `restoreSavedView()` restores `setup-daily-archive` via `renderDailyArchive()`).
  - the new view has `VIEW_META`, is in `validViews`, has a `restoreView` branch, and has an entry in `HELP_FOR_VIEW`: **VERIFIED** (Verified in `JS_Core.html`: `VIEW_META['setup-daily-archive']`, `validViews.includes('setup-daily-archive')`, `restoreSavedView()` branch `appState.currentView === 'setup-daily-archive'`; and in `JS_Utils.html`: `HELP_FOR_VIEW['setup-daily-archive'] = 'daily_archive'` and `HELP_ENTRIES`).
  - a mock test covers: archive finish → daily store unchanged; today's finish → store written: **VERIFIED** (Covered in `C:/Users/TPC/agy-tests/phase-2b/T2.3.test.js`).

---

### T2.4 — أرقامي: what this phone has done
- **Commit:** `7f84d1e`
- **Files touched:**
  - `Controller.html`
  - `JS_Core.html`
  - `JS_Daily.html`
  - `JS_Utils.html`
  - `Style.html`
- **Acceptance Criteria:**
  - a phone with an empty `ashrySoloBest_v1` shows the screen with dashes and does not throw: **VERIFIED** (Tested in `C:/Users/TPC/agy-tests/phase-2b/T2.4.test.js`: with `ashrySoloBest_v1` empty or cleared, `renderStats()` completes without throwing and renders formatted dashes `—` for all game records instead of zeroes).
  - a best written by playing a game appears on the screen without a reload: **VERIFIED** (Tested in `C:/Users/TPC/agy-tests/phase-2b/T2.4.test.js`: updating a game's best via `soloSetBest()` and calling `renderStats()` updates the DOM immediately with the formatted score/time, e.g. Sudoku `2:05`, 2048 `2048 (2048)`, and Flags `2`).
  - the streak shown equals `soloStreak()`: **VERIFIED** (Tested in `C:/Users/TPC/agy-tests/phase-2b/T2.4.test.js`: current streak displayed matches `soloStreak()` exactly, along with all-time best streak and total dailies finished).
  - no new localStorage key is introduced: **VERIFIED** (Tested in `C:/Users/TPC/agy-tests/phase-2b/T2.4.test.js`: only existing keys `ashrySoloBest_v1` and `ashryDaily_v1` are read or written).
  - the view is registered in `VIEW_META`, `validViews`, `HELP_FOR_VIEW`: **VERIFIED** (`setup-stats` is registered in `Controller.html` (`#view-setup-stats`), `validViews`, `restoreSavedView()`, `VIEW_META`, `GAME_RULES.ar`, `GAME_RULES.en` in `JS_Core.html`, and `HELP_ENTRIES` and `HELP_FOR_VIEW` in `JS_Utils.html`).

---

## Test Execution Output

```
--- Testing T2.3: The archive of past dailies ---
Checking view checklist: VIEW_META, validViews, restoreView, HELP_FOR_VIEW, GAME_RULES, Controller container...
✓ View checklist passed.
Testing puzzle seed deal: yesterday seed vs archive seed...
✓ Puzzle deals identical board for yesterday.
Testing archive finish vs today finish on ashryDaily_v1 and soloStreak()...
✓ Archive board is visibly marked with archive badge.
✓ Finishing archive puzzle left ashryDaily_v1 byte-identical and streak unchanged.
Testing today daily finish...
✓ Today daily records and updates storage.
Testing reload behavior...
✓ Reload mid-archive comes back to archive board and not today.

ALL T2.3 TESTS PASSED SUCCESSFULLY.
```

```
--- Testing T2.4: أرقامي (Stats screen) ---
Checking view checklist: VIEW_META, validViews, restoreView, HELP_FOR_VIEW, HELP_ENTRIES, GAME_RULES, Controller container...
✓ View checklist passed.
Testing empty ashrySoloBest_v1...
✓ Empty store renders dashes without throwing.
Testing streak calculation and display...
✓ Streak and dailies stats correctly calculated and displayed.
Testing live update when best is written...
✓ Live best update verified without reload.
Testing localStorage keys...
✓ No new localStorage keys introduced.
Testing catalog registration and openStats...
✓ Catalog registration and navigation verified.

ALL T2.4 ACCEPTANCE CRITERIA PASSED!
```

```
> ashry-gaming-tools@1.0.0 check
> npm run check:content && npm run check:i18n

no problems found
ar 1839 keys, en 1839 keys, 373 data-i18n attributes
i18n OK
```
