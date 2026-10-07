/* dark: the words only this game's screens show, and its rules (Help, the
   first-play card). The build puts them into TRANSLATIONS and GAME_RULES (tools/game-text.cjs):
   read them as t.<key> and GAME_RULES[lang].<id>, as everywhere. */
gameText({
  translations: {
    ar: {
      dk_lobby_wait: "المضيف بيختار الحكاية وطريقة المشي…",
      dk_story: "الحكاية",
      dk_story_home: "🏠 الكهربا قاطعة",
      dk_story_tomb: "🏺 مقبرة الفرعون",
      dk_mode: "المشي",
      dk_mode_steps: "خطوة بخطوة",
      dk_mode_stick: "جويستيك",
      dk_lobby_home: "الكهربا قاطعة نص الليل، والولد عايز يوصل للتلاجة من غير ما يدوس على لعبة ولا يصحّي جدو.",
      dk_lobby_tomb: "المستكشف جوه مقبرة الفرعون بيدوّر على القناع الدهب، وسط الفخاخ والمومياوات.",
      dk_lobby_steps: "واحد ماشي على شاشة سودا والباقي شايفين الخريطة تحت عدسة ويوجّهوه. كل ضغطة سهم خطوة.",
      dk_lobby_stick: "واحد ماشي على شاشة سودا والباقي شايفين الخريطة تحت عدسة ويوجّهوه. المشي متواصل بجويستيك.",
      dk_hearts: "{n} قلوب",
      dk_level: "المستوى {n}",
      dk_you: "إنت",
      dk_pass: "عدّي الدور للي بعده",
      dk_wait_host: "مستنيين المضيف…",
      dk_over_title: "خلصت القلوب!",
      dk_over_left: "مفيش ناس كفاية تكمّل",
      dk_cleared: "مستويات عدّيتوها",
      dk_best: "أحسن رقم للأوضة: {n}",
      dk_watching: "بتتفرج دلوقتي، وهتلعب اللعبة الجاية.",
      dk_mic: "الميكروفون",
      dk_mic_hint: "واحد بس من اللي بيوصفوا يتكلم في المرة: اللي معاه الميكروفون. يعدّيه للي بعده، أو اللي ماشي ينادي على حد.",
      dk_mic_off_hint: "مقفول: كل اللي بيوصفوا يتكلموا مع بعض.",
      dk_mic_yours: "الميكروفون معاك: إنت بس اللي تتكلم!",
      dk_mic_other: "الميكروفون مع {name}",
      dk_mic_wait: "اسكت واستنى دورك 🤫",
      dk_mic_pass: "🎤 عدّيه للي بعدي",
      dk_mic_call: "نادي على:",
      dk_mic_your_turn: "🎤 دورك تتكلم!",
      dk_dizzy_now: "😵 {name} داخ! الشمال بقى يمين",
      dk_dizzy: "😵 {name} دايخ: قولوا الشمال يمين! ({n})",
      dk_you_walk: "الدور عليك تمشي",
      dk_echo_hint: "الخطوط = صدى الحيطان والعفش حواليك. اسمع صحابك!",
      dk_stick_hint: "اسحب الدايرة ناحية ما عايز تمشي",
      dk_up: "فوق",
      dk_left: "شمال",
      dk_right: "يمين",
      dk_down: "تحت",
      dk_back_to_tv: "📺 ادي ضهرك للتلفزيون",
      dk_lens_title: "🔍 حرّك العدسة",
      dk_lens_all: "🗺️ الخريطة كلها معاك",
      dk_map_label: "خريطة الأوضة المضلمة",
      dk_lens_hint: "الحلقات المنقّطة عدسات صحابك: اتقسّموا عشان تغطّوا الخريطة، وقولوا للي ماشي يروح فين.",
      dk_lens_hint_all: "إنت لوحدك اللي بتوجّه: الخريطة كلها قدامك. قول للي ماشي يروح فين.",
      dk_ready_n: "استعد… {n}",
      dk_go: "يلا!",
      dk_near: "استنى! فيه {trap} جنب اللي ماشي",
      dk_near_grandpa: "بالراحة… جدو نايم جنبه!",
      dk_near_sarco: "بالراحة… التابوت جنبه!",
      dk_tn_lego: "ليجو",
      dk_tn_duck: "بطة كاوتش",
      dk_tn_creak: "بلاطة بتزيّق",
      dk_tn_cat: "القطة",
      dk_tn_ball: "الكورة",
      dk_tn_plate: "بلاطة فخ",
      dk_tn_sand: "رملة متحركة",
      dk_tn_mummy: "المومياء",
      dk_tn_blade: "السكينة",
      dk_tn_trap: "فخ",
      dk_bump: "طخ! في {obj}",
      dk_obj_wall: "الحيطة",
      dk_obj_sofa: "الكنبة",
      dk_obj_tvunit: "التلفزيون",
      dk_obj_bed: "السرير",
      dk_obj_dresser: "الدولاب",
      dk_obj_armchair: "كرسي جدو",
      dk_obj_counter: "الرخامة",
      dk_obj_fridge: "التلاجة",
      dk_obj_table: "الترابيزة",
      dk_obj_plant: "الزرعة",
      dk_obj_shelf: "المكتبة",
      dk_obj_toybox: "صندوق اللعب",
      dk_obj_pillar: "العمود",
      dk_obj_sarco: "التابوت",
      dk_obj_pedestal: "القاعدة",
      dk_obj_jar: "الجرّة",
      dk_obj_statue: "التمثال",
      dk_trap_lego: "آآآه! داس على قطعة ليجو",
      dk_trap_duck: "صوصوو! البطة الكاوتش صوّصت",
      dk_trap_creak: "الأرض زيّقت… وجدو صحي: مين هناك؟!",
      dk_trap_cat: "داس على ديل القطة! نياااو",
      dk_trap_ball: "الكورة خبطته وطار!",
      dk_trap_plate: "داس على بلاطة الفخ: شوك من الأرض!",
      dk_trap_sand: "الرملة سحبته لتحت!",
      dk_trap_mummy: "المومياء مسكته: بخ!",
      dk_trap_blade: "السكينة عدّت فوق راسه!",
      dk_back_start: "رجعت لأول الطريق… وراح قلب",
      dk_back_start_g: "رجع لأول الطريق وراح قلب",
      dk_won_home: "وصل التلاجة! 🧊",
      dk_won_tomb: "لقى القناع الدهب! ✨",
      dk_your_turn: "الدور عليك تمشي!",
      dk_next_level: "المستوى {n} أكبر، والماشي دلوقتي {name}",
      dk_new_mover: "الماشي دلوقتي {name}",
      dk_tv_view: "شكل الشاشة",
      dk_tv_note: "📱 اللي ماشي يدي ضهره للشاشة",
    },
    en: {
      dk_lobby_wait: "The host is picking the story and the walking…",
      dk_story: "The story",
      dk_story_home: "🏠 Power cut",
      dk_story_tomb: "🏺 Pharaoh's tomb",
      dk_mode: "Walking",
      dk_mode_steps: "Step by step",
      dk_mode_stick: "Joystick",
      dk_lobby_home: "A power cut in the middle of the night: the kid wants the fridge without stepping on a toy or waking grandpa.",
      dk_lobby_tomb: "The explorer is inside the pharaoh's tomb looking for the golden mask, among traps and mummies.",
      dk_lobby_steps: "One walks on a black screen; the rest see the map under a lens and guide them. Each arrow tap is a step.",
      dk_lobby_stick: "One walks on a black screen; the rest see the map under a lens and guide them. Walking is smooth, with a joystick.",
      dk_hearts: "{n} hearts",
      dk_level: "Level {n}",
      dk_you: "you",
      dk_pass: "Pass the turn on",
      dk_wait_host: "Waiting for the host…",
      dk_over_title: "Out of hearts!",
      dk_over_left: "Not enough players to go on",
      dk_cleared: "levels cleared",
      dk_best: "The room's best: {n}",
      dk_watching: "You're watching now, and play the next game.",
      dk_mic: "The mic",
      dk_mic_hint: "Only one guide talks at a time: whoever holds the mic. They pass it on, or the walker calls someone by name.",
      dk_mic_off_hint: "Off: all the guides talk at once.",
      dk_mic_yours: "You hold the mic: only you talk!",
      dk_mic_other: "{name} has the mic",
      dk_mic_wait: "Quiet, wait your turn 🤫",
      dk_mic_pass: "🎤 Pass it on",
      dk_mic_call: "Call on:",
      dk_mic_your_turn: "🎤 Your turn to talk!",
      dk_dizzy_now: "😵 {name} is dizzy! Left is right now",
      dk_dizzy: "😵 {name} is dizzy: say left for right! ({n})",
      dk_you_walk: "Your turn to walk",
      dk_echo_hint: "The lines are the echo of the walls and furniture around you. Listen to your friends!",
      dk_stick_hint: "Drag the circle the way you want to go",
      dk_up: "Up",
      dk_left: "Left",
      dk_right: "Right",
      dk_down: "Down",
      dk_back_to_tv: "📺 Turn your back to the TV",
      dk_lens_title: "🔍 Move the lens",
      dk_lens_all: "🗺️ You have the whole map",
      dk_map_label: "The dark room's map",
      dk_lens_hint: "The dashed rings are your friends' lenses: split up to cover the map, and tell the walker where to go.",
      dk_lens_hint_all: "You're the only guide: the whole map is yours. Tell the walker where to go.",
      dk_ready_n: "Get ready… {n}",
      dk_go: "Go!",
      dk_near: "Stop! There's a {trap} next to the walker",
      dk_near_grandpa: "Gently… grandpa is asleep right there!",
      dk_near_sarco: "Gently… the sarcophagus is right there!",
      dk_tn_lego: "Lego brick",
      dk_tn_duck: "rubber duck",
      dk_tn_creak: "creaky tile",
      dk_tn_cat: "cat",
      dk_tn_ball: "ball",
      dk_tn_plate: "pressure plate",
      dk_tn_sand: "sand pit",
      dk_tn_mummy: "mummy",
      dk_tn_blade: "blade",
      dk_tn_trap: "trap",
      dk_bump: "Bonk! The {obj}",
      dk_obj_wall: "wall",
      dk_obj_sofa: "sofa",
      dk_obj_tvunit: "TV",
      dk_obj_bed: "bed",
      dk_obj_dresser: "dresser",
      dk_obj_armchair: "grandpa's armchair",
      dk_obj_counter: "counter",
      dk_obj_fridge: "fridge",
      dk_obj_table: "table",
      dk_obj_plant: "plant",
      dk_obj_shelf: "bookcase",
      dk_obj_toybox: "toy box",
      dk_obj_pillar: "pillar",
      dk_obj_sarco: "sarcophagus",
      dk_obj_pedestal: "pedestal",
      dk_obj_jar: "jar",
      dk_obj_statue: "statue",
      dk_trap_lego: "Owww! Stepped on a Lego brick",
      dk_trap_duck: "Squeak! The rubber duck squeaked",
      dk_trap_creak: "The floor creaked… and grandpa woke up: who's there?!",
      dk_trap_cat: "Stepped on the cat's tail! Meoww",
      dk_trap_ball: "The ball knocked them over!",
      dk_trap_plate: "A pressure plate: spikes from the floor!",
      dk_trap_sand: "The sand pulled them down!",
      dk_trap_mummy: "The mummy got them: boo!",
      dk_trap_blade: "The blade swung right over their head!",
      dk_back_start: "Back to the start… and a heart lost",
      dk_back_start_g: "Back to the start, and a heart lost",
      dk_won_home: "Made it to the fridge! 🧊",
      dk_won_tomb: "Found the golden mask! ✨",
      dk_your_turn: "Your turn to walk!",
      dk_next_level: "Level {n} is bigger, and {name} walks now",
      dk_new_mover: "{name} walks now",
      dk_tv_view: "Screen view",
      dk_tv_note: "📱 The walker turns their back to the screen",
    }
  },
  rules: {
    ar: {
      darkroom: `
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li>واحد <b>ماشي</b> والباقي <b>بيوجّهوا</b>. اللي ماشي شاشته سودا: مش شايف غير <b>صدى</b> لما يكون جنبه حيطة (خط أزرق) أو عفش (خط برتقالي).</li>
                <li>اللي بيوجّهوا شايفين الخريطة ضلمة، وكل واحد معاه <b>عدسة</b> يحركها بصباعه ويشوف تحتها الأوض والعفش والفخاخ. الحلقات المنقّطة عدسات صحابه، فاتقسّموا وغطّوا الخريطة. لو واحد بس بيوجّه، الخريطة كلها قدامه.</li>
                <li>قولوا للي ماشي يروح فين بالكلام: «يمين خطوتين… استنى!». اليمين والشمال هما يمين وشمال الشاشة عند الكل.</li>
                <li>في <b>البيت</b> الكهربا قاطعة والولد رايح التلاجة: ليجو، بطة بتصوّص، بلاطة بتزيّق جنب جدو النايم، القطة، وكورة بتتدحرج. في <b>المقبرة</b> المستكشف رايح للقناع الدهب: بلاطات فخ، رملة متحركة، مومياء بتلف، وسكينة بتتمرجح.</li>
                <li>لو داس على فخ <b>يرجع لأول الطريق</b> والفريق <b>يخسر قلب</b> (معاكم 3). لو وصل: <b>المستوى اللي بعده</b> أكبر وفخاخه أكتر وبتتحرك، و<b>الماشي بيتغير</b>.</li>
            </ol>
            <p class="help-sub">🚶 المشي</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li><b>خطوة بخطوة</b>: كل ضغطة سهم خطوة. <b>جويستيك</b>: المشي متواصل. المضيف بيختار في اللوبي، وكمان الحكاية.</li>
                <li>لو موبايل اللي ماشي نام، المضيف يعدّي الدور للي بعده من غير ما تخسروا قلب.</li>
            </ul>
            <p class="help-sub">🎤 الميكروفون (لو المضيف شغّله)</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>واحد بس من اللي بيوصفوا يتكلم: اللي معاه الميكروفون، واسمه كبير على كل موبايل والتلفزيون. يدوس ويعدّيه للي بعده، أو اللي ماشي ينادي على حد باسمه. مين بيوصف أحسن؟</li>
            </ul>
            <p class="help-sub">😵 دايخ!</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>من المستوى 3: لو اللي ماشي خبط في عمود (المقبرة) أو القطة عدّت جنبه (البيت)، بيدوخ 5 ثواني: الشمال واليمين بيتبدّلوا في إيده. هو مش بيعرف، بس اللي بيوصفوا بيتقالهم: قولوا الشمال لما تقصدوا اليمين!</li>
            </ul>
            <p class="help-sub">📺 على التلفزيون (اختياري)</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>البيت أو المقبرة 3D من فوق (أو 2D بزرار)، وبتنوّر بس مكان العدسات. اللي ماشي يدي ضهره للشاشة!</li>
                <li>من 2 لـ8 لاعبين، ومن غير تلفزيون كمان.</li>
            </ul>`,
    },
    en: {
      darkroom: `
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li>One player <b>walks</b> and the rest <b>guide</b>. The walker's screen is black: all they get is an <b>echo</b> when a wall (a blue line) or furniture (an orange line) is right beside them.</li>
                <li>The guides see the map in the dark, each with a <b>lens</b> they drag with a finger to see the rooms, the furniture and the traps under it. The dashed rings are the other guides' lenses, so split up and cover the map. With only one guide, the whole map is theirs.</li>
                <li>Talk the walker there: "Right two steps… stop!". Right and left are the screen's right and left for everyone.</li>
                <li>At <b>home</b> the power is out and the kid is off to the fridge: Lego bricks, a squeaky duck, a creaky tile by sleeping grandpa, the cat, a rolling ball. In the <b>tomb</b> the explorer is after the golden mask: pressure plates, sand pits, a patrolling mummy, a swinging blade.</li>
                <li>A trap sends the walker <b>back to the start</b> and costs the team <b>a heart</b> (you have 3). Reach the goal: <b>the next level</b> is bigger, with more traps that move, and <b>the walker changes</b>.</li>
            </ol>
            <p class="help-sub">🚶 Walking</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li><b>Step by step</b>: each arrow tap is a step. <b>Joystick</b>: smooth walking. The host picks in the lobby, and the story too.</li>
                <li>If the walker's phone falls asleep, the host can pass the turn on without losing a heart.</li>
            </ul>
            <p class="help-sub">🎤 The mic (if the host turns it on)</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>Only one guide talks: whoever holds the mic, shown big on every phone and the TV. They tap to pass it on, or the walker calls someone by name. Who explains best?</li>
            </ul>
            <p class="help-sub">😵 Dizzy!</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>From level 3: if the walker bumps a pillar (the tomb) or the cat brushes past them (home), they are dizzy for 5 seconds: left and right swap under their thumbs. They aren't told, but the guides are: say left when you mean right!</li>
            </ul>
            <p class="help-sub">📺 On the TV (optional)</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>The house or the tomb in 3D from above (or 2D with a tap), lit only where the lenses are. The walker turns their back to the screen!</li>
                <li>2 to 8 players, with or without a TV.</li>
            </ul>`,
    }
  }
});
