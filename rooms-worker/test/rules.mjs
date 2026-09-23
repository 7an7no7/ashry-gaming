/**
 * Checks the trivia and Codenames rules straight against the bundled RoomGames.js, where the
 * right answer can be read: the chosen number of questions, and the points
 * going to the fastest right answers.
 *
 *   npm run test:rules      (builds generated/rules.js first)
 */
import { readFileSync } from 'node:fs';
import { applyRoomAction, roomDeadline, roomTimeout, normaliseClue, guessVerdict, bankNightPoints, stopAnswerFits, stopWordKnown, roomPlayerLeft, roomForcedMove, ROOM_FORCED_DELAY_MS } from '../generated/rules.js';

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
    check(twelve.shared.handSize === 1 && twelve._timeline.deck.length === 22 - 1 - 12, 'timeline: 12 players get one card each and every other card is a spare');
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
    s.settings.autoFlip === true && s.settings.wrong === 'lose' && s.settings.pick === 'random',
    'guesswho: two sit down, one waits, 24 faces, and the defaults are the owner\'s');
  const [p0, p1] = s.seats;
  const watcher = s.line[0];
  check(r.secrets[p0].face === r._gw.secret[0] && r.secrets[p1].face === r._gw.secret[1] && !r.secrets[watcher] &&
    JSON.stringify(s).indexOf('secret') === -1,
    'guesswho: each seated phone holds its own face, the watcher none, and the table neither');
  check(refused(() => applyRoomAction(r, watcher, 'ask', { q: 0, seq: s.turnSeq })), 'guesswho: someone in the line cannot ask');
  check(refused(() => applyRoomAction(r, p1, 'ask', { q: 0, seq: s.turnSeq })), 'guesswho: nor the player whose turn it is not');
  // A question that splits the board, answered truthfully and flipped.
  let q = GW.gwBotQuestion(s.faces, s.down[0], [], 'hard');
  const truth = GW.gwAnswer(q, s.faces[r._gw.secret[1]]);
  const expect = GW.gwRuledOut(s.faces, [], q, truth).length;
  const seq = s.turnSeq;
  applyRoomAction(r, p0, 'ask', { q, seq });
  check(s.q.answer === truth && s.q.out === expect && s.down[0].length === expect && s.down[0].indexOf(r._gw.secret[1]) === -1 &&
    s.turn === 1 && s.stage === 'ask',
    'guesswho: a list question is answered truthfully, what it rules out falls, and the turn passes');
  applyRoomAction(r, p0, 'ask', { q, seq });
  check(s.turn === 1 && s.log.length === 1, 'guesswho: the same tap again, drawn for the last turn, is dropped');
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
  check(s.stage === 'flip' && s.down[1].length === 0 && typeof s.q.answer === 'boolean', 'guesswho: with app flipping off, a list answer waits for the hand');

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
  while (r.shared.phase === 'play' && steps < 200) {
    steps++;
    const sh = r.shared;
    if (sh.turn === botSeat) { clock = (r._botAt || clock) + 10; roomTimeout(r, clock); continue; }
    const hq = GW.gwBotQuestion(sh.faces, sh.down[1 - botSeat], sh.asked[1 - botSeat], 'easy');
    if (hq < 0) applyRoomAction(r, 'h', 'guess', { face: up(r, 1 - botSeat)[0], seq: sh.turnSeq });
    else applyRoomAction(r, 'h', 'ask', { q: hq, seq: sh.turnSeq });
  }
  const botLog = r.shared.log.filter((e) => e.seat === botSeat);
  check(r.shared.phase === 'over' && botLog.every((e) => e.kind === 'list' || e.kind === 'guess'),
    'guesswho: a hard computer player asks from the list and plays the game to the end');

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
  applyRoomAction(r, setter, 'setWord', { word: 'مَدرسة', round: 1 });
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
  check(s.phase === 'result' && s.result.word === 'مدرسة' && s.scores[others[0]] === 10 && s.scores[setter] === 5 && !s.scores[others[1]],
    'hangman: the word ends when all are done; a solve is 10, the writer 5 for each who was hanged');
  applyRoomAction(r, 'a', 'nextRound', { round: 1 });
  check(s.round === 2 && s.phase === 'writing' && s.setter !== setter, 'hangman: the next word has the next writer');
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

Date.now = realNow;
console.log(failed ? `\n${failed} failed` : '\nall room rules pass');
process.exit(failed ? 1 : 0);
