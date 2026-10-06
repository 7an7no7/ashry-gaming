/* Laser (الليزر): the words only this game's screens show, and its rules (Help, the
   first-play card). The build puts them into TRANSLATIONS and GAME_RULES (tools/game-text.cjs):
   read them as t.<key> and GAME_RULES[lang].laser, as everywhere. Made by tools/new-game.mjs. */
gameText({
  translations: {
    ar: {
      setup_laser: "الليزر",
      cat_laser: "استخبى وصوّب من غير ما تشوف حد، وبعدين الكل يضرب مرة واحدة",
      laser_lobby_hint: "كل واحد يختار مكانه واتجاهه على موبايله من غير ما يشوف حد. بعدين الكل يظهر ويضرب مرة واحدة، واللي في خط ليزر يخرج. آخر واحد واقف يكسب.",
      laser_teams_label: "الفرق",
      laser_teams_off: "كل واحد لنفسه",
      laser_t2: "فريقين",
      laser_t3: "٣ فرق",
      laser_t4: "٤ فرق",
      laser_team_0: "السماوي",
      laser_team_1: "الوردي",
      laser_team_2: "الأصفر",
      laser_team_3: "الأخضر",
      laser_your_team: "فريقك",
      laser_teams_title: "الفرق",
      laser_shuffle: "🔀 خلّط الفرق",
      laser_go: "يلا نبدأ",
      laser_teams_wait: "المضيف بيظبط الفرق…",
      laser_hide_hint: "المس مكانك واسحب لاتجاهك · محدش شايفك",
      laser_ready: "جاهز ✓",
      laser_unready: "استنى، هغيّر",
      laser_ready_wait: "جاهز. مستنيين الباقيين أو الوقت…",
      laser_you: "انت",
      laser_out_watch: "خرجت. بتتفرج على الباقيين",
      laser_watch: "بتتفرج: هتلعب الجاية",
      laser_tv_hide: "استخبّوا وصوّبوا على موبايلاتكم",
      laser_show: "اظهروا!",
      laser_charge: "بيشحنوا…",
      laser_fire: "⚡ ضرب!",
      laser_out: "خرج:",
      laser_nobody: "ولا حد اتضرب!",
      laser_shrink: "الحلبة بتصغر",
      laser_tie: "كلهم خرجوا مع بعض: هم بس يكمّلوا",
      laser_next: "التالي",
      laser_won: "آخر واحد واقف",
      laser_team_won: "الفريق الكسبان",
      laser_out_in: "خرج في الجولة",
      laser_last: "فضل لحد الآخر",
      laser_left: "باقيين",
    },
    en: {
      setup_laser: "Laser",
      cat_laser: "Hide and aim without seeing anyone, then everyone fires at once",
      laser_lobby_hint: "Everyone picks a spot and an aim on their phone without seeing anyone. Then everyone appears and fires at once, and whoever is in a laser's line is out. The last one standing wins.",
      laser_teams_label: "Teams",
      laser_teams_off: "Every one for themselves",
      laser_t2: "2 teams",
      laser_t3: "3 teams",
      laser_t4: "4 teams",
      laser_team_0: "Cyan",
      laser_team_1: "Pink",
      laser_team_2: "Yellow",
      laser_team_3: "Green",
      laser_your_team: "Your team",
      laser_teams_title: "The teams",
      laser_shuffle: "🔀 Shuffle the teams",
      laser_go: "Let's go",
      laser_teams_wait: "The host is setting the teams…",
      laser_hide_hint: "Touch your spot and drag to aim · nobody can see you",
      laser_ready: "Ready ✓",
      laser_unready: "Wait, I'll change",
      laser_ready_wait: "Ready. Waiting for the others or the clock…",
      laser_you: "You",
      laser_out_watch: "You're out. Watching the others",
      laser_watch: "Watching: you're in the next game",
      laser_tv_hide: "Hide and aim on your phones",
      laser_show: "Show yourselves!",
      laser_charge: "Charging…",
      laser_fire: "⚡ Fire!",
      laser_out: "Out:",
      laser_nobody: "Nobody was hit!",
      laser_shrink: "The arena shrinks",
      laser_tie: "They all went out together: only they play on",
      laser_next: "Next",
      laser_won: "Last one standing",
      laser_team_won: "The winning team",
      laser_out_in: "Out in round",
      laser_last: "Stood to the end",
      laser_left: "left",
    }
  },
  rules: {
    ar: {
      laser: `
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li>كل جولة: المس مكانك على الحلبة واسحب لاتجاهك، في <b>15 ثانية</b> أو لحد ما الكل يجهز. محدش شايف حد.</li>
                <li>بعدين الكل يظهر و<b>الكل يضرب مرة واحدة</b>. الليزر بيعدّي من كل اللي في خطه، واللي يتضرب يخرج.</li>
                <li>الحلبة بتصغر كل جولة. آخر واحد واقف يكسب.</li>
                <li>لو اللي فاضلين خرجوا كلهم مع بعض، هم بس يكمّلوا لحد ما يفضل واحد.</li>
                <li>بالفرق: الليزر بيعدّي من زميلك من غير ما يأذيه، وآخر فريق فيه حد واقف يكسب.</li>
            </ol>`,
    },
    en: {
      laser: `
            <ol class="list-decimal list-inside space-y-1 text-xs">
                <li>Each round: touch your spot on the arena and drag to aim, within <b>15 seconds</b> or until everyone is ready. Nobody sees anyone.</li>
                <li>Then everyone appears and <b>everyone fires at once</b>. A laser goes through everyone in its line, and whoever is hit is out.</li>
                <li>The arena shrinks every round. The last one standing wins.</li>
                <li>If the last ones all go out together, only they play on until one is left.</li>
                <li>In teams: a laser passes through your teammates harmlessly, and the last team with anyone standing wins.</li>
            </ol>`,
    }
  }
});
