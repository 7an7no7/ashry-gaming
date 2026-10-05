/* mines: the words only this game's screens show, and its rules (Help, the
   first-play card). The build puts them into TRANSLATIONS and GAME_RULES (tools/game-text.cjs):
   read them as t.<key> and GAME_RULES[lang].<id>, as everywhere. */
gameText({
  translations: {
    ar: {
      mines_left: "ألغام",
      mines_flag_mode: "علّم",
      mines_first_tap: "أول لمسة دايماً أمان",
      mines_hint: "دوس مطوّل أو فعّل 🚩 عشان تعلّم على لغم",
      mines_lost: "بووم! 💥",
      mines_lost_line: "دوست على لغم. جرّب تاني!",
      mines_won: "نضّفت الأرض! 🚩",
    },
    en: {
      mines_left: "Mines",
      mines_flag_mode: "Flag",
      mines_first_tap: "The first tap is always safe",
      mines_hint: "Long-press, or turn on 🚩, to flag a mine",
      mines_lost: "Boom! 💥",
      mines_lost_line: "You hit a mine. Try again!",
      mines_won: "Field cleared! 🚩",
    }
  },
  rules: {
    ar: {
      mines: `
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li>تحت الخانات ألغام. افتح كل خانة مافيهاش لغم عشان تكسب.</li>
                <li>الرقم بيقول كام لغم حوالين الخانة (الـ8 اللي جنبها). الخانة الفاضية بتفتح اللي حواليها لوحدها.</li>
                <li><b>دوس مطوّل</b> (أو فعّل 🚩) عشان تحط علامة على لغم.</li>
                <li>رقم حواليه علامات بعدده؟ دوس عليه يفتح الباقي مرة واحدة.</li>
                <li>أول لمسة دايماً أمان. دوست على لغم؟ خسرت.</li>
            </ol>
            <p class="help-sub">📱 سباق ألغاز (في غرفة)</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>نفس اللغز للكل، وكل واحد بيحلّه على موبايله. الشاشة والتلفزيون بيوروا التقدم بس: الخانات اللي اتفتحت.</li>
                <li><b>الكل يخلّص</b>: الجولة تخلص لما الكل يخلّص أو الوقت (3 دقايق). الحل 10 نقط + بونص للأسرع (+5، +4…).</li>
                <li><b>Fast 3</b>: أول 3 يخلّصوا ياخدوا 10 و7 و5، وبعدها 10 ثواني لأي حد يلحق ياخد 2، والجولة تقفل. بيتختار لوحده من 5 أشخاص.</li>
                <li><b>استسلم</b> بيخلّصك بصفر عشان الجولة تكمّل. لغم بيطلّعك من الجولة بصفر.</li>
                ${RACE_MIX_RULE.ar}
            </ul>`,
    },
    en: {
      mines: `
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li>Mines are hidden under the cells. Open every cell that isn't a mine to win.</li>
                <li>A number tells how many mines touch that cell (its 8 neighbours). An empty cell opens its neighbours by itself.</li>
                <li><b>Long-press</b> (or turn on 🚩) to flag a mine.</li>
                <li>A number with as many flags around it as it says? Tap it to open the rest at once.</li>
                <li>The first tap is always safe. Hit a mine and you lose.</li>
            </ol>
            <p class="help-sub">📱 Puzzle race (in a room)</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>The same puzzle for everyone, each solving on their own phone. The screens show progress only: cells opened.</li>
                <li><b>Everyone finishes</b>: the round ends when everyone is done or the clock runs out (3 minutes). A solve is 10 points plus a bonus for the fastest (+5, +4…).</li>
                <li><b>Fast 3</b>: the first three to finish score 10, 7 and 5; anyone finishing in the ten seconds after scores 2, then the round closes. Preselected from five people.</li>
                <li><b>Give up</b> ends your round with 0 so the others can go on. A mine puts you out of the round with 0.</li>
                ${RACE_MIX_RULE.en}
            </ul>`,
    }
  }
});
