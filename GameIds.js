/* ============================================================================
   Every id the app's home can count (the audit of 28 Sep 2026): the ids of
   GAME_CATALOG in JS_Catalog.html, in its order. The rooms server's /count keeps
   only these, and /report only these and the report-only ids below, so a script
   can't fill the counts (the "plays" and "reports" logs keep at most 5,000 keys
   and drop new ones once full) with made-up games.

   `npm run check` (tools/validate-content.js) fails when this list and
   GAME_CATALOG differ: a new game goes in both. Bundled into the rooms server
   only (rooms-worker/build.mjs); the page has GAME_CATALOG itself.
   ========================================================================= */
const APP_GAME_IDS = [
  'imposter', 'chameleon', 'spyfall', 'fakeartist', 'fibbage', 'mafia', 'twotruths',
  'mind', 'guesswho', 'timeline', 'charades', 'describe', 'timesup', 'whoami', 'justone',
  'codenames', 'hangman', 'bowling', 'drawguess', 'telephone', 'monkey', 'bomb', 'bumper',
  'chairs', 'stop', 'wouldyou', 'mostlikely', 'wavelength', 'herd', 'headsup',
  'fiveseconds', 'trivia', 'buzzer', 'emoji', 'proverbs', 'screw', 'uno', 'domino', 'ludo', 'snakes',
  'bank', 'doubt', 'chess4', 'estimation', 'oldmaid', 'votechess', 'handbrain', 'bughouse',
  'memory', 'xo', 'connect4', 'dots', 'battleship', 'shatranj', 'guessnum', 'reaction',
  'minigolf', 'sudoku', 'g2048', 'mines', 'queens', 'tango', 'nonogram', 'daily', 'wordle',
  'connections', 'streak', 'pinpoint', 'strands', 'wordwheel', 'flags', 'chesspuzzle',
  'chooser', 'spin', 'teams', 'tourney', 'universal', 'timers', 'chess', 'dice', 'sounds',
  'cs-estimation', 'cs-tarneeb', 'cs-trix', 'cs-konkan', 'cs-basra', 'screw-calc',
  'domino-calc'
];

/** A «في غلطة؟» report may also name a bank that is not a home card of its own:
    دوري المعرفة's board is the trivia card's other way ('triviaboard'). */
const APP_REPORT_IDS = APP_GAME_IDS.concat(['triviaboard']);
