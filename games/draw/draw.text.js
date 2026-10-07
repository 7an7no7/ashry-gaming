/* draw: the words only this game's screens show, and its rules (Help, the
   first-play card). The build puts them into TRANSLATIONS and GAME_RULES (tools/game-text.cjs):
   read them as t.<key> and GAME_RULES[lang].<id>, as everywhere. */
gameText({
  translations: {
    ar: {
      draw_redo: "إعادة",
      draw_colours: "الألوان",
      draw_custom_colour: "لون تاني",
      draw_hint_label: "الكلمة",
      draw_tools: "أدوات الرسم",
      draw_tool_line: "خط مستقيم",
      draw_tool_rect: "مربع",
      draw_tool_circle: "دائرة",
      draw_tool_fill: "تلوين مساحة",
      draw_round_length: "طول الجولة",
      default_label: "الافتراضي",
      draw_hint: "واحد يرسم والباقي يخمّنوا. أول واحد يعرفها ياخد نقطتين.",
      draw_you_draw: "انت الرسام",
      draw_your_word: "ارسم الكلمة دي",
      draw_stamp_right: "خمّن صح!",
      draw_came_close: "قرّب",
      draw_watcher_got: "عرفها",
      draw_watch_hint: "دخلت في النص: خمّن للمتعة، والنقط من الجولة الجاية.",
      draw_quick_line: "ضربة سريعة: نقطة زيادة للي خمّن وللرسام",
      draw_cat_no_point: "الرسام قال الفئة، فملوش نقطة الجولة دي",
      draw_cat_label: "الفئة",
      draw_tell_cat: "قول الفئة",
      draw_tell_cat_confirm: "تقول نوع الكلمة للكل؟ هتسيب نقطتك في الجولة دي.",
    },
    en: {
      draw_redo: "Redo",
      draw_colours: "Colours",
      draw_custom_colour: "Another colour",
      draw_hint_label: "The word",
      draw_tools: "Drawing tools",
      draw_tool_line: "Straight line",
      draw_tool_rect: "Rectangle",
      draw_tool_circle: "Circle",
      draw_tool_fill: "Fill an area",
      draw_round_length: "Round length",
      default_label: "default",
      draw_hint: "One person draws, the rest guess. First correct answer takes two points.",
      draw_you_draw: "You're drawing",
      draw_your_word: "Draw this word",
      draw_stamp_right: "Got it!",
      draw_came_close: "came close",
      draw_watcher_got: "got it",
      draw_watch_hint: "You joined mid-round: guess for fun, points start next round.",
      draw_quick_line: "Quick hit: a point more for the guesser and the drawer",
      draw_cat_no_point: "The drawer told the category, so no point for them this round",
      draw_cat_label: "Category",
      draw_tell_cat: "Tell the category",
      draw_tell_cat_confirm: "Tell everyone what kind of thing it is? You give up your point this round.",
    }
  },
  rules: {
    ar: {
      drawguess: `
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li>واحد يرسم على موبايله، والباقي يشوفوا الرسمة وهي بتتكون ويكتبوا تخمينهم.</li>
                <li>الكلمة تظهر للرسام بس. ممنوع الكتابة أو الأرقام.</li>
                <li>الإملاء مش فارقة في التخمين: أسد واسد والأسد كلهم صح.</li>
                <li>اللي بيخمنوا شايفين شكل الكلمة (شرطة لكل حرف)، ولما تخمينك يبقى قريب التطبيق يقولك 🔥 قريب. التخمين القريب بيظهر على موبايلك انت بس، والباقي بيشوفوا «🔥 فلان قرّب» من غير الكلمة.</li>
                <li>أدوات الرسام: قلم، خط، مستطيل، دايرة، دلو تلوين، ممحاة، 15 لون ولون من اختيارك، 4 سماكات، تراجع وإعادة. على اللابتوب Ctrl+Z وCtrl+Y.</li>
                <li>أول واحد يكتب التخمين الصح ياخد نقطتين، والرسام ياخد نقطة. لو محدش عرفها في الوقت، الكلمة تتكشف.</li>
                <li>⚡ ضربة سريعة: لو اتعرفت في أول تلت الوقت، اللي خمّن والرسام ياخدوا نقطة زيادة كل واحد.</li>
                <li>🏷️ «قول الفئة»: الرسام يقدر يقول للكل نوع الكلمة (حيوانات، أكل…)، بس يسيب نقطته في الجولة دي.</li>
                <li>👀 اللي يدخل في نص الجولة يقدر يخمّن للمتعة من غير نقط، ويلعب من الجولة الجاية.</li>
                <li>المضيف يختار طول الجولة (من 60 لـ 180 ثانية).</li>
            </ol>
            <p class="help-sub">🎨 أدوات الرسم</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li><b>✏️</b> قلم حر. <b>╱ ▭ ◯</b> خط، مربع، دائرة: اضغط واسحب. <b>🪣</b> تلوين مساحة مقفولة. <b>🧽</b> ممحاة. <b>↶</b> تراجع، <b>↷</b> إعادة، <b>🗑️</b> مسح الكل. الألوان في صفين، وآخرها لون من اختيارك.</li>
            </ul>`,
    },
    en: {
      drawguess: `
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li>One player draws on their phone; everyone else watches it appear and types their guess.</li>
                <li>Only the drawer sees the word. No letters or numbers.</li>
                <li>Spelling doesn't matter in a guess: أسد, اسد and الأسد all count.</li>
                <li>Guessers see the word's shape (a dash per letter), and a near miss gets a 🔥 Close! A near miss shows only on your own phone; everyone else sees "🔥 Sam came close", without the word.</li>
                <li>The drawer's tools: pen, line, rectangle, circle, fill, eraser, 15 colours and one of your own, 4 thicknesses, undo and redo. On a laptop, Ctrl+Z and Ctrl+Y.</li>
                <li>The first right guess scores two points and the drawer one. If nobody gets it in time, the word is revealed.</li>
                <li>⚡ Quick hit: guessed in the first third of the time, the guesser and the drawer get a point more each.</li>
                <li>🏷️ "Tell the category": the drawer can tell everyone what kind of thing it is (animals, food…), and gives up their point that round.</li>
                <li>👀 Someone who joins mid-round can guess for fun, with no points, and plays from the next round.</li>
                <li>The host picks the round length (60 to 180 seconds).</li>
            </ol>
            <p class="help-sub">🎨 Drawing tools</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li><b>✏️</b> freehand. <b>╱ ▭ ◯</b> line, rectangle, circle: press and drag. <b>🪣</b> fill a closed area. <b>🧽</b> eraser. <b>↶</b> undo, <b>↷</b> redo, <b>🗑️</b> clear. The colours are two rows, the last one a colour of your own.</li>
            </ul>`,
    }
  }
});
