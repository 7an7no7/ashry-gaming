# GEMINI.md - Ashry Gaming (عشرى جيمينج) 🎮

## Project Overview
**Ashry Gaming** is a party-games web app for phones: a hub of social games and utility tools with a responsive UI in Arabic and English, and dark mode. It began as a Google Apps Script web app; it is now a static site on GitHub Pages, with multiplayer rooms on Cloudflare.

- **App:** https://7an7no7.github.io/ashry-gaming/ (GitHub Pages, `master` → `/docs`)
- **Rooms server:** https://ashry-rooms.rooms-worker.workers.dev (`rooms-worker/`)
- **The old Apps Script version** is a frozen copy in `C:\Users\TPC\Apps Script\G`
  (git tag `apps-script-v177`). Its `/exec` link still works, with its own rooms; nothing
  changed here reaches it.

### Main Technologies
- **Hosting:** GitHub Pages (static files in `docs/`, built by `tools/build-site.mjs`)
- **Rooms:** Cloudflare Workers + Durable Objects over WebSockets (`rooms-worker/`, free plan)
- **Storage:** no database. Word lists are code (`SpyWords.js`, `PartyContent.js`, `ChameleonWords.js`, `SpyfallPlaces.js`, `BombPrompts.js`, the `JS_*.html` banks); names, groups and the "already dealt" memory live in each phone's `localStorage`; a room lives in its Durable Object's storage while it is played.
- **Frontend:** HTML5, CSS3, Vanilla JavaScript
- **UI Framework:** Tailwind CSS v3, compiled locally to `Tailwind.html` (see *Styling*)
- **External Libraries:** `canvas-confetti` and a QR code generator, pinned on jsDelivr

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
  🗓️ **Timeline (قبل ولا بعد):** put an event in its place on the line,
  before or after the cards already down.
- **Two players & solo:** 🎴 **Memory (لعبة الذاكرة)** solo against the clock
  or two on one phone; ⭕ **Tic Tac Toe (إكس أو)** against a friend or an
  unbeatable minimax.
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

### Waiting

- **سكرو, still open** (built as below, each in one place so it can change):
  - the deck: the owner's own "66-card" table (17 Sep 2026) adds up to 62 -
    the base with four بصرة (59) plus the thief's three cards - which is what
    the app deals for Classic + الحرامي; no source that adds up to 66 was found;

- **Two طرنيب ٤١ rules for the owner to decide** (the scorer doesn't guess):
  a failed bid of 13 scores 0 today (options: keep it; charge a fixed amount
  such as −36, the value of 12; or the team loses outright, mirroring the
  outright win for making 13), and when both teams qualify in the same round
  team 1 wins because it is checked first (options: the higher qualifying
  player wins; the higher team total wins; play on until only one qualifies).

### The owner's specs, as built

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
    each version card. That is 57 base cards; the owner said 66 (see
    *Waiting*).
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
    **knocks (دق)** and passes.
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
    tap** (the table sees how many were drawn), with the knock a tap of its own.

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
  section 18 of `Style.html`) in the ivory look the owner picked, every move
  animated, the round's hands turned over and counted, a podium or the two
  sides at the end. Later the same day the owner's rule for every screen -
  while a round is played the table gets most of the screen, names and
  scores a compact strip - reshaped the phone, laptop and TV layouts (the
  table is 97% × 72% of the TV). The score keeper stays the setup's "على
  الطاولة" side. Robot tests: 1160, with 62 of them domino's; the rules test
  pins the tiles, the ends, the points, the rounding and every way a round
  ends. Nothing of the other games changed; a deploy is needed for the rooms
  server.

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
  `tools/` waits for it and confirms the link serves the build in `docs/`.
- **The rooms server:** `npm run deploy` in `rooms-worker/`. Needed whenever
  `RoomGames.js`, any list it bundles (the `FILES` in `rooms-worker/build.mjs`:
  `SpyWords.js`, `CodenamesWords.js`, `PartyContent.js`, `ChameleonWords.js`,
  `SpyfallPlaces.js`, `BombPrompts.js`, `EmojiRiddles.js`, `Proverbs.js`,
  `MonkeyWords.js`, `StopWords.js`, `TriviaQuestions.js`, `SkrewCards.js`, `TimelineEvents.js`,
  `DominoTiles.js`, and the games' own rule files after `RoomGames.js`, such as
  `RoomDomino.js`) or `rooms-worker/src/` change. Build `docs/` first: the
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
  count straight against `RoomGames.js`, no server needed.
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
never submits and the round never advances.

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
| `rooms-worker/src/memory.js` | `PromptMemory`: which prompts every room dealt lately. |
| `rooms-worker/src/live.js` | `LiveStats`: how many players are online across every room, for `GET /live`. |
| `RoomGames.js` | `applyRoomAction` — one branch per game. All rules live here. |
| `CodenamesWords.js`, `PartyContent.js`, `SpyWords.js`, `ChameleonWords.js`, `SpyfallPlaces.js`, `BombPrompts.js`, `EmojiRiddles.js`, `Proverbs.js`, `MonkeyWords.js`, `StopWords.js`, `TriviaQuestions.js`, `SkrewCards.js`, `TimelineEvents.js` | Word lists (and سكرو's cards, and قبل ولا بعد's dates) the rules deal from, bundled into the Worker. Nine of them are also inlined into the page by `tools/build-*.mjs` (the `SHARED_LISTS` comment in `Controller.html`), because the pass-the-phone versions of those games deal from the same lists, a Stop phone checks its boxes with the server's own rule, the solo games ask from the room trivia's questions, and a سكرو phone names and draws the cards the server deals. **Two stay server-only, on purpose:** `PartyContent.js`, because the Fibbage answers in it must never reach a page, and `TimelineEvents.js`, because the years of unplayed cards are قبل ولا بعد's whole secret. |
| `DominoTiles.js` | The domino tiles, the table, the ends and their points, a round's result and the table's layout: pure functions, shared by the page (inlined like the lists) and the Worker, every name prefixed `domino`. |
| `RoomDomino.js` | `dominoAction` and its clock, its leave and its computer players: bundled after `RoomGames.js`, so a game this size keeps its rules in a file of its own. |
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
spin the alarm on the free plan.

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
through it; `rules.mjs` pins the cases. Fibbage lies, Just One clues and
Codenames still use the plain fold: there "the same word" is the point.

