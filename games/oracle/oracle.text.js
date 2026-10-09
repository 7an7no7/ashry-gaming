/* The Oracle (العرّاف): the words only this game's screens show, and its rules (Help, the
   first-play card). The build puts them into TRANSLATIONS and GAME_RULES (tools/game-text.cjs):
   read them as t.<key> and GAME_RULES[lang].oracle, as everywhere. The questions and the names
   it guesses are content, in OracleQuestions.js and the Oracle*.js lists (ar and en each). */
gameText({
  translations: {
    ar: {
      setup_oracle: "العرّاف",
      cat_oracle: "فكّر في حد أو حاجة، والعرّاف يعرفها في 20 سؤال",
      oracle_setup_say: "فكّر في حد مشهور أو شخصية أو حيوان أو حاجة… وأنا هعرفه!",
      oracle_kinds_p: "شخص مشهور",
      oracle_kinds_c: "شخصية كارتون أو فيلم",
      oracle_kinds_a: "حيوان",
      oracle_kinds_t: "حاجة أو شغلانة",
      oracle_setup_hint: "20 سؤال و3 تخمينات. جاوب بأيوه أو لأ أو غالباً، و«رجّع» لو غلطت.",
      oracle_record: "العرّاف عرف {won} من {played} مرة",
      oracle_q_of: "سؤال {n} من {m}",
      oracle_guess_3: "3 تخمينات",
      oracle_guess_2: "تخمينين",
      oracle_guess_1: "تخمين واحد",
      oracle_guess_0: "مفيش تخمينات",
      oracle_y: "أيوه",
      oracle_n: "لأ",
      oracle_dk: "مش عارف",
      oracle_py: "غالباً أيوه",
      oracle_pn: "غالباً لأ",
      oracle_undo: "رجّع",
      oracle_thinking: "استنى… بركّز",
      oracle_got_it: "جالي!",
      oracle_wrong: "يا خبر! مش هو؟ طيب…",
      oracle_after_wrong: "طيب، نكمّل:",
      oracle_you_think: "بتفكر في…",
      oracle_yes_it: "أيوه، هو ده! 🎉",
      oracle_no_it: "لأ، مش هو",
      oracle_left_2: "لو غلطت فاضل لي تخمينين",
      oracle_left_1: "لو غلطت فاضل لي تخمين واحد",
      oracle_left_0: "ده آخر تخمين ليّا",
      oracle_win: "عرفتك! 😄",
      oracle_in_q: "سؤال بس",
      oracle_guess_n1: "من أول تخمين",
      oracle_guess_n2: "تاني تخمين",
      oracle_guess_n3: "تالت تخمين",
      oracle_again: "العب تاني",
      oracle_lose: "غلبتني! 🙌",
      oracle_who: "كنت بتفكر في مين؟",
      oracle_field: "اسمه أو اسمها",
      oracle_ph: "مثلاً: شريهان",
      oracle_send: "ابعت",
      oracle_learn: "هيوصل للعرّاف ويتعلّمه المرة الجاية",
      oracle_thanks: "شكراً، هتعلّم",
      oracle_used_all: "{q} سؤال و{g} تخمينات",
      oracle_guessed: "خمّنت: {list}",
      oracle_kind_p: "شخصية مشهورة",
      oracle_kind_c: "شخصية من كارتون أو فيلم أو حكاية",
      oracle_kind_a: "حيوان",
      oracle_kind_t: "حاجة",
      oracle_kind_j: "شغلانة",
    },
    en: {
      setup_oracle: "The Oracle",
      cat_oracle: "Think of someone or something; the Oracle finds it in 20 questions",
      oracle_setup_say: "Think of a famous person, a character, an animal or a thing… and I'll know it!",
      oracle_kinds_p: "A famous person",
      oracle_kinds_c: "A cartoon or film character",
      oracle_kinds_a: "An animal",
      oracle_kinds_t: "A thing or a job",
      oracle_setup_hint: "20 questions and 3 guesses. Answer yes, no or probably, and «Undo» if you slip.",
      oracle_record: "The Oracle got you {won} of {played} times",
      oracle_q_of: "Question {n} of {m}",
      oracle_guess_3: "3 guesses",
      oracle_guess_2: "2 guesses",
      oracle_guess_1: "1 guess",
      oracle_guess_0: "No guesses",
      oracle_y: "Yes",
      oracle_n: "No",
      oracle_dk: "Don't know",
      oracle_py: "Probably",
      oracle_pn: "Probably not",
      oracle_undo: "Undo",
      oracle_thinking: "Hold on… focusing",
      oracle_got_it: "Got it!",
      oracle_wrong: "Oh! Not them? Right then…",
      oracle_after_wrong: "Right, let's go on:",
      oracle_you_think: "You're thinking of…",
      oracle_yes_it: "Yes, that's it! 🎉",
      oracle_no_it: "No, it's not",
      oracle_left_2: "If I'm wrong, I have two guesses left",
      oracle_left_1: "If I'm wrong, I have one guess left",
      oracle_left_0: "This is my last guess",
      oracle_win: "Got you! 😄",
      oracle_in_q: "questions only",
      oracle_guess_n1: "first guess",
      oracle_guess_n2: "second guess",
      oracle_guess_n3: "third guess",
      oracle_again: "Play again",
      oracle_lose: "You beat me! 🙌",
      oracle_who: "Who were you thinking of?",
      oracle_field: "Their name",
      oracle_ph: "e.g. Sherihan",
      oracle_send: "Send",
      oracle_learn: "It goes to the Oracle, who learns it for next time",
      oracle_thanks: "Thank you, I'll learn it",
      oracle_used_all: "{q} questions and {g} guesses",
      oracle_guessed: "Guessed: {list}",
      oracle_kind_p: "A famous person",
      oracle_kind_c: "A character from a cartoon, film or tale",
      oracle_kind_a: "An animal",
      oracle_kind_t: "A thing",
      oracle_kind_j: "A job",
    }
  },
  rules: {
    ar: {
      oracle: `
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li>فكّر في حد مشهور (مصري أو عربي أو من العالم)، أو شخصية كارتون أو فيلم أو حكاية، أو حيوان، أو حاجة أو شغلانة. متقولش لحد.</li>
                <li>العرّاف بيسأل لحد <b>20 سؤال</b>، ونوع اللي في دماغك من ضمنهم («هو إنسان؟»). جاوب <b>أيوه</b> أو <b>لأ</b> أو <b>غالباً أيوه</b> أو <b>غالباً لأ</b> أو <b>مش عارف</b>.</li>
                <li>لو اتلخبطت دوس <b>رجّع</b> وتتشال آخر إجابة.</li>
                <li>أول ما يبقى متأكد بيخمّن، وليه <b>3 تخمينات</b> بس. لو قال الصح يكسب، ولو خلّصهم تكسب إنت.</li>
                <li>لو غلبته اكتب كنت بتفكر في مين: الاسم بيوصل للعرّاف بس (مش لحد تاني) عشان يتعلّمه.</li>
            </ol>`,
    },
    en: {
      oracle: `
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li>Think of a famous person (Egyptian, Arab or from anywhere), a character from a cartoon, a film or a tale, an animal, or a thing or a job. Tell nobody.</li>
                <li>The Oracle asks up to <b>20 questions</b>, what kind of thing it is among them ("Is it a human?"). Answer <b>Yes</b>, <b>No</b>, <b>Probably</b>, <b>Probably not</b> or <b>Don't know</b>.</li>
                <li>Slipped? <b>Undo</b> takes back the last answer.</li>
                <li>Once he is sure he guesses, with <b>3 guesses</b> in all. Right, and he wins; out of guesses, and you win.</li>
                <li>If you beat him, type who you were thinking of: the name goes to the Oracle only (no one else) so he can learn it.</li>
            </ol>`,
    }
  }
});
