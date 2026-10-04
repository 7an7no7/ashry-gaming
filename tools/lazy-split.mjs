/**
 * The page in pieces: what loads with the page (the shell) and what each game
 * brings when it opens (a chunk). Used by build-site.mjs and build-preview.mjs.
 *
 * Every JS_*.html shares one global scope, and so do the chunks: a chunk is the
 * scripts of its files concatenated into one classic script (never a module), so
 * its top-level functions become globals exactly as they were on the one page.
 * JS_Lazy.html (in the shell) loads a chunk, with the chunks it needs first.
 *
 * What a chunk needs is worked out from the code (acorn): a name one chunk uses
 * that another declares makes the second a dependency of the first, unless the
 * edge is listed in LAZY_EDGES (a call made only when the other game is already
 * running, or made through lzRun). Which chunk a screen, a room game or a card
 * of the home needs is worked out too (the view ids and ROOM_GAMES.x = in the
 * chunk's files), with the few the code can't say in the maps at the end.
 */
import * as acorn from 'acorn';
import * as walk from 'acorn-walk';

/* ---------------------------------------------------------------------------
   The shell: loaded with the page. The home, the nav, settings, help, the room
   engine and the TV's frame, the motion toolkit, the sounds, and every registry
   the home and Help read (the catalog, the translations, GAME_RULES, ICON_ART).
   ------------------------------------------------------------------------- */
export const SHELL_FILES = [
  'Logo', 'Tailwind', 'Style', 'Style_Screens', 'Style_Home', 'Style_Party', 'Style_Finish', 'Style_Solo', 'Style_Cards', 'Style_Boards', 'Style_Chess', 'Style_Arcade', 'Style_Living', 'Style_Rooms', 'Style_Night', 'Style_Talk',
  'JS_Lazy', 'JS_Translations', 'JS_Core', 'JS_GameRules', 'JS_Catalog', 'JS_Room', 'JS_Utils',
  'JS_PackStore',      // «اعمل مسابقتك» / «كلماتنا» on the phone: the lobbies and the word games' lists read it
  'JS_RoomAutoNext',   // «التالي لوحده»: trivia, the voting games, زي الكل, صدق ولا كذب
  'JS_RoomImposter',   // renderRoomFrame, roomAct, roomHostRow: every room screen's helpers
  'JS_RoomGames',      // the play-mode switch, كلمة واحدة and من أنا؟ rooms
  'JS_RoomVoting',     // the voting engine and renderScoreboard, used by most rooms
  'JS_RoomTv', 'JS_Dice', 'JS_Director', 'JS_Solo', 'JS_Daily', 'JS_TeamRelay',
  'JS_Sounds', 'JS_RoomChat', 'JS_RoomAudience', 'JS_RoomTurn', 'JS_Motion', 'JS_ShareCard', 'JS_Three',
  'JS_CrewCore'        // «الشلة»: which crews this phone is in, the room's pick, the doors (the page is the chunk 'crew')
];
export const SHELL_LISTS = ['Games.js', 'DisabledGames.js', 'Dice.js', 'SoloShared.js', 'Packs.js'];

/* The chunks: a game, or a family of games that share their code. The order of
   files inside a chunk is always the page's own order. */
