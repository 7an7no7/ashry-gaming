/* dice: the words only this game's screens show, and its rules (Help, the
   first-play card). The build puts them into TRANSLATIONS and GAME_RULES (tools/game-text.cjs):
   read them as t.<key> and GAME_RULES[lang].<id>, as everywhere. */
gameText({
  translations: {
    ar: {
      coin_heads: "ملك",
      coin_tails: "كتابة",
    },
    en: {
      coin_heads: "Heads",
      coin_tails: "Tails",
    }
  },
  rules: {
    ar: {
      dice: `
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>نرد واحد أو اتنين بدل الزهر الحقيقي.</li>
                <li>وقرعة عملة (ملك / كتابة) بلمسة واحدة.</li>
            </ul>`,
    },
    en: {
      dice: `
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>One or two dice instead of the real thing.</li>
                <li>And a coin toss (heads / tails) with one tap.</li>
            </ul>`,
    }
  }
});
