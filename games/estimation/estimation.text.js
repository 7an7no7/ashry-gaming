/* estimation: the words only this game's screens show, and its rules (Help, the
   first-play card). The build puts them into TRANSLATIONS and GAME_RULES (tools/game-text.cjs):
   read them as t.<key> and GAME_RULES[lang].<id>, as everywhere. */
gameText({
  translations: {
    ar: {
      es_nt: "صن",
      es_nt_word: "صن",
      es_not_turn: "استنى دورك",
      es_follow_suit: "لازم تنزل {suit} طالما معاك",
      es_round_of: "جولة {n} من {m}",
      es_speed: "سرعة",
      es_mult: "×{n}",
      es_trump: "الطرنيب",
      es_dash: "داش",
      es_pass: "باص",
      es_calling: "بيطلب…",
      es_with: "مع",
      es_dealer: "الموزّع",
      es_caller: "صاحب الكول",
      es_risk: "آخر واحد طلب (الريسك)",
      es_risk_short: "ريسك",
      es_you: "انت",
      es_dash_q: "داش كول؟",
      es_auction: "المزاد",
      es_min_bid: "أقل طلب 4",
      es_high_by: "أعلى طلب: {name}",
      es_sum_over: "المجموع {n}: فوق",
      es_sum_under: "المجموع {n}: تحت",
      es_last_trick: "آخر لمّة",
      es_last_took: "اللمّة {n} راحت لـ {name}",
      es_no_cards: "مفيش ورق",
      es_bid_btn: "اطلب {bid}",
      es_bid_pick: "اختار رقم ونوع",
      es_your_bid: "دورك في المزاد",
      es_bid_beat: "أعلى طلب {bid} ({name}): اطلب أعلى أو باص",
      es_bid_first: "أول طلب: 4 لمّات على الأقل ونوع الطرنيب",
      es_call_makes_over: "المجموع هيبقى {n}: فوق",
      es_call_makes_under: "المجموع هيبقى {n}: تحت",
      es_call_last: "انت الأخير (الريسك): مينفعش تطلب {n} عشان المجموع مايبقاش 13",
      es_call_hint_speed: "جولة سرعة: اطلب من 0 لـ 13",
      es_call_hint: "اطلب من 0 لـ {n} (مش أكتر من الكول)",
      es_your_call: "طلبك كام لمّة؟",
      es_call_pick: "اختار طلبك",
      es_call_btn: "اطلب {n}",
      es_you_dashed: "⚡ قلت داش: طلبك صفر",
      es_you_no_dash: "✓ هتدخل المزاد",
      es_dash_waiting: "مستنيين الباقي ({n}/4)",
      es_dash_full: "اتنين قالوا داش خلاص",
      es_dash_hint: "داش = مش هتاخد ولا لمّة: \u2066±33\u2069 في جولة تحت و\u2066±25\u2069 في جولة فوق. اتنين بس في الجولة.",
      es_dash_yes: "داش",
      es_dash_no: "لأ، هزايد",
      es_need_more: "لسه عايز {n}",
      es_need_none: "خدت طلبك: متاخدش تاني",
      es_need_over: "خدت {n} زيادة",
      es_your_lead: "دورك: ابدأ اللمّة",
      es_your_play: "دورك: العب كارت",
      es_play_btn: "العب {card}",
      es_play_pick: "دوس على كارت، ودوس تاني عشان تلعبه",
      es_waiting_bid: "دور {name} في المزاد",
      es_waiting_call: "{name} بيطلب",
      es_waiting_play: "دور {name}",
      es_ev_redealt: "الكل قال باص: الورق اتوزع تاني",
      es_ev_deal: "الجولة {n}: {name} بيوزّع",
      es_ev_deal_speed: "الجولة {n} سرعة: الطرنيب {suit}، من غير مزاد",
      es_ev_dash: "{name} قال داش ⚡",
      es_ev_bid: "{name} طلب {bid}",
      es_ev_pass: "{name} باص",
      es_ev_won: "{name} كسب المزاد: {bid}، والطرنيب {suit}",
      es_ev_call: "{name} طلب {n}",
      es_ev_call_with: "{name} طلب {n}: مع الكول",
      es_ev_called_over: "المجموع {n}: جولة فوق",
      es_ev_called_under: "المجموع {n}: جولة تحت",
      es_ev_play: "{name} لعب {card}",
      es_ev_trick: "{name} خد اللمّة {n}",
      es_ev_all_missed: "صعايدة! محدش جاب طلبه",
      es_ev_round: "خلصت الجولة {n}",
      es_ev_auto_host: "المضيف لعب بدل {name}",
      es_ev_auto_clock: "الوقت خلص: الموبايل لعب بدل {name}",
      es_ev_took: "🤖 الكمبيوتر كمّل مكان {name}",
      es_scores: "النقط",
      es_risk_levels: "ريسك {x}",
      es_all_missed: "صعايدة!",
      es_round_done: "خلصت الجولة {n}",
      es_all_missed_hint: "محدش جاب طلبه: مفيش نقط، والجولة الجاية بالضعف.",
      es_next_round: "الجولة {n}",
      es_sheet_hide: "خبّي الجولات",
      es_sheet_show: "كل الجولات",
      es_won_shared: "تعادل على الأول: {names}",
      es_won: "{name} كسب!",
      es_final: "النتيجة النهائية",
      es_skip_dash: "كمّل من غير اللي فصلوا",
      es_skip_turn: "العب بدل {name}",
      es_lobby_hint: "كل واحد ورقه على موبايله. زايد، اطلب لمّاتك، وجيب طلبك بالظبط.",
      es_lobby_watch: "أربعة بس بيلعبوا: الباقي هيتفرج.",
      es_lobby_bots: "الكراسي الفاضية هيقعد عليها الكمبيوتر.",
      es_lobby_four: "أربعة على الترابيزة.",
      es_rounds: "عدد الجولات",
      es_rounds_18: "18 (13 + 5 سرعة)",
      es_rounds_13: "13",
      es_rounds_18_hint: "بعد الـ13 جولة، 5 جولات سرعة من غير مزاد: بستوني، كبة، ديناري، سباتي، وبعدين صن.",
      es_rounds_13_hint: "13 جولة كلها بمزاد.",
      es_base_hint: "اللي يجيب طلبه بالظبط ياخد {n} + طلبه.",
      es_clock: "وقت الدور",
      es_clock_off: "من غير",
      es_clock_hint: "لما الوقت يخلص الموبايل بيلعب بدلك: من غير داش، باص في المزاد، طلب على قد ورقك، وأصغر كارت ينفع.",
    },
    en: {
      es_nt: "NT",
      es_nt_word: "no trumps",
      es_not_turn: "Wait for your turn",
      es_follow_suit: "You have to follow with {suit}",
      es_round_of: "Round {n} of {m}",
      es_speed: "Speed",
      es_mult: "×{n}",
      es_trump: "Trumps",
      es_dash: "Dash",
      es_pass: "Pass",
      es_calling: "calling…",
      es_with: "With",
      es_dealer: "Dealer",
      es_caller: "The caller",
      es_risk: "Last to call (the risk)",
      es_risk_short: "Risk",
      es_you: "You",
      es_dash_q: "Dash call?",
      es_auction: "The auction",
      es_min_bid: "Lowest bid: 4",
      es_high_by: "Top bid: {name}",
      es_sum_over: "Total {n}: over",
      es_sum_under: "Total {n}: under",
      es_last_trick: "Last trick",
      es_last_took: "Trick {n} went to {name}",
      es_no_cards: "No cards",
      es_bid_btn: "Bid {bid}",
      es_bid_pick: "Pick a number and a suit",
      es_your_bid: "Your bid",
      es_bid_beat: "Top bid {bid} ({name}): bid higher or pass",
      es_bid_first: "First bid: 4 tricks at least, and a trump suit",
      es_call_makes_over: "The total will be {n}: over",
      es_call_makes_under: "The total will be {n}: under",
      es_call_last: "You're last (the risk): you can't call {n}, or the total would be 13",
      es_call_hint_speed: "Speed round: call 0 to 13",
      es_call_hint: "Call 0 to {n} (no more than the caller)",
      es_your_call: "How many tricks will you take?",
      es_call_pick: "Pick your call",
      es_call_btn: "Call {n}",
      es_you_dashed: "⚡ You called a dash: your call is zero",
      es_you_no_dash: "✓ You're in the auction",
      es_dash_waiting: "Waiting for the others ({n}/4)",
      es_dash_full: "Two have called a dash already",
      es_dash_hint: "Dash = you take no trick at all: ±33 in an under round, ±25 in an over round. Two a round at most.",
      es_dash_yes: "Dash",
      es_dash_no: "No, I'll bid",
      es_need_more: "{n} more to go",
      es_need_none: "You have your call: take no more",
      es_need_over: "{n} over your call",
      es_your_lead: "Your lead",
      es_your_play: "Your card",
      es_play_btn: "Play the {card}",
      es_play_pick: "Tap a card, then tap it again to play it",
      es_waiting_bid: "{name} is bidding",
      es_waiting_call: "{name} is calling",
      es_waiting_play: "{name} to play",
      es_ev_redealt: "Everyone passed: the cards were dealt again",
      es_ev_deal: "Round {n}: {name} deals",
      es_ev_deal_speed: "Round {n}, speed: {suit} trumps, no auction",
      es_ev_dash: "{name} called a dash ⚡",
      es_ev_bid: "{name} bid {bid}",
      es_ev_pass: "{name} passed",
      es_ev_won: "{name} won the auction: {bid}, {suit} trumps",
      es_ev_call: "{name} called {n}",
      es_ev_call_with: "{name} called {n}: with the caller",
      es_ev_called_over: "Total {n}: an over round",
      es_ev_called_under: "Total {n}: an under round",
      es_ev_play: "{name} played the {card}",
      es_ev_trick: "{name} took trick {n}",
      es_ev_all_missed: "Nobody made their call!",
      es_ev_round: "Round {n} is over",
      es_ev_auto_host: "The host played for {name}",
      es_ev_auto_clock: "Time's up: the phone played for {name}",
      es_ev_took: "🤖 A computer player took {name}'s seat",
      es_scores: "Scores",
      es_risk_levels: "Risk {x}",
      es_all_missed: "Nobody made it!",
      es_round_done: "Round {n} is over",
      es_all_missed_hint: "Nobody made their call: no points, and the next round counts double.",
      es_next_round: "Round {n}",
      es_sheet_hide: "Hide the rounds",
      es_sheet_show: "Every round",
      es_won_shared: "Level at the top: {names}",
      es_won: "{name} wins!",
      es_final: "Final scores",
      es_skip_dash: "Go on without the phones that dropped",
      es_skip_turn: "Play for {name}",
      es_lobby_hint: "Everyone holds their cards on their own phone. Bid, call your tricks, and take exactly that many.",
      es_lobby_watch: "Four play: the rest watch.",
      es_lobby_bots: "Computer players take the empty seats.",
      es_lobby_four: "Four at the table.",
      es_rounds: "Rounds",
      es_rounds_18: "18 (13 + 5 speed)",
      es_rounds_13: "13",
      es_rounds_18_hint: "After 13 rounds, 5 speed rounds with no auction: spades, hearts, diamonds, clubs, then no trumps.",
      es_rounds_13_hint: "13 rounds, every one with an auction.",
      es_base_hint: "Making your call exactly scores {n} + your call.",
      es_clock: "Turn clock",
      es_clock_off: "Off",
      es_clock_hint: "When it runs out the phone plays for you: no dash, a pass in the auction, a call your hand looks good for, and the lowest card allowed.",
    }
  },
  rules: {
    ar: {
      estimation: `
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li>أربعة كل واحد لنفسه، و<b>13 كارت</b> لكل واحد على موبايله. الموزّع بيلف كل جولة.</li>
                <li><b>الداش كول</b> الأول: اللي متأكد إنه مش هياخد ولا لمّة يقول داش (طلبه صفر ومابيدخلش المزاد). اتنين بس في الجولة.</li>
                <li><b>المزاد</b> بيبدأ من شمال الموزّع: كل واحد يطلب عدد لمّات (4 على الأقل) ونوع الطرنيب، أو يقول باص. الطلب لازم يعلى: لمّات أكتر، أو نفس العدد بنوع أعلى (صن &gt; بستوني &gt; كبة &gt; ديناري &gt; سباتي). الباص نهائي.</li>
                <li>لما الباقيين يقولوا باص بعد طلب، صاحبه يبقى <b>الكول</b>: طلبه هو طلبه، ونوعه الطرنيب. ولو الكل قال باص الورق بيتوزع تاني.</li>
                <li>الباقيين <b>يطلبوا</b> بالدور بعد الكول، من 0 لحد طلب الكول (مش أكتر). اللي يطلب نفس رقم الكول يبقى <b>مع</b>. <b>آخر واحد</b> (الريسك) مينفعش يخلّي المجموع 13.</li>
                <li><b>اللعب</b>: الكول يبدأ. لازم تنزل من نفس النوع لو معاك، ولو مش معاك انزل أي كارت. أعلى طرنيب ياخد اللمّة، ولو مفيش طرنيب أعلى كارت من النوع اللي نزل الأول. اللي ياخد اللمّة يبدأ اللي بعدها.</li>
            </ol>
            <p class="help-sub">🧮 الحساب</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>جيب طلبك <b>بالظبط</b>: 10 + طلبك (أو 13 + طلبك لو المضيف اختار)، و<bdi dir="ltr">+10</bdi> للكول واللي معاه، و<bdi dir="ltr">+10</bdi> لكل درجة ريسك لآخر واحد طلب، و<bdi dir="ltr">+10</bdi> لو انت الوحيد اللي جاب.</li>
                <li>مجبتش: يتخصم منك الفرق، و<bdi dir="ltr">−10</bdi> للكول واللي معاه، و<bdi dir="ltr">−10</bdi> لكل درجة ريسك، و<bdi dir="ltr">−10</bdi> لو انت الوحيد اللي وقع.</li>
                <li><b>الريسك</b>: مجموع الطلبات بعيد عن 13 باتنين أو تلاتة = درجة، أربعة أو خمسة = درجتين.</li>
                <li><b>الداش</b>: <bdi dir="ltr">±33</bdi> في جولة تحت و<bdi dir="ltr">±25</bdi> في جولة فوق، أو <bdi dir="ltr">+33</bdi> / <bdi dir="ltr">−23</bdi> حسب اختيار المضيف. والصفر العادي لو اتجاب في جولة تحت ليه 10 زيادة.</li>
                <li><b>صعايدة</b>: محدش جاب طلبه؟ مفيش نقط، والجولة الجاية بالضعف (وبعد مرتين <bdi dir="ltr">×4</bdi>).</li>
            </ul>
            <p class="help-sub">⚡ جولات السرعة</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>18 جولة من الأول: 13 بمزاد و5 سرعة. أو 13 بس.</li>
                <li>جولات السرعة (14 لـ 18) من غير مزاد: الطرنيب بستوني، كبة، ديناري، سباتي، وبعدين صن. الكل بيطلب بالدور من شمال الموزّع (من 0 لـ 13)، والأخير مينفعش يخلّي المجموع 13، وأول واحد طلب يبدأ.</li>
                <li>أعلى نقط في الآخر يكسب.</li>
            </ul>
            <p class="help-sub">📱 كل واحد من موبايله</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>ورقك على موبايلك بس. الكروت اللي ينفع تلعبها <b>منوّرة</b>، دوس على كارت يترفع ودوس تاني تلعبه. كارت واحد بس ينفع؟ بيتلعب لوحده.</li>
                <li>كل واحد جنبه <b>خد / طلب</b> (3/5)، و<b>👀 آخر لمّة</b> توريك آخر لمّة راحت لمين.</li>
                <li>الكراسي الفاضية بيقعد عليها <b>الكمبيوتر</b> (سهل أو صعب): بيطلب على قد ورقه وبيلعب عشان يجيب طلبه، ومابيشوفش ورق حد. ولو حد خرج، الكمبيوتر بيكمّل مكانه.</li>
                <li>وقت الدور (30 أو 60 ثانية) لو المضيف حطه، والمضيف يقدر يلعب بدل حد موبايله فصل.</li>
            </ul>
            <p class="help-sub">📺 على التلفزيون</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>الترابيزة الخضرا كبيرة: المزاد والطلبات، كل كارت وهو بينزل، واللمّة وهي رايحة للي خدها، والنقط. ورق حد مابيبانش أبداً.</li>
            </ul>`,
    },
    en: {
      estimation: `
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li>Four players, each for themselves, <b>13 cards</b> each on their own phone. The dealer moves on one every round.</li>
                <li><b>Dash calls</b> first: a player sure to take no trick at all calls a dash (a call of zero, and no part in the auction). Two a round at most.</li>
                <li><b>The auction</b> starts on the dealer's left: bid a number of tricks (4 at least) and a trump suit, or pass. Each bid must beat the last: more tricks, or as many with a higher suit (no trumps &gt; spades &gt; hearts &gt; diamonds &gt; clubs). A pass is final.</li>
                <li>Once the others have passed after a bid, its bidder is <b>the caller</b>: the bid is their call, its suit trumps. If everyone passes, the cards are dealt again.</li>
                <li>The others <b>call</b> in turn after the caller, 0 up to the caller's number (never more). Calling the caller's number is being <b>with</b> them. <b>The last to call</b> (the risk) can't make the total 13.</li>
                <li><b>Play</b>: the caller leads. Follow suit if you can; if you can't, play any card. The highest trump takes the trick, or, with no trump in it, the highest card of the suit led. Whoever takes a trick leads the next.</li>
            </ol>
            <p class="help-sub">🧮 Scoring</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>Make your call <b>exactly</b>: 10 + your call (or 13 + it, the host's choice), +10 for the caller and anyone with them, +10 a risk level for the last to call, +10 for the only one who made it.</li>
                <li>Missed: minus the tricks off, −10 for the caller and anyone with them, −10 a risk level, −10 for the only one who missed.</li>
                <li><b>The risk</b>: the calls 2-3 off 13 is one level, 4-5 off two.</li>
                <li><b>A dash</b>: ±33 in an under round, ±25 in an over round, or +33 / −23, the host's choice. A plain zero made in an under round is worth 10 more.</li>
                <li><b>Nobody made it?</b> No points, and the next round counts double (four times after two).</li>
            </ul>
            <p class="help-sub">⚡ Speed rounds</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>18 rounds by default: 13 with an auction and 5 speed rounds. Or 13 only.</li>
                <li>The speed rounds (14 to 18) have no auction: spades, hearts, diamonds, clubs, then no trumps. Everyone calls in turn from the dealer's left (0 to 13), the last can't make the total 13, and the first to call leads.</li>
                <li>The highest total at the end wins.</li>
            </ul>
            <p class="help-sub">📱 On your own phone</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>Your hand is on your phone only. The cards you may play are <b>lit</b>: tap one to lift it, tap again to play it. Only one card you may play? It's played for you.</li>
                <li>Every seat shows <b>took / called</b> (3/5), and <b>👀 Last trick</b> shows the last trick and who took it.</li>
                <li><b>Computer players</b> (easy or hard) take the empty seats: they call what their hand looks good for and play to make it, and never see anyone's cards. If someone leaves, a computer player takes their seat.</li>
                <li>A turn clock (30 or 60 seconds) if the host sets one, and the host can play for a phone that dropped.</li>
            </ul>
            <p class="help-sub">📺 On the TV</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>The green table, big: the auction and the calls, every card as it lands, each trick going to whoever took it, the scores. Nobody's hand is ever shown.</li>
            </ul>`,
    }
  }
});
