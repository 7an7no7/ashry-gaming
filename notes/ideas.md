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

## The app's own UI pass, 7 Oct 2026 (waiting on the owner)

The owner: "ui ux improvements in the app itself, not the games" (another session had the games). 31 app screens and popups (home, مع بعض, tools, الشلة, the daily hub and archive, stats, timers, join, quiz maker and كلماتنا shells, settings, help, soundboard, «الليلة دي؟», the crews, install, confirm, players, name, the room lobby and its game tab, the chat, the exit sheet, the room banner, the TV lobby and its help) swept at 375x667, 667x375, 1280x720, 1920x1080 in ar/en x light/dark: no contrast, tap, overflow or missing-word failures. Page with screenshots: https://claude.ai/artifact/T27KQxnjbnrk9PDav7bd9w
Fixed at once: the bar's raised «افتح غرفة» (and a setup's) made a new room while this phone was in one, stranding the table without a host - it now asks (`room_new_leaves`) and leaves properly first (`roomCreateFor`, JS_Room.html); the TV bar's game name takes two lines on an upright phone used as the screen (Style_Screens.html).
Ideas: 1 the lobby in two columns on a laptop and a sideways phone (players start 710px down a 720px laptop); 2 a smaller code card on an upright phone (players start 671px down a 667px phone); 3 the raised button becomes «غرفتك» while in a room; 4 settings show their choices (3 Oct idea 8, still no look); 5 help folds its welcome after the first open; 6 the tools use the width from 1280px; 7 «رموز للألوان» (now أونو and Wordle only) for كونكت ٤, لودو and the team colours.
Wider ideas of the same day (data move code, lighter page, TV read-aloud, a weekly robot, manifest shortcuts, a smaller GEMINI.md): https://claude.ai/artifact/Y9z4DcAwYMzMrSeGwPxjbh

## The owner's picks of 7 Oct 2026 (A1, A2, B1, B2, B3, C2, C3, D1, D2, E1, E2, F1, G1)

From https://claude.ai/artifact/Y9z4DcAwYMzMrSeGwPxjbh. The owner's answers: A1 moves everything, a code good for 24 hours and usable more than once, merged on the new phone; E2 runs on every push to master; C2 and D1 change looks, so a sheet first: https://claude.ai/artifact/Vgk5PyCFxaKMga2AfpVmfS (C2: A shape in the middle, B corner badge, C the piece is the shape - my pick A; D1: A a shelf, B the «جربوا دي» poster deals untried games, C a ✨ on every untried card - my pick B). Built 7 Oct: F1 (`?open=join|daily|tonight` shortcuts, screenshots, `id`, categories in docs/manifest.webmanifest; screenshots in docs/screens/), B3 (`lzPrefetch` on pointerdown / a mouse resting 150 ms, JS_Lazy.html), C3 (`syncModalInert`, JS_Core.html: the shell `inert` while a popup is open, only the top popup live, focus in and back - the owner's pick replaces the 30 Sep "no focus trap").

## Calmer game setups (8 Oct 2026: the owner picked 1C 2A 3A 4C - BUILT, styles section 76 of Style_Talk.html)

