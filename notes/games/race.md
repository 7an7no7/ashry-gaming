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
- **The page** (`JS_RoomRace.html`, section 42 of `Style.html`): the lobby
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

## History

The day-by-day log of the work on this game is in `notes/log.md` (search it for the game's name); a new entry goes there, and anything that changes how the game works goes in this file.
