# Batch 2 report — Phase 2C, part 1 (T2C.1 – T2C.5): chess on one phone

Branch `batch2`. Nothing pushed or deployed; `docs/` and `.preview/` untouched by hand
(`.preview/` rebuilt with `npm run build:preview` for the browser check).

| Task | Commit(s) | Files touched |
|---|---|---|
| T2C.1 Opening names | `867fe6d`, reviewer fixes `a2b86d7`, `9afc034` | `JS_ChessOpenings.html` (new), `JS_Chess.html`, `JS_ChessReview.html`, `JS_RoomChess.html`, `JS_Core.html`, `Style.html`, `Controller.html`, `tools/validate-content.js` |
| T2C.2 Undo / hint limits, help tracking | `4bb844b` | `Controller.html`, `JS_Core.html`, `JS_Chess.html`, `Style.html` |
| T2C.3 Your rating | `7d9a3f4` | `Controller.html`, `JS_Core.html`, `JS_Chess.html`, `JS_ChessReview.html`, `JS_Daily.html`, `Style.html` |
| T2C.4 Characters | `0126aae` | `Controller.html`, `JS_Core.html`, `JS_Chess.html`, `Style.html` |
| T2C.5 Set-up position, famous endgames | `8ea81ad` | `JS_ChessPosition.html` (new), `Controller.html`, `JS_Core.html`, `JS_Chess.html`, `JS_Utils.html`, `Style.html` |

`8ea81ad` also carries two small style fixes found in the browser for T2C.2/T2C.4
(characters four to a row on a phone; the undo/hint count close to its label).

## How it was checked

