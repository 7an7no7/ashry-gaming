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

**One copy of the rules.** `Connect4.js` and `DotsBoxes.js` (in `games/connect4/`, `games/dots/`) hold a
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

**Layout** (sections 18 and 19, `Style_Cards.html`): upright, the pills and a result
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

### The move made for you, and «خسران غياب» (the review of 1 Oct 2026)

**One thing to do is done for you** (the owner's rule; it used to say "the duels register
nothing"). `ROOM_FORCED_GAMES.connect4 / dots / xo` (`duelForced` in `RoomDuels.js`) play,
after the usual beat (`ROOM_FORCED_DELAY_MS`), the only move of the seat to move: كونكت ٤'s
one open column (`c4OnlyMove`), إكس أو's one empty square (`xoOnlyMove`; never with 3 marks
only, which always leaves three), and نقط ومربعات's last line (`dotsOnlyMove`) - **never when
that move wins**, which stays the player's own tap (a dots last line "wins" when the mover
ends with more boxes). The helpers live in the shared rule files, so the phone asks the
same question: `duelRoomOnly` turns «دورك» into `duel_auto_c4 / _dots / _xo`. In a
tournament the hook looks at every match being played (the first with such a move; its
payload carries `match` and `mg`).

**«خسران غياب».** A seated phone gone `DUEL_AWAY_MS` (60 s) **on its turn** loses this game
(`reason: 'away'`), exactly as a loss on the board: the other scores, the loser goes to the
back of the line and stays in the room; in a tournament it is that game lost (the match's
reason `away`). It is the server's clock: `duelAwayDeadline` = `max(room.lastSeen[pid],
shared.turnAt) + 60 s` (`turnAt` is stamped at every deal and move), in `gameDeadline` /
`gameTimeout` and in `tourDuelKind`'s `deadline` / `timeout` (`tourRoomOf` and
`tourDeadline` pass `lastSeen` along). `room.lastSeen` is room.js's "gone since" - set when a
phone's last socket closes, when the alarm closes a silent one, and now also when a phone
on the HTTP fallback stops polling; `gone()` now re-arms the alarm for any player, not only
the host. `view.js` projects `away` (that time) on an offline player, so every other phone
and the TV draw a counting chip under the status (`duelRoomAwayHtml`, `duelRoomAwayTick`,
`.duel-away`; part of every duel signature), and the result says «خسران غياب»
(`duel_away_lost`, the tournament's badge too). A phone back in time removes `lastSeen`,
and with it the clock. Limitation: a socket that is open but silent counts as gone only
once the alarm closes it (its `lastSeen` is then backdated to when it was last heard), so
such a phone can lose with little or no count shown.

Tests: `rules.mjs`, "duels:" (forced, near the other games' forced moves), "duel away:" (in
the duels-in-rooms block) and "tournament away:".

## كونكت ٤ team against team, «أحمر ضد أصفر»: built 2 Oct 2026

Picked from the ideas page of 2 Oct 2026 (https://claude.ai/artifact/7Mhgw1ePSi3GhgEvDcSHxz, idea 350) and every rule asked. The owner's spec:

- **(350) كونكت ٤, team against team («أحمر ضد أصفر»)**:
  - **A lobby switch «فرق» from 4 people, off by default**; winner-stays and the tournament stay as they are.
  - **Everyone picks a side** (أحمر / أصفر); Start needs at least one on each side, lopsided allowed.
  - **A relay**: team members drop the team's disc in turn, one by one; the one whose turn it is decides, the rest may shout.
  - **20 s a turn**; when it runs out the app drops in a column that doesn't hand the other team a win, and says so.


**How it is built.** The rules are at the end of `RoomDuels.js` (`c4tAction`, called first thing by `duelAction` for connect4, so it is ahead of the tournament and winner stays). In the lobby the host's `teams { on }` and everyone's `side { side: 0 | 1 | null, playerId? }` (a player their own; the host anyone, a TV host included) live in `shared.lobby = { teams, sides }`; `start` with the switch on deals teams (`c4tStart`) whatever the start payload says (the tournament's `tournament: true` is ignored). The game is `shared.teamMode` with `teams` ([[red ids in relay order], [yellow ids]]: red is team 0 and disc 1), `turn` (the team), `relay` (each team's next member, counted on), `upId` and `endsAt` (the member up and their 20 s, `C4T_TURN_MS`), `starts`, `teamWins`, `auto` (the disc the clock dropped: `{ team, pid, col, moves }`, kept until a person drops one), `result { winner, draw, reason: line | full | left }`, and the board fields of `DUEL_KINDS.connect4` (`last` also carries `pid`). There is no `shared.seats` in teams, so `nightPlayedIds` reads the teams and the winner-stays helpers stay out of it. The server's clock: `c4tDeadline` / `c4tTimeout` (in `gameDeadline` / `gameTimeout` ahead of the duels' «خسران غياب», with `C4T_GRACE_MS` 800 ms after the phones reach 0) drops `c4SafeCol` (`Connect4.js`): a random column that doesn't hand the other side a win on its next disc and doesn't win either; failing that a winning one; failing that any. The one column left that doesn't win is dropped for the member up after the usual beat (`c4tForced` through `duelForced`). «ماتش كمان» (`nextRound`, anyone, `{ round }`): `c4tNextTeams` keeps who is still here, puts latecomers on the smaller side and never leaves a side empty, and the other team starts. Leaving (`c4tPlayerLeft`, from `duelPlayerLeft`): off the team, the relay index kept on the next member, a fresh 20 s if it was their turn; a team left with nobody loses (`reason: 'left'`). The night: `PROGRAM_TEAMS.connect4` (`c4TeamPlaces`) puts the team with more wins first, every member sharing the place (5 / 3), both first when level; each member's wins are `scores` / `board`. Sides are remembered on the room (`room._c4Sides`) and come back the next time teams are switched on.

**On the page** (the end of `JS_RoomConnect4.html`, its words in `C4T_TEXT` / `c4tT`, not the shell's `TRANSLATIONS`): the lobby's card (`c4tLobbyHtml`: the host's switch from four people, the hint, «اختار فريقك» as a segmented pair on every phone, the two sides and «لسه ماختاروش» as boxes - a tap on a name moves that person for the host); the lobby's options are never folded while teams are on (`lobbyUnfolded`, read by `lobbyOptionsFold` in `JS_Room.html`), the tournament's switch hides (`tourHidden`, read by `tourLobbyHtml`), Start waits with a word (`startBlock`: fewer than four, or a side nobody picked), and a TV that isn't the host shows the sides (`tvLobbyPlayers`). In the game (`c4tRender`, `TV_GAMES.connect4` through `c4tTvFrame` / `c4tTvAfter`): the duels' pills as the two teams (their wins, who drops next), the status («دورك! نزّل قرص الأحمر» / «الدور على X (الأصفر)») with the turn's clock (`c4tClockTick`, by `roomServerNow()`, ticking the last five seconds on the phone up, stopped through `onRoomClocksReset`), the clock's note (`c4tAutoHtml`), the relay as two boxes with the member up lit (`c4tRelayHtml`, `.c4t-*` in section 18 of `Style_Cards.html`), the same disc fall, early drop and lit line as winner stays (`c4AfterPaint`, `duelRoomSend`), and at the end a two-step podium of the teams (`c4tPodiumHtml`, the app's `.podium` and its cheerers), the winners' names, who starts next, «ماتش كمان» (anyone) and «لعبة تانية» (the host); confetti on the winning team's phones and the TV (`c4tCheer`). «دورك!» is `roomTurnOf`'s connect4 case (`s.upId`).

**Decided here (open to change):**
- Someone who hasn't picked a side when Start is pressed goes to the smaller side (a coin on a tie); the host may move anyone in the lobby.
- Each team's relay order is drawn at the start and kept; the relay carries on into the next game; the team that started goes second next game; the first game's starting team is random.
- The clock never takes a win for the team that ran out of time unless every other column hands the other team the win; among the safe columns it picks at random (no strategy given away).
- The phones' clocks reach 0 and the server drops 0.8 s later.
- Latecomers watch the game and join the smaller side at «ماتش كمان»; a side left empty there takes one member of the other side at random; with one person left there is no next game (the host's «لعبة تانية»).
- Computer players sit teams out (the duels have none in rooms anyway); a team game needs four people at the start, then plays on with fewer.
- No «خسران غياب» in teams: the clock plays for a phone that is away.
- The night: the team with more wins across the games first (5 each), the other second (3 each); level, everyone first.

Tests: `rules.mjs` («c4 teams:», 27 checks: the switch and sides, the deal, the relay, the clock's disc over 60 random boards, a win, «ماتش كمان», leaving, the night, winner stays untouched, fewer than four, the forced column), `leaks.mjs` (the connect4 driver plays a team game, half its discs by the clock), `play-all.mjs --only=c4teams` (sides on each phone and the TV, a relay, a real 20 s time-out, a win, the night by team), and the screen test's rooms part (`connect4 teams:` the switch, every phone's side, the relay drawn on five phones and the TV).

## «إكس أو الكبير»: answered, not built yet (the owner, 2 Oct 2026)

Picked from the ideas page of 2 Oct 2026 (https://claude.ai/artifact/7Mhgw1ePSi3GhgEvDcSHxz, idea 361) and every rule asked.

- **(361) «إكس أو الكبير», nine boards in one**:
- **(361) «إكس أو الكبير», nine boards in one** - **built 2 Oct 2026** (below):
  - The square you play sends your opponent to that small board; **sent to a board already won or full, they may play anywhere** (every open board lit).
  - **Win three small boards in a row**; a drawn small board counts for nobody; if no line is possible any more, the most boards won wins, equal is a draw.
  - **A size choice «المقاس: عادي / كبير»** everywhere X-O is: one phone, rooms with winner-stays and the tournament, the TV; computer players easy and hard. The 3-marks switch stays for the normal size only.
  - **No move clock** (a thinking game, like normal X-O).
  - **The look: «تسع كروت»** (look أ of the owner's sheet, `scratchpad/sheets/xo-big.html`): nine separate small boards as cards; the board you're sent to grows a little and lights in the screen's accent while the rest fade; «play anywhere» gives every open board a dashed pulsing outline; a won board gets a big stamped ✕ / ◯; the mark is drawn with a pen stroke; the status line names the place you were sent («فوق يمين»…); the TV: the pills on one side, the boards in the middle, what is happening on the other.

#### «إكس أو الكبير», as built (2 Oct 2026)

**One copy of the rules**, the bottom of `TicTacToe.js` (the page's one phone and room phones, and the Worker): a big game is `cells` (81, board b's square i at `b * 9 + i`, boards and squares both 0-2 the top row, left to right), `minis` (each board `''` open, `'X'` / `'O'` won, `'D'` full with no line) and `send` (the board to play in, -1 anywhere). `xoBigMark(g, at, mark)` plays a square or returns null (taken, on a decided board, or not the board sent to) and says what it decided (`took`); the square's place is the next `send`, -1 when that board is decided. `xoBigWinner(minis)` is three boards in a row (`{ mark, line }`), or once neither side can still make a line of boards (`xoBigCanLine`: a line with no board of the other side's or drawn) the most boards (`{ mark: 'X' | 'O' | 'D', boards: true }`); `xoBigLegal`, `xoBigCount`, `xoBigOnlyMove` (the one square left, played for them in a room after the beat - never when it takes a board or the game, a drawn board that ends the game on boards won included).

**The phone as a player** (`xoBigBestMove(g, mark, level, opt)`): it always takes the game in one move; on an empty board it opens in the middle board's middle or a corner of it. Hard: negamax with alpha-beta over the legal squares ordered by a quick look (a board taken first, a send to a decided board - which lets the other side play anywhere - last), deepened a ply at a time until `XOB_BUDGET_MS` (250ms) or `XOB_MAX_NODES` (60,000 nodes: the duels' ceiling, so a clock standing still in a test can't hold it); its judgement (`xoBigJudge`) gives each line of boards the product of the chances of each of its boards (won 1, lost or drawn 0, open 0.1-0.8 by the lines already on their way in it), plus the boards won (the "most boards" end), plus a little for the side that may play anywhere. Easy plays at random 40% of the time and otherwise looks one move ahead. Simulated: hard beat random play 10 of 10 and easy 10 of 10, easy beat random play 18 of 20, every move legal, the slowest 254ms (rules.mjs: 6 of 6 with a 25ms budget).

**On one phone** (`JS_XO.html`): «المقاس» is `appState.xo.size` ('normal' | 'big', the setup's `#xo-size`, its labels painted by `paintXOSetup` from the chunk's text); a round keeps the size it was dealt (`x.big`, as `x.rule3`), so the board is `x.board` (81) with `x.minis`, `x.send`, and `x.took` (the board the last move decided, for the line under the turn). The 3-marks field is hidden while the size is big and `x.rule3` is off for a big round. `xoPlace` hands a big round to `xoBigPlace`; `paintXO` to `paintXOBig` (the same card as the normal size: the pills with «لوحات N» under each name, the turn, the line of where you were sent, the nine boards, «رجّع» and «خروج»). «رجّع» works the same (the snapshot keeps `minis` and `send`); a reload comes back to the board, the phone's move included (`restoreXO`).

