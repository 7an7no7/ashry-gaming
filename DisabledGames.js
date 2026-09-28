/* ============================================================================
   Games switched off for a fix (the owner, 28 Sep 2026: "disable any game while
   it is being upgraded or fixed, so it shows as disabled and can't be played at
   all until we enable it again - later a one-word change").

   To switch a game off, put its id in the list; to switch it back on, take it
   out. Then release as usual (CLAUDE.md: build the site, deploy the rooms
   server and the site). A game in the list shows «🛠️ بنصلّحها» on its card
   everywhere - the home, the recent row, a room's list, the TV - and can't be
   opened: on one phone, from a room, or by a reload into it. The rooms server
   refuses to choose or start it too, for a phone still on an older copy.

   The id is the game's id in GAME_CATALOG (JS_Catalog.html), the same as its
   room game's - for example 'bumper', 'uno', 'imposter', 'minigolf'. Chess is
   'shatranj' (its room game, 'chess', goes with it); 'chess' alone is the chess
   clock tool.

   Shared by the page (inlined, SHARED_LISTS) and the rooms server (bundled).
   ========================================================================= */
const DISABLED_GAMES = [
];

/** Whether a game on the home (a GAME_CATALOG id) is switched off. */
const gameIsOff = (id) => DISABLED_GAMES.indexOf(id) !== -1;
/** Whether a room game (a ROOM_GAME_IDS id) is switched off: its own id, or its home card's. */
const roomGameIsOff = (id) => gameIsOff(id) || (id === 'chess' && gameIsOff('shatranj'));
