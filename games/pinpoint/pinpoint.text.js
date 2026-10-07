/* pinpoint: the words only this game's screens show, and its rules (Help, the
   first-play card). The build puts them into TRANSLATIONS and GAME_RULES (tools/game-text.cjs):
   read them as t.<key> and GAME_RULES[lang].<id>, as everywhere. */
gameText({
  translations: {
    ar: {
      race_unit_rounds: "جولات",
      race_score_pts: "{n} نقطة",
      pin_round: "الجولة",
      pin_points: "النقاط",
      pin_worth: "تستاهل",
      pin_worth_now: "دلوقتي بـ {n} نقط",
      pin_ask: "إيه اللي يجمعهم؟",
      pin_right: "صح! 🎯",
      pin_missed: "المرة دي فاتتك",
      pin_next: "الجولة الجاية",
      pin_finish: "النتيجة",
      pin_result: "خلصت الجولات",
    },
    en: {
      race_unit_rounds: "rounds",
      race_score_pts: "{n} pts",
      pin_round: "Round",
      pin_points: "Points",
      pin_worth: "Worth",
      pin_worth_now: "Worth {n} points now",
      pin_ask: "What links them?",
      pin_right: "Right! 🎯",
      pin_missed: "Missed this one",
      pin_next: "Next round",
      pin_finish: "See the score",
      pin_result: "All rounds played",
    }
  },
  rules: {
    ar: {
      pinpoint: `
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li>كل جولة فيها <b>فئة مستخبية</b> وأول كلمة منها، و6 فئات تختار منهم.</li>
                <li>عرفتها من أول كلمة؟ <b>5 نقاط</b>. كل اختيار غلط بيقع من الاختيارات ويفتح الكلمة اللي بعدها، والنقاط بتقل لحد نقطة واحدة: الخمس نقط اللي فوق بيقولوا الجولة دلوقتي بكام.</li>
                <li>الاختيارات قريبة من بعض، والكلمات الأولى ممكن تنفع لأكتر من فئة. استنى لو مش متأكد.</li>
                <li>5 جولات، والنتيجة من 25.</li>
            </ol>
            <p class="help-sub">📱 سباق ألغاز (في غرفة)</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>نفس اللغز للكل، وكل واحد بيحلّه على موبايله. الشاشة والتلفزيون بيوروا التقدم بس: الجولات اللي اتحلّت.</li>
                <li><b>الكل يخلّص</b>: الجولة تخلص لما الكل يخلّص أو الوقت (2 دقايق). الحل 10 نقط + بونص للأسرع (+5، +4…).</li>
                <li><b>Fast 3</b>: أول 3 يخلّصوا ياخدوا 10 و7 و5، وبعدها 10 ثواني لأي حد يلحق ياخد 2، والجولة تقفل. بيتختار لوحده من 5 أشخاص.</li>
                <li><b>استسلم</b> بيخلّصك بصفر عشان الجولة تكمّل. الترتيب بالنقط، وبعدين الأسرع.</li>
                ${RACE_MIX_RULE.ar}
            </ul>`,
    },
    en: {
      pinpoint: `
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li>Each round has a <b>hidden category</b>, its first word, and six categories to choose from.</li>
                <li>Got it from the first word? <b>5 points</b>. Each wrong pick falls out of the choices and opens the next word, and the points drop, down to 1: the five dots at the top say what the round is worth now.</li>
                <li>The choices are close, and the first words can fit more than one category. Wait if you're not sure.</li>
                <li>Five rounds, scored out of 25.</li>
            </ol>
            <p class="help-sub">📱 Puzzle race (in a room)</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>The same puzzle for everyone, each solving on their own phone. The screens show progress only: rounds answered.</li>
                <li><b>Everyone finishes</b>: the round ends when everyone is done or the clock runs out (2 minutes). A solve is 10 points plus a bonus for the fastest (+5, +4…).</li>
                <li><b>Fast 3</b>: the first three to finish score 10, 7 and 5; anyone finishing in the ten seconds after scores 2, then the round closes. Preselected from five people.</li>
                <li><b>Give up</b> ends your round with 0 so the others can go on. Ranked by points, then by time.</li>
                ${RACE_MIX_RULE.en}
            </ul>`,
    }
  }
});
