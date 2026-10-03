# باغ هاوس (id `bughouse`)

Moved from GEMINI.md on 30 Sep 2026. GEMINI.md keeps the rules that apply to every game and an index; this file keeps the detail, word for word.

## From GEMINI.md: The owner's specs, as built

- **باغ هاوس (Bughouse)** - the owner's decision of 24 Sep 2026 (batch 4,
  Decision 3 of `notes/archive/plans/BATCH4_RUNBOOK.md`) (*باغ هاوس*):
  - **4 players on two boards**, partners on different boards with
    opposite colours (A White on board 1, their partner Black on board 2).
  - **What you capture goes to your partner's hand**; on your move you may
    **drop** a piece from your hand onto an empty square instead of moving -
    no pawn on the first or last row, a drop may give check or mate, **a
    promoted piece captured goes over as a pawn**.
  - **The clock is always on, 3+0 by default** (2+0 / 3+0 / 5+0); a flag
    loses for the team; **a mate on either board wins for that team**.
  - **Computer players fill empty seats**, easy and hard: a normal move
    choice plus sensible drops - a drop that mates first, otherwise a drop on
    a good square near the enemy king when there is something worth
    dropping.
  - **Both boards on every phone**: your own big, your partner's small beside
    or under it (a tap swaps the sizes); the TV shows both side by side.
  - Rooms only (each on their own phone, the TV optional).
  - Decided here (open to change, each in one place):
    - **The game ends on a mate only** (`chessBugStatus`): no repetition,
      fifty moves or "too little to mate" - a piece can always arrive. **No
      move and nothing to drop is not stalemate: the side waits** for its
      partner to send a piece, its clock running (chess.com's way). **A mate
      is judged with the hand as it is**: a piece that might arrive later
      doesn't save it (FICS's way).
    - **The clocks start together, 3 seconds after the deal**
      (`BUG_START_MS`), White to move on both boards; there is no free
      first move as in the chess room. A move reaching the server up to 0.6 s
      after the time ran out still counts (chess's `CHESS_GRACE_MS`); a flag
      always loses (no "can't mate, so a draw": pieces can be dropped). A
      flag that fell on the other board decides before any move or resign
      (`bughouseTimeout` first in `bugPlay`): the alarm can come a second late.
    - **Empty seats at the start get easy computer players** named from the
      host's phone (`botNames`); the host adds hard ones with the lobby's
      buttons. With more than four people the first four of a random order
      play and the rest watch (no computer players then).
    - **A leaver's board is played on by a hard computer player** for the
      rest of that game (`s.subs`, said on every screen), named after them
      with 🤖; it stays for play again like any computer player.
    - **Play again turns the partners round**: the first of the line keeps
      their place and the other three move on one, so three games in a row
      are the three pairings; with more than four, whoever watched plays
      first. A person who joined takes a computer player's seat.
    - **Resigning** loses for your team (a confirm first); **no draws** are
      offered. The host's "play for" on a quiet board plays the easy
      computer's move (40 seconds, or at once for a phone that's away).
    - **No forced moves**: a single legal move is never played for you (the
      chess rule).
    - Scores: each winner gets a point; the board is the room's scoreboard.
    - The TV draws both boards in 2D (chess's 3D view is one per page, and
      two boards would want two), team A at the bottom of both; a phone's big
      board is chess's own view (2D by default, 3D a tap away), the small one
      2D.
    - The home: **ورق وطاولة** (`group: 'table'`, a board game for four),
      teal, a drawn icon (two boards and a piece flying between them),
      `players: [1, 4]`; in the hub from one person (computer players).

### باغ هاوس

The owner's rules are in *The owner's specs*. Rooms only; the room's id and
the client's are both **`bughouse`** (`room-bughouse`, `ROOM_GAMES.bughouse`,
`TV_GAMES.bughouse`, the help entry).

- **`Chess.js`** (the end of the file, every name `chessBug` /
  `CHESS_BUG_`): a bughouse board is an ordinary game plus `hand` (`{ w: { q,
  r, b, n, p }, b: {…} }`) and `promoted` (the square indices of pieces
  that were pawns). `chessBugNew`, `chessBugClone`, `chessBugDrops` (every
  legal drop: an empty square, no pawn on rows 1 and 8, not leaving the king
  in check - so in check only a blocking drop), `chessBugLegal`,
  `chessBugStatus` (mate only; `stuck` for a side with nothing to do),
  `chessBugPlay` (a move or a drop `{ drop: 'n', to }`; the SAN `N@f3`,
  `P@e4`; the promoted marks travel with their piece; `info.gives` is what
  the capture sends - `'p'` for a promoted piece), `chessBugGive` (into the
  other board's hand, the other colour), `chessBugBotMove` (a drop that
  mates, then a move that mates - easy sees them 60% of the time - then,
  with a piece or two pawns in hand, a safe drop near the other king, a
  check counting for more; else `chessBestMove` at 1500 / depth 2 / 2,500
  positions for hard, 600 / depth 1 / 400 for easy: cheap enough for the
  server). Nothing above them changed: standard chess, Chess960 and every
  perft number are as they were (`rules.mjs` still runs them all).
