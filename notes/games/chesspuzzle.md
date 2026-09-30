# ألغاز شطرنج (id `chesspuzzle`)

Moved from GEMINI.md on 30 Sep 2026. GEMINI.md keeps the rules that apply to every game and an index; this file keeps the detail, word for word.

## From GEMINI.md: The owner's specs, as built

- **ألغاز شطرنج (chess puzzles)** - the owner's plan of 24 Sep 2026, approved
  as a whole (*ألغاز شطرنج*):
  - **Puzzles made by the app's own engine at build time**, nothing to look
    after: `ChessPuzzles.js`, 1,505 of them (540 easy, 540 medium, 425 hard),
    from `tools/make-chess-puzzles.mjs` (`npm run build:puzzles`, by hand).
    Every step has exactly one winning move.
  - **Levels easy / medium / hard**; a free puzzle of a level is dealt
    through `freshPick`.
  - **A puzzle of the day in تحدي اليوم**: the same on every phone, medium on
    most days, easy on Saturday, hard on Friday; played once; its line ♟️ ✅,
    ♟️ ✅ 2 (the tries), ♟️ 💡 (a hint), ♟️ ❌ (gave up).
  - **«سلسلة الألغاز»**: 3 hearts, no clock, harder as it goes (from about 500,
    60-80 more a solve), the best kept on the phone.
  - **Puzzles from your own mistakes**, from the review, and «جرّبها كلغز» on
    a mistake in the review.
  - Decided here (open to change, each one place in the code):
    - **The icon is drawn** (`art:chesspuzzle`, a knight on the corner of a
      green board with a gold star): the runbook's 🧩 is Connections' icon and
      ♟️ the chess clock tool's, and a new icon must not repeat another's.
    - **A right move** leads to the same position as the line's (castling by
      the rook counts), **or mates at once** (a mate in 2 found another way).
    - **A wrong move counts once**: the board takes no move for 0.65 s while it
      shakes back (`CHPZ_LOCK_MS`), so a double tap can't cost two tries or two
      hearts.
    - **No hint and no «شوف الحل» in the streak**; a wrong move there plays
      the solution, then «اللغز اللي بعده» on a tap (a pause to look).
    - **The daily's tries** are 1 + the wrong moves; a hint shows as 💡
      whatever the tries; «شوف الحل» is a give-up (❌).
    - **Mistakes**: "any move within 50 cp" is judged by analysing the position
      after it and the position after the best alike (20,000 positions each),
      never from a second line; the move played in the game is always wrong;
      **the first two moves each from the usual start are left out of the
      list** (there nearly every move is as good as the best: "find a better
      first move" is no puzzle) - the review's button still offers them.
    - A free puzzle (or the daily) dealt in the middle of a streak puts the
      streak's puzzle aside, and "continue" brings it back.

### ألغاز شطرنج

The owner's plan is in *The owner's specs*. `JS_ChessPuzzles.html` (included
after the chess files), the bank `ChessPuzzles.js` (inlined into the page,
`SHARED_LISTS`, never the rooms server), section of `Style.html` just before
section 33 (`.chpz-*`). The game's id is **`chesspuzzle`**, the screens
`setup-chesspuzzles` and `play-chesspuzzle`, the state `appState.chesspuzzle`
(registered with `soloRegister`), every name `chPz` / `CHPZ_`, every string
`chpz_*`.

- **The bank** (`CHESS_PUZZLES`): `{ id, fen, moves (UCI: player, reply,
  player …), theme: 'mate' | 'material', mateIn?, level: 1-3, rating }`; the
  side to move is the player. `tools/validate-content.js` checks every line.
  `chessAnalyse(g, { lines: n })` gives real scores only inside its first n
  lines (moves outside get a bound): judge alternatives by analysing the
  position after each (T3.1's finding, used by the mistakes).
- **The board is the chess game's** (`chViewShow` with a model like the one
  phone's: `key: 'puz|' + uid`, an `anim` per move, marks for the flash and the
  hint): 2D by default, 🧊 3D a tap away (the same `chessLook`), the tools on
  the board. `JS_Chess.html`'s `onLeaveScreen` keeps the board for
  `play-chesspuzzle`. Input is `chTapLogic`; a drop is judged here first
  (`onDrop`), so a wrong drop returns false and the board slides it back with
  its shake (a promotion still goes through `chDropLogic`'s picker).
- **What has been played is `s.hist`** (UCI), the position rebuilt from the FEN
  each paint (`chPzGame`), so a reload is the same puzzle at the same move;
  `chPzAfter` plays what comes by itself - the reply 0.5 s after a right move
  (hist odd), or the next move of a solution being shown (`s.showing`) - and
  runs again on a reload. `chPzJudge` says right (the line's position, a mate
  at once, or a mistake's alternative through `chPzAltOk`) or wrong.
- **Modes** (`s.mode`): `free`, `daily` (`chPzStartDaily`, `chPzDailyLevel`,
  `chPzDailyPuzzle` from `soloDaySeed('chesspuzzle')`; `soloDailyResume` /
  `soloDailySetAside` / `soloMarkDaily`; `DAILY_GAMES` line `chPzDailyLine`),
  `streak` (`s.streak`: lives, score, target, seen, marks, over, saved;
  `s.streakRecent` the last 300 dealt; `soloRecord('chesspuzzle', 'streak')`)
  and `mistake` (`chPzMistakeList` from `chLoadGames()`, cached on the stored
  string; `s.mSolved` marks; `chPzFromReview(k)` from the review's button,
  `s.from` for «ارجع للمراجعة»). The mode hooks are plain functions the core
  asks for (`chPzWrongMode`, `chPzSolvedMode`, `chPzNextMode`,
  `chPzDoneBarHtml`, `chPzHeadExtraHtml`, `chPzSideExtraHtml`).
- **Motion**: a right move's square green and the board's frame glowing green,
  a wrong one red with the piece shaken back (`nudge` for a tap), the reply
  sliding, a mate toppling the king, confetti through `afterReveal` once the
  move has landed; in the streak a lost heart jumps and the score pops; the
  result sheets count up (`soloResult`).
- `JS_Daily.html` now draws a game's icon with `iconHtml` (the puzzles' icon is
  drawn) and writes it in text with `dailyIconText` (a drawn icon writes
  nothing: its line carries ♟️).

## History

The day-by-day log of the work on this game is in `notes/log.md` (search it for the game's name); a new entry goes there, and anything that changes how the game works goes in this file.
