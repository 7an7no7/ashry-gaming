/* spy: the words only this game's screens show, and its rules (Help, the
   first-play card). The build puts them into TRANSLATIONS and GAME_RULES (tools/game-text.cjs):
   read them as t.<key> and GAME_RULES[lang].<id>, as everywhere. */
gameText({
  translations: {
    ar: {
      imp1_accuse_title: "مين الجاسوس؟",
      imp1_confirm: "دوس تاني للتأكيد",
      imp1_pass_to: "هاتوا الموبايل لـ {name}",
      imp_dir_switch: "🎤 مين يسأل مين؟",
      imp_dir_hint: "التطبيق يقول كل مرة مين يسأل مين: اللي سأل أقل يسأل اللي اتسأل أقل، عشان محدش يستخبى.",
      imp_claim_btn: "🕵️ أنا الجاسوس",
      imp_claim_only_spy: "الزرار ده للجاسوس بس: أنت معاك الكلمة",
      imp_claim_confirm: "توقف النقاش وتختار الكلمة من 6؟ صح = 3 نقط، غلط = كأنهم مسكوك.",
      imp_claim_hint: "اختار الكلمة: صح = 3 نقط، غلط = كأنهم مسكوك.",
      imp_claim_guessing: "قال «أنا الجاسوس»، وبيختار الكلمة من 6…",
      imp_claimed: "الجاسوس ({name}) كشف نفسه وعرف الكلمة: 3 نقط!",
      imp_points_to: "نقطة للي صوّتوا صح: {names}",
    },
    en: {
      imp1_accuse_title: "Who is the imposter?",
      imp1_confirm: "Tap again to confirm",
      imp1_pass_to: "Hand the phone to {name}",
      imp_dir_switch: "🎤 Who asks whom?",
      imp_dir_hint: "The app names who asks whom each time: whoever has asked least asks whoever has been asked least, so nobody hides.",
      imp_claim_btn: "🕵️ I'm the imposter",
      imp_claim_only_spy: "This button is the imposter's: you have the word",
      imp_claim_confirm: "Stop the discussion and pick the word from six? Right = 3 points, wrong = you're caught.",
      imp_claim_hint: "Pick the word: right = 3 points, wrong = you're caught.",
      imp_claim_guessing: "Said \"I'm the imposter\" and is picking the word from six…",
      imp_claimed: "The imposter ({name}) owned up and knew the word: 3 points!",
      imp_points_to: "A point to those who voted right: {names}",
    }
  },
  rules: {
    ar: {
      imposter: `
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li>اختار فئة (حيوانات، أكلات، دول…) أو اكتب كلمة بنفسك، وحدد عدد الجواسيس.</li>
                <li>مرر الموبايل: كل واحد يدوس مطوّل على الكارت ويشوف الكلمة السرية، إلا الجاسوس يشوف «أنت الجاسوس». أول ما يشيل صباعه تستخبى.</li>
                <li>اسألوا بعض أسئلة عن الكلمة من غير ما تقولوها. الجاسوس بيحاول يتمشّى مع الكلام ويعرف الكلمة، والباقي بيحاولوا يمسكوه من إجاباته.</li>
                <li>لما تتأكدوا، اضغطوا <b>اتهموا حد</b> واختاروا واحد (دوسة تختاره ودوسة كمان تأكد). لو طلع الجاسوس، ياخد الموبايل ويختار الكلمة من 6 كلمات.</li>
                <li>مسكتوه وغلط = نقطة لكل واحد مش جاسوس. هرب أو عرف الكلمة = نقطتين لكل جاسوس. «العب تاني» بيكمّل على نفس النقط. <b>كشف من غير تصويت</b> يوري الإجابة من غير نقط.</li>
            </ol>
            <p class="help-sub">🎤 مين يسأل مين؟</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>اختياري من شاشة الإعداد. لما يبقى شغال، الموبايل يقول مين يسأل مين كل مرة، <b>بالترتيب</b> أو <b>عشوائي</b>، عشان محدش يسأل أكتر من غيره ومحدش يستخبى.</li>
            </ul>
            <p class="help-sub">📱 على موبايلات منفصلة</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>نفس اللعبة من غير تمرير: كل واحد يشوف كلمته على موبايله. بعد النقاش المضيف يفتح <b>التصويت</b>؛ لو مسكتوا الجاسوس عنده فرصة أخيرة يختار الكلمة من 6 كلمات. مسكتوه وغلط = نقطة لكل اللي صوّت عليه، هرب أو عرف الكلمة = نقطتين له. النقاط بتتجمع على طول السهرة.</li>
                <li>كل جولة التطبيق بيختار مين <b>يبدأ الأسئلة</b>، أي حد، حتى الجاسوس نفسه.</li>
                <li>المضيف يقدر يحط <b>حد للنقاش</b> (3 أو 5 أو 8 دقايق): لما الوقت يخلص، التصويت بيفتح لوحده.</li>
                <li>بعد التصويت بتظهر الأصوات واحد واحد، وعمود الجاسوس آخر واحد، وبعدها الكارت يتقلب.</li>
                <li><b>صوتك بيتحسب</b>: لو مسكتوا الجاسوس، النقطة بس للي صوّت عليه؛ اللي اتهم حد بريء مالوش حاجة الجولة دي.</li>
                <li><b>🎤 مين يسأل مين؟</b> (شغال من الأول، والمضيف يقدر يقفله): كل الموبايلات والتلفزيون يقولوا «فلان يسأل فلان»، واللي بيسأل يدوس <b>التالي</b>.</li>
                <li><b>🕵️ أنا الجاسوس</b>: زرار هادي على كل الموبايلات. الجاسوس يقدر يدوسه في أي وقت في النقاش ويختار الكلمة من 6: صح = 3 نقط ليه والجولة تخلص، غلط = كأنكم مسكتوه.</li>
            </ul>`,
    },
    en: {
      imposter: `
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li>Pick a category (animals, food, countries…) or type a word yourself, and set how many imposters.</li>
                <li>Pass the phone: each player presses and holds the card to see the secret word, except the imposter, who sees "You are the imposter". It hides again the moment they let go.</li>
                <li>Ask each other about the word without saying it. The imposter tries to blend in and work out the word; the rest try to catch them from their answers.</li>
                <li>When you are sure, press <b>Accuse someone</b> and pick one (tap to pick, tap again to confirm). If it is the imposter, they take the phone and pick the word from six.</li>
                <li>Caught and wrong = a point to everyone who isn't an imposter. Escaped or guessed the word = two to each imposter. Play again keeps the score. <b>Reveal without a vote</b> shows the answer with no points.</li>
            </ol>
            <p class="help-sub">🎤 Who asks whom?</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>Optional, on the setup screen. When on, the phone names who asks whom each turn, <b>in order</b> or <b>random</b>, so nobody asks more than the rest and nobody hides.</li>
            </ul>
            <p class="help-sub">📱 On separate phones</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>The same game with no passing: everyone sees their word on their own phone. After the discussion the host opens the <b>vote</b>; a caught imposter gets one last pick of the word from six. Caught and wrong = a point to each who voted for them; escaped or guessed = two for the imposter. Points add up all evening.</li>
                <li>Every round the app picks who <b>asks first</b>: anyone, the imposter included.</li>
                <li>The host can set a <b>discussion limit</b> (3, 5 or 8 minutes): when it runs out, the vote opens by itself.</li>
                <li>After the vote the ballots rise one by one, the imposter's bar last, and then the card turns over.</li>
                <li><b>Your vote counts</b>: when the imposter is caught, only those who voted for them score; whoever accused an innocent gets nothing that round.</li>
                <li><b>🎤 Who asks whom?</b> (on unless the host turns it off): every phone and the TV say "X asks Y", and the asker taps <b>Next</b>.</li>
                <li><b>🕵️ I'm the imposter</b>: a quiet button on every phone. The imposter can press it any time during the discussion and pick the word from six: right = 3 points and the round ends, wrong = caught.</li>
            </ul>`,
    }
  }
});
