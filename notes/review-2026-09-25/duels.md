# Review of 25 Sep 2026: the duels, chess and the sports

**Reviewer:** 6 of the night's review (the "duels" area).
**Branch:** this worktree, based on `008d197`. That base is a few commits
behind master (see the stylesheet bug below).

**How I played:**
- Headless Chrome through my own DevTools driver, one browser with a context
  per phone. The rooms server was on :8806 and the preview on :4356.
- Motion was on (`prefers-reduced-motion: no-preference`) and 3D was drawn
  with SwiftShader.
- For rooms, five phones joined one room with a TV:
  - 375×812 Arabic light (the host)
  - 375×812 English dark
  - 667×375 Arabic (a phone on its side)
  - 390×844 Arabic dark
  - 1280×720 English
  - the TV at 1920×1080
- Moves were made by small scripts in each page that call the games' own move
  functions: the app's easy computer players, `golfAutoShot`, and random
  bowling swings.
- The console was checked after every step. Apart from three.js's own
  deprecation notice and `navigator.vibrate` notices, which only headless
  Chrome gives, it was clean.

## The most important finding

**The stylesheet's section 35 lost its opening, so everything after it was
nested inside a `prefers-reduced-motion` block.** In `Style.html`, the end of
section 34's reduced-motion block was missing its `}` and the `/* ====` that
opens the section 35 comment. Every rule from باغ هاوس onwards therefore sat
inside `@media (prefers-reduced-motion: reduce)` as nested CSS. That covers
bughouse, شطرنج الأربعة and everything after them.

What it did on a normal phone:
- **Bughouse had no layout.** The TV showed one board 1,100 px wide off the
  screen with no board 2, and the players' rows had no styling.

Fixed with the same two lines master already has: master's `a9d765c` "the
stylesheet brace fix" fixed exactly this. The two branches' changes are the
same, so the merge is clean. The whole stylesheet now parses to depth 0.

**Question for whoever merges:** the live site should be checked to make sure
it doesn't serve a build from before `a9d765c`.

## Per game

### الذاكرة (Memory)

**Played:** two players at 375 in Arabic, a miss and then every pair. The
last pair turned over by itself, as it should.

**Fixed (`JS_Memory.html`):**
- **The two-player result read "6 – 0" with no names.** In an Arabic line you
  can't tell whose 6 it is. It now shows each player's name beside their
  number («لاعب 1 **0** · لاعب 2 **6**»).
- **The last pair could turn a card of the next board.** Its automatic flip
  (`memoryLastTimer`) was never cleared when a new board was dealt within
  its 0.65 s. `memoryStopClock` clears it now.

**Seen, not changed:** confetti also plays on a draw in two-player mode.

### إكس أو (Tic Tac Toe)

**Played:** against the phone on hard with "3 marks only", to the end, at
375 and 667×375. The fade on the oldest mark, the board layout and the tally
were correct.

Nothing to fix.

### كونكت ٤ (Connect 4)

**Played:**
- Against the phone on hard with 5 in a row (9×6), at 375 and 1280.
- A **tournament of five** in a room: three byes, simultaneous matches,
  every phone and the TV, all the way to the podium.

The draw's byes («عدّى على طول»), the "2 matches playing" cards on the TV,
the live mini boards, the champion's podium of four with 3/2/1/1 points on
the strip, and the English dark phone all looked right.

Nothing to fix.

### نقط ومربعات (Dots and Boxes)

**Played:** against the phone on hard, 4×4, to the end. The initials
(أ / م), the tints and the pills were correct.

Nothing to fix.

### حرب السفن (Battleship)

**Played:** against the phone on easy in 3D, placing, then to the phone's
defeat, at 375. The shell's arc, «إصابة!», the sunk ships, the win line and
«ماتش كمان» all worked.

Nothing to fix.

### خمّن الرقم on one phone

**Played:** against the phone and with a friend.

**Fixed:**
- **The range read "50 - 1" in Arabic.** It now has `dir="ltr"` in
  `Controller.html`.
- **Enter on the phone's keyboard did nothing**, so you had to reach for ✅.
  Enter now guesses, and the field has `inputmode="numeric"` and
  `enterkeyhint="go"`.
- **A guess outside the range counted as a try.** It is now a nudge: «الرقم
  ما بين 1 و 50», and no try is counted.
