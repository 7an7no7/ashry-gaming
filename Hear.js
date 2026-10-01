/* ============================================================================
   ارسم اللي بتسمعه — DRAW WHAT YOU HEAR: the pictures and the judge
   ----------------------------------------------------------------------------
   Shared, no DOM: inlined into the page (SHARED_LISTS, the game's chunk) and
   bundled into the rooms server (rooms-worker/build.mjs FILES), so the phones
   draw the very picture the server dealt and judged.

   A picture is a list of outlines in a 0..100 square:
     { k: 'c', x, y, r }          a circle
     { k: 'e', x, y, rx, ry }     an ellipse
     { k: 'r', x, y, w, h }       a rectangle (x, y its top-left corner)
     { k: 'p', p: [[x, y], ...] } a closed shape (a triangle, a diamond...)
     { k: 'l', p: [[x, y], ...] } a line (open; two points or more)
   made from a seed (hearPicture): either shapes placed on a 3 x 3 board
   («أشكال»), or a simple drawing built of shapes («رسومات»: a house, a car, a
   face... each a generator of variants, never a fixed picture).

   The judge (hearScore): the picture and a drawing (the drawing toolbox's
   strokes, 0..255) are both rasterised on a HEAR_GRID square, each ink cell
   of one is measured to the nearest ink of the other (a chamfer distance
   transform), and a cell counts fully within HEAR_NEAR cells and fades to
   nothing at HEAR_FAR. Precision (how much of the drawing is near the
   picture) and recall (how much of the picture the drawing reached) meet in
   their harmonic mean; a drawing with far more ink than the picture
   (scribbling the page over) is scaled down by the ink it wasted. A rough but
   right drawing scores well, a blank one 0, a scribble low.
   Every name here starts with hear / HEAR_.
   ========================================================================= */
const HEAR_MIN = 3;                    // a describer and two drawers
const HEAR_MAX = 12;
const HEAR_SECONDS = [60, 90, 120];    // the drawing's clock, the host's pick
const HEAR_SECONDS_DEFAULT = 90;
const HEAR_CUT_MS = 10000;             // «خلّصت»: the drawers get this much more, then pencils down
const HEAR_SWAPS = 2;                  // «🔄 صورة تانية»: before the clock starts
const HEAR_KINDS = ['mix', 'shapes', 'things'];
const HEAR_LEVELS = ['easy', 'mid', 'hard'];
const HEAR_LAPS = [1, 2];              // everyone describes once, or twice
const HEAR_PLACE_POINTS = [3, 2, 1];   // the three closest drawings
const HEAR_DESC_STEP = 20;             // the describer: a point for every 20% of the drawers' average
const HEAR_DESC_MAX = 3;
const HEAR_WEIRD_POINTS = 1;           // «أغرب رسمة»
const HEAR_WEIRD_MIN_VOTES = 2;        // the most votes, and at least two of them

