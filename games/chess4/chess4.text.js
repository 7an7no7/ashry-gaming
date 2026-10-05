/* chess4: the words only this game's screens show, and its rules (Help, the
   first-play card). The build puts them into TRANSLATIONS and GAME_RULES (tools/game-text.cjs):
   read them as t.<key> and GAME_RULES[lang].<id>, as everywhere. */
gameText({
  translations: {
    ar: {
      ch4_color_0: "الأحمر",
      ch4_color_1: "الأزرق",
      ch4_color_2: "الأصفر",
      ch4_color_3: "الأخضر",
      ch4_mode_label: "طريقة اللعب",
      ch4_mode_teams: "فرق",
      ch4_mode_ffa: "كل واحد لنفسه",
      ch4_mode_teams_hint: "الأحمر والأصفر ضد الأزرق والأخضر، وشريكك قصادك. اعمل مات لأي حد من الفريق التاني وفريقك يكسب.",
      ch4_mode_ffa_hint: "بالنقط: العسكري 1، الحصان 3، الفيل 5، الطابية 5، الوزير 9، والمات 20. اللي بيخرج قطعه بتفضل رمادي زي الحيطة، ولما يفضل واحد بس الأعلى نقط يكسب.",
      ch4_clock_label: "الساعة",
      ch4_clock_off: "من غير",
      ch4_minutes: "{n} د",
      ch4_clock_hint: "دقايق لكل لاعب، و5 ثواني زيادة مع كل حركة، وأول حركة ليك ببلاش. الوقت يخلص: تخرج (أو فريقك يخسر).",
      ch4_seats_label: "مين بأنهي لون",
      ch4_seats_hint_host: "دوس على لونين تبدّلهم، أو على حد بيتفرج وبعدين على لون. اللون الفاضي بياخده كمبيوتر.",
      ch4_seats_hint: "المضيف هو اللي بيقعّد كل واحد في لونه.",
      ch4_seat_empty: "كمبيوتر (سهل)",
      ch4_seat_clear: "قوّمه",
      ch4_watching_list: "بيتفرجوا",
      ch4_lobby_hint: "الأحمر بيبدأ، والدور بيلف: أحمر، أزرق، أصفر، أخضر.",
      ch4_you: "انت",
      ch4_partner: "شريكك",
      ch4_out: "برّه",
      ch4_your_turn: "دورك!",
      ch4_check_you: "كش! الملك بتاعك في خطر",
      ch4_turn_of: "دور {name}",
      ch4_you_out: "انت خرجت",
      ch4_watching: "بتتفرج",
      ch4_resign: "استسلم",
      ch4_resign_confirm_ffa: "تستسلم؟ هتخرج من اللعبة وقطعك هتفضل على الرقعة رمادي.",
      ch4_resign_confirm_teams: "تستسلم؟ فريقك كله هيخسر.",
      ch4_play_for: "العب مكان {name}",
      ch4_out_mate: "{name} اتعمله مات",
      ch4_out_stalemate: "{name} اتحاصر من غير حركة (بات)",
      ch4_out_resign: "{name} استسلم",
      ch4_out_time: "وقت {name} خلص",
      ch4_out_left: "{name} خرج من الغرفة",
      ch4_pts_to: "{pts} لـ{name}",
      ch4_pass: "{name} مالوش حركة، الدور عدّى",
      ch4_bot_took: "🤖 الكمبيوتر بيكمّل مكان {name}",
      ch4_team_won: "الفريق كسب!",
      ch4_win_team: "كسبوا: {a} و{b}",
      ch4_win_ffa: "الفايز: {names}",
      ch4_draw: "تعادل",
      ch4_why_mate: "بالمات",
      ch4_why_resign: "بالاستسلام",
      ch4_why_time: "الوقت خلص",
      ch4_why_left: "خرج من الغرفة",
      ch4_why_fifty: "50 حركة من غير أكل",
      ch4_why_long: "اللعبة طولت",
      ch4_why_stuck: "محدش عنده حركة",
      ch4_why_last: "فضل لاعب واحد بس",
      ch4_why_finish: "المضيف خلّصها بالنقط",
      ch4_finish: "خلّصها",
      ch4_bots_only: "الكمبيوتر بس اللي فاضل: بيلعب بسرعة",
      ch4_first_left: "أول نقلة",
      ch4_again: "العب تاني",
      ch4_wait_host: "مستنيين المضيف…",
      ch4_moves: "الحركات",
    },
    en: {
      ch4_color_0: "Red",
      ch4_color_1: "Blue",
      ch4_color_2: "Yellow",
      ch4_color_3: "Green",
      ch4_mode_label: "How to play",
      ch4_mode_teams: "Teams",
      ch4_mode_ffa: "Everyone for themselves",
      ch4_mode_teams_hint: "Red and yellow against blue and green, your partner opposite you. Mate either opponent and your team wins.",
      ch4_mode_ffa_hint: "On points: a pawn 1, a knight 3, a bishop 5, a rook 5, a queen 9, a mate 20. A player who is out stays on the board in grey, as walls; when one is left, the highest score wins.",
      ch4_clock_label: "Clock",
      ch4_clock_off: "Off",
      ch4_minutes: "{n} min",
      ch4_clock_hint: "Minutes each, plus 5 seconds a move; your first move is free. Out of time: you're out (or your team loses).",
      ch4_seats_label: "Who plays which colour",
      ch4_seats_hint_host: "Tap two colours to swap them, or someone watching and then a colour. An empty colour gets a computer player.",
      ch4_seats_hint: "The host seats everyone in their colour.",
      ch4_seat_empty: "Computer (easy)",
      ch4_seat_clear: "Take off",
      ch4_watching_list: "Watching",
      ch4_lobby_hint: "Red starts, then the turn goes round: red, blue, yellow, green.",
      ch4_you: "You",
      ch4_partner: "Partner",
      ch4_out: "Out",
      ch4_your_turn: "Your move!",
      ch4_check_you: "Check! Your king is attacked",
      ch4_turn_of: "{name} to move",
      ch4_you_out: "You're out",
      ch4_watching: "Watching",
      ch4_resign: "Resign",
      ch4_resign_confirm_ffa: "Resign? You'll be out, and your pieces stay on the board in grey.",
      ch4_resign_confirm_teams: "Resign? Your whole team loses.",
      ch4_play_for: "Play for {name}",
      ch4_out_mate: "{name} is checkmated",
      ch4_out_stalemate: "{name} is stalemated",
      ch4_out_resign: "{name} resigned",
      ch4_out_time: "{name} ran out of time",
      ch4_out_left: "{name} left the room",
      ch4_pts_to: "{pts} to {name}",
      ch4_pass: "{name} has no move and passes",
      ch4_bot_took: "🤖 The computer plays on for {name}",
      ch4_team_won: "The team wins!",
      ch4_win_team: "Winners: {a} and {b}",
      ch4_win_ffa: "Winner: {names}",
      ch4_draw: "A draw",
      ch4_why_mate: "by checkmate",
      ch4_why_resign: "by resignation",
      ch4_why_time: "on time",
      ch4_why_left: "a player left",
      ch4_why_fifty: "50 moves without a capture",
      ch4_why_long: "the game ran long",
      ch4_why_stuck: "nobody could move",
      ch4_why_last: "one player left",
      ch4_why_finish: "ended by the host, on points",
      ch4_finish: "Finish it",
      ch4_bots_only: "Only computer players left: they play fast",
      ch4_first_left: "First move",
      ch4_again: "Play again",
      ch4_wait_host: "Waiting for the host…",
      ch4_moves: "Moves",
    }
  },
  rules: {
    ar: {
      chess4: `
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li>أربعة على رقعة كبيرة 14×14 من غير الأركان: <b>الأحمر تحت، الأزرق شمال، الأصفر فوق، الأخضر يمين</b>. على موبايلك الرقعة بتلف ولونك يبقى تحت.</li>
                <li>الدور بيلف: <b>أحمر، أزرق، أصفر، أخضر</b>. كل القطع بتتحرك زي الشطرنج العادي، والتبييت من الناحيتين.</li>
                <li>العسكري بيمشي ناحية الجنب التاني (خطوة، أو خطوتين من أول صف)، وبياكل بالوراب لقدام. مفيش أكل في المرور. بيترقّى <b>وزير</b>: في الصف الـ8 من ناحيته (كل واحد لنفسه) أو الـ11 (فرق).</li>
                <li>الكش ممكن ييجي من أي حد، وماينفعش تسيب الملك بتاعك في كش. المات بيتحسب في دورك: لو في دورك الملك في كش ومالكش حركة يبقى <b>مات</b>.</li>
            </ol>
            <p class="help-sub">🤝 فرق</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li><b>الأحمر والأصفر ضد الأزرق والأخضر</b>، وشريكك قصادك. قطع شريكك مابتعملش كش لملكك، ومابتاكلهاش.</li>
                <li>اعمل مات لأي حد من الفريق التاني وفريقك يكسب. واللي مالوش حركة ومش في كش، دوره بيعدّي.</li>
            </ul>
            <p class="help-sub">⚔️ كل واحد لنفسه</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>بالنقط: أكل <b>العسكري 1، الحصان 3، الفيل 5، الطابية 5، الوزير 9</b> (الوزير المترقّي 1)، و<b>المات 20</b> للي حركته عملت الكش.</li>
                <li>اللي يتعمله مات، أو يتحاصر من غير حركة (بات، وياخد هو 20)، أو يستسلم، أو وقته يخلص: <b>بيخرج</b>، وقطعه بتفضل على الرقعة <b>رمادي زي الحيطة</b>: محدش يحرّكها ولا ياكلها.</li>
                <li>لما يفضل لاعب واحد بس، <b>الأعلى نقط يكسب</b> (حتى لو كان خرج).</li>
            </ul>
            <p class="help-sub">📱 كل واحد من موبايله</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>المضيف بيختار طريقة اللعب والساعة، وبيقعّد كل واحد في لونه. اللون الفاضي بياخده <b>لاعب كمبيوتر</b>، فتقدر تلعب حتى لو لوحدك.</li>
                <li>دوس على قطعة تشوف حركاتها (نقطة، ودايرة على اللي تاكله)، وبعدين على الخانة؛ أو اسحب القطعة. وانت ماسك القطعة أو بتنشّن، <b>عدسة مكبّرة</b> فوق صباعك بتوريك الخانة اللي تحته.</li>
                <li>الساعة اختيارية: 1 أو 3 أو 5 دقايق لكل واحد و5 ثواني مع كل حركة. والمضيف يقدر يلعب حركة بدل حد موبايله سكت.</li>
                <li>مع الساعة، أول نقلة لكل واحد ساعتها مش بتمشي، بس ليها <b>45 ثانية</b>: لو خلصوا، الموبايل بيلعب نقلة سهلة مكانه.</li>
                <li>حد خرج من الغرفة؟ في كل واحد لنفسه بيخرج من اللعبة، وفي الفرق الكمبيوتر بيكمّل مكانه.</li>
                <li>لو مافضلش غير الكمبيوتر بيلعب، بيلعب بسرعة، وفي كل واحد لنفسه المضيف عنده <b>⏩ خلّصها</b>: اللعبة تخلص على طول والترتيب بالنقط.</li>
                <li>العب تاني: نفس القعدة والرقعة بتلف لفة، فحد تاني يبقى الأحمر ويبدأ.</li>
            </ul>
            <p class="help-sub">📺 على التلفزيون</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>الرقعة كبيرة والأحمر تحت، وكل لاعب في ركنه بنقطه وساعته، والحركات جنبها.</li>
            </ul>`,
    },
    en: {
      chess4: `
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li>Four on a big 14×14 board without its corners: <b>red at the bottom, blue on the left, yellow at the top, green on the right</b>. On your phone the board turns so your colour is at the bottom.</li>
                <li>The turn goes <b>red, blue, yellow, green</b>. Every piece moves as in ordinary chess, and you can castle both ways.</li>
                <li>Pawns go toward the far side (one square, or two from their first row) and take diagonally forward. No en passant. A pawn becomes a <b>queen</b> on the 8th row from its side (everyone for themselves) or the 11th (teams).</li>
                <li>Check can come from anyone, and you may never leave your king in check. A mate is judged on your own turn: in check with no move on your turn is <b>checkmate</b>.</li>
            </ol>
            <p class="help-sub">🤝 Teams</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li><b>Red and yellow against blue and green</b>, your partner opposite you. Your partner's pieces never check your king, and you can't take them.</li>
                <li>Mate either opponent and your team wins. A player with no move who isn't in check passes.</li>
            </ul>
            <p class="help-sub">⚔️ Everyone for themselves</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>On points: taking a <b>pawn 1, knight 3, bishop 5, rook 5, queen 9</b> (a promoted queen 1), and <b>a mate 20</b> to the player whose move gave the check.</li>
                <li>Mated, stalemated (the stalemated player scores 20), resigning or out of time: <b>you're out</b>, and your pieces stay on the board <b>in grey, as walls</b>: nobody moves them or takes them.</li>
                <li>When one player is left, <b>the highest score wins</b> (even someone who went out).</li>
            </ul>
            <p class="help-sub">📱 Each on their own phone</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>The host picks the way to play and the clock, and seats everyone in their colour. An empty colour gets a <b>computer player</b>, so even one person can play.</li>
                <li>Tap a piece to see its moves (a dot, a ring round what it can take), then tap the square; or drag the piece. While you carry a piece or aim, a <b>magnifier</b> above your finger shows the square under it.</li>
                <li>The clock is optional: 1, 3 or 5 minutes each plus 5 seconds a move. The host can play a move for a phone that went quiet.</li>
                <li>With a clock, everyone's first move doesn't run their clock but has <b>45 seconds</b>: then the phone plays an easy move for them.</li>
                <li>Someone leaves the room? Everyone for themselves: they're out. Teams: the computer plays on for them.</li>
                <li>Once only computer players are still playing, they play fast, and in everyone for themselves the host has <b>⏩ Finish it</b>: the game ends at once, ranked by points.</li>
                <li>Play again: the same table, turned once, so someone else is red and starts.</li>
            </ul>
            <p class="help-sub">📺 On the TV</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>The board big with red at the bottom, each player in their corner with their points and clock, the moves beside it.</li>
            </ul>`,
    }
  }
});
