/* wouldyou: the words only this game's screens show, and its rules (Help, the
   first-play card). The build puts them into TRANSLATIONS and GAME_RULES (tools/game-text.cjs):
   read them as t.<key> and GAME_RULES[lang].<id>, as everywhere. */
gameText({
  rules: {
    ar: {
      wouldyou: `
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>سؤال واحد، اختيارين، وكل واحد يصوّت من موبايله.</li>
                <li>الأصوات مخفية لحد ما يصوّت الجميع، عشان محدش يمشي مع الأغلبية.</li>
                <li>مفيش نقاط: النقاش نفسه هو اللعبة.</li>
            </ul>
            <p class="help-sub">⏭️ التالي لوحده</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>اختيار للمضيف في الأوضة، <b>مقفول من الأول</b>: بعد كل نتيجة عدّاد صغير «الجولة الجاية خلال…»، واللي بعدها تيجي لوحدها. المضيف يدوس «التالي» بدري، أو <b>«⏸ استنى»</b> يوقف العد للجولة دي. ولو للعبة آخر، آخر جولة بتروح للنتيجة النهائية.</li>
            </ul>`,
    },
    en: {
      wouldyou: `
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>One question, two options, and everyone votes from their phone.</li>
                <li>Votes stay hidden until everyone has voted, so nobody follows the crowd.</li>
                <li>No points: the argument afterwards is the game.</li>
            </ul>
            <p class="help-sub">⏭️ Next by itself</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>The host's choice in the lobby, <b>off to start</b>: after each result a small count «Next round in…», then the next one comes by itself. The host can press «Next» sooner, or <b>«⏸ Wait»</b> to stop the count for that round. In a game with a last round, that one goes to the final result.</li>
            </ul>`,
    }
  }
});
