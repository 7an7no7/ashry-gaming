/* خمّن الدولة's map (JS_FlagsMap.html): bakes the hand-drawn outlines of tools/flags-world.mjs.
   node make-flags-map.mjs - lists every country whose middle (Countries.js) is not on its own
   continent's land (small islands are expected: their pins stand in the sea), then writes FMAP_LAND
   and FMAP_SEA into JS_FlagsMap.html: x = (lon + 180) * 2, y = (84 - lat) * 2, whole numbers in a
   720 x 284 box, relative path commands. Edit the rings in flags-world.mjs, never the baked paths. */
import fs from 'node:fs';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { LAND, SEAS } from './flags-world.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const ctx = {};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(root + 'Countries.js', 'utf8') + '\nthis.COUNTRIES = COUNTRIES;', ctx);

const P = ([lon, lat]) => [Math.round((lon + 180) * 2), Math.round((84 - lat) * 2)];
const path = (rings) => rings.map((ring) => {
  const pts = ring.map(P).filter((p, i, a) => i === 0 || p[0] !== a[i - 1][0] || p[1] !== a[i - 1][1]);
  let s = 'M' + pts[0].join(' ');
  for (let i = 1; i < pts.length; i++) {
    const dx = pts[i][0] - pts[i - 1][0], dy = pts[i][1] - pts[i - 1][1];
    s += (i === 1 ? 'l' : ' ') + dx + (dy < 0 ? '' : ' ') + dy;
  }
  return s + 'z';
}).join('');

const inside = (pt, ring) => {
  let c = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j];
    if ((yi > pt[1]) !== (yj > pt[1]) && pt[0] < (xj - xi) * (pt[1] - yi) / (yj - yi) + xi) c = !c;
  }
  return c;
};
for (const c of ctx.COUNTRIES) {
  const pt = [c.lon, c.lat];
  const own = (LAND[c.cont] || []).some((r) => inside(pt, r));
  const other = Object.keys(LAND).filter((k) => k !== c.cont && LAND[k].some((r) => inside(pt, r)));
  if (!own || other.length) console.log(`${c.code} ${c.en}${own ? '' : ' (not on its land)'}${other.length ? ' (on ' + other + ')' : ''}`);
}

const file = root + 'JS_FlagsMap.html';
const land = '{\n' + Object.keys(LAND).map((k) => `  ${k}: '${path(LAND[k])}'`).join(',\n') + '\n}';
const src = fs.readFileSync(file, 'utf8');
const out = src.replace(/const FMAP_LAND = [\s\S]*?;\nconst FMAP_SEA = [^\n]*;/, () => `const FMAP_LAND = ${land};\nconst FMAP_SEA = '${path(SEAS)}';`);
fs.writeFileSync(file, out);
console.log(out === src ? 'JS_FlagsMap.html: the map is already this one' : 'JS_FlagsMap.html: the map baked again');
