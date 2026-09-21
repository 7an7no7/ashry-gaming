/**
 * Checks the trivia and Codenames rules straight against the bundled RoomGames.js, where the
 * right answer can be read: the chosen number of questions, and the points
 * going to the fastest right answers.
 *
 *   npm run test:rules      (builds generated/rules.js first)
 */
import { applyRoomAction, roomDeadline, roomTimeout, normaliseClue, guessVerdict, bankNightPoints, stopAnswerFits, stopWordKnown, roomPlayerLeft } from '../generated/rules.js';

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
  // Nothing anywhere in shared is a number somebody is still holding.
  check(!dealt.some((n) => JSON.stringify(m.shared).indexOf(':' + n) !== -1 ||
                           JSON.stringify(m.shared).indexOf('[' + n) !== -1),
        'mind: no unplayed number appears anywhere in shared');

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
  const hand = (r, id) => ((r.secrets[id] || {}).hand || []).slice();
  const up = (r) => r.shared.turnId;

  const tl = tlStart(['a', 'b', 'c']);
  check(tl.shared.phase === 'play' && tl.shared.timeline.length === 1, 'timeline: one card starts the line');
  check(tl.shared.order.length === 3 && ['a', 'b', 'c'].every((id) => hand(tl, id).length === tl.shared.handSize),
        'timeline: the same number of cards each');
  check(['a', 'b', 'c'].every((id) => (tl.secrets[id].cards || []).every((c) => c.y === undefined)),
        'timeline: a phone is given its own cards with the years taken off');
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
    win.secrets[who] = { hand: [hand(win, who)[0]] };
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

Date.now = realNow;
console.log(failed ? `\n${failed} failed` : '\nall room rules pass');
process.exit(failed ? 1 : 0);
