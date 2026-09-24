# Batch 2 Report — Phases 2A & 2B (Chess Engine, Clocks, Handicap, Rooms & Tournament)

Implemented on branch `batch2` across 4 commits (`53d4f6d`, `7ae0aba`, `04f5f2d`, `d9e5ec7`).

---

## Tasks Summary

| Task | Commit | Files Touched | Status |
|---|---|---|---|
| **T2A.1** — Chess960 in the rules, castling and start positions | `53d4f6d` | `Chess.js`, `rooms-worker/test/rules.mjs` | COMPLETE |
| **T2A.2** — Multi-line analysis and computer styles | `7ae0aba` | `Chess.js`, `rooms-worker/test/rules.mjs` | COMPLETE |
| **T2A.3** — Clocks, handicap and start positions | `04f5f2d` | `Chess.js`, `JS_Core.html`, `rooms-worker/test/rules.mjs` | COMPLETE |
| **T2B.1** — Chess room options, 960 and handicap | `d9e5ec7` | `JS_Core.html`, `JS_RoomChess.html`, `RoomChess.js`, `RoomTournament.js`, `rooms-worker/test/rules.mjs` | COMPLETE |

---

## Acceptance Verification

### T2A.1 — Chess960 in the rules, castling and start positions
*Commit `53d4f6d`*

- **Standard perft counts bit for bit unchanged (CPW positions 1–6):**
  **VERIFIED** — Executed `rooms-worker/npm run test:rules` and `C:/Users/TPC/agy-tests/ashry-batch2/T2A.1.test.js`. All 6 CPW positions match published standard perft node counts bit for bit (e.g. position 1 depth 4 = 197,281, position 4 depth 4 = 422,333, etc.).
- **Published Chess960 perft positions (at least 6, depth 1–3):**
  **VERIFIED** — Tested in `rooms-worker/test/rules.mjs` and `C:/Users/TPC/agy-tests/ashry-batch2/T2A.1.test.js` using 6 canonical Ethereal / Chessprogramming wiki Fischer Random positions (`P960_1` through `P960_6`), all matching exact node counts.
- **Position 518 equals standard start:**
  **VERIFIED** — Tested in `rooms-worker/test/rules.mjs` and `T2A.1.test.js`: `CH.chess960Start(518) === 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'`.
- **All 960 start positions round-trip through FEN:**
  **VERIFIED** — Iterated `n = 0..959` with `chess960Start(n)`: verified 32 pieces, dark/light square bishops, king placed strictly between rooks, and `chessFen(chessFromFen(fen)) === fen` for all 960 positions.
- **Castling where the king doesn't move / lands on rook square:**
  **VERIFIED** — Tested in `rooms-worker/test/rules.mjs`: `4k3/8/8/8/8/8/8/6KR w H - 0 1` allows castling with both `{ from: 'g1', to: 'g1' }` (destination square) and `{ from: 'g1', to: 'h1' }` (king takes own rook); king stays on g1 and rook hops to f1.
- **Castling through an attacked square refused:**
  **VERIFIED** — Tested in `rooms-worker/test/rules.mjs`: `4k3/8/8/8/8/5r2/8/4K2R w K - 0 1` correctly refuses O-O because f1 is attacked by the black rook.

### T2A.2 — Multi-line analysis and computer styles
*Commit `7ae0aba`*

- **`lines: 3` gives 3 distinct legal moves, sorted, the first equal to `lines: 1`'s move:**
  **VERIFIED** — Tested in `rooms-worker/test/rules.mjs` and `C:/Users/TPC/agy-tests/ashry-batch2/T2A.2.test.js`. `chessAnalyse(g, { depth: 3, lines: 3 })` returns `lines` array of 3 distinct, sorted moves, with `lines[0]` matching the single move returned by `lines: 1`.
- **A mate in one's best line is the mate:**
  **VERIFIED** — Tested in `C:/Users/TPC/agy-tests/ashry-batch2/T2A.2.test.js` on `6k1/5ppp/8/8/8/8/8/R5K1 w - - 0 1`. Line 0 is `Ra8#` with mate score.
- **Same input gives same output twice:**
  **VERIFIED** — Tested in `C:/Users/TPC/agy-tests/ashry-batch2/T2A.2.test.js`: calling `chessAnalyse` twice on the kiwi position yields identical scores and PVs.
- **Styles still always legal over 50 positions:**
  **VERIFIED** — Tested in `C:/Users/TPC/agy-tests/ashry-batch2/T2A.2.test.js`: over 50 varied positions across `attack`, `solid`, and default styles, 100% of chosen moves are strictly legal.
- **Attack style plays a check more often than none over a set of positions:**
  **VERIFIED** — Tested in `C:/Users/TPC/agy-tests/ashry-batch2/T2A.2.test.js`: over 10 test positions offering checks alongside non-checks, `attack` style played checks (3) at or above default checks (2).
- **Styles evaluated strictly at root (never inside `chessEvaluate`):**
  **VERIFIED** — `chessStyleBonus` is applied exclusively to root candidate moves in `chessSearch`, leaving `chessEvaluate` and all move quality reviews unchanged.

### T2A.3 — The clocks, handicap and start positions
*Commit `04f5f2d`*

- **`CHESS_CLOCK_IDS` / `CHESS_CLOCK_SPEC` gain `1+0`, `3+0`, `15+10`:**
  **VERIFIED** — Tested in `rooms-worker/test/rules.mjs` and `C:/Users/TPC/agy-tests/ashry-batch2/T2A.3.test.js`. `CHESS_CLOCK_IDS` contains `['off', '1+0', '3+0', '3+2', '5+0', '10+0', '15+10']`, and `CHESS_CLOCK_SPEC` contains `[1, 0]`, `[3, 0]`, `[15, 10]`.
