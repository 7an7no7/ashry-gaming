/* Letter Grid (شبكة الحروف): the words only this game's screens show, and its rules (Help, the
   first-play card). The build puts them into TRANSLATIONS and GAME_RULES (tools/game-text.cjs):
   read them as t.<key> and GAME_RULES[lang].boggle, as everywhere. */
gameText({
  translations: {
    ar: {
      setup_boggle: "شبكة الحروف",
      cat_boggle: "حروف في صندوق: وصّل الحروف اللي جنب بعض وكوّن كلمات قبل ما الوقت يخلص",
      boggle_mode_solo: "لوحدك",
      boggle_online_desc: "نفس الحروف على كل موبايل، وكل واحد يدوّر لوحده. الكلمة اللي محدش لقاها غيرك بس هي اللي بتتحسب، والتلفزيون بيوري الشبكة والوقت.",
      boggle_size: "حجم الشبكة",
      boggle_size_4: "4×4 · دقيقتين",
      boggle_size_5: "5×5 · 3 دقايق",
      boggle_size_hint: "اسحب صباعك على الحروف اللي جنب بعض (والمايل كمان)، 3 حروف على الأقل. الكلمات من قوايم اللعبة بس.",
      boggle_words_one: "كلمة",
      boggle_words_many: "كلمات",
      boggle_drag: "اسحب صباعك على الحروف",
      boggle_clear: "امسح",
      boggle_send: "ابعت الكلمة",
      boggle_pts: "نقطة",
      boggle_words: "الكلمات",
      boggle_points: "النقط",
      boggle_round: "الجولة",
      boggle_found_n: "لقيت {n}",
      boggle_done: "خلصت",
      boggle_again: "لقيتها قبل كده",
      boggle_not_listed: "مش في قوايمنا",
      boggle_found_of: "لقيت {n} من {m} كلمة",
      boggle_longest: "أطول كلمة",
      boggle_missed: "فاتتك",
      boggle_time_up: "خلص الوقت",
      boggle_round_of: "الجولة {n} من {m}",
      boggle_dropped: "اتشالت الكلمة",
      boggle_drop_hint: "دوس عليها تشيلها",
      boggle_to_vote: "مش في القوايم: الباقيين هيصوّتوا عليها آخر الجولة",
      boggle_full: "كفاية كلمات من بره القوايم الجولة دي",
      boggle_you: "إنت",
      boggle_unique: "محدش لقاها غيرك",
      boggle_none: "ولا كلمة",
      boggle_total: "المجموع",
      boggle_vote_you: "كلمتك",
      boggle_vote_wrote: "{name} كتبها",
      boggle_vote_q: "مش في القوايم، تتحسب؟",
      boggle_vote_line: "تصويت على الكلمات اللي مش في القوايم",
      boggle_yes: "أيوه",
      boggle_no: "لأ",
      boggle_close_vote: "اقفل التصويت",
      boggle_lobby_hint: "نفس الحروف على كل موبايل. الكلمة اللي محدش لقاها غيرك بس هي اللي بتتحسب.",
      boggle_opt_rounds: "عدد الجولات",
      boggle_opt_size: "الشبكة",
      boggle_wait: "مستنيين الباقيين…",
      boggle_finish: "خلّص الجولة",
      boggle_final: "النتيجة النهائية",
      boggle_result_n: "نتيجة الجولة {n}",
      boggle_next: "الجولة الجاية",
      boggle_mark: "شبكة",
      boggle_tv_done: "خلص",
      boggle_tv_looking: "بيدوّر…",
      boggle_tv_hint: "الكلمات مستخبية لحد آخر الجولة",
      boggle_tv_total: "في الشبكة {n} كلمة من قوايمنا",
    },
    en: {
      setup_boggle: "Letter Grid",
      cat_boggle: "Letters in a tray: link touching letters into words before the time runs out",
      boggle_mode_solo: "Alone",
      boggle_online_desc: "The same letters on every phone, everyone searching on their own. Only words nobody else found score, and the TV shows the grid and the clock.",
      boggle_size: "Grid size",
      boggle_size_4: "4×4 · 2 min",
      boggle_size_5: "5×5 · 3 min",
      boggle_size_hint: "Drag across touching letters (diagonals too), 3 letters at least. Only words from the game's lists count.",
      boggle_words_one: "word",
      boggle_words_many: "words",
      boggle_drag: "Drag your finger over the letters",
      boggle_clear: "Clear",
      boggle_send: "Send the word",
      boggle_pts: "pts",
      boggle_words: "Words",
      boggle_points: "Points",
      boggle_round: "Round",
      boggle_found_n: "Found {n}",
      boggle_done: "Done",
      boggle_again: "You already found that one",
      boggle_not_listed: "Not in our lists",
      boggle_found_of: "Found {n} of {m} words",
      boggle_longest: "Longest word",
      boggle_missed: "You missed",
      boggle_time_up: "Time's up",
      boggle_round_of: "Round {n} of {m}",
      boggle_dropped: "Word taken back",
      boggle_drop_hint: "Tap to take it back",
      boggle_to_vote: "Not in our lists: the others vote on it at the end of the round",
      boggle_full: "That's enough words from outside the lists this round",
      boggle_you: "you",
      boggle_unique: "nobody else found it",
      boggle_none: "No words",
      boggle_total: "Total",
      boggle_vote_you: "Your word",
      boggle_vote_wrote: "{name} wrote it",
      boggle_vote_q: "not in our lists, does it count?",
      boggle_vote_line: "Vote on the words not in our lists",
      boggle_yes: "Yes",
      boggle_no: "No",
      boggle_close_vote: "Close the vote",
      boggle_lobby_hint: "The same letters on every phone. Only words nobody else found score.",
      boggle_opt_rounds: "Rounds",
      boggle_opt_size: "Grid",
      boggle_wait: "Waiting for the others…",
      boggle_finish: "End the round",
      boggle_final: "Final result",
      boggle_result_n: "Round {n} result",
      boggle_next: "Next round",
      boggle_mark: "GRID",
      boggle_tv_done: "done",
      boggle_tv_looking: "searching…",
      boggle_tv_hint: "Words stay hidden until the round ends",
      boggle_tv_total: "{n} words from our lists hide in the grid",
    }
  },
  rules: {
    ar: {
      boggle: `
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li>شبكة حروف 4×4 ودقيقتين (أو 5×5 و3 دقايق). اسحب صباعك على حروف جنب بعض، والمايل كمان، من غير ما تعدّي على حرف مرتين.</li>
                <li>الكلمة 3 حروف على الأقل. «ال» ببلاش: الأسد هي أسد. ة وه حرف واحد، وى وي حرف واحد.</li>
                <li>النقط بالطول: 3 حروف نقطة، 4 نقطتين، 5 تلاتة، 6 وأكتر خمسة.</li>
                <li><b>في الغرفة:</b> نفس الحروف للكل وكلماتك مستخبية لحد آخر الجولة. بتتحسب بس الكلمة اللي محدش لقاها غيرك. كلمة مش في قوايمنا الباقيين بيصوّتوا عليها. 3 جولات (المضيف يختار 1 أو 3 أو 5).</li>
                <li><b>لوحدك وتحدي اليوم:</b> كلمات القوايم بس، وكل كلمة لقيتها بتتحسب.</li>
            </ol>`,
    },
    en: {
      boggle: `
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li>A 4×4 grid and 2 minutes (or 5×5 and 3). Drag across touching letters, diagonals too, never using a square twice.</li>
                <li>Words of 3 letters or more.</li>
                <li>Points by length: 3 letters 1, 4 letters 2, 5 letters 3, 6 or more 5.</li>
                <li><b>In a room:</b> the same letters for everyone, and your words stay hidden until the round ends. Only words nobody else found score. A word not in our lists goes to a vote of the others. 3 rounds (the host picks 1, 3 or 5).</li>
                <li><b>Alone and the daily:</b> listed words only, and every word you find counts.</li>
            </ol>`,
    }
  }
});
