/**
 * Checks the trivia and Codenames rules straight against the bundled RoomGames.js, where the
 * right answer can be read: the chosen number of questions, and the points
 * going to the fastest right answers.
 *
 *   npm run test:rules      (builds generated/rules.js first)
 */
import { readFileSync } from 'node:fs';
import { applyRoomAction, roomDeadline, roomTimeout, normaliseClue, guessVerdict, bankNightPoints, stopAnswerFits, stopWordKnown, roomPlayerLeft, roomForcedMove, ROOM_FORCED_DELAY_MS, chatFor } from '../generated/rules.js';

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
// a was first on question 1, d on question 2, and nobody after that: a tie, so
// no title. A title half the table shares is not a title.
check(room.shared.fastest === null, 'trivia: nobody is the fastest when two are level');
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

/* --- the title at the end: who got there first, over the whole game -------- */
// s.order is overwritten by every question, so the tally has to survive to
// gameover on the server.
// A five-question game (5 is one of TRIVIA_COUNTS), `firsts` naming who got
// there first each time - null for a question nobody answered. `before` runs
// just before the last nextQuestion, which is what turns the game over.
const playTrivia = (ids, firsts, before) => {
  const r = newRoom(ids);
  applyRoomAction(r, ids[0], 'chooseGame', { game: 'trivia' });
  applyRoomAction(r, ids[0], 'start', { lang: 'ar', count: 5 });
  for (let i = 0; i < 5; i++) {
    if (i) applyRoomAction(r, ids[0], 'nextQuestion', {});
    const who = firsts[i];
    if (who) { clock += 100; applyRoomAction(r, who, 'answer', { choice: r._currentQ.answer }); }
    applyRoomAction(r, ids[0], 'closeQuestion', {});
  }
  if (before) before(r);
  applyRoomAction(r, ids[0], 'nextQuestion', {});
  return r;
};

const fast = playTrivia(['a', 'b', 'c'], ['a', 'a', 'a', 'b', null]);
check(fast.shared.phase === 'gameover', 'trivia: five questions played out');
check(!!fast.shared.fastest && fast.shared.fastest.id === 'a' && fast.shared.fastest.name === 'A' &&
      fast.shared.fastest.n === 3, 'trivia: the fastest over the whole game is named, with the count');

const none = playTrivia(['a', 'b', 'c'], []);
check(none.shared.fastest === null, 'trivia: no title when nobody answered right');

const tied = playTrivia(['a', 'b', 'c'], ['a', 'b']);
check(tied.shared.fastest === null, 'trivia: a tie gives nobody the title');

const left = playTrivia(['a', 'b', 'c'], ['b', 'b', 'a'], (r) => {
  r.players = r.players.filter((p) => p.id !== 'b');
});
check(!!left.shared.fastest && left.shared.fastest.id === 'a' && left.shared.fastest.n === 1,
      'trivia: someone who has left the room takes no title');

const again = playTrivia(['a', 'b', 'c'], ['a', 'a', 'a']);
applyRoomAction(again, 'a', 'playAgain', { lang: 'ar' });
for (let i = 0; i < 5; i++) {
  if (i) applyRoomAction(again, 'a', 'nextQuestion', {});
  applyRoomAction(again, 'a', 'closeQuestion', {});
}
applyRoomAction(again, 'a', 'nextQuestion', {});
check(again.shared.fastest === null, 'trivia: play again starts the tally over');

const solo = playTrivia(['a'], ['a', 'a']);
check(solo.shared.fastest === null, 'trivia: one player alone takes no title');

/* --- صدق ولا كذب: who fooled the most ------------------------------------- */
const tt = newRoom(['a', 'b', 'c']);
applyRoomAction(tt, 'a', 'chooseGame', { game: 'twotruths' });
applyRoomAction(tt, 'a', 'start', {});
['a', 'b', 'c'].forEach((id) => applyRoomAction(tt, id, 'submit', { statements: ['t1' + id, 't2' + id, 'lie' + id], lie: 2 }));
const ttVote = (voters, right) => {
  const subject = tt.shared.subjectId;
  const lie = 'i' + tt._tt[subject].lie;
  const wrong = 'i' + ((tt._tt[subject].lie + 1) % 3);
  voters.forEach((pid, i) => applyRoomAction(tt, pid, 'vote', { option: i < right ? lie : wrong }));
};
const others = () => tt.shared.roster.filter((id) => id !== tt.shared.subjectId);
ttVote(others(), 0);                     // the first storyteller fools both
check(tt.shared.phase === 'result' && (tt.shared.fooled || []).length === 2, 'صدق ولا كذب: both were fooled');
applyRoomAction(tt, 'a', 'next', {});
ttVote(others(), 2);                     // the second is caught by both
applyRoomAction(tt, 'a', 'next', {});
ttVote(others(), 1);                     // the third fools one
applyRoomAction(tt, 'a', 'next', {});
check(tt.shared.phase === 'gameover', 'صدق ولا كذب: every storyteller has had a turn');
check(tt.shared.caught === null && tt.shared.fooled === null, 'صدق ولا كذب: the round data is cleared at the end, as before');
check(!!tt.shared.bestLiar && tt.shared.bestLiar.n === 2, 'صدق ولا كذب: the one who fooled the most takes the title');
check(tt.shared.bestLiar.id === tt.shared.order[0], 'صدق ولا كذب: and it is the right player');

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

/* أتوبيس كومبليت: spelling is folded before answers are compared. */
const stopRound = (letter, sheets) => {
  const r = newRoom(['a', 'b', 'c']);
  applyRoomAction(r, 'a', 'chooseGame', { game: 'stop' });
  applyRoomAction(r, 'a', 'start', { lang: /^[a-z]$/i.test(letter) ? 'en' : 'ar', cats: ['name', 'animal', 'country'], timer: 0, rounds: 1 });
  r.shared.letter = letter;
  for (const pid of ['a', 'b', 'c']) applyRoomAction(r, pid, 'submit', { answers: sheets[pid] });
  const pts = (pid) => ['name', 'animal', 'country'].map((c) => r.shared.results[pid][c].pts).join(',');
  return { pts, ok: (pid, c) => r.shared.results[pid][c].ok };
};
const alef = stopRound('ا', {
  a: { name: 'أحمد', animal: 'أسد', country: 'ألمانيا' },
  b: { name: 'احمد', animal: 'الأسد', country: 'المانيا' },
  c: { name: 'إيهاب', animal: ' اسد ', country: 'إيطاليا' }
});
check(alef.pts('a') === '5,5,5' && alef.pts('b') === '5,5,5' && alef.pts('c') === '10,5,10',
      'stop: أحمد/احمد, أسد/الأسد/اسد and ألمانيا/المانيا are the same answer');
check(alef.ok('a', 'country') && alef.ok('c', 'name'), 'stop: ألمانيا and إيهاب count as ا words');
const seen = stopRound('س', {
  a: { name: 'سامي', animal: 'السمك', country: 'سوريا' },
  b: { name: 'سَامِي', animal: 'ســمك', country: 'الأسد' },
  c: { name: 'سلمى', animal: 'سمكة', country: 'سلوفاكيا' }
});
check(seen.pts('a') === '5,5,10' && seen.pts('b') === '5,5,0' && seen.pts('c') === '10,10,10',
      'stop: diacritics and the tatweel are ignored, السمك is a س word, الأسد is not');
const ess = stopRound('S', {
  a: { name: 'Sam', animal: 'the seal', country: 'Spain' },
  b: { name: 'SAM', animal: 'Seal', country: 'the Sudan' },
  c: { name: 'Sara', animal: 'Snake', country: 'Sudan' }
});
check(ess.pts('a') === '5,5,10' && ess.pts('b') === '5,5,5' && ess.pts('c') === '10,10,5',
      'stop: case and "the" are ignored in English');

/* Stop: وقف needs a full sheet, and the dictionary marks what it doesn't know. */
check(stopAnswerFits('الأسد', 'ar', 'ا') && stopAnswerFits('سمك', 'ar', 'س') && !stopAnswerFits('س', 'ar', 'س') && !stopAnswerFits('قطة', 'ar', 'س'),
      'stop: a box is filled by a word of two letters or more on the letter');
check(stopWordKnown('ar', 'animal', 'الأسد') && stopWordKnown('ar', 'country', 'امريكا') && stopWordKnown('en', 'animal', 'Lions') && stopWordKnown('ar', 'name', 'محمود'),
      'stop: the dictionary knows أسد with its article, امريكا without its hamza, a plural and a name');
check(stopWordKnown('ar', 'name', 'مححمود') && !stopWordKnown('ar', 'animal', 'سبتزخ') && !stopWordKnown('en', 'city', 'Qwertyville'),
      'stop: one wrong letter is forgiven in a long word, a made-up word is not known');
{
  const r = newRoom(['a', 'b', 'c']);
  applyRoomAction(r, 'a', 'chooseGame', { game: 'stop' });
  applyRoomAction(r, 'a', 'start', { lang: 'ar', cats: ['name', 'animal'], timer: 0, rounds: 1 });
  r.shared.letter = 'ب';
  let refused = false;
  try { applyRoomAction(r, 'a', 'submit', { answers: { name: 'باسم', animal: '' }, stop: true }); } catch (e) { refused = true; }
  check(refused && r.shared.phase === 'writing' && r.shared.submitted.length === 0, 'stop: وقف with an empty box is refused');
  applyRoomAction(r, 'a', 'submit', { answers: { name: 'باسم', animal: 'بزززظ' }, stop: true });
  applyRoomAction(r, 'b', 'submit', { answers: { name: 'بسمة', animal: 'بزززظ' } });
  applyRoomAction(r, 'c', 'submit', { answers: { name: 'بلبلخ', animal: 'بطة' } });
  const res = r.shared.results;
  check(res.a.animal.word === 'shared' && res.a.animal.pts === 5 && res.b.animal.pts === 5,
        'stop: a word the dictionary lacks but two players wrote counts as shared');
  check(res.c.name.word === 'unknown' && res.c.name.pts === 0 && res.c.animal.word === 'known' && res.c.animal.pts === 10,
        'stop: a word nobody else wrote and the dictionary lacks scores 0 for the host to decide');

  // Lenient vs strict on the same answers, adjust to 0, and legacy/older phone defaults
  check(r.shared.lenient === false, 'stop: an older phone sending no lenient gets strict');
  const rLenient = newRoom(['a', 'b', 'c']);
  applyRoomAction(rLenient, 'a', 'chooseGame', { game: 'stop' });
  applyRoomAction(rLenient, 'a', 'start', { lang: 'ar', cats: ['name', 'animal'], timer: 0, rounds: 2, lenient: true });
  rLenient.shared.letter = 'ب';
  applyRoomAction(rLenient, 'a', 'submit', { answers: { name: 'باسم', animal: 'بزززظ' }, stop: true });
  applyRoomAction(rLenient, 'b', 'submit', { answers: { name: 'بسمة', animal: 'بزززظ' } });
  applyRoomAction(rLenient, 'c', 'submit', { answers: { name: 'بلبلخ', animal: 'بطة' } });
  check(rLenient.shared.lenient === true, 'stop: lenient setting published to shared');
  const resL = rLenient.shared.results;
  check(resL.c.name.word === 'unknown' && resL.c.name.pts === 10 && resL.c.animal.word === 'known' && resL.c.animal.pts === 10,
        'stop lenient: unknown scores 10, known scores 10 on the same answers');
  check(resL.a.animal.word === 'shared' && resL.a.animal.pts === 5,
        'stop lenient: shared unchanged (5 pts)');
  check(rLenient.shared.roundTotals.c === 20, 'stop lenient: roundTotals reflects 10 for unknown');
  applyRoomAction(rLenient, 'a', 'adjust', { playerId: 'c', cat: 'name', pts: 0 });
  check(rLenient.shared.results.c.name.pts === 0 && rLenient.shared.results.c.name.manual === true,
        'stop lenient: host adjust to 0 on unknown sets pts to 0');
  check(rLenient.shared.roundTotals.c === 10, 'stop lenient: host adjust updates roundTotals');
  applyRoomAction(rLenient, 'a', 'nextRound', {});
  check(rLenient.shared.lenient === true && rLenient.shared.round === 2, 'stop: nextRound preserves lenient');

  // _stopTaps logging on adjust: 0 -> >0 on unknown or shared, not on known or tap down
  const rLog = newRoom(['a', 'b', 'c']);
  applyRoomAction(rLog, 'a', 'chooseGame', { game: 'stop' });
  applyRoomAction(rLog, 'a', 'start', { lang: 'ar', cats: ['name', 'animal'], timer: 0, rounds: 2 });
  rLog.shared.letter = 'ب';
  applyRoomAction(rLog, 'a', 'submit', { answers: { name: 'باسم', animal: 'بزززظ' }, stop: true });
  applyRoomAction(rLog, 'b', 'submit', { answers: { name: 'بسمة', animal: 'بزززظ' } });
  applyRoomAction(rLog, 'c', 'submit', { answers: { name: 'بلبلخ', animal: 'بطة' } });
  check(!rLog._stopTaps, 'stop log: no _stopTaps initially before host adjust');
  applyRoomAction(rLog, 'a', 'adjust', { playerId: 'c', cat: 'animal', pts: 5 });
  check(!rLog._stopTaps, 'stop log: tapping known cell down does not log');
  applyRoomAction(rLog, 'a', 'adjust', { playerId: 'c', cat: 'name', pts: 10 });
  check(Array.isArray(rLog._stopTaps) && rLog._stopTaps.length === 1, 'stop log: 0 -> 10 tap on unknown logs to _stopTaps');
  check(rLog._stopTaps[0].lang === 'ar' && rLog._stopTaps[0].cat === 'name' && rLog._stopTaps[0].word === 'بلبلخ',
        'stop log: logged entry has correct lang, cat, and word');
  applyRoomAction(rLog, 'a', 'adjust', { playerId: 'c', cat: 'name', pts: 0 });
  check(rLog._stopTaps.length === 1, 'stop log: tapping down 10 -> 0 does not log');
  applyRoomAction(rLog, 'a', 'adjust', { playerId: 'c', cat: 'name', pts: 5 });
  // The audit of 24 Sep 2026: one cell is one table's one decision, logged once
  // however often the host cycles it through 0.
  check(rLog._stopTaps.length === 1, 'stop log: the same unknown cell tapped up again is not logged twice');
  applyRoomAction(rLog, 'a', 'adjust', { playerId: 'a', cat: 'animal', pts: 0 });
  check(rLog._stopTaps.length === 1, 'stop log: shared cell 5 -> 0 does not log');
  applyRoomAction(rLog, 'a', 'adjust', { playerId: 'a', cat: 'animal', pts: 5 });
  check(rLog._stopTaps.length === 2 && rLog._stopTaps[1].word === 'بزززظ', 'stop log: shared cell 0 -> 5 logs');
}

/* One typed word against another, everywhere but Stop: spelling is folded away. */
const same = (a, b) => normaliseClue(a) === normaliseClue(b);
check(same('أسد', 'اسد') && same('الأسد!', 'اسد') && same(' الاسد ', 'أسد'), 'clues: أسد, اسد, الأسد and الاسد are one word');
check(same('ألعاب', 'العاب') && same('الألعاب', 'ألعاب') && same('إلهام', 'الهام'), 'clues: ألعاب, العاب and الألعاب are one word');
check(same('مكتبة', 'مكتبه') && same('مصطفى', 'مصطفي') && same('مَدْرَسَة', 'مدرسه') && same('ســمك', 'سمك'), 'clues: ة/ه, ى/ي, diacritics and the tatweel are ignored');
check(same('The Sea', 'sea') && same('Ice cream', 'icecream') && same('sea-horse', 'seahorse'), 'clues: case, "the", spaces and punctuation are ignored');
check(!same('سمك', 'سمكة') && !same('قطة', 'قط'), 'clues: different words stay different');

/* A typed guess is judged the way the table hears it (guessVerdict). */
const v = (guess, answer) => guessVerdict(guess, Array.isArray(answer) ? answer : [answer]);
check(v('طماطم', 'طماطماية') === 'right' && v('طماطماية', 'طماطم') === 'right' && v('حبة طماطم', 'طماطم') === 'right',
  'guess: طماطم, طماطماية and حبة طماطم are one answer');
check(v('تفاح', 'تفاحة') === 'right' && v('موز', 'عنقود موز') === 'right' && v('مهندس', 'مهندسين') === 'right' && v('مانجاية', 'مانجو') === 'right',
  'guess: a unit ending, a measure word and a plural do not make a guess wrong');
check(v('شاي', 'كوب شاي') === 'right' && v('pizza', 'Slice of pizza') === 'right' && v('cats', 'cat') === 'right' && v('cherry', 'Cherries') === 'right',
  'guess: measure words and English plurals are forgiven');
check(v('اخطبوت', 'أخطبوط') === 'right' && v('elephent', 'Elephant') === 'right' && v('كباب', 'كتاب') !== 'right', 'guess: one letter off in a word of five letters or more still counts, not in a short one');
check(v('اسم', 'أسد') !== 'right' && v('قط', 'قطة') === 'close' && v('سمكة قرش', 'سمكة') !== 'right', 'guess: a short word is not forgiven a letter, and a longer answer is not the short one');
check(v('طماطماااا', 'طماطم') === 'close' && v('إسعاف', 'عربية إسعاف') === 'right' && v('عربية', 'عربية إسعاف') === 'close' && v('قزح', 'قوس قزح') === 'close',
  'guess: a near miss and a missing word are close, not right');
check(v('ترابيزة', 'كرسي') === '' && v('', 'كرسي') === '' && v('كرسي', ['ترابيزة', 'كرسي']) === 'right', 'guess: a different word is wrong, an alternative answer counts');
{
  // Another word on the game's own list is a different thing, not a spelling of the answer (audit, 22 Sep 2026).
  const DW = new Function(readFileSync(new URL('../../PartyContent.js', import.meta.url), 'utf8') + '\nreturn DRAW_WORDS;')();
  const vb = (guess, answer, lang) => guessVerdict(guess, [answer], DW[lang]);
  check(vb('House', 'Horse', 'en') === 'close' && vb('Monkey', 'Donkey', 'en') === 'close' && vb('Carrot', 'Parrot', 'en') === 'close',
    'guess: House for Horse, Monkey for Donkey, Carrot for Parrot are close, not right');
  check(vb('شمس', 'شمسية', 'ar') === 'close' && vb('ناموسة', 'جاموسة', 'ar') === 'close' && vb('ملك', 'ملكة', 'ar') === 'close',
    'guess: شمس for شمسية, ناموسة for جاموسة, ملك for ملكة are close, not right');
  check(vb('طماطماية', 'طماطم', 'ar') === 'right' && vb('الطماطم', 'طماطم', 'ar') === 'right' && vb('Horse', 'Horse', 'en') === 'right',
    'guess: the answer itself, and its spellings, are still right with the list');
  check(v('زيت', 'زيتون') !== 'right', 'guess: زيت is not زيتون (ون is only a plural on a longer word)');
}

/* --- someone leaves mid-round: what room.js does, then the game's hook ------ */
const leave = (r, id, hook = true) => {
  const p = r.players.find((x) => x.id === id);
  r.players = r.players.filter((x) => x.id !== id);
  if (r.secrets) delete r.secrets[id];
  if (hook) roomPlayerLeft(r, id, p && p.name);
};

{
  // فيبج: nothing published says which option is the truth.
  const r = newRoom(['a', 'b', 'c']);
  applyRoomAction(r, 'a', 'chooseGame', { game: 'fibbage' });
  applyRoomAction(r, 'a', 'start', { lang: 'ar' });
  applyRoomAction(r, 'a', 'submitLie', { lie: 'zzkadhba' });
  applyRoomAction(r, 'b', 'submitLie', { lie: 'qqkadhba' });
  check(threw(() => applyRoomAction(r, 'b', 'closeWriting', {})), 'fibbage: only the host closes the writing');
  applyRoomAction(r, 'a', 'closeWriting', {});
  const opts = r.shared.vote.options;
  check(r.shared.phase === 'voting' && opts.length === 3 && opts.every((o) => !('ownerId' in o)) && !opts.some((o) => o.id === 'truth' || /[abc]$/.test(o.id) && o.id.length < 3),
    'fibbage: the host opens the vote on what is in; options carry no owner and no telling id');
  check(r.secrets.a.voteOwn && r.secrets.b.voteOwn && !(r.secrets.c && r.secrets.c.voteOwn) && r._fibTruthId !== r.secrets.a.voteOwn && r._fibTruthId !== r.secrets.b.voteOwn,
    "fibbage: each writer's own slice names their option, and nobody's is the truth");
  check(threw(() => applyRoomAction(r, 'a', 'vote', { option: r.secrets.a.voteOwn })), 'fibbage: you still cannot vote for your own lie');
  const truth = r._fibTruthId;
  const aOwn = r.secrets.a.voteOwn;
  applyRoomAction(r, 'a', 'vote', { option: truth });
  applyRoomAction(r, 'b', 'vote', { option: aOwn });
  applyRoomAction(r, 'c', 'vote', { option: truth });
  check(r.shared.phase === 'results' && r.shared.truthId === truth && r.shared.scores.a === 1500 && r.shared.scores.c === 1000 &&
    r.shared.vote.results.find((x) => x.id === aOwn).ownerId === 'a', 'fibbage: scored from the hidden owners, which are published with the results');
  const round = r.shared.round;
  applyRoomAction(r, 'a', 'nextRound', { lang: 'ar', round });
  check(r.shared.round === round + 1 && !r._voteOwners && !(r.secrets.a && r.secrets.a.voteOwn), 'fibbage: a new round forgets whose option was whose');
  applyRoomAction(r, 'a', 'nextRound', { lang: 'ar', round });
  check(r.shared.round === round + 1 && r.shared.phase === 'writing', 'fibbage: a stale next round is ignored');
  leave(r, 'c');
  applyRoomAction(r, 'a', 'submitLie', { lie: 'zzkadhba' });
  check(r.shared.phase === 'writing', 'fibbage: one writer still to go');
  leave(r, 'b');
  check(r.shared.phase === 'voting' && r.shared.vote.options.length === 2, 'fibbage: the last writer leaving opens the vote');
}

{
  // 🌙 ليلتنا: placement points, not each game's own score.
  const night = (board) => { const r = { night: {} }; bankNightPoints(r, board); return r.night; };
  check(JSON.stringify(night([{ id: 'a', score: 30 }, { id: 'b', score: 20 }, { id: 'c', score: 10 }, { id: 'd', score: 5 }]))
        === JSON.stringify({ a: 3, b: 2, c: 1 }), 'night: 3/2/1 to the top three, nothing to the fourth');
  check(JSON.stringify(night([{ id: 'a', score: 30 }, { id: 'b', score: 30 }, { id: 'c', score: 10 }]))
        === JSON.stringify({ a: 3, b: 3, c: 1 }), 'night: two tied firsts both take 3, and the next takes 1');
  check(JSON.stringify(night([{ id: 'a', score: 30 }, { id: 'b', score: 10 }, { id: 'c', score: 10 }]))
        === JSON.stringify({ a: 3, b: 2, c: 2 }), 'night: two tied seconds both take 2, and nobody takes 1');
  check(JSON.stringify(night([{ id: 'a', score: 0 }, { id: 'b', score: 0 }])) === '{}', 'night: a game nobody scored in adds nothing');
  check(JSON.stringify(night([{ id: 'a', score: 10 }])) === '{}', 'night: one player alone adds nothing');
  check(JSON.stringify(night([])) === '{}' && JSON.stringify(night(undefined)) === '{}', 'night: a game that keeps no scores adds nothing');
  // سكرو sorts ascending because its lowest total wins, so its board is best-first too.
  check(JSON.stringify(night([{ id: 'a', score: -1 }, { id: 'b', score: 12 }, { id: 'c', score: 40 }]))
        === JSON.stringify({ a: 3, b: 2, c: 1 }), 'night: سكرو banks its lowest total as first');
  // and it adds up across the evening
  const r = { night: { a: 3 } };
  bankNightPoints(r, [{ id: 'b', score: 5 }, { id: 'a', score: 1 }]);
  check(r.night.a === 5 && r.night.b === 3, 'night: a second game adds to the first');
}

{
  // 🌙 ليلتنا survives the trip back to the hub and the next deal.
  const r = newRoom(['a', 'b', 'c']);
  applyRoomAction(r, 'a', 'chooseGame', { game: 'trivia' });
  applyRoomAction(r, 'a', 'start', { lang: 'ar', count: 5 });
  r.shared.board = [{ id: 'a', name: 'A', score: 30 }, { id: 'b', name: 'B', score: 10 }, { id: 'c', name: 'C', score: 0 }];
  check(!r.night, 'night: nothing is banked while the game is still on');
  applyRoomAction(r, 'a', 'backToHub', {});
  const afterOne = JSON.stringify(r.night || {});
  check(r.night.a === 3 && r.night.b === 2 && r.night.c === 1 && r.phase === 'lobby' && !r.shared.board,
    'night: leaving a game for the hub banks its board');
  applyRoomAction(r, 'a', 'backToHub', {});
  check(JSON.stringify(r.night) === afterOne, 'night: a second tap on the hub banks nothing twice');
  applyRoomAction(r, 'a', 'chooseGame', { game: 'trivia' });
  applyRoomAction(r, 'a', 'start', { lang: 'ar', count: 5 });
  check(JSON.stringify(r.night) === afterOne, 'night: dealing the next game keeps the evening so far');

  // لو خيروك and مين أكثر واحد are polls: they keep no score, so they add nothing.
  const poll = newRoom(['a', 'b', 'c']);
  applyRoomAction(poll, 'a', 'chooseGame', { game: 'wouldyou' });
  applyRoomAction(poll, 'a', 'start', { lang: 'ar' });
  applyRoomAction(poll, 'a', 'vote', { option: 'a' });
  applyRoomAction(poll, 'b', 'vote', { option: 'a' });
  applyRoomAction(poll, 'c', 'vote', { option: 'b' });
  applyRoomAction(poll, 'a', 'backToHub', {});
  check(!poll.night || !Object.keys(poll.night).length, 'night: a game with no score at all adds nothing to the evening');
}

{
  // المختلف: nobody is told their role, and naming them ends the round.
  const r = newRoom(['a', 'b', 'c', 'd']);
  applyRoomAction(r, 'a', 'chooseGame', { game: 'imposter' });
  applyRoomAction(r, 'a', 'start', { undercover: true, spies: 1 });
  const slices = Object.values(r.secrets);
  const shapes = new Set(slices.map((x) => Object.keys(x).sort().join(',')));
  check(shapes.size === 1 && slices.every((x) => x.role === 'player' && !!x.word),
    'undercover: every slice is the same shape — a role and a word — so no phone can tell who is the odd one out');
  const odd = r._impSpies[0];
  const theirs = r.secrets[odd].word;
  const table = r.secrets[Object.keys(r.secrets).find((id) => id !== odd)].word;
  check(theirs !== table && slices.filter((x) => x.word === table).length === 3,
    'undercover: one word for the table and a near relative for the odd one out');
  check(!('pairOther' in r.shared) && r.shared.undercover === true,
    "undercover: the other half of the pair is not published while the round is on");
  applyRoomAction(r, 'a', 'beginDiscussion', {});
  applyRoomAction(r, 'a', 'startVote', {});
  ['a', 'b', 'c', 'd'].filter((id) => id !== odd).forEach((id) => applyRoomAction(r, id, 'vote', { option: odd }));
  applyRoomAction(r, odd, 'vote', { option: ['a', 'b', 'c', 'd'].find((id) => id !== odd) });
  check(r.phase !== 'guess' && r.shared.outcome === 'caught' && r.shared.pairOther === theirs,
    'undercover: being named ends it — no guess from six, and both words are shown');
  check(['a', 'b', 'c', 'd'].filter((id) => id !== odd).every((id) => r.shared.scores[id] === 1) && !r.shared.scores[odd],
    'undercover: catching them scores every other player');
}

{
  // الجاسوس keeps its guess: the ordinary mode is untouched by المختلف.
  const r = newRoom(['a', 'b', 'c', 'd']);
  applyRoomAction(r, 'a', 'chooseGame', { game: 'imposter' });
  applyRoomAction(r, 'a', 'start', { category: 'حيوانات', spies: 1 });
  const spy = r._impSpies[0];
  check(r.secrets[spy].role === 'spy' && r.secrets[spy].word === null, 'imposter: the ordinary spy still gets no word');
  applyRoomAction(r, 'a', 'beginDiscussion', {});
  applyRoomAction(r, 'a', 'startVote', {});
  ['a', 'b', 'c', 'd'].filter((id) => id !== spy).forEach((id) => applyRoomAction(r, id, 'vote', { option: spy }));
  applyRoomAction(r, spy, 'vote', { option: ['a', 'b', 'c', 'd'].find((id) => id !== spy) });
  check(r.phase === 'guess' && (r.shared.options || []).length === 6 && r.shared.options.includes(r._impSecret) && r.shared.guesserId === spy,
    'imposter: a caught spy still picks the word from six');
}

{
  // The English spy words (the owner, 26 Sep 2026): an English category deals
  // English words and a guess from six English words; المختلف with lang 'en'
  // deals an English pair; the Arabic game is as it was.
  const isAr = (w) => /[؀-ۿ]/.test(String(w));
  const r = newRoom(['a', 'b', 'c', 'd']);
  applyRoomAction(r, 'a', 'chooseGame', { game: 'imposter' });
  applyRoomAction(r, 'a', 'start', { category: 'Animals', spies: 1, lang: 'en' });
  const spy = r._impSpies[0];
  const word = r.secrets[['a', 'b', 'c', 'd'].find((id) => id !== spy)].word;
  check(!!word && !isAr(word) && r.shared.category === 'Animals', 'imposter en: an English category deals an English word');
  applyRoomAction(r, 'a', 'beginDiscussion', {});
  applyRoomAction(r, 'a', 'startVote', {});
  ['a', 'b', 'c', 'd'].filter((id) => id !== spy).forEach((id) => applyRoomAction(r, id, 'vote', { option: spy }));
  applyRoomAction(r, spy, 'vote', { option: ['a', 'b', 'c', 'd'].find((id) => id !== spy) });
  check(r.phase === 'guess' && (r.shared.options || []).length === 6 && r.shared.options.every((w) => !isAr(w)),
    'imposter en: the caught spy picks from six English words');

  const u = newRoom(['a', 'b', 'c', 'd']);
  applyRoomAction(u, 'a', 'chooseGame', { game: 'imposter' });
  applyRoomAction(u, 'a', 'start', { undercover: true, spies: 1, lang: 'en' });
  const words = Object.values(u.secrets).map((x) => x.word);
  check(words.every((w) => !!w && !isAr(w)) && new Set(words).size === 2, 'undercover en: an English pair is dealt');

  const ar = newRoom(['a', 'b', 'c', 'd']);
  applyRoomAction(ar, 'a', 'chooseGame', { game: 'imposter' });
  applyRoomAction(ar, 'a', 'start', { undercover: true, spies: 1 });
  check(Object.values(ar.secrets).every((x) => isAr(x.word)), 'undercover: with no language the Arabic pairs, as before');
}

{
  // كلمة واحدة: a removed clue stays on the server until the guess, and nobody waits on a leaver.
  const r = newRoom(['a', 'b', 'c', 'd']);
  applyRoomAction(r, 'a', 'chooseGame', { game: 'justone' });
  applyRoomAction(r, 'a', 'start', {});
  applyRoomAction(r, 'b', 'submitClue', { clue: 'زززز' });
  applyRoomAction(r, 'c', 'submitClue', { clue: 'الزززز' });
  leave(r, 'd');
  check(r.shared.phase === 'guessing' && r.shared.clues.length === 2 && r.shared.clues.every((c) => c.removed && c.text === '') && JSON.stringify(r.shared).indexOf('زززز') === -1,
    'just one: the last writer leaving hands on the clues, the removed ones without their text');
  leave(r, 'a');
  check(r.shared.phase === 'result' && r.shared.lastResult === 'skipped' && !!r.shared.secretWord && r.shared.clues.some((c) => c.text === 'الزززز'),
    'just one: the guesser leaving ends the round, the word and the clues shown');
}

{
  // مافيا: someone who leaves is out of the game, and the game can still end.
  const r = newRoom(['h', 'p2', 'p3', 'p4', 'p5']);
  applyRoomAction(r, 'h', 'chooseGame', { game: 'mafia' });
  applyRoomAction(r, 'h', 'start', { mode: 'classic' });
  const boss = Object.keys(r._mafia.roles).find((id) => r._mafia.roles[id] === 'mafia');
  const town = r.shared.roster.filter((id) => id !== boss);
  applyRoomAction(r, 'h', 'startNight', {});
  applyRoomAction(r, boss, 'nightPick', { target: town[1] });
  town.slice(1).forEach((id) => applyRoomAction(r, id, 'nightPick', { target: boss }));
  leave(r, town[0]);
  check(r.shared.phase === 'day' && r.shared.out.some((o) => o.id === town[0] && o.left && o.name === town[0].toUpperCase()) &&
    r.shared.out.some((o) => o.id === town[1] && !o.left), 'mafia: the one still to tap at night leaves: out of the game, and the night ends');
  check(!r.secrets[town[0]], 'mafia: no secret is written for someone who left');
  leave(r, town[2]);
  check(r.shared.phase === 'gameover' && r.shared.winner === 'mafia' && r.shared.roles.find((x) => x.id === town[0]).name === town[0].toUpperCase(),
    'mafia: a leave that leaves the mafia level ends the game, and the list still names who left');
}
{
  // مافيا, a room from before the hook: a player gone but still on the living list is not counted.
  const r = newRoom(['h', 'p2', 'p3', 'p4', 'p5']);
  applyRoomAction(r, 'h', 'chooseGame', { game: 'mafia' });
  applyRoomAction(r, 'h', 'start', { mode: 'classic' });
  const boss = Object.keys(r._mafia.roles).find((id) => r._mafia.roles[id] === 'mafia');
  const town = r.shared.roster.filter((id) => id !== boss);
  const host = r.hostId;
  leave(r, town.find((id) => id !== host), false);
  leave(r, town.filter((id) => id !== host)[1], false);
  applyRoomAction(r, host, 'startNight', {});
  const living = r.shared.roster.filter((id) => r.players.some((p) => p.id === id));
  check(threw(() => applyRoomAction(r, boss, 'nightPick', { target: town.find((id) => id !== host) })), 'mafia: nobody picks someone who left');
  living.forEach((id) => applyRoomAction(r, id, 'nightPick', { target: id === boss ? living.find((x) => x !== boss) : boss }));
  check(r.shared.phase === 'gameover' && r.shared.winner === 'mafia', 'mafia: the end is counted among those still here');
}

{
  // ربع قرد: the player up leaves, and the winners' count shrinks with the table.
  const r = newRoom(['a', 'b', 'c']);
  applyRoomAction(r, 'a', 'chooseGame', { game: 'monkey' });
  applyRoomAction(r, 'a', 'start', { lang: 'ar', mode: 'chain', category: 'countries', timer: 0, winners: 2 });
  check(r.shared.turnId === 'a' && r.shared.winners === 2, 'monkey: three players, two winners');
  leave(r, 'a');
  check(r.shared.phase === 'play' && r.shared.turnId === 'b' && r.shared.order.join() === 'b,c', 'monkey: the player up leaves, the next one is up');
  r.hostId = 'b';
  applyRoomAction(r, 'b', 'setQuarters', { playerId: 'c', n: 4 });
  check(r.shared.phase === 'gameover' && r.shared.winnerNames.join() === 'B', 'monkey: two left and one a monkey: the game ends');
  check(threw(() => applyRoomAction(r, 'b', 'penalty', {})) && (applyRoomAction(r, 'b', 'penalty', { target: 'c' }), r.shared.phase === 'gameover'),
    'monkey: a penalty after the end is refused, or dropped quietly when it names its player');
}
{
  const r = newRoom(['a', 'b', 'c']);
  applyRoomAction(r, 'a', 'chooseGame', { game: 'monkey' });
  applyRoomAction(r, 'a', 'start', { lang: 'ar', mode: 'letters', category: 'countries', timer: 0, winners: 1 });
  applyRoomAction(r, 'a', 'letter', { ch: 'م' });
  r.players.push({ id: 'z', name: 'Z' });
  check(threw(() => applyRoomAction(r, 'z', 'liar', {})), 'monkey: someone who joined mid-game cannot call كذاب');
  leave(r, 'c', false);
  applyRoomAction(r, 'a', 'setQuarters', { playerId: 'b', n: 4 });
  check(r.shared.phase === 'gameover' && r.shared.winnerNames.join() === 'A', 'monkey: a player who left (without the hook) is not counted as safe');
}

{
  // زي الكل: the answers of someone who left don't score, or take the sheep.
  const r = newRoom(['a', 'b', 'c', 'd']);
  applyRoomAction(r, 'a', 'chooseGame', { game: 'herd' });
  applyRoomAction(r, 'a', 'start', { lang: 'ar', target: 5 });
  applyRoomAction(r, 'a', 'submit', { text: 'قطة' });
  applyRoomAction(r, 'b', 'submit', { text: 'القطه' });
  applyRoomAction(r, 'c', 'submit', { text: 'كلب' });
  leave(r, 'd');
  check(r.shared.phase === 'reveal' && r.shared.groups.length === 2, 'herd: the last writer leaving reveals the answers');
  leave(r, 'c', false);
  applyRoomAction(r, 'a', 'score', {});
  check(r.shared.scores.a === 1 && r.shared.scores.b === 1 && !r.shared.sheepId && r.shared.groups.every((g) => g.ids.indexOf('c') === -1),
    "herd: an answer from someone who left can't take the sheep");
  const round = r.shared.round;
  applyRoomAction(r, 'a', 'nextRound', {});
  applyRoomAction(r, 'a', 'submit', { text: 'x', round });
  check(r.shared.submitted.length === 0, 'herd: an answer to the last question is dropped');
}

{
  // ارسم واكتب: nobody waits on a leaver, and a late drawing is not filed on the next step.
  const r = newRoom(['a', 'b', 'c']);
  applyRoomAction(r, 'a', 'chooseGame', { game: 'telephone' });
  applyRoomAction(r, 'a', 'start', { lang: 'ar' });
  applyRoomAction(r, 'a', 'submit', { strokes: [], step: 1 });
  applyRoomAction(r, 'b', 'submit', { strokes: [], step: 1 });
  leave(r, 'c');
  check(r.shared.step === 2 && r.shared.kind === 'write', 'telephone: the last one still drawing leaves, and the next step starts');
  applyRoomAction(r, 'a', 'submit', { strokes: [{ p: [1, 1, 2, 2] }], step: 1 });
  applyRoomAction(r, 'b', 'submit', { strokes: [{ p: [1, 1, 2, 2] }] });
  check(r.shared.submitted.length === 0, 'telephone: a drawing for the step before is dropped, with or without its step');
}

{
  // صدق ولا كذب, خمس ثواني, القنبلة: a turn that was theirs passes on.
  const tt = newRoom(['a', 'b', 'c', 'd']);
  applyRoomAction(tt, 'a', 'chooseGame', { game: 'twotruths' });
  applyRoomAction(tt, 'a', 'start', {});
  ['a', 'b', 'c', 'd'].forEach((id) => applyRoomAction(tt, id, 'submit', { statements: ['1', '2', '3'], lie: 0 }));
  const subject = tt.shared.subjectId;
  leave(tt, subject);
  check(tt.shared.phase === 'voting' && tt.shared.subjectId !== subject && tt.shared.turn === 1, 'two truths: the storyteller leaves, the next one is up');

  const five = newRoom(['a', 'b', 'c']);
  applyRoomAction(five, 'a', 'chooseGame', { game: 'fiveseconds' });
  applyRoomAction(five, 'a', 'start', { lang: 'ar', rounds: 1 });
  const upFive = five.shared.turnId;
  applyRoomAction(five, 'a', 'go', {});
  leave(five, upFive);
  check(five.shared.phase === 'ready' && five.shared.turnId !== upFive && five.players.some((p) => p.id === five.shared.turnId), 'five seconds: the player up leaves, the next one is up');

  const bomb = newRoom(['a', 'b', 'c']);
  applyRoomAction(bomb, 'a', 'chooseGame', { game: 'bomb' });
  applyRoomAction(bomb, 'a', 'start', { lang: 'ar', fuse: 'long' });
  const holder = bomb.shared.holderId;
  const order = bomb.shared.order;
  leave(bomb, holder);
  check(bomb.shared.holderId === order[(order.indexOf(holder) + 1) % 3], 'bomb: the holder leaves, the next in the order holds it');
}

{
  // أسماء الرموز: a spymaster who left doesn't hold the slot.
  const r = newRoom(['r1', 'r2', 'b1', 'b2']);
  applyRoomAction(r, 'r1', 'chooseGame', { game: 'codenames' });
  applyRoomAction(r, 'r2', 'setTeam', { team: 'red', role: 'spymaster' });
  leave(r, 'r2', false);
  applyRoomAction(r, 'b1', 'setTeam', { team: 'red', role: 'spymaster' });
  check(r.shared.teams.b1.role === 'spymaster', 'codenames: a spymaster who left no longer blocks the slot');
  leave(r, 'b1');
  check(!r.shared.teams.b1, 'codenames: leaving frees the place on the side');
}

{
  // A deal is stamped; a move within it keeps the stamp.
  const r = newRoom(['a', 'b', 'c']);
  applyRoomAction(r, 'a', 'chooseGame', { game: 'herd' });
  applyRoomAction(r, 'a', 'start', { lang: 'ar' });
  const first = r.shared.dealId;
  applyRoomAction(r, 'a', 'submit', { text: 'x' });
  check(!!first && r.shared.dealId === first, 'deal stamp: set on start, kept through the round');
  ['b', 'c'].forEach((id) => applyRoomAction(r, id, 'submit', { text: 'y' }));
  applyRoomAction(r, 'a', 'score', {});
  applyRoomAction(r, 'a', 'nextRound', {});
  check(r.shared.dealId && r.shared.dealId !== first, 'deal stamp: a new one for the next round');
  const second = r.shared.dealId;
  applyRoomAction(r, 'a', 'nextRound', {});
  check(r.shared.dealId === second, 'deal stamp: a next round that deals nothing leaves it');
}

/* --- سكرو: scoring, matching, the powers, and what never leaves the server --------- */
{
  // A table the tests can set: hands and the deck are written straight into room._screw.
  const skStart = (ids, opts) => {
    const r = newRoom(ids);
    applyRoomAction(r, ids[0], 'chooseGame', { game: 'screw' });
    applyRoomAction(r, ids[0], 'start', Object.assign({ edition: 'classic', rounds: 3, screwFromLap: 1 }, opts));
    return r;
  };
  const sk = (r, pid, action, payload = {}) => applyRoomAction(r, pid, action, Object.assign({ seq: r.shared.turnSeq }, payload));
  const skThrew = (r, pid, action, payload) => threw(() => sk(r, pid, action, payload));
  // Hands by seat: cards[i] goes to shared.order[i], in slots named <pid>1, <pid>2...
  const setHands = (r, cards) => {
    r.shared.order.forEach((id, i) => {
      if (!cards[i]) return;
      r._screw.hands[id] = cards[i].map((c, k) => ({ id: id + (k + 1), card: c, shown: false }));
    });
  };
  const seat = (r, i) => r.shared.order[i];
  const up = (r) => r.shared.turn && r.shared.turn.pid;
  const slotOf = (r, pid, n) => r._screw.hands[pid][n - 1].id;
  // Everyone taps "memorized", then the round is set as the test wants it.
  const begin = (r, cards, deck, pile) => {
    if (cards) setHands(r, cards);
    if (deck) r._screw.deck = deck.slice();
    if (pile) r._screw.pile = pile.slice();
    r.shared.order.forEach((id) => sk(r, id, 'ready'));
  };
  // The player up calls سكرو and everyone else plays out their last turn with a skip.
  const callAndFinish = (r) => {
    const host = r.hostId;
    sk(r, up(r), 'screw');
    let guard = 20;
    while (r.shared.phase === 'play' && guard--) sk(r, host, 'skipTurn');
  };

  {
    // The deal and the memorize.
    const r = skStart(['a', 'b', 'c', 'd']);
    check(r.shared.phase === 'memorize' && r.shared.order.length === 4 && r.shared.pile.length === 1 && r.shared.deckCount === 59 - 17 && r.shared.settings.basraCount === 4,
      'skrew: four cards each, one on the pile, the rest in the deck');
    check(r.shared.order.every((id) => r.shared.hands[id].length === 4 && r.shared.hands[id].every((h, i) => h.up === null && h.n === i + 1 && /^c\d+$/.test(h.id))),
      'skrew: every hand is four face-down slots with stable ids');
    check(r.shared.order.every((id) => r.secrets[id].memorize.length === 2 && r.secrets[id].memorize[0].slot === r.shared.hands[id][2].id && r.secrets[id].memorize[1].slot === r.shared.hands[id][3].id),
      'skrew: each phone memorizes its own slots 3 and 4');
    const shared = JSON.stringify(r.shared);
    const hidden = Object.values(r._screw.hands).flat().map((e) => e.card);
    check(!/"(memorize|drawn|seen|khoshaf|card)":/.test(shared) && !JSON.stringify(r.shared.hands).match(/"up":"/),
      'skrew: shared carries no card of any hand');
    check(hidden.length === 16, 'skrew: the hands stay in room._screw');
    const seq = r.shared.turnSeq;
    sk(r, 'a', 'ready');
    check(r.secrets.a.memorize === null && r.secrets.b.memorize.length === 2 && r.shared.turnSeq === seq, 'skrew: ready hides your two cards, and moves no turn');
    sk(r, 'a', 'beginRound');
    check(r.shared.phase === 'play' && r.shared.turn.pid === r.shared.order[0] && r.shared.turn.stage === 'choose' && r.shared.turnSeq === seq + 1,
      'skrew: the host starts the round without waiting; the first seat is up');
    check(threw(() => applyRoomAction(r, 'b', 'beginRound', {})) || r.hostId === 'b', 'skrew: only the host starts it');
  }

  {
    // Draw: only the drawer sees it; keep, discard, the pile, and a stale tap.
    const r = skStart(['a', 'b', 'c']);
    begin(r, [['n1', 'n2', 'n3', 'n4'], ['n5', 'n6', 'n1', 'n2'], ['n3', 'n4', 'n5', 'n6']], ['n6', 'green0', 'n6', 'p7'], ['n2']);
    const p0 = seat(r, 0), p1 = seat(r, 1), p2 = seat(r, 2);
    check(skThrew(r, p1, 'draw'), 'skrew: only the player up draws');
    const oldSeq = r.shared.turnSeq;
    sk(r, p0, 'draw');
    check(r.secrets[p0].drawn === 'p7' && r.secrets[p1].drawn === null && r.shared.turn.stage === 'drawn', 'skrew: the drawn card is in the drawer\'s slice only');
    const last = r.shared.events[r.shared.events.length - 1];
    check(last.type === 'draw' && !('card' in last) && JSON.stringify(r.shared).indexOf('"p7"') === -1, 'skrew: nothing shared says what was drawn');
    applyRoomAction(r, p0, 'draw', { seq: oldSeq });
    check(r.shared.turn.stage === 'drawn' && r.shared.deckCount === 3, 'skrew: a tap with a stale seq is dropped quietly');
    sk(r, p0, 'keep', { slot: slotOf(r, p0, 1) });
    check(r._screw.hands[p0][0].card === 'p7' && r.shared.pile[r.shared.pile.length - 1] === 'n1' && r.shared.turn.pid === p1,
      'skrew: keep swaps the card into the slot, the old one goes face up on the pile, the turn passes');
    const ev = r.shared.events[r.shared.events.length - 1];
    check(ev.type === 'keep' && ev.card === 'n1' && ev.slot === p0 + '1', 'skrew: the keep event carries the old card');
    sk(r, p1, 'draw');
    check(skThrew(r, p1, 'keep', { slot: 'nope' }), 'skrew: a slot that is not yours is refused');
    sk(r, p1, 'discard');
    check(r.shared.turn.pid === p2 && r.shared.pile[r.shared.pile.length - 1] === 'n6', 'skrew: a number discarded ends the turn');
    sk(r, p2, 'takePile', { slot: slotOf(r, p2, 2) });
    check(r._screw.hands[p2][1].card === 'n6' && r.shared.pile[r.shared.pile.length - 1] === 'n4' && r.shared.hands[p2][1].up === null,
      'skrew: taking the pile puts its top in the slot (face down) and the old card on the pile');
    check(r.shared.lap === 2 && r.shared.turn.pid === p0, 'skrew: back to the first seat is lap 2');
  }

  {
    // Matching: right leaves the hand, wrong is shown and costs a card.
    const r = skStart(['a', 'b']);
    begin(r, [['n3', 'red25', 's10', 'n5'], ['p7', 'green0', 'swap', 'n1']], ['n2', 'n4', 'n6', 'n1'], ['n3']);
    const p0 = seat(r, 0), p1 = seat(r, 1);
    sk(r, p0, 'match', { slot: slotOf(r, p0, 1) });
    check(r._screw.hands[p0].length === 3 && r.shared.pile[r.shared.pile.length - 1] === 'n3' && r.shared.turn.pid === p1,
      'skrew: a 3 on a 3 leaves the hand and ends the turn');
    const e1 = r.shared.events[r.shared.events.length - 1];
    check(e1.type === 'match' && e1.ok === true && e1.card === 'n3', 'skrew: the match event shows the card and that it was right');
    sk(r, p1, 'match', { slot: slotOf(r, p1, 1) });
    check(r._screw.hands[p1].length === 5 && r._screw.hands[p1][0].card === 'p7' && r.shared.hands[p1][0].up === null && r.shared.hands[p1][0].h.known === 'p7' &&
      r.shared.hands[p1][4].up === null && r._screw.hands[p1][4].card === 'n1' && r.secrets[p1].seen === null && r.secrets[p1].drawn === null,
      'skrew: a 7 on a 3 goes back face down in its slot (the table knows it), and a penalty card comes blind into a new slot at the end');
    const pen = r.shared.hands[p1][4].h;
    check(pen.how === 'penalty' && pen.by === p1 && pen.looks.length === 0 && pen.known === null && pen.at === r.shared.events.slice(-1)[0].seq,
      'skrew: nobody looks at a penalty card, its owner neither');
    check(r.shared.events.slice(-2).map((e) => e.type + ':' + e.ok).join() === 'match:false,penalty:undefined', 'skrew: a wrong match and its penalty are both events');
    r._screw.pile.push('green0');
    sk(r, p0, 'match', { slot: slotOf(r, p0, 1) });
    check(r._screw.hands[p0].length === 2 && r.shared.pile[r.shared.pile.length - 1] === 'red25', 'skrew: the red screw burns on a green screw');
    r._screw.pile.push('n5');
    sk(r, p1, 'match', { slot: slotOf(r, p1, 2) });
    check(r._screw.hands[p1].length === 6 && r.shared.hands[p1][1].up === null && r.shared.hands[p1][1].h.known === 'green0', 'skrew: a green screw on a 5 is wrong');
    r._screw.pile.push('s10');
    sk(r, p0, 'match', { slot: p0 + '3' });
    check(r._screw.hands[p0].length === 1, 'skrew: a 10 on a 10 is right');
    r._screw.pile.push('swap');
    sk(r, p1, 'match', { slot: p1 + '3' });
    check(r._screw.hands[p1].length === 5, 'skrew: خد وهات on خد وهات is right');
    r._screw.pile.push('red25');
    r._screw.hands[p0].push({ id: 'x9', card: 'n5', shown: false });
    sk(r, p0, 'match', { slot: 'x9' });
    check(r.shared.hands[p0].find((h) => h.id === 'x9').h.known === 'n5' && r.shared.hands[p0].find((h) => h.id === 'x9').up === null, 'skrew: a 5 on the red screw is wrong');
    {
      // The two screws are one kind: green goes on red as red goes on green (the owner, 21 Sep 2026).
      const green = r._screw.hands[p1].find((h) => h.card === 'green0');
      const had = r._screw.hands[p1].length;
      sk(r, p1, 'match', { slot: green.id });
      check(r._screw.hands[p1].length === had - 1 && r.shared.pile[r.shared.pile.length - 1] === 'green0', 'skrew: a green screw burns on a red screw too');
      r._screw.hands[p0].push({ id: 'x8', card: 'red25', shown: false });
      const had0 = r._screw.hands[p0].length;
      sk(r, p0, 'match', { slot: 'x8' });
      check(r._screw.hands[p0].length === had0 - 1 && r.shared.pile[r.shared.pile.length - 1] === 'red25', 'skrew: and a red screw on the green one it landed on');
    }
    // The deck runs out: the pile under its top card is shuffled back in.
    r._screw.deck = [];
    const pileBefore = r._screw.pile.length;
    sk(r, p1, 'draw');
    check(r._screw.pile.length === 1 && r._screw.deck.length === pileBefore - 2 && r.shared.events.some((e) => e.type === 'reshuffle'),
      'skrew: an empty deck takes back the pile but its top card');
  }

  {
    // سكرو: from the lap chosen, the last turns, the protected hand, scores 0 and double.
    const r = skStart(['a', 'b', 'c'], { screwFromLap: 2 });
    begin(r, [['n1', 'n1', 'n1', 'n1'], ['n2', 'n2', 'n2', 'n2'], ['n3', 'n3', 'n3', 'n3']], ['n6', 'n6', 'n6', 'n6', 'n6', 'n6'], ['n5']);
    const [p0, p1, p2] = r.shared.order;
    check(skThrew(r, p0, 'screw'), 'skrew: سكرو is refused before the lap chosen');
    sk(r, p0, 'draw'); sk(r, p0, 'discard');
    sk(r, p1, 'draw'); sk(r, p1, 'discard');
    sk(r, p2, 'draw'); sk(r, p2, 'discard');
    sk(r, p0, 'screw');
    check(r.shared.caller === p0 && r.shared.finalLeft.join() === [p1, p2].join() && r.shared.turn.pid === p1, 'skrew: سكرو at lap 2 gives everyone else one more turn');
    sk(r, p1, 'draw');
    sk(r, p1, 'discard');
    check(r.shared.phase === 'play' && r.shared.turn.pid === p2 && r.shared.finalLeft.join() === p2, 'skrew: each last turn is spent');
    sk(r, p2, 'draw');
    sk(r, p2, 'discard');
    check(r.shared.phase === 'reveal' && r.shared.results.round[p0] === 0 && r.shared.results.round[p1] === 8 && r.shared.results.round[p2] === 12 && !r.shared.results.callerDouble,
      'skrew: a caller strictly lowest scores 0, the others their totals');
    check(r.shared.order.every((id) => r.shared.hands[id].every((h) => h.up)), 'skrew: at the reveal every card is face up');
    check(r.shared.board[0].id === p0 && r.shared.board[2].id === p2, 'skrew: the board is lowest first');
    check(threw(() => applyRoomAction(r, p1, 'nextRound', { round: 1 })) || r.hostId === p1, 'skrew: only the host deals the next round');
    applyRoomAction(r, r.hostId, 'nextRound', { round: 1 });
    check(r.shared.phase === 'memorize' && r.shared.round === 2 && r._screw.start === 1, 'skrew: the next round is dealt, the first seat moved on');
    applyRoomAction(r, r.hostId, 'nextRound', { round: 1 });
    check(r.shared.round === 2, 'skrew: a second tap on next round is ignored');
  }

  {
    // Double, ties, zero and negative totals.
    const round = (cards, callerSeat) => {
      const r = skStart(['a', 'b', 'c']);
      begin(r, cards, ['n6', 'n6', 'n6', 'n6'], ['n5']);
      const caller = seat(r, callerSeat);
      while (up(r) !== caller) sk(r, r.hostId, 'skipTurn');
      callAndFinish(r);
      return { r, res: r.shared.results, s: (i) => r.shared.results.round[seat(r, i)] };
    };
    let t = round([['n5'], ['n5'], ['n6']], 0);
    check(t.s(0) === 0 && t.s(1) === 5 && t.s(2) === 6 && !t.res.callerDouble && t.res.lowest.join() === seat(t.r, 0),
      'skrew: a caller who ties the lowest scores 0, and the one tied keeps their total');
    t = round([['n6'], ['n2', 'n1'], ['n3']], 0);
    check(t.s(0) === 12 && t.s(1) === 0 && t.s(2) === 0 && t.res.callerDouble, 'skrew: a beaten caller is doubled; ties for lowest among the others all score 0');
    t = round([['green0'], ['green0'], ['n1']], 0);
    check(t.s(0) === 0 && t.s(1) === 0 && t.s(2) === 1 && !t.res.callerDouble, 'skrew: a caller tied at 0 scores 0');
    t = round([['minus1'], ['minus1', 'n1'], ['minus1', 'green0']], 2);
    check(t.s(0) === -1 && t.s(1) === 0 && t.s(2) === 0 && !t.res.callerDouble && t.res.totals[seat(t.r, 2)] === -1,
      'skrew: a negative caller who ties the lowest scores 0; the one tied keeps -1');
    t = round([['minus1'], ['n2'], ['minus1', 'minus1']], 0);
    check(t.s(0) === -2 && t.s(1) === 2 && t.s(2) === 0 && t.res.callerDouble, 'skrew: a beaten caller on -1 is doubled to -2');
    t = round([['green0'], ['minus1'], ['n3']], 0);
    check(t.s(0) === 0 && t.s(1) === 0 && t.s(2) === 3 && t.res.callerDouble, 'skrew: a beaten caller on 0 is doubled and stays 0');
    t = round([['n4', 'basra'], ['n1'], ['n2']], 2);
    check(t.s(0) === 14 && t.s(1) === 0 && t.s(2) === 4 && t.res.sums[seat(t.r, 0)] === 14, 'skrew: a command card left in a hand counts 10');
    t = round([['lifeJacket', 'minus1', 'n3'], ['lifeJacket'], ['n4', 'lifeJacket', 'lifeJacket']], 0);
    const v = (i) => t.res.values[seat(t.r, i)].join();
    check(v(0) === '-1,-1,3' && v(1) === '10' && v(2) === '4,4,4' && t.res.sums[seat(t.r, 0)] === 1 && t.res.sums[seat(t.r, 2)] === 12 && t.s(0) === 0 && t.s(1) === 10,
      'skrew: a life jacket counts as the lowest other card in its hand (10 with nothing to copy), and results.values shows it');
    // No caller at all (they left): the lowest scores 0.
    const r = skStart(['a', 'b', 'c']);
    begin(r, [['n1'], ['n2'], ['n3']], ['n6', 'n6'], ['n5']);
    sk(r, seat(r, 0), 'screw');
    const caller = seat(r, 0);
    leave(r, caller);
    check(r.shared.phase === 'reveal' && r.shared.results.caller === null && r.shared.results.round[seat(r, 0)] === 0 && r.shared.results.round[seat(r, 1)] === 3,
      'skrew: the caller leaving reveals at once, scored without a caller');
  }

  {
    // Rounds, the running total and the winner, lowest first.
    const r = skStart(['a', 'b'], { rounds: 3 });
    for (let k = 0; k < 3; k++) {
      begin(r, [['n1'], ['n2', 'n2']], ['n6', 'n6'], ['n5']);
      while (up(r) !== r.shared.order[1]) sk(r, r.hostId, 'skipTurn');
      callAndFinish(r);
      if (k < 2) applyRoomAction(r, r.hostId, 'nextRound', { round: r.shared.round });
    }
    const [p0, p1] = r.shared.order;
    check(r.shared.phase === 'gameover' && r.shared.scores[p0] === 0 && r.shared.scores[p1] === 24 && r.shared.winners.join() === p0,
      'skrew: after the last round the game is over, lowest total wins');
    applyRoomAction(r, r.hostId, 'playAgain', {});
    check(r.shared.phase === 'memorize' && r.shared.round === 1 && Object.keys(r.shared.scores).length === 0 && r.shared.settings.rounds === 3,
      'skrew: play again starts over with the same options');
  }

  {
    // Teams: the partners' hands add up; the side scores together.
    const r = skStart(['a', 'b', 'c', 'd'], { edition: 'sahib', teams: true });
    check(r.shared.teams && r.shared.teams[0].join() === [seat(r, 0), seat(r, 2)].join() && r.shared.teams[1].join() === [seat(r, 1), seat(r, 3)].join(),
      'skrew: teams alternate around the table');
    check(threw(() => { const x = newRoom(['a', 'b', 'c']); applyRoomAction(x, 'a', 'chooseGame', { game: 'screw' }); applyRoomAction(x, 'a', 'start', { teams: true }); }),
      'skrew: teams need 4, 6 or 8 players');
    begin(r, [['n1', 'n1'], ['n3'], ['n2'], ['n1']], ['n6', 'n6', 'n6', 'n6'], ['n5']);
    callAndFinish(r);
    const res = r.shared.results;
    check(res.totals.A === 4 && res.totals.B === 4 && res.round.A === 0 && res.round.B === 4 && !res.callerDouble, 'skrew: a side calling on a tie scores 0, the other side keeps its total');
    check(res.round[seat(r, 0)] === 0 && res.round[seat(r, 1)] === 4 && r.shared.scores[seat(r, 2)] === 0 && r.shared.scores[seat(r, 3)] === 4 && r.shared.teamScores.B === 4,
      'skrew: each partner carries the side\'s score');
    check(res.lowest.sort().join() === [seat(r, 0), seat(r, 2)].sort().join(), 'skrew: the lowest side\'s players are the lowest');
    // A side beaten: only the caller's own hand is doubled, whatever its sign; the win is decided on the plain totals.
    const beaten = (cards) => {
      const x = skStart(['a', 'b', 'c', 'd'], { edition: 'sahib', teams: true });
      begin(x, cards, ['n6', 'n6', 'n6', 'n6'], ['n5']);
      callAndFinish(x);
      return x.shared.results;
    };
    let b = beaten([['n5'], ['n1'], ['n3'], ['n3']]);
    check(b.totals.A === 8 && b.totals.B === 4 && b.round.A === 13 && b.round.B === 0 && b.round[b.caller] === 13 && b.callerDouble,
      'skrew: a side beaten: 5 doubled plus the partner\'s 3 is 13, not 16');
    b = beaten([['minus1'], ['n1'], ['n5'], ['n2']]);
    check(b.totals.A === 4 && b.totals.B === 3 && b.round.A === 3 && b.round.B === 0 && b.callerDouble, 'skrew: a side beaten with the caller on -1: -2 plus the partner\'s 5 is 3');
    b = beaten([['n2'], ['n1'], ['n1'], ['n2']]);
    check(b.totals.A === 3 && b.totals.B === 3 && b.round.A === 0 && b.round.B === 3 && !b.callerDouble, 'skrew: a side tied on the plain totals has made its call');
  }

  {
    // Ping and Pong: the next player is skipped, the one after may throw Pong.
    const r = skStart(['a', 'b', 'c', 'd'], { edition: 'sahib', teams: true });
    begin(r, [['n1'], ['n2'], ['pong', 'n3'], ['n4']], ['n6', 'n6', 'n6', 'ping'], ['n5']);
    const [p0, p1, p2] = r.shared.order;
    sk(r, p0, 'draw');
    check(r.shared.turn.pid === p2 && r.shared.turn.pongOpen === true && r.shared.turn.pingFrom === p0 && r.shared.pile[r.shared.pile.length - 1] === 'ping',
      'skrew: a ping plays itself, the next player loses the turn, the partner is up');
    check(r.shared.events.slice(-1)[0].type === 'ping' && r.shared.events.slice(-1)[0].target === p1, 'skrew: the ping names who was skipped');
    sk(r, p2, 'pong', { slot: slotOf(r, p2, 1) });
    check(r._screw.hands[p2].length === 1 && r.shared.pile[r.shared.pile.length - 1] === 'pong' && r.shared.turn.pid === p2 && r.shared.turn.stage === 'choose' && !r.shared.turn.pongOpen,
      'skrew: a right Pong leaves the hand, and the turn is still to play');
    check(skThrew(r, p2, 'pong', { slot: slotOf(r, p2, 1) }), 'skrew: Pong once, right after the ping');
    // A wrong Pong costs a card.
    const w = skStart(['a', 'b']);
    begin(w, [['n1'], ['n2', 'n3']], ['n6', 'n6', 'ping'], ['n5']);
    const [w0, w1] = w.shared.order;
    sk(w, w0, 'draw');
    check(w.shared.turn.pid === w0 && w.shared.turn.pongOpen, 'skrew: with two players a ping comes back to the one who drew it');
    sk(w, w0, 'pong', { slot: slotOf(w, w0, 1) });
    check(w._screw.hands[w0].length === 2 && w.shared.hands[w0][0].up === null && w.shared.hands[w0][0].h.known === 'n1' && w.shared.turn.pid === w0,
      'skrew: a wrong Pong is seen, goes back face down, and costs a penalty card');
    check(w.shared.events.some((e) => e.type === 'ping' && e.target === w1), 'skrew: and the other player was the one skipped');
  }

  {
    // The powers: peek, spy, blind swap, basra, all around, give, see & swap, as you like, cannon, khoshaf, scream.
    const r = skStart(['a', 'b', 'c'], { edition: 'general', screwFromLap: 1 });
    begin(r, [['n1', 'n2', 'n3', 'n4'], ['n5', 'n6', 'n1', 'n2'], ['n3', 'n4', 'n5', 'n6']], [], ['n5']);
    const [p0, p1, p2] = r.shared.order;
    const drawPower = (pid, card) => { r._screw.deck.push(card); sk(r, pid, 'draw'); sk(r, pid, 'discard'); };

    drawPower(p0, 'p8');
    check(r.shared.turn.stage === 'power' && r.shared.turn.power === 'peekOwn', 'skrew: an 8 from the deck, discarded, offers its power');
    sk(r, p0, 'power', { slot: slotOf(r, p0, 2) });
    check(JSON.stringify(r.secrets[p0].seen) === JSON.stringify([{ pid: p0, slot: p0 + '2', card: 'n2' }]) && r.secrets[p1].seen === null && r.shared.turn.pid === p1,
      'skrew: peek shows your own card to you alone');
    const pe = r.shared.events.slice(-1)[0];
    check(pe.type === 'peekOwn' && pe.slot === p0 + '2' && !('card' in pe), 'skrew: the table sees which slot, not the card');

    drawPower(p1, 's9');
    check(skThrew(r, p1, 'power', { target: p1, slot: slotOf(r, p1, 1) }), 'skrew: spy is on another player');
    sk(r, p1, 'power', { target: p2, slot: slotOf(r, p2, 3) });
    check(r.secrets[p1].seen[0].card === 'n5' && r.secrets[p2].seen === null && JSON.stringify(r.shared).indexOf('"n5"') === JSON.stringify(r.shared).lastIndexOf('"n5"'),
      'skrew: spy shows one card of another player to the spy alone');

    drawPower(p2, 'swap');
    sk(r, p2, 'power', { slot: slotOf(r, p2, 1), target: p0, slot2: slotOf(r, p0, 1) });
    check(r._screw.hands[p2][0].card === 'n1' && r._screw.hands[p0][0].card === 'n3' && r.shared.hands[p0][0].id === p0 + '1',
      'skrew: a blind swap trades the cards; the slots stay where they are');
    check(r.secrets[p0].seen && r.secrets[p0].seen[0].card === 'n2', "skrew: what you looked at stays with you through the others' turns");

    drawPower(p0, 'basra');
    check(r.secrets[p0].seen === null, 'skrew: and goes at your next move');
    sk(r, p0, 'power', { slot: slotOf(r, p0, 4) });
    check(r._screw.hands[p0].length === 3 && r.shared.pile[r.shared.pile.length - 1] === 'n4', 'skrew: بصرة throws one of your cards face up');

    drawPower(p1, 'around');
    check(skThrew(r, p1, 'power', { picks: [{ target: p0, slot: slotOf(r, p0, 1) }] }), 'skrew: كعب داير needs a card of every other player');
    sk(r, p1, 'power', { picks: [{ target: p0, slot: slotOf(r, p0, 1) }, { target: p2, slot: slotOf(r, p2, 2) }] });
    check(r.secrets[p1].seen.length === 2 && r.secrets[p1].seen[1].card === 'n4', 'skrew: كعب داير around the table');

    drawPower(p2, 'around');
    sk(r, p2, 'power', { own: [slotOf(r, p2, 1), slotOf(r, p2, 2)] });
    check(r.secrets[p2].seen.map((x) => x.card).join() === 'n1,n4', 'skrew: or two of your own');

    drawPower(p0, 'takeOnly');
    const given = slotOf(r, p0, 1);
    sk(r, p0, 'power', { slot: given, target: p1 });
    const ge = r.shared.events.slice(-1)[0];
    check(r._screw.hands[p0].length === 2 && r._screw.hands[p1].length === 5 && r._screw.hands[p1][4].card === 'n3' && ge.type === 'give' && ge.slot2 === r._screw.hands[p1][4].id,
      'skrew: خد بس gives a card into a new slot at the end of their hand');

    drawPower(p1, 'seeSwap');
    sk(r, p1, 'power', { target: p2, slot: slotOf(r, p2, 4) });
    check(r.shared.turn.stage === 'seeSwap' && r.secrets[p1].seen[0].card === 'n6' && r.shared.turn.look.target === p2, 'skrew: شوف وبدّل looks first');
    sk(r, p1, 'seeSwapDo', { slot: slotOf(r, p1, 1) });
    check(r._screw.hands[p1][0].card === 'n6' && r._screw.hands[p2][3].card === 'n5' && r.shared.events.slice(-1)[0].swapped === true && r.secrets[p1].seen === null,
      'skrew: then swaps');

    // على كيفك is a mimic (the owner, 20 Sep 2026): it copies a command card
    // already lying face up on the pile, and nothing else.
    {
      const pileHas = (id) => r._screw.pile.indexOf(id) !== -1;
      check(pileHas('seeSwap') && !pileHas('cannon'), 'skrew: (شوف وبدّل has been thrown, المدفع has not)');
      drawPower(p2, 'asYouLike');
      check(skThrew(r, p2, 'power', { as: 'cannon', target: p0 }), 'skrew: على كيفك cannot copy a card the table has never seen go down');
      check(skThrew(r, p2, 'power', { as: 'nonsense' }), 'skrew: nor anything that is not a card');
      const n = r._screw.hands[p2].length;
      sk(r, p2, 'power', { as: 'seeSwap', target: p0, slot: slotOf(r, p0, 1) });
      const ev = r.shared.events.filter((e) => e.type === 'asYouLike').pop();
      check(ev.as === 'seeSwap' && ev.from === 'seeSwap' && r.shared.turn.stage === 'seeSwap',
        'skrew: على كيفك copies a card off the pile, and the table is told which');
      sk(r, p2, 'seeSwapDo', {});
      check(r._screw.hands[p2].length === n, 'skrew: and it ran that own power of the copied card');
    }

    // Nothing on the pile to copy: it is thrown as a plain بصرة instead.
    {
      const bare = skStart(['a', 'b'], { edition: 'sahib', teams: false });
      begin(bare, [['n1', 'n2'], ['n3', 'n4']], [], ['n5']);
      const first = bare.shared.order[0];
      bare._screw.pile = ['n5'];                       // numbers only
      bare._screw.deck.push('asYouLike');
      sk(bare, first, 'draw');
      sk(bare, first, 'discard');
      check(bare.shared.turn.stage === 'power' && bare.shared.turn.power === 'asYouLike', 'skrew: على كيفك still offers its power with a bare pile');
      const had = bare._screw.hands[first].length;
      sk(bare, first, 'power', { slot: slotOf(bare, first, 1) });
      const ev = bare.shared.events.filter((e) => e.type === 'asYouLike').pop();
      check(ev.as === 'basra' && ev.from === null && bare._screw.hands[first].length === had - 1 &&
        bare.shared.events.filter((e) => e.type === 'basra').length === 1,
        'skrew: with no command on the pile, على كيفك goes down as a plain بصرة');

      // The phone is shown only the top of the pile, and the rule is about
      // what the table can see: a command buried under that window is not
      // something anybody could point at, so it does not count.
      const deep = skStart(['a', 'b'], { edition: 'sahib', teams: false });
      begin(deep, [['n1', 'n2'], ['n3', 'n4']], [], ['n5']);
      const who = deep.shared.order[0];
      deep._screw.pile = ['seeSwap', 'n1', 'n2', 'n3', 'n4', 'n5', 'n6'];   // seeSwap is off the end
      deep._screw.deck.push('asYouLike');
      sk(deep, who, 'draw');
      sk(deep, who, 'discard');
      check(deep.shared.pile.indexOf('seeSwap') === -1, 'skrew: (the buried card is not on the phones’ pile)');
      // The payload is a بصرة's, because that is what it has to become.
      sk(deep, who, 'power', { as: 'seeSwap', slot: slotOf(deep, who, 1) });
      check(deep.shared.events.filter((e) => e.type === 'asYouLike').pop().as === 'basra',
        'skrew: a command buried below what the phones are shown cannot be copied');
    }

    drawPower(p0, 'cannon');
    sk(r, p0, 'power', { target: p1 });
    check(r.shared.exposed.join() === p1 && r.shared.hands[p1].every((h) => h.up) && r.shared.hands[p0].every((h) => !h.up), 'skrew: the cannon turns a hand face up for everyone');

    r._screw.deck = ['n1', 'n2', 'n3', 'n4'];
    drawPower(p1, 'khoshaf');
    sk(r, p1, 'power', {});
    check(r.shared.turn.stage === 'khoshaf' && r.secrets[p1].khoshaf.join() === 'n4,n3,n2,n1' && r.secrets[p0].khoshaf === null && r.shared.deckCount === 0,
      'skrew: الخشاف shows the top four to the player alone');
    sk(r, p1, 'khoshafPick', { index: 1 });
    check(r.shared.turn.stage === 'drawn' && r.secrets[p1].drawn === 'n3' && r._screw.deck.join() === 'n4,n2,n1', 'skrew: one is picked, the other three go under the deck');
    r._screw.drawn = 'p7';
    sk(r, p1, 'discard');
    check(r.shared.turn.pid === p1 && r.shared.turn.stage === 'power' && r.shared.turn.power === 'peekOwn', 'skrew: a card picked from الخشاف counts as drawn: thrown, its power works');
    sk(r, p1, 'skipPower');
    check(r.shared.turn.pid === p2, "skrew: a الخشاف pick's power can be skipped");

    const slotIds = () => r.shared.order.map((id) => r._screw.hands[id].map((e) => e.id).join('+'));
    const allCards = () => r.shared.order.map((id) => r._screw.hands[id].map((e) => e.card)).flat().sort().join();
    const before = slotIds();
    const cardsBefore = allCards();
    const countsBefore = r.shared.order.map((id) => r._screw.hands[id].length);
    // It plays itself off the deck: no discard and no 'power' to send.
    r._screw.deck.push('scream');
    r._screw.seen[p0] = [{ pid: p1, slot: slotOf(r, p1, 1), card: r._screw.hands[p1][0].card }];
    const seqScream = r.shared.turnSeq;
    sk(r, p2, 'draw');
    const sc = r.shared.events.filter((e) => e.type === 'scream').pop();
    check(slotIds().join() === before.join() && allCards() === cardsBefore && r.shared.order.every((id, i) => r._screw.hands[id].length === countsBefore[i]) &&
      sc && sc.pid === p2 && r.shared.order.every((id, i) => sc.counts[id] === countsBefore[i]) && Object.keys(sc).sort().join() === 'counts,pid,seq,type',
      'skrew: صرخة أوسكار gathers every hand and deals the same cards back: each player keeps their count and their slots');
    check(r.shared.order.every((id) => r.shared.hands[id].every((x) => x.h.how === 'scream' && x.h.by === p2 && x.h.from === null && x.h.known === null && x.h.looks.length === 0 && x.h.at === sc.seq)) &&
      r.shared.order.every((id) => r.secrets[id].seen === null),
      'skrew: after the scream nobody knows any card: every story starts again, and every look is forgotten');
    check(r.shared.hands[p1].every((h) => h.up) && r.shared.hands[p0].every((h) => !h.up) && r.shared.hands[p2].every((h) => !h.up),
      'skrew: a hand the cannon exposed stays face up with its new cards');
    check(r.shared.turn.pid === p2 && r.shared.turn.stage === 'choose' && r.shared.turnSeq > seqScream, 'skrew: after the scream the turn stays with the player: a whole new turn');

    drawPower(p2, 'p7');
    sk(r, p2, 'skipPower');
    check(r.shared.turn.pid === p0, 'skrew: a power can be skipped');
  }

  {
    // The caller's hand is protected; looking is still allowed.
    const r = skStart(['a', 'b', 'c'], { edition: 'custom', groups: ['oscar'], screwFromLap: 1 });
    begin(r, [['n1', 'n2'], ['n3', 'n4'], ['n5', 'n6']], ['n1', 'n1', 'n1', 'n1'], ['n5']);
    const [p0, p1, p2] = r.shared.order;
    sk(r, p0, 'screw');
    const powerOf = (pid, card) => { r._screw.deck.push(card); sk(r, pid, 'draw'); sk(r, pid, 'discard'); };
    powerOf(p1, 'swap');
    check(skThrew(r, p1, 'power', { slot: slotOf(r, p1, 1), target: p0, slot2: slotOf(r, p0, 1) }), 'skrew: no blind swap with the caller');
    check(skThrew(r, p1, 'power', { as: 'x' }) && r.shared.turn.stage === 'power', 'skrew: a refused power leaves the choice open');
    sk(r, p1, 'power', { slot: slotOf(r, p1, 1), target: p2, slot2: slotOf(r, p2, 1) });
    const callerHand = JSON.stringify(r._screw.hands[p0]);
    const others = [p1, p2].map((id) => r._screw.hands[id].map((e) => e.card)).flat().sort().join();
    r._screw.deck.push('scream');
    sk(r, p2, 'draw');
    const scr = r.shared.events.filter((e) => e.type === 'scream').pop();
    check(JSON.stringify(r._screw.hands[p0]) === callerHand && Object.keys(scr.counts).sort().join() === [p1, p2].sort().join() &&
      [p1, p2].map((id) => r._screw.hands[id].map((e) => e.card)).flat().sort().join() === others && r.shared.phase === 'play' && r.shared.turn.pid === p2,
      'skrew: the scream leaves the caller\'s hand where it is, and the turn stays with the player');
    sk(r, p2, 'draw'); sk(r, p2, 'discard');
    check(r.shared.phase === 'reveal', 'skrew: the new turn after the scream is still the last turn');
    const q = skStart(['a', 'b', 'c'], { edition: 'general', screwFromLap: 1 });
    begin(q, [['n1'], ['n3'], ['n5']], ['n1', 'n1', 'n1'], ['n5']);
    const [q0, q1] = q.shared.order;
    sk(q, q0, 'screw');
    q._screw.deck.push('s10'); sk(q, q1, 'draw'); sk(q, q1, 'discard');
    sk(q, q1, 'power', { target: q0, slot: slotOf(q, q0, 1) });
    check(q.secrets[q1].seen[0].card === 'n1', 'skrew: spying on the caller is allowed');
    // In teams the caller's partners are protected too.
    const t = skStart(['a', 'b', 'c', 'd', 'e', 'f'], { edition: 'general', teams: true, screwFromLap: 1 });
    begin(t, [['n1', 'n1'], ['n2', 'n2'], ['n3', 'n3'], ['n4', 'n4'], ['n5', 'n5'], ['n6', 'n6']], ['n1', 'n1', 'n1', 'n1'], ['n5']);
    const [t0, t1, t2, t3, t4, t5] = t.shared.order;
    sk(t, t0, 'screw');
    const power = (pid, c) => { t._screw.deck.push(c); sk(t, pid, 'draw'); sk(t, pid, 'discard'); };
    power(t1, 'swap');
    check(skThrew(t, t1, 'power', { slot: slotOf(t, t1, 1), target: t2, slot2: slotOf(t, t2, 1) }) && skThrew(t, t1, 'power', { slot: slotOf(t, t1, 1), target: t4, slot2: slotOf(t, t4, 1) }),
      'skrew: in teams no blind swap with any of the caller\'s side');
    t.shared.turn.power = 'give';
    check(skThrew(t, t1, 'power', { slot: slotOf(t, t1, 1), target: t2 }), 'skrew: no خد بس to the caller\'s partner');
    t.shared.turn.power = 'seeSwap';
    check(skThrew(t, t1, 'power', { target: t4, slot: slotOf(t, t4, 1) }), 'skrew: no شوف وبدّل on the caller\'s partner');
    t.shared.turn.power = 'cannon';
    check(skThrew(t, t1, 'power', { target: t4 }), 'skrew: no cannon on the caller\'s partner');
    t.shared.turn.power = 'boom';
    sk(t, t1, 'power', {});
    check(t.shared.turn.stage === 'boom' && t.shared.boom.waiting.join() === [t3, t5].join(), 'skrew: بوم after a سكرو in teams: only the other side throws, the player neither');
    check(skThrew(t, t2, 'boomPick', { slot: slotOf(t, t2, 1) }) && skThrew(t, t1, 'boomPick', { slot: slotOf(t, t1, 1) }), 'skrew: the protected side and the player have nothing to pick');
    sk(t, t3, 'boomPick', { slot: slotOf(t, t3, 1) });
    sk(t, t5, 'boomPick', { slot: slotOf(t, t5, 2) });
    check([t0, t2, t4].every((id) => t._screw.hands[id].length === 2) && t._screw.hands[t3].length === 1 && t._screw.hands[t5].length === 1 && t._screw.hands[t1].length === 2 &&
      t.shared.turn.pid === t1 && t.shared.turn.stage === 'choose', 'skrew: one card each from the other side; the turn comes back to the player');
    power(t1, 's9');
    sk(t, t1, 'power', { target: t2, slot: slotOf(t, t2, 1) });
    check(t.secrets[t1].seen[0].card === 'n3', 'skrew: spying on the caller\'s partner is allowed');
    const sideBefore = JSON.stringify([t0, t2, t4].map((id) => t._screw.hands[id]));
    const restCards = [t1, t3, t5].map((id) => t._screw.hands[id].map((e) => e.card)).flat().sort().join();
    power(t2, 's9');
    sk(t, t2, 'skipPower');
    t._screw.deck.push('scream');
    sk(t, t3, 'draw');
    const ts = t.shared.events.filter((e) => e.type === 'scream').pop();
    check(JSON.stringify([t0, t2, t4].map((id) => t._screw.hands[id])) === sideBefore && Object.keys(ts.counts).sort().join() === [t1, t3, t5].sort().join() &&
      ts.counts[t1] === 2 && ts.counts[t3] === 1 && ts.counts[t5] === 1 && [t1, t3, t5].map((id) => t._screw.hands[id].map((e) => e.card)).flat().sort().join() === restCards,
      'skrew: the scream leaves the whole protected side out; the other side\'s cards are dealt back among themselves');
  }

  {
    // A ping in the last lap costs the skipped player their last turn; a known card stays known through a swap.
    const r = skStart(['a', 'b', 'c', 'd'], { edition: 'general', screwFromLap: 1 });
    begin(r, [['n1'], ['n2', 'n3'], ['n3'], ['n4']], ['n6', 'ping', 'n6', 'n6'], ['n5']);
    const [p0, p1, p2, p3] = r.shared.order;
    sk(r, p0, 'match', { slot: slotOf(r, p0, 1) });            // 1 on 5: wrong, shown
    check(r.shared.hands[p0][0].up === null && r.shared.hands[p0][0].h.known === 'n1', 'skrew: a wrong match goes back face down, known to the table');
    const seq = r.shared.turnSeq;
    sk(r, p1, 'draw');
    check(r.shared.turnSeq === seq + 1, 'skrew: a new stage moves turnSeq');
    sk(r, p1, 'discard');
    sk(r, p2, 'screw');
    check(r.shared.finalLeft.join() === [p3, p0, p1].join(), 'skrew: the last turns in seat order after the caller');
    r._screw.deck.push('swap');
    sk(r, p3, 'draw'); sk(r, p3, 'discard');
    sk(r, p3, 'power', { slot: slotOf(r, p3, 1), target: p0, slot2: slotOf(r, p0, 1) });
    check(r.shared.hands[p3][0].h.known === 'n1' && r.shared.hands[p3][0].up === null && r.shared.hands[p0][0].h.known === null,
      'skrew: a card the table has seen stays known where a swap takes it');
    sk(r, p0, 'draw');   // the ping
    check(r.shared.phase === 'thiefGuess' && r.shared.events.some((e) => e.type === 'ping' && e.target === p1) && r.shared.finalLeft.length === 0,
      'skrew: a ping in the last lap skips the last one, and the round is over');
    // Laps: a ping stepping over the first seat still counts the lap.
    const l = skStart(['a', 'b', 'c'], { edition: 'sahib', screwFromLap: 2 });
    begin(l, [['n1'], ['n2'], ['n3']], ['n6', 'ping', 'n6'], ['n5']);
    const [l0, l1, l2] = l.shared.order;
    sk(l, l0, 'draw'); sk(l, l0, 'discard');
    sk(l, l1, 'draw');   // the ping: l2 is skipped and l0, the first seat, is up
    check(l.shared.turn.pid === l0 && l.shared.lap === 2 && l.shared.events.slice(-1)[0].target === l2, 'skrew: a ping over the first seat is a new lap');
    // The player being looked at leaves in the middle of a شوف وبدّل.
    const q = skStart(['a', 'b', 'c'], { edition: 'thief' });
    begin(q, [['n1'], ['n2'], ['n3']], ['n6', 'seeSwap'], ['n5']);
    const [q0, q1, q2] = q.shared.order;
    sk(q, q0, 'draw'); sk(q, q0, 'discard');
    sk(q, q0, 'power', { target: q1, slot: slotOf(q, q1, 1) });
    leave(q, q1);
    check(q.shared.turn.pid === q2 && q.secrets[q0].seen === null && q.shared.events.slice(-1)[0].swapped === false, 'skrew: the look ends with nothing swapped when its hand leaves');
  }

  {
    // المسحراتي: a سكرو now, by whoever drew it.
    const r = skStart(['a', 'b', 'c'], { edition: 'mesaharaty', screwFromLap: 3 });
    begin(r, [['n1'], ['n2'], ['n3']], ['mesaharaty', 'n6'], ['n5']);
    const [p0, p1] = r.shared.order;
    sk(r, p0, 'draw');
    sk(r, p0, 'discard');
    sk(r, p1, 'draw');
    check(r.shared.phase === 'reveal' && r.shared.results.caller === p1 && r.shared.pile.indexOf('mesaharaty') !== -1 && r.shared.events.some((e) => e.type === 'wakeUp' && e.pid === p1),
      'skrew: المسحراتي reveals the round at once, the drawer as the caller');
    check(r.shared.results.round[p1] === 4 && r.shared.results.callerDouble, 'skrew: and the drawer is scored as a caller');
    // After a سكرو: the last turns stop at once, and whoever called stays the caller.
    const m = skStart(['a', 'b', 'c'], { edition: 'mesaharaty', screwFromLap: 1 });
    begin(m, [['n1'], ['n2'], ['n3']], ['n6', 'mesaharaty'], ['n5']);
    const [m0, m1, m2] = m.shared.order;
    sk(m, m0, 'screw');
    sk(m, m1, 'draw');
    check(m.shared.phase === 'reveal' && m.shared.results.caller === m0 && m.shared.results.round[m0] === 0 && m.shared.results.round[m1] === 2 && !m.shared.events.some((e) => e.pid === m2 && e.type !== 'ready') &&
      m.shared.events.some((e) => e.type === 'wakeUp' && e.pid === m1),
      'skrew: المسحراتي after a سكرو ends the round at once, and the caller stays the one who called');
  }

  {
    // Memorizing on a clock (a lobby option): play starts by itself when it runs out.
    let r = skStart(['a', 'b', 'c'], { memorizeSecs: 5 });
    check(r.shared.settings.memorizeSecs === 5 && r.shared.phase === 'memorize' && r.shared.endsAt === clock + 5000 && roomDeadline(r) === clock + 6500,
      'skrew: memorize for 5 seconds: a clock the server watches');
    sk(r, r.shared.order[0], 'ready');
    check(r.shared.phase === 'memorize' && roomTimeout(r, clock + 1000) === false, 'skrew: before the clock runs out, memorizing goes on');
    const seq = r.shared.turnSeq;
    check(roomTimeout(r, clock + 7000) === true && r.shared.phase === 'play' && r.shared.turn.pid === r.shared.order[0] && r.shared.endsAt === null &&
      r.shared.order.every((id) => r.secrets[id].memorize === null) && r.shared.turnSeq === seq + 1,
      'skrew: time up: play starts, the cards leave every phone, and turnSeq moves on');
    r = skStart(['a', 'b', 'c'], { memorizeSecs: 10, turnClock: 30 });
    r.shared.order.forEach((id) => sk(r, id, 'ready'));
    check(r.shared.phase === 'play' && r.shared.endsAt === clock + 30000, 'skrew: everyone memorized before the clock: play starts, on the turn clock');
    r = skStart(['a', 'b', 'c']);
    check(r.shared.settings.memorizeSecs === 0 && r.shared.endsAt === null && roomDeadline(r) === null, 'skrew: memorize has no clock by default');
    r = skStart(['a', 'b'], { memorizeSecs: 7, rounds: 3 });
    check(r.shared.settings.memorizeSecs === 0, 'skrew: only 0, 5 or 10 seconds');
    r = skStart(['a', 'b'], { memorizeSecs: 10, rounds: 3 });
    for (let k = 0; k < 3; k++) {
      if (r.shared.phase === 'memorize') r.shared.order.forEach((id) => sk(r, id, 'ready'));
      callAndFinish(r);
      if (r.shared.phase === 'reveal') {
        applyRoomAction(r, r.hostId, 'nextRound', { round: r.shared.round });
        if (k === 0) check(r.shared.phase === 'memorize' && r.shared.endsAt === clock + 10000, 'skrew: every deal starts the memorize clock again');
      }
    }
    applyRoomAction(r, r.hostId, 'playAgain', {});
    check(r.shared.settings.memorizeSecs === 10 && r.shared.endsAt === clock + 10000, 'skrew: play again keeps the memorize clock');
  }

  {
    // الحرامي: the table votes on every phone, the votes stay on the server until the close.
    const thiefRoom = (ids, cards, opts) => {
      const r = skStart(ids, Object.assign({ edition: 'thief' }, opts));
      begin(r, cards, ['n6', 'n6', 'n6', 'n6', 'n6'], ['n5']);
      callAndFinish(r);
      return r;
    };
    const vote = (r, pid, target, seq) => applyRoomAction(r, pid, 'thiefVote', { seq: seq === undefined ? r.shared.turnSeq : seq, pid: target });
    const noVotesOut = (r) => JSON.stringify(r.shared).indexOf('"votes"') === -1 && JSON.stringify(r.secrets).indexOf('"votes"') === -1 && r.shared.results === null;
    const four = ['a', 'b', 'c', 'd'];

    // Majority, the holder caught; votes from every phone at once, and a change of mind.
    let r = thiefRoom(four, [['n1'], ['thief', 'n2'], ['n3'], ['n4']]);
    let [s0, s1, s2, s3] = r.shared.order;
    check(r.shared.phase === 'thiefGuess' && r.shared.thiefVote && r.shared.thiefVote.voted.length === 0 && r.shared.order.every((id) => r.shared.hands[id].every((h) => !h.up)) && noVotesOut(r),
      'skrew: the round over, the table votes on who holds the thief, every card still face down');
    const seq0 = r.shared.turnSeq;
    vote(r, s1, s1, seq0);
    vote(r, s2, s1, seq0);
    vote(r, s3, s2, seq0);
    check(r.shared.thiefVote.voted.join() === [s1, s2, s3].join() && r.shared.turnSeq === seq0 && r.shared.phase === 'thiefGuess',
      "skrew: votes sent together all count: one phone's vote doesn't make another's stale");
    check(noVotesOut(r) && r.shared.events.filter((e) => e.type === 'thiefVote').every((e) => Object.keys(e).sort().join() === 'pid,seq,type'),
      'skrew: who voted is public, what they voted is not (not in shared, not in any slice, not in the events)');
    vote(r, s3, s1);
    check(r.shared.thiefVote.voted.length === 3 && r.shared.events.filter((e) => e.type === 'thiefVote').length === 3, 'skrew: a vote can be changed until the close');
    check(threw(() => vote(r, 'zz', s1)) && threw(() => vote(r, s0, 'zz')), 'skrew: only a seated player votes, for a seated player or nobody');
    vote(r, s0, s2);
    let th = r.shared.results && r.shared.results.thief;
    check(r.shared.phase === 'reveal' && th && th.holder === s1 && th.accused === s1 && th.caught && !th.stole && !th.skipped && th.victims.length === 0,
      'skrew: the last vote closes it; the most votes accuse the holder: caught');
    check(th.votes[s0] === s2 && th.votes[s1] === s1 && th.votes[s2] === s1 && th.votes[s3] === s1 && Object.keys(th.votes).length === 4,
      'skrew: the votes are published with the result');
    check(r.shared.results.round[s1] === 37 && r.shared.results.round[s0] === 0 && r.shared.results.round[s2] === 3 && r.shared.thiefVote === null,
      'skrew: caught: the thief takes +25, the lowest keeps its 0');
    const acc = r.shared.events.filter((e) => e.type === 'accuse').pop();
    check(acc && acc.accused === s1 && acc.caught === true && r.shared.events.slice(-1)[0].type === 'reveal', 'skrew: an accuse event, then the reveal');
    const after = JSON.stringify(r.shared.results);
    vote(r, s0, s3, seq0);
    vote(r, s0, s3);
    check(JSON.stringify(r.shared.results) === after, 'skrew: a vote after the close is dropped quietly');

    // A tie decided by the caller's vote; unnoticed, the thief steals the lowest score.
    r = thiefRoom(four, [['n1'], ['thief', 'n2'], ['n3'], ['n4']]);
    [s0, s1, s2, s3] = r.shared.order;
    vote(r, s0, s2); vote(r, s1, s2); vote(r, s2, s1); vote(r, s3, s1);
    th = r.shared.results.thief;
    check(th.accused === s2 && !th.caught && th.stole && th.victims.join() === s0 && th.score === 0 && r.shared.results.round[s1] === 0 && r.shared.results.round[s0] === 25 && r.shared.results.round[s2] === 3,
      'skrew: a tie goes to the caller\'s choice; the table missed: the thief steals the lowest score and its owner takes the +25');
    check(r.shared.scores[s0] === 25 && r.shared.scores[s1] === 0, 'skrew: the running scores carry the thief');

    // A tie the caller's vote isn't part of: nobody accused.
    r = thiefRoom(['a', 'b', 'c', 'd', 'e'], [['n1'], ['thief', 'n2'], ['n3'], ['n4'], ['n5']]);
    const f = r.shared.order;
    vote(r, f[0], f[4]); vote(r, f[1], f[2]); vote(r, f[2], f[2]); vote(r, f[3], f[1]); vote(r, f[4], f[1]);
    th = r.shared.results.thief;
    check(th.accused === null && !th.skipped && th.stole && r.shared.results.round[f[1]] === 0 && r.shared.results.round[f[0]] === 25,
      'skrew: a tie without the caller\'s choice in it accuses nobody');

    // The host closes with no votes: nobody accused, and every unit tied on the lowest score takes +25.
    r = thiefRoom(four, [['minus1'], ['thief'], ['green0'], ['n4']]);
    [s0, s1, s2, s3] = r.shared.order;
    check(threw(() => applyRoomAction(r, s1, 'closeThiefVote', { seq: r.shared.turnSeq })) || r.hostId === s1, 'skrew: only the host closes the vote');
    applyRoomAction(r, r.hostId, 'closeThiefVote', { seq: r.shared.turnSeq });
    th = r.shared.results.thief;
    const rr = r.shared.results.round;
    check(th.skipped && th.accused === null && th.stole && th.victims.slice().sort().join() === [s0, s2].sort().join() && rr[s1] === 0 && rr[s0] === 25 && rr[s2] === 25 && rr[s3] === 4 && Object.keys(th.votes).length === 0,
      'skrew: no votes: nobody accused; tied on the lowest, each takes the +25 the thief stole');

    // The thief's own score is already the lowest: nothing happens (the caller holding it too).
    r = thiefRoom(four, [['n6', 'n6'], ['thief'], ['n5', 'n6'], ['n6', 'n6', 'n1']]);
    [s0, s1, s2, s3] = r.shared.order;
    applyRoomAction(r, r.hostId, 'skipTurn', { seq: r.shared.turnSeq });
    th = r.shared.results.thief;
    check(th.skipped && !th.stole && !th.caught && th.victims.length === 0 && r.shared.results.round[s1] === 0 && r.shared.results.round[s0] === 24,
      'skrew: the host\'s skip closes the vote too; a thief already on the lowest score steals nothing');
    r = thiefRoom(four, [['thief'], ['n6', 'n6'], ['n6', 'n5'], ['n6', 'n6', 'n1']]);
    [s0] = r.shared.order;
    r.shared.order.forEach((id) => vote(r, id, null));
    th = r.shared.results.thief;
    check(th.holder === s0 && !th.stole && !th.caught && r.shared.results.round[s0] === 0, 'skrew: the caller holding the thief, unnoticed and lowest: nothing');

    // Nobody holds it: nothing changes, whatever the table said.
    r = thiefRoom(four, [['n1'], ['n2'], ['n3'], ['n4']]);
    [s0, s1] = r.shared.order;
    r.shared.order.forEach((id) => vote(r, id, s1));
    th = r.shared.results.thief;
    check(th.holder === null && th.accused === s1 && !th.caught && !th.stole && r.shared.results.round[s0] === 0 && r.shared.results.round[s1] === 2,
      'skrew: nobody holds the thief: the vote changes nothing');

    // The clock closes the vote with the votes cast.
    r = thiefRoom(four, [['n1'], ['thief'], ['n3'], ['n4']], { turnClock: 30 });
    [s0, s1] = r.shared.order;
    check(r.shared.phase === 'thiefGuess' && r.shared.endsAt === clock + 30000 && roomDeadline(r) === clock + 31500, 'skrew: the vote runs on the turn clock');
    vote(r, s0, s1);
    clock += 32000;
    check(roomTimeout(r, clock) === true && r.shared.phase === 'reveal' && r.shared.results.thief.caught && !r.shared.results.thief.skipped, 'skrew: time up: the vote closes with the votes cast');

    // Leaving: a voter's vote goes; everyone left having voted closes it.
    r = thiefRoom(four, [['n1'], ['thief'], ['n3'], ['n4']]);
    [s0, s1, s2, s3] = r.shared.order;
    vote(r, s3, s1);
    vote(r, s1, s2);
    vote(r, s2, s2);
    leave(r, s3);
    check(r.shared.phase === 'thiefGuess' && r.shared.thiefVote.voted.join() === [s1, s2].join(), 'skrew: a voter who leaves takes their vote with them');
    leave(r, s0);
    th = r.shared.results && r.shared.results.thief;
    check(r.shared.phase === 'reveal' && th && Object.keys(th.votes).sort().join() === [s1, s2].sort().join() && th.accused === s2 && r.shared.results.caller === null,
      'skrew: the last one who hadn\'t voted leaving closes the vote');
    // An older phone's caller guess counts as its vote.
    r = thiefRoom(four, [['n1'], ['thief'], ['n3'], ['n4']]);
    [s0, s1] = r.shared.order;
    applyRoomAction(r, s0, 'thiefGuess', { seq: r.shared.turnSeq, pid: s1 });
    check(r.shared.thiefVote.voted.join() === s0 && r.shared.phase === 'thiefGuess', 'skrew: an older page\'s thiefGuess is taken as that phone\'s vote');

    // Teams: the thief's side steals the lowest side's score.
    r = skStart(four, { edition: 'custom', groups: ['sahib', 'thief'], teams: true });
    begin(r, [['n1'], ['thief'], ['n1'], ['n2']], ['n6', 'n6', 'n6', 'n6'], ['n5']);
    callAndFinish(r);
    [s0, s1, s2, s3] = r.shared.order;
    applyRoomAction(r, r.hostId, 'closeThiefVote', { seq: r.shared.turnSeq });
    th = r.shared.results.thief;
    const tr = r.shared.results.round;
    check(th.stole && th.victims.join() === 'A' && tr.A === 25 && tr.B === 0 && tr[s0] === 25 && tr[s2] === 25 && tr[s1] === 0 && tr[s3] === 0 && r.shared.teamScores.A === 25 && r.shared.teamScores.B === 0,
      'skrew: in teams the thief\'s side takes the lowest side\'s score, and that side the +25');

    // Two decks bring one thief.
    const big = skStart(['a', 'b', 'c', 'd', 'e', 'f', 'g'], { edition: 'thief' });
    const all = big._screw.deck.concat(big._screw.pile, ...Object.values(big._screw.hands).map((h) => h.map((e) => e.card)));
    check(big.shared.settings.decks === 2 && all.filter((c) => c === 'thief').length === 1 && all.filter((c) => c === 'seeSwap').length === 2, 'skrew: two decks, one thief');
  }

  {
    // سرقة الحرامي (a house rule): the thief played as a steal - a look at another player's card, then a forced swap.
    const three = ['a', 'b', 'c'];
    let r = skStart(three, { edition: 'thief', thiefSteal: true });
    check(r.shared.settings.thiefSteal === true && skStart(three, { edition: 'thief' }).shared.settings.thiefSteal === false &&
      skStart(three, { edition: 'classic', thiefSteal: true }).shared.settings.thiefSteal === false,
      'skrew: سرقة الحرامي is a lobby option, off by default, and only with the thief in the deck');
    begin(r, [['n1', 'n2'], ['n3', 'n4'], ['n5', 'n6']], ['n6', 'n6', 'n6', 'n6'], ['n5']);
    let [p0, p1, p2] = r.shared.order;
    r._screw.deck.push('thief');
    sk(r, p0, 'draw');
    check(skThrew(r, p0, 'discard') && skThrew(r, p0, 'thiefSteal', { target: p0, slot: slotOf(r, p0, 1) }),
      'skrew: a drawn thief still can\'t just be thrown, and the steal is from another player');
    const seq = r.shared.turnSeq;
    const aimed = slotOf(r, p1, 2);
    sk(r, p0, 'thiefSteal', { target: p1, slot: aimed });
    const tev = r.shared.events.slice(-1)[0];
    check(r.shared.turn.stage === 'steal' && r.shared.turn.look.target === p1 && r.shared.turn.look.slot === aimed && r.shared.turnSeq > seq &&
      r.shared.pile.slice(-1)[0] === 'thief' && r.secrets[p0].drawn === null &&
      tev.type === 'thiefSteal' && Object.keys(tev).sort().join() === 'pid,seq,slot,target,type' && tev.pid === p0 && tev.target === p1 && tev.slot === aimed,
      'skrew: a drawn thief played as a steal goes face up on the pile, and the turn moves to the steal');
    check(JSON.stringify(r.secrets[p0].seen) === JSON.stringify([{ pid: p1, slot: aimed, card: 'n4' }]) && r.secrets[p1].seen === null && r.secrets[p2].seen === null &&
      JSON.stringify(r.shared).indexOf('"n4"') === -1 && r.shared.hands[p1][1].h.looks.join() === p0,
      "skrew: the stolen card is shown on the stealer's phone alone; the table sees which slot, and that the stealer looked");
    check(skThrew(r, p0, 'stealSwap', {}) && r.shared.turn.stage === 'steal', 'skrew: the swap is forced: leaving it is refused');
    const mine = slotOf(r, p0, 1);
    sk(r, p0, 'stealSwap', { slot: mine });
    const sw = r.shared.events.slice(-1)[0];
    check(r._screw.hands[p0][0].card === 'n4' && r._screw.hands[p1][1].card === 'n1' && sw.type === 'stealSwap' && sw.pid === p0 && sw.slot === mine && sw.target === p1 && sw.slot2 === aimed &&
      r.shared.turn.pid === p1 && r.secrets[p0].seen === null,
      "skrew: then one of the stealer's own cards for it, and the turn ends");
    check(r.shared.hands[p0][0].h.how === 'swap' && r.shared.hands[p0][0].h.looks.includes(p0) && r.shared.hands[p1][1].h.how === 'swap' && r.shared.hands[p1][1].h.from.pid === p0,
      'skrew: the swapped cards\' stories say so, and who has looked');
    check(skThrew(r, p1, 'thiefSteal', { target: p2, slot: slotOf(r, p2, 1) }) && skThrew(r, p1, 'takePile', { slot: slotOf(r, p1, 1) }),
      'skrew: a thief spent on a steal is out for the round: not stolen with again, not taken from the pile');
    callAndFinish(r);
    check(r.shared.phase === 'reveal' && r.shared.results.thief === null && r.shared.thiefVote === null && !r.shared.events.some((e) => e.type === 'accuse'),
      'skrew: with the thief spent, the round ends without the vote');

    // From the top of the pile as the turn starts; the host's skip swaps a card at random.
    r = skStart(three, { edition: 'thief', thiefSteal: true });
    begin(r, [['n1', 'n2'], ['n3', 'n4'], ['n5', 'n6']], ['n6', 'n6', 'n6'], ['n2', 'n5', 'thief']);
    [p0, p1, p2] = r.shared.order;
    sk(r, p0, 'thiefSteal', { target: p2, slot: slotOf(r, p2, 1) });
    check(r.shared.turn.stage === 'steal' && r._screw.pile.join() === 'n2,n5,thief' && r.secrets[p0].seen[0].card === 'n5',
      'skrew: the thief on top of the pile as the turn starts can be played as a steal');
    sk(r, r.hostId, 'skipTurn');
    const rs = r.shared.events.slice(-1)[0];
    check(rs.type === 'stealSwap' && rs.target === p2 && r._screw.hands[p0].find((e) => e.id === rs.slot).card === 'n5' && ['n1', 'n2'].includes(r._screw.hands[p2][0].card) && r.shared.turn.pid === p1,
      "skrew: the host's skip during a steal swaps one of the stealer's cards at random");
    // A spent thief doesn't go back into the deck when the pile is shuffled in.
    r._screw.pile = ['thief', 'n2', 'n5'];
    r._screw.deck = [];
    sk(r, p1, 'draw');
    check(r._screw.pile.join() === 'n5' && r._screw.deck.length === 0 && r.secrets[p1].drawn === 'n2', 'skrew: a spent thief stays out when the pile becomes the deck');
    sk(r, p1, 'discard');
    callAndFinish(r);
    check(r.shared.phase === 'reveal' && r.shared.results.thief === null, 'skrew: a thief out of the round: no vote');

    // Picked with الخشاف.
    r = skStart(three, { edition: 'custom', groups: ['thief', 'mesaharaty'], thiefSteal: true });
    begin(r, [['n1', 'n2'], ['n3', 'n4'], ['n5', 'n6']], ['n6', 'n6'], ['n5']);
    [p0, p1, p2] = r.shared.order;
    r._screw.deck.push('n3', 'thief', 'khoshaf');
    sk(r, p0, 'draw'); sk(r, p0, 'discard'); sk(r, p0, 'power', {});
    sk(r, p0, 'khoshafPick', { index: r.secrets[p0].khoshaf.indexOf('thief') });
    check(r.shared.turn.stage === 'drawn' && r.secrets[p0].drawn === 'thief', 'skrew: the thief picked with الخشاف is in hand, drawn');
    sk(r, p0, 'thiefSteal', { target: p1, slot: slotOf(r, p1, 1) });
    sk(r, p0, 'stealSwap', { slot: slotOf(r, p0, 2) });
    check(r.shared.pile.includes('thief') && r._screw.hands[p0][1].card === 'n3' && r.shared.turn.pid === p1, 'skrew: a thief picked with الخشاف can be played as a steal');

    // The protected side after a سكرو can't be stolen from; without the house rule there is no steal.
    r = skStart(three, { edition: 'thief', thiefSteal: true });
    begin(r, [['n1'], ['n3', 'n4'], ['n5', 'n6']], ['n6', 'n6', 'n6', 'thief'], ['n5']);
    [p0, p1, p2] = r.shared.order;
    sk(r, p0, 'screw');
    sk(r, p1, 'draw');
    check(skThrew(r, p1, 'thiefSteal', { target: p0, slot: slotOf(r, p0, 1) }), 'skrew: no stealing from the protected caller');
    sk(r, p1, 'thiefSteal', { target: p2, slot: slotOf(r, p2, 1) });
    sk(r, p1, 'stealSwap', { slot: slotOf(r, p1, 1) });
    check(r.shared.turn.pid === p2, 'skrew: stealing from a player off the protected side works');
    r = skStart(three, { edition: 'thief' });
    begin(r, [['n1'], ['n3', 'n4'], ['n5', 'n6']], ['n6', 'n6', 'thief'], ['n5']);
    [p0, p1] = r.shared.order;
    sk(r, p0, 'draw');
    check(skThrew(r, p0, 'thiefSteal', { target: p1, slot: slotOf(r, p1, 1) }), 'skrew: without the house rule the thief steals nothing');

    // A thief lying on the pile at the end: no vote with the house rule, the vote as before without it.
    r = skStart(three, { edition: 'thief', thiefSteal: true });
    begin(r, [['n1'], ['n2'], ['n3']], ['n6', 'n6', 'n6'], ['n5', 'thief']);
    callAndFinish(r);
    check(r.shared.phase === 'reveal' && r.shared.results.thief === null, 'skrew: with the house rule, a thief lying on the pile at the end: no vote');
    r = skStart(three, { edition: 'thief' });
    begin(r, [['n1'], ['n2'], ['n3']], ['n6', 'n6', 'n6'], ['n5', 'thief']);
    callAndFinish(r);
    check(r.shared.phase === 'thiefGuess', 'skrew: without it, the vote as before');

    // The player being stolen from leaves: nothing to swap, the turn ends.
    r = skStart(three, { edition: 'thief', thiefSteal: true });
    begin(r, [['n1', 'n2'], ['n3', 'n4'], ['n5', 'n6']], ['n6', 'n6', 'n6'], ['n5', 'thief']);
    [p0, p1, p2] = r.shared.order;
    sk(r, p0, 'thiefSteal', { target: p1, slot: slotOf(r, p1, 1) });
    leave(r, p1);
    check(r.shared.turn.pid === p2 && r.shared.turn.stage === 'choose' && r.secrets[p0].seen === null, 'skrew: the player stolen from leaving ends the steal');
  }

  {
    // بصرة الفريق (a house rule, teams only): on your turn, throw one of your partner's cards.
    const four = ['a', 'b', 'c', 'd'];
    const sahib = (opts) => skStart(four, Object.assign({ edition: 'sahib', teams: true }, opts));
    let r = sahib({ teamBasra: true });
    check(r.shared.settings.teamBasra === true && sahib({}).shared.settings.teamBasra === false && skStart(four, { edition: 'classic', teamBasra: true }).shared.settings.teamBasra === false,
      'skrew: بصرة الفريق is a lobby option, off by default, teams only');
    begin(r, [['n1', 'n2'], ['n3'], ['n3', 'n4'], ['n6']], ['n6', 'n6', 'n6', 'n6'], ['n3']);
    let [s0, s1, s2, s3] = r.shared.order;
    const partnerSlot = slotOf(r, s2, 1);
    sk(r, s0, 'match', { slot: partnerSlot, owner: s2 });
    let mev = r.shared.events.slice(-1)[0];
    check(r._screw.hands[s2].length === 1 && r._screw.hands[s0].length === 2 && r.shared.pile.slice(-1)[0] === 'n3' &&
      mev.type === 'match' && mev.ok === true && mev.owner === s2 && mev.pid === s0 && mev.slot === partnerSlot && r.shared.turn.pid === s1,
      "skrew: a partner's matching card thrown: it leaves the partner's hand, and the event names whose it was");
    sk(r, r.hostId, 'skipTurn');
    const wrongSlot = slotOf(r, s0, 1);
    sk(r, s2, 'match', { slot: wrongSlot, owner: s0 });
    mev = r.shared.events.filter((e) => e.type === 'match').pop();
    const pen = r.shared.events.slice(-1)[0];
    check(mev.ok === false && mev.owner === s0 && mev.card === 'n1' && r._screw.hands[s0].length === 2 && r.shared.hands[s0][0].up === null && r.shared.hands[s0][0].h.known === 'n1' &&
      r._screw.hands[s2].length === 2 && pen.type === 'penalty' && pen.pid === s2 && r.shared.hands[s2][1].h.how === 'penalty' && r.shared.hands[s2][1].h.by === s2,
      "skrew: a wrong one goes back face down in the partner's slot, known, and the penalty card is the thrower's");
    const quiet = (x) => JSON.stringify(x.shared);
    let before = quiet(r);
    sk(r, s3, 'match', { slot: slotOf(r, s0, 2), owner: s0 });
    check(quiet(r) === before && r.shared.turn.pid === s3, "skrew: an opponent's card is refused quietly");
    // Emptying the partner's hand ends the round: the partner is the finisher.
    r = sahib({ teamBasra: true });
    begin(r, [['n5', 'n6'], ['n3'], ['n3'], ['n6']], ['n6', 'n6', 'n6', 'n6'], ['n3']);
    [s0, s1, s2, s3] = r.shared.order;
    sk(r, s0, 'match', { slot: slotOf(r, s2, 1), owner: s2 });
    check(r.shared.phase === 'reveal' && r.shared.results.finisher === s2 && r.shared.results.round.A === 0, "skrew: emptying the partner's hand ends the round, the partner the finisher");
    // Refused quietly: without teams, without the house rule, and on a protected partner.
    const refused = (x, thrower, owner, label) => {
      before = quiet(x);
      sk(x, thrower, 'match', { slot: slotOf(x, owner, 1), owner });
      check(quiet(x) === before && x.shared.turn.pid === thrower, label);
    };
    r = skStart(four, { edition: 'classic', teamBasra: true });
    begin(r, [['n1'], ['n2'], ['n3'], ['n4']], ['n6', 'n6'], ['n3']);
    refused(r, r.shared.order[0], r.shared.order[2], "skrew: without teams nobody throws another player's card");
    r = sahib({});
    begin(r, [['n1'], ['n2'], ['n3'], ['n4']], ['n6', 'n6'], ['n3']);
    refused(r, r.shared.order[0], r.shared.order[2], "skrew: without the house rule nobody throws a partner's card");
    r = sahib({ teamBasra: true });
    begin(r, [['n1'], ['n2'], ['n3', 'n3'], ['n4']], ['n6', 'n6', 'n6', 'n6'], ['n1']);
    [s0, s1, s2, s3] = r.shared.order;
    sk(r, s0, 'screw');
    sk(r, r.hostId, 'skipTurn');
    refused(r, s2, s0, "skrew: a partner who called سكرو is protected: their cards can't be thrown");
  }

  {
    // A hand that runs out ends the round at once: a throw, بصرة, خد بس, Pong, بوم.
    let r = skStart(['a', 'b', 'c']);
    begin(r, [['n3'], ['n5', 'n6'], ['n2', 'n4']], ['n6', 'n6', 'n6'], ['n3']);
    let [p0, p1, p2] = r.shared.order;
    sk(r, p0, 'match', { slot: slotOf(r, p0, 1) });
    let res = r.shared.results;
    check(r.shared.phase === 'reveal' && r.shared.finisher === p0 && res && res.finisher === p0 && r.shared.turn === null && res.round[p0] === 0 && res.round[p1] === 11 && res.round[p2] === 6 && res.lowest.join() === p0 && !res.callerDouble,
      'skrew: the last card thrown right ends the round at once: the finisher scores 0, everyone else their total');
    check(r.shared.events.slice(-3).map((e) => e.type).join() === 'match,finish,reveal' && r.shared.events.slice(-2)[0].pid === p0, 'skrew: a finish event names who emptied their hand');

    // With a caller: the finisher still wins and the caller is doubled.
    r = skStart(['a', 'b', 'c']);
    begin(r, [['n1', 'n1'], ['n3'], ['n2', 'n4']], ['n6', 'n6', 'n6'], ['n5']);
    [p0, p1, p2] = r.shared.order;
    sk(r, p0, 'screw');
    r._screw.pile.push('n3');
    sk(r, p1, 'match', { slot: slotOf(r, p1, 1) });
    res = r.shared.results;
    check(r.shared.phase === 'reveal' && res.finisher === p1 && res.caller === p0 && res.round[p1] === 0 && res.round[p0] === 4 && res.round[p2] === 6 && res.callerDouble && !r.shared.events.some((e) => e.pid === p2 && e.type !== 'deal' && e.type !== 'ready'),
      'skrew: an empty hand in the last turns ends the round before the rest play; the caller, beaten, is doubled');
    // A finisher in -1 land still loses to 0 cards, and a caller on a negative total is doubled.
    r = skStart(['a', 'b', 'c']);
    begin(r, [['minus1'], ['n3'], ['n5']], ['n6', 'n6', 'n6'], ['n5']);
    [p0, p1, p2] = r.shared.order;
    sk(r, p0, 'screw');
    r._screw.pile.push('n3');
    sk(r, p1, 'match', { slot: slotOf(r, p1, 1) });
    res = r.shared.results;
    check(res.round[p1] === 0 && res.round[p0] === -2 && res.round[p2] === 5 && res.callerDouble, 'skrew: 0 cards beat a caller on -1, who is doubled to -2');

    // بصرة on the last card.
    r = skStart(['a', 'b', 'c']);
    begin(r, [['n2'], ['n5'], ['n6']], ['n6', 'basra'], ['n4']);
    [p0, p1] = r.shared.order;
    sk(r, p0, 'draw'); sk(r, p0, 'discard');
    sk(r, p0, 'power', { slot: slotOf(r, p0, 1) });
    check(r.shared.phase === 'reveal' && r.shared.results.finisher === p0 && r.shared.results.round[p0] === 0 && r.shared.results.round[p1] === 5, 'skrew: بصرة on the last card ends the round');

    // خد بس on the last card: the giver finishes; with الحرامي in the deck the table votes first.
    r = skStart(['a', 'b', 'c'], { edition: 'thief' });
    begin(r, [['n2'], ['n5'], ['n6']], ['n6', 'takeOnly'], ['n4']);
    [p0, p1, p2] = r.shared.order;
    sk(r, p0, 'draw'); sk(r, p0, 'discard');
    sk(r, p0, 'power', { slot: slotOf(r, p0, 1), target: p1 });
    check(r.shared.phase === 'thiefGuess' && r.shared.finisher === p0 && r.shared.turn === null && r._screw.hands[p1].length === 2 && r.shared.results === null,
      'skrew: خد بس on the last card: the giver finishes, and the table votes on the thief before the reveal');
    // The finisher leaves during the vote: the round stays over, nobody else scores 0.
    leave(r, p0);
    check(r.shared.phase === 'thiefGuess' && r.shared.finisher === p0, 'skrew: a finisher leaving changes nothing');
    applyRoomAction(r, r.hostId, 'closeThiefVote', { seq: r.shared.turnSeq });
    res = r.shared.results;
    check(r.shared.phase === 'reveal' && res.finisher === p0 && res.round[p1] === 7 && res.round[p2] === 6, 'skrew: scored with the finisher gone: everyone left keeps their total');

    // Pong on the last card.
    const w = skStart(['a', 'b'], { edition: 'sahib' });
    begin(w, [['pong'], ['n2', 'n3']], ['n6', 'n6', 'ping'], ['n5']);
    const [w0, w1] = w.shared.order;
    sk(w, w0, 'draw');
    sk(w, w0, 'pong', { slot: slotOf(w, w0, 1) });
    check(w.shared.phase === 'reveal' && w.shared.results.finisher === w0 && w.shared.results.round[w0] === 0 && w.shared.results.round[w1] === 5, 'skrew: Pong on the last card ends the round');

    // بوم: every other player throws one of their own cards, picked on their phone, all turned up together.
    const four = ['a', 'b', 'c', 'd'];
    const boomUp = (x, pid) => { x._screw.deck.push('boom'); sk(x, pid, 'draw'); };
    r = skStart(four, { edition: 'oscar', turnClock: 30 });
    begin(r, [['n1', 'n2'], ['red25', 'n3'], ['n4', 'thief'], ['n5', 'n6']], ['n1', 'n1', 'n1', 'n1'], ['n5']);
    let [q0, q1, q2, q3] = r.shared.order;
    // بوم fires the moment it comes off the deck (the owner, 20 Sep 2026): it
    // cannot be kept, it cannot be thrown for later, and there is no skipping it.
    r._screw.deck.push('boom');
    clock += 5000;
    sk(r, q0, 'draw');
    check(skThrew(r, q0, 'keep', { slot: slotOf(r, q0, 1) }) && skThrew(r, q0, 'discard', {}) && skThrew(r, q0, 'skipPower', {}),
      'skrew: بوم cannot be kept, thrown or skipped - it is already gone');
    const bs = r.shared.events.filter((e) => e.type === 'boom').pop();
    check(r.shared.turn.pid === q0 && r.shared.turn.stage === 'boom' && r.shared.boom.waiting.join() === [q1, q2, q3].join() && r.shared.boom.picked.length === 0 &&
      bs.type === 'boom' && Object.keys(bs).sort().join() === 'pid,seq,type' && bs.pid === q0 && r.shared.endsAt === clock + 30000,
      'skrew: بوم opens its stage: everyone else with cards has to pick one, on a fresh turn clock');
    check(skThrew(r, q0, 'boomPick', { slot: slotOf(r, q0, 1) }) && threw(() => applyRoomAction(r, 'zz', 'boomPick', { seq: r.shared.turnSeq, slot: 'x' })) && skThrew(r, q1, 'boomPick', { slot: slotOf(r, q2, 1) }),
      'skrew: the player of بوم picks nothing, nor does anyone not at the table, and a pick is one of your own cards');
    const bseq = r.shared.turnSeq;
    const but = (x) => JSON.stringify(Object.assign({}, x.shared, { boom: null })) + JSON.stringify(x.secrets);
    const beforePicks = but(r);
    applyRoomAction(r, q1, 'boomPick', { seq: bseq, slot: slotOf(r, q1, 1) });
    applyRoomAction(r, q2, 'boomPick', { seq: bseq, slot: slotOf(r, q2, 2) });
    check(JSON.stringify(r.shared.boom) === JSON.stringify({ waiting: [q3], picked: [q1, q2] }) && r.shared.turnSeq === bseq,
      "skrew: picks sent together all count: one phone's pick doesn't make another's stale");
    check(but(r) === beforePicks, 'skrew: until everyone has picked, nothing on any phone changes but who has picked - not which card');
    applyRoomAction(r, q1, 'boomPick', { seq: bseq, slot: slotOf(r, q1, 2) });
    check(r.shared.boom.picked.join() === [q1, q2].join(), 'skrew: a pick is final');
    applyRoomAction(r, q3, 'boomPick', { seq: bseq, slot: slotOf(r, q3, 2) });
    const throws = r.shared.events.filter((e) => e.type === 'boomThrow');
    check(throws.map((e) => e.pid + ':' + e.card).join() === [q1 + ':red25', q2 + ':thief', q3 + ':n6'].join() && r.shared.pile.slice(-3).join() === 'red25,thief,n6' &&
      r._screw.hands[q1].map((e) => e.card).join() === 'n3' && r._screw.hands[q2].map((e) => e.card).join() === 'n4' && r._screw.hands[q3].map((e) => e.card).join() === 'n5' && r._screw.hands[q0].length === 2,
      'skrew: the last pick turns every card up onto the pile, in seat order after the player - the red screw and the thief too');
    check(r.shared.boom === null && r.shared.turn.pid === q0 && r.shared.turn.stage === 'choose' && r.shared.turnSeq > bseq && !r.shared.events.some((e) => e.type === 'penalty'),
      'skrew: then the turn stays with the player of بوم: a whole new turn');
    applyRoomAction(r, q3, 'boomPick', { seq: bseq, slot: slotOf(r, q3, 1) });
    check(r._screw.hands[q3].length === 1, 'skrew: a pick after the close is dropped');
    sk(r, q0, 'draw');
    check(r.shared.turn.stage === 'drawn', 'skrew: the player of بوم draws in that new turn as usual');

    // The clock, a player leaving, the host's close and skip: whoever hasn't picked gets a card at random.
    r = skStart(four, { edition: 'oscar', turnClock: 30 });
    begin(r, [['n1', 'n2'], ['n3', 'n4'], ['n5', 'n6'], ['n1', 'n6']], ['n1', 'n1', 'n1', 'n1'], ['n5']);
    [q0, q1, q2, q3] = r.shared.order;
    boomUp(r, q0);
    sk(r, q1, 'boomPick', { slot: slotOf(r, q1, 2) });
    leave(r, q2);
    check(r.shared.boom.waiting.join() === q3 && r.shared.turn.stage === 'boom', 'skrew: a player who leaves is no longer waited on');
    clock += 32000;
    check(roomTimeout(r, clock) === true && r.shared.events.filter((e) => e.type === 'boomThrow').map((e) => e.pid).join() === [q1, q3].join() &&
      r._screw.hands[q1].map((e) => e.card).join() === 'n3' && r._screw.hands[q3].length === 1 && r.shared.turn.pid === q0 && r.shared.turn.stage === 'choose',
      'skrew: time up: a card picked at random for whoever hadn\'t, and the turn comes back to the player');
    r = skStart(four, { edition: 'oscar' });
    begin(r, [['n1', 'n2'], ['n3', 'n4', 'n1'], ['n5', 'n6', 'n2'], ['n1', 'n6', 'n3']], ['n1', 'n1', 'n1', 'n1'], ['n5']);
    [q0, q1, q2, q3] = r.shared.order;
    boomUp(r, q0);
    const notHost = r.shared.order.find((id) => id !== r.hostId);
    check(skThrew(r, notHost, 'closeBoom') || notHost === r.hostId, 'skrew: only the host closes بوم');
    sk(r, r.hostId, 'closeBoom');
    check([q1, q2, q3].every((id) => r._screw.hands[id].length === 2) && r.shared.events.filter((e) => e.type === 'boomThrow').length === 3 && r.shared.turn.pid === q0 && r.shared.turn.stage === 'choose',
      "skrew: the host's close picks for everyone still waiting");
    boomUp(r, q0);
    sk(r, r.hostId, 'skipTurn');
    check(r.shared.phase === 'play' && r.shared.turn.pid === q0 && r.shared.turn.stage === 'choose' && [q1, q2, q3].every((id) => r._screw.hands[id].length === 1),
      "skrew: the host's skip during بوم closes it the same way, and the turn stays with the player");
    // The player of بوم leaving calls it off.
    r = skStart(four, { edition: 'oscar' });
    begin(r, [['n1', 'n2'], ['n3', 'n4'], ['n5', 'n6'], ['n1', 'n6']], ['n1', 'n1', 'n1', 'n1'], ['n5']);
    [q0, q1, q2, q3] = r.shared.order;
    boomUp(r, q0);
    sk(r, q1, 'boomPick', { slot: slotOf(r, q1, 1) });
    leave(r, q0);
    check(r.shared.boom === null && r.shared.turn.pid === q1 && r.shared.turn.stage === 'choose' && r._screw.hands[q1].length === 2 && !r.shared.events.some((e) => e.type === 'boomThrow'),
      'skrew: the player of بوم leaving calls it off: nothing is thrown, the turn passes');
    // After a سكرو the protected caller throws nothing; with nobody to throw, the new turn comes at once.
    r = skStart(['a', 'b'], { edition: 'oscar' });
    begin(r, [['n1', 'n2'], ['n3', 'n4']], ['n1', 'n1', 'n1', 'n1'], ['n5']);
    [q0, q1] = r.shared.order;
    sk(r, q0, 'screw');
    boomUp(r, q1);
    check(r.shared.boom === null && r.shared.turn.pid === q1 && r.shared.turn.stage === 'choose' && r._screw.hands[q0].length === 2 && r.shared.phase === 'play',
      'skrew: بوم with only the protected caller left to throw: nothing thrown, the player\'s new turn at once');
    sk(r, q1, 'draw'); sk(r, q1, 'discard');
    check(r.shared.phase === 'reveal', 'skrew: and that new turn is still the last one');

    // بوم emptying hands: the first emptied after the player (in seat order) is the finisher.
    r = skStart(four, { edition: 'oscar' });
    begin(r, [['n1'], ['n3', 'n4'], ['n5', 'n6'], ['n6']], ['n1', 'n1', 'n1', 'n1'], ['n5']);
    [q0, q1, q2, q3] = r.shared.order;
    sk(r, r.hostId, 'skipTurn');
    sk(r, r.hostId, 'skipTurn');
    boomUp(r, q2);
    check(r.shared.boom.waiting.join() === [q3, q0, q1].join(), 'skrew: the picks go round from the seat after the player');
    sk(r, q0, 'boomPick', { slot: slotOf(r, q0, 1) });
    sk(r, q1, 'boomPick', { slot: slotOf(r, q1, 1) });
    sk(r, q3, 'boomPick', { slot: slotOf(r, q3, 1) });
    res = r.shared.results;
    check(r.shared.phase === 'reveal' && res.finisher === q3 && res.round[q3] === 0 && res.round[q0] === 0 && res.round[q2] === 11 && res.round[q1] === 4 &&
      r.shared.events.filter((e) => e.type === 'boomThrow').map((e) => e.pid).join() === [q3, q0, q1].join(),
      'skrew: بوم emptying two hands ends the round; the first emptied after the player is the finisher');

    // Teams: a finisher's side scores 0, and a calling side that isn't theirs is doubled.
    r = skStart(['a', 'b', 'c', 'd'], { edition: 'sahib', teams: true });
    begin(r, [['n6', 'n6'], ['n1'], ['n3'], ['n2']], ['n6', 'n6', 'n6', 'n6'], ['n3']);
    [p0, p1, p2] = r.shared.order;
    sk(r, r.hostId, 'skipTurn');
    sk(r, p1, 'screw');
    sk(r, p2, 'match', { slot: slotOf(r, p2, 1) });
    res = r.shared.results;
    check(r.shared.phase === 'reveal' && res.finisher === p2 && res.totals.A === 12 && res.round.A === 0 && res.totals.B === 3 && res.round.B === 4 && res.callerDouble && res.round[p0] === 0 && res.lowest.sort().join() === [p0, p2].sort().join(),
      'skrew: in teams the finisher\'s side scores 0 whatever the partner holds; on the other side only the caller\'s own hand is doubled (1 × 2 + 2)');
    r = skStart(['a', 'b', 'c', 'd'], { edition: 'sahib', teams: true });
    begin(r, [['n5'], ['n1'], ['n3'], ['n2']], ['n6', 'n6', 'n6', 'n6'], ['n3']);
    [p0, p1, p2] = r.shared.order;
    sk(r, p0, 'screw');
    sk(r, r.hostId, 'skipTurn');
    sk(r, p2, 'match', { slot: slotOf(r, p2, 1) });
    res = r.shared.results;
    check(res.finisher === p2 && res.caller === p0 && res.round.A === 0 && res.round.B === 3 && !res.callerDouble,
      'skrew: a caller whose partner empties their hand is on the finishing side: 0, not doubled');
  }

  {
    // موت مفاجئ: the deck runs out, everyone gets a last turn, then the reveal.
    let r = skStart(['a', 'b', 'c'], { suddenDeath: true });
    check(r.shared.settings.suddenDeath === true && skStart(['a', 'b']).shared.settings.suddenDeath === false, 'skrew: sudden death is a lobby option, off by default');
    begin(r, [['n1'], ['n2'], ['n5']], ['n6', 'n6'], ['n4']);
    let [p0, p1, p2] = r.shared.order;
    check(skThrew(r, p0, 'pass'), 'skrew: no passing while there is a card to draw');
    sk(r, p0, 'draw'); sk(r, p0, 'discard');
    check(r.shared.lastLap === null && r.shared.deckCount === 1, 'skrew: a card still in the deck: no last lap yet');
    sk(r, p1, 'draw');
    check(r.shared.lastLap && r.shared.lastLap.by === p1 && r.shared.finalLeft.join() === [p2, p0].join() && r.shared.turn.pid === p1 && r.shared.turn.stage === 'drawn' && r.shared.caller === null,
      'skrew: the last card drawn starts the last lap: everyone else once more, in seat order; the turn itself goes on');
    const ll = r.shared.events.filter((e) => e.type === 'lastLap').pop();
    check(ll && ll.pid === p1 && !('card' in ll), 'skrew: a lastLap event');
    sk(r, p1, 'discard');
    check(r.shared.turn.pid === p2 && skThrew(r, p2, 'screw'), 'skrew: no سكرو in a last lap');
    check(skThrew(r, p2, 'draw') && r.shared.deckCount === 0 && !r.shared.events.some((e) => e.type === 'reshuffle'), 'skrew: with sudden death the pile is never shuffled into a new deck');
    sk(r, p2, 'pass');
    check(r.shared.turn.pid === p0 && r.shared.events.slice(-1)[0].type === 'pass' && r.shared.events.slice(-1)[0].pid === p2, 'skrew: a player who can\'t draw passes');
    sk(r, p0, 'match', { slot: slotOf(r, p0, 1) });
    let res = r.shared.results;
    check(r._screw.hands[p0].length === 1 && r.shared.hands[p0][0].h.known === 'n1' && !r.shared.events.some((e) => e.type === 'penalty'), 'skrew: a wrong throw with nothing to draw takes no penalty card');
    check(r.shared.phase === 'reveal' && res.caller === null && res.finisher === null && res.round[p0] === 0 && res.round[p1] === 2 && res.round[p2] === 5 && !r.shared.events.some((e) => e.type === 'reshuffle'),
      'skrew: the last lap played out: the reveal, no caller, the lowest scores 0');

    // With a سكرو already: nothing more happens, and whoever can't draw passes.
    r = skStart(['a', 'b', 'c'], { suddenDeath: true });
    begin(r, [['n1'], ['n2'], ['n5']], ['n6'], ['n4']);
    [p0, p1, p2] = r.shared.order;
    sk(r, p0, 'screw');
    sk(r, p1, 'draw');
    check(r.shared.lastLap === null && r.shared.deckCount === 0, 'skrew: the deck running out after a سكرو starts no last lap');
    sk(r, p1, 'discard');
    check(r.shared.finalLeft.join() === [p2].join() && skThrew(r, p2, 'draw'), 'skrew: the last turns run on, with nothing left to draw');
    sk(r, p2, 'pass');
    check(r.shared.phase === 'reveal' && r.shared.results.caller === p0 && r.shared.results.round[p0] === 0, 'skrew: the last turns end the round as usual');

    // A penalty card that takes the last card starts the last lap.
    r = skStart(['a', 'b', 'c'], { suddenDeath: true });
    begin(r, [['n1'], ['n2'], ['n5']], ['n6'], ['n4']);
    [p0, p1, p2] = r.shared.order;
    sk(r, p0, 'match', { slot: slotOf(r, p0, 1) });
    check(r.shared.lastLap && r.shared.lastLap.by === p0 && r._screw.hands[p0].length === 2 && r.shared.turn.pid === p1 && r.shared.finalLeft.join() === [p1, p2].join(),
      'skrew: a penalty card taking the last one starts the last lap');

    // الخشاف shows what is left; with nothing left the power ends.
    r = skStart(['a', 'b', 'c'], { edition: 'mesaharaty', suddenDeath: true });
    begin(r, [['n1'], ['n2'], ['n5']], ['n2', 'khoshaf'], ['n4']);
    [p0, p1, p2] = r.shared.order;
    sk(r, p0, 'draw'); sk(r, p0, 'discard'); sk(r, p0, 'power', {});
    check(r.secrets[p0].khoshaf.join() === 'n2' && r.shared.lastLap === null, 'skrew: الخشاف with one card left shows that one');
    sk(r, p0, 'khoshafPick', { index: 0 });
    check(r.shared.lastLap && r.shared.lastLap.by === p0 && r.shared.turn.stage === 'drawn', 'skrew: picking the last card starts the last lap');
    r = skStart(['a', 'b', 'c'], { edition: 'mesaharaty', suddenDeath: true });
    begin(r, [['n1'], ['n2'], ['n5']], ['khoshaf'], ['n4']);
    [p0, p1, p2] = r.shared.order;
    sk(r, p0, 'draw'); sk(r, p0, 'discard'); sk(r, p0, 'power', {});
    check(r.shared.turn.pid === p1 && r.secrets[p0].khoshaf === null && r.shared.events.slice(-1)[0].type === 'khoshaf', 'skrew: الخشاف on an empty deck: the power ends');

    // Without sudden death: an empty deck takes back the pile; pass only when there is no pile to take.
    r = skStart(['a', 'b', 'c']);
    begin(r, [['n1'], ['n2'], ['n5']], [], ['n4', 'n3']);
    [p0] = r.shared.order;
    check(skThrew(r, p0, 'pass'), 'skrew: without sudden death, no pass while the pile can make a new deck');
    r = skStart(['a', 'b', 'c']);
    begin(r, [['n1'], ['n2'], ['n5']], [], ['n4']);
    [p0, p1] = r.shared.order;
    sk(r, p0, 'pass');
    check(r.shared.turn.pid === p1, 'skrew: nothing in the deck and one card on the pile: a pass');
    // A sudden-death game played again keeps the option; بصرة 2 or 4 a deck.
    const b4 = skStart(['a', 'b', 'c', 'd'], { basraCount: 2, suddenDeath: true });
    check(b4.shared.settings.basraCount === 2 && b4.shared.deckCount === 57 - 17, 'skrew: two بصرة (the first print): two cards fewer in the deck');
    const bx = skStart(['a', 'b', 'c', 'd'], { basraCount: 3 });
    check(bx.shared.settings.basraCount === 4 && bx.shared.deckCount === 59 - 17, 'skrew: بصرة is 4 unless 2 is chosen');
    const cards = (x) => x._screw.deck.concat(x._screw.pile, ...Object.values(x._screw.hands).map((h) => h.map((e) => e.card)));
    const b8 = skStart(['a', 'b', 'c', 'd', 'e', 'f', 'g'], { edition: 'oscar' });
    const b8two = skStart(['a', 'b', 'c', 'd', 'e', 'f', 'g'], { basraCount: 2 });
    check(cards(b8).filter((c) => c === 'basra').length === 8 && cards(b8two).filter((c) => c === 'basra').length === 4 && cards(b8).filter((c) => c === 'boom').length === 2 && cards(b8).filter((c) => c === 'lifeJacket').length === 2,
      'skrew: two decks: eight بصرة (four with two a deck), and أوسكار\'s cards twice');
    for (let k = 0; k < 3; k++) {
      b4.shared.order.forEach((id) => { if (b4.shared.phase === 'memorize') sk(b4, id, 'ready'); });
      callAndFinish(b4);
      if (b4.shared.phase === 'reveal') applyRoomAction(b4, b4.hostId, 'nextRound', { round: b4.shared.round });
    }
    applyRoomAction(b4, b4.hostId, 'playAgain', {});
    check(b4.shared.phase === 'memorize' && b4.shared.settings.suddenDeath === true && b4.shared.settings.basraCount === 2, 'skrew: play again keeps sudden death and the بصرة count');
  }

  {
    // Every slot's public story: how its card got there, by whom, from where, who has looked,
    // and the card itself only when the whole table saw it face up.
    const r = skStart(['a', 'b', 'c'], { edition: 'general', screwFromLap: 1, memoryHelp: true });
    const [p0, p1, p2] = r.shared.order;
    const H = (pid, n) => r.shared.hands[pid][n - 1].h;
    const card = (pid, n) => r._screw.hands[pid][n - 1].card;
    const lastSeq = () => r.shared.events.slice(-1)[0].seq;
    check(r.shared.settings.memoryHelp === true && skStart(['a', 'b']).shared.settings.memoryHelp === false, 'skrew: the memory help is a lobby option, off by default');
    const dealSeq = r.shared.events[0].seq;
    check(r.shared.order.every((id) => r.shared.hands[id].every((x, i) => x.h.how === 'deal' && x.h.by === null && x.h.from === null && x.h.known === null && x.h.at === dealSeq && x.h.looks.join() === (i >= 2 ? id : ''))),
      'skrew: dealt: every slot says so, and slots 3 and 4 were looked at by their owner');
    begin(r, null, ['n6', 'n6', 'n6', 'n6'], ['n5']);
    // A drawn card kept: its drawer saw it.
    r._screw.deck.push('n2');
    sk(r, p0, 'draw');
    sk(r, p0, 'keep', { slot: slotOf(r, p0, 1) });
    check(H(p0, 1).how === 'deck' && H(p0, 1).by === p0 && H(p0, 1).from === null && H(p0, 1).known === null && H(p0, 1).looks.join() === p0 && H(p0, 1).at === lastSeq(),
      'skrew: a kept card: from the deck, looked at by its drawer, nothing known to the table');
    // The top of the pile taken: the table knows the card.
    const top = r._screw.pile[r._screw.pile.length - 1];
    sk(r, p1, 'takePile', { slot: slotOf(r, p1, 3) });
    check(H(p1, 3).how === 'pile' && H(p1, 3).by === p1 && H(p1, 3).known === top && card(p1, 3) === top && H(p1, 3).looks.length === 0 && r.shared.hands[p1][2].up === null,
      'skrew: a card taken from the pile: face down, but known to the table');
    // A blind swap: what is known and who looked travel with the cards.
    const theirs = slotOf(r, p1, 3);
    const mine = slotOf(r, p2, 4);
    r._screw.deck.push('swap');
    sk(r, p2, 'draw'); sk(r, p2, 'discard');
    sk(r, p2, 'power', { slot: mine, target: p1, slot2: theirs });
    const hm = r.shared.hands[p2].find((x) => x.id === mine).h;
    const ht = r.shared.hands[p1].find((x) => x.id === theirs).h;
    check(hm.how === 'swap' && hm.by === p2 && hm.from.pid === p1 && hm.from.slot === theirs && hm.known === top && hm.looks.length === 0 &&
      ht.how === 'swap' && ht.by === p2 && ht.from.pid === p2 && ht.from.slot === mine && ht.known === null && ht.looks.join() === p2,
      'skrew: a blind swap: each card keeps what the table knew about it and who had looked, in its new slot');
    // A look: a spy on another player's card.
    r._screw.deck.push('s9');
    sk(r, p0, 'draw'); sk(r, p0, 'discard');
    sk(r, p0, 'power', { target: p1, slot: slotOf(r, p1, 1) });
    check(H(p1, 1).looks.join() === p0 && H(p1, 1).how === 'deal' && H(p1, 1).known === null, 'skrew: a spy is recorded on the card looked at, and nothing else changes');
    // خد بس: the card, with its story, into a new slot at the end of their hand.
    const given = slotOf(r, p1, 1);
    r._screw.deck.push('takeOnly');
    sk(r, p1, 'draw'); sk(r, p1, 'discard');
    sk(r, p1, 'power', { slot: given, target: p2 });
    const hg = r.shared.hands[p2][r.shared.hands[p2].length - 1].h;
    check(hg.how === 'give' && hg.by === p1 && hg.from.pid === p1 && hg.from.slot === given && hg.looks.join() === p0 && hg.known === null,
      'skrew: a given card arrives with who had looked at it');
    // A wrong throw: back face down in its slot, known; the penalty card blind.
    r._screw.hands[p2][0].card = 'n1';
    const looksBefore = H(p2, 1).looks.join();
    const howBefore = H(p2, 1).how;
    sk(r, p2, 'match', { slot: slotOf(r, p2, 1) });
    check(H(p2, 1).known === 'n1' && r.shared.hands[p2][0].up === null && H(p2, 1).looks.join() === looksBefore && H(p2, 1).how === howBefore,
      'skrew: a wrong throw goes back into its slot face down, known to the table, its story otherwise the same');
    // A refused بصرة: the same.
    r._screw.hands[p0][1].card = 'red25';
    r._screw.deck.push('basra');
    sk(r, p0, 'draw'); sk(r, p0, 'discard');
    sk(r, p0, 'power', { slot: slotOf(r, p0, 2) });
    check(r._screw.hands[p0][1].card === 'red25' && H(p0, 2).known === 'red25' && r.shared.hands[p0][1].up === null, 'skrew: بصرة refused on the red screw: back face down, known');
    // صرخة أوسكار: every card dealt again blind, so every story starts again - known cards and looks too.
    check(r.shared.order.some((id) => r.shared.hands[id].some((x) => x.h.known || x.h.looks.length)), 'skrew: before the scream, some cards are known or looked at');
    r._screw.deck.push('scream');
    sk(r, p1, 'draw');
    const screamSeq = lastSeq();
    check(r.shared.order.every((id) => r.shared.hands[id].every((x) => x.h.how === 'scream' && x.h.by === p1 && x.h.from === null && x.h.known === null && x.h.looks.length === 0 && x.h.at === screamSeq)),
      'skrew: the scream: every slot\'s story starts again, nothing known, nobody has looked');
    sk(r, r.hostId, 'skipTurn');
    // A الخشاف pick kept.
    r._screw.deck.push('n3', 'n4', 'khoshaf');
    sk(r, p2, 'draw'); sk(r, p2, 'discard');
    sk(r, p2, 'power', {});
    sk(r, p2, 'khoshafPick', { index: 0 });
    sk(r, p2, 'keep', { slot: slotOf(r, p2, 1) });
    check(H(p2, 1).how === 'khoshaf' && H(p2, 1).by === p2 && H(p2, 1).looks.join() === p2 && H(p2, 1).known === null, 'skrew: a الخشاف pick kept: its drawer saw it');
    // Nothing in any story carries a card the table didn't see face up.
    const faceUp = new Set();
    let bad = 0;
    const scan = () => {
      r.shared.events.forEach((e) => { if (e.type === 'takePile' || ((e.type === 'match' || e.type === 'pong' || e.type === 'basra') && !e.ok)) faceUp.add(e.card); });
      r.shared.order.forEach((id) => r.shared.hands[id].forEach((x, i) => {
        if (x.h.known !== null && (x.h.known !== r._screw.hands[id][i].card || !faceUp.has(x.h.known))) bad++;
        if (Object.keys(x.h).sort().join() !== 'at,by,from,how,known,looks') bad++;
      }));
    };
    scan();
    check(bad === 0,'skrew: no story carries a card that wasn\'t face up for the whole table');
    // A room saved before the stories existed gets a blank one.
    delete r._screw.hands[p0][0].h;
    sk(r, r.hostId, 'skipTurn');
    check(r.shared.hands[p0][0].h && r.shared.hands[p0][0].h.how === 'deal' && Array.isArray(r.shared.hands[p0][0].h.looks), 'skrew: a slot with no story gets a blank one');
    applyRoomAction(r, r.hostId, 'backToHub', {});
  }

  {
    // The clock, the host's skip, and someone leaving.
    const r = skStart(['a', 'b', 'c'], { turnClock: 30 });
    begin(r, [['n1'], ['n2'], ['n3']], ['n6', 'n6', 'n6', 'n6'], ['n5']);
    const [p0, p1, p2] = r.shared.order;
    check(r.shared.endsAt === clock + 30000 && roomDeadline(r) === clock + 31500, 'skrew: a turn clock the server watches');
    sk(r, p0, 'draw');
    clock += 32000;
    check(roomTimeout(r, clock) === true && r.shared.turn.pid === p1 && r.shared.pile[r.shared.pile.length - 1] === 'n6' && r.secrets[p0].drawn === null,
      'skrew: time up: the drawn card is thrown and the turn passes');
    const seq = r.shared.turnSeq;
    applyRoomAction(r, r.hostId, 'skipTurn', { seq: seq - 1 });
    check(r.shared.turn.pid === p1, 'skrew: a stale skip is dropped');
    sk(r, p1, 'draw');
    leave(r, p1);
    check(r.shared.turn.pid === p2 && r.shared.order.length === 2 && r._screw.deck[0] === 'n2' && r._screw.deck[1] === 'n6' && !r.shared.hands[p1],
      'skrew: the player up leaves: their cards go under the deck, the next player is up');
    leave(r, p2);
    check(r.shared.phase === 'gameover' && r.shared.winners.join() === p0, 'skrew: one player left ends the game');
    // Leaving in the memorize starts the round once everyone left is ready.
    const m = skStart(['a', 'b', 'c']);
    sk(m, m.shared.order[0], 'ready');
    sk(m, m.shared.order[1], 'ready');
    leave(m, m.shared.order[2]);
    check(m.shared.phase === 'play' && m.shared.order.length === 2, 'skrew: the last one memorizing leaves, and play starts');
    // A side with nobody left.
    const tm = skStart(['a', 'b', 'c', 'd'], { teams: true });
    const side = tm.shared.teams[1];
    leave(tm, side[0]);
    check(tm.shared.phase === 'memorize' && tm.shared.teams[1].length === 1, 'skrew: a side with one player left plays on');
    leave(tm, side[1]);
    check(tm.shared.phase === 'gameover', 'skrew: a side with nobody left ends the game');
    // A screen gets nothing, and a latecomer is not dealt in.
    const late = skStart(['a', 'b']);
    late.players.push({ id: 'z', name: 'Z' });
    begin(late, null, null, null);
    check(!late.secrets.z && !late.shared.hands.z && threw(() => applyRoomAction(late, 'z', 'draw', { seq: late.shared.turnSeq })), 'skrew: someone who joined mid-game is not dealt in');
  }
}

/* --- العقل: the numbers never leave the server -------------------------- */
{
  const mindStart = (ids) => {
    const r = newRoom(ids);
    applyRoomAction(r, ids[0], 'chooseGame', { game: 'mind' });
    applyRoomAction(r, ids[0], 'start', {});
    return r;
  };
  const cards = (r, id) => ((r.secrets[id] || {}).cards || []).slice();
  const allCards = (r) => r.shared.roster.reduce((acc, id) => acc.concat(cards(r, id)), []).sort((a, b) => a - b);
  const lowestHolder = (r) => r.shared.roster
    .filter((id) => cards(r, id).length)
    .sort((a, b) => cards(r, a)[0] - cards(r, b)[0])[0];

  const m = mindStart(['a', 'b', 'c']);
  check(m.shared.level === 1 && m.shared.lives === 3, 'mind: level 1, a life per player');
  check(['a', 'b', 'c'].every((id) => cards(m, id).length === 1), 'mind: one card each at level 1');
  const dealt = allCards(m);
  check(dealt.length === 3 && new Set(dealt).size === 3 && dealt.every((n) => n >= 1 && n <= 100),
        'mind: three different numbers from 1 to 100');
  check(JSON.stringify(m.shared.held) === JSON.stringify({ a: 1, b: 1, c: 1 }), 'mind: shared says how many, not which');
  check(!m.shared.pile.length && !m.shared.discarded.length, 'mind: nothing is on the table before a card is played');
  // Nothing anywhere in shared is a number somebody is still holding. Walked
  // value by value: a text search for ":1" also finds "level":1 and "lives":3,
  // which failed this check whenever a 1 or a 3 was dealt.
  const COUNTERS = new Set(['level', 'lives', 'lostSeq', 'held']);
  const sharedNumbers = [];
  const walk = (v, key) => {
    if (COUNTERS.has(key)) return;
    if (typeof v === 'number') sharedNumbers.push(v);
    else if (v && typeof v === 'object') Object.keys(v).forEach((k) => walk(v[k], Array.isArray(v) ? key : k));
  };
  walk(m.shared, '');
  check(!dealt.some((n) => sharedNumbers.indexOf(n) !== -1), 'mind: no unplayed number appears anywhere in shared');

  // In order: the lowest first, then the next, then the last - no life lost.
  applyRoomAction(m, lowestHolder(m), 'play', {});
  check(m.shared.lives === 3 && m.shared.pile.length === 1 && !m.shared.lost, 'mind: the lowest card costs nothing');
  applyRoomAction(m, lowestHolder(m), 'play', {});
  applyRoomAction(m, lowestHolder(m), 'play', {});
  check(m.shared.phase === 'levelDone' && m.shared.lives === 3 && m.shared.pile.length === 3,
        'mind: every card played, in order, clears the level');
  const inOrder = m.shared.pile.slice().sort((a, b) => a - b);
  check(JSON.stringify(m.shared.pile) === JSON.stringify(inOrder), 'mind: the pile came out in rising order');

  applyRoomAction(m, 'a', 'nextLevel', {});
  check(m.shared.level === 2 && ['a', 'b', 'c'].every((id) => cards(m, id).length === 2),
        'mind: the next level deals one more card each');
  check(m.shared.lives === 3 && !m.shared.pile.length, 'mind: the lives carry over and the pile starts again');

  // Out of order: one life, and every card lower than the one played is thrown.
  const wrong = mindStart(['a', 'b', 'c']);
  const highest = wrong.shared.roster
    .sort((x, y) => cards(wrong, y)[0] - cards(wrong, x)[0])[0];
  const beneath = allCards(wrong).filter((n) => n < cards(wrong, highest)[0]);
  applyRoomAction(wrong, highest, 'play', {});
  check(wrong.shared.lives === 2, 'mind: playing out of order costs exactly one life');
  check(JSON.stringify(wrong.shared.discarded) === JSON.stringify(beneath),
        'mind: and every card lower than it goes face up');
  check(!allCards(wrong).some((n) => n < wrong.shared.pile[0]), 'mind: nobody is left holding a card that was missed');
  check(wrong.shared.lost && wrong.shared.lost.missed.length === beneath.length, 'mind: the table is told what it lost');

  // Lives at zero ends the game.
  const doomed = mindStart(['a', 'b']);
  doomed.shared.lives = 1;
  const top = cards(doomed, 'a')[0] > cards(doomed, 'b')[0] ? 'a' : 'b';
  applyRoomAction(doomed, top, 'play', {});
  check(doomed.shared.phase === 'gameover' && doomed.shared.won === false, 'mind: the last life ends the game');
  check(threw(() => applyRoomAction(doomed, 'a', 'play', {})) || doomed.shared.pile.length === 1,
        'mind: no card goes down after the game is over');

  // Somebody leaves holding cards: they go with them, and the level finishes.
  const gone = mindStart(['a', 'b', 'c']);
  applyRoomAction(gone, 'a', 'nextLevel', {});   // refused: the level is not done
  check(gone.shared.level === 1, 'mind: nextLevel is refused while cards are still out');
  leave(gone, 'c');
  check(!gone.secrets.c && gone.shared.held.c === undefined, 'mind: a leaver takes their cards with them');
  check(gone.shared.roster.length === 2 && gone.shared.phase === 'play', 'mind: the level goes on with two');
  applyRoomAction(gone, lowestHolder(gone), 'play', {});
  applyRoomAction(gone, lowestHolder(gone), 'play', {});
  check(gone.shared.phase === 'levelDone', 'mind: and the level can still be finished');

  // The last card leaving finishes the level by itself.
  const finish = mindStart(['a', 'b', 'c']);
  applyRoomAction(finish, lowestHolder(finish), 'play', {});
  applyRoomAction(finish, lowestHolder(finish), 'play', {});
  const last = lowestHolder(finish);
  leave(finish, last);
  check(finish.shared.phase === 'levelDone', 'mind: the level is done when the last holder leaves');

  // Down to one player, the game is over.
  const alone = mindStart(['a', 'b', 'c']);
  leave(alone, 'b');
  leave(alone, 'c');
  check(alone.shared.phase === 'gameover', 'mind: fewer than two players ends the game');

  // A phone with no cards cannot play, and a stranger cannot either.
  const empty = mindStart(['a', 'b']);
  applyRoomAction(empty, lowestHolder(empty), 'play', {});
  const spent = empty.shared.last.by;
  check(threw(() => applyRoomAction(empty, spent, 'play', {})), 'mind: a phone with no cards cannot play');
  check(threw(() => applyRoomAction(empty, 'z', 'play', {})), 'mind: somebody not in the round cannot play');

  // A deck that cannot carry another level is a win.
  const win = mindStart(['a', 'b']);
  win.shared.level = 50;
  win.shared.phase = 'levelDone';
  applyRoomAction(win, 'a', 'nextLevel', {});
  check(win.shared.phase === 'gameover' && win.shared.won === true, 'mind: playing out the deck is a win');
}

/* --- قبل ولا بعد: the years of a hand never leave the server -------------- */
{
  const tlStart = (ids, lang) => {
    const r = newRoom(ids);
    applyRoomAction(r, ids[0], 'chooseGame', { game: 'timeline' });
    applyRoomAction(r, ids[0], 'start', { lang: lang || 'ar' });
    return r;
  };
  // The real hands (years included) are server-only scratch; a phone's slice has only `cards`.
  const hand = (r, id) => (((r._timeline && r._timeline.hands) || {})[id] || []).slice();
  const up = (r) => r.shared.turnId;

  const tl = tlStart(['a', 'b', 'c']);
  check(tl.shared.phase === 'play' && tl.shared.timeline.length === 1, 'timeline: one card starts the line');
  check(tl.shared.order.length === 3 && ['a', 'b', 'c'].every((id) => hand(tl, id).length === tl.shared.handSize),
        'timeline: the same number of cards each');
  check(['a', 'b', 'c'].every((id) => (tl.secrets[id].cards || []).every((c) => c.y === undefined)),
        'timeline: a phone is given its own cards with the years taken off');
  check(['a', 'b', 'c'].every((id) => Object.keys(tl.secrets[id]).join() === 'cards' && JSON.stringify(tl.secrets[id]).indexOf('"y"') === -1),
        'timeline: and nothing else - no year anywhere in what a phone is sent');
  check(hand(tl, 'a').every((c) => typeof c.y === 'number'), 'timeline: the server keeps the real years');
  const unplayed = ['a', 'b', 'c'].reduce((acc, id) => acc.concat(hand(tl, id).map((c) => c.y)), []);
  const publishedYears = JSON.stringify(tl.shared);
  check(!unplayed.some((y) => publishedYears.indexOf('"y":' + y) !== -1),
        'timeline: no unplayed year appears anywhere in shared');
  // Seats are shuffled, so the keys compare by value, not by order.
  check(Object.keys(tl.shared.hands).sort().join(',') === 'a,b,c' &&
        Object.keys(tl.shared.hands).every((id) => tl.shared.hands[id] === tl.shared.handSize),
        'timeline: shared says how many cards each holds');

  // Only the player up may place, and only a card they hold.
  const other = tl.shared.order.find((id) => id !== up(tl));
  check(threw(() => applyRoomAction(tl, other, 'place', { card: hand(tl, other)[0].id, at: 0 })), 'timeline: only the player up can place');
  check(threw(() => applyRoomAction(tl, up(tl), 'place', { card: 'nope', at: 0 })), 'timeline: and only a card they hold');
  check(threw(() => applyRoomAction(tl, up(tl), 'place', { card: hand(tl, up(tl))[0].id, at: 9 })), 'timeline: a slot that is not on the line is refused');

  // A correct placement: the card stays, the line stays sorted, the hand shrinks.
  {
    const who = up(tl);
    const card = hand(tl, who)[0];
    const line = tl.shared.timeline;
    let at = 0;
    while (at < line.length && line[at].y < card.y) at++;
    const before = hand(tl, who).length;
    applyRoomAction(tl, who, 'place', { card: card.id, at: at });
    check(tl.shared.timeline.length === 2 && tl.shared.timeline.some((c) => c.id === card.id), 'timeline: a card put in the right place stays');
    check(tl.shared.timeline.every((c, i, arr) => i === 0 || arr[i - 1].y <= c.y), 'timeline: and the line stays in order');
    check(hand(tl, who).length === before - 1, 'timeline: a right placement is one card off the hand');
    check(tl.shared.last.right === true && tl.shared.last.y === card.y, 'timeline: the table is told what it was');
    check((tl.shared.scores || {})[who] === 1, 'timeline: and it scores a point');
    check(tl.shared.turnId !== who, 'timeline: the turn moves on');
  }

  // A wrong placement: the year is shown, the card is out, a new one is drawn.
  // The card is chosen so the slot is certainly wrong - a test that only
  // sometimes exercises the path it is named after is no test.
  {
    const who = up(tl);
    const card = hand(tl, who).slice().sort((x, y) => y.y - x.y)[0];
    // The line is set to one card a year earlier, so placing at 0 is certainly
    // wrong whatever the deal: a test that only sometimes exercises the path
    // it is named after is no test.
    tl.shared.timeline = [{ id: 'seed', text: 'seed', y: card.y - 1 }];
    const before = hand(tl, who).length;
    const lineWas = tl.shared.timeline.length;
    const deckWas = tl._timeline.deck.length;
    applyRoomAction(tl, who, 'place', { card: card.id, at: 0 });
    check(tl.shared.last.right === false, 'timeline: putting a late card before the earliest one is wrong');
    check(tl.shared.timeline.length === lineWas, 'timeline: a wrong card does not join the line');
    check(tl.shared.last.y === card.y && tl.shared.last.text === card.text, 'timeline: and its year is shown to the table');
    check(!hand(tl, who).some((c) => c.id === card.id), 'timeline: the card is out of the game');
    check(hand(tl, who).length === before && tl._timeline.deck.length === deckWas - 1,
          'timeline: a replacement is drawn, so only a right placement shrinks a hand');
    check(!(tl.shared.scores || {})[who] || (tl.shared.scores || {})[who] === 1, 'timeline: a wrong placement scores nothing');
  }

  // The same event never appears twice in one game.
  {
    const two = tlStart(['a', 'b']);
    const ids = two.shared.timeline.concat(hand(two, 'a'), hand(two, 'b'), two._timeline.deck).map((c) => c.text);
    check(new Set(ids).size === ids.length, 'timeline: no event is dealt twice in one game');
  }

  // Emptying a hand wins.
  {
    const win = tlStart(['a', 'b']);
    const who = up(win);
    win._timeline.hands[who] = [hand(win, who)[0]];
    const card = hand(win, who)[0];
    let at = 0;
    while (at < win.shared.timeline.length && win.shared.timeline[at].y < card.y) at++;
    applyRoomAction(win, who, 'place', { card: card.id, at: at });
    check(win.shared.phase === 'gameover' && win.shared.winnerId === who, 'timeline: the first to empty their hand wins');
    check((win.shared.board || []).length === 2, 'timeline: and the board is published');
  }

  // English deals English.
  {
    const en = tlStart(['a', 'b'], 'en');
    check(/^[A-Za-z]/.test(en.shared.timeline[0].text), 'timeline: an English room is dealt English cards');
  }

  // Someone leaves: their cards go and the turn moves on.
  {
    const gone = tlStart(['a', 'b', 'c']);
    const who = up(gone);
    leave(gone, who);
    check(!gone.secrets[who] && gone.shared.hands[who] === undefined, 'timeline: a leaver takes their cards with them');
    check(gone.shared.order.length === 2 && gone.shared.turnId !== who, 'timeline: and the turn moves on');
    check(gone.shared.phase === 'play', 'timeline: two are still a game');
    leave(gone, gone.shared.order[0]);
    check(gone.shared.phase === 'gameover', 'timeline: one player left ends it');
  }

  // Twelve players still get a deal, from a bank of 22.
  {
    const big = tlStart(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l']);
    check(big.shared.handSize >= 1 && big.shared.order.every((id) => hand(big, id).length === big.shared.handSize),
          'timeline: a full table still gets an even deal');
  }

  // Spares are kept back: a replacement per player where the bank allows (the owner, 22 Sep 2026).
  // At 7 it does; at 12 a bank of 22 can't (1 + 12 + 12 > 22), so every spare left is kept and
  // the board decides if they run out.
  {
    const seven = tlStart('abcdefg'.split(''));
    check(seven._timeline.deck.length >= 7, 'timeline: 7 players leave at least one spare card each');
    const twelve = tlStart('abcdefghijkl'.split(''));
    // The bank is 42 cards since 25 Sep 2026: 12 players get two each and 17 spares.
    const bank = 1 + 12 * twelve.shared.handSize + twelve._timeline.deck.length;
    check(twelve.shared.handSize >= 1 && twelve._timeline.deck.length >= 12 && twelve._timeline.deck.length < 12 + 12 && bank <= 42,
          'timeline: 12 players get an even hand and keep a spare card each for the rest');
  }

  // Only a right placement can win: a wrong one with nothing to draw ends the game on the board.
  {
    const r = tlStart(['a', 'b', 'c']);
    const who = up(r);
    r._timeline.deck = [];
    r._timeline.hands[who] = [hand(r, who)[0]];
    const card = hand(r, who)[0];
    r.shared.timeline = [{ id: 'seed', text: 'seed', y: card.y - 1 }];
    applyRoomAction(r, who, 'place', { card: card.id, at: 0 });   // before a card from the year before: wrong
    check(r.shared.last.right === false && r.shared.phase === 'gameover' && r.shared.ended === 'deck',
          'timeline: a wrong placement with the deck empty ends the game');
    check(r.shared.winnerId !== who || (r.shared.scores || {})[who] > 0, 'timeline: and emptying a hand that way wins nothing');
  }

  // Seat 0 leaving on their turn hands it to seat 1, not seat 2.
  {
    const r = tlStart(['a', 'b', 'c', 'd']);
    const first = r.shared.order[0];
    const next = r.shared.order[1];
    r.shared.turn = 0; r.shared.turnId = first;
    leave(r, first);
    check(r.shared.turnId === next, 'timeline: when seat 0 leaves on their turn, the next seat plays');
  }
}

/* --- الدومينو: the tiles, the ends, the points, the round, and what stays hidden --- */
{
  const { readFileSync } = await import('node:fs');
  const DT = new Function(readFileSync(new URL('../../DominoTiles.js', import.meta.url), 'utf8') +
    '\nreturn { dominoSet, dominoParse, dominoFits, dominoEnds, dominoPlace, dominoEndsSum, dominoPointsOf, dominoRounded, dominoMoveScore,' +
    ' dominoStarter, dominoRoundResult, dominoGameWinner, dominoLayout, dominoFitLayout, dominoNewTable, dominoArmsOpen, dominoHandPips, dominoCanPlay };')();
  const lineOf = (tiles, mode) => tiles.reduce((t, [id, end]) => DT.dominoPlace(t, id, end, mode || 'normal').table, DT.dominoNewTable());
  const endsOf = (t) => DT.dominoEnds(t).map((e) => e.end + e.value).join(' ');

  // The set.
  const set = DT.dominoSet();
  check(set.length === 28 && new Set(set).size === 28 && set.filter((id) => DT.dominoParse(id)[0] === DT.dominoParse(id)[1]).length === 7,
        'domino: a double-six set is 28 tiles, 7 of them doubles');
  check(DT.dominoParse('6' + '-2') === null && DT.dominoParse('2-6').join() === '2,6' && DT.dominoParse('7-7') === null, 'domino: a tile is its two numbers, low first');

  // Matching and the two ends of عادي.
  let t = lineOf([['3-5', 'R']]);
  check(endsOf(t) === 'L3 R5', 'domino: a first tile opens both of its numbers');
  check(DT.dominoFits(t, '5-6').join() === 'R' && DT.dominoFits(t, '1-3').join() === 'L' && DT.dominoFits(t, '3-5').join() === 'L,R'
        && DT.dominoFits(t, '0-1').length === 0, 'domino: a tile goes on the end that shows one of its numbers, or nowhere');
  t = DT.dominoPlace(t, '5-6', 'R', 'normal').table;
  t = DT.dominoPlace(t, '1-3', 'L', 'normal').table;
  check(endsOf(t) === 'L1 R6' && t.line.map((x) => x.a + '' + x.b).join(' ') === '13 35 56', 'domino: each tile turns so the numbers meet');
  check(DT.dominoPlace(t, '2-4', 'R', 'normal') === null, "domino: a tile that doesn't match an end is refused");
  check(DT.dominoFits(DT.dominoNewTable(), '0-4').join() === 'R', 'domino: an empty table takes any tile');
  check(lineOf([['5-5', 'R']], 'normal').spinner === null, 'domino: عادي has no spinner, a double is just a double');

  // أمريكاني: the spinner and its four arms.
  t = lineOf([['5-5', 'R']], 'american');
  check(t.spinner === '5-5' && endsOf(t) === 'L5 R5', 'domino: the first double is the spinner, open on its two sides first');
  check(DT.dominoEndsSum(t) === 10 && DT.dominoPointsOf(DT.dominoEndsSum(t)) === 2, 'domino: the spinner alone counts both halves: 10 is 2 points');
  t = DT.dominoPlace(t, '2-5', 'R', 'american').table;
  check(!DT.dominoArmsOpen(t) && endsOf(t) === 'L5 R2' && DT.dominoEndsSum(t) === 12, 'domino: a double at an end counts both halves (5+5+2 = 12)');
  t = DT.dominoPlace(t, '0-5', 'L', 'american').table;
  check(DT.dominoArmsOpen(t) && endsOf(t) === 'L0 R2 U5 D5', 'domino: with both sides played, its up and down arms open');
  check(DT.dominoEndsSum(t) === 2, "domino: an arm nothing has gone on yet doesn't count");
  check(DT.dominoMoveScore(t, '3-5', 'U', 'american') === 1 && DT.dominoMoveScore(t, '3-5', 'U', 'normal') === 0,
        'domino: 0 + 2 + 3 = 5 is a point, and only in أمريكاني');
  t = DT.dominoPlace(t, '3-5', 'U', 'american').table;
  t = DT.dominoPlace(t, '3-3', 'U', 'american').table;
  check(t.spinner === '5-5' && DT.dominoEndsSum(t) === 8, 'domino: a later double is no second spinner, and across an arm it counts both halves (0+2+6)');
  t = DT.dominoPlace(t, '2-2', 'R', 'american').table;
  check(DT.dominoEndsSum(t) === 10 && DT.dominoPointsOf(10) === 2, 'domino: 0 + 4 + 6 = 10, two points');
  check(DT.dominoPointsOf(15) === 3 && DT.dominoPointsOf(12) === 0 && DT.dominoPointsOf(0) === 0, 'domino: 5 = 1 point; anything not a multiple of 5 nothing');
  check([[12, 2], [13, 3], [10, 2], [7, 1], [8, 2], [2, 0], [0, 0], [23, 5], [22, 4]].every(([n, p]) => DT.dominoRounded(n) === p),
        'domino: the round in أمريكاني is rounded to the nearest 5 (12 → 2, 13 → 3, 22 → 4, 23 → 5)');

  // Who opens.
  check(DT.dominoStarter({ a: ['1-2', '6-6'], b: ['5-5'] }, ['a', 'b']).tile === '6-6', 'domino: the double six opens');
  const st = DT.dominoStarter({ a: ['1-2', '3-3'], b: ['5-5', '0-6'] }, ['a', 'b']);
  check(st.pid === 'b' && st.tile === '5-5' && st.how === 'double', 'domino: without it, the highest double in anyone\'s hand');
  const heavy = DT.dominoStarter({ a: ['1-2', '3-6'], b: ['4-5', '0-6'] }, ['a', 'b']);
  check(heavy.pid === 'a' && heavy.tile === '3-6' && heavy.how === 'heaviest', 'domino: no double at all, the heaviest tile (3|6 over 4|5)');

  // The end of a round.
  const solo = (ids) => ids.map((id) => ({ key: id, ids: [id] }));
  const teamsU = [{ key: 'A', ids: ['a', 'c'] }, { key: 'B', ids: ['b', 'd'] }];
  let r = DT.dominoRoundResult({ how: 'out', by: 'a', hands: { a: [], b: ['6-6'], c: ['1-2'] }, units: solo(['a', 'b', 'c']), mode: 'normal' });
  check(r.winner === 'a' && r.raw === 15 && r.points === 15 && r.lead === 'a', 'domino: going out takes every other hand (12 + 3)');
  r = DT.dominoRoundResult({ how: 'out', by: 'a', hands: { a: [], b: ['6-6'], c: ['1-2'] }, units: solo(['a', 'b', 'c']), mode: 'american' });
  check(r.raw === 15 && r.points === 3, 'domino: in أمريكاني 15 is 3 points');
  r = DT.dominoRoundResult({ how: 'out', by: 'a', hands: { a: [], c: ['6-6'], b: ['1-1'], d: ['0-3'] }, units: teamsU, mode: 'normal' });
  check(r.winner === 'A' && r.raw === 5, "domino: in teams only the opponents' tiles count (2 + 3), not the partner's 12");
  r = DT.dominoRoundResult({ how: 'blocked', hands: { a: ['1-4'], b: ['0-3'], c: ['4-5'] }, units: solo(['a', 'b', 'c']), mode: 'normal' });
  check(r.winner === 'b' && r.raw === 14 && r.lead === 'b', 'domino: blocked, the lowest hand takes all the others (5 + 9)');
  r = DT.dominoRoundResult({ how: 'blocked', hands: { a: ['1-2'], b: ['0-3'], c: ['4-5'] }, units: solo(['a', 'b', 'c']), mode: 'normal' });
  check(!r.winner && r.tie && r.raw === 0 && r.lead === null, 'domino: blocked with a tie for the lowest, nobody scores');
  r = DT.dominoRoundResult({ how: 'blocked', hands: { a: ['0-4'], c: ['1-5'], b: ['1-1'], d: ['4-5'] }, units: teamsU, mode: 'american' });
  check(r.winner === 'A' && r.raw === 11 && r.points === 2 && r.lead === 'a',
        'domino: blocked in teams, the lower side (4 + 6 against 2 + 9) takes the other side\'s 11, rounded to 2; its lower hand leads');
  check(DT.dominoGameWinner({ a: 101, b: 90 }, 101) === 'a' && DT.dominoGameWinner({ a: 110, b: 104 }, 101) === 'a'
        && DT.dominoGameWinner({ a: 105, b: 105 }, 101) === null && DT.dominoGameWinner({ a: 50, b: 60 }, 101) === null,
        'domino: first to the target wins; two past it, the higher; level on top, one more round');

  // The table's drawing: no two tiles ever overlap, on a phone, sideways, or a TV.
  const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  let overlaps = 0, missing = 0, endsWrong = 0, tables = 0;
  for (const mode of ['normal', 'american']) {
    for (let n = 0; n < 60; n++) {
      let tb = DT.dominoNewTable();
      const pool = shuffle(DT.dominoSet());
      for (let moved = true; moved;) {
        moved = false;
        for (let i = 0; i < pool.length && !moved; i++) {
          const f = DT.dominoFits(tb, pool[i]);
          if (f.length) { tb = DT.dominoPlace(tb, pool[i], f[Math.floor(Math.random() * f.length)], mode).table; pool.splice(i, 1); moved = true; }
        }
      }
      const count = tb.line.length + tb.up.length + tb.down.length;
      for (const [w, h] of [[343, 330], [600, 290], [1100, 480]]) {
        const lay = DT.dominoFitLayout(tb, w, h, 40, null).layout;
        tables++;
        if (lay.tiles.length !== count) missing++;
        if (lay.ends.length !== DT.dominoEnds(tb).length) endsWrong++;
        for (let i = 0; i < lay.tiles.length; i++) for (let j = i + 1; j < lay.tiles.length; j++) {
          const p = lay.tiles[i], q = lay.tiles[j];
          if (Math.min(p.x + p.w, q.x + q.w) - Math.max(p.x, q.x) > 0.01 && Math.min(p.y + p.h, q.y + q.h) - Math.max(p.y, q.y) > 0.01) overlaps++;
        }
      }
    }
  }
  check(overlaps === 0 && missing === 0 && endsWrong === 0, `domino: ${tables} full tables drawn, every tile placed, no two overlapping, every open end marked`);

  /* --- the room --- */
  const dStart = (ids, opts) => {
    const r = newRoom(ids);
    applyRoomAction(r, ids[0], 'chooseGame', { game: 'domino' });
    applyRoomAction(r, ids[0], 'start', Object.assign({ mode: 'normal' }, opts || {}));
    return r;
  };
  const handOf = (r, id) => ((r.secrets[id] || {}).hand || []).slice();
  const onTable = (r) => r.shared.table.line.length + r.shared.table.up.length + r.shared.table.down.length;

  const one = newRoom(['a']);
  applyRoomAction(one, 'a', 'chooseGame', { game: 'domino' });
  check(threw(() => applyRoomAction(one, 'a', 'start', {})), 'domino: one player alone is refused (add a computer player)');
  const five = newRoom(['a', 'b', 'c', 'd', 'e']);
  applyRoomAction(five, 'a', 'chooseGame', { game: 'domino' });
  check(threw(() => applyRoomAction(five, 'a', 'start', {})), 'domino: five is one too many');

  let d = dStart(['a', 'b']);
  const total = (r) => r.shared.order.reduce((sum, id) => sum + handOf(r, id).length, 0) + r.shared.bone + onTable(r);
  check(d.shared.drawing && d.shared.order.length === 2 && total(d) === 28 && d.shared.bone === 14, 'domino: two players, seven each and fourteen to draw from');
  check(onTable(d) === 1 && d.shared.events.some((e) => e.type === 'play' && e.forced), 'domino: the first round opens by itself');
  // What the opener held: their hand now, and the tile they opened with.
  const opener = d.shared.events.find((e) => e.type === 'play').pid;
  const before = { a: handOf(d, 'a'), b: handOf(d, 'b') };
  before[opener].push(d.shared.table.root);
  const want = DT.dominoStarter(before, d.shared.order);
  check(want.pid === opener && want.tile === d.shared.table.root, 'domino: …with the double six, else the highest double, else the heaviest tile');
  check(d.shared.turn !== opener, 'domino: and the turn passes to the next seat');
  const leaked = ['a', 'b'].some((id) => handOf(d, id).some((tile) => JSON.stringify(d.shared).indexOf('"' + tile + '"') !== -1));
  check(!leaked && d.secrets.a.hand && d.secrets.b.hand && !('bone' in (d.secrets.a || {})), 'domino: no tile in a hand, or left to draw, is in what every phone is sent');

  const d4 = dStart(['a', 'b', 'c', 'd']);
  check(!d4.shared.drawing && d4.shared.bone === 0 && d4.shared.table.root === '6-6', 'domino: four players hold all 28 - no drawing, and the double six always opens');

  // A tap that is stale, out of turn, or illegal.
  const up = d.shared.turn;
  const other = d.shared.order.find((id) => id !== up);
  const seqWas = d.shared.turnSeq;
  const tableWas = JSON.stringify(d.shared.table);
  applyRoomAction(d, up, 'play', { tile: handOf(d, up)[0], end: 'R', seq: seqWas - 1 });
  check(JSON.stringify(d.shared.table) === tableWas && d.shared.turnSeq === seqWas, 'domino: a tap from a turn that has moved on is dropped');
  check(threw(() => applyRoomAction(d, other, 'play', { tile: handOf(d, other)[0], seq: seqWas })), 'domino: out of turn is refused');
  check(threw(() => applyRoomAction(d, up, 'play', { tile: handOf(d, other)[0], seq: seqWas })), "domino: a tile that isn't yours is refused");

  // A made-up table: every rule on a hand that is known.
  const rig = (r, hands, line, opts) => {
    const g = r._domino;
    // The seats in the order the hands are written, so the turn goes a, b, c, d.
    r.shared.order = Object.keys(hands);
    Object.keys(hands).forEach((id) => { g.hands[id] = hands[id].slice(); });
    if (opts && opts.bone) g.bone = opts.bone.slice();
    r.shared.table = lineOf(line, r.shared.settings.mode);
    r.shared.turn = opts && opts.turn ? opts.turn : r.shared.order[0];
    r.shared.knocked = {};
  };
  d = dStart(['a', 'b']);
  rig(d, { a: ['0-0', '3-6'], b: ['1-1', '2-2'] }, [['6-6', 'R']], { turn: 'a', bone: ['4-4', '1-6', '1-2', '2-4'] });
  check(threw(() => applyRoomAction(d, 'a', 'play', { tile: '0-0', seq: d.shared.turnSeq })), "domino: a tile that doesn't go is refused");
  check(threw(() => applyRoomAction(d, 'a', 'draw', { seq: d.shared.turnSeq })), 'domino: no drawing while a tile goes');
  check(threw(() => applyRoomAction(d, 'a', 'pass', { seq: d.shared.turnSeq })), 'domino: no knocking while a tile goes');
  applyRoomAction(d, 'a', 'play', { tile: '3-6', end: 'L', seq: d.shared.turnSeq });
  check(d.shared.turn === 'b' && handOf(d, 'a').join() === '0-0' && endsOf(d.shared.table) === 'L3 R6', 'domino: a tile played on the end chosen, and the turn passes');
  // b holds 1-1 and 2-2: nothing goes, so b draws until something does: 2-4 no, 1-2 no, 6-1 yes.
  check(threw(() => applyRoomAction(d, 'b', 'pass', { seq: d.shared.turnSeq })), 'domino: with tiles left to draw, knocking is refused');
  applyRoomAction(d, 'b', 'draw', { seq: d.shared.turnSeq });
  check(handOf(d, 'b').length === 5 && d.shared.bone === 1 && d.shared.turn === 'b' && d.shared.events.some((e) => e.type === 'draw' && e.pid === 'b' && e.n === 3),
        'domino: whoever can\'t play draws until a tile goes (three here), and it is still their turn');
  applyRoomAction(d, 'b', 'play', { tile: '1-6', end: 'R', seq: d.shared.turnSeq });
  check(d.shared.turn === 'a' && endsOf(d.shared.table) === 'L3 R1', 'domino: …then plays it');

  // Knocking, and a blocked table.
  d = dStart(['a', 'b', 'c', 'd']);
  rig(d, { a: ['0-1'], b: ['0-2', '5-5'], c: ['3-3', '1-1'], d: ['2-2', '0-4'] }, [['6-6', 'R'], ['5-6', 'R'], ['4-6', 'L']], { turn: 'a' });
  check(threw(() => applyRoomAction(d, 'a', 'draw', { seq: d.shared.turnSeq })), 'domino: four players never draw');
  applyRoomAction(d, 'a', 'pass', { seq: d.shared.turnSeq });
  check(d.shared.turn === 'b' && d.shared.events.some((e) => e.type === 'pass' && e.pid === 'a') && d.shared.knocked.a.join() === '4,5',
        'domino: whoever can\'t play knocks, and the table knows the numbers they lack');
  applyRoomAction(d, 'b', 'play', { tile: '5-5', end: 'R', seq: d.shared.turnSeq });
  check(d.shared.turn === 'c', 'domino: …and play goes on round the table');
  // c holds no 4 and no 5 and knocks; d's 0-4 goes on the 4, and then a's 0-1 on the 0.
  applyRoomAction(d, 'c', 'pass', { seq: d.shared.turnSeq });
  applyRoomAction(d, 'd', 'play', { tile: '0-4', end: 'L', seq: d.shared.turnSeq });
  check(d.shared.phase === 'play' && d.shared.turn === 'a', 'domino: not blocked while someone holds a tile that goes');
  applyRoomAction(d, 'a', 'play', { tile: '0-1', end: 'L', seq: d.shared.turnSeq });
  check(d.shared.phase === 'roundOver' && d.shared.result.how === 'out' && d.shared.result.winner === 'a',
        'domino: the last tile played ends the round');
  check(d.shared.result.raw === 2 + 6 + 2 + 4 && d.shared.scores.a === 14, 'domino: and takes every pip left (0|2, 3|3 + 1|1, 2|2)');
  check(JSON.stringify(d.shared.result.hands.c) === '["3-3","1-1"]', 'domino: the hands are shown at the end of the round');
  applyRoomAction(d, 'a', 'nextRound', { round: d.shared.round });
  check(d.shared.phase === 'play' && d.shared.round === 2 && d.shared.turn === 'a' && onTable(d) === 0,
        'domino: the next round is led by the winner of the last, with any tile');
  applyRoomAction(d, 'a', 'nextRound', { round: 1 });
  check(d.shared.round === 2, 'domino: a second "next round" tap from the last round deals nothing');

  // Blocked, in عادي: the lowest hand takes the rest.
  d = dStart(['a', 'b', 'c']);
  rig(d, { a: ['1-2', '0-0'], b: ['1-1'], c: ['3-4'] }, [['6-6', 'R'], ['5-6', 'R']], { turn: 'a', bone: [] });
  applyRoomAction(d, 'a', 'pass', { seq: d.shared.turnSeq });
  check(d.shared.phase === 'roundOver' && d.shared.result.how === 'blocked' && d.shared.result.winner === 'b' && d.shared.scores.b === 3 + 7,
        'domino: nothing goes and nothing left to draw is قفلة: the lowest hand (2) takes the others (3 + 7)');

  // أمريكاني: a play scores, and so does the end of the round.
  d = dStart(['a', 'b'], { mode: 'american' });
  check(d.shared.settings.target === 50, 'domino: أمريكاني plays to 50 by default');
  rig(d, { a: ['0-5', '1-2'], b: ['4-6', '3-3'] }, [['5-5', 'R'], ['4-5', 'R']], { turn: 'a', bone: [] });
  const scoreA = d.shared.scores.a;
  applyRoomAction(d, 'a', 'play', { tile: '0-5', end: 'L', seq: d.shared.turnSeq });
  const quiet0 = d.shared.events.slice(-1)[0];
  check(d.shared.scores.a === scoreA && quiet0.type === 'play' && quiet0.sum === 4 && !quiet0.pts, 'domino: ends 0 + 4 = 4 score nothing');

  // A play that scores.
  d = dStart(['a', 'b'], { mode: 'american' });
  rig(d, { a: ['1-5', '2-2'], b: ['6-6', '3-4'] }, [['5-5', 'R'], ['4-5', 'R']], { turn: 'a', bone: [] });
  const sA = d.shared.scores.a;
  const gA = d.shared.gained.a || 0;
  applyRoomAction(d, 'a', 'play', { tile: '1-5', end: 'L', seq: d.shared.turnSeq });
  const ev = d.shared.events.slice(-1)[0];
  check(ev.type === 'play' && ev.sum === 5 && ev.pts === 1 && d.shared.scores.a === sA + 1, 'domino: 1 + 4 = 5, a point the moment the tile goes down');
  check(d.shared.gained.a === gA + 1, "domino: and it counts in the round's own points too");

  // Going out in أمريكاني: the rest rounded to 5.
  d = dStart(['a', 'b', 'c'], { mode: 'american' });
  rig(d, { a: ['2-6'], b: ['6-6', '0-1'], c: ['3-4', '0-2'] }, [['5-5', 'R'], ['5-6', 'R']], { turn: 'a', bone: [] });
  const sa = d.shared.scores.a;
  applyRoomAction(d, 'a', 'play', { tile: '2-6', end: 'R', seq: d.shared.turnSeq });
  check(d.shared.phase === 'roundOver' && d.shared.result.raw === 12 + 1 + 7 + 2 && d.shared.result.points === 4 && d.shared.scores.a === sa + 4,
        'domino: going out in أمريكاني takes 22 pips, rounded to 20: 4 points');

  // Teams: the host's seats, partners opposite.
  const t4 = newRoom(['a', 'b', 'c', 'd']);
  applyRoomAction(t4, 'a', 'chooseGame', { game: 'domino' });
  check(threw(() => applyRoomAction(t4, 'b', 'seats', { teams: true })), 'domino: only the host seats the partners');
  applyRoomAction(t4, 'a', 'seats', { teams: true });
  check(t4.shared.lobby.teams && t4.shared.lobby.order.length === 4, 'domino: teams on, the seats are drawn at random');
  applyRoomAction(t4, 'a', 'seats', { teams: true, order: ['d', 'c', 'b', 'a'] });
  check(t4.shared.lobby.order.join() === 'd,c,b,a', 'domino: and the host swaps them');
  applyRoomAction(t4, 'a', 'start', { mode: 'normal', teams: true });
  check(t4.shared.order.join() === 'd,c,b,a' && t4.shared.teams[0].join() === 'd,b' && t4.shared.teams[1].join() === 'c,a'
        && 'A' in t4.shared.scores && !('a' in t4.shared.scores), 'domino: seats 1 & 3 against 2 & 4, scored as two sides');
  const t3 = newRoom(['a', 'b', 'c']);
  applyRoomAction(t3, 'a', 'chooseGame', { game: 'domino' });
  check(threw(() => applyRoomAction(t3, 'a', 'start', { teams: true })), 'domino: teams need four');

  // The game ends at the target.
  d = dStart(['a', 'b'], { target: 51 });
  rig(d, { a: ['0-6'], b: ['6-6', '5-5', '4-4', '3-3', '2-2'] }, [['0-0', 'R']], { turn: 'a', bone: [] });
  d.shared.scores.a = 40;
  applyRoomAction(d, 'a', 'play', { tile: '0-6', seq: d.shared.turnSeq });
  check(d.shared.phase === 'gameover' && d.shared.winner === 'a' && d.shared.winners.join() === 'a' && d.shared.board[0].id === 'a',
        'domino: past the target the game is over, and the board is best first');
  check(threw(() => applyRoomAction(d, 'b', 'playAgain', {})), 'domino: only the host deals again');
  applyRoomAction(d, 'a', 'playAgain', {});
  check(d.shared.phase === 'play' && d.shared.round === 1 && d.shared.settings.target === 51 && d.shared.order.join() === d.shared.roster.join(),
        'domino: play again keeps the options and the seats');

  // The clock plays for a phone that doesn't.
  d = dStart(['a', 'b'], { turnClock: 30 });
  check(typeof d.shared.endsAt === 'number' && roomDeadline(d) === d.shared.endsAt + 1500, 'domino: the turn clock is a server deadline');
  const clockUp = d.shared.turn;
  const handsWas = handOf(d, clockUp).length;
  roomTimeout(d, d.shared.endsAt + 1600);
  check(d.shared.events.some((e) => e.type === 'auto' && e.pid === clockUp && e.why === 'clock') && (d.shared.turn !== clockUp || handOf(d, clockUp).length !== handsWas),
        'domino: when it runs out the phone plays for them (a tile, a draw, or a knock)');

  // The host moves a quiet phone on, the same way.
  d = dStart(['a', 'b', 'c']);
  const quiet = d.shared.turn;
  const guest = d.shared.order.find((id) => id !== 'a');
  check(threw(() => applyRoomAction(d, guest, 'skipTurn', { seq: d.shared.turnSeq })), 'domino: only the host plays for someone');
  applyRoomAction(d, 'a', 'skipTurn', { seq: d.shared.turnSeq });
  check(d.shared.events.some((e) => e.type === 'auto' && e.pid === quiet && e.why === 'host'), 'domino: the host plays for a quiet phone');

  // Someone leaves.
  d = dStart(['a', 'b', 'c']);
  const gone = d.shared.turn;
  leave(d, gone);
  check(d.shared.phase === 'play' && d.shared.order.length === 2 && d.shared.order.indexOf(gone) === -1 && d.shared.turn && d.shared.turn !== gone
        && !(gone in d.shared.counts), 'domino: whoever leaves, their tiles are set aside and the turn moves on');
  leave(d, d.shared.order.find((id) => id !== 'a'));
  check(d.shared.phase === 'gameover', 'domino: one player left ends the game');
  const tl4 = newRoom(['a', 'b', 'c', 'd']);
  applyRoomAction(tl4, 'a', 'chooseGame', { game: 'domino' });
  applyRoomAction(tl4, 'a', 'start', { teams: true });
  leave(tl4, 'c');
  check(tl4.shared.phase === 'gameover' && tl4.shared.ended === 'left', 'domino: in teams, a side one short ends the game');
}

/* --- مافيا: the narrator is a room setting, off unless asked for ---------- */
{
  const mf = newRoom(['a', 'b', 'c', 'd', 'e']);
  applyRoomAction(mf, 'a', 'chooseGame', { game: 'mafia' });
  applyRoomAction(mf, 'a', 'start', { mode: 'classic' });
  check(mf.shared.narrate === false, 'mafia: the narrator is off unless the host turns it on');
  applyRoomAction(mf, 'a', 'backToHub', {});
  applyRoomAction(mf, 'a', 'chooseGame', { game: 'mafia' });
  applyRoomAction(mf, 'a', 'start', { mode: 'classic', narrate: true });
  check(mf.shared.narrate === true, 'mafia: and on for the whole room when they do');
  // It never leaks a role, and nothing in shared tells a phone what to say.
  check(!JSON.stringify(mf.shared).includes('"roles":{'), 'mafia: the narrator setting carries no roles with it');
}

/* --- كونكت ٤ and نقط ومربعات: the shared rules and the phone's player ------- */
// The phone's player thinks against the real clock: its time budget is a
// deadline. The test clock is put back after this block, for what follows.
const duelTestClock = Date.now;
Date.now = realNow;
{
  const src = (name) => readFileSync(new URL('../../' + name, import.meta.url), 'utf8');
  const C4 = new Function(src('Connect4.js') + '\nreturn { c4NewBoard, c4Play, c4DropRow, c4LegalCols, c4Winner, c4BestMove };')();
  const DB = new Function(src('DotsBoxes.js') + '\nreturn { dotsNewBoard, dotsPlay, dotsGeom, dotsBestMove, dotsSafe, dotsCaptures, dotsFree, dotsCounts, dotsSides, dotsComponents, dotsDoubleDeal };')();
  // A seeded source, so a failure can be played again.
  const seeded = (seed) => () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
  // A full board with no line of four: pairs of columns alternating, row by row.
  const noLine = (i) => 1 + ((Math.floor(i / 7) + Math.floor((i % 7) / 2)) % 2);

  // A disc.
  const playCols = (b, cols) => cols.map((c, i) => C4.c4Play(b, c, (i % 2) + 1));
  let b = C4.c4NewBoard(4);
  check(b.cols === 7 && b.rows === 6 && b.grid.length === 42, 'connect4: the classic board is 7 wide and 6 high');
  check(C4.c4NewBoard(5).cols === 9 && C4.c4NewBoard(5).rows === 6 && C4.c4NewBoard('x').n === 4,
        'connect4: 5 in a row is Hasbro\'s 9 x 6, anything else the classic 4');
  const moves = playCols(b, [0, 1, 0, 1, 0, 1]);
  check(moves[0].row === 5 && moves[2].row === 4 && moves.every((m) => !m.win), 'connect4: a disc falls to the lowest free cell');
  let last = C4.c4Play(b, 0, 1);
  check(last.win && last.cells.length === 4 && last.cells.every((i) => i % 7 === 0), 'connect4: four down a column wins, and the run is those four');
  b = C4.c4NewBoard(4);
  playCols(b, [0, 0, 1, 1, 2, 2]);
  last = C4.c4Play(b, 3, 1);
  check(last.win && JSON.stringify(last.cells) === '[35,36,37,38]', 'connect4: four across wins, lit in order from one end');
  b = C4.c4NewBoard(4);
  playCols(b, [0, 1, 1, 2, 2, 3, 2, 3, 3, 6]);
  last = C4.c4Play(b, 3, 1);
  check(last.win && last.cells.length === 4, 'connect4: four on a diagonal wins');
  b = C4.c4NewBoard(5);
  playCols(b, [0, 0, 1, 1, 2, 2]);
  last = C4.c4Play(b, 3, 1);
  check(!last.win, 'connect4: four across is not enough when it is 5 in a row');
  C4.c4Play(b, 3, 2);
  last = C4.c4Play(b, 4, 1);
  check(last.win && last.cells.length === 5, 'connect4: five across wins it');
  b = C4.c4NewBoard(4);
  playCols(b, [2, 2, 2, 2, 2, 2]);
  check(C4.c4DropRow(b, 2) === -1 && C4.c4Play(b, 2, 1) === null && C4.c4Play(b, 7, 1) === null && C4.c4Play(b, 1.5, 1) === null,
        'connect4: a full column, or no column at all, is refused');
  const drawn = C4.c4NewBoard(4);
  drawn.grid = drawn.grid.map((_, i) => noLine(i));
  check(C4.c4Winner(drawn) === 'draw', 'connect4: a full board with no line is a draw');
  drawn.grid[0] = 0;
  const lastDisc = C4.c4Play(drawn, 0, 1);
  check(lastDisc.draw && !lastDisc.win, 'connect4: and the disc that fills it says so');

  // The phone as a player: always a legal column, a win taken, a threat blocked.
  let legal = true;
  const rnd = seeded(7);
  for (let g = 0; g < 30 && legal; g++) {
    const bb = C4.c4NewBoard(g % 3 === 0 ? 5 : 4);
    let p = 1;
    for (let m = 0; m < 60; m++) {
      const c = C4.c4BestMove(bb, p, ['easy', 'medium', 'hard'][(g + m) % 3], { rnd: rnd, budget: 30 });
      const res = C4.c4Play(bb, c, p);
      if (!res) { legal = false; break; }
      if (res.win || res.draw) break;
      p = 3 - p;
    }
  }
  check(legal, 'connect4: the phone always drops in a column with room, at every level');
  const threat = C4.c4NewBoard(4);
  playCols(threat, [0, 6, 1, 6, 2]);          // red has three across the bottom
  check(C4.c4BestMove(threat, 2, 'hard', { rnd: seeded(1) }) === 3 && C4.c4BestMove(threat, 2, 'medium', { rnd: seeded(2) }) === 3,
        'connect4: medium and hard block three in a row');
  C4.c4Play(threat, 5, 2);
  check(C4.c4BestMove(threat, 1, 'hard', { rnd: seeded(3) }) === 3 && C4.c4BestMove(threat, 1, 'medium', { rnd: seeded(4) }) === 3,
        'connect4: and take a win when it is there');
  const t0 = Date.now();
  C4.c4BestMove(C4.c4NewBoard(5), 1, 'hard', { budget: 250 });
  check(Date.now() - t0 < 600, 'connect4: hard thinks inside its time budget, never holding the page');
  check(C4.c4BestMove(drawn, 1, 'hard') === -1, 'connect4: a full board has no move');

  // Dots: the lines and the boxes.
  let d = DB.dotsNewBoard(4);
  check(d.lines.length === 40 && d.boxes.length === 16 && DB.dotsNewBoard(8).lines.length === 144 && DB.dotsNewBoard(5).n === 4,
        'dots: 4x4 is 40 lines and 16 boxes, 8x8 144 lines; any other size is 4');
  const g4 = DB.dotsGeom(4);
  const box0 = g4.boxEdges[0];
  const r1 = DB.dotsPlay(d, box0[0], 1), r2 = DB.dotsPlay(d, box0[1], 2), r3 = DB.dotsPlay(d, box0[2], 1);
  const r4 = DB.dotsPlay(d, box0[3], 2);
  check(!r1.again && !r2.again && !r3.again && r4.boxes.length === 1 && d.boxes[0] === 2 && r4.again,
        'dots: the fourth side takes the box for whoever drew it, and they go again');
  check(DB.dotsPlay(d, box0[0], 1) === null && DB.dotsPlay(d, 999, 1) === null, 'dots: a line already drawn, or no line at all, is refused');
  d = DB.dotsNewBoard(4);
  const middle = g4.boxEdges[0][3];     // box 0's right side is box 1's left
  g4.boxEdges[0].concat(g4.boxEdges[1]).filter((e) => e !== middle).forEach((e) => { d.lines[e] = 1; });
  const both = DB.dotsPlay(d, middle, 2);
  check(both.boxes.length === 2 && d.boxes[0] === 2 && d.boxes[1] === 2, 'dots: one line can take two boxes');
  d = DB.dotsNewBoard(4);
  let end = null;
  DB.dotsFree(d).forEach((e, i) => { end = DB.dotsPlay(d, e, (i % 2) + 1); });
  check(end.over && !end.again && DB.dotsCounts(d)[0] === 0, 'dots: the last line ends the game with every box taken');

  // The phone as a player: always a free line; medium and hard never give a
  // third side while a safe line is left; medium takes a box that is there.
  let okDots = true, okSafe = true, okTake = true;
  const rndD = seeded(11);
  for (let g = 0; g < 24; g++) {
    const bd = DB.dotsNewBoard([4, 6, 8][g % 3]);
    let p = 1;
    for (let m = 0; m < 400; m++) {
      const level = ['easy', 'medium', 'hard'][(g + m) % 3];
      const safe = DB.dotsSafe(bd), caps = DB.dotsCaptures(bd);
      const e = DB.dotsBestMove(bd, p, level, { rnd: rndD, budget: 40 });
      if (level !== 'easy' && !caps.length && safe.length && safe.indexOf(e) === -1) okSafe = false;
      if (level === 'medium' && caps.length && caps.indexOf(e) === -1) okTake = false;
      const res = DB.dotsPlay(bd, e, p);
      if (!res) { okDots = false; break; }
      if (res.over) break;
      if (!res.again) p = 3 - p;
    }
  }
  check(okDots, 'dots: the phone always draws a free line, at every level and size');
  check(okSafe, 'dots: medium and hard never give a third side while a safe line is left');
  check(okTake, 'dots: medium takes a box when one is there');

  // The endgame: a chain of three handed over beside a chain of four. Taking all
  // three would leave hard to open the four; taking one and handing two back
  // with the double-dealing line keeps control, and the four with it.
  const endgame = DB.dotsNewBoard(4);
  const own = (bx) => { endgame.boxes[bx] = 1; g4.boxEdges[bx].forEach((e) => { endgame.lines[e] = endgame.lines[e] || 1; }); };
  [3, 4, 5, 6, 7, 12, 13, 14, 15].forEach(own);
  [0, 1, 2].forEach((bx) => { endgame.lines[g4.boxEdges[bx][0]] = 2; });    // the tops along the edge
  const comps = DB.dotsComponents(endgame);
  check(DB.dotsSides(endgame, 2) === 3 && DB.dotsSides(endgame, 0) === 2 && comps.some((c) => c.type === 'chain' && c.size === 4),
        'dots: the test position is a chain of three opened at one end, beside a chain of four');
  const firstTake = DB.dotsBestMove(endgame, 1, 'hard', { rnd: seeded(5) });
  check(firstTake === g4.boxEdges[2][2], 'dots: hard takes the first box of the chain it was handed');
  DB.dotsPlay(endgame, firstTake, 1);
  const deal = DB.dotsDoubleDeal(endgame);
  const dd = DB.dotsBestMove(endgame, 1, 'hard', { rnd: seeded(6) });
  check(!!deal && dd === deal.edge && dd === g4.boxEdges[0][2],
        'dots: then leaves the last two with the double-dealing line, keeping control of the chain of four');
  const medium = DB.dotsBestMove(endgame, 1, 'medium', { rnd: seeded(6) });
  check(medium === g4.boxEdges[1][2], 'dots: medium just takes the box');
}
Date.now = duelTestClock;

/* --- the duels in rooms: two play, winner stays on --------------------------- */
{
  const duel = (game, ids, payload) => {
    const r = newRoom(ids);
    applyRoomAction(r, ids[0], 'chooseGame', { game });
    applyRoomAction(r, ids[0], 'start', payload || {});
    return r;
  };
  const refused = (fn) => { try { fn(); return false; } catch (e) { return true; } };
  const noLine = (i) => 1 + ((Math.floor(i / 7) + Math.floor((i % 7) / 2)) % 2);
  const drop = (r, col) => applyRoomAction(r, r.shared.seats[r.shared.turn], 'move', { col, move: r.shared.moves });

  const r = duel('connect4', ['a', 'b', 'c'], { mode: 4 });
  check(r.phase === 'play' && r.shared.phase === 'play' && r.shared.seats.length === 2 && r.shared.line.length === 1 &&
        r.shared.turn === 0 && r.shared.cols === 7 && r.shared.roster.length === 3,
        'duel: two sit down, the third waits in line, the first seat moves');
  const watcher = r.shared.line[0];
  const firstSeat = r.shared.seats[0], secondSeat = r.shared.seats[1];
  check(refused(() => applyRoomAction(r, watcher, 'move', { col: 0, move: 0 })), 'duel: someone in the line cannot move');
  check(refused(() => applyRoomAction(r, secondSeat, 'move', { col: 0, move: 0 })), 'duel: nor the seat whose turn it is not');
  drop(r, 3);
  applyRoomAction(r, firstSeat, 'move', { col: 3, move: 0 });
  check(r.shared.moves === 1 && r.shared.turn === 1, 'duel: a tap drawn for a board that has moved on is dropped');
  [4, 3, 4, 3, 4, 3].forEach((c) => drop(r, c));
  check(r.shared.phase === 'over' && r.phase === 'over' && r.shared.result.winnerId === firstSeat && r.shared.win.length === 4,
        'duel: four in a row ends the game and names the winner');
  check(r.shared.scores[firstSeat] === 1 && r.shared.board[0].id === firstSeat && r.shared.streak.n === 1,
        'duel: a win is a point on the board, best first');
  check(JSON.stringify(r.shared.line) === JSON.stringify([watcher, secondSeat]), 'duel: the loser goes to the back of the line');
  applyRoomAction(r, watcher, 'move', { col: 0, move: r.shared.moves });
  check(r.shared.phase === 'over' && r.shared.moves === 7, 'duel: nothing moves once it is over');
  applyRoomAction(r, watcher, 'nextRound', { round: r.shared.round });
  check(r.shared.phase === 'play' && r.shared.seats[0] === watcher && r.shared.seats[1] === firstSeat && r.shared.round === 2,
        'duel: the next in line sits down against the winner, and the challenger moves first');
  check(r.shared.grid.every((v) => v === 0) && r.shared.turn === 0 && r.shared.prev && r.shared.prev.winnerId === firstSeat,
        'duel: on a fresh board, with the last game remembered');
  applyRoomAction(r, watcher, 'nextRound', { round: 1 });
  check(r.shared.round === 2 && r.shared.phase === 'play', 'duel: a second "next game" for the same game is dropped');

  // A draw: the champion keeps the seat and the challenger goes to the back.
  r.shared.grid = r.shared.grid.map((_, i) => noLine(i));
  r.shared.grid[0] = 0;                     // the one empty cell is seat 0's colour
  r.shared.moves = 41;
  r.shared.turn = 0;
  drop(r, 0);
  check(r.shared.phase === 'over' && r.shared.result.draw && r.shared.champ === firstSeat && r.shared.line[r.shared.line.length - 1] === watcher,
        'duel: a draw keeps the champion in the seat and sends the challenger to the back');
  check(!r.shared.scores[watcher] && r.shared.scores[firstSeat] === 1, 'duel: and nobody scores');
  applyRoomAction(r, 'a', 'nextRound', { round: r.shared.round });
  check(r.shared.seats[0] === secondSeat && r.shared.seats[1] === firstSeat, 'duel: whoever waited longest challenges next');

  // A seated player leaving loses by forfeit; the next game seats who is left.
  const quitter = r.shared.seats[0];
  leave(r, quitter);
  check(r.shared.phase === 'over' && r.shared.result.reason === 'left' && r.shared.result.winnerId === firstSeat &&
        r.shared.result.loserName === quitter.toUpperCase() && r.shared.line.indexOf(quitter) === -1,
        'duel: a seated player who leaves loses by forfeit, and is out of the line');
  check(r.shared.scores[firstSeat] === 2 && r.shared.streak.n === 2, 'duel: the forfeit is a win for whoever is left');
  applyRoomAction(r, firstSeat, 'nextRound', { round: r.shared.round });
  check(r.shared.phase === 'play' && r.shared.seats.indexOf(quitter) === -1 && r.shared.seats[0] === watcher,
        'duel: the next game seats the two still here, the challenger first');

  // Exactly two: they keep playing, and whoever went second goes first.
  const two = duel('connect4', ['x', 'y'], {});
  const t1 = two.shared.seats.slice();
  [0, 1, 0, 1, 0, 1, 0].forEach((c) => drop(two, c));
  check(two.shared.result.winnerId === t1[0], 'duel for two: the first seat wins');
  applyRoomAction(two, 'y', 'nextRound', { round: two.shared.round });
  check(JSON.stringify(two.shared.seats) === JSON.stringify([t1[1], t1[0]]), 'duel for two: the winner does not keep the first move; it alternates');
  drop(two, 0);
  const stayer = two.shared.seats[0];
  leave(two, two.shared.seats[1]);
  check(two.shared.phase === 'over' && two.shared.result.reason === 'left' && two.shared.result.winnerId === stayer,
        'duel for two: leaving mid-game forfeits');
  check(refused(() => applyRoomAction(two, stayer, 'nextRound', { round: two.shared.round })), 'duel: alone, there is no next game');
  two.players.push({ id: 'z', name: 'Z' });
  applyRoomAction(two, 'z', 'nextRound', { round: two.shared.round });
  check(two.shared.phase === 'play' && two.shared.seats[0] === 'z' && two.shared.seats[1] === stayer,
        'duel: someone who joins joins the line, and challenges first');

  // Hasbro's board, and the champion leaving between games.
  const five = duel('connect4', ['p', 'q', 'u'], { mode: 5 });
  check(five.shared.cols === 9 && five.shared.n === 5, 'duel: the host can pick 5 in a row');
  const champ5 = five.shared.seats[0];
  [0, 1, 0, 1, 0, 1, 0, 1, 0].forEach((c) => drop(five, c));
  check(five.shared.result.winnerId === champ5 && five.shared.win.length === 5, 'duel: five down wins on the big board');
  leave(five, champ5);
  applyRoomAction(five, five.players[0].id, 'nextRound', { round: five.shared.round });
  check(five.shared.phase === 'play' && five.shared.seats.indexOf(champ5) === -1 && five.shared.seats.length === 2,
        'duel: a champion who leaves between games leaves the seat to the line');

  // نقط ومربعات: a box taken is another turn, the most boxes win, a draw is possible.
  const dr = duel('dots', ['a', 'b', 'c'], { size: 6 });
  check(dr.shared.size === 6 && dr.shared.lines.length === 84 && dr.shared.boxes.length === 36, 'duel dots: the host picks the size');
  const line = (edge) => applyRoomAction(dr, dr.shared.seats[dr.shared.turn], 'move', { edge, move: dr.shared.moves });
  const sides = [0, 6, 42, 43];              // box (0, 0) on 6x6: top, bottom, left, right
  line(sides[0]); line(sides[1]); line(sides[2]);
  const taker = dr.shared.seats[dr.shared.turn];
  const takerSeat = dr.shared.seats.indexOf(taker);
  line(sides[3]);
  check(dr.shared.boxes[0] === takerSeat + 1 && dr.shared.seats[dr.shared.turn] === taker && dr.shared.count[takerSeat] === 1 &&
        JSON.stringify(dr.shared.last.boxes) === '[0]',
        'duel dots: the fourth side takes the box and the same player goes again');
  check(refused(() => line(sides[0])), 'duel dots: a line already drawn is refused');
  for (let e = 0; e < dr.shared.lines.length && dr.shared.phase === 'play'; e++) if (!dr.shared.lines[e]) line(e);
  const cnt = dr.shared.count;
  check(dr.shared.phase === 'over' && cnt[0] + cnt[1] === 36 &&
        (dr.shared.result.draw ? cnt[0] === cnt[1] : dr.shared.result.winnerId === dr.shared.seats[cnt[0] > cnt[1] ? 0 : 1]),
        'duel dots: every box taken ends it, and the most boxes win');
  const lv = duel('dots', ['m', 'n'], { size: 4 });
  lv.shared.lines = lv.shared.lines.map(() => 1);
  lv.shared.boxes = lv.shared.boxes.map((_, i) => (i < 8 ? 1 : 2));
  lv.shared.boxes[15] = 0;
  lv.shared.lines[39] = 0;                   // box 15's right side, the last line of 4x4
  lv.shared.turn = 1;
  applyRoomAction(lv, lv.shared.seats[1], 'move', { edge: 39, move: lv.shared.moves });
  check(lv.shared.phase === 'over' && lv.shared.result.draw && lv.shared.count[0] === 8 && lv.shared.count[1] === 8 && !lv.shared.scores[lv.shared.seats[1]],
        'duel dots: eight boxes each is a draw');
}

/* --- أونو: the cards, every move, the bots, and what never leaves the server ------ */
{
  const UNO = new Function(readFileSync(new URL('../../UnoCards.js', import.meta.url), 'utf8') +
    '\nreturn { unoDeck, unoCanPlay, unoPoints, unoHandPoints, unoSameCard, unoDecksFor, unoSorted, unoDrawOf, unoColorOf };')();
  const same = { stacking: true, stackMode: 'same' };
  const mixed = { stacking: true, stackMode: 'mixed' };
  const off = { stacking: false, stackMode: 'same' };

  // The cards on their own.
  const deck = UNO.unoDeck(1);
  const count = (k) => deck.filter((x) => x === k).length;
  check(deck.length === 108 && UNO.unoDeck(2).length === 216, 'uno: the deck is 108 cards, two decks 216');
  check(count('r0') === 1 && count('y5') === 2 && count('gs') === 2 && count('bv') === 2 && count('rd') === 2 && count('w') === 4 && count('w4') === 4,
    'uno: one 0 and two of each 1-9, skip, reverse and +2 per colour; four wilds and four +4s');
  check(UNO.unoDecksFor(10) === 1 && UNO.unoDecksFor(11) === 2 && UNO.unoDecksFor(12) === 2, 'uno: one deck up to ten players, two for eleven and twelve');
  check(UNO.unoPoints('r7') === 7 && UNO.unoPoints('g0') === 0 && UNO.unoPoints('bs') === 20 && UNO.unoPoints('yv') === 20 && UNO.unoPoints('rd') === 20 &&
    UNO.unoPoints('w') === 50 && UNO.unoPoints('w4') === 50 && UNO.unoHandPoints(['r7', 'bs', 'w4']) === 77,
    'uno: a number counts its face, skip/reverse/+2 20, a wild 50');
  check(UNO.unoCanPlay('r2', 'r7', 'r', null, same) && UNO.unoCanPlay('g7', 'r7', 'r', null, same) && UNO.unoCanPlay('gs', 'rs', 'r', null, same) &&
    !UNO.unoCanPlay('g2', 'r7', 'r', null, same) && !UNO.unoCanPlay('gs', 'rv', 'r', null, same),
    'uno: a card goes on its colour, its number or its symbol, and nothing else');
  check(UNO.unoCanPlay('w', 'r7', 'r', null, same) && UNO.unoCanPlay('w4', 'g2', 'g', null, same), 'uno: a wild, and a +4, go on anything (no challenge)');
  check(UNO.unoCanPlay('r5', 'w', 'r', null, same) && !UNO.unoCanPlay('g5', 'w', 'r', null, same) && UNO.unoCanPlay('b3', 'w4', 'b', null, same),
    'uno: on a wild, the colour it named');
  check(!UNO.unoCanPlay('gd', 'rd', 'r', { n: 2, kind: 'd' }, off) && !UNO.unoCanPlay('r5', 'rd', 'r', { n: 2, kind: 'd' }, same),
    'uno: a draw waiting is answered only by stacking');
  check(UNO.unoCanPlay('gd', 'rd', 'r', { n: 2, kind: 'd' }, same) && !UNO.unoCanPlay('w4', 'rd', 'r', { n: 2, kind: 'd' }, same) &&
    UNO.unoCanPlay('w4', 'w4', 'b', { n: 4, kind: 'w4' }, same) && !UNO.unoCanPlay('bd', 'w4', 'b', { n: 4, kind: 'w4' }, same),
    'uno: stacking: +2 on +2 (any colour), +4 on +4, and not across');
  check(UNO.unoCanPlay('w4', 'rd', 'r', { n: 2, kind: 'd' }, mixed) && !UNO.unoCanPlay('bd', 'w4', 'b', { n: 6, kind: 'w4' }, mixed),
    'uno: "also +4 on a +2": a +4 answers a +2, a +2 never answers a +4');
  check(UNO.unoSameCard('r5', 'r5') && !UNO.unoSameCard('r5', 'g5') && !UNO.unoSameCard('w', 'w') && !UNO.unoSameCard('w4', 'w4'),
    'uno: jump in is the very same card, never a wild');
  check(UNO.unoSorted([{ i: 1, k: 'w' }, { i: 2, k: 'b2' }, { i: 3, k: 'r9' }, { i: 4, k: 'r1' }]).map((c) => c.k).join() === 'r1,r9,b2,w',
    'uno: a hand is held by colour, then value, the wilds last');

  // A table the tests can set: hands by seat, the top card, the colour, who is up.
  let cid = 5000;
  const cards = (...ks) => ks.map((k) => ({ i: cid++, k }));
  const unoStart = (ids, opts) => {
    const r = newRoom(ids);
    applyRoomAction(r, ids[0], 'chooseGame', { game: 'uno' });
    applyRoomAction(r, ids[0], 'start', Object.assign({}, opts || {}));
    return r;
  };
  const u = (r, pid, action, payload = {}) => applyRoomAction(r, pid, action, Object.assign({ seq: r.shared.turnSeq }, payload));
  const uThrew = (r, pid, action, payload) => threw(() => u(r, pid, action, payload));
  const seat = (r, i) => r.shared.order[i];
  const up = (r) => r.shared.turn && r.shared.turn.pid;
  const hand = (r, pid) => r._uno.hands[pid];
  const kinds = (r, pid) => hand(r, pid).map((c) => c.k).join();
  const idOf = (r, pid, k) => (hand(r, pid).find((c) => c.k === k) || {}).i;
  const topK = (r) => r._uno.pile[r._uno.pile.length - 1].k;
  // Writes every phone's slice from the table as set (a catch aimed at nobody does nothing but sync).
  const sync = (r) => applyRoomAction(r, seat(r, 0), 'catchUno', { target: '-' });
  const setTable = (r, hands, top, o = {}) => {
    r.shared.order.forEach((id, i) => { r._uno.hands[id] = hands[i] ? cards(...hands[i]) : []; });
    r._uno.pile = cards(top);
    if (o.c) r._uno.pile[0].c = o.c;
    r._uno.deck = cards(...(o.deck || ['g1', 'g2', 'g3', 'g4', 'g5', 'g6', 'g7', 'g8', 'g9', 'g1', 'g2', 'g3']));
    r._uno.drawnId = null;
    r.shared.color = o.c || UNO.unoColorOf(top);
    r.shared.pending = o.pending || null;
    r.shared.dir = o.dir || 1;
    r.shared.said = [];
    r.shared.unoCatch = null;
    r.shared.turn = { pid: seat(r, o.up || 0), stage: 'play' };
    r.shared.turnSeq++;
    sync(r);
  };

  {
    // The deal.
    const r = unoStart(['a', 'b', 'c', 'd']);
    const total = Object.values(r._uno.hands).reduce((n, h) => n + h.length, 0) + r._uno.deck.length + r._uno.pile.length;
    check(r.shared.phase === 'play' && r.shared.order.every((id) => hand(r, id).length === 7 && r.shared.counts[id] === 7) && total === 108 && r._uno.pile.length === 1,
      'uno: seven cards each, one turned up, the rest in the deck');
    check(topK(r) !== 'w4', 'uno: the card turned up is never a +4');
    check(r.shared.order.every((id) => r.secrets[id].hand.length === 7 && r.secrets[id].hand.every((c) => hand(r, id).some((x) => x.i === c.i))),
      "uno: each phone's slice is its own hand");
    const shared = JSON.stringify(r.shared);
    const hidden = Object.values(r._uno.hands).flat().concat(r._uno.deck).map((c) => c.i);
    check(!hidden.some((i) => shared.indexOf('"i":' + i + ',') !== -1 || shared.indexOf('"i":' + i + '}') !== -1), 'uno: shared carries no card of any hand or of the deck');
    check(r.shared.settings.stacking === true && r.shared.settings.stackMode === 'same' && !r.shared.settings.drawUntil && !r.shared.settings.sevenO &&
      !r.shared.settings.jumpIn && r.shared.settings.length === 'one' && r.shared.settings.turnClock === 0,
      'uno: the defaults: stacking (same kind), one card drawn, no 7-0, no jump-in, one round, no clock');
    const big = unoStart(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k']);
    const bigTotal = Object.values(big._uno.hands).reduce((n, h) => n + h.length, 0) + big._uno.deck.length + big._uno.pile.length;
    check(bigTotal === 216 && big.shared.decks === 2, 'uno: eleven players play with two decks');
    check(threw(() => unoStart(['a'])), 'uno: one player alone cannot start');
  }

  {
    // The card turned up acts on the first player. Dealt until each kind comes up.
    const dealUntil = (want, opts) => {
      for (let n = 0; n < 600; n++) {
        const r = unoStart(['a', 'b', 'c', 'd'], opts);
        if (want(r._uno.pile[0].k)) return r;
      }
      return null;
    };
    const skip = dealUntil((k) => k.charAt(1) === 's');
    check(skip && up(skip) === seat(skip, 1) && skip.shared.events.some((e) => e.type === 'skip' && e.pid === seat(skip, 0)), 'uno: a skip turned up skips the first player');
    const rev = dealUntil((k) => k.length === 2 && k.charAt(1) === 'v');
    check(rev && rev.shared.dir === -1 && up(rev) === seat(rev, 3), 'uno: a reverse turned up turns the play round, and the dealer starts');
    const d2 = dealUntil((k) => k.charAt(1) === 'd');
    check(d2 && d2.shared.pending && d2.shared.pending.n === 2 && up(d2) === seat(d2, 0) && hand(d2, seat(d2, 0)).length === 7,
      'uno: a +2 turned up with stacking on waits on the first player, who may stack on it');
    const d2off = dealUntil((k) => k.charAt(1) === 'd', { stacking: false });
    check(d2off && !d2off.shared.pending && hand(d2off, seat(d2off, 0)).length === 9 && up(d2off) === seat(d2off, 1),
      'uno: without stacking the first player draws two and is skipped');
    const wild = dealUntil((k) => k === 'w');
    check(wild && wild.shared.turn.stage === 'color' && wild.shared.color === null && uThrew(wild, seat(wild, 0), 'play', { card: hand(wild, seat(wild, 0))[0].i }),
      'uno: a wild turned up: the first player picks the colour before anything else');
    if (wild) {
      check(uThrew(wild, seat(wild, 1), 'pickColor', { color: 'g' }), 'uno: only the first player picks it');
      u(wild, seat(wild, 0), 'pickColor', { color: 'g' });
      check(wild.shared.color === 'g' && wild.shared.turn.stage === 'play' && up(wild) === seat(wild, 0), 'uno: then plays on that colour');
    }
  }

  {
    // Playing, drawing, a stale tap.
    const r = unoStart(['a', 'b', 'c', 'd']);
    setTable(r, [['r2', 'g7', 'b9'], ['g2', 'y4', 'y5'], ['b1', 'y2', 'y8'], ['b4', 'b5', 'b6']], 'r7', { deck: ['y9', 'g3'] });
    const [A, B, C, D] = r.shared.order;
    check(uThrew(r, B, 'play', { card: idOf(r, B, 'g2') }), 'uno: only the player up plays');
    check(uThrew(r, A, 'play', { card: idOf(r, A, 'b9') }), 'uno: a card that does not fit is refused');
    check(uThrew(r, A, 'play', { card: idOf(r, B, 'g2') }), "uno: a card you don't hold is refused");
    const seq = r.shared.turnSeq;
    u(r, A, 'play', { card: idOf(r, A, 'g7') });
    check(topK(r) === 'g7' && r.shared.color === 'g' && up(r) === B && r.shared.counts[A] === 2 && r.shared.turnSeq > seq,
      'uno: a seven on a seven changes the colour, and the turn passes');
    const last = r.shared.events[r.shared.events.length - 1];
    check(last.type === 'play' && last.card.k === 'g7' && last.pid === A && last.left === 2, 'uno: the play is an event with the card and what is left');
    applyRoomAction(r, A, 'play', { card: idOf(r, A, 'r2'), seq: seq });
    check(topK(r) === 'g7' && r.shared.counts[A] === 2, 'uno: a tap with a stale seq is dropped quietly');
    u(r, B, 'play', { card: idOf(r, B, 'g2') });
    // C holds no green and no 2: draws. The deck gives g3, which fits.
    check(uThrew(r, C, 'keep'), 'uno: nothing to keep before drawing');
    u(r, C, 'draw');
    const drawn = r.secrets[C].drawn;
    check(hand(r, C).length === 4 && r.shared.turn.stage === 'drawn' && hand(r, C).some((c) => c.i === drawn && c.k === 'g3') && r.secrets[D].drawn === null,
      'uno: a card drawn that fits waits to be played or kept, and only the drawer knows it');
    const ev = r.shared.events[r.shared.events.length - 1];
    check(ev.type === 'draw' && ev.n === 1 && !('card' in ev) && JSON.stringify(r.shared).indexOf('"i":' + drawn + ',') === -1, 'uno: nothing shared says what was drawn');
    check(uThrew(r, C, 'play', { card: idOf(r, C, 'y2') }), 'uno: after drawing, only the drawn card can be played');
    u(r, C, 'keep');
    check(up(r) === D && hand(r, C).length === 4 && topK(r) === 'g2', 'uno: kept, the turn passes');
    // D holds no green and no 2: draws y9, which doesn't fit, and the turn passes by itself.
    u(r, D, 'draw');
    check(up(r) === A && hand(r, D).length === 4 && r.shared.turn.stage === 'play', "uno: a card drawn that doesn't fit ends the turn");
  }

  {
    // Draw until you can play.
    const r = unoStart(['a', 'b'], { drawUntil: true });
    setTable(r, [['y1', 'y2'], ['b4', 'b5']], 'r7', { deck: ['r3', 'b2', 'g8', 'y6'] });
    const [A] = r.shared.order;
    u(r, A, 'draw');
    check(hand(r, A).length === 6 && r.shared.turn.stage === 'drawn' && r.secrets[A].drawn === idOf(r, A, 'r3') && r.shared.events.slice(-1)[0].n === 4,
      'uno: "draw until you can play" draws until a card fits (four here), then the same choice');
    u(r, A, 'play', { card: idOf(r, A, 'r3') });
    check(topK(r) === 'r3', 'uno: and plays it');
  }

  {
    // Stacking, both ways, and without.
    const r = unoStart(['a', 'b', 'c', 'd']);
    setTable(r, [['rd', 'r1'], ['gd', 'w4', 'g1'], ['w4', 'b1', 'b2'], ['y1', 'y2']], 'r7');
    const [A, B, C, D] = r.shared.order;
    u(r, A, 'play', { card: idOf(r, A, 'rd') });
    check(r.shared.pending && r.shared.pending.n === 2 && up(r) === B && hand(r, B).length === 3, 'uno: a +2 with stacking waits on the next player');
    check(uThrew(r, B, 'play', { card: idOf(r, B, 'g1') }) && uThrew(r, B, 'draw'), 'uno: facing a draw you stack or take, nothing else');
    check(uThrew(r, B, 'play', { card: idOf(r, B, 'w4'), color: 'b' }), 'uno: "+2 on +2, +4 on +4 only": a +4 does not answer a +2');
    u(r, B, 'play', { card: idOf(r, B, 'gd') });
    check(r.shared.pending.n === 4 && up(r) === C && r.shared.events.slice(-1)[0].pending === 4, 'uno: stacked, the pile grows and passes on');
    u(r, C, 'take');
    check(hand(r, C).length === 7 && !r.shared.pending && up(r) === D, 'uno: taking the whole pile ends the turn');

    const m = unoStart(['a', 'b', 'c'], { stackMode: 'mixed' });
    setTable(m, [['rd', 'r1'], ['w4', 'bd', 'g1'], ['bd', 'w4', 'b2']], 'r7');
    const [MA, MB, MC] = m.shared.order;
    u(m, MA, 'play', { card: idOf(m, MA, 'rd') });
    check(uThrew(m, MB, 'play', { card: idOf(m, MB, 'w4') }), 'uno: a wild still needs its colour');
    u(m, MB, 'play', { card: idOf(m, MB, 'w4'), color: 'b' });
    check(m.shared.pending.n === 6 && m.shared.pending.kind === 'w4' && m.shared.color === 'b', 'uno: "also +4 on a +2": the +4 raises the pile');
    check(uThrew(m, MC, 'play', { card: idOf(m, MC, 'bd') }), 'uno: and a +2 cannot answer the +4');
    u(m, MC, 'play', { card: idOf(m, MC, 'w4'), color: 'r' });
    check(m.shared.pending.n === 10 && up(m) === MA, 'uno: a +4 on the +4');

    const o = unoStart(['a', 'b', 'c'], { stacking: false });
    setTable(o, [['rd', 'r1'], ['gd', 'g1'], ['b1', 'b2']], 'r7');
    const [OA, OB, OC] = o.shared.order;
    u(o, OA, 'play', { card: idOf(o, OA, 'rd') });
    check(!o.shared.pending && hand(o, OB).length === 4 && up(o) === OC && o.shared.events.some((e) => e.type === 'hit' && e.pid === OB && e.n === 2),
      'uno: without stacking the next player draws two and is skipped');
  }

  {
    // Skip, reverse, wilds.
    const r = unoStart(['a', 'b', 'c', 'd']);
    setTable(r, [['rs', 'r1', 'r2'], ['r3', 'r4'], ['rv', 'r5', 'r6'], ['r7', 'r8']], 'r9');
    const [A, B, C, D] = r.shared.order;
    u(r, A, 'play', { card: idOf(r, A, 'rs') });
    check(up(r) === C && r.shared.events.some((e) => e.type === 'skip' && e.pid === B), 'uno: skip skips the next player');
    u(r, C, 'play', { card: idOf(r, C, 'rv') });
    check(r.shared.dir === -1 && up(r) === B, 'uno: reverse turns the play round');
    const two = unoStart(['a', 'b']);
    setTable(two, [['rv', 'r1', 'r2'], ['r3', 'r4']], 'r9');
    u(two, seat(two, 0), 'play', { card: idOf(two, seat(two, 0), 'rv') });
    check(up(two) === seat(two, 0), 'uno: with two players a reverse is a skip');
    const w = unoStart(['a', 'b']);
    setTable(w, [['w4', 'g1', 'g2'], ['b3', 'b4']], 'r9');
    check(uThrew(w, seat(w, 0), 'play', { card: idOf(w, seat(w, 0), 'w4'), color: 'x' }), 'uno: a colour that is not one is refused');
    u(w, seat(w, 0), 'play', { card: idOf(w, seat(w, 0), 'w4'), color: 'g' });
    check(w.shared.color === 'g' && w.shared.pending.n === 4 && w._uno.pile.slice(-1)[0].c === 'g', 'uno: a +4 on a red 9, any time, and green is named');
  }

  {
    // 7-0.
    const r = unoStart(['a', 'b', 'c'], { sevenO: true });
    setTable(r, [['r7', 'r1', 'r2', 'r3'], ['b1'], ['g0', 'g1', 'g2']], 'r9');
    const [A, B, C] = r.shared.order;
    check(uThrew(r, A, 'play', { card: idOf(r, A, 'r7') }), 'uno: 7-0: a 7 needs someone to swap with');
    u(r, A, 'play', { card: idOf(r, A, 'r7'), target: B });
    check(kinds(r, A) === 'b1' && kinds(r, B) === 'r1,r2,r3' && r.shared.events.some((e) => e.type === 'swap' && e.pid === A && e.target === B && e.n1 === 1 && e.n2 === 3),
      'uno: 7-0: a 7 swaps your hand with the player you pick');
    check(r.shared.unoCatch === null, 'uno: 7-0: a hand of one that came by a swap cannot be caught');
    const z = unoStart(['a', 'b', 'c'], { sevenO: true });
    setTable(z, [['r0', 'r1'], ['b1', 'b2', 'b3'], ['g1', 'g2', 'g3', 'g4']], 'r9');
    const [ZA, ZB, ZC] = z.shared.order;
    u(z, ZA, 'play', { card: idOf(z, ZA, 'r0') });
    check(kinds(z, ZB) === 'r1' && kinds(z, ZC) === 'b1,b2,b3' && kinds(z, ZA) === 'g1,g2,g3,g4', 'uno: 7-0: a 0 passes every hand one seat on');
    const last = unoStart(['a', 'b'], { sevenO: true });
    setTable(last, [['r7'], ['b1', 'b2']], 'r9');
    u(last, seat(last, 0), 'play', { card: idOf(last, seat(last, 0), 'r7') });
    check(last.shared.phase === 'gameover' && last.shared.winners[0] === seat(last, 0), 'uno: 7-0: a 7 as the last card ends the round, with no swap');
  }

  {
    // Jump in.
    const r = unoStart(['a', 'b', 'c', 'd'], { jumpIn: true });
    setTable(r, [['r1', 'r2'], ['r3', 'r4'], ['r9', 'g5', 'g6'], ['y1', 'y2']], 'r9');
    const [A, B, C, D] = r.shared.order;
    const top = r._uno.pile[0].i;
    check(threw(() => applyRoomAction(r, C, 'jump', { card: idOf(r, C, 'g5'), top: top })), 'uno: jump in: only the very same card');
    applyRoomAction(r, C, 'jump', { card: idOf(r, C, 'r9'), top: 999999 });
    check(topK(r) === 'r9' && hand(r, C).length === 3, 'uno: jump in aimed at a card already covered is dropped quietly');
    applyRoomAction(r, C, 'jump', { card: idOf(r, C, 'r9'), top: top });
    check(topK(r) === 'r9' && r._uno.pile.length === 2 && hand(r, C).length === 2 && up(r) === D && r.shared.events.slice(-1)[0].jump === true,
      'uno: jump in: the same card out of turn, and play carries on from the one who jumped');
    const offRoom = unoStart(['a', 'b', 'c']);
    setTable(offRoom, [['r1'], ['r2'], ['r9', 'g1']], 'r9');
    check(threw(() => applyRoomAction(offRoom, seat(offRoom, 2), 'jump', { card: idOf(offRoom, seat(offRoom, 2), 'r9'), top: offRoom._uno.pile[0].i })),
      'uno: jump in is refused when it is off');
    const wild = unoStart(['a', 'b', 'c'], { jumpIn: true });
    setTable(wild, [['r1'], ['r2'], ['w', 'g1']], 'w', { c: 'r' });
    check(threw(() => applyRoomAction(wild, seat(wild, 2), 'jump', { card: idOf(wild, seat(wild, 2), 'w'), color: 'g', top: wild._uno.pile[0].i })),
      'uno: jump in never with a wild');
    // A jump in while a draw is waiting (stacking): the same +2 raises it, and it waits on the one after the jumper.
    const st = unoStart(['a', 'b', 'c', 'd'], { jumpIn: true });
    setTable(st, [['r1', 'r2'], ['b1', 'b2'], ['y1', 'y2'], ['rd', 'g1', 'g2']], 'rd', { pending: { n: 2, kind: 'd' }, up: 1 });
    applyRoomAction(st, seat(st, 3), 'jump', { card: idOf(st, seat(st, 3), 'rd'), top: st._uno.pile[0].i });
    check(st.shared.pending.n === 4 && up(st) === seat(st, 0), 'uno: jump in on a waiting +2 raises the pile, and play goes on from the jumper');
  }

  {
    // UNO!
    const r = unoStart(['a', 'b', 'c']);
    setTable(r, [['r1', 'r2'], ['r3', 'r4', 'r5'], ['r6', 'r7', 'r8']], 'r9');
    const [A, B, C] = r.shared.order;
    u(r, A, 'play', { card: idOf(r, A, 'r1') });
    check(r.shared.unoCatch === A, 'uno: down to one card without saying it: catchable');
    check(threw(() => applyRoomAction(r, A, 'catchUno', { target: A })), 'uno: nobody catches themselves');
    applyRoomAction(r, C, 'catchUno', { target: A });
    check(hand(r, A).length === 3 && r.shared.unoCatch === null && r.shared.events.slice(-1)[0].type === 'caught' && r.shared.events.slice(-1)[0].pid === A && r.shared.events.slice(-1)[0].by === C,
      'uno: caught: two cards');
    applyRoomAction(r, B, 'catchUno', { target: A });
    check(hand(r, A).length === 3, 'uno: a second catch is too late and does nothing');
    // The window closes with the next move.
    const w = unoStart(['a', 'b', 'c']);
    setTable(w, [['r1', 'r2'], ['r3', 'r4', 'r5'], ['r6', 'r7', 'r8']], 'r9');
    const [WA, WB, WC] = w.shared.order;
    u(w, WA, 'play', { card: idOf(w, WA, 'r1') });
    u(w, WB, 'play', { card: idOf(w, WB, 'r3') });
    applyRoomAction(w, WC, 'catchUno', { target: WA });
    check(hand(w, WA).length === 1 && w.shared.unoCatch === null, 'uno: once the next player moves, it is too late to catch');
    // Said with the card, or just before it.
    const s1 = unoStart(['a', 'b']);
    setTable(s1, [['r1', 'r2'], ['r3', 'r4', 'r5']], 'r9');
    u(s1, seat(s1, 0), 'play', { card: idOf(s1, seat(s1, 0), 'r1'), uno: true });
    check(s1.shared.unoCatch === null && s1.shared.said.indexOf(seat(s1, 0)) !== -1 && s1.shared.events.slice(-1)[0].uno === true, 'uno: said with the card: safe');
    const s2 = unoStart(['a', 'b']);
    setTable(s2, [['r1', 'r2'], ['r3', 'r4', 'r5']], 'r9');
    check(threw(() => applyRoomAction(s2, seat(s2, 1), 'callUno', {})), 'uno: nobody says it with three cards');
    applyRoomAction(s2, seat(s2, 0), 'callUno', {});
    check(s2.shared.said.indexOf(seat(s2, 0)) !== -1 && s2.shared.events.slice(-1)[0].type === 'uno', 'uno: said just before playing');
    u(s2, seat(s2, 0), 'play', { card: idOf(s2, seat(s2, 0), 'r1') });
    check(s2.shared.unoCatch === null, 'uno: and then safe');
    const s3 = unoStart(['a', 'b']);
    setTable(s3, [['r1', 'r2'], ['b3', 'b4', 'b5']], 'r9');
    u(s3, seat(s3, 0), 'play', { card: idOf(s3, seat(s3, 0), 'r1') });
    applyRoomAction(s3, seat(s3, 0), 'callUno', {});
    check(s3.shared.unoCatch === null && s3.shared.said.length === 1, 'uno: said just after playing, before anyone catches: safe');
    const s4 = unoStart(['a', 'b']);
    setTable(s4, [['r1', 'y2'], ['b3', 'b4', 'b5']], 'b9', { deck: ['g1', 'g2', 'g3'] });
    applyRoomAction(s4, seat(s4, 0), 'callUno', {});
    u(s4, seat(s4, 0), 'draw');
    check(s4.shared.said.length === 0, 'uno: a call made, then the hand grows: it has to be said again');
  }

  {
    // The end of a round: one round, and a game of rounds.
    const one = unoStart(['a', 'b', 'c']);
    setTable(one, [['r1'], ['bs', 'b5'], ['w', 'g2', 'g3']], 'r9');
    const [OA, OB, OC] = one.shared.order;
    u(one, OA, 'play', { card: idOf(one, OA, 'r1') });
    check(one.shared.phase === 'gameover' && one.shared.winners.join() === OA && one.shared.results.gained === 25 + 55 &&
      one.shared.results.points[OB] === 25 && one.shared.results.hands[OC].join() === 'w,g2,g3',
      'uno: one round: the first out wins, and the hands are shown with their points');
    check(one.shared.board[0].id === OA && one.shared.board.map((x) => x.score).join() === '1,0,0' && !one.shared.scores[OA],
      'uno: one round is won, not scored: the board counts the wins');
    check(bankNightPoints({ night: {} }, one.shared.board), 'uno: and the night table can bank it');
    applyRoomAction(one, one.hostId, 'playAgain', {});
    check(one.shared.phase === 'play' && one.shared.wins[OA] === 1 && one.shared.board.find((x) => x.id === OA).score === 1,
      'uno: play again keeps the tally of wins');
    const [PA] = one.shared.order;
    setTable(one, [['r1'], ['bs', 'b5'], ['w', 'g2']], 'r9');
    u(one, PA, 'play', { card: idOf(one, PA, 'r1') });
    check(one.shared.wins[PA] === (PA === OA ? 2 : 1) && one.shared.board.reduce((n, x) => n + x.score, 0) === 2,
      'uno: and the next win is added to it');
    const last2 = unoStart(['a', 'b', 'c']);
    setTable(last2, [['rd'], ['b5'], ['g2']], 'r9', { deck: ['y1', 'y9'] });
    u(last2, seat(last2, 0), 'play', { card: idOf(last2, seat(last2, 0), 'rd') });
    check(last2.shared.results.hands[seat(last2, 1)].length === 3 && last2.shared.results.gained === 5 + 1 + 9 + 2,
      'uno: a +2 as the last card: the next player still draws, and those cards count');

    const r = unoStart(['a', 'b', 'c'], { length: 'rounds', rounds: 3 });
    check(r.shared.rounds === 3 && r.shared.round === 1, 'uno: rounds: the host picks how many');
    setTable(r, [['r1'], ['b5', 'b6'], ['g2']], 'r9');
    const [A, B, C] = r.shared.order;
    u(r, A, 'play', { card: idOf(r, A, 'r1') });
    check(r.shared.phase === 'roundOver' && r.shared.scores[A] === 13 && r.shared.board[0].id === A, "uno: rounds: the winner scores what's left in the other hands");
    check(threw(() => applyRoomAction(r, B, 'nextRound', { round: 1 })) || r.hostId === B, 'uno: only the host deals the next round');
    applyRoomAction(r, r.hostId, 'nextRound', { round: 1 });
    check(r.shared.phase === 'play' && r.shared.round === 2 && r.shared.start === r.shared.order[1] && r.shared.scores[A] === 13,
      'uno: the next round is dealt, the first seat moved on, the scores kept');
    applyRoomAction(r, r.hostId, 'nextRound', { round: 1 });
    check(r.shared.round === 2, 'uno: a stale "next round" is dropped');
    setTable(r, [['r1', 'r2'], ['b5'], ['g2', 'g3']], 'b9', { up: 1 });
    u(r, B, 'play', { card: idOf(r, B, 'b5') });
    applyRoomAction(r, r.hostId, 'nextRound', { round: 2 });
    setTable(r, [['r1', 'r2'], ['b5', 'b6'], ['g2']], 'g9', { up: 2 });
    u(r, C, 'play', { card: idOf(r, C, 'g2') });
    check(r.shared.phase === 'gameover' && r.shared.round === 3 && r.shared.winners.join() === C && r.shared.scores[B] === 8 && r.shared.scores[C] === 14 && r.shared.scores[A] === 13,
      'uno: after the last round, the most points wins');
    applyRoomAction(r, r.hostId, 'playAgain', {});
    check(r.shared.phase === 'play' && r.shared.round === 1 && Object.keys(r.shared.scores).length === 0 && r.shared.settings.length === 'rounds',
      'uno: play again keeps the options and starts the scores over');
  }

  {
    // Only one thing to do: the server does it for a person, after a beat (ROOM_FORCED_GAMES).
    const r = unoStart(['a', 'b', 'c']);
    setTable(r, [['r1', 'r2'], ['b5', 'b6'], ['g2', 'g3']], 'yd', { pending: { n: 2, kind: 'd' } });
    const [A, B] = r.shared.order;
    check(r._botPid === A && r._botAt === clock + ROOM_FORCED_DELAY_MS, 'uno forced: facing a +2 with nothing to stack, the take is set for a beat later');
    check(!roomTimeout(r, clock + 500) && hand(r, A).length === 2, 'uno forced: not before the beat');
    check(roomTimeout(r, clock + ROOM_FORCED_DELAY_MS) && hand(r, A).length === 4 && !r.shared.pending && up(r) === B,
      'uno forced: then the two are taken for them and the turn moves on');
    const d = unoStart(['a', 'b', 'c']);
    setTable(d, [['r1', 'r2'], ['b5', 'b6'], ['g2', 'g3']], 'y9', { deck: ['g1', 'g2', 'g3'] });
    roomTimeout(d, clock + ROOM_FORCED_DELAY_MS);
    check(hand(d, d.shared.order[0]).length === 3 && d.shared.events.some((e) => e.type === 'draw' && e.pid === d.shared.order[0]),
      'uno forced: nothing fits, no draw waiting: one card is drawn for them');
    const k = unoStart(['a', 'b', 'c']);
    setTable(k, [['r1', 'y2'], ['b5', 'b6'], ['g2', 'g3']], 'y9');
    check(k._botAt === null && !roomTimeout(k, clock + 5000) && hand(k, k.shared.order[0]).length === 2,
      'uno forced: with a card that fits there is a choice, and nothing is done for them');
    const w = unoStart(['a', 'b', 'c']);
    setTable(w, [['r1', 'r5'], ['b5', 'b6'], ['g2', 'g3']], 'r9');
    // A goes down to one card without saying أونو, and B has nothing that fits.
    u(w, w.shared.order[0], 'play', { card: idOf(w, w.shared.order[0], 'r1') });
    check(w.shared.unoCatch === w.shared.order[0] && w._botPid === w.shared.order[1] && w._botAt >= clock + 2800, 'uno forced: while someone can still be caught, it waits as long as a bot would');

    // الدومينو: only with the helper that lights up what fits.
    const dm = (help) => {
      const room = newRoom(['a', 'b', 'c', 'd']);
      applyRoomAction(room, 'a', 'chooseGame', { game: 'domino' });
      applyRoomAction(room, 'a', 'start', { helpFit: help });
      return room;
    };
    const on = dm(true);
    const pid = on.shared.turn;
    on._domino.hands[pid] = ['0-0', '1-1'];
    on.shared.table = { line: [{ t: '5-6', a: 5, b: 6 }], root: '5-6', spinner: null, up: [], down: [] };
    on.shared.turnSeq++;
    applyRoomAction(on, 'a', 'chat', { text: 'x' });
    const f = roomForcedMove(on);
    check(f && f.pid === pid && f.move.action === 'pass', 'domino forced: helpers on, four players, nothing fits: باص for them');
    on._domino.hands[pid] = ['0-0', '1-5'];
    const g1 = roomForcedMove(on);
    check(g1 && g1.move.action === 'play' && g1.move.payload.tile === '1-5' && g1.move.payload.end === 'L', 'domino forced: one move only: it is played');
    on._domino.hands[pid] = ['0-5', '1-5'];
    check(roomForcedMove(on) === null, 'domino forced: two moves: nothing is done');
    on._domino.hands[pid] = ['1-5'];
    check(roomForcedMove(on) === null, 'domino forced: the last tile, that takes the round, is left to the player');
    const off = dm(false);
    off._domino.hands[off.shared.turn] = ['0-0', '1-1'];
    off.shared.table = { line: [{ t: '5-6', a: 5, b: 6 }], root: '5-6', spinner: null, up: [], down: [] };
    check(roomForcedMove(off) === null, 'domino forced: helpers off: nothing is done - the player works it out');

    // The duels: the last move is often the winning one, so it stays the player's (the owner, 21 Sep 2026).
    const c4r = newRoom(['a', 'b']);
    applyRoomAction(c4r, 'a', 'chooseGame', { game: 'connect4' });
    applyRoomAction(c4r, 'a', 'start', { mode: 4 });
    const cols = c4r.shared.cols;
    c4r.shared.grid = c4r.shared.grid.map((v, i) => (i % cols === 3 ? 0 : 1));
    check(roomForcedMove(c4r) === null, 'duels: connect 4 with one open column: the player drops it');
    const dr = newRoom(['a', 'b']);
    applyRoomAction(dr, 'a', 'chooseGame', { game: 'dots' });
    applyRoomAction(dr, 'a', 'start', { size: 4 });
    dr.shared.lines = dr.shared.lines.map((v, e) => (e === 5 ? 0 : 1));
    check(roomForcedMove(dr) === null, 'duels: dots with one line left: the player draws it');
  }

  {
    // The turn clock and the host's skip.
    const r = unoStart(['a', 'b', 'c'], { turnClock: 30 });
    // A holds a card that fits, so nothing is forced and the clock is what moves.
    setTable(r, [['r1', 'y2'], ['b5', 'b6'], ['g2', 'g3']], 'y9', { deck: ['g1', 'g2', 'g3', 'g4', 'y1', 'y2', 'y3'] });
    r.shared.endsAt = clock + 30000;
    const [A, B] = r.shared.order;
    check(roomDeadline(r) === clock + 30000 + 1500, 'uno: the turn clock is a server deadline');
    check(!roomTimeout(r, clock + 1000), 'uno: nothing happens before it');
    check(roomTimeout(r, clock + 32000) && hand(r, A).length === 3 && up(r) === B && r.shared.events.some((e) => e.type === 'auto' && e.why === 'clock'),
      'uno: time up: the phone draws one for the player and passes, even when it fits');
    r.shared.pending = { n: 4, kind: 'd' };
    r.shared.endsAt = clock;
    roomTimeout(r, clock + 2000);
    check(hand(r, B).length === 6 && !r.shared.pending, 'uno: time up facing a draw: the pile is taken');
    const h = unoStart(['a', 'b', 'c']);
    setTable(h, [['r1', 'r2'], ['b5', 'b6'], ['g2', 'g3']], 'y9', { up: 1 });
    check(threw(() => u(h, 'c', 'skipTurn')), 'uno: only the host skips a turn');
    u(h, 'a', 'skipTurn');
    check(hand(h, seat(h, 1)).length === 3 && up(h) === seat(h, 2), "uno: the host's skip plays for a quiet phone: one card, and on");
  }

  {
    // Someone leaves.
    const r = unoStart(['a', 'b', 'c']);
    setTable(r, [['r1', 'r2'], ['b5', 'b6', 'b7'], ['g2', 'g3']], 'y9', { up: 1 });
    const [A, B, C] = r.shared.order;
    const deckWas = r._uno.deck.length;
    leave(r, B);
    check(r.shared.order.length === 2 && r._uno.deck.length === deckWas + 3 && up(r) === C && !r.secrets[B],
      'uno: a player up who leaves: their cards go under the deck, the turn moves on');
    leave(r, C);
    check(r.shared.phase === 'gameover' && r.shared.winners.join() === A, 'uno: fewer than two left ends the game');
  }

  {
    // Computer players: every move only from their own hand and what the table sees.
    const botRoom = (levels, opts) => {
      const r = newRoom(['a']);
      applyRoomAction(r, 'a', 'chooseGame', { game: 'uno' });
      levels.forEach((lv, i) => applyRoomAction(r, 'a', 'addBot', { level: lv, name: 'bot' + i }));
      applyRoomAction(r, 'a', 'start', Object.assign({}, opts || {}));
      return r;
    };
    const botsIn = (r) => r.players.filter((p) => p.bot).map((p) => p.id);
    const runBots = (r) => { if (typeof r._botAt === 'number') { clock = Math.max(clock, r._botAt) + 1; roomTimeout(r, clock); return true; } return false; };

    // An easy bot plays the first card that fits.
    const e = botRoom(['easy']);
    const [bot] = botsIn(e);
    const human = 'a';
    const order = e.shared.order;
    setTable(e, order.map((id) => (id === bot ? ['b1', 'r5', 'r6'] : ['g1', 'g2'])), 'r9', { up: order.indexOf(bot) });
    check(e._botPid === bot && typeof e._botAt === 'number', 'uno bots: the bot up is scheduled');
    runBots(e);
    check(topK(e) === 'r5' && up(e) === human, 'uno bots: an easy bot plays the first card that fits');

    // A hard bot catches a player who forgot to say UNO; the next bot waits for it.
    const h = botRoom(['easy', 'hard']);
    const [easy, hard] = botsIn(h);
    const ho = h.shared.order;
    setTable(h, ho.map((id) => (id === 'a' ? ['r1', 'r2'] : ['b1', 'b2', 'b3'])), 'r9', { up: ho.indexOf('a') });
    u(h, 'a', 'play', { card: idOf(h, 'a', 'r1') });
    check(h.shared.unoCatch === 'a' && h._botPid === hard && h._botAt - clock >= 1500, 'uno bots: a hard bot notices a missing UNO, after a moment');
    runBots(h);
    check(hand(h, 'a').length === 3 && h.shared.events.slice(-1)[0].type === 'caught' && h.shared.events.slice(-1)[0].by === hard, 'uno bots: and catches it');

    // A hard bot stacks, keeps its wilds, hits the next player close to going out, and always says UNO.
    const s = botRoom(['hard']);
    const [hb] = botsIn(s);
    const so = s.shared.order;
    setTable(s, so.map((id) => (id === hb ? ['gd', 'w4', 'g3'] : ['y1', 'y2', 'y3'])), 'rd', { up: so.indexOf(hb), pending: { n: 2, kind: 'd' } });
    runBots(s);
    check(topK(s) === 'gd' && s.shared.pending.n === 4, 'uno bots: a hard bot stacks a +2 before spending its +4');
    setTable(s, so.map((id) => (id === hb ? ['w', 'r3', 'b7', 'b8'] : ['y1', 'y2', 'y3', 'y4', 'y5'])), 'r9', { up: so.indexOf(hb) });
    runBots(s);
    check(topK(s) === 'r3', 'uno bots: a hard bot keeps its wild while a colour card fits');
    setTable(s, so.map((id) => (id === hb ? ['r3', 'rs', 'b7'] : ['y1'])), 'r9', { up: so.indexOf(hb) });
    runBots(s);
    check(topK(s) === 'rs', 'uno bots: a hard bot hits the next player when they are about to go out');
    setTable(s, so.map((id) => (id === hb ? ['r3', 'b7'] : ['y1', 'y2', 'y3'])), 'r9', { up: so.indexOf(hb) });
    runBots(s);
    check(topK(s) === 'r3' && s.shared.said.indexOf(hb) !== -1 && s.shared.unoCatch === null, 'uno bots: a hard bot says UNO');
    setTable(s, so.map((id) => (id === hb ? ['w', 'y7', 'y8', 'g1'] : ['b1', 'b2', 'b3'])), 'r9', { up: so.indexOf(hb) });
    runBots(s);
    check(topK(s) === 'w' && s.shared.color === 'y', 'uno bots: a wild names the colour the bot holds most');

    // Whole games with nobody but bots and one quiet human, every rule on or off: every bot move is legal and every game ends.
    const errors = [];
    const errorWas = console.error;
    console.error = (...args) => { errors.push(args.join(' ')); };
    let ended = 0;
    let conserved = true;
    const variants = [
      {}, { stacking: false }, { stackMode: 'mixed' }, { drawUntil: true }, { sevenO: true }, { jumpIn: true },
      { sevenO: true, jumpIn: true, stackMode: 'mixed' }, { length: 'rounds', rounds: 3 }, { drawUntil: true, jumpIn: true, stacking: false }
    ];
    for (let n = 0; n < 45; n++) {
      const opts = variants[n % variants.length];
      const levels = n % 3 === 0 ? ['hard', 'hard', 'easy'] : n % 3 === 1 ? ['easy', 'hard'] : ['hard', 'easy', 'hard', 'easy', 'hard'];
      const r = botRoom(levels, opts);
      const cardsIn = (x) => Object.values(x._uno.hands).reduce((k, hh) => k + hh.length, 0) + x._uno.deck.length + x._uno.pile.length;
      const total = cardsIn(r);
      for (let step = 0; step < 4000 && r.shared.phase !== 'gameover'; step++) {
        if (r.shared.phase === 'roundOver') { applyRoomAction(r, 'a', 'nextRound', { round: r.shared.round }); continue; }
        const humanUp = up(r) === 'a';
        if (typeof r._botAt === 'number' && (!humanUp || step % 2)) runBots(r);
        else if (humanUp) {
          try {
          // The human plays like a lazy easy player: the first card that fits (a colour for a wild), or draws.
          const me = r.secrets.a;
          const top = r._uno.pile[r._uno.pile.length - 1].k;
          const st = r.shared.turn.stage;
          if (st === 'color') u(r, 'a', 'pickColor', { color: 'r' });
          else if (st === 'drawn') u(r, 'a', 'keep');
          else {
            const fit = me.hand.find((c) => UNO.unoCanPlay(c.k, top, r.shared.color, r.shared.pending, r.shared.settings));
            const target = r.shared.order.find((id) => id !== 'a');
            if (fit) u(r, 'a', 'play', { card: fit.i, color: 'b', target: target, uno: true });
            else u(r, 'a', r.shared.pending ? 'take' : 'draw');
          }
          } catch (err) { errors.push('human: ' + err.message); break; }
        } else break;
        if (r.shared.phase === 'play' && cardsIn(r) !== total) conserved = false;
      }
      if (r.shared.phase === 'gameover') ended++;
    }
    console.error = errorWas;
    check(ended === 45, `uno bots: 45 games of bots, every variant, all end (${ended})`);
    check(!errors.length, 'uno bots: no bot move was ever refused' + (errors.length ? ': ' + errors[0] : ''));
    check(conserved, 'uno: no card is ever lost or made up, through draws, stacks, swaps, jumps and reshuffles');
  }
}

/* --- لودو: the board, every rule, the room, and whole games of computer players ------ */
{
  const { readFileSync } = await import('node:fs');
  const L = new Function(readFileSync(new URL('../../Ludo.js', import.meta.url), 'utf8') +
    '\nreturn { LUDO_TRACK_CELLS, LUDO_HOME_CELLS, LUDO_START, LUDO_SAFE, LUDO_STARS, LUDO_HOME, ludoGlobal, ludoCellOf, ludoNewGame, ludoFillColors,' +
    ' ludoRollOff, ludoTarget, ludoMovable, ludoDistinct, ludoRoll, ludoMove, ludoOnlyMove, ludoBotPick, ludoRemovePlayer, ludoWallAt };')();
  const cells = L.LUDO_TRACK_CELLS;
  const key = (c) => c[0] + ',' + c[1];
  const near = (a, b) => Math.max(Math.abs(a[0] - b[0]), Math.abs(a[1] - b[1])) === 1;
  check(cells.length === 52 && new Set(cells.map(key)).size === 52 && cells.every((c, i) => near(c, cells[(i + 1) % 52])),
    'ludo: the track is 52 squares, each next to the one before, all the way round');
  check(key(cells[L.LUDO_START.G]) === '1,6' && key(cells[L.LUDO_START.Y]) === '8,1' && key(cells[L.LUDO_START.B]) === '13,8' && key(cells[L.LUDO_START.R]) === '6,13',
    'ludo: the four start squares are where each yard comes out');
  check(L.LUDO_STARS.map((g) => key(cells[g])).join(' ') === '6,2 12,6 8,12 2,8' && L.LUDO_STARS.every((g, i) => g - L.LUDO_START['GYBR'[i]] === 8),
    'ludo: a star eight squares after every start');
  check('GYBR'.split('').every((c) => near(cells[L.ludoGlobal(c, 50)], L.LUDO_HOME_CELLS[c][0]) && L.ludoGlobal(c, 51) === null),
    'ludo: each colour turns into its own home column from the square before its start');
  const trackKeys = new Set(cells.map(key));
  check('GYBR'.split('').every((c) => L.LUDO_HOME_CELLS[c].every((h) => !trackKeys.has(key(h)))), 'ludo: the home columns are off the track');

  // a is red, b yellow, c green, d blue.
  const game = (pieces, turn) => {
    const g = L.ludoNewGame(Object.keys(pieces), { a: 'R', b: 'Y', c: 'G', d: 'B' }, turn || 'a');
    Object.keys(pieces).forEach((id) => { g.pieces[id] = pieces[id].slice(); });
    return g;
  };
  const set = (g, pid, dice) => { g.turn = { pid: pid, stage: 'move', dice: dice, sixes: 0 }; g.movable = L.ludoMovable(g, pid, dice); };
  // Yellow's own number for the square red calls `rRel`.
  const yRel = (rRel) => (L.LUDO_START.R + rRel - L.LUDO_START.Y + 52) % 52;

  let g = game({ a: [-1, -1, -1, -1], b: [-1, -1, -1, -1] });
  check(g.seats.join() === 'b,a' && g.turn.pid === 'a', 'ludo: turns go round the board (Y before R), the roll-off winner first');
  check(L.ludoMovable(g, 'a', 5).length === 0 && L.ludoMovable(g, 'a', 6).length === 4, 'ludo: a piece leaves the yard on a 6 only');
  check(L.ludoDistinct(g, 'a', 6).length === 1, 'ludo: four pieces in the yard are one move, not four');
  L.ludoRoll(g, 'a', 3);
  check(g.turn.pid === 'b' && g.events.some((e) => e.type === 'nomove'), 'ludo: nothing to move: the turn passes by itself');
  g = game({ a: [-1, -1, -1, -1], b: [-1, -1, -1, -1] });
  L.ludoRoll(g, 'a', 6);
  check(g.turn.pid === 'a' && g.turn.stage === 'move' && g.movable.length === 4, 'ludo: a 6 brings one out');
  L.ludoMove(g, 'a', 0);
  check(g.pieces.a[0] === 0 && g.turn.pid === 'a' && g.turn.stage === 'roll', 'ludo: out onto its start square, and a 6 rolls again');
  L.ludoRoll(g, 'a', 6);
  L.ludoMove(g, 'a', 0);
  L.ludoRoll(g, 'a', 6);
  check(g.turn.pid === 'b' && g.pieces.a[0] === 6 && g.events.some((e) => e.type === 'three'), 'ludo: a third 6 in a row is not played, and the turn passes');

  // Capturing, and where it can't happen.
  g = game({ a: [10, -1, -1, -1], b: [yRel(12), -1, -1, -1] });
  set(g, 'a', 2);
  L.ludoMove(g, 'a', 0);
  check(g.pieces.b[0] === -1 && g.events.some((e) => e.type === 'move' && e.cap), 'ludo: landing on a single piece of another colour sends it home');
  g = game({ a: [2, -1, -1, -1], b: [yRel(8), -1, -1, -1] });
  set(g, 'a', 6);
  L.ludoMove(g, 'a', 0);
  check(g.pieces.b[0] === yRel(8) && g.pieces.a[0] === 8, 'ludo: a star is safe: both stay');
  g = game({ a: [3, -1, -1, -1], b: [yRel(5), yRel(5), -1, -1] });
  check(L.ludoWallAt(g, L.ludoGlobal('R', 5)) === 'b' && !L.ludoTarget(g, 'a', 0, 2) && !L.ludoTarget(g, 'a', 0, 4) && !!L.ludoTarget(g, 'a', 0, 1),
    'ludo: two pieces are a wall: nobody lands on it or passes it');
  g = game({ a: [3, 4, 4, -1], b: [-1, -1, -1, -1] });
  check(!!L.ludoTarget(g, 'a', 0, 3), "ludo: a player's own wall doesn't stop the same player's pieces");

  // Home.
  g = game({ a: [53, 56, 56, 56], b: [-1, -1, -1, -1] });
  check(!L.ludoTarget(g, 'a', 0, 4) && !!L.ludoTarget(g, 'a', 0, 3), 'ludo: home needs the exact number');
  set(g, 'a', 3);
  check(L.ludoOnlyMove(g, 'a') === -1, "ludo: the move that brings the last piece home is the player's own tap");
  g = game({ a: [53, 20, 56, 56], b: [-1, -1, -1, -1] });
  set(g, 'a', 5);
  check(L.ludoOnlyMove(g, 'a') === 1, 'ludo: one piece that can move is moved for the player');
  set(g, 'a', 3);
  check(L.ludoOnlyMove(g, 'a') === -1, 'ludo: two that can move: the player chooses');

  // Places.
  g = game({ a: [53, 56, 56, 56], b: [5, -1, -1, -1], c: [7, -1, -1, -1] });
  set(g, 'a', 3);
  L.ludoMove(g, 'a', 0);
  check(g.places.join() === 'a' && g.phase === 'play' && g.turn.pid !== 'a', 'ludo: the first home takes first place, and the others play on');
  g.pieces.b = [53, 56, 56, 56];
  set(g, 'b', 3);
  L.ludoMove(g, 'b', 0);
  check(g.places.join() === 'a,b,c' && g.phase === 'gameover' && g.events.some((e) => e.type === 'over'), 'ludo: the last one left takes the last place, and it is over');
  g = game({ a: [5, -1, -1, -1], b: [7, -1, -1, -1], c: [9, -1, -1, -1] }, 'b');
  L.ludoRemovePlayer(g, 'b');
  check(g.seats.indexOf('b') === -1 && !g.pieces.b && g.phase === 'play' && g.turn.pid !== 'b', 'ludo: a player who leaves takes their pieces, and the turn moves on');
  L.ludoRemovePlayer(g, 'c');
  check(g.phase === 'gameover' && g.places.join() === 'a', 'ludo: one left: the game is over');

  // Colours: two players sit opposite; a pick is kept.
  const two = L.ludoFillColors(['x', 'y'], {});
  check(two.x === 'R' && two.y === 'Y', 'ludo: nobody picked: red, and the colour opposite');
  const kept = L.ludoFillColors(['x', 'y', 'z'], { y: 'G' });
  check(kept.y === 'G' && kept.x === 'B' && new Set(Object.values(kept)).size === 3, 'ludo: a picked colour is kept, the next goes opposite it');
  const off = L.ludoRollOff(['x', 'y', 'z', 'w'], Math.random);
  const lastRound = off.rounds[off.rounds.length - 1];
  const topN = Math.max(...lastRound.map((r) => r.n));
  check(lastRound.find((r) => r.pid === off.first).n === topN && lastRound.filter((r) => r.n === topN).length === 1,
    'ludo: the roll-off: the highest starts, and a tie on top rolls again');

  // The room: colours in the lobby, who plays, the dice, the clock.
  const lr = newRoom(['h', 'p', 'q', 'r', 's']);
  applyRoomAction(lr, 'h', 'chooseGame', { game: 'ludo' });
  applyRoomAction(lr, 'p', 'color', { color: 'G' });
  let refusedColor = false;
  try { applyRoomAction(lr, 'q', 'color', { color: 'G' }); } catch (e) { refusedColor = true; }
  check(refusedColor && lr.shared.lobby.colors.p === 'G', 'ludo room: a colour already taken is refused');
  let refusedWatcher = false;
  try { applyRoomAction(lr, 's', 'color', { color: 'Y' }); } catch (e) { refusedWatcher = true; }
  check(refusedWatcher, 'ludo room: with five in the room the fifth watches, and picks no colour');
  let refusedFifth = false;
  try { applyRoomAction(lr, 'h', 'seat', { playerId: 's', on: true }); } catch (e) { refusedFifth = true; }
  applyRoomAction(lr, 'h', 'seat', { playerId: 'r', on: false });
  applyRoomAction(lr, 'h', 'seat', { playerId: 's', on: true });
  applyRoomAction(lr, 's', 'color', { color: 'Y' });
  check(refusedFifth && lr.shared.lobby.seated.join() === 'h,p,q,s' && lr.shared.lobby.colors.s === 'Y', 'ludo room: the host picks who plays, four at most');
  applyRoomAction(lr, 'p', 'color', { color: 'G' });
  check(!lr.shared.lobby.colors.p, 'ludo room: a second tap lets a colour go');
  applyRoomAction(lr, 'p', 'color', { color: 'G' });
  applyRoomAction(lr, 'h', 'start', { turnClock: 15 });
  const ls = lr.shared;
  check(lr.phase === 'play' && ls.seats.length === 4 && ls.seats.indexOf('r') === -1 && ls.colors.p === 'G' && ls.colors.s === 'Y' && new Set(Object.values(ls.colors)).size === 4,
    'ludo room: the four seated play, in the colours they picked and the rest filled in');
  check(ls.events[0].type === 'rolloff' && ls.events[0].first === ls.turn.pid && ls.roster.indexOf('r') !== -1, 'ludo room: the roll-off decides who starts; the fifth watches the board');
  check(ls.endsAt === clock + 15000, "ludo room: the host's turn clock starts");
  // The clock runs out: the phone rolls and moves for whoever is up.
  const upT = ls.turn.pid;
  check(roomTimeout(lr, ls.endsAt + 2000) === true && lr.shared.events.some((e) => e.type === 'auto' && e.pid === upT && e.why === 'clock'),
    'ludo room: time up: the phone plays the turn');
  lr._botAt = null;
  lr.shared.turn = { pid: lr.shared.seats[0], stage: 'roll', dice: null, sixes: 0 };
  lr.shared.turnSeq += 1;
  const upL = lr.shared.turn.pid;
  const offL = lr.shared.seats.find((id) => id !== upL);
  let refusedTurn = false;
  try { applyRoomAction(lr, offL, 'roll', { seq: lr.shared.turnSeq }); } catch (e) { refusedTurn = true; }
  check(refusedTurn, 'ludo room: out of turn is refused');
  const seqL = lr.shared.turnSeq;
  applyRoomAction(lr, upL, 'roll', { seq: seqL - 1 });
  check(lr.shared.turnSeq === seqL, 'ludo room: a tap from a turn that has moved on is dropped');
  applyRoomAction(lr, upL, 'roll', { seq: seqL });
  check(lr.shared.events.some((e) => e.type === 'roll' && e.pid === upL), 'ludo room: the dice are rolled on the server');

  // Whole games of bots, 2 to 4, easy and hard, through the room's own door.
  const errorWas = console.error;
  const errors = [];
  console.error = (...a) => errors.push(a.join(' '));
  let ended = 0;
  let sane = true;
  let games = 0;
  for (const n of [2, 3, 4]) {
    for (const lvl of ['easy', 'hard', 'mix']) {
      for (let rep = 0; rep < 3; rep++) {
        games++;
        // The host is the big screen, so four computer players can take all four seats.
        const r = newRoom(['h']);
        applyRoomAction(r, 'h', 'becomeScreen', {});
        applyRoomAction(r, 'h', 'chooseGame', { game: 'ludo' });
        for (let k = 0; k < n; k++) applyRoomAction(r, 'h', 'addBot', { level: lvl === 'mix' ? (k % 2 ? 'hard' : 'easy') : lvl, name: 'B' });
        applyRoomAction(r, 'h', 'start', {});
        for (let step = 0; step < 8000 && r.shared.phase === 'play'; step++) {
          if (typeof r._botAt !== 'number') break;
          clock = Math.max(clock, r._botAt) + 1;
          roomTimeout(r, clock);
          const pcs = r.shared.pieces;
          if (Object.keys(pcs).some((id) => pcs[id].length !== 4 || pcs[id].some((x) => x < -1 || x > 56))) sane = false;
        }
        if (r.shared.phase === 'gameover' && r.shared.places.length === n && r.shared.board.some((b) => b.score === 1)) ended++;
      }
    }
  }
  console.error = errorWas;
  check(ended === games, `ludo bots: ${games} whole games of bots, 2-4 players, easy and hard, all played to the last place (${ended})`);
  check(!errors.length, 'ludo bots: no bot move was ever refused' + (errors.length ? ': ' + errors[0] : ''));
  check(sane, 'ludo: every piece is always somewhere on the board');

  // A person with one move has it made for them; the roll is theirs.
  const fm = newRoom(['h', 'p']);
  applyRoomAction(fm, 'h', 'chooseGame', { game: 'ludo' });
  applyRoomAction(fm, 'h', 'start', {});
  const fs = fm.shared;
  const who = fs.turn.pid;
  fs.pieces[who] = [20, 56, 56, -1];
  fs.turn = { pid: who, stage: 'move', dice: 3, sixes: 0 };
  fs.movable = [0];
  const f = roomForcedMove(fm);
  check(!!f && f.pid === who && f.move.action === 'move' && f.move.payload.piece === 0, 'ludo room: one piece to move is moved for the player after a beat');
  fs.turn.stage = 'roll';
  check(!roomForcedMove(fm), "ludo room: the roll is always the player's own tap");
}

/* --- بنك الحظ: the board, every rule, the room, and whole games of computer players ------ */
{
  const { readFileSync } = await import('node:fs');
  const B = new Function(readFileSync(new URL('../../BankAlhaz.js', import.meta.url), 'utf8') +
    '\nreturn { BANK_SQUARES, BANK_CARDS, BANK_GROUPS, BANK_STATIONS, BANK_COMPANIES, bankNewGame, bankRoll, bankBuy, bankEndTurn, bankBuild, bankSell, bankMortgage,' +
    ' bankUnmortgage, bankPayJail, bankUseCard, bankPayDebt, bankBankrupt, bankOffer, bankAnswer, bankRentOf, bankWorth, bankCanBuild, bankStepCost, bankAuto,' +
    ' bankBotMove, bankOnlyMove, bankRemovePlayer, bankFillTokens, bankRollOff, bankGroupSquares, bankLiquid, bankRents, bankDice };')();
  const Q = B.BANK_SQUARES;
  check(Q.length === 40 && Q[0].t === 'go' && Q[10].t === 'jail' && Q[20].t === 'bus' && Q[30].t === 'tojail', 'bank: 40 squares, the four corners where they belong');
  check(Q.filter((q) => q.t === 'p').length === 22 && B.BANK_STATIONS.every((i) => Q[i].t === 'st') && B.BANK_COMPANIES.every((i) => Q[i].t === 'co'),
    'bank: 22 places, 4 stations, 2 companies');
  check(Object.keys(B.BANK_GROUPS).every((grp) => B.bankGroupSquares(grp).length === (grp === 'br' || grp === 'db' ? 2 : 3)), 'bank: eight colours, two or three places each');
  check(B.BANK_CARDS.luck.length === 16 && B.BANK_CARDS.court.length === 16 && ['luck', 'court'].every((d) => B.BANK_CARDS[d].every((c) => c.ar && c.en)),
    'bank: sixteen cards in each deck, in both languages');
  let prices = true;
  for (let i = 1; i < 40; i++) for (let j = i + 1; j < 40; j++) if (Q[i].t === 'p' && Q[j].t === 'p' && Q[i].price > Q[j].price) prices = false;
  check(prices, 'bank: the places get dearer round the board');

  const seq = (list) => { let k = 0; return () => list[k++ % list.length]; };
  const game = (ids, opts) => {
    const made = B.bankNewGame(ids, B.bankFillTokens(ids, {}), ids[0], Object.assign({ length: 0, firstLap: false }, opts || {}), 0, Math.random);
    return made;
  };
  let { g, priv } = game(['a', 'b']);
  check(g.cash.a === 1500 && g.pos.a === 0 && g.turn.pid === 'a' && g.turn.stage === 'roll', 'bank: 1,500 each, everyone on Start');
  B.bankRoll(g, priv, 'a', [1, 2], Math.random);
  check(g.pos.a === 3 && g.turn.stage === 'buy', 'bank: land on a free place and the choice is to buy it');
  B.bankBuy(g, 'a', true);
  check(g.cash.a === 1440 && g.own[3].by === 'a' && g.turn.stage === 'act', 'bank: bought for its price');
  B.bankEndTurn(g, 'a', 0);
  B.bankRoll(g, priv, 'b', [1, 2], Math.random);
  check(g.cash.b === 1496 && g.cash.a === 1444 && g.turn.stage === 'act', 'bank: rent on landing, paid by itself');
  ({ g, priv } = game(['a', 'b']));
  B.bankRoll(g, priv, 'a', [3, 3], Math.random);
  check(g.pos.a === 6 && g.turn.stage === 'buy', 'bank: a double moves');
  B.bankBuy(g, 'a', false);
  check(!g.own[6] && g.turn.stage === 'roll', 'bank: not bought stays with the bank, and a double rolls again');
  B.bankRoll(g, priv, 'a', [2, 2], Math.random);   // onto the jail square, only visiting
  B.bankRoll(g, priv, 'a', [5, 5], Math.random);
  check(g.pos.a === 10 && g.jail.a === 0 && g.turn.stage === 'act', 'bank: three doubles in a row: to jail');
  // Jail.
  B.bankEndTurn(g, 'a', 0);
  B.bankRoll(g, priv, 'b', [1, 3], Math.random);
  if (g.turn.stage === 'buy') B.bankBuy(g, 'b', false);
  B.bankEndTurn(g, 'b', 0);
  B.bankRoll(g, priv, 'a', [1, 2], Math.random);
  check(g.pos.a === 10 && g.jail.a === 1 && g.turn.stage === 'act', 'bank: in jail, no double: stay');
  g.turn = { pid: 'a', stage: 'roll', dice: null, dbl: 0, again: false, total: 0 };
  g.jail.a = 2;
  const cashA = g.cash.a;
  B.bankRoll(g, priv, 'a', [1, 3], Math.random);
  check(g.jail.a === undefined && g.cash.a === cashA - 50 && g.pos.a === 14, 'bank: the third miss pays 50 and moves');
  g.turn = { pid: 'a', stage: 'roll', dice: null, dbl: 0, again: false, total: 0 };
  g.jail.a = 0; g.pos.a = 10;
  B.bankRoll(g, priv, 'a', [4, 4], Math.random);
  check(g.jail.a === undefined && g.pos.a === 18 && (g.turn.stage === 'buy' || g.turn.stage === 'act'), 'bank: a double gets out of jail, and moves, with no second roll');

  // Rent: a whole colour doubles, then the three steps; a station, a company.
  ({ g, priv } = game(['a', 'b']));
  g.own[37] = { by: 'a', lvl: 0, mort: false };
  check(B.bankRentOf(g, 37, 7) === 35, 'bank: the base rent');
  g.own[39] = { by: 'a', lvl: 0, mort: false };
  check(B.bankRentOf(g, 39, 7) === 100, 'bank: a whole colour doubles it');
  g.own[39].lvl = 1; check(B.bankRentOf(g, 39, 7) === 200, 'bank: with a جراج');
  g.own[39].lvl = 2; check(B.bankRentOf(g, 39, 7) === 1400, 'bank: with an استراحة');
  g.own[39].lvl = 3; check(B.bankRentOf(g, 39, 7) === 2000, 'bank: with a سوق');
  g.own[39].mort = true; check(B.bankRentOf(g, 39, 7) === 0, 'bank: mortgaged: no rent');
  g.own[5] = { by: 'b', lvl: 0, mort: false }; g.own[15] = { by: 'b', lvl: 0, mort: false };
  check(B.bankRentOf(g, 5, 7) === 50 && B.bankRentOf(g, 5, 7, 2) === 100, 'bank: two stations 50, and the card doubles it');
  g.own[12] = { by: 'b', lvl: 0, mort: false };
  check(B.bankRentOf(g, 12, 7) === 28, 'bank: one company: four times the dice');
  g.own[28] = { by: 'b', lvl: 0, mort: false };
  check(B.bankRentOf(g, 12, 7) === 70, 'bank: both: ten times');

  // Building: the whole colour, evenly, the costs, selling back.
  ({ g, priv } = game(['a', 'b']));
  g.own[1] = { by: 'a', lvl: 0, mort: false };
  check(!B.bankCanBuild(g, 'a', 1), 'bank: no building without the whole colour');
  g.own[3] = { by: 'a', lvl: 0, mort: false };
  B.bankBuild(g, 'a', 1);
  check(g.own[1].lvl === 1 && g.cash.a === 1450, 'bank: a جراج costs the colour\'s price');
  check(!B.bankCanBuild(g, 'a', 1), 'bank: evenly: the other place first');
  B.bankBuild(g, 'a', 3); B.bankBuild(g, 'a', 1);
  check(g.own[1].lvl === 2 && g.cash.a === 1300, 'bank: an استراحة costs twice');
  let refused = false;
  try { B.bankSell(g, 'a', 3); } catch (e) { refused = true; }
  check(refused, 'bank: selling back goes evenly from the highest');
  B.bankSell(g, 'a', 1);
  check(g.own[1].lvl === 1 && g.cash.a === 1350, 'bank: sold back for half');
  refused = false;
  try { B.bankMortgage(g, 'a', 3); } catch (e) { refused = true; }
  check(refused, 'bank: no mortgage while the colour has buildings');
  B.bankSell(g, 'a', 1); B.bankSell(g, 'a', 3);
  B.bankMortgage(g, 'a', 3);
  check(g.own[3].mort && g.cash.a === 1430, 'bank: mortgaged for half the price');
  const before = g.cash.a;
  B.bankUnmortgage(g, 'a', 3);
  check(!g.own[3].mort && g.cash.a === before - 33, 'bank: back from the bank for half the price and 10%');

  // A debt: raise it or go bankrupt; to a player, they get everything.
  ({ g, priv } = game(['a', 'b', 'c']));
  g.own[39] = { by: 'b', lvl: 3, mort: false }; g.own[37] = { by: 'b', lvl: 3, mort: false };
  g.own[1] = { by: 'a', lvl: 0, mort: false };
  g.cash.a = 100; g.pos.a = 35;
  B.bankRoll(g, priv, 'a', [2, 2], Math.random);
  check(g.turn.stage === 'debt' && g.debt.amount === 2000 && g.debt.to === 'b', 'bank: a rent more than the cash is a debt');
  check(B.bankOnlyMove(g, 'a') && B.bankOnlyMove(g, 'a').action === 'bankrupt', 'bank: nothing can cover it: bankrupt is the only move');
  B.bankBankrupt(g, priv, 'a', 0);
  check(g.out.indexOf('a') !== -1 && g.own[1].by === 'b' && g.cash.b === 1600 && g.turn.pid !== 'a', 'bank: bankrupt to a player: the cash and the places go to them');
  ({ g, priv } = game(['a', 'b']));
  g.own[4 + 1] = { by: 'a', lvl: 0, mort: false };
  g.cash.a = 100; g.pos.a = 0;
  B.bankRoll(g, priv, 'a', [1, 3], Math.random);
  check(g.turn.stage === 'debt' && g.debt.to === 'bank', 'bank: a tax more than the cash is a debt to the bank');
  B.bankMortgage(g, 'a', 5);
  B.bankPayDebt(g, priv, 'a', Math.random);
  check(g.cash.a === 0 && g.turn.stage === 'act', 'bank: mortgage, then pay');

  // Trading.
  ({ g, priv } = game(['a', 'b']));
  g.own[1] = { by: 'a', lvl: 0, mort: false }; g.own[6] = { by: 'b', lvl: 0, mort: false };
  B.bankOffer(g, 'a', { to: 'b', give: { cash: 100, sqs: [1] }, get: { sqs: [6] } });
  check(g.offer && g.offer.from === 'a', 'bank: an offer waits for the other player');
  B.bankAnswer(g, 'b', true, g.offer.id);
  check(g.own[1].by === 'b' && g.own[6].by === 'a' && g.cash.a === 1400 && g.cash.b === 1600 && !g.offer, 'bank: yes: places and money change hands');
  refused = false;
  try { B.bankOffer(g, 'b', { to: 'a', give: { cash: 10 } }); } catch (e) { refused = true; }
  check(refused, 'bank: offers only on your own turn');

  // The cards: a jail card is kept and goes back to its deck; عزومة pays everyone.
  ({ g, priv } = game(['a', 'b', 'c']));
  priv.decks.court = [4].concat(priv.decks.court.filter((k) => k !== 4));
  g.pos.a = 0;
  B.bankRoll(g, priv, 'a', [1, 1], Math.random);
  check(g.cards.a.join() === 'court' && priv.decks.court.indexOf(4) === -1, 'bank: a get-out-of-jail card is kept');
  g.jail.a = 0; g.turn = { pid: 'a', stage: 'roll', dice: null, dbl: 0, again: false, total: 0 };
  B.bankUseCard(g, priv, 'a');
  check(g.jail.a === undefined && !g.cards.a.length && priv.decks.court[priv.decks.court.length - 1] === 4, 'bank: used, it goes to the bottom of its deck');
  ({ g, priv } = game(['a', 'b', 'c']));
  priv.decks.luck = [15].concat(priv.decks.luck.filter((k) => k !== 15));
  B.bankRoll(g, priv, 'a', [3, 4], Math.random);
  check(g.cash.a === 1400 && g.cash.b === 1550 && g.cash.c === 1550 && priv.decks.luck[15] === 15, 'bank: عزومة pays every player 50, and the card goes to the bottom');
  ({ g, priv } = game(['a', 'b']));
  priv.decks.luck = [5].concat(priv.decks.luck.filter((k) => k !== 5));
  g.own[15] = { by: 'b', lvl: 0, mort: false };
  g.pos.a = 5;
  B.bankRoll(g, priv, 'a', [1, 1], Math.random);
  check(g.pos.a === 15 && g.cash.a === 1450 && g.cash.b === 1550, 'bank: the next station ahead, and twice the rent');
  ({ g, priv } = game(['a', 'b'], { pot: true }));
  B.bankRoll(g, priv, 'a', [1, 3], Math.random);
  check(g.pot === 200, 'bank: with the pot, taxes go to the middle');
  g.turn = { pid: 'a', stage: 'roll', dice: null, dbl: 0, again: false, total: 0 };
  g.pos.a = 16;
  B.bankRoll(g, priv, 'a', [1, 3], Math.random);
  check(g.pot === 0 && g.cash.a >= 1500 && g.pos.a === 24, 'bank: the bus takes the pot and moves again by the same number');

  // The time: the lap is finished, then the richest wins.
  // Buying after the first lap (the owner, 22 Sep 2026: a switch, on by default).
  ({ g, priv } = B.bankNewGame(['a', 'b'], B.bankFillTokens(['a', 'b'], {}), 'a', { length: 0 }, 0, Math.random));
  check(g.settings.firstLap === true && game(['a', 'b']).g.settings.firstLap === false, 'bank first lap: on unless the table turns it off');
  B.bankRoll(g, priv, 'a', [1, 2], Math.random);
  check(g.pos.a === 3 && g.turn.stage === 'act' && !g.own[3] && g.events.some((e) => e.type === 'notYet' && e.pid === 'a' && e.sq === 3),
    'bank first lap: a free place before passing Start stays with the bank, and the turn goes on');
  refused = false;
  g.turn.stage = 'buy';
  try { B.bankBuy(g, 'a', true); } catch (e) { refused = true; }
  check(refused && !g.own[3] && g.cash.a === 1500, 'bank first lap: buying is refused before passing Start');
  g.turn.stage = 'act';
  g.lapped.b = true;
  g.own[1] = { by: 'b', lvl: 0, mort: false };
  refused = false;
  try { B.bankOffer(g, 'a', { to: 'b', give: { cash: 10 }, get: { sqs: [1] } }); } catch (e) { refused = true; }
  check(refused && !g.offer, 'bank first lap: nobody takes a place in a trade before passing Start');
  B.bankOffer(g, 'a', { to: 'b', give: { cash: 10 }, get: {} });
  B.bankAnswer(g, 'b', true, g.offer.id);
  check(g.cash.a === 1490 && g.cash.b === 1510, 'bank first lap: money still changes hands in a trade');
  g.own[6] = { by: 'b', lvl: 0, mort: false };
  g.turn = { pid: 'a', stage: 'roll', dice: null, dbl: 0, again: false, total: 0 };
  B.bankRoll(g, priv, 'a', [1, 2], Math.random);
  check(g.pos.a === 6 && g.events.some((e) => e.type === 'rent' && e.pid === 'a' && e.amount > 0), 'bank first lap: rent is still paid');
  g.pos.a = 36;
  g.turn = { pid: 'a', stage: 'roll', dice: null, dbl: 0, again: false, total: 0 };
  B.bankRoll(g, priv, 'a', [3, 4], Math.random);
  check(g.pos.a === 3 && g.lapped.a && g.turn.stage === 'buy' && g.events.some((e) => e.type === 'start' && e.pid === 'a' && e.first),
    'bank first lap: passing Start and landing on a place in the same move: it can be bought');
  B.bankBuy(g, 'a', true);
  check(g.own[3] && g.own[3].by === 'a', 'bank first lap: after passing Start, buying works');
  // High rents (the owner, 22 Sep 2026: a switch, off - the classic numbers by default).
  ({ g, priv } = game(['a', 'b']));
  g.own[1] = { by: 'b', lvl: 0, mort: false };
  check(!g.settings.highRent && B.bankRentOf(g, 1, 7) === 2, 'bank: the classic rents by default (الفيوم 2)');
  ({ g, priv } = game(['a', 'b'], { highRent: true }));
  g.own[1] = { by: 'b', lvl: 0, mort: false };
  g.own[39] = { by: 'b', lvl: 0, mort: false };
  const hr1 = B.bankRentOf(g, 1, 7);
  const hr39 = B.bankRentOf(g, 39, 7);
  g.own[3] = { by: 'b', lvl: 0, mort: false };
  const hrSet = B.bankRentOf(g, 1, 7);
  g.own[1].lvl = 1;
  g.own[3].lvl = 1;
  const hrGarage = B.bankRentOf(g, 1, 7);
  check(hr1 === 15 && hr39 === 50 && hrSet === 30 && hrGarage === 40, `bank high rents: 15 to 50 by price, doubled for the colour, a جراج above that (${hr1}, ${hr39}, ${hrSet}, ${hrGarage})`);
  let rising = true;
  Q.forEach((q, i) => {
    if (q.t !== 'p') return;
    const r = B.bankRents(g, i);
    if (!(r[1] > r[0] * 2 && r[2] > r[1] && r[3] > r[2])) rising = false;
  });
  check(rising, 'bank high rents: every building pays more than the step before, on every place');

  // One die (the owner, 22 Sep 2026: a switch, off): a 6 is what a double is with two.
  ({ g, priv } = game(['a', 'b']));
  check(!g.settings.oneDie && B.bankDice(g, Math.random).length === 2, 'bank: two dice by default');
  ({ g, priv } = game(['a', 'b'], { oneDie: true }));
  check(B.bankDice(g, Math.random).length === 1 && B.bankRollOff(['a', 'b', 'c'], Math.random, 1).rounds[0].every((r) => r.d.length === 1),
    'bank one die: one die to roll, and to decide who starts');
  // A 3, onto a place: a 2 lands on a card square, whose card may move the piece on.
  B.bankRoll(g, priv, 'a', [3, 5], Math.random);
  check(g.pos.a === 3 && g.turn.dice.length === 1 && g.turn.total === 3 && !g.turn.again, 'bank one die: you move by the one die');
  g.turn = { pid: 'a', stage: 'roll', dice: null, dbl: 0, again: false, total: 0 };
  g.pos.a = 0;
  B.bankRoll(g, priv, 'a', [6], Math.random);
  check(g.pos.a === 6 && g.turn.again, 'bank one die: a 6 rolls again');
  g.turn = { pid: 'a', stage: 'roll', dice: null, dbl: 2, again: true, total: 0 };
  B.bankRoll(g, priv, 'a', [6], Math.random);
  check(g.jail.a !== undefined && g.pos.a === 10, 'bank one die: a third 6 in a row goes to jail');
  g.turn = { pid: 'a', stage: 'roll', dice: null, dbl: 0, again: false, total: 0 };
  B.bankRoll(g, priv, 'a', [4], Math.random);
  check(g.jail.a === 1 && g.pos.a === 10, 'bank one die: in jail, anything but a 6 stays');
  g.turn = { pid: 'a', stage: 'roll', dice: null, dbl: 0, again: false, total: 0 };
  B.bankRoll(g, priv, 'a', [6], Math.random);
  check(g.jail.a === undefined && g.pos.a === 16 && !g.turn.again, 'bank one die: a 6 gets out of jail and moves 6, with no roll after');
  g.own[12] = { by: 'b', lvl: 0, mort: false };
  const co1 = B.bankRentOf(g, 12, 3);
  g.own[28] = { by: 'b', lvl: 0, mort: false };
  const co2 = B.bankRentOf(g, 12, 3);
  check(co1 === 24 && co2 === 60, `bank one die: a company is the die x 8, or x 20 with both (${co1}, ${co2})`);

  ({ g, priv } = B.bankNewGame(['a', 'b'], B.bankFillTokens(['a', 'b'], {}), 'a', { length: 0 }, 0, Math.random));
  g.pos.a = 27;
  B.bankRoll(g, priv, 'a', [1, 2], Math.random);
  check(g.jail.a !== undefined && !(g.lapped || {}).a, 'bank first lap: going to jail is not passing Start');

  ({ g, priv } = game(['a', 'b', 'c'], { length: 30 }));
  g.endsAt = 1000;
  g.cash.c = 5000;
  g.turn = { pid: 'b', stage: 'act', dice: null, dbl: 0, again: false, total: 0 };
  B.bankEndTurn(g, 'b', 2000);
  check(g.lastLap && g.phase === 'play' && g.turn.pid === 'c', 'bank: time up: the lap is finished first');
  g.turn.stage = 'act';
  B.bankEndTurn(g, 'c', 3000);
  check(g.phase === 'gameover' && g.places[0] === 'c', 'bank: back at the first player: over, the richest first');

  // Whole games of computer players on the clock. (Until one is left needs
  // bankruptcies, which bots that never offer trades can take for ever to reach:
  // that way of playing is for people, and its end is checked above.)
  const errorWas = console.error;
  const errors = [];
  console.error = (...a) => errors.push(a.join(' '));
  let ended = 0;
  let games = 0;
  let conserved = true;
  for (const n of [2, 3, 4, 6]) {
    for (const lvl of ['easy', 'hard', 'mix']) {
      games++;
      const r = newRoom(['h']);
      applyRoomAction(r, 'h', 'becomeScreen', {});
      applyRoomAction(r, 'h', 'chooseGame', { game: 'bank' });
      for (let k = 0; k < n; k++) applyRoomAction(r, 'h', 'addBot', { level: lvl === 'mix' ? (k % 2 ? 'hard' : 'easy') : lvl, name: 'B' });
      applyRoomAction(r, 'h', 'start', { length: 30, highRent: lvl === 'mix', oneDie: lvl === 'hard' });
      const t0 = clock;
      for (let step = 0; step < 40000 && r.shared.phase === 'play'; step++) {
        if (typeof r._botAt !== 'number') break;
        clock = Math.max(clock, r._botAt) + 1;
        roomTimeout(r, clock);
        const s = r.shared;
        if (Object.values(s.cash).some((c) => c < 0 || Number.isNaN(c))) conserved = false;
        // A 30-minute game: time passes quickly here.
        if (clock - t0 < 30 * 60000) clock += 3000;
      }
      if (r.shared.phase === 'gameover' && r.shared.places.length === n) ended++;
      else console.log('  ! bank game', n, lvl, r.shared.phase, r.shared.turn && r.shared.turn.stage, JSON.stringify(r.shared.cash));
    }
  }
  console.error = errorWas;
  check(ended === games, `bank bots: ${games} whole games of bots, 2-6 players, easy and hard, played to the end of the time (${ended})`);
  check(!errors.length, 'bank bots: no bot move was ever refused' + (errors.length ? ': ' + errors[0] : ''));
  check(conserved, 'bank: nobody\'s cash ever goes below nothing');

  // The room keeps the decks to itself.
  const rr = newRoom(['h', 'p']);
  applyRoomAction(rr, 'h', 'chooseGame', { game: 'bank' });
  applyRoomAction(rr, 'h', 'token', { token: 'camel' });
  applyRoomAction(rr, 'h', 'start', {});
  check(rr.shared.tokens.h === 'camel' && Array.isArray(rr._bank.decks.luck) && !JSON.stringify(rr.shared).includes('"decks"'), 'bank room: the piece picked is kept, and the decks stay on the server');
  check(rr.shared.settings.length === 45 && !rr.shared.settings.pot && !rr.shared.settings.go400 && rr.shared.settings.firstLap === true && rr.shared.clock === 0,
    'bank room: 45 minutes, the pot and 400 off, buying after the first lap on, no clock, by default');
  const r2 = newRoom(['h', 'p']);
  applyRoomAction(r2, 'h', 'chooseGame', { game: 'bank' });
  applyRoomAction(r2, 'h', 'start', { firstLap: false, highRent: true, oneDie: true });
  check(r2.shared.settings.firstLap === false && r2.shared.settings.highRent === true && rr.shared.settings.highRent === false,
    'bank room: high rents off by default; the host can turn them on and buying after the first lap off');
  check(r2.shared.settings.oneDie === true && rr.shared.settings.oneDie === false && r2.shared.events.find((e) => e.type === 'rolloff').rounds[0].every((x) => x.d.length === 1),
    'bank room: one die off by default; on, the room rolls one die, the roll-off too');
}

/* --- the audit of 22 Sep 2026: one check per fix ---------------------------- */
{
  // الموقع السري: anyone may ask first, the spy included (always a non-spy told the table who wasn't).
  let spyFirst = false;
  for (let k = 0; k < 60 && !spyFirst; k++) {
    const r = newRoom(['a', 'b', 'c']);
    applyRoomAction(r, 'a', 'chooseGame', { game: 'spyfall' });
    applyRoomAction(r, 'a', 'start', {});
    if (r._spyIds.indexOf(r.shared.firstId) !== -1) spyFirst = true;
  }
  check(spyFirst, 'spyfall: the spy can be the one who asks first');

  // الفنان المزيف: the order is fully random, so the fake may open (the owner, 22 Sep 2026).
  let fakeFirst = false;
  for (let k = 0; k < 60 && !fakeFirst; k++) {
    const r = newRoom(['a', 'b', 'c']);
    applyRoomAction(r, 'a', 'chooseGame', { game: 'fakeartist' });
    applyRoomAction(r, 'a', 'start', {});
    if (r.shared.drawerOrder[0] === r._fakeId) fakeFirst = true;
  }
  check(fakeFirst, 'fake artist: the fake can be the first to draw');

  // كلمة واحدة: the word itself is refused as a clue.
  {
    const r = newRoom(['a', 'b', 'c']);
    applyRoomAction(r, 'a', 'chooseGame', { game: 'justone' });
    applyRoomAction(r, 'a', 'start', {});
    const writer = ['a', 'b', 'c'].find((id) => id !== r.shared.guesserId);
    check(threw(() => applyRoomAction(r, writer, 'submitClue', { clue: 'ال' + r._joWord })) && r.shared.submitted.indexOf(writer) === -1,
      'just one: the secret word is refused as a clue');
  }

  // أونو: a call made on one card is forgotten when the hand grows again; one made on two still counts on one.
  {
    const r = newRoom(['a', 'b', 'c']);
    applyRoomAction(r, 'a', 'chooseGame', { game: 'uno' });
    applyRoomAction(r, 'a', 'start', {});
    const p = r.shared.order[0];
    const other = r.shared.order[1];
    r.shared.said = [p]; r._uno.saidAt = { [p]: 1 }; r._uno.hands[p] = r._uno.hands[p].slice(0, 2);
    applyRoomAction(r, other, 'catchUno', { target: '-' });   // a catch aimed at nobody only syncs
    check(r.shared.said.indexOf(p) === -1, 'uno: UNO said on one card is forgotten once the hand grows to two');
    r.shared.said = [p]; r._uno.saidAt = { [p]: 2 }; r._uno.hands[p] = r._uno.hands[p].slice(0, 1);
    applyRoomAction(r, other, 'catchUno', { target: '-' });
    check(r.shared.said.indexOf(p) !== -1, 'uno: UNO said on two cards still counts once down to one');
    r._uno.hands[p] = r._uno.hands[p].concat(r._uno.deck.splice(0, 1));
    applyRoomAction(r, other, 'catchUno', { target: '-' });
    check(r.shared.said.indexOf(p) === -1, 'uno: ...and is forgotten when the hand grows back to two');
  }

  // ربع قرد: the verdict that ended the game can be flipped, and play goes on.
  {
    const r = newRoom(['a', 'b', 'c']);
    applyRoomAction(r, 'a', 'chooseGame', { game: 'monkey' });
    applyRoomAction(r, 'a', 'start', { lang: 'ar', mode: 'letters', category: 'countries', timer: 0, winners: 1 });
    r.shared.quarters = { a: 4, b: 4, c: 0 };
    r.shared.verdict = { kind: 'liar-right', loserId: 'b', otherId: 'c', loser: 'B', canFlip: true };
    r.shared.phase = 'gameover'; r.phase = 'gameover'; r.shared.turnId = null;
    applyRoomAction(r, 'a', 'flip', {});
    check(r.shared.phase === 'play' && r.shared.quarters.b === 3 && r.shared.quarters.c === 1 && r.shared.turnId !== 'a',
      'monkey: flipping the deciding verdict reopens the game, and a monkey is not up');
  }

  // بنك الحظ: a debt to a player who leaves is cancelled; a "pay everyone" debt loses their share.
  {
    const BB = new Function(readFileSync(new URL('../../BankAlhaz.js', import.meta.url), 'utf8') +
      '\nreturn { bankNewGame, bankFillTokens, bankRemovePlayer };')();
    const mk = () => BB.bankNewGame(['a', 'b', 'c'], BB.bankFillTokens(['a', 'b', 'c'], {}), 'a', { length: 0, firstLap: false }, 0, Math.random);
    let { g, priv } = mk();
    g.turn.stage = 'debt';
    g.debt = { pid: 'a', amount: 2000, to: 'b', fine: false, then: { kind: 'after' } };
    BB.bankRemovePlayer(g, priv, 'b', 0);
    check(g.phase === 'play' && g.debt === null && g.turn.pid === 'a' && g.turn.stage !== 'debt',
      'bank: a debt owed to a player who leaves is cancelled, and the turn goes on');
    ({ g, priv } = mk());
    g.turn.stage = 'debt';
    g.debt = { pid: 'a', amount: 100, to: 'each', fine: false, then: { kind: 'after' } };
    BB.bankRemovePlayer(g, priv, 'c', 0);
    check(g.debt && g.debt.amount === 50, 'bank: a "pay everyone" debt loses the share of the player who left');

    // Play again keeps the host's turn clock.
    const rr = newRoom(['h', 'p']);
    applyRoomAction(rr, 'h', 'chooseGame', { game: 'bank' });
    applyRoomAction(rr, 'h', 'start', { turnClock: 60 });
    rr.shared.phase = 'gameover'; rr.phase = 'gameover';
    applyRoomAction(rr, 'h', 'playAgain', {});
    check(rr.shared.clock === 60, 'bank room: play again keeps the turn clock');
  }
}

/* --- خمّن مين: the faces, the questions, winner stays on ------------------------ */
{
  const GW = new Function(readFileSync(new URL('../../GuessWho.js', import.meta.url), 'utf8') +
    '\nreturn { gwDealBoard, gwSignature, gwAnswer, gwRuledOut, gwBotQuestion, gwUp, GW_QUESTIONS, GW_NAMES, gwName };')();
  let distinct = true, sized = true, named = true, capsOk = true;
  for (const n of [16, 24, 30]) {
    for (let k = 0; k < 40; k++) {
      const faces = GW.gwDealBoard(n);
      if (faces.length !== n) sized = false;
      if (new Set(faces.map(GW.gwSignature)).size !== n) distinct = false;
      const names = faces.map((f) => f.g + f.name);
      if (new Set(names).size !== n || faces.some((f) => !GW.gwName(f, 'ar') || !GW.gwName(f, 'en'))) named = false;
      if (faces.some((f) => f.hat && (f.style === 'bald' || f.style === 'bun'))) capsOk = false;
    }
  }
  check(sized && distinct, 'guesswho: a board is 16, 24 or 30 faces, and the list can tell every two of them apart');
  check(named, 'guesswho: every face has its own name, in Arabic and English');
  check(capsOk, 'guesswho: no cap on a bald head or a bun, where it would hide an answer');
  const bald = { g: 'm', style: 'bald', hair: 'black', eyes: 'blue' };
  const qi = (id) => GW.GW_QUESTIONS.findIndex((q) => q.id === id);
  check(!GW.gwAnswer(qi('black'), bald) && GW.gwAnswer(qi('bald'), bald) && GW.gwAnswer(qi('eyeblue'), bald),
    'guesswho: a bald head has no hair colour, and the other answers are plain');

  // The computer's questions narrow any board down to one face.
  let narrows = true;
  for (let k = 0; k < 60; k++) {
    const faces = GW.gwDealBoard(30);
    const secret = Math.floor(Math.random() * 30);
    let down = [];
    const asked = [];
    for (let step = 0; step < 40 && GW.gwUp(faces, down).length > 1; step++) {
      const q = GW.gwBotQuestion(faces, down, asked, k % 2 ? 'hard' : 'easy');
      if (q < 0) break;
      asked.push(q);
      down = down.concat(GW.gwRuledOut(faces, down, q, GW.gwAnswer(q, faces[secret])));
    }
    const left = GW.gwUp(faces, down);
    if (left.length !== 1 || left[0] !== secret) narrows = false;
  }
  check(narrows, 'guesswho: asking from the list always narrows a board down to the secret face');

  const gw = (ids, payload) => {
    const r = newRoom(ids);
    applyRoomAction(r, ids[0], 'chooseGame', { game: 'guesswho' });
    applyRoomAction(r, ids[0], 'start', payload || {});
    return r;
  };
  const refused = (fn) => { try { fn(); return false; } catch (e) { return true; } };
  const up = (r, seat) => GW.gwUp(r.shared.faces, r.shared.down[seat]);

  let r = gw(['a', 'b', 'c'], {});
  let s = r.shared;
  check(s.phase === 'play' && s.seats.length === 2 && s.line.length === 1 && s.faces.length === 24 && s.stage === 'ask' &&
    s.settings.autoFlip === false && s.settings.wrong === 'lose' && s.settings.pick === 'random',
    'guesswho: two sit down, one waits, 24 faces, and the defaults are the owner\'s');
  const [p0, p1] = s.seats;
  const watcher = s.line[0];
  check(r.secrets[p0].face === r._gw.secret[0] && r.secrets[p1].face === r._gw.secret[1] && !r.secrets[watcher] &&
    JSON.stringify(s).indexOf('secret') === -1,
    'guesswho: each seated phone holds its own face, the watcher none, and the table neither');
  check(refused(() => applyRoomAction(r, watcher, 'ask', { q: 0, seq: s.turnSeq })), 'guesswho: someone in the line cannot ask');
  check(refused(() => applyRoomAction(r, p1, 'ask', { q: 0, seq: s.turnSeq })), 'guesswho: nor the player whose turn it is not');
  // A list question waits for the other player (the owner, 23 Sep 2026), who can only answer it truthfully.
  let q = GW.gwBotQuestion(s.faces, s.down[0], [], 'hard');
  const truth = GW.gwAnswer(q, s.faces[r._gw.secret[1]]);
  const seq = s.turnSeq;
  applyRoomAction(r, p0, 'ask', { q, seq });
  check(s.stage === 'answer' && s.q.kind === 'list' && s.q.answer === null && s.log.length === 0 && s.turn === 0,
    'guesswho: a list question waits for the other player\'s answer, and the table doesn\'t know it yet');
  applyRoomAction(r, p0, 'ask', { q, seq });
  check(s.stage === 'answer' && s.asked[0].length === 1, 'guesswho: the same tap again, drawn for the last step, is dropped');
  check(refused(() => applyRoomAction(r, p0, 'answer', { yes: truth, seq: s.turnSeq })), 'guesswho: the asker can\'t answer their own list question');
  check(refused(() => applyRoomAction(r, p1, 'answer', { yes: !truth, seq: s.turnSeq })) && s.stage === 'answer',
    'guesswho: a wrong answer to a list question is refused ("look again"), and the question still waits');
  applyRoomAction(r, p1, 'answer', { yes: truth, seq: s.turnSeq });
  check(s.stage === 'flip' && s.turn === 0 && s.q.answer === truth && s.down[0].length === 0 && s.log.length === 1 && s.log[0].answer === truth,
    'guesswho: the true answer comes back, and by default nothing falls: the asker flips by hand');
  applyRoomAction(r, p0, 'done', { seq: s.turnSeq });
  check(s.turn === 1 && s.stage === 'ask', 'guesswho: "done" passes the turn');
  // Out loud: the other answers, the asker flips by hand and ends the turn.
  applyRoomAction(r, p1, 'loud', { seq: s.turnSeq });
  check(s.stage === 'answer' && s.q.kind === 'loud', 'guesswho: an out-loud question waits for the other player');
  check(refused(() => applyRoomAction(r, p1, 'answer', { yes: true, seq: s.turnSeq })), 'guesswho: the asker can\'t answer their own question');
  applyRoomAction(r, p0, 'answer', { yes: false, seq: s.turnSeq });
  check(s.stage === 'flip' && s.q.answer === false && s.down[1].length === 0, 'guesswho: after an out-loud answer nothing falls by itself');
  applyRoomAction(r, p1, 'flip', { face: 3, down: true });
  applyRoomAction(r, p1, 'flip', { face: 3, down: true });
  applyRoomAction(r, p1, 'flip', { face: 5, down: true });
  applyRoomAction(r, p1, 'flip', { face: 5, down: false });
  check(JSON.stringify(s.down[1]) === '[3]', 'guesswho: a face is put down and back up by hand, and a double tap is one flip');
  applyRoomAction(r, p1, 'done', { seq: s.turnSeq });
  check(s.turn === 0 && s.stage === 'ask', 'guesswho: "done" ends the turn');
  check(refused(() => applyRoomAction(r, p0, 'ask', { q, seq: s.turnSeq })), 'guesswho: a list question can\'t be asked twice');
  // A wrong guess loses the game (the default).
  const wrongFace = up(r, 0).find((i) => i !== r._gw.secret[1]);
  applyRoomAction(r, p0, 'guess', { face: wrongFace, seq: s.turnSeq });
  check(s.phase === 'over' && s.result.winnerId === p1 && s.result.reason === 'wrong' &&
    JSON.stringify(s.reveal) === JSON.stringify(r._gw.secret) && s.scores[p1] === 1,
    'guesswho: a wrong guess loses the game, and both faces are shown');
  check(JSON.stringify(s.line) === JSON.stringify([watcher, p0]), 'guesswho: the loser goes to the back of the line');
  applyRoomAction(r, 'a', 'nextRound', { round: s.round });
  s = r.shared;
  check(s.phase === 'play' && s.seats[0] === watcher && s.seats[1] === p1 && s.down[0].length === 0 &&
    !!r.secrets[watcher] && !r.secrets[p0],
    'guesswho: the next in line sits down against the winner, moves first, and a new board is dealt');
  // A right guess wins.
  applyRoomAction(r, watcher, 'guess', { face: r._gw.secret[1], seq: s.turnSeq });
  check(s.phase === 'over' && s.result.winnerId === watcher && s.result.reason === 'guess', 'guesswho: naming the face wins');

  // A wrong guess losing only the turn; faces flipped by hand after a list question.
  r = gw(['a', 'b'], { wrong: 'turn', autoFlip: false, size: 16 });
  s = r.shared;
  check(s.faces.length === 16 && s.settings.wrong === 'turn' && s.settings.autoFlip === false, 'guesswho: the host\'s switches are kept');
  const w0 = s.seats[0];
  const miss = GW.gwUp(s.faces, []).find((i) => i !== r._gw.secret[1]);
  applyRoomAction(r, w0, 'guess', { face: miss, seq: s.turnSeq });
  check(s.phase === 'play' && s.turn === 1 && s.down[0].indexOf(miss) !== -1, 'guesswho: with the switch, a wrong guess puts that face down and passes the turn');
  q = GW.gwBotQuestion(s.faces, s.down[1], [], 'hard');
  applyRoomAction(r, s.seats[1], 'ask', { q, seq: s.turnSeq });
  applyRoomAction(r, s.seats[0], 'answer', { yes: GW.gwAnswer(q, s.faces[r._gw.secret[0]]), seq: s.turnSeq });
  check(s.stage === 'flip' && s.down[1].length === 0 && typeof s.q.answer === 'boolean', 'guesswho: with app flipping off, a list answer waits for the hand');
  applyRoomAction(r, s.seats[1], 'done', { seq: s.turnSeq });
  // Typed: any question, answered as given, flipped by hand.
  applyRoomAction(r, s.seats[0], 'typed', { text: '  شعره\n طويل؟ ', seq: s.turnSeq });
  check(s.stage === 'answer' && s.q.kind === 'typed' && s.q.text === 'شعره طويل؟', 'guesswho: a typed question is cleaned to one line and waits for the other');
  check(refused(() => applyRoomAction(r, s.seats[0], 'typed', { text: 'x', seq: s.turnSeq })) === false || s.stage === 'answer', 'guesswho: nothing else can be asked meanwhile');
  applyRoomAction(r, s.seats[1], 'answer', { yes: true, seq: s.turnSeq });
  check(s.stage === 'flip' && s.q.answer === true && s.log[s.log.length - 1].kind === 'typed' && s.log[s.log.length - 1].text === 'شعره طويل؟',
    'guesswho: a typed answer is taken as given, logged with its text, and flipped by hand');
  applyRoomAction(r, s.seats[0], 'done', { seq: s.turnSeq });
  check(refused(() => applyRoomAction(r, s.seats[1], 'typed', { text: '   ', seq: s.turnSeq })), 'guesswho: an empty typed question is refused');

  // With the switch on, a list answer lets the ruled-out faces fall, and the turn passes.
  r = gw(['a', 'b'], { autoFlip: true });
  s = r.shared;
  q = GW.gwBotQuestion(s.faces, s.down[0], [], 'hard');
  const t2 = GW.gwAnswer(q, s.faces[r._gw.secret[1]]);
  const expect = GW.gwRuledOut(s.faces, [], q, t2).length;
  applyRoomAction(r, s.seats[0], 'ask', { q, seq: s.turnSeq });
  applyRoomAction(r, s.seats[1], 'answer', { yes: t2, seq: s.turnSeq });
  check(s.q.out === expect && s.down[0].length === expect && s.down[0].indexOf(r._gw.secret[1]) === -1 && s.turn === 1 && s.stage === 'ask',
    'guesswho: with faces falling by themselves, what the answer rules out falls and the turn passes');
  // The clock catches a list question unanswered: it is answered truthfully.
  r = gw(['a', 'b'], { turnClock: 30 });
  s = r.shared;
  q = GW.gwBotQuestion(s.faces, s.down[0], [], 'hard');
  applyRoomAction(r, s.seats[0], 'ask', { q, seq: s.turnSeq });
  check(s.endsAt > 0, 'guesswho: the clock starts again for the one answering');
  clock = s.endsAt + 2000;
  roomTimeout(r, clock);
  check(s.stage === 'flip' && s.q.answer === GW.gwAnswer(q, s.faces[r._gw.secret[1]]), 'guesswho: a list question the clock catches is answered truthfully');

  // Each picks their own face.
  r = gw(['a', 'b'], { pick: 'choose' });
  s = r.shared;
  check(s.phase === 'pick' && !r.secrets.a && !r.secrets.b, 'guesswho: with the switch, each picks their face first');
  applyRoomAction(r, s.seats[0], 'pick', { face: 4 });
  check(s.phase === 'pick' && r.secrets[s.seats[0]].face === 4 && !r.secrets[s.seats[1]], 'guesswho: a face picked is on that phone only');
  applyRoomAction(r, s.seats[1], 'pick', { face: 9 });
  check(s.phase === 'play' && r._gw.secret[0] === 4 && r._gw.secret[1] === 9 && s.stage === 'ask', 'guesswho: once both have picked, play starts');

  // The turn clock passes the turn.
  r = gw(['a', 'b'], { turnClock: 30 });
  s = r.shared;
  check(roomDeadline(r) === s.endsAt + 1500, 'guesswho: the turn clock is a server deadline');
  clock = s.endsAt + 2000;
  roomTimeout(r, clock);
  check(s.turn === 1 && s.log[s.log.length - 1].kind === 'skip', 'guesswho: when it runs out the turn passes, with no question');

  // Someone seated leaves: a forfeit.
  r = gw(['a', 'b', 'c'], {});
  s = r.shared;
  const leaver = s.seats[1];
  r.players = r.players.filter((p) => p.id !== leaver);
  roomPlayerLeft(r, leaver, 'X');
  check(s.phase === 'over' && s.result.reason === 'left' && s.result.winnerId === s.seats[0], 'guesswho: a seated player who leaves loses by forfeit');

  // A computer player plays a whole game, and can't be asked out loud.
  r = newRoom(['h']);
  applyRoomAction(r, 'h', 'chooseGame', { game: 'guesswho' });
  applyRoomAction(r, 'h', 'addBot', { level: 'hard', name: 'Robo' });
  applyRoomAction(r, 'h', 'start', { size: 30 });
  s = r.shared;
  const botSeat = s.seats.findIndex((id) => id !== 'h');
  if (s.turn !== botSeat) {
    check(refused(() => applyRoomAction(r, 'h', 'loud', { seq: s.turnSeq })), 'guesswho: a computer player can\'t be asked out loud');
  } else check(true, 'guesswho: a computer player can\'t be asked out loud (the bot went first)');
  let steps = 0;
  const hs = 1 - botSeat;
  while (r.shared.phase === 'play' && steps < 400) {
    steps++;
    const sh = r.shared;
    if (sh.stage === 'answer') {
      // The bot asked: the person answers truthfully. The person asked: the bot answers after its moment.
      if (sh.turn === botSeat) applyRoomAction(r, 'h', 'answer', { yes: GW.gwAnswer(sh.q.qi, sh.faces[r._gw.secret[hs]]), seq: sh.turnSeq });
      else { clock = (r._botAt || clock) + 10; roomTimeout(r, clock); }
      continue;
    }
    if (sh.stage === 'flip') {
      GW.gwRuledOut(sh.faces, sh.down[hs], sh.q.qi, sh.q.answer).forEach((f) => applyRoomAction(r, 'h', 'flip', { face: f, down: true }));
      applyRoomAction(r, 'h', 'done', { seq: sh.turnSeq });
      continue;
    }
    if (sh.turn === botSeat) { clock = (r._botAt || clock) + 10; roomTimeout(r, clock); continue; }
    const hq = GW.gwBotQuestion(sh.faces, sh.down[hs], sh.asked[hs], 'easy');
    if (hq < 0) applyRoomAction(r, 'h', 'guess', { face: up(r, hs)[0], seq: sh.turnSeq });
    else applyRoomAction(r, 'h', 'ask', { q: hq, seq: sh.turnSeq });
  }
  const botLog = r.shared.log.filter((e) => e.seat === botSeat);
  check(r.shared.phase === 'over' && botLog.every((e) => e.kind === 'list' || e.kind === 'guess') &&
    r.shared.log.some((e) => e.seat === hs && e.kind === 'list'),
    'guesswho: a hard computer player asks from the list, answers the person\'s questions, and plays the game to the end');

  // Two computer players against each other, many times: a hard one never guesses wrong.
  let bothFine = true;
  for (let k = 0; k < 20; k++) {
    const rb = newRoom(['h']);
    applyRoomAction(rb, 'h', 'chooseGame', { game: 'guesswho' });
    applyRoomAction(rb, 'h', 'addBot', { level: 'hard', name: 'A' });
    applyRoomAction(rb, 'h', 'addBot', { level: 'hard', name: 'B' });
    rb.players = rb.players.filter((p) => p.id !== 'h');
    rb.hostId = rb.players[0].id;
    applyRoomAction(rb, rb.hostId, 'start', { size: [16, 24, 30][k % 3] });
    let n = 0;
    while (rb.shared.phase === 'play' && n < 200) { n++; clock = (rb._botAt || clock) + 10; roomTimeout(rb, clock); }
    if (rb.shared.phase !== 'over' || rb.shared.result.reason !== 'guess') bothFine = false;
  }
  check(bothFine, 'guesswho: two hard computer players always finish with a right guess');
}

/* --- المشنقة: the letters, the fold, the two ways a room plays ---------------- */
{
  const src = (f) => readFileSync(new URL('../../' + f, import.meta.url), 'utf8');
  const HM = new Function(src('ChameleonWords.js') + src('EmojiRiddles.js') + src('Hangman.js') +
    '\nreturn { hmFold, hmPool, hmPattern, hmApply, hmNewBoard, hmWordProblem, hmAlphaOf, hmSolved, hmShape, hmFound };')();
  const ar = HM.hmPool('ar'), en = HM.hmPool('en');
  const okDeal = (p) => p.every((x) => {
    const shape = HM.hmShape(x.w);
    const n = shape.reduce((a, b) => a + b, 0);
    return x.c && shape.length <= 3 && (shape.length === 1 ? n >= 4 && n <= 9 : n <= 16 && shape.every((k) => k >= 2));
  });
  check(ar.length > 150 && en.length > 150 && okDeal(ar) && okDeal(en) && ar.every((x) => HM.hmAlphaOf(x.w) === 'ar') && en.every((x) => HM.hmAlphaOf(x.w) === 'en'),
    'hangman: the race deals words of 4 to 9 letters and names of up to 3 words, each with its kind (' + ar.length + ' ar, ' + en.length + ' en)');
  check(ar.some((x) => x.w === 'محمد صلاح') && ar.some((x) => x.w === 'عادل إمام') && ar.some((x) => /🎬/.test(x.c) && x.w === 'الفيل الأزرق'),
    'hangman: famous people from the Chameleon boards and films from the emoji riddles are in the race');
  check(!ar.some((x) => /أمثال/.test(x.c)), 'hangman: the proverbs are not (they are sentences)');
  check(!ar.some((x) => x.w === 'جبنة كريمي' || x.w === 'صلاة العيد') && !en.some((x) => x.w === 'Cream Cheese' || x.w === 'Rye Bread'),
    'hangman: an entry its hint gives away is not dealt («أنواع جبنة» for «جبنة كريمي»)');
  const b = HM.hmNewBoard();
  check(HM.hmApply(b, 'أسوان', 'ا') === 'hit' && HM.hmPattern('أسوان', b.g).join('|') === 'أ|||ا|',
    'hangman: ا opens أ too, and the word shows as it is spelt');
  const b2 = HM.hmNewBoard();
  HM.hmApply(b2, 'زرافة', 'ه');
  check(HM.hmPattern('زرافة', b2.g)[4] === 'ة', 'hangman: ه opens ة');
  const b3 = HM.hmNewBoard();
  check(HM.hmApply(b3, 'مستشفى', 'ي') === 'hit' && HM.hmPattern('مستشفى', b3.g)[5] === 'ى', 'hangman: ي opens ى');
  const b4 = HM.hmNewBoard();
  ['ق', 'ث', 'ج', 'ح', 'خ'].forEach((l) => HM.hmApply(b4, 'برتقال', l));
  check(b4.miss.length === 4 && b4.state === 'play', 'hangman: a letter in the word costs nothing, one that isn\'t costs a piece');
  check(HM.hmApply(b4, 'برتقال', 'ث') === '' && b4.miss.length === 4, 'hangman: a letter tried twice costs nothing the second time');
  check(HM.hmApply(b4, 'برتقال', 'موز', true) === 'miss' && b4.miss.length === 5, 'hangman: a wrong whole word costs a piece');
  check(HM.hmApply(b4, 'برتقال', 'د') === 'lost' && b4.state === 'lost', 'hangman: the sixth miss hangs the man');
  const b5 = HM.hmNewBoard();
  check(HM.hmApply(b5, 'برتقال', 'برتقال', true) === 'won' && HM.hmSolved('برتقال', b5.g), 'hangman: the right whole word solves it');
  check(HM.hmWordProblem('برتقال') === '' && HM.hmWordProblem('ab') === 'short' && HM.hmWordProblem('two words') === '' &&
    HM.hmWordProblem('الناصر صلاح الدين') === '' && HM.hmWordProblem('انا رايح المدرسة بكرة') === 'sentence' &&
    HM.hmWordProblem('abc1') === 'letters' && HM.hmWordProblem('بيتx') === 'letters' && HM.hmWordProblem('Cairo') === '',
    'hangman: a written word is a word or a name of up to 3 words (never a sentence), in one alphabet');
  // A name: a box a letter, a gap between the words, the gap never a letter to find.
  const nb = HM.hmNewBoard();
  const name = 'محمد  صلاح';
  check(JSON.stringify(HM.hmShape(name)) === '[4,4]' && HM.hmPattern(name, []).join('|') === '||||' + ' ' + '||||',
    'hangman: a name shows a box a letter and one gap between its words, however it was spaced');
  HM.hmApply(nb, name, 'م');
  check(HM.hmFound(HM.hmPattern(name, nb.g)) === 2, 'hangman: a letter shows in every word it is in; the gap is not counted');
  check(HM.hmApply(nb, name, 'محمدصلاح', true) === 'won', 'hangman: the whole name typed without its space counts');
  // The fold, both ways.
  const f1 = HM.hmNewBoard();
  check(HM.hmApply(f1, 'أحمد', 'ا') === 'hit' && HM.hmPattern('أحمد', f1.g)[0] === 'أ', 'hangman: ا finds أ, and the word shows أ as it was typed');
  const f2 = HM.hmNewBoard();
  check(HM.hmApply(f2, 'احمد', 'أ') === 'hit' && HM.hmPattern('احمد', f2.g)[0] === 'ا', 'hangman: and أ finds ا');
  const f3 = HM.hmNewBoard();
  check(HM.hmApply(f3, 'مدرسه', 'مدرسة', true) === 'won' && HM.hmApply(HM.hmNewBoard(), 'إسكندرية', 'اسكندريه', true) === 'won' &&
    HM.hmApply(HM.hmNewBoard(), 'مستشفي', 'مستشفى', true) === 'won',
    'hangman: a whole word folds both ways: ة and ه, أ إ آ and ا, ى and ي');

  const hm = (ids, payload) => {
    const r = newRoom(ids);
    applyRoomAction(r, ids[0], 'chooseGame', { game: 'hangman' });
    applyRoomAction(r, ids[0], 'start', payload || {});
    return r;
  };
  const refused = (fn) => { try { fn(); return false; } catch (e) { return true; } };

  let r = hm(['a', 'b', 'c'], { rounds: 3 });
  let s = r.shared;
  check(s.phase === 'writing' && s.settings.mode === 'setter' && s.rounds === 3 && !!s.setter, 'hangman: one writes first, by default');
  const setter = s.setter;
  const others = ['a', 'b', 'c'].filter((x) => x !== setter);
  check(refused(() => applyRoomAction(r, others[0], 'setWord', { word: 'قطة', round: 1 })), 'hangman: only the writer writes the word');
  check(refused(() => applyRoomAction(r, setter, 'setWord', { word: 'قطة سوداء كبيرة جدا', round: 1 })), 'hangman: four words are a sentence, and refused');
  check(refused(() => applyRoomAction(r, setter, 'setWord', { word: 'مدرسة', hint: 'فيها مدرسه وفصول', round: 1 })),
    'hangman: a hint that spells the word out is refused');
  applyRoomAction(r, setter, 'setWord', { word: 'مَدرسة', hint: '  مكان   ', round: 1 });
  check(r.shared.cat === 'مكان', 'hangman: the writer\'s hint, when there is one, is above the boxes for everyone');
  check(s.phase === 'guessing' && s.len === 5 && JSON.stringify(s).indexOf('مدرس') === -1 && r.secrets[setter].word === 'مدرسة' &&
    !r.secrets[others[0]].word && r.secrets[others[0]].pattern.join('') === '',
    'hangman: the word is out - the writer\'s phone has it, the table and the guessers don\'t');
  applyRoomAction(r, others[0], 'guess', { letter: 'د', round: 1 });
  applyRoomAction(r, others[0], 'guess', { letter: 'ك', round: 1 });
  check(s.progress[others[0]].n === 1 && s.progress[others[0]].miss === 1 && r.secrets[others[0]].pattern[1] === 'د' &&
    r.secrets[others[1]].pattern.join('') === '' && JSON.stringify(s.progress).indexOf('د') === -1,
    'hangman: each board is its own; the table sees how many letters and misses, never which');
  check(refused(() => applyRoomAction(r, setter, 'guess', { letter: 'م', round: 1 })), 'hangman: the writer doesn\'t guess');
  applyRoomAction(r, others[0], 'whole', { text: 'مدرسه', round: 1 });
  check(s.progress[others[0]].state === 'won' && s.phase === 'guessing', 'hangman: the whole word, typed with ه for ة, solves it');
  ['ث', 'ج', 'ح', 'خ', 'ذ', 'ز'].forEach((l) => applyRoomAction(r, others[1], 'guess', { letter: l, round: 1 }));
  check(s.phase === 'result' && s.result.word === 'مدرسة' && s.scores[others[0]] === 15 && s.scores[setter] === 5 && !s.scores[others[1]],
    'hangman: the word ends when all are done; the first solve is 10 + 5 with a writer too, the writer 5 for each who was hanged');
  applyRoomAction(r, 'a', 'nextRound', { round: 1 });
  check(s.round === 2 && s.phase === 'writing' && s.setter !== setter && !s.cat, 'hangman: the next word has the next writer, and no hint yet');
  // The writer leaves before writing: the next one writes.
  const w2 = s.setter;
  r.players = r.players.filter((p) => p.id !== w2);
  roomPlayerLeft(r, w2, 'W');
  check(s.phase === 'writing' && !!s.setter && s.setter !== w2 && r.players.some((p) => p.id === s.setter), 'hangman: a writer who leaves hands the word to the next');

  // The race: the app's word, the fastest solve scores most.
  r = hm(['a', 'b', 'c'], { mode: 'race', rounds: 3, clock: 60, lang: 'ar' });
  s = r.shared;
  const word = r._hm.word;
  check(s.phase === 'guessing' && !!s.cat && s.len === Array.from(word.replace(/ /g, '')).length &&
    s.shape.reduce((a, b) => a + b, 0) === s.len && !s.setter && Object.keys(s.progress).length === 3,
    'hangman: the race deals the app\'s word to everyone, with its category');
  applyRoomAction(r, 'c', 'whole', { text: word, round: 1 });
  applyRoomAction(r, 'a', 'whole', { text: word, round: 1 });
  check(s.phase === 'guessing' && !s.scores.c, 'hangman: points go on the board when the word ends, not before');
  check(roomDeadline(r) === s.endsAt + 1500, 'hangman: the word\'s clock is a server deadline');
  clock = s.endsAt + 2000;
  roomTimeout(r, clock);
  check(s.phase === 'result' && s.scores.c === 15 && s.scores.a === 14 && s.result.rows.find((x) => x.id === 'b').state === 'lost',
    'hangman: when the clock runs out whoever hasn\'t solved it has failed; the first solve is 10 + 5, the second 10 + 4');
  applyRoomAction(r, 'a', 'nextRound', { round: 1 });
  applyRoomAction(r, 'a', 'closeWord', { round: 2 });
  applyRoomAction(r, 'a', 'nextRound', { round: 2 });
  applyRoomAction(r, 'a', 'closeWord', { round: 3 });
  check(s.phase === 'gameover' && r.phase === 'gameover', 'hangman: the game ends after the chosen number of words');
  applyRoomAction(r, 'a', 'playAgain', {});
  check(r.shared.phase === 'guessing' && r.shared.round === 1 && r.shared.settings.mode === 'race' && r.shared.settings.clock === 60,
    'hangman: play again keeps the way of playing');
}

/* --- one sets, everyone solves (RoomSolve.js): the engine and its four games ---- */
{
  const src = (f) => readFileSync(new URL('../../' + f, import.meta.url), 'utf8');
  const SV = new Function(src('WordleWords.js') + src('Countries.js') + src('SolveGames.js') +
    '\nreturn { svWordleColours, svWordleProblem, svWordleFold, svWordleTries, svNumTries, svNumVerdict, svNumProblem, svEmojiClueProblem, svEmojiAnswerProblem, svCountryLetter, svFlagHintsAt, flagCountry, flagsDistance, flagsBearing, flagsProximity, WORDLE_DB, COUNTRIES };')();
  const refused = (fn) => { try { fn(); return false; } catch (e) { return true; } };

  // The board rules, each game's own.
  check(SV.svWordleColours('SPEED', 'ERASE') === 'pappa' && SV.svWordleColours('LEVEL', 'HELLO') === 'pcaap' &&
    SV.svWordleColours('ALLEY', 'LLAMA') === 'pcpaa' && SV.svWordleColours('EERIE', 'THEME') === 'paaac',
    'solve/wordle: a repeated letter is yellow only as often as the word holds it, the greens taken first');
  check(SV.svWordleColours('HELLO', 'HELLO') === 'ccccc' && SV.svWordleColours('ملعقة', 'مدرسة') === 'caaac', 'solve/wordle: the right word is all green, in Arabic too');
  check(SV.svWordleProblem('أسوان') === '' && SV.svWordleProblem('apple') === '' && SV.svWordleProblem('app') === 'length' &&
    SV.svWordleProblem('computers') === 'length' && SV.svWordleProblem('ab1cd') === 'letters' && SV.svWordleProblem('abcمن') === 'letters' &&
    SV.svWordleProblem('') === 'empty', 'solve/wordle: a written word is 5 to 8 letters on one keypad');
  check(SV.svWordleFold('إِسْكَنْدَرية') === 'اسكندرية' && SV.svWordleFold('Apple') === 'APPLE', 'solve/wordle: a word is folded as the keypad types it (marks off, أ إ آ as ا, capitals)');
  check(SV.svWordleTries(5) === 6 && SV.svWordleTries(6) === 6 && SV.svWordleTries(7) === 7 && SV.svWordleTries(8) === 7, 'solve/wordle: 6 tries, 7 for a word of 7 or 8, as on one phone');
  check(SV.svNumTries(50) === 8 && SV.svNumTries(100) === 9 && SV.svNumTries(1000) === 12, 'solve/guessnum: two tries more than halving always needs (8, 9, 12)');
  check(SV.svNumVerdict(40, 50) === 'higher' && SV.svNumVerdict(60, 50) === 'lower' && SV.svNumVerdict(50, 50) === 'right', 'solve/guessnum: higher, lower, right');
  check(SV.svNumProblem(1, 100) === '' && SV.svNumProblem(100, 100) === '' && SV.svNumProblem(0, 100) && SV.svNumProblem(101, 100) && SV.svNumProblem(2.5, 100),
    'solve/guessnum: a number is a whole number in the range');
  const eg = SV.flagCountry('EG'), fr = SV.flagCountry('FR'), br = SV.flagCountry('BR');
  const bear = SV.flagsBearing(eg, fr);
  check(Math.abs(SV.flagsDistance(eg, fr) - 3313) < 5 && bear > 290 && bear < 330 && SV.flagsBearing(eg, br) > 230 && SV.flagsBearing(eg, br) < 270,
    'solve/flags: Egypt to France is about 3,300 km to the north-west, to Brazil west-south-west');
  check(SV.flagsProximity(0) === 100 && SV.flagsProximity(20015) === 0 && SV.svCountryLetter(SV.flagCountry('MA'), 'ar') === 'م' && SV.svCountryLetter(fr, 'en') === 'F',
    'solve/flags: closeness runs 100 to 0, and the first-letter hint skips ال');
  check(JSON.stringify(SV.svFlagHintsAt('flag')) === '{"cont":3,"letter":5}' && JSON.stringify(SV.svFlagHintsAt('far')) === '{"cont":4,"letter":6}',
    'solve/flags: the continent, then the first letter, after the one-phone game\'s number of misses');
  check(SV.svEmojiClueProblem('🦁👑', 'The Lion King') === '' && SV.svEmojiClueProblem('🦁🇰🇮🇳🇬', 'The Lion King') === 'spells' &&
    SV.svEmojiClueProblem('🦁 lion', 'x') === 'letters' && SV.svEmojiClueProblem('3️⃣🐷', 'Three little pigs') === '' &&
    SV.svEmojiClueProblem('🍯⚫', 'عسل أسود') === '' && SV.svEmojiClueProblem('👨‍👩‍👧👍🏽', 'family') === '' && SV.svEmojiClueProblem('🆗', 'ok') === '' &&
    SV.svEmojiClueProblem('🐱🇨🇦🇹', 'cat') === 'spells' && SV.svEmojiClueProblem('', 'x') === 'empty' && SV.svEmojiClueProblem('قطة', 'x') === 'letters',
    'solve/emoji: a clue is emoji only (keycaps, families and skin tones too), and its letter emoji may not spell the answer');
  check(SV.svEmojiAnswerProblem('الفيل الأزرق') === '' && SV.svEmojiAnswerProblem('x') === 'short' && SV.svEmojiAnswerProblem('') === 'empty' &&
    SV.svEmojiAnswerProblem('one two three four five six seven eight nine') === 'long', 'solve/emoji: an answer is two letters or more, up to 8 words');

  // The engine in a room.
  const sv = (game, ids, payload) => {
    const r = newRoom(ids);
    applyRoomAction(r, ids[0], 'chooseGame', { game });
    applyRoomAction(r, ids[0], 'start', payload || {});
    return r;
  };
  let r = sv('wordle', ['a', 'b', 'c'], { rounds: 3 });
  let s = r.shared;
  check(s.solve === 'wordle' && s.phase === 'setting' && s.settings.mode === 'setter' && s.rounds === 3 && !!s.setter, 'solve: one sets first, by default');
  const setter = s.setter;
  const [p1, p2] = ['a', 'b', 'c'].filter((x) => x !== setter);
  check(refused(() => applyRoomAction(r, p1, 'setSecret', { word: 'مدرسة', round: 1 })), 'solve: only the setter sets it');
  check(refused(() => applyRoomAction(r, setter, 'setSecret', { word: 'قطة', round: 1 })) && refused(() => applyRoomAction(r, setter, 'setSecret', { word: 'abc12', round: 1 })),
    'solve/wordle: a word of the wrong length or letters is refused');
  applyRoomAction(r, setter, 'setSecret', { word: 'مَدرسة', round: 2 });
  check(s.phase === 'setting', 'solve: a tap from another round is dropped');
  applyRoomAction(r, setter, 'setSecret', { word: 'مَدرسة', round: 1 });
  check(s.phase === 'solving' && s.pub.len === 5 && s.pub.alpha === 'ar' && JSON.stringify(s).indexOf('مدرس') === -1 &&
    r.secrets[setter].mine.word === 'مدرسة' && !('mine' in r.secrets[p1]) && r.secrets[p1].board.g.length === 0,
    'solve: the secret is set - the setter\'s phone has it, the table and the solvers don\'t');
  check(refused(() => applyRoomAction(r, setter, 'guess', { text: 'مدرسة', round: 1 })), 'solve: the setter doesn\'t solve');
  check(refused(() => applyRoomAction(r, p1, 'guess', { text: 'مدرس', round: 1 })), 'solve/wordle: a guess of the wrong length is refused');
  applyRoomAction(r, p1, 'guess', { text: 'ملعقة', round: 1 });
  check(r.secrets[p1].board.g[0].c === 'caaac' && s.progress[p1].n === 1 && s.progress[p1].rows[0] === 'caaac' &&
    JSON.stringify(s.progress).indexOf('ملعق') === -1 && r.secrets[p2].board.g.length === 0,
    'solve/wordle: the colours are worked out on the server; the table sees a row\'s colours, never its letters');
  applyRoomAction(r, p1, 'guess', { text: 'ملعقة', round: 1 });
  check(s.progress[p1].n === 1, 'solve/wordle: the same guess twice costs nothing');
  applyRoomAction(r, p2, 'guess', { text: 'مدرسه', round: 1 });
  check(s.progress[p2].state === 'play', 'solve/wordle: ه is not ة in خمن الكلمة (a key each)');
  applyRoomAction(r, p2, 'guess', { text: 'مدرسة', round: 1 });
  applyRoomAction(r, p1, 'guess', { text: 'مدرسة', round: 1 });
  check(s.phase === 'result' && s.result.reveal.word === 'مدرسة' && s.scores[p2] === 15 && s.scores[p1] === 14 && !s.scores[setter],
    'solve: a solve is 10 + a bonus by order (+5, +4); nobody failed, so the setter scores nothing');
  check(s.board[0].id === p2 && s.board[0].tries === 2 && s.board[1].tries === 2, 'solve: the board keeps each player\'s tries');
  applyRoomAction(r, 'a', 'nextRound', { round: 1 });
  check(s.round === 2 && s.phase === 'setting' && s.setter !== setter, 'solve: the next secret has the next setter');
  const setter2 = s.setter;
  const solvers2 = ['a', 'b', 'c'].filter((x) => x !== setter2);
  applyRoomAction(r, setter2, 'setSecret', { word: 'apple', round: 2 });
  check(s.pub.alpha === 'en' && r.secrets[setter2].mine.word === 'APPLE', 'solve/wordle: the keyboard follows the word\'s alphabet');
  for (const w of ['BRAVE', 'CHORD', 'FUNKY', 'GHOST', 'JUMPS', 'MIGHT']) applyRoomAction(r, solvers2[0], 'guess', { text: w, round: 2 });
  check(s.progress[solvers2[0]].state === 'lost' && s.phase === 'solving', 'solve/wordle: six misses and the board is lost');
  applyRoomAction(r, solvers2[1], 'guess', { text: 'apple', round: 2 });
  check(s.phase === 'result' && s.result.setterPts === 5, 'solve: the setter takes 5 for the one who didn\'t solve it');
  // A tie on points: fewer tries first.
  const tie = sv('guessnum', ['a', 'b', 'c'], { mode: 'race', rounds: 3, max: 100 });
  tie.shared.scores = { a: 30, b: 30 };
  tie.shared.tries = { a: 9, b: 4 };
  applyRoomAction(tie, 'a', 'closeRound', { round: 1 });
  check(tie.shared.board[0].id === 'b' && tie.shared.board[1].id === 'a', 'solve: a tie on points goes to fewer tries');

  // The setter leaves before setting: the next one sets. The host can skip a quiet setter.
  r = sv('guessnum', ['a', 'b', 'c', 'd'], { rounds: 3, max: 50 });
  s = r.shared;
  const quiet = s.setter;
  applyRoomAction(r, 'a', 'skipTurn', { round: 1 });
  check(s.phase === 'setting' && s.setter && s.setter !== quiet, 'solve: the host moves on from a quiet setter');
  const leaver = s.setter;
  r.players = r.players.filter((p) => p.id !== leaver);
  roomPlayerLeft(r, leaver, 'L');
  check(s.phase === 'setting' && s.setter !== leaver && r.players.some((p) => p.id === s.setter), 'solve: a setter who leaves before setting hands it on');
  check(refused(() => applyRoomAction(r, s.setter, 'setSecret', { n: 51, round: 1 })), 'solve/guessnum: a number outside the host\'s range is refused');
  applyRoomAction(r, s.setter, 'setSecret', { n: 37, round: 1 });
  const ns = Object.keys(s.progress);
  // The value itself anywhere in the table - not its digits inside a random id or a time.
  const holdsValue = (node, v) => node === v || node === String(v) || (!!node && typeof node === 'object' && Object.keys(node).some((k) => holdsValue(node[k], v)));
  check(s.pub.max === 50 && s.maxTries === 8 && ns.length === 2 && !holdsValue(s, 37), 'solve/guessnum: the range is public, the number is not');
  applyRoomAction(r, ns[0], 'guess', { n: 25, round: 1 });
  applyRoomAction(r, ns[0], 'guess', { n: 40, round: 1 });
  const nb = r.secrets[ns[0]].board;
  check(nb.g[0].v === 'higher' && nb.g[1].v === 'lower' && nb.lo === 26 && nb.hi === 39 && r.secrets[ns[1]].board.g.length === 0 && !('lo' in s.progress[ns[0]]),
    'solve/guessnum: higher and lower come from the server, and where a board has narrowed it to stays on its own phone');
  check(refused(() => applyRoomAction(r, ns[0], 'guess', { n: 0, round: 1 })), 'solve/guessnum: a guess outside the range is refused');
  // A solver leaves: the round is over when everyone left is done.
  applyRoomAction(r, ns[0], 'guess', { n: 37, round: 1 });
  r.players = r.players.filter((p) => p.id !== ns[1]);
  roomPlayerLeft(r, ns[1], 'L');
  check(s.phase === 'result' && s.scores[ns[0]] === 15 && s.result.rows.length === 1, 'solve: a solver who leaves takes their board, and the round ends without them');
  r.players = r.players.filter((p) => p.id !== ns[0]);
  roomPlayerLeft(r, ns[0], 'L');
  check(s.phase === 'gameover' && r.phase === 'gameover', 'solve: fewer than two ends the game');

  // The race and the clock.
  r = sv('flags', ['a', 'b', 'c'], { mode: 'race', rounds: 3, clock: 60, clue: 'flag', level: 'easy', lang: 'ar' });
  s = r.shared;
  const code = r._solve.secret.code;
  check(s.phase === 'solving' && !s.setter && SV.flagCountry(code).tier === 1 && Object.keys(s.progress).length === 3 && s.pub.clue === 'flag' && !!s.pub.flag &&
    JSON.stringify(s).indexOf('"' + code + '"') === -1 && JSON.stringify(r.secrets).indexOf('"' + code + '"') === -1,
    'solve/flags: the race deals a well-known country to everyone; the flag is the clue, the country stays on the server');
  const wrong = SV.COUNTRIES.filter((c) => c.code !== code).map((c) => c.code);
  for (let i = 0; i < 3; i++) applyRoomAction(r, 'a', 'guess', { code: wrong[i], round: 1 });
  const fa = r.secrets.a.board;
  const target = SV.flagCountry(code);
  check(fa.g[0].km === SV.flagsDistance(SV.flagCountry(wrong[0]), target) && fa.g[0].deg === Math.round(SV.flagsBearing(SV.flagCountry(wrong[0]), target)) &&
    fa.hints.cont === target.cont && !fa.hints.letter && !r.secrets.b.board.hints.cont && s.progress.a.best === Math.max(...fa.g.map((g) => g.p)),
    'solve/flags: the distance and the direction from the server; the continent after three misses, on that phone only');
  applyRoomAction(r, 'a', 'guess', { code: wrong[3], round: 1 });
  applyRoomAction(r, 'a', 'guess', { code: wrong[4], round: 1 });
  check(!!r.secrets.a.board.hints.letter, 'solve/flags: and the first letter after five');
  applyRoomAction(r, 'c', 'guess', { code: code, round: 1 });
  check(s.phase === 'solving' && !s.scores.c, 'solve: points go on the board when the round ends, not before');
  check(roomDeadline(r) === s.endsAt + 1500, 'solve: the clock is a server deadline');
  clock = s.endsAt + 2000;
  roomTimeout(r, clock);
  check(s.phase === 'result' && s.scores.c === 15 && s.result.rows.find((x) => x.id === 'b').state === 'lost' && s.result.reveal.code === code && !s.result.setterPts,
    'solve: when the clock runs out whoever hasn\'t solved it has failed; the race has no setter');
  applyRoomAction(r, 'a', 'nextRound', { round: 1 });
  applyRoomAction(r, 'a', 'closeRound', { round: 2 });
  applyRoomAction(r, 'a', 'nextRound', { round: 2 });
  applyRoomAction(r, 'a', 'closeRound', { round: 3 });
  check(s.phase === 'gameover' && r.phase === 'gameover', 'solve: the game ends after the chosen number');
  applyRoomAction(r, 'a', 'playAgain', {});
  check(r.shared.phase === 'solving' && r.shared.round === 1 && r.shared.settings.mode === 'race' && r.shared.settings.clock === 60 && r.shared.settings.clue === 'flag',
    'solve: play again keeps the way of playing');
  r = sv('flags', ['a', 'b'], { mode: 'race', clue: 'far', level: 'hard' });
  check(r.shared.pub.clue === 'far' && !r.shared.pub.flag && r.shared.maxTries === 8, 'solve/flags: by distance nothing is shown, and there are 8 tries');
  r = sv('flags', ['a', 'b'], { rounds: 3 });
  check(refused(() => applyRoomAction(r, r.shared.setter, 'setSecret', { code: 'XX', round: 1 })), 'solve/flags: the setter picks a country from the table');

  // فوازير إيموجي: a written riddle, the race on the app's, and the quiz that stays.
  r = sv('emoji', ['a', 'b', 'c'], { way: 'setter', rounds: 3, lang: 'ar' });
  s = r.shared;
  check(s.solve === 'emoji' && s.phase === 'setting', 'solve/emoji: a riddle a player writes is a way of فوازير إيموجي');
  const es = s.setter;
  const [e1, e2] = ['a', 'b', 'c'].filter((x) => x !== es);
  check(refused(() => applyRoomAction(r, es, 'setSecret', { answer: 'طماطماية', clue: 'طماطم 🍅', kind: 'dish', round: 1 })), 'solve/emoji: a clue with letters is refused');
  applyRoomAction(r, es, 'setSecret', { answer: 'طماطماية', clue: '🍅🍅', kind: 'dish', round: 1 });
  check(s.pub.e === '🍅🍅' && s.pub.k === 'dish' && JSON.stringify(s).indexOf('طماطم') === -1, 'solve/emoji: the clue and its kind are public, the answer is not');
  applyRoomAction(r, e1, 'guess', { text: 'طمطم', round: 1 });
  applyRoomAction(r, e1, 'guess', { text: 'طماطم', round: 1 });
  check(r.secrets[e1].board.g[0].v === 'close' && s.progress[e1].state === 'won', 'solve/emoji: a guess is judged the way the table hears it (close, then طماطم for طماطماية)');
  for (const g of ['بطاطس', 'خيار', 'جزر', 'فلفل', 'بصل', 'ثوم']) applyRoomAction(r, e2, 'guess', { text: g, round: 1 });
  check(s.phase === 'result' && s.result.setterPts === 5 && s.result.reveal.a === 'طماطماية', 'solve/emoji: six tries, then the setter takes 5');
  r = sv('emoji', ['a', 'b'], { way: 'race', rounds: 3, lang: 'ar' });
  check(r.shared.solve === 'emoji' && r.shared.phase === 'solving' && !!r.shared.pub.c && !!r.shared.pub.e && !r.shared.setter,
    'solve/emoji: the race deals the app\'s riddles with their kind');
  applyRoomAction(r, 'a', 'guess', { text: r._solve.secret.a, round: 1 });
  check(r.shared.progress.a.state === 'won', 'solve/emoji: the answer as the bank writes it solves it');
  r = sv('emoji', ['a', 'b'], { way: 'quiz', count: 5, lang: 'ar' });
  check(!r.shared.solve && r.shared.phase === 'answering' && r._deck.length === 5, 'solve/emoji: the quiz way is the old quiz, unchanged');
  r = sv('emoji', ['a', 'b'], { lang: 'ar', count: 5 });
  check(!r.shared.solve && r.shared.phase === 'answering', 'solve/emoji: a phone too old to say the way still starts the quiz');
}

/* --- ميني جولف: the course, the physics, the two ways a room plays ------------ */
{
  const src = (f) => readFileSync(new URL('../../' + f, import.meta.url), 'utf8');
  const MG = new Function(src('MiniGolf.js') +
    '\nreturn { GOLF, GOLF_HOLES, GOLF_HOLE_COUNTS, GOLF_LEVELS, golfHoleById, golfLevelIds, golfCourseSplit, golfDealCourse, golfStart, golfStep, golfRun, golfPutt, golfField, golfDistance, golfAutoShot, golfClearLine, golfSpeedFor, golfMillShut, golfSliderSeg, golfSpinnerSeg, golfSinCos, golfParOf, golfMaxOf, golfWetSpot };')();
  const H = (id) => MG.GOLF_HOLES.find((h) => h.id === id);
  const HID = (id) => MG.golfHoleById(id);
  const moving = (h) => !!((h.mills || []).length || (h.sliders || []).length || (h.spinners || []).length);

  // A way into the cup: a beam search, each putt aimed at the cup or at the
  // squares in sight that are farthest along (golfField), a few strengths
  // round what the ground asks for there (golfSpeedFor: ice, sand, mud,
  // pads), and for a hole with moving pieces a few moments to hit it. Every
  // place a ball came to rest on the way is kept, to check that none is a trap.
  const solveHole = (h, maxStrokes) => {
    const f = MG.golfField(h);
    const t0s = moving(h) ? [0, 400, 800, 1200, 1700, 2300] : [0];
    const cells = [];
    for (let j = 0; j < f.rows; j++) for (let i = 0; i < f.cols; i++) {
      const k = j * f.cols + i;
      if (f.open[k] && f.dist[k] !== Infinity) cells.push([f.dist[k], f.x0 + (i + 0.5) * 0.5, f.y0 + (j + 0.5) * 0.5]);
    }
    cells.sort((a, b) => a[0] - b[0]);
    let beam = [{ at: h.tee.slice(), strokes: 0, path: [] }];
    const rests = [];
    for (let depth = 0; depth < maxStrokes; depth++) {
      const next = [];
      for (const st of beam) {
        const targets = [h.cup.slice()];
        for (const c of cells) {
          if (targets.length > 10) break;
          if ((c[1] - st.at[0]) ** 2 + (c[2] - st.at[1]) ** 2 > 484) continue;
          if (targets.some((t) => (t[0] - c[1]) ** 2 + (t[1] - c[2]) ** 2 < 4)) continue;
          if (MG.golfClearLine(h, st.at[0], st.at[1], c[1], c[2])) targets.push([c[1], c[2]]);
        }
        for (let a = 0; a < 32; a++) targets.push([st.at[0] + Math.cos(a / 16 * Math.PI) * 5, st.at[1] + Math.sin(a / 16 * Math.PI) * 5, true]);
        for (const tg of targets) {
          const dx = tg[0] - st.at[0], dy = tg[1] - st.at[1], d = Math.hypot(dx, dy) || 1;
          const offs = tg[2] ? [0] : [-0.06, -0.03, 0, 0.03, 0.06];
          const v0 = MG.golfSpeedFor(h, st.at[0], st.at[1], tg[0] + dx / d * 0.3, tg[1] + dy / d * 0.3);
          const pows = tg[2] ? [150, 300, 500, 800] : [0.6, 0.85, 1, 1.15, 1.4, 1.8].map((k) => Math.round(v0 * k / MG.GOLF.MAX_SPEED * 1000));
          for (const off of offs) for (const power of pows) for (const t0 of t0s) {
            const ang = Math.atan2(dy, dx) + off;
            const shot = { dx: Math.round(Math.cos(ang) * 1000), dy: Math.round(Math.sin(ang) * 1000), power: Math.max(20, Math.min(1000, power)), t0 };
            const r = MG.golfPutt(h, st.at, shot);
            const strokes = st.strokes + r.strokes;
            const path = st.path.concat([shot]);
            if (r.end === 'cup') return { ok: strokes <= maxStrokes, strokes, path, rests };
            if (r.end === 'rest') rests.push(r.at);
            next.push({ at: r.at, strokes, path, score: MG.golfDistance(h, r.at[0], r.at[1]) + (r.strokes - 1) * 6 });
          }
        }
      }
      next.sort((a, b) => a.score - b.score);
      beam = [];
      for (const s2 of next) {
        if (beam.length >= 6) break;
        if (s2.strokes >= maxStrokes || beam.some((b) => Math.hypot(b.at[0] - s2.at[0], b.at[1] - s2.at[1]) < 0.8)) continue;
        beam.push(s2);
      }
    }
    return { ok: false, rests };
  };

  {
    const solved = {};
    let allOk = true, trapped = [], names = [];
    for (const h of MG.GOLF_HOLES) {
      const r = solveHole(h, h.par + 1);
      solved[h.id] = r;
      if (!r.ok) { allOk = false; names.push(h.id); }
      r.rests.forEach((p) => { if (MG.golfDistance(h, p[0], p[1]) === Infinity) trapped.push(h.id + '@' + p.join(',')); });
    }
    check(MG.GOLF_HOLES.length === 60 && allOk,
      'minigolf: sixty holes, each one gets into the cup within what it asks for + 1 (' + MG.GOLF_HOLES.map((h) => h.id + ' ' + (solved[h.id].strokes || '✗') + '/' + h.par).join(', ') + ')' + (names.length ? ' - not: ' + names.join(', ') : ''));
    check(!trapped.length, 'minigolf: no ball comes to rest where the cup can\'t be reached from' + (trapped.length ? ' (' + trapped.slice(0, 3).join(' ') + ')' : ''));
    const byLvl = [1, 2, 3].map((l) => MG.GOLF_HOLES.filter((h) => h.lvl === l));
    check(byLvl.every((list) => list.length === 20) && MG.GOLF_HOLES.every((h) => [1, 2, 3].indexOf(h.lvl) !== -1),
      'minigolf: twenty easy, twenty medium and twenty hard holes, every hole of one kind');
    check(byLvl[0].every((h) => h.par >= 2 && h.par <= 3) && byLvl[1].every((h) => h.par === 3) && byLvl[2].every((h) => h.par >= 3 && h.par <= 5),
      'minigolf: an easy hole asks for 2 or 3, a medium one for 3, a hard one for 3 to 5');
    check(['first', 'mill', 'bridge', 'souq', 'humps', 'fair', 'pyramid', 'nile', 'saqia', 'siwa', 'lighthouse', 'citadel', 'gate', 'port', 'temple', 'sinai', 'oasis', 'tower'].every((id) => !!H(id)),
      'minigolf: the eighteen holes of before are all still there');
    check(new Set(MG.GOLF_HOLES.map((h) => h.id)).size === 60 && MG.golfHoleById('nope') === MG.GOLF_HOLES[0], 'minigolf: every hole has its own name, and an unknown one is never a crash');
    // The draw: a game of each length from each kind, holes of that kind only, none twice; mixed a third of each, easiest first.
    let drawOk = true, mixOk = true;
    for (const count of MG.GOLF_HOLE_COUNTS) for (const level of MG.GOLF_LEVELS) for (let k = 0; k < 20; k++) {
      const ids = MG.golfDealCourse(count, level);
      const lv = ids.map((id) => HID(id).lvl);
      if (ids.length !== count || new Set(ids).size !== count) drawOk = false;
      if (level !== 'mix' && !lv.every((l) => l === { easy: 1, medium: 2, hard: 3 }[level])) drawOk = false;
      if (level === 'mix' && (!lv.every((l, i) => !i || l >= lv[i - 1]) || [1, 2, 3].some((l) => lv.filter((x) => x === l).length !== count / 3))) mixOk = false;
    }
    check(drawOk, 'minigolf: a game of 3, 6, 9 or 18 holes is drawn from the kind chosen, no hole twice');
    check(mixOk, 'minigolf: mixed takes a third of each kind and plays them easiest first');
    const orders = new Set();
    for (let k = 0; k < 30; k++) orders.add(MG.golfDealCourse(6, 'hard').join());
    check(orders.size > 20, 'minigolf: the holes and their order are never the same fixed list (' + orders.size + ' different games of 30)');
    const picked = MG.golfDealCourse(9, 'mix', (ids, n, lvl) => ids.slice(ids.length - n));
    check(picked.map((id) => HID(id).lvl).join() === '1,1,1,2,2,2,3,3,3' && picked.slice(0, 3).join() === MG.golfLevelIds(1).slice(-3).join(),
      'minigolf: the draw takes whatever the memory of recent holes picks, kind by kind');
    MG.solved = solved;

    // Every hole fits a phone held upright: taller than it is wide.
    check(MG.GOLF_HOLES.every((h) => {
      const xs = h.green.map((p) => p[0]), ys = h.green.map((p) => p[1]);
      return Math.max(...ys) - Math.min(...ys) > Math.max(...xs) - Math.min(...xs);
    }), 'minigolf: every hole is taller than wide, to fill a phone held upright');
    // Each hole takes only the new pieces that fit it: never more than three; all eight are on the course.
    const kinds = ['ice', 'mud', 'pads', 'belts', 'portals', 'bumpers', 'ramps', 'gates'];
    const used = new Set();
    MG.GOLF_HOLES.forEach((h) => kinds.forEach((k) => { if ((h[k] || []).length) used.add(k); }));
    check(used.size === 8 && MG.GOLF_HOLES.every((h) => kinds.filter((k) => (h[k] || []).length).length <= 3),
      'minigolf: all eight new pieces are on the course, and no hole has more than three of them');

    // At most par + 3 strokes (or a hole's own), then the ball is picked up.
    check(MG.golfMaxOf({ par: 2 }) === 5 && MG.golfMaxOf({ par: 3 }) === 6 && MG.golfMaxOf({ par: 4 }) === 7 && MG.golfMaxOf({ par: 5 }) === 8 && MG.golfMaxOf({ par: 3, max: 9 }) === 9,
      'minigolf: the most strokes a hole allows is par + 3 (par 2: 5, 3: 6, 4: 7, 5: 8), or the hole\'s own max');

    // The same putt ends the same way, every time: 300 of them, twice, on every hole -
    // and 300 more with other balls lying about.
    let same = true, sameMany = true;
    const rnd = (k) => ((k * 2654435761) % 1000) / 1000;
    for (let k = 0; k < 300; k++) {
      const h = MG.GOLF_HOLES[k % MG.GOLF_HOLES.length];
      const shot = { dx: Math.round(rnd(k) * 2000 - 1000), dy: Math.round(rnd(k + 7) * 2000 - 1000), power: 20 + Math.round(rnd(k + 13) * 980), t0: Math.round(rnd(k + 29) * 60000) };
      const a = MG.golfPutt(h, h.tee, shot), b = MG.golfPutt(h, h.tee, shot);
      if (JSON.stringify(a) !== JSON.stringify(b)) same = false;
      const others = [0, 1, 2].map((i) => ({ id: 'o' + i, at: [h.tee[0] + (rnd(k + i * 3) - 0.5) * 3, h.tee[1] + 1 + rnd(k + i * 5) * 5] }));
      const c = MG.golfPutt(h, h.tee, shot, others), d = MG.golfPutt(h, h.tee, shot, others);
      if (JSON.stringify(c) !== JSON.stringify(d)) sameMany = false;
    }
    check(same, 'minigolf: a putt is the same numbers in and the same result out, every time (300 putts, run twice)');
    check(sameMany, 'minigolf: and with other balls to knock about, every ball ends the same way too (300 putts, run twice)');
    check(Math.abs(MG.golfSinCos(1.2)[0] - Math.sin(1.2)) < 1e-7 && Math.abs(MG.golfSinCos(-4)[1] - Math.cos(-4)) < 1e-7 && Math.abs(MG.golfSinCos(10)[0] - Math.sin(10)) < 1e-7,
      'minigolf: the spinner\'s sin and cos come from a polynomial, as close as Math.sin');
    // A roll on a phone is the server's roll: golfStep by golfStep from the same start ends where golfPutt says, other balls and all.
    {
      const h = H('fair');
      const others = [{ id: 'x', at: [6, 6] }, { id: 'y', at: [5, 8] }];
      const shot = { dx: 0, dy: 1000, power: 520, t0: 900 };
      const sim = MG.golfStart(h, h.tee, shot, others);
      while (!sim.done) MG.golfStep(sim);
      const r = MG.golfPutt(h, h.tee, shot, others);
      const at = (b) => [Math.round(b.x * 1000) / 1000, Math.round(b.y * 1000) / 1000].join();
      const ok = (r.end !== 'rest' || at(sim) === r.at.join()) && r.moved.every((m) => { const o = sim.others.find((q) => q.id === m.id); return o.end === m.end && (m.end !== 'rest' || at(o) === m.at.join()); });
      check(ok && r.moved.length > 0, 'minigolf: a putt stepped on a phone ends where the server\'s golfPutt says, every ball it knocked included');
    }

    // Water: back where it was hit from, a stroke added.
    const br = H('bridge');
    const wet = MG.golfPutt(br, br.tee, { dx: 0, dy: 1000, power: 420, t0: 0 });
    check(wet.end === 'water' && wet.at[0] === br.tee[0] && wet.at[1] === br.tee[1] && wet.strokes === 2,
      'minigolf: into the water, the ball goes back to where it was hit from and it costs a stroke more');
    // The ground: the same putt down a plain lane, through sand, mud and ice.
    const lane = (id, extra) => Object.assign({ id, par: 3, tee: [2, 1], cup: [2, 39], green: [[0, 0], [4, 0], [4, 40], [0, 40]] }, extra || {});
    const up = (power) => ({ dx: 0, dy: 1000, power, t0: 0 });
    const band = [[[0, 4], [4, 4], [4, 8], [0, 8]]];
    const far = MG.golfPutt(lane('plain-test'), [2, 1], up(400)), short = MG.golfPutt(lane('sandy-test', { sand: band }), [2, 1], up(400));
    check(far.end === 'rest' && short.end === 'rest' && short.at[1] < far.at[1] - 5, 'minigolf: sand slows the ball hard');
    const muddy = MG.golfPutt(lane('mud-test', { mud: band }), [2, 1], up(400));
    check(muddy.end === 'rest' && muddy.at[1] < short.at[1] - 0.5, 'minigolf: mud stops the ball sooner than sand (' + muddy.at[1] + ' against ' + short.at[1] + ')');
    const plain3 = MG.golfPutt(lane('plain-test'), [2, 1], up(300)), icy = MG.golfPutt(lane('ice-test', { ice: [[[0, 4], [4, 4], [4, 12], [0, 12]]] }), [2, 1], up(300));
    check(icy.end === 'rest' && icy.at[1] > plain3.at[1] + 4, 'minigolf: on ice the ball slides much farther than on the green (' + icy.at[1] + ' against ' + plain3.at[1] + ')');
    // A speed pad pushes the ball on the way it points.
    const padded = MG.golfPutt(lane('pad-test', { pads: [{ x: 2, y: 5, dx: 0, dy: 1, w: 2, l: 2 }] }), [2, 1], up(200)), unpadded = MG.golfPutt(lane('plain-test'), [2, 1], up(200));
    check(padded.at[1] > unpadded.at[1] + 10, 'minigolf: a speed pad sends the ball on much faster (' + padded.at[1] + ' against ' + unpadded.at[1] + ')');
    // A conveyor carries the ball along; one running the other way brings it back.
    const onBelt = MG.golfPutt(lane('belt-test', { belts: [{ x0: 0, y0: 4, x1: 4, y1: 10, vx: 0, vy: 3 }] }), [2, 1], up(230)), offBelt = MG.golfPutt(lane('plain-test'), [2, 1], up(230));
    check(offBelt.at[1] < 10 && onBelt.at[1] > 10, 'minigolf: a conveyor carries the ball to its far end (' + onBelt.at[1] + ', ' + offBelt.at[1] + ' without it)');
    const back = MG.golfPutt(lane('belt-back-test', { belts: [{ x0: 0, y0: 4, x1: 4, y1: 10, vx: 0, vy: -3 }] }), [2, 1], up(300));
    check(back.at[1] < 4.2, 'minigolf: a conveyor running the other way brings the ball back off it');
    // A portal: in at one ring, out of the other at the same speed, its own way.
    {
      const h = lane('portal-test', { portals: [{ x: 2, y: 5, ox: 2, oy: 25, dx: 0, dy: 1 }] });
      const sim = MG.golfStart(h, h.tee, up(200));
      let vin = 0, vout = 0, at = null;
      while (!sim.done) { const w = sim.warps, v = Math.hypot(sim.vx, sim.vy); MG.golfStep(sim); if (sim.warps > w) { vin = v; vout = Math.hypot(sim.vx, sim.vy); at = [sim.x, sim.y]; } }
      check(at && Math.abs(at[1] - 25.3) < 0.01 && Math.abs(vout - vin) < 0.1 && sim.y > 25, 'minigolf: a portal takes the ball in at one ring and out of the other at the same speed (' + vin.toFixed(2) + ' → ' + vout.toFixed(2) + ')');
    }
    // A bumper sends the ball back faster than it came.
    {
      const h = lane('bumper-test', { bumpers: [{ x: 2, y: 6, r: 0.5 }] });
      const sim = MG.golfStart(h, h.tee, up(300));
      let vin = 0, vout = 0;
      while (!sim.done) { const n = sim.bumps, v = Math.hypot(sim.vx, sim.vy); MG.golfStep(sim); if (sim.bumps > n && !vin) { vin = v; vout = Math.hypot(sim.vx, sim.vy); } }
      check(vin > 0 && vout > vin * 1.2, 'minigolf: a bumper sends the ball back harder than it came (' + vin.toFixed(2) + ' → ' + vout.toFixed(2) + ')');
    }
    // A ramp: fast enough and the ball flies over the water; too slow and it rolls back down.
    {
      const h = lane('ramp-test', { green: [[0, 0], [4, 0], [4, 30], [0, 30]], cup: [2, 28], ramps: [{ x: 2, y: 4, dx: 0, dy: 1, len: 2.6, w: 2.2 }], water: [[[0, 6.6], [4, 6.6], [4, 10], [0, 10]]] });
      const fly = MG.golfStart(h, h.tee, up(520));
      let top = 0;
      while (!fly.done) { MG.golfStep(fly); top = Math.max(top, fly.z); }
      const slow = MG.golfPutt(h, h.tee, up(250));
      check(fly.end === 'rest' && fly.y > 10 && fly.jumps === 1 && top > MG.GOLF.RAMP_H, 'minigolf: off a ramp fast enough, the ball flies over the water and lands beyond it');
      check(slow.end === 'rest' && slow.at[1] < 4, 'minigolf: too slow for the ramp, the ball rolls back down it');
    }
    // A one-way gate: through the way it opens, a rail the other way.
    {
      const h = lane('gate-test', { gates: [{ x1: 0, y1: 8, x2: 4, y2: 8, dx: 0, dy: 1 }] });
      const through = MG.golfPutt(h, [2, 1], up(400));
      const blocked = MG.golfPutt(h, [2, 20], { dx: 0, dy: -1000, power: 500, t0: 0 });
      check(through.at[1] > 8.5 && blocked.at[1] > 8.3, 'minigolf: a one-way gate lets the ball through one way and stops it the other (' + through.at[1] + ', ' + blocked.at[1] + ')');
      const below = Object.assign({}, h, { id: 'gate-below-test', cup: [2, 3] });
      check(MG.golfDistance(below, 2, 12) === Infinity && MG.golfDistance(h, 2, 3) < Infinity && MG.golfDistance(H('citadel'), 1.7, 19) < Infinity,
        'minigolf: the way to the cup goes through a gate only the way it opens');
    }
    // Ball on ball: equal balls, the knock passed on.
    {
      const plain = lane('plain-test');
      const r = MG.golfPutt(plain, [2, 1], up(300), [{ id: 'x', at: [2, 6] }]);
      const alone = MG.golfPutt(plain, [2, 1], up(300));
      check(r.at[1] < 6 && r.moved.length === 1 && r.moved[0].id === 'x' && r.moved[0].end === 'rest' && r.moved[0].at[1] > 6 + 2 && alone.at[1] > r.at[1] + 3,
        'minigolf: a ball hits a ball lying in its way, and that one rolls on (' + r.at[1] + ' / ' + r.moved[0].at[1] + ')');
      const missed = MG.golfPutt(plain, [2, 1], up(300), [{ id: 'x', at: [3.5, 6] }]);
      check(!missed.moved.length && missed.at.join() === alone.at.join(), 'minigolf: a ball it passes by isn\'t touched, and isn\'t in the result');
      // Knocked into the cup: holed.
      const cupLane = lane('cup-test', { cup: [2, 9] });
      let into = null;
      for (let p = 200; p <= 420 && !into; p += 5) { const q = MG.golfPutt(cupLane, [2, 1], up(p), [{ id: 'x', at: [2, 7] }]); if (q.moved.length && q.moved[0].end === 'cup') into = q; }
      check(!!into && into.moved[0].at.join() === '2,9', 'minigolf: a ball knocked into the cup drops in');
      // Knocked into the water: back to its own spot - or, when the ball that knocked it lies there, the tee.
      const pond = lane('wet-test', { tee: [2, 0.6], water: [[[0, 12], [4, 12], [4, 14], [0, 14]]] });
      // Head on, the ball that hit it stops about where it lay: that spot is taken, so the tee.
      const headOn = MG.golfPutt(pond, [2, 1], up(500), [{ id: 'x', at: [2, 6] }]);
      check(headOn.moved.length === 1 && headOn.moved[0].end === 'water' && headOn.moved[0].at.join() === pond.tee.join() && headOn.end === 'rest',
        'minigolf: a ball knocked into the water whose spot the other ball now lies on goes back to the tee');
      // A glancing knock sends the two apart: the wet one goes back to its own spot.
      let own = null;
      for (let off = 0.1; off <= 0.35 && !own; off += 0.05) for (let p = 300; p <= 900 && !own; p += 20) {
        const q = MG.golfPutt(pond, [2, 1], up(p), [{ id: 'x', at: [2 + off, 6] }]);
        const m = q.moved[0];
        if (m && m.end === 'water' && m.at.join() === [2 + off, 6].join()) own = q;
      }
      check(!!own && own.end === 'rest', 'minigolf: a ball knocked into the water goes back to its own spot');
      check(MG.golfWetSpot(pond, [2, 6], [[2.1, 6.2]]).join() === '2,0.6' && MG.golfWetSpot(pond, [2, 6], [[2.6, 6]]).join() === '2,6',
        'minigolf: a spot another ball lies on is taken, and a wet ball goes to the tee instead');
      // Into the water, back where it lay; with another ball lying there now (one it
      // sat against at the start, which it never touched), back to the tee.
      const spot = [2, 5];
      const clear = MG.golfPutt(pond, spot, up(800), []);
      const taken = MG.golfPutt(pond, spot, up(800), [{ id: 'x', at: [2.2, 5.1] }]);
      check(clear.end === 'water' && clear.at.join() === spot.join() && clear.strokes === 2, 'minigolf: a ball in the water goes back where it lay, a stroke added');
      check(taken.end === 'water' && taken.at.join() === pond.tee.join() && !taken.moved.length, 'minigolf: and when another ball lies on that spot, back to the tee');
    }
    // The sand, the humps, the windmill, the gate and the waterwheel, as before.
    const hu = H('humps');
    const backDown = MG.golfPutt(hu, hu.tee, { dx: 0, dy: 1000, power: 260, t0: 0 });
    check(backDown.end === 'rest' && backDown.at[1] < 6.5, 'minigolf: a putt too soft for the hump rolls back down it');
    const over = MG.golfPutt(hu, hu.tee, { dx: 0, dy: 1000, power: 520, t0: 0 });
    check(over.at[1] > 16.5 || over.end === 'cup', 'minigolf: a firm one gets over both humps');
    const mi = H('mill');
    const ends = new Set();
    for (let t0 = 0; t0 < 2600; t0 += 50) {
      const r = MG.golfPutt(mi, mi.tee, { dx: 0, dy: 1000, power: 360, t0 });
      ends.add(r.at[1] < 9 ? 'stopped' : 'through');
    }
    check(ends.has('stopped') && ends.has('through'), 'minigolf: the windmill\'s sails let a putt through or stop it, by when it is hit');
    const gatePaths = new Set(), wheelPaths = new Set();
    for (let t0 = 0; t0 < 6000; t0 += 150) {
      gatePaths.add(MG.golfPutt(H('gate'), H('gate').tee, { dx: 160, dy: 987, power: 420, t0 }).at[1] > 12.5 ? 'through' : 'stopped');
      wheelPaths.add(MG.golfPutt(H('saqia'), H('saqia').tee, { dx: 0, dy: 1000, power: 420, t0 }).at[1] > 14.5 ? 'through' : 'stopped');
    }
    check(gatePaths.size === 2 && wheelPaths.size === 2, 'minigolf: the sliding gate and the waterwheel\'s beam change a putt by when it is hit');
    // The phone's gentle putt for a quiet player: never into the water, it takes
    // the ball closer (past a moving piece, at a moment it is open), and putt
    // after putt it holes out on every hole, new pieces and all.
    let gentle = true;
    const stuck = [];
    for (const h of MG.GOLF_HOLES) {
      let closer = false;
      for (let t0 = 0; t0 < 3000; t0 += 250) {
        const s0 = MG.golfAutoShot(h, h.tee, t0);
        const r = MG.golfPutt(h, h.tee, s0);
        if (!(s0.power >= 40 && s0.power <= 700) || r.end === 'water') gentle = false;
        if (r.end === 'cup' || MG.golfDistance(h, r.at[0], r.at[1]) < MG.golfDistance(h, h.tee[0], h.tee[1]) - 1) closer = true;
      }
      if (!closer) gentle = false;
      let at = h.tee.slice(), holed = false;
      for (let k = 0; k < 12 && !holed; k++) {
        const r = MG.golfPutt(h, at, MG.golfAutoShot(h, at, k * 700));
        holed = r.end === 'cup';
        at = r.at;
      }
      if (!holed) stuck.push(h.id);
    }
    check(gentle, 'minigolf: the clock\'s gentle putt never goes in the water, and takes the ball closer to the cup');
    check(!stuck.length, 'minigolf: the gentle putt, again and again, gets into the cup on every hole' + (stuck.length ? ' - not: ' + stuck.join(', ') : ''));
  }

  const mg = (ids, payload) => {
    const r = newRoom(ids);
    applyRoomAction(r, ids[0], 'chooseGame', { game: 'minigolf' });
    applyRoomAction(r, ids[0], 'start', payload || {});
    return r;
  };
  const refused = (fn) => { try { fn(); return false; } catch (e) { return true; } };
  const tiny = (r, pid) => applyRoomAction(r, pid, 'putt', { dx: 0, dy: 1000, power: 20, t0: clock - r.shared.startedAt, hole: r.shared.hole, n: r.shared.balls[pid].n });
  /** Replays a solved way into the cup for `pid`, each putt hit at its own moment. */
  const holeOut = (r, pid, path) => {
    for (const shot of path) {
      clock = r.shared.startedAt + shot.t0;
      applyRoomAction(r, pid, 'putt', Object.assign({}, shot, { hole: r.shared.hole, n: r.shared.balls[pid].n }));
      clock += 100;
    }
  };

  let r = mg(['a', 'b']);
  let s = r.shared;
  check(s.phase === 'play' && s.settings.mode === 'together' && s.settings.holes === 6 && s.settings.level === 'mix' && s.settings.guide === false && s.settings.clock === 0 &&
    s.order.length === 2 && s.balls.a.at.join() === HID(s.holes[0]).tee.join() && !s.turn,
    'minigolf: all at once, 6 holes, mixed, no aim guide and no clock by default; every ball on the first hole\'s tee');
  check(Array.isArray(s.holes) && s.holes.length === 6 && new Set(s.holes).size === 6 && s.holes.map((id) => HID(id).lvl).join() === '1,1,2,2,3,3',
    'minigolf: a room\'s holes are drawn on the server and kept in the room: two easy, two medium, two hard');
  check(roomDeadline(r) === null, 'minigolf: with no clock nothing waits on the server');
  // Pinned to the straight first hole: the easy hole drawn is random, and on 'football' the strong
  // putt below goes straight in, so the ball was done before the t0 and pick-up checks (about one
  // run in eight failed four checks at once). 'first' is an easy hole, so the draw above still holds.
  s.holes[0] = 'first';
  Object.keys(s.balls).forEach((id) => { s.balls[id].at = HID('first').tee.slice(); });
  // All at once: both putt, in any order.
  clock += 1000;
  applyRoomAction(r, 'b', 'putt', { dx: 0, dy: 1000, power: 300, t0: clock - s.startedAt, hole: 0, n: 0 });
  applyRoomAction(r, 'a', 'putt', { dx: 0, dy: 1000, power: 300, t0: clock - s.startedAt, hole: 0, n: 0 });
  check(s.balls.a.n === 1 && s.balls.b.n === 1 && s.shots.a.seq === 2 && s.shots.b.seq === 1 && s.shots.a.from.join() === HID(s.holes[0]).tee.join(),
    'minigolf: all at once, each player putts from their own phone whenever ready, and the putt is on the table to replay');
  check(s.shots.a.at.join() === s.shots.b.at.join() && !s.shots.a.others && !s.shots.a.moved,
    'minigolf: all at once, the balls pass through each other: the same putt from the same tee ends in the same place');
  // A tap for a stroke already played, or for another hole, is dropped.
  applyRoomAction(r, 'a', 'putt', { dx: 0, dy: 1000, power: 300, t0: 0, hole: 0, n: 0 });
  applyRoomAction(r, 'a', 'putt', { dx: 0, dy: 1000, power: 300, t0: 0, hole: 1, n: 1 });
  check(s.balls.a.n === 1, 'minigolf: a stale putt (the stroke or the hole it was for is gone) is dropped');
  // The putter's clock is trusted within a second and a half of the server's.
  clock = s.startedAt + 5000;
  applyRoomAction(r, 'a', 'putt', { dx: 0, dy: 1000, power: 60, t0: 4000, hole: 0, n: 1 });
  const okT0 = s.shots.a.t0;
  applyRoomAction(r, 'b', 'putt', { dx: 0, dy: 1000, power: 60, t0: 1000, hole: 0, n: 1 });
  check(okT0 === 4000 && s.shots.b.t0 === 5000, 'minigolf: the phone\'s t0 is used when within 1.5 s of the server\'s, else the server\'s own');
  // What the hole asks for + 3 strokes: then the ball is picked up and the hole counts one more.
  const max0 = MG.golfMaxOf(HID(s.holes[0]));
  for (let k = 0; k < 9 && !s.balls.a.done; k++) tiny(r, 'a');
  check(s.balls.a.done === 'picked' && s.balls.a.n === max0 + 1 && s.card.a[0] === max0 + 1, 'minigolf: the hole allows what it asks for + 3 strokes; then the ball is picked up and the hole counts one more (' + (max0 + 1) + ')');
  check(s.phase === 'play', 'minigolf: the hole goes on while a ball is still out');
  for (let k = 0; k < 9 && !s.balls.b.done; k++) tiny(r, 'b');
  check(s.phase === 'between' && s.nextAt > clock && roomDeadline(r) === s.nextAt,
    'minigolf: once every ball is in or picked up, the hole\'s card shows, and the next hole comes on the server\'s clock');
  clock = s.nextAt + 10;
  roomTimeout(r, clock);
  check(s.phase === 'play' && s.hole === 1 && s.balls.a.n === 0 && s.balls.a.at.join() === HID(s.holes[1]).tee.join(), 'minigolf: the next hole, every ball on its tee');
  // A hole in: the cup, and the card.
  const second1 = MG.solved[s.holes[1]];
  holeOut(r, 'a', second1.path);
  check(s.balls.a.done === 'cup' && s.card.a[1] === second1.strokes, 'minigolf: a ball in the cup is done, and its strokes go on the card');
  check(s.board.find((x) => x.id === 'a').score === max0 + 1 + second1.strokes && s.board[0].score <= s.board[1].score,
    'minigolf: the board is the totals of the holes played, lowest first');
  // The next hole's own most strokes.
  for (let k = 0; k < 9 && !s.balls.b.done; k++) tiny(r, 'b');
  check(s.balls.b.done === 'picked' && s.card.b[1] === MG.golfMaxOf(HID(s.holes[1])) + 1, 'minigolf: each hole picks up at its own most strokes');

  // In turns: one putt at a time round the table; the honour on the next hole.
  r = mg(['a', 'b', 'c'], { mode: 'turns', holes: 3, clock: 20, guide: true });
  s = r.shared;
  // Pinned to the straight first hole, as the knock tests below are: the easy hole drawn is random,
  // and on 'football' the host's "play for" knocked the other ball into the cup, so the turn could
  // not come back to it (a run failed about one time in twenty).
  s.holes[0] = 'first';
  Object.keys(s.balls).forEach((id) => { s.balls[id].at = H('first').tee.slice(); });
  const first = s.turn, second = s.order[1];
  check(s.settings.mode === 'turns' && s.settings.guide === true && s.holes.length === 3 && first === s.order[0], 'minigolf: in turns, the first in the order putts first');
  check(refused(() => applyRoomAction(r, second, 'putt', { dx: 0, dy: 1000, power: 300, t0: clock - s.startedAt, hole: 0, n: 0 })), 'minigolf: in turns, a putt out of turn is refused');
  check(roomDeadline(r) === s.startedAt + 2500 + 20000 && s.balls[second].clockAt === null, 'minigolf: in turns, only the player up has the clock running');
  tiny(r, first);
  check(s.turn === second && s.balls[second].clockAt > clock, 'minigolf: after a putt the turn goes round the table, and the clock starts for the next');
  check(Array.isArray(s.shots[first].others) && s.shots[first].others.length === 0,
    'minigolf: in turns, the balls still on the tee aren\'t on the course yet: the first putt has nothing to hit');
  clock = s.balls[second].clockAt + 10;
  roomTimeout(r, clock);
  check(s.shots[second] && s.shots[second].auto === true && s.balls[second].n === 1 && s.turn === s.order[2],
    'minigolf: when the clock runs out, the phone putts gently for the player, and the turn moves on');
  check(s.shots[second].others.map((o) => o.id).join() === first, 'minigolf: in turns, a ball hit from the tee is on the course, for the next putts to meet');
  // The one up leaves: the turn moves on; the rest play on.
  const third = s.turn;
  r.players = r.players.filter((x) => x.id !== third);
  roomPlayerLeft(r, third, 'C');
  check(s.order.indexOf(third) === -1 && !s.balls[third] && s.turn === first, 'minigolf: a player who leaves takes their ball; the turn moves on');
  // The host plays for a quiet phone.
  applyRoomAction(r, 'a', 'playFor', { target: s.turn, hole: 0, n: s.balls[s.turn].n });
  check(s.shots[first].auto === true && s.turn === second, 'minigolf: the host\'s "play for" is the phone\'s gentle putt');
  check(refused(() => applyRoomAction(r, 'b', 'playFor', { target: 'b', hole: 0 })), 'minigolf: only the host plays for someone');
  // Finish hole 1, a putt a turn: `second` holes out on a way solved from
  // where the clock's putt left it (with the other ball where it lies), `first` picks up.
  const from1 = Object.assign({}, HID(s.holes[0]), { tee: s.balls[second].at.slice(), id: 'first-from' });
  const queue = solveHole(from1, 5).path.slice();
  for (let guard = 0; guard < 30 && s.phase === 'play'; guard++) {
    const upNow = s.turn;
    if (upNow === second && queue.length) {
      const shot = queue.shift();
      applyRoomAction(r, second, 'putt', Object.assign({}, shot, { t0: clock - s.startedAt, hole: 0, n: s.balls[second].n }));
      continue;
    }
    tiny(r, upNow);
  }
  check(s.phase === 'between' && s.balls[first].done === 'picked', 'minigolf: in turns the hole ends once every ball is done');
  check(refused(() => applyRoomAction(r, 'b', 'nextHole', { hole: 0 })) && s.phase === 'between', 'minigolf: only the host moves to the next hole early');
  applyRoomAction(r, 'a', 'nextHole', { hole: 0 });
  check(s.hole === 1 && s.order[0] === s.turn && s.card[s.order[0]][0] <= s.card[s.order[1]][0], 'minigolf: the next hole, the best score on the last one tees off first');

  // Ball on ball in a room played in turns: a knock, a ball knocked into the cup, one knocked into the water.
  {
    r = mg(['a', 'b'], { mode: 'turns', holes: 3 });
    s = r.shared;
    const [p1, p2] = s.order;
    // On the straight first hole: the ids in the room are what is played.
    s.holes[0] = 'first';
    Object.keys(s.balls).forEach((id) => { s.balls[id].at = H('first').tee.slice(); });
    const h0 = H('first');
    // p1's ball lies a little way up; p2 putts from the tee straight into it.
    s.balls[p1].n = 1; s.balls[p1].at = [4, 5];
    s.turn = p2;
    applyRoomAction(r, p2, 'putt', { dx: 0, dy: 1000, power: 300, t0: clock - s.startedAt, hole: 0, n: 0 });
    const sh = s.shots[p2];
    check(sh.others.length === 1 && sh.others[0].id === p1 && sh.others[0].at.join() === '4,5' && sh.moved.length === 1 && sh.moved[0].id === p1 &&
      s.balls[p1].at.join() === sh.moved[0].at.join() && s.balls[p1].at[1] > 5.5 && s.balls[p1].n === 1,
      'minigolf: in turns a putt knocks a ball lying in its way; that ball is where the knock left it, with no stroke added');
    check(sh.at[1] < 5, 'minigolf: and the ball that hit it stops short');
    // A ball near the cup, knocked in: holed with its strokes so far.
    s.balls[p1].at = [4, 15.4]; s.balls[p1].n = 2;
    s.balls[p2].at = [4, 12.6];
    s.turn = p2;
    let knocked = false;
    for (let p = 150; p <= 400 && !knocked; p += 6) {
      const trial = JSON.parse(JSON.stringify(r));
      applyRoomAction(trial, p2, 'putt', { dx: 0, dy: 1000, power: p, t0: clock - trial.shared.startedAt, hole: 0, n: trial.shared.balls[p2].n });
      if (trial.shared.balls[p1].done === 'cup') {
        knocked = true;
        check(trial.shared.card[p1][0] === 2 && trial.shared.balls[p2].n === s.balls[p2].n + 1 && trial.shared.shots[p2].moved[0].end === 'cup',
          'minigolf: a ball knocked into the cup is holed, counted with its own strokes so far');
        check(trial.shared.turn === p2 || trial.shared.balls[p2].done, 'minigolf: and the turn skips it from then on');
      }
    }
    check(knocked, 'minigolf: a putt can knock another ball into the cup');
    void h0;
  }
  {
    // The bridge: a ball on the bank, knocked into the water, comes back to its spot, no stroke added.
    r = mg(['a', 'b'], { mode: 'turns', holes: 3 });
    s = r.shared;
    const [p1, p2] = s.order;
    const bi = 1;
    s.holes[bi] = 'bridge';
    s.hole = bi; s.startedAt = clock;
    const tee = H('bridge').tee;
    Object.keys(s.balls).forEach((id) => { s.balls[id].at = tee.slice(); s.balls[id].n = 0; });
    s.balls[p1].n = 1; s.balls[p1].at = [2, 6.8];
    s.turn = p2;
    let back = null;
    for (let p = 250; p <= 700 && !back; p += 10) {
      const trial = JSON.parse(JSON.stringify(r));
      applyRoomAction(trial, p2, 'putt', { dx: -100, dy: 995, power: p, t0: 0, hole: bi, n: 0 });
      const m = (trial.shared.shots[p2].moved || [])[0];
      if (m && m.end === 'water') back = trial;
    }
    check(!!back && back.shared.balls[p1].n === 1 && !back.shared.balls[p1].done &&
      (back.shared.balls[p1].at.join() === '2,6.8' || back.shared.balls[p1].at.join() === tee.join()),
      'minigolf: a ball knocked into the water goes back to its own spot (or the tee), with no stroke added');
  }

  // The end: the podium is the lowest total, a win counted, play again keeps the settings and the wins.
  r = mg(['a', 'b'], { holes: 3 });
  s = r.shared;
  for (let hole = 0; hole < 3; hole++) {
    holeOut(r, 'a', MG.solved[s.holes[hole]].path);
    for (let k = 0; k < 8 && !s.balls.b.done; k++) tiny(r, 'b');
    if (hole < 2) applyRoomAction(r, 'a', 'nextHole', { hole });
  }
  check(s.phase === 'gameover' && r.phase === 'gameover' && s.result.winners.join() === 'a' && s.wins.a === 1 && s.board[0].id === 'a' &&
    s.board[1].score === s.holes.reduce((t, id) => t + MG.golfMaxOf(HID(id)) + 1, 0) && s.result.par === s.holes.reduce((t, id) => t + HID(id).par, 0),
    'minigolf: after the last hole the lowest total wins, and the win is counted');
  applyRoomAction(r, 'a', 'playAgain', {});
  check(r.shared.phase === 'play' && r.shared.hole === 0 && r.shared.holes.length === 3 && r.shared.settings.level === 'mix' && r.shared.wins.a === 1 &&
    r.shared.holes.every((id) => s.holes.indexOf(id) === -1), 'minigolf: play again keeps the number of holes, the kind and the wins, and deals holes not just played');
  // Eighteen holes: the whole course, every hole's card, the total.
  r = mg(['a', 'b'], { holes: 18 });
  s = r.shared;
  for (let hole = 0; hole < 18 && s.phase !== 'gameover'; hole++) {
    for (const pid of ['a', 'b']) for (let k = 0; k < 9 && !s.balls[pid].done; k++) tiny(r, pid);
    if (s.phase === 'between') applyRoomAction(r, 'a', 'nextHole', { hole });
  }
  const maxAll = s.holes.reduce((t, id) => t + MG.golfMaxOf(HID(id)) + 1, 0);
  check(s.holes.length === 18 && s.phase === 'gameover' && s.card.a.length === 18 && s.card.a.every((v) => typeof v === 'number') && s.board[0].score <= maxAll,
    'minigolf: a game of 18 holes plays all eighteen it drew');
  // Each kind in a room, and the memory of recent holes: two games of 9 hard never share a hole (twenty in the kind).
  {
    // Two games in one room (the server's memory spans rooms; a room's own is what a test without the server has).
    const seen = [];
    const rr = mg(['a', 'b'], { holes: 9, level: 'hard' });
    for (let g = 0; g < 2; g++) {
      if (g) { applyRoomAction(rr, 'a', 'backToHub', {}); applyRoomAction(rr, 'a', 'chooseGame', { game: 'minigolf' }); applyRoomAction(rr, 'a', 'start', { holes: 9, level: 'hard' }); }
      check(rr.shared.holes.every((id) => HID(id).lvl === 3) && rr.shared.settings.level === 'hard', 'minigolf: a room of hard holes deals hard holes only (game ' + (g + 1) + ')');
      seen.push(rr.shared.holes);
    }
    check(seen[0].concat(seen[1]).length === new Set(seen[0].concat(seen[1])).size, 'minigolf: holes played lately don\'t come back until the kind has gone round');
    const re = mg(['a', 'b'], { holes: 3, level: 'easy' });
    check(re.shared.holes.every((id) => HID(id).lvl === 1), 'minigolf: easy deals easy holes');
    const rb = mg(['a', 'b'], { holes: 3, level: 'nonsense' });
    check(rb.shared.settings.level === 'mix', 'minigolf: a kind the server doesn\'t know is mixed');
  }
  // Everyone leaves: the game is over, not stuck.
  r = mg(['a', 'b']);
  r.players = r.players.filter((x) => x.id !== 'b');
  roomPlayerLeft(r, 'b', 'B');
  check(r.shared.phase === 'play' && r.shared.order.join() === 'a', 'minigolf: one left plays on');
  for (let k = 0; k < 6; k++) tiny(r, 'a');
  check(r.shared.phase === 'between', 'minigolf: and finishes the hole on their own');
}

/* --- حرب السفن: the fleets, the shots, the phone's admiral, winner stays on ------- */
{
  const BS = new Function(readFileSync(new URL('../../Battleship.js', import.meta.url), 'utf8') +
    '\nreturn { BS_SHIPS, BS_SEA, BS_MISS, BS_HIT, BS_SUNK, BS_CLEAR, bsFleetProblem, bsCanPlace, bsRandomFleet, bsNewSea, bsFire, bsAiShot, bsAllSunk, bsShipCells, bsCoord, bsOccupancy, bsRandomCell };')();
  const seeded = (seed) => () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
  // A fleet along the top-left, every ship a row apart: it sails.
  const rows = () => [{ x: 0, y: 0, d: 'h' }, { x: 0, y: 2, d: 'h' }, { x: 0, y: 4, d: 'h' }, { x: 0, y: 6, d: 'h' }, { x: 0, y: 8, d: 'h' }];
  check(BS.BS_SHIPS.map((s) => s.len).join(',') === '5,4,3,3,2', 'battleship: five ships, 5, 4, 3, 3 and 2');
  check(BS.bsFleetProblem(rows()) === null, 'battleship: a fleet a row apart sails');
  const touching = rows(); touching[1] = { x: 0, y: 1, d: 'h' };
  check(BS.bsFleetProblem(touching) === 'touch', 'battleship: two ships side by side are refused');
  const diag = rows(); diag[3] = { x: 5, y: 6, d: 'h' }; diag[4] = { x: 8, y: 7, d: 'h' };  // (7, 6) and (8, 7) meet at a corner
  check(BS.bsFleetProblem(diag) === 'touch', 'battleship: ships meeting only at a corner are refused too');
  const over = rows(); over[1] = { x: 2, y: 0, d: 'v' };
  check(BS.bsFleetProblem(over) === 'overlap', 'battleship: two ships on one square are refused');
  const out = rows(); out[0] = { x: 7, y: 0, d: 'h' };
  check(BS.bsFleetProblem(out) === 'out' && BS.bsFleetProblem([]) === 'shape' && BS.bsFleetProblem(rows().map((p) => ({ x: p.x + 0.5, y: p.y, d: p.d }))) === 'shape',
    'battleship: off the board, or not five whole placements, is refused');
  check(!BS.bsCanPlace(rows(), 4, { x: 3, y: 7, d: 'v' }) && BS.bsCanPlace(rows(), 4, { x: 9, y: 9, d: 'h' }) === false && BS.bsCanPlace(rows(), 4, { x: 8, y: 9, d: 'h' }) && BS.bsCanPlace(rows(), 4, { x: 8, y: 1, d: 'v' }),
    'battleship: a ship moved on the board fits only where it touches nothing');
  let random = true;
  for (let k = 0; k < 300; k++) if (BS.bsFleetProblem(BS.bsRandomFleet(Math.random, k % 3 ? 'easy' : 'hard'))) random = false;
  check(random, 'battleship: a random fleet (the 🎲, the server\'s, the phone\'s hard one) always sails');
  check(BS.bsCoord(0) === 'A1' && BS.bsCoord(17) === 'H2' && BS.bsCoord(99) === 'J10', 'battleship: a square is named by its column letter and its row number');

  // Shots at a sea: a miss, a hit, a sunk ship with the water round it marked.
  const sea = BS.bsNewSea();
  const fleet = rows();
  const m = BS.bsFire(sea, fleet, 82);
  check(m.res === 'miss' && sea.grid[82] === BS.BS_MISS && BS.bsFire(sea, fleet, 82) === null && BS.bsFire(sea, fleet, 100) === null,
    'battleship: a miss is marked, and a square already fired at (or off the board) can\'t be fired at again');
  const h1 = BS.bsFire(sea, fleet, 80);
  check(h1.res === 'hit' && sea.grid[80] === BS.BS_HIT && sea.sunk.length === 0, 'battleship: a hit is marked and the ship is still afloat');
  const h2 = BS.bsFire(sea, fleet, 81);
  check(h2.res === 'sunk' && h2.ship === 4 && JSON.stringify(h2.cells) === '[80,81]' && sea.grid[80] === BS.BS_SUNK &&
    JSON.stringify(sea.sunk) === JSON.stringify([{ i: 4, x: 0, y: 8, d: 'h' }]),
    'battleship: the last square of a ship sinks it, and which ship it was is known');
  check(JSON.stringify(h2.water.slice().sort((a, b) => a - b)) === '[70,71,72,90,91,92]' && [70, 71, 72, 90, 91, 92].every((c) => sea.grid[c] === BS.BS_CLEAR) && sea.grid[82] === BS.BS_MISS,
    'battleship: the water round a sunk ship is marked (a square already missed stays a miss)');
  [0, 1, 2, 3, 4, 20, 21, 22, 23, 40, 41, 42, 60, 61].forEach((c) => BS.bsFire(sea, fleet, c));
  const last = BS.bsFire(sea, fleet, 62);
  check(last.res === 'sunk' && last.over && BS.bsAllSunk(sea), 'battleship: the last ship down ends it');

  // The admiral: always a legal square, always finishes, hard beats easy.
  let legal = true, finished = true;
  const fleetShots = (level, rnd) => {
    const s2 = BS.bsNewSea();
    const f = BS.bsRandomFleet(rnd);
    let n = 0;
    while (!BS.bsAllSunk(s2) && n < 100) {
      const c = BS.bsAiShot(s2, level, rnd);
      if (!BS.bsFire(s2, f, c)) { legal = false; break; }
      n++;
    }
    if (!BS.bsAllSunk(s2)) finished = false;
    return n;
  };
  const avg = {};
  ['easy', 'medium', 'hard'].forEach((lv, k) => {
    const rnd = seeded(97 + k);
    let t = 0;
    for (let g = 0; g < 60; g++) t += fleetShots(lv, rnd);
    avg[lv] = t / 60;
  });
  check(legal && finished, 'battleship: the phone\'s shot is always a square not fired at, and it always sinks the fleet (easy, medium, hard)');
  check(avg.hard < avg.medium && avg.medium < avg.easy && avg.hard < 50,
    `battleship: hard needs fewer shots than medium, medium than easy (${avg.hard.toFixed(1)} / ${avg.medium.toFixed(1)} / ${avg.easy.toFixed(1)})`);
  // Head to head, a hit shooting again: hard against easy.
  const duel = (a, b, rnd) => {
    const seas = [BS.bsNewSea(), BS.bsNewSea()], fl = [BS.bsRandomFleet(rnd, a), BS.bsRandomFleet(rnd, b)], lv = [a, b];
    let turn = rnd() < 0.5 ? 0 : 1;
    for (let k = 0; k < 400; k++) {
      const res = BS.bsFire(seas[1 - turn], fl[1 - turn], BS.bsAiShot(seas[1 - turn], lv[turn], rnd));
      if (res.over) return turn;
      if (res.res === 'miss') turn = 1 - turn;
    }
    return -1;
  };
  const rnd = seeded(4242);
  let hardWins = 0;
  for (let g = 0; g < 60; g++) if (duel('hard', 'easy', rnd) === 0) hardWins++;
  check(hardWins >= 50, `battleship: hard beats easy head to head (${hardWins} of 60)`);
  // The admiral knows ships never touch: next to a lone hit it never fires on a corner.
  const s3 = BS.bsNewSea();
  s3.grid[44] = BS.BS_HIT;
  let corners = 0;
  for (let k = 0; k < 40; k++) if ([33, 35, 53, 55].indexOf(BS.bsAiShot(s3, 'hard')) !== -1) corners++;
  const med = BS.bsAiShot(s3, 'medium');
  check(corners === 0 && [34, 43, 45, 54].indexOf(med) !== -1, 'battleship: after a hit, medium and hard fire beside it, never on a corner');

  // The room: two sit down, the room watches, winner stays on.
  const bsRoom = (ids, payload) => {
    const r = newRoom(ids);
    applyRoomAction(r, ids[0], 'chooseGame', { game: 'battleship' });
    applyRoomAction(r, ids[0], 'start', payload || {});
    return r;
  };
  const refused = (fn) => { try { fn(); return false; } catch (e) { return true; } };
  let r = bsRoom(['a', 'b', 'c'], {});
  let s = r.shared;
  check(s.phase === 'place' && s.seats.length === 2 && s.line.length === 1 && s.settings.turnClock === 0 && !s.endsAt &&
    JSON.stringify(s.ready) === '[false,false]', 'battleship room: two sit down to place their fleets, one waits, and the clock is off by default');
  const [p0, p1] = s.seats;
  const watcher = s.line[0];
  check(JSON.stringify(r.secrets[p0].fleet) === JSON.stringify(r._bs.fleets[0]) && JSON.stringify(r.secrets[p1].fleet) === JSON.stringify(r._bs.fleets[1]) &&
    !r.secrets[watcher] && JSON.stringify(s).indexOf('fleet') === -1 && BS.bsFleetProblem(r._bs.fleets[0]) === null,
    'battleship room: each seated phone is dealt its own fleet to start from, the watcher none, the table neither');
  check(refused(() => applyRoomAction(r, p0, 'place', { fleet: touching })) && !s.ready[0], 'battleship room: a fleet with ships touching is refused');
  check(refused(() => applyRoomAction(r, watcher, 'place', { fleet: rows() })), 'battleship room: someone in the line has no fleet to place');
  check(refused(() => applyRoomAction(r, p0, 'fire', { cell: 0, seq: s.turnSeq })) === false && s.phase === 'place', 'battleship room: no shot while the fleets are being placed');
  applyRoomAction(r, p0, 'place', { fleet: rows() });
  check(s.ready[0] && !s.ready[1] && s.phase === 'place' && JSON.stringify(r._bs.fleets[0]) === JSON.stringify(rows()),
    'battleship room: ready with the fleet as placed; the game waits for the other');
  applyRoomAction(r, p0, 'unready', {});
  check(!s.ready[0], 'battleship room: ready can be taken back to move the ships again');
  applyRoomAction(r, p0, 'place', { fleet: rows() });
  const f1 = BS.bsRandomFleet();
  applyRoomAction(r, p1, 'place', { fleet: f1 });
  check(s.phase === 'play' && s.turn === 0, 'battleship room: both ready, the first seat fires');
  check(refused(() => applyRoomAction(r, p1, 'fire', { cell: 0, seq: s.turnSeq })), 'battleship room: out of turn is refused');
  check(refused(() => applyRoomAction(r, watcher, 'fire', { cell: 0, seq: s.turnSeq })), 'battleship room: someone in the line can\'t fire');
  // p0 fires at p1's fleet (f1): a hit shoots again, a miss passes the turn.
  const occ1 = BS.bsOccupancy(f1);
  const water1 = occ1.map((v, i) => (v ? -1 : i)).filter((i) => i >= 0);
  const ship1 = occ1.map((v, i) => (v ? i : -1)).filter((i) => i >= 0);
  const seq0 = s.turnSeq;
  applyRoomAction(r, p0, 'fire', { cell: ship1[0], seq: seq0 });
  check(s.turn === 0 && s.last.res !== 'miss' && s.seas[1].grid[ship1[0]] >= BS.BS_HIT && s.tally[0].hits === 1, 'battleship room: a hit shoots again');
  applyRoomAction(r, p0, 'fire', { cell: water1[0], seq: seq0 });
  check(s.shots === 1, 'battleship room: a second tap drawn for the shot before is dropped');
  check(refused(() => applyRoomAction(r, p0, 'fire', { cell: ship1[0], seq: s.turnSeq })), 'battleship room: a square already fired at is refused');
  applyRoomAction(r, p0, 'fire', { cell: water1[0], seq: s.turnSeq });
  check(s.turn === 1 && s.last.res === 'miss' && s.seas[1].grid[water1[0]] === BS.BS_MISS, 'battleship room: a miss passes the turn');
  // p1 sinks p0's destroyer (rows(): 80, 81): the ship becomes public, the water round it marked.
  applyRoomAction(r, p1, 'fire', { cell: 80, seq: s.turnSeq });
  applyRoomAction(r, p1, 'fire', { cell: 81, seq: s.turnSeq });
  check(s.turn === 1 && s.last.res === 'sunk' && s.last.ship === 4 && JSON.stringify(s.seas[0].sunk) === JSON.stringify([{ i: 4, x: 0, y: 8, d: 'h' }]) &&
    s.seas[0].grid[70] === BS.BS_CLEAR, 'battleship room: a ship sunk is shown whole to the table, the water round it marked, and its sinker fires again');
  check(!s.reveal, 'battleship room: nothing else of a fleet is shown while it is played');
  // p1 sinks the rest: the game is over, the fleets revealed, the loser to the back of the line.
  [0, 1, 2, 3, 4, 20, 21, 22, 23, 40, 41, 42, 60, 61, 62].forEach((c) => { if (s.phase === 'play') applyRoomAction(r, p1, 'fire', { cell: c, seq: s.turnSeq }); });
  check(s.phase === 'over' && s.result.winnerId === p1 && s.result.reason === 'fleet' && s.scores[p1] === 1 &&
    JSON.stringify(s.reveal) === JSON.stringify([rows(), f1]), 'battleship room: the last ship down wins, and both fleets are shown');
  check(JSON.stringify(s.line) === JSON.stringify([watcher, p0]), 'battleship room: the loser goes to the back of the line');
  applyRoomAction(r, 'c', 'nextRound', { round: s.round });
  s = r.shared;
  check(s.phase === 'place' && s.seats[0] === watcher && s.seats[1] === p1 && !!r.secrets[watcher] && !r.secrets[p0] &&
    s.seas[0].grid.every((v) => v === BS.BS_SEA), 'battleship room: the next in line sits down against the winner, fires first, and the seas are new');

  // The clock: placing ends with the fleets as they are, a shot is fired at random.
  r = bsRoom(['a', 'b'], { turnClock: 15 });
  s = r.shared;
  check(s.settings.turnClock === 15 && s.endsAt && roomDeadline(r) === s.endsAt + 1500, 'battleship room: with a clock on, placing has one too, on the server');
  roomTimeout(r, s.endsAt + 2000);
  check(s.phase === 'play' && s.ready[0] && s.ready[1] && s.endsAt > 0, 'battleship room: when placing runs out, both sail with the fleet on their board');
  const before = s.shots;
  const turnWas = s.turn;
  roomTimeout(r, s.endsAt + 2000);
  check(s.shots === before + 1 && s.last.seat === turnWas, 'battleship room: when the turn clock runs out, the phone fires at a random square for the player');
  applyRoomAction(r, 'a', 'skipTurn', { seq: s.turnSeq });
  check(s.shots === before + 2, 'battleship room: the host\'s "play for" does the same for a quiet phone');
  check(refused(() => applyRoomAction(r, 'b', 'skipTurn', { seq: s.turnSeq })), 'battleship room: only the host can play for someone');
  // Someone seated leaves: the other wins by forfeit.
  const leaver = s.seats[s.turn];
  r.players = r.players.filter((p) => p.id !== leaver);
  roomPlayerLeft(r, leaver, 'X');
  check(s.phase === 'over' && s.result.reason === 'left' && s.result.winnerId !== leaver && Array.isArray(s.reveal), 'battleship room: a seated player who leaves loses by forfeit');
  check(refused(() => bsRoom(['a'], {})), 'battleship room: it takes two (no computer players in rooms)');
}

/* --- بولينج: the score sheet, the physics every phone replays, the room's turns --- */
{
  const src = (f) => readFileSync(new URL('../../' + f, import.meta.url), 'utf8');
  const BW = new Function(src('Bowling.js') +
    '\nreturn { BOWL, bowlScore, bowlFrameNext, bowlMarks, bowlBallKind, bowlStart, bowlStep, bowlRun, bowlThrow, bowlStanding, bowlCleanShot, bowlGentleShot, bowlNewCard, bowlApply, bowlTotal };')();
  // A second copy, built apart, stands in for another phone: the same numbers must give the same pins.
  const BW2 = new Function(src('Bowling.js') + '\nreturn { bowlRun, bowlStanding };')();
  const FULL = Array(10).fill(true);
  const play = (total, rolls) => {
    const card = BW.bowlNewCard(total);
    rolls.forEach((n) => { if (!card.over) BW.bowlApply(card, card.standing.map(() => false), n, false); });
    return card;
  };

  // The sheet: a perfect game, all spares, open frames, and the last frame's bonus balls.
  const perfect10 = play(10, Array(12).fill(10));
  check(perfect10.over && BW.bowlTotal(perfect10) === 300 && perfect10.frames[9].length === 3, 'bowling: twelve strikes in 10 frames are 300, three balls in the last');
  const perfect5 = play(5, Array(7).fill(10));
  check(perfect5.over && BW.bowlTotal(perfect5) === 150, 'bowling: seven strikes in 5 frames are 150');
  const spares = play(10, Array(21).fill(5));
  check(spares.over && BW.bowlTotal(spares) === 150 && spares.frames[9].length === 3, 'bowling: all 5-spares are 150, with a bonus ball');
  const open = play(5, [3, 4, 9, 0, 0, 0, 2, 2, 8, 1]);
  check(open.over && BW.bowlTotal(open) === 29 && open.frames[4].length === 2, 'bowling: open frames add up, and the last frame has no bonus ball without a mark');
  const mixed = play(5, [10, 7, 3, 9, 0, 10, 10, 10, 8]);
  check(JSON.stringify(BW.bowlScore(mixed.frames, 5)) === JSON.stringify([20, 39, 48, 78, 106]),
    'bowling: a strike counts the next two balls, a spare the next one (20, 39, 48, 78, 106)');
  const pending = play(5, [10, 10]);
  check(JSON.stringify(BW.bowlScore(pending.frames, 5)) === '[null,null,null,null,null]' && BW.bowlTotal(pending) === 0,
    'bowling: a strike waits for its two balls before it is scored');
  check(BW.bowlFrameNext([10], false) === 'done' && BW.bowlFrameNext([4], false) === 'second' && BW.bowlFrameNext([10], true) === 'fresh' &&
    BW.bowlFrameNext([10, 3], true) === 'second' && BW.bowlFrameNext([6, 4], true) === 'fresh' && BW.bowlFrameNext([6, 3], true) === 'done',
    'bowling: what comes after a ball, in a frame and in the last frame');
  check(BW.bowlMarks([10, 10, 10], true).join('') === 'XXX' && BW.bowlMarks([7, 3, 10], true).join('') === '7/X' &&
    BW.bowlMarks([10, 3, 7], true).join('') === 'X3/' && BW.bowlMarks([0, 10], false).join('') === '-/' && BW.bowlMarks([9, 0], false).join('') === '9-',
    'bowling: the marks on the sheet (X, /, -)');
  const second = BW.bowlNewCard(5);
  const after = [false, true, true, false, false, false, true, false, false, true];
  const r1 = BW.bowlApply(second, after, 6, false);
  check(!r1.frameDone && JSON.stringify(second.standing) === JSON.stringify(after) && r1.kind === 'count', 'bowling: the second ball is at the pins left standing');
  const r2 = BW.bowlApply(second, after, 0, true);
  check(r2.frameDone && r2.kind === 'gutter' && second.standing.every(Boolean) && second.frames.length === 2, 'bowling: a frame done sets a full rack for the next');

  // A shot is four whole numbers, cleaned the same everywhere.
  check(JSON.stringify(BW.bowlCleanShot({ x: 99, aim: -500, speed: 5, spin: 12.6 })) === '{"x":40,"aim":-110,"speed":380,"spin":13}' &&
    JSON.stringify(BW.bowlCleanShot({ x: 'a', aim: null })) === '{"x":0,"aim":0,"speed":380,"spin":0}',
    'bowling: a shot\'s numbers are clamped and rounded');

  // Determinism: the same shot gives the same pins, every time and in every copy of the file.
  let same = true;
  const rnd = (() => { let q = 7; return () => { q = (q * 1103515245 + 12345) % 2147483648; return q / 2147483648; }; })();
  for (let i = 0; i < 120 && same; i++) {
    const shot = { x: Math.round(rnd() * 80 - 40), aim: Math.round(rnd() * 80 - 40), speed: Math.round(420 + rnd() * 560), spin: Math.round(rnd() * 200 - 100) };
    const standing = i % 3 ? FULL : FULL.map(() => rnd() < 0.5);
    const a = BW.bowlRun(standing, shot), b = BW2.bowlRun(standing, shot), c = BW.bowlRun(standing, shot);
    const key = (sim) => JSON.stringify([sim.t, sim.hits, sim.ball.x, sim.ball.y, sim.pins.map((p) => [p.x, p.y, p.state, p.tilt, p.dx, p.dy])]);
    same = key(a) === key(b) && key(a) === key(c);
  }
  check(same, 'bowling: 120 shots, each thrown three times over two copies of the rules, leave the very same pins in the very same places');
  let stepped = true;
  {
    const shot = { x: 6, aim: -2, speed: 780, spin: 35 };
    const sim = BW.bowlStart(FULL, shot);
    while (!sim.done) BW.bowlStep(sim);
    stepped = JSON.stringify(BW.bowlStanding(sim)) === JSON.stringify(BW.bowlThrow(FULL, shot).after);
  }
  check(stepped, 'bowling: a replay stepped frame by frame ends where the server\'s throw does');

  // The physics plays like bowling: gutters score nothing, a pocket hit usually strikes, the lane settles.
  const gutter = BW.bowlThrow(FULL, { x: 40, aim: 60, speed: 700, spin: 0 });
  check(gutter.gutter && gutter.down === 0, 'bowling: a ball in the gutter knocks nothing down');
  let pocket = 0, pocketN = 0, allDone = true, longest = 0;
  let hookAngle = 0;
  for (const speed of [650, 800, 950]) for (const spin of [60, 80, 100]) for (const x of [-40, -30, -20]) for (let aim = -110; aim <= 40; aim += 2) {
    const sim = BW.bowlRun(FULL, { x, aim, speed, spin });
    longest = Math.max(longest, sim.t);
    if (sim.t >= BW.BOWL.MAX_T) allDone = false;
    // Where it met the head pin's row, and at what angle.
    const probe = BW.bowlStart(FULL.map(() => false), { x, aim, speed, spin });
    while (!probe.done && probe.ball.y < BW.BOWL.HEAD_Y && !probe.ball.gutter) BW.bowlStep(probe);
    const angle = Math.atan2(probe.ball.vx, probe.ball.vy) * 180 / Math.PI;
    if (!probe.ball.gutter && Math.abs(probe.ball.x) < 0.1) hookAngle = Math.max(hookAngle, angle);
    // A ball hooking right (spin +) carries into the pocket on the head pin's left, the 1-2
    // (a left-hander's 1-3): the hook drives it across the rack.
    if (!probe.ball.gutter && angle >= 3 && probe.ball.x < -0.035 && probe.ball.x > -0.085) {
      pocketN++;
      if (BW.bowlStanding(sim).every((u) => !u)) pocket++;
    }
  }
  check(hookAngle >= 5 && hookAngle <= 8, `bowling: a full hook reaches the head pin at a bowler's angle (up to ${hookAngle.toFixed(1)} degrees)`);
  check(pocketN >= 6 && pocket / pocketN >= 0.6, `bowling: a hook into its pocket strikes more often than not (${pocket} of ${pocketN})`);
  check(allDone, `bowling: every throw settles before the 8-second cap (the longest ${longest.toFixed(1)}s)`);
  const gentle = BW.bowlThrow(FULL, BW.bowlGentleShot());
  check(!gentle.gutter && gentle.down > 0, 'bowling: the clock\'s gentle straight ball reaches the pins (' + gentle.down + ' down)');

  // What falls follows what was hit, the way the USBC pin-carry study has it: a ball rolled into
  // the pins from 1.2m out at a set spot (cm off the head pin, + to the right) and entry angle.
  const bowlAt = (standing, xcm, deg, v) => {
    const sim = BW.bowlStart(standing, { x: 0, aim: 0, speed: v * 100, spin: 0 });
    const a = deg * Math.PI / 180;
    Object.assign(sim.ball, { vx: -Math.sin(a) * v, vy: Math.cos(a) * v, x: xcm / 100 + Math.sin(a) * 1.2, y: BW.BOWL.HEAD_Y - 1.2 });
    sim.shot = { x: 0, aim: 0, speed: 0, spin: 0 };
    while (!sim.done) BW.bowlStep(sim);
    return BW.bowlStanding(sim).map((u, i) => (u ? i + 1 : 0)).filter(Boolean);
  };
  const PIN_COL = [0, -1, 1, -2, 0, 2, -3, -1, 1, 3];
  const carry = (x0, x1, deg) => {
    let n = 0, x = 0, split = 0;
    for (let xc = x0; xc <= x1 + 1e-9; xc += 0.25) for (const v of [6.5, 7.5, 8.5]) {
      const left = bowlAt(FULL, xc, deg, v);
      n++;
      if (!left.length) x++;
      // a split: the head pin down, and two pins left with a gap between them
      else if (!left.includes(1) && left.some((a) => left.some((b) => Math.abs(PIN_COL[a - 1] - PIN_COL[b - 1]) > 2))) split++;
    }
    return { strike: x / n, split: split / n };
  };
  const pc = (v) => Math.round(v * 100) + '%';
  const pocket6 = carry(4, 9, 6), pocket0 = carry(5.5, 8, 0), nose = carry(-1.5, 1.5, 0), light = carry(12, 16, 6), far = carry(-16, -12, 6);
  check(pocket6.strike >= 0.7, `bowling: into the 1-3 pocket at 6 degrees it strikes (${pc(pocket6.strike)})`);
  check(pocket0.strike < pocket6.strike - 0.2, `bowling: a straight ball into the same pocket carries less (${pc(pocket0.strike)} against ${pc(pocket6.strike)})`);
  check(nose.strike <= 0.4 && nose.split >= 0.15, `bowling: head-on at the head pin mostly splits (${pc(nose.strike)} strikes, ${pc(nose.split)} splits)`);
  check(light.strike <= 0.2 && far.strike <= 0.3, `bowling: a light hit and the far side seldom strike (${pc(light.strike)}, ${pc(far.strike)})`);
  {
    // Mirror: a straight ball into the left pocket carries like one into the right.
    const left = carry(-8, -5.5, 0);
    check(Math.abs(left.strike - pocket0.strike) <= 0.2, `bowling: the two pockets of a straight ball carry alike (${pc(left.strike)} and ${pc(pocket0.strike)})`);
  }
  {
    // A touch of the ball takes a pin: every single-pin spare the ball reaches goes down.
    const spots = [[0, 0], [-15.24, 26.4], [15.24, 26.4], [-30.48, 52.8], [0, 52.8], [30.48, 52.8], [-45.72, 79.2], [-15.24, 79.2], [15.24, 79.2], [45.72, 79.2]];
    const missed = [];
    [1, 2, 4, 5, 7].forEach((pin) => {
      for (let off = -16.5; off <= 16.5; off += 1.5) for (const v of [4.5, 6, 8]) {
        if (Math.abs(spots[pin - 1][0] + off) > 50) continue;   // that ball is in the gutter
        const left = bowlAt(FULL.map((u, i) => i === pin - 1), spots[pin - 1][0] + off, 0, v);
        if (left.length) missed.push(pin + '@' + off);
      }
    });
    check(!missed.length, 'bowling: a ball that touches a lone pin takes it' + (missed.length ? ' (missed ' + missed.slice(0, 4).join(', ') + ')' : ''));
  }
  {
    // The swing (JS_Bowling.html): the line is the backswing's, steady while the push arcs; a bow hooks.
    const html = readFileSync(new URL('../../JS_Bowling.html', import.meta.url), 'utf8');
    const fn = (name) => { const i = html.indexOf('function ' + name + '('); let d = 0; for (let k = html.indexOf('{', i); k < html.length; k++) { if (html[k] === '{') d++; else if (html[k] === '}' && --d === 0) return html.slice(i, k + 1); } return ''; };
    const consts = html.match(/const BOWL_PULL_MIN[\s\S]*?const BOWL_HOOK_K = \d+;/)[0];
    const SW = new Function(src('Bowling.js') + consts + fn('bowlFitSlope') + fn('bowlSwingShot') + '\nreturn { bowlSwingShot };')();
    let q = 11;
    const noise = () => { q = (q * 16807) % 2147483647; return q / 2147483647 - 0.5; };
    const H = 800;
    const swing = (o) => {
      const pts = [], guides = [];
      let t = 0;
      const add = (lx, ly) => { lx += noise() * 0.015; ly += noise() * 0.015; pts.push({ lx, ly, sx: 200 + lx * 300, sy: H - (ly + 2) * 150, t }); t += 8; };
      const ball = () => ({ x: pts[pts.length - 1].lx, y: Math.min(0.35, pts[pts.length - 1].ly) });
      if (o.slide !== undefined) for (let i = 0; i <= 20; i++) add(o.slide + (o.x0 - o.slide) * i / 20, 0.2);
      for (let i = 0; i <= 50; i++) add(o.x0 + (o.xb - o.x0) * i / 50, 0.2 - 1.4 * i / 50);
      for (let i = 1; i <= 22; i++) {
        const u = i / 22;
        add(o.xb + (o.x1 - o.xb) * u + (o.bow || 0) * 4 * u * (1 - u), -1.2 + 1.5 * u);
        guides.push(SW.bowlSwingShot(pts, ball(), H, false).shot.aim);
      }
      return { shot: SW.bowlSwingShot(pts, ball(), H, true).shot, guides };
    };
    const arc = swing({ x0: 0, xb: 0, x1: 0, bow: -0.12 });
    const steady = arc.guides.every((a) => a === arc.shot.aim) && Math.abs(arc.shot.aim) <= 5;
    check(steady && arc.shot.spin > 10, `bowling: an arcing push leaves the line where the backswing set it and hooks (aim ${arc.shot.aim}, spin ${arc.shot.spin})`);
    const slid = swing({ slide: 0.3, x0: -0.2, xb: -0.2, x1: -0.2 });
    check(Math.abs(slid.shot.aim) <= 5 && slid.shot.x === -20, `bowling: sliding the ball across first doesn't aim the throw (aim ${slid.shot.aim}, from ${slid.shot.x}cm)`);
    const diag = swing({ x0: -0.2, xb: -0.3, x1: -0.3 });
    check(diag.shot.aim >= 55 && diag.shot.aim <= 90 && diag.shot.spin === 0, `bowling: a slanted backswing aims along its slant (aim ${diag.shot.aim})`);
  }

  // The room: turns, the server's result equal to a replay, stale taps, the clock, leaving, the end.
  const bw = (ids, payload) => {
    const r = newRoom(ids);
    applyRoomAction(r, ids[0], 'chooseGame', { game: 'bowling' });
    applyRoomAction(r, ids[0], 'start', payload || {});
    return r;
  };
  const refused = (fn) => { try { fn(); return false; } catch (e) { return true; } };
  let r = bw(['a', 'b', 'c']);
  let s = r.shared;
  check(s.phase === 'play' && s.settings.frames === 5 && s.settings.clock === 0 && s.settings.guide === false && s.turn.pid === 'a' &&
    s.order.join('') === 'abc' && s.cards.a.total === 5, 'bowling: 5 frames, no clock and no aim guide by default; everyone bowls in turn');
  check(r.secrets && Object.keys(r.secrets).length === 0, 'bowling: nothing is secret');
  check(refused(() => applyRoomAction(r, 'b', 'throw', { x: 0, aim: 0, speed: 700, spin: 0, seq: s.turnSeq })), 'bowling: only the player up throws');
  const shot1 = { x: 3, aim: 1, speed: 760, spin: 30 };
  const seq0 = s.turnSeq;
  applyRoomAction(r, 'a', 'throw', Object.assign({ seq: seq0 }, shot1));
  s = r.shared;
  const replay = BW.bowlThrow(FULL, shot1);
  check(s.last && s.last.seq === 1 && s.last.pid === 'a' && JSON.stringify(s.last.before) === JSON.stringify(FULL) &&
    JSON.stringify(s.last.after) === JSON.stringify(replay.after) && s.last.down === replay.down && s.cards.a.frames[0][0] === replay.down,
    'bowling: the server\'s pins are the ones a phone gets replaying the shot from the pins that were up');
  applyRoomAction(r, 'a', 'throw', Object.assign({ seq: seq0 }, shot1));
  check(r.shared.throwSeq === 1, 'bowling: a second tap for the same ball is dropped');
  if (s.turn.pid === 'a') {
    const before2 = s.cards.a.standing.slice();
    applyRoomAction(r, 'a', 'throw', { x: -40, aim: -90, speed: 700, spin: 0, seq: s.turnSeq });
    check(JSON.stringify(s.last.before) === JSON.stringify(before2) && s.cards.a.frames[0].length === 2 && s.turn.pid === 'b',
      'bowling: the second ball is at what was left, and then the turn passes');
  } else {
    check(s.cards.a.frames[0][0] === 10 && s.turn.pid === 'b', 'bowling: a strike ends the frame, and the turn passes');
  }
  check(s.board.length === 0 && typeof s.scores.a === 'number', 'bowling: no board while playing (the TV strip would give a ball away before its pins fall)');
  // The clock: a gentle ball thrown for a player who doesn't.
  r = bw(['a', 'b'], { frames: 10, clock: 20, guide: true });
  s = r.shared;
  check(s.settings.frames === 10 && s.settings.clock === 20 && s.settings.guide === true && s.cards.a.total === 10, 'bowling: the host\'s choices: 10 frames, a clock, the aim guide');
  check(roomDeadline(r) === s.endsAt + 1500 && s.endsAt >= clock + 20000, 'bowling: the turn clock is a server deadline');
  clock = s.endsAt + 2000;
  roomTimeout(r, clock);
  check(s.last && s.last.auto === 'clock' && s.last.pid === 'a' && JSON.stringify(s.last.shot) === JSON.stringify(BW.bowlGentleShot()),
    'bowling: when the clock runs out the phone throws a gentle straight ball');
  check(s.endsAt >= s.readyAt + 20000 && s.readyAt >= clock + s.last.ms, 'bowling: the next clock starts once that ball has been watched');
  check(refused(() => applyRoomAction(r, 'b', 'skipTurn', { seq: s.turnSeq })), 'bowling: only the host plays for a quiet phone');
  const up = s.turn.pid;
  applyRoomAction(r, 'a', 'skipTurn', { seq: s.turnSeq });
  check(s.last.auto === 'host' && s.last.pid === up, 'bowling: the host\'s "play for" throws the same gentle ball');
  // Leaving: the turn passes on, the card goes.
  r = bw(['a', 'b', 'c']);
  s = r.shared;
  r.players = r.players.filter((p) => p.id !== 'a');
  roomPlayerLeft(r, 'a', 'A');
  check(s.turn.pid === 'b' && !s.cards.a && s.order.join('') === 'bc' && s.phase === 'play', 'bowling: a player who leaves takes their card, and the turn passes on');
  // A whole game of gutter balls ends after the last frame, the board decides.
  r = bw(['a', 'b'], { frames: 5 });
  s = r.shared;
  let guard = 0;
  while (s.phase === 'play' && guard++ < 60) {
    const pid = s.turn.pid;
    const shot = pid === 'a' ? { x: 0, aim: 2, speed: 800, spin: 30 } : { x: 40, aim: 80, speed: 700, spin: 0 };
    applyRoomAction(r, pid, 'throw', Object.assign({ seq: s.turnSeq }, shot));
    s = r.shared;
  }
  check(s.phase === 'gameover' && r.phase === 'gameover' && s.cards.a.over && s.cards.b.over && BW.bowlTotal(s.cards.b) === 0 &&
    s.board.length === 2 && s.board[0].id === 'a' && s.winners.join() === 'a' && s.wins.a === 1, 'bowling: the game ends after the last frame; the board is the pins, and the most pins wins');
  applyRoomAction(r, 'a', 'playAgain', {});
  s = r.shared;
  check(s.phase === 'play' && s.settings.frames === 5 && s.wins.a === 1 && s.throwSeq === 0 && s.turnSeq > 1, 'bowling: play again keeps the way of playing and the wins');
}

/* --- كدّاب and الشايب: the playing cards, every rule, whole games of computer players ------ */
{
  const PC = new Function(readFileSync(new URL('../../PlayingCards.js', import.meta.url), 'utf8') +
    '\nreturn { PC_RANKS, pcDeck, pcRank, pcRed, pcPairs, pcSorted, PC_OLD_MAID };')();
  const threw = (fn) => { try { fn(); return false; } catch (e) { return true; } };
  check(PC.pcDeck(1).length === 52 && new Set(PC.pcDeck(1)).size === 52 && PC.pcDeck(2).length === 104, 'cards: a deck is 52 different cards, two decks 104');
  check(PC.pcPairs('7h', '7d') && PC.pcPairs('Ks', 'Kc') && !PC.pcPairs('7h', '7s') && !PC.pcPairs('7h', '8h') && !PC.pcPairs('OM', '7h'),
    'cards: a pair in الشايب is the same rank and the same colour; الشايب pairs with nothing');
  check(PC.pcSorted(['Kd', '2s', 'OM', 'Ah', '2c']).join() === 'Ah,2s,2c,Kd,OM', 'cards: a hand is sorted by rank, then suit, الشايب last');

  /* كدّاب */
  let did = 9000;
  const dcards = (...cs) => cs.map((c) => ({ i: did++, c }));
  const doubtStart = (ids, opts) => {
    const r = newRoom(ids);
    applyRoomAction(r, ids[0], 'chooseGame', { game: 'doubt' });
    applyRoomAction(r, ids[0], 'start', Object.assign({}, opts || {}));
    return r;
  };
  const d = (r, pid, action, payload = {}) => applyRoomAction(r, pid, action, Object.assign({ seq: r.shared.turnSeq }, payload));
  const dThrew = (r, pid, action, payload) => threw(() => d(r, pid, action, payload));
  const dSeat = (r, i) => r.shared.order[i];
  const dUp = (r) => r.shared.turn && r.shared.turn.pid;
  const dHand = (r, pid) => r._doubt.hands[pid];
  const dIds = (r, pid, ...faces) => faces.map((f) => { const c = dHand(r, pid).find((x) => x.c === f && !x.used); c.used = true; return c.i; });
  // Hands by seat, seat 0 (or o.up) to lead; the next move writes every phone's slice.
  const dTable = (r, hands, o = {}) => {
    r.shared.order.forEach((id, i) => { r._doubt.hands[id] = hands[i] ? dcards(...hands[i]) : []; });
    r._doubt.pile = [];
    Object.assign(r.shared, { rank: null, plays: [], last: null, passed: [], places: [], pendingOut: null });
    r.shared.turn = { pid: dSeat(r, o.up || 0), stage: 'lead' };
    r.shared.turnSeq++;
  };

  {
    const r = doubtStart(['a', 'b', 'c']);
    const total = Object.values(r._doubt.hands).reduce((n, h) => n + h.length, 0);
    check(r.shared.phase === 'play' && total === 52 && r.shared.order.every((id) => Math.abs(dHand(r, id).length - 52 / 3) < 1) &&
      r.shared.turn.stage === 'lead' && r.shared.decks === 1, 'doubt: one deck dealt out to three, the first seat leads');
    check(r.shared.order.every((id) => r.secrets[id].hand.length === dHand(r, id).length && r.secrets[id].hand.every((c) => dHand(r, id).some((x) => x.i === c.i))),
      "doubt: each phone's slice is its own hand");
    check(!/"c":"/.test(JSON.stringify(r.shared)), 'doubt: no card face in what the table sees');
    check(r.shared.settings.end === 'first' && r.shared.settings.turnClock === 0, 'doubt: the defaults: first out wins, no clock');
    const big = doubtStart(['a', 'b', 'c', 'd', 'e', 'f', 'g']);
    check(big.shared.decks === 2 && Object.values(big._doubt.hands).reduce((n, h) => n + h.length, 0) === 104, 'doubt: seven play with two decks');
    check(threw(() => doubtStart(['a', 'b'])), 'doubt: two alone cannot start');
  }

  {
    // Claims, passes, the pile going out.
    const r = doubtStart(['a', 'b', 'c']);
    const [A, B, C] = r.shared.order;
    dTable(r, [['7h', '7s', '2c', 'Kd'], ['7d', '3h', '4h'], ['5c', '6c', '9d']]);
    check(dThrew(r, A, 'play', { cards: dIds(r, A, '7h') }), 'doubt: whoever leads has to name the rank');
    check(dThrew(r, B, 'play', { cards: dIds(r, B, '7d'), rank: '7' }), 'doubt: only the player up plays');
    check(dThrew(r, A, 'pass'), 'doubt: whoever leads cannot pass');
    d(r, A, 'play', { cards: dIds(r, A, '7s', '2c'), rank: '7' });
    const s = r.shared;
    check(s.rank === '7' && s.last.n === 2 && s.last.pid === A && dUp(r) === B && s.turn.stage === 'follow' && s.pileCount === 2 && s.counts[A] === 2,
      'doubt: a lead lays any number of cards face down and names the rank; the next follows it');
    check(!JSON.stringify(s).includes('"2c"') && s.events.slice(-1)[0].type === 'play' && !('cards' in s.events.slice(-1)[0]), 'doubt: a play says how many and what rank, never which cards');
    d(r, B, 'pass');
    check(dUp(r) === C && s.passed.join() === B && !s.last, 'doubt: a pass closes the call on the last play, and the next follows');
    d(r, C, 'play', { cards: dIds(r, C, '9d'), rank: 'K' });
    check(s.rank === '7' && s.last.pid === C && s.last.rank === '7', 'doubt: a follow always claims the rank named, whatever is sent');
    d(r, A, 'pass');
    d(r, B, 'pass');
    check(s.rank === null && s.pileCount === 0 && dUp(r) === C && s.turn.stage === 'lead' && s.events.slice(-1)[0].type === 'pileOut' &&
      s.events.slice(-1)[0].n === 3, 'doubt: everyone passes after a play: the pile goes out, and the last to play leads');
  }

  {
    // The call: a lie, the truth, who leads.
    const r = doubtStart(['a', 'b', 'c']);
    const [A, B, C] = r.shared.order;
    dTable(r, [['7h', '7s', '2c', 'Kd'], ['7d', '3h', '4h'], ['5c', '6c', '9d']]);
    d(r, A, 'play', { cards: dIds(r, A, '7h', '2c'), rank: '7' });
    const lastId = r.shared.last.id;
    check(threw(() => applyRoomAction(r, A, 'call', { play: lastId })), 'doubt: nobody calls their own play');
    applyRoomAction(r, C, 'call', { play: lastId });
    const s = r.shared;
    const ev = s.events.slice(-1)[0];
    check(ev.type === 'call' && ev.truth === false && ev.taker === A && ev.cards.sort().join() === '2c,7h' && dHand(r, A).length === 4 && s.pileCount === 0,
      'doubt: a lie is turned over and the liar takes the whole pile');
    check(dUp(r) === C && s.turn.stage === 'lead' && s.rank === null, 'doubt: the caller was right, so the caller leads the next rank');
    applyRoomAction(r, B, 'call', { play: lastId });
    check(dHand(r, B).length === 3, 'doubt: a second call on a play already turned over does nothing');
    d(r, C, 'play', { cards: dIds(r, C, '5c'), rank: '5' });
    const truthId = r.shared.last.id;
    d(r, A, 'play', { cards: dIds(r, A, '7s'), rank: '5' });
    applyRoomAction(r, B, 'call', { play: truthId });
    check(dHand(r, B).length === 3 && r.shared.last.pid === A, 'doubt: a call aimed at a play already covered is dropped');
    applyRoomAction(r, B, 'call', { play: r.shared.last.id });
    check(r.shared.events.slice(-1)[0].truth === false && dHand(r, A).length === 5, 'doubt: the lie on top is the one called');
    // The truth: the caller takes the pile, the player leads.
    dTable(r, [['7h', '7s', '2c'], ['7d', '3h', '4h'], ['5c', '6c', '9d']]);
    d(r, A, 'play', { cards: dIds(r, A, '7h', '7s'), rank: '7' });
    applyRoomAction(r, B, 'call', { play: r.shared.last.id });
    check(r.shared.events.slice(-1)[0].truth === true && dHand(r, B).length === 5 && dUp(r) === A && r.shared.turn.stage === 'lead',
      'doubt: the truth: the caller takes the pile and the player leads');
    check(!JSON.stringify(r.shared).includes('"3h"'), 'doubt: only the called play is turned over, the rest goes to the taker face down');
  }

  {
    // The end: a last play still has to survive a call.
    const r = doubtStart(['a', 'b', 'c']);
    const [A, B, C] = r.shared.order;
    dTable(r, [['9h'], ['7d', '3h'], ['5c', '6c']]);
    d(r, A, 'play', { cards: dIds(r, A, '9h'), rank: '9' });
    check(r.shared.phase === 'play' && r.shared.pendingOut === A && r.shared.places.length === 0, 'doubt: laying the last card is not out yet');
    d(r, B, 'pass');
    check(r.shared.phase === 'gameover' && r.shared.winners[0] === A && r.shared.wins[A] === 1 && r.shared.board[0].id === A,
      'doubt: first out wins once the next player passes without a call');
    applyRoomAction(r, 'a', 'playAgain', {});
    check(r.shared.phase === 'play' && r.shared.wins[A] === 1, 'doubt: play again keeps the tally of wins');
    // Called a lie: back in with the pile.
    dTable(r, [['9h'], ['7d', '3h'], ['5c', '6c']]);
    const [A2, B2] = r.shared.order;
    d(r, A2, 'play', { cards: dIds(r, A2, '9h'), rank: '2' });
    applyRoomAction(r, B2, 'call', { play: r.shared.last.id });
    check(r.shared.phase === 'play' && dHand(r, A2).length === 1 && !r.shared.pendingOut && dUp(r) === B2, 'doubt: a last play called a lie: the liar takes the pile and plays on');
    // Called true: out, and the game won.
    dTable(r, [['9h'], ['7d', '3h'], ['5c', '6c']]);
    d(r, A2, 'play', { cards: dIds(r, A2, '9h'), rank: '9' });
    applyRoomAction(r, dSeat(r, 2), 'call', { play: r.shared.last.id });
    check(r.shared.phase === 'gameover' && r.shared.winners[0] === A2, 'doubt: a last play called true: that player is out');
  }

  {
    // Play on for places.
    const r = doubtStart(['a', 'b', 'c', 'd'], { end: 'places' });
    const [A, B, C, D] = r.shared.order;
    dTable(r, [['9h'], ['2d'], ['5c', '6c'], ['4s', '4d']]);
    d(r, A, 'play', { cards: dIds(r, A, '9h'), rank: '9' });
    d(r, B, 'play', { cards: dIds(r, B, '2d') });
    check(r.shared.places.join() === A && r.shared.phase === 'play' && r.shared.pendingOut === B, 'doubt: places: the first out takes first place, and the game goes on');
    d(r, C, 'pass');
    d(r, D, 'pass');
    check(r.shared.places.join() === [A, B].join() && dUp(r) === C && r.shared.turn.stage === 'lead', 'doubt: places: the pile goes out, and the next still playing leads');
    d(r, C, 'play', { cards: dIds(r, C, '5c', '6c'), rank: '5' });
    d(r, D, 'pass');
    check(r.shared.phase === 'gameover' && r.shared.places.join() === [A, B, C, D].join() && r.shared.winners[0] === A,
      'doubt: places: the game ends with one left, every place given');
  }

  {
    // The clock, the host, leaving.
    const r = doubtStart(['a', 'b', 'c'], { turnClock: 30 });
    const [A, B, C] = r.shared.order;
    dTable(r, [['7h', '7s', '2c'], ['7d', '3h'], ['5c', '6c']]);
    const due = roomDeadline(r);
    check(r.shared.endsAt && due === r.shared.endsAt + 1500, 'doubt: the turn clock is a server deadline');
    clock = due + 1;
    roomTimeout(r, clock);
    check(r.shared.last && r.shared.last.pid === A && r.shared.last.n === 1 && r.shared.last.rank === '7' && dHand(r, A).length === 2,
      'doubt: the clock leads one card, truthfully, of the rank held most');
    clock = roomDeadline(r) + 1;
    roomTimeout(r, clock);
    check(r.shared.passed.join() === B && dUp(r) === C, 'doubt: the clock passes on a follow');
    check(threw(() => d(r, r.shared.order.find((id) => id !== 'a'), 'skipTurn')), 'doubt: only the host skips a turn');
    d(r, 'a', 'skipTurn');
    check(r.shared.rank === null && dUp(r) === A && r.shared.turn.stage === 'lead', "doubt: the host's skip passes too, and everyone passing puts the pile out");
    r.players = r.players.filter((p) => p.id !== A);
    roomPlayerLeft(r, A, A);
    check(r.shared.phase === 'play' && dUp(r) === B && r.shared.turn.stage === 'lead' && r.shared.counts[A] === 0, "doubt: a leaver's lead passes to the next seat");
    r.players = r.players.filter((p) => p.id !== C);
    roomPlayerLeft(r, C, C);
    check(r.shared.phase === 'gameover' && r.shared.winners[0] === B && !r.shared.wins[B], 'doubt: one left ends the game, not counted as a win');
  }

  {
    // Computer players.
    const botRoom = (levels, opts) => {
      const r = newRoom(['a']);
      applyRoomAction(r, 'a', 'chooseGame', { game: 'doubt' });
      levels.forEach((lv) => applyRoomAction(r, 'a', 'addBot', { level: lv, name: 'زيزو' }));
      applyRoomAction(r, 'a', 'start', Object.assign({ turnClock: 30 }, opts || {}));
      return r;
    };
    const runBots = (r) => { if (typeof r._botAt === 'number') { clock = Math.max(clock, r._botAt) + 1; roomTimeout(r, clock); return true; } return false; };
    const r = botRoom(['hard', 'hard']);
    const o = r.shared.order;
    const hands = o.map((id) => (id === 'a' ? ['7h', '2c', '3c'] : r.players.find((p) => p.id === id).bot ? ['7s', '7d', '7c', '9h'] : []));
    dTable(r, hands, { up: o.indexOf('a') });
    d(r, 'a', 'play', { cards: dIds(r, 'a', '2c'), rank: '7' });
    // Each hard bot holds three sevens: one claimed seven more makes... 3 + 1 = 4, still possible. Two claimed is five: a sure lie.
    dTable(r, hands, { up: o.indexOf('a') });
    d(r, 'a', 'play', { cards: dIds(r, 'a', '2c', '3c'), rank: '7' });
    check(o.includes(r._botPid) && r._botKey.indexOf('call|') !== -1, 'doubt bots: a hard bot that knows a claim is a lie calls it');
    runBots(r);
    check(r.shared.events.slice(-1)[0].type === 'call' && r.shared.events.slice(-1)[0].truth === false, 'doubt bots: and turns the lie over');

    const errors = [];
    const errorWas = console.error;
    console.error = (...args) => { errors.push(args.join(' ')); };
    let ended = 0, conserved = true;
    const variants = [{}, { end: 'places' }];
    for (let n = 0; n < 30; n++) {
      const levels = n % 3 === 0 ? ['hard', 'hard'] : n % 3 === 1 ? ['easy', 'hard', 'easy'] : ['hard', 'easy', 'hard', 'easy', 'hard', 'easy'];
      const g = botRoom(levels, variants[n % 2]);
      const total = g.shared.decks * 52;
      let outCards = 0;
      let seen = g.shared.eventSeq;
      for (let step = 0; step < 6000 && g.shared.phase !== 'gameover'; step++) {
        if (!runBots(g)) {
          const due = roomDeadline(g);
          if (due === null) break;
          clock = due + 1;
          roomTimeout(g, clock);
        }
        (g.shared.events || []).filter((e) => e.seq > seen).forEach((e) => { if (e.type === 'pileOut') outCards += e.n; });
        seen = g.shared.eventSeq;
        const held = Object.values(g._doubt.hands).reduce((k, h) => k + h.length, 0) + g._doubt.pile.reduce((k, p) => k + p.cards.length, 0);
        if (held + outCards !== total) conserved = false;
      }
      if (g.shared.phase === 'gameover') ended++;
    }
    console.error = errorWas;
    check(ended === 30, `doubt bots: 30 games of bots and one person on the clock, both ways of ending, all end (${ended})`);
    check(!errors.length, 'doubt bots: no bot move was ever refused' + (errors.length ? ': ' + errors[0] : ''));
    check(conserved, 'doubt: no card is lost or made up, through plays, calls and piles going out');
  }

  /* الشايب */
  const omStart = (ids, opts) => {
    const r = newRoom(ids);
    applyRoomAction(r, ids[0], 'chooseGame', { game: 'oldmaid' });
    applyRoomAction(r, ids[0], 'start', Object.assign({}, opts || {}));
    return r;
  };
  const o = (r, pid, action, payload = {}) => applyRoomAction(r, pid, action, Object.assign({ seq: r.shared.turnSeq }, payload));
  const oHand = (r, pid) => r._om.hands[pid];
  const allCards = (r) => Object.values(r._om.hands).flat().map((c) => c.c).concat(r.shared.thrown.flatMap((t) => t.cards));
  let oid = 20000;
  const oTable = (r, hands, up) => {
    r.shared.order.forEach((id, i) => { r._om.hands[id] = (hands[i] || []).map((c) => ({ i: oid++, c })); });
    Object.assign(r.shared, { out: [], thrown: [], phase: 'play' });
    r.shared.turn = { pid: r.shared.order[up || 0], from: r.shared.order[((up || 0) + 1) % r.shared.order.length] };
    r._om.aimId = null;
    r.shared.turnSeq++;
    const mode = r.shared.settings.mode;
    r.shared.settings.mode = 'drag';
    applyRoomAction(r, r.shared.order[0], 'move', { card: -1, to: 0 });
    r.shared.settings.mode = mode;
  };
  {
    const sizes = [2, 3, 4, 8].map((n) => omStart(Array.from({ length: n }, (_, i) => 'p' + i)));
    check(sizes.map((r) => r.shared.deckSize).join() === '33,49,53,53' && sizes.map((r) => r.shared.pairs).join() === '16,24,26,26',
      'oldmaid: the deck grows with the table: 8 pairs a player, at most 26, and الشايب');
    const okDeck = sizes.every((r) => {
      const cards = allCards(r);
      const om = cards.filter((c) => c === 'OM').length;
      const rest = cards.filter((c) => c !== 'OM');
      return om === 1 && rest.every((c) => rest.filter((x) => PC.pcPairs(c, x)).length === 1);
    });
    check(okDeck, 'oldmaid: every card has exactly one partner of its rank and colour, and there is one الشايب');
    check(sizes.every((r) => r.shared.order.every((id) => !oHand(r, id).some((c, k) => oHand(r, id).some((x, j) => j !== k && PC.pcPairs(c.c, x.c))))),
      'oldmaid: the pairs dealt in a hand go out at the start');
    const r = sizes[1];
    check(r.shared.events.filter((e) => e.type === 'pairs' && e.deal).reduce((n, e) => n + e.cards.length, 0) === r.shared.thrown.length * 2,
      'oldmaid: the pairs thrown out at the start are shown, face up');
    check(!JSON.stringify(r.shared).includes('"OM"') && r.shared.order.every((id) => JSON.stringify(r.secrets[id].hand) === JSON.stringify(oHand(r, id))),
      "oldmaid: each phone holds its own hand, in its order, and الشايب is in nobody's view but its holder's");
    check(r.shared.settings.mode === 'drag' && r.shared.settings.turnClock === 0 && r.shared.turn.from === r.shared.order[1],
      'oldmaid: the defaults: rearranged by dragging, no clock; the first seat draws from the next');
    check(threw(() => omStart(['a'])) && threw(() => omStart(Array.from({ length: 9 }, (_, i) => 'p' + i))), 'oldmaid: two to eight players');
  }
  {
    // A draw: lift, drag, take, a pair out.
    const r = omStart(['a', 'b', 'c']);
    const [A, B, C] = r.shared.order;
    oTable(r, [['7h', '2s', 'OM'], ['9c', '7d', '3h'], ['2c', '9s', '3d']]);
    check(threw(() => o(r, B, 'lift', { pos: 0 })), 'oldmaid: only the one whose turn it is draws');
    check(threw(() => o(r, A, 'take')), 'oldmaid: a card is lifted before it is taken');
    o(r, A, 'lift', { pos: 1 });
    // The events keep the pairs the random deal threw out face up at the start, which may be any cards: look at the table without them.
    check(r.shared.aim.pos === 1 && !JSON.stringify(Object.assign({}, r.shared, { events: [] })).includes('"7d"'), 'oldmaid: the lifted card is shown by where it sits, never by what it is');
    const liftedId = oHand(r, B)[1].i;
    applyRoomAction(r, B, 'move', { card: liftedId, to: 2 });
    check(r.shared.aim.pos === 2 && oHand(r, B)[2].i === liftedId && r.shared.events.slice(-1)[0].type === 'move' &&
      r.shared.events.slice(-1)[0].from === 1 && r.shared.events.slice(-1)[0].to === 2, 'oldmaid: the other can drag their cards, and the lifted card moves with its card');
    o(r, A, 'take');
    const s = r.shared;
    check(s.counts[B] === 2 && s.counts[A] === 2 && s.thrown.some((t) => t.cards.sort().join() === '7d,7h') && s.events.some((e) => e.type === 'pairs' && e.pid === A),
      'oldmaid: the card goes to the drawer, and the pair it makes goes out face up');
    check(s.turn.pid === B && s.turn.from === C && !s.aim, 'oldmaid: the turn goes round: the one drawn from draws next, from the next');
    const drew = s.events.find((e) => e.type === 'draw');
    check(drew.pos === 2 && !('card' in drew) && !JSON.stringify(drew).includes('7d'), 'oldmaid: a draw says from where, never what');
    // A card drawn without a pair gets a new id and a random place.
    const before = oHand(r, C).map((c) => c.i);
    o(r, B, 'take', { pos: 0 });
    const got = oHand(r, B).find((c) => before.indexOf(c.i) !== -1);
    check(!got && oHand(r, B).length + oHand(r, C).length === 5, 'oldmaid: a drawn card changes its id, so the one who gave it up cannot follow it');
  }
  {
    // Safe, the loser, the tally.
    const r = omStart(['a', 'b', 'c']);
    const [A, B, C] = r.shared.order;
    oTable(r, [['7h', 'OM'], ['7d'], []]);
    o(r, A, 'lift', { pos: 0 });
    o(r, A, 'take');
    check(r.shared.out.join() === B, 'oldmaid: an empty hand is safe, in the order they got out');
    const s = r.shared;
    check(s.phase === 'gameover' && s.loser === A && s.losses[A] === 1 && s.reveal.pid === A && s.reveal.cards.join() === 'OM',
      'oldmaid: the last holding cards holds الشايب and loses; only now is it shown');
    check(s.board[s.board.length - 1].id === A && s.board[0].score === 0, 'oldmaid: the board puts the fewest times الشايب first');
    applyRoomAction(r, 'a', 'playAgain', {});
    check(r.shared.phase === 'play' && r.shared.losses[A] === 1 && !r.shared.reveal && !r.shared.loser, 'oldmaid: play again keeps the tally, and hides everything again');
  }
  {
    // Shuffled hands, the clock, leaving.
    const r = omStart(['a', 'b', 'c'], { mode: 'shuffle', turnClock: 15 });
    const [A, B, C] = r.shared.order;
    check(threw(() => applyRoomAction(r, A, 'move', { card: oHand(r, A)[0].i, to: 1 })), 'oldmaid: with the hands shuffled nobody drags');
    oTable(r, [['7h', '2s', 'OM'], ['9c', '7d', '3h', 'Qd'], ['2c', '9s', '3d']]);
    o(r, A, 'take', { pos: 0 });
    check(r.shared.events.some((e) => e.type === 'shuffle'), 'oldmaid: shuffled hands are shuffled by the server after every turn');
    const due = roomDeadline(r);
    check(r.shared.endsAt && due === r.shared.endsAt + 1500, 'oldmaid: the turn clock is a server deadline');
    clock = due + 1;
    roomTimeout(r, clock);
    check(r.shared.events.some((e) => e.type === 'auto' && e.why === 'clock') && r.shared.events.some((e) => e.type === 'draw' && e.auto === 'clock'),
      'oldmaid: when the clock runs out a card is drawn at random');
    const m = omStart(['a', 'b', 'c']);
    const [A2, B2, C2] = m.shared.order;
    oTable(m, [['7h', 'OM'], ['9c', '2c'], ['9s', '2s']]);
    m.players = m.players.filter((p) => p.id !== B2);
    roomPlayerLeft(m, B2, B2);
    check(oHand(m, C2).length === 0 && m.shared.thrown.length === 2 && m.shared.out.indexOf(C2) !== -1,
      "oldmaid: a leaver's cards go to the next hand still playing, and their pairs go out");
    check(m.shared.phase === 'gameover' && m.shared.loser === A2, 'oldmaid: one left holding cards loses');
    const two = omStart(['a', 'b']);
    two.players = two.players.filter((p) => p.id !== 'b');
    roomPlayerLeft(two, 'b', 'b');
    check(two.shared.phase === 'gameover' && !two.shared.loser && two.shared.ended === 'left', 'oldmaid: fewer than two left ends the game with no loser');
  }
  {
    // Whole games: random draws and drags, every game ends with one loser holding الشايب.
    let ok = 0, fair = true;
    for (let n = 0; n < 40; n++) {
      const ids = Array.from({ length: 2 + (n % 7) }, (_, i) => 'q' + i);
      const r = omStart(ids, { mode: n % 3 ? 'drag' : 'shuffle' });
      for (let step = 0; step < 800 && r.shared.phase === 'play'; step++) {
        const s = r.shared;
        if (Math.random() < 0.3 && s.settings.mode === 'drag') {
          const h = oHand(r, s.turn.from);
          applyRoomAction(r, s.turn.from, 'move', { card: h[Math.floor(Math.random() * h.length)].i, to: Math.floor(Math.random() * h.length) });
        }
        o(r, s.turn.pid, 'lift', { pos: Math.floor(Math.random() * s.counts[s.turn.from]) });
        o(r, r.shared.turn.pid, 'take');
        if (allCards(r).length !== r.shared.deckSize) fair = false;
      }
      if (r.shared.phase === 'gameover' && r.shared.loser && oHand(r, r.shared.loser).map((c) => c.c).join() === 'OM') ok++;
    }
    check(ok === 40, `oldmaid: 40 whole games, 2 to 8 players, both ways of holding: each ends with one loser holding الشايب alone (${ok})`);
    check(fair, 'oldmaid: no card is lost or made up');
  }
}

/* --- شطرنج: every rule (perft), the draws, the clock, Armageddon, the phone's player, winner stays on --- */
{
  const CH = new Function(readFileSync(new URL('../../Chess.js', import.meta.url), 'utf8') +
    '\nreturn { chessNew, chessFromFen, chessFen, chessPerft, chessPlay, chessStatus, chessLegalMoves, chessBestMove, chessInsufficient, chessCanMate,' +
    ' chessClockNew, chessClockPress, chessClockFlagged, chessClockLeft, chessFlagResult, chessMatchNext, chessArmageddonResult, chessKey, chessCheckSq,' +
    ' chessEloSettings, chessEloBand, chessElo, chessClassify, chessMoveAccuracy, chessAnalyse, chessMoveGood, chessReview, chessThreats, chessPins, chessUci, chess960Start, chess960Random,' +
    ' chessHandicapFen, CHESS_CLOCK_IDS, CHESS_CLOCK_SPEC };')();
  const threwC = (fn) => { try { fn(); return false; } catch (e) { return true; } };
  const perft = (fen, depth) => CH.chessPerft(CH.chessFromFen(fen), depth);
  // The standard perft positions (chessprogramming.org): every legal move counted, deep.
  const START = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
  const KIWI = 'r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1';
  check([1, 2, 3, 4].map((d) => perft(START, d)).join() === '20,400,8902,197281', 'chess: perft from the start, depth 1-4: 20, 400, 8902, 197281');
  check([1, 2, 3].map((d) => perft(KIWI, d)).join() === '48,2039,97862', 'chess: perft "Kiwipete" (castling, pins, en passant), depth 1-3: 48, 2039, 97862');
  check(perft('8/2p5/3p4/KP5r/1R3p1k/8/4P1P1/8 w - - 0 1', 5) === 674624, 'chess: perft position 3 (en passant along a pin), depth 5: 674624');
  check(perft('r3k2r/Pppp1ppp/1b3nbN/nP6/BBP1P3/q4N2/Pp1P2PP/R2Q1RK1 w kq - 0 1', 4) === 422333, 'chess: perft position 4 (promotions, castling in check), depth 4: 422333');
  check(perft('rnbq1k1r/pp1Pbppp/2p5/8/2B5/8/PPP1NnPP/RNBQK2R w KQ - 1 8', 3) === 62379, 'chess: perft position 5 (promotion with capture), depth 3: 62379');
  check(perft('r4rk1/1pp1qppp/p1np1n2/2b1p1B1/2B1P1b1/P1NP1N2/1PP1QPPP/R4RK1 w - - 0 10', 3) === 89890, 'chess: perft position 6, depth 3: 89890');

  // Chess960 perft positions (chessprogramming wiki / Ethereal fischer.epd)
  const P960_1 = 'bqnb1rkr/pp3ppp/3ppn2/2p5/5P2/P2P4/NPP1P1PP/BQ1BNRKR w HFhf - 2 9';
  const P960_2 = '2nnrbkr/p1qppppp/8/1ppb4/6PP/3PP3/PPP2P2/BQNNRBKR w HEhe - 1 9';
  const P960_3 = 'b1q1rrkb/pppppppp/3nn3/8/P7/1PPP4/4PPPP/BQNNRKRB w GE - 1 9';
  const P960_4 = 'qbbnnrkr/2pp2pp/p7/1p2pp2/8/P3PP2/1PPP1KPP/QBBNNR1R w hf - 0 9';
  const P960_5 = '1nbbnrkr/p1p1ppp1/3p4/1p3P1p/3Pq2P/8/PPP1P1P1/QNBBNRKR w HFhf - 0 9';
  const P960_6 = 'qnbnr1kr/ppp1b1pp/4p3/3p1p2/8/2NPP3/PPP1BPPP/QNB1R1KR w HEhe - 1 9';
  check([1, 2, 3].map((d) => perft(P960_1, d)).join() === '21,528,12189', 'chess960: perft position 1, depth 1-3: 21, 528, 12189');
  check([1, 2, 3].map((d) => perft(P960_2, d)).join() === '21,807,18002', 'chess960: perft position 2, depth 1-3: 21, 807, 18002');
  check([1, 2, 3].map((d) => perft(P960_3, d)).join() === '20,479,10471', 'chess960: perft position 3, depth 1-3: 20, 479, 10471');
  check([1, 2, 3].map((d) => perft(P960_4, d)).join() === '22,593,13440', 'chess960: perft position 4, depth 1-3: 22, 593, 13440');
  check([1, 2, 3].map((d) => perft(P960_5, d)).join() === '28,1120,31058', 'chess960: perft position 5, depth 1-3: 28, 1120, 31058');
  check([1, 2, 3].map((d) => perft(P960_6, d)).join() === '29,899,26578', 'chess960: perft position 6, depth 1-3: 29, 899, 26578');

  // Chess960 start and round trip
  check(CH.chess960Start(518) === START, 'chess960: position 518 equals standard start');
  let roundTripOk = true;
  for (let n = 0; n < 960; n++) {
    const f = CH.chess960Start(n);
    if (CH.chessFen(CH.chessFromFen(f)) !== f) { roundTripOk = false; break; }
  }
  check(roundTripOk, 'chess960: all 960 start positions round-trip through FEN');

  // Castling where the king doesn't move
  {
    const g = CH.chessFromFen('4k3/8/8/8/8/8/8/6KR w H - 0 1');
    const r = CH.chessPlay(g, { from: 'g1', to: 'g1' });
    check(r && r.san === 'O-O' && g.board[6] === 6 && g.board[5] === 4 && !g.board[7], 'chess960: castling where king stays on g1');
    const g2 = CH.chessFromFen('4k3/8/8/8/8/8/8/6KR w H - 0 1');
    const r2 = CH.chessPlay(g2, { from: 'g1', to: 'h1' });
    check(r2 && r2.san === 'O-O' && g2.board[6] === 6 && g2.board[5] === 4 && !g2.board[7], 'chess960: castling where king takes own rook on h1');
  }

  const play = (g, list) => list.every((m) => { const [from, to, promo] = m.split(/[-=]/); return !!CH.chessPlay(g, { from, to, promo }); });
  const can = (fen, from, to) => CH.chessLegalMoves(CH.chessFromFen(fen)).some((m) => m.from === from && m.to === to);
  // Castling through an attacked square refused
  check(!can('4k3/8/8/8/8/5r2/8/4K2R w K - 0 1', 'e1', 'g1'), 'chess960: castling through an attacked square refused');
  // Castling: both ways, and every condition.
  const CASTLE = 'r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1';
  check(can(CASTLE, 'e1', 'g1') && can(CASTLE, 'e1', 'c1') && can(CASTLE.replace(' w ', ' b '), 'e8', 'g8') && can(CASTLE.replace(' w ', ' b '), 'e8', 'c8'),
    'chess: castling short and long, White and Black');
  {
    const g = CH.chessFromFen(CASTLE);
    const r1 = CH.chessPlay(g, { from: 'e1', to: 'g1' });
    check(r1.san === 'O-O' && r1.castle === 'short' && g.board[5] === 4 && g.board[6] === 6 && !g.board[7], 'chess: O-O puts the rook on f1 beside the king on g1');
    const r2 = CH.chessPlay(g, { from: 'e8', to: 'c8' });
    check(r2.san === 'O-O-O' && g.board[59] === 12 && g.board[58] === 14 && !g.board[56], 'chess: O-O-O puts the rook on d8 beside the king on c8');
  }
  check(!can('r3k2r/8/8/8/8/8/8/R3K2R w - - 0 1', 'e1', 'g1'), 'chess: no castling once the right is gone');
  check(!can('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1'.replace('R3K2R', 'R3KB1R'), 'e1', 'g1'), 'chess: no castling with a piece between');
  check(!can('4k3/8/8/8/8/8/8/R3K2R w KQ - 0 1'.replace('4k3', '4r1k1'), 'e1', 'g1'), 'chess: no castling out of check');
  check(!can('5rk1/8/8/8/8/8/8/R3K2R w KQ - 0 1', 'e1', 'g1') && can('5rk1/8/8/8/8/8/8/R3K2R w KQ - 0 1', 'e1', 'c1'), 'chess: no castling through an attacked square (f1), the other side still can');
  check(!can('6rk/8/8/8/8/8/8/R3K2R w KQ - 0 1', 'e1', 'g1'), 'chess: no castling into check (g1)');
  check(can('1r2k3/8/8/8/8/8/8/R3K2R w Q - 0 1', 'e1', 'c1'), 'chess: long castling with b1 attacked is allowed (the king never crosses it)');
  {
    const g = CH.chessFromFen(CASTLE);
    play(g, ['h1-h2', 'a8-a7', 'h2-h1', 'a7-a8']);
    check(!CH.chessLegalMoves(g).some((m) => m.from === 'e1' && m.to === 'g1') && CH.chessLegalMoves(g).some((m) => m.from === 'e1' && m.to === 'c1'),
      'chess: a rook that moved (and came back) takes that side\'s castling away');
    const k = CH.chessFromFen(CASTLE);
    play(k, ['e1-e2', 'e8-e7', 'e2-e1', 'e7-e8']);
    check(!CH.chessLegalMoves(k).some((m) => m.from === 'e1' && (m.to === 'g1' || m.to === 'c1')), 'chess: a king that moved can never castle');
    const x = CH.chessFromFen('r3k2r/8/8/8/8/8/6b1/R3K2R b KQkq - 0 1');
    play(x, ['g2-h1']);
    check(!CH.chessLegalMoves(x).some((m) => m.from === 'e1' && m.to === 'g1'), 'chess: a rook taken on its square takes that castling away');
  }
  // En passant: only straight after the double step, and never into a pin.
  {
    const g = CH.chessFromFen('4k3/8/8/3P4/8/8/8/4K3 b - - 0 1');
    play(g, ['c7-c5'.replace('c7', 'e8').replace('c5', 'd8')]);   // a king move first
    const h = CH.chessFromFen('4k3/2p5/8/3P4/8/8/8/4K3 b - - 0 1');
    play(h, ['c7-c5']);
    const ep = CH.chessPlay(h, { from: 'd5', to: 'c6' });
    check(!!ep && ep.ep && ep.capture === 'p' && ep.captureSq === 'c5' && !h.board[34] && ep.san === 'dxc6', 'chess: en passant takes the pawn that just stepped past (dxc6)');
    const late = CH.chessFromFen('4k3/2p4p/8/3P4/8/8/8/4K3 b - - 0 1');
    play(late, ['c7-c5', 'e1-e2', 'h7-h6']);
    check(!CH.chessLegalMoves(late).some((m) => m.from === 'd5' && m.to === 'c6'), 'chess: en passant is gone a move later');
    check(!can('8/8/8/KpP4r/8/8/8/7k w - b6 0 1', 'c5', 'b6'), 'chess: en passant that would open the king to a rook along the rank is refused');
    check(CH.chessKey(CH.chessFromFen('4k3/8/8/8/3p4/8/4P3/4K3 w - - 0 1')) !== CH.chessKey((() => { const q = CH.chessFromFen('4k3/8/8/8/3p4/8/4P3/4K3 w - - 0 1'); play(q, ['e2-e4']); return q; })()),
      'chess: a position where en passant is possible is not the same position for repetition');
    void g;
  }
  // Promotion: a choice of four, the queen when none is said.
  {
    const P = '8/4P1k1/8/8/8/8/8/4K3 w - - 0 1';
    check(CH.chessLegalMoves(CH.chessFromFen(P)).filter((m) => m.from === 'e7' && m.to === 'e8').map((m) => m.promo).sort().join('') === 'bnqr',
      'chess: a pawn on the last rank becomes a queen, rook, bishop or knight');
    const n = CH.chessFromFen(P);
    const rn = CH.chessPlay(n, { from: 'e7', to: 'e8', promo: 'n' });
    check(rn.san === 'e8=N+' && n.board[60] === 2, 'chess: promotion to a knight (e8=N+, a check from the knight)');
    const q = CH.chessFromFen(P);
    const rq = CH.chessPlay(q, { from: 'e7', to: 'e8' });
    check(rq.promo === 'q' && q.board[60] === 5, 'chess: a promotion sent without a piece is a queen');
  }
  // Check, mate, stalemate.
  {
    const g = CH.chessNew();
    play(g, ['f2-f3', 'e7-e5', 'g2-g4']);
    const m = CH.chessPlay(g, { from: 'd8', to: 'h4' });
    check(m.san === 'Qh4#' && m.status.over && m.status.reason === 'mate' && m.status.result === 'b', 'chess: the fool\'s mate is mate (Qh4#), Black wins');
    check(CH.chessPlay(g, { from: 'e1', to: 'f2' }) === null && CH.chessLegalMoves(g).length === 0, 'chess: nothing can be played after mate');
    const c = CH.chessNew();
    play(c, ['e2-e4', 'f7-f6', 'd1-h5']);
    check(CH.chessCheckSq(c) === 'e8' && CH.chessLegalMoves(c).every((mv) => mv.to !== 'f7' || mv.from !== 'e8') && CH.chessLegalMoves(c).length === 1 && CH.chessStatus(c).check,
      'chess: in check only a move out of it is legal (here g6, the one move)');
    const st = CH.chessStatus(CH.chessFromFen('k7/8/1Q6/8/8/8/8/7K b - - 0 1'));
    check(st.over && st.reason === 'stalemate' && st.result === 'd' && !st.check, 'chess: no legal move and not in check is stalemate, a draw');
    check(CH.chessStatus(CH.chessNew()).over === false, 'chess: the start position is not over');
  }
  // Threefold repetition and the fifty-move rule, both automatic.
  {
    const g = CH.chessNew();
    const shuffle = ['g1-f3', 'g8-f6', 'f3-g1', 'f6-g8'];
    play(g, shuffle);
    check(!CH.chessStatus(g).over, 'chess: a position twice is not yet a draw');
    play(g, shuffle.slice(0, 3));
    const last = CH.chessPlay(g, { from: 'f6', to: 'g8' });
    check(last.status.over && last.status.reason === 'repetition' && last.status.result === 'd', 'chess: the same position a third time is a draw (threefold repetition)');
    const f = CH.chessFromFen('4k3/8/8/8/8/8/8/R3K3 w - - 99 80');
    const r = CH.chessPlay(f, { from: 'a1', to: 'a2' });
    check(r.status.over && r.status.reason === 'fifty', 'chess: fifty moves each with no capture or pawn move is a draw');
    const mateOn100 = CH.chessFromFen('6k1/5ppp/8/8/8/8/8/R5K1 w - - 99 80');
    const rm = CH.chessPlay(mateOn100, { from: 'a1', to: 'a8' });
    check(rm.status.reason === 'mate', 'chess: a mate on the hundredth half-move is mate, not fifty moves');
    const pawn = CH.chessFromFen('4k3/8/8/8/8/8/4P3/4K3 w - - 99 80');
    check(!CH.chessPlay(pawn, { from: 'e2', to: 'e3' }).status.over, 'chess: a pawn move starts the fifty moves again');
  }
  // Too little to mate.
  {
    const ins = (fen) => CH.chessInsufficient(CH.chessFromFen(fen).board);
    check(ins('4k3/8/8/8/8/8/8/4K3 w - - 0 1') && ins('4k3/8/8/8/8/8/8/2B1K3 w - - 0 1') && ins('4k3/8/8/8/8/8/8/1N2K3 w - - 0 1'),
      'chess: king against king, and a king and one bishop or knight against a king, can\'t mate');
    check(ins('3bk3/8/8/8/8/8/8/2B1K3 w - - 0 1') && !ins('2b1k3/8/8/8/8/8/8/2B1K3 w - - 0 1'), 'chess: bishops on squares of one colour can\'t mate; of both colours they can');
    check(!ins('4k3/8/8/8/8/8/8/1NN1K3 w - - 0 1') && !ins('4k3/8/8/8/8/8/4P3/4K3 w - - 0 1'), 'chess: two knights, or a pawn, is not declared a draw');
    const g = CH.chessFromFen('4k3/8/8/8/8/8/3q4/4K3 w - - 0 1');
    const r = CH.chessPlay(g, { from: 'e1', to: 'd2' });
    check(r.capture === 'q' && r.status.over && r.status.reason === 'material', 'chess: taking the last piece leaves king against king, a draw');
  }
  // SAN: which piece moved, when two could.
  {
    const s1 = CH.chessPlay(CH.chessFromFen('k7/8/8/8/8/5N2/8/1N2K3 w - - 0 1'), { from: 'b1', to: 'd2' });
    const s2 = CH.chessPlay(CH.chessFromFen('7k/8/8/R7/8/8/8/R3K3 w - - 0 1'), { from: 'a1', to: 'a3' });
    check(s1.san === 'Nbd2' && s2.san === 'R1a3', 'chess: two pieces that could go there are told apart (Nbd2, R1a3)');
  }
  // The clock: the first move free, the increment, running out, and who wins then.
  {
    const c = CH.chessClockNew('3+2');
    check(c.left[0] === 180000 && c.left[1] === 180000 && c.inc === 2000 && c.at === null && CH.chessClockNew('off') === null && CH.chessClockNew('7+7') === null,
      'chess clock: 3+2 is three minutes each and two seconds a move; off is no clock');
    CH.chessClockPress(c, 0, 1000, 0, true);
    check(c.left[0] === 180000 && c.at === 1000, 'chess clock: White\'s first move is free; Black\'s time starts with it');
    CH.chessClockPress(c, 1, 11000, 0, false);
    check(c.left[1] === 180000 - 10000 + 2000 && c.at === 11000, 'chess clock: the time a move took comes off, and the increment is added');
    check(!CH.chessClockFlagged(c, 0, 11000 + 179000, 0) && CH.chessClockFlagged(c, 0, 11000 + 181000, 0), 'chess clock: the side to move runs out when its time is gone');
    check(CH.chessClockPress(c, 0, 11000 + 181000, 500) === false, 'chess clock: a move after the time has gone (beyond the grace) is too late');
    const b = (fen) => CH.chessFromFen(fen).board;
    check(CH.chessFlagResult(b('4k3/8/8/8/8/8/8/Q3K3 w - - 0 1'), 1) === 'w', 'chess clock: Black runs out, White has a queen: White wins');
    check(CH.chessFlagResult(b('4k3/8/8/8/8/8/8/Q3K3 w - - 0 1'), 0) === 'd', 'chess clock: White runs out with the queen, Black has only the king: a draw');
    check(CH.chessFlagResult(b('4k3/8/8/8/8/8/8/1N2K3 w - - 0 1'), 1) === 'd' && CH.chessFlagResult(b('4k3/4p3/8/8/8/8/8/1N2K3 w - - 0 1'), 1) === 'w',
      'chess clock: a lone knight can\'t mate a bare king (draw), but can with a pawn to block (a win)');
    check(CH.CHESS_CLOCK_IDS.join(',') === 'off,1+0,3+0,3+2,5+0,10+0,15+10', 'chess clock: ids list matches new clock choices');
    check(CH.chessClockNew('1+0').base === 60000 && CH.chessClockNew('1+0').inc === 0, 'chess clock: 1+0 is 1 minute, 0 inc');
    check(CH.chessClockNew('3+0').base === 180000 && CH.chessClockNew('3+0').inc === 0, 'chess clock: 3+0 is 3 minutes, 0 inc');
    check(CH.chessClockNew('15+10').base === 900000 && CH.chessClockNew('15+10').inc === 10000, 'chess clock: 15+10 is 15 minutes, 10 inc');
    const cOddsW = CH.chessClockNew('3+2', { odds: 'w' });
    check(cOddsW.left[0] === 90000 && cOddsW.left[1] === 180000, 'chess clock: odds w gets half base time for White');
    const cOddsB = CH.chessClockNew('3+2', { odds: 'b' });
    check(cOddsB.left[0] === 180000 && cOddsB.left[1] === 90000, 'chess clock: odds b gets half base time for Black');
    // Handicap FENs
    check(CH.chessHandicapFen('pawn', 'w') === 'rnbqkbnr/pppppppp/8/8/8/8/PPPPP1PP/RNBQKBNR w KQkq - 0 1', 'chess handicap: white pawn removes f2');
    check(CH.chessHandicapFen('pawn', 'b') === 'rnbqkbnr/ppppp1pp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', 'chess handicap: black pawn removes f7');
    check(CH.chessHandicapFen('knight', 'w') === 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/R1BQKBNR w KQkq - 0 1', 'chess handicap: white knight removes b1');
    check(CH.chessHandicapFen('knight', 'b') === 'r1bqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', 'chess handicap: black knight removes b8');
    check(CH.chessHandicapFen('rook', 'w') === 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/1NBQKBNR w Kkq - 0 1', 'chess handicap: white rook removes a1 and Q castle');
    check(CH.chessHandicapFen('rook', 'b') === '1nbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQk - 0 1', 'chess handicap: black rook removes a8 and q castle');
    check(CH.chessHandicapFen('queen', 'w') === 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNB1KBNR w KQkq - 0 1', 'chess handicap: white queen removes d1');
    check(CH.chessHandicapFen('queen', 'b') === 'rnb1kbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', 'chess handicap: black queen removes d8');
  }
  // Armageddon and the match in a bracket: replay once with the colours swapped, then Armageddon.
  {
    check(CH.chessArmageddonResult('d') === 'b' && CH.chessArmageddonResult('w') === 'w' && CH.chessArmageddonResult('b') === 'b', 'chess: in Armageddon a draw is a win for Black');
    const m = { first: 'a', games: [] };
    const n0 = CH.chessMatchNext(m);
    check(!n0.done && n0.white === 'a' && !n0.armageddon, 'chess match: game 1, the first has White');
    check(CH.chessMatchNext({ first: 'a', games: [{ white: 'a', result: 'b' }] }).winner === 'b', 'chess match: a decisive game 1 decides the match');
    const n1 = CH.chessMatchNext({ first: 'a', games: [{ white: 'a', result: 'd' }] });
    check(!n1.done && n1.white === 'b' && !n1.armageddon, 'chess match: a draw is replayed with the colours swapped');
    check(CH.chessMatchNext({ first: 'a', games: [{ white: 'a', result: 'd' }, { white: 'b', result: 'w' }] }).winner === 'b', 'chess match: the replay decides it when it is won');
    const n2 = CH.chessMatchNext({ first: 'a', games: [{ white: 'a', result: 'd' }, { white: 'b', result: 'd' }] }, () => 0.9);
    check(!n2.done && n2.armageddon && n2.white === 'b', 'chess match: drawn twice, one Armageddon game (White by lot)');
    const w3 = CH.chessMatchNext({ first: 'a', games: [{ white: 'a', result: 'd' }, { white: 'b', result: 'd' }, { white: 'b', result: 'd', armageddon: true }] });
    check(w3.done && w3.winner === 'a', 'chess match: a drawn Armageddon goes to whoever had Black');
  }
  // The phone's player: never an illegal move, it stops on its ceiling, and hard beats easy.
  {
    let legal = true, count = 0;
    const seeded = (seed) => () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
    const rnd = seeded(7);
    for (let game = 0; game < 6; game++) {
      const g = CH.chessNew();
      for (let ply = 0; ply < 40 && !CH.chessStatus(g).over; ply++) {
        const elo = [400, 1200, 2000][ply % 3];
        const mv = CH.chessBestMove(g, { elo, nodes: 4000, rnd });
        const ok = CH.chessLegalMoves(g).some((m) => m.from === mv.from && m.to === mv.to && (m.promo || '') === (mv.promo || ''));
        if (!ok) legal = false;
        // Half the moves random, so the positions go everywhere.
        const all = CH.chessLegalMoves(g);
        const pick = rnd() < 0.5 ? mv : all[Math.floor(rnd() * all.length)];
        CH.chessPlay(g, pick);
        count++;
      }
    }
    check(legal && count > 150, `chess AI: every move at every rating is legal (${count} positions)`);
    const t0 = realNow();
    const hard = CH.chessBestMove(CH.chessNew(), { elo: 2000 });
    check(!!hard && realNow() - t0 < 8000, 'chess AI: with the clock standing still (this test) 2000 stops at its ceiling of positions');
    const a = CH.chessBestMove(CH.chessFromFen(KIWI), { elo: 2000, nodes: 20000, rnd: seeded(3) });
    const b = CH.chessBestMove(CH.chessFromFen(KIWI), { elo: 2000, nodes: 20000, rnd: seeded(3) });
    check(a.from === b.from && a.to === b.to, 'chess AI: the same position and ceiling give the same move');
    // 1200 slips a random move now and then (chessEloSettings' `blunder`, about 3%), so one call
    // could miss the mate: twenty fixed seeds, the mate in nearly all of them - the same every run.
    check((() => {
      let found = 0;
      for (let k = 1; k <= 20; k++) {
        const m = CH.chessBestMove(CH.chessFromFen('6k1/5ppp/8/8/8/8/8/R5K1 w - - 0 1'), { elo: 1200, rnd: seeded(k) });
        if (m.from === 'a1' && m.to === 'a8') found++;
      }
      return found >= 17;
    })(), 'chess AI: 1200 finds a mate in one (Ra8#), with twenty fixed seeds');
    check((() => { const m = CH.chessBestMove(CH.chessFromFen('4k3/8/8/8/8/8/3q4/3QK3 w - - 0 1'), { elo: 2000, nodes: 20000 }); return m.to === 'd2'; })(),
      'chess AI: 2000 takes a queen left en prise');
    let hardWins = 0, hardLost = 0;
    for (let game = 0; game < 4; game++) {
      const g = CH.chessNew();
      const hardIs = game % 2;       // 1800 plays Black in games 1 and 3
      for (let ply = 0; ply < 300 && !CH.chessStatus(g).over; ply++) {
        const elo = g.turn === hardIs ? 1800 : 600;
        CH.chessPlay(g, CH.chessBestMove(g, { elo, nodes: elo === 1800 ? 25000 : undefined, rnd }));
      }
      const st = CH.chessStatus(g);
      const hardColour = hardIs ? 'b' : 'w';
      if (st.result === hardColour) hardWins++;
      else if (st.result && st.result !== 'd') hardLost++;
    }
    check(hardWins >= 3 && hardLost === 0, `chess AI: 1800 beats 600 (${hardWins} of 4, none lost)`);
    // The rating: 400 to 2000 in hundreds, stronger all the way up.
    const steps = [];
    for (let e = 400; e <= 2000; e += 100) steps.push(CH.chessEloSettings(e));
    check(steps.length === 17 && steps.every((x, i) => !i || (x.depth >= steps[i - 1].depth && x.nodes > steps[i - 1].nodes && x.blunder <= steps[i - 1].blunder && x.noise <= steps[i - 1].noise)),
      'chess AI: each step of the rating looks at least as deep, at more positions, wobbling and slipping less');
    check(CH.chessElo(90) === 400 && CH.chessElo(2600) === 2000 && CH.chessElo(1234) === 1200 && CH.chessEloSettings(400).qdepth === 0 && CH.chessEloSettings(400).blunder > 0.2 && CH.chessEloSettings(2000).blunder === 0,
      'chess AI: 400 looks one move ahead with no captures after it and slips a quarter of the time; 2000 never slips');
    check(CH.chessEloBand(400) === 'beginner' && CH.chessEloBand(1000) === 'intermediate' && CH.chessEloBand(1500) === 'strong' && CH.chessEloBand(2000) === 'expert', 'chess AI: each rating has its name');
    let wins = 0, losses = 0;
    for (let game = 0; game < 4; game++) {
      const g = CH.chessNew();
      const upIs = game % 2;
      for (let ply = 0; ply < 300 && !CH.chessStatus(g).over; ply++) {
        const elo = g.turn === upIs ? 1400 : 400;
        CH.chessPlay(g, CH.chessBestMove(g, { elo, nodes: Math.min(CH.chessEloSettings(elo).nodes, 20000), rnd }));
      }
      const st = CH.chessStatus(g);
      if (st.result === (upIs ? 'b' : 'w')) wins++; else if (st.result && st.result !== 'd') losses++;
    }
    check(wins >= 3 && losses === 0, `chess AI: 1400 beats 400 (${wins} of 4, none lost)`);
  }

  // The coach: verdicts, the reasons, a hint, the accuracy and a review that comes out the same every time.
  {
    const same = { nodes: 20000, now: () => 0 };
    check(CH.chessClassify(0) === 'best' && CH.chessClassify(15) === 'best' && CH.chessClassify(30) === 'good' && CH.chessClassify(70) === 'inaccuracy' &&
      CH.chessClassify(150) === 'mistake' && CH.chessClassify(299) === 'mistake' && CH.chessClassify(300) === 'blunder' && CH.chessClassify(900) === 'blunder',
      'chess coach: the verdicts by centipawns lost: best up to 15, good under 50, inaccuracy under 100, mistake under 300, blunder from 300');
    check(Math.abs(CH.chessMoveAccuracy(40, 40) - 100) < 0.01 && CH.chessMoveAccuracy(0, -900) < 20 && CH.chessMoveAccuracy(900, 700) > CH.chessMoveAccuracy(100, -100),
      'chess coach: a move that keeps the score is 100% accurate; throwing a piece away is under 20%; losing a little in a won game costs less than in a level one');
    const qh4 = CH.chessReview({ start: '', moves: ['e2e4', 'e7e5', 'g1f3', 'd8h4', 'f3h4'] }, same);
    const blunder = qh4.moves[3];
    check(blunder.cls === 'blunder' && blunder.reasons[0].k === 'hang' && blunder.reasons[0].piece === 'q' && blunder.reasons[0].sq === 'h4' && blunder.best && blunder.best.san !== 'Qh4',
      'chess coach: a queen put where a knight takes it is a blunder, "your queen on h4 can be taken", with a better move');
    check(qh4.moves[4].cls === 'best' && qh4.moves[4].reasons[0].k === 'wins' && qh4.moves[4].reasons[0].piece === 'q', 'chess coach: taking it is the best move, and it wins the queen');
    const scholar = CH.chessReview({ start: '', moves: ['e2e4', 'e7e5', 'd1h5', 'b8c6', 'f1c4', 'g8f6', 'h5f7'] }, same);
    check(scholar.moves[5].cls === 'blunder' && scholar.moves[5].reasons[0].k === 'mate_allowed' && scholar.moves[5].reasons[0].n === 1,
      'chess coach: a move that allows mate in one is a blunder, and says so');
    check(scholar.key.some((k) => k.i === 5 && k.kind === 'turn'), 'chess coach: the blunder is a key moment (a turning point)');
    check(scholar.graph.length === 8 && scholar.graph[7] === 1000, 'chess coach: the graph has a point before the first move and after each, mate at the top');
    const g = CH.chessFromFen('r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4');
    const hint = CH.chessAnalyse(g, same);
    const why = CH.chessMoveGood(g, hint.move, hint);
    check(hint.move.from === 'h5' && hint.move.to === 'f7' && hint.mate === 1 && why[0].k === 'mate_in' && why[0].n === 1, 'chess coach: the hint finds the mate in one (Qxf7#) and says so');
    const perfect = { start: '', moves: [] };
    const pg = CH.chessNew();
    for (let i = 0; i < 12; i++) { const a = CH.chessAnalyse(pg, same); perfect.moves.push(CH.chessUci(a.move)); CH.chessPlay(pg, a.move); }
    const pr = CH.chessReview(perfect, same);
    check(pr.moves.every((m) => m.cls === 'best' || m.cls === 'brilliant') && pr.accuracy[0] > 99 && pr.accuracy[1] > 99, `chess coach: a game of the engine's own moves is ~100% accurate (${pr.accuracy.join(' / ')})`);
    const again = CH.chessReview({ start: '', moves: ['e2e4', 'e7e5', 'd1h5', 'b8c6', 'f1c4', 'g8f6', 'h5f7'] }, same);
    check(JSON.stringify(again) === JSON.stringify(scholar), 'chess coach: the review of a stored game comes out the same every time');
    const th = CH.chessThreats(CH.chessFromFen('rnb1kbnr/pppp1ppp/8/4p3/4P2q/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3'));
    check(th.w.join() === 'e4' && th.b.sort().join() === 'e5,h4', 'chess coach: the pieces in danger, each side (attacked and not defended, or by something cheaper)');
    const pins = CH.chessPins(CH.chessFromFen('4k3/8/8/8/1b6/8/3N4/4K3 w - - 0 1').board, 0);
    check(pins.length === 1 && pins[0].sq === 'd2' && pins[0].to === 'k', 'chess coach: a knight pinned to its king by a bishop is seen');
    // Multi-line analysis and computer styles
    const gMulti = CH.chessFromFen('r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/2NP1N2/PPP2PPP/R1BQK2R b KQkq - 0 5');
    const a1 = CH.chessAnalyse(gMulti, { depth: 3, lines: 1 });
    const a3 = CH.chessAnalyse(gMulti, { depth: 3, lines: 3 });
    check(a3.lines && a3.lines.length === 3 && a3.lines[0].from === a1.move.from && a3.lines[0].to === a1.move.to, 'chess coach: lines: 3 returns top 3 lines, first matching lines: 1');
    check(a3.lines[0].score >= a3.lines[1].score && a3.lines[1].score >= a3.lines[2].score, 'chess coach: lines: 3 lines sorted descending by score');
    const mStyle = CH.chessBestMove(gMulti, { elo: 1200, style: 'attack', depth: 2 });
    check(CH.chessLegalMoves(gMulti).some(m => m.from === mStyle.from && m.to === mStyle.to), 'chess AI: style attack plays a legal move');
  }

  // The room: two sit down, White moves first, winner stays on.
  const chRoom = (ids, payload) => {
    const r = newRoom(ids);
    applyRoomAction(r, ids[0], 'chooseGame', { game: 'chess' });
    applyRoomAction(r, ids[0], 'start', payload || {});
    return r;
  };
  const mv = (r, pid, m) => { const [from, to, promo] = m.split(/[-=]/); applyRoomAction(r, pid, 'move', { from, to, promo, move: r.shared.chess.moves }); };
  {
    let r = chRoom(['a', 'b', 'c'], {});
    let s = r.shared;
    const [W, B] = s.seats;
    const watcher = s.line[0];
    check(s.phase === 'play' && s.seats.length === 2 && s.line.length === 1 && s.settings.clock === 'off' && s.chess.clock === null && s.chess.g.turn === 0,
      'chess room: two sit down (seat 0 White), one waits, the clock is off by default');
    check(threwC(() => mv(r, B, 'e7-e5')), 'chess room: Black can\'t move first');
    check(threwC(() => mv(r, watcher, 'e2-e4')), 'chess room: someone in the line can\'t move');
    check(threwC(() => mv(r, W, 'e2-e5')), 'chess room: an illegal move is refused');
    mv(r, W, 'f2-f3');
    applyRoomAction(r, W, 'move', { from: 'f3', to: 'f4', move: 0 });
    check(r.shared.chess.moves === 1 && r.shared.chess.g.turn === 1, 'chess room: a second tap drawn for the board before is dropped');
    mv(r, B, 'e7-e5'); mv(r, W, 'g2-g4'); mv(r, B, 'd8-h4');
    s = r.shared;
    check(s.phase === 'over' && s.chess.result.reason === 'mate' && s.result.winnerId === B && s.chess.sans.join(' ') === 'f3 e5 g4 Qh4#',
      'chess room: mate ends the game; the move list is kept in algebraic notation');
    check(JSON.stringify(s.line) === JSON.stringify([watcher, W]) && s.scores[B] === 1, 'chess room: the winner scores, the loser goes to the back of the line');
    applyRoomAction(r, W, 'nextRound', { round: s.round });
    s = r.shared;
    check(s.phase === 'play' && s.seats[0] === watcher && s.seats[1] === B && s.chess.moves === 0, 'chess room: the next in line sits down with White against the champion');
    // A draw offered: once a move, answered by the other, declined by a move.
    const [W2, B2] = s.seats;
    applyRoomAction(r, W2, 'offerDraw', { move: 0 });
    check(s.chess.offer && s.chess.offer.seat === 0, 'chess room: a draw is offered');
    check(threwC(() => applyRoomAction(r, W2, 'offerDraw', { move: 0 })) && threwC(() => applyRoomAction(r, W2, 'answerDraw', { accept: true })),
      'chess room: you can\'t offer twice, or accept your own offer');
    applyRoomAction(r, B2, 'answerDraw', { accept: false });
    check(!r.shared.chess.offer && r.shared.phase === 'play', 'chess room: refused, the game goes on');
    check(threwC(() => applyRoomAction(r, W2, 'offerDraw', { move: 0 })), 'chess room: a new offer waits for your next move');
    mv(r, W2, 'e2-e4');
    applyRoomAction(r, W2, 'offerDraw', { move: 1 });
    mv(r, B2, 'e7-e5');
    check(!r.shared.chess.offer, 'chess room: moving instead of answering says no');
    applyRoomAction(r, B2, 'offerDraw', { move: 2 });
    applyRoomAction(r, W2, 'answerDraw', { accept: true });
    s = r.shared;
    check(s.phase === 'over' && s.chess.result.reason === 'agreed' && s.result.draw && s.champ === B2, 'chess room: accepted, a draw - and the champion keeps the seat');
    applyRoomAction(r, W2, 'nextRound', { round: s.round });
    s = r.shared;
    applyRoomAction(r, s.seats[1], 'resign', { round: s.round });
    check(r.shared.phase === 'over' && r.shared.chess.result.reason === 'resign' && r.shared.result.winnerId === r.shared.seats[0], 'chess room: resigning gives the game to the other');
    // The clock.
    r = chRoom(['a', 'b'], { clock: '3+2' });
    s = r.shared;
    check(s.settings.clock === '3+2' && s.chess.clock.left[0] === 180000 && roomDeadline(r) === null, 'chess room: the host\'s clock; it doesn\'t run before White\'s first move');
    mv(r, s.seats[0], 'e2-e4');
    const due = roomDeadline(r);
    check(due === s.chess.clock.at + 180000 + 601, 'chess room: after White\'s first move Black\'s time runs, on the server');
    clock = due + 1;
    roomTimeout(r, clock);
    check(r.shared.phase === 'over' && r.shared.chess.result.reason === 'time' && r.shared.result.winnerId === r.shared.seats[0], 'chess room: running out of time loses');
    r = chRoom(['a', 'b'], { clock: '5+0' });
    s = r.shared;
    mv(r, s.seats[0], 'e2-e4');
    s.chess.g = CH.chessFromFen('4k3/8/8/8/8/8/8/q3K3 b - - 0 1');
    clock = roomDeadline(r) + 1;
    roomTimeout(r, clock);
    check(r.shared.chess.result.reason === 'time' && r.shared.chess.result.result === 'd' && r.shared.result.draw,
      'chess room: out of time is only a draw when the other side has nothing to mate with');
    r = chRoom(['a', 'b'], { clock: '3+2' });
    s = r.shared;
    mv(r, s.seats[0], 'e2-e4');
    clock += 190000;
    mv(r, s.seats[1], 'e7-e5');
    check(r.shared.phase === 'over' && r.shared.chess.result.reason === 'time' && r.shared.chess.sans.length === 1, 'chess room: a move that arrives after the time ran out loses on time, and isn\'t played');
    // Leaving.
    r = chRoom(['a', 'b', 'c']);
    s = r.shared;
    const leaver = s.seats[0];
    r.players = r.players.filter((p) => p.id !== leaver);
    roomPlayerLeft(r, leaver, leaver);
    check(r.shared.phase === 'over' && r.shared.result.reason === 'left' && r.shared.result.winnerId === s.seats[1], 'chess room: a seated player who leaves loses by forfeit');
    // Whoever is still here deals it (the seats are drawn at random, so 'b' may be the one who left).
    applyRoomAction(r, r.players[0].id, 'nextRound', { round: r.shared.round });
    check(r.shared.phase === 'play' && r.shared.seats.indexOf(leaver) === -1, 'chess room: and the next game seats whoever is here');
    check(roomForcedMove(r) === null, 'chess room: a single legal move is never played for anyone (the move is the game)');
    // T2B.1 tests
    // Old phone sending only clock gets standard, no odds
    {
      const rLegacy = chRoom(['a', 'b'], { clock: '3+2' });
      check(rLegacy.shared.settings.clock === '3+2' && rLegacy.shared.settings.variant === 'standard' && rLegacy.shared.settings.odds === 'none',
        'chess room: old phone sending only clock gets standard, no odds');
    }
    // Room 960 game starts from legal 960 position and castle works
    {
      const r960 = chRoom(['a', 'b'], { variant: '960' });
      const s960 = r960.shared;
      check(s960.settings.variant === '960' && s960.chess.start && s960.chess.start !== START,
        'chess room: 960 game starts from a 960 position');
      const startP = CH.chessFromFen(s960.chess.start);
      check(startP.board.filter(x => x !== 0).length === 32, 'chess room: 960 start has 32 pieces');
      // Verify castling works on a 960 board in room
      const rCastle = chRoom(['a', 'b'], { variant: '960' });
      rCastle.shared.chess.g = CH.chessFromFen('4k3/8/8/8/8/8/8/6KR w H - 0 1');
      rCastle.shared.chess.start = '4k3/8/8/8/8/8/8/6KR w H - 0 1';
      mv(rCastle, rCastle.shared.seats[0], 'g1-g1');
      check(rCastle.shared.chess.last && rCastle.shared.chess.last.san === 'O-O', 'chess room: 960 castle works');
    }
    // Odds remove piece from champion's side only
    {
      const rOdds = chRoom(['a', 'b', 'c'], { odds: 'queen' });
      // Round 1: no champion yet, all pieces present
      check(rOdds.shared.chess.g.board.filter(x => x !== 0).length === 32, 'chess room odds: round 1 has no champion, all 32 pieces');
      const [w1, b1] = rOdds.shared.seats;
      // b1 wins round 1
      applyRoomAction(rOdds, w1, 'resign', { round: 1 });
      check(rOdds.shared.champ === b1, 'chess room odds: b1 is now champion');
      // Round 2: challenger sits with White, b1 with Black as champion
      applyRoomAction(rOdds, rOdds.players[0].id, 'nextRound', { round: 1 });
      const sRound2 = rOdds.shared;
      check(sRound2.seats[1] === b1, 'chess room odds: champion b1 sits with Black');
      const bBoard = sRound2.chess.g.board;
      // White (seat 0) has queen (piece 5), Black (seat 1, champion) has NO queen (piece 13)
      check(bBoard.some(p => p === 5), 'chess room odds: challenger has queen');
      check(!bBoard.some(p => p === 13), 'chess room odds: champion has no queen');
    }
  }
}

/* --- باغ هاوس: drops, the hands, promoted pieces, the computer's drops (Chess.js, 24 Sep 2026) --- */
{
  const BG = new Function(readFileSync(new URL('../../Chess.js', import.meta.url), 'utf8') +
    '\nreturn { chessBugNew, chessBugClone, chessBugDrops, chessBugLegal, chessBugStatus, chessBugPlay, chessBugGive, chessBugBotMove, chessBugHandCount, chessFromFen, chessPerft, chessPlay, chessLegalMoves };')();
  const bug = (fen, hands) => {
    const g = BG.chessBugNew(fen);
    Object.keys(hands || {}).forEach(side => Object.assign(g.hand[side], hands[side]));
    return g;
  };
  const dropsTo = (g, l) => BG.chessBugDrops(g).filter(d => d.drop === l).map(d => d.to);

  // Standard chess is untouched: a bughouse board with empty hands has the same moves.
  const g0 = BG.chessBugNew();
  check(BG.chessBugDrops(g0).length === 0 && BG.chessBugLegal(g0).length === 20 && BG.chessPerft(BG.chessFromFen(), 3) === 8902,
    'bughouse: empty hands - no drops, the start has its 20 moves, perft unchanged');

  // A pawn never on the first or last row; never onto a piece.
  const gp = bug('4k3/8/8/8/8/8/8/4K3 w - - 0 1', { w: { p: 1 } });
  const pawnTo = dropsTo(gp, 'p');
  check(pawnTo.length === 62 - 14 && !pawnTo.some(t => /[18]$/.test(t)), 'bughouse: a pawn drop is refused on the first and last rows');
  check(BG.chessBugPlay(BG.chessBugClone(gp), { drop: 'p', to: 'e8' }) === null && BG.chessBugPlay(BG.chessBugClone(gp), { drop: 'p', to: 'a1' }) === null,
    'bughouse: P@e8 and P@a1 are refused');
  const gn = bug('4k3/8/8/8/8/8/8/4K3 w - - 0 1', { w: { n: 1 } });
  check(BG.chessBugPlay(BG.chessBugClone(gn), { drop: 'n', to: 'e8' }) === null && dropsTo(gn, 'n').length === 62,
    'bughouse: a drop onto an occupied square is refused (a knight may go anywhere empty, rows 1 and 8 too)');
  check(BG.chessBugPlay(BG.chessBugClone(gn), { drop: 'q', to: 'd4' }) === null, 'bughouse: nothing is dropped that is not in the hand');

  // In check: only a drop that blocks.
  const gc = bug('4r1k1/8/8/8/8/8/8/4K3 w - - 0 1', { w: { n: 1 } });
  const blocks = dropsTo(gc, 'n');
  check(blocks.slice().sort().join() === 'e2,e3,e4,e5,e6,e7', 'bughouse: in check, a drop is allowed only between the rook and the king');
  check(BG.chessBugPlay(BG.chessBugClone(gc), { drop: 'n', to: 'a3' }) === null, 'bughouse: a drop that leaves the king in check is refused');

  // A drop that mates, and the SAN of a drop.
  const gm = bug('7k/6pp/8/8/8/8/8/4K3 w - - 0 1', { w: { r: 1 } });
  const cm = BG.chessBugClone(gm);
  const im = BG.chessBugPlay(cm, { drop: 'r', to: 'e8' });
  check(im && im.san === 'R@e8#' && im.status.over && im.status.result === 'w' && im.status.reason === 'mate' && cm.hand.w.r === 0 && cm.board[60] === 4,
    'bughouse: R@e8 is mate, written R@e8#, and the rook leaves the hand');
  // The same check with a knight in Black's hand is only check: it can be blocked by a drop.
  const gb = bug('7k/6pp/8/8/8/8/8/4K3 w - - 0 1', { w: { r: 1 }, b: { n: 1 } });
  const ib = BG.chessBugPlay(BG.chessBugClone(gb), { drop: 'r', to: 'e8' });
  check(ib && ib.san === 'R@e8+' && !ib.status.over, 'bughouse: a check that a piece in hand can block is not mate');
  const gnd = bug('4k3/8/8/8/8/8/8/4K3 w - - 0 1', { w: { n: 1 } });
  check(BG.chessBugPlay(BG.chessBugClone(gnd), { drop: 'n', to: 'f3' }).san === 'N@f3', 'bughouse: a knight dropped on f3 is written N@f3');
  // Mate by a contact check: no drop blocks a knight.
  const gk = bug('6rk/6pp/8/8/8/8/8/4K3 w - - 0 1', { w: { n: 1 }, b: { q: 1 } });
  const ik = BG.chessBugPlay(BG.chessBugClone(gk), { drop: 'n', to: 'f7' });
  check(ik && ik.status.over && ik.san === 'N@f7#', 'bughouse: a smothered mate by a dropped knight - a queen in hand can\'t block a knight');

  // A promoted queen taken goes over as a pawn; the mark travels with the piece.
  const gq = bug('4k3/1P6/8/8/8/8/1r6/4K3 w - - 0 1');
  const iq = BG.chessBugPlay(gq, { from: 'b7', to: 'b8', promo: 'q' });
  check(iq && iq.san === 'b8=Q+' && JSON.stringify(gq.promoted) === '[57]', 'bughouse: a pawn promoted on b8 is marked');
  const ix = BG.chessBugPlay(BG.chessBugClone(gq), { from: 'b2', to: 'b8' });
  check(ix && ix.capture === 'q' && ix.gives === 'p', 'bughouse: the promoted queen taken goes to the partner as a pawn');
  BG.chessBugPlay(gq, { from: 'e8', to: 'e7' });
  const iy = BG.chessBugPlay(gq, { from: 'b8', to: 'b2' });
  check(iy && iy.gives === 'r' && JSON.stringify(gq.promoted) === '[9]', 'bughouse: the promoted queen takes a rook (it goes over as a rook) and its mark moves with it');
  const iz = BG.chessBugPlay(BG.chessBugClone(gq), { from: 'e7', to: 'd7' });
  check(iz && !iz.gives, 'bughouse: a move that takes nothing gives nothing');

  // The hands after a sequence on two boards: what one side takes, its partner can drop.
  {
    const boards = [BG.chessBugNew(), BG.chessBugNew()];
    const play = (b, mv) => {
      const g = boards[b];
      const color = g.turn;
      const info = BG.chessBugPlay(g, mv);
      if (info && info.gives) BG.chessBugGive(boards, b, color, info.gives);
      return info;
    };
    play(0, { from: 'e2', to: 'e4' }); play(0, { from: 'd7', to: 'd5' });
    const t1 = play(0, { from: 'e4', to: 'd5' });
    check(t1.gives === 'p' && boards[1].hand.b.p === 1 && BG.chessBugHandCount(boards[1].hand.w) === 0 && BG.chessBugHandCount(boards[0].hand.w) === 0,
      'bughouse: White takes on board 1 - the pawn goes to Black\'s hand on board 2 (the partner)');
    play(0, { from: 'd8', to: 'd5' });
    check(boards[1].hand.w.p === 1, 'bughouse: Black takes back on board 1 - the pawn goes to White\'s hand on board 2');
    play(1, { from: 'e2', to: 'e4' });
    const d1 = play(1, { drop: 'p', to: 'e3' });
    check(d1 && d1.san === 'P@e3' && boards[1].hand.b.p === 0 && boards[1].board[20] === 9 && boards[1].turn === 0,
      'bughouse: Black on board 2 drops the pawn it was sent (P@e3), and it is White\'s move');
    const d2 = play(1, { drop: 'p', to: 'e5' });
    check(d2 && boards[1].hand.w.p === 0 && boards[1].board[36] === 1, 'bughouse: White on board 2 drops its pawn too');
    check(BG.chessBugPlay(BG.chessBugClone(boards[1]), { drop: 'p', to: 'd4' }) === null, 'bughouse: an empty hand drops nothing');
  }

  // A side with no move and nothing to drop waits (not a stalemate).
  const gs = bug('k7/2Q5/1K6/8/8/8/8/8 b - - 0 1');
  const ss = BG.chessBugStatus(gs);
  check(!ss.over && ss.stuck, 'bughouse: no move and nothing in hand, not in check: the side waits for a piece');
  gs.hand.b.n = 1;
  check(!BG.chessBugStatus(gs).stuck && BG.chessBugDrops(gs).length > 0, 'bughouse: a piece arrives, and the side can drop it');

  // The computer: a drop that mates first, and every move it makes is legal.
  const botMate = BG.chessBugBotMove(gm, { level: 'hard' });
  check(botMate && botMate.drop === 'r' && /[a-f]8/.test(botMate.to) && BG.chessBugPlay(BG.chessBugClone(gm), botMate).status.over,
    'bughouse computer (hard): a drop that mates is played first');
  const gd = bug('r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3', { w: { n: 1, b: 1 } });
  const botDrop = BG.chessBugBotMove(gd, { level: 'hard' });
  check(botDrop && BG.chessBugPlay(BG.chessBugClone(gd), botDrop) !== null, 'bughouse computer: with pieces in hand it plays a legal move or drop');
  {
    let seed = 7;
    const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    let illegal = 0, mates = 0, plies = 0, dropped = 0;
    for (let game = 0; game < 6; game++) {
      const boards = [BG.chessBugNew(), BG.chessBugNew()];
      let over = false;
      for (let n = 0; n < 240 && !over; n++) {
        const b = rnd() < 0.5 ? 0 : 1;
        const g = boards[b];
        const color = g.turn;
        const mv = BG.chessBugBotMove(g, { level: (game + b + color) % 2 ? 'hard' : 'easy', rnd: rnd });
        if (!mv) continue;              // waiting for a piece
        const info = BG.chessBugPlay(g, mv);
        if (!info) { illegal++; break; }
        plies++;
        if (info.drop) dropped++;
        if (info.gives) BG.chessBugGive(boards, b, color, info.gives);
        if (info.status.over) { over = true; mates++; }
      }
    }
    check(!illegal && plies > 300 && dropped > 10 && mates >= 3,
      `bughouse computer: six games of bots on two boards - every move and drop legal (${plies} plies, ${dropped} drops, ${mates} mates)`);
  }

  /* The room (RoomBughouse.js): four seats, two boards, the clocks, the computer players, leaving. */
  const bhRoom = (ids, payload) => {
    const r = newRoom(ids);
    applyRoomAction(r, ids[0], 'chooseGame', { game: 'bughouse' });
    applyRoomAction(r, ids[0], 'start', Object.assign({ botNames: ['Zizo', 'Bondo', 'Loza'] }, payload || {}));
    return r;
  };
  const bhMove = (r, pid, m) => {
    const k = r.shared.seats.indexOf(pid);
    const bd = r.shared.boards[k >> 1];
    const drop = /@/.test(m);
    const payload = drop ? { drop: m[0].toLowerCase(), to: m.slice(2), move: bd.moves } : { from: m.slice(0, 2), to: m.slice(3, 5), promo: m.slice(6), move: bd.moves };
    applyRoomAction(r, pid, drop ? 'drop' : 'move', payload);
  };
  const threwB = (fn) => { try { fn(); return false; } catch (e) { return true; } };
  {
    const r = bhRoom(['a', 'b', 'c', 'd']);
    const s = r.shared;
    check(s.phase === 'play' && s.seats.length === 4 && new Set(s.seats).size === 4 && !r.players.some(p => p.bot) && s.settings.clock === '3+0' &&
      s.boards.length === 2 && s.boards[0].clock.left[0] === 180000 && s.boards[1].clock.at === s.startAt,
      'bughouse room: four people, four seats, two boards, the 3+0 clock by default, running from the start on both boards');
    const [w1, b1, w2, b2] = s.seats;
    check(roomDeadline(r) === s.startAt + 180000 + 601, 'bughouse room: the server watches both clocks (White\'s, on both boards)');
    check(threwB(() => bhMove(r, b1, 'e7-e5')) && threwB(() => bhMove(r, w1, 'e2-e5')), 'bughouse room: Black can\'t move first, an illegal move is refused');
    clock += 4000;
    bhMove(r, w1, 'e2-e4');
    bhMove(r, w2, 'd2-d4');
    check(s.boards[0].moves === 1 && s.boards[1].moves === 1 && s.boards[0].g.turn === 1 && s.boards[1].g.turn === 1, 'bughouse room: the two boards move on their own');
    applyRoomAction(r, w1, 'move', { from: 'd2', to: 'd4', move: 0 });
    check(s.boards[0].moves === 1, 'bughouse room: a second tap drawn for the board before is dropped');
    bhMove(r, b1, 'd7-d5');
    bhMove(r, w1, 'e4-d5');
    check(s.boards[0].last.gives === 'p' && s.boards[1].g.hand.b.p === 1 && s.boards[0].g.hand.w.p === 0,
      'bughouse room: White takes on board 1, and the pawn goes to their partner, Black on board 2');
    bhMove(r, b2, 'P@e3');
    check(s.boards[1].g.board[20] === 9 && s.boards[1].g.hand.b.p === 0 && s.boards[1].sans[1] === 'P@e3', 'bughouse room: the partner drops it');
    check(threwB(() => bhMove(r, b2, 'P@e6')), 'bughouse room: nothing more to drop');
    check(threwB(() => bhMove(r, 'x', 'e2-e4')), 'bughouse room: someone not in the game can\'t move');
    // The clock: Black on board 1 has been thinking since White's capture.
    const due = roomDeadline(r);
    check(due === Math.min(s.boards[0].clock.at + s.boards[0].clock.left[1], s.boards[1].clock.at + s.boards[1].clock.left[0]) + 601,
      'bughouse room: the next flag is the sooner of the two boards');
    clock = due;
    roomTimeout(r, clock);
    check(s.phase === 'over' && s.result.reason === 'time' && s.result.board === 1 && s.result.seat === 2 && s.result.team === 'A' &&
      s.scores[w1] === 1 && s.scores[b2] === 1 && !s.scores[b1] && !s.scores[w2],
      'bughouse room: White on board 2 (a second spent on the first move) runs out first - their team loses, the other two score');
    check(s.boards.every(bd => bd.clock.at === null), 'bughouse room: the clocks stop when the game is over');
    // Play again: the partners turn round.
    const pairs = (x) => [[x.seats[0], x.seats[3]], [x.seats[1], x.seats[2]]].map(p => p.slice().sort().join('+')).sort().join(' / ');
    const before = pairs(s);
    applyRoomAction(r, 'a', 'playAgain', { round: 1 });
    check(s.phase === 'play' && s.round === 2 && pairs(s) !== before && s.boards[0].moves === 0, 'bughouse room: play again - new partners, new boards');
    applyRoomAction(r, 'a', 'playAgain', { round: 1 });
    check(s.round === 2, 'bughouse room: a play again drawn for the game before is dropped');
    const p2 = pairs(s);
    s.phase = 'over'; r.phase = 'over';
    applyRoomAction(r, 'a', 'playAgain', { round: 2 });
    const p3 = pairs(s);
    check(new Set([before, p2, p3]).size === 3, 'bughouse room: three games in a row, three different pairings');
  }
  {
    // A mate on either board wins for the team that gave it.
    const r = bhRoom(['a', 'b', 'c', 'd']);
    const s = r.shared;
    const [w1, b1] = s.seats;
    clock += 4000;
    ['f2-f3', 'e7-e5', 'g2-g4'].forEach((m, i) => bhMove(r, i % 2 ? b1 : w1, m));
    bhMove(r, b1, 'd8-h4');
    check(s.phase === 'over' && s.result.reason === 'mate' && s.result.team === 'B' && s.result.board === 0 && s.boards[0].sans[3] === 'Qh4#' &&
      s.scores[b1] === 1 && s.scores[s.seats[2]] === 1 && roomDeadline(r) === null, 'bughouse room: a mate on board 1 wins for Black\'s team, the clocks stop');
    check(threwB(() => bhMove(r, s.seats[2], 'e2-e4')) || s.boards[1].moves === 0, 'bughouse room: nothing moves once it is over');
  }
  {
    // One person: three computer players fill the seats and play; the host resigns in the end.
    const r = bhRoom(['a']);
    let s = r.shared;
    check(r.players.filter(p => p.bot).length === 3 && s.seats.indexOf('a') !== -1 && s.names.every(Boolean), 'bughouse room: one person - three computer players take the other seats');
    let steps = 0, aMoves = 0;
    // A computer player's move replaces room.shared (it is played on a copy): read it afresh each time.
    while ((s = r.shared).phase === 'play' && steps < 3000) {
      steps++;
      const k = s.seats.indexOf('a');
      const bd = s.boards[k >> 1];
      if (bd.g.turn === (k & 1) && steps % 3 === 0) {
        const mv = BG.chessBugBotMove(bd.g, { level: 'easy' });
        if (mv) { clock += 200; applyRoomAction(r, 'a', mv.drop ? 'drop' : 'move', Object.assign({ move: bd.moves }, mv)); aMoves++; continue; }
      }
      if (typeof r._botAt === 'number') { clock = Math.max(clock, r._botAt); roomTimeout(r, clock); continue; }
      const due = roomDeadline(r);
      if (due) { clock = Math.max(clock + 50, Math.min(due, clock + 800)); roomTimeout(r, clock); } else break;
    }
    const total = s.boards[0].moves + s.boards[1].moves;
    check(s.phase === 'over' && total >= 4 && aMoves >= 1 && !r._botFails,
      `bughouse room: a person and three computer players play a whole game (${total} moves, ended by ${s.result && s.result.reason})`);
  }
  {
    // Someone leaves mid-game: a computer player takes their board and the others finish.
    const r = bhRoom(['a', 'b', 'c', 'd']);
    const s = r.shared;
    const who = s.seats[1];
    r.players = r.players.filter(p => p.id !== who);
    roomPlayerLeft(r, who, who.toUpperCase());
    const sub = s.seats[1];
    check(s.phase === 'play' && sub !== who && r.players.some(p => p.id === sub && p.bot === 'hard') && s.subs[1] === who.toUpperCase() && s.names[1].indexOf(who.toUpperCase()) === 0,
      'bughouse room: a player who leaves is replaced on their board by a computer player, and the table is told whose board it is');
    clock += 4000;
    bhMove(r, s.seats[0], 'e2-e4');
    check(r._botPid === sub && typeof r._botAt === 'number', 'bughouse room: and the computer player takes its turn');
    clock = r._botAt; roomTimeout(r, clock);
    check(r.shared.boards[0].moves === 2, 'bughouse room: it moves for them');
  }
  {
    // Five people: four play and one watches; play again brings the watcher in.
    const r = bhRoom(['a', 'b', 'c', 'd', 'e']);
    const s = r.shared;
    const out = ['a', 'b', 'c', 'd', 'e'].find(id => s.seats.indexOf(id) === -1);
    check(!!out && !r.players.some(p => p.bot), 'bughouse room: five people - four play, one watches, no computer players');
    applyRoomAction(r, s.seats[0], 'resign', { round: 1 });
    check(s.phase === 'over' && s.result.reason === 'resign' && s.result.team === 'B', 'bughouse room: resigning loses for your team');
    applyRoomAction(r, 'a', 'playAgain', { round: 1 });
    check(s.seats.indexOf(out) !== -1, 'bughouse room: play again - whoever watched plays');
  }
  {
    // The host's "play for", and the clock options.
    const r = bhRoom(['a', 'b', 'c', 'd'], { clock: '5+0' });
    const s = r.shared;
    check(s.settings.clock === '5+0' && s.boards[0].clock.left[1] === 300000, 'bughouse room: the host\'s clock (5+0)');
    clock += 4000;
    applyRoomAction(r, 'a', 'skipTurn', { board: 1, move: 0 });
    check(s.boards[1].moves === 1 && s.boards[1].last.auto === 'host', 'bughouse room: the host plays one move for a quiet board');
    applyRoomAction(r, 'a', 'skipTurn', { board: 1, move: 0 });
    check(s.boards[1].moves === 1, 'bughouse room: a second tap for the same move is dropped');
    const notHost = s.seats.find(id => id !== 'a');
    check(threwB(() => applyRoomAction(r, notHost, 'skipTurn', { board: 0, move: 0 })), 'bughouse room: only the host plays for someone');
  }
}


/* --- إكس أو in rooms, and the duels' tournament (RoomTournament.js, 23 Sep 2026) ----- */
{
  const refused = (fn) => { try { fn(); return false; } catch (e) { return true; } };
  const people = (n) => 'abcdefghijkl'.split('').slice(0, n);
  const room = (game, ids, payload) => {
    const r = newRoom(ids);
    applyRoomAction(r, ids[0], 'chooseGame', { game });
    applyRoomAction(r, ids[0], 'start', payload || {});
    return r;
  };
  const toClock = (r) => { const d = roomDeadline(r); if (d === null) return false; clock = Math.max(clock + 1, d); return roomTimeout(r, clock); };

  // X-O in a room: winner stays, seat 0 is X, classic and 3 marks only.
  {
    const r = room('xo', ['a', 'b', 'c'], { three: false });
    const mark = (cell) => applyRoomAction(r, r.shared.seats[r.shared.turn], 'move', { cell, move: r.shared.moves });
    check(r.shared.phase === 'play' && r.shared.cells.length === 9 && r.shared.rule3 === false && r.shared.line.length === 1, 'xo room: two sit down on an empty board, one waits in line');
    mark(4);
    check(r.shared.cells[4] === 'X' && r.shared.turn === 1, 'xo room: the first seat plays X, and the turn passes');
    check(refused(() => applyRoomAction(r, r.shared.seats[1], 'move', { cell: 4, move: 1 })), 'xo room: a square already taken is refused');
    const before = r.shared.moves;
    applyRoomAction(r, r.shared.seats[1], 'move', { cell: 0, move: 0 });
    check(r.shared.moves === before, 'xo room: a tap drawn for a board that has moved on is dropped');
    // A draw: X 4 0? played above; finish a known draw from a fresh board instead.
    const d = room('xo', ['a', 'b'], {});
    const dm = (cell) => applyRoomAction(d, d.shared.seats[d.shared.turn], 'move', { cell, move: d.shared.moves });
    [0, 1, 2, 4, 3, 5, 7, 6, 8].forEach(dm);
    check(d.shared.phase === 'over' && d.shared.result.draw && d.shared.result.reason === 'full', 'xo room: a full board with no line is a draw');
    const w = room('xo', ['a', 'b'], { three: true });
    const wm = (cell) => applyRoomAction(w, w.shared.seats[w.shared.turn], 'move', { cell, move: w.shared.moves });
    [0, 3, 1, 4, 8, 7].forEach(wm);                       // X 0 1 8, O 3 4 7
    check(w.shared.rule3 && w.shared.order.X.join() === '0,1,8' && w.shared.order.O.join() === '3,4,7', 'xo room: 3 marks only keeps each side\'s marks, oldest first');
    check(refused(() => wm(0)), 'xo room: the new mark can\'t go on the square of the one about to leave');
    wm(2);                                                 // X's fourth: 0 goes
    check(w.shared.cells[0] === '' && w.shared.cells[2] === 'X' && w.shared.last.gone === 0 && w.shared.order.X.join() === '1,8,2',
      'xo room: a fourth mark takes the place of the oldest');
    wm(5);                                                 // O: 3 goes, 4 5 7 - no line
    wm(0);                                                 // X: 1 goes -> 8 2 0: no line
    check(w.shared.phase === 'play', 'xo room: with 3 marks only the game goes on past a full count');
    let guard = 0;
    while (w.shared.phase === 'play' && guard++ < 400) {
      const free = w.shared.cells.map((v, i) => (v ? -1 : i)).filter((i) => i >= 0);
      try { wm(free[Math.floor(Math.random() * free.length)]); } catch (e) {}
    }
    check(w.shared.phase === 'over' && !w.shared.result.draw && w.shared.win.length === 3, 'xo room: 3 marks only ends on a line, never a draw');
  }

  // The switch: four people or more, and not with three people and a computer player.
  {
    const three = newRoom(['a', 'b', 'c']);
    applyRoomAction(three, 'a', 'chooseGame', { game: 'connect4' });
    check(refused(() => applyRoomAction(three, 'a', 'start', { tournament: true })) && three.phase === 'lobby', 'tournament: the server refuses one with fewer than four people');
    const gw = newRoom(['a', 'b', 'c']);
    applyRoomAction(gw, 'a', 'chooseGame', { game: 'guesswho' });
    applyRoomAction(gw, 'a', 'addBot', { level: 'easy', name: 'Robo' });
    check(refused(() => applyRoomAction(gw, 'a', 'start', { tournament: true })), 'tournament: computer players don\'t count toward the four');
    const four = newRoom(people(4));
    applyRoomAction(four, 'a', 'chooseGame', { game: 'connect4' });
    check(refused(() => applyRoomAction(four, 'b', 'start', { tournament: true })), 'tournament: only the host starts one');
    applyRoomAction(four, 'a', 'start', { tournament: true, mode: 5 });
    check(!!four.shared.tour && four.shared.tour.size === 4 && four.shared.tour.rounds === 2 && four.phase === 'play' && four.shared.settings.mode === 5,
      'tournament: four people make a bracket of four, two rounds, with the lobby choices for every match');
  }

  // Brackets from 4 to 12: the byes of a seeded draw, everyone plays until out, one champion.
  {
    let byesRight = true, playedOut = true, oneChamp = true, points = true, simultaneous = true, noLeak = true;
    for (let n = 4; n <= 12; n++) {
      for (const game of ['connect4', 'dots', 'xo']) {
        const r = room(game, people(n), { tournament: true, size: 4 });
        const t = r.shared.tour;
        let size = 2; while (size < n) size *= 2;
        const r1 = t.matches.filter((m) => m.r === 1);
        if (t.size !== size || r1.filter((m) => m.out[0] || m.out[1]).length !== size - n || r1.some((m) => m.out[0] && m.out[1])) byesRight = false;
        if (r1.filter((m) => m.p[0] && m.p[1]).length > 1 && r1.filter((m) => m.state === 'ready').length < 2) simultaneous = false;
        for (let guard = 0; guard < 8000 && r.shared.tour.phase === 'play'; guard++) {
          const live = r.shared.tour.matches.filter((m) => m.state === 'play');
          if (!live.length) { toClock(r); continue; }
          if (live.length > 1 && guard % 5 === 0) {
            // Two matches at once: a move in one leaves the other's board as it was.
            const other = JSON.stringify(r.shared.games[live[1].id]);
            const g = r.shared.games[live[0].id];
            try { applyRoomAction(r, g.seats[g.turn], 'move', { col: 3, cell: g.cells ? g.cells.indexOf('') : 0, edge: g.lines ? g.lines.indexOf(0) : 0, move: g.moves, match: live[0].id, mg: live[0].games }); } catch (e) {}
            if (JSON.stringify(r.shared.games[live[1].id]) !== other) simultaneous = false;
            continue;
          }
          for (const m of live) {
            const g = r.shared.games[m.id];
            const pid = g.seats[g.turn];
            const pay = { move: g.moves, match: m.id, mg: m.games };
            if (game === 'connect4') pay.col = Math.floor(Math.random() * g.cols);
            if (game === 'xo') { const f = g.cells.map((v, i) => (v ? -1 : i)).filter((i) => i >= 0); pay.cell = f[Math.floor(Math.random() * f.length)]; }
            if (game === 'dots') { const f = g.lines.map((v, i) => (v ? -1 : i)).filter((i) => i >= 0); pay.edge = f[Math.floor(Math.random() * f.length)]; }
            try { applyRoomAction(r, pid, 'move', pay); } catch (e) {}
          }
        }
        const T = r.shared.tour;
        if (T.phase !== 'over' || !T.champion) { oneChamp = false; continue; }
        const losses = {};
        T.matches.forEach((m) => { if (m.loser) losses[m.loser] = (losses[m.loser] || 0) + 1; });
        T.entrants.forEach((id) => {
          const lost = T.matches.find((m) => m.loser === id);
          if (id === T.champion) { if (lost) playedOut = false; }
          else if (!lost || losses[id] !== 1 || T.matches.some((m) => m.p.indexOf(id) !== -1 && m.r > lost.r)) playedOut = false;
        });
        if (T.matches.filter((m) => !m.next)[0].winner !== T.champion) oneChamp = false;
        const sc = r.shared.scores;
        if (sc[T.champion] !== 3 || sc[T.runnerUp] !== 2 || T.semis.some((id) => sc[id] !== 1) || T.semis.length !== 2) points = false;
        if (Object.keys(r.shared.games).length > 2) noLeak = false;
      }
    }
    check(byesRight, 'tournament: 4 to 12 players, the next power of two, one bye for every missing player and never two in one first-round match');
    check(simultaneous, 'tournament: the matches of a round start together and a move in one leaves the other alone');
    check(playedOut, 'tournament: everyone plays until they lose once, and the champion never loses');
    check(oneChamp, 'tournament: every bracket, three games, ends with exactly one champion, the final\'s winner');
    check(points, 'tournament: 3 to the champion, 2 to the runner-up, 1 to each semi-finalist');
    check(noLeak, 'tournament: a match\'s board goes once both its players have moved on');
  }

  // A draw is replayed with the other player starting, until someone wins.
  {
    const r = room('xo', people(4), { tournament: true, three: false });
    toClock(r);
    const m = r.shared.tour.matches.find((x) => x.state === 'play');
    const g0 = r.shared.games[m.id];
    const firstSeats = g0.seats.slice();
    const play = (cell) => { const g = r.shared.games[m.id]; applyRoomAction(r, g.seats[g.turn], 'move', { cell, move: g.moves, match: m.id, mg: m.games }); };
    [0, 1, 2, 4, 3, 5, 7, 6, 8].forEach(play);
    const mm = r.shared.tour.matches.find((x) => x.id === m.id);
    check(mm.state === 'ready' && mm.draws === 1 && r.shared.games[m.id].result.draw, 'tournament: a drawn game is not the end of the match');
    check(r.shared.tour.matches.find((x) => x.id === mm.next).p[mm.slot] === null, 'tournament: nobody goes through on a draw');
    clock = mm.startAt + 1;
    roomTimeout(r, clock);
    const g1 = r.shared.games[m.id];
    check(mm.games === 2 && g1.phase === 'play' && g1.seats[0] === firstSeats[1] && g1.seats[1] === firstSeats[0],
      'tournament: the replay deals a fresh board, the other player starting');
    const before = g1.moves;
    try { applyRoomAction(r, g1.seats[0], 'move', { cell: 0, move: 0, match: m.id, mg: 1 }); } catch (e) {}
    check(r.shared.games[m.id].moves === before, 'tournament: a tap for the drawn game (the old game number) is dropped');
    [0, 3, 1, 4, 2].forEach(play);
    check(mm.state === 'done' && mm.winner === firstSeats[1] && mm.draws === 1, 'tournament: the replay\'s winner goes through');
    check(refused(() => applyRoomAction(r, 'a', 'move', { cell: 0, match: 'm99' })), 'tournament: a move for a match that doesn\'t exist is refused');
  }

  // Leaving: a match being played, one about to start, a bye, and both players of one match.
  {
    const leave = (r, id) => { r.players = r.players.filter((p) => p.id !== id); roomPlayerLeft(r, id, id); };
    const r = room('connect4', people(5), { tournament: true });
    const t = r.shared.tour;
    const ready = t.matches.find((m) => m.r === 1 && m.state === 'ready');
    const byeMatch = t.matches.find((m) => m.r === 1 && (m.out[0] || m.out[1]));
    const byePlayer = byeMatch.p.find(Boolean);
    leave(r, ready.p[0]);
    check(ready.state === 'done' && ready.winner === ready.p[1] && ready.reason === 'left', 'tournament: leaving before your match starts hands it over');
    leave(r, byePlayer);
    const next = t.matches.find((m) => m.id === byeMatch.next);
    toClock(r);
    check(t.gone[byePlayer] && (next.state === 'done' ? next.winner !== byePlayer : next.p.indexOf(byePlayer) !== -1),
      'tournament: someone with a bye who leaves is out of the match they would have played');
    for (let guard = 0; guard < 50 && t.phase === 'play' && !t.matches.some((m) => m.state === 'play'); guard++) toClock(r);
    const live = t.matches.find((m) => m.state === 'play');
    if (live) {
      const g = r.shared.games[live.id];
      leave(r, g.seats[0]);
      check(live.state === 'done' && live.winner === g.seats[1] && r.shared.games[live.id].result.reason === 'left',
        'tournament: leaving mid-game loses the match by forfeit');
    }
    // Both players of a match leave: the first hands it to the other, who is then gone from the final.
    const r2 = room('connect4', people(4), { tournament: true });
    const t2 = r2.shared.tour;
    const [m1, m2] = t2.matches.filter((m) => m.r === 1);
    const [x1, y1] = m1.p;
    leave(r2, x1);
    leave(r2, y1);
    const fin = t2.matches.find((m) => !m.next);
    check(m1.state === 'done' && m1.winner === y1 && t2.gone[y1] && fin.p[m1.slot] === y1,
      'tournament: both players of a match leave: the first hands it to the other, who is marked gone');
    toClock(r2);
    const g2 = r2.shared.games[m2.id];
    applyRoomAction(r2, g2.seats[0], 'move', { col: 0, move: g2.moves, match: m2.id, mg: m2.games });
    // The rest of the semi, won by whoever:
    for (let guard = 0; guard < 200 && m2.state === 'play'; guard++) {
      const g = r2.shared.games[m2.id];
      try { applyRoomAction(r2, g.seats[g.turn], 'move', { col: Math.floor(Math.random() * 7), move: g.moves, match: m2.id, mg: m2.games }); } catch (e) {}
    }
    check(t2.phase === 'over' && t2.champion === m2.winner && fin.reason === 'left',
      'tournament: the other semi\'s winner walks over the final and is champion');
    // Nobody left on one side of a final: an empty slot, and the other side goes through.
    const r3 = room('connect4', people(4), { tournament: true });
    const t3 = r3.shared.tour;
    const fin3 = t3.matches.find((m) => !m.next);
    const [s1, s2] = t3.matches.filter((m) => m.r === 1);
    // Every player of the first semi leaves while its game is being played: the forfeit's winner leaves too.
    toClock(r3);
    const g3 = r3.shared.games[s1.id];
    leave(r3, g3.seats[0]);
    leave(r3, g3.seats[1]);
    leave(r3, s2.p[0]);
    check(t3.phase === 'over' && t3.champion === s2.p[1] && fin3.winner === s2.p[1],
      'tournament: with everyone else gone, the last one standing is champion');
  }

  // Guess who and battleship: each match's secrets stay with that match's two phones.
  {
    const r = room('guesswho', people(6), { tournament: true, size: 16 });
    toClock(r);
    const t = r.shared.tour;
    const live = t.matches.filter((m) => m.state === 'play');
    let own = live.length === 2;
    live.forEach((m) => {
      const g = r.shared.games[m.id];
      const secret = r._tourHidden[m.id]._gw.secret;
      g.seats.forEach((pid, k) => { if (!r.secrets[pid] || r.secrets[pid].tm !== m.id || r.secrets[pid].face !== secret[k]) own = false; });
      if (JSON.stringify(g).indexOf('secret') !== -1 || g.reveal) own = false;
    });
    const watchers = r.players.map((p) => p.id).filter((id) => !live.some((m) => m.p.indexOf(id) !== -1));
    check(own && watchers.every((id) => !r.secrets[id]), 'tournament (guess who): each seated phone holds its own match\'s face, a phone with a bye none');
    // Play them all out with the server answering (the host's play for).
    for (let guard = 0; guard < 4000 && t.phase === 'play'; guard++) {
      const m = t.matches.find((x) => x.state === 'play');
      if (!m) { toClock(r); continue; }
      const g = r.shared.games[m.id];
      const me = g.seats[g.turn];
      try {
        if (g.stage === 'answer') applyRoomAction(r, 'a', 'skipTurn', { seq: g.turnSeq, match: m.id, mg: m.games });
        else if (g.stage === 'flip') applyRoomAction(r, me, 'done', { seq: g.turnSeq, match: m.id, mg: m.games });
        else applyRoomAction(r, me, 'guess', { face: Math.floor(Math.random() * g.faces.length), seq: g.turnSeq, match: m.id, mg: m.games });
      } catch (e) {}
    }
    check(t.phase === 'over' && !!t.champion, 'tournament (guess who): six players play to a champion');
    const b = room('battleship', people(5), { tournament: true, turnClock: 15 });
    for (let guard = 0; guard < 6000 && b.shared.tour.phase === 'play'; guard++) toClock(b);
    check(b.shared.tour.phase === 'over' && !!b.shared.tour.champion, 'tournament (battleship): five players, every shot the clock\'s, to a champion');
  }

  // After the end: the host deals a new tournament (points kept) or goes back to winner stays (banked).
  {
    const r = room('connect4', people(4), { tournament: true });
    const t = r.shared.tour;
    for (let guard = 0; guard < 3000 && t.phase === 'play'; guard++) {
      const m = t.matches.find((x) => x.state === 'play');
      if (!m) { toClock(r); continue; }
      const g = r.shared.games[m.id];
      try { applyRoomAction(r, g.seats[g.turn], 'move', { col: Math.floor(Math.random() * 7), move: g.moves, match: m.id, mg: m.games }); } catch (e) {}
    }
    const champ = t.champion;
    check(refused(() => applyRoomAction(r, 'b', 'tourNew', { mode: 'tour', round: r.shared.round })), 'tournament: only the host deals the next one');
    applyRoomAction(r, 'a', 'tourFeature', { match: 'm0' });
    applyRoomAction(r, 'a', 'tourNew', { mode: 'tour', round: r.shared.round });
    check(r.shared.tour.no === 2 && r.shared.tour.phase === 'play' && r.shared.scores[champ] === 3 && r.shared.board[0].id === champ,
      'tournament: a new one is a new draw, the points of the last one kept');
    applyRoomAction(r, 'a', 'tourNew', { mode: 'tour', round: 1 });
    check(r.shared.tour.no === 2, 'tournament: a second tap for the same new tournament is dropped');
    // A tap that says what it saw is dropped quietly until the tournament is over (a double tap on the
    // switch lands here); one that says nothing is refused.
    const tourBefore = r.shared.tour;
    applyRoomAction(r, 'a', 'tourNew', { mode: 'stay', round: r.shared.round });
    check(r.shared.tour === tourBefore && r.shared.tour.phase === 'play' && refused(() => applyRoomAction(r, 'a', 'tourNew', { mode: 'stay' })),
      'tournament: nothing to switch to until it is over');
    const t2 = r.shared.tour;
    for (let guard = 0; guard < 3000 && t2.phase === 'play'; guard++) {
      const m = t2.matches.find((x) => x.state === 'play');
      if (!m) { toClock(r); continue; }
      const g = r.shared.games[m.id];
      try { applyRoomAction(r, g.seats[g.turn], 'move', { col: Math.floor(Math.random() * 7), move: g.moves, match: m.id, mg: m.games }); } catch (e) {}
    }
    applyRoomAction(r, 'a', 'tourNew', { mode: 'stay', round: r.shared.round });
    check(!r.shared.tour && r.shared.phase === 'play' && r.shared.seats.length === 2 && r.shared.line.length === 2 && Object.keys(r.night || {}).length > 0,
      'tournament: back to winner stays, with the tournaments banked on the night\'s leaderboard');
    // And from winner stays, a tournament.
    const g = r.shared;
    for (let guard = 0; guard < 200 && g.phase === 'play'; guard++) { try { applyRoomAction(r, g.seats[g.turn], 'move', { col: Math.floor(Math.random() * 7), move: g.moves }); } catch (e) {} }
    applyRoomAction(r, 'a', 'tourNew', { mode: 'tour', round: r.shared.round });
    check(r.shared.tour && r.shared.tour.no === 1 && Object.keys(r.shared.scores).length === 0, 'tournament: from winner stays, a tournament starts its points afresh');
  }
}

/* --- شطرنج in the duels' tournament (TOUR_KINDS.chess, 23 Sep 2026) ------------------------ */
{
  const CHT = new Function(readFileSync(new URL('../../Chess.js', import.meta.url), 'utf8') + '\nreturn { chessLegalMoves };')();
  const refused = (fn) => { try { fn(); return false; } catch (e) { return true; } };
  const people = (n) => 'abcdefghijkl'.split('').slice(0, n);
  const room = (ids, payload) => {
    const r = newRoom(ids);
    applyRoomAction(r, ids[0], 'chooseGame', { game: 'chess' });
    applyRoomAction(r, ids[0], 'start', payload || {});
    return r;
  };
  const toClock = (r) => { const d = roomDeadline(r); if (d === null) return false; clock = Math.max(clock + 1, d); return roomTimeout(r, clock); };
  const leave = (r, id) => { r.players = r.players.filter((p) => p.id !== id); roomPlayerLeft(r, id, id); };
  const live = (r) => r.shared.tour.matches.filter((m) => m.state === 'play');
  const upOf = (r, m) => { const g = r.shared.games[m.id]; return g.seats[g.chess.g.turn]; };
  const act = (r, m, pid, action, extra) => applyRoomAction(r, pid, action, Object.assign({ match: m.id, mg: m.games, move: r.shared.games[m.id].chess.moves, round: r.shared.games[m.id].round }, extra || {}));
  const randomMove = (r, m) => {
    const g = r.shared.games[m.id];
    const all = CHT.chessLegalMoves(g.chess.g);
    const mv = all[Math.floor(Math.random() * all.length)];
    act(r, m, upOf(r, m), 'move', { from: mv.from, to: mv.to, promo: mv.promo || 'q' });
  };
  const drawAgreed = (r, m) => {
    // Two moves, so the offer isn't the first thing on the board, then a draw offered and accepted.
    randomMove(r, m); randomMove(r, m);
    const g = r.shared.games[m.id];
    const offerer = g.seats[g.chess.g.turn];
    act(r, m, offerer, 'offerDraw');
    act(r, m, g.seats.find((id) => id !== offerer), 'answerDraw', { accept: true });
  };
  const toLive = (r) => { for (let i = 0; i < 20 && r.shared.tour.phase === 'play' && !live(r).length; i++) toClock(r); return live(r); };

  // The switch: four people or more.
  const three = newRoom(people(3));
  applyRoomAction(three, 'a', 'chooseGame', { game: 'chess' });
  check(refused(() => applyRoomAction(three, 'a', 'start', { tournament: true })) && three.phase === 'lobby', 'chess tournament: refused with fewer than four people');

  // Five players: byes, every match on its own board, to a champion (moves, then a resignation).
  {
    const r = room(people(5), { tournament: true, clock: '5+0' });
    const t = r.shared.tour;
    check(t.size === 8 && t.matches.filter((m) => m.r === 1 && (m.out[0] || m.out[1])).length === 3 && r.shared.settings.clock === '5+0',
      'chess tournament: five players, a bracket of eight with three byes, the clock for every match');
    toLive(r);
    const first = live(r)[0];
    const g0 = r.shared.games[first.id];
    check(!!g0.chess && g0.chess.clock && g0.chess.clock.id === '5+0' && !g0.chess.armageddon && first.whites.length === 1 && first.whites[0] === g0.seats[0],
      'chess tournament: a match is a fresh board with the match\'s clock, White the first seat');
    let n = 0, playedAll = true;
    for (let guard = 0; guard < 4000 && t.phase === 'play'; guard++) {
      const ms = live(r);
      if (!ms.length) { toClock(r); continue; }
      for (const m of ms) {
        const g = r.shared.games[m.id];
        if (g.chess.moves >= 12) { act(r, m, g.seats[n++ % 2], 'resign'); continue; }
        try { randomMove(r, m); } catch (e) { playedAll = false; }
      }
    }
    check(playedAll && t.phase === 'over' && !!t.champion && r.shared.scores[t.champion] === 3, 'chess tournament: five players play to a champion');
    check(t.matches.filter((m) => m.state === 'done' && m.loser).every((m) => m.reason === 'won'), 'chess tournament: a resignation decides its match');
  }

  // A draw: replayed with the colours swapped; drawn again, Armageddon, where a draw is Black's.
  {
    const r = room(people(4), { tournament: true });
    const m = toLive(r)[0];
    const other = live(r).find((x) => x.id !== m.id);
    const otherBefore = JSON.stringify(r.shared.games[other.id]);
    const white1 = r.shared.games[m.id].seats[0];
    drawAgreed(r, m);
    check(m.state === 'ready' && m.draws === 1 && r.shared.games[m.id].result.draw && JSON.stringify(r.shared.games[other.id]) === otherBefore,
      'chess tournament: an agreed draw in one match is not its end, and leaves the other match alone');
    for (let i = 0; i < 5 && m.state !== 'play'; i++) toClock(r);
    const g2 = r.shared.games[m.id];
    check(m.games === 2 && g2.seats[1] === white1 && g2.seats[0] !== white1 && !g2.chess.armageddon && g2.chess.moves === 0,
      'chess tournament: the replay swaps the colours (the first game\'s White has Black)');
    drawAgreed(r, m);
    for (let i = 0; i < 5 && m.state !== 'play'; i++) toClock(r);
    const g3 = r.shared.games[m.id];
    check(m.games === 3 && m.draws === 2 && g3.chess.armageddon === true && m.whites.length === 3 && m.whites[2] === g3.seats[0],
      'chess tournament: drawn again, the third game is Armageddon, White drawn by lot');
    drawAgreed(r, m);
    const g3b = r.shared.games[m.id];
    check(m.state === 'done' && m.winner === g3b.seats[1] && g3b.result.winner === 1 && g3b.chess.result.drawn === true && g3b.chess.result.result === 'b',
      'chess tournament: a draw in Armageddon sends Black through');
    check(r.shared.tour.matches.find((x) => x.id === m.next).p[m.slot] === g3b.seats[1], 'chess tournament: Black takes the slot in the next round');
  }

  // Tournament keeps one 960 position through a replay
  {
    const rTour960 = room(people(4), { tournament: true, variant: '960' });
    const m960 = toLive(rTour960)[0];
    const g1 = rTour960.shared.games[m960.id];
    const start960 = g1.chess.start;
    check(start960 && m960.start960 === start960, 'chess tournament: 960 position stored on match');
    drawAgreed(rTour960, m960);
    for (let i = 0; i < 5 && m960.state !== 'play'; i++) toClock(rTour960);
    const g2 = rTour960.shared.games[m960.id];
    check(g2.chess.start === start960, 'chess tournament: the tournament keeps one 960 position through a replay');
    drawAgreed(rTour960, m960);
    for (let i = 0; i < 5 && m960.state !== 'play'; i++) toClock(rTour960);
    const g3 = rTour960.shared.games[m960.id];
    check(g3.chess.start === start960 && g3.chess.armageddon === true, 'chess tournament: the tournament keeps one 960 position into Armageddon');
  }

  // The clock per match: a flag ends that match only.
  {
    const r = room(people(4), { tournament: true, clock: '3+2' });
    const [m, other] = toLive(r);
    randomMove(r, m); randomMove(r, m);                // White's first move is free; Black's starts White's clock
    const d = roomDeadline(r);
    const cg = r.shared.games[m.id].chess;
    check(typeof d === 'number' && d === cg.clock.at + cg.clock.left[0] + 601, 'chess tournament: the room wakes for the soonest match clock');
    const whiteId = r.shared.games[m.id].seats[0];
    toClock(r);
    check(m.state === 'done' && m.loser === whiteId && r.shared.games[m.id].chess.result.reason === 'time' && other.state === 'play',
      'chess tournament: a flag loses that match, and the other plays on');
  }

  // Resign, a draw offer and the host's "play for", match by match; a stale tap; leaving.
  {
    const r = room(people(4), { tournament: true });
    const [m, other] = toLive(r);
    const g = r.shared.games[m.id];
    const og = r.shared.games[other.id];
    check(refused(() => act(r, m, og.seats[0], 'offerDraw')) && !r.shared.games[m.id].chess.offer, 'chess tournament: a player offers no draw in a match not their own');
    act(r, m, g.seats[0], 'offerDraw');
    check(!!r.shared.games[m.id].chess.offer && !r.shared.games[other.id].chess.offer, 'chess tournament: a draw offer stays on its own board');
    act(r, m, g.seats[1], 'answerDraw', { accept: false });
    check(!r.shared.games[m.id].chess.offer && m.state === 'play', 'chess tournament: a refused offer and the game goes on');
    const nonHost = r.shared.games[other.id].seats.find((id) => id !== 'a') || 'b';
    check(refused(() => act(r, other, nonHost, 'skipTurn')), 'chess tournament: only the host plays for someone');
    act(r, other, 'a', 'skipTurn');
    const og2 = r.shared.games[other.id];
    check(og2.chess.moves === 1 && og2.chess.last.auto === 'host', 'chess tournament: the host\'s "play for" plays a legal move in that match');
    applyRoomAction(r, 'a', 'skipTurn', { match: other.id, mg: other.games, move: 0 });
    check(r.shared.games[other.id].chess.moves === 1, 'chess tournament: a second "play for" drawn for the last move is dropped');
    act(r, m, g.seats[1], 'resign');
    check(m.state === 'done' && m.winner === g.seats[0] && other.state === 'play', 'chess tournament: resigning loses that match only');
    const og3 = r.shared.games[other.id];
    const winnerLeft = og3.seats[1];
    leave(r, og3.seats[0]);
    check(other.state === 'done' && other.winner === winnerLeft && r.shared.games[other.id].result.reason === 'left',
      'chess tournament: leaving mid-game loses the match by forfeit');
  }

  // The host's "play for" in winner stays too.
  {
    const r = room(people(3), {});
    const s = r.shared;
    applyRoomAction(r, 'a', 'skipTurn', { move: 0 });
    check(s.chess.moves === 1 && s.chess.last.auto === 'host', 'chess room: the host can play for the side to move');
    check(refused(() => applyRoomAction(r, 'b', 'skipTurn', { move: 1 })), 'chess room: only the host plays for someone');
  }
}

/* The audit of 23 Sep 2026: the rules fixed after it. */
{
  const refused = (fn) => { try { fn(); return false; } catch (e) { return true; } };
  const src = (f) => readFileSync(new URL('../../' + f, import.meta.url), 'utf8');
  const leave = (r, id) => {
    r.players = r.players.filter((p) => p.id !== id);
    if (r.hostId === id) r.hostId = r.players[0].id;
    roomPlayerLeft(r, id, id.toUpperCase());
  };
  const start = (game, ids, payload) => {
    const r = newRoom(ids);
    applyRoomAction(r, ids[0], 'chooseGame', { game });
    applyRoomAction(r, ids[0], 'start', payload || {});
    return r;
  };

  // Hangman: someone before the writer in the order leaves - the order carries on without a skip.
  {
    const r = start('hangman', ['a', 'b', 'c', 'd'], { rounds: 10 });
    const s = r.shared;
    const ord = s.order.slice();
    check(s.setter === ord[0], 'audit/hangman: the first in the order writes first');
    applyRoomAction(r, ord[0], 'setWord', { word: 'قطة', round: 1 });
    applyRoomAction(r, r.hostId, 'closeWord', { round: 1 });
    applyRoomAction(r, r.hostId, 'nextRound', { round: 1 });
    check(s.setter === ord[1], 'audit/hangman: then the second');
    leave(r, ord[0]);
    applyRoomAction(r, ord[1], 'setWord', { word: 'بيت', round: 2 });
    applyRoomAction(r, r.hostId, 'closeWord', { round: 2 });
    applyRoomAction(r, r.hostId, 'nextRound', { round: 2 });
    check(s.setter === ord[2], 'audit/hangman: one who wrote earlier leaves - the next writer is the next in the order, nobody skipped');
    // The writer leaves after writing: the one after them writes next.
    applyRoomAction(r, ord[2], 'setWord', { word: 'شمس', round: 3 });
    leave(r, ord[2]);
    applyRoomAction(r, r.hostId, 'closeWord', { round: 3 });
    applyRoomAction(r, r.hostId, 'nextRound', { round: 3 });
    check(s.setter === ord[3], 'audit/hangman: a writer who leaves after writing hands on to the next in the order');
  }
  {
    const HM = new Function(src('ChameleonWords.js') + src('EmojiRiddles.js') + src('Hangman.js') + '\nreturn { hmApply, hmNewBoard };')();
    const b = HM.hmNewBoard();
    check(HM.hmApply(b, 'برتقال', 'ب', true) === 'hit' && b.g.indexOf('ب') !== -1 && b.miss.length === 0,
      'audit/hangman: one letter typed in the whole-word box is that letter, not a wrong word');
    HM.hmApply(b, 'برتقال', 'س'.repeat(5000), true);
    check(b.miss.length === 1 && Array.from(b.miss[0]).length <= 64, 'audit/hangman: a guess is never longer than a word can be');
  }

  // The solve engine: the same order rule.
  {
    const r = start('guessnum', ['a', 'b', 'c', 'd'], { rounds: 10, max: 50 });
    const s = r.shared;
    const ord = s.order.slice();
    const round = (n) => {
      applyRoomAction(r, s.setter, 'setSecret', { n: 7, round: n });
      applyRoomAction(r, r.hostId, 'closeRound', { round: n });
      applyRoomAction(r, r.hostId, 'nextRound', { round: n });
    };
    round(1);
    check(s.setter === ord[1], 'audit/solve: the second in the order sets second');
    leave(r, ord[0]);
    round(2);
    check(s.setter === ord[2], 'audit/solve: one who set earlier leaves - the next setter is the next in the order');
  }

  // Guess Who: the clock deals a face to whoever hasn't picked; a quiet answerer is named as the one skipped.
  {
    const r = start('guesswho', ['a', 'b'], { pick: 'choose', turnClock: 30 });
    const s = r.shared;
    check(s.phase === 'pick' && !!s.endsAt && roomDeadline(r) >= s.endsAt, 'audit/guesswho: with the clock on, picking a face has a clock');
    clock = s.endsAt + 5000;
    roomTimeout(r, clock);
    check(s.phase === 'play' && typeof r._gw.secret[0] === 'number' && typeof r._gw.secret[1] === 'number' && !!s.endsAt,
      'audit/guesswho: when it runs out, whoever hasn\'t picked gets a face, and the game starts on the turn clock');
    const asker = s.seats[s.turn];
    const seq0 = s.logSeq || 0;
    applyRoomAction(r, asker, 'loud', { seq: s.turnSeq });
    check(s.stage === 'answer', 'audit/guesswho: a question out loud waits for the answer');
    applyRoomAction(r, r.hostId, 'skipTurn', { seq: s.turnSeq });
    const last = s.log[s.log.length - 1];
    check(last.kind === 'skip' && last.stage === 'answer' && s.seats[last.seat] !== asker,
      'audit/guesswho: skipping a quiet answerer names the answerer, not the one who asked');
    check((s.logSeq || 0) > seq0, 'audit/guesswho: the log counts its entries, past the few it keeps');
  }

  // الشايب: the hand being drawn from leaves - a new turn, so a tap aimed at it is stale.
  {
    const r = start('oldmaid', ['a', 'b', 'c', 'd'], {});
    const s = r.shared;
    const drawer = s.turn.pid, from = s.turn.from;
    const seq0 = s.turnSeq;
    leave(r, from);
    check(s.phase === 'play' && s.turn.pid === drawer && s.turn.from !== from && s.turnSeq > seq0,
      'audit/oldmaid: the hand being drawn from leaves - the drawer draws from the next, as a new turn');
    try { applyRoomAction(r, drawer, 'lift', { pos: 0, seq: seq0 }); } catch (e) {}
    check(!r._om.aimId, 'audit/oldmaid: a lift sent before that is dropped');
  }

  // The tournament: the TV's bracket button, and game numbers new in every tournament.
  {
    const r = start('connect4', ['a', 'b', 'c', 'd'], { tournament: true });
    const t = r.shared.tour;
    const m = t.matches.find((x) => x.p[0] && x.p[1]);
    applyRoomAction(r, 'a', 'tourFeature', { match: m.id });
    check(t.featured === m.id, 'audit/tournament: the host puts a match big on the TV');
    applyRoomAction(r, 'a', 'tourFeature', { match: 'bracket' });
    check(t.featured === 'bracket', 'audit/tournament: and the bracket button brings the bracket back (even with one match live)');
    clock += 10000;
    roomTimeout(r, clock);
    const g = r.shared.games[m.id];
    check(!!g && g.round >= 1000 * (t.no || 1), 'audit/tournament: a match\'s game number carries the tournament\'s, so the next tournament\'s are new');
    check(refused(() => applyRoomAction(r, 'a', 'tourNew', { mode: 'stay' })) && r.shared.tour === t, 'audit/tournament: a tap that says nothing is still refused mid-tournament');
  }

  // Mini golf: a game saved with a count of holes plays the old order's holes.
  {
    const MG = new Function(src('MiniGolf.js') + '\nreturn { golfLegacyCourse, golfParOf };')();
    const c = MG.golfLegacyCourse(6);
    check(c.join(',') === 'first,bridge,mill,souq,humps,fair' && MG.golfParOf(6) === MG.golfParOf(c),
      'audit/minigolf: a game saved before the holes had kinds carries on on the holes it was playing');
  }
}

/* --- شطرنج بالتصويت: teams, secret votes, the tally, a tie, the clock, resigning by vote, leaving --- */
{
  const CH = new Function(readFileSync(new URL('../../Chess.js', import.meta.url), 'utf8') + '\nreturn { chessFromFen, chessLegalMoves };')();
  const refused = (fn) => { try { fn(); return false; } catch (e) { return true; } };
  const vcRoom = (ids, payload) => {
    const r = newRoom(ids);
    applyRoomAction(r, ids[0], 'chooseGame', { game: 'votechess' });
    applyRoomAction(r, ids[0], 'sides', { shuffle: true });
    applyRoomAction(r, ids[0], 'start', payload || {});
    return r;
  };
  // The lobby's split: at random, half and half; a tap moves one across; a side is never left empty.
  {
    const r = newRoom(['a', 'b', 'c', 'd', 'e']);
    applyRoomAction(r, 'a', 'chooseGame', { game: 'votechess' });
    applyRoomAction(r, 'a', 'sides', { shuffle: true });
    const sides = r.shared.lobby.sides;
    const n0 = Object.keys(sides).filter((id) => sides[id] === 0).length;
    check(Object.keys(sides).length === 5 && (n0 === 2 || n0 === 3), 'votechess: the host\'s split is at random, half and half (' + n0 + ' / ' + (5 - n0) + ')');
    const who = Object.keys(sides)[0];
    const was = sides[who];
    applyRoomAction(r, 'a', 'sides', { move: who });
    check(r.shared.lobby.sides[who] === 1 - was, 'votechess: a tap puts a player on the other side');
    check(refused(() => applyRoomAction(r, 'b', 'sides', { shuffle: true })), 'votechess: only the host splits the teams');
    const two = newRoom(['a', 'b']);
    applyRoomAction(two, 'a', 'chooseGame', { game: 'votechess' });
    applyRoomAction(two, 'a', 'sides', { shuffle: true });
    const other = Object.keys(two.shared.lobby.sides).find((id) => two.shared.lobby.sides[id] === 0);
    applyRoomAction(two, 'a', 'sides', { move: other });
    check(Object.values(two.shared.lobby.sides).sort().join() === '0,1', 'votechess: 1 against 1 - moving the only player of a side leaves it with someone');
    const one = newRoom(['a']);
    applyRoomAction(one, 'a', 'chooseGame', { game: 'votechess' });
    check(refused(() => applyRoomAction(one, 'a', 'start', {})), 'votechess: one person can\'t start it (no computer players)');
  }
  // A vote: secret until it closes, the majority played, the tally public.
  {
    const r = vcRoom(['a', 'b', 'c', 'd', 'e'], { secs: 20 });
    const s = r.shared;
    const [W, B] = s.teams;
    check(s.phase === 'play' && W.length + B.length === 5 && s.vote.team === 0 && s.vote.n === 0 && s.vote.endsAt === clock + 20000,
      'votechess: White\'s team votes first, on the host\'s 20 seconds');
    check(roomDeadline(r) === s.vote.endsAt + 400, 'votechess: the server looks again when the vote clock is up');
    check(refused(() => applyRoomAction(r, B[0], 'vote', { from: 'e7', to: 'e5', n: 0 })), 'votechess: the other team can\'t vote');
    check(refused(() => applyRoomAction(r, W[0], 'vote', { from: 'e2', to: 'e5', n: 0 })), 'votechess: an illegal move is refused');
    applyRoomAction(r, W[0], 'vote', { from: 'g1', to: 'f3', n: 0 });
    applyRoomAction(r, W[0], 'vote', { from: 'e2', to: 'e4', n: 0 });
    check(r.shared.vote.voted.join() === W[0] && r._vc.votes[W[0]].to === 'e4' && r.secrets[W[0]].vote.to === 'e4',
      'votechess: a vote can be changed until the vote closes; who voted is public');
    check(!JSON.stringify(r.shared).includes('e4') && !JSON.stringify(r.shared.vote).includes('f3'), 'votechess: what anyone voted is nowhere in shared');
    check(W.slice(1).every((id) => !r.secrets[id]), 'votechess: a voter\'s own vote is on their own phone only');
    applyRoomAction(r, W[0], 'vote', { from: 'd2', to: 'd4', n: 5 });
    check(r._vc.votes[W[0]].to === 'e4', 'votechess: a vote drawn for another move is dropped (a stale tap)');
    if (W.length === 3) {
      applyRoomAction(r, W[1], 'vote', { from: 'e2', to: 'e4', n: 0 });
      applyRoomAction(r, W[2], 'vote', { from: 'd2', to: 'd4', n: 0 });
    } else {
      applyRoomAction(r, W[1], 'vote', { from: 'e2', to: 'e4', n: 0 });
    }
    const t = r.shared.tallies[0];
    check(r.shared.chess.moves === 1 && r.shared.chess.last.to === 'e4' && t && t.pick === 'e2e4' && t.how === 'votes' && t.list[0].count === 2 && t.list[0].san === 'e4',
      'votechess: everyone voted - the vote closes at once, the most-voted move is played and the tally goes public (e4 ×2)');
    check(r.shared.vote.team === 1 && r.shared.vote.n === 1 && !Object.keys(r.secrets).length && !Object.keys(r._vc.votes).length,
      'votechess: Black\'s team votes next, with a clean ballot');
  }
  // A tie is drawn at random among the tied moves.
  {
    const seen = {};
    for (let i = 0; i < 40; i++) {
      const r = vcRoom(['a', 'b', 'c', 'd']);
      const W = r.shared.teams[0];
      applyRoomAction(r, W[0], 'vote', { from: 'e2', to: 'e4', n: 0 });
      applyRoomAction(r, W[1], 'vote', { from: 'd2', to: 'd4', n: 0 });
      seen[r.shared.tallies[0].pick + ':' + r.shared.tallies[0].how] = true;
    }
    check(seen['e2e4:tie'] && seen['d2d4:tie'] && Object.keys(seen).length === 2, 'votechess: a tie is drawn at random between the tied moves (both came up in 40)');
  }
  // The clock: some votes decide it; none, a random legal move.
  {
    const r = vcRoom(['a', 'b', 'c', 'd']);
    const W = r.shared.teams[0];
    applyRoomAction(r, W[0], 'vote', { from: 'b1', to: 'c3', n: 0 });
    clock = roomDeadline(r) + 1;
    roomTimeout(r, clock);
    check(r.shared.chess.last.to === 'c3' && r.shared.tallies[0].how === 'votes', 'votechess: the clock runs out - the votes so far decide (one vote of two)');
    clock = roomDeadline(r) + 1;
    roomTimeout(r, clock);
    const t = r.shared.tallies[1];
    check(r.shared.chess.moves === 2 && t.how === 'random' && !t.list.length && t.pick === r.shared.chess.hist[1], 'votechess: nobody voted - a random legal move, said as such');
    const B = r.shared.teams[1];
    applyRoomAction(r, W[0], 'vote', { from: 'a2', to: 'a3', n: 2 });
    applyRoomAction(r, 'a', 'closeVote', { n: 2 });
    check(r.shared.chess.moves === 3 && r.shared.tallies[2].how === 'host', 'votechess: the host closes a vote waiting on a quiet phone');
    check(refused(() => applyRoomAction(r, B.find((id) => id !== 'a') || 'b', 'closeVote', { n: 3 })), 'votechess: only the host closes a vote');
  }
  // Resigning is a vote: it wins only with more votes than any move.
  {
    const r = vcRoom(['a', 'b', 'c', 'd']);
    const [W, B] = r.shared.teams;
    applyRoomAction(r, W[0], 'vote', { resign: true, n: 0 });
    applyRoomAction(r, W[1], 'vote', { from: 'e2', to: 'e4', n: 0 });
    check(r.shared.phase === 'play' && r.shared.chess.last.to === 'e4', 'votechess: a tie between resigning and a move plays the move');
    applyRoomAction(r, B[0], 'vote', { resign: true, n: 1 });
    applyRoomAction(r, B[1], 'vote', { resign: true, n: 1 });
    check(r.shared.phase === 'over' && r.shared.result.reason === 'resign' && r.shared.result.winner === 0 && W.every((id) => r.shared.scores[id] === 1) && B.every((id) => !r.shared.scores[id]),
      'votechess: the whole team votes to resign - the game is White\'s, a point for each of them');
    const oldW = W.slice();
    applyRoomAction(r, 'a', 'playAgain', {});
    check(r.shared.phase === 'play' && r.shared.teams[1].join() === oldW.join() && r.shared.round === 2 && r.shared.scores[oldW[0]] === 1,
      'votechess: play again - the same teams, the colours swapped, the scores kept');
  }
  // Mate by votes.
  {
    const r = vcRoom(['a', 'b']);
    const [W, B] = r.shared.teams;
    for (const [id, f, t] of [[W[0], 'f2', 'f3'], [B[0], 'e7', 'e5'], [W[0], 'g2', 'g4'], [B[0], 'd8', 'h4']]) applyRoomAction(r, id, 'vote', { from: f, to: t, n: r.shared.chess.moves });
    check(r.shared.phase === 'over' && r.shared.result.reason === 'mate' && r.shared.result.winner === 1, 'votechess: 1 against 1 is chess by a vote of one - the fool\'s mate');
  }
  // Leaving: out of the count; a team with nobody left loses.
  {
    let done = false;
    for (let i = 0; i < 20 && !done; i++) {
      const r = vcRoom(['a', 'b', 'c', 'd', 'e']);
      const W = r.shared.teams[0];
      if (W.length !== 3) continue;
      applyRoomAction(r, W[0], 'vote', { from: 'e2', to: 'e4', n: 0 });
      applyRoomAction(r, W[1], 'vote', { from: 'e2', to: 'e4', n: 0 });
      r.players = r.players.filter((p) => p.id !== W[2]);
      roomPlayerLeft(r, W[2], 'X');
      check(r.shared.chess.moves === 1 && r.shared.teams[0].length === 2, 'votechess: the one who hadn\'t voted leaves - the rest have all voted, so the vote closes');
      done = true;
    }
    const r2 = vcRoom(['a', 'b']);
    const [w2, b2] = r2.shared.teams;
    r2.players = r2.players.filter((p) => p.id !== b2[0]);
    roomPlayerLeft(r2, b2[0], 'X');
    check(r2.shared.phase === 'over' && r2.shared.result.reason === 'left' && r2.shared.result.winner === 0 && r2.shared.scores[w2[0]] === 1,
      'votechess: a team with nobody left loses');
  }
  // The team channel: a team's lines reach that team only, never the screen.
  {
    const r = vcRoom(['a', 'b', 'c', 'd']);
    const [W, B] = r.shared.teams;
    r.screens = [{ id: 'tv' }];
    applyRoomAction(r, W[0], 'chat', { text: 'نلعب الحصان', to: 'team' });
    check(chatFor(r, W[1]).some((m) => m.team === 'w') && !chatFor(r, B[0]).some((m) => m.team) && !chatFor(r, 'tv').some((m) => m.team),
      'votechess: the team chat reaches the team, not the other team or the TV');
    applyRoomAction(r, 'a', 'backToHub', {});
    check(!(r.chat || []).some((m) => m.team), 'votechess: the team lines go with the game');
  }
}

/* --- المخ والإيد: the seats, the Brain names, the Hand moves, computer players, the clock, play again --- */
{
  const CH = new Function(readFileSync(new URL('../../Chess.js', import.meta.url), 'utf8') + '\nreturn { chessFromFen, chessLegalMoves };')();
  const refused = (fn) => { try { fn(); return false; } catch (e) { return true; } };
  const botsOf = (r) => r.players.filter((p) => p.bot).map((p) => p.id);
  const hbRoom = (ids, order, payload) => {
    const r = newRoom(ids);
    applyRoomAction(r, ids[0], 'chooseGame', { game: 'handbrain' });
    applyRoomAction(r, ids[0], 'seats', { order: order });
    applyRoomAction(r, ids[0], 'start', payload || {});
    return r;
  };
  // Two people: two easy computer players take the empty seats.
  {
    const r = newRoom(['a', 'b']);
    applyRoomAction(r, 'a', 'chooseGame', { game: 'handbrain' });
    applyRoomAction(r, 'a', 'seats', {});
    const lobby = r.shared.lobby.order;
    check(lobby.length === 4 && lobby.filter(Boolean).sort().join() === 'a,b', 'handbrain: the lobby seats the two people, two seats left empty');
    applyRoomAction(r, 'a', 'seats', { order: [lobby[1], lobby[0], lobby[2], lobby[3]] });
    check(r.shared.lobby.order[0] === lobby[1], 'handbrain: the host swaps two seats');
    applyRoomAction(r, 'a', 'start', { botNames: ['زيزو', 'بندق'] });
    const s = r.shared;
    check(r.players.length === 4 && botsOf(r).length === 2 && r.players.filter((p) => p.bot).every((p) => p.bot === 'easy') && r.players.some((p) => p.name === 'زيزو'),
      'handbrain: the empty seats are filled with easy computer players, named by the host\'s phone');
    check(s.teams.length === 2 && s.teams.every((t) => t.length === 2) && s.stage === 'name' && !s.chess.clock, 'handbrain: two teams of a Brain and a Hand, the Brain first, no clock by default');
  }
  // The Brain names, the Hand moves a piece of that kind; everyone else is refused.
  {
    const r = hbRoom(['a', 'b', 'c', 'd'], ['a', 'b', 'c', 'd'], { clock: '5+0' });
    const s = r.shared;
    check(s.teams[0].join() === 'a,b' && s.teams[1].join() === 'c,d' && s.chess.clock && s.chess.clock.left[0] === 300000, 'handbrain: the host\'s seats and 5+0 per team');
    check(refused(() => applyRoomAction(r, 'b', 'name', { kind: 2, n: 0 })), 'handbrain: the Hand can\'t name');
    check(refused(() => applyRoomAction(r, 'c', 'name', { kind: 2, n: 0 })), 'handbrain: the other team\'s Brain can\'t name');
    check(refused(() => applyRoomAction(r, 'a', 'name', { kind: 5, n: 0 })), 'handbrain: a kind with no legal move (the queen at the start) can\'t be named');
    applyRoomAction(r, 'a', 'name', { kind: 2, n: 0 });
    check(s.stage === 'move' && s.named.kind === 2 && s.named.by === 'a', 'handbrain: the Brain names the knight, and the table sees it');
    applyRoomAction(r, 'a', 'name', { kind: 1, n: 0 });
    check(s.named.kind === 2, 'handbrain: a second name for the same move is dropped');
    check(refused(() => applyRoomAction(r, 'a', 'move', { from: 'g1', to: 'f3', move: 0 })), 'handbrain: the Brain can\'t move');
    check(refused(() => applyRoomAction(r, 'b', 'move', { from: 'e2', to: 'e4', move: 0 })), 'handbrain: the Hand must move the kind named');
    applyRoomAction(r, 'b', 'move', { from: 'g1', to: 'f3', move: 0 });
    check(s.chess.moves === 1 && s.chess.last.kind === 2 && s.stage === 'name' && !s.named && s.calls.length === 1, 'handbrain: the Hand plays the knight; Black\'s Brain is up');
    applyRoomAction(r, 'b', 'move', { from: 'f3', to: 'g5', move: 0 });
    check(s.chess.moves === 1, 'handbrain: a second tap drawn for the move before is dropped');
    applyRoomAction(r, 'd', 'resign', { round: 1 });
    check(s.phase === 'over' && s.result.winner === 0 && s.result.reason === 'resign' && s.scores.a === 1 && s.scores.b === 1, 'handbrain: either member resigns for the team');
    applyRoomAction(r, 'a', 'playAgain', {});
    const t = r.shared.teams;
    check(t[0].join() === 'd,c' && t[1].join() === 'b,a' && r.shared.settings.clock === '5+0' && r.shared.round === 2,
      'handbrain: play again - each team\'s roles swapped, the colours swapped, the clock kept');
  }
  // Flag: the clock is the team's.
  {
    const r = hbRoom(['a', 'b', 'c', 'd'], ['a', 'b', 'c', 'd'], { clock: '5+0' });
    applyRoomAction(r, 'a', 'name', { kind: 1, n: 0 });
    applyRoomAction(r, 'b', 'move', { from: 'e2', to: 'e4', move: 0 });
    clock = roomDeadline(r) + 5;
    roomTimeout(r, clock);
    check(r.shared.phase === 'over' && r.shared.result.reason === 'time' && r.shared.result.winner === 0, 'handbrain: Black\'s team runs out of time and loses');
  }
  // Forced: a Brain with one kind that can move names it; the host's "play for".
  {
    const r = hbRoom(['a', 'b', 'c', 'd'], ['a', 'b', 'c', 'd']);
    r.shared.chess.g = CH.chessFromFen('7k/8/8/8/8/8/8/K7 w - - 0 1');
    const f = roomForcedMove(r);
    check(!!f && f.pid === 'a' && f.move.action === 'name' && f.move.payload.kind === 6, 'handbrain: only the king can move - the Brain\'s name is made for them');
    const r2 = hbRoom(['a', 'b', 'c', 'd'], ['a', 'b', 'c', 'd']);
    check(!roomForcedMove(r2), 'handbrain: a real choice is never made for the Brain');
    applyRoomAction(r2, 'a', 'skipTurn', { move: 0, stage: 'name' });
    check(r2.shared.stage === 'move' && !!r2.shared.named, 'handbrain: the host names for a quiet Brain');
    applyRoomAction(r2, 'a', 'skipTurn', { move: 0, stage: 'move' });
    check(r2.shared.chess.moves === 1 && r2.shared.chess.last.kind === r2.shared.calls[0].kind && r2.shared.chess.last.auto === 'host', 'handbrain: and moves a piece of that kind for a quiet Hand');
    check(refused(() => applyRoomAction(r2, 'c', 'skipTurn', { move: 1, stage: 'name' })), 'handbrain: only the host plays for someone');
  }
  // A hard computer Hand finds the mate with the kind named.
  {
    const r = newRoom(['a', 'b']);
    applyRoomAction(r, 'a', 'chooseGame', { game: 'handbrain' });
    applyRoomAction(r, 'a', 'addBot', { level: 'hard', name: 'H1' });
    applyRoomAction(r, 'a', 'addBot', { level: 'hard', name: 'H2' });
    const [h1, h2] = botsOf(r);
    applyRoomAction(r, 'a', 'seats', { order: ['a', h1, 'b', h2] });
    applyRoomAction(r, 'a', 'start', {});
    r.shared.chess.g = CH.chessFromFen('6k1/5ppp/8/8/8/8/5PPP/3Q2K1 w - - 0 1');
    applyRoomAction(r, 'a', 'name', { kind: 5, n: 0 });
    clock += 5000;
    roomTimeout(r, clock);
    check(r.shared.phase === 'over' && r.shared.result.reason === 'mate' && r.shared.chess.last.to === 'd8', 'handbrain: a hard computer Hand told "the queen" finds Qd8#');
  }
  // A whole game: one person and three computer players, the host's "play for" on the person's turns.
  {
    let ended = 0, legal = true, moves = 0;
    for (let game = 0; game < 3; game++) {
      const r = newRoom(['a']);
      applyRoomAction(r, 'a', 'chooseGame', { game: 'handbrain' });
      applyRoomAction(r, 'a', 'addBot', { level: game % 2 ? 'hard' : 'easy', name: 'B' });
      applyRoomAction(r, 'a', 'start', {});
      for (let step = 0; step < 900 && r.shared.phase === 'play'; step++) {
        const s = r.shared;
        const up = s.teams[s.chess.g.turn][s.stage === 'name' ? 0 : 1];
        if (up === 'a') { try { applyRoomAction(r, 'a', 'skipTurn', { move: s.chess.moves, stage: s.stage }); } catch (e) { legal = false; break; } continue; }
        const before = s.chess.moves + s.stage;
        clock += 5000;
        roomTimeout(r, clock);
        if (r.shared.phase === 'play' && r.shared.chess.moves + r.shared.stage === before) { legal = false; break; }
      }
      moves += r.shared.chess.moves;
      if (r.shared.phase === 'play') applyRoomAction(r, 'a', 'resign', { round: r.shared.round });
      if (r.shared.phase === 'over') ended++;
    }
    check(ended === 3 && legal, `handbrain: three whole games, one person and three computer players (easy and hard) - every computer move taken, every game ends (${moves} moves)`);
  }
  // Leaving mid-game: a computer player takes the seat.
  {
    const r = hbRoom(['a', 'b', 'c', 'd'], ['a', 'b', 'c', 'd']);
    applyRoomAction(r, 'a', 'name', { kind: 1, n: 0 });
    r.players = r.players.filter((p) => p.id !== 'b');
    roomPlayerLeft(r, 'b', 'بسمة');
    const hand = r.shared.teams[0][1];
    check(hand !== 'b' && r.players.some((p) => p.id === hand && p.bot === 'easy' && p.name.indexOf('بسمة') !== -1) && r.shared.phase === 'play',
      'handbrain: the Hand leaves - a computer player takes the seat and the game goes on');
    clock += 5000;
    roomTimeout(r, clock);
    check(r.shared.chess.moves === 1 && r.shared.chess.last.kind === 1, 'handbrain: and plays the pawn its Brain named');
  }
}

/* --- شطرنج الأربعة (Chess4.js): the board, every rule, the points, whole games of computer players --- */
{
  const C = new Function(readFileSync(new URL('../../Chess4.js', import.meta.url), 'utf8') +
    '\nreturn { chess4NewGame, chess4Legal, chess4Play, chess4BotMove, chess4InCheck, chess4Eliminate, chess4Sq, chess4Valid, chess4SqName, CHESS4_MAX_PLIES };')();
  const sq = C.chess4Sq;
  const P = 1, N = 2, B = 3, R = 4, Q = 5, K = 6;
  const pc = (kind, seat) => kind + 8 * seat;
  // An empty board with the four kings at home, no castling, `seat` to move.
  const bare = (mode, seat) => {
    const g = C.chess4NewGame(mode);
    g.board.fill(0);
    g.castle = [0, 0, 0, 0];
    g.board[sq(7, 0)] = pc(K, 0); g.board[sq(0, 7)] = pc(K, 1); g.board[sq(6, 13)] = pc(K, 2); g.board[sq(13, 6)] = pc(K, 3);
    g.turn = seat || 0;
    return g;
  };
  const has = (g, from, to) => C.chess4Legal(g).some((m) => m.from === from && m.to === to);

  let valid = 0;
  for (let y = 0; y < 14; y++) for (let x = 0; x < 14; x++) if (C.chess4Valid(x, y)) valid++;
  check(valid === 160, 'chess4: 14 x 14 without the four 3 x 3 corners is 160 squares');
  const g0 = C.chess4NewGame('ffa');
  check([0, 1, 2, 3].every((s) => C.chess4Legal(g0, s).length === 20), 'chess4: from the start every colour has 20 moves (16 pawn moves, 4 knight moves)');
  check(g0.board[sq(7, 0)] === pc(K, 0) && g0.board[sq(6, 0)] === pc(Q, 0) && g0.board[sq(6, 13)] === pc(K, 2) && g0.board[sq(0, 7)] === pc(K, 1) && g0.board[sq(13, 6)] === pc(K, 3),
    'chess4: the kings and queens stand as on the design sheet (red K h1, yellow K g14, blue K a8, green K n7)');
  check(g0.turn === 0 && has(g0, sq(7, 1), sq(7, 3)) && !has(g0, sq(0, 4), sq(1, 4)), 'chess4: red moves first; a pawn goes two from its first row');
  const order = [];
  const go = C.chess4NewGame('teams');
  [[sq(7, 1), sq(7, 2)], [sq(1, 7), sq(2, 7)], [sq(6, 12), sq(6, 11)], [sq(12, 6), sq(11, 6)]].forEach((m) => { order.push(go.turn); C.chess4Play(go, { from: m[0], to: m[1] }); });
  check(order.join() === '0,1,2,3' && go.turn === 0, 'chess4: the turns go red, blue, yellow, green; each pawn toward the far side');

  // Castling both ways, and never through an attacked square.
  const gc = bare('ffa', 0);
  gc.castle = [3, 0, 0, 0];
  gc.board[sq(3, 0)] = pc(R, 0); gc.board[sq(10, 0)] = pc(R, 0);
  check(has(gc, sq(7, 0), sq(9, 0)) && has(gc, sq(7, 0), sq(5, 0)), 'chess4: red castles both ways');
  const gs = JSON.parse(JSON.stringify(gc));
  const cst = C.chess4Play(gs, { from: sq(7, 0), to: sq(9, 0) });
  check(!!cst && cst.san === 'O-O' && gs.board[sq(9, 0)] === pc(K, 0) && gs.board[sq(8, 0)] === pc(R, 0) && !gs.board[sq(10, 0)] && gs.castle[0] === 0,
    'chess4: short castling: the king two squares, the rook beside it');
  const gl = JSON.parse(JSON.stringify(gc));
  const csl = C.chess4Play(gl, { from: sq(7, 0), to: sq(5, 0) });
  check(!!csl && /^O-O-O/.test(csl.san) && gl.board[sq(5, 0)] === pc(K, 0) && gl.board[sq(6, 0)] === pc(R, 0) && !gl.board[sq(3, 0)], 'chess4: long castling');
  gc.board[sq(8, 7)] = pc(R, 1);                          // a blue rook on the i-file: i1 is attacked
  check(!has(gc, sq(7, 0), sq(9, 0)) && has(gc, sq(7, 0), sq(5, 0)), 'chess4: no castling across an attacked square');
  const gb = bare('ffa', 1);
  gb.castle = [0, 3, 0, 0];
  gb.board[sq(0, 3)] = pc(R, 1); gb.board[sq(0, 10)] = pc(R, 1);
  check(has(gb, sq(0, 7), sq(0, 9)) && has(gb, sq(0, 7), sq(0, 5)), 'chess4: blue castles along its column too');

  // Promotion: the 8th row in FFA, the 11th in teams; a queen only.
  const gp = bare('ffa', 0);
  gp.board[sq(5, 6)] = pc(P, 0);
  C.chess4Play(gp, { from: sq(5, 6), to: sq(5, 7) });
  check(gp.board[sq(5, 7)] === pc(Q, 0) + 32, 'chess4 FFA: a pawn on its 8th row becomes a queen');
  const gt = bare('teams', 0);
  gt.board[sq(5, 6)] = pc(P, 0);
  gt.board[sq(4, 9)] = pc(P, 0);
  C.chess4Play(gt, { from: sq(5, 6), to: sq(5, 7) });
  check(gt.board[sq(5, 7)] === pc(P, 0), 'chess4 teams: not on the 8th row');
  gt.turn = 0;
  C.chess4Play(gt, { from: sq(4, 9), to: sq(4, 10) });
  check(gt.board[sq(4, 10)] === pc(Q, 0) + 32, 'chess4 teams: a pawn on its 11th row becomes a queen');
  const gy = bare('ffa', 2);
  gy.board[sq(8, 7)] = pc(P, 2);
  C.chess4Play(gy, { from: sq(8, 7), to: sq(8, 6) });
  const gg = bare('ffa', 3);
  gg.board[sq(7, 8)] = pc(P, 3);
  C.chess4Play(gg, { from: sq(7, 8), to: sq(6, 8) });
  check(gy.board[sq(8, 6)] === pc(Q, 2) + 32 && gg.board[sq(6, 8)] === pc(Q, 3) + 32, 'chess4: yellow promotes going down, green going left');

  // Check from two directions at once.
  const g2 = bare('ffa', 0);
  g2.board[sq(4, 0)] = pc(R, 1);                          // along the first row
  g2.board[sq(10, 3)] = pc(B, 3);                         // down the diagonal
  const moves2 = C.chess4Legal(g2);
  check(C.chess4InCheck(g2, 0) && moves2.length > 0 && moves2.every((m) => m.from === sq(7, 0)) && !moves2.some((m) => m.to === sq(8, 1) || m.to === sq(6, 0)),
    'chess4: check from two players at once: only the king can answer, and not along either line');
  const gpart = bare('teams', 0);
  gpart.board[sq(4, 0)] = pc(R, 2);
  check(!C.chess4InCheck(gpart, 0), "chess4 teams: a partner's rook never checks");

  // A back-rank mate, FFA: judged on red's own turn, +20 to blue, red's pieces grey walls.
  const mateFfa = () => {
    const g = bare('ffa', 1);
    g.board[sq(6, 1)] = pc(P, 0); g.board[sq(7, 1)] = pc(P, 0); g.board[sq(8, 1)] = pc(P, 0);
    g.board[sq(4, 5)] = pc(R, 1);
    return g;
  };
  const gm = mateFfa();
  const mv = C.chess4Play(gm, { from: sq(4, 5), to: sq(4, 0) });
  check(!!mv && mv.san === 'Re1+' && !gm.out[0], 'chess4 FFA: a check; red is not out yet');
  C.chess4Play(gm, { from: sq(6, 13), to: sq(6, 12) });
  const lastBefore = C.chess4Play(gm, { from: sq(13, 6), to: sq(12, 6) });
  check(gm.out[0] && gm.why[0] === 'mate' && gm.points[1] === 20 && gm.turn === 1 && lastBefore.events.some((e) => e.kind === 'out' && e.seat === 0 && e.by === 1),
    "chess4 FFA: on red's turn, in check with no move: mated, out, +20 to the player whose move gave it");
  const greys = [sq(6, 1), sq(7, 1), sq(8, 1), sq(7, 0)];
  gm.board[sq(8, 3)] = pc(N, 1);                          // a blue knight that could reach two grey pawns
  check(!C.chess4Legal(gm, 1).some((m) => greys.indexOf(m.to) !== -1), "chess4 FFA: an out player's pieces are walls: nobody can take them");
  gm.board[sq(6, 12)] = 0;
  gm.board[sq(8, 2)] = pc(K, 2);                          // the yellow king right beside the grey pawns
  check(!C.chess4InCheck(gm, 2), 'chess4 FFA: grey pieces never give check');
  check(gm.turn === 1 && !gm.over, 'chess4 FFA: the game goes on with three');

  // Stalemate, FFA: out, and +20 for themselves. Teams: a pass.
  const stale = (mode) => {
    const g = bare(mode, 2);
    [[6, 0], [8, 0], [6, 1], [7, 1], [8, 1]].forEach(([x, y]) => { g.board[sq(x, y)] = pc(P, 0); });
    // Blockers nobody red can take: an out player's pieces (FFA) or the partner's (teams).
    const wall = mode === 'ffa' ? 3 : 2;
    [5, 6, 7, 8, 9].forEach((x) => { g.board[sq(x, 2)] = pc(N, wall); });
    if (mode === 'ffa') g.out[3] = true;
    return g;
  };
  const gsf = stale('ffa');
  const ev = C.chess4Play(gsf, { from: sq(6, 13), to: sq(5, 13) });
  check(!!ev && gsf.out[0] && gsf.why[0] === 'stalemate' && gsf.points[0] === 20 && gsf.turn === 1, 'chess4 FFA: stalemated: out, and +20 to themselves');
  const gst = stale('teams');
  gst.turn = 3;                                           // green is up before red in teams
  const evt = C.chess4Play(gst, { from: sq(13, 6), to: sq(12, 6) });
  check(!!evt && !gst.out[0] && gst.turn === 1 && evt.events.some((e) => e.kind === 'pass' && e.seat === 0) && !gst.over, 'chess4 teams: no move and not in check: the player passes');

  // Points in FFA: a bishop 5, a queen 9, a promoted queen 1; none in teams.
  const gpt = bare('ffa', 1);
  gpt.board[sq(5, 5)] = pc(N, 1);
  gpt.board[sq(6, 7)] = pc(B, 0);
  C.chess4Play(gpt, { from: sq(5, 5), to: sq(6, 7) });
  check(gpt.points[1] === 5, 'chess4 FFA: taking a bishop scores 5');
  const gq = bare('ffa', 1);
  gq.board[sq(5, 5)] = pc(N, 1);
  gq.board[sq(7, 6)] = pc(Q, 2) + 32;
  C.chess4Play(gq, { from: sq(5, 5), to: sq(7, 6) });
  const gq2 = bare('ffa', 1);
  gq2.board[sq(5, 5)] = pc(N, 1);
  gq2.board[sq(7, 6)] = pc(Q, 2);
  C.chess4Play(gq2, { from: sq(5, 5), to: sq(7, 6) });
  check(gq.points[1] === 1 && gq2.points[1] === 9, 'chess4 FFA: a queen 9, a promoted queen 1');
  const gtp = bare('teams', 1);
  gtp.board[sq(5, 5)] = pc(N, 1);
  gtp.board[sq(6, 7)] = pc(B, 0);
  C.chess4Play(gtp, { from: sq(5, 5), to: sq(6, 7) });
  check(gtp.points.every((x) => x === 0), 'chess4 teams: no points');

  // Teams: a mate of either opponent wins; resigning loses for the team.
  const gtm = mateFfa();
  gtm.mode = 'teams';
  C.chess4Play(gtm, { from: sq(4, 5), to: sq(4, 0) });
  C.chess4Play(gtm, { from: sq(6, 13), to: sq(6, 12) });
  C.chess4Play(gtm, { from: sq(13, 6), to: sq(12, 6) });
  check(gtm.over && gtm.result.team === 1 && gtm.result.reason === 'mate' && gtm.result.winners.join() === '1,3', 'chess4 teams: red mated: blue and green win');
  const gtr = C.chess4NewGame('teams');
  C.chess4Eliminate(gtr, 3, 'resign');
  check(gtr.over && gtr.result.team === 0 && gtr.result.winners.join() === '0,2', 'chess4 teams: green resigns: red and yellow win');
  const gfr = C.chess4NewGame('ffa');
  C.chess4Eliminate(gfr, 0, 'resign');
  check(gfr.out[0] && gfr.turn === 1 && !gfr.over && C.chess4Legal(gfr, 1).length > 0, 'chess4 FFA: red resigns on its turn: out, and blue plays');
  C.chess4Eliminate(gfr, 1, 'time'); C.chess4Eliminate(gfr, 2, 'left');
  check(gfr.over && gfr.result.reason === 'last', 'chess4 FFA: one player left: the game is over');
  check(C.chess4Play(C.chess4NewGame('ffa'), { from: sq(7, 1), to: sq(7, 4) }) === null, 'chess4: an illegal move is refused');
  const gq3 = bare('ffa', 0);
  gq3.quiet = 200;
  gq3.board[sq(3, 0)] = pc(R, 0);
  C.chess4Play(gq3, { from: sq(3, 0), to: sq(3, 1) });
  check(gq3.over && gq3.result.reason === 'fifty', 'chess4: fifty moves each with no capture or pawn move end the game');

  // Whole games of computer players: 20 each mode, easy and hard, every move legal, none past the cap.
  let games = 0, ended = 0, legalAll = true, longest = 0, hardMs = 0, hardN = 0;
  for (const mode of ['teams', 'ffa']) for (const lvl of ['easy', 'hard']) for (let rep = 0; rep < 20; rep++) {
    games++;
    const g = C.chess4NewGame(mode);
    for (let guard = 0; guard < 700 && !g.over; guard++) {
      const t0 = performance.now();
      const m = C.chess4BotMove(g, lvl, lvl === 'hard' ? { nodes: 2500 } : {});
      if (lvl === 'hard') { hardMs += performance.now() - t0; hardN++; }
      if (!m || !C.chess4Play(g, m)) { legalAll = false; break; }
    }
    longest = Math.max(longest, g.ply);
    if (g.over && g.result && g.result.winners) ended++;
  }
  check(ended === games && legalAll, `chess4 bots: ${games} whole games (teams and FFA, easy and hard), every move legal, all ended (${ended})`);
  check(longest <= C.CHESS4_MAX_PLIES, `chess4 bots: no game longer than ${C.CHESS4_MAX_PLIES} moves (the longest ${longest})`);
  // The full budget, timed: the Worker's CPU.
  const gh = C.chess4NewGame('ffa');
  let worst = 0;
  for (let k = 0; k < 24 && !gh.over; k++) { const t0 = performance.now(); const m = C.chess4BotMove(gh, 'hard'); worst = Math.max(worst, performance.now() - t0); C.chess4Play(gh, m); }
  console.log(`    (chess4 hard bot: ${(hardMs / Math.max(1, hardN)).toFixed(1)} ms a move on the tests' budget; the full budget's worst ${worst.toFixed(1)} ms)`);
  check(worst < 200, "chess4 bots: a hard decision on the full budget stays well inside the Worker's time");
}

/* --- شطرنج الأربعة in rooms (RoomChess4.js): the lobby, turns, the clock, play for, leaving, bots --- */
{
  const refused = (fn) => { try { fn(); return false; } catch (e) { return true; } };
  const C = new Function(readFileSync(new URL('../../Chess4.js', import.meta.url), 'utf8') + '\nreturn { chess4Legal };')();
  const first = (s) => C.chess4Legal(s.g)[0];
  const isBot = (room, id) => room.players.some((x) => x.id === id && x.bot);
  const up = (r) => r.shared.seats[r.shared.g.turn];

  // The lobby: the host's way to play and clock, the colours; one person and the rest filled by computer players.
  const r = newRoom(['h', 'p']);
  applyRoomAction(r, 'h', 'chooseGame', { game: 'chess4' });
  check(refused(() => applyRoomAction(r, 'p', 'options', { mode: 'ffa' })), 'chess4 room: only the host sets the way to play');
  applyRoomAction(r, 'h', 'options', { mode: 'ffa', clock: 3 });
  check(r.shared.lobby.mode === 'ffa' && r.shared.lobby.clock === 3, 'chess4 room: the host picks everyone for themselves and a 3-minute clock');
  applyRoomAction(r, 'h', 'addBot', { level: 'hard', name: 'Robo' });
  const botId = r.players.find((x) => x.bot).id;
  applyRoomAction(r, 'h', 'seats', { order: ['p', null, 'h', botId] });
  check(refused(() => applyRoomAction(r, 'h', 'seats', { order: ['p', 'p', 'h', null] })), 'chess4 room: a player sits in one colour only');
  applyRoomAction(r, 'h', 'start', { botNames: ['زيزو', 'بندق'] });
  const s = r.shared;
  check(s.seats[0] === 'p' && s.seats[2] === 'h' && s.seats[3] === botId && isBot(r, s.seats[1]) && r.players.length === 4,
    'chess4 room: the colours the host set, and an easy computer player for the empty one');
  check(s.g.mode === 'ffa' && s.clock && s.clock.left.every((x) => x === 180000) && s.clock.at === null, "chess4 room: FFA, 3 minutes each, and a player's first move is free");
  check(r.phase === 'play' && s.g.turn === 0 && up(r) === 'p', 'chess4 room: red moves first');
  check(refused(() => applyRoomAction(r, 'h', 'move', Object.assign(first(s), { seq: s.turnSeq }))), 'chess4 room: out of turn is refused');
  const seq0 = s.turnSeq;
  applyRoomAction(r, 'p', 'move', Object.assign({}, first(s), { seq: seq0 - 1 }));
  check(r.shared.turnSeq === seq0 && r.shared.g.ply === 0, 'chess4 room: a tap from a turn that has moved on is dropped');
  check(refused(() => applyRoomAction(r, 'p', 'move', { from: 0, to: 1, seq: seq0 })), 'chess4 room: an illegal move is refused');
  applyRoomAction(r, 'p', 'move', Object.assign({}, first(r.shared), { seq: seq0 }));
  check(r.shared.g.ply === 1 && r.shared.g.turn === 1 && r.shared.log.some((e) => e.k === 'mv' && e.seat === 0), 'chess4 room: the move is played and written in the log');
  check(typeof r._botAt === 'number', 'chess4 room: a computer player is up next, on the server\'s clock');
  clock = r._botAt + 1;
  roomTimeout(r, clock);
  check(r.shared.g.turn === 2 && r.shared.g.ply === 2, 'chess4 room: the computer player moved');
  // The clock: yellow's first move is free; after it, time counts.
  applyRoomAction(r, 'h', 'move', Object.assign({}, first(r.shared), { seq: r.shared.turnSeq }));
  clock = r._botAt + 1; roomTimeout(r, clock);            // green (a bot)
  check(r.shared.g.turn === 0 && r.shared.clock.at === clock, "chess4 room: once they have moved, a player's clock runs on their turn");
  clock += 180000 + 5000;
  const due = roomDeadline(r);
  check(due !== null && due <= clock, 'chess4 room: the server looks again when red\'s time is up');
  roomTimeout(r, clock);
  check(r.shared.g.out[0] && r.shared.g.why[0] === 'time' && r.shared.g.turn === 1 && r.shared.log.some((e) => e.k === 'out' && e.seat === 0 && e.why === 'time'),
    'chess4 room FFA: out of time: out, grey walls, and the next player is up');
  // The host plays for a quiet phone (yellow, the host's own seat here, is a person).
  while (r.shared.phase === 'play' && isBot(r, up(r))) { clock = r._botAt + 1; roomTimeout(r, clock); }
  const hs = r.shared.turnSeq;
  applyRoomAction(r, 'h', 'skipTurn', { seq: hs });
  check(r.shared.turnSeq > hs && r.shared.log.some((e) => e.k === 'mv' && e.auto === 'host'), 'chess4 room: the host plays an easy move for a phone, marked as such');
  applyRoomAction(r, 'h', 'skipTurn', { seq: hs });
  check(r.shared.log.filter((e) => e.auto === 'host').length === 1, 'chess4 room: a second "play for" of the same turn is dropped');
  applyRoomAction(r, 'h', 'resign', {});
  check(r.shared.g.out[2] && r.shared.g.why[2] === 'resign', 'chess4 room: resigning is out');
  for (let k = 0; k < 4000 && r.shared.phase === 'play'; k++) { if (typeof r._botAt !== 'number') break; clock = r._botAt + 1; roomTimeout(r, clock); }
  check(r.shared.phase === 'over' && r.phase === 'gameover' && r.shared.g.result.winners.length >= 1 && r.shared.board.length === 4,
    'chess4 room FFA: the computer players play it out; the winners, the board');
  const was = r.shared.seats.slice();
  applyRoomAction(r, 'h', 'playAgain', {});
  check(r.shared.phase === 'play' && r.shared.seats.join() === [was[1], was[2], was[3], was[0]].join() && r.shared.g.mode === 'ffa' && r.shared.round === 2,
    'chess4 room: play again keeps the table and turns it by one (someone else is red)');

  // Teams: a player who leaves gets a computer player in their seat.
  const t = newRoom(['h', 'p', 'q', 'w']);
  applyRoomAction(t, 'h', 'chooseGame', { game: 'chess4' });
  applyRoomAction(t, 'h', 'start', {});
  check(t.shared.g.mode === 'teams' && t.shared.seats.join() === 'h,p,q,w' && !t.shared.clock, 'chess4 room: teams and no clock by default, the room in order');
  applyRoomAction(t, 'h', 'move', Object.assign({}, first(t.shared), { seq: t.shared.turnSeq }));
  leave(t, 'p');
  check(isBot(t, t.shared.seats[1]) && t.shared.replaced[1] && t.shared.names[1] === 'P' && t.shared.phase === 'play' && typeof t._botAt === 'number',
    'chess4 room teams: a player who leaves: a computer player takes their seat and plays on');
  clock = t._botAt + 1; roomTimeout(t, clock);
  check(t.shared.g.turn === 2, 'chess4 room teams: …and moves for them');
  applyRoomAction(t, 'w', 'resign', {});
  check(t.shared.phase === 'over' && t.shared.g.result.team === 0 && t.shared.wins.h === 1 && t.shared.wins.q === 1 && !t.shared.wins.w,
    'chess4 room teams: green resigns: red and yellow win, a win each on the night\'s table');
  const f = newRoom(['h', 'p', 'q']);
  applyRoomAction(f, 'h', 'chooseGame', { game: 'chess4' });
  applyRoomAction(f, 'h', 'options', { mode: 'ffa' });
  applyRoomAction(f, 'h', 'start', {});
  leave(f, 'q');
  check(f.shared.g.out[2] && f.shared.g.why[2] === 'left' && f.shared.phase === 'play', 'chess4 room FFA: a player who leaves is out, their pieces walls');

  // Whole games of computer players through the room's own door: both ways, easy and hard.
  const errorWas = console.error;
  const errors = [];
  console.error = (...a) => errors.push(a.join(' '));
  let games = 0, ended = 0;
  for (const mode of ['teams', 'ffa']) for (const lvl of ['easy', 'hard', 'mix']) {
    games++;
    const b = newRoom(['h']);
    applyRoomAction(b, 'h', 'becomeScreen', {});
    applyRoomAction(b, 'h', 'chooseGame', { game: 'chess4' });
    applyRoomAction(b, 'h', 'options', { mode: mode });
    for (let k = 0; k < 4; k++) applyRoomAction(b, 'h', 'addBot', { level: lvl === 'mix' ? (k % 2 ? 'hard' : 'easy') : lvl, name: 'B' });
    applyRoomAction(b, 'h', 'start', {});
    for (let step = 0; step < 1000 && b.shared.phase === 'play'; step++) {
      if (typeof b._botAt !== 'number') break;
      clock = Math.max(clock, b._botAt) + 1;
      roomTimeout(b, clock);
    }
    if (b.shared.phase === 'over' && b.shared.g.over) ended++;
  }
  console.error = errorWas;
  check(ended === games && !errors.length, `chess4 bots: ${games} whole room games of computer players, teams and FFA, easy and hard, all ended, no move refused (${ended})` + (errors.length ? ': ' + errors[0] : ''));
}

// Audit 24 Sep 2026, group 2
{
  const { readFileSync } = await import('node:fs');
  const refused = (fn) => { try { fn(); return false; } catch (e) { return true; } };

  // كدّاب: a follower who leaves on their turn passes, and a pass closes the call window.
  {
    const r = newRoom(['a', 'b', 'c', 'd']);
    applyRoomAction(r, 'a', 'chooseGame', { game: 'doubt' });
    applyRoomAction(r, 'a', 'start', {});
    const [A, B] = r.shared.order;
    let n = 70000;
    const hand = (...cs) => cs.map((c) => ({ i: n++, c }));
    const hands = [hand('7h'), hand('7d', '3h'), hand('5c', '6c'), hand('9d', '2c')];
    r.shared.order.forEach((id, k) => { r._doubt.hands[id] = hands[k]; });
    r._doubt.pile = [];
    Object.assign(r.shared, { rank: null, plays: [], last: null, passed: [], places: [], pendingOut: null });
    r.shared.turn = { pid: A, stage: 'lead' };
    r.shared.turnSeq++;
    applyRoomAction(r, A, 'play', { cards: [hands[0][0].i], rank: '7', seq: r.shared.turnSeq });
    check(r.shared.pendingOut === A && r.shared.turn.pid === B, 'audit/doubt: the leader lays their last card, open to a call, and the next follows');
    leave(r, B);
    check(!r.shared.last && r.shared.places[0] === A && r.shared.phase === 'gameover',
      'audit/doubt: the follower leaves on their turn: a pass - the call window closes and the last play stands (first out wins)');
  }

  // بنك الحظ: no bankruptcy while selling and mortgaging would cover the debt.
  {
    const B = new Function(readFileSync(new URL('../../BankAlhaz.js', import.meta.url), 'utf8') +
      '\nreturn { bankNewGame, bankFillTokens, bankRoll, bankBankrupt, bankAuto, bankLiquid };')();
    const made = B.bankNewGame(['a', 'b'], B.bankFillTokens(['a', 'b'], {}), 'a', { length: 0, firstLap: false }, 0, Math.random);
    const g = made.g, priv = made.priv;
    g.own[5] = { by: 'a', lvl: 0, mort: false };
    g.cash.a = 100; g.pos.a = 0;
    B.bankRoll(g, priv, 'a', [1, 3], Math.random);
    check(g.turn.stage === 'debt' && g.debt && B.bankLiquid(g, 'a') >= g.debt.amount, 'audit/bank: a debt the cash can\'t pay but a mortgage can');
    check(refused(() => B.bankBankrupt(g, priv, 'a', 0)) && g.out.indexOf('a') === -1 && g.turn.stage === 'debt',
      'audit/bank: going bankrupt is refused while the debt can still be raised');
    B.bankAuto(g, priv, 'a', Math.random, 0);
    check(g.out.indexOf('a') === -1 && !g.debt && g.own[5].mort, 'audit/bank: the clock\'s turn for them raises the money and pays, no bankruptcy');
  }

  // لودو: a leaver's wall no longer in the way - what can move is worked out again.
  {
    const L = new Function(readFileSync(new URL('../../Ludo.js', import.meta.url), 'utf8') +
      '\nreturn { ludoNewGame, ludoMovable, ludoRemovePlayer, ludoWallAt };')();
    const g = L.ludoNewGame(['a', 'b', 'c'], { a: 'G', b: 'Y', c: 'B' }, 'a');
    g.pieces.a = [20, 5, -1, -1];
    g.pieces.b = [46, 46, -1, -1];            // Yellow's rel 46 is square 7: a wall in front of Green's piece on 5
    g.turn = { pid: 'a', stage: 'move', dice: 3, sixes: 0 };
    g.movable = L.ludoMovable(g, 'a', 3);
    check(L.ludoWallAt(g, 7) === 'b' && g.movable.join() === '0', 'audit/ludo: a wall keeps one piece from moving');
    L.ludoRemovePlayer(g, 'b');
    check(g.phase === 'play' && g.turn.pid === 'a' && g.movable.join() === '0,1', 'audit/ludo: the wall\'s player leaves: the blocked piece can move now, and is lit');
  }

  // شطرنج: a handicap on a 960 room takes the piece off that game's 960 row.
  {
    const CH = new Function(readFileSync(new URL('../../Chess.js', import.meta.url), 'utf8') +
      '\nreturn { chessOddsFen, chessHandicapFen, chess960Start, chessFromFen, CHESS_START_FEN };')();
    check(['pawn', 'knight', 'rook', 'queen'].every((k) => ['w', 'b'].every((sd) => CH.chessOddsFen(CH.CHESS_START_FEN, k, sd) === CH.chessHandicapFen(k, sd))),
      'audit/chess odds: on the standard start, chessOddsFen is the handicap as before');
    check(CH.chessOddsFen(CH.CHESS_START_FEN, 'time', 'w') === CH.CHESS_START_FEN, 'audit/chess odds: time odds take no piece');
    const row = CH.chess960Start(96);
    const rk = CH.chessFromFen(CH.chessOddsFen(row, 'rook', 'w'));
    const r0 = CH.chessFromFen(row);
    check(rk.board.filter((x) => x === 4).length === 1 && !(rk.castle & 2) && (rk.castle & 1) && r0.board.filter((x) => x === 4).length === 2,
      'audit/chess odds: on a 960 row the rook nearest the a-file goes, and that side\'s castling with it');

    const r = newRoom(['a', 'b', 'c']);
    applyRoomAction(r, 'a', 'chooseGame', { game: 'chess' });
    applyRoomAction(r, 'a', 'start', { variant: '960', odds: 'knight' });
    const [w1, b1] = r.shared.seats;
    applyRoomAction(r, w1, 'resign', { round: 1 });
    check(r.shared.champ === b1, 'audit/chess room 960: the first game has a champion');
    const realRandom = Math.random;
    Math.random = () => 0.1;                  // the next 960 row: number 96
    try { applyRoomAction(r, 'a', 'nextRound', { round: 1 }); } finally { Math.random = realRandom; }
    const side = r.shared.seats.indexOf(b1) === 0 ? 'w' : 'b';
    const want = CH.chessFromFen(CH.chessOddsFen(row, 'knight', side)).board.join();
    check(r.shared.chess.g.board.join() === want,
      'audit/chess room 960: with a champion, the game is still a 960 row, the champion\'s knight taken off it');
  }

  // شطرنج الأربعة FFA: someone going out off-turn gives the player up no time back, and their move still counts.
  {
    const C4 = new Function(readFileSync(new URL('../../Chess4.js', import.meta.url), 'utf8') + '\nreturn { chess4Legal };')();
    const r = newRoom(['h', 'p', 'q', 'w']);
    applyRoomAction(r, 'h', 'chooseGame', { game: 'chess4' });
    applyRoomAction(r, 'h', 'options', { mode: 'ffa', clock: 1 });
    applyRoomAction(r, 'h', 'start', {});
    const s = () => r.shared;
    const who = () => s().seats[s().g.turn];
    for (let k = 0; k < 4; k++) { clock += 1000; applyRoomAction(r, who(), 'move', Object.assign({}, C4.chess4Legal(s().g)[0], { seq: s().turnSeq })); }
    const upSeat = s().g.turn, upId = who();
    const at0 = s().clock.at, left0 = s().clock.left[upSeat], seq0 = s().turnSeq;
    check(at0 === clock, 'audit/chess4: the clock of the player up runs');
    clock += 40000;
    const other = s().seats.find((id, k) => k !== upSeat && !s().g.out[k]);
    applyRoomAction(r, other, 'resign', {});
    check(s().g.out[s().seats.indexOf(other)] && s().g.turn === upSeat && s().clock.at === at0 && s().turnSeq === seq0,
      'audit/chess4: another player resigns off-turn: the clock of the player up keeps running from when it started');
    applyRoomAction(r, upId, 'move', Object.assign({}, C4.chess4Legal(s().g)[0], { seq: seq0 }));
    check(s().g.turn !== upSeat && s().clock.left[upSeat] <= left0 - 40000 + 5000,
      'audit/chess4: the move sent meanwhile counts, and the 40 seconds are charged');
  }
}

/* --- the audit of 24 Sep 2026: stale taps, leaving, the Stop log ----------------------------- */
{
  const leave = (r, id) => {
    r.players = r.players.filter((p) => p.id !== id);
    roomPlayerLeft(r, id, id.toUpperCase());
  };
  const begin = (game, ids, payload) => {
    const r = newRoom(ids);
    applyRoomAction(r, ids[0], 'chooseGame', { game });
    applyRoomAction(r, ids[0], 'start', payload || {});
    return r;
  };

  // أسماء الرموز: the host's pass carries the team it passes.
  {
    const r = newRoom(['r1', 'r2', 'b1', 'b2']);
    applyRoomAction(r, 'r1', 'chooseGame', { game: 'codenames' });
    [['r1', 'red', 'spymaster'], ['r2', 'red', 'operative'], ['b1', 'blue', 'spymaster'], ['b2', 'blue', 'operative']]
      .forEach(([id, team, role]) => applyRoomAction(r, id, 'setTeam', { team, role }));
    applyRoomAction(r, 'r1', 'start', { lang: 'en' });
    const t0 = r.shared.turn;
    applyRoomAction(r, 'r1', 'passTurn', { turn: t0 });
    applyRoomAction(r, 'r1', 'passTurn', { turn: t0 });
    check(r.shared.turn !== t0, 'audit2/codenames: a double tap on "pass the turn" passes one turn, not two');
  }

  // تحدي المعلومات: an answer aimed at the last question doesn't land on this one.
  {
    const r = begin('trivia', ['a', 'b'], { lang: 'ar', count: 5 });
    applyRoomAction(r, 'a', 'closeQuestion', {});
    applyRoomAction(r, 'a', 'nextQuestion', {});
    applyRoomAction(r, 'b', 'answer', { choice: 0, qIndex: 0 });
    check(r.shared.qIndex === 1 && r.shared.answered.indexOf('b') === -1, 'audit2/trivia: a late answer to question 1 is dropped on question 2');
  }

  // العقل: a double tap on the lowest card plays one card.
  {
    const r = begin('mind', ['a', 'b', 'c']);
    r.secrets.a = { cards: [10, 50] };
    r.secrets.b = { cards: [30] };
    r.secrets.c = { cards: [70] };
    r.shared.held = { a: 2, b: 1, c: 1 };
    const lives = r.shared.lives;
    applyRoomAction(r, 'a', 'play', { card: 10 });
    applyRoomAction(r, 'a', 'play', { card: 10 });
    check(r.secrets.a.cards.join() === '50' && r.shared.lives === lives && r.shared.pile.length === 1,
      'audit2/mind: the second tap of a double tap is dropped, no card thrown and no heart lost');
  }

  // خمس ثواني and قبل ولا بعد: the host's skip names the player it skips.
  {
    const r = begin('fiveseconds', ['a', 'b', 'c'], { lang: 'ar', rounds: 2 });
    const up = r.shared.turnId;
    applyRoomAction(r, 'a', 'skipTurn', { turnId: up });
    const next = r.shared.turnId;
    applyRoomAction(r, 'a', 'skipTurn', { turnId: up });
    check(next !== up && r.shared.turnId === next, 'audit2/five seconds: a double tap on skip skips one player');
  }
  {
    const r = begin('timeline', ['a', 'b', 'c'], { lang: 'ar' });
    const up = r.shared.turnId;
    applyRoomAction(r, 'a', 'skipTurn', { turnId: up });
    const next = r.shared.turnId;
    applyRoomAction(r, 'a', 'skipTurn', { turnId: up });
    check(next !== up && r.shared.turnId === next, 'audit2/timeline: a double tap on skip skips one player');
  }

  // أتوبيس كومبليت: a category that isn't one reaches no prototype; the log counts a cell once.
  {
    const r = begin('stop', ['a', 'b', 'c'], { lang: 'ar', cats: ['name', 'animal'], timer: 0, rounds: 2 });
    r.shared.letter = 'ب';
    applyRoomAction(r, 'a', 'submit', { answers: { name: 'باسم', animal: 'بزززظ' }, stop: true });
    applyRoomAction(r, 'b', 'submit', { answers: { name: 'بسمة', animal: 'بزززظ' } });
    applyRoomAction(r, 'c', 'submit', { answers: { name: 'بلبلخ', animal: 'بطة' } });
    applyRoomAction(r, 'a', 'adjust', { playerId: 'c', cat: '__proto__', pts: 10 });
    applyRoomAction(r, 'a', 'adjust', { playerId: '__proto__', cat: 'toString', pts: 10 });
    const polluted = ({}).pts !== undefined || ({}).manual !== undefined || Object.prototype.toString.pts !== undefined;
    delete Object.prototype.pts; delete Object.prototype.manual; delete Object.prototype.toString.pts; delete Object.prototype.toString.manual;
    check(!polluted, 'audit2/stop: an adjust naming "__proto__" touches no prototype');
    applyRoomAction(r, 'a', 'adjust', { playerId: 'c', cat: 'name', pts: 10 });
    applyRoomAction(r, 'a', 'adjust', { playerId: 'c', cat: 'name', pts: 0 });
    applyRoomAction(r, 'a', 'adjust', { playerId: 'c', cat: 'name', pts: 10 });
    check((r._stopTaps || []).length === 1, 'audit2/stop: a cell cycled through 0 and back is logged once');
  }

  // لو خيروك, مين أكثر واحد, صدق ولا كذب: a vote from the last ballot doesn't count in this one.
  {
    const r = begin('wouldyou', ['a', 'b'], { lang: 'ar' });
    applyRoomAction(r, 'a', 'vote', { option: 'a', round: 1 });
    applyRoomAction(r, 'b', 'vote', { option: 'a', round: 1 });
    applyRoomAction(r, 'a', 'nextRound', { lang: 'ar' });
    applyRoomAction(r, 'a', 'vote', { option: 'b', round: 1 });
    check(r.shared.round === 2 && r.shared.vote.voted.length === 0, 'audit2/would you rather: a vote for the last round is dropped');
  }
  {
    const r = begin('mostlikely', ['a', 'b', 'c'], { lang: 'ar' });
    applyRoomAction(r, 'a', 'closeVote', {});
    applyRoomAction(r, 'a', 'nextRound', { lang: 'ar' });
    applyRoomAction(r, 'b', 'vote', { option: 'a', round: 1 });
    check(r.shared.round === 2 && r.shared.vote.voted.length === 0, 'audit2/most likely: a vote for the last round is dropped');
  }
  {
    const r = begin('twotruths', ['a', 'b', 'c']);
    ['a', 'b', 'c'].forEach((id) => applyRoomAction(r, id, 'submit', { statements: ['1', '2', '3'], lie: 0 }));
    const voters = () => r.shared.roster.filter((id) => id !== r.shared.subjectId);
    voters().forEach((id) => applyRoomAction(r, id, 'vote', { option: 'i0', turn: 0 }));
    applyRoomAction(r, 'a', 'next', {});
    const v = voters()[0];
    applyRoomAction(r, v, 'vote', { option: 'i1', turn: 0 });
    check(r.shared.turn === 1 && r.shared.vote.voted.length === 0, 'audit2/two truths: a vote on the last storyteller\'s ballot is dropped');
  }

  // ربع قرد: the host's undo takes back one letter.
  {
    const r = begin('monkey', ['a', 'b', 'c'], { lang: 'ar', mode: 'letters', category: 'countries', timer: 0, winners: 1 });
    applyRoomAction(r, r.shared.turnId, 'letter', { ch: 'م' });
    applyRoomAction(r, r.shared.turnId, 'letter', { ch: 'ص' });
    applyRoomAction(r, 'a', 'undo', { n: 2 });
    applyRoomAction(r, 'a', 'undo', { n: 2 });
    check(r.shared.letters.length === 1, 'audit2/monkey: a double tap on undo takes back one letter');
  }

  // ارسم واكتب: the host's «التالي» moves the reveal one step.
  {
    const r = begin('telephone', ['a', 'b', 'c'], { lang: 'ar' });
    for (let k = 0; k < 6 && r.shared.phase !== 'reveal'; k++) {
      const step = r.shared.step;
      ['a', 'b', 'c'].forEach((id) => {
        const task = (r.secrets[id] || {}).task;
        if (!task || r.shared.submitted.indexOf(id) !== -1) return;
        applyRoomAction(r, id, 'submit', task.kind === 'draw' ? { strokes: [], step } : { text: 'x' + id, step });
      });
    }
    check(r.shared.phase === 'reveal', 'audit2/telephone: the chains reach the reveal');
    applyRoomAction(r, 'a', 'revealNext', { at: '0:0' });
    applyRoomAction(r, 'a', 'revealNext', { at: '0:0' });
    check(r.shared.reveal.chain === 0 && r.shared.reveal.step === 1, 'audit2/telephone: a double tap on next moves the reveal one step');
  }

  // شطرنج بالتصويت and المخ والإيد: someone who leaves the lobby comes off its seats.
  {
    const r = newRoom(['a', 'b', 'c', 'd']);
    applyRoomAction(r, 'a', 'chooseGame', { game: 'votechess' });
    applyRoomAction(r, 'a', 'sides', { shuffle: true });
    leave(r, 'd');
    check(r.phase === 'lobby' && !Object.prototype.hasOwnProperty.call(r.shared.lobby.sides, 'd'), 'audit2/votechess: a leaver comes off the lobby\'s sides');
  }
  {
    const r = newRoom(['a', 'b', 'c', 'd']);
    applyRoomAction(r, 'a', 'chooseGame', { game: 'handbrain' });
    applyRoomAction(r, 'a', 'seats', {});
    leave(r, 'd');
    const order = (r.shared.lobby && r.shared.lobby.order) || [];
    check(order.indexOf('d') === -1, 'audit2/handbrain: a leaver comes off the lobby\'s seats');
  }
  // المخ والإيد: a leave mid-game runs its own leave only, not bughouse's after it.
  {
    const r = newRoom(['a', 'b', 'c', 'd']);
    applyRoomAction(r, 'a', 'chooseGame', { game: 'handbrain' });
    applyRoomAction(r, 'a', 'seats', { order: ['a', 'b', 'c', 'd'] });
    applyRoomAction(r, 'a', 'start', {});
    // A field bughouse's leave would act on: with the fall-through it seated a second computer player.
    r.shared.seats = ['b'];
    const before = r.players.length;
    leave(r, 'b');
    check(r.players.length === before, 'audit2/handbrain: one computer player takes the leaver\'s seat, and only one');
  }
}

// Hidden queen, 24 Sep 2026: الوزير المستخبي - the rules (Chess.js) and the room (RoomChess.js).
{
  const HQ = new Function(readFileSync(new URL('../../Chess.js', import.meta.url), 'utf8') +
    '\nreturn { chessNew, chessFromFen, chessPlay, chessPerft, chessLegalMoves, chessStatus, chessHqNew, chessHqPick, chessHqMoves, chessHqPlay, chessHqReplay, chessHqLegal, chessBestMove, chessReview, chessFromUci, chessUci };')();
  const sq = (n) => 'abcdefgh'.indexOf(n[0]) + (Number(n[1]) - 1) * 8;
  const tos = (list) => list.map((m) => m.to).sort().join(',');

  // The extra moves: queen moves from the pawn's square that a pawn couldn't make.
  {
    const g = HQ.chessNew();
    const x = tos(HQ.chessHqMoves(g, 'e2'));
    check(x === 'a6,b5,c4,d3,e5,e6,e7,f3,g4,h5', 'hidden queen: from e2 at the start, the queen moves a pawn couldn\'t make (e5-e7 up the file past its steps, both diagonals) - not e3, e4');
    check(HQ.chessHqMoves(g, 'e7').length === 0 && HQ.chessHqMoves(g, 'd1').length === 0, 'hidden queen: only a pawn of the side to move has extra moves');
    const k = HQ.chessFromFen('4k3/8/8/8/8/8/4P3/4K3 w - - 0 1');
    check(!HQ.chessHqMoves(k, 'e2').some((m) => m.to === 'e8'), 'hidden queen: never onto a king (e2 up the file stops short of e8)');
    const pin = HQ.chessFromFen('4r1k1/8/8/8/8/8/4P3/4K3 w - - 0 1');
    check(HQ.chessHqMoves(pin, 'e2').every((m) => m.to[0] === 'e'), 'hidden queen: pinned on the file, it may only move along the pin (never leaving its king in check)');
    const chk = HQ.chessFromFen('4k3/8/8/8/8/8/3P4/r3K3 w - - 0 1');
    check(tos(HQ.chessHqMoves(chk, 'd2')) === 'c1,d1', 'hidden queen: in check along the first rank, only the queen moves that block it (c1, d1)');
  }

  // Pawn moves keep it hidden, the secret follows; a queen move reveals it.
  {
    const g = HQ.chessNew();
    const h = HQ.chessHqNew();
    check(HQ.chessHqPick(h, g, 0, 'e2') && HQ.chessHqPick(h, g, 1, 'd7'), 'hidden queen: each side picks a pawn of its own');
    check(!HQ.chessHqPick(h, g, 0, 'd2') && !HQ.chessHqPick(HQ.chessHqNew(), g, 0, 'd7') && !HQ.chessHqPick(HQ.chessHqNew(), g, 0, 'e1'),
      'hidden queen: a second pick, the other side\'s pawn or another piece is refused');
    let i = HQ.chessHqPlay(g, h, { from: 'e2', to: 'e4' });
    check(i && !i.hq.reveal && h.sq[0] === sq('e4') && g.board[sq('e4')] === 1, 'hidden queen: the double step is a pawn move - it stays hidden, the secret on e4');
    HQ.chessHqPlay(g, h, { from: 'd7', to: 'd5' });
    i = HQ.chessHqPlay(g, h, { from: 'e4', to: 'd5' });
    check(i && !i.hq.reveal && i.hq.captured && i.capture === 'q' && h.sq[0] === sq('d5') && h.sq[1] === -1 && h.how[1] === 'captured',
      'hidden queen: a pawn capture keeps it hidden; taking the other hidden pawn reveals that one, counted as a queen');
    const opp = HQ.chessLegalMoves(g).map((m) => m.from + m.to).sort().join();
    const plain = HQ.chessLegalMoves(HQ.chessFromFen('rnbqkbnr/ppp1pppp/8/3P4/8/8/PPPP1PPP/RNBQKBNR b KQkq - 0 2')).map((m) => m.from + m.to).sort().join();
    check(opp === plain, 'hidden queen: the other side\'s legal moves are the same as with a plain pawn there');
    i = HQ.chessHqPlay(g, h, { from: 'c7', to: 'c6' });
    i = HQ.chessHqPlay(g, h, { from: 'd5', to: 'a8' });
    check(i === null, 'hidden queen: a queen move through a piece is refused');
    i = HQ.chessHqPlay(g, h, { from: 'd5', to: 'd6' });
    check(i && !i.hq.reveal && h.sq[0] === sq('d6'), 'hidden queen: a single step is a pawn move');
    HQ.chessHqPlay(g, h, { from: 'g8', to: 'f6' });
    i = HQ.chessHqPlay(g, h, { from: 'd6', to: 'a3' });
    check(i && i.hq.reveal && i.san === 'Qa3' && i.uci === 'd6a3*' && g.board[sq('a3')] === 5 && h.sq[0] === -1 && h.how[0] === 'reveal' && h.at[0] === sq('a3'),
      'hidden queen: a queen move reveals it - a real queen on a3 (Qa3), stored as d6a3*');
  }
  // En passant keeps the secret; promotion ends it hidden.
  {
    const g = HQ.chessFromFen('4k3/3p4/8/4P3/8/8/8/4K3 b - - 0 1');
    const h = HQ.chessHqNew();
    HQ.chessHqPick(h, g, 0, 'e5');
    HQ.chessHqPlay(g, h, { from: 'd7', to: 'd5' });
    const i = HQ.chessHqPlay(g, h, { from: 'e5', to: 'd6' });
    check(i && i.ep && !i.hq.reveal && h.sq[0] === sq('d6'), 'hidden queen: en passant is a pawn move - the secret follows it to d6');
    const p = HQ.chessFromFen('7k/4P3/8/8/8/8/8/4K3 w - - 0 1');
    const hp = HQ.chessHqNew();
    HQ.chessHqPick(hp, p, 0, 'e7');
    const pr = HQ.chessHqPlay(p, hp, { from: 'e7', to: 'e8', promo: 'n' });
    check(pr && pr.hq.promoted && !pr.hq.reveal && hp.sq[0] === -1 && hp.how[0] === 'promoted' && p.board[sq('e8')] === 2,
      'hidden queen: reaching the last rank still hidden, it promotes like any pawn (a knight here) and the secret is gone');
  }
  // It never gives check while hidden; a way out through it is not mate; perft untouched.
  {
    const g = HQ.chessFromFen('4k3/8/8/8/8/8/4P3/4K3 w - - 0 1');
    const h = HQ.chessHqNew();
    HQ.chessHqPick(h, g, 0, 'e2');
    HQ.chessHqPlay(g, h, { from: 'e1', to: 'd1' });
    check(!HQ.chessStatus(g).check && HQ.chessLegalMoves(g).some((m) => m.from === 'e8' && m.to === 'e7'),
      'hidden queen: a hidden queen on the file gives no check, and the king may walk onto its line');
    const m = HQ.chessFromFen('6rk/8/8/8/8/8/5PPP/4r1K1 w - - 0 1');
    const hm = HQ.chessHqNew();
    HQ.chessHqPick(hm, m, 0, 'f2');
    const before = HQ.chessFromFen('6rk/8/8/8/8/8/5PPP/6K1 b - - 0 1');
    const hb = HQ.chessHqNew();
    HQ.chessHqPick(hb, before, 0, 'f2');
    const mated = HQ.chessHqPlay(before, hb, { from: 'g8', to: 'e8' });
    HQ.chessHqPlay(before, hb, { from: 'g1', to: 'h1' });
    const back = HQ.chessHqPlay(before, hb, { from: 'e8', to: 'e1' });
    check(mated && back && !back.status.over && back.status.check && /\+$/.test(back.san),
      'hidden queen: a "mate" its hidden queen can answer (f2 to f1) is not mate - the game goes on');
    const esc = HQ.chessHqPlay(before, hb, { from: 'f2', to: 'f1' });
    check(esc && esc.hq.reveal && before.board[sq('f1')] === 5, 'hidden queen: and the hidden queen blocks it by revealing itself');
    check([1, 2, 3, 4].map((d) => HQ.chessPerft(HQ.chessNew(), d)).join() === '20,400,8902,197281', 'hidden queen: perft from the start unchanged (20, 400, 8902, 197281)');
  }
  // A stored game replays; the review reads the marker; the computer considers its own hidden queen.
  {
    const r = HQ.chessHqReplay('', [sq('e2'), sq('d7')], ['e2e4', 'd7d5', 'e4e6*', 'f7e6']);
    check(r.infos.length === 4 && r.sans.join(' ') === 'e4 d5 Qe6👑 fxe6' && r.h.how[0] === 'reveal' && r.lost[0].join() === 'q',
      'hidden queen: a stored game replays - the reveal written as a queen move with 👑, the queen then taken');
    const mv = HQ.chessFromUci('e4e6*');
    check(mv.hq === true && mv.promo === '' && HQ.chessUci(Object.assign({}, mv)) === 'e4e6*', 'hidden queen: the marker reads and writes back');
    const rv = HQ.chessReview({ start: '', moves: ['e2e4', 'd7d5', 'e4e6*', 'f7e6'] }, { nodes: 1500 });
    check(rv.moves.length === 4 && rv.moves[2].san === 'Qe6👑', 'hidden queen: the review plays the revealing move and judges all four');
    const bot = HQ.chessBestMove(HQ.chessFromFen('4k3/8/8/8/8/8/4P3/4K3 w - - 0 1'), { elo: 2000, hq: sq('e2'), ms: 400, nodes: 20000 });
    check(bot && bot.hq === true && bot.from === 'e2', 'hidden queen: the computer finds its own hidden queen\'s move when it wins (a lone queen)');
    const plainBot = HQ.chessBestMove(HQ.chessFromFen('4k3/8/8/8/8/8/4P3/4K3 w - - 0 1'), { elo: 2000, ms: 200, nodes: 8000 });
    check(plainBot && !plainBot.hq, 'hidden queen: without its square the computer never plays one');
  }

  // The room: winner stays with the hidden queen.
  const hqRoom = (ids, payload) => {
    const r = newRoom(ids);
    applyRoomAction(r, ids[0], 'chooseGame', { game: 'chess' });
    applyRoomAction(r, ids[0], 'start', Object.assign({ variant: 'hq' }, payload || {}));
    return r;
  };
  const threwH = (fn) => { try { fn(); return false; } catch (e) { return true; } };
  const hmv = (r, pid, m) => { const [from, to, promo] = m.split(/[-=]/); applyRoomAction(r, pid, 'move', { from, to, promo, move: r.shared.chess.moves }); };
  {
    const r = hqRoom(['a', 'b', 'c'], { odds: 'queen' });
    const s = r.shared;
    const [W, B] = s.seats;
    check(s.settings.variant === 'hq' && s.chess.hq && s.chess.hq.picking && s.chess.g.board.filter((x) => x === 5).length === 1,
      'hidden queen room: the deal starts a pick, from the usual start (no handicap with it)');
    check(!s.chess.hq.pickEnds, 'hidden queen room: no pick clock when the room plays without a clock');
    check(threwH(() => hmv(r, W, 'e2-e4')), 'hidden queen room: no move before both have picked');
    check(threwH(() => applyRoomAction(r, W, 'hqPick', { sq: 'e7', round: s.round })), 'hidden queen room: a pick of the other side\'s pawn is refused');
    check(threwH(() => applyRoomAction(r, s.line[0], 'hqPick', { sq: 'e2', round: s.round })), 'hidden queen room: a watcher can\'t pick');
    applyRoomAction(r, W, 'hqPick', { sq: 'e2', round: s.round - 1 });
    check(!r.shared.chess.hq.picked[0], 'hidden queen room: a pick drawn for the last game is dropped');
    applyRoomAction(r, W, 'hqPick', { sq: 'e2', round: s.round });
    check(r.shared.chess.hq.picked[0] && r.secrets[W].hq === 'e2' && !r.secrets[B].hq && !JSON.stringify(r.shared).includes('"e2"'),
      'hidden queen room: White\'s pick is on White\'s slice only; the table sees only that White has picked');
    applyRoomAction(r, W, 'hqPick', { sq: 'd2', round: s.round });
    check(r.secrets[W].hq === 'e2', 'hidden queen room: a second pick changes nothing');
    applyRoomAction(r, B, 'hqPick', { sq: 'd7', round: s.round });
    check(!r.shared.chess.hq.picking && r._chq.sq[1] === sq('d7'), 'hidden queen room: both picked - the game is on');
    hmv(r, W, 'e2-e4');
    check(r.secrets[W].hq === 'e4' && !r.shared.chess.last.hq, 'hidden queen room: a pawn move of it - the secret follows it, the table sees a pawn move');
    check(threwH(() => hmv(r, B, 'c7-a5')), 'hidden queen room: a queen move from a pawn that isn\'t your hidden one is refused');
    hmv(r, B, 'a7-a6');
    const n = r.shared.chess.moves;
    applyRoomAction(r, W, 'move', { from: 'e4', to: 'e6', move: n - 1 });
    check(r.shared.chess.moves === n, 'hidden queen room: a stale tap is dropped');
    hmv(r, W, 'e4-e6');
    const bd = r.shared.chess;
    check(bd.g.board[sq('e6')] === 5 && bd.last.hq && bd.last.hq.reveal && bd.hist[bd.hist.length - 1] === 'e4e6*' && /👑$/.test(bd.sans[bd.sans.length - 1]) &&
      bd.hq.events.length === 1 && bd.hq.events[0].kind === 'reveal' && r.secrets[W].hq === '',
      'hidden queen room: a queen move reveals it on every screen - stored e4e6*, 👑 in the move list, the secret gone');
    // Black takes it: the queen counts.
    hmv(r, B, 'f7-e6');
    check(r.shared.chess.lost[0].join() === 'q', 'hidden queen room: a revealed queen taken counts as a queen');
    applyRoomAction(r, W, 'resign', { round: r.shared.round });
    const end = r.shared.chess.hq.end;
    check(r.shared.phase === 'over' && end && end[0].pick === 'e2' && end[0].how === 'reveal' && end[1].pick === 'd7' && end[1].how === 'hidden' && end[1].at === 'd7',
      'hidden queen room: the end reveals both picks - and what became of each');
    applyRoomAction(r, W, 'nextRound', { round: r.shared.round });
    check(r.shared.chess.hq && r.shared.chess.hq.picking && !r.shared.chess.hq.picked[0] && !r.shared.chess.hq.picked[1] && r._chq.pick[0] === -1 && !Object.keys(r.secrets).some((k) => r.secrets[k].hq),
      'hidden queen room: play again deals a new pick, the old secrets gone');
  }
  // The hidden queen accepted only for its owner; the clock's random pick; the host's pick.
  {
    const r = hqRoom(['a', 'b'], { clock: '5+0' });
    const s = r.shared;
    const [W, B] = s.seats;
    check(s.chess.hq.pickEnds === clock + 60000 && roomDeadline(r) === s.chess.hq.pickEnds, 'hidden queen room: with a clock, the pick has a minute of its own');
    applyRoomAction(r, W, 'hqPick', { sq: 'd2', round: s.round });
    clock += 60001;
    check(roomTimeout(r, clock) && !r.shared.chess.hq.picking && r._chq.pick[1] >= 48 && r._chq.pick[1] < 56 && r.secrets[B].hq,
      'hidden queen room: the pick clock runs out - Black gets a random pawn of their own');
    check(r.shared.chess.clock.at === null || r.shared.chess.clock.at === undefined, 'hidden queen room: the chess clock hasn\'t started while picking');
    hmv(r, W, 'e2-e4');
    const bs = r._chq.sq[1];
    const bsq = 'abcdefgh'[bs & 7] + ((bs >> 3) + 1);
    // Black's hidden pawn: a queen move of it for its owner only.
    const extra = HQ.chessHqMoves(r.shared.chess.g, bsq);
    check(extra.length > 0, 'hidden queen room: Black\'s hidden pawn has queen moves');
    const qm = extra[0];
    check(threwH(() => applyRoomAction(r, W, 'move', { from: qm.from, to: qm.to, move: r.shared.chess.moves })), 'hidden queen room: not White\'s move');
    applyRoomAction(r, B, 'move', { from: qm.from, to: qm.to, move: r.shared.chess.moves });
    check(r.shared.chess.last.hq && r.shared.chess.last.hq.reveal && r.shared.chess.g.board[sq(qm.to)] === 13, 'hidden queen room: its owner\'s queen move is accepted and reveals it');
    // White's pawn d2 is still hidden: someone else's queen move from d2 is refused (d2 isn't theirs to move anyway), and a plain game refuses it.
    const plain = newRoom(['a', 'b']);
    applyRoomAction(plain, 'a', 'chooseGame', { game: 'chess' });
    applyRoomAction(plain, 'a', 'start', {});
    check(threwH(() => hmv(plain, plain.shared.seats[0], 'e2-e5')) && !plain.shared.chess.hq, 'hidden queen room: in a standard game a pawn never moves like a queen');
  }
  {
    const r = hqRoom(['a', 'b']);
    const s = r.shared;
    check(threwH(() => applyRoomAction(r, 'b', 'skipTurn', { move: 0 })), 'hidden queen room: only the host plays for someone');
    applyRoomAction(r, 'a', 'skipTurn', { move: 0 });
    check(!r.shared.chess.hq.picking && r._chq.pick[0] >= 8 && r._chq.pick[0] < 16 && r._chq.pick[1] >= 48, 'hidden queen room: the host\'s "play for" picks a random pawn for whoever hasn\'t');
    // A whole game of host moves: every move legal, the end reveals both.
    let guard = 0;
    while (r.shared.phase === 'play' && guard++ < 400) applyRoomAction(r, 'a', 'skipTurn', { move: r.shared.chess.moves });
    if (r.shared.phase === 'play') applyRoomAction(r, r.shared.seats[0], 'resign', { round: r.shared.round });
    check(r.shared.phase === 'over' && r.shared.chess.hq.end && r.shared.chess.hq.end.every((e) => e.pick),
      'hidden queen room: a game played out by the host\'s moves ends with both picks shown');
  }
  // A tournament never deals it.
  {
    const r = newRoom(['a', 'b', 'c', 'd']);
    applyRoomAction(r, 'a', 'chooseGame', { game: 'chess' });
    applyRoomAction(r, 'a', 'start', { tournament: true, variant: 'hq' });
    for (let k = 0; k < 4; k++) { clock += 5000; roomTimeout(r, clock); }
    const games = Object.values(r.shared.games || {});
    check(games.length && games.every((g) => !g.chess || !g.chess.hq) && !r._chq, 'hidden queen: a tournament plays it standard (no hidden queens in a bracket)');
  }
  // Someone leaves while picking: a forfeit, and the picks shown.
  {
    const r = hqRoom(['a', 'b', 'c']);
    const [W, B] = r.shared.seats;
    applyRoomAction(r, W, 'hqPick', { sq: 'a2', round: r.shared.round });
    leave(r, B);
    check(r.shared.phase === 'over' && r.shared.chess.hq.end && r.shared.chess.hq.end[0].pick === 'a2', 'hidden queen room: a player who leaves while picking loses by forfeit, the picks shown');
  }
}

// --- The audience (the improvement plan, Phase 4): cheers and guessing who wins ---
{
  console.log('\nAudience');
  const r = newRoom(['a', 'b', 'c', 'd']);
  applyRoomAction(r, 'a', 'chooseGame', { game: 'buzzer' });
  applyRoomAction(r, 'a', 'start', {});
  check(r.predict && r.predict.game === 'buzzer' && r.predict.until > clock, 'audience: a game dealt opens the guessing');
  applyRoomAction(r, 'c', 'predict', { target: 'b' });
  applyRoomAction(r, 'd', 'predict', { target: 'c' });
  let refused = false;
  try { applyRoomAction(r, 'd', 'predict', { target: 'zz' }); } catch (e) { refused = true; }
  check(refused && r.predict.picks.d === 'c', 'audience: a guess must name someone in the game');
  applyRoomAction(r, 'c', 'cheer', { e: 'zaghrouta' });
  check(r.cheer && r.cheer.e === 'zaghrouta' && r.cheer.seq === 1 && r.cheer.name === 'C', 'audience: a cheer is public, with who sent it');
  for (let k = 0; k < 6; k++) applyRoomAction(r, 'c', 'cheer', { e: 'fire' });
  check(r.cheer.seq === 4, 'audience: four cheers in three seconds from one phone, then the rest are dropped');
  refused = false;
  try { applyRoomAction(r, 'c', 'cheer', { e: '👏' }); } catch (e) { refused = true; }
  check(refused, 'audience: only the six shouts');
  applyRoomAction(r, 'b', 'buzz', {});
  applyRoomAction(r, 'a', 'correct', { id: 'b' });
  clock += 91000;
  refused = false;
  try { applyRoomAction(r, 'a', 'predict', { target: 'b' }); } catch (e) { refused = true; }
  check(refused, 'audience: the guessing closes after a minute and a half');
  applyRoomAction(r, 'a', 'backToHub', {});
  const line = (r.chat || []).find((m) => m.sys === 'predicted');
  check(line && line.p.names === 'C' && line.p.n === 2 && !r.predict, 'audience: back at the hub the chat says who called the winner');
}
// The owner, 26 Sep 2026: the guessing closes once the game is over, not only after 90 seconds.
{
  const r = newRoom(['a', 'b', 'c', 'd']);
  applyRoomAction(r, 'a', 'chooseGame', { game: 'imposter' });
  applyRoomAction(r, 'a', 'start', { category: 'حيوانات', spies: 1 });
  applyRoomAction(r, 'c', 'predict', { target: 'b' });
  check(r.predict && r.predict.picks.c === 'b', 'audience: a guess while the game is played counts');
  applyRoomAction(r, 'a', 'beginDiscussion', {});
  applyRoomAction(r, 'a', 'revealResult', {});
  let refused = false;
  try { applyRoomAction(r, 'd', 'predict', { target: 'c' }); } catch (e) { refused = true; }
  check(r.phase === 'result' && refused && !r.predict.picks.d, 'audience: once the game is over (its result shown) the guessing is closed, well inside its 90 seconds');
}



/* --- إستميشن: the auction, the calls, the tricks, the score keeper's arithmetic, whole games ------ */
{
  const EST = new Function(readFileSync(new URL('../../PlayingCards.js', import.meta.url), 'utf8') + '\n' +
    readFileSync(new URL('../../Estimation.js', import.meta.url), 'utf8') +
    '\nreturn { estBidOk, estBidBeats, estLowestBid, estCallChoices, estLegal, estTrickWinner, estScoreRound, estMult, estLevels, estSpeedTrump, estHandTricks, estBotCard, pcDeck };')();
  // The score keeper, as the page runs it: CS_GAMES.estimation from JS_CardRules.html.
  const rulesHtml = readFileSync(new URL('../../JS_CardRules.html', import.meta.url), 'utf8').replace(/<\/?script>/g, '');
  const CS = new Function('const CS_GAMES = {}; const csSum = (arr) => arr.reduce((a, b) => a + (Number(b) || 0), 0);\n' + rulesHtml + '\nreturn CS_GAMES;')();
  const threw = (fn) => { try { fn(); return false; } catch (e) { return true; } };

  check(EST.estBidBeats({ n: 4, s: 'c' }, null) && !EST.estBidBeats({ n: 3, s: 'n' }, null) && !EST.estBidBeats({ n: 14, s: 's' }, null),
    'estimation: a bid is 4 to 13 tricks');
  check(EST.estBidBeats({ n: 5, s: 's' }, { n: 5, s: 'h' }) && EST.estBidBeats({ n: 5, s: 'n' }, { n: 5, s: 's' }) && EST.estBidBeats({ n: 6, s: 'c' }, { n: 5, s: 'n' }) &&
    !EST.estBidBeats({ n: 5, s: 'd' }, { n: 5, s: 'h' }) && !EST.estBidBeats({ n: 5, s: 'h' }, { n: 5, s: 'h' }),
    'estimation: the same tricks beat with a higher suit - no trumps > ♠ > ♥ > ♦ > ♣ - or more tricks beat any');
  check(JSON.stringify(EST.estLowestBid('d', { n: 6, s: 'h' })) === '{"n":7,"s":"d"}' && EST.estLowestBid('c', { n: 13, s: 'n' }) === null,
    'estimation: the lowest bid in a suit that beats the table');
  check(EST.estCallChoices(5, 0, false).join() === '0,1,2,3,4,5' && EST.estCallChoices(6, 9, true).indexOf(4) === -1 && EST.estCallChoices(6, 9, true).length === 6,
    'estimation: nobody calls more than the caller, and the last may not make the total 13');
  check(EST.estLevels(13) === 0 && EST.estLevels(12) === 0 && EST.estLevels(15) === 1 && EST.estLevels(10) === 1 && EST.estLevels(9) === 2,
    'estimation: the risk levels: 2-3 off 13 one, 4-5 two');
  check(EST.estLegal(['7h', '2s', 'Kh'], [{ k: 0, c: '9h' }]).join() === '7h,Kh' && EST.estLegal(['7d', '2s'], [{ k: 0, c: '9h' }]).length === 2,
    'estimation: follow the suit led if you can, anything if you can\'t');
  const tw = (cards, trump) => EST.estTrickWinner(cards.map((c, k) => ({ k, c })), trump);
  check(tw(['9h', 'Kh', '2h', 'Ah'], 's') === 3 && tw(['9h', 'Kh', '2s', 'Ah'], 's') === 2 && tw(['9h', 'As', 'Kh', '3c'], 'd') === 2 &&
    tw(['9h', 'As', 'Kh', '3c'], 'n') === 2 && tw(['2c', '3s', '4s', 'Ac'], 's') === 2,
    'estimation: the highest trump takes the trick, else the highest of the suit led (another suit never)');
  check(['s', 'h', 'd', 'c', 'n'].every((x, i) => EST.estSpeedTrump(14 + i) === x), 'estimation: the speed rounds\' trumps: 14 ♠, 15 ♥, 16 ♦, 17 ♣, 18 no trumps');

  // The score keeper's arithmetic, round for round.
  {
    const est = CS.estimation;
    let same = 0, n = 0;
    const R = (k) => Math.floor(Math.random() * k);
    for (let t = 0; t < 4000; t++) {
      const tricks = [0, 0, 0, 0];
      for (let x = 0; x < 13; x++) tricks[R(4)]++;
      const dash = [false, false, false, false];
      const ndash = R(3);
      for (let d = 0; d < ndash; d++) dash[R(4)] = true;
      let calls;
      do {
        calls = [0, 1, 2, 3].map((k) => (dash[k] ? 0 : Math.random() < 0.5 ? tricks[k] : R(9)));
      } while (calls.reduce((a, b) => a + b, 0) === 13);
      const speedRound = Math.random() < 0.3;
      const caller = speedRound ? null : [0, 1, 2, 3].filter((k) => !dash[k])[0];
      const risk = Math.random() < 0.2 ? '' : R(4);
      const base = Math.random() < 0.5 ? 10 : 13;
      const way = Math.random() < 0.5 ? 'jawaker' : 'egypt';
      const history = Array.from({ length: R(3) }, () => ({ allMissed: Math.random() < 0.5 }));
      // The keeper reads its multiplier from its own list of rounds; the room from its history.
      const sk = { opts: { base, dash: way, rounds: 18 }, seats: [{}, {}, {}, {}], rounds: history.slice() };
      const keeper = est.score({ calls, tricks, dash, caller: caller === null ? null : String(caller), risk: risk === '' ? '' : String(risk) }, sk);
      const ours = EST.estScoreRound({ calls, tricks, dash, caller, risk: risk === '' ? null : risk }, { base, dash: way }, EST.estMult(history));
      n++;
      if (JSON.stringify(keeper.points) === JSON.stringify(ours.points) && !!keeper.allMissed === ours.allMissed) same++;
    }
    check(same === n, `estimation: the room scores 4000 random rounds exactly as the score keeper does (${same}/${n})`);
  }
  check(EST.estMult([{ allMissed: false }, { allMissed: true }]) === 2 && EST.estMult([{ allMissed: true }, { allMissed: true }]) === 4 && EST.estMult([{ allMissed: true }, { allMissed: false }]) === 1,
    'estimation: صعايدة: the next round ×2, ×4 after two');

  /* The room. */
  const estStart = (ids, opts, bots) => {
    const r = newRoom(ids);
    applyRoomAction(r, ids[0], 'chooseGame', { game: 'estimation' });
    (bots || []).forEach((lv) => applyRoomAction(r, ids[0], 'addBot', { level: lv, name: 'زيزو' }));
    applyRoomAction(r, ids[0], 'start', Object.assign({ botNames: ['بندق', 'سمسم', 'فلفل'] }, opts || {}));
    return r;
  };
  const E = (r, k, action, payload = {}) => applyRoomAction(r, r.shared.seats[k], action, Object.assign({ seq: r.shared.turnSeq, deal: r.shared.deal }, payload));
  const up = (r) => r.shared.turn && r.shared.turn.k;
  const noDash = (r) => [0, 1, 2, 3].forEach((k) => { if (r.shared.phase === 'dash' && r.shared.dash[k] === null) E(r, k, 'dash', { yes: false }); });
  const callFor = (r, k) => {
    const s = r.shared;
    const last = s.callOrder[s.callOrder.length - 1] === k;
    return EST.estCallChoices(s.callMax, s.calls.filter((c, i) => i !== k && c !== null).reduce((a, b) => a + b, 0), last)[0];
  };
  {
    const r = estStart(['a', 'b', 'c', 'd']);
    const s = r.shared;
    check(s.phase === 'dash' && s.seats.length === 4 && s.counts.every((x) => x === 13) && r.players.every((p) => !p.bot) &&
      Object.keys(r.secrets).length === 4 && s.seats.every((id, k) => r.secrets[id].hand.length === 13 && r.secrets[id].seat === k),
      'estimation: four people, 13 each on their own phone, the dash asked first');
    check(!/"(?:A|[2-9]|10|J|Q|K)[shdc]"/.test(JSON.stringify(s)), 'estimation: no card face in what the table sees');
    check(s.settings.rounds === 18 && s.settings.base === 10 && s.settings.dash === 'jawaker' && s.settings.turnClock === 0, 'estimation: the defaults: 18 rounds, 10, Jawaker\'s dash, no clock');
    const k1 = (s.dealer + 1) % 4, k2 = (s.dealer + 2) % 4, k3 = (s.dealer + 3) % 4, k0 = s.dealer;
    E(r, k1, 'dash', { yes: true });
    E(r, k2, 'dash', { yes: true });
    check(threw(() => E(r, k3, 'dash', { yes: true })), 'estimation: two dash calls at most');
    const deal = s.deal;
    E(r, k3, 'dash', { yes: false });
    E(r, k0, 'dash', { yes: false, deal: deal - 1 });
    check(s.dash[k0] === null, 'estimation: a dash answer for an older deal is dropped');
    E(r, k0, 'dash', { yes: false });
    check(s.phase === 'bid' && up(r) === k3 && s.calls[k1] === 0 && s.calls[k2] === 0, 'estimation: the dashers\' calls are 0 and they don\'t bid: the auction starts at the first other seat left of the dealer');
    check(threw(() => E(r, k3, 'bid', { n: 3, s: 's' })), 'estimation: a bid under 4 is refused');
    check(threw(() => E(r, k0, 'bid', { n: 5, s: 's' })), 'estimation: only the player up bids');
    E(r, k3, 'bid', { n: 5, s: 'h' });
    check(up(r) === k0 && threw(() => E(r, k0, 'bid', { n: 5, s: 'd' })), 'estimation: a bid must beat the last (5♦ under 5♥)');
    const seq = r.shared.turnSeq;
    E(r, k0, 'bid', { n: 5, s: 's' });
    E(r, k0, 'bid', { n: 7, s: 'n', seq });
    check(s.high.k === k0 && s.high.n === 5 && s.high.s === 's' && up(r) === k3, 'estimation: 5♠ beats 5♥; the second tap of a double tap is dropped');
    E(r, k3, 'pass');
    check(s.phase === 'call' && s.caller === k0 && s.trump === 's' && s.calls[k0] === 5 && s.callOrder.join() === [k3].join() && s.risk === k3,
      'estimation: everyone else passed after a bid: the caller\'s bid is their call and trumps; the other callers in turn after the caller');
    check(threw(() => E(r, k3, 'call', { n: 6 })), 'estimation: nobody calls more than the caller');
    E(r, k3, 'call', { n: 5 });
    check(s.phase === 'play' && up(r) === k0 && s.events.some((e) => e.type === 'call' && e.with === true), 'estimation: a call equal to the caller\'s is مع; the caller leads the first trick');
    // Following suit.
    const hand = (k) => r._est.hands[k];
    const lead = hand(k0)[0];
    E(r, k0, 'play', { card: lead });
    const nx = (k0 + 1) % 4;
    const off = hand(nx).find((c) => c.slice(-1) !== lead.slice(-1));
    const on = hand(nx).some((c) => c.slice(-1) === lead.slice(-1));
    check(!on || threw(() => E(r, nx, 'play', { card: off })), 'estimation: a card of another suit is refused while you hold the suit led');
    check(threw(() => E(r, nx, 'play', { card: hand((nx + 1) % 4)[0] })), 'estimation: a card you don\'t hold is refused');
  }
  {
    // The last caller can't make 13.
    const r = estStart(['a', 'b', 'c', 'd']);
    const s = r.shared;
    noDash(r);
    E(r, up(r), 'bid', { n: 6, s: 'd' });
    while (s.phase === 'bid') E(r, up(r), 'pass');
    const [c1, c2, c3] = s.callOrder;
    E(r, c1, 'call', { n: 4 });
    E(r, c2, 'call', { n: 2 });
    check(up(r) === c3 && threw(() => E(r, c3, 'call', { n: 1 })) && !threw(() => E(r, c3, 'call', { n: 0 })),
      'estimation: the risk (the last to call) can\'t bring the total to 13 (6 + 4 + 2 + 1)');
  }
  {
    // Everyone passes: the same dealer deals again.
    const r = estStart(['a', 'b', 'c', 'd']);
    const s = r.shared;
    noDash(r);
    const dealer = s.dealer, deal = s.deal, round = s.round;
    for (let i = 0; i < 4; i++) E(r, up(r), 'pass');
    check(s.phase === 'dash' && s.deal === deal + 1 && s.dealer === dealer && s.round === round && s.events.some((e) => e.type === 'deal' && e.again),
      'estimation: all four pass: the cards are dealt again by the same dealer');
  }
  // A whole round by hand.
  const playRound = (r) => {
    const s = r.shared;
    for (let guard = 0; guard < 200 && (s.phase === 'play' || s.phase === 'call' || s.phase === 'bid' || s.phase === 'dash'); guard++) {
      if (s.phase === 'dash') { noDash(r); continue; }
      const k = up(r);
      if (s.phase === 'bid') { if (!s.high) E(r, k, 'bid', { n: 4, s: 'c' }); else E(r, k, 'pass'); continue; }
      if (s.phase === 'call') { E(r, k, 'call', { n: callFor(r, k) }); continue; }
      E(r, k, 'play', { card: EST.estLegal(r._est.hands[k], s.trick)[0] });
    }
  };
  {
    const r = estStart(['a', 'b', 'c', 'd'], { rounds: 13, base: 13, dash: 'egypt' });
    const s = r.shared;
    const dealer = s.dealer;
    playRound(r);
    const h = s.history[0];
    check(s.phase === 'roundOver' && s.took.reduce((a, b) => a + b, 0) === 13 && r._est.gone.length === 52 && h && h.calls.join() === s.calls.join(),
      'estimation: a round is 13 tricks and every card played');
    const keeper = CS.estimation.score({ calls: h.calls, tricks: h.took, dash: h.dash, caller: String(h.caller), risk: String(h.risk) }, { opts: { base: 13, dash: 'egypt' }, seats: [{}, {}, {}, {}], rounds: [] });
    check(JSON.stringify(keeper.points) === JSON.stringify(h.points) && s.totals.join() === h.points.join(), 'estimation: the round is scored as the score keeper would, and banked');
    check(threw(() => applyRoomAction(r, s.seats.find((id) => id !== 'a'), 'nextRound', { round: 1 })), 'estimation: only the host deals the next round');
    applyRoomAction(r, 'a', 'nextRound', { round: 1 });
    applyRoomAction(r, 'a', 'nextRound', { round: 1 });
    check(s.round === 2 && s.dealer === (dealer + 1) % 4 && s.phase === 'dash', 'estimation: the next round: the dealer moves on one; a second tap is dropped');
    for (let k = 2; k <= 13; k++) { playRound(r); if (s.phase === 'roundOver') applyRoomAction(r, 'a', 'nextRound', { round: s.round }); }
    check(s.phase === 'gameover' && r.phase === 'gameover' && s.history.length === 13 && s.winners.length >= 1 &&
      s.winners.every((id) => s.totals[s.seats.indexOf(id)] === Math.max(...s.totals)) && s.board[0].score === Math.max(...s.totals),
      'estimation: a game of 13 rounds ends: the highest total wins, the board best first');
    applyRoomAction(r, 'a', 'playAgain', {});
    check(s !== r.shared && r.shared.phase === 'dash' && r.shared.round === 1 && r.shared.settings.rounds === 13 && Object.values(r.shared.wins).reduce((a, b) => a + b, 0) >= 1,
      'estimation: play again keeps the settings and counts the wins');
  }
  {
    // A speed round: no auction, fixed trumps, calls from the left of the dealer, the first to call leads.
    const r = estStart(['a', 'b', 'c', 'd']);
    const s = r.shared;
    for (let k = 1; k <= 13; k++) { playRound(r); applyRoomAction(r, 'a', 'nextRound', { round: s.round }); }
    check(s.round === 14 && s.speed && s.trump === 's', 'estimation: round 14 is a speed round, spades trumps');
    const d = s.dealer;
    noDash(r);
    check(s.phase === 'call' && s.caller === null && s.callMax === 13 && up(r) === (d + 1) % 4 && s.risk === d, 'estimation: a speed round: no auction, everyone calls from the left of the dealer, 0 to 13');
    const first = up(r);
    while (s.phase === 'call') E(r, up(r), 'call', { n: callFor(r, up(r)) });
    check(s.phase === 'play' && up(r) === first, 'estimation: the first to call leads');
    playRound(r);
    check(s.history[13].caller === null && s.history[13].trump === 's', 'estimation: a speed round has no caller to be مع');
    applyRoomAction(r, 'a', 'nextRound', { round: s.round });
    check(s.trump === 'h', 'estimation: 15 hearts');
  }
  {
    // The clock, the host's "play for", leaving.
    const r = estStart(['a', 'b', 'c', 'd'], { turnClock: 30 });
    const s = r.shared;
    check(roomDeadline(r) === s.endsAt + 1500, 'estimation: the clock is a server deadline');
    clock = s.endsAt + 1600;
    roomTimeout(r, clock);
    check(s.phase === 'bid' && s.dash.every((x) => x === false), 'estimation: the clock answers the dash for whoever didn\'t: no dash');
    const k = up(r);
    clock = s.endsAt + 1600;
    roomTimeout(r, clock);
    check(s.passed[k] && s.events.some((e) => e.type === 'auto' && e.k === k), 'estimation: the clock passes in the auction');
    check(threw(() => applyRoomAction(r, s.seats.find((id) => id !== 'a'), 'skipTurn', { seq: s.turnSeq })), 'estimation: only the host plays for someone');
    const k2 = up(r);
    applyRoomAction(r, 'a', 'skipTurn', { seq: s.turnSeq });
    check(s.passed[k2] || s.phase !== 'bid', 'estimation: the host\'s "play for" passes too');
    const leaver = s.seats.find((id) => id !== 'a');
    const at = s.seats.indexOf(leaver);
    const handWas = r._est.hands[at].join();
    leave(r, leaver);
    const bot = r.players.find((p) => p.id === s.seats[at]);
    check(bot && bot.bot === 'hard' && /^🤖/.test(bot.name) && r._est.hands[at].join() === handWas && r.secrets[bot.id] && s.events.some((e) => e.type === 'took' && e.k === at),
      'estimation: a player who leaves: a hard computer player takes the seat, hand and all');
  }
  {
    // A person with one card they may play has it played for them after a beat.
    const r = estStart(['a', 'b', 'c', 'd']);
    const s = r.shared;
    noDash(r);
    E(r, up(r), 'bid', { n: 4, s: 's' });
    while (s.phase === 'bid') E(r, up(r), 'pass');
    while (s.phase === 'call') E(r, up(r), 'call', { n: callFor(r, up(r)) });
    const k = up(r);
    const nx = (k + 1) % 4;
    const others = [0, 1, 2, 3].filter((x) => x !== k && x !== nx);
    const all = EST.pcDeck(1).filter((c) => c !== '2c');
    const clubs = all.filter((c) => c.endsWith('c'));
    const rest = all.filter((c) => !c.endsWith('c'));
    r._est.hands[k] = ['2c'].concat(rest.slice(0, 12));
    r._est.hands[nx] = [clubs[0]].concat(rest.slice(12, 24));
    r._est.hands[others[0]] = clubs.slice(1, 7).concat(rest.slice(24, 31));
    r._est.hands[others[1]] = clubs.slice(7).concat(rest.slice(31));
    E(r, k, 'play', { card: '2c' });
    const f = roomForcedMove(r);
    check(f && f.pid === s.seats[nx] && f.move.payload.card === clubs[0], 'estimation: one card you may play is played for you');
    check(r._botPid === s.seats[nx], 'estimation: …on the server\'s clock, after a beat');
  }
  {
    // Computer players: one person and three, whole games on the clock.
    const errors = [];
    const errorWas = console.error;
    console.error = (...args) => { errors.push(args.join(' ')); };
    let ended = 0, conserved = true, legal = true, scored = true, bids = 0, dashes = 0;
    const runBots = (r) => { if (typeof r._botAt === 'number') { clock = Math.max(clock, r._botAt) + 1; roomTimeout(r, clock); return true; } return false; };
    for (let n = 0; n < 24; n++) {
      const levels = n % 3 === 0 ? ['hard', 'hard', 'hard'] : n % 3 === 1 ? ['easy', 'easy', 'easy'] : ['hard', 'easy'];
      const r = estStart(['a'], { turnClock: 30, rounds: n % 2 ? 13 : 18, dash: n % 4 < 2 ? 'jawaker' : 'egypt' }, levels);
      const s = () => r.shared;
      let seen = s().eventSeq;
      for (let step = 0; step < 20000 && s().phase !== 'gameover'; step++) {
        if (s().phase === 'roundOver') { applyRoomAction(r, 'a', 'nextRound', { round: s().round }); continue; }
        if (!runBots(r)) {
          const due = roomDeadline(r);
          if (due === null) break;
          clock = due + 1;
          roomTimeout(r, clock);
        }
        const held = r._est.hands.reduce((a, h) => a + h.length, 0) + r._est.gone.length;
        if (held !== 52) conserved = false;
        (s().events || []).filter((e) => e.seq > seen).forEach((e) => { if (e.type === 'bid') bids++; if (e.type === 'dash' && e.yes) dashes++; });
        seen = s().eventSeq;
      }
      const g = s();
      if (g.phase === 'gameover') ended++;
      if (g.history.some((h) => h.took.reduce((a, b) => a + b, 0) !== 13 || h.calls.reduce((a, b) => a + b, 0) === 13)) legal = false;
      const sums = [0, 1, 2, 3].map((k) => g.history.reduce((a, h) => a + h.points[k], 0));
      if (sums.join() !== g.totals.join()) scored = false;
    }
    console.error = errorWas;
    check(ended === 24, `estimation bots: 24 whole games of one person on the clock and three computer players (easy, hard, mixed; 13 and 18 rounds) all end (${ended})`);
    check(!errors.length, 'estimation bots: no computer player\'s move was ever refused' + (errors.length ? ': ' + errors[0] : ''));
    check(conserved, 'estimation: no card is lost or made up: every hand and every card played add up to 52, after every move');
    check(legal, 'estimation: every round is 13 tricks, and no round\'s calls add up to 13');
    check(scored, 'estimation: the totals are the rounds\' points added up');
    check(bids > 100 && dashes > 0, `estimation bots: the computer players bid (${bids}) and dash now and then (${dashes})`);
  }
  {
    // A hard bot makes its call more often than an easy one. The deals and the bots use
    // Math.random, so the games run on a fixed seed (six unseeded games each flipped the
    // result about one run in three), and twenty games a level make the difference real.
    const realRandom = Math.random;
    const lcg = (seed) => () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
    const rate = (level) => {
      let made = 0, all = 0;
      Math.random = lcg(level === 'hard' ? 101 : 202);
      for (let n = 0; n < 20; n++) {
        const r = estStart(['a'], { turnClock: 30, rounds: 13 }, [level, level, level]);
        for (let step = 0; step < 20000 && r.shared.phase !== 'gameover'; step++) {
          if (r.shared.phase === 'roundOver') { applyRoomAction(r, 'a', 'nextRound', { round: r.shared.round }); continue; }
          if (typeof r._botAt === 'number') { clock = Math.max(clock, r._botAt) + 1; roomTimeout(r, clock); continue; }
          const due = roomDeadline(r);
          if (due === null) break;
          clock = due + 1;
          roomTimeout(r, clock);
        }
        r.shared.history.forEach((h) => h.calls.forEach((c, k) => { if (r.shared.seats[k] !== 'a') { all++; if (c === h.took[k]) made++; } }));
      }
      Math.random = realRandom;
      return made / Math.max(1, all);
    };
    const hard = rate('hard'), easy = rate('easy');
    check(hard > easy, `estimation bots: a hard computer player makes its call more often than an easy one (${Math.round(hard * 100)}% against ${Math.round(easy * 100)}%)`);
  }
}
/* --- «أنت: منى ✏️»: a name changed from the lobby (26 Sep 2026) ------------------- */
{
  const r = newRoom(['a', 'b']);
  const threw = (fn) => { try { fn(); return false; } catch (e) { return true; } };
  applyRoomAction(r, 'a', 'rename', { name: ' منى ' });
  check(r.players[0].name === 'منى', 'rename: the lobby takes a new name, trimmed');
  check(threw(() => applyRoomAction(r, 'b', 'rename', { name: 'مني' })), 'rename: a name someone else has (folded) is refused');
  check(threw(() => applyRoomAction(r, 'b', 'rename', { name: '  ' })), 'rename: an empty name is refused');
  applyRoomAction(r, 'a', 'rename', { name: 'منى' });
  check(r.players[0].name === 'منى', 'rename: your own name again is fine');
  applyRoomAction(r, 'a', 'chooseGame', { game: 'wouldyou' });
  applyRoomAction(r, 'a', 'start', { lang: 'ar' });
  check(r.phase !== 'lobby' && threw(() => applyRoomAction(r, 'a', 'rename', { name: 'X' })), 'rename: not while a game is being played');
}

Date.now = realNow;
console.log(failed ? `\n${failed} failed` : '\nall room rules pass');
process.exit(failed ? 1 : 0);
