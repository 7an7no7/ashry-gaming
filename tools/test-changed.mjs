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
import { spawnSync, execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

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
  /^rooms-worker\/wrangler/, /^RoomGames\.js$/, /^GameIds\.js$/, /^DisabledGames\.js$/,
  /^Controller\.html$/, /^Style\.html$/, /^Tailwind\.html$/, /^Logo\.html$/,
  /^JS_(Core|Room|RoomGames|RoomTv|RoomTurn|RoomChat|RoomAudience|RoomVoting|Motion|Utils|Catalog|Sounds|Three|ShareCard|Solo|Daily|TeamRelay)\.html$/,
  /^tools\/(build-preview|build-site|test-ui|test-ui-parallel|test-changed)\.mjs$/, /^tools\/package/,
  /^rooms-worker\/test\/play-all\.mjs$/,
];
const IGNORE = [/^notes\//, /\.md$/, /^\.claude\//, /^docs\//, /^\.github\//];
const CORE_GAMES = ['imposter', 'justone', 'whoami', 'codenames', 'fibbage', 'wouldyou', 'mostlikely', 'drawguess', 'fakeartist',
  'wavelength', 'trivia', 'buzzer', 'stop', 'chameleon', 'spyfall', 'bomb', 'twotruths', 'emoji', 'proverbs', 'fiveseconds',
  'telephone', 'monkey', 'herd', 'mind', 'timeline'];
const RACE_GAMES = ['strands', 'wordwheel', 'connections', 'pinpoint', 'queens', 'tango', 'nonogram', 'mines', 'streak', 'sudoku'];
const MAP = [
  // The party games the core segment plays in its one room (and their word lists).
  { files: /^(SpyWords|CodenamesWords|PartyContent|TriviaQuestions|ChameleonWords|SpyfallPlaces|BombPrompts|EmojiRiddles|Proverbs|MonkeyWords|StopWords|TimelineEvents)\.js$/, robots: ['core', 'autonext'], ui: CORE_GAMES, screens: true },
  { files: /^JS_Room(Imposter|Codenames|Buzzer|Stop|Chameleon|Spyfall|Bomb|Draw|TwoTruths|Quiz|FiveSeconds|Telephone|Monkey|FakeArtist|Wavelength|Trivia|Herd|Mind|Timeline)\.html$/, robots: ['core', 'autonext'], ui: CORE_GAMES },
  // «التالي لوحده»: the next round by itself in the vote and quiz games.
  { files: /^JS_RoomAutoNext\.html$/, robots: ['autonext'], ui: ['trivia', 'wouldyou', 'mostlikely', 'fibbage', 'herd', 'twotruths', 'wavelength'] },
  // Error reports from players' phones (/err): the admin script that reads them.
  { files: /^tools\/errors\.mjs$/, robots: ['err'] },
  // «اعمل مسابقتك» and «كلماتنا»: the packs, their editor, and the rooms that deal them.
  { files: /^(Packs\.js|JS_PackStore\.html|JS_QuizMaker\.html|rooms-worker\/src\/packs\.js)$/, robots: ['quiz', 'core', 'crewlink'], ui: ['trivia', 'buzzer', 'imposter', 'chameleon', 'drawguess', 'whoami'], screens: true },
  { files: /^JS_(Imposter|Chameleon|Spyfall|Bomb|Monkey|Stop|StopBus|WhoAmI|Charades|DescribeIt|TimesUp|NewGames|Emoji|Proverbs|FiveSeconds|TriviaBoard|TriviaBoardBank|Director|HeadsUp|Chooser)\.html$/, screens: true, ui: CORE_GAMES },
  { files: /^JS_RoomMafia\.html$/, robots: ['mafia'], ui: ['mafia'] },
  { files: /^(SkrewCards\.js|JS_RoomScrew\.html|JS_Screw\.html)$/, robots: ['screw'], ui: ['screw'], screens: true },
  { files: /^(UnoCards\.js|RoomUno\.js|JS_RoomUno\.html)$/, robots: ['uno'], ui: ['uno'] },
  { files: /^(DominoTiles\.js|RoomDomino\.js|JS_RoomDomino\.html|JS_Domino\.html)$/, robots: ['domino'], ui: ['domino'], screens: true },
  { files: /^(RoomDuels\.js)$/, robots: ['connect4', 'dots', 'duels', 'guesswho', 'battleship', 'chess'], ui: ['connect4', 'dots', 'xo', 'guesswho', 'battleship', 'chess'] },
  { files: /^(Connect4\.js|DotsBoxes\.js|TicTacToe\.js|JS_RoomConnect4\.html|JS_RoomDots\.html|JS_RoomXO\.html|JS_Connect4\.html|JS_Dots\.html|JS_XO\.html)$/, robots: ['connect4', 'dots', 'duels'], ui: ['connect4', 'dots', 'xo'], screens: true },
  { files: /^(RoomTournament\.js|JS_RoomTournament\.html|JS_Tournament\.html)$/, robots: ['duels'], ui: ['connect4', 'xo'], screens: true },
  { files: /^Dice\.js$/, robots: ['ludo', 'snakes', 'bank'], ui: ['ludo', 'snakes', 'bank'], screens: true },
  { files: /^(Ludo\.js|RoomLudo\.js|JS_Ludo\.html|JS_RoomLudo\.html)$/, robots: ['ludo'], ui: ['ludo'], screens: true },
  { files: /^(Snakes\.js|RoomSnakes\.js|JS_Snakes\.html|JS_RoomSnakes\.html)$/, robots: ['snakes'], ui: ['snakes'], screens: true },
  { files: /^(BankAlhaz\.js|RoomBank\.js|JS_Bank\.html|JS_RoomBank\.html)$/, robots: ['bank'], ui: ['bank'], screens: true },
  { files: /^GuessWho\.js$/, robots: ['guesswho', 'witness', 'duels'], ui: ['guesswho', 'witness'] },
  { files: /^(RoomGuessWho\.js|JS_GuessWho\.html)$/, robots: ['guesswho', 'duels'], ui: ['guesswho'] },
  { files: /^(Hangman\.js|RoomHangman\.js|JS_Hangman\.html)$/, robots: ['hangman'], ui: ['hangman'], screens: true },
  { files: /^(Battleship\.js|RoomBattleship\.js|JS_Battleship\.html)$/, robots: ['battleship', 'duels'], ui: ['battleship'], screens: true },
  { files: /^(Chess\.js|RoomChess\.js)$/, robots: ['chess', 'teamchess', 'hq', 'bughouse', 'duels'], ui: ['chess', 'votechess', 'handbrain', 'bughouse'], screens: true },
  { files: /^JS_(Chess|ChessOpenings|ChessPosition|ChessPuzzles|ChessReview|RoomChess)\.html$/, robots: [], ui: ['chess', 'votechess', 'handbrain', 'bughouse'], screens: true },
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
  { files: /^(RoomChairs\.js|JS_RoomChairs\.html)$/, robots: ['chairs'], ui: ['chairs'] },
  { files: /^(RoomBumper\.js|JS_RoomBumper\.html)$/, robots: ['bumper'], ui: ['bumper'] },
  { files: /^(Wire\.js|RoomWire\.js|JS_RoomWire\.html)$/, robots: ['wire'], ui: ['wire'] },
  { files: /^(Witness\.js|RoomWitness\.js|JS_RoomWitness\.html)$/, robots: ['witness'], ui: ['witness'] },
  { files: /^(RoomExact\.js|JS_RoomExact\.html)$/, robots: ['exact'], ui: ['exact'] },
  // «الشلة»: the crew's rules and page (a room's night reaches its crew: the robots' crew segment; the page: screens and fixes).
  { files: /^(Crew\.js|JS_Crew\.html|JS_CrewCore\.html)$/, robots: ['crew', 'crewlink'], screens: true, fixes: true },
  { files: /^(Dark\.js|RoomDark\.js|JS_RoomDark\.html)$/, robots: ['darkroom'], ui: ['darkroom'] },
  { files: /^(RoomBox\.js|JS_RoomBox\.html)$/, robots: ['box'], ui: ['box'] },
  // برنامج السهرة: its robots, and the screen test's own part (the builder, the table, the finale).
  { files: /^(RoomProgram\.js|JS_RoomProgram\.html)$/, robots: ['program', 'crewlink'], program: true },
  // المهمة السرية: a switch beside every game - its robots (and the night it banks), the lobby and the TV's lobby.
  { files: /^(Missions\.js|RoomMission\.js|JS_RoomMission\.html)$/, robots: ['mission', 'crewlink'], screens: true, mission: true },
  // One sets, everyone solves, and the puzzle race: the same engine.
  { files: /^(SolveGames\.js|RoomSolve\.js|JS_RoomSolve\.html|WordleWords\.js|Countries\.js|JS_Wordle\.html|JS_GuessNumber\.html|JS_Flags\.html)$/, robots: ['solve', 'race'], ui: ['wordle', 'guessnum', 'flags', 'emoji'], screens: true },
  { files: /^(RoomRace\.js|JS_RoomRace\.html|SoloShared\.js|Sudoku\.js|Queens\.js|Tango\.js|Nonogram\.js|Mines\.js|Strands\.js|WordWheel\.js|Pinpoint\.js|QuizStreak\.js|ConnectionsWords\.js)$/, robots: ['race'], ui: RACE_GAMES, screens: true },
  { files: /^JS_(Sudoku|Queens|Tango|Nonogram|Mines|WordSearch|WordWheel|Pinpoint|QuizStreak|Connections|2048|Memory)\.html$/, ui: RACE_GAMES, screens: true },
  // The page's own screens and the offline copy.
  { files: /^JS_[A-Za-z0-9]+\.html$/, screens: true },
  { files: /^(site-worker\/|tools\/site\.config\.json$|tools\/(make-icons|make-og)\.mjs$)/, site: true },
  { files: /^tools\/(validate-content\.js|check-i18n\.js|check-css-vars\.js)$/ },
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

const plan = { check: false, rules: false, all: false, robots: new Set(), ui: new Set(), screens: false, fixes: false, program: false, mission: false, site: false, why: [] };
// What test:rules has to run for: a file the server bundles, or the rules tests and leak check themselves.
const BUNDLED = /^(rooms-worker\/src\/|rooms-worker\/test\/(rules|leaks)\.mjs$|[A-Z][A-Za-z0-9]*\.js$)/;
for (const f of changed) {
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
