/* fibbage: the words only this game's screens show, and its rules (Help, the
   first-play card). The build puts them into TRANSLATIONS and GAME_RULES (tools/game-text.cjs):
   read them as t.<key> and GAME_RULES[lang].<id>, as everywhere. */
gameText({
  translations: {
    ar: {
      fib_sure: "متأكد",
      fib_sure_on: "متأكد",
      fib_sure_hint: "الحقيقية بـ2000 بدل 1000، بس لو طلعت كذبة عليك 500.",
    },
    en: {
      fib_sure: "I'm sure",
      fib_sure_on: "Sure",
      fib_sure_hint: "The truth pays 2000 instead of 1000, but a lie costs you 500.",
    }
  },
  rules: {
    ar: {
      fibbage: `
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li>سؤال فيه فراغ، وإجابته الحقيقية غريبة فعلاً.</li>
                <li>كل واحد يكتب إجابة مخترعة تبان مقنعة.</li>
                <li>الإجابات كلها تظهر مخلوطة مع الحقيقية. اختار اللي تفتكرها الحقيقية، ومش هتقدر تختار كذبتك.</li>
                <li>تصيب الحقيقية = 1000 نقطة. كل واحد يختار كذبتك = 500 نقطة لك.</li>
                <li><b>✌️ متأكد</b>: قبل ما تصوّت أو بعدها، لو متأكد من اختيارك: الحقيقية بـ2000، ولو طلعت كذبة تخسر 500. في النتيجة اللي كانوا متأكدين جنبهم ×2.</li>
                <li>كذبة هي نفسها الحقيقية مكتوبة بشكل تاني (حرف ناقص، أو معاها كلمة السؤال) مش بتتقبل.</li>
            </ol>
            <p class="help-sub">⏭️ التالي لوحده</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>اختيار للمضيف في الأوضة، <b>مقفول من الأول</b>: بعد كل نتيجة عدّاد صغير «الجولة الجاية خلال…»، واللي بعدها تيجي لوحدها. المضيف يدوس «التالي» بدري، أو <b>«⏸ استنى»</b> يوقف العد للجولة دي. ولو للعبة آخر، آخر جولة بتروح للنتيجة النهائية.</li>
            </ul>`,
    },
    en: {
      fibbage: `
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li>A question with a blank, and a real answer that is genuinely strange.</li>
                <li>Everyone types a made-up answer that sounds convincing.</li>
                <li>All the answers appear mixed with the real one. Pick the one you think is real; you cannot pick your own lie.</li>
                <li>Hit the truth = 1000 points. Each player who picks your lie = 500 points for you.</li>
                <li><b>✌️ I'm sure</b>: before or after you vote, if you're sure of your pick: the truth pays 2000, and a lie costs you 500. The result marks the sure ones ×2.</li>
                <li>A "lie" that is really the truth written another way (a letter off, or with the question's own word) is not accepted.</li>
            </ol>
            <p class="help-sub">⏭️ Next by itself</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>The host's choice in the lobby, <b>off to start</b>: after each result a small count «Next round in…», then the next one comes by itself. The host can press «Next» sooner, or <b>«⏸ Wait»</b> to stop the count for that round. In a game with a last round, that one goes to the final result.</li>
            </ul>`,
    }
  }
});
