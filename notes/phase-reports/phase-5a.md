# Phase 5A — Four moments that fall flat today

Written by Claude. agy's quota was exhausted before this phase (RESOURCE_EXHAUSTED, ~3h), and the owner asked for the work to continue.

## How motion was tested at all

The Browser pane runs hidden, so `document.hidden` is true and `motionOff()` — `reducedMotion() || document.hidden` — is always true. Nothing animates, and every check reads as "no animation", which is indistinguishable from a broken one. So each check here was made twice:

1. **As shipped**, to prove the guard: with the pane as it is, no class is added and no layer is created. That is the reduced-motion path, verified for free.
2. **With the page told it is visible** (`Object.defineProperty(document, 'hidden', …)` plus `ashryMotion: 'on'`), to prove the animation.

CSS animations still do not *advance* in a hidden pane, so resting positions were measured with `animation: none` rather than by waiting.

## T5A.3 — The Wordle row shakes on a short word — `62642cf`

`animate-shake`, the class Connections already uses; no second shake was written.

| Criterion | Verdict |
|---|---|
| A short word shakes the row being typed, not the board | VERIFIED — class on `#wordle-grid .wordle-row[guesses.length]`, animation `shake` 0.45s |
| The class is gone afterwards, so the next short word shakes again | VERIFIED — cleared after 800ms, and a second short word shakes again |
| A complete word never shakes | VERIFIED |
| With motion off, nothing moves and the toast still shows | VERIFIED — the guard returns before touching the row |

## T5A.1 — "✋ الأتوبيس وقف!" — part of `2b32e8c`

`slamBanner(word, sub)` in `JS_Motion.html`, CSS in section 14.

| Criterion | Verdict |
|---|---|
| Plays once per round, on every phone and the TV | VERIFIED — keyed `motionFirst('stop-slam|code|round')` |
| Only when a player closed the round, not the clock | VERIFIED — guarded on `s.stopperName`, which only a وقف sets |
| With motion off, no banner at all | VERIFIED — `slamBanner` returns null, and the CSS `display: none`s it under reduced motion |
| A tap during the banner reaches the screen underneath | VERIFIED — computed `pointer-events: none`, z-index 100040 |
| Removed afterwards | VERIFIED — gone after 1.2s, by timer, not by an animation event |
| The existing ✋ line unchanged | VERIFIED |
| Silent | BY DESIGN — no sound call; a cue would belong to `playRoomFx` (T1.1) |

## T5A.2 — "خمّن صح!" on the drawing — part of `2b32e8c`

| Criterion | Verdict |
|---|---|
| Only when someone guessed, never when the host gave up | VERIFIED by inspection — guarded on `s.word && s.winnerId`; a give-up sets `word` and not `winnerId` |
| Once per round per phone | VERIFIED — `motionFirst('draw-stamp|code|round')`, and it refuses to add a second node |
| Over the drawing without repainting it | VERIFIED — `position: absolute`, z-index 3, `pointer-events: none`, appended beside the canvas |
| **Centred in both languages** | **FIXED DURING REVIEW.** The first version used `inset-inline-start: 50%` with `translate(-50%, -50%)`. Under RTL that start edge is the right one, so the translate pushed the stamp off the middle: measured `centeredX: false` in Arabic. It now centres with `inset-inline: 0; width: fit-content; margin-inline: auto`, measured centred in **both** ar and en |

## T5A.4 — Mafia's night and day — part of `2b32e8c`

| Criterion | Verdict |
|---|---|
| Night → day crosses over once, and back | VERIFIED — `is-on` plus `mafia-sky--day` toggled by phase, 0.9s transition |
| A redraw inside the same phase does not restart it | VERIFIED — the layer node is reused, not recreated (`sameNode: true` across calls) |
| With motion off, the screen is simply in the right state | VERIFIED — the transition is `none` under reduced motion; the class still applies |
| No hardcoded colour | VERIFIED — `color-mix` over `--accent` and `--warning` |
| On the TV as well as the phone | PARTLY — the layer is attached to whichever root the renderer is given, and `#view-room-tv` was given the positioning context. **UNVERIFIED on a real TV.** |

## Not verified — needs a live test

- The stamp over a **real** drawing. It was measured against a stand-in wrapper; a real canvas gives `.draw-wrap` its size, and the stand-in collapsed.
- The slam on a **real** round with several phones, and Mafia's cross-fade through a real night.
- All of the above on a phone, where the motion actually runs rather than being simulated.
