# «برنامج السهرة» (the night's program) - the builder's notes (30 Sep 2026)

Built 30 Sep 2026 on a worktree branch, merged into `master` and live since (rooms server and
both addresses); its line is in GEMINI.md's index. The night's points are one rule everywhere
(`NIGHT_PLACES` 5 / 3 / 2, `NIGHT_PLAYED` 1), placed by `nightPlacesOf` for the program, the room's
own night and «الشلة» alike (the review of 1 Oct 2026).

## The owner's decisions (all asked; not to be changed)

- The host picks every game of the program (no suggestions), 3 to about 6, in order;
  reorders and removes before starting; can end the program early.
- Between two games a ~10 s standings card (the night's table so far and the next game
  with a countdown), then the next game starts by itself; the host can skip ahead or
  pause it.
- The night's score is places, not each game's points: 1st 5, 2nd 3, 3rd 2, everyone
  else who played 1; co-op games (العقل، الحقوا!، الأوضة المضلمة، حط إيدك!…) give everyone
  who played the same; ties share the place's points.
- The finale on the TV and the phones: the champion of the night, the podium with the
  cast, playful awards from real play each with its moment («أسرع إيد: منى - ضغطت الجرس
  في 0.18ث», never a mean title), a share card, and it counts for «الشلة» through a hook.
- Look أ «لوحة المذيع» (`notes/archive/sheets/next-level-looks.html`, feature 3): between games the
  table in big rows (place, face, name, first places, points with ▲ +N) beside the next
  game's poster and a countdown ring; the finale «بطل الليلة: …», the podium with the
  cast in the middle, a row of award cards under it; a compact version on phones.

## How it works

### The rules (`RoomProgram.js`, root, bundled last into the rooms server)

State:

- `room.program` (public, `view.js` projects it as `program`): `{ id, games: [{ id }],
  at, seq, phase, endsAt, ms, paused, left, table: { pid: { pts, firsts } }, names,
  order, orders, gained, done: [{ id, coop, cut, skipped, places: [{ id, place, pts }] }],
  banked, startedAt, present, waitWhy, final }`.
- `room._progOpts` (private): each game's start payload, as the host's phone captured it.
- `room._progLog` (private): the highlights the awards are made from (a lie in كدّاب
  nobody called is a secret until that game is over, so the log never leaves the server).
- `room._nightSummary` and `room.nightx.programs` (private): the finale for «الشلة»
  (below).

Phases (`program.phase`; every change raises `seq`, which the host's taps carry):

| phase | what the room is doing | the clock |
| --- | --- | --- |
| `between` | the line-up (`at: -1`) or the table between two games; the room in its lobby, no game | 8 s (`PROGRAM_FIRST_MS`), then 10 s (`PROGRAM_BETWEEN_MS`) |
| `waiting` | the next game chosen but its start refused (sides to pick, too few people, a category): the room in that game's lobby, the host presses Start as ever | none |
| `playing` | the game on; `programSync` looks for its end after every move and clock | the game's own |
| `result` | the game over and banked, its own result still up | 9 s (`PROGRAM_RESULT_MS`, more for الشاهد، المزاد، مافيا، ارسم واكتب) |
| `final` | the finale, until the host closes it | none |

- **Dealing a game** (`programDealNext`): `chooseGame` then `start` with the saved payload,
  both through `applyRoomAction` as the host (`room._progInside` lets the program choose a
  game the guard refuses otherwise); the start is tried on a copy and kept only if it dealt.
  «التالي لوحده» is set on for the games that have it (a program runs by itself). A game
  switched off since the program was set is skipped. The prompt memory is loaded for the
  alarm that deals (`programTimeoutDeals` in `roomTimeoutDeals`), and `programSkip` is a
  `DEAL_ACTION` in `room.js`. So is a family pack the next game's options name
  («اعمل مسابقتك», «كلماتنا»): `programNextPack` in `room.js` reads it for the alarm and
  the skip (or «لعبة أخرى») that deal it, as `_packIn` - it used to wait with "not found".
- **The end of a game** (`programGameOver`): `roomGameIsOver` (gameover / over, a
  tournament's end, the one-round spy games' result), plus the games with no end of their
  own, ended after `PROGRAM_ROUNDS`: لو خيروك، مين أكثر واحد، موجة، كلمة واحدة، القنبلة 5,
  فيبج 4, الجرس 10 questions, ارسم وخمّن one turn each (6 at most); من أنا؟ after its
  round, أتوبيس كومبليت at `done`, ارسم واكتب after the last chain.
- **Places → points** (`programPlaces`, `programBank`): who played is the game's own seats
  (`shared.seats`, flattened), a tournament's entrants, the teams, else the roster; the
  game's board is best-first (some win low), so a place is where a row sits, tied rows
  sharing it (competition ranking: 5, 5, 2). Team games (`PROGRAM_TEAMS`: أسماء الرموز،
  شطرنج بالتصويت، المخ والإيد، باغ هاوس) place the winning side first and the other second.
  `PROGRAM_COOP` games, and a finished game where everyone is level, put everyone first
  (5 each, no first places counted). Someone who played but isn't on the board goes after
  it. Computer players take their place but earn nothing and aren't on the table. A row's
  standing is its score and its `tie` (`boardRowKey`, RoomGames.js): الكراسي and the bumper
  cars break level wins by the game's places, so their one game ranks by the order out. The
  room's own night reads a board the same way (`nightBoardOf`: the roster's rows only, a
  team game with no board of its own as its sides).
