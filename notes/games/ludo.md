# لودو (id `ludo`)

Moved from GEMINI.md on 30 Sep 2026. GEMINI.md keeps the rules that apply to every game and an index; this file keeps the detail, word for word.

## From GEMINI.md: The owner's specs, as built

- **لودو (Ludo)** - the owner's spec of 21 Sep 2026, every rule asked one at
  a time, look أ "كلاسيك" picked from a sheet of three (*لودو*):
  - **Against the phone** (you and 1-3 computer players, easy or hard, your
    colour picked) and **a room with the TV**. Not one phone passed round.
  - **2-4 players, each for themselves**, four pieces each, no quick mode.
  - A piece leaves its yard on **a 6 only**; **a 6 rolls again**, nothing else
    does; **a third 6 in a row loses the turn**.
  - **Safe squares: the four starts and the four stars.** Landing on a single
    piece of another colour anywhere else sends it back to its yard.
  - **Two pieces of one player on a square are a wall** nobody else can pass
    or land on. **Home needs the exact number.** No "must capture first".
  - **The game plays on for places**, and ends on a podium.
  - **You tap to roll**; a move with one outcome is made for you after a beat,
    nothing to move passes by itself, and the move that brings your last
    piece home stays your own tap (the standing rules).
  - In a room: **everyone picks a colour in the lobby**, anyone who doesn't
    gets one; the starter is a **roll-off** (highest, ties roll again); with
    **five or more the host picks who plays** (the first four by default) and
    the rest watch; computer players **easy and hard**; a turn clock **off by
    default, 15 or 30 seconds** (the phone rolls and moves when it runs out).
  - Decided for the owner: the roll-off is rolled by the server for everyone
    (nobody has a choice in it, so it isn't a tap); with two players and no
    colours picked they sit opposite (red and yellow); a wall on a start
    square also keeps that colour's pieces in their yard; a player who leaves
    takes their pieces off the board, and one left ends the game in their
    favour; the host's "play for" button works as the clock would.

### لودو

The owner's rules are in *The owner's specs*. Four files and a stylesheet
section, the way the duels are built:

- **`Ludo.js`** (shared, no DOM). The board is the classic 15 x 15 cross,
  counted from the top-left, left to right in every language:
  `LUDO_TRACK_CELLS` is the 52 track squares from G's start, going round
  clockwise; `LUDO_HOME_CELLS` each colour's column; `LUDO_YARD` and
  `LUDO_SPOTS` the yards. Yards: G top-left, Y top-right, B bottom-right, R
  bottom-left, and turns go G, Y, B, R. A piece's place is a number from its
  own start (-1 yard, 0..50 track, 51..55 its column, 56 home); `ludoGlobal`
  turns it into a track square and `ludoCellOf` into a place to draw.
  A game is one plain object shaped like a room's `shared` (`seats`,
  `colors`, `pieces`, `turn { pid, stage, dice, sixes }`, `movable`,
  `places`, `phase`, `turnSeq`, `events`), so the server uses it as its
  `shared` and the phone keeps it in `appState.ludo.g`. `ludoRoll` and
  `ludoMove` apply the rules and write the events every screen animates
  (`rolloff`, `roll`, `three`, `nomove`, `move` with `cap`, `finish`, `over`);
  `ludoTarget` is the one rule for where a piece goes (the 6 out of the yard,
  walls, the exact number home, captures off the safe squares);
  `ludoOnlyMove` the forced move (never the finishing one); `ludoBotPick` the
  computer players - easy picks any move, hard scores each (a capture, home,
  into the column, out on a 6, out of reach, onto a safe square or a wall,
  never into reach of a piece behind).
- **`RoomLudo.js`** is what a room adds: the lobby (`color` - anyone seated
  takes or lets go of a colour, the host may pick for a bot; `seat` - the
  host's four with five or more, `shared.lobby`), `start` / `playAgain` (the
  seats and colours, `ludoFillColors` for the rest, the roll-off rolled on the
  server, `shared.wins` kept), `roll` and `move` (with `seq`, a stale tap
  dropped), `skipTurn` and the clock (`ludoAuto`: roll, then the easy move),
  leaving (`ludoRemovePlayer`), `ROOM_BOT_GAMES.ludo` and
  `ROOM_FORCED_GAMES.ludo`. Nothing is secret: the whole game is `shared`.
  The roster is everyone in the room, so whoever watches still gets the
  board, and a latecomer is drawn the board too (`lateJoin`).
- **`JS_Ludo.html`** draws a game on any screen: `ludoBoardHtml` (the fixed
  squares built once, `ludoFixedHtml`, then the pieces placed in percent of
  the board, pieces sharing a square set a little apart), `ludoFrameHtml`
  (the strip of players, the board, the bar with the die, the log, and at
  the end the podium), `ludoAfterPaint` (the events not yet shown, played on
  the board) and `ludoWire` (a tap moves a piece; a mouse or the keyboard on
  a piece first shows the squares it would pass). The board turns so your
  own yard is at the bottom left (`LUDO_ROT`); a watcher's and the TV's are
  not turned. Against the phone lives here too: `appState.ludo`, the setup
  painter, `ludoLocalNext` (a computer player's roll or move, or your only
  move, after the motion has landed), registered through `soloRegister` for
  the reload.
