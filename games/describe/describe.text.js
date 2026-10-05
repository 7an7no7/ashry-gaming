/* describe: the words only this game's screens show, and its rules (Help, the
   first-play card). The build puts them into TRANSLATIONS and GAME_RULES (tools/game-text.cjs):
   read them as t.<key> and GAME_RULES[lang].<id>, as everywhere. */
gameText({
  rules: {
    ar: {
      describe: `
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li>واحد يمسك الموبايل ويوصف الكلمة لفريقه بأي كلام، بس <b>ممنوع</b> الكلمات الحمرا اللي تحتها.</li>
                <li>قال كلمة ممنوعة؟ يتخطاها. عرفوها؟ <b>صح</b>.</li>
                <li>اجمع أكبر عدد كلمات قبل ما الوقت يخلص. الكروت مش بتتكرر على نفس الموبايل لحد ما تخلص كلها.</li>
            </ol>
            <p class="help-sub">👥 فريقين</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>اختار <b>فريقين</b> من شاشة الإعداد: الموبايل يقولك دور مين، كل فريق يلعب جولته بالدور، ولوحة بالنتيجة في الآخر.</li>
                <li>مباراة لسه ما خلصتش تقدر تكمّلها من الإعداد، والتطبيق يسألك قبل ما يبدأ واحدة جديدة. ضغطت صح غلط؟ <b>↶</b> يرجّع آخر كارت ونقطته.</li>
            </ul>`,
    },
    en: {
      describe: `
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li>One player holds the phone and describes the word to their team any way they like, but the red words underneath are <b>forbidden</b>.</li>
                <li>Said a forbidden word? Skip it. Got it? <b>Correct</b>.</li>
                <li>Collect as many words as you can before time runs out. Cards don't repeat on the same phone until they have all been played.</li>
            </ol>
            <p class="help-sub">👥 Two teams</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>Choose <b>Two teams</b> on the setup screen: the phone says whose turn it is, teams alternate rounds, and a final board closes the match.</li>
                <li>An unfinished match can be carried on from the setup, and the app asks before starting a new one. Tapped correct by mistake? <b>↶</b> brings the last card and its point back.</li>
            </ul>`,
    }
  }
});
