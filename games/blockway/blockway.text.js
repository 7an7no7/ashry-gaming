/* Block the Way (سد الطريق): the words only this game's screens show, and its rules (Help, the
   first-play card). The build puts them into TRANSLATIONS and GAME_RULES (tools/game-text.cjs):
   read them as t.<key> and GAME_RULES[lang].blockway, as everywhere. Made by tools/new-game.mjs. */
gameText({
  translations: {
    ar: {
      setup_blockway: "سد الطريق",
      cat_blockway: "رقم سري لكل واحد: دوس لحد ما توصله، والأقرب يكسب",
      blockway_your_number: "رقمك السري",
      blockway_tap: "+1",
      blockway_done: "خلصت",
      blockway_wait: "مستنيين الباقيين…",
      blockway_finish: "خلّص الجولة",
      blockway_result: "النتيجة",
      blockway_lobby_hint: "كل واحد هيجيله رقم سري على موبايله. دوس +1 لحد ما توصله، وبعدين خلصت.",
      blockway_tv_wait: "كل واحد بيعدّ على موبايله",
      blockway_turn_of: "الدور على",
      blockway_show: "وريني رقمي",
    },
    en: {
      setup_blockway: "Block the Way",
      cat_blockway: "A secret number each: tap until you reach it, the nearest wins",
      blockway_your_number: "Your secret number",
      blockway_tap: "+1",
      blockway_done: "Done",
      blockway_wait: "Waiting for the others…",
      blockway_finish: "End the round",
      blockway_result: "The result",
      blockway_lobby_hint: "Everyone gets a secret number on their phone. Tap +1 until you reach it, then Done.",
      blockway_tv_wait: "Everyone is counting on their phone",
      blockway_turn_of: "Turn of",
      blockway_show: "Show my number",
    }
  },
  rules: {
    ar: {
      blockway: `
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li>كل واحد بيجيله رقم سري من 3 لـ 9، محدش غيره يشوفه.</li>
                <li>دوس <b>+1</b> لحد ما توصل لرقمك، وبعدين <b>خلصت</b>.</li>
                <li>اللي يقرب من رقمه أكتر يكسب.</li>
            </ol>`,
    },
    en: {
      blockway: `
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li>Everyone gets a secret number from 3 to 9 that nobody else sees.</li>
                <li>Tap <b>+1</b> until you reach it, then <b>Done</b>.</li>
                <li>Whoever lands nearest their number wins.</li>
            </ol>`,
    }
  }
});
