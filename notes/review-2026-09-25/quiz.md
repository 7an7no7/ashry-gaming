# Review of 25 Sep 2026 - the quiz and word games (reviewer 4, "quiz")

Played in my own headless Chrome (a browser context per phone), against my own
local rooms server (port 8804) and preview (port 4354). Sizes: 375x812 and
375x667 upright, 667x375 on its side, 1280x720, and the TV at 1920x1080;
Arabic light and English dark. A room was three phones (منى the host at
375 Arabic light, Sara at 667x375 English dark, كريم at 375 Arabic dark) and a
TV. Screenshots I kept are in `shots-quiz/`.

Nothing was deployed or pushed; `docs/` was not rebuilt.

## The data (the most important part)

Every bank was read item by item where time allowed; the trivia banks and the
proverbs first.

### Changed (old → new, why)

**TriviaQuestions.js** (room trivia, streak)
- «ما هو أكبر كائن حي يعيش على اليابسة؟» (answer: the elephant) → «ما هو أكبر
  حيوان يعيش على اليابسة؟». The largest *living thing* on land is a tree
  (a sequoia), so the question as written had a wrong answer.

**JS_TriviaBoardBank.html** (دوري المعرفة)
- Films 100: a Donald Duck question (Hollywood; the bank's own header says the
  film category is Egyptian and Arab) → «مين الممثلة اللي قامت ببطولة مسلسل
  «لهفة»؟» - دنيا سمير غانم (EN: "Which actress starred as Lahfa in the series
  'Lahfa'?" - Donia Samir Ghanem).
- Food 100: «الكاتشب معمول أساساً من أي فاكهة حمرا؟» → «الكاتشب معمول أساساً
  من إيه؟» (EN "What is ketchup mostly made from?"). Calling a tomato «فاكهة»
  starts an argument at a family table, and the old wording gave the colour away.

**EmojiRiddles.js**
- AR كباريه (🎶🍸💃 - a cocktail glass, a nightclub film) → إكس لارج
  (👕❌🍔⚖️, alt اكس لارج / xl). Adult.
- AR قطار إلى بوسان (a zombie horror film) → هالك (💚💪😡, alt hulk / الرجل
  الأخضر).
- AR الجوكر (an R-rated film) → كابتن أمريكا (🛡️⭐🇺🇸); EN Joker → Captain
  America the same.
- AR الطاهي / EN Chef (a film few families know) → تشارلي ومصنع الشوكولاتة
  (🍫🏭🎩, with alts).
- AR فتة باللحمة (a near duplicate of فتة already in the list) → مكرونة بشاميل
  (🍝🧀🥛🔥).

**Proverbs.js** (Egyptian colloquial, as said)
- «ما تقولش فول لحد ما يبقى في ___» (العدول) → «ما تقولش فول غير لما يبقى في
  ___» answer **المكيال**, alts العدول, الكيل. The saying is «ما تقولش فول إلا
  لما يبقى في المكيال»; العدول was a rarer variant and would be marked wrong for
  most tables.
- «اسأل مجرب ولا تسأل ___»: answer حكيم, **alt طبيب** added (both are said).
- «ابن الحلال عند ذكره ___»: answer يبان, **alt بيبان** added (the everyday form).

**JS_Connections.html** (words nobody at a family table knows, adult or pork)
- ترومبيت (four puzzles) → فلوت / كمان / مزمار / كمان (one per puzzle, each checked
  to fit its group and not repeat another tile).
- يعسوب → دبانة; بلشون → وزة; هارب → كمان (same reasons the Draw & Guess list
  dropped them on 23 Sep).
- EN Cider → Sahlab (alcohol); EN Carbonara → Ravioli (pork).
- Hard: إكسيليفون → صاجات.
- Hard: زفير → عقيق. **زفير means an exhaled breath**; the gem is ياقوت أزرق /
  زفير with a different spelling - as a "precious stones" tile it was simply wrong.

**WordleWords.js** (obscure animals and fruits, instruments nobody plays, and
one pork word; every replacement is the same length, on the keypad, and a
word a family uses)
- 5: قضاعة→حلاوة, ألبكة→حصيرة, بوملي→كرتون, يعسوب→مئذنة, كركند→أهرام,
  سمندل→طبلية, طوقان→مكوجي, بلشون→طباخة.
- 6: رتيلاء→بسكوتة, إغوانا→دبابيس, كوكاتو→كتاكيت.
- 7: كومكوات→برتقالي, ترومبون→بلياتشو, ترومبيت→كوبايات.
- 8: كونترباص→طرابيزات, كلارينيت→سيمفونية, ترايثلون→رومانسية.
- EN: BACON → SCONE.

**Countries.js**: read through; nothing wrong found.

### Uncertain, left for the owner (not changed)
- Board, geography: "the White Nile flows out of Lake Victoria" - a common
  simplification (it's called the Victoria Nile there; the White Nile proper
  starts later). Fine for a family game, but a pedant at the table may object.
- Board, sport: "first Egyptian world squash champion - Amr Shabana". True for
  the World Open (2003); earlier Egyptians held other world titles (e.g. juniors).
  Worth a check.
- Room trivia AR «أي دولة اخترعت الورق؟» with مصر among the options: China is the
  answer, but papyrus makes مصر an arguable pick at an Egyptian table.
- EmojiRiddles AR has a whole «أفلام أجنبية» kind (Hollywood). It is a kind of
  its own by design, so I left it; the owner may want it smaller in the Arabic
  mix.
- An English riddle "Las Vegas" (adult connotations mild) - left.

## Per game

### دوري المعرفة (team board with the steal)
Played at 375 AR light, 667x375, 1280x720 EN dark and 1920x1080: opened a card,
wrong → the steal band, reload mid-steal (came back in the steal with its
remaining time), the steal's clock running out (answer shown, nobody scores),
an award, «رجّع آخر سؤال».
- **Fixed:** on a laptop / TV the board was a short strip in the top half of the
  screen: the cells now take the height (`.tb-cell` min-height from `--app-h` in
  the wide block, Style.html).
- **Fixed:** the category header of the "Egypt" column showed "EG" on Windows
  (flag emoji). The header icon and the card's category label are
  `.flag-emoji` and ask `flagsEnsureFont()` (JS_TriviaBoard.html); also the
  flag font is now loaded once at start-up for everyone (JS_Flags.html) and
  is in the app's font stack (`--font`, `--font-display`, Style.html; the
  Twemoji flags font covers only flag code points, so nothing else changes).
