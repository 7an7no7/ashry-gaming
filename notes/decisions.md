# Decided, and why (the full text; GEMINI.md keeps each decision in a line)

Moved from GEMINI.md on 30 Sep 2026. GEMINI.md keeps the rules that apply to every game and an index; this file keeps the detail, word for word.

## From GEMINI.md: Decided, and why

- **Everything built stays, and motion is everywhere** (the owner, 26 Sep
  2026, while approving the arcade look's follow-ups: "Everything we built
  stays, just less in the way" and "Smooth, nice motion everywhere, on every
  screen and not only in some games"). A simplification folds, hides or
  reorders (behind «كل الألعاب», «خيارات أكتر», a shelf's «الكل») and never
  removes a game, a tool, an option or a way in; every screen and popup enters
  with motion (*The design system*, "Motion everywhere"), transform and
  opacity only, still under reduced motion.

- **The look is «د · أركيد», a game store** (the owner, 26 Sep 2026: "I don't
  like it a lot ... more premium look and easy to use"; then "you are showing
  me almost the same design but just different colors - show me 3 or 4
  different styles, each with 3 colours"). A first sheet of three re-skins
  was rejected for that reason; the second sheet had four styles with their
  own structure - أ a cover-card feed with shelves, ب iOS-style grouped lists,
  ج an icon grid like a phone's home screen, د a game store with posters and a
  raised «افتح غرفة» in the middle of the bar - each in three colours (violet
  on light, night with amber, cream with sea-green and coral). The owner
  picked د; the colour wasn't named, so it is built in colour ١ as the light
  theme and ٢ as the dark one (my recommendation, said in the reply). Built as
  section 39 of `Style.html` (*The design system*, "The arcade look"). The
  lesson for the next sheet: a "design direction" is a different structure,
  not a palette; put the palettes on a second axis.

- **A host away for 20 s lets anyone move the round on** (the owner, 28 Sep
  2026, approved: "once the host has been offline 20 s, any seated player can
  press the host's 'move on' buttons ... the full handover stays at 2
  minutes"). How it works is under *Multiplayer rooms*. Decided here (open to
  change, each one place): a screen counts as a stand-in too (a TV often is
  the only thing on the table), a computer player never does; a socket still
  open but silent 40 s counts as away (`HOST_QUIET_MS`: a locked iPhone keeps
  its socket), so a phone that only locked is seen after 40 s, not 20; the
  list of move-on actions (everything that moves a round forward, every
  "play for"), and what stays the host's (starting and choosing games,
  settings, seats, kicking, corrections, الجرس's verdicts, «وقت كمان»,
  choosing a spymaster); a stand-in is trusted as the host is (it may "play
  for" a quiet opponent), and a tap pressed just as the host came back is
  simply refused.

- **An idea from another app is rebuilt our way, never copied** (the owner, 25
  Sep 2026: "we just got the idea and built it with our style ... with special
  things that would be in our app only"). Before building anything borrowed,
  name its own touch: Egyptian words and sayings, the family at a party, the
  app's drawn art and motion, the TV and phones together. The same for the
  games already here (proposals in `notes/IMPROVEMENT_PLAN.md`, *Our own touch*).
  First done: the audience's Egyptian shouts and the زغروطة.

- **Nothing is waiting on the owner** (23 Sep 2026): the two old questions
  were closed as built - سكرو deals 62 cards for Classic + الحرامي (the
  owner's "66-card" table adds up to 62), and طرنيب ٤١ scores a failed 13 as
  0 and lets team 1 win when both qualify in the same round.

- **New games use the lists the app already has** (owner, 16 Sep 2026): no
  small new list when a large one exists, and no copy of a list another game
  keeps. The Chameleon categories, the room trivia, the team-board bank, the
  emoji riddles, the proverbs, the Describe It cards and every word list feed
  the solo games; a list that has to be shared is moved into its own file
  (`TriviaQuestions.js` came out of `PartyContent.js` for this), never copied.
- The soundboard is a tool (الأدوات → لوحة الأصوات), not a setting (owner,
  16 Sep 2026). The 🔊 in the header on play and room screens stays.
- **كمّل المثل is Egyptian colloquial only** (owner, 17 Sep 2026: "a lot of
  امثال wrong… the Egyptian ones only and right"). `Proverbs.js` lost the
  classical Arabic sayings (الوقت كالسيف, من جد وجد, رب ضارة نافعة, …) and
  a few made-up variants, and gained about eighty sayings an Egyptian table
  finishes without thinking, in the wording they are said in. The proverbs
  among the emoji riddles follow the same rule. Before adding one, say it
  out loud: if the table would argue about the wording, leave it out.
- **Content fits the game it is dealt in** (owner, 17 Sep 2026: "pick the
  words and questions and data for each game precise to match what the game
  is about, don't make the game hard that people won't like to play it
  again"): a drawing word must be drawable, a charade actable, a Who Am I
  character known to the table, a Stop category one with words on most
  letters. When a list is extended, extend it with the game in mind, not
  with everything the category contains. And a typed guess is judged as the
  table would judge it (*A guess is judged the way the table hears it*).
- **The screen stays where the action is** (owner, 17 Sep 2026: "my screen
  should always be in the place that has actions"): a new step of a room
  game, a one-phone game's next card and every podium are drawn from the
  top of the screen (`scrollToAction`, *The screen follows the action*).
- **TV browsers are not supported; a TV shows the app through something
  else.** The owner opened the link in a TV's own browser and got a white
  page with four buttons. The page needs a browser of about 2021 or later
  (*Browsers the app runs in*), which the browsers built into TVs are not
  for years after they are sold, and there is no cheap way to make the app
  run in them (no CSS variables or grid in the older ones). So an old browser
  gets a plain note with the ways onto the big screen - a laptop on HDMI, a
  phone mirrored, a streaming stick's browser - which is how the big screen
  was always meant to be used (*Big screens*).
- **الترتيب الأعمى (blind ranking) was removed** (owner, 17 Sep 2026: "I don't
  see any use of it"). It was a solo game with no score - place five or ten
  things of a Chameleon category 1..n before seeing the next, then share the
  list - and it had a daily. Don't bring it back, in rooms either. A saved
  board is dropped on load (`delete appState.blindrank` in `loadFromLocal`);
  the recent row and the daily hub already ignore ids they don't know.
- **Every home section says what is in it** (owner, 21 Sep 2026). Two
  headings both said puzzles - "ثنائي وذهني / Two players & puzzles" held
  Wordle and Connections beside Memory and X-O, while the other word games
  were in "كلمات وأسئلة لوحدك" - so nobody could guess where a game was.
  Wordle and Connections moved to كلمات وأسئلة لوحدك (after تحدي اليوم, which
  stays first), and what was left, Memory, X-O, Guess the number and the
  reaction test, is "لاتنين على موبايل / Two on one phone", which is what all
  four are. A new game goes in the section whose name is true of it.
- **A section of one game is a spotlight** (owner, 21 Sep 2026).
  ورق وطاولة holds سكرو alone since the scorers became tools, and on a TV it
  was one card beside five empty places. The owner calls سكرو the core of the
  app, so it was kept in its own section and drawn wide (`catalogSpotlight`):
  a big icon, its line, players, minutes and the ways it plays, and a play
  pill (just its arrow on a phone upright). Any section left with one game
  gets the same, with no extra code.
- **A setup screen is a form, and has a form's width** (owner, 21 Sep 2026).
  On a laptop or TV setup screens were the phone's form stretched to 47.5rem
  - a switch 660px from its label, the player counter a long bar around one
  digit. From 900px wide they are 40rem, centred (680px on a laptop, 800 on
  a TV). Two columns (options beside players) was offered and not chosen: the
  setup markup differs screen to screen, so it would be 42 separate jobs.

- **Three rules settled in the audit of 22 Sep 2026** (the owner, asked one at
  a time): in قبل ولا بعد the replacements are kept and **the board decides**
  once they run out (*قبل ولا بعد in rooms*); in الفنان المزيف **the fake can
  go first** - the first painter is anyone, as in the real game (it was never
  the fake, which told the table who wasn't); and in مافيا **the Doctor's save
  still counts** when the Doctor leaves the room in the night after choosing:
  the choice was made before leaving, so it stands (the Mafia's own picks go
  with a Mafia member who leaves) - left exactly as built. الموقع السري's first asker
  is anyone at the table too, spy included, on one phone and in rooms; and in
  المختلف the pair's two words are dealt either way round, so the close word
  isn't always the second.
- **Pinch-zoom stays off** (the owner, 30 Sep 2026): `user-scalable=no` in the
  viewport is kept - a pinch mid-game is a slip, iOS ignores the lock anyway, and
  Settings → Screen size makes the whole app bigger.
- Rooms stay on Cloudflare; WebRTC was rejected. Firebase, if ever, on a
  different Google account from the one already tried.
- صراحة أو جرأة (truth or dare): a family-clean list is too tame. تخمين السعر
  (price guessing): prices go stale. Hot Takes-style opinion games: aimed at
  adults. None built.
- Web Push notifications: not worth it yet (needs remote play, a home-screen
  install and permission).
- An "open in the app" banner for room links: impossible on iPhone (see
  *Putting it on the home screen*).
- The Stop dictionary is strict: an unknown word scores 0 until the host taps
  it. A lenient mode (❓ keeps its points) was considered and not built; it is
  a small change if tables find strict too much.
- The live player count lives on the مع بعض tab, not the header, and hides
  below `LIVE_MIN_PLAYERS`.
- **The play area gets the space** (the owner, 21 Sep 2026: "always give the
  space to the game part, not the score or names part … you could shrink it
  when it's finished"; and: "don't change the good looking of any part … we
  just improve it in every screen"). While a game is being played on a laptop,
  a TV or a phone on its side, its board takes the screen's height and the
  names, scores and buttons are a compact column beside it; the result can take
  the stage once it is over. Measured before and after at 1280x720 (share of
  the screen's height): إكس أو 52% → 85%, الذاكرة scrolled 411px → 84% with no
  scroll, 2048 61% → 85%, كاسحة الألغام 53% → 85%, شمس وقمر 57% → 85%, and
  every solo board ~85% at 1280x720 and ~88% at 1920x1080; on a phone on its
  side the solo boards went 64% → 78% (Sudoku's cells 26px → 32px). How: those
  views get 72rem (not the 52rem reading column), the board is sized from
  `--app-h`, and the buttons that were a bar under the board join the side
  column (`:has(> .solo-layout + .view-actions)`, a grid the layout's pieces
  flow into). On the TV: كونكت ٤ drops the ghost row (nobody aims at a TV; the
  holes grew 71px → 89px), trivia's answers take the height under the question,
  the emoji riddle is a fifth of the screen, the proverb and the Wavelength dial
  are big, and قبل ولا بعد's line is centred. The upright phone was left exactly
  as it was - every rule is inside the landscape and wide queries or TV-only.
- **Ask before building** (the owner, 21 Sep 2026: "anything you're not sure
  about, ask - don't just build, so we build everything right from the
  start"). The four games of that day had every rule put to the owner first,
  one question at a time, and each game's look picked from a design sheet of
  three. A rule a table could play two ways is the owner's to choose, not a
  default to pick and mention afterwards.
- **ورق وطاولة holds سكرو, أونو and الدومينو as three normal cards** (owner, 21
  Sep 2026). سكرو's spotlight was only ever because it was alone there; the
  rule stands (a section of one game is drawn wide), it just no longer applies.
- **One thing to do is done for you** (owner, 21 Sep 2026: "in any scenario
  where there is only one thing to do, it should be done automatically - check
  all games"). Where a player's only possible move is known, it is made for
  them after a beat, with a line saying what is happening instead of a
  button: أونو's take of a +2/+4 with nothing to stack and the draw when
  nothing fits (a drawn card that fits still asks: play or keep); the 7 of
  7-0 with one other player; الدومينو's draw, باص and a move that is the only
  one - **only with the host's "light up the tiles that fit" on**, because
  with the helpers off working it out is the game (the owner chose this);
  the memory game's last pair; قبل ولا بعد's last card, picked for you; سكرو's
  "which player" when only one can be chosen. **Five kinds of tap stay taps**:
  one that is the game itself (أونو!, العقل, the Buzzer), one that hides who
  has a role (مافيا's night tap, made by everyone on purpose), anything the
  player is meant to judge unaided (الدومينو with the helpers off, سكرو's
  memory), a pause the table uses to read or talk (the host's "next round"),
  and **a winning move** (the owner, the same day): the last disc, line or
  square of كونكت ٤, نقط ومربعات and إكس أو is always the player's own - it
  is so often the winning one that it was built and then taken out - and
  الدومينو's last tile, the one that goes out, is never put down for them. And in أونو an automatic take waits while someone can still be
  caught - taking at once would close the امسكه! window on the player who
  forgot. In rooms the move is the server's (*Forced moves*), so it happens
  with the phone locked too. A new game checks its turns for the same.
- **Every icon has to say what its game is** (owner, 21 Sep 2026, after
  asking for Uno's and Domino's to change). أونو and الدومينو got drawn icons
  (*Feel*, *Some icons are drawn*): 🌈 said nothing about Uno and 🀄 is not a
  domino. A pass over all eighty icons then changed four, each put to the
  owner: العقل 🧠 → 💯 (تحدي المعلومات is 🧠 too; its cards are 1 to 100),
  قبل ولا بعد 🗓️ → 🕰️ (it looked like تحدي اليوم's 📅), خمن الكلمة 🔤 → 🟩
  (English letters on an Arabic game; the green square is Wordle's own mark)
  and أسماء الرموز 🔠 → 🗝️ (the key card the spymasters hold). A new game's
  icon must not repeat another game's or be English letters.

- **Chess is one card, with its ways inside** (owner, 24 Sep 2026: "every
  update for chess is counted as a separate game ... all should be inside
  chess"). Six chess cards had spread over three sections. Now the home has
  one «شطرنج» card (players 1-12); ألغاز شطرنج, شطرنج بالتصويت, المخ والإيد,
  باغ هاوس and شطرنج الأربعة carry `hub: 'shatranj'` in `GAME_CATALOG`: out of
  the sections, the recent row (a recent one shows as chess, `catalogHomeId`),
  the مع بعض list and the game count, but a search still finds each by name.
  Every chess screen has a row of the six ways under its hero (`HUB_WAYS`,
  `hubWaysHtml`; a room-only way is marked 📲 and opens a room). In a room's
  list, on the phone and the TV, chess is one tile too: a tap opens its five
  room ways, the first named «١ ضد ١», with «كل الألعاب» to go back
  (`ROOM_HUB_GROUPS`, `roomHubTiles`, `roomHubOpen`). The help sheet still has
  each game's own rules. A future family of games can be folded the same way.

- **Simpler to start playing** (the owner, 26 Sep 2026: "people who open it
  should not have to do a lot of clicks to start a game; I don't want them to
  get lost; simple, without losing the things we made; cool animations all the
  way"), after a study of every game's taps from opening the app. Four
  decisions were the owner's own:
  1. **The first visit only** gets a simple start (three big one-tap games,
     one room button, «الليلة دي؟», everything else under «كل الألعاب (N) ▾»);
     a phone that has opened a game keeps the home exactly as it was (*The
     catalog and the home screen*).
  2. **Rooms skip the name sheet when a name is saved**; the lobby shows «أنت:
     منى ✏️» to change it (*Multiplayer rooms*). It used to be asked every time
     on purpose - the owner changed that.
  3. **The intro stays exactly as it is** (not shortened for returning phones).
  4. **سكرو and الدومينو open on the real game** (نلعب في التطبيق, first in
     their switch); the score keeper is the switch's other side and still in
     الأدوات (`openTableCalc` turns to it for that one visit, `playModeOnce`;
     `PLAY_MODE_DEFAULT` in `JS_RoomGames.html`). A table that picks «على
     الطاولة» itself has that remembered as before.
  Approved in principle and built the same day: «مين بيلعب؟» for a game short
  of names, one wording for "not enough players", the order of play only when
  asked (P1, P12, P6: *Player names live on the phone*); the lobby's Start
  always on screen and its options folded (P3); the first-play card as one
  line (P9); شطرنج's Start on the first screen and شطرنج / بنك الحظ's rarer
  options under «خيارات أكتر ▾» with what they are set to (P10, P11,
  `setupMoreSummarise`); «▶ العب تاني» on a recent tile (P7); popups that
  close with motion, a blocked Start pointing at what is missing, a new
  player's chip popping in (P14). Decided while building (open to change,
  each one place): the three first-visit games are the starter shelf's first
  three; a first-visit card presses the game's Start at once (القنبلة and بدون
  كلام start playing, الجاسوس asks for names); the sheet fills its fields from
  the library, newest first; a join link with a saved name goes straight in;
  the lobby's name is changed with a server action, `rename`, in the lobby
  only; the lobby options of the seven games that seat the table are never
  folded; الدومينو's four in teams are the picker's order (first two against
  last two).

- **The owner's app decisions of 26 Sep 2026** (from the night's review,
  `notes/review-2026-09-25/`), each built the same day:
  - **Chess's handicap is «فرق قوة»** in Arabic everywhere it shows (the
    setup, «مين بيدّي فرق القوة؟», the pill «فرق قوة: بدون …», the rating's
    reason, Help); «الحسبة (هانديكاب)» is gone. English keeps "Handicap".
  - **أتوبيس كومبليت's total column says «المجموع» / "Total"** (it was Σ), and
    is pinned to the far edge of the table like the names to the near one, so a
    phone scrolls the categories between them and the total stays in sight.
  - **«ادخل غرفة», not «انضم لغرفة»**, everywhere (the tiles, the join screen,
    the TV's hint, Help); English keeps "Join a room".
  - **Philidor's line says the rook stays on "your third rank"** («الصف التالت
    من ناحيتك»; in English "your third rank (the attacker's sixth)"): the
    defender's third rank is the attacker's sixth, and the old «الصف السادس»
    read as the defender's own sixth.
  - **A room game computer players can fill starts at 1 in `GAME_CATALOG`**
    (أونو, الدومينو, كدّاب joined لودو, بنك الحظ, إستميشن, شطرنج
    الأربعة, المخ والإيد, باغ هاوس), so the "1" filter and «لوحدي» in «الليلة
    دي؟» find every one of them; «لوحدي» now offers a room game too (`fitsMode`
    in `tonightCandidates`: a game on this phone, or a room opened alone with
    computer players). كدّاب's Help says "3 to 12 at the table … even on your
    own".
  - **من أنا؟ starts on a real category**, not «إدخال يدوي» (`whoamiFillCategories`:
    a phone that never picked gets the first category) - confirmed as built.
  - **ثلاث جولات survives a reload** (*Reloading mid-game*): back to the current
    turn's ready card, the deck, round, teams and scores kept.
  - **The audience's bar goes, and «مين هيكسب؟» closes, once the game is over**
    (*The audience*), not only after its 90 seconds.
  - **Room trivia's title says what its number is**: «أسرع إجابة: منى · في 3
    أسئلة» ("Fastest: Mona · on 3 questions"), not «أسرع واحد منى 3», which read
    as a score (`awardFirstTimes`).
  - **The TV's lobby is laid out from the top** (*Big screens*): on a 1080p TV
    the players' side of a TV that isn't the host was a heading and a line in
    the middle of an empty half; it now shows the game chosen and a tile for
    everyone in, level with the QR.
  - **Every popup fades out when it closes** (*The design system*): the seven
    that were hidden directly go through `closeModal` now.

- **A table game's score keeper lives inside the game, with a shortcut in the
  tools** (owner, 21 Sep 2026). The domino score keeper became the "على
  الطاولة" side of the Domino setup screen, like سكرو's, and الأدوات → حاسبات
  النقط has `screw-calc` and `domino-calc`: catalog entries with no `setup` of
  their own (so the game's hero is the one drawn there) whose `open` is
  `openTableCalc(id)` - the game's setup, turned to that side.
