/* Letter Grid (شبكة الحروف): the words only this game's screens show, and its rules (Help, the
   first-play card). The build puts them into TRANSLATIONS and GAME_RULES (tools/game-text.cjs):
   read them as t.<key> and GAME_RULES[lang].boggle, as everywhere. Made by tools/new-game.mjs. */
gameText({
  translations: {
    ar: {
      setup_boggle: "شبكة الحروف",
      cat_boggle: "رقم سري لكل واحد: دوس لحد ما توصله، والأقرب يكسب",
      boggle_your_number: "رقمك السري",
      boggle_tap: "+1",
      boggle_done: "خلصت",
      boggle_wait: "مستنيين الباقيين…",
      boggle_finish: "خلّص الجولة",
      boggle_result: "النتيجة",
      boggle_lobby_hint: "كل واحد هيجيله رقم سري على موبايله. دوس +1 لحد ما توصله، وبعدين خلصت.",
      boggle_tv_wait: "كل واحد بيعدّ على موبايله",
      boggle_turn_of: "الدور على",
      boggle_show: "وريني رقمي",
    },
    en: {
      setup_boggle: "Letter Grid",
      cat_boggle: "A secret number each: tap until you reach it, the nearest wins",
      boggle_your_number: "Your secret number",
      boggle_tap: "+1",
      boggle_done: "Done",
      boggle_wait: "Waiting for the others…",
      boggle_finish: "End the round",
      boggle_result: "The result",
      boggle_lobby_hint: "Everyone gets a secret number on their phone. Tap +1 until you reach it, then Done.",
      boggle_tv_wait: "Everyone is counting on their phone",
      boggle_turn_of: "Turn of",
      boggle_show: "Show my number",
    }
  },
  rules: {
    ar: {
      boggle: `
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li>كل واحد بيجيله رقم سري من 3 لـ 9، محدش غيره يشوفه.</li>
                <li>دوس <b>+1</b> لحد ما توصل لرقمك، وبعدين <b>خلصت</b>.</li>
                <li>اللي يقرب من رقمه أكتر يكسب.</li>
            </ol>`,
    },
    en: {
      boggle: `
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li>Everyone gets a secret number from 3 to 9 that nobody else sees.</li>
                <li>Tap <b>+1</b> until you reach it, then <b>Done</b>.</li>
                <li>Whoever lands nearest their number wins.</li>
            </ol>`,
    }
  }
});
