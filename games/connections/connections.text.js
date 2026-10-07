/* connections: the words only this game's screens show, and its rules (Help, the
   first-play card). The build puts them into TRANSLATIONS and GAME_RULES (tools/game-text.cjs):
   read them as t.<key> and GAME_RULES[lang].<id>, as everywhere. */
gameText({
  translations: {
    ar: {
      race_unit_groups: "مجموعات",
      conn_daily_perfect: "💯 من غير ولا غلطة!",
      conn_daily_won: "🎉 لقيت كل المجموعات!",
      conn_daily_lost: "خلصت المحاولات",
      conn_daily_groups: "مجموعة من {n}",
      conn_daily_mistakes: "الغلطات: {n} من {m}",
      conn_submit: "تأكيد",
      conn_shuffle: "خلط",
      conn_mistakes: "محاولات متبقية",
      conn_one_away: "قريب! ثلاثة من نفس المجموعة",
      conn_wrong: "مش صح",
      conn_level_hint: "{cards} كلمة · {groups} مجموعات",
      conn_already_tried: "جرّبت الأربعة دول قبل كده",
      conn_tally: "{level}: حلّيت {n} · {p} من غير غلطة",
    },
    en: {
      race_unit_groups: "groups",
      conn_daily_perfect: "💯 Not a single mistake!",
      conn_daily_won: "🎉 Every group found!",
      conn_daily_lost: "Out of tries",
      conn_daily_groups: "groups out of {n}",
      conn_daily_mistakes: "Mistakes: {n} of {m}",
      conn_submit: "Submit",
      conn_shuffle: "Shuffle",
      conn_mistakes: "Guesses left",
      conn_one_away: "One away — three are from the same group",
      conn_wrong: "Not quite",
      conn_level_hint: "{cards} words · {groups} groups",
      conn_already_tried: "You already tried these four",
      conn_tally: "{level}: {n} solved · {p} with no mistake",
    }
  },
  rules: {
    ar: {
      connections: `
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li>اختار الصعوبة: <b>سهل</b> 12 كلمة (3 مجموعات)، <b>متوسط</b> 16 (4)، <b>صعب</b> 20 (5) ومجموعاته أقرب لبعض.</li>
                <li>كل 4 كلمات من نفس النوع (زواحف، أندية كورة…). اختار 4 واضغط تأكيد.</li>
                <li>عندك 4 غلطات بس. لو 3 من 4 صح التطبيق يقولك، من غير ما يقول مين الغلط.</li>
            </ol>
            <p class="help-sub">📅 تحدي اليوم</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>لغز متوسط (4 مجموعات) في اليوم، هو هو على كل الموبايلات. بيتلعب مرة واحدة: لو سبته ترجعله مكان ما وقفت.</li>
                <li>في الآخر ابعت النتيجة على واتساب: كل محاولة سطر مربعات بألوان المجموعات (🟨🟩🟦🟪)، والغلط جنبه ❌، من غير الكلمات.</li>
            </ul>
            <p class="help-sub">📱 سباق ألغاز (في غرفة)</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>نفس اللغز للكل، وكل واحد بيحلّه على موبايله. الشاشة والتلفزيون بيوروا التقدم بس: المجموعات اللي اتلقت.</li>
                <li><b>الكل يخلّص</b>: الجولة تخلص لما الكل يخلّص أو الوقت (2 دقايق). الحل 10 نقط + بونص للأسرع (+5، +4…).</li>
                <li><b>Fast 3</b>: أول 3 يخلّصوا ياخدوا 10 و7 و5، وبعدها 10 ثواني لأي حد يلحق ياخد 2، والجولة تقفل. بيتختار لوحده من 5 أشخاص.</li>
                <li><b>استسلم</b> بيخلّصك بصفر عشان الجولة تكمّل. 4 غلطات بتطلّعك من الجولة بصفر.</li>
                ${RACE_MIX_RULE.ar}
            </ul>`,
    },
    en: {
      connections: `
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li>Pick the difficulty: <b>easy</b> 12 words (3 groups), <b>medium</b> 16 (4), <b>hard</b> 20 (5) with groups closer to each other.</li>
                <li>Every 4 words share a kind (reptiles, football clubs…). Pick 4 and confirm.</li>
                <li>You have 4 mistakes. If 3 of 4 are right the app says so, without saying which is wrong.</li>
            </ol>
            <p class="help-sub">📅 Puzzle of the day</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>One medium puzzle (4 groups) a day, the same on every phone. It's played once: leave it and it waits where you left it.</li>
                <li>At the end, send your result on WhatsApp: each try a row of squares in the groups' colours (🟨🟩🟦🟪), a wrong one with ❌, without the words.</li>
            </ul>
            <p class="help-sub">📱 Puzzle race (in a room)</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>The same puzzle for everyone, each solving on their own phone. The screens show progress only: groups found.</li>
                <li><b>Everyone finishes</b>: the round ends when everyone is done or the clock runs out (2 minutes). A solve is 10 points plus a bonus for the fastest (+5, +4…).</li>
                <li><b>Fast 3</b>: the first three to finish score 10, 7 and 5; anyone finishing in the ten seconds after scores 2, then the round closes. Preselected from five people.</li>
                <li><b>Give up</b> ends your round with 0 so the others can go on. Four mistakes put you out of the round with 0.</li>
                ${RACE_MIX_RULE.en}
            </ul>`,
    }
  }
});
