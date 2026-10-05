/* program: the words only this game's screens show, and its rules (Help, the
   first-play card). The build puts them into TRANSLATIONS and GAME_RULES (tools/game-text.cjs):
   read them as t.<key> and GAME_RULES[lang].<id>, as everywhere. */
gameText({
  translations: {
    ar: {
      prog_builder_hint: "من 3 لـ 8 ألعاب بالترتيب. بين كل لعبة والتانية ترتيب الليلة حوالي 10 ثواني، وبعدين اللعبة الجاية تبدأ لوحدها.",
      prog_empty: "لسه مفيش ألعاب. ضيف 3 على الأقل.",
      prog_add: "ضيف لعبة",
      prog_drag: "اسحب عشان تغيّر الترتيب",
      prog_opts: "إعدادات اللعبة",
      prog_opts_default: "الإعدادات المحفوظة",
      prog_remove: "شيلها من البرنامج",
      prog_need_people: "محتاجين ناس أكتر لـ: {games}. لو لسه مجوش، البرنامج هيستنى المضيف يبدأها.",
      prog_scoring_hint: "النقط بالمراكز: الأول 5، التاني 3، التالت 2، وأي حد لعب 1. في الألعاب الجماعية كل اللي لعب ياخد زي بعض.",
      prog_need_games: "ضيف كمان {n}",
      prog_start: "ابدأ البرنامج ({n} ألعاب)",
      prog_pick_title: "ضيف ألعاب للبرنامج",
      prog_pick_hint: "اضغط على لعبة تضيفها ({n} من {max}). ينفع نفس اللعبة مرتين.",
      prog_in_list: "في البرنامج",
      prog_pick_done: "تمام",
      prog_full: "البرنامج لحد {n} ألعاب",
      prog_no_opts: "اللعبة دي ملهاش إعدادات",
      prog_opts_hint: "نفس إعدادات اللعبة في الغرفة، ومحفوظة على موبايلك.",
      prog_opts_save: "احفظ الإعدادات",
      prog_first_one: "مركز أول",
      prog_firsts: "مراكز أولى",
      prog_wait_host: "اللعبة الجاية بتبدأ لوحدها",
      prog_go_first: "يلا نبدأ",
      prog_go_now: "ابدأ دلوقتي",
      prog_resume: "كمّل",
      prog_pause: "استنى",
      prog_end: "إنهاء البرنامج",
      prog_skipped: "{game} اتفوّتت",
      prog_last_coop: "{game}: كله لعب مع بعض، وخدوا زي بعض",
      prog_last: "بعد {game}",
      prog_lineup_n: "برنامج الليلة · {n} ألعاب",
      prog_after_n: "بعد {n} من {of} ألعاب",
      prog_lineup_title: "برنامج الليلة",
      prog_table_title: "الترتيب لحد دلوقتي",
      prog_first_game: "أول لعبة",
      prog_next_game: "اللعبة الجاية",
      prog_paused: "واقفين شوية",
      prog_get_ready: "جهّزوا الموبايلات",
      prog_table_in: "الترتيب بعد",
      prog_waiting_host: "البرنامج مستني تبدأ {game}",
      prog_waiting: "البرنامج مستني المضيف يبدأ {game}",
      prog_skip_game: "فوّتها",
      prog_skip_game_q: "نفوّت اللعبة دي ونروح للي بعدها؟",
      prog_end_q: "ننهي البرنامج ونشوف بطل الليلة؟ اللعبة اللي شغالة دلوقتي مش هتتحسب.",
      prog_full_table: "الترتيب كله",
      prog_share: "ابعت صورة السهرة",
      prog_close: "خلّصنا",
      prog_fin_title: "خلصت السهرة · {n} ألعاب في {m} دقيقة",
      prog_champ: "بطل الليلة: {name}",
      prog_champs: "أبطال الليلة: {name}",
      prog_and: " و",
      prog_no_champ: "محدش كمّل لعبة للآخر",
      prog_fin_wait: "المضيف يقفل البرنامج ويرجّعكم للألعاب",
    },
    en: {
      prog_builder_hint: "3 to 8 games, in order. Between two games the night's table shows for about 10 seconds, then the next game starts by itself.",
      prog_empty: "No games yet. Add 3 at least.",
      prog_add: "Add a game",
      prog_drag: "Drag to change the order",
      prog_opts: "The game's options",
      prog_opts_default: "Saved options",
      prog_remove: "Take it out of the program",
      prog_need_people: "Needs more people: {games}. If they aren't here yet, the program waits for the host to start it.",
      prog_scoring_hint: "Points by place: 1st 5, 2nd 3, 3rd 2, anyone who played 1. In a co-op game everyone who played gets the same.",
      prog_need_games: "Add {n} more",
      prog_start: "Start the program ({n} games)",
      prog_pick_title: "Add games to the program",
      prog_pick_hint: "Tap a game to add it ({n} of {max}). The same game twice is fine.",
      prog_in_list: "In the program",
      prog_pick_done: "Done",
      prog_full: "A program has up to {n} games",
      prog_no_opts: "This game has no options",
      prog_opts_hint: "The same options as in the room, saved on your phone.",
      prog_opts_save: "Save the options",
      prog_first_one: "first place",
      prog_firsts: "first places",
      prog_wait_host: "The next game starts by itself",
      prog_go_first: "Let's go",
      prog_go_now: "Start now",
      prog_resume: "Go on",
      prog_pause: "Wait",
      prog_end: "End the program",
      prog_skipped: "{game} was skipped",
      prog_last_coop: "{game}: everyone played together and gets the same",
      prog_last: "After {game}",
      prog_lineup_n: "Tonight's program · {n} games",
      prog_after_n: "After {n} of {of} games",
      prog_lineup_title: "Tonight's program",
      prog_table_title: "The table so far",
      prog_first_game: "First game",
      prog_next_game: "Next game",
      prog_paused: "Taking a break",
      prog_get_ready: "Phones ready",
      prog_table_in: "The table in",
      prog_waiting_host: "The program is waiting for you to start {game}",
      prog_waiting: "The program is waiting for the host to start {game}",
      prog_skip_game: "Skip it",
      prog_skip_game_q: "Skip this game and go on to the next?",
      prog_end_q: "End the program and see the night's champion? The game on now won't count.",
      prog_full_table: "The whole table",
      prog_share: "Send the night's picture",
      prog_close: "We're done",
      prog_fin_title: "That's the night · {n} games in {m} min",
      prog_champ: "Champion of the night: {name}",
      prog_champs: "Champions of the night: {name}",
      prog_and: " & ",
      prog_no_champ: "Nobody finished a game",
      prog_fin_wait: "The host closes the program and takes you back to the games",
    }
  },
  rules: {
    ar: {
      program: `
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li>المضيف يفتح <b>🌙 برنامج السهرة</b> فوق قايمة الألعاب في الغرفة، ويختار من 3 لـ 8 ألعاب بالترتيب: يسحبهم يغيّر الترتيب، يشيل اللي مش عايزه، و⚙️ لإعدادات كل لعبة.</li>
                <li>أول ما يبدأ، الكل يشوف برنامج الليلة، وبعدين أول لعبة تبدأ لوحدها.</li>
                <li>لما لعبة تخلص، نتيجتها تفضل شوية، وبعدين <b>الترتيب لحد دلوقتي</b> حوالي 10 ثواني جنب اللعبة الجاية وعداد، واللعبة الجاية تبدأ لوحدها.</li>
                <li>النقط بالمراكز مش بنقط كل لعبة: الأول 5، التاني 3، التالت 2، وأي حد لعب 1. اللي متعادلين ياخدوا نقط المركز كلهم. في الألعاب الجماعية (العقل، الحقوا!، الأوضة المضلمة، حط إيدك!…) كل اللي لعب ياخد زي بعض.</li>
                <li>في الآخر: <b>بطل الليلة</b> على البوديوم، وجوايز من اللي حصل فعلاً في السهرة، وصورة للسهرة تبعتها.</li>
            </ol>
            <p class="help-sub">👑 المضيف</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>بين لعبتين: ⏭ ابدأ دلوقتي، أو ⏸ استنى. ولو المضيف مش موجود أي حد يقدر يدوسهم.</li>
                <li>وسط لعبة: زرار المضيف «لعبة أخرى» (أو سهم الرجوع) يخلّص اللعبة دي، وتتحسب بالترتيب اللي وصلتوله. «إنهاء البرنامج» بين لعبتين يطلّع بطل الليلة على طول.</li>
                <li>لعبة محتاجة ترتيب قبل ما تبدأ (فرق، كراسي، ناس أكتر): البرنامج يستنى المضيف يدوس «ابدأ»، أو «فوّتها».</li>
                <li>الألعاب اللي ملهاش آخر (لو خيروك، مين أكثر واحد، فيبج، كلمة واحدة، الجرس، القنبلة…) بتخلص في البرنامج بعد عدد جولات.</li>
            </ul>`,
    },
    en: {
      program: `
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li>The host opens <b>🌙 The night's program</b> above the room's list of games and picks 3 to 8 games in order: drag to reorder, remove what you don't want, ⚙️ for each game's options.</li>
                <li>Once it starts, everyone sees tonight's line-up, then the first game starts by itself.</li>
                <li>When a game ends its result stays up a moment, then <b>the table so far</b> shows for about 10 seconds beside the next game and a countdown, and the next game starts by itself.</li>
                <li>Points go by place, not each game's own score: 1st 5, 2nd 3, 3rd 2, anyone who played 1. Tied players all take the place's points. In a co-op game (The Mind, Panic Stations!, The Dark Room, Hands Down!…) everyone who played gets the same.</li>
                <li>At the end: <b>the champion of the night</b> on the podium, awards for what really happened tonight, and a picture of the night to send.</li>
            </ol>
            <p class="help-sub">👑 The host</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>Between two games: ⏭ Start now, or ⏸ Wait. With the host away, anyone can press them.</li>
                <li>During a game: the host's «Another game» (or the back arrow) ends this one, counted by the places reached. «End the program», between two games, goes straight to the champion.</li>
                <li>A game that needs setting up first (sides, seats, more people): the program waits for the host to press Start, or «Skip it».</li>
                <li>Games with no end of their own (Would You Rather, Most Likely To, Fibbage, Just One, the Buzzer, the Bomb…) end after a number of rounds in a program.</li>
            </ul>`,
    }
  }
});
