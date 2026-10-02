# Each game's code loads when it opens (code splitting)

Built 30 Sep 2026 on the worktree branch. Not deployed, not pushed; GEMINI.md
and CLAUDE.md untouched (a section for GEMINI.md is at the end, ready to fold in).

## What changed, in one line

The published page was one 1,760 KB (gzipped) file with every game in it. Now
the page is the **shell** (619 KB gzipped) and each game's code is a file of its
own in `docs/g/` (63 chunks, 1,189 KB gzipped together), loaded the first time
that game (or a screen of it) opens, and saved by the service worker after the
first visit so every game still works offline.

## How it works

### The build (`tools/lazy-split.mjs`, used by `build-site.mjs` and `build-preview.mjs`)

- `SHELL_FILES` / `SHELL_LISTS`: what stays on the page - Logo, Tailwind, Style,
  JS_Core (translations, GAME_RULES, ICON_ART, setView…; its error reporter stays the first script), JS_Lazy, JS_Catalog
  (GAME_CATALOG, the home), JS_Room (the room engine), JS_RoomAutoNext («التالي لوحده», which trivia, the voting games, موجة, زي الكل and صدق ولا كذب share), JS_Utils (help, settings),
  JS_RoomImposter / JS_RoomGames / JS_RoomVoting (the room games whose lobby every
  room needs), JS_RoomTv (the TV frame), JS_Dice (the dice tool, moved out of
  JS_DescribeIt), JS_Director, JS_Solo, JS_Daily, JS_TeamRelay, JS_Sounds,
  JS_RoomChat, JS_RoomAudience, JS_RoomTurn, JS_Motion, JS_ShareCard, JS_Three;
  lists DisabledGames.js, Dice.js, SoloShared.js.
- `CHUNKS`: every other `JS_*.html` and shared list, grouped by game (a family
  shares one chunk: the duels, the card games, the grids…). The build fails if a
  file is in no chunk, in two, or both in the shell and a chunk.
- **Dependencies are worked out from the code** (acorn + acorn-walk, added to
  tools/ devDependencies): every top-level name a file declares, and every name
  it uses - at load (top level) or when run (inside functions) - with names
  declared locally (parameters, inner `let`/`const`/functions) left out. A chunk
  needs the chunks that declare what it uses; what it uses at load must run
  before it (a topological order, a cycle fails the build). `LAZY_EDGES` lists
  the few uses that are only ever reached after the other chunk is loaded anyway.
- **Screens to chunks**: a `view-…` id named in a chunk's files belongs to it
  (`setView('x')` breaks a tie); `VIEW_CHUNKS` for the rest, `SHELL_VIEWS` for
  the shell's. The build fails on a screen it can't place.
- **A screen's own buttons** (`onclick="…"` in Controller.html) are checked: every
  function they call must be in the shell or in the chunks the screen loads.
  This found `setCodenamesLang` (setup-codenames) and `startReactionRound`
  (setup-reaction).
- **Room games to chunks**: the chunk of `view-room-<id>`, and every chunk that
  registers `ROOM_GAMES.<id>`, `TV_GAMES.<id>` or `RACE_UI.<id>`, plus
  `ROOM_CHUNKS` (the emoji room's quiz and solve ways).
- **The registries' order is checked** (`checkRegistryOrder`, the audit of
  1 Oct 2026): a chunk runs where the chunk order puts it, which can be the
  page's order reversed. Two bugs came from that: the tournament wrapped the
  duels' renderers at its own load (`tourWrap`, chunk duels), before dots,
  X-O, خمّن مين, حرب السفن and chess - chunks that run after it - had
  registered, so none of them had the tournament; and the quiz chunk (after
  solve) put the quiz back over فوازير إيموجي's router of three ways. In both
  orders, the page's and the chunks', the build now fails when an entry of
  `ROOM_GAMES` / `TV_GAMES` / `RACE_UI` is set at load, unguarded, by two
  chunks (the second yields: `if (!(ROOM_GAMES.x && ROOM_GAMES.x.flag))`), is
  read at load before it is set or from a chunk that doesn't load the setter's
  first, or is wrapped by a wrapper (a function that reads
  `ROOM_GAMES[its first parameter]`) only before its last write. The duels'
  files end with `if (typeof tourWrap === 'function') tourWrap('<id>')`.
  Proved against the sources before the fix: both bugs fail it.
