# سباق ألغاز — the contract for plugging a solo puzzle into the race

The race (the owner's decisions of 26 Sep 2026, GEMINI.md *The owner's specs*)
rides on the solve engine: `RoomSolve.js` (the rounds, the clock, Fast 3,
«استسلم», the points, leaving), `RoomRace.js` (the registry: `RACE_RULES`,
`svRaceKind`), `JS_RoomRace.html` (the phones and the TV: the frame, the
strip, the result, the podium) and `JS_Solo.html` (`RACE_UI`, `soloRaceState`,
`soloStage`). **Nothing in those four files changes for a new game.** Two games
are built and are the model: **الملكات** (`Queens.js`, `JS_Queens.html`: the
phone plays its own board and sends the whole board after every change; the
server counts and says "won") and **خيوط** (`Strands.js`,
`JS_WordSearch.html`: the words stay on the server, every traced line is
sent and judged, the found words come back). Read both before writing.

## What each game adds

1. **A shared file** at the root, `Sudoku.js` / `Tango.js` / `Nonogram.js` /
   `Mines.js` / `WordWheel.js` / `Pinpoint.js` / `QuizStreak.js` (and
   `ConnectionsWords.js` for the three Connections banks): the generator and
   the judging rules **moved** out of `JS_<Game>.html` (never copied - the page
   keeps only its setup, its board and its taps), pure, no DOM, nothing that
   runs at load, every name prefixed as before (`sudoku*`, `tango*`, `nono*`,
   `mines*`, `wheel*`, `pin*`, `streak*`, `conn*`). It draws with
   `SoloShared.js` (`soloShuffle`, `soloPick`, `soloRng`, `soloCategory`) and
   the lists the Worker already bundles (`FILES` in `rooms-worker/build.mjs`:
   Chameleon, Wordle, Stop, Monkey, spy, trivia, emoji, proverbs…). A page-only
   list a generator needs (`CONNECTIONS_*`, `TRIVIA_BOARD_BANK` in
   `JS_TriviaBoardBank.html`, `DESCRIBE_DB`…) is moved into a shared file too
   or the race does without it - never copied. The placeholder file already
   exists and is already in `FILES` and `SHARED_LISTS` (both build files).
   `tools/validate-content.js` loads `JS_Nonogram.html` and
   `JS_Connections.html` by name: point it at the new files.

   It ends with the race plug-in, a plain object `<GAME>_RACE` (`SUDOKU_RACE`,
   `TANGO_RACE`, `NONO_RACE`, `MINES_RACE`, `WHEEL_RACE`, `CONN_RACE`,
   `PIN_RACE`, `STREAK_RACE`; `RoomRace.js` looks these names up):

   ```
   deal(rnd, st, pick)  → the secret { pub: what every phone gets, ...the solution }
                          pick.one(list, key) / pick.many(list, key, n): a category or
                          question dealt through the room's prompt memory (key 'race_<id>_<lang>')
   board(x, st)         → a solver's board on the server
   total(x, st)         → what the table's bar counts to
   move(b, x, p, st)    → 'won' | 'lost' | '' (throws an Arabic Error for a bad payload)
   progress(b, x, st)   → { done }  (never content)
   view(b, x, st)       → the board as its own phone sees it (never the solution)
   score(b, x, st)      → a rank among the finished (most right first); 0 = order of finishing
   reveal(x, st)        → what everyone sees once the round is over, or null
   ```
   `st.lang` is 'ar' | 'en'. The level is fixed in the file (`<GAME>_RACE_LEVEL`).

2. **The page file** `JS_<Game>.html`:
   - the state accessor answers with the race board first:
     `const race = soloRaceState('<id>'); if (race) return race;`
   - the painter draws into `soloStage('<id>-stage')`, not `getElementById`;
   - in a race (`s.race`): no hint, no "new game", no exit bar; the finish
     is the server's word, never local (`if (s.race) { raceMove('<id>', payload); return; }`);
   - the game's own motion is kept (the toolkit: a solved board's celebration
     goes in `finished`);
   - `RACE_UI.<id> = { stage, unit, fresh(pub, settings), sync(s, board, fx),
     paint(), finished(s, won), snapshot?(s), miss?(s), revealHtml?(reveal, s),
     scoreLabel?(score, t) }` at the end of the file (see JS_Solo.html's
     comment). `fx.first` = a reload or a late frame (draw settled);
     `fx.fresh` = a later state. `snapshot`/`miss`: for a game the server
     judges, so a move that found nothing can shake.
   - the phone's own timers (`xArmTimer`) are not armed in a race.
   - keyboard handlers keyed on `appState.currentView !== 'play-<id>'` also
     accept `'room-<id>'` while `soloRaceKind() === '<id>'`.

3. **Tests** (each at its anchor comment - the anchors keep the merges clean):
   - `rooms-worker/test/rules.mjs` at `// RACE:<id>`: the deal (the public part,
     the solution hidden), a refused payload, a move that moves the bar, the
     solution won, whatever is special (mines: a mine loses; streak/pinpoint:
     the score ranks; connections: four mistakes lose; wheel: a bonus word).
   - `rooms-worker/test/leaks.mjs` at `// RACE_PROBES:<id>` (`RACE_PROBES.<id>`:
     `secrets`, `probes`, `own`) and `// RACE_DRIVERS:<id>` (`DRIVERS.<id>()`
     through `DRIVERS.raceGame('<id>', { partly, solve, wrong, stale })`).
     `node test/leaks.mjs <id>` must pass with every probe having come up.
   - `rooms-worker/test/play-all.mjs` at `// RACE_ROBOTS:<id>`: `RACE_PLAYS.<id>
     = { partly(s) → [payloads], solve(s) → [payloads], partlyDone, ownKey }`
     playing from what a phone sees (the robot may load the shared file, as
     the existing ones do).

4. **Nothing else**: the strings, the help, the catalog, the hub, the views,
   the styles, the build lists and the includes are done for all ten.

## Checks before handing back

```
node -e "..."  the parse check of every edited JS_*.html (GEMINI.md, Traps)
cd tools && npm run check
cd rooms-worker && node build.mjs && node test/rules.mjs && node test/leaks.mjs <id>
```
And a look in headless Chrome with three phones and a TV through a race of
the game at 375x812 (Arabic light) and 1280x720 (English dark): the scratch
driver `race-look.mjs` (a copy is at `notes/race-look.mjs.txt`) takes
`<game> <lang> <dark> <w> <h>`; add a `PLAY.<id>` entry (a tap on the host's
board, the solution on p2) and point `BASE` at your preview port. Fix what
you see; no console errors.
