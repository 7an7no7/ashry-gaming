/* Numbers (حسبة): the words only this game's screens show, and its rules (Help, the
   first-play card). The build puts them into TRANSLATIONS and GAME_RULES (tools/game-text.cjs):
   read them as t.<key> and GAME_RULES[lang].hesba, as everywhere. */
gameText({
  translations: {
    ar: {
      setup_hesba: "حسبة",
      cat_hesba: "أرقام وهدف: اجمع واطرح واضرب واقسم لحد ما توصله بالظبط",
      hesba_mode_solo: "لوحدك",
      hesba_online_desc: "نفس الأرقام ونفس الهدف على كل موبايل: أول واحد يوصل بالظبط ياخد الجولة، ولو محدش وصل الأقرب. التلفزيون بيوري الهدف والوقت.",
      hesba_level: "المستوى",
      hesba_lvl_easy: "سهل",
      hesba_lvl_easy_n: "4 أرقام · هدف تحت 100",
      hesba_lvl_hard: "صعب",
      hesba_lvl_hard_n: "6 أرقام · هدف لحد 999",
      hesba_solo_hint: "لغز ورا لغز، كل واحد بدقيقة (والصعب بدقيقة ونص). اللي مش بالظبط بيضيّع قلب من التلاتة.",
      hesba_best: "أحسن نتيجة",
      hesba_target: "الهدف",
      hesba_exact_bang: "بالظبط!",
      hesba_time: "الوقت",
      hesba_closest: "أقرب",
      hesba_undo: "رجوع خطوة",
      hesba_reset: "من الأول",
      hesba_send: "ابعت",
      hesba_exact_btn: "بالظبط",
      hesba_settle: "خلاص على",
      hesba_bad_step: "الخطوة دي مش بتطلع رقم صحيح",
      hesba_trail_empty: "دوس رقم، وبعدين عملية، وبعدين رقم تاني",
      hesba_score: "النقط",
      hesba_puzzle: "لغز",
      hesba_hearts: "القلوب",
      hesba_daily: "تحدي اليوم",
      hesba_one_way: "طريقة بالظبط",
      hesba_your_way: "طريقتك",
      hesba_way_of: "طريقة {name}",
      hesba_round_to: "الجولة لـ",
      hesba_round_shared: "الجولة متقسمة بين",
      hesba_exact_in: "بالظبط في {t}",
      hesba_near_line: "الأقرب: {v} · فرق {d}",
      hesba_nobody: "محدش بعت رقم",
      hesba_nobody_sub: "الجولة دي محدش كسبها",
      hesba_round_of: "الجولة {n} من {m}",
      hesba_rounds_won: "الجولات بعد {n} من {m}",
      hesba_next: "الجولة الجاية",
      hesba_wait_next: "المضيف هيبدأ الجولة الجاية…",
      hesba_finish: "خلّص الجولة",
      hesba_sent_line: "بعت {v} · فرق {d}",
      hesba_sent_exact: "{v} · بالظبط",
      hesba_working: "بيحسب…",
      hesba_sent_count: "بعتوا {n} من {m}",
      hesba_closest_now: "أقرب حد على بعد {d}",
      hesba_you_sent: "بعتّ {v}",
      hesba_no_answer: "ما بعتش",
      hesba_tv_how: "أول واحد يوصل للرقم بالظبط ياخد الجولة · لو محدش وصل، الأقرب",
      hesba_secs: "وقت الجولة",
      hesba_rounds: "عدد الجولات",
      hesba_lobby_hint: "نفس الأرقام على كل موبايل: دوس رقم وعملية ورقم، يندمجوا في رقم جديد. أول واحد يوصل للهدف بالظبط ياخد الجولة.",
      hesba_puzzle_exact: "بالظبط! +{p}",
      hesba_puzzle_miss: "فرق {d}",
      hesba_time_up: "خلص الوقت",
      hesba_gave_up: "خلصت على {v}",
      hesba_heart_lost: "راح قلب",
      hesba_next_puzzle: "اللغز الجاي",
      hesba_run_over: "خلصت القلوب",
      hesba_solved_n: "ألغاز بالظبط: {n} من {m}",
      hesba_daily_off: "فرق {d}",
      hesba_see_result: "النتيجة"
    },
    en: {
      setup_hesba: "Numbers",
      cat_hesba: "Numbers and a target: add, take, times and divide until you hit it exactly",
      hesba_mode_solo: "On your own",
      hesba_online_desc: "The same numbers and target on every phone: the first exact answer takes the round, or the closest if nobody is exact. The TV shows the target and the clock.",
      hesba_level: "Level",
      hesba_lvl_easy: "Easy",
      hesba_lvl_easy_n: "4 numbers · target under 100",
      hesba_lvl_hard: "Hard",
      hesba_lvl_hard_n: "6 numbers · target up to 999",
      hesba_solo_hint: "Puzzle after puzzle, a minute each (a minute and a half on Hard). Any that isn't exact costs one of three hearts.",
      hesba_best: "Best",
      hesba_target: "Target",
      hesba_exact_bang: "Exact!",
      hesba_time: "Time",
      hesba_closest: "Closest",
      hesba_undo: "Step back",
      hesba_reset: "Reset",
      hesba_send: "Send",
      hesba_exact_btn: "Exact",
      hesba_settle: "Settle on",
      hesba_bad_step: "That step doesn't make a whole number",
      hesba_trail_empty: "Tap a number, then an operation, then another number",
      hesba_score: "Score",
      hesba_puzzle: "Puzzle",
      hesba_hearts: "Hearts",
      hesba_daily: "Daily",
      hesba_one_way: "One exact way",
      hesba_your_way: "Your way",
      hesba_way_of: "{name}'s way",
      hesba_round_to: "The round goes to",
      hesba_round_shared: "The round is shared by",
      hesba_exact_in: "exact in {t}",
      hesba_near_line: "closest: {v} · {d} off",
      hesba_nobody: "Nobody sent a number",
      hesba_nobody_sub: "Nobody takes this round",
      hesba_round_of: "Round {n} of {m}",
      hesba_rounds_won: "Rounds won, {n} of {m}",
      hesba_next: "Next round",
      hesba_wait_next: "The host starts the next round…",
      hesba_finish: "End the round",
      hesba_sent_line: "sent {v} · {d} off",
      hesba_sent_exact: "{v} · exact",
      hesba_working: "working…",
      hesba_sent_count: "{n} of {m} sent",
      hesba_closest_now: "closest is {d} off",
      hesba_you_sent: "You sent {v}",
      hesba_no_answer: "no answer",
      hesba_tv_how: "First exact answer takes the round · if nobody is exact, the closest",
      hesba_secs: "Round time",
      hesba_rounds: "Rounds",
      hesba_lobby_hint: "The same numbers on every phone: tap a number, an operation and a number, and they merge into a new one. The first to hit the target exactly takes the round.",
      hesba_puzzle_exact: "Exact! +{p}",
      hesba_puzzle_miss: "{d} off",
      hesba_time_up: "Time's up",
      hesba_gave_up: "Settled on {v}",
      hesba_heart_lost: "A heart gone",
      hesba_next_puzzle: "Next puzzle",
      hesba_run_over: "Out of hearts",
      hesba_solved_n: "Exact: {n} of {m}",
      hesba_daily_off: "{d} off",
      hesba_see_result: "Result"
    }
  },
  rules: {
    ar: {
      hesba: `
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li>قدامك أرقام وهدف. دوس رقم، وبعدين عملية (+ − × ÷)، وبعدين رقم تاني: يندمجوا في رقم جديد.</li>
                <li>كل رقم مرة واحدة بس، والخطوات أرقام صحيحة: مفيش كسور ولا سالب. <b>↶</b> بترجع خطوة.</li>
                <li><b>سهل</b>: 4 أرقام وهدف تحت 100. <b>صعب</b>: 6 أرقام (منهم 25 و50 و75 و100) وهدف لحد 999. كل هدف ليه طريقة بالظبط.</li>
                <li><b>في غرفة</b>: نفس الأرقام على كل موبايل. أول واحد يوصل بالظبط ياخد الجولة على طول؛ لو الوقت خلص ومحدش وصل، الأقرب ياخدها (والتعادل بيتقسم). بعدها بتظهر طريقة بالظبط.</li>
                <li><b>لوحدك</b>: لغز ورا لغز، بالظبط بـ 10 نقط وزيادة على الوقت الفاضل، فرق 5 أو أقل بـ 7، فرق 10 أو أقل بـ 5. كل لغز مش بالظبط بيضيّع قلب من التلاتة.</li>
                <li><b>تحدي اليوم</b>: لغز واحد صعب، نفسه عند الكل، من غير وقت.</li>
            </ol>`,
    },
    en: {
      hesba: `
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li>You get some numbers and a target. Tap a number, then an operation (+ − × ÷), then another number: they merge into a new one.</li>
                <li>Each number once only, and every step whole: no fractions, nothing below zero. <b>↶</b> takes a step back.</li>
                <li><b>Easy</b>: 4 numbers and a target under 100. <b>Hard</b>: 6 numbers (some of 25, 50, 75, 100) and a target up to 999. Every target can be hit exactly.</li>
                <li><b>In a room</b>: the same numbers on every phone. The first exact answer takes the round at once; if time runs out with nobody exact, the closest takes it (a tie shares). Then one exact way is shown.</li>
                <li><b>On your own</b>: puzzle after puzzle; exact scores 10 plus a bonus for the time left, 5 off or less 7, 10 off or less 5. Any puzzle that isn't exact costs one of three hearts.</li>
                <li><b>Daily</b>: one hard puzzle, the same for everyone, no clock.</li>
            </ol>`,
    }
  }
});
