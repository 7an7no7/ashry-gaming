/* cardscore: the words only this game's screens show, and its rules (Help, the
   first-play card). The build puts them into TRANSLATIONS and GAME_RULES (tools/game-text.cjs):
   read them as t.<key> and GAME_RULES[lang].<id>, as everywhere. */
gameText({
  translations: {
    ar: {
      cs_save_round: "سجّل الجولة",
      cs_save_edit: "احفظ التعديل",
      cs_cancel_edit: "إلغاء التعديل",
      cs_need_13: "المجموع لازم يبقى 13 (دلوقتي {n})",
      cs_target: "الهدف",
      cs_to_target: "لحد {n}",
      cs_rounds_of: "{n} من {m} جولات",
      cs_mode_solo: "فردي",
      cs_mode_pairs: "فرق",
      cs_onoff_on: "شغّال",
      cs_onoff_off: "مقفول",
      cs_made_it: "جابها",
      cs_pairs_seats: "4 لاعبين بترتيب القعدة: الأول والتالت فريق، والتاني والرابع فريق.",
      cs_est_rounds: "عدد الجولات",
      cs_est_seats: "4 لاعبين بترتيب القعدة.",
      cs_est_speed: "سرعة",
      cs_est_call: "الطلب",
      cs_est_took: "جاب",
      cs_est_dash_call: "داش",
      cs_est_caller: "الكول (اللي كسب المزاد)",
      cs_est_risk: "آخر واحد طلب (الريسك)",
      cs_est_need_all: "اكتب الطلب واللمّات لكل لاعب",
      cs_est_not_13: "مجموع الطلبات مينفعش يبقى 13",
      cs_est_need_caller: "اختار صاحب الكول",
      cs_est_dash_zero: "الداش كول طلبه لازم يبقى صفر",
      cs_est_dash_two: "الداش لاتنين بس في الجولة",
      cs_est_need_risk: "الطلبات بعيدة عن 13: اختار آخر واحد طلب",
      cs_tarneeb_mode: "طريقة اللعب",
      cs_tarneeb_mode_levant: "شامي",
      cs_tarneeb_mode_egypt: "مصري",
      cs_tarneeb_mode_fortyone: "41",
      cs_tarneeb_hint_levant: "الفريق اللي يجيب طلبه ياخد لمّاته، واللي يوقع يتخصم منه الطلب والتاني ياخد لمّاته.",
      cs_tarneeb_hint_egypt: "زي الشامي، والطلب ممكن يتدبّل ×2 أو ×4.",
      cs_tarneeb_hint_fortyone: "كل واحد يطلب لوحده (أقل حاجة 2) والكبة طرنيب. الفريق يكسب لما واحد يوصل 41 وشريكه فوق الصفر.",
      cs_tarneeb_goal41: "لحد 41 والشريك فوق الصفر",
      cs_tarneeb_41_entry: "طلب كل لاعب، وعلّم اللي جاب طلبه",
      cs_tarneeb_bidder: "الفريق اللي كسب الطلب",
      cs_tarneeb_bid: "الطلب",
      cs_tarneeb_took: "لمّات الفريق الطالب",
      cs_tarneeb_double: "الدبل",
      cs_tarneeb_no_double: "من غير",
      cs_tarneeb_need_team: "اختار الفريق اللي طلب",
      cs_tarneeb_need_bid: "الطلب من 7 لـ 13",
      cs_tarneeb_need_took: "اكتب عدد اللمّات من 0 لـ 13",
      cs_tarneeb_need_bids: "طلب كل لاعب من 2 لـ 13",
      cs_tarneeb_under_11: "مجموع الطلبات أقل من 11: الورق بيتوزع تاني",
      cs_trix_game: "اللعبة",
      cs_trix_game_classic: "كلاسيك · 20",
      cs_trix_game_complex: "كومبلكس · 8",
      cs_trix_teams: "اللاعبين",
      cs_trix_doubling: "الدبل",
      cs_trix_seats: "4 لاعبين بترتيب القعدة. المملكة بتبدأ من الأول.",
      cs_trix_goal: "{n} من {m}",
      cs_trix_contract: "مملكة {name}: العقد",
      cs_trix_c_king: "ملك الكبة",
      cs_trix_c_queens: "البنات",
      cs_trix_c_diamonds: "الديناري",
      cs_trix_c_tricks: "اللطوش",
      cs_trix_c_trix: "تريكس",
      cs_trix_c_complex: "كومبلكس",
      cs_trix_taken_by: "أكلها",
      cs_trix_doubled_by: "مدبّلة من",
      cs_trix_not_doubled: "مش مدبّلة",
      cs_trix_led_by: "صاحبها أكلها: مين نزّل اللمّة؟",
      cs_trix_diamonds_count: "كام ديناري أكل كل واحد؟",
      cs_trix_tricks_count: "كام لطشة أكل كل واحد؟",
      cs_trix_order: "ترتيب الخلصان (1 أول واحد خلّص)",
      cs_trix_card_king: "ملك الكبة",
      cs_trix_card_qs: "بنت البستوني",
      cs_trix_card_qh: "بنت الكبة",
      cs_trix_card_qd: "بنت الديناري",
      cs_trix_card_qc: "بنت السباتي",
      cs_trix_pick_contract: "اختار العقد الأول",
      cs_trix_need_king: "اختار مين أكل الملك (ومين نزّل اللمّة لو صاحبه أكله)",
      cs_trix_need_queens: "اختار مين أكل كل بنت",
      cs_trix_need_order: "كل واحد له ترتيب مختلف من 1 لـ 4",
      cs_konkan_end: "نهاية اللعبة",
      cs_konkan_end_r5: "5 جولات",
      cs_konkan_end_r7: "7 جولات",
      cs_konkan_end_l101: "خروج بعد 101",
      cs_konkan_teams: "اللاعبين",
      cs_konkan_seats: "من 2 لـ 6 لاعبين.",
      cs_konkan_goal_limit: "اللي يعدّي 101 يخرج",
      cs_konkan_winner: "مين نزل (خلّص)؟",
      cs_konkan_finish: "خلّص إزاي؟",
      cs_konkan_normal: "عادي",
      cs_konkan_hand: "هاند أو كونكان ×2",
      cs_konkan_joker: "بجوكر ×2",
      cs_konkan_colour: "لون واحد ×2",
      cs_konkan_suit: "شكل واحد ×4",
      cs_konkan_left: "الورق اللي فاضل مع الباقيين",
      cs_konkan_never: "مانزلش (100)",
      cs_konkan_need_winner: "اختار مين نزل",
      cs_konkan_need_points: "اكتب نقط كل لاعب، أو علّم إنه مانزلش",
      cs_fix_next: "صلّح الجولة {n} كمان: اتغيّر مين بيلعب فيها",
      cs_basra_teams: "اللاعبين",
      cs_basra_seats: "من 2 لـ 4 لاعبين.",
      cs_basra_worth: "أكتر ورق = {n}",
      cs_basra_count: "لكل لاعب",
      cs_basra_basras: "باصرات",
      cs_basra_aj: "آس وولد",
      cs_basra_most: "مين أخد أكتر ورق (27 أو أكتر)؟",
      cs_basra_tie: "26 و26",
      cs_basra_need_most: "اختار مين أخد أكتر ورق",
      cs_basra_need_cards: "اختار مين أخد الـ2 سباتي ومين أخد الـ10 ديناري",
      cs_basra_card_two: "الـ2 سباتي",
      cs_basra_card_ten: "الـ10 ديناري",
      cs_basra_need_aj: "الآسات والولاد مجموعهم 8 (دلوقتي {n})",
      cs_rules_locked: "قواعد اللعبة اللي شغالة",
      cs_rules_locked_hint: "اللعبة ماشية بالقواعد دي. تغييرها يبدأ لعبة جديدة.",
      cs_change_rules: "غيّر القواعد (لعبة جديدة)",
      cs_confirm_end: "اللعبة اللي شغالة هتتمسح عشان تغيّر القواعد. متأكد؟",
      cs_seating: "ترتيب القعدة",
      cs_seating_swap: "اضغط على اسمين عشان تبدّل مكانهم.",
      cs_quick_rest: "الباقي {n}، لمين؟",
      cs_quick_same: "جاب طلبه بالظبط",
      cs_tarneeb_41_made_over: "اللي جابوا طلبهم طالبين أكتر من 13 لمّة: راجع مين جاب",
      cs_tarneeb_41_none_made: "مستحيل محدش يجيب طلبه بالطلبات دي: علّم اللي جابوا",
    },
    en: {
      cs_save_round: "Save the round",
      cs_save_edit: "Save the change",
      cs_cancel_edit: "Cancel edit",
      cs_need_13: "The total must be 13 (it's {n})",
      cs_target: "Target",
      cs_to_target: "To {n}",
      cs_rounds_of: "{n} of {m} rounds",
      cs_mode_solo: "Solo",
      cs_mode_pairs: "Teams",
      cs_onoff_on: "On",
      cs_onoff_off: "Off",
      cs_made_it: "Made it",
      cs_pairs_seats: "4 players in seating order: the 1st and 3rd are a team, the 2nd and 4th the other.",
      cs_est_rounds: "Rounds",
      cs_est_seats: "4 players in seating order.",
      cs_est_speed: "Speed",
      cs_est_call: "Call",
      cs_est_took: "Took",
      cs_est_dash_call: "Dash",
      cs_est_caller: "The caller (won the auction)",
      cs_est_risk: "Last to call (the risk)",
      cs_est_need_all: "Enter the call and the tricks for every player",
      cs_est_not_13: "The calls can't add up to 13",
      cs_est_need_caller: "Choose the caller",
      cs_est_dash_zero: "A dash call has to be a call of zero",
      cs_est_dash_two: "At most two dash calls a round",
      cs_est_need_risk: "The calls are far from 13: choose who called last",
      cs_tarneeb_mode: "How to play",
      cs_tarneeb_mode_levant: "Levantine",
      cs_tarneeb_mode_egypt: "Egyptian",
      cs_tarneeb_mode_fortyone: "41",
      cs_tarneeb_hint_levant: "A team that makes its bid scores its tricks; one that fails loses the bid and the other team scores its tricks.",
      cs_tarneeb_hint_egypt: "Like Levantine, and the bid can be doubled ×2 or ×4.",
      cs_tarneeb_hint_fortyone: "Everyone bids alone (at least 2), hearts are trumps. A team wins when one player reaches 41 with their partner above zero.",
      cs_tarneeb_goal41: "To 41, partner above zero",
      cs_tarneeb_41_entry: "Each player's bid, and mark who made it",
      cs_tarneeb_bidder: "The team that won the bid",
      cs_tarneeb_bid: "Bid",
      cs_tarneeb_took: "Tricks the bidders took",
      cs_tarneeb_double: "Double",
      cs_tarneeb_no_double: "None",
      cs_tarneeb_need_team: "Choose the bidding team",
      cs_tarneeb_need_bid: "The bid is 7 to 13",
      cs_tarneeb_need_took: "Enter the tricks, 0 to 13",
      cs_tarneeb_need_bids: "Each bid is 2 to 13",
      cs_tarneeb_under_11: "The bids add up to less than 11: the cards are dealt again",
      cs_trix_game: "Game",
      cs_trix_game_classic: "Classic · 20",
      cs_trix_game_complex: "Complex · 8",
      cs_trix_teams: "Players",
      cs_trix_doubling: "Doubling",
      cs_trix_seats: "4 players in seating order. The first kingdom is the first player's.",
      cs_trix_goal: "{n} of {m}",
      cs_trix_contract: "{name}'s kingdom: the contract",
      cs_trix_c_king: "King of hearts",
      cs_trix_c_queens: "Queens",
      cs_trix_c_diamonds: "Diamonds",
      cs_trix_c_tricks: "Tricks",
      cs_trix_c_trix: "Trix",
      cs_trix_c_complex: "Complex",
      cs_trix_taken_by: "Taken by",
      cs_trix_doubled_by: "Doubled by",
      cs_trix_not_doubled: "Not doubled",
      cs_trix_led_by: "Its doubler took it: who led that trick?",
      cs_trix_diamonds_count: "How many diamonds did each take?",
      cs_trix_tricks_count: "How many tricks did each take?",
      cs_trix_order: "Finishing order (1 finished first)",
      cs_trix_card_king: "K♥",
      cs_trix_card_qs: "Q♠",
      cs_trix_card_qh: "Q♥",
      cs_trix_card_qd: "Q♦",
      cs_trix_card_qc: "Q♣",
      cs_trix_pick_contract: "Choose the contract first",
      cs_trix_need_king: "Choose who took the king (and who led, if its doubler took it)",
      cs_trix_need_queens: "Choose who took each queen",
      cs_trix_need_order: "Each player needs a different place from 1 to 4",
      cs_konkan_end: "End of the game",
      cs_konkan_end_r5: "5 rounds",
      cs_konkan_end_r7: "7 rounds",
      cs_konkan_end_l101: "Out over 101",
      cs_konkan_teams: "Players",
      cs_konkan_seats: "2 to 6 players.",
      cs_konkan_goal_limit: "Over 101 is out",
      cs_konkan_winner: "Who went out?",
      cs_konkan_finish: "How?",
      cs_konkan_normal: "Normal",
      cs_konkan_hand: "Hand or Konkan ×2",
      cs_konkan_joker: "On a joker ×2",
      cs_konkan_colour: "One colour ×2",
      cs_konkan_suit: "One suit ×4",
      cs_konkan_left: "Cards left in the others' hands",
      cs_konkan_never: "Never melded (100)",
      cs_konkan_need_winner: "Choose who went out",
      cs_konkan_need_points: "Enter each player's points, or mark that they never melded",
      cs_fix_next: "Fix round {n} too: who was playing in it has changed",
      cs_basra_teams: "Players",
      cs_basra_seats: "2 to 4 players.",
      cs_basra_worth: "Most cards = {n}",
      cs_basra_count: "For each player",
      cs_basra_basras: "Basras",
      cs_basra_aj: "Aces & jacks",
      cs_basra_most: "Who took the most cards (27 or more)?",
      cs_basra_tie: "26 each",
      cs_basra_need_most: "Choose who took the most cards",
      cs_basra_need_cards: "Choose who took the 2♣ and who took the 10♦",
      cs_basra_card_two: "2♣",
      cs_basra_card_ten: "10♦",
      cs_basra_need_aj: "Aces and jacks add up to 8 (it's {n})",
      cs_rules_locked: "Rules of the game in progress",
      cs_rules_locked_hint: "This game follows these rules. Changing them starts a new game.",
      cs_change_rules: "Change the rules (new game)",
      cs_confirm_end: "The game in progress will be deleted to change the rules. Sure?",
      cs_seating: "Seating order",
      cs_seating_swap: "Tap two names to swap their seats.",
      cs_quick_rest: "{n} left, to whom?",
      cs_quick_same: "Made the call exactly",
      cs_tarneeb_41_made_over: "The bids marked as made add up to more than 13 tricks: check who made theirs",
      cs_tarneeb_41_none_made: "With these bids someone made theirs: mark who did",
    }
  },
  rules: {
    ar: {
      'cs-estimation': `
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li>العبوا بالورق عادي، والموبايل بيحسب. بعد كل جولة اكتب <b>طلب</b> كل لاعب و<b>اللمّات اللي جابها</b> (مجموعها 13)، واختار <b>الكول</b> و<b>آخر واحد طلب</b>.</li>
                <li>اللي يجيب طلبه بالظبط: <b>10 + طلبه</b>، و<bdi dir="ltr">+10</bdi> للكول واللي معاه (نفس رقمه)، و<bdi dir="ltr">+10</bdi> لكل درجة ريسك لآخر واحد طلب، و<bdi dir="ltr">+10</bdi> لو هو الوحيد اللي جاب.</li>
                <li>اللي ميجيبش: يتخصم منه الفرق، و<bdi dir="ltr">−10</bdi> للكول واللي معاه، و<bdi dir="ltr">−10</bdi> لكل درجة ريسك، و<bdi dir="ltr">−10</bdi> لو هو الوحيد اللي وقع.</li>
                <li><b>الريسك</b>: مجموع الطلبات بعيد عن 13 باتنين أو تلاتة = درجة، أربعة أو خمسة = درجتين.</li>
                <li><b>الداش كول</b> (صفر قبل المزاد): <bdi dir="ltr">±33</bdi> في جولة تحت و<bdi dir="ltr">±25</bdi> في جولة فوق، أو <bdi dir="ltr">+33</bdi> / <bdi dir="ltr">−23</bdi> حسب اختيارك.</li>
                <li>لو محدش جاب طلبه (صعايدة) محدش ياخد حاجة، والجولة الجاية بالضعف.</li>
                <li>13 جولة وبعدها 5 جولات سرعة من غير مزاد. أعلى نقط في الآخر يكسب.</li>
            </ol>
            <p class="help-sub">💡 نصايح</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>غلطت في جولة؟ <b>رجّع آخر جولة</b> وهترجع بالأرقام اللي كتبتها عشان تصلحها.</li>
            </ul>`,
      'cs-tarneeb': `
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li>4 لاعبين بترتيب القعدة: الأول والتالت فريق، والتاني والرابع فريق.</li>
                <li><b>شامي</b>: بعد كل إيد اختار الفريق اللي طلب، والطلب (7 لـ 13) واللمّات اللي جابها. جاب طلبه: ياخد لمّاته. وقع: يتخصم منه الطلب والفريق التاني ياخد لمّاته.</li>
                <li><b>كبوت</b> (13 لمّة من غير ما يطلب 13) = 16. طلب 13 وجابها = 26، ووقع = <bdi dir="ltr">−16</bdi> والتاني ياخد ضعف لمّاته.</li>
                <li><b>مصري</b>: نفس الحساب، والطلب ممكن يتدبّل <bdi dir="ltr">×2</bdi> أو <bdi dir="ltr">×4</bdi>.</li>
                <li><b>41</b>: كل لاعب يطلب لوحده وعلّم اللي جاب طلبه. من 5 وطالع الطلب بيتحسب أكتر (5 = 10، 9 = 27...). الفريق يكسب لما واحد يوصل 41 وشريكه فوق الصفر، واللي يطلب 13 ويجيبها يكسب على طول.</li>
                <li>أول فريق يوصل للهدف يكسب.</li>
            </ol>`,
      'cs-trix': `
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li>4 ممالك، مملكة لكل لاعب بالترتيب. صاحب المملكة يختار العقد، وكل عقد مرة واحدة: 20 لعبة (أو 8 في الكومبلكس).</li>
                <li><b>ملك الكبة</b> <bdi dir="ltr">−75</bdi>، <b>كل بنت</b> <bdi dir="ltr">−25</bdi>، <b>كل ديناري</b> <bdi dir="ltr">−10</bdi>، <b>كل لطشة</b> <bdi dir="ltr">−15</bdi>. <b>تريكس</b>: <bdi dir="ltr">+200</bdi> و<bdi dir="ltr">+150</bdi> و<bdi dir="ltr">+100</bdi> و<bdi dir="ltr">+50</bdi> بترتيب الخلصان.</li>
                <li><b>الدبل</b>: لو حد تاني أكل الملك أو البنت المدبّلة، ياخد الضعف وصاحبها ياخد القيمة. لو صاحبها أكلها بنفسه ياخد الضعف، واللي نزّل اللمّة ياخد القيمة، إلا لو صاحبها هو اللي نزّلها فياخد القيمة بس.</li>
                <li><b>كومبلكس</b>: الملك والبنات والديناري واللطوش في لعبة واحدة، وبعدها تريكس.</li>
                <li><b>فرق</b>: الأول والتالت فريق، ونقطهم بتتجمع.</li>
            </ol>
            <p class="help-sub">💡 نصايح</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>الحاسبة بتتأكد إن الديناري واللطوش 13، وكل بنت ليها حد أكلها.</li>
            </ul>`,
      'cs-konkan': `
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li>بعد كل جولة اختار <b>مين نزل</b>، واكتب نقط الورق اللي فاضل مع الباقيين: من 2 لـ 10 زي ما هي، الصور 10، الآس 11، الجوكر 15.</li>
                <li>اللي نزل ياخد <b><bdi dir="ltr">−30</bdi></b>. اللي منزلش ولا ورقة ياخد <b>100</b>.</li>
                <li><b>هاند</b> (نزل كله مرة واحدة) أو كونكان: كل الحساب <bdi dir="ltr">×2</bdi>. خلّص بجوكر <bdi dir="ltr">×2</bdi>، لون واحد <bdi dir="ltr">×2</bdi> أو شكل واحد <bdi dir="ltr">×4</bdi>.</li>
                <li>في الفرق: شريك اللي نزل مياخدش حاجة.</li>
                <li>أقل نقط بعد 5 أو 7 جولات يكسب. أو اختار «خروج بعد 101» (للعب الفردي بس): اللي يعدّي 101 يخرج وآخر واحد يفضل يكسب.</li>
                <li>💡 الشريط تحت الأسماء هو ترتيب القعدة: اضغط اسمين يتبدلوا. القواعد بتتقفل بعد أول جولة، وقبل ما تسجّل بتشوف المجموع الجديد في الشريط تحت.</li>
            </ol>`,
      'cs-basra': `
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li>بعد ما الورق كله يخلص، اكتب لكل لاعب عدد <b>الباصرات</b> وعدد <b>الآسات والولاد</b> اللي معاه.</li>
                <li>كل باصرة <b>10</b>، كل آس أو ولد <b>1</b>، <b>الـ2 سباتي</b> بـ 2، <b>الـ10 ديناري</b> بـ 3، و<b>أكتر ورق</b> (27 أو أكتر) بـ 30.</li>
                <li>لو الورق اتقسم 26 و26، الـ 30 بتتنقل للجولة الجاية وتبقى 60.</li>
                <li>أول واحد يعدّي الهدف في آخر جولة يكسب. تقدروا تلعبوا فرق (4 لاعبين).</li>
                <li>💡 الشريط تحت الأسماء هو ترتيب القعدة: اضغط اسمين يتبدلوا. القواعد بتتقفل بعد أول جولة، وقبل ما تسجّل بتشوف المجموع الجديد في الشريط تحت.</li>
            </ol>`,
    },
    en: {
      'cs-estimation': `
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li>Play with a real deck; the phone keeps the score. After each round enter every player's <b>call</b> and the <b>tricks they took</b> (13 in all), and choose the <b>caller</b> and <b>who called last</b>.</li>
                <li>Made the call exactly: <b>10 + the call</b>, +10 for the caller and anyone "with" them (the same number), +10 per risk level for the last to call, +10 for the only one who made it.</li>
                <li>Missed: minus the tricks off, −10 for the caller and "with", −10 per risk level, −10 for the only one who missed.</li>
                <li><b>Risk</b>: calls 2-3 away from 13 is one level, 4-5 away two.</li>
                <li><b>Dash call</b> (zero before the auction): ±33 in an under round and ±25 in an over round, or +33 / −23 as you choose.</li>
                <li>If nobody makes their call, nobody scores and the next round counts double.</li>
                <li>13 rounds, then 5 speed rounds with no auction. Highest total wins.</li>
            </ol>
            <p class="help-sub">💡 Tips</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>A mistake? <b>Take back the last round</b> and it comes back with what you typed, to fix.</li>
            </ul>`,
      'cs-tarneeb': `
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li>4 players in seating order: the 1st and 3rd are a team, the 2nd and 4th the other.</li>
                <li><b>Levantine</b>: after each hand choose the bidding team, the bid (7-13) and the tricks it took. Made: it scores its tricks. Failed: it loses the bid and the other team scores its tricks.</li>
                <li>All 13 without bidding 13 is 16. Bidding 13 and making it 26; failing −16, and the other team scores double.</li>
                <li><b>Egyptian</b>: the same, and a bid can be doubled ×2 or ×4.</li>
                <li><b>41</b>: everyone bids alone; mark who made their bid. Bids of 5 and up are worth more (5 = 10, 9 = 27...). A team wins when one player reaches 41 with their partner above zero; bidding 13 and making it wins outright.</li>
                <li>The first team to the target wins.</li>
            </ol>`,
      'cs-trix': `
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li>4 kingdoms, one per player in order. The owner chooses the contract, each once: 20 games (8 in Complex).</li>
                <li><b>King of hearts</b> −75, <b>each queen</b> −25, <b>each diamond</b> −10, <b>each trick</b> −15. <b>Trix</b>: +200, +150, +100, +50 by finishing order.</li>
                <li><b>Doubling</b>: if someone else takes a doubled king or queen, they pay double and its doubler gets the single value. If the doubler takes it, they pay double and whoever led that trick gets the single value, unless the doubler led it, when it's just the single value.</li>
                <li><b>Complex</b>: king, queens, diamonds and tricks in one game, then the Trix.</li>
                <li><b>Teams</b>: the 1st and 3rd are partners and their points add up.</li>
            </ol>
            <p class="help-sub">💡 Tips</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>The scorer checks that diamonds and tricks add up to 13 and every queen has a taker.</li>
            </ul>`,
      'cs-konkan': `
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li>After each round choose <b>who went out</b> and enter the cards left in the others' hands: 2-10 as marked, pictures 10, ace 11, joker 15.</li>
                <li>Whoever went out takes <b>−30</b>. Anyone who never put a card down takes <b>100</b>.</li>
                <li><b>Hand</b> (all down in one turn) or a Konkan: everything ×2. Finishing on a joker ×2, one colour ×2 or one suit ×4.</li>
                <li>In teams, the winner's partner scores nothing.</li>
                <li>Lowest after 5 or 7 rounds wins. Or choose "out over 101" (players on their own only): over 101 is out, and the last one in wins.</li>
                <li>💡 The strip under the names is the seating order: tap two names to swap them. The rules lock after the first round, and before you save you see the new totals in the bar at the bottom.</li>
            </ol>`,
      'cs-basra': `
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li>When the deck is played out, enter each player's <b>basras</b> and <b>aces and jacks</b>.</li>
                <li>Each basra <b>10</b>, each ace or jack <b>1</b>, the <b>2♣</b> 2, the <b>10♦</b> 3, and <b>most cards</b> (27 or more) 30.</li>
                <li>If the cards split 26-26, the 30 carries over and the next deck's majority is worth 60.</li>
                <li>The first past the target at the end of a deck wins. Four can play as two teams.</li>
                <li>💡 The strip under the names is the seating order: tap two names to swap them. The rules lock after the first round, and before you save you see the new totals in the bar at the bottom.</li>
            </ol>`,
    }
  }
});