- **Leaving a game** (`programLeaveGame`): what the host's back-to-the-games does -
  `bankNightPoints` (so the room's own «ليلتنا» and a crew's night count the game as ever),
  `settlePredictions`, `clearGameState`, the bots parked.
- **The host's actions** (`programAction`, room-level, before any game's; `programGuard`):
  `programStart { games: [{ id, opts }] }` (host, the hub only, 3-8, known games, none
  switched off; opts at most 4,000 characters of JSON); `programSkip { seq }` (a move-on
  action: the result → the table, the table → the next game, a game on → ended now and
  counted as it stands, a waiting game → skipped); `programPause { seq, on }` (move-on,
  the result or the table only); `programEnd` (host: to the finale; the game on then
  doesn't count, one already banked does); `programClose` (host, the finale → the hub).
  While a program runs: `backToHub` is `programSkip` (every game's «لعبة أخرى» button, the
  exit sheet), `chooseGame` is refused, and a game over stays over (`playAgain`, `restart`,
  `tourNew`, `nextRound`, `nextQuestion` refused in `result`). After the finale,
  `chooseGame` closes the program and chooses.
- **The clock**: `roomDeadline` puts `programDeadline` first; `roomTimeout` runs
  `programTimeout` first; `programSync` runs at the end of `applyRoomAction`, after a game's
  timeout, and after a leaver.
- **Awards** (`programAwards`, at the finale; a person takes two at most, eight in all, a
  kind only when real play gave it): ⚡ أسرع إيد (the buzzer: who was first by how much over
  the second, taken just before the host's ✓ wipes the line, `programBeforeMove`); 🧠 أسرع
  إجابة (room trivia: the quickest right answer, from `room._answers` at the result);
  🤥 ملك الكدب (كدّاب: 2+ lies nobody called - each play's truth read from `room._doubt.pile`
  as it lands); 🕵️ صايد الكدابين (2+ lies caught); 🔎 المحقق كونان (a vote on the spy who
  was caught, the spy games); 🦊 الجاسوس الداهية (a spy who got away or guessed); 🎳 ضربة
  الليلة (2+ strikes at bowling); 🪑 أسرع قعدة (the chairs: the quickest sit); 🔮 العرّاف
  («مين هيكسب؟» right); 🔥 على نار (first in 2+ games in a row); 🚀 رجعة الليلة (a climb of 2+
  places from after the first game to the end). Each is `{ k, id, name, v, g, with, from, how }`;
  the words are the phones' (both languages).

### «الشلة» (the crew hook)

- `nightProgramFinished(room, summary)` is called once at the finale with
  `{ code, at, startedAt, games: [{ id, coop, cut, skipped, places: [{ id, name, place, pts }] }],
  table: [{ id, name, pts, firsts, place }], champions: [ids], awards: [...] }` (ids are the
  room's player ids). It keeps it on `room._nightSummary` and appends it to
  **`room.nightx.programs`** (the last 5), beside what `bankNightPoints` notes for the crew.
- The crew already gets every game of a program: each is banked on `room.night` (5/3/2/1,
  exactly the places the program banked) as the hub would. `room.js` sends the night to its crew whenever `night` / `nightx` change -
  after a move, and now also **after the alarm** (a program moves on by its own clock; the
  alarm compares the two before and after `roomTimeout` and calls `recordCrew`).
- **The crew's side is built** (`notes/games/crew.md`): `crewNightInput(room)` reads
  `(room.nightx || {}).programs` and sends the night's last `CREW_PROGRAMS_KEPT` (3) with their
  games, champions and awards (names mapped to members, computer players left out); the crew's
  page shows «بطل السهرة» and the award chips of a night that was a program. Still an idea: the
  program's awards as crew titles (buzz → fast, liar / catcher → liar, detective / sly →
  detective, strike → sport, prophet → oracle).

### The page (`JS_RoomProgram.html`, its own chunk `program`)

- The door: `roomProgramDoorHtml` (JS_Room.html, the shell) draws «🌙 برنامج السهرة» at the
  top of the host's room list (and the TV host's); a tap is `lzRun('program', progOpenBuilder)`.
  It says «آخر برنامج: 4 ألعاب» when this phone has a draft.
- The builder (`#prog-modal`, one centred sheet with three panes): the list (a handle to
  drag, ⚙️ the game's options, ✕; the arrow keys on the handle move a row), the picker (the
  room's list under the home's section heads, a family opening into its games, ✓ on what
  is in, the same game twice allowed; a search box on top, 30 Sep 2026, finds any game by
  name in either language, a family's games too - `roomGameHits` in JS_Room.html - and an
  add while searching redraws only the results, `progPickRefresh`, so the box keeps what is
  typed), a game's options (its own `ROOM_GAMES[id].lobbyOptions`, drawn with a copy of
  the room state for that game; «احفظ» reads its `startPayload()`). A game added reads its
  options at once, out of sight (`progCapture`: the game's chunk loaded, its lobby options
  drawn into a hidden holder, `startPayload()` read). The draft is kept on the host's phone
  (`ashryProgramDraft_v1`) and opens next time as it was left. «التالي لوحده» isn't offered
  in the sheet (a program runs by itself).
