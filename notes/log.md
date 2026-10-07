# The log

Moved from GEMINI.md on 30 Sep 2026. GEMINI.md keeps the rules that apply to every game and an index; this file keeps the detail, word for word.

### The log

- **15 Sep 2026** - the catalog home, a hero on every setup screen, four tabs;
  the wordmark icon (design 28); القنبلة, أتوبيس كومبليت, الذاكرة, إكس أو,
  مين يبدأ and الجرس; the every-game-every-mode review; one fold for typed
  text; the finish layer; صدق ولا كذب, فوازير إيموجي, كمّل المثل, خمس ثواني
  and ارسم واكتب; the games' language setting; the soundboard; ربع قرد as
  referee with rooms; the drawing toolbox and the room chat.
- **16 Sep 2026** - ten smoothness touches (section 12); share the app; the
  dice and coin in 3D; a way out mid-round and take-backs for presses the
  phone can't verify; the live player count; "دورك!", chat reactions, room
  events and team chat; the intro ("the logo flies home"); the motion passes
  (section 14: card-to-hero, room start splash, nav pill, code drop, score
  count-up, vote suspense, the spy card, the podium, the letter spin,
  Connections and team flights, the back flight, hold-to-reveal); smoothness
  fixes (Web Animations for flights, no-op `applyTranslations`); the install
  sheet; Stop's full-sheet وقف and dictionary; the bomb's louder tick and
  sound waking; a real applause. Found on the way: the one-phone الجاسوس's
  default category had crashed since the ربع قرد rebuild (*Traps*).
- **16 Sep 2026, later** - the solo games: `JS_Solo.html` and Sudoku, 2048,
  Minesweeper; Queens, Tango, Nonogram; then خيوط, كلمات من حروف, إيه اللي
  يجمعهم؟, سلسلة الإجابات and الترتيب الأعمى, all from existing lists. The
  trivia questions moved to `TriviaQuestions.js` so the page can ask them.
  Then خمّن الدولة with its country table, the تحدي اليوم hub, على راسك,
  and in rooms زي الكل and مافيا (the owner's spec: Classic and Roles, the
  Lawyer, the app choosing the Mafia count, roles hidden when someone leaves
  unless turned on, a discussion clock). Robot tests: 763. The soundboard moved from Settings
  to the tools. Solo boards sit beside their
  controls on laptops and TVs too (Sudoku's pad had been below the fold at
  1280×720). Last, the card game score keepers, with their rules researched
  (Jawaker, pagat.com, Egyptian tables) before the numbers were written.
- **16 Sep 2026, the audit** the owner asked for: every new game at 375×812,
  667×375 and 1280×720, Arabic and English, light and dark, with a script
  that flags a page wider than the screen, taps under 36px, text cut off, and
  a check that each game's moment really animates. Found and fixed: Sudoku's
  number pad had shrunk to 154px on phones since the day it shipped (*Traps*:
  auto margins in a flex column); سلسلة الإجابات showed a year among three
  words (*Solo games*); on the owner's PC no motion at all (*Motion on a
  computer*); the Mafia and Herd TV results ran off the screen; the TV clock
  sat at the edge; 2048 now keeps its best as the score grows, asks before a
  new game, and ends a board that is already stuck.
- **17 Sep 2026, the whole-app audit** the owner asked for after two days of
  new games: eight code reads by area (shell, help and home, solo, one-phone
  party games, card scorers, rooms server, rooms client, the stylesheet) and a
  screen-by-screen sweep of every view at 375×812, 667×375, 1280×720 and
  1920×1080, Arabic and English, light and dark, plus every room game on a
  phone and on the TV with robot players, and reloads mid-game. Found and
  fixed, the worst first: the face-down role card was shorter for the spy
  (*Traps*); فيبج sent the real answer to every phone before the vote and كلمة
  واحدة the removed clues to the guesser; مافيا's night screen showed each
  role at a glance; a daily could be replayed until it looked good; a مافيا
  player leaving meant the game never ended, and a TV host never handed on;
  double taps on host verdicts hit the next player; the one-phone bomb ticked
  forever after leaving; من أنا؟ and بدون كلام dealt "Error" after a language
  change; a card game's rules could change mid-game and wipe it; a background
  loop redrew the nav 59 times a second on an idle screen; about sixty strings
  of markup stayed Arabic in English. Added along the way: the phone's back
  button and the bottom tabs ask before leaving a round, clocks pause under
  the exit sheet and Help, the keep-alive and kick for rooms, host recovery
  buttons on the phone and the TV, score keeping and take-backs in the
  one-phone party games, the card tables' seating strip and preview, resumable
  dailies with clocks that count play only, a new-version toast, popups in
  the game's colour. Robot tests: 862.
- **17 Sep 2026, later** - سكرو: the owner's spec (*The owner's specs*) in
  rooms (`SkrewCards.js`, `screwAction`, `JS_RoomScrew.html`), and the table
  calculator rebuilt around the real rules (the caller, the doubling, the
  thief, teams). Then the owner's rulebooks and answers (*The owner's specs*):
  a hand that runs out, sudden death, a tie counting for the caller, the thief
  vote, بوم and اللايف جاكيت, the failed throw back face down, the memory helper,
  animations for every move, and picking at twelve players. The phone's back
  swipe on iPhone: an entry per screen, so Safari slides in the real screen
  (*Navigation*); the new-version toast no longer shows on a page that already
  is the new build. Robot tests: about 980 (the سكرو robots loop until every
  card they need has come up, so the count varies a little).
- **17 Sep 2026, evening** - سكرو: بوم as a table-wide throw and صرخة أوسكار
  as a blind re-deal, both giving the player a new turn (the owner's
  descriptions); the new card design (colour blocks, drawn icons) and seat
  layout the owner picked from a design sheet, with hands stacking in even
  rows when they don't fit.
- **17 Sep 2026, night** - الترتيب الأعمى removed at the owner's request
  (*Decided, and why*); تحدي اليوم now has ten dailies. Then the owner's
  reports from an evening with the app: كمّل المثل rewritten as Egyptian
  colloquial only; every game's new step and podium drawn from the top of
  the screen (`scrollToAction`); سكرو's +20 and red screw kept or thrown
  like any card, no warnings; the browser gate for TVs (*Browsers the app
  runs in*), after the TV's own browser showed a white page; and a storage
  read that could stop the app from starting at all. The "look at the board"
  button the owner reported was checked on every solo game and works; if it
  fails again, the game and the phone are what to ask for. Later: typed
  guesses judged leniently (`guessVerdict`: طماطم is طماطماية, a letter off
  in a long word counts, a near miss says so) in ارسم وخمّن, the fake
  artist's guess and the quiz cards; the drawing list cut from 900 to 690
  drawable words (خلد had been dealt).
- **20 Sep 2026, سكرو's action cards** - the owner went through the deck card
  by card as three groups. Two things were wrong and were fixed: بوم and صرخة
  أوسكار could be kept in hand or thrown and then skipped, and they now fire
  the moment they are drawn; and على كيفك was a free pick from a fixed list of
  four, and is now a mimic of a command card lying on the pile, falling back to
  a plain بصرة when there is none. Found while fixing the second: the phones
  are shown only the top of the pile while the server read the whole stack, so
  the two now read the same window. Three other differences in the owner's
  list were put back to them and they kept what was built: المسحراتي stays a
  forced سكرو, command cards keep their face value where they have one (a 7 is
  7, not 10), and بصرة and المدفع are ordinary "throw it or keep it" cards.
  اللايف جاكيت was already exactly as described.

- **20 Sep 2026, one voice** - a design pass over the pieces every screen is
  built from, so lifting one screen lifted all of them (*The design system*,
  *One voice*): the variable font ranges and a weight scale with a floor,
  Baloo Bhaijaan 2 on the things that name a screen, warm paper and ink in
  place of cold slate, a card carrying its game's colour in one corner, the
  selected chip on the screen's accent instead of near-black, a press
  proportional to what is pressed, and `flipGrid` so a filter rearranges the
  grid instead of redrawing the page. Checked with a computed-style sweep
  (contrast against the composited background, tap size, horizontal overflow)
  over the catalogs and setup screens at 375x812, 667x375 and 1280x720, both
  themes, both languages: the tightest ratio is 4.63:1 and there are no tap
  or overflow failures. Nothing the rooms server runs was touched, so no
  deploy. Then the same sweep over **all 133 views in both themes**, run
  twice - once with the new tokens, once with the old ones injected - and
  diffed: **nothing regressed**. It turned up two things worth fixing, one
  in the change's own blast radius and one that had always been there: the
  thumb and the nav pill are not re-measured when a webfont swaps in
  (*Traps*), and a day in تحدي اليوم's archive calendar was 39px, under the
  floor - seven across a 375px phone is the whole constraint, so the gap
  gave the pixels back.
- **20 Sep 2026, the home's first screen and the card text** - the two things
  the *One voice* pass had left for the owner to decide, decided and built
  (*The catalog and the home screen*): the hero folds to the ways in alone for
  a phone that has played before and the player filters fold behind one pinned
  chip, so the first game card sits at 445px instead of 570px of a 690px
  screen; and every card description was rewritten to land inside its two
  lines - 31 of 49 in Arabic and 43 of 49 in English had been running past it,
  so most of the grid ended mid-word. Checked by lifting the clamp and
  counting lines: none over, either language. The dark stages stay cold slate
  and the phone pass was declined, both the owner's call.
- **21 Sep 2026, every size** - the owner opened the home on a PC and found
  the returning hero's four tiles bunched into the left half of the bar
  (*The catalog and the home screen*, *Traps*). Fixed, and the tiles now say
  as much as the hero's own width allows (a container query in three
  steps); the ▾ chip sits beside the modes wherever they fit; the مع بعض
  share link has its own centred line instead of a cell under the first
  button. Then all 133 views at six sizes (375x812, 667x375, 768x1024,
  1024x768, 1280x720, 1920x1080), both themes, plus a live room on a phone
  and as a TV at four sizes: no tap, overflow or contrast failure anywhere
  (1,596 view/theme/size combinations), and the TV lobby fits 1920x1080,
  1280x720 and 1024x768 without scrolling. Put to the owner: the one-card
  ورق وطاولة section, the two sections that both say puzzles, and whether
  setup forms should stay full width on a laptop - and the same day decided
  and built (*Decided, and why*): سكرو as a spotlight across its row, the
  sections regrouped so each name is true, setup screens at a form's width
  from 900px. Swept again at all six sizes in both themes: no failures, and
  nothing left on the home that uses part of its row.
