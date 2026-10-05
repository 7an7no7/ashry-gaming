/* doubt: the words only this game's screens show, and its rules (Help, the
   first-play card). The build puts them into TRANSLATIONS and GAME_RULES (tools/game-text.cjs):
   read them as t.<key> and GAME_RULES[lang].<id>, as everywhere. */
gameText({
  translations: {
    ar: {
      db_st_threw: "×{n} على الكومة",
      db_rank_open_big: "رتبة جديدة",
      db_claim: "{n} × {rank}",
      db_call: "كدّاب!",
      db_call_hint: "{name}: {claim}… مصدّق؟",
      db_call_hint_last: "آخر ورق {name}! دي آخر فرصة تكدّب",
      db_stamp_lie: "كدّاب!",
      db_stamp_true: "صادق",
      db_called_lie: "🤥 كدبة! ورق {name} اتقلب، والكوم ({n}) كله لـ{name}",
      db_called_true: "✅ صادق! ورق {name} مظبوط، والكوم ({n}) كله لـ{by}",
      db_called_took: "الكوم ({n}) كله لـ{name}",
      db_ev_deal: "🔀 اتوزع {n} كارت",
      db_ev_lead: "🆕 {name}: {claim}",
      db_ev_play: "🂠 {name}: {claim}",
      db_ev_pass: "✋ {name}: باص",
      db_ev_pile_out: "🗑️ الكل باص: الكوم ({n}) خرج، والبداية مع {name}",
      db_ev_out: "🏅 {name}: الورق خلص، المركز {n}",
      db_ev_auto_clock: "⏱️ {name}: الوقت خلص",
      db_ev_auto_host: "⏭️ المضيف لعب بدل {name}",
      db_ev_win: "🏆 اللي كسب: {name}!",
      db_ev_left: "🚪 {name}: خروج من اللعبة",
      db_new_rank: "🆕 رتبة جديدة، والبداية مع {name}",
      db_pile_went: "🗑️ الكوم خرج، والبداية مع {name}",
      db_rank: "الرتبة",
      db_in_pile: "في الكوم",
      db_tag_last: "آخر ورق!",
      db_tag_pass: "باص",
      db_turn_of: "الدور على {name}",
      db_waiting_lead: "رتبة جديدة: البداية بأي رتبة وأي عدد",
      db_waiting_follow: "{rank} أو باص",
      db_waiting_last: "آخر ورق {name} على الأرض: كدّب أو عدّي",
      db_your_lead: "دورك تبدأ",
      db_your_follow: "دورك: {rank}",
      db_pick_cards: "اختار كروت من ورقك",
      db_lead_hint_chips: "دوس على رتبة: ورقك منها بيتختار لوحده. عايز تكدب؟ اختار كروت بإيدك الأول.",
      db_have_pick: "اختار الـ{rank} اللي معاك ({n})",
      db_have_none: "معكش {rank}: اكدب أو قول باص",
      db_call_bot: "{name} هيلعب دلوقتي… الحق!",
      db_pick_rank: "اختار الرتبة",
      db_throw: "ارمي {claim}",
      db_pass: "باص",
      db_picked: "اخترت {n}",
      db_your_cards: "ورقك",
      db_no_cards: "مفيش ورق",
      db_you_out: "ورقك خلص! المركز {n}",
      db_you_out_hint: "استنى الباقيين يخلّصوا",
      db_skip_turn: "العب بدل {name}",
      db_tv_call: "أي حد يقدر يقول كدّاب! على ورق {name}",
      db_pop_pile_out: "الكوم خرج",
      db_won: "🏆 اللي كسب: {name}!",
      db_over_left: "اللعبة خلصت: مفيش غير {name}",
      db_over_none: "اللعبة خلصت",
      db_wins_board: "مرات الفوز",
      db_end: "نهاية اللعبة",
      db_end_first: "أول واحد يخلّص",
      db_end_places: "على المراكز",
      db_end_first_hint: "أول واحد ورقه يخلص (ومحدش كدّبه صح) يكسب.",
      db_end_places_hint: "نكمّل لحد ما يفضل واحد، وكل واحد ياخد مركزه.",
      db_clock: "وقت الدور",
      db_clock_hint: "لو الوقت خلص: باص، أو كارت واحد صادق لو عليك البداية.",
      db_deck_one: "كوتشينة واحدة (52 كارت) بتتوزع كلها",
      db_deck_two: "من 7 لاعبين: كوتشينتين (104 كارت)",
      db_need_three: "محتاجين 3 على الأقل: ضيف لاعبين كمبيوتر",
      db_lobby_hint: "كل واحد ورقه على موبايله. ارمي ورق مقلوب وقول رتبته… وأي حد يقدر يقول كدّاب!",
    },
    en: {
      db_st_threw: "×{n} on the pile",
      db_rank_open_big: "New rank",
      db_claim: "{n} × {rank}",
      db_call: "Liar!",
      db_call_hint: "{name}: {claim}… believe it?",
      db_call_hint_last: "{name}'s last cards! Last chance to call it",
      db_stamp_lie: "LIAR!",
      db_stamp_true: "TRUE",
      db_called_lie: "🤥 A lie! {name}'s cards turned over: all {n} go to {name}",
      db_called_true: "✅ True! {name} was honest: all {n} go to {by}",
      db_called_took: "All {n} cards go to {name}",
      db_ev_deal: "🔀 {n} cards dealt",
      db_ev_lead: "🆕 {name}: {claim}",
      db_ev_play: "🂠 {name}: {claim}",
      db_ev_pass: "✋ {name}: pass",
      db_ev_pile_out: "🗑️ All passed: the pile ({n}) is out, {name} leads",
      db_ev_out: "🏅 {name} is out of cards: place {n}",
      db_ev_auto_clock: "⏱️ {name}: time's up",
      db_ev_auto_host: "⏭️ The host played for {name}",
      db_ev_win: "🏆 {name} wins!",
      db_ev_left: "🚪 {name} left the game",
      db_new_rank: "🆕 A new rank: {name} leads",
      db_pile_went: "🗑️ The pile is out: {name} leads",
      db_rank: "Rank",
      db_in_pile: "in the pile",
      db_tag_last: "Last cards!",
      db_tag_pass: "Pass",
      db_turn_of: "{name}'s turn",
      db_waiting_lead: "A new rank: any rank, any number of cards",
      db_waiting_follow: "{rank}, or pass",
      db_waiting_last: "{name}'s last cards are down: call it or let it go",
      db_your_lead: "Your lead",
      db_your_follow: "Your turn: {rank}",
      db_pick_cards: "Pick cards from your hand",
      db_lead_hint_chips: "Tap a rank: your cards of it are picked. Bluffing? Pick cards by hand first.",
      db_have_pick: "Pick your {rank} ({n})",
      db_have_none: "No {rank} in your hand: bluff or pass",
      db_call_bot: "{name} plays any second… quick!",
      db_pick_rank: "Pick the rank",
      db_throw: "Lay {claim}",
      db_pass: "Pass",
      db_picked: "{n} picked",
      db_your_cards: "Your cards",
      db_no_cards: "No cards",
      db_you_out: "You're out of cards! Place {n}",
      db_you_out_hint: "Wait for the others to finish",
      db_skip_turn: "Play for {name}",
      db_tv_call: "Anyone can call Liar! on {name}'s cards",
      db_pop_pile_out: "Pile out",
      db_won: "🏆 {name} wins!",
      db_over_left: "Game over: only {name} is left",
      db_over_none: "Game over",
      db_wins_board: "Games won",
      db_end: "The game ends",
      db_end_first: "First out wins",
      db_end_places: "For places",
      db_end_first_hint: "The first out of cards (and not caught lying) wins.",
      db_end_places_hint: "Play on until one is left: everyone gets a place.",
      db_clock: "Turn clock",
      db_clock_hint: "When it runs out: a pass, or one true card when leading.",
      db_deck_one: "One deck (52 cards), all dealt",
      db_deck_two: "From 7 players: two decks (104 cards)",
      db_need_three: "At least 3 players: add computer players",
      db_lobby_hint: "Each hand on its own phone. Lay cards face down and claim a rank… anyone can call Liar!",
    }
  },
  rules: {
    ar: {
      doubt: `
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li>الورق كله بيتوزع، وكل واحد ورقه على موبايله. الهدف: تخلّص ورقك.</li>
                <li>اللي عليه البداية يختار <b>أي رتبة</b> (سبعات مثلاً) ويرمي <b>أي عدد</b> من الكروت <b>مقلوبة</b>: صادقة أو لأ.</li>
                <li>اللي بعده يرمي كروت على إنها <b>نفس الرتبة</b>، أو يقول <b>باص</b>. وهكذا لحد ما حد يكدّب.</li>
                <li><b>أي حد</b> يقدر يدوس <b>كدّاب!</b> على آخر ورق اترمى، قبل ما اللي بعده يرمي أو يعدّي. أول واحد يدوس هو اللي يكدّب.</li>
                <li>الورق ده بيتقلب: لو <b>كدب</b>، اللي رماه ياخد الكوم كله. لو <b>صادق</b>، اللي كدّبه ياخد الكوم. <b>اللي طلع معاه حق يبدأ</b> رتبة جديدة.</li>
                <li>لو <b>الكل قال باص</b> بعد آخر رمية، الكوم بيخرج من اللعب مقلوب، واللي رمى آخر ورق يبدأ.</li>
            </ol>
            <p class="help-sub">🏁 النهاية</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li><b>أول واحد يخلّص</b> (من الأول): أول واحد ورقه يخلص يكسب. بس آخر رمية ليه لازم تعدّي: لو حد كدّبها وطلعت كدب، ياخد الكوم ويكمّل.</li>
                <li><b>على المراكز</b>: نكمّل لحد ما يفضل واحد، وكل واحد ياخد مركزه. ولو لعبتوا تاني بتتعد مرات الفوز.</li>
            </ul>
            <p class="help-sub">📱 كل واحد من موبايله</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>دوس على الكروت عشان تختارها. لما تبدأ، اختار الرتبة (ولو كل اللي اخترته رتبة واحدة، بتتختار لوحدها).</li>
                <li>من 3 لـ12 على الترابيزة؛ من 7 كوتشينتين. ضيفوا <b>لاعبين كمبيوتر</b> لو عددكم قليل، حتى لو لوحدك: السهل بيكدّب ويكدّب على البركة، والصعب بيحسب اللي في إيده. والكمبيوتر مابيشوفش ورق حد.</li>
                <li>وقت الدور (30 أو 60 ثانية) لو المضيف حطه: لما يخلص الموبايل بيقول باص، أو يرمي كارت واحد صادق لو عليك البداية. والمضيف يقدر يلعب بدل حد موبايله فصل.</li>
            </ul>
            <p class="help-sub">📺 على التلفزيون</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>الكوم والرتبة وكل رمية ومين قال باص، وكل كدّاب! وهو بيتقلب قدام الكل. ورق حد مابيبانش أبداً.</li>
            </ul>
            <p class="help-sub">💡 نصايح</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>لو في إيدك 3 سبعات وحد قال إنه رمى 2، يبقى فيه حاجة غلط!</li>
                <li>ارمي الكدبة وسط الصح: كارت زيادة مع كروتك الصادقة صعب يتكشف.</li>
            </ul>`,
    },
    en: {
      doubt: `
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li>Every card is dealt, each hand on its own phone. The aim: get rid of your cards.</li>
                <li>Whoever leads names <b>any rank</b> (Sevens, say) and lays <b>any number</b> of cards <b>face down</b>: true or not.</li>
                <li>The next player lays cards claiming <b>the same rank</b>, or <b>passes</b>. And so on until someone calls.</li>
                <li><b>Anyone</b> can press <b>Liar!</b> on the last cards laid, before the next player lays or passes. The first to press is the one who calls.</li>
                <li>Those cards turn over: a <b>lie</b>, and whoever laid them takes the whole pile; <b>true</b>, and the caller takes it. <b>Whoever was right leads</b> a new rank.</li>
                <li>If <b>everyone passes</b> after a play, the pile goes out of the game face down and the last to play leads.</li>
            </ol>
            <p class="help-sub">🏁 The end</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li><b>First out wins</b> (the default): the first out of cards wins - but that last play still has to survive: called and a lie, the pile comes back.</li>
                <li><b>For places</b>: play on until one is left, everyone gets a place. Play again and the wins are counted.</li>
            </ul>
            <p class="help-sub">📱 Each on their own phone</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>Tap cards to pick them. When you lead, pick the rank (if every card you picked is one rank, it is picked for you).</li>
                <li>3 to 12 at the table; two decks from 7. Add <b>computer players</b> to make up a table, even on your own: easy lies and calls on a whim, hard counts what it holds. They never see anyone's cards.</li>
                <li>A turn clock (30 or 60 seconds) if the host sets one: when it runs out the phone passes, or lays one true card when leading. The host can play for a phone that went quiet.</li>
            </ul>
            <p class="help-sub">📺 On the TV</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>The pile, the rank, every play and every pass, and every Liar! turning over for the whole room. Nobody's hand, ever.</li>
            </ul>
            <p class="help-sub">💡 Tips</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>Holding three Sevens and someone claims two? Something's off!</li>
                <li>Hide a lie among the truth: one extra card with your real ones is hard to catch.</li>
            </ul>`,
    }
  }
});
