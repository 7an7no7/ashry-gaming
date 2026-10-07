/* dots: the words only this game's screens show, and its rules (Help, the
   first-play card). The build puts them into TRANSLATIONS and GAME_RULES (tools/game-text.cjs):
   read them as t.<key> and GAME_RULES[lang].<id>, as everywhere. */
gameText({
  translations: {
    ar: {
      dots_line_hint: "اضغط بين نقطتين جنب بعض عشان ترسم خط",
      dots_board_label: "لوحة نقط ومربعات: {a} مقابل {b}",
      dots_chain: "سلسلة {n}!",
      dots_tip_title: "🔑 سر اللعبة",
      dots_tip_after: "الموبايل الصعب كسب بالسر ده:",
      dots_tip_ok: "فهمت",
    },
    en: {
      dots_line_hint: "Tap between two dots side by side to draw a line",
      dots_board_label: "Dots and Boxes board: {a} to {b}",
      dots_chain: "A chain of {n}!",
      dots_tip_title: "🔑 The secret of the game",
      dots_tip_after: "The hard phone won with this:",
      dots_tip_ok: "Got it",
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
                <li>⏱️ <b>وقت التفكير</b> (اختيار المضيف، مقفول من الأول): 20 أو 40 ثانية للخط. لما يخلص، التطبيق يرسم خط مايدّيش مربع ضلع تالت لو فيه.</li>
                <li>آخر خط في اللوحة، لو مش هيكسّبك، بيترسم لوحده بعد لحظة.</li>
            </ul>
            <p class="help-sub">📺 على التلفزيون</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>اللوحة كبيرة، والخط بيترسم والمربع بيتلوّن قدام الكل.</li>
            </ul>
            <p class="help-sub">🔑 سر اللعبة</p>
            <div class="dots-tip"><p class="dots-tip__lead"><b>اللي يفتح السلسلة الطويلة الأول بيخسر.</b> آخر اللعبة كل خط باقي بيدّي مربعات، فاحسبها عشان صاحبك هو اللي يضطر يفتح الطويلة.</p><div class="dots-tip__frames"><figure class="dots-tip__f"><span class="dots-tip__n">1</span><svg viewBox="-0.3 -0.3 5.6 1.6" aria-hidden="true"><path class="dt-l" d="M0 0H1M0 1H1M2 0H5M2 1H5"/><path class="dt-d" d="M0 0h0M1 0h0M0 1h0M1 1h0M2 0h0M3 0h0M4 0h0M5 0h0M2 1h0M3 1h0M4 1h0M5 1h0"/></svg><figcaption>فاضل سلسلتين: قصيرة وطويلة، والدور عليك</figcaption></figure><figure class="dots-tip__f"><span class="dots-tip__n">2</span><svg viewBox="-0.3 -0.3 5.6 1.6" aria-hidden="true"><path class="dt-l" d="M0 0H1M0 1H1M2 0H5M2 1H5"/><path class="dt-1" d="M0 0V1"/><path class="dt-d" d="M0 0h0M1 0h0M0 1h0M1 1h0M2 0h0M3 0h0M4 0h0M5 0h0M2 1h0M3 1h0M4 1h0M5 1h0"/></svg><figcaption>افتح القصيرة وضحّي بمربع</figcaption></figure><figure class="dots-tip__f"><span class="dots-tip__n">3</span><svg viewBox="-0.3 -0.3 5.6 1.6" aria-hidden="true"><path class="dt-l" d="M0 0H1M0 1H1M2 0H5M2 1H5"/><rect class="dt-b2" x=".12" y=".12" width=".76" height=".76"/><path class="dt-1" d="M0 0V1"/><path class="dt-2" d="M1 0V1M2 0V1"/><path class="dt-d" d="M0 0h0M1 0h0M0 1h0M1 1h0M2 0h0M3 0h0M4 0h0M5 0h0M2 1h0M3 1h0M4 1h0M5 1h0"/></svg><figcaption>صاحبك ياخده، ولازم يرسم تاني: يفتح الطويلة</figcaption></figure><figure class="dots-tip__f"><span class="dots-tip__n">4</span><svg viewBox="-0.3 -0.3 5.6 1.6" aria-hidden="true"><path class="dt-l" d="M0 0H1M0 1H1M2 0H5M2 1H5"/><rect class="dt-b2" x=".12" y=".12" width=".76" height=".76"/><path class="dt-b1" d="M2.12 .12h2.76v.76H2.12z"/><path class="dt-1" d="M0 0V1M3 0V1M4 0V1M5 0V1"/><path class="dt-2" d="M1 0V1M2 0V1"/><path class="dt-d" d="M0 0h0M1 0h0M0 1h0M1 1h0M2 0h0M3 0h0M4 0h0M5 0h0M2 1h0M3 1h0M4 1h0M5 1h0"/></svg><figcaption>وإنت تاخد التلاتة!</figcaption></figure></div></div>
            <p class="help-sub">💡 نصايح</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>ما ترسمش الضلع التالت لمربع طول ما فيه خط تاني آمن.</li>
                <li>لما تاخد مربعات ورا بعض بيظهر عدّاد على اللوحة (×2، ×3…)، والسلسلة من 3 مربعات أو أكتر بتتختم «سلسلة 5!».</li>
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
                <li>⏱️ <b>Think time</b> (the host's choice, off to start with): 20 or 40 seconds a line. When it runs out, the app draws a line that gives no box a third side, if there is one.</li>
                <li>The last line on the board, when it doesn't win you the game, is drawn for you after a moment.</li>
            </ul>
            <p class="help-sub">📺 On the TV</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>The board big, each line drawing itself and each box filling in front of everyone.</li>
            </ul>
            <p class="help-sub">🔑 The secret of the game</p>
            <div class="dots-tip"><p class="dots-tip__lead"><b>Whoever opens the long chain first loses.</b> Late in the game every line left gives boxes away, so count them, and make your rival the one who has to open the long chain.</p><div class="dots-tip__frames"><figure class="dots-tip__f"><span class="dots-tip__n">1</span><svg viewBox="-0.3 -0.3 5.6 1.6" aria-hidden="true"><path class="dt-l" d="M0 0H1M0 1H1M2 0H5M2 1H5"/><path class="dt-d" d="M0 0h0M1 0h0M0 1h0M1 1h0M2 0h0M3 0h0M4 0h0M5 0h0M2 1h0M3 1h0M4 1h0M5 1h0"/></svg><figcaption>Two chains left, short and long, and it is your move</figcaption></figure><figure class="dots-tip__f"><span class="dots-tip__n">2</span><svg viewBox="-0.3 -0.3 5.6 1.6" aria-hidden="true"><path class="dt-l" d="M0 0H1M0 1H1M2 0H5M2 1H5"/><path class="dt-1" d="M0 0V1"/><path class="dt-d" d="M0 0h0M1 0h0M0 1h0M1 1h0M2 0h0M3 0h0M4 0h0M5 0h0M2 1h0M3 1h0M4 1h0M5 1h0"/></svg><figcaption>Open the short one: give one box away</figcaption></figure><figure class="dots-tip__f"><span class="dots-tip__n">3</span><svg viewBox="-0.3 -0.3 5.6 1.6" aria-hidden="true"><path class="dt-l" d="M0 0H1M0 1H1M2 0H5M2 1H5"/><rect class="dt-b2" x=".12" y=".12" width=".76" height=".76"/><path class="dt-1" d="M0 0V1"/><path class="dt-2" d="M1 0V1M2 0V1"/><path class="dt-d" d="M0 0h0M1 0h0M0 1h0M1 1h0M2 0h0M3 0h0M4 0h0M5 0h0M2 1h0M3 1h0M4 1h0M5 1h0"/></svg><figcaption>Your rival takes it, must draw again, and opens the long one</figcaption></figure><figure class="dots-tip__f"><span class="dots-tip__n">4</span><svg viewBox="-0.3 -0.3 5.6 1.6" aria-hidden="true"><path class="dt-l" d="M0 0H1M0 1H1M2 0H5M2 1H5"/><rect class="dt-b2" x=".12" y=".12" width=".76" height=".76"/><path class="dt-b1" d="M2.12 .12h2.76v.76H2.12z"/><path class="dt-1" d="M0 0V1M3 0V1M4 0V1M5 0V1"/><path class="dt-2" d="M1 0V1M2 0V1"/><path class="dt-d" d="M0 0h0M1 0h0M0 1h0M1 1h0M2 0h0M3 0h0M4 0h0M5 0h0M2 1h0M3 1h0M4 1h0M5 1h0"/></svg><figcaption>And you take all three!</figcaption></figure></div></div>
            <p class="help-sub">💡 Tips</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>Never draw the third side of a box while a safe line is left.</li>
                <li>Boxes taken one after another raise a counter on the board (×2, ×3…), and a run of three or more ends with a stamp: «A chain of 5!».</li>
                <li>Late in the game the boxes form chains. Sometimes leave the last two for your rival, so they have to open the long chain.</li>
            </ul>
            ${TOUR_RULES_HELP.en}`,
    }
  }
});
