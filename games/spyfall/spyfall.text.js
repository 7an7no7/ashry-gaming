/* spyfall: the words only this game's screens show, and its rules (Help, the
   first-play card). The build puts them into TRANSLATIONS and GAME_RULES (tools/game-text.cjs):
   read them as t.<key> and GAME_RULES[lang].<id>, as everywhere. */
gameText({
  translations: {
    ar: {
      spy_room_hint: "كل واحد يشوف المكان ودوره على موبايله إلا الجاسوس. اسألوا بعض بحذر، ولما الوقت يخلص التصويت يفتح لوحده.",
      spy_minutes: "وقت الأسئلة (دقايق)",
      spy_two_hint: "جاسوسين محتاجين 6 لاعبين أو أكتر.",
      spy_you_are: "أنت الجاسوس!",
      spy_you_hint: "المكان مجهول. اسمع الأسئلة كويس واعرف مكانهم قبل ما يعرفوك.",
      spy_location: "المكان",
      spy_your_job: "دورك هنا",
      spy_places: "الأماكن المحتملة",
      spy_pick_place: "اختار المكان اللي تفتكره",
      spy_cross_hint: "اضغط على مكان عشان تشطبه عندك بس",
      spy_guess_only_spy: "الزرار ده للجاسوس بس: أنت عارف المكان",
      spy_start_vote: "التصويت على الجاسوس",
      spy_wait_vote: "المضيف يفتح التصويت، أو يفتح لوحده لما الوقت يخلص",
      spy_room_guess_hint: "اتمسكت! فرصة أخيرة: اختار المكان.",
      spy_guessing: "الجاسوس اتمسك وبيخمّن المكان…",
      spy_escaped: "الجاسوس هرب! كان {name}",
      spy_stole: "الجاسوس ({name}) عرف المكان وسرق الفوز",
      spy_caught: "مسكتوا الجاسوس ({name}) وغلط في المكان",
      spy_confirm_guess: "المكان هو {place}؟",
      spy_tv_hint: "الجاسوس واحد منكم",
      spy_badge: "جاسوس؟",
      spy_civilian: "مواطن في المكان",
      spy_wins: "الجاسوس كسب!",
      spy1_guess_title: "الجاسوس كشف نفسه! اختار المكان",
      spy1_guess_hint: "صح يبقى الجاسوس كسب، غلط يبقى الطاولة كسبت.",
    },
    en: {
      spy_room_hint: "Everyone sees the place and their job on their phone except the spy. Ask carefully; when time is up the vote opens by itself.",
      spy_minutes: "Question time (minutes)",
      spy_two_hint: "Two spies need 6 or more players.",
      spy_you_are: "You are the spy!",
      spy_you_hint: "The place is unknown. Listen to the questions and work it out before they work you out.",
      spy_location: "The place",
      spy_your_job: "Your job here",
      spy_places: "Possible places",
      spy_pick_place: "Pick the place you think it is",
      spy_cross_hint: "Tap a place to cross it out, on your phone only",
      spy_guess_only_spy: "Only the spy guesses the place: you already know it",
      spy_start_vote: "Vote on the spy",
      spy_wait_vote: "The host opens the vote, or it opens by itself when time is up",
      spy_room_guess_hint: "Caught! One last chance: pick the place.",
      spy_guessing: "The spy was caught and is guessing the place…",
      spy_escaped: "The spy got away! It was {name}",
      spy_stole: "{name} knew the place and stole the win",
      spy_caught: "You caught {name}, and they got the place wrong",
      spy_confirm_guess: "The place is {place}?",
      spy_tv_hint: "The spy is one of you",
      spy_badge: "Spy?",
      spy_civilian: "At the place",
      spy_wins: "The spy wins!",
      spy1_guess_title: "The spy owns up! Pick the place",
      spy1_guess_hint: "Right and the spy wins; wrong and the table wins.",
    }
  },
  rules: {
    ar: {
      spyfall: `
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li>الكل في نفس <b>المكان</b> (مطار، مستشفى…) وكل واحد ليه دور فيه، إلا <b>الجاسوس</b> اللي مش عارف المكان.</li>
                <li>مرر الموبايل: كل واحد يدوس مطوّل على الكارت ويشوف المكان ودوره، وأول ما يشيل صباعه يستخبى.</li>
                <li>اسألوا بعض أسئلة عن المكان من غير ما تقولوه: «بتيجي هنا كتير؟». الإجابة الواضحة زيادة بتفضح المكان للجاسوس، والإجابة المهزوزة بتفضح الجاسوس.</li>
                <li>الجاسوس يقدر يوقّف اللعبة في أي وقت ويخمّن المكان (زرار 🕵️ تحت الأماكن) من قايمة 24 مكان، المكان الصح وسطهم. لو صاب، يكسب.</li>
                <li>لما الوقت يخلص أو تتفقوا، صوّتوا على الجاسوس. لو مسكتوه عنده فرصة أخيرة يخمّن المكان.</li>
                <li><b>العب تاني</b> يوزّع من جديد لنفس اللاعبين ويكمّل النقط: مسكتوه وغلط = نقطة لكل واحد، هرب أو عرف المكان = نقطتين للجاسوس.</li>
            </ol>
            <p class="help-sub">📱 على موبايلات منفصلة</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>كل واحد يشوف المكان ودوره على موبايله. المؤقت على السيرفر، ولما يخلص التصويت يفتح لوحده. قايمة الأماكن المحتملة على كل موبايل وعلى التلفزيون، واضغط على مكان عشان تشطبه عندك.</li>
                <li>النقاط: مسكتوا الجاسوس وغلط = نقطة لكل واحد. هرب أو عرف المكان = نقطتين له. جاسوسين محتاجين 6 لاعبين.</li>
            </ul>`,
    },
    en: {
      spyfall: `
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li>Everyone is at the same <b>place</b> (an airport, a hospital…) with a job there, except the <b>spy</b>, who doesn't know the place.</li>
                <li>Pass the phone: each player presses and holds the card to see the place and their job; it hides again the moment they let go.</li>
                <li>Ask each other about the place without naming it: "Do you come here often?". Too clear an answer gives the place to the spy; a shaky one gives the spy away.</li>
                <li>The spy can stop the game at any time and guess the place (the 🕵️ button under the places) from a card of 24, the real one among them. Right, and they win.</li>
                <li>When time is up, or you agree, vote on the spy. If caught, the spy gets one last guess at the place.</li>
                <li><b>Play again</b> deals again to the same table and keeps score: caught and wrong = a point each, escaped or found the place = two for the spy.</li>
            </ol>
            <p class="help-sub">📱 On separate phones</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>Everyone sees the place and their job on their own phone. The clock runs on the server and the vote opens by itself when it ends. The candidate places are on every phone and the TV; tap one to cross it out for yourself.</li>
                <li>Points: catch the spy and they guess wrong = a point each. They escape or guess right = two points. Two spies need 6 players.</li>
            </ul>`,
    }
  }
});
