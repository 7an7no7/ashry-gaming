/* tango: the words only this game's screens show, and its rules (Help, the
   first-play card). The build puts them into TRANSLATIONS and GAME_RULES (tools/game-text.cjs):
   read them as t.<key> and GAME_RULES[lang].<id>, as everywhere. */
gameText({
  translations: {
    ar: {
      tango_hint: "= يعني الخانتين زي بعض، × يعني مختلفين",
      tango_run_btn: "⏱️ تحدي التلات دقايق",
      tango_run_hint: "أكتر عدد لوحات سهلة تحلّها في 3 دقايق لعب.",
      tango_run_title: "التحدي",
      tango_run_left: "فاضل",
      tango_run_label: "لوحة اتحلّت",
      tango_run_unit: "لوحات",
      tango_run_done: "⏱️ الوقت خلص!",
    },
    en: {
      tango_hint: "= means the two cells match, × means they differ",
      tango_run_btn: "⏱️ The three-minute challenge",
      tango_run_hint: "As many easy boards as you can solve in three minutes of play.",
      tango_run_title: "Challenge",
      tango_run_left: "Left",
      tango_run_label: "boards solved",
      tango_run_unit: "boards",
      tango_run_done: "⏱️ Time's up!",
    }
  },
  rules: {
    ar: {
      tango: `
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li>لوحة 6×6. املاها ☀️ و🌙: كل صف وكل عمود فيه <b>3 شموس و3 أقمار</b>.</li>
                <li>مفيش 3 زي بعض ورا بعض، لا أفقي ولا رأسي.</li>
                <li>العلامة <b>=</b> بين خانتين يعني زي بعض، و<b>×</b> يعني مختلفين.</li>
                <li>لمسة ☀️، لمستين 🌙، تالتة تمسح. الغلط بيتعلم بالأحمر، وكل لوحة ليها حل واحد.</li>
                <li><b>⏱️ تحدي التلات دقايق</b>: حل أكتر عدد لوحات سهلة في 3 دقايق لعب (الوقت بيقف لو سبت اللوحة). كل لوحة تتحل تيجي اللي بعدها على طول، ومن غير تلميحات. الموبايل بيحفظ أحسن عدد.</li>
            </ol>
            <p class="help-sub">📱 سباق ألغاز (في غرفة)</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>نفس اللغز للكل، وكل واحد بيحلّه على موبايله. الشاشة والتلفزيون بيوروا التقدم بس: الخانات اللي اتملت.</li>
                <li><b>الكل يخلّص</b>: الجولة تخلص لما الكل يخلّص أو الوقت (3 دقايق). الحل 10 نقط + بونص للأسرع (+5، +4…).</li>
                <li><b>Fast 3</b>: أول 3 يخلّصوا ياخدوا 10 و7 و5، وبعدها 10 ثواني لأي حد يلحق ياخد 2، والجولة تقفل. بيتختار لوحده من 5 أشخاص.</li>
                <li><b>استسلم</b> بيخلّصك بصفر عشان الجولة تكمّل. من غير تلميحات.</li>
                ${RACE_MIX_RULE.ar}
            </ul>`,
    },
    en: {
      tango: `
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li>A 6×6 board. Fill it with ☀️ and 🌙: every row and column holds <b>three of each</b>.</li>
                <li>Never three of the same side by side, across or down.</li>
                <li>An <b>=</b> between two cells means they match; <b>×</b> means they differ.</li>
                <li>Tap once for ☀️, twice for 🌙, a third time to clear. Mistakes turn red; every board has one solution.</li>
                <li><b>⏱️ The three-minute challenge</b>: solve as many easy boards as you can in three minutes of play (the clock stops when you leave the board). Each solved board brings the next at once, with no hints. The phone keeps your best count.</li>
            </ol>
            <p class="help-sub">📱 Puzzle race (in a room)</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>The same puzzle for everyone, each solving on their own phone. The screens show progress only: cells filled.</li>
                <li><b>Everyone finishes</b>: the round ends when everyone is done or the clock runs out (3 minutes). A solve is 10 points plus a bonus for the fastest (+5, +4…).</li>
                <li><b>Fast 3</b>: the first three to finish score 10, 7 and 5; anyone finishing in the ten seconds after scores 2, then the round closes. Preselected from five people.</li>
                <li><b>Give up</b> ends your round with 0 so the others can go on. No hints.</li>
                ${RACE_MIX_RULE.en}
            </ul>`,
    }
  }
});
