/* wordle: the words only this game's screens show, and its rules (Help, the
   first-play card). The build puts them into TRANSLATIONS and GAME_RULES (tools/game-text.cjs):
   read them as t.<key> and GAME_RULES[lang].<id>, as everywhere. */
gameText({
  translations: {
    ar: {
      wordle_won: "🎉 عرفتها!",
      wordle_lost: "حظ أوفر!",
      wordle_word_was: "الكلمة كانت:",
      wordle_tries_of: "محاولة من {max}",
      wordle_too_short: "الكلمة لسه ناقصة حروف",
      wordle_not_in_dict: "مش في قاموسنا — دوس تاني لو متأكد",
    },
    en: {
      wordle_won: "🎉 You got it!",
      wordle_lost: "Game over!",
      wordle_word_was: "The word was:",
      wordle_tries_of: "tries out of {max}",
      wordle_too_short: "Not enough letters yet",
      wordle_not_in_dict: "Not in our dictionary — press again if you're sure",
    }
  },
  rules: {
    ar: {
      wordle: `
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li>خمّن الكلمة في 6 محاولات (7 لو الكلمة 7 أو 8 حروف).</li>
                <li><span class="tx-success font-bold">أخضر</span>: حرف صح في مكانه. <span class="tx-warning font-bold">أصفر</span>: حرف صح في مكان غلط. <span class="tx-muted font-bold">رمادي</span>: مش في الكلمة.</li>
                <li>الكلمات مش بتتكرر على نفس الموبايل لحد ما تخلص كلها.</li>
            </ol>
            <p class="help-sub">📅 تحدي اليوم</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>كلمة واحدة من 5 حروف في اليوم، هي هي على كل الموبايلات، و6 محاولات. بتتلعب مرة واحدة: لو سبتها ترجعلها مكان ما وقفت.</li>
                <li>في الآخر ابعت النتيجة على واتساب: مربعات ألوانك (🟩🟨⬛) من غير الحروف، عشان محدش يعرف الكلمة منك.</li>
            </ul>
            <p class="help-sub">👥 كل واحد من موبايله</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li><b>واحد يكتب</b>: واحد يكتب كلمة من 5 لـ 8 حروف والباقي كل واحد يخمّنها في شبكته على موبايله. محدش بيشوف تخمينات التاني.</li>
                <li><b>سباق</b>: التطبيق بيدّي الكل نفس الكلمة من كلمات اللعبة، والمضيف بيختار كام حرف.</li>
                <li>اللي يحلّها ياخد 10، والأول +5، التاني +4… واللي كتبها ياخد 5 عن كل واحد ماعرفهاش. لو اتنين متعادلين، اللي خلّص بمحاولات أقل يسبق.</li>
                <li>المضيف بيختار 3 أو 5 أو 10 كلمات، ووقت لو حابب (90 أو 120 ثانية).</li>
            </ul>
            <p class="help-sub">📺 على التلفزيون</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>ألوان كل واحد (أخضر، أصفر، رمادي) من غير الحروف، عشان محدش يغش من الشاشة. والكلمة بتبان في الآخر.</li>
            </ul>`,
    },
    en: {
      wordle: `
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li>Guess the word in 6 tries (7 for a word of 7 or 8 letters).</li>
                <li><span class="tx-success font-bold">Green</span>: right letter, right place. <span class="tx-warning font-bold">Yellow</span>: right letter, wrong place. <span class="tx-muted font-bold">Grey</span>: not in the word.</li>
                <li>Words don't repeat on the same phone until they have all been played.</li>
            </ol>
            <p class="help-sub">📅 Puzzle of the day</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>One 5-letter word a day, the same on every phone, with 6 tries. It's played once: leave it and it waits where you left it.</li>
                <li>At the end, send your result on WhatsApp: your coloured squares (🟩🟨⬛) without the letters, so nobody learns the word from you.</li>
            </ul>
            <p class="help-sub">👥 Each on their own phone</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li><b>One sets</b>: one writes a word of 5 to 8 letters and everyone else guesses it in their own grid on their own phone. Nobody sees anyone else's guesses.</li>
                <li><b>Race</b>: the app gives everyone the same word from the game's lists; the host picks how many letters.</li>
                <li>A solve is 10 points, +5 for the first, +4 for the second…; the writer scores 5 for everyone who misses it. On a tie, fewer tries ranks higher.</li>
                <li>The host picks 3, 5 or 10 words, and a clock if they like (90 or 120 seconds).</li>
            </ul>
            <p class="help-sub">📺 On the TV</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>Everyone's colours (green, yellow, grey) without the letters, so nobody can copy off the screen. The word shows at the end.</li>
            </ul>`,
    }
  }
});
