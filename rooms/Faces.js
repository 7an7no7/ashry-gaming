/* ============================================================================
   «اعمل وشك» (the looks of 7 Oct 2026, 1282, look ب): a player's drawn face
   ----------------------------------------------------------------------------
   In the name sheet («أنت: منى ✏️», Settings → your name) a player can make a
   face like خمّن مين's (the hair, the skin, glasses, a hijab, a cap…) or roll
   one with 🎲; whoever makes none stays their initial on a colour. The face is
   kept on the phone (localStorage ashryFace, moved by «انقل لموبايل تاني») and
   sent to a room on create, join, rename and becomePlayer as one short string
   of digits, one per part below. The server keeps it on the player
   (room.players[].face) only when every digit is within its part's list
   (faceClean); anything else is refused. Old phones send nothing.

   One copy, both sides: the rooms server bundles this file (FILES in
   rooms-worker/build.mjs) and the page has it in the chunk 'faces' with the
   drawing (JS_Faces.html, gwFaceSvg).
   ========================================================================= */

// [part, how many values]. The digit is the index in that part's list.
const FACE_PARTS = [
  ['skin', 4],     // GW_SKIN
  ['hair', 5],     // FACE_HAIRS
  ['style', 8],    // FACE_STYLES
  ['shirt', 8],    // GW_COLOUR_HEX
  ['eyes', 3],     // FACE_EYES
  ['mouth', 3],    // FACE_MOUTHS
  ['eyewear', 3],  // 0 none, 1 glasses, 2 sunglasses
  ['hijab', 9],    // 0 none, 1-8 its colour + 1
  ['cap', 9],      // 0 none, 1-8 its colour + 1
  ['phones', 2],   // headphones
  ['beard', 4]     // 0 none, 1 a beard, 2 a moustache, 3 both
];
const FACE_LEN = FACE_PARTS.length;
const FACE_HAIRS = ['black', 'brown', 'blonde', 'red', 'grey'];
const FACE_STYLES = ['short', 'long', 'curly', 'spiky', 'bun', 'ponytail', 'braids', 'bald'];
const FACE_EYES = ['brown', 'blue', 'green'];
const FACE_MOUTHS = ['smile', 'laugh', 'serious'];

/** The digits of a face as numbers, by part name. */
const faceParts = (s) => {
  const o = {};
  FACE_PARTS.forEach((p, i) => { o[p[0]] = s.charCodeAt(i) - 48; });
  return o;
};

/**
 * What a phone sent, made safe: '' for no face (nothing sent, or the initial
 * chosen again), the face's string when every digit is within its part, and
 * null for anything else (refused). What can't be worn together is settled the
 * way it is drawn: a hijab leaves no room for a cap or headphones, a cap none
 * for headphones.
 */
function faceClean(raw) {
  if (raw === undefined || raw === null || raw === '') return '';
  if (typeof raw !== 'string' || raw.length !== FACE_LEN) return null;
  for (let i = 0; i < FACE_LEN; i++) {
    const d = raw.charCodeAt(i) - 48;
    if (!(d >= 0 && d < FACE_PARTS[i][1])) return null;
  }
  const x = faceParts(raw);
  if (x.hijab) { x.cap = 0; x.phones = 0; }
  if (x.cap) x.phones = 0;
  return FACE_PARTS.map((p) => String(x[p[0]])).join('');
}

/** A random face (🎲), from `rnd` (Math.random, or a seeded one in a test). */
function faceRandom(rnd) {
  const r = rnd || Math.random;
  const n = (k) => Math.floor(r() * k);
  const x = {};
  FACE_PARTS.forEach((p) => { x[p[0]] = n(p[1]); });
  // Most faces wear nothing, as on a real table.
  x.eyewear = r() < 0.7 ? 0 : 1 + n(2);
  x.hijab = r() < 0.18 ? 1 + n(8) : 0;
  x.cap = r() < 0.15 ? 1 + n(8) : 0;
  x.phones = r() < 0.1 ? 1 : 0;
  x.beard = r() < 0.65 ? 0 : 1 + n(3);
  return faceClean(FACE_PARTS.map((p) => String(x[p[0]])).join(''));
}
