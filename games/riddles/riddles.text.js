/* riddles: the words only this game's screens show, and its rules (Help, the
   first-play card). The build puts them into TRANSLATIONS and GAME_RULES (tools/game-text.cjs):
   read them as t.<key> and GAME_RULES[lang].<id>, as everywhere. */
gameText({
  translations: {
    ar: {
      quiz_count_label: "العدد",
      quiz_you_got_it: "عرفتها! ✅ استنى الباقي",
      quiz_one_try_used: "إجابتك اتسجلت. النتيجة لما الوقت يخلص.",
      quiz_close: "إنهاء دلوقتي",
      quiz_next: "اللي بعدها",
      quiz_last: "النتيجة النهائية",
      quiz_answer: "الإجابة",
      quiz_tv_type: "اكتبوا إجابتكم على موبايلاتكم",
      prov_guess_ph: "الكلمة الناقصة…",
      emoji_lobby_hint: "الفزورة على كل موبايل وعلى الشاشة. اللي يكتب الإجابة الصح الأول ياخد أكتر نقاط، والغلط بيظهر للكل.",
      prov_lobby_hint: "المثل على كل موبايل. كل واحد ليه محاولة واحدة، والأسرع ياخد أكتر.",
      emoji_reveal: "كشف الإجابة",
      emoji_next: "فزورة تانية",
      emoji_skip: "عدّي",
      emoji_all_cats: "الكل",
      emoji_device_hint: "مين يعرفها الأول يقولها بصوت عالي!",
      emoji_riddle_n: "فزورة",
      prov_reveal: "كشف الكلمة",
      prov_next: "مثل تاني",
      prov_device_hint: "مين يكمّل المثل؟",
      prov_n: "مثل",
      quiz_who_got: "مين عرفها؟",
      quiz_close_other: "{name} قرّب",
      quiz_near: "قرّبت! جرّب تاني، بنص النقط",
      quiz_choices_hint: "أو اختار من التلاتة، بنص النقط (الكتابة بالنقط كاملة)",
    },
    en: {
      quiz_count_label: "How many",
      quiz_you_got_it: "You got it! ✅ Wait for the others",
      quiz_one_try_used: "Your answer is in. Results when time's up.",
      quiz_close: "Close it now",
      quiz_next: "Next",
      quiz_last: "Final scores",
      quiz_answer: "Answer",
      quiz_tv_type: "Type your answer on your phone",
      prov_guess_ph: "The missing word…",
      emoji_lobby_hint: "The riddle on every phone and the screen. The first right answer scores most, and wrong guesses show to everyone.",
      prov_lobby_hint: "The proverb on every phone. One try each; faster scores more.",
      emoji_reveal: "Reveal",
      emoji_next: "Next riddle",
      emoji_skip: "Skip",
      emoji_all_cats: "All",
      emoji_device_hint: "First to know shouts it out!",
      emoji_riddle_n: "Riddle",
      prov_reveal: "Show the word",
      prov_next: "Next proverb",
      prov_device_hint: "Who can finish it?",
      prov_n: "Proverb",
      quiz_who_got: "Who got it?",
      quiz_close_other: "{name} is close",
      quiz_near: "Close! One more try, for half the points",
      quiz_choices_hint: "Or pick one of the three, for half the points (typing still pays full)",
    }
  },
  rules: {
    ar: {
      emoji: `
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li>فيلم أو مثل أو أكلة أو مكان مكتوب <b>بالإيموجي</b>.</li>
                <li>على موبايل واحد: الفزورة للكل، ومين يعرفها الأول يقولها. <b>كشف الإجابة</b> لما تتفقوا، وبعدين فزورة تانية. تقدر تختار نوع الفوازير.</li>
                <li>الإملاء مش فارقة، والأسماء الأجنبية بتتقبل بالعربي أو الإنجليزي.</li>
                <li>اختاروا أسماء اللاعبين في الإعداد عشان تحسبوا النقط: بعد الكشف اضغط <b>مين عرفها؟</b>، وفي الآخر منصة الفايزين.</li>
            </ol>
            <p class="help-sub">📱 على موبايلات منفصلة</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>المضيف بيختار الطريقة: <b>واحد يكتب</b> فزورة (الإجابة، ونوعها: فيلم، مثل، أكلة، مكان أو حاجة، والفزورة بالإيموجي بس) والباقي كل واحد يخمّنها على موبايله؛ أو <b>سباق</b> على فوازير التطبيق؛ أو <b>المسابقة</b>.</li>
                <li>في "واحد يكتب" والسباق: 6 محاولات، ومحدش بيشوف تخمينات التاني. "🔥 قريب" لو قربت. اللي يعرفها ياخد 10، والأول +5، التاني +4… واللي كتبها ياخد 5 عن كل واحد ماعرفهاش. الإيموجي اللي بيتهجّى الإجابة (زي حروف الأعلام) مش مقبول.</li>
                <li>🏆 <b>أصعب لغز الليلة</b>: في الآخر، اللغز اللي أخد أكتر محاولات بيرجع يظهر، واللي حطّه بيتتوّج.</li>
                <li>المسابقة: الفزورة على كل موبايل وعلى التلفزيون و45 ثانية. كل واحد يكتب إجابته، والغلط بيظهر للكل وتحاول تاني، واللي قرّب الكل يشوف «🔥 فلان قرّب» وهو بس يشوف اللي كتبه. الإجابة الصح 10 نقاط، وزيادة للأسرع (+5 للأول، +4 للتاني…).</li>
            </ul>`,
      proverbs: `
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li>مثل مصري <b>ناقصه كلمة</b>.</li>
                <li>على موبايل واحد: المثل للكل، ومين يكمّله الأول. <b>كشف الكلمة</b> لما تتفقوا، وبعدين مثل تاني.</li>
                <li>اختاروا أسماء اللاعبين في الإعداد عشان تحسبوا النقط: بعد الكشف اضغط <b>مين عرفها؟</b>، وفي الآخر منصة الفايزين.</li>
            </ol>
            <p class="help-sub">📱 على موبايلات منفصلة</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>المثل على كل موبايل وعلى التلفزيون و25 ثانية. كل واحد يكتب الكلمة مرة واحدة بس. الصح 10 نقاط وزيادة للأسرع، ولما الوقت يخلص الكلمة تظهر مع اللي كتبه كل واحد.</li>
                <li><b>قرّبت؟</b> لو اللي كتبته قريب (حرف غلط مثلا) مش بيتحسب عليك: محاولة كمان بنص النقط.</li>
                <li>بعد <b>12 ثانية</b> تنزل تلات اختيارات للي لسه ماجاوبش: الكلمة واتنين من أمثال تانية. الاختيار الصح بنص النقط، والغلط صفر ومافيش محاولة تانية. الكتابة لسه بالنقط كاملة.</li>
            </ul>`,
    },
    en: {
      emoji: `
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li>A film, a proverb, a dish or a place written <b>in emoji</b>.</li>
                <li>On one phone: the riddle for the whole table, first to know says it. <b>Reveal</b> when you agree, then the next. You can pick the kind of riddles.</li>
                <li>Spelling doesn't matter, and foreign names count in Arabic or English.</li>
                <li>Pick the players' names on the setup to keep score: after the reveal tap <b>who got it</b>, and finish on a podium.</li>
            </ol>
            <p class="help-sub">📱 On separate phones</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>The host picks the way: <b>one sets</b> a riddle (the answer, what it is - a film, a saying, a dish, a place or a thing - and the clue in emoji only) and everyone else guesses on their own phone; a <b>race</b> on the app's riddles; or the <b>quiz</b>.</li>
                <li>One sets and the race: 6 tries, and nobody sees anyone else's guesses; "🔥 Close" when you nearly have it. Getting it is 10 points, +5 for the first, +4 for the second…; the writer scores 5 for everyone who misses it. Emoji that spell the answer out (like flag letters) are refused.</li>
                <li>🏆 <b>The hardest one tonight</b>: at the end, the secret that took the most tries is shown again and its setter crowned.</li>
                <li>The quiz: the riddle on every phone and the TV, with 45 seconds. Everyone types; a wrong guess shows to the table and you try again; a close one shows as «🔥 Omar is close», its text on his phone only. A right answer is 10 points plus a speed bonus (+5 for the first, +4 for the second…).</li>
            </ul>`,
      proverbs: `
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li>An Egyptian proverb <b>with one word missing</b> (English proverbs in English).</li>
                <li>On one phone: the proverb for the whole table, first to finish it wins it. <b>Show the word</b> when you agree, then the next.</li>
                <li>Pick the players' names on the setup to keep score: after the reveal tap <b>who got it</b>, and finish on a podium.</li>
            </ol>
            <p class="help-sub">📱 On separate phones</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>The proverb on every phone and the TV, with 25 seconds. Everyone types the word once. Right is 10 points plus a speed bonus, and when time is up the word shows with what everyone typed.</li>
                <li><b>Close?</b> An answer that is nearly right (a letter off) is not spent: one more try, for half the points.</li>
                <li>After <b>12 seconds</b> three choices come down for whoever hasn't answered: the word and two from other proverbs. A right pick is half the points; a wrong one is 0 and spends your answer. Typing still pays full.</li>
            </ul>`,
    }
  }
});