- Node tests loading the real `Chess.js` + `JS_Chess.html` (+ `JS_ChessReview.html`,
  `JS_ChessPosition.html`) with DOM stubs: `C:/Users/TPC/agy-tests/ashry-batch2/T2C.1.test.js` …
  `T2C.5.test.js` (harness `harness_c1.mjs`). All pass. (`T2C.1.test.js` expected the old
  wording «بيدق»; updated to the reviewer's «عسكري».)
- `cd tools && npm run check`: passes (exit 0, i18n OK, content OK).
- `cd rooms-worker && npm run test:rules`: passes. One run while other Node processes were
  busy failed four time-sensitive minigolf checks (`t0` within 1.5 s etc.); the rerun passed
  with nothing changed — none of this batch touches minigolf or the server.
- Every edited `.html` parsed with `vm.Script` (Controller.html excepted, as usual).
- Browser: headless Chrome over CDP on the built preview (`shots_c1.mjs`), at 375×812 Arabic
  light, 375×812 English dark, 667×375 Arabic dark, 1280×720 English light: setup (characters,
  custom slider, undo/hint control, rated line), a game vs Uncle Hassan (move, his reply, undo,
  hint), the editor (Lucena loaded, a pawn on a8 refused in words), the Lucena game played one
  move. No console errors, no element wider than the screen. Screenshots:
  `C:/Users/TPC/agy-tests/ashry-batch2/shots/`.

## T2C.1 — Opening names (done earlier)
- ~150 openings, both names, matched by position (transpositions): **VERIFIED** (`T2C.1.test.js`, content check in `npm run check`).
- Deepest name shown and kept after theory: **VERIFIED** (test 4).
- Shown over the move list on one phone: **VERIFIED** (screenshot `ar-light-375-5-game-after-reply`: «افتتاح عسكري الملك»). In a room / on the TV: **UNVERIFIED** — needs a live room test.
- Review «خرجت من النظرية في الحركة n»: **VERIFIED** by test (`outOfTheoryPly`); on screen **UNVERIFIED**.
- Not in 960 / set-up games: **VERIFIED** (test 5).
- Content check (legal lines, no duplicate final position, both names): **VERIFIED** (`npm run check`).

## T2C.2 — Undo and hint limits; help tracking
- Setup «التراجع والتلميح» بلا حدود / 3 / ممنوع, default 3, remembered in `appState.shatranj.helpLimit`: **VERIFIED** (test 1, screenshots `*-3-setup-help-rated`).
- ↶ takes back your move and the computer's (only yours while it thinks; none after the game): **VERIFIED** (tests 2, 3, 7; browser: hist 2 → 0).
- Undo rebuilds from `s.start` + `s.hist`, repetition keys identical: **VERIFIED** (test 2 compares `g.keys`).
- Clears the computer's pending move: **VERIFIED** (test 3).
- Undo counter in the animation key: **VERIFIED** (test 4; key `gameId|undos|n`). That the piece no longer snaps: **UNVERIFIED** visually (the screenshot after undo shows the right position).
- 💡 independent of the coach (the coach's hint switch removed), each counted separately and showing what is left («💡 تلميح 2», «↶ تراجع 2»): **VERIFIED** (test 5–6, browser bar text).
- `s.help` records undo, hint, best, warn, setup, odds; the kept record carries it: **VERIFIED** (test 8; T2C.5 test 8 reads the stored record).
- Decision taken: this game keeps the limit it started with (`s.gameHelp`); the same hint asked twice counts once.

## T2C.3 — Your rating
- `{ r: 800, n: 0 }` in `appState.shatranj.rating`; Elo, K 32 for n < 20 then 20, draws 0.5, against the game's computer rating (character or slider, kept at the start): **VERIFIED** (tests 1, 2, 5, 9).
- Only no-help games count (undo/hint = none, coach warning off, not set-up, not practice); a game where help was used anyway isn't counted: **VERIFIED** (tests 3, 9, 10). Handicap and best-move arrows are already in `chHelpUsed`, to be switched on by T2C.6/T2C.11.
- Setup shows «⭐ تقييمك 800» and above Start «✅ الماتش ده محسوب في تقييمك» / «مش محسوب في تقييمك: التلميح/التراجع مفتوح»: **VERIFIED** (screenshots `*-1-setup-chars`, `*-3-*`, `*-4-setup-rated-yes`). The line sits just above the sticky Start bar (the app moves Start into it).
- Suggestion under the characters (nearest rating + 100): built with the characters in T2C.4 — **VERIFIED** (T2C.4 test 3); hidden when the suggested one is already picked.
- New game over an unfinished rated one (Start, «جرّب الأحسن», the editor's ▶): confirm «الماتش اللي فات هيتحسب خسارة…», then a loss (reason `left`); declining keeps the game; a game with no move of yours isn't counted: **VERIFIED** (tests 6–8).
- Resigning counts as a loss: **VERIFIED** (test 4).
- Kept record has `rated`, `rating {before, after, delta, opp}`; the review and the game's end show «تقييمك بقى 812 +12»: record **VERIFIED** (test 4); on-screen line **UNVERIFIED** (no finished rated game was screenshotted).
- Stats screen (أرقامي): a «شطرنج · تقييمك في الشطرنج» card through a small `value` hook in `renderStats` (same card layout): **VERIFIED** by test 11 (markup); on screen **UNVERIFIED**.

## T2C.4 — Characters
- Six characters (نونو 400, عم حسن 800 attack, ميرا 1100 solid, الكابتن 1400, الأستاذ 1700, الجنرال 2000) + «مخصص» showing the slider; remembered (`s.char`): **VERIFIED** (tests 1, 4, 5; screenshots `*-1-setup-chars`, `*-2-setup-custom`).
- One line under the row when picked: **VERIFIED** (screenshot).
- Opponent pill shows the character's name, face and rating instead of «الكمبيوتر 1200»: **VERIFIED** (test 7, screenshot `*-5-game-after-reply`).
- Computer plays `chessBestMove(g, { elo, style })`: **VERIFIED** (call site test; a game was played against Hassan and Mira).
- `chCharFaceSvg(id)`: 64×64 SVGs, no ids, no text, six distinct: **VERIFIED** (test 2 and screenshots).
- Decisions: a phone that had played before keeps its slider (`custom`); a new phone starts on عم حسن.

## T2C.5 — Set up a position, famous endgames
- «🧩 وضع مخصوص» on the setup opens an editor (view `pos-shatranj`, in `VIEW_META`, `HELP_FOR_VIEW`, restored on reload through `soloRegister`): flat board, the 12 pieces and an eraser, whose turn, castling where king and rook stand, «مسح» (keeps the two kings), «الوضع الأصلي»: **VERIFIED** (tests 3–4, 9; screenshots `*-8-editor`, `*-9b-editor-tools`). Reload on the editor: **UNVERIFIED**.
- Endgames: ملك ووزير، ملك وطابية، ملك وعسكري، فيلين، فيل وحصان، لوسينا، فيليدور، سباق عساكر (دراسة ريتي), each with a FEN and a line, all valid positions: **VERIFIED** (test 1, screenshot `*-9-editor-lucena`).
- Validation (one king each, no pawn on rows 1/8, side not to move not in check, and a position already over) with the error in words: **VERIFIED** (tests 2, 5; screenshot `*-10-editor-error`).
- Played through `chNewGame({ fen, setup })`, unrated, vs the computer or two on one phone; a custom position uses the setup's colour; an endgame gives you its side (decision: playing the losing side of «win with K+Q» makes no sense); «دور تاني» replays the same position; the start FEN is in the kept record: **VERIFIED** (tests 6–8; screenshots `*-11-endgame-game`, `*-12-endgame-played`).

## Not done / notes
- T2C.6 onwards and Phase 2D not started, as instructed.
- GEMINI.md not updated (not among the files these tasks name); worth a line under *شطرنج* when the batch ships: `JS_ChessPosition.html`, `s.help` / `s.rating` / `s.char` / `s.opp` / `s.pos`.
- On a 1280×720 screen the editor's board starts below the endgames card and needs a scroll (it is sticky once scrolled).
