/* ============================================================================
   الدومينو — THE TILES
   ----------------------------------------------------------------------------
   Shared by the page and the rooms server (SHARED_LISTS in tools/build-*.mjs,
   FILES in rooms-worker/build.mjs), so both read a tile, the open ends and a
   move's points the same way. Pure data and functions: no DOM, no room. Every
   top-level name starts with `domino`, because this file shares one scope with
   RoomGames.js on the server and with every JS_*.html on the page.
   ========================================================================= */