- **`JS_RoomLudo.html`** is the room around it: the lobby's colour picker
  and seats, `ROOM_GAMES.ludo` and `TV_GAMES.ludo`, the turn clock, the
  host's "play for" button for a quiet phone, and the roll that starts the
  die spinning as the finger lifts (the number is the server's).
- **The motion.** Everything is drawn where it ends up, and the motion runs
  backwards from where it was (Web Animations of transform, `fill:
  backwards`, delayed one after another): the die (the app's 3D die,
  `DIE_LANDING`) tumbles to its number, a piece hops square by square (in the
  board's own turned frame, so the numbers are cells times the board's width
  over 15), a piece taken bursts and flies back to its yard spinning, a piece
  home bursts in its colour, and the first turn waits for the roll-off card.
  `ludoFx.busyUntil` holds the next frame (a room's, or the phone's next
  computer move) until the last flight has landed. Nothing replays after a
  reload, the lock screen or joining late. Four short sounds are added to
  `FX` (`ludoRoll`, `ludoStep`, `ludoCapture`, `ludoHome`); with a TV in the
  room only the TV plays the table's, a phone its own.
- **Fitting.** Upright: the players across the top, the board the width of
  the phone, the bar sticky under it. On a phone's side and from 900px the
  board takes the height (`--app-h`) with a column beside it; the TV's board
  is as tall as the stage (83% of 1280 x 720).

## The night, «مين هيكسب؟» and play again (the review of 1 Oct 2026)

- The board (`ludoBoard`, RoomLudo.js) is still the evening's wins at this game, but level wins are told
  apart by this game's places (`tie`, as الكراسي and the bumper cars do, `boardRowKey` in
  RoomGames.js): one game of four banks 5 / 3 / 2 / 1 on the night, not 5 and a 3 for everyone else.
- «مين هيكسب؟» is settled on the game just played (`ROOM_RESULT_BOARDS` in RoomGames.js: its
  places once it is over), not on the evening's tally.
- «العب تاني» keeps the seats of whoever is still here and gives a free seat to someone who
  watched (joined late, or a seat emptied), never to anyone the host benched; with one left and a
  watcher it no longer refuses.
- The first turn's clock starts once the phones have shown the roll-off (`readyAt`: 1.15 s a round
  of dice and 1.5 s more, `LUDO_ROLLOFF_ROUND_MS` / `LUDO_ROLLOFF_TAIL_MS`, the same timing as
  `ludoRollOffPanel`); until then the phones show the turn's full time.

**A player who got home and then left keeps their place on the board** (the audit of 6 Oct 2026): `ludoBoard` keeps a seat that is in `places`, with the name the board had, so the night banks the winner who left as the winner.

## The ideas of 7 Oct 2026, third batch (the owner's picks): built

Picked from the ideas page of 7 Oct 2026 (round three); the owner asked no extra rule unless said: "build as described, choose simple family-friendly details".

- **953 Movable pieces lift.** After your roll the pieces you can move rise and pulse (`.ludo-pc.is-movable`: a bigger shadow and `ludoLift`, a scale 1.12 ↔ 1.26; still at 1.18 with motion off) and every other piece steps back (`.ludo-board.is-choosing .ludo-pc:not(.is-movable)` at 45% opacity). Where each would land was already drawn at once (`ludoLandMarks`, the second batch); a finger **held** 0.38 s on a piece now draws its whole path, as a mouse does (`ludoWire`: `pointerdown` timer, `_ludoHeld`; lifting after a hold moves nothing, a quick tap still moves; no callout or text selection on a piece). The bar's line says «اختار حجر: {n} يقدروا يتحركوا» (`ludo_pick_n`, the count of `g.movable`; `ludo_pick_piece` gone).
- **954 The die is the roll button.** On your roll the bar's button is the die itself with «ارمي» on it (`.ludo-bar__roll`, `btn--primary btn--lg`, the die inside nudging; 46% of the bar on an upright phone, as السلم والتعبان's), the line beside it; after the roll the same die shows the number next to what to do (`ludoBarHtml`). The separate die and «ارمي» button are gone; `ludoRoomRoll` still spins `.ludo-die` as the finger lifts.
- **955 The turn clock as a ring.** With a turn clock the player up's face in the strip wears a ring of the time left in their colour (`.ludo-chip__ring`, a conic gradient masked to a ring), and on the TV their yard too (`.ludo-yardclock`, drawn by `ludoBoardHtml`'s `ring` option round the yard's white square). `ludoTickClock`'s `paint` sets `--ludo-left` (the share of the turn left, once a second) on every `[data-ludo-ring]` and `is-low` (a blink) in the last five seconds.

## History

The day-by-day log of the work on this game is in `notes/log.md` (search it for the game's name); a new entry goes there, and anything that changes how the game works goes in this file.
