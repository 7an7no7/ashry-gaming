# Ideas batch: rooms

What the rooms slice built, on the page only (nothing the rooms server runs
changed: `at` was already in `shared.buzzes`, fibbage's results already carry
owners and voters).

## The staged reveal (JS_Motion.html, section 14; Style.html, IDEAS BATCH: ROOMS)

`stageReveal(key, state)` returns a small helper for a reveal drawn into markup:

- `on` - `motionFirst(key)`, and only for a deal this page saw arrive more than
  1.5 s after it was first seen: `stageDealSeen` notes the first time
  `Room.onChange` sees each `roomDealKey`. A reload, a latecomer or a TV that
  comes on mid-result sees it settled (no `data-rv`, nothing moves).
- `at(ms, kind)` - ` data-rv="kind" style="--rv-at:Nms"`; kinds `in`, `pop`,
  `undim`, `win`, `flip` (a rotateX turn with a `.rv-cover` that goes when the
  card is edge-on).
- `count(to, ms, from)` - a `countUp` at that moment (the final text set by a
  timer too).
- `board(html, ms)` - a scoreboard that appears then counts up and slides
  (`animateScoreboards` held back by `data-seen` until its time).
- `end(extra)` - the `data-reveal-ms` that `afterReveal` waits for.
`stageRun(root, state)` starts the counts, the boards and the covers' removal;
`stageSound(state, name, ms)` plays on the TV itself or through `playRoomFx`.
Transform and opacity only; `prefers-reduced-motion` switches every part off.

## Item by item

1. **Who is done, not a count, on the TV**: `tvWaitChips` in فيبج's writing,
   trivia's answering, زي الكل and صدق ولا كذب's writing, ارسم واكتب's step
   (its step note kept) and مافيا's night.
2. **فيبج's reveal** (`fibRevealPlan`, `fibRevealHtml`, `fibRevealRun` in
   JS_RoomVoting.html; the TV uses the same): the lies turn up one at a time,
   least picked first, 0.9 s apart, each «كذبة منى — ضحكت على 2» (or «محدش
   صدّقها»), then the truth flips last with who found it; ticks before it, a
   chime on it; on phones the points fly to the lie's author (500 a fooled
   player) and to the finders (1000), then the board counts up; confetti
   through `afterReveal` once the truth is up.
3. **موجة** (`wlReveal`, `wlRevealRun`): a shutter wipes off the bands from
   0.9 s while the needle pulses, then the verdict and «+N» pop and count up.
4. **مافيا's end** (`mafiaEndReveal`, `mafiaEndRun`): the role cards stay in
   seat order and flip at times ordered by role - citizens every 0.3 s, then
   Doctor / Detective / Lawyer every 0.55 s, then the Mafia every 0.7 s after a
   one-second drum roll (ticks, an alarm) - then the winners' title and the
   board. The narrator's line waits via `afterReveal`. On the TV's day result
   the news card flips before the vote count chips come in.
5. **Room trivia** (`triviaRevealPlan`, `triviaRevealRun`): the wrong choices
   dim one by one (0.8 s apart) and the right one pops and rings last, the
   counts counting up; on the phone the rows come in the same order. The TV
   between questions shows the board (`renderScoreboard` + count-up) under the
   fastest.
6. **الجرس** (`bzGapHtml`, `bzFinishHtml`): «+0.18ث» beside every queued buzz
   after the first (measured from the current first buzz); on the TV the first
   name big and, with two or more, a photo-finish strip (marks spread over at
   least 0.4 s, tags alternating high and low).
7. **الشاهد** (`witFeatureMatches`, `witTallyHtml`): after the sketch-beside-
   face comparison, chips per feature «الشعر ✓ النضارة ✗ …» pop in one by one,
   then «الرسام جاب 7/10». The tally counts the categories the real face's
   builder offers (`witCatsFor(real)`); a many-option category (marks, extras)
   is right only when every option matches.

## Decided here (open to change, each one place)

- Mafia's rows keep seat order; only the flip times follow the roles, or the
  order would tell the table who is Mafia before the cards turn.
- A cover's text (the «?») never takes a role's colour or strike-through.
- Wavelength's big «+N» sits beside the verdict, not on the dial.
- The buzzer gap is from the current first buzz (after a wrong answer the next
  in line becomes the zero).

## Traps met

- `afterReveal(el)` reads `data-reveal-ms` of el's descendants, not el's own:
  pass the parent.
- `body.is-tv-view .scoreboard` outweighs `.x .scoreboard`; a TV rule needs
  the `body.is-tv-view` prefix.
- `.metric` forces left-to-right: «+0.18ث» put the unit on the wrong side.
  The number is a `<bdi dir="ltr">`, the unit outside it.
- A flip with perspective `rotateY` warped wide cards; `rotateX` keeps them.
- A reveal keyed only with `motionFirst` replays after a reload (the memory is
  the page's); hence the fresh-deal guard in `stageReveal`.

## Tests

`npm run check` (i18n OK), `test:rules` (the leak check clean; no server file
changed), and headless Chrome with four phones and a TV (375×812 ar light,
375×812 en dark, 667×375 ar, 390×844 ar dark, TV 1920×1080) through each
reveal, screenshots mid-way, a reload mid-result coming back settled, no
console errors. Scripts: the scratchpad's `b-rooms/t1.mjs` and `t3.mjs`.
