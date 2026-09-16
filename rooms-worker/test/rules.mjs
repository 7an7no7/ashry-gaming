/**
 * Checks the trivia and Codenames rules straight against the bundled RoomGames.js, where the
 * right answer can be read: the chosen number of questions, and the points
 * going to the fastest right answers.
 *
 *   npm run test:rules      (builds generated/rules.js first)
 */
import { applyRoomAction, roomDeadline, roomTimeout, normaliseClue, stopAnswerFits, stopWordKnown, roomPlayerLeft } from '../generated/rules.js';

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

Date.now = realNow;
console.log(failed ? `\n${failed} failed` : '\nall room rules pass');
process.exit(failed ? 1 : 0);
