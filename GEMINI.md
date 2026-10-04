# GEMINI.md - Ashry Gaming (عشرى جيمينج) 🎮

## Project Overview
**Ashry Gaming** is a party-games web app for phones: a hub of social games and utility tools with a responsive UI in Arabic and English, and dark mode. It began as a Google Apps Script web app; it is now a static site on Cloudflare (and the same build on GitHub Pages), with multiplayer rooms on Cloudflare.

- **App:** https://play.3ashry.workers.dev - the main address since 24 Sep 2026
  (`site-worker/`, *The static site*): every link the app shares points here.
  The same build on GitHub Pages, https://7an7no7.github.io/ashry-gaming/
  (`master` → `/docs`), keeps old icons, links and QR codes working.
- **Rooms server:** https://ashry-rooms.3ashry.workers.dev (`rooms-worker/`)
- **The old Apps Script version** is a frozen copy in `C:\Users\TPC\Apps Script\G`
  (git tag `apps-script-v177`). Its `/exec` link still works, with its own rooms; nothing
  changed here reaches it.

### Main Technologies
- **Hosting:** GitHub Pages (static files in `docs/`, built by `tools/build-site.mjs`)
- **Rooms:** Cloudflare Workers + Durable Objects over WebSockets (`rooms-worker/`, free plan)
- **Storage:** no database. Word lists are code (`SpyWords.js`, `PartyContent.js`, `ChameleonWords.js`, `SpyfallPlaces.js`, `BombPrompts.js`, the `JS_*.html` banks); names, groups and the "already dealt" memory live in each phone's `localStorage`; a room lives in its Durable Object's storage while it is played.
- **Frontend:** HTML5, CSS3, Vanilla JavaScript
- **UI Framework:** Tailwind CSS v3, compiled locally to `Tailwind.html` (see *Styling*)
- **External Libraries:** `canvas-confetti` and a QR code generator, pinned on jsDelivr with SRI hashes and loaded `async` (a stub in the head takes confetti calls until the library arrives)

### Architecture
- **Source files at the root** are still written the Apps Script way: `Controller.html` pulls the other `.html` files in with `<?!= include('X'); ?>` and has a few `<?!= … ?>` template values. Nothing runs them on Apps Script any more; `tools/build-site.mjs` (and `build-preview.mjs`) inline the includes and fill the values in.
- **One list of games (`Games.js`, 2 Oct 2026):** `GAME_LIST` has one entry per game - its card's fields, `room` (min players, the room id when it differs, program `rounds`, `autoNext`), `crew` (الشلة's title) and `open` - shared by the page (first of `SHARED_LISTS`) and the rooms server (first of `FILES`). The home's `GAME_CATALOG`, a room's `ROOM_HUB_GAMES`, the server's `ROOM_GAME_IDS`, `APP_GAME_IDS` (what /count and /report take), `AUTONEXT_ROOM_GAMES`, `PROGRAM_ROUNDS` and `CREW_TITLE_GAMES` are built from it. **Adding or removing a game's card is one entry there**; `ROOM_LIST_ORDER` orders a room's list (a game not in it goes last).
- **Rooms server (`rooms-worker/`):** one Durable Object per room code. `RoomGames.js` at the root is the room engine (dispatch, votes, clocks, leaving, computer players, «التالي لوحده»); every room game's rules are in its own `Room<Game>.js` (since 2 Oct 2026 the older ones too: `RoomStop.js`, `RoomImposter.js`, `RoomTrivia.js`, `RoomScrew.js`…), bundled after it with the word lists by `rooms-worker/build.mjs`. See *Multiplayer rooms*.
- **Frontend Entry Point (`Controller.html`):** The main HTML structure that includes styles, scripts, and various game views.
- **Modular JavaScript (`JS_*.html`):** Game logic is organized into separate HTML files acting as JS modules (e.g., `JS_Core.html`, `JS_Monkey.html`, `JS_Utils.html`), included into the main template. The app's words are `JS_Translations.html` (`TRANSLATIONS`, loaded first) and every game's rules `JS_GameRules.html` (`GAME_RULES`, right after `JS_Core.html`); `JS_Core.html` is the core's code (3 Oct 2026: the three were one file of 18,000 lines).
- **Styling (`Tailwind.html` + `Style*.html`):** `Tailwind.html` is generated - it holds
  only the Tailwind utilities the markup actually uses. The hand-written CSS is
  `Style.html` (the tokens and sections 1-8, with the map of the rest in its
  header) and thirteen parts after it, `Style_Screens.html` … `Style_Talk.html`,
  each naming its sections at its top. They are included in that order and the
  cascade depends on it; a new section goes at the end of the last part.
  Edited directly.

## Index: where the detail lives

This file is loaded into every AI session, so it keeps only what applies to the
whole app: the decisions, how to build and test, the conventions, the traps.
Everything about one game - the owner's spec as decided, how it was built, its
files and functions - is in `notes/games/<id>.md`, moved there word for word on
30 Sep 2026. **Before changing a game, read its file; after changing it, update
that file and, if what it covers changed, its line here.** A new game gets a new
file and a new line.

### The games (one line each: what it is, its file)

