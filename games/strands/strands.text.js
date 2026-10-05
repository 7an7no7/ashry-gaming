/* strands: the words only this game's screens show, and its rules (Help, the
   first-play card). The build puts them into TRANSLATIONS and GAME_RULES (tools/game-text.cjs):
   read them as t.<key> and GAME_RULES[lang].<id>, as everywhere. */
gameText({
  rules: {
    ar: {
      strands: `
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li>فوق الشبكة <b>الموضوع</b>، وتحتها خانات الكلمات اللي مستخبية فيها وعدد حروف كل واحدة.</li>
                <li>اسحب صباعك على الحروف في خط مستقيم: بالعرض أو بالطول أو بالمايل. الكلمة الصح بتتلوّن وتطير لمكانها.</li>
                <li>في <b>الصعب</b> الكلمات ممكن تبقى مقلوبة. <b>💡 تلميح</b> بيقولك أول حرف في كلمة.</li>
                <li><b>✍️ من كلماتنا</b>: الكلمات من «كلماتنا» (أو بكودها). <b>الخيط الملوّن</b> اسمها أو أطول كلمة فيها، واللي ناقص بنكمّله بكلمات «من عندنا».</li>
            </ol>
            <p class="help-sub">📱 سباق ألغاز (في غرفة)</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>نفس اللغز للكل، وكل واحد بيحلّه على موبايله. الشاشة والتلفزيون بيوروا التقدم بس: الكلمات اللي اتلقت.</li>
                <li><b>الكل يخلّص</b>: الجولة تخلص لما الكل يخلّص أو الوقت (2 دقايق). الحل 10 نقط + بونص للأسرع (+5، +4…).</li>
                <li><b>Fast 3</b>: أول 3 يخلّصوا ياخدوا 10 و7 و5، وبعدها 10 ثواني لأي حد يلحق ياخد 2، والجولة تقفل. بيتختار لوحده من 5 أشخاص.</li>
                <li><b>استسلم</b> بيخلّصك بصفر عشان الجولة تكمّل. من غير تلميحات.</li>
                ${RACE_MIX_RULE.ar}
            </ul>`,
    },
    en: {
      strands: `
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li>Above the grid is the <b>theme</b>; below it a slot for each hidden word, with its number of letters.</li>
                <li>Drag across the letters in a straight line: across, down or diagonally. A right word is coloured and flies into its slot.</li>
                <li>On <b>hard</b> words can run backwards. <b>💡 Hint</b> shows a word's first letter.</li>
                <li><b>✍️ Our words</b>: the words come from «Our words» (or a code). <b>The coloured thread</b> is their name or longest word; any shortfall is topped up «From us».</li>
            </ol>
            <p class="help-sub">📱 Puzzle race (in a room)</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>The same puzzle for everyone, each solving on their own phone. The screens show progress only: words found.</li>
                <li><b>Everyone finishes</b>: the round ends when everyone is done or the clock runs out (2 minutes). A solve is 10 points plus a bonus for the fastest (+5, +4…).</li>
                <li><b>Fast 3</b>: the first three to finish score 10, 7 and 5; anyone finishing in the ten seconds after scores 2, then the round closes. Preselected from five people.</li>
                <li><b>Give up</b> ends your round with 0 so the others can go on. No hints.</li>
                ${RACE_MIX_RULE.en}
            </ul>`,
    }
  }
});