- **Home cards to chunks**: the chunk of the card's `setup` screen and of the
  function its `open` calls.
- `assemble()` writes the page: the shell's includes inlined, a chunk's
  includes dropped, the shell's lists at the lists comment, `window.LZ_MANIFEST`
  (every chunk's file and deps, the order, and the maps of views, room games and
  cards) at the new chunk-map comment before JS_Lazy, and the boot line
  (`lzBootWrite()`) at the new comment after the last include. A chunk is its
  files' scripts one after another, in page order, run as a classic script (one
  global scope, exactly as on the one page).
- **Site**: chunks minified like the page's scripts (ES2017, names kept, utf8),
  named `<id>.<sha1 10>.js`, so a chunk that didn't change keeps its name build
  after build. `docs/g/files.json` lists this build's files; the build before's
  are kept in `docs/g/` (an open page on that build loads its own), older ones
  deleted. **Preview**: the same split, unminified, a `/* ==== JS_X ==== */`
  banner per file, also hashed (a static server's cache can't hand back an old
  one). `LAZY=0` builds the whole page, as before.
- **Budget**: the shell, 710 KB gzipped (614 measured + 15%; 619 after merging master); the chunks are
  reported, not budgeted. The whole page (`LAZY=0`) keeps the old 1,800.

### The page (`JS_Lazy.html`, right after JS_Core; the map is written just before them)

- `lzEnsure(ids)`: the chunks and everything they need, in order, as
  `<script async=false>` (inserted scripts with async off run in insertion order).
- `lzWait(ids, retry, key)`: the door. Returns false when the chunks are here;
  otherwise fetches them, returns true, and runs `retry` once they have come -
  only the latest thing asked for under `key` (a second tap replaces the first).
  A `nav` door remembers the screen it was asked from: if the player has gone
  to another screen meanwhile (a tab, back), the late chunk opens nothing, and a
  failure left behind is not retried when the phone comes back online.
- A chunk that neither loads nor fails (a connection that takes the request and
  sends nothing) gives up after 15 s (`LZ_TIMEOUT_MS`) and shows «حاول تاني»;
  the try again waits on the same `<script>` if it is still coming
  (`lz.tags`), so a chunk never runs twice. The boot chunks are promises in
  `lz.loading` too (`lz.boot`), so a door reached while one downloads waits.
- The doors: `setView` (every screen), `catalogOpen`, `catalogQuickStart`,
  `tonightGo`, «كمّل» (`homeContGo`, and `homeContPick` fetches the chunk of a
  board left earlier to ask whether it's still going, then redraws the card),
  `playDaily` / `playArchive`, a room's state (`Room`'s emit holds a state back
  until its game's chunk is in, then every listener hears the latest one) and
  `routeRoomState`, and the chess review's «جرّبها كلغز» (`lzRun`).
- **A reload onto a game**: `lzBootWrite()` at the end of the body reads the
  saved screen (`gameTrackerState_v1`) and the board left last (`ashryContinue_v1`)
  and `document.write`s their chunks as ordinary scripts, so they run before
  DOMContentLoaded and `initializeApp` / `restoreView` find everything as before.
  A chunk that can't come sends the saved screen home.
- **While a chunk comes**: nothing for 250 ms (from the phone's copy it takes a
  few ms), then a pill under the header «بنجهّز اللعبة…». **If it can't come**
  (offline before it was ever saved): «مقدرناش نفتح اللعبة. اتأكد من النت» with
  «حاول تاني» and ✕; it tries again by itself when the phone is back online.
- Late registration: `SOLO_LATE` becomes `{ push: fn => fn() }` after JS_Solo
  runs, so خمن الكلمة and تشابه (which load before it on the whole page) register
  at once from a chunk; JS_Connections and JS_Flags run their start-up paint at
  once when the page is already up (they waited for DOMContentLoaded).

### The service worker (`sw.js`)

- Chunks live in their own cache, `g-chunks`, kept across builds. Installing a
  build fetches every chunk it doesn't hold yet (after the page and the icons;
  a failed chunk fails the install, retried later, as the page always was) - so
  a first visit is enough for every game offline.
