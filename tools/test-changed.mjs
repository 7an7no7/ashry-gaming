/**
 * Runs the tests the changes need, not all of them: `npm run test:changed`.
 *
 *   npm run test:changed                        changes since master (committed or not, new files too)
 *   npm run test:changed -- --base=HEAD~3       since another ref
 *   npm run test:changed -- --dry               only say what it would run
 *   npm run test:changed -- --dry --files=RoomUno.js,JS_Sudoku.html   what a change to those would run
 *   npm run test:changed -- http://127.0.0.1:8799   another rooms server (else ROOMS_URL, else :8787)
 *
 * It reads the files changed (git diff against the merge base with --base, and the untracked ones),
 * maps each to the games it belongs to (MAP below), and runs:
 *   - `npm run check` in tools/ whenever anything but notes changed;
 *   - `npm run test:rules` in rooms-worker/ when a file the rooms server bundles changed;
 *   - the robots (rooms-worker/test/play-all.mjs) for those games' segments, side by side;
 *   - the screen test (test-ui-parallel.mjs): `screens` when a page file changed, `rooms` for those
 *     room games (UI_GAMES), `fixes` / `site` when what they check changed.
 * A file in CORE, or one the map doesn't know, runs everything: better too much than a miss.
 * The robots and the screen test need the rooms server running (cd rooms-worker && npm run dev).
 */
