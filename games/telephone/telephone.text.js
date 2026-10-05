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
    }
  },
  rules: {
    ar: {
      telephone: `
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li>كل واحد ياخد <b>جملة</b> ويرسمها على موبايله في 75 ثانية.</li>
                <li>رسمتك تروح للي بعدك، ويكتب اللي فاهمه منها في 35 ثانية. وصفه يروح للي بعده يرسمه… وهكذا لحد ما السلسلة تلف (6 خطوات بالكتير).</li>
                <li>في الآخر المضيف يعرض كل سلسلة خطوة خطوة على الموبايلات والتلفزيون: من الجملة الأولى لآخر وصف. مفيش نقاط، الضحك هو اللعبة.</li>
                <li>3 لاعبين على الأقل، و6 أحلى. اللي ما يبعتش في الوقت بتعدّي خطوته فاضية.</li>
            </ol>`,
    },
    en: {
      telephone: `
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li>Everyone gets a <b>phrase</b> and draws it on their phone in 75 seconds.</li>
                <li>Your drawing goes to the next player, who writes what they think it is in 35 seconds. Their description goes to the next, who draws it… until the chain has gone round (6 steps at most).</li>
                <li>At the end the host shows each chain step by step on the phones and the TV: from the first phrase to the last description. No points; the laughing is the game.</li>
                <li>Three players at least, six is best. Anyone who doesn't send in time leaves a blank step.</li>
            </ol>`,
    }
  }
});
