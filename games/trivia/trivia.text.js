/* trivia: the words only this game's screens show, and its rules (Help, the
   first-play card). The build puts them into TRANSLATIONS and GAME_RULES (tools/game-text.cjs):
   read them as t.<key> and GAME_RULES[lang].<id>, as everywhere. */
gameText({
  translations: {
    ar: {
      trivia_q_of: "السؤال",
      trivia_hint: "الإجابة الصح بـ10 نقط، وأسرع إجابات صح بتاخد لحد 5 نقط زيادة.",
      trivia_count: "عدد الأسئلة",
      trivia_cat: "الفئة",
      trivia_cat_all: "كله",
      trivia_cat_egypt: "مصر",
      trivia_cat_geography: "جغرافيا",
      trivia_cat_science: "علوم وطبيعة",
      trivia_cat_sport: "رياضة",
      trivia_cat_film: "فن وسينما",
      trivia_cat_general: "معلومات عامة",
      trivia_rank: "الأسرع رقم {n}",
      tb_show_answer: "إظهار الإجابة",
      tb_back: "رجوع",
      tb_points_to: "النقاط لمين؟",
      tb_nobody: "محدش جاوب صح",
      tb_next_round: "الجولة التالية",
      tb_skip_confirm: "لسه فيه أسئلة ما اتلعبتش في الجولة دي. نكمل؟",
      tb_final: "النتيجة",
      tb_time_up: "الوقت خلص!",
      tb_timer_pause: "إيقاف المؤقت",
      tb_timer_resume: "كمّل المؤقت",
      trivia_locked: "إجابتك اتسجلت",
      trivia_answered: "جاوبوا",
      trivia_no_answer: "⏰ ماجاوبتش",
      trivia_wrong: "❌ إجابة غلط",
      tb_unfinished: "لعبة لسه ما خلصتش",
      tb_new_confirm: "فيه لعبة لسه ما خلصتش. تبدأ لعبة جديدة وتسيبها؟",
      tb_undo_award: "رجّع آخر سؤال",
      tb_steal_band: "فرصة للفريق التاني",
      tb_steal_points: "لو جاوب صح: {pts} نقطة",
      tb_answering: "بيجاوب:",
      tb_right: "صح",
      tb_wrong: "غلط",
      tb_steal_missed: "محدش خد النقط",
      tb_turn: "الدور",
      tb_double_slam: "كارت دبل!",
      tb_double_sub: "النقط متضاعفة ×2",
      qm_answer_net: "مقدرناش نجيب الإجابة، اتأكد من النت",
      qm_src_app: "أسئلة التطبيق",
      qm_src_hint_room: "مسابقتك بتتلعب كلها بترتيبها، والإجابات بتتلخبط في كل سؤال.",
      qm_src_hint_board: "لوحة مسابقتك: الأسئلة بترتيبها، 5 في كل عمود من 100 لـ 500.",
      qm_col: "{t} {n}",
    },
    en: {
      trivia_q_of: "Question",
      trivia_hint: "A right answer is 10 points, and the fastest right answers get up to 5 more.",
      trivia_count: "Number of questions",
      trivia_cat: "Category",
      trivia_cat_all: "Everything",
      trivia_cat_egypt: "Egypt",
      trivia_cat_geography: "Geography",
      trivia_cat_science: "Science & nature",
      trivia_cat_sport: "Sport",
      trivia_cat_film: "Arts & film",
      trivia_cat_general: "General knowledge",
      trivia_rank: "fastest #{n}",
      tb_show_answer: "Show answer",
      tb_back: "Back",
      tb_points_to: "Who gets the points?",
      tb_nobody: "Nobody got it",
      tb_next_round: "Next round",
      tb_skip_confirm: "Some questions in this round haven't been played. Carry on?",
      tb_final: "Final score",
      tb_time_up: "Time's up!",
      tb_timer_pause: "Pause the timer",
      tb_timer_resume: "Resume the timer",
      trivia_locked: "Answer locked in",
      trivia_answered: "answered",
      trivia_no_answer: "⏰ No answer",
      trivia_wrong: "❌ Wrong answer",
      tb_unfinished: "Unfinished game",
      tb_new_confirm: "A game isn't finished. Start a new one?",
      tb_undo_award: "Undo the last question",
      tb_steal_band: "The other team's chance",
      tb_steal_points: "If they get it right: {pts} points",
      tb_answering: "Answering:",
      tb_right: "Right",
      tb_wrong: "Wrong",
      tb_steal_missed: "Nobody scores",
      tb_turn: "Up",
      tb_double_slam: "Double card!",
      tb_double_sub: "Points ×2",
      qm_answer_net: "Couldn’t get the answer - check the connection",
      qm_src_app: "The app's questions",
      qm_src_hint_room: "Your quiz is played whole, in its order; the answers are shuffled every question.",
      qm_src_hint_board: "Your quiz's board: the questions in order, 5 a column from 100 to 500.",
      qm_col: "{t} {n}",
    }
  },
  rules: {
    ar: {
      trivia: `
            <p class="help-sub">📱 كل واحد من موبايله</p>
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li>المضيف يختار عدد الأسئلة (5 لـ 20) والفئة: كله، مصر، جغرافيا، علوم وطبيعة، رياضة، فن وسينما، أو معلومات عامة (لو الفئة خلصت، الباقي بييجي من كله). والكل يجاوب في نفس اللحظة. 15 ثانية لكل سؤال.</li>
                <li><b>✍️ بمسابقتك</b>: في الأوضة اختار من «الأسئلة» مسابقة عملتها (الأدوات ← اعمل مسابقتك). بتتلعب كلها بترتيبها، والإجابات بتتلخبط في كل سؤال. وعلى <b>دوري المعرفة</b> كمان: أسئلتك بترتيبها، 5 في كل صف من 100 لـ 500.</li>
                <li>الإجابة الصح = <b>10 نقاط</b>، وأسرع إجابات صح بتاخد زيادة: الأولى +5، التانية +4… لحد الخامسة +1.</li>
            </ol>
            <p class="help-sub">⏭️ التالي لوحده</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>اختيار للمضيف في الأوضة، <b>مقفول من الأول</b>: بعد كل نتيجة عدّاد صغير «الجولة الجاية خلال…»، واللي بعدها تيجي لوحدها. المضيف يدوس «التالي» بدري، أو <b>«⏸ استنى»</b> يوقف العد للجولة دي. ولو للعبة آخر، آخر جولة بتروح للنتيجة النهائية.</li>
            </ul>
            <p class="help-sub">📺 دوري المعرفة (فريقين على شاشة واحدة)</p>
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li>فريقين ومقدم واحد. كل جولة 5 فئات، وفي كل فئة أسئلة من 100 لـ 500 نقطة: الأعلى أصعب.</li>
                <li>الفريق يختار فئة ونقاط، المقدم يقرأ السؤال ويظهر الإجابة ويدي النقاط.</li>
                <li>مؤقت اختياري لكل سؤال: اضغط على العداد عشان توقفه، ولما يخلص الإجابة تظهر لوحدها. أزرار + و − لتصحيح النقاط.</li>
                <li><b>السرقة</b> (مفتوحة من الأول): لو الفريق اللي عليه الدور غلط أو وقته خلص، الإجابة ما بتظهرش، والفريق التاني ياخد <b>فرصة واحدة</b> بنص الوقت. صح؟ ياخد نقط السؤال كلها. غلط أو الوقت خلص؟ الإجابة تظهر ومحدش ياخد حاجة. الدور بيلف عادي بعد كل سؤال.</li>
                <li>المقدم عنده <b>✅ صح</b> و<b>❌ غلط</b> في كل مرحلة. «👁️ إظهار الإجابة» قبل السرقة بيلغي السرقة ويخليه يدي النقط لأي فريق.</li>
                <li><b>🎯 كارت دبل</b> (مفتوح من الأول): في كل لوحة كارت واحد مستخبي، مش من الـ 100، نقطه <b>متضاعفة</b>. محدش يعرف مكانه لحد ما يتفتح. لو اتسرق، الفريق التاني ياخد الدبل. بعد ما يتلعب بيفضل عليه <b>×2</b> صغيرة.</li>
                <li>اديت النقط غلط؟ <b>رجّع آخر سؤال</b>. ولو سبت لعبة لسه ما خلصتش، تقدر تكمّلها من شاشة الإعداد.</li>
            </ol>`,
    },
    en: {
      trivia: `
            <p class="help-sub">📱 Everyone on their own phone</p>
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li>The host picks how many questions (5 to 20) and the category: everything, Egypt, geography, science &amp; nature, sport, arts &amp; film, or general knowledge (a category that runs short is topped up from everything). Everyone answers at once. 15 seconds a question.</li>
                <li><b>✍️ With your quiz</b>: in the room pick a quiz you made from «The questions» (Tools → Make your quiz). It is played whole, in its order, the answers shuffled every question. On the <b>team board</b> too: your questions in order, 5 a row from 100 to 500.</li>
                <li>A right answer is <b>10 points</b>, and the fastest right answers get more: the first +5, the second +4… down to the fifth +1.</li>
            </ol>
            <p class="help-sub">⏭️ Next by itself</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>The host's choice in the lobby, <b>off to start</b>: after each result a small count «Next round in…», then the next one comes by itself. The host can press «Next» sooner, or <b>«⏸ Wait»</b> to stop the count for that round. In a game with a last round, that one goes to the final result.</li>
            </ul>
            <p class="help-sub">📺 The team board (two teams on one screen)</p>
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li>Two teams and one host. Each round has 5 categories with questions from 100 to 500 points: the higher, the harder.</li>
                <li>A team picks a category and a value; the host reads the question, shows the answer and awards the points.</li>
                <li>An optional clock per question: tap it to pause, and when it runs out the answer shows by itself. + and − correct the scores.</li>
                <li><b>The steal</b> (on by default): if the team whose turn it is misses or runs out of time, the answer stays hidden and the other team gets <b>one try</b> on half the time. Right? They take the question's full points. Wrong or out of time? The answer is shown and nobody scores. The turn passes as usual after every question.</li>
                <li>The host has <b>✅ Right</b> and <b>❌ Wrong</b> at each stage. «👁️ Show answer» before the steal skips it and lets the host give the points to either team.</li>
                <li><b>🎯 Double card</b> (on by default): every board hides one card, never a 100, worth <b>twice</b> its points. Nobody knows where it is until it is opened. Stolen, the other team takes the double. Once played it keeps a small <b>×2</b>.</li>
                <li>Gave the points wrongly? <b>Undo the last question</b>. Left a game unfinished? Carry on from the setup screen.</li>
            </ol>`,
    }
  }
});
