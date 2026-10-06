/* witness: the words only this game's screens show, and its rules (Help, the
   first-play card). The build puts them into TRANSLATIONS and GAME_RULES (tools/game-text.cjs):
   read them as t.<key> and GAME_RULES[lang].<id>, as everywhere. */
gameText({
  rules: {
    ar: {
      witness: `
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li>كل جولة واحد <b>الشاهد</b> واللي بعده في الدور <b>الرسام</b>، والباقي <b>المحلفين</b>. القضية نكتة عيلية: مين كل آخر حتة كنافة؟</li>
                <li>الشاهد يدوس «وريني الوش» ويشوف وش <b>٨ ثواني بس</b> على موبايله هو، ومحدش غيره يشوفه.</li>
                <li>بعدها يوصفه <b>بكلامه وبصوته</b> والكل سامع، والرسام يبني الوش على موبايله: الشعر، النضارة، الدقن، اللبس، العلامات… عنده <b>٩٠ ثانية</b> ويقدر يخلّص بدري.</li>
                <li>يطلع <b>طابور من ٦ وشوش شبه بعض جدًا</b>، والمحلفين كل واحد يختار من موبايله رقم المشتبه (يقدر يغيّر لحد ما التصويت يقفل).</li>
                <li>🤐 وقت التصويت <b>الشاهد ساكت</b>: ولا كلمة ولا إشارة لحد ما التصويت يقفل. المحلفين بيختاروا من الرسمة والوصف اللي سمعوه بس.</li>
                <li>الأصوات تقع عملات بحرف كل واحد تحت المشتبه، والكشاف ينور على الحقيقي: <b>هو ده!</b></li>
            </ol>
            <p class="help-sub">🏆 النقط</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>كل محلّف عرف الوش الصح ياخد <b>نقطة</b>.</li>
                <li>الشاهد والرسام ياخدوا <b>نقطة لكل محلّف عرفه</b>: وصف حلو ورسم حلو يكسّبوا الاتنين.</li>
                <li>🎯 <b>الرسم مطابق كام في المية؟</b> في الكشف التطبيق يقارن الرسم بالوش الحقيقي حتة حتة (الشعر، العينين، النضارة، الدقن، اللبس…؛ راجل ولا ست ونوع الشعر ولونه بضعف الوزن). <b>٧٠٪ أو أكتر</b>: <b>+١ للشاهد و+١ للرسام</b> فوق نقطهم. أقل من كده النسبة للضحك بس.</li>
                <li>كل واحد يبقى الشاهد <b>مرة واحدة</b>، وبعدها النتيجة النهائية.</li>
            </ul>
            <p class="help-sub">📱 كل واحد من موبايله</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>من 3 لـ12 لاعب. لو الشاهد موبايله نام، المضيف يعدّيه؛ ولو الرسام اتأخر، المضيف يخلّص الرسم.</li>
                <li>اللي يدخل في النص يتفرج، ويلعب اللعبة الجاية.</li>
            </ul>
            <p class="help-sub">📺 على التلفزيون (اختياري)</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>ملف القضية، والرسم وهو بيتبني، والطابور قدام حيطة الطول، والعملات، والكشاف، والنقط. من غير تلفزيون الطابور على كل موبايل.</li>
            </ul>`,
    },
    en: {
      witness: `
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li>Each round one player is <b>the witness</b>, the next in turn <b>the artist</b>, and the rest <b>the jury</b>. The crime is a family joke: who ate the last piece of kunafa?</li>
                <li>The witness taps "Show me the face" and sees a face for <b>8 seconds only</b>, on their own phone; nobody else sees it.</li>
                <li>Then they describe it <b>in their own words, out loud</b>, and everyone hears. The artist builds the face on their phone: hair, glasses, beard, clothes, marks… with <b>90 seconds</b>, and can finish early.</li>
                <li>A <b>lineup of six faces, very alike</b>, comes up, and each juror picks a suspect's number on their phone (they can change it until the vote closes).</li>
                <li>🤐 During the vote <b>the witness stays silent</b>: not a word or a sign until the vote closes. The jury picks from the drawing and the description they heard, nothing else.</li>
                <li>The votes land as coins with each juror's initial under the suspects, and the spotlight falls on the real one: <b>That's him!</b></li>
            </ol>
            <p class="help-sub">🏆 Points</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>Every juror who picks the real face scores <b>a point</b>.</li>
                <li>The witness and the artist score <b>a point for every juror who got it</b>: a good description and a good drawing win together.</li>
                <li>🎯 <b>How close is the sketch?</b> At the reveal the app holds the sketch against the real face feature by feature (hair, eyes, glasses, beard, clothes…; man or woman and the hair's style and colour count double). <b>70% or more</b>: <b>+1 to the witness and +1 to the artist</b> on top of their points. Under that, the % is just for the laugh.</li>
                <li>Everyone is the witness <b>once</b>, then the final result.</li>
            </ul>
            <p class="help-sub">📱 Everyone on their own phone</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>3 to 12 players. If the witness's phone falls asleep the host can skip them; if the artist is slow the host can finish the drawing.</li>
                <li>Someone who joins mid-game watches and plays the next game.</li>
            </ul>
            <p class="help-sub">📺 On the TV (optional)</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>The case file, the sketch as it is built, the lineup against the height wall, the coins, the spotlight and the points. With no TV the lineup is on every phone.</li>
            </ul>`,
    }
  }
});
