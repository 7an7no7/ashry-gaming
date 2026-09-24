# Batch 3 runbook - chess puzzles

The owner approved on 24 Sep 2026: puzzles made by the app's own engine at build
time (nothing to maintain), levels easy / medium / hard, a daily puzzle in تحدي
اليوم, a puzzle streak «سلسلة الألغاز» (3 lives, no clock, harder as it goes, best
kept on the phone), and puzzles from your own mistakes (from the review).

The executor's contract is batch 2's (branch `batch3`, one commit per task
`T3.x: …`, never push or deploy, one global scope, translations in both languages,
tokens that exist, parse checks, `npm run check` and `npm run test:rules` pass).
Read GEMINI.md "### شطرنج" and "### Solo games" (registration, seeded dailies,
"A daily is played once", `soloResult`) and `JS_Daily.html` first.

## T3.1 - The generator and the bank

- `tools/make-chess-puzzles.mjs` (run by hand: `cd tools && npm run build:puzzles`,
  a new package.json script; NOT part of build:site). It loads `Chess.js` the way
  `rooms-worker/test/rules.mjs` does (`new Function`), plays computer-vs-computer
  games from the start and from random 960 starts with some randomness
  (`chessBestMove` at ratings 1200-2000 with noise), and at every position asks
  `chessAnalyse(g, { lines: 2, nodes: 200000 })`. A position becomes a puzzle when:
  - the side to move has exactly one clearly winning move: the best line is a mate
    or at least +250 cp better (for the side to move) than the second line, and the
    best line's score is at least +300 or a mate;
  - the solution is followed for the whole line: after the player's move, the
    opponent's reply is the engine's best, and the player's next move must again be
    the only winning one (second line ≥ 250 cp worse, or the only mate) - keep going
    while that holds, up to 3 player moves; the puzzle is the line up to the last
    player move that was forced-unique;
  - the position is not in check-already-lost trivia (the side to move isn't simply
    recapturing a piece just taken: skip positions where the best move captures on
    the square the last move landed on and nothing else is won), and not a position
    where every legal move is a capture of the same hanging piece.
- The puzzle record: `{ id, fen, moves: ['e2e4', …] (player, reply, player…),
  theme: 'mate' | 'material', mateIn?: n, level: 1|2|3, rating }`. Level by how long
  and how hidden: mate in 1 or winning a piece in one move with the first move being
  a capture → level 1; two player moves or a quiet first move → level 2; three
  player moves, or a quiet sacrifice first → level 3. `rating` roughly 600/1100/1600
  plus/minus by the nodes the engine needed to find it.
- It writes `ChessPuzzles.js` at the root: `const CHESS_PUZZLES = [...]` - about
  1,500 puzzles, at least 400 per level, no two with the same position. Deterministic:
  seeded (`soloRng`-like mulberry32 inside the script), so running it twice gives the
  same file.
- `ChessPuzzles.js` is inlined into the page (`SHARED_LISTS` in
  `tools/build-site.mjs` and `tools/build-preview.mjs`, the comment in
  `Controller.html`), NOT into the rooms server (`rooms-worker/build.mjs` untouched).
  Keep it compact (one line per puzzle); if it goes over 250 KB, fewer puzzles.
- `tools/validate-content.js` checks the bank: every FEN valid, every move legal in
  order, the last player move ends in mate when `theme: 'mate'`, ids unique,
  positions unique, levels 1-3 each ≥ 300.
- Accept when: `npm run build:puzzles` runs twice to the identical file; `npm run
  check` validates it; a sample of 30 verified by re-analysing with more nodes
  (write the sample check into the generator's output log).

## T3.2 - The puzzle screen

- `JS_ChessPuzzles.html` (included after the chess files): one puzzle view reusing
  the chess board (`chView`, `chViewShow`, the model shape the one-phone game uses,
  input through `chTapLogic` / `chDropLogic`), the player's colour at the bottom,
  the side to move said on top («دورك: الأبيض يلعب ويكسب» / «… ويموّت في 2»).
- A wrong move: the piece goes back with a shake and a red flash, the line
  «مش دي» and (in the streak) a heart lost. A right move: a green flash, the reply
  is played by itself after 0.5 s, and so on until the end: «✅ اتحلّت!» with
  confetti through `afterReveal`. A 💡 hint shows the piece to move (and costs
  the puzzle its "clean" mark). «شوف الحل» plays the line.
- Views `setup-chesspuzzles` and `play-chesspuzzle`, `VIEW_META` entries,
  `validViews` / reload through `soloRegister('chesspuzzle', …)` (resume the same
  puzzle at the same move).
- A catalog entry `chesspuzzle` in the `brain` group, icon 🧩 (a chess icon clash is
  not an issue: شطرنج is ♞), accent like شطرنج's, `modes: ['device']`, players
  [1,1]; `cat_chesspuzzle` fits two lines (GEMINI.md *The catalog*).
- The setup screen: three ways - «لغز اليوم», «سلسلة الألغاز», «ألغاز من
  أخطائك» - and a free puzzle by level (سهل / متوسط / صعب), dealt through
  `freshPick('chesspuzzle_' + level, …)`.
- `GAME_RULES`, `HELP_ENTRIES`, `HELP_FOR_VIEW` for it (the rules as an ordered
  list, so the first-play card works).

## T3.3 - The daily puzzle

- One puzzle a day, the same on every phone: level 2 on most days, level 1 on
  Saturday and level 3 on Friday, picked with `soloRng(soloDaySeed('chesspuzzle'))`
  from its level. Daily rules as every other game (`soloDailyResume`,
  `soloDailySetAside`, `soloMarkDaily('chesspuzzle', { solved, tries, hint })`).
- `DAILY_GAMES` line: `♟️ ✅` solved first try, `♟️ ✅ 2` (tries), `♟️ 💡` with a hint,
  `♟️ ❌` gave up.

## T3.4 - The streak

- «سلسلة الألغاز»: 3 hearts, no clock; the puzzles start at rating ~500 and each solved
  one moves the target rating up by 60-80 (pick the nearest unseen puzzle to the
  target); a wrong move costs a heart and the puzzle is over (the next one comes);
  3 wrong = the end: the score (puzzles solved), the best kept with
  `soloRecord('chesspuzzle', 'streak', …)`, the result sheet with share
  («♟️ سلسلة الألغاز: 14»). A reload keeps the run.

## T3.5 - Puzzles from your own mistakes

- From the kept games' reviews (`ashryChessGames_v1`, each `review.moves[i]` with
  `cls` 'mistake' / 'blunder' and `best`): the position before the move (rebuild
  with `chessReviewBegin(rec).positions[i]`), your side to move, the solution the
  engine's best move (one move only; accept any move whose `chessAnalyse` score is
  within 50 cp of the best as right too). Only your own moves (`rec.me`) or both
  sides in a two-on-one-phone game. The newest first; a solved one is marked and
  moves to the end. «ألغاز من أخطائك (7)» shows the count; with none, a line says
  play and review a game first.
- The review screen gets «جرّبها كلغز» on a mistake or blunder move, opening that
  one.

## Report
`notes/phase-reports/batch3.md`.
