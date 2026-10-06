/* ============================================================================
   الشاهد — THE WITNESS: the faces' rules both sides keep
   ----------------------------------------------------------------------------
   The faces are خمّن مين's (GuessWho.js: gwRandomFace, gwSignature, the fields
   and their values; drawn on the page by gwFaceSvg). This file adds what الشاهد
   needs on top, once for both sides: the page inlines it (the sketch artist's
   builder keeps a face within the same rules as it is built) and the rooms
   server bundles it (it deals the lineup and cleans every sketch a phone
   sends). No DOM, nothing that runs at load; every top-level name starts with
   witness / WITNESS_ (the page and the Worker are each one scope).

   A lineup is six faces very alike: the real one and five that each differ
   from it in one to three features (WITNESS_CHANGES), never two looking the
   same (gwSignature), all of one gender (a man among women would give it
   away), each with a name of its own.
   ========================================================================= */
const WITNESS_MIN = 3;
const WITNESS_MAX = 12;
const WITNESS_LINEUP = 6;
const WITNESS_LOOK_MS = 8000;      // the owner's 8 seconds
const WITNESS_DRAW_MS = 90000;     // the owner's 90 seconds, or less when the artist says done
const WITNESS_VOTE_MS = 45000;     // the jury's clock (decided while building)
const WITNESS_CRIMES = 24;         // the family crimes, by number; their words are the page's (wit_crime_0..23), dealt fresh across rooms (nextPrompts)

const WITNESS_STYLES = { m: ['short', 'curly', 'spiky', 'bald'], f: ['long', 'bun', 'curly', 'ponytail', 'braids'] };
const WITNESS_MOUTHS = ['smile', 'laugh', 'serious'];
const WITNESS_TOPS = ['tee', 'hoodie', 'collar'];
const WITNESS_TIES = ['', 'tie', 'bow'];
const WITNESS_PATTERNS = ['plain', 'stripes', 'dots'];

/** The face the artist starts from: plain, a man by default (the first tab turns it). */
const witnessBlank = (g) => ({
  g: g === 'f' ? 'f' : 'm', skin: 0, hair: 'black', style: g === 'f' ? 'long' : 'short', hijab: null,
  beard: false, mous: false, brows: '', eyes: 'brown', mouth: 'smile',
  freckles: false, rosy: false, mole: false, wrinkles: false,
  glasses: false, sun: false, phones: false, cap: null, ear: false, necklace: false, scarf: null,
  top: 'tee', tie: '', pattern: 'plain', shirt: 1
});

const witnessColour = (v) => (v === null || v === undefined || v === '' || v === false ? null
  : (Number(v) >= 0 && Number(v) < GW_COLOURS.length && Math.floor(Number(v)) === Number(v) ? Number(v) : null));

/**
 * A face kept within what can be worn together (gwRandomFace's rules): a man has
 * no hijab or earrings, a woman no beard; a hijab covers the ears, the neck and
 * a collar; a cap never on a bald head, a bun, a hijab or with headphones;
 * glasses or sunglasses, never both; a tie only on a collar. Changes `x` and returns it.
 */
const witnessFix = (x) => {
  x.g = x.g === 'f' ? 'f' : 'm';
  if (WITNESS_STYLES[x.g].indexOf(x.style) === -1) x.style = WITNESS_STYLES[x.g][0];
  if (x.g === 'm') { x.hijab = null; x.ear = false; }
  else { x.beard = false; x.mous = false; }
  if (x.hijab !== null && x.hijab !== undefined) {
    x.ear = false; x.necklace = false; x.scarf = null; x.cap = null; x.phones = false;
    if (x.top === 'collar') x.top = 'tee';
  }
  if (x.phones || x.style === 'bald' || x.style === 'bun') x.cap = null;
  if (x.sun) x.glasses = false;
  if (x.top !== 'collar') x.tie = '';
  return x;
};

