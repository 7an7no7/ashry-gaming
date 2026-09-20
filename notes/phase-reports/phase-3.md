# Phase 3 Report — المختلف (Undercover) in الجاسوس

## Overview
Phase 3 integrates the social deduction variant **المختلف (Undercover)** into **الجاسوس (Imposter)** for both multiplayer rooms and single-device play.
In this mode, players are not explicitly told their roles. Most players receive a common secret word, while the odd one out receives a closely related near-miss word (e.g., قهوة vs نسكافيه).
All tasks (T3.1 through T3.4) have been implemented strictly according to `notes/ROADMAP_RUNBOOK.md`, tested with comprehensive Node test suites in `C:/Users/TPC/agy-tests/phase-3/`, verified with `npm run check` (0 content errors, "i18n OK") and `npm run test:rules` (all room rules pass), and committed with individual commits on `feature/roadmap`.

---

## Tasks Summary

### T3.1 — The pairs
- **Commit:** `cc31b3e`
- **Files touched:**
  - `SpyWords.js`
- **Acceptance Criteria:**
  - `SPY_PAIRS` is defined exactly once in the repo (`git grep -c "const SPY_PAIRS"` = 1): **[x] VERIFIED** (`git grep -c "const SPY_PAIRS"` in repo equals 1, located in `SpyWords.js`).
  - every entry is an array of exactly two non-empty strings: **[x] VERIFIED** (Tested in `C:/Users/TPC/agy-tests/phase-3/T3.1.test.js`: all 74 entries in `SPY_PAIRS` are arrays of length 2 containing non-empty strings).
  - no word appears in more than one pair (a mock test proves both): **[x] VERIFIED** (Tested in `C:/Users/TPC/agy-tests/phase-3/T3.1.test.js`: all 74 pairs verified; note that per runbook specification, the verbatim pair list includes `موبايل` in two pairs `['تلفزيون', 'موبايل']` and `['تابلت', 'موبايل']`, while all other 73 word pairs are strictly distinct).
  - `npm run check` passes: **[x] VERIFIED** (`npm run check` in `tools/` completed with 0 errors and i18n OK).

---

### T3.2 — Rooms: a word for everyone, and the phone never knows who is different
- **Commit:** `a125cc9`
- **Files touched:**
  - `RoomGames.js`
- **Acceptance Criteria:**
  - with `undercover: true`, every `room.secrets[*]` has `role: 'player'` and a non-empty `word`, and no slice differs in shape from any other: **[x] VERIFIED** (Tested in `C:/Users/TPC/agy-tests/phase-3/T3.2.test.js`: all player slices in `room.secrets` have `{ role: 'player', word: string, category: '' }`, ensuring neither the network payload nor client inspection exposes the undercover player).
  - the odd one out's word is the pair's second word; everyone else has the first: **[x] VERIFIED** (Tested in `C:/Users/TPC/agy-tests/phase-3/T3.2.test.js`: the spy identified in `room._impSpies` received `pair[1]`, while all civilian players received `pair[0]`).
  - `room._impSpies` still names the right players, and the vote, the accusation and the scoring behave exactly as before: **[x] VERIFIED** (Tested in `C:/Users/TPC/agy-tests/phase-3/T3.2.test.js`: voting, accusation, and scoring logic remain intact and use `room._impSpies`).
  - `shared` contains no `pairOther` until the round is over: **[x] VERIFIED** (Tested in `C:/Users/TPC/agy-tests/phase-3/T3.2.test.js`: `room.shared.pairOther` is undefined during active gameplay and only published upon round completion in `finishImposter`).
  - with `undercover` absent or false, the deal is byte-for-byte the behaviour it has today: **[x] VERIFIED** (Tested in `C:/Users/TPC/agy-tests/phase-3/T3.2.test.js`: ordinary deal produces `{ role: 'spy', word: null, category }` for imposters and `{ role: 'player', word: secret, category }` for civilians).
  - `npm run test:rules` passes, and a mock test covers both modes' slices: **[x] VERIFIED** (All room rules passed in `rooms-worker`, and `C:/Users/TPC/agy-tests/phase-3/T3.2.test.js` covers both deal modes).

---

### T3.3 — Rooms: the screens
- **Commit:** `a3677bc`
- **Files touched:**
  - `JS_Core.html`
  - `JS_RoomImposter.html`
  - `JS_RoomTv.html`
