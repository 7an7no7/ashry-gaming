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
- **Bests and dailies** live in this phone's storage: `soloRecord(id, level,
  result, isBetter)` (`ashrySoloBest_v1`) and `soloMarkDaily(id, result)` /
  `soloStreak()` (`ashryDaily_v1`, two months kept). A setup screen's daily
  line is `soloDailyButtonHtml`.
- **The result sheet** is `soloResult({ icon, title, value | valueText,
  valueLabel, lines, win, share, again, exit })` (`#solo-result-modal`): the
  number counts up, a daily result can be shared as text, confetti on a win.
- **Layout.** A board and its controls are `.solo-layout` with
  `.solo-layout__board` and `.solo-layout__side` (the stats bar, `soloBarHtml`,
  goes in the side): one column upright, with the bar on top through
  `display: contents` and `order`; two columns on a phone held sideways, the
  board sized off `--app-h` so it needs no scrolling (a minefield, taller than
  wide, scrolls instead) and on any screen at least 900 wide; the word and
  quiz games' lists and cards take a narrower board. Grids that map to a
  physical board carry `dir="ltr"`. Styles are section 15 of `Style.html`.
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
  removes numbers while `sudokuCount` still finds exactly one solution (easy
  40 givens, medium 32, hard 26; a few milliseconds). Mistakes, notes that
  clear themselves, undo, hints (a solve with hints is no best), and a row,
  column or box that comes right ripples. The daily is medium.
- **2048** (`JS_2048.html`): tiles keep an id so the same element slides
  (a `transform` transition) and a merged pair pops with `scale`; one undo;
  swipe on the board or the arrow keys. No daily: a best score only.
- **كاسحة الألغام** (`JS_Mines.html`): the first tap is always safe (the mines
  are laid after it); a long press or 🚩 mode flags; a satisfied number opens
  its neighbours; an opened patch ripples out from the tap. The daily lays its
  mines from the seed around a safe cell that opens by itself.
- **الملكات** (`JS_Queens.html`): crowns placed so none touch (`queensPlace`),
  one region grown from each at random (`queensGrow`), then while
  `queensSolve` finds a second solution one of its crown cells is handed to a
  neighbouring region (keeping regions connected) until one solution is left
  (under 10ms). A tap cycles ✕ → 👑 → empty, a drag marks ✕, a crown breaking
  a rule is outlined red. 6/7/8 wide; the region colours are a fixed pastel
  set with dark ink, like the Connections groups.
- **شمس وقمر** (`JS_Tango.html`): a full valid 6×6 grid (`tangoFill`, three
  of each per line, never three alike in a row), clues (given cells and =/×
  signs) added at random until `tangoCount` finds one solution, then removed
  while it still does; easy and medium get a few removed givens back.
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
Wake Lock API; after a turn every word can be tapped to fix a wrong verdict;
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
`DAILY_GAMES`.

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
  English. A base word of 5/6/7 letters, every word its letters spell, and
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
  The daily is ten seeded questions.
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
  jsDelivr) for `.flag-emoji`.

## History

The day-by-day log of the work on this game is in `notes/log.md` (search it for the game's name); a new entry goes there, and anything that changes how the game works goes in this file.
