/* connect4: the words only this game's screens show, and its rules (Help, the
   first-play card). The build puts them into TRANSLATIONS and GAME_RULES (tools/game-text.cjs):
   read them as t.<key> and GAME_RULES[lang].<id>, as everywhere. */
gameText({
  translations: {
    ar: {
      xo_draws: "تعادل",
      duel_line: "الطابور",
      duel_your_place: "انت رقم {n} في الطابور، وهتلعب لما الدور ييجي عليك",
      duel_next_match: "الماتش الجاي: {a} ضد {b}",
      duel_forfeit: "بالانسحاب",
      duel_auto_c4: "عمود واحد بس فاضي: القرص هينزل لوحده",
      duel_auto_dots: "آخر خط: هيترسم لوحده",
      duel_auto_xo: "مربع واحد بس فاضي: هيتلعب لوحده",
      duel_away_left: "{name} مش متصل: لو مرجعش في {s} ثانية يخسر غياب",
      duel_streak: "{name}: {n} مرات فوز ورا بعض",
      duel_need_two: "مستنيين لاعب تاني يدخل الغرفة",
      tour_to_tour: "اعملوا بطولة",
      c4_mode_4_hint: "اللوحة الكلاسيك: 7 عمدان و6 صفوف.",
      c4_mode_5_hint: "لوحة أعرض: 9 عمدان و6 صفوف، ومحتاج 5 في صف.",
      c4_col: "عمود {n}",
      c4_draw: "تعادل، اللوحة اتملت",
      c4_block: "صدّة!",
      c4_best_blocker: "أحسن صدّاد",
    },
    en: {
      xo_draws: "Draws",
      duel_line: "Next in line",
      duel_your_place: "You're #{n} in line - you play when your turn comes",
      duel_next_match: "Next: {a} vs {b}",
      duel_forfeit: "by forfeit",
      duel_auto_c4: "One column left: your disc drops by itself",
      duel_auto_dots: "The last line: it is drawn for you",
      duel_auto_xo: "One square left: it is played for you",
      duel_away_left: "{name} is offline: back within {s} s or it's a loss",
      duel_streak: "{name}: {n} wins in a row",
      duel_need_two: "Waiting for a second player to join",
      tour_to_tour: "Start a tournament",
      c4_mode_4_hint: "The classic board: 7 columns, 6 rows.",
      c4_mode_5_hint: "A wider board: 9 columns, 6 rows, and five to win.",
      c4_col: "Column {n}",
      c4_draw: "A draw: the board is full",
      c4_block: "Blocked!",
      c4_best_blocker: "Best blocker",
    }
  },
  rules: {
    ar: {
      connect4: `
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li>لوحة زرقا واقفة، وكل واحد له لون: أحمر أو أصفر. بالدور، كل واحد ينزّل قطعة في عمود، والقطعة بتقع لحد أوطى خانة فاضية فيه.</li>
                <li>أول واحد يعمل <b>4 في صف</b> (أفقي، رأسي أو مايل) يكسب. اللوحة اتملت من غير صف؟ تعادل.</li>
                <li>من الإعدادات ممكن تختار <b>5 في صف</b> على لوحة أعرض (9 عمدان بدل 7).</li>
                <li>اللي بدأ الماتش ده، التاني يبدأ الماتش الجاي، والنتيجة بتتجمع ماتش ورا ماتش. مفيش رجوع في الحركة.</li>
                <li>ضد الموبايل: <b>سهل</b> بيسيب فرص، <b>متوسط</b> بيسد ويهاجم، <b>صعب</b> بيحسب كذا حركة لقدام.</li>
            </ol>
            <p class="help-sub">📱 كل واحد من موبايله</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>اتنين بس بيلعبوا في المرة، والباقي بيتفرج على نفس اللوحة من موبايله.</li>
                <li><b>اللي يكسب يفضل قاعد</b>: اللي خسر يروح آخر الطابور، واللي عليه الدور يقعد قصاد الكسبان ويبدأ هو. التعادل: صاحب الكرسي يفضل.</li>
                <li>لو اتنين بس في الغرفة، بيفضلوا يلعبوا والبداية بالدور. ولو حد قاعد خرج من الغرفة، التاني يكسب بالانسحاب.</li>
                <li>لو موبايل اللي عليه الدور فصل <b>دقيقة</b>، بيخسر الماتش ده غياب (وبيفضل في الغرفة)، والعدّاد بيبان عند الباقيين.</li>
                <li>لو فاضل عمود واحد بس ومش هيكسّبك، القرص بينزل لوحده بعد لحظة.</li>
                <li><b>فرق</b> (من 4): كل واحد يختار الأحمر أو الأصفر، والفريق بينزّل بالدور واحد ورا واحد، <b>20 ثانية</b> للدور ولو خلصت الموبايل بينزّل بدالك.</li>
            </ul>
            <p class="help-sub">📺 على التلفزيون</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>اللوحة كبيرة والقطع بتقع قدام الكل، ومعاها النتيجة والطابور.</li>
            </ul>
            <p class="help-sub">💡 نصايح</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>العمود اللي في النص بيدخل في صفوف أكتر من أي عمود، ابدأ بيه.</li>
                <li>قبل ما تنزّل، بص إنت هتفتح لصاحبك مكان فوق قطعتك ولا لأ.</li>
                <li>🧤 <b>صدّة!</b> لما تنزّل في المكان اللي كان صاحبك هيكسب بيه، الجوانتي بيطير على قطعتك. في الغرفة الصدّات بتتعد، وأحسن صدّاد بيتقال في آخر كل ماتش.</li>
            </ul>
            ${TOUR_RULES_HELP.ar}`,
    },
    en: {
      connect4: `
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li>A blue board standing up, and a colour each: red or yellow. Take turns dropping a disc into a column; it falls to the lowest empty cell.</li>
                <li>First to make <b>four in a row</b> (across, down or diagonally) wins. A full board with no line is a draw.</li>
                <li>In the options you can pick <b>five in a row</b> on a wider board (9 columns instead of 7).</li>
                <li>Whoever went second starts the next game, and the score adds up game after game. No take-backs.</li>
                <li>Against the phone: <b>easy</b> leaves chances, <b>medium</b> blocks and attacks, <b>hard</b> thinks several moves ahead.</li>
            </ol>
            <p class="help-sub">📱 On separate phones</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>Two play at a time; everyone else watches the same board on their phone.</li>
                <li><b>Winner stays on</b>: the loser goes to the back of the line, and the next in line sits down against the winner and moves first. A draw: the one in the seat keeps it.</li>
                <li>With just two in the room they keep playing, taking turns to start. If a seated player leaves the room, the other wins by forfeit.</li>
                <li>If the phone whose turn it is goes offline for <b>a minute</b>, that player loses this game by absence (and stays in the room); everyone else sees the count.</li>
                <li>When one column is left and the disc doesn't win you the game, it drops by itself after a moment.</li>
                <li><b>Teams</b> (4+): pick red or yellow; a team drops in turn, one by one, <b>20 seconds</b> each, or the app drops for you.</li>
            </ul>
            <p class="help-sub">📺 On the TV</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>The board big, the discs dropping in front of everyone, with the score and the line.</li>
            </ul>
            <p class="help-sub">💡 Tips</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>The middle column is part of more lines than any other: start there.</li>
                <li>Before you drop, check whether you are opening the cell above for your rival.</li>
                <li>🧤 <b>Blocked!</b> Drop where your rival was about to win and a glove flies to your disc. In a room the blocks are counted, and the best blocker is named after every game.</li>
            </ul>
            ${TOUR_RULES_HELP.en}`,
    }
  }
});
