/* chooser: the words only this game's screens show, and its rules (Help, the
   first-play card). The build puts them into TRANSLATIONS and GAME_RULES (tools/game-text.cjs):
   read them as t.<key> and GAME_RULES[lang].<id>, as everywhere. */
gameText({
  translations: {
    ar: {
      ch_hint_start: "كل واحد يحط صباعه على الشاشة",
      ch_hint_more: "محتاجين صباع تاني على الأقل",
      ch_hint_hold: "ثبّتوا صوابعكم…",
      ch_hint_again: "اضغط في أي مكان للإعادة",
      ch_starts: "يبدأ!",
      ch_team_a: "أ",
      ch_team_b: "ب",
    },
    en: {
      ch_hint_start: "Everyone, put a finger on the screen",
      ch_hint_more: "Need at least one more finger",
      ch_hint_hold: "Hold still…",
      ch_hint_again: "Tap anywhere to go again",
      ch_starts: "Starts!",
      ch_team_a: "A",
      ch_team_b: "B",
    }
  },
  rules: {
    ar: {
      chooser: `
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li>كل واحد يحط <b>صباعه</b> على الشاشة ويسيبه.</li>
                <li>لما الصوابع تثبت تقريباً ثانيتين، الموبايل يختار: <b>واحد يبدأ</b> صباع واحد ينور، <b>فريقين</b> الصوابع تتقسم لونين، <b>ترتيب</b> كل صباع ياخد رقم.</li>
                <li>اضغط في أي مكان عشان تعيد. على اللابتوب كل ضغطة ماوس بتحط صباع.</li>
            </ol>`,
    },
    en: {
      chooser: `
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li>Everyone puts a <b>finger</b> on the screen and keeps it there.</li>
                <li>Once the fingers have been still for two seconds, the phone picks: <b>one starts</b> lights up one finger, <b>two teams</b> splits them into two colours, <b>order</b> numbers them.</li>
                <li>Tap anywhere to go again. On a laptop, each mouse click plants a finger.</li>
            </ol>`,
    }
  }
});
