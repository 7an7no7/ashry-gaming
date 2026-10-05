/* uno: the words only this game's screens show, and its rules (Help, the
   first-play card). The build puts them into TRANSLATIONS and GAME_RULES (tools/game-text.cjs):
   read them as t.<key> and GAME_RULES[lang].<id>, as everywhere. */
gameText({
  translations: {
    ar: {
      uno_lobby_hint: "كل واحد ورقه على موبايله، والأرض والدور قدام الكل. طابق اللون أو الرقم أو الرمز، وخلّص ورقك قبل الكل.",
      uno_lobby_wait: "المضيف بيظبط القواعد",
      uno_need_two: "محتاجين لاعبين على الأقل: لو لوحدك ضيف لاعب كمبيوتر",
      uno_deck_one: "108 كارت · كوتشينة واحدة",
      uno_deck_two: "216 كارت · كوتشينتين (من 11 لاعب)",
      uno_length: "طول اللعبة",
      uno_length_one: "جولة واحدة",
      uno_length_rounds: "كذا جولة بالنقط",
      uno_length_hint_one: "أول واحد يخلّص ورقه يكسب.",
      uno_length_hint_rounds: "اللي يخلّص ورقه ياخد نقط الورق اللي فضل مع الباقيين، والأكتر نقط في الآخر يكسب.",
      uno_rounds: "عدد الجولات",
      uno_stacking: "تجميع السحب",
      uno_stacking_hint: "اللي عليه سحب يقدر يرمي كارت سحب زيه ويعدّيه للي بعده أكبر، أو يسحب الكل ودوره يروح.",
      uno_stack_same: "+2 على +2 و+4 على +4",
      uno_stack_mixed: "كمان +4 على +2",
      uno_stack_same_hint: "كل كارت على نوعه بس.",
      uno_stack_mixed_hint: "الـ+4 ينفع يترمي على +2 ويكبّر السحب، بس الـ+2 مايترميش على +4.",
      uno_draw_until: "اسحب لحد ما تلاقي",
      uno_draw_until_hint: "بدل كارت واحد: تفضل تسحب لحد ما يطلع كارت ينفع، وبعدها ترميه أو تخليه.",
      uno_seven_o: "7 و0",
      uno_seven_o_hint: "الـ7 تبدّل ورقك كله مع لاعب تختاره، والـ0 كل واحد يدّي ورقه للي بعده.",
      uno_jump_in: "الدخول على الدور",
      uno_jump_in_hint: "اللي معاه نفس الكارت اللي على الأرض بالظبط (نفس اللون ونفس الرقم أو الرمز) يرميه في أي وقت، واللعب يكمّل من عنده.",
      uno_clock: "وقت الدور",
      uno_clock_off: "من غير",
      uno_clock_hint: "لو الوقت خلص الموبايل بيلعب بدل اللاعب: ياخد السحب اللي عليه، أو يسحب كارت ويعدّي.",
      uno_c_r: "أحمر",
      uno_c_y: "أصفر",
      uno_c_g: "أخضر",
      uno_c_b: "أزرق",
      uno_card_of: "{v} {c}",
      uno_card_skip: "تخطي",
      uno_card_rev: "عكس",
      uno_card_wild: "جوكر",
      uno_deck: "الورق",
      uno_your_cards: "ورقك",
      uno_no_color: "لسه",
      uno_dir: "اتجاه اللعب",
      uno_next: "بعده: {name}",
      uno_round_of: "جولة {n}/{m}",
      uno_one_round: "جولة واحدة",
      uno_turn_of: "دور {name}",
      uno_your_turn: "دورك!",
      uno_play_lit: "ارمي كارت من المنوّرين، أو اسحب",
      uno_nothing_fits: "مفيش كارت ينفع: اسحب",
      uno_draw: "اسحب كارت",
      uno_draw_until_btn: "اسحب لحد ما يطلع كارت",
      uno_facing: "عليك +{n}",
      uno_facing_hint_stack: "ارمي +2 عشان تعدّيها للي بعدك، أو اسحبهم",
      uno_facing_hint_mixed: "ارمي +2 أو +4 عشان تعدّيها للي بعدك، أو اسحبهم",
      uno_facing_hint_w4: "ارمي +4 عشان تعدّيها للي بعدك، أو اسحبهم",
      uno_facing_hint_none: "مفيش معاك كارت تعدّي بيه: اسحبهم",
      uno_auto_take: "مفيش معاك كارت تعدّي بيه: هتسحب الـ{n} لوحدهم",
      uno_auto_draw: "مفيش كارت ينزل: هتسحب كارت لوحده",
      uno_auto_draw_until: "مفيش كارت ينزل: هتسحب لوحدك لحد ما يطلع كارت",
      uno_take: "اسحب الـ{n}",
      uno_drawn: "سحبت {card} وينفع يترمي",
      uno_play_it: "ارميه",
      uno_keep_it: "خليه معايا",
      uno_pick_color: "اختار اللون",
      uno_pick_first_color: "الجولة بدأت بجوكر: اختار اللون اللي هيبدأ بيه اللعب",
      uno_pick_target: "تبدّل ورقك مع مين؟",
      uno_cancel: "إلغاء",
      uno_say: "أونو!",
      uno_say_hint: "فاضل معاك كارتين: دوس أونو قبل ما ترمي، أو بعدها على طول",
      uno_say_now: "قول أونو قبل ما يمسكوك!",
      uno_said: "أونو ✓",
      uno_tag: "أونو",
      uno_catch: "امسكه! · {name}",
      uno_caught_stamp: "امسكه!",
      uno_catch_hint: "{name}: كارت واحد ومفيش أونو",
      uno_jump_hint: "⚡ معاك نفس الكارت اللي على الأرض: دوس عليه وادخل",
      uno_cant: "الكارت ده مينفعش دلوقتي",
      uno_waiting_color: "🎨 {name}: اختيار اللون",
      uno_waiting_drawn: "✋ {name}: كارت مسحوب في الإيد",
      uno_waiting_facing: "على {name} سحب +{n}",
      uno_skip_turn: "عدّي دور {name}",
      uno_ev_deal: "🃏 الجولة {n}: أول كارت {card}",
      uno_ev_play: "🂠 {name}: {card}",
      uno_ev_play_color: "🎨 {name}: {card}، واللون {color}",
      uno_ev_jump: "⚡ {name}: دخول بـ{card}",
      uno_ev_skip: "⊘ {name}: الدور راح",
      uno_ev_reverse: "🔄 الدور لف في الاتجاه التاني",
      uno_ev_hit: "➕ {name}: سحب {n}",
      uno_ev_take: "➕ {name}: سحب الـ{n}",
      uno_ev_draw: "🂠 {name}: سحب كارت",
      uno_ev_draw_n: "🂠 {name}: سحب {n} كروت",
      uno_ev_keep: "✋ {name}: الكارت فضل في الإيد",
      uno_ev_pass: "⏭️ {name}: مفيش ورق يتسحب، والدور عدّى",
      uno_ev_color: "🎨 {name}: اللون {color}",
      uno_ev_uno: "📣 {name}: أونو!",
      uno_ev_caught: "🚨 {name}: من غير أونو، سحب {n} ({by})",
      uno_ev_swap: "🔀 {name} ⇄ {target}: الورق اتبدّل",
      uno_ev_rotate: "🔁 كل ورق راح للي بعده",
      uno_ev_reshuffle: "🔀 الورق خلص: الأرض اتخلطت ورجعت ورق",
      uno_ev_auto_clock: "⏱️ {name}: الوقت خلص",
      uno_ev_auto_host: "⏭️ {name}: المضيف عدّى الدور",
      uno_ev_win: "🏆 {name}: الورق خلص!",
      uno_ev_left: "🚪 {name}: خروج من اللعبة",
      uno_round_won: "🏆 الجولة لـ{name}",
      uno_won_one: "🏆 اللي كسب: {name}!",
      uno_wins_board: "مرات الفوز",
      uno_gained: "{n} نقطة من الورق اللي فضل",
      uno_no_cards: "خلّص ✓",
      uno_reveal_title: "الورق اللي فضل",
      uno_points_rule: "اللي بيخلّص بياخد نقط الورق اللي فضل: الرقم بقيمته، التخطي والعكس و+2 بـ20، والجوكر بـ50.",
      uno_game_won: "الكسبان: {name}",
      uno_forfeit: "اللعبة خلصت: مفيش لاعبين كفاية",
    },
    en: {
      uno_lobby_hint: "Everyone holds their cards on their own phone; the pile and the turn are in front of everyone. Match the colour, the number or the symbol, and go out first.",
      uno_lobby_wait: "The host is setting the rules",
      uno_need_two: "You need at least two players: on your own, add a computer player",
      uno_deck_one: "108 cards · one deck",
      uno_deck_two: "216 cards · two decks (from 11 players)",
      uno_length: "Game length",
      uno_length_one: "One round",
      uno_length_rounds: "Rounds with points",
      uno_length_hint_one: "The first to go out wins.",
      uno_length_hint_rounds: "Whoever goes out scores the cards left in everyone else's hand; most points at the end wins.",
      uno_rounds: "Rounds",
      uno_stacking: "Stacking draws",
      uno_stacking_hint: "Facing a draw, throw a draw card like it to pass it on, bigger, to the next player - or draw the lot and lose your turn.",
      uno_stack_same: "+2 on +2, +4 on +4",
      uno_stack_mixed: "Also +4 on +2",
      uno_stack_same_hint: "Each card only on its own kind.",
      uno_stack_mixed_hint: "A +4 may go on a +2 and raise the pile; a +2 can't go on a +4.",
      uno_draw_until: "Draw until you can play",
      uno_draw_until_hint: "Instead of one card, keep drawing until one fits; then play it or keep it.",
      uno_seven_o: "7-0",
      uno_seven_o_hint: "A 7 swaps your whole hand with a player you pick; a 0 passes every hand on one seat.",
      uno_jump_in: "Jump in",
      uno_jump_in_hint: "Anyone holding the very same card as the top one (same colour, same number or symbol) may throw it at any time, and play carries on from them.",
      uno_clock: "Turn clock",
      uno_clock_off: "Off",
      uno_clock_hint: "When it runs out the phone plays for the player: it takes a draw waiting on them, or draws a card and passes.",
      uno_c_r: "Red",
      uno_c_y: "Yellow",
      uno_c_g: "Green",
      uno_c_b: "Blue",
      uno_card_of: "{c} {v}",
      uno_card_skip: "Skip",
      uno_card_rev: "Reverse",
      uno_card_wild: "Wild",
      uno_deck: "Deck",
      uno_your_cards: "Your cards",
      uno_no_color: "None yet",
      uno_dir: "Direction of play",
      uno_next: "Next: {name}",
      uno_round_of: "Round {n}/{m}",
      uno_one_round: "One round",
      uno_turn_of: "{name}'s turn",
      uno_your_turn: "Your turn!",
      uno_play_lit: "Play one of the lit cards, or draw",
      uno_nothing_fits: "Nothing fits: draw",
      uno_draw: "Draw a card",
      uno_draw_until_btn: "Draw until one fits",
      uno_facing: "+{n} on you",
      uno_facing_hint_stack: "Throw a +2 to pass it on, or draw them",
      uno_facing_hint_mixed: "Throw a +2 or a +4 to pass it on, or draw them",
      uno_facing_hint_w4: "Throw a +4 to pass it on, or draw them",
      uno_facing_hint_none: "Nothing to pass it on with: draw them",
      uno_auto_take: "Nothing to pass it on with: the {n} are drawn for you",
      uno_auto_draw: "Nothing fits: a card is drawn for you",
      uno_auto_draw_until: "Nothing fits: cards are drawn for you until one does",
      uno_take: "Draw {n}",
      uno_drawn: "You drew {card}, and it fits",
      uno_play_it: "Play it",
      uno_keep_it: "Keep it",
      uno_pick_color: "Pick a colour",
      uno_pick_first_color: "The round opened on a wild: pick the colour play starts on",
      uno_pick_target: "Swap hands with whom?",
      uno_cancel: "Cancel",
      uno_say: "UNO!",
      uno_say_hint: "Two cards left: press UNO before you play, or right after",
      uno_say_now: "Say UNO before they catch you!",
      uno_said: "UNO ✓",
      uno_tag: "UNO",
      uno_catch: "Catch! · {name}",
      uno_caught_stamp: "Caught!",
      uno_catch_hint: "{name}: one card and no UNO",
      uno_jump_hint: "⚡ You hold the very card on the pile: tap it to jump in",
      uno_cant: "That card can't go now",
      uno_waiting_color: "🎨 {name} is picking the colour",
      uno_waiting_drawn: "✋ {name} is holding a drawn card",
      uno_waiting_facing: "+{n} on {name}",
      uno_skip_turn: "Skip {name}'s turn",
      uno_ev_deal: "🃏 Round {n}: {card} turned up",
      uno_ev_play: "🂠 {name}: {card}",
      uno_ev_play_color: "🎨 {name}: {card}, and {color}",
      uno_ev_jump: "⚡ {name} jumped in with {card}",
      uno_ev_skip: "⊘ {name} is skipped",
      uno_ev_reverse: "🔄 Play turned the other way",
      uno_ev_hit: "➕ {name} drew {n}",
      uno_ev_take: "➕ {name} drew the {n}",
      uno_ev_draw: "🂠 {name} drew a card",
      uno_ev_draw_n: "🂠 {name} drew {n} cards",
      uno_ev_keep: "✋ {name} kept the card",
      uno_ev_pass: "⏭️ {name}: nothing left to draw, turn passed",
      uno_ev_color: "🎨 {name}: {color}",
      uno_ev_uno: "📣 {name}: UNO!",
      uno_ev_caught: "🚨 {name}: no UNO, drew {n} ({by})",
      uno_ev_swap: "🔀 {name} ⇄ {target}: hands swapped",
      uno_ev_rotate: "🔁 Every hand moved on one seat",
      uno_ev_reshuffle: "🔀 The deck ran out: the pile was shuffled into a new one",
      uno_ev_auto_clock: "⏱️ {name}: time's up",
      uno_ev_auto_host: "⏭️ {name}: the host skipped the turn",
      uno_ev_win: "🏆 {name} is out!",
      uno_ev_left: "🚪 {name} left the game",
      uno_round_won: "🏆 The round goes to {name}",
      uno_won_one: "🏆 {name} wins!",
      uno_wins_board: "Wins",
      uno_gained: "{n} points from the cards left",
      uno_no_cards: "Out ✓",
      uno_reveal_title: "The cards left",
      uno_points_rule: "Whoever goes out scores the cards left: numbers their face, Skip, Reverse and +2 20, a wild 50.",
      uno_game_won: "Winner: {name}",
      uno_forfeit: "The game is over: not enough players left",
    }
  },
  rules: {
    ar: {
      uno: `
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li>كل واحد بياخد <b>7 كروت</b> على موبايله، وكارت بيتقلب على الأرض.</li>
                <li>في دورك ارمي كارت <b>بنفس اللون</b> أو <b>نفس الرقم أو الرمز</b> اللي على الأرض، أو <b>جوكر</b>. الكروت اللي تنفع بتنوّر لوحدها.</li>
                <li>مفيش كارت ينفع (أو مش عايز ترمي)؟ <b>اسحب كارت واحد</b>: لو ينفع ترميه على طول أو تخليه معاك ودورك يخلص. بعد ما تسحب مينفعش ترمي كارت تاني من إيدك.</li>
                <li>لما يفضل معاك كارتين، دوس <b>أونو!</b> قبل ما ترمي واحد منهم أو بعدها على طول. لو فضلت بكارت واحد ومقلتهاش، أي حد يقدر يدوس <b>امسكه!</b> قبل الحركة اللي بعدها، وتسحب كارتين.</li>
                <li>أول واحد يخلّص ورقه يكسب الجولة.</li>
            </ol>
            <p class="help-sub">📱 كل واحد من موبايله</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>ورقك على موبايلك بس، والباقيين شايفين عدد ورقك. الأرض واللون واتجاه اللعب ومين بعده قدام الكل، وكل حركة بتبان وهي بتحصل.</li>
                <li>المضيف بيختار القواعد في الغرفة، وموبايله بيفتكرها للمرة الجاية. لو عددكم قليل ضيفوا <b>لاعبين كمبيوتر</b>: السهل بيرمي أول كارت ينفع وساعات بينسى أونو، والصعب بيلعب عشان يكسب. والكمبيوتر مابيشوفش ورق حد.</li>
                <li>المضيف يقدر يعدّي دور حد موبايله فصل.</li>
            </ul>
            <p class="help-sub">📺 على التلفزيون</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>الترابيزة كلها: الأرض والورق وعدد ورق كل واحد، وكل حركة وهي بتحصل، والنتيجة في الآخر.</li>
            </ul>
            <p class="help-sub">💡 نصايح</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>خلّي الجوكر لما تحتاجه: بينقذك لما مفيش حاجة تنفع.</li>
                <li>اللي بعدك قرّب يخلّص؟ ارميه بتخطي أو <bdi dir="ltr">+2</bdi>.</li>
            </ul>
            <details class="help-more">
                <summary>🃏 الكروت</summary>
                <ul class="list-disc list-inside space-y-1 text-xs">
                    <li><b>108 كارت</b>: 4 ألوان (أحمر، أصفر، أخضر، أزرق)، في كل لون 0 واحد، واتنين من كل رقم من 1 لـ 9، واتنين تخطي، واتنين عكس، واتنين <bdi dir="ltr">+2</bdi>. وكمان 4 جوكر و4 جوكر <bdi dir="ltr">+4</bdi>. من 11 لاعب: كوتشينتين متخلطين.</li>
                    <li><b>تخطي</b>: اللي بعدك دوره بيروح. <b>عكس</b>: الدور بيلف في الاتجاه التاني (مع لاعبين اتنين بيبقى زي التخطي).</li>
                    <li><b><bdi dir="ltr">+2</bdi></b>: اللي بعدك يسحب 2 ودوره يروح. <b>جوكر</b>: ينفع على أي حاجة وتختار اللون. <b>جوكر <bdi dir="ltr">+4</bdi></b>: تختار اللون واللي بعدك يسحب 4 ودوره يروح، وينفع ترميه في أي وقت.</li>
                    <li><b>أول كارت</b>: لو جوكر <bdi dir="ltr">+4</bdi> بيرجع الورق ويتقلب غيره. لو جوكر، أول لاعب يختار اللون. لو تخطي أو عكس أو <bdi dir="ltr">+2</bdi> بيتطبّق على أول لاعب (مع العكس اللي وزّع هو اللي يبدأ في الاتجاه التاني).</li>
                    <li>الورق خلص؟ الأرض كلها غير الكارت اللي فوق بتتخلط وتبقى ورق جديد.</li>
                </ul>
            </details>
            <details class="help-more">
                <summary>🏠 قواعد البيت (من الغرفة)</summary>
                <ul class="list-disc list-inside space-y-1 text-xs">
                    <li><b>➕ تجميع السحب</b> (شغّال من الأول): اللي عليه سحب يقدر يرمي <bdi dir="ltr">+2</bdi> على <bdi dir="ltr">+2</bdi> (أي لون) أو <bdi dir="ltr">+4</bdi> على <bdi dir="ltr">+4</bdi>، والسحب يكبر ويروح للي بعده، أو يسحب الكل ودوره يروح. واختيار <b>كمان <bdi dir="ltr">+4</bdi> على <bdi dir="ltr">+2</bdi></b> بيخلّي الـ<bdi dir="ltr">+4</bdi> يترمي على <bdi dir="ltr">+2</bdi> (والـ<bdi dir="ltr">+2</bdi> عمره ما يترمي على <bdi dir="ltr">+4</bdi>). من غير التجميع: اللي بعد الـ<bdi dir="ltr">+2</bdi> أو الـ<bdi dir="ltr">+4</bdi> بيسحب على طول ودوره يروح.</li>
                    <li><b>🂠 اسحب لحد ما تلاقي</b>: بدل كارت واحد تفضل تسحب لحد ما يطلع كارت ينفع، وبعدها ترميه أو تخليه.</li>
                    <li><b>🔀 7 و0</b>: لما ترمي 7 تبدّل ورقك كله مع لاعب تختاره، ولما ترمي 0 كل واحد يدّي ورقه للي بعده في اتجاه اللعب. لو الـ7 أو الـ0 آخر كارت معاك، الجولة بتخلص من غير تبديل. واللي جاله كارت واحد بالتبديل ميتمسكش.</li>
                    <li><b>⚡ الدخول على الدور</b>: لو معاك نفس الكارت اللي على الأرض بالظبط (نفس اللون ونفس الرقم أو الرمز، مش جوكر)، ارميه في أي وقت حتى لو مش دورك، واللعب يكمّل من عندك واللي كان عليه الدور دوره يروح. لو على الأرض <bdi dir="ltr">+2</bdi> مستني حد والتجميع شغّال، دخولك بـ<bdi dir="ltr">+2</bdi> زيه بيكبّر السحب ويروح للي بعدك.</li>
                    <li><b>⏱️ وقت الدور</b> (30 أو 60 ثانية): لو الوقت خلص، الموبايل بيلعب بدلك: ياخد السحب اللي عليك، أو يسحب كارت ويعدّي.</li>
                </ul>
            </details>
            <details class="help-more">
                <summary>🧮 الجولات والنقط</summary>
                <ul class="list-disc list-inside space-y-1 text-xs">
                    <li><b>جولة واحدة</b> (من الأول): أول واحد يخلّص ورقه يكسب، من غير نقط. الورق اللي فضل بيتقلب للكل يشوفه، ولو لعبتوا تاني بتتعد مرات الفوز.</li>
                    <li><b>كذا جولة</b> (3 أو 5 أو 7): اللي يخلّص ورقه ياخد نقط الورق اللي فضل مع الباقيين: الرقم بقيمته، التخطي والعكس و<bdi dir="ltr">+2</bdi> بـ20، والجوكر والجوكر <bdi dir="ltr">+4</bdi> بـ50. بعد آخر جولة الأكتر نقط يكسب.</li>
                    <li>لو آخر كارت <bdi dir="ltr">+2</bdi> أو <bdi dir="ltr">+4</bdi>، اللي بعدك بيسحبهم برضه، وفي الجولات بيتحسبوا عليه.</li>
                </ul>
            </details>
            <details class="help-more">
                <summary>👥 اتنين اتنين (فرق)</summary>
                <ul class="list-disc list-inside space-y-1 text-xs">
                    <li>كل اتنين فريق قصاد بعض. أول واحد يخلّص، فريقه يكسب. مفيش تخطي ولا سحب على شريكك، وابعتله إشارة: لون، «الحقني» أو «سيبه ليا».</li>
                </ul>
            </details>`,
    },
    en: {
      uno: `
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li>Everyone gets <b>7 cards</b> on their phone, and one card is turned up on the pile.</li>
                <li>On your turn throw a card of <b>the same colour</b> or <b>the same number or symbol</b> as the pile, or a <b>wild</b>. The cards that fit light up by themselves.</li>
                <li>Nothing fits (or you'd rather not)? <b>Draw one card</b>: if it fits you may throw it at once, or keep it and your turn ends. After drawing you can't throw a different card from your hand.</li>
                <li>With two cards left, press <b>UNO!</b> before you throw one of them or right after. Down to one card without saying it, anyone can press <b>Catch!</b> before the next move, and you draw two.</li>
                <li>The first to go out wins the round.</li>
            </ol>
            <p class="help-sub">📱 Each on their own phone</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>Your cards are on your phone only; the others see how many you hold. The pile, the colour, the direction of play and who is next are in front of everyone, and every move shows as it happens.</li>
                <li>The host sets the rules in the room, and their phone remembers them for next time. Short of players, add <b>computer players</b>: the easy one throws the first card that fits and sometimes forgets UNO; the hard one plays to win. A computer never sees anyone's hand.</li>
                <li>The host can skip the turn of a phone that has gone quiet.</li>
            </ul>
            <p class="help-sub">📺 On the TV</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>The whole table: the pile, the deck and how many cards each player holds, every move as it happens, and the result at the end.</li>
            </ul>
            <p class="help-sub">💡 Tips</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>Keep a wild for when you need it: it saves you when nothing else fits.</li>
                <li>The next player is nearly out? Hit them with a Skip or a +2.</li>
            </ul>
            <details class="help-more">
                <summary>🃏 The cards</summary>
                <ul class="list-disc list-inside space-y-1 text-xs">
                    <li><b>108 cards</b>: four colours (red, yellow, green, blue), each with one 0 and two of every 1 to 9, two Skips, two Reverses and two +2s; then 4 wilds and 4 wild +4s. From 11 players: two decks shuffled together.</li>
                    <li><b>Skip</b>: the next player misses their turn. <b>Reverse</b>: play turns the other way (with two players it works as a Skip).</li>
                    <li><b>+2</b>: the next player draws 2 and misses their turn. <b>Wild</b>: goes on anything, and you name the colour. <b>Wild +4</b>: name the colour, and the next player draws 4 and misses their turn; it can be played at any time.</li>
                    <li><b>The first card</b>: a wild +4 goes back and another is turned. A wild: the first player picks the colour. A Skip, Reverse or +2 acts on the first player (with a Reverse the dealer starts, the other way round).</li>
                    <li>The deck ran out? The whole pile but its top card is shuffled into a new deck.</li>
                </ul>
            </details>
            <details class="help-more">
                <summary>🏠 House rules (set in the room)</summary>
                <ul class="list-disc list-inside space-y-1 text-xs">
                    <li><b>➕ Stacking draws</b> (on to begin with): facing a draw, throw a +2 on a +2 (any colour) or a +4 on a +4 and the draw grows and passes on - or draw it all and lose your turn. <b>Also +4 on +2</b> lets a +4 go on a +2 (a +2 never goes on a +4). With stacking off, the player after a +2 or +4 just draws and is skipped.</li>
                    <li><b>🂠 Draw until you can play</b>: instead of one card, keep drawing until one fits; then throw it or keep it.</li>
                    <li><b>🔀 7-0</b>: a 7 swaps your whole hand with a player you pick; a 0 passes every hand on one seat in the direction of play. A 7 or 0 as your last card ends the round with no swap, and a hand of one that came by a swap can't be caught.</li>
                    <li><b>⚡ Jump in</b>: holding the very same card as the pile's top (same colour, same number or symbol, never a wild), throw it at any time, even out of turn; play carries on from you and whoever was up loses the turn. On a +2 still waiting with stacking on, jumping in with the same +2 raises the draw and passes it to the player after you.</li>
                    <li><b>⏱️ Turn clock</b> (30 or 60 seconds): when it runs out the phone plays for you: it takes a draw waiting on you, or draws a card and passes.</li>
                </ul>
            </details>
            <details class="help-more">
                <summary>🧮 Rounds and points</summary>
                <ul class="list-disc list-inside space-y-1 text-xs">
                    <li><b>One round</b> (to begin with): the first to go out wins, no points. The cards left are turned over for everyone to see, and playing again counts the wins.</li>
                    <li><b>A number of rounds</b> (3, 5 or 7): whoever goes out scores the cards left in everyone else's hand - numbers their face, Skip, Reverse and +2 20, wilds and wild +4s 50. Most points after the last round wins.</li>
                    <li>If the last card is a +2 or +4, the next player still draws them, and in a game of rounds they count.</li>
                </ul>
            </details>
            <details class="help-more">
                <summary>👥 Pairs (teams of two)</summary>
                <ul class="list-disc list-inside space-y-1 text-xs">
                    <li>Pairs sit opposite; one partner out and the pair wins. No Skip or draw card on your partner; signal them a colour, "Help me" or "Leave it to me".</li>
                </ul>
            </details>`,
    }
  }
});