- **21 Sep 2026, four table games asked for** - أونو, الدومينو as a real game
  (its score keeper kept, as سكرو kept its), كونكت ٤ with four or five in a row,
  and Plato's نقط ومربعات. Every rule was put to the owner before a line was
  written, and each look picked from a sheet of three (all four: option أ).
  Built first, for the table games: computer players (*Computer players*), the
  shelf of three and the score-keeper shortcuts. On the way, two سكرو
  questions from the owner turned into fixes: any screw now goes on any screw,
  and asking what the screws and +20 look like showed that **every سكرو card
  had been blue since 17 Sep** (a default colour outranking the colour groups,
  *The owner's specs*); the whole deck was then checked card by card.
- **21 Sep 2026, the duels** - كونكت ٤ and نقط ومربعات, the owner's decisions
  asked one by one (*The owner's specs*, *The duels*): two on one phone,
  against the phone at three levels, and rooms where two play and the room
  watches, winner stays on. The rules live once, in `Connect4.js` and
  `DotsBoxes.js`, which the page inlines and the Worker bundles, with the
  phone's players in the same files (an alpha-beta that deepens until 250ms
  are up; a Dots player that counts out the safe lines and double-deals in
  the endgame); the rooms are `RoomDuels.js`. Motion on every move: the disc
  falls with a bounce, the line draws itself, the box pops, the winning line
  lights one disc at a time, the turn ring slides, scores count up. Rules
  tests: 58 new (the win lines, the draw, box capture, the AI always legal,
  never a third side while a safe line is left, the double-dealing move,
  winner stays on, a draw, a forfeit, a latecomer). Robot tests: about 1125
  (a game of each to the end, winner stays on with a latecomer and a forfeit,
  a played-out draw, illegal and stale moves, the TV unable to move). Found
  on the way (*Traps*): `rules.mjs` stops the clock, so a search with a time
  budget never ends there; and a headless Chrome screenshot at 375 wide is
  laid out at its minimum window width.

- **20 Sep 2026, the roadmap** - an audit of the whole app became a nine-phase
  plan the owner agreed, built on a branch and shipped in one go at their
  request. A report per phase is in `notes/archive/plans/phase-reports/`, each listing what
  was verified and how; what those reports could not settle - the things that
  need a real phone, TV or table - is gathered in `notes/TO-TRY-ON-A-PHONE.md`.
  (The plan itself, `notes/ROADMAP_RUNBOOK.md`, was deleted once every task in
  it had shipped; the reports still quote it, and its decisions are here in
  *Decided, and why* and *The owner's specs*.) Phase 0 corrected content that was wrong on
  the live site; then the TV as the room's only voice, a card-scorer round that
  can be fixed without destroying the ones after it, the home's player-count
  and together-or-apart filters, اختارلنا, the archive of past dailies and
  أرقامي, المختلف (nobody is told their role), the leaderboard of the night,
  and the motion batch (the وقف slam, the خمّن صح stamp, the Wordle shake,
  Mafia's night and day, points that fly to the board, the one-away shake, the
  buzzer ring, the last three seconds, the titles at the end). Then the share
  card, العقل, قبل ولا بعد and the Mafia narrator. Robot tests: 1071.
  Found on the way, outside the plan: the room trivia clock had never ticked -
  `JS_TriviaBoard.html` is concatenated after `JS_RoomTrivia.html` and its
  `paintTriviaTimer` silently replaced the room's (*Traps*).
- **21 Sep 2026, الدومينو** - domino as a game of its own, on the phones and
  the TV, to the owner's rules asked one by one (*The owner's specs*): 2-4
  players or computer players, solo or partners opposite seated by the host,
  عادي and أمريكاني with the spinner, drawing with two or three and knocking
  with four, the double six opening the first round and the winner leading
  the next, a target, the helpers and a turn clock that are the host's and
  off by default, and the easy and hard computer players. The shared tile
  logic (`DominoTiles.js`, with a layout that snakes on a phone and makes a
  cross round the spinner, checked over hundreds of full tables to never
  overlap), the rules (`RoomDomino.js`) and the renderer (`JS_RoomDomino.html`,
  section 21 of `Style.html`) in the ivory look the owner picked, every move
  animated, the round's hands turned over and counted, a podium or the two
  sides at the end. Later the same day the owner's rule for every screen -
  while a round is played the table gets most of the screen, names and
  scores a compact strip - reshaped the phone, laptop and TV layouts (the
  table is 97% × 72% of the TV). The score keeper stays the setup's "على
  الطاولة" side. Robot tests: 1160, with 62 of them domino's; the rules test
  pins the tiles, the ends, the points, the rounding and every way a round
  ends. Nothing of the other games changed; a deploy is needed for the rooms
  server.

- **21 Sep 2026, أونو** - the whole game in rooms and on the TV, to the
  owner's rules asked one at a time (*The owner's specs*), with computer
  players on the room's bot hook: `UnoCards.js` (shared), `RoomUno.js` (the
  rules and the bots), `JS_RoomUno.html` (the phones and the TV), section 20 of
  `Style.html`. The look picked from a design sheet (colour blocks, like
  سكرو's), every move animated, the play area first at every size, measured.
  The rules tests play 45 whole games of bots across every variant; the robots
  play every rule on a live server (one person and two bots included, finishing
  on the server's clock).
- **21 Sep 2026, the four together** - أونو, الدومينو and the duels merged
  onto one branch with the play-area pass (*Decided, and why*: the play area
  gets the space) and checked in the browser as a table would play them. Found
  and fixed: a one-round أونو still printed "+135 points" although the owner
  had chosen it as the mode with no points (it is won, and counts wins across
  play again now); a wild card's black face melted into the dark table (a
  faint rim); on a phone on its side the domino "دق" was below the screen (the
  seats two to a row, six tiles to a row, the bar sticky at the foot); and a
  robot test that failed whenever the random seats made the host the one who
  leaves. Robot tests: 1381.
- **21 Sep 2026, one thing to do** - every game checked for a tap that has
  only one outcome, and each made automatic after a beat (*Decided, and
  why*: one thing to do is done for you; *Forced moves*): أونو, الدومينو with
  the helpers on, the memory game, قبل ولا بعد and سكرو. The last move of
  كونكت ٤, نقط ومربعات and إكس أو was made automatic too, then taken out at
  the owner's word the same day - it is so often the winning move - and
  الدومينو's last tile was left to the player for the same reason. Rules
  tests pin the Uno take and draw (and the wait while someone can be
  caught), Domino with the helpers on and off and its last tile, and the
  duels' last move left alone; a robot game's window was widened, since a
  long three-player أونو can run past two minutes.
- **21 Sep 2026, icons** - أونو and الدومينو drawn as their own card and tile
  (`ICON_ART`, `iconHtml`), four other icons that clashed or said nothing
  replaced (*Decided, and why*), and domino's دق renamed باص.
- **21 Sep 2026, your own move at once** - two reports from the owner playing
  in rooms: in كونكت ٤ a disc seemed to fall twice (the aim disc faded, then
  the real one dropped a round trip later), and in أونو a card played right
  after a Skip took a second. Both were the phone waiting: for the server in
  the duels, for the table's motion in أونو. The duels now draw your move as
  your finger lifts and the server's board carries it on (*The duels*); in
  أونو your own move is drawn the moment the server takes it, with whatever
  was still flying playing on (*أونو on the phones and the TV*), and a tapped
  card rises at once. Checked against the old build in headless Chrome: the
  same motion per move (every Skip stamped, every card flown), nothing left
  hidden or floating, one fall per drop on one phone and against the phone,
  a refused move put back, and motion off still without motion.
- **21 Sep 2026, لودو** - the owner picked لودو and بنك الحظ from a list of
  ideas, answered every rule of both one question at a time (and checked the
  بنك الحظ answers against another AI's rulebook, which moved four of them:
  *Waiting*), and picked look أ for both from a design sheet of three. لودو
  was built the same day: the rules and the computer players once in
  `Ludo.js`, the room in `RoomLudo.js`, the board, the die and every move's
  motion in `JS_Ludo.html` (against the phone too), the room and the TV in
  `JS_RoomLudo.html`, section 22 of `Style.html`, a drawn icon. Rules tests:
  the board's geometry, every rule and 27 whole games of bots, 2-4 players,
  easy and hard. Robot tests: 1429, a لودو round among them. بنك الحظ is next.
- **21 Sep 2026, بنك الحظ** - built after the owner approved the places,
  prices and card texts and answered four more questions (*The owner's
  specs*): the rules once in `BankAlhaz.js` (the board, the two decks in
  both languages, every rule, the computer players), the room in
  `RoomBank.js` (the decks stay on the server), the board and its panels in
  `JS_Bank.html` (against the phone too), the room and the TV in
  `JS_RoomBank.html`, section 23 of `Style.html`, a drawn icon. Rules tests:
  every rule from the rent ladder to the last lap, and 12 whole games of
  computer players, 2 to 6, easy and hard. Found on the way: a percentage
  padding on the board's squares is measured against the whole board, not
  the square (*Traps*).
- **22 Sep 2026, بنك الحظ's first lap** - the owner asked for buying to start
  only after a player has been round the board once; asked as two questions
  (a switch or always; and trades), built as a lobby switch on by default,
  with no places in a trade before the first lap (*The owner's specs*). The
  same day the Start bar of every setup screen was made to sit flush at the
  foot (*Traps*), after the owner saw بنك الحظ's switches under it on a PC.
  Then high rents as a second switch, off, after the owner found the classic
  rents too small (*The owner's specs*); the classic numbers stay the
  default. And one die as a third, off, with a 6 standing for a double and
  the companies paying twice as much a pip.
- **22 Sep 2026, the audit** - a read-only audit of the whole app (the
  `read-only-audit` skill: Gemini through agy for the first pass, every
  finding checked against the code before it was reported), then every
  critical, moderate and minor finding fixed at the owner's word. The three
  critical ones: a room left idle with a phone connected woke its alarm in a
  loop (an alarm set in the past fires at once); قبل ولا بعد sent every phone
  its own cards' years (they sat in its secret slice beside the hidden copy);
  and الموقع السري on one phone always made the first players picked the
  spies. Among the rest: the replacements and the end of قبل ولا بعد; the
  first asker and the fake artist dealt at random; a Just One clue that is
  the word itself refused; a guess naming another card no longer right; the
  drawing telephone passing on the last step that has something in it; ربع
  قرد's عكس الحكم working after the game ends; an UNO call forgotten when the
  hand grows; بنك الحظ's debt to a player who leaves cancelled and the lobby
  clock kept; room screens that showed the last deal for a moment (`dealId` in
  their signatures); the chess clock charging exact milliseconds and pausing
  when left; the general timer surviving a reload; a daily from the archive
  never replacing today's, and the archive quiz streak ending after its ten;
  a Sudoku undo bringing back the notes it cleared; fixing an old round in the
  card scorers replaying the rounds after it (باصرة's carried 30, كونكان's
  totals); confetti and the QR pinned with SRI and loaded `async` behind a
  stub, the fonts no longer blocking the first paint, the offline page shown
  after 3 seconds of a weak connection; `check:live` failing when the rooms
  server is older than a rules change; a per-address limit on opening rooms;
  four Codenames words that were a second spelling of another. Rules tests
  and robot tests grew with each (see *Traps* for what was learnt).
- **22 Sep 2026, later: five design items and the leak check** - the owner
  asked for the audit's design suggestions and its test idea. Wordle on a
  phone on its side: Arabic keys 23px → 28.6px (English 28 → 35), the grid
  sized by its own box so a long word no longer spills into the keyboard
  (it did, by about 100px, for eight letters), and on a laptop the grid now
  fills its column (350px → 470px). Keys that stand off the page. The unused
  `.btn-red` removed (3.67:1 in dark mode). Named layers for everything that
  sits on the page (*The design system*), every value unchanged and checked
  in the page. The install sheet waits until the phone has played something.
  The leak check (`test/leaks.mjs`, *Testing*): all 33 room games played
  through, every phone checked after every move, nothing found; the view
  function moved to `src/view.js` so the check uses the server's own. The
  owner then asked that speed and offline be checked: eight clean loads each
  against the build before the day's work (DOMContentLoaded 121 → 117ms, the
  first game card 152 → 135ms), and offline with the server off, which found
  that the morning's "keep only good answers" had stopped keeping the fonts'
  stylesheet (*Traps*; live for a few hours) - fixed, and the outside files
  are now kept after a first visit too, which they never were.
- **22 Sep 2026, إكس أو with 3 marks only** - the owner's rule, asked first
  (*The owner's specs*): a setup switch, off by default; on your turn your
  oldest mark is faded and goes when you place a fourth; no draws.
- **22 Sep 2026, خمّن مين and المشنقة** - the owner asked for both; every
  rule was put to them one question at a time and each look picked from a
  design sheet of three (خمّن مين ب "ألبوم", المشنقة ج "نضيف"). خمّن مين is
  the duels' winner-stays-on with a secret face on each seated phone: the
  faces and questions in `GuessWho.js` (shared), the room in
  `RoomGuessWho.js`, the phones and the TV in `JS_GuessWho.html`, section 24
  of `Style.html`, computer players easy and hard. المشنقة is two on one
  phone and rooms (one writes, or a race): `Hangman.js` (shared, the race
  dealing from the Chameleon boards), `RoomHangman.js`, `JS_Hangman.html`,
  section 25. Both have drawn icons. Rules tests: faces the list can always
  tell apart, a computer player that always narrows a board to one face,
  every rule of both rooms. The leak check plays both (a secret face, the
  written word, each board's letters). Robot tests: 1477. Found on the way
  (*Traps*): an iPhone gives a password field only its English keyboard,
  and two preview tabs share one saved room session.
- **23 Sep 2026, المشنقة: names and films** - the owner's word on what is
  guessed: a word or a famous name or a film of up to three words, never a
  sentence, shown as typed with a box a letter and a gap between words; the
  fold both ways; the race dealing names (Chameleon) and films (the emoji
  riddles) too, about 1,200 in each language. `shared.shape` (each word's
  length) draws the blanks. Found on the way: a flex item's box took its
  letter's width, not its flex-basis, once the tiles were grouped by word -
  a tile needs a `width` (*Traps*). Also: the robot test's four-player
  domino rounds now wait for a pass as well as a blocked table.
- **23 Sep 2026, المشنقة: an optional hint** - the owner asked; a second
  field under the word, `shared.cat` in a room (the race's category uses the
  same field), `appState.hangman.hint` on one phone, refused when it spells
  the word out (`hmHintProblem`). Found on the way: the Write tool had
  turned `hmClean`'s `\u064B-\u065F` escapes into the marks themselves,
  which also swallowed the Arabic digits; the class is now built from char
  codes (`HM_MARKS`), which no editor can decode.
- **23 Sep 2026, خمّن مين with the other player answering** - the owner
  played it and found the app answering list questions "like playing vs the
  computer": the other player answers every question now (a wrong tap to a
  list question refused on the phone and the server), faces go down by hand
  by default, typed questions, the answer bubble and the guess's drum roll
  (*The owner's specs*, *خمّن مين*). The same day the owner asked for
  المشنقة's keyboard to follow the word's alphabet: it already did
  (`shared.alpha`, `hmAlphaOf`), checked in a room and on one phone - an
  older copy of the app cached on the phone is the likely cause. Found on
  the way (*Traps*): a keyframe that doesn't name a property animates it
  back to the element's own value.
- **23 Sep 2026, كدّاب and الشايب** - two room card games from Plato's
  list, every rule asked one at a time, look ب "بلوكات" for both (the
  family of أونو and سكرو): `PlayingCards.js` (shared), `RoomDoubt.js`,
  `RoomOldMaid.js`, `JS_Cards.html` (the card, the back, الشايب, a hand,
  the flights), `JS_RoomDoubt.html`, `JS_RoomOldMaid.html`, section 26 of
  `Style.html`, drawn icons. Decided while building:
  - **A screen that fell behind catches up** (`dbCatchUp`): a call's reveal
    takes a few seconds, and computer players don't wait for it, so a phone
    or the TV that has several moves to show plays the last call and what
    came after it, and otherwise only the last three moves. A place a card
    flies to (the pile) is hidden only once the card is on its way, so a
    pile is never left blank while an earlier move plays.
  - **No suit symbols in running text**: ♥ and ♦ are emoji on an iPhone and
    "7♥ و7♦" jumbles in a right-to-left line, so the rules and the lobby
    say it in words (7 كبة مع 7 ديناري; the 7 of hearts with the 7 of
    diamonds). The Egyptian suit names are كبة, ديناري, بستوني, سباتي.
  - **A rank in a claim is plural** (`PC_RANK_PLURAL`: آسات … عشرات، ولاد،
    بنات، شياب; Aces … Kings); the King is شايب at an Egyptian table, which
    only appears in كدّاب's claims - الشايب's own card is the drawn old man,
    never a K.
  Rules tests: 73 new (30 whole bot games of كدّاب, 40 of الشايب, every
  card counted after every move); the leak check plays both.
- **23 Sep 2026, حرب السفن** - Battleship to the owner's rules, asked one at a
  time: the classic 10×10 and five ships that may not touch, a hit fires
  again, a sunk ship shown whole with its water marked; against the phone at
  three levels and in rooms (the duels' winner stays on, no computer
  players), a turn clock off by default. In real 3D with three.js (the
  owner's bar: "like the bowling and golf") with a flat board where WebGL
  can't draw. `Battleship.js` (shared), `RoomBattleship.js`,
  `JS_Battleship.html`, section 27 of `Style.html`. Rules tests: 44 new
  (fleets, touching at a corner, shots, sinking and its water, the admiral
  always legal and finishing, hard ahead of medium ahead of easy and hard
  beating easy head to head, and every room rule: placing, ready and back,
  turns, a double tap, winner stays on, the clocks, "play for", a forfeit).
  The leak check plays three games (one on the clock) with four probes (a
  fleet on its own phone only; no fleet or reveal on the table while it is
  played; a sunk ship public only where it really is; a square shows a ship
  only once hit); proved by putting a fleet into `shared` in a scratch build.
  Robot tests: 1553, a battleship round among them (placing, a refused
  fleet, turns, a hit, a sinking, a miss, a game to the end, winner stays on,
  the host's "play for").
- **23 Sep 2026, بولينج** - the owner's rules asked one at a time, the look
  from the approved 3D prototype; real 3D with three.js: `Bowling.js`
  (improved: belly circles, lying pins spinning, the hook rolling out, the
  ball never stalling, faster settling), `RoomBowling.js`, `JS_Bowling.html`,
  section 28. Rules tests: the sheet (300, 150s, open frames, marks), the
  shot clamping, 120 shots replayed across two copies of the rules to the
  same pins, a stepped replay equal to the server's throw, the pocket strike
  rate, settling, and the room (turns, stale taps, the clock's and the host's
  gentle ball, leaving, the end, play again). The leak check plays it; a
  robot round in `play-all.mjs`.
- **23 Sep 2026, the five built together** - the owner asked for كدّاب,
  الشايب, بولينج and ميني جولف (Plato's games) and then حرب السفن; every
  rule asked first, the looks picked (بلوكات for the cards, صالة and
  نجيلة for the sports after a playable 3D preview - the owner found the
  flat drawings of the design sheet "like a pixeled game from the 80s").
  Each game was built by its own agent in a git worktree in parallel, then
  merged here: the conflicts were every game adding its line to the same
  lists, resolved by re-applying each branch's changes onto master.
  three.js r158 (UMD) is loaded on demand by `JS_Three.html`. Robot tests
  after merging بولينج, كدّاب, الشايب and حرب السفن: 1829; ميني جولف was
  merged last (below).
- **23 Sep 2026, ميني جولف** - the owner's rules asked one at a time (*The
  owner's specs*) and the lead's 3D preview (look أ «نجيلة») turned into the
  game: nine holes in `MiniGolf.js` (deterministic physics, shared with the
  rooms server), the room in `RoomMiniGolf.js`, the 3D course, solo, the room's
  phones and the TV in `JS_MiniGolf.html`, section 29 of `Style.html`. Rules
  tests: a search gets into every hole within par + 1 and finds no ball
  resting where the cup can't be reached; 300 putts give the same result
  twice; water, sand, the humps, the windmill, the gate and the waterwheel;
  the pick-up at 6 → 7; both room modes, the t0 tolerance, stale taps, the
  clock's gentle putt, leaving, the podium. The leak check plays both modes
  (nothing is hidden: the generic rules). Robot tests: 1527 (a mini golf round
  in each mode on a live server). A deploy is needed for the rooms server.
- **23 Sep 2026, بولينج's second pass** - the owner played it and asked for a
  truer throw and truer pins, and reported the aim guide moving during the
  swing (*The owner's specs*, *بولينج*). The line is now the backswing's and
  holds still; the pins' physics are named constants tuned against the USBC
  pin-carry study's shape (they had struck from almost anywhere - a third of
  head-on hits and half of the crossovers); a full hook reaches 5-6 degrees.
  Found on the way (*Traps*): the old test of "a pocket hit strikes" sent a
  right-hooking ball into the right-hand pocket and passed only because the
  old physics struck anywhere, and a glancing hit's spin was worked out from
  absolute directions, so a mirrored throw didn't fall mirrored.
- **23 Sep 2026, ميني جولف: eighteen holes** - the owner's next round of
  rules, asked one at a time (*The owner's specs*): par + 3 strokes at most;
  balls that knock each other in the room's "in turns"; Plato's water rule
  (back where it lay, the tee if that spot is taken, no stroke for a ball
  someone else knocked in); eight new pieces - ice, mud, speed pads,
  conveyors, portals, bumpers, ramps and one-way gates; nine new holes and
  games of 18. Then the owner's word that every hole be unique: each new hole
  its own Egyptian place with only the pieces that fit it, the first nine
  reshaped and dressed (rounded ends, fountains, flowerbeds, camels, minarets),
  the eighteen ordered by difficulty. Physics: `golfStart` takes the other
  balls, `golfMove` is one ball's step (the old step, bit for bit - 3,000
  putts on the first nine were compared with the build before), `golfBallsMeet`
  the knocks, and `golfPutt` returns the balls moved. The field learnt gates
  and conveyors (a way only their own way), bumpers and ramps (not a place to
  lie), and what a moving piece never leaves; the gentle putt learnt the
  ground's drag (`golfSpeedFor`) and to keep off the water's edge - found on
  the way: it had been stuck for ever on the old gate hole (straight into the
  sliding door) and the oasis (grazing the pond's corner into the water).
  Rules tests: 76 golf checks (each piece, the knocks, the water spots, the
  most strokes, 300 multi-ball putts twice, a phone's stepped roll equal to
  the server's, every hole within par + 1 and holed by the gentle putt, 18
  holes in a room); the leak check plays nine holes in turns; robot tests:
  1846, with a knock on a live server and nine holes in turns. A deploy is
  needed for the rooms server.
- **23 Sep 2026, ميني جولف: sixty holes, a difficulty, «المطلوب»** - the
  owner's third round, every point asked first (*The owner's specs*): the word
  بار replaced by المطلوب everywhere; 42 new holes and the eighteen sorted into
  twenty easy, twenty medium and twenty hard; a difficulty choice (mixed by
  default, easiest first) with the holes drawn at random through the page's
  and the server's memory of recent deals (`shared.holes`); bests per length
  and kind. Every hole was checked the way the tests check it (the search gets
  in within what it asks for + 1, nowhere to rest that the cup can't be reached
  from, the gentle putt holes out) and played by a simulated player of
  middling skill to sort the kinds; each new hole was screenshot at 375×812
  and reviewed, a sample at 667×375, 1280×720 and the TV at 1920×1080, Arabic
  and English, light and dark, a room of two phones and a TV playing a mixed
  game, reloads mid-hole on one phone and in a room, and Help - no console
  errors. Rules tests: the golf block is 88 checks (sixty holes; the kinds
  and what each asks for; the draw from a kind, no hole twice, mixed rising;
  a room's holes on the server, the same on every phone; two games of one
  kind in a room not sharing a hole; each hole's own most strokes); robot
  tests 2022 (a mixed game and nine hard holes in turns on a live server).
  The built page grew 93 KB (5,637,521 → 5,730,957 bytes, 1.7%). A deploy is
  needed for the rooms server.
- **23 Sep 2026, one sets, everyone solves** - the owner's decisions asked
  one by one (*The owner's specs*): المشنقة's room way as an engine
  (`RoomSolve.js`, the four games' rules in `SolveGames.js`), and خمن الكلمة,
  خمّن الرقم and خمّن الدولة in rooms, and فوازير إيموجي written by a player
  (with the same race, beside its quiz). The Wordle lists and the countries
  moved into files of their own (`WordleWords.js`, `Countries.js`), since the
  rooms server deals and answers from them now. One renderer for the four
  (`JS_RoomSolve.html`, section 32 of `Style.html`). Rules tests: 57 new
  (the colours with repeated letters, the written word, the ranges and
  higher / lower, the distances and hints, the emoji clue and the judging,
  and the engine: the order, the points, a tie on tries, the race, the skip,
  leaving, the clock, play again, the quiz way untouched). The leak check
  plays all four both ways, with three probes (the secret on the setter's
  phone only until the round is scored; a board on its own phone only; the
  table sees tries and colours, never a guess), proved by putting the secret
  into `shared`, another board into a slice and a guess into the progress in
  a scratch build: each failed it. Robot tests: a round of each on a live
  server, both ways. Found on the way (*Traps*): the quiz's clock branch
  catches every `QUIZ_GAMES` room, the engine's emoji rooms included.

- **23 Sep 2026, شطرنج** - chess to the owner's rules, asked one at a time,
  then the rated computer and the coach the same day (*The owner's specs*,
  *شطرنج*): every rule once in `Chess.js` (perft on six standard positions),
  the computer from 400 to 2000, the coach's analysis and the review there
  too; the room in `RoomChess.js` with the board functions a tournament
  bracket needs; the 3D board, one phone and the live coach in
  `JS_Chess.html`, the kept games and the review in `JS_ChessReview.html`, the
  room and the TV in `JS_RoomChess.html`, section 30 of `Style.html`, a drawn
  icon (a knight on a corner of the board). Rules tests: 100 new (perft, every
  castling condition, en passant into a pin, promotion, mate, stalemate,
  threefold, fifty, material, SAN, the clock and the flag, Armageddon and the
  match, every rating's move legal, 1800 beats 600 and 1400 beats 400, the
  verdicts, a blunder and a mate allowed named, the hint's mate in one, ~100%
  for the engine's own game, a review the same twice, the room: turns, stale
  taps, mate, winner stays on, a draw offered, refused, declined by a move and
  accepted, resigning, the clock and a flag that is a draw, a forfeit). The
  leak check plays two games and one on the clock; a robot round in
  `play-all.mjs`. Checked in headless Chrome at 375x812, 667x375, 1280x720 and
  a TV at 1920x1080, Arabic and English, light and dark: against the computer
  by taps and a drag, the hint, the coach's word, a promotion on the flat
  board, a game to mate and its review, a reload mid-game and mid-review, and
  a room with two phones, a watcher and the TV to mate, the review from the
  room, the next game and a reload. A deploy is needed for the rooms server.

- **23 Sep 2026, the duels' tournament and إكس أو in rooms** - the owner's
  decisions asked one by one (*The owner's specs*): a knockout for four or
  more beside winner stays, in every room duel - كونكت ٤, نقط ومربعات, خمّن
  مين, حرب السفن and إكس أو, which came into rooms for it. Built once
  (`RoomTournament.js`, `JS_RoomTournament.html`, section 30): each match a
  small room running its game's own rules, with its own secrets; the bracket,
  live matches to watch, the TV's bracket and live boards, a podium of four;
  the draw and every winner flying into the bracket. `TicTacToe.js` is X-O's
  rules once; `JS_RoomXO.html` its room. The adapter is documented for chess,
  built beside it. Rules tests: X-O's room and 3 marks only; brackets of 4 to
  12 in three games (the byes, everyone playing until out, one champion, the
  points, simultaneous matches, trimmed boards), a draw replayed the other way
  round, stale taps, every way of leaving, guess who's secrets per match, a
  battleship tournament on the clock, a new tournament and back to winner
  stays. The leak check plays three tournaments (guess who, battleship,
  connect 4) with every match held to its game's own probes, and was proved by
  handing one seat's secret to the other in a scratch build. Robot tests: X-O
  winner stays, and a tournament of five of each game to its champion (a
  latecomer, a leave, a new tournament, back to winner stays).
  Found on the way (*Traps*): the duels' `shared.board` is the scoreboard, and
  كونكت ٤'s lobby choice is already called `mode`.
- **23 Sep 2026, شطرنج in the tournament** - chess plugged into the duels'
  tournament to the owner's decisions of the day: everything the other duels
  have, a drawn game replayed once with the colours swapped and then an
  Armageddon game where a draw is Black's (`chessMatchNext` through the
  adapter's `deal` and `drawRule`), the clock per match, draw offers and
  resigning per match, the review for every tournament game, and the TV's
  live cards as small flat boards with ticking clocks (the big match on the
  3D board). Decided here: the host's "play for" is the computer's ordinary
  move at 800 (in winner stays too). Also: the TV's host buttons in a
  tournament act on the match the TV shows big (`tourFocusState` asks
  `tourTvFocusId` on a screen - before, a TV's "play for" in خمّن مين or حرب
  السفن named no match and was refused), and chess's flag deadline is 1 ms
  past the grace. Rules tests: 22 (fewer than four refused, five with byes to
  a champion, a draw replayed with the colours swapped, a second draw to
  Armageddon and Black through on a draw there, a flag ending one match only,
  offers, resigning and "play for" per match, stale taps, a forfeit on
  leaving, "play for" in winner stays). The leak check plays a chess
  tournament (`tour:chess`); the robots play one of five to a champion, the
  first-round match drawn twice by agreement into Armageddon. Looked at in
  headless Chrome: four phones at 375×812 (and one sideways) and the TV at
  1920×1080 and 1280×720, Arabic and English, a reload mid-match, Help, the
  review of a tournament game, no console errors.
- **23 Sep 2026, the audit of the day's games and every finding fixed** - a
  read-only audit of everything written on 22-23 Sep (agy's Gemini read seven
  modules, Claude reviewers the rest when agy's quota ran out; every moderate
  finding checked against the code), then the owner asked for every moderate
  and minor finding to be fixed. Fixed: المشنقة's whole-word box wiped by
  others' guesses; خمّن مين's bubble and drum roll silent after the eighth
  entry, no clock while picking a face, the wrong name on a skipped answer;
  the tournament's TV bracket button, its game numbers, a double tap's error,
  hidden state kept after a match; the duels' motion silent in a second game
  from the hub; حرب السفن telling a sinking (ships afloat, the fleet list, the
  win) before the shell landed; a called play in كدّاب / الشايب stuck over
  every screen; الشايب's draw from a hand that just left; the setter order
  in المشنقة and the solve engine; one letter in the whole-word box, and a
  guess's length; شطرنج's room games kept under one key, the room clock after
  a reload (the server's time, above), the computer's clock during the blunder
  warning, the take back's clock, the clock of a locked phone, "try the
  better move" replacing a game without asking, a refused early move, the
  review stepping back, timers after the board was disposed; ميني جولف
  drawing in the background after leaving mid-load, a pull on a ball under
  water, old saves on the old holes, a ball in the air at the time limit;
  بولينج's lane built after leaving; a three.js load that could never be
  retried. Rules tests: 24 new ("audit/…"); run on the old code, they fail at
  once (the tournament's double tap throws, the Hangman order picks the wrong
  writer).
  The slow opening the owner saw the same day was GitHub Pages sending at
  20-50 KB/s (the page is 1.6 MB); left for now at the owner's word.
- **23 Sep 2026, later: the app opens from the copy on the phone** - the owner
  asked why the app had gone from instant to a minute on its logo. GitHub Pages
  was sending the page at 20-80 KB/s (the same file from the rooms server's copy
  took 1.4 s), and the worker waited for the network on every open. Now every
  open is the saved copy (0 bytes, 73 ms), a new build installs in the
  background (the page downloaded once, not twice) and the page switches to it
  by itself where nothing is lost (*The static site*). The owner was told the
  one trade-off first: an update can reach a phone one open later. Then the
  logo first in the page (*Traps*): after 14 KB instead of 400 KB, checked on
  a throttled connection (the logo at 1.5 s where the old page was still
  blank), the layout sweep unchanged and a room link still filling its code.
  The two old questions (سكرو's 66 cards, two طرنيب ٤١ rules) were closed by
  the owner as built.
  Then Settings → الإصدار (the owner's ask): when this copy was published, as
  a date and time (never a number), and whether it is the latest - the page
  asks for `sw.js` (2 KB) and compares its stamp with `BUILD_ID`: «✅ أحدث
  نسخة», «⬇️ … بتتنزّل» (a tap opens it when it arrives), «✨ … اضغط للتحديث»
  (already on the phone) or «📴 مش متصل» (`paintAppVersion`, `appVersionTap`).
  The time is the build's, in the phone's own time zone.
  Then the second address on Cloudflare, https://play.3ashry.workers.dev
  (*The static site*): the same build, 1.3 s for the page where GitHub took
  24-84 s that day; every release publishes both.
- **24 Sep 2026, the addresses renamed** - the owner chose the Cloudflare
  account name **3ashry** («عشري» typed the Egyptian way; "ashry" was taken):
  the app's second address is now https://play.3ashry.workers.dev (the
  `site-worker/` Worker renamed `play`) and the rooms server
  https://ashry-rooms.3ashry.workers.dev (its Worker's own name kept, so its
  Durable Objects and the prompt memory stay). A Worker moves with the account
  name by itself; the old `*.rooms-worker.workers.dev` addresses stopped at once,
  so the page was released to both hosts straight after the rename.
  The owner then made Cloudflare **the main address**: every link the app
  shares (Settings → شارك التطبيق, a room's link and its QR) points to
  https://play.3ashry.workers.dev from either copy (`appUrl` in
  `tools/site.config.json`, written into the page as `SERVER_DATA.webAppUrl`),
  so whoever it reaches lands on the fast one; `check:live` checks both, the
  main address named as such. The preview keeps its own address for its links.
- **24 Sep 2026, the audit's second pass** - every module of the 23 Sep audit
  read again by a different AI from the one that read it first (Gemini for the
  modules Claude reviewers had read; Gemini Pro, then Claude reviewers when
  agy's quota ran out, for the modules Gemini Flash had read), told to break the
  first reader's "clean" claims. 20 new findings, each checked against the code:
  17 fixed, 3 dropped (a "leak" the forced context loss already frees, a paused
  loop that costs nothing in a hidden tab, the golf water timer already
  guarded). Fixed: the tournament's TV bracket button when one match is live
  (`featured: 'bracket'` kept as such); the TV's chess mini-clocks by the
  server's time; chess - the coach's judge after leaving, the promotion picker
  left open when the move can no longer be made, "try the better move" games
  counting in the tally and taking a kept game's place, their pieces already
  taken, the mode a practice game borrowed; حرب السفن's small map waiting for
  the shell; الشايب's quick double tap drawing the lifted card; بولينج - a lost
  GPU context mid-throw leaving the lane stuck, the solo best kept with the last
  ball, the other screens after the player up leaves, a long slow swing losing
  its backswing; ميني جولف - a leaver's knocked balls stuck "rolling", your own
  putt rolled twice when the answer came after it stopped, its banner reading
  the shot before, the solo clock stopping after an hour, the solo best kept
  with the last putt, a pull back to the room screen, the putt clock frozen
  after leaving and coming back, instanced meshes freed with their hole.
- **24 Sep 2026, batch 1 of the owner's list** - the owner approved a list of
  24 additions (the chess ones, chess for four, vote chess, Hand and Brain,
  bughouse, puzzles; answers in `notes/` and *The owner's specs* as each ships)
  and asked for them to be built by agy with Claude planning and reviewing.
  Batch 1: أتوبيس كومبليت's «متسامح» switch (host, off by default: a word the
  dictionary doesn't know keeps its 10); every word a host taps up from 0 is
  logged on the rooms server (*The Stop word log*); the first-play card on
  every setup screen and in a room lobby (*The first-play card*); and ميني
  جولف's daily hole in تحدي اليوم. Found in review: two spacing tokens that
  don't exist (`--sp-3-5`, `--sp-2-5`) left the card with no padding (*Traps*),
  a normal golf game's target read from its first hole only, and «زي المطلوب
  عن المطلوب» on every golf result that finished on target.

- **24 Sep 2026, chess in 2D and a finer 3D** (batch 2, phase D) - the owner's
  words: "improve the 3d look and animations ... and also add the option to
  play it normal, same look as in chess.com". A 2D board with our own drawn
  piece set, 2D by default on a phone with a switch to 3D on every board, the
  TV in 3D, four board styles for both, and the 3D board's animations, look
  and camera (*The owner's specs*, *شطرنج*). Found on the way (*Traps*): a
  headless Chrome reports reduced motion, so a check of an animation there sees
  none unless `prefers-reduced-motion` is emulated as `no-preference`.
- **24 Sep 2026, chess batch 2** - the owner's list, approved as a whole
  (*The owner's specs*, شطرنج, *Batch 2*): Chess960, several lines and a
  style for the engine, the new clocks and the handicap in `Chess.js`; 960
  and the handicap in rooms and the tournament; on one phone the opening
  names, undo and hint limits, your rating, six characters with drawn faces,
  a position editor with eight endgames, 960 / handicap / clocks, premoves
  (also on your own phone in a room), arrows and marks by hand, sharing a
  game (a picture, PGN, a video) and the best-move arrows; the 2D board and
  the polished 3D (the entry above). Found on the way: a room's review
  opened from the result card stored the game with no start FEN, so a 960
  room game reviewed from the standard start; and in 960 a king step and
  castling can share a square, which the tap took for a promotion.
- **24 Sep 2026, chess for teams: شطرنج بالتصويت and المخ والإيد** - the
  owner's decisions of the day (*The owner's specs*), batch 4's T4.2 and T4.3
  (`notes/archive/plans/phase-reports/batch4-a.md`): `RoomVoteChess.js` and
  `RoomHandBrain.js` (bundled after `RoomChess.js`, playing on its board
  functions), `JS_RoomVoteChess.html` and `JS_RoomHandBrain.html` (the chess
  board of `JS_Chess.html`: 2D on a phone, 3D on the TV), section 34 of
  `Style.html`, two drawn icons, the team channel of the chat opened to vote
  chess (`roomChatTeam`). Rules tests: 28 for vote chess (the split, the
  secret, the tally, a tie drawn both ways, the clock with and without votes,
  the host's close, resigning by vote, play again, leaving, the team chat) and
  24 for Hand and Brain (seats and computer players, naming and moving, the
  flag, the forced name, the host's "play for", a hard Hand finding a mate,
  three whole games of computer players, a leaver's seat). The leak check
  plays both, with a probe that no vote reaches another phone before its move
  (proved on a scratch build). Robots: 68 new checks (`--only=teamchess`),
  2232 in all. Looked at in headless Chrome: three phones and a TV playing
  vote chess through a tie, a timeout, a reload mid-vote and a resignation by
  vote; two people and two computer players playing Hand and Brain to mate
  and again with the roles swapped. Found on the way (*Traps*): a vote drop
  must hand the piece back (`onDrop` returning `'pre'`), and a background
  tab's pill scores stay at 0 until it draws.

- **24 Sep 2026, chess puzzles** (batch 3) - the owner's plan (*The owner's
  specs*, *ألغاز شطرنج*): the generator and the bank of 1,505 engine-made
  puzzles (T3.1), the puzzle screen on the chess board with the three ways
  in and a free puzzle by level (T3.2), the puzzle of the day in تحدي اليوم
  (T3.3), «سلسلة الألغاز» (T3.4) and puzzles from your own mistakes with
  «جرّبها كلغز» in the review (T3.5). Checked in headless Chrome at 375x812
  Arabic light, 667x375 and 1280x720 English dark: puzzles of each level solved
  by taps and by drags (a promotion through the picker), the reply by itself,
  a wrong move and a wrong drop counted once, the hint, the solution shown, a
  reload mid-puzzle, the switch to 3D, the daily from the hub to its line and
  sheet (set aside and resumed, not dealt twice, the archive), a streak to its
  end, and a game against the computer blundered, reviewed and tried as a
  puzzle. Found on the way: the hub printed a drawn icon's name
  ("art:chesspuzzle") - it wrote `cat.icon` straight into the markup.

- **24 Sep 2026, باغ هاوس** - batch 4's bughouse (Decision 3, T4.1 and
  T4.4): the rules as `chessBug*` at the end of `Chess.js` (standard chess
  and perft untouched), the room in `RoomBughouse.js` (two boards, two
  always-running clocks each, a mate or a flag deciding it, computer
  players filling seats and taking over a leaver's board, play again
  turning the partners), the phones and the TV in `JS_RoomBughouse.html`
  and section 35 of `Style.html`, a drawn icon. Rules tests, a leak-check
  driver and a robot round. Checked in headless Chrome: two people, two
  computer players and a TV, whole games to a mate and to a flag, board
  moves and drops by tap and by drag, a reload mid-game, Help, 375x812
  Arabic, 667x375, 1280x720 English dark and the TV at 1280x720, no console
  errors. A deploy is needed for the rooms server.

- **24 Sep 2026, شطرنج الأربعة** (batch 5) - four-player chess to the owner's
  rules asked first (*The owner's specs*, *شطرنج الأربعة*): teams or everyone
  for themselves on chess.com's points, grey walls, computer players easy and
  hard, the look أ «بطولة» with the app's own pieces in four colours, turned so
  your colour is at the bottom, the TV's big 2D board. `Chess4.js`,
  `RoomChess4.js`, `JS_RoomChess4.html`, section 36 of `Style.html`, a drawn
  icon (the cross-shaped board with a pawn of each colour). Rules tests: 62
  new, among them 80 whole games of bots and six through the room's door;
  the leak check and a play-all round each way. Found on the way (*Traps*): a
  size container as a grid item gives its `auto` column no width, and one
  class name used for two things (the log's colour dot and the legal-move
  dot) put a legal-move dot over every move in the log.
- **24 Sep 2026, the trivia banks checked question by question** - the owner
  found wrong answers, bad questions and answers inside questions, and Hollywood
  films in a game played in Arabic. Eight reviewers went through all 854 board
  items and the 1,156 four-choice questions (both languages) against written
  rules (a right, verified, single answer; not inside the question; facts that
  don't change; family and Egyptian; the level fits; ar and en the same); 409
  changes applied by exact match (216 fixed, 177 replaced, 16 moved to their
  level), the counts per level kept. The film category was 57 of 86 foreign
  questions and is Egyptian and Arab now; the Arabic four-choice list lost 22
  foreign-film questions the same way. The rules are in the banks' own header
  comments. Found on the way: two reviewers added the same octopus question to
  two categories - `npm run check` caught it.
- **24 Sep 2026, the full audit and all 60 fixes** - a read-only audit of the
  whole app after the five batches (18 modules: agy's Gemini for the first
  seven, Claude sub-agents for the rest when agy's quota ran out; a challenge
  pass to break each module's "clean" claims, a cross-check that tried to
  disprove every finding, the moderates read at the source). 65 findings, 60
  after duplicates, none critical, 8 moderate; the owner approved fixing all
  of them. The moderates: العقل's double tap played two cards; بنك الحظ's
  bankrupt button sat beside Pay with no check (now refused while selling
  and mortgaging could cover the debt, and shown only then); a room chess
  duel with 960 and a handicap played the standard start from game 2 (the
  handicap rule is `chessOddsFen` in `Chess.js` now, the page's `chOddsFen`
  a wrapper); closing the coach's blunder warning with back froze the game
  (`chCoachDismissed`); resuming the set-aside puzzle daily rolled back the
  streak and the solved mistakes; Help and the exit sheet counted as play in
  a solo board's time; a Draw & Guess viewer who missed a clear kept a wrong
  drawing (`paintStrokes` remembers its last stroke); and a Codenames pass
  double tap. Most of the 52 minor ones were one of two shapes: **a host or
  turn action sent with nothing the phone saw** (the five-seconds and
  timeline skips, ربع قرد's undo, ارسم واكتب's reveal, a late vote landing
  in the next round, a late trivia answer - all `staleTap` now, every field
  optional on the server), and **"play once" forgotten by a reload** (the
  duels, خمّن مين: `duelRoomFirstSight` marks what is already on the board as
  seen the first time a page sees a game). Also: the chameleon, spy and fake
  get the same card as everyone else at a glance; the Stop log counts a cell
  once and `WordLog` keeps a count instead of listing every word; the
  leak check's drivers press a game of rounds' "next round" (domino failed
  one run in thirty when a game needed a second round). Rules tests grew by
  the audit's checks (`audit/…`, `audit2/…`).
- **24 Sep 2026, الوزير المستخبي** - the hidden queen, a chess variant to the
  owner's decisions asked one by one (*The owner's specs*, شطرنج): a room
  duel (winner stays, never the tournament) and against the computer; each
  side picks a pawn that is secretly a queen, moves it like a pawn to keep it
  hidden or like a queen to reveal it; never rated, no handicap. The rules in
  `Chess.js` (`chessHq*`, standard chess, 960 and every perft untouched), the
  room in `RoomChess.js`, the pick, the crown, the moment and the end on the
  phones and the TV (`JS_Chess.html`, `JS_RoomChess.html`), the review of a
  revealing move. Rules tests: 52 new; the leak check plays two games with
  three probes; a play-all round with two phones and a TV. Also, the owner's
  word that every hint line be right and shown only when it applies: the
  one-phone handicap line hides with no handicap and says nothing about the
  rating two on one phone; the room lobby's clock line shows only with a
  clock, its handicap line only with a handicap (half the time with no clock
  warns, as on one phone), and its variant line explains only the choice made.
- **24 Sep 2026, دوري المعرفة's steal** - the owner's party rule (*Decided,
  and why*): a setup switch on by default; a miss or the clock sends the card,
  answer hidden, to the other team on half the time for the full points; ❌ or
  its clock shows the answer with nobody scoring. The board now keeps whose
  turn it is and the card says who is answering. Rules, the setup hint and the
  timer's hint updated in both languages; a reload mid-steal comes back in the
  steal with the time it had left.
- **24 Sep 2026, chess: the chess.com board, looking back, premoves as a
  switch** - the owner's four requests (*The owner's specs*, شطرنج): the 2D
  pieces redrawn to fill the square with bold outlines, Black's rim and a
  shadow, the coordinates, dots, rings and hover as on chess sites; «2D | 3D»
  as a segmented switch on the board and on the setup; ↶ only when the setup
  allows it (it already was); ⏮ ◀ ▶ ⏭, ← / → and a tap on a move to look
  back without touching the game, on one phone and on every phone in a room;
  «الحركات المسبقة» a remembered switch on the setup and in the ⚙. Checked in
  headless Chrome at 375x667, 667x375 and 1280x720, Arabic light and English
  dark, the four styles, White and Black at the bottom, 3D; the screen test
  (screens, rooms, fixes) and the rules tests pass. Nothing the rooms server
  runs changed.
- **25 Sep 2026, the improvement plan** - the owner asked for a rating (8/10)
  and then for a plan from what the big party apps do (Jackbox, Plato,
  Jawaker, Gartic Phone, Kahoot), and said "apply all" (`notes/archive/plans/IMPROVEMENT_PLAN.md`,
  with the owner's answers: speed and numbers first, rare games behind «كل
  الألعاب» rather than removed, إستميشن the first card game in rooms with every
  rule asked first, no seasonal packs for now). Shipped first: **the play
  counter** (*How often each game is played*), **the minified page with a size
  budget** (*The static site*: 6.97 MB → 4.6 MB, a first visit 1.83 → 1.35 MB
  gzipped) and **«الليلة دي؟» and «ابدأوا بدول»** on the home (*The catalog
  and the home screen*).
  Then **«في غلطة؟»** reports, **the night's share card**, **the audience**
  (cheers and "who'll win?" for whoever watches a room game) and
  **«ليالينا»** in أرقامي (*Multiplayer rooms*), and Settings → **رموز للألوان**
  (`toggleColorShapes` in `JS_Core.html`, off by default: `html.cb-shapes` puts
  ● ▲ ■ ◆ on أونو's red, yellow, green and blue cards and colour buttons, for
  colour-blind players, without changing the cards' look for anyone else). The room-wide "extra time"
  switch was left: every room clock is set in its own game (most are already
  the host's choice and off by default), so it is a change to twenty games one
  at a time. إستميشن in rooms, every rule asked first, is being built.

- **25 Sep 2026, إستميشن** - Estimation as a room game, to the owner's rules
  asked one by one (*The owner's specs*, *إستميشن*): `Estimation.js`
  (shared: the auction, the calls, a trick, the score keeper's arithmetic,
  the computer players), `RoomEstimation.js`, `JS_RoomEstimation.html`, section
  38 of `Style.html`, a drawn icon. Rules tests: 54 (the bid order and the
  minimum, the redeal, two dashes, the last call off 13, nobody over the
  caller, following suit, the trick's winner with and without trumps, the
  speed rounds, 4,000 random rounds scored exactly as the score keeper does,
  the clock, the host's "play for", a leaver's seat, a forced card, 24 whole
  games of one person and three computer players, a hard computer player
  making its call more often than an easy one). The leak check plays a game of
  13 rounds (proved by putting a hand into `shared` and another seat's hand
  into a slice); the robots play a round on a live server. Looked at in
  headless Chrome: one person, three computer players and a TV through a round
  and into the next at 375×812 Arabic light, 667×375 and 1280×720 English
  dark, the TV at 1920×1080, a reload mid-round, «آخر لمّة», Help; four people
  and a TV through a whole game of 13 rounds to the podium, a reload in round
  7; no console errors. Found on the way (*Traps*): a lost `}` and `/*` in
  section 34 of `Style.html` had put every rule after it (باغ هاوس, شطرنج
  الأربعة, the chess hub, the host's name menu) inside a
  `prefers-reduced-motion: reduce` block since 24 Sep 2026.
- **26 Sep 2026, simpler to start playing** - a read-only study counted every
  game's taps from opening the app (15 proposals), and the owner decided four
  of them and approved the rest in principle (*Decided, and why*). Built: the
  first visit's simple start and «كل الألعاب (N) ▾» (`renderHome`,
  `catalogQuickStart`, `toggleHomeAll`); «▶ العب تاني» on recent tiles; rooms
  that open and join under the saved name, «أنت: منى ✏️» on the join screen
  and in the lobby, and the room-level `rename` (lobby only); the lobby's
  Start always on screen, with "N more needed" under it, and the host's
  options folded with a line of what is chosen; «مين بيلعب؟» (`askPlayers`)
  for ten one-phone games and the card score keepers, one wording for "not
  enough players", «↕ رتّب» in the picker, الجاسوس without the order before
  every round, الدومينو's teams in its question; سكرو and الدومينو opening on
  the game in the app; the first-play card as one line; شطرنج's Start on the
  first screen and «خيارات أكتر ▾» on شطرنج and بنك الحظ; popups that close
  with motion (`modalExitGhost`), a blocked Start that scrolls to and shakes
  what is missing (`blockStartAt`), a new player's chip popping in. Taps from
  opening the app, a first visit: الجاسوس 6 + a 450px scroll + the order →
  2 (and the names typed); القنبلة and بدون كلام 2 → 1; a room 5 → 4 on a
  first visit (3 from «افتح غرفة» with a name saved, 2 from «▶ العب تاني» on a
  game left on "own phones"), and the lobby's Start never scrolled to; joining
  by a link with a name saved 1 + typing → 0. Tests: `npm run check`,
  `test:rules` (1,824 checks, the leak check clean), the robots 2,319 passed,
  `test:ui` screens and rooms 70 passed. Found on the way (*Traps*): a `<details>` drawn
  open fires its `toggle`.
- **26 Sep 2026, the owner's content decisions** (*Decided, and why*): the
  height and romance prompts, two films, three Chameleon boards' obscure
  words, half the Arabic foreign-film riddles, the bomb's property
  categories and Israel in ربع قرد replaced, every list its old size; three
  facts made exact and the golf hole renamed; and الجاسوس in English
  (`SPY_WORDS_EN`, 1,446 words in eleven categories, and `SPY_PAIRS_EN`, 74
  pairs), on one phone, in rooms and for كلمة واحدة's room words. Tests:
  `npm run check` (the English list and both pair lists checked now),
  `test:rules` 1,828 checks (English deals, the guess from six, English and
  Arabic pairs), the robots 2,340 passed, and the English game played in
  headless Chrome on one phone and in a room of four (14 checks).
- **26 Sep 2026, the owner's app decisions** (*Decided, and why*): «فرق قوة»,
  «المجموع» pinned in Stop's table, «ادخل غرفة», Philidor's third rank, a
  minimum of 1 for every room game computer players fill (and «لوحدي» finding
  them), من أنا؟'s category confirmed, ثلاث جولات back after a reload, the
  audience gone at the game's end (on the server too: `roomGameIsOver` refuses
  a late pick), trivia's «أسرع إجابة: … · في N أسئلة», the TV lobby from the
  top with the players as tiles, and every popup through the fading close.
  Tests: `npm run check`, `test:rules` (1,771 checks and the leak check clean;
  a new one: the guessing is closed at a game's result; the estimation bots'
  "hard calls more than easy" check is a coin toss and failed one run in three),
  the robots 2,340 passed, `test:ui` screens and rooms 70 passed. Looked at in
  headless Chrome at 375×812, 667×375, 1280×720 and the TV at 1920×1080 and
  1280×720, Arabic light and English dark; ثلاث جولات reloaded mid-turn, on a
  ready card and in round 2.
- **26 Sep 2026, the arcade look's follow-ups** - the owner approved five:
  no mode icons on the posters; the setup screens' options in the poster
  look (rows, a pill track, round steppers, the accent chevron); no blur on
  the posters' badges, and Baloo Bhaijaan 2 loaded only by the card games;
  sections as shelves on a laptop with «الكل ›»; a poster that lifts under a
  mouse, the featured poster fading in when its game changes, tool rows as
  one line with a poster thumb (*The design system*, "The arcade look").
  Found on the way: every poster was near-black in dark mode (a heavier
  `body.dark .gcard` from section 17). Looked at in headless Chrome at
  375×812, 667×375 and 1280×720, Arabic light and English dark: the home, a
  search and an opened shelf on a laptop, مع بعض, الأدوات, and the setups of
  الجاسوس, القنبلة, سودوكو, شطرنج (with «خيارات أكتر»), بنك الحظ, بدون كلام
  and الدومينو (both sides).
- **26 Sep 2026, the arcade look** - the owner asked for the whole UI style
  rebuilt ("more premium, easy to use"). A first design sheet (three
  re-skins of the same layout) was sent back: "the same design, just
  different colours". The second sheet had four styles with their own
  structure, each in three colours (a design canvas artifact, 24 boards);
  the owner picked «د · أركيد». Built as section 39 of `Style.html` and the
  markup of the card, the featured poster, the setup hero and the bar's
  centre button (*The design system*, "The arcade look"; *Decided, and
  why*). Nothing the rooms server runs changed. Looked at in headless
  Chrome at 375×812, 667×375, 1280×720 and 1920×1080, Arabic and English,
  light and dark: the home (first visit and returning), the setups of
  الجاسوس, سودوكو, أونو, شطرنج and بنك الحظ, a game in play, the help sheet,
  the settings, a room lobby with a game chosen, مع بعض and الأدوات.
- **26 Sep 2026, motion everywhere** - the owner's "smooth, nice motion
  everywhere, on every screen": the plain screens' system (*The design
  system*, "Motion everywhere"; `JS_Motion.html` section 13, `Style.html`
  section 41): setup screens, the score keepers, the daily hub, the timers,
  the counter and the room lobby rise in; popups spring open with their rows
  rising; chips, steppers and selects answer; the lobby's rows slide and fade;
  the header's title and back chevron move. Checked in headless Chrome at
  375×812 Arabic light and 1280×720 English dark with motion on, and with
  Settings → الحركة → مقفولة: every screen and sheet visited ends with no
  running animation, no `translate` left and full opacity; with motion off
  nothing animates at all. No console errors.
- **26 Sep 2026, the second wave of the arcade look** - the owner asked for
  all seven follow-ups at once ("run sub agents to finish the work fast and
  review their work") and added two standing rules (*Decided, and why*:
  everything built stays, motion everywhere). Six agents in parallel: the
  posters, setup controls, shelves and polish (one worktree), the room lobby
  and hub (one), the motion pass (one), and three drawing icons into scratch
  files - 68 drawn icons, integrated by a script (`ICON_ART` in JS_Core.html,
  `icon: 'art:<id>'` in `GAME_CATALOG` and `ROOM_HUB_GAMES`; the chess clock
  tool's is `art:chessclock`, screw-calc reuses `art:screw`), reviewed on
  their preview sheets (two redrawn: سكرو's cards bigger, على راسك's phone as
  the subject). Merged in three merges; one conflict (the tool icon rule in
  section 39), resolved by hand. Tests on the merged master: `npm run check`,
  the screen test twice (after the first merge and after the motion pass, 20
  passed each), the rooms and fixes test after the lobby merge. The C: drive
  filled to 0 bytes mid-wave (the owner's own videos and downloads hold most
  of it; my Chrome profiles and stale scratch folders were what could go):
  the owner then freed space on C: and the tests run there as before.
- **26 Sep 2026, the arcade look's design review: the shell, solo boards and
  tools** (the one-phone party games and the room games in parallel
  branches). The home's chips two rows at most on a phone (smaller, the ways
  and «مين وكام؟» one wrapped flow, no emoji on a phone); Help's first card
  no longer promises mode icons on the posters; Settings 30rem wide with each
  value a pill and a chevron; «الليلة دي؟»'s chips at the tap floor; 2048's
  empty card hidden; the solo tool rows one line each; Minesweeper's closed
  cells on the violet neutrals; the nonogram's clues 12px at least; Word
  Wheel's levels two-line segments (`wheel_lvl_*_n`) and its board sized from
  the height on a laptop; pinpoint's choices two by two on a phone's side;
  the streak's hearts wrap; the chess puzzles' «العب» a chevron, not a pill;
  every Start bar a solid ground; a phone upright keeps 1.75rem clear under
  the raised «افتح غرفة» (`--main-pb`, and a stuck Start bar's padding);
  count rows in a `.grid-2` stack full width; the score keepers' steppers the
  setup's (placeholder 0, `csStep` counts on from the lowest); the team
  generator's two ways and Wordle's four lengths are the amber Start bar
  (`.view-actions--row`); the spin wheel's names 14px at least, cut to their
  slice; the random picker, teams, tournament and counter ask «مين بيلعب؟»
  (the counter has the usual picker now); the archive's dates in Western
  digits and a readable title; the result sheet's number and label apart;
  the solo stats in the game's colour; on a phone's side the setup hero is a
  6rem tile beside its text. Found on the way (*Traps*-worthy): a setup card
  whose first child is a label was styled as an option row by section 39's
  `div:has(> .field__label:first-child)` (the team generator's whole card
  went grey) - that selector now skips `.card`.
- **26 Sep 2026, the arcade look's design review: the one-phone party games**
  (section 42 of `Style.html`, "ARCADE: ONE-PHONE GAMES"). The face-down role
  card of الجاسوس, الحرباء and الموقع السري is a poster in the game's colour
  (`.hold-card--poster`: the drawn icon big, the instruction in white over a
  fade; the back the card's paper with a band of the colour, the one height
  for every role kept), and من أنا؟ / كلمة واحدة's pass screens the same
  poster (`.pass-poster`, icon beside the name on a phone's side). The
  one-phone results of the three spy games turn over with `spyRevealParts`
  as the rooms' do (keys `cham1`, `spy1`, `imp1`; confetti through
  `afterReveal`). Every slate box of these screens is a token class now
  (`.plate-well` for options and summaries, `.card--party` for the
  بدون كلام / أوصف لي card, `.btn--neutral` / `.btn--success` for تخطي / صح,
  `.metric` timers); the night stages (مين يبدأ, على راسك, رد الفعل) are
  `--night`, the dark theme's ground. `.btn--go` is the Start bar's amber
  (section 39) for the buttons that start play again (لعبة جديدة, جولة
  جديدة, ماتش كمان, ابدأ الدور); `.btn-row--fit` keeps a row's buttons one
  line each; `playChipsHtml` (`JS_TeamRelay.html`) is the round / score
  strip as pill chips. أوصف لي starts from two amber Start buttons (60 / 90)
  and its card fits a phone's side; دوري المعرفة's round is `ltrFrac`; the
  podium never puts a 0 on a step once someone scored, and its place number
  inherits the step's ink; a choice of six or more on a setup wraps into
  boxes at 375 (شطرنج's clocks); ربع قرد's Arabic keys are four rows of 8
  (`monkeyKeyRows`); no confetti on a turn that guessed nothing; drawn icons
  on the spy buttons and cards (`btn__art`, new keys `*_btn` without the
  emoji, since `data-i18n` rewrites a button's whole text).
- **26 Sep 2026, the arcade look's design review: the rooms** (section 43 of
  `Style.html`; nothing the rooms server runs changed). The lobby: the game
  chosen is its own poster (`data-accent` on `.chosen-game`, a dark fade behind
  the name), it and its options come before the players, the QR folds behind
  «ادعي حد كمان ▾» once two people are in (`#room-invite`), one waiting line
  (the hub's, then «مستنيين المضيف يبدأ اللعبة…»), the Start bar a solid dock;
  the join card a poster head with proper field gaps (a saved name folded on
  any way in, an `onLeaveScreen` hook); info toasts violet. While a room game
  is on, `body.in-room-game` (set in `setView` and on a reload's restore)
  lowers the raised «افتح غرفة» into a tab. The audience bar is one row (the
  cheers, and «🔮 مين هيكسب؟» a chip whose names open in a popover;
  `--aud-h` is the page's foot padding). Every `a / b` in the room files goes
  through `ltrFrac`. الجاسوس's card is a poster with the drawn icon and its
  waiting line says the host starts the discussion (`imp_wait_discuss`); the
  TV's vote and writing frames show everyone as chips, ✓ on who is done
  (`tvWaitChips`), with the game's drawn icon big and faded behind
  (`tvArtHtml`). كلمة واحدة's clues are big cards on the phone and the TV; the
  TV frames' top pills sit at the top of the stage. تحدي المعلومات and لو
  خيروك share their colours between the phones and the TV (`--quiz-a..d`,
  `--wyr-a/b`); the TV podium ranks ties (same score, same medal) and shows a
  fourth. 🂠 is a drawn card back (`CARD_GLYPH`, `cardGlyphs` in
  `JS_Cards.html`). The golf, bowling and إستميشن totals say «المجموع»
  (`score_total`). مافيا's night is the night palette on the TV
  (`#view-room-tv.tv-night`); the spy card's cover has a timer fallback. The
  splash is the game's poster. Also: ارسم وخمّن's «إرسال» and the TV's word
  line, لودو's own chip, الدومينو's felt (`--dom-felt-1/2`), بنك الحظ's
  squares on the TV, خمّن مين's «الإجابة عند…» on one line, المشنقة's TV
  cards, خمن الكلمة's grid on a phone's side, a room duel's result under the
  board on a phone.

- **26-27 Sep 2026, سباق ألغاز** - the ten solo puzzles as a race in a room,
  to the owner's decisions (*The owner's specs*, *سباق ألغاز*): the solve
  engine gained the race (`RoomSolve.js`, `RoomRace.js`), the generators
  moved into shared files the Worker bundles, one renderer for the ten
  (`JS_RoomRace.html`) with each game's board registered in `RACE_UI`, one
  hub tile, the mode switch on ten setup screens. The Opus weekly limit
  stopped the eight agents that were to build the games after الملكات and
  خيوط, so the rest were built here. Rules tests 1,878, the leak check clean
  for all ten, the robots' race round, and the browser look above.
- **27 Sep 2026, the content audit** (*Decided, and why*): every list the
  games deal from read word by word by eight reviewers, about 500 changes.
- **27 Sep 2026, المشنقة's man comes alive** (*المشنقة*): the face, the sway,
  the wave, the flapping, the wriggle, the comic end, the escape that fits
  his pieces, the clock's freeze, the result card's rows. Looked at with
  four phones and a TV at 375×812 Arabic light and 1280×720 English dark.
- **27 Sep 2026, خمّن الرقم's hot-or-cold man** (*One sets, everyone solves*,
  "The hot-or-cold man"): a cartoon of the same cast beside the guesses on one
  phone and on every solver's own board in a room - shivering far off, thinking,
  sweating and fanning, on fire and hopping, a party on the hit, slumped out of
  tries - with an arrow for higher / lower. Looked at on one phone and in a room
  of a setter, two solvers and a TV (no man on the TV or the setter's phone), at
  375×812 Arabic light and 1280×720 English dark, with a reload mid-game.
- **27 Sep 2026, القنبلة's bomb comes alive** (*القنبلة in rooms*): a cartoon
  bomb that heats with the fuse, a pass that flies from hand to hand, and a
  real explosion with soot and a singed name. Looked at on one phone to the
  boom and in a room of three phones and a TV, 375×812 Arabic light and
  1280×720 English dark, with a reload mid-round.
- **27 Sep 2026, the living spy** (*Using the motion toolkit*, "The spy
  was…"): a cartoon spy behind the result card of الجاسوس, الحرباء, الموقع
  السري and الفنان المزيف peeks while it is down, then is cuffed and sulks or
  winks and tiptoes off the screen; on the TV too; one phone's الجاسوس asks
  the table «اتمسك» or «هرب». Looked at on one phone (both endings, reduced
  motion) and in rooms of four phones and a TV (الجاسوس caught, الحرباء
  escaped, الموقع السري caught; a reload), 375×812 Arabic light and 1280×720
  English dark, the TV at 1920×1080, no console errors.
- **27 Sep 2026, the podium's cheerers** (*Reveals play once per thing*):
  a cartoon figure on every podium step, everywhere a podium is drawn, with
  no caller changed. Looked at with fake boards (three, a tie, two) at 375×812
  Arabic light and 1280×720 English dark, and a trivia room of four phones
  and a TV at 1920×1080 to its podium, a reload mid-podium.
- **27 Sep 2026, ربع قرد's monkey** (*ربع قرد*, "The living monkey"): the
  quarters as a cartoon monkey built tail, body, arms, head, on the one-phone
  list, a room's rows, the verdict, a monkey's own note and the TV; a quarter
  pops in (or out when swapped back), the fourth with a chest beat. Looked at
  on one phone (three players to a monkey, a swap, a reload) and in a room of
  three phones and a TV, 375×812 Arabic light and 1280×720 English dark.
- **27 Sep 2026, أتوبيس كومبليت's bus** (*أتوبيس كومبليت on separate
  phones*, "The bus"): it pulls in with the letter on its board and the
  players at its windows, idles while they write, drives off on وقف, and
  leaves whoever sent nothing waving at the stop. Looked at on one phone
  (375×812 Arabic light, 667×375, 1280×720 English dark) and a room of three
  phones, a latecomer and a TV at 1920×1080, a reload mid-round.
- **27-28 Sep 2026, الكراسي الموسيقية** - musical chairs as a room game, to
  the owner's rules picked from a list (*The owner's specs*), the look
  picked from a design sheet of three: `RoomChairs.js`, `JS_RoomChairs.html`,
  section 50 of `Style.html`, a drawn icon. The stop is a server secret and
  the taps are ranked by the phones' own stamps of the server's time. Looked
  at in headless Chrome (three phones at 375×812 Arabic light, 667×375
  English dark and 1280×720, a TV at 1920×1080): the lobby, the music, a
  false start, the stop with the amber button, the hops onto the chairs, the
  result, the end and Help; no console errors. Found on the way: the pane's
  browser is too slow for a 3-second window, so the moments were photographed
  by a script of our own (the screen test's CDP helpers).
- **28 Sep 2026, عربيات التصادم (the controllers test)** - the owner asked
  whether the TV can be the game and the phones the controllers, like a
  console; yes, and this test was built first (*Decided, and why*, *The TV as
  the console*): `RoomBumper.js`, `JS_RoomBumper.html`, section 51 of
  `Style.html`, the live relay in `room.js` (`relayDrive`), a drawn icon.
  Rules tests 11, the leak check, a robot round (sticks reach the screen only,
  in order; an echo reaches one phone; oversized messages dropped). Looked at
  in headless Chrome: two phones (375×812 Arabic light, 667×375 English dark,
  the stick by real touches and the tilt screen), a TV at 1280×720 and two
  robot drivers, bumps scored, the delay read, a reload mid-round, Help, the
  TV's scores at the end; no console errors.
- **28 Sep 2026, a switch for any game** (*Switching a game off for a
  fix*): `DisabledGames.js`, one list; the card grey with «🛠️ بنصلّحها»
  everywhere, nothing opens it, the rooms server refuses it. The same day the
  owner dropped a planned racing game (keeping عربيات التصادم) and every
  mention of it went.
- **28 Sep 2026, عربيات التصادم the full game** - the owner's answers
  (*The owner's specs*): three ways to play (بالونات, نقط, الحلبة with its two
  endings), a 3D fairground rink, computer players driven by the TV, turbo and
  horn, the car's status big on the phone, the test wording and numbers put
  away. Rules tests 21, the leak check, the robots' relay round; looked at in
  headless Chrome with one phone, three computer players and a TV through
  Balloons, the ring and Points to their results; no console errors.
- **28 Sep 2026, عربيات التصادم's second round** - the owner's four points
  after trying it: the sound (the TV had only a faint knock), the tilt read
  from gravity, the tilt screen always sideways, auto gas (*عربيات التصادم*).
  Checked in headless Chrome with sensor readings made from known poses (the
  steer the same at any lean, either way round, full lock at 28°), the
  sideways screen on an upright phone, auto gas and the brake, the TV's sound
  waking on a click; no console errors.
- **28 Sep 2026, the audit of everything since 24 Sep, and every finding
  fixed** - a read-only audit of the 109 commits after the last one (agy had
  no quota, so six Claude reviewers read one area each; every moderate finding
  checked at the source), then the owner asked for every finding fixed and the
  four patterns behind them applied everywhere. The worst: المشنقة's TV stuck
  on the guessing frame after a word (proved on a live room with motion on:
  the old build still had no result after 8 s, the fixed one shows it at the
  hold's end); every game start threw a laptop TV out of fullscreen (bumper
  cars' cleanup ran for every game); a bumper-cars leaver let a ghost win;
  Fast 3 paid a grace finisher a podium place; «مين هيكسب؟» took the highest
  score in games won low; musical chairs' music silent after iOS replaced the
  sound context; two TVs each running their own rink; `/count` and `/report`
  taking any id and evicting real counts (`GameIds.js`, `keep`). Also: the
  turn-clock badge in eighteen room games stopping after a trip off the room
  screen (`isRunning()`), the hidden queen's host "pick for", play again's
  "Bot" names, the room list's chess family carried into the next room, the
  audience's guesses per game, cheers not broadcast when dropped, switched-off
  duels not dealt again, the trivia steal's double tap, the race's toasts,
  reveal and «استسلمت», Estimation's hints and lead card. The patterns went
  into *Traps*: a signature decides everything its frame does;
  `onRoomClocksReset` runs for every game (chess and bughouse no longer throw
  each other's board away); a board is read by its order, never `Math.max`;
  a scheduler reads `fxCtx()` every tick (the bumper engine and the bowling
  rumble rebuilt too). Rules tests and the leak check, the robots, and the
  screen test (rooms, screens, fixes: 88 passed).
- **28 Sep 2026, the UI scan's fixes** - a computed-style scan of every screen
  and room game at 375x812, 667x375, 1280x720 and 1920x1080 (both languages,
  both themes), and its findings fixed: the puzzle race's boards on a phone on
  its side sized like the solo boards (they collapsed to 18-32px in section 15's
  `auto` column: a percentage width there has nothing to measure); the home's
  ways-in lines readable on their white pills; bumper cars' stick, Turbo and Horn
  all on a sideways screen, Turbo's word in ink chosen by the car's colour
  (`bmpCarInk`, a darker pill on the red and the violet); كدّاب's ranks two rows
  on a phone's side (44x40); بنك الحظ's corners, decks, +200 and deed prices at
  4.5:1 in both themes (`--bank-*` tokens); «You start» for this phone
  (`*_ev_first_you`); the solo tools' labels never cut (`min-width:
  max-content`, the row wraps); the light amber's `--accent-ink` and
  `--warning-ink` a shade darker (#a64b06, 5:1 on the violet surfaces);
  سلسلة الإجابات's blank a Latin ? in English; every small tap at 44px (chess's
  2D/3D, the lobby's six-or-more choices in boxes, vote chess's sides, the bank
  pieces, the home's chips and «الكل ›» through a hit area over the gap); the
  trivia letters, the chairs' TV initials, the bumper place and delay at 4.5:1;
  طرنيب's label wrapping; and the robots' minesweeper race move made safe (it
  opened the first shut cell, sometimes a mine).
- **28 Sep 2026, a daily for خمن الكلمة and تشابه** (*The owner's specs*,
  *Solo games*): the same 5-letter word and the same medium puzzle on every
  phone on a date, played once, shared as coloured squares; both in تحدي
  اليوم (fourteen dailies now), the streak and the archive; Wordle's end is the
  solo result sheet now. Looked at in headless Chrome at 375×812 Arabic light
  (both won), 1280×720 English dark (both lost) and 667×375: a reload
  mid-daily, a free game dealt over it and the daily resumed, a finished one
  not dealt again, the hub's lines, the share text, an archive day (nothing
  marked), a second phone dealt the same word and tiles; no console errors.
  `npm run check` and `test:rules` pass; nothing the rooms server runs changed.
- **28 Sep 2026, continuous checks and toasts that stack** - every push and
  pull request to `master` runs `npm run check`, `test:rules` and a build
  of the site under its budget on GitHub Actions (*Testing*, "Continuous
  checks"); the leak check's musical-chairs driver plays again until a game
  has had a fake pause (it failed about one run in a hundred when none came
  up). `showToast` stacks its toasts, three at most, the oldest leaving
  first, each for as long as its words take to read, the same words again
  refreshing the one showing, a tap taking one away, announced to a screen
  reader (*The design system*, "Toasts"). Checked in headless Chrome at
  375×812, 1280×720 and 667×375, Arabic and English, light and dark, with
  reduced motion, and the new-version toast as it was; no console errors.
  Found on the way: a dark-mode error or success toast was dark ink on grey.
- **28 Sep 2026, 3D games rest when nothing happens for the phone** (battery):
  ميني جولف's ambient drawing (the flag, the water, the pads, a windmill) and
  حرب السفن's sea drop to about 5 frames a second on a phone that waits for
  others, watches, or sits on the card between holes, after 10 s untouched,
  sleeping on a timer in between; a touch, its own turn, a roll, a shell or
  a new hole brings the full rate back at once, and the TV never rests
  (*ميني جولف*, *حرب السفن*). بولينج (draws only while something moves) and
  the chess 3D board (only on a change) were checked: 0 renders a second
  idle; عربيات التصادم's TV is left alone and its phones draw no 3D. Measured
  in headless Chrome (render calls a second, before → after): golf's waiting
  phone 28.8 → 4.8, the card between holes 28.8 → 4.8 (144 → 4.8 on a
  windmill hole), battleship's waiting phone 72 → 4.8; a touch, a roll, the
  TV and the phone whose move it is unchanged. `npm run check` and
  `test:rules` pass; no console errors.
- **28 Sep 2026, a host away doesn't stop the table** (*Decided, and why*,
  *Multiplayer rooms*): after 20 s with the host's phone gone (40 s for a
  socket open but silent), any player or screen presses the host's "move on"
  buttons in every room game; settings, seats and new games stay the host's,
  the handover still at 2 minutes. `room.js` (`hostAway`, the `_hostAway`
  stamp, the alarm's two marks), `view.js` (`hostAway`), `requireMoveOn` in
  the rules and every game's room file, `roomCanMoveOn` / `roomMoveOnHtml` /
  `paintRoomHostAway` on the page and the TV. Also: كلمة واحدة's room words
  are only the host's (a stand-in's `nextRound` keeps them, `room._joWords`).
  Rules tests (a player refused while the host is here, allowed while away,
  settings / the hub / a new game / الجرس still refused, two stand-ins' taps
  dealing one round), the leak check, and a robot round
  (`--only=hostaway`: the host's socket closed, «المضيف مش متصل» reaching
  the phones at 20 s, a player closing the vote and dealing the next, the
  host back).

- **28 Sep 2026, the slow-load scenes** (*The owner's specs*, *The design
  system*, "The intro"): six small scenes and a changing line under the logo
  when a first load is still going 2.5 s in, chosen at random each slow
  visit. After the logo in the page, before the big bundles: the logo still
  starts at the same byte (51,327 minified, 21 KB gzipped); the scenes add
  16.6 KB minified (6.5 KB gzipped: 57 lines in two languages and six
  scenes). Looked at in headless Chrome at 390×844 on a throttled connection
  (150 ms, 1.6 Mbps, CPU 4×): the intro unchanged at 1 s, a scene and its
  line at 4 s and 8 s, each of the six in Arabic and English, light and dark,
  still under reduced motion, 667×375, the logo flying home once ready with
  nothing left running; unthrottled, no scene ever appears.

- **29 Sep 2026, السلم والتعبان: the sneak and the crawl** (*The owner's
  specs*, the review of the second round): he stands on his own square before
  he sneaks, the snake nearest to him crawls the whole way over along the
  board and back into its very own shape, and the extras rarer and shorter
  (the sneak 1 in 3, a tail move half the time, a jump 2 in 10, a snap now and
  then, the idle moments and the board's own moments about half as often,
  every second-round moment trimmed). `npm run check`, `test:rules` (the new
  rates, the snake nearest to him, the times in `readyAt`), the robots'
  `--only=snakes` round (16 passed) on a local server. Looked at in headless
  Chrome on a virtual clock, frame by frame: the sneak (push and eat) at
  375 × 812 Arabic light and 1280 × 720 English dark, and on the TV at
  1920 × 1080 in a room - the snake's outline the same string before and
  after, the piece ending on its own square, every moment ending 0.3-0.6 s
  inside its server time; a 90 s game against the phone; no console errors.
  Then the coordinator's review: a snake whose head faced away from him
  turned back in a hairpin and crossed its own body, so the way out is
  planned (`snkCrawlPlan`, a wide arc, checked by `npm run check` over 1,407
  sneaks). A copy of the board's bottom-left corner once seen over its middle
  in a screenshot was headless Chrome's capture, not the page: one mat, one
  board in the DOM, and a clip of the very same still frame taken just
  before was clean.
- **28 Sep 2026, the stylesheet's performance** - style recalc measured in
  headless Chrome at 6x CPU throttling (`Performance.getMetrics` per action;
  per rule by deleting it through the CSSOM and rebuilding a view's markup):
  one setup-screen rule with a `:has()` above a universal subject was half of
  every room screen's recalc. Replaced by `.stepper-row` on the nine count
  rows in `Controller.html` (`.tv-art ~ *` by `.has-art` on its four parents,
  `[class*="tabular"]` by `.tabular-nums`), each keeping its old weight.
  8 s of أونو's style recalc 1,865 → 89 ms, a lobby filling 255 → 18, a
  setup screen 211 → 171 (*The design system*, *Performance*). Then dead CSS
  from a coverage run of every view, popup, game and room game: 27 rules, 8
  selectors and a keyframes whose classes no source file writes (the page
  1,548,144 → 1,547,909 bytes gzipped). No visual change, checked by swapping
  master's stylesheet into the same page state and comparing every computed
  style of every rendered element and its ::before/::after (441 states: every
  setup, popup and started game at four sizes, both languages and themes, and
  every room game on four phones and a TV): identical, apart from vote chess's
  ticking clock ring; 199 screenshots, identical except canvases and running
  clocks.
- **28 Sep 2026, جمجمة** - Skull as a room game, to the owner's rules
  (*The owner's specs*, *جمجمة*): `Skull.js`, `RoomSkull.js`,
  `JS_RoomSkull.html`, section 54 of `Style.html`, a drawn icon; our own
  touch «هيعملها؟» (everyone else guesses before the flips, a side tally).
  Rules tests: about 70 skull checks (36 whole games of bots among them),
  2,038 in all; the leak check clean for all 68 room games, its skull probes
  proved on a scratch build by leaking the answers, another's lost disc and a
  pile's faces (the order of the flips is pinned by `rules.mjs` instead); a
  robot round (`--only=skull`, 31 passed). Looked at in headless Chrome: three
  phones (375×812 Arabic light, 667×375 English dark, 1280×720 Arabic dark),
  two computer players and a TV at 1920×1080 through a whole game of seven
  rounds to the podium - the laying, the bets, «هيعملها؟», the flips, a skull
  and a chosen disc lost, the results - a reload mid-round, Help; no console
  errors. Found on the way: a phone and a TV joined over the API stay on the
  home until `roomReturnToActive()`, and the TV's end column needed its own
  zoom to keep the podium on the screen.

- **28 Sep 2026, السلم والتعبان** - Snakes & Ladders to the owner's rules
  and look أ «كلاسيك بلمستنا» (*The owner's specs*, *السلم والتعبان*),
  built beside جمجمة (another branch): `Snakes.js` (the map from a seed,
  checked fair; the rules; each roll one event with its animation's variant
  picked on the server), `RoomSnakes.js`, `JS_Snakes.html` (the sheet's board
  ported: thin living snakes drawn each frame, wooden ladders, cartoon pieces,
  the workers who build the map, seven snake moves and five ladder moves, the
  near miss, the ladder missed, the bounce at 100, the six, the win dance; and
  a game against the phone), `JS_RoomSnakes.html`, section 53 of `Style.html`,
  a drawn icon (`art:snakes`), and the lobby's one kind of computer player
  (`bots.one`). Rules tests: the map (80 seeds), the rules and the room;
  `test:rules` passes (the leak check clean); the robots' round
  (`--only=snakes`, 16 checks) passes on a local server. Looked at in headless
  Chrome: against the phone at 375×812 Arabic light, 667×375 English dark and
  1280×720 English light (the building, rolls, a snake's gulp, a reload
  mid-game, a game to its podium, Help); a room of three phones (375×812,
  667×375, 1280×720), a computer player and a TV at 1920×1080 (the lobby, the
  building, rolls, a reload mid-game, Help, the end); no console errors. A
  deploy is needed for the rooms server.

- **29 Sep 2026, خمّن مين reworked** - the owner's decisions (*The owner's
  specs*): no list of questions, nothing automatic, no computer players, and
  faces with far more to ask about in look ب «ألبوم ناعم», picked from a
  design sheet of three; cards 4 or 5 a row on a phone upright and a hold that
  opens a face big. Rules tests (the boards, what goes together, every
  feature turning up, no list, answers as given, the clock dropping a
  question, no computer player), the leak check and the robots updated.
  Looked at in headless Chrome at 375x812, 667x375, 1280x720 and a TV at
  1920x1080: a question out loud and one typed, answered, faces flipped by
  hand, a hold on a face, a guess to the end. Found on the way: a hijab that
  reached the waist hid the shirt, the tie and the necklace, so the faces
  under it looked alike - it ends on the chest now, and a face with one gets
  none of what it would hide. A deploy is needed for the rooms server.
- **29 Sep 2026, السلم والتعبان's second round** (*The owner's specs*,
  *السلم والتعبان*, "The second round"): the board as big as fits at every size
  (measured by `snkFit`, nothing scrolls sideways-held, on a laptop or the TV;
  a room's strip of people moved into the side column), and every new moment
  the owner picked - a snake's tail square (four moves), the sneak beside a
  ladder's foot (push or eat), heads walked past (duck, snap, jump), a 1, the
  sixes building up to fireworks, the drumroll from 95, two on one square,
  the cup's giggle, the snakes swaying and the ladders glowing at a win, the
  leaver's suitcase - decided on the server in the roll's event and counted in
  `readyAt`; and the board's own life on each screen: moods on the faces,
  tapping, yawning, watching, sitting, cheering from the frame, the others'
  reactions, a snake stretching or snapping at a butterfly, a worker at a
  rung, a name on a tap, the TV's night. Rules tests (13 new checks; all pass,
  the leak check clean), the robots' round (`--only=snakes`, 16 passed).
  Looked at in headless Chrome on a virtual clock (every moment photographed
  mid-way, each ending before its `readyAt`): one phone at 375×812 Arabic
  light and 1280×720 English dark, 667×375 English dark (a leaver's walk, a
  reload mid-roll), reduced motion (every roll set at once, no errors); a room
  of three phones (375×812, 667×375 dark, 1280×720), a computer player and a
  TV at 1920×1080 and 1280×720 (sizes, rolls, a leaver, the night); no console
  errors. A deploy is needed for the rooms server.

- **29 Sep 2026, كدّاب and الشايب's second round** (*The owner's specs*):
  the flow fixes (rank chips that pick, the pick-your-rank button, the bot's
  wait and the draining bar on كدّاب!, bigger called cards, a dashed empty
  pile; shuffle my hand, rows of backs, the old man moment, one pair count),
  then look ج «المسرح» on the phone, a phone on its side, a laptop and the TV
  (section 26b of `Style.html`). Rules tests (the call window's times and
  `shared.callEnds`, `mix` and the lifted card following its card), the leak
  check, and the screen test's rooms and screens. Looked at in the browser at
  375x812, 1280x720 and a TV at 1920x1080 with three computer players and two
  scripted people. Found on the way: a design sheet with no viewport tag
  shows a phone the 980px page; and a laptop's named grid areas leak onto a
  TV frame that shares its class (`grid-area: rail` makes an implicit area).
  A deploy is needed for the rooms server.
- **29 Sep 2026, الشاهد** - the witness, the first of the five new room
  games (*The owner's specs*, *الشاهد*): `Witness.js`, `RoomWitness.js`,
  `JS_RoomWitness.html`, section 56 of `Style.html`, a drawn icon
  (`art:witness`: a mugshot and a magnifier), look أ «القسم». Rules tests
  (all pass), the leak check (clean, its probes proved on a scratch build),
  the robots' round (`--only=witness`, 58 passed on a local server). Looked
  at in headless Chrome with motion on: four phones (375×812 Arabic light and
  English dark, 667×375 English, 1280×720 Arabic) and a TV at 1920×1080
  through four cases to the podium, a reload mid-drawing (back on the
  drawing with the sketch), Help; no console errors. Found on the way: the
  witness's own phone kept the case file over the sketch while describing,
  which pushed the sketch off a phone's screen - the face is gone by then, so
  the file goes and the sketch takes its place. A deploy is needed for the
  rooms server.
- **29 Sep 2026, سلك مقطوع** - the co-op panic game to the owner's rules
  (*The owner's specs*, five new room games; *سلك مقطوع*), each place in the
  look the owner picked for it from the design sheet: `Wire.js`,
  `RoomWire.js`, `JS_RoomWire.html`, section 55 of `Style.html`, a drawn icon.
  Rules tests (about 40 wire checks), the leak check (its probes proved by
  leaking a panel and an order's holder), the robots' round (`--only=wire`,
  35 passed) and the screen test's rooms (65 passed). Looked at in headless
  Chrome with three phones (375×812 Arabic light, 667×375 English dark,
  1280×720 Arabic dark) and a TV at 1920×1080, each place through the card, a
  level won, level 2 lost by the damage, the end; a reload mid-level; Help; no
  console errors. Found on the way: a timeout that left its own deadline due
  waited 30 s (*Traps*), and five players' orders missed at once ended a level
  of five in 11 s, so the damage a level takes grows with the table. The
  page is 1616 KB compressed with it, over the 1600 KB budget: raising the
  budget is the owner's call. A deploy is needed for the rooms server.
- **29 Sep 2026, المزاد** - the bluffing auction, the second of the
  five new room games (*The owner's specs*, *المزاد*): `RoomBox.js`,
  `JS_RoomBox.html`, section 59 of `Style.html`, a drawn icon (`art:box`: the
  red box with its gold bow), look أ «استوديو الصندوق». Rules tests (every
  clue true over 150 dealt games, the bids, ties, every effect, paying, the
  end, leaving; all pass, the leak check clean, its probes proved by leaking
  the bids, a clue, the peek and the box's kind in a scratch build), the
  robots' round (`--only=box`, 141 passed on a local server). Looked at in
  headless Chrome with motion on: four phones (375×812 Arabic light and
  English light, 667×375 English dark, 1280×720 Arabic dark) and a TV at
  1920×1080 through two whole games of eight boxes to the podium (a bill, a
  treasure, a scorpion, an empty box, a thief, double or nothing lost, a tie
  to the poorer), a reload mid-bid (back on the bid with its number), Help;
  no console errors. Found on the way: the strip of money under the TV and
  the phones showed the result the moment the box began to open, before the
  show - the board keeps the money from before the opening now; the word
  «عقرب!» popped over the drumroll's banner, which now goes when the lid
  flies. A deploy is needed for the rooms server.
- **29 Sep 2026, الأوضة المضلمة** - the blind co-op maze, the second of the
  five new room games (*The owner's specs*, *الأوضة المضلمة*): `Dark.js`,
  `RoomDark.js`, `JS_RoomDark.html`, section 57 of `Style.html`, a drawn
  icon, look ج «العدسة والصدى»; the rooms server gained a screen-only channel
  (`room.screenOnly` → `screen`) and the lens relay (`relayLens`). Rules
  tests (480 maps walkable by an independent search, each story's traps, the
  room's rules; all pass), the leak check (clean; its probes proved by
  planting the seed and the traps in the mover's slice and in `shared`), the
  robots' round (`--only=darkroom`, 42 passed on a local server: the map on
  the guides and the TV only, the lens never reaching the mover, a bump, a
  trap, the next level, passing the walk, the stick). Looked at in headless
  Chrome with motion on: three phones (375×812, 667×375, 1280×720; Arabic
  and English, light and dark) and a TV at 1920×1080 in 3D and 2D, both
  stories, both ways of moving, a trap, two levels, a reload of a guide and
  of the mover mid-level, Help; no console errors. Found on the way: a TV
  banner put up for a trap was lost when the next state of the same move
  rebuilt the frame - the banner is remembered with its end and drawn again.
  A deploy is needed for the rooms server.
- **29 Sep 2026, بالظبط ٣!** - the reflex game, the owner's rules and look
  (*The owner's specs*, *بالظبط ٣!*): `RoomExact.js`, `JS_RoomExact.html`,
  section 58 of `Style.html`, a drawn icon; fourteen orders all judged from
  the phones' stamped taps, the hands slammed in the order pressed, the slap,
  the bee, the tea that spills and the food that fills the table. Rules tests
  (all pass), the leak check (clean, its probes proved on a scratch build),
  the robots' round (`--only=exact`, 50 passed on a local server). Looked at
  in headless Chrome with motion on: four phones (375×812 Arabic light and
  English light, 667×375 English dark, 1280×720 Arabic dark) and a TV at 1920×1080
  through orders to level 7 and the end, a reload mid-order (the pad back),
  Help; no errors of the game's. Found on the way: a script that shoots five
  screens between the countdown and the tap falls behind a game whose next
  order deals itself - the look took its pictures after the verdicts, not in
  the window. A deploy is needed for the rooms server.
- **30 Sep 2026, the full-app audit and every finding fixed** - a read-only
  audit of the whole app (agy's quota was low, so 17 Claude reviewers read one
  area each on a throwaway clone; every critical and moderate finding checked
  at the source, the Chess960 one proved by running the code), then the owner
  asked for every critical, moderate and minor finding fixed. Six agents fixed
  one area each in worktrees, merged here. The worst: جمجمة's public hand and
  pile counts told the table which disc a skull had taken (the lost disc now
  leaves only `g.discs`; the leak check counts them); Chess960 castling where
  the king moves one square was saved as a king step, so undo, looking back and
  the review replayed it wrong (a move now carries its stored form,
  `chessUciOf`: king-takes-rook for that castling); a room of computer players
  alone never went idle; cheers vanished from the second game (the cheer's
  number is kept); الأوضة المضلمة's moving traps missed a mover standing still
  (the alarm can't wake under a second, so the timeout checks every trap tick
  since the last) and its joystick saved the whole room nine times a second
  (`stick` is a quick action); the chairs' «اقعد!» and the witness lineup
  rebuilt under the finger; المزاد's strip showed a box before its lid flew;
  على كيفك could never copy الخشاف; the Stop clock (and every room clock that
  compared `endsAt` with the phone's own time) reads the server's time through
  `roomServerNow()` (Ludo, Snakes and the bank have their own gap helpers); a
  double tap on "skip the setter" skipped two; the chess puzzle streak went on
  at 0 hearts; حرب السفن's shell could stay "in flight" for good; السلم
  والتعبان replayed its building on coming back to the room; تشابه's daily was
  lost after a reload off its board; الحرباء and الموقع السري on one phone
  scored twice after a back-close; a switched-off game restored on reload;
  bumper cars' tilt died from round 2 on an iPhone. And about fifty minor ones
  (stale taps carried and checked on the buzzer, bomb send-back, Codenames
  guess, Wavelength skip and quiz guess; typed text kept across a host change
  by `renderRoomFrame`'s fourth argument; clock intervals, motion listeners
  and loops stopped off their screen; archive replays no longer set bests; a
  new deal over a game in progress asks first; خمس ثواني's verdict can be taken
  back). The owner's three decisions are in their sections: the buzzer, the
  dark room's new map, the mines race. Rules tests and the leak check pass
  three runs in a row; the robots and the screen test ran before the release.
- **30 Sep 2026, the UI/UX review and its fixes** - a review of every screen against
  a UI rulebook, re-triaged with the owner (a phone-first party game: touch first,
  keyboard play of boards optional, undo or a safer layout before a new confirm, the
  look untouched), then fixed in batches, each checked at 375x812, 667x375 and the
  TV, Arabic and English, light and dark. What changed and where it lives:
  - **Flow**: a double tap in بدون كلام / أوصف لي scores once (`busyUntil`); «لعبة
    تانية» between rounds asks first (`tvBackToHub`, on the phone and the TV); the
    one-phone exit sheet's loud button is «كمّل اللعب», the ways out quieter
    (`openExitSheet`); «المضيف يبقى…» is a secondary button; a lobby Start the server
    refuses for too few people points at the "N more needed" line (`blockStartAt`)
    instead of a toast (trivia, the emoji riddles and the proverbs start with one, so
    the phone never blocks it itself); the players sheet keeps «يلا» pinned; toasts
    sit above a setup's Start bar (`toastClearStart`); a solo bowling phone that
    can't draw 3D throws a plain ball, and mini golf offline says so with «حاول تاني».
  - **Rooms**: a line under the header while the room can't be reached
    (`roomNetNotice`, `body.room-offline`, the host-away note's pill); join mistakes
    under their field (`roomJoinFieldError`); every room turn clock reads
    `roomServerNow()` (18 files used the phone's own clock); a typed chat line sends
    once; the rooms server's Arabic refusals shown in English on an English phone
    (`ROOM_ERR_EN`, `roomErrLocal`, `roomError` - the server's text stays on
    `err.raw`; anything not in the table is «That can't be done right now». A new
    server message a player meets often goes in the table); an «مش متصل» / Away
    badge in the lobby; TV names at `--tv-sm`.
  - **Popups**: every `.modal-content` is `role="dialog" aria-modal` named by its
    title (`labelModal` in `hoistModals`, no focus trap - the owner's call); Escape,
    the phone's back and the edge swipe all close the popup drawn on top
    (`topModal` / `closeTopModal`: by z-index, so a confirm over a sheet goes first).
  - **Accessibility**: icon buttons and fields named in both languages
    (`data-i18n-title`, `a11y_*` keys; a field with only a placeholder gets it as its
    `aria-label` in `applyTranslations`); segmented options say `aria-pressed`, the
    tab bar `aria-current`; the room game tiles are buttons; arrow keys in the flags
    search (`flagsKey`); live regions for the turn banner, the chat, the lobby lines
    and Guess the Number; board cells named (the trivia board, X-O, memory, the
    archive); Wordle's colours get ● / ▲ under Settings → رموز للألوان; a wrong
    Sudoku number a wavy underline; a stepper dims − / + at its ends
    (`syncSteppers`); small targets get a bigger invisible hit area (the kick ✕,
    the cheers, the banner's Return).
  - **Bugs**: Minesweeper's right button flags; «إدارة المجموعات» opens with nobody
    picked; Guess the Number's and Domino's text moved into `TRANSLATIONS`.
  - **Decided**: the zoom lock stays (the owner: apps don't pinch-zoom, iOS ignores
    the lock anyway, and Settings → Screen size is the way to bigger text).

- **30 Sep 2026, the ideas batch** - a review of every game for its look, how easy it is to play and its motion (five reviewers, one area each), then every idea built but five the owner is deciding (*The ideas batch*): the Wordle reveal, soft misses, Guess the Number's window, 2048's swipes, the minefield's hold and chain, undo stacks, the memory game's third tap, timer presets, the sorted counter, hold-to-repeat, the result sheet; only the buttons score in بدون كلام, the last three seconds on every one-phone clock, the 3-2-1 and the turn's fix-it list, the bomb's holder, كلمة واحدة's writers' check; الجاسوس's vote and pick from six, من أنا؟'s order points, الموقع السري's card of 24, Stop scored a category at a time; one wording for the two ways to play, «الليلة دي؟» opening the room, recents first, «كمّل», the room list's «تنفع دلوقتي», the empty TV lobby's big QR; the TV's who-is-done chips and the staged reveals of فيبج, موجة, مافيا, the trivia and الجرس, الشاهد's tally; لودو's landing rings, السلم والتعبان's reach, أونو's colour counts and «بعدك إنت», بنك الحظ's «دبّرها» (a rooms-server action) and its buy line.
- **30 Sep 2026, later: the owner's four picks** (*The owner's four picks after the ideas batch*): «التالي لوحده» in trivia, لو خيروك, مين أكثر واحد, فيبج, زي الكل, صدق ولا كذب and موجة (a lobby switch, off by default; the server deals the next round after a pause, with a countdown and «⏸ استنى»); سكرو's «↺ شوف تاني» on the latest move, on the asking phone only; دوري المعرفة's hidden «كارت دبل!» (one a board, never a 100, a setup switch on by default); الدومينو's «👊» passed-on numbers on the seats while «نوّر الحجارة اللي تركب» is on. A deploy of the rooms server.
- **30 Sep 2026, the next level (engineering)** - the owner picked items 1, 2, 3, 4, 5, 6 and 8 of a "next level" list; the engineering four were built by agents in worktrees and merged: **each game's code loads when it opens** (the first open 1,760 → 619 KB gzipped; `notes/lazy-load.md`), **room links with a WhatsApp preview** (`/r/CODE`) and **errors from players' phones** (`/err`, `npm run errors`; `notes/previews-errors.md`), **GEMINI.md split** into an index and `notes/games/` (900 → 127 KB, every line checked to land in exactly one file; `tools/prove-docs-split.mjs`), **the tests in parallel** (robots 16 → 4-5 min, the screen test 10 → 3-4 min) and `npm run test:changed` (`notes/tests-docs.md`); and the dark room's trap test made to pick a trap it can reach (it flaked 1 run in 40). الشلة, «اعمل مسابقتك» and «برنامج السهرة» had every rule answered and a look picked (الشلة ج «كارنيه النادي», the quiz editor ب «القايمة», the night's show أ «لوحة المذيع»; `notes/archive/sheets/next-level-looks.html`) and are built next.

- **30 Sep 2026, the home's three touches** (the owner, looking at the home on a laptop): the featured poster's label is «★ جرّبوا دي» (`home_feat_tag`), no longer a second «الليلة دي؟» beside the tile of that name; on a wide screen the poster is shorter (min 13rem, the art 8.5rem) so the first shelf shows without scrolling; تحدي اليوم's bar shows «سلسلتك 🔥 N», or «🔥 ابدأ سلسلتك النهارده» with no streak (the nudge hidden under 600px, where it squeezed the title).
- **30 Sep 2026, the next level (the three features)** - الشلة (look ج «كارنيه النادي»), «اعمل مسابقتك» and «كلماتنا» (look ب «القايمة»), and «برنامج السهرة» (look أ «لوحة المذيع»), every rule the owner's (`notes/games/crew.md`, `quiz.md`, `program.md`); built by three agents in parallel and linked by a fourth (a crew's quizzes and words, a program night on the crew's history). The owner's two answers after the build: a room asks «للشلة؟» every time, and the night's points are 5/3/2/1 everywhere. Found on the way: the dark room's leak-check driver had the same unreachable-trap flake as the rules test.
- **30 Sep 2026, the home on a big screen** (the owner's screenshot at 1920 wide): the root font grows with the screen, so the home's 78rem cap was 1,560px there and the shortcut cards, the search and the poster were long empty strips; from 1280px wide the home is 64rem (Style.html section 60). «▶ العب تاني» is a round button inside its chip (one flat pill), so chips with and without it read alike. تحدي اليوم's bar draws the game's own icon (`art:daily`), the same as its chip in the recent row.
- **30 Sep 2026, the 👥 made bright**: every emoji font draws 👥 as a dark grey figure, lost on the cards' dark badges and the poster; it is `.people-glyph` now (the card badges, `catalogMeta` - the poster, the first-visit cards, the setup heroes, Help - and «مين وكام؟»), drawn as a silhouette in the text's colour (`color: transparent` + `text-shadow`), white on the badges and the poster.
- **30 Sep 2026, finding a game, and the screens review**: the room's list and برنامج السهرة's picker got a search box (any game by name, either language, a family's games too) and section heads (`notes/rooms.md`, *Finding a game*); the picker's ✓ was a strip across the tile's foot (the posters' `> *` rule) and is a pill again. A screenshot sweep of all 131 screens at 1920×1080, 375×812 and 667×375, read by three reviewers and checked: the header's title clipped the dots under a final ي («خمس ثوانى»: line height 1.15 with the overflow hidden; `#app-title-text` 1.6); مع بعض and الأدوات share the home's 64rem column from 1280px; chess's ways wrap from 900px instead of fading out; buttons that touched (الحرباء's «إنهاء», the teams' «الرئيسية», الموقع السري's timer row); formal wording made Egyptian (أسماء الرموز's line, «ما اتحلّش في يومه», «خبّي وادّي الموبايل», the fallback «ادّي الموبايل لـ»); بدون كلام's skip is «تخطي» like أوصف لي's. Two claims checked and false: the player ranges and the timer's «+5 د» read the right way.

- **30 Sep 2026, six older screens redesigned** (the owner picked all six from a before/after sheet of the 131 screens): the team results (team cards in their colours, a summary, side by side on wider screens, «وزّع تاني» the same way, share, «غيّر اللاعبين»), مولد الفرق's count as the segmented control with how the players split, العداد العام (a big + per row, places and the crown, «صفّر الكل» with a 6-second undo), من أنا؟'s writing step (the pass poster, a dot per writer, the name hidden as dots), الجاسوس's talk on one phone (the clock in a ring, player chips, the actions in the bar) and خمّن الرقم (a labelled field and «خمّن», the guesses as chips). `notes/design.md`, *Six older screens*.
- **30 Sep 2026, the talk in الحرباء and الموقع السري**: the owner asked for الجاسوس's new discussion layout in both; the classes became one shared component (`.talk*`), الموقع السري's clock is in the ring (emptying, red in the last minute) with the players shown, الحرباء's speaking order uses the same chips; sideways, the ring shrinks and the bar is one line (all three). `notes/design.md`, *Six older screens*.
- **1 Oct 2026, the second redesign batch** (the owner: "Apply all 10 and the small fixes", from a scan sheet of the rest of the app): إكس أو, خمّن الدولة, المشنقة's writing step, سلسلة الإجابات, فوازير إيموجي / كمّل المثل on one phone; ربع قرد, الجرس, خمس ثواني in rooms; the race and جمجمة on the TV; and the small fixes (the mid-screen «خروج» to the foot, كلمات من حروف fitting upright, زي الكل's send, player tiles in votes, the TV waiting stage). Built by four agents in worktrees and merged (only notes collided). إكس أو gained an undo on one phone. All tests: screens 154/154, robots 3,436/3,436, rules and leaks. `notes/design.md`, *The second batch*.
- **1 Oct 2026, the whole-app audit and its fixes** (the owner: "fix all points plus the general recommendations"): a read-only audit by 17 Opus agents over every module (76 findings, every moderate cross-checked by a second model, the three worst proven in the browser), then fixed by seven agents in worktrees, each owning its files. The worst: since the lazy split the duels' tournament was gone from dots, X-O, خمّن مين, حرب السفن and شطرنج (`tourWrap` ran before they registered; each wraps itself now), فوازير إيموجي's three ways were overwritten by the quiz chunk (it yields to the solve router now), and a player's name could run script through the share card (`shareCardText` parses in an inert `DOMParser` document). Then: the night's points count only who played (`nightBoardOf`: roster, seats, teams; ربع قرد and أسماء الرموز bank now, chairs and bumper rank by the order out), a family quiz's code no longer goes to every phone, الفنان المزيف ends when the fake leaves, الشاهد's lineup has no centre (a hidden base face: 98% → 17%, chance), the program loads a family pack, the spy tells in the room games (one card colour, one grid, one «أنا الجاسوس» on every phone), server time for جمجمة's, bowling's and خمس ثواني's clocks, reloads (الموقع السري's caught spy, الحرباء's guess, Snakes' board), a chunk that stalls says so after 15 s, the CDN files outlive a release (`cdn-pinned`), and the tools: `check-i18n` reads TRANSLATIONS with acorn (7 keys were invisible), a new `check-css-vars` (seven tokens were defined nowhere), `lazy-split` fails on a registry entry patched in the wrong order, `test:ui` checks the tournament switch and the emoji ways, exit codes, `.dev.vars` ignored. Robots 3420 ✓, screen test 163 ✓, rules and leak check ✓.
- **1 Oct 2026, 🕵️ المهمة السرية** (look أ «ملف سري»): a switch on the room, off by default, that runs beside every game: the host picks the place (البيت، كافيه أو مطعم، بره، أي حتة) and the company (العيلة، الصحاب), everyone gets a secret target and a mission from `Missions.js` (140, Egyptian colloquial, tagged; 55-99 for each place × company), «خلصت» asks the target at a calm moment (نعم: a point and a new file; لأ: carry on), «غيّرها» every 10 minutes and «كشفتك!» (proposals, built), a 📁 in the header on any screen, the TV's cork board, ticker and red-string reveal, the champion «أشطر عميل سري» banked 5/3/2/1 once. Decided while building: paused under 3, a wrong catch waits 5 minutes, an asker can't be caught, every text quoted as the doer's file said it (`notes/games/mission.md`). A new screen-test part `mission` and a robots segment `mission`.
- **1 Oct 2026, ارسم اللي بتسمعه** (a new room game, its own card; the owner's rules and look أ «كراسة الرسم»): one describes a picture only their phone shows - shapes on a 3 x 3 board, or one of 20 drawings made of shapes, each a generator of variants, three levels - and everyone else draws it on their phone without a question; the app marks every drawing against the picture (a 64-cell judge: the distance each way, the lines' direction, where the ink is on the page), 3 / 2 / 1 to the closest, the describer a point per 20% of the average, «أغرب رسمة» +1. Built in a worktree (`Hear.js`, `RoomHear.js`, `JS_RoomHear.html`, Style.html section 61; `notes/games/hear.md`). Found on the way: two `wrangler dev` servers of the same Worker name on one PC fight over one dev-registry file and one dies (EPERM); a private `WRANGLER_REGISTRY_PATH` per server keeps them apart.
- **1 Oct 2026, الخزنة («صندوق جدّو»)** (the owner: Keep Talking and Nobody Explodes rebuilt our way, look ب of the sheet): a new room game. Grandpa's chest with up to four padlocks - wires, symbols, a dial, lights - every safe and the notebook generated from seeds (`Vault.js`); whoever sees a lock never gets its page and the readers never see a lock, enforced on the server (`RoomVault.js`, `room._vault`, the TV opener's looks on `room.screenOnly`). Three ways (واحد بيفتح, الكل, فريقين), «3 غلطات» (the candle ×1.25, ×1.5, the alarm) or «من الوقت» (−15 s), endless levels (the room's best, co-op) or 3/5/7 safes with points on the night. The phone: the chest, the candle, the padlocks on a hasp, one lock big with a swipe, chalk ✗, grandpa's lined notebook; the TV: the attic, the pages on a washing line, the lid opening with a glow (`JS_RoomVault.html`, Style.html section 63). Tests: rules (48), the leak check (four drivers), robots (`--only=vault`, 82), the screen test, 300 notebooks checked by `npm run check`. `notes/games/vault.md`.
- **1 Oct 2026, دندنها** (a new room game, the owner's rules; look ج «الفرح: المسرح والجمهور»): Egyptian songs, two ways - «دندنة» (the hummer in turn hears Apple's 30-second preview in their ear and hums it) and «سمّع» (every phone plays the same clip on the server's clock: the first 10 s once, all 30 s, or growing 2/5/10 s) - the names typed and judged by `guessVerdict` (the English title too), 3/2/1 for the fastest three, four choices after 15 s worth 1, the hummer 2; 5/10/15 songs. `Songs.js`: 203 songs pinned to iTunes trackIds of the original recordings (`npm run check:songs`), served through `/song/CODE/TOKEN` so no title, singer or trackId reaches a guesser (the leak check probes each). `notes/games/hum.md`.
- **1 Oct 2026, دندنها gets Deezer** (the owner): a second source of previews beside Apple, each song pinned to one (`{ src, id }`) with an optional second pin on the other, looked up at play time because Deezer's preview addresses are signed and expire (`rooms-worker/src/songs.js`); 34 songs added - Umm Kulthum's الأطلال, ألف ليلة وليلة, فكروني and six more, الجندول, حدوتة مصرية, and the newest grown from 11 to 34 (ويجز, أحمد سعد, عمرو دياب, حمزة نمرة, تامر عاشور…) - 237 songs, 337 pins, all playable; the round counter reads «الأغنية 3 من 10».
- **1 Oct 2026, the four talking games released together** (the owner picked them from ten "out of the box" ideas - games with real talking and moving, like الحقوا! - answered every rule, and picked each look from a sheet of three: دندنها ج, الخزنة ب, ارسم اللي بتسمعه أ, المهمة السرية أ). Built side by side in four worktrees and merged: the shared lists (`GameIds.js`, `FILES`, `SHARED_LISTS`, `CHUNKS`, the robot segments, `ROOM_HELP_KEY`, `Crew.js`'s words) merged item by item, and three seams where git slid a shared closing `}` out of one side (`validate-content.js` twice, `rules.mjs`, `play-all.mjs`'s two robots sharing their middle lines) put back by hand; the stylesheet sections numbered 61 (ارسم اللي بتسمعه), 62 (المهمة السرية), 63 (الخزنة), 64 (دندنها). `npm run check`, `test:rules` (2,840 ✓, the leak check clean), `npm test` 3,725/0, `test:ui` 184/0, a look in the browser at 375x812 and 667x375; the first visit 694 KB of the 710 KB budget.
- **1 Oct 2026, دندنها's Apple songs on the live server**: `npm run test:live` found `/song` giving 0 bytes there - Apple's lookup answers 403 to Cloudflare (its audio files don't), so the Apple songs fell back to their Deezer pin or failed. Each Apple pin keeps its preview's address now (`u` in `Songs.js`, 209 written by `npm run check:songs -- --fix`), played directly by `rooms-worker/src/songs.js`; live, Apple songs stream (audio/mp4, about 1 MB each), and the hum, race and skull segments pass on the live server (486/0). A trap in GEMINI.md.
- **1 Oct 2026, the review of every game and its 56 bugs** (the owner: "look through every game from every angle"; then "fix all the 56"): nine read-only reviewers went through every game's spec, page, server and TV; the list, with the improvements still waiting on the owner, is `notes/review-2026-10-01.md`. Eight builders fixed the 56 confirmed bugs in parallel worktrees, merged on `review-fixes`. The ones that change what a table sees: the night's points come from each game's own places - لودو, السلم, بنك الحظ break level wins by this game's finish, كدّاب, الشايب and جمجمة bank this game's result (`ROOM_RESULT_BOARDS`, `NIGHT_FROM_RESULT`), «مين هيكسب؟» is settled on the game just played, and the room's night and برنامج السهرة share one function (`nightPlacesOf`), so a co-op game gives everyone 5 and a game cut short 1 each on both; الشلة's manager power belongs to keys, not to a member id (a claim gives a member key, «ضيف موبايلك التاني» pairs the manager's other phone), and `/pack/get` hides a quiz's answers without its edit key (`/pack/answer` reveals one on the team board); the daily's share picture no longer shows the answer and the dailies walk a shuffled order (no repeat until a list is used up, from 2 Oct); شطرنج's computer thinks in a Web Worker; أتوبيس كومبليت deals only letters every chosen category can answer; مافيا's night shows how many tapped, never who (`room._mafiaActed`); الجرس has «↶ رجّع» and a confirm on «تصفير»; عربيات التصادم needs a screen to start and survives a TV reload; and the rest per game in each `notes/games/<id>.md`. Rules, leak check, robots (3,772) and the screen test (184) pass.
- **1 Oct 2026, the review's improvements** (the owner: "apply the improvements - rules, content and cross-game gaps; leave the ideas for now"): eight builders, merged on `review-improvements`. Rules: الجاسوس rooms get a first asker, an optional discussion limit and the vote bars before the reveal (and الحرباء, الموقع السري); الفنان المزيف shows the word's category (every draw word filed in one of 18 categories); العقل caps at 12/10/8 levels by players and can be won; الجرس orders buzzes by when each phone was pressed (server time, clamped to 400 ms; replaces "arrival order"); المشنقة's writer is paid only when someone solved, capped at the top solver; خمّن مين's «غلطت»; الخزنة's time penalty grows 15/30/45 within a safe; المهمة السرية's missions have a girl's wording chosen on the doer's phone (هو/هي, never on the server) and a wrong «كشفتك!» gives the accused +1; الحقوا! costs ¼ for every third pointless move in a row; الشاهد's witness keeps quiet during the vote (24 crimes); the duels play the only move left for you (never a winning one) and a phone gone 60 s on its turn loses that game; شطرنج الأربعة speeds up computer-only games («⏩ خلّصها»), caps the first move at 45 s and has a magnifier; المخ والإيد's Brain can change a call within 3 s. Content: قبل ولا بعد 163 events (years may repeat), room trivia by category and its disputed facts fixed, المختلف 231 pairs, English proverbs 164 and emoji 232, ارسم اللي بتسمعه 34 drawings, Wordle's soft dictionary and a safe daily list (from 3 Oct), Connections' near-copies rewritten and checked, Pinpoint's decoys and icons, Sudoku graded by technique, Tango and Minesweeper solvable by logic, chess puzzles re-rated with motifs. Cross-game: every game in «الليلة دي؟» and in الشلة's titles (checked), «دورك!» for من أنا؟ and أونو's catch, 3D quality steps down on slow phones, two chance-failing tests seeded.
- **1 Oct 2026, the audit of the day's changes and its 17 fixes** (the owner: audit "from last audit", then "fix all the moderate and the minor"): a read-only audit of everything after `c41e7f1` (agy hunts and challenge passes, Opus sub-agents once agy's quota ran out, Claude on the trust boundary). Fixed: the turn order (`roomTurnStep`) skipped a player when two left at or before the pointer at once; أسماء الرموز's sides are an object, so a watcher on neither side was banked 2 night points (`nightPlayedIds`); المهمة السرية's «غيّرها» after a «لأ» made the hunter a sure catch, and a later «اسحبه» could undo a memo already seen (the file keeps `shown`); `/pack/answer` hands one answer per address every 6 s (`PackStore.answer`), so a script can't read a quiz's answers at once (the board waits its turn); the request brakes sweep at most once a minute and refuse new addresses past 20,000; دندنها lets its last clip go on leaving the room; a crew's `act('get')` counts as activity; a crew page drawn from the phone's copy shows no manager buttons until the server answers; Sudoku makes the next grid ahead only on the setup screen (not just after Start) and hard tries up to 160 times (no medium grid dealt as hard); the chess daily walks each level by that level's own days (no repeats until a level's bank is used up); المخ والإيد's computer Hand waits out the Brain's whole change window; شطرنج الأربعة's computer-only games play a few moves per pass of the room's clock (`burst`); حرب السفن's drafts answer only the dragging phone (`SELF_ACTIONS` in room.js); الوزير المستخبي's "pick for" from an older phone never picks the host's own pawn. Not undone: the chess puzzle bank made on 1 Oct changed the past days' daily puzzles (the old bank's picks are gone; the comment now says so).
- **2 Oct 2026, على نفس الموجة removed** (the owner: "we don't need it"): the room game Wavelength is gone everywhere - its card, its tile in a room's list, the TV screen, `JS_RoomWavelength.html`, the server's rules and «التالي لوحده» entry, `WAVELENGTH_PAIRS` (about 700 pairs) in `PartyContent.js`, its help, translations, icon, styles, its place in the program's round counts, الشلة's words title and `GameIds.js`, and its robot, rules and leak tests. A phone on an older copy that picks it is refused by the server («لعبة غير معروفة»).
- **2 Oct 2026, one list of games, and every room game in its own file** (the owner: after removing على نفس الموجة took 27 files, "do steps 1 and 2"). Step 1: `Games.js` holds `GAME_LIST`, one entry per game (the home card's fields, `room: { min, id, rounds, autoNext }`, `crew`, `open` as a function's name), shared by the page and the rooms server; `GAME_CATALOG`, `ROOM_HUB_GAMES`, `ROOM_GAME_IDS`, `APP_GAME_IDS` (`GameIds.js` is gone), `AUTONEXT_ROOM_GAMES`, `PROGRAM_ROUNDS` and `CREW_TITLE_GAMES` are built from it, and `lazy-split`, `make-og` (which now also deletes a removed game's picture), the screen test and `npm run check` read it. Checked against the old lists: the same games, fields, order and what each card opens. Step 2: the 25 older room games moved out of `RoomGames.js` (8,030 lines → about 2,000, the engine) into `RoomStop.js` … `RoomScrew.js`, every line accounted for. Also: the leak check's chess:hq robot no longer breaks by chance (a seated host picks their own hidden pawn).

- 2 Oct 2026: the offline copy no longer answers a CORS request for the Google Fonts stylesheet with the opaque copy it keeps for the page's own link (the owner's console: "an opaque response was used for a request whose type is not no-cors", the fonts failing). Live on both addresses.

- 2 Oct 2026: the owner picked the next round for السلم والتعبان (teams of 2, surprise squares and a moving map as switches, four themed maps, podium awards) and المشنقة (team against team, levels, the race's category, lifelines, step-by-step hints, a streak, random endings); every rule answered, in `notes/games/snakes.md` and `notes/games/hangman.md`. Design sheets next, then building.
- 2 Oct 2026: the owner picked look أ «على الكلاسيك» for all four السلم والتعبان themed maps (sheet in `notes/archive/shots/snakes-themes/`).
- 2 Oct 2026: the owner picked all 16 المشنقة endings, and look ج for السلم والتعبان's surprise squares («حاجة واقفة») and awards («لقطة»). Building next.
- 2 Oct 2026, المشنقة's next round built (the owner's answers in `notes/games/hangman.md`): levels (Easy 8, Normal 6, Hard 4; the man in more or fewer pieces) everywhere, the race's category (12 groups of the app's lists) and its length by level, the lifelines «اكشف حرف» and «شيل ٣ حروف غلط» (−3 each), up to 3 writer's hints opening on misses 2 and 4, the 🔥 streak (+2 a word in a row, up to +10), team against team in rooms (the host's split, a writer from one team, the other team's captain taps, team points to every member, `PROGRAM_TEAMS.hangman`), and all 16 endings ported from the sheet (`JS_HangmanEnd.html`), picked where the word is, never twice in a row; one phone's tally is points now. Tests in rules, leaks and play-all.
- 2 Oct 2026, **السلم والتعبان's third round built** (the owner's picks of the day): four themed maps, look أ «على الكلاسيك» (النيل, المترو, الصحرا, الحارة, each its own file and its own down and up moves; 🎲 picks one), the surprise squares (look ج «حاجة واقفة», a switch, off by default) and «الخريطة بتتحرك» (a switch, off by default: every 3 rounds a snake crawls to a new spot and eats whoever stands on its new head), teams in rooms (4 → 2 of 2; 6 → 3 of 2 or 2 of 3, arranged or «وزّع»; a member home rolls for the teammate furthest behind; places and the night by team), and up to three awards replayed as «لقطة» over the board; all decided on the server in the roll's event, everything optional on a game (the classic unchanged), on one phone too (teams aside), and on the TV. Also: the map's colours and curves were drawn differently by Safari and Chrome (a random comparator in sort), now a seeded shuffle. `notes/games/snakes.md`, *How the third round was built*.
- 2 Oct 2026: السلم والتعبان's two leftovers: the log names each map's own pieces (a crocodile, a slide, a cobra, a cat and its pipe), and a TV that isn't the host shows the teams in the lobby (`tvLobbyPlayers`, a hook for any room game).
- 2 Oct 2026: المشنقة's endings play as on the sheet: no longer stilled by the device's reduced motion (only by the app's الحركة → مقفولة), always the whole man, and drawn bigger.
- 2 Oct 2026: السلم والتعبان's moves no longer stand still under the device's reduced motion (only under the app's الحركة → مقفولة); الحارة's cats in the top row and on 81 sit low at their funnel; المشنقة's lifeline icons go on a narrow phone so «شيل ٣ حروف غلط» fits one line.
- 2 Oct 2026: خيوط «من كلماتنا» (the family's words as the words to find, «الخيط الملوّن», the top-up marked «من عندنا», a pack by its code) and خمّن الدولة's third way «جولة حول العالم» (a flag and four names, three hearts, tiers 1-2-3 every 10 flags, the best run kept; `JS_FlagsTour.html`). Their words live in their chunks (`STRANDS_TEXT`, `FLT_TEXT`); the shell is at 710.16 KB of 710. `notes/games/solo.md`.
- 2 Oct 2026: خمّن الدولة's small map (idea 450, look ج): a drawn world under the guesses on one phone, the daily, a solver's phone in a room and the TV - each guess a pin coloured in five steps by distance and a callout (flag, name, km, arrow, %) joined by a dotted line, laid out so none overlaps at any width; the answer's continent glows with «🌍 في …» from the continent hint's turn; the gold pin drops with rings at the end; the TV shows everyone's wrong guesses with their first letter (`progress.pins`, never the right one; leak probe). `JS_FlagsMap.html` (its own chunk, with its CSS: the shell stays at 709.8 KB). notes/games/solo.md.

- **2 Oct 2026 - improve-game for every game but السلم والتعبان and المشنقة**: 458 ideas for 79 games on one page (https://claude.ai/artifact/7Mhgw1ePSi3GhgEvDcSHxz); the owner picked 17 (57, 228, 241, 248, 254, 268, 350, 361, 366, 391, 393, 415, 420, 444, 450, 451, 454) and answered every rule - written into hear, witness, guesswho, chairs, bumper, uno, duels, battleship, solo, race and a new reaction.md; nothing built yet.
- 2 Oct 2026: السلم والتعبان's moving map: a snake (crocodile, cobra) crawls on one path to behind its new tail and up its new curve, the whole body following the head - no more morphing into place after the head arrives.
- 2 Oct 2026: الكراسي الموسيقية «الدي جي» (idea 248): a lobby switch «دي جي من اللي خرج», off by default; from round 2 the latest one out stops the music (and fakes it, with the fake stops on) from their phone, not in the first 4 s, the server stopping it at 25 s or taking the round over when the DJ goes; «أحلى دي جي» at the end; rules, leak and robot tests (`chairs-dj`); the DJ's words live in the chunk (`MCH_DJ_TEXT`), the shell at 710 KB (notes/games/chairs.md).
- 2 Oct 2026: ارسم اللي بتسمعه (idea 57): +1 to every drawing at 50% or more and «اتحسنت» +1 for beating your own last %, stacking, as red-pen tags on the marked pages (phone and TV) with the +N counting up (`hearGrade`, `shared.lastPct`, `hrExtrasHtml`). الشاهد (idea 228): «الرسم مطابق 93%» - the server measures the sketch against the real face feature by feature (`witnessMatch`, `shared.match`), the ticks and the % counting up beside the two faces, +1 each to the witness and the artist at 70% or more. Every `wit_*` text moved into الشاهد's chunk (`WIT_TEXT`): the shell 707 KB.
- 2 Oct 2026: حرب السفن's «الرادار» (idea 366): once a game each side sweeps a 3x3 instead of firing and learns how many ship squares are in it (the count only on the sweeper's phone and the TV, a leak probe for it), on one phone against the computer (which sweeps too) and in rooms, a lobby / setup switch on by default, a turning beam on the 3D and flat seas; the game's words moved from the shell's TRANSLATIONS into its chunk (BS_TEXT) to stay inside the 710 KB budget. 2048's board sizes (idea 420): 3x3 to 256, 4x4 to 2048, 5x5 to 4096, a best each, the size remembered, a reload on the same board.
- 2 Oct 2026: رد الفعل: «خدعة» (one round in three a fake - yellow, 🐱, «استنى!» - before the green; a tap on it loses the round; a switch on by default, the setup's and the room lobby's) and «أسرع إيد», the reaction test as a room game inside its card (every phone and the TV green at one server moment, taps fair by the server's time as the chairs, 5 rounds of 3/2/1, ✖ for a tap before the green, the podium and the night's points); the one-phone halves on tokens. RoomReaction.js, JS_RoomReaction.html (its own chunk, with the game's words RX_TEXT and its styles RX_CSS: the shell was full). notes/games/reaction.md.
- 2 Oct 2026: **أونو اتنين اتنين built** (idea 268): a lobby switch, off by default; everyone picks a team of exactly two (a computer player fills a seat beside someone alone), partners sit opposite, the first partner out wins for both and the pair scores only the other teams' cards, no Skip/+2/+4 onto your partner (greyed on the phone; with every card refused it draws), your partner's count above your hand and three signals everyone sees (a colour, «الحقني», «سيبه ليا») on the seat and the TV; bots play for the pair. New page hook: a room game's `lobbyTop` (JS_Room.html). `notes/games/uno.md`, *How it is built*.
- 2 Oct 2026: كونكت ٤ team against team «أحمر ضد أصفر» (idea 350): the host's lobby switch «فرق» from 4 people, everyone picks a side on their phone, a relay of the team's members with 20 s a turn on the server's clock (the app drops a disc that doesn't hand the other team a win, and says so), the teams' podium and the night by team (5 / 3); `c4tAction` in RoomDuels.js, the page at the end of JS_RoomConnect4.html - notes/games/duels.md.
- 2 Oct 2026: سباق ألغاز's «خماسي السهرة» (idea 454): a lobby choice where every round is a different puzzle - the line-up (3 or 5 of the ten) drawn on the server, shown to every phone and the TV, the host's tap swaps one; each round a race of its own puzzle on its own clock and screen, the totals make the podium; the next puzzle spins in between rounds. The race's own words moved into its chunk to keep the shell at 710 KB (notes/games/race.md).
- 2 Oct 2026: خمّن مين «فريق ضد فريق» (idea 241): a lobby switch from 4 people (off by default), sides picked on each phone, one secret face and one shared board a team, anyone on the team asks, flips and answers (first tap counts), the final guess proposed by one and agreed («متفقين», 20 s) by a second; the TV shows both teams; the winning team shares first place. Rules, leak probes, a robot round, built on a branch (not live yet).
- 2 Oct 2026: «إكس أو الكبير» (idea 361) built: «المقاس: عادي / كبير» everywhere X-O is - one phone (a friend, the phone easy and hard), rooms in winner stays and the tournament, the TV - nine boards in one, the square played sends the other side, three boards in a row or the most boards win; the look «تسع كروت» (look أ); the rules in TicTacToe.js, the board in JS_XO.html; X-O's chunk-only lines moved out of TRANSLATIONS (XO_TR) for the shell's budget (notes/games/duels.md).
- 2 Oct 2026: عربيات التصادم gets its fourth way, «كورة التصادم» (idea 254, look أ «بث مباشر»): red against blue with a big ball, sides picked on the phones, a computer player only on an empty side, the server keeping the score from the TV's goals, the clock (2 / 3 / 5 minutes) and a golden goal of a minute at most; the pitch in 3D and flat, the score bug, «جوووول!» across the TV and on the phones, 3-2-1 after a goal; its words and styles in its own chunk (the shell at 710 KB). `notes/games/bumper.md`.
- 2 Oct 2026: four fixes before the release: خمّن الدولة in rooms sends no pins (nor the closest %) to anyone until the round is over - the TV shows only how many guesses each has made, then every pin drops onto its map together (rules, leak probe, robots, help); الكراسي الموسيقية's TV fits 1920x1080 and 1280x720 with 5-8 people (the ring sized to the stage, the end's places in the TV's units in two columns, the wins left to the strip); «إكس أو الكبير»'s small live boards in the TV tournament readable (square cells, marks, a bigger box); خمّن مين's team pills wrap their members on a 375px phone.
- 3 Oct 2026: the deep clean-up (the owner: "beautify the codebase, peak maintenance"), no behaviour changed: `JS_Core.html` (18,221 lines) split into the core (3,568), `JS_Translations.html` and `JS_GameRules.html`; `Style.html` (26,677) into itself (sections 1-8) and 13 ordered parts, `Style_Screens.html` … `Style_Talk.html` - an unminified build is the same text, the CSS re-minified as one sheet byte-identical, every game chunk the same hash. `check:i18n` now follows each `t` to its binding and knows keys built from parts: 662 "unused" and 20 false "t.x" warnings became 7 really dead keys, removed. 39 top-level names nothing reads (the old random picker, the old 2D/3D toggle, showCustomAlert…) and 4 CSS rules a later identical copy overrode, removed. `notes/`: the old runbooks, phase reports, look sheets and screenshots moved to `notes/archive/`, every link followed.
- 3 Oct 2026: two checks that failed by chance made steady (tests only, no deploy): `rules.mjs`'s خمّن الدولة map check read the closest guess from a copy of the board taken after three guesses (a move replaces the board), so it failed whenever the fourth or fifth came closer to the country dealt - about one deal in three; it reads the board at the end now (1,000 deals pass). `leaks.mjs`'s robots carry their seat number in their names (`نور 1` … `Sam 8`), so a name can't be a word a game deals: a word wheel's solutions come from every bank, the Stop names included, and هنا once read as a leaked solution. `leaks.mjs solve`, `flags` and `wordwheel` passed 30 runs each.
- 3 Oct 2026: السلم والتعبان and المشنقة polished from the owner's two before/after sheets (all applied): المشنقة's board fits a phone (misses as dots, a smaller man while guessing, hints on one line), sideways the result takes the keys' column, plain hint pills, the bought letter marked, the TV's cards centred and its result readable, "look away" a banner, every player's misses as dots on the rows and results; the endings' leftovers fade, the six leaving endings keep a trace and a swinging cut rope, the last frame breathes, 🔁 replays, the family stays in the drawing. السلم والتعبان: «أنت» under your piece and a disc for whose turn, one row of players, a folded room lobby, «كمّل اللعبة» on top, the mat folds away, a big roll, the TV's last roll as a big die, the marked squares explained, map tiles drawn from their boards. `Hangman.js`'s `board.lr` is the bought letter (rooms deployed).
- 3 Oct 2026: المشنقة's three losses that didn't read as losing (العربية الكارو, المشنقة اتكسرت, اللقلق خطفه) replaced in their slots by سحابة على راسه, طماطم من الجمهور and الأرض بلعته (client only).
- 3 Oct 2026: the whole-app UI pass (the owner: "UI / UX improvements for the whole app"; fixes now, ideas to pick). Every screen and every game started from its Start was swept at 375x667, 667x375, 1280x720 and 1920x1080, Arabic light and English dark (contrast on the composited ground, taps, text under 11px, overflow, overlaps, the space check). Fixed (section 67 of `Style_Talk.html`): a setup's Start sat half under the bar on a 667px phone (*Traps*: a sticky bar can't rise above its box) - the mode panels are `display: contents`; every stuck action bar clears the raised «افتح غرفة» (دوري المعرفة's «الجولة التالية», the puzzles' «خروج»), and a bar holding only «خروج» ends the page instead of sticking over كاسحة الألغام's row; لودو's «ارمي» gets its own line on a phone on its side; the solo stats' labels 5:1; the cards' 👥 badge and `.segmented__sub` at 11px; ربع قرد's swap list through the translations and tokens (`swap_none`). Eleven ideas on a page for the owner to pick (shorter setup header on short phones, one way to the rules, «افتح غرفة» twice on مع بعض, the raised button stepping down mid-game, تحدي اليوم's list first, the first visit's button on one line, دوري المعرفة's heads, settings showing their choices, big-screen first visit, the chess board sideways, cell names for VoiceOver). Not live in rooms (client only).
- 3 Oct 2026, later: six of the owner's UI picks built (ideas 2-6 and 9 of the pass; 1, 7, 8, 10 wait on a look sheet, https://claude.ai/artifact/TybGWnUVHhgWeitq1jPtWC). 2: the setup hero's «القوانين» button is gone (its `hero_rules` key and styles too) - the «أول مرة؟» drawer is the way to the rules there, Help 📘 after it. 3: on مع بعض the raised centre button is «ادخل غرفة» 🔑 (`syncNavRoom` in `JS_Core.html`, run by `setView` and the reload). 4: on one-phone play screens (`play-*`, `reveal-*`, `input-*`, `imposter-reveal`, `results-teams`) it lowers into an ordinary tab, as in a room game (`body.in-play`), and the page's foot loses the room it kept for it. 5: تحدي اليوم draws the day's progress and list first, the streak, archive and أرقامي after; «شارك» only once every puzzle is done. 6: the first visit's button is «كل واحد بموبايله» / "Our own phones" on one line (nowrap, sized to the screen). 9: from 1280px wide the first visit opens «كل الألعاب» by itself (`homeAllOpen` starts null).
- 3 Oct 2026, later still: the owner's three looks from the sheet, built. 1C: a setup's header on a portrait phone under 700px tall has its art band at half height (6rem; the options about 80px higher). 7A: دوري المعرفة's column heads are a bigger icon and a short name on one line (`short: { ar, en }` on the long categories of `TRIVIA_BOARD_BANK`, read by `tbColHead`; the question card keeps the full name, the head's title too). 10C: chess and the chess puzzles on a phone on its side: 2D/3D, ⚙ and ✏️ in a column beside the board, شطرنج's names column 10rem, and the bar's buttons as icons in one row (`.ch-btn-label` hidden there; `chIconLabel` keeps the words as aria-label and title) - the board 245px → 291px on 667x375. Idea 8 (settings) was not picked.
- 3 Oct 2026, the redesign: the owner's four looks from the redesign sheet (https://claude.ai/artifact/2FXyHZRr4fiMMeEvbi3iwP), built (client only). 1B: the room lobby puts the people first - the player list moved up under the code (it sat 4,459px down a phone), and the host gets two tabs, «👥 اللاعبين (n)» and «🎮 اختار لعبة», which becomes «اللعبة: …» once a game is picked and the lobby turns to it by itself (`roomLobbyTabsSync`, `roomLobbyTab` in JS_Room.html; `#view-room-lobby[data-tab]`); a room opens on the people, with «اختار لعبة» under them; everyone else gets no tabs. 2A: a TV that isn't the host draws the lobby as a stage (`tv-lobby--stage`): «يلا نلعب!», the code in four colours beside the QR, everyone as a big face along the foot (a colour each, `tvFaceAccent`), a new face dropping in with a bounce and a glow and a soft `playSound('pop')` (not on the first draw); every TV lobby is always dark (`.tv-showtime`, sharing مافيا's night tokens); the strip goes there (the faces are it). 3A: the home's sections are shelves on every screen, phones too (a phone's home 5,372px → 2,823px; «الكل» opens one). 4A: opening a game from a poster or a first-visit card, the card grows into the setup's art band (`catalogCardGrow` in JS_Motion.html) under the icon's flight.
- 3 Oct 2026, sheet three and the sections: the owner's looks 1A, 2A, 3A, 4B (https://claude.ai/artifact/2V7KTKB4MiGj9uTE7r1XYR, my pick marked on each). 1A: while a game is played - one phone (`body.in-play`: play-/reveal-/input- screens and imposter-reveal, not the tools' screens) or a room game (`body.in-room-game`) - the app's bar is gone, its rail column too on a laptop; the header's back arrow is the way out. 2A: the join screen's code is four boxes (`.code-boxes`, the real field see-through over them, `paintJoinBoxes`); with the name known the fourth letter joins by itself; «ارجع للغرفة» offers the last room for 6 hours (`ashryLastRoom_v1`, `rememberLastRoom` in routeRoomState). 3A: الجاسوس, الحرباء and الموقع السري show everyone's face under the card while the phone goes round (`paintPassFaces`, JS_Motion.html section 15). 4B: the tools tab is app icons, three a row. And the home's sections, reviewed with the owner: العقل (from خداع وتخمين) and اختبار السرعة (from لاتنين على موبايل) to حفلة وضحك; أتوبيس كومبليت and على راسك (from حفلة وضحك) to كلمات ورسم وتمثيل; خمّن الرقم to the puzzles, renamed «ألغاز ومخ» → «ألغاز لوحدك» ("Solo puzzles"); chess's ways (شطرنج الأربعة, بالتصويت, المخ والإيد, باغ هاوس, ألغاز شطرنج) filed under the chess card's section. Games.js changed: rooms deployed.
- 3 Oct 2026, opening a game made smoother (the owner: "make it smooth and premium"): a poster tapped on the home (`catalogOpen(id, el, true)` from the card's own onclick) now morphs into the setup's art band through a view transition (`catalogGrowOpen`, JS_Motion.html): the card stays solid with a soft shadow as it reshapes (540ms, a soft landing), the icon takes its own path with a small settle (580ms), the home sinks back and fades under it and the setup fades in after; the header and the bar stay still. The screen's own slide and the hero's rise are held for it (the panel under the hero still rises). Browsers without view transitions (iOS before 18) keep the box and the icon's flight; with motion off the screen just changes; callers that read the screen straight after opening (الليلة دي؟, the first visit's quick start) keep the old way, since a view transition changes the screen a frame later. Checked: npm run check, test:ui ONLY=screens (44 passed), the morph frame by frame on a phone and a laptop.
- 3 Oct 2026, the way back too (the owner: "the same smooth animation when going back"): from a game's setup, the header's arrow and the bar's tabs (goBack, navGo) go through `catalogShrinkBack` (JS_Motion.html): the art band shrinks back into the card it was opened from - the poster, the recent tile or the first visit's card, wherever it is on screen - the icon gliding home with it, the game's screen fading at once and the home coming forward from where it sank; the header and the bar stay still, and the home's own rise leaves the card alone while it lands. heroHomeFlight stands aside while it runs. The phone's back swipe keeps Safari's own slide. Checked: npm run check, test:ui ONLY=screens (44 passed), the way back frame by frame, from a poster, a recent tile and the home tab.
- 3 Oct 2026, the room's game picker morphs too (the owner): the host's tap on a poster (`roomPickGame`) grows it into the chosen game's card, and «تغيير» (`roomChangeGame`) shrinks the card back into its poster when it is on screen (`roomPickMorph`, JS_Room.html). The pick is a round trip, so the view transition's update waits for the server and for the lobby to draw (a moment at most) while the old picture holds; scrollToAction jumps instead of gliding meanwhile. The lobby cross-fades at one speed with the plus-lighter blend set by hand (replacing the browser's own fade drops it), so the code, the tabs and the mission card stay perfectly still. Room posters carry `data-game`. Checked: npm run check, test:ui ONLY=rooms (82 passed), both directions frame by frame.

- 4 Oct 2026 - السلم والتعبان: every map has its own sounds (`SNK_THEME_SOUNDS`): crocodile snaps and splashes on النيل, a cobra on الصحرا, slides and escalators on المترو, a cat and pipes on الحارة.
- 4 Oct 2026 - شطرنج, the coach and the review: false blunders (the owner). A move that looks worse than the engine's (or lets a mate in, or slips one) is now scored beside it in one search to one depth (`chessCompareMoves`, twice the analysis' nodes) instead of comparing two separate searches, the later of which saw a move further. Over 251 doubtful moves against a search forty times as deep, verdicts two steps off went from 42 to 16. Old kept reviews are worked out again (`CHESS_REVIEW_V`). Checked: npm run check, test:rules (two new checks), test:changed, the review in the browser.
- 4 Oct 2026 - شطرنج: the coach and the review on Stockfish 19 (the owner). Stockfish.js 19 lite single-threaded (1.8 MB, GPLv3, `vendor/stockfish/`, copied into `g/` and kept offline with the chunks) runs in a Web Worker (`JS_ChessStockfish.html`): the warning, the comment, the hint, the best-move arrows and the review ask it (depth 12-17 instead of 4-5); the computer opponent, الوزير المستخبي and Chess960 keep the app's own engine, which is also the fallback when Stockfish can't run. Reviews by the app's engine are redone with Stockfish. Checked: npm run check, test:rules, test:changed, test:ui ONLY=site, in the browser (a blunder warned, take back, a best move, the hint, the arrows, a 50-move review in 1.4 s, the fallback, the label at 375, 667 and 1280 wide, Arabic and English).
- 4 Oct 2026 - شطرنج, five more (the owner's picks): Stockfish plays from 1700 (الأستاذ, الجنرال), held to the rating; known opening moves are «من الافتتاح» (book), not graded; the review's «🎬 ليه؟» plays out the line that punishes a mistake; puzzles from mistakes are judged by Stockfish's list of good moves; the review's two names stack on a phone on its side. Checked: npm run check, test:rules (two new checks), test:changed, in the browser (a book Italian, Qxb7?? and its line played out, the puzzle taking a Stockfish alternative and refusing the game's move, الأستاذ answering through Stockfish, the names at 667x375).
- 4 Oct 2026 - شطرنج: الكابتن (1400) on Stockfish too, and Chess960 on Stockfish (coach, review, arrows, the computer from 1400; UCI_Chess960 per question, checked against our rules over ten 960 games). Checked: npm run check, test:changed, in the browser (a 960 game against الكابتن with the coach: 9 of 9 moves by Stockfish, its castling, every coach look by Stockfish; the 960 review).
- 4 Oct 2026 - شطرنج, the board UI pass: two defects fixed on a phone on its side (the 3D board under the button column; ⏮ off the screen); the owner ticked all nine ideas on the ideas page and answered the layout's reach (every chess board) and the piece-set sheet (three feels). Checked: npm run check, test:changed (rules, robots, screens, site).
- 4 Oct 2026 - شطرنج, the board UI pass built (the owner's looks 1A, 2B, 5A, 6A, 8C): on an upright phone every chess board is board first (slim player bars, full-width board, the moves as one line, one bar of buttons with ⚙ holding the board's own buttons), the wins count only once someone has won, a steeper and closer 3D camera on phones, bigger square names, the app bar out of the way on a sideways phone, and a wood piece set.
- 4 Oct 2026 - the whole-app UI pass, again (the owner: /ux-pass): every screen (131) and every game started from its Start (61) swept at 375x667, 667x375, 1280x720 and 1920x1080 in Arabic dark and English light (3 Oct did Arabic light and English dark), plus a scan for Arabic text left in the English look. Fixed (client only): الشلة's face colours a shade darker so the white initial reads 4.5:1 or more (`.crew-av--c1`…`c5`, Style_Night.html), and the sample card's initials M K T S in English (JS_Crew.html); «كلماتنا»'s line in «اعمل مسابقتك» wraps instead of ending in "…"; the quiz-code and الشلة code fields' hints are a normal sentence (`::placeholder` without the capitals and spacing - "THE CODE (6 LETTE" was cut); بولينج's frame numbers 9px → 11px; كلمات من حروف's ⌫ and ✓ have names (`wheel_erase`, `wheel_submit`). Dropped as the checker's blind spots: boards drawn to scale (chess square names, بنك الحظ squares, Arabic Wordle keys, لودو's unmovable pieces - movable ones already tap 2.4x their size), stacked card faces, puzzle cells without names (the owner left VoiceOver names for later on 3 Oct). Two ideas on a page for the owner (https://claude.ai/artifact/PQW5GTJnbHmBJnWLnmabXq): one way out of a one-phone game (21 of 36 draw «خروج», 15 don't) and المشنقة's writer screen showing the word field. Checked: npm run check, test:rules, test:ui ONLY=screens (44 passed), the fixes rendered at 375x667.
- 4 Oct 2026 - «خروج» on every one-phone game (the owner's idea 1 of the UI pass, three rules answered; notes/decisions.md): `playExit` routes the 30-odd existing buttons (a final card's button stays direct), the shared row gives the eleven without one theirs, at the foot of the screen. Checked: npm run check, test:rules, test:ui ONLY=screens,fixes (61 passed); every game started at 375x667, 667x375 and 1280x720 - one «خروج» each, the sheet mid-game, leaving at once once over (ويردل, إكس أو, سودوكو).
- 5 Oct 2026 - the structure (the owner: "apply all except 3 and 7" of the review of the app's structure): every source file in a folder - `app/` the shell, `styles/`, `rooms/` the room engine, `content/` the shared word lists, `games/<id>/` one folder per game (95 of them) - each keeping its unique name, found by `tools/sources.cjs` (the built site and the rooms bundle came out byte for byte the same); `JS_NewGames.html` split into its three games (`JS_Teams`, `JS_JustOne`, `JS_Reaction`). `npm run check:names` (in `npm run check`): a name declared twice in the page or the server's bundle, or used and never declared, fails - its first run found the Connections daily throwing at its start (`rnd` lost to `soloDailyCycle`), fixed. One copy of what both sides run: `app/Common.js` (the fold, is-the-game-over) in the shell, `rooms/RoomShared.js` (trivia's counts, Codenames' clocks, the buzzer's settle, the duels' away time, the lobby's seats) a chunk, `games/duels/Duels.js` (who sits next), `chess4OrderOf` in `Chess4.js` - eleven phone copies "kept in step" gone. Each game's own words and rules in `games/<id>/<id>.text.js` (3,738 of 5,249 keys, 186 of 210 rules), put back into `TRANSLATIONS` / `GAME_RULES` at each game's `@game-text` marker by `tools/game-text.cjs` (every string the same, compared one by one; at the end of the blocks instead, the shell was 6 KB heavier). `npm run new:game` makes a game's folder and its line in every list with a small working game (checked on a throwaway game: check, test:rules and the leak check, its robots, the screen test's screens and rooms, played and reloaded in the preview); room games register `ROOM_RULES.<id>`, one-phone games `VIEW_RESTORE`. Not done, on purpose: the `.html` scripts to `.js` (step 3) and per-game CSS with `@layer` (step 7). The shell is 719.8 KB of its 720: the next game asks the owner to raise it.
- 5 Oct 2026, the audit after the structure (the owner: "make sure all games and all parts work"): three reviewers (the runtime code, the tools, the whole diff against 4dd11ab), each finding checked before acting; old against new on 270,000 random inputs for every function made one (the fold, the seats, the duels' line, is-the-game-over): all the same; the built page and the rooms bundle compared file by file with 4dd11ab's: only the intended changes; every word and rule the same; on the live site all 72 chunks load and register. Fixed: a game's `.text.js` ran only the screens in test:changed (now its robots and room screens, as JS_Translations.html once ran everything), new:game's test:changed entry came after the general ones, stale comments. Known, not changed: check:names lets a name through when `typeof NAME` appears anywhere in its file; four optional hooks (`toArabicDigits`, `chPzSolvedAfter`, `chPzModeTag`, `chPzFailedMode`) are guarded and never defined, as before.
- 6 Oct 2026 - الليزر, a new room game (the owner's idea from a Roblox clip; every rule answered one at a time, look أ «الحلبة من فوق» picked from a sheet of three, `notes/games/laser.md`): hide and aim on your own phone, all appear and fire at once, beams through everyone in their line, the hexagon shrinks each round, a tie plays on among the tied, teams of 2-4 with no friendly fire, from 3 players. The shell's budget raised to 730 KB by the owner. Checks, rules and leaks, 4108 robot checks and 186 screen checks pass.
- 6 Oct 2026 - the dark room's robots: `npm run test:live` failed once on 'darkroom: level 2 is bigger' - `mapOf()` reads the TV's map, and over the internet the TV could still hold level 1's when the guides already had level 2's. The test now waits for the TV's level-2 map first (a check that can fail by chance waits for its case). Checked: --only=darkroom locally and three times live (44 passed each), npm run check.
- 6 Oct 2026 - الليزر round two answered, not built (`notes/games/laser.md`): the owner took all 22 ideas - ghosts and their mines, the shield, bouncing, hearts, blocking, pickups, pillars, random maps, falling pieces, sudden death, shorter hiding, faster quiet reveals, hits and four awards, who shot whom, fine aim, teams seeing teammates, presets in the lobby.
- 6 Oct 2026 - الليزر round two built and live (`notes/games/laser.md`): presets and «خيارات أكتر», hearts, the shield, ghosts and their mines (and the swap), bouncing and blocking beams, sudden death, the hiding time a second shorter each round, the short quiet reveal, hits as the tie-break and four awards, who hit whom on the TV, «ضربك:», ⟲ ⟳ fine aim, the last five seconds' beeps, teams seeing teammates. Pickups, pillars, maps, falling pieces and the best shot's replay wait for a design sheet.
- 6 Oct 2026 - الليزر, the sheet's picks built and live (`notes/games/laser.md`): four maps drawn in at the start (the donut's hole stops lasers), pickups and pillars (look أ «كبسولات نيون»), the falling floor with redrawn cracks, the best shot replayed slowly before the podium, and all 14 UI/UX ideas.
- 6 Oct 2026 - the audit of the changes since 1 Oct (235cca3..b961433; read-only, 63 points re-traced) and its fixes, not released yet (branch `fix/audit-b961433`): the lobby's game panel drawn once (أونو's teams, the race's line-up, the TV); «📘 القوانين» in the «تخرج من اللعبة؟» sheet (Help had no door while a game is played); the motion setting reaches the styles a game chunk adds (الليزر's verdict, the bumper's goal banner showed nothing under «مقفولة»); الليزر - the TV's radar no longer restarts on every aim, pickup holders on the phones, no spot inside a pillar, the floor's tiles reach the wall, a beam's end is round, «🔀» deals who is here, last round's beams only to whom they hit, no pickup under a spot, non-finite numbers refused, the replay and confetti once; أونو اتنين اتنين's play again needs two whole pairs, a stack never lands on the stacker's partner; السلم والتعبان - a team whose people all left never wins, the peel's landing square kept clear, naps on a leave's turn, awards pass on, a new game starts clean, the replay stops with the board, the map's loops keep running, the board follows the language; المشنقة's hold keeps the writer's word and early finishers' boards, the captain's «دورك!»; «خماسي السهرة»'s board after the menu, switched-off puzzles; الشاهد's double weights applied; «كورة التصادم»'s losers bank second place; Chess960 on Stockfish castles right and never freezes, old iPhones skip Stockfish, a taken-back move's verdict dropped; خمّن مين, إكس أو الكبير, 2048's sizes (the board's own), the dailies, the flags tour, خيوط's spelling, the four-box code's Arabic digits; check:i18n reads GAME_RULES, new:game refuses chunk names and unknown groups, test:changed and check:css-vars see more. Checked: npm run check, test:rules, leaks, every robot, the screen test (186/186), a browser look.
- 6 Oct 2026 - الليزر's animations pass (the owner: apply all 16, no sheet; `notes/games/laser.md`): beams shoot out and spark, a shatter into hexagons, beam-down at the reveal, the charge ring, the TV's lean-in on the hits, the shield bubble that cracks, bounce flashes, the ring falling tile by tile, sudden death in red with a slam, the round's slam on the TV, the floor's shimmer, ghosts drifting on the TV, the aim's running dashes and breathing, held pickups circling, visors, the winner's wave before the replay.

- 7 Oct 2026 - the app's own UI pass (notes/ideas.md): two fixes - «افتح غرفة» while in a room asks before leaving it (it used to strand the table), the TV bar's game name wraps on an upright phone - and seven ideas waiting on the owner. Checked: npm run check, the sweep before and after, the confirm in the browser. Not released yet (the audit fixes are uncommitted in the same tree).
- 7 Oct 2026 - the full-app audit (read-only at 4c32a0f, Claude-only: 26 reviewers, 13 re-tracers, 111 points; checklist https://claude.ai/artifact/8UXHBLEE6rEiXbo1hZ8jpB) and its fixes, the owner: apply all (106 points; T2, N4, F4, V4, V5 left as the owner's). The night's points in many games (leavers, latecomers, winner stays counts everyone who sat, سكرو / الدومينو / شطرنج الأربعة teams place the losing side 2nd, a game left mid-round or restarted still banks), staged reveals hold the scoreboard, «الحركة: مقفولة» after the stylesheets, Chess960's castles from the app's engine and in the review, golf's settle and gentle putt, الليزر's mates and fallen floor, the program (stand-ins between games, the buzzer quiz, a removed game), the TV host's lobby, the move and join limits (500 moves / 5 s a phone, 600 joins / 10 min), the prompt memory capped at 3000 lists, reloads (كلمة واحدة, the relay's handover, ربع قرد's clock), take-backs (ثلاث جولات's last card), and the checks (test:changed follows the chunk graph, lazy-split checks shell and popup calls, check:live and the fingerprint cover the build tools). Checked: npm run check, test:rules and the leak check, npm test 4108, test:ui 186, the browser.
- 7 Oct 2026 - «انقل لموبايل تاني» and keeping the data (the owner's picks A1 and A2; `notes/move-data.md`): Settings → a dialog that sends everything the phone keeps (names and groups, crews and quiz codes with their keys, the dailies and bests, chess games, nights, the dealt lists, settings) to the rooms server under a 6-letter code kept 24 hours and readable more than once (`POST /move/put|get|drop`, `MoveStore`, migration v7, 1 MB cap after measuring a heavy phone at 822 KB, 12 sends / 60 reads per address in 10 minutes), and merges it on the new phone by per-key rules (`moveMerge` in the shared `app/MoveData.js`, tested in test:rules; robots' segment `move`); `navigator.storage.persist()` asked once when something worth keeping is first saved (`keepDataAsk`). Not deployed.
- 7 Oct 2026 - GitHub does three things for the owner (E2, E1, D2; `notes/tests-docs.md`, *On GitHub*). Every push to master and every pull request: the robots (`npm test`) and the screen test (`npm run test:ui`, two jobs) join the checks in `checks.yml`, each on its own runner against a rooms server started there (`.github/actions/rooms-server`: `wrangler dev`, local, no login), with the runner's Chrome (`CHROME_ARGS=--no-sandbox` - new in `test-ui.mjs`), Noto Arabic and emoji fonts, and the output, the server's log and a screenshot at every failed screen check (`UI_SHOTS`, new) kept as artifacts. Mondays, `weekly-check.yml`: `test:live`, `check:live` (on GitHub it compares commit times, not file times), `check:songs -- --play` and the week's new errors from phones (`errors.mjs --json`, new) → `tools/weekly-report.mjs` → the issue labelled `weekly-check` opened or commented on, or closed when all is well (`tools/ci-issue.mjs`, the workflow's own token, `DRY_RUN=1`). The 1st of the month, `monthly-plays.yml`: «What was played in YYYY-MM» from `plays.mjs --markdown` (new, with `--json` and `--input=`), labelled `monthly-plays`. The owner adds the repository secret `ASHRY_ADMIN_KEY` once. Checked on the PC the workflows' way: actionlint clean; the robots against a local server (4018 passed, 4 failed under the PC's load - snakes' roll timing and سكرو's draw refused by the move limit, both passing alone: 173/173); the screen test with the CI flags 186/186; a forced failure saved its screenshot; `wrangler dev` answered with no Cloudflare config reachable; `test:live` once (4091 passed, 1 failed: أونو's "a draw waiting was stacked or taken" over the internet), its log, the real `check:live` and `check:songs -- --play` (237 of 237 play) fed to the report, and the issue writer dry-run on those and on stub logs; the plays report on a stub list.
- 7 Oct 2026, later - the coordinator's follow-up: on GitHub a failed robot segment or screen-test shard runs once more, alone, and only a second failure fails the job (`play-all.mjs --retry`, `--failed-out=file` for the JSON; `test-ui-parallel.mjs --retry`); the ones that needed it are named in the output, on the job's page and in the weekly report. Checked with throwaway copies: a segment and a shard made to fail once were named and passed; one made to fail always failed the run; actionlint clean.
- 7 Oct 2026 - each game's screens and styles travel with its code (the owner's B1 and B2; notes/lazy-load.md): the build moves 176 screens and 16 popups out of the page into their chunks (a comment keeps each one's place; lzMarkup, adoptMarkup) and the stylesheet rules tools/css-split.mjs proves are one game's alone (1,534 rules, 52 keyframes); the page 726 -> 680 KB gzipped, the home 5,191 -> 2,817 elements. tools/compare-styles.mjs compares two builds element by element (every screen, both sizes, both looks, the motion setting, every room game on twin phones and a TV). Not released (branch of its own).

- 7 Oct 2026 - GEMINI.md made smaller (the owner's pick G1): the 114 traps moved word for word to notes/traps.md, one line each left under *Traps*; 152 KB to 97 KB.

- 7 Oct 2026 - improve-game, round two (the owner: "look at each game and look for improvements … also UI/UX in the games and every part of it"): 829 new ideas (numbered 501-1329, none repeating the 458 of 2 Oct) on one page, https://claude.ai/artifact/XCDiKpG1wRH6We9HXXFc2Z, the list kept in `notes/archive/plans/ideas-2026-10-07.json`. The owner picked 54 and answered every rule; each was re-checked against the code after the other session's day of work, then built by seven builders in worktrees, each game's section "The ideas of 7 Oct 2026 (the owner's picks): built" in its notes file: الجاسوس (a catch pays only who voted the spy, «أنا الجاسوس», «مين يسأل مين؟» in rooms), الحرباء (boards shuffled, «الإعادة» on a tie, «مين فضحها؟»), الفنان المزيف (no vote for yourself, the line drawn live, the TV's bars and cover), مافيا (out players see every role, a switch), أسماء الرموز (no clue inside a board word, `codenamesClueClash` in Common.js), المهمة السرية («قول الكلمة»), ارسم وخمّن (a close guess spelled only to its guesser, the quick hit, «قول الفئة», latecomers guess for fun), ارسم واكتب (two laps for 3-4, the owner tells their chain), كذبة وصدقة (a lie that is the truth refused, «متأكد ✌️»), صدق ولا كذب (a late sheet joins), فوازير إيموجي (close guesses private), كمّل المثل (a close answer tries again, three choices after 12 s), مين أكثر واحد (split votes score nothing), بدون كلام (the card on the bell), أتوبيس كومبليت (20 alone, «وقف غلط»), دندنها (three envelopes), برنامج السهرة (edit between games), الشلة (the champion's crown), الحقوا! («المنادي»), الخزنة («ليه كده؟», the spare key), الأوضة المضلمة (the mic, دايخ!), حط إيدك! (the gold hand), الشاهد (taboo cards, harder by thirds), المزاد (the old host's offer, insurance, the finale box), الليزر (practice round, turret, mirror pillars), رد الفعل («ركّز!», knockout). Seven new looks from a sheet of three each (the owner took every one of my picks): مافيا's street at night, قبل ولا بعد's line opening, العقل's number line, الحقوا!'s place surprises and endings, الكراسي's final on a stage, عربيات التصادم's car pick. Three tests that failed by chance fixed (أونو's partners, شطرنج بالتصويت's square, the tournament's walkover). Rules, leaks, robots (4,197) and the screen test (186) pass.

- 7 Oct 2026, later - improve-game round two, the owner's second batch (88 picks from the page; rules asked for 917, 991, 1185, 1239): ten builders in worktrees, each point re-checked against the code first (1010 was already done, 1017's board already turned; 970, 1184, 1211, 1260 were partly done and finished), each game's or area's notes under "The ideas of 7 Oct 2026, second batch (the owner's picks): built". Games: الموقع السري (the bold guess 3/1/2, the guess mode looks different), المهمة السرية («كشفتك!» in two taps), كلمة واحدة (an exact guess judges itself), ربع قرد (the chain skips «ال», «مفيش» checked), القنبلة (one phone's fuse jittered), زي الكل (undo one merge, the sheep picks the question), الجرس (− / + on the standings), دندنها (the night's playlist), برنامج السهرة (the night in numbers), خمّن مين («؟» sticker, the best question), الكراسي (the room's record), الشايب (ش-ا-ي-ب, a switch on), جمجمة (the heartbeat flips), إستميشن («التالي لوحده», a switch off), the podium that knows low wins (كونكان and team score keepers, سكرو, golf, the bracket), السلم («خرايطنا»), بنك الحظ (the wealth race on the TV, «غطّي الدين» shows the plan), شطرنج الأربعة (speed round, the turn frame), شطرنج بالتصويت (the captain, your vote under the board), المخ والإيد (the role line), باغ هاوس (the time-gap chip), ألغاز شطرنج («اللي غلبوني», who you play), كونكت ٤ («صدّة!»), نقط ومربعات (the chain tip, the run counter), إكس أو الكبير (the send arrow), the tournament (the knocked-out card), حرب السفن (one fire button), بولينج (quick round, the demo hand, the call-up), ميني جولف (match play, power %), الذاكرة, خمّن الرقم (the secret as dots), the dailies' archive, خمن الكلمة («اكتبها لصاحبك»), تشابه, سودوكو (all the notes), الملكات (patterns), شمس وقمر (the sky, the 3-minute run), نونوجرام (the count bubble), سلسلة الإجابات (a heart back, review), كلمات من حروف (the big word, «بالدور»), خمّن الدولة (the route), the race (give-up held 3 s, last round ×2), solve (the hardest secret). The app: the home's search, «جديد», the big-screen card, the title to the top, back to «الليلة دي؟», «رجّع الأصلي», the wake lock, the score keepers' «كمّل»; Settings in three groups and the sound setting (effects only), Help's marks, the room link line, confirms that name the action (all 48), keep the data, «جاهز من غير نت ✓», the night's card; the banner's «دورك!», مع بعض's game sheet, night points on the people tab, the TV's corner QR and «إزاي نلعبها», those who left stay on the night, latecomers' audience bar and card, «لعبناها», the share message (worded «تعالى العب مع …» since the host may be a man or a woman), a closed room's card. الأوضة المضلمة's leak-check walker now steps the other way while dizzy (it failed now and then). Rules, leaks, robots (4,373) and the screen test (186) pass.

- 7 Oct 2026, evening - improve-game round two, the owner's third batch (their sets three, four and five: 110 picks; rules asked: 1272 needs the host's approval, 1022/1031 clocks off by default, 1253 yes): 102 built by nine builders (the release commit says 94 by mistake) in worktrees, each point re-checked first, each game's or area's notes under "The ideas of 7 Oct 2026, third batch (the owner's picks): built"; the other eight (537, 613, 755, 805, 900, 909, 1253, 1282) are looks, picked from a second sheet (https://claude.ai/artifact/R3DqHuonsNvizRx5soVZ9s; the owner took my picks but 1282 ب, the drawn face) and built after. Among them: «ده أنا» (a seat taken back with the host's yes, `roomClaim*`, `/claim`), «ارجع للغرفة» on مع بعض, the night's table after every game, «🔮 توقعوها» chips on any podium, the splash with the game's aim, a night keeps its games in أرقامي, a program or crew night in the link preview, the program's share card line-up; the lobby's doors as one row and the host's options for everyone (`lobbySum`), the TV's idle stage, the banner's round, unread chat and «دورك!» clock, the chat's «جديد» line, the live count's top game; podium units and a lone winner's step, a chat-sized share card, toasts on top and with icons, Help at a room's part, the TV size offer, the in-app browser bar, «اتحدّث» naming what's new; the home's empty search, «كمّل» with several boards, chip counts, the lit tab again, «⋯» on a crowded header, the mode switch's needs and offline, the timer pill, the timer and chess clock on tokens; and per game (see each notes file): الجاسوس's fairer draw and held card, أسماء الرموز's fresh swap, بدون كلام / أوصف لي / ثلاث جولات at the bell, من أنا؟ small categories, كلمة واحدة's joined words, العقل's kind line, الليزر moves an idle phone and tilts on the TV, فوازير إيموجي's slot, القنبلة's replay, الجرس's colours, سكرو's Enter, لودو's lift, die and clock ring, السلم's roll-for, بنك الحظ's bots-only end and one row, شطرنج's line chip, think clocks for كونكت ٤ and نقط, أونو's flying points, the tournament's «أنا فين؟» and next match, حرب السفن's ships and lifted drag, golf's strip, الذاكرة's wide board and turn ring, the daily rows and the done-all moment, اعمل مسابقتك's sections, the soft dictionary in rooms (1102 and 1195 built twice, kept once), تشابه's dots and width, إيه اللي يجمعهم؟'s dots and falling choices, خيوط's band and slots, كلمات من حروف's exit, flying word and bonus list, خمّن الدولة's next hint, field and fanned pins, the race's place and slim strip, the setter's waiting screen and next setter, المشنقة's 5 s take-back and captain. The shell's budget 730 -> 760 KB (the owner: raise now, make room later); the first visit 752 KB. The test-ui door checks follow the chips; الأوضة المضلمة's leak walker steps the other way while dizzy.

- 7 Oct 2026, night - the second look sheet's eight looks, built by five builders (the owner took my picks but 1282 ب): مافيا's «حكاية الليالي» (537 أ, the nights replayed between big faces at the end; `shared.story` only at game over, a leak rule), كمّل المثل's «يافطة الخطاط» (613 ب), أتوبيس كومبليت's rings round the passengers' heads (755 ب; `stopFill` sends a count, never words, a leak rule), الخزنة's shelves (805 أ), الدومينو's chalk slate (900 أ, the score chips gone), كدّاب's heap of real card backs (909 ب, capped below the claim line), «اعمل وشك» (1282 ب: a drawn face from خمّن مين's drawing, an 11-digit descriptor in rooms/Faces.js checked by the server, the `faces` chunk, shown on lobby rows, the TV, strips, boards and podiums), the lantern and the Eid dots by the intro's mark (1253 أ, `?season=` on localhost only). Rules, leaks, robots (4,417) and the screen test (186) pass; the first visit 755 of 760 KB.

- 7 Oct 2026, late - the second audit of the day (changes bfac485..b1935b3, Claude only: 13 reviewers, 5 re-tracers, 45 points, 4 moderate) and its fixes (the owner: every open point, by 6 Claude fixers): duels with the think clock lose a gone seat by away (B1) and tournament matches carry no think clock (B2); the night share card keeps the evening past midnight (H1); move data carries the chess rating, «خرايطنا», the queens patterns, crews' word packs, the tango run and the Connections tally, re-applies colour shapes, shows a live code again, and /move/put is 4 an hour per address with a daily cap for all (D1-D5, S2, S5); «ده أنا» with the host away needs two people's yes and an answer stays for a retried poll (S1, S4, R3, R6); the lobby's night rows and crown for leavers (R1, R2); the TV corner QR (R4); الأوضة المضلمة's dizzy bump (K1); Stop's lone answer, the program's count and the chameleon's −1 (P2, P4, E1); the imposter director past a leaver (E2); «أسرع إيد»'s knockout final and «ركّز!» in rooms 1.1-1.5 s (X1-X3); the bumper cars' bots and podium (X4, H2); بالدور keeps «مين بيلعب؟», المشنقة's second take-back, ثلاث جولات' badge, sections on the team board and in the quiz maker (O2-O4, Q1, Q2); the tools (C1-C3, L1, L2). The owner decided: الشاهد's TV shows only cards that say nothing about the face (W1), a typed shown choice pays half (P1), a Codenames clue clashes only by the same start (P3), the timer rings in «الهزة بس» (H3), a second claim still replaces the first (S3), the sound setting stays per device. Check, rules, robots and the screen test (186) pass.

- 7 Oct 2026, evening - less waiting on tests (the owner: a release took 25-30 minutes of tests, the long suites run three times): CLAUDE.md step 4 says how much to test by the size of a change (notes only: check; small: check, test:rules, test:changed; medium: the same and GitHub's run as the full check; big: the full robots and screen test here); `npm run test:live` is now a short live check (rooms-worker/test/live-smoke.mjs, about 2 minutes: a smoke set plus the changed games' segments since origin/master), `test:live:full` the old 10 minutes (big releases, the weekly check). The move robot had hit the new 4-an-hour brake on the live server: /move/put is now 12 good sends an hour per address, counted after the shape and size checks; the daily cap for all stays.

- 7 Oct 2026, evening - two tests that failed by chance on the live server: the shared prompt memory started over from empty once a list was all dealt, so the next room's board could repeat words the room before had just had (a real repeat, rarely seen: the memory is every room's); it now keeps the latest deals out after starting over (up to half the list, never so many a deal can't be filled; nextPrompts in RoomGames.js, a rules test of 200 deals). The snakes robot plays until it has seen three people roll, up to 150 s instead of a fixed 60.

- 7 Oct 2026, evening - the app polish, ideas 3 and 5 (the owner's answers): while this phone is in a room the raised button is «غرفتك» (🚪, `nav_your_room`): it takes you back to the room, and on the room's own screens it is lit as the tab you are on (`navTabFor` gives them "room", `syncNavTabs`, re-run when a room starts or ends from `updateRoomBanner`) and a tap scrolls to the top (`roomNavTap`, JS_Room.html); «افتح غرفة» comes back after leaving, and a second room is opened from مع بعض, which asks first. Help's welcome on the home and the tools folds to one line «إزاي تستخدم التطبيق؟» a minute after it was first shown (`ashryHelpWelcome_v1`, `renderHelpContext`; «حذف جميع البيانات» shows it whole again). Ideas 1, 2, 6 wait on the look sheet https://claude.ai/artifact/H7mftKHGRPMRTHAiSUTunN (my picks 1C, 2A, 6A).
