/* guessnum: the words only this game's screens show, and its rules (Help, the
   first-play card). The build puts them into TRANSLATIONS and GAME_RULES (tools/game-text.cjs):
   read them as t.<key> and GAME_RULES[lang].<id>, as everywhere. */
gameText({
  translations: {
    ar: {
      gn_bub_idle: "يلا بينا!",
      gn_bad_range: "المدى مش مظبوط: أول رقم لازم يبقى أصغر",
      gn_need_secret: "اكتب الرقم السري الأول!",
      gn_show_secret: "ورّيني الرقم",
      gn_start: "يلا خمّن!",
      gn_between: "الرقم ما بين {min} و {max}",
      gn_win: "🎉 صح! الرقم هو {n}",
      gn_lower: "أقل! ⬇️",
      gn_higher: "أعلى! ⬆️",
      gn_bub_far: "برد… برد…",
      gn_bub_mid: "هممم…",
      gn_bub_warm: "سخن!",
      gn_bub_hot: "قريييب!",
      gn_bub_win: "جبتها!",
      gn_bub_out: "يا خسارة…",
      gn_chip_right: "هو ده",
      gn_chip_higher: "الرقم أعلى",
      gn_chip_lower: "الرقم أقل",
      gn_window: "بين {lo} و {hi}",
      gn_more_than: "الرقم أكبر من {n}",
      gn_less_than: "الرقم أصغر من {n}",
      gn_min_ph: "من",
      gn_max_ph: "لحد",
    },
    en: {
      gn_bub_idle: "Let's go!",
      gn_bad_range: "Check the range: the first number must be smaller",
      gn_need_secret: "Type the secret number first!",
      gn_show_secret: "Show the number",
      gn_start: "Start guessing!",
      gn_between: "The number is between {min} and {max}",
      gn_win: "🎉 Correct! Number is {n}",
      gn_lower: "Lower! ⬇️",
      gn_higher: "Higher! ⬆️",
      gn_bub_far: "Brrr… cold",
      gn_bub_mid: "Hmm…",
      gn_bub_warm: "Warm!",
      gn_bub_hot: "Sooo close!",
      gn_bub_win: "Got it!",
      gn_bub_out: "Oh no…",
      gn_chip_right: "that's it",
      gn_chip_higher: "the number is higher",
      gn_chip_lower: "the number is lower",
      gn_window: "Between {lo} and {hi}",
      gn_more_than: "It's more than {n}",
      gn_less_than: "It's less than {n}",
      gn_min_ph: "From",
      gn_max_ph: "To",
    }
  },
  rules: {
    ar: {
      guessnum: `
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li>حدد المدى (من 1 لـ 100 مثلاً) واكتب تخمينك.</li>
                <li>⬇️ يعني رقمك عالي، ⬆️ يعني رقمك واطي. حاول توصل بأقل محاولات.</li>
                <li>مع صاحبك: واحد يكتب الرقم والتاني يخمّنه.</li>
            </ol>
            <p class="help-sub">👥 كل واحد من موبايله</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li><b>واحد يختار</b> رقم من المدى اللي اختاره المضيف (1-50 أو 1-100 أو 1-1000)، والباقي كل واحد يخمّنه على موبايله: أعلى ولا أقل. محدش بيشوف تخمينات التاني.</li>
                <li><b>سباق</b>: التطبيق بيختار رقم للكل.</li>
                <li>المحاولات على قد المدى (8، 9، أو 12). اللي يوصله ياخد 10، والأول +5، التاني +4… واللي اختاره ياخد 5 عن كل واحد ماوصلوش. لو متعادلين، المحاولات الأقل تسبق.</li>
                <li>🏆 <b>أصعب لغز الليلة</b>: في الآخر، اللغز اللي أخد أكتر محاولات بيرجع يظهر، واللي حطّه بيتتوّج.</li>
            </ul>
            <p class="help-sub">📺 على التلفزيون</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>المدى وكام محاولة عمل كل واحد، من غير أرقامه: رقم حد تاني كان هيقول الإجابة.</li>
            </ul>`,
    },
    en: {
      guessnum: `
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li>Set the range (1 to 100, say) and type your guess.</li>
                <li>⬇️ means your number is too high, ⬆️ too low. Get there in as few tries as you can.</li>
                <li>With a friend: one sets the number, the other guesses.</li>
            </ol>
            <p class="help-sub">👥 Each on their own phone</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li><b>One sets</b> a number in the host's range (1-50, 1-100 or 1-1000) and everyone else finds it on their own phone: higher or lower. Nobody sees anyone else's guesses.</li>
                <li><b>Race</b>: the app picks a number for everyone.</li>
                <li>The tries fit the range (8, 9 or 12). Finding it is 10 points, +5 for the first, +4 for the second…; the setter scores 5 for everyone who misses it. On a tie, fewer tries ranks higher.</li>
                <li>🏆 <b>The hardest one tonight</b>: at the end, the secret that took the most tries is shown again and its setter crowned.</li>
            </ul>
            <p class="help-sub">📺 On the TV</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>The range and how many tries each player has made, never their numbers: someone else's would give the answer away.</li>
            </ul>`,
    }
  }
});
