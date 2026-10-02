// Bundled into the rooms server after RoomGames.js (FILES in rooms-worker/build.mjs), whose helpers it uses.
/* ==========================================================================
   زي الكل — HERD MENTALITY
   Everyone answers the same question on their own phone ("one thing from:
   car brands") trying to write what most of the table will write. Answers
   wait in room._herd.answers until everyone has sent (or the host moves on),
   then they are grouped through normaliseClue, so مرسيدس and مرسيدس ‌ are one
   answer; the host can merge two groups that mean the same thing. The single
   biggest group of two or more scores a point each; a tie for biggest scores
   nobody. If exactly one player wrote something nobody else did, they take
   the sheep 🐑, and hold it until someone else is the odd one out: whoever
   holds the sheep can't win. First to the target without the sheep wins.

   The questions are the categories the app already has: the Chameleon
   categories and the bomb's (minus the ones that describe a property).
   ========================================================================== */
const HERD_TARGETS = [5, 8, 10];
const HERD_MAX_LEN = 40;
const HERD_MAX_ROUNDS = 40;

const herdPrompts = (lang) => {
  const cham = (CHAMELEON_DB[lang] || CHAMELEON_DB.ar).map(c => String(c.category).replace(/\p{Extended_Pictographic}[️‍\p{Extended_Pictographic}]*/gu, '').trim());
  const bomb = (BOMB_PROMPTS[lang] || BOMB_PROMPTS.ar).filter(x => !/^حاجات /.test(x) && !/(^Things |things$)/i.test(x));
  const seen = {};
  return cham.concat(bomb).filter(x => {
    const k = normaliseClue(x);
    if (!k || seen[k]) return false;
    seen[k] = true;
    return true;
  });
};

const herdAction = (room, playerId, action, payload) => {
  if (action === 'start' || action === 'playAgain') {
    requireHost(room, playerId);
    if (room.players.length < 3) throw new Error('تحتاج 3 لاعبين على الأقل');
    const prev = room.shared || {};
    if (action === 'playAgain' && prev.phase !== 'gameover') return;
    const target = HERD_TARGETS.indexOf(Number(payload && payload.target)) !== -1 ? Number(payload.target) : (prev.target || 8);
    room.shared = {
      lang: roomLangOf(room, payload),
      target: target,
      round: 0,
      scores: {},
      sheepId: null,
      roster: room.players.map(p => p.id),
      phase: 'writing'
    };
    dealHerdRound(room);
    return;
  }

  const s = room.shared;
  if (!s || !s.phase) throw new Error('اللعبة لم تبدأ بعد');

  if (action === 'nextRound') {
    requireMoveOn(room, playerId);
    if (s.phase !== 'result') return;
    dealHerdRound(room);
    return;
  }

  if (action === 'submit') {
    // An answer to last round's question, arriving after the next was dealt.
    if (staleTap(payload, 'round', s.round)) return;
    if (s.phase !== 'writing') throw new Error('انتهى وقت الكتابة');
    if (s.roster.indexOf(playerId) === -1) throw new Error('ستدخل من الجولة القادمة');
    const text = String((payload && payload.text) || '').replace(/\s+/g, ' ').trim().slice(0, HERD_MAX_LEN);
    if (!text || !normaliseClue(text)) throw new Error('اكتب إجابة');
    room._herd.answers[playerId] = text;
    if (s.submitted.indexOf(playerId) === -1) s.submitted.push(playerId);
    if (activeRoster(room, s.roster).every(id => s.submitted.indexOf(id) !== -1)) revealHerd(room);
    return;
  }

  if (action === 'closeWriting') {
    requireMoveOn(room, playerId);
    if (s.phase !== 'writing') return;
    if (s.submitted.length < 2) throw new Error('لسه محدش كتب كفاية');
    revealHerd(room);
    return;
  }

  if (action === 'merge') {
    // Two answers that mean the same thing ("عربية" and "سيارة"): the host joins them.
    requireHost(room, playerId);
    if (s.phase !== 'reveal') return;
    const from = s.groups.findIndex(g => g.key === String(payload && payload.from));
    const into = s.groups.findIndex(g => g.key === String(payload && payload.into));
    if (from === -1 || into === -1 || from === into) throw new Error('اختيار غير صحيح');
    const a = s.groups[into], b = s.groups[from];
    a.ids = a.ids.concat(b.ids);
    a.names = a.names.concat(b.names);
    a.texts = a.texts.concat(b.texts);
    a.parts = (a.parts || [a.key]).concat(b.parts || [b.key]);
    s.groups.splice(from, 1);
    s.groups.sort((x, y) => y.ids.length - x.ids.length);
    return;
  }

  if (action === 'unmerge') {
    requireHost(room, playerId);
    if (s.phase !== 'reveal') return;
    s.groups = herdGroups(room);
    return;
  }

  if (action === 'score') {
    requireMoveOn(room, playerId);
    if (s.phase !== 'reveal') return;
    scoreHerd(room);
    return;
  }

  throw new Error('إجراء غير معروف');
};

