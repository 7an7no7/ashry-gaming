# Solo games (لوحدك), تحدي اليوم and the dailies

Moved from GEMINI.md on 30 Sep 2026. GEMINI.md keeps the rules that apply to every game and an index; this file keeps the detail, word for word.

## From GEMINI.md: The owner's specs, as built

- **A daily for خمن الكلمة and تشابه** - the owner's word of 28 Sep 2026: "the
  same puzzle for every phone on a date, played once, a result shared on
  WhatsApp as a grid of coloured squares (Wordle's way)" (*Solo games*).
  Decided here (open to change, each one place in the code):
  - **خمن الكلمة**: 5 letters in the games' language (`contentLang`), from the
    very list the free game deals from (`WORDLE_DB[lang][5]`), picked with
    `soloRng(soloDaySeed('wordle'))`, 6 tries. The share: the tries (x/6, X
    when lost), the date and a row of 🟩🟨⬛ a guess, never the letters.
  - **تشابه**: a medium puzzle (4 groups) from `CONNECTIONS_DB`, seeded the
    same way, and its tiles dealt in a seeded order too, so every phone sees
    the same grid. The share: a row a try in the groups' colours (🟨🟩🟦🟪,
    easiest first), a wrong row ending in ❌, and the mistakes (x/4).
  - Both are in تحدي اليوم («✅ 3/6»; «✅ 4/4 · 🔴» a red dot a mistake), have
    the daily line on their setup screens, are played once (resumed where left,
    set aside when a free game is dealt over them, never dealt again once
    done), come back after a reload, count for the streak and are in the
    archive.

### Solo games (لوحدك)

`JS_Solo.html` is what every one-player game shares, so a game file holds only
its own rules and board:

