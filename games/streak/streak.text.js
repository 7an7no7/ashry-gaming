/* streak: the words only this game's screens show, and its rules (Help, the
   first-play card). The build puts them into TRANSLATIONS and GAME_RULES (tools/game-text.cjs):
   read them as t.<key> and GAME_RULES[lang].<id>, as everywhere. */
gameText({
  translations: {
    ar: {
      race_unit_questions: "أسئلة",
      race_score_right: "{n} صح",
      streak_score: "صح",
      streak_time: "ثانية",
      streak_emoji_q: "الإيموجي دي معناها إيه؟",
      streak_over: "خلصت القلوب",
      streak_in_a_row: "إجابة صح",
    },
    en: {
      race_unit_questions: "questions",
      race_score_right: "{n} right",
      streak_score: "Right",
      streak_time: "Seconds",
      streak_emoji_q: "What do these emoji stand for?",
      streak_over: "Out of hearts",
      streak_in_a_row: "right answers",
    }
  },
  rules: {
    ar: {
      streak: `
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li>سؤال واحد و4 إجابات و<b>20 ثانية</b>.</li>
                <li>معاك <b>3 قلوب</b>: الغلط أو الوقت لو خلص بياخد قلب. اللعبة بتخلص مع آخر قلب.</li>
                <li>النتيجة عدد الإجابات الصح، وأحسن نتيجة بتتحفظ لكل نوع أسئلة: معلومات، إيموجي، أمثال أو مكس.</li>
            </ol>
            <p class="help-sub">📱 سباق ألغاز (في غرفة)</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>نفس اللغز للكل، وكل واحد بيحلّه على موبايله. الشاشة والتلفزيون بيوروا التقدم بس: الأسئلة اللي اتجاوبت.</li>
                <li><b>الكل يخلّص</b>: الجولة تخلص لما الكل يخلّص أو الوقت (3 دقايق). الحل 10 نقط + بونص للأسرع (+5، +4…).</li>
                <li><b>Fast 3</b>: أول 3 يخلّصوا ياخدوا 10 و7 و5، وبعدها 10 ثواني لأي حد يلحق ياخد 2، والجولة تقفل. بيتختار لوحده من 5 أشخاص.</li>
                <li><b>استسلم</b> بيخلّصك بصفر عشان الجولة تكمّل. الترتيب بعدد الإجابات الصح، وبعدين الأسرع؛ مفيش قلوب في السباق.</li>
                ${RACE_MIX_RULE.ar}
            </ul>`,
    },
    en: {
      streak: `
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li>One question, four answers, <b>20 seconds</b>.</li>
                <li>You have <b>3 hearts</b>: a wrong answer or running out of time costs one. The game ends with the last heart.</li>
                <li>Your score is the number of right answers, and the best is kept for each kind: trivia, emoji, sayings or a mix.</li>
            </ol>
            <p class="help-sub">📱 Puzzle race (in a room)</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>The same puzzle for everyone, each solving on their own phone. The screens show progress only: questions answered.</li>
                <li><b>Everyone finishes</b>: the round ends when everyone is done or the clock runs out (3 minutes). A solve is 10 points plus a bonus for the fastest (+5, +4…).</li>
                <li><b>Fast 3</b>: the first three to finish score 10, 7 and 5; anyone finishing in the ten seconds after scores 2, then the round closes. Preselected from five people.</li>
                <li><b>Give up</b> ends your round with 0 so the others can go on. Ranked by right answers, then by time; no hearts in a race.</li>
                ${RACE_MIX_RULE.en}
            </ul>`,
    }
  }
});
