/* ============================================================================
   أونو — UNO (rooms)
   ----------------------------------------------------------------------------
   Bundled into the Worker after RoomGames.js (FILES in rooms-worker/build.mjs),
   so it uses that file's helpers and registers its computer players in
   ROOM_BOT_GAMES. Not yet built: every action is refused.
   ========================================================================= */
const unoAction = (room, playerId, action, payload) => {
  throw new Error('أونو لسه بيتعمل');
};
const unoDeadline = (room) => null;
const unoTimeout = (room, now) => false;
const unoPlayerLeft = (room, playerId, name) => {};

ROOM_BOT_GAMES.uno = {
  max: 12,
  pending: (room) => null,
  decide: (room, pid) => null,
  fallback: (room, pid) => null
};