- Seen, not fixed: at 375 «👁️ إظهار الإجابة» wraps to two lines; at 667x375 the
  open card's buttons sit tight to the bottom edge (scrolls, nothing hidden).

### تحدي المعلومات in a room
Three phones and the TV to the podium.
- **Fixed (bug):** a player who answered **wrong** (the host included) got the
  audience bar («مين هيكسب؟», cheers) over the "next question" button, because
  the audience code treated `shared.order` as the seats, and in trivia (and
  the emoji / proverb quiz, two truths) `order` is the list of right answerers.
  `AUDIENCE_ORDER_NOT_SEATS` in JS_RoomAudience.html skips `order` for those
  games.
- **Fixed:** "+15" after the Arabic «🎉» read "15+" (JS_RoomTrivia.html, `<bdi
  dir="ltr">`), and the fastest-answer chip on the TV the same (JS_RoomTv.html).
- **Fixed:** the TV's right answer ring was cut off at the edges (the stage
  clips; `.tv-trivia > .tv-choices` got padding).
- Seen, not fixed: the award chip «أسرع واحد منى 3» - the 3 (the bonus?) isn't
  explained; it comes from the shared award renderer used elsewhere.

### فوازير إيموجي
One phone (reveal, points chips) and the room's three ways: «واحد يكتب» (set a
riddle, guesses, «قريب», close), the race, the quiz.
- Data above. Seen, not fixed: the kind chip on the TV is small for a sofa.

### كمّل المثل
One phone start to reveal; room quiz via play-all. Data above.

### سلسلة الإجابات
Started, answered, reloaded mid-question (counts as missed - the documented
design).
- Seen, not fixed: a board question's decoys are sometimes of the wrong kind
  (e.g. a person among company names) - `streakBoardDecoys` picks word answers
  of the category by length; a finer "kind" match would need tagging the bank.