- **Formal Arabic changed to Egyptian:**
  - «المدى غير صحيح!» → «المدى مش مظبوط: أول رقم لازم يبقى أصغر»
  - «أدخل الرقم السري!» → «اكتب الرقم السري الأول!»
  - «ابدأ التخمين!» → «يلا خمّن!»
  - «صحيح!» → «صح!»
  - The setup: «أدخل الرقم السري (لا تدع صديقك يراه!)» → «اكتب الرقم السري
    (من غير ما صاحبك يشوفه!)»
  - «حدد المدى (من - إلى)» → «اختار المدى (من - لـ)»
  - The mode tabs «الكمبيوتر / صديق» → «الموبايل / صاحبك», to match the
    English "The phone / A friend".
- **Hard-coded colours** (`text-blue-500`, `bg-cyan-600`, `text-cyan-600`)
  were replaced by the design system's tokens.

**Seen, not changed:** the friend's secret number is typed in a plain number
field, and the input is cleared right after Start. The `.secret-field` dots
(the المشنقة trap) would be better here, but that is more than small polish.

### اختبار سرعة البديهة (Reaction test)

**Played:** a round to a win on 375.

**Fixed:** every string was formal Arabic.
- «انتظر» → «استنى»
- «اضغط!» → «دوس!»
- «مبكر جداً» → «بدري أوي»
- «الفائز!» → «كسبت!»
- «جزء من الثانية» → «مللي ثانية». This one was also wrong, not just
  formal: it is milliseconds.
- The description, rewritten in Egyptian.
- «اضغط للعب مرة أخرى» → «دوس عشان تلعبوا تاني».

### شطرنج (Chess)

**Played:**
- Against the computer at 800 with the coach: 10 moves, a reload in the
  middle (it came back), resigning, and the whole review.
- The hidden queen against «نونو»: the pick, then the computer revealing its
  queen, «👑 وزير مستخبي!».
- A room duel on the clock (3+2) with three watchers and the TV in 3D.
- Help on the play screen.

**Fixed:**
- **The computer's pill was cut off at 375** («الكمبيو…»).
  - The pill now says «الكمبيوتر» with the rating under it, as the
    characters' pills already do (`JS_Chess.html`, new key `ch_cpu_plain`).
  - The review's player names and its counts table now wrap instead of
    cutting (`Style.html`).
- **The coach's sentences were masculine**, so with the rook they read
  «الطابية بتاعك … ممكن يتاكل» and «بتنقذ الطابية اللي كان هيتاكل». They
  are reworded to work for every piece:
  - «ممكن ياكلوا {piece} اللي على {sq}»
  - «بتبعد {piece} عن الخطر»
  - «شوكة من {piece} على {sq}: هجوم على حاجتين مع بعض»
  - «بتسمح بشوكة من {piece} على {sq}: هجوم على حاجتين»
  - «هيتعمل تثبيت على {piece} اللي على {sq}». This one also drops «ومايقدرش
    يتحرك», which isn't true of most pins.
  - The English "{san} takes the centre" becomes "{san} would have taken the
    centre", to match the Arabic «كان أحسن…».
- **On the TV, the opening's name and «لسه مفيش نقلات» were 12 px captions.**
  The TV root stays 16 px while everything else is sized from the screen, so
  they now follow the moves' size.

**Openings (`JS_ChessOpenings.html`):**
- "Scotch: Mieses" on 4…Nf6 → **Schmidt Variation** (Mieses is 5.Nxc6 bxc6
  6.e5).
- "Queen's Indian: Classical" on 4.g3 Ba6 → **Nimzowitsch Variation**.
- The Vienna's Max Lange Defence moved to **1.e4 e5 2.Nc3 Nc6**, where it
  begins.
- "Evans Gambit Accepted" now shows from 4…Bxb4.
- Petrov 3.d4 → **Modern Attack**.
- Arabic names:
  - «هجوم لارسون-نمزوفيتش» → «هجوم نيمزوفيتش-لارسن»
  - «هجوم فالكبير/ألبين المضاد» → «جامبيت … المضاد»
  - Traxler gets its «دفاع الحصانين:» prefix
  - «الدفاع الهندي النمزوفيتشي» → «دفاع نيمزو الهندي», and the same in its
    three lines
- Added: **Zukertort Opening** (1.Nf3), and **Indian Defence** from 1.d4 Nf6.
  Before, nothing matched until 2.c4.
