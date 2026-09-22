/* ============================================================================
   خمّن مين — GUESS WHO: the faces, the questions, a board, the computer's pick
   ----------------------------------------------------------------------------
   One copy for both sides: the page inlines this file (it draws the faces
   and lists the questions) and the rooms server bundles it (it deals the
   board and answers the questions). No DOM, nothing that runs at load, and
   every top-level name starts with gw / GW_ - the page and the Worker are
   each one scope.

   A face is a set of plain features, drawn by the page (gwFaceSvg in
   JS_GuessWho.html) and never a photo (the owner's choice, 22 Sep 2026):
     g      'm' | 'f'
     skin   0-3            hair   black | brown | blonde | red | grey
     style  short | curly | bald (men) · long | bun | curly (women)
     glasses, hat, beard, mous (moustache), ear (earrings): true | false
     eyes   brown | blue | green
     shirt  0-7 (a colour, not a question)
     name   an index into GW_NAMES[g], the same name in both languages
   A board is `size` faces with a different answer somewhere in the list of
   questions for every pair (gwSignature), so the list alone can always
   find any face on it.

   Every question is a plain feature with a yes or a no (GW_QUESTIONS), so
   the server can answer one truthfully (gwAnswer). A cap is never drawn on
   a bald head or a bun, where it would hide the answer to a question, and a
   bald head has no hair colour: "black hair?" is no for it.
   ========================================================================= */
const GW_SIZES = [16, 24, 30];
const GW_CLOCKS = [0, 30, 60];

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

/** The list of questions, in the order the phone shows them: each a feature with a plain yes or no. */
const GW_QUESTIONS = [
  { id: 'woman',   ar: 'بنت؟',            en: 'A woman?',          f: (x) => x.g === 'f' },
  { id: 'glasses', ar: 'لابس نضارة؟',     en: 'Wearing glasses?',  f: (x) => !!x.glasses },
  { id: 'hat',     ar: 'لابس كاب؟',       en: 'Wearing a cap?',    f: (x) => !!x.hat },
  { id: 'beard',   ar: 'عنده دقن؟',       en: 'Has a beard?',      f: (x) => !!x.beard },
  { id: 'mous',    ar: 'عنده شنب؟',       en: 'Has a moustache?',  f: (x) => !!x.mous },
  { id: 'ear',     ar: 'لابس حلق؟',       en: 'Wearing earrings?', f: (x) => !!x.ear },
  { id: 'bald',    ar: 'أصلع؟',           en: 'Bald?',             f: (x) => x.style === 'bald' },
  { id: 'long',    ar: 'شعره طويل؟',      en: 'Long hair?',        f: (x) => x.style === 'long' },
  { id: 'curly',   ar: 'شعره كيرلي؟',     en: 'Curly hair?',       f: (x) => x.style === 'curly' },
  { id: 'bun',     ar: 'شعره كحكة؟',      en: 'Hair in a bun?',    f: (x) => x.style === 'bun' },
  { id: 'black',   ar: 'شعره أسود؟',      en: 'Black hair?',       f: (x) => x.style !== 'bald' && x.hair === 'black' },
  { id: 'brown',   ar: 'شعره بني؟',       en: 'Brown hair?',       f: (x) => x.style !== 'bald' && x.hair === 'brown' },
  { id: 'blonde',  ar: 'شعره أصفر؟',      en: 'Blond hair?',       f: (x) => x.style !== 'bald' && x.hair === 'blonde' },
  { id: 'red',     ar: 'شعره أحمر؟',      en: 'Red hair?',         f: (x) => x.style !== 'bald' && x.hair === 'red' },
  { id: 'grey',    ar: 'شعره أبيض؟',      en: 'Grey hair?',        f: (x) => x.style !== 'bald' && x.hair === 'grey' },
  { id: 'eyeblue', ar: 'عينه زرقا؟',      en: 'Blue eyes?',        f: (x) => x.eyes === 'blue' },
  { id: 'eyegreen', ar: 'عينه خضرا؟',     en: 'Green eyes?',       f: (x) => x.eyes === 'green' },
  { id: 'eyebrown', ar: 'عينه بني؟',      en: 'Brown eyes?',       f: (x) => x.eyes === 'brown' }
];

const gwSize = (n) => GW_SIZES.indexOf(Number(n)) !== -1 ? Number(n) : 24;
const gwQuestionIndex = (id) => GW_QUESTIONS.findIndex(q => q.id === id);

/** The truthful answer to question `qi` about face `x`. */
const gwAnswer = (qi, x) => !!(GW_QUESTIONS[qi] && x && GW_QUESTIONS[qi].f(x));

/** A face's answers to every question: two faces with the same one could never be told apart. */
const gwSignature = (x) => GW_QUESTIONS.map(q => (q.f(x) ? '1' : '0')).join('');

/** One face, from a random source `rnd` (Math.random, or a seeded one in a test). */
const gwRandomFace = (rnd, g) => {
  const pick = (a) => a[Math.floor(rnd() * a.length)];
  const style = g === 'm' ? pick(['short', 'short', 'curly', 'bald']) : pick(['long', 'long', 'bun', 'curly']);
  const hair = rnd() < 0.14 ? 'grey' : pick(['black', 'black', 'brown', 'brown', 'blonde', 'red']);
  return {
    g: g,
    skin: Math.floor(rnd() * 4),
    hair: hair,
    style: style,
    glasses: rnd() < 0.3,
    // A cap on a bald head or a bun would hide the answer to a question.
    hat: style !== 'bald' && style !== 'bun' && rnd() < 0.22,
    beard: g === 'm' && rnd() < 0.36,
    mous: g === 'm' && rnd() < 0.4,
    ear: g === 'f' && rnd() < 0.5,
    eyes: rnd() < 0.55 ? 'brown' : (rnd() < 0.5 ? 'blue' : 'green'),
    shirt: Math.floor(rnd() * 8)
  };
};

/**
 * A board of `size` faces, half men and half women, every one a different
 * answer to the list (gwSignature) and every name used once.
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

/** The faces a truthful answer rules out: those still up that would have answered the other way. */
const gwRuledOut = (faces, down, qi, answer) =>
  gwUp(faces, down).filter(i => gwAnswer(qi, faces[i]) !== !!answer);

/**
 * The computer's question for the faces still up on its board, or -1 when no
 * question in the list tells them apart. Hard takes the one that comes
 * closest to halving them; easy any that splits them at all.
 */
const gwBotQuestion = (faces, down, asked, level, rnd) => {
  const up = gwUp(faces, down);
  const used = asked || [];
  const useful = [];
  GW_QUESTIONS.forEach((q, qi) => {
    if (used.indexOf(qi) !== -1) return;
    const yes = up.filter(i => q.f(faces[i])).length;
    if (yes > 0 && yes < up.length) useful.push({ qi: qi, d: Math.abs(yes - up.length / 2) });
  });
  if (!useful.length) return -1;
  if (level === 'hard') {
    useful.sort((a, b) => a.d - b.d);
    const best = useful.filter(u => u.d === useful[0].d);
    return best[Math.floor((rnd || Math.random)() * best.length)].qi;
  }
  return useful[Math.floor((rnd || Math.random)() * useful.length)].qi;
};
