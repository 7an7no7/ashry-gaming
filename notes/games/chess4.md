# شطرنج الأربعة (id `chess4`)

Moved from GEMINI.md on 30 Sep 2026. GEMINI.md keeps the rules that apply to every game and an index; this file keeps the detail, word for word.

## From GEMINI.md: The owner's specs, as built

- **شطرنج الأربعة (Four-Player Chess)** - the owner's decisions of 24 Sep
  2026, every rule asked first (`notes/BATCH5_RUNBOOK.md`), look أ «بطولة»
  picked from a design sheet of three (*شطرنج الأربعة*):
  - **Rooms only**, every player on their own phone, the TV optional.
  - **Two ways, a lobby choice: teams (the default) and everyone for
    themselves.** Teams: 2 against 2, partners opposite (red + yellow against
    blue + green); a team wins when **either** opponent is mated (or resigns,
    or runs out of time). Everyone for themselves: **chess.com's points** - a
    pawn 1, a knight 3, a bishop 5, a rook 5, a queen 9 (a promoted queen 1), a
    mate +20 to whoever's move gave it, a stalemated player out with +20 for
    themselves; **a player mated, stalemated, resigning or out of time is out,
    their pieces grey walls** (they neither move, attack nor can be taken); the
    game ends when one is left and the highest score wins (ties share it).
  - **Computer players, easy and hard**, fill the empty colours, so 1 to 3
    people can play.
  - **The look**: the 2D chess board's green `#769656` and cream `#eeeed2`, the
    four 3 × 3 corners cut away, the pieces in four bright colours - red
    `#d6453d`, blue `#3f73d6`, yellow `#e9b52a`, green `#35a35a`, each with a
    darker outline - grey `#9a9a9a` for a player out; red at the bottom, blue on
    the left, yellow at the top, green on the right; **on your phone the board
    turns so your colour is at the bottom** (the TV: red at the bottom).
  - Decided here, standard four-player chess as on chess.com (each in one
    place): the order red, blue, yellow, green, red first; pawns toward the far
    side, one or two from their first row, no en passant; **promotion to a
    queen on the 8th row from its side (everyone for themselves) or the 11th
    (teams)**; castling both ways, the usual conditions; check from any
    opponent, never a partner; **a mate or a stalemate is judged on the
    player's own turn** (someone left in check by one player's move still gets
    to answer it, so a king is never taken); in teams a player with no move and
    not in check passes (all four passing in a row is a draw); a clock off by
    default, 1, 3 or 5 minutes each plus 5 seconds a move; the host's "play
    for" a quiet phone (an easy computer move, marked); leaving: out (everyone
    for themselves), a computer player takes the seat (teams); the host seats
    everyone in a colour, bots fill the empty ones, play again keeps the table
    and turns it by one (so red, who starts, is someone else).
  - Decided while building (open to change, each in one place):
    - **The kings and queens stand as on the owner's sheet**: red Q g1 K h1,
      yellow K g14 Q h14, blue Q a7 K a8, green K n7 Q n8 - every king faces
      the queen across the board (`chess4StartBoard`).
    - **Fifty moves each with no capture or pawn move end the game** (everyone
      for themselves: the highest score wins; teams: a draw), and so does a
      game of 600 moves (`CHESS4_QUIET`, `CHESS4_MAX_PLIES`): whole games of
      easy computer players ran past 700.
    - **The points of a mate go to whoever's move gave the check** (for a
      discovered check, the player who moved), kept per king in `g.giver`;
      failing that, a player attacking the king.
    - **A player's first move is free on the clock** (the table finds its
      seats); after it the clock runs on their turn.
    - **A colour still empty at the start gets an easy computer player**, named
      in the host's language; a leaver's seat in teams gets a hard one, under
      their name.
    - **The TV shows the large 2D board, not 3D**: the chess 3D engine is built
      for 8 × 8 (its board texture, camera and picking), and a 14 × 14 3D board
      was more than this batch could do well.
    - **Each player's chip sits in the cut corner at their left hand** (the one
      at the bottom in the bottom-left, and round the board clockwise), so the
      board keeps the whole width.

### شطرنج الأربعة

The owner's rules are in *The owner's specs*. Rooms only: the game id is
`chess4` everywhere (`ROOM_GAME_IDS`, `room-chess4`, `ROOM_GAMES.chess4`,
`TV_GAMES.chess4`, the catalog, the help). `c4` is Connect 4's prefix, so the
rules are named `chess4` / `CHESS4_` and the page's code `ch4`.

