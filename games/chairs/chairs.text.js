/* chairs: the words only this game's screens show, and its rules (Help, the
   first-play card). The build puts them into TRANSLATIONS and GAME_RULES (tools/game-text.cjs):
   read them as t.<key> and GAME_RULES[lang].<id>, as everywhere. */
gameText({
  translations: {
    ar: {
      mch_chair1: "كرسي واحد",
      mch_chairs2: "كرسيين",
      mch_chairs_n: "{n} كراسي",
      mch_chairs_11: "{n} كرسي",
      mch_music_on: "الموسيقى شغّالة…",
      mch_stopped: "وقفت!",
      mch_out_early: "خرج {name}: قعد قبل ما الموسيقى تقف!",
      mch_out_late: "خرج {name}: ما قعدش",
      mch_out_last: "خرج {name}: آخر واحد قعد",
      mch_out_left: "خرج {name}: ساب الغرفة",
      mch_early_short: "قعد بدري",
      mch_winner: "{name} كسب!",
      mch_order: "مين قعد الأول؟",
      mch_places: "الترتيب",
      mch_wins: "مرات الفوز",
      mch_fake: "وقفات خداعية",
      mch_fake_hint: "الموسيقى ممكن تقف لحظة وترجع… اللي يقعد فيها يخرج.",
      mch_lobby_hint: "الموسيقى بتقف فجأة، وأسرع واحد يضغط «اقعد!» ياخد كرسي. الكراسي أقل من اللاعبين بواحد.",
      mch_alive: "{n} في اللعبة",
      mch_you_out: "خرجت! اتفرج على الباقي",
      mch_watching: "بتتفرج · تلعب اللعبة الجاية",
      mch_wait_btn: "استنى…",
      mch_tap_hint: "اضغط أول ما الموسيقى تقف · اللي يضغط قبلها يخرج",
      mch_voice_you: "🔊 الموسيقى من الموبايل ده",
      mch_voice_tv: "🔊 الموسيقى من التلفزيون",
      mch_voice_host: "🔊 الموسيقى من موبايل المضيف",
      mch_sat: "قعدت رقم {n}",
      mch_sit: "اقعد!",
      mch_safe: "أنت لسه في اللعبة",
      mch_next_now: "الجولة الجاية دلوقتي",
      mch_next_in: "الجولة الجاية بعد {n}…",
      mch_play_again: "العب تاني",
      mch_in_ring: "مين في الحلبة",
      mch_final: "النهائي",
      mch_zaffa: "الزفة! النهائي",
      mch_replay: "إعادة بالبطيء",
      mch_gap: "الفرق",
      mch_secs: "ثانية",
    },
    en: {
      mch_chair1: "1 chair",
      mch_chairs2: "2 chairs",
      mch_chairs_n: "{n} chairs",
      mch_chairs_11: "{n} chairs",
      mch_music_on: "The music is playing…",
      mch_stopped: "It stopped!",
      mch_out_early: "{name} is out: sat before the music stopped!",
      mch_out_late: "{name} is out: never sat down",
      mch_out_last: "{name} is out: the last to sit",
      mch_out_left: "{name} is out: left the room",
      mch_early_short: "too early",
      mch_winner: "{name} wins!",
      mch_order: "Who sat first?",
      mch_places: "The places",
      mch_wins: "Wins",
      mch_fake: "Fake stops",
      mch_fake_hint: "The music may pause for a moment and go on. Whoever sits then is out.",
      mch_lobby_hint: "The music stops out of nowhere and the fastest to tap «Sit!» get the chairs. One chair fewer than players.",
      mch_alive: "{n} in the game",
      mch_you_out: "You're out! Watch the rest",
      mch_watching: "Watching · you play the next game",
      mch_wait_btn: "Wait…",
      mch_tap_hint: "Tap the moment the music stops · tap before it and you're out",
      mch_voice_you: "🔊 The music plays on this phone",
      mch_voice_tv: "🔊 The music plays on the TV",
      mch_voice_host: "🔊 The music plays on the host's phone",
      mch_sat: "You sat {n}.",
      mch_sit: "Sit!",
      mch_safe: "You're still in",
      mch_next_now: "Next round now",
      mch_next_in: "Next round in {n}…",
      mch_play_again: "Play again",
      mch_in_ring: "In the ring",
      mch_final: "The final",
      mch_zaffa: "The zaffa! The final",
      mch_replay: "Slow-motion replay",
      mch_gap: "The gap",
      mch_secs: "s",
    }
  },
  rules: {
    ar: {
      chairs: `
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li>كل واحد بموبايله، والكراسي أقل من اللاعبين بواحد. الموسيقى بتشتغل (من التلفزيون، أو من موبايل المضيف) والكل بيلف حوالين الكراسي على الشاشة.</li>
                <li>الموسيقى بتقف <b>فجأة</b> في وقت محدش يعرفه: كل الموبايلات تهتز وتنوّر، وزرار <b>«اقعد!»</b> يبقى أصفر. أسرع ضغطات تاخد الكراسي، وآخر واحد <b>يخرج</b>. اللي ما يضغطش في 3 ثواني يبقى هو الآخر.</li>
                <li>اللي يضغط <b>قبل</b> ما الموسيقى تقف بيخرج على طول. ومع «وقفات خداعية» الموسيقى ممكن تقف لحظة وترجع… خليك صاحي.</li>
                <li>كل جولة كرسي أقل، لحد ما يفضل واحد وهو الكسبان. الترتيب بيتحسب بلحظة الضغط على موبايلك مش بسرعة النت، فمحدش بيخسر كرسي عشان شبكته بطيئة.</li>
                <li>🎧 <b>دي جي من اللي خرج</b>: من الجولة التانية آخر واحد خرج يوقّف الموسيقى من موبايله (بعد أول 4 ثواني، وإلا تقف لوحدها عند 25)، ومعاه «وقفة خداعية» لو الوقفات شغّالة. مالوش نقط، واللي وقّع أكتر ياخد <b>«أحلى دي جي»</b>.</li>
                <li>🥁 <b>النهائي</b>: لما يفضل اتنين وكرسي واحد، اللعب بيبقى على مسرح بالزفة. وبعد الوقفة إعادة بالبطيء للاتنين وهما بيجروا على الكرسي، والفرق بينهم بالثواني.</li>
            </ol>
            <p class="help-sub">📺 التلفزيون</p>
            <p class="text-xs">الحلبة كبيرة والموسيقى منه، وبيظهر مين قعد الأول وبكام مللي ثانية.</p>`,
    },
    en: {
      chairs: `
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li>Everyone on their own phone, one chair fewer than players. The music plays (from the TV, or the host's phone) and everyone circles the chairs on screen.</li>
                <li>The music stops <b>out of nowhere</b>, at a moment nobody knows: every phone buzzes and flashes, and the <b>«Sit!»</b> button turns amber. The fastest taps take the chairs and the last one is <b>out</b>. No tap in 3 seconds counts as last.</li>
                <li>Tap <b>before</b> the music stops and you're out at once. With «Fake stops» on, the music may pause for a moment and go on. Stay sharp.</li>
                <li>One chair fewer each round, until one is left: the winner. Taps are ranked by the moment you tapped on your phone, not by your connection, so a slow network costs nobody a chair.</li>
                <li>🎧 <b>The one out is the DJ</b>: from round 2 the latest one out stops the music from their phone (after the first 4 seconds; at 25 it stops by itself), with a «Fake stop» when fake stops are on. The DJ scores nothing; whoever caught the most is <b>«Best DJ»</b>.</li>
                <li>🥁 <b>The final</b>: when two are left with one chair, it's played on a stage to the zaffa. After the stop, a slow-motion replay shows both racing for the chair, and the gap between them in seconds.</li>
            </ol>
            <p class="help-sub">📺 The TV</p>
            <p class="text-xs">The ring is big, the music plays from it, and it shows who sat first and in how many milliseconds.</p>`,
    }
  }
});
