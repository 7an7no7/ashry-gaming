// Bundled into the rooms server after RoomGames.js (FILES in rooms-worker/build.mjs), whose helpers it uses.
/* ==========================================================================
   مين أكثر واحد — MOST LIKELY TO
   The options are the players, so the ballot is built from the room itself.
   ========================================================================== */
const mostLikelyAction = (room, playerId, action, payload) => {
  if (action === 'start' || action === 'nextRound') {
    requireHost(room, playerId, action === 'nextRound');
    // From the results only: a double tap must not skip a question unseen.
    if (action === 'nextRound' && (room.shared || {}).phase !== 'results') return;
    if (room.players.length < 3) throw new Error('تحتاج 3 لاعبين على الأقل');

    const lang = payload.lang === 'en' ? 'en' : 'ar';
    const prompt = nextPrompt(room, MOST_LIKELY_TO[lang], 'mlt_' + lang);
    const round = ((room.shared && room.shared.round) || 0) + 1;
    const scores = (room.shared && room.shared.scores) || {};

    room.secrets = {};
    room.shared = { round: round, lang: lang, prompt: prompt, scores: scores };
    openVote(room, room.players.map(p => ({ id: p.id, label: p.name })));
    room.phase = 'voting';
    return;
  }

  if (action === 'vote') {
    // The options are the players, the same every round: a tap from the last
    // round's ballot must not count in this one.
    if (staleTap(payload, 'round', (room.shared || {}).round)) return;
    if (castVote(room, playerId, String(payload.option || ''))) scoreMostLikely(room);
    return;
  }

  if (action === 'closeVote') {
    requireMoveOn(room, playerId);
    if (closeVote(room)) scoreMostLikely(room);
    return;
  }

  throw new Error('إجراء غير معروف');
};

/** In a room of four or more, a top of one vote is no pick at all (idea 633): «الأصوات اتفرّقت». */
const MOST_LIKELY_SCATTER_MIN = 4;

/** Whoever the room picked takes the point; a tie shares it - unless the votes scattered. */
const scoreMostLikely = (room) => {
  const v = room.shared.vote;
  const results = v.results || [];
  const top = Math.max(0, ...results.map(r => r.count));
  // Everyone tied on one vote used to give everyone a point.
  room.shared.scattered = top === 1 && (v.options || []).length >= MOST_LIKELY_SCATTER_MIN;
  if (top > 0 && !room.shared.scattered) results.filter(r => r.count === top).forEach(r => addScore(room, r.id, 1));
  room.shared.board = scoreboardOf(room);
  room.shared.phase = 'results';
};
