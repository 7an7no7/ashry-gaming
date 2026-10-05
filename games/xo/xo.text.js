/* xo: the words only this game's screens show, and its rules (Help, the
   first-play card). The build puts them into TRANSLATIONS and GAME_RULES (tools/game-text.cjs):
   read them as t.<key> and GAME_RULES[lang].<id>, as everywhere. */
gameText({
  rules: {
    ar: {
      xo: `
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li>لوحة 3×3. X يبدأ، وكل واحد يحط علامته في خانة فاضية بالدور.</li>
                <li>أول واحد يعمل <b>3 في صف</b> (أفقي، رأسي أو مايل) يكسب. اللوحة اتملت؟ تعادل.</li>
                <li>ضد الموبايل: <b>سهل</b> بيغلط أحياناً، <b>صعب</b> مش بيتغلب. الجولة الجديدة يبدأها الطرف التاني.</li>
            </ol>
            <p class="help-sub">🔁 3 علامات بس</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>مفتاح في الإعدادات، مقفول في الأول. كل واحد له <b>3 علامات بس</b> على اللوحة: الرابعة بتمسح أقدم علامة ليه.</li>
                <li>في دورك، أقدم علامة ليك بتبان <b>باهتة</b>: هي اللي هتختفي مع حركتك، ومتقدرش تحط الجديدة مكانها (لسه على اللوحة وانت بتختار). في دور التاني مش بتبان، فلازم تفتكر أقدم علامة ليه.</li>
                <li><b>مفيش تعادل</b>: اللعب بيكمل لحد ما حد يعمل 3 في صف. الموبايل بيلعبها هو كمان، سهل وصعب، بس الصعب هنا ممكن يتغلب.</li>
            </ul>
            <p class="help-sub">🔲 المقاس الكبير</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>تسع لوحات في لوحة: المربع اللي بتلعبه <b>بيبعت اللي قصادك</b> للوحة اللي في مكانه؛ لو اتكسبت أو اتملت، يلعب في أي لوحة.</li>
                <li><b>3 لوحات على خط</b> تكسب، والتعادل مش لحد. مفيش خط ممكن؟ الأكتر لوحات يكسب.</li>
            </ul>
            <p class="help-sub">📱 كل واحد من موبايله</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>اتنين بس بيلعبوا في المرة، والباقي بيتفرج على نفس اللوحة. <b>اللي يكسب يفضل قاعد</b>، واللي عليه الدور في الطابور يقعد قصاده ويبدأ هو بالـ X.</li>
                <li>المضيف يختار في اللوبي <b>المقاس</b> و<b>3 علامات بس</b>. في دورك أقدم علامة ليك بتبان باهتة على موبايلك بس.</li>
                <li>لو حد قاعد خرج من الغرفة، التاني يكسب بالانسحاب. ولو موبايل اللي عليه الدور فصل <b>دقيقة</b>، بيخسر الماتش ده غياب (وبيفضل في الغرفة)، والعدّاد بيبان عند الباقيين.</li>
                <li>لو فاضل مربع واحد بس ومش هيكسّبك (ولا لوحة)، بيتلعب لوحده بعد لحظة.</li>
            </ul>
            ${TOUR_RULES_HELP.ar}`,
    },
    en: {
      xo: `
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li>A 3×3 board. X starts, and you take turns placing your mark in an empty cell.</li>
                <li>First to make <b>three in a row</b> (across, down or diagonally) wins. Full board? A draw.</li>
                <li>Against the phone: <b>easy</b> slips up now and then, <b>hard</b> cannot be beaten. The other side opens the next round.</li>
            </ol>
            <p class="help-sub">🔁 Only 3 marks</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>A switch in the options, off at first. Each side keeps <b>only 3 marks</b> on the board: your 4th removes your oldest.</li>
                <li>On your turn your oldest mark shows <b>faded</b>: it is the one your move will remove, and the new mark can't go on its square (it is still on the board while you choose). On the other side's turn nothing is faded, so remembering their oldest is up to you.</li>
                <li><b>No draws</b>: play goes on until someone makes three in a row. The phone plays it too, easy and hard, but hard can be beaten here.</li>
            </ul>
            <p class="help-sub">🔲 The big size</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>Nine boards in one: your square <b>sends your opponent</b> to the board in its place; if that one is taken or full, they play anywhere.</li>
                <li><b>Three boards in a row</b> win; a drawn board is nobody's. No line left? Most boards wins.</li>
            </ul>
            <p class="help-sub">📱 On separate phones</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>Two play at a time and everyone else watches the same board. <b>The winner stays on</b>; the next in line sits down and moves first, with X.</li>
                <li>The host picks the <b>size</b> and <b>3 marks only</b> in the lobby. On your turn your oldest mark is faded, on your phone only.</li>
                <li>A seated player who leaves the room loses by forfeit. If the phone whose turn it is goes offline for <b>a minute</b>, that player loses this game by absence (and stays in the room); everyone else sees the count.</li>
                <li>When one square is left and it doesn't win you the game (nor a board), it is played for you after a moment.</li>
            </ul>
            ${TOUR_RULES_HELP.en}`,
    }
  }
});
