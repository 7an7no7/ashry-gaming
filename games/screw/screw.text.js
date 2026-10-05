/* screw: the words only this game's screens show, and its rules (Help, the
   first-play card). The build puts them into TRANSLATIONS and GAME_RULES (tools/game-text.cjs):
   read them as t.<key> and GAME_RULES[lang].<id>, as everywhere. */
gameText({
  translations: {
    ar: {
      screw_opt_partners: "صاحب صاحبه",
      screw_opt_partners_hint: "فريقين بالتبادل في ترتيب الأسماء: الأول والتالت فريق، والتاني والرابع فريق (اتنين ضد اتنين، أو تلاتة ضد تلاتة، أو أربعة ضد أربعة). مجموع الفريق هو مجموع إيدين لاعيبته، ولو فريق اللي قال سكرو مخدش صفر، إيد اللي قالها بس هي اللي بتتضاعف.",
      screw_opt_thief: "الحرامي",
      screw_opt_thief_hint: "في آخر كل جولة وقبل كشف الكروت، الترابيزة تتهم حد إن معاه الحرامي. اتمسك: الحرامي \u2066+25\u2069. متمسكش: الحرامي ياخد أقل نتيجة في الجولة، وكل صاحب أقل نتيجة ياخد \u2066+25\u2069.",
      screw_need_pairs: "صاحب صاحبه محتاج عدد زوجي من اللاعبين: 4 أو 6 أو 8",
      screw_teams: "الفرق",
      screw_teams_order: "الفرق بترتيب ما اخترت الأسماء.",
      screw_rule_hint: "أقل مجموع بصفر. اللي قال سكرو بصفر لو مجموعه أقل من الكل أو قد أقلهم، والباقيين مجموعهم زي ما هو؛ وإلا مجموعه يتضاعف. لو حد خلّص كروته: هو اللي بصفر، واللي قال سكرو يتضاعف.",
      screw_who_called: "مين قال سكرو؟",
      screw_thief_holder: "مين كان معاه الحرامي فعلاً؟",
      screw_thief_caught: "الحرامي اتمسك",
      screw_need_hands: "ناقص مجموع: {names}",
      screw_need_caller: "اختار مين قال سكرو (أو محدش)",
      screw_need_holder: "اختار مين كان معاه الحرامي (أو محدش)",
      screw_holder_finisher: "اللي خلّص ورقه مايبقاش معاه الحرامي",
      screw_save_fix: "حفظ التعديل",
      skr_slot_yours: "كارتك {n}",
      skr_slot: "كارت {n}",
      skr_slot_of: "كارت {n} بتاع {name}",
      skr_mark_swap_you: "🔄 اتبدّل مع كارت من كروتك",
      skr_mark_swap: "🔄 اتبدّل مع {name}",
      skr_mark_give: "🎁 جه من {name}",
      skr_mark_look: "👁️ شافه: {names}",
      skr_log_deal: "🃏 الجولة {n} اتوزّعت",
      skr_log_reshuffle: "🔀 الورق خلص: الأرض اتخلطت ورجعت ورق",
      skr_log_draw: "🂠 {a}: سحب من الورق",
      skr_log_keep_new: "🔁 {a}: الكارت الجديد بقى {x}",
      skr_log_keep: "🔁 {a}: الكارت الجديد مكان {x}، و{card} على الأرض",
      skr_log_discard: "⬇️ {a}: {card} على الأرض",
      skr_log_take: "⬆️ {a}: {card} من الأرض مكان {x}",
      skr_log_match_ok: "🎯 {a}: {x} ({card}) زيّ اللي على الأرض ✓",
      skr_log_penalty: "➕ {a}: كارت عقاب بقى {x}",
      skr_log_screw: "📣 {a}: سكرو!",
      skr_log_peek: "👁️ {a}: بصّة على {x}",
      skr_log_spy: "🔍 {a}: بصّة على {x}",
      skr_log_swap: "🔄 {a}: {x} ⇄ {y}",
      skr_log_basra: "🗑️ {a}: {x} ({card}) على الأرض",
      skr_log_around: "🔁 {a}: بصّة على {x}",
      skr_log_give: "🎁 {a}: {x} راح لـ{b}",
      skr_log_seeswap: "🕵️ {a}: بصّة على {x} وتبديل مع {y}",
      skr_log_seeleave: "🕵️ {a}: بصّة على {x} من غير تبديل",
      skr_log_asyoulike: "🃏 {a}: على كيفك ← {power}",
      skr_asyoulike_none: "مفيش كارت أوامر على الأرض يتقلّد، فهيترمي بصرة",
      skr_log_ping: "🏓 {a}: بينج! الدور راح على {b}",
      skr_log_pong_ok: "🎾 {a}: بونج ✓",
      skr_log_pong_no: "❌ {a}: {x} مش بونج، وكارت عقاب",
      skr_log_wakeup: "🥁 {a}: المسحراتي! الكروت هتتكشف",
      skr_log_cannon: "💥 {a}: المدفع على {b}، وكروت {b} مكشوفة للكل",
      skr_log_khoshaf: "🥣 {a}: الخشاف، 4 كروت من الورق",
      skr_log_skip: "⏭️ الدور عدّى: {a}",
      skr_no_thief: "مفيش حرامي",
      skr_log_reveal: "🃏 الكروت اتكشفت",
      skr_log_title: "اللي حصل",
      skr_pick_keep: "اختار الكارت اللي هيروح مكانه",
      skr_pick_take: "اختار الكارت اللي هيتبدّل باللي على الأرض",
      skr_pick_match: "اختار الكارت اللي زيّ اللي على الأرض",
      skr_pick_pong: "اختار كارت البونج من كروتك",
      skr_pick_seeswap: "اختار كارت من عندك يتبدّل معاه",
      skr_power_asyoulike: "اختار كارت أوامر من الأرض تقلّده",
      skr_power_around: "كارت من كل واحد، ولا كارتين من عندك؟",
      skr_power_around_own: "اختار كارتين من كروتك تشوفهم",
      skr_power_around_others: "اختار كارت واحد من عند كل لاعب",
      skr_power_peek: "اختار كارت من كروتك تشوفه",
      skr_power_spy: "اختار كارت من عند أي حد تشوفه",
      skr_power_swap: "اختار كارت من عندك وكارت من عند حد تاني يتبدّلوا من غير ما حد يشوف",
      skr_power_basra: "اختار كارت من كروتك يترمي على الأرض",
      skr_power_give: "اختار كارت من عندك واللاعب اللي هياخده",
      skr_power_seeswap: "اختار كارت من عند حد تاني تشوفه، وبعدها تبدّله أو تسيبه",
      skr_power_cannon: "اختار لاعب كروته تتكشف للكل لآخر الجولة",
      skr_power_khoshaf: "شوف أول 4 كروت في الورق وخد واحد",
      skr_screw_confirm: "تقول سكرو؟ كل واحد تاني هيلعب دور أخير، وبعدها الكروت تتكشف.",
      skr_mark_none: "محدش لمسه من ساعة ما اتوزّع",
      skr_protected: "سكرو: الكروت دي محمية",
      skr_memo_badge: "احفظهم",
      skr_your_cards: "كروتك",
      skr_drawn_label: "الكارت اللي سحبته",
      skr_held_label: "في الإيد",
      skr_deck: "الورق",
      skr_pile: "الأرض",
      skr_ed_custom: "مخصص",
      skr_round_of: "جولة {n}/{m}",
      skr_final_lap: "آخر لفة · فاضل {n}",
      skr_lap: "لفة {n}",
      skr_turn_of: "دور {name}",
      skr_hint_pong: "بينج! فرصة بونج",
      skr_hint_drawn: "كارت مسحوب في الإيد",
      skr_seeswap_do: "بدّله مع كارت من عندي",
      skr_seeswap_leave: "سيبه مكانه",
      skr_ok: "تمام",
      skr_seen_title: "اللي شفته",
      skr_seen_hint: "على موبايلك بس",
      skr_around_others: "كارت من كل واحد",
      skr_around_own: "كارتين من عندي",
      skr_khoshaf_show: "اكشف 4 كروت",
      skr_scream_go: "اصرخ!",
      skr_guarded: "كروت اللي قال سكرو محمية",
      skr_skip_power: "من غير القوة",
      skr_khoshaf_pick: "اختار كارت من الأربعة، والباقي يروح تحت الورق",
      skr_thief_q: "مين معاه الحرامي؟",
      skr_begin_round: "ابدأ الجولة",
      skr_ready_count: "جاهزين {n}/{m}",
      skr_memorize: "احفظ الكارتين اللي تحت (التالت والرابع)، وبعدها هيتقلبوا",
      skr_memorized: "حفظتهم",
      skr_waiting_ready: "مستنيين الباقي يحفظوا",
      skr_your_turn: "دورك!",
      skr_keep_new: "خليه معاك",
      skr_keep: "بدّله مع كارت",
      skr_discard: "ارميه",
      skr_must_keep: "الكارت ده بيدخل إيدك",
      skr_discard_power: "ارميه واستعمل قوته",
      skr_screw_called: "سكرو اتقالت خلاص",
      skr_screw_from_lap: "سكرو مسموح من اللفة {n}",
      skr_pong_open: "بينج! لو معاك بونج ارميه دلوقتي",
      skr_pong_btn: "بونج!",
      skr_draw: "اسحب من الورق",
      skr_take_pile: "خد اللي على الأرض",
      skr_match: "ارمي كارت زيّه",
      skr_screw: "سكرو!",
      skr_skip_turn: "تخطي دور {name}",
      skr_standings: "المجموع (الأقل يكسب)",
      skr_reveal_title: "كشف الكروت",
      skr_lowest_wins: "الأقل نقط يكسب",
      skr_lobby_hint: "كل واحد كروته على موبايله، وكروت الكل قدامك مقلوبة. أي تبديل أو بصّة بتبان من أنهي كارت لأنهي كارت.",
      skr_lobby_wait: "المضيف بيختار الإصدار",
      skr_ed_line_classic: "الكوتشينة الأساسية: أرقام، بصّات، خد وهات، بصرة، كعب داير",
      skr_ed_line_general: "كل الكروت من كل الإصدارات",
      skr_ed_line_custom: "اختار الإضافات بنفسك",
      skr_base_always: "الكروت الأساسية موجودة دايمًا",
      skr_edition: "الإصدار",
      skr_deck_size: "{n} كارت",
      skr_two_decks: "كوتشينتين",
      skr_one_deck: "كوتشينة واحدة",
      skr_teams: "صاحب صاحبه (فريقين)",
      skr_teams_hint: "لـ 4 أو 6 أو 8 لاعبين، والشركا قاعدين بالتبادل",
      skr_rounds: "عدد الجولات",
      skr_screw_lap: "سكرو مسموح من اللفة",
      skr_clock: "وقت الدور",
      skr_clock_off: "من غير",
      skr_tv_memorize: "كل واحد يحفظ الكارتين اللي تحت",
      screw_who_finished: "حد خلّص كروته؟",
      screw_thief_accused: "مين اتهمته الترابيزة؟",
      screw_need_accused: "اختار اتهام الترابيزة (أو مفيش حرامي)",
      screw_finished: "من غير كروت: بصفر",
      screw_thief_stole: "الحرامي سرق أقل نتيجة",
      screw_thief_victim: "الحرامي سرق أقل نتيجة: \u2066+25\u2069",
      skr_h_deck: "🆕 من الورق",
      skr_h_khoshaf: "🆕 من الخشاف",
      skr_h_pile: "⬆️ {card} من الأرض",
      skr_h_pile_plain: "⬆️ من الأرض",
      skr_h_penalty: "➕ كارت عقاب",
      skr_h_swap: "🔄 من {ref}",
      skr_h_now: "دلوقتي",
      skr_h_ago_1: "من دور واحد",
      skr_h_ago_2: "من دورين",
      skr_h_ago: "من {n} أدوار",
      skr_h_ago_many: "من {n} دور",
      skr_seat_take: "⬆️ {card} من الأرض ← {x}",
      skr_log_match_back: "❌ {a}: {x} ({card}) مش زيّه، ورجع مقلوب، وكارت عقاب في خانة جديدة",
      skr_log_basra_back: "🗑️ {a}: {x} ({card}) مينفعش يترمي، ورجع مقلوب",
      skr_log_pong_back: "❌ {a}: {x} ({card}) مش بونج، ورجع مقلوب، وكارت عقاب في خانة جديدة",
      skr_log_finish: "🏁 كروت {a} خلصت: الجولة انتهت",
      skr_log_last_lap: "💀 الورق خلص: دور أخير للكل",
      skr_log_pass: "⏭️ دور {a} عدّى من غير لعب",
      skr_log_vote: "🗳️ صوت {a} اتسجّل",
      skr_log_accuse_none: "🦹 اتهام الترابيزة: مفيش حرامي",
      skr_log_accuse_ok: "🦹 اتهام الترابيزة: {b} ✓",
      skr_log_accuse_no: "🦹 اتهام الترابيزة: {b} ✗",
      skr_protected_team: "فريق سكرو: الكروت دي محمية",
      skr_pick_whose: "كروت {name}",
      skr_pick_who: "اختار لاعب",
      skr_last_lap: "الورق خلص: آخر لفة · فاضل {n}",
      skr_sudden: "موت مفاجئ",
      skr_guarded_team: "كروت فريق اللي قال سكرو محمية",
      skr_why_finish: "🏁 كروت {name} خلصت",
      skr_why_screw: "📣 سكرو {name}",
      skr_why_last_lap: "💀 آخر لفة خلصت",
      skr_voted_count: "صوّتوا {n}/{m}",
      skr_vote_close: "اقفل التصويت",
      skr_vote_yours: "صوتك: {name}",
      skr_vote_done: "صوتك اتسجّل",
      skr_vote_change: "غيّر صوتك",
      skr_vote_tie: "التعادل: صوت اللي قال سكرو يحسم.",
      skr_vote_hint: "لو الأغلبية اختارت اللي معاه الحرامي: عليه \u2066+25\u2069. لو لأ: الحرامي ياخد أقل نتيجة، واللي كانت ليه ياخد \u2066+25\u2069.",
      skr_vote_resend: "غيّر صوتي",
      skr_vote_send: "صوّت",
      skr_vote_change_hint: "تقدر تغيّره لحد ما التصويت يتقفل",
      skr_screw_last_lap: "مفيش سكرو في آخر لفة",
      skr_deck_empty_hint: "الورق خلص: خد من الأرض، ارمي كارت زيّه، أو عدّي",
      skr_pass: "عدّي",
      skr_thief_nobody: "🦹 مفيش حرامي: الكارت مكانش في إيد حد",
      skr_thief_caught_by: "🦹 الترابيزة مسكت الحرامي: {name} \u2066+25\u2069",
      skr_thief_stole: "🦹 الحرامي {name} سرق أقل نتيجة ({score})، و{victims} \u2066+25\u2069",
      skr_thief_unnoticed: "🦹 الحرامي {name} محدش مسكه، بس نتيجته كانت الأقل أصلًا",
      skr_votes_none: "🗳️ محدش صوّت، يعني محدش اتّهم حد",
      skr_accused: "👉 اتهام الترابيزة: {name}",
      skr_vote_pair: "{a} ← {b}",
      skr_thief_was: "الحرامي كان…",
      skr_votes_title: "الأصوات",
      skr_no_cards: "مفيش كروت",
      skr_finish_line_team: "🏁 كروت {name} خلصت: الجولة انتهت ونتيجة فريق {name} 0",
      skr_finish_line: "🏁 كروت {name} خلصت: الجولة انتهت ونتيجة {name} 0",
      skr_double_calc: "📣 سكرو {name} منفعش: {calc}",
      skr_basra_count: "كروت البصرة",
      skr_basra_hint: "4 في الكوتشينة العادية، 2 في الطبعة الأولى",
      skr_memo_time: "وقت الحفظ",
      skr_secs: "{n} ث",
      skr_memo_tap: "بالضغط",
      skr_sudden_hint: "لو الورق خلص: كل واحد ياخد دور أخير وبعدها الكشف. من غيره: الأرض تتخلط وتكمّلوا",
      skr_memory_help: "مساعد الذاكرة",
      skr_memory_hint: "للصغيرين أو للعب الهادي: كل كارت يفضل عليه اتبدّل منين ومين شافه، وآخر حركة لكل لاعب. من غيره الحفظ عليكم.",
      skr_band_screw: "📣 سكرو! آخر لفة",
      skr_band_last_lap: "الورق خلص: آخر لفة",
      skr_band_round_over: "الجولة خلصت",
      skr_h_scream_deal: "😱 اتوزّع من جديد بعد الصرخة",
      skr_log_scream_deal: "😱 {a}: صرخة أوسكار! الكروت اتلمّت واتخلطت واتوزّعت من جديد مقلوبة ({n})",
      skr_log_scream_deal_all: "😱 صرخة أوسكار: الكروت اتلمّت واتخلطت واتوزّعت من جديد مقلوبة ({n})",
      skr_log_boom_all: "💣 {a}: بوم! كل واحد تاني بيرمي كارت من كروته",
      skr_log_boom_pick: "💣 اختيار {a} اتسجّل",
      skr_log_boom_throw: "💥 {x} ({card}) طار على الأرض",
      skr_boom_pick: "💣 بوم! اختار كارت من كروتك يترمي على الأرض",
      skr_boom_from: "💣 بوم من {name}: كل واحد بيرمي كارت",
      skr_after_boom: "💣 بعد بوم: دور {name} تاني",
      skr_after_scream: "😱 بعد الصرخة: دور {name} تاني",
      skr_plays_itself: "الكارت ده بيشتغل لوحده",
      skr_boom_go: "بوم!",
      skr_boom_picked: "اختاروا {n}/{m}",
      skr_boom_close: "كمّل من غير الباقي",
      skr_boom_done: "اتسجّل - مستنيين الباقي",
      skr_your_turn_again: "دورك تاني!",
      skr_band_boom: "بوم! كل واحد يرمي كارت من كروته",
      skr_boom_lucky: "نجاة",
      skr_power_boom_all: "كل لاعب تاني هيختار كارت من كروته المقلوبة يترمي على الأرض، وبعدها دورك تاني",
      skr_power_scream_deal: "الكروت كلها تتلم وتتخلط وتتوزّع تاني مقلوبة، نفس العدد لكل واحد، وبعدها دورك تاني",
      skr_log_steal: "🦹 {a}: سرقة بالحرامي، بصّة على {x}",
      skr_log_steal_swap: "🦹 {a}: {y} اتسرق مكان {x}",
      skr_pick_match_team: "اختار كارت من كروتك أو كروت صاحبك زيّ اللي على الأرض",
      skr_power_steal: "اختار كارت من عند لاعب تاني تبص عليه، وبعدها يتبدّل غصب بكارت من عندك",
      skr_steal_of: "🦹 سرقة {name}: {x}",
      skr_steal_btn: "اسرق بيه",
      skr_steal_pile_btn: "اسرق بالحرامي اللي على الأرض",
      skr_thief_steal: "سرقة الحرامي",
      skr_thief_steal_hint: "الحرامي لما يتسحب أو يتاخد من الأرض ينفع يتلعب على طول: تبص على كارت حد وتبدّله غصب بكارت من عندك",
      skr_team_basra: "بصرة الفريق",
      skr_team_basra_hint: "في دورك تقدر ترمي كارت من كروت صاحبك لو زي اللي على الأرض؛ لو غلط، كارت العقاب ليك",
      skr_replay: "↺ شوف تاني",
      skr_replay_hint: "الحركة دي تتعاد على موبايلك إنت بس",
    },
    en: {
      screw_opt_partners: "Partners",
      screw_opt_partners_hint: "Two teams, alternating in the order of names: the first and third on one team, the second and fourth on the other (two against two, three against three or four against four). A team's total is its players' hands added; if the caller's team doesn't score 0, only the caller's own hand is doubled.",
      screw_opt_thief: "The thief",
      screw_opt_thief_hint: "At the end of every round, before the cards are shown, the table accuses someone of holding the thief. Caught: the thief takes +25. Not caught: the thief takes the round's lowest score, and everyone who had it takes +25.",
      screw_need_pairs: "Partners needs an even number of players: 4, 6 or 8",
      screw_teams: "Teams",
      screw_teams_order: "Teams follow the order the names were picked in.",
      screw_rule_hint: "The lowest total scores 0. Whoever called screw scores 0 if their total is lower than or equal to everyone else's, and the others keep their totals; otherwise the caller's total is doubled. If someone ran out of cards, they score 0 and the caller is doubled.",
      screw_who_called: "Who called screw?",
      screw_thief_holder: "Who really held the thief?",
      screw_thief_caught: "The thief was caught",
      screw_need_hands: "Missing totals: {names}",
      screw_need_caller: "Pick who called screw (or nobody)",
      screw_need_holder: "Pick who held the thief (or nobody)",
      screw_holder_finisher: "Whoever ran out of cards can't hold the thief",
      screw_save_fix: "Save the change",
      skr_slot_yours: "your card {n}",
      skr_slot: "card {n}",
      skr_slot_of: "{name}'s card {n}",
      skr_mark_swap_you: "🔄 Swapped with one of your cards",
      skr_mark_swap: "🔄 Swapped with {name}",
      skr_mark_give: "🎁 Given by {name}",
      skr_mark_look: "👁️ Seen by {names}",
      skr_log_deal: "🃏 Round {n} was dealt",
      skr_log_reshuffle: "🔀 The deck ran out: the pile was shuffled into a new deck",
      skr_log_draw: "🂠 {a} drew from the deck",
      skr_log_keep_new: "🔁 {a} kept the new card as {x}",
      skr_log_keep: "🔁 {a} kept the new card as {x}; {card} went on the pile",
      skr_log_discard: "⬇️ {a} threw {card} on the pile",
      skr_log_take: "⬆️ {a} took {card} from the pile as {x}",
      skr_log_match_ok: "🎯 {a} matched {x} ({card}) ✓",
      skr_log_penalty: "➕ {a} took a penalty card as {x}",
      skr_log_screw: "📣 {a} called Screw!",
      skr_log_peek: "👁️ {a} looked at {x}",
      skr_log_spy: "🔍 {a} looked at {x}",
      skr_log_swap: "🔄 {a} swapped {x} ⇄ {y}",
      skr_log_basra: "🗑️ {a} threw {x} ({card}) on the pile",
      skr_log_around: "🔁 {a} looked at {x}",
      skr_log_give: "🎁 {a} gave {x} to {b}",
      skr_log_seeswap: "🕵️ {a} looked at {x} and swapped it with {y}",
      skr_log_seeleave: "🕵️ {a} looked at {x} and left it",
      skr_log_asyoulike: "🃏 {a}: as you like → {power}",
      skr_asyoulike_none: "No command on the pile to copy, so it is thrown as a Basra",
      skr_log_ping: "🏓 {a}: Ping! {b} loses a turn",
      skr_log_pong_ok: "🎾 {a}: Pong ✓",
      skr_log_pong_no: "❌ {a}: {x} wasn't Pong, a penalty card",
      skr_log_wakeup: "🥁 {a}: El-Mesaharaty! Cards up",
      skr_log_cannon: "💥 {a} fired the cannon at {b}: that hand is face up",
      skr_log_khoshaf: "🥣 {a}: Khoshaf, four cards from the deck",
      skr_log_skip: "⏭️ Turn skipped: {a}",
      skr_no_thief: "No thief",
      skr_log_reveal: "🃏 The cards are revealed",
      skr_log_title: "What happened",
      skr_pick_keep: "Pick the card it replaces",
      skr_pick_take: "Pick the card the pile card replaces",
      skr_pick_match: "Pick the card that matches the pile",
      skr_pick_pong: "Pick your Pong card",
      skr_pick_seeswap: "Pick one of yours to swap it with",
      skr_power_asyoulike: "Point at a command card on the pile to copy",
      skr_power_around: "One card of everyone else, or two of yours?",
      skr_power_around_own: "Pick two of your cards to look at",
      skr_power_around_others: "Pick one card of every other player",
      skr_power_peek: "Pick one of your cards to look at",
      skr_power_spy: "Pick anyone else's card to look at",
      skr_power_swap: "Pick one of yours and one of someone else's to swap unseen",
      skr_power_basra: "Pick one of your cards to throw on the pile",
      skr_power_give: "Pick one of your cards and who gets it",
      skr_power_seeswap: "Pick someone else's card to look at, then swap it or leave it",
      skr_power_cannon: "Pick a player whose hand turns face up until the round ends",
      skr_power_khoshaf: "See the top four cards and take one",
      skr_screw_confirm: "Call Screw? Everyone else gets one last turn, then the cards are revealed.",
      skr_mark_none: "Untouched since the deal",
      skr_protected: "Called Screw; the hand is protected",
      skr_memo_badge: "Memorise",
      skr_your_cards: "Your cards",
      skr_drawn_label: "The card you drew",
      skr_held_label: "In hand",
      skr_deck: "Deck",
      skr_pile: "Pile",
      skr_ed_custom: "Custom",
      skr_round_of: "Round {n}/{m}",
      skr_final_lap: "Final lap · {n} left",
      skr_lap: "Lap {n}",
      skr_turn_of: "{name}'s turn",
      skr_hint_pong: "Ping! A chance for Pong",
      skr_hint_drawn: "Holding a drawn card",
      skr_seeswap_do: "Swap it with one of mine",
      skr_seeswap_leave: "Leave it",
      skr_ok: "Got it",
      skr_seen_title: "What you saw",
      skr_seen_hint: "Only on your phone",
      skr_around_others: "One of everyone else",
      skr_around_own: "Two of mine",
      skr_khoshaf_show: "Show four cards",
      skr_scream_go: "Scream!",
      skr_guarded: "The caller's hand is protected",
      skr_skip_power: "Skip the power",
      skr_khoshaf_pick: "Take one of the four; the rest go under the deck",
      skr_thief_q: "Who holds the thief?",
      skr_begin_round: "Start the round",
      skr_ready_count: "Ready {n}/{m}",
      skr_memorize: "Memorise your bottom two cards (the third and fourth); then they turn over",
      skr_memorized: "Got them",
      skr_waiting_ready: "Waiting for the others to memorise",
      skr_your_turn: "Your turn!",
      skr_keep_new: "Keep it",
      skr_keep: "Swap it into your hand",
      skr_discard: "Throw it",
      skr_must_keep: "This card goes into your hand",
      skr_discard_power: "Throw it, use its power",
      skr_screw_called: "Screw has been called",
      skr_screw_from_lap: "Screw is allowed from lap {n}",
      skr_pong_open: "Ping! If you hold Pong, throw it now",
      skr_pong_btn: "Pong!",
      skr_draw: "Draw from the deck",
      skr_take_pile: "Take from the pile",
      skr_match: "Throw a matching card",
      skr_screw: "Screw!",
      skr_skip_turn: "Skip {name}'s turn",
      skr_standings: "Totals (lowest wins)",
      skr_reveal_title: "The reveal",
      skr_lowest_wins: "Lowest score wins",
      skr_lobby_hint: "Everyone holds their cards on their own phone, and every hand lies face down in front of you. Every swap and peek shows which card went where.",
      skr_lobby_wait: "The host is picking the version",
      skr_ed_line_classic: "The standard deck: numbers, peeks, swaps, basra, all around",
      skr_ed_line_general: "Every card from every version",
      skr_ed_line_custom: "Pick the add-ons yourself",
      skr_base_always: "The standard cards are always in",
      skr_edition: "Version",
      skr_deck_size: "{n} cards",
      skr_two_decks: "two decks",
      skr_one_deck: "one deck",
      skr_teams: "Partners (two teams)",
      skr_teams_hint: "For 4, 6 or 8 players; partners sit alternately",
      skr_rounds: "Rounds",
      skr_screw_lap: "Screw allowed from lap",
      skr_clock: "Turn clock",
      skr_clock_off: "Off",
      skr_tv_memorize: "Everyone memorises their bottom two cards",
      screw_who_finished: "Did anyone run out of cards?",
      screw_thief_accused: "Who did the table accuse?",
      screw_need_accused: "Pick who the table accused (or no thief)",
      screw_finished: "Out of cards: 0",
      screw_thief_stole: "The thief stole the lowest score",
      screw_thief_victim: "The thief stole this lowest score: +25",
      skr_h_deck: "🆕 From the deck",
      skr_h_khoshaf: "🆕 From the Khoshaf",
      skr_h_pile: "⬆️ {card} from the pile",
      skr_h_pile_plain: "⬆️ From the pile",
      skr_h_penalty: "➕ A penalty card",
      skr_h_swap: "🔄 From {ref}",
      skr_h_now: "just now",
      skr_h_ago_1: "1 turn ago",
      skr_h_ago_2: "2 turns ago",
      skr_h_ago: "{n} turns ago",
      skr_h_ago_many: "{n} turns ago",
      skr_seat_take: "⬆️ {card} from the pile → {x}",
      skr_log_match_back: "❌ {a}: {x} ({card}) didn't match; it went back face down, and a penalty card joined the hand",
      skr_log_basra_back: "🗑️ {a}: {x} ({card}) can't be thrown; it went back face down",
      skr_log_pong_back: "❌ {a}: {x} ({card}) wasn't Pong; it went back face down, and a penalty card joined the hand",
      skr_log_finish: "🏁 {a} is out of cards: the round is over",
      skr_log_last_lap: "💀 The deck is empty: one last turn each",
      skr_log_pass: "⏭️ {a} passed",
      skr_log_vote: "🗳️ {a} voted",
      skr_log_accuse_none: "🦹 The table accused nobody",
      skr_log_accuse_ok: "🦹 The table accused {b} ✓",
      skr_log_accuse_no: "🦹 The table accused {b} ✗",
      skr_protected_team: "On the caller's team; the hand is protected",
      skr_pick_whose: "{name}'s cards",
      skr_pick_who: "Pick a player",
      skr_last_lap: "Deck empty: last lap · {n} left",
      skr_sudden: "Sudden death",
      skr_guarded_team: "The caller's team is protected",
      skr_why_finish: "🏁 {name} is out of cards",
      skr_why_screw: "📣 {name} called Screw",
      skr_why_last_lap: "💀 The last lap is over",
      skr_voted_count: "Voted {n}/{m}",
      skr_vote_close: "Close the vote",
      skr_vote_yours: "Your vote: {name}",
      skr_vote_done: "Your vote is in",
      skr_vote_change: "Change your vote",
      skr_vote_tie: "A tie: the caller's vote decides.",
      skr_vote_hint: "If most point at the holder: +25 for the thief. If not, the thief takes the lowest score and whoever had it takes +25.",
      skr_vote_resend: "Change my vote",
      skr_vote_send: "Vote",
      skr_vote_change_hint: "You can change it until the vote closes",
      skr_screw_last_lap: "No Screw in the last lap",
      skr_deck_empty_hint: "The deck is empty: take from the pile, throw a match, or pass",
      skr_pass: "Pass",
      skr_thief_nobody: "🦹 No thief: nobody held the card",
      skr_thief_caught_by: "🦹 The table caught the thief: {name} +25",
      skr_thief_stole: "🦹 The thief, {name}, stole the lowest score ({score}); {victims} +25",
      skr_thief_unnoticed: "🦹 Nobody caught the thief, {name}, who already had the lowest score",
      skr_votes_none: "🗳️ No votes: nobody was accused",
      skr_accused: "👉 The table accused: {name}",
      skr_vote_pair: "{a} → {b}",
      skr_thief_was: "The thief was…",
      skr_votes_title: "The votes",
      skr_no_cards: "No cards",
      skr_finish_line_team: "🏁 {name} ran out of cards: the round is over and {name}'s team scores 0",
      skr_finish_line: "🏁 {name} ran out of cards: the round is over and {name} scores 0",
      skr_double_calc: "📣 {name}'s Screw failed: {calc}",
      skr_basra_count: "Basra cards",
      skr_basra_hint: "4 in the standard deck, 2 in the first print",
      skr_memo_time: "Time to memorise",
      skr_secs: "{n}s",
      skr_memo_tap: "On a tap",
      skr_sudden_hint: "When the deck runs out, everyone gets one last turn, then the reveal. Off: the pile is shuffled into a new deck and play goes on.",
      skr_memory_help: "Memory helper",
      skr_memory_hint: "For kids or a casual table: every card keeps where it came from and who has seen it, and each seat its last move. Off, remembering is up to you.",
      skr_band_screw: "📣 Screw! Last lap",
      skr_band_last_lap: "The deck is empty: last lap",
      skr_band_round_over: "The round is over",
      skr_h_scream_deal: "😱 Dealt again after the scream",
      skr_log_scream_deal: "😱 {a}: Oscar's scream! The cards were gathered, shuffled and dealt out again face down ({n})",
      skr_log_scream_deal_all: "😱 Oscar's scream: the cards were gathered, shuffled and dealt out again face down ({n})",
      skr_log_boom_all: "💣 {a}: Boom! Everyone else throws one of their own cards",
      skr_log_boom_pick: "💣 {a} picked a card",
      skr_log_boom_throw: "💥 {x} ({card}) flew onto the pile",
      skr_boom_pick: "💣 Boom! Pick one of your cards to throw on the pile",
      skr_boom_from: "💣 Boom from {name}: everyone throws a card",
      skr_after_boom: "💣 After Boom: {name}'s turn again",
      skr_after_scream: "😱 After the scream: {name}'s turn again",
      skr_plays_itself: "This card plays itself",
      skr_boom_go: "Boom!",
      skr_boom_picked: "Picked {n}/{m}",
      skr_boom_close: "Go on without the rest",
      skr_boom_done: "Picked - waiting for the others",
      skr_your_turn_again: "Your turn again!",
      skr_band_boom: "Boom! Everyone throws one of their own cards",
      skr_boom_lucky: "Lucky escape",
      skr_power_boom_all: "Every other player picks one of their own face-down cards to throw on the pile; then it is your turn again",
      skr_power_scream_deal: "Every hand is gathered, shuffled and dealt out again face down, the same number each; then it is your turn again",
      skr_log_steal: "🦹 {a} plays the thief to steal: a look at {x}",
      skr_log_steal_swap: "🦹 {a} stole {y} for {x}",
      skr_pick_match_team: "Pick one of your cards, or your partner's, that matches the pile",
      skr_power_steal: "Pick another player's card to look at; then it is swapped, like it or not, for one of yours",
      skr_steal_of: "🦹 {name} is stealing {x}",
      skr_steal_btn: "Steal with it",
      skr_steal_pile_btn: "Steal with the thief on the pile",
      skr_thief_steal: "The thief's steal",
      skr_thief_steal_hint: "The thief, when drawn or on top of the pile, can be played at once: look at someone's card and swap it, like it or not, for one of yours",
      skr_team_basra: "Team basra",
      skr_team_basra_hint: "On your turn you may throw one of your partner's cards if it matches the pile; if it doesn't, the penalty card is yours",
      skr_replay: "↺ See again",
      skr_replay_hint: "Plays that move again on your phone only",
    }
  },
  rules: {
    ar: {
      screw: `
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li>كل واحد معاه 4 كروت مقلوبة، وفي الأول بيشوف الكارتين اللي تحت بس (التالت والرابع). الهدف أقل مجموع في آخر الجولات.</li>
                <li>في دورك حاجة واحدة: تسحب من الورق، أو تاخد الكارت اللي فوق على الأرض، أو ترمي كارت زيه من إيدك، أو تقول <b>سكرو</b>.</li>
                <li>بعد سكرو كل واحد تاني بياخد دور أخير، وبعدها الكروت تتكشف وتتحسب. واللي يخلّص كروته قبل الكل بيقفل الجولة على طول.</li>
                <li>أقل مجموع ياخد <b>صفر</b>. اللي قال سكرو وحد غلبه، مجموعه <b>بيتضاعف</b>.</li>
                <li><b>↺ شوف تاني</b> جنب آخر حركة فوق الترابيزة: بيعيد رسمة الحركة دي على موبايلك إنت بس. آخر حركة بس، ومن غير ما يكشف أي كارت ما اتكشفش.</li>
            </ol>
            <details class="help-more">
                <summary>🃏 الكروت وقيمتها</summary>
                <ul class="list-disc list-inside space-y-1 text-xs">
                    <li><b>1 لـ 6</b>: بقيمتها، 4 من كل رقم.</li>
                    <li><b>7 و8</b>: بص على كارت من كروتك. <b>9 و10</b>: بص على كارت حد تاني. بقيمتهم، 4 من كل واحد.</li>
                    <li><b>خد وهات</b> (4): بدّل كارت منك بكارت من عند حد تاني من غير ما حد يشوف.</li>
                    <li><b>بصرة</b> (4، و2 في الطبعة الأولى): ارمي كارت من كروتك على الأرض.</li>
                    <li><b>كعب داير</b> (2): بص على كارت من كل لاعب، أو على كارتين من كروتك.</li>
                    <li><b><bdi dir="ltr">+20</bdi></b> (4) و<b>السكرو الأحمر</b> (2، بـ 25): كروت عقاب، بتتحسب عليك لو فضلت في إيدك. زي أي كارت: لما تسحبها ترميها أو تدخّلها إيدك (عشان ترميها على كارت زيها بعدين). السكرو الأحمر والأخضر نوع واحد: أي سكرو يترمي على أي سكرو، أحمر على أخضر أو أخضر على أحمر أو زيه.</li>
                    <li><b>السكرو الأخضر</b> (2، بصفر) و<b><bdi dir="ltr">−1</bdi></b> (1، بسالب واحد): أحسن كروت تحتفظ بيها.</li>
                    <li>كارت الأوامر بيشتغل بس لو اتسحب من الورق واترمى على طول. لو اتاخد من الأرض أو فضل في الإيد مالوش قوة، ويتحسب 10 (إلا 7 و8 و9 و10 بقيمتهم).</li>
                </ul>
            </details>
            <details class="help-more">
                <summary>🎯 دورك</summary>
                <ul class="list-disc list-inside space-y-1 text-xs">
                    <li><b>تسحب من الورق</b>: الكارت ليك لوحدك. تحطه مكان كارت من كروتك (والقديم يترمي مكشوف على الأرض)، أو ترميه، ولو كارت أوامر ترميه وتستعمل قوته أو لأ.</li>
                    <li><b>تاخد من الأرض</b>: الكارت اللي فوق يدخل مكان كارت من كروتك، والقديم يترمي مكانه. من غير قوة.</li>
                    <li><b>ترمي كارت زيه</b> في دورك بس: كارت من إيدك بنفس قيمة اللي فوق (أو نفس الكارت). صح: يطلع من إيدك. غلط: الكل بيشوفه، ويرجع مكانه مقلوب، وتسحب كارت عقاب من الورق في خانة جديدة (4 تبقى 5) من غير ما تبص عليه.</li>
                    <li><b>سكرو</b>: بيخلّص دورك، وكروتك بتبقى محمية. في التطبيق بيبقى مسموح من اللفة اللي المضيف اختارها.</li>
                    <li>كروت بتمشي لوحدها: <b>الحرامي</b> و<b>بونج</b> بيدخلوا الإيد، و<b>بينج</b> و<b>المسحراتي</b> بيتلعبوا أول ما يتسحبوا. غير كده كل كارت زي التاني: ترميه أو تخليه.</li>
                </ul>
            </details>
            <details class="help-more">
                <summary>📣 نهاية الجولة: كل الحالات</summary>
                <ul class="list-disc list-inside space-y-1 text-xs">
                    <li><b>سكرو</b>: كل لاعب تاني ياخد دور واحد أخير، ومحدش يقدر يقول سكرو تاني. كروت اللي قال سكرو (وفي الفرق كروت فريقه كله) محدش يقدر يبدّلها أو ياخد منها أو يديله أو يفجّرها أو يضربها بالمدفع أو الصرخة (البص عليها مسموح).</li>
                    <li><b>حد خلّص كروته</b> (آخر كارت معاه اترمى): الجولة بتقف حالاً للكل، حتى في وسط اللفة الأخيرة بعد سكرو. مفيش أدوار تانية ولا سكرو.</li>
                    <li><b>المسحراتي</b>: سكرو إجباري حالاً والكروت تتكشف من غير لفة أخيرة، واللي سحبه يتحسب هو اللي قال سكرو. لو حد كان قال سكرو قبله، الأدوار الأخيرة بتقف والكشف حالاً، واللي قال سكرو الأول يفضل هو.</li>
                    <li><b>الورق خلص</b>: الكارت اللي فوق على الأرض يفضل، والباقي يتخلط ويبقى ورق جديد، واللعب يكمّل عادي.</li>
                    <li><b>موت مفاجئ</b> (اختيار في التطبيق): أول ما آخر كارت يتسحب، كل واحد ياخد دور أخير (من غير سحب من الورق)، وبعدها الكشف.</li>
                </ul>
            </details>
            <details class="help-more">
                <summary>🧮 الحساب والأمثلة</summary>
                <ul class="list-disc list-inside space-y-1 text-xs">
                    <li>كل واحد يجمع كروته. أقل مجموع ياخد <b>صفر</b>، والباقي مجموعهم.</li>
                    <li><b>اللي قال سكرو</b> ومجموعه أقل من الكل أو <b>قد أقل واحد</b>: ياخد صفر، واللي عادله ياخد مجموعه عادي.</li>
                    <li><b>اللي قال سكرو وحد غلبه</b>: مجموعه بيتضاعف حتى لو سالب (<bdi dir="ltr">−1</bdi> تبقى <bdi dir="ltr">−2</bdi>، وده لمصلحته)، وأقل واحد في الباقيين ياخد صفر. في الفرق إيد اللي قال سكرو بس هي اللي بتتضاعف، وبعدين تتجمع مع إيد صاحبه.</li>
                    <li><b>اللي خلّص كروته</b>: ياخد صفر ويكسب الجولة حتى على مجموع سالب، حتى لو كارت حد تاني (زي بوم) هو اللي خلّص كروته. الباقي مجموعهم، واللي قال سكرو (لو مش هو) مجموعه بيتضاعف.</li>
                    <li>بعد آخر جولة، <b>أقل مجموع كلي يكسب</b>.</li>
                </ul>
                <p class="help-sub">أمثلة</p>
                <ul class="list-disc list-inside space-y-1 text-xs">
                    <li>سكرو بـ 3 وأقل واحد تاني 5: اللي قال صفر، والتاني 5.</li>
                    <li>سكرو بـ 4 وواحد تاني 4: اللي قال صفر، والتاني 4.</li>
                    <li>سكرو بـ 6 وواحد تاني 2: اللي قال 12، والتاني صفر.</li>
                    <li>سكرو بـ <bdi dir="ltr">−1</bdi>، وحد خلّص كروته في دوره الأخير: اللي خلّص صفر، واللي قال <bdi dir="ltr">−2</bdi>.</li>
                </ul>
            </details>
            <details class="help-more">
                <summary>🦹 الحرامي</summary>
                <ul class="list-disc list-inside space-y-1 text-xs">
                    <li>كارت <b>الحرامي</b> بيتحط في الإيد ويفضل مستخبي لآخر الجولة، واللي معاه يحاول يبان إن مجموعه قليل.</li>
                    <li>لما الجولة تخلص وقبل الكشف، <b>كل واحد يصوّت</b>: مين معاه الحرامي، أو مفيش حرامي. الأغلبية تحكم، ولو اتعادلوا صوت اللي قال سكرو يحسم.</li>
                    <li><b>الحرامي اتمسك</b>: ياخد <bdi dir="ltr">+25</bdi>، وأقل واحد يفضل بنتيجته.</li>
                    <li><b>الحرامي هرب</b>: ياخد أقل نتيجة على الترابيزة، واللي كانت معاه أقل نتيجة ياخد <bdi dir="ltr">+25</bdi> بداله (ولو أكتر من واحد، كلهم).</li>
                    <li>مع كوتشينتين بيفضل حرامي واحد بس.</li>
                    <li>ومعاه: <b>خد بس</b> (تدّي كارت من كروتك لحد من غير ما تاخد منه، ومحدش يشوفه) و<b>شوف وبدّل</b> (تبص على كارت حد، وتبدّله بكارت من عندك لو عايز).</li>
                </ul>
            </details>
            <details class="help-more">
                <summary>🤝 صاحب صاحبه (فرق)</summary>
                <ul class="list-disc list-inside space-y-1 text-xs">
                    <li>فريقين بالتبادل في القعدة: اتنين ضد اتنين، أو تلاتة ضد تلاتة، أو أربعة ضد أربعة. نتيجة الفريق مجموع لاعيبته، ومحدش يبص على كروت صاحبه إلا بكارت.</li>
                    <li><b>بينج</b>: بيتلعب أول ما يتسحب، واللي بعدك (من الفريق التاني) دوره يروح، فالدور يروح لصاحبك.</li>
                    <li><b>بونج</b>: بيتحط في الإيد. بعد بينج على طول، اللي عليه الدور يقدر يرميه: صح يطلع من إيده، غلط ياخد كارت عقاب. ولو فضل في الإيد بـ 10.</li>
                    <li><b>على كيفك</b>: كارت بيقلّد. لما ترميه، تشاور على <b>كارت أوامر مرمي على الأرض</b> وتقول «هقلّد الكارت ده» — ويشتغل بقوته هو. مش هتقدر تطلع قوة من تحت الأرض: بتقلّد اللي الترابيزة شافته نزل بس. ولو الأرض لسه مفيهاش أي كارت أوامر (أول دور مثلاً)، الكارت مش ميّت: بيترمي <b>بصرة</b> عادية — ترمي بيه كارت من كروتك عشان تقلّل إيدك.</li>
                    <li>فردي من غير فرق كمان مسموح في أي إصدار، من 2 لـ 12.</li>
                </ul>
            </details>
            <details class="help-more">
                <summary>🥁 المسحراتي</summary>
                <ul class="list-disc list-inside space-y-1 text-xs">
                    <li><b>المسحراتي</b>: سكرو إجباري حالاً، والكروت تتكشف من غير لفة أخيرة.</li>
                    <li><b>المدفع</b>: تختار لاعب، وكروته تتكشف للكل لحد آخر الجولة.</li>
                    <li><b>الخشاف</b>: تشوف أول 4 كروت في الورق وتاخد واحد منهم، والتلاتة التانيين يرجعوا تحت الورق. الكارت اللي اخترته كأنك سحبته: تحطه في إيدك، أو ترميه، ولو كارت أوامر ترميه وتستعمل قوته.</li>
                </ul>
            </details>
            <details class="help-more">
                <summary>😱 أوسكار</summary>
                <ul class="list-disc list-inside space-y-1 text-xs">
                    <li><b>الكارتين دول بيشتغلوا لوحدهم</b>: أول ما تسحب بوم أو صرخة أوسكار من الورق بيشتغلوا على طول — مش هتقدر تخليهم في إيدك ولا تعدّي قوتهم.</li>
                    <li><b>صرخة أوسكار</b>: كروت كل اللاعيبة بتتلم وتتخلط وتتوزّع تاني مقلوبة، كل واحد بنفس عدد كروته، ومحدش يعرف أي كارت جاله: اللي كنت حافظه راح. كروت اللي قال سكرو (وفريقه) بتفضل مكانها. وبعدها اللي لعبها ياخد دور كامل تاني.</li>
                    <li><b>بوم</b>: كل لاعب تاني (غير اللي لعبه، وغير فريق اللي قال سكرو) يختار كارت من كروته ويترمي على الأرض مكشوف، أي كارت كان، حتى السكرو الأحمر أو الحرامي (نجا منه). ولو إيد حد فضيت، الجولة بتخلص. وبعدها اللي لعبه ياخد دور كامل تاني.</li>
                    <li><b>اللايف جاكيت</b>: مالوش قيمة لوحده، بيتحسب زي أحسن (أقل) كارت في نفس الإيد، فجنب <bdi dir="ltr">−1</bdi> يبقى <bdi dir="ltr">−1</bdi> تاني. لو مفيش غيره في الإيد بـ 10.</li>
                </ul>
            </details>
            <details class="help-more">
                <summary>🏠 قواعد البيت (اختيارية)</summary>
                <ul class="list-disc list-inside space-y-1 text-xs">
                    <li>المضيف يقدر يشغّلها من الغرفة، وهي مقفولة من الأول.</li>
                    <li><b>🦹 سرقة الحرامي</b>: الحرامي لما يتسحب من الورق (أو من الخشاف) أو يكون فوق الأرض أول دورك، تقدر تلعبه على طول: تختار كارت من كروت أي لاعب تاني (غير فريق اللي قال سكرو) وتبص عليه لوحدك، وبعدها لازم تبدّله بكارت من عندك. الحرامي يترمي مكشوف ويطلع من الجولة، ومفيش تصويت على الحرامي في آخرها.</li>
                    <li><b>🤝 بصرة الفريق</b> (في الفرق بس): في دورك تقدر ترمي كارت من كروت صاحبك لو زي اللي على الأرض. صح: يطلع من إيده، ولو خلّص كروته الجولة بتخلص. غلط: الكارت يرجع مقلوب مكانه، وكارت العقاب ليك انت.</li>
                </ul>
            </details>
            <details class="help-more">
                <summary>👥 عدد اللاعبين والكوتشينة</summary>
                <ul class="list-disc list-inside space-y-1 text-xs">
                    <li>الكوتشينة العادية 59 كارت، و62 بكروت الحرامي. كوتشينة واحدة من 2 لـ 6 لاعبين، وأحسن عدد 4. مع 5 و6 الورق بيخلص بسرعة وبيتخلط أكتر من مرة.</li>
                    <li>من 7 لـ 12 التطبيق بيدبّل كروت الإصدار اللي بتلعبوه (بحرامي واحد).</li>
                    <li><b>العام</b>: كل الإصدارات مع بعض، أو اختار الإضافات بنفسك من <b>مخصص</b>.</li>
                </ul>
            </details>
            <details class="help-more">
                <summary>📱 كل واحد من موبايله</summary>
                <ul class="list-disc list-inside space-y-1 text-xs">
                    <li>التطبيق بيوزّع ويحسب. كروتك على موبايلك، وكروت الكل قدامك مقلوبة بالترتيب.</li>
                    <li>كل حركة بتبان للكل: مين بص على أنهي كارت، ومين بدّل كارت من عنده بكارت من عند مين، ومين ادّى كارت لمين، ومين اتفجّر كارته. قيم الكروت مستخبية إلا لو القواعد كشفتها.</li>
                    <li>المضيف بيختار الإصدار، وعدد كروت البصرة، والفرق، وعدد الجولات، ووقت الحفظ في أول كل جولة (لحد ما كل واحد يضغط، أو 5 أو 10 ثواني)، ومن أنهي لفة ينفع سكرو، ووقت الدور، والموت المفاجئ، ومساعد الذاكرة، وقواعد البيت. ويقدر يعدّي دور حد مش موجود، ويقفل تصويت الحرامي.</li>
                    <li>الذاكرة هي اللعبة: كل حركة بتبان وهي بتحصل (الكروت اللي اتحركت بتنوّر شوية)، وآخر 3 حركات مكتوبين، وبعد كده انت اللي بتفتكر. <b>مساعد الذاكرة</b> (اختيار) بيسيب على كل كارت حكايته: جه منين، ومين بص عليه، وقيمته لو الكل شافها.</li>
                </ul>
            </details>
            <details class="help-more">
                <summary>📺 التلفزيون</summary>
                <ul class="list-disc list-inside space-y-1 text-xs">
                    <li>الترابيزة كلها على الشاشة: الورق والأرض وكروت كل واحد مقلوبة، وكل حركة وهي بتحصل، وتصويت الحرامي، والنتيجة في آخر كل جولة.</li>
                </ul>
            </details>
            <details class="help-more">
                <summary>🧮 على الطاولة (بالكوتشينة الحقيقية)</summary>
                <ul class="list-disc list-inside space-y-1 text-xs">
                    <li>بتلعبوا بالكوتشينة الحقيقية، والتطبيق يحسب: بعد كل جولة اختار مين قال سكرو، ولو حد خلّص كروته، واكتب مجموع كل واحد. التطبيق بيطبّق الصفر والضعف.</li>
                    <li>شغّل <b>الحرامي</b> عشان تسجّل اتهام الترابيزة ومين كان معاه الحرامي فعلاً، و<b>صاحب صاحبه</b> للفرق.</li>
                    <li>كتبت غلط؟ <b>رجّع آخر جولة</b>، أو افتح أي جولة اتسجّلت وعدّلها.</li>
                </ul>
            </details>`,
    },
    en: {
      screw: `
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li>Everyone has four face-down cards and, at the start, looks only at the bottom two (the third and fourth). The aim is the lowest total after the last round.</li>
                <li>On your turn, one thing: draw from the deck, take the top card of the pile, throw a matching card from your hand, or call <b>Screw</b>.</li>
                <li>After Screw everyone else gets one last turn, then the cards are shown and counted. A player who gets rid of every card ends the round at once.</li>
                <li>The lowest total scores <b>zero</b>. A caller who is beaten has their total <b>doubled</b>.</li>
                <li><b>↺ See again</b> beside the latest move at the top of the table plays that move again on your phone only. The latest move only, and it never shows a card that wasn't shown.</li>
            </ol>
            <details class="help-more">
                <summary>🃏 The cards and their values</summary>
                <ul class="list-disc list-inside space-y-1 text-xs">
                    <li><b>1 to 6</b>: their face value, four of each.</li>
                    <li><b>7 and 8</b>: look at one of your cards. <b>9 and 10</b>: look at someone else's. Face value, four of each.</li>
                    <li><b>Blind swap</b> (4): swap one of your cards with someone else's without anyone seeing.</li>
                    <li><b>Basra</b> (4, or 2 in the first print): throw one of your cards on the pile.</li>
                    <li><b>All around</b> (2): look at one card of every player, or at two of yours.</li>
                    <li><b>+20</b> (4) and the <b>red screw</b> (2, worth 25): penalty cards, counted against you if they stay in your hand. Like any card, a drawn one is thrown or swapped into your hand (to throw it on a match later). The two screws are one kind: either goes on either, red on green, green on red, or the same colour.</li>
                    <li>The <b>green screw</b> (2, worth zero) and <b>−1</b> (1): the best cards to keep.</li>
                    <li>An action card only works when drawn from the deck and thrown straight away. Taken from the pile or left in a hand it does nothing and counts 10 (7, 8, 9 and 10 count their face).</li>
                </ul>
            </details>
            <details class="help-more">
                <summary>🎯 Your turn</summary>
                <ul class="list-disc list-inside space-y-1 text-xs">
                    <li><b>Draw from the deck</b>: only you see it. Put it in place of one of your cards (the old one goes face up on the pile), or throw it; an action card thrown this way may use its power.</li>
                    <li><b>Take from the pile</b>: the top card replaces one of yours, and the old one goes on the pile. No power.</li>
                    <li><b>Throw a matching card</b>, on your own turn only: a card from your hand with the same value as the top card (or the same card). Right: it leaves your hand. Wrong: everyone sees it, it goes back face down where it was, and you draw a penalty card from the deck into a new slot (4 cards become 5) without looking at it.</li>
                    <li><b>Screw</b>: ends your turn, and your cards are protected. In the app it is allowed from the lap the host picked.</li>
                    <li>Cards with a mind of their own: <b>the Thief</b> and <b>Pong</b> go into your hand, and <b>Ping</b> and <b>El-Mesaharaty</b> play themselves as soon as they are drawn. Every other card is the same: throw it or keep it.</li>
                </ul>
            </details>
            <details class="help-more">
                <summary>📣 How a round ends: every case</summary>
                <ul class="list-disc list-inside space-y-1 text-xs">
                    <li><b>Screw</b>: every other player gets one last turn, and nobody can call Screw again. Nobody can swap, take, give to, blow up, fire the cannon at or scream away the caller's cards (in teams, the whole team's); looking is allowed.</li>
                    <li><b>Someone runs out of cards</b> (their last card thrown): the round stops at once for everyone, even in the middle of the last turns after Screw. No more turns, no Screw.</li>
                    <li><b>El-Mesaharaty</b>: a forced Screw on the spot; the cards are shown without a last lap, and whoever drew it counts as the caller. If someone had already called Screw, the last turns stop and the cards are shown at once, and the first caller stays the caller.</li>
                    <li><b>The deck runs out</b>: the top card of the pile stays, the rest is shuffled into a new deck, and play goes on.</li>
                    <li><b>Sudden death</b> (an option in the app): as soon as the last card is drawn, everyone gets one last turn (no drawing from the deck), then the reveal.</li>
                </ul>
            </details>
            <details class="help-more">
                <summary>🧮 Scoring, with examples</summary>
                <ul class="list-disc list-inside space-y-1 text-xs">
                    <li>Everyone adds up their cards. The lowest total scores <b>zero</b>, everyone else their total.</li>
                    <li>A <b>caller</b> lower than everyone or <b>equal to the lowest</b>: scores zero, and the player who tied keeps their own total.</li>
                    <li>A <b>caller who is beaten</b>: their total is doubled, even a negative one (−1 becomes −2, in their favour), and the lowest of the others scores zero. In teams only the caller's own hand is doubled, then added to the partner's.</li>
                    <li>A player who <b>runs out of cards</b>: scores zero and wins the round even against a negative total, even when someone else's card (such as Boom) emptied the hand; everyone else their total, and the caller (if someone else) is doubled.</li>
                    <li>After the last round, the <b>lowest overall total wins</b>.</li>
                </ul>
                <p class="help-sub">Examples</p>
                <ul class="list-disc list-inside space-y-1 text-xs">
                    <li>Screw on 3, the next lowest has 5: the caller 0, the other 5.</li>
                    <li>Screw on 4, another player has 4: the caller 0, the other 4.</li>
                    <li>Screw on 6, another player has 2: the caller 12, the other 0.</li>
                    <li>Screw on −1, and someone runs out of cards on their last turn: that player 0, the caller −2.</li>
                </ul>
            </details>
            <details class="help-more">
                <summary>🦹 The Thief</summary>
                <ul class="list-disc list-inside space-y-1 text-xs">
                    <li>The <b>Thief</b> card is kept in a hand and stays hidden until the round ends; whoever holds it tries to look like their total is low.</li>
                    <li>When the round ends, before the reveal, <b>everyone votes</b>: who holds the thief, or no thief. The majority decides, and a tie goes the caller's way.</li>
                    <li><b>The thief is caught</b>: they take +25, and the lowest keeps their score.</li>
                    <li><b>The thief gets away</b>: they take the lowest score at the table, and whoever had it takes the +25 instead (all of them, if several).</li>
                    <li>With two decks there is still only one thief.</li>
                    <li>It comes with <b>Give</b> (give one of your cards to someone and take nothing back, unseen) and <b>See &amp; swap</b> (look at someone's card and swap it with one of yours if you like).</li>
                </ul>
            </details>
            <details class="help-more">
                <summary>🤝 Partners (teams)</summary>
                <ul class="list-disc list-inside space-y-1 text-xs">
                    <li>Two sides alternating round the table: two against two, three against three or four against four. A team scores its players' totals added, and nobody looks at a partner's cards without a card that allows it.</li>
                    <li><b>Ping</b>: plays itself when drawn, and the next player (from the other side) loses their turn, so it passes to your partner.</li>
                    <li><b>Pong</b>: kept in a hand. Right after a Ping, the player whose turn it is can throw it: right, it leaves their hand; wrong, a penalty card. Left in a hand it counts 10.</li>
                    <li><b>As you like</b>: a mimic. When you throw it, point at a <b>command card already lying on the pile</b> and say "I'm copying that one" — and it runs that card's power. You cannot pull a power out of thin air: you can only copy what the table has watched go down. And if the pile holds no command card yet (turn one, say), the card is not dead: it goes down as a plain <b>Basra</b> — throw one of your own cards with it to make your hand smaller.</li>
                    <li>Every version can also be played alone, 2 to 12 players.</li>
                </ul>
            </details>
            <details class="help-more">
                <summary>🥁 El-Mesaharaty</summary>
                <ul class="list-disc list-inside space-y-1 text-xs">
                    <li><b>El-Mesaharaty</b>: a forced Screw on the spot; the cards are shown without a last lap.</li>
                    <li><b>The Cannon</b>: pick a player; their cards are face up for everyone until the round ends.</li>
                    <li><b>Khoshaf</b>: see the top four cards of the deck and take one; the other three go under the deck. The card you take counts as drawn: keep it, throw it, or throw an action card and use its power.</li>
                </ul>
            </details>
            <details class="help-more">
                <summary>😱 Oscar</summary>
                <ul class="list-disc list-inside space-y-1 text-xs">
                    <li><b>These two play themselves</b>: the moment you draw Boom or Oscar's scream from the deck it fires — you cannot keep it in your hand and you cannot skip its power.</li>
                    <li><b>Oscar's scream</b>: everyone's cards are gathered, shuffled and dealt back face down, each player getting as many as they had, and nobody knows which card they got: whatever you memorised is gone. The caller's cards (and their team's) stay where they are. Then whoever played it takes a whole new turn.</li>
                    <li><b>Boom</b>: every other player (not whoever played it, and not the caller's side) picks one of their own cards and it goes onto the pile face up, whatever it is, even the red screw or the thief (a lucky escape). If a hand runs out, the round ends. Then whoever played it takes a whole new turn.</li>
                    <li><b>Life jacket</b>: no value of its own; it counts as the best (lowest) card in the same hand, so next to a −1 it is a second −1. Alone in a hand it counts 10.</li>
                </ul>
            </details>
            <details class="help-more">
                <summary>🏠 House rules (optional)</summary>
                <ul class="list-disc list-inside space-y-1 text-xs">
                    <li>The host can turn them on in the room; they start off.</li>
                    <li><b>🦹 The thief's steal</b>: when the thief is drawn from the deck (or picked with Khoshaf), or is on top of the pile as your turn starts, you can play it at once: pick a card of any other player (not the caller's side), look at it alone, then you must swap it with one of yours. The thief goes face up onto the pile and is out for the round, so there is no thief vote at the end.</li>
                    <li><b>🤝 Team basra</b> (teams only): on your turn you can throw one of your partner's cards if it matches the pile. Right: it leaves their hand, and if that was their last card the round ends. Wrong: it goes back face down where it was, and the penalty card is yours.</li>
                </ul>
            </details>
            <details class="help-more">
                <summary>👥 Players and decks</summary>
                <ul class="list-disc list-inside space-y-1 text-xs">
                    <li>The standard deck is 59 cards, 62 with the Thief's cards. One deck for 2 to 6 players, four being the best. With 5 or 6 the deck runs out fast and is reshuffled more than once.</li>
                    <li>From 7 to 12 the app doubles the cards of the version you play (with one thief).</li>
                    <li><b>General</b>: every version together, or pick the add-ons yourself with <b>Custom</b>.</li>
                </ul>
            </details>
            <details class="help-more">
                <summary>📱 Everyone on their own phone</summary>
                <ul class="list-disc list-inside space-y-1 text-xs">
                    <li>The app deals and scores. Your cards are on your phone, and everyone's hand lies face down in front of you, in order.</li>
                    <li>Every move is shown to all: who looked at which card, who swapped which of their cards with which of whose, who gave a card to whom, whose card was blown up. Values stay hidden unless the rules show them.</li>
                    <li>The host picks the version, the number of basra cards, teams, the number of rounds, the memorising time at the start of each round (until everyone taps, or 5 or 10 seconds), from which lap Screw can be called, the turn clock, sudden death, the memory helper and the house rules, and can skip someone who is away or close the thief vote.</li>
                    <li>Memory is the game: every move shows as it happens (the cards involved light up for a moment), the last 3 moves are written down, and after that it is up to you. The <b>memory helper</b> (an option) leaves every card its story: where it came from, who has looked at it, and its value if the whole table saw it.</li>
                </ul>
            </details>
            <details class="help-more">
                <summary>📺 The TV</summary>
                <ul class="list-disc list-inside space-y-1 text-xs">
                    <li>The whole table on the screen: the deck, the pile, everyone's face-down cards, every move as it happens, the thief vote, and the score after each round.</li>
                </ul>
            </details>
            <details class="help-more">
                <summary>🧮 At the table (real cards)</summary>
                <ul class="list-disc list-inside space-y-1 text-xs">
                    <li>Play with real cards and let the app count: after each round pick who called Screw and whether someone ran out of cards, and enter everyone's total. The app applies the zero and the doubling.</li>
                    <li>Turn on <b>The Thief</b> to record the table's accusation and who really held it, and <b>Partners</b> for teams.</li>
                    <li>A wrong entry? <b>Take back the last round</b>, or open any saved round and fix it.</li>
                </ul>
            </details>`,
    }
  }
});