/* --- a seeded random -------------------------------------------------------- */
function hearRng(seed) {
  let a = (Number(seed) >>> 0) || 1;
  return function () {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const hearPick = (rnd, list) => list[Math.floor(rnd() * list.length) % list.length];
const hearBetween = (rnd, a, b) => a + (b - a) * rnd();
const hearRound1 = (n) => Math.round(n * 10) / 10;

/* --- the things: each a generator of variants, drawn in a 100 box ------------
   `core` parts always, `extra` parts by the level (mid some, hard all). Names
   are what the describer's board says once it is revealed. */
const HEAR_THING_NAMES = {
  house:   { ar: 'بيت', en: 'A house' },
  car:     { ar: 'عربية', en: 'A car' },
  face:    { ar: 'وش', en: 'A face' },
  tree:    { ar: 'شجرة', en: 'A tree' },
  boat:    { ar: 'مركب', en: 'A boat' },
  fish:    { ar: 'سمكة', en: 'A fish' },
  snowman: { ar: 'رجل التلج', en: 'A snowman' },
  rocket:  { ar: 'صاروخ', en: 'A rocket' },
  flower:  { ar: 'وردة', en: 'A flower' },
  robot:   { ar: 'روبوت', en: 'A robot' },
  kite:    { ar: 'طيارة ورق', en: 'A kite' },
  icecream:{ ar: 'آيس كريم', en: 'An ice cream' },
  clock:   { ar: 'ساعة حيطة', en: 'A wall clock' },
  sun:     { ar: 'شمس', en: 'The sun' },
  train:   { ar: 'قطر', en: 'A train' },
  lamp:    { ar: 'أباجورة', en: 'A lamp' },
  cup:     { ar: 'كوباية شاي', en: 'A cup of tea' },
  mushroom:{ ar: 'عيش الغراب', en: 'A mushroom' },
  balloon: { ar: 'بلالين', en: 'Balloons' },
  traffic: { ar: 'إشارة مرور', en: 'Traffic lights' }
};
const HEAR_SHAPES_NAME = { ar: 'أشكال على شبكة', en: 'Shapes on a grid' };

const hearCircle = (x, y, r) => ({ k: 'c', x, y, r });
const hearRect = (x, y, w, h) => ({ k: 'r', x, y, w, h });
const hearPoly = (pts) => ({ k: 'p', p: pts });
const hearLine = (pts) => ({ k: 'l', p: pts });
const hearEllipse = (x, y, rx, ry) => ({ k: 'e', x, y, rx, ry });

/** How many of the extra parts a level adds: easy none, mid half (at least one), hard all. */
function hearExtras(rnd, level, extras) {
  const list = extras.slice();
  for (let i = list.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); const t = list[i]; list[i] = list[j]; list[j] = t; }
  const n = level === 'hard' ? list.length : level === 'mid' ? Math.max(1, Math.ceil(list.length / 2)) : 0;
  const out = [];
  list.slice(0, n).forEach(f => { const parts = f(); (Array.isArray(parts) ? parts : [parts]).forEach(p => p && out.push(p)); });
  return out;
}

const HEAR_THINGS = {
  house(rnd, level) {
    const w = hearBetween(rnd, 44, 60), h = hearBetween(rnd, 30, 40);
    const x = 50 - w / 2, y = 92 - h;
    const roofH = hearBetween(rnd, 20, 30), over = hearBetween(rnd, 2, 8);
    const door = hearBetween(rnd, 10, 14), dx = hearPick(rnd, [x + w * 0.5 - door / 2, x + w * 0.22, x + w * 0.62]);
    const core = [hearRect(x, y, w, h), hearPoly([[x - over, y], [50, y - roofH], [x + w + over, y]]), hearRect(dx, 92 - h * 0.55, door, h * 0.55)];
    const winX = dx < 50 - door ? x + w * 0.62 : x + w * 0.12;
    const extra = hearExtras(rnd, level, [
      () => hearRect(winX, y + h * 0.18, 11, 11),
      () => hearCircle(hearPick(rnd, [14, 86]), 14, hearBetween(rnd, 6, 8)),
      () => hearRect(x + w * 0.72, y - roofH * 0.62, 7, roofH * 0.42),
      () => hearCircle(50, y - roofH * 0.45, 4)
    ]);
    return core.concat(extra);
  },
  car(rnd, level) {
    const w = hearBetween(rnd, 66, 80), h = hearBetween(rnd, 16, 22), x = 50 - w / 2, y = hearBetween(rnd, 46, 54);
    const top = hearBetween(rnd, 14, 20), inset = hearBetween(rnd, 8, 14);
    const r = hearBetween(rnd, 7, 9);
    const core = [hearRect(x, y, w, h), hearPoly([[x + inset, y], [x + inset + 8, y - top], [x + w - inset - 8, y - top], [x + w - inset, y]]),
      hearCircle(x + w * 0.24, y + h, r), hearCircle(x + w * 0.76, y + h, r)];
    const extra = hearExtras(rnd, level, [
      () => hearLine([[50, y - top], [50, y]]),
      () => hearCircle(x + w - 4, y + 5, 2.5),
      () => hearLine([[4, y + h + r + 2], [96, y + h + r + 2]])
    ]);
    return core.concat(extra);
  },
  face(rnd, level) {
    const R = hearBetween(rnd, 32, 40), cx = 50, cy = 52;
    const ey = cy - R * 0.25, ex = R * 0.38, er = hearBetween(rnd, 4, 6);
    const smile = rnd() < 0.7;
    const my = cy + R * 0.42;
    const core = [hearCircle(cx, cy, R), hearCircle(cx - ex, ey, er), hearCircle(cx + ex, ey, er),
      smile ? hearLine([[cx - R * 0.4, my - 4], [cx, my + 4], [cx + R * 0.4, my - 4]]) : hearLine([[cx - R * 0.35, my], [cx + R * 0.35, my]])];
    const extra = hearExtras(rnd, level, [
      () => hearPoly([[cx, cy - 4], [cx - 5, cy + 9], [cx + 5, cy + 9]]),
      () => [hearCircle(cx - R - 3, cy, 6), hearCircle(cx + R + 3, cy, 6)],
      () => hearPoly([[cx - R * 0.7, cy - R * 0.72], [cx, cy - R - 18], [cx + R * 0.7, cy - R * 0.72]]),
      () => [hearLine([[cx - ex - 6, ey - 9], [cx - ex + 6, ey - 11]]), hearLine([[cx + ex - 6, ey - 11], [cx + ex + 6, ey - 9]])]
    ]);
    return core.concat(extra);
  },
  tree(rnd, level) {
    const pine = rnd() < 0.4;
    const tw = hearBetween(rnd, 9, 14), th = hearBetween(rnd, 22, 30);
    const core = [hearRect(50 - tw / 2, 90 - th, tw, th)];
    if (pine) {
      core.push(hearPoly([[24, 90 - th], [50, 90 - th - 28], [76, 90 - th]]));
      core.push(hearPoly([[30, 90 - th - 20], [50, 90 - th - 48], [70, 90 - th - 20]]));
    } else {
      core.push(hearCircle(50, 90 - th - hearBetween(rnd, 20, 24), hearBetween(rnd, 22, 28)));
    }
    const extra = hearExtras(rnd, level, [
      () => hearLine([[6, 90], [94, 90]]),
      () => hearCircle(hearPick(rnd, [14, 86]), 13, 7),
      () => pine ? hearCircle(50, 90 - th - 52, 3) : [hearCircle(42, 40, 3.5), hearCircle(58, 34, 3.5)]
    ]);
    return core.concat(extra);
  },
  boat(rnd, level) {
    const y = hearBetween(rnd, 58, 64), w = hearBetween(rnd, 30, 38), d = hearBetween(rnd, 14, 18);
    const core = [hearPoly([[50 - w, y], [50 + w, y], [50 + w - 12, y + d], [50 - w + 12, y + d]]), hearLine([[50, y], [50, y - 46]]),
      hearPoly([[53, y - 44], [53, y - 4], [53 + hearBetween(rnd, 22, 30), y - 4]])];
    const extra = hearExtras(rnd, level, [
      () => hearLine([[4, 90], [20, 85], [36, 90], [52, 85], [68, 90], [84, 85], [96, 89]]),
      () => hearPoly([[47, y - 40], [47, y - 6], [47 - hearBetween(rnd, 16, 22), y - 6]]),
      () => hearCircle(hearPick(rnd, [14, 86]), 13, 7),
      () => hearPoly([[50, y - 46], [62, y - 50], [50, y - 54]])
    ]);
    return core.concat(extra);
  },
  fish(rnd, level) {
    const cx = hearBetween(rnd, 42, 48), rx = hearBetween(rnd, 26, 32), ry = hearBetween(rnd, 15, 20);
    const tail = cx + rx;
    const core = [hearEllipse(cx, 50, rx, ry), hearPoly([[tail - 2, 50], [tail + 18, 50 - 14], [tail + 18, 50 + 14]]), hearCircle(cx - rx * 0.55, 46, 3.5)];
    const extra = hearExtras(rnd, level, [
      () => hearLine([[cx - rx * 0.2, 50 - ry + 2], [cx - rx * 0.2, 50 + ry - 2]]),
      () => [hearCircle(cx - rx - 8, 34, 3), hearCircle(cx - rx - 12, 24, 4)],
      () => hearPoly([[cx - 6, 50 - ry + 1], [cx + 4, 50 - ry - 10], [cx + 12, 50 - ry + 2]]),
      () => hearLine([[6, 88], [94, 88]])
    ]);
    return core.concat(extra);
  },
  snowman(rnd, level) {
    const r1 = hearBetween(rnd, 20, 24), r2 = hearBetween(rnd, 14, 17), r3 = hearBetween(rnd, 9, 11);
    const y1 = 92 - r1, y2 = y1 - r1 - r2 + 3, y3 = y2 - r2 - r3 + 3;
    const core = [hearCircle(50, y1, r1), hearCircle(50, y2, r2), hearCircle(50, y3, r3)];
    const extra = hearExtras(rnd, level, [
      () => [hearLine([[50 - r2, y2], [50 - r2 - 18, y2 - 12]]), hearLine([[50 + r2, y2], [50 + r2 + 18, y2 - 12]])],
      () => [hearRect(50 - r3 * 0.8, y3 - r3 - 12, r3 * 1.6, 12), hearLine([[50 - r3 * 1.3, y3 - r3], [50 + r3 * 1.3, y3 - r3]])],
      () => [hearCircle(50, y2 - 5, 2), hearCircle(50, y2 + 5, 2)],
      () => hearPoly([[50, y3 - 1], [50 + 14, y3 + 2], [50, y3 + 4]])
    ]);
    return core.concat(extra);
  },
  rocket(rnd, level) {
    const w = hearBetween(rnd, 18, 24), top = hearBetween(rnd, 30, 36), bottom = hearBetween(rnd, 72, 78);
    const core = [hearRect(50 - w / 2, top, w, bottom - top), hearPoly([[50 - w / 2, top], [50, top - 22], [50 + w / 2, top]])];
    const extra = hearExtras(rnd, level, [
      () => [hearPoly([[50 - w / 2, bottom - 14], [50 - w / 2 - 12, bottom + 4], [50 - w / 2, bottom]]), hearPoly([[50 + w / 2, bottom - 14], [50 + w / 2 + 12, bottom + 4], [50 + w / 2, bottom]])],
      () => hearCircle(50, top + 12, w * 0.24),
      () => hearPoly([[50 - w * 0.3, bottom], [50, bottom + 16], [50 + w * 0.3, bottom]]),
      () => [hearCircle(hearPick(rnd, [16, 84]), 20, 3), hearCircle(hearPick(rnd, [20, 80]), 64, 2.5)]
    ]);
    return core.concat(extra);
  },
  flower(rnd, level) {
    const cy = hearBetween(rnd, 30, 36), pr = hearBetween(rnd, 7, 9), n = level === 'easy' ? 4 : hearPick(rnd, [5, 6]);
    const core = [hearCircle(50, cy, hearBetween(rnd, 7, 9)), hearLine([[50, cy + 9], [50, 92]])];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 - Math.PI / 2;
      core.push(hearCircle(hearRound1(50 + Math.cos(a) * (pr + 9)), hearRound1(cy + Math.sin(a) * (pr + 9)), pr));
    }
    const extra = hearExtras(rnd, level, [
      () => hearPoly([[50, 72], [66, 62], [60, 74]]),
      () => hearPoly([[50, 80], [34, 70], [40, 82]]),
      () => hearLine([[6, 92], [94, 92]])
    ]);
    return core.concat(extra);
  },
  robot(rnd, level) {
    const hw = hearBetween(rnd, 26, 32), bw = hearBetween(rnd, 34, 42);
    const core = [hearRect(50 - hw / 2, 18, hw, 22), hearRect(50 - bw / 2, 44, bw, 32), hearCircle(50 - hw * 0.22, 27, 3.5), hearCircle(50 + hw * 0.22, 27, 3.5)];
    const extra = hearExtras(rnd, level, [
      () => [hearLine([[50, 18], [50, 8]]), hearCircle(50, 6, 3)],
      () => [hearLine([[50 - bw / 2, 50], [50 - bw / 2 - 14, 66]]), hearLine([[50 + bw / 2, 50], [50 + bw / 2 + 14, 66]])],
      () => [hearRect(50 - bw / 2 + 4, 76, 8, 16), hearRect(50 + bw / 2 - 12, 76, 8, 16)],
      () => hearLine([[50 - hw * 0.25, 35], [50 + hw * 0.25, 35]]),
      () => hearRect(50 - 6, 52, 12, 10)
    ]);
    return core.concat(extra);
  },
  kite(rnd, level) {
    const cx = hearBetween(rnd, 44, 56), cy = hearBetween(rnd, 30, 36), w = hearBetween(rnd, 18, 24), h = hearBetween(rnd, 24, 30);
    const core = [hearPoly([[cx, cy - h], [cx + w, cy], [cx, cy + h * 0.8], [cx - w, cy]]),
      hearLine([[cx, cy + h * 0.8], [cx - 6, cy + h * 0.8 + 12], [cx + 6, cy + h * 0.8 + 24], [cx - 4, cy + h * 0.8 + 36]])];
    const extra = hearExtras(rnd, level, [
      () => hearLine([[cx, cy - h], [cx, cy + h * 0.8]]),
      () => hearLine([[cx - w, cy], [cx + w, cy]]),
      () => hearCircle(hearPick(rnd, [14, 86]), 14, 7)
    ]);
    return core.concat(extra);
  },
  icecream(rnd, level) {
    const r = hearBetween(rnd, 15, 18), y = hearBetween(rnd, 40, 46);
    const core = [hearPoly([[50 - r, y], [50, 92], [50 + r, y]]), hearCircle(50, y - r * 0.6, r)];
    const extra = hearExtras(rnd, level, [
      () => hearCircle(50, y - r * 1.9, r * 0.8),
      () => hearCircle(50 + r * 0.4, y - r * 1.7 - (level === 'hard' ? r * 0.8 : 0), 3),
      () => hearLine([[50 - r * 0.5, y + 8], [50 + r * 0.5, y + 8]])
    ]);
    return core.concat(extra);
  },
  clock(rnd, level) {
    const R = hearBetween(rnd, 32, 40), h = hearPick(rnd, [1, 2, 3, 4, 5, 7, 8, 9, 10, 11]);
    const a = (h / 12) * Math.PI * 2 - Math.PI / 2;
    const core = [hearCircle(50, 50, R), hearLine([[50, 50], [50, 50 - R * 0.78]]), hearLine([[50, 50], [hearRound1(50 + Math.cos(a) * R * 0.5), hearRound1(50 + Math.sin(a) * R * 0.5)]])];
    const extra = hearExtras(rnd, level, [
      () => [0, 3, 6, 9].map(k => { const b = (k / 12) * Math.PI * 2 - Math.PI / 2; return hearLine([[hearRound1(50 + Math.cos(b) * R * 0.8), hearRound1(50 + Math.sin(b) * R * 0.8)], [hearRound1(50 + Math.cos(b) * R * 0.95), hearRound1(50 + Math.sin(b) * R * 0.95)]]); }),
      () => hearCircle(50, 50, 2.5),
      () => hearCircle(50, 50, R + 6)
    ]);
    return core.concat(extra);
  },
  sun(rnd, level) {
    const R = hearBetween(rnd, 16, 22), n = level === 'easy' ? 4 : 8;
    const core = [hearCircle(50, 50, R)];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      core.push(hearLine([[hearRound1(50 + Math.cos(a) * (R + 5)), hearRound1(50 + Math.sin(a) * (R + 5))], [hearRound1(50 + Math.cos(a) * (R + 18)), hearRound1(50 + Math.sin(a) * (R + 18))]]));
    }
    const extra = hearExtras(rnd, level, [
      () => [hearCircle(50 - R * 0.35, 50 - R * 0.2, 2.5), hearCircle(50 + R * 0.35, 50 - R * 0.2, 2.5)],
      () => hearLine([[50 - R * 0.4, 50 + R * 0.3], [50, 50 + R * 0.5], [50 + R * 0.4, 50 + R * 0.3]])
    ]);
    return core.concat(extra);
  },
  train(rnd, level) {
    const y = hearBetween(rnd, 50, 56);
    const core = [hearRect(10, y - 26, 26, 26), hearRect(36, y - 14, 30, 14), hearCircle(20, y + 6, 6), hearCircle(52, y + 6, 6)];
    const extra = hearExtras(rnd, level, [
      () => [hearRect(70, y - 14, 22, 14), hearCircle(81, y + 6, 6)],
      () => hearRect(44, y - 26, 7, 12),
      () => hearRect(15, y - 21, 10, 9),
      () => hearLine([[4, y + 13], [96, y + 13]])
    ]);
    return core.concat(extra);
  },
  lamp(rnd, level) {
    const top = hearBetween(rnd, 16, 22), w1 = hearBetween(rnd, 12, 16), w2 = hearBetween(rnd, 26, 32);
    const core = [hearPoly([[50 - w1, top], [50 + w1, top], [50 + w2, top + 26], [50 - w2, top + 26]]), hearLine([[50, top + 26], [50, 84]]), hearRect(50 - 18, 84, 36, 8)];
    const extra = hearExtras(rnd, level, [
      () => hearLine([[50 + w2 * 0.6, top + 26], [50 + w2 * 0.6, top + 36]]),
      () => hearRect(6, 92 - 46, 22, 46)
    ]);
    return core.concat(extra);
  },
  cup(rnd, level) {
    const w = hearBetween(rnd, 34, 42), top = hearBetween(rnd, 38, 44);
    const core = [hearPoly([[50 - w / 2, top], [50 + w / 2, top], [50 + w / 2 - 6, 84], [50 - w / 2 + 6, 84]]), hearCircle(50 + w / 2 + 6, top + 18, 9)];
    const extra = hearExtras(rnd, level, [
      () => hearEllipse(50, 88, w / 2 + 14, 5),
      () => [hearLine([[44, top - 6], [40, top - 16], [44, top - 26]]), hearLine([[56, top - 6], [52, top - 16], [56, top - 26]])],
      () => hearRect(50 - w / 2 - 12, top - 12, 10, 8)
    ]);
    return core.concat(extra);
  },
  mushroom(rnd, level) {
    const w = hearBetween(rnd, 34, 40), y = hearBetween(rnd, 48, 54);
    const core = [hearPoly([[50 - w, y], [50 - w * 0.6, y - 24], [50, y - 32], [50 + w * 0.6, y - 24], [50 + w, y]]), hearRect(50 - 9, y, 18, 92 - y)];
    const extra = hearExtras(rnd, level, [
      () => [hearCircle(50 - w * 0.45, y - 12, 4), hearCircle(50 + w * 0.35, y - 16, 5), hearCircle(50, y - 24, 3.5)],
      () => hearLine([[6, 92], [94, 92]])
    ]);
    return core.concat(extra);
  },
  balloon(rnd, level) {
    const n = level === 'easy' ? 2 : 3, out = [];
    const xs = n === 2 ? [36, 64] : [26, 50, 74];
    xs.forEach((x, i) => {
      const y = hearBetween(rnd, 24, 34) + (i % 2) * 6, r = hearBetween(rnd, 11, 14);
      out.push(hearEllipse(x, y, r, r * 1.25));
      out.push(hearLine([[x, y + r * 1.25], [50, 84]]));
    });
    const extra = hearExtras(rnd, level, [
      () => hearRect(44, 84, 12, 8)
    ]);
    return out.concat(extra);
  },
  traffic(rnd, level) {
    const w = hearBetween(rnd, 24, 28);
    const core = [hearRect(50 - w / 2, 8, w, 62), hearCircle(50, 20, 7), hearCircle(50, 39, 7), hearCircle(50, 58, 7)];
    const extra = hearExtras(rnd, level, [
      () => hearLine([[50, 70], [50, 94]]),
      () => hearLine([[30, 94], [70, 94]])
    ]);
    return core.concat(extra);
  }
};
const HEAR_THING_IDS = Object.keys(HEAR_THINGS);

