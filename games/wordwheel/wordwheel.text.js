/* wordwheel: the words only this game's screens show, and its rules (Help, the
   first-play card). The build puts them into TRANSLATIONS and GAME_RULES (tools/game-text.cjs):
   read them as t.<key> and GAME_RULES[lang].<id>, as everywhere. */
gameText({
  translations: {
    ar: {
      wheel_words: "الكلمات",
      wheel_bonus: "كلمة زيادة",
      wheel_shuffle: "لخبط",
      wheel_erase: "امسح آخر حرف",
      wheel_submit: "جرّب الكلمة",
      wheel_already: "الكلمة دي لقيتها قبل كده",
      wheel_big: "الكبيرة",
      wheel_big_found: "الكلمة الكبيرة!",
      wheel_way: "طريقة اللعب",
      wheel_way_solo: "لوحدك",
      wheel_way_duo: "بالدور",
      wheel_way_duo_n: "اتنين على موبايل",
      wheel_way_solo_hint: "خلّص الشبكة كلها في أقل وقت.",
      wheel_way_duo_hint: "كل واحد كلمة في دوره، وكلمته بتتلوّن بلونه. الكلمة بعدد حروفها، والكبيرة بالدبل، والأكتر حروف يكسب.",
      wheel_duo_turn: "دور {name}",
      wheel_duo_won: "{name} كسب!",
      wheel_duo_draw: "تعادل!",
      wheel_duo_letters: "حرف",
    },
    en: {
      wheel_words: "Words",
      wheel_bonus: "Bonus word",
      wheel_shuffle: "Shuffle",
      wheel_erase: "Delete the last letter",
      wheel_submit: "Try the word",
      wheel_already: "You already found that one",
      wheel_big: "Big word",
      wheel_big_found: "The big word!",
      wheel_way: "How to play",
      wheel_way_solo: "On your own",
      wheel_way_duo: "Take turns",
      wheel_way_duo_n: "Two on one phone",
      wheel_way_solo_hint: "Fill the whole grid as fast as you can.",
      wheel_way_duo_hint: "One word each turn, filled in in your colour. A word scores its letters, the big word double; most letters wins.",
      wheel_duo_turn: "{name}'s turn",
      wheel_duo_won: "{name} wins!",
      wheel_duo_draw: "A draw!",
      wheel_duo_letters: "letters",
    }
  },
  rules: {
    ar: {
      wordwheel: `
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li>اسحب صباعك على الحروف اللي في الدايرة بالترتيب عشان تكوّن كلمة، أو المسهم واحد واحد واضغط <b>✓</b>.</li>
                <li>كل كلمة من الكلمات المتقاطعة بتتملى لما تكتبها. خلّصهم كلهم وتكسب.</li>
                <li>كلمة صح مش في الشبكة بتتحسب <b>⭐ كلمة زيادة</b>.</li>
                <li><b>🔀 لخبط</b> بيغيّر أماكن الحروف، و<b>💡 تلميح</b> بيفتح حرف في الشبكة (والوقت ساعتها مش بيدخل في أحسن نتيجة).</li>
                <li><b>🏆 الكلمة الكبيرة</b>: الكلمة اللي فيها كل الحروف بتنوّر بالدهبي.</li>
            </ol>
            <p class="help-sub">👥 بالدور (اتنين على موبايل واحد)</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>كل واحد بيجرّب كلمة في دوره، وبعدها الدور للتاني (كلمة لقيتوها قبل كده مش بتضيّع الدور).</li>
                <li>كلمة الشبكة بتتلوّن بلون اللي لقاها وبتاخد عدد حروفها نقط، و<b>الكلمة الكبيرة بالدبل</b>. الكلمة الزيادة ⭐ من غير نقط.</li>
                <li>لما الشبكة تتملى، الأكتر حروف يكسب. من غير تلميحات.</li>
            </ul>
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
      wordwheel: `
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li>Swipe across the letters in the wheel in order to spell a word, or tap them one by one and press <b>✓</b>.</li>
                <li>A word in the crossword fills in as soon as you make it. Fill them all to win.</li>
                <li>A real word that isn't in the grid counts as a <b>⭐ bonus word</b>.</li>
                <li><b>🔀 Shuffle</b> moves the letters around, and <b>💡 Hint</b> opens a letter in the grid (the time then doesn't count for your best).</li>
                <li><b>🏆 The big word</b>: the word with all the letters lights up in gold.</li>
            </ol>
            <p class="help-sub">👥 Take turns (two on one phone)</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>Each tries one word on their turn, then it passes (a word already found doesn't cost the turn).</li>
                <li>A grid word fills in in its finder's colour and scores its letters; <b>the big word scores double</b>. A ⭐ bonus word scores nothing.</li>
                <li>When the grid is full, most letters wins. No hints.</li>
            </ul>
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
