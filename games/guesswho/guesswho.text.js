/* guesswho: the words only this game's screens show, and its rules (Help, the
   first-play card). The build puts them into TRANSLATIONS and GAME_RULES (tools/game-text.cjs):
   read them as t.<key> and GAME_RULES[lang].<id>, as everywhere. */
gameText({
  translations: {
    ar: {
      gw_lobby_size: "عدد الوشوش",
      gw_lobby_pick: "الوش السري",
      gw_pick_random: "عشوائي",
      gw_pick_choose: "كل واحد يختار",
      gw_lobby_wrong: "لو خمّن غلط",
      gw_wrong_lose: "يخسر اللعبة",
      gw_wrong_turn: "يخسر الدور",
      gw_lobby_clock: "وقت الدور",
      gw_lobby_hint: "اتنين بيلعبوا والباقي بيتفرج، واللي يكسب يفضل قاعد. الأسئلة من دماغك: بصوتك أو تكتبها.",
      gw_ask_hint: "سؤال أيوه ولا لأ: نضارة؟ بيضحك؟ طرحة؟",
      gw_hold_hint: "دوس مطوّل على أي وش تشوفه كبير، وكمّل ضاغط تحط عليه «؟»",
      gw_loud_log: "سؤال بالصوت",
      gw_left: "باقي {n}",
      gw_your_face: "وشّك",
      gw_your_face_hint: "ده الوش السري بتاعك قدام {name}",
      gw_loud: "🗣️ بصوتك",
      gw_guess: "🎯 خمّن",
      gw_back: "رجوع",
      gw_guess_pick: "دوس على الوش اللي عايز تخمّنه",
      gw_guess_sure: "متأكد إنه {name}؟",
      gw_guess_confirm: "خمّن {name}",
      gw_guess_warn_lose: "لو غلط تخسر اللعبة.",
      gw_guess_warn_turn: "لو غلط تخسر الدور.",
      gw_wait_answer: "مستنيين إجابة {name}…",
      gw_flip_title: "وقّع الوشوش بإيدك",
      gw_flip_now: "وقّع الوشوش اللي الإجابة شالتها، وبعدين خلّص دورك.",
      gw_done: "✅ خلص دوري",
      gw_yes: "أيوه",
      gw_no: "لأ",
      gw_your_turn: "دورك: اسأل ولا خمّن",
      gw_last_one: "فاضل وش واحد: خمّن!",
      gw_turn_of: "دور {name}",
      gw_flip_any: "تقدر توقّع وش أو ترجّعه في أي وقت: دوس عليه.",
      gw_undo: "غلطت",
      gw_undo_hint: "جاوبت «{a}». دوست غلط؟ رجّعها قبل ما {name} يخلّص.",
      gw_undone: "{name} رجّع إجابته",
      gw_first_q: "لسه محدش سأل.",
      gw_asked_list: "سؤال {name}: {q}",
      gw_asked_loud: "سؤال بالصوت من {name}",
      gw_guessed_wrong: "تخمين {name}: {face}، وطلع غلط",
      gw_skipped: "دور {name} عدّى من غير سؤال",
      gw_skipped_answer: "{name} ما ردّش، والدور عدّى",
      gw_skipped_flip: "دور {name} عدّى قبل ما ينزّل الوشوش",
      gw_pick_title: "اختار وشّك السري قدام {name}",
      gw_pick_confirm: "ده وشّي: {name}",
      gw_pick_wait: "مستنيين اختيار {name}…",
      gw_pick_all: "بيختاروا الوشوش…",
      gw_board_of: "لوحة {name}",
      gw_won_guess: "🎯 الوش اتعرف! مبروك {name}",
      gw_won_wrong: "تخمين {name} طلع غلط",
      gw_face_was: "وش {name}",
      gw_history: "الأسئلة اللي اتسألت",
      gw_thinking: "الإجابة عند {name}",
      gw_typed: "✍️ اكتب",
      gw_typed_title: "اكتب سؤال لـ{name} إجابته أيوه أو لأ",
      gw_typed_ph: "مثلاً: لابس حاجة زرقا؟",
      gw_typed_send: "ابعت",
      gw_loud_asked: "🗣️ بيسألك بصوته: اسمعه، بص على وشّك وجاوب",
      gw_q_from: "سؤال من {name}",
      gw_guess_is: "{name}: هو {face}؟",
      gw_guess_right: "صح! 🎯",
      gw_guess_wrong: "لأ! ❌",
      gw_play_for: "عدّي الدور",
    },
    en: {
      gw_lobby_size: "Faces on the board",
      gw_lobby_pick: "The secret face",
      gw_pick_random: "Dealt at random",
      gw_pick_choose: "Each picks",
      gw_lobby_wrong: "A wrong guess",
      gw_wrong_lose: "Loses the game",
      gw_wrong_turn: "Loses the turn",
      gw_lobby_clock: "Turn clock",
      gw_lobby_hint: "Two play, the rest watch, and the winner stays on. You think of the questions: out loud or typed.",
      gw_ask_hint: "A yes-or-no question: Glasses? Smiling? A hijab?",
      gw_hold_hint: "Hold any face to see it big; keep holding to mark it «?»",
      gw_loud_log: "asked out loud",
      gw_left: "{n} left",
      gw_your_face: "Your face",
      gw_your_face_hint: "Your secret face against {name}",
      gw_loud: "🗣️ Out loud",
      gw_guess: "🎯 Guess",
      gw_back: "Back",
      gw_guess_pick: "Tap the face you want to guess",
      gw_guess_sure: "Sure it's {name}?",
      gw_guess_confirm: "Guess {name}",
      gw_guess_warn_lose: "Wrong, and you lose the game.",
      gw_guess_warn_turn: "Wrong, and you lose the turn.",
      gw_wait_answer: "Waiting for {name} to answer…",
      gw_flip_title: "Flip the faces by hand",
      gw_flip_now: "Put down the faces the answer rules out, then end your turn.",
      gw_done: "✅ End my turn",
      gw_yes: "Yes",
      gw_no: "No",
      gw_your_turn: "Your turn: ask or guess",
      gw_last_one: "One face left: guess!",
      gw_turn_of: "{name}'s turn",
      gw_flip_any: "You can put a face down or back up any time: tap it.",
      gw_undo: "Oops, wrong one",
      gw_undo_hint: "You answered \"{a}\". Tapped the wrong one? Take it back before {name} is done.",
      gw_undone: "{name} took the answer back",
      gw_first_q: "Nobody has asked yet.",
      gw_asked_list: "{name} asked: {q}",
      gw_asked_loud: "{name} asked out loud",
      gw_guessed_wrong: "{name} guessed {face}: wrong",
      gw_skipped: "{name}'s turn passed with no question",
      gw_skipped_answer: "{name} didn't answer, so the turn passed",
      gw_skipped_flip: "{name}'s turn passed before the faces went down",
      gw_pick_title: "Pick your secret face against {name}",
      gw_pick_confirm: "That's mine: {name}",
      gw_pick_wait: "Waiting for {name} to pick…",
      gw_pick_all: "Picking the faces…",
      gw_board_of: "{name}'s board",
      gw_won_guess: "🎯 {name} found the face!",
      gw_won_wrong: "{name} guessed wrong",
      gw_face_was: "{name}'s face",
      gw_history: "The questions so far",
      gw_thinking: "{name} is thinking",
      gw_typed: "✍️ Type",
      gw_typed_title: "Type {name} a yes-or-no question",
      gw_typed_ph: "e.g. Wearing something blue?",
      gw_typed_send: "Send",
      gw_loud_asked: "🗣️ Asking out loud: listen, look at your face, answer",
      gw_q_from: "{name} asks",
      gw_guess_is: "{name}: is it {face}?",
      gw_guess_right: "Right! 🎯",
      gw_guess_wrong: "No! ❌",
      gw_play_for: "Pass the turn",
    }
  },
  rules: {
    ar: {
      guesswho: `
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li>اتنين بيلعبوا، وكل واحد معاه نفس اللوحة: وشوش مرسومة بأساميها. كل واحد عنده <b>وش سري</b> على موبايله، والتاني لازم يلاقيه.</li>
                <li>في دورك يا <b>تسأل سؤال</b> جوابه أيوه أو لأ، يا <b>تخمّن</b> الوش. مش الاتنين.</li>
                <li><b>السؤال من دماغك</b>: <b>بصوتك</b> أو <b>تكتبه</b>. مفيش أسئلة جاهزة. بص على الوشوش: طرحة؟ كاب؟ سماعات؟ نضارة شمس؟ بيضحك؟ نمش؟ شامة؟ كرافتة؟ لابس حاجة حمرا؟ تيشيرت مقلّم؟</li>
                <li>التاني يبص على وشّه السري ويدوس <b>أيوه</b> أو <b>لأ</b>. الموبايل مايعرفش السؤال، فالإجابة زي ما هو قالها. دست غلط؟ <b>«↶ غلطت»</b> بترجّعها طول ما التاني لسه بيوقّع الوشوش، والوشوش اللي وقّعها عليها بتقوم تاني.</li>
                <li>بعد الإجابة <b>توقّع الوشوش بإيدك</b> (دوس على كل وش) وتدوس خلصت. تقدر توقّع وش أو ترجّعه في أي وقت.</li>
                <li><b>دوس مطوّل</b> على أي وش (أو على وشّك) تشوفه كبير بكل تفاصيله. <b>كمّل ضاغط</b> على وش في لوحتك يتحط عليه <b>«؟»</b>: علامة ليك انت بس لما الإجابة مش أكيدة، والوش لسه واقف.</li>
                <li>التخمين: <b>"هو كريم؟"</b> وطبلة، وبعدين صح ولا غلط.</li>
                <li>التخمين الصح بيكسب اللعبة. <b>التخمين الغلط بيخسّرها</b> (أو الدور بس، لو المضيف غيّرها).</li>
                <li>اللي يكسب <b>يفضل قاعد</b>، واللي عليه الدور في الطابور يقعد قصاده ويبدأ هو.</li>
            </ol>
            <p class="help-sub">⚙️ المضيف بيختار</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>16 أو 24 أو 30 وش، والوش السري عشوائي أو كل واحد يختاره، والتخمين الغلط يخسّر اللعبة أو الدور، ووقت للدور (مفيش، 30 أو 60 ثانية: لما يخلص الدور بيعدّي، والسؤال اللي ماتردّش عليه بيروح).</li>
                <li>محتاجين اتنين على الأقل: مفيش كمبيوتر في اللعبة دي، لأنه مش بيسمع ولا بيقرا.</li>
            </ul>
            <p class="help-sub">👥 فريق ضد فريق (من 4)</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>كل واحد يختار فريقه من موبايله. كل فريق ليه <b>وش سري ولوحة واحدة</b>: أي حد فيه يسأل ويوقّع، ويجاوب (أول دوسة بتتحسب).</li>
                <li>التخمين: واحد يختار الوش وتاني من فريقه يدوس <b>«متفقين»</b>. الفريق الكسبان كله أول.</li>
            </ul>
            <p class="help-sub">📺 على التلفزيون</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>اللوحتين قدام الكل، والسؤال والإجابة في النص. الوش السري مش بيبان غير في الآخر.</li>
                <li>👑 في الآخر بتتعاد أسئلة الكسبان، وكل سؤال وقّع كام وش، وأكتر سؤال وقّع ياخد <b>«أحسن سؤال»</b>.</li>
            </ul>
            ${TOUR_RULES_HELP.ar}`,
    },
    en: {
      guesswho: `
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li>Two play, each with the same board of drawn, named faces. Each has a <b>secret face</b> on their phone, and the other must find it.</li>
                <li>On your turn, either <b>ask a question</b> with a yes or no answer, or <b>guess</b> the face. Never both.</li>
                <li><b>You think of the question</b>: ask it <b>out loud</b> or <b>type it</b>. There is no list. Look at the faces: a hijab? a cap? headphones? sunglasses? smiling? freckles? a mole? a tie? wearing red? a striped shirt?</li>
                <li>The other looks at their secret face and taps <b>yes</b> or <b>no</b>. The phone doesn't know the question, so the answer is theirs. Tapped the wrong one? <b>"↶ Oops, wrong one"</b> takes it back while the other is still putting faces down, and the faces they put down on it stand up again.</li>
                <li>After the answer, <b>put the faces down by hand</b> (tap each one) and tap done. You can put a face down or back up any time.</li>
                <li><b>Hold</b> any face (or your own) to see it big, every detail. <b>Keep holding</b> a face on your board to stick a <b>«?»</b> on it: your own note for an answer you're not sure of; the face still counts as up.</li>
                <li>A guess: <b>"is it Karim?"</b>, a drum roll, then right or wrong.</li>
                <li>A right guess wins the game. <b>A wrong guess loses it</b> (or only the turn, if the host changed that).</li>
                <li>The winner <b>stays on</b>; the next in line sits down against them and moves first.</li>
            </ol>
            <p class="help-sub">⚙️ The host picks</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>16, 24 or 30 faces; a secret face dealt at random or picked by each; a wrong guess losing the game or the turn; a turn clock (off, 30 or 60 seconds: when it runs out the turn passes, and a question nobody answered is dropped).</li>
                <li>It needs two people: there are no computer players in this game, since they can't hear or read.</li>
            </ul>
            <p class="help-sub">👥 Team against team (from 4)</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>Everyone picks a side on their phone. Each team has <b>one secret face and one board</b>: anyone on it asks, flips and answers (the first tap counts).</li>
                <li>A guess: one picks the face, a teammate taps <b>"Agreed"</b>. The whole winning team comes first.</li>
            </ul>
            <p class="help-sub">📺 On the TV</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>Both boards in front of everyone, the question and its answer between them. The secret faces show only at the end.</li>
                <li>👑 At the end the winner's questions are replayed with how many faces each put down, and the one that put down the most is crowned <b>«Best question»</b>.</li>
            </ul>
            ${TOUR_RULES_HELP.en}`,
    }
  }
});
