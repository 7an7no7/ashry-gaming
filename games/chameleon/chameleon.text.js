/* chameleon: the words only this game's screens show, and its rules (Help, the
   first-play card). The build puts them into TRANSLATIONS and GAME_RULES (tools/game-text.cjs):
   read them as t.<key> and GAME_RULES[lang].<id>, as everywhere. */
gameText({
  translations: {
    ar: {
      cham_room_hint: "الكل يشوف نفس الـ16 كلمة. كل واحد يشوف الكلمة السرية على موبايله إلا الحرباء. قولوا كلمة بالدور، وبعدين المضيف يفتح التصويت.",
      cham_you_are: "أنت الحرباء!",
      cham_you_hint: "مش عارف الكلمة السرية. اسمع الباقي وقول كلمة عامة تقنعهم إنك عارف.",
      cham_your_word_hint: "الكلمة السرية مكتوبة على كارتك. قول كلمة تلمّح ليها من غير ما تفضحها.",
      cham_start_vote: "ابدأ التصويت",
      cham_wait_vote: "لما الكل يقول كلمته، المضيف يبدأ التصويت",
      cham_guess_hint: "اتمسكت! فرصة أخيرة: اضغط على الكلمة اللي تفتكرها السرية.",
      cham_guessing: "الحرباء اتمسكت وبتخمّن الكلمة…",
      cham_escaped: "الحرباء هربت! كانت {name}",
      cham_stole: "الحرباء ({name}) اتمسكت بس خمّنت الكلمة صح وسرقت الفوز",
      cham_caught: "مسكتوا الحرباء ({name}) وغلطت في الكلمة",
      cham_confirm_guess: "تخمينك: {word}؟",
      reveal_chameleon_was: "الحرباء كانت…",
      cham_civilian: "مواطن عادي",
      cham_coord_word: "الإحداثيات والكلمة السرية",
      cham_random_cat: "فئة عشوائية",
      cham_wins: "الحرباء كسبت!",
      cham_tie_title: "تعادل! الإعادة",
      cham_tie_hint: "كل واحد من دول يقول كلمة كمان، وبعدين تصوّتوا تاني بينهم بس. تعادل تاني = الحرباء تهرب.",
      cham_revote: "صوّتوا تاني",
      cham_revote_title: "الإعادة: صوّتوا بين المتعادلين بس",
      cham_blame_title: "مين فضحها؟",
      cham_blame_hint: "الحرباء تختار مين كلمته فضحت الكلمة السرية: ينقص نقطة.",
      cham_blame_nobody: "محدش",
      cham_blame_waiting: "الحرباء بتختار مين فضح الكلمة…",
      cham_blamed: "{name} فضحتها: نقطة أقل",
      cham_blamed_none: "محدش فضحها",
      cham_blamed_badge: "فضحتها",
    },
    en: {
      cham_room_hint: "Everyone sees the same 16 words. Each phone marks the secret one, except the chameleon's. Give a clue each in turn, then the host opens the vote.",
      cham_you_are: "You are the chameleon!",
      cham_you_hint: "You don't know the secret word. Listen, then say something vague enough to pass.",
      cham_your_word_hint: "The secret word is on your card. Give a clue that hints at it without giving it away.",
      cham_start_vote: "Start the vote",
      cham_wait_vote: "Once everyone has given a clue, the host starts the vote",
      cham_guess_hint: "Caught! One last chance: tap the word you think is secret.",
      cham_guessing: "The chameleon was caught and is guessing the word…",
      cham_escaped: "The chameleon got away! It was {name}",
      cham_stole: "{name} was caught but guessed the word and stole the win",
      cham_caught: "You caught {name}, and they got the word wrong",
      cham_confirm_guess: "Your guess: {word}?",
      reveal_chameleon_was: "The chameleon was…",
      cham_civilian: "Civilian",
      cham_coord_word: "Coordinates and secret word",
      cham_random_cat: "Random category",
      cham_wins: "The chameleon wins!",
      cham_tie_title: "A tie! The replay",
      cham_tie_hint: "Each of these says one more word, then vote again between them only. Another tie and the chameleon gets away.",
      cham_revote: "Vote again",
      cham_revote_title: "The replay: vote between the tied only",
      cham_blame_title: "Who gave it away?",
      cham_blame_hint: "The chameleon names whose clue gave the secret word away: they lose a point.",
      cham_blame_nobody: "Nobody",
      cham_blame_waiting: "The chameleon is naming who gave the word away…",
      cham_blamed: "{name} gave it away: a point less",
      cham_blamed_none: "Nobody gave it away",
      cham_blamed_badge: "gave it away",
    }
  },
  rules: {
    ar: {
      chameleon: `
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li>16 كلمة في موضوع واحد على الشاشة. الكل يعرف مين فيهم الكلمة السرية، إلا <b>الحرباء</b>.</li>
                <li>مرر الموبايل: كل واحد يدوس مطوّل على الكارت ويشوف دوره، وأول ما يشيل صباعه يستخبى.</li>
                <li>كل واحد يقول <b>كلمة واحدة</b> بالدور ليها علاقة بالكلمة السرية، من غير ما يفضحها.</li>
                <li>الحرباء بتحاول تقول كلمة عامة تقنعكم إنها عارفة.</li>
                <li>صوّتوا على الحرباء. لو مسكتوها، عندها فرصة أخيرة تخمّن الكلمة من اللوحة: لو صابت، هي اللي تكسب.</li>
                <li>لو اتهمتوا الغلط، الحرباء تكسب.</li>
                <li><b>مين فضحها؟</b> لو الحرباء خمّنت الكلمة صح، تختار مين كلمته فضحتها: ينقص نقطة ويتكتب جنبه «فضحتها» الجولة دي، أو تختار «محدش».</li>
                <li>اللوحة بتتلخبط كل جولة، فنفس الموضوع مش بيرجع بنفس الترتيب.</li>
                <li><b>العب تاني</b> يوزّع من جديد لنفس اللاعبين ويكمّل النقط: مسكتوها وغلطت = نقطة لكل واحد، هربت أو خمّنت = نقطتين للحرباء.</li>
            </ol>
            <p class="help-sub">📱 على موبايلات منفصلة</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>اللوحة على كل موبايل وعلى التلفزيون، وكل واحد يشوف كلمته السرية معلّمة على موبايله. المضيف يفتح التصويت، والحرباء تخمّن بالضغط على الكلمة.</li>
                <li>النقاط: مسكتوا الحرباء وغلطت = نقطة لكل واحد. هربت أو خمّنت صح = نقطتين للحرباء.</li>
                <li><b>الإعادة</b>: لو التصويت اتعادل، كل واحد من المتعادلين يقول كلمة كمان وتصوّتوا تاني بينهم بس. تعادل تاني = الحرباء تهرب.</li>
            </ul>`,
    },
    en: {
      chameleon: `
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li>16 words on one topic on the screen. Everyone knows which is the secret one, except the <b>chameleon</b>.</li>
                <li>Pass the phone: each player presses and holds the card to see their role; it hides again the moment they let go.</li>
                <li>In turn, each player says <b>one word</b> related to the secret word without giving it away.</li>
                <li>The chameleon tries to say something vague enough to pass as knowing.</li>
                <li>Vote on the chameleon. If caught, they get one last guess at the word from the board: right, and they win.</li>
                <li>Accuse the wrong person and the chameleon wins.</li>
                <li><b>Who gave it away?</b> If the chameleon guesses the word, they name whose clue gave it away: that player loses a point and wears "gave it away" this round. Or they pick "Nobody".</li>
                <li>The board is shuffled every round, so a topic never comes back in the same order.</li>
                <li><b>Play again</b> deals again to the same table and keeps score: caught and wrong = a point each, escaped or guessed = two for the chameleon.</li>
            </ol>
            <p class="help-sub">📱 On separate phones</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>The board on every phone and the TV, each player's secret word marked on their own phone. The host opens the vote; the chameleon guesses by tapping a word.</li>
                <li>Points: catch the chameleon and they guess wrong = a point each. They escape or guess right = two points for the chameleon.</li>
                <li><b>The replay</b>: if the vote ties, each of the tied says one more word and you vote again between them only. Another tie and the chameleon gets away.</li>
            </ul>`,
    }
  }
});
