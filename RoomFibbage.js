// Bundled into the rooms server after RoomGames.js (FILES in rooms-worker/build.mjs), whose helpers it uses.
/* ==========================================================================
   فيبج — FIBBAGE
   Everyone invents a fake answer, then the room votes on the pile with the
   real answer hidden among them. Points for spotting the truth, and for every
   person your lie caught.
   ========================================================================== */
const FIBBAGE_TRUTH_POINTS = 1000;
const FIBBAGE_FOOL_POINTS = 500;

const fibbageAction = (room, playerId, action, payload) => {
  if (action === 'start' || action === 'nextRound') {
    requireHost(room, playerId, action === 'nextRound');
    // From the results only: a double tap must not skip a question unseen.
    if (action === 'nextRound' && (room.shared || {}).phase !== 'results') return;
    if (room.players.length < 3) throw new Error('تحتاج 3 لاعبين على الأقل');

    const lang = payload.lang === 'en' ? 'en' : 'ar';
    const item = nextPrompt(room, FIBBAGE[lang], 'fib_' + lang);
    const round = ((room.shared && room.shared.round) || 0) + 1;
    const scores = (room.shared && room.shared.scores) || {};

    // The real answer stays server-side until the votes are in.
    room._truth = item.a;
    room._lies = {};
    room._fibTruthId = null;
    room._voteOwners = null;
    room.secrets = {};
    room.shared = {
      round: round, lang: lang,
      question: item.q,
      phase: 'writing',
      submitted: [],
      roster: room.players.map(p => p.id),
      scores: scores
    };
    room.phase = 'writing';
    return;
  }

  if (action === 'submitLie') {
    const s = room.shared;
    if (s.phase !== 'writing') throw new Error('انتهى وقت الكتابة');
    if (s.roster.indexOf(playerId) === -1) throw new Error('ستدخل من الجولة القادمة');

    const lie = String(payload.lie || '').trim().slice(0, 40);
    if (!lie) throw new Error('اكتب إجابة');
    // A "lie" that happens to be the truth would be unfair to vote on.
    if (normaliseClue(lie) === normaliseClue(room._truth)) {
      throw new Error('هذه هي الإجابة الصحيحة! اكتب غيرها');
    }
    // Two people inventing the same lie would split their own vote.
    const clash = Object.keys(room._lies).some(id =>
      id !== playerId && normaliseClue(room._lies[id]) === normaliseClue(lie));
    if (clash) throw new Error('حد كتب نفس الإجابة، جرب غيرها');

    room._lies[playerId] = lie;
    if (s.submitted.indexOf(playerId) === -1) s.submitted.push(playerId);

    if (activeRoster(room, s.roster).every(id => s.submitted.indexOf(id) !== -1)) openFibbageVote(room);
    return;
  }

  if (action === 'closeWriting') {
    // A writer whose phone died must not hold the table: the vote opens on
    // the lies that are in (and on the truth alone, if nobody wrote).
    requireMoveOn(room, playerId);
    if (room.shared.phase !== 'writing') return;
    openFibbageVote(room);
    return;
  }

  if (action === 'vote') {
    if (castVote(room, playerId, String(payload.option || ''))) scoreFibbage(room);
    return;
  }

  if (action === 'closeVote') {
    requireMoveOn(room, playerId);
    if (closeVote(room)) scoreFibbage(room);
    return;
  }

  throw new Error('إجراء غير معروف');
};

/**
 * The pile to vote on. Nothing about an option may say which one is true: the
 * ids are random (they used to be 'truth' and 'l_' + the writer), and whose lie
 * is whose stays on the server (hideOwners) - the one option nobody owned was
 * the truth, in plain sight of any phone that looked.
 */
const openFibbageVote = (room) => {
  const s = room.shared;
  const liars = activeRoster(room, s.roster);
  const taken = {};
  const newId = () => {
    let id;
    do { id = 'o' + Math.random().toString(36).slice(2, 8); } while (taken[id]);
    taken[id] = true;
    return id;
  };
  const options = liars
    .filter(id => room._lies[id])
    .map(id => ({ id: newId(), label: room._lies[id], ownerId: id }));
  room._fibTruthId = newId();
  options.push({ id: room._fibTruthId, label: room._truth });
  openVote(room, shuffled(options), liars, { hideOwners: true });
  s.phase = 'voting';
  room.phase = 'voting';
};

const scoreFibbage = (room) => {
  const v = room.shared.vote;
  // A vote opened before the ids were random still calls the truth 'truth'.
  const truthId = room._fibTruthId || 'truth';
  v.results.forEach(r => {
    if (r.id === truthId) {
      // Everyone who found the real answer scores.
      Object.keys(room._ballots).forEach(pid => {
        if (room._ballots[pid] === truthId) addScore(room, pid, FIBBAGE_TRUTH_POINTS);
      });
    } else if (r.ownerId && r.count > 0) {
      addScore(room, r.ownerId, FIBBAGE_FOOL_POINTS * r.count);
    }
  });
  room.shared.truth = room._truth;
  room.shared.truthId = truthId;
  room.shared.board = scoreboardOf(room);
  room.shared.phase = 'results';
};
