/* mostlikely: the words only this game's screens show, and its rules (Help, the
   first-play card). The build puts them into TRANSLATIONS and GAME_RULES (tools/game-text.cjs):
   read them as t.<key> and GAME_RULES[lang].<id>, as everywhere. */
gameText({
  translations: {
    ar: {
      mlt_scattered: "الأصوات اتفرّقت: محدش خد نقطة",
    },
    en: {
      mlt_scattered: "The votes scattered: no point this time",
    }
  },
  rules: {
    ar: {
      mostlikely: `
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>يظهر موقف، وكل واحد يختار مين في الغرفة أقرب له. مسموح تصوّت لنفسك.</li>
                <li>اللي ياخد أكتر أصوات ياخد نقطة، ولو فيه تعادل على الأول كلهم ياخدوا نقطة.</li>
                <li>لو أربعة أو أكتر وكل واحد خد صوت واحد بالكتير، <b>الأصوات اتفرّقت</b> ومحدش ياخد نقطة.</li>
            </ul>
            <p class="help-sub">⏭️ التالي لوحده</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>اختيار للمضيف في الأوضة، <b>مقفول من الأول</b>: بعد كل نتيجة عدّاد صغير «الجولة الجاية خلال…»، واللي بعدها تيجي لوحدها. المضيف يدوس «التالي» بدري، أو <b>«⏸ استنى»</b> يوقف العد للجولة دي. ولو للعبة آخر، آخر جولة بتروح للنتيجة النهائية.</li>
            </ul>`,
    },
    en: {
      mostlikely: `
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>A situation comes up and everyone picks who in the room fits it best. Voting for yourself is allowed.</li>
                <li>Most votes takes a point; a tie gives everyone tied a point.</li>
                <li>Four or more of you and nobody got more than one vote? <b>The votes scattered</b>: no point this time.</li>
            </ul>
            <p class="help-sub">⏭️ Next by itself</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>The host's choice in the lobby, <b>off to start</b>: after each result a small count «Next round in…», then the next one comes by itself. The host can press «Next» sooner, or <b>«⏸ Wait»</b> to stop the count for that round. In a game with a last round, that one goes to the final result.</li>
            </ul>`,
    }
  }
});
