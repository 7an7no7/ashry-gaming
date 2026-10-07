// Bundled into the rooms server after RoomGames.js (FILES in rooms-worker/build.mjs), whose helpers it uses.
/* ==========================================================================
   صدق ولا كذب — TWO TRUTHS AND A LIE
   Everyone writes two true things and one lie about themselves. One player
   at a time, the others vote for the lie: a point for spotting it, and a
   point to the storyteller for every voter fooled. No content bank at all.
   ========================================================================== */
const TT_CATCH_POINTS = 1;
const TT_FOOL_POINTS = 1;
const TT_MAX_LEN = 80;

const twoTruthsAction = (room, playerId, action, payload) => {
  if (action === 'start' || action === 'playAgain') {
    requireHost(room, playerId);
    if (room.players.length < 3) throw new Error('تحتاج 3 لاعبين على الأقل');
    if (action === 'playAgain' && room.shared.phase !== 'gameover') return;
    room._tt = {};
    room._ttFooled = {};
    room.secrets = {};
    room.shared = {
      phase: 'writing',
      submitted: [],
      roster: room.players.map(p => p.id),
      scores: (room.shared && room.shared.scores) || {},
      order: [],
      turn: -1
    };
    room.shared.board = scoreboardOf(room);
    room.phase = 'writing';
    return;
  }

  const s = room.shared;

  if (action === 'submit') {
    // A sheet that comes in after the host started the turns still counts (596): its
    // writer goes to the end of the order, so nobody who wrote is dropped.
    const late = s.phase === 'voting' || s.phase === 'result';
    if (s.phase !== 'writing' && !late) throw new Error('انتهى وقت الكتابة');
    if (s.roster.indexOf(playerId) === -1) throw new Error('ستدخل من الجولة القادمة');
    if (late && (s.submitted.indexOf(playerId) !== -1 || s.order.indexOf(playerId) !== -1)) throw new Error('انتهى وقت الكتابة');
    const list = (Array.isArray(payload && payload.statements) ? payload.statements : [])
      .map(x => String(x || '').trim().slice(0, TT_MAX_LEN));
    const lie = Number(payload && payload.lie);
    if (list.length !== 3 || list.some(x => !x)) throw new Error('اكتب الجمل الثلاث');
    if (!(lie >= 0 && lie <= 2 && lie === Math.floor(lie))) throw new Error('اختر الكذبة');
    // Shuffled once here, so the lie is never "always the third one".
    const order = shuffled([0, 1, 2]);
    room._tt[playerId] = { items: order.map(i => list[i]), lie: order.indexOf(lie) };
    if (s.submitted.indexOf(playerId) === -1) s.submitted.push(playerId);
    if (late) { s.order.push(playerId); return; }
    if (activeRoster(room, s.roster).every(id => s.submitted.indexOf(id) !== -1)) {
      s.order = shuffled(s.submitted.slice());
      nextTwoTruthsTurn(room);
    }
    return;
  }

  if (action === 'closeWriting') {
    // The host starts with whoever has written; a phone that never sends
    // must not hold the table.
    requireMoveOn(room, playerId);
    if (s.phase !== 'writing') return;
    if (s.submitted.length < 1) throw new Error('محدش كتب لسه');
    s.order = shuffled(s.submitted.slice());
    nextTwoTruthsTurn(room);
    return;
  }

  if (action === 'vote') {
    // Every storyteller's statements are 'i0'..'i2': a tap on the last one's
    // ballot must not count for this one's.
    if (staleTap(payload, 'turn', s.turn)) return;
    if (s.phase !== 'voting') throw new Error('لا يوجد تصويت الآن');
    if (castVote(room, playerId, String((payload && payload.option) || ''))) resolveTwoTruths(room);
    return;
  }

  if (action === 'closeVote') {
    requireMoveOn(room, playerId);
    if (s.phase !== 'voting') return;
    if (closeVote(room)) resolveTwoTruths(room);
    return;
  }

  if (action === 'next') {
    requireMoveOn(room, playerId);
    if (s.phase !== 'result') return;
    if (staleTap(payload, 'turn', s.turn)) return;
    nextTwoTruthsTurn(room);
    return;
  }

  throw new Error('إجراء غير معروف');
};

const nextTwoTruthsTurn = (room) => {
  const s = room.shared;
  s.turn = s.turn < 0 ? 0 : s.turn + 1;
  // A storyteller who has left is skipped: nobody could answer for them.
  while (s.turn < s.order.length && !room.players.some(p => p.id === s.order[s.turn])) s.turn++;
  s.lieIndex = null;
  s.caught = null;
  s.fooled = null;
  if (s.turn >= s.order.length) {
    s.phase = 'gameover';
    s.subjectId = null;
    s.subjectName = '';
    s.items = null;
    s.vote = null;
    s.board = scoreboardOf(room);
    s.bestLiar = topTally(room, room._ttFooled);
    room.phase = 'gameover';
    return;
  }
  const subject = s.order[s.turn];
  const entry = room._tt[subject];
  s.subjectId = subject;
  s.subjectName = roomPlayerName(room, subject);
  s.items = entry.items;
  // Every option belongs to the storyteller, so the voting engine keeps them out of it.
  openVote(room, entry.items.map((text, i) => ({ id: 'i' + i, label: text, ownerId: subject })),
           s.roster.filter(id => id !== subject));
  s.phase = 'voting';
  room.phase = 'voting';
};

const resolveTwoTruths = (room) => {
  const s = room.shared;
  const entry = room._tt[s.subjectId] || { lie: 0 };
  const lieId = 'i' + entry.lie;
  const ballots = room._ballots || {};
  const caught = [], fooled = [];
  Object.keys(ballots).forEach(pid => { (ballots[pid] === lieId ? caught : fooled).push(pid); });
  caught.forEach(pid => addScore(room, pid, TT_CATCH_POINTS));
  if (fooled.length) addScore(room, s.subjectId, TT_FOOL_POINTS * fooled.length);
  s.lieIndex = entry.lie;
  s.caught = caught.map(id => roomPlayerName(room, id));
  s.fooled = fooled.map(id => roomPlayerName(room, id));
  // s.fooled is cleared before the next storyteller, so the tally is kept here.
  room._ttFooled = room._ttFooled || {};
  room._ttFooled[s.subjectId] = (room._ttFooled[s.subjectId] || 0) + fooled.length;
  s.board = scoreboardOf(room);
  s.phase = 'result';
  room.phase = 'result';
};