export const CHUNKS = {
  spy: ['JS_Imposter'],
  whoami: ['JS_WhoAmI'],
  charades: ['JS_Charades'],
  describe: ['JS_DescribeIt'],
  guessnum: ['JS_GuessNumber'],
  tourney: ['JS_Tournament'],
  wordle: ['JS_Wordle'],
  newgames: ['JS_NewGames'],
  screwcalc: ['JS_Screw'],
  screw: ['JS_RoomScrew', 'SkrewCards.js'],
  monkey: ['JS_Monkey', 'JS_RoomMonkey'],
  codenames: ['JS_RoomCodenames'],
  draw: ['JS_RoomDraw', 'JS_RoomFakeArtist', 'JS_RoomTelephone'],
  trivia: ['JS_RoomTrivia'],
  connections: ['JS_Connections', 'ConnectionsWords.js'],
  triviaboard: ['JS_TriviaBoardBank', 'JS_TriviaBoard'],
  quizmaker: ['JS_QuizMaker'],   // «اعمل مسابقتك» and «كلماتنا»: the editors
  domino: ['JS_Domino', 'JS_RoomDomino', 'DominoTiles.js'],
  chameleon: ['JS_Chameleon', 'JS_RoomChameleon'],
  spyfall: ['JS_Spyfall', 'JS_RoomSpyfall', 'SpyfallPlaces.js'],
  timesup: ['JS_TimesUp'],
  bomb: ['JS_Bomb', 'JS_RoomBomb', 'JS_FiveSeconds', 'JS_RoomFiveSeconds', 'BombPrompts.js'],
  stop: ['JS_Stop', 'JS_StopBus', 'JS_RoomStop', 'StopWords.js'],
  memory: ['JS_Memory'],
  xo: ['JS_XO', 'JS_RoomXO', 'TicTacToe.js'],
  grids: ['JS_Sudoku', 'JS_2048', 'JS_Mines', 'JS_Queens', 'JS_Tango', 'JS_Nonogram',
    'Sudoku.js', 'Queens.js', 'Tango.js', 'Nonogram.js', 'Mines.js'],
  wordsolo: ['JS_WordSearch', 'JS_Pinpoint', 'Strands.js', 'Pinpoint.js'],
  wordwheel: ['JS_WordWheel', 'WordWheel.js'],   // its dictionary is every word list's
  streak: ['JS_QuizStreak', 'QuizStreak.js', 'TriviaQuestions.js'],
  flags: ['JS_Flags', 'JS_FlagsTour'],
  headsup: ['JS_HeadsUp'],
  cardscore: ['JS_CardScore', 'JS_CardRules'],
  chooser: ['JS_Chooser'],
  smallrooms: ['JS_RoomBuzzer', 'JS_RoomChairs', 'JS_RoomTwoTruths', 'JS_RoomHerd', 'JS_RoomMafia', 'JS_RoomMind', 'JS_RoomTimeline'],
  wire: ['JS_RoomWire', 'Wire.js'],
  vault: ['JS_RoomVault', 'Vault.js'],
  bumper: ['JS_RoomBumper'],
  quiz: ['JS_Emoji', 'JS_Proverbs', 'JS_RoomQuiz'],
  uno: ['JS_RoomUno', 'UnoCards.js'],
  cardslib: ['JS_Cards', 'PlayingCards.js'],
  cards: ['JS_RoomDoubt', 'JS_RoomSkull', 'JS_RoomOldMaid', 'JS_RoomEstimation', 'Skull.js', 'Estimation.js'],
  duels: ['JS_Connect4', 'JS_RoomConnect4', 'JS_RoomTournament', 'Connect4.js'],
  dots: ['JS_Dots', 'JS_RoomDots', 'DotsBoxes.js'],
  guesswho: ['JS_GuessWho', 'GuessWho.js'],
  witness: ['JS_RoomWitness', 'Witness.js'],
  hear: ['JS_RoomHear', 'Hear.js'],
  box: ['JS_RoomBox'],
  dark: ['JS_RoomDark', 'Dark.js'],
  exact: ['JS_RoomExact'],
  // رد الفعل: the room game, and the words and styles the one-phone test (newgames) reads too.
  reaction: ['JS_RoomReaction'],
  hum: ['JS_RoomHum'],
  // برنامج السهرة: the builder, the table between two games, the finale (the room engine opens it).
  program: ['JS_RoomProgram'],
  // المهمة السرية: the switch beside every game - the file, the memo, the cork board (the room engine opens it).
  mission: ['JS_RoomMission', 'Missions.js'],
  hangman: ['JS_Hangman', 'JS_HangmanEnd', 'Hangman.js'],
  solve: ['JS_RoomSolve', 'JS_RoomRace', 'SolveGames.js'],
  flagsmap: ['JS_FlagsMap'],   // خمّن الدولة's map: the solo game's and the room's
  bowling: ['JS_Bowling', 'Bowling.js'],
  battleship: ['JS_Battleship', 'Battleship.js'],
  minigolf: ['JS_MiniGolf', 'MiniGolf.js'],
  chess: ['JS_Chess', 'JS_ChessOpenings', 'JS_ChessStockfish', 'JS_ChessReview', 'JS_ChessPosition', 'JS_RoomChess', 'Chess.js'],
  chesspuzzles: ['JS_ChessPuzzles', 'ChessPuzzles.js'],
  chessrooms: ['JS_RoomBughouse', 'JS_RoomChess4', 'JS_RoomVoteChess', 'JS_RoomHandBrain', 'Chess4.js'],
  ludo: ['JS_Ludo', 'JS_RoomLudo', 'Ludo.js'],
  snakes: ['JS_Snakes', 'JS_SnakesNile', 'JS_SnakesMetro', 'JS_SnakesDesert', 'JS_SnakesHara', 'JS_RoomSnakes', 'Snakes.js'],
  bank: ['JS_Bank', 'JS_RoomBank', 'BankAlhaz.js'],
  crew: ['JS_Crew'],   // «الشلة»'s page and sheets
  // Word lists more than one chunk deals from.
  'w-chameleon': ['ChameleonWords.js'],
  'w-monkey': ['MonkeyWords.js'],
  'w-wordle': ['WordleWords.js'],
  'w-countries': ['Countries.js'],
  'w-riddles': ['EmojiRiddles.js', 'Proverbs.js']
};

/* References that don't make a dependency: the call is only made while the other
   game's own chunk is loaded (its room or its screen is showing), or it goes
   through lzRun. "from>to" by file. */
export const LAZY_EDGES = [
  // The tournament's adapters for each duel game run only in that game's tournament.
  'JS_RoomTournament>JS_Dots', 'JS_RoomTournament>JS_RoomXO', 'JS_RoomTournament>GuessWho.js',
  'JS_RoomTournament>JS_Chess', 'JS_RoomTournament>JS_RoomChess', 'JS_RoomTournament>Chess.js',
  'JS_RoomTournament>JS_Battleship',
  // A solo puzzle's race moves: only in its race, whose room loads the race.
  'JS_Sudoku>JS_RoomRace', 'JS_Mines>JS_RoomRace', 'JS_Queens>JS_RoomRace', 'JS_Tango>JS_RoomRace',
  'JS_Nonogram>JS_RoomRace', 'JS_WordSearch>JS_RoomRace', 'JS_WordWheel>JS_RoomRace', 'JS_Pinpoint>JS_RoomRace',
  'JS_QuizStreak>JS_RoomRace', 'JS_Connections>JS_RoomRace',
  // The playing cards' helpers name the two card rooms only while they play.
  'JS_Cards>JS_RoomDoubt', 'JS_Cards>JS_RoomOldMaid',
  // Wordle's soft dictionary reads the word wheel's banks once lzEnsure has fetched them (typeof-guarded).
  'JS_Wordle>WordWheel.js',
  // «جرّبها كلغز» from a chess review goes through lzRun.
  'JS_ChessReview>JS_ChessPuzzles',
  // The race's own screen: the connections board only in its race.
  'JS_RoomRace>JS_Connections'
];

