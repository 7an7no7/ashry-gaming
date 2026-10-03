# Batch 2, Phase 2C part 2 (T2C.6 – T2C.8, T2C.10, T2C.11): chess on one phone

Branch `batch2`. Nothing pushed or deployed; `docs/` untouched, `.preview/` rebuilt with
`npm run build:preview` for the browser checks. T2C.9 (board styles) was done in Phase 2D.
Tests and screenshots are outside the repo: `C:/Users/TPC/agy-tests/ashry-batch2/T2C.{6,7,8,10,11}.test.js`
and `C:/Users/TPC/agy-tests/ashry-batch2/c2/` (scripts `t6.mjs`, `t6b.mjs`, `t7.mjs`, `t8.mjs`, `t10.mjs`,
`t11.mjs`, `room.mjs`; screenshots in `c2/shots/`).

| Task | Commit | Files |
| --- | --- | --- |
| T2C.6 Chess960, handicap, the new clocks on one phone | `de0ba2d` | `JS_Chess.html`, `Controller.html`, `JS_Core.html`, `Style.html`, `JS_ChessReview.html`, `JS_RoomChess.html` |
| T2C.7 Premoves | `340de48` | `JS_Chess.html`, `JS_RoomChess.html`, `JS_Core.html` |
| T2C.8 Arrows and marks by hand | `84fd740` | `JS_Chess.html`, `JS_Core.html`, `Style.html` |
| T2C.10 Sharing | `a271146` | `JS_ChessReview.html`, `JS_ShareCard.html`, `JS_Chess.html`, `JS_RoomChess.html`, `JS_Core.html`, `Style.html` |
| T2C.11 Best-move arrows | `292e4cc` | `JS_Chess.html`, `Controller.html`, `JS_Core.html`, `Style.html` |

## How it was checked

- Node tests loading the real `Chess.js` + `JS_Chess.html` (+ `JS_ChessReview.html`) through `harness_c1.mjs`:
  T2C.6 (7 groups), T2C.7 (5), T2C.8 (3), T2C.10 (4), T2C.11 (4): all pass. T2C.1-3, T2C.5, T2D.1-3 still pass.
  T2C.4's test now throws in its own DOM stub (`document.body` missing when `chPieceDefs` draws a piece) - that
  comes from T2D.1's piece symbols, not from this phase; the functions it covers are unchanged.
- `cd tools && npm run check`: passes (i18n OK, content OK; 3176 keys in each language).
- `cd rooms-worker && npm run test:rules`: passes (one run had the known flaky minigolf "play for" check fail;
  the rerun passed; this phase touched no server file). The leak check passes, `tour:chess` included.
- Every edited page file parses (`vm.Script` per `<script>`; `Controller.html` excepted as always).
- Headless Chrome over CDP on the built preview, 375×812 Arabic light, 375×812 English dark, 1280×720 English
  light and dark (2D and 3D), and a room with two phones (separate browser contexts): no console errors, no
  element wider than the screen on the setup or the play screen.

## T2C.6 — Chess960, handicap and the clocks on one phone
- Setup «نوع اللعبة» عادي / 960 (`shatranj-variant`), remembered in `appState.shatranj.variant`: **VERIFIED**
  (screenshot `ar-375-6a-setup-clock-variant.png`; test 0).
- «الحسبة» none / pawn / knight / rook / queen / half the time (chips), and who gives it: against the computer
  أنا / الكمبيوتر, two on one phone الأبيض / الأسود: **VERIFIED** (`*-6b-setup-odds.png`; test 4 checks the piece
  leaves the right side for each giver, the a-rook takes its castling right with it, time odds halve the giver's
  clock, and with no clock "half the time" is no handicap, said on the setup).
- The clock buttons built from `CHESS_CLOCK_IDS` (off, 1+0, 3+0, 3+2, 5+0, 10+0, 15+10): **VERIFIED** (test 6, the
  setup markup has an empty container; seven buttons fit at 375 px, screenshot).
- 960 draws a new start every game, "play again" too; the kept record has the start FEN (and `variant: '960'`):
  **VERIFIED** (test 1: 12 games, ≥ 8 different starts, all legal; test 5 reads the stored record; browser: three
  different starts). 960 counts for the rating, a handicap doesn't (`ch_unrated_odds`): **VERIFIED** (tests 1, 4, 5).
- Castling in 960 by tapping the king then its own rook (or dropping the king on it), in 2D and 3D: **VERIFIED**
  (test 2: the king that doesn't move, a drop, the shared-square case; browser 2D `ar-375-6d-960-king-picked.png`
  shows the ring round the rook, `*-6e-960-castled.png` the result; 3D `en-1280-6h-960-3d-castled.png`, the king
  landing on the rook's own square, no piece lost or doubled). The rook's animation in both boards now finds the
  castling rook for any 960 row (`chCastleRookSquares`, test 3).
- Also: the one-phone board shows «🎲 960» and «⚖️ حسبة: بدون حصان · أنت» over the status
  (`ar-375-6f-handicap.png`). A room game's kept record and its review now carry `bd.start` (the review opened
  from a room used `start: ''`).