/** A face from a phone: only the fields a face has, each a value it can take, then witnessFix. */
const witnessClean = (raw) => {
  const r = raw && typeof raw === 'object' ? raw : {};
  const one = (v, list, dflt) => (list.indexOf(v) !== -1 ? v : dflt);
  const g = r.g === 'f' ? 'f' : 'm';
  const skin = Math.floor(Number(r.skin));
  return witnessFix({
    g,
    skin: skin >= 0 && skin <= 3 ? skin : 0,
    hair: one(r.hair, GW_HAIR, 'black'),
    style: one(r.style, WITNESS_STYLES[g], WITNESS_STYLES[g][0]),
    hijab: g === 'f' ? witnessColour(r.hijab) : null,
    beard: !!r.beard, mous: !!r.mous,
    brows: r.brows === 'thick' ? 'thick' : '',
    eyes: one(r.eyes, GW_EYES, 'brown'),
    mouth: one(r.mouth, WITNESS_MOUTHS, 'smile'),
    freckles: !!r.freckles, rosy: !!r.rosy, mole: !!r.mole, wrinkles: !!r.wrinkles,
    glasses: !!r.glasses, sun: !!r.sun, phones: !!r.phones,
    cap: witnessColour(r.cap),
    ear: !!r.ear, necklace: !!r.necklace,
    scarf: witnessColour(r.scarf),
    top: one(r.top, WITNESS_TOPS, 'tee'),
    tie: one(r.tie, WITNESS_TIES, ''),
    pattern: one(r.pattern, WITNESS_PATTERNS, 'plain'),
    shirt: witnessColour(r.shirt) === null ? 1 : witnessColour(r.shirt)
  });
};

/**
 * The small changes a look-alike is made of: each one visible feature, and
 * only where it can show (no hair colour under a hijab, no eye colour behind
 * sunglasses). Each returns false when it can't apply to this face.
 */
const WITNESS_CHANGES = (() => {
  const other = (rnd, list, v) => { const o = list.filter(z => z !== v); return o[Math.floor(rnd() * o.length)]; };
  const noHijab = (x) => x.hijab === null || x.hijab === undefined;
  const colour = (rnd, v) => other(rnd, GW_COLOURS.map((_, i) => i), v);
  const flip = (k, when) => (x) => { if (when && !when(x)) return false; x[k] = !x[k]; return true; };
  return [
    (x, rnd) => { if (!noHijab(x) || x.style === 'bald') return false; x.hair = other(rnd, GW_HAIR, x.hair); return true; },
    (x, rnd) => { if (!noHijab(x)) return false; x.style = other(rnd, WITNESS_STYLES[x.g], x.style); return true; },
    (x) => { if (x.sun) { x.sun = false; x.glasses = true; } else x.glasses = !x.glasses; return true; },
    (x) => { if (x.glasses) return false; x.sun = !x.sun; return true; },
    flip('beard', (x) => x.g === 'm'),
    flip('mous', (x) => x.g === 'm'),
    (x) => { x.brows = x.brows === 'thick' ? '' : 'thick'; return true; },
    (x, rnd) => { if (x.sun) return false; x.eyes = other(rnd, GW_EYES, x.eyes); return true; },
    (x, rnd) => { x.mouth = other(rnd, WITNESS_MOUTHS, x.mouth); return true; },
    flip('freckles'), flip('rosy'), flip('mole'), flip('wrinkles'),
    (x, rnd) => {
      if (!noHijab(x) || x.phones || x.style === 'bald' || x.style === 'bun') return false;
      x.cap = x.cap === null || x.cap === undefined ? colour(rnd, x.shirt) : (rnd() < 0.5 ? null : colour(rnd, x.cap));
      return true;
    },
    (x, rnd) => { if (noHijab(x)) return false; x.hijab = colour(rnd, x.hijab); return true; },
    flip('ear', (x) => x.g === 'f' && noHijab(x)),
    flip('necklace', noHijab),
    (x, rnd) => { if (!noHijab(x)) return false; x.scarf = x.scarf === null || x.scarf === undefined ? colour(rnd, x.shirt) : null; return true; },
    flip('phones', (x) => noHijab(x) && (x.cap === null || x.cap === undefined)),
    (x, rnd) => { x.top = other(rnd, noHijab(x) ? WITNESS_TOPS : ['tee', 'hoodie'], x.top); if (x.top !== 'collar') x.tie = ''; return true; },
    (x, rnd) => { if (x.top !== 'collar') return false; x.tie = other(rnd, WITNESS_TIES, x.tie); return true; },
    (x, rnd) => { x.pattern = other(rnd, WITNESS_PATTERNS, x.pattern); return true; },
    (x, rnd) => { x.shirt = colour(rnd, x.shirt); return true; },
    (x) => { x.skin = x.skin >= 3 ? 2 : (x.skin <= 0 ? 1 : x.skin + (x.skin % 2 ? 1 : -1)); return true; }
  ];
})();

