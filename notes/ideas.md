# Ideas not built yet (researched 16 Sep 2026)

Moved from GEMINI.md on 30 Sep 2026. GEMINI.md keeps the rules that apply to every game and an index; this file keeps the detail, word for word.

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

## The whole-app UI pass, 3 Oct 2026 (the owner picked 1-10)

The page with screenshots: https://claude.ai/artifact/LKcti6ojxsaopYT7eYoMUw
1. A shorter setup header on phones under ~700px tall (one row: icon, name, chips).
2. One way to the rules on a setup («القوانين» chip and «أول مرة؟» drawer both lead there).
3. «افتح غرفة» twice on مع بعض: the raised button becomes «ادخل غرفة» there, or the page drops its own.
4. The raised «افتح غرفة» steps down into the bar while a one-phone game is played.
5. تحدي اليوم: "0 of 14" and the list first; «شارك» only once there is a result.
6. The first visit's «نلعب كل واحد بموبايله» on one line («كل واحد بموبايله»).
7. دوري المعرفة: category heads as a bigger icon and a short name, the full name on the card.
8. Settings show their choices (a segmented row) instead of cycling on each tap.
9. A laptop or TV's first visit opens «كل الألعاب» under the three cards.
10. Chess sideways: the buttons as one row of icons, the board the full height.
11. Puzzle cells named for VoiceOver (row, column, contents).

The owner's answers (3 Oct 2026): 2 - drop the header's «القوانين», keep the «أول مرة؟» drawer; 3 - on مع بعض the raised button is «ادخل غرفة», the page keeps its big «افتح غرفة»; 4 - as in a room game, the raised button lowers into an ordinary tab on one-phone play screens; 5 - «شارك نتيجة النهارده» only once every puzzle of the day is done; 9 - from 1280px wide the first visit shows «كل الألعاب» open under the three cards. 1, 7, 8, 10 change looks: a before/after sheet of three first (https://claude.ai/artifact/TybGWnUVHhgWeitq1jPtWC). 2, 3, 4, 5, 6, 9 built and live 3 Oct 2026; the owner picked looks 1C, 7A and 10C, built and live the same day; 8 (settings) had no look picked, still open.
Decided 3 Oct 2026: مع بعض keeps its own «ادخل غرفة» button beside the raised one (the page lists the three ways in; a repeat between a page and the bar is fine). If the family trips on the raised button changing meaning on that tab, put it back to «افتح غرفة» everywhere (`syncNavRoom` in JS_Core.html).

## Bigger changes, 3 Oct 2026 (a sheet of three looks each, waiting on the owner)

https://claude.ai/artifact/TybGWnUVHhgWeitq1jPtWC was the first look sheet (1C, 7A, 10C built). The second, https://claude.ai/artifact/2FXyHZRr4fiMMeEvbi3iwP, has four bigger changes, each with the screen as it is and three looks, rendered from the app, the motion as moving pictures:
1. The room lobby, the people first: the player list sat 4,459px down a phone's lobby, under the code, the mission, the program and 59 tall posters. A faces on top (slim code row, faces, mission and program side by side, small game tiles), B two tabs (اللاعبين / اختار لعبة), C faces stacked in the code card and each games section one sideways row. A face pops in when someone joins.
2. The TV lobby as a stage: A dark show (big code beside the QR, faces along the bottom), B eight seats that fill, C a colour poster with the QR and «الليلة معانا» as a big guest list. A new face drops in and bounces.
3. A shorter home for a returning player (5,372px on a phone): A shelves as on a laptop (2,806px), B four small tiles a row (3,043px), C folded sections with their icons in a row (1,626px).
4. Opening a game: A the card grows into the header, B the screen rises as a sheet over the dimmed home, C the home zooms through the card.

The owner picked 1B, 2A, 3A, 4A (3 Oct 2026), and answered: the lobby's tabs become «اللاعبين» / «اللعبة: …» once the host picks a game, and the room turns to the game's tab by itself (options and Start there, «تغيير» back to the list); other players' phones get no tabs - the code, the faces and «المضيف بيختار اللعبة…», then the chosen game's card under the faces; the TV's stage is always dark; a soft pop as each face lands on the TV (the app has no sound switch: the TV's own volume). All four built and live 3 Oct 2026.

## Sheet three, 3 Oct 2026 (waiting on the owner)

https://claude.ai/artifact/2V7KTKB4MiGj9uTE7r1XYR - four more, each as it is and three looks rendered from the app:
1. The bottom bar while a one-phone game is played (a hand reaching for «صح!» can hit 🏠; 75px the game could use): A no bar on play screens, B folded to one ☰ button, C away only while a clock runs.
2. Joining a room: A four letter boxes, the saved name as a chip, «ارجع للغرفة» for the last room; B scan first (a picture of the camera on the code), boxes second; C the boxes at the top of مع بعض, no separate screen. Joining by itself on the fourth letter.
3. Passing the phone (the one-phone deduction games): A everyone's faces under the card (looked ✓, whose turn ringed), B a ring «2 من 4», C a full colour hand-over screen «ادّي الموبايل لـ سارة» with «أنا سارة، وَرّيني» before the card.
4. The tools tab (1,857px): A tiles two a row, B app icons three a row (1,174px), C slim one-line rows.
The owner picked 1A, 2A, 3A, 4B; built and live 3 Oct 2026. The bar goes in room games too (the owner).
