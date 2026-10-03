# Night review, 25-26 Sep 2026: the shell, the solo puzzles and the tools

Reviewer 7 ("shell"). Worktree merged with master first. Everything was looked at
in headless Chrome over CDP against a local rooms server (port 8807) and a
preview (4357), with `prefers-reduced-motion: no-preference`. Screenshots kept
in `shots-shell/` (9, all after the fixes except where named).

## What I played and looked at

| Area | Played / looked at | Sizes, looks |
| --- | --- | --- |
| سودوكو | the daily to the end (a mistake made on purpose, a reload mid-game, then solved: result sheet, "new record", share buttons) | 375x812 ar light; setup + play swept at 667x375 and 1280x720, ar light and en dark |
| 2048 | a whole game to "no more moves" (result sheet, best kept) | same |
| كاسحة الألغام | the daily: some cells, a reload mid-game, then won | same |
| الملكات / شمس وقمر / نونوجرام | each daily: 3 hints, a reload mid-game, then solved by hints to the result sheet | same |
| تحدي اليوم | the hub and its first-play card | 375 ar |
| Tools | مين يبدأ (opened), العجلة (5 names, a spin to the result), الفرق (5 names, 2 teams dealt), البطولة (5 names, 3 byes, played to the champion's podium), العداد العام, المؤقت, ساعة الشطرنج, النرد والعملة (two dice rolled), لوحة الأصوات (catalog entry) | 375 ar light; all swept at 667x375 and 1280x720 in ar light and en dark |
| Home | hero (compact and first-visit), «الليلة دي؟» (every count, every way), «ابدأوا بدول», search/filters, recent row, every card's description measured at 375 in both languages | 375, 667, 1280; ar light / en dark / ar dark |
| مع بعض, الأدوات, Settings, Help (on a play screen and the home), install sheet, intro, first-play card | looked at | 375 ar; the tabs swept at all three sizes |
| Room lobby (shared texts) | a room with two phones and a TV: the lobby before and after a game was chosen, أونو started with «رموز للألوان» on (the host's strip, the name button's tap area) | phones 375, TV 1920x1080 |

No console errors anywhere except Chrome's "vibrate blocked before a tap" notices
(headless, harmless).

## Found and fixed

**Shared room texts (the owner's three asks)**
- TV/phone lobby «في انتظار أن يبدأ المضيف اللعبة…» → «مستنيين المضيف يبدأ اللعبة…» (`room_wait_host` + the markup fallback).
- The server's host-only error «المضيف فقط يمكنه فعل ذلك» → «دي للمضيف بس» (RoomGames.js ×3, rooms-worker/src/room.js).
- «الفوز لـ {name}» → «اللي كسب: {name}» in `duel_won`, `ch_won`, `db_ev_win`, `db_won`, `uno_won_one` (fits any name; no gendered verb).
- The rest of the shared room errors the server sends, in Egyptian: «الغرفة اتملت», «اكتب اسمك الأول», «الغرفة فيها شاشات كفاية», «الاسم ده مستخدم في الغرفة، اختار اسم تاني» (kept «مستخدم»: play-all.mjs matches it), «معرفناش نفتح الغرفة، جرّب تاني», «مش قادرين نوصل للسيرفر، جرّب تاني» (room.js, index.js).
- **A real bug: the phone's own room messages were Arabic even in English** ("No room with that code" showed «لا توجد غرفة بهذا الكود», and the connection errors, "type your name/code", "couldn't start"). They go through `roomErrText(key)` (JS_Room.html) and 12 new `room_err_*` keys in both languages now, Egyptian in Arabic. (check:i18n lists them as "never referenced" - they are built from a prefix, the known trap.)
- Lobby words: «اللاعبون» → «اللاعبين» (`room_players`), «مغادرة الغرفة» → «اخرج من الغرفة», «مشاركة رابط الغرفة» → «ابعت لينك الغرفة», «تم نسخ رابط الغرفة» → «اتنسخ لينك الغرفة», «دخول الغرفة» → «ادخل الغرفة», «إنشاء غرفة» → «افتح غرفة» (the home tile's own words), the join hint, «لم يُحدد» → «مش متحدد», «تم حفظ الاسم» → «اتحفظ الاسم», «هل تريد مغادرة الغرفة؟» → «هتخرج من الغرفة؟», «اختر لعبة» → «اختار لعبة», «انضم كشاشة عرض» → «ادخل كشاشة عرض», «اجعل هذا الجهاز شاشة العرض» → «خلّي الجهاز ده شاشة العرض» (and the help lines quoting them).
- **The host's name buttons** (the room strip, the lobby, the TV strip): `.room-name-btn` gets `padding: 0.75rem 0.5rem` with the same negative margin, so the tap area is 41-47 × 45-50 px (was ~28 × 21) and nothing around it moves (Style.html, next to the rule).

**Home**
- **The recent row could be a heading with nothing under it.** Tools opened from الأدوات were remembered as "recent", but the home hides tools, so a phone that used only tools got «لعبتوها مؤخراً» and an empty row, and tools pushed games out of the six slots. Tools are no longer remembered, and old ones are filtered when the home is drawn (JS_Catalog.html `rememberRecent`, `renderHome`).
- «الليلة دي؟»: the four count chips wrapped 3 + 1 at 375 (304px of chips in a 296px row). The 👥 on "2", "3-5", "6+" said nothing the number doesn't; dropped, so they fit on one line (🧘 stays on «لوحدي»).
- Card lines: codenames «فريقان» → «فريقين»; connections «اعثر على اللي بيجمعهم» → «لاقي اللي بيجمع كل 4»; whoami «اسأل بنعم أو لا لحد ما تعرف مين أنت» → «اسأل أيوه ولا لأ لحد ما تعرف إنت مين»; guesswho «اسأل أيوه ولا لأ، واعرف وش التاني قبله»; bowling «اسحب الكورة» → «ارجع بالكورة لورا وارميها» / "Swipe" → "Swing" (it's a swing now); wordle "6 tries" → «6 أو 7 محاولات» (7 for 7-8 letters, JS_Wordle.html:30); daily «لغز جديد كل يوم في كل لعبة» → «ألغاز جديدة كل يوم، نفس اللغز عند الكل». Every description re-measured: none over two lines at 375 in either language.

**Tools**
- العجلة: its button said «🎲 اختر عشوائياً» (the translation overrode the markup's «🎡 لف العجلة») → «🎡 لف العجلة» / "🎡 Spin the wheel". Setup toast «اختر لاعبين على الأقل» (the number was missing) → «اختار اتنين على الأقل».
- The player picker's empty line said to type the first name "below" (تحت); the field is above it on every screen → «فوق» / "above".
- المؤقت: «+5د» / «+1د» / «-1د» read «د» first in an Arabic line; now `LRI +5 PDI د` (the number held left to right, then د), checked char by char in the page.
- البطولة: the champion's «قرعة جديدة بنفس اللاعبين» sat glued to the podium's blocks (and over them while they rose); a gap of `--sp-4`.
- Tool lines in Egyptian: «عجلة تختار اسم أو تحدي بالقرعة», «قسّم اللاعبين بالقرعة أو بالمستوى», «قرعة خروج المغلوب لحد البطل», «احسب نقط أي لعبة تانية», «عدّ تنازلي ويرن لما يخلص», «ساعة لاتنين، كل واحد ووقته», «ارمي الزهر أو العملة»; the chess clock's sheet «وقت ساعة الشطرنج / وقت كل لاعب (بالدقايق) / احفظ وابدأ»; الدومينو على الطاولة's «هتلعبوا إزاي؟ / اخترت 4 لاعبين: كل واحد لوحده ولا فرق؟»; teams «وزّع تاني 🔄», «الرئيسية»; the groups' «اختار مجموعة…»; «متأكد؟», the reset confirm, «اكتب وقت صحيح».

**Help sheet (GAME_RULES checked for every game, both languages, against GEMINI and the code)**
- wordle: 6 tries → 6, or 7 for a word of 7-8 letters.
- سكرو: «أول ما تسحب بوم أو صرخة أوسكار من الأرض» contradicted its own «بيشتغل بس لو اتسحب من الورق» → «من الورق» / "from the deck".
- كمّل المثل: «مثل مصري أو عربي» → «مثل مصري» (the owner: Egyptian only).
- تحدي اليوم: "each solo game has a puzzle of the day" → "each game in this list" (2048, Wordle, Connections have none).
- ارسم واكتب: "until the chain goes round" + «(6 خطوات بالكتير)» (`TELE_MAX_STEPS`).
- المشنقة: the writer's 5 is "for everyone who doesn't solve it", not "everyone hanged" (help and `hm_mode_setter_hint`).
- مين أكثر واحد: «ولو فيه تعادل الكل ياخد نقطة» said everyone scores → «ولو فيه تعادل على الأول كلهم ياخدوا نقطة» (matches the English and the code).
- الغرف: "a room stays alive for 6 hours" → "up to 6 hours with nothing happening".
- الإعدادات: the language row now says the game words follow only while «لغة الألعاب» follows the app; added the three missing rows: رموز للألوان, شارك التطبيق, الإصدار.
- مين يبدأ: «ثانيتين» → «تقريباً ثانيتين» (the code waits 2.4 s).
- سكرو's help entry had no `room: true`, so it never offered the "also in rooms" link (JS_Utils.html).

**Data**
- نونوجرام: the tree picture is a layered pine; its emoji 🌳 → 🌲. The other names (قلب، سهم، جرس، ألماسة، عربية، بيت، قطة، نجمة، سمكة، شمسية، مركب، مشروم، تفاحة، تاج) fit their pictures.

## Checks run
- `cd tools && npm run check`: passes (i18n OK, ar 3562 = en 3562).
- `cd rooms-worker && npm run test:rules`: passes (exit 0, no ✗, the leak check clean).
- `node test/play-all.mjs http://127.0.0.1:8807`: 2342 passed, 0 failed (573.7 s).
- A parse check of every touched `JS_*.html`.

## Open questions for the owner
- **The player counts of room games with computer players aren't told the same way.** إستميشن, شطرنج الأربعة, المخ والإيد and باغ هاوس say 1-4 (one person plus computer players); أونو (2-12), الدومينو (2-4), خمّن مين (2-12) and كدّاب (3-12) count only people, though each opens from one person with computer players. So «لوحدي» in «الليلة دي؟» and the "1" player filter find some of them and not others. Which way should the cards count?
- «انضم لغرفة» (the home tile, the join screen) was left as it is: it is everywhere and people know it; «ادخل غرفة» would be the Egyptian word if you want it.
- The TV lobby's left column (the players' heading and the "waiting" card) is centred in the height, so above it is a large empty area on a 1080p TV. Not changed tonight (a layout decision); worth a look.

## Seen, not fixed (and why)
- The recent-tile and filter chips measured "off the screen" at 375/667 are inside scrolling rows (by design).
- Nonogram's 10×10 cells are 28-30 px on a 375 phone: a 10-wide board and its clues can't be bigger there; drag-painting makes up for it.
- «إضافة / إلغاء / إغلاق» as button words are left: they are what every app says and read naturally.
- العداد العام doesn't show the saved-names picker the other setups have (only a name field). Not a bug; could be a small improvement.

## Couldn't check
- Real sound, haptics and the install flow on an iPhone; the Chooser's multi-finger touch (headless has no real multi-touch; the screen opens and sweeps clean).
- The live player count on مع بعض (below its minimum with one local room, so it correctly shows nothing).
