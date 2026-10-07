/* telephone: the words only this game's screens show, and its rules (Help, the
   first-play card). The build puts them into TRANSLATIONS and GAME_RULES (tools/game-text.cjs):
   read them as t.<key> and GAME_RULES[lang].<id>, as everywhere. */
gameText({
  translations: {
    ar: {
      tele_lobby_hint: "كل واحد يرسم ويكتب على موبايله. 3 لاعبين على الأقل، و6 أحلى.",
      tele_draw_this: "ارسم",
      tele_describe_this: "إيه الرسمة دي؟ اكتب اللي شايفه",
      tele_done: "خلصت ✅",
      tele_waiting: "اتبعتت. مستنيين الباقي…",
      tele_progress: "خلصوا",
      tele_step: "خطوة",
      tele_chain_of: "سلسلة {name}",
      tele_wrote: "وصف {name}",
      tele_drew: "رسمة {name}",
      tele_started_with: "بدأت بـ",
      tele_next: "التالي",
      tele_back: "رجوع",
      tele_done_title: "من الأول للآخر",
      tele_tv_working_draw: "الكل بيرسم…",
      tele_tv_working_write: "الكل بيكتب اللي شايفه…",
      tele_write_ph: "اكتب اللي شايفه…",
      tele_write_first: "اكتب حاجة الأول",
      tele_twice: "لفّة كمان",
      tele_twice_hint: "السلسلة تلف على الترابيزة مرتين (6 خطوات)، وكل واحد يقابل سلسلته تاني قرب الآخر.",
      tele_your_turn_tell: "دي سلسلتك: احكيها وانت بتقلّب",
      tele_telling: "{name} بيحكي سلسلته",
    },
    en: {
      tele_lobby_hint: "Everyone draws and writes on their own phone. Three at least, six is best.",
      tele_draw_this: "Draw this",
      tele_describe_this: "What is this? Write what you see",
      tele_done: "Done ✅",
      tele_waiting: "Sent. Waiting for the others…",
      tele_progress: "Done",
      tele_step: "Step",
      tele_chain_of: "{name}'s chain",
      tele_wrote: "{name} wrote",
      tele_drew: "{name} drew",
      tele_started_with: "Started with",
      tele_next: "Next",
      tele_back: "Back",
      tele_done_title: "From first to last",
      tele_tv_working_draw: "Everyone is drawing…",
      tele_tv_working_write: "Everyone is describing a drawing…",
      tele_write_ph: "Describe it…",
      tele_write_first: "Write something first",
      tele_twice: "Round twice",
      tele_twice_hint: "The chains go round the table twice (6 steps), and everyone meets their own chain again near the end.",
      tele_your_turn_tell: "Your chain: tell its story as you go",
      tele_telling: "{name} is telling their chain",
    }
  },
  rules: {
    ar: {
      telephone: `
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li>كل واحد ياخد <b>جملة</b> ويرسمها على موبايله في 75 ثانية.</li>
                <li>رسمتك تروح للي بعدك، ويكتب اللي فاهمه منها في 35 ثانية. وصفه يروح للي بعده يرسمه… وهكذا لحد ما السلسلة تلف (6 خطوات بالكتير).</li>
                <li>في الآخر كل سلسلة تتعرض خطوة خطوة على الموبايلات والتلفزيون، من الجملة الأولى لآخر وصف: صاحب السلسلة هو اللي بيقلّبها من موبايله ويحكيها، والمضيف يقدر يكمّل مكانه. مفيش نقاط، الضحك هو اللعبة.</li>
                <li>🔁 «لفّة كمان» (لـ 3 أو 4 لاعبين): المضيف يخلي السلسلة تلف على الترابيزة مرتين، 6 خطوات، وكل واحد يقابل سلسلته تاني قرب الآخر.</li>
                <li>3 لاعبين على الأقل، و6 أحلى. اللي ما يبعتش في الوقت بتعدّي خطوته فاضية.</li>
            </ol>`,
    },
    en: {
      telephone: `
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li>Everyone gets a <b>phrase</b> and draws it on their phone in 75 seconds.</li>
                <li>Your drawing goes to the next player, who writes what they think it is in 35 seconds. Their description goes to the next, who draws it… until the chain has gone round (6 steps at most).</li>
                <li>At the end each chain is shown step by step on the phones and the TV, from the first phrase to the last description: the chain's owner steps through it from their own phone and tells its story, and the host can take over. No points; the laughing is the game.</li>
                <li>🔁 "Round twice" (for 3 or 4 players): the host can send the chains round the table twice, 6 steps, and everyone meets their own chain again near the end.</li>
                <li>Three players at least, six is best. Anyone who doesn't send in time leaves a blank step.</li>
            </ol>`,
    }
  }
});
