/* fakeartist: the words only this game's screens show, and its rules (Help, the
   first-play card). The build puts them into TRANSLATIONS and GAME_RULES (tools/game-text.cjs):
   read them as t.<key> and GAME_RULES[lang].<id>, as everywhere. */
gameText({
  translations: {
    ar: {
      fa_category: "الفئة",
      reveal_fake_was: "الفنان المزيف كان…",
      fake_artist_role: "أنت الفنان المزيف!",
      fake_artist_hint: "إنت مش عارف الكلمة! ارسم خط يقنعهم ومتخليهمش يكشفوك.",
      real_artist_word: "الكلمة السرية للرسم:",
      real_artist_hint: "ارسم خط واحد يلمّح للكلمة من غير ما تفضحها للمزيف.",
      your_stroke_turn: "دورك في رسم خط واحد!",
      send_stroke_btn: "إرسال الخط ✍️",
      fake_guess_prompt: "اتكشفت! خمّن الكلمة وتسرق الفوز:",
      submit_guess_btn: "تخمين الكلمة",
      fa_hint: "3 لاعبين أو أكتر. الكل بيرسم نفس الكلمة، خط واحد في كل دور — ماعدا الفنان المزيف اللي مايعرفهاش.",
      fa_redo: "↺ ارسم تاني",
      fa_one_line: "خط واحد متصل — ارسم من غير ما ترفع صباعك",
      fa_one_line_toast: "خط واحد بس — اضغط «ارسم تاني» لو عايز تعيده",
      fa_escaped: "الفنان المزيف عدّى من غير ما حد يكشفه!",
      fa_stole: "الفنان المزيف اتكشف، بس خمّن الكلمة وسرق الفوز!",
      fa_artists_win: "الفنان المزيف اتكشف وماعرفش الكلمة — الفنانين كسبوا!",
    },
    en: {
      fa_category: "Category",
      reveal_fake_was: "The fake artist was…",
      fake_artist_role: "You are the Fake Artist!",
      fake_artist_hint: "You don't know the word! Draw a believable stroke and don't get caught!",
      real_artist_word: "Secret word to draw:",
      real_artist_hint: "Draw one stroke that hints at the word without giving it away to the fake.",
      your_stroke_turn: "Your turn to draw ONE stroke!",
      send_stroke_btn: "Submit Stroke ✍️",
      fake_guess_prompt: "You were caught! Guess the word to steal the win:",
      submit_guess_btn: "Guess Word",
      fa_hint: "3+ players. Everyone draws the same word, one line a turn — except the Fake Artist, who doesn't know it.",
      fa_redo: "↺ Redo line",
      fa_one_line: "One continuous line — don't lift your finger",
      fa_one_line_toast: "Just one line — tap Redo to try again",
      fa_escaped: "The Fake Artist got away with it!",
      fa_stole: "Caught — but guessed the word and stole the win!",
      fa_artists_win: "Caught, and missed the word — the artists win!",
    }
  },
  rules: {
    ar: {
      fakeartist: `
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li>الكل بيرسم نفس الحاجة على لوحة واحدة، كل واحد بلونه، إلا <b>الفنان المزيف</b> اللي مش عارف الكلمة. هو بيعرف <b>الفئة</b> بس (حيوانات، أكل، مواصلات…).</li>
                <li>كل واحد بالدور يرسم <b>خط واحد متصل</b> بس، وبعدين اللي بعده. جولتين لكل واحد.</li>
                <li>ارسم جزء يوضّح إنك عارف، من غير ما توضّح الرسمة كلها للمزيف.</li>
                <li>صوّتوا على المزيف. لو اتمسك، عنده فرصة يخمّن الكلمة ويسرق الفوز. لو الأصوات اتعادلت، بيهرب.</li>
                <li>المضيف يقدر يتخطى دور حد النت فصل عنده.</li>
            </ol>`,
    },
    en: {
      fakeartist: `
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li>Everyone draws the same thing on one canvas, each in their own colour, except the <b>fake artist</b>, who doesn't know the word: only its <b>category</b> (animals, food, transport…).</li>
                <li>In turn, each player draws <b>one continuous line</b>, then the next. Two rounds each.</li>
                <li>Draw enough to show you know, not enough to show the fake the whole picture.</li>
                <li>Vote on the fake. If caught, they get a chance to guess the word and steal the win. A tied vote lets them escape.</li>
                <li>The host can skip the turn of anyone who has dropped off.</li>
            </ol>`,
    }
  }
});
