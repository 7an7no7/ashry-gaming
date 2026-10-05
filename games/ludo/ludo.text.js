/* ludo: the words only this game's screens show, and its rules (Help, the
   first-play card). The build puts them into TRANSLATIONS and GAME_RULES (tools/game-text.cjs):
   read them as t.<key> and GAME_RULES[lang].<id>, as everywhere. */
gameText({
  translations: {
    ar: {
      ludo_color_free: "فاضي",
      ludo_color_label: "الألوان",
      ludo_color_pick: "دوس على لون عشان تاخده. اللي مايختارش ياخد لون لما اللعبة تبدأ.",
      ludo_color_yours: "دوس على لونك تاني عشان تسيبه.",
      ludo_watching_next: "انت بتتفرج اللعبة دي.",
      ludo_seats_label: "بيلعبوا ({n} من 4)",
      ludo_seats_hint_host: "اللعب لـ 4 بس: دوس على اسم عشان يلعب أو يتفرج.",
      ludo_seats_hint: "المضيف بيختار مين يلعب، والباقي بيتفرج.",
      ludo_clock: "وقت الدور",
      ludo_clock_off: "من غير",
      ludo_clock_hint: "لما الوقت يخلص الموبايل بيرمي ويلعب بدل اللاعب.",
      ludo_lobby_hint: "مين يبدأ بيتحدد بالزهر: الأعلى يبدأ.",
      ludo_piece_label: "حجر {color} {n}",
      ludo_home_count: "{n} من 4 في البيت",
      ludo_roll: "ارمي",
      ludo_your_turn: "دورك!",
      ludo_roll_hint: "ارمي الزهر",
      ludo_again_six: "ستة! ارمي تاني",
      ludo_you_rolled: "طلعت {n}",
      ludo_pick_piece: "اختار حجر من اللي بتنوّر",
      ludo_moving_itself: "حجر واحد بس يتحرك: هيتحرك لوحده",
      ludo_rolled: "{name}: الزهر طلع {n}",
      ludo_thinking: "الكمبيوتر بيفكر…",
      ludo_choosing: "مستنيين {name}",
      ludo_turn_of: "دور {name}",
      ludo_over: "خلصت اللعبة",
      ludo_again: "العب تاني",
      ludo_wait_host: "المضيف هيختار اللي بعده.",
      ludo_play_for: "العب بدل {name}",
      ludo_takes: "أكل",
      ludo_rolloff: "مين يبدأ؟",
      ludo_rolloff_again: "تعادل! تاني",
      ludo_ev_first: "البداية: {name}",
      ludo_ev_first_you: "إنت اللي هتبدأ",
      ludo_ev_three: "{name}: 3 ستات ورا بعض، الدور راح",
      ludo_ev_nomove: "{name}: مفيش حركة بالـ{n}",
      ludo_ev_capture: "{name}: أكلة! حجر {other} رجع مكانه",
      ludo_ev_captured_you: "{name}: أكلة! حجرك رجع مكانه",
      ludo_ev_home: "{name}: حجر دخل البيت",
      ludo_ev_out: "{name}: حجر جديد نزل",
      ludo_ev_star: "{name}: حجر على نجمة، في أمان",
      ludo_ev_finish: "{name}: المركز {place}",
      ludo_place_1: "الأول",
      ludo_place_2: "التاني",
      ludo_place_3: "التالت",
      ludo_place_4: "الرابع",
      ludo_ev_clock: "الوقت خلص: الموبايل لعب بدل {name}",
      ludo_ev_host: "المضيف لعب بدل {name}",
      ludo_ev_left: "{name}: خروج من اللعبة",
    },
    en: {
      ludo_color_free: "Free",
      ludo_color_label: "Colours",
      ludo_color_pick: "Tap a colour to take it. Anyone who doesn't gets one at the start.",
      ludo_color_yours: "Tap your colour again to let it go.",
      ludo_watching_next: "You're watching this game.",
      ludo_seats_label: "Playing ({n} of 4)",
      ludo_seats_hint_host: "Four play at most: tap a name to seat them or let them watch.",
      ludo_seats_hint: "The host picks who plays; the rest watch.",
      ludo_clock: "Turn clock",
      ludo_clock_off: "Off",
      ludo_clock_hint: "When it runs out, the phone rolls and moves for the player.",
      ludo_lobby_hint: "The dice decide who starts: highest first.",
      ludo_piece_label: "{color} piece {n}",
      ludo_home_count: "{n} of 4 home",
      ludo_roll: "Roll",
      ludo_your_turn: "Your turn!",
      ludo_roll_hint: "Roll the die",
      ludo_again_six: "A six! Roll again",
      ludo_you_rolled: "You rolled {n}",
      ludo_pick_piece: "Pick one of the glowing pieces",
      ludo_moving_itself: "Only one can move: it moves itself",
      ludo_rolled: "{name} rolled {n}",
      ludo_thinking: "The computer is thinking…",
      ludo_choosing: "Waiting for {name}",
      ludo_turn_of: "{name}'s turn",
      ludo_over: "Game over",
      ludo_again: "Play again",
      ludo_wait_host: "The host picks what's next.",
      ludo_play_for: "Play for {name}",
      ludo_takes: "Takes",
      ludo_rolloff: "Who starts?",
      ludo_rolloff_again: "A tie! Again",
      ludo_ev_first: "{name} starts",
      ludo_ev_first_you: "You start",
      ludo_ev_three: "{name}: three sixes in a row, turn lost",
      ludo_ev_nomove: "{name} can't move with a {n}",
      ludo_ev_capture: "{name} took {other}'s piece",
      ludo_ev_captured_you: "{name} took your piece",
      ludo_ev_home: "{name} brought a piece home",
      ludo_ev_out: "{name} brought a piece out",
      ludo_ev_star: "{name}'s piece is on a star: safe",
      ludo_ev_finish: "{name} finished {place}",
      ludo_place_1: "first",
      ludo_place_2: "second",
      ludo_place_3: "third",
      ludo_place_4: "fourth",
      ludo_ev_clock: "Time's up: the phone played for {name}",
      ludo_ev_host: "The host played for {name}",
      ludo_ev_left: "{name} left the game",
    }
  },
  rules: {
    ar: {
      ludo: `
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li>من 2 لـ 4، كل واحد معاه <b>4 حجارة</b> في بيته، الركن اللي بلونه.</li>
                <li>في دورك ارمي الزهر. الحجر يخرج من بيته <b>بالستة بس</b>، ويقف على الخانة اللي عليها سهم بلونه.</li>
                <li>الحجارة بتلف حوالين اللوحة مع عقارب الساعة، وبعدين تدخل العمود اللي بلونها لحد النص. <b>الدخول للنص بالرقم بالظبط</b>.</li>
                <li>الستة ليها رمية تانية. <b>تالت ستة ورا بعض</b> ماتتلعبش والدور يروح.</li>
                <li>لو وقفت على حجر واحد بلون تاني <b>بتاكله</b>: يرجع بيته. خانات <b>النجمة</b> وخانات البداية <b>أمان</b>: محدش بياكل حد عليها.</li>
                <li>حجرين من نفس اللون على خانة واحدة يبقوا <b>سدّة</b>: محدش تاني يعدّيها ولا يقف عليها.</li>
                <li>أول واحد يدخّل الأربعة يكسب، والباقي يكمّلوا على المركز التاني والتالت.</li>
            </ol>
            <p class="help-sub">💡 الموبايل بيساعدك</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>الحجارة اللي تقدر تتحرك بتنوّر. لو حجر واحد بس يتحرك، بيتحرك لوحده، إلا الحركة اللي بتدخّل آخر حجر ليك: دي بإيدك.</li>
                <li>مفيش حركة بالرقم اللي طلع؟ الدور بيعدّي لوحده.</li>
                <li>اللوحة بتلف عشان بيتك يبقى تحت على الشمال. بالماوس، حط المؤشر على حجر تشوف هيمشي لفين.</li>
            </ul>
            <p class="help-sub">🤖 ضد الموبايل</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>انت ومن 1 لـ 3 لاعبين كمبيوتر، سهل أو صعب، وانت اللي بتختار لونك.</li>
            </ul>
            <p class="help-sub">📱 كل واحد من موبايله</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>كل واحد يختار لونه في الغرفة، واللي مايختارش ياخد لون. البداية بالزهر: الأعلى يبدأ.</li>
                <li>لو في الغرفة أكتر من 4، المضيف بيختار مين يلعب والباقي بيتفرج. ممكن تكمّلوا العدد بلاعبين كمبيوتر.</li>
                <li>وقت الدور اختياري (15 أو 30 ثانية): لما يخلص الموبايل بيرمي ويلعب بدل اللاعب.</li>
            </ul>
            <p class="help-sub">📺 على التلفزيون</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>اللوحة كبيرة قدام الكل، والزهر وكل حركة بتبان عليها.</li>
            </ul>`,
    },
    en: {
      ludo: `
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li>2 to 4 players, each with <b>4 pieces</b> in their yard, the corner in their colour.</li>
                <li>On your turn roll the die. A piece leaves its yard <b>on a 6 only</b>, onto the square with the arrow in its colour.</li>
                <li>Pieces go round the board clockwise, then up the column in their colour to the middle. <b>The middle needs the exact number</b>.</li>
                <li>A 6 rolls again. <b>A third 6 in a row</b> is not played and the turn passes.</li>
                <li>Land on a single piece of another colour and you <b>take it</b>: it goes back to its yard. <b>Star</b> squares and start squares are <b>safe</b>: nobody is taken there.</li>
                <li>Two pieces of one colour on a square are a <b>wall</b>: no one else can pass it or land on it.</li>
                <li>The first to bring all four home wins, and the rest play on for second and third.</li>
            </ol>
            <p class="help-sub">💡 The phone helps</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>The pieces that can move glow. When only one can, it moves itself - except the move that brings your last piece home: that one is yours.</li>
                <li>Nothing can move with what you rolled? The turn passes by itself.</li>
                <li>The board turns so your yard is at the bottom left. With a mouse, point at a piece to see where it would go.</li>
            </ul>
            <p class="help-sub">🤖 Against the phone</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>You and 1 to 3 computer players, easy or hard, in the colour you pick.</li>
            </ul>
            <p class="help-sub">📱 On separate phones</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>Everyone picks a colour in the room; anyone who doesn't gets one. The dice decide who starts: highest first.</li>
                <li>With more than 4 in the room, the host picks who plays and the rest watch. Computer players can fill the seats.</li>
                <li>A turn clock is optional (15 or 30 seconds): when it runs out the phone rolls and moves for the player.</li>
            </ul>
            <p class="help-sub">📺 On the TV</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>The board big in front of everyone, with every roll and every move.</li>
            </ul>`,
    }
  }
});