- **`Chess4.js`** (shared, no DOM; inlined into the page through
  `SHARED_LISTS` and bundled into the Worker before `RoomGames.js`):
  - **A game** is one plain object (`board` 196 numbers, i = y × 14 + x from
    a1, 0 on a cut corner; a piece its kind 1-6 + 8 × its seat, + 32 for a
    queen that was a pawn; `turn`, `castle` two bits a seat, `out`, `why`,
    `points`, `giver`, `quiet`, `ply`, `passes`, `over`, `result`). Seats: 0
    red, 1 blue, 2 yellow, 3 green, which is the order of play; teams are
    `seat % 2`.
  - **Inside**, a mailbox of 18 × 18 (`chess4Pos`: two squares of border, the
    corners marked off), so no jump wraps an edge; `chess4Pseudo` the moves,
    `chess4Make` / `chess4Unmake`, `chess4Attacked(b, m, mask)` by any seats in
    a mask (`chess4Foes`: the other team, or everyone else; never an out
    player, whose pieces are walls that block but never attack and can't be
    taken - `chess4CanTake`), `chess4LegalPos`. Kings are never taken.
  - **`chess4Play(g, { from, to })`** plays the move of the player up (null if
    it isn't legal) and says what happened (`san`, `cap`, `pts`, `castle`,
    `promo`, `events`); `chess4Settle` then judges whoever is up: out players
    skipped, no move and in check is a mate (FFA: out and +20 to `giver`;
    teams: the other team wins), no move and not in check is a stalemate (FFA:
    out, +20 to themselves) or a pass (teams), the fifty-move rule and the
    600-move cap. `chess4Eliminate(g, seat, why)` is resigning, the clock and
    leaving (FFA: out and the turn moves on, judged again; teams: the loss).
    `resign { round }` carries the game its confirm was drawn for (`staleTap`,
    optional for older phones), so a confirm pressed after «play again» doesn't
    resign the new game. The phone's clock tick and the host's 40 s timer stop
    off the room screen (`ch4OnScreen`); drawing the screen starts them again.
  - **The computer** (`chess4BotMove(g, level, { nodes, rnd })`): easy is one
    move deep - a capture if there is one, bigger more likely, with chance in
    it; hard a paranoid alpha-beta (the bot, and in teams its partner, against
    everyone else) deepening a ply at a time up to a whole round of the table
    inside a node budget (`CHESS4_BOT_NODES`, 20,000; a node ceiling, never a
    clock), captures first; its judgement is material, the points (FFA),
    pieces left hanging (`chess4LeastAttacker`), development toward the middle,
    pawns on their way and the pawns round the king; it picks at random among
    moves within 8 centipawns of the best. Measured on this PC: about 11 ms a
    move, the worst about 30 ms.
- **`RoomChess4.js`** (bundled after `RoomChess.js`): `shared.lobby` holds the
  host's way to play, clock and colours (`options`, `seats { order, watch }`),
  so every phone sees them; `chess4LobbyOrder` fills the empty colours from the
  room (people first) and is mirrored on the page by `ch4RoomOrder`. `start`
  seats bots in any colour left empty; the game is `shared.g` with `seats`,
  `names`, `replaced`, `clock { left, at, moved }` (the server's time; the
  first move of each player free), `last`, `log` (the last 80: `mv` with the
  SAN, the squares, what was taken, the points, the castling rook, `auto`;
  `out`, `pass`, `mate`, `lost`, `bot`, `start`, `over`, each numbered), `turnSeq`
  (every move carries it as `seq`: a stale tap is dropped), `wins` and
  `board`. `skipTurn` (host) plays an easy move marked `auto: 'host'`;
  `resign`; `chess4Deadline` / `chess4Timeout` the flag; `chess4PlayerLeft`
  (FFA out; teams: a hard bot under the leaver's name takes the seat,
  `replaced`). Play again turns the table by one. `ROOM_BOT_GAMES.chess4`
  (max 4); no forced moves (a move is always a choice).