const dealHerdRound = (room) => {
  const s = room.shared;
  s.round = (s.round || 0) + 1;
  s.prompt = nextPrompt(room, herdPrompts(s.lang), 'herd_' + s.lang);
  s.submitted = [];
  s.groups = null;
  s.majorityKey = null;
  s.gained = null;
  s.sheepFrom = null;
  s.winners = null;
  s.roster = room.players.map(p => p.id);
  s.phase = 'writing';
  room._herd = { answers: {} };
  s.board = scoreboardOf(room);
  room.phase = 'writing';
};

/** The answers of everyone still here, grouped: the same word through normaliseClue is one group. */
const herdGroups = (room) => {
  const answers = (room._herd && room._herd.answers) || {};
  const byKey = {};
  Object.keys(answers).filter(pid => room.players.some(p => p.id === pid)).forEach(pid => {
    const key = normaliseClue(answers[pid]);
    if (!byKey[key]) byKey[key] = { key: key, ids: [], names: [], texts: [] };
    byKey[key].ids.push(pid);
    byKey[key].names.push(roomPlayerName(room, pid));
    byKey[key].texts.push(answers[pid]);
  });
  return Object.values(byKey).map(g => Object.assign(g, { label: g.texts[0] })).sort((a, b) => b.ids.length - a.ids.length);
};

const revealHerd = (room) => {
  const s = room.shared;
  s.groups = herdGroups(room);
  s.phase = 'reveal';
  room.phase = 'reveal';
};

/**
 * The groups less anyone who has left since they were drawn (the host's merges
 * kept): an answer from someone gone can't make the herd, or take the sheep.
 */
const herdPresentGroups = (room, groups) => (groups || [])
  .map(g => {
    const keep = g.ids.map((id, i) => i).filter(i => room.players.some(p => p.id === g.ids[i]));
    return Object.assign({}, g, { ids: keep.map(i => g.ids[i]), names: keep.map(i => g.names[i]), texts: keep.map(i => g.texts[i]) });
  })
  .filter(g => g.ids.length)
  .sort((a, b) => b.ids.length - a.ids.length);

const scoreHerd = (room) => {
  const s = room.shared;
  s.groups = herdPresentGroups(room, s.groups);
  const groups = s.groups;
  const top = groups.reduce((m, g) => Math.max(m, g.ids.length), 0);
  const leaders = groups.filter(g => g.ids.length === top);
  const majority = top >= 2 && leaders.length === 1 ? leaders[0] : null;
  s.majorityKey = majority ? majority.key : null;
  s.gained = majority ? majority.ids.slice() : [];
  s.gained.forEach(id => addScore(room, id, 1));
  // Exactly one player on their own takes the sheep from whoever had it.
  const alone = groups.filter(g => g.ids.length === 1);
  s.sheepFrom = null;
  if (alone.length === 1 && alone[0].ids[0] !== s.sheepId) {
    s.sheepFrom = s.sheepId;
    s.sheepId = alone[0].ids[0];
  }
  s.sheepName = s.sheepId ? roomPlayerName(room, s.sheepId) : '';
  s.board = scoreboardOf(room);
  const winners = s.board.filter(p => p.score >= s.target && p.id !== s.sheepId && s.roster.indexOf(p.id) !== -1);
  if (winners.length || s.round >= HERD_MAX_ROUNDS) {
    const best = winners.length ? winners[0].score : 0;
    // Out of rounds with nobody at the target: everyone level at the top (the sheep and the
    // watchers aside), not only the first row.
    const rest = s.board.filter(p => p.id !== s.sheepId && s.roster.indexOf(p.id) !== -1);
    const restTop = rest.length ? rest[0].score : 0;
    s.winners = (winners.length ? winners.filter(p => p.score === best) : rest.filter(p => p.score === restTop)).map(p => p.name);
    s.phase = 'gameover';
    room.phase = 'gameover';
    return;
  }
  s.phase = 'result';
  room.phase = 'result';
};
