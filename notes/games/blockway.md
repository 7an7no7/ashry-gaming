# سد الطريق — Block the Way

Quoridor rebuilt our way (the owner asked after seeing wrongway.app, 9 Oct 2026). Rooms and the
TV only. Its own card (its own name), in the duels' family: its one-on-one way IS a duel of
`RoomDuels.js` (winner stays, the tournament), beside كونكت ٤ and نقط ومربعات.

## The owner's spec (fixed, notes/ideas.md, "New games of 9 Oct 2026")

- Rooms and the TV only, no one-phone way.
- A 9×9 board. A turn is one step or one wall; a wall is two squares long. 10 walls each, 5 each
  with 4 players.
- A wall may never shut anyone in completely: a way home must always stay open (the server checks
  by a path search; the phone shows the ghost wall red and won't put it).
- Face to face: jump straight over; a wall behind the other piece: a step diagonally to either side.
- Ways: **the duel** (one against one, winner stays on, the tournament from 4 people, like the other
  duels); **4 players** (each races to the opposite side; the first to arrive wins and the game
  ends; the night's points by how close the others were); **2 against 2** (partners sit opposite;
  either one arriving wins for the team).
- No clock by default; the host may set 15 or 30 s a move: when it runs out, a random legal step
  (the server's clock).
- Computer players can fill a room, three levels (سهل / وسط / صعب), the host picks.
- A wall is put by tapping a groove (a ghost wall), tapping the same place again turns it, «حطّه»
  puts it; a wall that would shut someone in shows red and can't be put.
- The look: أ «الحارة من فوق» (the paving board from above, wooden fences with a pin in the
  placer's colour, the duel pills with steps home and walls left, the tray of walls) with ج's line
  under the board saying how a ghost wall changes each way home («السور ده: منى 7 ← 9 · إنت 9»).
  Sheet: https://claude.ai/artifact/YXJKmLvyWkko2zQGSYFwFq, mock `notes/archive/sheets/blockway-looks.js.txt`.

### Decided while building (open to the owner)

- **Computer players' level is one lobby choice for all of them** («مستوى الكمبيوتر»: سهل / وسط /
  صعب, `shared.level`), with the one-button «+ 🤖» (`bots: { one: true }`): the engine's bots have
  two levels (easy / hard) and the game has three, so the engine was left alone.
- **Four on a board needs four seats**: with three people the host adds a computer player
  (Start says so). More than four in the room: four sit down - whoever waited last time first,
  then last game's seats best placed first, people before computer players - and the rest watch.
- **The colours**: the duel blue / pink; four on a board blue, pink, amber, green (bottom, left,
  top, right, the turn going round that way); two against two by side, «الأزرق» (bottom and top)
  and «الوردي» (left and right).
- **Each phone turns the board so its own piece starts at the bottom** (a quarter turn per seat);
  the TV and anyone watching see it as it is.
- **A tap on a square you can reach steps there; a tap anywhere else puts the ghost in the nearest
  groove** (the grooves are too thin to aim at on a phone), the side of the corner nearest the
  finger deciding its direction.
- **Someone leaving a four-seat game**: their piece leaves the board (their walls stay); the last
  one (or the last side) on the board wins. Away a minute on their turn (`DUEL_AWAY_MS`): the server
  takes a random step for them each turn instead of ending the game. The duel keeps the duels' own
  rules (a forfeit, «خسران غياب»).
- **Places in four on a board**: the winner, then by steps home (walls only, pieces ignored), ties
  sharing a place; the result shows +5 / +3 / +2 / +1 for those places. Across several games in a
  row the board is wins (the night banks it), this game's place breaking a tie. Two against two:
  the winning side first, both partners (PROGRAM_TEAMS: the side with more wins, the last game's on
  a level).
- **One thing to do is done for you**: a step that is the only one, with no walls left, and that
  doesn't win - the server makes it after a beat (`ROOM_FORCED_GAMES.blockway`).

## How it is built

- `games/blockway/Blockway.js` - the board and its rules, shared by the page and the server (in
  `SHARED_LISTS` and `FILES`): `bwNewBoard`, `bwSteps` (steps, jumps, side steps), `bwDistMap` (a
  BFS from the goal side: steps home from every square), `bwStepsHome`, `bwWallCheck` (overlap,
  crossing, shut-in; returns each seat's steps home with the wall down - the ghost line),
  `bwPlay`; and the board turned for a phone (`bwTurnSq`, `bwTurnWall`, and back). A wall
  `{ r, c, o, by }` sits on the corner below-right of square (r, c), 'h' between rows r and r+1
  over columns c, c+1, 'v' between columns c and c+1 over rows r, r+1.
- `games/blockway/RoomBlockway.js` - the server. `DUEL_KINDS.blockway` (options: `think`, `level`;
  a move; `only`; `auto` the random step) and `TOUR_KINDS.blockway = tourDuelKind('blockway')`, so
  the duel and its tournament are the duels' own code; `DUEL_THINK.blockway` (Duels.js) is
  [0, 15, 30]. The four-seat ways (`shared.multi`, `way` 'four' | 'teams') keep the duel's shape
  (seats, turn, moves, turnAt, think, line: []) so the phones' clocks and chips read the same:
  `bwMultiStart`, `bwMultiDeal`, `bwMultiPlay`, `bwMultiEnd` (result.order with steps and places),
  `bwMultiLeft`, `bwMultiDeadline` / `bwMultiTimeout` (think clock and away), `bwMultiForced`.
  `ROOM_RULES.blockway` sends the four-seat ways to these and everything else to `duelAction`.
  `s.last` = { seat, kind, from, to, jump, wall, before, after, hit, auto }: each seat's steps home
  around the move, and the seat a wall cost most (the TV's line).
- Computer players (`ROOM_BOT_GAMES.blockway`, `bwAiMove`): سهل walks its shortest way, now and
  then wanders or drops a wall on someone's way; وسط walks, and fences off whoever is level with it
  or ahead when a wall beats its own step by one (the first 40 walls along their ways); صعب weighs
  every wall along every rival's shortest way by (nearest rival's steps − its own), up to
  `BW_AI_MAX_WALLS` walls and `BW_AI_BUDGET_MS` - the ceiling keeps it finite on a clock that
  stands still (traps: a search's ceiling) - and takes an even trade once a rival is 3 from home.
- `games/blockway/JS_RoomBlockway.html` - the phones and the TV. The duel uses the duels' pieces
  (JS_RoomConnect4.html: `duelPillsHtml`, `duelRoomOverHtml`, `duelRoomLineHtml`, `duelRoomSend`,
  the think and away chips, `duelRoomFirstSight`, `duelRoomCheer`, `duelTvSide`) around its own
  board (`bwBoardHtml`: absolutely placed squares, walls and pieces in %, `container-type` for the
  pins). The four-seat ways draw four chips (`bwChipsHtml`) and their own result (`bwOverHtml`: the
  first home crowned, the rows with steps and +points; on the TV a compact hero and `renderPodium`).
  Lobby: «طريقة اللعب», «وقت الدور», «مستوى الكمبيوتر» (remembered, `recallOptions('blockway')` and
  `duelThink_blockway`); the tournament's switch only for the duel (`tourOff`); Start greyed with a
  line when four are needed (`startBlock`). `TOUR_CLIENT.blockway.mini` and `tourWrap('blockway')`
  at the end (this chunk runs after the tournament's).
- Motion (`bwAfterPaint`, once per move by `motionFirst`): a wall drops into its groove with a thud
  ring and a knock; a piece slides from its square, or arcs over the piece it jumps; the winner is
  crowned on the board, its goal row lit, confetti on the winner's phones and the TV.
- The look's CSS is in the chunk (`bwStyle`, one `<style>` at the end of `<body>`); every class is
  the game's own (`bw-`), the colours declared once (`--bw-c0..3`, the stone, tiles and planks) for
  both themes.
- Its words and rules: `blockway.text.js`. A drawn icon (`art:blockway`, ICON_ART in JS_Core.html).
- Tests: `rooms-worker/test/rules.mjs` (jump, side step, overlap, shut-in, the turned board, the
  duel, the clock's step, four on a board and a leaver, two against two, a hard computer player on a
  frozen clock); `test/leaks.mjs` (`blockway`, `tour:blockway`: nothing is secret); `play-all.mjs`
  segment `blockway` (the duel and winner stays, four with a computer player, two against two, a
  tournament of four).
