# Phase 5B — The rest of the motion batch

Written by Claude. agy's quota was exhausted for this phase too (RESOURCE_EXHAUSTED, resets ≈20:10 on 20 Sep), and the owner asked for the work to continue.

T5B.1, T5B.2 and T5B.4 landed earlier in `90cdf4b`. This report covers the two that were left — T5B.3 and T5B.5 — and one bug found on the way.

## How motion was tested at all

The same two-pass method as Phase 5A (see `phase-5a.md`): the Browser pane runs hidden, so `document.hidden` is true and `motionOff()` is always true. Every check was made once **as shipped** (proving the guard: nothing is created, nothing moves) and once with `document.hidden` overridden and `ashryMotion: 'on'` (proving the animation). CSS animations never advance in a hidden pane, so resting states were measured with `animation: none` injected rather than by waiting.

---

## Found on the way — the room trivia clock never ticked — `29ba7b9`

Not a roadmap task. Wiring T5B.3 into the room trivia clock turned up dead code.

Every `JS_*.html` file is concatenated into one page and shares one global scope. `JS_TriviaBoard.html` is included after `JS_RoomTrivia.html` in `Controller.html`, so its `paintTriviaTimer(seconds)` **replaced** the room's `paintTriviaTimer(endsAt)`. The room's clock therefore called the board's painter, which returns immediately when `appState.triviaBoard` is unset. The question's badge on the phone and the big number on the TV sat at the question's full length and never counted down.

- Confirmed in the built page: `docs/index.html` holds both declarations at top level (lines 37290 and 42153), the later one winning.
- Present on `master` too, so it is live today.
- Fixed by room-qualifying the name (`paintRoomTriviaTimer`, like `paintStopRoomTimer` and `paintSpyfallRoomTimer` beside it) with a comment saying why.

A repo-wide scan for top-level names declared twice found only two others: `TRIVIA_COUNTS` and `startCodenamesClock`, each a client copy and a server copy. `RoomGames.js` is not part of the page (`applyRoomAction` appears in `docs/index.html` only inside a comment), so those two are in separate scopes and are fine.

## T5B.3 — The last three seconds — `eef25e4`

One helper for every clock that already marks itself urgent, so there is one convention rather than one per game. In `JS_Motion.html`:

- `countdownUrgency(el, seconds)` — pops the number at 3, at 2 and at 1, keyed on the second itself (`el.dataset.countAt`).
- `countdownEdge(el)` — one `.count-edge` element at the root of the screen that number is on.
- `countdownClear()` — both away; called from every clock's stop and from `onLeaveScreen`.

Wired into the five clocks that already mark urgency: the room trivia question, أتوبيس كومبليت in a room, الموقع السري, دوري المعرفة's open card, and `tvClock` (the Codenames turn and everything else on the big screen).

| Criterion | Verdict |
|---|---|
| The pop happens exactly three times, once per second, not on every tick | VERIFIED — a clock painted 9× across 3s, 2s and 1s adds the class exactly 3 times (`T5B.3.test.js`, section 2) |
| The edge tint appears only under three seconds | VERIFIED — no rim at 60s, 10s or 4s; a rim at 3s and 2s (test section 1 and 3; and in the browser at 375×812) |
| …and is removed when the clock stops | VERIFIED — gone at 0s and on `countdownClear()`; every `stopXClock` calls it (test sections 4 and 9) |
| Nothing moves with motion off | VERIFIED — with `motionOff()` true no class is added and no element is created (test section 6); the reduced-motion block also sets `animation: none` and `display: none` |
| The tint never covers a button | VERIFIED — computed `pointer-events: none`, and in the browser at 375×812 `elementFromPoint` over a button under the rim returns the button, at its centre and at its inline edge |
| Not `position: fixed` inside a view | VERIFIED — `position: absolute` with `.has-count-edge { position: relative }` on the view, the same pattern as `.mafia-sky` |
| The pop beats the infinite pulse those clocks already run | VERIFIED — computed `animation-name` goes from `urgentPulse` to `count-pop` on both `.tb-timer__value` and `.timer-display`; the pop lasts a whole second so the two never flicker against each other |
| A clock still running on a screen the player has stepped away from lights nothing | VERIFIED — the rim is only drawn when the number's own view is `appState.currentView` (test section 5) |

Deliberately **not** wired: القنبلة. Its fuse is a secret the server keeps (`room._bombEndsAt`, never projected) — a 3-2-1 pop would give it away. `#stop-clock.is-low` on the one-phone Stop screen is a fourth, id-based convention the task did not name; left alone.

## T5B.5 — A title at the end — `97810c2`

