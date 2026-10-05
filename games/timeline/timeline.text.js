/* timeline: the words only this game's screens show, and its rules (Help, the
   first-play card). The build puts them into TRANSLATIONS and GAME_RULES (tools/game-text.cjs):
   read them as t.<key> and GAME_RULES[lang].<id>, as everywhere. */
gameText({
  translations: {
    ar: {
      tl_lobby_hint: "كل واحد معاه ورق فيه أحداث من غير سنة. حطّ ورقتك في مكانها الصح على خط الزمن.",
      tl_turn_of: "الدور على",
      tl_your_cards: "الورق اللي معاك",
      tl_pick_card: "اختار ورقة الأول",
      tl_now_gap: "دلوقتي اضغط على المكان اللي تحطها فيه",
      tl_wait_turn: "مستنيين ورقة {name}",
      tl_put_here: "حطها هنا",
      tl_none: "خلص ورقك",
      tl_skip: "عدّي الدور",
      tl_over: "خلصت اللعبة",
      tl_deck_out: "الورق خلص: يكسب اللي حط أكتر ورق في مكانه الصح",
      tl_nobody: "محدش حط كارت في مكانه الصح",
    },
    en: {
      tl_lobby_hint: "Everyone holds event cards with the year hidden. Put yours in the right place on the timeline.",
      tl_turn_of: "It's the turn of",
      tl_your_cards: "Your cards",
      tl_pick_card: "Pick a card first",
      tl_now_gap: "Now tap the gap you want to put it in",
      tl_wait_turn: "Waiting for {name} to place a card",
      tl_put_here: "Put it here",
      tl_none: "You are out of cards",
      tl_skip: "Skip the turn",
      tl_over: "Game over",
      tl_deck_out: "The cards ran out: most cards in the right place wins",
      tl_nobody: "Nobody put a card in the right place",
    }
  },
  rules: {
    ar: {
      timeline: `
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li>ورقة واحدة بتبدأ خط الزمن على الترابيزة، وكل واحد بياخد ورق فيه أحداث <b>من غير سنة</b>.</li>
                <li>في دورك: اختار ورقة من ورقك، وبعدين اضغط على المكان اللي شايف إنها تتحط فيه — قبل أول ورقة، بين ورقتين، أو بعد آخر واحدة.</li>
                <li>الموبايل يعرف السنة الحقيقية: لو صح، الورقة تفضل مكانها وتنقص من ورقك ونقطة ليك.</li>
                <li>لو غلط، السنة تظهر للكل، الورقة تخرج من اللعبة، وتسحب واحدة جديدة مكانها — يعني ورقك ما بيقلّش غير لما تحط صح.</li>
                <li>أول واحد يخلص ورقه كله يكسب.</li>
            </ol>
            <p class="help-sub">💡 نصايح</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>مش لازم تعرف السنة بالظبط — يكفي تعرف الحدث ده قبل ولا بعد اللي قدامك.</li>
                <li>كل ما الخط يطول، كل ما الأماكن تبقى أضيق واللعبة أصعب.</li>
            </ul>
            <p class="help-sub">📺 على التلفزيون</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>الشاشة بتوري خط الزمن كامل وآخر ورقة اتحطت وسنتها، وكل واحد فاضل معاه كام ورقة.</li>
            </ul>`,
    },
    en: {
      timeline: `
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li>One card starts the timeline on the table, and everyone holds event cards <b>with no year on them</b>.</li>
                <li>On your turn: pick one of your cards, then tap the gap where you think it belongs — before the first card, between two of them, or after the last.</li>
                <li>The phone knows the real year: if you are right, the card stays where you put it, your hand is one smaller and you take a point.</li>
                <li>If you are wrong, the year is shown to everyone, the card is out of the game, and you draw a new one — so your hand only shrinks when you get it right.</li>
                <li>The first to get rid of all their cards wins.</li>
            </ol>
            <p class="help-sub">💡 Tips</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>You don't need the exact year — only whether it came before or after the cards in front of you.</li>
                <li>The longer the line gets, the narrower the gaps and the harder the game.</li>
            </ul>
            <p class="help-sub">📺 On the TV</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>The screen shows the whole line, the last card placed with its year, and how many cards each player still holds.</li>
            </ul>`,
    }
  }
});
