/* battleship: the words only this game's screens show, and its rules (Help, the
   first-play card). The build puts them into TRANSLATIONS and GAME_RULES (tools/game-text.cjs):
   read them as t.<key> and GAME_RULES[lang].<id>, as everywhere. */
gameText({
  rules: {
    ar: {
      battleship: `
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li>كل واحد له بحر 10×10 و<b>5 سفن</b>: حاملة طائرات (5)، بارجة (4)، طرّاد (3)، غواصة (3) ومدمّرة (2). السفن مخبّية عن التاني.</li>
                <li>حط سفنك: <b>اسحب</b> السفينة عشان تحركها، <b>دوس عليها</b> عشان تلفها، أو 🎲 لأسطول عشوائي. <b>مفيش سفينتين يلمسوا بعض</b>، ولا حتى من الركن.</li>
                <li>بالدور، اختار مربع في بحر التاني واضرب. كل مربع له اسم زي <b>B7</b>: الحرف للعمود والرقم للصف. دوسة تنشّن، ودوسة تانية تضرب.</li>
                <li><b>إصابة؟ اضرب تاني.</b> في المية؟ الدور بيروح للتاني.</li>
                <li>السفينة اللي تغرق بتبان كاملة وبتعرف هي أنهي سفينة، والمية اللي حواليها بتتعلّم، لأن مفيش سفينة ممكن تكون لازقة فيها.</li>
                <li>اللي يغرّق الأسطول كله الأول يكسب، وفي الآخر الأسطولين بيبانوا.</li>
            </ol>
            <p class="help-sub">📡 الرادار</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li><b>مرة واحدة في اللعبة لكل لاعب</b>: في دورك دوس 📡 واختار مربع، والرادار بيمسح الـ <b>3×3</b> اللي حواليه ويقولك فيهم <b>كام مربع سفن</b> (كل مربع عليه سفينة، مضروب أو لأ)، من غير ما يقولك فين.</li>
                <li>المسح <b>بياخد دورك</b>: مفيش ضربة، والدور بيروح للتاني.</li>
                <li>التاني بيشوف المنطقة اللي اتمسحت على بحره، بس مش الرقم. التلفزيون بيوري المسح والرقم.</li>
                <li>الرادار شغّال من الأول، ويتقفل من الإعدادات قبل اللعب. الموبايل كمان بيستخدم الرادار بتاعه لما مايبقاش عنده إصابة يكمّل عليها.</li>
            </ul>
            <p class="help-sub">🤖 ضد الموبايل</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li><b>سهل</b> بيضرب عشوائي، <b>متوسط</b> بيكمّل حوالين الإصابة لحد ما السفينة تغرق، و<b>صعب</b> بيحسب كل الأماكن اللي السفن لسه ممكن تكون فيها.</li>
                <li>اللي يضرب الأول بيتحدد بالقرعة، والنتيجة بتتجمع ماتش ورا ماتش.</li>
            </ul>
            <p class="help-sub">📱 كل واحد من موبايله</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>اتنين بس بيلعبوا والباقي بيتفرج، وكل واحد شايف أسطوله بس. <b>اللي يكسب يفضل قاعد</b>، واللي عليه الدور في الطابور يقعد قصاده ويضرب هو الأول.</li>
                <li>المضيف يقدر يحط وقت لكل طلقة (15 أو 30 ثانية): لو الوقت خلص، الموبايل بيضرب مربع عشوائي. ومع الوقت ده، رص السفن بياخد <b>دقيقة ونص</b>: لما تخلص، كل واحد بيبحر بالأسطول اللي على شاشته. وفيه زرار للمضيف يلعب بدل موبايل سكت.</li>
                <li>لو حد قاعد خرج من الغرفة، التاني يكسب بالانسحاب.</li>
            </ul>
            <p class="help-sub">📺 على التلفزيون</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>البحرين جنب بعض والطلقات طايرة قدام الكل، ومفيش سفينة بتبان قبل ما تغرق.</li>
            </ul>
            <p class="help-sub">💡 نصايح</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>أصغر سفينة طولها مربعين، فاضرب مربع آه ومربع لأ زي رقعة الشطرنج لحد ما تصيب.</li>
                <li>بعد الإصابة اضرب جنبها، مش في الركن: السفن مستقيمة ومابتلمسش بعض.</li>
            </ul>
            ${TOUR_RULES_HELP.ar}`,
    },
    en: {
      battleship: `
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li>Each player has a 10×10 sea and <b>5 ships</b>: a carrier (5), a battleship (4), a cruiser (3), a submarine (3) and a destroyer (2), hidden from the other.</li>
                <li>Place them: <b>drag</b> a ship to move it, <b>tap</b> it to turn it, or 🎲 for a random fleet. <b>No two ships may touch</b>, not even at a corner.</li>
                <li>Take turns to fire at a square of the other sea. Squares are named like <b>B7</b>: the letter is the column, the number the row. One tap aims, a second fires.</li>
                <li><b>A hit fires again.</b> A splash passes the turn.</li>
                <li>A ship that sinks is shown whole and named, and the water round it is marked, since no ship can lie against it.</li>
                <li>Sink the whole fleet first to win; both fleets are shown at the end.</li>
            </ol>
            <p class="help-sub">📡 The radar</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li><b>Once a game each</b>: on your turn press 📡 and pick a square; the radar sweeps the <b>3×3</b> around it and tells you <b>how many ship squares</b> are in it (every square a ship covers, hit or not) - never where.</li>
                <li>A sweep <b>is your turn</b>: no shot, and the turn passes.</li>
                <li>The other player sees where the sweep went on their own sea, but not the number. The TV shows the sweep and the number.</li>
                <li>The radar is on by default and can be switched off before playing. The phone uses its radar too, when it has no hit to follow.</li>
            </ul>
            <p class="help-sub">🤖 Against the phone</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li><b>Easy</b> fires at random, <b>medium</b> works round a hit until the ship goes down, and <b>hard</b> counts every place the ships afloat could still be.</li>
                <li>Who fires first is drawn at random, and the score runs game after game.</li>
            </ul>
            <p class="help-sub">📱 Everyone on their own phone</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>Only two play at a time and the rest watch; each sees only their own fleet. <b>The winner stays on</b>, and the next in line sits down and fires first.</li>
                <li>The host can put a clock on each shot (15 or 30 seconds): when it runs out, the phone fires at a random square. With that clock on, placing the ships gets <b>a minute and a half</b>: when it is up, each sails with the fleet on their screen. The host also has a button to play for a phone that went quiet.</li>
                <li>A seated player who leaves the room loses by forfeit.</li>
            </ul>
            <p class="help-sub">📺 On the TV</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>Both seas side by side and every shell in flight for all to see - and no ship shows before it sinks.</li>
            </ul>
            <p class="help-sub">💡 Tips</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>The smallest ship is two squares long, so fire on every other square, like a chessboard, until you hit.</li>
                <li>After a hit, fire beside it, not on a corner: ships are straight and never touch.</li>
            </ul>
            ${TOUR_RULES_HELP.en}`,
    }
  }
});
