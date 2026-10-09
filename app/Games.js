/* ============================================================================
   THE GAMES: one entry per game, read by the page and the rooms server
   ----------------------------------------------------------------------------
   Everything the app knows about a game as a whole is here, once (2 Oct 2026:
   removing على نفس الموجة took edits to eleven separate lists). The home's
   catalog (GAME_CATALOG, JS_Catalog.html), a room's list of games
   (ROOM_HUB_GAMES, JS_Room.html), the server's room games (ROOM_GAME_IDS), the
   ids it counts (APP_GAME_IDS), «التالي لوحده», the program's rounds and
   الشلة's titles are all built from it. A new game is one entry here; a game
   removed is one entry gone. Inlined into the page (SHARED_LISTS, first) and
   bundled into the rooms server (FILES in rooms-worker/build.mjs, first).

     id       what the help sheet and the recent list know it by
     icon     'art:<name>' drawn in ICON_ART (JS_Core.html), or an emoji; drawn
              with iconHtml(), never ${g.icon} straight into markup
     title    i18n key of its name;  desc  i18n key of its one-line pitch
     accent   its palette (see [data-accent] in Style.html)
     players  [min, max];  mins  how long a round takes, roughly
     modes    how it can be played: device (pass one phone), room (everyone
              on their own phone), tv (a room shown on a big screen)
     group    which section of the home it sits in (CATALOG_GROUPS)
     hub      the card it lives inside (a way of another game; HUB_WAYS)
     setup    the view the hero is drawn on; absent for full-screen tools
     room     a room game: { min } people to start it (computer players may
              fill the rest), and, when they apply: id (the room game's id when
              it differs from the card's: شطرنج is 'chess' in rooms), rounds (in
              برنامج السهرة, for a game with no end of its own), autoNext (the
              lobby's «التالي لوحده» switch; AUTONEXT_GAMES in RoomGames.js
              runs it, and rules.mjs checks the two agree)
     crew     the title of الشلة a first place in it counts toward (CREW_TITLES)
     added    'YYYY-MM-DD' a new game reached the app: its poster (and its recent
              tile) carries «جديد» for 14 days, until this phone has played it
              (catalogIsNew, JS_Catalog.html); nothing to take off afterwards
     open     what the card does, when it isn't the default: a function's name,
              or [name, argument]. The default opens its setup screen, or, with
              no setup, a room for it (catalogRunOpen, JS_Catalog.html)
   ========================================================================= */
