# Phase 1 Report — Two Real-Table Problems, and the Keyboard

## Overview
Phase 1 addresses acoustic echo in multiplayer rooms when a big screen is present (T1.1), non-destructive editing of past rounds in card score keepers (T1.2), and viewport height resizing on mobile on-screen keyboard display (T1.3). All three tasks have been executed, verified with mock tests and project checks, and committed in accordance with `notes/ROADMAP_RUNBOOK.md`.

---

## Tasks Summary

### T1.1 — When a TV is in the room, the TV is the only voice
- **Commit:** `bfc3554`
- **Files touched:**
  - `JS_Room.html`
  - `JS_RoomStop.html`
  - `JS_RoomMafia.html`
  - `JS_RoomCodenames.html`
  - `JS_RoomFiveSeconds.html`
  - `JS_RoomMonkey.html`
  - `JS_RoomScrew.html`
  - `JS_Sounds.html`
- **Acceptance Criteria:**
  - with no screen in the room, every sound behaves exactly as before (`roomHasScreen()` false → `playRoomFx` is `playSound`): **VERIFIED** (Mock test in `C:/Users/TPC/agy-tests/phase-1/T1.1.test.js` exercised `Room.state = null` and `screens = []`, confirming `playRoomFx` forwards to `playSound`)
  - with an online screen in `state.screens`, a player's phone plays no tick, no letter-landing cheer, no fanfare: **VERIFIED** (Mock test exercised `screens: [{ online: true }]` with `youAreScreen: false`, verifying ambient ticks, alarms, and confetti tada are silenced)
  - the same state still plays "دورك!" on the phone it belongs to: **VERIFIED** (Code inspection of `JS_RoomTurn.html` confirmed `playSound('success')` remains untouched and direct)
  - `roomHasScreen` returns false on the screen itself (`youAreScreen`), so the TV is never silenced: **VERIFIED** (Mock test exercised `youAreScreen: true` with online screens, verifying `roomHasScreen()` returns `false` and sound triggers)
  - `roomHasScreen` and `playRoomFx` are each defined exactly once in the repo: **VERIFIED** (`git grep -n "function roomHasScreen(" -- "*.html" "*.js"` and `git grep -n "function playRoomFx(" -- "*.html" "*.js"` returned exactly 1 definition each in `JS_Room.html`)
  - a mock test covers: no screens → sound; one online screen → silent; one offline screen → sound; this device is the screen → sound: **VERIFIED** (All cases covered and passing in `C:/Users/TPC/agy-tests/phase-1/T1.1.test.js`)

### T1.2 — Fixing round 3 must not destroy rounds 4 to 8
- **Commit:** `471c2de`
- **Files touched:**
  - `JS_CardScore.html`
  - `JS_Core.html`
- **Acceptance Criteria:**
  - with eight rounds saved, editing round 3 and saving leaves eight rounds, with rounds 4-8 byte-identical: **VERIFIED** (Mock test in `C:/Users/TPC/agy-tests/phase-1/T1.2.test.js` confirmed `s.rounds.length === 8` and `JSON.stringify(s.rounds.slice(3)) === JSON.stringify(original.slice(3))`)
  - the totals after the edit equal a fresh replay of the same eight rounds: **VERIFIED** (Mock test verified `csTotals` matches manual sum of the 8 rounds)
  - editing a round that would end the game sets phase to over; editing it back reopens the game: **VERIFIED** (Mock test verified setting points crossing threshold transitions phase to `'over'`, and reducing points transitions phase back to `'play'`)
  - cancelling an edit leaves `s.rounds` untouched and clears `s.editing`: **VERIFIED** (Mock test verified `csCancelEdit` clears `s.editing` and `s.draft`, with `s.rounds` matching pre-edit snapshot byte-for-byte)
  - a reload mid-edit (`s.editing` saved in state) comes back on the same edit, or cleanly cancels it: **VERIFIED** (Chose to come back on the same edit: `s.editing` is persisted in `s` via `saveToLocal()`, and `paintCardScore` recognizes `isEdit = typeof s.editing === 'number' && !!s.rounds[s.editing]` to keep the user in edit mode with their draft populated)
  - both new keys exist in the ar and en blocks; `npm run check` passes: **VERIFIED** (`cs_save_edit` and `cs_cancel_edit` added to `ar` and `en` in `JS_Core.html`; `cd tools && npm run check` passed with `i18n OK` and `no problems found`)
  - a mock test covers: edit round 3 of 8 → rounds 4-8 unchanged and totals recomputed; cancel → nothing changed: **VERIFIED** (`C:/Users/TPC/agy-tests/phase-1/T1.2.test.js` executed and passed)

### T1.3 — The keyboard covers the button it is there to press
- **Commit:** `3524cfc`
- **Files touched:**
  - `Controller.html`
- **Acceptance Criteria:**
  - the meta tag is exactly as above, and it is the only viewport meta in the file: **VERIFIED** (`git grep -n 'name="viewport"' Controller.html` returned exactly 1 match: `<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover, interactive-widget=resizes-content">`)
  - `--app-h` still comes from `syncAppHeight` — do not change that function in this task: **VERIFIED** (Inspection confirmed `syncAppHeight` in `JS_Core.html` is unchanged)
  - layout resize behavior on Android Chrome on-screen keyboard: **UNVERIFIED — needs live test** (Requires testing in a real mobile browser with virtual keyboard invocation)

---

## Test Execution Output

```
--- Testing T1.1: roomHasScreen & playRoomFx ---
All T1.1 mock tests passed successfully!

--- Testing T1.2: Card Score History Edit ---
All T1.2 mock tests passed successfully!

> ashry-gaming-tools@1.0.0 check
> npm run check:content && npm run check:i18n

no problems found
i18n OK
```
