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
    }
  },
  rules: {
    ar: {
      drawguess: `
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li>واحد يرسم على موبايله، والباقي يشوفوا الرسمة وهي بتتكون ويكتبوا تخمينهم.</li>
                <li>الكلمة تظهر للرسام بس. ممنوع الكتابة أو الأرقام.</li>
                <li>الإملاء مش فارقة في التخمين: أسد واسد والأسد كلهم صح.</li>
                <li>اللي بيخمنوا شايفين شكل الكلمة (شرطة لكل حرف)، ولما تخمينك يبقى قريب التطبيق يقولك 🔥 قريب.</li>
                <li>أدوات الرسام: قلم، خط، مستطيل، دايرة، دلو تلوين، ممحاة، 15 لون ولون من اختيارك، 4 سماكات، تراجع وإعادة. على اللابتوب Ctrl+Z وCtrl+Y.</li>
                <li>أول واحد يكتب التخمين الصح ياخد نقطتين، والرسام ياخد نقطة. لو محدش عرفها في الوقت، الكلمة تتكشف.</li>
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
                <li>Guessers see the word's shape (a dash per letter), and a near miss gets a 🔥 Close!</li>
                <li>The drawer's tools: pen, line, rectangle, circle, fill, eraser, 15 colours and one of your own, 4 thicknesses, undo and redo. On a laptop, Ctrl+Z and Ctrl+Y.</li>
                <li>The first right guess scores two points and the drawer one. If nobody gets it in time, the word is revealed.</li>
                <li>The host picks the round length (60 to 180 seconds).</li>
            </ol>
            <p class="help-sub">🎨 Drawing tools</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li><b>✏️</b> freehand. <b>╱ ▭ ◯</b> line, rectangle, circle: press and drag. <b>🪣</b> fill a closed area. <b>🧽</b> eraser. <b>↶</b> undo, <b>↷</b> redo, <b>🗑️</b> clear. The colours are two rows, the last one a colour of your own.</li>
            </ul>`,
    }
  }
});