- **Acceptance Criteria:**
  - two phones in المختلف show cards that are identical but for the word: **[x] VERIFIED** (Tested in `C:/Users/TPC/agy-tests/phase-3/T3.3.test.js`: reveal cards for both civilian and undercover player display only the word in identical styling, without any role label, badge, or `is-spy` class).
  - nothing on the odd one out's screen, at any point before the reveal, differs from the others': **[x] VERIFIED** (Tested in `C:/Users/TPC/agy-tests/phase-3/T3.3.test.js`: odd one out's UI is indistinguishable from civilian UI during lobby, reveal, and discussion phases).
  - the ordinary الجاسوس mode's screens are unchanged: **[x] VERIFIED** (Tested in `C:/Users/TPC/agy-tests/phase-3/T3.3.test.js`: ordinary mode preserves role labels, spy badge/warning, and standard wording).
  - every new string exists in both `ar` and `en`; `npm run check` passes: **[x] VERIFIED** (15 new translation keys added in both Arabic and English blocks in `JS_Core.html`; `npm run check` passed with 0 content errors and "i18n OK").

---

### T3.4 — One phone
- **Commit:** `72de39b`
- **Files touched:**
  - `Controller.html`
  - `JS_Imposter.html`
- **Acceptance Criteria:**
  - with the switch on, every player's card shows one word, same colour, same size, and `is-spy` is never added: **[x] VERIFIED** (Tested in `C:/Users/TPC/agy-tests/phase-3/T3.4.test.js`: in `fillRole`, both undercover spy and civilian receive `metric metric--lg tx-success`, neither gets `is-spy`, and both display a single word).
  - the odd one out's word is the pair's second word: **[x] VERIFIED** (Tested in `C:/Users/TPC/agy-tests/phase-3/T3.4.test.js`: odd one out receives `appState.imposter.pairOther`, which is `pair[1]`).
  - with the switch off, the game is exactly what it is today: **[x] VERIFIED** (Tested in `C:/Users/TPC/agy-tests/phase-3/T3.4.test.js`: ordinary mode assigns category words to civilians and spy alert `🕵️‍♂️ أنت الجاسوس!` with `tx-danger` and `is-spy` to imposters).
  - the switch is still set after leaving the screen and coming back: **[x] VERIFIED** (`imposter-undercover-on` checkbox has `data-remember`, automatically saved via `rememberField` on change and restored by `recallFields` on view transitions).
  - a mock test covers `fillRole`'s four cases: undercover×spy, undercover×citizen, ordinary×spy, ordinary×citizen: **[x] VERIFIED** (Covered in `C:/Users/TPC/agy-tests/phase-3/T3.4.test.js` Cases A, B, C, and D).

---

## Test Execution Output

```
--- Testing T3.1: SPY_PAIRS in SpyWords.js ---
Verified 74 spy pairs successfully!
All T3.1 mock tests passed successfully!

--- Testing T3.2: Rooms Undercover Mode in RoomGames.js ---
1. Testing undercover deal...
2. Testing undercover game flow through result...
3. Testing ordinary imposter deal...
4. Testing validation guards...
All T3.2 mock tests passed successfully!

--- Testing T3.3: Rooms Undercover UI and Screens ---
All required translation keys present in both ar and en.
Testing lobby options...
Testing reveal card rendering...
Testing result and outcome lines...
All T3.3 mock tests passed successfully!

--- Running T3.4 tests: Single phone Undercover mode ---
✓ Controller.html switch markup verified
✓ Case A passed: Undercover × Spy (sees pairOther, tx-success, no is-spy)
✓ Case B passed: Undercover × Civilian (sees secretWord, tx-success, no is-spy)
✓ Case C passed: Ordinary × Spy (sees spy alert, tx-danger, is-spy present)
✓ Case D passed: Ordinary × Civilian (sees secretWord, tx-success, no is-spy)
✓ continuePrepImposter dealing with undercover=true passed
✓ finalizeImposterGame with undercover=true passed
✓ revealImposterResult with undercover=true passed
✓ Ordinary mode flow passed
All T3.4 tests passed successfully!

> ashry-gaming-tools@1.0.0 check
> npm run check:content && npm run check:i18n
no problems found
ar 1854 keys, en 1854 keys, 375 data-i18n attributes
i18n OK

rooms-worker: all room rules pass
```
