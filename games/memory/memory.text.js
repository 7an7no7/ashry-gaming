/* memory: the words only this game's screens show, and its rules (Help, the
   first-play card). The build puts them into TRANSLATIONS and GAME_RULES (tools/game-text.cjs):
   read them as t.<key> and GAME_RULES[lang].<id>, as everywhere. */
gameText({
  translations: {
    ar: {
      mem_best: "أفضل نتيجة",
      mem_moves: "حركة",
      mem_time: "الوقت",
      mem_player1: "لاعب 1",
      mem_player2: "لاعب 2",
      mem_card: "كارت",
      mem_tie: "تعادل!",
      mem_new_best: "رقم قياسي جديد! 🎉",
      mem_done: "برافو! 🎉",
    },
    en: {
      mem_best: "Best",
      mem_moves: "moves",
      mem_time: "Time",
      mem_player1: "Player 1",
      mem_player2: "Player 2",
      mem_card: "Card",
      mem_tie: "It's a tie!",
      mem_new_best: "New record! 🎉",
      mem_done: "Well done! 🎉",
    }
  },
  rules: {
    ar: {
      memory: `
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li>الكروت كلها مقلوبة، وكل صورة ليها كارت تاني زيها. اقلب كارتين: زي بعض يفضلوا مفتوحين، غير كده يتقفلوا.</li>
                <li><b>لوحدك</b>: خلّص اللوحة بأقل حركات وأسرع وقت، والموبايل بيحفظ أحسن نتيجة.</li>
                <li><b>لاعبين اتنين</b>: اللي يلاقي زوج ياخد نقطة ويكمّل دوره. الأكتر أزواج يكسب.</li>
            </ol>`,
    },
    en: {
      memory: `
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li>All the cards are face down and every picture has a twin. Turn two over: a match stays up, a miss turns back.</li>
                <li><b>Solo</b>: clear the board in the fewest moves and the fastest time; the phone remembers your best.</li>
                <li><b>Two players</b>: finding a pair scores a point and keeps your turn. Most pairs wins.</li>
            </ol>`,
    }
  }
});
