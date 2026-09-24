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
- **Rooms server (`rooms-worker/`):** one Durable Object per room code. The game rules are `RoomGames.js` at the root, bundled into the Worker with the word lists by `rooms-worker/build.mjs`. See *Multiplayer rooms*.
- **Frontend Entry Point (`Controller.html`):** The main HTML structure that includes styles, scripts, and various game views.
- **Modular JavaScript (`JS_*.html`):** Game logic is organized into separate HTML files acting as JS modules (e.g., `JS_Core.html`, `JS_Monkey.html`, `JS_Utils.html`), included into the main template.
- **Styling (`Tailwind.html` + `Style.html`):** `Tailwind.html` is generated - it holds
  only the Tailwind utilities the markup actually uses. `Style.html` holds the
  hand-written component CSS (cards, buttons, the animated background, view
  transitions) and is edited directly.

## Key Features & Games
- **Group Games:** 
  - 🕵️‍♂️ **Imposter (الجاسوس):** Social deduction game.
  - 🐵 **Monkey (ربع قرد):** the letter game with the phone as referee, plus
    the last-letter chain and one-name-a-turn; on one phone, in a room, on the TV.
  - 🤫 **Just One (كلمة واحدة):** Cooperative word guessing.
  - 🃏 **Skrew (سكرو):** the whole game in a room (every version, mixed or
    alone, singles or two teams, every hand face down on every phone with every
    move shown), and a calculator for a game with real cards; and score keepers for 🎯 إستميشن,
    ♠️ طرنيب, ♥️ تريكس, ♦️ كونكان and 🎣 باصرة (*Card game score keepers*).
  - 🀄 **Domino (الدومينو):** the whole game in a room, 2-4 players or
    computer players, solo or two against two, عادي (Egyptian) or أمريكاني
    (All Fives, with the spinner), on ivory tiles with every move animated;
    and the score keeper for a game with real tiles (*الدومينو in rooms*).
  - 🎲 **Ludo (لودو):** the classic board, 2-4 players, against the phone
    (1-3 computer players, easy or hard) or in a room with the TV; every roll
    and every hop animated (*لودو*).
  - 🏦 **Lucky Bank (بنك الحظ):** Monopoly with Egypt's cities, 2-6
    players, against the phone or in a room with the TV; buildings are جراج ←
    استراحة ← سوق, the decks حظ and محاكمة, a 45-minute game by default
    (*بنك الحظ*).
  - 🎭 **Charades (بدون كلام), 🗣️ Describe It (أوصف لي), ❓ Who Am I? (من أنا؟)**
  - 🧠 **Trivia (تحدي المعلومات):** two ways to play. *دوري المعرفة* is a board for
    two teams on one screen (five categories × 100–500 points, a host reads and
    awards); a room has everyone answer on their own phone, faster right answers
    scoring more.
- **Multiplayer-only (separate phones, see *Multiplayer rooms*):**
  - 🔠 **Codenames (أسماء الرموز):** two teams, a shared 5×5 board, a key only
    the spymasters hold. There is nowhere to hide that key on one phone.
  - 🎨 **Draw & Guess (ارسم وخمّن):** one phone draws, the rest watch it appear.
  - 🤥 **Fibbage (كذبة وصدقة):** invent an answer, then find the real one.
  - ⚖️ **Would You Rather (لو خيروك)** and 👉 **Most Likely To (مين أكثر واحد):**
    the voting engine; votes stay hidden until the round closes.
- **Puzzle/Logic Games:** Wordle, Guess the Number, 🔗 Connections (تشابه) in three
  levels: easy (3 groups, 12 cards), medium (4 groups, 16) and hard (5 groups, 20).
- **Party, one phone:** 🤳 **Heads Up (على راسك):** the phone on a forehead,
  tilt for right or pass; 💣 **The Bomb (القنبلة):** a category and a hidden,
  accelerating fuse, pass the phone; 🚏 **Stop the Bus (أتوبيس كومبليت):** the
  paper game with the phone as letter, clock and scorer; 5️⃣ **Five Seconds
  (خمس ثواني):** name three things in a category before the ring runs out.
- **Quiz cards, one phone or a room:** 🤔 **Emoji Riddles (فوازير إيموجي):**
  a film, a proverb, a dish or a place in emoji (`EmojiRiddles.js`); 📜
  **Complete the Proverb (كمّل المثل):** a proverb with one word missing
  (`Proverbs.js`).
- **Rooms only, no content at all:** 🙊 **Two Truths and a Lie (صدق ولا
  كذب):** everyone writes, everyone votes; 🖍️ **Draw & Write (ارسم واكتب):**
  the drawing telephone, drawn on phones and revealed on the TV; 🧠 **The Mind
  (العقل):** secret numbers laid down in rising order without a word.
- **Multiplayer-only, also:** 🔔 **Buzzer (الجرس):** the host asks out loud,
  every phone is a buzzer, the server keeps the order of presses;
  🕴️ **Mafia (مافيا):** the app narrates night and day, roles on each phone;
  🐄 **Herd Mentality (زي الكل):** write what most of the table will write;
  🌈 **Uno (أونو):** the whole card game, every hand on its own phone, with
  the house rules as switches and computer players to fill the table;
  🗓️ **Timeline (قبل ولا بعد):** put an event in its place on the line,
  before or after the cards already down;
  **Guess Who (خمّن مين):** two duel with a secret face each, yes-or-no
  questions from a list or out loud, winner stays on (*خمّن مين*).
- **Words, one phone or a room:** **Hangman (المشنقة):** two on one phone
  taking turns, or a room where one writes and everyone guesses on their own
  board, or races on the app's word (*المشنقة*).
- **One sets, everyone solves, in rooms** (*One sets, everyone solves*): 🟩
  **خمن الكلمة**, 🔢 **خمّن الرقم** and 🌍 **خمّن الدولة** gain a room where one
  sets the secret and every other phone solves it on its own board, or a race
  on the app's pick; 🤔 **فوازير إيموجي** gains a riddle written by a player
  (and the same race) beside its quiz.
- **Two players & solo:** 🎴 **Memory (لعبة الذاكرة)** solo against the clock
  or two on one phone; ⭕ **Tic Tac Toe (إكس أو)** against a friend or an
  unbeatable minimax, with a "3 marks only" switch that ends the draws, or a
  room (*إكس أو in rooms*); 🔴 **Connect 4 (كونكت ٤)** and 🔲 **Dots & Boxes
  (نقط ومربعات)**: two on one phone, against the phone at three levels, or a
  room where two play and the rest watch, winner stays on (*The duels*).
- 🏆 **The duels' tournament (بطولة)**: every room duel - كونكت ٤, نقط
  ومربعات, إكس أو, خمّن مين, حرب السفن - can be a knockout for four people or
  more: a random draw with byes, every match of a round at once on its own
  two phones, the bracket on the TV, a podium (*The duels' tournament*).
- 🚢 **Battleship (حرب السفن)**: the classic 10×10 with five ships, in real 3D (three.js): against the phone at three levels, or a room where two play and the rest watch, winner stays on (*حرب السفن*).
- ♞ **Chess (شطرنج)**: the full rules in real 3D (three.js) - a wooden board and Staunton pieces: two on one phone, against the computer at a rating from 400 to 2000 with a coach (a warning before a blunder, hints, a word on every move, the pieces in danger), or a room where two play and the rest watch, winner stays on; a chess clock; every game reviewed move by move (*شطرنج*).
- **Chess for teams, in rooms:** 🗳️ **شطرنج بالتصويت (Vote chess):** two teams, every move a secret team vote on everyone's own board, the tally shown once it is played (*شطرنج بالتصويت*). 🧠 **المخ والإيد (Hand and Brain):** 2 against 2, the Brain names a piece, the Hand moves it; computer players fill the seats (*المخ والإيد*).
- **Bughouse (باغ هاوس)**: chess for four on two boards, in rooms: partners on different boards with opposite colours, what you take goes to your partner's hand to drop; clocks always running, a mate or a flag on either board decides it; computer players fill the seats (*باغ هاوس*).
- **شطرنج الأربعة (Four-Player Chess)**: four on one 14×14 board without its corners, in a room with the TV: two teams (red and yellow against blue and green) or everyone for themselves on chess.com's points, where a player out stays on the board as grey walls; computer players, easy and hard, for the empty colours; the 2D chess board's look with the pieces in four colours, turned so your colour is at the bottom (*شطرنج الأربعة*).
- **Cards, in rooms:** **كدّاب (I Doubt It):** lay cards face down and say what they are; anyone can call «كدّاب!», the first tap wins; computer players (*كدّاب*). **الشايب (Old Maid):** draw a card blind from the next hand, pair up, and don't be left holding the drawn old man; drag your cards about while someone is lifting one (*الشايب*).
- **Sports, in real 3D (three.js):** 🎳 **Bowling (بولينج):** swipe the ball down a
  wooden lane, a curve in the swipe hooks it; solo for a best score, or a
  room where everyone bowls in turn and everyone watches (*بولينج*). ⛳ **Mini Golf (ميني جولف):** sixty holes, twenty
  easy, twenty medium and twenty hard, each its own place (a windmill, the
  Corniche, Khan el-Khalili's magic lamp, the metro's turnstiles, Qaitbay's
  moat, the Blue Hole, the Suez Canal's ferries, Ibn Tulun's spiral, a pinball
  table, a rocket in space…), pull back from the ball and let go; games of 3,
  6, 9 or 18 holes drawn at random from the difficulty chosen (or mixed,
  easiest first); solo with the best kept on the phone, or a room with the
  TV where every ball plays the hole at once, or in turns with the balls
  knocking each other (*ميني جولف*).
- **Solo, with a puzzle of the day** (*Solo games*): #️⃣ Sudoku, 🔷 2048,
  🚩 Minesweeper, 👑 Queens, ☀️ Tango, 🖼️ Nonogram; 🧵 خيوط, 🔡 كلمات من
  حروف, 🔗 إيه اللي يجمعهم؟, 🔥 سلسلة الإجابات, 🌍 خمّن الدولة.
- **Utility Tools:**
  - 👆 Who starts? (مين يبدأ؟), the finger chooser: one starts, two teams, or an order.
  - 🏆 Tournament Organizer, 👥 Team Generator, 🎡 Random Picker.
  - ♟️ Chess Clock, ⏱️ General Timers, 🎲 Dice & Coin.
  - 🀄 Domino Scorer (a shortcut to the domino setup's "على الطاولة" side),
    🔢 Universal Counter, 🔊 the soundboard.

## Where the app is going: ideas, decisions and the log

This part is the memory of the project for whoever picks it up next, person
or AI: what the owner has decided, what is waiting, and what each batch of
work changed. Add to it when a decision is made or a batch ships.

### The owner's specs, as built

- **ألغاز شطرنج (chess puzzles)** - the owner's plan of 24 Sep 2026, approved
  as a whole (*ألغاز شطرنج*):
  - **Puzzles made by the app's own engine at build time**, nothing to look
    after: `ChessPuzzles.js`, 1,505 of them (540 easy, 540 medium, 425 hard),
    from `tools/make-chess-puzzles.mjs` (`npm run build:puzzles`, by hand).
    Every step has exactly one winning move.
  - **Levels easy / medium / hard**; a free puzzle of a level is dealt
    through `freshPick`.
  - **A puzzle of the day in تحدي اليوم**: the same on every phone, medium on
    most days, easy on Saturday, hard on Friday; played once; its line ♟️ ✅,
    ♟️ ✅ 2 (the tries), ♟️ 💡 (a hint), ♟️ ❌ (gave up).
  - **«سلسلة الألغاز»**: 3 hearts, no clock, harder as it goes (from about 500,
    60-80 more a solve), the best kept on the phone.
  - **Puzzles from your own mistakes**, from the review, and «جرّبها كلغز» on
    a mistake in the review.
  - Decided here (open to change, each one place in the code):
    - **The icon is drawn** (`art:chesspuzzle`, a knight on the corner of a
      green board with a gold star): the runbook's 🧩 is Connections' icon and
      ♟️ the chess clock tool's, and a new icon must not repeat another's.
    - **A right move** leads to the same position as the line's (castling by
      the rook counts), **or mates at once** (a mate in 2 found another way).
    - **A wrong move counts once**: the board takes no move for 0.65 s while it
      shakes back (`CHPZ_LOCK_MS`), so a double tap can't cost two tries or two
      hearts.
    - **No hint and no «شوف الحل» in the streak**; a wrong move there plays
      the solution, then «اللغز اللي بعده» on a tap (a pause to look).
    - **The daily's tries** are 1 + the wrong moves; a hint shows as 💡
      whatever the tries; «شوف الحل» is a give-up (❌).
    - **Mistakes**: "any move within 50 cp" is judged by analysing the position
      after it and the position after the best alike (20,000 positions each),
      never from a second line; the move played in the game is always wrong;
      **the first two moves each from the usual start are left out of the
      list** (there nearly every move is as good as the best: "find a better
      first move" is no puzzle) - the review's button still offers them.
    - A free puzzle (or the daily) dealt in the middle of a streak puts the
      streak's puzzle aside, and "continue" brings it back.
- **باغ هاوس (Bughouse)** - the owner's decision of 24 Sep 2026 (batch 4,
  Decision 3 of `notes/BATCH4_RUNBOOK.md`) (*باغ هاوس*):
  - **4 players on two boards**, partners on different boards with
    opposite colours (A White on board 1, their partner Black on board 2).
  - **What you capture goes to your partner's hand**; on your move you may
    **drop** a piece from your hand onto an empty square instead of moving -
    no pawn on the first or last row, a drop may give check or mate, **a
    promoted piece captured goes over as a pawn**.
  - **The clock is always on, 3+0 by default** (2+0 / 3+0 / 5+0); a flag
    loses for the team; **a mate on either board wins for that team**.
  - **Computer players fill empty seats**, easy and hard: a normal move
    choice plus sensible drops - a drop that mates first, otherwise a drop on
    a good square near the enemy king when there is something worth
    dropping.
  - **Both boards on every phone**: your own big, your partner's small beside
    or under it (a tap swaps the sizes); the TV shows both side by side.
  - Rooms only (each on their own phone, the TV optional).
  - Decided here (open to change, each in one place):
    - **The game ends on a mate only** (`chessBugStatus`): no repetition,
      fifty moves or "too little to mate" - a piece can always arrive. **No
      move and nothing to drop is not stalemate: the side waits** for its
      partner to send a piece, its clock running (chess.com's way). **A mate
      is judged with the hand as it is**: a piece that might arrive later
      doesn't save it (FICS's way).
    - **The clocks start together, 3 seconds after the deal**
      (`BUG_START_MS`), White to move on both boards; there is no free
      first move as in the chess room. A move reaching the server up to 0.6 s
      after the time ran out still counts (chess's `CHESS_GRACE_MS`); a flag
      always loses (no "can't mate, so a draw": pieces can be dropped).
    - **Empty seats at the start get easy computer players** named from the
      host's phone (`botNames`); the host adds hard ones with the lobby's
      buttons. With more than four people the first four of a random order
      play and the rest watch (no computer players then).
    - **A leaver's board is played on by a hard computer player** for the
      rest of that game (`s.subs`, said on every screen), named after them
      with 🤖; it stays for play again like any computer player.
    - **Play again turns the partners round**: the first of the line keeps
      their place and the other three move on one, so three games in a row
      are the three pairings; with more than four, whoever watched plays
      first. A person who joined takes a computer player's seat.
    - **Resigning** loses for your team (a confirm first); **no draws** are
      offered. The host's "play for" on a quiet board plays the easy
      computer's move (40 seconds, or at once for a phone that's away).
    - **No forced moves**: a single legal move is never played for you (the
      chess rule).
    - Scores: each winner gets a point; the board is the room's scoreboard.
    - The TV draws both boards in 2D (chess's 3D view is one per page, and
      two boards would want two), team A at the bottom of both; a phone's big
      board is chess's own view (2D by default, 3D a tap away), the small one
      2D.
    - The home: **ورق وطاولة** (`group: 'table'`, a board game for four),
      teal, a drawn icon (two boards and a piece flying between them),
      `players: [1, 4]`; in the hub from one person (computer players).

- **شطرنج الأربعة (Four-Player Chess)** - the owner's decisions of 24 Sep
  2026, every rule asked first (`notes/BATCH5_RUNBOOK.md`), look أ «بطولة»
  picked from a design sheet of three (*شطرنج الأربعة*):
  - **Rooms only**, every player on their own phone, the TV optional.
  - **Two ways, a lobby choice: teams (the default) and everyone for
    themselves.** Teams: 2 against 2, partners opposite (red + yellow against
    blue + green); a team wins when **either** opponent is mated (or resigns,
    or runs out of time). Everyone for themselves: **chess.com's points** - a
    pawn 1, a knight 3, a bishop 5, a rook 5, a queen 9 (a promoted queen 1), a
    mate +20 to whoever's move gave it, a stalemated player out with +20 for
    themselves; **a player mated, stalemated, resigning or out of time is out,
    their pieces grey walls** (they neither move, attack nor can be taken); the
    game ends when one is left and the highest score wins (ties share it).
  - **Computer players, easy and hard**, fill the empty colours, so 1 to 3
    people can play.
  - **The look**: the 2D chess board's green `#769656` and cream `#eeeed2`, the
    four 3 × 3 corners cut away, the pieces in four bright colours - red
    `#d6453d`, blue `#3f73d6`, yellow `#e9b52a`, green `#35a35a`, each with a
    darker outline - grey `#9a9a9a` for a player out; red at the bottom, blue on
    the left, yellow at the top, green on the right; **on your phone the board
    turns so your colour is at the bottom** (the TV: red at the bottom).
  - Decided here, standard four-player chess as on chess.com (each in one
    place): the order red, blue, yellow, green, red first; pawns toward the far
    side, one or two from their first row, no en passant; **promotion to a
    queen on the 8th row from its side (everyone for themselves) or the 11th
    (teams)**; castling both ways, the usual conditions; check from any
    opponent, never a partner; **a mate or a stalemate is judged on the
    player's own turn** (someone left in check by one player's move still gets
    to answer it, so a king is never taken); in teams a player with no move and
    not in check passes (all four passing in a row is a draw); a clock off by
    default, 1, 3 or 5 minutes each plus 5 seconds a move; the host's "play
    for" a quiet phone (an easy computer move, marked); leaving: out (everyone
    for themselves), a computer player takes the seat (teams); the host seats
    everyone in a colour, bots fill the empty ones, play again keeps the table
    and turns it by one (so red, who starts, is someone else).
  - Decided while building (open to change, each in one place):
    - **The kings and queens stand as on the owner's sheet**: red Q g1 K h1,
      yellow K g14 Q h14, blue Q a7 K a8, green K n7 Q n8 - every king faces
      the queen across the board (`chess4StartBoard`).
    - **Fifty moves each with no capture or pawn move end the game** (everyone
      for themselves: the highest score wins; teams: a draw), and so does a
      game of 600 moves (`CHESS4_QUIET`, `CHESS4_MAX_PLIES`): whole games of
      easy computer players ran past 700.
    - **The points of a mate go to whoever's move gave the check** (for a
      discovered check, the player who moved), kept per king in `g.giver`;
      failing that, a player attacking the king.
    - **A player's first move is free on the clock** (the table finds its
      seats); after it the clock runs on their turn.
    - **A colour still empty at the start gets an easy computer player**, named
      in the host's language; a leaver's seat in teams gets a hard one, under
      their name.
    - **The TV shows the large 2D board, not 3D**: the chess 3D engine is built
      for 8 × 8 (its board texture, camera and picking), and a 14 × 14 3D board
      was more than this batch could do well.
    - **Each player's chip sits in the cut corner at their left hand** (the one
      at the bottom in the bottom-left, and round the board clockwise), so the
      board keeps the whole width.

- **One sets, everyone solves** - the owner's decisions of 23 Sep 2026,
  asked one by one (*One sets, everyone solves*):
  - **المشنقة's room way made an engine**: a setter writes or picks a
    secret, every other phone solves it **on its own board** (never seeing
    the others' guesses, only how far each is), **the setter moves round the
    table**; or **a race on the app's pick** (nobody sets). **A lobby choice,
    "one sets, the rest solve" by default.** A future game of the kind is a
    plug-in. Hangman may move onto it if that is clean and safe - left as it
    is, decided here (below).
  - **Scoring like المشنقة's race, in both ways**: each solver **10 + a bonus
    by order** (+5 first, +4 ... +1); **the setter 5 for every player who
    didn't solve it**; **fewer tries break ties** on the board.
  - **خمن الكلمة**: the setter types a word, everyone guesses in their own
    grid with the right / present / absent colours; the race deals from the
    Wordle lists; the keyboard follows the word's alphabet.
  - **خمّن الرقم**: the setter picks a number in the host's range, everyone
    guesses with higher / lower on their own phone; the race: the app picks.
  - **خمّن الدولة**: the setter picks a country from the table (searchable,
    both languages), everyone guesses from the flag or by distance (the
    host's choice) with the one-phone game's hints; the race: the app picks,
    tiers like the one-phone game's.
  - **فوازير إيموجي written by a player**: an answer, its kind (a chip: a
    film, a proverb, a dish, a place, a thing) and its clue in emoji only; a
    clue that spells the answer is refused; guesses typed and judged by
    `guessVerdict` (right / close, "🔥 قريب") with retries; the race uses
    `EmojiRiddles.js`. **The existing emoji quiz stays**; a new way of the
    same game rather than a separate entry is preferred.
  - **3, 5 or 10 a game and a clock off / 60 / 90 seconds** like المشنقة
    (sensible per game); the host can skip a quiet setter; a setter who leaves
    before setting hands it on; fewer than two ends the game; latecomers
    watch.
  - **The TV** shows the setter, the shape of the secret where it has one,
    each player's progress (tries, the order they solved in) - never a
    guess's content that would give the secret away.
  - **Hidden information**: the secret on the server and the setter's phone
    only, each board on its own phone only, `shared` progress only; a Wordle
    solver's colours and the number's higher / lower worked out on the
    server.
  - Decided here (open to change, each one place in the code):
    - **المشنقة stays on its own code** (`RoomHangman.js`): moving it would
      change its shared fields (`len`, `shape`, `progress.n` / `miss`), its
      actions (`setWord`, `whole`) and its tests for nothing a player would
      see; the engine is its generalisation, and a later move is a plug-in.
    - **فوازير إيموجي plays three ways in a room**: «واحد يكتب» (the
      default), «سباق» (the app's riddles, each guessing on their own phone)
      and «مسابقة» (the quiz as it was, wrong guesses shown to the table). The
      race is on the engine rather than being the quiz because the quiz shows
      everyone's wrong guesses, which the owner's engine does not. A phone
      too old to send the way starts the quiz, as before.
    - **The tries**: خمن الكلمة 6, or 7 for a word of 7 or 8 (the one-phone
      game's); خمّن الرقم two more than halving needs (8, 9, 12 for 1-50,
      1-100, 1-1000); خمّن الدولة 6 from the flag, 8 by distance (the
      one-phone game's); فوازير إيموجي 6. Out of tries is a miss, so the
      setter's points mean something even with no clock.
    - **"Fewer tries" is the tries it took to get the ones a player got**,
      summed over the game (`shared.tries`); a miss adds nothing.
    - **A written word is checked for its length (5-8) and its letters (one
      keypad), not against a dictionary**: the one-phone game takes any guess
      too, and a list would refuse names and dialect. Guesses are the same:
      the right length on the word's keypad. A repeated guess costs nothing.
    - **ه is not ة in خمن الكلمة**: a key each, as on one phone (only أ إ آ ٱ
      fold to ا).
    - **The ranges**: 1-50, 1-100 (default), 1-1000; the race's number is
      picked at random. **The clocks**: خمن الكلمة 90 or 120 seconds (typing
      five letters six times takes longer), the others 60 or 90.
    - **What the table sees of a board**: its tries, its state and its place;
      for خمن الكلمة the colours of each row without the letters (a Wordle
      grid as people share it); for خمّن الدولة the closest a player has come
      as a percentage. For خمّن الرقم the tries only - another solver's
      narrowed range would give the number away - and the same for the
      riddles.
    - **The flag is the clue itself** in the flag way, so it reaches every
      phone and the TV as the flag emoji (two regional letters: a phone that
      reads its own traffic sees what the screen shows it anyway); by
      distance nothing is shown.
    - A riddle's clue is up to 40 characters of emoji (keycaps, families and
      skin tones included), the answer 2 letters to 8 words; the letter emoji
      (a flag's regional letters, 🅰️, 🆗 …) may not spell the answer or a word
      of it.
    - A setter may pick any country; the race asks tier 1 (easy, the
      default) or every country (hard).

- **شطرنج بالتصويت and المخ والإيد (chess for teams)** - the owner's
  decisions of 24 Sep 2026 (`notes/BATCH4_RUNBOOK.md`, Decisions 1 and 2),
  rooms only, the TV optional (*شطرنج بالتصويت*, *المخ والإيد*):
  - **شطرنج بالتصويت**: two teams split by the host in the lobby (at random,
    then moves across), any number from 2 (1 vs 1 is chess by a vote of one).
    On a team's move every member taps a move on their own board; **the move
    with the most votes is played when the vote clock ends or every member
    present has voted; a tie is drawn at random among the tied moves.** The
    vote clock **30 s by default** (20 / 30 / 60, the host's). **Votes secret
    until the move is played** (who voted public, not for what), then the table
    sees how the team voted (♞f3 ×3, e4 ×1). **No computer players.** Nobody
    voted: the move with most votes, or a random legal move, said as such. The
    team chat is the room chat's team channel.
  - **المخ والإيد**: 2 vs 2, computer players (easy, hard) fill empty seats.
    On a team's move the **Brain** names a kind (♔ ♕ ♖ ♗ ♘ ♙, only kinds with
    a legal move lit), then the **Hand** plays any legal move of that kind.
    **Roles fixed for a game, swapped for the next.** A clock per team, **off
    by default**, 5+0 / 10+0. The Brain sees the board and can't move; the Hand
    sees the named pieces lit; what the Brain named is public.
  - Decided here (open to change, each in one place):
    - Vote chess: **resigning is a vote** (🏳️ beside the moves) that wins only
      with more votes than any move - a tie with a move plays the move, never
      a resignation by lot (`vcClose`). **Play again keeps the teams and swaps
      the colours**, a newcomer joining the smaller team and the last game's
      team chat dropped (its colours are the other side's now). A member who
      leaves drops out of the count (the vote may close on the spot); a team
      with nobody left loses. A latecomer watches and plays the next game. The
      host's "close the vote now" is decided by the votes so far.
    - Hand and Brain: the seats are the host's, like الدومينو's (people first
      at random, two taps swap two seats, an empty seat included; 🔀 draws
      again); **the empty seats are filled with easy computer players at the
      start**, named by the host's phone in its language; more than four people
      and the rest watch. **Play again swaps the roles and the colours.** A
      seated player who leaves mid-game: **a computer player (easy) takes the
      seat** («🤖 منى») so the other three can finish. Either member resigns
      for the team. The host's "play for" plays as an easy computer player. A
      Brain with one kind that can move has it named for them, and a Hand with
      one legal move of the named kind has it played - unless it ends the game.
    - The Brain's word in Arabic is «المخ (منى) قال: الحصان!»: the role is the
      subject, so the verb fits any name (a name doesn't say قال or قالت).
    - Both are in **ورق وطاولة** (Cards & table), beside لودو and بنك الحظ: a
      board game at the table; «لاتنين على موبايل» isn't true of them.
    - The icons are drawn (`art:votechess` a ballot with a pawn going into
      the box, `art:handbrain` a brain and the pawn it names).

- **شطرنج (Chess)** - the owner's spec of 23 Sep 2026, asked one question at a
  time, then the computer's strength and the coach added the same day
  (*شطرنج*):
  - **Three ways**: **a room duel with the TV** (the duels' winner stays on:
    two play, the rest watch on their phones and the TV; the challenger has
    White), **against the computer**, and **two on one phone**. In the duels'
    section (`group: 'duo'`), `modes: ['device', 'room', 'tv']`.
  - **2D or 3D, the player's choice** (the owner, 24 Sep 2026: "the option to
    play it normal, same look as in chess.com, so it's optional"): **2D by
    default on a phone**, «🧊 3D» / «▦ 2D» on every board (one phone, a room's
    phone, the review) keeping the game, the piece picked up and the arrows,
    remembered on the phone; **the TV keeps 3D** and has no switch; three.js is
    never loaded while a phone stays in 2D. The 2D board is chess.com's kind:
    green `#769656` / cream `#eeeed2`, the last move's squares yellow, legal
    moves as dots and captures as rings, the coordinates in the edge squares'
    corners, a 0.15 s slide, and **our own drawn piece set** (never a copied
    one). **Four board styles**, «أخضر» (the default), «خشب», «أزرق», «رخام»,
    for both boards: in the setup and behind the board's ⚙. The 3D board got
    the owner's list: a lift, an arc and a settle for every move (a knight
    hops higher), a capture knocked over away from the attacker with a puff of
    dust, a red pulse under a king in check, a slow topple and a thud on mate
    with the camera easing in, castling as one movement, a promotion rising in
    a sparkle; finer pieces (smoothed profiles, a green felt, a carved knight
    with mane, ears and eyes, a bevelled cross), real grain, a varnish, a
    bevelled frame, soft contact shadows; and the camera in the player's hands
    (two fingers or a right/middle mouse button turn it, a pinch or the wheel
    zooms, «⬇ من فوق» and «↺»). A room or a table around the board was offered
    and not chosen.
  - **The look: real 3D "like bowling and golf"**: a wooden board (maple and
    walnut, the frame with a-h and 1-8) and Staunton pieces turned on a lathe
    (a pawn's collar and ball, a rook's battlements, the cut in a bishop's
    mitre, a carved knight's head, the queen's coronet, the king's cross),
    seen at an angle from your side; a move slides (a knight hops), a piece
    taken is knocked off and set beside the board, the king in check glows
    red, the last move's squares are tinted; tap a piece for its moves (a dot,
    a ring round a capture), tap a square - or drag. A flat board where 3D
    can't draw. Squares a-h / 1-8 (`dir="ltr"`).
  - **A chess clock, off by default**: off, 1+0, 3+0, 3+2, 5+0, 10+0,
    15+10 (minutes + seconds a move; 1+0, 3+0 and 15+10 added in batch 2) -
    the host's choice in a room, a setup choice on one phone. **Running out loses, unless the other side has nothing to mate
    with: then a draw.**
  - **The full rules**: castling both ways with every condition, en passant,
    promotion with a choice of four, check, mate, stalemate, threefold
    repetition, the fifty-move rule, insufficient material; a draw offered
    (the other accepts or refuses) and resigning.
  - **In a tournament** (the duels' tournament, plugged in 23 Sep 2026 with the
    owner's decisions of that day): exactly like the other duels - the lobby
    switch from four people, the matches of a round at once, random byes, the
    bracket, the podium, a new tournament or back to winner stays. **A drawn
    game is replayed once with the colours swapped; drawn again, one
    Armageddon game where a draw counts as a win for Black** - said on the
    phones and the TV («إعادة بالألوان معكوسة», «أرماجدون: التعادل للأسود»).
    **The host's clock runs per match** (off, 3+2, 5+0, 10+0; a flag ends that
    match only), draw offers and resigning work per match, your own match
    comes up by itself on the 3D board (your colour at the bottom), anyone
    watches any match, every game you played is kept for the review, and the
    TV shows the bracket with a small flat board and both clocks for every
    match being played (the big one, the host's pick or the last match left,
    on the 3D board). In winner stays a draw is the duels' draw: the champion
    keeps the seat.
  - **The host's "play for"** (decided here, in winner stays and in a
    tournament's match): after 40 seconds on one move, or at once for a phone
    that's away, the host can have **the computer play one move** for the side
    to move - an ordinary move at a low rating (800, one move deep, a few
    hundred positions: `chessHostMove`), never the engine's best, since it is
    the player's game and not the host's, and cheap enough for the server's
    free-plan time. With a clock on, running out is the other way on.
  - **The computer has a rating, 400 to 2000 in steps of 100** (replacing
    easy / medium / hard), a slider with a name for each band - مبتدئ 400-700,
    متوسط 800-1200, قوي 1300-1600, خبير 1700-2000 - remembered on the phone.
    The strength really follows the number: 400 looks one move ahead with no
    look at the captures after it (so it leaves pieces hanging and grabs
    defended ones), wobbles its judgement by up to two pawns and plays a
    random move a quarter of the time; each step looks deeper, at more
    positions, wobbling and slipping less; 2000 searches up to 1.5 s with none
    of it (`chessEloSettings`).
  - **The coach**, a setup switch, off by default, remembered:
    - **Live, against the computer only** (it would be unfair against a
      person): a **warning before a blunder** ("استنى! الوزير بتاعك على d4
      ممكن يتاكل"), take it back or play it anyway; a **hint** button (the
      best move as an arrow on the board, and why in one line); **a word after
      each of your moves** (best / good / inaccuracy / mistake / blunder, why,
      and the better move); **the pieces in danger** marked (attacked and not
      defended, or attacked by something cheaper: yours red, theirs green).
      Each can be switched off in the coach's settings; all on with the coach.
    - **A review after every game** - against the computer, two on one phone,
      and a room's once it is over, on each phone: every move rated
      (brilliant / best / good / inaccuracy / mistake / blunder) with the
      better move and why, an **accuracy for each player**, **the evaluation
      as a graph**, the game **replayed on the board with jumps to the key
      moments** (turning points, missed chances, brilliant moves), and **"try
      the better move"**: from that moment the better move is played and you
      carry on against the computer.
    - **The reasons come from the position**, templated sentences in Arabic
      and English from what the engine sees - a piece left hanging, a fork, a
      pin, a mate allowed or missed, material won or lost, the king's safety,
      development and the centre in the opening - never filler.
    - The analysis is worked out a position at a time with a progress bar, so
      the page never freezes; **the last 20 games are kept on the phone** and
      their reviews open from the chess setup screen.
  - Decided here (open to change, each in one place):
    - **Your colour at the bottom** (against the computer and on your own
      phone in a room; watchers and the TV see White at the bottom). **Two on
      one phone: White at the bottom, not turned every move** - a board that
      spins round after each move is hard to follow and loses the last move,
      and the phone is usually passed, not sat across; a ↻ button turns it any
      time. The colours swap every game there, as the duels' first move does.
    - **Threefold repetition and the fifty-move rule end the game by
      themselves** (as on every app a family plays on), rather than waiting
      for a claim.
    - **The clock starts with Black's first move** (White's first move is
      free, as online) and a move reaching the server up to 0.6 s after the
      time ran out still counts (the network's share, `CHESS_GRACE_MS`).
    - **Legal moves are always shown** for the piece you pick up (no switch),
      and the last move and check always marked.
    - **Promotion is a small picker over the square**: queen, rook, bishop,
      knight, or ✕.
    - **A single legal move is never played for you**: the move is the game
      and a player is meant to find it unaided - the standing "one thing to do
      is done for you" rule's own exceptions (*Decided, and why*), like the
      duels' last move.
    - A draw offer: once a move each; the other accepts or refuses, and
      making a move instead says no. Resigning asks first. On one phone a draw
      is both agreeing (a confirm), against the computer there is none.
    - The move list is in figurine notation (♞f3) - the same in both
      languages.
    - In a tournament's Armageddon both keep the match's clock, and White is
      drawn by lot (`chessMatchNext`).
    - The TV shows no review (the owner called it optional); the phones do.
  - **Batch 2** - the owner's decisions of 24 Sep 2026 (approved as a list;
    the choices marked "Claude's" were proposed and kept, each one place in
    the code):
    - **Opening names** as you play (a line over the move list, one phone, a
      room, the TV) and in the review («خرجت من النظرية في الحركة 7»), about
      150 openings in both languages, matched by position so transpositions
      work; never in a 960 or set-up game.
    - **Your rating**: 800 to start, a normal Elo (K 32 for the first 20 rated
      games, then 20) against the computer's rating. **Only games with no
      help count**: no undo, no hint, no best-move arrows, no coach warning,
      not from a set-up position, no handicap; Chess960 counts. The setup
      says before the game whether it will count and why not. A new game
      started over an unfinished rated one asks first and counts it as a
      loss (chess.com's rule), and so does resigning.
    - **Undo and hints against the computer**: unlimited / 3 a game / none,
      **3 by default**, remembered. Undo takes back your move and the
      computer's; the hint no longer needs the coach; each is counted and
      shows what is left («↶ 2»).
    - **Six characters** beside the slider (Claude's): «نونو» 400 (just
      learning), «عم حسن» 800 (attacks, loves checks), «ميرا» 1100 (solid,
      trades), «الكابتن» 1400, «الأستاذ» 1700, «الجنرال» 2000; a drawn face
      each, one line, and a suggestion near your rating + 100; the slider
      stays as «مخصص».
    - **Set up a position** (an editor: a palette, whose turn, castling where
      valid) **and eight famous endgames** (K+Q, K+R, K+P, two bishops,
      bishop and knight, Lucena, Philidor, Réti's pawn race), each with a line
      of what to do; checked before play; never rated.
    - **Chess960, handicap and the new clocks everywhere**: against the
      computer, two on one phone, room duels and the tournament (the host's
      lobby choice) - **except handicap, which a tournament doesn't have**.
      The handicap (Claude's): none, the f-pawn, the b-knight, the a-rook
      (castling that side lost) or the queen, or half the clock; against the
      computer you choose who gives it, two on one phone White or Black, in a
      room **the champion** gives it (with exactly two, the last winner; the
      first game none).
    - **Premoves**: only against the computer and on your own phone in a
      room. One, a blue arrow, played the instant it is your turn if still
      legal, dropped with a shake if not; a tap anywhere else cancels.
    - **Arrows and marks by hand**: ✏️ on the board for a finger; on a
      computer a right-drag draws an arrow and a right-click marks a square -
      **in 3D with Shift**, since a right-drag turns the 3D board (decided in
      batch 2 part C2: the 3D camera came first). Green; the same again takes
      it away; gone when a move is played; never sent to a room.
    - **Board styles** (done with the 2D board, above).
    - **Sharing a game**: a picture of the final position (the share card with
      a board on it), the PGN (copied, or the share sheet), and a short replay
      video where the phone can record a canvas (0.6 s a move, 20 s at most),
      the button hidden where it can't.
    - **Best-move arrows**: a coach switch «أفضل الحركات», **off by default**,
      against the computer only: on your turn the top 3 moves as arrows
      (green, lighter green, yellow), each labelled with your winning chance
      («64%»), and «فوزك لو لعبت: ♞f3 64% · e4 61% · d4 58%» under the board.
      Using it makes the game unrated.
    - Decided while building (open to change, each one place): a handicap
      on a 960 row takes the f-pawn, the knight or rook nearest the a-file, or
      the queen (`chOddsFen`); in 960 a king step and castling that land on
      one square - a tap on the square is the step, castling is by the rook
      (`chTapLogic`); a premove offers the piece's moves on an empty board
      (Lichess's way) and a pawn premoved to the last rank becomes a queen
      (`chPremoveTargets`); the best moves are five candidates from a short
      look, each searched in a tick of its own, the best three kept
      (`CH_BEST`); the share card and the video put ⚪ / ⚫ before the names
      (the chess glyphs become emoji on an iPhone).
  - **الوزير المستخبي (Hidden queen)** - the owner's decisions of 24 Sep 2026,
    asked one by one (*شطرنج*, "The hidden queen"):
    - **A room duel** (winner stays; each on their own phone, the TV
      optional) **and against the computer**. Not two on one phone (the secret
      can't be hidden there) and **not in the duels' tournament**: the lobby
      hides the choice while the tournament switch is on, and says so.
    - **The pick**: before the first move each player taps one of their own
      pawns. With the room's clock on, the pick has its own clock, 60 seconds
      (خمّن مين's), and an unpicked player gets a random pawn; the host's
      "play for" picks at random too. Against the computer you pick, the
      computer at random.
    - **Until revealed it is a pawn for everything the other side sees or is
      affected by**: it attacks only as a pawn, never gives check, never keeps
      the other king off a square, and the other side's legal moves never
      depend on it. Its owner moves it like a pawn (it stays hidden, the secret
      following it) or like a queen from its square - any queen move a pawn
      couldn't make - which reveals it: a real queen on the board, capturing
      or checking like any queen, never taking a king. A queen move a pawn
      could also make (a step, the double step, a diagonal capture) is a pawn
      move.
    - **Reaching the last rank still hidden** it promotes like any pawn (the
      choice of four) and the secret is gone, told to nobody until the game
      ends. **Captured while hidden** it is revealed ("👑 كان الوزير!" on
      every screen) and counts as a queen.
    - **At the end both picks are shown.**
    - The look: a third choice in «🎲 نوع اللعبة» (عادي / 960 / «👑 الوزير
      المستخبي»), its own hint line shown only when it is picked; a gold crown
      on the hidden pawn on its owner's phone only; «اختار العسكري اللي هيبقى
      وزيرك المستخبي» with your pawns lit while picking; the reveal a moment on
      every screen (the pawn turning into a queen with a pop, «👑 وزير
      مستخبي!»); a revealing move written as a queen move with 👑.
    - **Never rated, no handicap with it**; 960 and the hidden queen are one
      choice (`variant`: 'standard' | '960' | 'hq').
    - Decided while building (each in one place):
      - **A mate or a stalemate is judged with the hidden queen's moves too**
        (`chessHqPlay`): a side whose only way out is its hidden queen isn't
        mated - the game going on is a tell the rules can't avoid (the SAN's
        # becomes +).
      - **A pick is final**: one tap picks, a second on the same pawn (or the
        button) confirms, and it can't be changed.
      - **The handicap is not offered with it** (hidden on one phone, the lobby
        and the server ignore it), and a remembered hidden queen starts a
        tournament standard.
      - **The computer** considers its own hidden queen's moves at the root of
        its search only (deeper, every hidden queen is the pawn it looks like),
        in the same time and node budget; it never knows yours. The host's
        "play for" may use the hidden queen (the same search, cheap).
      - **The review** plays a revealing move as the queen's (stored `e2e5*`);
        its positions show the pawn until it moves. The coach, the hint and
        the best-move arrows read the board as it looks (hidden queens are
        pawns), so they never suggest a hidden queen's move; a premove of it
        is a pawn's.
      - Nothing ticks while picking on one phone (you are alone); the chess
        clock starts, as always, with White's first move.

- **The duels' tournament (بطولة)** - the owner's decisions of 23 Sep 2026,
  asked one by one (*The duels' tournament*):
  - **Two ways to play a room duel: winner stays** (today's, still the default)
    **and a tournament.** The tournament is **a lobby switch shown only when the
    room has 4 people or more** (computer players don't count and sit it out);
    with 2 or 3 it isn't shown and the room plays winner stays.
  - **The matches of a round are played at the same time**, each pair on their
    own phones. The TV, and whoever is out or waiting, see **the bracket filling
    in** and can watch any match live (a picker of the matches on a phone; the
    TV shows the bracket with the matches being played beside it as small live
    boards, and a match big when the host picks it).
  - **Random byes in round 1** when the number isn't a power of two, placed as
    the Tournament Organizer tool places them (a seeded draw: two byes never
    meet); **the draw of the pairs is random.**
  - **A drawn game (كونكت ٤, نقط ومربعات, إكس أو) is replayed with the other
    player starting, until someone wins.** A match is otherwise one game.
  - The games: **كونكت ٤, نقط ومربعات, خمّن مين, حرب السفن, and إكس أو brought
    into rooms** as a room duel of its own (winner stays and the tournament,
    "3 marks only" as a lobby option, the look and motion of the one-phone
    game; the rules once in `TicTacToe.js`; `modes` gained 'room' and 'tv';
    the phone as a player stays on one phone).
  - **The end: the champion on a podium** with the runner-up and the two
    semi-finalists, confetti, and the night's leaderboard; then the host deals
    **a new tournament** (a new draw) or **switches back to winner stays**.
  - Decided here (open to change, each in one place):
    - **The night's leaderboard**: a tournament scores **3 to the champion, 2 to
      the runner-up, 1 to each semi-finalist** (`TOUR_POINTS`), the podium in
      points; a new tournament adds to them (like play again), and they are
      banked when the room goes back to the hub, as every game's board is. So
      one tournament gives the night's places 3 / 2 / 1 / 1 and nothing to
      whoever went out earlier. Switching between winner stays and a tournament
      banks the board so far first, as the hub would.
    - **A match starts once both its players are known** (`TOUR_NEXT_MS`, 6
      seconds, so the winner sees the win and their name fly to the next slot) -
      so two byes that meet in round 2 start at once, beside round 1's matches,
      and nobody waits for a round they aren't in. The first matches wait for
      the draw to fly onto the screens (`TOUR_DRAW_MS`, 4.5 s), a replay 4 s
      (`TOUR_REPLAY_MS`). The first game of a match: who starts is random.
    - **Leaving**: a match being played is lost by forfeit, as in winner stays;
      one about to start is a walkover; a match you would have gone on to is a
      walkover for whoever meets you. If both players of a match leave, the
      first hands it to the other, who then walks their next opponent through;
      a match with nobody left sends nobody on; a final with nobody left ends
      with no champion. **A latecomer watches and plays the next tournament.**
    - The turn clocks and the host's "play for" (خمّن مين, حرب السفن, شطرنج)
      work per match, on the match the host is looking at (on the TV, the
      match it shows big); كونكت ٤, نقط ومربعات and إكس أو have no clock, and
      a phone gone quiet is the host's ✕ (a forfeit). Chess's draw rule is its
      own (*The owner's specs*, شطرنج).
    - A phone shows its own match by itself - the one it plays, a replay, the
      one it just won or lost while its board is kept - and the bracket
      otherwise; a new match of its own takes it back there.
    - إكس أو in rooms: seat 0 is X and moves first; with 3 marks only the
      fading oldest mark shows on its owner's phone, on their turn, only.

- **ميني جولف (Mini Golf)** - the owner's rules of 23 Sep 2026, asked one at
  a time; look أ «نجيلة» picked from the lead's 3D preview (striped mown grass,
  wooden rails, a stone border, blue water with a stone bank, sand, a white
  windmill with red trim whose sails turn and block its tunnel, a cup with a
  waving flag, trees, bushes and flowers on the rough, soft shadows, the camera
  above at an angle) (*ميني جولف*):
  - **Solo** (the best total for each course length kept on the phone) and
    **a room with the TV**. No one-phone pass-around, **no computer players**.
  - In a room, **a lobby choice: all at once (the default) or in turns.** All
    at once: every ball on the same hole, each player putting from their own
    phone whenever ready; **the balls pass through each other** (the others'
    balls are faint on a phone); a hole moves on once every ball is in or
    picked up. In turns: one putt at a time round the table, everyone watching.
  - **3, 6, 9 or 18 holes, 6 by default** (the host's choice; solo a setup
    choice). About a minute a hole. (18 added by the owner later the same
    day; the first build had nine. Until the third round below, a game played
    the first holes of the course in order.)
  - **Par + 3 strokes at most** (the owner, later on 23 Sep 2026, replacing
    "6 strokes, then 7"): par 2 allows 5, par 3 six, par 4 seven, par 5
    eight; not in by then, the ball is picked up and the hole counts that most
    + 1. The strip shows «المطلوب 3 · أقصى 6» (the third round's word, below)
    and, before the final stroke, «آخر ضربة!». One place: `golfMaxOf` (a hole
    may carry its own `max`).
  - **Ball hits ball in the room's "in turns" only** (the owner, the same
    day). All at once the balls still pass through each other; solo has one
    ball. In turns a putt meets every ball lying on the course - **a ball is on
    the course once it has been hit from the tee** (Plato's way: the others
    wait off it) and until it drops. Equal balls, a slightly soft knock; a
    knocked ball rolls on with the ground and every piece, **the server
    deciding every ball** and each phone and the TV replaying the same roll.
    **A ball knocked into the cup is holed with its strokes so far** (no stroke
    added).
  - **Water, Plato's rule** (the owner, the same day): the ball goes back to
    where it lay (where it was hit from), a stroke added; **if another ball
    lies on that spot now, back to the tee**. **A ball knocked into the water
    by someone else goes back to its own spot with no stroke added** (the tee
    if that spot is taken).
  - On the holes: **walls, slopes (hills), water, sand (slows), and moving
    pieces** (the windmill, a sliding gate, a turning beam) on a clock every
    phone shares - and **eight new ones** (the owner, the same day, all
    eight asked for): **ice** (the ball barely slows), **mud** (slower than
    sand), **speed pads** (arrows that push), **conveyors** (carry the ball),
    **portals** (in one ring, out of the other at the same speed, a set way),
    **bumpers** (send it back harder than it came), **ramps** (fast enough and
    the ball flies over the water or a low wall; too slow and it rolls back)
    and **one-way gates** (through one way, a rail the other).
  - **Every hole unique** (the owner, the same day: "not all in one - each map
    unique, with some of what fits in it"): each of the nine new holes has its
    own place and only the one to three new pieces that fit it; the nine first
    holes were given better shapes (rounded ends, a chamfered top) and richer
    scenery, and a new piece only where it clearly fits (mud by the
    waterwheel's channel and by the oasis pond); the eighteen are ordered so
    the course gets harder, and the first 3, 6 and 9 make good short games.
  - **Top view at an angle; pull back from the ball like a slingshot and let
    go.** A short arrow while pulling shows the direction and the power - it is
    the control, always there. **The full aim guide (the predicted path) is a
    switch, «مساعدة التصويب», off by default** - the host's lobby option in a
    room, a setup option solo; remembered.
  - **A putt clock, off by default, 20 or 40 seconds**: when it runs out the
    phone putts gently toward the hole for the player. The host has a "putt for"
    button for a quiet phone.
  - On the home in the new **«رياضة / Sports»** section; icon ⛳.
  - Decided here (open to change, each one place in the code): the course's
    eighteen holes, their order and their pars - first 2, bridge 3, mill 3,
    souq 3, humps 3, fair 3, pyramid 3, nile 3, saqia 3, siwa 3, lighthouse 3,
    citadel 3, gate 3, port 3, temple 3, sinai 3, oasis 4, tower 4 (8 for
    three holes, 17 for six, 26 for nine, 55 for eighteen); which pieces go on
    which new hole (Siwa: dunes and mud; the souq: pads; the Nile: a ramp and a
    muddy bank; the funfair: bumpers; the Citadel: one-way gates, one of them
    the wrong door; the port: two conveyors, one running back; the temple: a
    portal between two shrines; Saint Catherine: ice with a zigzag of walls;
    Cairo Tower: a pad up the promenade and a portal as the tower's lift);
    a ramp and a portal are shortcuts - every hole can also be walked; a ball
    "lies on" a spot when it is within a ball's width of it; balls lying on
    each other when a putt starts pass through each other until they part; in turns **the best score on the last hole tees
    off first** (golf's honour; ties keep their order); the card between two
    holes shows for **7 seconds** after the last ball stops, then the next hole
    comes by itself (the host can skip ahead); a player who leaves takes their
    ball and their card with them; the last player alone plays on; the winner
    of a room game (lowest total) counts a win for the evening only when there
    was somebody to beat; a latecomer watches the hole and plays the next game.
  - **The third round** (the owner, later on 23 Sep 2026, every point asked
    first):
    - **The word «بار» goes**: the owner didn't know it. The strip says
      **«المطلوب 3 · أقصى 6»** ("Target 3 · max 6"), and every other place
      uses the same plain words: the scorecard's row «المطلوب», «+1 عن
      المطلوب», a result «زي المطلوب!» ("On target!"). The fun names of a
      score stay (هول إن وان، بيردي، إيجل، ألباتروس، بوجي، دبل بوجي) and are
      explained once in 📘 («🏅 أسامي النتايج»).
    - **Sixty holes: twenty easy, twenty medium, twenty hard.** The first
      eighteen sorted in by how they really play, and 42 new ones, each its
      own place, its own shape (a frying pan, a jigsaw piece, an egg, a
      rocket, a spiral, a pinball table, an island, a stadium, a figure of
      eight, a winding alley…) and only the 0-3 pieces that fit it. Easy:
      short, wide, forgiving, asks for 2 or 3. Medium: asks for 3, one or two
      pieces used cleverly. Hard: asks for 3 to 5, combinations, narrow
      lines, moving pieces to time.
    - **A difficulty choice, and random holes**: solo setup and the room's
      lobby choose **سهل / متوسط / صعب / مكس**; a game of 3, 6, 9 or 18
      draws its holes at random from that kind; **mixed** takes a third of
      each and **plays them easiest first**. **Holes played lately don't come
      back until the kind has gone round**: solo through `freshPick` (per
      phone), rooms through `nextPrompts` (the server's memory across rooms),
      so every phone in a room plays the same list (`shared.holes`, the ids
      in order). The order is never a fixed one.
    - Everything else as it was: the pieces' physics, knocks in turns, the
      water rule, at most what the hole asks for + 3, the putt clock, the
      guide, the TV, solo bests.
    - Decided here (open to change, each one place in the code): **mixed is
      the default** (solo and lobby); **the best total is kept per length and
      kind** (`'mix:6'`, `'hard:9'`…; the bests kept before, per length only
      over the fixed first holes, are no longer shown - they were a different
      course); **Cairo Tower moved to easy and now asks for 3** (its lift makes
      it the easiest of the old eighteen), **the bridge to medium**; which
      old hole is which kind: easy first, souq, humps, pyramid, siwa,
      lighthouse, tower; medium bridge, fair, nile, saqia, citadel, port,
      temple; hard mill, gate, sinai, oasis. The kinds were judged by the
      test's search and by a simulated player of middling skill (a spread on
      aim, strength and timing; about 2.9 strokes a hole on easy, 3.5 on
      medium, 4.8 on hard). A room saved before the holes were drawn plays the
      first holes (`mgCourse`); a solo game saved before gets them too.

- **كدّاب (I Doubt It)** - the owner's spec of 23 Sep 2026, every rule asked
  one at a time, look ب "بلوكات" picked from a design sheet of four games
  (*كدّاب*):
  - **A room and the TV, with computer players easy and hard**; not
    against the phone, not one phone.
  - **The same rank until a call**: whoever leads names any rank and lays
    **any number of cards** face down; everyone after lays cards claiming
    that same rank, or passes.
  - **Anyone can call كدّاب!, the first tap wins** (the order the server
    heard them in); the call is open **until the next player lays cards or
    passes**.
  - The called play turns over: **a lie, the liar takes the whole pile;
    true, the caller takes it; whoever was right leads** the next rank.
  - **Everyone passes after a play: the pile goes out of the game face
    down, and the last to play leads.**
  - The end is **a lobby choice: "first out wins" (the default) or "play
    on for places"** (a podium). **A last play still has to survive a
    call.** Play again keeps a tally of wins (the board).
  - **3-12 players (computer players count), one deck up to 6, two decks
    from 7.** Four of a rank is nothing special.
  - A turn clock **off by default, 30 or 60 seconds** (the phone passes, or
    when leading lays one card truthfully); the host's "play for" a quiet
    phone.
  - Decided here: only someone still holding cards can call (a player out
    in "for places" is out of it - calling wrong would hand them the pile
    back); a follow always claims the rank named, whatever it sends; a
    player who leaves keeps their seat on the server (so "the next seat"
    still means the same), their cards leave the game, their last play can
    no longer be called, and a turn of theirs passes (a lead goes to the
    next seat, a follow counts as a pass, which can put the pile out);
    fewer than two holding cards ends the game, and a first place nobody
    earned at the table (everyone else left) is not counted as a win; the
    clock's truthful card is one of the rank the hand holds most.

- **الشايب (Old Maid)** - the owner's spec of 23 Sep 2026, every rule asked
  one at a time, look ب "بلوكات" (*الشايب*):
  - **A room and the TV only; 2-8 players; no computer players, not against
    the phone.**
  - **A drawn الشايب card is added**; a pair is **the same rank and the same
    colour** (7♥ + 7♦, K♠ + K♣).
  - **The deck grows with the table: about 8 pairs a player, at most the 26
    pairs of a whole deck** (52 cards) and الشايب; the pairs of a dealt hand
    go out at the start, with their motion.
  - A turn: **draw one card blind from the next player still holding
    cards**; a pair it makes goes out; **an empty hand is safe** (the order
    they got out is shown); **the last one holding cards holds الشايب and
    loses.**
  - **Hand order, a lobby switch: "rearrange by dragging" (on by default)
    or "auto-shuffle".** The draw as a board game: the drawer taps a back
    to **lift** it - every phone and the TV see which one is up - and taps
    it again (or "take this card") to draw it; meanwhile the one being
    drawn from may **drag their cards about**, and the lifted card moves
    with its card (the aim is kept by card id and shown as a position); the
    drawer sees the backs move. With auto-shuffle the server shuffles every
    hand after each turn and nobody drags.
  - **One loser a game, and a tally across play again** (the board: fewest
    times الشايب first).
  - A turn clock **off by default, 15 or 30 seconds** (a random card is
    drawn - the lifted one if there is one); the host's "draw for" a quiet
    phone.
  - **Leaving: that player's cards go into the next hand still playing**
    (and its pairs go out); **fewer than two left ends the game** with no
    loser; if two or more are still in the room but only one holds cards,
    that one holds الشايب and loses as usual.
  - **The end:** الشايب turns over in the loser's hand, the order the others
    got out on a podium, and the tally.
  - Decided here: the one drawn from draws next (the turn goes round the
    table); **a drawn card goes into the drawer's hand at a random place
    under a fresh id**, so the player who gave it up (who knows what it
    was) can never follow it across the other hand - their phone sees only
    positions, and never an id of another hand; a drag is published as a
    move of a position (from, to), which is exactly what a table sees of a
    hand being rearranged; the pairs chosen for a smaller table are drawn
    at random from the 26 (a rank and a colour each); **the draw from a
    hand of one card stays a tap** - there is only one card to take, but
    the draw is the game itself (the owner's "the tap is the game" rule,
    like أونو! and العقل), so it is not made automatic; hands are laid out
    left to right in both languages, the drawer's row of backs in the same
    order the other player holds them.

- **حرب السفن (Battleship)** - the owner's spec of 23 Sep 2026, every rule
  asked one at a time (*حرب السفن*):
  - **A room: two duel, winner stays on** (the duels' line; the rest watch on
    their phones or the TV) **and against the phone** (a computer admiral,
    **easy / medium / hard**). **No computer players in rooms.**
  - **Classic 10×10, 5 ships**: حاملة طائرات 5، بارجة 4، طرّاد 3، غواصة 3،
    مدمّرة 2.
  - **A hit shoots again**; a miss passes the turn.
  - **Placing: drag a ship, tap it to turn it, or 🎲 for a random fleet;
    ships may not touch, not even at a corner.** Both place, then each taps
    ready; the first to fire is random in the first game, the challenger
    after that (the duels' seats).
  - **A ship sunk: the shooter learns which ship, it is shown whole on their
    target grid, and the water round it is marked** (nothing can be there).
  - **A turn clock, off by default, 15 or 30 seconds**: the phone fires at a
    random square the player hasn't fired at; the host has "play for" for a
    quiet phone.
  - **The look: a 3D sea "like the bowling and golf"** - crafted low-poly
    ships, moving water, a shell arcing over, a splash on a miss, fire and
    smoke on a hit, a ship listing and settling when it sinks, seen from
    above at an angle; the grid tappable and its squares named (A-J, 1-10);
    on your turn the enemy sea is big, and the camera glides between the
    seas. A clean flat board where WebGL can't draw.
  - **Home: the duels' section** (`group: 'duo'`, beside كونكت ٤), modes
    `['device', 'room', 'tv']` (device = against the phone).
  - **Hidden information on the server only**: each fleet in `room._bs`,
    each seated phone its own in `room.secrets[pid]`; shots and results
    public; a ship's cells public only once it sinks; both fleets shown at
    the end.
  - Decided here (open to change, each in one place):
    - **Firing is two taps**: the first aims (a crosshair, the square's name
      in the status line and on a big "🔥 اضرب B7" button), the second - or
      the button - fires. On a 375px phone a square is ~30px, and a mis-tap
      costs a shot.
    - **With the turn clock on, placing has a clock too: 90 seconds**
      (`BS_PLACE_SECS`), after which whoever isn't ready sails with the fleet
      on their board (the server deals everyone a random one to start from).
      With the clock off, the host's "play for" does the same.
    - **Ready can be taken back** ("✏️ غيّر أماكن السفن") while the other
      hasn't finished.
    - **A hit doesn't say which ship; a sinking does** (the classic rule).
    - **Against the phone, who fires first is drawn at random each game**,
      your last fleet is on the board again for the next game, and the score
      runs game after game (a tally of wins, like the duels).
    - The squares are named with Latin letters and western digits in both
      languages (a physical board, `dir="ltr"`, like the duels').
    - Watchers' phones and the TV follow the sea being fired at (the TV shows
      both seas side by side all the time); at the end each seated phone
      looks at the other's fleet, now revealed.
    - The phone's hard fleet is the least findable of twelve random ones (the
      least where a density search looks first, never most ships on an edge).

- **بولينج (Bowling)** - the owner's spec of 23 Sep 2026, asked one at a time;
  look أ «صالة» from the lead's 3D prototype (*بولينج*):
  - **Solo (best score kept on the phone) and a room with the TV.** No
    one-phone pass-around, **no computer players**.
  - **5 or 10 frames, 5 by default**; real ten-pin scoring (strikes and spares
    carry; the last frame's bonus balls).
  - **Swing the ball** (the owner, 23 Sep 2026, after playing the first
    build: "move it from back to front like in Plato and in real life - it
    affects the speed too, like I'm swinging it"): the ball follows the
    finger on the approach; **pull it back, then swing it forward and let
    go**. The forward swing's speed is the ball's speed and **a longer
    backswing adds to it** (a swing with none gives three quarters); its line
    aims, **a curve in it hooks**; where the ball is when it is let go is
    where it is released. (The first build only read an upward swipe.)
  - **The line holds still** (the owner, 23 Sep 2026, the same evening:
    "the shot assist is not working correctly ... the line is moved when I
    swing"; asked, they confirmed the line jumped and wobbled while swinging):
    **the backswing sets the line, like a pendulum** - pull back straight and
    the ball rolls straight, on a slant and it rolls on that slant - and on
    the way forward the ball swings along that line whatever the thumb does,
    so the aim guide starts at the ball in the hand and doesn't move; the
    thumb's sideways wander in the forward swing is the hook (the guide's far
    end bends as it forms). A throw with no backswing (a flick from the line)
    goes the way the flick went. Sliding the ball across first, to line up,
    is not part of the backswing.
  - **Pins that fall the way real ones do** (the owner, the same evening:
    "the accurate of what is falling based on what was hit, more real"): the
    pin physics were tuned against the shape of the USBC pin-carry study - a
    hook into the pocket at 5-6 degrees strikes about four times in five, a
    straight ball into the same pocket about one in three, a ball full on the
    head pin mostly splits (4-6, 7-10, 4-7-10), a light pocket hit leaves the
    5 or the 5-7, a high one the 6-10, a soft hit on the 3 the 2-4-5 bucket,
    and any touch of the ball takes a lone pin. A full hook now reaches the
    pins at 5-6 degrees (it was about 2.5, too little to carry), and the ball
    loses about 1 m/s down the lane, as a real one does.
  - **Seen from behind the ball, in perspective** (three.js, real 3D).
  - In a room **everyone bowls in turn and everyone watches every throw**, on
    their phones and the TV. **No bumpers.**
  - **The aim guide («مساعدة التصويب») is a switch, off by default**: a line
    showing where the ball will go while you swipe; no arrow otherwise. Solo a
    setup option, in a room the host's lobby option; remembered on the phone.
  - A turn clock **off by default, 20 or 40 seconds**: when it runs out the
    phone throws a gentle straight ball for the player; the host has a "play
    for" button for a quiet phone. **No daily.**
  - The home's **رياضة / Sports** section, 🎳, violet.
  - **No words in the hall** (the owner, 23 Sep 2026: "no «صالة عشري»"): the
    masking unit is a panel with a neon line, pinstripes and three glowing
    pins; the overhead screens are dots, the main lane's showing the pins
    really standing. No name or brand text anywhere in the scene.
  - Decided here: one person can open a room game of it (bowl alone with the
    TV); the order is the room's, whoever joins later watches (`lateJoin`)
    and bowls the next game; two level on top both win; a player who leaves
    takes their card off the board and the turn passes on; nobody left to
    bowl ends the game; the board (and the TV's score strip) stays empty
    until the game is over, or the strip would give a ball away before its
    pins fall on screen - so a game abandoned mid-way banks nothing on the
    night's table.

- **خمّن مين (Guess Who)** - the owner's spec of 22 Sep 2026, every rule
  asked one at a time, look ب "ألبوم" picked from a sheet of three
  (*خمّن مين*):
  - **A room only: two duel, the rest watch on their phones or the TV, the
    winner stays on** (the duels' line). Not against the phone, not one phone.
  - **Drawn faces** (hair, glasses, a cap, a beard, a moustache, earrings,
    eye colour) with Egyptian first names, a new mix each game; never photos.
  - **16, 24 or 30 faces**, a lobby choice, 24 by default.
  - A turn is **one question or one guess**, never both.
  - A question is **picked from the list**, **typed**, or **asked out loud**,
    and **the other player answers it**, yes or no, on their phone - a list
    question too (the owner, 23 Sep 2026, changing the first build, where
    the server answered a list question itself: "it's like playing vs the
    computer"). The list question shows big beside the answerer's own secret
    face, and **a wrong tap is refused** - the phone says «بص تاني على وشك»
    and sends nothing, and the server checks it the same way - so a slip
    never spoils a game. A typed or out-loud answer is taken as given.
  - **Faces are put down by hand, by default** (the owner, 23 Sep 2026: "like
    the board"); the lobby switch that lets a list question's ruled-out faces
    fall by themselves stays, **off by default**. A typed or out-loud
    question is always flipped by hand: the phone can't judge it.
  - **The table's moments** (the owner's picks, 23 Sep 2026): while the other
    decides, the asker sees «💭 الإجابة عند …» with three breathing dots; the
    answer lands as **a big أيوه / لأ bubble with a sound** on both phones, the
    watchers' and the TV; **a guess is a drum roll over «منى: هو مجدي؟»**, then
    صح or لأ, and the secret faces turn only after it. (Quick reactions were
    offered and not chosen.)
  - **A wrong guess loses the game**, a switch; the other way it loses the
    turn and that face goes down.
  - **The secret face is dealt at random**, a switch; the other way each
    picks their own.
  - A turn clock **off by default, 30 or 60 seconds**; it passes the turn.
  - **Computer players, easy and hard.**
  - Decided here: a computer player can't hear or read, so against one there
    is no out-loud or typed question; it asks from the list and answers a
    list question put to it (after a second's thought), hard taking the question that
    comes closest to halving what it has left; the watchers and the TV see
    both boards (how many faces each has put down is public, as on a real
    table) but a secret face only once the game is over; any face can be put
    down or back up by hand at any time; a seated player who leaves loses by
    forfeit, as in the duels; a board never holds two faces the list can't
    tell apart. **With the turn clock on, picking your own face has a clock
    of its own, 60 seconds** (`GW_PICK_SECS`, the audit of 23 Sep 2026: it had
    none, so one player could hold the game), and whoever hasn't picked is
    dealt a face; a turn skipped while the other was to answer says so
    («… ما ردّش»), not that the asker didn't ask.

- **المشنقة (Hangman)** - the owner's spec of 22 Sep 2026, asked one at a
  time, look ج "نضيف" picked from a sheet of three (*المشنقة*):
  - **Two on one phone** and **rooms**; not solo against the phone. **No
    computer players.**
  - A letter in the word **shows every place it stands**; one that isn't
    draws **a piece of the man** - the owner restated this rule themselves.
    **Six misses, the classic stick man** (chosen over friendlier pictures).
  - **The whole word may be guessed; wrong, it costs a piece.**
  - **In Arabic one key a letter**: ا opens أ إ آ, ه opens ة, ي opens ى; the
    word is always shown as it is spelt. Decided here: ء ؤ ئ ٱ go with ا, و
    and ي the same way. **Both ways** (the owner, 23 Sep 2026): أ finds ا as
    ا finds أ, in a letter and in a whole word (`hmFold` on both sides).
  - **What is guessed** (the owner, 23 Sep 2026): **one word, or a famous
    name or a film of up to three words - never a sentence**; four words
    are refused. It stays **exactly as it was typed**, **a box a letter**
    (five letters, five boxes) and a gap between words; only the marks that
    aren't letters (diacritics, the tatweel) are dropped. A whole name typed
    without its spaces still counts.
  - **A hint is optional** (the owner, 23 Sep 2026, changing "the word only"
    of the day before): a second field under the word, «تلميح (اختياري)»;
    filled in, the guessers see it as a pill above the boxes (and the TV
    under the title), left empty, nothing. Decided here: at most 30
    characters, and a hint that spells the word out is refused. On one phone
    and in a room alike.
  - **The race deals names and films too** (the owner, 23 Sep 2026): every
    Chameleon entry of up to three words (the actors, footballers, singers,
    historical figures) with its category, and the films of the emoji
    riddles as "a film 🎬" - not their proverbs.
  - Rooms play two ways, a lobby choice, **"one writes, the rest guess" by
    default**: the writer types the word (a word or a name, as above) and,
    if they like, a hint and every other
    phone guesses it **on its own board**; the writer moves round the table.
    Or **a race**: the app deals one word to everyone, **a single word from
    the app's lists with its category as the hint**.
  - Scoring: a solve is **10 plus a bonus by order** (+5, +4 ... +1), **in
    both ways** (the owner, 24 Sep 2026: "each place should get different,
    the first the highest"; until then a writer's word gave every solver a
    flat 10); with a writer, **the writer also scores 5 for every guesser who
    didn't**.
  - **3, 5 or 10 words** a game, the host's choice; a word clock **off by
    default, 60 or 90 seconds**, and when it runs out whoever hasn't solved it
    has failed.
  - Two on one phone: **take turns and a running tally** - one types with the
    letters hidden while the other looks away, the other guesses, then they
    swap, as many words as they like.
  - Decided here: a written word is 3 to 20 letters in one alphabet, no word
    over 12; the race deals a single word of 4 to 9 letters, or a name of up
    to 16 letters whose words are two letters or more; the TV
    shows each player's man and how many letters they have found, never the
    letters; a writer who leaves before writing hands the word to the next;
    fewer than two left ends the game.

- **بنك الحظ** - the owner's spec of 21 Sep 2026, every rule asked one at a
  time and then checked against another AI's rulebook; look أ "كلاسيك" and
  the places, prices and card texts approved from a design sheet (*بنك الحظ*):
  - the classic 40-square board and rules with **Egyptian cities and resorts**
    (22 places in 8 colours, cheapest to dearest: الفيوم، بني سويف · المنيا،
    أسيوط، سوهاج · الزقازيق، المنصورة، طنطا · السويس، الإسماعيلية، بورسعيد ·
    قنا، الأقصر، أسوان · مرسى مطروح، العلمين، الإسكندرية · دهب، الغردقة،
    شرم الشيخ · الجيزة، القاهرة), 4 stations (محطة رمسيس، محطة سيدي جابر،
    ميناء دمياط، مطار القاهرة), 2 companies (الكهرباء، المياه), money in
    جنيه: **1,500** to start, 200 for passing Start;
  - **room + TV and against the phone**; **2-6 players**; pieces picked in the
    lobby, a roll-off to start, 7+ in the room the host picks who plays;
  - length a lobby choice, **default 45 minutes** (or until one is left, 30,
    60); time up: **finish the lap**, then cash + place prices (half if
    mortgaged) + building cost, highest wins;
  - a place not bought **stays with the bank** (no auction); **trading on your
    own turn**, an offer the other accepts or refuses;
  - buildings are the Egyptian box's **جراج ← استراحة ← سوق**, on a whole
    colour, built evenly, no limit, with a **steeper rent table** (a full set
    doubles the rent; the three steps are classic Monopoly's 1 house, 3 houses
    and hotel rents; building costs 1x, 2x, 2x the group's price per step);
  - mortgage and selling back **classic**; jail **classic** (50, a card or
    doubles, rent collected inside, three doubles to jail); bankruptcy
    **classic** (to the player owed, or back to the bank);
  - the free-parking corner is **الأتوبيس السريع** (move again by the same
    number); the decks are **حظ** (moves, surprises) and **محاكمة** (money),
    16 each, family wording;
  - two lobby switches **off by default**: the free-parking pot and landing
    exactly on Start pays 400;
  - **buying starts after the first lap** (the owner, 22 Sep 2026, the day
    after the build): a lobby switch, **on by default**. Until a player has
    passed Start (or landed on it) a free place they land on stays with the
    bank, and **a trade can't give them a place** (money and jail cards
    still can); rent is paid as usual. A card that takes them to or past
    Start counts, jail doesn't, and the rest of the move that passes Start
    may already buy. Decided here: a bankruptcy still hands its places to
    the creditor either way (it isn't buying or trading), and a game saved
    before the switch existed plays on as it was;
  - **high rents from the start** (the owner, 22 Sep 2026, after noticing
    that بني سويف rents for 4: the classic numbers had been copied square for
    square from the international board, and the Egyptian box they remember
    runs about 15 to 50): a lobby switch, **off by default - the classic
    numbers stay the default**. On, a place with no buildings rents for 15
    on the cheapest up to 50 on القاهرة, by its price (`round(15 + (price -
    60) × 35 / 340)`), doubled for a whole colour (30 to 100); a جراج pays at
    least the whole colour's rent + 10, so every building still pays more
    than the step before; the استراحة and سوق rents are unchanged;
  - **one die** (the owner, 22 Sep 2026, the same day; a lobby switch,
    **off** - two dice by default): you move by one die and **a 6 is what a
    double is with two** - another roll, three 6s in a row to jail, and in
    jail a 6 gets you out and moves you 6 **with no roll after** (the
    owner's answer, like a double out of jail); after the third miss you
    pay 50 and move by that roll, as with two. **A company rents for the
    die x 8, or x 20 with both** (the owner's pick: the same money on
    average as two dice), and the "nearest company" card is the die x 20.
    Decided here: the roll-off rolls the same one die. Put to the owner
    first and kept on only as a switch: one die halves how far a lap goes,
    so a 45-minute game passes Start about half as often, and with buying
    after the first lap nobody can buy for about eleven turns each;
  - computer players **easy and hard**, answering trade offers but never
    making them; a turn clock off by default, 60 or 90 seconds.
  - **Clarified by the owner before the build** (another AI's notes, checked
    and corrected): "the nearest station" is the next one ahead (passing
    Start pays), the rent twice what the owner would charge; "the nearest
    company" the next one ahead, then a roll and 10 times it; upkeep and
    street repairs are per place (25 or 40 for a جراج or an استراحة, 100 or
    115 for a سوق); عزومة pays every other player still in the game 50, and
    عيد ميلادك has each of them pay 10; a get-out-of-jail card is a list,
    not a flag (two can be held, each goes back to its own deck, it can be
    traded); each deck is shuffled once and drawn from the top, a drawn card
    going to the bottom; a bankruptcy while paying everyone (عزومة) goes to
    the bank.
  - Decided for the owner: someone who can't pay the birthday 10 has the
    money raised for them (buildings sold back, then mortgages, as a
    computer player would), and goes bankrupt to the birthday player only if
    nothing covers it; the roll-off rolls the two dice for everyone, on the
    server; a bankruptcy's buildings are sold to the bank at half and the
    creditor takes the cash; the game's time counts continuously in a room
    and only while the screen is open against the phone; a player who leaves
    is out, their places back to the bank.
  - Tested but worth knowing: "until one is left" needs bankruptcies, and
    computer players never make offers, so a table of computer players can
    circle for ever. That way of playing is for people; the time limit is the
    default for this reason.

- **لودو (Ludo)** - the owner's spec of 21 Sep 2026, every rule asked one at
  a time, look أ "كلاسيك" picked from a sheet of three (*لودو*):
  - **Against the phone** (you and 1-3 computer players, easy or hard, your
    colour picked) and **a room with the TV**. Not one phone passed round.
  - **2-4 players, each for themselves**, four pieces each, no quick mode.
  - A piece leaves its yard on **a 6 only**; **a 6 rolls again**, nothing else
    does; **a third 6 in a row loses the turn**.
  - **Safe squares: the four starts and the four stars.** Landing on a single
    piece of another colour anywhere else sends it back to its yard.
  - **Two pieces of one player on a square are a wall** nobody else can pass
    or land on. **Home needs the exact number.** No "must capture first".
  - **The game plays on for places**, and ends on a podium.
  - **You tap to roll**; a move with one outcome is made for you after a beat,
    nothing to move passes by itself, and the move that brings your last
    piece home stays your own tap (the standing rules).
  - In a room: **everyone picks a colour in the lobby**, anyone who doesn't
    gets one; the starter is a **roll-off** (highest, ties roll again); with
    **five or more the host picks who plays** (the first four by default) and
    the rest watch; computer players **easy and hard**; a turn clock **off by
    default, 15 or 30 seconds** (the phone rolls and moves when it runs out).
  - Decided for the owner: the roll-off is rolled by the server for everyone
    (nobody has a choice in it, so it isn't a tap); with two players and no
    colours picked they sit opposite (red and yellow); a wall on a start
    square also keeps that colour's pieces in their yard; a player who leaves
    takes their pieces off the board, and one left ends the game in their
    favour; the host's "play for" button works as the clock would.

- **سكرو (Skrew)** - the owner's spec of 17 Sep 2026 (*سكرو in rooms*, and
  *سكرو on the table* for the calculator): the Skrew card game (Kraken
  Studios) played on the phones, with every version and any mix of them - "this
  is the core main thing" - and the old score card kept for a game with real
  cards.
  - **Everyone sees every hand face down, in order, and every move**: who
    looked at which slot, who swapped which of their slots with which of whose,
    who gave a card to whom. Values stay hidden unless the rules show them.
  - **The deck as the owner counted it** (`SkrewCards.js`): 1-6 four each, 7
    and 8 (look at your own) four each, 9 and 10 (look at someone's) four each,
    خد وهات 4, بصرة 2, كعب داير 2 (one card of every player, or two of yours),
    +20 four, the red screw (+25) two, the green screw (0) two, −1 one; one of
    each version card. That is 57 base cards (the owner's "66-card" table
    adds up to 62 with four بصرة and the thief's three cards, which is what
    the app deals; the owner closed the question on 23 Sep 2026, as built).
  - **Versions**: Classic (the base deck); الحرامي (the thief, خد بس, شوف
    وبدّل); صاحب صاحبه (teams, بينج, بونج, على كيفك - a mimic of a command
    card on the pile, below); المسحراتي (المسحراتي, المدفع, الخشاف);
    أوسكار (صرخة أوسكار); العام (all of them); or any mix (`custom`).
  - **Throwing a matching card is only on your own turn** (owner). Command
    cards left in a hand count 10 (owner); 7-10 count their face.
  - **Singles or teams in any version** (owner, 17 Sep 2026): two sides
    alternating round the table, 2 against 2, 3 against 3 or 4 against 4; 7-12
    players play with two decks ("Skrew Double").
  - **Later the same day the owner added** (with two rulebooks written by
    other AIs, checked against the Skrew store's own card descriptions, which
    won where they disagreed: المسحراتي is a forced سكرو, المدفع shows a hand
    until the round ends, خد بس gives a card):
    - the deck running out: the top card of the pile stays, the rest is
      shuffled into a new deck; **sudden death** (موت مفاجئ) is an option, off by
      default: the last card drawn gives everyone one last turn, then the reveal;
    - **a hand emptied ends the round at once**; that player scores 0, beating
      even a negative total, and a caller who isn't them is doubled;
    - **a caller who ties the lowest wins** (0), and the tied player keeps their
      own total; **doubling applies to any sign** (−1 → −2);
    - **the thief is a table vote** before the reveal: caught, +25; unnoticed,
      the thief takes the lowest score and whoever had it takes the +25;
    - أوسكار also has **بوم** (an opponent's card straight onto the pile) and
      **اللايف جاكيت** (counts as the lowest other card in its hand);
    - **بصرة is 4 or 2**, a lobby option, 4 by default (the standard deck in
      the owner's card table; 2 in the first print);
    - the rules in 📘 carry every case, folded into sections (`.help-more`).
  - **The owner's answers** (17 Sep 2026, asked one by one): throwing a
    matching card is the whole turn, one card per throw, and a failed throw
    goes back face down with a blind penalty card in a new slot; a game is a
    fixed number of rounds; in teams only the caller's own hand is doubled,
    then added to the partners'; a hand emptied by someone else's card (بوم)
    still finishes and wins; المسحراتي after a سكرو reveals at once and the
    first caller stays the caller; memorising at the start is a lobby option
    (until everyone taps, 5 or 10 seconds); a life jacket alone counts 10; a
    tie in the thief vote goes the caller's way when the caller voted for one
    of the tied, otherwise nobody is accused; everyone tied on the lowest
    score takes the +25; the الخشاف pick counts as drawn from the deck, so an
    action card thrown straight away uses its power; after سكرو in teams the
    caller's whole team is protected; memory is the game - moves show as they
    happen and fade, and a "memory helper" option (off by default) keeps each
    card's story.
  - **بوم and صرخة أوسكار, as the owner described them later** (replacing the
    first reading): بوم makes every other player (not whoever played it, not
    the protected side) pick one of their own cards, and it goes onto the pile
    face up whatever it is, the red screw and the thief included; صرخة أوسكار
    gathers every unprotected hand, shuffles, and deals back the same count to
    each player, face down and unknown to all. After either, whoever played it
    takes a whole new turn.
  - Decided for the owner: the vote happens at the end of every round the
    thief card is in the deck, however the round ended; two decks keep one
    thief.
  - **No card carries a warning** (owner, 17 Sep 2026, night: "each card is
    treated the same"): a +20 or the red screw drawn from the deck is kept or
    thrown like any other card - kept, it can be thrown on a match later.
    The forced throw (and its ⚠️) is gone from the server and the phone. The
    thief and بونج still go into the hand and بينج and المسحراتي still play
    themselves - those are their versions' rules, said plainly, not alerts.
  - **The cards, checked one by one** (owner, 21 Sep 2026, after asking what the
    screws and +20 look like). Every face had been the middle blue since the
    card design of 17 Sep - `.skr-card`'s own default `--c` outranked the
    colour group on the same element; the default is `:where(.skr-card)` now,
    so every card shows its group. With the colours showing, المسحراتي's three
    became a Ramadan-night navy with a gold icon and صاحب صاحبه's an olive-lime
    (they had been a purple beside 7-10's violet and a cyan beside 1-3's teal).
    **+20 and −1 have no name band**: the numeral is the name (the band said
    عقاب and سالب واحد). **9 and 10 are شوف كارت حد** (شوف كارت غيرك was cut
    off on the card), a pair with شوف كارتك on 7 and 8. The corner 6 and 9 are
    underlined (the bottom corner is upside down), a 10 beside its corner icon
    is a size down, the upside-down corner sits above the name band, and بوم's
    bomb and بينج's paddle were redrawn: they read as ♂ and a magnifying glass.
  - **The two screws are one kind when throwing** (owner, 21 Sep 2026): a red
    screw goes on a green one, a green on a red, and either on its own colour
    (`SKREW_SCREWS` in `skrewMatches`). Before, only red on green (and red on
    red) was allowed, and the Help said red "only on green".
  - **The three kinds of card** (owner, 20 Sep 2026, laid out as groups and
    then confirmed one by one):
    - **Fires the moment it is drawn, and cannot be kept or skipped**: بوم and
      صرخة أوسكار ("the power of them must be activated when they are drawn in
      the ground - this is not an option"), and بينج and المسحراتي by their own
      versions' rules. They are `drawn: 'play'` in `SkrewCards.js`, so the
      server resolves them in `screwReceive` before a drawn card screen exists,
      and `skipPower` is refused for any of their powers
      (`SKREW_FORCED_POWERS`).
    - **Drawn, you choose**: throw it to use its power, or swap it into your
      hand and carry its value. 7, 8, 9, 10, خد وهات, شوف وبدّل, خد بس, كعب
      داير, الخشاف, **بصرة and المدفع** (the owner confirmed both belong here,
      20 Sep 2026).
    - **Held**: اللايف جاكيت, الحرامي, بونج, −1, the green screw, +20.
  - **على كيفك is a mimic** (owner, 20 Sep 2026: "you must point to a command
    card currently lying face-up in the discard history stack and declare: I am
    copying this card's power"). Not a free choice from a list: the choices are
    the command cards on the pile (`skrewPileCommands`), and it runs that
    card's own text. A card that plays itself is `kind: 'special'`, so it is
    never on the list, and على كيفك cannot copy itself. **With no command on
    the pile** - turn one, or a pile of nothing but numbers - the card is not
    dead: it goes down as a plain بصرة, because the deck's history has not
    unlocked anything else. Both sides read the same window the phones are
    shown (`SKREW_PILE_SHOWN`): you point at a card the table can see, not one
    buried under it.
  - **اللايف جاكيت equals the lowest card in your hand** (owner, 20 Sep 2026:
    "its automatic equal the lowest card i have in my hand"), automatically and
    with no choice; alone in a hand it counts 10. That is what
    `skrewHandValues` already did.
  - **المسحراتي stays a forced سكرو** (owner, 20 Sep 2026, asked directly):
    drawn, it plays itself and reveals the round with the drawer as caller.
    A later description of it as "flip every hand face-up for three seconds"
    was put to the owner beside the built rule, and they kept the built one -
    the 17 Sep reading from the Skrew store's own card text. Do not change it.
  - **Command cards count their face where they have one** (owner, 20 Sep
    2026, asked directly): a 7 counts 7 and an 8 counts 8, not 10. A later
    "fixed +10 for all of them" was put to the owner and they kept the face
    values.

- **إكس أو, 3 marks only** - the owner, 22 Sep 2026 ("good players always
  draw"), every rule asked first (`JS_XO.html`):
  - a **switch on the X-O setup, off by default** (remembered on the phone);
    against a friend and against the phone, easy and hard;
  - each side keeps **three marks**; a fourth takes the place of that side's
    oldest (`x.order`, oldest first), which **fades out** as the new one lands;
  - the oldest is **shown faded on its owner's turn only** (the owner, the
    same day: "in my turn the one that will disappear will be faded, but not
    in his turn, to make it use memory too"), and **the new mark can't go on
    its square** - it is still on the board while you choose;
  - **no draws and no move limit**: six marks never fill nine squares, so play
    goes on until someone makes three in a row.
  - Built here: a round keeps the rule it was dealt with (`x.rule3`), so the
    switch changes the next round, never this one; the phone searches a few
    moves deep with alpha-beta in 180ms at most (`xo3BestMove`), judging a
    position by the lines each side could still finish without the mark it is
    about to lose; easy looks two moves ahead and plays at random a third of
    the time. Simulated: hard beat random play 24 of 24 and easy 16 of 16,
    every move legal, the slowest 52ms.

- **كونكت ٤ and نقط ومربعات (the duels)** - the owner's decisions of
  21 Sep 2026, asked one by one, built the same day (*The duels*):
  - **Three ways each**: two on one phone; one against the phone at سهل /
    متوسط / صعب; a room on separate phones with the TV
    (`modes: ['device', 'room', 'tv']`). Both sit in لاتنين على موبايل
    (`group: 'duo'`) beside إكس أو and the memory game.
  - **On one phone**: a running tally across games, and **the first move
    alternates** - whoever went second starts the next game. **No take-backs
    at all** (the owner: "never").
  - **In a room only two play at once: winner stays on.** The loser goes to
    the back of the line, the next in line sits down against the winner, and
    **the challenger moves first**. With exactly two in the room they simply
    keep playing, the first move alternating.
  - **Connect 4**: 4 in a row on the classic 7 x 6, or 5 in a row on Hasbro's
    9 x 6 (an option). A full board with no line is a draw.
  - **Dots & Boxes** (the Plato game): two players only, 4x4, 6x6 or 8x8
    boxes; the fourth side takes the box and moves again; most boxes wins,
    and a draw is possible.
  - **The look**, option أ of a design sheet for both: Connect 4 "كلاسيك
    أزرق" (a blue board, holes showing the page ground, red and yellow discs
    with an inner ring, the winning line ringed white, a faint ghost disc over
    the column about to be played, the players as pills with their disc and
    score); Dots "نضيف (زي Plato)" (a clean card, slate dots, 6px round-ended
    lines in blue and rose, faint guides, a box tinted with its owner's
    colour and their initial, the last line glowing briefly).
  - **Decided for the owner** (the suggestions they gave, taken): a draw
    keeps the champion in the seat and sends the challenger to the back; a
    seated player who leaves mid-game loses by forfeit (a win for the other,
    counted) and the next in line sits down. Also decided here: anyone in the
    room can deal the next game (whoever is left at the table must be able
    to carry on), the first game's seats and first move are drawn at random,
    the first game's second seat counts as the champion for a draw, and a
    streak (🔥 wins in a row) is shown from two.

- **مافيا (Mafia / Werewolf)** - the owner's spec of 16 Sep 2026, built the
  same day (*مافيا in rooms*): the app is the narrator (night choices made silently on each phone,
  the server resolves them), the voting engine for the day, the TV for night
  and day, family wording ("خرج من اللعبة", no killing words).
  - **Two modes.** *Classic*: Mafia and Citizens only. *Roles*: adds the
    Doctor, the Detective and the **Lawyer** (محامي).
  - **The Lawyer** defends the Mafia by misleading the citizens as if they
    were one of them. The Lawyer knows who the Mafia are; the Mafia don't know
    who the Lawyer is.
  - **The app picks how many Mafia** from the number of players, so it is
    fair. At least 5 players.
  - **Revealing roles is an option, off by default**: anyone who leaves the
    game is shown as a Citizen, except a Mafia member, who is always shown as
    Mafia. With the option on, the real role is shown.
  - **There is time to talk**: a discussion clock before every vote, for
    arguing and accusing.

- **أونو (Uno)** - the owner's spec of 21 Sep 2026, asked one rule at a time
  (*أونو in rooms*, *أونو on the phones and the TV*):
  - **The deck** is the standard 108 (each colour one 0 and two of every 1-9,
    Skip, Reverse and +2; four wilds and four wild +4s), 7 cards each; up to
    ten players one deck, eleven and twelve two decks shuffled together. The
    card turned up: a wild +4 goes back and another is turned; a wild lets the
    first player pick the colour; an action card acts on the first player. The
    draw pile running out: the pile but its top card is shuffled into a new one.
  - **Playing**: the colour, the number or the symbol, or a wild; **a +4 any
    time, no challenge**.
  - **Drawing, the official rule in the owner's words**: can't (or won't) play,
    draw one; if it fits you may play it at once or keep it and the turn ends;
    after drawing no other card from the hand. **"Draw until you can play"** is
    a lobby switch, off.
  - **Stacking** is a switch, **on by default** (the owner's table plays it),
    with a choice shown only then: **"+2 on +2, +4 on +4 only"** (default) or
    **"also +4 on a +2"** (a +2 never answers a +4). Facing a draw you stack it
    on or take the whole pile and lose the turn; without stacking the next
    player just draws and is skipped.
  - **7-0** (7 swaps your hand with a player you pick, 0 passes every hand on
    one seat) and **jump in** (the very same card as the top one, never a wild,
    out of turn; play carries on from you) are switches, off.
  - **Skip** skips; **Reverse** turns the direction (a Skip with two players).
  - **UNO: "press it, or get caught"**: the button shows with two cards (before
    or with the second to last) or one; down to one card without it, anyone else
    can press **امسكه!** until the next move, and caught means two cards.
    Computer players always say it, but an easy one sometimes forgets; a hard
    one catches whoever forgets, after a human moment.
  - **Game length**: **one round, first out wins** (the default) or **3 / 5 / 7
    rounds with points** (the winner scores the cards left in the other hands:
    face value, Skip/Reverse/+2 20, wilds 50; most points wins). "First to 500"
    was put to the owner and rejected. **One round has no points at all**
    (the owner's "No points", checked 21 Sep 2026 when the first build showed
    "+135"): the result says who won, the hands turn over for the table to see,
    and the board is the wins, counted across play again.
  - **A turn clock** (off, 30 or 60 seconds): when it runs out the phone plays
    for the player - takes a waiting draw, or draws one and passes - and the
    host has a skip for a phone that went quiet.
  - **Cards you can play are always lit** (no switch); one that can't is refused.
  - **Every lobby choice is remembered** on the host's phone.
  - **Computer players**: easy plays the first card that fits; hard plays to
    win (keeps wilds, names its strongest colour, hits a player close to going
    out, stacks, sheds big cards when anyone is close, says UNO, catches) - both
    only from their own hand and what the table sees.
  - **The look** the owner picked, option أ "بلوكات" from a design sheet, the
    family of سكرو's cards (*أونو on the phones and the TV*), and **motion on
    every move that can have one**.
  - **The play area first** (21 Sep 2026, for every screen): while a round is
    played the pile and your hand get most of the screen, the seats, names and
    counts are a compact strip (a ring on the TV); the results may take over
    once the round is done.
- **الدومينو (Domino)** - the owner's spec of 21 Sep 2026, asked one rule at
  a time, built the same day (*الدومينو in rooms*, *الدومينو on the phones and
  the TV*); the score keeper for real tiles is the setup screen's other side
  ("على الطاولة", `JS_Domino.html`, untouched).
  - **2 to 4 players**, people and/or computer players. **Solo or teams**;
    teams with four only, **partners opposite** (seats 1 & 3 against 2 & 4),
    **seated by the host in the lobby: at random, with swaps**.
  - **The double-six set, 7 each.** With 2 or 3 the rest are left to draw
    from: whoever can't play **draws until they can, and plays**, or passes
    once nothing is left; with 4 there is no drawing, and whoever can't play
    **passes**. The button says **باص / Pass** (the owner, 21 Sep 2026: it
    said دق / Knock, the table word, and "Pass" says what it does); the seat
    still gets the 👊 and the two knocks of a hand on the table. In the code
    the move is still `pass` and the table's memory of it `knocked`.
  - **Who starts**: round 1, whoever holds the double six plays it; nobody
    holds it (2-3 players), the highest double in anyone's hand; no double at
    all, the heaviest tile. **Later rounds: the winner of the last round
    leads with any tile.**
  - **عادي (Egyptian)**: a line with two ends; the round ends when someone
    plays their last tile or the table is blocked (قفلة). **Going out takes
    the pips left in the opponents' hands - in teams the two opponents only,
    the partner's leftovers counting for nobody. Blocked: the lowest hand
    takes the total of all the other hands; in teams the side with the lower
    total takes the other side's; a tie for the lowest scores nobody.**
    Target 101 by default (51 / 101 / 151 / 201).
  - **أمريكاني (All Fives)**: the first double played is the spinner, open on
    four sides (up and down once both of its sides have a tile). After every
    tile the open ends are added up (a double at an end both halves, the
    spinner alone both halves); **a multiple of 5 scores, 5 = 1 point**. The
    round's winner takes the others' pips (the same who-counts rules)
    **rounded to the nearest 5 and divided by 5**. Target 50 by default (30 /
    50 / 100).
  - **First to the target wins** (in teams the side's total); two past it in
    the same round, the higher total wins.
  - **The helpers are the host's, for the whole table, off by default and
    remembered**: light up the tiles that fit, and show a move's points
    (أمريكاني: the +2 each end would score). Off, nothing is lit - people use
    their heads - and a tile that doesn't fit is still refused.
  - **A turn clock**, off by default, 30 or 60 seconds: when it runs out the
    phone plays for the player (the first tile that fits, else draw, else
    knock). The host also gets a small button to play for a phone that went
    quiet, on the phone and the TV.
  - **Every lobby setting is remembered on the host's phone.**
  - **Computer players**: easy plays the first tile that fits; hard plays to
    win (heavy tiles out, a spread of numbers kept, the knocked numbers
    remembered and closed on whoever knocked, the partner helped; in
    أمريكاني the most points now, and no easy multiple of 5 left for the next
    player), from its own tiles and what the table can see only.
  - **A tile that fits more than one end**: tap it, the ends glow, tap one;
    one end, it goes straight there.
  - **The look**: option أ "عاجي" from the owner's design sheet (ivory, black
    pips, a brass pin); a snake that turns corners on a phone, a cross round
    the spinner in أمريكاني; an animation on every move that can have one.
  - **While a round is played the table gets most of the screen, at every
    size** (the owner, later the same day): on a laptop and the TV the line
    of tiles is big and uses the space, never small beside a wide panel of
    names and scores; seats, tile counts and scores are a compact strip -
    readable from the sofa on a TV, but not taking the room; on a phone held
    upright the line and your hand come first; the results can take over
    once the round or the game is over.
  - Decided for the owner, and open to change: **the game is decided at the
    end of a round**, so points scored mid-round in أمريكاني count toward it
    but the round is played out (the owner's "two past it in the same round"
    only happens that way); **two level on top play one more round**; **after
    a tied round nobody won, so the next round opens by the first round's
    rule**; **the opening tile of that rule is played by the server** (it is
    no choice); **a blocked table is declared the moment nothing can go**,
    rather than after everyone has knocked; **with a tile that goes on two
    ends that come to the same thing** (the same ends left, the same points)
    it goes straight on, with no question; **a player who leaves on their
    own has their tiles set aside** (seen and counted by nobody) and play
    goes on while two are left; **in teams a leave ends the game**, decided by
    the scores so far; **five or more in the room can't start it** (it is 2-4
    players - the rest can be a screen or wait); **the host's "skip" plays
    for the player** the way the clock would, rather than passing a turn they
    might have played; and the draw button **draws until a tile fits in one
    tap** (the table sees how many were drawn), with باص a tap of its own.

### Ideas not built yet (researched 16 Sep 2026)

Solo was the gap (Wordle, Connections, Memory, X-O against the phone and Guess
the Number). Built since, see *Solo games*: Sudoku, 2048, Minesweeper, Queens,
Tango, Nonogram, خيوط, كلمات من حروف, إيه اللي يجمعهم؟, سلسلة الإجابات
and خمّن الدولة (الترتيب الأعمى was built too, then removed: see *Decided,
and why*). The candidates as researched, each within the owner's rules
(free, offline where possible, nothing adult, content that doesn't go stale,
categories that name a kind of thing):

- **تحدي اليوم (a daily challenge)** across the solo games: the same puzzle
  for everyone on a date (seeded by the date), a streak, and a result to share
  on WhatsApp as a grid of emoji, the way Wordle spread.
- **خيوط (Strands-style themed word search)**: find the words of one category
  in a letter grid; the categories already exist in the Connections and
  Chameleon banks.
- **كلمات من حروف (a letter wheel + crossword, like the Arabic "كلمات كراش")**:
  the words come from the app's own banks, the letters from those words.
- **Logic puzzles generated on the phone** - no content at all: Sudoku, 2048,
  Queens (one per row, column and colour region), Tango (suns and moons),
  Nonogram (a picture from number clues), Minesweeper.
- **خمّن الدولة / العلم (Worldle / Flagle)**: a country from its flag or shape,
  with distance and direction after each guess; needs each country's
  coordinates, which never change.
- **Pinpoint-style "إيه اللي يجمعهم؟"**: a category's words revealed one at a
  time, fewer clues = more points; reuses the Connections groups.
- **A solo quiz streak**: the trivia, emoji and proverb banks with three lives
  and a best score.

Group candidates:

- Built since: **زي الكل** and **على راسك** (see *زي الكل in rooms* and *Solo
  games*).
- **العقل (The Mind)**: cooperative, each phone holds secret numbers and the
  table must play them in rising order without talking; no content.
- **الرقم السري (Ito)**: a secret number 1-100 each and a scale ("حيوانات من
  الأصغر للأكبر"); each says a thing at their number, the table orders itself.
- **قبل ولا بعد (Timeline)**: place events and inventions in order; dates
  never change, which fits the trivia rule.
- **المختلف (Undercover)** as a mode of الجاسوس: the impostor gets a close word
  instead of none.
- **Card game scorers** as tools, next to سكرو and الدومينو: إستميشن, طرنيب,
  تريكس, كونكان, باصرة - Arab tables use score apps for these.

Each of these would use the motion toolkit (*Using the motion toolkit in a
new game*): reveals and podiums for the group games, `spinLetter` for anything
drawn at random, `flyEmoji` or a ghost flight for placing things (Timeline,
the word search), `countUp` for streaks and scores.

### Decided, and why

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
- **أونو's edge cases, decided while building it** (21 Sep 2026; each is one
  place in `RoomUno.js` if the owner wants another): a 7 or 0 as your last card
  ends the round with no swap; a hand of one that arrives by a 7 or a 0 can't be
  caught (only playing down to one counts), and a hand that changes owners
  forgets its UNO; the catch window closes at the next move anyone makes (a
  play, a draw, a take, a keep, a colour, a jump, the clock) and never on an UNO
  or a catch; UNO said with two cards is forgotten if the hand grows again
  (`g.saidAt` keeps the count it was said at, and `unoSync` drops the call
  once the hand has grown past it - before 22 Sep 2026 a card drawn back up to
  two left an old call standing, and the player could not be caught); a
  +2 or +4 as the last card still makes the next player draw (the whole stack),
  and those cards count (Mattel's rule); a Reverse turned up lets the dealer
  start the other way (Mattel's rule) and a +2 turned up with stacking on waits
  on the first player, who may stack on it; a jump in may land while the player
  up holds a card they drew (it stays in their hand) and on a +2 still waiting
  (the same +2 raises it, and it waits on the player after the jumper), never
  with a wild and never before the first colour; nothing left to draw passes
  the turn; a one-round game's board is the wins of the evening at this game
  (`shared.wins`, kept by play again, started over by a game from the hub), so
  the night's table ranks whoever won most; a game left with one player ends,
  that player winning a one-round game (not counted as a win).
  On the phone a card is played with one tap (سكرو picks, then confirms): Uno
  is quick and a jump in is a race, and a card that can't go is shaken and
  refused on the phone without a round trip.
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
- **Domino's "can't play" button says باص / Pass** (owner, 21 Sep 2026); it
  said دق / Knock, the table word.
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
- **A table game's score keeper lives inside the game, with a shortcut in the
  tools** (owner, 21 Sep 2026). The domino score keeper became the "على
  الطاولة" side of the Domino setup screen, like سكرو's, and الأدوات → حاسبات
  النقط has `screw-calc` and `domino-calc`: catalog entries with no `setup` of
  their own (so the game's hero is the one drawn there) whose `open` is
  `openTableCalc(id)` - the game's setup, turned to that side.

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
  request. A report per phase is in `notes/phase-reports/`, each listing what
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
  (`notes/phase-reports/batch4-a.md`): `RoomVoteChess.js` and
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
  `RoomGames.js`, any list it bundles (the `FILES` in `rooms-worker/build.mjs`:
  `SpyWords.js`, `CodenamesWords.js`, `PartyContent.js`, `ChameleonWords.js`,
  `SpyfallPlaces.js`, `BombPrompts.js`, `EmojiRiddles.js`, `Proverbs.js`,
  `MonkeyWords.js`, `StopWords.js`, `TriviaQuestions.js`, `SkrewCards.js`, `TimelineEvents.js`,
  `UnoCards.js`, `DominoTiles.js`, `Connect4.js`, `DotsBoxes.js`, `Ludo.js`, `BankAlhaz.js`, `GuessWho.js`, `Hangman.js`, `PlayingCards.js`, `Battleship.js`, `Chess.js`, `Chess4.js`, `TicTacToe.js`, `Bowling.js`, `MiniGolf.js`, `WordleWords.js`, `Countries.js`, `SolveGames.js`, and the game files bundled after
  `RoomGames.js`: `RoomUno.js`, `RoomDomino.js`, `RoomDuels.js`, `RoomLudo.js`, `RoomBank.js`, `RoomGuessWho.js`, `RoomHangman.js`, `RoomDoubt.js`, `RoomOldMaid.js`, `RoomBattleship.js`, `RoomChess.js`, `RoomChess4.js`, `RoomVoteChess.js`, `RoomHandBrain.js`, `RoomBughouse.js`, `RoomBowling.js`, `RoomMiniGolf.js`, `RoomSolve.js`, `RoomTournament.js`) or `rooms-worker/src/` change. Build `docs/` first: the
  deploy also uploads it as the copy of the app the Worker serves. A deploy
  restarts every open room, so wait about a minute before `npm run test:live`.
- `docs/README.md` and `rooms-worker/README.md` have the details.

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
  every `data-i18n` attribute in the markup names a real key.
- `npm test` in `rooms-worker/` (with `npm run dev` running) plays every room
  game with robot players: turns, votes, scores, that secrets never reach the
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
  `ONLY=screens,rooms,fixes,site` runs some parts; `CHROME=` points at Chrome.
  About 15 minutes whole.
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
- **Translations:** All UI text goes through the `TRANSLATIONS` object in `JS_Core.html`, with the same key in `ar` and `en` (`npm run check:i18n` compares them). `data-i18n` fills an element's text, `data-i18n-ph` a field's placeholder, and `data-i18n-title` an icon button's tooltip *and* its `aria-label` - a button whose whole label is a glyph (↶) needs the last one, or it says nothing in either language.

### Multiplayer rooms

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

**Files**

| File | Role |
|---|---|
| `rooms-worker/src/index.js` | The Worker: `/create`, `/join`, `/act`, `/poll`, `/leave`, `/ws`. Knows no game rules. |
| `rooms-worker/src/room.js` | `Room` Durable Object, one per code: players, keys, sockets, saving, clocks, `project()`. |
| `rooms-worker/src/view.js` | `roomView(room, pid, online)`: what one device is sent, the projection itself - its own file so the leak check builds every view with the same function. |
| `rooms-worker/src/memory.js` | `PromptMemory`: which prompts every room dealt lately. |
| `rooms-worker/src/live.js` | `LiveStats`: how many players are online across every room, for `GET /live`. |
| `RoomGames.js` | `applyRoomAction` — one branch per game. All rules live here. |
| `RoomDuels.js` | The duels' rooms (كونكت ٤, نقط ومربعات): winner stays on. Bundled after `RoomGames.js`, which only dispatches to it (*The duels*). |
| `Connect4.js`, `DotsBoxes.js` | The duels' rules and the phone's players, one copy for the page (inlined, `SHARED_LISTS`) and the Worker (bundled). No DOM; every name prefixed `c4` / `dots`. |
| `TicTacToe.js` | إكس أو's rules (`xoMark`, `xoWinner`, 3 marks only), one copy for the one-phone game, the room's phones and the Worker. |
| `RoomTournament.js` | The duels' knockout: the bracket, every match run as a small room through its game's own rules (`TOUR_KINDS`, one adapter a game), the clocks, leaving, the podium. Bundled after every duel's room file (*The duels' tournament*). |
| `RoomUno.js` | أونو's rules and its computer players, bundled after `RoomGames.js` (whose helpers it uses); `unoAction` is reached from `applyRoomAction`. |
| `UnoCards.js` | أونو's deck and what may go on what (`unoCanPlay`), inlined into the page and bundled into the Worker, so a phone lights exactly the cards the server takes. |
| `CodenamesWords.js`, `PartyContent.js`, `SpyWords.js`, `ChameleonWords.js`, `SpyfallPlaces.js`, `BombPrompts.js`, `EmojiRiddles.js`, `Proverbs.js`, `MonkeyWords.js`, `StopWords.js`, `TriviaQuestions.js`, `SkrewCards.js`, `TimelineEvents.js` | Word lists (and سكرو's cards, and قبل ولا بعد's dates) the rules deal from, bundled into the Worker. Nine of them are also inlined into the page by `tools/build-*.mjs` (the `SHARED_LISTS` comment in `Controller.html`), because the pass-the-phone versions of those games deal from the same lists, a Stop phone checks its boxes with the server's own rule, the solo games ask from the room trivia's questions, and a سكرو phone names and draws the cards the server deals. **Two stay server-only, on purpose:** `PartyContent.js`, because the Fibbage answers in it must never reach a page, and `TimelineEvents.js`, because the years of unplayed cards are قبل ولا بعد's whole secret. |
| `DominoTiles.js` | The domino tiles, the table, the ends and their points, a round's result and the table's layout: pure functions, shared by the page (inlined like the lists) and the Worker, every name prefixed `domino`. |
| `RoomDomino.js` | `dominoAction` and its clock, its leave and its computer players: bundled after `RoomGames.js`, so a game this size keeps its rules in a file of its own. |
| `Ludo.js` | لودو's board (the track, the home columns, the yards as cells), every rule as one plain game object, and the computer players: shared by the page (inlined, `SHARED_LISTS`) and the Worker, every name prefixed `ludo`. |
| `RoomLudo.js` | `ludoAction`: the lobby's colours and seats, the server's dice, the clock, leaving, the bots and the forced move. Bundled after `RoomGames.js`. |
| `BankAlhaz.js` | بنك الحظ's board, its two decks (Arabic and English), every rule as two objects - the table (`g`, a room's `shared`) and what nobody sees (`priv`, the decks) - and the computer players: shared by the page and the Worker, every name prefixed `bank`. |
| `RoomBank.js` | `bankAction`: the lobby's pieces, seats and options, the server's dice, the turn clock, leaving, the bots and the forced moves; the decks live in `room._bank`, never projected. Bundled after `RoomGames.js`. |
| `GuessWho.js` | خمّن مين's faces (plain features, drawn by the page), the list of questions with their truthful answers, a board every face of which the list can tell apart, and the computer's question: shared by the page and the Worker, every name prefixed `gw`. |
| `RoomGuessWho.js` | `guessWhoAction`: the duels' seats and line (`duelSeatNext`, `duelEnd` from `RoomDuels.js`, bundled before it), the secret faces in `room._gw`, questions from the list and out loud, flipping, guessing, the clock and the bots. |
| `Hangman.js` | المشنقة's letters, the fold (one key a letter), a written word's rules, a board and a guess, and the race's words from the Chameleon boards: shared by the page and the Worker, every name prefixed `hm`. |
| `RoomHangman.js` | `hangmanAction`: one writes or a race, the word in `room._hm`, each board on its own phone, the points, the word clock, leaving. |
| `Battleship.js` | حرب السفن's fleets, the no-touching check, a random fleet, one shot and its result (a sinking marks the water round it), and the computer admiral: shared by the page (inlined, `SHARED_LISTS`) and the Worker, every name prefixed `bs` / `BS_`. |
| `RoomBattleship.js` | `battleshipAction`: the duels' seats and line (`duelSeatNext`, `duelEnd` from `RoomDuels.js`, bundled before it), placing and ready, the fleets in `room._bs`, the shots, the clock (`bsDeadline` / `bsTimeout`), leaving (`bsPlayerLeft`). |
| `Chess.js` | شطرنج's rules (every one, perft-checked), the clock, the rated computer, the coach's analysis and the review, and a tournament match's next game (`chessMatchNext`, Armageddon): shared by the page (inlined, `SHARED_LISTS`) and the Worker, every name prefixed `chess` / `CHESS_`. |
| `RoomChess.js` | `chessAction`: one board per game made and played through `chessBoard*` (the adapter a bracket uses), winner stays on (`duelSeatNext`, `duelEnd`), the clock on the server (`chessDeadline` / `chessTimeout`), a draw offered and answered, resigning, a forfeit (`chessPlayerLeft`). |
| `RoomVoteChess.js` | `voteChessAction`: شطرنج بالتصويت - the host's split (`sides`), one board through `chessBoard*`, the secret votes in `room._vc`, the close (`vcClose`: all voted, the clock, the host), the tally, resigning by vote, leaving (`vcPlayerLeft`). |
| `RoomHandBrain.js` | `handBrainAction`: المخ والإيد - the host's four seats (`seats`), the Brain's name and the Hand's move on one board, the clock per team, computer players (`ROOM_BOT_GAMES.handbrain`) and forced moves, a leaver's seat to a computer player (`hbPlayerLeft`). |
| `RoomBughouse.js` | `bughouseAction`: four seats on two boards (seat k plays board k >> 1 with colour k & 1; partners k and 3 - k), the moves and drops through `chessBugPlay`, a capture sent to the partner's hand (`chessBugGive`), both clocks on the server (`bughouseDeadline` / `bughouseTimeout`), the computer players (`ROOM_BOT_GAMES.bughouse`), a leaver replaced by one (`bughousePlayerLeft`), play again turning the partners. Bundled after `RoomChess.js`. |
| `Chess4.js` | شطرنج الأربعة's rules (the 160-square board, every piece, castling, promotion by mode, check from any opponent, mate and stalemate judged on the player's turn, grey walls, FFA points, the fifty-move rule) and the computer players: shared by the page (inlined, `SHARED_LISTS`) and the Worker, every name prefixed `chess4` / `CHESS4_`. |
| `RoomChess4.js` | `chess4Action`: the lobby (the way to play, the clock, the colours), bots in the empty colours, moves with `seq`, the clock on the server (`chess4Deadline` / `chess4Timeout`), the host's "play for", resigning, leaving (`chess4PlayerLeft`: FFA out, teams a bot in the seat), play again turning the table. |
| `PlayingCards.js` | The playing cards كدّاب and الشايب deal: the deck (one or two), a card's rank and suit, a hand sorted, what makes a pair in الشايب (same rank, same colour), the ranks' names: shared by the page and the Worker, every name prefixed `pc` / `PC_`. |
| `RoomDoubt.js` | `doubtAction`: كدّاب's claims, the call (first tap wins), the pile, passing and the pile going out, the places, the clock, leaving and the computer players; every hand in `room._doubt`. |
| `RoomOldMaid.js` | `oldMaidAction`: الشايب's deal (the deck grows with the table), the lift and the draw, dragging or shuffling a hand, pairs, the loser and the tally, the clock, leaving; every hand in `room._om`. |
| `Bowling.js` | بولينج's lane, pins and one throw as plain arithmetic (the same pins on every phone and the server from four whole numbers), and the score sheet: shared by the page and the Worker, every name prefixed `bowl`. |
| `RoomBowling.js` | `bowlingAction`: the order, each player's card, a throw run on the server (`bowlThrow`) and replayed by every phone, the clock and the host's gentle ball, leaving, the end. |
| `MiniGolf.js` | ميني جولف's sixty holes in three kinds and the draw of a game's holes (`golfDealCourse`), one putt as plain arithmetic (only + - * / and `Math.sqrt` / `floor` / `abs` / `min` / `max`, never `Math.sin`) - the other balls it knocks included - the pieces (ice, mud, pads, belts, portals, bumpers, ramps, gates), the most strokes (`golfMaxOf`), the way to the cup (`golfField`) and the clock's gentle putt (`golfAutoShot`): shared by the page (inlined, `SHARED_LISTS`) and the Worker, every name prefixed `golf`. |
| `RoomMiniGolf.js` | `minigolfAction`: the holes dealt through `nextPrompts` (`shared.holes`), all at once or in turns (the balls on the course knocking each other, `mgOthers`), the server's result of every putt, picking up past par + 3, the hole's card and the next hole on the server's clock, the putt clock, leaving. Bundled after `RoomGames.js`. |
| `WordleWords.js`, `Countries.js` | خمن الكلمة's lists and keypad (`WORDLE_DB`, `WORDLE_LAYOUTS`) and خمّن الدولة's table with the distances (`COUNTRIES`, `FLAG_ALIASES`, `FLAG_MODES`, `flagsDistance`, `flagsBearing`): moved out of `JS_Wordle.html` and `JS_Flags.html` for the rooms, shared by the page (inlined, `SHARED_LISTS`) and the Worker. |
| `SolveGames.js` | The four solve games' own rules (every name `sv` / `SV_`): a written word and its colours, the ranges and higher / lower, the country hints, an emoji clue's problems: shared by the page (a setter's form checks what it sends) and the Worker. |
| `RoomSolve.js` | `solveAction`: one sets, everyone solves - the engine (the order, the boards, the points, the clock, leaving) and its four plug-ins (`SOLVE_KINDS`). Bundled after `RoomGames.js`. |
| `JS_Room.html` | Client engine (WebSocket, reconnect, HTTP fallback) + the generic lobby UI. |
| `JS_RoomImposter.html`, `JS_RoomCodenames.html`, `JS_RoomGames.html`, `JS_RoomBuzzer.html`, … | Per-game renderers. |

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
Durable Object's storage on every move (drawing and the Wavelength dial at most
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

**The host can hand the room on** (the owner, 24 Sep 2026: "tap a name, then a
menu"). For the host, every other person's name is a button - in the lobby's
list, the players strip under a game and the TV's strip (`roomNameHtml`, a
faint dotted underline) - that opens a small centred menu (`#room-player-menu`,
`roomPlayerMenu`): «👑 المضيف يبقى منى» (worded with the role as the subject,
so it reads right whatever the name), greyed with a line for a phone that is
away, and «شيله من الغرفة» for a phone that is gone. The move is `makeHost
{ playerId }`, handled in `room.js` beside `kick` (it needs to know who is
connected): the host only, a person (never a computer player) who is here
now; said in the chat as the `host` event every change of host already is.

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

**Computer players** (the owner, 21 Sep 2026: optional, easy and hard). In
the games that register them - أونو, الدومينو, لودو, بنك الحظ, خمّن مين, باغ هاوس and شطرنج الأربعة - the host can seat a bot in
the lobby, to play alone or to make up a table of four for teams. A bot is an
ordinary entry in `room.players` with `bot` set to its level (`'easy'` or
`'hard'`): it holds a seat, is dealt like anyone, and its hand is in
`room.secrets` like anyone's. It has no key and no socket, so nothing can
ever speak for it from outside.

- **It moves through the same door as a phone.** `applyRoomAction` ends with
  `scheduleBots(room)`, which asks the game's hook
  (`ROOM_BOT_GAMES[game].pending(room)`) whether a bot has something to do now,
  and a key naming that moment. A new moment sets `room._botAt` a second or so
  ahead (`ROOM_BOT_DELAY_MS`, long enough to watch each move land); the same
  moment keeps the time it had, so a chat line never makes a bot wait longer.
  `roomDeadline` is the sooner of the game's own clock (`gameDeadline`) and
  `_botAt`, so the room's alarm wakes for it, and `roomTimeout` runs
  `runRoomBot`: the hook's `decide(room, pid)` - from the bot's own secret and
  what the table can see, never another hand - applied with `applyRoomAction`
  on a copy, exactly as if a phone had sent it. A move that is refused falls
  back to the game's always-legal move (`fallback`: draw, pass); if even that
  fails it tries again in 3s, three times, then waits for a person to move.
  `roomPlayerLeft` and a game's own timeout call `scheduleBots` too, since the
  turn may have passed to a bot. `pending` may ask for its own `delay` (a hard
  أونو bot waits a human's moment before catching someone), and a bot can act
  out of turn through the same hook (أونو's catch and jump in).
- **The lobby** (`roomBotControlsHtml`, `roomBotRowHtml` in `JS_Room.html`): a
  game that seats bots says so on its `ROOM_GAMES` entry (`bots: { max }`); the
  host gets "+ 🤖 سهل" and "+ 🤖 صعب", a bot's row shows 🤖 where the presence
  dot would be, and the host taps its level to change it or ✕ to take it out
  (`addBot`, `setBotLevel`, `removeBot`: room-level actions, lobby only). A TV
  host gets the same two buttons. The host's phone offers the name from
  `ROOM_BOT_NAMES` in its own language (زيزو, بندق…; Robo, Chip…), and the
  server makes it unique (`uniqueBotName`: "زيزو 2").
- **Bots belong to their game.** `backToHub`, and choosing a game without bots,
  park them in `room._botsMemo`; choosing a game that has them sits them back
  down while there are seats (`max`: four at a domino table), and the rest keep
  waiting. In the hub their seats are free, so the hub's minimum counts people;
  أونو and الدومينو open from one (`min: 1`).
- **What the room server does differently** (`room.js`): a bot is projected as
  always online (with `bot: level` on its row), never becomes host, and a room
  with nothing but bots and no screen is empty and deletes itself. It is not in
  the live player count (no socket). A phone can't join under a bot's name.
- **Forced moves ride on the same clock** (the owner's "one thing to do is
  done for you", *Decided, and why*). A game registers
  `ROOM_FORCED_GAMES.<id> = (room) => { pid, key, move: { action, payload },
  delay? }` for a person whose only legal move is known; when no bot is up,
  `scheduleBots` sets `_botAt` for that person `ROOM_FORCED_DELAY_MS` (1.2s)
  ahead, and `runRoomBot` asks the hook again when the beat is up and makes
  the move only if it is still the same moment (the key) and still the only
  move - so a person who tapped first, a jump in, or a turn that changed
  meanwhile is never overruled. A move refused is not tried again for that
  moment (`_forcedFailed`). Registered: أونو (take / draw; waiting as long as
  a bot while someone can be caught), الدومينو (with `helpFit` on, never
  the last tile), لودو (one piece that can move, or two on the same
  square; never the roll, never the last piece home) and بنك الحظ (a debt
  nothing can cover: bankrupt; a place there is no way to pay for: leave
  it). The duels register nothing: a last move there is often the
  winning one. `roomForcedMove` is exported for the rules tests. The phone draws a line (`uno_auto_*`, `dom_auto_*`) where the
  button would have been.
- A new game with bots registers `ROOM_BOT_GAMES.<id> = { max, pending,
  decide, fallback }` beside its rules and `bots: { max }` on its `ROOM_GAMES`
  entry, and plays a whole bot-filled game in `play-all.mjs` (one person plus
  bots, finished by the server's clock).

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

**The voting engine.** لو خيروك, مين أكثر واحد and فيبج all run on one
implementation in `RoomGames.js`: `openVote` / `castVote` / `closeVote`, plus
`addScore` and `scoreboardOf` for the running board and `nextPrompt` for pulling
content a room hasn't seen yet.

The rule that makes voting work: **who** voted is public, **what** they voted for
is not, until the round closes. Choices live in `room._ballots` — server-side
scratch that is never projected — so a phone cannot watch the tally form and
change its mind. `openVote` takes an optional `ownerId` per option, which is how
Fibbage stops you voting for your own lie.

When whose option is whose is itself the secret, `openVote(room, options,
eligible, { hideOwners: true })` keeps the owners in `room._voteOwners` and
tells each owner only their own option (`you.voteOwn`); `results[].ownerId`
is filled once the vote closes. فيبج needs this: its options used to go out
as `{ id: 'truth', ownerId: null }` next to each lie's author, so the real
answer was in every phone's network traffic before anyone voted. Its option
ids are random now and `shared.truthId` comes with the result.

A vote closes on its own once every eligible player has voted, or when the host
presses `closeVote`. On the client, `renderBallot(state, opts)` draws the ballot
*and* the host's close button in its progress row, so a game must not add a
second one; a vote on people passes `{ ownLabel: t.vote_you }` so your own row
says "you" rather than "your answer".

**A guess is judged the way the table hears it.** The owner typed طماطم for
طماطماية and was told "wrong", with no nudge (17 Sep 2026). `guessVerdict(text,
answers)` in `RoomGames.js` says `right`, `close` or nothing: right for the
same word after the fold, the same stem (one unit or plural ending dropped:
طماطماية/طماطم, تفاحة/تفاح, مهندسين/مهندس, cats/cat, and the ending
swallowing a final و or ا, مانجاية/مانجو), the same once measure words are
dropped (`GUESS_MEASURE_WORDS`: حبة, كوب, عربية, slice of…), or one letter
off in a word of five letters or more (never in a short one: كباب is not
كتاب); close for most of the letters, the same first four, or all but one
word of a phrase. ارسم وخمّن, the fake artist's guess and the quiz cards
(فوازير إيموجي, كمّل المثل; a near miss shows "🔥 قريب!" in the feed) judge
through it; `rules.mjs` pins the cases. **A guess that is another word of the
same list is never right by the lenient rules** (22 Sep 2026): the callers
pass their bank (`guessVerdict(text, answers, bank)`: `DRAW_WORDS[lang]`, the
quiz game's own bank), and a guess that names a different card there skips
the stem and the one-letter rule - House was judged right for Horse, and
شمس for شمسية. It is `close` instead. An ending is only dropped when enough
is left to be a word (`guessStem`: three letters, four after `ون`). Fibbage lies, Just One clues and
Codenames still use the plain fold: there "the same word" is the point.

**Draw & Guess words are things a phone can draw and a table can name.** (23 Sep
2026: the owner met ترومبيت and didn't know it; طوقان, ساكسفون, إكسيليفون, هارب,
يعسوب, بوق and رنة went with it - 682 words.) The
owner was dealt خلد (17 Sep 2026). The Arabic list had grown to 900 with a
bulk of animals, dishes, herbs and body parts (قضاعة, نيص, رتيلاء, بصارة,
عرقسوس, شريان) that nobody can draw or would guess; it is 690 curated words
now, one form per thing (طماطم, not also حبة طماطم and طماطماية, which the
judge treats as one anyway). A word goes in only if a sketch of it is
recognisable in a minute and the Arabic name is the one an Egyptian family
uses.

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

**Mafia's night looks the same on every phone.** One heading, one list of
everyone still in, one kind of button; the role, its task, the Mafia's picks,
the Lawyer's list, the Detective's results and the Doctor's last save are on
the back of a `.hold-card`, updated in place so a card being held doesn't
flip back. A tap the server would refuse does nothing, silently - an error
toast would say which role tapped.

**The room chat.** `chat` is a room-level action in `applyRoomAction`, next
to `chooseGame`: a message (`ROOM_CHAT_MAX_LEN` characters, five per five
seconds per phone) goes on `room.chat`, the last `ROOM_CHAT_MAX`, outside any
game, so it survives the hub and every deal, and `project()` sends it to
everyone. `JS_RoomChat.html` draws the 💬 button in the header (`body.has-chat`
with the soundboard's `has-fx`, never on the TV), the sheet, the unread badge, and a
toast for a message that arrives while the sheet is closed - once, with the
history at join counted as read.

Three things ride on it. **Quick reactions** are one-tap lines from
`chat_quick` in the translations. **Room events** are chat lines the server
writes with `roomEvent(room, kind, details)` - `joined` and `left` in
`room.js`'s join and leave, `host` wherever the host changes, `started` after
a `start` that dealt, `hub` on `backToHub` - stored as a kind and its details
(`sys`, `p`) so each phone says them in its own language; they belong to
nobody, so they count against no rate limit, and they never light the badge
or pop a toast. **Team chat** is أسماء الرموز only: a message sent with
`to: 'team'` carries the sender's team, `chatFor(room, pid)` is what
`project()` sends, so the other team and any screen never receive it, and a
spymaster in play (`phase === 'playing'`) reads their team's channel but is
refused writing to it - in the real game they hear the table and can't talk.
Team lines are dropped when a board is dealt and in `clearGameState`, because
the next game can have other sides.

**"دورك!" when you come back to the app** (`JS_RoomTurn.html`). After the page
has been hidden `TURN_AWAY_MS` or longer, the room refreshes itself as always;
the turn check waits until `Room.heardAt` is later than the wake - a socket
can look open after the phone slept and still be dead - and then asks
`roomTurnOf(state)` whether the game is waiting on this phone alone: the
bomb's holder, the drawer, a Codenames spymaster with no clue given or
operatives with one, the psychic, a writer who hasn't sent, an unanswered
question, an uncast vote with an option that isn't their own, the player up
in خمس ثواني or ربع قرد, an accused spy or chameleon or a caught fake who
guesses. If so, a banner (`#turn-banner`), a sound and a buzz, and a tap goes
back to the room. While hidden but still receiving, the tab title says it.
Nothing fires while the screen is being looked at. A new room game with a
turn needs its case in `roomTurnOf`.

**Who is playing right now.** The مع بعض tab says "دلوقتي فيه ٧ لاعبين في ٣ غرف"
under its pitch. It counts players in rooms, never phones with the app open:
opening the app still touches no server. A room reports its own number of
players online to `LiveStats` (one instance, named "live") through
`reportLive` in `room.js`, called wherever that number can change - a join, a
socket opening or closing, a poll that brings a phone back, a leave, a move
(a player becoming a screen) - and it only sends anything when the number
changed or the last report is `LIVE_REFRESH_MS` old; `destroy` reports 0. The
Worker answers `GET /live` from a copy at most `LIVE_CACHE_MS` old, and
`LiveStats` drops a room that hasn't reported for `LIVE_TTL_MS`, so a room
that died without saying so leaves the count within a quarter of an hour. A
phone on the HTTP fallback leaves no event when it stops asking, so `create`,
`join` and a returning `poll` set the room's alarm for when that phone would
fall out of `ONLINE_WINDOW_MS`, and `alarm()` counts again and comes back for
the next one: such a phone leaves the count in about half a minute. The
phone asks once when the tab opens and once a minute while it stays on screen
and awake (`refreshTogetherLive` in `JS_Catalog.html`), and shows nothing
below `LIVE_MIN_PLAYERS` or when the server can't be reached: a count that
says "1" advertises an empty app. It carries a room count and a player count
and nothing else - no codes, no names.

**The drawing tools** are one builder, `drawToolsHtml` in `JS_RoomDraw.html`,
used by Draw & Guess (undo on the server) and ارسم واكتب (undo on the phone):
pen, line, rectangle, circle, fill and eraser; fifteen colours and a custom
swatch over the phone's colour picker, in two rows of eight; four
thicknesses with undo, redo (`draw.redo`, the strokes undo took, until the
next new stroke) and clear; Ctrl+Z / Ctrl+Y on a laptop through
`draw.onUndo` / `onRedo`.
Freehand replays as one smooth path through the midpoints (`drawStroke`);
the finger's live preview is still segment by segment, and every canvas is
replayed from the list when the stroke lands, so the pixels agree. The
guessers get the word's shape (`shared.hint`, a dash per letter) and a
near miss is flagged `close` (`stringSimilarity` ≥ 0.7 on the folded words).

**Draw & Guess strokes carry a tool letter.** `t` is absent for freehand — which
is what every stroke made before the tools existed is, so old rooms replay
unchanged — and `l`/`r`/`o`/`b` for line, rectangle, ellipse and fill. Shapes
store their two corners (4 numbers) and a fill stores one point, so they are far
cheaper than the freehand strokes they replace: a hand-drawn circle is fifty
points, the circle tool is four. The eraser is not a tool letter at all, just a
freehand stroke in the paper colour, which replays with no special case.

**The drawer must see exactly what the room sees.** That property is easy to
lose and worth testing by rendering the shared list onto a blank canvas and
diffing it against the drawer's own, pixel by pixel. Three separate things broke
it while this was being built, all of the same shape — the drawer's canvas is
built from live input, everyone else's from a replay:

  * `Room.act` emits the new state to the renderer *before* it returns, so the
    drawer's own batch came back and was painted a second time on top of itself;
  * a poll landing mid-drag repainted underneath the stroke being drawn and
    threw away the snapshot the shape rubber-band restores from, so the preview
    stacked on itself and the edges went dark;
  * freehand was drawn segment by segment live but as one joined polyline on
    replay, which blends corners differently.

The first is now handled by replaying the shared list after every send rather
than trusting the canvas to already match, the second by refusing to repaint
while `draw.drawing`, and the third by replaying freehand segment by segment
too. A full replay costs well under a millisecond and happens after every send.

**Draw & Guess draws live.** The drawer paints locally and immediately, shares
the line under the finger every 80ms (`Room.sendLive`), and sends each finished
stroke 0.2s after the finger lifts (`addStrokes`). Viewers draw the live line as
it arrives, then repaint from the room's stroke list once the finished stroke
lands (`paintStrokes` replays from the paper up when a live line was showing),
so every phone ends with the same pixels and a lost piece repairs itself. Live
pieces overlap by one point and carry their start index, so a piece arriving
out of order is dropped rather than drawn in the wrong place. Shapes and fills
are not shared live; they appear when finished.

Coordinates are quantised to a 0–255 grid and packed flat (`[x,y,x,y,…]`), with a
hard budget of `DRAW_MAX_POINTS`; a stroke that would exceed it is truncated, not
dropped, so the drawing degrades rather than breaking.

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

**Codenames.** Only the key is secret. Everything else is in `shared`:

- `settings`: the host's options from the lobby. A turn clock (`CODENAMES_TIMERS`),
  spymasters rotating each game, and the room's own words, which go on the board
  first.
- `wins`: the evening's score.
- `marks`: who suspects which card. They are public, and cleared when that card
  turns or the turn ends.
- `log`: each clue, with the cards turned under it.

A clue can't be a word still on the board (compared through `normaliseClue`). A
clue of 0 or ∞ sets `guessesLeft` to -1: no limit. With a clock, `endsAt` covers
the clue and then the guessing, and `roomTimeout` passes the turn when it runs
out.

On a phone a tap marks the card and picks it. Revealing is a second, deliberate
press (`cnLocal.pending`), so a mis-tap never costs the turn. The sides, the
options and the score survive "play again" and a trip to the hub (`_teamsMemo`,
`_cnMemo`).

**الجاسوس in rooms** ends in a vote, like the Chameleon and Spyfall rooms:
after the discussion the host opens it (`startVote`), nobody can accuse
themselves, a tie lets the spy escape, and an accused spy picks the word from
six (`shared.options`, the secret among five others of the same category).
Caught and wrong, a point to every player; escaped or guessed, two to each spy.
`revealResult` is the host's way out without a vote and scores nothing. The
word is dealt through `nextPrompt`, and `restart` keeps the scores in
`room._impScores`. **من أنا؟ in rooms** has `gotIt`: the first to press
scores 3, the second 2, the rest 1 (`WHOAMI_ORDER_POINTS`), and the round
reveals itself once everyone present has pressed.

**الحرباء, الموقع السري and القنبلة in rooms** (`chameleonRoomAction`,
`spyfallRoomAction`, `bombRoomAction`). The chameleon's board is public; each
player's secret slice carries the index of the secret word, the chameleon's
carries only its role, and the word reaches `shared` only with the result.
The spy's slice is just `role: 'spy'`; everyone else's holds the place and a
job, and `shared.locations` is a card of 24 places with the real one among
them (`SPYFALL_CARD`), so the spy has something to guess from. Both vote
through the voting engine with `ownerId` set on every option, so nobody can
accuse themselves; a tie lets the impostor slip away, and an accused
impostor gets one guess (`guess` / `spyGuess`, `skipGuess` for the host). The
spy may also `spyGuess` at any time during `play`. The Spyfall clock is a
server deadline that opens the vote by itself. The bomb's fuse is
`room._bombEndsAt`, never projected: phones get `shared.heat` (0-3), bumped by
the alarm at 40%, 65% and 85% of the fuse, and tick faster with it
(`BOMB_TICK_MS`); the bomb itself is on one phone at a time (`shared.holderId`, moved along
`shared.order` by the holder's `pass`), so when the alarm sets it off the
server strikes the holder itself (`explodeBomb`); `markLoser` lets the host
move that strike, and the loser starts the next round. Only the holder's
phone and the TV tick out loud. The strikes are the board, fewest first. `swap` deals a
new category, so it is in `DEAL_ACTIONS` in `room.js`. The three phone
renderers carry their own `TV_GAMES` entries (`JS_RoomChameleon.html`,
`JS_RoomSpyfall.html`, `JS_RoomBomb.html`).

**The five games of 15 Sep 2026** share what was already there:

- **صدق ولا كذب** (`twoTruthsAction`): each phone `submit`s three statements
  and the index of the lie; the server shuffles the three (so the lie is
  never "always the third") and keeps the index in `room._tt`. One
  storyteller at a time: their statements become vote options that all
  carry `ownerId: subject`, so the voting engine keeps them out of their
  own vote. `resolveTwoTruths` gives `TT_CATCH_POINTS` to each voter who
  picked the lie and `TT_FOOL_POINTS` per fooled voter to the storyteller.
  `closeWriting` lets the host start with whoever has written.
- **فوازير إيموجي and كمّل المثل** run on one engine (`quizAction`,
  `QUIZ_GAMES`): the deck is dealt at `start` through `nextPrompts`, each
  card reaches `shared.card` with its answer and alternatives stripped,
  `guess` compares through `normaliseClue` against `a` and `alt`, and the
  right answers score like the trivia (`QUIZ_POINTS` plus a speed bonus by
  order). `retry: true` (emoji) lets a wrong guess be shown to the table
  in `shared.feed` and tried again; `retry: false` (proverbs) takes one
  answer each. The card closes when everyone has answered, when the host
  presses `closeQuestion`, or by the server clock (`QUIZ_GRACE_MS`).
- **خمس ثواني** (`fiveSecondsAction`) deals its whole game from
  `BOMB_PROMPTS` at `start` (`room._fiveDeck`, `order × rounds`), so no
  per-turn action has to be a `DEAL_ACTION`. `go` (the player up, or the
  host) starts a five-second server clock; `roomTimeout` moves it to
  `judging`, and the host's `judge` (allowed early too) scores and advances.
- **ارسم واكتب** (`telephoneAction`) starts one chain per player with a
  phrase from `DRAW_WORDS`. Step k gives chain c to player `(c + k) % n`,
  drawing on odd steps and writing on even ones; the previous step
  travels in `room.secrets[pid].task.prev`. Drawings arrive whole
  (`submit` with `strokes`, cleaned by `cleanStrokes` under the same
  budget as Draw & Guess) because the phone keeps them locally
  (`draw.local` in `JS_RoomDraw.html` turns the per-stroke flush off).
  A step ends when everyone has sent, or by the clock through a
  `collecting` grace like Stop's. The reveal publishes one chain at a
  time (`publishTelephoneChain`): a whole evening's drawings in every
  state push would be most of a phone's data. No scores.

**ربع قرد** (`JS_Monkey.html` on one phone, `monkeyRoomAction` and
`JS_RoomMonkey.html` in rooms) referees with `MonkeyWords.js`: countries and
cities in both languages, English animals and foods, and the spy words for
Arabic animals and foods (`monkeyPool`). `monkeyFold` keeps the letters only
(hamza forms, ة/ه, ى/ي, spaces and punctuation go; the article stays, since
الجزائر is spelt with it). Three modes: `letters` spells a name one letter a
turn - a prefix that equals a name (`monkeyExact`) is closed and costs its
closer a quarter; `liar` checks the prefix against the list
(`monkeyPrefixWords`): nothing starts like that and the bluffer pays,
something does and the caller pays and sees three examples; the table can
`flip` the verdict. `chain` and `names` take one real, unused name a turn,
the chain requiring the last letter of the name before. Four quarters make
a monkey, skipped in the order and unable to act, and the host's `swap`
puts them back in someone's place. A turn clock is a server deadline; with
`autoPenalty` it costs a quarter, otherwise it only flags `timedOut` for the
host. One-phone Monkey keeps its old helpers in `JS_Utils.html` (the reorder,
the switch, mid-game players, the status edit, the timeout sheet).

**زي الكل in rooms** (`herdAction`, `JS_RoomHerd.html`). One question for
everyone ("اكتب حاجة واحدة من: فواكه"), dealt through `nextPrompt` from the
Chameleon categories and the bomb's (`herdPrompts`, without the bomb's
"حاجات بتطير" kind, which name a property rather than a kind). Answers wait in
`room._herd.answers` until every phone has sent or the host presses
`closeWriting`; then `herdGroups` groups them through `normaliseClue`, so قطة
and القطه are one answer. In `reveal` the host can `merge` two groups that
mean the same thing (tap one, then the other; `unmerge` puts them back) and
then `score`: the single biggest group of two or more gets a point each, a tie
for biggest scores nobody, and if exactly one player stands alone they take
the sheep (`sheepId`) from whoever had it. Nobody holding the sheep can win:
the first to the host's target (5, 8 or 10, `ashryHerdOpts`) without it wins.

**مافيا in rooms** (`mafiaAction`, `JS_RoomMafia.html`), the owner's spec (see
*The owner's specs*). `mafiaCount` picks the Mafia from the table (one up to
six players, two up to nine, three beyond; five at least) and `mafiaRoles`
adds the Doctor and the Detective in the Roles mode, and the Lawyer from six
players. `room._mafia.roles` never leaves the server; `mafiaWriteSecrets`
rewrites every phone's slice after each move: its role, the Mafia list for
the Mafia and the Lawyer (the Mafia's list never names the Lawyer), the
Mafia's picks for each other, the Doctor's last save, the Detective's checks
(a Lawyer checks as not Mafia). Phases: `roles` (the role on a `.hold-card`),
`night` (every living phone taps a name through `nightPick` - a suspect for
those with nothing to do, so nobody can tell who acted - with a server clock;
it ends when all have tapped, by the clock or by the host's `endNight`),
`day` (the news, then a discussion clock the host can lengthen with
`moreTime` or cut with `startVote`; the clock opening the vote is
`roomTimeout`), `voting` (the voting engine, living players only, every
option owned by its player so nobody votes themselves, plus "nobody"; a tie
or "nobody" on top sends nobody out), `dayResult`, and `gameover` with every
role in `shared.roles`. Someone who leaves is shown through `mafiaShownRole`:
a Citizen unless Mafia, or their real role when the host turned
`revealRoles` on. The Mafia win at parity (the Lawyer counts with the town
there but wins with the Mafia); the town when no Mafia is left; each winner
scores a point. The news is worded so it fits any name ("المافيا خرّجت
{name} من اللعبة"): Arabic verbs agree with the subject, and a name doesn't
say whether to write خرج or خرجت. `roomTurnOf` asks a living phone that
hasn't tapped at night (`turn_night`).

**The narrator** is an option in the lobby, **off by default** (the owner,
20 Sep 2026: not on until it has been heard on a real phone). It is a room
setting - `shared.narrate`, so every device agrees the evening has a voice -
and exactly one device speaks: the big screen where there is one (the table's
own voice, and nobody is holding it), the host's phone where there is none
(`mafiaNarrator`). At each change of phase it reads one short line
(`mafiaNarrationLine`): the town falling asleep, the morning news, the vote,
the end. **It never reads a role**: the lines are the very strings already
printed on every screen, and `mafia_was` and the role name are deliberately
not among them. A news card lies face down for a beat, so the line goes
through `afterReveal` rather than saying the name out from under the reveal.
The speech itself is `speakLine` / `speakStop` / `speakPrime` in
`JS_Sounds.html`, which handles the three things browser speech gets wrong:
`getVoices()` is empty until `voiceschanged`, so the list is asked for each
time rather than cached; iOS only starts speech inside a tap, so it is primed
on the first one anywhere in the app and a refusal is swallowed; and where
there is no voice for the language it says **nothing at all** - an Arabic line
read by an English voice is worse than silence. Leaving the screen, or the
room moving on (`onRoomClocksReset`), cancels whatever is being said.

**العقل in rooms** (`mindAction`, `JS_RoomMind.html`). A cooperative game with
no content at all: every phone holds numbers from 1 to 100 that only it can
see, and the table lays them all down in rising order without a word. Level
*n* deals *n* cards each; the hearts start at the number of players. The
numbers are the whole game, so a hand is `room.secrets[pid].cards`, kept
sorted - `play` always means the lowest card that phone holds, so there is no
card id to send and nothing to cheat with. `shared` carries the level, the
hearts, the pile, what was thrown away face up and `held` (how many each
player still has), never a number anybody is holding. Playing out of order
costs one heart and turns every lower card face up, which is the real game's
rule and what keeps a level moving. A level with nothing left in hand is
`levelDone` and the host deals the next; the deck running out of room for
another level is a **win**. `roomTurnOf` answers for any phone still holding a
card - in العقل it is always your turn. There is no score board, so the
night's leaderboard and the share card both pass it by, which is right.
On the phone: your numbers big, only the lowest a button, the pile, the
hearts and a strip of how many each player holds. A card flies from where it
was tapped onto the pile, and a heart lost shakes the screen once - checked
**before** the phase branches, because losing the last card of a level costs a
heart and clears the level in the same move.

**قبل ولا بعد in rooms** (`timelineAction`, `JS_RoomTimeline.html`). One card
starts a line on the table; everyone else holds event cards with the years
taken off (`timelineHidden`). On your turn you pick one and tap a gap - before
the first, between two, or after the last. Right and it stays and your hand is
one smaller and you score a point; wrong and the year is shown, the card is
out and you **draw a replacement**, so a hand only ever shrinks on a card put
in the right place. First to empty wins, and because everyone starts with the
same hand the board (cards placed correctly) and the winner always agree.
**When the replacements run out the board decides** (the owner, 22 Sep 2026):
a wrong card with nothing left to draw ends the game (`shared.ended = 'deck'`,
`timelineEndOnBoard`), and whoever placed most wins, nobody if nobody placed
one; a hand emptied by a wrong card that couldn't be replaced never wins.
The bank is `TimelineEvents.js`: 22 events, 1869-2015, Egyptian and Arab
first with famous world dates mixed in (the owner, 20 Sep 2026), each with one
year nobody argues about. **It is bundled into the Worker only** - deliberately
not inlined into the page like the other shared lists - because the years of
unplayed cards are the whole secret and the app would otherwise ship the
answer key, the same reason `PartyContent.js` stays server-side. For the same
reason a hand with its years is `room._timeline.hands` (never projected), and
a phone's `room.secrets[pid]` holds only the hidden cards: `project()` sends a
player their *whole* slice, so the years kept there beside the hidden copy
were in every phone's own traffic until 22 Sep 2026 (*Traps*). `npm run
check` fails on a repeated year or a missing language. The hand size is worked
out from the cards that actually came back, keeping at least one spare per
player for the replacements (seven players get two cards each and seven
spares; twelve get one each and nine spares). The line carries `dir="ltr"` in both languages: it is a physical
axis like Wavelength's spectrum, and mirrored in Arabic it would read 2015
before 1869. A gap is a button only on your turn and only once you have picked
a card.

**سكرو in rooms** (`screwAction`, `JS_RoomScrew.html`), the owner's spec
(see *The owner's specs*). The cards are `SkrewCards.js`, shared with the page:
`SKREW_CARDS` (value, kind, power, which version), `SKREW_EDITIONS`,
`skrewDeck(groups, decks)`, `skrewValue`, `skrewMatches(top, card)` and
`skrewDecksFor(players)` (two decks beyond six; the room keeps one thief even
then, since the vote is about "the" thief), `skrewHandValues` and
`skrewDeck(groups, decks, { basraCount })`. The lobby sends `{ edition,
groups, teams, rounds, screwFromLap, turnClock, suddenDeath, basraCount,
memorizeSecs, memoryHelp }` (`ashryScrewOpts` on the host's phone); teams need 4, 6 or 8 players and are two sides alternating
seats (`shared.teams`, keys `A` and `B`); صاحب صاحبه turns them on by
default. Seats are shuffled at start and at play again.

- **What is hidden.** The deck, the pile and every slot's card live in
  `room._screw`, never sent. `shared.hands` holds slot ids in order, with a
  card (`up`) only while the rules keep it face up - the cannon, the reveal -
  and such a card stays face up wherever a public move takes it (a card taken
  from the pile goes face down). A failed throw (owner, 17 Sep 2026) is shown
  to the table in its event and goes back face down in its slot; the penalty
  card goes face down into a new slot and nobody, its owner included, sees it. A phone's own slice holds only its
  memorize cards (slots 3 and 4, until it taps ready), the card it drew, the
  الخشاف four and its last look, until its next move.
- **Every move is an event** (`shared.events`, the last 40, numbered by their
  own `shared.eventSeq`): `draw`, `keep`, `takePile`, `match`, `penalty`,
  `screw`, `peekOwn`, `spyOther`, `blindSwap`, `basra`, `allAround`, `give`,
  `seeSwap`, `ping`, `pong`, `wakeUp`, `cannon`, `khoshaf`, `scream`,
  `reshuffle`, `skip`, `thiefGuess`, `reveal` - with the slots and players they
  moved, never a hidden value. This is what lets every phone show "Ahmed
  swapped his 2nd with Mona's 4th". In `seeSwap` `slot` is the other player's
  and `slot2` your own, the opposite of `blindSwap`.
- **Stale taps.** Every move carries `seq`; `screwApply` raises
  `shared.turnSeq` only when the phase, round, player up, stage, power or
  `pongOpen` changes, so a double tap is dropped and taps that arrive together
  in memorize are not.
- **A turn**: `draw` then `keep {slot}` or `discard` (a command card thrown
  straight from the deck opens `stage: 'power'`: `power {…}` or `skipPower`),
  `takePile {slot}`, `match {slot}` (one card, the whole turn; wrong: the card
  goes back face down in its slot, its event shows it, and a blind penalty
  card goes face down into a new slot), `screw` (from lap `screwFromLap`), or
  `pass` when the deck is empty and can't be refilled. The memorising at the
  start waits for every tap, or `memorizeSecs` (5 or 10) on a server clock.
  Laps count each time the turn passes the round's first seat, which moves on
  each round. After سكرو only `finalLeft` plays, and the caller's side (the
  caller, and the partners in teams) can't be the target of a swap, give,
  see-and-swap or cannon, and takes no part in بوم or the scream; looking is
  allowed. بوم (`stage: 'boom'`, `shared.boom { waiting, picked }`,
  `boomPick { slot }` from every other player, hidden until all are in or the
  clock or host closes it with random picks) throws one card from each onto
  the pile, anything goes; the scream gathers the unprotected hands, shuffles
  and deals back the same counts with every look and known value wiped. After
  either, the player who played it has a whole new turn (`stage: 'choose'`).
  بصرة on the red screw or the thief shows it and puts it back face down. A
  الخشاف pick counts as drawn from the deck (its power works); a بينج or
  المسحراتي picked that way plays itself.
- **The end of a round.** A round ends on a سكرو's last turns; on المسحراتي
  (at once; after a سكرو the first caller stays the caller); on a hand that
  runs out (`shared.finisher`, however it was emptied, even by someone else's
  بوم); or, with `suddenDeath`, once everyone has had the last turn that the
  deck running out started (`shared.lastLap { by }`: no reshuffle, `pass`, no
  penalty card, no سكرو). With the thief in the deck (even if nobody holds it,
  or the phase would say someone does), every seated phone then votes who
  holds it (`thiefVote`, changeable until the close; the choices wait in
  `room._screw` and `shared.thiefVote.voted` says only who voted; it closes
  when all have voted, on `closeThiefVote` / `skipTurn`, or on the turn
  clock): the most votes accuse, and a tie goes to the caller's choice if it is
  among the tied, otherwise nobody. Scoring is `screwScoreRound`: hand values
  (`skrewHandValues`: a life jacket copies the lowest other card, 10 alone),
  team sums, `screwRoundScores` (a finisher's side 0; else a caller equal to or
  below every other side 0, the others their totals; a beaten caller doubled
  whatever the sign - in teams only the caller's own hand - and the lowest of
  the others 0; no caller, the lowest 0), then `screwThief` (caught: the
  holder's side +25; otherwise that side takes the lowest round score and every
  side that had it +25). `results` carries `hands`, `values`, `sums`, `totals`,
  `thief` (`holder`, `accused`, `votes` - published only now - `caught`,
  `stole`, `victims`, `score`, `skipped`), `round`, `lowest`, `caller`,
  `finisher` and `callerDouble`; in teams `totals` and `round` hold the team
  keys and every player. The last round goes straight to `gameover` with
  `winners` (and `winnerTeams`). The board is lowest first, so `renderPodium`
  (highest wins) is not used for it.
- **House rules** (`settings.thiefSteal`, `settings.teamBasra`, off by
  default; the owner asked for both as options, 17 Sep 2026). With سرقة
  الحرامي, a thief just drawn (or picked with الخشاف), or on top of the pile as
  a turn starts, can be played as a steal: `thiefSteal { target, slot }` shows
  that card on the stealer's phone alone (stage `steal`, `turn.look`),
  `stealSwap { slot }` is a forced swap, the thief goes up on the pile and is
  out for the round, and a round where nobody can hold it skips the vote. With
  بصرة الفريق, `match { slot, owner }` throws a teammate's card: a partner
  emptied this way finishes the round, and a wrong throw's penalty card is the
  thrower's.
- **What the table knows.** Every slot carries a public history,
  `shared.hands[pid][i].h = { how, by, from, at, known, looks }`: how its card
  arrived (deal, deck, pile, penalty, swap, give, scream, khoshaf), who moved
  it and from which slot, who has looked at that card (looks travel with the
  card), and `known` for a card the whole table saw face up (taken from the
  pile, or a failed throw back face down). It is what everyone watched happen,
  so it is public, and it reaches back further than the last 40 events at 12
  players. The phone draws it only with `memoryHelp` on (off by default: the
  owner's "memory is the game"); otherwise moves light up as they happen and
  fade.
- **Clocks and leaving.** The turn clock (0, 30 or 60 seconds) is a server
  deadline that does what the host's `skipTurn` does, and closes the thief
  vote too. A player who leaves puts their cards under the deck and their turn
  moves on; a caller who leaves brings the reveal at once, with no caller; and
  the game ends when fewer than two (or one side) are left, without scoring
  the round in progress. A latecomer watches
  until play again.

**سكرو on the phones and the TV** (`JS_RoomScrew.html`, `ROOM_GAMES.screw`
and `TV_GAMES.screw`; styles in section 16 of `Style.html`). Every hand is
face down in numbered slots on every phone and the TV, drawn by one card
builder, `skrCardHtml`, sized by `--skr-w`.

- **The cards and seats the owner picked** (17 Sep 2026, from a sheet of three
  card styles and three seat layouts; the first cards were a number or an
  emoji with a name, "not like real cards"): style 3, colour blocks - each
  card in its type's colour (`--skr-c-low` … `--skr-c-oscar`, the same in both
  themes; `SKR_DESIGN` / `skrCardDesign`), a big white numeral in Baloo
  Bhaijaan 2 or a white line icon (`skrIcon`, one set, also used for the
  powers in the bars), the value in two corners and the name on a band from
  56px wide up (a container query hides them below), and a violet dotted back
  with the Ashry mark. No emoji on a card. Seat layout أ: a round avatar with
  the first letter, the name and the tags on top, the cards in one row under
  it with each slot's number under its card. When a hand doesn't fit one row,
  `skrStackHands` (after every draw and on resize) stacks it in even rows, 2
  over 2 or 3 over 3, with an odd card beside them, centred - the owner's
  rule; a card left alone under three looked broken. Seats two a row give
  their slots no side padding (`.skr-opps--grid`), or rounding dropped the
  fourth card of a 375px phone.

- **Memory is the game.** By default the table remembers nothing, as at a real
  table: every move is drawn as it happens - a flight between exact
  `data-skr-at` places (`skrPlay`, one choreography per event: the deal, the
  riffle of a reshuffle, draw, keep, take, a right or failed throw, each power
  from the peek's lift to بوم's throws, the scream's gather, riffle and
  re-deal, the vote's pins and
  the reveal's stamps; Web Animations of transform and opacity on fixed
  layers) - the places it touched glow with a sign for about 3 seconds
  (`skrFlash`, carried across redraws by `--skr-flash-at`), the latest move
  sits at the top of the table (`skrLatestHtml`) and the log keeps two more. A
  phone back from the lock screen replays nothing (`skrWokeRecently`).
  `settings.memoryHelp` switches on each slot's story from the server's
  `hands[pid][i].h` (corner icons, words under your own cards, each seat's last
  move, a known value on the back, a story toast). A new animation calls
  `skrCanMove()`, registers its timers in `skrFx.timers` and pushes
  `skrFx.busyUntil`, so the table isn't redrawn under a flying card; positions
  are measured just before each redraw.
- **Picking.** A move is picked, then confirmed in the sticky action bar
  (`skrLocal.pick`, `skrNeed`, `skrPickPayload`). Someone else's card is two
  steps in the bar (`skrTargetsHtml`: the names, protected ones greyed, then
  that player's cards large), so twelve players keep a compact table of two
  columns; كعب داير steps through the players with a count. Protected hands
  after سكرو come from `skrProtected` (the caller's side in teams).
- **The thief vote** runs on every seated phone (`skrVoteHtml`; this phone's
  own choice is kept in sessionStorage, since a changed vote sends no event)
  and on the TV. The reveal plays the votes as `renderVoteResults` bars, then a
  `spyRevealParts` card, then the hands turning one by one, the ×2 stamp on a
  beaten caller and a life jacket's value turning into the card it copies. A
  round that ends on a move plays that move on the table first
  (`skrPlayEnding`; on the TV `frame` keeps drawing the table while
  `skrFx.tvEnding`). The lowest-wins podium mirrors the board through
  `renderPodium`.
- **Fitting.** On a phone upright the page scrolls your hand above the bar when
  it matters (`skrHandInView`: the memorising, your turn). On a phone on its
  side up to four opponents take a row each and the bar is one line of prompt
  with smaller buttons (a `:has()` rule counts the seats). Twelve seats fit the
  TV at 1280×720 without scrolling. Values inside a translated line are
  isolated (FSI/PDI in `skrT`) except plain numbers, or "Adam: +20" draws as
  "+20 :Adam" and "1/5" as "5/1". A few short sounds were added to `FX` in
  `JS_Sounds.html` (`skrFlick`, `skrRiffle`, `skrDrum`, `skrThump`), not on the
  soundboard; none depends on a hidden card.

**أونو in rooms** (`unoAction` in `RoomUno.js`, bundled after `RoomGames.js`;
the cards in `UnoCards.js`), the owner's spec (see *The owner's specs*).

- **Cards.** A kind is colour + value (`r7`, `gs` skip, `bv` reverse, `yd`
  +2) or `w` / `w4`; in play a card is `{ i, k }`, `i` a random id for the
  round (never published while the card is in a hand or the deck), and a wild
  on the pile carries `c`, its colour. `unoCanPlay(k, top, color, pending,
  settings)` is the one rule for what goes on what, stacking included; the
  phone lights cards with the same function.
- **What is hidden.** `room._uno` holds the deck, the whole pile, every hand
  and the id of a card just drawn; `room.secrets[pid]` is that phone's hand and
  `drawn`. `shared` carries `counts`, the top of the pile (`pile`, the last 8),
  `color`, `dir`, `turn { pid, stage }`, `pending { n, kind }` (a stacked draw:
  `kind` is the last draw card, `d` or `w4`), `said` (who has said UNO),
  `unoCatch` (who can be caught right now), `scores`, `board`, `results` and the
  events (`shared.events`, the last 40, `shared.eventSeq`): `deal`, `play`
  (with `jump`, `uno`, `color`, `left`, `pending`), `skip`, `reverse`, `hit`,
  `draw`, `take`, `keep`, `pass`, `color`, `uno`, `caught`, `swap`, `rotate`,
  `reshuffle`, `auto`, `win`, `left` - a draw says how many, never which.
- **A turn** (`turn.stage`): `color` when the round opened on a wild
  (`pickColor`), then `play` (`play { card, color?, target?, uno? }`, `draw`,
  or `take` when a draw waits), and `drawn` when the card drawn fits (`play`
  that card only, or `keep`). Out of turn: `callUno`, `catchUno { target }`,
  and with jump in `jump { card, top }`. Turn moves carry `seq`
  (`shared.turnSeq`, raised at every turn start and stage change) and a jump the
  id of the top card it aimed at: a late tap is dropped. The host's
  `skipTurn` and the clock (`unoDeadline` / `unoTimeout`) do the same thing:
  take a waiting draw, keep a drawn card, or draw one and pass.
- **The end.** `unoEndRound` counts the other hands (`unoHandPoints`); rounds
  mode banks it (`roundOver`, the host's `nextRound`, the first seat moving on
  one each round), one round adds a win to `shared.wins` and goes straight to
  `gameover` - the points are still in `results` but no screen shows them. A player who leaves
  (`unoPlayerLeft`) puts their cards under the deck and passes their turn; fewer
  than two ends the game.
- **Computer players** (`ROOM_BOT_GAMES.uno`): `pending` puts a hard bot's
  catch first (1.5-2.6s, a human's moment), then a hard bot's jump in, then the
  bot up - which waits 2.8-3.6s while somebody can be caught, so the table gets
  its chance. Easy plays the first card that fits and forgets UNO one time in
  three; hard scores each card that fits (`unoBotBest`: keep wilds, stay in the
  colour it holds most, hit a next player with two cards or fewer, shed big
  cards when anyone is close, swap with the smallest hand on a 7, a 0 only when
  the hand coming is smaller). `rules.mjs` plays 45 whole bot games across every
  variant and checks that no bot move is ever refused and no card is lost.

**أونو on the phones and the TV** (`JS_RoomUno.html`, `ROOM_GAMES.uno` and
`TV_GAMES.uno`; section 20 of `Style.html`).

- **The cards the owner picked** (option أ "بلوكات", the family of سكرو's): the
  whole card in its colour (`--uno-r` `#e5383b`, `--uno-y` `#f5b400` with dark
  ink, `--uno-g` `#1f9d55`, `--uno-b` `#1e6fd9`, the same in both themes) with a
  soft shine, a big Baloo numeral or a line icon (Skip a slashed circle,
  Reverse two arrows), the value small at the top of the reading direction's
  start and turned at the other end (so a hand overlapped in Arabic still shows
  it; a 6 and a 9 are underlined), the wilds near black with a four-colour
  wheel (the +4 over it), the back violet and dotted with "A.". One builder,
  `unoCardHtml(k, { size, color })`, sized by `--uno-w`, 1:1.5.
- **The play area first** (the owner, 21 Sep 2026): the other players are one
  strip of compact chips (avatar, name, a fan of backs with the count on it,
  أونو in red at one card; a sideways scroll on a phone, turned to the player
  up by `unoOppsInView`, fading at its edges), then the pile across the width,
  your hand (`unoFitHand` overlaps a row that doesn't fit, rows of up to 12),
  the bar, the last moves. A phone on its side puts the pile beside the hand
  and the bar; from 900px the pile spans the width and the hand sits beside the
  bar, cards sized by the screen's height. The TV is a ring of chips along the
  top and back along the bottom round a big table, the turn and the moves
  beside it. Measured with twelve at the table: the play area is 59-66% of the
  height and 87-95% of the width of a laptop player's screen, the TV's table
  65% by 66-69%, with nothing to scroll.
- **Playing.** One tap plays a card; a wild asks for its colour and a 7 (7-0)
  for a partner in the bar (`unoLocal.pick`); a card that can't go shakes. The
  bar carries the draw or take, play-or-keep after a draw, **أونو!** (two cards,
  or one not said yet - big and pulsing while you can be caught) and, for
  everyone else, **امسكه!**. `roomTurnOf` answers for the player up. A
  tapped card rises at once (`is-sent`, a `translate` on top of the
  screen's own lift for a playable card) while the server is asked - an
  iPhone has no buzz to say the tap landed - and flies from there; refused,
  it settles back.
- **Your own move never waits for the table** (the owner, 21 Sep 2026: a
  Skip and then the next card "takes a sec"). A new state normally waits
  while the last move's flights land (`unoFx.busyUntil`), so everyone sees
  each move in turn - but a Skip is ~1s of motion, and your next card sat
  behind it, 160-840ms after the server had already taken it (mean 480ms,
  measured against a bot). `unoOwnMoveWaiting` sees an event this phone made
  among the unshown ones (a card, a draw, a take, a keep, a colour, أونو!, a
  catch) and the table is redrawn at once: nothing is cancelled, what was
  still in the air plays on over the new table, and the places it is flying
  to stay hidden until it lands (`unoHeldKeys` / `unoHoldAgain` carry the
  holds across the redraw; a flight from before a new deal releases nothing,
  `unoFx.gen`). Other players' moves still wait their turn.
- **Motion on every move.** Each event plays once per device (`unoEventsToPlay`,
  keyed on the deal), flying between exact places measured just before the
  redraw (`data-uno-at`: `deck`, `pile`, `color`, `dir`, `pending`,
  `seat:<pid>`, `card:<id>`): the deal round the table and into your hand
  turning up, a card from a hand onto the pile with a turn, cards from the deck
  to a seat (backs) or into your hand (turning up, the new ones found by
  diffing the hand), ⊘ stamped on a skipped seat, the direction arrow spinning,
  a wild's colour rippling out of the pile, the +N growing on a stack,
  **أونو!** bursting from a seat, a catch stamped and its two cards flying, two
  hands crossing for a 7 and every hand moving on for a 0, the riffle of a
  reshuffle. The round's last card lands on the table before the result
  (`unoPlayEnding`), whose hands turn over one by one and whose points count
  up; the game ends on a podium with confetti. `motionOff()` gives the end
  state without any of it; a phone back from the lock screen replays nothing.
  Four short sounds (`unoCard`, `unoDraw`, `unoShout`, `unoCatch`) are added to
  `FX` from `JS_RoomUno.html`; with a big screen in the room only the TV plays
  the table's sounds, a phone its own moves.
- **Bidi.** A "+2", "+4" or "+85" inside an Arabic line is held left to right
  (`unoT` wraps it in LRI...PDI, and card names do the same), or it reads
  "2+".
**الدومينو in rooms** (`dominoAction` in `RoomDomino.js`, bundled after
`RoomGames.js`; the tiles in `DominoTiles.js`, shared with the page), the
owner's spec (see *The owner's specs*). 2 to 4 players, people or computer
players; everyone for themselves, or with four two sides with partners
opposite (seats 1 & 3 against 2 & 4, `shared.teams`, keys `A` and `B`).

- **The tiles** are their two numbers low first, `'0-0'` … `'6-6'`
  (`dominoSet`, `dominoParse`). The table is `shared.table = { line, root,
  spinner, up, down }`: `line` left to right, each `{ t, a, b }` with `a` the
  number facing the left end; `root` the first tile of the round; in
  أمريكاني `spinner` is the first double played (the lead included) and `up` /
  `down` its other two arms, which open once both of its sides on the line
  hold a tile (`dominoArmsOpen`). `dominoEnds` gives the open ends,
  `dominoFits` where a tile goes (an empty table takes anything, on `R`),
  `dominoPlace` the table after a move, `dominoEndsSum` the ends added up the
  way أمريكاني counts them (a double across an end both halves, a tile alone
  both halves, an arm of the spinner nothing is on yet nothing) and
  `dominoPointsOf` its points (a multiple of 5, 5 = 1). `dominoRoundResult`
  scores a round from the hands (going out, blocked, a tie, teams, rounding
  with `dominoRounded`), `dominoStarter` says who opens, `dominoGameWinner`
  who has won. `rules.mjs` pins every one of these.
- **What is hidden.** Every hand is `room._domino.hands` and reaches a phone
  only as its own `room.secrets[pid].hand`; the tiles left to draw
  (`room._domino.bone`) never leave the server, only their count
  (`shared.bone`). `shared.counts` says how many each player holds. The hands
  are published in `shared.result` when a round ends. A player's `knocked`
  numbers (the ends showing when they knocked) are public - the table saw
  them - and cleared when they draw new tiles or play one of those numbers.
- **A round.** `dominoDeal` deals seven each (the rest is the pile to draw
  from with two or three players, `shared.drawing`; set aside with four). The
  first round opens by itself: the double six, else the highest double in
  anyone's hand, else the heaviest tile (`dominoStarter`), played by the
  server as a `play` event with `forced`. Later rounds are led by the winner
  of the last one (`shared.lead`) with any tile; after a tie nobody won, so
  the first round's rule opens again. A turn is `play { tile, end, seq }`
  (the end may be left out when there is one), `draw { seq }` - refused while
  a tile fits; it draws until one that fits comes up, and the turn stays -
  or `pass { seq }`, the knock, refused while a tile fits or there is still
  something to draw. Every move raises `shared.turnSeq` and carries it, so a
  stale tap is dropped. After every move: a hand emptied ends the round
  (`out`); nothing anyone holds fitting and nothing left to draw ends it
  blocked (`قفلة`, detected at once rather than after everyone has knocked);
  otherwise the turn goes to the next seat. In أمريكاني each play is scored
  on the spot (`pts`, `sum` on its event; `shared.gained` keeps the round's).
  The round's result goes to `shared.result`, the totals to `shared.scores`
  (a player's id, or `A` / `B`), and the game ends when the round leaves a
  unit alone on top at or past the target (`gameover`, `winner`, `winners`);
  two level on top play one more round. `shared.board` is every seated
  player with their unit's score, best first, for the night's leaderboard.
- **The host's options** (`ashry…` memory: `recallOptions('dominoRoom')` on
  the host's phone): عادي or أمريكاني, teams (four only), the target (51 / 101
  / 151 / 201, or 30 / 50 / 100), the two helpers (`helpFit`, `helpPoints`,
  أمريكاني only) and the turn clock (0, 30, 60). The seats of a game of teams
  are the room's, not the phone's: `seats { teams, order | shuffle }` (host,
  lobby only) keeps `shared.lobby = { teams, order }`, so every phone sees the
  partners before the start; the host's phone sends it once (`domLobbySync`)
  when teams is on with four players and no seats are drawn for these four -
  at random, the owner's default - and two taps on the strip swap two seats.
  Play again keeps the seats.
- **Clocks, the host, leaving.** The turn clock is a server deadline
  (`dominoDeadline` / `dominoTimeout`); when it runs out the server plays for
  the player (`dominoAuto`: the first tile that fits, else it draws and plays
  what came, else it knocks) with an `auto` event. The host's `skipTurn`
  does the same for a phone that went quiet (the button shows for a phone
  that is away, or that has held the turn 40 seconds). A player who leaves
  on their own has their tiles set aside - out of the round, seen and counted
  by nobody - and the turn moves on; one player left ends the game. In teams
  a side one short can't play on, so a leave ends the game there
  (`shared.ended = 'left'`), decided by the scores so far.
- **Computer players** (`ROOM_BOT_GAMES.domino`): a bot's move is computed
  from its own `room.secrets` hand and the table - never another hand, never
  the pile. `easy` plays the first tile that fits; `hard` scores every legal
  move (`dominoBotScore`): heavy tiles and doubles first, a spread of numbers
  and ends it can follow, the next opponent's knocked numbers left open,
  nothing its partner knocked on; in أمريكاني what the move scores now, less
  what the unseen tiles would let the next player score.

**الدومينو on the phones and the TV** (`JS_RoomDomino.html`, section 21 of
`Style.html`).

- **The look the owner picked** (21 Sep 2026, option أ "عاجي" from a design
  sheet): ivory tiles (`--dom-ivory-*`, the same in both themes) with a
  thickness under them, black pips on a 3 × 3 grid per half (turned with the
  tile), a thin dark bar and a brass pin; the back ivory with an engraved
  frame. One builder, `domTileHtml` / `domBackHtml`, sized by `--u` (the short
  side; the default is on `:where(.dt)` so every context that sizes a tile
  wins). The felt carries the screen's accent.
- **The table is a physical layout** (`dir="ltr"` in every language), laid out
  by `dominoLayout` in grid units: a tile 2 × 1, a double across (1 × 2),
  arms running straight from the root until the next tile would pass the
  edge, then a corner and back the other way a row further out - the right
  arm snaking down, the left one up. In أمريكاني the spinner is the middle of
  a cross and each arm has its quarter (the line's arms keep out of the
  column above and below the spinner, its up and down arms out of the row
  beside it), the up arm snaking right and the down arm left. Every placement
  is checked against what is already down with a unit of look-ahead, so a run
  stops where its corner still fits; a corner tile and the one after it lie
  along the line even when they are doubles. `dominoFitLayout` tries widths
  and keeps the one that shows the tiles biggest in the box (keeping last
  move's width while it is nearly as good, so rows don't jump), and
  `domLayoutTable` scales it in, marks the open ends, and slides any tile
  whose place changed (a spinner re-centres the cross). It runs again on
  every resize. `rules.mjs` draws hundreds of full tables at phone, sideways
  and TV sizes and checks that no two tiles overlap.
- **Playing.** A tap on a tile in your hand plays it; when it goes on ends
  that come to different things (`domDistinctEnds`: the ends left and the
  points), those ends glow on the table and in the bar, and a second tap
  says which. A tile that doesn't fit is only refused (a shake and a line),
  and draw and knock are refused on the phone while something fits, without
  saying what. The host's helpers light up what fits (`is-fit`, the rest
  `is-dim`) and show a move's points on each end and on each tile. The seats
  are round the table as you sit (the one before you on the left, the one
  after you on the right - the turn goes right, as at an Egyptian table);
  each shows its tiles face down with a count.
- **Every move has its motion** (`domPlayEvents`, one choreography per event,
  Web Animations of transform and opacity on ghosts laid over the page, the
  landing tile hidden until then - `dom-hold` - and the table waiting for it,
  `domFx.busyUntil`): the deal flies seven backs to every seat and your own
  tiles into your hand; a play flies the tile from your hand (or face down
  from the player's seat, turning face up on the way) to its place, turning
  a quarter when it lies down, with a band for the opening double six;
  drawn tiles fly from the pile; a pass jolts the seat with 👊 باص and the
  knock sound; a scored move floats its +points up from the tile and pulses
  the ends' sum; the spinner rings as it becomes one and keeps an outline;
  going out and قفلة put a band across the table. A round's end shows the
  final table, then turns the hands over one by one counting their pips up,
  then says who took what and why (the pips, and in أمريكاني their rounding),
  then counts the totals up (`domRunReveal`). The game ends on the podium, or
  on the two sides with the winner crowned, and confetti after it. Nothing
  replays after a reload or the lock screen (`domWokeRecently`). The sounds
  are three short ones added to `FX` from this file (`domClack`, `domKnock`,
  `domScore`), not on the soundboard.
- **Fitting: while a round is played the table gets the screen** (the owner,
  21 Sep 2026, for every size): who is at the table is one compact strip
  (`dom-top`: the round, the mode, the clock and every score as chips, then
  the seats, each a short line of name, tiles face down and a count), the
  table takes most of what is left, and your hand with what to do is under
  it (`dom-play`). Upright on a 375 × 812 phone all of it fits with nothing
  scrolled; on your turn (and when a tile is picked) the page keeps the hand
  and the bar in sight (`domHandInView`). On a phone's side the table is one
  column, full height, and the strip, the seats (one line each) and your hand
  the other. On a laptop the table runs the whole width under the strip,
  with your hand and the bar in one row beneath it, and the tiles grow with
  the box (a phone's stop at 34px a side; here up to 90). The TV is the table
  under a strip of badges, the seats in turn order (the one up lit) and
  whose turn it is, with the TV's own score strip at the foot. Measured with
  the round under way: the table is 97% × 72% of the TV at 1280 × 720 and
  1920 × 1080, 86-89% × 56-66% of a laptop's window, 86% × 38% of an
  upright phone (the hand and the bar take the rest). The end of a round
  and of the game take the screen instead: the table beside the reveal and
  the totals on a TV and a laptop (the game's end on a TV shows the podium
  or the sides, the line and the totals, and leaves the last hands to the
  phones so it fits one screen).

**The Buzzer (الجرس)** has no content at all: the host asks their own questions
out loud and every phone is a buzzer. `buzzerAction` in `RoomGames.js` keeps
`shared.buzzes` in the order the presses reached the server, which is the one
thing a phone cannot be trusted with. The host's verdict (`correct` scores the
first in line and clears the queue; `wrong` drops them so the next in line
answers the same question) and `lock` / `arm` (buzzers off while the question
is read) are host-only. A screen never buzzes: `buzz` from a device that is not
in `room.players` is ignored. Everything is in `shared` (`board` is the sorted
scoreboard the TV strip reads), and `TV_GAMES.buzzer` draws the first buzzer
big, the queue, the scores and the host's buttons when the screen is the host.

**أتوبيس كومبليت on separate phones** (`stopAction`). The same letter goes to
every phone, each player types an answer per category, and the first to press
وقف (`submit` with `stop: true`) moves the round to `collecting`: the other
phones send whatever they have typed the moment they see that phase - before
their frame is redrawn, because the inputs go with it (`ROOM_GAMES.stop.render`
does this first) - and the server scores once all are in or after
`STOP_COLLECT_MS`. Answers wait in `room._answers`, never projected, so a
phone that finished early cannot show its sheet. Scoring is by comparison
(`foldStopAnswer`: case, diacritics, the tatweel, hamza forms, ة/ه, ى/ي and
the definite article are folded before comparing, and an answer must start
with the letter; in a round on ا itself a bare "ال…" is kept, because ألمانيا
typed without its hamza is indistinguishable from an article, and only
"ال" + a hamza letter is stripped there): 10 for an
answer nobody else had, 5 for a shared one, 0 for a blank or a wrong initial.
The table is `shared.results`; the host taps a cell to cycle its points
(`adjust`, marked `manual`), and `nextRound` banks `roundTotals` into the
totals as corrected. A timer, when the host set one, is a server clock like
the trivia one (`roomDeadline` / `roomTimeout` move `writing` to `collecting`
and then score). The host's categories, timer and rounds are remembered on
their phone (`ashryStopRoomOpts`) and sent with `start`.

**وقف needs a full sheet, and every word meets a dictionary** (`StopWords.js`,
shared by the page and the server). `stopAnswerFits` is the rule for a box:
folded as above, at least two letters, starting with the letter. The phone
paints each box as it fills (green, or red for a word on another letter),
keeps وقف faded with "باقي N خانات" under it until all are green, and the
server refuses `submit` with `stop: true` for a sheet that isn't - the clock
running out and someone else's وقف still send whatever is there. Scoring
then asks `stopWordKnown(lang, cat, text)`: the category's dictionary is
`STOP_WORDS` (names, plants and produce, colours, and additions for the rest)
together with the lists other games keep (`MONKEY_LISTS` countries, cities
and English animals and foods; `SPY_WORDS` Arabic animals, foods, things,
instruments, transport, jobs and brands), compared on letters only, with or
without the article, forgiving one wrong letter in a word of five letters or
more and an English plural. Each result carries `word`: `known` scores as
before; `shared` (not in the dictionary, but another player wrote it too - a
made-up word almost never is) scores 5; `unknown` scores 0 and shows ❓ on an
amber cell with a line telling the host to tap it if the word is right (the
tap is the ordinary `adjust`). `npm run check` fails on a word listed twice
in one `STOP_WORDS` list and prints each category's size and the letters it
has no words for. A category with holes is not a bug - no country starts
with ث - but a real word missing from a list costs a player points until the
host taps it, so add to the lists when a table keeps tapping the same word.

**«متسامح»** (`settings.lenient` / `shared.lenient`, the host's lobby switch,
off by default, kept in `ashryStopRoomOpts`): an `unknown` word scores 10
instead of 0, still marked ❓, and the host can tap it down.

**The Stop word log** is how the dictionary grows from what tables accept.
When a host's `adjust` raises an `unknown` or `shared` cell from 0, the
rules push `{ lang, cat, word }` onto `room._stopTaps` (never projected);
`room.js` takes it off the room and hands it to the `WordLog` Durable Object
(`src/words.js`, one instance "stop", a count per `lang|cat|word`, at most
5,000). Nobody's name is kept. `GET /stop-words` answers only with
`Authorization: Bearer <ADMIN_KEY>` (a Worker secret, set with
`wrangler secret put ADMIN_KEY`; the key is kept outside the repo, in
`%USERPROFILE%.ashry-admin-key`), and `cd tools && ASHRY_ADMIN_KEY=… npm run
stop-words` prints them by category, most-tapped first, saying which are
already in `StopWords.js`. Words that come up often go into the lists by hand.

**Trivia, two modes.** The room version deals from `TRIVIA_QUESTIONS` on the
server. The host picks 5, 10, 15 or 20 questions (`TRIVIA_COUNTS`). A right
answer is `TRIVIA_POINTS` (10) plus a speed bonus: +5 for the first right
answer, +4 for the second, down to nothing from the sixth. The order is the
time the server received each answer, ties going to whoever arrived first
(`seq`), and `shared.order` publishes it so every phone can show its place.

The team board (*دوري المعرفة*) is single-screen: `JS_TriviaBoard.html`, with its
own bank in `JS_TriviaBoardBank.html` — ten categories, sixteen or more questions
at each of 100–500, the higher the harder. Only facts that don't change (no
records, current title holders or "the latest"). The validator only catches a
question written twice word for word, so before adding, compare new answers with
the existing ones across *all* categories: most repeats are the same fact asked
the other way round ("what is tahini made from?" against "which sauce is made
from sesame? — tahini"). `npm run export:trivia -- <path>` in `tools/`
writes the same bank as `trivia_bank.js` for the standalone trivia page
(`trivia.html`).

A board question can run on a clock: the setup screen's switch and 15–60 seconds
(`TB_TIMER_CHOICES`, on at 30 by default, remembered with the team names in
`ashryTriviaTeams`). Tapping the clock pauses it; when it runs out the answer
shows by itself, and the host still gives the points. The open card lives in
`appState.triviaBoard.open` with a deadline (`endsAt`, or `left` while paused),
so a reload reopens it with the time it really had left.

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
The Wavelength dial accepts anyone except the psychic.

The view is `room-tv`: full screen, with `body.is-tv-view` and sizes from `vmin`
in the BIG SCREEN block at the end of `Style.html`. Phone components reused there
sit in `.tv-scale`, which zooms them in steps. Phone and TV frames share element
ids (the canvas, the timers), so drawing one kind clears the other. A new room
game needs its `TV_GAMES` entry as well.

**Browsers the app runs in.** The page is written in ES2017 (`const`,
`async`, destructuring, spread - nothing newer, measured with esbuild on
17 Sep 2026) and its layout on CSS custom properties, grid, `inset`, logical
insets (`inset-inline-start`), flex `gap`, `:is()` and `aspect-ratio`; the
newer things it uses (`:has()`, container queries, `dvh`, `color-mix()`,
`text-wrap`) only lose polish when missing. That floor is Chromium 88 /
iOS 14.5 / Firefox 78 - every phone since 2021. The browsers built into TVs
run years behind: a Samsung sold in 2022 (Tizen 6.5) has Chromium 85, a 2024
one (Tizen 8) 108; LG's webOS 22 has 87. Older sets lack grid or even
custom properties, which is the white page with four stacked buttons the
owner saw. Nothing cheap fixes that (the design system *is* custom
properties), so the page carries a **gate**: an ES5 script in
`Controller.html`, right after the intro, tests `CSS.supports` for the
features above, compiles a line of ES2017 with `new Function`, and checks a
few runtime calls (`padStart`, `flatMap`, `Object.values`, `WebSocket`,
`fetch`). Where any fails it sets `window.ASHRY_UNSUPPORTED` (which
`initializeApp` obeys), removes the intro and draws a plain note with inline
styles - the mark, why, the three ways onto a big screen (a laptop on HDMI,
a phone mirrored with AirPlay or Smart View, a streaming stick's browser),
the link and its QR (the `qrcode` library is ES5 too) - in the saved
language, or the device's. Keep that script ES5 and free of CSS variables;
it is the one thing on the page that must run where nothing else does. The
app's own path in a TV browser is still *Big screens* above: the browser
shows the app in a tab with its bar, and the ⛶ in the TV bar
(`toggleTvFullscreen`) takes the whole screen. `loadFromLocal` reads storage
inside a try as well: a browser that blocks it used to stop the app before
its first screen.

**Adding a game to the room layer**

1. Add a branch to `applyRoomAction` in `RoomGames.js`. Put anything private in
   `room.secrets[playerId]`, anything shared in `room.shared`.
2. Register `ROOM_GAMES.<id>` on the client with `lobbyOptions(state)`,
   `startPayload()` and `render(state)`.
3. Add a `view-room-<id>` container and a `VIEW_META` entry.
4. Add it to `ROOM_HUB_GAMES` in `JS_Room.html` (icon, i18n key, accent, and the
   minimum player count that greys out its hub tile) and to `ROOM_GAME_IDS` in
   `RoomGames.js`.

5. If it has a clock, add it to `roomDeadline` / `roomTimeout`. If it deals from
   a list, deal through `nextPrompts` from an action named `start`, `nextRound`
   or `playAgain` (`DEAL_ACTIONS` in `room.js`), so the shared prompt memory is
   loaded for it.
6. Add a round of it to `rooms-worker/test/play-all.mjs`, a driver (a whole
   game) and its secrets to `rooms-worker/test/leaks.mjs` - the leak check fails
   on a room game it can't play - then `npm run build:site` in `tools/` and
   `npm run deploy` in `rooms-worker/` — in that order, because the deploy
   uploads `docs/`.
7. Give it a `GAME_CATALOG` entry (see *The catalog and the home screen*) with
   `modes: ['room', 'tv']`, or it is not on the menu, and a `TV_GAMES` entry.
8. Give it a case in `roomPlayerLeft` (what happens when someone leaves
   mid-round), guard its per-round host actions with `staleTap` on what the
   phone saw, register its phone clocks with `onRoomClocksReset`, and give the
   host a way forward (on the phone and the TV) wherever the round waits on
   one phone.

Ask for the player's name with `promptForName()`, which opens the name sheet.
Never use `window.prompt` — it is blocked in some embedded browsers. The sheet
always opens, filled in with the name last used (`roomName`, localStorage
`ashryName`), so keeping it is one tap and a new name replaces the old one; the
join screen and Settings → your name read and write the same value. On tablets
and desktop every sheet is a centred dialog (the `min-width: 640px` block in
*Sheets, modals, toasts*); phones keep the bottom sheet.

**A result you can send as a picture** (`JS_ShareCard.html`). A result told as
text is a wall of characters in WhatsApp. `shareResultCard({ title, icon, rows,
footer, text, board })` draws it on a 1080x1920 canvas instead - the app's violet
ground, the game's icon and name, up to ten rows of name and score, a line of
the game's own, and the mark and the link at the foot - and sends it. Three
ways out (`board`, شطرنج's final position, is optional: with it the position
is drawn big by `chDrawBoardCanvas` and the rows go under it, in
`drawShareBoardCard`; without it the card is exactly as before), in order:
the phone's share sheet with the picture attached
(`navigator.canShare({ files })`), a download where that isn't offered, and the
plain text through `shareOrCopy` where neither works, which is exactly what the
app did before. **Nothing is drawn until a share button is pressed**: the
canvas is made, used and thrown away inside the call, so a result screen costs
nothing until somebody wants to send it. The colours are read off the mark in
the page (`shareCardColours`, the gradient stops of `#ashry-mark`) rather than
written again, so the card follows whatever colourway the app ships with; the
mark itself is that `<symbol>` wrapped in a standalone SVG as a `data:` URL,
which a canvas can draw and which leaves it untainted. Arabic is drawn with
`ctx.direction = 'rtl'`. The button is on the solo result sheet, the تحدي
اليوم hub and the six room games that end on a podium with a real board
(`roomShareBtnHtml`, never on a big screen and never when nobody scored), each
with the plain text beside it on a ghost button.

**Getting people in.** The lobby's share button (`roomShareLink`) sends the join
link through the phone's share sheet, or copies it where there is none, for
friends who aren't in the room to scan the QR. `shareOrCopy` is that same
machinery on its own, and `shareAppLink` sends the app's own link (Settings →
شارك التطبيق, and a ghost button under the three ways in on the مع بعض tab -
which is where someone is already thinking about getting people in). The join field takes a pasted
link as well as a code: `extractRoomCode` pulls the code out of either.

`?room=CODE` is read from the page's own address by the build
(`window.SERVER_DATA.room`), then removed from the address bar so a reload
doesn't reopen the join screen.

**Testing it locally.** Run the rooms server with `npm run dev` in
`rooms-worker/` and play in two tabs of the preview, or let the robots do it:
`npm test` in `rooms-worker/`.

### Team mode for بدون كلام and أوصف لي (the relay)

Both were one timed round for one player. `JS_TeamRelay.html` wraps that
round for two teams: `relayStart` names the teams and the turns each, a
handover card (`relayHandoverHtml`) says whose turn it is and starts the
round the game always ran (`charadesRunTurn`, `describeRunTurn`),
`relayTurnDone` banks the words guessed as that team's points, and the
summary card shows the turn's points and the next handover, or the final
board once every turn is played. The relay lives in the game's own slice
of `appState` (`appState.charades.relay`), the options (`teamOpts`: mode,
names, turns) too, painted back onto the setup screen by
`paintSetupOptions`. ثلاث جولات already split into teams on its own.

### Who asks whom (the ask director)

الجاسوس and من أنا؟ both end in a free discussion against a clock, and the
same two people always end up asking everything. The setup screens of both
carry a `مين يسأل مين؟` switch (`JS_Director.html`): off is the old free
discussion; `order` walks the seating order and moves the target one seat
each lap; `random` always picks the player who has asked least and the one
who has been asked least. The rotation lives in the game's own slice of
`appState` (`appState.imposter.dir`, `appState.whoami.dir`), so a reload keeps
the count, and `paintDirector` draws the "X يسأل Y" card into the play screen
(`#imposter-director`, `#whoami-director`) with a Next button. The mode is
saved per game (`appState.imposter.config.director`, `appState.whoami.director`)
and painted back onto the switch by `paintSetupOptions`.

### Scores and take-backs on one phone

The pass-the-phone games keep score where the table can tap, and every
scored press can be taken back (the audit of 17 Sep 2026):

- القنبلة: with names picked on the setup, the boom asks whose hands it was
  in (tap the same name to take it back), the strikes board is kept across
  rounds, and "end game" is a podium of who survived most.
- فوازير إيموجي and كمّل المثل: with names picked, "مين عرفها؟" chips follow
  each reveal (`quizPointsReset` / `quizPointsToggle` in `JS_Emoji.html`,
  shared by both), with a live board and a podium at the end.
- خمس ثواني ends on `renderPodium`, and "one more round" keeps the scores.
- الحرباء and الموقع السري: "play again" deals to the same table and keeps a
  running score by the room rules.
- كلمة واحدة: 5, 10 or 13 rounds (`#justone-rounds`), an undo of the verdict,
  and a final score; its old confirm popup and timer are gone, which is what
  used to leave it stuck.
- ربع قرد: the board is saved before every move that can cost a quarter, so
  the winner popup offers "عكس الحكم" and "back to the board" - the verdict
  that decides the game can still be overruled. خلصت الكلمة has a ↶ for ✅
  and ⏭; بدون كلام and أوصف لي clear their undo stack at every turn (team B
  could take back team A's card and score it).
- A relay match or a دوري المعرفة board left unfinished shows "continue" on
  its setup, and a new one asks before replacing it (`relayBegin`,
  `relayInProgress`; `tb_unfinished`).
- من أنا؟ never shows a player their own character: each step says "خبّي
  الموبايل عن X" and the others look. With shuffle on, everyone writes one in
  secret and a derangement deals them; off, the table types each player's
  while they look away. The count follows the players picked.
- Category lists are rebuilt for `contentLang()` in their setup painters
  (`paintWhoAmISetup`, `paintCharadesSetup`), keeping the pick by its emoji
  across languages - a stale list had dealt "Error" to every player.

**Content checks load some game files alone.** `tools/validate-content.js`
runs `JS_Charades.html`, `JS_DescribeIt.html`, `JS_NewGames.html`,
`JS_Stop.html` and `JS_TimesUp.html` by themselves to read their word lists,
without JS_Core: a top-level `onLeaveScreen` or `onLanguageChange` call in
those files has to be guarded with `typeof`.

### Player names live on the phone

`allPlayers` is a localStorage list (`PLAYER_LIBRARY_KEY` in `JS_Core.html`),
not a sheet column. It used to be the `اللاعبين` tab — one list for the whole
app, which meant every device that opened the web app saw every name anyone had
ever typed. Play once with family and the next friend to open it is looking at
your relatives. It also cost a spreadsheet write per new name before the `+`
button came back.

The app no longer reads or writes that sheet; nothing depends on it.

**Names are matched, not compared.** `samePlayer(a, b)` folds case, spaces,
diacritics and the interchangeable Arabic letters (أ إ آ → ا, ة → ه, ى → ي), so
typing `احمد` when `أحمد` is saved reuses the person you have rather than making
a twin. `addToPlayerLibrary` returns the *stored* spelling for that reason —
use its return value, not what was typed.

**Every setup screen renders the same picker.** `renderActiveChips(containerId)`
draws the library as chips you tap to put someone in the round; the seven
screens with a `*-player-list` container get it for free, and it tints itself
with whatever `data-accent` that screen carries. It renders the library *plus*
any active name that is not in it, so a saved group whose members were deleted
from the library still shows the people it selected.

A saved group is still just a named list of names in `ashry_saved_groups`,
per device. Deleting a name from the library does not touch the groups.

**The picker is sized against a long library, not a short one.** Forty saved
names wrap cleanly, but they are 850px of chips, which pushes the Start button
— the control pressed every single time — off the bottom of the screen. So the
chips scroll inside a four-row box (`.picker__chips`, 216px, measured: at that
height Start still lands on the first screen for six of the seven setup
screens), and whoever is in the round is floated to the top so you can see who
is playing without scrolling. That re-sort happens on arrival and when you add
someone, **never on a toggle** — chips that move under your finger are worse
than chips in a stale order. `pickerOrder` is what holds them still.

### The static site (docs/)

The app ships as a static site: `npm run build:site` (tools/build-site.mjs)
writes `docs/`, and GitHub Pages publishes it. It is the top-level page, so the
home-screen icon, the manifest, `?room=` links and the offline service worker
(`docs/sw.js`) all work. **Opening the app answers from the copy on the phone**
(the owner's decision of 23 Sep 2026, after GitHub Pages sent the 1.6 MB page at
20-60 KB/s and the app sat on its logo for most of a minute): the worker of a
build saved that build's page when it was installed, and every open is that
page at once (73 ms, 0 bytes, measured). The network is asked only by a phone
with no copy yet. A new build is a new `sw.js`, which the browser looks for as
the app opens, and the page asks again when it comes back to the screen (at
most every 10 minutes, `reg.update()`); installing it downloads the page once,
past the browser's HTTP cache (`cache: 'reload'`: GitHub's `max-age=600` could
hand back the build before), and keeps it under `./` and `./index.html` both -
it used to download the whole page twice. Only good answers are cached,
and the pinned CDN files are cache first (an opaque answer from them is kept
too: the fonts' stylesheet is fetched without CORS, and refusing it left the
app with no fonts offline). **Everything outside rooms works offline after
one visit**: the fonts, confetti and the QR load before the worker is in
charge on a first visit, so once a worker controls the page it asks for them
again through it (`warm` in `registerServiceWorker`, five seconds in, almost
always answered from the browser's own cache). Checked on 22 Sep 2026 with the
server switched off: the home, the daily hub, Sudoku, Wordle, القنبلة and the
timers, in the app's own fonts. The build also writes the rooms server's address
(`roomsUrl` in `tools/site.config.json`) into the page as `window.ROOMS_URL`,
with a `preconnect` so creating a room doesn't wait for the connection.

So a change can need two releases. Client files only: rebuild `docs/` and push.
Anything the rooms server runs (`RoomGames.js`, the lists in `FILES` in
`rooms-worker/build.mjs`, `rooms-worker/src/`): also `npm run deploy`
in `rooms-worker/`, or rooms keep the old rules. `docs/README.md` has the steps.

**The app's second address: https://play.3ashry.workers.dev** (the
owner's decision of 23 Sep 2026, after GitHub Pages sent the page at 20-80 KB/s).
`site-worker/wrangler.toml` is a Cloudflare Worker with no code, only static
files - `docs/` - so it is free and unlimited (requests to static files cost
nothing), stores nothing, and publishing it restarts no room. Every release
publishes it (`npm run deploy:site` in `tools/`, CLAUDE.md step 7) and
`check:live` fails unless it serves the same build (`backupUrl` in
`tools/site.config.json`). GitHub stays the main link; this is the fast one to
share. A phone keeps separate saved data per address (names, settings, bests),
and a room link shared from a phone uses the address that phone is on - both
reach the same rooms. (A first try with `wrangler pages project create`, run
inside `rooms-worker/`, deployed a whole second rooms server named
`ashry-gaming` instead of a Pages project - wrangler's Pages is now Workers and
it took that folder's config. The owner deleted it the same evening. Run
wrangler for the second address from `site-worker/` only.)

The rooms server also serves a copy of `docs/` at its own address, uploaded on
every deploy — a third address for the app if `github.io` is ever blocked.

**New builds reach an open app.** When a new build's worker takes over a page
(`controllerchange`) that is older than it (the build writes its id into the
page, `window.BUILD_ID`, the same stamp as the cache name in `sw.js`; the page
asks `sw.js` for its stamp and stays quiet when they match), the new build is
already on the phone, so switching is a fraction of a second. **It switches by
itself when nothing is lost** (`appUpdateQuiet`, `appUpdateSafeView` in
`JS_Core.html`): under the intro; on the home, مع بعض or الأدوات with no room
open, no popup, no field being typed in and no tap for 4 seconds; or when the
app goes to the background on one of those or a setup screen. Anywhere else -
a game, a room - a tappable toast says a new version is ready and the page
waits for one of those moments; a game is never reloaded under a player (a
timed round on one phone can't come back from a reload). So the first open
after a release can show the build before for a moment. Settings → تحديث
البيانات (`updateApp`) asks for `sw.js` first and opens the new build as soon
as it has downloaded; with nothing new it is a plain reload. Checked on 23 Sep
2026 against the built site with three builds in a row: idle on the home it
switched by itself, in a Sudoku game it showed the toast and stayed, back on
the home it switched, the game kept. A phone opening the
app for the first time starts in its own light or dark theme, and
`<meta name="theme-color">` follows the page's background.

**History: rooms used to run on Apps Script.** The page relayed calls through a
hidden iframe of the `/exec?bridge=1` page (`Bridge.html`): Apps Script has no
WebSockets, and a `fetch` to `doPost` went through a 302 that, under load,
returned the whole app page instead of the answer. Moves took 2–4 seconds to
reach the other phones. That version is frozen in the `G` folder (git tag
`apps-script-v177`).

The spy words used to be read from the `كلمات الجاسوس` sheet on every page load.
They are `SpyWords.js` now - shared by the page and the rooms server - and the
locked "+18" category was removed at the owner's request. A 🔒 category would
ship inside the public site anyway, so a lock only hides words from the menu; it
cannot keep them secret.

### The brand mark and the icons

The mark is the name twice on a deep violet: "Ashry" large in Poppins Black
with an amber full stop, and عشري smaller underneath in Reem Kufi with its
five dots in the same amber. `tools/make-icons.mjs` is the one source: it
writes `Logo.html` (an `<svg><symbol id="ashry-mark">` the page includes
once) and every PNG in `docs/` (`icon-180` full-bleed for iOS, `icon-192` /
`icon-512` rounded, `icon-maskable-512` with the artwork inside the safe
80%, `favicon-64`). Anywhere in the app draws it with
`<svg class="mark"><use href="#ashry-mark"/></svg>`: the loader, the header
on the home screen (`.shell__title--brand`) and the home hero. The words are
outlines in `tools/assets/wordmark.json`, written by
`tools/shape-wordmark.py` (fontTools + HarfBuzz, so the Arabic joins
properly; the five dots are whatever the dotless spelling عسرى lacks) from
the two fonts as downloaded from Google Fonts - the font files are not kept
in the repo - so the mark needs no font and renders identically before Cairo
loads, on a home screen and in the script. `npm run build:icons` in `tools/`
(sharp rasterises the SVG). Do not edit `Logo.html` or the PNGs by hand.

The owner chose this design (number 28) from a sheet of 28 wordmarks on
15 Sep 2026; the ع monogram it replaced is in the history before that commit.

**The icon has a version** (`iconVersion` in `tools/site.config.json`). The
build puts it on every icon address (`icon-192.png?v=2`, in the head links and
in `docs/manifest.webmanifest`, which it rewrites) and into the page as
`window.ICON_VERSION`. A changed address is what makes Android refresh an
installed icon by itself. iOS fetches the apple-touch-icon once, when the app
is added, and no page can add itself again, so `checkIconBanner` in
`JS_Utils.html` notices an iPhone copy running standalone whose marker
(`ashryInstalledIcon`) is older than the build's icon and shows one banner
with the steps: remove, "open in Safari" (a `_blank` link to
`?install=1`, which opens the add-to-home-screen sheet there), add again. A
copy with saved names but no marker was added before the marker existed, so
it counts as the old icon; a fresh install counts as the current one. "Later"
snoozes a week; "Done" or "keep it" writes the current version. Bump
`iconVersion` whenever the mark changes.

The mark comes in six colourways (`VARIANTS` in the script: deep, violet,
midnight, paper, ocean, sunset); `iconVariant` in `tools/site.config.json` is
the one the app ships with (deep), and `node make-icons.mjs --preview <dir>`
renders them all side by side to choose from. The words, the full stop and
the dots are the same in every one - only the colours change.

### Putting it on the home screen

A phone that opens the app in its browser is asked, once a visit, to add it
to the home screen (`#install-help-modal`, `maybeAskInstall` in
`JS_Utils.html`). `installTarget()` reads the user agent: an iPhone or an
Android phone (Android with "Mobile" - tablets and TVs don't say it; iPads
never count), and which browser, because the steps differ: Safari (Share,
then Add to Home Screen, with ⋯ first where the bar is folded), Chrome and
the others on iPhone (their Share button), Chrome, Samsung Internet and
Firefox on Android, and the browser inside Instagram, Facebook, TikTok or
the Google app, which cannot add anything, so its steps say to open the link
in Safari or Chrome first. The steps are translation keys (`inst_*`) with
`{share}`, `{add}`, `{more}`, `{dots}` and `{menu}` drawn as small key
glyphs; English menu names inside the Arabic steps are wrapped in `<bdi>` or
their brackets flip. On Android, when Chrome fires `beforeinstallprompt`,
the phone's own bar is suppressed and the sheet shows one "install" button
instead of steps (`installNow`); `appinstalled` closes it.

When: never in the home-screen copy, never over a game, a room or another
popup - it waits (`installAskSoon`, from `setView` on the home, مع بعض and
الأدوات and from the end of the intro) - **never before this phone has
played something** (`ashryPlayedOnce`, set when a game's `play-*` screen or
a room game's screen is left; opening a setup doesn't count; the owner
agreed, 22 Sep 2026: a first visit had the sheet straight after the intro,
before a single game, which is when it is easiest to dismiss), and at most
once a visit: a visit
is a page load at least `INSTALL_VISIT_GAP_MS` (30 minutes) after the last
ask (`ashryInstallAskedAt`), so a reload mid-evening doesn't ask again and
the next evening does. Dismissing it is just closing it. "ضفته خلاص"
(`ashryInstallHaveIt`) stops it in that browser for good, since a browser
cannot see the home-screen copy on its own. Settings → تثبيت التطبيق opens
the same sheet on any device, with computer steps off a phone.

**A link never opens the home-screen copy on an iPhone.** iOS gives a web app
on the home screen no way to claim its links: a room link from WhatsApp opens
Safari, and Safari cannot tell that the home-screen copy exists (their
storage is separate, which is also why names saved in one aren't in the
other). Nothing on the page can change that. On Android, an app installed
through Chrome usually does receive its own links.

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

**تحدي اليوم** (`JS_Daily.html`, the `setup-daily` screen, first card of the
`brain` group and a strip on the home above the recent games): every game's
puzzle of the day in one list (`DAILY_GAMES`: the order, how to start its
daily, and how its `soloMarkDaily` result reads in one line), the streak
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

### Card game score keepers (حاسبة الورق)

`JS_CardScore.html` is one engine and `JS_CardRules.html` five rule sets
(`CS_GAMES`: estimation, tarneeb, trix, konkan, basra), each a catalog entry
with its own `setup-cs-<id>` / `play-cs-<id>` screens. They are tools, not
games (the owner, 17 Sep 2026): `group: 'tools', kind: 'score'`, listed
under حاسبات النقط on the الأدوات tab (`renderTools` splits `kind: 'score'`
into its own section), and their setup screens' `up` is `tools`. The domino
score keeper was one of them until domino became a game in its own right
(21 Sep 2026): it is the "على الطاولة" side of the domino setup screen now
(`setup-domino`, `up: 'menu'`, beside "نلعب في التطبيق", which opens a room),
exactly as it was (`JS_Domino.html`), the way سكرو keeps its calculator; the
tools tab keeps a shortcut to it (`domino-calc`, `openTableCalc('domino')`,
which turns the setup to that side), next to one for سكرو's. The home's ورق
وطاولة section holds سكرو, أونو and الدومينو.
The deck is real; the phone keeps the score. A rule set says who sits
(`seats`, from the player picker in seating order; teams are 1 & 3 against
2 & 4, `csTeams`), what a round asks for (`entryHtml`, built from the
engine's pieces: `csStepperHtml` - kept left-to-right in Arabic -,
`csPickHtml` one-of chips, `csToggleHtml` pills), reads it back (`read`),
refuses what the deck can't produce (`check`: 13 tricks, 8 aces and jacks,
four queens taken, bids that can't add up to 13), turns it into points per
seat (`score`) and says when the game is over (`ended`, and `winners` when a
team wins rather than a total). Options are the house rules, shown on the
setup screen with the most common first. The engine draws the totals (the
leader crowned; Konkan's `low` crowns the lowest), the round card, and the
history with **take back the last round**: every round is saved with what was
on the card (`csDraftOf`), so taking it back puts exactly that back to fix.
Totals count up from what each row showed before the round (a team row sums
two seats). Upright it is one column; sideways and on wide screens the totals
and history sit beside the round card (`.cs-layout`). All of it is restored
by a reload through `soloRegister`.

What a real table needed, added after the audit of 17 Sep 2026:

- **Seating is what you see.** A numbered strip under the chips
  (`csPaintSeating`, `csSeatTap`) is `activePlayers` in seat order, with team
  colours and "Team 1: A & C"; tapping two names swaps them. The chips alone
  showed library order while the game dealt tap order, so teams came out
  other than the screen suggested. The round card says who deals (🃏) where
  the rules have a dealer.
- **Rules lock once a round is saved** (`csLive`): shown as badges with a
  "change the rules (new game)" button that asks first. Switching Trix from
  Classic to Complex mid-game had silently lost contracts. Start asks before
  replacing a game in progress, and a finished game stays reachable ("see
  the last game") with its take-back.
- **Saving is the sticky action**, with a live preview (`csProject`, a copy
  of the state): each row's new total, 🏆 on a winner, red for anyone going
  out, "this round ends the game" - so a typo that ends a game is seen first.
  Quick fills (`quick` on a rule set) offer "N left, to whom?" and "made the
  call exactly".
- The five games share element ids, so painting one empties the others'
  stages. Konkan's "out over 101" is for players on their own only (in teams
  only partners could be left), and one colour and one suit are exclusive.
  Tarneeb 41 refuses made bids adding up to more than 13. A failed bid of
  13 scores 0, and when both teams qualify in the same round team 1 wins
  (it is checked first): the owner closed both questions on 23 Sep 2026,
  as built.
- **The bracket** takes 3-16 players from the player picker, with byes placed
  as in a seeded draw, a take-back of the last result, and the champion on a
  podium. **Domino** keeps a rounds table whose take-back removes exactly the
  points moved. `showScoreWinner` (JS_Screw.html) rebuilds the shared win
  popup's contents each time and never rewrites its buttons.

**سكرو on the table** (`JS_Screw.html`, the `setup-screw` / `play-screw`
screens, `.mode-device-panel` beside the room game's `.mode-online-panel`) is
the same scoring for a game with real cards. It keeps the hand totals as typed
(`players[i].scores[r]`, 0 for a player who ran out of cards) and the round's
picks (`meta[r] = { v: 3, caller, finisher, accused, holder }`), and works
every round out again through `skScoreRound`, so fixing a round rescores it:

1. The finisher's hand is 0.
2. Hands are added per team with صاحب صاحبه (two sides alternating in the
   order of names, 4, 6 or 8 players, like the rooms).
3. Round scores, decided on the plain totals: the finisher's unit scores 0 and
   a caller outside it is doubled; otherwise a caller lower than or equal to
   every other unit scores 0 and the others keep their totals; a beaten caller
   is doubled whatever the sign and the lowest of the others score 0; with no
   caller the lowest score 0. In teams only the caller's own hand is doubled
   and added to the partners'.
4. With الحرامي, the table's accusation: caught, the holder's unit takes +25;
   not caught, it takes the lowest round score and every unit that had it
   takes +25, nothing if it already had it.

Older rounds keep scoring by the rules they were saved under: `v: 2` doubled a
caller's whole team, and a round with no `v` used the first rules (the
caller's guess, the hands swapped on a wrong one, a tie doubled). A fixed or
taken-back round is saved under the current rules, the old guess standing for
the accusation. A half-typed round (`drafts[r]`) survives a reload, "رجّع آخر
جولة" puts a round back on the card, and the win popup is a lowest-first
podium drawn with `renderPodium`'s classes (`skPodiumHtml`). A game saved
before any of this (no `scoring: 'skrew'`) keeps its rounds as typed
(`meta[r].legacy`). The options (`prefs`) apply at Start; "لعبة جديدة" keeps
the finished game's. `JS_Screw.html` loads before `JS_Solo.html`, so it
paints through `onLeaveScreen`, `onLanguageChange` and `DOMContentLoaded`
rather than `soloRegister`. The preview above Save (`#cs-preview`,
`#sk-preview`) sits on its own plate: with four players its chips wrap and
used to read over the card underneath.

The numbers, researched on 16 Sep 2026:

- **إستميشن**: made exactly = base (10, or 13) + call, ±10 for the caller and
  anyone with the same call (مع), ±10 per risk level for the last to call
  (2-3 off 13 is one level, 4-5 two), ±10 for the only one who made it or
  missed; a miss is minus the tricks off; a dash call ±33 in an under round
  and ±25 in an over round, or Egyptian +33 / −23; a plain zero made in an
  under round +10; nobody made it (صعايدة): no points and the next round
  ×2 (×4 after two). 13 rounds and 5 speed rounds with no caller, or 13.
- **طرنيب**: شامي (made: the tricks taken; failed: −bid and the others
  their tricks; كبوت 16; bid 13 made 26, failed −16 and the others double),
  مصري (the same, ×2 or ×4 on the bidders), and ٤١ (each player bids alone,
  bid values 2-4 face, 5→10 … 12→36, the bids at least 11; a team wins when a
  player reaches 41 with the partner above 0, or on a made 13). Targets
  31/41/51/61.
- **تريكس**: king −75, queens −25, diamonds −10, tricks −15, Trix
  200/150/100/50; a doubled card costs double to whoever else takes it and
  pays its doubler the single value; its doubler taking it pays double and
  the one who led that trick gets the single value, unless the doubler led
  it (single value only). Classic 20 deals, Complex 8 (the four negatives in
  one deal, then the Trix); solo or teams.
- **كونكان**: the one who went out −30, the others their cards (100 if they
  never melded), ×2 for a hand or Konkan and for a joker or one-colour finish,
  ×4 for one suit; in teams the winner's partner 0. Lowest after 5 or 7
  rounds; knocking out over 101 is offered as a house rule only, since no
  reliable source has it.
- **باصرة**: 10 a basra, 1 an ace or jack, 2♣ 2, 10♦ 3, most cards 30 - a
  26-26 split carries the 30 to the next deck. Target 101/121/150, 121 by
  default (Egyptian tables); 2-4 players or two teams.

### بنك الحظ

The owner's rules are in *The owner's specs*. Built the way لودو is:

- **`BankAlhaz.js`** (shared, no DOM). `BANK_SQUARES` is the 40 squares from
  Start (a place has its colour, price and rents `[base, جراج, استراحة,
  سوق]`); `BANK_GROUPS` a colour's step price; `BANK_CARDS` the two decks,
  each card an effect (`go`, `near`, `back`, `jail`, `free`, `cash`,
  `repair`, `each`) with its Arabic and English text. A game is two objects:
  `g`, everything on the table (cash, positions, owners and levels, jail,
  jail cards, the turn and its stage, the pot, an offer, a debt, the events)
  - a room uses it as its `shared` - and `priv`, the order of the decks,
  which nobody may see. A turn's stages: `roll` → the move and the square
  (`bankLand`: buy, rent, tax, a card, the bus, jail) → `buy` / `debt` when
  a choice or a payment waits → `act` (build, trade, mortgage) → the next
  player (`bankNextTurn`, which also finishes the lap once the time is up and
  ends the game back at the first player). Money owed that the cash doesn't
  cover is a debt (`bankCharge`), and what was waiting on it (a jail fine's
  move) runs once it is paid. `bankRaise` sells back and mortgages for
  someone (the computer, the clock, the birthday); `bankAuto` plays a turn
  out for the clock or the host; `bankBotMove` is the computer players;
  `bankOnlyMove` the forced move. `bankRents(g, i)` is a place's four rents
  as the table plays them (the classic ones, or with `highRent`); the rent
  rule and the card on screen both read it, never `BANK_SQUARES[i].rent`
  directly. `bankDice(g, rnd)` is a roll for this table (one die or two,
  `settings.oneDie`) and every roll goes through it - the turn, the clock's
  roll, the company card's - and `bankRollOff(ids, rnd, 1 | 2)` the start;
  in `bankRoll` a 6 on one die is the `dbl` of two. The first lap is `g.lapped` (who has passed
  Start, set in `bankPassStart`, whose `start` event carries `first` the
  first time) and `bankCanBuyYet`, asked by `bankLand` (a free place writes
  a `notYet` event and the turn goes on), `bankBuy` and both sides of an
  offer (`bankTradeLapped`); the phone shows 🔄 on the chip of anyone not
  round yet, says so in the bar and on the card, and in the offer panel.
- **`RoomBank.js`**: the lobby (`token`, `seat`), `start` / `playAgain`
  with the host's options (`length`, `pot`, `go400`, `turnClock`), every
  turn move checked against `seq` (turnSeq) and every place move against
  `ev` (eventSeq), `answer` from the player an offer was made to, the turn
  clock (`clockEndsAt`, reset each new turn by `turnNo`), leaving, the bot
  hook (an offer to a bot is answered first) and the forced moves.
- **`JS_Bank.html`** draws a game on any screen. The ring is 40 buttons
  placed in percent of the board (`bankSqRect`: corners 13%, sides 8.2%),
  each with its colour band toward the middle, its owner's dot toward the
  edge and its buildings on the band; what a square shows sits in an inner
  box clear of the band (`.bank-sq__in`). The board is a container: from
  520px wide every square also shows its name and price, so the phone gets
  a map and the laptop and the TV the whole board. The middle holds the two
  dice (the app's 3D die) and the card in play: the square just landed on,
  the card just drawn, or the square the player tapped. Under the board: the
  players (their piece, cash, jail and jail cards), the game's time, the bar
  (only the player whose turn it is gets buttons), an offer card for the
  one it was made to, and two panels the player opens on their turn:
  🏗️ their places (build, sell back, mortgage, redeem, each only when the
  rules allow) and 🤝 an offer (who to, what to give, what to take). The
  motion: the dice tumble, the piece hops square by square, money flies
  from the one who pays to the one paid (`flyEmoji`) and the cash counts
  up, a purchase or a building pops, a card turns over. Against the phone
  lives here too (`appState.bank`, `bankLocalNext` for the computer players
  and the forced move), and its time stands still while the screen is shut.
- **`JS_RoomBank.html`**: the lobby's pieces, seats and options, the room
  and TV frames, the turn clock and the host's "play for" a phone that went
  quiet for a minute.

### خمّن مين

The owner's rules are in *The owner's specs*. Built on the duels:

- **`GuessWho.js`** (shared, no DOM). A face is a set of plain features
  (`g`, `skin`, `hair`, `style`, `glasses`, `hat`, `beard`, `mous`, `ear`,
  `eyes`, `shirt`, and `name`, an index into `GW_NAMES[g]`, one name in
  both languages). `GW_QUESTIONS` is the list, each a feature with a plain
  yes or no, answered by `gwAnswer`; a cap is never drawn on a bald head or
  a bun (it would hide an answer) and a bald head has no hair colour.
  `gwDealBoard(size)` deals half men and half women with a different answer
  somewhere in the list for every pair (`gwSignature`), so the list alone can
  always find any face; `rules.mjs` checks that on hundreds of boards, and
  that the computer's questions always narrow one down to the secret face.
  `gwBotQuestion` is the computer's question: hard the one closest to
  halving the faces still up, easy any that splits them.
- **`RoomGuessWho.js`** is the room, bundled after `RoomDuels.js`, whose line
  and seats it uses: `duelSeatNext` seats the next game, `duelEnd` scores
  one and moves the line, so the champion, the streak and the night's board
  are the duels' own. The secret faces are `room._gw.secret`, never
  projected; each seated phone gets its own in `room.secrets[pid].face`, and
  `shared.reveal` only once the game is over. The stages of a turn are
  `ask` (a list question `ask { q }`, a typed one `typed { text }` - one
  line, 80 characters - an out-loud one `loud`, or a guess), `answer` (the
  other phone taps yes or no: `gwTakeAnswer` refuses a list answer that
  isn't the truth about the answerer's face, and nothing about it is in
  `shared` until it is given) and `flip` (faces put down by hand, then
  `done`; with the switch on, a list answer drops them itself and the turn
  passes). `flip { face, down }` works any time in play, so a double tap is
  one flip. Every turn move carries `seq` (`turnSeq`). The clock restarts
  for whoever must act - the asker, then the one answering, then the asker
  flipping (`gwStartClock`); the clock and the host's `skipTurn` pass the
  turn, except that a list question caught unanswered is answered
  truthfully by the server (an out-loud or typed one is dropped); in `pick`
  they deal a face to whoever hasn't picked. A guess leaves `shared.q =
  { kind: 'guess', face, right }` for the page's drum roll.
- **`JS_GuessWho.html`** draws it: `gwFaceSvg` builds a face from its
  features (a flat SVG in the look of the design sheet), `gwBoardHtml` the
  board (16 faces 4 wide, 24 and 30 six wide, so a phone's board is short
  enough for the bar under it), `gwBarHtml` the one bar of what to do, and
  the pills, the line, the result and the "next game" card are the duels'
  (`duelPillsHtml`, `duelRoomOverHtml`, `duelRoomLineHtml`). The faces a
  question rules out fall one after another on every phone and the TV
  (`gwNewlyDown` compares with what the phone last drew, `gwFall` staggers
  them); a face flipped by hand is drawn at once and remembered, so the
  server's board doesn't make it fall again. The answerer's card is
  `gwAnswerCardHtml`, and `gwSendAnswer` checks a list answer against the
  phone's own face before sending. `gwMoments` plays the newest log entry
  once per phone (`duelOnce`): an answer as the bubble, a guess as the drum
  roll (`gwLocal.drama` holds the reveal's turn until it is over, through
  `--gw-wait` and `data-reveal-ms`); the sounds are `gwSound`, heard where
  `duelRoomLoud` says. A typed question survives a redraw under it
  (`gwLocal.typed`, focus put back). The lobby's flipping switch is
  remembered as the host's own choice only once they touch it
  (`flipChosen`): a phone that remembered the old default isn't kept on it. Upright the board comes under
  your face and the last question, the bar sticky at the foot; on a phone
  on its side and from 900px the board takes the height (`--gw-aspect`)
  with everything else in a column beside it. The TV is both boards and the
  question between them.

### المشنقة

The owner's rules are in *The owner's specs*.

- **`Hangman.js`** (shared, no DOM): `HM_LETTERS` (28 Arabic keys, 26
  English), `hmFold` (the key a letter is typed on), `hmClean`, `hmAlphaOf`,
  `hmWordProblem` (why a written word can't be played), `hmPattern`,
  `hmApply` (one guess, a letter or the whole word, on a board `{ g, miss,
  state }`) and `hmPool(lang)`: the race's words, every single word of 4 to
  9 letters or name of up to three words on the Chameleon boards, with its
  board's category as the hint, and the emoji riddles' films (about 1,200 in
  each language), never a list of its own. `hmShape` is each word's length
  (`shared.shape`, the blanks), `hmPattern` puts a ' ' between words and
  `hmFound` counts letters only.
- **`RoomHangman.js`**: `room._hm` holds the word and every board; each
  guesser's phone gets its own board in `room.secrets[pid]` (its letters,
  its misses and the pattern it shows), the writer's phone the word, and
  `shared.progress` only how far each board is (letters shown, misses,
  solved or hanged, the order of the solves). Phases: `writing` (the host's
  `skipTurn` moves on from a quiet writer), `guessing` (a word ends when
  every board is done, on the clock, or on the host's `closeWord`),
  `result` (the word published, the points banked) and `gameover` after the
  chosen number of words. Guesses carry the word's `round`, so a tap from
  the last word is dropped.
- **`JS_Hangman.html`**: one board builder for one phone and a room
  (`hmBoardHtml`: the gallows, the tiles, the wrong letters, the keys and the
  whole-word field) and the two on one phone (`appState.hangman`, restored
  through `soloRegister`). The man is six strokes with `pathLength="1"`,
  drawn by letting the dash run out (`hmDrawLast`), a found letter's tile
  turns over, a miss shakes the stage. The tiles stay on one line, shrinking
  for a long word. On a phone on its side and from 900px the drawing and the
  word sit beside the keys, so the whole board is on the screen. The TV
  (`TV_GAMES.hangman`, `data-accent="orange"` so the man keeps the game's
  colour in the room's frame) shows the kind of word, its blanks and every
  player's man.

### One sets, everyone solves

The owner's decisions are in *The owner's specs*. خمن الكلمة, خمّن الرقم and
خمّن الدولة are rooms of their own (`room-wordle`, `room-guessnum`,
`room-flags`); فوازير إيموجي's written riddle and its race are two ways of the
emoji room (`room-emoji`), whose third way is the quiz.

- **`SolveGames.js`** (shared, no DOM): what each game adds that the page and
  the server both need. `svWordleFold` (marks off, أ إ آ ٱ as ا, capitals),
  `svWordleAlpha` / `svWordleProblem` (5-8 letters on one keypad of
  `WORDLE_LAYOUTS`), `svWordleColours` (c / p / a a letter; greens first,
  each yellow using up one of the letters left), `svWordleTries`;
  `SV_NUM_RANGES`, `svNumTries`, `svNumVerdict`; `svCountryPool`,
  `svFlagHintsAt`, `svCountryLetter`; `SV_EMOJI_KINDS`,
  `svEmojiAnswerProblem`, `svEmojiClueProblem` (emoji only - pictographs,
  flags, skin tones, joiners and keycaps are taken out and nothing may be
  left - and its letter emoji, read as letters by `svEmojiLetters`, may not
  spell the answer). `SV_CLOCKS` per game. The Arabic marks are built from
  their char codes (*Traps*).
- **`RoomSolve.js`**, the engine. `shared.solve` names the game on it (the
  emoji room's quiz has none: `svKindOf`, and `svEmojiOnEngine` says which
  way an emoji move goes - a start by its `way`, anything after by the
  room). Phases `setting` (the setter's form; the host's `skipTurn` moves on)
  → `solving` (`guess` from each solver, `closeRound` from the host, the
  clock) → `result` (`nextRound`) → `gameover` (`playAgain` keeps the
  settings). A plug-in in `SOLVE_KINDS` gives `options`, `check` (the
  setter's payload to a secret, or an Arabic error), `deal` (the race's pick,
  through `nextPrompt` - the emoji race shares the quiz's memory key), `pub`
  (what the table may see), `board`, `tries`, `guess` (`'won'`, `'miss'` or
  `''` for nothing - a repeat, which costs no try), `view` (the board as its
  own phone sees it), `progress` (what the table sees besides the tries),
  `reveal` and `mine`. Secrets: `room._solve = { secret, boards }`; each
  solver's `room.secrets[pid] = { board, state, n }` through the solving and
  the result, the setter's `{ mine }` while the others solve. Every move
  carries `round` (`staleTap`). The board is `svBoard`: `scoreboardOf` with
  `tries` on each row, fewer first on a tie.
- **`JS_RoomSolve.html`**: one renderer (`svRender`, `svTvFrame`) and the
  four games' pieces - the setter's forms (`svSetFormHtml`: the secret typed
  as dots with an eye, as المشنقة's; the country search with 🎲; the emoji
  chips and a live preview), a solver's board (`svBoardHtml`: the one-phone
  Wordle grid and keys with a draft row typed in place - `svWordleKey`, the
  computer's keyboard too; the number's range narrowing and its history; the
  flags rows and the search; the riddle and its tries), the public part
  (`svPubHtml`) and the secret (`svSecretHtml`). **What a phone is typing
  is never redrawn under it**: the frame's signature (`svSig`) is this
  phone's own state, and the table's progress, the host's buttons, the
  board between rounds and the clock are refreshed in place
  (`svPaintLive`). The emoji room keeps the quiz's renderer (`SV_EMOJI_QUIZ`)
  and hands a room on the engine to `svRender`; its lobby has the three ways.
  `roomSolveTurn` answers `roomTurnOf`.
- **Motion**: a new Wordle row flips, a verdict pops, a distance counts up
  (`countUp`), a wrong riddle shakes; at the end of a round the secret turns
  over (`svResultHtml`, keyed with `motionFirst`, `data-reveal-ms`) and the
  rows follow it in, the points this phone won fly to its row (`flyPoints`,
  measured against the board it drew earlier in the same deal), the board
  counts up (`animateScoreboards`), and the game ends on the podium with
  confetti for the winner.
- **Layout** (section 32 of `Style.html`): المشنقة's - upright one column,
  the board first; a phone on its side puts a Wordle grid beside its keys and
  the other boards' field beside their tries; from 900px the board beside a
  narrow column of the others, and a Wordle grid beside its keys, sized by
  the screen's height so the whole board is on it. The TV: the public part
  big, a card each under it (`auto-fit`, so a few sit in the middle).
- Tests: `rules.mjs` (the games' rules and the engine), `leaks.mjs`
  (`DRIVERS.solveGame`, `PROBES.solve`: all four both ways), `play-all.mjs`
  (a round of each both ways on a live server).

### كدّاب

The owner's rules are in *The owner's specs*.

- **`PlayingCards.js`** (shared, no DOM, every name `pc` / `PC_`): the deck
  (`pcDeck(decks)`), a card as rank + suit (`'7h'`, `'10s'`, `'Qd'`), الشايب
  as `'OM'`, `pcRank` / `pcSuit` / `pcRed`, `pcSorted` (rank, then suit, OM
  last), `pcPairs` (same rank, same colour) and `pcRankName`. The page
  inlines it (`SHARED_LISTS`) and the Worker bundles it before
  `RoomGames.js` (`FILES`).
- **`RoomDoubt.js`** (`doubtAction`, bundled after `RoomGames.js`): every
  hand and the pile (each play with its cards and its claimed rank) are
  `room._doubt`, never projected; a phone's own hand is
  `room.secrets[pid].hand`, sorted. `shared` carries `counts`, `rank`,
  `plays` (who laid how many in this rank), `last` (the play open to a
  call: `{ id, pid, n, rank }`), `passed`, `turn { pid, stage: 'lead' |
  'follow' }`, `pileCount`, `places`, `pendingOut` (a player whose last
  cards are still open to a call), `wins` / `board`, and the events
  (`deal`, `play`, `pass`, `call` - with the called play's faces only,
  `truth`, `taker`, `n` - `pileOut`, `out`, `auto`, `win`, `left`). A
  play's cards are ids; a call aimed at a play already covered (`play`,
  the id it saw) is dropped; turn moves carry `seq`. `doubtAfterPass` is
  the one place that decides "everyone passed: the pile goes out, the last
  to play leads" - a pass and a leaver's turn both go through it.
- **Computer players** (`ROOM_BOT_GAMES.doubt`, max 12): `pending` asks
  first whether a bot calls the play on top (decided once per play,
  `g.botCall`), then whether a bot is up; a bot up after a play waits
  1.9-2.9s so the table can call first. Hard knows a claim is a lie when
  the copies it has seen - in its hand and the true ones it laid on this
  pile itself - plus the claim are more than the decks hold, and calls on a
  hunch more often on a big claim or a last play; it leads the rank it
  holds most (sometimes slipping one extra card in), follows truthfully
  when it can, bluffs more when the pile is small or its hand nearly
  empty. Easy leads any rank, bluffs and calls at random. `rules.mjs` plays
  30 whole games (one person on the clock plus 2-6 bots, both endings) and
  checks no bot move is refused and no card is lost.
- **No forced moves**: a lead always has a choice of cards and rank, a
  follow can always bluff or pass.
- **`JS_RoomDoubt.html`**: the seats strip (a fan of backs and a count,
  «باص», «آخر ورق!», a medal once out), the table (the claim as a violet
  bubble, the pile of backs with its count, the rank, the plays of this
  rank; after a call, the called cards face up with the stamp «كدّاب!» or
  «صادق» until the next play), the big red **كدّاب!** for every other
  holding phone while a play is open (pulsing on a last play), your hand
  (tap to pick; rows of up to 13 upright, one overlapping row on a phone
  on its side and wider), and the bar: leading, 13 rank chips and
  "ارمي ٢ × سبعات"; following, that and باص. Picking cards of one rank
  when leading names it for you. The TV is a ring of seats round the big
  table with the turn and the moves beside it.
- **Motion** (`dbPlay`): the deal, cards laid face down onto the pile (your
  own fly from your hand turning over), باص on a seat, the call - «كدّاب!»
  bursting from the caller, the play's cards turned over one by one over
  the pile (`pcRevealRow`), the stamp slammed on them, the pile flying to
  whoever takes it - the pile going out (backs rising and fading), a medal
  for a player out. A game that ends on a move plays it on the table first
  (`dbPlayEnding`); your own move never waits behind the table's
  (`dbOwnMoveWaiting`). Sounds `pcCard`, `pcSlide`, `pcCall`, `pcLie`,
  `pcTrue` are added to `FX` from `JS_Cards.html`.

### الشايب

- **`RoomOldMaid.js`** (`oldMaidAction`): every hand, in the order it is
  held, is `room._om.hands` (`{ i, c }`), the lifted card `room._om.aimId`;
  never projected. A phone's own hand is `room.secrets[pid].hand` in its
  order. `shared`: `settings { mode: 'drag' | 'shuffle', turnClock }`,
  `counts`, `turn { pid, from }`, `aim { pos }` (where the lifted card sits
  now), `thrown` (every pair out, its faces public), `out` (the order they
  got out), `pairs` / `deckSize`, `loser`, `reveal` (the loser's hand,
  published at the end only), `losses` / `board`, and the events (`deal`,
  `pairs` - two by two, `deal: true` for the start - `draw` with the
  position taken and never the card, `move { pid, from, to }`, `out`,
  `shuffle`, `auto`, `over`, `left`). Actions: `lift { pos, seq }`, `take
  { seq }` (the lifted card; `pos` too, a lift and a take in one, which
  the phone does not use), `move { card, to }` (any player, their own hand,
  drag mode only, no `seq`), `skipTurn` (host) and the clock.
- **`JS_RoomOldMaid.html`**: the seats (the drawer "الدور", the hand being
  drawn from 🎯, ✓ and the place once safe, 🧓 for the loser), the draw
  (the other hand as a row of backs, the lifted one up in gold; buttons for
  the drawer, a picture for everyone else; for the one being drawn from, a
  line saying so and their own lifted card raised in their hand), the pairs
  out fanned in the middle, your hand, and the bar with "خد الكارت ده".
  **A lift and a drag change no frame**: the sig leaves out `aim`, the
  `move` events and the order of your own hand, and `omLive` puts the
  lifted back up, slides a moved back from its old place to its new one
  (FLIP), enables the take button, and puts your own cards in the server's
  order - except while a drag of yours is still on its way
  (`omLocal.pending`). Dragging is pointer events on the hand
  (`touch-action: pan-y`, so an upright swipe still scrolls): past 8px
  sideways the card follows the finger, the others slide out of its way,
  and letting go sends one `move`.
- **Motion** (`omPlay`): the deal, each dealt pair flying out of its hand
  to the middle two by two (a gold ring where they meet), a card flying
  from one hand to the other (face down, except on the two phones it
  concerns: the giver sees it leave face up and turn, the drawer sees it
  turn up as it lands), a player safe, the shuffle, a leaver's cards
  flying to the next hand; the end turns الشايب over in the loser's hand.

### The playing cards (`JS_Cards.html`, section 26 of `Style.html`)

One card builder for both games, `pcCardHtml(c, { size })` - a face, the
back (`null`) or الشايب (`'OM'`) - sized by `--pc-w` (1 : 1.42, the
default on `:where(.pc-card)`, so every context that sizes a card wins),
laid out left to right in every language: the index (rank over a small
suit) top left where an overlapping hand leaves it showing, a big Baloo
numeral, the suit again bottom right, a soft shine; the suits are drawn
(`PC_SUIT_PATHS`), never glyphs, since ♥ and ♦ turn into emoji on an
iPhone. Red suits `--pc-red` (#e5383b), black `--pc-ink` (#23213a), the same
in both themes (an ink card gets a faint rim on the dark ground). الشايب:
deep violet, a gold frame, the old man drawn (`PC_OLD_MAN_SVG`: a red fez
and its tassel, white hair and brows, round glasses, a big white
moustache), the band «الشايب». A card under ~42px drops its corner (and
الشايب its band). `pcFitRows` overlaps a row to fit its width;
`pcFx()` is one table's motion state, and `pcFly`, `pcPop`, `pcRing`,
`pcStamp`, `pcShout`, `pcShake`, `pcRevealRow`, `pcHold` / `pcRelease`,
`pcEventsToPlay`, `pcDeferRedraw` are the flights both games use (the
same shape as أونو's). `pcPlacesPodium` is a podium of places with medals
and no numbers. Drawn icons `art:doubt` (three backs in a fan and a red ?)
and `art:oldmaid` (his card) are in `ICON_ART`.

كدّاب (`doubt`, violet, 3-12, 15 min) and الشايب (`oldmaid`, amber, 2-8,
10 min) are in ورق وطاولة, `modes: ['room', 'tv']`, opening a room
(`roomCreateFor`). In the hub كدّاب opens from one person (bots make up the
three), الشايب from two. Both have `GAME_RULES`, `HELP_ENTRIES`
(`roomOnly`) and `HELP_FOR_VIEW` (`room-doubt`, `room-oldmaid`), and a
`roomTurnOf` case (`turn_up` for the player up). Lobby choices are kept on
the host's phone (`recallOptions('doubt' | 'oldmaid')`).

### شطرنج

The owner's rules are in *The owner's specs*. The game's client id is
**`shatranj`** (the catalog, the help, `setup-shatranj`, `play-shatranj`,
`review-shatranj`) and the room's is **`chess`** (`ROOM_GAME_IDS`,
`room-chess`, `ROOM_GAMES.chess`, `TV_GAMES.chess`): `chess` was already the
chess clock tool's help entry and `play-chess` its screen, so the room's help
goes through `ROOM_HELP_KEY` in `JS_Utils.html` (*Traps*).

- **`Chess.js`** (shared, no DOM, every name `chess` / `CHESS_`; inlined into
  the page through `SHARED_LISTS` and bundled into the Worker):
  - **A game** is one plain object (`board` 64 numbers a1 = 0, a piece its
    kind 1-6 + 8 for black; `turn`, `castle` bits, `ep`, `half`, `full`, and
    `keys`, the positions since the last capture or pawn move for threefold -
    a position's key has an en passant square only when a pawn can really
    take there). `chessPlay(g, { from, to, promo })` plays a legal move and
    says what happened (SAN, what was taken and where, castling, check, and
    `status`); `chessStatus(g)` is mate, stalemate, material, repetition or
    fifty; `chessLegalMoves`, `chessFen` / `chessFromFen`, `chessCheckSq`.
  - **Inside**, a position (`chessPos`) with the kings and a two-lane Zobrist
    hash, pseudo-legal generation over precomputed knight, king and ray
    tables, make / unmake, and a legality filter. `rules.mjs` runs perft on
    the standard positions: the start to depth 4 (197,281), Kiwipete to 3
    (97,862), positions 3 (depth 5, 674,624), 4, 5 and 6 - all in well under
    a second.
  - **The clock**: `chessClockNew(id)`, `chessClockLeft`, `chessClockPress`
    (the first move free, the increment added), `chessClockFlagged`,
    `chessFlagResult` (a flag against a side that can't mate is a draw:
    `chessCanMate` - a lone king can't; a lone minor or bishops of one colour
    only when the other side has something to block with).
  - **The computer** (`chessBestMove(g, { elo })`): iterative-deepening
    alpha-beta with a transposition table, MVV-LVA captures, killers and
    history, a check extension, a null move, late moves searched shallower,
    quiescence, the "simplified evaluation" piece-square tables tapered to the
    endgame, and a push of a bare king to the edge. It stops at its time **and**
    at a node ceiling (a frozen clock can't hold it - *Traps*), keeping the last
    depth it finished (depth 1 always finishes). The rating is
    `chessEloSettings(elo)`: depth, nodes, ms, the wobble on each root move
    (`noise`), the chance of a random move (`blunder`) and how far the
    captures at the leaves are followed (`qdepth`, 0 at 400).
  - **The coach's analysis**: `chessAnalyse(g, { nodes })` (the best move, the
    score for the side to move, mate in n, the line it expects), `chessJudge`
    (one move against the analyses before and after it: the verdict from the
    centipawns lost, a score held within ±1000 so a won game stays won -
    best ≤ 15, good < 50, inaccuracy < 100, mistake < 300, blunder from 300; a
    mate let slip is at least a mistake, one walked into a blunder; a best
    move that leaves a piece to be taken for less is **brilliant** - and the
    accuracy by Lichess's formula from the winning chances lost),
    `chessMoveGood` / `chessMoveBad` (the reasons, as keys and facts: `hang`,
    `fork_allowed`, `pin_allowed`, `mate_allowed`, `loses`, `mate_missed`,
    `win_missed`, `king_walk`, `queen_early`, `castle_better`,
    `develop_better`, `centre_better`, `better`; `mate_in`, `fork`, `wins`,
    `saves`, `castle`, `develop`, `centre`, `check`, `improves`, `sacrifice`),
    `chessThreats` (the pieces in danger), `chessPins`. A review is
    `chessReviewBegin(record)` → `chessReviewStep` a position at a time →
    `chessReviewResult` (every move judged, the accuracies, the graph, the key
    moments); `chessReview` does it all at once for the tests. Bounded by
    nodes, the same game reviews the same every time.
  - **The tournament's adapter**: `chessMatchNext(match, rnd)` - the next game
    of a match (White, Armageddon or not) or its winner - and
    `chessArmageddonResult`.
  - **Batch 2's rules** (standard chess bit for bit as before - the perft
    numbers unchanged): **Chess960** - a game carries its castling rooks'
    files (`g.rooks`, `[wK, wQ, bK, bQ]`, standard `[7, 0, 7, 0]`) through
    `chessFromFen` / `chessPos` / `chessCloneGame` / `chessFen` (X-FEN),
    castling to g/c with the rook to f/d, a castling move also accepted as
    "the king takes its own rook" (`chessFind`); `chess960Start(n)`
    (Scharnagl numbering, 518 is the standard start) and `chess960Random`;
    Chess960 perft positions in `rules.mjs`. **Several lines**:
    `chessAnalyse(g, { lines: n })` returns `lines`, the top n root moves with
    their scores. **A style** for the computer: `chessBestMove(g, { elo,
    style: 'attack' | 'solid' })`, a bonus at the root only (never in
    `chessEvaluate`, so the analysis and the review are unchanged). **The
    clocks** `1+0`, `3+0`, `15+10` in `CHESS_CLOCK_IDS`; **the handicap**
    `chessHandicapFen(kind, side)` and `chessClockNew(id, { odds })` (the
    giver's clock halved).
- **`RoomChess.js`** (bundled after `RoomDuels.js`, whose line and seats it
  uses). **One board** is `shared.chess`, made and played only through the
  board functions, which never touch the room, so a bracket can hold one per
  match: `chessBoardNew(clockId, { armageddon })`, `chessBoardMove(bd, seat,
  payload, now)`, `chessBoardResign`, `chessBoardOffer` / `chessBoardAnswer`,
  `chessBoardDeadline`, `chessBoardFlag`; a board's `result` is `{ result,
  reason, winner (the seat), drawn }`, an Armageddon draw coming out as
  Black's win. The board keeps `hist` (the moves as 'e2e4', for the review),
  `sans`, `lost` (what each side has lost), `last`, `offer` / `offered`, the
  clock in the server's time. The room around it is `chessAction` (winner
  stays on through `duelEnd` / `duelSeatNext`), `chessDeadline` /
  `chessTimeout` (the flag), `chessPlayerLeft` (a forfeit). A move carries
  `move` (the count the phone saw) against a double tap; a move that arrives
  after the time ran out loses on time and isn't played. No computer players,
  no forced moves. The host's `skipTurn` plays one move for the side to move
  (`chessHostMove`: `chessBestMove` at 800, depth 1, 600 positions, marked
  `last.auto = 'host'`), carrying `move` against a double tap.
  **Batch 2**: `chessRoomOptions` is `{ clock, variant: 'standard' | '960',
  odds }`; `chessBoardNew` takes a start FEN and keeps `bd.start` (the kept
  game's record and its review use it); a 960 room draws a new start each game
  (a tournament one per match, `m.start960`, kept through its replay and
  Armageddon); the handicap comes off **the champion's** side, and a
  tournament ignores it. An old phone sending only `clock` keeps what the
  room had (a new room: standard, no handicap).
  `chessBoardDeadline` is the first moment the flag counts (the grace + 1 ms:
  `chessClockFlagged` wants *more* than the grace, and an alarm at the grace
  itself found nothing to do).
- **In the tournament** (`TOUR_KINDS.chess` in `RoomTournament.js`): `deal`
  makes a board through `chessRoomDeal(v, { armageddon })`; the match keeps
  `whites` (who had White in each game, public) and `chessMatchNext` (from
  `chessTourRecord(m)`) says the next game's White and whether it is
  Armageddon - the second game is the swap the tournament's own replay already
  makes, the third has White by lot, and the seats are turned when the lot says
  so. `drawRule` asks `chessMatchNext` too: a draw is replayed until it says
  the match is decided (an Armageddon draw never reaches it - the board
  already made it Black's win, `result.drawn`). `act`, `deadline` / `timeout`
  (the flag), `left` and `stay` are chess's own room functions on the match's
  small room; `chessAction` hands every action to `tourAction` first.
  On the page (`JS_RoomChess.html`) everything reads the room through
  `duelRoomState()` and sends through `duelAct()`, so the same screen draws a
  match; `chRoomTagHtml` says «إعادة بالألوان معكوسة» or «أرماجدون: التعادل
  للأسود» over the status, an Armageddon draw's result line says Black won it,
  `chRoomKeepTourGames` keeps every game the phone played as it ends (the
  final ends on the podium, not the board), and `chRoomLiveState` /
  `chRoomPaintMiniClocks` keep the big board's clocks and the TV's live cards'
  ticking. `TOUR_CLIENT.chess` (in `JS_RoomTournament.html`, which loads after
  this file) is the live card - a flat `chFlatBoardHtml` without coordinates,
  both clocks, ⚔️ on Armageddon - and the optional hooks the tournament gained
  for it (`liveSig`, `replayHead`, `drawNote`, `after`, `onState`).
- **`JS_Chess.html`** - the board and one phone:
  - **One board view per page** (`chView`, as `bsView`): a root moved into
    whichever screen shows a board, thrown away when none does. The 3D board
    (`chMake3D`) draws **only when something changes or moves**: a tween list
    and a drag keep the loop running, nothing else (a static board costs
    nothing). The board top is one canvas texture (the squares' grain, the
    frame, the names turned to whoever sits at the near side), what sits on
    the squares another (the last move, the piece picked up and its targets,
    check, the pieces in danger, arrows - redrawn only when it changes), the
    pieces lathe profiles plus their parts (battlements, the mitre's cut, the
    extruded knight's head turned three-quarters so its profile reads, the
    coronet, the cross), boxwood and ebony `MeshPhysicalMaterial` with a
    lacquer under a warm room of light (PMREM), soft shadows, and a shadow
    catcher under the board on the page's own ground. The camera finds the
    nearest distance that shows the frame, the far pieces' tops and the pieces
    taken (beside the board on a wide screen, before and behind it upright),
    from your side. A move is a tween from where the piece is (so a dropped
    piece slides from under the finger), a capture knocks the piece off in an
    arc to its place beside the board, castling brings the rook after, a
    promotion pops the new piece in, check shakes and lights the king, mate
    topples it. Picking tries the height of a piece's middle first (a tall
    piece stands in front of the square behind it).
  - **The 2D board** (`chMakeFlat`, `chFlatBoardHtml`, section 30 of
    `Style.html`): the squares a CSS grid, the pieces a layer over them, each
    a `<use>` of a `<symbol>` (`chPieceSymbols`, put in the page once by
    `chPieceDefs`: our own Staunton drawings, `CH2_SHAPES`, in a 45 × 45 box)
    placed with `transform: translate(var(--x) × 100%, var(--y) × 100%)`. The
    live board is built once per orientation and updated square by square
    (`ch2SquareParts`); a move moves the piece's element (a 150 ms Web
    Animation of its transform), a piece taken fades under it, the rook comes
    with its king, a promotion pops, a mated king tilts; a drag lifts the
    piece (`is-drag`) and a refused drop shakes it back (`dragEnd(played, to,
    refused)`); a piece the finger dropped is not slid again when the move
    comes back (`dropped`). The static callers draw the markup as it is: the
    position editor and the tournament's live cards (`mini`: no
    coordinates). The colours are tokens: `--ch2-light` / `--ch2-dark` /
    `--ch2-last` / `--ch2-sel` per `[data-ch2-style]`, the pieces'
    `--ch2-w-*` / `--ch2-b-*` on `:root`, the same in both themes. The 3D
    board's four styles are `CH3_STYLES` (`applyStyle` recolours the
    materials and redraws the board's canvas).
  - **The look and the switch** (`chLook`, `recallOptions('chessLook')`: `{
    view: '2d' | '3d', style }`; `chLookSet` remembers and redraws):
    `chViewShow` asks `chViewWant` (the TV's model `tv`, or the phone's
    choice, and only where `chCan3D`); a 3D board shows the 2D one while
    three.js loads (`chViewLoad3D`, the one place chess asks for it), a load
    that fails leaves 2D and hides the switch (`chView.no3d`). The board's
    buttons are `chViewTools` (`.ch-tools`, a row over the board, a column
    beside it when the stage is wide - a container query on `.ch-view`).
  - **The 3D polish** (24 Sep 2026): profiles smoothed between their sharp
    corners (`chPieceParts`' `smooth`, 64 segments), a felt disc under each
    piece, the knight's head the 2D knight's own profile (`CH3_KNIGHT`,
    `ch3KnightPt`) with a ridged mane, ears, eyes and nostrils, turned
    sideways so its profile reads from both seats; a soft contact shadow
    (`groundBlobs`) kept on the board as a piece rises; a bevelled rounded
    frame with grain, the top a varnished `ShapeGeometry`. Motion:
    `animateMove` (lift, arc, settle), `puff` (dust, sparkles: `Points`
    cleaned up through `fx` on a new game), `pulse` (check), `topple` (mate:
    it falls where there is room). The camera: `view` (`az`, `dEl`, `zoom`,
    `top`, a `focus` ease), clamped in `clampView`, fitted by `aimCamera`;
    `camera('orbit' | 'zoom' | 'top' | 'reset')`, driven by two fingers, the
    right or middle mouse button and the wheel in `chWireInput`, and the
    «⬇ من فوق» / «↺» buttons (`chViewCam`).
  - **Input**: `chWireInput` (a tap, or past 10px a drag that lifts the piece
    and follows the finger; `touch-action: none` only while it's your move),
    `chTapLogic` / `chDropLogic` (shared by one phone and the room), the
    promotion picker over the square (`chAskPromotion`, kept inside the board).
  - **One phone** (`appState.shatranj`, restored through `soloRegister`): two
    on one phone or against the computer, the clock (read from its stamps,
    never counted down; it stands still while the board is off screen), the
    tally, the computer thinking after the last move has landed and at least a
    human moment, capped by its clock. **The live coach** reads one analysis
    of your position on your turn (`chCoachPrepare`); your move is shown, then
    judged (`chCoachJudge`): a blunder opens `#ch-warn-modal` (take it back:
    the position, the clock and what was taken are put back exactly), anything
    else goes on with the word on the move under the board.
  - **Batch 2 on one phone** (24 Sep 2026):
    - **Help and the rating**: `s.helpLimit` (`CH_HELP_LIMITS`, the game keeps
      the limit it started with in `s.gameHelp`), `s.help` (`chHelpNew`: undo
      and hint counted, `best` / `warn` / `setup` / `odds` as flags; the kept
      record carries it), `chHelpLeft`, `chUndoLocal` (rebuilds from `s.start`
      and `s.hist` through `chRebuildLocal`, so the repetition keys are right,
      and the undo count is in the animation key - else the piece snaps).
      `s.rating` `{ r, n }`, `chRatingDelta`, `chUnratedReason` (the setup's
      line), `s.rated` settled at the start, `chConfirmReplace` /
      `chAbandonLocal` (a rated game left counts as a loss); the record keeps
      `rated` and `rating`; أرقامي shows it.
    - **The characters**: `CH_CHARACTERS` (id, elo, style), `chCharFaceSvg`
      (drawn 64 × 64 faces, no ids), `chCharSuggest`; `s.char` ('custom' is
      the slider), `s.opp` (the rating and style this game is played at).
    - **Opening names**: `JS_ChessOpenings.html` (`chOpeningMatch`: the
      deepest known position so far, and where theory ended); the content
      check plays every line.
    - **The position editor**: `JS_ChessPosition.html` (view `pos-shatranj`,
      `chPosOpen`, `CH_ENDGAMES`, `chPosProblem` - one king each, no pawn on
      the first or last row, the side not to move not in check, a position
      already over), played through `chNewGame({ fen, setup, eg })`.
    - **960, the handicap, the clocks**: `s.variant`, `s.odds`, `s.oddsBy`
      (you / the computer), `s.oddsColor` (two on one phone); a new game's
      `s.gameVariant` and `s.gameOdds` `{ kind, giver }` (`chOddsNow`,
      `chOddsGiver`, `chOddsFen`), the tags over the board
      (`chLocalTagHtml`); the clock buttons are built from `CHESS_CLOCK_IDS`.
      On every board: a king picked up in 960 shows a ring round the rook it
      can castle with (`chTargets`, `chIs960`), and a tap or a drop on it
      castles (`chCastleByRook`); both boards find the castling rook for their
      animation with `chCastleRookSquares` (the king can land on the rook's
      square).
    - **Premoves** (`chPremoveTargets`, `chPreTapLogic`, `chPreDropLogic` -
      a drop that queues returns `'pre'` and the piece goes home quietly -,
      `chPremoveLegal`, `chPremoveDropped` and the boards' `nudge(sq)`):
      `chLocal.pre` played in `chAfterMove` when your turn comes;
      `chRoomLocal.pre` (keyed on the deal and round) played at the top of
      `chRoomRender` through `chRoomPlay`.
    - **Arrows by hand**: `chView.anno` (keyed on the model's key and its
      animation key, so a move clears it), `chView.pen` (✏️), `chView.draft`
      (the arrow being drawn); `chAnnoMerge` puts them over the model the
      screen gave (never into it), `chAnnoToggle`, `chAnnoClear` (🧹); marks
      of kind `'user'` (`.ch2-sq.is-anno`, `--ch2-anno`; a solid ring in 3D).
    - **Best moves**: `chBestPrepare` (a candidate a tick, `CH_BEST`),
      `chBestNow`, `CH_BEST_COLORS`; an arrow's `label` / `ink` are drawn at
      its head on both boards (the 3D overlay turns the text for Black).
    - **Sharing** (`JS_ChessReview.html`): `chShareRowHtml(key)` at the end of
      a game, in the review and on a room's phones once over; `chShareGame`
      ('pic' | 'pgn' | 'video'), `chShareCardData`, `chDrawBoardCanvas` /
      `chDrawBoardFrame` (the 2D board on a canvas in the phone's style, the
      pieces from `chPieceImages` - the page's symbols with their colours
      written in), `chPgn` (Event, Site, Date, Round, White, Black, Result,
      Variant, SetUp / FEN, Termination), `chShareVideo` (`chVideoMime`,
      `chVideoFrames`, MediaRecorder on a canvas painted every 100 ms).
- **`JS_ChessReview.html`** - the kept games (`ashryChessGames_v1` in
  localStorage, the last 20, each with its review once worked out, so it
  reopens at once) and the review screen: the players and their accuracy
  (counting up), the result, a progress bar while it works (a slice of ~60ms a
  tick), ⏮ ◀ ▶ ⏭ and the arrow keys, the move's verdict and why, "show the
  better move" (the position before, the move played in orange and the better
  one in green), "try the better move", the key moments, the graph (tap to
  jump), each side's counts, the move list with its verdicts. A room's game is
  kept on each phone that played it, and anyone in the room can open its review
  from the result card; leaving the review goes back to the room.
- **`JS_RoomChess.html`** - the room and the TV: your colour at the bottom;
  your move drawn as your finger lifts (`chRoomLocal.early`, the same
  animation key as the server's board, so nothing moves twice; refused, the
  room's board comes back); the clock read through the smallest gap seen
  between a clock start and hearing of it; the draw offer's card; the host's
  clock in the lobby, remembered. `roomTurnOf` answers for your move or a draw
  offered to you.
- **Layout** (section 30 of `Style.html`): upright the pills (each with its
  clock and what it took, wrapping), the status, the board, what to do, the
  coach's word, the moves; on a phone on its side and from 900px the board
  takes the height beside a column; the TV is the board with the pills, the
  status, the moves and the line beside it.

- **الوزير المستخبي (the hidden queen)**: the owner's rules are under
  *The owner's specs*. The game object `g` never holds the secret: a hidden
  queen is a pawn in it, so everything that reads `g` (the other side's moves,
  check, the boards, the review, the TV) sees a pawn. The secret is one small
  object per game (`chessHqNew`: `{ sq, pick, how, at }` per colour) kept where
  secrets live: the server's `room._chq` (never projected) with each seated
  phone's own square in `room.secrets[pid].hq`, and the one-phone game's
  `appState.shatranj.hq`. In `Chess.js`: `chessHqEngine` / `chessHqMoves` (the
  queen moves from the pawn's square a pawn couldn't make, legal, never onto a
  king - the pawn made a queen for the look and put back), `chessHqPlay` (a
  move with the secret: a reveal turns the pawn into a queen and plays the
  queen move through `chessPlay`; a pawn move carries the secret; a promotion
  ends it; a hidden pawn taken reports `captured` and counts `'q'`; the end
  judged with the next side's hidden queen), `chessHqReplay`, and the marker:
  a revealing move is stored `e2e5*`, `chessFromUci` reads `hq: true`, and
  `chessPlay({ hq: true })` makes the pawn a queen first - so every replay of a
  stored game (the review, the PGN, the share card, the mistakes' puzzles)
  works with nothing else knowing the variant. `chessBestMove(g, { hq })` adds
  its own hidden queen's moves at the root (`CHESS_HQ_BIT` on the engine
  number, the pawn swapped for a queen and the hash with it around each). In
  `RoomChess.js`: `chessRoomOptions` takes `'hq'`, `chessRoomDeal` starts
  `shared.chess.hq = { picking, picked, pickEnds, events, end }` (winner stays
  only, the usual start, no handicap) and resets the room's slices, `hqPick`
  (`round` against a stale tap), the pick clock in `chessDeadline` /
  `chessTimeout` (`CHESS_HQ_PICK_SECS`), `chessHqAutoPick` (the clock and the
  host), `chessBoardMove(..., hq)`, `chessHqAfterMove` (the reveal or capture
  the table saw, `bd.last.hq`, and the secrets moved), `chessHqEnd` (both
  picks, at every way a game ends). On the page: `chMovesFor` / `chTargets(g,
  sel, hq)` add your hidden queen's moves to a tap and a drop; the mark
  `kind: 'hq'` is the crown (2D: `.ch2-sq.is-hq` and `.ch2-hq`; 3D: a gold
  ring); `chHqMoment` the words over the board (`motionFirst`), the room's
  keyed on the deal with a baseline so a reload or a late join replays nothing
  (`chRoomHqMoments`); `chAnimOf` draws a reveal as a promotion to a queen;
  `chHqEndHtml` both picks at the end. The one-phone game: `chHqChosen`,
  `chHqOf`, `chHqPicking`, `chHqPickLocal`, and `chRebuildLocal` replays the
  secret for an undo. Tests: `rules.mjs` ("Hidden queen, 24 Sep 2026"),
  `leaks.mjs` (`VARIANT_DRIVERS['chess:hq']`, `PROBES['chess:hq']`, proved on
  a scratch build that put the squares in `shared` and gave each phone the
  other's), `play-all.mjs` (`hiddenQueenRobots`, `--only=hq`).

### ألغاز شطرنج

The owner's plan is in *The owner's specs*. `JS_ChessPuzzles.html` (included
after the chess files), the bank `ChessPuzzles.js` (inlined into the page,
`SHARED_LISTS`, never the rooms server), section of `Style.html` just before
section 33 (`.chpz-*`). The game's id is **`chesspuzzle`**, the screens
`setup-chesspuzzles` and `play-chesspuzzle`, the state `appState.chesspuzzle`
(registered with `soloRegister`), every name `chPz` / `CHPZ_`, every string
`chpz_*`.

- **The bank** (`CHESS_PUZZLES`): `{ id, fen, moves (UCI: player, reply,
  player …), theme: 'mate' | 'material', mateIn?, level: 1-3, rating }`; the
  side to move is the player. `tools/validate-content.js` checks every line.
  `chessAnalyse(g, { lines: n })` gives real scores only inside its first n
  lines (moves outside get a bound): judge alternatives by analysing the
  position after each (T3.1's finding, used by the mistakes).
- **The board is the chess game's** (`chViewShow` with a model like the one
  phone's: `key: 'puz|' + uid`, an `anim` per move, marks for the flash and the
  hint): 2D by default, 🧊 3D a tap away (the same `chessLook`), the tools on
  the board. `JS_Chess.html`'s `onLeaveScreen` keeps the board for
  `play-chesspuzzle`. Input is `chTapLogic`; a drop is judged here first
  (`onDrop`), so a wrong drop returns false and the board slides it back with
  its shake (a promotion still goes through `chDropLogic`'s picker).
- **What has been played is `s.hist`** (UCI), the position rebuilt from the FEN
  each paint (`chPzGame`), so a reload is the same puzzle at the same move;
  `chPzAfter` plays what comes by itself - the reply 0.5 s after a right move
  (hist odd), or the next move of a solution being shown (`s.showing`) - and
  runs again on a reload. `chPzJudge` says right (the line's position, a mate
  at once, or a mistake's alternative through `chPzAltOk`) or wrong.
- **Modes** (`s.mode`): `free`, `daily` (`chPzStartDaily`, `chPzDailyLevel`,
  `chPzDailyPuzzle` from `soloDaySeed('chesspuzzle')`; `soloDailyResume` /
  `soloDailySetAside` / `soloMarkDaily`; `DAILY_GAMES` line `chPzDailyLine`),
  `streak` (`s.streak`: lives, score, target, seen, marks, over, saved;
  `s.streakRecent` the last 300 dealt; `soloRecord('chesspuzzle', 'streak')`)
  and `mistake` (`chPzMistakeList` from `chLoadGames()`, cached on the stored
  string; `s.mSolved` marks; `chPzFromReview(k)` from the review's button,
  `s.from` for «ارجع للمراجعة»). The mode hooks are plain functions the core
  asks for (`chPzWrongMode`, `chPzSolvedMode`, `chPzNextMode`,
  `chPzDoneBarHtml`, `chPzHeadExtraHtml`, `chPzSideExtraHtml`).
- **Motion**: a right move's square green and the board's frame glowing green,
  a wrong one red with the piece shaken back (`nudge` for a tap), the reply
  sliding, a mate toppling the king, confetti through `afterReveal` once the
  move has landed; in the streak a lost heart jumps and the score pops; the
  result sheets count up (`soloResult`).
- `JS_Daily.html` now draws a game's icon with `iconHtml` (the puzzles' icon is
  drawn) and writes it in text with `dailyIconText` (a drawn icon writes
  nothing: its line carries ♟️).
### باغ هاوس

The owner's rules are in *The owner's specs*. Rooms only; the room's id and
the client's are both **`bughouse`** (`room-bughouse`, `ROOM_GAMES.bughouse`,
`TV_GAMES.bughouse`, the help entry).

- **`Chess.js`** (the end of the file, every name `chessBug` /
  `CHESS_BUG_`): a bughouse board is an ordinary game plus `hand` (`{ w: { q,
  r, b, n, p }, b: {…} }`) and `promoted` (the square indices of pieces
  that were pawns). `chessBugNew`, `chessBugClone`, `chessBugDrops` (every
  legal drop: an empty square, no pawn on rows 1 and 8, not leaving the king
  in check - so in check only a blocking drop), `chessBugLegal`,
  `chessBugStatus` (mate only; `stuck` for a side with nothing to do),
  `chessBugPlay` (a move or a drop `{ drop: 'n', to }`; the SAN `N@f3`,
  `P@e4`; the promoted marks travel with their piece; `info.gives` is what
  the capture sends - `'p'` for a promoted piece), `chessBugGive` (into the
  other board's hand, the other colour), `chessBugBotMove` (a drop that
  mates, then a move that mates - easy sees them 60% of the time - then,
  with a piece or two pawns in hand, a safe drop near the other king, a
  check counting for more; else `chessBestMove` at 1500 / depth 2 / 2,500
  positions for hard, 600 / depth 1 / 400 for easy: cheap enough for the
  server). Nothing above them changed: standard chess, Chess960 and every
  perft number are as they were (`rules.mjs` still runs them all).
- **`RoomBughouse.js`**: `shared` holds everything (nothing is hidden - the
  hands are on the table): `phase`, `round`, `settings.clock`, `seats`
  (four ids; team A is seats 0 and 3, team B 1 and 2), `names`, `subs`,
  `line`, `startAt`, `boards` (`{ g, moves, sans, last, clock }`; the clock
  is chess's shape `{ base, inc, left, at }`, read with `chessClockLeft`,
  its `at` set at the deal so it always runs), `result` (`{ team, board,
  seat, reason, winners }`), `scores` / `board`. Actions: `start`, `move` /
  `drop` (each carrying `move`, the board's move count the phone saw),
  `resign` (`round`), `skipTurn` (host; `board`, `move`), `playAgain`
  (`round`). `bughouseDeadline` is the sooner of the two boards' flags.
  Computer players: `pending` picks, of the two boards, the bot whose
  moment comes first - its thinking time (`BUG_THINK_MS`, steady for one
  key) counted from when its turn began - so both boards keep moving; a bot
  with nothing to do waits and is asked again after the next move anywhere.
- **`JS_RoomBughouse.html`** (section 35 of `Style.html`, prefix `bh`):
  - **Your board big** through chess's one board view (`chViewShow`,
    `bhModel`): its `lost` is the two hands, so the 3D board sets them
    beside itself; `input.onPick` drops the piece picked from the hand
    (`bhLocal.drop`, its squares as `targets`) or falls through to chess's
    `chTapLogic` / `chDropLogic`. Your move is drawn at once on a copy
    (`bhLocal.early`, the same animation key as the server's, so nothing
    moves twice) and taken back if refused.
  - **Each player a line** (`bhPlayerHtml`): the colour, the name (🤖 for a
    computer player, "you" / "partner"), the team's line (blue A, red B),
    the clock (`data-bh-clock`, painted every 200 ms from the server's time
    as chess reads its clock), the hand (`bhHandHtml`; live buttons of 44 px
    on your move).
  - **Dragging from the hand** (`bhWireHand`): pointer events on the hand's
    buttons; past 8 px a ghost follows the finger and letting go asks the
    board's own `pick` (2D and 3D alike) for the square; a square it can't
    go to sends it flying back. A tap picks it up instead.
  - **The partner's board small** (`bhMiniHtml`, a static `chFlatBoardHtml`
    in a square container), a button: a tap swaps the two
    (`bhLocal.swap`); your own board, small while it is your move, is
    outlined.
  - **Motion** (`bhPlayMotion`, once per capture per phone): a captured
    piece flies from its square to the partner's hand on the other board
    (`bhFly`, a Web Animation of a ghost, the hand popping as it lands);
    another player's drop flies from their hand to its square; your own drop
    by tap flies from your hand as you play it. A piece arriving in your
    hand ticks and buzzes.
  - **The TV** (`TV_GAMES.bughouse`): both boards side by side (2D), each
    with its two players, clocks and hands, team A at the bottom of both;
    the host's "play for" and play again.
  - `roomTurnOf`: your move on your own board.
- Tests: `rules.mjs` (the drops, the hands, the promoted pawn, a drop mate,
  a check a hand can block, six bot games on two boards with every move
  legal; the room: seats, stale taps, a capture sent and dropped, the flag,
  the mate, play again's three pairings, one person and three bots to the
  end, a leaver replaced, five people, the host's "play for"), `leaks.mjs`
  (`DRIVERS.bughouse`: no slice sent, both boards and hands everywhere),
  `play-all.mjs` (two people and two computer players on a live server).

### شطرنج الأربعة

The owner's rules are in *The owner's specs*. Rooms only: the game id is
`chess4` everywhere (`ROOM_GAME_IDS`, `room-chess4`, `ROOM_GAMES.chess4`,
`TV_GAMES.chess4`, the catalog, the help). `c4` is Connect 4's prefix, so the
rules are named `chess4` / `CHESS4_` and the page's code `ch4`.

- **`Chess4.js`** (shared, no DOM; inlined into the page through
  `SHARED_LISTS` and bundled into the Worker before `RoomGames.js`):
  - **A game** is one plain object (`board` 196 numbers, i = y × 14 + x from
    a1, 0 on a cut corner; a piece its kind 1-6 + 8 × its seat, + 32 for a
    queen that was a pawn; `turn`, `castle` two bits a seat, `out`, `why`,
    `points`, `giver`, `quiet`, `ply`, `passes`, `over`, `result`). Seats: 0
    red, 1 blue, 2 yellow, 3 green, which is the order of play; teams are
    `seat % 2`.
  - **Inside**, a mailbox of 18 × 18 (`chess4Pos`: two squares of border, the
    corners marked off), so no jump wraps an edge; `chess4Pseudo` the moves,
    `chess4Make` / `chess4Unmake`, `chess4Attacked(b, m, mask)` by any seats in
    a mask (`chess4Foes`: the other team, or everyone else; never an out
    player, whose pieces are walls that block but never attack and can't be
    taken - `chess4CanTake`), `chess4LegalPos`. Kings are never taken.
  - **`chess4Play(g, { from, to })`** plays the move of the player up (null if
    it isn't legal) and says what happened (`san`, `cap`, `pts`, `castle`,
    `promo`, `events`); `chess4Settle` then judges whoever is up: out players
    skipped, no move and in check is a mate (FFA: out and +20 to `giver`;
    teams: the other team wins), no move and not in check is a stalemate (FFA:
    out, +20 to themselves) or a pass (teams), the fifty-move rule and the
    600-move cap. `chess4Eliminate(g, seat, why)` is resigning, the clock and
    leaving (FFA: out and the turn moves on, judged again; teams: the loss).
  - **The computer** (`chess4BotMove(g, level, { nodes, rnd })`): easy is one
    move deep - a capture if there is one, bigger more likely, with chance in
    it; hard a paranoid alpha-beta (the bot, and in teams its partner, against
    everyone else) deepening a ply at a time up to a whole round of the table
    inside a node budget (`CHESS4_BOT_NODES`, 20,000; a node ceiling, never a
    clock), captures first; its judgement is material, the points (FFA),
    pieces left hanging (`chess4LeastAttacker`), development toward the middle,
    pawns on their way and the pawns round the king; it picks at random among
    moves within 8 centipawns of the best. Measured on this PC: about 11 ms a
    move, the worst about 30 ms.
- **`RoomChess4.js`** (bundled after `RoomChess.js`): `shared.lobby` holds the
  host's way to play, clock and colours (`options`, `seats { order, watch }`),
  so every phone sees them; `chess4LobbyOrder` fills the empty colours from the
  room (people first) and is mirrored on the page by `ch4RoomOrder`. `start`
  seats bots in any colour left empty; the game is `shared.g` with `seats`,
  `names`, `replaced`, `clock { left, at, moved }` (the server's time; the
  first move of each player free), `last`, `log` (the last 80: `mv` with the
  SAN, the squares, what was taken, the points, the castling rook, `auto`;
  `out`, `pass`, `mate`, `lost`, `bot`, `start`, `over`, each numbered), `turnSeq`
  (every move carries it as `seq`: a stale tap is dropped), `wins` and
  `board`. `skipTurn` (host) plays an easy move marked `auto: 'host'`;
  `resign`; `chess4Deadline` / `chess4Timeout` the flag; `chess4PlayerLeft`
  (FFA out; teams: a hard bot under the leaver's name takes the seat,
  `replaced`). Play again turns the table by one. `ROOM_BOT_GAMES.chess4`
  (max 4); no forced moves (a move is always a choice).
- **`JS_RoomChess4.html`** (section 36 of `Style.html`):
  - **The board** is a grid of 14 × 14 spans (the corners empty) with the
    pieces a layer over it, each placed by transform (`--x`, `--y`), turned by
    quarter turns so your colour is at the bottom (`ch4Cell`, `ch4SqAt`: seat
    = the number of turns; a watcher and the TV see red at the bottom). The
    squares use the chess board's own tokens (`--ch2-light`, `--ch2-dark`,
    `--ch2-last`, `--ch2-hint`, `--ch2-check`). The pieces are the chess set's
    drawings (`CH2_SHAPES` in `JS_Chess.html`) as a second set of `<symbol>`s,
    `ch4pc-{r,b,y,g,x}{kind}`, filled from the `--ch4-*` tokens (a gradient and
    an outline per colour, `x` grey).
  - **Playing**: a tap on your piece shows its moves (`ch4-hint` a dot,
    `ch4-ring` round a capture), a tap on a square plays; or drag. Your move is
    played on a copy with `chess4Play` and drawn at once (`ch4Local.early`);
    the server's log entry for it is then not slid again; refused, the room's
    board comes back.
  - **Motion**: every new log entry since the last drawn (`ch4Local.seen`)
    plays - a move slides 150 ms, a capture fades under it, a castling rook
    follows, a promotion pops, the points fly to the scorer's chip
    (`flyPoints`) and count up; a mate topples the king (it stays toppled),
    and a player out turns grey piece by piece from the king outward. A reload,
    a new game or the TV coming on draws the board as it is.
  - **The chips** sit in the cut corners (`ch4-corner--bl` for the one at the
    bottom, round the board clockwise), sized from the board (a size
    container), with the colour, the name, the points (FFA), the clock, a
    pulsing ring for the one to move, «برّه» and why for a player out, a gold
    ring for the winners.
  - The lobby is the four colours round a cross (`.ch4-seats`, laid out left
    to right in every language, like the board); the host taps two to swap, a
    watcher then a colour to seat them, ✕ to take someone off.
  - The end: a podium by points (FFA, `renderPodium`) or the winning team's
    banner, with confetti for the winners and on the TV.
  - Upright: the status, the board, resign / the host's "play for", the log,
    the room strip (the end card on top). A phone on its side and from 900 px:
    the board beside a column. The TV: the board as tall as the stage, the
    column (the sides, the status, the end, the log, the host's buttons)
    beside it.
- Tests: `rules.mjs` (the board and the start, the order, castling both ways
  and through an attacked square, promotion rows per mode and per colour,
  check from two players, a partner never checks, a mate judged on the turn
  with its +20, grey walls, stalemate out / pass, the points, teams won by
  either mate, resigning, the fifty-move rule, 80 whole bot games, the room:
  the lobby, bots in empty colours, turns, stale taps, the clock, "play for",
  resigning, leaving both ways, play again, six whole room games of bots);
  `leaks.mjs` (a game each way with two people and bots); `play-all.mjs`
  (`--only=chess4`: teams with two people, two bots and a TV, a leaver
  replaced, resigning, play again; FFA with one person and three bots on the
  clock).

### حرب السفن

The owner's rules are in *The owner's specs*. Three files and a stylesheet
section (27):

- **`Battleship.js`** (shared, no DOM). A fleet is five `{ x, y, d }` in
  `BS_SHIPS` order (x the column A-J, y the row 1-10, `d` 'h' running right or
  'v' running down); a cell is `y * 10 + x`. `bsFleetProblem` says why a fleet
  can't sail (`shape`, `out`, `overlap`, `touch` - touching includes a
  corner), `bsCanPlace` whether one ship fits beside the rest (the drag and
  the turn use it), `bsRandomFleet` deals one. A **sea** is what the other
  side knows: `{ grid, sunk }`, the grid 100 cells of `BS_SEA`, `BS_MISS`,
  `BS_HIT`, `BS_SUNK` or `BS_CLEAR` (water round a sunk ship, marked by the
  game). `bsFire(sea, fleet, cell)` is the one rule for a shot: it changes the
  sea and says `miss`, `hit` or `sunk` (with the ship, its cells, the water
  marked and `over`). **The admiral reads a sea, never a fleet**
  (`bsAiShot`): easy fires at random at water not marked; medium hunts at
  random and after a hit works along the ship (`bsTargetCells`); hard counts
  every way the ships afloat could still lie (`bsDensity`: a way is out if it
  covers a miss or marked water, or if a hit touches it without being on it,
  since ships never touch; with hits on the board only the ways through them
  count, weighted by how many they cover) and, hunting, keeps to the parity
  of the smallest ship afloat. Measured over 60 fleets: hard 41 shots, medium
  51, easy 87 to sink a fleet; hard beats easy 60 of 60 head to head.
- **`RoomBattleship.js`** is the room: `shared` carries the duel's fields plus
  `phase` ('place' | 'play' | 'over'), `settings.turnClock`, `ready`, `seas`
  (seat k fires at `seas[1 - k]`), `turn`, `turnSeq` (raised at every shot:
  a shot carries it as `seq`, so a double tap is dropped), `shots`, `last`
  (the newest shot: seat, cell, result, the ship on a sinking), `tally`,
  `endsAt` and `reveal`. The server deals each seat a random fleet at the
  start (`place` replaces it with the phone's, checked with
  `bsFleetProblem`; `unready` takes it back). A seated player who leaves loses
  by forfeit, as in the duels.
- **`JS_Battleship.html`** is everything on the page:
  - **One sea view per page** (`bsView`): a root element holding the canvas,
    the labels, the peek pill and the result toast, **moved** into whichever
    screen shows a sea (`bsViewShow(host, model)`), so there is only ever one
    WebGL renderer, and a room frame that is rebuilt (`renderRoomFrame`) never
    loses its canvas - the root is appended to the new host. It is thrown
    away (`bsViewDrop`: geometries, materials, textures, the renderer, the
    context) when no screen shows a sea (`onLeaveScreen`, and
    `onRoomClocksReset` when the room leaves the game); the loop skips a
    frame while the root is out of the page or the tab is hidden, and draws
    every other frame when nothing is moving.
  - **A model** (`bsPhoneModel`, `bsRoomModel`) says what to show: two seas
    (side 0 is yours - or the first seat's for anyone watching and the TV -
    side 1 the other), their grids and sunk ships, the fleets that may be
    drawn (your own; a sunk ship; everything once over), which sea the camera
    frames (the one being fired at; `peek` lets a player look at the other
    for the turn), the newest shot and its key (animated once per phone),
    the aim, and the input (placing or firing).
  - **The 3D sea** (`bsMake3D`, three.js from `loadThree`): ACES tone
    mapping, a sky gradient as a PMREM environment (a dusk one in dark mode),
    a sun with soft shadows; the water is a `MeshPhysicalMaterial` whose two
    tileable canvas normal maps (sine waves with whole-number directions, so
    they repeat without a seam) scroll different ways under a clear coat;
    each sea's board is a transparent canvas texture on the water (the lines,
    the letters and numbers, the marks: a white ring for a miss, a glow for a
    hit, a red outline round a sunk ship, a dot on marked water), redrawn
    only when the sea changes. The ships are built from extruded hull
    outlines (a pointed bow, red below the waterline, the side's colour as a
    stripe), each kind with what makes it recognisable: the carrier's flight
    deck (a canvas texture), island and parked jets; the battleship's three
    turrets, tower and funnel; the cruiser's two turrets and radar; the
    submarine's low hull and sail; the destroyer's single gun; foam round
    every hull; radars turn, ships bob. A shot is a shell on a parabola from
    one of the shooter's ships (muzzle flash) or from over their sea, with a
    glowing tail and a smoke trail, then a splash (a water column, a ring) or
    a blast (a flash of light, fire, sparks, smoke, a small camera shake);
    hits keep burning and smoking; a sinking blows square by square, and the
    ship lists, dips and settles low, charred, still there to be seen; at
    the end the revealed fleet rises from the water. Particles are two pools
    (`bsParticles`: additive for fire, normal for smoke and spray) in one
    `Points` each, updated on the CPU. The camera frames a sea (or both on
    the TV) by searching for the distance at which the board's corners fit
    the canvas at the angle for its shape (58° upright, 52° wide, 46° for
    both), glides between seas, and puts the other sea away once settled.
    Picking is a ray onto the water plane (`pick`): the square under a
    finger. **A shot's result is never shown before its shell lands**: the
    sea keeps its state from just before the shot (`bsSeaBefore` works it
    out from the shot itself) until the landing, and the page holds its
    status, pills and camera the same way (`bsPhoneLocal.flying`,
    `bsRoomLocal.flying`), then `onLand` says it with a toast.
  - **Your own shot leaves as your finger lifts** (the duels' "your own move
    at once"): in a room `bsRoomFire` calls the renderer's `launch`, the
    shell flies, and the server's answer lands it; refused, it never lands.
  - **The flat sea** (`bsMakeFlat`, `bsFlatSeaHtml`): where WebGL can't draw
    or three.js can't load (offline before a first 3D visit), the same model
    as DOM - a 10×10 grid with its letters and numbers, bars for ships, the
    same marks, the same picking, drag and turn. The small map of the other
    sea beside the big one uses the same builder.
  - **Placing** (`bsWireInput`, `bsTurnShip`): a press on a ship picks it
    up, a drag moves it square by square (its footprint green or red), a drop
    where it touches another goes back with a shake; a tap turns it about its
    first square, pushed back onto the board or to the nearest place it
    fits. In a room the fleet being moved is kept in sessionStorage for a
    reload (`bsRoomDraft`).
  - Against the phone: `appState.battleship` (restored through
    `soloRegister`), the admiral fires after the shell has landed and the
    camera has come round (`bsPhoneMaybeAi`).
  - Sounds from `fxTone` / `fxNoise` (`bsSound`: the gun, the whistle, a
    splash, a blast, a sinking, a clunk when a ship is set down); the TV is
    the room's one voice (`duelRoomLoud`).
- **Layout** (section 27): upright, the pills and the status, then the sea
  (about square, sized so the bar under it stays on the first screen), then
  what to do, then the small map and the fleets; on a phone on its side and
  from 900px the sea takes the height and the rest is a column beside it;
  the TV is both seas across the stage with the pills, the fleets and the
  line beside them.

### بولينج

- **`Bowling.js`** (shared, no DOM; inlined into the page through
  `SHARED_LISTS` and bundled into the Worker before `RoomGames.js`). Plain
  arithmetic only (`+ - * /`, `Math.sqrt/floor/abs/min/max`, a polynomial
  `bowlSinCos`), so the server and every phone get the same pins down from the
  same four whole numbers `{ x, aim, speed, spin }` (`bowlCleanShot` clamps
  and rounds them). `bowlStart` / `bowlStep` (1/240 s) / `bowlRun` /
  `bowlThrow`; the pins are circles on the deck - a standing pin its base, a
  falling or lying one also its belly and its head along the way it fell - so
  a pin that goes down sweeps its neighbours (the pin action that turns a
  pocket hit into a strike). A lying pin spins round its middle (`spinZ`,
  capped and damped). The hook grips once the oil runs out (12.2 m) and stops
  when the ball rolls out (`HOOK_MAX`, 0.85 m/s: 5-6 degrees into the pins at
  full spin); the ball slows `BALL_DECEL` down the lane. The ball always carries on into the pit
  once it has hit (it used to stall among the lying pins). `hopAt`/`hopV` are
  for the page only (a pin hit hard is lifted into the air for a moment).
  The score sheet: `bowlScore`, `bowlFrameNext`, `bowlMarks` (X / - …),
  `bowlBallKind`, and a card: `bowlNewCard`, `bowlApply` (one ball onto it,
  and the rack for the next), `bowlTotal`. `bowlGentleShot` is the clock's
  ball. **Every number of the pins' physics is a named constant in `BOWL`**
  (restitutions, the knock thresholds - `KNOCK_BALL` for the ball, lower, and
  `KNOCK` for a pin, higher, so a gentle nudge rocks a pin rather than setting
  off a chain of dominoes - the frictions, how fast a pin goes over, the
  spin a glancing hit gives, the kickbacks), found by a search that rolled the
  ball into a full rack at every spot from 22 cm left of the head pin to 26
  right, at 0-8 degrees and three speeds, and matched the strike rate of each
  against the pin-carry study's shape. `rules.mjs` holds the result: the
  pocket at 6 degrees strikes at least 70%, a straight ball into it 20 points
  less, head-on mostly splits, a light hit and the far side seldom strike, the
  two pockets of a straight ball carry alike, a touch takes a lone pin, and a
  full hook reaches the head pin at 5-8 degrees. A ball hooking right (spin +)
  carries into the pocket left of the head pin (the 1-2), one hooking left
  into the 1-3. Every throw settles within about 1.5 s of the first hit.
- **`RoomBowling.js`**: `shared` holds the whole game (nothing is secret):
  `order`, `cards`, `turn`, `turnSeq` (raised every ball; a throw carries it,
  a stale one is dropped), `throwSeq` and `last { seq, pid, shot, before,
  after, down, kind, ms, auto }` - the ball every phone replays. The server
  runs the throw itself (`bowlRun`) and is the authority. `readyAt` is when
  that ball has been watched (`ms` + `BOWL_SET_MS` 4.2 s: the verdict, the
  sweep, the rack set again); the turn clock (`endsAt`) counts from it.
  `skipTurn` (host) and the clock throw `bowlGentleShot` with `auto: 'host' |
  'clock'`. `bowlPlayerLeft`, `bowlDeadline` / `bowlTimeout`. `board` only at
  the end; `wins` across play again; `winners`.
- **`JS_Bowling.html`**:
  - **The lane** (`bowlGfx`): one renderer per page, made when a bowling
    screen opens (`bowlGfxMount(stage)` loads three.js with `loadThree`, builds
    the hall once) and thrown away when it closes (`onLeaveScreen`, and
    `onRoomClocksReset` when the room leaves the game); the canvas moves into
    whichever screen shows the lane. Pixel ratio ≤ 2, smaller shadow maps and
    lathe on small screens, the loop runs only while something moves (a
    throw, the setter, the camera easing, a drag) and a hidden page plays a
    ball out at once. No WebGL, or three.js not loaded (offline the first
    time): a message over the lane (with "try again"); in a room that phone
    gets a "roll a plain ball" button so the game never waits on it. The
    context lost by the GPU rebuilds the lane; the loss we cause when
    disposing is ignored (see *Traps*).
  - **The hall**: the lane, deck, approach with dots, arrows, foul line, metal
    gutters, caps, kickbacks, the pit, four lanes beside it with their pins
    (one `InstancedMesh`), the masking unit (no words), light strips, overhead
    screens, a ball return with two house balls, blob shadows under the pins
    (the sun's shadows only cover the lane near the camera), PMREM reflections,
    ACES, soft shadows.
  - **A ball**: `bowlGfxThrow(standing, shot)` plays the sim in real time and
    resolves when the pins settle; the camera rides behind the ball and holds
    on the pins. `bowlGfxSet(next, { fresh, hold })` is the pinsetter: the
    sweep bar drops, the deck comes down and lifts what still stands, the bar
    sweeps the fallen pins into the pit, the rack (the lifted pins on their
    spots, or a new ten) is set down, then the camera comes home while the
    ball rolls back from the return. Sounds are made on the app's audio
    context (`bowlRumbleStart` a rolling rumble following the ball's speed, a
    hollower one in the gutter; `bowlSound('crash' | 'clack' | 'sweep' |
    'return')`), the strike: the deck lights flare, `tada`, confetti, the word
    in gold with pins flying out of it; the spare `ding`; a gutter the duels'
    sigh.
  - **The swing** (`bowlSwingShot`, a pure function of the finger's path;
    `bowlShotFrom`, `bowlSwingBall`): every point the finger passes
    (coalesced pointer events, each with its place on the screen and on the
    lane) is kept. The ball follows the finger across the approach
    (`bowlSwingSpot`: ray-cast onto the lane, up to `BOWL_BACK_MAX` 1.6 m
    behind the line and `BOWL_BALL_X_MAX` across); the farthest point back
    starts the forward swing. **The line is the backswing's**: a least-squares
    fit on the lane through the steady pull back that ended there (a sideways
    slide first isn't part of it, nor the top 15% where the finger turns),
    once it is `BOWL_PULL_MIN` 0.2 m long; with less, the push's own fit. On
    the way forward the ball is kept on that line (`tr.back`), so it crosses
    the foul line exactly where the guide starts and the guide holds still.
    The speed is the push's last 120 ms in screen heights a second, times 0.75
    to 1.25 by the backswing (how far back from where it was picked up, up to
    a sixth of the screen); the spin is the push's bow off its chord **on the
    screen** (on the lane perspective flattens the far half to nothing), with
    a dead zone (`BOWL_HOOK_DEAD`) so a nearly straight thumb throws straight;
    middle to the left of the chord hooks right. The throw is still the same
    four numbers, so rooms and replays are untouched; only your own ball
    starts from your hand (`g.release`, carried to the line in
    `BOWL_RELEASE_S`). `rules.mjs` pins it: an arcing push leaves the line
    where the backswing set it at every step and hooks; a slide across first
    doesn't aim; a slanted backswing aims along its slant. `touch-action: none` only while it is your throw
    (`.bowl-canvas.is-live`).
  - **Solo** (`appState.bowling`, `soloRegister('bowling')`): a ball's result
    is written and saved *before* it is shown (a reload can't take a bad ball
    back); the sheet shows the card from before the ball until the pins have
    fallen. Bests `soloRecord('bowling', '5' | '10', { score })`; the end is
    the solo result sheet (the score, strikes and spares, a new best) and a
    card over the lane (again / options). Reload mid-game comes back to the
    rack.
  - **A room** (`ROOM_GAMES.bowling`, `TV_GAMES.bowling`): every screen replays
    `shared.last` from its `before`, a ball behind the server - the sheet, the
    list and the overhead screen move on when the pins have fallen
    (`bowlRoom.cardsAt[throwSeq]`). The thrower's own phone plays the ball as
    the finger lifts and waits for the server's word; if the clock or the host
    threw for it a moment before, that ball is shown instead. Two balls
    behind, or a reload, or a late join: the lane just shows where the game
    is. The result screen waits for the last ball to be seen
    (`bowlRoomOver`). Host "play for" after 40 s from `readyAt`, or at once
    for a phone that's gone.
  - **Layout** (section 28 of `Style.html`): the lane gets the screen. A
    phone upright: the lane is the play area's height, everyone's sheet under
    it; on its side and from 900 px: the lane beside a narrow column (names
    and totals only on a phone's side); the TV: the lane big, every sheet
    beside it. The sheet over the lane is light on dark at every theme (it
    sits on the hall) and left to right in every language, like a real card.

### ميني جولف

The owner's rules are in *The owner's specs*.

- **The course** (the third round, 23 Sep 2026): `GOLF_HOLES` is sixty holes,
  each with `lvl` 1 easy, 2 medium, 3 hard (twenty each, the array in that
  order). `golfHoleById`, `golfLevelIds(lvl)`, `golfCourseSplit(count,
  level)` (one kind, or `'mix'`: a third of each, a hole left over going to
  the easier kinds) and `golfDealCourse(count, level, pick)`: the ids of a
  game in the order played, `pick(ids, n, lvl)` choosing within a kind - the
  page's `freshPick('golf_' + lvl, …)`, the server's `nextPrompts(room, ids,
  'golf_' + lvl, n)` (from `start` and `playAgain`, both `DEAL_ACTIONS`), a
  shuffle when none is given. `golfParOf(list)` adds up what a list asks for.
  `GOLF_LEVELS` is `easy`, `medium`, `hard`, `mix`. A room keeps the ids as
  `shared.holes` and `settings.level`; `s.hole` is an index into that list
  (`mgCourse`, `mgHole`). The new holes were drawn with a small geometry kit
  (arcs, rounded boxes, corridors round a centre line, blobs) and written out
  as plain numbers, as the old ones were; their comments say what each is.
- **`MiniGolf.js`** (shared, no DOM). A hole is x to the right and y away from
  the tee in course units (about 10 cm each): `green` (one polygon; its edges
  are rails), `walls` (more rails), `blocks` (solid polygons with a `look`:
  rock, mill, pyramid, tower, jar), `sand`, `water`, `hills` (a smooth hump -
  or a dip with `push < 0` - running along x or y, profile `16u²(1-u)²`, whose
  pull is its slope), `bowls` (a round dip pulling to its middle), and the
  moving pieces: `mills` (a tunnel's door shut while a sail hangs in front,
  `golfMillShut` - no trig), `sliders` (a gate eased to and fro,
  `golfSliderAt`) and `spinners` (a bar turning round a post; its ends from
  `golfSinCos`, a polynomial, because `Math.sin` may differ in the last bit
  between engines). A moving piece hits the ball with its own speed at the
  point of contact (`golfSegHit`'s `wvx, wvy`), so a beam or a gate knocks it.
  A putt is `{ dx, dy, power, t0 }`, whole numbers (`golfCleanShot`); `t0` is
  the hole's clock in ms at the putt, which is all the moving pieces read.
  `golfStart` / `golfStep` roll it at 240 steps a second; `golfPutt` rolls it
  to the end: `rest`, `cup` (slow enough over the cup - firmer over its
  middle than across its rim - or it lips out) or `water` (back to where it was
  hit from, 2 strokes). A ball can't come to rest where a moving piece will
  reach it (`golfInSweep`), so it is never left inside a door or a beam's
  circle. `golfField` is a grid of every place a ball can lie and how far each
  is from the cup round rails, blocks and water (Dijkstra, cached per hole);
  `golfAutoShot` aims straight at the cup when nothing is in the way, else at
  the square in sight that is farthest along, with only the strength to get
  there - the clock's gentle putt and the host's "putt for". `golfHeight` is
  the ground's height for the screen only.
- **The pieces added on 23 Sep 2026** (all in `golfMove`, one ball's step,
  kept bit for bit the old step for the old pieces): `ice` / `mud` polygons
  change the drag (`GOLF.ICE` 0.55, `GOLF.MUD` 24 against the green's 3 and
  sand's 13; `golfDragAt`); `pads` (`{ x, y, dx, dy, w, l, push? }`, a
  rectangle along its arrow) add `GOLF.PAD` along it; `belts` (an
  axis-aligned rectangle and `{ vx, vy }`) bring the ball to their speed
  (`GOLF.BELT_GRIP`) instead of the drag, and a ball can't rest on one;
  `portals` (`{ x, y, ox, oy, dx, dy }`) take a ball within three quarters of
  `GOLF.PORTAL_R` and put it out at `ox, oy` with its speed along `dx, dy`
  (`warp` on the ball for the screen); `bumpers` (`{ x, y, r }`) send the
  ball out at `GOLF.BUMPER` times its speed, between `BUMPER_MIN` and
  `BUMPER_MAX` (`bumped[k]` on the sim); `ramps` (`{ x, y, dx, dy, len, w }`,
  the foot and the way up) pull `GOLF.RAMP_G` back down, and a ball over the
  lip still going up flies (`air`, `z`, `vz`, `AIR_G`): in the air it meets
  only the fence and the blocks (`golfTallSegs`), lands at `GOLF.LAND` of its
  speed, and only then the water or the cup counts; `gates` (`{ x1, y1, x2,
  y2, dx, dy }`) are a rail only to a ball on their far side coming back
  (`golfGateHit`, `flaps[k]` when one swings). Rails beside a ramp are plain
  `walls`; the screen raises them with the ramp.
- **Other balls** (in turns): `golfStart(hole, from, shot, others)` makes a
  body of each (`golfBody`; the sim itself is the putter's body, so a sim
  with no others is exactly the old one), `golfStep` moves every body that
  isn't at rest and then `golfBallsMeet`: equal balls, the knock along the
  line between them with `GOLF.BALL_BOUNCE`; a ball at rest that is touched
  rolls again (`moved`); balls lying on each other at the start pass through
  until they part (`ghost`). `sim.done` is every ball stopped, sunk or wet.
  `golfPutt(..., others)` adds `moved: [{ id, end, at, wet }]`; a wet ball's
  spot is `golfWetSpot` - where it lay, or the tee when another ball's final
  place is within a ball's width. The order of the list (the room's order) is
  part of the result, so every phone lists them the same way.
- **The field and the gentle putt** know the new pieces: `golfGateBlocks`
  refuses a step against a gate or a conveyor (in `golfField`,
  `golfDistance` and `golfClearLine`); ramps, bumpers, the middle of a
  sliding gate and a beam's post are not places to lie (`golfOpen`); a clear
  line keeps 0.45 from the water on either side; `golfSpeedFor` is the speed
  that stops a ball at a point over this ground (drag in, pads out), which the
  gentle putt and the tests' search use. Portals and ramps are shortcuts the
  field never needs: every hole can be walked.
- **`RoomMiniGolf.js`**. Nothing is hidden: everything is `shared` (`phase`
  'play' | 'between' | 'gameover', `settings { mode, holes, guide, clock }`,
  `hole`, `startedAt` - the server's clock when the hole started - `stamp`,
  `order`, `balls { pid: { at, n, done, restAt, clockAt } }`, `shots { pid:
  the last putt }`, `shotSeq`, `turn`, `card`, `board` lowest first, `wins`).
  A putt carries `hole` and `n` (the strokes the phone saw), so a stale tap is
  dropped. **The phone's `t0` is taken when it is within 1.5 s of the server's
  own** (`MG_T0_SLACK`), else the server's; the server runs `golfPutt` and
  writes the result. The clock (`mgDeadline` / `mgTimeout`) is per ball all at
  once (from when it came to rest, or the hole's name card) and for the player
  up in turns; running out, it plays `golfAutoShot`. 'between' moves on at
  `nextAt` (7 s after the last ball stops), or on the host's `nextHole`. A
  ball is picked up at `golfMaxOf(h)` strokes and counts one more. In turns
  `mgOthers` is every other ball with `n > 0` and not done, in `order`; the
  putt keeps them as `shots[pid].others` (where they lay before it) and
  `moved`, and the server moves those balls (one knocked into the cup is done
  with its own `n`). The phone makes the very same list (`mgRoomOthers`).
- **`JS_MiniGolf.html`**:
  - **One 3D engine per page (`MG3`)**: one `WebGLRenderer` (pixel ratio ≤ 2,
    ACES tone mapping, soft shadows, a sky environment from `PMREMGenerator`),
    moved into whichever screen shows the course - solo, a room's phone, the
    TV - and **disposed when the course leaves the screen** (`onLeaveScreen`,
    and the loop lets go of a canvas that has been off the page 1.5 s). It
    draws at the screen's rate while something moves (a roll, a pull, a
    windmill), 30 frames a second when only the flag and the water move, and
    not at all while the page is hidden. Textures are drawn on canvases once
    per engine (mown grass, rough, sand, rails, stone, sandstone, planks,
    clay, bark, ripple normals, the ball's dimples). A hole's meshes are built
    by `mg3SetHole` and thrown away with it (`mgKeep`); everything repeated
    (trees, bushes, flowers, fronds, studs) is one `InstancedMesh` each.
  - **The camera** (`mg3Fit`) finds the nearest distance that keeps the whole
    hole in view, both ways round - up the screen away from the tee, or the tee
    on the left - and turns it when that shows it clearly bigger: an upright
    phone gets the hole upright, a phone on its side, a laptop and the TV get it
    across. The HUD's margins are `MG3.pad`.
  - **The pull**: `pointerdown` anywhere on the course starts it, the arrow
    grows from the ball in the direction of the putt (green to red with the
    power), a dashed rubber band runs back to the finger, and with the guide on
    the path is dotted (`golfStep` from where the ball lies, at the hole's
    clock). Seven course units of pull is full power. Letting go sends it.
  - **A roll on the screen is `golfStep`**, the server's own steps, played in
    real time (`mg3Play`). A putt from another phone starts already
    `off` seconds in - the hole's clock now minus its `t0` - so every ball
    moves in the one timeline the windmill turns in; one that is over by the
    time it arrives (a reload, a phone that slept) is simply put where it lies.
    Your own putt rolls as your finger lifts, and the server's copy of it,
    when it comes, is recognised and not rolled twice (`mgRoom.pending`).
  - **The hole's clock on a phone** is the server's: `mgRoom.offset` is the
    smallest gap seen between `shared.stamp` (the server's time of the last
    change) and its arrival, so the phone's clock is at most one network
    delay behind the server's - well inside the 1.5 s the server allows.
  - Motion: a new hole's card flies in and up to the strip (`mgNameCard`,
    once per hole), a putt's tock, a rail's knock, sand puffs, a splash (rings
    and droplets) and the ball back on its spot, the ball sinking with the
    flag jumping and a ring, the word for the hole (هول إن وان!، بيردي!…) as a
    banner, the card's totals counting up (`mgCountTotals`, `countUp`), the
    podium at the end (lowest first: `renderPodium` given a mirrored board, as
    سكرو does) with confetti. Sounds are made with `fxTone` / `fxNoise`; with a
    TV in the room only the TV plays other people's balls.
  - Layout: the course takes the whole view at every size (`view--fill`), the
    strip of chips over it at the top, the players' chips and the line at the
    foot, the card between holes and the end as a card over it. The TV is the
    course with the players and the scorecard in a column beside it.
  - Solo lives in `appState.minigolf` and is restored through `soloRegister`;
    a putt's result is kept the moment it is hit, so a reload mid-roll comes
    back to where the ball ends. The game's holes are `s.game.course` (ids,
    drawn at start), its kind `s.game.level`. The best total per length and
    kind is `soloRecord('minigolf', 'mix:6' | 'hard:9' | …)` (`mgBestKey`).
  - **The strip and the cards read the game's own list** (`mgCourseOf`,
    `mgRoomHoles`, `mgRoomHole`, `mgSoloCourse`): the hole's name, a chip of
    its kind (سهل / متوسط / صعب), «المطلوب n · أقصى m» (`mgParMax`), and a
    scorecard whose «المطلوب» row is each played hole's own (`mgCardHtml(rows,
    course, …)`).
  - **The new pieces on the screen** (`mgPadMesh`, `mgBeltMesh`,
    `mgRampMesh`, `mgBumperMesh`, `mgPortalMesh`, `mgGateMesh`; ice and mud
    as flat glossy polygons with a rim): a pad's amber arrows and a belt's
    ribs run on their own texture (`mgOwnTex`) and a portal's swirls turn -
    ambient movers, so an idle hole still draws at 30 frames a second; a
    bumper's cap flashes and the post swells when `bumped[k]` changes, a
    gate's flap swings open the way through and falls back after `flaps[k]`.
    A flying ball is drawn at the rules' height (`z`); `mg3ShowBody` plays
    each ball's moments (sand, mud, ice, a pad, a jump and its landing, a
    portal's two rings, a knock, a bumper, the cup, the water) with sounds
    `knock`, `bump`, `warp`, `whoosh`, `mud`, `jump`, `land`, `flap`, `ice`.
  - **Knocked balls** move with the roll that hits them: `mg3Play` marks each
    ball of `sim.others` `drivenBy` the putter, `mg3SyncBalls` leaves it alone
    until the roll is done (`want` keeps where the table says it lies), and
    where a wet one goes back to comes from the putt's result (`returns`,
    from `moved`, or the phone's own `golfPutt` for its own putt). A newer
    roll that takes a ball another roll is still moving ends that one at once
    (a screen that fell behind). In turns a ball not yet hit from the tee is
    off the course: only the player up waits on the tee.
  - **The sixty holes' places** (the third round): `MG_LOOKS[id].ground` puts
    a course on the sea, the moon (with a night sky), a tiled floor or paving
    instead of the rough (no trees scattered there); `planks` / `kerbs` lay a
    plank walk; `MG_BLOCKS` draws a hole's obstacles as what they are there
    (a flagpole with Egypt's flag, a bench, training cones, toy blocks with
    studs, the giraffes' paddock, a lit Ramadan lantern, a sandcastle,
    painted eggs, a fountain, a dovecote, pylons, metro pillars, suitcases,
    Qaitbay's keep, the Sphinx, a golden sarcophagus, chalk mushrooms,
    corals, Abu Simbel's colossi, rams, a library desk, trays of kahk, a
    wheelhouse, deck chairs); new `MG_DECO` pieces (hot-air balloons that
    bob, buildings, giraffes, acacias, umbrellas, stadium stands, toy piles,
    a metro train, an airliner, planets, hills, crocodiles, bookcases,
    arcade machines, a small mosque, stars). The scattered trees keep 2.6
    units from every rail (`mgScenery`'s `edgeGap`), not just off the
    course's box. A tall piece never stands on a near side: the camera looks
    from the tee's end on an upright phone and from the +x side on a phone on
    its side or a big screen.
  - **Each hole's own place** is `MG_LOOKS` (its scenery from `MG_DECO`:
    palms, a felucca, a fountain, a ferris wheel, minarets, a crane and
    containers, Karnak's columns, pines, snowmen and the monastery, Cairo
    Tower…; `snow` and `desert` turn the rough to snow or sand), and new block
    looks `salt`, `snow`, `stall` and `obelisk`.
  - Past nine holes the scorecard is two tables (`mg-card--two`): the first
    nine with their sum («أول 9»), then the rest with the total.

### لودو

The owner's rules are in *The owner's specs*. Four files and a stylesheet
section, the way the duels are built:

- **`Ludo.js`** (shared, no DOM). The board is the classic 15 x 15 cross,
  counted from the top-left, left to right in every language:
  `LUDO_TRACK_CELLS` is the 52 track squares from G's start, going round
  clockwise; `LUDO_HOME_CELLS` each colour's column; `LUDO_YARD` and
  `LUDO_SPOTS` the yards. Yards: G top-left, Y top-right, B bottom-right, R
  bottom-left, and turns go G, Y, B, R. A piece's place is a number from its
  own start (-1 yard, 0..50 track, 51..55 its column, 56 home); `ludoGlobal`
  turns it into a track square and `ludoCellOf` into a place to draw.
  A game is one plain object shaped like a room's `shared` (`seats`,
  `colors`, `pieces`, `turn { pid, stage, dice, sixes }`, `movable`,
  `places`, `phase`, `turnSeq`, `events`), so the server uses it as its
  `shared` and the phone keeps it in `appState.ludo.g`. `ludoRoll` and
  `ludoMove` apply the rules and write the events every screen animates
  (`rolloff`, `roll`, `three`, `nomove`, `move` with `cap`, `finish`, `over`);
  `ludoTarget` is the one rule for where a piece goes (the 6 out of the yard,
  walls, the exact number home, captures off the safe squares);
  `ludoOnlyMove` the forced move (never the finishing one); `ludoBotPick` the
  computer players - easy picks any move, hard scores each (a capture, home,
  into the column, out on a 6, out of reach, onto a safe square or a wall,
  never into reach of a piece behind).
- **`RoomLudo.js`** is what a room adds: the lobby (`color` - anyone seated
  takes or lets go of a colour, the host may pick for a bot; `seat` - the
  host's four with five or more, `shared.lobby`), `start` / `playAgain` (the
  seats and colours, `ludoFillColors` for the rest, the roll-off rolled on the
  server, `shared.wins` kept), `roll` and `move` (with `seq`, a stale tap
  dropped), `skipTurn` and the clock (`ludoAuto`: roll, then the easy move),
  leaving (`ludoRemovePlayer`), `ROOM_BOT_GAMES.ludo` and
  `ROOM_FORCED_GAMES.ludo`. Nothing is secret: the whole game is `shared`.
  The roster is everyone in the room, so whoever watches still gets the
  board, and a latecomer is drawn the board too (`lateJoin`).
- **`JS_Ludo.html`** draws a game on any screen: `ludoBoardHtml` (the fixed
  squares built once, `ludoFixedHtml`, then the pieces placed in percent of
  the board, pieces sharing a square set a little apart), `ludoFrameHtml`
  (the strip of players, the board, the bar with the die, the log, and at
  the end the podium), `ludoAfterPaint` (the events not yet shown, played on
  the board) and `ludoWire` (a tap moves a piece; a mouse or the keyboard on
  a piece first shows the squares it would pass). The board turns so your
  own yard is at the bottom left (`LUDO_ROT`); a watcher's and the TV's are
  not turned. Against the phone lives here too: `appState.ludo`, the setup
  painter, `ludoLocalNext` (a computer player's roll or move, or your only
  move, after the motion has landed), registered through `soloRegister` for
  the reload.
- **`JS_RoomLudo.html`** is the room around it: the lobby's colour picker
  and seats, `ROOM_GAMES.ludo` and `TV_GAMES.ludo`, the turn clock, the
  host's "play for" button for a quiet phone, and the roll that starts the
  die spinning as the finger lifts (the number is the server's).
- **The motion.** Everything is drawn where it ends up, and the motion runs
  backwards from where it was (Web Animations of transform, `fill:
  backwards`, delayed one after another): the die (the app's 3D die,
  `DIE_LANDING`) tumbles to its number, a piece hops square by square (in the
  board's own turned frame, so the numbers are cells times the board's width
  over 15), a piece taken bursts and flies back to its yard spinning, a piece
  home bursts in its colour, and the first turn waits for the roll-off card.
  `ludoFx.busyUntil` holds the next frame (a room's, or the phone's next
  computer move) until the last flight has landed. Nothing replays after a
  reload, the lock screen or joining late. Four short sounds are added to
  `FX` (`ludoRoll`, `ludoStep`, `ludoCapture`, `ludoHome`); with a TV in the
  room only the TV plays the table's, a phone its own.
- **Fitting.** Upright: the players across the top, the board the width of
  the phone, the bar sticky under it. On a phone's side and from 900px the
  board takes the height (`--app-h`) with a column beside it; the TV's board
  is as tall as the stage (83% of 1280 x 720).

### The duels: كونكت ٤ and نقط ومربعات

Two games for two, each played three ways - two on one phone, one against the
phone, or a room where two play and everyone else watches - to the owner's
decisions of 21 Sep 2026 (*The owner's specs*).

**One copy of the rules.** `Connect4.js` and `DotsBoxes.js` at the root hold a
board model, the legal moves, a move applied, the line or box it made, and the
phone's player, with no DOM and nothing that runs at load. The page inlines
both (`SHARED_LISTS` in `tools/build-*.mjs`) and the Worker bundles both
(`FILES` in `rooms-worker/build.mjs`), so a disc on one phone and a disc in a
room are judged by the same `c4Play`, a line by the same `dotsPlay`. Every
top-level name is prefixed (`c4…`, `C4_…`, `dots…`, `DOTS_…`; the page files
use `duel…` for what both share), because the page and the Worker are each one
scope.

- **كونكت ٤**: a board is `{ cols, rows, n, grid }`, row 0 at the top, cells
  0/1/2; `c4Mode(4 | 5)` is the classic 7 x 6 or Hasbro's 9 x 6 with five in a
  row. `c4LinesThrough` returns every cell of every run of n or more through
  the disc just played, in order along the run, which is what lights the line
  one disc at a time; a run longer than n lights whole.
- **نقط ومربعات**: n x n boxes, lines numbered horizontal first (`r*n + c`,
  r = 0..n) then vertical (`n(n+1) + r*(n+1) + c`); `dotsGeom(n)` works out
  each line's boxes and each box's lines once per size. `dotsPlay` returns
  the boxes a line took, `again` (it took one and the board isn't full) and
  `over`.

**The phone as a player** never holds the page. `c4BestMove(board, me,
level)`: easy takes a win it sees three times in four, blocks half the time,
and otherwise drops near the middle at random; medium looks three plies ahead
and a quarter of the time settles for its second choice if that doesn't hand
over the game; hard takes a win, blocks a threat, then runs a negamax with
alpha-beta over columns ordered from the middle out, deepened one ply at a time
until `C4_BUDGET_MS` (250ms) is up, keeping the best move of the last depth it
finished. Its judgement of a position (`c4Evaluate`) scores every window of n
cells that only one side has discs in - a lot when it is one short - the
opponent's a little heavier than its own, and discs near the middle column.
`dotsBestMove`: easy takes a box most of the time and otherwise draws about
anywhere; medium always takes a box, never draws a third side while a safe line
is left, and in the endgame opens whatever gives away fewest boxes; hard does
what medium does, and also (1) while a dozen or fewer safe lines are left,
counts them out to the end (`dotsSafeSearch`, memoised, with its own time
budget) so that the other side has to open the first chain when that pays -
the long-chain rule in practice; (2) values the endgame exactly when what is
left is plain chains and loops (`dotsChainValue`: whoever must open picks the
cheapest; the other takes all, or takes all but two of a chain or four of a
loop and hands them back), counting a tangle where chains meet as one chain of
its size; and (3) plays the **double-dealing move** (`dotsDoubleDeal`: the
last two boxes of a chain, or four of a loop, left with one line) when what is
still to come is worth more than the boxes given away. Both searches also stop
at a node ceiling, not only the clock - see *Traps*. A thinking delay of
400-700ms (shorter while the phone runs down a chain of boxes) lets the move
be seen; the timer stops when the board leaves the screen (`onLeaveScreen`)
and starts again on the way back or after a reload.

**On one phone** (`JS_Connect4.html`, `JS_Dots.html`): the game lives in
`appState.connect4` / `appState.dots` (options, board, whose turn, who starts,
the tally, the typed names), so a reload comes back to the board exactly -
the phone's turn included - through `soloRegister` (the solo games'
registration, which gives `validViews`, `restoreView` and the setup painter
without a branch in `JS_Core.html`, as على راسك and the card scorers use it).
Start is a new match (the tally from nothing); "ماتش كمان" is the next game of
the same match, started by whoever went second. The setup screen carries the
one phone / own phones switch, the options, the level (against the phone) or
two optional names (two on one phone; `data-remember`), and "كمّل" for a game
left in the middle. A second tap within a quarter second is dropped
(`busyUntil`), so two on one phone can't play for each other by accident.

**Taking a move**: Connect 4 reads the column from where the finger or the
mouse is on the board (`c4Wire`): the ghost disc follows it while pressed or
hovered, and letting go drops there; `touch-action: pan-y`, so a vertical
swipe still scrolls the page and cancels the drop. The columns are also
buttons over the grid, for a keyboard (a click with no pointer,
`event.detail === 0`). Dots picks the nearest free line within 0.38 of a box
of the finger (`dotsLineAt`), shows it faintly while pressed, and draws it on
letting go (`touch-action: none` on a playable board), so on 8x8 a line can be
slid onto before it is committed; a tap in the middle of a box draws nothing.

**What both games draw** (the top of `JS_Connect4.html`): `duelPillsHtml` - the
two players as pills with their piece, name and score, and one ring that sits
on whoever is to move - and `duelPillsAfter`, which slides that ring over from
the pill it was on, counts a score up (`countUp`), and pulses the pill when the
same player moves again after a box; `duelSound` (a knock, a scratch, a pop, a
sigh, made with the soundboard's `fxTone` / `fxNoise`); `duelIso`, which
isolates a name inside a translated line (FSI ... PDI), or "Next: جمال vs هند"
reorders itself. Motion, per move (`c4AfterPaint`, `dotsAfterPaint`): the disc
falls from above the board to its cell, speeding up, with a small bounce, and
knocks on landing; the winning line lights one disc at a time (a CSS animation
on `.is-lighting`, whose end state is the ring the class already draws); a
full board shakes; a line draws itself from its first dot (`transform-box:
fill-box`), glows for a moment, and a box it took pops in with its owner's
colour and initial. Each is keyed with `motionFirst` (a room redraw doesn't
replay it) and sounds once per move (`duelOnce`, whatever the motion setting).
The end of a game waits for its reveal (`afterReveal`): confetti for any win
two on one phone, only for a human win against the phone, a sigh for a loss.

**In rooms: winner stays on** (`RoomDuels.js`; `connect4Action`, `dotsAction`
and `duelPlayerLeft` are all `RoomGames.js` dispatches to). Everything is
public, so it all lives in `shared` and there is no secret at all; the server
only checks that the move came from the seat whose turn it is, that it is legal
(`c4Play` / `dotsPlay` return null otherwise), and that it was drawn for this
board - every move carries `move`, the number of moves the phone saw, and a
stale one is dropped (`staleTap`). `shared.seats` is [first to move, second]
(seat 0 is red or blue), `line` the queue, `champ` who stays once a game is
over, `result`, `prev`, `streak`, and `scores` / `board` (wins, best first,
which the night's leaderboard banks and the TV strip shows). A game over
(`duelEnd`): the winner scores and stays, the loser goes to the back of the
line; a draw keeps the second seat (the champion, or whoever sat there in the
first game) and sends the challenger back. The next game (`nextRound`, any
player or the host, `{ round }` against a double tap) is seated by
`duelSeatNext`: the champion against the first in line, who moves first; the
same two alone in the room swap who goes first; no champion (they left), the
first two in line. The line is the old line plus anyone who has joined since,
in room order (`duelWaiting`), so a latecomer needs no hook - they are in line,
and `lateJoin: true` shows them the board meanwhile. `duelRoomNext` in
`JS_RoomConnect4.html` mirrors `duelSeatNext` to say "Next: A vs B" on the
result card: keep the two in step. A seated player who leaves mid-game loses by
forfeit (`duelPlayerLeft`: the other scores), and the next game seats whoever
is next. With fewer than two in the room there is no next game, and the card
says it is waiting for someone to join. The host picks 4 or 5 in a row, or the
board size, in the lobby - the same choice as the one-phone setup, kept in
`appState`. A turn is `turn_up` in `roomTurnOf`. The TV is the room's one
voice: with a screen in the room only the screen knocks, scratches and pops
(`duelRoomLoud`); the winner's own phone and the TV get the confetti.

**Your move is drawn as your finger lifts, not when the server answers.**
The owner saw it in a room (21 Sep 2026): "a disc appears falling, disappears,
then another one drops" - the aim disc faded on letting go, and the real disc
fell a round trip later from the top. On one phone the board is redrawn in
the same event, so the aim disc turns straight into the falling one. In a
room `duelRoomSend` now takes an `early` step: the phone plays the move on a
copy with the very rules the server uses (`c4Play`, `dotsPlay`), puts that
board in place of the one on screen and starts its motion (`c4RoomDropEarly`,
`dotsRoomDrawEarly`, through `duelRoomDrawEarly`), remembering the move's key
and when it started (`duelRoomLocal.early`). When the server's board comes
back, `c4AfterPaint` / `dotsAfterPaint` get that as `o.early` and start the
same animations part-way (`currentTime`), so the fall, the line and the boxes
carry on with no jump, and the knock plays once. If the server's answer
arrives and nothing claimed the early board (`duelRoomEarlyFor`), the move was
refused, and the room's own board is drawn back. Watchers and the TV are
unchanged: they only ever see the server's board. Measured with 250ms of
network delay: the disc starts falling at the lift instead of 260ms later.

**Layout** (Style.html sections 18 and 19): upright, the pills and a result
card sit above the board and the rest follows it (`.duel-layout`, with the
side `display: contents`); on a phone held sideways and on any screen at least
900 wide the board sits beside its side column, sized off `--app-h` and the
board's own `--duel-aspect` (width over height, the ghost row included) so it
never needs scrolling, and sticky, so a room's long side scrolls past it. The
TV puts the board on one side and the pills, the status, the result and the
line on the other (`.duel-tv`). Both boards carry `dir="ltr"` and are placed in
their own left-to-right terms; the piece colours are tokens (`--c4-red`,
`--c4-yellow`, `--c4-board`, `--dots-c1`, `--dots-c2`, `--dots-dot`,
`--dots-guide`), the same in both themes except the dots and the guides, and
the Connect 4 holes are the page ground (`--bg`), so they go dark with the
theme while the board stays blue.

**إكس أو in rooms** (23 Sep 2026) is the third duel of `RoomDuels.js`
(`DUEL_KINDS.xo`, `xoRoomAction`), with its rules in `TicTacToe.js` - the one
file the one-phone game (`JS_XO.html`), the room's phones (`JS_RoomXO.html`)
and the Worker all judge a mark with (`xoMark`, `xoWinner`). The grid is
`shared.cells`, not `board` - `board` is every duel's scoreboard (*Traps*).
Seat 0 is X and moves first; the lobby's switch is the one-phone game's
"3 marks only" (`three`, remembered as `appState.xo.three`), and a game keeps
the rule it was dealt (`rule3`, `order` oldest first). The phone draws the
one-phone game's `.xo-board` between the duels' pills: a mark lands with a
bounce, the one it took off fades where it stood, the line lights one square
at a time, your own mark lands as your finger lifts (`duelRoomSend`'s early
step), and the oldest mark is faded only on its owner's phone, on their turn.
The setup screen gained the one phone / own phones switch.

### شطرنج بالتصويت

The owner's rules are in *The owner's specs*. Game id `votechess`, view
`room-votechess`, rooms only.

- **`RoomVoteChess.js`**: the lobby's split is `shared.lobby.sides` (`{ pid:
  0 | 1 }`; the host's `sides { shuffle }` draws it, `{ move: pid }` puts one
  across, `{}` keeps it in step with who is here - the host's phone sends that
  itself, `vcLobbySync`); `vcFitSides` never leaves a side empty. A game is
  `shared.teams` ([White ids, Black ids] - team k plays colour k), one board
  (`chessBoardNew('off')`), `shared.vote = { team, n, endsAt, voted }` - who,
  never what - and `shared.tallies` (the last 12 closed votes: the moves with
  their counts and SAN, the pick, and `how`: votes, tie, random, host). The
  votes are `room._vc.votes`, never projected; a voter's own is also
  `room.secrets[pid] = { vote, n }`, so a reload brings its arrow back. `vote
  { from, to, promo | resign, n }` (n the move count: a stale tap is dropped)
  may be changed until the close; `vcClose` runs when everyone present on the
  team has voted, on the clock (`vcDeadline` / `vcTimeout`, 0.4 s of grace)
  or on the host's `closeVote { n }`. `shared.tw` is each team's games won
  (swapped with the colours on play again).
- **`JS_RoomVoteChess.html`**: the chess screen (`chLayoutHtml`,
  `chViewShow`) with the duels' pills for the two teams (the members under
  each, a dot filling as each votes), the vote clock as a ring
  (`vcPaintClock`, the server's time through `serverNow` / `receivedAt` as
  the chess room reads it), the tally card that flies in once
  (`motionFirst`), 🏳️ «صوّت نستسلم» and the host's «اقفل التصويت دلوقتي».
  **A vote is the chess board's tap or drag, not a move**: `chTapLogic` /
  `chDropLogic` with a `play` that votes, and a drop returning `'pre'` so the
  piece goes back to its square and only the blue arrow (`CH_PRE_COLOR`)
  stays. The vote shows at once (`vcLocal.mine`) and is taken back if the
  server refuses it. The TV: the 3D board, both teams, the clock, the tally.
- The team channel: `roomChatTeam` in `RoomGames.js` (and `chatTeamOf` on the
  phone) gives a vote-chess player the team `w` / `b` (⚪ / ⚫ in the chat).
- Tests: `rules.mjs`, `leaks.mjs` (`DRIVERS.votechess`, `PROBES.votechess`),
  `play-all.mjs` (`teamChessRobots`).

### المخ والإيد

The owner's rules are in *The owner's specs*. Game id `handbrain`, view
`room-handbrain`, rooms only, computer players.

- **`RoomHandBrain.js`**: the lobby's seats are `shared.lobby.order`, four
  ids or null (White's Brain, White's Hand, Black's Brain, Black's Hand);
  `hbFitOrder` keeps the seats people have and seats newcomers in empty ones
  (people before computer players), the host's `seats { shuffle | order }`,
  `{}` in step with the room (`hbLobbySync` on the host's phone). At the
  start the empty seats get easy computer players (`hbFillSeats`, named from
  the host's `botNames`). A game is `shared.teams` ([[brain, hand], [brain,
  hand]] by colour), `stage` ('name' | 'move'), `named { kind, n, by }`,
  `calls` (the last ten names, for the log), one board with the clock chosen
  (`chessBoardNew('off' | '5+0' | '10+0')`: the clock is the team's), `tw`.
  `name { kind, n }` from the Brain up (a kind with no legal move refused),
  `move { from, to, promo, move }` from the Hand up (a piece of another kind
  refused), `resign { round }` from either member, the host's `skipTurn {
  move, stage }`. Nothing is hidden.
- **Computer players** (`ROOM_BOT_GAMES.handbrain`, max 4): a Brain names the
  kind of the engine's move (`hbBotKind`: 1500 on a small budget for hard,
  600 one ply deep for easy); a Hand plays the best move of the named kind
  (`hbBotMove`: a mate at once, else each move looked at one reply deep,
  captures followed, a few hundred positions a move; easy plays at random a
  third of the time). **Forced moves** (`ROOM_FORCED_GAMES.handbrain`): the
  only kind that can move is named; the only move of the named kind is played
  unless it ends the game.
- **`JS_RoomHandBrain.html`**: the chess screen; the pills say who is Brain
  🧠 and Hand ✋ of each team (the one up in the accent); the Brain's six
  buttons (`hbBarHtml`, drawn pieces, the kinds that can't move faded); the
  Brain's word big over the board («🧠 المخ (منى) قال: الحصان!», popping in
  and with a chime once per move, `hbCue`); every piece of the named kind
  that can move lit (`marks`, kind 'chance') on every board; the Hand's
  board takes only those (`hbModel`'s `onPick` / `onDrop` refuse another
  kind), and the Hand's move is drawn as the finger lifts (`hbLocal.early`,
  the duels' rule). The lobby's seats as two teams of two
  (`hbSeatsHtml`). The TV: the 3D board, the teams, the Brain's word, the
  clocks.
- Tests: `rules.mjs`, `leaks.mjs` (`DRIVERS.handbrain`), `play-all.mjs`.

### The duels' tournament

The owner's decisions are in *The owner's specs*. One engine for every duel,
on the server (`RoomTournament.js`) and on the page (`JS_RoomTournament.html`,
section 30 of `Style.html`).

**A match is a small room.** `room.shared` holds the bracket (`tour`: the
entrants, their names, `matches` with each one's two players `p`, its byes
`out`, where its winner goes `next` / `slot`, its `state` - wait, ready,
play, done - `startAt`, `seats`, `games`, `draws`, `winner`, `loser`,
`reason`) and every match's game (`games[id]`, the game's own shared state).
`tourRoomOf` builds a room of the match's two players around that game, with
its hidden state (`room._tourHidden[id]`, never projected) and its two
phones' secrets, and the game's own action function, clock and leave run on
it exactly as they run in winner stays; `tourCommit` puts it back, each seated
phone's secret as `room.secrets[pid] = { tm: id, … }` - a phone is in one
match at a time, and its secret names that match. The game's action function
(`duelAction`, `guessWhoAction`, `battleshipAction`) hands every action to
`tourAction` first: `start` with `tournament: true` deals one (people only,
four at least), `tourNew` the next one or winner stays, `tourFeature` the TV's
big match, and every move carries `match` and `mg` (the match's game number),
so a tap for a match that moved on is dropped. `gameDeadline` / `gameTimeout`
(the next match's start and every match's own clock) and `gamePlayerLeft`
ask `isTourRoom` first. A match's board is dropped once both its players have
moved on (`tourDeal`), so a room's state stays small with six matches going.

**Plugging a duel in** (chess is plugged in the same way, below): an adapter in `TOUR_KINDS` -
`options(payload, prev)` and `settingsOf(shared)` (the lobby's choices, from
a start or a winner-stays game), `deal(v, settings, match)` (a fresh game on
`v.shared`, whose seats, names and round are set; `match.games` and
`match.draws` say which game of the match it is), `act(v, pid, action,
payload)`, `deadline(v)` / `timeout(v, now)` if it has a clock, `left(v,
pid)` (the game ends by forfeit), `stay(room, pid, settings)` (winner stays
with those choices), and `drawRule(match, game)` - optional: after a drawn
game (`match.draws` already counted) `'replay'` or `{ winner: seat }`;
without it every draw is replayed, the seats swapped. A game is over when its
`phase` is `'over'`, with `result.winner` a seat or null (what `duelEnd`
writes). Chess's rule - a draw replayed once, then an Armageddon game whose
draw is Black's - is `drawRule: (m) => m.draws < 3 ? 'replay' : { winner: 1 }`
with `deal` reading `m.draws === 2`. The game calls `tourAction(room, pid,
action, payload, '<id>')` first thing, its client code reads the room through
`duelRoomState()` and sends through `duelAct()` (below), and one line in
`TOUR_CLIENT` (its small board for the TV's live cards) wraps its renderers.
A test of each is in `rules.mjs`, `leaks.mjs` (`TOUR_DRIVERS`: a tournament's
views held to the game's own probes, match by match) and `play-all.mjs`.

**On the page** the duels' renderers are wrapped at load (`tourWrap`): with
no tournament on they run as before; with one on, a phone shows a match -
through the game's own renderer, given `tourMatchState` (the match's game as
`shared`, with `tourMid` and `tourGames`, and `you` only when the secret names
that match) - or the bracket (`tourScreenHtml`). Which (`tourFocusId`): a
match the phone picked (`tourShow`, from the bracket or the chips of the
matches being played), the bracket if asked for, or by itself its own match
(`tourAutoId`: the one it plays, a replay, the one it just won or lost while
its board is kept), else the bracket with its next match and the countdown;
a new match of its own takes it back (`tourSyncAuto`). The duels' shared code
reads the room through `duelRoomState()` and sends through `duelAct()` (both
in `JS_RoomConnect4.html`), which add the match; `duelRoomLineHtml` and
`duelRoomOverHtml` leave a place in a match's screen that `tourAfterMatch`
fills: the round, the matches to watch, the bracket, and after a game who goes
through, the replay's countdown, your next match or that you're out. The
bracket is a column a round in the page's direction, each round's matches in
pairs with the lines drawn by the pair (`.tour-pair::after`) and the next
match (`::before`); LIVE, a countdown, a tick for the winner, a line through
the loser, a crown on the champion. The TV (`tourTvFrame`) is the bracket with
the matches being played beside it as live cards (`TOUR_CLIENT[game].mini`:
the board itself for the three board games, faces or ships left for the other
two), and a match big - the host's pick (`tourFeature`), or the only one being
played (the final, say) - through the game's own TV renderer.

**Motion**: the draw - every first-round name flies from the middle of the
bracket into its slot, one after another (`tourDealDraw`, only for a draw just
made); a winner's name flies from the match they won to their slot in the
next round (`tourFlyWinners`, whatever this screen last drew); the champion's
row is crowned, the podium of four rises (`tourPodiumHtml`, the app's
`.podium`) and the confetti waits for it (`afterReveal`); the points count up
on the board (`animateScoreboards`). `roomTurnOf` answers for the phone's own
match (`tourTurnOf`), and the lobby's switch is `tourLobbyHtml`, remembered on
the host's phone per game (`recallOptions('tourMode')`).

### The catalog and the home screen

`GAME_CATALOG` in `JS_Catalog.html` is the registry of everything the app can
play: id, icon, title and description keys, accent, `players: [min, max]`,
`mins`, `modes` (`device` = pass one phone, `room` = everyone on their own
phone, `tv` = a room shown on a big screen), `group` (one of
`CATALOG_GROUPS`: deduce, words, party, quiz, table, duo, tools), the `setup`
view and an `open` function. **A game that is not in it is not on the menu.**
Three things are drawn from it:

- **The home** (`renderHome`): a hero with the three ways of playing together
  (open a room, join, big screen), a search box, filter chips by how you want
  to play (`HOME_FILTERS`: one phone, own phones, on the TV, two players,
  solo), the games opened recently on this phone (`ashryRecent_v1`, newest
  first, `catalogOpen` records it) and a section per group of cards -
  description, player count, minutes and mode badges. The tools are not on
  it: they have the الأدوات tab (`renderTools`), and the room games are
  listed again under مع بعض (`renderTogether`) with the three ways in and how
  a room works in three lines. `setView('menu')`
  redraws it, so the recent row is current and a search left behind is
  cleared; a language change redraws it through `applyTranslations`
  (`homeRenderedLang`). Search and the chips only toggle `hidden` on the cards
  and sections (`applyHomeFilter`), so the box keeps focus while you type.
- **The hero on every setup screen** (`syncGameHero`, called from
  `applyTranslations`, so it follows every `setView` and every language
  change): the icon, the one-line pitch, players, minutes, the modes as words
  and a 📘 rules button that opens the help sheet on that game. The setup
  screens themselves carry none of this.
- **The help sheet's** "is this a room game?" jump and the search both keep
  working from `HELP_ENTRIES`; the catalog does not replace them.

Descriptions are `cat_<id>` keys: one line, what you do, no emoji (the card
draws the icon). Titles are the game's `setup_<id>` key. A game's card, its
hero and its help entry must all agree on the icon and accent.

**A description has two lines and no more** (20 Sep 2026). The card clamps at
two, and the strings had been written past it: 31 of 49 in Arabic and 43 of 49
in English ran to three, four, even five lines, so most of the grid ended in
"…" mid-word and the whole home looked unfinished. They are all rewritten to
land inside it - about **48 characters in either language** at 375px, which is
one short sentence that says what you do. A new game's `cat_` key has to fit
the same budget; the way to check it is to lift the clamp and count lines
rather than count characters:

```js
document.querySelectorAll('#view-menu .gcard').forEach(c => {
  const d = c.querySelector('.gcard__desc');
  d.style.cssText = '-webkit-line-clamp:unset;display:block;min-height:0';
  const n = Math.round(d.getBoundingClientRect().height / parseFloat(getComputedStyle(d).lineHeight));
  if (n > 2) console.log(c.dataset.game, n);       // should print nothing
});
```

**The home's first screen belongs to the games** (20 Sep 2026). It had been
570px of hero, search and filters into a 690px scroll area before the first
card - 83% chrome. Two things gave way, neither a control and neither a tap
target, and the first card sits at 445px now, a whole row above the fold:

- a phone that has played before gets **only the ways in** - the four tiles,
  اختارلنا among them, on one row (`home-hero--compact`, 67px against 141).
  The mark and the name are in the header on this screen, so nothing is lost;
  a first visit still gets the whole hero with its title and tagline. How
  much a tile says follows **the hero's own width** (it is a container,
  `container-type: inline-size`), not the screen's: icon over name on a phone
  upright, icon beside name from 34rem (a phone on its side, a tablet
  upright), icon beside name and a line under it from 52rem (a laptop, a TV).
  The owner found the first version on a PC with the four tiles bunched into
  the left half of the bar and the rest empty (21 Sep 2026): the wide layout
  makes `.home-hero` a two-column grid, head | ways in, and the returner's
  hero has no head, so the ways in fell into the first column. It is
  `display: block` there now.
- together/apart and the eight player counts were a second scrolling row
  stacked straight on the first. They **fold behind one chip**
  (`toggleHomeMore`, `.filter-chip--more`) pinned at the end of the first row
  - pinned, because at the end of a row that *scrolls* it was simply off the
  screen, which is worse than the row it replaced. The chip carries a summary
  of whatever it is hiding (`homeMoreLabel`) and opens by itself when one of
  those filters is remembered from last time, so a filter is never hiding out
  of sight. The row's filtering logic is untouched. The row takes its
  content's width and only shrinks when it must (`flex: 0 1 auto`), so on a
  phone the chip is pinned at the end of a scrolling row and on a laptop,
  where every mode fits, it sits beside the last one instead of across a
  600px hole.

Setup screens whose options live in `appState` (a segmented control, the Stop
categories) are painted by `paintSetupOptions(viewId)` (`SETUP_PAINTERS` in
`JS_Core.html`) whenever the screen is reached - from a card, the back button
or a reload - so a game's `setupX()` entry point is not the only way in that
shows the saved options.

**Choices are remembered on the phone** (the owner, 17 Sep 2026: "I don't want
to make the same settings every time"). Every setup screen and host lobby
opens with the options this phone chose last, and a change is kept the moment
it is made, not on Start. A game whose options live in its `appState` slice
(painted by `SETUP_PAINTERS`) or under its own `ashry…` key keeps doing that.
Anything else goes through `recallOptions(key, defaults)` /
`rememberOptions(key, patch)` in `JS_Core.html` (one key, `ashryOptions_v1`,
cleared by "delete all data"). A plain setup field just gets `data-remember`:
it is kept by id as it changes (typing, `stepField`, `pickTime`, a switch, a
list) and put back by `paintSetupOptions` before the screen's painter runs,
together with the one-phone / own-phones switch (`paintPlayMode`). A list
filled in JS calls `recallField(select)` once its options exist (الجاسوس,
الحرباء). Choices that live on the rooms server are sent by the host's phone
once to a new room whose settings are untouched (أسماء الرموز,
`cnApplyRemembered`). Never mark a secret word, a number to guess, or anything
dealt. A new game with options needs one of these, or it opens on its defaults
every evening. Left alone on purpose: أوصف لي's length and Wordle's word length
are Start buttons, not a selection; the general timer's minutes are the
running timer; the domino single/teams question depends on the table; the
Codenames custom words are not carried to new rooms.

### The games' language

`contentLang()` in `JS_Core.html` is the language the games' *content* comes
in: Settings → "لغة الألعاب" (`appState.gameLang`: `auto`, `ar`, `en`,
cycled by `cycleGameLang`) can pin it, for a table that reads the app in
English but plays with Arabic words, or the reverse; `auto` follows the
app. Every bank lookup, `freshPick` key and room start payload goes through
it - `VOTE_LANG()` is now just `contentLang()` - and never through
`appState.lang`, which is the language of the interface only. The Wordle
keypad follows the content language too, since it types the word.

### The soundboard

`JS_Sounds.html` makes twelve sounds with the Web Audio API (`FX`,
`playFx(name)`): applause, ta-da, right, wrong, ba-dum-tss, the sad
trombone, a sad violin, crickets, boo, an air horn, a siren, a whistle.
Nothing is downloaded (the old board pulled mp3s from a meme site), so
they play at once and offline. `openSoundboard()` is the sheet, opened from
الأدوات (a `GAME_CATALOG` tool whose `open` is the sheet, with its own
`GAME_RULES` and help entry) or from a 🔊
button in the header beside the gear (`#fx-fab`, shown through
`body.has-fx` which `setView` sets on `play-*` and `room-*` screens) keeps
it one tap away mid-game - it floated over the page once, where it covered
the drawing tools; and
`confetti` is wrapped so every celebration in the app brings the fanfare -
and, since the confetti is drawn by a script the stylesheet can't still, the
wrapper plays only the fanfare when `reducedMotion()` is true, and draws the
confetti above everything (z-index 100050), the full-screen tools included.
The applause is built the way a room claps rather than as random static: a
dozen people, each at their own pace, pitch and strength, every clap three or
four cracks inside 25ms with a short tail, over a soft wash, swelling in and
fading out through a compressor. `fxRenderTo` points the sounds at an
`OfflineAudioContext` to render one to a buffer and measure it, which is how
a sound can be checked on a machine that can't play it.

**Sound can be asleep.** iOS and Chrome keep the audio context suspended until
a touch, and iOS suspends it again ('interrupted') when the phone locks or a
call comes in. `wakeAudio` in `JS_Core.html` resumes it on any touch, key or
return to the page, and `playSound` tries too - but a sound that arrives from
the room with no touch (the bomb landing on this phone) can't wake it, so the
holder's screen says "tap to hear the ticking" while it is asleep.

**A tap doesn't always wake it on an iPhone** (the owner, 23 Sep 2026: "most of
the times when I join a room I don't hear the game, I must refresh"). Joining
usually comes from another app that had the sound (the camera that read the QR,
WhatsApp), and opening a room goes out to the share sheet; iOS then leaves the
context 'interrupted', or 'running' with its clock standing still, and resume()
inside a tap no longer brings it back - a refresh helped only because it made a
new context. So `wakeAudio` listens to pointerdown, touchend, click and keydown;
in a tap it also starts a one-sample silent buffer (what really opens iOS's
output), and 350ms later checks that the context is running *and its
`currentTime` moved*; if not (`audioStuck`), or if it is 'interrupted', the
next tap closes it and makes a new one inside the tap, where a new one always
starts. That is why `audioCtx` is a `let`: nothing may keep a context of its
own - every sound reads `audioCtx` or `fxCtx()` each time it plays (an
`AudioBuffer`, like the applause's noise, works in any context). The narrator's
speech warm-up (`speakPrime`) runs on a click or touchend for the same reason:
iOS doesn't count a pointerdown as a tap. An iPhone on its silent switch still
plays no web sound (Safari's `navigator.audioSession.type = 'playback'` could
change that, but it would also stop the phone's music - not done). The
bomb ticks with its own `playSound('bomb')`, a wooden tick-tock loud enough to
hear across a table, on the holder's phone and the TV only.

### The first-play card

The first time a phone opens a game's setup screen, or has that game chosen in
a room lobby (never on a big screen), a card under the hero says how to play
in three steps: the first three `<li>` of the game's `GAME_RULES` list, as
plain text, cut at 140 characters (`firstPlaySteps`, `firstPlayCardHtml` in
`JS_Catalog.html`). «فهمت» or «📘 القواعد كاملة» marks the game seen in
`ashryFirstPlay_v1` (cleared by "delete all data"). A game whose rules have no
ordered list gets no card, so a new game's rules should keep the shape the
Help sheet asks for.

### The Help sheet

Help is one of the two things in the bottom nav, so it has to earn that slot.
It answers two different questions and the split matters:

1. **"What do I do on this screen?"** — the card at the top. `openHelpModal()`
   resolves `appState.currentView` through `HELP_FOR_VIEW` and renders that
   entry's rules already open, tinted in the game's own accent. In a room lobby
   with a game chosen it resolves to that game instead, because the lobby is not
   the thing you are confused about. On the menu there is no specific screen, so
   it shows a short "what this app is" card instead of a gap.
2. **"What games are there?"** — the list underneath, plus search.

Three pieces have to stay in step, all keyed by the same string:

| where | what it holds |
| --- | --- |
| `GAME_RULES` in `JS_Core.html` | the rules text, `ar` and `en` |
| `HELP_ENTRIES` in `JS_Utils.html` | title key, icon, accent, games-or-tools (a catalog game's icon, accent and title are copied from `GAME_CATALOG` at load, so they can't drift) |
| `HELP_FOR_VIEW` in `JS_Utils.html` | which screens map to it |

**Adding a game means adding to all three.** An entry with no `GAME_RULES` text
is dropped from the list rather than rendered as an accordion that opens onto
nothing, so a missing third piece fails quietly — the browser check for it is
"does every view map to a topic, and does every topic have rules":

```js
[...document.querySelectorAll('[id^="view-"]')].map(v => v.id.replace('view-',''))
  .filter(v => v !== 'menu' && !HELP_FOR_VIEW[v])          // should be empty
```

The registry covers more than games and tools: `players` (the name field, the
shared name list, the 📂 saved-groups picker) and `settings` (everything behind
the gear) are entries too, because those were the two things with no explanation
anywhere in the app and no obvious place to put one.

**The list is grouped the way the home is.** `helpSections()` in
`JS_Utils.html` puts the rooms, the big screen, the players and the settings
under "start here", then a section per `CATALOG_GROUPS` group with its games
in catalog order, then the tools; `HELP_ENTRIES` stays the registry of icon
and accent, and anything registered but not in the catalog lands in a "more"
section at the end. Every card's summary carries the catalog meta (players,
minutes, mode icons) and its body opens with the catalog's one-line pitch
(`.help-lead`) before the rules. The rules themselves have one shape: an
ordered list of how a round goes, then `.help-sub` sub-heads for
📱 separate phones, 📺 the TV, 👥 teams, 🎤 the director or 💡 tips where
they apply. Keep new rules in that shape, and never mention where content is
stored: it is code, and the sheet is not for that. A game with many cases
(سكرو: every card, every way a round ends, scoring examples, each version)
keeps the short ordered list on top and folds each part into a
`<details class="help-more">` with its own heading, so the sheet stays short
and search still reads all of it.

**Search reads the rules, not just the titles** — people search for the thing
they are stuck on ("assassin", "قاتلة"), not for the game's name. It runs
through `helpNormalise`, which folds the Arabic spellings of the same word
together (أ إ آ → ا, ة → ه, ى → ي) and strips diacritics; without that, a search
for `اسماء` misses `أسماء الرموز`. A search that leaves exactly one result opens
it rather than asking for another tap.

**Nothing destructive lives here.** "Delete all data" used to sit in this
footer, one tap away from a rules sheet and styled almost as loudly as Close. It
belongs in Settings, which is where it now is — only.

### Traps this codebase has already fallen into

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
intro styles and the page data in `<head>`; `Tailwind.html`, `Style.html` and
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
owner noticed on 24 Sep. Before removing a "never referenced" key, grep for
its prefix followed by `' +` or `${`.

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

**The i18n check reads every `t.x` as a translation.** `check-i18n.js`
warns about "unfallback-ed t.<key> reads" for any `t.something` in a page
file - including a three.js texture called `t` (`t.wrapS`) or a GLSL
variable (`t.a` in a shader string). Name such things anything but `t`.

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
files were cached. Keep opaque answers from the pinned hosts. And test
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

**A custom property that doesn't exist is silently nothing.** The first-play
card used `var(--sp-3-5)` and `var(--sp-2-5)`; the scale has only whole steps
(`--sp-1` … `--sp-9`), so its padding and gaps were 0 and its text touched
the edge. No check fails on it. Grep `--name:` in `Style.html` before using a
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
input runs right to left while `left: 40%` still measures from the left, so
Wavelength's slider, needle and end labels disagreed in Arabic. The spectrum is
wrapped in `dir="ltr"`. The same goes for anything that maps a value to a
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
rounds, or scored a Wavelength round twice.

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
  `soloRegister`, the phone's move started again if it was its turn): the whole game is in `appState`,
  so the branch just redraws it. The Bomb's fuse and a Stop round's clock are
  deadlines, so they come back with the time they really had left.
  Anything that renders from state needs a `render…()` that rebuilds from
  `appState` alone — not one that only appends as events happen.
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

**Calm by default.** The backdrop is one still wash (the two cross-fading
gradient layers were a screen that never sat still); cards are white with a
hairline border and a soft shadow; the game's own colour sits on its icon
tile, the accent edge of a setup hero and the primary button, not washed
over whole cards; section titles are sentence case in the text colour; the
selected chip is the screen's own accent (*One voice* below - it used to be
ink on paper, a third colour system answering to nothing). Radii are
20px on cards and 12-14px on controls. When adding a screen, spend colour the
same way: one accented element, the rest neutral.

**One voice** is section 17 of `Style.html`, the pass that made a lift to one
screen a lift to all of them. Four things were true everywhere, and none of
them was a bug, which is why they lasted:

- **There was no weight under 600 in the app**, so nothing could read as
  emphatic - a card's title and its description were both heavy and three
  pixels apart. Cairo and Baloo Bhaijaan 2 are asked for as **variable**
  ranges now (`wght@300..900` and `wght@400..800`), which is *fewer* bytes
  than the six static cuts they replaced, and `--fw-quiet` … `--fw-black`
  is the scale. Secondary text (a card's description, a hero's line, a meta
  row, a settings hint) sits at 400-600; the top of the range is kept for
  what names a screen.
- **Titles are set in `--font-display`** (Baloo Bhaijaan 2, already on the
  wire for سكرو's card numerals): a rounded Arabic-and-Latin face against
  Cairo's neutral reading voice. Deliberately **not** on `.metric` - clocks
  and scores need Cairo's tabular figures, or a counting timer jitters.
- **The ground is warm paper, and dark is ink** rather than cold slate. The
  `--n-*` ramp is untouched (a few rules read it directly); what changed is
  the surfaces built on it, each held within ~1% of the luminance it had, so
  every ratio the file fought for still holds. Shadows are warm-neutral: a
  blue-black shadow on warm paper reads as dirt.
- **A card carries its game's colour in one corner.** The note on `.gcard`
  is right that thirty tinted cards made the home a rainbow, but the answer
  was never "no colour at all" - it is the corner wash the setup heroes have
  always used, `color-mix(in srgb, var(--accent) 9%, transparent)` (16% in
  dark) blooming behind the icon and nowhere else, so a section reads as a
  family and a card still reads as white paper. `--wash-x` flips it to the
  inline-start corner in both directions.

Also there: a press is proportional to what is pressed (a 150px card moves
2%, a 44px chip 7% - one scale for both made the card lurch), the mode
glyphs on a card are quiet ink so the game's own icon owns it, and the
section rule fades away from its title instead of running flat to the edge.
Sticky section heads were tried and dropped: the page ground is a
viewport-fixed gradient, so a sticky band either mismatches it or needs
`background-attachment: fixed`, which iOS Safari does not honour.

**The finish** is section 11 of `Style.html`: a still glow behind the top of
the page, a header that turns frosted with a hairline once the page has
scrolled under it (`.shell.is-scrolled`, set by a scroll listener in
`initializeApp`), a top light on `.btn--primary`, icon tiles with a soft
gradient and a hairline of the game's colour, grain on the home hero, hover
lifts only under a real mouse (`hover: hover` and `pointer: fine`), and the
home's cards rising in sequence. Nothing in it moves by itself; keep it that
way, and keep any new polish in that section rather than scattered.

**The intro** is what the page opens on, chosen by the owner from three
takes on 16 Sep 2026 ("the logo flies home"). `#app-loader` and its first-paint
styles are the critical CSS in `Controller.html`, so they are on screen before
any script: the mark settles, a line draws under it and shimmers for as long
as a slow phone is still loading, the name appears. A tiny inline script right
after it applies the saved theme and language (`gameTrackerState_v1`) so the
intro doesn't switch halfway, and notes `INTRO_T0`. `initializeApp` calls
`introExit` once `loadFromLocal` has settled which screen the app opens on.
On the home, and no sooner than `INTRO_MIN_MS` after the intro went up, the
mark flies (Web Animations, measured with `getBoundingClientRect`) onto the
header's `.mark--title`, which stays `visibility: hidden` under
`body.intro-flying` until it lands; the ground fades and `body.intro-reveal`
raises the home and the nav. Anywhere else - a game or a room restored by a
reload, a `?room=` link, the install steps, a hidden tab, reduced motion - and
after a tap on the intro (`skipIntro`), it is a short fade. Every step runs on
a timer, and `initializeApp` sets a safety fade too.

**Motion** is section 14, with its script in `JS_Motion.html`: the intro's
idea - something flies to where it lives rather than vanishing and
reappearing - used where the player has just done something, and nowhere
else. `flyEmoji(emoji, fromRect, fromFontPx, target)` flies a copy of an icon
from one place onto an element and pops the element when it arrives (a timer
lands it too). The flight is a Web Animation of `transform` only, aimed at
where the element comes to rest (`restingRect` seeks the animations it rides
on - its screen sliding in - to their end, measures, and puts them back in the
same task): the browser runs it off the main thread and starts its clock on
the first frame it draws. It used to chase the element from a
`requestAnimationFrame` loop, and going back to the home - 600 elements to
draw - ate the start of the path and stuttered, while opening a light setup
screen looked fine. The ghost is drawn at the larger of the two sizes and
only scaled down, so the emoji stays sharp. It flies twice: the tapped card's
icon to the game's hero (`catalogIconFlight`, which `catalogOpen` measures
before the screen changes - cards pass themselves as `this`), and a room
dealing a game from the lobby (`playRoomGameStart`, from `Room.onChange` when
the stage leaves the lobby), which shows the game big on every phone and the
TV for under a second, then flies its icon into the header's
`#app-title-icon`. `animateScoreboards` counts up any
score that rose and slides any player whose place changed, from what the last
board in that room and game showed (`scoreMemo`); `renderScoreboard` gives
each row `data-pid` and `data-score` for it, and a score that went down means
a new game, so nothing moves. The bottom bar's highlight is one sliding
`::before` on `.shell__nav` placed by `syncNavPill` (run in the same
coalesced pass as the segmented thumbs), a new room code drops in letter by
letter, and a player who joins after you pops into the lobby
(`status-row--new`, `lobbySeen`). All of it is still under reduced motion and
in a tab that isn't showing.

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

**Filtering rearranges; it does not redraw.** Every catalog in the app filters
by toggling `.hidden`, which is `display: none` - so the most-used gesture on
the busiest screen (a filter chip on the home) was the one thing in the app
with no motion at all: cards vanished, sections collapsed, everything below
jumped. `flipGrid(root, mutate)` in `JS_Motion.html` reads where the items
are, hands the mutation straight through to the caller (so the filtering
logic is untouched and still the only thing deciding what is shown), reads
where they ended up, and runs the survivors back from their old place while
the newcomers fade up - transform and opacity, on the compositor. Two things
it has to get right, and both were found the hard way:

- **Measure relative to the container, not the viewport.** Hiding half a grid
  can make the scroller clamp its own `scrollTop`, and viewport coordinates
  read that clamp as every card flying hundreds of pixels at once.
- **Only animate what someone can see.** A catalog is several screens long;
  the first cut put 60 layers on the compositor to move things below the
  fold. Bounded to a screen either side of the viewport it is 11-13.

A caller that is painting for the first time passes `{ animate: false }`
(`applyHomeFilter` does): there is nothing to move from, and the cards are
already rising in sequence. A new screen that filters or reorders a list
should go through it rather than toggling classes on its own.

**Reveals play once per thing.** A room redraws a screen for reasons the
table never sees (the host changed, the language), so a reveal asks
`motionFirst(key)` while its markup is built: true the first time that key is
drawn on this phone with motion on, and a redraw shows the thing settled.
Anything that celebrates after a reveal goes through `afterReveal(el, fn)`,
which waits for the longest `data-reveal-ms` drawn into `el`, so confetti
lands with the answer rather than before it. The reveals:

- **Vote results** (`renderVoteResults` → `voteRevealTimes`): the bars grow
  one at a time from the bottom of the list up, and the winning (or
  highlighted) row last, after a beat; `--at` on each row is its moment, and
  `opts.delay` holds the whole list back (Fake Artist waits for its card).
- **"The spy was…"** (`spyRevealParts`, used by the الجاسوس, الحرباء,
  الموقع السري and الفنان المزيف results): the result card lies face down in
  the game's colour with a question mark and three soft ticks for 1.1s, then
  turns over; the cover goes when the card is edge-on.
- **The podium** (`renderPodium(state, board)`, at the end of the trivia,
  emoji, proverbs, five seconds, two truths and Stop rooms): the top three,
  second on one side of the winner and third on the other, rising 3-2-1.
  Ties share a place and its height. Fewer than two players or nobody scoring,
  and it returns '' so the screen keeps its plain champion line. The TV
  trivia podium rises the same way (`tv-podium--rise`).
- **A letter** (`spinLetter`, أتوبيس كومبليت on one phone, in rooms and on
  the TV): letters from `STOP_LETTERS` flick past, slowing, and the real one
  pops in; the cue sound plays when it lands.

Three more are moves rather than reveals: a solved Connections group's tiles
fly into the row that took their place while the tiles left behind slide from
where they were (`flyConnectGroup`, measured by `connectTileRects` before the
grid is redrawn, the finish waiting for the last row); the team generator
deals the names into their teams one at a time in the order they were drawn
(`dealTeams`, ghosts above the page because the team cards clip, each landing
on the name itself); and going back from a game's screen to the home, مع بعض
or الأدوات flies its hero icon home to the tile it was opened from
(`heroHomeFlight` from `setView`, `catalogReturn` remembering whether that
was the recent tile or the card).

**Pass-the-phone roles are held, not tapped.** الجاسوس, الحرباء and الموقع
السري on one phone put the role on the back of a `.hold-card`: it turns over
only while a finger, the mouse or Space is on it, and turns back the moment
it lets go, so the next player never catches it. The role is filled in when
the player's name is shown (`showRevealStep`, `showChameleonRevealStep`,
`showSpyfallRevealStep`), `holdCardReset` puts the card face down with the
done button hidden, and the button (`data-next`) appears once the role has
been up for `HOLD_SEEN_MS`. The handlers are delegated in `JS_Motion.html`,
so a new `.hold-card` needs no setup. The faces swap `visibility` halfway
through the turn as well as relying on `backface-visibility`, and nothing on
these screens may play a sound that differs by role: the old chameleon and
spy reveals played an alarm for the impostor and a chime for everyone else,
which told the whole table.

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
only by an animation event. New CSS goes in section 14 of `Style.html`, with
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
described in its own section of this guide: a `GAME_CATALOG` entry (or it is
not on the menu); `VIEW_META` for every view (title, `up`, accent); its text in
both `TRANSLATIONS` blocks; its rules in `GAME_RULES`, `HELP_ENTRIES` and
`HELP_FOR_VIEW`; `validViews` and a `restoreView` branch for its play views;
dealing through `freshPick` (one phone) or `nextPrompts` (rooms); its content
checked by `tools/validate-content.js`; the motion toolkit above; and in rooms
also a `RoomGames.js` branch, `ROOM_GAMES` and `TV_GAMES` renderers,
`ROOM_HUB_GAMES`, a `roomTurnOf` case if a turn waits on one phone, a round in
`rooms-worker/test/play-all.mjs`, and a deploy.

**The dice and the coin** are section 13: a real cube of six pip faces in 3D
(`DIE_PIPS` draws the pips into a 3x3 grid, `DIE_LANDING` says what to rotate
the cube to for the value that was actually rolled, opposite faces adding to
seven) and a coin that is tossed on a wrapper while it turns on its own X axis
(`coinTurns` only ever grows, so it always spins forwards and lands heads at a
whole turn, tails half a turn past). `--die` is the cube's size, and the faces'
`translateZ` is half of it, so a short screen shrinks the whole die by changing
one value. Both fall back to the result with no motion under
`prefers-reduced-motion` - which the desktop app's preview pane reports, so
the tumble cannot be seen there without overriding both the CSS and
`matchMedia`.

**Smoothness** is section 12 of `Style.html`, with its script in
`JS_Core.html` and `JS_Catalog.html`. A phone with recents gets the home hero
folded to one row of the ways in (`home-hero--compact`, *The catalog and the
home screen*); a game card is one shape
(icon and mode icons on one row, two lines of text, players and minutes on
one line); every setup screen's Start is moved once at start-up into a
sticky `.view-actions--start` bar at the foot of its panel
(`stickySetupStarts`, keyed on the button's `data-i18n`); the filter and
recents rows fade at the edge they can still scroll toward (`hscroll-fade`,
`watchScrollFade`); the home, مع بعض and الأدوات animate in only the first
time in a session (`settleStagger`) and come back where they were scrolled
(`viewScroll` in `setView`, on the way back only); the segmented control's
thumb slides (`syncSegmented`: the active option's place as `--seg-x` /
`--seg-w`, re-read by a MutationObserver on class changes, on each
`setView` and on resize, `has-thumb` once measured); counts are steppers
(`stepField`, `data-min` / `data-max` / `data-step` on a read-only input
with the old id, so the games read `.value` as before); Settings rows carry
a hint (`setting-row__hint`); and the lobby shows a shimmering skeleton
(`lobbySkeleton`) while a room is created or joined.

`Style.html` is a token-driven design system. Read its section header before
changing anything: colour, spacing, radius, duration and elevation all come from
custom properties in section 1, so a change happens in one place.

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

**Keys look like keys** (Wordle, ربع قرد's letters): `.key` is white paper
with a hairline and a lower edge, like the phone's own keyboard - it was
`--surface-3`, #f7f5f1 on a #f5f3ee page, and the keyboard all but vanished.
Dark mode keeps `--surface-3` through `:where(body.dark) .key`, weightless so
the right/present/absent colours still win.

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

**Landscape phones.** A phone on its side is 360–430px tall, and laid out like
portrait the app stayed a 520px column in the middle of the screen with a third
of the height gone to the header and nav. The *LANDSCAPE PHONES* block at the end
of `Style.html` (`orientation: landscape` and `max-height: 500px`, so tablets
keep portrait's layout) makes the app full width, turns the nav into a rail at
the inline-start edge, centres views in a readable column (the menu gets more
tiles per row) and tightens spacing that only existed to fill a tall screen.

Screens with a board and its controls put them side by side there, each through
a wrapper that is plain flow in portrait:

| wrapper | screen |
| --- | --- |
| `.play-stage__playing` (`__head` / `__card` / `__actions`) | Charades, Describe It |
| `.wordle-layout` | Wordle: board beside the keyboard; on a phone on its side the keyboard takes the width 28px keys need (35px in English) and the board, a size container, fits its grid in what is left (`cqw`/`cqh`), letters scaled to the cell |
| `.draw-layout` (`__head` / `.draw-wrap` / `__side`) | Draw & Guess, Fake Artist; the canvas is sticky so the tools can scroll |
| `.cn-layout` | Codenames: board beside the clue and controls |
| `.tb-play` | دوري المعرفة: board beside the scores |
| `#view-play-chess`, `#view-play-reaction` | the two halves split left and right |

A new screen like these needs its rule in that block, and every change gets a
look at 667×375 as well as 375×667. `docs/manifest.webmanifest` says
`"orientation": "any"` so an installed app turns too; nothing generates that
file, so it is the one thing in `docs/` edited by hand.

**Tablets, laptops and TVs.** Every size in `Style.html` is in rem: spacing,
radii, button and field heights, widths. So the font size on `<html>` scales the
whole app, while a phone keeps the default 16px.

- **Root size.** The ANY SCREEN block picks a larger one on big screens: 17px
  from 1024×700, up to 32px on a 4K TV.
- **Override.** Settings → Screen size (`html[data-ui-scale]`, `cycleUiScale` in
  `JS_Core.html`) sets it by hand, for a laptop driving a TV.
- **New sizes.** Write them in rem: a px size stays phone-sized next to text that
  grew. Borders and hairlines under 4px stay px.

The layout blocks:

- **Shared** (a phone on its side, and any screen at least 900 wide): the rail,
  the centred column, and the boards beside their controls.
- **Short** (a phone on its side, 500px tall at most): tightens spacing that only
  fills a tall phone screen.
- **Wide** (at least 900 wide): more padding, wider views and bigger keys.
- **Tablet held upright:** a 45rem column.
- **Big screen view** (`room-tv`): pins the root back to 16px, because it sizes
  itself in vmin.

Check a change at 375×812, 667×375, 1280×720 and 1920×1080.

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

**On an iPhone the back swipe is the app's own.** The owner reported twice
that swiping back on the iPhone "doesn't get the same animation as the back
button": Safari's gesture slides a picture of the page and the app then
changes screens with none of its own motion (with one trap entry the picture
was even the same screen). So on iOS (`EDGE_IOS`, Safari and the home-screen
copy) a touch that starts within `EDGE_PX` (20px) of the left edge is taken
first - `preventDefault` on `touchstart`, which iOS honours at the edge - and
only when there is somewhere to go back to (a popup, or any screen but the
home). The current view follows the finger (`translateX`); letting go past a
third of the width, or a quick flick, slides it out and runs `edgeBack` -
exactly the header arrow: the top popup closes, a game asks first
(`openExitSheet`), otherwise `goBack` with its slide and the icon flying home.
A shorter drag springs back. Because the default is prevented, the handler
passes a tap at the edge on as a `click` and scrolls `#shell-main` itself for
a vertical drag. If Safari takes the gesture anyway, the page receives
`touchcancel` rather than `touchend`, so nothing is done twice. Elsewhere
(Android's back button and predictive back, desktop browsers) the history
entries above do the work, and a browser that animated the way back itself
(`hasUAVisualTransition`) isn't slid in twice. iOS limits `pushState` to about
100 calls in 30 seconds; nothing here comes close. To test the swipe off an
iPhone, force `EDGE_IOS` true in a copy of `.preview/index.html` and dispatch
`TouchEvent`s at `#shell-main`.

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
same in `GAME_CATALOG`, `HELP_ENTRIES` and `ROOM_HUB_GAMES`.

**Some icons are drawn.** Emoji has no Uno card and no domino (🀄 is a
Mahjong tile), so أونو and الدومينو (and the domino score keeper) have
`icon: 'art:uno'` / `'art:domino'`: a small SVG in `ICON_ART` (JS_Core.html)
in the game's own colours - UnoCards' red with a white 7 over a blue card, the
ivory 6|6 with black pips and the brass pin - flat, with no ids, so a page can
hold it any number of times, and 1.2em square (`.art-icon`) so it sits and
grows wherever an emoji would. **An icon is never written straight into
markup**: `iconHtml(icon)` gives the emoji or the SVG, `iconText(icon)` the
emoji or nothing (a line of plain text: the room banner, the chat's "started"
line, which draws the SVG beside its text instead), `artIconImage(icon)` an
image for a canvas (the share card), `flyEmoji` flies either, and markup
written in `Controller.html` asks for one with `data-art-icon="domino"`,
filled in at start-up. A new drawn icon is one more entry in `ICON_ART`.

Motion uses the `--ease-*` and `--dur-*` tokens. Everything is gated behind
`prefers-reduced-motion`, and the drifting background animates `opacity` on a
fixed layer so it costs no repaints.

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
