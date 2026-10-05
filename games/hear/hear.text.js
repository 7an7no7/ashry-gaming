/* hear: the words only this game's screens show, and its rules (Help, the
   first-play card). The build puts them into TRANSLATIONS and GAME_RULES (tools/game-text.cjs):
   read them as t.<key> and GAME_RULES[lang].<id>, as everywhere. */
gameText({
  translations: {
    ar: {
      hear_lobby_hint: "كل واحد يوصف مرة (أو مرتين) والباقي يرسم من غير ولا سؤال. التطبيق يصحّح كل رسمة بنسبة: الأقرب ٣ و٢ و١، والواصف نقطة لكل ٢٠٪ من متوسطهم، وأغرب رسمة +١.",
      hear_opt_kind: "الصور",
      hear_kind_mix: "مخلوط",
      hear_kind_shapes: "أشكال",
      hear_kind_things: "رسومات",
      hear_opt_level: "الصعوبة",
      hear_level_easy: "سهل",
      hear_level_mid: "متوسط",
      hear_level_hard: "صعب",
      hear_opt_seconds: "وقت الرسم",
      hear_opt_laps: "كل واحد يوصف",
      hear_laps_1: "مرة",
      hear_laps_2: "مرتين",
      hear_class: "حصة الرسم",
      hear_round: "الدور",
      hear_tools: "المقلمة",
      hear_model: "نموذج الأستاذ",
      hear_you_describe: "إنت اللي بتوصف 🎧 — محدش شايف الصورة غيرك",
      hear_hush: "🤫 ما تورّيش حد الصورة — اتكلم بس، من غير إشارة",
      hear_tip_shapes: "قول مثلًا: «مربع كبير في النص، ودايرة صغيرة في الركن فوق على الشمال»",
      hear_tip_things: "قول الأشكال وأماكنها: «مربع كبير تحت، فوقه مثلث سقف، وباب في النص»",
      hear_no_peek: "مش هتشوف الرسومات غير لما الوقت يخلص",
      hear_swap: "🔄 صورة تانية",
      hear_go: "🎙️ يلا، ابدأ الوصف",
      hear_done: "✋ خلّصت",
      hear_cut: "آخر ١٠ ثواني للرسم ⏳",
      hear_wait_look: "{name} بيبص على الصورة… جهّز قلمك ✏️",
      hear_rules_line: "اسمع وارسم — ممنوع الأسئلة، والواصف ممنوع يشاور",
      hear_no_ask: "ارسم اللي سامعه — ممنوع تسأل 🔇",
      hear_hand: "📒 سلّمت الكراسة",
      hear_handed: "سلّمت ✅ — مستنيين الباقي",
      hear_handed_n: "سلّموا:",
      hear_pencils_down: "الأقلام على الترابيزة! ✋",
      hear_watching: "بتتفرج على الدور ده — هتلعب في اللعبة الجاية",
      hear_watch_draw: "الكل بيرسم دلوقتي…",
      hear_skip: "عدّي الواصف ده",
      hear_close_draw: "خلّص الرسم",
      hear_to_vote: "🤪 يلا على أغرب رسمة",
      hear_close_vote: "اقفل التصويت",
      hear_grading: "الأستاذ بيصحّح بالقلم الأحمر 🖍️",
      hear_it_was: "الصورة كانت: {name}",
      hear_your_page: "رسمتك، والنموذج فوقها بالأخضر الباهت",
      hear_try_again: "حاول تاني 😅",
      hear_desc_line: "الواصف {name}: متوسط القرب {avg}٪ ← +{n}",
      hear_weird_q: "أغرب رسمة؟ 🤪",
      hear_weird_hint: "دوس على أغرب رسمة — مش رسمتك",
      hear_vote_changed: "صوتك وصل — تقدر تغيّره لحد ما التصويت يقفل",
      hear_vote_wait: "مستنيين الأصوات…",
      hear_weird_mine: "رسمتك",
      hear_voted_n: "صوّتوا:",
      hear_weird_won: "🤪 أغرب رسمة +١",
      hear_weird_is: "🤪 أغرب رسمة: {name} +١",
      hear_weird_none: "محدش خد صوتين — مفيش أغرب رسمة المرة دي",
      hear_round_pts: "نقط الدور",
      hear_total: "المجموع",
      hear_name_col: "الاسم",
      hear_sheet: "كشف الدرجات 📋",
      hear_next: "الدور اللي بعده ✏️",
      hear_final: "النتيجة النهائية 🏆",
      hear_over_title: "الحصة خلصت! 🔔",
      hear_notebook: "كراسة الرسم",
      hear_cover_handed: "سلّم ✅",
      hear_tv_ready: "الدور على {name} يوصف 🎧",
      hear_tv_ready_sub: "والباقي يرسم في الكراسة — من غير ولا سؤال",
      hear_tv_ready_cap: "الصورة على موبايل {name} بس",
      hear_tv_rules: "🔇 ممنوع الأسئلة · ✋ الواصف ما يشاورش",
      hear_tv_draw: "{name} بيوصف… 🎧",
      hear_tv_draw_sub: "الكل بيرسم… الرسومات مستخبية لحد ما الوقت يخلص ✏️",
      hear_tv_vote_sub: "كل واحد يصوّت من موبايله، مش لرسمته",
    },
    en: {
      hear_lobby_hint: "Everyone describes once (or twice) and the rest draw, no questions asked. The app marks every drawing with a %: the closest get 3, 2 and 1, the describer a point for every 20% of their average, and the weirdest drawing +1.",
      hear_opt_kind: "Pictures",
      hear_kind_mix: "Mixed",
      hear_kind_shapes: "Shapes",
      hear_kind_things: "Drawings",
      hear_opt_level: "Level",
      hear_level_easy: "Easy",
      hear_level_mid: "Medium",
      hear_level_hard: "Hard",
      hear_opt_seconds: "Drawing time",
      hear_opt_laps: "Everyone describes",
      hear_laps_1: "Once",
      hear_laps_2: "Twice",
      hear_class: "Art class",
      hear_round: "Round",
      hear_tools: "Pencil case",
      hear_model: "The teacher's model",
      hear_you_describe: "You describe 🎧 — nobody else sees the picture",
      hear_hush: "🤫 Don't show anyone — talk only, no pointing",
      hear_tip_shapes: "Say e.g. “a big square in the middle, a small circle top left”",
      hear_tip_things: "Say the shapes and where: “a big square at the bottom, a roof triangle on it, a door in the middle”",
      hear_no_peek: "You see the drawings only when time is up",
      hear_swap: "🔄 Another picture",
      hear_go: "🎙️ Go, start describing",
      hear_done: "✋ I'm done",
      hear_cut: "Last 10 seconds to draw ⏳",
      hear_wait_look: "{name} is looking at the picture… pencil ready ✏️",
      hear_rules_line: "Listen and draw — no questions, and the describer can't point",
      hear_no_ask: "Draw what you hear — no questions 🔇",
      hear_hand: "📒 Hand in my page",
      hear_handed: "Handed in ✅ — waiting for the rest",
      hear_handed_n: "Handed in:",
      hear_pencils_down: "Pencils down! ✋",
      hear_watching: "You're watching this round — you play the next game",
      hear_watch_draw: "Everyone is drawing now…",
      hear_skip: "Skip this describer",
      hear_close_draw: "End the drawing",
      hear_to_vote: "🤪 On to the weirdest drawing",
      hear_close_vote: "Close the vote",
      hear_grading: "The teacher marks in red pen 🖍️",
      hear_it_was: "The picture was: {name}",
      hear_your_page: "Your page, with the model over it in faint green",
      hear_try_again: "Try again 😅",
      hear_desc_line: "Describer {name}: average {avg}% → +{n}",
      hear_weird_q: "The weirdest drawing? 🤪",
      hear_weird_hint: "Tap the weirdest drawing — not your own",
      hear_vote_changed: "Your vote is in — you can change it until the vote closes",
      hear_vote_wait: "Waiting for the votes…",
      hear_weird_mine: "Yours",
      hear_voted_n: "Voted:",
      hear_weird_won: "🤪 Weirdest +1",
      hear_weird_is: "🤪 Weirdest drawing: {name} +1",
      hear_weird_none: "Nobody got two votes — no weirdest drawing this time",
      hear_round_pts: "This round",
      hear_total: "Total",
      hear_name_col: "Name",
      hear_sheet: "The mark sheet 📋",
      hear_next: "Next round ✏️",
      hear_final: "Final result 🏆",
      hear_over_title: "Class is over! 🔔",
      hear_notebook: "Exercise book",
      hear_cover_handed: "Handed in ✅",
      hear_tv_ready: "{name} describes 🎧",
      hear_tv_ready_sub: "and everyone else draws — no questions asked",
      hear_tv_ready_cap: "The picture is on {name}'s phone only",
      hear_tv_rules: "🔇 No questions · ✋ No pointing",
      hear_tv_draw: "{name} is describing… 🎧",
      hear_tv_draw_sub: "Everyone is drawing… the drawings stay hidden until time is up ✏️",
      hear_tv_vote_sub: "Everyone votes from their phone, not for their own",
    }
  },
  rules: {
    ar: {
      hear: `
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li>كل دور واحد <b>يوصف</b> والباقي <b>يرسموا</b>. اللي بيوصف بس هو اللي شايف الصورة على موبايله: أشكال على شبكة، أو رسمة بسيطة من أشكال (بيت، عربية، وش، شجرة…)، والتطبيق بيعمل صورة جديدة كل مرة.</li>
                <li>الواصف يقدر يطلب <b>صورة تانية</b> مرتين قبل ما يبدأ، وبعدين يدوس «يلا» والوقت يبدأ (٩٠ ثانية، أو اللي المضيف اختاره).</li>
                <li>يوصف <b>بالكلام بس</b>: من غير ما يشاور ولا يورّي الصورة، وما يشوفش الرسومات وهي بتترسم. والرسامين <b>ممنوع يسألوا</b>.</li>
                <li>كل واحد يرسم على موبايله بالقلم والأستيكة، ويقدر يرجع خطوة أو يمسح الكل، ويدوس «سلّمت الكراسة» لما يخلص. لو الواصف داس «خلّصت» الرسامين ياخدوا <b>١٠ ثواني</b> بس كمان.</li>
                <li>التطبيق <b>يصحّح كل رسمة بنسبة</b>: قد إيه هي شبه الصورة في الأشكال وأماكنها. الرسمة التقريبية اللي في مكانها تاخد نسبة كويسة، والفاضية صفر، والشخبطة على الصفحة كلها نسبتها قليلة.</li>
                <li>بعدها الكل يصوّت على <b>أغرب رسمة</b> (مش رسمته).</li>
            </ol>
            <p class="help-sub">🏆 النقط</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>أقرب ٣ رسومات للصورة: <b>٣ و٢ و١</b> (النسبة نفسها تاخد نفس النقط).</li>
                <li>الواصف: <b>نقطة لكل ٢٠٪</b> من متوسط نسب الرسامين، لحد ٣ نقط — الوصف الحلو بيكسّب.</li>
                <li>كل رسمة نسبتها <b>٥٠٪ أو أكتر</b>: <b>+١</b>، حتى لو مش من التلاتة الأوائل.</li>
                <li>📈 <b>اتحسنت</b>: <b>+١</b> لو نسبتك أعلى من نسبتك في آخر رسمة رسمتها (من الجولة التانية). الاتنين ممكن ييجوا مع بعض.</li>
                <li>أغرب رسمة: <b>+١</b> للي خد أكتر أصوات، لو صوتين على الأقل (التعادل الاتنين ياخدوا).</li>
                <li>كل واحد يوصف مرة (أو مرتين لو المضيف اختار)، وبعدها النتيجة النهائية.</li>
            </ul>
            <p class="help-sub">📱 كل واحد من موبايله</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>من 3 لـ12 لاعب. المضيف يختار الصور (أشكال، رسومات، أو مخلوط)، الصعوبة، ووقت الرسم.</li>
                <li>لو الواصف موبايله نام المضيف يعدّيه، ولو حد اتأخر المضيف يخلّص الرسم. اللي يدخل في النص يتفرج ويلعب اللعبة الجاية.</li>
            </ul>
            <p class="help-sub">📺 على التلفزيون (اختياري)</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>فصل: السبورة في النص والكراريس حواليها. الرسومات مستخبية لحد الآخر، وبعدها الأستاذ يصحّح كل كراسة بدايرة حمرا فيها النسبة ونجوم للتلاتة الأوائل.</li>
            </ul>`,
    },
    en: {
      hear: `
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li>Each round one player <b>describes</b> and everyone else <b>draws</b>. Only the describer's phone shows the picture: shapes on a grid, or a simple drawing made of shapes (a house, a car, a face, a tree…), and the app makes a new one every time.</li>
                <li>The describer may ask for <b>another picture</b> twice before starting, then taps "Go" and the clock starts (90 seconds, or what the host chose).</li>
                <li>They describe <b>by talking only</b>: no pointing, no showing the picture, and they don't see the drawings while they are made. The drawers <b>can't ask questions</b>.</li>
                <li>Everyone draws on their phone with the pencil and the eraser, can undo or clear, and taps "Hand in my page" when done. If the describer taps "I'm done", the drawers get only <b>10 more seconds</b>.</li>
                <li>The app <b>marks every drawing with a %</b>: how close it is to the picture in its shapes and where they are. A rough drawing in the right place scores well, a blank page 0, and scribbling all over the page scores low.</li>
                <li>Then everyone votes for the <b>weirdest drawing</b> (not their own).</li>
            </ol>
            <p class="help-sub">🏆 Points</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>The three drawings closest to the picture: <b>3, 2 and 1</b> (the same % gets the same points).</li>
                <li>The describer: <b>a point for every 20%</b> of the drawers' average, up to 3 — describing well pays.</li>
                <li>Every drawing at <b>50% or more</b>: <b>+1</b>, even outside the first three.</li>
                <li>📈 <b>Improved</b>: <b>+1</b> when your % beats your own from the last drawing you made (from the second round on). One drawing can earn both.</li>
                <li>The weirdest drawing: <b>+1</b> to the most votes, if at least two (a tie: both).</li>
                <li>Everyone describes once (or twice if the host chose), then the final result.</li>
            </ul>
            <p class="help-sub">📱 Everyone on their own phone</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>3 to 12 players. The host picks the pictures (shapes, drawings or mixed), the level and the drawing time.</li>
                <li>If the describer's phone falls asleep the host can skip them, and the host can end the drawing early. Someone who joins midway watches and plays the next game.</li>
            </ul>
            <p class="help-sub">📺 On the TV (optional)</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>A classroom: the board in the middle and the exercise books round it. The drawings stay hidden to the end, then the teacher marks every book with a red circle and its %, and stars for the first three.</li>
            </ul>`,
    }
  }
});