import path from 'node:path';
import fs from 'node:fs';
import { spawnSync, execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { readPage, plan as lazyPlan } from './lazy-split.mjs';

const here = fileURLToPath(new URL('./', import.meta.url));
const root = path.join(here, '..');
const ARGS = process.argv.slice(2);
const BASE_REF = (ARGS.find((a) => a.startsWith('--base=')) || '--base=master').slice(7);
const DRY = ARGS.includes('--dry');
const ROOMS = (ARGS.find((a) => /^https?:/.test(a)) || process.env.ROOMS_URL || 'http://127.0.0.1:8787').replace(/\/$/, '');

/* --- what each file belongs to ----------------------------------------------------------------
 * robots: segments of play-all.mjs (npm test --only=...); ui: room game ids for the screen test's
 * rooms part; screens: true when the one-phone screens should be swept too. A pattern is matched
 * against the file's path from the repo root. The first match wins; CORE is checked before it.
 */
const CORE = [
  /^rooms-worker\/src\//, /^rooms-worker\/build\.mjs$/, /^rooms-worker\/fingerprint\.mjs$/, /^rooms-worker\/package/,
  /^rooms-worker\/wrangler/, /^RoomGames\.js$/, /^Room(Stop|Chameleon|Spyfall|Bomb|Buzzer|Imposter|JustOne|WhoAmI|Codenames|WouldYou|MostLikely|Fibbage|Draw|FakeArtist|Trivia|TwoTruths|Quiz|FiveSeconds|Telephone|Monkey|Herd|Mind|Timeline)\.js$/, /^Games\.js$/, /^DisabledGames\.js$/, /^Common\.js$/, /^RoomShared\.js$/,
  /^Controller\.html$/, /^Style(_\w+)?\.html$/, /^Tailwind\.html$/, /^Logo\.html$/,
  /^JS_(Core|Translations|Room|RoomGames|RoomTv|RoomTurn|RoomChat|RoomAudience|RoomVoting|Motion|Utils|Catalog|Sounds|Three|ShareCard|Solo|Daily|TeamRelay|Lazy|RoomImposter)\.html$/,   // JS_Lazy: every door; JS_RoomImposter: renderRoomFrame, roomAct
  /^tools\/(build-preview|build-site|test-ui|test-ui-parallel|test-changed)\.mjs$/, /^tools\/package/,
  /^rooms-worker\/test\/play-all\.mjs$/,
];
const IGNORE = [/^notes\//, /\.md$/, /^\.claude\//, /^docs\//, /^\.github\//];
const CORE_GAMES = ['imposter', 'justone', 'whoami', 'codenames', 'fibbage', 'wouldyou', 'mostlikely', 'drawguess', 'fakeartist',
  'trivia', 'buzzer', 'stop', 'chameleon', 'spyfall', 'bomb', 'twotruths', 'emoji', 'proverbs', 'fiveseconds',
  'telephone', 'monkey', 'herd', 'mind', 'timeline'];
const RACE_GAMES = ['strands', 'wordwheel', 'connections', 'pinpoint', 'queens', 'tango', 'nonogram', 'mines', 'streak', 'sudoku'];
const MAP = [
  // The rules in Help and the first-play card: the screens only.
  { files: /^JS_GameRules\.html$/, screens: true },
  // A game's own words and rules (games/<id>/<id>.text.js): its screens.
  { files: /\.text\.js$/, screens: true },
  // The party games the core segment plays in its one room (and their word lists, which المشنقة,
  // the solve games, the race and the packs' rooms deal from too). PartyContent.js also holds
  // DRAW_WORDS, which المهمة السرية deals its word missions from (RoomMission.js): its row comes
  // first, since a file takes the first row that names it.
  { files: /^PartyContent\.js$/, robots: ['core', 'autonext', 'hangman', 'solve', 'race', 'quiz', 'mission'], ui: CORE_GAMES.concat(['hangman', 'wordle'], RACE_GAMES), screens: true, mission: true },
  { files: /^(SpyWords|CodenamesWords|PartyContent|TriviaQuestions|ChameleonWords|SpyfallPlaces|BombPrompts|EmojiRiddles|Proverbs|MonkeyWords|StopWords|TimelineEvents)\.js$/, robots: ['core', 'autonext', 'hangman', 'solve', 'race', 'quiz'], ui: CORE_GAMES.concat(['hangman', 'wordle'], RACE_GAMES), screens: true },
  { files: /^JS_Room(Imposter|Codenames|Buzzer|Stop|Chameleon|Spyfall|Bomb|Draw|TwoTruths|Quiz|FiveSeconds|Telephone|Monkey|FakeArtist|Trivia|Herd|Mind|Timeline)\.html$/, robots: ['core', 'autonext'], ui: CORE_GAMES },
  // «التالي لوحده»: the next round by itself in the vote and quiz games.
  { files: /^JS_RoomAutoNext\.html$/, robots: ['autonext'], ui: ['trivia', 'wouldyou', 'mostlikely', 'fibbage', 'herd', 'twotruths'] },
  // Error reports from players' phones (/err): the admin script that reads them.
  { files: /^tools\/errors\.mjs$/, robots: ['err'] },
  // «اعمل مسابقتك» and «كلماتنا»: the packs, their editor, and the rooms that deal them.
  { files: /^(Packs\.js|JS_PackStore\.html|JS_QuizMaker\.html|rooms-worker\/src\/packs\.js)$/, robots: ['quiz', 'core', 'crewlink'], ui: ['trivia', 'buzzer', 'imposter', 'chameleon', 'drawguess', 'whoami'], screens: true },
  // «انقل لموبايل تاني» (7 Oct 2026): the endpoints (the robots' move segment; the merge is in test:rules) and the dialog.
  { files: /^(MoveData\.js|JS_Move\.html|rooms-worker\/src\/move\.js)$/, robots: ['move'], screens: true },
  { files: /^JS_(Imposter|Chameleon|Spyfall|Bomb|Monkey|Stop|StopBus|WhoAmI|Charades|DescribeIt|TimesUp|Teams|JustOne|Reaction|Emoji|Proverbs|FiveSeconds|TriviaBoard|TriviaBoardBank|Director|HeadsUp|Chooser)\.html$/, screens: true, ui: CORE_GAMES },
  { files: /^(RoomMafia\.js|JS_RoomMafia\.html)$/, robots: ['mafia'], ui: ['mafia'] },
  { files: /^(SkrewCards\.js|RoomScrew\.js|JS_RoomScrew\.html|JS_Screw\.html)$/, robots: ['screw'], ui: ['screw'], screens: true },
  { files: /^(UnoCards\.js|RoomUno\.js|JS_RoomUno\.html)$/, robots: ['uno'], ui: ['uno'] },
  { files: /^(DominoTiles\.js|RoomDomino\.js|JS_RoomDomino\.html|JS_Domino\.html)$/, robots: ['domino'], ui: ['domino'], screens: true },
  { files: /^(RoomDuels\.js|Duels\.js)$/, robots: ['connect4', 'c4teams', 'dots', 'duels', 'guesswho', 'battleship', 'chess'], ui: ['connect4', 'dots', 'xo', 'guesswho', 'battleship', 'chess'] },
  { files: /^(Connect4\.js|DotsBoxes\.js|TicTacToe\.js|JS_RoomConnect4\.html|JS_RoomDots\.html|JS_RoomXO\.html|JS_Connect4\.html|JS_Dots\.html|JS_XO\.html)$/, robots: ['connect4', 'c4teams', 'dots', 'duels'], ui: ['connect4', 'dots', 'xo'], screens: true },
  { files: /^(RoomTournament\.js|JS_RoomTournament\.html|JS_Tournament\.html)$/, robots: ['duels'], ui: ['connect4', 'xo'], screens: true },
  { files: /^Dice\.js$/, robots: ['ludo', 'snakes', 'bank'], ui: ['ludo', 'snakes', 'bank'], screens: true },
  { files: /^(Ludo\.js|RoomLudo\.js|JS_Ludo\.html|JS_RoomLudo\.html)$/, robots: ['ludo'], ui: ['ludo'], screens: true },
  { files: /^(Snakes\.js|RoomSnakes\.js|JS_Snakes[A-Za-z]*\.html|JS_RoomSnakes\.html)$/, robots: ['snakes'], ui: ['snakes'], screens: true },
  { files: /^(BankAlhaz\.js|RoomBank\.js|JS_Bank\.html|JS_RoomBank\.html)$/, robots: ['bank'], ui: ['bank'], screens: true },
  { files: /^GuessWho\.js$/, robots: ['guesswho', 'witness', 'duels'], ui: ['guesswho', 'witness'] },
  { files: /^(RoomGuessWho\.js|JS_GuessWho\.html)$/, robots: ['guesswho', 'duels'], ui: ['guesswho'] },
  { files: /^(Hangman\.js|RoomHangman\.js|JS_Hangman\.html|JS_HangmanEnd\.html)$/, robots: ['hangman'], ui: ['hangman'], screens: true },
  { files: /^(Battleship\.js|RoomBattleship\.js|JS_Battleship\.html)$/, robots: ['battleship', 'duels'], ui: ['battleship'], screens: true },
  { files: /^(Chess\.js|RoomChess\.js)$/, robots: ['chess', 'teamchess', 'hq', 'bughouse', 'duels'], ui: ['chess', 'votechess', 'handbrain', 'bughouse'], screens: true },
  { files: /^JS_(Chess|ChessOpenings|ChessPosition|ChessPuzzles|ChessReview|ChessStockfish|RoomChess)\.html$|^vendor\/stockfish\//, robots: [], ui: ['chess', 'votechess', 'handbrain', 'bughouse'], screens: true },
  { files: /^ChessPuzzles\.js$/, screens: true },
  { files: /^(RoomVoteChess\.js|RoomHandBrain\.js|JS_RoomVoteChess\.html|JS_RoomHandBrain\.html)$/, robots: ['teamchess'], ui: ['votechess', 'handbrain'] },
  { files: /^(RoomBughouse\.js|JS_RoomBughouse\.html)$/, robots: ['bughouse'], ui: ['bughouse'] },
  { files: /^(Chess4\.js|RoomChess4\.js|JS_RoomChess4\.html)$/, robots: ['chess4'], ui: ['chess4'] },
  { files: /^(Bowling\.js|RoomBowling\.js|JS_Bowling\.html)$/, robots: ['bowling'], ui: ['bowling'], screens: true },
  { files: /^(MiniGolf\.js|RoomMiniGolf\.js|JS_MiniGolf\.html)$/, robots: ['minigolf'], ui: ['minigolf'], screens: true },
  { files: /^(PlayingCards\.js|JS_Cards\.html)$/, robots: ['doubt', 'oldmaid', 'estimation'], ui: ['doubt', 'oldmaid', 'estimation'] },
  { files: /^(RoomDoubt\.js|JS_RoomDoubt\.html)$/, robots: ['doubt'], ui: ['doubt'] },
  { files: /^(RoomOldMaid\.js|JS_RoomOldMaid\.html)$/, robots: ['oldmaid'], ui: ['oldmaid'] },
  { files: /^(Estimation\.js|RoomEstimation\.js|JS_RoomEstimation\.html|JS_CardRules\.html|JS_CardScore\.html)$/, robots: ['estimation'], ui: ['estimation'], screens: true },
  { files: /^(Skull\.js|RoomSkull\.js|JS_RoomSkull\.html)$/, robots: ['skull'], ui: ['skull'] },
  { files: /^(RoomChairs\.js|JS_RoomChairs\.html)$/, robots: ['chairs', 'chairs-dj'], ui: ['chairs'] },
  { files: /^(RoomReaction\.js|JS_RoomReaction\.html)$/, robots: ['reaction'], ui: ['reaction'] },
  { files: /^(RoomBumper\.js|JS_RoomBumper\.html)$/, robots: ['bumper'], ui: ['bumper'] },
  { files: /^(Wire\.js|RoomWire\.js|JS_RoomWire\.html)$/, robots: ['wire'], ui: ['wire'] },
  { files: /^(Vault\.js|RoomVault\.js|JS_RoomVault\.html)$/, robots: ['vault'], ui: ['vault'] },
  { files: /^(Witness\.js|RoomWitness\.js|JS_RoomWitness\.html)$/, robots: ['witness'], ui: ['witness'] },
  { files: /^(Hear\.js|RoomHear\.js|JS_RoomHear\.html)$/, robots: ['hear'], ui: ['hear'] },
  { files: /^(RoomExact\.js|JS_RoomExact\.html)$/, robots: ['exact'], ui: ['exact'] },
  { files: /^(Songs\.js|RoomHum\.js|JS_RoomHum\.html)$/, robots: ['hum'], ui: ['hum'] },
  // «الشلة»: the crew's rules and page (a room's night reaches its crew: the robots' crew segment; the page: screens and fixes).
  { files: /^(Crew\.js|JS_Crew\.html|JS_CrewCore\.html)$/, robots: ['crew', 'crewlink'], screens: true, fixes: true },
  { files: /^(Dark\.js|RoomDark\.js|JS_RoomDark\.html)$/, robots: ['darkroom'], ui: ['darkroom'] },
  { files: /^(RoomBox\.js|JS_RoomBox\.html)$/, robots: ['box'], ui: ['box'] },
  // برنامج السهرة: its robots, and the screen test's own part (the builder, the table, the finale).
  { files: /^(RoomProgram\.js|JS_RoomProgram\.html)$/, robots: ['program', 'crewlink'], program: true },
  // المهمة السرية: a switch beside every game - its robots (and the night it banks), the lobby and the TV's lobby.
  { files: /^(Missions\.js|RoomMission\.js|JS_RoomMission\.html)$/, robots: ['mission', 'crewlink'], screens: true, mission: true },
  // One sets, everyone solves, and the puzzle race: the same engine.
  { files: /^(SolveGames\.js|RoomSolve\.js|JS_RoomSolve\.html|WordleWords\.js|Countries\.js|JS_Wordle\.html|JS_GuessNumber\.html|JS_Flags\.html|JS_FlagsMap\.html)$/, robots: ['solve', 'race'], ui: ['wordle', 'guessnum', 'flags', 'emoji'], screens: true },
  { files: /^(RoomRace\.js|JS_RoomRace\.html|SoloShared\.js|Sudoku\.js|Queens\.js|Tango\.js|Nonogram\.js|Mines\.js|Strands\.js|WordWheel\.js|Pinpoint\.js|QuizStreak\.js|ConnectionsWords\.js)$/, robots: ['race'], ui: RACE_GAMES, screens: true },
  { files: /^JS_(Sudoku|Queens|Tango|Nonogram|Mines|WordSearch|WordWheel|Pinpoint|QuizStreak|Connections|2048|Memory)\.html$/, ui: RACE_GAMES, screens: true },
  { files: /^(JS_RoomLaser\.html|RoomLaser\.js)$/, robots: ['laser'], ui: ['laser'] },   // Laser (tools/new-game.mjs)
  // A player's drawn face (audit 7 Oct 2026, C2): the server checks it on every join (the faces robots,
  // and the core segment's joins), every lobby and TV draws it (a core room, and the two games that
  // show faces on their boards), and the face editor is a screen.
  { files: /^(Faces\.js|JS_Faces\.html)$/, robots: ['faces', 'core'], ui: ['imposter', 'witness', 'guesswho'], screens: true },
  { files: /^(JS_Hesba\.html|JS_HesbaLook\.html|JS_RoomHesba\.html|RoomHesba\.js|Hesba\.js)$/, robots: ['hesba'], ui: ['hesba'], screens: true },   // Numbers (tools/new-game.mjs)
  { files: /^(JS_Boggle\.html|JS_RoomBoggle\.html|RoomBoggle\.js|Boggle\.js|boggle\.text\.js)$/, robots: ['boggle'], ui: ['boggle'], screens: true },   // Letter Grid
  { files: /^(JS_Oracle\.html|Oracle[A-Za-z]*\.js|oracle\.text\.js)$/, screens: true },   // The Oracle (tools/new-game.mjs; its data checked by npm run check)
  { files: /^(JS_RoomBlockway\.html|RoomBlockway\.js)$/, robots: ['blockway'], ui: ['blockway'] },   // Block the Way (tools/new-game.mjs)
  // The page's own screens and the offline copy.
  { files: /^JS_[A-Za-z0-9]+\.html$/, screens: true },
  { files: /^(site-worker\/|tools\/site\.config\.json$|tools\/(make-icons|make-og)\.mjs$)/, site: true },
  { files: /^tools\/(validate-content\.js|check-i18n\.js|check-css-vars\.js|check-songs\.mjs)$/ },
  // Admin and CI-only scripts that build nothing the app or the server serves (audit 7 Oct 2026, C3):
  // the checks only. (errors.mjs is above: the robots' err segment covers the endpoint it reads.)
  { files: /^tools\/(ci-issue|weekly-report|plays|reports|compare-styles|check-live|check-names|stop-words|export-trivia-bank|prove-docs-split)\.mjs$/ },
  // The rules tests and the leak check themselves: npm run test:rules runs both (BUNDLED below).
  { files: /^rooms-worker\/test\/(rules|leaks)\.mjs$/ },
];

/* --- the files that changed ------------------------------------------------------------------ */
const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
let base;
try { base = git('merge-base', BASE_REF, 'HEAD'); } catch (e) { base = BASE_REF; }
// --files=a,b stands in for the diff: to see what a change would run before making it.
const FILES_ARG = ARGS.find((a) => a.startsWith('--files='));
const changed = FILES_ARG ? FILES_ARG.slice(8).split(',').filter(Boolean) : [...new Set([
  ...git('diff', '--name-only', base).split('\n'),
  ...git('ls-files', '--others', '--exclude-standard').split('\n'),
].filter(Boolean))];

// A game's words and rules (games/<id>/<id>.text.js) are its screens' text: they test as its
// screens do. Before 5 Oct 2026 they were in JS_Translations.html, which ran everything.
for (const p of changed.slice()) {
  const m = /^games\/([^/]+)\/[^/]+\.text\.js$/.exec(p);
  if (!m || !fs.existsSync(path.join(root, 'games', m[1]))) continue;
  for (const f of fs.readdirSync(path.join(root, 'games', m[1]))) {
    if (/\.html$/.test(f) && !changed.includes(`games/${m[1]}/${f}`)) changed.push(`games/${m[1]}/${f}`);
  }
}

const plan = { check: false, rules: false, all: false, robots: new Set(), ui: new Set(), screens: false, fixes: false, program: false, mission: false, site: false, why: [] };
// What test:rules has to run for: a file the server bundles, or the rules tests and leak check themselves.
const BUNDLED = /^(rooms-worker\/src\/|rooms-worker\/test\/(rules|leaks)\.mjs$|[A-Z][A-Za-z0-9]*\.js$)/;
// A source file is mapped by its name (MAP and CORE name files, wherever their folder is).
const SOURCE = /^(app|styles|rooms|content|games)\//;
for (const path0 of changed) {
  const f = SOURCE.test(path0) ? path0.split('/').pop() : path0;
  if (IGNORE.some((r) => r.test(f))) continue;
  plan.check = true;
  if (BUNDLED.test(f)) plan.rules = true;
  if (CORE.some((r) => r.test(f))) { plan.all = true; plan.why.push(`${f}: core, everything`); continue; }
  const hit = MAP.find((m) => m.files.test(f));
  if (!hit) { plan.all = true; plan.why.push(`${f}: not in the map, everything`); continue; }
  (hit.robots || []).forEach((s) => plan.robots.add(s));
  (hit.ui || []).forEach((g) => plan.ui.add(g));
  if (hit.screens) plan.screens = true;
  if (hit.site) plan.site = true;
  if (hit.program) plan.program = true;
  if (hit.mission) plan.mission = true;
  if (hit.fixes) plan.fixes = true;
  if ((hit.ui || []).some((g) => ['hangman', 'guesswho', 'chess', 'battleship'].includes(g))) plan.fixes = true;
  plan.why.push(`${f}: ${[(hit.robots || []).length ? 'robots ' + hit.robots.join(',') : '', (hit.ui || []).length ? 'rooms ' + hit.ui.join(',') : '', hit.screens ? 'screens' : '', hit.site ? 'site' : ''].filter(Boolean).join('; ') || 'checks only'}`);
}
// A page file's helpers are called from other games' chunks too (duelOnce from ludo, golf and the
// race; JS_Cards from أونو): every room game whose chunks reach a changed file's chunk gets its
// screen test, through the chunk graph the build itself makes (tools/lazy-split.mjs).
if (!plan.all) {
  try {
    const lp = lazyPlan(await readPage(root, fs.promises.readFile, path));
    const byId = Object.fromEntries(lp.chunks.map((c) => [c.id, c]));
    const reach = (id, s = new Set()) => { if (s.has(id)) return s; s.add(id); (byId[id]?.deps || []).forEach((d) => reach(d, s)); return s; };
    const chunkOf = {};
    for (const c of lp.chunks) for (const f of c.files) chunkOf[/\.js$/.test(f) ? f : f + '.html'] = c.id;
    for (const p0 of changed) {
      const f = p0.split('/').pop();
      const ch = SOURCE.test(p0) ? chunkOf[f] : null;
      if (!ch) continue;
      const more = Object.entries(lp.rooms).filter(([g, cs]) => !plan.ui.has(g) && cs.some((c) => reach(c).has(ch))).map(([g]) => g);
      if (!more.length) continue;
      more.forEach((g) => plan.ui.add(g));
      plan.why.push(`${f}: its chunk (${ch}) is loaded by rooms ${more.join(',')}`);
    }
  } catch (e) {
    console.log(`(the chunk graph couldn't be read: ${e.message}; a changed page file runs only its own games' rooms)`);
  }
}
if (plan.all) plan.rules = true;

console.log(`changes since ${BASE_REF} (${base.slice(0, 7)}): ${changed.length} files`);
plan.why.forEach((w) => console.log('  ' + w));
const uiParts = plan.all ? ['screens', 'rooms', 'fixes', 'program', 'mission', 'site'] : [plan.screens && 'screens', plan.ui.size && 'rooms', plan.fixes && 'fixes', plan.program && 'program', plan.mission && 'mission', plan.site && 'site'].filter(Boolean);
const steps = [];
if (plan.check) steps.push({ label: 'npm run check', cwd: 'tools', cmd: ['npm', 'run', 'check'] });
if (plan.rules) steps.push({ label: 'npm run test:rules', cwd: 'rooms-worker', cmd: ['npm', 'run', 'test:rules'] });
if (plan.all || plan.robots.size) {
  const only = plan.all ? [] : ['--only=' + [...plan.robots].join(',')];
  steps.push({ label: 'robots ' + (plan.all ? '(all)' : [...plan.robots].join(',')), cwd: 'rooms-worker', cmd: [process.execPath, 'test/play-all.mjs', ROOMS, ...only], server: true });
}
if (uiParts.length) {
  const env = { ONLY: uiParts.join(',') };
  if (!plan.all && plan.ui.size) env.UI_GAMES = [...plan.ui].join(',');
  steps.push({ label: `screen test ${uiParts.join(',')}${env.UI_GAMES ? ' (' + env.UI_GAMES + ')' : ''}`, cwd: 'tools', cmd: [process.execPath, 'test-ui-parallel.mjs', ROOMS], env, server: true });
}
if (!steps.length) { console.log('nothing to test (notes and docs only)'); process.exit(0); }
console.log('\nplan:\n' + steps.map((s) => '  - ' + s.label).join('\n'));
if (DRY) process.exit(0);

if (steps.some((s) => s.server)) {
  try { const r = await fetch(ROOMS + '/health'); if (!r.ok) throw new Error(r.status); }
  catch (e) { console.error(`\nNo rooms server at ${ROOMS} (${e.message}). Start one: cd rooms-worker && npm run dev`); process.exit(1); }
}
const t0 = Date.now();
const outcome = [];
for (const s of steps) {
  console.log(`\n=== ${s.label} ===`);
  const t = Date.now();
  const r = spawnSync(s.cmd[0], s.cmd.slice(1), { cwd: path.join(root, s.cwd), stdio: 'inherit', shell: s.cmd[0] === 'npm', env: Object.assign({}, process.env, s.env || {}) });
  outcome.push(`${r.status === 0 ? '✓' : '✗'} ${s.label} (${Math.round((Date.now() - t) / 1000)}s)`);
}
console.log('\n' + outcome.join('\n') + `\n${Math.round((Date.now() - t0) / 1000)}s in all`);
process.exit(outcome.some((o) => o.startsWith('✗')) ? 1 : 0);
