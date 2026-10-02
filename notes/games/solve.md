# One sets, everyone solves (خمن الكلمة, خمّن الرقم, خمّن الدولة, فوازير إيموجي in rooms)

Moved from GEMINI.md on 30 Sep 2026. GEMINI.md keeps the rules that apply to every game and an index; this file keeps the detail, word for word.

## From GEMINI.md: The owner's specs, as built

- **One sets, everyone solves** - the owner's decisions of 23 Sep 2026,
  asked one by one (*One sets, everyone solves*):
  - **المشنقة's room way made an engine**: a setter writes or picks a
    secret, every other phone solves it **on its own board** (never seeing
    the others' guesses, only how far each is), **the setter moves round the
    table**; or **a race on the app's pick** (nobody sets). **A lobby choice,
    "one sets, the rest solve" by default.** A future game of the kind is a
    plug-in. Hangman may move onto it if that is clean and safe - left as it
    is, decided here (below).
  - **Scoring like المشنقة's race, in both ways**: each solver **10 + a bonus
    by order** (+5 first, +4 ... +1); **the setter 5 for every player who
    didn't solve it**; on a tie on the board, **more rounds solved first**
    (the review of 1 Oct 2026: tries are summed over solves only, so fewer
    solves used to win the tie), then **fewer tries**.
  - **خمن الكلمة**: the setter types a word, everyone guesses in their own
    grid with the right / present / absent colours; the race deals from the
    Wordle lists; the keyboard follows the word's alphabet.
  - **خمّن الرقم**: the setter picks a number in the host's range, everyone
    guesses with higher / lower on their own phone; the race: the app picks.
  - **خمّن الدولة**: the setter picks a country from the table (searchable,
    both languages), everyone guesses from the flag or by distance (the
    host's choice) with the one-phone game's hints; the race: the app picks,
    tiers like the one-phone game's.
  - **فوازير إيموجي written by a player**: an answer, its kind (a chip: a
    film, a proverb, a dish, a place, a thing) and its clue in emoji only; a
    clue that spells the answer is refused; guesses typed and judged by
    `guessVerdict` (right / close, "🔥 قريب") with retries; the race uses
    `EmojiRiddles.js`. **The existing emoji quiz stays**; a new way of the
    same game rather than a separate entry is preferred.
  - **3, 5 or 10 a game and a clock off / 60 / 90 seconds** like المشنقة
    (sensible per game); the host can skip a quiet setter; a setter who leaves
    before setting hands it on; fewer than two ends the game; latecomers
    watch.
  - **The TV** shows the setter, the shape of the secret where it has one,
    each player's progress (tries, the order they solved in) - never a
    guess's content that would give the secret away.
  - **Hidden information**: the secret on the server and the setter's phone
    only, each board on its own phone only, `shared` progress only; a Wordle
    solver's colours and the number's higher / lower worked out on the
    server.
  - Decided here (open to change, each one place in the code):
    - **المشنقة stays on its own code** (`RoomHangman.js`): moving it would
      change its shared fields (`len`, `shape`, `progress.n` / `miss`), its
      actions (`setWord`, `whole`) and its tests for nothing a player would
      see; the engine is its generalisation, and a later move is a plug-in.
    - **فوازير إيموجي plays three ways in a room**: «واحد يكتب» (the
      default), «سباق» (the app's riddles, each guessing on their own phone)
      and «مسابقة» (the quiz as it was, wrong guesses shown to the table). The
      race is on the engine rather than being the quiz because the quiz shows
      everyone's wrong guesses, which the owner's engine does not. A phone
      too old to send the way starts the quiz, as before.
    - **The tries**: خمن الكلمة 6, or 7 for a word of 7 or 8 (the one-phone
      game's); خمّن الرقم two more than halving needs (8, 9, 12 for 1-50,
      1-100, 1-1000); خمّن الدولة 6 from the flag, 8 by distance (the
      one-phone game's); فوازير إيموجي 6. Out of tries is a miss, so the
      setter's points mean something even with no clock.
    - **"Fewer tries" is the tries it took to get the ones a player got**,
      summed over the game (`shared.tries`); a miss adds nothing.
    - **A written word is checked for its length (5-8) and its letters (one
      keypad), not against a dictionary**: the one-phone game takes any guess
      too, and a list would refuse names and dialect. Guesses are the same:
      the right length on the word's keypad. A repeated guess costs nothing.
    - **ه is not ة in خمن الكلمة**: a key each, as on one phone (only أ إ آ ٱ
      fold to ا).
    - **The ranges**: 1-50, 1-100 (default), 1-1000; the race's number is
      picked at random. **The clocks**: خمن الكلمة 90 or 120 seconds (typing
      five letters six times takes longer), the others 60 or 90.
    - **What the table sees of a board**: its tries, its state and its place;
      for خمن الكلمة the colours of each row without the letters (a Wordle
      grid as people share it); for خمّن الدولة the closest a player has come
      as a percentage and, since 2 Oct 2026 (idea 450, the small map), each
      wrong guess as a pin on the TV's map - its country and one of five
      colour steps (`progress.pins`, `flagsStep`), never the kilometres and
      never the right guess (notes/games/solo.md). For خمّن الرقم the tries only - another solver's
      narrowed range would give the number away - and the same for the
      riddles.
    - **The flag is the clue itself** in the flag way, so it reaches every
      phone and the TV as the flag emoji (two regional letters: a phone that
      reads its own traffic sees what the screen shows it anyway); by
      distance nothing is shown.
    - A riddle's clue is up to 40 characters of emoji (keycaps, families and
      skin tones included), the answer 2 letters to 8 words; the letter emoji
      (a flag's regional letters, 🅰️, 🆗 …) may not spell the answer or a word
      of it.
    - A setter may pick any country; the race asks tier 1 (easy, the
      default) or every country (hard).

### One sets, everyone solves

The owner's decisions are in *The owner's specs*. خمن الكلمة, خمّن الرقم and
خمّن الدولة are rooms of their own (`room-wordle`, `room-guessnum`,
`room-flags`); فوازير إيموجي's written riddle and its race are two ways of the
emoji room (`room-emoji`), whose third way is the quiz.

- **`SolveGames.js`** (shared, no DOM): what each game adds that the page and
  the server both need. `svWordleFold` (marks off, أ إ آ ٱ as ا, capitals),
  `svWordleAlpha` / `svWordleProblem` (5-8 letters on one keypad of
  `WORDLE_LAYOUTS`), `svWordleColours` (c / p / a a letter; greens first,
  each yellow using up one of the letters left), `svWordleTries`;
  `SV_NUM_RANGES`, `svNumTries`, `svNumVerdict`; `svCountryPool`,
  `svFlagHintsAt`, `svCountryLetter`; `SV_EMOJI_KINDS`,
  `svEmojiAnswerProblem`, `svEmojiClueProblem` (emoji only - pictographs,
  flags, skin tones, joiners and keycaps are taken out and nothing may be
  left - and its letter emoji, read as letters by `svEmojiLetters`, may not
  spell the answer). `SV_CLOCKS` per game. The Arabic marks are built from
  their char codes (*Traps*).
- **`RoomSolve.js`**, the engine. `shared.solve` names the game on it (the
  emoji room's quiz has none: `svKindOf`, and `svEmojiOnEngine` says which
  way an emoji move goes - a start by its `way`, anything after by the
  room). Phases `setting` (the setter's form; the host's `skipTurn` moves on)
  → `solving` (`guess` from each solver, `closeRound` from the host, the
  clock) → `result` (`nextRound`) → `gameover` (`playAgain` keeps the
  settings). A plug-in in `SOLVE_KINDS` gives `options`, `check` (the
  setter's payload to a secret, or an Arabic error), `deal` (the race's pick,
  through `nextPrompt` - the emoji race shares the quiz's memory key), `pub`
  (what the table may see), `board`, `tries`, `guess` (`'won'`, `'miss'` or
  `''` for nothing - a repeat, which costs no try), `view` (the board as its
  own phone sees it), `progress` (what the table sees besides the tries),
  `reveal` and `mine`. Secrets: `room._solve = { secret, boards }`; each
  solver's `room.secrets[pid] = { board, state, n }` through the solving and
  the result, the setter's `{ mine }` while the others solve. Every move
  carries `round` (`staleTap`), `nextRound` too. The board is `svBoard`:
  `scoreboardOf` with `solves` (`shared.solves`, rounds solved) and `tries` on
  each row; a tie goes to more solves, then fewer tries.
- **`JS_RoomSolve.html`**: one renderer (`svRender`, `svTvFrame`) and the
  four games' pieces - the setter's forms (`svSetFormHtml`: the secret typed
  as dots with an eye, as المشنقة's; the country search with 🎲; the emoji
  chips and a live preview), a solver's board (`svBoardHtml`: the one-phone
  Wordle grid and keys with a draft row typed in place - `svWordleKey`, the
  computer's keyboard too; the number's range narrowing and its history; the
  flags rows and the search; the riddle and its tries), the public part
  (`svPubHtml`) and the secret (`svSecretHtml`). **What a phone is typing
  is never redrawn under it**: the frame's signature (`svSig`) is this
  phone's own state, and the table's progress, the host's buttons, the
  board between rounds and the clock are refreshed in place
  (`svPaintLive`). The emoji room's router (`svRouter: true` on
  `ROOM_GAMES.emoji` / `TV_GAMES.emoji`) reads the quiz's renderer when it
  needs it (`svQuiz()`: `window.EMOJI_QUIZ_ROOM` / `EMOJI_QUIZ_TV`, which
  JS_RoomQuiz publishes) and hands a room on the engine to `svRender`; its
  lobby has the three ways. The quiz chunk runs after solve's and leaves the
  router in place (until 1 Oct 2026 it put the quiz back over it, and only the
  quiz could be played).
  `roomSolveTurn` answers `roomTurnOf`.
- **Motion**: a new Wordle row flips, a verdict pops, a distance counts up
  (`countUp`), a wrong riddle shakes; at the end of a round the secret turns
  over (`svResultHtml`, keyed with `motionFirst`, `data-reveal-ms`) and the
  rows follow it in, the points this phone won fly to its row (`flyPoints`,
  measured against the board it drew earlier in the same deal), the board
  counts up (`animateScoreboards`), and the game ends on the podium with
  confetti for the winner.
- **Layout** (section 32 of `Style.html`): المشنقة's - upright one column,
  the board first; a phone on its side puts a Wordle grid beside its keys and
  the other boards' field beside their tries; from 900px the board beside a
  narrow column of the others, and a Wordle grid beside its keys, sized by
  the screen's height so the whole board is on it. The TV: the public part
  big, a card each under it (`auto-fit`, so a few sit in the middle).
- Tests: `rules.mjs` (the games' rules and the engine), `leaks.mjs`
  (`DRIVERS.solveGame`, `PROBES.solve`: all four both ways), `play-all.mjs`
  (a round of each both ways on a live server).
- **The hot-or-cold man** (خمّن الرقم, the owner, 27 Sep 2026; `gnCharHtml`
  and friends at the end of `JS_GuessNumber.html`, section 44 of `Style.html`):
  a flat cartoon of المشنقة's cast whose band follows the last guess - `far`
  (a scarf, icicles, blue, chattering «برد… برد…»), `mid` (a hand on his chin),
  `warm` (sweat, red cheeks, a fan, «سخن!»), `hot` (flames, drips, a puddle,
  hopping, «قريييب!»), `win` (a party hat, arms up, a jump, «جبتها!») and in a
  room `out` (slumped under a rain cloud), `idle` before a guess; an arrow
  beside him for higher / lower (the feedback text stays). The bands are a
  distance over the range (`gnBandOf`: 25%, 10%, 4%). On one phone the secret is
  there, so it is the real distance (`gnLocalBands`; the friend's way, with no
  range, counts a hundred or twice the number). In a room the phone knows only
  higher / lower: the distance from the guess to the middle of what is still
  possible after it, over 1..max (`gnRoomBands`, replaying the verdicts). He is
  drawn only by `svBoardHtml` (`gnRoomCharHtml`, beside the range in `.gn-duo`),
  so never on the TV (it would hint at a number) or the setter's phone. A change
  of band is a moment keyed with `motionFirst` (`gnMoment`, `--gn-late` so a
  rebuilt board carries on): `is-morph` pops him into his new self (`is-jump`
  on the hit, whose `data-reveal-ms` holds the confetti through `afterReveal`),
  `is-say` says the new line at once, then the bubble comes back every nine
  seconds; `is-new` pops the arrow. A band has a short sound of its own
  (`gnBrr`, `gnHmm`, `gnWarm`, `gnSizzle` in `FX`), on the guessing phone only.
  Decided here: the bands' edges; the man is never shown to anyone but the one
  guessing, and the TV keeps its progress cards as they were.
- **The TV while the setter writes (1 Oct 2026)**: the setting phase on the TV is
  the shared waiting stage `tvWaitStage` (JS_RoomTv.html, `.tv-waitstage*` next to
  `.tv-wait` in Style.html): the setter in a lit chip with their initial and ✍️, the
  line («مستنيين كلمة …») at 5.5vmin, and a big chip for everyone else in the order
  (a ✓ on any the state says is done). `svTvSig` carries the players while setting.

## History

The day-by-day log of the work on this game is in `notes/log.md` (search it for the game's name); a new entry goes there, and anything that changes how the game works goes in this file.
