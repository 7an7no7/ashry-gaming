/* The Oracle (العرّاف): the words only this game's screens show, and its rules (Help, the
   first-play card). The build puts them into TRANSLATIONS and GAME_RULES (tools/game-text.cjs):
   read them as t.<key> and GAME_RULES[lang].oracle, as everywhere. Made by tools/new-game.mjs. */
gameText({
  translations: {
    ar: {
      setup_oracle: "العرّاف",
      cat_oracle: "رقم سري لكل واحد: دوس لحد ما توصله، والأقرب يكسب",
      oracle_your_number: "رقمك السري",
      oracle_tap: "+1",
      oracle_done: "خلصت",
      oracle_wait: "مستنيين الباقيين…",
      oracle_finish: "خلّص الجولة",
      oracle_result: "النتيجة",
      oracle_lobby_hint: "كل واحد هيجيله رقم سري على موبايله. دوس +1 لحد ما توصله، وبعدين خلصت.",
      oracle_tv_wait: "كل واحد بيعدّ على موبايله",
      oracle_turn_of: "الدور على",
      oracle_show: "وريني رقمي",
    },
    en: {
      setup_oracle: "The Oracle",
      cat_oracle: "A secret number each: tap until you reach it, the nearest wins",
      oracle_your_number: "Your secret number",
      oracle_tap: "+1",
      oracle_done: "Done",
      oracle_wait: "Waiting for the others…",
      oracle_finish: "End the round",
      oracle_result: "The result",
      oracle_lobby_hint: "Everyone gets a secret number on their phone. Tap +1 until you reach it, then Done.",
      oracle_tv_wait: "Everyone is counting on their phone",
      oracle_turn_of: "Turn of",
      oracle_show: "Show my number",
    }
  },
  rules: {
    ar: {
      oracle: `
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li>كل واحد بيجيله رقم سري من 3 لـ 9، محدش غيره يشوفه.</li>
                <li>دوس <b>+1</b> لحد ما توصل لرقمك، وبعدين <b>خلصت</b>.</li>
                <li>اللي يقرب من رقمه أكتر يكسب.</li>
            </ol>`,
    },
    en: {
      oracle: `
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li>Everyone gets a secret number from 3 to 9 that nobody else sees.</li>
                <li>Tap <b>+1</b> until you reach it, then <b>Done</b>.</li>
                <li>Whoever lands nearest their number wins.</li>
            </ol>`,
    }
  }
});