/* --- shapes on a 3 x 3 board ------------------------------------------------- */
const HEAR_CELL = [18, 50, 82];   // the centres of the board's thirds

function hearShapeIn(rnd, kind, cx, cy, big) {
  const s = big ? hearBetween(rnd, 10.5, 12.5) : hearBetween(rnd, 6, 8);
  if (kind === 'circle') return hearCircle(cx, cy, s);
  if (kind === 'square') return hearRect(cx - s, cy - s, s * 2, s * 2);
  if (kind === 'wide') return hearRect(cx - s * 1.15, cy - s * 0.55, s * 2.3, s * 1.1);
  if (kind === 'tall') return hearRect(cx - s * 0.55, cy - s * 1.15, s * 1.1, s * 2.3);
  if (kind === 'tri') return hearPoly([[cx - s * 1.1, cy + s], [cx, cy - s * 1.1], [cx + s * 1.1, cy + s]]);
  if (kind === 'tridown') return hearPoly([[cx - s * 1.1, cy - s], [cx + s * 1.1, cy - s], [cx, cy + s * 1.1]]);
  if (kind === 'diamond') return hearPoly([[cx, cy - s * 1.2], [cx + s, cy], [cx, cy + s * 1.2], [cx - s, cy]]);
  if (kind === 'hline') return hearLine([[cx - s * 1.2, cy], [cx + s * 1.2, cy]]);
  if (kind === 'vline') return hearLine([[cx, cy - s * 1.2], [cx, cy + s * 1.2]]);
  if (kind === 'dline') return rnd() < 0.5 ? hearLine([[cx - s, cy - s], [cx + s, cy + s]]) : hearLine([[cx - s, cy + s], [cx + s, cy - s]]);
  return hearCircle(cx, cy, s);
}