- **Registration.** A game calls `soloRegister(id, { setup, play, paintSetup,
  restore })`. `restoreView` hands its play view to `soloRestoreView` (the
  game's `restore()`, or back to its setup), `loadFromLocal` accepts its views
  through `soloViews()`, and `paintSetupOptions` falls back to `soloPaintSetup`.
  No per-game branch in `JS_Core.html`.
- **Seeded randomness.** `soloRng(seed)` (mulberry32) and `soloDaySeed(id)`:
  the daily puzzle is dealt from the date, so every phone gets the same one and
  a new one at local midnight. Anything a daily deals goes through that source,
  never `Math.random`, or two phones get different puzzles.
- **A daily that picks from a list walks it** (the review of 1 Oct 2026: an
  independent seeded pick a day brought Connections back in ~11 days, the flags
  in ~14, Wordle in ~29). `soloDailyCycle(id, pool, day, per)` (JS_Solo.html):
  from `SOLO_CYCLE_FROM` (2 Oct 2026) the list goes round in an order shuffled
  from the round's number - nothing comes back until all of it has been, and a
  round never starts with what the last ended on (the nonogram's way). A day
  before it keeps its old pick, so a half-played day and the archive don't
  change. Used by Wordle, Connections, خمّن الدولة, ألغاز شطرنج (per level),
  خيوط's theme and إيه اللي يجمعهم؟'s five categories (`per`); the dice those
  two used still run, so the rest of a board is dealt as before.
- **Bests and dailies** live in this phone's storage: `soloRecord(id, level,
  result, isBetter)` (`ashrySoloBest_v1`) and `soloMarkDaily(id, result)` /
  `soloStreak()` (`ashryDaily_v1`, two months kept). A setup screen's daily
  line is `soloDailyButtonHtml`.
- **The result sheet** is `soloResult({ icon, title, value | valueText,
  valueLabel, lines, win, share, again, exit })` (`#solo-result-modal`): the
  number counts up, a daily result can be shared as text, confetti on a win.
  The shared picture uses `shareLines` and `shareIcon` when given: a daily's
  picture never carries the answer (Wordle's word, the country and its flag -
  🌍 instead -, خيوط's theme, إيه اللي يجمعهم؟'s categories, the nonogram's
  picture - 🖼️), since it goes to people who haven't played the day yet.
- **Layout.** A board and its controls are `.solo-layout` with
  `.solo-layout__board` and `.solo-layout__side` (the stats bar, `soloBarHtml`,
  goes in the side): one column upright, with the bar on top through
  `display: contents` and `order`; two columns on a phone held sideways, the
  board sized off `--app-h` so it needs no scrolling (a minefield, taller than
  wide, scrolls instead) and on any screen at least 900 wide; the word and
  quiz games' lists and cards take a narrower board. Grids that map to a
  physical board carry `dir="ltr"`. Styles are section 15 of `Style_Solo.html`.
- **Shared small pieces.** `soloCategory("فواكه 🍎")` splits a list's category
  into name and emoji; `soloCellAt(x, y, selector)` finds the cell under a
  dragging finger; `.solo-choices` / `.solo-choice` (`is-right`, `is-wrong`)
  are the answer buttons of the quiz-style games.
- **Free play deals through `freshPick`** (so a category or question doesn't
  come back until its list has gone round); only a daily uses the seeded
  source.
- **A daily is played once.** Starting it again - from its own button or the
  hub, where its row says "كمّل" - resumes it; a free game dealt over it first
  sets it aside in `ashryDailyPlay_v1` (today only). Before the audit of
  17 Sep 2026, 📅 dealt the same seeded puzzle with a clean slate until it was
  finished, so a streak question could be seen, abandoned and answered with
  three lives back. A new daily game calls `soloDailyResume` then
  `soloDailySetAside` in its start, and registers `state`, `resume` and
  `prefs`. A result goes under the day the daily was started (23:59 → 00:02
  counts for the first day), and hints travel with it (💡N in the share).
- **Clocks count play, not breaks.** A board registered `timed: true` pauses
  when its screen is left, when the phone locks and across a reload
  (`soloPause` / `soloResume` move `startedAt` forward); display clocks pass
  a getter to `soloClock`. Anything that fires after a game (a result sheet a
  moment later) goes through `soloLater`, which does nothing once
  `soloNewGame` has dealt again or the board was left - Flags once showed the
  next game's flag on the last game's result.
- **The result sheet can step aside:** "👀 شوف اللوحة" (`soloResultLook`)
  leaves the finished board up with the result and "again" at its foot - the
  Nonogram picture and the minefield used to be hidden behind it.
  `soloConfirmNew` asks before Start or 🧹 wipe a board with work on it;
  Queens and Tango have a one-step ↶. `repaint` in `soloRegister` redraws a
  board on a language change, and `soloKeyBlocked` keeps keyboard handlers
  (2048, Wordle's physical keyboard) out of text fields and popups.

The games (group `puzzle`, "ألغاز ومخ", on the home):

- **سودوكو** (`JS_Sudoku.html`): `sudokuMake` fills a grid at random and
  removes numbers while `sudokuCount` still finds exactly one solution and
  the grid's grade stays the level's. **Graded by technique** (the review of
  1 Oct 2026: medium played like easy, 38 of 40 grids finished by singles, and
  hard could fall back to singles or need a guess): `sudokuGrade` solves the
  way a person does, always the plainest step that does something, and
  returns the hardest step needed - 1 naked/hidden singles, 2 naked/hidden
  pairs, pointing and claiming, 3 naked/hidden triples, X-wing, swordfish,
  XY-wing, 0 a guess (never dealt). Easy is grade 1 (40 givens), medium grade 2
  (30: a grid that got its grade with fewer gets numbers back while the grade
  holds), hard grade 3 (about 27); a grid that can't reach its grade is made
  again (`SUDOKU_TRIES`, then the closest). Measured on 200 seeds: before,
  medium was 96% grade 1 and hard 60% guess / 32% grade 2; after, medium is
  100% grade 2 and hard 98.5% grade 3 (1.5% fall back to 2), none a guess.
  On this PC easy 0.2 ms, medium median 4 ms (p90 13), hard median 14 ms
  (p90 37, worst about 100): the setup screen makes the next free medium or
  hard grid ahead in idle time (`sudokuMakeAhead`), so Start doesn't wait.
  The same seed gives the same grid (the daily, the race). Mistakes, notes that
  clear themselves, undo, hints (a solve with hints is no best), and a row,
  column or box that comes right ripples. The daily is medium.
- **2048** (`JS_2048.html`): tiles keep an id so the same element slides
  (a `transform` transition) and a merged pair pops with `scale`; one undo;
  swipe on the board or the arrow keys. No daily: a best score only.
- **كاسحة الألغام** (`JS_Mines.html`): the first tap is always safe (the mines
  are laid after it); a long press or 🚩 mode flags; a satisfied number opens
  its neighbours; an opened patch ripples out from the tap. The daily lays its
  mines from the seed around a safe cell that opens by itself. **No guessing**
  (the review of 1 Oct 2026: random mines left the daily and the race on a
  pure 50/50): `minesLay` lays the mines again until `minesSolvable` clears the
  field from the safe cell by a player's reasoning (a number with its mines
  found frees the rest, a number with as many hidden cells as mines left
  flags them, two numbers sharing hidden cells - the 1-2 at a wall, the 1-2-1 -
  and the count of mines left), at most `MINES_TRIES` (400) layings, then the
  one that got furthest. Before: 21% of easy, 66% of medium and 95% of hard
  fields needed a guess somewhere; after: none in 900. Medium median 0.1 ms,
  hard median 0.9 ms (p90 3, worst 10). A long press (or the right button) on an
  opened number does what a tap does - opens its other neighbours once its
  flags are down - instead of nothing.
- **الملكات** (`JS_Queens.html`): crowns placed so none touch (`queensPlace`),
  one region grown from each at random (`queensGrow`), then while
  `queensSolve` finds a second solution one of its crown cells is handed to a
  neighbouring region (keeping regions connected) until one solution is left
  (under 10ms). A tap cycles ✕ → 👑 → empty, a drag marks ✕, a crown breaking
  a rule is outlined red. One finger at a time: a drag follows its own
  `pointerId` and a second finger is ignored (the nonogram's painting too). 6/7/8 wide; the region colours are a fixed pastel
  set with dark ink, like the Connections groups.
- **شمس وقمر** (`JS_Tango.html`): a full valid 6×6 grid (`tangoFill`, three
  of each per line, never three alike in a row), clues (given cells and =/×
  signs) added at random until `tangoDeduce` can finish it, then removed while
  it still can. **Solved by reasoning, graded by depth** (the review of 1 Oct
  2026: 13% of easy, 19% of medium and 33% of hard boards had one solution but
  needed trial and error): `tangoDeduce` uses the cell rules (a sign with one
  side known, two alike beside or around a cell, a line with three of a kind)
  and, when they stop, a whole line at once (of the ways the line can still be
  filled with its own signs, a cell the same in all of them); signs between
  two lines carry it across. `lines` is how many times the whole-line step was
  needed: easy 0 (and two given cells more), medium 1-2 (given cells handed
  back while it needs more), hard 3 or more (`TANGO_LEVELS`; at most
  `TANGO_TRIES`, then the closest). After: no board of any level needs a
  guess (600 measured); under 1 ms a board (worst 5).
- **نونوجرام** (`JS_Nonogram.html`): a board is one of `NONO_PICTURES` (drawn
  by hand, 8×8 and 10×10) or random, and is only used if `nonoSolvable` can
  finish it line by line (`nonoLineSolve` intersects every placement of a
  clue), so it never needs a guess. ⬛/✕ modes and drag painting; a finished
  line fades its clue; the picture's name is in the result. **`npm run
  check` fails on a picture that needs a guess**: four first drafts did (a
  symmetric face or sun often has two solutions) and were dropped.

**على راسك** (`JS_HeadsUp.html`, id `headsup`, group `party`) is not solo but
rides on the same registration (`soloRegister`) for its reload: one phone on a
forehead, the table describes, tip down for right and up to pass, with two big
buttons for a phone that has no sensor or refused it. The tilt is
`zUp = cos(beta)·cos(gamma)` from `deviceorientation` (1 flat, 0 upright, -1
facing the floor, whichever way the phone is held), and an answer needs the
phone upright in between, so the phone in a hand at the start never counts. iOS
only grants motion inside a tap, so `huReady` asks first thing. With the page
upright (rotation lock) and the phone on its side, the card turns 90° towards
the edge that is up (`xUp = -cos(beta)·sin(gamma)`). The decks (`HU_DECKS`)
are the Charades and Who Am I categories matched by their emoji, plus the
countries of خمّن الدولة: about 1,800 words in the Arabic mix. The play
screen is full screen (`FULLSCREEN_VIEWS`) and keeps the screen on with the
Wake Lock API (`huTakeWake`, taken again when the page comes back from hidden
- a notification, the lock button - during a countdown or a turn); after a turn every word can be tapped to fix a wrong verdict;
the end is a podium. A reload mid-turn goes back to that player's "ready".

**ميني جولف's daily hole** (the owner, 24 Sep 2026): one hole drawn from all
sixty with `soloRng(soloDaySeed('minigolf'))`, played as a one-hole solo game
(`s.daily`); its result is `soloMarkDaily('minigolf', { strokes, par })`, never
a best, and the hub's line is «🟢 ⛳ 3 · 🎯 3».

**خمن الكلمة's and تشابه's dailies** (28 Sep 2026, the owner's word; *The
owner's specs*). Both games load before `JS_Solo.html`, so they push their
`soloRegister` onto `window.SOLO_LATE`, which `JS_Solo.html` runs right after
defining it; their play views keep their own branches in `restoreView`.
- **Wordle** (`startWordleGame(5, true)`): `appState.wordle` gained `phase`
  ('play' | 'done', what the dailies read beside `status`), `daily` and
  `archive`; the word is `soloPick(WORDLE_DB[lang][5], soloRng(soloDaySeed('wordle')))`.
  Every Wordle game now ends on `soloResult` (the tries count up, the word),
  not the old alert; a daily's is `soloMarkDaily('wordle', { won, tries, max })`
  and `wordleShareText` (a row of 🟩🟨⬛ a guess, an Arabic row led by a
  right-to-left mark so its first square is on the right, as on the board).
  `#wordle-daily-badge` says «📅 تحدي اليوم» or the archive's day over the board.
- **Connections** (`startConnections(true)`): the `connections` object gained
  `phase`, `daily`, `archive` and `guesses` (every four tried, as its tiles'
  groups; a repeat of a wrong four costs nothing and isn't kept), all saved
  with the board. The daily is a medium puzzle and its tiles' order seeded too.
  A daily (or an archive day) ends on `soloResult` (the groups found count up,
  the mistakes); a free puzzle still ends as it did. The share
  (`connectShareText`) is a row a try in `CONNECT_SQUARES` (🟨🟩🟦🟪, the
  groups' colours in order), a wrong row with ❌.
- A finished daily started again goes to its setup, never a new board
  (`soloDailyResult`, skipped for an archive day).

**تحدي اليوم** (`JS_Daily.html`, the `setup-daily` screen, first card of the
`brain` group and a strip on the home above the recent games): every game's
puzzle of the day in one list (`DAILY_GAMES`, fourteen since 28 Sep 2026: the
order, how to start its daily, and how its `soloMarkDaily` result reads in one
line), the streak
(`soloStreak`, days in a row with one finished), how many are done and when
they renew, and one message with every result (`shareDaily`). A daily started
from the hub sets `soloHubReturn`, so `soloResult` turns its "again" and
"exit" into a way back to the hub. A new game with a daily needs a line in
`DAILY_GAMES`. A daily switched off (`DISABLED_GAMES`) is left out of the count, the
bar and «خلصت كل حاجة» while it is off (`dailyLive`), so sharing still opens.

The word and quiz games (group `brain`, "كلمات وأسئلة لوحدك", which since
21 Sep 2026 also holds Wordle and Connections, after تحدي اليوم). None of the
six below has a list of its own:

- **خيوط** (`JS_WordSearch.html`, id `strands`): a Chameleon category and its
  single-word entries hidden in a grid (7 to 9 wide), in the reading
  direction of the language plus down and diagonally, backwards too on hard;
  the empty cells are filled with the category's own letters so nothing
  stands out. A finger traces a straight line (`strandsLine`); a found word's
  letters fly into its slot. `strandsFold` drops diacritics and hamza seats,
  so the grid never shows أ against ا.
- **كلمات من حروف** (`JS_WordWheel.html`, id `wordwheel`): `wheelDictionary`
  gathers every single word of 3-7 letters from the Chameleon, Wordle, Stop,
  Monkey, spy, Connections, Describe It (cards and forbidden words), Charades
  and Who Am I lists (not titles or people): about 3,200 Arabic and 2,600
  English (`WHEEL_BONUS_WORDS` adds everyday verbs, adjectives and little
  words - كتب, حلو, swim - that only ever count as a bonus, so a seeded board is
  unchanged). A base word of 5/6/7 letters, every word its letters spell, and
  `wheelLayout` builds a crossword where each word crosses one already placed
  and touches nothing else; words that don't fit are bonus ⭐. Drag across the
  wheel (an SVG line follows) or tap and ✓. The grid's columns are a fixed
  share of its width: a column of hidden cells has no content and collapsed to
  nothing with `minmax(0, …)`.
- **إيه اللي يجمعهم؟** (`JS_Pinpoint.html`, id `pinpoint`): five rounds, a
  Chameleon category shown one word at a time against six categories.
  `pinMakeRound` picks decoys that share a word with the answer first and
  shows the shared words first, so one word is rarely enough. 5 points down to
  1; a wrong pick crosses out and opens the next word.
- **سلسلة الإجابات** (`JS_QuizStreak.html`, id `streak`): 20 seconds, four
  answers, three hearts. `streakPool` turns four banks into questions: the room
  trivia (`TriviaQuestions.js`), the team board, the emoji riddles (wrong
  options from the same kind) and the proverbs. The team board's answers are
  free text, so its wrong options are made to look like the right one
  (`streakBoardDecoys`): a number gets numbers near it written the same way
  (a year other years, "45 دقيقة" other minutes, "300,000" with its commas), a
  word other word answers of its category about as long, and a note in
  brackets is dropped from every option. The first version drew any answer
  of the category, so a year question showed one year among three words and
  gave itself away (reported by the owner, 16 Sep 2026). The question keeps its deadline,
  so a reload comes back with the time it has left, or counts it as missed.
  The daily is ten seeded questions. **Since 1 Oct 2026** (the owner's
  before/after sheet) the one-phone screen is one card (`.stk`, `.stk-card`):
  the hearts as a row of ❤️, a lost one dimmed (`.is-lost`), and the score as
  one chip; the seconds in a ring above the question (the general timer's
  `.gtm-dial` / `.gtm-ring`, `#streak-dial`, `streakRingPaint`), emptying
  second by second and red in the last five (`STREAK_LOW`); the answers as
  big bordered tiles (`.stk-choices`, the same right / wrong states); «خروج»
  small in the bar. A sheet that pauses the clock freezes the ring where it
  is. The race (سباق ألغاز) draws its own board as before (`s.race` branch).
- **خمّن الدولة** (`JS_Flags.html`, id `flags`): from the flag (6 guesses) or
  by distance alone (8). `COUNTRIES` (`Countries.js` since 23 Sep 2026, shared with the rooms server) is the one new list of the batch, because
  nothing else knew where a country is: 196 countries with their code, the
  names as ربع قرد spells them, the middle of the country, the continent and a
  tier (1 everyone knows it, 3 small or far); easy asks tier 1, the daily
  tiers 1-2. Israel is not in it; Palestine is. A guess is typed and picked
  from suggestions (`flagsMatches`: both languages plus `FLAG_ALIASES` such as
  أمريكا and England, through `foldWord`), so a spelling never loses a turn.
  Each wrong guess shows the great-circle distance, an arrow turned to the
  bearing and a closeness bar (`scaleX`), counting up and turning into place;
  the continent shows after a few misses, then the first letter. In flag mode
  the suggestions carry no flags, or the picture would give it away. **Flags
  on Windows**: a flag emoji is two letters there ("EG"), so
  `flagsEnsureFont` draws one to a canvas and, when it comes out as letters,
  loads the Twemoji country-flag font (`country-flag-emoji-polyfill`, pinned on
  jsDelivr) for `.flag-emoji`. **Since 1 Oct 2026** (the owner's
  before/after sheet) the one-phone screen is one card (`.flg`, `.flg-card`):
  the level and the guesses left as two chips, the big flag (or 🧭), the
  question and its hints, the field «اسم الدولة» with «خمّن» (`.gn-entry`;
  the button guesses the first suggestion, as Enter does) and the
  suggestions under it, and the guesses as chips newest first
  (`flagsGuessChip`, `.gn-chips`): a wrong one carries its flag, name,
  distance, the turned arrow, the closeness and ✗, filled as far as it was
  close; the right one is a green chip. The six empty rows went. There is no
  hint button: the hints come by themselves, as before. «خروج» (and «لعبة
  جديدة» when it's over) in the bar. On a phone on its side the flag sits
  beside the rest; from 900px it is a form's width. Since 2 Oct 2026 the
  guess chips (and the room's rows) are the map below.
- **خمّن الدولة's small map** (idea 450, the owner's look ج «التخمينات على
  الخريطة»; built 2 Oct 2026). `JS_FlagsMap.html`, its own chunk
  (`flagsmap`), read by the flags chunk and the room's (solve):
  - **The world** is baked once in the file: `FMAP_LAND`, one compact path a
    continent in a 720 x 284 box (x = (lon + 180) * 2, y = (84 - lat) * 2,
    equirectangular, 84 N to 58 S), grouped by `Countries.js`'s continent
    codes so the glow lights what the hint names - Russia (eu there) whole
    with Europe, Turkey and the Caucasus with Asia, Sinai with Africa, New
    Guinea's halves with Asia and Oceania - and `FMAP_SEA` (the Black Sea with
    Azov, the Caspian) laid over as water. About 6 KB. Drawn by hand as
    [lon, lat] rings (`tools/flags-world.mjs`; `node tools/make-flags-map.mjs`
    bakes them into the file) and checked against every country's middle in
    `COUNTRIES` (all on their continent's land but small islands, whose pins
    stand in the sea). No names on it.
  - **Pins** stand on a country's middle (`fmapAt`), coloured in five steps
    by distance from the answer (`flagsStep(km)` in `Countries.js`:
    `FLAG_STEPS_KM` 9,000 / 5,000 / 2,500 / 1,200 km, red → green; the
    colours are `--fmap-0..4` on `.fmap`, lighter in dark), numbered in the
    order guessed. The right guess, or the answer once a game is lost, is the
    gold pin (★) that drops with three rings (`fmap-drop`, `.fmap__ring`).
  - **Callouts** (`fmapGuessPins` → `fmapHtml({ calls: true })`): each guess
    a small card above or below the map - its flag, «n · name», the km (counts
    up, `fmapCountKm`), the turned arrow, the % - with a dotted line to its
    pin. `fmapLayout` places them so none overlaps at any width: each takes
    the band on its pin's side unless that band is already two ahead (decided
    once, in guess order, so a callout keeps its band as guesses come); in a
    band they are sorted by pin x, dealt into as few rows as fit (item i to
    row i % k), and each row is pushed apart and back inside the edges; row
    0 sits nearest the map. It runs after every draw, on a width change
    (`ResizeObserver`) and when fonts arrive. Under them «أقرب لحد دلوقتي»
    and the legend «بعيد … قريب» (`fmapSumHtml`).
  - **The glow**: the answer's continent (`.is-glow`, the screen's accent,
    pulsing three times) with the chip «🌍 في أفريقيا» under the question
    (`fmapHintHtml`, it replaced the 🧭 hint text) from the third miss from
    the flag, the fourth by distance (`flagsContAt`, the continent hint's
    turn); at the end on every map.
  - **One phone** (`paintFlags`): the map card is `#flags-guesses`; a reload
    or «كمّل» draws it again, still (motion only for a fresh guess). The daily
    is the same screen.
  - **Rooms** (`JS_RoomSolve.html`): a solver's phone draws its own guesses
    the same way (`svBoardHtml`, the glow when the server's view sends
    `hints.cont`); the result card adds the map with the gold pin
    (`svFlagsEndMapHtml`). **The TV shows nobody's guesses while the round is
    played** (the owner, 2 Oct 2026): its map is empty beside the flag and
    the cards, which say only how many guesses each has made; the server
    sends no pins (nor the closest %) before the round is over
    (`RoomSolve.js`'s flags `progress(b, x, st, over)`). At the end everyone's
    wrong guesses drop onto it together, each with its player's first letter
    (`svFlagsTablePins`, from `shared.progress[pid].pins` = `[{ c, s }]`, a
    country and a colour step), a beat apart (`SVF_PIN_STAGGER` 0.12 s, the
    whole drop within `SVF_PIN_STAGGER_MAX` 1.2 s: the pin's `delay` →
    `--pd` in `fmapHtml`), then the continent glows and the gold pin drops
    after the last of them. A reload on the result draws them still.
    Tests: `rules.mjs` (no pins or % mid-round; at the end the pins and the
    steps), `leaks.mjs` (a pin is `{c, s}` only, never on the answer, only in
    خمّن الدولة; and «no guess of a board reaches the table before the round
    is over», proved by putting the old always-on pins back: it fails),
    `play-all.mjs` (mid-round no pins on the TV or a phone; at the end the TV
    gets Egypt as `{"c":"EG","s":0}` against Japan, never "JP").
  - **CSS** is in the chunk (`fmapStyle`, one `<style>` added to the body
    once, every class `fmap-` / `svf-`): the shell is at its 710 KB budget.
  - Decided here (open to change): the glow comes with the continent hint, so
    by distance at the fourth miss (the owner said "after the third guess",
    from the flag); the TV shows each player's wrong guesses with their
    colour only at the end (the owner, 2 Oct 2026 - a phone shows only its
    own); the closest % of each board is held back with the pins (the owner:
    "only how many guesses" mid-round); the TV's map shows no continent until the end; 5 colour steps (the sheet's)
    and only the step of each guess goes to the table, never the kilometres;
    the right guess is never a pin before the round ends; no country names on
    the map (callouts name your own guesses only).

### The bar of the solo games, and كلمات من حروف upright (1 Oct 2026)

From the owner's sheet: «خروج» was a full-width ghost floating in the middle of
the screen, a second exit beside the header's arrow. In سودوكو, 2048, كاسحة
الألغام, الملكات, تانجو, النونوجرام, خيوط, كلمات من حروف, إيه اللي يجمعهم؟ and لعبة
الذاكرة it is a small quiet button (`btn--ghost btn--sm btn--auto play-exit`,
centred) in the bar (`.view-actions.play-foot`), and upright on a phone the bar
sits at the foot of the screen: the view and its stage are a flex column the bar
is pushed to the end of (the `.play-foot` block after `.view-actions` in
`Style.html`, ids listed there). On a phone on its side and on a big screen each
game keeps its own layout (the bar in the column beside the board). 2048's row
(رجوع, لعبة جديدة, خروج) moved to the foot the same way.

كلمات من حروف upright: a 7-row crossword put ⌫, لخبط, تلميح and ✓ half under the
tab bar at 375x812. The crossword and the ring now share what the screen has
left after its fixed parts (`--ww-room`, `--ww-ring` on `#view-play-wordwheel`,
portrait phones only): the ring about half, the crossword the rest by its rows,
the letters sized off the ring. The tools fit at 375x812, 390x844 and 375x667;
the exit under them may need a scroll.

**Fixes of the audit of 1 Oct 2026.** The solo Wordle board and keypad take the word's
direction (`dir` from `wordleLang()`, as the room board does), so an English word under the
Arabic interface no longer reads backwards. تحدي اليوم fetches the chunks of today's unfinished
dailies once and draws its list again (`renderDaily.asked`), so a board left half done says
«كمّل», not «العب». خمّن الدولة from the archive shows only its 📅 badge, not an empty «المستوى».
سلسلة الإجابات's question and answers are `dir="auto"` (a «?» at the right end). 2048 stamps
«رقم جديد» on a tie only when this game raised the best itself (`s.raisedBest`, taken back with ↶).

**Content of the review of 1 Oct 2026 (Part 2).**
- **Wordle's soft dictionary** (`JS_Wordle.html`): a guess no word list of the app knows
  shakes once with «مش في قاموسنا — دوس تاني لو متأكد» / "Not in our dictionary — press
  again if you're sure" (`wordle_not_in_dict`), and Enter again on the same word sends it
  (`wordleUnsure`). The known words (`wordleDictionary`) are the word wheel's banks whole -
  `wheelBankWords(lang)` in `WordWheel.js`, which `wheelDictionary` now cuts its 3-7 letter
  words from (same words, same order) - with `WHEEL_BONUS_WORDS` and every `WORDLE_DB`
  length, folded by `wordleDictKey` (one alef, ة/ه, ى/ي, ؤ/و, ئ/ي); a plural (-S, -ES; ات,
  ين, ون) or a leading «ال» counts when its stem is known. The banks live in the word
  wheel's chunk, so a Wordle board fetches it in the background (`lzEnsure(['wordwheel'])`,
  `LAZY_EDGES` 'JS_Wordle>WordWheel.js'); until it arrives every word is let through. One
  phone only: a room's Wordle (set and solve, the race) still takes any letters.
- **The daily's word** keeps to words a family spells one way: `wordleDailySafe(word, lang)`
  and `WORDLE_DAILY_SKIP` in `WordleWords.js` - in Arabic a final ي or ى (كمثرى, كوبري), any
  ء ئ ؤ (عصائر / عصاير, صحراء / صحرا), the loanwords (جاتوه, لاتيه, كافيه, شاليه, مايوه,
  فوتيه, بودنج, مشروم …) and colloquial forms (دايرة, زايدة, كهربا, قزازة, مراية, دفاية …);
  in English the British/American pairs (ARMOR, RUMOR, METER) and loanwords. 443 of the 540
  Arabic and 353 of the 361 English 5-letter words are left for the daily; the free game
  and rooms still deal them all. `wordleDailyPool` filters from `WORDLE_SAFE_FROM`
  (2026-10-03): 1 and 2 Oct keep the whole list, so a word already dealt under the walk
  (`soloDailyCycle`) stays the word it was; from 3 Oct the walk goes round the safe list.
  `npm run check` fails on a skip word the list doesn't have, or fewer than 200 left.
- **تشابه's hard puzzles had near copies**: 31-42 had mostly repeated 0-11 (the same five
  "parts of …", the Korean brands twice, cheeses/breads/pasta/rice/soups twice, capitals in
  three puzzles). Fifteen were rewritten in each language (15, 16, 31-42) as new themes:
  rivers/mountains/deserts/islands/lakes, things in each room of a home, countries by region,
  games (street, board, card, video, funfair), cooking, animal facts (young, homes, sounds,
  coverings, egg-layers), animals by habitat, tools by trade, famous names, occasions
  (wedding, Eid, Ramadan, شم النسيم, birthday), nature, the shops, shades of colour, buildings;
  23 swapped its cookware and spices (13's and 41's) for nuts and cleaning tools. A medium
  group «كلام بنقوله في المناسبات» is «تهاني ومجاملات». `validate-content.js` now fails when
  two puzzles of one level share three category names (folded), or two hard puzzles share a
  whole group (easy and medium are built of the basic kinds - seasons, colours - that can
  only be one set of four, so a repeated group is allowed there).
