/* hangman: the words only this game's screens show, and its rules (Help, the
   first-play card). The build puts them into TRANSLATIONS and GAME_RULES (tools/game-text.cjs):
   read them as t.<key> and GAME_RULES[lang].<id>, as everywhere. */
gameText({
  translations: {
    ar: {
      hm_bub_1: "يلا يا جدع",
      hm_bub_2: "فكّر كويس",
      hm_bub_3: "إلحقوني!",
      hm_bub_4: "حرف بس!!",
      hm_bub_5: "يا ناااس!!",
      hm_whole_ph: "خمّن الكلمة كلها…",
      hm_whole_btn: "خمّن",
      hm_write_hide: "{name}، عينك بعيد عن الشاشة 🙈",
      hm_write_ph: "الكلمة",
      hm_write_hint: "كلمة، أو اسم مشهور أو فيلم لحد 3 كلمات، زي ما هو بالظبط. الحروف مستخبية وانت بتكتب.",
      hm_write_bad: "اكتب كلمة أو اسم من 3 لـ 20 حرف، حروف بس.",
      hm_write_sentence: "كلمة أو اسم لحد 3 كلمات بس، مش جملة.",
      hm_hint_ph: "تلميح (اختياري): ممثل، فيلم، أكلة…",
      hm_hint_label: "تلميح (اختياري)",
      hm_hint_ph_short: "ممثل، فيلم، أكلة…",
      hm_write_poster: "{name} يكتب كلمة",
      hm_write_ready: "جاهزة",
      hm_write_then: "وبعدها ادّي الموبايل لـ{name}",
      hm_hint_bad: "التلميح فيه الكلمة نفسها.",
      hm_show_word: "ورّيني الكلمة",
      hm_guess_title: "كلمة {setter}، والدور على {name}",
      hm_won: "🎉 حليتها!",
      hm_lost_was: "ماحلّهاش… الكلمة كانت",
      hm_lost_room: "😵 ماحلّهاش",
      hm_next_swap: "الكلمة الجاية من {name}",
      hm_room_writing: "مستنيين كلمة {name}…",
      hm_room_you_write: "دورك تكتب كلمة، والباقي هيخمّنوها",
      hm_send_word: "ابعت الكلمة",
      hm_your_word: "كلمتك",
      hm_you_watch: "دي كلمتك: اتفرج مين هيحلّها.",
      hm_word_from: "كلمة {name}",
      hm_the_word: "الكلمة",
      hm_found: "{n} من {m}",
      hm_state_won: "حلّها",
      hm_state_lost: "😵 خسر",
      hm_close_word: "اقفل الكلمة",
      hm_next_word: "الكلمة الجاية",
      hm_round: "كلمة {n} من {m}",
      hm_setter_pts: "{name} (اللي كتبها)",
      hm_lobby_mode: "الطريقة",
      hm_mode_setter: "واحد يكتب",
      hm_mode_race: "سباق",
      hm_mode_setter_hint: "واحد يكتب كلمة والباقي يخمّن، كل واحد على موبايله. اللي بيكتب بيتغير كل كلمة، وبياخد 5 عن كل واحد ماحلّهاش.",
      hm_mode_race_hint: "التطبيق بيدّي الكل نفس الكلمة (أو اسم مشهور أو فيلم) ونوعها، واللي يحلّ الأول ياخد أكتر.",
      hm_lobby_rounds: "كام كلمة؟",
      hm_lobby_clock: "وقت الكلمة",
      hm_clock_hint: "لما الوقت يخلص، اللي ماحلّهاش يتحسب اتشنق.",
      hm_lobby_hint: "المضيف بيختار الطريقة والمستوى وعدد الكلمات.",
      hm_skip_writer: "اللي بعده يكتب",
      hm_watching: "انت بتتفرج الكلمة دي",
      hm_misses_of: "غلطات {n} من {m}",
      hm_level: "المستوى",
      hm_level_easy: "سهل",
      hm_level_normal: "عادي",
      hm_level_hard: "صعب",
      hm_level_hint_easy: "8 غلطات قبل ما يتشنق، والراجل بيترسم حتت أصغر.",
      hm_level_hint_normal: "6 غلطات، زي العادة.",
      hm_level_hint_hard: "4 غلطات بس، والراجل بيترسم حتت أكبر.",
      hm_level_race_hint_easy: "8 غلطات، وكلمة قصيرة لحد 6 حروف، ونوعها ظاهر.",
      hm_level_race_hint_normal: "6 غلطات، أي كلمة أو اسم، ونوعها ظاهر.",
      hm_level_race_hint_hard: "4 غلطات، كلمة طويلة أو اسم، ومن غير ما نقول نوعها.",
      hm_life_label: "مساعدات",
      hm_life_reveal: "اكشف حرف",
      hm_life_remove: "شيل ٣ حروف غلط",
      hm_life_used: "{n} مساعدة",
      hm_hint_in_1: "تلميح كمان بعد غلطة",
      hm_hint_in_2: "تلميح كمان بعد غلطتين",
      hm_hint_in: "تلميح كمان بعد {n} غلطات",
      hm_streak_title: "{n} كلمات ورا بعض",
      hm_more_hints: "تلميحات تانية (اختياري)",
      hm_hint_n_label: "تلميح {n}: بيظهر بعد الغلطة رقم {m}",
      hm_local_gain: "{name} {n}",
      hm_local_gain_writer: "{name} (اللي كتبها) {n}",
      hm_mode_teams: "فريق ضد فريق",
      hm_mode_teams_hint: "فريقين: واحد من فريق يكتب، والفريق التاني يتشاور بصوت عالي والكابتن بتاعه يدوس الحرف. بيتبدّلوا كل كلمة، والكابتن بيتغيّر كل مرة.",
      hm_teams_label: "الفرق",
      hm_teams_shuffle: "وزّع تاني",
      hm_teams_hint: "دوس على اسم عشان تنقله للفريق التاني.",
      hm_team_0: "الفريق الأحمر",
      hm_team_1: "الفريق الأزرق",
      hm_team_guesses: "بيخمّن",
      hm_team_writes: "بيكتب",
      hm_team_writing: "{name} بيكتب كلمة لـ{team}…",
      hm_team_you_write: "دورك تكتب كلمة لـ{team}",
      hm_captain_is: "الكابتن: {name}",
      hm_you_captain: "انت الكابتن: اسمع فريقك ودوس",
      hm_team_say: "اتشاوروا بصوت عالي وقولوا الحرف لـ{name}",
      hm_cap_banner: "إنت الكابتن — دوس الحرف",
      hm_cap_only: "الكابتن بس اللي بيدوس — قولوا الحرف لـ{name}",
      hm_cap_only_toast: "الكابتن بس اللي بيدوس",
      hm_take_back: "اتكتبت غلط؟ رجّعها",
      hm_take_back_late: "فات الوقت، الكلمة اتلعبت",
      hm_word_coming: "الكلمة جاية…",
      hm_next_captain: "كابتن تاني",
      hm_team_wrote: "كتبها {name} من {team}",
      hm_team_draw: "تعادل! الفريقين نفس النقط",
      hm_team_won: "🏆 {team} كسب!",
      hm_lobby_rounds_teams: "كام كلمة؟ (نصهم لكل فريق)",
      hm_lobby_cat: "النوع",
      hm_cat_all: "من كل حاجة",
      hm_cat_countries: "دول ومعالم",
      hm_cat_animals: "حيوانات",
      hm_cat_food: "أكل وشرب",
      hm_cat_films: "أفلام",
      hm_cat_football: "كورة",
      hm_cat_singers: "مطربين",
      hm_cat_actors: "ممثلين",
      hm_cat_famous: "شخصيات مشهورة",
      hm_cat_cartoons: "كرتون",
      hm_cat_home: "البيت وأدواته",
      hm_cat_jobs: "مهن",
      hm_cat_sports: "رياضات",
      hm_cat_hidden: "من غير نوع",
    },
    en: {
      hm_bub_1: "Come on, mate",
      hm_bub_2: "Think hard",
      hm_bub_3: "Help me!",
      hm_bub_4: "One letter!!",
      hm_bub_5: "HEEELP!!",
      hm_whole_ph: "Guess the whole word…",
      hm_whole_btn: "Guess",
      hm_write_hide: "{name}, eyes off the screen 🙈",
      hm_write_ph: "The word",
      hm_write_hint: "A word, or a famous name or a film of up to 3 words, exactly as it's spelt. The letters are hidden as you type.",
      hm_write_bad: "Write a word or a name of 3 to 20 letters, letters only.",
      hm_write_sentence: "A word or a name of up to 3 words, not a sentence.",
      hm_hint_ph: "A hint (optional): an actor, a film, a dish…",
      hm_hint_label: "Hint (optional)",
      hm_hint_ph_short: "An actor, a film, a dish…",
      hm_write_poster: "{name} writes a word",
      hm_write_ready: "Ready",
      hm_write_then: "Then hand the phone to {name}",
      hm_hint_bad: "The hint has the word itself in it.",
      hm_show_word: "Show the word",
      hm_guess_title: "{setter}'s word, {name} to guess",
      hm_won: "🎉 Solved!",
      hm_lost_was: "Not this time… the word was",
      hm_lost_room: "😵 Not solved",
      hm_next_swap: "Next word from {name}",
      hm_room_writing: "Waiting for {name}'s word…",
      hm_room_you_write: "Your turn to write a word for the others",
      hm_send_word: "Send the word",
      hm_your_word: "Your word",
      hm_you_watch: "You wrote it: watch who solves it.",
      hm_word_from: "{name}'s word",
      hm_the_word: "The word",
      hm_found: "{n} of {m}",
      hm_state_won: "Solved",
      hm_state_lost: "😵 Out",
      hm_close_word: "Close the word",
      hm_next_word: "Next word",
      hm_round: "Word {n} of {m}",
      hm_setter_pts: "{name} (who wrote it)",
      hm_lobby_mode: "How to play",
      hm_mode_setter: "One writes",
      hm_mode_race: "A race",
      hm_mode_setter_hint: "One writes a word and everyone else guesses on their own phone. The writer changes every word and scores 5 for everyone who doesn't solve it.",
      hm_mode_race_hint: "The app gives everyone the same word (or a famous name, or a film) and its kind; the first to solve it scores most.",
      hm_lobby_rounds: "How many words?",
      hm_lobby_clock: "Word clock",
      hm_clock_hint: "When it runs out, anyone who hasn't solved it counts as hanged.",
      hm_lobby_hint: "The host picks how to play, the level and how many words.",
      hm_skip_writer: "Next writer",
      hm_watching: "You're watching this word",
      hm_misses_of: "{n} of {m} misses",
      hm_level: "Level",
      hm_level_easy: "Easy",
      hm_level_normal: "Normal",
      hm_level_hard: "Hard",
      hm_level_hint_easy: "8 misses before he's hanged; the man comes in smaller pieces.",
      hm_level_hint_normal: "6 misses, as always.",
      hm_level_hint_hard: "Only 4 misses; the man comes in bigger pieces.",
      hm_level_race_hint_easy: "8 misses, a short word of up to 6 letters, and its category shown.",
      hm_level_race_hint_normal: "6 misses, any word or name, and its category shown.",
      hm_level_race_hint_hard: "4 misses, a long word or a name, and no category.",
      hm_life_label: "Lifelines",
      hm_life_reveal: "Show a letter",
      hm_life_remove: "Remove 3 wrong",
      hm_life_used: "{n} lifeline(s)",
      hm_hint_in_1: "Another hint after 1 more miss",
      hm_hint_in_2: "Another hint after 2 more misses",
      hm_hint_in: "Another hint after {n} more misses",
      hm_streak_title: "{n} in a row",
      hm_more_hints: "More hints (optional)",
      hm_hint_n_label: "Hint {n}: shows after miss {m}",
      hm_local_gain: "{name} {n}",
      hm_local_gain_writer: "{name} (who wrote it) {n}",
      hm_mode_teams: "Team v team",
      hm_mode_teams_hint: "Two teams: one of a team writes, the other team talks it over out loud and its captain taps the letter. The teams swap every word, and the captain changes every time.",
      hm_teams_label: "Teams",
      hm_teams_shuffle: "Shuffle",
      hm_teams_hint: "Tap a name to move it to the other team.",
      hm_team_0: "Red team",
      hm_team_1: "Blue team",
      hm_team_guesses: "guessing",
      hm_team_writes: "writing",
      hm_team_writing: "{name} is writing a word for the {team}…",
      hm_team_you_write: "Your turn to write a word for the {team}",
      hm_captain_is: "Captain: {name}",
      hm_you_captain: "You're the captain: listen to your team and tap",
      hm_team_say: "Talk it over out loud and tell {name} the letter",
      hm_cap_banner: "You're the captain — tap the letter",
      hm_cap_only: "Only the captain taps — tell {name} the letter",
      hm_cap_only_toast: "Only the captain taps",
      hm_take_back: "Typo? Take it back",
      hm_take_back_late: "Too late, the word is in play",
      hm_word_coming: "The word is coming…",
      hm_next_captain: "Next captain",
      hm_team_wrote: "Written by {name} of the {team}",
      hm_team_draw: "A draw! Both teams level",
      hm_team_won: "🏆 {team} wins!",
      hm_lobby_rounds_teams: "How many words? (half for each team)",
      hm_lobby_cat: "Category",
      hm_cat_all: "A bit of everything",
      hm_cat_countries: "Countries & landmarks",
      hm_cat_animals: "Animals",
      hm_cat_food: "Food & drink",
      hm_cat_films: "Films",
      hm_cat_football: "Football",
      hm_cat_singers: "Singers",
      hm_cat_actors: "Actors",
      hm_cat_famous: "Famous people",
      hm_cat_cartoons: "Cartoons",
      hm_cat_home: "Home & tools",
      hm_cat_jobs: "Jobs",
      hm_cat_sports: "Sports",
      hm_cat_hidden: "No category",
    }
  },
  rules: {
    ar: {
      hangman: `
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li>واحد يكتب كلمة، أو اسم مشهور أو فيلم لحد 3 كلمات (مش جملة)، والباقي يشوفوا مربع لكل حرف ومسافة بين الكلمات. تقدر تكتب <b>تلميح</b> لو حابب (ممثل، فيلم…)، أو تسيبه فاضي.</li>
                <li>خمّن حرف: لو في الكلمة <b>بيظهر في كل مكانه</b>. لو مش فيها بيترسم <b>حتة من الراجل</b>.</li>
                <li><b>6 غلطات</b> والراجل يتشنق، حلّ الكلمة قبلها. <b>المستوى</b>: سهل 8 غلطات، عادي 6، صعب 4، والراجل بيترسم حتت أصغر أو أكبر على قدّها.</li>
                <li>تقدر تخمّن <b>الكلمة كلها</b> مرة واحدة: لو غلط بتتحسب حتة زي الحرف الغلط.</li>
                <li><b>مساعدات</b>، كل واحدة مرة في الكلمة: «اكشف حرف» بيوريك حرف من الكلمة، و«شيل ٣ حروف غلط» بيطفّي 3 زراير مش في الكلمة. كل مساعدة بتشيل <b>3 نقط</b> من الكلمة لو حلّيتها.</li>
                <li>اللي بيكتب يقدر يدّي لحد <b>3 تلميحات</b>: الأول باين من الأول، التاني بيفتح عند الغلطة التانية، والتالت عند الرابعة.</li>
                <li><b>اتكتبت غلط؟</b> بعد «جاهزة» اللي كتب عنده <b>5 ثواني</b> يرجّع الكلمة ويصلّحها، قبل ما حد يخمّن. في الغرفة التخمين بيبدأ بعد الـ5 ثواني دول.</li>
                <li><b>🔥 ورا بعض</b>: الكلمة التانية اللي تحلها ورا بعض +2، التالتة +4… لحد +10. أول كلمة ماتحلهاش العدّ يرجع من الأول.</li>
                <li>لما الكلمة تتحل الراجل بيهرب بطريقة من 8 (منطاد، توكتوك، العيلة تشدّه…)، ولما الغلطات تخلص بيحصل له حاجة تضحّك من 8 (طبق فول، جردل مية، طماطم من الجمهور…). عمرها ما بتتكرر مرتين ورا بعض.</li>
                <li>في العربي كل حرف زرار واحد: <b>ا</b> بتفتح أ إ آ، و<b>ه</b> بتفتح ة، و<b>ي</b> بتفتح ى، والعكس كمان: لو الكلمة كلها اتكتبت بـ أ أو ا، الاتنين واحد. الكلمة بتبان زي ما اتكتبت بالظبط.</li>
            </ol>
            <p class="help-sub">📱 لاتنين على موبايل</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>واحد يكتب والحروف مستخبية، والتاني يبص بعيد، وبعدين ياخد الموبايل ويخمّن. الكلمة الجاية تتبدّلوا. اللي يحلّها ياخد 10 (والـ🔥 والمساعدات زي فوق)، ولو ماتحلتش اللي كتبها ياخد 10. المستوى بتختاروه قبل ما تبدأوا.</li>
            </ul>
            <p class="help-sub">👥 كل واحد من موبايله</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li><b>واحد يكتب</b>: كل واحد يخمّن الكلمة على لوحته، واللي بيكتب بيتغيّر كل كلمة. اللي يحلّها ياخد 10، والأول +5، التاني +4… واللي كتبها ياخد 5 عن كل واحد ماحلّهاش — بس لو واحد على الأقل حلّها، ومش أكتر من أعلى واحد حلّها. كلمة محدش عرفها ملهاش نقط.</li>
                <li><b>سباق</b>: التطبيق بيدّي الكل نفس الكلمة (أو اسم ممثل أو لاعب أو فيلم) ونوعها. اللي يحلّها ياخد 10، والأول +5، التاني +4… وهكذا. المضيف بيختار <b>النوع</b>: «من كل حاجة» أو قايمة (دول، حيوانات، أكل، أفلام، كورة، مطربين، ممثلين…). في السهل الكلمة قصيرة، وفي الصعب طويلة ومن غير ما نقول نوعها.</li>
                <li><b>فريق ضد فريق</b>: المضيف بيقسّم فريقين. واحد من فريق يكتب الكلمة (بالدور)، والفريق التاني يتشاور بصوت عالي و<b>الكابتن</b> بتاعه (بيتغيّر كل كلمة) هو اللي يدوس. الفريقين بيتبدّلوا كل كلمة. الحل بـ10 (والـ🔥 والمساعدات) لكل واحد في الفريق، والكلمة اللي ماتتحلش محدش ياخد فيها حاجة. موبايل الكابتن مكتوب عليه 🧢 «إنت الكابتن»، والباقيين زراير الحروف عندهم مطفية.</li>
                <li>المضيف بيختار المستوى، و3 أو 5 أو 10 كلمات (4 أو 6 أو 10 للفرق)، ووقت للكلمة لو حابب (60 أو 90 ثانية).</li>
            </ul>
            <p class="help-sub">📺 على التلفزيون</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>راجل كل واحد وكام حرف لقى، من غير الحروف نفسها، عشان محدش يغش من الشاشة. والكلمة بتبان في الآخر. في فريق ضد فريق لوحة الفريق كبيرة على الشاشة، والنهاية بتتلعب عليها.</li>
            </ul>`,
    },
    en: {
      hangman: `
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li>One writes a word, or a famous name or a film of up to 3 words (never a sentence); everyone else sees a box for each letter and a gap between the words. A <b>hint</b> is up to the writer (an actor, a film…), or none.</li>
                <li>Guess a letter: in the word, <b>it shows everywhere it stands</b>. Not in it, <b>a piece of the man</b> is drawn.</li>
                <li><b>6 misses</b> and he's hanged: solve the word before that. <b>The level</b>: Easy 8 misses, Normal 6, Hard 4, and the man comes in smaller or bigger pieces to match.</li>
                <li>You can guess <b>the whole word</b> at once: wrong, it costs a piece like a wrong letter.</li>
                <li><b>Lifelines</b>, each once a word: «Show a letter» shows one letter of the word, and «Remove 3 wrong» greys out 3 keys that aren't in it. Each one used takes <b>3 points</b> off that word if you solve it.</li>
                <li>The writer can give up to <b>3 hints</b>: the first shows from the start, the second opens on your 2nd miss and the third on your 4th.</li>
                <li><b>A typo?</b> After «Ready» the writer has <b>5 seconds</b> to take the word back and fix it, before anyone guesses. In a room the guessing starts once those 5 seconds are up.</li>
                <li><b>🔥 In a row</b>: your 2nd word solved in a row +2, the 3rd +4… up to +10. A word you don't solve starts it over.</li>
                <li>When the word is solved the man escapes one of 8 ways (a balloon, a tuk-tuk, the family pulls him free…); when the misses run out something funny happens to him, one of 8 (a plate of beans, a bucket of water, tomatoes from the crowd…). Never the same one twice in a row.</li>
                <li>In Arabic each letter is one key: <b>ا</b> opens أ إ آ, <b>ه</b> opens ة and <b>ي</b> opens ى, and the other way round: a whole word typed with أ or with ا is the same word. The word shows exactly as it was typed.</li>
            </ol>
            <p class="help-sub">📱 Two on one phone</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>One types with the letters hidden while the other looks away, then hands the phone over to be guessed. Swap for the next word. A solve scores 10 (with the 🔥 and the lifelines as above); a word not solved scores 10 for its writer. Pick the level before you start.</li>
            </ul>
            <p class="help-sub">👥 Everyone on their own phone</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li><b>One writes</b>: everyone guesses the word on their own board, and the writer changes every word. A solve scores 10, the first +5, the second +4, and so on; the writer scores 5 for everyone who doesn't solve it — only if at least one person solved it, and never more than the best solver took. A word nobody gets scores nothing.</li>
                <li><b>A race</b>: the app gives everyone the same word (or an actor, a footballer, a film) and its kind. A solve scores 10, the first +5, the second +4, and so on. The host picks <b>the category</b>: «A bit of everything» or one list (countries, animals, food, films, football, singers, actors…). At Easy the word is short; at Hard it is long and its kind isn't shown.</li>
                <li><b>Team v team</b>: the host splits two teams. One of a team writes the word (in turn); the other team talks it over out loud and its <b>captain</b> (a new one every word) taps. The teams swap every word. A solve is 10 (with the 🔥 and the lifelines) for everyone on the team; a word not solved scores nobody. The captain's phone says 🧢 «You're the captain»; the others' letter keys are off.</li>
                <li>The host picks the level, 3, 5 or 10 words (4, 6 or 10 for teams), and a clock for each word if they like (60 or 90 seconds).</li>
            </ul>
            <p class="help-sub">📺 On the TV</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>Everyone's man and how many letters they've found, never the letters themselves, so nobody copies from the screen. The word shows at the end. In team v team the team's board is big on the screen, and its ending plays there.</li>
            </ul>`,
    }
  }
});
