/* ============================================================================
   الدومينو — DOMINO (rooms)
   ----------------------------------------------------------------------------
   Bundled into the Worker after RoomGames.js (FILES in rooms-worker/build.mjs),
   so it uses that file's helpers and registers its computer players in
   ROOM_BOT_GAMES. Not yet built: every action is refused.
   ========================================================================= */
const dominoAction = (room, playerId, action, payload) => {
  throw new Error('الدومينو لسه بيتعمل');
};
const dominoDeadline = (room) => null;
const dominoTimeout = (room, now) => false;
const dominoPlayerLeft = (room, playerId, name) => {};

ROOM_BOT_GAMES.domino = {
  max: 4,
  pending: (room) => null,
  decide: (room, pid) => null,
  fallback: (room, pid) => null
};
