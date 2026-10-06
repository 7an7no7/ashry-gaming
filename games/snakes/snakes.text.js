/* snakes: the words only this game's screens show, and its rules (Help, the
   first-play card). The build puts them into TRANSLATIONS and GAME_RULES (tools/game-text.cjs):
   read them as t.<key> and GAME_RULES[lang].<id>, as everywhere. */
gameText({
  translations: {
    ar: {
      snk_color_free: "فاضي",
      snk_color_yours: "ده لونك. دوس تاني لو عايز تسيبه.",
      snk_color_pick: "اختار لونك، واللي مايختارش هياخد لون.",
      snk_watching_next: "انت بتتفرج الدور ده، وتلعب اللي بعده.",
      snk_color_label: "الألوان",
      snk_seats_label: "مين بيلعب ({n} من 6)",
      snk_seats_hint_host: "دوس على اسم تدخّله أو تطلّعه: 6 بس بيلعبوا.",
      snk_seats_hint: "المضيف بيختار الـ 6 اللي بيلعبوا.",
      snk_play_for: "ارمي بدل {name}",
      snk_clock: "وقت الدور",
      snk_clock_off: "من غير",
      snk_clock_hint: "لما الوقت يخلص الزهر بيترمي لوحده.",
      snk_lobby_hint: "الخريطة بتتعمل جديدة كل لعبة قدام الكل.",
      snk_again: "لعبة جديدة",
      snk_wait_host: "مستنيين المضيف يبدأ لعبة جديدة…",
      snk_place_1: "الأول",
      snk_place_2: "التاني",
      snk_place_3: "التالت",
      snk_place_4: "الرابع",
      snk_place_5: "الخامس",
      snk_place_6: "السادس",
      snk_start_sq: "ابدأ",
      snk_on_sq: "على {n}",
      snk_on_mat: "لسه برّه",
      snk_ev_first_you: "خريطة جديدة، وانت اللي هتبدأ",
      snk_ev_first: "خريطة جديدة، و{name} هيبدأ",
      snk_ev_snake: "{name} نزل بالتعبان من {from} لـ {to}",
      snk_ev_ladder: "{name} طلع السلم من {from} لـ {to}",
      snk_ev_bounce: "{name} عدّى الـ 100 ورجع لـ {n}",
      snk_ev_roll: "{name} جاب {n} ووصل {to}",
      snk_ev_finish: "{name} وصل الـ 100: المركز {place}",
      snk_ev_host: "المضيف رمى بدل {name}",
      snk_ev_clock: "الوقت خلص: الزهر اترمى بدل {name}",
      snk_ev_left: "{name} خرج من اللعبة",
      snk_over: "اللعبة خلصت",
      snk_your_turn: "دورك!",
      snk_again_six: "ستة! ارمي تاني",
      snk_roll_hint: "دوس ارمي",
      snk_turn_of: "دور {name}",
      snk_thinking: "{name} بيرمي…",
      snk_roll: "ارمي",
      snk_teams_label: "فرق",
      snk_teams_off: "كل واحد لنفسه",
      snk_teams_size: "{n} فرق × {k}",
      snk_teams_two: "فريقين × {k}",
      snk_teams_need: "الفرق محتاجة 4 أو 6 في اللعبة: ضيف لاعب كمبيوتر أو شيل واحد.",
      snk_teams_deal: "وزّع",
      snk_teams_hint: "دوس على اسم وبعدين على اسم في فريق تاني: يتبدّلوا.",
      snk_teams_rule: "الفريق يكسب لما كله يوصل 100، واللي يوصل الأول بيرمي لزميله اللي ورا.",
      snk_team_n: "فريق {n}",
      snk_home: "وصل",
      snk_roll_for: "ترمي لـ {name}",
      snk_ev_for: "{by} رمى لـ {name}",
      snk_ev_home: "{name} وصل البيت",
      snk_ev_team: "فريق {name} وصل كله: {place}",
      snk_ev_charmed: "{name} زمّر للتعبان عند {n} وعدّى",
      snk_ev_s_charm: "{name} خد مزمار الحاوي",
      snk_ev_s_swap: "{name} اتبدّل مع {with}",
      snk_ev_s_swap_none: "{name} وقف على بدّل ومفيش حد قدامه",
      snk_ev_s_again: "{name} لقى نجمة: يرمي تاني",
      snk_ev_s_worker: "العامل شال {name} لـ {to}",
      snk_ev_s_worker_none: "{name} لقى العامل في استراحة",
      snk_ev_s_peel: "{name} اتزحلق على قشرة موز لـ {to}",
      snk_ev_s_nap: "{name} نام: هيفوّت دور",
      snk_ev_nap: "{name} نايم: الدور عدّى عليه",
      snk_ev_move: "تعبان زحف من {from} لـ {to}",
      snk_ev_move_eat: "تعبان زحف لـ {to} وكل {name}",
      snk_aw_title: "جوايز اللعبة",
      snk_aw_tag: "لقطة",
      snk_aw_slow: "بالبطيء ×½",
      snk_aw_again: "اللقطات تاني",
      snk_aw_heroes: "أبطال اللعبة",
      snk_aw_eaten: "أكتر واحد اتاكل",
      snk_aw_ladder: "أطول سلم",
      snk_aw_sixes: "ملك الستات",
      snk_aw_fall: "أنحس رمية",
      snk_aw_from: "من {from} لـ {to}",
      snk_aw_eaten_sub: "التعابين كلته {n} مرات",
      snk_aw_sixes_sub: "جاب ستة {n} مرات",
    },
    en: {
      snk_color_free: "Free",
      snk_color_yours: "That's yours. Tap again to let it go.",
      snk_color_pick: "Pick your colour; anyone who doesn't gets one.",
      snk_watching_next: "You're watching this one and play the next.",
      snk_color_label: "Colours",
      snk_seats_label: "Who plays ({n} of 6)",
      snk_seats_hint_host: "Tap a name to seat or bench them: six play.",
      snk_seats_hint: "The host picks the six who play.",
      snk_play_for: "Roll for {name}",
      snk_clock: "Turn clock",
      snk_clock_off: "Off",
      snk_clock_hint: "When it runs out, the die rolls by itself.",
      snk_lobby_hint: "A new map is built in front of everyone every game.",
      snk_again: "New game",
      snk_wait_host: "Waiting for the host to start a new game…",
      snk_place_1: "1st",
      snk_place_2: "2nd",
      snk_place_3: "3rd",
      snk_place_4: "4th",
      snk_place_5: "5th",
      snk_place_6: "6th",
      snk_start_sq: "Start",
      snk_on_sq: "on {n}",
      snk_on_mat: "not in yet",
      snk_ev_first_you: "A new map, and you start",
      snk_ev_first: "A new map, and {name} starts",
      snk_ev_snake: "{name} slid down a snake from {from} to {to}",
      snk_ev_ladder: "{name} climbed a ladder from {from} to {to}",
      snk_ev_bounce: "{name} overshot 100 and bounced back to {n}",
      snk_ev_roll: "{name} rolled {n} and reached {to}",
      snk_ev_finish: "{name} reached 100: {place} place",
      snk_ev_host: "The host rolled for {name}",
      snk_ev_clock: "Time's up: the die rolled for {name}",
      snk_ev_left: "{name} left the game",
      snk_over: "Game over",
      snk_your_turn: "Your turn!",
      snk_again_six: "A six! Roll again",
      snk_roll_hint: "Tap Roll",
      snk_turn_of: "{name}'s turn",
      snk_thinking: "{name} is rolling…",
      snk_roll: "Roll",
      snk_teams_label: "Teams",
      snk_teams_off: "Each for themselves",
      snk_teams_size: "{n} teams × {k}",
      snk_teams_two: "2 teams × {k}",
      snk_teams_need: "Teams need 4 or 6 in the game: add a computer player or take one out.",
      snk_teams_deal: "Draw",
      snk_teams_hint: "Tap a name, then a name in another team: they swap.",
      snk_teams_rule: "A team wins when all of it reaches 100; whoever is home first rolls for the teammate furthest behind.",
      snk_team_n: "Team {n}",
      snk_home: "Home",
      snk_roll_for: "Rolling for {name}",
      snk_ev_for: "{by} rolled for {name}",
      snk_ev_home: "{name} is home",
      snk_ev_team: "Team {name} all home: {place}",
      snk_ev_charmed: "{name} played the flute at {n} and got past",
      snk_ev_s_charm: "{name} got the charmer's flute",
      snk_ev_s_swap: "{name} swapped places with {with}",
      snk_ev_s_swap_none: "{name} landed on swap with nobody ahead",
      snk_ev_s_again: "{name} found a star: roll again",
      snk_ev_s_worker: "The worker carried {name} to {to}",
      snk_ev_s_worker_none: "{name} found the worker on a break",
      snk_ev_s_peel: "{name} slipped on a banana peel to {to}",
      snk_ev_s_nap: "{name} dozed off: misses a turn",
      snk_ev_nap: "{name} is asleep: the turn passed",
      snk_ev_move: "A snake crawled from {from} to {to}",
      snk_ev_move_eat: "A snake crawled to {to} and ate {name}",
      snk_aw_title: "The game's awards",
      snk_aw_tag: "REPLAY",
      snk_aw_slow: "slow-mo ×½",
      snk_aw_again: "The replays again",
      snk_aw_heroes: "The game's heroes",
      snk_aw_eaten: "Eaten the most",
      snk_aw_ladder: "Longest ladder",
      snk_aw_sixes: "King of sixes",
      snk_aw_fall: "Unluckiest roll",
      snk_aw_from: "From {from} to {to}",
      snk_aw_eaten_sub: "Eaten {n} times",
      snk_aw_sixes_sub: "Rolled {n} sixes",
    }
  },
  rules: {
    ar: {
      snakes: `
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li>من 2 لـ 6، كل واحد عسكري بلونه، وكلكم بتبدأوا <b>برّه اللوحة</b>. أول رمية بتدخّلك: الـ 4 توقّفك على 4.</li>
                <li>في دورك ارمي الزهر وامشي بالرقم. <b>السلم بيطلّعك</b> لفوقه، و<b>راس التعبان بتنزّلك</b> لديله.</li>
                <li><b>الستة ليها رمية تانية</b>، ومش محتاج ستة عشان تبدأ.</li>
                <li><b>الـ 100 بالرقم بالظبط</b>: لو الرقم أكبر بتخبط في الكاس وترجع (98 وجبت 5: توصل 100 وترجع لـ 97).</li>
                <li>العساكر بيقفوا مع بعض على نفس الخانة عادي. أول واحد يوصل الـ 100 يكسب، والباقي بيكمّلوا على المراكز.</li>
            </ol>
            <p class="help-sub">🐍 الخريطة والحركات</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>الخريطة جديدة كل لعبة: من 6 لـ 8 تعابين ومن 6 لـ 8 سلالم في أماكن مختلفة، متوزعة على اللوحة كلها (دايمًا فيه تعبان قريب من 100) ومتشافة إنها عادلة، والعمال بيركّبوها قدامكم. دوسة على اللوحة بتخلّص التركيب.</li>
                <li>كل تعبان وكل سلم ليه أكتر من حركة: يبلعك ويتفّك، تتزحلق على ضهره، يجري وراك، يعطس عليك، يرميك بديله، يعصرك، أو ينوّمك مغناطيسي؛ والسلم تطلعه درجة درجة، جري، تتزحلق وتمسك نفسك، أسانسير، أو العامل يزقّك.</li>
                <li>التعابين بتتنفس وبترمش وبتبص على اللي بيقرّب منها، وساعات بتنام.</li>
            </ul>
            <p class="help-sub">🗺️ الخرايط</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>نفس القواعد بس الخريطة لابسة: <b>🐊 النيل</b> (تماسيح ونخل)، <b>🚇 المترو</b> (زحاليق وسلالم كهربا)، <b>🏜️ الصحرا</b> (كوبرا ونخل وهرم عند 100)، <b>🏙️ الحارة</b> (مواسير وقطط، وحبال وبلكونات والسبت)، أو الكلاسيك. 🎲 بتختار واحدة كل لعبة. كل خريطة ليها حركاتها.</li>
            </ul>
            <p class="help-sub">🎁 مربعات المفاجآت (مفتاح، مقفول من الأول)</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>٦ خانات عليها حاجة واقفة: <b>🪈 الحاوي</b> يديك مزمار: أول تعبان تقف على راسه يرقص وتعدّي. <b>🔄 بدّل</b>: مكانك مع اللي قدامك على طول. <b>⭐ نجمة</b>: ارمي تاني. <b>💨 العامل</b> يشيلك 3 لـ 5 خانات (عمره ما يوقّفك على تعبان ولا سلم ولا مفاجأة).</li>
                <li>والوحشين: <b>🍌 قشرة موز</b> ترجّعك 3، و<b>😴 نومة</b>: الدور الجاي بيعدّي عليك وانت نايم.</li>
            </ul>
            <p class="help-sub">🐍 الخريطة بتتحرك (مفتاح، مقفول من الأول)</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>كل ٣ أدوار (لما الكل يلعب ٣ مرات) تعبان بيزحف لمكان جديد، والخريطة بتفضل عادلة. لو راسه الجديدة جت على حد، بياكله وينزل لديله.</li>
            </ul>
            <p class="help-sub">👥 فرق (في الغرفة بس)</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>٤ في اللعبة: فريقين من ٢. ٦: ٣ فرق من ٢ أو فريقين من ٣ (المضيف بيختار). المضيف يرتّب الفرق أو «وزّع» يوزّعهم.</li>
                <li>الفريق يكسب لما <b>كله</b> يوصل 100. اللي يوصل الأول بيرمي في دوره لزميله اللي ورا خالص (ولو اتنين على نفس الخانة: اللي دوره الأول). المراكز ونقط السهرة بالفرق.</li>
            </ul>
            <p class="help-sub">🏅 جوايز آخر اللعبة</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>لحد ٣ جوايز، الأكتر دراما: 🐍 أكتر واحد اتاكل، 🪜 أطول سلم، 🎲 ملك الستات، 😭 أنحس رمية. كل واحدة «لقطة» بتعيد اللحظة بالبطيء، وفي الآخر «أبطال اللعبة». 🎬 بيعيدهم.</li>
            </ul>
            <p class="help-sub">🤖 ضد الموبايل</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>انت ومن 1 لـ 5 لاعبين كمبيوتر، وانت اللي بتختار لونك والخريطة والمفاتيح.</li>
            </ul>
            <p class="help-sub">📱 كل واحد من موبايله</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>كل واحد يختار لونه في الغرفة. لو أكتر من 6، المضيف بيختار مين يلعب. ممكن تكمّلوا العدد بلاعبين كمبيوتر.</li>
                <li>وقت الدور اختياري (15 أو 30 ثانية): لما يخلص الزهر بيترمي لوحده.</li>
                <li>المضيف بيختار الخريطة والمفاتيح والفرق.</li>
            </ul>
            <p class="help-sub">📺 على التلفزيون</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>اللوحة كبيرة قدام الكل، وكل رمية وكل تعبان وسلم بيبانوا عليها.</li>
            </ul>`,
    },
    en: {
      snakes: `
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li>2 to 6, a little person each in your colour, all starting <b>off the board</b>. Your first roll brings you in: a 4 lands on 4.</li>
                <li>On your turn roll the die and walk that many. <b>A ladder takes you up</b> to its top, and <b>a snake's head takes you down</b> to its tail.</li>
                <li><b>A six rolls again</b>, and you don't need a six to start.</li>
                <li><b>100 needs the exact number</b>: roll too high and you bump the cup and walk back (98 and a 5: to 100, then back to 97).</li>
                <li>Pieces share a square. The first to 100 wins, and the rest play on for the places.</li>
            </ol>
            <p class="help-sub">🐍 The map and the moves</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>A new map every game: 6 to 8 snakes and 6 to 8 ladders in new places, spread over the whole board (always a snake near 100) and checked to be fair, built in front of you by the workers. A tap on the board skips the building.</li>
                <li>Every snake and ladder has more than one move: it swallows you and spits you out, you slide down its back, it chases you, sneezes on you, flicks you with its tail, squeezes you or hypnotises you; a ladder is climbed rung by rung, sprinted, slipped on, ridden like a lift, or a worker gives you a boost.</li>
                <li>The snakes breathe, blink, watch anyone who comes near, and doze off now and then.</li>
            </ul>
            <p class="help-sub">🗺️ The maps</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>The same rules, the board dressed: <b>🐊 the Nile</b> (crocodiles and palms), <b>🚇 the Metro</b> (slides and escalators), <b>🏜️ the Desert</b> (cobras, palms and a pyramid at 100), <b>🏙️ the Alley</b> (drainpipes and cats, ropes, balconies and the basket), or the classic. 🎲 picks one each game. Every map has its own moves.</li>
            </ul>
            <p class="help-sub">🎁 Surprise squares (a switch, off to start with)</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>6 squares with something standing on them: <b>🪈 the charmer</b> gives you a flute: the next snake you land on dances and lets you pass. <b>🔄 Swap</b>: places with the player just ahead of you. <b>⭐ A star</b>: roll again. <b>💨 The worker</b> carries you 3 to 5 squares (never onto a snake, a ladder or a surprise).</li>
                <li>And the bad ones: <b>🍌 a banana peel</b> takes you back 3, and <b>😴 a nap</b>: your next turn passes you by while you sleep.</li>
            </ul>
            <p class="help-sub">🐍 The map moves (a switch, off to start with)</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>Every 3 rounds (everyone has rolled 3 times) a snake crawls to a new spot, the map still fair. If its new head comes down on someone, it eats them and they slide to its tail.</li>
            </ul>
            <p class="help-sub">👥 Teams (rooms only)</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>4 in the game: 2 teams of 2. 6: 3 teams of 2 or 2 teams of 3 (the host's choice). The host arranges the teams, or «Draw» deals them.</li>
                <li>A team wins when <b>all</b> of it reaches 100. Whoever is home first rolls on their turn for the teammate furthest behind (on a tie, the one whose turn comes first). Places and the night's points are by team.</li>
            </ul>
            <p class="help-sub">🏅 Awards at the end</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>Up to 3, the most dramatic: 🐍 eaten the most, 🪜 longest ladder, 🎲 king of sixes, 😭 unluckiest roll. Each a replay of the moment in slow motion, then «The game's heroes». 🎬 plays them again.</li>
            </ul>
            <p class="help-sub">🤖 Against the phone</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>You and 1 to 5 computer players, and you pick your colour, the map and the switches.</li>
            </ul>
            <p class="help-sub">📱 Each on their own phone</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>Everyone picks a colour in the room. With more than 6, the host picks who plays. Fill the table with computer players.</li>
                <li>An optional turn clock (15 or 30 seconds): when it runs out the die rolls by itself.</li>
                <li>The host picks the map, the switches and the teams.</li>
            </ul>
            <p class="help-sub">📺 On the TV</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>The board big in front of everyone, every roll, snake and ladder on it.</li>
            </ul>`,
    }
  }
});