- **Every game and tool, the full list** - `notes/games/features.md`.
- 🕵️ الجاسوس, المختلف, 🦎 الحرباء, 🗺️ الموقع السري (deduction; one phone and rooms) - `notes/games/spy-games.md` (rooms), `notes/games/one-phone-party.md` (the ask director), the living spy in `notes/design.md`.
- 🕴️ مافيا (rooms, the app narrates) - `notes/games/mafia.md`.
- 🔠 أسماء الرموز / Codenames (rooms only) - `notes/games/codenames.md`.
- 🎨 ارسم وخمّن, 🖍️ ارسم واكتب, الفنان المزيف (drawing, rooms) - `notes/games/draw.md`.
- 🙊 صدق ولا كذب, 🤔 فوازير إيموجي, 📜 كمّل المثل, 5️⃣ خمس ثواني (rooms of 15 Sep) - `notes/games/party-rooms.md`.
- 🎭 بدون كلام, 🗣️ أوصف لي, ❓ من أنا؟, ثلاث جولات, 🤫 كلمة واحدة (one phone: teams, scores, take-backs) - `notes/games/one-phone-party.md`.
- 💣 القنبلة - `notes/games/bomb.md`. 🐵 ربع قرد - `notes/games/monkey.md`. 🐄 زي الكل - `notes/games/herd.md`.
- 💯 العقل - `notes/games/mind.md`. 🕰️ قبل ولا بعد - `notes/games/timeline.md`. 🔔 الجرس - `notes/games/buzzer.md`.
- 🚏 أتوبيس كومبليت (Stop, the bus, the dictionary, the word log) - `notes/games/stop.md`.
- 🧠 تحدي المعلومات: room trivia and دوري المعرفة (the steal) - `notes/games/trivia.md`.
- 🃏 سكرو (the core game; rooms, TV, the table calculator) - `notes/games/screw.md`.
- 🌈 أونو (and «اتنين اتنين», teams of two) - `notes/games/uno.md`. 🀄 الدومينو - `notes/games/domino.md`.
- كدّاب, الشايب, the playing cards and «المسرح» - `notes/games/doubt-oldmaid.md`.
- إستميشن (rooms) - `notes/games/estimation.md`. جمجمة - `notes/games/skull.md`.
- Card score keepers (إستميشن, طرنيب, تريكس, كونكان, باصرة) - `notes/games/scorekeepers.md`.
- 🎲 لودو - `notes/games/ludo.md`. 🐍 السلم والتعبان (four themed maps, surprise squares and a moving map as switches, teams in rooms, the awards' replay; `JS_Snakes*.html`) - `notes/games/snakes.md`. 🏦 بنك الحظ - `notes/games/bank.md`.
- 🔴 كونكت ٤, 🔲 نقط ومربعات, ⭕ إكس أو and «إكس أو الكبير» (the duels, winner stays on; كونكت ٤ team against team) - `notes/games/duels.md`.
- 🏆 The duels' tournament - `notes/games/tournament.md`.
- خمّن مين (one against one, winner stays; or team against team from 4, the guess agreed by two) - `notes/games/guesswho.md`. المشنقة (one writes, the race by category, team against team; levels, lifelines, hints, the streak, 16 endings in `JS_HangmanEnd.html`) - `notes/games/hangman.md`. 🚢 حرب السفن - `notes/games/battleship.md`.
- ♞ شطرنج (and الوزير المستخبي, 960, the coach, the review, book moves, «ليه؟» and the opponents from 1400 and Chess960 on Stockfish 19 in a worker, `JS_ChessStockfish.html`, `vendor/stockfish/`) - `notes/games/chess.md`.
- ألغاز شطرنج - `notes/games/chesspuzzle.md`. باغ هاوس - `notes/games/bughouse.md`. شطرنج الأربعة - `notes/games/chess4.md`.
- شطرنج بالتصويت and المخ والإيد - `notes/games/chess-teams.md`.
- 🎳 بولينج - `notes/games/bowling.md`. ⛳ ميني جولف - `notes/games/minigolf.md`.
- Solo games (Sudoku, 2048, Minesweeper, Queens, Tango, Nonogram, خيوط, كلمات من حروف, إيه اللي يجمعهم؟, سلسلة الإجابات, خمّن الدولة, على راسك), تحدي اليوم and the dailies (Wordle, Connections) - `notes/games/solo.md`.
- One sets, everyone solves (Wordle, the number, the country, the emoji riddle in rooms) - `notes/games/solve.md`.
- رد الفعل (the reaction test on one phone, «خدعة» its fake signals, and «أسرع إيد» in rooms: one green on every screen by the server's clock, 5 rounds of 3/2/1; `RoomReaction.js`, `JS_RoomReaction.html`, its words and styles in its chunk) - `notes/games/reaction.md`.
- سباق ألغاز (the ten puzzles as a race; «خماسي السهرة», a different puzzle each round) - `notes/games/race.md`.
- الكراسي الموسيقية - `notes/games/chairs.md`. عربيات التصادم (the TV as the console: بالونات, نقط, الحلبة, «كورة التصادم») - `notes/games/bumper.md`.
- 🎉 «الشلة» (the crew: a family's or friends' monthly table, champions, titles, its quizzes and words; a room opened for it - asked «للشلة؟» every time - records its night once; `Crew.js`, `rooms-worker/src/crew.js`, `JS_CrewCore.html`, `JS_Crew.html`, `/crew/*`, `/s/CODE`) - `notes/games/crew.md`.
- ✍️ «اعمل مسابقتك» (the family's own quiz: a room, the team board, the buzzer) and «كلماتنا» (the family's words as a category in the word games), kept by a 6-letter code (`Packs.js`, `rooms-worker/src/packs.js`, `JS_PackStore.html`, `JS_QuizMaker.html`, `/pack/*`) - `notes/games/quiz.md`.
- 🌙 «برنامج السهرة» (the night as a show: the host's line-up of room games run on the server's clock, the table between games, places → 5/3/2/1, the finale with the podium and awards; `RoomProgram.js`, `JS_RoomProgram.html`) - `notes/games/program.md`.
- 🕵️ «المهمة السرية» (not a game from the list: a switch on the room beside every game - each person a secret target and mission by the place and company the host picks, «خلصت» and the target's memo نعم / لأ, «غيّرها», «كشفتك!», the TV's cork board and ticker, the reveal and its champion banked 5/3/2/1; `Missions.js`, `RoomMission.js`, `JS_RoomMission.html`) - `notes/games/mission.md`.
- **The night's points are one rule everywhere** (the owner, 30 Sep 2026): each game banks 5 / 3 / 2 for the first three places and 1 for everyone else who played (`NIGHT_PLACES`, `NIGHT_PLAYED` in `RoomGames.js`): the room's night board, الشلة's nights and the program.
- 🎧 ارسم اللي بتسمعه (one describes a picture the app made, the rest draw it; the app marks each drawing with a %; rooms) - `notes/games/hear.md`.
- 🎵 دندنها (Egyptian songs: one hums in turn or every phone hears the same clip, the names typed, four choices after 15 s; `Songs.js` pinned to Apple or Deezer previews, looked up at play time, `/song/CODE/TOKEN`) - `notes/games/hum.md`.
- The five of 29 Sep: الحقوا! - `notes/games/wire.md`; الأوضة المضلمة - `notes/games/darkroom.md`; حط إيدك! - `notes/games/exact.md`; الشاهد - `notes/games/witness.md`; المزاد - `notes/games/box.md`.
- 🔐 الخزنة («صندوق جدّو», rooms: one sees the locks, the others read grandpa's notebook; three ways, 3 strikes or time, endless levels or a set; `Vault.js`, `RoomVault.js`, `JS_RoomVault.html`) - `notes/games/vault.md`.

### The app around the games

- The log of every batch of work, day by day - `notes/log.md` (search it for a game's name for that game's history).
- Ideas not built yet - `notes/ideas.md`. The ideas batch of 30 Sep (builders' notes) - `notes/archive/plans/ideas-batch-2026-09-30.md`.
- Decided, and why - the full text of each decision - `notes/decisions.md`.
- Content decisions (the content audit, the words cut and kept) - `notes/content.md`.
- Rooms, the long version: the table of files (which Room*.js / JS_Room*.html does what), **computer players** (`ROOM_BOT_GAMES`, forced moves), **a host away** (`requireMoveOn`, the move-on actions), **the voting engine**, **«التالي لوحده»** (the next round dealt by itself, `autoNext`), the «دورك!» alert (`roomTurnOf`), the host's name menu, how a guess is judged, the chat, the live count, the audience and «ليالينا», which browsers run the app (the TV gate), names in a room, the lobby's Start, the share card, getting people in - `notes/rooms.md`.
- The static site, offline copy, second address, minified page and its budget, the brand mark and icons, putting it on the home screen, the play counter and «في غلطة؟» reports - `notes/site.md`.
- Each game's code loaded when it opens (the shell, `docs/g/` chunks, `tools/lazy-split.mjs`, `JS_Lazy.html`, the chunk map and its measurements) - `notes/lazy-load.md`.
- Room links with a WhatsApp preview (`/r/CODE`, the site worker's one script, `docs/og/` pictures) and errors from players' phones (`POST /err`, `npm run errors`) - `notes/previews-errors.md`.
- The parallel tests and `npm run test:changed` (the segments, the file → test mapping) - `notes/tests-docs.md`.
- Player names, the picker, «مين بيلعب؟» - `notes/players.md`.
- The catalog and the home screen (`GAME_CATALOG`, the first visit, «الليلة دي؟», descriptions, setup options remembered) - `notes/home.md`. Read before adding a game.
- The soundboard and sound on iPhones (`wakeAudio`, a stuck audio context) - `notes/sound.md`.
- The first-play card and the Help sheet (`GAME_RULES`, `HELP_ENTRIES`, `HELP_FOR_VIEW`) - `notes/help.md`.
- The design system, the long version: the arcade look, one voice, the finish, the intro and the slow-load scenes, filtering, the reveals (the spy, the podium's cheerers), held roles, motion everywhere, the dice, smoothness, the motion helpers (`flyEmoji`, `animateScoreboards`, the nav pill), keys, toasts and popup closing, style-recalc performance, landscape phones and big screens, the iPhone back swipe, drawn icons - `notes/design.md`.
- Earlier plans and phase reports, and the design sheets and screenshots they were picked from - `notes/archive/` (`plans/`: the runbooks, `phase-reports/`, `IMPROVEMENT_PLAN.md`, the review of 25 Sep; `sheets/`: the look sheets and their drivers; `shots/`: screenshots), kept for the history, not read to work; what needs a real phone - `notes/TO-TRY-ON-A-PHONE.md`.

## Where the app is going: ideas, decisions and the log

This part is the memory of the project for whoever picks it up next, person
or AI: what the owner has decided, what is waiting, and what each batch of
work changed. Add to it when a decision is made or a batch ships.

### The owner's specs, as built

Each game's spec as the owner decided it, and how it was built, is in its own file under `notes/games/` (the index above). The log of every batch of work is `notes/log.md`, the ideas not built yet `notes/ideas.md`.

### Decided, and why

Every decision the owner has made that applies across the app, one line each.
The full text of each, with its reasons, numbers and dates, is
`notes/decisions.md` (word for word as it stood here until 30 Sep 2026);
decisions about one game are in that game's file under `notes/games/`, and the
content decisions (words cut, kept, spelled) in `notes/content.md`.

**How we work**
- **Ask before building** (21 Sep 2026): a rule a table could play two ways is the owner's to choose; put every rule to the owner, one question at a time, and pick a game's look from a design sheet of three.
- **A design sheet varies structure, not palette** (26 Sep 2026): a "design direction" is a different layout; colours go on a second axis.
- **An idea from another app is rebuilt our way, never copied** (25 Sep 2026): name its own touch first - Egyptian words, the family at a party, the app's drawn art and motion, the TV and phones together.
- **Everything built stays, and motion is everywhere** (26 Sep 2026): a simplification folds, hides or reorders (behind «كل الألعاب», «خيارات أكتر», a shelf's «الكل») and never removes a game, tool, option or way in; every screen and popup enters with motion, transform and opacity only, still under reduced motion.
- **Nothing is waiting on the owner** (23 Sep 2026): سكرو deals 62 cards for Classic + الحرامي, and طرنيب ٤١ scores a failed 13 as 0 and lets team 1 win when both qualify in one round - closed as built.
- Rooms stay on Cloudflare; WebRTC was rejected. Firebase, if ever, on a different Google account from the one already tried.
- **على نفس الموجة (Wavelength) was removed** (2 Oct 2026, the owner: not needed): its room game, TV screen, list and tests are gone; don't bring it back.
- Not built, on purpose: صراحة أو جرأة (too tame when family-clean), تخمين السعر (prices go stale), Hot Takes-style opinion games (for adults), Web Push (not worth it yet), an "open in the app" banner for room links (impossible on iPhone).

**Content**
- **New games use the lists the app already has** (16 Sep 2026): no small new list when a large one exists, no copy of another game's list; a list that must be shared moves into its own file (as `TriviaQuestions.js` did).
- **Content fits the game it is dealt in** (17 Sep 2026): drawable drawing words, actable charades, known Who Am I characters, Stop categories with words on most letters; a typed guess is judged as the table would judge it.
- **كمّل المثل is Egyptian colloquial only** (17 Sep 2026): if the table would argue about a saying's wording, leave it out; the proverbs among the emoji riddles follow the same rule.
- **الترتيب الأعمى was removed** (17 Sep 2026): don't bring it back, in rooms either; a saved board is dropped on load.
- The Stop dictionary is strict (an unknown word scores 0 until the host taps it); the host's «متسامح» switch is the lenient way.

**The home and the screens**
- **The look is «د · أركيد», a game store** (26 Sep 2026): colour ١ is the light theme, ٢ the dark one (*The design system*).
- **Every home section says what is in it** (21 Sep 2026): a new game goes in the section whose name is true of it (لاتنين على موبايل, كلمات وأسئلة لوحدك…).
- **A section of one game is a spotlight** (21 Sep 2026): drawn wide (`catalogSpotlight`), with no extra code.
- **ورق وطاولة holds سكرو, أونو and الدومينو as three normal cards** (21 Sep 2026).
- **Chess is one card, with its ways inside** (24 Sep 2026): a family folds into one card (`hub` in `GAME_CATALOG`, `HUB_WAYS`, `ROOM_HUB_GROUPS`); a search still finds each way by name.
- **A table game's score keeper lives inside the game, with a shortcut in the tools** (21 Sep 2026): `screw-calc`, `domino-calc` open the game's setup on its "على الطاولة" side (`openTableCalc`).
- **The soundboard is a tool** (الأدوات → لوحة الأصوات), not a setting (16 Sep 2026); the 🔊 in the header on play and room screens stays.
- **Every icon has to say what its game is** (21 Sep 2026): never another game's icon, never English letters; a drawn icon where emoji has none.
- **A setup screen is a form, and has a form's width** (21 Sep 2026): 40rem centred from 900px wide.
- **The play area gets the space** (21 Sep 2026): while a game is played on a laptop, a TV or a phone on its side, the board takes the height and names, scores and buttons are a compact column; the result may take the stage once it is over; the upright phone is left as it was.
- **The screen stays where the action is** (17 Sep 2026): a new step, the next card and every podium are drawn from the top of the screen (`scrollToAction`).
- **Sheet three and the sections (3 Oct 2026)**: while a game is played (one phone or a room) the app's bar is gone - the back arrow is the way out; a room code is typed into four boxes and joins by itself; the phone-passing games show everyone's face under the card; the tools are app icons. A game sits in the section whose name is true of it, and a way inside a card goes under its card's section (`notes/home.md`).
- **The redesign of 3 Oct 2026** (the owner's picks from a sheet of three looks each): a room's lobby puts the people first - the host has two tabs, the people and the game (`notes/rooms.md`); every TV lobby is a dark stage with a face for everyone; the home's sections are shelves on phones too; a poster grows into the game's header when tapped (`catalogCardGrow`). The setups lost the header's «القوانين» (the «أول مرة؟» drawer is the way), and on a phone under 700px tall the header's art is half height.
- **Simpler to start playing** (26 Sep 2026): the first visit gets a simple start (three one-tap games, one room button, «الليلة دي؟», the rest under «كل الألعاب»); rooms skip the name sheet when a name is saved; the intro stays exactly as it is; سكرو and الدومينو open on the real game, the score keeper on the switch's other side.
- **The owner's app decisions of 26 Sep 2026**: «فرق قوة» for chess's handicap; «المجموع» pinned in Stop's table; «ادخل غرفة», not «انضم لغرفة»; Philidor's "your third rank"; a room game computer players fill starts at 1 player in `GAME_CATALOG` and «لوحدي» finds it; من أنا؟ starts on a real category; ثلاث جولات survives a reload; the audience's bar goes at the game's end; trivia's «أسرع إجابة: … · في N أسئلة»; the TV lobby laid out from the top; every popup fades out through `closeModal`.
- **Pinch-zoom stays off** (30 Sep 2026): `user-scalable=no` is kept; Settings → Screen size makes the app bigger.
- **TV browsers are not supported** (17 Sep 2026): an old browser gets a plain note with the ways onto the big screen (a laptop on HDMI, a mirrored phone, a streaming stick's browser).
- The live player count lives on the مع بعض tab, not the header, and hides below `LIVE_MIN_PLAYERS`.

**Rules across games**
- **One thing to do is done for you** (21 Sep 2026): where a player's only possible move is known, it is made after a beat with a line saying so; five kinds of tap stay taps - the game itself (أونو!, العقل, the Buzzer), a tap that hides a role (مافيا's night), anything judged unaided (الدومينو with the helpers off, سكرو's memory), a pause the table uses to read, and a winning move; in rooms it is the server's (*Forced moves*); a new game checks its turns for it.
- **A host away for 20 s lets anyone move the round on** (28 Sep 2026): any person or screen (never a computer player) may press the "move on" buttons; settings, seats, new games and verdicts stay the host's; the full handover stays at 2 minutes (*Multiplayer rooms*, `notes/rooms.md`).
- **Three rules settled in the audit of 22 Sep 2026**: قبل ولا بعد keeps its replacements and the board decides once they run out; الفنان المزيف's fake can go first; مافيا's Doctor's save counts when the Doctor leaves in the night; الموقع السري's first asker is anyone, spy included; المختلف's pair is dealt either way round.

## Building and Running

### Development Requirements
- Node.js 22+ and npm.
- For the rooms server: a Cloudflare login on this computer (`npx wrangler login`, once).
- For publishing the site: push access to https://github.com/7an7no7/ashry-gaming.

### Styling: rebuild the CSS after changing markup

Tailwind is **not** loaded from a CDN. `tools/` compiles just the classes the
markup uses into `Tailwind.html`, which `Controller.html` pulls in via
`include()`. The full v2 CDN file was 2.9 MB, and because the markup is written
against v3 (`slate`/`orange`/`teal`, `dark:`, `h-[85vh]`, `bg-black/20`) about a
quarter of the classes in it resolved to nothing at all.

```bash
cd tools && npm install        # once
npm run build:css              # regenerates ../Tailwind.html
```

**Any time you add a Tailwind class to the markup, re-run `npm run build:css`** -
a class that is not in a scanned file will simply not exist at runtime. Use
`npm run watch:css` while working. Class names assembled by interpolation
(`` `bg-${color}-500` ``) cannot be seen by the scanner and must be added to
`safelist` in `tools/tailwind.config.js`.

### Previewing locally

`npm run build:preview` (in `tools/`) inlines the `include()` calls and writes
`.preview/index.html`, so the whole app can be opened in a browser without
publishing. Its rooms talk to a local rooms server (`npm run dev` in
`rooms-worker/`, port 8787; `ROOMS_URL=… npm run build:preview` points it
elsewhere). Serve it over HTTP - the app writes to `localStorage`, which is
blocked on `file://`:

```bash
cd rooms-worker && npm run dev                          # one terminal
cd tools && npm run build && npx http-server ../.preview -p 4321
```

Two browser tabs on the preview behave like two phones in one room.

### Publishing
- **The app:** `npm run build:site` in `tools/`, then commit and push (`docs/`
  included). GitHub Pages redeploys in about a minute; `npm run check:live` in
  `tools/` waits for it and confirms the link serves the build in `docs/`,
  and fails if the rooms server runs other rules than this folder: `/health`
  reports a fingerprint of what the server was built from (the `FILES` of
  `rooms-worker/build.mjs` and `rooms-worker/src/`, hashed by
  `rooms-worker/fingerprint.mjs` into `generated/rules.js`), and the folder's
  is worked out the same way. Contents, not dates: the first version compared
  commit dates, and a deploy comes before its commit.
- **The rooms server:** `npm run deploy` in `rooms-worker/`. Needed whenever
  `Games.js`, `RoomGames.js`, any `Room*.js`, any list it bundles (the `FILES` in `rooms-worker/build.mjs`:
  `SpyWords.js`, `CodenamesWords.js`, `PartyContent.js`, `ChameleonWords.js`,
  `SpyfallPlaces.js`, `BombPrompts.js`, `EmojiRiddles.js`, `Proverbs.js`,
  `MonkeyWords.js`, `StopWords.js`, `TriviaQuestions.js`, `SkrewCards.js`, `TimelineEvents.js`,
  `UnoCards.js`, `DominoTiles.js`, `Connect4.js`, `DotsBoxes.js`, `Ludo.js`, `Snakes.js`, `BankAlhaz.js`, `GuessWho.js`, `Hangman.js`, `PlayingCards.js`, `Skull.js`, `Battleship.js`, `Witness.js`, `Dark.js`, `Chess.js`, `Chess4.js`, `TicTacToe.js`, `Bowling.js`, `MiniGolf.js`, `WordleWords.js`, `Countries.js`, `SolveGames.js`, `Estimation.js`, `Wire.js`, `Vault.js`, `Hear.js`, `Missions.js`, `Songs.js`, and the game files bundled after
  `RoomGames.js`, `RoomUno.js`, `RoomDomino.js`, `RoomDuels.js`, `RoomLudo.js`, `RoomSnakes.js`, `RoomBank.js`, `RoomGuessWho.js`, `RoomHangman.js`, `RoomDoubt.js`, `RoomOldMaid.js`, `RoomSkull.js`, `RoomEstimation.js`, `RoomBattleship.js`, `RoomChess.js`, `RoomChess4.js`, `RoomVoteChess.js`, `RoomHandBrain.js`, `RoomBughouse.js`, `RoomBowling.js`, `RoomMiniGolf.js`, `RoomSolve.js`, `RoomTournament.js`, `RoomChairs.js`, `RoomReaction.js`, `RoomBumper.js`, `RoomWire.js`, `RoomVault.js`, `RoomWitness.js`, `RoomExact.js`, `RoomDark.js`, `RoomBox.js`, `RoomHear.js`, `RoomMission.js`, `RoomHum.js`, `rooms-worker/src/`, `docs/` first: the
  deploy also uploads it as the copy of the app the Worker serves. A deploy
  restarts every open room, so wait about a minute before `npm run test:live`.
- **The main address** (`cd tools && npm run deploy:site`): `site-worker/` is
  `docs/` as static files plus one small script that runs only for room links,
  `/r/CODE` (`run_worker_first`), the page a crawler reads for WhatsApp's
  preview; every other request stays a free static-asset request.
- `docs/README.md` and `rooms-worker/README.md` have the details.

### Each game's code loads when it opens (30 Sep 2026)

The published page is a shell (the home and every registry it reads - the
catalog, the translations, `GAME_RULES`, help, icons - nav, settings, the room
engine, the TV frame, sounds, motion) and each game's code is a chunk in
`docs/g/<id>.<hash>.js`: 619 KB gzipped to open the app instead of 1,760.
`tools/lazy-split.mjs` builds the chunks from the code itself and fails the
build on a file in no chunk, a screen it can't place, a chunk cycle, or a
screen button calling code its chunk doesn't load. `JS_Lazy.html` loads a
chunk at every door (`setView`, the cards, «كمّل», «الليلة دي؟», the daily hub,
a room's state; `lzWait`, `lzRun`, `lzEnsure`); a reload onto a game gets its
chunk written in before start-up (`lzBootWrite`). The worker keeps chunks in
`g-chunks` across builds and fetches them all when a build installs, so one
visit still plays every game offline; `docs/g/` keeps the last four builds'
files. The budget is the shell's (720 KB gzipped; raised from 710 by the owner on 2 Oct 2026); `LAZY=0` builds one page.

- **A new game file goes into `CHUNKS` in `tools/lazy-split.mjs`** (or
  `SHELL_FILES` when every screen needs it); a screen it can't place goes into
  `VIEW_CHUNKS`.
- Shell code that calls a game's functions goes through a door (`lzRun(chunk,
  fn)`), and a test that calls a game's code loads its chunk first
  (`lzEnsure(lzChunksOfView('…'))`).
- CSS all stays in the shell (later sections restyle earlier ones, so a late
  stylesheet would change which rule wins); moving it section by section is the
  next saving. Details, the chunk map and the measurements: `notes/lazy-load.md`.

### Testing

These run outside the browser and should pass before a push (CLAUDE.md has the
full order of steps for a change):

```bash
npm run check        # content + i18n
```

- `check:content` validates the game content: a Connections puzzle must have its
  level's number of groups (3 / 4 / 5), four words each, with **no word repeated across groups** (a duplicate renders two
  identical tiles and makes the grid ambiguous), Fibbage questions must contain
  a `___` blank, and the Draw & Guess / Codenames banks must be duplicate-free
  - compared the way a clue is (`normaliseClue`: hamza forms, the article), so
  بير beside بئر or مغرب beside المغرب fails, since a clue could name both -
  and large enough to deal from. The trivia board bank needs at least five
  questions per category and level, no question twice, and no answer written
  inside its own question.
- `check:i18n` compares the `ar` and `en` blocks key by key, fails on a key
  defined **twice** in one block (legal JS, and the last one silently wins — four
  strings were quietly the wrong ones before this check existed), and checks that
  every `data-i18n` attribute in the markup names a real key. It warns (without
  failing) about a `t.key` read with no translation and no fallback, and a key no
  code reads (*Traps*: keys built from parts, a `t` that isn't a table).
- `npm test` in `rooms-worker/` (with `npm run dev` running) plays every room
  game with robot players, in segments side by side: turns, votes, scores, that secrets never reach the
  wrong phone, reconnects, the server's clocks and the shared prompt memory.
  `npm run test:live` runs the same against the deployed server.
- `npm run test:rules` in `rooms-worker/` checks the trivia scoring and question
  count straight against `RoomGames.js`, no server needed, and then runs the
  **leak check** (`test/leaks.mjs`, about a second): every room game is played
  through, start to end, and after every move - a phone's, a computer
  player's, the server's clock - every phone's view and the screen's is built
  with the server's own projection (`rooms-worker/src/view.js`, which `room.js`
  uses too) and searched for what that phone must not know, with the server's
  hidden state (`room._*`, the other slices) as the answer key: the word on a
  spy's phone, a year in a hand, a card of another hand, a vote before it
  closes, an answer before its round is scored, any key starting with `_`. A
  rule that never came up during its game fails the run too, so a check can't
  pass by never looking; `node test/leaks.mjs uno` runs one game. It was
  proved by putting old leaks back into a scratch build (the قبل ولا بعد years,
  the word on the spy's phone, أونو's deck on the pile, a Codenames colour on an
  unturned card): each one failed it.
- `npm run test:ui` in `tools/` (with `npm run dev` running in `rooms-worker/`,
  or the rooms server's address as its argument) is the screen test, in
  headless Chrome over the DevTools protocol, no packages: it builds its own
  copy of the preview and of the published site into a temporary folder
  (`PREVIEW_OUT`, `SITE_OUT` - `.preview/` and `docs/` are left alone) and
  checks, printing ✓ / ✗ like the others:
  - **screens**: every view on one phone at 375x812, 667x375 and 1280x720, in
    Arabic light and English dark - nothing wider than the screen, no control
    off it, no text cut off (text that is only emoji aside), no console error -
    and every game started from its setup's Start; first it proves the check
    catches a button off the screen and a label cut off;
  - **rooms**: every room game dealt to five phones (each its own browser
    context, so its own storage and room session: the *Traps* note about tabs
    sharing one session doesn't bite) and a TV, the host doing what a host does
    first (the lobby open, sides for أسماء الرموز, a phone made a screen for
    الدومينو), the same checks on every phone and the TV;
  - **fixes**: the audit of 23 Sep 2026's fixes that live on the page - a room
    link fills its code, a half-typed name in المشنقة survives others' guesses,
    خمّن مين's face pick has a clock, a chess clock is right after a reload,
    حرب السفن's count waits for the shell;
  - **site**: the offline copy - the second open downloads nothing, a new build
    (the same site under a newer stamp) is switched to by itself on the home,
    waits with a note in a game and switches back on the home with the game
    kept, and Settings → الإصدار says latest, then newer.
  `ONLY=screens,rooms,fixes,site` runs some parts, `UI_GAMES=uno,domino` some
  room games; `CHROME=` points at Chrome. About 4 minutes whole, in shards.
- **How long each takes**, and which to run (CLAUDE.md step 5). Both suites run
  in shards side by side (30 Sep 2026; `notes/tests-docs.md`): `npm test`
  plays its 38 segments (`--only=` names, listed in `SEGMENTS` at the end of
  `play-all.mjs`) four processes at a time, about 4-5 minutes (it was 16
  one after another; `--jobs=6` about 3, `npm run test:serial` the old way);
  `test:ui` (`test-ui-parallel.mjs`) builds the app once and runs 8 shards
  (each screen size, the room games in thirds, fixes, site), each its own
  Chrome, four at a time: about 4 minutes (it was 10; `test:ui:one` the old
  single process). `JOBS=N` sets how many at once for either. `test:live`
  is `npm test` against the live server. **`npm run test:changed`** in `tools/`
  runs only what the changes since master need (`--dry` to see the plan,
  `--files=` to ask about a file): the map from files to robot segments and
  room games is `MAP` in `tools/test-changed.mjs`, and a core file or one it
  doesn't know runs everything. Don't run `npm test` and `test:ui` at the same
  time: eight processes on one PC make the timing checks flaky.
- **Continuous checks** (`.github/workflows/checks.yml`, 28 Sep 2026): every
  push to `master` and every pull request into it runs, on GitHub Actions
  (free, nothing to look after), `npm ci` in `tools/` and `rooms-worker/`,
  `npm run check`, `npm run test:rules` (the rules and the leak check: no
  server, no network, no Cloudflare login) and `node build-site.mjs` into a
  temporary folder (`SITE_OUT`), which fails over the size budget. A red ✗
  on a commit on GitHub means one of them failed: open the run, fix it, and
  push again. It doesn't replace the PC's steps: the robots (`npm test`),
  the screen test and the look in the browser still run here. A check that
  can fail by chance (a random deal that never brings up what it checks)
  makes the ✗ mean nothing, so such a test is made to wait for its case.
- Everything else is exercised in the local preview.

Client-side logs are in the browser console; the rooms server's are
`npm run logs` in `rooms-worker/`.

**Sweeping the UI.** The useful regression check is a computed-style pass over
every view in both themes, not a read of the markup: contrast ratio against the
*composited* background, tap-target size, and horizontal overflow. Two things
will make that pass lie to you:

- **Theme transitions.** `body` carries `transition-colors`, so a sweep taken
  straight after toggling `dark` reads the *old* colours mid-animation. Inject
  `* { transition: none !important; animation: none !important }` first.
- **Emoji.** They carry their own colour and ignore `color`, so every icon reads
  as a contrast failure. Skip elements whose text is only pictographic.
- **A hidden browser window.** Under `prefers-reduced-motion` every property
  change is a 0.01ms transition, and a window that isn't painting never finishes
  one. So padding, heights and a card's flip read as their old values, as if a
  rule weren't applying. Disable transitions and animations (as above) before
  measuring anything. An emulated resize also fires no `resize` event:
  dispatch one yourself, or `--app-h` keeps the old height.

## Development Conventions

### Code Structure
- **No `google.script.run`:** the page talks to nothing but the rooms server, through `Room` in `JS_Room.html`.
- **Frontend Modularization:** When adding a new game, create a new `JS_GameName.html` file and include it in `Controller.html` using `<?!= include('JS_GameName'); ?>`.
- **Translations:** All UI text goes through the `TRANSLATIONS` object in `JS_Translations.html`, with the same key in `ar` and `en` (`npm run check:i18n` compares them). `data-i18n` fills an element's text, `data-i18n-ph` a field's placeholder, and `data-i18n-title` an icon button's tooltip *and* its `aria-label` - a button whose whole label is a glyph (↶) needs the last one, or it says nothing in either language.

### Multiplayer rooms

The core of the room layer follows; the rest - the table of files, computer players, a host away, the voting engine, «التالي لوحده», the chat, the audience, names, sharing - is in `notes/rooms.md`, and each game's room in its `notes/games/` file.

Games that hide information from some players can be played on separate phones
instead of passing one around. One device opens a room; the rest join with a
4-letter code or by scanning its QR.

**A room is a group of people, not a game.** It opens with no game selected and
sits in a hub. The host picks a game, they play it, and it returns to the hub for
the next one — the roster stays put all evening, and nobody re-joins between
games. `chooseGame` and `backToHub` are room-level actions in `applyRoomAction`,
handled before it dispatches to any game.

Someone can also **join mid-round**. They aren't in that round's roster, so they
watch and are dealt into the next game. This is why each game stamps
`shared.roster` when it starts, and why the games reason about the roster rather
than `room.players`: without it, a latecomer counts as a Just One writer who
never submits and the round never advances. A game whose latecomers belong in
it straight away says so with `lateJoin: true` on its `ROOM_GAMES` entry, and
`routeRoomState` draws the game for them instead of the "next round" note: the
duels do (*The duels*), because someone who joins mid-game simply joins the
line and watches the board like everyone else.

**Both modes always work.** The pass-the-phone flow is untouched — the setup
screens for الجاسوس, كلمة واحدة and من أنا؟ carry a `.mode-switch` that reveals
either `.mode-device-panel` (unchanged behaviour) or `.mode-online-panel`.
Codenames is the exception: it is multiplayer-only, because on one phone there
is nowhere to hide the key card.

**The rule that matters: hidden information is enforced on the server.**
Anything a player must not see goes in `room.secrets[playerId]`, and
`Room.project()` sends a player only their own slice. A Codenames operative's
state contains no colour information at all, and an imposter's payload never
contains the secret word — so there is nothing to find by inspecting network
traffic. Never move that logic client-side. Player ids are visible to everyone,
so each phone also holds a `key` the server issued to it alone; the socket and
every HTTP call must present it.

**How a move travels.** Each phone keeps one WebSocket to its room
(`/ws?code&pid&key`). On connecting it is sent the full state; after that the
room pushes a fresh projection to every phone whenever anything changes —
presence included, which is simply "has an open socket". A move is
`{ t: 'act', id, action, payload }`; the phone that moved gets `{ t: 'ack', id,
ok, state | error }` and everyone else `{ t: 'state' }`. `Room.act()` resolves
with the new state, as it always did.

- **Heartbeat:** the phone sends `ping` every 25s and Cloudflare answers `pong`
  itself (`setWebSocketAutoResponse`) without waking the room. A socket that
  doesn't answer is replaced — a phone back from the lock screen can hold one
  that looks open and is dead. Waking the screen or getting the network back
  calls `Room.refresh()`.
- **Reconnect:** a dropped socket retries after 0.3s, 1s, 2s, 4s, 8s. From the
  second miss the phone also keeps playing over HTTP (`/act`, `/poll` every
  2.5s) until a socket connects again.
- **Strokes travel as patches.** `addStrokes` goes out as `{ t: 'strokes', from,
  v, add }` — just the new strokes, applied only onto exactly version `from`;
  anything else asks the room for a full `sync`. Resending a whole drawing to
  every phone several times a second would be most of a phone's data.
- **The line under the drawer's finger** goes out as `{ t: 'live' }` through
  `Room.sendLive` / `Room.onLive`: relayed to the other phones, never stored,
  and only accepted from the current drawer.

**Where state lives.** The room object is kept in memory and saved to the
Durable Object's storage on every move (drawing at most
once a second). A sleeping room costs nothing and wakes with its state intact.
A room deletes itself after 6 hours with no moves and nobody connected, or 24
hours with no moves at all. A host whose phone has been gone 2 minutes hands the
room to someone still here - a screen host too (a TV hosting a room used to
keep it for good). "Online" is a socket heard from in the last 70 seconds (its
last auto-answered ping, `getWebSocketAutoResponseTimestamp`, or its open
time): a phone that died without closing its socket used to count as online
forever, so the handover never started. The alarm closes silent sockets and
watches the host's, so a room with a connected host wakes about every 70s. A
timeout that throws is not retried for 30s (`failedDeadline`), so a bug can't
spin the alarm on the free plan - and neither is a timeout that ran but left
the same deadline in the past. The alarm is never set less than a second
ahead (`ALARM_FLOOR_MS`), and a room past its 6 idle hours with a phone still
connected looks again every 10 minutes (`IDLE_RECHECK_MS`), not at once: a
Durable Object alarm set in the past fires straight away, and that room used
to wake in a loop until the phone left (*Traps*).

**Opening rooms is limited per address.** `/create` answers 429 after 60 rooms
from one address in 10 minutes (`CREATE_LIMIT`, `CREATE_WINDOW_MS` in
`index.js`, keyed on `CF-Connecting-IP`), so a script can't fill the free
plan's storage with rooms. A table opens a handful in an evening; `npm test`
opens about twenty.

**Leaving mid-round.** `removeDevice` in `room.js` does a leave and a `kick`
the same way - the secret and key go, the host passes on, "left" is said in
the chat - then calls `roomPlayerLeft(room, pid, name)` in `RoomGames.js` on
a copy (a throw is logged and the leave still happens). Each game lets go at
once: every "has everyone written/voted/answered?" check runs again, their
ballot goes and the vote may close, a turn or the bomb they held moves on, a
guess only they could make is settled as the host's skip would; مافيا marks
them out (they no longer count as alive, so the game can end), ربع قرد drops
them from the order, أسماء الرموز frees their slot, زي الكل drops their
answer. **A new room game needs its case in `roomPlayerLeft`.** Names are
compared on join with the same fold as everywhere else (`sameRoomName`), so
أحمد and احمد can't both sit in one room.

**Clocks the server keeps.** A timed round has to end even when no phone is
awake to end it. `roomDeadline(room)` in `RoomGames.js` says when to look again
and `roomTimeout(room, now)` acts on it: a Trivia question closes, a Draw & Guess
round reveals its word. Phones still end rounds on time themselves; the server is
the backstop a moment later.

**A phone reads a running clock by the server's time.** Every projection
carries `serverNow` (the server's `Date.now()` as it was sent, `view.js`), and
the room engine stamps each one with `receivedAt` as it arrives (`arrived` in
`JS_Room.html`). The smallest `receivedAt - serverNow` seen is the network's
share, so a phone that has just reloaded or joined shows a chess clock (and
mini golf's moving pieces) right at once. It used to learn the gap from the
clock's own start stamp, which after a reload is as old as the move being
thought about: the audit of 23 Sep 2026 found a player 40 seconds into a move
shown 40 seconds too many. Measure from the arrival, never from the drawing: a
screen that isn't showing draws its update seconds later.

**One fold for typed text.** Every place one typed word meets another goes
through `normaliseClue` in `RoomGames.js`: a Just One clue against the other
clues, a Codenames clue against the board (and a room's own words against
the bank), a Fibbage lie against the truth and the other lies, a Draw & Guess
or Fake Artist guess against the word. It folds case, diacritics, the
tatweel, أ/إ/آ/ٱ to ا, ة to ه, ى to ي, ؤ to و, ئ to ي, punctuation, spaces,
and a leading "ال" or "the", so الأسد, أسد and اسد are one word. The client
has the same function as `foldWord` in `JS_Core.html` (the Codenames clue
check on the phone, the one-phone Just One) - keep the two identical - and
`tools/validate-content.js` folds the banks the same way, so a list cannot
hold one word in two spellings. `foldStopAnswer` is the exception because in
Stop the Bus the first letter matters (see *أتوبيس كومبليت on separate
phones*). Player names fold through `samePlayer` on the phone and the same
letters on the server's join.

**Room clocks stop when the room moves on.** A game's phone clock registers
its stop with `onRoomClocksReset(stopFn)` (JS_Room.html); the router calls
every one when the game, the lobby-or-not, or `shared.dealId` changes, or the
room is gone, before anything is drawn. `onEnd` handlers still check
`Room.state.game` - a Spyfall alarm used to ring in the middle of the next
game, and a stale Draw & Guess clock sent `giveUp` into ربع قرد.

**The host can always get a room moving.** `roomHostRow` draws small ghost
buttons where a round would otherwise wait on a phone that's gone: كلمة واحدة
`closeWriting` and `skipGuess`, فيبج `closeWriting`, أسماء الرموز `passTurn`
and `setSpymaster` (redrawn in place, so a spymaster typing a clue isn't
interrupted). An offline player carries a ✕ for the host (`roomKick`, room
action `kick { playerId }`, the same path as leaving) in the lobby, the player
strip and on the TV. The TV draws the same host controls as the phone for
every phase. The lobby's setup panel isn't redrawn while one of its fields
has focus, and the host's choices (spy count and category, the Who Am I
category, the Draw & Guess round length) are remembered on their phone, so a
latecomer joining no longer resets them.

**Taps say what they were drawn for.** A double tap on a host's verdict used
to hit the next player too. Per-round actions carry what the phone saw, and
the server ignores a stale one: `nextRound { round }`, الجرس
`correct`/`wrong { id }` (the first buzzer), ربع قرد `penalty`/`skip
{ target }`, الفنان المزيف `skipTurn { turn }`, ارسم واكتب `submit { step }`,
أتوبيس كومبليت and زي الكل `submit { round }`. Every field is optional on the
server, for a phone still running an older page. Client memory of what was
already sent is keyed on `shared.dealId`, a fresh id on every deal.

**Content.** `PartyContent.js` holds Would You Rather, Most Likely To and Fibbage
server-side — Fibbage *must* be there, because its real answer cannot reach a
client before the votes are in. Draw & Guess has its own `DRAW_WORDS` list —
it used to borrow `CODENAMES_WORDS`, which is full of things nobody can draw
(وقت, حلم, صوت, سر).
Connections lives client-side in `JS_Connections.html`, because it is
single-device and has nothing to hide.

Connections has three lists, one per level: `CONNECTIONS_EASY` (3 groups),
`CONNECTIONS_DB` (4) and `CONNECTIONS_HARD` (5 groups of close neighbours, like
capitals of different continents). Every group is four words with **no word
repeated across groups** — a duplicate renders two identical tiles and makes the
grid ambiguous. There is a validator for this; run it after editing content.

**Big screens (شاشة العرض).** A TV, or a laptop plugged into one, joins a room
as a *screen* rather than a player: `/create` or `/join` with `screen: true`
puts it in `room.screens`, not `room.players`.

- Nothing deals to a screen: it counts toward no player minimum and is on no
  roster.
- `project()` never gives it a secret: `you` is always null and `youAreScreen` is
  true.
- It can still be the host.
- `becomeScreen` and `becomePlayer` switch a device between the two in the lobby,
  for a phone mirrored to the TV, say.

On the client, `routeRoomState` hands a screen to `renderRoomTv` in
`JS_RoomTv.html`. It draws the lobby (the code, the QR, the game picker), and
each game through its `TV_GAMES.<id>` renderer:

- `sig(state)`: when to rebuild.
- `frame(state, t)`: the markup.
- `after(state, rebuilt)`: canvases and clocks.

Every renderer draws the host's buttons too, because a room hosted from a laptop
has no phone to press them on. Rules that let the table act from the screen check
`isRoomScreen`: a Codenames guess or pass counts for the team whose turn it is.

**The lobby** (`tvLobby`): the QR and the code on one side, the players on the
other, both columns from the top and the pair in the middle of the stage's
height while it fits (`align-items: start; align-content: safe center`). A TV
that is the host has the game list or the chosen game's options there; one that
isn't shows the game chosen (its icon, name and line) and a tile for everyone in
(`.tv-lobby__players`, a new one popping in once, `motionFirst`), then the
waiting line - it used to be a heading and a line centred in an empty half of a
1080p screen (the owner, 26 Sep 2026).

The view is `room-tv`: full screen, with `body.is-tv-view` and sizes from `vmin`
in the BIG SCREEN block of `Style_Screens.html`. Phone components reused there
sit in `.tv-scale`, which zooms them in steps. Phone and TV frames share element
ids (the canvas, the timers), so drawing one kind clears the other. A new room
game needs its `TV_GAMES` entry as well.

**Adding a game to the room layer**

1. Write its rules in a `Room<Game>.js` of its own, add it to `FILES` in
   `rooms-worker/build.mjs` (after `RoomGames.js`) and its branch to
   `applyRoomAction` in `RoomGames.js`. Put anything private in
   `room.secrets[playerId]`, anything shared in `room.shared`.
2. Register `ROOM_GAMES.<id>` on the client with `lobbyOptions(state)`,
   `startPayload()` and `render(state)`.
3. Add a `view-room-<id>` container and a `VIEW_META` entry.
4. Give its `GAME_LIST` entry in `Games.js` a `room: { min }` (the fewest people
   to start it; it greys out its tile below that): that puts it in a room's list
   (`ROOM_HUB_GAMES`) and the server's `ROOM_GAME_IDS`, and its `crew` title.

5. If it has a clock, add it to `roomDeadline` / `roomTimeout`. If it deals from
   a list, deal through `nextPrompts` from an action named `start`, `nextRound`
   or `playAgain` (`DEAL_ACTIONS` in `room.js`), so the shared prompt memory is
   loaded for it.
6. Add a round of it to `rooms-worker/test/play-all.mjs`, a driver (a whole
   game) and its secrets to `rooms-worker/test/leaks.mjs` - the leak check fails
   on a room game it can't play - then `npm run build:site` in `tools/` and
   `npm run deploy` in `rooms-worker/` — in that order, because the deploy
   uploads `docs/`.
7. Its `GAME_LIST` entry (`Games.js`; see *The catalog and the home screen*) has
   `modes: ['room', 'tv']`, or it is not on the menu; and a `TV_GAMES` entry.
8. Give it a case in `roomPlayerLeft` (what happens when someone leaves
   mid-round), guard its per-round host actions with `staleTap` on what the
   phone saw, register its phone clocks with `onRoomClocksReset`, and give the
   host a way forward (on the phone and the TV) wherever the round waits on
   one phone.

### Switching a game off for a fix

`DisabledGames.js` at the root (the owner, 28 Sep 2026: "disable any game
while it is being upgraded or fixed ... later a one-word change"). **To switch
a game off, put its id in `DISABLED_GAMES`; to switch it back on, take it out;
then release as usual** (build the site, deploy the rooms server and the site).
The id is the game's `GAME_CATALOG` id, the same as its room game's; chess is
`shatranj` (its room game `chess` goes with it, `roomGameIsOff`), and `chess`
alone is the chess clock tool.

The file is shared (`SHARED_LISTS` in the page, `FILES` on the server). On the
page (`JS_Catalog.html`): `catalogOff(id)`; a switched-off game's card is grey
with «🛠️ بنصلّحها» (`gameOffBadge`, `.is-off`, section 52 of `Style_Rooms.html`)
on the home, in the recent row (just 🛠️), in chess's ways row and in a room's
list on the phone and the TV; a tap only says why (`gameOffToast`); it leaves
«الليلة دي؟», the featured poster and the first-visit cards; `catalogOpen`,
`catalogQuickStart` and the daily hub (`playDaily`, the archive) refuse it; and
`setView` sends any screen of it home (`gameOffForView`: its setup screen, or a
screen whose `up` is that setup) - so a reload into it, a link or an old
shortcut can't open it. On the server `chooseGame`, `start` and `playAgain`
throw for it (a phone still on an older copy), and so do `nextRound` and
`tourNew` once its game is over (a duel's next game in winner stays, a new
tournament). A room already playing it when it is switched off plays that game
to its end, rounds and moves included. Tests: `rules.mjs` ("Games
switched off").

### The games' language

`contentLang()` in `JS_Core.html` is the language the games' *content* comes
in: Settings → "لغة الألعاب" (`appState.gameLang`: `auto`, `ar`, `en`,
cycled by `cycleGameLang`) can pin it, for a table that reads the app in
English but plays with Arabic words, or the reverse; `auto` follows the
app. Every bank lookup, `freshPick` key and room start payload goes through
it - `VOTE_LANG()` is now just `contentLang()` - and never through
`appState.lang`, which is the language of the interface only. The Wordle
keypad follows the content language too, since it types the word.

### Traps this codebase has already fallen into

**A file that patches another file's registry entry depends on load order.**
After the lazy split (30 Sep 2026) the tournament wrapped the duels when its own
chunk ran - before dots, X-O, خمّن مين, حرب السفن and شطرنج had registered - and
the quiz chunk overwrote the emoji router the solve chunk had installed: on the one
page the include order hid both, and no test switched a room to a tournament (the
audit of 1 Oct 2026). A game wraps itself when it registers (`tourWrap('dots')` at
the end of its file), a second writer of an entry yields to the first
(`svRouter`), and `checkRegistryOrder` in `tools/lazy-split.mjs` fails the build
on an entry set twice, read before it is set, or wrapped before it registers.

**Text from a player is never parsed as HTML, not even in an element that is never
shown.** `shareCardText` read the share card's footer (champions' names) through
`innerHTML` on a detached `div`; an `<img onerror>` fires there too, so two
room names of 20 and 11 letters ran script on the phone that tapped 📸 (the audit
of 1 Oct 2026). Read markup's text through `new DOMParser().parseFromString(...)`,
an inert document.

**A board is the roster's.** A latecomer watching is in `room.players`, so a
board built from it banked them on the night (in القنبلة, 0 strikes put a watcher
first), and a board with no `score` (ربع قرد) or no player rows (أسماء الرموز's
cards) banked nothing. `nightBoardOf` (RoomGames.js) keeps the people who played
and ranks teams through `PROGRAM_TEAMS`; a new game's board carries a `score`, best
first, and is read through it. A board that is a tally across play-again (كدّاب, الشايب, جمجمة)
is not this game's places: such a game registers its own result in `ROOM_RESULT_BOARDS`
(and `NIGHT_FROM_RESULT`), and the room's night and برنامج السهرة both place a game through
`nightPlacesOf` - one function, so the two tables never disagree (the review of 1 Oct 2026).

**A chunk runs after DOMContentLoaded.** A game file that paints at start-up
must paint at once when `document.readyState` isn't 'loading', and a registry a
shell file reads once (`SOLO_LATE`) has to take late entries. A chunk is
several scripts joined, so one that throws at load stops the rest of its chunk.

**An outside service can answer your PC and refuse Cloudflare.** دندنها's songs
streamed on `wrangler dev` and in every local test, and gave 0 bytes on the
live server: Apple's lookup (`itunes.apple.com/lookup`) answers 403 to
Cloudflare's servers (its search 429), while its audio files load fine from
there (1 Oct 2026, found by `npm run test:live`). An Apple song keeps its
preview's address in `Songs.js` (`u`, refreshed by `npm run check:songs --
--fix`). Anything the rooms server fetches from outside is tried from the edge
(`wrangler dev --remote` with a scratch Worker) before it is relied on.

**A `wrangler dev` on a port already in use still prints "Ready".** Tests then
hit another session's server. Check the port's owner first
(`Get-NetTCPConnection -LocalPort …`). And two servers of the same Worker
on one PC (parallel builders) write one dev-registry file; one dies with
EPERM mid-test (1 Oct 2026). Give each its own `WRANGLER_REGISTRY_PATH`.

**A style a test adds to `<head>` loses to the app's own.** The page's stylesheets are
in `<body>` (the logo comes first), so a rule injected into the head with the same
weight is overridden and a "before" screenshot silently shows "after" (30 Sep 2026).
Append test styles to `document.body`, and read the computed value to be sure.

**A timeout must do everything that is due, or the room waits 30 s.**
`room.js` gives a timeout that leaves its own deadline still in the past a
30-second rest (`failedDeadline`, against an alarm that loops). سلك مقطوع's
card ended in one timeout and its first orders were due in the same moment,
so they came 30 s late and the robots never saw an order (29 Sep 2026). The
card's end falls through into the orders now (`wireTimeout`), and
`wireDeadline` doesn't count an order waiting on the shake. A game whose
timeout moves one phase into another that is already due does both in one
pass.

**A robot reads the server's time through the gap, never its own clock.** On 29 Sep 2026
`play-all.mjs --only=snakes` failed live twice ("people roll on their turn once the table has
seen the last roll") and passed locally: this PC's clock was 8.3 s behind Cloudflare's, and the
robot slept until `readyAt - Date.now()`, so every roll was 8 s late and only one fit in the
minute. The game was right - a phone turns `readyAt` into its own time with the smallest
`receivedAt - serverNow` seen (`snkReadyLocal`), so a fair roll is never dropped. The robot does
the same now, and counts a roll only when the ack's `turnSeq` moved (a dropped tap is acked ok
too). Any test that compares a server stamp (`readyAt`, `endsAt`, `nextAt`) with `Date.now()`
has to convert it first, or it passes on a local server and fails on the live one.

**A screen's signature must include everything its frame decides.**
`renderRoomTv` asks `TV_GAMES.<id>.sig(state)` before it calls `frame()`. المشنقة's TV
started its hold (`hmRoomHold`: the guessing frame kept on while the last moment plays)
inside `frame()`, so the signature said "no hold" while the held frame was drawn; when the
hold ended its timer redrew, found the same signature, and the TV stayed on the guessing
frame with no result and no "next word" until something else in the room changed (the audit of 28 Sep
2026). The signature now decides the hold first (`sig: (state) => { hmRoomHold(state,
true); return hmRoomSig(state); }`), as سكرو, أونو and the card games decide their
endings in `sig`. Anything a frame reads from page state - a hold, a busy flag, a moment -
is settled before (or inside) the signature, and a timer that redraws later goes through
`routeRoomState` only on a room screen (`onRoomView()`), or it drags a player back.

**A clock kept "for the same deadline" may be one `setView` stopped.** The
room renderers keep their turn clock while the deadline is the same
(`if (x.clockKey === endsAt && x.clock) return;`), but leaving the room screen
runs `clearAllIntervals`, which stops every clock; coming back found the dead
clock under the same key and the badge stood still (the audit of 28 Sep 2026,
eighteen renderers). The guard asks `x.clock.isRunning()` too - a new clock
kept for a deadline does the same.

**`onRoomClocksReset` runs for every game, not just its own** (the audit of
28 Sep 2026). The router calls every registered stop whenever the game, the
lobby or the deal changes, in any game. عربيات التصادم's stop left
fullscreen whenever `document.fullscreenElement` was set, so a laptop TV put
in ⛶ (`toggleTvFullscreen`) dropped out of it at every game's start; and
شطرنج and باغ هاوس each threw away the one chess board the other was about to
draw on. A stop undoes only what its own game started: remember it (bumper's
`bmp.locked` for the fullscreen it asked for) and touch nothing when that game
isn't running; leave shared pieces (the chess view) to whichever game uses
them next.

**A scheduler holding an old AudioContext goes silent after `wakeAudio`
replaces it** (the same audit). A lookahead loop or a long sound that kept
`const ctx = fxCtx()` from its start (the chairs' music, bumper's engine,
bowling's rumble) played on into a context iOS had left stuck, and when a tap
made a new one it heard nothing for the rest of the round. Read `fxCtx()` on
every tick, and when it has changed, rebuild the nodes (or reset the timeline
to the new `currentTime`) on the new one.

**A board is best-first, and some games win low: read row order, never the
biggest score.** Every game's `shared.board` is sorted with the winner first,
and القنبلة (strikes), الشايب (losses), ميني جولف (strokes) and سكرو (points)
sort ascending. `settlePredictions` took `Math.max` of the scores, so «مين
هيكسب؟» told the room that whoever picked the loser had called it (the audit of
28 Sep 2026). The winner is `board[0]` and whoever shares its score, as
`bankNightPoints`, `renderPodium`'s callers and `shareRoomResult` already read
it. A tally (votes, wins, the night's points) is higher-is-better and may use
`Math.max`; a game's board may not.

**A `:has()` above a universal subject taxes every DOM change.**
`[id^="view-setup-"] :is(.field, div):has(> .field__label:first-child + .stepper)
> :not(.field__label, .stepper)` looked scoped to the setup screens, but Chrome
matches right to left: every element's parent was checked with `:has()`, and
every `innerHTML` anywhere - a room's state push, a filter chip - re-checked
`:has()` state up and across the tree. That one rule was half the style
recalc of every room screen (8 s of أونو: 1,865 ms → 89 ms at 6x throttling
without it). Putting a class before the `:has()` in the same compound did not
help; a class in the markup did (*The design system*, *Performance*). Measure a
selector by removing it through the CSSOM and rebuilding a view's markup N
times (`Performance.getMetrics`' `RecalcStyleDuration`); Chrome's selector
stats in a trace inflate the matching time about ninefold and missed it.

**A plug-in's board field is the engine's once it is named the same.** The
solve engine stamps a done board with `b.at = Date.now()` (its seconds), and
إيه اللي يجمعهم؟'s race board kept its current round as `at` too - a finished
board pointed at round 1,790,512,033,850. A plug-in names its fields for
itself (`cur`); before adding one, read what the engine writes on a board.

**The rules tests read the built bundle, not the sources.** `rules.mjs` and
`leaks.mjs` import `generated/rules.js`; an edit to `Pinpoint.js` or
`ConnectionsWords.js` does nothing to them until `node build.mjs` has run
(the dev server rebuilds it, a test on its own does not). Three "failures"
of 27 Sep 2026 were a stale bundle.

**A script that inserts at an anchor must match the anchor only.** The
race's eight test blocks were meant to replace the trailing `// RACE:<id>`
anchors; the regex also matched `// RACE:engine` at the top, so the blocks
landed before the `let r` they used ("Cannot access 'r' before
initialization"). Anchor lines get a shape nothing else in the file has.

**A `<details>` drawn open fires its `toggle` too.** The lobby's folded
options remembered "the host opened it" from the toggle event, and a details
written into the page with `open` fires that event by itself - so the options
never folded again. The handlers (`lobbyOptsToggled`, `firstPlayToggled`)
compare with the state the markup was drawn in (`data-r`) and only count a
change.

**A minifier can make a page bigger.** esbuild escapes every character outside
ASCII by default, so the first minified build turned each Arabic letter (two
bytes) into `\u0627` (six): whitespace went and the page barely shrank. Pass
`charset: 'utf8'`, and measure the gzipped size, not the character count.

**"1 / 3" with spaces reads "3 / 1" in an Arabic line.** The slash joins two
numbers only when it touches them; with spaces round it each number is a run of
its own, and a right-to-left line lays them out right to left (measured in the
page: the 3 sits left of the 1). "1/3" with no spaces is safe. The party games'
counters (the relay's turn, خبّي الموبايل عن … · 1 / 4, كلمة واحدة's round,
ارسم واكتب's chain and step) go through `ltrFrac(a, b)` in `JS_TeamRelay.html`,
which holds them left to right (LRI … PDI); since 26 Sep 2026 the room files
and the TV do too (the trivia and vote counts, the quiz cards, صدق ولا كذب) -
grep `} / ${` before adding another.

**One lost brace puts the rest of the stylesheet under a media query.**
Section 34 of `Style.html` ended its `@media (prefers-reduced-motion: reduce)`
block without its `}` and lost the `/* ====` that opened section 35's
comment, so from 24 Sep 2026 every rule after it - باغ هاوس, شطرنج الأربعة,
the chess hub's row, the host's name menu - applied only on a device asking
for reduced motion. Nothing failed: a headless Chrome reports reduced motion,
so every screen test and screenshot saw the rules working. Found when a new
section (38) had no effect in a check run with motion on. After editing
a `Style*.html` part, count `{` against `}` and `/*` against `*/`, and look with
`prefers-reduced-motion: no-preference` emulated.

**A size container gives its grid column no width.** شطرنج الأربعة's board
sits in `.ch4-stage`, a `container-type: size` box (its pieces and chips are
sized in `cqw`), and on a phone on its side and a laptop that box was in an
`auto` grid column. Size containment means the box has no size from its
content, so the column came out narrower than the board and the column beside
it slid under the board's right side. Put the width on the grid item itself
(`.ch4-game__stage`, `.ch4-tv__stage`) and let the container fill it. And a
class name is one name in the whole page: `.ch4-dot` was first the legal-move
dot (absolute, a third of a square) and then the log's colour dot, and the
second rule inherited the first's `position: absolute`.

**A headless Chrome shows no animation unless told to.** It reports
`prefers-reduced-motion: reduce`, so `motionOff()` is true and every move
lands without its motion: a screenshot "mid-move" shows the move done. Emulate
`prefers-reduced-motion: no-preference` (`Emulation.setEmulatedMedia`), and
to photograph a 3D move mid-way replace the page's `performance.now` and
`requestAnimationFrame` with a manual clock in the test (virtual time did not
hold it).

**A vote on a chess board must give the piece back.** The chess board's
drag leaves a dropped piece on its new square when `onDrop` says it was
played, waiting for the next position to carry it; a vote plays nothing, so
the piece sat on the wrong square until the next redraw. A vote's `onDrop`
returns `'pre'` (the premove's answer): the piece goes home and only the
arrow stays. And in a CDP run the duels' pill scores of a tab that is not in
front stay at the old number (`countUp` waits for a frame): activate the
target before reading or screenshotting them.

**A page can't be opened from an answer that came through a redirect.** The
offline copy saved `./index.html`; GitHub Pages answers that directly, but
Cloudflare (the second address, and the rooms server's copy) answers it with a
307 to `./`. The worker kept the followed answer, and every open after the
first failed with ERR_FAILED - the owner found it on the second address the
evening it went up. The worker now saves the page from `./` (answered directly
everywhere) and rebuilds any redirected answer as a plain one (`clean` in the
worker, `tools/build-site.mjs`); `npm run test:ui`'s server redirects
`index.html` the way Cloudflare does, so the site part would catch it again. A
phone with the broken worker recovers by itself on the next open but one: the
failed open still fetches the new `sw.js`.

**What reads the address has to run before the build's script at the end of
`<head>`.** That script (`RUNTIME` in `tools/build-site.mjs`) takes `?room=`
and `?install=` off the address, so a reload doesn't reopen the join screen.
`window.SERVER_DATA.room` reads the code from the address, so it stays in
`<head>` above it. Moving it into `<body>` with the styles (23 Sep 2026, the
logo-first change) would have opened every room link on the home screen
with no code - caught before it shipped.

**The logo comes first in the page.** Controller.html keeps only the small
intro styles and the page data in `<head>`; `Tailwind.html`, the `Style*.html` parts and
the shared rule files (`SHARED_LISTS`) are in `<body>`, after the intro and
its two small scripts. A first visit on a slow connection used to be a black
and then a white screen until 1.4 MB (400 KB compressed) had arrived; the logo
now comes after 14 KB. Don't move anything big above `#app-loader`.

**A play-once key must carry the deal, not only the round.** A room's round
starts at 1 again at every new game from the hub and every new tournament, and
a capped list's length stops changing once it is full. The duels keyed their
motion, sounds and confetti on the room code and the round, خمّن مين its answer
bubble on the log's length (kept at 8): the next tournament's games, a second
game from the hub, and every question after the eighth played silently. The
keys carry `roomDealKey(state)` now, خمّن مين a counter that only goes up
(`s.logSeq`), and a tournament's game number is `t.no * 1000 + gameSeq`. The same
mistake kept only the first chess game of a room for review (`chRoomGameKey`
has the deal in it now).

**A translation key built from parts is invisible to the "never referenced"
warning.** `check:i18n` finds `t.together_how`, not `t['together_step' + n]`,
so the clean-up of 20 Sep 2026 removed the three «إزاي بتشتغل؟» steps of the
مع بعض tab as unused, and the tab showed 1, 2, 3 with no words until the
owner noticed on 24 Sep. Since 3 Oct 2026 the check counts a key as live when the
code builds its prefix or suffix (`'mg_h_' + id`, `` `ch_piece_${p}` ``,
`'together_step' + n`, `key + '_line'`), and its list of unused keys went from
662 to the few really dead. Still grep a key's prefix before removing it: a key
assembled any other way is invisible to it.

**A play-once memory is empty after a reload.** `motionFirst` and `duelOnce`
live in the page, so a reloaded phone, a late joiner and a TV coming on used
to replay the last disc, its sound, the win line and the confetti. A room
screen marks what is already on the board as seen the first time the page
sees that game (`duelRoomFirstSight`), before it draws; a new game from then
on animates as always. And a host button that moves a round on (skip, undo,
next) must send what it was pressed for, or a double tap does it twice: the
audit of 24 Sep 2026 found eight that didn't.

**A 3D screen has to ask, when three.js arrives, whether it is still wanted.**
Leaving mini golf while three.js was loading found nothing to dispose; the
course was then built into the hidden screen and drew 30 frames a second in
the background until golf was opened again. `mg3Mount` and `bowlGfxMount`
check the screen after loading and let go (chess and battleship already did).

**Redrawing a room screen with innerHTML wipes what is being typed.** المشنقة
rebuilt its frame on everyone's progress, so a name typed in the whole-word box
vanished whenever someone else guessed a letter. `hmKeepTyping` /
`hmRestoreTyping` keep the value, the caret and the focus across the rebuild
(خمّن مين does the same with `gwLocal.typed`). Any room screen with a text
field needs one of the two.

**A setter's place in the order is a number: move it when the order shrinks.**
المشنقة and "one sets, everyone solves" count the next setter from `setterAt`.
Someone before it leaving shifted everyone after them, so one player set twice
and the next was skipped; `setterAt` now moves back one when someone at or
before it leaves.

**`wrangler dev` on Windows fails when its storage path is too long.** A copy
of the project deep in a temp folder answered every room with "internal
error" (SQLite behind the Durable Objects hit the path limit); `--persist-to`
a short folder fixed it. Also: `.preview/` has one fixed place, so a second
session building its own preview overwrites the first's.

**A room screen's signature must carry the deal.** ارسم وخمّن keyed its frame
on the round, the drawer and the phase; going back to the hub and dealing the
game again is round 1 with the same drawer, so the drawer's phone kept the last
deal's frame - its word - while the server had dealt a new one (the owner, 23
Sep 2026: "the same word again and again"). `renderRoomFrame` now puts the
room's code, game and `shared.dealId` in front of every signature, the drawing
screen keys on `roomDealKey`, and the TV's signature has the deal too. A screen
that compares its own signature must do the same.

**A sound bug that a refresh fixes is a stale audio context.** On iOS a
context that was interrupted by another app (the camera, WhatsApp, the share
sheet) can stay silent however often a tap resumes it; only a new one works.
Detect it (not running, or its `currentTime` not moving, a moment after a tap)
and replace it in the next tap (*The soundboard*).

**A game's clock branch can catch a room that isn't playing that game.**
`gameTimeout` ends a card of any `QUIZ_GAMES` room (`if (QUIZ_GAMES[room.game])
{ closeQuizCard(room); return true; }`), so an emoji room on the engine
(one sets, everyone solves) would have had its deadline "handled" by the
quiz - nothing closed, `true` returned, and the round never timing out. The
engine's check comes first in `gameTimeout`. A game that gives an existing
room a second way checks every per-game branch (the clock, leaving, the turn)
for the room's own state, not just its `room.game`.

**A number secret is any count.** The leak check finds a value anywhere in
a view; a secret number (خمّن الرقم's 7) is also a score, a round or a try
count, and a solver's own narrowed range may land on it. Its probe looks for
the number outside the places that hold counts, and another probe checks
that a solver's board is exactly its own.

**Stopping `wrangler dev` through its shell leaves it running on Windows.**
The background task's shell dies and the node process under it, with its
`workerd` children, goes on holding the port; a second `wrangler dev` on the
same port then starts beside it, and requests to the port hang. Kill the
node process by its command line (`--port NNNN`) with `taskkill /T`.

**A name the app already uses is taken in every file.** The chess game
could not be `chess` on the page: the chess clock tool is the help entry
`chess`, the catalog tool `chess` and the screen `play-chess`, and the room
lobby asks `helpEntry(Room.state.game)` for the rules of the game chosen, so a
room game called `chess` would have opened the clock's rules. The game is
`shatranj` on the page and `chess` in rooms, and `ROOM_HELP_KEY` (JS_Utils)
maps a room game to its help. Before naming a game, grep its id in
`HELP_ENTRIES`, `GAME_CATALOG`, `VIEW_META` and the view ids.

**`scrollIntoView` on an item in a scrolling list scrolls the page too.** The
chess review kept the current move in sight with it, and on a phone every
step scrolled the board off the top of the screen. Set the list's own
`scrollTop` instead.

**A duel's `shared.board` is its scoreboard, and كونكت ٤'s `mode` is 4 or 5
in a row.** إكس أو's grid was first `shared.board`, and `duelAction`'s start
overwrote it with `scoreboardOf(room)` - the room game had no squares. It is
`cells`. And the tournament's start first said `mode: 'tour'`, which كونكت ٤'s
own start payload (`{ mode: 4 }`) overwrote, silently playing winner stays;
it is `tournament: true`. Before naming a field of a room game's shared state
or start payload, read what the game (and the duels' helpers) already put
there.

**Physics that passes a test can still be wrong everywhere else.** The first
bowling pins passed "a pocket hit strikes more often than not" - and struck
from 40% of head-on hits and more than half of the crossovers, because the
test only looked where a strike was expected. Measure a physics model over the
whole range of inputs against what should happen at each (a table of strike
rates by spot and angle, and the leaves), not at the one spot a test names.
And a formula written from absolute directions (`nx * 3.1 - ny * 1.7`) breaks
mirror symmetry: build it from the contact's own normal and relative velocity
(a cross product flips sign in a mirror, as it should).

**Read a gesture where it was drawn.** A bow in the bowling swing, measured on
the lane, was flattened to nothing by perspective (the far half of the push is
metres long on the lane and a few pixels on the screen); the same bow measured
on the screen is what the thumb drew. A direction, on the other hand, belongs
on the lane, where the ball rolls.

**A course's box is not the course.** ميني جولف's scattered trees kept off
the green grown outward from its box's middle, which is right for a rectangle
and wrong for a hole that turns a corner: bushes grew in the elbow of an L,
their crowns over the rail. They keep a distance from every edge of the green
now. And a tall piece of scenery placed "beside" the course can stand between
it and the camera: on a phone on its side and on a big screen the camera looks
from the +x side, so a building there hid half a hole in landscape while the
upright view was fine. Look at every hole both ways round.

**A maze written as a list of open passages must read them either way.** The
first hedge maze listed its passages as 'a|b' and checked only 'a|b', so the
ones written the other way round became walls and the maze had no way through
(the test's search said so at once). Normalise a pair before looking it up.

**The rules tests have no prompt memory across rooms.** `nextPrompts` reads
the shared memory through `PropertiesService`, which `rules.mjs` doesn't have,
so each room there only remembers its own deals. A test that holes don't come
back across games deals them in one room (back to the hub and start again);
across rooms is the live server's job.

**A half-pipe is a pipe until you check which half.** The bowling gutters
are half of a `CylinderGeometry` (`thetaStart`, `thetaLength` π) turned
along the lane, and with `thetaStart` π/2 the turn left the *upper* half: two
pipes lying on the lane's edges instead of two channels below it. Drawn dark
and one-sided, it read as "a black pipe on both sides" (the owner), and a
ball in the gutter was half inside it. `-π/2` gives the lower half; the
material is `DoubleSide` (you look at its inside) and the ball rests on its
floor (`BALL_R - GUTTER / 2`). Look at a new curved piece from the camera's
own angle, not only from above.

**A line that is clear for the ball's middle can still drop it in the
water.** ميني جولف's gentle putt aimed along lines checked only at the
ball's centre, every 0.2 units; on the oasis a line grazed the pond's corner,
the ball clipped it, went back to where it lay, and the same putt was chosen
again - for ever, a stroke each time. And on the gate hole the sliding door
always covers its own middle, so the straight putt at the cup bounced back
every time. The field and the clear line now keep off the water by more than a
ball's width and treat what a moving piece never leaves as solid. A check that
a helper "gets there" has to play it again and again, not once from the tee.

**A tab of the built-in browser that isn't in front gets no animation
frames.** Driving the app in a background tab of the desktop app's browser
pane, a golf roll never moved (`requestAnimationFrame` never came), and a
second roll then took the first one's balls. Test rolls in your own headless
Chrome (`--use-angle=swiftshader`, a browser context per phone), not in a
tab you don't own.

**A class name for a wrapper and for a widget can collide.** The solo
view's wrapper was `.mg-host` and so was the host's row of buttons,
absolutely placed - the whole course collapsed to 0 × 240 px and nothing
failed but the picture. Name a widget for what it is (`.mg-hostrow`).

**A solid under a surface covers what goes down through it.** The course
stands on a stone plinth (an extruded polygon); its top at the green's
height z-fought with the grass, and the cup and a bowl, which go below the
green, were covered by it. The plinth's top is 3 cm under the green and it
has holes where the cup and the bowls are. Water lies *over* the green
(with a polygon offset): a hole in the green shape for a pond that touches
the rails' edge doesn't triangulate.

**three.js's `render` is not on the prototype.** `WebGLRenderer` sets its
methods on each instance in its constructor, so counting frames by patching
`THREE.WebGLRenderer.prototype.render` counts nothing. Wrap the constructor
on `window.THREE` before a game builds its renderer and patch the instance.
And a frame-rate check under SwiftShader is bound by the CPU (three pages
rendering share it: 6 frames a second each), so it can't tell 30 from 5;
`--use-angle=d3d11` on this PC draws at the headless 144 Hz.

**Headless Chrome needs a software GL for a 3D check, and it is slow**:
`--use-angle=swiftshader --enable-unsafe-swiftshader`. At full frame rate
it starves DevTools calls for seconds; `MG3.fpsCap = 3` in the page keeps a
scripted check moving (the cap is 0, off, for everyone else).

**A margin rule on `.row > * + *` loses to the item's own `margin: 0`.**
The hand's overlap (`--pc-gap`) was set on `.pc-row > * + *` (one class
of weight) and the card buttons had `margin: 0` on their own class, later
in the file: the same weight, so the button won and no hand ever
overlapped - a phone's cards ran off both edges. `.pc-row >
:not(:first-child)` weighs two, and wins.

**An isolate inside an isolate hides its letters from the outer one.**
A claim was built as "2 × ⁨سبعات⁩" (the rank isolated by the translation
helper), then isolated whole inside a line: the outer isolate looks for
its first strong letter *outside* nested isolates, found none in "2 × ",
took left to right, and the Arabic line read "سبعات × 2". A phrase that
will be isolated as a whole is built without isolates inside
(`dbClaim`). And an Arabic name before ": 2" in an English line pulls
the number to its side: names in hand-built markup go in `<bdi>`.

**The scratchpad is shared by every agent of a session.** Another
agent's driver overwrote this one's `cdp.mjs` mid-run (and pointed it at
its own preview port). Keep test drivers, Chrome profiles and ports in a
folder and a port range of your own.

**The i18n check used to read every `t.x` as a translation.** Since 3 Oct 2026
`check-i18n.js` parses the scripts and follows each `t` to its binding: a table
made from `TRANSLATIONS` or a game's helper named `…T()`, `…Tr()` or `…Text()`
(`crewT()`, `xoTr()`, `tbText()`), or a parameter of a function that isn't a
callback. A texture, a touch or a tile called `t` is left alone, and so is a
comment; a key a file defines in its own `{ ar: {…}, en: {…} }` passes. A new
helper that returns the translations is named that way, or the check can't see it.

**Tailwind scans comments too.** A comment with the word "outline" in a
`JS_*.html` file made `npm run build:css` add a `.outline` utility. Only
rebuild the CSS when a class was really added, and check the diff.

**A room frame rebuilt with `innerHTML` takes its canvas with it.** A WebGL
canvas can't be in the frame's markup: keep it in a root the game owns and
append that root to the new host after every rebuild (a moved canvas
keeps its context).

**Headless Chrome draws WebGL only with SwiftShader**
(`--use-angle=swiftshader --enable-unsafe-swiftshader`), and its tabs share
one `localStorage` - so one room session: give each tab its own browser
context (`Target.createBrowserContext`) to act as separate phones.

**`forceContextLoss()` fires `webglcontextlost` on the canvas being
disposed.** The lane listened for a lost context to mark 3D as unavailable;
leaving a bowling screen disposed the renderer, the event arrived a moment
later and marked the *next* lane (already built) as "this device can't draw
3D". The listener now ignores any canvas but the one in use, and dispose
forgets the canvas before losing its context.

**Headless Chrome with SwiftShader draws a frame in 100 ms or more**, so a
throw looks slow and screenshots taken on a wall clock miss the moment. To
look at the crash or the setter, replace the loop (`bowlGfxFrame = () =>
{}`) and step `bowlGfxUpdate(1/60)` yourself, then render.

**A Durable Object alarm set in the past fires at once.** `scheduleAlarm`
took the soonest of the game's deadline, the presence check and the idle
clean-up; once a room was past its 6 idle hours with a phone still connected,
the clean-up time was behind it, the alarm fired, found the phone, and set
itself to the same moment in the past - a loop, each run a request on the free
plan. Every time handed to `setAlarm` is at least a second ahead now, and a
time that is already past is replaced by the next time worth looking.

**A keyframe that leaves a property out animates it back to the element's
own value.** خمّن مين's verdict («صح!») sits at `opacity: 0` until its turn,
and pops with `gwPop`, whose last keyframe names only `transform`. With
`fill: both` the pop ended by fading the verdict back to the 0 it started
from. The rule that starts the animation also sets the end state
(`opacity: 1; transform: none`), so the element's own value is the one the
animation ends on.

**An iPhone gives a password field only its English keyboard.** المشنقة's
writer types a word the others mustn't see, and `type="password"` looked like
the answer - but iOS lets a secure field use only an ASCII keyboard, so the
word could not be written in Arabic. The field is `type="text"`, and **not
`-webkit-text-security` either**: Safari takes a field drawn that way for a
password and offered to save the word whenever the game was left (the owner, 24
Sep 2026). A secret field is `.secret-field`: the input's letters are
transparent (`is-hidden`, which the eye toggles) and `.secret-field__dots` draws
one dot a letter over them (`secretDotsPaint`, JS_Hangman.html, run on every
`input` event and after a redraw restores what was typed). Hide typed text that
way everywhere.

**A flex item's intrinsic size ignores its flex-basis.** المشنقة's tiles were
`flex: 0 1 2.375rem` with no width, which was fine while they sat straight in
the row. Grouped into one flex container per word, each group took its
max-content width from its tiles' content - one letter each - and the tiles
shrank to a few pixels. A box that must keep a size inside a nested flex
gets a `width` (and a `min-width` to shrink to), not only a basis.

**Two preview tabs share one saved room session.** A room's session is saved
in `localStorage`, which every tab of the preview shares: a tab reloaded (or
opened) after another joined comes back as that other phone, and joining from
it as a TV makes that player leave. To act as several phones, open the tabs
and join from each without reloading - or check who a tab is (`Room.me`)
after a reload.

**Keeping only good answers loses the fonts offline.** The Google Fonts
stylesheet is a `<link>` without `crossorigin`, so it is fetched without CORS
and its answer is opaque: status 0, `ok` false. A worker that keeps only
`res.ok` never saved it, and offline the fonts were gone even though their
files were cached. Keep opaque answers from the pinned hosts. But an opaque copy answers only a no-CORS request: handed to a CORS
one for the same address (an extension, a preload) the browser turns it into a
network error and the fonts fail (2 Oct 2026); such a request goes to the network. And test
offline with the server really switched off (`curl` it): a page a worker
controls sends every one of its fetches through that worker, whatever the
address, so a fetch from the page can't tell you whether the server is up.

**A secret slice is sent whole.** `project()` gives each phone everything in
`room.secrets[pid]`. قبل ولا بعد kept each hand twice there - the cards with
their years for the server, the same cards without for the screen - so every
phone received its own answers in its traffic, while the screen showed none.
Anything the owner of a slice must not see (its own answers, a deck, a vote)
goes in a `room._*` field; the slice holds only what that phone may read.

**jsDelivr's `.min.js` files are made on request, so an SRI hash on one can
break.** jsDelivr says not to use SRI on its minified-on-the-fly files; the
confetti and QR scripts are pinned to files the packages ship themselves
(`dist/confetti.browser.js`, `qrcode.js`). To bump either, download that exact
file and hash it (`openssl dgst -sha384 -binary | openssl base64 -A`): a wrong
hash means the script never runs, silently.

**`defer` still holds `DOMContentLoaded`.** The app starts on
`DOMContentLoaded`, and a deferred script from a CDN that is slow (or blocked)
holds it until it arrives or fails - the whole app waited on the confetti.
The two CDN scripts are `async` now, and an ES5 stub in the head takes
`confetti()` calls until the library replaces it (`JS_Sounds.html` wraps
whichever is there, and wraps again on the library's `load`). Anything else
loaded from outside: `async`, a stub, and a page that works without it.

**A sticky bar can't rise above the box it lives in.** Every setup with the
«موبايل واحد / كل واحد بموبايله» switch kept its Start bar inside its panel
(`.mode-device-panel`); on a phone 667px tall the hero put that panel's top so
low that Start could only stick 55px under the visible edge, half under the bar
and «افتح غرفة», until the page was scrolled (3 Oct 2026). The panels are
`display: contents` now, so the bar lives in the card. A sticky bar's parent
must start high enough on the shortest phone; measure its button at scroll 0.

**A sticky box stops at the scroll area's padding, not at its edge.** The
Start bar of every setup screen (`.view-actions`, sticky at the foot of
`.shell__main`) reached down a fixed 8px while the scroll area's foot padding
was 24px (16px on a phone on its side), so a stuck bar floated 16px above the
edge and the page scrolled past in the strip beneath it - the owner saw
بنك الحظ's switches showing under its Start on a PC (21 Sep 2026). The
padding is a variable now, `--main-pb` on `.shell__main`, and the bar reaches
down by exactly that. Change the foot padding through `--main-pb`, never with
a plain `padding-bottom`, or the strip comes back. (The rounded action bars of
سكرو, أونو, لودو and بنك الحظ float above the edge on purpose.)

**A percentage padding is measured against the containing block's width.**
بنك الحظ's squares first kept their icon clear of the colour band with
`padding-top: 22%` and the like. On an absolutely placed square that is 22%
of the whole board's width, not of the square: the squares on two sides grew
wider than the board's corner, their bands slid under the middle, and a
square landed on was outlined halfway across the board. Anything sized
inside a small absolutely placed box goes in an inner box with `inset` (whose
percentages are the box's own), never in the box's own padding.

**A room game that looks right with no network can still feel wrong on a
phone.** On the local server the answer to a move comes back in a few
milliseconds, so two things only showed on the owner's phones (21 Sep 2026):
a preview that vanishes when the finger lifts and a real piece that appears a
round trip later reads as *two* moves (كونكت ٤'s aim disc), and a queue of
motion that makes every new state wait holds up the player's own next tap
(أونو after a Skip). Test a room move with the socket slowed down - wrap
`WebSocket.prototype.send` in a `setTimeout` of 250ms in the page - and time
your own move from the tap to the screen. Your own move is drawn at once (the
duels' `early`, أونو's `unoOwnMoveWaiting`); other people's may wait their
turn to animate.

**A restyle section at the end of the file still loses to a heavier
selector above it.** Section 39 (the arcade look) restyles classes the
earlier sections placed with heavier rules: `.gcard > *:not(.ripple)` weighs
(0,2,0), so a poster's badge placed by `.gcard__badge` stayed in the flow
until it was placed by `.gcard > .gcard__badge`; `body.dark .home-hero`
outweighs `.home-hero--compact`, so the compact row kept the old gradient in
dark mode until the dark selector was written too. And inside one section
order still counts: `.home-feat` written before `.gcard` lost `aspect-ratio`
and `min-height` to it (`.gcard.home-feat` now). When a later rule "doesn't
apply", compare specificity before adding `!important`.

**A custom property that doesn't exist is silently nothing.** The first-play
card used `var(--sp-3-5)` and `var(--sp-2-5)`; the scale has only whole steps
(`--sp-1` … `--sp-9`), so its padding and gaps were 0 and its text touched
the edge. No check fails on it. Grep `--name:` in `Style*.html` before using a
token.

**A default on the base class beats a modifier on the same element.** سكرو's
card set `--c` (its colour) on `.skr-card`, and each group set it on
`.skr-c--bad` and the rest - one class each, so the same specificity, and the
base rule came later in the file. Every card on every phone was the default
blue for four days, and nothing failed: the markup had the right classes and
the sweep found no contrast or overflow problem. A default that a modifier is
meant to override goes in `:where(.base) { … }` (no weight at all) or before
the modifiers; and a check of a coloured component reads the computed value,
not the class list.

**The Edit tool decodes `\u` escapes.** Writing `/[\u0000-\u001f]/` into a file
through it put real control characters in `RoomGames.js`, and git took the
file for binary. Write such a regex through a script, or check the file with
`git ls-files --eol` (it says `-text`) after the edit.

**One scope means one name, and the later file wins silently.** Every
`JS_*.html` is concatenated into one page, so two top-level `function`s with
the same name are not two functions: the file included later replaces the
earlier one, with no error anywhere. `JS_TriviaBoard.html` comes after
`JS_RoomTrivia.html` in `Controller.html`, so its `paintTriviaTimer(seconds)`
replaced the room's `paintTriviaTimer(endsAt)`, and the room trivia clock -
the badge on every phone and the big number on the TV - sat at the question's
full length and never counted down, on the live site, for as long as both
existed. The room's is `paintRoomTriviaTimer` now, game-qualified like
`paintStopRoomTimer` and `paintSpyfallRoomTimer` beside it. **Name anything
per-game after its game**, and before adding a top-level name, check the whole
tree for it:

```bash
grep -rlE "^(\s*(async\s+)?function NAME\s*\(|const NAME\s*=)"   --include="JS_*.html" --include="*.js" . | grep -v docs/
```

A sweep on 20 Sep 2026 found only that one. `TRIVIA_COUNTS` and
`startCodenamesClock` are each declared twice, but one copy is in
`RoomGames.js`, which is **not** part of the page - those are a client copy
and a server copy, in separate scopes, and are fine.

**A webfont swapping in moves everything measured against the fallback, and
it fires no event anyone listens to.** The segmented control's thumb and the
nav pill are placed by measuring the active item (`syncSegmented`,
`syncNavPill`), re-run by a `MutationObserver` on class changes and on
`resize`. A font arriving changes every label's width and is neither of
those, so on a cold cache a thumb sat where the fallback put it until
something else happened to redraw. `document.fonts.ready` now runs the same
coalesced pass (JS_Core.html). Anything else that measures text and caches
the number needs to be on that pass too.

**A component checked on a phone can still break on every wider layout,
through a rule on its parent.** The returning hero dropped its head on a
phone and was right there; the wide block had long made `.home-hero` a grid
of two columns expecting that head, and on a laptop the four tiles took the
first column and left most of the bar empty. Nothing overflowed, nothing
failed contrast, no tap was small - the regression sweep passed at every
size. What finds it is a **space check**: for every flex or grid container
wider than 560px whose visible children sit on one line, how much of the
width the children span (`fill`) and the biggest gap between two
neighbours (`hole`), and - the case that caught this one - a grid with more
column tracks than children, where the hole has no child in it to measure.
Run it over every view at 375x812, 667x375, 768x1024, 1024x768, 1280x720
and 1920x1080 and read the list: a toolbar with a clock at each end is a
hole by design, a row of three tiles in a column meant for four is not.

**A contrast sweep that cannot see gradients will drown you in false
failures.** The first run of the 20 Sep sweep reported 113 failures across
266 view/theme combinations; all but a handful were text on a `background-image`
- the violet hero, every `.btn--primary`, a segmented thumb drawn as a
`::before`, the chooser's translucent plates on its dark stage. Computed
style cannot composite those, so the walker must return *unknown* and count
it, never guess the page ground. With that fixed the same run reported 3,
and the way to tell a regression from an old friend is to run the sweep
twice - once with the new tokens and once with the old ones injected on
`body` - and diff the two sets of keys.

**A search with a time budget needs a ceiling as well as a clock.**
`rooms-worker/test/rules.mjs` replaces `Date.now` with a clock that only moves
when a test moves it, so the trivia and bomb deadlines can be stepped through.
The duels' hard players stop at a deadline read from `Date.now()`, so under
that clock their iterative deepening never stopped and `npm run test:rules`
hung. Their tests put the real clock back first, and both searches now also
stop at a node count (`C4_MAX_NODES`, `DOTS_MAX_NODES`), so a clock that
stands still - a test, a throttled tab - can't hold them for ever.

**A headless Chrome screenshot at a phone's width is laid out wider.** New
headless Chrome keeps a minimum window width of about 500px, so
`--window-size=375,812` screenshots a 375px slice of a page laid out at 500:
the pills and the board ran off the right edge in a picture of a page that was
fine. Emulate the viewport over the DevTools protocol instead
(`Emulation.setDeviceMetricsOverride`, `mobile: true` below 768) - and
`Emulation.setEmulatedMedia` for `prefers-reduced-motion`, since a headless
Chrome on this PC reports `reduce` and every animation is skipped.

**A parse check is per file, and it has to run after every edit.** A stray
newline inside a string literal in `JS_Solo.html` made the whole file fail to
parse in the browser - so nothing in it was defined, which took out
`soloRegister` and with it every solo game, the daily hub and the result
sheet. Nothing failed at the command line; the only sign was the browser
console. After touching any file:

```bash
node -e "const fs=require('fs'),vm=require('vm');const s=fs.readFileSync(process.argv[1],'utf8');
[...s.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].forEach((m,i)=>{try{new vm.Script(m[1])}
catch(e){console.log('FAIL',process.argv[1],e.message)}});" FILE.html
```

`Controller.html` always fails it - its Apps Script `<?!= … ?>` syntax is not
JavaScript - and that is not a regression.

**A class list write is a mutation even when it changes nothing.** The
segmented thumbs and the nav pill are re-measured by a `MutationObserver` on
class changes, and `syncNavPill` added `has-pill` on every pass - so the
observer fired again, every frame, forever, on an idle screen (59 passes a
second measuring 66 controls). Anything called from that observer only writes
a class or a custom property when the value differs.

**A face-down card must not take its size from its back.** `.hold-card` stacked
both faces in one grid cell, so the card's height was the taller face - and a
spy's one line made a shorter card than a citizen's word and category. The
table could spot the spy before anyone held the card. The back is laid over
the card now (`position: absolute`), and the card has one height for every
role (16rem, 14.5rem on a phone on its side, where the name and the button
sit beside it). Check a new role card's longest content fits.

**A dealt list that runs out must mark the whole deal.** `freshPick` used to
mark only the refill as seen when a list started over, so the last cards of
the old cycle could come straight back (على راسك deals 80 a turn and ran out
every few turns). Everything dealt opens the new cycle, and the refill comes
from what was dealt longest ago.

**Setting `lang` or `dir` on `<html>` restyles the whole page, even to the
value it already has.** `applyTranslations` runs on every `setView` and did
exactly that, which on the home was half of what a back tap cost (and every
`[data-i18n]` element was rewritten too). Both now write only on a change;
`syncChrome` compares the title with `textContent`, because reading
`innerText` forces a layout in the middle of a screen change. Anything that
runs on every `setView` has to be a no-op when nothing changed.

**Auto side margins shrink an item in a flex column.** `.sdk-pad` centred
itself with `margin: … auto`, which is fine in a block, but once the solo
layout made its side column `display: contents` the pad became an item of the
`.solo-layout` flex column, where auto margins stop an item stretching - and
the nine number keys were 13px wide on every phone for a day. An element that
is centred with auto margins inside `.solo-layout` needs `width: 100%` next to
its `max-width`. The audit checks for any board or control narrower than 70%
of its layout.

**Moving a list means finding every reader.** The ربع قرد rebuild moved the
country names into `MonkeyWords.js` and removed `COUNTRIES_DB`, but the
default category of the one-phone الجاسوس («دول العالم») still read it, so
Start threw and did nothing for a day. It deals from
`MONKEY_LISTS[contentLang()].countries` now. Before deleting a constant,
search every `JS_*.html` for it, not just the game it came from.

**`animationend` is never the only path.** A CSS animation that is suppressed or
cut very short fires *no* animation events at all — `prefers-reduced-motion:
reduce` sets `animation-duration: 0.01ms !important`, and at that length the
browser dispatches neither `animationstart` nor `animationend`. Any cleanup
hanging off that event therefore never runs. This has bitten twice: the ripple
(fixed with an 800ms fallback removal) and the view transition, where the
leftover `.view-enter` held its `fill-mode: both` transform and left every
screen scaled to 0.985 and shifted 26px — which also makes the view the
containing block for its `position: fixed` children. Both now have a timer
fallback *and* reduced motion drops the animation outright instead of shortening
it. If you add an animation whose end you depend on, do both.

**Opening a modal has to reset what it remembers.** The reorder list keeps a
"first tap" in `selectedReorderIndex`, and it was only cleared on confirm — so
arming a row, pressing Cancel and opening it again left the row armed, and the
next tap silently swapped two people instead of selecting one. All three callers
go through `openReorderModal(context, items, label)` now, which resets first.
Anything else with staged state across an open/close needs the same treatment.

**A room re-renders on presence, not just on moves.** `Room`'s change signature
includes every player's online flag, so it fires whenever any phone locks or
wakes — several times a minute in a real room. A room screen that rewrites
`innerHTML` unconditionally will therefore throw away whatever the player is
typing at that moment. Use `renderRoomFrame(el, sig, build)` with a signature of
what the screen *actually shows*, and `refreshRoomPlayerStrip(el, state)` to
update the presence chips in place. When you are still composing an answer, the
count of who else has finished is not part of your screen — leave it out of the
signature or you have rebuilt the same bug.

**Server-side `start` is not idempotent by nature.** Dealing a game is guarded
centrally in `applyRoomAction` (`start` is refused unless `room.phase` is
`lobby`), because a double tap either side of a round trip used to re-deal a
board mid-turn. Per-round actions guard themselves: check the phase before
scoring, and remember that `closeVote` can be reached twice — once by the last
vote arriving and once by the host's button — so it returns whether it actually
closed anything.

**A round that ends without a winner still has to close.** Draw & Guess marks a
finished round by setting `shared.word`, not by setting `winnerId`; `giveUp`
sets the former and not the latter. Anything asking "is this round over?" must
read `word`, or it will keep accepting strokes and guesses for a word that is
already printed on every screen.

**Locked word categories carry their password in the data.** A `🔒` category
keeps its password as its first word (there are none now). Use
`spyWords(category)` / `unlockedSpyWords()` on the server rather than reading
`getSpyData()` directly, or the password gets dealt as a secret word.

**Code in `JS_*.html` does not exist on the server.** Fake Artist once dealt its
colours from `DRAW_COLOURS`, which is declared in `JS_RoomDraw.html`, and the
first `start` on the real server threw a ReferenceError. The rooms server has
only what `rooms-worker/build.mjs` bundles (its `FILES`: the word lists and
`RoomGames.js`). A constant both sides need is declared in
one of those (`FAKE_ARTIST_COLOURS` in `RoomGames.js`). `npm test` in
`rooms-worker/` starts every game, which is what catches this.

**The rules run in strict mode, on a copy.** The bundle is an ES module, so an
assignment to an undeclared variable in `RoomGames.js` throws on the server. The
rules work on a `structuredClone` of the room that only replaces it when the
move didn't throw, so a rule may throw halfway through without leaving the room
half-changed.

**`castVote` can close the vote by itself.** When the last eligible player votes
it calls `closeVote` and returns `true`. A game whose own close action does more
than close - Fake Artist reveals the fake and moves on to the guess - has to do
that same work when `castVote` returns `true`, or the table sits on a finished
vote with no way forward. And "most votes" is not `results[0]`: `results` is in
option order. Find the maximum, and decide what a tie means (in Fake Artist, a
tie lets the fake escape).

**A secret is published when it stops mattering, not when the round ends.** A
caught Fake Artist still gets to guess the word, so `secretWord` reaches
`shared` only after the guess, or after the host skips it. Put it in `shared`
at the vote and it is printed on the fake's own screen while they type.

**Ordered content leaks.** The trivia bank had the right answer second in 115 of
150 questions, so tapping B every time won. The server reorders each question's
choices as it deals. Anything with a positional answer is shuffled at deal time
rather than trusted to have been varied by hand.

**A physical axis stays left-to-right in Arabic.** Under `dir="rtl"` a range
input runs right to left while `left: 40%` still measures from the left, so a
slider, its needle and its end labels disagree in Arabic: wrap such a line in
`dir="ltr"`. The same goes for anything that maps a value to a
position on screen - and for the seats round a table: الدومينو's seat row is
the one before you on the left and the one after you on the right, and a grid
in an Arabic page put them the other way round until the row was given
`dir="ltr"` (each seat keeps the page's direction for its own name). Its
table, the buttons for its left and right ends, and the TV's strip of seats
are left to right for the same reason.

**A button stands in for something said out loud, so it has to be
take-back-able.** The phone cannot hear the table: someone presses "pass" in
القنبلة without saying a word, or "I know who I am" in من أنا؟ by mistake, and
the round is scored on it. Three shapes of answer are in the code, and a new
game should pick one rather than trusting the press: the host judges
(الجرس, خمس ثواني, دوري المعرفة), the table overrules (ربع قرد's `flip`,
أتوبيس كومبليت's `adjust`, القنبلة's `markLoser`), or the press itself can be
taken back. The last one is the newest: `sendBack` in `bombRoomAction` hands a
pass straight back to whoever made it (the holder for `BOMB_SEND_BACK_MS`, the
host at any time) and undoes the pass count - the holder's button goes away
when its time is up, counted from when that phone saw the pass
(`BOMB_SEND_BACK_SHOW_MS`, a second shorter, since a phone's clock can't be
compared with the server's), `notYet` in the من أنا؟ branch
removes a `gotIt` and refunds exactly what it paid (`shared.awards`, so the
refund cannot drift from the award, and nobody who pressed later loses
anything), and بدون كلام and أوصف لي keep a `judged` stack on the phone so
`undoCharadesCard` / `undoDescribeCard` put the last card and its point back.
A mis-tap under a clock is not rare enough to design around.

**A table that is bored has to be able to get out mid-round.** The room's
"another game" button only ever appeared once a round had ended, and on one
phone the back arrow dropped the round with no warning. `openExitSheet` in
`JS_Utils.html` now answers the header's back button (`goBack` calls it first
and does nothing else if it returns true) on any screen that would abandon
something: `exitGameOf` resolves the view's `up` through `GAME_CATALOG`, so
every game gets it and the tools do not. In a room it offers the host
`backToHub` mid-round, everyone else a "🙋 ask for another game" that posts to
the room chat, and both the menu (the room stays open) and leaving. On one
phone it offers another game, the game's own options, or carrying on.
While that sheet or Help is open over a round on one phone, the round's
clocks stand still (`pauseClocksForSheet`, resumed by `closeModal` /
`closeAllModals`): reading the rules no longer costs the turn. Rooms keep
running (their clocks are the server's) and so does the bomb (its fuse is a
secret). A TV hosting a room has no back arrow, so its bar carries a 🏠 for
the host that ends the round for everyone after a confirm.

**Leaving a room screen does not leave the room.** A player can go to the menu,
a timer or the rules mid-game; `#active-room-banner` under the header shows the
code and a way back. `Room.onChange` draws nothing while `appState.currentView`
is not a `room-*` view: every game's `render` calls `setView`, and that used to
drag people back on each poll. `roomReturnToActive()` drops the hidden view's
frame signature and goes through `routeRoomState(state)`. The shell grid pins
each child to its row, because a hidden banner otherwise lets the main area and
the nav slide up a row (a stretched nav, or none at all on a long page).

**Per-round buttons get double-tapped.** `nextRound`, `nextQuestion`, `lockDial`,
`closeVote` and `playAgain` each check the phase they are allowed from and return
quietly otherwise. Without that, a second tap skipped a trivia question, dealt two
rounds, or scored a round twice.

**Random is not "new".** Players kept seeing the same cards after a couple of
games, and a longer list didn't fix it: most games picked with `Math.random()`,
and Charades and Describe It wiped their "already shown" list at the start of
every round. Every single-device game now deals through `freshPick(listId, pool,
count, { key, avoid })` in `JS_Core.html`, which remembers per phone
(`localStorage['ashrySeen_v1']`) what each list has dealt and only starts a list
over once all of it has been seen. `avoid` is for "already up this round" without
counting it as dealt. Rooms do the same on the server: `nextPrompts(room, pool,
key, count)` keeps the history across all rooms in the `PromptMemory` Durable
Object (through the `PropertiesService`-shaped calls it always made, which
`build.mjs` points there), because a room's own memory died with the room and
the next evening started every list from the top. A new word game should deal
through one of these, never `Math.random()` directly.

**Categories name a kind of thing.** Connections groups and the Chameleon, Who
Am I and Charades categories are kinds anyone recognises (زواحف, أندية كورة,
Months) - never riddles about a property ("حاجات بتدور", "Things with keys",
"Sea ___"), which were removed at the owner's request because players couldn't
see the link.

**Content goes in through the validator.** `npm run check` in `tools/` checks
every bank: Wordle words are exactly their length in letters the keypad has,
Describe It cards have three forbidden words, trivia choices are four different
answers, Connections tiles don't repeat inside a puzzle, and nothing is listed
twice (Arabic spelling variants count as the same word). Run it after editing any
list - a wrong-length Wordle word makes that game unwinnable, not just odd.

### Reloading mid-game

`restoreView` in `JS_Core.html` decides what happens when the page reloads while a
game is on screen. Every play view needs a branch there, or the player lands on a
blank template with no clock running and no way forward.

The view also has to be listed in `validViews` in `loadFromLocal`. A saved screen
missing from that list is reset to the menu *before* `restoreView` runs, so its
branch never fires: Connections had a branch and still reloaded to the menu until
both of its screens were added.

Two shapes:

- **Restorable** (Wordle, Guess the Number, Screw, Monkey, Domino, the counter,
  the bracket, the trivia board, and the Bomb, Stop the Bus, Memory and Tic Tac
  Toe through their `restoreX()` functions; كونكت ٤ and نقط ومربعات through
  `soloRegister`, the phone's move started again if it was its turn; ثلاث
  جولات through `restoreTimesUp`, since 26 Sep 2026): the whole game is in `appState`,
  so the branch just redraws it. The Bomb's fuse and a Stop round's clock are
  deadlines, so they come back with the time they really had left.
  Anything that renders from state needs a `render…()` that rebuilds from
  `appState` alone — not one that only appends as events happen.
- **ثلاث جولات** keeps its deck, round, teams, whose turn it is and the scores in
  `appState.timesup` (`timesUpSave` after every move, emptied at the end), and a
  reload comes back to **the current turn's ready card**, not the middle of its
  clock: the cards already guessed stay guessed and scored, the time that was
  left is not kept - as بدون كلام's relay comes back to its handover card.
- **Not restorable** (Charades, Describe It, Just One, Who Am I, the reaction
  test): these are timed, and the remaining time is not persisted. Resuming would
  be a lie, so the branch returns to that game's setup screen and calls
  `toastRoundLost()` to say why.

When adding a timed game, prefer persisting a deadline (`Date.now() + ms`) over a
remaining-seconds count — then it becomes restorable for free. The trivia board
does this for an open question card.

A branch that reopens a popup has to wait a tick (`setTimeout(…, 0)`):
`initializeApp` closes every `.modal-overlay` *after* `loadFromLocal` has run
`restoreView`, so a card opened straight away is shut again with its clock still
running behind it.

### The design system

The rules every screen follows are below; the arcade look, the intro, the reveals, motion everywhere, toasts, performance and the layouts for each size are in `notes/design.md`.

**Calm by default.** The backdrop is one still wash (the two cross-fading
gradient layers were a screen that never sat still); cards are white with a
hairline border and a soft shadow; the game's own colour sits on its icon
tile, the accent edge of a setup hero and the primary button, not washed
over whole cards; section titles are sentence case in the text colour; the
selected chip is the screen's own accent (*One voice* below - it used to be
ink on paper, a third colour system answering to nothing). Radii are
20px on cards and 12-14px on controls. When adding a screen, spend colour the
same way: one accented element, the rest neutral.

**What keeps motion smooth on a phone** - the rules that flight taught, applied
to everything in the section: animate `transform` and `opacity` only (the vote
bars grow with `scaleX`, from the inline-start edge, not `width`, which is laid
out on every frame); start a script's clock on the first frame drawn, never
when it was called (`countUp`, `spinLetter`), because the screen that just
changed may take a while to draw; move a thing within its own place, never
over its neighbours (the Stop letter used to drop in from above, over its
label; it squashes in place now); and no `backdrop-filter` over a page that is
changing underneath (the game splash is a near-opaque tint, since the room's
screen rebuilds and slides in behind it).

**Motion on a computer.** The owner saw no animation at all on their PC,
and it wasn't a bug in any one of them: Windows' "Animation effects" switch
was off, Chrome reports that to every page as `prefers-reduced-motion:
reduce`, and the app honours it everywhere. So motion has a setting
(Settings → الحركة, `ashryMotion`): تلقائي follows the device, شغّالة plays
it anyway, مقفولة stops it anyway. Every script asks `reducedMotion()` in
`JS_Core.html` (`motionOff()` is that or a hidden page), never `matchMedia`
directly, and `applyMotionPref` makes the stylesheets agree: for "on" it
lifts the `reduce` media blocks out and applies the `no-preference` ones
unconditionally (the home's rising cards live in one of those), for "off"
the other way round, and for "auto" it puts back what it moved. A new
`matchMedia('(prefers-reduced-motion…)')` in a script would ignore the
setting; use `reducedMotion()`.

**Using the motion toolkit in a new game.** The owner's standing ask: every
new screen or game uses these wherever they fit, rather than inventing its own
motion. What exists, and the moment each one is for:

| moment | use | seen in |
| --- | --- | --- |
| something moves from where it was to where it lives | `flyEmoji` (an icon), or a ghost + Web Animation like `flyConnectGroup` / `dealTeams` (text, tiles) | card → hero, room start → header, Connections, teams |
| a score changes | `renderScoreboard` rows (`data-pid`, `data-score`); `animateScoreboards` counts and slides them | every room board |
| a number lands | `countUp(el, from, to)` | scoreboards |
| a vote or a poll closes | `renderVoteResults` (bars in suspense, winner last) | every vote |
| a hidden answer is revealed to the table | `spyRevealParts(key, label)` on the result card | الجاسوس, الحرباء, الموقع السري, الفنان المزيف |
| a game ends with a ranking | `renderPodium(state, board)` + `afterReveal(el, confetti)` | trivia, quiz, five seconds, two truths, Stop |
| something random is drawn (a letter, a category, a number) | `spinLetter(el, value, pool, onLand)` | Stop's letter |
| a secret on a passed phone | `.hold-card` with `data-next` + `holdCardReset` | one-phone roles |
| confetti or a cheer after any reveal | `afterReveal(el, fn)` | everywhere a reveal is |
| a list or grid gains and loses items | `flipGrid(root, mutate)` | the home's filter chips and search |
| whose turn it is, between two | `duelPillsHtml` + `duelPillsAfter` (the ring slides, a score counts up, a pill pulses on another turn) | كونكت ٤, نقط ومربعات |
| a name going into its place in a bracket | `tourFly(fromRect, toEl, html, delay)` (a chip flying, the place held until it lands) | the tournament's draw and its winners |

And the rules they rely on: key a reveal with `motionFirst(key)` so a redraw
doesn't replay it; check `motionOff()` before moving anything, and set the end
state without motion when it is true; transform and opacity only; start
clocks on the first drawn frame; every end state also set by a timer, never
only by an animation event. New CSS goes in section 14 of `Style_Finish.html`, with
its `prefers-reduced-motion` line in the block at the end of that section.

**A new way to play an existing game is not a new game** (the owner, 24 Sep
2026). Before giving anything its own card, ask: is this the same game played
another way (same board, same pieces, same words)? Then it lives inside that
game's card: its catalog entry carries `hub: '<the game's id>'`, it joins that
game's row in `HUB_WAYS` (the row under the hero of every screen of the
family), and if it is a room game its id joins the family in
`ROOM_HUB_GROUPS` so a room's list shows the family as one tile. It keeps its
own rules in the help sheet and answers a search by name. Chess is the model
(*Chess is one card, with its ways inside*, in *Decided, and why*). A game
with its own name that people ask for gets its own card.

**A new game, start to finish.** The pieces a game needs to be whole, each
described in its own section of this guide: a `GAME_LIST` entry in `Games.js`
(or it is not on the menu; with `room` and `crew` for a room game); `VIEW_META` for every view (title, `up`, accent); its text in
both `TRANSLATIONS` blocks; its rules in `GAME_RULES`, `HELP_ENTRIES` and
`HELP_FOR_VIEW`; `validViews` and a `restoreView` branch for its play views;
dealing through `freshPick` (one phone) or `nextPrompts` (rooms); its content
checked by `tools/validate-content.js`; the motion toolkit above; and in rooms
also its `Room<Game>.js` and a branch in `applyRoomAction`, `ROOM_GAMES` and
`TV_GAMES` renderers, a `roomTurnOf` case if a turn waits on one phone, a round in
`rooms-worker/test/play-all.mjs`, and a deploy. Every game with its own card also takes a place in
`TONIGHT_ORDER` («الليلة دي؟», `npm run check` fails without it), and a room game a
`crew` title in its `Games.js` entry (`npm run check` and `test:rules` fail without it).

**Never hardcode a colour.** Use the tokens: `--accent` / `--accent-soft` /
`--accent-ink` / `--accent-on` for the current screen's colour, `--text` /
`--text-2` / `--text-3` for copy, `--surface` / `--surface-solid` /
`--surface-2` / `--surface-3` for backgrounds, `--success` / `--danger` /
`--warning` for meaning. Everything resolves correctly in both themes.

**Per-screen colour comes from `data-accent`.** `setView` reads `accent` out of
`VIEW_META` (in `JS_Core.html`) and sets it on the view, and every component
inside re-tints itself — that is what gives each game its own identity with no
per-game CSS. The eight palettes are violet, indigo, blue, teal, green, amber,
orange and rose. `--accent-on` is the ink that reads on a filled accent, and it
differs per palette per theme: white on violet, near-black on amber.

**Colours that text sits on need an "on" token.** `--accent-on` is not the only
one: `--success-on` / `--danger-on` / `--warning-on` (paired with
`--success-btn` / `--danger-btn` / `--warning-btn`) exist because white is not
readable on every semantic colour, and *which* one it fails on flips between the
themes — white on the light green is 3.8:1, on the dark amber 2.2:1. Solid
buttons, Wordle tiles and Wordle keys all read through these. Never put `#fff`
on `var(--success)` and assume it holds.

**For markup built in JS**, where a Tailwind palette class cannot follow the
theme, use the semantic text utilities: `.tx-success`, `.tx-danger`,
`.tx-warning`, `.tx-accent`, `.tx-muted`, `.tx-strong`, and the `.plate-danger`
/ `.plate-success` tinted plates. A hardcoded `text-slate-400` is 2.3:1 on the
page background; these resolve through the same tokens as everything else.

**Buttons carry importance, not decoration.** One `.btn` base plus a tier:
`.btn--primary` (the one action the screen exists for), `.btn--secondary`,
`.btn--ghost` (retreat/dismiss), `.btn--neutral`, and `.btn--danger` /
`--success` / `--warning` / `--danger-soft` for meaning. Sizes are `.btn--lg`,
default, `.btn--sm`, `.btn--xs`; `.btn--auto` opts out of full width. The old
`btn-blue`/`btn-orange`-style classes only survive as aliases so a stray one
still renders as a button — do not add new uses.

Other components: `.card`, `.section` + `.section__title`, `.eyebrow`,
`.game-card`, `.tool-item`, `.row` / `.status-row`, `.chip`, `.badge`,
`.metric`, `.empty`, `.field` + `.field__label`, `.input-group`, `.stepper`,
`.segmented`, `.switch` (inside a `<label class="switch-row">`), `.keypad` +
`.key`, `.wheel`, `.view-actions`, and the
`.modal-content` sheet (`.sheet__header` / `__body` / `__footer`).

**Popups take the colour of the screen they open over.** Under `<body>` they
are outside every screen's `data-accent`, so `hoistModals` watches each
overlay and `tintModal` copies the current screen's accent onto its
`.modal-content` when it opens (marked `data-accent-auto`); a popup that sets
its own `data-accent` in the markup keeps it. Toasts, the chat's unread count
and the chess clock's running side sit on the `--*-btn` / `--*-on` pairs,
and the two teams of أسماء الرموز and دوري المعرفة have `--team-red`,
`--team-blue` for fills and `--team-red-ink`, `--team-blue-ink` for text (the
fill is 2.8:1 on the dark card). A `.btn--auto` inside `.btn-row` keeps its
own width.

**Layers have names** (section 1, `--z-chrome` … `--z-confetti`). Anything
that sits on the page rather than inside one component takes one of them:
the header and the bar, the room banner, floating notes and a game's ghosts,
popups, alerts, confirms, toasts, the room splash, the intro, a card game's
flying cards (`--z-fx*`), the full-screen tools and what goes over them, the
points and وقف's slam, and confetti on top (`JS_Sounds.html` reads that one).
The values are the numbers each layer always had (22 Sep 2026: forty rules on
twenty-five numbers from 20 to 100,040, now names); a new popup picks a name,
never a number. Small numbers inside a component stay local.

**Popups are centred dialogs, and live under `<body>`.** `hoistModals()` in
`JS_Core.html` moves every `.modal-overlay` there at start-up: most are written
inside `<main>`, and on iPhone a fixed element inside that scrolling area is drawn
inside it - the header and the bottom nav covered the "leave room?" buttons. A
simple dialog is `.modal-content.modal-content--simple`, built only from
`.modal-icon`, `.sheet__title`, `.sheet__subtitle`, fields, `.modal-list` and
`.modal-actions` (main action first and `btn--lg`, cancel `btn--ghost`). Its gap
does all the spacing, so don't add `mt-*` / `mb-*` inside one. Help and Settings
keep the header / body / footer sheet. Full-screen tools (`FULLSCREEN_VIEWS` in
`setView`) hide the header and nav through `body.is-fullscreen-view`.

**Buttons and fields size themselves.** `.btn` is 48px (`btn--lg` 54, `btn--sm`
42), fields are 48px with one font. Don't put `py-*`, `h-*`, `text-xl` or
`font-*` utilities on them - pick a size class. The Charades and Describe It
play buttons (`h-20`) are the one deliberate exception.

### Layout: the app shell

`Controller.html` is a three-row grid — header, scrolling `<main>`, nav — and
the nav is a **grid row, not a fixed overlay**, so content can never end up
hidden behind it. That used to clip the Wordle keyboard's Enter row and the tail
of every long player list.

- Put a bottom action bar in `.view-actions` (sticky inside the scroll area,
  flush with its foot through `--main-pb`: see *Traps*).
  Do not use `position: fixed` inside a view: the view is transformed while its
  enter animation runs, which makes it the containing block and the bar drifts
  into the middle of the content.
- A screen that must fit exactly rather than scroll (a board plus a keyboard)
  gets `class="view--fill"`.
- Respect the safe-area tokens (`--safe-top`, `--safe-bottom`) rather than
  guessing at notch padding.
- Minimum touch target is 44px (`--tap`); nothing interactive should measure
  under ~40px on a 375px-wide screen.
- Never size a play screen off the viewport height (`h-[85vh]`,
  `calc(100dvh - 460px)`). Both were taller than the main area, so on a phone
  held sideways the Describe It card clipped its own forbidden words with nothing
  to scroll to, and the Draw & Guess canvas got a negative size. A timed card
  screen is `.view--stage` + `.play-stage`, which fills the main area and only
  ever grows past it.
- The shell's height is `--app-h`, which `syncAppHeight` in `JS_Core.html`
  keeps at `window.innerHeight`: iOS goes on reporting the old `100dvh` for a
  moment after the phone turns.

**The screen follows the action.** `scrollToAction(el)` in `JS_Core.html`
scrolls the main area to the top (or to `el`) on the next frame, smoothly
unless motion is off, and never while a text field has the focus. Rooms
call it from `routeRoomState` through `roomScrollToAction`: each game's
step is a key (`roomActionKey`: the deal, the phase, the round, the player
up - never a presence tick or an answer count), and a changed key scrolls
to the top, where every reveal, podium and next card is drawn. The first
key after a screen opens does nothing (setView opens it at the top), and a
game that manages its own scrolling gives `actionKey(state)` on its
`ROOM_GAMES` entry, returning '' to be left alone (سكرو during a round:
`skrHandInView` keeps your hand above the bar). One-phone games call it
themselves where their next card or their podium is painted (فوازير
إيموجي, كمّل المثل, خمس ثواني, القنبلة). A new game whose steps are drawn in
place, not through `setView`, needs the same call.

### Navigation

`VIEW_META` in `JS_Core.html` is the single registry of screens: `title` (an
i18n key for the header), `up` (where the header's back button goes) and
`accent`. Add an entry whenever you add a view — `syncChrome` derives the header
title, the back button and the nav state from it, and the slide direction comes
from comparing `up`-chain depth, so a screen with no entry gets no back button
and no title.

**The bottom bar has four tabs**: الرئيسية (the games, `menu`), مع بعض (the
rooms: `together`, or the room this phone is already in - `goTogether()`),
الأدوات (`tools`) and مساعدة. `navTabFor(viewId)` in `JS_Core.html` decides
which one a screen lights: `room-*` screens and the Codenames setup belong to
مع بعض, a screen whose help entry is in the `tools` group to الأدوات,
everything else to الرئيسية. The header shows the screen's own emoji beside
its name (`screenIcon`, from the same help entry); the home shows the brand
mark instead. `together` and `tools` are root views drawn by `renderTogether`
and `renderTools` in `JS_Catalog.html`.

Theme, language and app-level actions live in the settings sheet
(`openSettings()`), not in the bottom bar.

**The tabs and the phone's own back go through the same doors as the arrow.**
The bottom bar calls `navTo(target)`, which asks `openExitSheet(target)`
first: mid-round on one phone, a stray tap on 🏠 opens the "leave this game?"
sheet (its first button goes where the tab goes) instead of dropping the
round. From a room screen nothing is asked - the room stays open behind the
banner. Tool screens' `up` is `tools`, so their arrow lands on the الأدوات tab
they were opened from.

**The phone's back walks the same path as the arrow.** The browser's history
is kept equal to the screen (`navReconcile` in `JS_Core.html`, run after every
`setView` and every popup opening or closing, and re-derived each time rather
than patched move by move): one entry per screen in the `up` chain from the
home (الأدوات and مع بعض sit on top of the home, so back from them comes
home, and back on the home leaves the app); one more entry of the same screen
where leaving would end a game (`exitSheetAsks` in `JS_Utils.html`, the same
test `openExitSheet` makes); and one more while a popup is open. So back
closes a popup, then asks before a game is dropped, then goes up a screen. The
header's arrow and the tabs change the screen and the history follows with
`history.go`, so the two never disagree. Entries carry a token (`play-sudoku`,
`play-sudoku+` for the extras), their index and a per-load session id; an
entry left behind by a reload starts the history over from the screen showing.

This replaced a single entry kept in front of the app (`armBackTrap`).

**Hooks for what a screen leaves behind.** `onLeaveScreen((from, to) => …)`
(JS_Core.html) runs on every screen change: a game stops there whatever no
`createClock` covers - a `setTimeout` chain (the bomb's tick, the streak's
next question, the picker's settle), a sensor, a wake lock. `clearAllIntervals`
still stops every clock except one made with `keepRunning` (the general
timer, which rings wherever the phone is). `onLanguageChange(view => …)` runs
after the app's or the games' language changes, right after
`paintSetupOptions(view)` - so setup painters rebuild their category lists for
`contentLang()` there, and a screen drawn in JS redraws its text.

### Feel

Taps are acknowledged centrally: a delegated `pointerdown` handler in
`JS_Core.html` paints a ripple, and the click and `haptic()` follow for
everything matching `RIPPLE_TARGETS` - on press for a mouse, when the finger
lifts for touch, because a scroll that starts on a card is a cancelled pointer
and used to click and buzz on every swipe of the home. Individual handlers should **not** add
`playSound('click')` — they only raise meaningful sounds (`success`, `alarm`,
`tick`). The delegated handler calls `playSound('click', true)`; a handler
that still clicks for itself runs on the click event, 100-200ms after the
pointerdown, which sounded like a double click on every such button, so a
click without that flag is dropped for half a second after a tap's, and taps
only collapse among themselves within 70ms.

**Icons stand on their own.** The game and tool icons (`.gcard__icon`,
`.tool-icon`, the setup and tab heroes, the help sheet) are drawn without a
tile or frame: a little bigger, a soft drop shadow, and a faint round halo
of the game's colour behind them (a radial gradient with no edge), which
the owner asked for in place of the squares. A game's icon has to be the
same in `GAME_LIST` (Games.js; the room list takes it from there) and `HELP_ENTRIES`.

### Arabic and RTL

- Use logical properties (`padding-inline`, `inset-inline-start`,
  `margin-inline-start`), never `left`/`right`, or the layout mirrors wrongly.
- Do not apply `letter-spacing` to Arabic text — Arabic letters join, and
  spacing pulls the joins apart. `html[lang="ar"]` already neutralises it on the
  small-caps labels and on `.metric`; `text-transform: uppercase` is a no-op in
  Arabic anyway. If you hand-roll a label with `uppercase tracking-widest`
  instead of using `.eyebrow`, you have re-introduced the bug — use the class.
- Numerals and clocks use `.metric`, which isolates them to LTR. It also renders
  Arabic *words* (the Just One and Fibbage answers), which is why its tracking is
  reset for Arabic rather than left at -0.02em.
- A translation string must not carry an emoji when the element that shows it
  already renders an icon of its own — the home tiles, the tool rows and the room
  hub all do, and the emoji then appears twice as soon as the language is
  toggled (the markup's fallback text has no emoji, the translation did).

### UI/UX Standards
- **Responsive Design:** Use Tailwind CSS classes to ensure the app works well on mobile devices (the primary target).
- **Dark Mode:** Prefer the design-system tokens, which handle both themes. Raw
  `dark:` utilities do work (the build sets `darkMode: 'class'` and the toggle puts
  `dark` on `<body>`) but a token is almost always the better answer.
- **Timers:** Use `createClock()` from `JS_Core.html` for anything that counts
  seconds - never `setInterval` with a decrementing counter. Mobile browsers
  throttle background timers, which froze the old counters whenever the screen
  locked. `createClock` reads elapsed time from `Date.now()` and exposes
  `pause`/`resume`/`toggle`/`stop`/`value`.
- **Inline handlers:** When interpolating a value into an `onclick="fn('...')"`
  attribute, wrap it in `jsStringAttr()`, not `escapeHTML()` - the latter's `&#39;`
  is decoded back to a bare quote before the JS is parsed, which breaks the handler
  for any name containing an apostrophe. Use `escapeHTML()` for text content.
- **RTL Support:** The app defaults to RTL (`dir="rtl"`) but handles LTR for English.

### Data Management
- **No sheets, no database.** Content is code, checked by `npm run check`.
- **LocalStorage:** Use local storage for transient game state (like current round scores) that doesn't need to persist across devices.
- **Rooms:** anything several phones must share goes through the rooms server; anything a player must not see stays in `room.secrets`.