- Between two games and the finale: `routeRoomState` (and the room engine's gate) loads the
  chunk when a state carries a program; `progInterlude(state)` (the room in its lobby, no
  game, the program `between` or `final`) draws the view `room-program` on a phone and the
  program's frame on the TV (`renderRoomTv`: `progTvSig` / `progTvFrame` / `progTvAfter`).
- A pill (`#prog-bar`) over the room's screens for the moments in between: a game's result
  giving way to the table («الترتيب بعد 7»), and a game waiting for the host's Start; the
  host's (or a stand-in's) ⏭ and ⏸. Nothing floats over a game being played.
- The ticker (`progTick`, 4 a second while a count shows) reads the pause from the server's
  time (`roomServerNow`) and drains the rings; the last three seconds tick on the room's one
  voice (the TV, or the host's phone without one).
- Motion: rows rise in one after another, the points count up from before the game, ▲ +N
  pops, the next game's poster springs in; the finale: the champion's line, the podium
  rising with the cast (renderPodium, dressed by itself), the award cards flipping up one
  after another, confetti after the podium, `tada` then applause on the room's one voice.
  All once per card (`motionFirst`), none under reduced motion.
- Share: «ابعت صورة السهرة» (`progShare`, the app's `shareResultCard`: the table, the
  champion, the first three awards in the text).
- Help: `GAME_RULES.program` (both languages), `HELP_ENTRIES` (in «ابدأ من هنا» beside
  rooms and the TV), `HELP_FOR_VIEW['room-program']`. The chat says when a program starts
  and who won it (`programStart`, `programEnd` events).
- CSS: the section «برنامج السهرة» in `Style_Night.html` (the stage sets the page's
  tokens again inside it, as كدّاب's stage does; rem on a phone, vmin on the TV).

## Decided while building (open to change, each one place)

- **3 to 8 games** (`PROGRAM_MIN_GAMES`, `PROGRAM_MAX_GAMES`): the owner said 3 to about 6.
- **The pauses**: the line-up 8 s, a game's result 9 s (12 s for الشاهد، المزاد، مافيا; 6 s for
  ارسم واكتب, whose reveal the host walks through), the table 10 s.
- **A co-op game is everyone first: 5 each**, no first places counted - the tie rule applied
  to a game nobody wins against anybody. **A finished game with everyone level** (a vote game
  that keeps no score, a trivia nobody got right) is the same. **A game cut short before
  anybody scored is 1 each** (played, nobody won).
- **Ending the program early doesn't count the game on then** (it wasn't finished).
- **Each game's options are captured when it is added** (the game's own lobby options and
  `startPayload()`, as the host's phone remembers them); a game whose start the server
  refuses (أسماء الرموز's sides, a category, too few people) **waits in its lobby for the
  host's Start** rather than guessing seats; the host can skip it.
- **«التالي لوحده» is always on in a program** (it runs by itself).
- **The endless games end after a number of rounds** (`PROGRAM_ROUNDS`).
- **The duels** play one game (winner stays) unless the host picks the tournament in the
  game's options; only the two seated (or the entrants) are placed.
- **The champion's title is «بطل الليلة»** (the generic masculine: a name doesn't say
  which), «أبطال الليلة: منى وSara» for a tie; the award titles are the sheet's.
