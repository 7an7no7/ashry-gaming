/* box: the words only this game's screens show, and its rules (Help, the
   first-play card). The build puts them into TRANSLATIONS and GAME_RULES (tools/game-text.cjs):
   read them as t.<key> and GAME_RULES[lang].<id>, as everywhere. */
gameText({
  translations: {
    ar: {
      box_lobby_hint: "٨ صناديق، ومع كل واحد دليل سرّي صح على موبايلك. دقيقة كلام (والناس ممكن تكدب!) وبعدين مزايدة سرّية مرة واحدة. أغنى واحد في الآخر يكسب.",
      box_sign: "الصندوق",
      box_n: "الصندوق {n} من {m}",
      box_money: "فلوسك",
      box_cur: "ج",
      box_k_treasure: "كنز",
      box_k_scorpion: "عقرب",
      box_k_bill: "فاتورة",
      box_k_steal: "حرامي",
      box_k_double: "دبل أو ولا حاجة",
      box_k_key: "مفتاح",
      box_k_empty: "فاضي",
      box_clue_not: "اللي جوّه مش {a}",
      box_clue_is_gain: "اللي ياخده هيكسب فلوس أكيد",
      box_clue_is_lose: "اللي ياخده هيخسر فلوس فوق اللي دفعه، لو معاه",
      box_clue_is_nomoney: "مفيش ولا جنيه هيتحرك لما يتفتح",
      box_clue_is_moves: "فيه فلوس هتتحرك لما يتفتح",
      box_clue_is_others: "هيأثر على لاعب تاني غير اللي خده",
      box_clue_is_alone: "مش هيأثر على حد غير اللي خده",
      box_clue_is_luck: "اللي جوّه فيه حظ… يا صابت يا خابت",
      box_clue_is_shiny: "اللي جوّه بيلمع ✨",
      box_clue_is_alive: "اللي جوّه حيّ وبيتحرك!",
      box_clue_no_luck: "مفيهوش حظ: اللي هيحصل معروف",
      box_clue_no_shiny: "مفيهوش حاجة بتلمع",
      box_clue_no_alive: "مفيهوش حاجة حيّة",
      box_clue_two: "يا {a} يا {b}",
      box_clue_three: "واحد من دول: {a}، {b}، {c}",
      box_clue_gt: "فيه أكتر من {x}",
      box_clue_lt: "فيه فلوس، بس أقل من {x}",
      box_clue_same: "زي الصندوق اللي فات بالظبط في النوع",
      box_clue_diff: "مش زي الصندوق اللي فات",
      box_clue_title: "دليلك السرّي 🤫",
      box_hold: "اضغط باستمرار",
      box_hold_hint: "ومحدش يبص على موبايلك",
      box_about: "عن الصندوق ده:",
      box_true: "✓ الدليل دايمًا صح",
      box_talk: "🗣️ دقيقة كلام",
      box_last: "⏳ آخر فرصة للمزايدة",
      box_note_lie: "الدليل صح… بس اللي بيتقال برّه ممكن يكون كدب 😉",
      box_ready: "جاهز أزايد",
      box_bid_q: "هتدفع كام في الصندوق؟",
      box_plus: "زوّد ١٠",
      box_minus: "قلّل ١٠",
      box_all_in: "كل فلوسي",
      box_zero: "صفر",
      box_bid_note: "رقمك سرّ… محدش هيشوفه غير لما الكل يأكّد",
      box_zero_note: "صفر يعني مش عايزه",
      box_confirm: "أكّد المزايدة 🔒",
      box_back_clue: "↩ ارجع للدليل",
      box_wait: "مستنيين الباقيين…",
      box_all_done: "الكل أكّد! الصندوق هيتفتح 🎁",
      box_you_bid: "زايدت بـ{n} {cur}",
      box_you_pass: "مازايدتش المرة دي",
      box_peek_title: "🗝️ معاك المفتاح!",
      box_peek_line: "إنت بس اللي عارف: الصندوق ده جواه {k}",
      box_peek_next: "إنت بس اللي عارف: الصندوق الجاي جواه {k}",
      box_watch: "بتتفرج المرة دي… وتلعب اللعبة الجاية",
      box_host_call: "كفاية كلام، زايدوا",
      box_host_close: "اقفل المزايدة",
      box_next: "الصندوق اللي بعده ▶",
      box_final: "النتيجة النهائية 🏆",
      box_tv_talk: "كل واحد معاه دليل صح عن الصندوق… بس فيه ناس بتكدب!",
      box_tv_bid: "آخر فرصة! زايدوا على موبايلاتكم",
      box_sh_start: "المزايدات اتقفلت… هتتكشف كلها مع بعض!",
      box_sh_won: "الصندوق راح لـ{w} بـ{n}",
      box_sh_tie: "تعادل! راح للي فلوسه أقل",
      box_sh_lot: "تعادل! والقرعة اختارت",
      box_sh_nobody: "محدش زايد… بس يلا نشوف كان فيه إيه!",
      box_sh_drum: "دررررررم… افتح يا صندوق!",
      box_big_treasure: "كنز!",
      box_big_scorpion: "عقرب!",
      box_big_bill: "فاتورة!",
      box_big_steal: "حرامي!",
      box_big_heads: "دبل!",
      box_big_tails: "ولا حاجة!",
      box_big_key: "مفتاح!",
      box_big_empty: "هوا!",
      box_bill_word: "فاتورة",
      box_res_treasure: "كنز! {w} خد {v}",
      box_res_scorpion: "العقرب طفّش {v} من فلوس {w} 😂",
      box_res_bill: "فاتورة! {w} بيدفع {v} لكل واحد",
      box_res_steal: "{w} سرق نص فلوس {x}: {v}!",
      box_res_heads: "الوش! {w} خد ضعف مزايدته: {v}",
      box_res_tails: "الضهر… راحت عليك يا {w} 😅",
      box_res_key: "{w} خد المفتاح: هيعرف الصندوق الجاي 🗝️",
      box_res_empty: "فاضي! {w} دفع في الهوا 😂",
      box_res_nobody: "كان جواه: {k}… ومحدش خده",
      box_scorp_say: "مساء الخير يا جماعة!",
      box_over: "الأغنى كسب! 💰",
      box_opened: "الصناديق اللي اتفتحت",
      box_next_in: "الصندوق اللي بعده بعد",
      box_final_in: "النتيجة النهائية بعد",
      box_ins: "🛡️ تأمين بـ{n} ج",
      box_ins_hint: "لو طلعلك عقرب أو الحرامي سرقك، تخسر النص بس",
      box_ins_on: "🛡️ إنت مأمّن ({n} ج)",
      box_ins_paid: "🛡️ التأمين وفّر لـ{w} {v}",
      box_finale: "🏁 صندوق الختام: كل حاجة جواه ×2!",
      box_finale_tag: "صندوق الختام ×2",
      box_sh_drum_x2: "دررررررررم الختام… ×2!",
      box_offer_title: "🎩 عرض الحاج",
      box_offer_you: "الحاج بيقولك: خد {v} وسيب الصندوق مقفول؟",
      box_offer_take: "💰 هات الفلوس",
      box_offer_open: "📦 لأ، افتح الصندوق!",
      box_offer_others: "الحاج بيعرض على {w} {v} ويسيب الصندوق… ياخد ولا يفتح؟ زعّقوا!",
      box_offer_tv: "{w}: ياخد {v} من الحاج ولا يفتح؟",
      box_sh_deal: "{w} خد {v} من الحاج! نشوف ساب إيه…",
      box_sh_nodeal: "{w} رفض عرض الحاج! افتح يا صندوق!",
      box_res_deal: "{w} خد {v} وساب الصندوق… وكان جواه: {k}",
    },
    en: {
      box_lobby_hint: "8 boxes, and a true secret clue about each on your phone. A minute of talk (people may lie!), then one secret bid each. The richest at the end wins.",
      box_sign: "THE BOX",
      box_n: "Box {n} of {m}",
      box_money: "Your money",
      box_cur: "EGP",
      box_k_treasure: "a treasure",
      box_k_scorpion: "a scorpion",
      box_k_bill: "a bill",
      box_k_steal: "a thief",
      box_k_double: "double-or-nothing",
      box_k_key: "a key",
      box_k_empty: "nothing",
      box_clue_not: "It isn't {a}",
      box_clue_is_gain: "Whoever takes it surely gains money",
      box_clue_is_lose: "Whoever takes it loses money on top of the bid, if they have any left",
      box_clue_is_nomoney: "Not a pound moves when it opens",
      box_clue_is_moves: "Money moves when it opens",
      box_clue_is_others: "It touches a player other than the one who takes it",
      box_clue_is_alone: "It touches nobody but the one who takes it",
      box_clue_is_luck: "Luck is inside: all or nothing",
      box_clue_is_shiny: "Something inside shines ✨",
      box_clue_is_alive: "Something inside is alive and moving!",
      box_clue_no_luck: "No luck in it: what happens is certain",
      box_clue_no_shiny: "Nothing inside shines",
      box_clue_no_alive: "Nothing inside is alive",
      box_clue_two: "It's either {a} or {b}",
      box_clue_three: "One of these: {a}, {b}, {c}",
      box_clue_gt: "There's more than {x} inside",
      box_clue_lt: "There's money inside, but less than {x}",
      box_clue_same: "Same kind as the last box",
      box_clue_diff: "Not the same kind as the last box",
      box_clue_title: "Your secret clue 🤫",
      box_hold: "Press and hold",
      box_hold_hint: "and keep your screen to yourself",
      box_about: "About this box:",
      box_true: "✓ The clue is always true",
      box_talk: "🗣️ A minute of talk",
      box_last: "⏳ Last call for bids",
      box_note_lie: "Your clue is true… what people say out loud may not be 😉",
      box_ready: "Ready to bid",
      box_bid_q: "How much for the box?",
      box_plus: "Add 10",
      box_minus: "Take 10 off",
      box_all_in: "All in",
      box_zero: "Zero",
      box_bid_note: "Your number is secret until everyone has confirmed",
      box_zero_note: "Zero means you pass",
      box_confirm: "Confirm the bid 🔒",
      box_back_clue: "↩ Back to the clue",
      box_wait: "Waiting for the others…",
      box_all_done: "Everyone's in! The box is opening 🎁",
      box_you_bid: "You bid {n} {cur}",
      box_you_pass: "You passed this time",
      box_peek_title: "🗝️ You have the key!",
      box_peek_line: "Only you know: this box holds {k}",
      box_peek_next: "Only you know: the next box holds {k}",
      box_watch: "You're watching this time… you'll play the next game",
      box_host_call: "Enough talk, bid now",
      box_host_close: "Close the bids",
      box_next: "Next box ▶",
      box_final: "Final results 🏆",
      box_tv_talk: "Everyone holds a true clue about the box… but some people lie!",
      box_tv_bid: "Last call! Bid on your phones",
      box_sh_start: "Bids are in… revealed all at once!",
      box_sh_won: "The box goes to {w} for {n}",
      box_sh_tie: "A tie! It goes to the one with less money",
      box_sh_lot: "A tie! Drawn by lot",
      box_sh_nobody: "Nobody bid… let's see what was inside!",
      box_sh_drum: "Drumroll… open the box!",
      box_big_treasure: "Treasure!",
      box_big_scorpion: "Scorpion!",
      box_big_bill: "The bill!",
      box_big_steal: "Thief!",
      box_big_heads: "Double!",
      box_big_tails: "Nothing!",
      box_big_key: "A key!",
      box_big_empty: "Empty!",
      box_bill_word: "BILL",
      box_res_treasure: "Treasure! {w} gets {v}",
      box_res_scorpion: "The scorpion scattered {v} of {w}'s money 😂",
      box_res_bill: "The bill! {w} pays {v} to everyone",
      box_res_steal: "{w} stole half of {x}'s money: {v}!",
      box_res_heads: "Heads! {w} gets double the bid: {v}",
      box_res_tails: "Tails… no luck, {w} 😅",
      box_res_key: "{w} gets the key: a peek at the next box 🗝️",
      box_res_empty: "Empty! {w} paid for thin air 😂",
      box_res_nobody: "It held {k}… and nobody took it",
      box_scorp_say: "Good evening, everyone!",
      box_over: "The richest wins! 💰",
      box_opened: "Boxes opened",
      box_next_in: "The next box in",
      box_final_in: "The final results in",
      box_ins: "🛡️ Insurance for {n}",
      box_ins_hint: "A scorpion or the thief then costs you half",
      box_ins_on: "🛡️ You're insured ({n})",
      box_ins_paid: "🛡️ insurance saved {w} {v}",
      box_finale: "🏁 The finale box: everything inside counts double!",
      box_finale_tag: "The finale box ×2",
      box_sh_drum_x2: "The finale's drumroll… ×2!",
      box_offer_title: "🎩 The old host's offer",
      box_offer_you: "The old host says: take {v} and hand the box back unopened?",
      box_offer_take: "💰 Take the money",
      box_offer_open: "📦 No, open the box!",
      box_offer_others: "The old host offers {w} {v} to hand the box back… take it or open it? Shout!",
      box_offer_tv: "{w}: take {v} from the old host, or open it?",
      box_sh_deal: "{w} took {v} from the old host! Let's see what they gave up…",
      box_sh_nodeal: "{w} turned the old host down! Open the box!",
      box_res_deal: "{w} took {v} and handed the box back… it held: {k}",
    }
  },
  rules: {
    ar: {
      box: `
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li>كل واحد بيبدأ بـ<b>١٠٠٠ جنيه</b> (فلوس لعب). فيه <b>٨ صناديق</b> بتيجي واحد ورا التاني.</li>
                <li>مع كل صندوق كل موبايل بيوصله <b>دليل سرّي صح دايمًا</b> عن اللي جوّه (دوس مطوّل عشان تقراه). كل واحد دليله مختلف.</li>
                <li><b>دقيقة كلام</b>: قولوا اللي تحبوه… <b>الدليل صح، بس الناس ممكن تكدب</b> عشان تغلّي الصندوق أو ترخّصه.</li>
                <li>كل واحد <b>يزايد مرة واحدة في السر</b> (صفر يعني مش عايزه). بعد الدقيقة فيه ٢٠ ثانية آخر فرصة.</li>
                <li>المزايدات تتكشف كلها مع بعض: <b>الأعلى ياخد الصندوق ويدفع مزايدته</b>، والصندوق يتفتح قدام الكل.</li>
            </ol>
            <p class="help-sub">🎁 ممكن يطلع إيه؟</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>💰 <b>كنز</b>: من ٣٠٠ لـ٨٠٠ جنيه ليك.</li>
                <li>🦂 <b>عقرب</b>: يطفّش ٣٠٠ من فلوسك.</li>
                <li>🧾 <b>فاتورة</b>: تدفع ٥٠ لكل واحد تاني.</li>
                <li>🦹 <b>حرامي</b>: تاخد نص فلوس أغنى واحد فيهم.</li>
                <li>🪙 <b>دبل أو ولا حاجة</b>: عملة… وش ترجعلك مزايدتك ضعفين، ضهر ولا حاجة.</li>
                <li>🗝️ <b>مفتاح</b>: إنت بس اللي هتعرف الصندوق الجاي فيه إيه.</li>
                <li>💨 <b>فاضي</b>: دفعت في الهوا!</li>
            </ul>
            <p class="help-sub">✨ الزيادات</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>🛡️ <b>تأمين</b>: وإنت بتزايد تقدر تحط ٥٠ جنيه تأمين (بتدفعها في الفتحة كسبت الصندوق ولا لأ). لو طلعلك عقرب أو الحرامي سرقك، تخسر <b>النص بس</b>. المأمّنين بيبان جنبهم 🛡️ في الفتحة.</li>
                <li>🎩 <b>عرض الحاج</b>: مرتين في اللعبة، في صندوقين بالصدفة (عمره ما يبقى صندوق الختام)، قبل ما الغطا يطير الحاج بيعرض على اللي كسب فلوس عشان يرجّع الصندوق مقفول. معاه ٨ ثواني: ياخد الفلوس ولا يفتح (لو سكت بيتفتح). لو أخد، الصندوق بيتفتح للفرجة بس ومالوش أي أثر.</li>
                <li>🏁 <b>صندوق الختام</b>: الصندوق التامن متعلن من الأول، وكل حاجة جواه <b>×٢</b>: كنز دبل، عقرب دبل (٦٠٠)، فاتورة ١٠٠ لكل واحد، الحرامي ياخد ضعف (لحد كل فلوسه)، والعملة بالوش ترجّع ٤ أضعاف. بطبلة لوحده!</li>
            </ul>
            <p class="help-sub">⚖️ التعادل والنهاية</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>لو اتنين زايدوا نفس الأعلى، الصندوق للي فلوسه أقل، ولو نفس الفلوس بالقرعة. لو محدش زايد، الصندوق يتفتح ومحدش ياخده.</li>
                <li>بعد الصندوق التامن <b>أغنى واحد يكسب</b>.</li>
            </ul>
            <p class="help-sub">📱 كل واحد من موبايله</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>من 3 لـ8 لاعبين. المضيف يقدر يخلّص الكلام بدري أو يقفل المزايدة.</li>
                <li>اللي يدخل في النص يتفرج، ويلعب اللعبة الجاية.</li>
            </ul>
            <p class="help-sub">📺 على التلفزيون (اختياري)</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>استوديو برنامج مسابقات: كل لاعب ورا بوديوم بشاشة، والصندوق الأحمر على منصة بتلف، والفتحة عرض كامل. من غير تلفزيون الفتحة على كل موبايل.</li>
            </ul>`,
    },
    en: {
      box: `
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li>Everyone starts with <b>1,000 EGP</b> (play money). <b>8 boxes</b> come up one after another.</li>
                <li>With each box every phone gets a <b>secret clue that is always true</b> about what's inside (press and hold to read it). Everyone's clue is different.</li>
                <li><b>A minute of talk</b>: say what you like… <b>the clues are true, but people may lie</b> to push the price up or down.</li>
                <li>Everyone <b>bids once, in secret</b> (zero means you pass). After the minute there are 20 more seconds for the last bids.</li>
                <li>The bids are revealed all at once: <b>the highest takes the box and pays the bid</b>, and the box opens in front of everyone.</li>
            </ol>
            <p class="help-sub">🎁 What can be inside?</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>💰 <b>A treasure</b>: 300 to 800 for you.</li>
                <li>🦂 <b>A scorpion</b>: it scatters 300 of your money.</li>
                <li>🧾 <b>A bill</b>: you pay 50 to every other player.</li>
                <li>🦹 <b>A thief</b>: you take half the money of the richest of the others.</li>
                <li>🪙 <b>Double-or-nothing</b>: a coin… heads pays your bid back twice, tails nothing.</li>
                <li>🗝️ <b>A key</b>: only you will know what's in the next box.</li>
                <li>💨 <b>Nothing</b>: you paid for thin air!</li>
            </ul>
            <p class="help-sub">✨ Extras</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>🛡️ <b>Insurance</b>: while bidding you can add 50 of insurance (paid at the opening, whoever takes the box). If you take a scorpion or the thief robs you, you lose <b>only half</b>. The insured show a 🛡️ at the opening.</li>
                <li>🎩 <b>The old host's offer</b>: twice a game, at two random boxes (never the finale), before the lid flies the old host offers the winner money to hand the box back unopened. 8 seconds: take the money or open it (no answer opens it). Taken, the box is opened just to see, and does nothing.</li>
                <li>🏁 <b>The finale box</b>: the eighth box is announced from the start, and everything inside counts <b>×2</b>: a double treasure, a double scorpion (600), a bill of 100 each, the thief takes twice as much (up to everything), and heads pays four times the bid. With its own drumroll!</li>
            </ul>
            <p class="help-sub">⚖️ Ties and the end</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>Two top bids the same: the box goes to the one with less money, then by lot. Nobody bid: the box opens and nobody takes it.</li>
                <li>After the eighth box <b>the richest wins</b>.</li>
            </ul>
            <p class="help-sub">📱 Everyone on their own phone</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>3 to 8 players. The host can end the talk early or close the bids.</li>
                <li>Someone who joins mid-game watches, and plays the next game.</li>
            </ul>
            <p class="help-sub">📺 On the TV (optional)</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>A game-show studio: every player at a podium with a screen, the red box on a turning stand, and the opening as a whole show. Without a TV the opening is on every phone.</li>
            </ul>`,
    }
  }
});