function hearShapes(rnd, level) {
  const kinds = level === 'easy' ? ['circle', 'square', 'tri']
    : level === 'mid' ? ['circle', 'square', 'tri', 'wide', 'tall', 'hline', 'dline']
      : ['circle', 'square', 'tri', 'tridown', 'wide', 'tall', 'diamond', 'hline', 'vline', 'dline'];
  const n = level === 'easy' ? 3 : level === 'mid' ? 4 : hearPick(rnd, [5, 6]);
  const cells = [];
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) cells.push([c, r]);
  for (let i = cells.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); const t = cells[i]; cells[i] = cells[j]; cells[j] = t; }
  const out = [];
  const used = {};
  cells.slice(0, n).forEach(([c, r], i) => {
    // Every kind once before any comes again, so the board isn't three circles.
    let kind = hearPick(rnd, kinds);
    for (let k = 0; k < 6 && used[kind]; k++) kind = hearPick(rnd, kinds);
    used[kind] = true;
    const jit = level === 'hard' ? 2.5 : 1.5;
    const big = level === 'easy' ? true : rnd() < 0.55;
    out.push(hearShapeIn(rnd, kind, HEAR_CELL[c] + hearBetween(rnd, -jit, jit), HEAR_CELL[r] + hearBetween(rnd, -jit, jit), big));
    // Hard: now and then a small shape inside a big one ("a circle inside the square").
    if (level === 'hard' && big && i === 0 && (kind === 'square' || kind === 'circle')) out.push(hearShapeIn(rnd, kind === 'square' ? 'circle' : 'tri', HEAR_CELL[c], HEAR_CELL[r], false));
  });
  return out;
}