- **The room's own «ليلتنا» (5/3/2/1) banks every game** of a program with the same places the
  program banked, so the two tables agree.
- The play counter (`/count`) counts a game started by the host's tap only; the program's
  own deals (from the alarm) aren't counted.

## Traps met

- **A game's end must be noticed after the clock too, not only after a move**: the trivia's
  last question closes on its timer; `programSync` runs after `gameTimeout` as well.
- **`applyRoomAction` inside the program's own clock** (`chooseGame` / `start` for the next
  game) goes through the program's guard: the internal flag `room._progInside` lets the
  program's own choice through (on the room and on the trial copy).
- **A player's result screen offers «العب تاني»** in many games: once the program has banked
  the game, play again would start a game it already counted - refused while `result`.
- **Python on Windows writes CRLF**: the working copies are CRLF (autocrlf), so edits are
  fine in git, but a test file anchor has to be found with the `\n` Python reads.
- **A string with an apostrophe inside a single-quoted test label** broke `rules.mjs`
  (`crew's`): the parse error prints the source line, which a grep for ✓ / ✗ swallows.
- **`lobbyOptsSummarise(root)` looks for `.lobby-opts` inside `root`**: to summarise one box,
  wrap it first.
- **A floating pill over a game covers its top** (العقل's hearts): the pill shows only
  between games, never while one is played.

## One rule with the room's night (the review of 1 Oct 2026)

- `programPlaces` is `nightPlacesOf` (RoomGames.js), the one place a game is placed for both the
  program and the room's own night («ليالينا», الشلة): co-op games everyone first, team games by
  side, else the board (`nightBoardOf`: the roster's rows, a tally game's own result), anyone who
  played but isn't on it after it, a level board everyone first (or 1 each when cut short).
- Inside a program `bankNightPoints` banks exactly the places `programBank` banked for the game,
  and nothing for a game the program didn't count (the host ending it mid-game) - the two tables
  can no longer disagree. Outside a program the hub banks the same places, a game left before its
  end counted as cut short; a game chosen and never dealt adds nothing.
- So the night now follows the program where they differed: a co-op game (لو خيروك, العقل…) is 5
  each on the night too, a finished game where everyone is level 5 each, one cut short 1 each.
  الخزنة's endless levels stay off both tables (its owner's spec: "nothing on the night's board",
  `NIGHT_NO_PLACES`).
