/* bumper: the words only this game's screens show, and its rules (Help, the
   first-play card). The build puts them into TRANSLATIONS and GAME_RULES (tools/game-text.cjs):
   read them as t.<key> and GAME_RULES[lang].<id>, as everywhere. */
gameText({
  translations: {
    ar: {
      bmp_mode: "طريقة اللعب",
      bmp_mode_balloons: "بالونات",
      bmp_mode_points: "نقط",
      bmp_mode_ring: "الحلبة",
      bmp_mode_ring_clock: "الحلبة على الوقت",
      bmp_mode_ring_last: "الحلبة: آخر واحد",
      bmp_ring_win: "مين يكسب الحلبة؟",
      bmp_ring_clock: "أكتر زقّة في الوقت",
      bmp_ring_last: "آخر واحد فوق",
      bmp_how_balloons: "كل عربية معاها 3 بالونات، والخبطة بتفرقع بالونة من اللي اتخبط. اللي بالوناته تخلص يكمّل شبح، وآخر واحد معاه بالونات يكسب.",
      bmp_how_points: "كل خبطة تجيبها وأنت اللي داخل بنقطة. أكتر واحد خبط لما الوقت يخلص يكسب.",
      bmp_how_ring_clock: "حلبة من غير سور: زُق العربيات برّه. كل واحد تزقّه بنقطة، واللي يقع يرجع بعد 3 ثواني.",
      bmp_how_ring_last: "حلبة من غير سور: زُق العربيات برّه. اللي يقع يخرج، وآخر واحد فوق الحلبة يكسب.",
      bmp_lobby_wait: "المضيف بيختار طريقة اللعب. شاشة العرض هي الملعب، وموبايلك هو الدركسيون.",
      bmp_boost: "تيربو",
      bmp_horn: "كلاكس",
      bmp_ghost: "شبح: كمّل خبّط!",
      bmp_fell_out: "وقعت برّه",
      bmp_pushes: "زقّة",
      bmp_bumps: "خبطة",
      bmp_place: "{n} من {of}",
      bmp_winners: "{name} كسبوا!",
      bmp_stats: "السرعة والرسايل",
      bmp_len: "مدة الجولة",
      bmp_m60: "دقيقة",
      bmp_m120: "دقيقتين",
      bmp_m180: "3 دقايق",
      bmp_need_tv: "افتح شاشة العرض على لابتوب أو تلفزيون: العربيات بتجري عليها، والموبايلات دركسيونات.",
      bmp_start_need_tv: "تبدأ لما شاشة العرض تفتح في الغرفة",
      bmp_tv_other: "اللعبة شغالة على الشاشة التانية",
      bmp_stick: "🕹️ عصاية",
      bmp_tilt: "🎮 ميّل",
      bmp_auto: "⚡ دوس تلقائي",
      bmp_brake: "فرامل",
      bmp_back_stick: "🕹️ العصاية",
      bmp_sound_tap: "🔊 اضغط هنا عشان الصوت",
      bmp_gas: "دوس",
      bmp_ping: "التأخير",
      bmp_go: "يلا!",
      bmp_over: "الجولة خلصت",
      bmp_again: "جولة كمان",
      bmp_end_now: "خلّص الجولة",
      bmp_no_report: "مفيش شاشة عرض سجّلت النتيجة.",
      bmp_msgs: "رسايل في الثانية",
      bmp_quota: "ساعة لعب ≈ {n}% من المجاني في اليوم",
      bmp_winner: "{name} أكتر واحد خبط!",
      bmp_look_tv: "بص على التلفزيون 👀",
      bmp_flip: "↔ اعكس الاتجاه",
      bmp_center: "🎯 سنتر",
      bmp_car_title: "عربيتك",
      bmp_car_hint: "اسحب يمين وشمال · كل العربيات بتمشي زي بعض",
      bmp_car_prev: "العربية اللي قبلها",
      bmp_car_next: "العربية اللي بعدها",
      bmp_car_tv: "كل واحد بيختار عربيته",
      bmp_body_bumper: "عربية التصادم",
      bmp_body_taxi: "التاكسي الأبيض والأسود",
      bmp_body_tuktuk: "التوك توك",
      bmp_body_micro: "الميكروباص",
      bmp_body_cart: "عربية الآيس كريم",
      bmp_body_bumper_s: "عربية تصادم",
      bmp_body_taxi_s: "تاكسي",
      bmp_body_tuktuk_s: "توك توك",
      bmp_body_micro_s: "ميكروباص",
      bmp_body_cart_s: "آيس كريم",
    },
    en: {
      bmp_mode: "Way to play",
      bmp_mode_balloons: "Balloons",
      bmp_mode_points: "Points",
      bmp_mode_ring: "The ring",
      bmp_mode_ring_clock: "The ring, on the clock",
      bmp_mode_ring_last: "The ring: last one on",
      bmp_ring_win: "Who wins the ring?",
      bmp_ring_clock: "Most push-offs in time",
      bmp_ring_last: "Last one standing",
      bmp_how_balloons: "Every car has 3 balloons, and a bump pops one of the bumped car's. Out of balloons, you drive on as a ghost; the last car with balloons wins.",
      bmp_how_points: "Every bump you drive into someone is a point. Most bumps when the time runs out wins.",
      bmp_how_ring_clock: "A ring with no rail: push the others off. Every push-off is a point, and whoever falls is back in 3 seconds.",
      bmp_how_ring_last: "A ring with no rail: push the others off. Fall off and you're out; the last one on the ring wins.",
      bmp_lobby_wait: "The host picks the way to play. The big screen is the rink, and your phone is the wheel.",
      bmp_boost: "Turbo",
      bmp_horn: "Horn",
      bmp_ghost: "Ghost: keep bumping!",
      bmp_fell_out: "You fell off",
      bmp_pushes: "push-offs",
      bmp_bumps: "bumps",
      bmp_place: "{n} of {of}",
      bmp_winners: "{name} win!",
      bmp_stats: "Speed & traffic",
      bmp_len: "Round length",
      bmp_m60: "1 min",
      bmp_m120: "2 min",
      bmp_m180: "3 min",
      bmp_need_tv: "Open the big screen on a laptop or TV: the cars drive there, and the phones are the controllers.",
      bmp_start_need_tv: "Starts once a big screen is open in the room",
      bmp_tv_other: "The game is on the other screen",
      bmp_stick: "🕹️ Stick",
      bmp_tilt: "🎮 Tilt",
      bmp_auto: "⚡ Auto gas",
      bmp_brake: "Brake",
      bmp_back_stick: "🕹️ Stick",
      bmp_sound_tap: "🔊 Tap here for sound",
      bmp_gas: "Gas",
      bmp_ping: "Delay",
      bmp_go: "Go!",
      bmp_over: "Round over",
      bmp_again: "Another round",
      bmp_end_now: "End the round",
      bmp_no_report: "No big screen recorded the score.",
      bmp_msgs: "Messages a second",
      bmp_quota: "An hour of play ≈ {n}% of the free daily allowance",
      bmp_winner: "{name} bumped the most!",
      bmp_look_tv: "Look at the TV 👀",
      bmp_flip: "↔ Flip steering",
      bmp_center: "🎯 Centre",
      bmp_car_title: "Your car",
      bmp_car_hint: "Swipe left or right · every car drives the same",
      bmp_car_prev: "Previous car",
      bmp_car_next: "Next car",
      bmp_car_tv: "Everyone picks a car",
      bmp_body_bumper: "The bumper car",
      bmp_body_taxi: "The black-and-white taxi",
      bmp_body_tuktuk: "The tuk-tuk",
      bmp_body_micro: "The microbus",
      bmp_body_cart: "The ice-cream cart",
      bmp_body_bumper_s: "Bumper car",
      bmp_body_taxi_s: "Taxi",
      bmp_body_tuktuk_s: "Tuk-tuk",
      bmp_body_micro_s: "Microbus",
      bmp_body_cart_s: "Ice cream",
    }
  },
  rules: {
    ar: {
      bumper: `
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li>لازم <b>شاشة عرض</b> (لابتوب أو تلفزيون داخل الغرفة كشاشة): الحلبة عليها، وكل موبايل <b>دركسيون</b> عربية. المضيف يقدر يضيف عربيات كمبيوتر سهلة أو صعبة.</li>
                <li>🎈 <b>بالونات</b>: كل عربية معاها 3 بالونات، والخبطة بتفرقع بالونة من اللي اتخبط. اللي بالوناته تخلص يكمّل <b>شبح</b> يخبّط من غير ما يفرقع، وآخر واحد معاه بالونات يكسب.</li>
                <li>💥 <b>نقط</b>: كل خبطة تجيبها وأنت اللي داخل بنقطة، وأكتر واحد لما الوقت يخلص يكسب.</li>
                <li>مين اللي خبط؟ العربية اللي كانت داخلة على التانية أسرع. من الجنب أو من ورا الخبطة ليك. <b>وش في وش بنفس السرعة تقريبًا تعادل</b>: محدش بيكسب ولا بيخسر حاجة.</li>
                <li>⭕ <b>الحلبة</b>: من غير سور، زُق العربيات برّه. المضيف يختار: أكتر زقّة في الوقت (اللي يقع يرجع بعد 3 ثواني)، أو آخر واحد فوق.</li>
                <li>⚽ <b>كورة</b>: الأحمر ضد الأزرق، كل واحد يختار فريقه، والكمبيوتر يكمّل الناحية الفاضية. الجون لما الكورة كلها تعدّي الخط، والخبطة مبتحسبش. الساعة بتنهي الماتش، و<b>التعادل جون ذهبي</b> (دقيقة بالكتير، وبعدها تعادل).</li>
                <li>🕹️ <b>العصاية</b>: حرّك صباعك والعربية تمشي ناحيته. 🎮 <b>ميّل</b>: امسك الموبايل بالعرض زي الدركسيون ولفّه، واضغط «دوس» أو شغّل «⚡ دوس تلقائي». 🚀 <b>تيربو</b> كل 4 ثواني، و📯 <b>كلاكس</b> بصوت عربيتك على التلفزيون.</li>
                <li>🚕 <b>اختار عربيتك</b> من موبايلك قبل الجولة: عربية التصادم، التاكسي، التوك توك، الميكروباص أو عربية الآيس كريم. كلهم بيمشوا زي بعض بالظبط، وموبايلك بيفتكر اختيارك للمرة الجاية.</li>
            </ol>`,
    },
    en: {
      bumper: `
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li>You need a <b>big screen</b> (a laptop or TV in the room as a screen): the rink is there, and every phone is one car's <b>controller</b>. The host can add easy or hard computer cars.</li>
                <li>🎈 <b>Balloons</b>: every car has 3 balloons, and a bump pops one of the bumped car's. Out of balloons, you drive on as a <b>ghost</b> that bumps but pops nothing; the last car with balloons wins.</li>
                <li>💥 <b>Points</b>: every bump you drive into someone is a point; most when the time runs out wins.</li>
                <li>Who bumped whom? The car that was driving into the other faster. From the side or from behind, the hit is yours. <b>Head-on at about the same speed is a draw</b>: nobody wins or loses anything.</li>
                <li>⭕ <b>The ring</b>: no rail, push the others off. The host picks: most push-offs in time (the fallen are back in 3 seconds), or the last one on.</li>
                <li>⚽ <b>Ball</b>: Red against Blue; everyone picks a side, and a computer car fills an empty one. A goal is the whole ball over the line; bumps score nothing. The clock ends the match, and <b>a draw goes to a golden goal</b> (a minute at most, then a draw).</li>
                <li>🕹️ <b>Stick</b>: move your finger and the car drives that way. 🎮 <b>Tilt</b>: hold the phone sideways like a wheel and turn it, and hold Gas or switch on «⚡ Auto gas». 🚀 <b>Turbo</b> every 4 seconds, and 📯 a <b>horn</b> with your car's own sound on the TV.</li>
                <li>🚕 <b>Pick your car</b> on your phone before the round: the bumper car, the taxi, the tuk-tuk, the microbus or the ice-cream cart. They all drive exactly the same, and your phone remembers your pick for next time.</li>
            </ol>`,
    }
  }
});