const GAME_LIST = [
  /* --- خداع وتخمين --- */
  { id: 'imposter',   icon: 'art:imposter', title: 'setup_imposter',   desc: 'cat_imposter',   accent: 'violet', players: [3, 12], mins: 10, modes: ['device', 'room', 'tv'], faceToFace: true, group: 'deduce', setup: 'setup-imposter', room: { min: 3 }, crew: 'detective' },
  { id: 'chameleon',  icon: 'art:chameleon',   title: 'setup_chameleon',  desc: 'cat_chameleon',  accent: 'amber',  players: [3, 10], mins: 10, modes: ['device', 'room', 'tv'], faceToFace: true, group: 'deduce', setup: 'setup-chameleon', room: { min: 3 }, crew: 'detective', open: 'setupChameleon' },
  { id: 'spyfall',    icon: 'art:spyfall',   title: 'setup_spyfall',    desc: 'cat_spyfall',    accent: 'rose',   players: [3, 10], mins: 10, modes: ['device', 'room', 'tv'], faceToFace: true, group: 'deduce', setup: 'setup-spyfall', room: { min: 3 }, crew: 'detective', open: 'setupSpyfall' },
  { id: 'fakeartist', icon: 'art:fakeartist', title: 'setup_fakeartist', desc: 'cat_fakeartist', accent: 'pink',   players: [3, 12], mins: 10, modes: ['room', 'tv'],           group: 'deduce', room: { min: 3 }, crew: 'detective' },
  { id: 'fibbage',    icon: 'art:fibbage',   title: 'setup_fibbage',    desc: 'cat_fibbage',    accent: 'rose',   players: [3, 12], mins: 15, modes: ['room', 'tv'],           group: 'deduce', room: { min: 3, rounds: 4, autoNext: true }, crew: 'liar' },
  { id: 'mafia',      icon: 'art:mafia',  title: 'setup_mafia',      desc: 'cat_mafia',      accent: 'rose',   players: [5, 12], mins: 25, modes: ['room', 'tv'], faceToFace: true, group: 'deduce', room: { min: 5 }, crew: 'detective' },
  { id: 'twotruths',  icon: 'art:twotruths',   title: 'setup_twotruths',  desc: 'cat_twotruths',  accent: 'rose',   players: [3, 12], mins: 15, modes: ['room', 'tv'],           group: 'deduce', room: { min: 3, autoNext: true }, crew: 'liar' },
  { id: 'guesswho',   icon: 'art:guesswho', title: 'setup_guesswho', desc: 'cat_guesswho', accent: 'teal', players: [2, 12], mins: 10, modes: ['room', 'tv'],       group: 'deduce', room: { min: 2 }, crew: 'detective' },
  { id: 'witness',    icon: 'art:witness', title: 'setup_witness', desc: 'cat_witness', accent: 'indigo', players: [3, 12], mins: 20, modes: ['room', 'tv'], faceToFace: true, group: 'deduce', room: { min: 3 }, crew: 'detective' },
  { id: 'box',        icon: 'art:box',     title: 'setup_box',     desc: 'cat_box',     accent: 'rose',   players: [3, 8],  mins: 20, modes: ['room', 'tv'], faceToFace: true, group: 'deduce', room: { min: 3 }, crew: 'liar' },
  { id: 'timeline',   icon: 'art:timeline',  title: 'setup_timeline',   desc: 'cat_timeline',   accent: 'amber',  players: [2, 12], mins: 15, modes: ['room', 'tv'],           group: 'quiz', room: { min: 2 }, crew: 'brain' },

  /* --- كلمات، رسم وتمثيل --- */
  { id: 'charades',   icon: 'art:charades',   title: 'setup_charades',   desc: 'cat_charades',   accent: 'violet', players: [2, 20], mins: 5,  modes: ['device'],               group: 'words', setup: 'setup-charades', open: 'setupCharades' },
  { id: 'describe',   icon: 'art:describe',  title: 'setup_describe',   desc: 'cat_describe',   accent: 'indigo', players: [2, 20], mins: 5,  modes: ['device'],               group: 'words', setup: 'setup-describe', open: 'setupDescribe' },
  { id: 'timesup',    icon: 'art:timesup',  title: 'setup_timesup',    desc: 'cat_timesup',    accent: 'blue',   players: [4, 20], mins: 20, modes: ['device'],               group: 'words', setup: 'setup-timesup', open: 'setupTimesUp' },
  { id: 'whoami',     icon: 'art:whoami',   title: 'setup_whoami',     desc: 'cat_whoami',     accent: 'teal',   players: [2, 10], mins: 10, modes: ['device', 'room', 'tv'], faceToFace: true, group: 'words', setup: 'setup-whoami', room: { min: 2 }, crew: 'words', open: 'setupWhoAmI' },
  { id: 'justone',    icon: 'art:justone',   title: 'setup_justone',    desc: 'cat_justone',    accent: 'rose',   players: [3, 10], mins: 15, modes: ['device', 'room', 'tv'], faceToFace: true, group: 'words', setup: 'setup-justone', room: { min: 3, rounds: 5 }, crew: 'words' },
  { id: 'codenames',  icon: 'art:codenames',   title: 'setup_codenames',  desc: 'cat_codenames',  accent: 'indigo', players: [4, 12], mins: 20, modes: ['room', 'tv'],           group: 'words', setup: 'setup-codenames', room: { min: 4 }, crew: 'words' },
  { id: 'hangman',    icon: 'art:hangman', title: 'setup_hangman', desc: 'cat_hangman',  accent: 'orange', players: [2, 12], mins: 10, modes: ['device', 'room', 'tv'], group: 'words', setup: 'setup-hangman', room: { min: 2 }, crew: 'brain', open: 'setupHangman' },
  /* --- رياضة --- */
  { id: 'bowling',    icon: 'art:bowling',   title: 'setup_bowling',    desc: 'cat_bowling',    accent: 'violet', players: [1, 12], mins: 10, modes: ['device', 'room', 'tv'], group: 'sports', setup: 'setup-bowling', room: { min: 1 }, crew: 'sport', open: 'setupBowling' },
  { id: 'drawguess',  icon: 'art:drawguess',   title: 'setup_drawguess',  desc: 'cat_drawguess',  accent: 'blue',   players: [2, 12], mins: 10, modes: ['room', 'tv'],           group: 'words', room: { min: 2, rounds: 6 }, crew: 'words' },
  { id: 'hear',       icon: 'art:hear',   title: 'setup_hear',       desc: 'cat_hear',       accent: 'green',  players: [3, 12], mins: 20, modes: ['room', 'tv'], faceToFace: true, group: 'words', room: { min: 3 }, crew: 'words', added: '2026-10-01' },
  { id: 'telephone',  icon: 'art:telephone',  title: 'setup_telephone',  desc: 'cat_telephone',  accent: 'blue',   players: [3, 8],  mins: 15, modes: ['room', 'tv'],           group: 'words', room: { min: 3 }, crew: 'words' },
  { id: 'monkey',     icon: 'art:monkey',   title: 'setup_monkey',     desc: 'cat_monkey',     accent: 'amber',  players: [2, 10], mins: 15, modes: ['device', 'room', 'tv'], faceToFace: true, group: 'words', setup: 'setup-monkey', room: { min: 2 }, crew: 'words' },
  { id: 'stop',       icon: 'art:stop',   title: 'setup_stop',       desc: 'cat_stop',       accent: 'green',  players: [2, 10], mins: 15, modes: ['device', 'room', 'tv'], group: 'words', setup: 'setup-stop', room: { min: 2 }, crew: 'words', open: 'setupStop' },
  { id: 'headsup',    icon: 'art:headsup',   title: 'setup_headsup',    desc: 'cat_headsup',    accent: 'green',  players: [2, 12], mins: 10, modes: ['device'],               group: 'words', setup: 'setup-headsup', open: 'setupHeadsUp' },

  /* --- حفلة وضحك --- */
  { id: 'bomb',       icon: 'art:bomb',   title: 'setup_bomb',       desc: 'cat_bomb',       accent: 'orange', players: [2, 12], mins: 5,  modes: ['device', 'room', 'tv'],               group: 'party', setup: 'setup-bomb', room: { min: 2, rounds: 5 }, crew: 'luck', open: 'setupBomb' },
  { id: 'bumper',     icon: 'art:bumper', title: 'setup_bumper',     desc: 'cat_bumper',     accent: 'teal',   players: [1, 8],  mins: 5,  modes: ['room', 'tv'], faceToFace: true,        group: 'party', room: { min: 1 }, crew: 'fast' },
  { id: 'chairs',     icon: 'art:chairs', title: 'setup_chairs',     desc: 'cat_chairs',     accent: 'amber',  players: [3, 12], mins: 5,  modes: ['room', 'tv'], faceToFace: true,        group: 'party', room: { min: 3 }, crew: 'fast' },
  { id: 'wire',       icon: 'art:wire',   title: 'setup_wire',       desc: 'cat_wire',       accent: 'orange', players: [3, 8],  mins: 10, modes: ['room', 'tv'], faceToFace: true,        group: 'party', room: { min: 3 }, crew: 'fast' },
  { id: 'laser',      icon: 'art:laser',  title: 'setup_laser',      desc: 'cat_laser',      accent: 'teal',   players: [3, 12], mins: 10, modes: ['room', 'tv'], faceToFace: true,        group: 'party', room: { min: 3 }, crew: 'fast', added: '2026-10-06' },
  { id: 'vault',      icon: 'art:vault',  title: 'setup_vault',      desc: 'cat_vault',      accent: 'amber',  players: [2, 10], mins: 15, modes: ['room', 'tv'], faceToFace: true,        group: 'party', room: { min: 2 }, crew: 'brain', added: '2026-10-01' },
  { id: 'darkroom',   icon: 'art:darkroom', title: 'setup_darkroom', desc: 'cat_darkroom',   accent: 'blue',   players: [2, 8],  mins: 15, modes: ['room', 'tv'], faceToFace: true,        group: 'party', room: { min: 2 }, crew: 'words' },
  { id: 'hum',        icon: 'art:hum',   title: 'setup_hum',         desc: 'cat_hum',        accent: 'pink',   players: [2, 12], mins: 15, modes: ['room', 'tv'], faceToFace: true,        group: 'party', room: { min: 2, autoNext: true }, crew: 'words', added: '2026-10-01' },
  { id: 'exact',      icon: 'art:exact', title: 'setup_exact',       desc: 'cat_exact',      accent: 'orange', players: [3, 12], mins: 10, modes: ['room', 'tv'], faceToFace: true,        group: 'party', room: { min: 3 }, crew: 'fast' },
  { id: 'wouldyou',   icon: 'art:wouldyou',  title: 'setup_wouldyou',   desc: 'cat_wouldyou',   accent: 'violet', players: [2, 12], mins: 10, modes: ['room', 'tv'],           group: 'party', room: { min: 2, rounds: 5, autoNext: true }, crew: 'words' },
  { id: 'mostlikely', icon: 'art:mostlikely',   title: 'setup_mostlikely', desc: 'cat_mostlikely', accent: 'amber',  players: [3, 12], mins: 10, modes: ['room', 'tv'],           group: 'party', room: { min: 3, rounds: 5, autoNext: true }, crew: 'words' },
  { id: 'herd',       icon: 'art:herd',   title: 'setup_herd',       desc: 'cat_herd',       accent: 'green',  players: [3, 12], mins: 15, modes: ['room', 'tv'],           group: 'party', room: { min: 3, autoNext: true }, crew: 'words' },
  { id: 'fiveseconds', icon: 'art:fiveseconds',  title: 'setup_fiveseconds', desc: 'cat_fiveseconds', accent: 'orange', players: [2, 12], mins: 10, modes: ['device', 'room', 'tv'], faceToFace: true, group: 'party', setup: 'setup-fiveseconds', room: { min: 2 }, crew: 'fast', open: 'setupFiveSeconds' },
  { id: 'mind',       icon: 'art:mind',   title: 'setup_mind',       desc: 'cat_mind',       accent: 'teal',   players: [2, 12], mins: 15, modes: ['room', 'tv'],           group: 'party', room: { min: 2 }, crew: 'brain' },
  { id: 'reaction',   icon: 'art:reaction',   title: 'setup_reaction',   desc: 'cat_reaction',   accent: 'rose',   players: [2, 12], mins: 2,  modes: ['device', 'room', 'tv'], group: 'party', setup: 'setup-reaction', room: { min: 2 }, crew: 'fast' },

  /* --- معلومات --- */
  { id: 'trivia',     icon: 'art:trivia',   title: 'setup_trivia',     desc: 'cat_trivia',     accent: 'indigo', players: [2, 12], mins: 15, modes: ['device', 'room', 'tv'], group: 'quiz', setup: 'setup-trivia', room: { min: 2, autoNext: true }, crew: 'brain', open: 'setupTrivia' },
  { id: 'buzzer',     icon: 'art:buzzer',   title: 'setup_buzzer',     desc: 'cat_buzzer',     accent: 'rose',   players: [2, 12], mins: 15, modes: ['room', 'tv'], faceToFace: true, group: 'quiz', room: { min: 2, rounds: 10 }, crew: 'fast' },
  { id: 'emoji',      icon: 'art:emoji',   title: 'setup_emoji',      desc: 'cat_emoji',      accent: 'amber',  players: [2, 12], mins: 10, modes: ['device', 'room', 'tv'], group: 'quiz', setup: 'setup-emoji', room: { min: 2 }, crew: 'words', open: 'setupEmoji' },
  { id: 'proverbs',   icon: 'art:proverbs',   title: 'setup_proverbs',   desc: 'cat_proverbs',   accent: 'teal',   players: [2, 12], mins: 10, modes: ['device', 'room', 'tv'], group: 'quiz', setup: 'setup-proverbs', room: { min: 2 }, crew: 'words', open: 'setupProverbs' },

  /* --- ورق وطاولة --- */
  { id: 'screw',      icon: 'art:screw',   title: 'setup_screw',      desc: 'cat_screw',      accent: 'blue',   players: [2, 12], mins: 30, modes: ['device', 'room', 'tv'], group: 'table', setup: 'setup-screw', room: { min: 2 }, crew: 'cards' },
  { id: 'uno',        icon: 'art:uno',   title: 'setup_uno',        desc: 'cat_uno',        accent: 'rose',   players: [1, 12], mins: 15, modes: ['room', 'tv'],           group: 'table', room: { min: 1 }, crew: 'cards' },
  { id: 'domino',     icon: 'art:domino',   title: 'setup_domino',     desc: 'cat_domino',     accent: 'green',  players: [1, 4],  mins: 20, modes: ['device', 'room', 'tv'], group: 'table', setup: 'setup-domino', room: { min: 1 }, crew: 'cards' },
  { id: 'ludo',       icon: 'art:ludo',  title: 'setup_ludo',       desc: 'cat_ludo',       accent: 'amber',  players: [1, 4],  mins: 20, modes: ['device', 'room', 'tv'], group: 'table', setup: 'setup-ludo', room: { min: 1 }, crew: 'luck', open: 'setupLudo' },
  { id: 'snakes',     icon: 'art:snakes', title: 'setup_snakes',    desc: 'cat_snakes',     accent: 'teal',   players: [1, 6],  mins: 15, modes: ['device', 'room', 'tv'], group: 'table', setup: 'setup-snakes', room: { min: 1 }, crew: 'luck', open: 'setupSnakes' },
  { id: 'bank',       icon: 'art:bank',  title: 'setup_bank',       desc: 'cat_bank',       accent: 'green',  players: [1, 6],  mins: 45, modes: ['device', 'room', 'tv'], group: 'table', setup: 'setup-bank', room: { min: 1 }, crew: 'luck', open: 'setupBank' },
  { id: 'doubt',      icon: 'art:doubt', title: 'setup_doubt',      desc: 'cat_doubt',      accent: 'violet', players: [1, 12], mins: 15, modes: ['room', 'tv'],           group: 'table', room: { min: 1 }, crew: 'liar' },
  { id: 'skull',      icon: 'art:skull', title: 'setup_skull',      desc: 'cat_skull',      accent: 'rose',   players: [1, 8],  mins: 20, modes: ['room', 'tv'],           group: 'table', room: { min: 1 }, crew: 'liar' },
  { id: 'chess4',     icon: 'art:chess4', title: 'setup_chess4',   desc: 'cat_chess4',     accent: 'green',  players: [1, 4],  mins: 30, modes: ['room', 'tv'],           group: 'duo', hub: 'shatranj', room: { min: 1 }, crew: 'brain' },
  { id: 'estimation', icon: 'art:estimation', title: 'setup_estimation', desc: 'cat_estimation', accent: 'green',  players: [1, 4],  mins: 45, modes: ['room', 'tv'],           group: 'table', room: { min: 1, autoNext: true }, crew: 'cards' },
  { id: 'oldmaid',    icon: 'art:oldmaid', title: 'setup_oldmaid',  desc: 'cat_oldmaid',    accent: 'amber',  players: [2, 8],  mins: 10, modes: ['room', 'tv'],           group: 'table', room: { min: 2 }, crew: 'cards' },
  // Chess for teams: a board game at the table, on everyone's phone (RoomVoteChess.js, RoomHandBrain.js).
  { id: 'votechess',  icon: 'art:votechess', title: 'setup_votechess', desc: 'cat_votechess', accent: 'indigo', players: [2, 12], mins: 25, modes: ['room', 'tv'],          group: 'duo', hub: 'shatranj', room: { min: 2 }, crew: 'brain' },
  { id: 'handbrain',  icon: 'art:handbrain', title: 'setup_handbrain', desc: 'cat_handbrain', accent: 'teal',   players: [1, 4],  mins: 20, modes: ['room', 'tv'],          group: 'duo', hub: 'shatranj', room: { min: 1 }, crew: 'brain' },
  { id: 'bughouse',   icon: 'art:bughouse', title: 'setup_bughouse', desc: 'cat_bughouse', accent: 'teal', players: [1, 4],  mins: 10, modes: ['room', 'tv'],           group: 'duo', hub: 'shatranj', room: { min: 1 }, crew: 'brain' },

  /* --- لاتنين على موبايل: two people, one phone --- */
  { id: 'memory',     icon: 'art:memory',   title: 'setup_memory',     desc: 'cat_memory',     accent: 'violet', players: [1, 2],  mins: 5,  modes: ['device'],               group: 'duo', setup: 'setup-memory', open: 'setupMemory' },
  { id: 'xo',         icon: 'art:xo',   title: 'setup_xo',         desc: 'cat_xo',         accent: 'blue',   players: [1, 2],  mins: 2,  modes: ['device', 'room', 'tv'], group: 'duo', setup: 'setup-xo', room: { min: 2 }, crew: 'brain', open: 'setupXO' },
  { id: 'connect4',   icon: 'art:connect4',   title: 'setup_connect4',   desc: 'cat_connect4',   accent: 'blue',   players: [1, 2],  mins: 5,  modes: ['device', 'room', 'tv'], group: 'duo', setup: 'setup-connect4', room: { min: 2 }, crew: 'brain', open: 'setupConnect4' },
  { id: 'dots',       icon: 'art:dots',   title: 'setup_dots',       desc: 'cat_dots',       accent: 'indigo', players: [1, 2],  mins: 10, modes: ['device', 'room', 'tv'], group: 'duo', setup: 'setup-dots', room: { min: 2 }, crew: 'brain', open: 'setupDots' },
  { id: 'battleship', icon: 'art:battleship',   title: 'setup_battleship', desc: 'cat_battleship', accent: 'teal',   players: [1, 2],  mins: 10, modes: ['device', 'room', 'tv'], group: 'duo', setup: 'setup-battleship', room: { min: 2 }, crew: 'brain', open: 'setupBattleship' },
  { id: 'shatranj',   icon: 'art:chess', title: 'setup_shatranj', desc: 'cat_shatranj', accent: 'amber',  players: [1, 12],  mins: 20, modes: ['device', 'room', 'tv'], group: 'duo', setup: 'setup-shatranj', room: { id: 'chess', min: 2 }, crew: 'brain', open: 'setupShatranj' },

  /* --- رياضة: the sports games, in real 3D (three.js, loaded when the game opens) --- */
  { id: 'minigolf',   icon: 'art:minigolf',   title: 'setup_minigolf',   desc: 'cat_minigolf',   accent: 'green',  players: [1, 12], mins: 10, modes: ['device', 'room', 'tv'], group: 'sports', setup: 'setup-minigolf', room: { min: 1 }, crew: 'sport', open: 'setupMiniGolf' },

  /* --- ألغاز لوحدك (named «ألغاز ومخ» until 3 Oct 2026) --- */
  { id: 'sudoku',     icon: 'art:sudoku',   title: 'setup_sudoku',     desc: 'cat_sudoku',     accent: 'indigo', players: [1, 12],  mins: 10, modes: ['device', 'room', 'tv'],               group: 'puzzle', setup: 'setup-sudoku', room: { min: 2 }, crew: 'brain', open: 'setupSudoku' },
  { id: 'g2048',      icon: 'art:g2048',   title: 'setup_g2048',      desc: 'cat_g2048',      accent: 'orange', players: [1, 1],  mins: 5,  modes: ['device'],               group: 'puzzle', setup: 'setup-g2048', open: 'setup2048' },
  { id: 'mines',      icon: 'art:mines',   title: 'setup_mines',      desc: 'cat_mines',      accent: 'teal',   players: [1, 12],  mins: 5,  modes: ['device', 'room', 'tv'],               group: 'puzzle', setup: 'setup-mines', room: { min: 2 }, crew: 'brain', open: 'setupMines' },
  { id: 'queens',     icon: 'art:queens',   title: 'setup_queens',     desc: 'cat_queens',     accent: 'amber',  players: [1, 12],  mins: 5,  modes: ['device', 'room', 'tv'],               group: 'puzzle', setup: 'setup-queens', room: { min: 2 }, crew: 'brain', open: 'setupQueens' },
  { id: 'tango',      icon: 'art:tango',   title: 'setup_tango',      desc: 'cat_tango',      accent: 'blue',   players: [1, 12],  mins: 5,  modes: ['device', 'room', 'tv'],               group: 'puzzle', setup: 'setup-tango', room: { min: 2 }, crew: 'brain', open: 'setupTango' },
  { id: 'nonogram',   icon: 'art:nonogram',   title: 'setup_nonogram',   desc: 'cat_nonogram',   accent: 'green',  players: [1, 12],  mins: 8,  modes: ['device', 'room', 'tv'],               group: 'puzzle', setup: 'setup-nonogram', room: { min: 2 }, crew: 'brain', open: 'setupNonogram' },
  { id: 'guessnum',   icon: 'art:guessnum',   title: 'setup_guessnum',   desc: 'cat_guessnum',   accent: 'blue',   players: [1, 12], mins: 3,  modes: ['device', 'room', 'tv'], group: 'puzzle', setup: 'setup-guessnum', room: { min: 2 }, crew: 'brain', open: 'setupGuessNumber' },

  /* --- كلمات وأسئلة لوحدك: the word games sit together (Wordle and
     Connections used to be under a heading that also said puzzles) --- */
  { id: 'daily',      icon: 'art:daily',   title: 'daily_title',      desc: 'cat_daily',      accent: 'amber',  players: [1, 1],  mins: 15, modes: ['device'],               group: 'brain', setup: 'setup-daily', open: 'openDaily' },
  { id: 'wordle',     icon: 'art:wordle',   title: 'setup_wordle',     desc: 'cat_wordle',     accent: 'green',  players: [1, 12], mins: 5,  modes: ['device', 'room', 'tv'], group: 'brain', setup: 'setup-wordle', room: { min: 2 }, crew: 'brain', open: 'setupWordle' },
  { id: 'connections', icon: 'art:connections',  title: 'setup_connections', desc: 'cat_connections', accent: 'teal', players: [1, 12],  mins: 10, modes: ['device', 'room', 'tv'],               group: 'brain', setup: 'setup-connections', room: { min: 2 }, crew: 'brain', open: 'setupConnections' },
  { id: 'streak',     icon: 'art:streak',   title: 'setup_streak',     desc: 'cat_streak',     accent: 'rose',   players: [1, 12],  mins: 5,  modes: ['device', 'room', 'tv'],               group: 'brain', setup: 'setup-streak', room: { min: 2 }, crew: 'brain', open: 'setupStreak' },
  { id: 'pinpoint',   icon: 'art:pinpoint',   title: 'setup_pinpoint',   desc: 'cat_pinpoint',   accent: 'violet', players: [1, 12],  mins: 4,  modes: ['device', 'room', 'tv'],               group: 'brain', setup: 'setup-pinpoint', room: { min: 2 }, crew: 'brain', open: 'setupPinpoint' },
  { id: 'strands',    icon: 'art:strands',   title: 'setup_strands',    desc: 'cat_strands',    accent: 'teal',   players: [1, 12],  mins: 5,  modes: ['device', 'room', 'tv'],               group: 'brain', setup: 'setup-strands', room: { min: 2 }, crew: 'brain', open: 'setupStrands' },
  { id: 'wordwheel',  icon: 'art:wordwheel',   title: 'setup_wordwheel',  desc: 'cat_wordwheel',  accent: 'orange', players: [1, 12],  mins: 5,  modes: ['device', 'room', 'tv'],               group: 'brain', setup: 'setup-wordwheel', room: { min: 2 }, crew: 'brain', open: 'setupWordWheel' },
  { id: 'flags',      icon: 'art:flags',   title: 'setup_flags',      desc: 'cat_flags',      accent: 'blue',   players: [1, 12], mins: 3,  modes: ['device', 'room', 'tv'], group: 'brain', setup: 'setup-flags', room: { min: 2 }, crew: 'brain', open: 'setupFlags' },
  { id: 'chesspuzzle', icon: 'art:chesspuzzle', title: 'setup_chesspuzzle', desc: 'cat_chesspuzzle', accent: 'amber', players: [1, 1], mins: 5, modes: ['device'], group: 'duo', hub: 'shatranj', setup: 'setup-chesspuzzles', open: 'setupChessPuzzles' },

  { id: 'hesba', icon: 'art:hesba', title: 'setup_hesba', desc: 'cat_hesba', accent: 'amber', players: [1, 12], mins: 10, modes: ['device', 'room', 'tv'], group: 'brain', setup: 'setup-hesba', room: { min: 1 }, crew: 'brain', added: '2026-10-09', open: 'setupHesba' },   // tools/new-game.mjs, 2026-10-09
  { id: 'boggle', icon: '🔡', title: 'setup_boggle', desc: 'cat_boggle', accent: 'orange', players: [1, 12], mins: 8, modes: ['device', 'room', 'tv'], group: 'brain', setup: 'setup-boggle', room: { min: 1 }, crew: 'words', open: 'setupBoggle' },   // tools/new-game.mjs, 2026-10-09
  { id: 'oracle', icon: '🔮', title: 'setup_oracle', desc: 'cat_oracle', accent: 'violet', players: [1, 8], mins: 5, modes: ['device'], group: 'brain', setup: 'setup-oracle', open: 'setupOracle' },   // tools/new-game.mjs, 2026-10-09
  /* --- أدوات --- */
  { id: 'chooser',   icon: 'art:chooser',   title: 'tool_chooser',      desc: 'cat_chooser',    accent: 'orange', group: 'tools', open: 'openChooser' },
  { id: 'spin',      icon: 'art:spin',   title: 'setup_spin',        desc: 'spin_desc',      accent: 'orange', group: 'tools', setup: 'setup-spin' },
  { id: 'teams',     icon: 'art:teams',   title: 'team_generator',    desc: 'teams_desc',     accent: 'indigo', group: 'tools', setup: 'setup-teams' },
  { id: 'tourney',   icon: 'art:tourney',   title: 'setup_tourney',     desc: 'tourney_desc',   accent: 'amber',  group: 'tools', setup: 'setup-tourney', open: 'setupTournament' },
  { id: 'universal', icon: 'art:universal',   title: 'universal_counter', desc: 'universal_desc', accent: 'blue',   group: 'tools', setup: 'setup-universal' },
  { id: 'timers',    icon: 'art:timers',  title: 'timers_title',      desc: 'timers_desc',    accent: 'rose',   group: 'tools', setup: 'timers' },
  { id: 'chess',     icon: 'art:chessclock',  title: 'chess_title',       desc: 'chess_desc',     accent: 'indigo', group: 'tools', open: 'openChessClock' },
  { id: 'dice',      icon: 'art:dice',   title: 'tool_dice',         desc: 'dice_desc',      accent: 'green',  group: 'tools', setup: 'tool-dice' },
  { id: 'sounds',    icon: 'art:sounds',   title: 'sounds',            desc: 'sounds_hint',    accent: 'rose',   group: 'tools', open: 'openSoundboard' },
  /* --- اعملها بنفسك: what the family writes itself (30 Sep 2026). «اعمل مسابقتك» is a way of
     تحدي المعلومات (hub: its ways row on the trivia screens), not a home card of its own. --- */
  { id: 'quizmaker', icon: 'art:quizmaker', title: 'tool_quizmaker', desc: 'cat_quizmaker', accent: 'indigo', modes: ['device', 'room', 'tv'], group: 'tools', kind: 'make', hub: 'trivia', setup: 'setup-quizmaker' },
  { id: 'wordpack',  icon: 'art:wordpack',  title: 'tool_wordpack',  desc: 'cat_wordpack',  accent: 'teal',   group: 'tools', kind: 'make', setup: 'setup-wordpack' },
  /* --- حاسبات النقط: the deck or the tiles are real, the phone keeps score --- */
  { id: 'cs-estimation',  icon: 'art:cs-estimation',   title: 'setup_cs_estimation',  desc: 'cat_cs_estimation',  accent: 'violet', players: [4, 4], mins: 40, modes: ['device'],               group: 'tools', kind: 'score', setup: 'setup-cs-estimation', open: ['setupCardScore', 'estimation'] },
  { id: 'cs-tarneeb',  icon: 'art:cs-tarneeb',   title: 'setup_cs_tarneeb',  desc: 'cat_cs_tarneeb',  accent: 'indigo', players: [4, 4], mins: 40, modes: ['device'],               group: 'tools', kind: 'score', setup: 'setup-cs-tarneeb', open: ['setupCardScore', 'tarneeb'] },
  { id: 'cs-trix',  icon: 'art:cs-trix',   title: 'setup_cs_trix',  desc: 'cat_cs_trix',  accent: 'rose', players: [4, 4], mins: 60, modes: ['device'],               group: 'tools', kind: 'score', setup: 'setup-cs-trix', open: ['setupCardScore', 'trix'] },
  { id: 'cs-konkan',  icon: 'art:cs-konkan',   title: 'setup_cs_konkan',  desc: 'cat_cs_konkan',  accent: 'amber', players: [2, 6], mins: 40, modes: ['device'],               group: 'tools', kind: 'score', setup: 'setup-cs-konkan', open: ['setupCardScore', 'konkan'] },
  { id: 'cs-basra',  icon: 'art:cs-basra',   title: 'setup_cs_basra',  desc: 'cat_cs_basra',  accent: 'teal', players: [2, 4], mins: 30, modes: ['device'],               group: 'tools', kind: 'score', setup: 'setup-cs-basra', open: ['setupCardScore', 'basra'] },
  /* The score keepers of the two table games that are games in their own right
     now: a shortcut to the game's own setup, on its "at the table" side (the
     owner, 21 Sep 2026: "nobody loses it"). No `setup` of their own, so the
     game's hero is the one drawn there. */
  { id: 'screw-calc',  icon: 'art:screw',  title: 'tool_screw_calc',  desc: 'cat_screw_calc',  accent: 'blue',  players: [2, 12], mins: 30, modes: ['device'],            group: 'tools', kind: 'score', open: ['openTableCalc', 'screw'] },
  { id: 'domino-calc', icon: 'art:domino',  title: 'tool_domino_calc', desc: 'cat_domino_calc', accent: 'green', players: [2, 4],  mins: 20, modes: ['device'],            group: 'tools', kind: 'score', open: ['openTableCalc', 'domino'] }
];

