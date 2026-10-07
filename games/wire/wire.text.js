/* wire: the words only this game's screens show, and its rules (Help, the
   first-play card). The build puts them into TRANSLATIONS and GAME_RULES (tools/game-text.cjs):
   read them as t.<key> and GAME_RULES[lang].<id>, as everywhere. */
gameText({
  translations: {
    ar: {
      wr_ord_bus: "أمر على موبايلك:",
      wr_ord_kitchen: "ماما بتقول:",
      wr_ord_wedding: "عم الفرح بيزعّق:",
      wr_prog_bus: "الطريق",
      wr_dmg_bus: "حرارة الموتور",
      wr_prog_kitchen: "السفرة",
      wr_dmg_kitchen: "الدخان",
      wr_prog_wedding: "الكلوبات",
      wr_dmg_wedding: "زعل المعازيم",
      wr_watching: "بتتفرج · تلعب اللعبة الجاية",
      wr_caller_title: "إنت المنادي!",
      wr_caller_hint: "نادي على الأوامر بصوت عالي: اللي فوق هو اللي هيتحرق الأول",
      wr_caller_soon: "الأوامر جاية… استعد تنادي",
      wr_shake_title: "الكل يهز الموبايل!",
      wr_shake_tap: "هزّ الموبايل… أو دوس هنا 3 مرات",
      wr_shake_done: "تمام! مستنيين الباقيين",
      wr_shake_ok: "هزّة جامدة! +2",
      wr_shake_fail: "مش الكل هزّ… ضرر!",
      wr_over_time: "الوقت خلص!",
      wr_over_left: "مفيش لاعيبة كفاية",
      wr_over_damage: "الضرر كتر… باظت خالص!",
      wr_again: "العب تاني",
      wr_wait_host: "مستنيين المضيف",
      wr_levels_cleared: "مستويات عدّيتوها",
      wr_new_best: "رقم جديد للأوضة!",
      wr_room_best: "أحسن رقم للأوضة: {n}",
      wr_place: "المكان",
      wr_place_bus: "الميكروباص",
      wr_place_kitchen: "المطبخ",
      wr_place_wedding: "الفرح",
      wr_place_random: "عشوائي",
      wr_surprises: "مفاجآت",
      wr_surprises_hint: "لوحات جديدة كل مستوى، حاجات بتبوظ فجأة، و«الكل يهز الموبايل!».",
      wr_lobby_hint: "كل موبايل لوحة، والأمر غالبًا على لوحة حد تاني… زعّق بيه!",
      wr_level: "المستوى {n}",
      wr_wipe: "امسح! ({n})",
      wr_get_ready: "استعدوا! المستوى {n}",
      wr_learn_panel: "اتعرّف على لوحتك",
      wr_level_won: "عدّينا المستوى {n}!",
      wr_game_over: "خلصت اللعبة",
      wr_shout: "مش عندك؟ زعّق بيها للباقيين!",
      wr_next_now: "المستوى الجاي دلوقتي",
      wr_orders_in: "الأوامر بعد {n}",
      wr_next_in: "المستوى الجاي بعد {n}",
      wr_done: "تمام!",
      wr_done_by: "على إيد {name}",
      wr_missed: "فاتت!",
      wr_mash: "شكلك بتلعب عشوائي! 🙉 −¼",
      wr_tv_sign: "الواحة 120 كم",
      wr_tv_guests_in: "الضيوف بعد",
      wr_tv_fridge: "على التلاجة دلوقتي",
      wr_tv_legend_wedding: "الكلوبات = التقدّم · وشوش المعازيم = الضرر",
      wr_tv_goal: "الواحة",
      wr_tv_last: "آخر أمر:",
      wr_tv_phone_of: "موبايل {name}",
      wr_tv_target: "{n} أمر لازم يتعمل",
      wr_tv_smoke: "لوحة {name}: دخان على «{c}» — امسحه!",
      wr_tv_flip: "لوحة {name}: «{c}» بالمقلوب!",
    },
    en: {
      wr_ord_bus: "Order on your phone:",
      wr_ord_kitchen: "Mum says:",
      wr_ord_wedding: "The wedding uncle shouts:",
      wr_prog_bus: "The road",
      wr_dmg_bus: "Engine heat",
      wr_prog_kitchen: "The table",
      wr_dmg_kitchen: "Smoke",
      wr_prog_wedding: "Lanterns",
      wr_dmg_wedding: "Upset guests",
      wr_watching: "Watching · you'll play the next game",
      wr_caller_title: "You're the caller!",
      wr_caller_hint: "Read the orders out loud: the top one burns first",
      wr_caller_soon: "Orders coming… get ready to call them",
      wr_shake_title: "Everyone shake your phone!",
      wr_shake_tap: "Shake the phone… or tap here 3 times",
      wr_shake_done: "Done! Waiting for the rest",
      wr_shake_ok: "Great shake! +2",
      wr_shake_fail: "Not everyone shook… damage!",
      wr_over_time: "Time's up!",
      wr_over_left: "Not enough players",
      wr_over_damage: "Too much damage… it's broken!",
      wr_again: "Play again",
      wr_wait_host: "Waiting for the host",
      wr_levels_cleared: "levels cleared",
      wr_new_best: "A new best for the room!",
      wr_room_best: "The room's best: {n}",
      wr_place: "The place",
      wr_place_bus: "Microbus",
      wr_place_kitchen: "Kitchen",
      wr_place_wedding: "Wedding",
      wr_place_random: "Random",
      wr_surprises: "Surprises",
      wr_surprises_hint: "New panels every level, controls breaking out of nowhere, and «Everyone shake!».",
      wr_lobby_hint: "Every phone is a panel, and your order is usually on someone else's… shout it!",
      wr_level: "Level {n}",
      wr_wipe: "Wipe! ({n})",
      wr_get_ready: "Get ready! Level {n}",
      wr_learn_panel: "Learn your panel",
      wr_level_won: "Level {n} cleared!",
      wr_game_over: "Game over",
      wr_shout: "Not on your panel? Shout it to the table!",
      wr_next_now: "Next level now",
      wr_orders_in: "Orders in {n}",
      wr_next_in: "Next level in {n}",
      wr_done: "Done!",
      wr_done_by: "by {name}",
      wr_missed: "Missed!",
      wr_mash: "Mashing at random? 🙉 −¼",
      wr_tv_sign: "Oasis 120 km",
      wr_tv_guests_in: "Guests in",
      wr_tv_fridge: "On the fridge now",
      wr_tv_legend_wedding: "Lanterns = progress · guests' faces = damage",
      wr_tv_goal: "Oasis",
      wr_tv_last: "Last order:",
      wr_tv_phone_of: "{name}'s phone",
      wr_tv_target: "{n} orders to do",
      wr_tv_smoke: "{name}'s panel: smoke on «{c}» — wipe it!",
      wr_tv_flip: "{name}'s panel: «{c}» is upside down!",
    }
  },
  rules: {
    ar: {
      wire: `
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li>كل واحد بموبايله، وكل موبايل <b>لوحة</b> فيها 4-6 حاجات بأسامي مضحكة: زراير، مفاتيح بتتقلب، عدّادات من 1 لـ 5، وسلايدرات.</li>
                <li>كل موبايل بيجيله <b>أمر</b> بشريط بيخلص («شد فرامل اليد»، «قلّب المحشي»)، وغالبًا الحاجة دي على <b>لوحة حد تاني</b>: زعّق بيه للترابيزة، واللي عنده يعمله بسرعة.</li>
                <li>كل أمر يتعمل يقرّب المستوى من الآخر. كل أمر يفوت <b>ضرر</b>. المستوى يقع لو الضرر اتملى <b>أو</b> الوقت خلص، أيهما الأول.</li>
                <li>🙉 ممنوع التخبيط: لو لعبت في لوحتك <b>3 مرات ورا بعض</b> في حاجة مفيش أمر مستنيها، ده <b>ربع ضرر</b> على الترابيزة. اسمع الأوامر الأول! أول ما تعمل أمر، العدّ يبدأ من الأول.</li>
                <li>المستويات بتصعب لحد ما تخسروا، والأوضة بتحفظ أحسن رقم.</li>
                <li>التلات أماكن: الميكروباص عطلان على الطريق الصحراوي، المطبخ قبل الضيوف بساعة، والفرح والنور قاطع. المضيف يختار، أو عشوائي.</li>
                <li>📣 <b>المنادي</b>: اللي داخل في النص أو الزيادة عن 8 بيتفرج، وموبايله بيوريه كل الأوامر المفتوحة وشريط كل واحد، فينادي للترابيزة على الأمر اللي قرّب يتحرق.</li>
            </ol>
            <p class="help-sub">🎁 المفاجآت</p>
            <p class="text-xs">لو المضيف سايبها شغّالة: اللوحات بتتغير كل مستوى، حاجة بتبوظ فجأة (دخان امسحه بالضغط، أو تتقلب بالمقلوب شوية)، و«الكل يهز الموبايل!» — كله يهز في نفس الوقت (أو يدوس 3 مرات).</p>
            <p class="help-sub">📺 التلفزيون</p>
            <p class="text-xs">المشهد والتقدّم والضرر والساعة، والإنذارات بصوت عالي. من غير تلفزيون كل موبايل بيوري الضرر والوقت، والصوت من موبايل المضيف.</p>`,
    },
    en: {
      wire: `
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li>Everyone on their own phone, and every phone is a <b>panel</b> of 4-6 funny controls: buttons, switches, dials from 1 to 5 and sliders.</li>
                <li>Every phone gets an <b>order</b> with a draining bar ("Pull the handbrake", "Turn the vine leaves"), and it is usually on <b>someone else's panel</b>: shout it across the table, and whoever has it does it fast.</li>
                <li>Every order done brings the level closer to its end. Every order missed is <b>damage</b>. A level is lost when the damage fills up <b>or</b> the clock runs out, whichever comes first.</li>
                <li>🙉 No mashing: <b>3 moves in a row</b> on controls no order is waiting for cost the table <b>a quarter of a damage</b>. Listen first! Doing an order starts the count again.</li>
                <li>The levels get harder until you lose, and the room keeps its best.</li>
                <li>Three places: the microbus broken down on the desert road, the kitchen an hour before the guests, and the wedding with the power cut. The host picks, or random.</li>
                <li>📣 <b>The caller</b>: someone who joins mid-game or is the ninth watches, and their phone shows every open order with its bar, so they shout out the one about to burn.</li>
            </ol>
            <p class="help-sub">🎁 Surprises</p>
            <p class="text-xs">If the host leaves them on: new panels every level, a control breaking out of nowhere (smoke to wipe off with taps, or turned upside down for a while), and «Everyone shake your phone!» - all at once (or tap 3 times).</p>
            <p class="help-sub">📺 The TV</p>
            <p class="text-xs">The scene, the progress, the damage and the clock, and the alarms out loud. With no TV every phone shows the damage and the time, and the host's phone plays the sound.</p>`,
    }
  }
});