**The runbook's premise did not hold, and the owner chose how to take it.** The task said both titles were derivable from `shared` at gameover and forbade touching `RoomGames.js`. Neither is:

- `closeTriviaQuestion` overwrites `s.order` on every question, so at gameover it names whoever was first on the **last** question, not the fastest of the night.
- `nextTwoTruthsTurn` sets `s.caught = null` and `s.fooled = null` on the very step that turns the game over.

Given the choice between skipping the task (the runbook's own escape hatch), moving the titles to each round, or a small server change, the owner chose the server change — the branch already deploys the rooms server for Phases 3, 4, 7 and 8, so the ⛔'s "no deploy" reasoning does not apply here.

**Server.** Two tallies in room scratch, published on `shared` only at gameover: `room._triviaFastest` (who reached the right answer first, counted in `closeTriviaQuestion`) and `room._ttFooled` (how many each storyteller fooled, counted in `resolveTwoTruths`). One helper, `topTally(room, tally)`, reads both.

**Client.** `renderAward(icon, label, winner, delay)` in `JS_Motion.html`, beside `renderPodium`; `tvAwardHtml` wraps it in `.tv-scale` for the big screen. New keys `title_fastest` and `title_liar`, in both blocks.

| Criterion | Verdict |
|---|---|
| Each title is computed from `shared` alone on the client | VERIFIED — the renderers read `s.fastest` / `s.bestLiar` and nothing else |
| No change under `rooms-worker/` | VERIFIED — only `RoomGames.js` and the two test files changed; `rooms-worker/src/` is untouched |
| No change to `RoomGames.js` | **DEVIATION, owner-approved** — 30 lines added, as above |
| A game with one player shows no title | VERIFIED — `topTally` returns null under 2 players (`rules.mjs`, "one player alone takes no title") |
| A game with nobody scoring shows no title | VERIFIED — `rules.mjs`, "no title when nobody answered right" |
| …rather than an empty one | VERIFIED — `renderAward` returns `''` for a null winner, an absent one, or one with no name (`T5B.5.test.js`, section 2); `tvAwardHtml` draws no empty `.tv-scale` box |
| The titles read in both languages | VERIFIED — each key defined once in `ar` and once in `en` (`npm run check` prints `i18n OK`), and both read correctly in the preview: "⚡ أسرع واحد · أحمد · 4" and "🎭 Best liar · Mona · 3" |

Decided while building, and worth knowing:

- **A tie takes no title.** `topTally` names nobody unless one player is strictly ahead — a title half the table shares is not a title.
- **Someone who has left takes no title.** `roomPlayerName` has no name for them, so the row would have been an empty name.
- **The count is a plain number** in a badge, not words: "4 مرات" needs Arabic number agreement that differs at 1, 2 and 3–10, and a badge sidesteps it in every language.
- **Neither tally is ever projected.** `project()` sends `shared` and the player's own `secrets` slice; an underscore field on `room` does not leave the server.
- **The TV draws it too.** `JS_RoomTv.html` is outside the task's named files, but a title only the phones can see would be the wrong way round at a party — the TV is where the table looks.

### Tests

- `rooms-worker/test/rules.mjs` — 13 new checks (a clear leader with the count, a tie, nobody right, a player who left, play again starting the tally over, one player alone, and the صدق ولا كذب tally across four storytellers). `npm run test:rules`: **all room rules pass**.
- `rooms-worker/test/play-all.mjs` — the trivia round now asserts the title reaches every phone and names someone really in the room; صدق ولا كذب is played to the end and the best liar checked. Against a fresh local server: **1027 passed, 0 failed, 76.7s**.
- `C:/Users/TPC/agy-tests/phase-5b/T5B.3.test.js` and `T5B.5.test.js` — both pass.
- `cd tools && npm run check` — **no problems found**, **i18n OK**.

> A note for the next person running the robot suite: `wrangler dev` re-runs `build.mjs` when `src/` changes, but **not** when `RoomGames.js` at the root changes. A server left running from before an edit serves stale rules, and the suite then tests the old code. This run used a second server started fresh on port 8788.

## Not verified — needs a live test

- Both on a real phone, where the motion actually runs rather than being simulated behind an overridden `document.hidden`.
- The rim through a real room round with several phones: it is drawn at the root of the current view, and every view that carries one of these clocks is about one screen tall, but a view that scrolls would put the rim's top and bottom edges off-screen (its inline edges would still show).
- The titles on a real TV, where `.tv-scale` does the sizing.
- `⚡ أسرع واحد` and `🎭 أحسن كداب` read aloud at a real table — the wording is the owner's call.
