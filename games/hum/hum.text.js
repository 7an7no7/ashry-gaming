/* hum: the words only this game's screens show, and its rules (Help, the
   first-play card). The build puts them into TRANSLATIONS and GAME_RULES (tools/game-text.cjs):
   read them as t.<key> and GAME_RULES[lang].<id>, as everywhere. */
gameText({
  translations: {
    ar: {
      dnd_mode_label: "هتلعبوها إزاي؟",
      dnd_mode_hum: "🎤 دندنة",
      dnd_mode_listen: "🎧 سمّع",
      dnd_mode_hum_hint: "كل أغنية واحد بالدور يسمعها في ودنه ويدندنها بصوت عالي، والباقي يكتبوا اسمها.",
      dnd_mode_listen_hint: "مفيش حد بيدندن: كل الموبايلات بتشغّل نفس الحتة في نفس اللحظة، والكل بيتسابق يكتب اسمها.",
      dnd_replay_label: "الحتة بتتسمع إزاي؟",
      dnd_replay_once10: "أول ١٠ ثواني مرة واحدة",
      dnd_replay_full: "الـ٣٠ ثانية كلها وتعيد براحتك",
      dnd_replay_grow: "بتطول: ٢ث ثم ٥ث ثم ١٠ث",
      dnd_count_label: "كام أغنية؟",
      dnd_lobby_hint: "أغاني مصري بس، من أم كلثوم وعبد الحليم لعمرو دياب والمهرجانات. أسرع ٣ يكتبوا اسمها صح: ٣ و٢ و١، وبعد ١٥ ثانية تنزل ٤ اختيارات بنقطة.",
      dnd_song_of: "الأغنية {n} من {m}",
      dnd_score: "نقطك {n}",
      dnd_front: "الصف الأول: أسرع ٣",
      dnd_env_label: "ظرف الدي جي: ليك إنت بس",
      dnd_env_cover: "✉️ ظرف مقفول",
      dnd_env_hold: "دوس مطوّل تفتحه",
      dnd_mic_hear: "دوس المايك: تسمعها في ودنك",
      dnd_mic_again: "دوس المايك تسمع تاني",
      dnd_ear: "السماعة في ودنك، أو الموبايل على ودنك. مش السبيكر: الجمهور مايسمعش!",
      dnd_heard_btn: "⏹ خلاص، هدندن",
      dnd_h_listen: "الأغنية دي معاك إنت بس",
      dnd_hum_now: "دندن بصوت عالي! 🎶 من غير كلام",
      dnd_hummer_wait: "🎶 الجمهور بيسمعك… لما حد يعرفها هيرفع لافتة",
      dnd_g_listen: "{h} بيسمع الأغنية في ودنه 🎧",
      dnd_g_env: "{h} بيختار ظرف من التلاتة ✉️",
      dnd_env3_title: "٣ ظروف: اختار الأغنية اللي تعرفها",
      dnd_env3_hint: "العناوين ليك إنت بس. الاتنين التانيين يرجعوا للكوتشينة.",
      dnd_g_type: "اكتب اسمها أول ما تعرفها!",
      dnd_g_wait: "اسمع كويس… اللافتة هتفتح أول ما يبدأ يدندن",
      dnd_on_stage: "{h} على المسرح",
      dnd_type_label: "اكتب اسم الأغنية على اللافتة",
      dnd_type_ph: "اسم الأغنية…",
      dnd_raise: "✋ ارفع اللافتة",
      dnd_miss: "مش هي… جرّب تاني",
      dnd_close: "🔥 قريب! كمّل",
      dnd_done: "✋ لافتتك فوق، استنى الباقيين",
      dnd_picked: "اخترت… استنى الإجابة",
      dnd_choices_h: "الكلوبات طفت! اختار من الـ٤ لافتات",
      dnd_choices_wait: "الكلوبات طفت! اللي لسه ماعرفهاش بيختار",
      dnd_last: "{name} رفع لافتة ✓",
      dnd_watch: "بتتفرج المرة دي، وتلعب اللعبة الجاية",
      dnd_status_reveal: "الأغنية كانت",
      dnd_status_skipped: "اتعدت، والأغنية كانت",
      dnd_listen_btn: "▶ اسمعها",
      dnd_again: "🔁 اسمعها تاني",
      dnd_next: "🎉 الأغنية الجاية",
      dnd_final: "🏆 النتيجة",
      dnd_skip: "⏭ عدّي الأغنية دي",
      dnd_go: "يلا نبدأ",
      dnd_arm_title: "كل واحد يدوس ▶ على موبايله",
      dnd_arm_btn: "▶ جاهز: شغّل الصوت",
      dnd_arm_hint: "دوسة واحدة بس عشان الموبايل يقدر يشغّل الأغاني لوحده (الآيفون مايشغّلش صوت من غير لمسة).",
      dnd_armed: "🎧 جاهز! استنى الباقيين",
      dnd_count_line: "كل الموبايلات هتسمع نفس الحتة دلوقتي",
      dnd_count_wait: "استعد… الحتة جاية",
      dnd_tap_sound: "▶ دوس عشان تسمع",
      dnd_listen_type: "اسمع واكتب اسمها!",
      dnd_grow_n: "{n}ث",
      dnd_broken: "الأغنية دي مش راضية تشتغل، جايبين غيرها",
      dnd_broken_mine: "الأغنية مش راضية تشتغل على موبايلك. خمّن من اللي سامعينه حواليك",
      dnd_rank_1: "إنت الأول!",
      dnd_rank_2: "إنت التاني!",
      dnd_rank_3: "إنت التالت!",
      dnd_res_late: "صح! بس اتسبقت",
      dnd_res_pick_ok: "اخترتها صح",
      dnd_res_pick_no: "اخترت غلط",
      dnd_res_none: "ما لحقتش تجاوب المرة دي",
      dnd_res_hummer_ok: "اتعرفت من دندنتك ({n}) 🎉 {p} ليك",
      dnd_res_hummer_no: "محدش عرفها في الوقت… مفيش نقط المرة دي",
      dnd_res_h_got: "{h} خد +٢ عشان حد عرفها",
      dnd_res_h_none: "{h} ما خدش حاجة",
      dnd_over_title: "🎤 ختام الفرح",
      dnd_pl_title: "قايمة أغاني السهرة",
      dnd_pl_share: "ابعت القايمة",
      dnd_pl_play: "اسمع {t}",
      dnd_tv_card: "🎤 الدور على {h} يدندن!",
      dnd_tv_listen_hum: "{h} بيسمعها في ودنه دلوقتي 🎧",
      dnd_tv_hum: "{h} بيدندن… واللي يعرفها يرفع لافتة",
      dnd_tv_type_listen: "اللي يعرفها يرفع لافتة!",
      dnd_tv_choices: "الكلوبات طفت! ٤ لافتات على الموبايلات",
      dnd_tv_count: "سمّع! 🎧",
      dnd_tv_arm: "كل واحد يدوس ▶ على موبايله",
    },
    en: {
      dnd_mode_label: "How do you play?",
      dnd_mode_hum: "🎤 Hum",
      dnd_mode_listen: "🎧 Listen",
      dnd_mode_hum_hint: "Each song, one player in turn hears it in their ear and hums it out loud; the rest type its name.",
      dnd_mode_listen_hint: "Nobody hums: every phone plays the same clip at the same moment, and everyone races to name it.",
      dnd_replay_label: "How does the clip play?",
      dnd_replay_once10: "The first 10 s, once",
      dnd_replay_full: "All 30 s, replay freely",
      dnd_replay_grow: "Growing: 2 s, then 5 s, then 10 s",
      dnd_count_label: "How many songs?",
      dnd_lobby_hint: "Egyptian songs only, from Umm Kulthum and Abdel Halim to Amr Diab and mahraganat. The fastest 3 to type it: 3, 2 and 1; after 15 seconds 4 choices come down, worth 1.",
      dnd_song_of: "Song {n} of {m}",
      dnd_score: "Your points {n}",
      dnd_front: "Front row: the fastest 3",
      dnd_env_label: "The DJ's envelope: yours only",
      dnd_env_cover: "✉️ Sealed envelope",
      dnd_env_hold: "Press and hold to open",
      dnd_mic_hear: "Tap the mic: hear it in your ear",
      dnd_mic_again: "Tap the mic to hear it again",
      dnd_ear: "Earphones in, or the phone to your ear. Not the speaker: the crowd mustn't hear!",
      dnd_heard_btn: "⏹ Done, I'll hum it",
      dnd_h_listen: "This song is yours alone",
      dnd_hum_now: "Hum it out loud! 🎶 No words",
      dnd_hummer_wait: "🎶 The crowd is listening… whoever knows it raises a sign",
      dnd_g_listen: "{h} is hearing the song 🎧",
      dnd_g_env: "{h} is picking one of three envelopes ✉️",
      dnd_env3_title: "3 envelopes: pick the song you know",
      dnd_env3_hint: "Only you see the titles. The other two go back to the deck.",
      dnd_g_type: "Type its name as soon as you know it!",
      dnd_g_wait: "Listen… your sign opens when the humming starts",
      dnd_on_stage: "{h} on stage",
      dnd_type_label: "Write the song's name on your sign",
      dnd_type_ph: "The song's name…",
      dnd_raise: "✋ Raise the sign",
      dnd_miss: "Not that one… try again",
      dnd_close: "🔥 Close! Keep going",
      dnd_done: "✋ Your sign is up, wait for the rest",
      dnd_picked: "Picked… wait for the answer",
      dnd_choices_h: "The bulbs are out! Pick one of the 4 signs",
      dnd_choices_wait: "The bulbs are out! Those who don't have it are picking",
      dnd_last: "{name} raised a sign ✓",
      dnd_watch: "You're watching this time; you play the next game",
      dnd_status_reveal: "The song was",
      dnd_status_skipped: "Skipped. The song was",
      dnd_listen_btn: "▶ Play it",
      dnd_again: "🔁 Play it again",
      dnd_next: "🎉 Next song",
      dnd_final: "🏆 The result",
      dnd_skip: "⏭ Skip this song",
      dnd_go: "Let's start",
      dnd_arm_title: "Everyone tap ▶ on your phone",
      dnd_arm_btn: "▶ Ready: sound on",
      dnd_arm_hint: "One tap so the phone can play the songs by itself (an iPhone plays no sound before a tap).",
      dnd_armed: "🎧 Ready! Waiting for the rest",
      dnd_count_line: "Every phone plays the same clip now",
      dnd_count_wait: "Get ready… the clip is coming",
      dnd_tap_sound: "▶ Tap to hear it",
      dnd_listen_type: "Listen and type its name!",
      dnd_grow_n: "{n} s",
      dnd_broken: "This song won't play; getting another",
      dnd_broken_mine: "The song won't play on your phone. Guess from the sound around you",
      dnd_rank_1: "You're first!",
      dnd_rank_2: "You're second!",
      dnd_rank_3: "You're third!",
      dnd_res_late: "Right! But beaten to it",
      dnd_res_pick_ok: "Picked it right",
      dnd_res_pick_no: "Wrong pick",
      dnd_res_none: "No answer this time",
      dnd_res_hummer_ok: "They knew it from your humming ({n}) 🎉 {p} for you",
      dnd_res_hummer_no: "Nobody got it in time… no points this time",
      dnd_res_h_got: "{h} got +2 because someone knew it",
      dnd_res_h_none: "{h} got nothing",
      dnd_over_title: "🎤 The wedding's over",
      dnd_pl_title: "Tonight's playlist",
      dnd_pl_share: "Send the playlist",
      dnd_pl_play: "Play {t}",
      dnd_tv_card: "🎤 {h}'s turn to hum!",
      dnd_tv_listen_hum: "{h} is hearing it in their ear now 🎧",
      dnd_tv_hum: "{h} is humming… raise a sign if you know it",
      dnd_tv_type_listen: "Know it? Raise a sign!",
      dnd_tv_choices: "The bulbs are out! 4 signs on the phones",
      dnd_tv_count: "Listen! 🎧",
      dnd_tv_arm: "Everyone tap ▶ on your phone",
    }
  },
  rules: {
    ar: {
      hum: `
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li>كل واحد على موبايله، من 2 لـ12. أغاني <b>مصري بس</b>: من أم كلثوم وعبد الحليم وفريد لعمرو دياب ومنير وأنغام والمهرجانات.</li>
                <li><b>🎤 دندنة</b>: كل أغنية واحد بالدور ياخد <b>٣ ظروف</b> فيهم ٣ أغاني (العناوين ليه بس) ويختار اللي يعرفها، والاتنين التانيين يرجعوا. بعدين يدوس المايك ويسمعها <b>في ودنه</b> (السماعة، أو الموبايل على ودنه، مش السبيكر)، واسمها في ظرف الدي جي ليه بس. يدوس «خلاص، هدندن» ويدندنها بصوت عالي من غير كلام.</li>
                <li><b>🎧 سمّع</b>: مفيش حد بيدندن. كل الموبايلات بتشغّل نفس الحتة في نفس اللحظة. المضيف يختار: أول ١٠ ثواني مرة واحدة، أو الـ٣٠ ثانية وتعيد براحتك، أو «بتطول» (٢ث ثم ٥ث ثم ١٠ث).</li>
                <li>الباقي <b>يكتبوا اسم الأغنية</b> على اللافتة ويرفعوها، ولو بغلطة صغيرة (الألف واللام والهمزة مش فارقين). اسم المطرب لوحده مش إجابة.</li>
                <li>الكلوبات اللي فوق المسرح هي الوقت: <b>١٥ ثانية</b>. لو خلصت ولسه في حد ماعرفهاش، تنزل <b>٤ لافتات</b> يختار منهم (وده للي كتب غلط كمان).</li>
            </ol>
            <p class="help-sub">🏆 النقط</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>أسرع ٣ يكتبوها صح ياخدوا <b>٣ و٢ و١</b> ويقعدوا في الصف الأول، واللي بعدهم صح ياخد <b>١</b>.</li>
                <li>الاختيار الصح من الـ٤ لافتات بـ<b>نقطة</b>.</li>
                <li>اللي بيدندن ياخد <b>٢</b> لو حد واحد على الأقل كتبها صح في الوقت، وطبعًا مايجاوبش على أغنيته.</li>
                <li>في «بتطول»: اللي يعرفها على حتة الـ٢ ثانية ياخد <b>+٢ زيادة</b>، وعلى حتة الـ٥ ثواني <b>+١</b>.</li>
                <li>المضيف يختار ٥ أو ١٠ أو ١٥ أغنية، وفي الآخر المنصة.</li>
                <li>🎶 وفي الآخر <b>قايمة أغاني السهرة</b>: كل أغنية اتلعبت ومطربها، وجنب كل واحدة ▶ تسمعها تاني على موبايلك، و«📸 ابعت القايمة» لجروب العيلة.</li>
            </ul>
            <p class="help-sub">📱 كل واحد من موبايله</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>لو أغنية مش راضية تشتغل، اللعبة بتجيب غيرها لوحدها ومحدش بيخسر حاجة. والمضيف يقدر يعدّي أي أغنية.</li>
                <li>في «سمّع» كل واحد يدوس ▶ مرة في الأول، عشان الآيفون مايشغّلش صوت من غير لمسة.</li>
                <li>اللي يدخل في النص يتفرج، ويلعب اللعبة الجاية.</li>
            </ul>
            <p class="help-sub">📺 على التلفزيون (اختياري)</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>مسرح الفرح بالستارة واللي بيدندن عليه، والجمهور تحت بيرفع لافتات، والإجابة يافطة بتتفرد ومنصة ١-٢-٣. التلفزيون مابيشغّلش الأغنية: الموبايلات هي السماعات.</li>
            </ul>`,
    },
    en: {
      hum: `
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li>Everyone on their own phone, 2 to 12. <b>Egyptian songs only</b>: from Umm Kulthum, Abdel Halim and Farid to Amr Diab, Mounir, Angham and mahraganat.</li>
                <li><b>🎤 Hum</b>: each song, one player in turn gets <b>3 sealed envelopes</b>, three songs whose titles only they see, and picks the one they know; the other two go back. Then they tap the mic and hear it <b>in their ear</b> (earphones, or the phone to the ear, not the speaker); its name is in the DJ's envelope, theirs alone. They tap "Done, I'll hum it" and hum it out loud, no words.</li>
                <li><b>🎧 Listen</b>: nobody hums. Every phone plays the same clip at the same moment. The host picks: the first 10 s once, all 30 s replayed freely, or "Growing" (2 s, then 5 s, then 10 s).</li>
                <li>The rest <b>type the song's name</b> on their sign and raise it; a small typo is fine (the article and hamzas don't matter). The singer's name alone is not an answer.</li>
                <li>The bulbs over the stage are the clock: <b>15 seconds</b>. When they are out and someone still hasn't got it, <b>4 signs</b> come down to pick from (a wrong typer may pick too).</li>
            </ol>
            <p class="help-sub">🏆 Points</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>The fastest 3 right typed answers score <b>3, 2 and 1</b> and take the front row; a later right answer scores <b>1</b>.</li>
                <li>The right sign of the 4 is <b>1 point</b>.</li>
                <li>The hummer scores <b>2</b> when at least one typed answer was right in time, and can't answer their own song.</li>
                <li>In "Growing": naming it on the 2-second clip is <b>+2 more</b>, on the 5-second clip <b>+1</b>.</li>
                <li>The host picks 5, 10 or 15 songs; the podium at the end.</li>
                <li>🎶 Then <b>Tonight's playlist</b>: every song played and its singer, each with a ▶ to hear it again on your phone, and «📸 Send the playlist» for the family group.</li>
            </ul>
            <p class="help-sub">📱 Everyone on their own phone</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>A song that won't play is replaced by itself and nobody loses anything. The host can skip any song.</li>
                <li>In "Listen" everyone taps ▶ once at the start: an iPhone plays no sound before a tap.</li>
                <li>Someone who joins mid-game watches, and plays the next game.</li>
            </ul>
            <p class="help-sub">📺 On the TV (optional)</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>The wedding stage with its curtains and the hummer on it, the crowd raising signs below, the answer a banner unrolling and a 1-2-3 podium. The TV doesn't play the song: the phones are the speakers.</li>
            </ul>`,
    }
  }
});