The owner: the setup screens of games with many settings and switches look crowded; make them uncluttered and simple. The look sheet (real renders, 375px): https://claude.ai/artifact/CgToWDqVNMpgTZVBHtxtnc
Measured: the busiest setups are 1,400-1,815px long on a phone (chess 54 buttons, trivia, monkey, Stop, snakes, the spy, bank, X-O); the first option starts about 470-550px down, under the poster; every option is a grey tile with its explanation always showing; the poster's mode chips repeat the mode switch.
1. How the options sit: A one list (rows, hairlines) · B summary rows («name ··· value ▾», tap to open) · C the main 2-3 out, the rest under «خيارات أكتر» with their values (my pick).
2. The explanation under a switch: A only while the switch is on (my pick) · B an ⓘ bubble · C one line + «أكتر».
3. The top of the screen: A a short poster - the icon beside the name, the repeated mode chips gone (my pick) · B the mode switch as the poster's foot · C no poster.
4. Big pickers (chess opponents, bank pieces, snakes maps): A one sliding row · B one line, tap to change · C smaller, four to a row (my pick).
Nothing is removed in any look: options only fold (the owner's rule of 26 Sep 2026).

## New games of 9 Oct 2026 (the owner's rules, answered before building)

From a batch of bigger ideas given in chat (1401-1454; not kept here). The owner picked four; 1413 was dropped.

- **1413 «اعرض على التلفزيون» (Presentation API cast) - dropped.** Chrome on Android casts only to a registered Google Cast receiver app (`cast:APPID`, a paid one-time registration); arbitrary pages only from desktop Chrome. The owner: drop it, keep the ways we have.
- **1431 حسبة** (six numbers and a target; built 9 Oct 2026, notes/games/hesba.md). Levels in the setup: سهل (4 numbers, target under 100) and صعب (6 numbers: small 1-10 and some of 25/50/75/100, target 101-999). Every number used at most once, whole steps only; every deal is checked to be reachable exactly before it is used. The answer is built by tapping tiles (number, operation, number merge into a new tile; ↶ steps back), no typing. Rooms: the same deal on every phone, the TV shows the target and the clock; **the first exact answer wins the round**; if nobody is exact when the clock ends, the closest wins (a tie shares), then one exact way is shown. 60 s, 5 rounds (host: 30/60/90 s, 3/5/7 rounds). Also a daily puzzle in تحدي اليوم and solo unlimited with a best score. Not on one phone pass-and-play.
- **1430 شبكة الحروف** (Boggle). A 4×4 grid, 2 minutes (host: 5×5 / 3 min), 3 rounds in a room (host: 1/3/5). Diagonals link; 3 letters at least; ال is free (الأسد = أسد, no extra points); ة/ه and ى/ي are one letter, folded as everywhere. Words: any word in the app's lists counts at once; any other word goes to a quick vote of the room (the host on one phone), as in أتوبيس كومبليت; the daily and solo accept listed words only. Room scoring: only words nobody else found score, by length (3 = 1, 4 = 2, 5 = 3, 6+ = 5). Grids are built by weaving in listed words and kept only with at least 15 listed words including a 5+ letter one. Rooms, a daily in تحدي اليوم (share: found N of the total) and solo unlimited. English letters and the English lists when the games' language is English.
- **1436 العرّاف** (the app guesses what you think of). One phone only. Kinds: famous people (Egyptian, Arab and world-famous; traits that don't change only), cartoon and film characters, animals, things and jobs; the kind is asked as part of the questions («هو إنسان؟»), not picked first. Five answers (أيوه / لأ / مش عارف / غالباً أيوه / غالباً لأ), 20 questions, it may guess early when sure, three guesses in all. A first list of **1,000+** entries, each tagged with its traits, checked by the validator. When it loses it asks «كنت بتفكر في مين؟»: the name and the answers go to the server's report list for the owner to review and add (like «في غلطة؟»); nothing typed reaches other players. English too: every entry and question has its English name.
- The look sheet (9 Oct 2026): https://claude.ai/artifact/LtDnAyWLkZExt5yxDBpxMH - three looks each, drawn in the real app (render scripts in notes/archive/sheets: hesba-*, boggle-*, oracle-*). My picks: حسبة أ «اللوح», شبكة الحروف أ «صندوق الزهر», العرّاف أ «العرّاف على المسرح». Waiting on the owner; then build with `npm run new:game`.
- **سد الطريق** (Block the Way; Quoridor rebuilt our way, the owner asked after seeing wrongway.app, 9 Oct 2026). Rooms and the TV only (no one-phone way). A 9×9 board, 10 walls each (5 each with 4 players). A turn is one step or one wall (two squares long); a wall may never shut anyone in completely (a way through must always stay open). Two pieces face to face: jump straight over; if a wall is behind, step diagonally to either side. Ways: the duel (one against one, winner stays on, the tournament from 4 players, like the other duels), 4 players (everyone races to the opposite side; the first to arrive wins and the game ends; the night's points go by how close the others were), and 2 against 2 (teams sit opposite; either teammate arriving wins for the team). No clock by default; the host may set 15 or 30 s a move (a random step when it runs out). Computer players can fill a room, three levels (سهل / وسط / صعب), the host picks. A wall is put down by tapping a groove (a ghost wall, tap again to turn it, «حطّه» to put it); a wall that would shut someone in shows red and can't be put. Its own card. Next: a look sheet of three.