/** A hijab, a cap or a scarf in the shirt's own colour would melt into it (gwRandomFace keeps them apart). */
const witnessClash = (x) => [x.hijab, x.cap, x.scarf].some(c => c !== null && c !== undefined && c === x.shirt);

/** A look-alike of `real`: one to three changes, none undone by the rules. Null when none came out. */
const witnessAlike = (real, rnd, n) => {
  for (let tries = 0; tries < 40; tries++) {
    const x = Object.assign({}, real);
    const used = [];
    let k = 0;
    for (let guard = 0; k < n && guard < 60; guard++) {
      const i = Math.floor(rnd() * WITNESS_CHANGES.length);
      if (used.indexOf(i) !== -1) continue;
      if (WITNESS_CHANGES[i](x, rnd)) { used.push(i); k++; }
    }
    witnessFix(x);
    if (!witnessClash(x) && gwSignature(x) !== gwSignature(real)) return x;
  }
  return null;
};

/**
 * The lineup: six look-alikes of one hidden face (gwRandomFace), shuffled, none
 * two alike, each with a name of its gender; one of them, at random, is the real
 * one. Returns { faces, real } where `real` is the index of the real one - the
 * server's secret until the reveal.
 *
 * The hidden face itself is never shown. When the lineup was the real face and
 * five changes of it, the real one held the value most faces share in nearly every
 * feature - the centre of the six - and a juror could find it without listening to
 * the witness (the audit of 1 Oct 2026: 99.7% of lineups).
 */
const witnessLineup = (rnd) => {
  const r = rnd || Math.random;
  const g = r() < 0.5 ? 'm' : 'f';
  const base = gwRandomFace(r, g);
  const faces = [];
  const seen = {};
  seen[gwSignature(base)] = true;
  for (let guard = 0; faces.length < WITNESS_LINEUP && guard < 400; guard++) {
    // One change for about a third, two or three for the rest: close, never a copy.
    const n = [1, 1, 2, 2, 2, 3][Math.floor(r() * 6)];
    const x = witnessAlike(base, r, n);
    if (!x) continue;
    const sig = gwSignature(x);
    if (seen[sig]) continue;
    seen[sig] = true;
    faces.push(x);
  }
  // Names: every one different, of the lineup's gender.
  const names = GW_NAMES[g].map((_, i) => i);
  for (let i = names.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); const t = names[i]; names[i] = names[j]; names[j] = t; }
  faces.forEach((x, i) => { x.name = names[i]; });
  const order = faces.map((_, i) => i);
  for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); const t = order[i]; order[i] = order[j]; order[j] = t; }
  return { faces: order.map(i => faces[i]), real: Math.floor(r() * faces.length) };
};