/** Rounds a picture's numbers to one decimal (a smaller message, the same on every side). */
function hearTidy(shapes) {
  return shapes.map(s => {
    const o = { k: s.k };
    Object.keys(s).forEach(key => {
      if (key === 'k') return;
      o[key] = key === 'p' ? s.p.map(pt => [hearRound1(Math.max(0, Math.min(100, pt[0]))), hearRound1(Math.max(0, Math.min(100, pt[1])))]) : hearRound1(s[key]);
    });
    return o;
  });
}

/** The box a drawing's outlines take (for placing a thing on the page). */
function hearBox(shapes) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  hearOutlines(shapes).forEach(line => line.forEach(([x, y]) => { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }));
  return { x0, y0, x1, y1 };
}

/** Moves and scales a thing so it fills most of the page, somewhere a little off the middle. */
function hearPlace(rnd, shapes) {
  const b = hearBox(shapes);
  const w = b.x1 - b.x0, h = b.y1 - b.y0;
  const k = Math.min(88 / Math.max(1, w), 88 / Math.max(1, h), hearBetween(rnd, 0.82, 1.0) * Math.min(100 / Math.max(1, w), 100 / Math.max(1, h)));
  const nw = w * k, nh = h * k;
  const ox = 6 + hearBetween(rnd, 0, Math.max(0, 88 - nw)) - b.x0 * k;
  const oy = 6 + hearBetween(rnd, 0, Math.max(0, 88 - nh)) - b.y0 * k;
  const X = (x) => ox + x * k, Y = (y) => oy + y * k;
  return shapes.map(s => {
    if (s.k === 'c') return { k: 'c', x: X(s.x), y: Y(s.y), r: s.r * k };
    if (s.k === 'e') return { k: 'e', x: X(s.x), y: Y(s.y), rx: s.rx * k, ry: s.ry * k };
    if (s.k === 'r') return { k: 'r', x: X(s.x), y: Y(s.y), w: s.w * k, h: s.h * k };
    return { k: s.k, p: s.p.map(([x, y]) => [X(x), Y(y)]) };
  });
}

