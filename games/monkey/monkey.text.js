/* monkey: the words only this game's screens show, and its rules (Help, the
   first-play card). The build puts them into TRANSLATIONS and GAME_RULES (tools/game-text.cjs):
   read them as t.<key> and GAME_RULES[lang].<id>, as everywhere. */
gameText({
  translations: {
    ar: {
      mk_mode_letters_hint: "كل واحد يضيف حرف. اللي يقفل اسم حقيقي ياخد ربع، واللي يخترع يتمسك بـ«كذاب».",
      mk_mode_chain_hint: "كل اسم لازم يبدأ بآخر حرف في الاسم اللي قبله.",
      mk_mode_names_hint: "اسم واحد في الدور، حقيقي ومتقالش قبل كده.",
      mk_lobby_hint: "الموبايل هو الحكم: بيعرف الأسماء كلها، وبيحكم في «كذاب» لوحده.",
      mk_switch: "تبديل",
      mk_word_empty: "ابدأ بحرف…",
      mk_turn_letter: "{name} يضيف حرف",
      mk_your_letter: "دورك: ضيف حرف",
      mk_turn_name: "{name} يقول اسم",
      mk_your_name: "دورك: اكتب اسم",
      mk_required: "لازم يبدأ بحرف",
      mk_chain_first: "أي اسم يبدأ السلسلة",
      mk_any_name: "أي اسم من النوع ده",
      mk_name_ph: "اكتب الاسم…",
      mk_liar: "كذاب!",
      mk_giveup: "مفيش عندي",
      mk_skip: "تخطي",
      mk_penalty: "+¼ وتخطي",
      mk_no_letters: "مفيش حروف لسه",
      mk_own_letter: "ده حرفك انت",
      mk_flip: "عكس الحكم",
      mk_timed_out: "خلص الوقت",
      mk_timed_out_host: "خلص الوقت: ربع قرد ولا تعدّيه؟",
      mk_v_closed: "🔒 {name} قفل «{word}» وخد ربع قرد",
      mk_v_liar_right: "🤥 كذاب فعلاً! مفيش اسم يبدأ بـ«{word}». ربع قرد لـ {name}",
      mk_v_liar_wrong: "✅ في: {examples}. ربع قرد لـ {name} اللي اتهم غلط",
      mk_v_giveup: "🐵 {name} مفيش عنده، ربع قرد",
      mk_v_timeout: "⏰ خلص وقت {name}، ربع قرد",
      mk_v_monkey: "🐵 {name} بقى قرد! ممنوع حد يكلمه",
      mk_v_swap: "🔄 {other} رجع يلعب، و{name} بقى القرد",
      mk_v_flipped: "↩️ الطاولة عكست الحكم: ربع قرد لـ {name}",
      mk_you_monkey: "🐵 إنت القرد! ممنوع تتكلم لحد ما حد يغلط ويكلمك",
      mk_bub_1: "ربع… ربع…",
      mk_bub_2: "خلي بالك!",
      mk_bub_3: "باقي ربع!",
      mk_bub_4: "أنا قرد خلاص!",
      mk_row_monkey: "أنا قرد خلاص!",
      mk_did_you_mean: "❓ تقصد «{name}»؟",
      mk_not_found: "❌ مش لاقيها في القايمة",
      mk_used: "🚫 «{name}» اتقالت قبل كده",
      mk_wrong_letter: "لازم تبدأ بحرف «{letter}»",
      mk_words_said: "اللي اتقال",
      mk_winners: "الفائزون",
      mk_back_to_board: "رجوع للّعبة",
    },
    en: {
      mk_mode_letters_hint: "Each player adds a letter. Close a real name and take a quarter; make one up and get caught with \"Liar\".",
      mk_mode_chain_hint: "Every name has to start with the last letter of the one before it.",
      mk_mode_names_hint: "One name a turn, real and not said before.",
      mk_lobby_hint: "The phone is the referee: it knows every name and settles \"Liar\" on its own.",
      mk_switch: "Swap",
      mk_word_empty: "Start with a letter…",
      mk_turn_letter: "{name} adds a letter",
      mk_your_letter: "Your turn: add a letter",
      mk_turn_name: "{name} names one",
      mk_your_name: "Your turn: type a name",
      mk_required: "Must start with",
      mk_chain_first: "Any name starts the chain",
      mk_any_name: "Any name of this kind",
      mk_name_ph: "Type the name…",
      mk_liar: "Liar!",
      mk_giveup: "I've got nothing",
      mk_skip: "Skip",
      mk_penalty: "+¼ and skip",
      mk_no_letters: "No letters yet",
      mk_own_letter: "That's your own letter",
      mk_flip: "Overrule",
      mk_timed_out: "Time's up",
      mk_timed_out_host: "Time's up: a quarter, or skip them?",
      mk_v_closed: "🔒 {name} closed \"{word}\" and takes a quarter",
      mk_v_liar_right: "🤥 Liar indeed! Nothing starts with \"{word}\". A quarter to {name}",
      mk_v_liar_wrong: "✅ There is: {examples}. A quarter to {name} for the wrong call",
      mk_v_giveup: "🐵 {name} had nothing, a quarter",
      mk_v_timeout: "⏰ {name} ran out of time, a quarter",
      mk_v_monkey: "🐵 {name} is a monkey! Nobody talk to them",
      mk_v_swap: "🔄 {other} is back in, {name} is the monkey now",
      mk_v_flipped: "↩️ The table overruled: a quarter to {name}",
      mk_you_monkey: "🐵 You are the monkey! Don't speak until someone slips and talks to you",
      mk_bub_1: "A quarter…",
      mk_bub_2: "Careful!",
      mk_bub_3: "One to go!",
      mk_bub_4: "I'm a monkey!",
      mk_row_monkey: "I'm a monkey now!",
      mk_did_you_mean: "❓ Did you mean \"{name}\"?",
      mk_not_found: "❌ Not in the list",
      mk_used: "🚫 \"{name}\" was already said",
      mk_wrong_letter: "It has to start with \"{letter}\"",
      mk_words_said: "What was said",
      mk_winners: "Winners",
      mk_back_to_board: "Back to the board",
    }
  },
  rules: {
    ar: {
      monkey: `
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li><b>حرف حرف</b>: كل واحد في دوره يضيف حرف على الموبايل، والكل شايف الكلمة. اللي حروفه تقفل <b>اسم حقيقي</b> (مصر، ماليزيا…) ياخد <b>ربع قرد</b>.</li>
                <li>شاكك إن اللي قبلك بيخترع؟ اضغط <b>كذاب</b>. الموبايل يشوف القايمة: لو مفيش اسم يبدأ بالحروف دي، اللي اخترع ياخد الربع. لو في، اللي اتهم ياخده والموبايل يقول إيه اللي كان ممكن. الطاولة تقدر تعكس الحكم.</li>
                <li><b>مفيش عندي</b> = ربع. الوقت خلص = ربع (تقدر تطفي ده من الإعدادات).</li>
                <li>4 أرباع = <b>قرد</b>: بيتعدّى في الدور، وممنوع حد يكلمه. اللي يكلمه ياخد مكانه (زر <b>تبديل</b>).</li>
                <li>لما يفضل عدد الفايزين اللي اخترته، اللعبة تخلص.</li>
                <li>الحكم اللي خلّى حد قرد كان غلط؟ شاشة الفايز فيها <b>عكس الحكم</b> و<b>رجوع للّعبة</b>.</li>
            </ol>
            <p class="help-sub">🔗 آخر حرف</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>كل واحد يكتب اسم (دولة، مدينة، حيوان، أكلة) يبدأ بآخر حرف في الاسم اللي قبله. الموبايل يرفض اللي مش في القايمة أو اللي اتقال قبل كده أو اللي بحرف غلط. مفيش عندك؟ ربع قرد.</li>
            </ul>
            <p class="help-sub">📋 اسم اسم</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>نفس الفكرة من غير شرط الحرف: اسم في كل دور، حقيقي ومتقالش.</li>
            </ul>
            <p class="help-sub">📱 على موبايلات منفصلة</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>كل واحد يكتب حرفه أو اسمه من موبايله لما ييجي دوره، والكلمة وأرباع القرد على كل الموبايلات وعلى التلفزيون. أي حد يقدر يضغط كذاب على آخر حرف، والمضيف معاه تراجع وتخطي والتبديل.</li>
            </ul>`,
    },
    en: {
      monkey: `
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li><b>Letter by letter</b>: each player adds a letter on the phone and everyone sees the word. Whoever's letter closes a <b>real name</b> (Egypt, Malaysia…) takes a <b>quarter monkey</b>.</li>
                <li>Think the player before you is making it up? Press <b>Liar</b>. The phone checks its list: if no name starts with those letters the bluffer takes the quarter; if one does, the caller takes it and the phone shows what it could have been. The table can overrule.</li>
                <li><b>I've got nothing</b> = a quarter. Out of time = a quarter (you can switch that off).</li>
                <li>Four quarters = a <b>monkey</b>: skipped in the order, and nobody may talk to them. Whoever does takes their place (the <b>Swap</b> button).</li>
                <li>When only the chosen number of winners is left, the game ends.</li>
                <li>The verdict that made someone a monkey was wrong? The winner screen has <b>overrule</b> and <b>back to the board</b>.</li>
            </ol>
            <p class="help-sub">🔗 Last letter</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>Each player types a name (a country, a city, an animal, a food) that starts with the last letter of the one before. The phone refuses anything not in the list, already said, or on the wrong letter. Nothing? A quarter.</li>
            </ul>
            <p class="help-sub">📋 One name each</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>The same without the letter rule: one real, unused name a turn.</li>
            </ul>
            <p class="help-sub">📱 On separate phones</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>Everyone types their letter or name on their own phone on their turn; the word and the quarters show on every phone and the TV. Anyone can call Liar on the last letter, and the host has undo, skip and the swap.</li>
            </ul>`,
    }
  }
});