- **`RoomBughouse.js`**: `shared` holds everything (nothing is hidden - the
  hands are on the table): `phase`, `round`, `settings.clock`, `seats`
  (four ids; team A is seats 0 and 3, team B 1 and 2), `names`, `subs`,
  `line`, `startAt`, `boards` (`{ g, moves, sans, last, clock }`; the clock
  is chess's shape `{ base, inc, left, at }`, read with `chessClockLeft`,
  its `at` set at the deal so it always runs), `result` (`{ team, board,
  seat, reason, winners }`), `scores` / `board`. Actions: `start`, `move` /
  `drop` (each carrying `move`, the board's move count the phone saw),
  `resign` (`round`), `skipTurn` (host; `board`, `move`), `playAgain`
  (`round`). `bughouseDeadline` is the sooner of the two boards' flags.
  Computer players: `pending` picks, of the two boards, the bot whose
  moment comes first - its thinking time (`BUG_THINK_MS`, steady for one
  key) counted from when its turn began - so both boards keep moving; a bot
  with nothing to do waits and is asked again after the next move anywhere.
- **`JS_RoomBughouse.html`** (section 35 of `Style_Chess.html`, prefix `bh`):
  - **Your board big** through chess's one board view (`chViewShow`,
    `bhModel`): its `lost` is the two hands, so the 3D board sets them
    beside itself; `input.onPick` drops the piece picked from the hand
    (`bhLocal.drop`, its squares as `targets`) or falls through to chess's
    `chTapLogic` / `chDropLogic`. Your move is drawn at once on a copy
    (`bhLocal.early`, the same animation key as the server's, so nothing
    moves twice) and taken back if refused.
  - **Each player a line** (`bhPlayerHtml`): the colour, the name (🤖 for a
    computer player, "you" / "partner"), the team's line (blue A, red B),
    the clock (`data-bh-clock`, painted every 200 ms from the server's time
    as chess reads its clock), the hand (`bhHandHtml`; live buttons of 44 px
    on your move).
  - **Dragging from the hand** (`bhWireHand`): pointer events on the hand's
    buttons; past 8 px a ghost follows the finger and letting go asks the
    board's own `pick` (2D and 3D alike) for the square; a square it can't
    go to sends it flying back. A tap picks it up instead.
  - **The partner's board small** (`bhMiniHtml`, a static `chFlatBoardHtml`
    in a square container), a button: a tap swaps the two
    (`bhLocal.swap`); your own board, small while it is your move, is
    outlined.
  - **Motion** (`bhPlayMotion`, once per capture per phone): a captured
    piece flies from its square to the partner's hand on the other board
    (`bhFly`, a Web Animation of a ghost, the hand popping as it lands);
    another player's drop flies from their hand to its square; your own drop
    by tap flies from your hand as you play it. A piece arriving in your
    hand ticks and buzzes.
  - **The TV** (`TV_GAMES.bughouse`): both boards side by side (2D), each
    with its two players, clocks and hands, team A at the bottom of both;
    the host's "play for" and play again.
  - `roomTurnOf`: your move on your own board.
- Tests: `rules.mjs` (the drops, the hands, the promoted pawn, a drop mate,
  a check a hand can block, six bot games on two boards with every move
  legal; the room: seats, stale taps, a capture sent and dropped, the flag,
  the mate, play again's three pairings, one person and three bots to the
  end, a leaver replaced, five people, the host's "play for"), `leaks.mjs`
  (`DRIVERS.bughouse`: no slice sent, both boards and hands everywhere),
  `play-all.mjs` (two people and two computer players on a live server).

**The review of 1 Oct 2026.** The first time a page sees a game (a reload, a late joiner, a TV coming on), each board's last move is taken as shown - no piece flies to a hand, no tick - and a game already over doesn't throw its confetti again (`bhPlayMotion`'s first sight, through `duelRoomFirstSight`).

## History

The day-by-day log of the work on this game is in `notes/log.md` (search it for the game's name); a new entry goes there, and anything that changes how the game works goes in this file.
