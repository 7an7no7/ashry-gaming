# Batch 5 report - شطرنج الأربعة (four-player chess)

Branch `batch5`, built from `notes/BATCH5_RUNBOOK.md`. Nothing pushed or deployed.
Tests, drivers and screenshots are outside the repository, in
`C:/Users/TPC/agy-tests/ashry-batch5/` (screenshots in `shots/`).

## Commits

| Task | Commit | Files |
| --- | --- | --- |
| T5.1 | `96aac39` | `Chess4.js` (new), `rooms-worker/test/rules.mjs` |
| T5.2 | `998bfbd` | `RoomChess4.js` (new), `RoomGames.js`, `rooms-worker/build.mjs`, `rooms-worker/test/rules.mjs`, `rooms-worker/test/leaks.mjs`, `rooms-worker/test/play-all.mjs`, `JS_RoomTurn.html` |
| T5.3 | `cad6bea` | `JS_RoomChess4.html` (new), `Style.html` (section 34), `Controller.html`, `JS_Core.html` (the screen's strings, `VIEW_META`, `validViews`), `tools/build-preview.mjs`, `tools/build-site.mjs` (`SHARED_LISTS`) |
| T5.3 (fix) | `a882dc3` | `JS_RoomChess4.html`, `Style.html` - what the browser check found (below) |
| T5.4 | `4560db6` | `JS_Catalog.html`, `JS_Core.html` (`GAME_RULES` ar/en, `ICON_ART.chess4`, two string fixes), `JS_Room.html` (`ROOM_HUB_GAMES`), `JS_Utils.html` (`HELP_ENTRIES`, `HELP_FOR_VIEW`), `GEMINI.md` |

## T5.1 `Chess4.js`

- Board 14 × 14 without the 3 × 3 corners (160 squares), pieces with owner, every
  piece's moves, pawns per direction (one or two from the first row, diagonal
  captures, no en passant), castling both ways with the usual conditions,
  promotion to a queen on the 8th row (FFA) / 11th (teams), check from any
  opponent (never a partner), mate and stalemate judged on the player's own
  turn, grey walls, FFA points (a promoted queen 1), the end, SAN-like
  notation with a-n / 1-14. - VERIFIED: `npm run test:rules`, 36 `chess4` checks
  (start counts 20 each colour, castling both ways and through an attacked
  square, blue castling along its column, promotion rows per mode and per
  colour, check from two players, a partner's rook never checks, mate with
  +20 to the checker, grey walls can't be taken and never give check,
  stalemate out +20 (FFA) / pass (teams), points 5 / 9 / 1, teams won by
  either mate, resigning both ways, fifty moves).
- Computer players: easy one move deep with captures preferred and chance;
  hard a paranoid alpha-beta (partner counted as ours in teams) deepening to
  a full round inside `CHESS4_BOT_NODES` = 20,000 nodes. - VERIFIED: 80 whole
  bot-only games (teams / FFA × easy / hard, 20 each) every move legal, all
  ended, the longest 600 moves; timed on this PC: about 11 ms a hard move on
  average, the worst about 20-30 ms with the full budget (under the ~50 ms asked).
- 50-move rule added (FFA: highest score wins; teams: a draw) and a 600-move
  cap (`CHESS4_MAX_PLIES`), because easy-vs-easy games ran past 700 moves. -
  VERIFIED (a test; no bot game past 600).

## T5.2 `RoomChess4.js`

- Lobby (mode, clock, colours: `options`, `seats { order, watch }`, host only),
  start with easy bots in empty colours, moves with `seq` (stale taps
  dropped), the clock on the server (`chess4Deadline`/`chess4Timeout`, first
  move of each player free, +5 s a move), "play for" (an easy move marked
  `auto: 'host'`), resigning, leaving (FFA out; teams a hard bot takes the
  seat under the leaver's name), bots (`ROOM_BOT_GAMES.chess4`), results and
  wins, play again turning the table by one; `roomTurnOf` case. - VERIFIED:
  26 `chess4 room` checks in `rules.mjs` including six whole bot-only room
  games (both modes, easy / hard / mixed); `leaks.mjs` driver (a game each way
  with two people and a bot, clock, "play for", a resignation) passes;
  `play-all.mjs --only=chess4` on 8793: 36 passed, 0 failed (teams with two
  people, two bots and a TV, a leaver replaced by a bot, resigning, play
  again; FFA with one person and three bots on the clock, resigning out).
- Full `play-all.mjs` on 8793: 2197 passed, 0 failed (see the end of this report).

## T5.3 `JS_RoomChess4.html` + Style.html section 34

- The 2D board as the design sheet (look أ): VERIFIED in headless Chrome over
  CDP (a browser context per phone): the chess board's own green/cream
  tokens, the corners cut away, the app's `CH2_SHAPES` pieces as a tinted
  symbol set per player (grey for out), red at the bottom on the TV and a
  watcher's phone, the board turned for blue (blue at the bottom, turn order
  running clockwise).
