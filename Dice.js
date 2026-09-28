/* ============================================================================
   Dice.js - the app's one die (28 Sep 2026, the owner: "the update we made to
   the dice, make it to any dice in the app too").

   Shared by the page (inlined, SHARED_LISTS in tools/build-*.mjs) and the rooms
   server (FILES in rooms-worker/build.mjs). Every real roll goes through it:
   السلم والتعبان, لودو, بنك الحظ and the dice tool, on the phone and in rooms.
   ========================================================================= */

/**
 * A die: 1 to 6, each exactly as likely, from the cryptographic random source
 * (crypto.getRandomValues, on every phone and in the Worker). A byte of 252 or
 * more is thrown away and drawn again, because 256 doesn't divide by 6: keeping
 * them would make 1-4 a hair likelier than 5 and 6. Math.random only where there
 * is no crypto at all.
 */
const fairDie = () => {
  const c = typeof globalThis !== 'undefined' && globalThis.crypto;
  if (c && c.getRandomValues) {
    const b = new Uint8Array(1);
    for (;;) { c.getRandomValues(b); if (b[0] < 252) return 1 + (b[0] % 6); }
  }
  return 1 + Math.floor(Math.random() * 6);
};
