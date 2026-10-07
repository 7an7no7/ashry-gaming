/* herd: the words only this game's screens show, and its rules (Help, the
   first-play card). The build puts them into TRANSLATIONS and GAME_RULES (tools/game-text.cjs):
   read them as t.<key> and GAME_RULES[lang].<id>, as everywhere. */
gameText({
  translations: {
    ar: {
      herd_lobby_hint: "كل واحد يكتب على موبايله. أكبر مجموعة كتبت نفس الحاجة تاخد نقطة، واللي لوحده ياخد الخروف 🐑 ومايقدرش يكسب وهو معاه.",
      herd_target: "النقط اللي تكسب",
      herd_write_one: "اكتب حاجة واحدة من",
      herd_write_hint: "مش المطلوب إجابة صعبة: اكتب اللي تفتكر إن أغلب اللي قاعدين هيكتبوه.",
      herd_placeholder: "إجابتك…",
      herd_need_answer: "اكتب إجابة الأول",
      herd_wait_others: "استنى الباقيين يكتبوا",
      herd_reveal_now: "اكشف الإجابات دلوقتي",
      herd_merge_hint: "لو فيه إجابتين بنفس المعنى: المس واحدة وبعدين التانية عشان يتجمعوا.",
      herd_merge_into: "دلوقتي المس الإجابة اللي تتجمع معاها (أو نفس الإجابة عشان تلغي).",
      herd_host_checks: "المضيف بيراجع الإجابات قبل النقط.",
      herd_score: "احسب النقط",
      herd_unmerge: "رجّع آخر تجميع",
      herd_pick_you: "اختار يا خروف!",
      herd_pick_wait: "{name} معاه الخروف وبيختار السؤال…",
      herd_pick_hint: "اللي معاه الخروف بيختار سؤال الجولة من التلاتة دول.",
      herd_pick_for: "اختار بداله",
      herd_picked_by: "{name} اختار السؤال ده",
      herd_turn_pick: "اختار السؤال يا خروف",
      herd_majority: "الأغلبية خدت نقطة!",
      herd_no_majority: "مفيش أغلبية المرة دي، محدش خد نقط.",
      herd_sheep_has: "الخروف مع {name}",
    },
    en: {
      herd_lobby_hint: "Everyone writes on their own phone. The biggest group with the same answer scores, and a lone answer takes the sheep 🐑, which can't win while holding it.",
      herd_target: "Points to win",
      herd_write_one: "Write one thing from",
      herd_write_hint: "Don't be clever: write what you think most of the table will write.",
      herd_placeholder: "Your answer…",
      herd_need_answer: "Write an answer first",
      herd_wait_others: "Waiting for the others to write",
      herd_reveal_now: "Show the answers now",
      herd_merge_hint: "Two answers that mean the same thing? Tap one, then the other, to put them together.",
      herd_merge_into: "Now tap the answer it belongs with (or the same one to cancel).",
      herd_host_checks: "The host is checking the answers before the points.",
      herd_score: "Score the round",
      herd_unmerge: "Undo the last grouping",
      herd_pick_you: "Pick one, sheep!",
      herd_pick_wait: "{name} has the sheep and is picking the question…",
      herd_pick_hint: "Whoever has the sheep picks this round's question from these three.",
      herd_pick_for: "Pick for them",
      herd_picked_by: "{name} picked this one",
      herd_turn_pick: "Pick the question, sheep",
      herd_majority: "The herd scores a point!",
      herd_no_majority: "No majority this time, no points.",
      herd_sheep_has: "{name} has the sheep",
    }
  },
  rules: {
    ar: {
      herd: `
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li>سؤال واحد على كل الموبايلات: «اكتب حاجة واحدة من: فواكه». كل واحد يكتب على موبايله من غير ما حد يشوف.</li>
                <li>الهدف مش إجابة ذكية: اكتب <b>اللي هيكتبه أغلب الناس</b>.</li>
                <li>الإجابات تظهر متجمعة (الإملاء مش فارقة). المضيف يقدر يجمع إجابتين بنفس المعنى، و«↶ رجّع آخر تجميع» يلغي آخر تجميع بس.</li>
                <li><b>أكبر مجموعة</b> تاخد نقطة لكل واحد فيها. لو مجموعتين أكبر وقد بعض، محدش ياخد.</li>
                <li>لو <b>واحد بس</b> كتب حاجة محدش كتبها، ياخد <b>الخروف 🐑</b> لحد ما حد تاني يطلع لوحده. اللي معاه الخروف مايقدرش يكسب، بس هو اللي <b>بيختار سؤال الجولة الجاية من تلاتة</b> («اختار يا خروف»).</li>
                <li>أول واحد يوصل للنقط المطلوبة من غير الخروف يكسب.</li>
            </ol>
            <p class="help-sub">📺 على التلفزيون</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>السؤال والإجابات متجمعة والنقط، والمضيف يتحكم من الشاشة.</li>
            </ul>
            <p class="help-sub">⏭️ التالي لوحده</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>اختيار للمضيف في الأوضة، <b>مقفول من الأول</b>: بعد كل نتيجة عدّاد صغير «الجولة الجاية خلال…»، واللي بعدها تيجي لوحدها. المضيف يدوس «التالي» بدري، أو <b>«⏸ استنى»</b> يوقف العد للجولة دي. ولو للعبة آخر، آخر جولة بتروح للنتيجة النهائية.</li>
            </ul>`,
    },
    en: {
      herd: `
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li>One question on every phone: "write one thing from: fruit". Everyone writes on their own phone, unseen.</li>
                <li>The aim isn't a clever answer: write <b>what most people will write</b>.</li>
                <li>The answers show grouped (spelling doesn't matter). The host can join two answers that mean the same thing, and «↶ Undo the last grouping» takes back the last one only.</li>
                <li>The <b>biggest group</b> scores a point each. If two groups tie for biggest, nobody scores.</li>
                <li>If <b>exactly one</b> player wrote something nobody else did, they take <b>the sheep 🐑</b> until someone else stands alone. Whoever holds the sheep can't win, but they <b>pick the next round's question from three</b>.</li>
                <li>The first to the target points without the sheep wins.</li>
            </ol>
            <p class="help-sub">📺 On the TV</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>The question, the grouped answers and the points, with the host's buttons on the screen.</li>
            </ul>
            <p class="help-sub">⏭️ Next by itself</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>The host's choice in the lobby, <b>off to start</b>: after each result a small count «Next round in…», then the next one comes by itself. The host can press «Next» sooner, or <b>«⏸ Wait»</b> to stop the count for that round. In a game with a last round, that one goes to the final result.</li>
            </ul>`,
    }
  }
});