/**
 * The round's picture from a seed: kind 'shapes' or 'things' ('mix' is the
 * game's: it alternates), level 'easy' | 'mid' | 'hard', and for a thing its id
 * (the server deals it through its prompt memory; absent, the seed picks one).
 * Returns { kind, thing, s: [outlines] }.
 */
function hearPicture(seed, kind, level, thing) {
  const rnd = hearRng(seed);
  const lv = HEAR_LEVELS.indexOf(level) !== -1 ? level : 'mid';
  if (kind === 'shapes') return { kind: 'shapes', thing: '', s: hearTidy(hearShapes(rnd, lv)) };
  const id = HEAR_THINGS[thing] ? thing : hearPick(rnd, HEAR_THING_IDS);
  return { kind: 'things', thing: id, s: hearTidy(hearPlace(rnd, HEAR_THINGS[id](rnd, lv))) };
}

/** The picture's name in a language: the thing's, or «أشكال على شبكة». */
function hearPictureName(pic, lang) {
  const l = lang === 'en' ? 'en' : 'ar';
  if (!pic) return '';
  if (pic.kind === 'shapes') return HEAR_SHAPES_NAME[l];
  return (HEAR_THING_NAMES[pic.thing] || {})[l] || '';
}

/* --- outlines: every shape as polylines in 0..100 ---------------------------- */
function hearOutlines(shapes) {
  const out = [];
  (shapes || []).forEach(s => {
    if (!s) return;
    if (s.k === 'c' || s.k === 'e') {
      const rx = s.k === 'c' ? s.r : s.rx, ry = s.k === 'c' ? s.r : s.ry;
      const n = Math.max(16, Math.min(64, Math.round((rx + ry) * 1.6)));
      const pts = [];
      for (let i = 0; i <= n; i++) { const a = (i / n) * Math.PI * 2; pts.push([s.x + Math.cos(a) * rx, s.y + Math.sin(a) * ry]); }
      out.push(pts);
    } else if (s.k === 'r') {
      out.push([[s.x, s.y], [s.x + s.w, s.y], [s.x + s.w, s.y + s.h], [s.x, s.y + s.h], [s.x, s.y]]);
    } else if (s.k === 'p' && Array.isArray(s.p) && s.p.length) {
      out.push(s.p.concat([s.p[0]]));
    } else if (s.k === 'l' && Array.isArray(s.p) && s.p.length >= 2) {
      out.push(s.p.slice());
    }
  });
  return out;
}

/** A picture as SVG markup (the page draws it; the server never does). o: { stroke, width, cls }. */
function hearSvg(shapes, o) {
  const opt = o || {};
  const w = opt.width || 2.2;
  const attrs = `fill="none" stroke="${opt.stroke || 'currentColor'}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"`;
  const parts = (shapes || []).map(s => {
    if (s.k === 'c') return `<circle cx="${s.x}" cy="${s.y}" r="${s.r}"/>`;
    if (s.k === 'e') return `<ellipse cx="${s.x}" cy="${s.y}" rx="${s.rx}" ry="${s.ry}"/>`;
    if (s.k === 'r') return `<rect x="${s.x}" y="${s.y}" width="${s.w}" height="${s.h}"/>`;
    if (s.k === 'p') return `<polygon points="${s.p.map(pt => pt.join(',')).join(' ')}"/>`;
    if (s.k === 'l') return `<polyline points="${s.p.map(pt => pt.join(',')).join(' ')}"/>`;
    return '';
  }).join('');
  return `<svg class="${opt.cls || ''}" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false"><g ${attrs}>${parts}</g></svg>`;
}

