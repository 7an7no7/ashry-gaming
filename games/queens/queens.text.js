/* queens: the words only this game's screens show, and its rules (Help, the
   first-play card). The build puts them into TRANSLATIONS and GAME_RULES (tools/game-text.cjs):
   read them as t.<key> and GAME_RULES[lang].<id>, as everywhere. */
gameText({
  translations: {
    ar: {
      race_unit_crowns: "تيجان",
      queens_placed: "التيجان",
      queens_hint: "لمسة ✕، لمستين 👑، واسحب عشان تعلّم ✕ على كذا خانة",
      queens_patterns: "🔣 نقشة لكل لون",
      queens_patterns_hint: "كل منطقة ليها نقشة خفيفة (نقط، خطوط…) فوق لونها، عشان تفرّق بينهم لو الألوان شبه بعض.",
    },
    en: {
      race_unit_crowns: "crowns",
      queens_placed: "Crowns",
      queens_hint: "Tap for ✕, twice for 👑; drag to mark ✕ on many cells",
      queens_patterns: "🔣 A pattern for each colour",
      queens_patterns_hint: "Each region gets a faint pattern (dots, stripes…) over its colour, so regions stay apart when colours look alike.",
    }
  },
  rules: {
    ar: {
      queens: `
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li>اللوحة مقسومة ألوان. حط <b>👑 تاج واحد</b> في كل صف، وكل عمود، وكل لون.</li>
                <li>مفيش تاجين يلمسوا بعض، ولا حتى من الركن.</li>
                <li>لمسة بتحط ✕ (خانة متأكد إنها فاضية)، ولمسة تانية بتحط 👑، وتالتة بتمسح. اسحب صباعك عشان تحط ✕ على كذا خانة مرة واحدة.</li>
                <li>التاج اللي بيكسر قاعدة بيتعلم بالأحمر. كل لوحة ليها حل واحد بس.</li>
                <li><b>🔣 نقشة لكل لون</b> (في الإعدادات): نقشة خفيفة فوق كل منطقة، لو الألوان صعب تفرّق بينها.</li>
            </ol>
            <p class="help-sub">📱 سباق ألغاز (في غرفة)</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>نفس اللغز للكل، وكل واحد بيحلّه على موبايله. الشاشة والتلفزيون بيوروا التقدم بس: التيجان اللي اتحطت.</li>
                <li><b>الكل يخلّص</b>: الجولة تخلص لما الكل يخلّص أو الوقت (3 دقايق). الحل 10 نقط + بونص للأسرع (+5، +4…).</li>
                <li><b>Fast 3</b>: أول 3 يخلّصوا ياخدوا 10 و7 و5، وبعدها 10 ثواني لأي حد يلحق ياخد 2، والجولة تقفل. بيتختار لوحده من 5 أشخاص.</li>
                <li><b>استسلم</b> بيخلّصك بصفر عشان الجولة تكمّل. من غير تلميحات.</li>
                ${RACE_MIX_RULE.ar}
            </ul>`,
    },
    en: {
      queens: `
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li>The board is split into colours. Place <b>one 👑</b> in every row, every column and every colour.</li>
                <li>No two crowns may touch, not even corner to corner.</li>
                <li>One tap marks ✕ (a cell you know is empty), a second places 👑, a third clears. Drag to mark ✕ on many cells at once.</li>
                <li>A crown that breaks a rule turns red. Every board has exactly one solution.</li>
                <li><b>🔣 A pattern for each colour</b> (in the setup): a faint pattern over each region, for when the colours are hard to tell apart.</li>
            </ol>
            <p class="help-sub">📱 Puzzle race (in a room)</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>The same puzzle for everyone, each solving on their own phone. The screens show progress only: crowns placed.</li>
                <li><b>Everyone finishes</b>: the round ends when everyone is done or the clock runs out (3 minutes). A solve is 10 points plus a bonus for the fastest (+5, +4…).</li>
                <li><b>Fast 3</b>: the first three to finish score 10, 7 and 5; anyone finishing in the ten seconds after scores 2, then the round closes. Preselected from five people.</li>
                <li><b>Give up</b> ends your round with 0 so the others can go on. No hints.</li>
                ${RACE_MIX_RULE.en}
            </ul>`,
    }
  }
});
