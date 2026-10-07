// Bundled into the rooms server after RoomGames.js (FILES in rooms-worker/build.mjs), whose helpers it uses.
/* ==========================================================================
   فيبج — FIBBAGE
   Everyone invents a fake answer, then the room votes on the pile with the
   real answer hidden among them. Points for spotting the truth, and for every
   person your lie caught.
   ========================================================================== */
const FIBBAGE_TRUTH_POINTS = 1000;
const FIBBAGE_FOOL_POINTS = 500;
// «متأكد ✌️» (the owner, 7 Oct 2026): a voter sure of their pick gets 2000 for the truth and pays 500 for a lie.
const FIBBAGE_SURE_TRUTH_POINTS = 2000;
const FIBBAGE_SURE_LIE_COST = 500;

/** Eastern Arabic and Persian digits as 0-9, so ١٦٨ meets 168. */
const fibbageDigits = (text) => String(text || '').split('').map((ch) => {
  const c = ch.charCodeAt(0);
  if (c >= 0x0660 && c <= 0x0669) return String(c - 0x0660);
  if (c >= 0x06F0 && c <= 0x06F9) return String(c - 0x06F0);
  return ch;
}).join('');

/**
 * Is this "lie" the truth as the table would hear it (idea 589)? The same fold,
 * or what guessVerdict calls right (the same stem, one letter off in a long
 * word, a measure word): راس for راسه. The question's own words are dropped
 * from the lie first, so «168 حرف» for «فيه ___ حرف» is 168. A number is its
 * digits: «31 ألف» stays a fair lie against «30 ألف».
 */
const fibbageLieIsTruth = (lie, truth, question) => {
  const l = fibbageDigits(lie), tr = fibbageDigits(truth);
  if (normaliseClue(l) === normaliseClue(tr)) return true;
  const nums = (x) => (x.match(/[0-9]+/g) || []).join(',');
  const trWords = guessWords(tr);
  const qWords = new Set(guessWords(String(question || '').replace(/_+/g, ' ')));
  const kept = guessWords(l).filter(w => !qWords.has(w) || trWords.indexOf(w) !== -1);
  const core = kept.length ? kept.join(' ') : l;
  if (nums(tr) || nums(core)) {
    if (nums(tr) !== nums(core)) return false;
    // The same number: the truth, unless the words beside it name something else.
    const letters = (x) => guessWords(x.replace(/[0-9]+/g, ' ')).join(' ');
    return !letters(core) || !letters(tr) || guessVerdict(letters(core), [letters(tr)]) === 'right';
  }
  return guessVerdict(core, [tr]) === 'right';
};

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
    room._fibSure = {};
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
    // A "lie" that happens to be the truth would be unfair to vote on: spelled
    // another way, a letter off, or with the question's own unit word (589).
    if (fibbageLieIsTruth(lie, room._truth, s.question)) {
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
    // «متأكد ✌️» may come with the vote itself: the last voter closes the vote with it.
    const v = room.shared.vote;
    if (payload && payload.sure === true && v && v.phase === 'voting' && v.eligible.indexOf(playerId) !== -1 &&
        !staleTap(payload, 'round', room.shared.round)) fibbageMarkSure(room, playerId);
    if (castVote(room, playerId, String(payload.option || ''))) scoreFibbage(room);
    return;
  }

  if (action === 'sure') {
    // After voting, while the vote is still open: the pick counts double (591). One way only.
    if (staleTap(payload, 'round', room.shared.round)) return;
    const v = room.shared.vote;
    if (!v || v.phase !== 'voting') return;
    if (v.voted.indexOf(playerId) === -1) throw new Error('صوّت الأول');
    fibbageMarkSure(room, playerId);
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

/** A voter is sure: kept on the server (room._fibSure), and told to their own phone only. */
const fibbageMarkSure = (room, playerId) => {
  room._fibSure = room._fibSure || {};
  room._fibSure[playerId] = true;
  room.secrets = room.secrets || {};
  room.secrets[playerId] = Object.assign({}, room.secrets[playerId] || {}, { fibSure: room.shared.round });
};

const scoreFibbage = (room) => {
  const v = room.shared.vote;
  // A vote opened before the ids were random still calls the truth 'truth'.
  const truthId = room._fibTruthId || 'truth';
  const sure = room._fibSure || {};
  const ballots = room._ballots || {};
  v.results.forEach(r => {
    if (r.id === truthId) {
      // Everyone who found the real answer scores, 2000 for the sure ones.
      Object.keys(ballots).forEach(pid => {
        if (ballots[pid] === truthId) addScore(room, pid, sure[pid] ? FIBBAGE_SURE_TRUTH_POINTS : FIBBAGE_TRUTH_POINTS);
      });
    } else if (r.ownerId && r.count > 0) {
      addScore(room, r.ownerId, FIBBAGE_FOOL_POINTS * r.count);
    }
  });
  // A sure voter who picked a lie pays for it.
  Object.keys(ballots).forEach(pid => {
    if (sure[pid] && ballots[pid] !== truthId) addScore(room, pid, -FIBBAGE_SURE_LIE_COST);
  });
  // Who was sure, public now the vote is in (the ×2 chips on the reveal).
  room.shared.sure = Object.keys(sure).filter(pid => ballots[pid]);
  room.shared.truth = room._truth;
  room.shared.truthId = truthId;
  room.shared.board = scoreboardOf(room);
  room.shared.phase = 'results';
};
