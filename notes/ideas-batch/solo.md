# Ideas batch: solo (built 30 Sep 2026, branch ideas/solo)

Everything below is on the page only (no Room*.js, no bundled list touched, so no
rules tests or deploy of the rooms server). New keys are in one `// ideas batch: solo`
block at the end of each TRANSLATIONS language; new CSS is the last section of
`Style.html`, `/* ===== IDEAS BATCH: SOLO ===== */`.

## 1. خمن الكلمة: only the row just sent turns over
- `renderWordleBoard(opts)` (JS_Wordle.html): finished rows are drawn settled (the old
  `animate-flip` on every row re-flipped all of them on every key). `opts.pop` pops only
  the newest typed letter; `opts.reveal` draws the row just sent with letters only
  (`data-res` on each tile) and `wordleReveal(r, win)` turns it over tile by tile
  (`WORDLE_FLIP_GAP` 250 ms apart, `WORDLE_FLIP_MS` 460 ms each, rotateX via Web
  Animations), each tile's colour class set by a timer at its halfway point. The
  keyboard's colours are drawn once the last tile lands (`renderKeyboard` from the
  reveal's timer; at once with motion off). A win bounces the row tile by tile.
- Typing waits while a row turns (`wordleRevealUntil`). The result sheet waits
  `wordleRevealMs(win) + 450`. A reload draws everything settled (no `reveal` passed).
- «الكلمة لسه ناقصة حروف» (`wordle_too_short`) with `playSound('thud')`, not the alarm.

## 2. A soft miss sound
- `playSound('miss')` (a soft falling sigh, the duels' lose) and `playSound('thud')` (a
  low knock) in JS_Core.html. `miss` replaced `alarm` for: a lost solo game
  (`soloResult`), a wrong Sudoku number, a wrong streak answer (both places), a lost
  Flags game, a Pinpoint round with 0, a Connections miss and a lost free Connections
  game. `alarm` is kept for real timers (the general timer, the chess clock, round
  clocks) and the one-phone party games' time-ups.
- Sudoku's wrong number: a medium buzz (was heavy), the cell shakes (`soloShake`), the
  mistakes count pops (`motionBump`).
- Shared little helpers in JS_Solo.html: `soloShake(el, px)`, `soloPop(el, k)`.

## 3. خمّن الرقم: the window narrows
- `gnWindow()` (what is still possible from the history; one-sided with the friend's
  secret) and `gnPaintWindow()` draw «بين 51 و 100» (`gn_window`, or `gn_more_than` /
  `gn_less_than` with only one bound) over a bar of the whole range whose lit part is the
  window (`translateX` + `scaleX`, a spring transition). Called from `gnPaintLocal`, so
  start, every guess and a reload all paint it. The text span gets the page's `dir` (the
  h3 is `.metric`, which holds text LTR).
- A guess outside the window is not a try: a line (`gn_between` etc.), a thud, the
  field and the window shake.

## 4. 2048
- The move fires on `pointermove` once past 24 px (one move per swipe), not only on
  lift. A swipe or key during the 120 ms slide is kept (`g2048Queued`, one, the latest)
  and played when the slide ends.
- `g2048Plus(n)`: "+N" rising from the score on a merge. `g2048TopBurst(v)`: a new
  highest tile (8 and up) pops with an amber ring (`.is-top`) after it lands.

## 5. Minesweeper
- The long press cancels after 8 px of movement (`minesPointerMove`; a cancelled hold's
  click is swallowed so a scroll never opens a cell) and shows a ring filling over
  `MINES_HOLD_MS` (`.mines-ring`). The right button still flags at once.
- A loss sets the other mines off in a chain outward from the one hit (`minesChain`:
  110 ms a ring, capped, fill `backwards`, a flash `.is-blown`); the sheet waits for it.
- A number tapped without enough flags pulses its closed neighbours (`minesPulse`), in
  a race too.

