/* headsup: the words only this game's screens show, and its rules (Help, the
   first-play card). The build puts them into TRANSLATIONS and GAME_RULES (tools/game-text.cjs):
   read them as t.<key> and GAME_RULES[lang].<id>, as everywhere. */
gameText({
  translations: {
    ar: {
      hu_deck_mix: "مكس",
      hu_deck_movies: "أفلام ومسلسلات",
      hu_deck_people: "مشاهير وشخصيات",
      hu_deck_animals: "حيوانات",
      hu_deck_food: "أكل وشرب",
      hu_deck_jobs: "مهن",
      hu_deck_things: "حاجات وأدوات",
      hu_deck_places: "دول ومدن",
      hu_deck_actions: "أفعال (تمثيل)",
      hu_you: "اللاعب",
      hu_round: "الجولة {n} من {m}",
      hu_turn_of: "دور {name}",
      hu_step_hold: "امسك الموبايل بالعرض على جبهتك، والشاشة ناحية صحابك.",
      hu_step_down: "نزّل راسك لتحت لو عرفت الكلمة.",
      hu_step_up: "ارفع راسك لفوق عشان تفوّتها.",
      hu_ready: "جاهز!",
      hu_sensor_hint: "لو الموبايل مش حاسس بالميل، صحابك يدوسوا صح أو فوت.",
      hu_on_head: "حط الموبايل على راسك",
      hu_pass: "فوت",
      hu_right: "صح",
      hu_got: "صح",
      hu_fix_hint: "المس أي كلمة لو اتحسبت غلط.",
      hu_none: "ولا كلمة المرة دي",
      hu_results: "النتيجة",
      hu_next_of: "الدور على {name}",
      hu_again: "دور كمان",
    },
    en: {
      hu_deck_mix: "Mix",
      hu_deck_movies: "Films & TV",
      hu_deck_people: "Famous people & characters",
      hu_deck_animals: "Animals",
      hu_deck_food: "Food & drink",
      hu_deck_jobs: "Jobs",
      hu_deck_things: "Things & tools",
      hu_deck_places: "Countries & cities",
      hu_deck_actions: "Actions (act it out)",
      hu_you: "Player",
      hu_round: "Round {n} of {m}",
      hu_turn_of: "{name}'s turn",
      hu_step_hold: "Hold the phone sideways on your forehead, screen facing your friends.",
      hu_step_down: "Tip your head down when you get the word.",
      hu_step_up: "Tip your head up to pass.",
      hu_ready: "Ready!",
      hu_sensor_hint: "If the phone doesn't feel the tilt, your friends can press right or pass.",
      hu_on_head: "Put the phone on your head",
      hu_pass: "Pass",
      hu_right: "Right",
      hu_got: "right",
      hu_fix_hint: "Tap a word if it was counted wrong.",
      hu_none: "No words this time",
      hu_results: "Results",
      hu_next_of: "{name} is up",
      hu_again: "Another turn",
    }
  },
  rules: {
    ar: {
      headsup: `
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li>اختاروا الكلمات والوقت، واكتبوا الأسامي لو عايزين نقط لكل واحد.</li>
                <li>اللي عليه الدور يدوس <b>جاهز</b> ويحط الموبايل بالعرض على جبهته، والشاشة ناحية الباقيين.</li>
                <li>الباقيين يوصفوا الكلمة من غير ما يقولوها. <b>نزّل راسك</b> (الشاشة للأرض) لو عرفتها، <b>ارفعها</b> (الشاشة للسقف) عشان تفوّت.</li>
                <li>لما الوقت يخلص تظهر الكلمات. المس أي كلمة اتحسبت غلط عشان تصلحها، وبعدين الدور على اللي بعده.</li>
            </ol>
            <p class="help-sub">💡 نصايح</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>على الآيفون بيطلب إذن الحركة أول مرة: وافق عشان الميل يشتغل.</li>
                <li>لو الموبايل مش بيحس بالميل، الباقيين يدوسوا <b>✓ صح</b> أو <b>⏭ فوت</b> تحت.</li>
                <li><b>أفعال (تمثيل)</b>: بدل الوصف، الباقيين يمثلوا الكلمة.</li>
            </ul>`,
    },
    en: {
      headsup: `
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li>Pick the words and the time, and add names if you want a score for each person.</li>
                <li>Whoever is up presses <b>Ready</b> and holds the phone sideways on their forehead, screen facing the others.</li>
                <li>The others describe the word without saying it. <b>Tip your head down</b> (screen to the floor) when you get it, <b>up</b> (screen to the ceiling) to pass.</li>
                <li>When time runs out the words are listed. Tap any word that was counted wrong to fix it, then the next player is up.</li>
            </ol>
            <p class="help-sub">💡 Tips</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>An iPhone asks for motion access the first time: allow it so the tilt works.</li>
                <li>If the phone doesn't feel the tilt, the others can press <b>✓ Right</b> or <b>⏭ Pass</b> at the bottom.</li>
                <li><b>Actions (act it out)</b>: instead of describing, the others act the word.</li>
            </ul>`,
    }
  }
});
