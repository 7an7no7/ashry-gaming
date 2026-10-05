/* flags: the words only this game's screens show, and its rules (Help, the
   first-play card). The build puts them into TRANSLATIONS and GAME_RULES (tools/game-text.cjs):
   read them as t.<key> and GAME_RULES[lang].<id>, as everywhere. */
gameText({
  translations: {
    ar: {
      flags_name_label: "اسم الدولة",
      flags_left: "باقي",
      flags_km: "كم",
      flags_tries: "محاولات",
      flags_won: "عرفتها! 🎉",
      flags_lost: "المرة دي فاتتك",
      flags_cont_af: "في أفريقيا",
      flags_cont_as: "في آسيا",
      flags_cont_eu: "في أوروبا",
      flags_cont_na: "في أمريكا الشمالية والكاريبي",
      flags_cont_sa: "في أمريكا الجنوبية",
      flags_cont_oc: "في أستراليا والمحيط الهادي",
    },
    en: {
      flags_name_label: "Country name",
      flags_left: "Left",
      flags_km: "km",
      flags_tries: "guesses",
      flags_won: "Got it! 🎉",
      flags_lost: "Not this time",
      flags_cont_af: "In Africa",
      flags_cont_as: "In Asia",
      flags_cont_eu: "In Europe",
      flags_cont_na: "In North America and the Caribbean",
      flags_cont_sa: "In South America",
      flags_cont_oc: "In Australia and the Pacific",
    }
  },
  rules: {
    ar: {
      flags: `
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li><b>🏳️ من العلم</b>: بيظهر علم، ومعاك 6 محاولات تعرف دولته.</li>
                <li><b>🧭 بالمسافة</b>: مفيش علم خالص. معاك 8 محاولات تلاقي الدولة المستخبية.</li>
                <li><b>🌍 جولة حول العالم</b>: علم و4 أسامي، و3 قلوب والغلط بياخد قلب. كل 10 أعلام الدول بتصعب.</li>
                <li>اكتب أول حروف الدولة واختارها من الاقتراحات. كل تخمين غلط بيقولك إنت على بعد كام <b>كيلو</b>، و<b>السهم</b> بيشاور على اتجاهها، والنسبة بتقولك قربت قد إيه.</li>
                <li>كل تخمين دبوس على الخريطة، لونه على قد قربه (أحمر بعيد، أخضر قريب). بعد تالت غلطة قارة الدولة بتنوّر (بالمسافة بعد الرابعة)، وبعدها أول حرف.</li>
                <li><b>سهل</b> من الدول المشهورة، <b>صعب</b> من كل الدول. المسافة محسوبة من نص كل دولة.</li>
            </ol>
            <p class="help-sub">👥 كل واحد من موبايله</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li><b>واحد يختار</b> أي دولة (بيدوّر عليها بالعربي أو الإنجليزي)، والباقي كل واحد يخمّنها على موبايله، من العلم أو بالمسافة زي ما المضيف اختار. الموبايل بيوري تخميناتك انت بس، والتلفزيون وقت اللعب بيوري عدد تخمينات كل واحد بس؛ ولما الجولة تخلص دبابيس الكل بتنزل على خريطته مرة واحدة، بأول حرف من اسم كل واحد.</li>
                <li><b>سباق</b>: التطبيق بيختار دولة للكل، من المشهورة أو من كل الدول.</li>
                <li>اللي يعرفها ياخد 10، والأول +5، التاني +4… واللي اختارها ياخد 5 عن كل واحد ماعرفهاش. لو متعادلين، المحاولات الأقل تسبق.</li>
            </ul>
            <p class="help-sub">📺 على التلفزيون</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>العلم (لو اللعب من العلم)، وكام محاولة عمل كل واحد وأقرب ما وصله، من غير أسامي الدول.</li>
            </ul>`,
    },
    en: {
      flags: `
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li><b>🏳️ From the flag</b>: a flag is shown, and you have 6 guesses to name its country.</li>
                <li><b>🧭 By distance</b>: no flag at all. You have 8 guesses to find the hidden country.</li>
                <li><b>🌍 Around the world</b>: a flag and four names, three hearts; a wrong answer costs one. Every 10 flags get harder.</li>
                <li>Type the start of a country's name and pick it from the suggestions. Each wrong guess shows how many <b>km</b> away it is, an <b>arrow</b> pointing the way, and a percentage for how close you are.</li>
                <li>Each guess is a pin on the map, coloured by how close it is (red far, green close). After the third miss the country's continent lights up (by distance, the fourth), then the first letter.</li>
                <li><b>Easy</b> asks well-known countries, <b>hard</b> any country. Distances are measured from the middle of each country.</li>
            </ol>
            <p class="help-sub">👥 Each on their own phone</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li><b>One sets</b> any country (searched in Arabic or English) and everyone else guesses it on their own phone, from the flag or by distance as the host chose. A phone shows only its own guesses; while the round is played the TV shows only how many each has made, and at the end everyone's pins drop onto its map together, with each one's first letter.</li>
                <li><b>Race</b>: the app picks a country for everyone, well-known ones or any.</li>
                <li>Getting it is 10 points, +5 for the first, +4 for the second…; the setter scores 5 for everyone who misses it. On a tie, fewer tries ranks higher.</li>
            </ul>
            <p class="help-sub">📺 On the TV</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>The flag (in the flag way), and how many tries each player has made and the closest they came, never the countries' names.</li>
            </ul>`,
    }
  }
});
