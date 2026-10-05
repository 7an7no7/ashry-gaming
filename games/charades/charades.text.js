/* charades: the words only this game's screens show, and its rules (Help, the
   first-play card). The build puts them into TRANSLATIONS and GAME_RULES (tools/game-text.cjs):
   read them as t.<key> and GAME_RULES[lang].<id>, as everywhere. */
gameText({
  rules: {
    ar: {
      charades: `
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li>اختار فئة (أفلام، أفعال…) ووقت الجولة.</li>
                <li>واحد يمسك الموبايل ويمثّل الكلمة <b>من غير كلام</b>، والباقي يخمّنوا.</li>
                <li>عرفوها؟ اضغط <b>صح</b> أو على الكارت. صعبة؟ <b>تجاوز</b>.</li>
                <li>لما الوقت يخلص تشوف عدد الكلمات الصح.</li>
            </ol>
            <p class="help-sub">👥 فريقين</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>من شاشة الإعداد اختار <b>فريقين</b>، سمّيهم، وحدد عدد الأدوار لكل فريق. الموبايل يقولك دور مين، الفريق يلعب جولته، وتمرر للفريق التاني. في الآخر لوحة بالنتيجة.</li>
                <li>مباراة لسه ما خلصتش تقدر تكمّلها من الإعداد، والتطبيق يسألك قبل ما يبدأ واحدة جديدة. ضغطت صح غلط؟ <b>↶</b> يرجّع آخر كارت ونقطته.</li>
            </ul>`,
    },
    en: {
      charades: `
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li>Pick a category (films, actions…) and the round length.</li>
                <li>One player holds the phone and acts the word out <b>without talking</b>; the rest guess.</li>
                <li>Got it? Press <b>Correct</b> or tap the card. Too hard? <b>Pass</b>.</li>
                <li>When time is up you see how many were right.</li>
            </ol>
            <p class="help-sub">👥 Two teams</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>On the setup screen choose <b>Two teams</b>, name them and set the turns each. The phone says whose turn it is, the team plays its round, and you hand the phone over. A final board at the end.</li>
                <li>An unfinished match can be carried on from the setup, and the app asks before starting a new one. Tapped correct by mistake? <b>↶</b> brings the last card and its point back.</li>
            </ul>`,
    }
  }
});