**The board** (`xoBigBoardHtml(g, o)`, JS_XO.html, used by every screen): `.xob` with nine `.xob-b` cards; `has-target` fades every board but the `is-target` one (scaled 1.04, accent border and tint); `is-any` gives every `is-open` board a dashed accent border and a soft glow (`::before`) that pulses; a won board has its squares faded and a big `.xob-stamp` (the mark, landing with a spin, `xob-stamp`); the winning line of boards is `is-win` and lights one after another (`xo-win`, `--k`). Marks are SVG pen strokes (`XOB_PEN`, `pathLength="100"`): a new one draws its dash from nothing (`xob-pen`, the second stroke of ✕ a beat later), so with no motion it is simply there. Each moment once (`motionFirst`: `xob1|seq` on one phone, the room's move key in a room). The line under the turn (`xoBigWhereHtml`): «◯ كسب لوحة فوق يمين!» / «لوحة … اتملت تعادل» for the move just made, then «اتبعت للوحة فوق يمين» or «العب في أي لوحة منورة» (accent). Places are named as the board is seen (it is `dir="ltr"`: board 0 is فوق شمال / top-left). CSS: the «إكس أو الكبير» block after the one-phone X-O in `Style.html`.

**In rooms** (`DUEL_KINDS.xo`, RoomDuels.js): the lobby's «المقاس» is `size` in the start payload (`setXORoomSize`, remembered as `appState.xo.size`; the rules field shows only for the normal size, inside the same card: `duelLobbyHtml` takes a second field, `more`); `deal` sets `big` and the big game's `cells`, `minis`, `send`, with `rule3` off; `move` judges with `xoBigMark` (refused off the board sent to: «العب في اللوحة اللي اتبعتلها»), `last` carries `took`, and the game ends on a line of boards (`reason: 'line'`, `win` the three boards) or on the most boards (`reason: 'boards'`, a draw when equal: the result line says «لوحات أكتر» / the even-boards line). Winner stays and the next game keep the size; the tournament carries it in `settings` (`tourDuelKind`'s `settingsOf`), and a drawn match is replayed as every duel's. The phone (`JS_RoomXO.html`) draws the same board (`xoRoomBoardHtml` hands a big state to `xoBigBoardHtml`, tap `xoRoomTap`, checked against `xoBigLegal` first), your own mark drawn as your finger lifts (`xoRoomEarly` plays it on a copy with `xoBigMark`), the pills with «لوحات N», the place line under the status (`xoRoomWhereHtml`); `duelRoomOnly` asks `xoBigOnlyMove`. The TV (`TV_GAMES.xo`, `.xob-tv`): the pills and «المقاس: كبير · ٣ لوحات على خط تكسب» in one column, the boards in the middle, the place line, the status and the result in the other. The tournament's live cards draw the big board small (`.tour-mini__board .xob`). Nothing in it is secret; the leak check plays a big game and its next (`xo:big` in `VARIANT_DRIVERS`).

**Text**: the big board's lines are `XOB_TEXT` in JS_XO.html (the chunk), read by `xoBigText()`; and the X-O lines only this chunk reads (`xo_three_play`, `xo_player`, `xo_draw`, `xo_turn_you`, `xo_turn_of`, `xo_undo`, `xo_next_round`, `xo_rule_*`) moved out of `TRANSLATIONS` into `XO_TR` (read through `xoTr()`, TRANSLATIONS with these on top), and the unused `xo_turn` went: the shell was over its 710 KB budget with this work (notes/lazy-load.md). The help (`GAME_RULES.xo`, both languages) has «🔲 المقاس الكبير».

**Decided here (open to change):**
- A move that **takes a board** is never played for the player, like a winning move (the one-square-left rule).
- The **places are named as the board is seen**: the board is drawn left to right in both languages, so board 0 is «فوق شمال» / "top-left" (the sheet named it «فوق يمين», drawn right to left).
- **Easy** plays at random 40% of the time and otherwise looks one move ahead; it always takes the game in one move. **Hard** looks as deep as 250ms and 60,000 positions allow.
- On one phone **the size belongs to the round**: changing it on the setup changes the next round, never this one (as the 3-marks switch).
- **«رجّع»** works on the big board too (one move with a friend, your move and its answer against the phone).
- The ✕ / ◯ colours are the ones X-O already uses: on one phone the team blue and red ink, in a room the accent and danger ink.
- The marks on the big board are a pen stroke on one phone too (the normal size keeps its glyphs).
- The last square played is tinted (`is-last`), so the table sees where the send came from.
- **The TV tournament's small live boards** (2 Oct 2026): a big game's mini gets its own box
  (`tour-mini__board--big`, `TOUR_CLIENT.xo.mini`: 34vmin, 22vmin from five matches) with square
  cells (a small radius, thicker pen strokes), the nine boards on their grey card, the sent-to board
  outlined but not scaled, the others only a little faded and no pulsing halo - the squares used to
  be round dots too small for a mark.

Tests: `rules.mjs` "xo big" (the rules, the phone's player, a room, the forced move, a big tournament), `leaks.mjs` `xo:big`, `play-all.mjs` (segment `duels`: a big game in winner stays and a big tournament of four).

## The ideas of 7 Oct 2026, second batch (the owner's picks): built

Picked from the ideas page of 7 Oct 2026 (round two); the owner asked no extra rule for these: "build as described, choose simple family-friendly details".

- **(1021) كونكت ٤ «صدّة!», the block celebrated.** A disc that lands on the square where the other side would have made its line next (and doesn't win itself) is a block: `c4BlocksAt(board, col, p)` in `Connect4.js` (read before the disc is played). Once the disc has landed, a gloved 🧤 flies from the blocker's pill to it (`flyEmoji`) inside a «صدّة!» word that pops over the disc and goes (`duelPop`, fixed over the page so a room's redraw doesn't cut it), with a thud (`duelSound('block')`) and a light buzz - `c4BlockFx` in `JS_Connect4.html`, once per drop key (`duelOnce('blk|' + key)`, marked seen on first sight). One phone: `s.last.block`. Rooms: `DUEL_KINDS.connect4.move` sets `shared.last.block`; `duelCountBlock` counts `shared.blocks { pid: n }` for whoever dropped it (winner stays and teams; a disc the clock drops in teams is nobody's block), kept across the room's games until a new start; your own early drop plays it at once (`c4RoomDropEarly`, `c4tDrop`). **Decided here:** "named at the end of a room night" is the result card after every game - «🧤 أحسن صدّاد · منى 3» (`c4BestBlockerHtml`, the app's `renderAward`), on the phone and the TV, winner stays and teams (not inside a tournament, whose matches keep no count); the most blocks so far, the first in the room's order on a tie; the TV and phones' signatures carry `blocks`. Help: a tip line in 💡.
- **(1028) نقط ومربعات «سر اللعبة», the chain tip.** In 📘 (GAME_RULES.dots, both languages): «🔑 سر اللعبة» - «اللي يفتح السلسلة الطويلة الأول بيخسر» and four small drawn frames (inline SVG, `.dots-tip`, `.dt-*` in section 19 of `Style_Cards.html`): two chains left, open the short one, the rival takes it and must open the long one, you take all three. On one phone, after the first game the **hard** phone wins against you, the same frames come once as a card under the result (`dotsTipDue`, `dotsTipCardHtml` - read out of the Help's markup through `DOMParser`, so the drawing has one copy - and «فهمت», `dotsTipClose`); `appState.dots.tipSeen` / `tipGame` keep it to that one game (a reload keeps it until «فهمت» or the next game), never again after.
- **(1029) نقط ومربعات, the run counter «×5».** A run is the boxes one player takes move after move (`dotsChainStep(chain, seat, took, over)` in `DotsBoxes.js`, shared): `shared.chain { seat, n }` on the server, `last.run` (the run after this move) and `last.runEnd` (a run this move closed: a line that took nothing, or the game's last box); one phone keeps the same in `appState.dots`. From two boxes a badge «×2», «×3»… sits on the board's corner in the taker's colour (`.dots-combo`, drawn by `dotsBoardHtml`), counting up (`countUp`) and popping as each box lands, each box's pop a step higher (`duelSound('combo', n)`); a run of **3 or more** (`DOTS_CHAIN_STAMP`) ends with «🔗 سلسلة 5!» stamped over the board (`duelPop`, once per line key, the result's reveal waiting for it). One phone, rooms, the TV and the tournament's boards alike.
- **(1040) «إكس أو الكبير», the send arrow.** After a move, a short arrow (in the screen's accent) travels from the square just played to the board it sends to (`xoBigSendArrow` in `JS_XO.html`: transform and opacity only, fixed over the page, once per move key `xobarrow|…`, nothing with the motion off); sent to the board it was played in, that board rings instead. One phone (`paintXOBig`), a room's phones (`xoRoomAfter`, and your own move as your finger lifts in `xoRoomEarly`) and the TV. The place line already names the board; for this phone's first three big games (`XOB_TEACH_GAMES`, counted per game in `appState.xo.bigTaught` / `bigTaughtKey`) a line under it says the rule: «المربع اللي بتلعبه بيبعت اللي قصادك للوحة اللي في نفس مكانه، والسهم بيوريك فين.» (`xoBigTeachHtml`, `XOB_TEXT.teach`; not on the TV).

Tests: `rules.mjs` («c4 block:», «dots run:»); the robots' connect4, c4teams, dots and duels segments pass with the new fields.

## The ideas of 7 Oct 2026, third batch (the owner's picks): built

Picked from the ideas page of 7 Oct 2026 (round three); the owner asked no extra rule unless said: "build as described, choose simple family-friendly details".

- **1022 كونكت ٤ and 1031 نقط ومربعات: a think clock in winner stays.** The host's lobby choice, **off by default**: كونكت ٤ 15 or 30 seconds a disc, نقط ومربعات 20 or 40 a line (`DUEL_THINK` in Duels.js, read by both sides; `duelThinkPick` takes only those). `shared.think` counts from `turnAt`; the server's clock is `duelThinkDeadline` inside `duelAwayDeadline` / `duelAwayTimeout` (RoomDuels.js; 0.8 s of grace): at 0 the server plays for the seat up (`DUEL_KINDS.<kind>.auto`: كونكت ٤ `c4SafeCol`, a column that hands the other side no win; نقط ومربعات a random line from `dotsSafe` - no box gets a third side - or, with none left, `dotsCheapest`), marks it `last.auto` (never counted a «صدّة!») and moves the turn on with a fresh clock. Not in a tournament (a match has no `line`) nor كونكت ٤'s teams (their own 20 s). On the phones and the TV: the lobby row «⏱️ وقت التفكير» (`duelThinkLobbyHtml`, remembered on the host's phone, `recallOptions('duelThink_<game>')`, sent in the start payload), a badge with the seconds left beside the status (`duelThinkHtml`, `duelThinkTick` by the server's time, a tick on the mover's phone in the last five, red then), and «⏱️ الوقت خلص، والتطبيق لعب بدل …» after the clock's move; the signatures carry `duelThinkAt`. Help: a line in each game's rooms rules.
  - The audit of 7 Oct 2026 (B1): a seat whose phone has been gone `DUEL_AWAY_MS` still loses by «خسران غياب» with the think clock on: at the first think timeout once it has been gone a minute (`duelAwayTimeout` reads `lastSeen`), the server no longer plays the whole game for it; a seat that is here is still moved for.
- **1026 كونكت ٤ on one phone: who starts the next game.** The result says «الماتش الجاي يبدأ: هند» with her disc (`c4_next_starts`, `.c4-next`) and her pill pulses (`.duel-pill.is-next`, `duelNextPulse`; a ring with motion off). The rule was already so (whoever went second starts); only the saying is new.

## History

The day-by-day log of the work on this game is in `notes/log.md` (search it for the game's name); a new entry goes there, and anything that changes how the game works goes in this file.
- 6 Oct 2026 (the audit): winner stays banks the night for everyone who sat down this session (`s.sat`, kept by `duelSeatNext` for every duel on the duels' seats - خمّن مين, حرب السفن and شطرنج too), not only the pair seated when the room moves on.