- A request for `g/…js` is answered from `g-chunks` first, else the network (kept).
- Activating deletes the old page caches (not `g-chunks`) and every chunk that is
  neither this build's nor the build before's.
- The cache name `ashry-<build>` stays first in sw.js (check-live reads it).

## Styles: kept in the shell (measured and decided)

Style.html is about 160 KB of the shell's 619 (JS_Core 268, the markup 38). The game
sections could move to chunks, but not safely: later sections restyle earlier
ones (39 the arcade look, 42 and 43 its reviews, the ideas batch's) and the
cascade depends on that order; a section injected when a game opens would land
at the end and win where it used to lose. And a TV or a phone would draw a
screen a moment before its style arrived. So only JS was split; moving CSS is a
separate job (each section checked against what restyles it), the next place to
win room.

## The chunk map (gzipped KB, and what each needs)

| chunk | files | KB gz | needs |
| --- | --- | ---: | --- |
| w-chameleon | ChameleonWords.js | 17.1 |  |
| spyfall | JS_Spyfall, JS_RoomSpyfall, SpyfallPlaces.js | 19.3 | chameleon |
| bomb | JS_Bomb, JS_RoomBomb, JS_FiveSeconds, JS_RoomFiveSeconds, BombPrompts.js | 16.5 |  |
| w-riddles | EmojiRiddles.js, Proverbs.js | 12.9 |  |
| w-monkey | MonkeyWords.js | 7.3 |  |
| stop | JS_Stop, JS_StopBus, JS_RoomStop, StopWords.js | 28.5 | w-monkey |
| streak | JS_QuizStreak, QuizStreak.js, TriviaQuestions.js | 46.6 | w-riddles, triviaboard |
| screw | JS_RoomScrew, SkrewCards.js | 46.5 | codenames |
| uno | JS_RoomUno, UnoCards.js | 17.1 | cardslib |
| domino | JS_Domino, JS_RoomDomino, DominoTiles.js | 20.3 | screwcalc |
| duels | JS_Connect4, JS_RoomConnect4, JS_RoomTournament, Connect4.js | 18.1 |  |
| dots | JS_Dots, JS_RoomDots, DotsBoxes.js | 8.0 | duels |
| battleship | JS_Battleship, Battleship.js | 27.1 | duels |
| chess | JS_Chess, JS_ChessOpenings, JS_ChessReview, JS_ChessPosition, JS_RoomChess, Chess.js | 76.8 | duels |
| chessrooms | JS_RoomBughouse, JS_RoomChess4, JS_RoomVoteChess, JS_RoomHandBrain, Chess4.js | 29.6 | duels, chess |
| ludo | JS_Ludo, JS_RoomLudo, Ludo.js | 14.9 | duels |
| snakes | JS_Snakes, JS_RoomSnakes, Snakes.js | 33.5 | duels |
| bank | JS_Bank, JS_RoomBank, BankAlhaz.js | 27.0 | duels |
| guesswho | JS_GuessWho, GuessWho.js | 13.3 | duels |
| witness | JS_RoomWitness, Witness.js | 10.4 | guesswho |
| dark | JS_RoomDark, Dark.js | 30.7 |  |
| hangman | JS_Hangman, Hangman.js | 10.9 | w-chameleon, w-riddles, duels |
| minigolf | JS_MiniGolf, MiniGolf.js | 62.6 | duels |
| cardslib | JS_Cards, PlayingCards.js | 6.6 |  |
| cards | JS_RoomDoubt, JS_RoomSkull, JS_RoomOldMaid, JS_RoomEstimation, Skull.js, Estimation.js | 46.0 | cardslib |
| wire | JS_RoomWire, Wire.js | 16.1 |  |
| bowling | JS_Bowling, Bowling.js | 23.4 | duels |
| xo | JS_XO, JS_RoomXO, TicTacToe.js | 5.0 | duels |
| w-wordle | WordleWords.js | 9.7 |  |
| w-countries | Countries.js | 5.4 |  |
| solve | JS_RoomSolve, JS_RoomRace, SolveGames.js | 15.0 | duels, hangman, w-wordle, w-countries, guessnum, flags |
| connections | JS_Connections, ConnectionsWords.js | 34.9 |  |
| grids | JS_Sudoku, JS_2048, JS_Mines, JS_Queens, JS_Tango, JS_Nonogram, Sudoku.js, Queens.js, Tango.js, Nonogram.js, Mines.js | 19.9 |  |
| wordsolo | JS_WordSearch, JS_Pinpoint, Strands.js, Pinpoint.js | 8.1 | w-chameleon |
| wordwheel | JS_WordWheel, WordWheel.js | 6.3 | w-chameleon, w-monkey, stop, w-wordle, connections, whoami, charades, describe |
| chesspuzzles | JS_ChessPuzzles, ChessPuzzles.js | 63.4 | duels, chess |
| whoami | JS_WhoAmI | 22.8 |  |
| guessnum | JS_GuessNumber | 5.3 |  |
| tourney | JS_Tournament | 2.7 |  |
| charades | JS_Charades | 20.3 | whoami |
| describe | JS_DescribeIt | 28.8 |  |
| wordle | JS_Wordle | 3.5 | w-wordle |
| newgames | JS_NewGames | 22.5 |  |
| screwcalc | JS_Screw | 9.3 |  |
| monkey | JS_Monkey, JS_RoomMonkey | 12.1 | w-monkey |
| spy | JS_Imposter | 4.9 | w-monkey, w-countries |
| codenames | JS_RoomCodenames | 7.3 |  |
| draw | JS_RoomDraw, JS_RoomFakeArtist, JS_RoomTelephone | 11.3 |  |
| trivia | JS_RoomTrivia | 3.2 |  |
| triviaboard | JS_TriviaBoardBank, JS_TriviaBoard | 52.1 | flags |
| chameleon | JS_Chameleon, JS_RoomChameleon | 5.3 | w-chameleon |
| timesup | JS_TimesUp | 23.1 |  |
| memory | JS_Memory | 3.2 |  |
| flags | JS_Flags | 4.6 | w-countries |
| headsup | JS_HeadsUp | 4.4 | bomb, w-countries, whoami, charades |
| cardscore | JS_CardScore, JS_CardRules | 12.8 |  |
| chooser | JS_Chooser | 1.6 |  |
| smallrooms | JS_RoomBuzzer, JS_RoomChairs, JS_RoomTwoTruths, JS_RoomHerd, JS_RoomMafia, JS_RoomMind, JS_RoomTimeline | 20.9 |  |
| bumper | JS_RoomBumper | 18.5 |  |
| quiz | JS_Emoji, JS_Proverbs, JS_RoomQuiz | 5.5 | w-riddles |
| box | JS_RoomBox | 17.6 |  |
| exact | JS_RoomExact | 11.6 |  |

## Traps met

- **Classic scripts share one scope, and later wins**: a chunk is the same
  scripts concatenated, so nothing about naming changed; but two files that
  used a function from each other at load had to run in order (the topological
  sort, with a cycle failing the build).
- **Some "shared" code lived in a game file**: the dice tool in
  JS_DescribeIt.html (Ludo and the bank would have pulled in أوصف لي) -> JS_Dice;
  `roomQuietRedraw` / `roomQuietStop` in JS_Hangman.html (خمّن مين and the solve
  games pulled المشنقة) -> JS_Room; JS_Director (الجاسوس and من أنا؟ shared it)
  -> the shell.
- **`DOMContentLoaded` has passed by the time a chunk runs**: two files waited
  for it; they run their paint at once now when the page is up.
- **Scripts inserted after the page loads don't hold DOMContentLoaded**, so a
  reload onto a game couldn't simply insert its chunk: `restoreView` would have
  run before it. `document.write` of a same-origin script while the page is
  still parsing does hold it.
- **A registry read at load**: `SOLO_LATE` was consumed once by JS_Solo; a chunk
  pushing after that would never register.
- The i18n check and the content check read the sources, not the built page:
  unchanged.

## Measurements

Sizes, gzipped at level 9, minified (`npm run build:site`):

| | before (whole page) | after |
| --- | ---: | ---: |
| what opening the app downloads (the page) | 1,760 KB | **619 KB** |
| the games' chunks, each when its game opens | - | 1,189 KB in 63 files (2-117 KB each; chess 117, minigolf 88, chesspuzzles 70, screw 66, cards 64) |
| everything | 1,760 KB | 1,808 KB |

The shell's biggest parts: JS_Core 268 KB (translations and GAME_RULES, which the
home and Help need), Style 159, the markup 38, JS_Utils 21, JS_Catalog 17,
JS_Room 17, JS_RoomTv 13, JS_Motion 13.

