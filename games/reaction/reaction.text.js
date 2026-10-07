/* reaction: the words only this game's screens show, and its rules (Help, the
   first-play card). The build puts them into TRANSLATIONS and GAME_RULES (tools/game-text.cjs):
   read them as t.<key> and GAME_RULES[lang].<id>, as everywhere. */
gameText({
  // The setup's and the lobby's «ركّز!» switch (875, 7 Oct 2026): the setup reads them through data-i18n.
  translations: {
    ar: {
      rx_focus: "ركّز!",
      rx_focus_hint: "الشاشة تكتب اسم لون بلون تاني («أحمر» بالأخضر): دوس بس لما الكلمة ولونها يتفقوا. اللي يدوس غلط يخسر.",
    },
    en: {
      rx_focus: "Focus!",
      rx_focus_hint: "The screen writes a colour's name in another colour («RED» in green): tap only when the word and its colour agree. A wrong tap loses.",
    }
  },
  rules: {
    ar: {
      reaction: `
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>حط الموبايل بينك وبين صاحبك، كل واحد على نص.</li>
                <li>استنوا الشاشة تبقى خضرا: أول واحد يضغط نصه يكسب.</li>
                <li>الضغط والشاشة حمرا = خسارة فورية.</li>
                <li><b>خدعة</b>: مرة كل تلات جولات تقريباً إشارة مزيفة (أصفر، 🐱، «استنى!»)، واللي يدوس عليها يخسر.</li>
                <li><b>ركّز!</b>: بدل الأحمر والأخضر، الشاشة تكتب اسم لون بلون تاني («أحمر» بالأخضر). دوس بس لما الكلمة ولونها يتفقوا؛ اللي يدوس على كلمة مش متفقة يخسر.</li>
            </ul>
            <p class="help-sub">👥 كل واحد بموبايله</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>كله يخضرّ في نفس اللحظة بساعة السيرفر. ٥ جولات: أسرع تلاتة ياخدوا ٣ و٢ و١، واللي يدوس قبل الخضرا ✖. بعد الخامسة المنصة ونقط السهرة.</li>
                <li><b>خروج المغلوب</b>: كل جولة الأبطأ يخرج (اللي يدوس بدري ✖ يخرج الأول، وبعده اللي ماداسش). لما يفضل اتنين: نهائي أحسن من ٣، والأسرع ياخد الجولة.</li>
            </ul>`,
    },
    en: {
      reaction: `
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>Put the phone between you and a friend, one half each.</li>
                <li>Wait for the screen to turn green: the first to tap their half wins.</li>
                <li>Tapping while it is red is an instant loss.</li>
                <li><b>Fakes</b>: about one round in three a fake signal (yellow, a 🐱, «Wait!»); tap on it and you lose.</li>
                <li><b>Focus!</b>: instead of red and green, the screen writes a colour's name in another colour («RED» in green). Tap only when the word and its colour agree; a tap on one that doesn't loses.</li>
            </ul>
            <p class="help-sub">👥 Each on their own phone</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>All turn green at once, on the server's clock. 5 rounds: the fastest three get 3, 2 and 1, a tap before the green is ✖. After the fifth, the podium and the night's points.</li>
                <li><b>Knockout</b>: each round the slowest is out (a ✖ goes first, then whoever didn't tap). With two left: a best-of-three final, the faster one takes each round.</li>
            </ul>`,
    }
  }
});
