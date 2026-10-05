/* twotruths: the words only this game's screens show, and its rules (Help, the
   first-play card). The build puts them into TRANSLATIONS and GAME_RULES (tools/game-text.cjs):
   read them as t.<key> and GAME_RULES[lang].<id>, as everywhere. */
gameText({
  translations: {
    ar: {
      tt_lobby_hint: "كل واحد هيكتب حقيقتين وكذبة عن نفسه على موبايله، والباقي يخمنوا الكذبة.",
      tt_wait_others: "اتسجلت. مستنيين الباقي يكتبوا…",
      tt_start_anyway: "ابدأ باللي كتبوا",
      tt_write_title: "حقيقتين وكذبة",
      tt_write_hint: "اكتب 3 جمل عن نفسك وعلّم الكذبة. محدش هيشوف أنهي واحدة.",
      tt_statement: "الجملة",
      tt_placeholder: "مثلا: سافرت اليابان",
      tt_this_is_lie: "دي الكذبة",
      tt_turn_of: "الدور",
      tt_they_vote_you: "الباقي بيخمنوا كذبتك. اثبت!",
      tt_pick_lie: "أنهي واحدة الكذبة؟",
      tt_caught_by: "مسكوها",
      tt_fooled: "اتضحك عليهم",
      tt_nobody_voted: "محدش صوّت",
      tt_final: "النتيجة النهائية",
      tt_next: "اللي بعده",
      tt_over: "الكل خد دوره",
      title_liar: "أحسن كداب",
      tt_need_three: "اكتب الجمل الثلاث",
      tt_need_lie: "علّم الكذبة الأول",
      tt_tv_writing: "كل واحد بيكتب حقيقتين وكذبة على موبايله",
      tt_the_lie: "الكذبة",
    },
    en: {
      tt_lobby_hint: "Everyone writes two truths and a lie about themselves on their phone; the others spot the lie.",
      tt_wait_others: "Saved. Waiting for the others…",
      tt_start_anyway: "Start with those who wrote",
      tt_write_title: "Two truths and a lie",
      tt_write_hint: "Write three things about yourself and mark the lie. Nobody sees which.",
      tt_statement: "Statement",
      tt_placeholder: "e.g. I've been to Japan",
      tt_this_is_lie: "the lie",
      tt_turn_of: "Turn",
      tt_they_vote_you: "They're guessing your lie. Keep a straight face!",
      tt_pick_lie: "Which one is the lie?",
      tt_caught_by: "Spotted it",
      tt_fooled: "Fooled",
      tt_nobody_voted: "Nobody voted",
      tt_final: "Final scores",
      tt_next: "Next player",
      tt_over: "Everyone has had a turn",
      title_liar: "Best liar",
      tt_need_three: "Write all three",
      tt_need_lie: "Mark the lie first",
      tt_tv_writing: "Everyone is writing two truths and a lie",
      tt_the_lie: "The lie",
    }
  },
  rules: {
    ar: {
      twotruths: `
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li>كل واحد يكتب على موبايله <b>3 جمل عن نفسه</b>: اتنين صح وواحدة كذب، ويعلّم الكذبة.</li>
                <li>واحد بالدور: جمله الثلاثة تظهر للكل، والباقي يصوّتوا على اللي شايفينها الكذبة.</li>
                <li>اللي مسك الكذبة ياخد نقطة. وصاحب الجمل ياخد نقطة عن كل واحد اتضحك عليه.</li>
                <li>لما الكل ياخد دوره، أعلى نقاط يكسب. أحلى مع ناس تعرف بعض.</li>
            </ol>
            <p class="help-sub">📺 على التلفزيون</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>الجمل الثلاثة على الشاشة، ومين صوّت، وبعدين الكذبة ومين اتضحك عليه.</li>
            </ul>
            <p class="help-sub">⏭️ التالي لوحده</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>اختيار للمضيف في الأوضة، <b>مقفول من الأول</b>: بعد كل نتيجة عدّاد صغير «الجولة الجاية خلال…»، واللي بعدها تيجي لوحدها. المضيف يدوس «التالي» بدري، أو <b>«⏸ استنى»</b> يوقف العد للجولة دي. ولو للعبة آخر، آخر جولة بتروح للنتيجة النهائية.</li>
            </ul>`,
    },
    en: {
      twotruths: `
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li>Everyone writes <b>three things about themselves</b> on their phone: two true, one a lie, and marks the lie.</li>
                <li>One player at a time: their three statements show to everyone, and the others vote for the lie.</li>
                <li>Spotting the lie is a point. The storyteller gets a point for every voter they fooled.</li>
                <li>After everyone's turn the highest score wins. Best with people who know each other.</li>
            </ol>
            <p class="help-sub">📺 On the TV</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>The three statements on the screen, who has voted, then the lie and who fell for it.</li>
            </ul>
            <p class="help-sub">⏭️ Next by itself</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>The host's choice in the lobby, <b>off to start</b>: after each result a small count «Next round in…», then the next one comes by itself. The host can press «Next» sooner, or <b>«⏸ Wait»</b> to stop the count for that round. In a game with a last round, that one goes to the final result.</li>
            </ul>`,
    }
  }
});