- **`JS_RoomChess4.html`** (section 36 of `Style.html`):
  - **The board** is a grid of 14 × 14 spans (the corners empty) with the
    pieces a layer over it, each placed by transform (`--x`, `--y`), turned by
    quarter turns so your colour is at the bottom (`ch4Cell`, `ch4SqAt`: seat
    = the number of turns; a watcher and the TV see red at the bottom). The
    squares use the chess board's own tokens (`--ch2-light`, `--ch2-dark`,
    `--ch2-last`, `--ch2-hint`, `--ch2-check`). The pieces are the chess set's
    drawings (`CH2_SHAPES` in `JS_Chess.html`) as a second set of `<symbol>`s,
    `ch4pc-{r,b,y,g,x}{kind}`, filled from the `--ch4-*` tokens (a gradient and
    an outline per colour, `x` grey).
  - **Playing**: a tap on your piece shows its moves (`ch4-hint` a dot,
    `ch4-ring` round a capture), a tap on a square plays; or drag. Your move is
    played on a copy with `chess4Play` and drawn at once (`ch4Local.early`);
    the server's log entry for it is then not slid again; refused, the room's
    board comes back.
  - **Motion**: every new log entry since the last drawn (`ch4Local.seen`)
    plays - a move slides 150 ms, a capture fades under it, a castling rook
    follows, a promotion pops, the points fly to the scorer's chip
    (`flyPoints`) and count up; a mate topples the king (it stays toppled),
    and a player out turns grey piece by piece from the king outward. A reload,
    a new game or the TV coming on draws the board as it is.
  - **The chips** sit in the cut corners (`ch4-corner--bl` for the one at the
    bottom, round the board clockwise), sized from the board (a size
    container), with the colour, the name, the points (FFA), the clock, a
    pulsing ring for the one to move, «برّه» and why for a player out, a gold
    ring for the winners.
  - The lobby is the four colours round a cross (`.ch4-seats`, laid out left
    to right in every language, like the board); the host taps two to swap, a
    watcher then a colour to seat them, ✕ to take someone off.
  - The end: a podium by points (FFA, `renderPodium`) or the winning team's
    banner, with confetti for the winners and on the TV.
  - Upright: the status, the board, resign / the host's "play for", the log,
    the room strip (the end card on top). A phone on its side and from 900 px:
    the board beside a column. The TV: the board as tall as the stage, the
    column (the sides, the status, the end, the log, the host's buttons)
    beside it.
- Tests: `rules.mjs` (the board and the start, the order, castling both ways
  and through an attacked square, promotion rows per mode and per colour,
  check from two players, a partner never checks, a mate judged on the turn
  with its +20, grey walls, stalemate out / pass, the points, teams won by
  either mate, resigning, the fifty-move rule, 80 whole bot games, the room:
  the lobby, bots in empty colours, turns, stale taps, the clock, "play for",
  resigning, leaving both ways, play again, six whole room games of bots);
  `leaks.mjs` (a game each way with two people and bots); `play-all.mjs`
  (`--only=chess4`: teams with two people, two bots and a TV, a leaver
  replaced, resigning, play again; FFA with one person and three bots on the
  clock).

### The review of 1 Oct 2026

- **Only computer players left** (`chess4BotsOnly`: every seat out or a bot): they move
  every `CHESS4_FAST_BOT_MS` (250 ms; `ROOM_BOT_GAMES.chess4.pending` returns that delay),
  the status says so (`ch4_bots_only`), and in everyone for themselves the host (or a
  stand-in while the host is away, `requireMoveOn`) has **«⏩ خلّصها»** on the phone and the
  TV: action `finish { round }` ends the game at once through `chess4End(g, 'finish')`,
  ranked by the points (`ch4_why_finish`). Before that it is refused («لسه فيه ناس بتلعب»).
- **The first move has 45 s** (with a clock only - without one nothing is timed): a seat's
  clock still starts after its first move, but `clock.first` (set by `chess4ClockTurn`,
  kept by `chess4RoomOut` like `at`) makes `chess4Deadline` look again after
  `CHESS4_FIRST_MS`, and `chess4Timeout` plays an easy move for them (`auto: 'time'`, the
  log's 🤖), their clock bank untouched. Every phone and the TV show the count beside the
  status (`ch4FirstHtml`, painted by `ch4PaintClocks`).
- **The magnifier** (24 px squares at 375): while a piece is carried, or a square is aimed
  at with one picked up, a round loupe above the finger (below it when there is no room,
  always on the screen) shows that part of the board at about 56 px a square, the square
  under the finger outlined - green where the piece can go - and the carried piece in the
  middle (`ch4LoupeShow / Move / Hide`, `.ch4-loupe`). It is a copy of the board taken as the
  finger goes down, fixed in `<body>`, sized `min(150px, 40% of the width and of the
  height)`, so it fits 375×667 and 667×375; only for a finger or pen, and only while a
  square is under 34 px (a laptop or TV never sees it). Letting go plays exactly as before.
- Tests: `rules.mjs`, "chess4 bots only:" and "chess4 first move:".

## History

The day-by-day log of the work on this game is in `notes/log.md` (search it for the game's name); a new entry goes there, and anything that changes how the game works goes in this file.