## 6. Undo stacks (Queens, Tango, Nonogram)
- JS_Solo.html: `soloUndoPush(s, snap)`, `soloUndoPop(s)`, `soloCanUndo(s)`,
  `soloUndoClear(s)`; the stack is `s.hist` (last 80). A board saved with the old
  one-step `s.undo` still takes that step back.
- Nonogram gained ↶ (`undoNonogram`, `#nono-undo`): one step per drag, a clear, a hint.
- Tango: a tap redraws only its cell (`tangoPaintCell`: the mark pops, the red outline
  of rule-breaking cells recomputed, the undo button's state) instead of the grid.

## 7. Memory: a third tap during the miss pause
- `memoryCloseMiss()` is the miss's close (the timer calls it); a tap on another card
  during the pause closes the missed pair at once and flips the new card; a tap on one of
  the two just closes them.

## 8. Timer tool
- Presets 30ث / 1 / 3 / 5 / 10 د (`genTimerPreset(seconds)`: stops whatever ran, sets and
  starts at once); a ring that drains round the time (`#gtm-ring-fill`,
  `stroke-dashoffset` from `tm.total`, red for the last 10 s). `tm.total` is the length
  set (grows if +1 is pressed while running). Its exit goes to الأدوات.

## 9. Counter tool
- `renderUniversalBoard` keeps its rows (keyed `data-univ-row`) and sorts them by score
  (ties keep their order) through `motionRowsSwap`; the leader (only when alone on top)
  wears 👑 and a gold ring. While a + / − is held the rows don't move; they re-sort when
  it lets go (`hold-repeat-end`).

## 10. Hold to repeat (every stepper)
- One delegated helper in JS_Utils.html: `.stepper__btn` (stepField), `.cs-step__btn`
  (csStep) and `[data-hold-repeat]` (the counter). Held 420 ms it repeats by calling the
  button's own click, 170 ms then faster (×0.86 a step, down to 45 ms). Stops on
  pointerup / cancel, the finger sliding 24 px off the button, the page hiding, blur, the
  button going away or being disabled. The click that ends a hold is swallowed (only that
  one: a new press clears it). A tap is still exactly one step.

## 11. The solo result sheet
- One main button (again), one «شارك» (`solo_share`; picture where the phone can send
  one, otherwise the words: `shareResultCard({ textFallback: true })` - a new option, no
  download), «شوف اللوحة» + «خروج» as ghost buttons side by side (`.solo-result-minor`).
  The text-share button stays in the markup, always hidden.
- A new record is a gold stamp «رقم قياسي!» (`#solo-result-stamp`, `solo_record_stamp`)
  that slams once (`motionFirst`, not on a reopened sheet). Recognised from `o.record`,
  or the caller's own `solo_new_best` / `bowl_new_best` title or line (no caller
  changed); that line is dropped and a title that only said "new best" hides.

## Decided while building (open to change)
- The 2048 queue keeps the latest swipe, not the first.
- The new-highest-tile burst starts at 8 (4 would fire on nearly every early move).
- The Wordle keyboard stays on its old colours until the row has turned.
- On desktop «شارك» copies the text rather than downloading a picture.

## Tested
- `npm run check` passes; `ONLY=screens npm run test:ui` 20 passed.
- Headless Chrome scripts (scratch `b-solo/`): 375x812 Arabic light, 667x375 English
  dark, 1280x720: Wordle reveal mid-flip, short word, win bounce, result, reload;
  Sudoku wrong; guess-number window and nudge and reload; 2048 swipe on move, queue,
  +N, top burst; mines ring, slide cancel, hold flag, chain, sheet; Queens/Tango/Nonogram
  undo (and legacy undo, reload with the stack); memory third tap; timer preset and ring;
  counter hold and sort and crown; setup stepper hold to max; result stamp; Wordle daily
  marked and shared. No console errors.

## Traps met
- The Bash tool mangled a heredoc with `(ev === 'pointerup')`-style quoting inside a
  python heredoc; long edits went through the Edit tool instead.
- `.metric` holds its text left to right, so an Arabic sentence written into a metric
  element reads backwards ("100 بين 31 و") unless the text gets its own `dir`.
