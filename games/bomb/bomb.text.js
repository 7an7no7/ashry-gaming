/* bomb: the words only this game's screens show, and its rules (Help, the
   first-play card). The build puts them into TRANSLATIONS and GAME_RULES (tools/game-text.cjs):
   read them as t.<key> and GAME_RULES[lang].<id>, as everywhere. */
gameText({
  translations: {
    ar: {
      bomb_category_label: "الفئة",
      bomb_letter_label: "الحرف",
      bomb_category_hint: "قول حاجة من الفئة دي ومرّر الموبايل بسرعة",
      bomb_letter_hint: "قول أي كلمة تبدأ بالحرف ده ومرّر الموبايل",
      bomb_room_category_hint: "قول حاجة من الفئة دي ومرّر القنبلة بسرعة",
      bomb_room_letter_hint: "قول أي كلمة تبدأ بالحرف ده ومرّر القنبلة",
      bomb_boom: "بووم!",
      bomb_boom_hint: "اللي القنبلة في إيده خسر الجولة",
      bomb_next_round: "جولة جديدة",
      bomb_swap: "فئة تانية",
      bomb_bub_0: "سلّم! 😄",
      bomb_bub_1: "بسرعة!",
      bomb_bub_2: "مش أنا!",
      bomb_bub_3: "هتفرقع!",
      bomb_sound_hint: "الصوت واقف: دوس على الشاشة عشان تسمع التكتكة",
      bomb_send_back: "رجّعها لـ {name} ↩",
      bomb_send_back_hint: "لو مرّرها من غير ما يقول حاجة.",
      bomb_room_hint: "الفئة على الشاشة، والقنبلة على موبايل واحد منكم: اللي معاه يقول كلمة ويضغط مرّر. لما تفرقع، اللي كانت في إيده ياخد ضربة.",
      bomb_room_yours: "معاك!",
      bomb_room_pass: "مرّرها",
      bomb_room_pass_hint: "قول حاجة من الفئة، وبعدين مرّر",
      bomb_room_with: "القنبلة عند {name}",
      bomb_room_fix: "مش هو؟ صحّح",
      bomb_room_loser: "💥 كانت في إيد {name}",
      bomb_room_strikes: "الضربات (الأقل أحسن)",
      bomb_room_who: "مين كانت في إيده؟",
      bomb_safest: "مين نجا أكتر؟",
      bomb_safest_hint: "الرقم = الجولات اللي فرقعت فيها القنبلة في إيد غيره",
      bm1_holding: "💣 القنبلة في إيد {name}",
      bm1_pass: "سلّم القنبلة",
      bm1_give_to: "القنبلة لـ {name}",
      bm1_fix_hint: "لو كانت في إيد حد تاني، اختاره.",
    },
    en: {
      bomb_category_label: "Category",
      bomb_letter_label: "Letter",
      bomb_category_hint: "Say something in this category and pass the phone, fast",
      bomb_letter_hint: "Say any word starting with this letter and pass the phone",
      bomb_room_category_hint: "Say something in this category and pass the bomb, fast",
      bomb_room_letter_hint: "Say any word starting with this letter and pass the bomb",
      bomb_boom: "BOOM!",
      bomb_boom_hint: "Whoever is holding the bomb loses the round",
      bomb_next_round: "New round",
      bomb_swap: "Another category",
      bomb_bub_0: "Pass me on! 😄",
      bomb_bub_1: "Hurry!",
      bomb_bub_2: "Not me!",
      bomb_bub_3: "I'm gonna blow!",
      bomb_sound_hint: "Sound is off: tap the screen to hear the ticking",
      bomb_send_back: "Send it back to {name} ↩",
      bomb_send_back_hint: "For a pass with nothing said.",
      bomb_room_hint: "The category is on the screen and the bomb is on one phone: whoever has it says a word and presses pass. When it goes off, the holder takes a strike.",
      bomb_room_yours: "It's yours!",
      bomb_room_pass: "Pass it",
      bomb_room_pass_hint: "Say something in the category, then pass",
      bomb_room_with: "{name} has the bomb",
      bomb_room_fix: "Not them? Correct it",
      bomb_room_loser: "💥 {name} was holding it",
      bomb_room_strikes: "Strikes (fewer is better)",
      bomb_room_who: "Who was holding it?",
      bomb_safest: "Who survived most",
      bomb_safest_hint: "The number is the rounds it went off in someone else's hands",
      bm1_holding: "💣 {name} has the bomb",
      bm1_pass: "Pass the bomb",
      bm1_give_to: "Give the bomb to {name}",
      bm1_fix_hint: "If someone else had it, tap their name.",
    }
  },
  rules: {
    ar: {
      bomb: `
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li>على الشاشة <b>فئة</b> (أو حرف)، والقنبلة بتدق.</li>
                <li>قول حاجة من الفئة ومرّر الموبايل للي جنبك. ممنوع تعيد كلمة اتقالت.</li>
                <li>الوقت عشوائي ومحدش يعرفه، بس التكتكة بتسرع لما القنبلة تقرّب تفرقع.</li>
                <li>اللي القنبلة في إيده لما تفرقع <b>خسر الجولة</b>. <b>فئة تانية</b> بتغيّر الفئة من غير ما الفتيل يتصفّر.</li>
                <li>اختاروا أسماء اللاعبين في الإعداد: لما تفرقع اضغط على اللي كانت في إيده، والتطبيق يعد، وفي الآخر ترتيب باللي نجا أكتر.</li>
            </ol>
            <p class="help-sub">📺 على التلفزيون</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>افتح غرفة: الفئة تظهر على الشاشة وعلى كل موبايل، والقنبلة على موبايل واحد منكم. اللي معاه يقول كلمة ويضغط <b>مرّرها</b>، وتنط للي بعده بالترتيب اللي على الشاشة. لما تفرقع، اللي كانت في إيده ياخد ضربة لوحده، والأقل ضربات يكسب. الخسران يبدأ الجولة اللي بعدها.</li>
            </ul>`,
    },
    en: {
      bomb: `
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li>A <b>category</b> (or a letter) is on the screen, and the bomb is ticking.</li>
                <li>Say something in the category and pass the phone to the next player. No repeats.</li>
                <li>The time is random and nobody knows it, but the ticking speeds up as it gets close.</li>
                <li>Whoever is holding the bomb when it goes off <b>loses the round</b>. <b>Another category</b> swaps it without resetting the fuse.</li>
                <li>Pick the players' names on the setup: when it goes off, tap whose hands it was in; the app keeps count and ends on a ranking of who survived most.</li>
            </ol>
            <p class="help-sub">📺 On the TV</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>Open a room: the category shows on the screen and on every phone, and the bomb is on one of your phones. Whoever has it says a word and presses <b>Pass it</b>, and it jumps to the next player in the order on the screen. When it goes off, the holder takes a strike, and fewest strikes wins. The loser starts the next round.</li>
            </ul>`,
    }
  }
});