**Draw & Guess words are things a phone can draw and a table can name.** The
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
The bank is `TimelineEvents.js`: 22 events, 1869-2015, Egyptian and Arab
first with famous world dates mixed in (the owner, 20 Sep 2026), each with one
year nobody argues about. **It is bundled into the Worker only** - deliberately
not inlined into the page like the other shared lists - because the years of
unplayed cards are the whole secret and the app would otherwise ship the
answer key, the same reason `PartyContent.js` stays server-side. `npm run
check` fails on a repeated year or a missing language. The hand size is worked
out from the cards that actually came back, so twelve players get one each
instead of the deal failing on a bank of 22, and spare cards are dealt for the
replacements. The line carries `dir="ltr"` in both languages: it is a physical
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

**الدومينو on the phones and the TV** (`JS_RoomDomino.html`, section 18 of
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
  drawn tiles fly from the pile; a knock jolts the seat with 👊 دق and the
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
6. Add a round of it to `rooms-worker/test/play-all.mjs`, then `npm run build:site`
   in `tools/` and `npm run deploy` in `rooms-worker/` — in that order, because the
   deploy uploads `docs/`.
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
footer, text })` draws it on a 1080x1920 canvas instead - the app's violet
ground, the game's icon and name, up to ten rows of name and score, a line of
the game's own, and the mark and the link at the foot - and sends it. Three
ways out, in order: the phone's share sheet with the picture attached
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
(`docs/sw.js`) all work. The build also writes the rooms server's address
(`roomsUrl` in `tools/site.config.json`) into the page as `window.ROOMS_URL`,
with a `preconnect` so creating a room doesn't wait for the connection.

So a change can need two releases. Client files only: rebuild `docs/` and push.
Anything the rooms server runs (`RoomGames.js`, the lists in `FILES` in
`rooms-worker/build.mjs`, `rooms-worker/src/`): also `npm run deploy`
in `rooms-worker/`, or rooms keep the old rules. `docs/README.md` has the steps.

The rooms server also serves a copy of `docs/` at its own address, uploaded on
every deploy — a second address for the app if `github.io` is ever blocked.

**New builds reach an open app.** Settings → تحديث البيانات is a real
`location.reload()` (the worker fetches the network first), and when a new
build's worker takes over a page that already had one (`controllerchange`),
a tappable toast says a new version is ready. An iPhone home-screen copy can
stay open for days and has no reload button of its own. The worker takes
over as the app opens too (the page was fetched fresh from the network, and
the new worker claims it a moment later), which showed the toast on a page
that already was the new build: the build writes its id into the page
(`window.BUILD_ID`, the same stamp as the cache name in `sw.js`), and the
toast asks `sw.js` for its stamp first and stays quiet when they match. A phone opening the
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
الأدوات and from the end of the intro) - and at most once a visit: a visit
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
  by distance alone (8). `COUNTRIES` is the one new list of the batch, because
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
  Tarneeb 41 refuses made bids adding up to more than 13. Two Tarneeb 41
  cases are waiting on the owner (see *Waiting*).
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
holder's screen says "tap to hear the ticking" while it is asleep. An iPhone
on silent plays no web sound at all; nothing on the page can change that. The
bomb ticks with its own `playSound('bomb')`, a wooden tick-tock loud enough to
hear across a table, on the holder's phone and the TV only.

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
  Toe through their `restoreX()` functions): the whole game is in `appState`,
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

And the rules they rely on: key a reveal with `motionFirst(key)` so a redraw
doesn't replay it; check `motionOff()` before moving anything, and set the end
state without motion when it is true; transform and opacity only; start
clocks on the first drawn frame; every end state also set by a timer, never
only by an animation event. New CSS goes in section 14 of `Style.html`, with
its `prefers-reduced-motion` line in the block at the end of that section.

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

- Put a bottom action bar in `.view-actions` (sticky inside the scroll area).
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
| `.wordle-layout` | Wordle: board beside the keyboard |
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