## T2C.7 — Premoves
- Against the computer and on your own phone in a room, while the other side moves: pick your piece, pick a
  square among its moves on an empty board (a simple generator for the waiting side); a blue arrow, the piece
  stays: **VERIFIED** (test 1-2; `ar-375-7a-premove.png`, `en-1280-7c-premove-3d.png`, `room-black-premove.png`).
- Played the instant it is your turn if legal, through the normal move path (the room's `chRoomPlay`, so the
  server sees the right `move` count): **VERIFIED** (test 3 vs the computer; browser one phone `e2e4,e7e5,g1f3`,
  3D `e2e4,b8c6,g1f3`; room: Black's queued e7e5 played by itself after White's d4).
- Dropped with a small shake if not legal: **VERIFIED** (test 3; room: a queued e5-e4 dropped when White blocked
  with e4, `pre` cleared, Black still to move). The shake itself (`nudge` on both boards): **UNVERIFIED** visually.
- One at a time; tapping elsewhere cancels: **VERIFIED** (test 2). Not two on one phone, not watchers or the TV:
  **VERIFIED** by the conditions (test 4).

## T2C.8 — Arrows and marks
- 2D: right-drag draws an arrow, right-click marks a square; 3D: the same with Shift (a right-drag alone turns
  the board): **VERIFIED** with real mouse events (`ar-375-8a-arrows.png`, `en-1280-8a-arrows.png`).
- ✏️ on the board for a finger (drag = arrow, tap = mark), in 2D and 3D; 🧹 clears: **VERIFIED** with left-button
  events in pen mode (both screenshots). A real finger on an iPhone: **UNVERIFIED** (needs the phone).
- Green; the same arrow or mark again removes it; cleared when a move is played: **VERIFIED** (test 1; browser:
  3 arrows and 2 marks before the move, none after).
- Never sent to the room (only in the shared board view, `JS_RoomChess.html` has no reference): **VERIFIED**
  (test 3). Works in the review (same view): by construction; **UNVERIFIED** on screen.

## T2C.10 — Sharing
- On the result card and in the review (and a room's phones once over): «ابعت الدور» with صورة / PGN / فيديو:
  **VERIFIED** (`ar-375-10a-done-share.png`, `*-10d-review-share.png`).
- The picture: `shareResultCard` takes an optional `board` (drawn as the 2D board in the phone's style, the
  final position and last move), old callers unchanged: **VERIFIED** (the card rendered to PNG,
  `ar-375-10b-card.png`, `en-1280-10b-card.png`; test 4).
- PGN: Event "Ashry", Date, White, Black, Result, Variant "Chess960", SetUp/FEN, English SAN, lines under 80:
  **VERIFIED** (test 1-2, the moves replayed by the engine; `*-10c.pgn`). The share sheet / clipboard itself:
  **UNVERIFIED** (headless has no share sheet).
- Video: MediaRecorder on an offscreen canvas, mp4 or webm by `isTypeSupported`, 0.6 s a move, ≤ 20 s,
  hidden where unsupported: **VERIFIED** (test 3 for the frames and the hidden button; in Chrome a 4-move game
  recorded as `video/mp4` 113 KB in 4.6 s). Whether an iPhone's Safari records it: **UNVERIFIED**.

## T2C.11 — Best-move arrows
- Coach switch «أفضل الحركات», off by default, against the computer, the setup says the game won't be rated:
  **VERIFIED** (test 1; `*-11a-setup-best.png`).
- On your turn the top 3 as green / light green / yellow arrows, each labelled «64%», and the line «فوزك لو لعبت:
  …»: **VERIFIED** on the 2D board (`ar-375-11b-best-arrows.png`, `en-dark-375-11b-best-arrows.png`) and in 3D
  (`en-1280-11b-best-arrows.png`, and with Black at the bottom `en-dark-1280-black3d-11b-best-arrows.png` - the
  labels turned the right way up).
- Worked out in time slices, nothing shown until ready: **VERIFIED** (test 2: ≥ 5 ticks, nothing before; in Chrome
  no long task over 50 ms on the 2D runs). Deterministic: **VERIFIED** (test 2, the same arrows twice).
- Makes the game unrated (`s.help.best`, `ch_unrated_best`): **VERIFIED** (tests 1-2).

## Decisions made here
- Handicap + 960 together: the same pieces come off a 960 row (the f-pawn, the knight / rook nearest the a-file,
  the queen); the rook takes its side's castling right.
- A king step and castling that land on one square (960): a tap on the square is the step; castling is by the rook.
- Premove squares are the piece's moves on an empty board (Lichess-style), pawns always offered both takes, a
  king its castling squares and own rooks; a pawn premoved to the last rank becomes a queen.
- Premove and drawn arrows are local; the premove arrow is blue, hand-drawn ones green (#15803d-ish).
- The best moves: 5 candidates from a short look, each searched in its own tick (9000 positions), top 3 kept.
- Share: ⚪ / ⚫ before the names on the card and the video (the chess glyphs turn into emoji on an iPhone).

## Uncertain / not verified
- On a real iPhone: the ✏️ drawing with a finger, the share sheet with a picture / video, MediaRecorder support.
- The local rooms server started a room game as standard although `variant: '960'` was sent - probably a dev
  server running a build older than T2B.1; the room premove test did not depend on it.
- `npm run test:ui` (15 minutes) was not run.
