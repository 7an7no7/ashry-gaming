/* codenames: the words only this game's screens show, and its rules (Help, the
   first-play card). The build puts them into TRANSLATIONS and GAME_RULES (tools/game-text.cjs):
   read them as t.<key> and GAME_RULES[lang].<id>, as everywhere. */
gameText({
  translations: {
    ar: {
      cn_spymaster: "قائد",
      cn_operative: "لاعب",
      cn_empty: "لسه مفيش حد",
      cn_lobby_hint: "كل فريق محتاج قائد واحد ولاعب واحد على الأقل.",
      cn_your_clue: "تلميحك",
      cn_clue_ph: "كلمة واحدة",
      cn_give_clue: "قول التلميح",
      cn_clue_needed: "اكتب التلميح",
      cn_team_guessing: "فريقك بيخمّن دلوقتي…",
      cn_other_turn: "دور الفريق التاني",
      cn_mark_hint: "اضغط كلمة عشان تعلّمها قدام فريقك، وبعدين اكشفها.",
      cn_hide_key: "إخفاء المفتاح",
      cn_show_key: "إظهار المفتاح",
      cn_swap_word: "تبديل كلمة",
      cn_swap_hint: "اضغط الكلمة اللي عايز تبدلها. التبديل قبل أول تلميح بس.",
      cn_clue_on_board: "التلميح ما ينفعش يكون كلمة على اللوحة",
      cn_clue_count: "عدد الكلمات",
      cn_clue_hint: "كلمة واحدة ورقم. ∞ أو 0: الفريق يخمّن لحد ما يغلط.",
      cn_no_guesses: "بدون تخمين",
      cn_options: "إعدادات اللعبة",
      cn_shuffle: "قسّم الفرق عشوائياً",
      cn_timer: "وقت كل دور (ثانية)",
      cn_timer_off: "بدون",
      cn_timer_hint: "للقائد عشان يدّي التلميح، ونفس الوقت للفريق عشان يخمّن. لو الوقت خلص الدور ينتقل.",
      cn_timer_summary: "{n} ثانية لكل دور",
      cn_rotate: "تبديل القائد كل لعبة",
      cn_rotate_hint: "في اللعبة الجاية القيادة تروح للي بعده في نفس الفريق.",
      cn_rotate_summary: "القائد يتبدّل كل لعبة",
      cn_custom: "كلماتكم انتوا (اختياري)",
      cn_custom_ph: "كلمة في كل سطر: أسماء، أماكن، ذكريات…",
      cn_custom_save: "حفظ الكلمات",
      cn_custom_count: "{n} كلمة خاصة",
      cn_left: "كلمات باقية",
      cn_clues_given: "تلميحات",
      cn_series: "مرات الفوز",
      cn_pass_turn: "انقل الدور ⏭️",
      cn_set_spymaster: "قائد جديد للفريق {team}",
    },
    en: {
      cn_spymaster: "Spymaster",
      cn_operative: "Operative",
      cn_empty: "Nobody yet",
      cn_lobby_hint: "Each team needs one spymaster and at least one operative.",
      cn_your_clue: "Your clue",
      cn_clue_ph: "one word",
      cn_give_clue: "Give clue",
      cn_clue_needed: "Type a clue",
      cn_team_guessing: "Your team is guessing…",
      cn_other_turn: "Other team's turn",
      cn_mark_hint: "Tap a word to mark it for your team, then reveal it.",
      cn_hide_key: "Hide key",
      cn_show_key: "Show key",
      cn_swap_word: "Swap a word",
      cn_swap_hint: "Tap the word to replace. Only before the first clue.",
      cn_clue_on_board: "A word on the board can't be the clue",
      cn_clue_count: "How many words",
      cn_clue_hint: "One word and a number. ∞ or 0: the team guesses until it misses.",
      cn_no_guesses: "No guesses",
      cn_options: "Game settings",
      cn_shuffle: "Shuffle teams",
      cn_timer: "Time per turn (seconds)",
      cn_timer_off: "Off",
      cn_timer_hint: "For the spymaster to give a clue, and the same again for the team to guess. When it runs out, the turn passes.",
      cn_timer_summary: "{n} seconds a turn",
      cn_rotate: "New spymaster each game",
      cn_rotate_hint: "Next game, the role moves to the next player on the same team.",
      cn_rotate_summary: "Spymasters rotate",
      cn_custom: "Your own words (optional)",
      cn_custom_ph: "One per line: names, places, family jokes…",
      cn_custom_save: "Save words",
      cn_custom_count: "{n} own words",
      cn_left: "Words left",
      cn_clues_given: "Clues",
      cn_series: "Wins",
      cn_pass_turn: "Pass the turn ⏭️",
      cn_set_spymaster: "New spymaster: {team}",
    }
  },
  rules: {
    ar: {
      codenames: `
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li>فريقين، كل فريق فيه <b>قائد</b> واحد و<b>لاعب</b> أو أكتر. «قسّم الفرق عشوائياً» يوزعكم في ثانية.</li>
                <li>على الطاولة 25 كلمة. القائد بس اللي يشوف ألوانها.</li>
                <li>القائد يقول <b>كلمة واحدة ورقم</b>: الكلمة تربط كلمات فريقه، والرقم عددها. ممنوع كلمة من اللي على اللوحة، ولا هي بإملاء تاني أو بأل التعريف. <b>∞</b> أو <b>0</b> = خمّنوا لحد ما تغلطوا.</li>
                <li>اللاعب يضغط كلمة عشان يعلّمها لفريقه، وبعدين «اكشف الكلمة». كلمة فريقكم = كمّلوا. محايدة أو للخصم = خلص دوركم.</li>
                <li>فيه كلمة <b>قاتلة</b> واحدة: اللي يكشفها يخسر فوراً.</li>
                <li>المضيف يقدر يحط وقت لكل دور وكلماتكم الخاصة. مرات الفوز بتتجمع طول السهرة.</li>
            </ol>
            <p class="help-sub">📺 على التلفزيون</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>اللوحة كبيرة على الشاشة، والفريق يقدر يختار الكلمة من عليها. المفتاح على موبايل القائد بس.</li>
            </ul>`,
    },
    en: {
      codenames: `
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li>Two teams, each with one <b>spymaster</b> and one or more <b>operatives</b>. "Split teams randomly" does it in a second.</li>
                <li>25 words on the table. Only the spymasters see their colours.</li>
                <li>The spymaster gives <b>one word and a number</b>: the word links their team's words, the number says how many. Not a word on the board, nor one of them spelled differently or with "the". <b>∞</b> or <b>0</b> = guess until you miss.</li>
                <li>An operative taps a word to mark it for the team, then "Reveal". Your team's word = keep going. Neutral or the other team's = your turn ends.</li>
                <li>There is one <b>assassin</b>: whoever reveals it loses at once.</li>
                <li>The host can set a turn clock and add your own words. Wins add up all evening.</li>
            </ol>
            <p class="help-sub">📺 On the TV</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>The board is large on the screen and a team can pick a word from it. The key stays on the spymaster's phone.</li>
            </ul>`,
    }
  }
});
