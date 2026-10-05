/* ============================================================================
   What a few room games' phones and the rooms server both read (5 Oct 2026)
   ----------------------------------------------------------------------------
   Like app/Common.js, one copy for both sides - but these are only some games'
   own, so on the page this file is a chunk of its own ('roomshared' in
   tools/lazy-split.mjs) that loads with the games that read it, and the first
   screen doesn't carry it. On the server it is in FILES after Common.js.
   ========================================================================== */

/* --- Values the lobby offers and the server enforces --- */
const TRIVIA_COUNTS = [5, 10, 15, 20];           // تحدي المعلومات: the questions the host can pick
const CODENAMES_TIMERS = [0, 60, 90, 120, 180];  // أسماء الرموز: the clue clock's choices, in seconds (0: none)
const BZ_SETTLE_MS = 150;                        // الجرس: a press settles this long after it arrived
const DUEL_AWAY_MS = 60000;                      // the duels: the seat to move loses after this long away

/**
 * Who would play if the game started now, in a lobby with seats (لودو, السلم
 * والتعبان, بنك الحظ): the seats the host set, less anyone gone, topped up from
 * the room in order (not the benched), up to `max`; with no seats set, the
 * first `max` in the room.
 */
function lobbySeatedOf(players, lobby, max) {
  const ids = (players || []).map(p => p.id);
  lobby = lobby || {};
  if (Array.isArray(lobby.seated)) {
    const kept = lobby.seated.filter(id => ids.indexOf(id) !== -1);
    // Someone left and a seat is free: the next in the room sits down.
    ids.forEach(id => { if (kept.length < max && kept.indexOf(id) === -1 && (lobby.benched || []).indexOf(id) === -1) kept.push(id); });
    return kept.slice(0, max);
  }
  return ids.slice(0, max);
}
