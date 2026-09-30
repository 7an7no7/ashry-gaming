# Ideas batch: board (لودو, السلم والتعبان, أونو, بنك الحظ, the "you're next" cue)

## لودو: where each piece lands, on a touch screen too
- `ludoLandMarks(board, c)` (JS_Ludo.html) draws, for every `.ludo-pc.is-movable`, one ring on the
  square it would land on (the hover path's `ludo-path--end`, plus `ludo-land`): «أكل» over a capture
  (`is-capture`, the existing `ludo_takes` label), ★ on a safe square (`is-safe`: on the track, no
  capture, `LUDO_SAFE`). Two pieces landing on one square (the yard's pieces on a 6) draw one ring.
- `ludoWire(root, c, onMove, delay)` gained `delay`: the marks wait for the roll's tumble (the value
  `ludoAfterPaint` returns), one phone and rooms alike; the timer is in `ludoFx.timers`, so a redraw
  cancels it. A tap on a piece clears them; the next frame has none anyway. The mouse's hover path
  still draws and clears only its own dots (`.ludo-path:not(.ludo-land)`).
- Decided: while choosing, the fx layer goes over the movable pieces (`.ludo-board.is-choosing
  .ludo-fx { z-index: 5 }`, it takes no taps) so a «أكل» label is never under a piece. The marks pulse
  gently (opacity only), still under reduced motion.

## السلم والتعبان: before your roll
- `snkHintSync(k, on)` (JS_Snakes.html), called at the end of `snkSyncIdle` (so one phone and rooms):
  on your turn, when the roll button is ready and nothing is playing, a ring pulses at your piece's
  feet (`.snk-myring` in `c.under`) and the squares `snkReachOf(g, pid)` could reach (1-6, bouncing
  off 100 like the rules) get a rounded inset rect (`.snk-hint--snake` red where a snake's head is,
  `--ladder` green at a ladder's foot, `--plain` a dashed white edge). The rects are in a new layer
  `.snk-hints` right after `.snk-tiles`, under the ladders, snakes and numbers - nothing covers a
  number. Keyed on the game, `turnSeq` and your square; cleared the moment the roll is tapped
  (`snkLocalRoll`, `snkRoomRoll`) and whenever it isn't your ready turn. Never on the TV. Looks only.
- `snkSettleTo` empties `c.under`; the sync redraws a ring it finds disconnected.

## أونو: the colour picker counts, and "you're next"
- `unoColorPickerHtml(state)` shows «(3)» after each colour (cards of that colour in your hand, wilds
  not counted) and an outline (`is-most`) on the colour(s) you hold most.
- «بعدك إنت 👀» (`room_next_up`): one shared helper, `roomNextUpCue(game, state, nextPid, moment)`
  in JS_RoomTurn.html. Each game works out who plays next from its own table in its turn-cue
  function and passes it; when that is this phone (never a screen), a light haptic once per moment
  and a pill fixed under the header (`.room-nextup`, `--z-toast`), gone when the state stops saying
  "you're next", after 6 s, on leaving the screen or when the room moves on (`onLeaveScreen`,
  `onRoomClocksReset`). Hooked into:
  - أونو (`unoTurnCue`): the seat after the one up in `s.dir`; moment = deal + the player up.
  - الدومينو (`domTurnCue`): the next seat still in the room.
  - لودو rooms (`ludoTurnCue`): the next seat not home; moment = the player up (a 6 doesn't buzz again).
  - إستميشن (`esTurnCue`): only while cards are played and the trick isn't about to complete
    (the auction and the calls skip seats; a trick's winner leads the next).
  - جمجمة (`sklTurnCue`): while discs are added and in the auction (passed players skipped).
  - Not with two players (you are always next) - uno/domino/ludo need 3+ seats, skull 3+ alive.
- Known: the pill can linger a moment into your own turn while the table is still animating the
  last move (أونو defers the redraw); it goes with the redraw.

## بنك الحظ: «🪄 دبّرها», the buy line, the build nudge
- `bankRaiseDebt(g, priv, pid, rnd)` (BankAlhaz.js): the debt stage, the player's own debt only
  (`bankMustTurn`), refused - with nothing sold or mortgaged - when `bankLiquid` can't cover it;
  otherwise `bankRaise` (the bots' and the clock's sell-back-then-mortgage) then `bankPayDebt`.
  New room action `raise` (RoomBank.js, a turn move checked with `seq` like pay), and `raise` on one
  phone (`bankLocalDo`). The bar shows «🪄 دبّرها» in place of the greyed «ادفع» when the cash is
  short but the places cover it, with a line saying what it does (`bank_raise_can`).
- The buy question has a line (`bankBuyMeans`): «هيبقى معاك 2 من 3 الأحمر · يفضل معاك 1,280», or
  «هتكمّل الأحمر كله!» when it completes a colour; stations and companies count the same way
  («2 من 4 محطات»). Colour names are new keys `bank_col_*`.
- In the act stage, when any place can take a building (`bankCanBuildAny` = `bankCanBuild` on any of
  your places), the line is «🏗️ عندك لون كامل، تبني؟» and the 🏗️ button breathes (`.bank-nudge`).
- Rules tests (rules.mjs, "bank raise"): a stale seq does nothing; refused for someone whose debt it
  isn't; covers and pays (a station mortgaged for 100, 120 paid, 20 left); refused and nothing touched
  when it can't cover. The leak check passes (the rooms server needs a deploy for `raise`).

## Tests run
- `cd tools && npm run check`: passes.
- `cd rooms-worker && npm run test:rules`: 0 failures, the leak check clean.
- Browser (headless Chrome, 375x812 and 667x375, Arabic and English): ludo against the phone (three
  movable pieces: two ★, one «أكل»; cleared on a tap), snakes against the phone (six squares, a red
  and a green, the ring; cleared on the roll), bank against the phone (buy line, nudge, raise-it which
  mortgaged and paid), an أونو room of two people and two bots (the pill seen on the next player,
  the picker's counts), and dominoes/estimation/skull/ludo rooms started with bots: no console errors.
