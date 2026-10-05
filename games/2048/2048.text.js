/* 2048: the words only this game's screens show, and its rules (Help, the
   first-play card). The build puts them into TRANSLATIONS and GAME_RULES (tools/game-text.cjs):
   read them as t.<key> and GAME_RULES[lang].<id>, as everywhere. */
gameText({
  translations: {
    ar: {
      g2048_score: "النقاط",
      g2048_hint: "اسحب بصباعك في أي اتجاه",
      g2048_won: "وصلت {n}! 🎉",
      g2048_goal: "الهدف: {n}",
      g2048_keep_going: "كمّل",
      g2048_keep_hint: "تقدر تكمّل وتوصل لرقم أكبر",
      g2048_over: "خلصت الحركات",
      g2048_top: "أكبر رقم",
    },
    en: {
      g2048_score: "Score",
      g2048_hint: "Swipe in any direction",
      g2048_won: "You made {n}! 🎉",
      g2048_goal: "Goal: {n}",
      g2048_keep_going: "Keep going",
      g2048_keep_hint: "You can keep going for a bigger tile",
      g2048_over: "No moves left",
      g2048_top: "Top tile",
    }
  },
  rules: {
    ar: {
      g2048: `
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li>اسحب بصباعك يمين أو شمال أو فوق أو تحت: كل البلاطات تتزحلق للآخر.</li>
                <li>بلاطتين بنفس الرقم يخبطوا في بعض يبقوا بلاطة واحدة بمجموعهم، والمجموع يتضاف لنقاطك.</li>
                <li>بعد كل حركة بتظهر بلاطة 2 (وساعات 4) في مكان فاضي.</li>
                <li>وصّل لـ <b>2048</b> تكسب، وتقدر تكمّل لأكبر. لو مفيش حركة خلاص، اللعبة خلصت.</li>
                <li>اختار حجم اللوحة: <b>3×3</b> تكسب عند <b>256</b>، <b>4×4</b> عند <b>2048</b>، و<b>5×5</b> عند <b>4096</b>. كل حجم ليه أحسن رقم لوحده.</li>
            </ol>
            <p class="help-sub">💡 نصيحة</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>خلّي أكبر رقم في ركن واحد وماتسيبوش. و↶ بيرجع خطوة واحدة.</li>
            </ul>`,
    },
    en: {
      g2048: `
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li>Swipe left, right, up or down: every tile slides as far as it can.</li>
                <li>Two tiles with the same number merge into one with their sum, which is added to your score.</li>
                <li>After each move a new 2 (sometimes a 4) appears in an empty spot.</li>
                <li>Reach <b>2048</b> to win, and keep going if you like. No move left ends the game.</li>
                <li>Pick a board size: <b>3×3</b> wins at <b>256</b>, <b>4×4</b> at <b>2048</b> and <b>5×5</b> at <b>4096</b>. Each size keeps its own best.</li>
            </ol>
            <p class="help-sub">💡 Tip</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>Keep your biggest tile in one corner. ↶ takes back one move.</li>
            </ul>`,
    }
  }
});
