/* nonogram: the words only this game's screens show, and its rules (Help, the
   first-play card). The build puts them into TRANSLATIONS and GAME_RULES (tools/game-text.cjs):
   read them as t.<key> and GAME_RULES[lang].<id>, as everywhere. */
gameText({
  translations: {
    ar: {
      nono_fill: "لوّن",
      nono_cross: "علّم",
    },
    en: {
      nono_fill: "Fill",
      nono_cross: "Mark",
    }
  },
  rules: {
    ar: {
      nonogram: `
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li>الأرقام جنب كل صف وفوق كل عمود بتقول <b>مجموعات الخانات الملوّنة</b> بالترتيب: «3 1» يعني 3 ورا بعض، فاصل، وبعدين 1.</li>
                <li>اختار <b>⬛ لوّن</b> ولوّن، أو <b>✕ علّم</b> على خانة متأكد إنها فاضية. اسحب صباعك تلوّن كذا خانة.</li>
                <li>الصف أو العمود اللي خلص بيبهت رقمه. لما كل الخانات تبقى صح بتظهر الصورة.</li>
                <li>كل لغز بيتحل بالمنطق من غير تخمين. <b>سهل</b> 5×5، <b>متوسط</b> 8×8، <b>صعب</b> 10×10.</li>
            </ol>
            <p class="help-sub">📱 سباق ألغاز (في غرفة)</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>نفس اللغز للكل، وكل واحد بيحلّه على موبايله. الشاشة والتلفزيون بيوروا التقدم بس: الخانات اللي اتلوّنت.</li>
                <li><b>الكل يخلّص</b>: الجولة تخلص لما الكل يخلّص أو الوقت (3 دقايق). الحل 10 نقط + بونص للأسرع (+5، +4…).</li>
                <li><b>Fast 3</b>: أول 3 يخلّصوا ياخدوا 10 و7 و5، وبعدها 10 ثواني لأي حد يلحق ياخد 2، والجولة تقفل. بيتختار لوحده من 5 أشخاص.</li>
                <li><b>استسلم</b> بيخلّصك بصفر عشان الجولة تكمّل. من غير تلميحات.</li>
                ${RACE_MIX_RULE.ar}
            </ul>`,
    },
    en: {
      nonogram: `
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li>The numbers beside each row and above each column are its <b>groups of filled cells</b>, in order: "3 1" is three in a row, a gap, then one.</li>
                <li>Choose <b>⬛ Fill</b> and fill, or <b>✕ Mark</b> a cell you know is empty. Drag to paint several cells.</li>
                <li>A finished row or column fades its numbers. When every cell is right the picture appears.</li>
                <li>Every puzzle can be solved by logic, with no guessing. <b>Easy</b> 5×5, <b>medium</b> 8×8, <b>hard</b> 10×10.</li>
            </ol>
            <p class="help-sub">📱 Puzzle race (in a room)</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>The same puzzle for everyone, each solving on their own phone. The screens show progress only: cells painted.</li>
                <li><b>Everyone finishes</b>: the round ends when everyone is done or the clock runs out (3 minutes). A solve is 10 points plus a bonus for the fastest (+5, +4…).</li>
                <li><b>Fast 3</b>: the first three to finish score 10, 7 and 5; anyone finishing in the ten seconds after scores 2, then the round closes. Preselected from five people.</li>
                <li><b>Give up</b> ends your round with 0 so the others can go on. No hints.</li>
                ${RACE_MIX_RULE.en}
            </ul>`,
    }
  }
});
