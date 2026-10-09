/* Numbers (حسبة): the words only this game's screens show, and its rules (Help, the
   first-play card). The build puts them into TRANSLATIONS and GAME_RULES (tools/game-text.cjs):
   read them as t.<key> and GAME_RULES[lang].hesba, as everywhere. Made by tools/new-game.mjs. */
gameText({
  translations: {
    ar: {
      setup_hesba: "حسبة",
      cat_hesba: "رقم سري لكل واحد: دوس لحد ما توصله، والأقرب يكسب",
      hesba_your_number: "رقمك السري",
      hesba_tap: "+1",
      hesba_done: "خلصت",
      hesba_wait: "مستنيين الباقيين…",
      hesba_finish: "خلّص الجولة",
      hesba_result: "النتيجة",
      hesba_lobby_hint: "كل واحد هيجيله رقم سري على موبايله. دوس +1 لحد ما توصله، وبعدين خلصت.",
      hesba_tv_wait: "كل واحد بيعدّ على موبايله",
      hesba_turn_of: "الدور على",
      hesba_show: "وريني رقمي",
    },
    en: {
      setup_hesba: "Numbers",
      cat_hesba: "A secret number each: tap until you reach it, the nearest wins",
      hesba_your_number: "Your secret number",
      hesba_tap: "+1",
      hesba_done: "Done",
      hesba_wait: "Waiting for the others…",
      hesba_finish: "End the round",
      hesba_result: "The result",
      hesba_lobby_hint: "Everyone gets a secret number on their phone. Tap +1 until you reach it, then Done.",
      hesba_tv_wait: "Everyone is counting on their phone",
      hesba_turn_of: "Turn of",
      hesba_show: "Show my number",
    }
  },
  rules: {
    ar: {
      hesba: `
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li>كل واحد بيجيله رقم سري من 3 لـ 9، محدش غيره يشوفه.</li>
                <li>دوس <b>+1</b> لحد ما توصل لرقمك، وبعدين <b>خلصت</b>.</li>
                <li>اللي يقرب من رقمه أكتر يكسب.</li>
            </ol>`,
    },
    en: {
      hesba: `
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li>Everyone gets a secret number from 3 to 9 that nobody else sees.</li>
                <li>Tap <b>+1</b> until you reach it, then <b>Done</b>.</li>
                <li>Whoever lands nearest their number wins.</li>
            </ol>`,
    }
  }
});
