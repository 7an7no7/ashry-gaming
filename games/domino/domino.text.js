/* domino: the words only this game's screens show, and its rules (Help, the
   first-play card). The build puts them into TRANSLATIONS and GAME_RULES (tools/game-text.cjs):
   read them as t.<key> and GAME_RULES[lang].<id>, as everywhere. */
gameText({
  translations: {
    ar: {
      domino_teams_line: "فريق ١: {a} و{b} · فريق ٢: {c} و{d}",
      domino_more: "نقاط أخرى",
      domino_bad_number: "أدخل رقماً صحيحاً",
      dom_mode: "طريقة اللعب",
      dom_mode_normal: "عادي",
      dom_mode_american: "أمريكاني",
      dom_mode_normal_hint: "خط بطرفين. اللي يخلّص حجارته ياخد اللي في إيد الباقيين، والقفلة لأقل إيد.",
      dom_mode_american_hint: "أول دوبل سبينر بأربع أطراف. كل ما مجموع الأطراف يطلع مضاعف 5 تاخد نقط: 5 = نقطة.",
      dom_teams: "فرق (2 ضد 2)",
      dom_teams_short: "فرق",
      dom_teams_hint: "الشركا قاعدين قصاد بعض، والدور بيلف بين الفريقين.",
      dom_teams_need4: "الفرق محتاجة 4 لاعبين بالظبط (ضيف كمبيوتر لو ناقصين).",
      dom_seating: "القعدة",
      dom_seats_shuffle: "وزّع تاني",
      dom_seats_hint: "اضغط على اتنين عشان تبدّل مكانهم.",
      dom_seats_swap_now: "اختار اللي هيبدّل معاه.",
      dom_partners: "🔵 {a} ضد 🔴 {b}",
      dom_target: "الهدف",
      dom_help_fit: "نوّر الحجارة اللي تركب",
      dom_help_fit_hint: "للترابيزة كلها: في دورك الحجر اللي يركب ينوّر والباقي يبهت، وجنب كل واحد الأرقام اللي قال عليها باص (👊). من غيره شغّل مخك.",
      dom_help_points: "وريني نقط الحركة",
      dom_help_points_hint: "قبل ما تنزّل الحجر، كل طرف يركب عليه يقولك هيجيب كام (\u2066+2\u2069).",
      dom_clock: "وقت الدور",
      dom_clock_off: "من غير",
      dom_clock_hint: "لو الوقت خلص، الموبايل بيلعب بداله: أول حجر يركب، أو يسحب، أو يقول باص.",
      dom_lobby_hint: "كل واحد حجارته على موبايله. من 2 لـ 4، ولو ناقصين ضيف كمبيوتر.",
      dom_lobby_wait: "المضيف بيختار طريقة اللعب",
      dom_round_n: "جولة {n}",
      dom_bone_label: "للسحب",
      dom_ends_sum: "مجموع الأطراف",
      dom_pts_n: "{n} نقط",
      dom_pt_one: "نقطة",
      dom_pt_two: "نقطتين",
      dom_pt_many: "{n} نقطة",
      dom_waiting_lead: "{name} هيبدأ الجولة بأي حجر",
      dom_ev_play: "{name} نزّل {tile}",
      dom_ev_open6: "{name} فتح بالدوش {tile}",
      dom_ev_open_double: "{name} فتح بأعلى دوبل {tile}",
      dom_ev_open_heavy: "{name} فتح بأتقل حجر {tile}",
      dom_ev_spinner: "🌀 سبينر",
      dom_ev_scored: "{sum} = +{n}",
      dom_ev_draw1: "{name} سحب حجر",
      dom_ev_draw: "{name} سحب {n} حجارة",
      dom_ev_knock: "{name} قال باص 👊",
      dom_ev_auto_clock: "⏱️ الوقت خلص: الموبايل لعب بدل {name}",
      dom_ev_auto_host: "⏭️ المضيف لعب بدل {name}",
      dom_ev_out: "{name} خلّص حجارته 🎉",
      dom_ev_blocked: "قفلة 🔒",
      dom_ev_left: "{name} خرج، وحجارته اتشالت",
      dom_band_open6: "الدوش!",
      dom_band_open: "أول حجر!",
      dom_band_out: "{name} خلّص!",
      dom_band_blocked: "قفلة!",
      dom_spinner: "سبينر",
      dom_knock_word: "باص!",
      dom_tiles_n: "{n} حجارة",
      dom_your_tiles: "حجارتك",
      dom_no_tiles: "مفيش معاك حجارة",
      dom_turn_of: "دور {name}",
      dom_your_turn: "دورك! نزّل حجر",
      dom_you_lead: "دورك تبدأ: نزّل أي حجر",
      dom_auto_draw: "مفيش حجر يركب: هتسحب لوحدك",
      dom_auto_pass: "مفيش حجر يركب ولا حاجة تتسحب: باص لوحده",
      dom_auto_play: "حجر واحد بس يركب: هينزل لوحده",
      dom_pick_end: "{tile} يركب على أكتر من ناحية: اختار",
      dom_end_L: "الشمال",
      dom_end_R: "اليمين",
      dom_end_U: "فوق",
      dom_end_D: "تحت",
      dom_cancel: "إلغاء",
      dom_draw: "اسحب (الباقي {n})",
      dom_knock: "باص",
      dom_no_fit: "الحجر ده مش راكب",
      dom_not_your_turn: "استنى دورك",
      dom_you_can_play: "معاك حجر راكب، دوّر كويس 👀",
      dom_play_for: "العب بدل {name}",
      dom_title_out: "{name} خلّص",
      dom_title_blocked: "قفلة",
      dom_went_out: "خلّص",
      dom_empty_hand: "ولا حجر",
      dom_pips: "في الإيد",
      dom_res_out: "{name} ياخد {n} من حجارة {from}",
      dom_res_out_team: "{name} خلّص: {team} ياخدوا {n} من حجارة {from}",
      dom_res_blocked: "أقل إيد {name}: ياخد {n} من حجارة {from}",
      dom_res_blocked_team: "أقل مجموع {name}: ياخدوا {n} من حجارة {from}",
      dom_res_rounded: "({n} تتقرّب لـ {r} = {pts})",
      dom_res_tie: "قفلة وتعادل على أقل إيد: محدش ياخد حاجة.",
      dom_totals: "المجموع (الهدف {n})",
      dom_next_round: "الجولة الجاية",
      dom_winner: "{name} كسب!",
      dom_no_winner: "اللعبة خلصت",
      dom_ended_left: "اللعبة وقفت عشان حد خرج، والنقط اللي فاتت هي اللي حكمت.",
      dom_lacks: "قال باص على: {n}",
    },
    en: {
      domino_teams_line: "Team 1: {a} & {b} · Team 2: {c} & {d}",
      domino_more: "Other points",
      domino_bad_number: "Enter a valid number",
      dom_mode: "Mode",
      dom_mode_normal: "Classic",
      dom_mode_american: "All Fives",
      dom_mode_normal_hint: "A line with two ends. Whoever goes out takes the pips left in the other hands; a blocked table goes to the lowest hand.",
      dom_mode_american_hint: "The first double is a spinner with four ends. Whenever the ends add up to a multiple of 5 you score: 5 = 1 point.",
      dom_teams: "Teams (2 against 2)",
      dom_teams_short: "Teams",
      dom_teams_hint: "Partners sit opposite each other; turns alternate between the sides.",
      dom_teams_need4: "Teams need exactly 4 players (add a computer player if you're short).",
      dom_seating: "Seats",
      dom_seats_shuffle: "Shuffle",
      dom_seats_hint: "Tap two names to swap their seats.",
      dom_seats_swap_now: "Now tap who to swap with.",
      dom_partners: "🔵 {a} against 🔴 {b}",
      dom_target: "Target",
      dom_help_fit: "Light up the tiles that fit",
      dom_help_fit_hint: "For the whole table: on your turn the tiles that fit light up and the rest fade, and each seat shows the numbers it passed on (👊). Off, use your head.",
      dom_help_points: "Show a move's points",
      dom_help_points_hint: "Before you place a tile, each end it fits says what it would score (+2).",
      dom_clock: "Turn clock",
      dom_clock_off: "Off",
      dom_clock_hint: "When it runs out the phone plays for them: the first tile that fits, else it draws, else it passes.",
      dom_lobby_hint: "Everyone holds their tiles on their own phone. 2 to 4 players; add computer players if you're short.",
      dom_lobby_wait: "The host is choosing how to play",
      dom_round_n: "Round {n}",
      dom_bone_label: "To draw",
      dom_ends_sum: "Ends",
      dom_pts_n: "{n} points",
      dom_pt_one: "1 point",
      dom_pt_two: "2 points",
      dom_pt_many: "{n} points",
      dom_waiting_lead: "{name} leads the round with any tile",
      dom_ev_play: "{name} played {tile}",
      dom_ev_open6: "{name} opens with the double six {tile}",
      dom_ev_open_double: "{name} opens with the highest double {tile}",
      dom_ev_open_heavy: "{name} opens with the heaviest tile {tile}",
      dom_ev_spinner: "🌀 spinner",
      dom_ev_scored: "{sum} = +{n}",
      dom_ev_draw1: "{name} drew a tile",
      dom_ev_draw: "{name} drew {n} tiles",
      dom_ev_knock: "{name} passed 👊",
      dom_ev_auto_clock: "⏱️ Time's up: the phone played for {name}",
      dom_ev_auto_host: "⏭️ The host played for {name}",
      dom_ev_out: "{name} went out 🎉",
      dom_ev_blocked: "Blocked 🔒",
      dom_ev_left: "{name} left; their tiles are set aside",
      dom_band_open6: "Double six!",
      dom_band_open: "The opening tile!",
      dom_band_out: "{name} is out!",
      dom_band_blocked: "Blocked!",
      dom_spinner: "Spinner",
      dom_knock_word: "Pass!",
      dom_tiles_n: "{n} tiles",
      dom_your_tiles: "Your tiles",
      dom_no_tiles: "No tiles",
      dom_turn_of: "{name}'s turn",
      dom_your_turn: "Your turn! Play a tile",
      dom_you_lead: "You lead: play any tile",
      dom_auto_draw: "Nothing fits: drawing for you",
      dom_auto_pass: "Nothing fits and nothing to draw: passing for you",
      dom_auto_play: "Only one tile fits: it goes down by itself",
      dom_pick_end: "{tile} fits more than one end: pick one",
      dom_end_L: "Left",
      dom_end_R: "Right",
      dom_end_U: "Up",
      dom_end_D: "Down",
      dom_cancel: "Cancel",
      dom_draw: "Draw ({n} left)",
      dom_knock: "Pass",
      dom_no_fit: "That tile doesn't fit",
      dom_not_your_turn: "Wait for your turn",
      dom_you_can_play: "You have a tile that fits - look again 👀",
      dom_play_for: "Play for {name}",
      dom_title_out: "{name} went out",
      dom_title_blocked: "Blocked",
      dom_went_out: "Out",
      dom_empty_hand: "No tiles",
      dom_pips: "in hand",
      dom_res_out: "{name} takes {n} from {from}'s tiles",
      dom_res_out_team: "{name} went out: {team} take {n} from {from}'s tiles",
      dom_res_blocked: "Lowest hand, {name}: takes {n} from {from}'s tiles",
      dom_res_blocked_team: "Lowest total, {name}: take {n} from {from}'s tiles",
      dom_res_rounded: "({n} rounds to {r} = {pts})",
      dom_res_tie: "Blocked with a tie for the lowest: nobody scores.",
      dom_totals: "Totals (target {n})",
      dom_next_round: "Next round",
      dom_winner: "{name} wins!",
      dom_no_winner: "Game over",
      dom_ended_left: "The game stopped because someone left; the scores so far decide it.",
      dom_lacks: "Passed on: {n}",
    }
  },
  rules: {
    ar: {
      domino: `
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li>28 حجر من الأبيض للدوش، وكل واحد ياخد <b>7</b>. مع اتنين أو تلاتة الباقي بيفضل للسحب، ومع أربعة كل الحجارة بتتوزّع.</li>
                <li>أول جولة يبدأها اللي معاه <b>الدوش</b> (6|6). لو محدش معاه، أعلى دوبل في إيد أي حد، ولو مفيش دوبل خالص، أتقل حجر. الجولات اللي بعدها يبدأها اللي كسب اللي قبلها، بأي حجر.</li>
                <li>في دورك نزّل حجر فيه نفس رقم طرف من الأطراف. الدوبل بيتحط بالعرض.</li>
                <li>مفيش حجر راكب؟ مع اتنين أو تلاتة <b>اسحب</b> لحد ما يجيلك حجر يركب ونزّله. مفيش حاجة تتسحب، أو انتوا أربعة؟ <b>قول باص</b> 👊 والدور يعدّي.</li>
                <li>الجولة بتخلص لما حد يخلّص حجارته، أو لما الترابيزة <b>تقفل</b>: محدش يقدر ينزّل ومفيش سحب.</li>
                <li>أول واحد يوصل للهدف يكسب (101 في العادي و50 في الأمريكاني). لو اتنين عدّوه في نفس الجولة، الأعلى يكسب، ولو متعادلين تتلعب جولة كمان.</li>
            </ol>
            <p class="help-sub">🧮 العادي (المصري)</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>خط واحد بطرفين.</li>
                <li>اللي يخلّص حجارته ياخد مجموع النقط اللي في إيد الباقيين.</li>
                <li><b>القفلة</b>: أقل إيد تكسب وتاخد مجموع إيدين الباقيين. لو أقل إيد متعادلة بين اتنين، محدش ياخد حاجة.</li>
            </ul>
            <details class="help-more">
                <summary>🌀 الأمريكاني (الخمسات)</summary>
                <ul class="list-disc list-inside space-y-1 text-xs">
                    <li>أول دوبل يتلعب بيبقى <b>سبينر</b>: بيتفتح من الناحيتين الأول، ولما يبقى عليه حجر من الناحيتين يتفتح من فوق وتحت كمان، فيبقى فيه 4 أطراف.</li>
                    <li>بعد كل حجر اجمع الأطراف المفتوحة: الدوبل اللي على طرف بيتحسب بنصّيه، والسبينر لوحده بنصّيه، وطرف سبينر محدش لعب عليه لسه مابيتحسبش.</li>
                    <li>لو المجموع مضاعف 5 تاخد نقط على طول: 5 = نقطة، 10 = نقطتين، 15 = 3، وهكذا.</li>
                    <li>آخر الجولة الكسبان ياخد نقط إيدين الباقيين <b>متقرّبة لأقرب 5 ومقسومة على 5</b>: 12 تبقى 10 يعني نقطتين، و13 تبقى 15 يعني 3. والقفلة نفس الكلام.</li>
                    <li>مثال: 6|6 على الشمال (12) و3 على اليمين = 15 = 3 نقط.</li>
                </ul>
            </details>
            <details class="help-more">
                <summary>👥 الفرق (2 ضد 2)</summary>
                <ul class="list-disc list-inside space-y-1 text-xs">
                    <li>مع 4 بس. الشركا قاعدين قصاد بعض (الأول والتالت ضد التاني والرابع)، فالدور بيلف بين الفريقين. المضيف بيحدد القعدة: عشوائي، ويقدر يبدّل أي اتنين.</li>
                    <li>اللي يخلّص ياخد لفريقه نقط إيدين <b>الخصمين بس</b>. اللي في إيد شريكه مابيتحسبش لحد.</li>
                    <li>القفلة: الفريق اللي مجموعه أقل ياخد مجموع الفريق التاني، ولو متعادلين محدش ياخد حاجة.</li>
                    <li>لو حد خرج في النص، اللعبة بتقف والنقط اللي فاتت هي اللي تحكم.</li>
                </ul>
            </details>
            <p class="help-sub">📱 كل واحد من موبايله</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>حجارتك على موبايلك، وحجارة الباقيين مقلوبة قدامك بعددها. اضغط على حجر عشان تنزّله، ولو يركب على أكتر من طرف الأطراف بتنوّر: اختار واحد.</li>
                <li>المضيف بيختار: عادي أو أمريكاني، فرق، الهدف، ووقت الدور (لو خلص، الموبايل بيلعب بدالك: أول حجر يركب، أو يسحب، أو يقول باص). ومساعدات للترابيزة كلها، مقفولة من الأول: <b>نوّر الحجارة اللي تركب</b> (ومعاه جنب كل واحد الأرقام اللي قال عليها باص، 👊 4·6، لحد ما يسحب أو ينزّل واحد منها)، و<b>نقط الحركة</b> في الأمريكاني.</li>
                <li>ناقصين؟ ضيف <b>لاعبين كمبيوتر</b>: السهل بينزّل أول حجر يركب، والصعب بيلعب عشان يكسب. الكمبيوتر مابيشوفش حجارة حد.</li>
                <li>موبايل حد سكت؟ المضيف يقدر يلعب بداله.</li>
            </ul>
            <p class="help-sub">📺 التلفزيون</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>الترابيزة في النص والكل حواليها بعدد حجارته، وكل حجر بيطير لمكانه، والنقط والحجارة اللي فضلت بتتكشف في آخر كل جولة.</li>
            </ul>
            <p class="help-sub">💡 نصايح</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>خلّص من الحجارة التقيلة بدري: لو الترابيزة قفلت، اللي في إيدك بيتحسب عليك.</li>
                <li>افتكر مين قال باص على أنهي رقم: الرقم ده مش معاه، فاقفله عليه.</li>
            </ul>
            <details class="help-more">
                <summary>🧮 على الطاولة (بالحجارة الحقيقية)</summary>
                <ul class="list-disc list-inside space-y-1 text-xs">
                    <li>بتلعبوا بالحجارة الحقيقية، والتطبيق يعد النقط لحد الهدف (101 عادةً). تلاقيه كمان في الأدوات: حاسبة الدومينو.</li>
                    <li>من 2 لـ 4 لاعبين، ومع 4 تقدروا تلعبوا فرق (اتنين واتنين).</li>
                    <li>زر <bdi dir="ltr">+10</bdi> للسريع، وزر … لأي رقم تاني. كتبت غلط؟ «رجّع» في جدول الجولات بيشيل آخر رقم بالظبط.</li>
                </ul>
            </details>`,
    },
    en: {
      domino: `
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li>28 tiles from double blank to double six, <b>7</b> each. With two or three players the rest are left to draw from; with four every tile is dealt.</li>
                <li>The first round is opened by whoever holds the <b>double six</b> (6|6); if nobody does, the highest double in anyone's hand, and with no double at all, the heaviest tile. Every later round is led by the winner of the last one, with any tile.</li>
                <li>On your turn, play a tile with the same number as one of the open ends. A double goes across.</li>
                <li>Nothing fits? With two or three players, <b>draw</b> until a tile fits, and play it. Nothing left to draw, or four players? <b>Pass</b> 👊 and the turn moves on.</li>
                <li>The round ends when someone plays their last tile, or when the table is <b>blocked</b>: nobody can play and nothing is left to draw.</li>
                <li>First to the target wins (101 in Classic, 50 in All Fives). Two past it in the same round, the higher total wins; level, one more round.</li>
            </ol>
            <p class="help-sub">🧮 Classic (Egyptian)</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>One line with two ends.</li>
                <li>Whoever goes out takes the pips left in everyone else's hands.</li>
                <li><b>Blocked</b>: the lowest hand wins and takes the total of all the other hands. A tie for the lowest and nobody scores.</li>
            </ul>
            <details class="help-more">
                <summary>🌀 All Fives (American)</summary>
                <ul class="list-disc list-inside space-y-1 text-xs">
                    <li>The first double played is the <b>spinner</b>: open on its two sides first, and once both have a tile, up and down too - four ends.</li>
                    <li>After every tile, add up the open ends: a double at an end counts both halves, the spinner alone both of its halves, and a spinner's side nobody has played on yet doesn't count.</li>
                    <li>A multiple of 5 scores at once: 5 = 1 point, 10 = 2, 15 = 3, and so on.</li>
                    <li>At the end of a round the winner takes the other hands' pips <b>rounded to the nearest 5 and divided by 5</b>: 12 becomes 10, 2 points; 13 becomes 15, 3 points. The same when blocked.</li>
                    <li>Example: 6|6 on the left (12) and a 3 on the right = 15 = 3 points.</li>
                </ul>
            </details>
            <details class="help-more">
                <summary>👥 Teams (2 against 2)</summary>
                <ul class="list-disc list-inside space-y-1 text-xs">
                    <li>With four only. Partners sit opposite each other (first and third against second and fourth), so turns alternate between the sides. The host seats them: at random, and any two can be swapped.</li>
                    <li>Whoever goes out wins their side the pips of <b>the two opponents only</b>; what their partner still holds counts for nobody.</li>
                    <li>Blocked: the side with the lower total takes the other side's total; level, nobody scores.</li>
                    <li>If someone leaves mid-game, the game stops and the scores so far decide it.</li>
                </ul>
            </details>
            <p class="help-sub">📱 Each on their own phone</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>Your tiles are on your phone; everyone else's lie face down in front of you, just the count. Tap a tile to play it; if it fits more than one end, the ends light up: pick one.</li>
                <li>The host picks Classic or All Fives, teams, the target and a turn clock (when it runs out the phone plays for you: the first tile that fits, else it draws, else it passes), and helpers for the whole table, off to begin with: <b>light up the tiles that fit</b> (with it each seat also shows the numbers it passed on, 👊 4·6, until it draws or plays one), and <b>a move's points</b> in All Fives.</li>
                <li>Short of players? Add <b>computer players</b>: the easy one plays the first tile that fits, the hard one plays to win. They never see anyone's tiles.</li>
                <li>A phone went quiet? The host can play for it.</li>
            </ul>
            <p class="help-sub">📺 The TV</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>The table in the middle with everyone round it and their tile counts; every tile flies to its place, and the hands and the points are shown at the end of each round.</li>
            </ul>
            <p class="help-sub">💡 Tips</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>Get rid of heavy tiles early: if the table blocks, what you hold counts against you.</li>
                <li>Remember who passed on which number: they don't have it, so close it on them.</li>
            </ul>
            <details class="help-more">
                <summary>🧮 At the table (real tiles)</summary>
                <ul class="list-disc list-inside space-y-1 text-xs">
                    <li>You play with real tiles and the app counts to the target (101 usually). It is in the tools too: the domino score keeper.</li>
                    <li>2 to 4 players, and with 4 you can play in pairs.</li>
                    <li>+10 for the quick one, … for any other number. A wrong entry? "Take back" in the rounds table removes exactly the last one.</li>
                </ul>
            </details>`,
    }
  }
});