/* Screens, room games and cards of the home whose chunk the code can't say by itself. */
const race = (game) => ['solve', game];
export const VIEW_CHUNKS = {
  // سباق ألغاز: the race's screen (JS_RoomRace) and the puzzle's own board (RACE_UI).
  'room-sudoku': race('grids'), 'room-queens': race('grids'), 'room-tango': race('grids'),
  'room-nonogram': race('grids'), 'room-mines': race('grids'),
  'room-strands': race('wordsolo'), 'room-wordwheel': race('wordwheel'), 'room-pinpoint': race('wordsolo'),
  'room-connections': race('connections'), 'room-streak': race('streak'),
  'room-guessnum': ['solve'], 'room-flags': ['solve'],
  'room-whoami': ['whoami'],
  'setup-teams': ['newgames'], 'setup-reaction': ['newgames'],
  'setup-codenames': ['codenames'],
  // «اعمل مسابقتك» opens the trivia setup (its «لوحة الفرق» way); the screen is the board's.
  'setup-trivia': ['triviaboard'],
  // The card score keepers (JS_CardScore draws every one of them).
  ...Object.fromEntries(['estimation', 'tarneeb', 'trix', 'konkan', 'basra'].flatMap((g) =>
    [[`setup-cs-${g}`, ['cardscore']], [`play-cs-${g}`, ['cardscore']]]))
};
export const ROOM_CHUNKS = {
  whoami: ['whoami'],       // its room is drawn by JS_RoomGames (shell) from WHOAMI_DB
  emoji: ['quiz', 'solve'], // the quiz, and a riddle written by a player on the solve engine
  proverbs: ['quiz']
};
export const GAME_CHUNKS = {};

/* Screens that belong to the shell (the home, the tabs, rooms' lobby, the tools
   in JS_Core / JS_Utils); anything else must map to a chunk or the build fails. */
export const SHELL_VIEWS = ['menu', 'together', 'tools', 'room-tv', 'room-join', 'room-lobby',
  'timers', 'play-chess', 'setup-universal', 'play-universal', 'setup-spin', 'play-spin', 'tool-dice',
  'setup-daily', 'setup-daily-archive', 'setup-stats',
  // Rooms drawn by the shell's own room files (JS_RoomImposter, JS_RoomGames, JS_RoomVoting).
  'room-imposter', 'room-justone', 'room-wouldyou', 'room-mostlikely', 'room-fibbage'];

/* --------------------------------------------------------------------------- */

const ID = /[A-Za-z_$][\w$]*/;

function patNames(p, set) {
  if (!p) return;
  if (p.type === 'Identifier') set.add(p.name);
  else if (p.type === 'ObjectPattern') p.properties.forEach((q) => patNames(q.type === 'RestElement' ? q.argument : q.value, set));
  else if (p.type === 'ArrayPattern') p.elements.forEach((q) => patNames(q, set));
  else if (p.type === 'RestElement') patNames(p.argument, set);
  else if (p.type === 'AssignmentPattern') patNames(p.left, set);
}
const localCache = new WeakMap();
function localsOf(fn) {
  if (localCache.has(fn)) return localCache.get(fn);
  const set = new Set();
  fn.params.forEach((q) => patNames(q, set));
  if (fn.id && fn.type !== 'FunctionDeclaration') set.add(fn.id.name);
  const visit = (n, top) => {
    if (!n || typeof n.type !== 'string') return;
    if (!top && /Function/.test(n.type)) { if (n.type === 'FunctionDeclaration' && n.id) set.add(n.id.name); return; }
    if (n.type === 'VariableDeclarator') patNames(n.id, set);
    if (n.type === 'CatchClause') patNames(n.param, set);
    if (n.type === 'ClassDeclaration' && n.id) set.add(n.id.name);
    for (const k in n) {
      const v = n[k];
      if (Array.isArray(v)) v.forEach((c) => c && typeof c.type === 'string' && visit(c));
      else if (v && typeof v.type === 'string') visit(v);
    }
  };
  visit(fn.body, true);
  localCache.set(fn, set);
  return set;
}