/* The order of a room's list of games (the tiles, and the program's picker).
   A room game not named here comes at the end; a name that is no game is skipped. */
const ROOM_LIST_ORDER = [
  'imposter', 'justone', 'whoami', 'codenames', 'fibbage', 'wouldyou', 'mostlikely', 'drawguess',
  'fakeartist', 'trivia', 'buzzer', 'stop', 'chameleon', 'spyfall', 'bomb', 'chairs', 'reaction', 'witness',
  'hear', 'wire', 'vault', 'box', 'darkroom', 'exact', 'hum', 'bumper', 'twotruths', 'emoji',
  'proverbs', 'fiveseconds', 'telephone', 'monkey', 'herd', 'mafia', 'screw', 'mind', 'timeline',
  'uno', 'domino', 'ludo', 'snakes', 'bank', 'connect4', 'dots', 'xo', 'battleship', 'chess',
  'votechess', 'handbrain', 'bughouse', 'guesswho', 'hangman', 'bowling', 'doubt', 'skull',
  'oldmaid', 'estimation', 'chess4', 'minigolf', 'wordle', 'guessnum', 'flags', 'strands',
  'wordwheel', 'connections', 'pinpoint', 'queens', 'tango', 'nonogram', 'mines', 'streak', 'sudoku'
];

