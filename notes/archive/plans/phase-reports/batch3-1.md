# Batch 3 report - T3.1 (the puzzle generator and the bank)

Branch `batch3` (worktree `ashry-b3`). One task, one commit.

| Task | Commit | Files touched |
|---|---|---|
| T3.1 - the generator and the bank | `a2949ce` | `tools/make-chess-puzzles.mjs` (new), `ChessPuzzles.js` (new, generated), `tools/package.json` (`build:puzzles`), `tools/validate-content.js`, `tools/build-site.mjs`, `tools/build-preview.mjs` (`SHARED_LISTS`), `Controller.html` (the SHARED_LISTS comment) |

`rooms-worker/build.mjs` untouched. No chess UI file touched.

## What was built

- `tools/make-chess-puzzles.mjs` loads `Chess.js` (and the openings of `JS_ChessOpenings.html`)
  with `new Function`, as `rooms-worker/test/rules.mjs` does, and plays 2,400 computer games
  (80% from a random explorer opening, 20% from a random 960 start; each side 1000-1800,
  `chessBestMove` with its noise and slips, at most 20,000 positions a move), on 18 worker
  threads.
- Candidates: (a) a game position where the move before was a mistake of 2+ pawns by a side
  that wasn't already 4+ pawns ahead, and the side to move now wins (+300 or a mate in <= 3);
  (b) at about half the positions, a mistake the side to move *could* have played there (from a
  full-window ranking of every move): the least bad move that hands the other side a winning
  position, a slip into a mate half the time, a slip that just leaves a piece hanging only 15%
  of the time. A candidate the shallowest search already solves with a capture is checked only
  30% of the time (the bank has thousands of those).
- A candidate becomes a puzzle as the runbook says: the best move (200,000 positions) is a mate
  or +300, and no other move comes within 250 (or mates as fast); the line is followed with the
  engine's best reply while the next move is again the only winner, up to 3 player moves; a mate
  must be forced to the end; a material line is trimmed to end on a capture, check or promotion,
  and must win 2+ pawns after the opponent's best reply; a recapture on the square just taken
  must win 2+ pawns more than before that capture; a position where every legal move takes the
  same piece, or the first move is the only legal one, is dropped. One puzzle per position and at
  least 6 plies apart within a game.
- **The second line is measured by playing each of the 4 strongest alternatives and analysing
  the position after it** (60,000 positions), not by `chessAnalyse`'s `lines: 2`: see "Found on
  the way".
- Levels: mate in n is level n; one capture (or promotion) is 1; two moves, or a quiet first move
  (not a capture, check or promotion), 2; three moves, a sacrifice (`chessIsSacrifice`) leading a
  longer line, or both of level 2's (two moves opened by a quiet one) 3; one up when the engine
  needed depth 4+ to find the first move. **Interpretation**: "two moves opened by a quiet move
  → 3" and "a check counts as forcing, not quiet" are mine; without the first, level 3 would need
  ~4x the games (about 100 per 2,400).
- Rating: 600 / 1100 / 1600 by level, ±250 by the depth the engine needed, the length, a
  sacrifice, a quiet first move, a mate and the number of pieces. Medians 530 / 1070 / 1640.
- Output: `const CHESS_PUZZLES = [...]`, one line a puzzle,
  `{ id, fen, moves (UCI), theme, mateIn?, level, rating }`; ids 1..1505; quotas 540 / 540 / 500
  (level 3 had 425), spread over the games by a stride, level 1's plain grabs (a capture nobody can
  take back) only to make up the number.
- Deterministic: every game seeded by mulberry32 from its number, every search bounded by
  positions with a clock that stands still (`now: () => 0`). Results per game are cached in the OS
  temp folder keyed by a hash of the settings, `Chess.js` and the worker's code, so a stopped run
  resumes and selection-only changes need no replay.

## The bank

1,505 puzzles, 228,781 bytes: level 1 540 (201 mates in 1), level 2 540 (129 mates in 2), level 3
425 (96 mates in 3). 5,241 distinct puzzles were found (3,822 / 994 / 425).

## Accept-when

- **`npm run build:puzzles` runs twice to the identical file** - VERIFIED. Run 1 (fresh cache)
  1,274 s; run 2 with `TEMP`/`TMP` pointed at an empty folder, so every game was replayed from
  scratch (1,802 s, the PC busier), `cmp` identical, and identical to the committed file
  (`T3.1.test.js` checks both).
- **`npm run check` validates it** - VERIFIED. The new block in `validate-content.js`: every FEN
  valid (round-trips through `chessFen`), game not over, moves in UCI and legal in order, an odd
  number (player, reply, …, player), no line ending early, a mate puzzle's last move mates with
  the right `mateIn`, ids unique, positions unique, theme and rating present, each level >= 300.
  `npm run check`: "no problems found", "i18n OK". Proved against broken banks in
  `T3.1.test.js` (illegal move, bad FEN, repeated id, repeated position, a "mate" that doesn't
  mate, too few of a level, a line ending on the reply): each caught.
- **A sample of 30 verified by re-analysing with more nodes, in the generator's log** - VERIFIED.
  1,000,000 positions each: 29/30 confirmed; the 30th (#666, `e4f6`) is the same move at +291,
  just under the +300 bar.
- **About 1,500 puzzles, >= 400 per level, <= 250 KB, one line each, unique positions** -
  VERIFIED (1,505; 540/540/425; 228,781 bytes).
- **Unique winning move at each step** - VERIFIED by the generator; independently in
  `T3.1.test.js` for 20 puzzles (every alternative first move played and analysed): 19/20 hold.
- **Inlined into the page, not the rooms server** - VERIFIED by reading `SHARED_LISTS` in both
  build scripts and `rooms-worker/build.mjs`; the Controller.html comment still matches the build
  mark (test). The page build itself was not run (build:site is forbidden) - the inline is
  UNVERIFIED in a browser; `CHESS_PUZZLES` is a new global, grep found no clash.
- **Run under ~30 minutes** - VERIFIED for the first run (21 min 14 s); the second, fresh run took
  30 min while the PC was shared.
- **The quality by eye** - checked 10 a level in each run's log. Level 2 and 3 are real tactics
  (forks with check, double attacks, pins, deflections, skewers, underpromotion, mates in 2-3).
  Level 1 is mostly winning a piece that was left en prise (or mate in 1): the runbook's level 1,
  but the plainest kind of tactic.

## Tests

- `C:/Users/TPC/agy-tests/ashry-batch3/T3.1.test.js`: 28 passed, 0 failed (output in `T3.1.out`).
- `tools: npm run check`: pass. `rooms-worker: npm run test:rules`: pass (exit 0; no rules changed,
  so no new `rules.mjs` cases).
- Parse: `node --check` on the generator, `ChessPuzzles.js`, `validate-content.js`, both build
  scripts: OK.

## Found on the way (not fixed - Chess.js is not this task's)

`chessAnalyse(g, { lines: n })` gives a real score only to the moves inside the first n of the
root order; the others are searched with a null window, and when the best move is a mate the
mate-distance pruning in `negamax` returns `alpha` at once, so a move outside the lines reports
the **mate score itself** (`Qxf7#` and `Nc3` both 99999 in the Scholar's mate position with
`lines: 2`), and otherwise often the best move's own score. So `lines: 2` cannot tell whether the
best move is unique. `lines: <number of legal moves>` is exact (every move a full window), which
is what the generator uses to rank. T3.5's "within 50 cp of the best" should use one analysis per
move (or all lines), not the second line.