/** Top-level names each file declares, and the names it uses (at load, or inside functions). */
function analyse(code, name) {
  const decl = new Set(), run = new Set(), load = new Set();
  let ast;
  try { ast = acorn.parse(code, { ecmaVersion: 'latest', sourceType: 'script', allowReturnOutsideFunction: true }); }
  catch (e) { throw new Error(`lazy-split: ${name} doesn't parse: ${e.message}`); }
  for (const st of ast.body) {
    if ((st.type === 'FunctionDeclaration' || st.type === 'ClassDeclaration') && st.id) decl.add(st.id.name);
    if (st.type === 'VariableDeclaration') st.declarations.forEach((d) => patNames(d.id, decl));
  }
  walk.full(ast, (node) => {
    if (node.type === 'AssignmentExpression' && node.left.type === 'MemberExpression' && !node.left.computed &&
        node.left.object.type === 'Identifier' && node.left.object.name === 'window') decl.add(node.left.property.name);
  });
  walk.fullAncestor(ast, (node, st, anc) => {
    if (node.type !== 'Identifier') return;
    const p = anc[anc.length - 2];
    if (p && p.type === 'MemberExpression' && p.property === node && !p.computed) return;
    if (p && p.type === 'Property' && p.key === node && !p.computed && !p.shorthand) return;
    if (p && (p.type === 'MethodDefinition' || p.type === 'PropertyDefinition') && p.key === node) return;
    if (p && (p.type === 'LabeledStatement' || p.type === 'BreakStatement' || p.type === 'ContinueStatement')) return;
    const fns = anc.filter((a, i) => i < anc.length - 1 && /Function/.test(a.type));
    if (fns.some((fn) => localsOf(fn).has(node.name))) return;
    (fns.length ? run : load).add(node.name);
  });
  // Handlers written as markup (onclick="fn(...)") inside strings.
  for (const m of code.matchAll(/\bon[a-z]+=\\?["']([^"'\\]*)/g)) for (const id of m[1].matchAll(/([A-Za-z_$][\w$]*)\s*\(/g)) run.add(id[1]);
  return { decl, run, load };
}

/**
 * Splits the page. `sources` maps each include name (JS_Core) and each list
 * (Chess.js) to its code; `order` is their order on the one page (the lists
 * first, as on the page). Returns the plan: the shell's files, the chunks in the
 * order they must run, and the maps the page asks.
 */
export function plan({ sources, order, controller, roomGameIds }) {
  const shellSet = new Set([...SHELL_FILES, ...SHELL_LISTS]);
  const fileChunk = new Map();
  for (const [id, files] of Object.entries(CHUNKS)) for (const f of files) {
    if (fileChunk.has(f)) throw new Error(`lazy-split: ${f} is in two chunks`);
    if (shellSet.has(f)) throw new Error(`lazy-split: ${f} is in the shell and chunk ${id}`);
    fileChunk.set(f, id);
  }
  const pos = new Map(order.map((f, i) => [f, i]));
  for (const f of order) {
    if (!shellSet.has(f) && !fileChunk.has(f)) throw new Error(`lazy-split: ${f} is in no chunk (add it to CHUNKS or SHELL_FILES in tools/lazy-split.mjs)`);
  }
  for (const f of fileChunk.keys()) if (!pos.has(f)) throw new Error(`lazy-split: ${f} (chunk ${fileChunk.get(f)}) isn't on the page`);

  // The code of each file, as scripts.
  const code = new Map();
  for (const f of order) {
    const src = sources.get(f);
    code.set(f, /\.js$/.test(f) ? [src] : [...src.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]));
  }
  const info = new Map();
  const declaredBy = new Map();
  for (const f of order) {
    if (/^Style(_|$)/.test(f) || f === 'Tailwind' || f === 'Logo') continue;
    const a = { decl: new Set(), run: new Set(), load: new Set() };
    code.get(f).forEach((c, i) => {
      const r = analyse(c, `${f}#${i}`);
      r.decl.forEach((x) => a.decl.add(x)); r.run.forEach((x) => a.run.add(x)); r.load.forEach((x) => a.load.add(x));
    });
    info.set(f, a);
    a.decl.forEach((n) => { if (!declaredBy.has(n)) declaredBy.set(n, []); declaredBy.get(n).push(f); });
  }
  const lazy = new Set(LAZY_EDGES);

  // Chunk dependencies, and the ones that must run first (used at load).
  const deps = {}, loadDeps = {}, shellUses = {};
  for (const id of Object.keys(CHUNKS)) { deps[id] = new Set(); loadDeps[id] = new Set(); }
  for (const [f, a] of info) {
    const from = fileChunk.get(f);
    const edge = (n, isLoad) => {
      if (a.decl.has(n)) return;
      const by = declaredBy.get(n) || [];
      if (!by.length || by.some((g) => shellSet.has(g))) return;
      for (const g of by) {
        const to = fileChunk.get(g);
        if (!from) { (shellUses[g] ||= new Set()).add(n); continue; }
        if (to === from || lazy.has(`${f}>${g}`)) continue;
        deps[from].add(to);
        if (isLoad) loadDeps[from].add(to);
      }
    };
    a.run.forEach((n) => edge(n, false));
    a.load.forEach((n) => edge(n, true));
  }

  // The order chunks run in: whatever one uses while it loads runs before it;
  // otherwise the page's own order (by a chunk's first file).
  const first = (id) => Math.min(...CHUNKS[id].map((f) => pos.get(f)));
  const ids = Object.keys(CHUNKS).sort((x, y) => first(x) - first(y));
  const done = new Set(), sorted = [];
  const visit = (id, stack) => {
    if (done.has(id)) return;
    if (stack.includes(id)) throw new Error(`lazy-split: chunks load each other: ${[...stack, id].join(' > ')}`);
    [...loadDeps[id]].sort((x, y) => first(x) - first(y)).forEach((d) => visit(d, [...stack, id]));
    done.add(id); sorted.push(id);
  };
  ids.forEach((id) => visit(id, []));

  // A file that sets, reads or wraps a room game's entry runs after what it needs, in both orders.
  checkRegistryOrder({ order, code, fileChunk, shellSet, sorted, deps: Object.fromEntries(Object.entries(deps).map(([k, v]) => [k, [...v]])) });

  // Screens: a view id named in a chunk's files belongs to that chunk.
  const viewIds = [...controller.matchAll(/id="view-([a-z0-9-]+)"/g)].map((m) => m[1]);
  const text = (f) => code.get(f).join('\n');
  const mentions = (f, v) => {
    const s = text(f);
    return s.includes(`'${v}'`) || s.includes(`"${v}"`) || s.includes('`' + v + '`') || s.includes(`view-${v}`);
  };
  const views = {}, unmapped = [];
  for (const v of viewIds) {
    if (VIEW_CHUNKS[v]) { views[v] = VIEW_CHUNKS[v]; continue; }
    if (SHELL_VIEWS.includes(v)) continue;
    const hit = new Set();
    for (const [f, id] of fileChunk) if (!/\.js$/.test(f) && mentions(f, v)) hit.add(id);
    // A screen named in several chunks: the one whose files open it (setView), else the fewest-deps.
    let pick = [...hit];
    if (pick.length > 1) {
      const opener = pick.filter((id) => CHUNKS[id].some((f) => !/\.js$/.test(f) && new RegExp(`setView\\((['"\`])${v}\\1`).test(text(f))));
      if (opener.length === 1) pick = opener;
    }
    if (pick.length === 1) views[v] = pick;
    else unmapped.push(`${v}${pick.length ? ' (in ' + pick.join(', ') + ')' : ''}`);
  }
  if (unmapped.length) throw new Error(`lazy-split: screens with no chunk, or several: ${unmapped.join('; ')} - add them to VIEW_CHUNKS or SHELL_VIEWS`);

  // A screen's own buttons may only call what is loaded by the time it shows:
  // the shell, or its chunks and what they need.
  const closure = (ids) => {
    const seen = new Set(), stack = [...ids];
    while (stack.length) { const id = stack.pop(); if (seen.has(id)) continue; seen.add(id); deps[id].forEach((d) => stack.push(d)); }
    return seen;
  };
  const marks = [...controller.matchAll(/id="view-([a-z0-9-]+)"|class="modal-overlay/g)];
  const handlerProblems = [];
  marks.forEach((m, i) => {
    if (!m[1]) return;
    const block = controller.slice(m.index, i + 1 < marks.length ? marks[i + 1].index : controller.length);
    const have = closure(views[m[1]] || []);
    for (const h of block.matchAll(/\bon[a-z]+="([^"]*)"/g)) for (const fn of h[1].matchAll(/([A-Za-z_$][\w$]*)\s*\(/g)) {
      const by = declaredBy.get(fn[1]) || [];
      if (!by.length || by.some((g) => shellSet.has(g))) continue;
      if (!by.some((g) => have.has(fileChunk.get(g)))) handlerProblems.push(`view-${m[1]} calls ${fn[1]} (${by.join(', ')})`);
    }
  });
  if (handlerProblems.length) throw new Error(`lazy-split: a screen's button calls code its chunk doesn't load:\n  ${[...new Set(handlerProblems)].join('\n  ')}`);

  // Room games: its screen's chunk, and every chunk that registers it.
  const rooms = {};
  for (const g of roomGameIds) {
    const set = new Set(ROOM_CHUNKS[g] || []);
    if (views['room-' + g]) views['room-' + g].forEach((c) => set.add(c));
    const reg = new RegExp(`\\b(ROOM_GAMES|TV_GAMES|RACE_UI)\\.${g}\\s*=`);
    for (const [f, id] of fileChunk) if (!/\.js$/.test(f) && reg.test(text(f))) set.add(id);
    if (set.size) rooms[g] = [...set];
  }

  // Cards of the home: the chunk of the function its `open` names (a tool with no setup screen).
  // (the page asks it before catalogOpen, «كمّل», the daily hub and «الليلة دي؟»).
  const games = {};
  const catalog = sources.get('Games.js');
  for (const line of catalog.split('\n')) {
    const id = /^\s*\{\s*id:\s*'([\w-]+)'/.exec(line);
    if (!id) continue;
    const set = new Set(GAME_CHUNKS[id[1]] || []);
    const setup = /\bsetup:\s*'([\w-]+)'/.exec(line);
    if (setup && views[setup[1]]) views[setup[1]].forEach((c) => set.add(c));
    const open = /\bopen:\s*\[?\s*'([A-Za-z_$][\w$]*)'/.exec(line);
    if (open) (declaredBy.get(open[1]) || []).forEach((f) => { if (fileChunk.get(f)) set.add(fileChunk.get(f)); });
    if (set.size) games[id[1]] = [...set];
  }

  return {
    shell: order.filter((f) => shellSet.has(f)),
    chunks: sorted.map((id) => ({
      id, files: [...CHUNKS[id]].sort((a, b) => pos.get(a) - pos.get(b)),
      deps: [...deps[id]].sort((x, y) => sorted.indexOf(x) - sorted.indexOf(y))
    })),
    views, rooms, games,
    shellUses: Object.fromEntries(Object.entries(shellUses).map(([f, s]) => [f, [...s]]))
  };
}

/** The code of a chunk: its files' scripts, one after another, in the page's order. */
export function chunkCode(chunk, sources, banner) {
  return chunk.files.map((f) => {
    const src = sources.get(f);
    const parts = /\.js$/.test(f) ? [src] : [...src.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
    return parts.map((p) => (banner ? `/* ==== ${f} ==== */\n` : '') + p.replace(/\s+$/, '') + '\n;').join('\n');
  }).join('\n');
}

/* --- the registries' load order ----------------------------------------------
   ROOM_GAMES, TV_GAMES and RACE_UI are filled by whichever file runs, and on
   the one page that was the page's order; under chunks it is the chunks' order,
   which can be the other way round. Two bugs of 30 Sep 2026 came from that:
   the tournament wrapped the duels' renderers at its own load (tourWrap),
   before dots, X-O, خمّن مين, حرب السفن and chess - in chunks that run after
   it - had registered, so none of them got the tournament; and فوازير إيموجي's
   router (JS_RoomSolve) read the quiz's entry at load and replaced it, then
   the quiz chunk ran second and put the quiz back over the router. So, in both
   orders (the page's and the chunks'), an entry:
   - is written at load, without a guard, by one chunk only (a second writer
     yields: \`if (!(ROOM_GAMES.x && ROOM_GAMES.x.flag)) ROOM_GAMES.x = …\`);
   - is read at load (to keep or patch it) only after it was written, by a chunk
     that always loads the writer's chunk first;
   - wrapped by a wrapper (a function that reads ROOM_GAMES[its first
     parameter]), is wrapped by a call that runs after its last write, when the
     wrapper exists (a guarded \`if (typeof w === 'function') w('x')\` at the
     end of the writer's file does it). */
const REGISTRIES = ['ROOM_GAMES', 'TV_GAMES', 'RACE_UI'];

function registryFacts(scripts, file) {
  const out = { writes: [], reads: [], wrapCalls: [], wrappers: [], arrays: {}, objects: {}, forEachWrites: [] };
  scripts.forEach((src, si) => {
    const ast = acorn.parse(src, { ecmaVersion: 'latest', sourceType: 'script', allowReturnOutsideFunction: true });
    const at = (n) => [si, n.start];
    for (const st of ast.body) {
      if (st.type === 'VariableDeclaration') for (const d of st.declarations) {
        if (d.id.type !== 'Identifier' || !d.init) continue;
        if (d.init.type === 'ArrayExpression' && d.init.elements.every((e) => e && e.type === 'Literal' && typeof e.value === 'string')) out.arrays[d.id.name] = d.init.elements.map((e) => e.value);
        if (d.init.type === 'ObjectExpression') out.objects[d.id.name] = d.init.properties.filter((p) => p.type === 'Property' && !p.computed).map((p) => p.key.name || p.key.value);
      }
      if (st.type === 'FunctionDeclaration' && st.id && st.params[0] && st.params[0].type === 'Identifier') {
        const p = st.params[0].name;
        let reads = false;
        walk.full(st.body, (n) => {
          if (n.type === 'MemberExpression' && n.computed && n.object.type === 'Identifier' && REGISTRIES.includes(n.object.name) &&
              n.property.type === 'Identifier' && n.property.name === p) reads = true;
        });
        if (reads) out.wrappers.push(st.id.name);
      }
    }
    const fnsOf = (anc) => anc.slice(0, -1).filter((a) => /Function/.test(a.type));
    // a load-time `<list>.forEach(fn)`: the list's ids, or null
    const listOf = (obj) => {
      if (obj.type === 'ArrayExpression') return { lit: obj.elements.map((e) => e && e.type === 'Literal' ? e.value : null).filter(Boolean) };
      if (obj.type === 'Identifier') return { arr: obj.name };
      if (obj.type === 'CallExpression' && obj.callee.type === 'MemberExpression' && obj.callee.object.name === 'Object' &&
          obj.callee.property.name === 'keys' && obj.arguments[0] && obj.arguments[0].type === 'Identifier') return { obj: obj.arguments[0].name };
      return null;
    };
    walk.fullAncestor(ast, (node, _st, anc) => {
      const parent = anc[anc.length - 2];
      const fns = fnsOf(anc);
      // ROOM_GAMES[kind] = … inside `list.forEach(kind => …)` at load
      if (node.type === 'AssignmentExpression' && node.left.type === 'MemberExpression' && node.left.computed &&
          node.left.object.type === 'Identifier' && REGISTRIES.includes(node.left.object.name) && node.left.property.type === 'Identifier') {
        const fn = fns[fns.length - 1];
        if (fns.length === 1 && fn.params[0] && fn.params[0].name === node.left.property.name) {
          const call = anc[anc.indexOf(fn) - 1];
          if (call && call.type === 'CallExpression' && call.callee.type === 'MemberExpression' && call.callee.property.name === 'forEach') {
            const list = listOf(call.callee.object);
            if (list) out.forEachWrites.push({ reg: node.left.object.name, list, at: at(call) });
          }
        }
        return;
      }
      if (node.type === 'MemberExpression' && !node.computed && node.object.type === 'Identifier' && REGISTRIES.includes(node.object.name)) {
        if (fns.length) return; // inside a function: runs later, when everything is in
        const key = { reg: node.object.name, id: node.property.name, at: at(node) };
        const name = `${key.reg}.${key.id}`;
        if (parent && parent.type === 'AssignmentExpression' && parent.left === node) {
          const guarded = anc.some((a, i) => a.type === 'IfStatement' && anc[i + 1] !== a.test && src.slice(a.test.start, a.test.end).includes(name));
          out.writes.push({ ...key, guarded });
          return;
        }
        // an existence check (if (…), a && …, typeof …) is not a read that needs the entry
        const check = anc.some((a, i) => (a.type === 'IfStatement' && anc[i + 1] === a.test) ||
          (a.type === 'ConditionalExpression' && anc[i + 1] === a.test) ||
          (a.type === 'LogicalExpression' && anc[i + 1] === a.left) || (a.type === 'UnaryExpression' && a.operator === 'typeof'));
        if (!check) out.reads.push(key);
        return;
      }
      if (node.type === 'CallExpression' && !fns.length) {
        if (node.callee.type === 'Identifier' && node.arguments[0] && node.arguments[0].type === 'Literal') {
          out.wrapCalls.push({ fn: node.callee.name, list: { lit: [node.arguments[0].value] }, at: at(node) });
        }
        if (node.callee.type === 'MemberExpression' && node.callee.property.name === 'forEach' && node.arguments[0] && node.arguments[0].type === 'Identifier') {
          const list = listOf(node.callee.object);
          if (list) out.wrapCalls.push({ fn: node.arguments[0].name, list, at: at(node) });
        }
      }
    });
  });
  return out;
}

/** Throws when an entry's writes, reads and wraps can run in the wrong order (see above). */
export function checkRegistryOrder({ order, code, fileChunk, shellSet, sorted, deps }) {
  const facts = new Map();
  for (const f of order) {
    if (/^Style(_|$)/.test(f) || f === 'Tailwind' || f === 'Logo' || /\.js$/.test(f)) continue;
    facts.set(f, registryFacts(code.get(f), f));
  }
  const arrays = {}, objects = {}, wrapperFile = {};
  for (const [f, x] of facts) {
    Object.assign(arrays, x.arrays); Object.assign(objects, x.objects);
    x.wrappers.forEach((w) => { wrapperFile[w] = f; });
  }
  const ids = (list) => list.lit || arrays[list.arr] || objects[list.obj] || [];
  const pagePos = new Map(order.map((f, i) => [f, i]));
  const chunkIdx = new Map(sorted.map((id, i) => [id, i]));
  const closure = (id) => {
    const seen = new Set(), stack = [id];
    while (stack.length) { const c = stack.pop(); if (seen.has(c)) continue; seen.add(c); (deps[c] || []).forEach((d) => stack.push(d)); }
    return seen;
  };
  // Every event of every entry, with its file and place in the file.
  const ev = new Map(); // 'ROOM_GAMES.dots' -> [{kind, file, at, guarded}]
  const add = (reg, id, e) => { const k = `${reg}.${id}`; if (!ev.has(k)) ev.set(k, []); ev.get(k).push(e); };
  for (const [f, x] of facts) {
    x.writes.forEach((w) => add(w.reg, w.id, { kind: 'write', file: f, at: w.at, guarded: w.guarded }));
    x.forEachWrites.forEach((w) => ids(w.list).forEach((id) => add(w.reg, id, { kind: 'write', file: f, at: w.at, guarded: false })));
    x.reads.forEach((r) => add(r.reg, r.id, { kind: 'read', file: f, at: r.at }));
    x.wrapCalls.forEach((c) => {
      if (!wrapperFile[c.fn]) return;
      for (const id of ids(c.list)) for (const reg of ['ROOM_GAMES', 'TV_GAMES']) add(reg, id, { kind: 'wrap', file: f, at: c.at, fn: c.fn });
    });
  }
  const problems = [];
  for (const mode of ['page', 'chunks']) {
    // Where a file runs: the page's order, or its chunk's place (the shell first).
    const place = (f) => (mode === 'page' ? [pagePos.get(f)] : [shellSet.has(f) ? -1 : chunkIdx.get(fileChunk.get(f)), pagePos.get(f)]);
    const key = (e) => [...place(e.file), ...e.at];
    const before = (a, b) => { for (let i = 0; i < Math.max(a.length, b.length); i++) { const x = a[i] ?? -1, y = b[i] ?? -1; if (x !== y) return x < y; } return false; };
    const chunkOf = (f) => (shellSet.has(f) ? null : fileChunk.get(f));
    // b's chunk is always there when a's runs: the shell, the same chunk, or one a's chunk loads first.
    const loadedWith = (a, b) => mode === 'page' || !chunkOf(b) || chunkOf(a) === chunkOf(b) || (chunkOf(a) && closure(chunkOf(a)).has(chunkOf(b)));
    for (const [name, list] of ev) {
      const writes = list.filter((e) => e.kind === 'write');
      if (!writes.length) continue;
      const plain = writes.filter((e) => !e.guarded);
      const owners = [...new Set(plain.map((e) => (mode === 'page' ? e.file : chunkOf(e.file) || e.file)))];
      if (owners.length > 1) problems.push(`${mode}: ${name} is set at load by ${[...new Set(plain.map((e) => e.file))].join(' and ')} - whichever runs second wins; make one yield (if (!(${name} && ${name}.<flag>)) …)`);
      for (const r of list.filter((e) => e.kind === 'read')) {
        const ok = writes.some((w) => before(key(w), key(r)) && loadedWith(r.file, w.file));
        if (!ok) problems.push(`${mode}: ${r.file} reads ${name} at load before it is set (by ${[...new Set(writes.map((w) => w.file))].join(', ')}) - read it when it is needed`);
      }
      const wraps = list.filter((e) => e.kind === 'wrap');
      if (wraps.length) {
        const last = writes.reduce((m, w) => (before(key(m), key(w)) ? w : m));
        const ok = wraps.some((c) => {
          const def = wrapperFile[c.fn];
          // A function is there from the start of its script: its file on the page, its whole chunk.
          const exists = mode === 'page' ? (c.file === def || pagePos.get(def) < pagePos.get(c.file)) : place(def)[0] <= place(c.file)[0];
          return exists && before(key(last), key(c)) && loadedWith(c.file, def);
        });
        if (!ok) problems.push(`${mode}: ${name} is wrapped (${[...new Set(wraps.map((c) => c.fn))].join(', ')}) before ${last.file} sets it - end ${last.file} with if (typeof ${wraps[0].fn} === 'function') ${wraps[0].fn}('${name.split('.')[1]}')`);
      }
    }
  }
  if (problems.length) throw new Error(`lazy-split: the registries can run in the wrong order:\n  ${[...new Set(problems)].join('\n  ')}`);
}

/* Word lists the page shares with the rooms server: one file, both sides
   (and ChessPuzzles.js, which only the page has). */
export const SHARED_LISTS = ['Games.js', 'DisabledGames.js', 'Dice.js', 'Packs.js', 'ChameleonWords.js', 'SpyfallPlaces.js', 'BombPrompts.js', 'EmojiRiddles.js', 'Proverbs.js', 'MonkeyWords.js', 'StopWords.js', 'TriviaQuestions.js', 'SkrewCards.js', 'UnoCards.js', 'DominoTiles.js', 'Connect4.js', 'DotsBoxes.js', 'Battleship.js', 'Chess.js', 'Chess4.js', 'Ludo.js', 'Snakes.js', 'BankAlhaz.js', 'GuessWho.js', 'Witness.js', 'Dark.js', 'Hangman.js', 'MiniGolf.js', 'PlayingCards.js', 'Skull.js', 'Estimation.js', 'Wire.js', 'Vault.js', 'Hear.js', 'Bowling.js', 'TicTacToe.js', 'WordleWords.js', 'Countries.js', 'SolveGames.js', 'SoloShared.js', 'ConnectionsWords.js', 'Sudoku.js', 'Queens.js', 'Tango.js', 'Nonogram.js', 'Mines.js', 'Strands.js', 'WordWheel.js', 'Pinpoint.js', 'QuizStreak.js', 'ChessPuzzles.js', 'Missions.js'];

/** Reads Controller.html, every file it includes and the shared lists. */
export async function readPage(root, readFile, path) {
  const controller = await readFile(path.join(root, 'Controller.html'), 'utf8');
  const includes = [...controller.matchAll(/<\?!=\s*include\('([^']+)'\);?\s*\?>/g)].map((m) => m[1]);
  const sources = new Map();
  for (const n of includes) sources.set(n, await readFile(path.join(root, `${n}.html`), 'utf8'));
  for (const n of SHARED_LISTS) sources.set(n, await readFile(path.join(root, n), 'utf8'));
  // On the page the lists come after the styles and before the scripts.
  const styles = includes.filter((n) => !/^JS_/.test(n));
  const order = [...styles, ...SHARED_LISTS, ...includes.filter((n) => /^JS_/.test(n))];
  const roomGameIds = roomGameIdsOf(sources.get('Games.js'));
  return { controller, includes, sources, order, roomGameIds };
}

/** The ids of the room games (ROOM_GAME_IDS, built from GAME_LIST in Games.js). */
export function roomGameIdsOf(gamesJs) {
  const ids = new Function(gamesJs + '\nreturn ROOM_GAME_IDS;')();
  if (!ids || !ids.length) throw new Error('lazy-split: no room games in Games.js');
  return ids;
}

/* --- putting the page together ------------------------------------------------
   Controller.html with its includes: the shell's inlined, a chunk's left out
   (its code goes to its own file), the shared lists the shell needs inlined at
   their comment, the map (window.LZ_MANIFEST) at the chunk-map comment before
   JS_Lazy.html, and the boot line (lzBootWrite) at the end of the body. With
   `whole`, the page as it was: everything inlined, no map, no chunk files.

   name(chunk, code) gives a chunk's file name (the site's carries its hash).
   Returns { html, chunks: [{ id, deps, file, code }], manifest, plan }; the
   template values (<?!= … ?>) are left for the caller. */
const LISTS_MARK = /<!-- tools\/build-site\.mjs and build-preview\.mjs inline the word lists[^\n]*-->/;
const MAP_MARK = /<!-- tools\/build-site\.mjs and build-preview\.mjs write the map of the chunks here[^\n]*-->/;
const BOOT_MARK = /<!-- tools\/build-site\.mjs and build-preview\.mjs write the boot line here[^\n]*-->/;

export async function assemble({ root, readFile, path, whole = false, name = (c) => `${c.id}.js`, banner = false, base = 'g/', prepare = async (code) => code }) {
  const page = await readPage(root, readFile, path);
  let html = page.controller;
  for (const m of [LISTS_MARK, MAP_MARK, BOOT_MARK]) {
    if (!m.test(html)) throw new Error(`Controller.html: a build comment is missing (${m.source.slice(0, 70)}…)`);
  }
  const tags = [...html.matchAll(/<\?!=\s*include\('([^']+)'\);?\s*\?>/g)];
  const script = (code) => `<script>\n${code}\n</script>`;

  if (whole) {
    for (const [tag, n] of tags) html = html.replace(tag, () => page.sources.get(n));
    html = html.replace(LISTS_MARK, () => SHARED_LISTS.map((n) => script(page.sources.get(n))).join('\n    '));
    html = html.replace(MAP_MARK, '').replace(BOOT_MARK, '');
    return { html, chunks: [], manifest: null, plan: null };
  }

  const p = plan(page);
  const shell = new Set(p.shell);
  for (const [tag, n] of tags) html = html.replace(tag, () => (shell.has(n) ? page.sources.get(n) : ''));
  html = html.replace(LISTS_MARK, () => SHARED_LISTS.filter((n) => shell.has(n)).map((n) => script(page.sources.get(n))).join('\n    '));

  const chunks = [];
  for (const c of p.chunks) {
    const code = await prepare(chunkCode(c, page.sources, banner), c);
    chunks.push({ id: c.id, deps: c.deps, code, file: name(c, code) });
  }
  const manifest = {
    base,
    order: chunks.map((c) => c.id),
    chunks: Object.fromEntries(chunks.map((c) => [c.id, c.deps.length ? { f: c.file, d: c.deps } : { f: c.file }])),
    views: p.views, rooms: p.rooms, games: p.games
  };
  html = html.replace(MAP_MARK, () => script(`window.LZ_MANIFEST = ${JSON.stringify(manifest).replace(/</g, '\\u003c')};`));
  html = html.replace(BOOT_MARK, () => script('if (window.lzBootWrite) lzBootWrite();'));
  return { html, chunks, manifest, plan: p };
}
