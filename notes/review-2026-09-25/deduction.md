# Review of 25-26 Sep 2026: the deduction games

Reviewer 1 ("deduction"): الجاسوس (with المختلف and مين يسأل مين), الحرباء, الموقع
السري, الفنان المزيف, كذبة وصدقة, مافيا, صدق ولا كذب, العقل, خمّن مين, قبل ولا بعد,
and their word lists.

How: a local rooms server and the preview, headless Chrome over the DevTools
protocol, a browser context per phone plus a TV at 1920×1080. Phones at 375×812
(Arabic light), 667×375 (English dark), 1280×720 (Arabic light), plus 375 English
light and dark. Every game played through to its result or end; reloads mid-game;
Help opened; the console watched (no errors apart from the headless
"navigator.vibrate blocked" note). Screens kept in `shots-deduction/`.

## What I played

| Game | One phone | Room (phones + TV) |
| --- | --- | --- |
| الجاسوس | 375 / 667 / 1280, المختلف on and off, مين يسأل مين, reload mid-discussion, Help, the result | 4 phones + TV: reveal, discussion, vote, the spy's six-word guess, result; المختلف vote and result; a reload mid-vote |
| الحرباء | 375 / 667 / 1280: deal, held card, board, accuse, the guess, result; reload in the reveal and on the board | 4 + TV: board, vote (a reload mid-vote), guess, result |
| الموقع السري | 375 / 667 / 1280: deal, card, places board, pause, accuse, result; reload mid-discussion | 4 + TV: play, vote, the spy's guess from 24 places, result |
| الفنان المزيف | - | 4 + TV: eight strokes, vote, the fake's guess, result |
| كذبة وصدقة | - | 4 + TV: writing, voting (a reload mid-vote), result |
| صدق ولا كذب | - | 4 + TV: writing, all four storytellers, the end |
| العقل | - | 4 + TV: three levels, a heart lost, level done, a reload at level 4 |
| مافيا | - | 6 + TV, both modes (بأدوار and كلاسيك), narrator on: roles, night (a reload in the night), day, vote, day result, to the end |
| خمّن مين | - | one person + a hard computer player + TV: list questions answered both ways, faces flipped by hand, a reload mid-game, a guess to the end |
| قبل ولا بعد | - | 4 + TV: a whole game to the end (deck ran out, the board decided), a reload mid-game |

## Bugs found and fixed

1. **One-phone المختلف dealt blank cards.** `SPY_PAIRS` lived in `SpyWords.js`
   but only `SPY_WORDS` reached the page (`initialSpyData`), so every card of the
   one-phone المختلف was empty - on the live site too. Both builds now pass the
   pairs (`initialSpyPairs`, `window.SPY_PAIRS` in `Controller.html`,
   `tools/build-site.mjs`, `tools/build-preview.mjs`). Checked: the table gets the
   word, the odd one the close word.
2. **مافيا's night screen was a navy block over the whole view.** The "الليلة 1"
   heading card and the animated sky layer behind the view were both called
   `.mafia-sky`: the layer's `position: absolute; inset: 0` stretched the card
   over the screen (its heading hidden, the night picker floating on it), and
   `mafiaSky()` toggled the card instead of the sky, so night/day never showed.
   The card is `.mafia-nighthead` now (`JS_RoomMafia.html`, `Style.html`).
   The fixed night: `shots-deduction/mafia-night-fixed-375.jpg`.
3. **الحرباء and الموقع السري on one phone ended the round on a reload** ("انتهت
   الجولة بسبب إعادة تحميل الصفحة") although everyone had already seen their
   card. Their deal is now kept on the phone (`chameleonSave` / `restoreChameleon`,
   `spyfallSave` / `restoreSpyfall`, called from `restoreSavedView` in
   `JS_Core.html`): a reload comes back to the same card mid-reveal or the same
   board; الموقع السري's clock comes back with the time it had, paused (as
   الجاسوس does), and the places crossed off stay crossed.
