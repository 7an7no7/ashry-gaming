/* ============================================================================
   خمّن مين — GUESS WHO: the faces and a board of them
   ----------------------------------------------------------------------------
   One copy for both sides: the page inlines this file (it draws the faces)
   and the rooms server bundles it (it deals the board). No DOM, nothing that
   runs at load, and every top-level name starts with gw / GW_ - the page and
   the Worker are each one scope.

   There is no list of questions (the owner, 29 Sep 2026: "the player always
   thinks about what he wants to ask"): every question is asked out loud or
   typed, and the other player answers it. So a face is made to be looked
   at - many things to ask about, several on one face - and drawn by the page
   (gwFaceSvg in JS_GuessWho.html, look ب «ألبوم ناعم»), never a photo:
     g        'm' | 'f'              skin     0-3
     hair     black | brown | blonde | red | grey
     style    men: short | curly | spiky | bald · women: long | bun | curly | ponytail | braids
     hijab    null | a colour (women; it covers the hair, the ears and the neck,
            so a face with one has no collar, tie, necklace or scarf)
     beard, mous (moustache)       men
     brows    'thick' | ''          eyes     brown | blue | green
     mouth    smile | laugh | serious
     freckles, rosy (cheeks), mole, wrinkles: true | false
     glasses, sun (sunglasses, never both), phones (headphones): true | false
     cap      null | a colour       ear (earrings), necklace: true | false
     scarf    null | a colour       top      tee | hoodie | collar
     tie      '' | 'tie' | 'bow' (a collar only)
     pattern  plain | stripes | dots    shirt    a colour
     name     an index into GW_NAMES[g], the same name in both languages
   A colour is an index into GW_COLOURS, each one a colour a family names
   (red, blue, green, yellow, purple, orange, pink, grey), since "is he
   wearing blue?" is a fair question now.

   A board is `size` faces, half men and half women, no two looking the same
   (gwSignature: everything that can be seen, not what is hidden - the hair
   under a hijab, the eyes behind sunglasses).
   ========================================================================= */
const GW_SIZES = [16, 24, 30];
const GW_CLOCKS = [0, 30, 60];
// «فريق ضد فريق» (the owner, 2 Oct 2026): the lobby's switch shows from this many people, and a
// team's final guess waits this long for a second teammate's «متفقين» (decided here, open to change).
const GW_TEAMS_MIN = 4;
const GW_AGREE_SECS = 20;

const GW_NAMES = {
  m: [
    ['سامح', 'Sameh'], ['كريم', 'Karim'], ['ياسر', 'Yasser'], ['عمرو', 'Amr'], ['شريف', 'Sherif'], ['طارق', 'Tarek'],
    ['حسام', 'Hossam'], ['مجدي', 'Magdy'], ['يوسف', 'Youssef'], ['مصطفى', 'Mostafa'], ['خالد', 'Khaled'], ['باسم', 'Bassem'],
    ['رامي', 'Ramy'], ['وليد', 'Walid'], ['حازم', 'Hazem'], ['عادل', 'Adel'], ['شادي', 'Shady'], ['هشام', 'Hisham'],
    ['أشرف', 'Ashraf'], ['ماجد', 'Maged'], ['نبيل', 'Nabil'], ['سيف', 'Seif'], ['علي', 'Ali'], ['حمدي', 'Hamdy']
  ],
  f: [
    ['منى', 'Mona'], ['هند', 'Hend'], ['نادية', 'Nadia'], ['دينا', 'Dina'], ['سلمى', 'Salma'], ['رانيا', 'Rania'],
    ['ليلى', 'Laila'], ['فريدة', 'Farida'], ['أمل', 'Amal'], ['نور', 'Nour'], ['إيمان', 'Eman'], ['عزة', 'Azza'],
    ['مروة', 'Marwa'], ['ريم', 'Reem'], ['هالة', 'Hala'], ['سارة', 'Sara'], ['ياسمين', 'Yasmin'], ['شهد', 'Shahd'],
    ['جميلة', 'Gamila'], ['سعاد', 'Soad'], ['نهى', 'Noha'], ['رحاب', 'Rehab'], ['لبنى', 'Lobna'], ['عبير', 'Abeer']
  ]
};

const GW_HAIR = ['black', 'brown', 'blonde', 'red', 'grey'];
const GW_EYES = ['brown', 'blue', 'green'];
// The colours of clothes, a hijab, a cap and a scarf: names everyone says (أحمر، أزرق…).
const GW_COLOURS = ['red', 'blue', 'green', 'yellow', 'purple', 'orange', 'pink', 'grey'];

