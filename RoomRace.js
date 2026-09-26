/* ============================================================================
   سباق ألغاز — the solo puzzles as a race, on the engine of RoomSolve.js
   ----------------------------------------------------------------------------
   Bundled into the Worker after RoomSolve.js (whose SOLVE_KINDS it fills) and
   after the ten games' shared files, each of which holds its rules and its
   race plug-in (SUDOKU_RACE, QUEENS_RACE, TANGO_RACE, NONO_RACE, MINES_RACE,
   STRANDS_RACE, WHEEL_RACE, CONN_RACE, PIN_RACE, STREAK_RACE).

   The owner's decisions (26 Sep 2026, asked one by one): the ten puzzles -
   خيوط, كلمات من حروف, تشابه, إيه اللي يجمعهم؟, الملكات, شمس وقمر, نونوجرام,
   كاسحة الألغام, سلسلة الإجابات and سودوكو on easy - as a race in a room. The
   same puzzle for everyone, dealt here with the game's own generator; each
   phone solves on its own board; the table sees progress only, never a board.
   Two endings, a lobby choice: «الكل يخلّص» (everyone done, or the clock) or
   «Fast 3» (the first three to finish score 10 / 7 / 5, then the round closes
   ten seconds later; a finish inside them scores 2), Fast 3 preselected with
   five or more people. The clock is a backstop, fixed per game
   (SV_RACE_CLOCKS in SolveGames.js). «استسلم» marks a phone done with 0.
   Ties on the night's board: fewer seconds.

   A plug-in (each game's *_RACE object, pure rules, no DOM):
     deal(rnd, st, pick)     → the secret: { pub: what every phone gets, …the solution }
                               `pick.one(list, key)` / `pick.many(list, key, n)` draw through
                               the room's prompt memory (a category, a question) - never a puzzle
     board(x, st)            → a solver's board on the server (what its own phone may know)
     total(x, st)            → what the table's bar counts to (words, cells, questions)
     move(b, x, p, st)       → 'won' | 'lost' | '' after a phone's move (may throw an Arabic error)
     progress(b, x, st)      → { done, …anything else the table may see } (never content)
     view(b, x, st)          → the board as its own phone sees it (never the solution)
     score(b, x, st)         → a rank among the finished (most right first); 0 for the order alone
     reveal(x, st)           → what everyone sees once the round is over, or null

   What is hidden: the solution (room._solve.secret, sent to nobody until the
   reveal), every board (room.secrets[pid].board, its own phone only). The
   table gets `shared.pub` (the puzzle as a phone needs it: the grid, the
   givens, the clues, the letters) and `shared.progress`, one row a phone:
   { n, state, at, done, total, secs }.
   ========================================================================= */

/** The ten race plug-ins, looked up when a room needs them (each lives in its game's shared file). */
const RACE_RULES = {
  sudoku: () => SUDOKU_RACE,
  queens: () => QUEENS_RACE,
  tango: () => TANGO_RACE,
  nonogram: () => NONO_RACE,
  mines: () => MINES_RACE,
  strands: () => STRANDS_RACE,
  wordwheel: () => WHEEL_RACE,
  connections: () => CONN_RACE,
  pinpoint: () => PIN_RACE,
  streak: () => STREAK_RACE
};

/** The lobby's ending: the host's choice, else Fast 3 from five people (the owner). */
const svRaceFinish = (p, was, room) => {
  if (SV_RACE_FINISH.indexOf(p.finish) !== -1) return p.finish;
  if (was && SV_RACE_FINISH.indexOf(was.finish) !== -1) return was.finish;
  return room && room.players && room.players.length >= SV_RACE_FAST3_FROM ? 'fast3' : 'all';
};

/** A SOLVE_KINDS entry from a race plug-in: the engine's hooks over the game's rules. */
const svRaceKind = (id) => {
  const R = () => {
    const rules = RACE_RULES[id] && RACE_RULES[id]();
    if (!rules) throw new Error('اللعبة دي لسه مش جاهزة');
    return rules;
  };
  return {
    race: true,
    options: (p, was, room) => ({ finish: svRaceFinish(p || {}, was, room) }),
    check() { throw new Error('السباق من التطبيق'); },
    deal: (room, st) => R().deal(Math.random, st, {
      one: (list, key) => nextPrompt(room, list, key),
      many: (list, key, n) => nextPrompts(room, list, key, n)
    }),
    pub: (x) => x.pub,
    board: (x, st) => R().board(x, st),
    tries: () => 0,
    guess: (b, x, p, st) => R().move(b, x, p, st),
    view: (b, x, st) => R().view(b, x, st),
    progress: (b, x, st) => Object.assign({ total: R().total(x, st) }, R().progress(b, x, st)),
    score: (b, x, st) => (R().score ? R().score(b, x, st) : 0),
    reveal: (x, st) => (R().reveal ? R().reveal(x, st) : null),
    mine: () => null
  };
};

SV_RACE_IDS.forEach(id => { SOLVE_KINDS[id] = svRaceKind(id); });

/** Every room game that is a race on the engine. */
const svIsRace = (game) => SV_RACE_IDS.indexOf(game) !== -1;
