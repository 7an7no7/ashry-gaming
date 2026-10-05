/* chess-teams: the words only this game's screens show, and its rules (Help, the
   first-play card). The build puts them into TRANSLATIONS and GAME_RULES (tools/game-text.cjs):
   read them as t.<key> and GAME_RULES[lang].<id>, as everywhere. */
gameText({
  translations: {
    ar: {
      vc_team_w: "فريق الأبيض",
      vc_team_b: "فريق الأسود",
      vc_side_w: "الأبيض",
      vc_side_b: "الأسود",
      vc_tally_resign: "{team} استسلم بالتصويت",
      vc_resign_short: "استسلام",
      vc_resign_confirm: "تصوّت إن فريقك يستسلم؟ لازم الاستسلام ياخد أصوات أكتر من أي نقلة.",
      vc_voted_count: "صوّتوا {n} من {of}",
      vc_won: "{team} كسب!",
      vc_voted_you: "✅ صوتك: {move} (تقدر تغيّره)",
      vc_vote_now: "🗳️ دور فريقك: صوّت على نقلة",
      vc_team_voting: "🗳️ {team} بيصوّت…",
      vc_how_tie: "🎲 تعادل في الأصوات: القرعة اختارت",
      vc_how_random: "🎲 محدش صوّت: نقلة عشوائية",
      vc_how_host: "⏭️ المضيف قفل التصويت",
      vc_tally_head: "{team} لعب",
      vc_resign_vote: "صوّت نستسلم",
      vc_watching: "انت بتتفرج دلوقتي، وهتلعب الدور الجاي.",
      vc_close_now: "اقفل التصويت دلوقتي",
      vc_again: "العب تاني",
      vc_again_hint: "نفس الفرق، والألوان بتتبدّل.",
      vc_wait_host: "استنى المضيف يبدأ دور جديد.",
      vc_teams: "الفرق",
      vc_shuffle: "وزّع تاني",
      vc_sides_hint: "دوس على اسم عشان تنقله للفريق التاني.",
      vc_lobby_hint: "كل فريق بيصوّت على نقلته، والنقلة اللي تاخد أصوات أكتر هي اللي تتلعب.",
      vc_clock_label: "وقت التصويت",
      vc_clock_hint: "لو الفريق كله صوّت قبل الوقت، النقلة بتتلعب على طول.",
      hb_resign_confirm: "تستسلموا؟ الدور هيروح للفريق التاني.",
      hb_said: "🧠 المخ ({name}) قال:",
      hb_you_brain: "🧠 انت المخ: قول قطعة",
      hb_brain_thinking: "🧠 المخ ({name}) بيختار قطعة…",
      hb_you_hand: "✋ انت الإيد: حرّك {piece}",
      hb_hand_moving: "✋ الإيد ({name}) هتحرّك {piece}…",
      hb_watching: "انت بتتفرج: المخ بيقول القطعة، والإيد بتحرّكها.",
      hb_brain_wait: "✋ الإيد بتاعتك بتحرّك… استنى",
      hb_change_hint: "↺ غلطت؟ دوس على قطعة تانية",
      hb_changed: "غيّر رأيه",
      hb_play_for: "العب بدل {name}",
      hb_calls: "المخ قال",
      hb_again_hint: "الأدوار بتتبدّل: المخ يبقى الإيد، والألوان كمان.",
      hb_hand: "الإيد",
      hb_brain: "المخ",
      hb_seat_bot: "كمبيوتر",
      hb_seating: "مين فين",
      hb_seats_swap_now: "دوس على مكان تاني عشان تبدّلهم.",
      hb_seats_hint: "دوس على مكانين عشان تبدّلهم. الأماكن الفاضية ياخدها الكمبيوتر (سهل).",
      hb_lobby_hint: "2 ضد 2: المخ يقول القطعة، والإيد تحرّكها.",
      hb_clock_label: "ساعة لكل فريق",
      hb_clock_hint: "الفريق اللي وقته يخلص يخسر.",
    },
    en: {
      vc_team_w: "White team",
      vc_team_b: "Black team",
      vc_side_w: "White",
      vc_side_b: "Black",
      vc_tally_resign: "The {team} resigned by vote",
      vc_resign_short: "resign",
      vc_resign_confirm: "Vote for your team to resign? Resigning needs more votes than any move.",
      vc_voted_count: "{n} of {of} voted",
      vc_won: "{team} wins!",
      vc_voted_you: "✅ Your vote: {move} (you can change it)",
      vc_vote_now: "🗳️ Your team's move: vote for one",
      vc_team_voting: "🗳️ {team} is voting…",
      vc_how_tie: "🎲 A tie: drawn at random",
      vc_how_random: "🎲 Nobody voted: a random move",
      vc_how_host: "⏭️ The host closed the vote",
      vc_tally_head: "{team} played",
      vc_resign_vote: "Vote to resign",
      vc_watching: "You're watching now, and you'll play the next game.",
      vc_close_now: "Close the vote now",
      vc_again: "Play again",
      vc_again_hint: "The same teams, the colours swapped.",
      vc_wait_host: "Waiting for the host to start another game.",
      vc_teams: "Teams",
      vc_shuffle: "Shuffle",
      vc_sides_hint: "Tap a name to move them to the other team.",
      vc_lobby_hint: "Each team votes on its move; the move with the most votes is played.",
      vc_clock_label: "Voting time",
      vc_clock_hint: "If the whole team votes sooner, the move is played at once.",
      hb_resign_confirm: "Resign? The game goes to the other team.",
      hb_said: "🧠 The Brain ({name}) says:",
      hb_you_brain: "🧠 You're the Brain: name a piece",
      hb_brain_thinking: "🧠 The Brain ({name}) is picking a piece…",
      hb_you_hand: "✋ You're the Hand: move a {piece}",
      hb_hand_moving: "✋ The Hand ({name}) moves a {piece}…",
      hb_watching: "You're watching: the Brain names the piece, the Hand moves it.",
      hb_brain_wait: "✋ Your Hand is moving… wait",
      hb_change_hint: "↺ Wrong one? Tap another piece",
      hb_changed: "changed",
      hb_play_for: "Play for {name}",
      hb_calls: "The Brains said",
      hb_again_hint: "Roles swap: the Brain becomes the Hand, and the colours swap too.",
      hb_hand: "Hand",
      hb_brain: "Brain",
      hb_seat_bot: "computer",
      hb_seating: "Seats",
      hb_seats_swap_now: "Tap another seat to swap them.",
      hb_seats_hint: "Tap two seats to swap them. Empty seats go to the computer (easy).",
      hb_lobby_hint: "2 v 2: the Brain names the piece, the Hand moves it.",
      hb_clock_label: "A clock per team",
      hb_clock_hint: "A team that runs out of time loses.",
    }
  },
  rules: {
    ar: {
      votechess: `
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li>المضيف بيقسّمكم <b>فريقين</b>: الأبيض والأسود (بالقرعة، ويقدر ينقل أي حد للفريق التاني). من 2 لاعبين: واحد ضد واحد يبقى شطرنج عادي.</li>
                <li>في دور فريقك، <b>كل واحد يصوّت على نقلة</b> من موبايله: دوس على قطعة وبعدين المكان (أو اسحبها). القطعة مابتتحركش، سهم أزرق بيوريك صوتك، وتقدر تغيّره لحد ما التصويت يقفل.</li>
                <li>النقلة اللي تاخد <b>أصوات أكتر</b> بتتلعب لما وقت التصويت يخلص (30 ثانية من الأول، أو 20 أو 60)، أو على طول لو الفريق كله صوّت.</li>
                <li><b>تعادل في الأصوات؟</b> القرعة بتختار واحدة من النقلات المتعادلة. <b>محدش صوّت؟</b> نقلة عشوائية، والكل بيعرف.</li>
                <li>الأصوات <b>سرية</b> لحد ما النقلة تتلعب: الكل شايف مين صوّت، بس مش على إيه. بعدها الكل بيشوف الفريق صوّت إزاي (♞f3 ×3، e4 ×1).</li>
                <li>الكش مات بيكسب زي الشطرنج العادي، وكل واحد في الفريق الكسبان ياخد نقطة.</li>
            </ol>
            <p class="help-sub">🏳️ الاستسلام</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>الاستسلام تصويت كمان (زرار «صوّت نستسلم»): لازم ياخد أصوات <b>أكتر من أي نقلة</b>؛ لو اتعادل مع نقلة، النقلة هي اللي تتلعب.</li>
            </ul>
            <p class="help-sub">📱 كل واحد من موبايله</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>💬 في الشات فيه قناة لفريقك بس: اتفقوا على النقلة من غير ما الفريق التاني يعرف.</li>
                <li>اللي يخرج من الغرفة بيخرج من العد؛ والفريق اللي ميفضلش فيه حد بيخسر. اللي يدخل في النص بيتفرج ويلعب الدور الجاي.</li>
                <li>المضيف يقدر يقفل التصويت بدري لو موبايل فصل: الأصوات اللي اتحطت هي اللي بتحكم.</li>
                <li>«العب تاني»: نفس الفرق، والألوان بتتبدّل.</li>
            </ul>
            <p class="help-sub">📺 على التلفزيون</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>الرقعة كبيرة (3D)، الفريقين ومين صوّت، ووقت التصويت، وإزاي الفريق صوّت بعد كل نقلة.</li>
            </ul>`,
      handbrain: `
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li><b>2 ضد 2</b>: كل فريق فيه <b>مخ</b> و<b>إيد</b>. الأماكن الفاضية ياخدها الكمبيوتر.</li>
                <li>في دور فريقك، <b>المخ يقول قطعة</b>: الملك، الوزير، الطابية، الفيل، الحصان أو العسكري (القطع اللي مالهاش نقلة بتبقى باهتة). الكل بيسمع اللي قاله.</li>
                <li><b>الإيد تحرّك أي قطعة من النوع ده</b>: القطع دي بتنوّر على الرقعة، والإيد تختار النقلة. المخ مايقدرش يحرّك.</li>
                <li>المخ داس غلط؟ يقدر <b>يغيّر القطعة في خلال 3 ثواني</b>، طول ما الإيد لسه مامسكتش قطعة.</li>
                <li>الكش مات بيكسب زي الشطرنج العادي، وكل واحد في الفريق الكسبان ياخد نقطة.</li>
            </ol>
            <p class="help-sub">🔁 الأدوار</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>الأدوار ثابتة طول الدور، وفي «العب تاني» بتتبدّل: المخ يبقى الإيد، والألوان كمان.</li>
                <li>المضيف بيرتّب الأماكن قبل البداية: دوس على مكانين عشان تبدّلهم، أو 🔀 من جديد.</li>
            </ul>
            <p class="help-sub">📱 كل واحد من موبايله</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>🤖 <b>لاعبين كمبيوتر</b> سهل أو صعب: المخ الصعب بيقول قطعة أحسن نقلة، والإيد الصعبة بتلاقي أحسن نقلة للقطعة اللي اتقالت.</li>
                <li>ساعة لكل فريق لو المضيف حطها (5+0 أو 10+0): اللي وقته يخلص يخسر.</li>
                <li>اللي يخرج في النص، الكمبيوتر بيكمّل مكانه. والمضيف يقدر يلعب بدل موبايل فصل.</li>
                <li>أي حد في الفريق يقدر يستسلم للفريق كله.</li>
            </ul>
            <p class="help-sub">📺 على التلفزيون</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>الرقعة كبيرة (3D)، والفريقين، واللي المخ قاله كبير على الشاشة، والساعات.</li>
            </ul>`,
    },
    en: {
      votechess: `
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li>The host splits you into <b>two teams</b>, White and Black (at random, and can move anyone across). From 2 players: one against one is plain chess.</li>
                <li>On your team's move <b>everyone votes for a move</b> on their own phone: tap a piece, then a square (or drag it). The piece stays put; a blue arrow shows your vote, and you can change it until the vote closes.</li>
                <li>The move with <b>the most votes</b> is played when the voting time is up (30 seconds by default, or 20 or 60), or at once when the whole team has voted.</li>
                <li><b>A tie?</b> One of the tied moves is drawn at random. <b>Nobody voted?</b> A random move, and everyone is told.</li>
                <li>Votes are <b>secret</b> until the move is played: everyone sees who has voted, not for what. Then everyone sees how the team voted (♞f3 ×3, e4 ×1).</li>
                <li>Checkmate wins as in plain chess, and each member of the winning team scores a point.</li>
            </ol>
            <p class="help-sub">🏳️ Resigning</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>Resigning is a vote too («Vote to resign»): it needs <b>more votes than any move</b>; tied with a move, the move is played.</li>
            </ul>
            <p class="help-sub">📱 On your own phones</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>💬 The chat has a channel for your team only: agree on a move without the other team hearing.</li>
                <li>Someone who leaves drops out of the count; a team with nobody left loses. Someone who joins mid-game watches and plays the next one.</li>
                <li>The host can close a vote early for a phone that went quiet: the votes cast so far decide it.</li>
                <li>«Play again»: the same teams, the colours swapped.</li>
            </ul>
            <p class="help-sub">📺 On the TV</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>The board big (3D), both teams and who has voted, the voting time, and how the team voted after every move.</li>
            </ul>`,
      handbrain: `
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li><b>2 against 2</b>: each team has a <b>Brain</b> and a <b>Hand</b>. Computer players take the empty seats.</li>
                <li>On your team's move <b>the Brain names a piece</b>: king, queen, rook, bishop, knight or pawn (the ones with no move are faded). The whole table hears it.</li>
                <li><b>The Hand moves any piece of that kind</b>: those pieces light up on the board, and the Hand picks the move. The Brain can't move.</li>
                <li>A wrong tap by the Brain? It can <b>change the piece within 3 seconds</b>, as long as the Hand hasn't picked one up.</li>
                <li>Checkmate wins as in plain chess, and each member of the winning team scores a point.</li>
            </ol>
            <p class="help-sub">🔁 Roles</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>Roles stay for the whole game and swap on «Play again»: the Brain becomes the Hand, and the colours swap too.</li>
                <li>The host arranges the seats before the start: tap two seats to swap them, or 🔀 to draw again.</li>
            </ul>
            <p class="help-sub">📱 On your own phones</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>🤖 <b>Computer players</b>, easy or hard: a hard Brain names the piece of its best move, and a hard Hand finds the best move of the piece named.</li>
                <li>A clock per team if the host sets one (5+0 or 10+0): the team that runs out loses.</li>
                <li>Someone who leaves mid-game: the computer takes their seat. The host can play for a phone that went quiet.</li>
                <li>Either member can resign for the team.</li>
            </ul>
            <p class="help-sub">📺 On the TV</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>The board big (3D), both teams, what the Brain said in big letters, and the clocks.</li>
            </ul>`,
    }
  }
});