/* --- the judge ---------------------------------------------------------------- */
const HEAR_GRID = 64;          // cells a side
const HEAR_PIC_PEN = 0.85;     // the picture's line, in cells (its radius)
const HEAR_NEAR = 1.2;         // a cell this close (in cells) to the other's ink counts fully
const HEAR_FAR = 4.5;          // and nothing from this far (about 7% of the page)
const HEAR_INK_SLACK = 2.0;    // a drawing may use this much more ink than the picture before it is scaled down
const HEAR_BETA = 1.5;         // recall weighs this much more than precision: a part left out costs more than a shaky line
const HEAR_ORIENT_W = 0.6;    // how much a line's direction counts: along the picture's line full marks, across it this much less
const HEAR_BLOCKS = 4;         // the page in 4 x 4 parts, for where the ink is (hearLayout)
const HEAR_LAYOUT_W = 0.5;     // how much that weighs in the %
const HEAR_STROKE_GRID = 255;  // the drawing toolbox's coordinates
const HEAR_PAPER = '#ffffff';  // the eraser's colour

/** Stamps a disc of radius r (cells) along a polyline given in cells; val 1 inks, 0 erases. */
function hearStampLine(g, pts, r, val) {
  const N = HEAR_GRID;
  const rr = Math.max(0.5, r);
  const disc = (cx, cy) => {
    const x0 = Math.max(0, Math.floor(cx - rr)), x1 = Math.min(N - 1, Math.ceil(cx + rr));
    const y0 = Math.max(0, Math.floor(cy - rr)), y1 = Math.min(N - 1, Math.ceil(cy + rr));
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const dx = x + 0.5 - cx, dy = y + 0.5 - cy;
      if (dx * dx + dy * dy <= rr * rr + 0.25) g[y * N + x] = val;
    }
  };
  if (pts.length === 1) { disc(pts[0][0], pts[0][1]); return; }
  for (let i = 1; i < pts.length; i++) {
    const [ax, ay] = pts[i - 1], [bx, by] = pts[i];
    const len = Math.hypot(bx - ax, by - ay);
    const steps = Math.max(1, Math.ceil(len / 0.4));
    for (let k = 0; k <= steps; k++) disc(ax + (bx - ax) * k / steps, ay + (by - ay) * k / steps);
  }
}

/** The picture on the judge's grid. */
function hearRasterPicture(shapes) {
  const g = new Uint8Array(HEAR_GRID * HEAR_GRID);
  const k = HEAR_GRID / 100;
  hearOutlines(shapes).forEach(line => hearStampLine(g, line.map(([x, y]) => [x * k, y * k]), HEAR_PIC_PEN, 1));
  return g;
}

/** A drawing (strokes as the drawing toolbox sends them) on the judge's grid, the eraser rubbing out. */
function hearRasterStrokes(strokes) {
  const g = new Uint8Array(HEAR_GRID * HEAR_GRID);
  const k = HEAR_GRID / HEAR_STROKE_GRID;
  (strokes || []).forEach(st => {
    const p = (st && st.p) || [];
    if (p.length < 2) return;
    const erase = String(st.c || '').toLowerCase() === HEAR_PAPER;
    const r = Math.max(HEAR_PIC_PEN, ((Number(st.w) || 4) / 2) * k);
    const val = erase ? 0 : 1;
    const P = (i) => [p[i] * k, p[i + 1] * k];
    if (st.t === 'b') return;   // a fill is no line; this game's toolbox has none
    if ((st.t === 'l' || st.t === 'r' || st.t === 'o') && p.length >= 4) {
      const [x0, y0] = P(0), [x1, y1] = P(2);
      let line;
      if (st.t === 'l') line = [[x0, y0], [x1, y1]];
      else if (st.t === 'r') line = [[x0, y0], [x1, y0], [x1, y1], [x0, y1], [x0, y0]];
      else {
        const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, rx = Math.abs(x1 - x0) / 2, ry = Math.abs(y1 - y0) / 2;
        line = [];
        for (let i = 0; i <= 40; i++) { const a = (i / 40) * Math.PI * 2; line.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]); }
      }
      hearStampLine(g, line, r, val);
      return;
    }
    const line = [];
    for (let i = 0; i + 1 < p.length; i += 2) line.push(P(i));
    hearStampLine(g, line, r, val);
  });
  return g;
}

/**
 * Distance (in cells) from every cell to the nearest ink, by a two-pass chamfer
 * (1, √2), and which ink cell that is ({ d, at }).
 */
function hearDistance(g) {
  const N = HEAR_GRID, INF = 1e6, D = 1.41421356;
  const d = new Float64Array(N * N), at = new Int32Array(N * N);
  for (let i = 0; i < N * N; i++) { d[i] = g[i] ? 0 : INF; at[i] = g[i] ? i : -1; }
  const take = (i, j, step) => { if (d[j] + step < d[i]) { d[i] = d[j] + step; at[i] = at[j]; } };
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const i = y * N + x;
    if (x > 0) take(i, i - 1, 1);
    if (y > 0) {
      take(i, i - N, 1);
      if (x > 0) take(i, i - N - 1, D);
      if (x < N - 1) take(i, i - N + 1, D);
    }
  }
  for (let y = N - 1; y >= 0; y--) for (let x = N - 1; x >= 0; x--) {
    const i = y * N + x;
    if (x < N - 1) take(i, i + 1, 1);
    if (y < N - 1) {
      take(i, i + N, 1);
      if (x < N - 1) take(i, i + N + 1, D);
      if (x > 0) take(i, i + N - 1, D);
    }
  }
  return { d, at };
}

