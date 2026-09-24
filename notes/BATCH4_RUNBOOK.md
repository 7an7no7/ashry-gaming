# Batch 4 runbook - chess for teams in rooms: vote chess, Hand and Brain, bughouse

The owner approved on 24 Sep 2026 (see *Decisions*). Rooms only (each on their
own phone, the TV optional - a room with no TV must play fully). All three use
the rules in `Chess.js` and the boards of `JS_Chess.html` (2D by default on a
phone, 3D a tap away, 3D on the TV - Phase 2D). Read GEMINI.md "### شطرنج",
"### Multiplayer rooms" (the whole *Adding a game to the room layer* list, clocks,
leaving, computer players, forced moves, stale taps, `roomTurnOf`, the leak check)
and "### The duels' tournament" (how a room game reuses chess's board functions).

The executor's contract is the earlier batches' (branch `batch4`, one commit per
task, never push/deploy, one global scope, translations both languages, tokens
that exist, `npm run check`, `npm run test:rules`, a round in
`rooms-worker/test/play-all.mjs` and a driver in `rooms-worker/test/leaks.mjs` for
each game, `GAME_CATALOG`, `ROOM_HUB_GAMES`, `ROOM_GAME_IDS`, `TV_GAMES`,
`GAME_RULES`/`HELP_ENTRIES`/`HELP_FOR_VIEW`, `roomPlayerLeft`, `roomTurnOf`).
Every new room file is added to `FILES` in `rooms-worker/build.mjs` after
`RoomChess.js`.

## Decisions (the owner, 24 Sep 2026)

1. **Team vote chess («شطرنج بالتصويت»)**: two teams (the host splits them in the
   lobby: at random with swaps, like الدومينو's seats), any number from 2 (1 vs 1
   is plain chess by vote of one). On a team's move every member taps a move on
   their own board; the most-voted move is played when the clock ends or every
   member present has voted; **a tie is drawn at random among the tied moves**.
   The vote clock **30 s by default** (20 / 30 / 60, the host's). Votes are secret
   until the move is played (who voted is public, not for what - the voting
   engine's rule), then the table sees how the team voted (a small list: ♞f3 ×3,
   e4 ×1). **No computer players.** A team with nobody voting when the clock ends:
   the move with the most votes, or if none, a random legal move (said as such).
   A team chat is the room chat's team channel (like أسماء الرموز).
2. **Hand and Brain («المخ والإيد»)**: 2 vs 2 (4 players; computer players fill
   empty seats, easy and hard). On a team's move the **Brain** names a piece type
   (six buttons: ♔ ♕ ♖ ♗ ♘ ♙, only types that have a legal move lit), then the
   **Hand** plays any legal move of that piece type. Roles are **fixed for a game,
   swapped for the next** ("play again"). Optional clock: off by default, 5+0 /
   10+0 per team.
   The Brain sees the board and can't move; the Hand sees the named piece
   highlighted. What the Brain named is public to the table (it is said out loud
   in the real game).
3. **Bughouse («باغ هاوس»)**: 4 players on two boards, partners on different boards
   with opposite colours (A plays White on board 1, B plays Black on board 2).
   Pieces you capture go to your partner's hand; on your move you may **drop** a
   piece from your hand onto an empty square instead of moving (standard: no pawn
   on the first or last row; a drop may give check or mate; a promoted piece
   captured goes over as a pawn). The **clock is always on, 3+0 by default**
   (2+0 / 3+0 / 5+0); a flag loses for the team; a mate on either board wins for
   that team. Computer players fill empty seats (easy and hard: a normal move
   choice plus sensible drops: a drop that gives mate first, otherwise a drop on a
   good square near the enemy king when ahead in the hand).
   Both boards on every phone: your own big, your partner's small beside or under
   it (tap to swap sizes); the TV shows both boards side by side.

## T4.1 - Bughouse rules in Chess.js
- Pure functions (prefix `chessBug…`): a hand per side on a board
  (`{ w: {q,r,b,n,p}, b: {...} }`), a drop move (`{ drop: 'n', to }`) legal-move
  generation, applied by `chessPlay` or a new `chessBugPlay`, SAN for drops
  (`N@f3`), promoted-piece tracking (a set of squares), captured piece → partner's
  hand. Standard chess and perft unchanged. Tests in `rules.mjs`: drops refused on
  rank 1/8 for pawns, onto occupied squares, when in check unless it blocks; a drop
  mate; a promoted queen goes over as a pawn; hands after a sequence.

## T4.2 - Vote chess (room)
- `RoomVoteChess.js`: `voteChessAction`; teams in the lobby; one board (use the
  chess board functions: `chessBoardNew`, `chessBoardMove`); `shared.vote =
  { team, endsAt, voted: [pid] }`, the votes in `room._vc` (never projected);
  close by all voted or `roomDeadline`/`roomTimeout`; the result published with the
  tally. Leaving: a member drops out of the count; a team with nobody left loses.
- `JS_RoomVoteChess.html`: every member's board takes taps as a vote (a ghost
  arrow of your vote, changeable until it closes), the clock ring, who has voted,
  the tally flying in when the move is played (motion toolkit), the TV: the board
  and both teams' names with vote dots.

## T4.3 - Hand and Brain (room)
- `RoomHandBrain.js`: 4 seats (2 teams), `shared.phase` name → move per team turn,
  `shared.named`; bots for empty seats through `ROOM_BOT_GAMES` (a bot Brain names
  the piece type of the engine's best move - hard - or of a random decent move -
  easy; a bot Hand plays the best move of that type); clock optional; play again
  swaps roles. The Hand's board lights only the named type's pieces.
- `JS_RoomHandBrain.html`: the Brain's six buttons (the unavailable ones faded), a
  big «🧠 منى قالت: الحصان!» with a sound to all, the Hand's board, the TV.

## T4.4 - Bughouse (room)
- `RoomBughouse.js`: 4 seats, two boards with their own clocks (both always
  running for the side to move on each board), hands, drops, the win on either
  board (mate or flag), bots, leaving (a leaver's board is played on by a computer
  player for the rest of that game rather than ending it, so the other three can
  finish - say so on screen), play again rotates partners.
- `JS_RoomBughouse.html`: your board with your hand as a row of pieces under it
  (tap or drag a piece onto a square to drop; legal squares lit), your partner's
  board small with their hand and clock, captured pieces flying from one board to
  the partner's hand (motion toolkit), the TV with both boards, four clocks, four
  names.

## T4.5 - The hub, help, tests
- Catalog entries (`group: 'duo'`? no - these are team games: the group whose name
  is true of them; ask the reviewer if none fits rather than creating a group),
  icons distinct from every existing one (not ♞), `ROOM_HUB_GAMES` minimums (vote
  2, hand-brain 1 with bots, bughouse 1 with bots), rules in `GAME_RULES` (ordered
  lists), `HELP_ENTRIES`, `HELP_FOR_VIEW`, `roomTurnOf` (your vote pending, you are
  the Brain to name or the Hand to move, your move on your board), leak-check
  drivers (vote chess: no vote content before the close; bughouse: nothing hidden
  except nothing - but check anyway), robot rounds.

## Report
`notes/phase-reports/batch4.md`.
