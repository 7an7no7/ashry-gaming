/* bughouse: the words only this game's screens show, and its rules (Help, the
   first-play card). The build puts them into TRANSLATIONS and GAME_RULES (tools/game-text.cjs):
   read them as t.<key> and GAME_RULES[lang].<id>, as everywhere. */
gameText({
  translations: {
    ar: {
      bh_board: "لوحة {n}",
      bh_partner: "شريكك",
      bh_mine_board: "لوحتك",
      bh_partner_board: "لوحة شريكك",
      bh_swap: "دوس عشان تكبّرها",
      bh_hand_empty: "الإيد فاضية",
      bh_your_move: "دورك! حرّك قطعة أو نزّل واحدة من إيدك",
      bh_turn_of: "دور {name}",
      bh_stuck: "مفيش نقلة: استنى قطعة من شريكك (ساعتك شغالة)",
      bh_drop_pick: "اختار مربع فاضي تنزّل فيه {piece}",
      bh_watch: "انت بتتفرج: تلعب اللعبة الجاية",
      bh_watch_status: "الشطرنج على لوحتين: اتفرج",
      bh_tv_status: "اللي يتاكل يروح لإيد الشريك على اللوحة التانية",
      bh_sub: "🤖 الكمبيوتر بيكمّل مكان {name}",
      bh_won: "فريق {names} كسب!",
      bh_end_mate: "كش مات على لوحة {n}",
      bh_end_time: "وقت {name} خلص على لوحة {n}",
      bh_end_resign: "{name} استسلم",
      bh_again: "نلعب تاني بشركاء جداد",
      bh_resign_confirm: "تستسلم؟ فريقك كله هيخسر.",
      bh_lobby_hint: "أربعة على لوحتين. شريكك على اللوحة التانية باللون التاني، وكل حاجة تاكلها تروح لإيده ينزّلها.",
      bh_lobby_fill: "فاضل {n} مكان: هياخدهم كمبيوتر سهل. عايز صعب؟ ضيفه من الزرار.",
      bh_lobby_full: "الأربع أماكن اتملوا.",
      bh_lobby_watch: "أول أربعة يلعبوا، و{n} يتفرجوا ويدخلوا اللعبة الجاية.",
      bh_clock: "الساعة (لكل لاعب)",
      bh_clock_hint: "الساعة شغالة على طول على اللوحتين. اللي وقته يخلص، فريقه يخسر.",
    },
    en: {
      bh_board: "Board {n}",
      bh_partner: "partner",
      bh_mine_board: "yours",
      bh_partner_board: "your partner's",
      bh_swap: "Tap to make it big",
      bh_hand_empty: "Empty hand",
      bh_your_move: "Your move: play a piece or drop one from your hand",
      bh_turn_of: "{name} to move",
      bh_stuck: "No move: wait for a piece from your partner (your clock runs)",
      bh_drop_pick: "Pick an empty square for the {piece}",
      bh_watch: "You're watching: you play the next game",
      bh_watch_status: "Chess on two boards: watch",
      bh_tv_status: "What is taken goes to the partner's hand on the other board",
      bh_sub: "🤖 The computer plays on for {name}",
      bh_won: "{names} win!",
      bh_end_mate: "Checkmate on board {n}",
      bh_end_time: "{name} ran out of time on board {n}",
      bh_end_resign: "{name} resigned",
      bh_again: "Play again with new partners",
      bh_resign_confirm: "Resign? Your whole team loses.",
      bh_lobby_hint: "Four on two boards. Your partner plays the other colour on the other board, and whatever you take goes to their hand to drop.",
      bh_lobby_fill: "{n} seat(s) left: an easy computer player takes each. Want a hard one? Add it with the button.",
      bh_lobby_full: "All four seats are taken.",
      bh_lobby_watch: "The first four play; {n} watch and play the next game.",
      bh_clock: "Clock (each player)",
      bh_clock_hint: "Both boards' clocks always run. Whoever runs out loses for their team.",
    }
  },
  rules: {
    ar: {
      bughouse: `
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li>أربعة على <b>لوحتين</b>، فريقين. شريكك على اللوحة التانية <b>باللون التاني</b>: لو انت أبيض على لوحة ١، هو أسود على لوحة ٢.</li>
                <li>كل لوحة شطرنج عادي: نفس النقلات، والكش، والتبييت، والترقية.</li>
                <li>أي قطعة <b>تاكلها</b> بتطير <b>لإيد شريكك</b> على اللوحة التانية.</li>
                <li>في دورك: يا <b>تحرّك</b> قطعة، يا <b>تنزّل</b> قطعة من إيدك على أي مربع فاضي. العسكري ماينزلش في الصف الأول ولا الأخير.</li>
                <li>التنزيل ممكن يعمل كش، وممكن يعمل <b>كش مات</b>. ولو ملكك في كش، ينفع تسدّ الكش بقطعة تنزّلها (أو تهرب بالملك عادي).</li>
                <li>العسكري اللي اترقى لو اتاكل، بيروح للشريك <b>عسكري</b> تاني.</li>
                <li>أول <b>كش مات</b> على أي لوحة يكسّب فريقه كله.</li>
                <li>الساعة <b>شغالة على طول</b> (دقيقتين، 3 أو 5 لكل لاعب)، على اللوحتين في نفس الوقت. اللي وقته يخلص، فريقه يخسر.</li>
                <li>لو مفيش عندك نقلة ولا حاجة في إيدك، <b>استنى</b> قطعة من شريكك: ساعتك شغالة.</li>
            </ol>
            <p class="help-sub">📱 كل واحد من موبايله</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>لوحتك كبيرة، واللي قدامك فوقها وانت تحتها، وكل واحد جنبه ساعته وإيده.</li>
                <li>دوس على قطعة في إيدك والمربعات اللي تنفع تنور، ودوس على مربع. أو اسحبها وحطها على اللوحة.</li>
                <li>لوحة شريكك صغيرة جنبها، بإيدينهم وساعاتهم. دوس عليها عشان تكبّرها، ودوس تاني ترجّع.</li>
                <li>ناقصين؟ الأماكن الفاضية بياخدها <b>كمبيوتر</b> (سهل أو صعب). ولو حد خرج في النص، الكمبيوتر يكمّل لوحته لحد آخر اللعبة.</li>
                <li>«نلعب تاني» بتغيّر الشركاء. ولو أكتر من أربعة، اللي اتفرج يلعب الجاية.</li>
            </ul>
            <p class="help-sub">📺 على التلفزيون</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>اللوحتين جنب بعض، والأربع أسامي والأربع ساعات والإيدين، وكل قطعة بتتاكل تطير لإيد الشريك.</li>
            </ul>
            <p class="help-sub">💡 نصايح</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>كلّم شريكك! "هات حصان" أو "ماتاكلش الوزير" بتفرق جامد.</li>
                <li>حصان ينزل جنب الملك بيعمل كش مات كتير.</li>
            </ul>`,
    },
    en: {
      bughouse: `
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li>Four players on <b>two boards</b>, two teams. Your partner plays <b>the other colour</b> on the other board: White on board 1, Black on board 2.</li>
                <li>Each board is ordinary chess: the same moves, check, castling and promotion.</li>
                <li>Every piece you <b>take</b> flies to <b>your partner's hand</b> on the other board.</li>
                <li>On your move: <b>move</b> a piece, or <b>drop</b> one from your hand onto any empty square. A pawn is never dropped on the first or last row.</li>
                <li>A drop may give check, and may give <b>checkmate</b>. In check, a drop can block it (or the king moves away as usual).</li>
                <li>A promoted pawn that is taken goes over as a <b>pawn</b> again.</li>
                <li>The first <b>checkmate</b> on either board wins for that whole team.</li>
                <li>The clock <b>always runs</b> (2, 3 or 5 minutes each), on both boards at once. Whoever runs out loses for their team.</li>
                <li>No move and nothing in your hand? <b>Wait</b> for a piece from your partner: your clock runs.</li>
            </ol>
            <p class="help-sub">📱 Each on their own phone</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>Your board is big, your opponent above it and you below, each with a clock and a hand.</li>
                <li>Tap a piece in your hand and the squares it can go to light up, then tap one. Or drag it onto the board.</li>
                <li>Your partner's board is small beside it, with its hands and clocks. Tap it to make it big, tap again to swap back.</li>
                <li>Short of four? <b>Computer players</b> (easy or hard) take the empty seats. If someone leaves mid-game, the computer plays on for them until the end.</li>
                <li>"Play again" changes the partners. With more than four, whoever watched plays next.</li>
            </ul>
            <p class="help-sub">📺 On the TV</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>Both boards side by side, four names, four clocks and the hands; every piece taken flies to the partner's hand.</li>
            </ul>
            <p class="help-sub">💡 Tips</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>Talk to your partner! "I need a knight" or "don't take the queen" changes everything.</li>
                <li>A knight dropped next to the king mates more often than you'd think.</li>
            </ul>`,
    }
  }
});