4. **"عرض النتائج كاملة" on الجاسوس's one-phone result** opened another game's
   table (or nothing). Hidden for the spy's result; the score keepers that use
   the popup (`JS_Screw.html`, `JS_Monkey.html`) show it again.
5. **The TV's كذبة وصدقة result ran under the player strip** (answers + the
   board stacked, zoomed): the answers and the board sit side by side now
   (`.tv-fib-res`).
6. **The TV's صدق ولا كذب statements sat in the right half of the screen**
   (auto-fill left empty tracks): three even columns across the middle
   (`.tv-tt-items`).
7. **Gendered result lines** said "{name} عرف…" / "وغلطت" whatever the name:
   worded with the role as the subject now («الجاسوس (منى) عرف الكلمة…»,
   «مسكتوا الحرباء (كريم) وغلطت…»), the way the owner's المخ والإيد line does:
   `imp_*`, `cham_*`, `spy_*`, `fa_*`, `tl_wait_turn`.
8. **المختلف caught read "وغلط في الكلمة"** though the odd one never guesses in
   rooms (the owner's rule): now «مسكتوا المختلف: {name}!».
9. **The chameleon's speaking-order chips** showed ".1 أحمد" in a right-to-left
   line: the number is a `<bdi>`.
10. **قبل ولا بعد's test** assumed a 22-card bank; updated for the new bank
    (below): 12 players now get two cards each and keep 17 spares.

## Wording (Egyptian, family)

- «أعط الهاتف لـ» / «مرر الهاتف إلى» → «ادّي الموبايل لـ»; «أنت هو:» → «دورك:».
- «قائمة المواقع المحتملة (انقر للشطب)» → «الأماكن الممكنة (دوس على مكان تشطبه)».
- الفنان المزيف: «أنت لا تعرف الكلمة! ارسم خطاً مقنعاً ولا تجعلهم يكتشفوك!» →
  «إنت مش عارف الكلمة! ارسم خط يقنعهم ومتخليهمش يكشفوك.»; «تم كشفك! خمن الكلمة
  لسرقة الفوز» → «اتكشفت! خمّن الكلمة وتسرق الفوز»; the TV's vote title had 🗳️ and 🔍
  side by side (one dropped).
- مافيا: the citizen's line «قبل ما يخلصوا على المدينة» (a killing phrase) →
  «قبل ما يكسبوا»; «إنت المافيا الوحيد» → «لوحدك»; the narrator's «صبح الصبح» →
  «الصبح طلع. اتكلموا.»

## Content changes

**SpyWords.js** (list sizes kept; each replacement checked not to repeat a word
already in its category):
- Not the category's kind: مهن had «استوديو تسجيل، دار نشر، مركب»; أماكن had «صنارة»;
  حيوانات had «بورس»; أشياء had «سيارة، دراجة» (there is a مواصلات category).
- The same thing twice in one category - in rooms the spy's six guesses could show
  both spellings, one right and one "wrong": ضابط/ظابط شرطة, ساعي البريد/بريد,
  لاعب كرة/كورة, طبيب/دكتور, ممرض/ممرضة, فران/خباز, غطاس/غواص, خياط/ترزي,
  كوافيرة, جواهرجي/صائغ, نادل/جرسون, جندي/عسكري, مدرب كورة, مزارع/فلاح;
  محطة قطر/قطار, شاطئ/شاطئ البحر, جنينة/حديقة, مسبح/حمام سباحة, فنار/منارة,
  أوبرا/دار أوبرا, محطة بنزين/بنزينة, موقف باصات/أتوبيس, دار مناسبات/قاعة أفراح,
  ستوديو تصوير/استوديو; تلاجة, مراية, وسادة/مخدة, حقيبة/شنطة, صابونة, فرشة سنان,
  مطرقة/شاكوش, مسامير, جلباب/جلابية, منشر, آلة تصوير/كاميرا, سماعات, إبريق;
  شيكولاتة/شوكولاتة, رز معمر, فلافل/طعمية, بطاطس محمرة/مقلية, مخلل/طرشي,
  باستا/مكرونة, فول/فول مدمس, عجة/أومليت, يوستفندي/يوسفي, قراصيا/كريز,
  كانتالوب/شمام, ممبار مشوي; صرصار, معزة, سمك قرش, كركند, أفعى.
- Unknown to an Egyptian family (the owner's خلد rule): نيص، فظ، قضاعة، خروف البحر،
  ابن عرس، خلد، سمندل، أصلة، بلشون، ترايسيراتوبس، ستيجوسورس، تيروداكتيل؛
  إكسيليفون، هارب، ترومبيت؛ «رياضة الجري بالحبل» → نط الحبل; Banyo; زبادي جهينة
  (twin of جهينة).
- A controversial living politician in «شخصيات مشهورة»: مرتضى منصور → محمد صبحي.
- In: قرموط، عرسة، كلب بوليسي، سمكة زينة، أبو فصادة، حصان عربي، نمر أبيض، نسناس،
  كلب سلوقي، قطة شيرازي، سمك موسى، زرزور، جرو، شبل، حمار حصاوي، كلب لولو، قطة بلدي،
  حصان سباق؛ مكوجي، كمساري، مطرب، سايس، عامل بنزينة، بياع جرايد، بياع فريسكا، مصلح
  موبايلات، مسحراتي، سمكري، مقاول، بياع عرقسوس، مدرس خصوصي، عربجي، كاوتشجي، مندوب
  مبيعات، موظف حكومة، بياع فول؛ محل حلويات، محل ورد، سنترال، الشهر العقاري، مركز
  شباب، فطاطري، مكتب سفريات، مكتب محاماة، محل إلكترونيات، كوافير حريمي، محل عطارة؛
  فانوس رمضان، بطاقة شخصية، جورنال، مجلة، كارت شحن، ترنج، كورة شراب، مفرش سفرة،
  حصيرة، كليم، طاولة زهر، كوتشينة، شريط كاسيت، دومينو، ترمومتر؛ فول سوداني، لب،
  حرنكش، سلطة خضرا، كفتة داود باشا، شوربة فراخ، كريب، فريسكا، مشبك، سمك مقلي، سلطة
  زبادي، كوسة بالبشاميل، صينية بطاطس؛ سمسمية، مندولين، صفارة؛ Molto، Uber.
- المختلف pairs: ['فرن', 'مخبز'] is the same place in Egypt → ['فرن', 'محل حلويات'].
- One-phone الجاسوس's default «🌍 دول العالم» dealt from all 196 countries (فيجي،
  هندوراس، مقدونيا…): it deals from the 60 everyone knows now (`Countries.js` tier 1).

**ChameleonWords.js**: «دول وعواصم» held no capitals → «دول» (en «Countries»);
مخلوقات أسطورية: سايكلوب، غريفين، ترول → أبو رجل مسلوخة، النداهة، عفريت; مكسرات:
بيكان، مكاديميا → عجوة، قمر الدين; فنون قتالية: أيكيدو، ووشو → دفاع عن النفس،
مصارعة حرة; جبنة: بري، روكفور → جبنة مثلثات، جبنة قديمة (en Cheese Triangles,
Blue Cheese); عيش: خبز الجاودار، شاباتا، بريتزل → عيش سن، عيش شمسي، بقسماط (en
Pretzel → Rusks); زواحف: ورل → ديناصور.

**SpyfallPlaces.js**: a sommelier / «ساقي مشروبات» in a family game → شيف حلويات
(Pastry Chef); «حطاب» at a desert camp → سواق جيب (Jeep Driver); «طاهي تاكوز» at an
Egyptian street-food fair → بياع كبدة (Liver Sandwich Seller).

**PartyContent.js (Fibbage)**, facts that were wrong or not settled:
- A camel has *two* rows of eyelashes, not three → «الجمل عنده ___ جفون في كل
  عين» (three; en "eyelids").
- "Venus is the only planet that spins clockwise": Uranus does too → «على كوكب
  الزهرة الشمس بتطلع من ___» (الغرب / west).
- "Saliva to fill two swimming pools": not true → a blue whale's heart is the size
  of a small ___ (عربية / car).
- "The duck's quack has no echo" was a myth presented as the answer → «الحلزون
  بيمشي على ___ واحدة بس» (رجل).
- "Longest pedestrian suspension bridge": a record that changes → the first World
  Cup, 1930 (ar and en).
- "A sneeze at 160 km/h": disputed → the brain is about 75% water (ar and en).
- «الحيوان الوطني لاسكتلندا هو وحيد القرن» - in Arabic that is the rhinoceros →
  اليونيكورن.
- Monopoly warned about «الملاك» (reads as "angels") → الاحتكار; the first webcam
  watched a coffee «بكرج» (Levantine) → ماكينة.

**TimelineEvents.js**: "the first website" 1990 is argued (1990 or 1991) → «منتخب
مصر يلعب كأس العالم في إيطاليا» 1990; «افتتاح السد العالي» 1970 is argued
(finished 1970, opened 1971) → «اكتمال بناء السد العالي». The bank was 22 cards,
so a four-player game showed the same line every time; 20 settled dates added,
Egyptian first (the French campaign 1798, Muhammad Ali 1805, Champollion 1822,
1882, the first film 1895, the first modern Olympics 1896, Al Ahly 1907, WWI 1914,
penicillin 1928, the first World Cup 1930, WWII 1939, Sputnik 1957, Gagarin 1961,
the Berlin Wall 1989, Google 1998, the new Library of Alexandria 2002, YouTube
2005, Egypt's third Africa Cup in a row 2010, Egypt at the 2018 World Cup, the
Pharaohs' Golden Parade 2021) → 42 cards, no year twice.

**GuessWho.js**: names and questions read right; nothing changed.

## Checked and fine

The imposter/chameleon/spyfall rooms (secrets, votes, guesses, scores), المختلف
ending on the vote, fibbage's options (no owner leaked), two truths' rounds and
best liar, العقل's hearts and discards, the Mafia roles in both modes and the
Lawyer's list, Guess Who against a hard computer player (it asks from the list and
narrows correctly), the TV lobby and every TV phase, Help on every play screen.

## Questions for the owner

- **The spy words are Arabic only.** In English the categories and the words are
  still Arabic (so are the المختلف pairs). An English list is a content job of its
  own; tell me if you want it.
- **The audience's «مين هيكسب؟»** stays up after a short game has already ended
  (seen in خمّن مين: the game was over inside the 90-second window). That is the
  shared audience bar, not these games - worth closing it once a game ends.
- **الحرباء's boards still hold a few words a family may not know** (رياضات مائية:
  سنوركلينج، باراسيلينج، ويك بورد; أنمي titles; جرين لانترن). They are one board
  each and only matter when dealt; say if you want them swapped.
- The long animal list still has near relatives (فأر/جرذ، حمامة/يمامة، خروف/نعجة)
  - different animals, so left.

## Seen, not fixed

- Small taps: the host's names in the lobby / player strip are dotted-underlined
  text buttons about 26-40 px tall (the owner's "tap a name" menu) - a shared
  component, left for its owner.
- مافيا's roles screen and the day news look right now; the narrator was switched
  on but a headless browser has no voices, so the speech itself was not heard.
- Spyfall's sticky «إنهاء» bar overlays the places list while scrolling on a
  phone on its side - it is the app's standard sticky bar.

## Tests

`npm run check` passes; `npm run test:rules` passes (the timeline check updated for
the bigger bank, no leaks); the whole robot test (`play-all.mjs`) against my own
rooms server after merging master: 2,326 passed, 0 failed.
