/* bracket: the words only this game's screens show, and its rules (Help, the
   first-play card). The build puts them into TRANSLATIONS and GAME_RULES (tools/game-text.cjs):
   read them as t.<key> and GAME_RULES[lang].<id>, as everywhere. */
gameText({
  translations: {
    ar: {
      tourney_need: "اختار من {min} لـ {max} لاعب",
      tourney_undo: "رجّع آخر نتيجة",
      tourney_bye: "عدّى على طول",
      tourney_champion: "البطل",
      tourney_again: "قرعة جديدة بنفس اللاعبين",
      tourney_final: "النهائي 🏆",
      tourney_semi: "نصف النهائي",
      tourney_quarter: "ربع النهائي",
      tourney_r16: "دور الـ16",
    },
    en: {
      tourney_need: "Pick {min} to {max} players",
      tourney_undo: "Take back the last result",
      tourney_bye: "Bye",
      tourney_champion: "Champion",
      tourney_again: "New draw, same players",
      tourney_final: "Final 🏆",
      tourney_semi: "Semi-final",
      tourney_quarter: "Quarter-final",
      tourney_r16: "Round of 16",
    }
  },
  rules: {
    ar: {
      tourney: `
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>جدول مباريات من 3 لـ 16 لاعب بقرعة عشوائية. اللي مالوش خصم يعدّي للدور اللي بعده على طول.</li>
                <li>اضغط على اسم الفائز عشان يطلع للدور اللي بعده لحد الكأس 🏆. ضغطت غلط؟ «رجّع آخر نتيجة».</li>
            </ul>`,
    },
    en: {
      tourney: `
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>A bracket for 3 to 16 players, drawn at random. Anyone without an opponent goes straight through.</li>
                <li>Tap the winner's name to send them to the next round, up to the cup 🏆. Tapped the wrong one? "Take back the last result".</li>
            </ul>`,
    }
  }
});
