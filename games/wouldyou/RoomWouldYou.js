// Bundled into the rooms server after RoomGames.js (FILES in rooms-worker/build.mjs), whose helpers it uses.
/* ==========================================================================
   لو خيروك — WOULD YOU RATHER
   No scoring; the point is the argument afterwards.
   ========================================================================== */
const wouldYouRatherAction = (room, playerId, action, payload) => {
  if (action === 'start' || action === 'nextRound') {
    requireHost(room, playerId, action === 'nextRound');
    // From the results only: a double tap must not skip a question unseen.
    const vote = room.shared && room.shared.vote;
    if (action === 'nextRound' && !(vote && vote.phase === 'results')) return;
    if (room.players.length < 2) throw new Error('تحتاج لاعبين على الأقل');

    const lang = payload.lang === 'en' ? 'en' : 'ar';
    const pair = nextPrompt(room, WOULD_YOU_RATHER[lang], 'wyr_' + lang);
    const round = ((room.shared && room.shared.round) || 0) + 1;

    room.secrets = {};
    room.shared = { round: round, lang: lang };
    openVote(room, [
      { id: 'a', label: pair[0] },
      { id: 'b', label: pair[1] }
    ]);
    room.phase = 'voting';
    return;
  }

  if (action === 'vote') {
    // The option ids are 'a' and 'b' every round: a tap from the last round's
    // ballot must not count in this one.
    if (staleTap(payload, 'round', (room.shared || {}).round)) return;
    castVote(room, playerId, String(payload.option || ''));
    return;
  }
  if (action === 'closeVote') { requireMoveOn(room, playerId); closeVote(room); return; }

  throw new Error('إجراء غير معروف');
};