### تحدي اليوم, the archive, أرقامي / «ليالينا»
Hub opened, a daily played, archive opened, أرقامي with a room night recorded.
- **Fixed:** the hub's three header buttons laid out unevenly (the first now
  spans the row, `.daily-head__actions`).
- **Fixed:** «ليالينا» rows printed the raw date «2026-09-25» and ran
  "points / won" together in an LTR `.metric` that reordered the Arabic
  («31 – 49»). Now `25/9` (with the year only for another year,
  `statsNightDay`) and «كسب: n · النقط: n» (JS_Daily.html, JS_Core.html).
  `shots-quiz/stats-nights-before-fix.jpg` is the old look.
- Seen, not fixed: «تحديات جديدة بعد 1 ساعة» - Egyptian would say «بعد ساعة».

### خمن الكلمة
One phone to a win; room race with two phones and the TV. Data above.

### تشابه (three levels)
One phone, medium and easy started, a group solved.
- **Fixed:** a reload mid-puzzle dealt a new puzzle (its state was a module
  variable). The board is now kept on the phone as it is drawn and comes back
  exactly (`saveConnections` / `restoreConnections` in JS_Connections.html; the
  `restoreView` branch in JS_Core.html calls it). Checked: one group solved,
  reload, same tiles, the solved row, the tries left. See
  `connections-after-reload.jpg`.
- **Fixed:** tile text at 375 was 9.75px (2.6vw); now `clamp(0.7rem, 3.5vw,
  0.95rem)`.
- Data above.

### إيه اللي يجمعهم؟, خيوط
Started at 375; boards drawn right. No issues found in the few rounds played.

### كلمات من حروف
- **Fixed:** upright, the sticky «خروج» bar covered ✓, 💡, 🔀 and ⌫ whenever the
  crossword made the page scroll (at 375x812 the tools were at 677-718 under
  the bar at 694-735), and a tall crossword pushed the wheel itself off the
  screen (ring at 595px). Now the exit follows the tools (`.view-actions`
  static in this view), the grid gives up height first down to ~1.7rem cells,
  and the ring shrinks on short phones (12-15rem by `--app-h`). Measured on six
  puzzles at 375x812: the ring starts at 417-461px and the tools end at
  718-763 (the scroll area ends at 746). On a 375x667 phone there is still a
  short scroll to the tools. 667x375 and 1280x720 unchanged.

### خمّن الدولة
One phone started at 375 (flag mode); room race with the TV. Flags draw on
Windows (the font). No issues.

### خمّن الرقم in a room
Set 42, guessed higher / lower to the end with two phones and the TV. No issues.

### Also fixed on the way (all screens)
- **The first-play card** said the room way's steps on the one-phone setup of
  تحدي المعلومات (its rules list the room first), and a room lobby showed the
  pass-the-phone steps. `firstPlaySteps` now picks the list under the
  «📱 على موبايلات منفصلة» sub-head for a room card of the eleven games that
  have one (`FIRST_PLAY_ROOM_LIST`), and the first ordered list that isn't it
  for a setup card (JS_Catalog.html, JS_Room.html). Written without
  `String.matchAll` (ES2017 floor).
- «التالي ➡» pointed backwards in Arabic → «التالي ⬅», and «جاهزين، الجولة
  الجاية ⬅» (JS_Core.html).

## Checks run
- `cd tools && npm run check`: passes (the "never referenced" warnings are old).
- `cd rooms-worker && npm run test:rules`: passes, "no secret reached a phone
  it was not meant for".
- `node test/play-all.mjs http://127.0.0.1:8804` (after the last change):
  2373 passed, 0 failed, 631 s.
- No console errors in any screen I opened (only Chrome's "blocked vibrate
  before a tap" log).

## Couldn't check
- A real iPhone (Safari's bars, the flag emoji, the sound).
- Connections' hard level and خيوط / كلمات من حروف to the end of a whole game
  in English; the archive's older days.
- Every trivia board item: I went through the categories most likely to be
  wrong (films, food, geography, sport) and the room trivia in Arabic; the
  English board and the remaining categories were only sampled.

## Questions for the owner
1. The «أفلام أجنبية» kind in the Arabic emoji riddles - keep, trim or drop?
2. «أي دولة اخترعت الورق؟» with مصر as a choice - keep (it is China) or reword?
3. Should the room trivia's award chip explain its number (the speed bonus)?
