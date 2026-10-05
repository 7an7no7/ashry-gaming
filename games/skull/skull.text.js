/* skull: the words only this game's screens show, and its rules (Help, the
   first-play card). The build puts them into TRANSLATIONS and GAME_RULES (tools/game-text.cjs):
   read them as t.<key> and GAME_RULES[lang].<id>, as everywhere. */
gameText({
  translations: {
    ar: {
      skl_lobby_hint: "كل واحد عنده 3 ورود وجمجمة، مقلوبين على موبايله. راهن كام وردة تقدر تقلب… بس خلي بالك من الجمجمة!",
      skl_need_three: "محتاجين 3 على الأقل: ضيف لاعب كمبيوتر",
      skl_too_many: "جمجمة لحد 8 لاعبين",
      skl_clock: "وقت الدور",
      skl_clock_off: "من غير",
      skl_clock_hint: "لما الوقت يخلص: الموبايل يحط وردة لو عنده، ولو لأ يعدّي (أو يراهن على 1 لو لازم).",
      skl_round: "الجولة {n}",
      skl_to_win: "رهانين = فوز",
      skl_tag_out: "برّه",
      skl_pass: "باص",
      skl_flip_this: "اقلب من عند {name}",
      skl_mat: "رهانات اتكسبت: {n}",
      skl_discs_left: "فاضل {n} أقراص",
      skl_in_hand: "في الإيد: {n}",
      skl_place_all: "كل واحد يحط قرص مقلوب",
      skl_add_or_bet: "دور {name}: تزويد قرص ولا رهان؟",
      skl_bet_n: "{n} ورود",
      skl_on_table: "على الترابيزة: {n} أقراص",
      skl_your_hand: "أقراصك",
      skl_your_all: "كل أقراصك: اختار اللي هيروح",
      skl_hand_empty: "مفيش أقراص في إيدك",
      skl_your_pile: "اللي حطيته:",
      skl_you_lost: "اللي خسرته:",
      skl_will_they: "{name} هيقلب {n} ورود… هيعملها؟",
      skl_will_short: "هيعملها؟",
      skl_yes: "هيعملها",
      skl_no: "لأ مش هيعملها",
      skl_guess_hint: "خمّن صح وتاخد نقطة في التوقعات.",
      skl_they_guess: "الكل بيخمّن: هتعملها ولا لأ؟",
      skl_you_said_yes: "قلت: هيعملها ✅",
      skl_you_said_no: "قلت: مش هيعملها ❌",
      skl_you_out: "خلصت أقراصك 🥲",
      skl_you_out_hint: "كمّل تفرّج، وخمّن في «هيعملها؟».",
      skl_placed: "حطيت قرصك",
      skl_wait_place: "مستنيين الباقيين يحطوا.",
      skl_place_now: "حط قرص مقلوب",
      skl_place_hint: "اختار وردة ولا الجمجمة… محدش هيشوفه غيرك.",
      skl_pick_disc: "اختار قرص الأول",
      skl_place_btn: "حطّه مقلوب",
      skl_choosing: "{name} بيختار قرص يخسره",
      skl_choosing_hint: "الجمجمة كانت بتاعته، فهو اللي يختار.",
      skl_lose_now: "قلبت جمجمتك! اختار قرص تخسره",
      skl_lose_hint: "محدش هيعرف اختارت إيه غيرك.",
      skl_lose_btn: "خلاص، ده يروح",
      skl_flipping: "{name} بيقلب: {got} من {n}",
      skl_flipping_hint: "وردة؟ ولا جمجمة؟",
      skl_flip_own: "اقلب أقراصك انت الأول",
      skl_flip_own_hint: "كلها مرة واحدة.",
      skl_flip_own_btn: "اقلب أقراصي",
      skl_flip_more: "فاضل {left}: دوس على كوم حد تقلب منه",
      skl_flip_hint: "بتقلب القرص اللي فوق. بعيد عن الجمجمة!",
      skl_turn_of: "الدور على {name}",
      skl_wait_add: "{name} يا يزوّد قرص يا يراهن.",
      skl_wait_bid: "الرهان دلوقتي {n}: {name} يزوّد ولا يعدّي؟",
      skl_your_add: "دورك: زوّد قرص ولا راهن",
      skl_must_bet: "دورك: لازم تراهن",
      skl_add_hint: "اختار قرص من إيدك وزوّده، أو اختار رقم وراهن.",
      skl_must_bet_hint: "إيدك فاضية، فلازم تراهن.",
      skl_pick_to_add: "اختار قرص عشان تزوّده",
      skl_add_btn: "زوّد القرص ده",
      skl_bet_btn: "راهن على {n}",
      skl_your_raise: "الرهان {n}: هتزوّد؟",
      skl_raise_hint: "زوّد الرهان، أو باص (الباص نهائي في الجولة دي).",
      skl_raise_btn: "زوّد لـ {n}",
      skl_tv_guess: "هيعملها؟ كل واحد يخمّن من موبايله",
      skl_res_void: "{name} خرج… الجولة اتلغت",
      skl_res_won: "{name} عملها! {n} ورود 🌹",
      skl_res_own: "{name} قلب جمجمته هو!",
      skl_res_skull: "بوم! جمجمة {owner} وقّعت {name}",
      skl_res_you_lost: "خسرت {face} (محدش عارف غيرك)",
      skl_res_you_gave: "اخترت تخسر {face} (محدش عارف غيرك)",
      skl_res_secret: "{name} خسر قرص… محدش عارف كان إيه غيره.",
      skl_res_out: "{name} خلصت أقراصه وخرج",
      skl_guesses_title: "هيعملها؟",
      skl_next_in: "الجولة الجاية بعد",
      skl_next_now: "الجولة الجاية دلوقتي",
      skl_over_wins: "{name} كسب رهانين… والكسبان!",
      skl_over_last: "{name} آخر واحد فاضل… والكسبان!",
      skl_over_left: "{name} فضل لوحده",
      skl_over_none: "خلصت اللعبة",
      skl_guesses_board: "التوقعات",
      skl_wins_board: "مرات الفوز الليلة",
      skl_ev_round: "الجولة {n}: البداية عند {name}",
      skl_ev_add: "{name}: زوّد قرص",
      skl_ev_open: "{name}: فتح الرهان على {n}",
      skl_ev_bid: "{name}: زوّد لـ {n}",
      skl_ev_pass: "{name}: باص",
      skl_ev_won: "الرهان لـ {name} على {n}",
      skl_ev_flip_own: "{name} قلب أقراصه ({n})",
      skl_ev_flip: "{name} قلب من عند {owner}: وردة 🌸",
      skl_ev_flip_skull: "{name} قلب من عند {owner}: جمجمة 💀",
      skl_ev_bet_won: "{name} كسب الرهان على {n}!",
      skl_ev_skull: "جمجمة {owner} وقّعت {name}",
      skl_ev_skull_own: "{name} وقع في جمجمته هو",
      skl_ev_lost: "{name} خسر قرص (فاضل {n})",
      skl_ev_out: "{name} خرج من اللعبة",
      skl_ev_auto_host: "المضيف لعب بدل {name}",
      skl_ev_auto_clock: "الوقت خلص على {name}",
      skl_ev_void: "{name} خرج في نص الرهان: الجولة اتلغت",
      skl_ev_shrink: "الرهان بقى {n} (قرص حد خرج)",
      skl_ev_left: "{name} خرج من الأوضة",
      skl_skip_place: "حط بدل اللي فصلوا",
      skl_skip_turn: "العب بدل {name}",
      skl_boom: "بوم!",
      skl_made_it: "عملها!",
      skl_pop_round: "جولة {n}",
      skl_face_rose: "وردة",
      skl_face_jasmine: "فل",
      skl_face_lotus: "لوتس",
      skl_face_skull: "الجمجمة",
    },
    en: {
      skl_lobby_hint: "Everyone has 3 flowers and a skull, face down on their phone. Bet how many flowers you can flip… and dodge the skulls!",
      skl_need_three: "3 players at least: add a computer player",
      skl_too_many: "Skull is for up to 8 players",
      skl_clock: "Turn clock",
      skl_clock_off: "Off",
      skl_clock_hint: "When it runs out: the phone lays a flower if it has one, else passes (or bets 1 if it must).",
      skl_round: "Round {n}",
      skl_to_win: "2 bets to win",
      skl_tag_out: "Out",
      skl_pass: "Pass",
      skl_flip_this: "Flip from {name}",
      skl_mat: "Bets won: {n}",
      skl_discs_left: "{n} discs left",
      skl_in_hand: "In hand: {n}",
      skl_place_all: "Everyone lays a disc face down",
      skl_add_or_bet: "{name}'s turn: add a disc or bet?",
      skl_bet_n: "{n} flowers",
      skl_on_table: "On the table: {n} discs",
      skl_your_hand: "Your discs",
      skl_your_all: "All your discs: pick the one to lose",
      skl_hand_empty: "No discs in your hand",
      skl_your_pile: "You laid:",
      skl_you_lost: "You lost:",
      skl_will_they: "{name} will flip {n} flowers… will they make it?",
      skl_will_short: "Will they?",
      skl_yes: "They'll make it",
      skl_no: "No way",
      skl_guess_hint: "Guess right for a point in the guesses.",
      skl_they_guess: "Everyone's guessing: will you make it?",
      skl_you_said_yes: "You said: they'll make it ✅",
      skl_you_said_no: "You said: no way ❌",
      skl_you_out: "You're out of discs 🥲",
      skl_you_out_hint: "Keep watching, and guess in «Will they?».",
      skl_placed: "Your disc is down",
      skl_wait_place: "Waiting for the others to lay theirs.",
      skl_place_now: "Lay a disc face down",
      skl_place_hint: "A flower or the skull… nobody sees it but you.",
      skl_pick_disc: "Pick a disc first",
      skl_place_btn: "Lay it face down",
      skl_choosing: "{name} is choosing a disc to lose",
      skl_choosing_hint: "It was their own skull, so they choose.",
      skl_lose_now: "You flipped your own skull! Pick a disc to lose",
      skl_lose_hint: "Nobody will know which but you.",
      skl_lose_btn: "That one goes",
      skl_flipping: "{name} is flipping: {got} of {n}",
      skl_flipping_hint: "A flower? Or a skull?",
      skl_flip_own: "Flip your own discs first",
      skl_flip_own_hint: "All of them at once.",
      skl_flip_own_btn: "Flip my discs",
      skl_flip_more: "{left} to go: tap someone's pile to flip from it",
      skl_flip_hint: "You turn over the top disc. Dodge the skull!",
      skl_turn_of: "{name}'s turn",
      skl_wait_add: "{name} adds a disc or bets.",
      skl_wait_bid: "The bet is {n}: will {name} raise or pass?",
      skl_your_add: "Your turn: add a disc or bet",
      skl_must_bet: "Your turn: you must bet",
      skl_add_hint: "Pick a disc from your hand to add it, or pick a number and bet.",
      skl_must_bet_hint: "Your hand is empty, so you bet.",
      skl_pick_to_add: "Pick a disc to add",
      skl_add_btn: "Add this disc",
      skl_bet_btn: "Bet {n}",
      skl_your_raise: "The bet is {n}: raise?",
      skl_raise_hint: "Raise the bet, or pass (a pass is final this round).",
      skl_raise_btn: "Raise to {n}",
      skl_tv_guess: "Will they make it? Everyone guesses on their phone",
      skl_res_void: "{name} left… the round is called off",
      skl_res_won: "{name} made it! {n} flowers 🌹",
      skl_res_own: "{name} flipped their own skull!",
      skl_res_skull: "Boom! {owner}'s skull got {name}",
      skl_res_you_lost: "You lost a {face} (only you know)",
      skl_res_you_gave: "You gave up a {face} (only you know)",
      skl_res_secret: "{name} lost a disc… only they know which.",
      skl_res_out: "{name} is out of discs",
      skl_guesses_title: "Will they?",
      skl_next_in: "Next round in",
      skl_next_now: "Next round now",
      skl_over_wins: "{name} won two bets and the game!",
      skl_over_last: "{name} is the last one in, and wins!",
      skl_over_left: "{name} is the only one left",
      skl_over_none: "Game over",
      skl_guesses_board: "The guesses",
      skl_wins_board: "Games won tonight",
      skl_ev_round: "Round {n}: {name} starts",
      skl_ev_add: "{name} added a disc",
      skl_ev_open: "{name} opened the bet at {n}",
      skl_ev_bid: "{name} raised to {n}",
      skl_ev_pass: "{name} passed",
      skl_ev_won: "{name} takes the bet at {n}",
      skl_ev_flip_own: "{name} flipped their own discs ({n})",
      skl_ev_flip: "{name} flipped {owner}'s: a flower 🌸",
      skl_ev_flip_skull: "{name} flipped {owner}'s: a skull 💀",
      skl_ev_bet_won: "{name} won the bet on {n}!",
      skl_ev_skull: "{owner}'s skull got {name}",
      skl_ev_skull_own: "{name} hit their own skull",
      skl_ev_lost: "{name} lost a disc ({n} left)",
      skl_ev_out: "{name} is out",
      skl_ev_auto_host: "The host played for {name}",
      skl_ev_auto_clock: "Time ran out for {name}",
      skl_ev_void: "{name} left mid-bet: the round is off",
      skl_ev_shrink: "The bet is now {n} (a pile left the table)",
      skl_ev_left: "{name} left the room",
      skl_skip_place: "Lay for the quiet phones",
      skl_skip_turn: "Play for {name}",
      skl_boom: "Boom!",
      skl_made_it: "Made it!",
      skl_pop_round: "Round {n}",
      skl_face_rose: "rose",
      skl_face_jasmine: "jasmine",
      skl_face_lotus: "lotus",
      skl_face_skull: "skull",
    }
  },
  rules: {
    ar: {
      skull: `
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li>كل واحد معاه <b>4 أقراص</b>: <b>3 ورود وجمجمة</b>، ضهرهم واحد، على موبايله هو بس.</li>
                <li>أول الجولة <b>الكل يحط قرص مقلوب</b> في نفس الوقت.</li>
                <li>بالدور من اللي عليه البداية: <b>زوّد قرص</b> مقلوب على كومك، أو <b>افتح الرهان</b>: رقم من 1 لحد كل الأقراص اللي على الترابيزة، يعني «أقدر أقلب الكام وردة دول من غير جمجمة».</li>
                <li>من أول رهان مفيش تزويد أقراص: بالدور كل واحد يا <b>يزوّد الرهان</b> يا يقول <b>باص</b> (والباص نهائي في الجولة). لما الكل يعدّي، الرهان لأعلى واحد.</li>
                <li><b>«هيعملها؟»</b>: قبل ما يقلب، الكل (غير اللي راهن) يدوس ✅ أو ❌ على موبايله. اللي يخمّن صح ياخد نقطة في <b>التوقعات</b>.</li>
                <li>اللي راهن يقلب <b>أقراصه هو الأول، كلها</b>، وبعدين يختار كوم حد ويقلب <b>القرص اللي فوق</b>، واحد واحد لحد ما يوصل للرقم.</li>
                <li><b>كله ورد</b>؟ كسب الرهان، وقاعدته اتقلبت على الوردة. <b>جمجمة</b>؟ بوم! يخسر <b>قرص من أقراصه للأبد</b>، بالعشوائي، ومحدش يعرف راح إيه غيره.</li>
            </ol>
            <p class="help-sub">🏁 النهاية</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li><b>رهانين</b> متكسبين = الكسبان. أو <b>آخر واحد فاضل</b>: اللي أقراصه خلصت يخرج.</li>
                <li>لو قلبت <b>جمجمتك انت</b>: انت اللي تختار أنهي قرص يروح، وانت اللي تبدأ الجولة الجاية.</li>
                <li>غير كده <b>صاحب الجمجمة</b> يبدأ الجولة الجاية، ولو الرهان اتكسب يبدأ اللي كسبه.</li>
            </ul>
            <p class="help-sub">📱 كل واحد من موبايله</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>من 3 لـ8 على الترابيزة، حتى لو لوحدك مع <b>لاعبين كمبيوتر</b>: السهل بيلعب على البركة، والصعب بيحسب من أقراصه وبيعمل فخ بجمجمته ساعات. الكمبيوتر مابيشوفش أقراص حد.</li>
                <li>وقت الدور (30 أو 60 ثانية) لو المضيف حطه: لما يخلص الموبايل يحط وردة لو عنده، في الرهان يقول باص، وفي القلب يقلب لوحده. والمضيف يقدر يلعب بدل موبايل فصل.</li>
            </ul>
            <p class="help-sub">📺 على التلفزيون</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>كل الأكوام مقلوبة، والرهان، ومين خمّن في «هيعملها؟» (من غير إجابته)، وكل قرص وهو بيتقلب قدام الكل.</li>
            </ul>
            <p class="help-sub">💡 نصايح</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>جمجمتك تحت رهان صغير فخ حلو: اللي يزوّد عليك هيقع فيها.</li>
                <li>اللي بيزوّد أقراص كتير ساعات بيداري جمجمة… اقلب من عند غيره.</li>
            </ul>`,
    },
    en: {
      skull: `
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li>Everyone has <b>4 discs</b>: <b>3 flowers and a skull</b>, with the same back, on their own phone only.</li>
                <li>At the start of a round <b>everyone lays one disc face down</b>, all at once.</li>
                <li>In turn from the starter: <b>add a disc</b> face down to your pile, or <b>open the bet</b>: a number from 1 up to every disc on the table - "I can turn over that many flowers without a skull".</li>
                <li>Once someone bets, nobody adds: in turn each <b>raises</b> or says <b>pass</b> (a pass is final for the round). When the others have passed, the bet belongs to the highest.</li>
                <li><b>«Will they?»</b>: before the flips, everyone but the bidder taps ✅ or ❌ on their phone. A right guess is a point in <b>the guesses</b>.</li>
                <li>The bidder turns over <b>their own pile first, all of it</b>, then picks piles and turns over <b>the top disc</b>, one at a time, until the number is reached.</li>
                <li><b>All flowers</b>? The bet is won. <b>A skull</b>? Boom! They lose <b>one of their discs for good</b>, at random, and only they learn which.</li>
            </ol>
            <p class="help-sub">🏁 The end</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li><b>Two won bets</b> win the game. Or <b>the last one in</b>: a player with no discs left is out.</li>
                <li>Flip <b>your own skull</b> and you choose which disc goes, and you start the next round.</li>
                <li>Otherwise <b>the skull's owner</b> starts the next round; after a won bet, the winner of it.</li>
            </ul>
            <p class="help-sub">📱 Everyone on their own phone</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>3 to 8 at the table, even on your own with <b>computer players</b>: easy plays by luck, hard reckons from its own discs and sometimes sets a trap with its skull. A computer never sees anyone's discs.</li>
                <li>The turn clock (30 or 60 seconds) if the host set one: when it runs out the phone lays a flower if it can, passes in the auction and flips by itself. The host can play for a phone that went quiet.</li>
            </ul>
            <p class="help-sub">📺 On the TV</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>Every pile face down, the bet, who has answered «Will they?» (never what), and every disc as it turns over.</li>
            </ul>
            <p class="help-sub">💡 Tips</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>Your skull under a small bet is a fine trap: whoever outbids you walks into it.</li>
                <li>A player adding lots of discs may be hiding a skull… flip someone else's.</li>
            </ul>`,
    }
  }
});
