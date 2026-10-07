# سباق ألغاز (the puzzle race)

Moved from GEMINI.md on 30 Sep 2026. GEMINI.md keeps the rules that apply to every game and an index; this file keeps the detail, word for word.

## From GEMINI.md: The owner's specs, as built

- **سباق ألغاز (the puzzle race)** - the owner's decisions of 26 Sep 2026,
  asked one by one (*سباق ألغاز*):
  - **The ten solo puzzles as a race in a room**: خيوط, كلمات من حروف, تشابه,
    إيه اللي يجمعهم؟, الملكات, شمس وقمر, نونوجرام, كاسحة الألغام (the same
    mines for everyone, the first safe patch part of the deal), سلسلة
    الإجابات (the same questions; most right, then fastest) and سودوكو (easy
    only). Not 2048. **The same puzzle on every phone, dealt on the server**;
    each phone solves on its own board with the solo game's own board; the
    table sees only progress.
  - **The ending, a lobby choice**: «الكل يخلّص» (the round ends when everyone
    is done, the engine's way) or **«Fast 3»** (the first three score and the
    round closes); Fast 3 is preselected with five people or more, the host
    can switch.
  - **Points**: Fast 3 pays 10 / 7 / 5, and 2 to anyone done within a
    10-second grace after the third; «الكل يخلّص» keeps the engine's 10 + the
    order bonus. Ties on the night's board: fewer seconds. The podium and the
    night's board are the engine's.
  - **The clock is a backstop, fixed per game** (`SV_RACE_CLOCKS`: about 2
    minutes for خيوط, تشابه, إيه اللي يجمعهم؟ and كلمات من حروف, 3 for
    الملكات, شمس وقمر, نونوجرام, كاسحة الألغام and سلسلة الإجابات, 4 for
    سودوكو); **«استسلم»** marks a phone done with 0; the host keeps the
    room's skip.
  - **Nothing new on the home**: each solo game's card gets a "في غرفة" way
    inside (the mode switch, like خمن الكلمة's); in a room's list **one tile
    «سباق ألغاز»** opens the ten (a family like chess's, `ROOM_HUB_GROUPS`);
    the lobby shows only the puzzle chosen, the rounds (3 or 5) and the
    ending; every race looks the same (the puzzle, one progress strip, one
    podium).
  - **The TV** shows each player's progress bar, the finishing order and the
    clock - never the puzzle's content.
  - Decided here (open to change, each one place in the code):
    - **The levels**: medium everywhere the solo game has one (سودوكو easy,
      the owner's word); a hard nonogram or minefield would outlast the clock.
    - **A mine ends that phone's round with 0** («خسرت» on its screen, the
      round going on for the others), and **four mistakes in تشابه the
      same** - the solo games' own rules; a round can't be cleared by
      tapping everything. **A phone that hit a mine sees only that mine
      until the round is over** (the owner, 30 Sep 2026: the others are
      still clearing the very same field); the whole field comes with the
      result.
    - **إيه اللي يجمعهم؟ and سلسلة الإجابات rank by score, then by time**
      (`svRaceRank`): finishing first with fewer right answers wins nothing.
      Fast 3 closes on the first three *done*, and pays them in score order.
    - **The seconds are the phone's own**, from the deal to its last move
      (`svSecs`), shown on the result and used for the board's ties.
    - A phone out of tries, or on a mine, or that gave up, is «💀» on the
      result; one still solving when the round closes is «⏳» with 0.
    - **A written word in كلمات من حروف is judged against the server's
      banks** (the same dictionary the solo game builds, `wheelDictionary`
      from the bundled lists); a word not in the layout but in the dictionary
      is a bonus ⭐, as on one phone.
    - **سلسلة الإجابات's race asks the room trivia, the emoji riddles and the
      proverbs** - not the team board (its free-text decoys are the page's
      own); ten questions a round.

### سباق ألغاز

The owner's rules are in *The owner's specs*. The ten solo puzzles as a race
on the solve engine (*One sets, everyone solves*): the room ids are the solo
games' own (`sudoku`, `queens`, `tango`, `nonogram`, `mines`, `strands`,
`wordwheel`, `connections`, `pinpoint`, `streak`: `SV_RACE_IDS` in
`SolveGames.js`), the views `room-<id>`, one tile «سباق ألغاز» in the room's
list (`ROOM_HUB_GROUPS.race`, `ROOM_HUB_FAMILIES.race`, a drawn icon
`art:race`).

- **The generators moved into shared files the Worker bundles** (never
  copied): `SoloShared.js` (`soloRng`, `soloShuffle`, `soloPick`,
  `soloCategory` - out of `JS_Solo.html`), `Sudoku.js`, `Queens.js`,
  `Tango.js`, `Nonogram.js` (the pictures too), `Mines.js`, `Strands.js`,
  `WordWheel.js`, `ConnectionsWords.js` (the three banks, out of
  `JS_Connections.html`), `Pinpoint.js`, `QuizStreak.js`; each ends with
  its race plug-in (`SUDOKU_RACE`, `QUEENS_RACE` …): `deal(rnd, st, pick)`
  → `{ pub, …solution }` (the pick through `nextPrompt(s)`, so a puzzle
  doesn't come back until its list has gone round), `board`, `total`,
  `move(b, x, p, st)` → `'won' | 'lost' | ''` (throwing an Arabic error for
  a bad move), `progress` → `{ done }`, `view`, `score`, `reveal`. The
  page inlines them (`SHARED_LISTS`) so the solo games run on the same code.
- **`RoomRace.js`** (bundled last): `svRaceKind(id)` wraps a plug-in into a
  `SOLVE_KINDS` entry with `race: true` (no setter: every round is the
  app's deal; `tries()` 0 = unlimited; the progress carries `total` and
  `score`); `SV_RACE_IDS.forEach(id => SOLVE_KINDS[id] = svRaceKind(id))`.
  The engine (`RoomSolve.js`) learnt the race: `svOptions` takes the lobby's
  `finish` ('all' | 'fast3') and rounds (3 / 5) and fixes the clock from
  `SV_RACE_CLOCKS`; `shared.race`, `startAt`, `closeAt` (the grace's end),
  `secs`; `move` is the race's guess (a phone sends its board or its pick
  after every change; the server judges); `giveUp` marks a board done with
  0; `svRaceCheckClose` closes Fast 3 (the third done starts
  `SV_RACE_GRACE_MS`); `svRaceRank` (score, then finish order) pays
  `SV_RACE_POINTS` [10, 7, 5] and `SV_RACE_GRACE_POINTS` 2, or the engine's
  10 + `SV_SPEED_BONUS` in «الكل يخلّص»; `svBoard` sorts a race by score,
  then rounds solved, then seconds (the review of 1 Oct 2026: seconds are summed
  over solves only, so fewer solves used to win). A board's finishing place is
  stamped at the solve (`b.svPlace`, server only) and the grace is read from
  it: a podium finisher who leaves no longer lifts a grace finisher to 5.
  خيوط's deal records only the theme it plays in the prompt memory (it took
  eight a deal), and كلمات من حروف's bonus takes `WHEEL_BONUS_WORDS` too. A board is done at `b.at` (the server's time) - a plug-in's
  board must not use `at` for anything else (*Traps*).