/* --- built from the list ------------------------------------------------- */

// The ids the rooms server counts plays of (/count) and takes reports for (/report):
// دوري المعرفة's board is the trivia card's other way.
const APP_GAME_IDS = GAME_LIST.map(g => g.id);
const APP_REPORT_IDS = APP_GAME_IDS.concat(['triviaboard']);

// The room games, in the room list's order: { id, game (the entry), min, rounds, autoNext }.
const ROOM_GAME_LIST = (() => {
  const list = GAME_LIST.filter(g => g.room).map(g => Object.assign({}, g.room, { id: g.room.id || g.id, game: g }));
  const at = (r) => { const k = ROOM_LIST_ORDER.indexOf(r.id); return k === -1 ? ROOM_LIST_ORDER.length : k; };
  return list.map((r, i) => ({ r, i })).sort((a, b) => (at(a.r) - at(b.r)) || (a.i - b.i)).map(x => x.r);
})();
const ROOM_GAME_IDS = ROOM_GAME_LIST.map(r => r.id);
// «التالي لوحده»: the room games whose lobby has the switch.
const AUTONEXT_ROOM_GAMES = ROOM_GAME_LIST.filter(r => r.autoNext).map(r => r.id);
// برنامج السهرة: how many rounds a game with no end of its own lasts.
const PROGRAM_ROUNDS = {};
ROOM_GAME_LIST.forEach(r => { if (r.rounds) PROGRAM_ROUNDS[r.id] = r.rounds; });
// الشلة: the games each title counts, by the room game's id (a solo game's own id).
const CREW_TITLE_GAMES = {};
GAME_LIST.forEach(g => {
  if (!g.crew) return;
  (CREW_TITLE_GAMES[g.crew] = CREW_TITLE_GAMES[g.crew] || []).push((g.room && g.room.id) || g.id);
});
