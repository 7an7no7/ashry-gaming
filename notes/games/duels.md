# The duels: كونكت ٤, نقط ومربعات and إكس أو

Moved from GEMINI.md on 30 Sep 2026. GEMINI.md keeps the rules that apply to every game and an index; this file keeps the detail, word for word.

## From GEMINI.md: The owner's specs, as built

- **إكس أو, 3 marks only** - the owner, 22 Sep 2026 ("good players always
  draw"), every rule asked first (`JS_XO.html`):
  - a **switch on the X-O setup, off by default** (remembered on the phone);
    against a friend and against the phone, easy and hard;
  - each side keeps **three marks**; a fourth takes the place of that side's
    oldest (`x.order`, oldest first), which **fades out** as the new one lands;
  - the oldest is **shown faded on its owner's turn only** (the owner, the
    same day: "in my turn the one that will disappear will be faded, but not
    in his turn, to make it use memory too"), and **the new mark can't go on
    its square** - it is still on the board while you choose;
  - **no draws and no move limit**: six marks never fill nine squares, so play
    goes on until someone makes three in a row.
  - Built here: a round keeps the rule it was dealt with (`x.rule3`), so the
    switch changes the next round, never this one; the phone searches a few
    moves deep with alpha-beta in 180ms at most (`xo3BestMove`), judging a
    position by the lines each side could still finish without the mark it is
    about to lose; easy looks two moves ahead and plays at random a third of
    the time. Simulated: hard beat random play 24 of 24 and easy 16 of 16,
    every move legal, the slowest 52ms.

- **كونكت ٤ and نقط ومربعات (the duels)** - the owner's decisions of
  21 Sep 2026, asked one by one, built the same day (*The duels*):
  - **Three ways each**: two on one phone; one against the phone at سهل /
    متوسط / صعب; a room on separate phones with the TV
    (`modes: ['device', 'room', 'tv']`). Both sit in لاتنين على موبايل
    (`group: 'duo'`) beside إكس أو and the memory game.
  - **On one phone**: a running tally across games, and **the first move
    alternates** - whoever went second starts the next game. **No take-backs
    at all** (the owner: "never").
  - **In a room only two play at once: winner stays on.** The loser goes to
    the back of the line, the next in line sits down against the winner, and
    **the challenger moves first**. With exactly two in the room they simply
    keep playing, the first move alternating.
  - **Connect 4**: 4 in a row on the classic 7 x 6, or 5 in a row on Hasbro's
    9 x 6 (an option). A full board with no line is a draw.
  - **Dots & Boxes** (the Plato game): two players only, 4x4, 6x6 or 8x8
    boxes; the fourth side takes the box and moves again; most boxes wins,
    and a draw is possible.
  - **The look**, option أ of a design sheet for both: Connect 4 "كلاسيك
    أزرق" (a blue board, holes showing the page ground, red and yellow discs
    with an inner ring, the winning line ringed white, a faint ghost disc over
    the column about to be played, the players as pills with their disc and
    score); Dots "نضيف (زي Plato)" (a clean card, slate dots, 6px round-ended
    lines in blue and rose, faint guides, a box tinted with its owner's
    colour and their initial, the last line glowing briefly).
  - **Decided for the owner** (the suggestions they gave, taken): a draw
    keeps the champion in the seat and sends the challenger to the back; a
    seated player who leaves mid-game loses by forfeit (a win for the other,
    counted) and the next in line sits down. Also decided here: anyone in the
    room can deal the next game (whoever is left at the table must be able
    to carry on), the first game's seats and first move are drawn at random,
    the first game's second seat counts as the champion for a draw, and a
    streak (🔥 wins in a row) is shown from two.

### The duels: كونكت ٤ and نقط ومربعات

