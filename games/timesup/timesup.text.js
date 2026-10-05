/* timesup: the words only this game's screens show, and its rules (Help, the
   first-play card). The build puts them into TRANSLATIONS and GAME_RULES (tools/game-text.cjs):
   read them as t.<key> and GAME_RULES[lang].<id>, as everywhere. */
gameText({
  translations: {
    ar: {
      timesup_r1: "الجولة 1: اشرح بأي كلام (من غير الكلمة نفسها)",
      timesup_r2: "الجولة 2: كلمة واحدة بس!",
      timesup_r3: "الجولة 3: تمثيل من غير ولا صوت!",
      timesup_carry: "مكمّل بـ {n} ثانية",
      timesup_round_done: "خلصت الجولة {n}! 🎉",
    },
    en: {
      timesup_r1: "Round 1: describe it any way you like (not the word itself)",
      timesup_r2: "Round 2: exactly ONE word!",
      timesup_r3: "Round 3: act it out, no sound at all!",
      timesup_carry: "carrying on with {n}s",
      timesup_round_done: "Round {n} done! 🎉",
    }
  },
  rules: {
    ar: {
      timesup: `
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li>اللاعبين بيتقسموا فريقين، وحزمة كروت واحدة للكل.</li>
                <li>نفس الكروت بتتلعب <b>3 جولات</b>: الأولى <b>كلام حر</b> (وصف من غير ما تقول الاسم)، التانية <b>كلمة واحدة</b> بس، التالتة <b>تمثيل صامت</b>.</li>
                <li>كل دور له وقت. لو الكروت خلصت في نص دورك، تكمل في الجولة اللي بعدها بالوقت الفاضل.</li>
                <li>الفريق اللي جمع كروت أكتر في التلات جولات يكسب.</li>
                <li>ضغطت صح أو تجاوز بالغلط؟ <b>↶</b> جنب الساعة يرجّع آخر كارت ونقطته.</li>
            </ol>`,
    },
    en: {
      timesup: `
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li>Players are split into two teams, with one deck of cards for everyone.</li>
                <li>The same cards are played over <b>3 rounds</b>: first <b>free talk</b> (describe without saying the name), then <b>one word</b> only, then <b>silent acting</b>.</li>
                <li>Every turn is timed. If the deck runs out mid-turn, you carry on into the next round with the time you have left.</li>
                <li>The team with more cards over the three rounds wins.</li>
                <li>Tapped correct or pass by mistake? <b>↶</b> next to the clock brings the last card and its point back.</li>
            </ol>`,
    }
  }
});
