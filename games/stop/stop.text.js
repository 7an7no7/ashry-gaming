/* stop: the words only this game's screens show, and its rules (Help, the
   first-play card). The build puts them into TRANSLATIONS and GAME_RULES (tools/game-text.cjs):
   read them as t.<key> and GAME_RULES[lang].<id>, as everywhere. */
gameText({
  translations: {
    ar: {
      stop_room_hint: "كل واحد يكتب على موبايله. أول واحد يخلص يضغط وقف، والتطبيق يحسب: 10 لإجابة مميزة، 5 لمكررة، 0 لفاضية أو مش بتبدأ بالحرف.",
      stop_room_write_hint: "اكتب كلمة تبدأ بالحرف في كل خانة",
      stop_room_stop_hint: "أول واحد يضغط وقف يقفل الجولة على الكل",
      stop_room_left: "باقي {n} خانات بكلمة بتبدأ بحرف {letter} عشان تقدر توقف",
      stop_room_left_1: "باقي خانة واحدة بكلمة بتبدأ بحرف {letter} عشان تقدر توقف",
      stop_room_left_2: "باقي خانتين بكلمة بتبدأ بحرف {letter} عشان تقدر توقف",
      stop_room_fill_all: "املأ كل الخانات بكلمات بتبدأ بحرف {letter} الأول",
      stop_ring_one: "{name} فاضله خانة!",
      stop_ring_full: "{name} خلّص، يقدر يقول وقف",
      stop_room_check_host_lenient: "كلمات مش في القاموس خدت نقاطها: دوس على الخانة لو الكلمة غلط عشان تنزل لصفر",
      stop_room_check_wait: "كلمات مش في القاموس خدت صفر لحد ما المضيف يراجعها",
      stop_room_check_wait_lenient: "كلمات مش في القاموس خدت نقاطها لحد ما المضيف يراجعها",
      stop_lenient: "متسامح: الكلمة اللي مش في القاموس تاخد نقطها",
      stop_lenient_hint: "الكلمة اللي مش في القاموس تاخد 10 بدل 0، والمضيف يقدر ينزّلها لصفر.",
      stop_pts_check: "مش في القاموس",
      stop_room_stopped_by: "وقّف الجولة",
      stop_room_adjust_hint: "اضغط على أي خانة عشان تعدّل نقاطها: 10 ← 5 ← 0",
      stop_room_review_hint: "المضيف يراجع النقاط قبل ما تتحسب",
      stop_min_cats: "لازم فئتين على الأقل",
      stop_letter: "الحرف",
      stop_play_hint: "اكتبوا على ورق، وأول واحد يخلص يضغط وقف!",
      stop_stop_btn: "وقف! ✋",
      stop_redraw: "حرف تاني",
      stop_scoring_hint: "اضغط على الخانة: 10 لإجابة محدش غيره كتبها، 5 لإجابة اتكررت، 0 لو فاضية أو غلط.",
      stop_total: "المجموع",
      stop_pts_unique: "إجابة مميزة",
      stop_pts_shared: "إجابة مكررة",
      stop_pts_none: "فاضي",
      stop_tie: "تعادل!",
      stop_room_slam: "✋ الأتوبيس وقف!",
      sbus_bub_1: "يلا بينا؟",
      sbus_bub_2: "حد خلص؟",
      sbus_bub_3: "مش هستنى كتير!",
      sbus_bub_4: "المحطة الجاية: وقف!",
      sbus_wait: "استنوني!",
      sbus_missed: "فاتهم الأتوبيس:",
      stop1_empty: "فاضي",
      stop1_shared: "مكررة",
      stop1_unique: "لوحده",
      stop1_all_unique: "الكل لوحده",
      stop1_all_empty: "الكل فاضي",
      stop1_next_cat: "الخانة اللي بعدها",
      stop1_prev_cat: "اللي قبلها",
      stop1_to_table: "📋 الجدول كله",
      stop1_cat_hint: "كل واحد يقرا كلمته: لوحده 10، مكررة 5، فاضية أو غلط 0",
      stop1_check: "راجعوا الجدول",
      stop_pts_solo: "لوحدك في الخانة",
      stop_bad_stop: "وقف غلط",
      stop1_who_stopped: "مين قال وقف؟",
      stop1_who_stopped_hint: "اللي وقف وفي ورقته خانة بصفر بيخسر 10 (وقف غلط)",
    },
    en: {
      stop_room_hint: "Everyone writes on their own phone. The first one done presses Stop, and the app scores: 10 for a unique answer, 5 for a shared one, 0 for blank or not starting with the letter.",
      stop_room_write_hint: "Write a word starting with the letter in every box",
      stop_room_stop_hint: "The first to press Stop closes the round for everyone",
      stop_room_left: "{n} boxes still need a word starting with {letter} before you can stop",
      stop_room_left_1: "1 box still needs a word starting with {letter} before you can stop",
      stop_room_left_2: "2 boxes still need a word starting with {letter} before you can stop",
      stop_room_fill_all: "Fill every box with a word starting with {letter} first",
      stop_ring_one: "{name} has one box left!",
      stop_ring_full: "{name} is done and can call stop",
      stop_room_check_host_lenient: "Words not in the dictionary kept their points: tap a cell if the word is wrong to set it to 0",
      stop_room_check_wait: "Words the dictionary doesn't know scored 0 until the host checks them",
      stop_room_check_wait_lenient: "Words not in the dictionary kept their points until the host checks them",
      stop_lenient: "Lenient: words not in the dictionary keep their points",
      stop_lenient_hint: "A word not in the dictionary gets 10 instead of 0, and the host can tap it down to 0.",
      stop_pts_check: "not in the dictionary",
      stop_room_stopped_by: "stopped the round",
      stop_room_adjust_hint: "Tap any cell to change its points: 10 → 5 → 0",
      stop_room_review_hint: "The host checks the points before they count",
      stop_min_cats: "Keep at least two categories",
      stop_letter: "Letter",
      stop_play_hint: "Write on paper; the first one done presses Stop!",
      stop_stop_btn: "Stop! ✋",
      stop_redraw: "Another letter",
      stop_scoring_hint: "Tap a cell: 10 for an answer nobody else had, 5 for a shared one, 0 for blank or wrong.",
      stop_total: "Total",
      stop_pts_unique: "unique answer",
      stop_pts_shared: "shared answer",
      stop_pts_none: "blank",
      stop_tie: "It's a tie!",
      stop_room_slam: "✋ Stop the bus!",
      sbus_bub_1: "Shall we go?",
      sbus_bub_2: "Anyone done?",
      sbus_bub_3: "I won't wait long!",
      sbus_bub_4: "Next stop: STOP!",
      sbus_wait: "Wait for me!",
      sbus_missed: "Missed the bus:",
      stop1_empty: "Blank",
      stop1_shared: "Shared",
      stop1_unique: "Unique",
      stop1_all_unique: "All unique",
      stop1_all_empty: "All blank",
      stop1_next_cat: "Next category",
      stop1_prev_cat: "Back",
      stop1_to_table: "📋 Whole table",
      stop1_cat_hint: "Each reads their word: unique 10, shared 5, blank or wrong 0",
      stop1_check: "Check the table",
      stop_pts_solo: "the only one in the category",
      stop_bad_stop: "Wrong stop",
      stop1_who_stopped: "Who said Stop?",
      stop1_who_stopped_hint: "Whoever stopped with a 0 on their sheet loses 10 (wrong stop)",
    }
  },
  rules: {
    ar: {
      stop: `
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li>كل واحد معاه ورقة وقلم. الموبايل بيطلع <b>حرف</b>.</li>
                <li>اكتب كلمة تبدأ بالحرف في كل فئة: اسم، حيوان، نبات، جماد، بلد… (اختار الفئات قبل ما تبدأ).</li>
                <li>أول واحد يخلص يضغط <b>وقف!</b> والكل يرفع القلم. أو الوقت بيخلص لوحده.</li>
                <li>الحساب: <b>10</b> لإجابة محدش غيرك كتبها، <b>5</b> لإجابة اتكررت، <b>0</b> لو فاضية أو غلط. فئة فئة: كل واحد يقرا كلمته وتختاروا له <b>لوحده</b> أو <b>مكررة</b> أو <b>فاضي</b> (وفيه «الكل لوحده»)، وفي الآخر الجدول كله لو حبيتوا تعدّلوا خانة.</li>
                <li><b>لوحدك في الخانة = 20</b>: لو انتو 3 أو أكتر، وإجابتك هي الوحيدة الصح في الفئة (الباقي فاضي أو غلط)، تاخد 20 ⭐.</li>
                <li><b>وقف غلط</b>: اللي قال وقف وفي ورقته خانة خدت صفر (فاضية أو غلط) بيخسر 10 من الجولة. اختاروا مين وقف في الجدول.</li>
                <li>بعد الجولات كلها، أعلى مجموع يكسب.</li>
            </ol>
            <p class="help-sub">📱 على موبايلات منفصلة</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>نفس الحرف يظهر لكل واحد، اكتب إجاباتك في الخانات، وأول واحد يخلص يضغط وقف. التطبيق يقارن الإجابات ويحسب لوحده، والمضيف يقدر يعدّل أي خانة قبل ما تتحسب.</li>
                <li><b>وقف</b> مش بيشتغل غير لما كل خاناتك تبقى فيها كلمة بتبدأ بالحرف: الخانة بتخضر لما تبقى تمام.</li>
                <li>في الأتوبيس كل راكب حوالين راسه <b>حلقة</b> متقسمة على قد الخانات، وكل حتة بتخضر لما خانة عنده تخضر (العدد بس، كلامك محدش بيشوفه)، ولما تكمل بتنوّر: كده تعرفوا مين قرب يقول وقف.</li>
                <li>كل كلمة بتتراجع على قاموس الفئة بتاعتها. اللي القاموس يعرفها ✓ بتتحسب، واللي ميعرفهاش ❓ بتاخد صفر لحد ما المضيف يدوس عليها لو صح، إلا لو لاعب تاني كتب نفس الكلمة.</li>
                <li>ولو المضيف شغّل <b>متسامح</b>: الكلمة اللي مش في القاموس تاخد 10 وعليها ❓، والمضيف يقدر ينزّلها لصفر.</li>
                <li>نفس القاعدتين: الإجابة الوحيدة الصح في فئتها تاخد 20 ⭐ (من 3 لاعبين)، واللي داس وقف وفي ورقته كلمة فضلت بصفر (غلط، أو ❓ المضيف ما قبلهاش) بيخسر 10: <b>وقف غلط</b> 🛞.</li>
                <li>الإملاء مش فارقة: أسد واسد، مكتبة ومكتبه، مصطفى ومصطفي، والتشكيل، كلهم نفس الإجابة. وأل التعريف مش بتتحسب حرف أول (السمك كلمة بحرف س).</li>
            </ul>`,
    },
    en: {
      stop: `
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li>Everyone has paper and a pen. The phone draws a <b>letter</b>.</li>
                <li>Write a word starting with it in every category: a name, an animal, a plant, an object, a country… (pick the categories before you start).</li>
                <li>The first one finished presses <b>Stop!</b> and everyone puts their pen down. Or the clock runs out.</li>
                <li>Scoring: <b>10</b> for an answer nobody else had, <b>5</b> for a shared one, <b>0</b> for blank or wrong. One category at a time: each reads their word and you pick <b>Unique</b>, <b>Shared</b> or <b>Blank</b> for them («All unique» for the usual case); at the end, the whole table if you want to fix a cell.</li>
                <li><b>The only one in the category = 20</b>: with 3 players or more, if yours is the only right answer in a category (everyone else blank or wrong), it scores 20 ⭐.</li>
                <li><b>Wrong stop</b>: whoever said Stop with a 0 on their sheet (blank or wrong) loses 10 on the round. Pick who stopped on the table.</li>
                <li>After all the rounds, the highest total wins.</li>
            </ol>
            <p class="help-sub">📱 On separate phones</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>The same letter shows to everyone, you type your answers in the boxes, and the first one done presses Stop. The app compares the answers and scores them, and the host can change any cell before the points count.</li>
                <li><b>Stop</b> only works once every box holds a word starting with the letter: a box turns green when it does.</li>
                <li>On the bus each passenger wears a <b>ring</b> cut into as many pieces as there are boxes; a piece turns green as one of their boxes does (just the count: nobody sees your words), and a full ring glows, so the table sees who is about to call stop.</li>
                <li>Every word is checked against a dictionary for its category. Words it knows ✓ count; words it doesn't ❓ score 0 until the host taps them as right, unless another player wrote the same word.</li>
                <li>With the host's <b>Lenient</b> switch on, a word the dictionary doesn't know keeps its 10, still marked ❓, and the host can tap it down to 0.</li>
                <li>The same two rules: the only right answer in its category scores 20 ⭐ (3 players or more), and whoever pressed Stop with a word left at 0 (wrong, or a ❓ the host didn't accept) loses 10: <b>wrong stop</b> 🛞.</li>
                <li>Spelling doesn't matter: أسد and اسد, مكتبة and مكتبه, capitals, diacritics, all count as the same answer. "The" and "ال" are not the first letter ("the sea" is an S word).</li>
            </ul>`,
    }
  }
});