- The content check plays all 152 lines.

**Seen, not changed:** «الفوز لـ الكمبيوتر» reads awkwardly (it should be
«للكمبيوتر»). The same «الفوز لـ {name}» pattern is used across many games,
so I left it.

### ألغاز شطرنج (Chess puzzles)

**Played:**
- A free medium puzzle with one wrong move first: counted once, then solved.
- The daily, solved first time, with its sheet.
- The streak, where a wrong move shows the solution and «اللغز اللي بعده».

**Fixed (Help):** it said the puzzles came «من أدوار حقيقية» ("from real
games"). The generator makes them from games the engine plays against
itself, so it now says «من أدوار لعبها مع نفسه».

### شطرنج بالتصويت (Vote chess)

**Played:** five people in two teams: votes, a three-way tie drawn by lot,
«محدش صوّت: نقلة عشوائية», and the TV in 3D.

Nothing to fix beyond the TV caption above.

### المخ والإيد (Hand and Brain)

**Played:** four seated and one watching. The Brain named the knight
(«المخ (Sara) قال: الحصان!»), the Hand moved it, and the TV followed.

**Fixed:** the English piece buttons read "king queen rook…" in lower case.
They now start with a capital letter (CSS only).

### باغ هاوس (Bughouse)

**Played:** four seats and a watcher on the phones, a phone on its side and
the TV, after the stylesheet fix above. A reload mid-game came back.

**Fixed (Help):** it said «التنزيل لازم يسدّ الكش» (a drop *has to* block a
check), as if a drop were the only way out. It now says a drop *can* block it,
or the king can move as usual. The same in English.

### شطرنج الأربعة (Four-player chess)

**Played:** teams, with four people moving through the easy computer's
choice, on the phones, the phone on its side and the TV. The board turns
with each player's colour.

Nothing to fix.

### بولينج (Bowling)

**Played:**
- **Solo**, 5 frames to the result sheet, with a reload mid-game (the
  frames came back).
- **A room** of three people with the TV, a few balls each.

**Fixed (Help):** «اللي عنده أكتر بينز في الآخر يكسب» ("the most pins
wins") was wrong, because strikes and spares carry bonuses. It now says
«اللي نتيجته أعلى في الآخر يكسب», and the same in English.

### ميني جولف (Mini golf)

**Played:**
- **Solo**, 3 hard holes to the result.
- **A room**, all at once, with three phones and the TV.

**Fixed:** the solo result said «🏆 رقم قياسي جديد! 🏆», with the trophy
twice, because the string already carries one.

**Seen, not changed:**
- All at once, the name tag over the tee can be another player's on your own
  phone, because the balls sit on one spot.
- The hole names were checked: all 60 are in both languages, with no
  duplicates and no wrong places.
- English "Philae" was changed to "Philae temple", to match «معبد فيلة».

## Data checked (a second agent read everything, and I applied what was sure)

- **The six characters' lines and the eight endgames** (their FENs, whose turn
  it is, and the advice): all correct.
- **The Help texts for my games against GEMINI's owner specs:** only the three
  errors above.
- **Philidor's advice** ("the sixth rank"): correct as written. «الصف التالت
  من ناحيتك» would be friendlier. I left it; the owner can decide.
- **«الحسبة (هانديكاب)»** on the chess setup: I'm not sure an Egyptian table
  calls a handicap «حسبة». Question for the owner.
- **«الهرم» next to «أهرامات الجيزة»** as two golf hole names, and
  **«الدوّارة»** for the carousel: these read slightly oddly. I left them.

## Checks run

- `npm run check`: passes. It includes 152 openings.
- A parse check of every script I edited.
- A brace-balance check of `Style.html`: depth 0.
- `ONLY=screens` of the screen test against my server: **20 passed, 0
  failed** (125 screens at three sizes in Arabic light and English dark, and
  50 games started).
- **Not run:** `test:rules` and `play-all`. Nothing the rooms server runs was
  touched (no `Room*.js`, `RoomGames.js`, bundled list or `rooms-worker/`).

## What I could not check

- Real touch drags: the swing, the pull-back and dragging pieces. All moves
  went through the games' functions.
- Sound.
- An iPhone.
- A whole bowling or golf game in a room: SwiftShader is too slow, at about
  10 s a ball.
- The chess 3D camera gestures.
- The share video.