- Tap and drag: VERIFIED (the host's first move by two taps with the legal
  dots shown, Sara's by a drag).
- Last move, check glow, grey out players piece by piece, mated king toppled,
  points flying to the chip and counting up, podium (FFA) / team banner
  (teams) with confetti: VERIFIED visually on the screenshots (the motion
  itself checked as far as a still can show it: the toppled king, the grey
  walls, the podium and confetti).
- Reload mid-game: VERIFIED (teams, the blue phone at move 30: back on the
  board with all pieces; FFA, the host at move 40).
- Help 📘 on the screen: VERIFIED (the rules card opens for Four-Player Chess).
- Console: no errors on any phone or the TV (only Chrome's "blocked
  navigator.vibrate" notice, since the headless pages are driven without a
  real tap).
- Sizes: 375×812 Arabic light and English dark, 667×375 Arabic light and
  English dark, 1280×720 both, TV 1920×1080 English dark and 1280×720 Arabic
  light. `npm run test:ui` with `ONLY=screens,rooms` against 8793: 66 passed,
  0 failed (`chess4: dealt, and every phone and the TV laid out without errors`).
- 3D: **not built**. The TV shows the large 2D board. The chess 3D engine is
  built for 8 × 8 (its board texture, camera framing and picking); a 14 × 14
  3D board done well was more than this batch (the runbook allowed this).

Found in the browser and fixed (`a882dc3`):
- The lobby's colour cross mirrored in Arabic (blue on the right): laid out
  left to right like the board.
- `.ch4-dot` was two things (the legal-move dot and the log's colour dot): every
  log entry had its first letter under an absolute dot. Renamed the board's to
  `ch4-hint` / `ch4-ring`.
- Sideways and on a laptop the column beside the board slid under it: the
  board's box is a size container, which gives an `auto` grid column no width.
  The width now sits on the grid item (a trap in GEMINI.md).
- The pieces were small in a square of 14 on a phone: drawn at 116% of the
  square.
- Names and "+20" inside Arabic lines jumbled: isolated (`duelIso`).
- A mated king now stays toppled; the TV no longer calls `haptic`; the start
  no longer sends the host's remembered way to play (it overrode what the
  lobby showed), and the remembered choice reaches only a room with none.

## T5.4 registration

- Catalog (ورق وطاولة, `modes: ['room', 'tv']`, 1-4 players), a drawn icon
  `art:chess4` (the cross-shaped board with a pawn of each colour - not ♞),
  hub entry (min 1), `GAME_RULES` ar/en as an ordered list with sub-heads,
  `HELP_ENTRIES` (roomOnly), `HELP_FOR_VIEW`. - VERIFIED: `npm run check` passes
  (i18n OK, 3,2xx keys each side), the help card opens on the screen, the hub
  tile deals the game in `test:ui`.
- GEMINI.md: the owner's specs, a feature line, the files table and FILES list,
  the bot games, a `### شطرنج الأربعة` section, a trap, the log.

## Decisions made here (each in one place)

- The kings and queens exactly as the design sheet: red Q g1 K h1, yellow
  K g14 Q h14, blue Q a7 K a8, green K n7 Q n8 (every king faces the queen
  across the board). chess.com's own blue/green may differ - the sheet the
  owner approved was followed.
- A king is never taken: a player left in check by someone else answers it on
  their turn (the runbook's "mate judged on that player's turn").
- The points of a mate go to the player whose move gave the check
  (`g.giver`), falling back to an attacker.
- Teams: all four passing in a row is a draw; FFA's winner is the highest
  score even if that player went out.
- A 600-move cap beside the 50-move rule.
- A player's first move is free on the clock.
- Empty colours at the start get an easy bot; a teams leaver gets a hard bot
  under their own name.
- Chips sit in the cut corners (bottom player's in the bottom-left, round
  clockwise), which keeps the board the full width of a phone.
- The TV is 2D (above).

## Uncertain / for the owner

- The blue/green king-queen order (the sheet vs chess.com).
- The hard bot is decent tactically (it sees a whole round within the budget)
  but not strong; easy-vs-easy games rarely end by mate (the 50-move rule and
  the cap end them).
- `rules.mjs` minigolf checks are flaky before this batch too (the same
  "play for is the gentle putt" failure reproduced on the untouched runbook
  commit `c6cecf5`); every run of mine passed except those intermittent ones.

## Checks run

- `cd tools && npm run check` - passes.
- `cd rooms-worker && npm run test:rules` - `all room rules pass`, and the
  leak check `no secret reached a phone it was not meant for`.
- `node test/play-all.mjs http://127.0.0.1:8793 --only=chess4` - 36 passed, 0 failed.
- `ONLY=screens,rooms node test-ui.mjs http://127.0.0.1:8793` - 66 passed, 0 failed.
- `node test/play-all.mjs http://127.0.0.1:8793` (everything) - 2197 passed, 0 failed.
  A first run, made while a headless Chrome drove a whole FFA game on the same
  machine, had 3 failures, all "minigolf: the next hole starts by itself"
  (a timing check); the second run, on a quiet machine, passed everything.