- **إيه اللي يجمعهم؟**: a category sharing `PIN_DECOY_MAX_SHARED` (4) or more words with the
  answer is never one of its choices (`pinMakeRound`; English «Sports ⚽» and «Sports 🏅»
  shared 11). The 🏅 one is «Olympic Sports» (Arabic was already «رياضات أولمبية»), and no
  two Chameleon categories share an icon or a name in a language now (`validate-content.js`
  checks): في الحديقة 🌷 (أشجار keeps 🌳), أجزاء العربية 🔧, أدوات الرسم 🖌️, ممثلين مصريين
  🌟, لاعبين كورة 👟, في ماتش كورة 📣. Its share and stats card are 🧩 (🔗 is تشابه's).
  `rules.mjs` deals every category of both languages six times and checks the choices.
  The decoys draw from the same seeded dice, so a daily's rounds can differ from the
  version before for a category that had such a neighbour.

## Sudoku for kids, 2048 sizes, خيوط from «كلماتنا», the flags map and streak: answered, not built yet (the owner, 2 Oct 2026)

Picked from the ideas page of 2 Oct 2026 (https://claude.ai/artifact/7Mhgw1ePSi3GhgEvDcSHxz, idea numbers in brackets) and every rule asked.

- **(415) سودوكو «للصغيرين» - DROPPED by the owner on 2 Oct 2026 ("drop this new sudoku, don't build it"), after its design sheet; kept here only as what was asked**: two kid sizes beside the normal levels, **4x4 and 6x6, with pictures instead of digits** (fruit or animals, the child picks the set; a 1-2-3 switch shows digits). **A mistake glows red at once and costs nothing**, a big 💡 fills one square, no limit; confetti and a star at the end; the time only if the parent turns it on.

- **(420) 2048 board sizes**: **3x3 (wins at 256), 4x4 (2048, today's game) and 5x5 (4096)**, each with its own best, the size remembered. **Free play only**: no daily changes, and 2048 stays out of the race (the 26 Sep decision). **Built 2 Oct 2026** (below).

- **(444) خيوط from «كلماتنا»** (built 2 Oct 2026, below): on the setup, «من كلماتنا» lists the packs saved on this phone (or a 6-letter code). **The family's words are the ones to find**, words of 3-8 letters in the grid's alphabet, longer ones skipped; the long «الخيط الملوّن» is the pack's name or its longest word. **If the pack has too few fitting words, the normal خيوط bank tops it up**, those words marked «من عندنا» so the theme still reads right. Never the daily. Arabic and English packs both.

- **(450) خمّن الدولة, a small map**: **always shown under the guesses** - a flat drawn world (the outlines baked once, no new data beyond them), each guess a pin coloured by distance (red far → green close), the answer's pin dropping with a flourish at the end; on one phone, the daily and the TV in rooms. **After the third guess the answer's continent glows** (a small help the owner asked for). **Built 2 Oct 2026** (look ج; *خمّن الدولة's small map* above).

- **(451) «جولة حول العالم», a flag streak** (built 2 Oct 2026, below): a third way inside خمّن الدولة (not a card, not in the race for now), one phone. **A flag and four names; a wrong answer costs a heart, three hearts**; the first 10 flags from tier 1, then tier 2, then tier 3 (`Countries.js`'s tiers); the wrong names from the same continent; no clock; the best kept.

### خيوط «من كلماتنا» and «جولة حول العالم»: built 2 Oct 2026

**خيوط from «كلماتنا»** (`JS_WordSearch.html`). The setup has a «الكلمات» switch above the level (`#strands-source`, `setStrandsSource`: «كلمات التطبيق» / «✍️ من كلماتنا», kept as `s.source`). «من كلماتنا» opens `#strands-pack` (`strandsPaintPack`): a list of the word packs on the phone (`packWordPacks` - the own «كلماتنا» and the crews' - plus one opened by code), and a code field with «افتح» (`strandsOpenCode`: `packFetch`, a quiz's code says «الكود ده لمسابقة، مش كلمات»; the pack is kept in `s.codePack` for this game only, never made the phone's own «كلماتنا»). Start (`startStrands` → `startStrandsPack`) deals `strandsPackMake(pack, level, rnd)`: the family's words folded with `strandsFold`, 3-8 letters in the grid's alphabet (`STRANDS_PACK_MIN` / `MAX`; phrases with a space, digits and longer words are skipped); «الخيط الملوّن» first (`span: true`), then the family's words shuffled, then the top-up (`ours: true`) from up to three Chameleon themes dealt through `freshPick('strands:ours:<lang>')`. The thread is drawn in its own colour on the grid (`.strands-cell.fs`, the warning pair) and ringed in the list with «🧵 الخيط الملوّن» (`.strands-word--span`); a top-up word carries «من عندنا» on its slot (`.strands-word__tag`) from the start. `s.pack` marks a family grid (null for the app's). Reload, hints, the timer and the result sheet are the game's own. The game's words (`STRANDS_TEXT`, `strandsT()`) live in its chunk, not the shell's TRANSLATIONS (the budget); the three switch labels and the help text stay in the shell.

Decided here (open to change):
- The grid's language is the alphabet most of the pack's words are written in (an English pack plays in capitals, an Arabic one in Arabic), whatever the app's language.
- The thread is the pack's name when it is one word of 3-8 letters (its words with a space don't count), shown as written (`label`, `title: true`); otherwise the longest fitting word. Every family word, once found, is listed as the family wrote it (`label`: أحمد, not the grid's folded احمد). When the thread is the name, the theme line reads «كلمات العيلة», so the header doesn't give the thread away; otherwise it is the pack's name.
- The thread is one of the level's words (easy 5, medium 6, hard 8), not an extra; the grid grows to 8 when a family word has 8 letters (easy is 7).
- A pack needs two fitting family words, the thread among them, or Start says «مفيش كلمات كفاية تنفع في الشبكة دي».
- No best is kept for a family grid (each pack is its own puzzle), and the race (سباق ألغاز) still deals the app's words.
- A pack played by its code tells the server it was played (`packPlayed`), so its year starts again.

**«جولة حول العالم»** (`JS_FlagsTour.html`, in the flags chunk). The third segment of «طريقة اللعب» (`setFlagsMode('tour')`, `s.mode`); with it the level field hides (`#flags-level-field`) and a line says the rules and the best run (`#flags-tour-hint`, `#flags-tour-best`, `flagTourBestText`). It lives in `appState.flags` with `playMode: 'tour'` and `s.tour = { hearts, score, asked, cur, choices, picked }`; `startFlags`, `paintFlags`, `restoreFlags` and `flagsHasWork` hand a tour to `startFlagTour`, `paintFlagTour`, `restoreFlagTour`. `flagTourDeal` picks the next flag through `freshPick('flags:tour:<tier>')` from the tier the run is in (`FLAG_TOUR_TIER_AT`: flags 1-10 tier 1, 11-20 tier 2, then tier 3; a tier used up in the run hands over to the next) and `flagTourDecoys` three names from the same continent, nearest tier first. The card is the flags card (`.flg-card` + `.flt-card`): the hearts (the streak's `.stk-hearts`), the stage and the score as chips, the big flag, «علم أنهي دولة ده؟» and four `.solo-choice` tiles. A right answer: the tile pops, the flag flies into the score (`flyEmoji`) and it counts up (`countUp`); a wrong one: the tile red and the right one green, the tiles shake (`soloShake`), the heart turns 💔, jumps and falls. The next flag pops in after `FLAG_TOUR_NEXT_MS` (`soloLater`). The end (`flagTourFinish`): the result sheet with the flags right, the stage reached and the best (`soloRecord('flags', 'tour', { score })`); «لفّيت العالم كله!» if every country was seen. A reload comes back on the same flag; one between an answer and the next flag deals the next (or ends the run) at once, and so does «كمّل اللعبة» after leaving in that pause (`continueFlags` → `restoreFlagTour`). The run's words are `FLT_TEXT` / `fltT()` in its file.

Decided here (open to change):
- Stage lengths: 10 flags of tier 1, 10 of tier 2, then tier 3 to the end of the run; the stage shows as a chip («دول مشهورة», «أصعب شوية», «بعيدة وصغيرة»).
- The answer stays up 0.95 s after a right one and 1.6 s after a wrong one before the next flag.
- The names are in the games' language the run started in, like the other two ways.
- The daily stays «من العلم»; a tour is never a daily and not in the race.

### 2048 board sizes: built 2 Oct 2026

- **`JS_2048.html`**: `G2048_SIZES` (3, 4, 5) and `G2048_GOAL` (256, 2048, 4096). The setup has
  «حجم اللوحة» (`#g2048-size`, `set2048Size`), remembered as `appState.g2048.pick`; Start deals
  that size into `s.size`, which every rule reads (`g2048N(s)`: the spawn, the slide, «can it
  move», the win), so «كمّل اللعبة» and a reload come back on the board as it was, whatever is
  picked meanwhile (the button says the other size when they differ). The board is drawn with
  `--n` (`.g2048-board--3/--5` scale the numbers, `--g2048-fs`; 5x5 has a tighter gap). The win
  sheet says the size's goal (`g2048_won` takes `{n}`), the hint and the setup say it too
  (`g2048_goal`).
- **Bests per size**: `soloBest('g2048', g2048Level(n))` - 4x4 keeps the key it always had (`''`),
  so nobody's best is lost; 3x3 is `'3'`, 5x5 `'5'`. The stats sheet (JS_Daily.html) lists the three.
- No daily and no race change (free play only).
- Decided here (open to change): a new game on the setup takes the size picked there, and a game
  already on the board keeps its own size until it ends or a new one starts. «لعبة جديدة» and «العب تاني»
  from inside a game keep that game's size (the owner, 6 Oct 2026: `start2048(n)`); only the setup's Start
  deals the setup's pick.

## The ideas of 7 Oct 2026, second batch (the owner's picks): built - part one

The owner's answer to each: "build as described" (no extra rule asked). The details below
marked *chosen* were left to the builder (the simplest family-friendly one).

- **1078 الذاكرة: the result through `soloResult`.** `memoryFinish` keeps the board's end
  as before and calls `memoryShowResult()`: the solo sheet with 🎴, the moves counting up
  (`value`), the time and (when not beaten) the best as lines, the gold stamp on a new best
  (`record`), confetti, «🔄 العب تاني» (`startMemory`), «شوف اللوحة» and exit (`setupMemory`).
  Two players: the winner (or «تعادل!») as the title and each score beside its name, no count.
  The best per size is the same `ashryMemoryBest_v1` as always, weighed once per board
  (`m.weighed`, `m.recorded`, `m.prevBest`, reset in `startMemory`). Memory is now a
  registered solo game (`soloRegister('memory', { …, timed: true })` through `SOLO_LATE`), so
  «شوف اللوحة» knows its board, a language change repaints through `repaint`, and the sheet
  pause and the away-pause run through the solo pieces (its own hooks stay, harmless).
  `#memory-result-modal` and `replayMemory` are gone (Controller.html, and its two lines in
  `tools/lazy-split.mjs`: `POPUP_CHUNKS`, `MARKUP_USES_OK`).
- **1082 خمّن الرقم: the friend's secret as dots.** `#gn-secret` is a `.secret-field`
  (`type="text"`, `inputmode="numeric"`, the letters transparent, one dot a digit drawn by
  `gnSecretDots`) with an eye (`gnSecretEye`, `gn_show_secret`), as المشنقة's word; Enter
  starts. `gnSecretValue` reads Arabic-Indic and Persian digits too (a text field keeps what
  the keyboard typed). After Start the field is emptied and hidden again.
- **1090 تحدي اليوم: the archive's «all done» for that day.** `DAILY_GAMES` entries carry
  `since` for the dailies added after the hub opened (16 Sep 2026): خمن الكلمة and تشابه
  `2026-09-28`, ميني جولف and ألغاز شطرنج `2026-09-24` (the days they were committed).
  `dailyLiveOn(day)` (JS_Daily.html) is the dailies that day had - and for today
  `dailyLive()` (none switched off). The archive's day badge, its ★, its aria label and
  «اتحل n من m» count only those, and only their results (an old الترتيب الأعمى result no
  longer counts). The list under the calendar still shows every daily (each can be played
  from the archive).
- **1099 خمن الكلمة: «✍️ اكتبها لصاحبك» on one phone.** On the setup (one phone), under the
  daily: a button opens a small form (`#wordle-friend-form`, `wordleFriendOpen`): a
  `.secret-field` with its dots (`wordleFriendDots`) and eye (`wordleFriendEye`), the rule
  line (which turns into the error, `wordleFriendHint`), and «تمام، ادّي الموبايل»
  (`wordleFriendStart`). The word is checked as the room checks a set word (`wordleFriendWord`:
  marks and tatweel off, أ إ آ ٱ as ا, spaces out, capitals; 5 to 8 letters all on one
  keypad); its alphabet picks the keypad (`s.lang`), whatever the games' language. The board is
  the usual one with `s.friend = true`: its badge «✍️ كلمة من صاحبك», no dictionary nudge (any
  guess the keypad types, as in the room), no list memory, not a daily. The result says the
  word as typed; «✍️ اكتب واحدة تانية» opens the form again. The form empties and closes when
  the setup is left. *Chosen*: no separate «pass the phone» card - the board opens at once and
  the word is never on it, so the writer just hands it over.
- **1107 تشابه: free puzzles end properly.** `finishConnections` keeps a free puzzle's tally at
  once (`connectTally(level, won, mistakes)`: `soloRecord('connections', <level>, { solved,
  perfect, played }, () => true)` - a running count per level, not a best), and
  `connectSettle` ends every board on `soloResult`: the groups found counting up, the mistakes,
  and for a free one «متوسط: حلّيت 12 · 4 من غير غلطة» (`conn_tally`); again is a new puzzle of
  the level, exit the setup; confetti on a win from the sheet.
- **1113 سودوكو: «🔢 كل الاحتمالات».** While ✏️ is on, a row under the tools holds the button
  (`sudokuAllNotes`): every empty cell's notes become its candidates (the numbers its row,
  column and box don't hold; a red number counts for nothing, a race's conflicting one
  neither), the changed cells fade in. One undo step (`{ i: -1, all }` in `s.undo`,
  `undoSudoku`) puts every note back. Notes keep themselves clean as before (a right number
  clears itself from its peers). It is no hint: the best still counts; `s.autoNotes` puts
  «🔢 اتحلّت بـ«كل الاحتمالات»» on the result and ` · 🔢` on a daily's share. The race may use
  it too. *Chosen*: shown only with ✏️ on (five buttons in the tools row didn't fit 375px).
- **1134 الملكات: «🔣 نقشة لكل لون».** A switch on the setup (`#queens-patterns`,
  `setQueensPatterns`, `queensPatternsOn`; this phone's setting `ashryQueensPatterns`, so a race
  board wears it too) puts `.is-patterned` on the grid: a faint pattern per region over its
  pastel (dots, stripes at 45°, across, down, at -45°, a grid, a cross-hatch, rings, a checker,
  a zigzag: `.queens-grid.is-patterned .queens-cell.q0…q9`, Style_Solo.html). *Chosen*:
  patterns, no letters (a letter would sit under the crown); off by default.
- **1140 شمس وقمر: sunrise to night on a win.** `tangoSky(cells)` replaces the flip on a solo
  win (the race keeps `tangoCelebrate`): a `.tango-sky` layer under each mark - the suns' warm
  glow fades in from the bottom row up while each sun rises and grows, then the moons' cells go
  to night (an indigo sky with a small star) while each moon dims. Transform and opacity only,
  nothing with motion off; the result follows when it has played (`skyMs + 250`).
- **1142 شمس وقمر: «⏱️ تحدي التلات دقايق».** A button on the setup (`startTangoRun`) with its
  line and best (`#tango-run-best`). `s.run = { count }`: easy boards (`tangoMake('easy')`), one
  clock for the run (`s.startedAt`, moved forward while the board is away like every timed
  solo clock, so it is three minutes of play), counting down in the bar with the boards solved
  (`tango-run-count`). A solved board (`tangoRunNext`) pops, is counted, and the next is dealt
  into the state at once and drawn a beat later (`tangoRunHold`: taps wait). No hint in a run.
  At nought (`tangoArmTimer`'s painter → `tangoRunEnd`) the board stops and the sheet counts the
  boards up, with the best (`soloRecord('tango', 'run3', { count })`, the most). «كمّل اللعبة»
  and a reload come back to the run with the time it had; a free board or the daily clears
  `s.run`.
- **1148 نونوجرام: a count bubble while dragging.** `nonoBubble(x, y, count)`: from the second
  cell a drag paints, a bubble over the finger (`.nono-bubble`, fixed under `<body>`, placed
  with transform, popped on each new count with `soloPop`) says how many cells the drag has
  painted; gone when the finger lifts (`nonoBubbleHide` in the drag's `end`). Western digits,
  as every number in the app.

Shared files touched: `app/Controller.html` (the markup of these screens; the memory popup
removed), `app/JS_Daily.html` (1090), `styles/Style_Solo.html` (queens patterns, the tango sky,
the nonogram bubble), `tools/lazy-split.mjs` (the memory popup's two lines).

## The ideas of 7 Oct 2026, second batch (the owner's picks): built - part two

- **(1153) سلسلة الإجابات: a heart back for five in a row.** Five right answers in a row bring one lost heart back (never above three) and the count starts again; with all three hearts the run just goes on. `s.run` (reset by a miss), `STREAK_HEAL_RUN` = 5 in `answerStreak`; the heart flies from the score chip into its place (`streakHealFly`: `flyEmoji` with an arc, `soloPop` with motion off) with a toast «5 صح ورا بعض: قلب رجعلك!»; while a heart is lost a chip «🔥 n/5» shows the run (`streakRunHtml`). Works in the daily too; never in the race (no hearts there). Chosen: the toast and the chip (not asked).
- **(1154) سلسلة الإجابات: «راجع غلطاتك».** Every miss (wrong or out of time) is kept in `s.missed` (`streakMissOf`: the question - a proverb's blank as «…», the emoji clue - the right answer and what was picked, the last 20); the result sheet lists the last 10 under a «📝 راجع غلطاتك» box (`streakReviewHtml`, spans inside the sheet's line so no shared code changed; `.stk-review` in `Style_Solo.html`, scrolls past 13rem). A daily's share picture never carries it (`shareLines`).
- **(1171) كلمات من حروف: the big word.** A grid word of all the letters (the base word, or an anagram of it in the grid: `wheelIsBig`) turns its cells gold (`.wheel-cell.is-big`, `--warning-btn` / `--warning-on`), says «🏆 الكلمة الكبيرة!» and its cells pop (`wheelBigMoment`), puts a 🏆 in the bar (`s.bigFound`) and a line on the result. Its points double only in «بالدور» (`wheelWordPts`): alone the game is timed, it has no points to double (the idea's premise, adapted). On a racer's phone in سباق ألغاز the 🏆 lights too (`RACE_UI.wordwheel.sync`); the race's own scoring is unchanged.
- **(1172) كلمات من حروف «بالدور».** A «طريقة اللعب» switch on the setup (`#wordwheel-way` in Controller.html, `setWordWheelWay`, remembered as `way`, a `prefs` key): لوحدك / بالدور. Start asks two names through the players sheet (`wheelAskDuo` → `askPlayers(2, …, { max: 2 })`, prefilled with the first two in the round). `s.duo = { names, cur, pts, owner: { wi: player } }`. Every try passes the turn - a grid word, a ⭐ bonus word or a miss - except a word already found; a grid word is filled in in its finder's colour (`.is-p0` `--team-red`, `.is-p1` `--team-blue`; a crossing cell keeps the first finder's colour) and scores its letters, the big word double; the bar shows both names and scores, the one whose turn it is ringed, with «دور …» under it; the points count up (`wheelDuoGain`). No hint, no record, never the daily. The grid full: most letters wins, or a draw (`wheelDuoFinish`: 👑 or 🤝, both scores, «العب تاني» keeps the two names). Chosen: a bonus word scores nothing and passes the turn.
- **(1178) خمّن الدولة «رحلتك».** After a win on one phone the map draws a dotted line from the first pin to the next and on to the gold one, a segment after another (`fmapHtml`'s `route`, `fmapRouteSvg`, `.fmap__route`, opacity only, from 1.4 s); a reload draws it still. «📤 شارك رحلتك» on the finished board (not in the daily or a past day: the picture would give the day's answer away) draws a share card of its own - the map's outlines (`Path2D` from `FMAP_LAND`), the numbered pins in their colours, the gold star, the dotted route, the guesses in order with their km (`fmapDrawRoute` in JS_FlagsMap.html, `flagsShareRoute` / `flagsDrawRouteCard` in JS_Flags.html) - through `shareResultCard`, which now takes `o.draw` (one line in `app/JS_ShareCard.html`). A first-try win has no line (one pin), and still shares.

## The ideas of 7 Oct 2026, third batch (the owner's picks): built

- **1079 الذاكرة: the big board laid out for a wide screen.** `MEMORY_SIZES.l` has
  `wide: 6`: the 30 cards are 5 × 6 on an upright phone and 6 × 5 on a phone on its side
  and every wide screen (`--mem-wcols` / `--mem-wrows` on `.mem-grid`, read by the wide
  layout's rule in `Style_Party.html`), so they are about a fifth bigger there (53px
  instead of 44 at 667×375). 6 rather than 10: 10 × 3 measured smaller at every size,
  since the board's width is capped at 62vw. The small and middle boards are unchanged.
- **1080 الذاكرة: whose turn, impossible to miss.** With two players each chip has a colour
  dot (player 1 blue, player 2 orange, `--mem-c1` / `--mem-c2`), one ring in the player's
  colour slides from chip to chip when the turn passes (`.mem-turn`, moved by
  `memoryTurnSlide` from `memoryPaintBar`, a Web Animation from the old place,
  transform only, set at once when motion is off), and the board's edge takes that colour
  (`.mem-grid--duo[data-turn]`).
- **1095 تحدي اليوم: three states at a glance.** Each row is one of three: «العب» a badge in
  the game's own colour (`.daily-row__go`), «كمّل» amber with a half ring
  (`.daily-row__go.is-going`, `.daily-ring`) and an amber edge on the row, done: the row
  dimmed (`surface-2`, the icon faded) and its result in green. Chosen: the ring is a fixed
  half ring meaning «started» - the games keep no common measure of progress to fill it
  with.
- **1097 تحدي اليوم: the done-all moment.** The first time this phone shows the day's dailies
  all done (`dailyGreetOnce`, `ashryDailyGreet_v1` = the day, so a reload doesn't greet
  again) the top card shows the streak (`.daily-allstreak`, 🔥 n days), which pops in and
  counts up to today's number, the page scrolls to the top, the share buttons pop in after
  it (`.daily-pop`), and confetti with the success sound follow (`afterReveal`). Later
  visits that day show the same card, still.

## History

The day-by-day log of the work on this game is in `notes/log.md` (search it for the game's name); a new entry goes there, and anything that changes how the game works goes in this file.