- `PROGRAM_PLACE_POINTS` / `PROGRAM_PLAYED_POINTS` are the night's `NIGHT_PLACES` / `NIGHT_PLAYED`.
- The audit of 6 Oct 2026: «لعبة أخرى» between games does nothing (a double tap dealt the next
  game); a family quiz on the buzzer ends with its last question (`quiz.done`); a game gone from
  the list in a deploy is skipped like a switched-off one; a leaver's name is kept even before
  their first banked game; سكرو's صاحب صاحبه, الدومينو in teams and شطرنج الأربعة in teams have
  `PROGRAM_TEAMS` entries (the losing side second); and stand-ins get the program's ⏸ / ⏭ between
  games and while a game waits for Start (`gameOn` in room.js).

## Tests (30 Sep 2026, a local rooms server on :8793)

- `npm run check`: passes (4,800 keys in each language after the merge).
- `npm run test:rules`: 2,490 checks, all pass (one run failed السلم والتعبان's
  600,000-roll chi-square, a 0.1% chance, and passed the next); 49 of them the program's:
  refusals (fewer than 3, a player, an unknown game, more than 8, a second program, a game
  chosen), the line-up on the clock, the options kept on the server, the first game dealt
  with its options and «التالي لوحده», places → points with a tie for third (5, 3, 2, 2),
  first places, the game's own count taken over, play again refused, a stale skip, a
  player refused, the result → the table on the clock, the room's own night still banked,
  pause / nothing moves / a stand-in resumes with the host away, a refused start waiting,
  the host's Start picked up, a game cut short (1 each, no first place), a leaver's row
  kept, the co-op game (5 each), `backToHub` as skip, the finale (table, champion,
  awards), the crew hook (`_nightSummary`, `nightx.programs`), close, ended early (nothing
  counted), `chooseGame` after the finale, a duel (winner 5, loser 3, the watcher nothing),
  the buzzer ending after 10 questions and its award, the champions on a tie, three buzzer
  games (15 points, «على نار»), العقل to its end, لو خيروك after 5 rounds.
- The leak check: clean for every game, and a new `program` driver (كدّاب played out with
  lies and calls, المختلف cut short, the trivia on its clocks, to the finale) held to every
  game's own probes plus two of the program's (no options or highlight log in its public
  state; the awards only with the finale): 12 rules, 60-120 moves a run. Proved by
  publishing `room._progLog.lies` in a scratch `view.js`: it failed at once.
- Robots `--only=program`: 76 passed, about 30 s (the line-up, the first game dealt by the
  server, five trivia questions, places banked, a player refused, play again refused, the
  table on the clock, ⏸ everywhere and nothing dealt, the next game after ⏸, the buzzer's
  10 questions, ⏭ twice, a stale ⏭, العقل's first level, «خلّصنا» into the finale, awards,
  the chat's line, close). With `core`, `autonext` and `crew` after the merge: 1,041 passed.
- The screen test: a new part `program` (`ONLY=program`, a shard of its own in
  `test-ui-parallel.mjs`, and `npm run test:changed` maps `RoomProgram.js` /
  `JS_RoomProgram.html` to it): 15 checks on five phones and a TV (the door, the builder
  empty, the picker, three games, a game's options, a drag, the start, the line-up, the
  table, the TV's ring, a reload between games, the finale, close). `ONLY=program,fixes`
  26 passed; `rooms` 69 passed; `screens` 20 passed.
- Looked at in headless Chrome (a script of our own): three phones - 375×812 Arabic light,
  667×375 English dark, 375×812 Arabic dark - and a TV at 1920×1080 through a program of
  trivia, the buzzer and العقل to the finale: the hub's door, the builder (empty, picker,
  list, options), the line-up, the result pill, the table (phones and TV), a reload of the
  host mid-table (back on it), Help on the table, ⏸ on the TV, the finale on every screen;
  with motion on and off; no console errors.
- The site builds: the shell 636 KB compressed (budget 710), the program's chunk its own.

## Not done

- The program's awards as crew titles (the crew reads and shows them; they don't count
  toward a title yet).
- A TV host builds a program with the same sheet (the door is on the TV's list too); only
  a phone host was looked at.
