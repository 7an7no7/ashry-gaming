/* justone: the words only this game's screens show, and its rules (Help, the
   first-play card). The build puts them into TRANSLATIONS and GAME_RULES (tools/game-text.cjs):
   read them as t.<key> and GAME_RULES[lang].<id>, as everywhere. */
gameText({
  translations: {
    ar: {
      jo_final: "النتيجة النهائية",
      jo_next_guesser: "المخمّن اللي بعده: {name}",
      jo_see_final: "النتيجة النهائية 🏁",
      jo_ready_next: "جاهزين، الجولة الجاية ⬅",
      jo_rate_perfect: "مثالي! ولا كلمة فلتت منكم 🏆",
      jo_rate_great: "رهيب! فريق متفاهم جداً",
      jo_rate_good: "حلو! تقدروا تعملوا أحسن",
      jo_rate_try: "جرّبوا تاني وفكّروا مختلف عن بعض",
      jo_check_title: "الكتّاب بس يبصوا",
      jo_check_hide: "خبّي الموبايل عن {name}",
      jo_check_hint: "المس أي تلميح قريب أوي من تلميح تاني عشان تشيله، والمسه تاني يرجع.",
      jo_check_give: "ادّي الموبايل لـ {name}",
      jo_dup_line: "{names} كتبوا نفس الكلمة!",
      jo_dup_locked: "التلميحات اللي زي بعض بتتشال على طول",
      jo_exact: "الكلمة بالظبط: اتحسبت لوحدها",
    },
    en: {
      jo_final: "Final score",
      jo_exact: "The word exactly: scored by itself",
      jo_next_guesser: "Next guesser: {name}",
      jo_see_final: "Final score 🏁",
      jo_ready_next: "Ready, next round ➡",
      jo_rate_perfect: "Perfect! Not one got away 🏆",
      jo_rate_great: "Brilliant teamwork!",
      jo_rate_good: "Nice! You can do better",
      jo_rate_try: "Try again, think differently from each other",
      jo_check_title: "Writers only",
      jo_check_hide: "Hide the phone from {name}",
      jo_check_hint: "Tap a clue that's too close to another to cross it out; tap again to bring it back.",
      jo_check_give: "Give the phone to {name}",
      jo_dup_line: "{names} wrote the same word!",
      jo_dup_locked: "Matching clues are always removed",
    }
  },
  rules: {
    ar: {
      justone: `
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li>واحد هو <b>المخمّن</b> ومش بيشوف الكلمة. الباقي يشوفوها.</li>
                <li>كل واحد يكتب <b>تلميح واحد</b> من كلمة واحدة.</li>
                <li>التلميحات المتشابهة <b>بتتشال</b> قبل ما المخمّن يشوفها، فحاولوا تفكروا مختلف عن بعض. الإملاء مش فارقة: شمس والشمس وأسد واسد نفس التلميح.</li>
                <li>المخمّن يحاول من التلميحات الباقية. صح = نقطة للفريق كله.</li>
                <li>على موبايل واحد: اختاروا 5 أو 10 أو 13 جولة، وفي الآخر النتيجة النهائية. حكمتوا غلط؟ «رجّع».</li>
            </ol>
            <p class="help-sub">📱 على موبايلات منفصلة</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>الكل يكتب تلميحه في نفس اللحظة، والتطبيق يشيل المتشابه لوحده. كل جولة مخمّن مختلف.</li>
                <li>لو المخمّن كتب الكلمة نفسها (الإملاء مش فارقة) بتتحسب صح على طول. المضيف بيحكم بس لما التخمين قريب.</li>
            </ul>`,
    },
    en: {
      justone: `
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li>One player is the <b>guesser</b> and doesn't see the word. Everyone else does.</li>
                <li>Each player writes <b>one clue</b> of one word.</li>
                <li>Matching clues are <b>removed</b> before the guesser sees them, so think differently from each other. Spelling doesn't matter: شمس and الشمس, أسد and اسد are the same clue.</li>
                <li>The guesser tries from the clues left. Right = a point for the whole team.</li>
                <li>On one phone: pick 5, 10 or 13 rounds and finish on the final score. Judged it wrong? Undo.</li>
            </ol>
            <p class="help-sub">📱 On separate phones</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>Everyone writes their clue at the same time, and the app removes the matches itself. A different guesser every round.</li>
                <li>A guess that is the word itself (spelling aside) counts as right at once. The host only judges a near miss.</li>
            </ul>`,
    }
  }
});