- **The page** (`JS_RoomRace.html`, section 42 of `Style_Chess.html`): the lobby
  (`raceLobbyHtml`: rounds, the ending; `recallOptions('raceRoom')`), the
  screen (`raceRender`: the strip - round, ending, clock - the game's own
  board in its race stage, the progress rows `raceRowsHtml` (a bar a player,
  `scaleX`), «استسلم», the host's «اقفل الجولة», the done card, the closing
  band «باقي 10 ثواني…», the result (`raceResultHtml`: the reveal, the rows
  with seconds and points), the podium), `racePaintLive` (rows, clock and
  buttons refreshed in place so the board is never redrawn under a finger),
  and the TV (`raceTvFrame`: the bars, the order, the clock, never the
  puzzle). **Each solo game registers `RACE_UI.<id>`** in its own file:
  `stage` (the element id its board is drawn into: the race stage is the same
  id inside `#view-room-<id>`, and `soloStage(id)` finds the race's while a
  race is on - the race views come before the solo views in
  `Controller.html` for that), `unit` (the rows' word), `fresh(pub,
  settings)` (a solo state from the deal), `sync(s, board, fx)` (the
  server's answer onto the state: found words fly, a group flies, a wrong pick
  shakes), `paint`, `finished(s, won)`, and for games that need it
  `snapshot` / `miss` (a refused move plays its miss). The solo game's own
  state lives in `appState.race = { key, kind, s }` while a race is on
  (`soloRaceState(kind)`); its move functions send `raceMove(kind, payload)`
  where the solo game would judge. `RACE_UI` is on `window`
  (`JS_Connections.html` loads before `JS_Solo.html`).
- The ten games have `modes: ['device', 'room', 'tv']` and `players: [1,
  12]` in the catalog, a mode switch on their setup screens, `room: true` on
  their help entries with a race sub-section in `GAME_RULES`,
  `HELP_FOR_VIEW` for `room-<id>`, `roomTurnOf` through `roomSolveTurn`,
  `roomPlayerLeft` through `svPlayerLeft`.
- Tests: `rules.mjs` (the engine: Fast 3's close, grace and points, «الكل
  يخلّص», «استسلم», the clock, the seconds' tie, leaving, play again; every
  game's deal, a bad move refused, progress, a win, a loss), `leaks.mjs`
  (`RACE_PROBES`: the solution on no phone until it has solved it, a board
  on its own phone only, the table's progress without content; a driver a
  game through Fast 3 with the grace, «استسلم», the host's close, the clock,
  a leaver and «الكل يخلّص»), `play-all.mjs` (`--only=race`, or
  `--race=<game>`: a round of each on a live server). Looked at in headless
  Chrome (three phones and a TV through a race of each game) at 375×812
  Arabic light and 1280×720 English dark, a reload mid-race, Help, no console
  errors.
- **The TV during a race (1 Oct 2026, the owner's sheet)**: a card a player
  (`raceTvCardsHtml` in `JS_RoomRace.html`, `.race-cards` / `.race-card` in section
  42) in a grid that takes the stage's height - one column for 1-3 players, two from
  4, three from 7 (`.race-cards--c1/2/3`, rows grow to 25vmin): a bubble with the
  initial (👑 on the leader: the first finished, else the furthest on), the name at
  4vmin, a thick bar (the strip's `race-row__bar`, scaleX) and the count big
  (n/total); a finished card turns green with ✅ its place and time, a lost one
  fades with ⏳/💀; a card that finishes pops once (`motionFirst`). The round and the
  ending are pills at the top, the clock a big accent pill read in minutes
  (`data-sv-clock="mmss"`, painted by `svTickClock`, red under 10 s), and the
  ending's rule (`race_finish_all_hint` / `race_finish_fast3_hint`) is the line at
  the foot. The result and the podium frames are as they were.

## «خماسي السهرة» - a different puzzle each round: built 2 Oct 2026 (the owner's answers of 2 Oct 2026)

Picked from the ideas page of 2 Oct 2026 (https://claude.ai/artifact/7Mhgw1ePSi3GhgEvDcSHxz, idea numbers in brackets) and every rule asked.

- **(454) A lobby choice where every round is a different puzzle**:
  - **The app draws the line-up, all different, from the ten; the host can tap one to change it**; every phone sees the line-up before Start.
  - **3 or 5 rounds** (the race's own choice); **each round gives the race's usual places and points, the totals make the podium**; the ending rule («الكل يخلّص» / the fast three) applies to every round.
  - 2048 stays out (the 26 Sep decision).

How it is built:

- **The server** (`RoomRace.js`, the end): the lobby's action `raceLineup` (host only, lobby only, routed
  through `solveAction`): `{ on: true, rounds }` draws `room.shared.lineup` (`svRaceLineupDraw`: what is
  there kept, else the puzzle the lobby was opened with first, the rest shuffled from the ten), or resizes
  it keeping the ones there; `{ at, was }` swaps one for a random puzzle not in it (`was` guards a double
  tap, `staleTap`); `{ on: false }` puts it away. `svRaceOn` leaves out a game switched off for a fix.
  At the start `svNewGame` (`RoomSolve.js`) takes the lobby's line-up if `svRaceLineupOk` (3 or 5
  different race ids) into `settings.lineup`; `rounds` is its length and `shared.solve` its first puzzle.
  Before every deal `svDeal` calls `svRaceRoundKind`: `shared.solve` = the round's puzzle and
  `settings.clock` its `SV_RACE_CLOCKS`. Everything else is the race as it was - each puzzle dealt by its own
  plug-in when its round starts, the same places, points, ending, «استسلم», clock and leaving; the scores,
  seconds and solves add up across the rounds on `shared.board`, so the podium and the night's points are
  the totals. **`room.game` stays the puzzle the lobby was opened with** (the room's game for the night's
  table, the crew and the program); only `shared.solve` changes.
- **The page** (`JS_RoomRace.html`): `raceKindOf(state, kind)` - a line-up's round is drawn by
  `raceRender` / `raceTvFrame` as a race of `shared.solve`, on that puzzle's own screen `room-<id>`
  (`soloRaceKind` in `JS_Solo.html` reads `shared.solve` now, not `state.game`). `roomChunksOf` in
  `JS_Room.html` loads every puzzle of the line-up with the room's chunks (in the lobby already), so the
  next board is there when its round is dealt. A `ROOM_GAMES` entry may give `lobbyTop(state, tv)`, drawn
  above the folded options on the phone (`renderChosenGame`) and in the TV's lobby (host or not):
  the race's is `raceMixLobbyHtml` - the line-up, numbered, each puzzle a button for the host
  (`raceMixSwap`, 🔄), popping in once (`motionFirst`). The options get «الألغاز: لغز واحد / خماسي
  السهرة» (`raceMixSet`); the rounds' choice resizes the line-up while it is on. During the game
  `raceMixStripHtml` (under the head, phone and TV) shows the line-up, the puzzles played dimmed, this
  round's with its name. Between rounds `raceNextHtml` (phone and TV, after the result card) announces the
  next puzzle: once the result has turned (`afterReveal`), `raceNextSpin` runs its name through the ten
  with `spinLetter` and lands it, its icon popping in (`motion-landed`). Words: `RACE_MIX_TEXT` (`rmT`).
- **The shell's budget**: the race's own words (`race_lobby_*`, `race_finish_*`, `race_you_*`,
  `race_give_up*`, `race_closing`, `race_watching`, `race_round_over`, `race_clock_hint`) moved out of
  `TRANSLATIONS` into `RACE_TEXT` in `JS_RoomRace.html`, joined into `TRANSLATIONS` when the chunk loads
  (only that file read them), which pays for the rest: the first visit is 710.06 KB, as before. The help
  line is `RACE_MIX_RULE` (JS_Core.html), interpolated into each puzzle's race rules in both languages.
- Tests: `rules.mjs` (pentathlon: the draw, the resize, the swap and its double tap, only the host, off,
  the start on the lobby's line-up and its clocks, each round its puzzle, nothing of the next dealt at a
  result, the points, the totals and the tie, play again, a bad line-up ignored); `leaks.mjs`
  (`VARIANT_DRIVERS['race:mix']`, `PROBES['race:mix']`: every round held to its puzzle's race probes, the
  line-up names only, at a result the only puzzle on a phone is the one just played); `play-all.mjs`
  (`--only=race`, or `--race=mix`: the line-up and the swap on every phone and the TV, three rounds of
  three puzzles on their clocks, play again).
- Decided here (open to change, each one place in the code):
  - **The puzzle the host opened the lobby with is first in the line-up** (`svRaceLineupDraw`); a swap can
    change it.
  - **A swap draws at random** from the puzzles not in the line-up (not the next in a list).
  - **Play again keeps the line-up** (`svNewGame`, the table saw and agreed it); a new line-up is
    «لعبة تانية» and the lobby.
  - **The choice isn't remembered on the host's phone** (it is the server's, in the lobby): one tap each
    time.
  - **A game switched off for a fix is never drawn** (`svRaceOn`), nor dealt from a line-up drawn before it was switched off: `svRaceLineupOk` refuses such a line-up at Start and play again, and the game falls back to one puzzle every round (6 Oct 2026, the audit).
  - **English name**: "Puzzle pentathlon" (also with 3 rounds).
  - The next puzzle is announced on the result screen (beside «اللي بعده»), not as a splash over the new
    round, so nobody loses solving time; the header of a TV still names the room's game.

## The ideas of 7 Oct 2026, second batch (the owner's picks): built - part two

- **(1184) «استسلم» can be taken back.** A tap holds the give-up on the phone for 3 seconds (`RACE_GIVE_UP_HOLD_MS`) with «🏳️ بتستسلم… هتاخد 0 الجولة دي», a bar emptying (scaleX) and «↩️ رجّعني» (`raceGiveUp`, `raceGiveUpCancel`, `raceGiveUpHtml`, painted in place in `[data-race-giveup]` by `racePaintLive`); only then is `giveUp` sent. The old confirm is gone (the hold replaces it). A new round or deal, a board that finished, or the room moving on drops the hold (`raceRoom.giving`, keyed on code|deal|round). The server is unchanged: a give-up that arrives still counts at once.
- **(1185) The last round counts double** - the owner: a lobby switch, ON by default. «الجولة الأخيرة بالدبل» (بالدبل ×2 / عادي) in the host's race options, remembered with the others (`raceOpts().double`, sent as `double` in the start payload). The server's `settings.double` (RoomSolve.js `svOptions`: anything but `false` keeps it on, play again keeps it) and `svRaceDouble(s)`: in the race's last round every finisher's points ×2 - «الكل يخلّص»'s 10 + bonus and Fast 3's 10/7/5 and the grace's 2 alike - and `result.double`. Between the last round but one and the last, the phones and the TV show «الجولة الجاية الأخيرة، ونقطها بالدبل!» with ×2 spinning in through ×1…×10 (`raceDoubleHtml`, `raceDoubleSpin` via `spinLetter`, after the result turns); the last round's head carries «🔥 ×2» (the TV a pill), its result «🔥 ×2». The rules line is in `RACE_MIX_RULE` (app/JS_GameRules.html), shown in each puzzle's race rules. Tests: rules.mjs «race/double».

## The ideas of 7 Oct 2026, third batch (the owner's picks): built

- **(1189) Done? Know where you stand.** The done card says the place as a word, big, with the time: «التاني ✅ 1:42» (`raceOrdinal`: الأول … العاشر / 1st … 10th, `race_places` in `RACE_TEXT`; past ten «المركز 11»), and under it the round's time left - «الجولة تخلص في 1:20», or «الجولة بتقفل في 0:08» once Fast 3's third is in (`raceDoneLeftHtml`, painted in place by `racePaintLive` into `[data-race-left]`, its `[data-sv-clock="mmss"]` ticked by `svTickClock`, red under 10 s). A lost or given-up card keeps its line and gets the time left too. `.race-done__place`, `.race-done__left` in section 42 of `Style_Chess.html`.
- **(1190) The progress on a phone on its side.** A line of initials with mini bars across the top (`raceMiniHtml` into `[data-race-mini]` under the head, painted in place): each player's first letter in a bubble over a thin bar (scaleX), the bubble green with the place once done (popping once, `motionFirst`), this phone ringed. Shown only at `(orientation: landscape) and (max-height: 500px)`, where the rows in the side column (`[data-race-progress]`) are hidden; upright and on a big screen nothing changed. The TV is unchanged (it has its own cards).


## History

The day-by-day log of the work on this game is in `notes/log.md` (search it for the game's name); a new entry goes there, and anything that changes how the game works goes in this file.
