/* chesspuzzle: the words only this game's screens show, and its rules (Help, the
   first-play card). The build puts them into TRANSLATIONS and GAME_RULES (tools/game-text.cjs):
   read them as t.<key> and GAME_RULES[lang].<id>, as everywhere. */
gameText({
  translations: {
    ar: {
      chpz_level_hint_1: "كش مات في نقلة، أو حجر تكسبه على طول.",
      chpz_level_hint_2: "نقلتين، أو نقلة هادية تحضّر لحاجة.",
      chpz_level_hint_3: "تلات نقلات، أو تضحية لازم تشوف بعدها.",
      chpz_solved_n: "حليت {n}",
      chpz_turn_win: "العب واكسب",
      chpz_turn_mate: "موّت في {n} نقلات",
      chpz_turn_mate1: "موّت في نقلة واحدة",
      chpz_you_w: "انت الأبيض",
      chpz_you_b: "انت الأسود",
      chpz_your_move: "دورك!",
      chpz_pile_title: "اللي غلبوني",
      chpz_pile_desc: "الألغاز اللي غلطت فيها أو شفت حلها: حلّ كل واحد مرتين ورا بعض ويخرج.",
      chpz_pile_none: "لسه مفيش: أي لغز تغلط فيه أو تشوف حله بييجي هنا تجرّبه تاني.",
      chpz_pile_empty: "مفيش ألغاز غلبتك دلوقتي!",
      chpz_pile_next: "اللي بعده",
      chpz_pile_later: "ده الوحيد اللي فاضل: تعالاله بعدين.",
      chpz_pile_done: "خلّصت كل اللي غلبوك!",
      chpz_pile_cleared: "حليته مرتين ورا بعض: خرج من «اللي غلبوني»",
      chpz_right: "✅ صح! استنى ردّه…",
      chpz_again: "✅ صح! كمّل",
      chpz_wrong: "❌ مش دي",
      chpz_solved: "✅ اتحلّت!",
      chpz_solved_clean: "✅ اتحلّت من أول مرة!",
      chpz_showing: "👀 ده الحل…",
      chpz_shown: "👀 ده كان الحل",
      chpz_failed: "❌ مش دي… ده كان الحل",
      chpz_hint: "تلميح",
      chpz_hint_line: "حرّك {piece}",
      chpz_hint_more: "تلميح تاني",
      chpz_motif_fork: "شوكة",
      chpz_motif_pin: "تثبيت",
      chpz_motif_skewer: "سيخ",
      chpz_motif_discovered: "هجوم مكشوف",
      chpz_motif_mate: "كش مات",
      chpz_motif_promotion: "ترقية",
      chpz_motif_hanging: "قطعة سايبة",
      chpz_motif_sacrifice: "تضحية",
      chpz_motif_material: "مكسب قطعة",
      chpz_motif_hint_fork: "دوّر على شوكة: قطعة واحدة بتهاجم اتنين مرة واحدة",
      chpz_motif_hint_pin: "دوّر على تثبيت: قطعة مش قادرة تتحرك من غير ما اللي وراها يتاخد",
      chpz_motif_hint_skewer: "دوّر على سيخ: هاجم قطعة كبيرة، ولما تتحرك خد اللي وراها",
      chpz_motif_hint_discovered: "دوّر على هجوم مكشوف: حرّك قطعة تفتح السكة لقطعة تانية",
      chpz_motif_hint_mate: "بص على كل الكشّات",
      chpz_motif_hint_promotion: "فيه عسكري قرّب يترقّى",
      chpz_motif_hint_hanging: "فيه قطعة محدش حاميها",
      chpz_motif_hint_sacrifice: "ممكن تدّي قطعة عشان تكسب أكتر",
      chpz_motif_hint_material: "بص على الأخد والكشّات",
      chpz_show: "شوف الحل",
      chpz_next: "لغز تاني",
      chpz_mistakes_title: "ألغاز من أخطائك",
      chpz_mistakes_desc: "المواقف اللي غلطت فيها في أدوارك: لاقي الأحسن.",
      chpz_mistakes_none: "العب دور وراجعه الأول، وغلطاتك هتبقى ألغاز هنا.",
      chpz_mistakes_all: "حليتهم كلهم! تقدر تلفّ عليهم تاني.",
      chpz_mistakes_next: "الغلطة اللي بعدها",
      chpz_mistakes_done: "خلّصت ألغاز أخطائك!",
      chpz_turn_better: "لاقي أحسن نقلة",
      chpz_you_played: "في الدور لعبت هنا {san} ({cls}).",
      chpz_back_review: "ارجع للمراجعة",
      chpz_streak_title: "سلسلة الألغاز",
      chpz_streak_desc: "3 قلوب ومن غير وقت، وكل ما تحل بتصعب.",
      chpz_streak_solved: "لغز اتحلّ",
      chpz_streak_next: "اللغز اللي بعده",
      chpz_streak_over: "خلصت القلوب!",
      chpz_streak_best: "أحسن رقم ليك: {n}",
      chpz_streak_again: "سلسلة جديدة",
      chpz_daily_title: "لغز اليوم",
      chpz_daily_desc_1: "النهارده سهل، ونفس اللغز عند الكل.",
      chpz_daily_desc_2: "لغز متوسط، ونفس اللغز عند الكل.",
      chpz_daily_desc_3: "الجمعة صعب! ونفس اللغز عند الكل.",
      chpz_daily_first: "من أول محاولة!",
      chpz_daily_tries: "اتحلّ في {n} محاولات.",
      chpz_daily_hint: "اتحلّ بتلميح.",
      chpz_daily_gaveup: "شفت الحل. بكرة لغز جديد!",
    },
    en: {
      chpz_level_hint_1: "Mate in one, or a piece to win at once.",
      chpz_level_hint_2: "Two moves, or a quiet move that sets something up.",
      chpz_level_hint_3: "Three moves, or a sacrifice you have to see past.",
      chpz_solved_n: "{n} solved",
      chpz_turn_win: "play and win",
      chpz_turn_mate: "mate in {n}",
      chpz_turn_mate1: "mate in one",
      chpz_you_w: "You're White",
      chpz_you_b: "You're Black",
      chpz_your_move: "Your move!",
      chpz_pile_title: "The ones that beat me",
      chpz_pile_desc: "Puzzles you got wrong or gave up on: solve each twice in a row and it leaves.",
      chpz_pile_none: "None yet: any puzzle you get wrong or give up on comes here to try again.",
      chpz_pile_empty: "No puzzles have beaten you right now!",
      chpz_pile_next: "Next one",
      chpz_pile_later: "That's the only one left: come back to it later.",
      chpz_pile_done: "You've beaten every one that beat you!",
      chpz_pile_cleared: "Solved twice in a row: it left the pile",
      chpz_right: "✅ Right! Wait for the reply…",
      chpz_again: "✅ Right! Keep going",
      chpz_wrong: "❌ Not that one",
      chpz_solved: "✅ Solved!",
      chpz_solved_clean: "✅ Solved at the first try!",
      chpz_showing: "👀 Here's the solution…",
      chpz_shown: "👀 That was the solution",
      chpz_failed: "❌ Not that one… this was the solution",
      chpz_hint: "Hint",
      chpz_hint_line: "Move your {piece}",
      chpz_hint_more: "Another hint",
      chpz_motif_fork: "Fork",
      chpz_motif_pin: "Pin",
      chpz_motif_skewer: "Skewer",
      chpz_motif_discovered: "Discovered attack",
      chpz_motif_mate: "Checkmate",
      chpz_motif_promotion: "Promotion",
      chpz_motif_hanging: "Hanging piece",
      chpz_motif_sacrifice: "Sacrifice",
      chpz_motif_material: "Winning material",
      chpz_motif_hint_fork: "Look for a fork: one piece attacking two at once",
      chpz_motif_hint_pin: "Look for a pin: a piece that can't move without giving up the one behind it",
      chpz_motif_hint_skewer: "Look for a skewer: attack a big piece, and when it moves take the one behind it",
      chpz_motif_hint_discovered: "Look for a discovered attack: move one piece to open a line for another",
      chpz_motif_hint_mate: "Look at every check",
      chpz_motif_hint_promotion: "A pawn is close to promoting",
      chpz_motif_hint_hanging: "A piece is left unguarded",
      chpz_motif_hint_sacrifice: "Giving a piece up can win more",
      chpz_motif_hint_material: "Look at the captures and the checks",
      chpz_show: "Show the solution",
      chpz_next: "Another puzzle",
      chpz_mistakes_title: "Puzzles from your mistakes",
      chpz_mistakes_desc: "Positions you went wrong in: find the better move.",
      chpz_mistakes_none: "Play a game and review it first: your mistakes become puzzles here.",
      chpz_mistakes_all: "All solved! You can go round them again.",
      chpz_mistakes_next: "Next mistake",
      chpz_mistakes_done: "No mistakes left to solve!",
      chpz_turn_better: "find the best move",
      chpz_you_played: "In the game you played {san} here ({cls}).",
      chpz_back_review: "Back to the review",
      chpz_streak_title: "Puzzle streak",
      chpz_streak_desc: "3 hearts, no clock, and harder as you go.",
      chpz_streak_solved: "solved",
      chpz_streak_next: "Next puzzle",
      chpz_streak_over: "Out of hearts!",
      chpz_streak_best: "Your best: {n}",
      chpz_streak_again: "New streak",
      chpz_daily_title: "Puzzle of the day",
      chpz_daily_desc_1: "Easy today, the same puzzle for everyone.",
      chpz_daily_desc_2: "A medium one, the same puzzle for everyone.",
      chpz_daily_desc_3: "Friday is hard! The same puzzle for everyone.",
      chpz_daily_first: "At the first try!",
      chpz_daily_tries: "Solved in {n} tries.",
      chpz_daily_hint: "Solved with a hint.",
      chpz_daily_gaveup: "You saw the solution. A new one tomorrow!",
    }
  },
  rules: {
    ar: {
      chesspuzzle: `
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li>الرقعة فيها وضع من دور، وفوقها مكتوب <b>مين عليه الدور والمطلوب</b>: يكسب (حجر أو أكتر)، أو يموّت في نقلة أو اتنين أو تلاتة. أول سطر بيقولك بالخط الكبير «انت الأبيض» أو «انت الأسود»، وحجارتك دايماً تحت.</li>
                <li>لاقي <b>النقلة اللي بتكسب</b>: دوس على الحجر وبعدين على المربع، أو اسحبه بصباعك.</li>
                <li><b>صح</b>: المربع بينوّر أخضر، والتاني <b>بيرد لوحده</b> بعد نص ثانية، وتكمّل لحد آخر النقلة. كش مات بأي طريقة بيتحسب صح.</li>
                <li><b>غلط</b>: الحجر بيرجع مكانه ويتهز والمربع ينوّر أحمر، ومكتوب «مش دي». جرّب تاني.</li>
                <li><b>💡 تلميح</b> بيعلّم الحجر اللي لازم يتحرك، و<b>👀 شوف الحل</b> بيلعب الحل كله قدامك.</li>
            </ol>
            <p class="help-sub">🧩 الألغاز</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>الكمبيوتر بتاع التطبيق هو اللي عاملها من أدوار لعبها مع نفسه، وكل لغز ليه <b>نقلة واحدة بس بتكسب</b> في كل خطوة.</li>
                <li><b>سهل</b>: كش مات في نقلة أو حجر تكسبه على طول. <b>متوسط</b>: نقلتين أو نقلة هادية. <b>صعب</b>: تلات نقلات أو تضحية. وكل لغز عليه تقييم ⭐ على قد صعوبته.</li>
                <li>الرقعة 2D زي الشطرنج، و<b>🧊 3D</b> على الرقعة لو حبيت.</li>
                <li>لو قفلت التطبيق في نص لغز، بترجع لنفس اللغز ونفس النقلة.</li>
            </ul>
            <p class="help-sub">📅 لغز اليوم</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>لغز واحد كل يوم، <b>نفس اللغز عند الكل</b>: متوسط معظم الأيام، سهل يوم السبت، وصعب يوم الجمعة. وهو كمان في <b>تحدي اليوم</b>.</li>
                <li>بيتلعب مرة واحدة: النتيجة ♟️ ✅ من أول محاولة، ♟️ ✅ 2 (عدد المحاولات)، ♟️ 💡 بتلميح، أو ♟️ ❌ لو شفت الحل. وتقدر تبعتها.</li>
            </ul>
            <p class="help-sub">🔥 سلسلة الألغاز</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>معاك <b>3 قلوب</b> ومفيش وقت. أول لغز سهل (تقييمه حوالي 500)، و<b>كل لغز تحله اللي بعده بيصعب</b> شوية.</li>
                <li><b>نقلة غلط بتاخد قلب</b> واللغز بيخلص: الحل بيتلعب قدامك، وتدوس «اللغز اللي بعده». مفيش تلميح ولا «شوف الحل» هنا.</li>
                <li>التالت غلطة بتنهي السلسلة: النتيجة عدد الألغاز اللي حليتها، وأحسن رقم بيتحفظ على موبايلك، وتقدر تبعتها.</li>
            </ul>
            <p class="help-sub">📝 ألغاز من أخطائك</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>بعد ما <b>تراجع دور</b> (ضد الكمبيوتر، أو في غرفة، أو اتنين على موبايل)، كل نقلة المراجعة قالت عليها <b>غلطة أو غلطة كبيرة</b> بتاعتك بتبقى لغز: نفس الوضع، والمطلوب تلاقي النقلة الأحسن.</li>
                <li>أي نقلة قريبة من أحسن نقلة بتتحسب صح، بس النقلة اللي لعبتها في الدور لأ. الأحدث الأول، واللي حليته بيروح في الآخر.</li>
                <li>من المراجعة كمان: على الغلطة دوس <b>🧩 جرّبها كلغز</b>، ولما تخلص ترجع للمراجعة.</li>
            </ul>
            <p class="help-sub">🔁 اللي غلبوني</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>أي لغز <b>غلطت فيه أو شفت حله</b> (لغز عادي، لغز اليوم، أو في السلسلة) بيتحفظ على موبايلك في «اللي غلبوني»، وتجرّبه تاني بعدين من صفحة الألغاز. الأقدم الأول.</li>
                <li>لما <b>تحله مرتين ورا بعض</b> من غير غلط ولا تلميح، بيخرج. غلطت فيه تاني؟ العد بيبدأ من الأول.</li>
            </ul>`,
    },
    en: {
      chesspuzzle: `
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li>The board shows a position from a game, and above it <b>whose move it is and what to find</b>: to win (a piece or more), or to mate in one, two or three. The first line says big «You're White» or «You're Black», and your pieces are always at the bottom.</li>
                <li>Find <b>the winning move</b>: tap the piece, then the square, or drag it.</li>
                <li><b>Right</b>: the square lights green, the other side <b>replies by itself</b> half a second later, and you carry on to the end of the line. Any mate counts as right.</li>
                <li><b>Wrong</b>: the piece shakes back to its square, the square lights red and it says "Not that one". Try again.</li>
                <li><b>💡 Hint</b> circles the piece to move, and <b>👀 Show the solution</b> plays the whole line for you.</li>
            </ol>
            <p class="help-sub">🧩 The puzzles</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>The app's own engine made them from games it played against itself, and each has <b>one winning move only</b> at every step.</li>
                <li><b>Easy</b>: mate in one, or a piece to win at once. <b>Medium</b>: two moves, or a quiet move. <b>Hard</b>: three moves, or a sacrifice. Every puzzle has a ⭐ rating for how hard it is.</li>
                <li>The board is 2D as in chess, with <b>🧊 3D</b> on the board if you like.</li>
                <li>Close the app in the middle of a puzzle and you come back to the same puzzle and move.</li>
            </ul>
            <p class="help-sub">📅 Puzzle of the day</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>One puzzle a day, <b>the same for everyone</b>: medium most days, easy on Saturday, hard on Friday. It is in the <b>daily challenge</b> too.</li>
                <li>It is played once: ♟️ ✅ at the first try, ♟️ ✅ 2 (the tries), ♟️ 💡 with a hint, or ♟️ ❌ if you saw the solution. You can send it.</li>
            </ul>
            <p class="help-sub">🔥 Puzzle streak</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>You have <b>3 hearts</b> and no clock. The first puzzle is easy (rated about 500), and <b>each one you solve makes the next a bit harder</b>.</li>
                <li><b>A wrong move costs a heart</b> and ends that puzzle: its solution is played for you, then tap "Next puzzle". No hint and no "Show the solution" here.</li>
                <li>The third mistake ends the streak: your score is the puzzles solved, your best is kept on the phone, and you can send it.</li>
            </ul>
            <p class="help-sub">📝 Puzzles from your mistakes</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>Once you <b>review a game</b> (against the computer, in a room, or two on one phone), every move of yours the review called <b>a mistake or a blunder</b> becomes a puzzle: the same position, and you find the better move.</li>
                <li>Any move close to the best counts as right, but never the move you played in the game. The newest come first, and one you solved goes to the end.</li>
                <li>From the review too: on a mistake tap <b>🧩 Try it as a puzzle</b>, and come back to the review when you are done.</li>
            </ul>
            <p class="help-sub">🔁 The ones that beat me</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>Every puzzle <b>you got wrong or gave up on</b> (a free one, the daily, or in the streak) is kept on your phone in «The ones that beat me», to try again later from the puzzles' page. The oldest first.</li>
                <li>Solve it <b>twice in a row</b> with no wrong move and no hint and it leaves. Wrong again? The count starts over.</li>
            </ul>`,
    }
  }
});
