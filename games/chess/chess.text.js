/* chess: the words only this game's screens show, and its rules (Help, the
   first-play card). The build puts them into TRANSLATIONS and GAME_RULES (tools/game-text.cjs):
   read them as t.<key> and GAME_RULES[lang].<id>, as everywhere. */
gameText({
  translations: {
    ar: {
      chpz_try_as_puzzle: "جرّبها كلغز",
      ch_arma_won: "تعادل، والتعادل في الأرماجدون للأسود: {name} كسب",
      ch_arma_tag: "أرماجدون: التعادل للأسود",
      ch_replay_tag: "إعادة بالألوان معكوسة",
      ch_clock_hint: "دقايق لكل لاعب + ثواني بتتزوّد بعد كل نقلة. اللي وقته يخلص يخسر، إلا لو التاني مامعهوش حاجة تعمل كش مات: تعادل.",
      ch_variant_hint: "شطرنج 960 (فيشر): كل دور رقعة بداية جديدة، الحجارة اللي ورا متلخبطة والعساكر زي ما هي.",
      ch_var_hq: "الوزير المستخبي",
      ch_variant_hint_hq_room: "قبل أول نقلة كل لاعب يختار عسكري من عساكره يبقى وزير مستخبي: يتحرك زي العسكري، أو زي الوزير فيتكشف. محدش يعرفه غير صاحبه.",
      ch_hq_no_tour: "الوزير المستخبي مش في البطولة: اقفل البطولة عشان تختاره.",
      ch_unrated_hq: "الوزير المستخبي",
      ch_hq_pick: "اختار العسكري اللي هيبقى وزيرك المستخبي",
      ch_hq_pick_hint: "دوس على عسكري من عساكرك، ودوس عليه تاني أو على الزرار. محدش هيعرفه غيرك.",
      ch_hq_pick_ok: "ده وزيري",
      ch_hq_picked: "اخترت {sq}. مستنيين التاني يختار.",
      ch_hq_waiting: "مستنيين {name} يختار الوزير المستخبي",
      ch_hq_pick_for: "اختار عسكري بدل {name}",
      ch_hq_reveal: "👑 وزير مستخبي!",
      ch_hq_was: "👑 كان الوزير!",
      ch_hq_end: "الوزير المستخبي كان:",
      ch_hq_how_hidden: "فضل مستخبي ({sq})",
      ch_hq_how_reveal: "اتكشف على {sq}",
      ch_hq_how_captured: "اتاكل وهو مستخبي على {sq}",
      ch_hq_how_promoted: "وصل الآخر واترقّى على {sq}",
      ch_odds_hint_friend: "اللي بيدّي فرق القوة بيبدأ ناقص الحجر ده (أو بنص الوقت).",
      ch_odds_none: "بدون",
      ch_odds_pawn: "عسكري",
      ch_odds_knight: "حصان",
      ch_odds_rook: "طابية",
      ch_odds_queen: "وزير",
      ch_odds_time: "نص الوقت",
      ch_odds_hint: "البطل اللي كسب الدور اللي فات بيبدأ ناقص قطعة (أو نص الوقت) ضد المتحدي الجديد.",
      ch_pill_960: "960",
      ch_pill_odds: "فرق قوة: بدون {piece}",
      ch_pill_odds_time: "فرق قوة: نص الوقت",
      ch_odds_by_me: "أنا",
      ch_odds_by_cpu: "الكمبيوتر",
      ch_odds_hint_local: "اللي بيدّي فرق القوة بيبدأ ناقص الحجر ده (أو بنص الوقت). الماتش ده مش بيتحسب في تقييمك.",
      ch_odds_time_noclock: "نص الوقت محتاج ساعة: اختار ساعة فوق.",
      ch_unrated_odds: "فيه فرق قوة",
      ch_undo: "تراجع",
      ch_rating_you: "تقييمك",
      ch_pos_endgames: "نهايات مشهورة",
      ch_pos_board: "اختار حجر من تحت ودوس على المربع، ودوس تاني عشان تشيله.",
      ch_pos_turn: "الدور على",
      ch_pos_castle: "التبييت",
      ch_pos_castle_wk: "الأبيض قصير",
      ch_pos_castle_wq: "الأبيض طويل",
      ch_pos_castle_bk: "الأسود قصير",
      ch_pos_castle_bq: "الأسود طويل",
      ch_pos_clear: "مسح",
      ch_pos_start: "الوضع الأصلي",
      ch_pos_eraser: "امسح حجر",
      ch_pos_play: "العب الوضع ده",
      ch_pos_you_play: "هتلعب ب{c}.",
      ch_pos_err_kings: "لازم يكون فيه ملك واحد بالظبط لكل لون.",
      ch_pos_err_pawns: "مينفعش عسكري في أول صف ولا في آخر صف.",
      ch_pos_err_check: "ملك اللي مش عليه الدور في كش: غيّر الدور أو حرّك الحجارة.",
      ch_pos_err_over: "الوضع ده خلصان من أوله: كش مات أو بات أو مفيش حجارة تكفي.",
      ch_eg_kq: "ملك ووزير ضد ملك",
      ch_eg_kq_line: "اكسب: زق الملك للحافة واعمل كش مات، وخلي بالك من البات.",
      ch_eg_kr: "ملك وطابية ضد ملك",
      ch_eg_kr_line: "اكسب: الطابية بتقفل على الملك صف ورا صف، وملكك بيساعد.",
      ch_eg_kp: "ملك وعسكري ضد ملك",
      ch_eg_kp_line: "اكسب: خلي ملكك قدام العسكري وخد المعارضة لحد ما يترقى.",
      ch_eg_bb: "فيلين ضد ملك",
      ch_eg_bb_line: "اكسب: الفيلين جنب بعض بيحاصروا الملك لحد الزاوية.",
      ch_eg_bn: "فيل وحصان ضد ملك",
      ch_eg_bn_line: "أصعب كش مات بسيط: ودّي الملك للزاوية اللي بلون الفيل.",
      ch_eg_lucena: "طابية وعسكري ضد طابية (لوسينا)",
      ch_eg_lucena_line: "اكسب: اعمل «كوبري» بطابيتك يحمي ملكك من الكش، وبعدين رقّي العسكري.",
      ch_eg_philidor: "وضع فيليدور",
      ch_eg_philidor_line: "دافع: خلي طابيتك في الصف التالت من ناحيتك، ولما العسكري يطلعله انزل بيها لآخر الرقعة وادّي كش من ورا. تعادل.",
      ch_eg_race: "سباق عساكر (دراسة ريتي)",
      ch_eg_race_line: "اتعادل: ملكك يجري ورا عسكري التاني ويسند عسكرك في نفس الوقت.",
      ch_char_custom: "مخصص",
      ch_char_suggest: "على قد مستواك: {name}",
      ch_rating_n: "{n} ماتش محسوب",
      ch_rating_now: "تقييمك بقى {r}",
      ch_rated_yes: "✅ الماتش ده محسوب في تقييمك",
      ch_rated_no: "مش محسوب في تقييمك: {why}",
      ch_unrated_help: "التلميح/التراجع مفتوح",
      ch_unrated_warn: "تنبيه المدرب مفتوح",
      ch_unrated_setup: "وضع مخصوص",
      ch_unrated_practice: "تمرين",
      ch_unrated_friend: "اتنين على موبايل",
      ch_rated_abandon: "الماتش اللي فات هيتحسب خسارة في تقييمك. تبدأ ماتش جديد؟",
      ch_best_line: "فوزك لو لعبت:",
      ch_unrated_best: "أفضل الحركات مفتوحة",
      ch_history: "أدوارك اللي فاتت",
      ch_moves_n: "نقلة",
      ch_cpu: "الكمبيوتر ({elo})",
      ch_cpu_plain: "الكمبيوتر",
      ch_band_beginner: "مبتدئ",
      ch_band_intermediate: "متوسط",
      ch_band_strong: "قوي",
      ch_band_expert: "خبير",
      ch_piece_k: "الملك",
      ch_piece_q: "الوزير",
      ch_piece_r: "الطابية",
      ch_piece_b: "الفيل",
      ch_piece_n: "الحصان",
      ch_piece_p: "العسكري",
      ch_gear: "الرقعة",
      ch_pieces_label: "القطع",
      ch_pieces_classic: "كلاسيك",
      ch_pieces_wood: "خشب",
      ch_style_green: "أخضر",
      ch_style_wood: "خشب",
      ch_style_blue: "أزرق",
      ch_style_marble: "رخام",
      ch_view_label: "الرقعة",
      ch_view_to3d: "رقعة ثلاثية الأبعاد",
      ch_view_to2d: "رقعة مسطحة",
      ch_cam_top: "من فوق",
      ch_cam_reset: "رجّع الكاميرا",
      ch_pen: "ارسم أسهم وعلامات",
      ch_pen_clear: "امسح الأسهم",
      ch_browse_label: "النقلات اللي فاتت",
      ch_browse_first: "أول الدور",
      ch_browse_back: "نقلة لورا",
      ch_browse_next: "نقلة لقدام",
      ch_browse_live: "ارجع للعبة",
      ch_browse_start: "بتتفرج على أول الدور",
      ch_browse_at: "بتتفرج على الحركة {n}",
      ch_browse_return: "ارجع للعبة",
      ch_share: "ابعت الدور",
      ch_share_pic: "صورة",
      ch_share_video: "فيديو",
      ch_share_making: "ثانية…",
      ch_share_acc: "الدقة",
      ch_pgn_copied: "الـPGN اتنسخ: الزقه في أي موقع شطرنج",
      ch_promote: "العسكري يبقى إيه؟",
      ch_no_moves: "لسه مفيش نقلات",
      ch_won: "اللي كسب: {name}",
      ch_resign_confirm: "متأكد إنك عايز تستسلم؟",
      ch_draw_agree: "تعادل",
      ch_draw_confirm: "اتفقتوا على تعادل؟",
      ch_flip: "لف الرقعة",
      ch_hint: "تلميح",
      ch_coach_wait: "المدرب بيبص على نقلتك…",
      ch_practice_note: "تمرين: بتكمّل من النقلة الأحسن ضد الكمبيوتر.",
      ch_better: "الأحسن:",
      ch_warn_generic: "النقلة دي بتخسّرك كتير.",
      ch_why_mate_in: "كش مات في {n}",
      ch_why_fork: "شوكة من {piece} على {sq}: هجوم على حاجتين مع بعض",
      ch_why_wins: "بتكسب {piece} ({san})",
      ch_why_wins_later: "بتكسب حجر بعدها بنقلة ولا اتنين ({san})",
      ch_why_saves: "بتبعد {piece} عن الخطر",
      ch_why_castle: "بتبيّت الملك في أمان",
      ch_why_develop: "بتطلّع {piece} يشتغل",
      ch_why_centre: "بتمسك نص الرقعة",
      ch_why_check: "كش على الملك",
      ch_why_improves: "بتحسّن مكان حجارتك",
      ch_why_sacrifice: "تضحية: بتدّي حجر عشان تكسب أكتر",
      ch_why_mate_allowed: "بتسيبه يعمل كش مات في {n} ({san})",
      ch_why_hang: "ممكن ياكلوا {piece} اللي على {sq} ({san})",
      ch_why_fork_allowed: "بتسمح بشوكة من {piece} على {sq}: هجوم على حاجتين ({san})",
      ch_why_pin_allowed: "هيتعمل تثبيت على {piece} اللي على {sq} ({san})",
      ch_why_loses: "بتخسر {piece} ({san})",
      ch_why_mate_missed: "كان فيه كش مات في {n}: {san}",
      ch_why_win_missed: "كنت تقدر تكسب حجر بـ {san}",
      ch_why_win_missed_piece: "كنت تقدر تاكل {piece} بـ {san}",
      ch_why_king_walk: "الملك اتحرك وضيّع التبييت",
      ch_why_queen_early: "الوزير طالع بدري وممكن يتطارد",
      ch_why_castle_better: "كان أحسن تبيّت ({san})",
      ch_why_develop_better: "كان أحسن تطلّع {piece} ({san})",
      ch_why_centre_better: "كان أحسن تمسك النص بـ {san}",
      ch_why_better: "{san} كانت أحسن",
      ch_why_book: "نقلة معروفة من افتتاح مدروس",
      ch_reviewing: "المراجعة… {p}%",
      ch_rv_engine_sf: "🐟 حلّلها Stockfish 19",
      ch_rv_why: "ليه؟",
      ch_rv_why_line: "اللي كان هيحصل:",
      ch_graph: "رسم التقييم",
      ch_rv_start: "أول الدور. اضغط ▶ عشان تمشي نقلة نقلة، أو اختار نقلة من تحت.",
      ch_rv_back: "رجوع",
      ch_rv_show_better: "وريني الأحسن",
      ch_rv_try: "جرّب الأحسن",
      ch_rv_keys: "اللحظات المهمة",
      ch_out_of_theory: "خرجت من النظرية في الحركة {n}",
      ch_key_turn: "منعطف",
      ch_key_missed: "فرصة ضاعت",
      ch_key_brilliant: "عبقرية",
      ch_offer: "اعرض تعادل",
      ch_offer_sent: "عرضت تعادل",
      ch_offer_to_you: "{name} بيعرض تعادل",
      ch_offer_made: "{name} عرض تعادل، مستني الرد",
      ch_accept: "موافق",
      ch_refuse: "لأ، نكمّل",
      ch_try_replace: "فيه ماتش شطرنج لسه ما خلصش. تجرّب الحركة الأحسن مكانه؟",
    },
    en: {
      chpz_try_as_puzzle: "Try it as a puzzle",
      ch_arma_won: "A draw, and in Armageddon a draw is Black's: {name} wins",
      ch_arma_tag: "Armageddon: a draw is Black's win",
      ch_replay_tag: "Replay with the colours swapped",
      ch_clock_hint: "Minutes each, plus seconds added after every move. Running out loses, unless the other side has nothing to mate with: then it's a draw.",
      ch_variant_hint: "Chess960 (Fischer Random): a new start every game, the back pieces shuffled, the pawns as usual.",
      ch_var_hq: "Hidden queen",
      ch_variant_hint_hq_room: "Before the first move each player picks one of their pawns to be a hidden queen: it moves like a pawn, or like a queen - and that reveals it. Only its owner knows which.",
      ch_hq_no_tour: "The hidden queen isn't played in a tournament: switch the tournament off to choose it.",
      ch_unrated_hq: "the hidden queen",
      ch_hq_pick: "Pick the pawn that will be your hidden queen",
      ch_hq_pick_hint: "Tap one of your pawns, then tap it again or the button. Nobody else will know.",
      ch_hq_pick_ok: "That's my queen",
      ch_hq_picked: "You picked {sq}. Waiting for the other to pick.",
      ch_hq_waiting: "Waiting for {name} to pick a hidden queen",
      ch_hq_pick_for: "Pick a pawn for {name}",
      ch_hq_reveal: "👑 A hidden queen!",
      ch_hq_was: "👑 That was the queen!",
      ch_hq_end: "The hidden queens were:",
      ch_hq_how_hidden: "still hidden ({sq})",
      ch_hq_how_reveal: "revealed on {sq}",
      ch_hq_how_captured: "taken while hidden on {sq}",
      ch_hq_how_promoted: "promoted on {sq}",
      ch_odds_hint_friend: "Whoever gives it starts without that piece (or with half the clock).",
      ch_odds_none: "None",
      ch_odds_pawn: "Pawn",
      ch_odds_knight: "Knight",
      ch_odds_rook: "Rook",
      ch_odds_queen: "Queen",
      ch_odds_time: "Half time",
      ch_odds_hint: "The defending champion gives odds (a piece or half the clock) to the challenger.",
      ch_pill_960: "960",
      ch_pill_odds: "Handicap: no {piece}",
      ch_pill_odds_time: "Handicap: half time",
      ch_odds_by_me: "Me",
      ch_odds_by_cpu: "The computer",
      ch_odds_hint_local: "Whoever gives it starts without that piece (or with half the clock). A handicap game doesn't count for your rating.",
      ch_odds_time_noclock: "Half the time needs a clock: pick one above.",
      ch_unrated_odds: "a handicap",
      ch_undo: "Undo",
      ch_rating_you: "Your rating",
      ch_pos_endgames: "Famous endgames",
      ch_pos_board: "Pick a piece below and tap a square; tap again to take it off.",
      ch_pos_turn: "To move",
      ch_pos_castle: "Castling",
      ch_pos_castle_wk: "White O-O",
      ch_pos_castle_wq: "White O-O-O",
      ch_pos_castle_bk: "Black O-O",
      ch_pos_castle_bq: "Black O-O-O",
      ch_pos_clear: "Clear",
      ch_pos_start: "Start position",
      ch_pos_eraser: "Eraser",
      ch_pos_play: "Play this position",
      ch_pos_you_play: "You play {c}.",
      ch_pos_err_kings: "Each side needs exactly one king.",
      ch_pos_err_pawns: "No pawns on the first or the last rank.",
      ch_pos_err_check: "The side not to move is in check: change whose turn it is or move the pieces.",
      ch_pos_err_over: "This position is over before it starts: mate, stalemate or not enough to mate.",
      ch_eg_kq: "King and queen vs king",
      ch_eg_kq_line: "Win: push the king to the edge and mate it. Mind the stalemate.",
      ch_eg_kr: "King and rook vs king",
      ch_eg_kr_line: "Win: the rook cuts the king off rank by rank, with your king's help.",
      ch_eg_kp: "King and pawn vs king",
      ch_eg_kp_line: "Win: keep your king in front of the pawn and take the opposition until it promotes.",
      ch_eg_bb: "Two bishops vs king",
      ch_eg_bb_line: "Win: side by side, the bishops herd the king into a corner.",
      ch_eg_bn: "Bishop and knight vs king",
      ch_eg_bn_line: "The hardest basic mate: drive the king to a corner of the bishop's colour.",
      ch_eg_lucena: "Rook and pawn vs rook (Lucena)",
      ch_eg_lucena_line: "Win: build a bridge with your rook to shield your king from checks, then promote.",
      ch_eg_philidor: "Philidor position",
      ch_eg_philidor_line: "Defend: keep your rook on your third rank (the attacker's sixth); once the pawn steps onto it, drop the rook to the far end and check from behind. A draw.",
      ch_eg_race: "Pawn race (Réti's study)",
      ch_eg_race_line: "Draw it: your king chases their pawn and supports yours at the same time.",
      ch_char_custom: "Custom",
      ch_char_suggest: "Your level: {name}",
      ch_rating_n: "{n} rated games",
      ch_rating_now: "Your rating is now {r}",
      ch_rated_yes: "✅ This game counts for your rating",
      ch_rated_no: "Not rated: {why}",
      ch_unrated_help: "undo/hints are on",
      ch_unrated_warn: "the coach's warning is on",
      ch_unrated_setup: "a set-up position",
      ch_unrated_practice: "practice",
      ch_unrated_friend: "two on one phone",
      ch_rated_abandon: "The unfinished game will count as a loss for your rating. Start a new one?",
      ch_best_line: "Your winning chance if you play:",
      ch_unrated_best: "best moves are on",
      ch_history: "Your past games",
      ch_moves_n: "moves",
      ch_cpu: "Computer ({elo})",
      ch_cpu_plain: "Computer",
      ch_band_beginner: "Beginner",
      ch_band_intermediate: "Intermediate",
      ch_band_strong: "Strong",
      ch_band_expert: "Expert",
      ch_piece_k: "king",
      ch_piece_q: "queen",
      ch_piece_r: "rook",
      ch_piece_b: "bishop",
      ch_piece_n: "knight",
      ch_piece_p: "pawn",
      ch_gear: "Board",
      ch_pieces_label: "Pieces",
      ch_pieces_classic: "Classic",
      ch_pieces_wood: "Wood",
      ch_style_green: "Green",
      ch_style_wood: "Wood",
      ch_style_blue: "Blue",
      ch_style_marble: "Marble",
      ch_view_label: "Board",
      ch_view_to3d: "3D board",
      ch_view_to2d: "Flat board",
      ch_cam_top: "From above",
      ch_cam_reset: "Reset the view",
      ch_pen: "Draw arrows and marks",
      ch_pen_clear: "Clear the arrows",
      ch_browse_label: "Earlier moves",
      ch_browse_first: "The start",
      ch_browse_back: "One move back",
      ch_browse_next: "One move on",
      ch_browse_live: "Back to the game",
      ch_browse_start: "Looking at the start",
      ch_browse_at: "Looking at move {n}",
      ch_browse_return: "back to the game",
      ch_share: "Send the game",
      ch_share_pic: "Picture",
      ch_share_video: "Video",
      ch_share_making: "One moment…",
      ch_share_acc: "Accuracy",
      ch_pgn_copied: "PGN copied: paste it into any chess site",
      ch_promote: "Promote to",
      ch_no_moves: "No moves yet",
      ch_won: "{name} wins",
      ch_resign_confirm: "Resign this game?",
      ch_draw_agree: "Draw",
      ch_draw_confirm: "Do you both agree to a draw?",
      ch_flip: "Turn the board",
      ch_hint: "Hint",
      ch_coach_wait: "The coach is looking at your move…",
      ch_practice_note: "Practice: playing on from the better move against the computer.",
      ch_better: "Better:",
      ch_warn_generic: "This move loses a lot.",
      ch_why_mate_in: "mate in {n}",
      ch_why_fork: "the {piece} attacks two pieces at once from {sq} (a fork)",
      ch_why_wins: "wins the {piece} ({san})",
      ch_why_wins_later: "wins material a move or two later ({san})",
      ch_why_saves: "saves your {piece}, which was under attack",
      ch_why_castle: "castles: the king is safe",
      ch_why_develop: "brings the {piece} into play",
      ch_why_centre: "takes the centre",
      ch_why_check: "gives check",
      ch_why_improves: "improves your position",
      ch_why_sacrifice: "a sacrifice: gives a piece away for more",
      ch_why_mate_allowed: "allows mate in {n} ({san})",
      ch_why_hang: "your {piece} on {sq} can be taken ({san})",
      ch_why_fork_allowed: "allows a fork: the {piece} on {sq} attacks two pieces ({san})",
      ch_why_pin_allowed: "your {piece} on {sq} gets pinned ({san})",
      ch_why_loses: "loses the {piece} ({san})",
      ch_why_mate_missed: "there was mate in {n}: {san}",
      ch_why_win_missed: "{san} would have won material",
      ch_why_win_missed_piece: "{san} would have won the {piece}",
      ch_why_king_walk: "the king moves and gives up castling",
      ch_why_queen_early: "the queen comes out early and can be chased",
      ch_why_castle_better: "castling was better ({san})",
      ch_why_develop_better: "better to bring out the {piece} ({san})",
      ch_why_centre_better: "{san} would have taken the centre",
      ch_why_better: "{san} was better",
      ch_why_book: "a known move of a studied opening",
      ch_reviewing: "Reviewing… {p}%",
      ch_rv_engine_sf: "🐟 Analysed by Stockfish 19",
      ch_rv_why: "Why?",
      ch_rv_why_line: "What would follow:",
      ch_graph: "Evaluation graph",
      ch_rv_start: "The start. Press ▶ to step through, or pick a move below.",
      ch_rv_back: "Back",
      ch_rv_show_better: "Show the better move",
      ch_rv_try: "Try the better move",
      ch_rv_keys: "Key moments",
      ch_out_of_theory: "Left theory on move {n}",
      ch_key_turn: "Turning point",
      ch_key_missed: "Missed chance",
      ch_key_brilliant: "Brilliant",
      ch_offer: "Offer a draw",
      ch_offer_sent: "Draw offered",
      ch_offer_to_you: "{name} offers a draw",
      ch_offer_made: "{name} offered a draw",
      ch_accept: "Accept",
      ch_refuse: "No, play on",
      ch_try_replace: "A chess game isn't finished yet. Try the better move in its place?",
    }
  },
  rules: {
    ar: {
      shatranj: `
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li>كل واحد معاه 16 حجر: الملك، الوزير، طابيتين، فيلين، حصانين و8 عساكر. <b>الأبيض بيبدأ.</b></li>
                <li>دوس على حجر من حجارتك تبان الأماكن اللي يقدر يروحها (نقطة لمربع فاضي، ودايرة حوالين حجر ممكن ياكله)، ودوس على المربع. أو اسحب الحجر بصباعك.</li>
                <li><b>كش</b>: الملك متهدد، ولازم تحميه في نفس النقلة. <b>كش مات</b>: مفيش أي طريقة تحميه، واللي عمله كسب.</li>
                <li><b>التبييت</b>: الملك يتحرك خطوتين ناحية الطابية والطابية تنط جنبه من الناحية التانية. بشرط إن الاتنين ماتحركوش قبل كده، ومفيش حاجة بينهم، والملك مش في كش ومش هيعدّي على مربع متهدد ولا يقف في كش.</li>
                <li><b>الأكل في السكة</b>: لو عسكري التاني نط خطوتين ووقف جنب عسكريك، تقدر تاكله كأنه اتحرك خطوة واحدة، في النقلة اللي بعدها على طول بس.</li>
                <li><b>الترقية</b>: العسكري اللي يوصل آخر صف يبقى وزير أو طابية أو فيل أو حصان، إنت اللي تختار.</li>
                <li><b>التعادل</b>: لما اللي عليه الدور مايقدرش يتحرك ومش في كش (بات)، أو نفس الوضع يتكرر 3 مرات، أو يعدّوا 50 نقلة من غير أكل ولا حركة عسكري، أو مايفضلش حجارة تكفي لكش مات، أو الاتنين يتفقوا.</li>
            </ol>
            <p class="help-sub">🤖 ضد الكمبيوتر</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>اختار خصمك من <b>6 شخصيات</b>: نونو (400) لسه بيتعلّم، عم حسن (800) بيحب الهجوم على الملك، ميرا (1100) هادية وبتبدّل، الكابتن (1400) متوازن، الأستاذ (1700) دقيق، والجنرال (2000) أقواهم - الكابتن والأستاذ والجنرال بيلعبهم <b>Stockfish</b> على قد تقييمهم. تحتهم اقتراح على قد تقييمك.</li>
                <li>أو <b>مخصص</b>: اختار قوته من <b>400 لـ 2000</b>: عند 400 بيسيب حجارته تتاكل وبيغلط زي المبتدئ، وكل ما الرقم يعلى بيفكر أعمق وبيغلط أقل، وعند 2000 بيلعب زي خبير. اختيارك بيتحفظ على موبايلك.</li>
                <li>اختار تلعب بالأبيض أو الأسود أو عشوائي؛ حجارتك دايماً تحت.</li>
                <li><b>نقلة مقدّمة</b>: وهو بيفكر، تقدر تختار نقلتك الجاية (حجر ومربع)، تبان بسهم أزرق، وتتلعب أول ما ييجي دورك لو لسه ممكنة؛ لو مش ممكنة الحجر بيتهز وتختار تاني. أي لمسة تانية على الرقعة بتلغيها. ونفس الكلام في الغرفة على موبايلك. تقدر تقفلها من صفحة الشطرنج أو من ⚙ على الرقعة (<b>الحركات المسبقة</b>).</li>
                <li><b>↶ تراجع</b> بيرجّع نقلتك ونقلة الكمبيوتر، و<b>💡 تلميح</b> بيوريك أحسن نقلة بسهم على الرقعة وليه. تختار قبل ما تبدأ: <b>بلا حدود</b> أو <b>3</b> من كل واحد في الدور أو <b>ممنوع</b> (ساعتها الزرارين مش بيظهروا خالص).</li>
                <li><b>تقييمك</b> بيبدأ من 800 وبيطلع وينزل على حسب قوة الكمبيوتر اللي كسبته أو خسرت منه. بيتحسب بس الماتش اللي من غير أي مساعدة (التراجع والتلميح ممنوعين وتنبيه المدرب مقفول، ومش من وضع مخصوص)، وصفحة الشطرنج بتقولك قبل ما تبدأ. لو سبت ماتش محسوب وبدأت غيره، أو استسلمت، بيتحسب خسارة.</li>
            </ul>
            <p class="help-sub">👥 اتنين على موبايل</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>الألوان بتتبدل كل دور، والنتيجة بتتجمع. الأبيض تحت، و↻ بيلف الرقعة لو حبيتوا.</li>
            </ul>
            <p class="help-sub">🎓 المدرب (ضد الكمبيوتر)</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>شغّله قبل ما تبدأ. <b>بينبّهك قبل الغلطة الكبيرة</b> ("الوزير بتاعك على d4 ممكن يتاكل") وتقدر ترجّع النقلة أو تلعبها برضه.</li>
                <li><b>بعد كل نقلة</b> بيقولك كانت أحسن نقلة ولا كويسة ولا مش دقيقة ولا غلطة ولا غلطة كبيرة، وليه، وإيه كان أحسن.</li>
                <li><b>بيعلّم الحجارة اللي في خطر</b> (متهاجمة ومش محمية): الأحمر حجارتك، والأخضر حجارة التاني اللي تقدر تاكلها.</li>
                <li><b>أفضل الحركات</b> (مقفولة من الأول): في دورك بتظهر أحسن 3 نقلات كأسهم (أخضر، أخضر فاتح، أصفر) وعلى كل سهم فرصة فوزك لو لعبتها، وتحت الرقعة سطر بيقولها. لو فتحتها الماتش مش بيتحسب في تقييمك.</li>
                <li>تقدر تقفل أي حاجة من دول لوحدها.</li>
            </ul>
            <p class="help-sub">👀 الرقعة والنقلات اللي فاتت</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li><b>2D ولا 3D</b>: من الزرار «2D | 3D» فوق الرقعة أو من صفحة الشطرنج (شكل الرقعة)، وموبايلك بيفتكر اختيارك. الـ2D زي مواقع الشطرنج، والـ3D رقعة خشب بحجارة مجسّمة.</li>
                <li><b>فاتتك نقلة؟</b> ⏮ ◀ ▶ ⏭ تحت الرقعة (أو الأسهم ← → على الكمبيوتر، أو دوس على أي نقلة في القايمة) بيورّوك الرقعة زي ما كانت. ده تفرّج بس: مش بيغيّر الدور ولا الساعة (الساعة شغالة) ولا تقييمك، ومش هتقدر تحرّك وانت بتتفرج. السطر اللي فوق الرقعة أو ⏭ أو لمسة على الرقعة بيرجّعوك للعبة، ولو اتلعبت نقلة وانت بتتفرج السطر بينوّر. شغال ضد الكمبيوتر، واتنين على موبايل، وفي الغرفة للي بيلعبوا واللي بيتفرجوا.</li>
            </ul>
            <p class="help-sub">✏️ الأسهم والعلامات</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>عشان تفكر بصوت عالي: دوس ✏️ على الرقعة، واسحب صباعك من مربع لمربع ترسم سهم أخضر، أو دوس على مربع تعلّمه بدايرة. نفس السهم أو العلامة تاني بتشيلها، و🧹 بتمسح الكل. على الكمبيوتر: كليك يمين واسحب (وفي الـ3D اضغط Shift معاه، لأن كليك يمين لوحده بيلف الرقعة).</li>
                <li>الأسهم على شاشتك انت بس (حتى في الغرفة) وبتتمسح لما حد يلعب نقلة. وشغالة في المراجعة كمان.</li>
            </ul>
            <p class="help-sub">📊 المراجعة</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>بعد كل دور (ضد الكمبيوتر، أو اتنين على موبايل، أو في غرفة) دوس <b>راجع الدور</b>: كل نقلة ليها تقييم (من الافتتاح، عبقرية، أحسن نقلة، كويسة، مش دقيقة، غلطة، غلطة كبيرة) والنقلة الأحسن وليه، وزرار <b>🎬 ليه؟</b> بيلعبلك على الرقعة اللي كان هيحصل بعد الغلطة، و<b>دقة كل لاعب</b>، و<b>رسم</b> بيوري مين كان كسبان، والدور بيتعاد على الرقعة وتنط للّحظات المهمة. التحليل بيعمله <b>Stockfish</b>، أقوى برنامج شطرنج، على موبايلك من غير نت. نقلات الافتتاحات المعروفة بتتكتب «من الافتتاح» من غير تقييم.</li>
                <li><b>جرّب الأحسن</b>: من اللحظة دي، النقلة الأحسن بتتلعب وتكمّل ضد الكمبيوتر.</li>
                <li>آخر 20 دور متحفظين على موبايلك، وتفتحهم من صفحة الشطرنج.</li>
                <li><b>ابعت الدور</b> (في آخر الدور وفي المراجعة): <b>صورة</b> بآخر وضع على الرقعة والنتيجة، أو <b>PGN</b> (النقلات بالطريقة اللي أي موقع شطرنج بيقراها)، أو <b>فيديو</b> قصير للدور كله لو موبايلك يقدر يسجّله.</li>
            </ul>
            <p class="help-sub">🧩 وضع مخصوص ونهايات مشهورة</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>من صفحة الشطرنج: رتّب الرقعة بإيدك (اختار حجر ودوس على المربع، والممحاة بتشيل)، واختار الدور على مين والتبييت، أو اختار نهاية مشهورة (ملك ووزير ضد ملك، لوسينا، فيليدور، دراسة ريتي…) وتحتها المطلوب منك.</li>
                <li>قبل ما تلعب بنتأكد إن فيه ملك واحد لكل لون، ومفيش عسكري في أول صف أو آخره، وملك اللي مش عليه الدور مش في كش.</li>
                <li>بتلعبها ضد الكمبيوتر أو اتنين على موبايل. الوضع المخصوص بيتلعب باللون اللي اخترته، والنهاية بتديك اللون بتاعها. مش بتتحسب في تقييمك.</li>
            </ul>
            <p class="help-sub">⏱️ الساعة</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>من غير ساعة، أو 1+0 أو 3+0 أو 3+2 أو 5+0 أو 10+0 أو 15+10: دقايق لكل لاعب + ثواني بتتزود بعد كل نقلة. الساعة بتبدأ بعد أول نقلة للأبيض. <b>اللي وقته يخلص يخسر</b>، إلا لو التاني مامعهوش حاجة تعمل كش مات: تعادل.</li>
            </ul>
            <p class="help-sub">🎲 شطرنج 960 وفرق القوة</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li><b>960</b>: الحجارة اللي في الصف الأخير بتتلخبط كل دور (الفيلين على لونين مختلفين والملك بين الطابيتين)، والعساكر زي ما هي. التبييت: <b>دوس على الملك وبعدين على الطابية</b> (أو على المربع اللي الملك رايحه)، والملك بيقف مكانه العادي (g أو c) والطابية جنبه. الـ960 بيتحسب في تقييمك.</li>
                <li><b>فرق القوة</b>: اللي أقوى بيبدأ ناقص حجر (عسكري f، حصان، طابية a، أو الوزير) أو بنص الوقت. ضد الكمبيوتر تختار مين يدّيها: إنت ولا هو؛ واتنين على موبايل: الأبيض ولا الأسود. في الغرفة البطل هو اللي بيدّيها، وفي البطولة مفيش فرق قوة. الماتش اللي فيه فرق قوة مش بيتحسب في تقييمك.</li>
            </ul>
            <p class="help-sub">👑 الوزير المستخبي</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>قبل أول نقلة كل واحد يختار <b>عسكري من عساكره</b> يبقى وزير مستخبي، ومحدش يعرفه غيره (على موبايلك عليه تاج دهبي). ضد الكمبيوتر أو في الغرفة (كل واحد من موبايله)، مش اتنين على موبايل ولا في البطولة.</li>
                <li>طول ما هو مستخبي هو <b>عسكري</b> بالنسبة للتاني: بياكل زي العسكري بس، مابيعملش كش، ومابيمنعش الملك التاني من أي مربع.</li>
                <li>في دورك تحركه <b>زي العسكري</b> (ويفضل مستخبي)، أو <b>زي الوزير</b> من مكانه نقلة العسكري مايقدرش يعملها: ساعتها <b>بيتكشف</b> ويبقى وزير على الرقعة («👑 وزير مستخبي!»)، ويقدر ياكل ويعمل كش زي أي وزير، بس عمره ما ياكل الملك.</li>
                <li>لو وصل آخر صف وهو مستخبي بيترقّى زي أي عسكري والسر بيروح. ولو اتاكل وهو مستخبي بيتكشف («👑 كان الوزير!») ويتحسب وزير.</li>
                <li>في آخر الدور بيبان العسكري اللي كل واحد اختاره. مع الساعة في الغرفة، الاختيار ليه دقيقة، واللي مايختارش بياخد عسكري عشوائي. الدور ده مش بيتحسب في تقييمك، ومن غير فرق قوة.</li>
            </ul>
            <p class="help-sub">📱 كل واحد من موبايله</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>اتنين بس بيلعبوا والباقي بيتفرج، وحجارتك دايماً تحت على موبايلك. <b>اللي يكسب يفضل قاعد</b>، واللي عليه الدور في الطابور يقعد قصاده بالأبيض. في التعادل البطل يفضل قاعد.</li>
                <li>تقدر <b>تعرض تعادل</b> (مرة في النقلة) والتاني يوافق أو يرفض، أو <b>تستسلم</b>. اللي يخرج من الغرفة وهو بيلعب يخسر.</li>
                <li>المضيف بيختار الساعة. ولو موبايل سكت، المضيف يقدر يخلّي الكمبيوتر يلعب نقلة بداله (نقلة عادية، مش أقوى نقلة).</li>
            </ul>
            <p class="help-sub">📺 على التلفزيون</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>الرقعة كبيرة، واللاعبين بساعاتهم والحجارة اللي أكلوها، والنقلات كلها.</li>
            </ul>
            <p class="help-sub">💡 نصايح</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>في الأول طلّع الحصانين والفيلين، وامسك النص، وبيّت الملك بدري.</li>
                <li>قبل كل نقلة اسأل نفسك: التاني بيهدد إيه؟ وفيه حجر من حجارتي مش محمي؟</li>
            </ul>
            ${TOUR_RULES_HELP.ar}
            <p class="help-sub">♟️ التعادل في بطولة الشطرنج</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>في الشطرنج التعادل <b>بيتعاد مرة واحدة بالألوان معكوسة</b>: اللي كان بالأسود ياخد الأبيض.</li>
                <li>لو اتعادلوا تاني: <b>دور أرماجدون</b>. الأبيض بالقرعة، و<b>التعادل فيه مكسب للأسود</b>. يعني الأبيض لازم يكسب.</li>
                <li>ساعة المضيف لكل ماتش لوحده، والتعادل والاستسلام شغالين في كل ماتش. وبعد كل دور تقدر تراجعه.</li>
            </ul>`,
    },
    en: {
      shatranj: `
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li>Each side has 16 pieces: a king, a queen, two rooks, two bishops, two knights and 8 pawns. <b>White moves first.</b></li>
                <li>Tap one of your pieces to see where it can go (a dot on an empty square, a ring round a piece it can take), then tap the square. Or drag the piece with your finger.</li>
                <li><b>Check</b>: the king is attacked and must be saved on this move. <b>Checkmate</b>: there is no way to save it, and whoever gave it wins.</li>
                <li><b>Castling</b>: the king moves two squares towards a rook and the rook jumps beside it. Only if neither has moved, nothing stands between them, and the king is not in check and doesn't pass through or land on an attacked square.</li>
                <li><b>En passant</b>: if the other side's pawn steps two squares and lands beside yours, you can take it as if it had moved one - on the very next move only.</li>
                <li><b>Promotion</b>: a pawn that reaches the last rank becomes a queen, rook, bishop or knight - your choice.</li>
                <li><b>A draw</b>: the side to move has no legal move and isn't in check (stalemate), the same position comes up three times, fifty moves pass with no capture or pawn move, nobody has enough left to mate, or both agree.</li>
            </ol>
            <p class="help-sub">🤖 Against the computer</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>Pick an opponent from <b>6 characters</b>: Nono (400) is just learning, Uncle Hassan (800) loves attacking the king, Mira (1100) is solid and trades, The Captain (1400) is balanced, The Professor (1700) is precise, and The General (2000) is the strongest - The Captain, The Professor and The General are played by <b>Stockfish</b>, held to their rating. Under them, a suggestion for your rating.</li>
                <li>Or <b>Custom</b>: pick its rating from <b>400 to 2000</b>: at 400 it leaves pieces hanging and slips like a beginner; the higher, the deeper it thinks and the less it slips; at 2000 it plays like an expert. Your choice is remembered.</li>
                <li>Play White, Black or at random; your pieces are always at the bottom.</li>
                <li><b>Premove</b>: while it thinks, pick your next move (a piece and a square); it shows as a blue arrow and is played the moment it is your turn, if it is still legal - if not, the piece shakes and you choose again. Any other tap on the board cancels it. The same works in a room, on your own phone. Switch them off on the chess page or in the board's ⚙ (<b>Premoves</b>).</li>
                <li><b>↶ Undo</b> takes back your move and the computer's, and <b>💡 Hint</b> shows the best move as an arrow on the board, and why. Choose before you start: <b>unlimited</b>, <b>3</b> of each a game, or <b>none</b> (then neither button is shown at all).</li>
                <li><b>Your rating</b> starts at 800 and moves up or down with the strength of the computer you beat or lose to. Only a game with no help counts (undo and hints set to none, the coach's warning off, not a set-up position), and the chess page tells you before you start. Leaving a rated game for a new one, or resigning, counts as a loss.</li>
            </ul>
            <p class="help-sub">👥 Two on one phone</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>The colours swap every game and the tally carries on. White sits at the bottom; ↻ turns the board if you like.</li>
            </ul>
            <p class="help-sub">🎓 The coach (against the computer)</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>Switch it on before you start. <b>It warns you before a blunder</b> ("your queen on d4 can be taken"), and you can take the move back or play it anyway.</li>
                <li><b>After each of your moves</b> it says whether it was best, good, an inaccuracy, a mistake or a blunder, why, and what was better.</li>
                <li><b>It marks the pieces in danger</b> (attacked and not defended): red for yours, green for the other side's you could take.</li>
                <li><b>Best moves</b> (off to start with): on your turn the three best moves show as arrows (green, light green, yellow), each with your chance to win if you play it, and a line under the board names them. With it on, the game doesn't count for your rating.</li>
                <li>Each of these can be switched off on its own.</li>
            </ul>
            <p class="help-sub">👀 The board and earlier moves</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li><b>2D or 3D</b>: the «2D | 3D» switch over the board, or the chess page (Board look); your phone remembers it. 2D is like the chess sites, 3D a wooden board with real pieces.</li>
                <li><b>Missed a move?</b> ⏮ ◀ ▶ ⏭ under the board (or ← → on a computer, or a tap on any move in the list) show the board as it was. It is only looking: it doesn't change the game, the clock (which keeps running) or your rating, and nothing can be moved while you look. The line over the board, ⏭ or a tap on the board brings you back; if a move is played meanwhile, the line lights up. Against the computer, two on one phone, and in rooms for players and watchers.</li>
            </ul>
            <p class="help-sub">✏️ Arrows and marks</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>To think out loud: tap ✏️ on the board, then drag from one square to another for a green arrow, or tap a square to ring it. The same arrow or mark again takes it away, and 🧹 clears them all. On a computer: right-click and drag (in 3D hold Shift too, since a right-drag alone turns the board).</li>
                <li>They are on your screen only (in a room too) and go when a move is played. They work in the review as well.</li>
            </ul>
            <p class="help-sub">📊 The review</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>After every game (against the computer, two on one phone, or in a room) press <b>Review the game</b>: every move rated (book, brilliant, best, good, inaccuracy, mistake, blunder) with the better move and why, a <b>🎬 Why?</b> button that plays out on the board what the mistake would have led to, <b>each player's accuracy</b>, a <b>graph</b> of who was winning, and the game replayed on the board with jumps to the key moments. The analysis is done by <b>Stockfish</b>, the strongest chess program, on your phone with no internet needed. Moves of known openings are marked «book» and not graded.</li>
                <li><b>Try the better move</b>: from that moment, the better move is played and you carry on against the computer.</li>
                <li>Your last 20 games are kept on your phone; open them from the chess page.</li>
                <li><b>Send the game</b> (at the end of a game and in the review): a <b>picture</b> of the final position with the result, the <b>PGN</b> (the moves the way any chess site reads them), or a short <b>video</b> of the whole game where your phone can record one.</li>
            </ul>
            <p class="help-sub">🧩 Set up a position, famous endgames</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>From the chess page: arrange the board yourself (pick a piece and tap a square; the eraser takes pieces off), choose whose turn it is and the castling rights, or pick a famous endgame (king and queen vs king, Lucena, Philidor, Réti's study…) with what you have to do.</li>
                <li>Before you play it is checked: one king each, no pawn on the first or last rank, and the side not to move not in check.</li>
                <li>Play it against the computer or two on one phone. Your own position is played with the colour you chose; an endgame gives you its side. It doesn't count for your rating.</li>
            </ul>
            <p class="help-sub">⏱️ The clock</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>No clock, or 1+0, 3+0, 3+2, 5+0, 10+0 or 15+10: minutes each, plus seconds added after every move. It starts after White's first move. <b>Running out loses</b> - unless the other side has nothing to mate with: then it's a draw.</li>
            </ul>
            <p class="help-sub">🎲 Chess960 and handicaps</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li><b>960</b>: the back row is shuffled every game (the bishops on different colours, the king between the rooks); the pawns stay as usual. To castle, <b>tap the king and then the rook</b> (or the king's square): the king lands where it always does (g or c) with the rook beside it. 960 games count for your rating.</li>
                <li><b>Handicap</b>: the stronger player starts without a piece (the f-pawn, a knight, the a-rook or the queen) or with half the clock. Against the computer choose who gives it, you or it; two on one phone, White or Black. In a room the champion gives it, and a tournament has none. A handicap game doesn't count for your rating.</li>
            </ul>
            <p class="help-sub">👑 Hidden queen</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>Before the first move each side picks <b>one of its own pawns</b> to be a hidden queen, and only its owner knows which (a gold crown on your own phone). Against the computer or in a room (each on their own phone); not two on one phone, and not in a tournament.</li>
                <li>While hidden it is a <b>pawn</b> to the other side: it takes only as a pawn, never gives check, and never keeps the other king off a square.</li>
                <li>On your turn move it <b>like a pawn</b> (it stays hidden), or <b>like a queen</b> from its square, a move a pawn couldn't make: that <b>reveals</b> it and it becomes a queen on the board ("👑 A hidden queen!"), taking and checking like any queen, but never taking a king.</li>
                <li>Reaching the last rank still hidden, it promotes like any pawn and the secret is gone. Taken while hidden, it is revealed ("👑 That was the queen!") and counts as a queen.</li>
                <li>At the end of the game both picks are shown. With a clock in a room, picking has a minute of its own, and whoever hasn't picked gets a random pawn. These games are not rated, and have no handicap.</li>
            </ul>
            <p class="help-sub">📱 Separate phones</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>Two play and the rest watch; your pieces are always at the bottom of your phone. <b>The winner stays on</b>, and the next in line sits down with White. On a draw the champion keeps the seat.</li>
                <li>You can <b>offer a draw</b> (once a move) and the other accepts or refuses, or <b>resign</b>. Leaving the room mid-game loses it.</li>
                <li>The host picks the clock. If a phone goes quiet, the host can have the computer play one move for it (an ordinary move, not the best one).</li>
            </ul>
            <p class="help-sub">📺 On the TV</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>The board big, both players with their clocks and what they have taken, and every move.</li>
            </ul>
            <p class="help-sub">💡 Tips</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>Early on, bring out the knights and bishops, take the centre, and castle early.</li>
                <li>Before every move ask: what is the other side threatening? Is one of my pieces undefended?</li>
            </ul>
            ${TOUR_RULES_HELP.en}
            <p class="help-sub">♟️ A draw in a chess tournament</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>In chess a draw is <b>replayed once with the colours swapped</b>: whoever had Black takes White.</li>
                <li>Drawn again: <b>an Armageddon game</b>. White is drawn by lot, and <b>a draw counts as a win for Black</b> - so White has to win.</li>
                <li>The host's clock runs for each match on its own, draw offers and resigning work in every match, and every game can be reviewed afterwards.</li>
            </ul>`,
    }
  }
});
