/* buzzer: the words only this game's screens show, and its rules (Help, the
   first-play card). The build puts them into TRANSLATIONS and GAME_RULES (tools/game-text.cjs):
   read them as t.<key> and GAME_RULES[lang].<id>, as everywhere. */
gameText({
  translations: {
    ar: {
      bz_penalty: "خصم نقطة على الإجابة الغلط",
      bz_lobby_hint: "جهّز أسئلتك. كل واحد هيضغط الجرس من موبايله، وأنت تحكم صح ولا غلط.",
      bz_open: "الجرس مفتوح",
      bz_locked: "مقفول",
      bz_locked_hint: "استنى… المضيف بيقرأ السؤال",
      bz_press: "اضغط!",
      bz_pressed: "ضغطت!",
      bz_settling: "ثانية… بنشوف مين ضغط الأول",
      bz_you_are: "أنت رقم",
      bz_wait_turn: "لو اللي قبلك غلط، الدور عليك",
      bz_out_question: "جاوبت غلط في السؤال ده، استنى اللي بعده",
      bz_order: "ترتيب الضغط",
      bz_answering: "بيجاوب",
      bz_nobody: "محدش ضغط لسه",
      bz_host_controls: "تحكم المضيف",
      bz_reset_confirm: "نصفّر نقاط الكل ونبدأ من الأول؟",
      bz_undo: "رجّع",
      bz_lock_short: "اقفل",
      bz_arm_short: "افتح",
      bz_secs_short: "ث",
      qm_src_none_bz: "من غير أسئلة: المضيف بيسأل بصوته",
      bz_quiz_host_only: "الإجابة عندك إنت بس",
      bz_quiz_done: "خلصت أسئلة «{t}» 🎉",
      bz_adj_hint: "− و + جنب كل اسم: صلّح النقط بإيدك لو في حكم اتراجعتوا فيه.",
      bz_adj_plus: "نقطة زيادة لـ {name}",
      bz_adj_minus: "نقطة أقل لـ {name}",
    },
    en: {
      bz_penalty: "A wrong answer costs a point",
      bz_lobby_hint: "Bring your own questions. Everyone buzzes from their phone; you judge right or wrong.",
      bz_open: "Buzzers open",
      bz_locked: "Locked",
      bz_locked_hint: "Wait… the host is reading the question",
      bz_press: "Buzz!",
      bz_adj_hint: "− and + by each name: put the points right by hand if a call is taken back later.",
      bz_adj_plus: "One more point for {name}",
      bz_adj_minus: "One point less for {name}",
      bz_pressed: "Buzzed!",
      bz_settling: "One moment… checking who was first",
      bz_you_are: "You're number",
      bz_wait_turn: "If they get it wrong, you're next",
      bz_out_question: "You got this one wrong: wait for the next question",
      bz_order: "Buzz order",
      bz_answering: "answering",
      bz_nobody: "Nobody has buzzed yet",
      bz_host_controls: "Host controls",
      bz_reset_confirm: "Reset everyone's scores and start over?",
      bz_undo: "Undo",
      bz_lock_short: "Lock",
      bz_arm_short: "Open",
      bz_secs_short: "s",
      qm_src_none_bz: "No questions: the host asks out loud",
      bz_quiz_host_only: "Only you can see the answer",
      bz_quiz_done: "«{t}» is over 🎉",
    }
  },
  rules: {
    ar: {
      buzzer: `
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li>المضيف بيسأل بصوته أي سؤال، من كتاب أو من دماغه.</li>
                <li>كل واحد معاه <b>جرس</b> على موبايله. أول واحد يضغط يجاوب. الترتيب بيتحسب بلحظة الضغط على موبايلك مش بسرعة النت، فمحدش بيخسر عشان شبكته أبطأ.</li>
                <li>جرس كل واحد بلونه (نفس لون وشّه على التلفزيون)، وأول ضغطة في السؤال بتنوّر التلفزيون كله بلون اللي ضغط نص ثانية.</li>
                <li>المضيف يضغط <b>صح</b> (نقطة وسؤال جديد) أو <b>غلط</b> (الدور ينتقل للي بعده، وبتخصم نقطة لو المضيف شغّل الخصم).</li>
                <li><b>قفل الجرس</b> وأنت بتقرأ السؤال، وافتحه لما تخلص. على التلفزيون بيظهر مين ضغط الأول والترتيب والنقاط.</li>
                <li><b>عدّل النقط بإيدك</b>: عند المضيف − و + جنب كل اسم في الترتيب (على الموبايل والتلفزيون)، عشان حكم اتراجعتوا فيه من ساعة يتصلّح.</li>
                <li><b>✍️ بمسابقتك</b>: في الأوضة اختار مسابقة عملتها. السؤال وإجاباته الأربعة بيظهروا للكل، والإجابة الصح على موبايل المضيف بس، لحد ما حد يجاوب صح أو المضيف يدوس «اكشف الإجابة»، وبعدين «السؤال التالي».</li>
            </ol>`,
    },
    en: {
      buzzer: `
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li>The host asks questions out loud, from a book or from memory.</li>
                <li>Every phone is a <b>buzzer</b>. The first to press answers. The order is by the moment each phone was pressed, not by how fast its network is, so nobody loses on a slower connection.</li>
                <li>Each buzzer is its player's colour (the colour of their face on the TV), and the first press of a question floods the TV with that colour for half a second.</li>
                <li>The host presses <b>Right</b> (a point and a new question) or <b>Wrong</b> (the next in line gets a go, and a point is deducted if the host turned that on).</li>
                <li><b>Lock the buzzers</b> while you read the question, and open them when you're done. The TV shows who buzzed first, the order and the scores.</li>
                <li><b>Fix the points by hand</b>: the host has − and + by each name in the standings (phone and TV), so a call the table took back an hour ago can still be put right.</li>
                <li><b>✍️ With your quiz</b>: pick a quiz you made in the lobby. The question and its four answers show on every phone and the TV; the right one is on the host's phone only, until someone gets it or the host taps «Show the answer», then «Next question».</li>
            </ol>`,
    }
  }
});
