/* dots: the words only this game's screens show, and its rules (Help, the
   first-play card). The build puts them into TRANSLATIONS and GAME_RULES (tools/game-text.cjs):
   read them as t.<key> and GAME_RULES[lang].<id>, as everywhere. */
gameText({
  translations: {
    ar: {
      dots_line_hint: "اضغط بين نقطتين جنب بعض عشان ترسم خط",
      dots_board_label: "لوحة نقط ومربعات: {a} مقابل {b}",
    },
    en: {
      dots_line_hint: "Tap between two dots side by side to draw a line",
      dots_board_label: "Dots and Boxes board: {a} to {b}",
    }
  },
  rules: {
    ar: {
      dots: `
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li>لوحة نقط. بالدور، كل واحد يرسم <b>خط واحد</b> بين نقطتين جنب بعض (أفقي أو رأسي).</li>
                <li>اللي يقفل الضلع الرابع لمربع ياخده، ويتكتب عليه أول حرف من اسمه، و<b>يلعب تاني</b>.</li>
                <li>لما المربعات كلها تتقفل، اللي معاه مربعات أكتر يكسب. ممكن تبقى تعادل.</li>
                <li>اللوحة 4×4 أو 6×6 أو 8×8 مربع. النتيجة بتتجمع ماتش ورا ماتش، واللي بدأ يبدأ التاني الماتش الجاي. مفيش رجوع في الحركة.</li>
                <li>ضد الموبايل: <b>سهل</b> بيرسم أي حاجة، <b>متوسط</b> بياخد المربعات وما بيدّيش ضلع تالت، <b>صعب</b> بيلعب السلاسل صح.</li>
            </ol>
            <p class="help-sub">📱 كل واحد من موبايله</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>اتنين بس بيلعبوا في المرة، والباقي بيتفرج. <b>اللي يكسب يفضل قاعد</b>، واللي عليه الدور في الطابور يقعد قصاده ويبدأ هو.</li>
                <li>لو حد قاعد خرج من الغرفة، التاني يكسب بالانسحاب. ولو موبايل اللي عليه الدور فصل <b>دقيقة</b>، بيخسر الماتش ده غياب (وبيفضل في الغرفة).</li>
                <li>آخر خط في اللوحة، لو مش هيكسّبك، بيترسم لوحده بعد لحظة.</li>
            </ul>
            <p class="help-sub">📺 على التلفزيون</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>اللوحة كبيرة، والخط بيترسم والمربع بيتلوّن قدام الكل.</li>
            </ul>
            <p class="help-sub">💡 نصايح</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>ما ترسمش الضلع التالت لمربع طول ما فيه خط تاني آمن.</li>
                <li>آخر اللعبة المربعات بتبقى سلاسل. أحياناً تسيب آخر مربعين لصاحبك عشان يضطر هو يفتح السلسلة الكبيرة.</li>
            </ul>
            ${TOUR_RULES_HELP.ar}`,
    },
    en: {
      dots: `
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li>A board of dots. Take turns drawing <b>one line</b> between two dots side by side (across or down).</li>
                <li>Close the fourth side of a box and it is yours, marked with your initial, and you <b>go again</b>.</li>
                <li>When every box is taken, whoever has more wins. It can end level.</li>
                <li>The board is 4×4, 6×6 or 8×8 boxes. The score adds up game after game, and whoever went second starts the next. No take-backs.</li>
                <li>Against the phone: <b>easy</b> draws anything, <b>medium</b> takes boxes and never gives a third side, <b>hard</b> plays the chains properly.</li>
            </ol>
            <p class="help-sub">📱 On separate phones</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>Two play at a time and the rest watch. <b>Winner stays on</b>; the next in line sits down against them and moves first.</li>
                <li>If a seated player leaves the room, the other wins by forfeit. If the phone whose turn it is goes offline for <b>a minute</b>, that player loses this game by absence (and stays in the room).</li>
                <li>The last line on the board, when it doesn't win you the game, is drawn for you after a moment.</li>
            </ul>
            <p class="help-sub">📺 On the TV</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>The board big, each line drawing itself and each box filling in front of everyone.</li>
            </ul>
            <p class="help-sub">💡 Tips</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>Never draw the third side of a box while a safe line is left.</li>
                <li>Late in the game the boxes form chains. Sometimes leave the last two for your rival, so they have to open the long chain.</li>
            </ul>
            ${TOUR_RULES_HELP.en}`,
    }
  }
});
