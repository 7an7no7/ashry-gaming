/* oldmaid: the words only this game's screens show, and its rules (Help, the
   first-play card). The build puts them into TRANSLATIONS and GAME_RULES (tools/game-text.cjs):
   read them as t.<key> and GAME_RULES[lang].<id>, as everywhere. */
gameText({
  translations: {
    ar: {
      om_st_from: "السحب من هنا",
      om_turn_of: "الدور على {name}",
      om_your_turn: "⭐ دورك",
      om_they_draw_you: "السحب منك!",
      om_from_short: "السحب من {name}",
      om_mode: "الورق في الإيد",
      om_mode_drag: "ترتيب بالسحب",
      om_mode_shuffle: "خلط تلقائي",
      om_mode_drag_hint: "كل واحد يرتّب ورقه بإيده، حتى واللي قبله بيسحب منه.",
      om_mode_shuffle_hint: "التطبيق بيخلط ورق الكل بعد كل دور، ومحدش يرتّب.",
      om_clock: "وقت الدور",
      om_clock_hint: "لو الوقت خلص بيتسحب كارت عشوائي.",
      om_deck: "{n} كارت: {pairs} زوج والشايب",
      om_too_many: "الشايب لحد 8 لاعبين",
      om_lobby_hint: "الزوج نفس الرقم ونفس اللون: 7 كبة مع 7 ديناري. اسحب من اللي بعدك، واللي يفضل معاه الشايب يخسر.",
      om_pairs_out: "اتقفل {n} زوج من {of}",
      om_no_pairs: "لسه مفيش أزواج",
      om_draw_from: "اسحب كارت من {name}",
      om_victim_hint_drag: "شايف الكارت المرفوع؟ تقدر تحرّك ورقك وتلخبطه.",
      om_victim_hint: "الكارت المرفوع هو اللي هيتسحب.",
      om_lift_hint: "دوس على كارت عشان ترفعه، ودوس عليه تاني عشان تاخده.",
      om_take_hint: "الكارت مرفوع: خده أو ارفع غيره.",
      om_take: "خد الكارت ده",
      om_mix: "🔀 اخلط ورقي",
      om_got_old: "اتشيّبت! الشايب بقى معاك",
      om_got_old_hint: "محدش يعرف غيرك… خلّي وشّك عادي 🤫",
      om_gave_old: "😌 خلصت من الشايب!",
      om_back_label: "كارت رقم {n}",
      om_your_cards: "ورقك",
      om_hand_hint_drag: "اسحب كارت يمين وشمال عشان ترتّب",
      om_hand_hint_shuffle: "ورقك بيتخلط لوحده بعد كل دور",
      om_you_safe: "✓ ورقك خلص! المركز {n}",
      om_no_cards: "مفيش ورق",
      om_ev_deal: "🔀 اتوزع {n} كارت: {pairs} زوج والشايب",
      om_ev_pairs_deal: "✨ {name}: {n} زوج من التوزيع",
      om_ev_pair: "✨ {name}: زوج!",
      om_ev_draw: "🫳 {name}: كارت من {from}",
      om_ev_out: "✓ {name}: الورق خلص، المركز {n}",
      om_ev_shuffle: "🔀 الورق اتخلط",
      om_ev_auto_clock: "⏱️ {name}: الوقت خلص",
      om_ev_auto_host: "⏭️ المضيف سحب بدل {name}",
      om_ev_over: "🧓 الشايب مع {name}!",
      om_ev_left: "🚪 {name}: خروج من اللعبة",
      om_lost: "الشايب مع {name}!",
      om_you_lost: "الشايب معاك!",
      om_over_left: "اللعبة خلصت: مفيش لاعبين كفاية",
      om_out_order: "مين خلّص الأول",
      om_tally: "مرات الشايب",
      om_skip_turn: "اسحب بدل {name}",
      om_word: "ش-ا-ي-ب: ماتش السهرة",
      om_word_hint: "كل خسارة بحرف من «شايب» على كرسيك، واللي يكمّل الأربع حروف يبقى شايب السهرة. الحروف بتتمسح لما ترجعوا لقايمة الألعاب.",
      om_word_off: "كل لعبة لوحدها، من غير حروف.",
      om_word_letters: "شايب",
      om_word_got: "{name} خد حرف «{l}» · فاضل {n}",
      om_shayeb_title: "شايب السهرة!",
      om_word_reset: "الماتش اللي جاي بيبدأ من الأول",
    },
    en: {
      om_st_from: "Drawn from",
      om_turn_of: "{name}'s turn",
      om_your_turn: "⭐ Your turn",
      om_they_draw_you: "Drawing from you!",
      om_from_short: "Drawing from {name}",
      om_mode: "Hands",
      om_mode_drag: "Drag to arrange",
      om_mode_shuffle: "Auto-shuffle",
      om_mode_drag_hint: "Everyone arranges their own cards, even while being drawn from.",
      om_mode_shuffle_hint: "The app shuffles every hand after each turn; nobody arranges.",
      om_clock: "Turn clock",
      om_clock_hint: "When it runs out, a random card is drawn.",
      om_deck: "{n} cards: {pairs} pairs and the Old Maid",
      om_too_many: "Old Maid is for up to 8 players",
      om_lobby_hint: "A pair is the same rank and colour: the 7 of hearts with the 7 of diamonds. Draw from the next player; whoever is left with the Old Maid loses.",
      om_pairs_out: "{n} of {of} pairs out",
      om_no_pairs: "No pairs yet",
      om_draw_from: "Draw a card from {name}",
      om_victim_hint_drag: "See the lifted card? Drag your cards around to throw them off.",
      om_victim_hint: "The lifted card is the one that goes.",
      om_lift_hint: "Tap a card to lift it, tap it again to take it.",
      om_take_hint: "Card lifted: take it, or lift another.",
      om_take: "Take this card",
      om_mix: "🔀 Shuffle my cards",
      om_got_old: "Gotcha! The Old Maid is yours now",
      om_got_old_hint: "Nobody knows but you… keep a straight face 🤫",
      om_gave_old: "😌 The Old Maid is gone!",
      om_back_label: "Card {n}",
      om_your_cards: "Your cards",
      om_hand_hint_drag: "Drag a card sideways to rearrange",
      om_hand_hint_shuffle: "Your cards are shuffled after every turn",
      om_you_safe: "✓ You're out of cards! Place {n}",
      om_no_cards: "No cards",
      om_ev_deal: "🔀 {n} cards dealt: {pairs} pairs and the Old Maid",
      om_ev_pairs_deal: "✨ {name}: {n} pairs from the deal",
      om_ev_pair: "✨ {name}: a pair!",
      om_ev_draw: "🫳 {name}: a card from {from}",
      om_ev_out: "✓ {name} is out: place {n}",
      om_ev_shuffle: "🔀 Hands shuffled",
      om_ev_auto_clock: "⏱️ {name}: time's up",
      om_ev_auto_host: "⏭️ The host drew for {name}",
      om_ev_over: "🧓 {name} is left with the Old Maid!",
      om_ev_left: "🚪 {name} left the game",
      om_lost: "{name} is left with the Old Maid!",
      om_you_lost: "You're left with the Old Maid!",
      om_over_left: "Game over: not enough players",
      om_out_order: "Who got out first",
      om_tally: "Times left with the Old Maid",
      om_skip_turn: "Draw for {name}",
      om_word: "M-A-I-D: the evening's match",
      om_word_hint: "Every loss puts a letter of MAID on your seat; whoever spells all four is the Old Maid of the evening. The letters are wiped when you go back to the games list.",
      om_word_off: "Every game on its own, no letters.",
      om_word_letters: "MAID",
      om_word_got: "{name} gets the letter «{l}» · {n} to go",
      om_shayeb_title: "Old Maid of the evening!",
      om_word_reset: "The next match starts from scratch",
    }
  },
  rules: {
    ar: {
      oldmaid: `
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li>فيه كارت زيادة في الورق: <b>الشايب</b>. الورق كله بيتوزع، وكل واحد ورقه على موبايله.</li>
                <li>الزوج = <b>نفس الرقم ونفس اللون</b>: 7 كبة مع 7 ديناري (الاتنين أحمر)، أو ولد بستوني مع ولد سباتي (الاتنين أسود). الأزواج اللي في إيدك من التوزيع بتتقفل لوحدها.</li>
                <li>في دورك <b>اسحب كارت مقلوب</b> من اللي بعدك: دوس على كارت عشان ترفعه (الكل بيشوف أنهي كارت مرفوع)، ودوس عليه تاني عشان تاخده.</li>
                <li>لو الكارت عمل زوج مع كارت معاك، الاتنين بيتقفلوا. اللي ورقه يخلص <b>ينجى</b>.</li>
                <li>آخر واحد يفضل معاه ورق، يبقى معاه <b>الشايب</b>… ويخسر.</li>
            </ol>
            <p class="help-sub">🤲 الورق في الإيد</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li><b>ترتيب بالسحب</b> (من الأول): اسحب كارت من ورقك يمين وشمال عشان ترتّبه، حتى واللي قبلك رافع كارت منك: الكارت المرفوع بيتحرك معاه، واللي بيسحب شايف الكروت وهي بتتحرك.</li>
                <li><b>خلط تلقائي</b>: التطبيق بيخلط ورق الكل بعد كل دور، ومحدش يرتّب.</li>
            </ul>
            <p class="help-sub">📱 كل واحد من موبايله</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>من 2 لـ8 لاعبين. الورق بيكبر مع العدد: حوالي 8 أزواج لكل لاعب، لحد الكوتشينة كلها (26 زوج) والشايب.</li>
                <li>وقت الدور (15 أو 30 ثانية) لو المضيف حطه: لما يخلص بيتسحب كارت عشوائي. والمضيف يقدر يسحب بدل حد موبايله فصل.</li>
                <li>اللي بيخرج من الغرفة، ورقه بيروح للي بعده.</li>
            </ul>
            <p class="help-sub">📺 على التلفزيون</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>مين بيسحب من مين والكارت المرفوع، والأزواج وهي بتتقفل، ومين نجي. والشايب بيتقلب في الآخر بس.</li>
            </ul>
            <p class="help-sub">🏆 العدّاد</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>كل دور له خسران واحد. ولو لعبتوا تاني بتتعد مرات الشايب، والأقل هو الأول.</li>
                <li>🧓 <b>ش-ا-ي-ب: ماتش السهرة</b> (شغّال من الأول): كل خسارة بحرف من «شايب» على كرسيك. اللي يكمّل الأربع حروف يبقى <b>شايب السهرة</b> بالطربوش، والماتش اللي بعده يبدأ من الأول. الحروف بتتمسح لما ترجعوا لقايمة الألعاب.</li>
            </ul>`,
    },
    en: {
      oldmaid: `
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li>One extra card is in the deck: <b>the Old Maid</b>. Every card is dealt, each hand on its own phone.</li>
                <li>A pair is <b>the same rank and the same colour</b>: the 7 of hearts with the 7 of diamonds (both red), or the Jack of spades with the Jack of clubs (both black). The pairs in your hand from the deal go out by themselves.</li>
                <li>On your turn <b>draw one card blind</b> from the next player: tap a card to lift it (everyone sees which one is up), and tap it again to take it.</li>
                <li>A card that makes a pair with one of yours goes out with it. Out of cards and you're <b>safe</b>.</li>
                <li>The last one left holding cards holds <b>the Old Maid</b>… and loses.</li>
            </ol>
            <p class="help-sub">🤲 The hands</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li><b>Drag to arrange</b> (the default): slide a card of yours sideways to move it, even while the player before you has lifted one: the lifted card moves with it, and the drawer sees the cards move.</li>
                <li><b>Auto-shuffle</b>: the app shuffles every hand after each turn, and nobody arranges.</li>
            </ul>
            <p class="help-sub">📱 Each on their own phone</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>2 to 8 players. The deck grows with the table: about 8 pairs a player, up to a whole deck (26 pairs) and the Old Maid.</li>
                <li>A turn clock (15 or 30 seconds) if the host sets one: when it runs out a random card is drawn. The host can draw for a phone that went quiet.</li>
                <li>Someone who leaves the room hands their cards to the next player.</li>
            </ul>
            <p class="help-sub">📺 On the TV</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>Who draws from whom and the card that's lifted, the pairs going out, and who is safe. The Old Maid is only turned over at the end.</li>
            </ul>
            <p class="help-sub">🏆 The tally</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>One loser a game. Play again and the times each was left with the Old Maid are counted, fewest first.</li>
                <li>🧓 <b>M-A-I-D: the evening's match</b> (on by default): every loss puts a letter of MAID on your seat. Whoever spells all four is the <b>Old Maid of the evening</b>, fez and all, and the next match starts from scratch. The letters are wiped when you go back to the games list.</li>
            </ul>`,
    }
  }
});
