/**
 * i18n completeness check.
 *
 * Three things go wrong quietly in this app:
 *   1. a key added to `ar` and forgotten in `en` (or the reverse) — the UI then
 *      falls back to printing the key name itself,
 *   2. a `data-i18n="…"` attribute in Controller.html naming a key that was
 *      never defined, which blanks the element on the first language switch,
 *   3. a `t.something` read in a renderer with no `|| 'fallback'` behind it.
 *
 * `npm run check:i18n`. Exits non-zero on 1 or 2; 3 is reported as a warning,
 * because a fallback string is a legitimate choice.
 */
const fs = require('fs');
const path = require('path');
const acorn = require('acorn');

const ROOT = path.join(__dirname, '..');
const core = fs.readFileSync(path.join(ROOT, 'JS_Core.html'), 'utf8');

// TRANSLATIONS read by a real parser: a line regex saw only the first key of a line, so
// `bank_col_br: …, bank_col_lb: …` on one line hid the second from both checks below.
const T = acorn.parseExpressionAt(core, core.indexOf('{', core.indexOf('const TRANSLATIONS')), { ecmaVersion: 'latest' });
const propName = (p) => (p.key.type === 'Identifier' ? p.key.name : String(p.key.value));

/** The top-level keys of one language block of TRANSLATIONS. */
function keysOf(lang) {
  const block = T.properties.find((p) => p.type === 'Property' && propName(p) === lang);
  if (!block || block.value.type !== 'ObjectExpression') throw new Error('no ' + lang + ' block in TRANSLATIONS');
  // Counted, not just collected: a key defined twice is legal JS and the last
  // one silently wins, so a string can quietly become one nobody wrote there.
  const counts = new Map();
  for (const p of block.value.properties) {
    if (p.type !== 'Property' || p.computed) throw new Error(lang + ': a spread or computed key in TRANSLATIONS can\'t be checked');
    const k = propName(p);
    counts.set(k, (counts.get(k) || 0) + 1);
  }
  const keys = new Set(counts.keys());
  keys.duplicates = [...counts].filter(([, n]) => n > 1).map(([k, n]) => `${k} ×${n}`);
  return keys;
}

const ar = keysOf('ar');
const en = keysOf('en');

let errors = 0;

for (const [lang, set] of [['ar', ar], ['en', en]]) {
  if (set.duplicates.length) {
    errors++;
    console.log('%s defines %d key(s) twice: %s', lang, set.duplicates.length, set.duplicates.join(', '));
  }
}

const onlyAr = [...ar].filter(k => !en.has(k));
const onlyEn = [...en].filter(k => !ar.has(k));
if (onlyAr.length) { errors++; console.log('missing from en (%d): %s', onlyAr.length, onlyAr.join(', ')); }
if (onlyEn.length) { errors++; console.log('missing from ar (%d): %s', onlyEn.length, onlyEn.join(', ')); }

// --- 2. every data-i18n attribute must name a real key ---------------------
// Every attribute applyTranslations reads (-title fills a tooltip and aria-label),
// in the page and in the markup the JS files build. A key built at runtime
// ("${...}") can't be checked here and is skipped.
const markupFiles = ['Controller.html'].concat(fs.readdirSync(ROOT).filter(f => /^JS_.*\.html$/.test(f)));
const attrKeys = new Set();
let m;
const attrRe = /data-i18n(?:-ph|-aria|-title)?="([^"$]+)"/g;
for (const f of markupFiles) {
  const markup = fs.readFileSync(path.join(ROOT, f), 'utf8');
  while ((m = attrRe.exec(markup))) attrKeys.add(m[1]);
}
const unknownAttrs = [...attrKeys].filter(k => !ar.has(k) || !en.has(k));
if (unknownAttrs.length) {
  errors++;
  console.log('data-i18n keys with no translation (%d): %s',
              unknownAttrs.length, unknownAttrs.join(', '));
}

// --- 3. t.key reads with no fallback --------------------------------------
const files = fs.readdirSync(ROOT).filter(f => /^JS_.*\.html$/.test(f));
const bare = new Map();
for (const f of files) {
  const src = fs.readFileSync(path.join(ROOT, f), 'utf8');
  const re = /\bt\.([A-Za-z_][A-Za-z0-9_]*)(\s*\|\|)?/g;
  let hit;
  while ((hit = re.exec(src))) {
    const key = hit[1];
    if (hit[2]) continue;                 // has a fallback
    if (ar.has(key) && en.has(key)) continue;
    if (!bare.has(key)) bare.set(key, f);
  }
}
if (bare.size) {
  console.log('warning: %d unfallback-ed t.<key> reads with no translation:', bare.size);
  for (const [k, f] of bare) console.log('  %s  (%s)', k, f);
}

// --- 4. keys defined but never used ---------------------------------------
// Dead strings are harmless but they read as live ones, so a translator keeps
// them in step for nothing — and one of them (sync_cloud) named a button that
// does not exist.
let hay = '';
for (const f of fs.readdirSync(ROOT)) {
  if (/\.(html|js)$/.test(f) && f !== 'Tailwind.html') hay += fs.readFileSync(path.join(ROOT, f), 'utf8');
}
const unused = [...ar].filter(k => ![
  `data-i18n="${k}"`, `data-i18n-ph="${k}"`, `data-i18n-aria="${k}"`,
  `t.${k}`, `].${k}`, `'${k}'`, `"${k}"`
].some(r => hay.includes(r)));
if (unused.length) {
  console.log('warning: %d key(s) defined but never referenced: %s', unused.length, unused.join(', '));
}

console.log('ar %d keys, en %d keys, %d data-i18n attributes',
            ar.size, en.size, attrKeys.size);
console.log(errors ? 'FAILED' : 'i18n OK');

// --- 5. every var(--x) the page reads is defined somewhere --------------
// Its own file (node check-css-vars.js), run from here so `npm run check` runs it.
const css = require('child_process').spawnSync(process.execPath, [path.join(__dirname, 'check-css-vars.js')], { stdio: 'inherit' });
process.exit(errors || css.status !== 0 ? 1 : 0);
