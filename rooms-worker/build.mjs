/**
 * Builds generated/rules.js from the shared files in app/, rooms/, content/ and games/, so the
 * game rules and word lists keep one copy: the room server bundles them from
 * here, and tools/validate-content.js checks the very same files.
 *
 * Wrangler runs this before every `wrangler dev` and `wrangler deploy` ([build]
 * in wrangler.toml). The output sits outside src/ on purpose: wrangler dev
 * re-runs the build when src/ changes, and writing into it would loop.
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { rulesFingerprint } from './fingerprint.mjs';
import srcMod from '../tools/sources.cjs';

const { srcPath } = srcMod;

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, '..');
const FILES = ['Common.js', 'RoomShared.js', 'Games.js', 'DisabledGames.js', 'Dice.js', 'Packs.js', 'MoveData.js', 'Faces.js', 'SpyWords.js', 'CodenamesWords.js', 'PartyContent.js', 'TriviaQuestions.js', 'ChameleonWords.js', 'SpyfallPlaces.js', 'BombPrompts.js', 'EmojiRiddles.js', 'Proverbs.js', 'MonkeyWords.js', 'StopWords.js', 'SkrewCards.js', 'TimelineEvents.js', 'UnoCards.js', 'DominoTiles.js', 'Connect4.js', 'DotsBoxes.js', 'TicTacToe.js', 'Battleship.js', 'Chess.js', 'Chess4.js', 'Ludo.js', 'Snakes.js', 'BankAlhaz.js', 'GuessWho.js', 'Witness.js', 'Dark.js', 'Hangman.js', 'MiniGolf.js', 'PlayingCards.js', 'Skull.js', 'Estimation.js', 'Wire.js', 'Vault.js', 'Hear.js', 'Bowling.js', 'WordleWords.js', 'Countries.js', 'SolveGames.js', 'SoloShared.js', 'ConnectionsWords.js', 'Sudoku.js', 'Queens.js', 'Tango.js', 'Nonogram.js', 'Mines.js', 'Strands.js', 'WordWheel.js', 'Boggle.js', 'Pinpoint.js', 'QuizStreak.js', 'Crew.js', 'Songs.js', 'Missions.js', 'Laser.js', 'Hesba.js', 'RoomGames.js', 'RoomStop.js', 'RoomChameleon.js', 'RoomSpyfall.js', 'RoomBomb.js', 'RoomBuzzer.js', 'RoomImposter.js', 'RoomJustOne.js', 'RoomWhoAmI.js', 'RoomCodenames.js', 'RoomWouldYou.js', 'RoomMostLikely.js', 'RoomFibbage.js', 'RoomDraw.js', 'RoomFakeArtist.js', 'RoomTrivia.js', 'RoomTwoTruths.js', 'RoomQuiz.js', 'RoomFiveSeconds.js', 'RoomTelephone.js', 'RoomMonkey.js', 'RoomHerd.js', 'RoomMind.js', 'RoomTimeline.js', 'RoomMafia.js', 'RoomScrew.js', 'RoomUno.js', 'RoomDomino.js', 'Duels.js', 'RoomDuels.js', 'RoomBattleship.js', 'RoomChess.js', 'RoomChess4.js', 'RoomVoteChess.js', 'RoomHandBrain.js', 'RoomBughouse.js', 'RoomLudo.js', 'RoomSnakes.js', 'RoomBank.js', 'RoomGuessWho.js', 'RoomHangman.js', 'RoomMiniGolf.js', 'RoomDoubt.js', 'RoomOldMaid.js', 'RoomSkull.js', 'RoomEstimation.js', 'RoomBowling.js', 'RoomTournament.js', 'RoomSolve.js', 'RoomRace.js', 'RoomChairs.js', 'RoomReaction.js', 'RoomBumper.js', 'RoomWire.js', 'RoomVault.js', 'RoomWitness.js', 'RoomExact.js', 'RoomDark.js', 'RoomBox.js', 'RoomHum.js', 'RoomHear.js', 'RoomProgram.js', 'RoomMission.js', 'RoomLaser.js', 'RoomHesba.js', 'RoomBoggle.js', 'RoomBlockway.js'];
const EXPORTS = ['RULES_HASH', 'ROOM_GAME_IDS', 'GAME_LIST', 'AUTONEXT_ROOM_GAMES', 'AUTONEXT_GAMES', 'applyRoomAction', 'roomDeadline', 'roomTimeout', 'roomTimeoutDeals', 'withPromptMemory', 'normaliseClue', 'guessVerdict', 'bankNightPoints', 'foldStopAnswer', 'stopAnswerFits', 'stopWordKnown', 'stopDictionary', 'stopLettersFor', 'roomEvent', 'chatFor', 'roomPlayerLeft', 'sameRoomName', 'cleanRoomName', 'roomSeatAway', 'roomClaimsPrune', 'roomClaimsView', 'roomClaimAsk', 'roomClaimAnswer', 'roomClaimTake', 'SEAT_CLAIM_AWAY_MS', 'SEAT_CLAIM_MS', 'roomForcedMove', 'ROOM_FORCED_DELAY_MS', 'tourBracket', 'bumperRelaying', 'bumperJoined', 'darkRelaying', 'DISABLED_GAMES', 'roomGameIsOff', 'APP_GAME_IDS', 'APP_REPORT_IDS', 'CREW_MAX_MEMBERS', 'CREW_MAX_NIGHTS', 'CREW_MAX_PACKS', 'CREW_NAME_MAX', 'CREW_MEMBER_NAME_MAX', 'CREW_CODE_RE', 'crewNewCode', 'crewCleanCode', 'crewFold', 'crewCleanName', 'crewCleanNight', 'crewView', 'crewFreezeChamps', 'crewNightInput', 'crewTable', 'crewTitles', 'crewRecords', 'crewMonthOf', 'crewDateOf', 'crewNightSummary', 'crewAddPackTo', 'crewRemovePackFrom', 'crewKeysMigrate', 'crewKeyRec', 'crewKeyIsManager', 'crewIssueKey', 'crewSetManager', 'crewPairMake', 'crewPairUse', 'CREW_KEYS_PER_MEMBER', 'CREW_PAIR_TRIES', 'PACK_TTL_MS', 'PACK_ALPHABET', 'PACK_CODE_LEN', 'PACK_CODE_RE', 'packClean', 'packCode', 'packHideAnswers', 'packAnswerOf', 'packCleanQuiz', 'MOVE_TTL_MS', 'MOVE_MAX_BYTES', 'MOVE_KEYS', 'moveExpired', 'moveMerge', 'moveFit', 'moveCollect', 'moveBestBetter', 'roomHostChanged', 'nightProgramFinished', 'programPlaces', 'PROGRAM_PLACE_POINTS', 'HUM_SONGS', 'humSongIndexOf', 'missionView', 'missionJoined', 'missionPlayerLeft', 'MISSION_SWAP_MS', 'MISSION_CATCH_WAIT_MS', 'MISSION_MIN_PEOPLE', 'laserTrace', 'laserFit', 'laserInside', 'laserTiles', 'laserTileAt', 'LASER_MAPS', 'LASER_BODY', 'LASER_PILLAR_R', 'faceClean', 'faceRandom', 'FACE_PARTS', 'FACE_LEN', 'boggleSolve', 'boggleMake', 'boggleTraceWord', 'boggleResolve', 'boggleKey', 'boggleListed', 'BOGGLE_SIZES'];

const sources = await Promise.all(FILES.map(async (name) =>
  `// ---- ${name} ----\n` + await readFile(srcPath(name), 'utf8')));

const PRELUDE = `// GENERATED by rooms-worker/build.mjs from ${FILES.join(', ')}.
// Do not edit: change those files and the next build refreshes this one.

// Code.js used to serve the spy words to the rules.
const getSpyData = () => SPY_WORDS;

// RoomGames.js remembers dealt prompts through Apps Script's Script Properties.
// Here that memory is the PromptMemory Durable Object: a room loads it before
// an action that deals, runs the rules against it, then saves what changed.
// Without it loaded, the rules fall back to the room's own memory.
let promptMemory = null;
const PropertiesService = {
  getScriptProperties() {
    const memory = promptMemory;
    if (!memory) throw new Error('prompt memory not loaded');
    return {
      getProperty: (key) => Object.prototype.hasOwnProperty.call(memory.values, key) ? memory.values[key] : null,
      setProperty: (key, value) => { memory.values[key] = String(value); memory.changed[key] = String(value); }
    };
  }
};

/** Runs \`run\` with \`memory\` ({ values, changed }) as the prompt history. */
const withPromptMemory = (memory, run) => {
  promptMemory = memory;
  try { return run(); } finally { promptMemory = null; }
};
`;

// What this bundle was built from (fingerprint.mjs): /health reports it and
// tools/check-live.mjs compares it with the folder's.
const RULES_HASH = await rulesFingerprint(FILES);
// The dealer itself, for the test of dealing from one category (trivia's lobby).
EXPORTS.push('nextPrompts');
const out = PRELUDE + `\nconst RULES_HASH = ${JSON.stringify(RULES_HASH)};\n\n` + sources.join('\n\n') + `\n\nexport { ${EXPORTS.join(', ')} };\n`;
await mkdir(path.join(here, 'generated'), { recursive: true });
await writeFile(path.join(here, 'generated', 'rules.js'), out, 'utf8');
console.log(`generated/rules.js built from ${FILES.join(', ')}`);