/* --- «الرسم مطابق 78%»: the sketch held against the real face (the owner, 2 Oct 2026) ---
   Feature by feature (weighted, see below): the builder's own categories (the
   page's WIT_CATS keys), only those that show on the real face (no hair colour
   under a hijab or on a bald head, no hair style under a hijab, no eye colour
   behind sunglasses, a beard only on a man, a scarf and the extras only without
   a hijab, a tie only on a collar). A feature of several switches (the marks,
   the extras) is right when every one of them matches. The server works it out
   at the reveal (it alone has the real face before then) and publishes it as
   shared.match; at WITNESS_MATCH_LINE or more the witness and the artist each
   get WITNESS_MATCH_POINTS on top of their jury points. Man/woman, the hair's
   style and its colour weigh 2 (`w`), every other feature 1 (the owner, 2 Oct
   2026: a sketch with the wrong gender, hair and glasses scored 81% at equal weights). */
const WITNESS_MATCH_LINE = 70;     // the owner's 70%
const WITNESS_MATCH_POINTS = 1;    // to the witness and to the artist, each
const witnessNoHijab = (x) => x.hijab === null || x.hijab === undefined;
const witnessOn = (x, keys) => keys.map(k => (x[k] ? 1 : 0)).join('');
const WITNESS_FEATURES = [
  { k: 'g', w: 2, get: x => x.g },
  { k: 'skin', get: x => Number(x.skin) || 0 },
  { k: 'style', w: 2, when: witnessNoHijab, get: x => (witnessNoHijab(x) ? x.style : 'hijab') },
  { k: 'hair', w: 2, when: x => witnessNoHijab(x) && x.style !== 'bald', get: x => x.hair },
  { k: 'head', get: x => (x.cap !== null && x.cap !== undefined ? 'c' + x.cap : !witnessNoHijab(x) ? 'h' + x.hijab : 'none') },
  { k: 'glasses', get: x => (x.sun ? 'sun' : x.glasses ? 'glasses' : 'none') },
  { k: 'eyes', when: x => !x.sun, get: x => x.eyes },
  { k: 'brows', get: x => x.brows || '' },
  { k: 'beard', when: x => x.g === 'm', get: x => (x.beard ? 'b' : '') + (x.mous ? 'm' : '') },
  { k: 'mouth', get: x => x.mouth },
  { k: 'marks', get: x => witnessOn(x, ['mole', 'freckles', 'rosy', 'wrinkles']) },
  { k: 'extras', when: witnessNoHijab, get: (x, real) => witnessOn(x, (real.g === 'f' ? ['ear'] : []).concat(['necklace', 'phones'])) },
  { k: 'scarf', when: witnessNoHijab, get: x => (x.scarf === null || x.scarf === undefined ? 'none' : 's' + x.scarf) },
  { k: 'top', get: x => x.top },
  { k: 'tie', when: x => x.top === 'collar', get: x => x.tie || '' },
  { k: 'shirt', get: x => Number(x.shirt) },
  { k: 'pattern', get: x => x.pattern }
];

/** { feats: [{ k, ok }], ok, of, pct }: the sketch against the real face, over the features the real face shows.
   ok / of count the ticks; pct is weighted by each feature's `w` (default 1). */
const witnessMatch = (sketch, real) => {
  if (!real) return { feats: [], ok: 0, of: 0, pct: 0 };
  const a = witnessClean(sketch || witnessBlank('m'));
  const b = witnessClean(real);
  const shown = WITNESS_FEATURES.filter(f => !f.when || f.when(b));
  const feats = shown.map(f => ({ k: f.k, ok: String(f.get(a, b)) === String(f.get(b, b)) }));
  const ok = feats.filter(f => f.ok).length;
  let sum = 0, got = 0;
  shown.forEach((f, i) => { const w = f.w || 1; sum += w; if (feats[i].ok) got += w; });
  return { feats, ok, of: feats.length, pct: sum ? Math.round(got * 100 / sum) : 0 };
};
