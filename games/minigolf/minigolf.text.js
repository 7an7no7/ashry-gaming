/* minigolf: the words only this game's screens show, and its rules (Help, the
   first-play card). The build puts them into TRANSLATIONS and GAME_RULES (tools/game-text.cjs):
   read them as t.<key> and GAME_RULES[lang].<id>, as everywhere. */
gameText({
  translations: {
    ar: {
      mg_best: "أحسن نتيجة لـ {hh}: {n} ({d})",
      mg_holes_n: "{n} حفر",
      mg_holes_n11: "{n} حفرة",
      mg_again: "العب تاني",
      mg_no_best: "لسه مفيش نتيجة لـ {hh}.",
      mg_hole: "حفرة {n}/{m}",
      mg_hole_big: "الحفرة {n}",
      mg_strokes: "ضربات {n}",
      mg_pull_hint: "اسحب لورا من الكورة وسيب",
      mg_wait_roll: "استنى الكورة تقف…",
      mg_turn_of: "دور {name}",
      mg_your_turn: "دورك! اسحب لورا وسيب",
      mg_done_cup: "دخلت! استنى الباقي",
      mg_done_picked: "اتشالت الكورة. استنى الباقي",
      mg_watching: "انت بتتفرج، وهتلعب الجيم الجاي",
      mg_w_ace: "هول إن وان!",
      mg_w_albatross: "ألباتروس!",
      mg_w_eagle: "إيجل!",
      mg_w_birdie: "بيردي!",
      mg_w_par: "زي المطلوب!",
      mg_w_bogey: "بوجي",
      mg_w_double: "دبل بوجي",
      mg_w_more: "دخلت!",
      mg_in_n: "في {n} ضربات",
      mg_in_2: "في ضربتين",
      mg_water: "في المية! +1",
      mg_picked: "اتشالت الكورة · {n}",
      mg_par_max: "المطلوب {n} · أقصى {m}",
      mg_last_stroke: "آخر ضربة!",
      mg_out: "أول 9",
      mg_knocked_in_you: "{by} خبط كورتك دخّلها!",
      mg_knocked_in: "{name}: دخلت بخبطة من {by}!",
      mg_knocked_wet_you: "{by} وقّع كورتك في المية: رجعت مكانها من غير ضربة زيادة",
      mg_knocked_wet: "كورة {name} وقعت في المية ورجعت مكانها",
      mg_someone: "{name}: {word}",
      mg_next_hole: "الحفرة الجاية",
      mg_next_in: "الحفرة الجاية بعد {n}",
      mg_total: "المجموع",
      mg_even: "زي المطلوب",
      mg_play_for: "اضرب بدل {name}",
      mg_lobby_mode: "طريقة اللعب",
      mg_mode_together: "كلنا مع بعض",
      mg_mode_turns: "بالدور",
      mg_mode_together_hint: "كل واحد يضرب وقت ما يحب على نفس الحفرة، والكور بتعدّي من جوه بعض.",
      mg_mode_turns_hint: "ضربة لكل واحد بالدور والكل بيتفرج، والكور بتخبط في بعض.",
      mg_lobby_clock: "وقت الضربة",
      mg_clock_hint: "لما الوقت يخلص، الموبايل بيضرب ضربة هادية ناحية الحفرة.",
      mg_lobby_hint: "المضيف بيختار الصعوبة وعدد الحفر وطريقة اللعب.",
      mg_no_3d: "الجهاز ده مش قادر يرسم الملعب ثلاثي الأبعاد. جرّب متصفح تاني أو جهاز تاني.",
      mg_plain_putt: "ضربة هادية",
      mg_loading: "بنجهّز الملعب…",
      mg_offline: "أول مرة الملعب محتاج نت عشان يتحمّل.",
      mg_result_title: "خلصت الـ {hh}!",
      mg_total_label: "مجموع الضربات",
      mg_vs_par: "{d} عن المطلوب ({p})",
      mg_share: "⛳ ميني جولف: {n} ضربة في {hh} ({d})",
      mg_you: "انت",
      mg_h_first: "أول ضربة",
      mg_h_mill: "الطاحونة",
      mg_h_bridge: "الكوبري",
      mg_h_humps: "سنام الجمل",
      mg_h_pyramid: "هرم سقارة المدرّج",
      mg_h_saqia: "الساقية",
      mg_h_lighthouse: "الفنار",
      mg_h_gate: "البوابة",
      mg_h_oasis: "الواحة",
      mg_h_siwa: "سيوة",
      mg_h_souq: "السوق",
      mg_h_nile: "النيل",
      mg_h_fair: "الملاهي",
      mg_h_citadel: "القلعة",
      mg_h_port: "الميناء",
      mg_h_temple: "المعبد",
      mg_h_sinai: "سانت كاترين",
      mg_h_tower: "برج القاهرة",
      mg_h_corniche: "الكورنيش",
      mg_h_kitchen: "المطبخ",
      mg_h_balloons: "بالونات الأقصر",
      mg_h_school: "حوش المدرسة",
      mg_h_football: "ملعب الكورة",
      mg_h_toys: "أوضة اللعب",
      mg_h_zoo: "جنينة الحيوانات",
      mg_h_lanterns: "فوانيس رمضان",
      mg_h_beach: "الشط",
      mg_h_sham: "شم النسيم",
      mg_h_garden: "جنينة الأورمان",
      mg_h_village: "القرية",
      mg_h_philae: "معبد فيلة",
      mg_h_khan: "خان الخليلي",
      mg_h_metro: "المترو",
      mg_h_airport: "المطار",
      mg_h_qaitbay: "قلعة قايتباي",
      mg_h_fayoum: "شلالات الفيوم",
      mg_h_icecream: "الآيس كريم",
      mg_h_carousel: "الدوّارة",
      mg_h_sphinx: "أبو الهول",
      mg_h_dam: "السد العالي",
      mg_h_whitedesert: "الصحرا البيضا",
      mg_h_redsea: "الشعاب المرجانية",
      mg_h_abusimbel: "أبو سمبل",
      mg_h_giza: "أهرامات الجيزة",
      mg_h_kings: "وادي الملوك",
      mg_h_space: "الفضاء",
      mg_h_bluehole: "البلو هول",
      mg_h_hatshepsut: "معبد حتشبسوت",
      mg_h_suez: "قناة السويس",
      mg_h_ibntulun: "مئذنة ابن طولون",
      mg_h_komombo: "كوم أمبو",
      mg_h_rink: "حلبة التزلج",
      mg_h_library: "مكتبة الإسكندرية",
      mg_h_avenue: "طريق الكباش",
      mg_h_stanley: "كوبري ستانلي",
      mg_h_moez: "شارع المعز",
      mg_h_bakery: "مخبز الكحك",
      mg_h_montaza: "جناين المنتزه",
      mg_h_arcade: "الفليبر",
      mg_h_nilecruise: "الباخرة النيلية",
      mg_level_hint_easy: "حفر قصيرة وواسعة، تنفع للعيلة كلها.",
      mg_level_hint_medium: "في كل حفرة حاجة أو اتنين محتاجين تفكير.",
      mg_level_hint_hard: "طرق ضيقة، وحاجات كتير، وحاجات بتتحرك محتاجة توقيت.",
      mg_level_hint_mix: "من التلاتة: السهل الأول، وبعدين المتوسط، وبعدين الصعب.",
      mg_target_row: "المطلوب",
    },
    en: {
      mg_best: "Best over {hh}: {n} ({d})",
      mg_holes_n: "{n} holes",
      mg_holes_n11: "{n} holes",
      mg_again: "Play again",
      mg_no_best: "No score over {hh} yet.",
      mg_hole: "Hole {n}/{m}",
      mg_hole_big: "Hole {n}",
      mg_strokes: "Strokes {n}",
      mg_pull_hint: "Pull back from the ball and let go",
      mg_wait_roll: "Wait for the ball to stop…",
      mg_turn_of: "{name}'s putt",
      mg_your_turn: "Your putt! Pull back and let go",
      mg_done_cup: "You're in! Waiting for the others",
      mg_done_picked: "Ball picked up. Waiting for the others",
      mg_watching: "You're watching; you'll play the next game",
      mg_w_ace: "Hole in one!",
      mg_w_albatross: "Albatross!",
      mg_w_eagle: "Eagle!",
      mg_w_birdie: "Birdie!",
      mg_w_par: "On target!",
      mg_w_bogey: "Bogey",
      mg_w_double: "Double bogey",
      mg_w_more: "In!",
      mg_in_n: "in {n}",
      mg_in_2: "in 2",
      mg_water: "In the water! +1",
      mg_picked: "Picked up · {n}",
      mg_par_max: "Target {n} · max {m}",
      mg_last_stroke: "Last stroke!",
      mg_out: "Out",
      mg_knocked_in_you: "{by} knocked your ball in!",
      mg_knocked_in: "{name}: knocked in by {by}!",
      mg_knocked_wet_you: "{by} knocked your ball into the water: back on its spot, no stroke added",
      mg_knocked_wet: "{name}'s ball went into the water and is back on its spot",
      mg_someone: "{name}: {word}",
      mg_next_hole: "Next hole",
      mg_next_in: "Next hole in {n}",
      mg_total: "Total",
      mg_even: "On target",
      mg_play_for: "Putt for {name}",
      mg_lobby_mode: "How to play",
      mg_mode_together: "All at once",
      mg_mode_turns: "In turns",
      mg_mode_together_hint: "Everyone putts when ready on the same hole; the balls pass through each other.",
      mg_mode_turns_hint: "One putt at a time round the table, everyone watching; the balls knock each other.",
      mg_lobby_clock: "Putt clock",
      mg_clock_hint: "When it runs out, the phone putts gently toward the hole.",
      mg_lobby_hint: "The host picks the difficulty, the holes and the way to play.",
      mg_no_3d: "This device can't draw the 3D course. Try another browser or device.",
      mg_plain_putt: "Gentle putt",
      mg_loading: "Setting up the course…",
      mg_offline: "The first time, the course needs the internet to load.",
      mg_result_title: "{hh} done!",
      mg_total_label: "Total strokes",
      mg_vs_par: "{d} against the target ({p})",
      mg_share: "⛳ Mini golf: {n} strokes over {hh} ({d})",
      mg_you: "You",
      mg_h_first: "First putt",
      mg_h_mill: "The windmill",
      mg_h_bridge: "The bridge",
      mg_h_humps: "Camel humps",
      mg_h_pyramid: "Step Pyramid of Saqqara",
      mg_h_saqia: "The waterwheel",
      mg_h_lighthouse: "The lighthouse",
      mg_h_gate: "The gate",
      mg_h_oasis: "The oasis",
      mg_h_siwa: "Siwa",
      mg_h_souq: "The souq",
      mg_h_nile: "The Nile",
      mg_h_fair: "The funfair",
      mg_h_citadel: "The Citadel",
      mg_h_port: "The port",
      mg_h_temple: "The temple",
      mg_h_sinai: "Saint Catherine",
      mg_h_tower: "Cairo Tower",
      mg_h_corniche: "The Corniche",
      mg_h_kitchen: "The kitchen",
      mg_h_balloons: "Luxor's balloons",
      mg_h_school: "The school yard",
      mg_h_football: "The football pitch",
      mg_h_toys: "The toy room",
      mg_h_zoo: "The zoo",
      mg_h_lanterns: "Ramadan lanterns",
      mg_h_beach: "The beach",
      mg_h_sham: "Sham El-Nessim",
      mg_h_garden: "Orman garden",
      mg_h_village: "The village",
      mg_h_philae: "Philae temple",
      mg_h_khan: "Khan el-Khalili",
      mg_h_metro: "The metro",
      mg_h_airport: "The airport",
      mg_h_qaitbay: "Qaitbay",
      mg_h_fayoum: "Fayoum's falls",
      mg_h_icecream: "The ice cream",
      mg_h_carousel: "The carousel",
      mg_h_sphinx: "The Sphinx",
      mg_h_dam: "The High Dam",
      mg_h_whitedesert: "The White Desert",
      mg_h_redsea: "The coral reef",
      mg_h_abusimbel: "Abu Simbel",
      mg_h_giza: "The Giza pyramids",
      mg_h_kings: "Valley of the Kings",
      mg_h_space: "Space",
      mg_h_bluehole: "The Blue Hole",
      mg_h_hatshepsut: "Hatshepsut's temple",
      mg_h_suez: "The Suez Canal",
      mg_h_ibntulun: "Ibn Tulun's minaret",
      mg_h_komombo: "Kom Ombo",
      mg_h_rink: "The ice rink",
      mg_h_library: "The Library of Alexandria",
      mg_h_avenue: "The Avenue of Rams",
      mg_h_stanley: "Stanley Bridge",
      mg_h_moez: "Al-Moez Street",
      mg_h_bakery: "The kahk bakery",
      mg_h_montaza: "Montaza gardens",
      mg_h_arcade: "The pinball",
      mg_h_nilecruise: "The Nile cruise",
      mg_level_hint_easy: "Short, wide holes for the whole family.",
      mg_level_hint_medium: "A piece or two on every hole to think about.",
      mg_level_hint_hard: "Narrow lines, more pieces, and moving ones to time.",
      mg_level_hint_mix: "Some of each: the easy ones first, then medium, then hard.",
      mg_target_row: "Target",
    }
  },
  rules: {
    ar: {
      minigolf: `
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li><b>اسحب لورا</b> من الكورة زي النبلة، والسهم بيوريك الاتجاه والقوة، و<b>سيب</b>: الكورة بتمشي عكس سحبتك.</li>
                <li>دخّل الكورة الحفرة في أقل عدد ضربات. كل حفرة مكتوب فوق عليها <b>المطلوب</b>: عدد الضربات اللي المفروض تدخل فيها.</li>
                <li><b>أقصى عدد ضربات = المطلوب + 3</b> (المطلوب 3 يعني 6 ضربات، ومكتوب جنبه). لو الكورة ما دخلتش فيهم بتتشال، والحفرة بتتحسب الأقصى + 1. قبل آخر ضربة بيظهر <b>آخر ضربة!</b></li>
                <li><b>المية</b>: الكورة بترجع المكان اللي اتضربت منه، وبتتحسب ضربة زيادة. لو فيه كورة تانية واقفة في المكان ده، بترجع لنقطة البداية.</li>
                <li>فيه <b>60 حفرة</b>: 20 سهلة و20 متوسطة و20 صعبة. بتختار <b>الصعوبة</b> (أو <b>مكس</b>: شوية من كل واحدة، السهل الأول وبعدين المتوسط وبعدين الصعب) و<b>عدد الحفر</b>: 3 أو 6 أو 9 أو 18. الحفر بتتسحب عشوائي، واللي لعبتها قريب مش بترجع غير لما حفر الصعوبة دي تخلص. اللي مجموعه أقل هو الكسبان.</li>
            </ol>
            <details class="help-more">
                <summary>🏅 أسامي النتايج</summary>
                <ul class="list-disc list-inside space-y-1 text-xs">
                    <li><b>هول إن وان</b>: دخلت من أول ضربة.</li>
                    <li><b>بيردي</b>: ضربة أقل من المطلوب. <b>إيجل</b>: ضربتين أقل. <b>ألباتروس</b>: تلاتة أقل.</li>
                    <li><b>زي المطلوب</b>: بالظبط. <b>بوجي</b>: ضربة زيادة. <b>دبل بوجي</b>: ضربتين زيادة.</li>
                </ul>
            </details>
            <details class="help-more">
                <summary>🗺️ اللي في الملعب</summary>
                <ul class="list-disc list-inside space-y-1 text-xs">
                    <li><b>الرمل</b> بيهدّي الكورة جامد، و<b>الطين</b> أتقل منه كمان. على <b>التلج</b> الكورة بتتزحلق ومش بتهدى تقريبًا.</li>
                    <li><b>التل</b> لو ضربتك ضعيفة بيرجّعها، و<b>الحفرة الواطية</b> بتسحب الكورة لجوه.</li>
                    <li><b>أسهم السرعة</b> بتزق الكورة أسرع في اتجاه الأسهم. <b>السير المتحرك</b> بيشيل الكورة معاه، وفيه سير ماشي بالعكس.</li>
                    <li><b>الباب السحري</b>: الكورة تدخل من الحلقة البنفسجي وتطلع من البرتقاني بنفس سرعتها، في اتجاه السهم.</li>
                    <li><b>العواميد المخططة</b> بتزق الكورة بعيد أقوى من ما جت.</li>
                    <li><b>المطلع</b>: لو طلعته بسرعة كفاية الكورة بتطير فوق المية أو السور الواطي وتنزل وراه. لو بطيئة بترجع تنزل تاني.</li>
                    <li><b>بوابة الاتجاه الواحد</b>: بتفتح لو جاي من ناحية السهم اللي على الأرض، ومن الناحية التانية بتقفل زي السور.</li>
                    <li><b>الحاجات اللي بتتحرك</b> (الطاحونة، البوابة اللي بتزحف، الساقية) ليها توقيت: استنى اللحظة الصح.</li>
                </ul>
            </details>
            <p class="help-sub">🧘 لوحدك</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>أحسن مجموع لكل صعوبة وعدد حفر بيتحفظ على موبايلك. <b>مساعدة التصويب</b> (مقفولة من الأول) بتوريك الكورة هتمشي فين.</li>
            </ul>
            <p class="help-sub">👥 كل واحد من موبايله</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li><b>كلنا مع بعض</b>: كل الكور على نفس الحفرة، وكل واحد يضرب وقت ما يحب. الكور بتعدّي من جوه بعض، وكور الباقيين باهتة. الحفرة الجاية بتيجي لما الكل يخلص.</li>
                <li><b>بالدور</b>: ضربة لكل واحد والكل بيتفرج. في الحفرة الجاية، اللي جاب أحسن نتيجة يبدأ.</li>
                <li>بالدور <b>الكور بتخبط في بعض</b>: كورتك بتنزل الملعب من أول ما تضربها من البداية، ولحد ما تدخل. لو حد <b>خبط كورتك ودخّلها</b> الحفرة، بتتحسب بضرباتك لحد ساعتها. لو <b>وقّعها في المية</b>، بترجع مكانها من غير ضربة زيادة (ولو مكانها مشغول، لنقطة البداية).</li>
                <li>المضيف بيختار الصعوبة، وعدد الحفر، ومساعدة التصويب، ووقت للضربة لو حابب (20 أو 40 ثانية): لما يخلص، الموبايل بيضرب ضربة هادية ناحية الحفرة.</li>
            </ul>
            <p class="help-sub">📺 على التلفزيون</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>الملعب كبير وكل الكور بألوانها، والكارت بتاع الكل.</li>
            </ul>`,
    },
    en: {
      minigolf: `
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li><b>Pull back</b> from the ball like a slingshot - the arrow shows the direction and the power - and <b>let go</b>: the ball goes the other way from your pull.</li>
                <li>Sink the ball in as few strokes as you can. Every hole shows its <b>target</b> at the top: the strokes it should take.</li>
                <li><b>At most target + 3 strokes</b> (a target of 3 allows 6; it's shown beside it). Not in by then, the ball is picked up and the hole counts that most + 1. Before the final one, <b>Last stroke!</b> shows.</li>
                <li><b>Water</b>: the ball goes back to where you hit it from, and it costs a stroke. If another ball lies on that spot now, it goes back to the tee.</li>
                <li>There are <b>60 holes</b>: 20 easy, 20 medium and 20 hard. Pick the <b>difficulty</b> (or <b>Mixed</b>: some of each, the easy ones first, then medium, then hard) and <b>how many holes</b>: 3, 6, 9 or 18. The holes are drawn at random, and the ones you played lately don't come back until that difficulty has gone round. The lowest total wins.</li>
            </ol>
            <details class="help-more">
                <summary>🏅 The names of a score</summary>
                <ul class="list-disc list-inside space-y-1 text-xs">
                    <li><b>Hole in one</b>: in with the first putt.</li>
                    <li><b>Birdie</b>: one under the target. <b>Eagle</b>: two under. <b>Albatross</b>: three under.</li>
                    <li><b>On target</b>: exactly. <b>Bogey</b>: one over. <b>Double bogey</b>: two over.</li>
                </ul>
            </details>
            <details class="help-more">
                <summary>🗺️ What's on the course</summary>
                <ul class="list-disc list-inside space-y-1 text-xs">
                    <li><b>Sand</b> slows the ball hard, and <b>mud</b> harder still. On <b>ice</b> the ball slides and hardly slows at all.</li>
                    <li>A <b>hill</b> sends a soft putt back down, and a <b>hollow</b> pulls the ball in.</li>
                    <li><b>Speed arrows</b> push the ball faster the way they point. A <b>conveyor</b> carries the ball along with it - and one runs the other way.</li>
                    <li><b>Magic doors</b>: the ball goes into the violet ring and comes out of the orange one at the same speed, the way its arrow points.</li>
                    <li><b>Striped posts</b> send the ball away harder than it came.</li>
                    <li><b>Ramps</b>: up one fast enough and the ball flies over the water or a low wall and lands beyond. Too slow and it rolls back down.</li>
                    <li><b>One-way gates</b>: they swing open from the side of the arrow on the ground; from the other side they are a wall.</li>
                    <li><b>The moving pieces</b> (the windmill, the sliding gate, the waterwheel) keep time: wait for the right moment.</li>
                </ul>
            </details>
            <p class="help-sub">🧘 Solo</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>Your best total for each difficulty and number of holes is kept on this phone. The <b>aim guide</b> (off to start) shows where the ball will go.</li>
            </ul>
            <p class="help-sub">👥 Everyone on their own phone</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li><b>All at once</b>: every ball on the same hole, everyone putting when ready. The balls pass through each other, and the others' balls are faint. The next hole comes once everyone is done.</li>
                <li><b>In turns</b>: one putt each, everyone watching. On the next hole, the best score goes first.</li>
                <li>In turns <b>the balls hit each other</b>: your ball is on the course from the moment you hit it from the tee until it drops. If someone <b>knocks your ball into the cup</b>, it counts with your strokes so far. If they <b>knock it into the water</b>, it goes back to its spot with no stroke added (to the tee if the spot is taken).</li>
                <li>The host picks the difficulty, the holes, the aim guide, and a putt clock if they like (20 or 40 seconds): when it runs out, the phone putts gently toward the hole.</li>
            </ul>
            <p class="help-sub">📺 On the TV</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>The course big, every ball in its colour, and everyone's scorecard.</li>
            </ul>`,
    }
  }
});
