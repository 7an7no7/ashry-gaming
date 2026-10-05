/* teams: the words only this game's screens show, and its rules (Help, the
   first-play card). The build puts them into TRANSLATIONS and GAME_RULES (tools/game-text.cjs):
   read them as t.<key> and GAME_RULES[lang].<id>, as everywhere. */
gameText({
  translations: {
    ar: {
      team_name_prefix: "فريق",
      teams_split: "{n} لاعبين: فرق من {sizes}",
      teams_split_even: "{n} لاعبين: كل فريق فيه {each}",
      teams_split_need: "محتاجين {k} لاعبين على الأقل",
      teams_vs: "ضد",
      teams_players_n: "{n} لاعبين",
      teams_by_skill: "بالمهارة",
      teams_by_lot: "قرعة",
      teams_copied: "الفرق اتنسخت، الصقها في الجروب",
    },
    en: {
      team_name_prefix: "Team",
      teams_split: "{n} players: teams of {sizes}",
      teams_split_even: "{n} players: {each} in each team",
      teams_split_need: "You need at least {k} players",
      teams_vs: "vs",
      teams_players_n: "{n} players",
      teams_by_skill: "By skill",
      teams_by_lot: "Random draw",
      teams_copied: "Teams copied. Paste them in the group chat",
    }
  },
  rules: {
    ar: {
      teams: `
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>يقسم أي عدد لاعبين على 2 أو 3 أو 4 فرق بالتساوي.</li>
                <li><b>عشوائي</b>: خلط كامل. <b>متوازن</b>: تدّي كل واحد تقييم من 1 لـ 5 نجوم، والتطبيق يوزّعهم عشان الفرق تطلع متقاربة.</li>
                <li>الفرق دايماً بنفس العدد، أو بفرق لاعب واحد بس.</li>
            </ul>`,
    },
    en: {
      teams: `
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>Splits any number of players into 2, 3 or 4 even teams.</li>
                <li><b>Random</b>: a full shuffle. <b>Balanced</b>: rate everyone 1 to 5 stars and the app spreads them so the teams come out close.</li>
                <li>Teams always have the same number of players, or one apart at most.</li>
            </ul>`,
    }
  }
});
