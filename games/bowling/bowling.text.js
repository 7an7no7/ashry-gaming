/* bowling: the words only this game's screens show, and its rules (Help, the
   first-play card). The build puts them into TRANSLATIONS and GAME_RULES (tools/game-text.cjs):
   read them as t.<key> and GAME_RULES[lang].<id>, as everywhere. */
gameText({
  translations: {
    ar: {
      bowl_clock: "وقت الرمية",
      bowl_clock_hint: "لما الوقت يخلص، الموبايل بيرمي كورة هادية على طول للاعب.",
      bowl_lobby_hint: "المضيف بيختار عدد الإطارات ومساعدة التصويب ووقت الرمية.",
      bowl_best_line: "أحسن نتيجة: {n}",
      bowl_frame: "إطار {n} من {m}",
      bowl_you: "انت",
      bowl_your_turn: "دورك! اسحب الكورة لورا وارميها لقدام 👆",
      bowl_turn_of: "الدور على {name}",
      bowl_swipe: "اسحب الكورة لورا وارميها لقدام 👆",
      bowl_strike: "سترايك!",
      bowl_spare: "سبير!",
      bowl_gutter: "في القناة",
      bowl_miss: "ولا واحدة",
      bowl_of: "من {n}",
      bowl_auto: "رمية تلقائية",
      bowl_play_for: "ارمي بدل {name}",
      bowl_over_title: "خلصت اللعبة",
      bowl_counts: "سترايك {x} · سبير {s}",
      bowl_frames_of: "نتيجة {n} إطارات",
      bowl_loading: "بنجهّز الصالة…",
      bowl_no3d: "الجهاز ده مش بيعرض رسوم 3D، جرّب موبايل أو متصفح تاني.",
      bowl_offline: "أول مرة الصالة محتاجة نت عشان تتحمّل.",
      bowl_throw_plain: "ارمي كورة عادية",
      bowl_watching: "انت بتتفرج الجيم ده، وهتلعب اللي بعده.",
      bowl_options: "الاختيارات",
      bowl_quick: "⚡ جولة سريعة",
      bowl_quick_hint: "3 كور لكل واحد، كل كورة على 10 بينز جديدة، والمجموع يكسب. بتخلص في دقايق.",
      bowl_ball_n: "كورة {n} من {m}",
      bowl_demo: "اسحب لورا، وارمي لقدام",
      bowl_callup: "دورك يا {name}! 🎳",
    },
    en: {
      bowl_clock: "Throw clock",
      bowl_clock_hint: "When it runs out, the phone rolls a gentle straight ball for the player.",
      bowl_lobby_hint: "The host picks the frames, the aim guide and the throw clock.",
      bowl_best_line: "Best: {n}",
      bowl_frame: "Frame {n} of {m}",
      bowl_you: "You",
      bowl_your_turn: "Your turn: pull the ball back and swing it forward 👆",
      bowl_turn_of: "{name}'s turn",
      bowl_swipe: "Pull the ball back and swing it forward 👆",
      bowl_strike: "Strike!",
      bowl_spare: "Spare!",
      bowl_gutter: "Gutter ball",
      bowl_miss: "No pins",
      bowl_of: "of {n}",
      bowl_auto: "thrown for them",
      bowl_play_for: "Throw for {name}",
      bowl_over_title: "Game over",
      bowl_counts: "Strikes {x} · Spares {s}",
      bowl_frames_of: "Score over {n} frames",
      bowl_loading: "Setting up the lanes…",
      bowl_no3d: "This device can't draw 3D; try another phone or browser.",
      bowl_offline: "The first time, the lanes need the internet to load.",
      bowl_throw_plain: "Roll a plain ball",
      bowl_watching: "You're watching this game; you'll bowl the next one.",
      bowl_options: "Options",
      bowl_quick: "⚡ Quick round",
      bowl_quick_hint: "Three balls each, every ball on ten fresh pins, the most pins wins. Done in a few minutes.",
      bowl_ball_n: "Ball {n} of {m}",
      bowl_demo: "Pull back, then swing forward",
      bowl_callup: "Your turn, {name}! 🎳",
    }
  },
  rules: {
    ar: {
      bowling: `
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li><b>امسك الكورة</b> وهي بتمشي مع صباعك (حرّكها يمين أو شمال الأول لو عايز)، <b>اسحبها لورا</b> ناحيتك (المرجحة)، وبعدين <b>ارميها لقدام</b> وسيبها.</li>
                <li><b>خط المرجحة لورا هو اتجاه الكورة</b>، زي البندول: اسحب على خط مستقيم والكورة تمشي عليه، اسحب مايل وهي تمشي مايل. وانت بترمي لقدام الكورة ماشية على نفس الخط، فمساعدة التصويب مبتتحركش.</li>
                <li><b>سرعة الرمية لقدام</b> هي سرعة الكورة، و<b>المرجحة الأطول لورا</b> بتزوّدها. ولو <b>لفّيت صباعك</b> وانت بترميها لقدام بتلف (هوك) في آخر الممر ناحية اللفة.</li>
                <li>البينز بتقع زي الحقيقة: الكورة اللي بتلف وتخش <b>الجيب</b> (جنب البن الأول، في ناحية اللفة) هي اللي بتجيب سترايك أكتر؛ اللي بتخبط البن الأول في النص غالباً بتسيب بينز متفرقة (سبليت).</li>
                <li>كل إطار فيه كورتين. العشرة في الأولى <b>سترايك</b> (10 + الكورتين اللي بعدها)، والعشرة في الاتنين <b>سبير</b> (10 + الكورة اللي بعدها).</li>
                <li>الإطار الأخير: لو جبت فيه سترايك أو سبير بتاخد كورة زيادة. أعلى نتيجة 150 في 5 إطارات، و300 في 10.</li>
                <li>مفيش حواجز: الكورة اللي تقع في القناة مبتوقّعش حاجة.</li>
            </ol>
            <p class="help-sub">🧘 لوحدك</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>5 أو 10 إطارات، وأحسن نتيجة ليك بتتحفظ على الموبايل لكل طول.</li>
                <li><b>مساعدة التصويب</b> (مقفولة من الأول): خط من الكورة اللي في إيدك بيوريك هتروح فين وانت بتسحب، وبيتلوي لو لفّيت صباعك.</li>
            </ul>
            <p class="help-sub">👥 كل واحد من موبايله</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>الكل بيرمي بالدور، وكل رمية بتتشاف على كل الموبايلات والتلفزيون: نفس الكورة ونفس البينز اللي وقعت.</li>
                <li>المضيف بيختار 5 أو 10 إطارات، ومساعدة التصويب، ووقت للرمية (مفيش، 20 أو 40 ثانية): لما يخلص الموبايل بيرمي كورة هادية على طول للاعب. والمضيف يقدر يرمي بدل موبايل سكت.</li>
                <li>اللي نتيجته أعلى في الآخر يكسب.</li>
                <li><b>⚡ جولة سريعة</b> (اختيار المضيف): 3 كور لكل واحد بالدور، كل كورة على 10 بينز جديدة، والبينز بتتجمع. الأكتر يكسب، وبتخلص في دقايق بين الألعاب الطويلة.</li>
                <li>لما الدور ييجي عليك، كارت «دورك!» بيظهر على موبايلك والممر بينوّر.</li>
            </ul>
            <p class="help-sub">📺 على التلفزيون</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>الممر كبير والكورة ماشية، وجنبه ورقة كل لاعب بإطاراته.</li>
            </ul>`,
    },
    en: {
      bowling: `
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li><b>Hold the ball</b> and it follows your finger (slide it left or right first if you like), <b>pull it back</b> towards you (the backswing), then <b>swing it forward</b> and let go.</li>
                <li><b>The line of your backswing is the ball's line</b>, like a pendulum: pull back straight and it rolls straight, pull back on a slant and it rolls on that slant. On the way forward the ball stays on that line, so the aim guide holds still.</li>
                <li>The <b>speed of the forward swing</b> is the ball's speed, and <b>a longer backswing</b> adds to it. A <b>curve</b> in the forward swing puts a hook on it for the end of the lane, the way you curved.</li>
                <li>The pins fall the way real ones do: a ball hooking into the <b>pocket</b> (beside the head pin, on the side it hooks towards) strikes most; a ball full on the head pin often leaves a split.</li>
                <li>Two balls a frame. All ten with the first is a <b>strike</b> (10 + your next two balls), all ten with both a <b>spare</b> (10 + your next ball).</li>
                <li>The last frame: a strike or a spare in it gives you an extra ball. The best score is 150 in 5 frames, 300 in 10.</li>
                <li>No bumpers: a ball in the gutter knocks nothing down.</li>
            </ol>
            <p class="help-sub">🧘 Solo</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>5 or 10 frames, and your best score is kept on this phone for each length.</li>
                <li>The <b>aim guide</b> (off at first): a line from the ball in your hand shows where it will go while you swing, and bends if you curve.</li>
            </ul>
            <p class="help-sub">👥 Everyone on their own phone</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>Everyone bowls in turn, and every throw is seen on every phone and the TV: the same ball, the same pins falling.</li>
                <li>The host picks 5 or 10 frames, the aim guide and a throw clock (off, 20 or 40 seconds): when it runs out the phone rolls a gentle straight ball for the player. The host can also throw for a phone that went quiet.</li>
                <li>The highest score at the end wins.</li>
                <li><b>⚡ Quick round</b> (the host's choice): three balls each in turn, every ball on ten fresh pins, the pins adding up. Most pins wins, done in a few minutes between longer games.</li>
                <li>When your turn comes, a «Your turn!» card shows on your phone and the lane lights up.</li>
            </ul>
            <p class="help-sub">📺 On the TV</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>The lane big with the ball rolling, and every player's sheet beside it.</li>
            </ul>`,
    }
  }
});
