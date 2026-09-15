/**
 * Checks the trivia and Codenames rules straight against the bundled RoomGames.js, where the
 * right answer can be read: the chosen number of questions, and the points
 * going to the fastest right answers.
 *
 *   npm run test:rules      (builds generated/rules.js first)
 */
import { applyRoomAction, roomDeadline, roomTimeout } from '../generated/rules.js';

let failed = 0;
const check = (ok, label) => {
  console.log((ok ? '  ✓ ' : '  ✗ ') + label);
  if (!ok) failed++;
};

const realNow = Date.now;
let clock = realNow();
Date.now = () => clock;

const newRoom = (ids) => ({
  code: 'TEST', version: 1, game: null, phase: 'lobby', hostId: ids[0],
  players: ids.map((id) => ({ id, name: id.toUpperCase() })), shared: {}, secrets: {}
});
const answerAll = (room, picks) => {
  for (const [pid, choice] of picks) { clock += 100; applyRoomAction(room, pid, 'answer', { choice }); }
};

const room = newRoom(['a', 'b', 'c', 'd']);
applyRoomAction(room, 'a', 'chooseGame', { game: 'trivia' });
applyRoomAction(room, 'a', 'start', { lang: 'ar', count: 5 });
check(room._deck.length === 5 && room.shared.totalQuestions === 5, 'the host picks how many questions');

let right = room._currentQ.answer;
let wrong = (right + 1) % 4;
answerAll(room, [['a', right], ['b', right], ['c', right], ['d', wrong]]);
check(room.shared.phase === 'results', 'the question closes once everyone has answered');
check(room.shared.gained.a === 15 && room.shared.gained.b === 14 && room.shared.gained.c === 13,
      'faster right answers score more: 15, 14, 13');
check(!room.shared.gained.d && !(room.shared.scores || {}).d, 'a wrong answer scores nothing');
check(JSON.stringify(room.shared.order) === '["a","b","c"]', 'the order of the right answers is published');

applyRoomAction(room, 'a', 'nextQuestion', {});
right = room._currentQ.answer;
for (const pid of ['d', 'c', 'b', 'a']) applyRoomAction(room, pid, 'answer', { choice: right });   // same millisecond
check(room.shared.gained.d === 15 && room.shared.gained.a === 12, 'in the same millisecond, whoever answered first ranks first');

for (let i = 2; i < 5; i++) {
  applyRoomAction(room, 'a', 'nextQuestion', {});
  applyRoomAction(room, 'a', 'closeQuestion', {});
}
applyRoomAction(room, 'a', 'nextQuestion', {});
check(room.shared.phase === 'gameover', 'the game ends after the chosen 5 questions');
applyRoomAction(room, 'a', 'playAgain', { lang: 'ar' });
check(room._deck.length === 5, 'play again keeps the chosen number of questions');

const big = newRoom(['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7']);
applyRoomAction(big, 'p1', 'chooseGame', { game: 'trivia' });
applyRoomAction(big, 'p1', 'start', { lang: 'en', count: 7 });
check(big._deck.length === 10, 'a count that is not on the list falls back to 10');
right = big._currentQ.answer;
answerAll(big, big.players.map((p) => [p.id, right]));
check(['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7'].map((id) => big.shared.gained[id]).join(',') === '15,14,13,12,11,10,10',
      'the bonus runs out after the fifth: 15, 14, 13, 12, 11, 10, 10');

/* --- codenames: the options and the server's own clock -------------------- */
const threw = (fn) => { try { fn(); return false; } catch (e) { return true; } };
const cn = newRoom(['r1', 'r2', 'b1', 'b2']);
applyRoomAction(cn, 'r1', 'chooseGame', { game: 'codenames' });
[['r1', 'red', 'spymaster'], ['r2', 'red', 'operative'], ['b1', 'blue', 'spymaster'], ['b2', 'blue', 'operative']]
  .forEach(([id, team, role]) => applyRoomAction(cn, id, 'setTeam', { team, role }));
check(threw(() => applyRoomAction(cn, 'r1', 'setOptions', { timer: 45 })), 'codenames: only the listed turn times are accepted');
applyRoomAction(cn, 'r1', 'setOptions', { timer: 60 });
applyRoomAction(cn, 'r1', 'start', { lang: 'en' });
const masterOf = (team) => (team === 'red' ? 'r1' : 'b1');
const operativeOf = (team) => (team === 'red' ? 'r2' : 'b2');
const firstTurn = cn.shared.turn;
check(cn.shared.endsAt === clock + 60000, 'codenames: the spymaster gets the 60 seconds the host chose');
check(roomDeadline(cn) === cn.shared.endsAt + 1500, 'codenames: the server looks again once the clue time is up');
clock = cn.shared.endsAt + 2000;
check(roomTimeout(cn, clock) === true && cn.shared.turn !== firstTurn && cn.shared.clue === null,
      'codenames: no clue in time passes the turn');
const second = cn.shared.turn;
check(threw(() => applyRoomAction(cn, masterOf(second), 'giveClue', { word: cn.shared.board[3].word.toUpperCase(), count: 1 })),
      'codenames: a word on the board is not a clue, in any case');
applyRoomAction(cn, masterOf(second), 'giveClue', { word: 'zzqq', count: 2 });
check(cn.shared.guessesLeft === 3 && cn.shared.endsAt === clock + 60000,
      'codenames: a clue of 2 gives 3 guesses and starts the guessing clock');
check(threw(() => applyRoomAction(cn, masterOf(second), 'giveClue', { word: 'again', count: 1 })), 'codenames: one clue a turn');
applyRoomAction(cn, operativeOf(second), 'guess', { index: cn._key.indexOf('neutral') });
check(cn.shared.turn === firstTurn && cn.shared.clue === null, 'codenames: a neutral card ends the turn');
applyRoomAction(cn, masterOf(firstTurn), 'giveClue', { word: 'wide', count: 0 });
check(cn.shared.guessesLeft === -1, 'codenames: a clue of 0 has no guess limit');

Date.now = realNow;
console.log(failed ? `\n${failed} failed` : '\nall room rules pass');
process.exit(failed ? 1 : 0);
