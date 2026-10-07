/* mind: the words only this game's screens show, and its rules (Help, the
   first-play card). The build puts them into TRANSLATIONS and GAME_RULES (tools/game-text.cjs):
   read them as t.<key> and GAME_RULES[lang].<id>, as everywhere. */
gameText({
  translations: {
    ar: {
      mind_lobby_hint: "كل واحد هياخد أرقام من 1 لـ 100 محدش غيره شايفها. نزّلوها بالترتيب من غير ما حد يتكلم.",
      mind_level: "المستوى",
      mind_pile: "آخر ورقة نزلت",
      mind_your_cards: "الورق اللي معاك",
      mind_play_hint: "انزل أصغر ورقة معاك لما تحس إن مفيش أصغر منها مع حد.",
      mind_none: "خلص ورقك — استنى الباقيين",
      mind_missed: "ضاع منكم:",
      mind_ruler: "خط الأرقام",
      mind_miss_line: "{n} نزلت وكان لسه فيه {m}",
      mind_miss_with: "{n} كانت مع {name}",
      mind_miss_who: "{list} · عادي، كده بنتعلّم إيقاع بعض 💜",
      mind_played_by: "آخر ورقة من {name}",
      mind_level_done: "خلصتوا المستوى {n} 👏",
      mind_next_deals: "المستوى اللي بعده: {n} ورق لكل واحد",
      mind_next_level: "المستوى اللي بعده",
      mind_won: "خلصتوا كل المستويات!",
      mind_lost: "القلوب خلصت",
      mind_reached: "وصلتوا للمستوى {n}",
      mind_level_of: "المستوى {n} من {max}",
      mind_last_level: "المستوى الأخير: {n} ورق لكل واحد — خلّصوه وتكسبوا",
      mind_won_all: "خلّصتوا الـ {max} مستويات من غير ولا كلمة",
    },
    en: {
      mind_lobby_hint: "Everyone gets numbers from 1 to 100 that nobody else can see. Lay them down in rising order, without talking.",
      mind_level: "Level",
      mind_pile: "Last card down",
      mind_your_cards: "Your cards",
      mind_play_hint: "Play your lowest card when you believe nobody holds one lower.",
      mind_none: "You are out of cards — wait for the others",
      mind_missed: "Lost:",
      mind_ruler: "The number line",
      mind_miss_line: "{n} went down while {m} was still out",
      mind_miss_with: "{n} was with {name}",
      mind_miss_who: "{list} · that's fine, it's how we learn each other's pace 💜",
      mind_played_by: "Last card from {name}",
      mind_level_done: "Level {n} cleared 👏",
      mind_next_deals: "Next level: {n} cards each",
      mind_next_level: "Next level",
      mind_won: "You cleared every level!",
      mind_lost: "The hearts are gone",
      mind_reached: "You reached level {n}",
      mind_level_of: "Level {n} of {max}",
      mind_last_level: "The last level: {n} cards each — clear it and you win",
      mind_won_all: "All {max} levels, without a word",
    }
  },
  rules: {
    ar: {
      mind: `
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li>لعبة تعاونية: مفيش فرق ومفيش كسبان واحد — يا تكسبوا كلكم يا تخسروا كلكم.</li>
                <li>كل واحد بياخد أرقام من <b>1 لـ 100</b> على موبايله، محدش غيره شايفها. المستوى الأول ورقة لكل واحد، والتاني اتنين، وهكذا.</li>
                <li>المطلوب تنزلوا الورق كله <b>من الأصغر للأكبر</b> — من غير ما حد يقول رقمه ولا يلمّح له.</li>
                <li>لما تحس إن مفيش رقم أصغر من اللي معاك مع حد، انزل أصغر ورقة معاك.</li>
                <li>لو طلع إن حد كان معاه أصغر منها، <b>تخسروا قلب</b>، وكل ورقة أصغر من اللي نزلت بتتقلب وتتشال — عشان اللعب يكمل.</li>
                <li>القلوب بتبدأ بعدد اللاعبين. لما تخلص، اللعبة تنتهي.</li>
                <li>خلّصتوا المستوى؟ المضيف ينزّل المستوى اللي بعده، بورقة زيادة لكل واحد.</li>
                <li><b>تكسبوا</b> لما تخلّصوا آخر مستوى: <b>12</b> مستوى لو انتوا اتنين، <b>10</b> لو تلاتة، و<b>8</b> لو أربعة أو أكتر. الموبايل والشاشة بيقولوا «المستوى 3 من 10».</li>
            </ol>
            <p class="help-sub">💡 نصايح</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>الصمت جزء من اللعبة. الاستنى نفسه هو الكلام: كل ما تستنى أكتر، ورقتك أكبر.</li>
                <li>اتفقوا بس على لحظة البداية، وبعدها بصوا على بعض ولا تتكلموا.</li>
            </ul>
            <p class="help-sub">📺 على التلفزيون</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>الشاشة بتوري المستوى والقلوب وآخر ورقة نزلت، وكل واحد فاضل معاه كام ورقة — من غير الأرقام نفسها.</li>
            </ul>`,
    },
    en: {
      mind: `
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li>A cooperative game: no teams and no single winner — you all win or you all lose.</li>
                <li>Everyone gets numbers from <b>1 to 100</b> on their own phone that nobody else can see. Level 1 is one card each, level 2 is two, and so on.</li>
                <li>You have to lay every card down <b>from lowest to highest</b> — without anyone saying their number or hinting at it.</li>
                <li>When you believe nobody holds anything lower than your lowest card, play it.</li>
                <li>If somebody did hold something lower, <b>you lose a heart</b>, and every card lower than the one played is turned face up and taken away — so the level keeps moving.</li>
                <li>You start with a heart per player. When they run out, the game is over.</li>
                <li>Cleared the level? The host deals the next one, with one more card each.</li>
                <li><b>You win</b> when you clear the last level: <b>12</b> levels for two players, <b>10</b> for three, <b>8</b> for four or more. The phones and the screen say "Level 3 of 10".</li>
            </ol>
            <p class="help-sub">💡 Tips</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>The silence is the game. Waiting is the only language: the longer you wait, the higher your card.</li>
                <li>Agree only on when to start, then look at each other and say nothing.</li>
            </ul>
            <p class="help-sub">📺 On the TV</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
                <li>The screen shows the level, the hearts, the last card down and how many cards each player still holds — never the numbers themselves.</li>
            </ul>`,
    }
  }
});
