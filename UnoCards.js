/* ============================================================================
   أونو — THE CARDS
   ----------------------------------------------------------------------------
   Shared by the page and the rooms server (SHARED_LISTS in tools/build-*.mjs,
   FILES in rooms-worker/build.mjs), so both name, draw and match a card the
   same way. Pure data and functions: no DOM, no room. Every top-level name
   starts with `uno`, because this file shares one scope with RoomGames.js on
   the server and with every JS_*.html on the page.
   ========================================================================= */