Two games for two, each played three ways - two on one phone, one against the
phone, or a room where two play and everyone else watches - to the owner's
decisions of 21 Sep 2026 (*The owner's specs*).

**One copy of the rules.** `Connect4.js` and `DotsBoxes.js` at the root hold a
board model, the legal moves, a move applied, the line or box it made, and the
phone's player, with no DOM and nothing that runs at load. The page inlines
both (`SHARED_LISTS` in `tools/build-*.mjs`) and the Worker bundles both
(`FILES` in `rooms-worker/build.mjs`), so a disc on one phone and a disc in a
room are judged by the same `c4Play`, a line by the same `dotsPlay`. Every
top-level name is prefixed (`c4…`, `C4_…`, `dots…`, `DOTS_…`; the page files
use `duel…` for what both share), because the page and the Worker are each one
scope.

- **كونكت ٤**: a board is `{ cols, rows, n, grid }`, row 0 at the top, cells
  0/1/2; `c4Mode(4 | 5)` is the classic 7 x 6 or Hasbro's 9 x 6 with five in a
  row. `c4LinesThrough` returns every cell of every run of n or more through
  the disc just played, in order along the run, which is what lights the line
  one disc at a time; a run longer than n lights whole.
- **نقط ومربعات**: n x n boxes, lines numbered horizontal first (`r*n + c`,
  r = 0..n) then vertical (`n(n+1) + r*(n+1) + c`); `dotsGeom(n)` works out
  each line's boxes and each box's lines once per size. `dotsPlay` returns
  the boxes a line took, `again` (it took one and the board isn't full) and
  `over`.

**The phone as a player** never holds the page. `c4BestMove(board, me,
level)`: easy takes a win it sees three times in four, blocks half the time,
and otherwise drops near the middle at random; medium looks three plies ahead
and a quarter of the time settles for its second choice if that doesn't hand
over the game; hard takes a win, blocks a threat, then runs a negamax with
alpha-beta over columns ordered from the middle out, deepened one ply at a time
until `C4_BUDGET_MS` (250ms) is up, keeping the best move of the last depth it
finished. Its judgement of a position (`c4Evaluate`) scores every window of n
cells that only one side has discs in - a lot when it is one short - the
opponent's a little heavier than its own, and discs near the middle column.
`dotsBestMove`: easy takes a box most of the time and otherwise draws about
anywhere; medium always takes a box, never draws a third side while a safe line
is left, and in the endgame opens whatever gives away fewest boxes; hard does
what medium does, and also (1) while a dozen or fewer safe lines are left,
counts them out to the end (`dotsSafeSearch`, memoised, with its own time
budget) so that the other side has to open the first chain when that pays -
the long-chain rule in practice; (2) values the endgame exactly when what is
left is plain chains and loops (`dotsChainValue`: whoever must open picks the
cheapest; the other takes all, or takes all but two of a chain or four of a
loop and hands them back), counting a tangle where chains meet as one chain of
its size; and (3) plays the **double-dealing move** (`dotsDoubleDeal`: the
last two boxes of a chain, or four of a loop, left with one line) when what is
still to come is worth more than the boxes given away. Both searches also stop
at a node ceiling, not only the clock - see *Traps*. A thinking delay of
400-700ms (shorter while the phone runs down a chain of boxes) lets the move
be seen; the timer stops when the board leaves the screen (`onLeaveScreen`)
and starts again on the way back or after a reload.

**On one phone** (`JS_Connect4.html`, `JS_Dots.html`): the game lives in
`appState.connect4` / `appState.dots` (options, board, whose turn, who starts,
the tally, the typed names), so a reload comes back to the board exactly -
the phone's turn included - through `soloRegister` (the solo games'
registration, which gives `validViews`, `restoreView` and the setup painter
without a branch in `JS_Core.html`, as على راسك and the card scorers use it).
Start is a new match (the tally from nothing); "ماتش كمان" is the next game of
the same match, started by whoever went second. The setup screen carries the
one phone / own phones switch, the options, the level (against the phone) or
two optional names (two on one phone; `data-remember`), and "كمّل" for a game
left in the middle. A second tap within a quarter second is dropped
(`busyUntil`), so two on one phone can't play for each other by accident.

**Taking a move**: Connect 4 reads the column from where the finger or the
mouse is on the board (`c4Wire`): the ghost disc follows it while pressed or
hovered, and letting go drops there; `touch-action: pan-y`, so a vertical
swipe still scrolls the page and cancels the drop. The columns are also
buttons over the grid, for a keyboard (a click with no pointer,
`event.detail === 0`). Dots picks the nearest free line within 0.38 of a box
of the finger (`dotsLineAt`), shows it faintly while pressed, and draws it on
letting go (`touch-action: none` on a playable board), so on 8x8 a line can be
slid onto before it is committed; a tap in the middle of a box draws nothing.

**What both games draw** (the top of `JS_Connect4.html`): `duelPillsHtml` - the
two players as pills with their piece, name and score, and one ring that sits
on whoever is to move - and `duelPillsAfter`, which slides that ring over from
the pill it was on, counts a score up (`countUp`), and pulses the pill when the
same player moves again after a box; `duelSound` (a knock, a scratch, a pop, a
sigh, made with the soundboard's `fxTone` / `fxNoise`); `duelIso`, which
isolates a name inside a translated line (FSI ... PDI), or "Next: جمال vs هند"
reorders itself. Motion, per move (`c4AfterPaint`, `dotsAfterPaint`): the disc
falls from above the board to its cell, speeding up, with a small bounce, and
knocks on landing; the winning line lights one disc at a time (a CSS animation
on `.is-lighting`, whose end state is the ring the class already draws); a
full board shakes; a line draws itself from its first dot (`transform-box:
fill-box`), glows for a moment, and a box it took pops in with its owner's
colour and initial. Each is keyed with `motionFirst` (a room redraw doesn't
replay it) and sounds once per move (`duelOnce`, whatever the motion setting).
The end of a game waits for its reveal (`afterReveal`): confetti for any win
two on one phone, only for a human win against the phone, a sigh for a loss.

**In rooms: winner stays on** (`RoomDuels.js`; `connect4Action`, `dotsAction`
and `duelPlayerLeft` are all `RoomGames.js` dispatches to). Everything is
public, so it all lives in `shared` and there is no secret at all; the server
only checks that the move came from the seat whose turn it is, that it is legal
(`c4Play` / `dotsPlay` return null otherwise), and that it was drawn for this
board - every move carries `move`, the number of moves the phone saw, and a
stale one is dropped (`staleTap`). `shared.seats` is [first to move, second]
(seat 0 is red or blue), `line` the queue, `champ` who stays once a game is
over, `result`, `prev`, `streak`, and `scores` / `board` (wins, best first,
which the night's leaderboard banks and the TV strip shows). A game over
(`duelEnd`): the winner scores and stays, the loser goes to the back of the
line; a draw keeps the second seat (the champion, or whoever sat there in the
first game) and sends the challenger back. The next game (`nextRound`, any
player or the host, `{ round }` against a double tap) is seated by
`duelSeatNext`: the champion against the first in line, who moves first; the
same two alone in the room swap who goes first; no champion (they left), the
first two in line. The line is the old line plus anyone who has joined since,
in room order (`duelWaiting`), so a latecomer needs no hook - they are in line,
and `lateJoin: true` shows them the board meanwhile. `duelRoomNext` in
`JS_RoomConnect4.html` mirrors `duelSeatNext` to say "Next: A vs B" on the
result card: keep the two in step. A seated player who leaves mid-game loses by
forfeit (`duelPlayerLeft`: the other scores), and the next game seats whoever
is next. With fewer than two in the room there is no next game, and the card
says it is waiting for someone to join. The host picks 4 or 5 in a row, or the
board size, in the lobby - the same choice as the one-phone setup, kept in
`appState`. A turn is `turn_up` in `roomTurnOf`. The TV is the room's one
voice: with a screen in the room only the screen knocks, scratches and pops
(`duelRoomLoud`); the winner's own phone and the TV get the confetti.

**Your move is drawn as your finger lifts, not when the server answers.**
The owner saw it in a room (21 Sep 2026): "a disc appears falling, disappears,
then another one drops" - the aim disc faded on letting go, and the real disc
fell a round trip later from the top. On one phone the board is redrawn in
the same event, so the aim disc turns straight into the falling one. In a
room `duelRoomSend` now takes an `early` step: the phone plays the move on a
copy with the very rules the server uses (`c4Play`, `dotsPlay`), puts that
board in place of the one on screen and starts its motion (`c4RoomDropEarly`,
`dotsRoomDrawEarly`, through `duelRoomDrawEarly`), remembering the move's key
and when it started (`duelRoomLocal.early`). When the server's board comes
back, `c4AfterPaint` / `dotsAfterPaint` get that as `o.early` and start the
same animations part-way (`currentTime`), so the fall, the line and the boxes
carry on with no jump, and the knock plays once. If the server's answer
arrives and nothing claimed the early board (`duelRoomEarlyFor`), the move was
refused, and the room's own board is drawn back. Watchers and the TV are
unchanged: they only ever see the server's board. Measured with 250ms of
network delay: the disc starts falling at the lift instead of 260ms later.

**Layout** (Style.html sections 18 and 19): upright, the pills and a result
card sit above the board and the rest follows it (`.duel-layout`, with the
side `display: contents`); on a phone held sideways and on any screen at least
900 wide the board sits beside its side column, sized off `--app-h` and the
board's own `--duel-aspect` (width over height, the ghost row included) so it
never needs scrolling, and sticky, so a room's long side scrolls past it. The
TV puts the board on one side and the pills, the status, the result and the
line on the other (`.duel-tv`). Both boards carry `dir="ltr"` and are placed in
their own left-to-right terms; the piece colours are tokens (`--c4-red`,
`--c4-yellow`, `--c4-board`, `--dots-c1`, `--dots-c2`, `--dots-dot`,
`--dots-guide`), the same in both themes except the dots and the guides, and
the Connect 4 holes are the page ground (`--bg`), so they go dark with the
theme while the board stays blue.

**إكس أو in rooms** (23 Sep 2026) is the third duel of `RoomDuels.js`
(`DUEL_KINDS.xo`, `xoRoomAction`), with its rules in `TicTacToe.js` - the one
file the one-phone game (`JS_XO.html`), the room's phones (`JS_RoomXO.html`)
and the Worker all judge a mark with (`xoMark`, `xoWinner`). The grid is
`shared.cells`, not `board` - `board` is every duel's scoreboard (*Traps*).
Seat 0 is X and moves first; the lobby's switch is the one-phone game's
"3 marks only" (`three`, remembered as `appState.xo.three`), and a game keeps
the rule it was dealt (`rule3`, `order` oldest first). The phone draws the
one-phone game's `.xo-board` between the duels' pills: a mark lands with a
bounce, the one it took off fades where it stood, the line lights one square
at a time, your own mark lands as your finger lifts (`duelRoomSend`'s early
step), and the oldest mark is faded only on its owner's phone, on their turn.
The setup screen gained the one phone / own phones switch.

### The exit on one phone (1 Oct 2026)

On one phone (`paintConnect4`, `paintDots`) «خروج» is a small quiet button
(`.play-exit`) in the bar, and upright the bar sits at the foot of the screen
(`.play-foot`; `notes/games/solo.md`, *The bar of the solo games*). إكس أو is not
part of this change.

**إكس أو on one phone, in the app's look** (1 Oct 2026, from the owner's
before/after sheet): `paintXO` draws one card (`.xo-solo`, `.xo-solo__card`):
the duels' pills on top (`duelPillsHtml` / `duelPillsAfter` from
`JS_Connect4.html`, already in the xo chunk's reach since the room's XO uses
them; «أنت» / «الموبايل», or «لاعب 1» / «لاعب 2», the draws in the middle),
the board as a 3×3 grid of thin lines (`.xo-board--lines`: each square draws
the line after it and under it, so the room's `.duel .xo-board` is untouched),
✕ in `--team-blue-ink` and ◯ in `--team-red-ink` (`XO_GLYPH`, `xoGlyph`; the
state still says `X` / `O`), and «الدور عليك: ✕» under it (`xo_turn_you`,
`xo_turn_of`). A new mark lands and the winning line lights on the mark
(`.xo-cell__mark`, `motionFirst('xo1|' + seq)`), so the lines hold still. The
bar is «رجّع» and «خروج» as a quiet pair (`.talk__pair`), with «جولة جديدة»
above it once a round is over. **«رجّع» is new**: every move saves a snapshot
(`xoSnapshot`, `x.hist`, at most 60, kept in `appState.xo` so a reload keeps
it); `xoUndo` goes back one move with two on one phone, and to your last turn
against the phone (your move and its answer), 3 marks only included (the
snapshot holds `order`). It is greyed with nothing to take back and gone once
the round is decided (the tally isn't taken back). On a phone on its side and
from 900px the card opens up: the board in a card of its own, the pills, the
turn and the bar in a column beside it.

**The opponent belongs to the game** (the audit of 1 Oct 2026): changing «الموبايل / صاحبك»
on كونكت ٤'s or نقط ومربعات's setup while a game is left in the middle ends that game (its
Continue goes), so the phone never takes a friend's seat.

**The pills' memory is the pair's (the review of 1 Oct 2026).** `duelPillsAfter` in a room is keyed by `duelRoomPillKey(prefix, state)`: the room and the two seated ids, so the next in line's pill never counts up from the score of whoever sat there before (كونكت ٤, نقط ومربعات, إكس أو, and خمّن مين and حرب السفن, which share it).

## History

The day-by-day log of the work on this game is in `notes/log.md` (search it for the game's name); a new entry goes there, and anything that changes how the game works goes in this file.
