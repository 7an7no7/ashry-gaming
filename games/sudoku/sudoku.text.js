/* sudoku: the words only this game's screens show, and its rules (Help, the
   first-play card). The build puts them into TRANSLATIONS and GAME_RULES (tools/game-text.cjs):
   read them as t.<key> and GAME_RULES[lang].<id>, as everywhere. */
gameText({
  translations: {
    ar: {
      sdk_mistakes: "غلطات",
      sdk_erase: "امسح",
      sdk_notes: "ملاحظات",
      sdk_all_notes: "كل الاحتمالات",
      sdk_all_notes_used: "اتحلّت بـ«كل الاحتمالات»",
    },
    en: {
      sdk_mistakes: "Mistakes",
      sdk_erase: "Erase",
      sdk_notes: "Notes",
      sdk_all_notes: "All candidates",
      sdk_all_notes_used: "Solved with «All candidates»",
    }
  },
  rules: {
    ar: {
      sudoku: `
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li>شبكة 9×9 مقسومة 9 مربعات. املأ كل خانة فاضية برقم من 1 لـ 9.</li>
                <li>الرقم مايتكررش في نفس الصف، ولا نفس العمود، ولا نفس المربع الصغير.</li>
                <li>اختار خانة ثم رقم. الرقم الغلط بيبقى أحمر ويتحسب غلطة.</li>
                <li><b>ملاحظات ✏️</b>: اكتب أرقام صغيرة محتملة في الخانة. بتتمسح لوحدها لما الرقم يتحط في صفها أو عمودها أو مربعها.</li>
                <li><b>🔢 كل الاحتمالات</b> (بيظهر وانت في الملاحظات): بيكتب في كل خانة فاضية كل الأرقام اللي ممكن تيجي فيها مرة واحدة. مش تلميح، والنتيجة بتقول إنك استخدمته.</li>
                <li>كل لغز ليه حل واحد بس. <b>سهل</b> 40 رقم ظاهر، <b>متوسط</b> 32، <b>صعب</b> 26.</li>
            </ol>
            <p class="help-sub">💡 تلميحات</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>التلميح بيحط الرقم الصح في الخانة، بس الحل بالتلميحات مايتسجلش أحسن نتيجة.</li>
                <li><b>تحدي النهارده</b>: نفس اللغز لكل الناس في نفس اليوم، والنتيجة تقدر تشاركها.</li>
            </ul>
            <p class="help-sub">📱 سباق ألغاز (في غرفة)</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>نفس اللغز للكل، وكل واحد بيحلّه على موبايله. الشاشة والتلفزيون بيوروا التقدم بس: الخانات اللي اتملت.</li>
                <li><b>الكل يخلّص</b>: الجولة تخلص لما الكل يخلّص أو الوقت (4 دقايق). الحل 10 نقط + بونص للأسرع (+5، +4…).</li>
                <li><b>Fast 3</b>: أول 3 يخلّصوا ياخدوا 10 و7 و5، وبعدها 10 ثواني لأي حد يلحق ياخد 2، والجولة تقفل. بيتختار لوحده من 5 أشخاص.</li>
                <li><b>استسلم</b> بيخلّصك بصفر عشان الجولة تكمّل. السباق على المستوى السهل بس، ومن غير تلميحات.</li>
                ${RACE_MIX_RULE.ar}
            </ul>`,
    },
    en: {
      sudoku: `
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li>A 9×9 grid split into 9 boxes. Fill every empty cell with a number from 1 to 9.</li>
                <li>No number repeats in the same row, the same column or the same small box.</li>
                <li>Pick a cell, then a number. A wrong number shows red and counts as a mistake.</li>
                <li><b>Notes ✏️</b>: small candidate numbers in a cell. They clear themselves when the number is placed in their row, column or box.</li>
                <li><b>🔢 All candidates</b> (shown while notes are on): fills every empty cell with every number that could go there, in one tap. It's no hint; the result says you used it.</li>
                <li>Every puzzle has exactly one solution. <b>Easy</b> shows 40 numbers, <b>medium</b> 32, <b>hard</b> 26.</li>
            </ol>
            <p class="help-sub">💡 Hints</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>A hint puts the right number in a cell, but a solve with hints doesn't count as a best.</li>
                <li><b>Today's puzzle</b>: the same puzzle for everyone on the same day, with a result you can share.</li>
            </ul>
            <p class="help-sub">📱 Puzzle race (in a room)</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>The same puzzle for everyone, each solving on their own phone. The screens show progress only: cells filled.</li>
                <li><b>Everyone finishes</b>: the round ends when everyone is done or the clock runs out (4 minutes). A solve is 10 points plus a bonus for the fastest (+5, +4…).</li>
                <li><b>Fast 3</b>: the first three to finish score 10, 7 and 5; anyone finishing in the ten seconds after scores 2, then the round closes. Preselected from five people.</li>
                <li><b>Give up</b> ends your round with 0 so the others can go on. The race is on easy only, with no hints.</li>
                ${RACE_MIX_RULE.en}
            </ul>`,
    }
  }
});
