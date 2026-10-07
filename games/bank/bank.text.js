/* bank: the words only this game's screens show, and its rules (Help, the
   first-play card). The build puts them into TRANSLATIONS and GAME_RULES (tools/game-text.cjs):
   read them as t.<key> and GAME_RULES[lang].<id>, as everywhere. */
gameText({
  translations: {
    ar: {
      bank_money: "{n} ج",
      bank_lvl_0: "أرض فاضية",
      bank_lvl_1: "جراج",
      bank_lvl_2: "استراحة",
      bank_lvl_3: "سوق",
      bank_owned_by: "بتاع {name}",
      bank_mortgaged: "مرهون",
      bank_for_sale: "للبيع",
      bank_rent: "الإيجار",
      bank_rent_set: "اللون كله",
      bank_build_costs: "البنا: {a} للجراج، و{b} للاستراحة وللسوق",
      bank_stations_n: "لو معاه {n}",
      bank_co_one: "شركة واحدة: الزهر ×",
      bank_co_both: "الاتنين: الزهر ×",
      bank_luck: "حظ",
      bank_court: "محاكمة",
      bank_sq_go: "كل ما تعدّي عليها تاخد 200",
      bank_sq_jail: "زيارة بس، إلا لو اتحبست",
      bank_sq_bus: "اتحرك تاني بنفس الرقم",
      bank_sq_tojail: "على السجن على طول",
      bank_sq_tax: "ادفع للبنك",
      bank_sq_luck: "اسحب كارت حظ",
      bank_sq_court: "اسحب كارت محاكمة",
      bank_tap_square: "دوس على أي خانة تشوف كارتها",
      bank_out: "مفلس",
      bank_jail_card: "كارت خروج من السجن",
      bank_last_lap: "آخر لفة",
      bank_turn_of: "دور {name}",
      bank_thinking: "الكمبيوتر بيفكر…",
      bank_raising: "مستنيين {name} يدبّر الفلوس",
      bank_deciding: "مستنيين {name} يقرر",
      bank_in_jail: "انت في السجن",
      bank_double_again: "دبل! ارمي تاني",
      bank_your_turn: "دورك!",
      bank_jail_try: "محاولة {n} من 3 للدبل",
      bank_roll_double: "ارمي للدبل",
      bank_roll: "ارمي",
      bank_pay_out: "ادفع {n} واخرج",
      bank_use_card: "استعمل الكارت",
      bank_buy_q: "تشتري {place}؟",
      bank_short_buy: "فلوسك مش مكفية: ارهن أو بيع من أملاكك، أو سيبها",
      bank_buy: "اشتري · {n}",
      bank_leave: "سيبها",
      bank_the_bank: "البنك",
      bank_everyone: "كل اللاعبين",
      bank_you_owe: "عليك {n} لـ{to}",
      bank_raise_hint: "دبّر الفلوس من أملاكك (ارهن أو بيع بنا)، أو أعلن إفلاسك",
      bank_pay: "ادفع",
      bank_bankrupt: "أعلن الإفلاس",
      bank_act_hint: "ابني أو بدّل أو ارهن، وبعدين خلّص دورك",
      bank_end_turn: "خلّص دورك",
      bank_manage: "أملاكي",
      bank_trade: "بدّل",
      bank_nothing: "ولا حاجة",
      bank_offer_between: "{a} عارض على {b}",
      bank_offer_from: "{name} عارض عليك",
      bank_you_get: "هتاخد",
      bank_you_give: "هتدّي",
      bank_accept: "موافق",
      bank_refuse: "لأ",
      bank_offer_waiting: "مستني رد {name}",
      bank_no_places: "مفيش أماكن",
      bank_build: "ابني {n}",
      bank_sell: "بيع +{n}",
      bank_mortgage: "ارهن +{n}",
      bank_unmortgage: "فك الرهن −{n}",
      bank_manage_title: "أملاكك",
      bank_manage_hint: "البنا على اللون كله وبالتساوي. الرهن بنص التمن، وفكّه بزيادة 10%.",
      bank_cash: "فلوس",
      bank_trade_title: "اعمل عرض",
      bank_you_want: "هتاخد من {name}",
      bank_send_offer: "ابعت العرض",
      bank_ev_first: "البداية: {name}",
      bank_ev_first_you: "إنت اللي هتبدأ",
      bank_ev_buy: "{name}: شراء {place} بـ{n}",
      bank_ev_rent: "إيجار {n}: {name} ← {other}",
      bank_ev_tax: "{name}: ضريبة {n}",
      bank_ev_start: "{name}: {n} من البداية",
      bank_ev_jail: "{name}: على السجن",
      bank_ev_jail_three: "{name}: 3 دبل ورا بعض، على السجن",
      bank_ev_free_dbl: "{name}: خروج من السجن بدبل",
      bank_ev_free_pay: "{name}: خروج من السجن بـ50",
      bank_ev_free_card: "{name}: خروج من السجن بالكارت",
      bank_ev_free_forced: "{name}: التالتة، 50 وخروج",
      bank_ev_build: "{name}: {what} في {place}",
      bank_ev_sell: "{name}: بيع بنا في {place}",
      bank_ev_mortgage: "{name}: رهن {place}",
      bank_ev_unmortgage: "{name}: فك رهن {place}",
      bank_ev_bus: "{name}: الأتوبيس السريع، {n} خانات تاني",
      bank_ev_pot: "{name}: {n} من النص",
      bank_ev_trade: "تبديل: {a} و{b}",
      bank_ev_refuse: "{name}: لأ على العرض",
      bank_ev_bankrupt: "{name}: إفلاس",
      bank_last_lap_ev: "الوقت خلص: آخر لفة",
      bank_ev_host: "المضيف لعب بدل {name}",
      bank_ev_clock: "الوقت خلص: الموبايل لعب بدل {name}",
      bank_ev_left: "{name}: خروج من اللعبة",
      bank_over_time: "الوقت خلص",
      bank_over_last: "فضل واحد بس",
      bank_over_bots: "مافضلش غير الكمبيوتر: الأغنى كسب",
      bank_worth_hint: "الترتيب بالفلوس والأماكن والبنا",
      bank_again: "العب تاني",
      bank_token_car: "سيارة",
      bank_token_camel: "جمل",
      bank_token_boat: "مركب",
      bank_token_plane: "طيارة",
      bank_token_scooter: "موتوسيكل",
      bank_token_hat: "برنيطة",
      bank_free: "فاضية",
      bank_token_label: "القطع",
      bank_token_yours: "دوس على قطعتك تاني عشان تسيبها.",
      bank_token_pick: "اختار قطعتك. اللي مايختارش ياخد واحدة لما اللعبة تبدأ.",
      bank_watching_next: "انت بتتفرج اللعبة دي.",
      bank_seats_label: "بيلعبوا ({n} من 6)",
      bank_seats_hint_host: "اللعب لـ 6 بس: دوس على اسم عشان يلعب أو يتفرج.",
      bank_seats_hint: "المضيف بيختار مين يلعب، والباقي بيتفرج.",
      bank_minutes: "{n} دقيقة",
      bank_until_one_hint: "اللعبة الأصلية: ممكن تطوّل ساعتين وأكتر.",
      bank_first_lap: "لسه قبل أول لفة",
      bank_first_lap_hint: "تقدر تشتري بعد ما تعدّي البداية",
      bank_for_sale_later: "للبيع، بس بعد أول لفة",
      bank_ev_not_yet: "{name}: {place}، والشرا بعد أول لفة",
      bank_ev_start_first: "{name}: {n} من البداية، والشرا بقى مسموح",
      bank_trade_locked_them: "{name}: الأماكن بعد أول لفة",
      bank_trade_locked_me: "تاخد أماكن بعد ما تعدّي البداية",
      bank_roll_six: "ارمي للستة",
      bank_jail_try_six: "محاولة {n} من 3 للستة",
      bank_six_again: "ستة! ارمي تاني",
      bank_ev_jail_three6: "{name}: 3 ستات ورا بعض، على السجن",
      bank_ev_free_six: "{name}: خروج من السجن بستة",
      bank_clock: "وقت الدور",
      bank_clock_off: "من غير",
      bank_clock_hint: "لما الوقت يخلص الموبايل بيرمي ويدفع ويخلّص الدور، من غير ما يشتري.",
      bank_lobby_hint: "مين يبدأ بيتحدد بالزهر: الأعلى يبدأ.",
      bank_play_for: "العب بدل {name}",
      bank_wait_host: "المضيف هيختار اللي بعده.",
      bank_raise_btn: "🪄 غطّي الدين",
      bank_raise_can: "الفلوس مش مكفية، بس أملاكك تكفي: «غطّي الدين» توريك هتبيع وترهن إيه وتدفع",
      bank_plan_title: "🪄 غطّي الدين",
      bank_plan_sub: "عليك {n} ومعاك {cash}. ده اللي هيتعمل:",
      bank_plan_sell: "بيع {lvl} في {place}",
      bank_plan_mort: "رهن {place}",
      bank_plan_after: "بعدها تدفع {n} ويفضل معاك {left}",
      bank_plan_ok: "تمام",
      bank_plan_hand: "🏗️ هعملها بإيدي",
      bank_plan_changed: "اللعبة اتغيّرت، دي الخطة الجديدة",
      bank_race_title: "💰 الثروة",
      bank_race_last: "🏁 اللفة الأخيرة",
      bank_buy_means: "هيبقى معاك {have} من {of} {grp} · يفضل معاك {left}",
      bank_buy_full: "هتكمّل {grp} كله! · يفضل معاك {left}",
      bank_build_nudge: "🏗️ عندك لون كامل، تبني؟",
    },
    en: {
      bank_money: "E£{n}",
      bank_lvl_0: "Empty land",
      bank_lvl_1: "Garage",
      bank_lvl_2: "Rest stop",
      bank_lvl_3: "Market",
      bank_owned_by: "Owned by {name}",
      bank_mortgaged: "Mortgaged",
      bank_for_sale: "For sale",
      bank_rent: "Rent",
      bank_rent_set: "Whole colour",
      bank_build_costs: "Building: {a} a garage, {b} a rest stop or a market",
      bank_stations_n: "With {n}",
      bank_co_one: "One company: dice ×",
      bank_co_both: "Both: dice ×",
      bank_luck: "Luck",
      bank_court: "Court",
      bank_sq_go: "Collect 200 every time you pass",
      bank_sq_jail: "Just visiting, unless you are locked in",
      bank_sq_bus: "Move again by the same number",
      bank_sq_tojail: "Straight to jail",
      bank_sq_tax: "Pay the bank",
      bank_sq_luck: "Draw a Luck card",
      bank_sq_court: "Draw a Court card",
      bank_tap_square: "Tap any square to see its card",
      bank_out: "Bankrupt",
      bank_jail_card: "Get-out-of-jail card",
      bank_last_lap: "Last lap",
      bank_turn_of: "{name}'s turn",
      bank_thinking: "The computer is thinking…",
      bank_raising: "Waiting for {name} to raise the money",
      bank_deciding: "Waiting for {name} to decide",
      bank_in_jail: "You're in jail",
      bank_double_again: "A double! Roll again",
      bank_your_turn: "Your turn!",
      bank_jail_try: "Try {n} of 3 for a double",
      bank_roll_double: "Roll for a double",
      bank_roll: "Roll",
      bank_pay_out: "Pay {n} and leave",
      bank_use_card: "Use the card",
      bank_buy_q: "Buy {place}?",
      bank_short_buy: "Not enough cash: mortgage or sell something, or leave it",
      bank_buy: "Buy · {n}",
      bank_leave: "Leave it",
      bank_the_bank: "the bank",
      bank_everyone: "everyone",
      bank_you_owe: "You owe {to} {n}",
      bank_raise_hint: "Raise it from your places (mortgage or sell buildings), or go bankrupt",
      bank_pay: "Pay",
      bank_bankrupt: "Go bankrupt",
      bank_act_hint: "Build, trade or mortgage, then end your turn",
      bank_end_turn: "End turn",
      bank_manage: "My places",
      bank_trade: "Trade",
      bank_nothing: "nothing",
      bank_offer_between: "{a} made {b} an offer",
      bank_offer_from: "{name} made you an offer",
      bank_you_get: "You get",
      bank_you_give: "You give",
      bank_accept: "Accept",
      bank_refuse: "No",
      bank_offer_waiting: "Waiting for {name}",
      bank_no_places: "No places",
      bank_build: "Build {n}",
      bank_sell: "Sell +{n}",
      bank_mortgage: "Mortgage +{n}",
      bank_unmortgage: "Redeem −{n}",
      bank_manage_title: "Your places",
      bank_manage_hint: "Build on a whole colour, evenly. Mortgage for half the price, redeem for 10% more.",
      bank_cash: "Cash",
      bank_trade_title: "Make an offer",
      bank_you_want: "You take from {name}",
      bank_send_offer: "Send the offer",
      bank_ev_first: "{name} starts",
      bank_ev_first_you: "You start",
      bank_ev_buy: "{name} bought {place} for {n}",
      bank_ev_rent: "Rent {n}: {name} → {other}",
      bank_ev_tax: "{name} paid {n} tax",
      bank_ev_start: "{name} collected {n} at Start",
      bank_ev_jail: "{name} went to jail",
      bank_ev_jail_three: "{name}: three doubles in a row, to jail",
      bank_ev_free_dbl: "{name} rolled a double out of jail",
      bank_ev_free_pay: "{name} paid 50 out of jail",
      bank_ev_free_card: "{name} used a card out of jail",
      bank_ev_free_forced: "{name}: third try, paid 50 and out",
      bank_ev_build: "{name} built a {what} on {place}",
      bank_ev_sell: "{name} sold a building on {place}",
      bank_ev_mortgage: "{name} mortgaged {place}",
      bank_ev_unmortgage: "{name} redeemed {place}",
      bank_ev_bus: "{name}: the Express Bus, {n} more squares",
      bank_ev_pot: "{name} took {n} from the middle",
      bank_ev_trade: "{a} and {b} made a trade",
      bank_ev_refuse: "{name} said no to the offer",
      bank_ev_bankrupt: "{name} went bankrupt",
      bank_last_lap_ev: "Time's up: the last lap",
      bank_ev_host: "The host played for {name}",
      bank_ev_clock: "Time's up: the phone played for {name}",
      bank_ev_left: "{name} left the game",
      bank_over_time: "Time's up",
      bank_over_last: "One player left",
      bank_over_bots: "Only computer players left: the richest wins",
      bank_worth_hint: "Ranked by cash, places and buildings",
      bank_again: "Play again",
      bank_token_car: "Car",
      bank_token_camel: "Camel",
      bank_token_boat: "Boat",
      bank_token_plane: "Plane",
      bank_token_scooter: "Scooter",
      bank_token_hat: "Hat",
      bank_free: "Free",
      bank_token_label: "Pieces",
      bank_token_yours: "Tap your piece again to let it go.",
      bank_token_pick: "Pick your piece. Anyone who doesn't gets one at the start.",
      bank_watching_next: "You're watching this game.",
      bank_seats_label: "Playing ({n} of 6)",
      bank_seats_hint_host: "Six play at most: tap a name to seat them or let them watch.",
      bank_seats_hint: "The host picks who plays; the rest watch.",
      bank_minutes: "{n} min",
      bank_until_one_hint: "The full game: it can take two hours or more.",
      bank_first_lap: "Not round the board yet",
      bank_first_lap_hint: "You can buy once you pass Start",
      bank_for_sale_later: "For sale, after a first lap",
      bank_ev_not_yet: "{name}: {place}, buying starts after the first lap",
      bank_ev_start_first: "{name} collected {n} at Start, and can buy now",
      bank_trade_locked_them: "{name}: places only after the first lap",
      bank_trade_locked_me: "You can take places once you pass Start",
      bank_roll_six: "Roll for a 6",
      bank_jail_try_six: "Try {n} of 3 for a 6",
      bank_six_again: "A 6! Roll again",
      bank_ev_jail_three6: "{name}: three 6s in a row, to jail",
      bank_ev_free_six: "{name} rolled a 6 out of jail",
      bank_clock: "Turn clock",
      bank_clock_off: "Off",
      bank_clock_hint: "When it runs out the phone rolls, pays and ends the turn, without buying.",
      bank_lobby_hint: "The dice decide who starts: highest first.",
      bank_play_for: "Play for {name}",
      bank_wait_host: "The host picks what's next.",
      bank_raise_btn: "🪄 Cover the debt",
      bank_raise_can: "Not enough cash, but your places cover it: “Cover the debt” shows what it sells and mortgages, then pays",
      bank_plan_title: "🪄 Cover the debt",
      bank_plan_sub: "You owe {n} and have {cash}. Here's the plan:",
      bank_plan_sell: "Sell the {lvl} on {place}",
      bank_plan_mort: "Mortgage {place}",
      bank_plan_after: "Then pay {n}, leaving you {left}",
      bank_plan_ok: "OK",
      bank_plan_hand: "🏗️ I'll do it myself",
      bank_plan_changed: "The game moved on: here's the new plan",
      bank_race_title: "💰 Wealth",
      bank_race_last: "🏁 Last lap",
      bank_buy_means: "You'll have {have} of {of} {grp} · {left} left",
      bank_buy_full: "Completes the {grp} set! · {left} left",
      bank_build_nudge: "🏗️ You have a whole colour: build?",
    }
  },
  rules: {
    ar: {
      bank: `
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li>من 2 لـ 6، كل واحد بيبدأ بـ <b>1,500 ج</b> على البداية. ارمي الزهرين واتحرك بمجموعهم.</li>
                <li>وقفت على مدينة أو محطة أو شركة محدش شاريها؟ <b>اشتريها</b> أو سيبها للبنك. لو ليها صاحب، الإيجار بيتدفع لوحده.</li>
                <li>كل ما تعدّي على البداية تاخد <b>200</b>. الدبل ليه رمية تانية، و<b>3 دبل ورا بعض</b> على السجن.</li>
                <li><b>الشرا بعد أول لفة</b> (شغّالة من الأول، وتتقفل من الإعدادات): قبل ما تعدّي البداية مرة المكان الفاضي بيفضل للبنك، ومحدش يدّيك مكان في بدل. الإيجار بيتدفع عادي، وجنب اسمك 🔄 لحد ما تعدّيها.</li>
                <li>لو معاك <b>اللون كله</b> الإيجار بيبقى الضعف، وتقدر <b>تبني بالتساوي</b>: جراج ← استراحة ← سوق، وكل بنا بيعلّي الإيجار.</li>
                <li><b>إيجار عالي من الأول</b> (مقفولة من الأول): المكان من غير بنا إيجاره من 15 لـ 50 حسب تمنه، والضعف للون كله، فكل وقفة بتوجع من أول دور. كارت المكان في النص بيوري الأرقام اللي شغّالة.</li>
                <li><b>زهرة واحدة</b> (مقفولة من الأول): بتتحرك برقم زهرة واحدة، والستة زي الدبل: رمية تانية، و3 ستات ورا بعض على السجن، وفي السجن الستة بتطلّعك وتتحرك 6 من غير رمية تانية. الشركات: الزهرة × 8، أو × 20 لو معاك الاتنين.</li>
                <li>محتاج فلوس؟ <b>ارهن</b> مكان بنص تمنه (مايدخلش إيجار لحد ما تفكّه بزيادة 10%)، أو <b>بيع البنا</b> للبنك بنص تمنه.</li>
                <li><b>السجن</b>: ادفع 50، أو استعمل كارت خروج، أو ارمي للدبل (3 محاولات، وبعد التالتة تدفع 50 وتتحرك). وانت جوّه بتقبض الإيجار عادي.</li>
                <li><b>الأتوبيس السريع</b>: اللي يقف عليه يتحرك تاني بنفس الرقم. <b>حظ</b> و<b>محاكمة</b>: كارت من فوق الكومة.</li>
                <li>في دورك تقدر <b>تبدّل</b> مع أي لاعب: أماكن وفلوس وكروت خروج، وهو يوافق أو يرفض. الأماكن اللي على لونها بنا ماتتبدلش.</li>
                <li>مش قادر تدفع حتى بعد الرهن والبيع؟ <b>إفلاس</b>: كل حاجتك للي ليه عليك، أو للبنك.</li>
                <li>اللعبة بتخلص لما يفضل واحد، أو لما <b>الوقت يخلص</b>: اللفة بتكمل، والأغنى يكسب (الفلوس والأماكن والبنا).</li>
            </ol>
            <p class="help-sub">💡 الموبايل بيساعدك</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>دوس على أي خانة تشوف كارتها في نص اللوحة: السعر والإيجار في كل مرحلة وصاحبها.</li>
                <li>🏗️ أملاكي: ابني وبيع وارهن وفك الرهن من مكان واحد. 🤝 بدّل: اختار لاعب واللي هتدّيه واللي هتاخده.</li>
                <li>عليك دين وفلوسك مش مكفية؟ <b>🪄 غطّي الدين</b> بيوريك هيبيع بنا إيه ويرهن إيه (الأرخص الأول، زي الكمبيوتر)، و«تمام» تعملها وتدفع. أو اعملها بإيدك من 🏗️.</li>
            </ul>
            <p class="help-sub">🤖 ضد الموبايل</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>انت ومن 1 لـ 3 لاعبين كمبيوتر، سهل أو صعب. بيردّوا على عروضك، بس مابيعملوش عروض.</li>
                <li>الوقت بيتحسب بس وانت بتلعب.</li>
            </ul>
            <p class="help-sub">📱 كل واحد من موبايله</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>كل واحد يختار قطعته، والبداية بالزهر. لو أكتر من 6 في الغرفة المضيف بيختار مين يلعب.</li>
                <li>المضيف بيختار مدة اللعبة (45 دقيقة من الأول)، و"الشرا بعد أول لفة" (شغّالة من الأول)، و"إيجار عالي من الأول"، و"زهرة واحدة"، و"فلوس في النص"، و"400 للي يقف على البداية"، ووقت الدور.</li>
            </ul>
            <p class="help-sub">📺 على التلفزيون</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>اللوحة كبيرة بأسامي المدن وأسعارها، والفلوس والكروت وكل حركة قدام الكل.</li>
                <li><b>💰 الثروة</b>: عمود لكل لاعب بقيمته كلها (الفلوس والأماكن والبنا، زي آخر اللعبة)، بيتحرك مع كل إيجار وشرا، وفي اللفة الأخيرة بيكبر.</li>
            </ul>`,
    },
    en: {
      bank: `
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li>2 to 6 players, each starting on Start with <b>E£1,500</b>. Roll the two dice and move by their total.</li>
                <li>Land on a city, a station or a company nobody owns? <b>Buy it</b> or leave it with the bank. If someone owns it, the rent is paid by itself.</li>
                <li>Every time you pass Start you collect <b>200</b>. A double rolls again, and <b>three doubles in a row</b> go to jail.</li>
                <li><b>Buy after the first lap</b> (on to begin with, a switch in the options): until you pass Start once, a free place you land on stays with the bank and nobody can give you a place in a trade. Rent is paid as usual, and 🔄 sits by your name until you pass it.</li>
                <li>Own <b>the whole colour</b> and its rent doubles, and you can <b>build evenly</b>: garage ← rest stop ← market, each raising the rent.</li>
                <li><b>High rents from the start</b> (off to begin with): a place with no buildings rents for 15 to 50 by its price, double for a whole colour, so every landing hurts from the first turn. The card in the middle of the board shows the numbers in play.</li>
                <li><b>One die</b> (off to begin with): you move by one die, and a 6 counts as a double: another roll, three 6s in a row to jail, and in jail a 6 gets you out and moves you 6 with no roll after. Companies: the die × 8, or × 20 with both.</li>
                <li>Need money? <b>Mortgage</b> a place for half its price (no rent until you redeem it for 10% more), or <b>sell buildings</b> back for half.</li>
                <li><b>Jail</b>: pay 50, use a get-out card, or roll for a double (three tries; after the third you pay 50 and move). You still collect rent inside.</li>
                <li><b>The Express Bus</b>: land on it and move again by the same number. <b>Luck</b> and <b>Court</b>: a card from the top of the pile.</li>
                <li>On your turn you can <b>trade</b> with anyone: places, money and get-out cards; they accept or refuse. Places with buildings on their colour can't be traded.</li>
                <li>Can't pay even after mortgaging and selling? <b>Bankrupt</b>: everything goes to whoever you owe, or to the bank.</li>
                <li>The game ends when one is left, or when <b>time is up</b>: the lap is finished and the richest wins (cash, places and buildings).</li>
            </ol>
            <p class="help-sub">💡 The phone helps</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>Tap any square to see its card in the middle of the board: the price, the rent at every step, and who owns it.</li>
                <li>🏗️ My places: build, sell, mortgage and redeem in one place. 🤝 Trade: pick a player, what you give and what you want.</li>
                <li>A debt your cash can't cover? <b>🪄 Cover the debt</b> shows which buildings it would sell and which places it would mortgage (the cheapest first, as the computer does), and "OK" does it and pays. Or do it yourself from 🏗️.</li>
            </ul>
            <p class="help-sub">🤖 Against the phone</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>You and 1 to 3 computer players, easy or hard. They answer your offers but never make their own.</li>
                <li>The time only counts while you are playing.</li>
            </ul>
            <p class="help-sub">📱 On separate phones</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>Everyone picks a piece; the dice decide who starts. With more than 6 in the room the host picks who plays.</li>
                <li>The host picks the length (45 minutes to begin with), "buy after the first lap" (on to begin with), "high rents from the start", "one die", "money in the middle", "400 for landing on Start" and a turn clock.</li>
            </ul>
            <p class="help-sub">📺 On the TV</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>The board big, with every city and its price, and the money, the cards and every move in front of everyone.</li>
                <li><b>💰 Wealth</b>: a bar for each player at their whole worth (cash, places and buildings, as the end counts it), moving with every rent and purchase, and taller on the last lap.</li>
            </ul>`,
    }
  }
});
