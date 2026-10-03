# Batch 3 report - T3.2 to T3.5 (the puzzle screen, the daily, the streak, puzzles from your mistakes)

Branch `batch3` (worktree `ashry-b3`). One commit per task; nothing pushed or deployed; `docs/`
untouched (`.preview/` rebuilt for the browser checks). Tests and screenshots are outside the repo in
`C:/Users/TPC/agy-tests/ashry-batch3/ui/` (`lib.mjs`, `cdp.mjs`, `t32.mjs` … `t35.mjs`, screenshots in
`shots/`).

| Task | Commit | Files |
|---|---|---|
| T3.2 The puzzle screen | `8784026` | `JS_ChessPuzzles.html` (new), `Controller.html`, `JS_Core.html`, `JS_Utils.html`, `JS_Catalog.html`, `JS_Chess.html` (the board kept for the puzzle screen), `Style.html` |
| T3.3 The daily puzzle | `57ff84e` | `JS_ChessPuzzles.html`, `JS_Core.html`, `JS_Daily.html` |
| T3.4 The streak | `e41a633` | `JS_ChessPuzzles.html`, `JS_Core.html` |
| T3.5 Puzzles from your mistakes | `83b2b56` | `JS_ChessPuzzles.html`, `JS_Core.html`, `JS_ChessReview.html`, `Style.html` |

## How it was checked

- Headless Chrome over CDP on the built preview (port 4344), a fresh browser context per size:
  375×812 Arabic light, 667×375 English dark, 1280×720 English dark. Real mouse events for taps and
  drags (`Input.dispatchMouseEvent`), `prefers-reduced-motion: no-preference`.
- `cd tools && npm run check`: no problems, i18n OK. `cd rooms-worker && npm run test:rules`: pass
  (exit 0, the leak check included; no rules file touched).
- Every edited page file parses (`vm.Script` per `<script>`; `Controller.html` excepted as always).
- No console errors in any run.

## T3.2 - the puzzle screen
- The chess board (`chViewShow`, input through `chTapLogic` / `chDropLogic`), the player's colour at the
  bottom, «دورك: الأسود يلعب ويكسب» / «… ويموّت في 2» on top: **VERIFIED** (`ar-375-2-l1-start.png`,
  Black at the bottom with h-a).
- A level 1 by taps, a level 2 with the reply by drag, a mate in 3 by drags (a promotion through the
  picker in the streak): **VERIFIED** at all three sizes (t32 / t34).
- A wrong move: shake back, red square and red frame, «مش دي»; a second tap on the square and a wrong
  drop: counted once each (wrong = 1, then 2 after the drop, board unchanged): **VERIFIED**
  (`ar-375-4-wrong.png`).
- A right move green, the reply by itself after 0.5 s, «✅ اتحلّت!» with confetti after the move lands:
  **VERIFIED** (`*-7-right.png`, `*-9-l2-solved.png`, `*-11-mate3-solved.png` - the mated king toppled).
- 💡 circles the piece and says «حرّك الفيل»; «شوف الحل» plays the line: **VERIFIED**.
- A reload mid-puzzle (after the reply) comes back to the same puzzle and move and is solved from there:
  **VERIFIED** at all sizes.
- 🧊 3D inside a puzzle, solved there by taps: **VERIFIED** (`*-13-3d.png`, `*-14-3d-solved.png`).
- Catalog entry in `brain`, `modes: ['device']`, `[1,1]`, two-line description, `GAME_RULES` (an ordered
  list; the first-play card shows it), `HELP_ENTRIES`, `HELP_FOR_VIEW`, `VIEW_META`: **VERIFIED**
  (`ar-375-1-setup.png`); nothing off the screen on the setup at any size.

## T3.3 - the daily puzzle
- Seeded from `soloDaySeed('chesspuzzle')`, level by weekday (Sat 1, Fri 3, else 2): **VERIFIED** (the
  hub dealt the puzzle `chPzDailyPuzzle()` predicts; the level function by construction).
- Played once: a free puzzle over it sets it aside, «كمّل» resumes it with its wrong try kept, a reload
  keeps it, and once done it isn't dealt again: **VERIFIED** (t33 at all sizes).
- `soloMarkDaily('chesspuzzle', { solved, tries, hint })` and the hub line `♟️ ✅ 2`, the sheet with
  share; the archive (yesterday) given up → `♟️ ❌`, nothing recorded: **VERIFIED**
  (`*-d4-sheet.png`, `*-d5-hub-done.png`, `*-d6-archive-gaveup.png`).

## T3.4 - the streak
- 3 hearts, no clock, the first puzzle rated 500, +60-80 a solve (targets 560-580 seen), the nearest
  unseen: **VERIFIED**. No hint and no «شوف الحل»: **VERIFIED**.
- A wrong move costs one heart (a second tap nothing more), the solution plays, «اللغز اللي بعده»:
  **VERIFIED** (`*-s3-wrong.png`, `en-667-s4-solution.png`).
- A reload keeps the run; three wrong ends it; the sheet shows the score, the marks, share text
  «♟️ سلسلة الألغاز: 2», and the best is kept (`soloRecord('chesspuzzle', 'streak')`): **VERIFIED**
  (`ar-375-s5-sheet.png`).

## T3.5 - puzzles from your mistakes
- A game against the computer (400) whose later moves were the worst the engine saw, resigned, reviewed;
  «🧩 جرّبها كلغز» on my mistake opened the position, the game's own move was refused, the best solved
  it, it was marked, «ارجع للمراجعة» went back to the same move: **VERIFIED** at all sizes
  (`*-m1-review-button.png`, `*-m2-puzzle.png`, `en-1280-m3-solved.png`).
- The setup's «ألغاز من أخطائك (N)» with the unsolved count; with none, the line says play and review a
  game first; starting takes the first unsolved: **VERIFIED** (`ar-375-m4-setup.png`).
- Any move within 50 cp: every legal move judged in the page, the best accepted, the game's move not:
  **VERIFIED** (each run printed the accepted set; the positions after each move analysed alike, 20,000
  positions, never a second line).
- Only your own moves (`rec.me`), both sides two on one phone: by construction (`mine()` in
  `chPzMistakeList`); **UNVERIFIED** in the browser for a two-on-one-phone game.

## Decisions made here
- **The icon is drawn** (`art:chesspuzzle`): 🧩 is Connections' and ♟️ the chess clock tool's.
- A right move is the line's position or any immediate mate; a wrong move locks the board 0.65 s so a
  double tap counts once.
- No hint / no «شوف الحل» in the streak; its missed puzzle shows the solution and waits for a tap.
- The daily's tries = 1 + wrong moves; «شوف الحل» on the daily is a give-up (❌).
- The mistakes list leaves out the first two moves each from the usual start (the first run turned
  `1. g4` into a "puzzle" where 11 moves counted as right); the review's button still offers them.
- A free puzzle or the daily dealt in the middle of a streak sets the streak's puzzle aside; «كمّل»
  brings it back.
- Found and fixed: `JS_Daily.html` wrote `cat.icon` straight into the hub and the archive, which would
  print "art:chesspuzzle" (now `iconHtml`; the share text uses `dailyIconText`).

## Uncertain / not verified
- On a real iPhone: touch drags on the puzzle board, the share sheet.
- A mistakes puzzle in a quiet position can accept many moves (all within 50 cp) - by the runbook's rule;
  a stricter filter (only positions with one clearly best move) is a small change if the owner wants it.
- `npm run test:ui` (15 minutes) was not run; the chess clock / room paths were not touched apart from
  the review's one extra button.