Time to the first game card on the home, headless Chrome, a fresh profile with
no cache, 150 ms latency, 1.6 Mbps down, CPU 4x slower, the local test server
(which sends **uncompressed**: 6.65 MB against 2.70 MB), three runs each:

| | first card | DOMContentLoaded |
| --- | ---: | ---: |
| whole page | 35.4-38.1 s | 35.5-38.1 s |
| split | **15.5-16.0 s** | 15.5-16.0 s |

Over a compressing host (GitHub Pages and Cloudflare gzip / brotli) the same
ratio holds on 1,760 KB against 619 KB: about 9 s against 3 s on that 1.6 Mbps
line. A chunk opened later is 2-117 KB; from the phone's copy (after the first
visit) it comes in a few ms and no pill shows.

Checks run:

- `npm run check`: passes.
- `cd rooms-worker && npm run test:rules`: 2,491 checks, 0 failed, the leak check clean (on the merged result; one earlier run had the darkroom leak driver not reach the end of a game - server code this work never touched - and it passed three runs alone and the next full run).
- `npm run test:ui` against `wrangler dev --port 8797`: 104 passed, 0 failed, before and after merging master
  (screens at three sizes in both looks, every game started from its setup,
  every room game on five phones and a TV, the audit's fixes, the offline copy
  and its updates). Two places in test-ui.mjs called a game's code directly or
  pressed a button right after `setView`, before the game's chunk had come:
  `chunkIn()` waits for it (after every `setView` of the screen sweeps, and in
  the site part), and the battleship check loads its chunk first.