/**
 * Which way the line runs at every ink cell: the structure tensor of the ink's
 * gradients over a 5 x 5 window, as a unit vector of the doubled angle (so a
 * line and the same line drawn the other way agree). Two cells' vectors dotted
 * is cos(2 * the angle between them): 1 along, -1 across.
 */
function hearOrient(g) {
  const N = HEAR_GRID;
  const v = (x, y) => (x < 0 || y < 0 || x >= N || y >= N ? 0 : g[y * N + x]);
  const gx = new Float64Array(N * N), gy = new Float64Array(N * N);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    // Sobel on the ink.
    gx[y * N + x] = (v(x + 1, y - 1) + 2 * v(x + 1, y) + v(x + 1, y + 1)) - (v(x - 1, y - 1) + 2 * v(x - 1, y) + v(x - 1, y + 1));
    gy[y * N + x] = (v(x - 1, y + 1) + 2 * v(x, y + 1) + v(x + 1, y + 1)) - (v(x - 1, y - 1) + 2 * v(x, y - 1) + v(x + 1, y - 1));
  }
  const c = new Float64Array(N * N), sn = new Float64Array(N * N);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const i = y * N + x;
    if (!g[i]) continue;
    let jxx = 0, jyy = 0, jxy = 0;
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
      const X = x + dx, Y = y + dy;
      if (X < 0 || Y < 0 || X >= N || Y >= N) continue;
      const k = Y * N + X;
      jxx += gx[k] * gx[k]; jyy += gy[k] * gy[k]; jxy += gx[k] * gy[k];
    }
    const a = jxx - jyy, b2 = 2 * jxy, m = Math.hypot(a, b2);
    if (m > 1e-9) { c[i] = a / m; sn[i] = b2 / m; }
  }
  return { c, s: sn };
}

/** How much a cell at distance d counts: fully up to HEAR_NEAR, nothing from HEAR_FAR. */
const hearNearness = (d) => (d <= HEAR_NEAR ? 1 : d >= HEAR_FAR ? 0 : 1 - (d - HEAR_NEAR) / (HEAR_FAR - HEAR_NEAR));

/**
 * How close a drawing is to the picture, 0..100. Both on the grid; precision
 * (the drawing's ink near the picture) and recall (the picture's ink the drawing
 * came near) in their harmonic mean, times the share of ink a drawing may use
 * (HEAR_INK_SLACK times the picture's) out of the ink it did use.
 */
function hearScore(shapes, strokes) {
  const O = hearRasterPicture(shapes);
  const Dg = hearRasterStrokes(strokes);
  let nO = 0, nD = 0;
  for (let i = 0; i < O.length; i++) { nO += O[i]; nD += Dg[i]; }
  if (!nO || !nD) return 0;
  const toO = hearDistance(O), toD = hearDistance(Dg);
  const oO = hearOrient(O), oD = hearOrient(Dg);
  // How alike two cells' directions are, 0 (across) .. 1 (along); a cell with no direction (a dot) counts as alike.
  const along = (i, j, A, B) => {
    if ((!A.c[i] && !A.s[i]) || (!B.c[j] && !B.s[j])) return 1;
    return (1 + A.c[i] * B.c[j] + A.s[i] * B.s[j]) / 2;
  };
  const w = (near, sim) => near * ((1 - HEAR_ORIENT_W) + HEAR_ORIENT_W * sim);
  let p = 0, r = 0;
  for (let i = 0; i < O.length; i++) {
    if (Dg[i] && toO.at[i] >= 0) p += w(hearNearness(toO.d[i]), along(i, toO.at[i], oD, oO));
    if (O[i] && toD.at[i] >= 0) r += w(hearNearness(toD.d[i]), along(i, toD.at[i], oO, oD));
  }
  p /= nD; r /= nO;
  if (p + r <= 0) return 0;
  const b2 = HEAR_BETA * HEAR_BETA;
  const f = ((1 + b2) * p * r) / (b2 * p + r);
  const waste = Math.min(1, (HEAR_INK_SLACK * nO) / nD);
  return Math.max(0, Math.min(100, Math.round(100 * f * waste * hearLayout(O, Dg, nO, nD))));
}

/**
 * Whether the ink is where the picture's is, over the page: the share of each
 * one's ink in each of HEAR_BLOCKS x HEAR_BLOCKS parts of the page, and how much
 * of the two shares overlap (1: the same spread). Lines thrown across the whole
 * page come near a lot of the picture, but their ink is everywhere; a picture's
 * is where its shapes are. Weighed in by HEAR_LAYOUT_W.
 */
function hearLayout(O, Dg, nO, nD) {
  const N = HEAR_GRID, B = HEAR_BLOCKS, cell = N / B;
  const o = new Float64Array(B * B), d = new Float64Array(B * B);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const i = y * N + x, k = Math.floor(y / cell) * B + Math.floor(x / cell);
    if (O[i]) o[k]++;
    if (Dg[i]) d[k]++;
  }
  let same = 0;
  for (let k = 0; k < B * B; k++) same += Math.min(o[k] / nO, d[k] / nD);
  return (1 - HEAR_LAYOUT_W) + HEAR_LAYOUT_W * same;
}

/** The describer's points: one for every HEAR_DESC_STEP of the drawers' average, at most HEAR_DESC_MAX. */
const hearDescPoints = (avg) => Math.max(0, Math.min(HEAR_DESC_MAX, Math.floor((Number(avg) || 0) / HEAR_DESC_STEP)));