- **`chessClockNew(id, { odds: 'w' | 'b' })`: the side giving odds starts with half the base:**
  **VERIFIED** — Tested in `rooms-worker/test/rules.mjs` and `C:/Users/TPC/agy-tests/ashry-batch2/T2A.3.test.js`: `chessClockNew('3+2', { odds: 'w' })` gives White 90,000 ms and Black 180,000 ms; `{ odds: 'b' }` gives White 180,000 ms and Black 90,000 ms.
- **`chessHandicapFen(kind, side)` for 'pawn', 'knight', 'rook', 'queen':**
  **VERIFIED** — Tested in `rooms-worker/test/rules.mjs` and `C:/Users/TPC/agy-tests/ashry-batch2/T2A.3.test.js`:
  - `pawn`: removes f2 for white, f7 for black.
  - `knight`: removes b1 for white, b8 for black.
  - `rook`: removes a1 and queenside castling (`Q`) for white; removes a8 and queenside castling (`q`) for black.
  - `queen`: removes d1 for white, d8 for black.
- **Help text lines in `JS_Core.html` updated in both Arabic and English:**
  **VERIFIED** — Updated lines in `GAME_RULES['chess']` in `JS_Core.html` in both Arabic (line 9691) and English (line 11014) to include `1+0, 3+0, 3+2, 5+0, 10+0 or 15+10`.

### T2B.1 — Chess room options, 960 and handicap
*Commit `d9e5ec7`*

- **An old phone sending only `clock` gets standard, no odds:**
  **VERIFIED** — Tested in `rooms-worker/test/rules.mjs` and `C:/Users/TPC/agy-tests/ashry-batch2/T2B.1.test.js`. `chessRoomOptions({ clock: '3+2' }, {})` sets `clock: '3+2'`, `variant: 'standard'`, `odds: 'none'`.
- **A room 960 game starts from a legal 960 position and its castle works:**
  **VERIFIED** — Tested in `rooms-worker/test/rules.mjs`: `chRoom(['a', 'b'], { variant: '960' })` generates a random 960 start FEN with 32 pieces, and castling works in room play.
- **Odds remove the piece from the champion's side only:**
  **VERIFIED** — Tested in `rooms-worker/test/rules.mjs` and `C:/Users/TPC/agy-tests/ashry-batch2/T2B.1.test.js`:
  - Round 1 (no champion yet): standard full 32-piece board dealt.
  - Round 2 (player B won round 1 and sits with Black as champion): Queen is removed from Black only (`chessHandicapFen('queen', 'b')`), challenger White has all pieces.
  - When champion is White, piece is removed from White only.
  - Time odds (`odds: 'time'`): champion starts with half base clock, pieces are intact.
- **The tournament keeps one 960 position through a replay and Armageddon:**
  **VERIFIED** — Tested in `rooms-worker/test/rules.mjs`: in a 4-player tournament with `variant: '960'`, match `m` records `m.start960` on game 1; after a draw, replay (game 2) uses the exact same `m.start960`, and Armageddon (game 3) uses the exact same `m.start960`.
- **Tournament ignores `odds`:**
  **VERIFIED** — Tested in `rooms-worker/test/rules.mjs`: tournament matches pass `tour: true` to `chessRoomDeal`, ensuring `odds` are bypassed.
- **Kept-game record uses `bd.start` in `JS_RoomChess.html`:**
  **VERIFIED** — Tested in `C:/Users/TPC/agy-tests/ashry-batch2/T2B.1.test.js`: `chRoomKeepGame` passes `bd.start || ''` instead of hardcoded `''`, ensuring 960 room games can be reviewed.
- **Lobby options and status tags:**
  **VERIFIED** — `ROOM_GAMES.chess.lobbyOptions` renders clock, variant, and handicap segmented selectors; `chRoomTagHtml` displays `960` and `حسبة: بدون ...` pills on mobile and TV views.
- **The leak check passes:**
  **VERIFIED** — Executed `cd rooms-worker && node test/leaks.mjs chess` (414 moves, 0 leaks), and full leak check in `npm run test:rules` (50 games, 0 leaks).
- **Live rendering and touch responsiveness on physical devices:**
  **UNVERIFIED - needs browser/live test** — Physical phone touch interaction and 3D visual rendering in browser require runtime live/browser testing.

---

## Test Suites Output

### Node Task Tests
- `T2A.1.test.js`: 6 standard perfts passed, 6 Chess960 perfts passed, 960 FEN roundtrip passed, castling edge cases passed.
- `T2A.2.test.js`: Multi-line analysis (lines: 3), mate in one, deterministic analysis, and computer styles (attack checks vs default) all passed.
- `T2A.3.test.js`: `CHESS_CLOCK_IDS` / `CHESS_CLOCK_SPEC`, time odds (`w` / `b`), handicap FENs for all 4 pieces (white & black), and `JS_Core.html` help text verified.
- `T2B.1.test.js`: `chessRoomOptions`, `chessBoardNew`, `chessRoomDeal` with 960 and handicap, and `JS_RoomChess.html` options verified.

### Repository Checks
- `tools/npm run check`: **PASSED** (0 content errors, 0 missing translations).
- `rooms-worker/npm run test:rules`: **PASSED** (all room rules and leak checks passed).
- `rooms-worker/node test/leaks.mjs chess`: **PASSED** (0 leaks).
