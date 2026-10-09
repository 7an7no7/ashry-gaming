/* Block the Way (سد الطريق): the words only this game's screens show, and its rules (Help, the
   first-play card). The build puts them into TRANSLATIONS and GAME_RULES (tools/game-text.cjs):
   read them as t.<key> and GAME_RULES[lang].blockway, as everywhere. */
gameText({
  translations: {
    ar: {
      setup_blockway: "سد الطريق",
      cat_blockway: "اوصل الناحية التانية الأول، وحط أسوار في طريق التانيين",
      blockway_lobby_hint: "اوصل الناحية التانية قبل التانيين: كل دور خطوة أو سور. صاحب الأوضة بيختار الطريقة.",
      blockway_way_label: "طريقة اللعب",
      blockway_way_duel: "واحد لواحد",
      blockway_way_four: "أربعة",
      blockway_way_teams: "٢ ضد ٢",
      blockway_way_duel_hint: "اتنين يلعبوا والباقي في الطابور، واللي يكسب يفضل قاعد. ١٠ أسوار لكل واحد.",
      blockway_way_four_hint: "أربعة على نفس اللوحة، ٥ أسوار لكل واحد. أول واحد يوصل يكسب، والباقي بالترتيب على حسب قربهم.",
      blockway_way_teams_hint: "اتنين ضد اتنين، شريكك قصادك. أي واحد فيكم يوصل تكسبوا انتو الاتنين.",
      blockway_think_label: "وقت الدور",
      blockway_think_off: "من غير",
      blockway_think_hint: "لو الوقت خلص، التطبيق بيمشّي اللي عليه الدور خطوة عشوائية.",
      blockway_level_label: "مستوى الكمبيوتر",
      blockway_level_easy: "سهل",
      blockway_level_mid: "وسط",
      blockway_level_hard: "صعب",
      blockway_level_hint: "للاعبين الكمبيوتر لو ضفتهم.",
      blockway_need4: "الطريقة دي محتاجة ٤ - ضيف كمبيوتر لو ناقصين",
      blockway_your_turn: "دورك",
      blockway_do: "امشي خطوة أو حط سور",
      blockway_do_step: "امشي خطوة",
      blockway_only_step: "مفيش غير خطوة واحدة، هتتمشي لوحدها",
      blockway_turn_of: "دور {name}…",
      blockway_you: "إنت",
      blockway_put: "حطّه",
      blockway_turn_wall: "لفّه",
      blockway_cancel: "لأ",
      blockway_this_wall: "السور ده:",
      blockway_turn_again: "اضغط تاني على نفس المكان تلفّه",
      blockway_bad_shut: "السور ده يقفل الطريق على {name} خالص",
      blockway_bad_overlap: "فيه سور في المكان ده",
      blockway_fences: "أسوارك",
      blockway_of: "من",
      blockway_your_way: "طريقك",
      blockway_step_one: "خطوة",
      blockway_step_many: "خطوات",
      blockway_hit: "سور {a} طوّل طريق {b}",
      blockway_your_wall: "سورك طوّل طريق {b}",
      blockway_jumped: "نطّة! {name} نطّ فوق اللي قدّامه",
      blockway_auto: "الوقت خلص: التطبيق مشّى {name} خطوة",
      blockway_watch: "بتتفرج دلوقتي، هتلعب الجولة الجاية",
      blockway_team_a: "الأزرق",
      blockway_team_b: "الوردي",
      blockway_team_won: "فريق {team} كسب!",
      blockway_first_home: "أول واحد وصل: {name}",
      blockway_last_one: "فضل على اللوحة لوحده: {name}",
      blockway_end_sub: "{n} حركة · {w} سور اتحطّ",
      blockway_row_home: "في البيت 🏁",
      blockway_row_short: "فاضل {n} {steps}",
      blockway_row_gone: "خرج من الأوضة",
      blockway_again: "جولة كمان",
    },
    en: {
      setup_blockway: "Block the Way",
      cat_blockway: "Reach the far side first, and put walls in the others' way",
      blockway_lobby_hint: "Reach the far side before the others: each turn is a step or a wall. The host picks the way.",
      blockway_way_label: "How to play",
      blockway_way_duel: "One on one",
      blockway_way_four: "Four",
      blockway_way_teams: "2 vs 2",
      blockway_way_duel_hint: "Two play and the rest wait in line; the winner stays on. 10 walls each.",
      blockway_way_four_hint: "Four on one board, 5 walls each. The first one home wins, the rest are placed by how close they got.",
      blockway_way_teams_hint: "Two against two, your partner sits opposite. Either of you gets home and you both win.",
      blockway_think_label: "Time a move",
      blockway_think_off: "None",
      blockway_think_hint: "When the time runs out, the app makes a random step for whoever is up.",
      blockway_level_label: "Computer level",
      blockway_level_easy: "Easy",
      blockway_level_mid: "Medium",
      blockway_level_hard: "Hard",
      blockway_level_hint: "For computer players, if you add any.",
      blockway_need4: "This way needs 4 - add a computer if you're short",
      blockway_your_turn: "Your turn",
      blockway_do: "take a step or put a wall",
      blockway_do_step: "take a step",
      blockway_only_step: "only one step left, it's made for you",
      blockway_turn_of: "{name}'s turn…",
      blockway_you: "you",
      blockway_put: "Put it",
      blockway_turn_wall: "Turn",
      blockway_cancel: "Cancel",
      blockway_this_wall: "This wall:",
      blockway_turn_again: "Tap the same spot again to turn it",
      blockway_bad_shut: "This wall shuts {name} in completely",
      blockway_bad_overlap: "There's a wall there already",
      blockway_fences: "Your walls",
      blockway_of: "of",
      blockway_your_way: "your way",
      blockway_step_one: "step",
      blockway_step_many: "steps",
      blockway_hit: "{a}'s wall made {b}'s way longer",
      blockway_your_wall: "Your wall made {b}'s way longer",
      blockway_jumped: "Jump! {name} hopped over",
      blockway_auto: "Time's up: the app moved {name} a step",
      blockway_watch: "You're watching now, you'll play the next round",
      blockway_team_a: "Blue",
      blockway_team_b: "Pink",
      blockway_team_won: "Team {team} wins!",
      blockway_first_home: "First home: {name}",
      blockway_last_one: "Last one on the board: {name}",
      blockway_end_sub: "{n} moves · {w} walls put",
      blockway_row_home: "home 🏁",
      blockway_row_short: "{n} {steps} short",
      blockway_row_gone: "left the room",
      blockway_again: "Play again",
    }
  },
  rules: {
    ar: {
      blockway: `
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li>كل واحد بيبدأ في نص ناحية من اللوحة (٩×٩)، وعايز يوصل <b>الناحية اللي قصاده</b> - مربعاتها ملوّنة بلونه.</li>
                <li>في دورك يا <b>تمشي خطوة</b> (دوس على مربع عليه نقطة) يا <b>تحط سور</b> طوله مربعين: دوس في أي حتة فاضية يظهر سور شفاف، دوس تاني على نفس المكان يلف، وبعدين «حطّه». تحت اللوحة مكتوب السور ده هيطوّل طريق مين قد إيه.</li>
                <li>ممنوع تقفل الطريق على حد خالص: لازم يفضل لكل واحد طريق يوصل بيه. السور اللي يقفل يبان أحمر ومينفعش يتحط.</li>
                <li>لو حد قدّامك على طول: <b>نط فوقه</b>. ولو وراه سور: اطلع جنبه يمين أو شمال.</li>
                <li>الطرق: <b>واحد لواحد</b> (١٠ أسوار، اللي يكسب يفضل قاعد، وبطولة من ٤)، <b>أربعة</b> (٥ أسوار، أول واحد يوصل يكسب والباقي بالترتيب على حسب قربهم)، و<b>٢ ضد ٢</b> (شريكك قصادك، أي واحد فيكم يوصل تكسبوا).</li>
                <li>صاحب الأوضة ممكن يحط وقت للدور (١٥ أو ٣٠ ثانية): لو خلص، التطبيق بيمشي خطوة عشوائية. ويقدر يضيف كمبيوتر سهل أو وسط أو صعب.</li>
            </ol>`,
    },
    en: {
      blockway: `
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li>Everyone starts in the middle of one side of the 9×9 board and races to <b>the opposite side</b> - its squares are tinted in your colour.</li>
                <li>On your turn either <b>take a step</b> (tap a square with a dot) or <b>put a wall</b> two squares long: tap any free spot for a ghost wall, tap the same spot again to turn it, then «Put it». The line under the board says whose way it makes longer, and by how much.</li>
                <li>You may never shut anyone in: everyone must keep a way home. A wall that would is red and can't be put.</li>
                <li>Face to face: <b>jump over</b>. A wall behind them: step to their left or right instead.</li>
                <li>Ways: <b>one on one</b> (10 walls, the winner stays on, a tournament from 4), <b>four</b> (5 walls, the first one home wins, the rest by how close they got), and <b>2 vs 2</b> (partners opposite, either one home wins for both).</li>
                <li>The host may set 15 or 30 seconds a move (when it runs out, the app takes a random step), and add easy, medium or hard computer players.</li>
            </ol>`,
    }
  }
});