const gwSize = (n) => GW_SIZES.indexOf(Number(n)) !== -1 ? Number(n) : 24;
/** Everything that can be seen on a face: two faces with the same one would look alike. */
const gwSignature = (x) => [
  x.g, x.hijab === null || x.hijab === undefined ? 'h-' : 'h' + x.hijab,
  x.hijab === null || x.hijab === undefined ? x.style + (x.style === 'bald' ? '' : x.hair) : '',
  x.hair === 'grey' && x.style === 'bald' ? 'grey' : '',
  x.beard ? 'b' : '', x.mous ? 'm' : '', x.brows || '', x.sun ? 'sun' : 'e' + x.eyes, x.mouth,
  x.freckles ? 'f' : '', x.rosy ? 'r' : '', x.mole ? 'o' : '', x.wrinkles ? 'w' : '',
  x.glasses ? 'g' : '', x.phones ? 'p' : '', x.cap === null || x.cap === undefined ? '' : 'c' + x.cap,
  x.ear ? 'e' : '', x.necklace ? 'n' : '', x.scarf === null || x.scarf === undefined ? '' : 's' + x.scarf,
  x.top, x.tie || '', x.pattern, x.shirt, x.skin
].join('|');

/** One face, from a random source `rnd` (Math.random, or a seeded one in a test). */
const gwRandomFace = (rnd, g) => {
  const pick = (a) => a[Math.floor(rnd() * a.length)];
  const p = (n) => rnd() < n;
  const colour = () => Math.floor(rnd() * GW_COLOURS.length);
  const hijab = g === 'f' && p(0.3) ? colour() : null;
  const style = g === 'm' ? pick(['short', 'short', 'curly', 'spiky', 'bald']) : pick(['long', 'long', 'bun', 'curly', 'ponytail', 'braids']);
  const wrinkles = p(0.16);
  const hair = (wrinkles && p(0.6)) || p(0.08) ? 'grey' : pick(['black', 'black', 'brown', 'brown', 'blonde', 'red']);
  const sun = p(0.1);
  // A hijab covers a collar, a tie and a necklace, so a face with one never has them (they couldn't be seen).
  const top = hijab === null ? pick(['tee', 'hoodie', 'collar']) : pick(['tee', 'hoodie']);
  // A cap would hide a bald head, a bun or a hijab; headphones and a cap don't sit together.
  const phones = hijab === null && p(0.14);
  const cap = hijab === null && !phones && style !== 'bald' && style !== 'bun' && p(0.2) ? colour() : null;
  let shirt = colour();
  const x = {
    g: g,
    skin: Math.floor(rnd() * 4),
    hair: hair,
    style: style,
    hijab: hijab,
    beard: g === 'm' && p(0.34),
    mous: g === 'm' && p(0.38),
    brows: p(0.25) ? 'thick' : '',
    eyes: rnd() < 0.55 ? 'brown' : (rnd() < 0.5 ? 'blue' : 'green'),
    mouth: pick(['smile', 'smile', 'laugh', 'serious', 'serious']),
    freckles: p(0.2),
    rosy: p(0.25),
    mole: p(0.16),
    wrinkles: wrinkles,
    glasses: !sun && p(0.3),
    sun: sun,
    phones: phones,
    cap: cap,
    ear: g === 'f' && hijab === null && p(0.5),
    necklace: hijab === null && p(g === 'f' ? 0.3 : 0.1),
    scarf: hijab === null && p(0.15) ? colour() : null,
    top: top,
    tie: top === 'collar' ? (p(0.35) ? 'tie' : (p(0.3) ? 'bow' : '')) : '',
    pattern: pick(['plain', 'plain', 'stripes', 'dots']),
    shirt: shirt
  };
  // A hijab, a cap or a scarf in the shirt's own colour would melt into it.
  while (x.shirt === x.hijab || x.shirt === x.cap || x.shirt === x.scarf) x.shirt = (x.shirt + 1) % GW_COLOURS.length;
  return x;
};

/**
 * A board of `size` faces, half men and half women, no two looking the same
 * (gwSignature) and every name used once.
 */
const gwDealBoard = (size, rnd) => {
  const n = gwSize(size);
  const r = rnd || Math.random;
  const seen = {};
  const names = { m: [], f: [] };
  const order = { m: GW_NAMES.m.map((_, i) => i), f: GW_NAMES.f.map((_, i) => i) };
  ['m', 'f'].forEach(g => {
    const a = order[g];
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; }
  });
  const faces = [];
  let tries = 0;
  while (faces.length < n && tries < 5000) {
    tries++;
    const g = faces.length % 2 === 0 ? 'm' : 'f';
    const x = gwRandomFace(r, g);
    const sig = gwSignature(x);
    if (seen[sig]) continue;
    seen[sig] = true;
    x.name = order[g][names[g].length];
    names[g].push(x.name);
    faces.push(x);
  }
  // Shuffled, so the men and women don't alternate across the board.
  for (let i = faces.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); const t = faces[i]; faces[i] = faces[j]; faces[j] = t; }
  return faces;
};

/** A face's name in a language. */
const gwName = (x, lang) => {
  const row = x && GW_NAMES[x.g] && GW_NAMES[x.g][x.name];
  return row ? (lang === 'en' ? row[1] : row[0]) : '';
};

/** The faces still up on a board: every index not in `down`. */
const gwUp = (faces, down) => {
  const d = down || [];
  const out = [];
  for (let i = 0; i < (faces || []).length; i++) if (d.indexOf(i) === -1) out.push(i);
  return out;
};
