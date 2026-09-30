# Next batch: small (three owner-approved touches)

Page-side only: nothing the rooms server runs was touched (no rules tests needed).

## 1. سكرو: «↺ شوف تاني» on the latest move (JS_RoomScrew.html)

- `skrLatestHtml` draws a small pill `.skr-replay` (`data-skr-replay`) beside the
  latest move's line, on a phone only (never the TV, which has no tap), while the
  table is on (`memorize`, `play`, `thiefGuess`), with motion on, and not while this
  phone is picking a move (`skrLocal.pick`: the flights hold slots the pick is using).
  `skrReplayOffered(state)` is that test.
- `skrReplay()` plays the latest move (the same `e` the line names, from `skrMoves`)
  through `skrPlay(root, state, [e], 0)` - the very choreography the move had, holds,
  releases, `skrFx.timers` and `busyUntil` included. No server call; nobody else sees it.
- **Memory is the game**: the replay is given `state.you` with `seen: null`, so a look
  (7/8/9/10, كعب داير, شوف وبدّل…) flies face down: a face the looker saw is not shown
  again. The drawer's own drawn card stays as it is (it is face up in the hand anyway).
  Only the latest move, never a history.
- Places that are gone after the move (the "held" card after a keep) come from the
  rects measured before the move's redraw: `skrReplayRemember(evs)` keeps
  `skrFx.replay = { seqs, rects, scroll }` when `skrAfterDraw` plays events; the replay
  uses them (shifted by how far `#shell-main` has scrolled since). Cleared by `skrFxCancel`.
  After a reload there is nothing saved: live places only, a flight from a gone place is
  skipped (its hold released), as skrFly already does.
- The button is disabled while anything is flying (`skrReplaySync`, a timer until
  `busyUntil`), after the move's own flights and during a replay.
- GAME_RULES (both languages): a fifth line in سكرو's ordered list.

## 2. دوري المعرفة: the hidden double card (JS_TriviaBoard.html)

Decided while building (open to change, each in one place):
- **One hidden double card per board** (`cell.dbl`), dealt at random among the 200-500
  cards when the board is made (`tbDealBoard(previousIds, withDouble)`, wrapping
  `dealTriviaRound`; used by the start, the next round and play again). Never a 100.
- **A setup switch «كارت دبل»** (`#tb-double-on`, on by default), remembered in
  `ashryTriviaTeams` as `double`; the board keeps it as `s.double` for its later rounds.
  A board saved before it has no `double` and no `dbl` cells: it plays as before.
- **Nothing shows it until opened.** Opening it: `slamBanner('🎯 كارت دبل!', 'النقط
  متضاعفة ×2')` in gold (`.tb-dbl-slam`), the tada, a buzz, the points badge pops
  (`motionBump`); the badge says `×2 · 800` (×2 in a `<bdi dir="ltr">`) in gold
  (`.tb-q-points--double`). The slam plays once per opening (`open.dblSeen`, saved, so a
  reload mid-card shows the card settled, still double). The card's clock starts after
  the slam: `open.endsAt` is set `TB_DBL_MS` (1.2 s) later at open, and
  `tbDoubleReveal` starts the clock when the slam is over. Motion off: no slam, no delay.
- **Points** go through `tbCellPoints(cell)` everywhere they are counted: the award, the
  steal band's points (`tbOpenPoints`), and `s.last.points` - so «رجّع آخر سؤال» takes
  exactly the doubled points off. Stolen, the other team gets the double.
- A played double card keeps a small `×2` (`.tb-x2`) on its cell; an undone one goes back
  to looking like any card (still double, and its slam plays again when reopened).
- GAME_RULES (both languages): a line under the steal.
- Found on the way: "×2 · 400" written as plain text in an Arabic badge reads "400 · 2×";
  the ×2 needs its own left-to-right isolate.

## 3. الدومينو: the numbers each seat passed on (JS_RoomDomino.html)

- `domLacksHtml(s, pid)` in `domSeatHtml`: a small gold chip `👊 4·6`
  (`.dom-seat__lacks`, the digits in a `<bdi dir="ltr">`, an aria-label «قال باص على:
  4 ، 6» / "Passed on: 4, 6") from `shared.knocked[pid]`, **only with the host's
  helpFit on** and while a round is played. Shown on the phone's seats and the TV's seat
  strip (the same builder). Off, nothing.
- On a phone upright (max-width 599px, portrait) the chip hangs on the seat's top edge
  (absolute) so three seats across keep their names; elsewhere it sits after the count.
- `domServerSig` carries `knocked` when helpFit is on, so the chip refreshes.
- `dom_help_fit_hint` and the room rules line in GAME_RULES say so (both languages).

## Tests

- `npm run check` passes.
- Browser (own wrangler on 8821, preview on 4421, headless Chrome, motion on):
  سكرو with two phones at 375x812 Arabic, 667x375 English, 1280x720: the button disabled
  while the move flies, enabled after, a replay shows two ghosts and two holds mid-way and
  leaves nothing held after; no console errors. Trivia board at 375x812 Arabic,
  667x375 English, 1280x720: the switch remembered on and off, the double never on a
  100 and exactly one a board (300 deals), hidden on the board, the slam, ×2 · points,
  a reload mid-card (card back, double, no slam), a steal worth double, the ×2 mark,
  undo taking the doubled points off. Domino with three computer players and a TV
  (1920x1080), helpFit on: a seat's chip on the phone (375x812 Arabic, 667x375 English)
  and the TV; helpFit off: none.
- `ONLY=screens,rooms npm run test:ui http://127.0.0.1:8821`: see the final report.