- Own checks (headless Chrome, a static server with Cloudflare's index.html
  redirect), 50 passed: the first open loads no chunk; ten games open from their
  cards, each fetching its chunk; a sudoku started and reloaded comes back to
  the board, its chunk written in by the boot; a daily from the hub; a phone
  hosting an أونو room, a second phone and a TV joining and drawing it (this
  found a lost redraw: `routeRoomState` and the room's emit shared one waiting
  key, so one's retry replaced the other's - they have their own now); after a
  first visit every chunk is in `g-chunks`, and with the server switched off the
  app opens and ludo, the bank, sudoku and Wordle open; a chunk that can't come
  shows the failure pill, and «حاول تاني» opens the game once it can.

## Left open / risks

- **Two local builds in a row lose the published build's chunks in docs/g**
  (files.json keeps one build back). Only matters if two builds happen between
  pushes and a phone is open on the published one while the next goes live: its
  next new game would fail until it switches (the switch comes by itself on the
  home). Publishing each build, as the steps do, avoids it.
- The rooms server's copy of the app (it uploads docs/) and the site worker
  upload the whole folder, g/ included (their wrangler.toml `assets` directory
  is ../docs): nothing to change there.
- CSS stays in the shell (above): the next win, section by section.
- A chunk is concatenated scripts: a script that throws at load now stops the
  rest of its chunk, where on the page it stopped only itself.

## For GEMINI.md (to fold in)

Under *The static site*, replacing the paragraph on the minified page's budget:

> **Each game's code loads when it opens** (30 Sep 2026). The page is the shell
> (the home, nav, settings, help, the room engine, the TV frame, every registry
> the home reads) and each game's code a chunk in `docs/g/<id>.<hash>.js`
> (`tools/lazy-split.mjs` decides what goes where from the code itself, and fails
> the build on a file in no chunk, a screen it can't place, a chunk cycle, or a
> screen button calling code its chunk doesn't load). `JS_Lazy.html` loads a
> chunk at every door (`setView`, the home's cards, «كمّل», «الليلة دي؟», the
> daily hub, a room's state) with `lzWait(ids, retry, key)`; a reload onto a game
> gets its chunk written into the page (`lzBootWrite`). The worker keeps chunks in
> `g-chunks` across builds and fetches them all when a build installs, so a first
> visit still plays everything offline. The budget is the shell's, 710 KB gzipped
> (614 on 30 Sep 2026); `LAZY=0` builds the whole page. **A new game file goes
> into `CHUNKS` in `tools/lazy-split.mjs`** (or `SHELL_FILES` if every screen
> needs it); a new screen it can't place goes into `VIEW_CHUNKS`. Code that
> calls a game's functions from the shell must be behind a door (or
> `lzRun(chunk, fn)`), and a test that calls a game's code directly loads its
> chunk first (`lzEnsure(lzChunksOfView('…'))`).

And a trap: *A chunk runs after DOMContentLoaded*: a file that paints at start-up
has to paint at once when `document.readyState` isn't 'loading'; a registry a
shell file consumes once (`SOLO_LATE`) has to take late entries.

**The budget was full on 2 Oct 2026.** السلم والتعبان's third round and المشنقة's next round took the shell to 713 KB; the speech bubbles of their board moments (`snk_b_*`, `hm_end_*`) moved out of `TRANSLATIONS` into their chunks (`SNK_BUBBLES` in JS_Snakes.html, `HM_END_TEXT` in JS_HangmanEnd.html, read through `snkT` / `hmT`), back to 710. Text only a game's own chunk reads goes in that chunk the same way; the next real saving is still the CSS, section by section.

On 2 Oct 2026 (ارسم اللي بتسمعه's and الشاهد's extras) the shell was at 711 KB; every `wit_*` text (127 keys a language: the crimes, the builder's options, the station's lines) moved out of `TRANSLATIONS` into `WIT_TEXT` in JS_RoomWitness.html, read through `witT` (which falls back to `TRANSLATIONS`), and hear's new tags into `HR_TEXT` (through `hrT`): 707 KB.
**The first styles out of the shell (2 Oct 2026).** رد الفعل's room game and «خدعة» came with the shell at 710.06 KB. The game's own words went into its chunk as above (`RX_TEXT`, `rxText`), and so did its styles: `RX_CSS` in JS_RoomReaction.html, put at the end of `<body>` by `rxStyleOn()` when the chunk runs (the one-phone test's `newgames` chunk loads the `reaction` chunk for it). That is safe for a section only when nothing else restyles its classes (here only `.rx-*`, new) and it needs no reduced-motion block (`applyMotionPref` reads the sheets once; the motion classes are added only when `motionOff()` is false). Shell after: 710.44 KB, rounding to 710 - there is no room left for the next game's text or styles in the shell.

**The budget raised to 720 KB (the owner, 2 Oct 2026).** Asked whether to keep 710 and move more out or raise it, the owner chose to raise it: `BUDGET_KB` in tools/build-site.mjs is 720.
On 2 Oct 2026 «إكس أو الكبير» took it to 711 again; X-O's own lines that only its chunk reads went the same way (`XO_TR` in JS_XO.html, read through `xoTr()`, which puts them over `TRANSLATIONS` so the code still reads `t.xo_*`), and its help was kept short: 710.4.
**A chunk can bring styles that are only its own (2 Oct 2026).** «كورة التصادم» took the shell to 712 KB; its CSS (every class new, nothing in Style.html restyles it) went into its chunk as `BMP_BALL_CSS`, put into the page once as the chunk runs, before anything of it is drawn (JS_RoomBumper.html). A rule that competes with a shell rule of the same weight has to outweigh it (`.bmp-tv.bmp-tv--ball`), since the order is not guaranteed. Back to 710.
