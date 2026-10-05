/* fiveseconds: the words only this game's screens show, and its rules (Help, the
   first-play card). The build puts them into TRANSLATIONS and GAME_RULES (tools/game-text.cjs):
   read them as t.<key> and GAME_RULES[lang].<id>, as everywhere. */
gameText({
  translations: {
    ar: {
      five_lobby_hint: "كل واحد بالدور: فئة و5 ثواني يقول 3 حاجات منها. المضيف يحكم.",
      five_turn: "الدور على",
      five_go: "جاهز؟ ابدأ الـ5 ثواني",
      five_go_for: "ابدأ لـ {name}",
      five_wait_turn: "استنى دورك…",
      five_say3: "قول 3 من",
      five_up_hint: "يقول 3 حاجات في 5 ثواني",
      five_up_hint_me: "قول 3 حاجات في 5 ثواني",
      five_ok: "عرف",
      five_fail: "مش عرف",
      five_undo: "↶ رجّع آخر حكم",
      five_times_up: "خلص الوقت!",
      five_wait_judge: "المضيف يحكم…",
      five_skip: "عدّي اللاعب ده",
      five_over: "خلصت الجولات",
      five_round: "جولة",
      five_device_ready: "خد الموبايل واضغط لما تكون جاهز",
      five_more_round: "جولة كمان بنفس النقط",
    },
    en: {
      five_lobby_hint: "Each in turn: a category, five seconds to name three things. The host judges.",
      five_turn: "Up now",
      five_go: "Ready? Start the 5 seconds",
      five_go_for: "Start for {name}",
      five_wait_turn: "Wait for your turn…",
      five_say3: "Name 3",
      five_up_hint: "Name 3 things in 5 seconds",
      five_up_hint_me: "Name 3 things in 5 seconds",
      five_ok: "Made it",
      five_fail: "Missed",
      five_undo: "↶ Undo the last verdict",
      five_times_up: "Time's up!",
      five_wait_judge: "The host decides…",
      five_skip: "Skip this player",
      five_over: "All rounds done",
      five_round: "Round",
      five_device_ready: "Take the phone and tap when ready",
      five_more_round: "One more round, scores kept",
    }
  },
  rules: {
    ar: {
      fiveseconds: `
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li>كل واحد بالدور: فئة تظهر (حيوانات المزرعة، ماركات عربيات…) و<b>5 ثواني</b> يقول 3 حاجات منها بصوت عالي.</li>
                <li>الساعة بتدق، ولما تخلص الطاولة تحكم: <b>عرف</b> نقطة، <b>مش عرف</b> ولا حاجة. لو قالهم بسرعة اضغط عرف من غير ما تستنى.</li>
                <li>جولة أو اتنين أو تلاتة لكل لاعب، وأعلى نقاط يكسب.</li>
                <li>في الآخر منصة الفايزين، و<b>جولة كمان</b> تكمّل بنفس النقط.</li>
            </ol>
            <p class="help-sub">📱 على موبايلات منفصلة</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>كل واحد يبدأ ثوانيه من موبايله، والفئة والساعة على كل الموبايلات وعلى التلفزيون. المضيف (أو الشاشة) يحكم.</li>
            </ul>`,
    },
    en: {
      fiveseconds: `
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li>One player at a time: a category shows (farm animals, car brands…) and they have <b>five seconds</b> to name three things in it out loud.</li>
                <li>The clock ticks; when it ends the table judges: <b>Made it</b> is a point, <b>Missed</b> is nothing. If they were fast, press Made it without waiting.</li>
                <li>One, two or three rounds per player, highest score wins.</li>
                <li>It ends on a podium, and <b>one more round</b> carries on with the same scores.</li>
            </ol>
            <p class="help-sub">📱 On separate phones</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>Each player starts their five seconds from their own phone; the category and the clock show on every phone and the TV. The host (or the screen) judges.</li>
            </ul>`,
    }
  }
});
