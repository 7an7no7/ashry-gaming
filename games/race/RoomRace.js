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
    view: (b, x, st, over) => R().view(b, x, st, over),
    progress: (b, x, st) => Object.assign({ total: R().total(x, st) }, R().progress(b, x, st)),
    score: (b, x, st) => (R().score ? R().score(b, x, st) : 0),
    reveal: (x, st) => (R().reveal ? R().reveal(x, st) : null),
    mine: () => null
  };
};

SV_RACE_IDS.forEach(id => { SOLVE_KINDS[id] = svRaceKind(id); });

/** Every room game that is a race on the engine. */
const svIsRace = (game) => SV_RACE_IDS.indexOf(game) !== -1;

/* --- «خماسي السهرة»: a different puzzle every round (the owner, 2 Oct 2026) -----------------
   A lobby choice: the app draws the line-up - as many puzzles as rounds (3 or 5), all
   different, from the ten (2048 was never one of them) - and the host can tap one to swap it
   for another not in it yet; every phone and the TV see it before Start (room.shared.lineup,
   names only). Each round is the race as always - its puzzle dealt here when the round starts,
   on its own clock, the same ending and points - and the totals make the podium.
   Decided here (open to change): the puzzle the host opened the lobby with is the first of the
   line-up (a swap can change it); a swap draws at random from the puzzles left; a game switched
   off for a fix is never drawn; play again keeps the line-up (the table saw and agreed it).
   ------------------------------------------------------------------------------------------- */

/** A puzzle the line-up may hold: one of the ten, not switched off for a fix. */
const svRaceOn = (id) => SV_RACE_IDS.indexOf(id) !== -1 && !(typeof roomGameIsOff === 'function' && roomGameIsOff(id));

/** A line-up as the engine takes it: 3 or 5 different puzzles of the ten, else null. */
const svRaceLineupOk = (list) => {
  if (!Array.isArray(list) || SV_RACE_ROUNDS.indexOf(list.length) === -1) return null;
  const out = list.map(String);
  return out.every((id, i) => SV_RACE_IDS.indexOf(id) !== -1 && out.indexOf(id) === i) ? out : null;
};

/** `n` puzzles: what is kept first (else the one the lobby was opened with), the rest drawn. */
const svRaceLineupDraw = (room, keep, n) => {
  const out = [];
  (keep || []).forEach(id => { if (svRaceOn(id) && out.indexOf(id) === -1) out.push(id); });
  if (!out.length && svRaceOn(room.game)) out.push(room.game);
  shuffled(SV_RACE_IDS.filter(id => svRaceOn(id) && out.indexOf(id) === -1)).forEach(id => out.push(id));
  return out.slice(0, n);
};

/**
 * The lobby's line-up (the host's): { on: true, rounds } draws it (or resizes it, keeping what
 * is there), { at, was } swaps one - `was` is the puzzle the tap was for, so a double tap swaps
 * once - and { on: false } puts it away (one puzzle every round again).
 */
const svRaceLineupAction = (room, playerId, p) => {
  requireHost(room, playerId);
  if (room.phase !== 'lobby' || !svIsRace(room.game)) return;
  const s = room.shared = room.shared || {};
  if (p.on === false) { delete s.lineup; return; }
  if (p.at !== undefined && p.at !== null) {
    const list = s.lineup;
    const at = Number(p.at);
    if (!Array.isArray(list) || !list[at] || staleTap(p, 'was', list[at])) return;
    const pool = SV_RACE_IDS.filter(id => svRaceOn(id) && list.indexOf(id) === -1);
    if (pool.length) list[at] = pool[Math.floor(Math.random() * pool.length)];
    return;
  }
  s.lineup = svRaceLineupDraw(room, s.lineup, svPick(SV_RACE_ROUNDS, p.rounds, (s.lineup || []).length, 3));
};

/** Before each deal of a line-up: the round's puzzle, and its own clock (SV_RACE_CLOCKS). */
const svRaceRoundKind = (room) => {
  const s = room.shared;
  const list = s.settings && s.settings.lineup;
  if (!Array.isArray(list) || !list.length) return;
  s.solve = list[Math.min(list.length, Math.max(1, Number(s.round) || 1)) - 1];
  s.settings.clock = SV_RACE_CLOCKS[s.solve] || 120;
};
