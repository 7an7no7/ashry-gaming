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

const ROOT = path.join(__dirname, '..');
const core = fs.readFileSync(path.join(ROOT, 'JS_Core.html'), 'utf8');

/** Pulls the top-level keys out of one language block of TRANSLATIONS. */
function keysOf(lang) {
  const start = core.indexOf('const TRANSLATIONS');
  const at = core.indexOf('\n    ' + lang + ': {', start);
  if (at === -1) throw new Error('no ' + lang + ' block in TRANSLATIONS');

  // Walk braces from the opening one so nested objects don't end the block early.
  let i = core.indexOf('{', at);
  let depth = 0;
  let end = i;
  for (; i < core.length; i++) {
    const c = core[i];
    if (c === '{') depth++;
    else if (c === '}') { depth--; if (depth === 0) { end = i; break; } }
  }
  const body = core.slice(core.indexOf('{', at) + 1, end);
  // Counted, not just collected: a key defined twice is legal JS and the last
  // one silently wins, so a string can quietly become one nobody wrote there.
  const counts = new Map();
  const re = /(?:^|\n)\s{6}([A-Za-z_][A-Za-z0-9_]*)\s*:/g;
  let m;
  while ((m = re.exec(body))) counts.set(m[1], (counts.get(m[1]) || 0) + 1);
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
const markup = fs.readFileSync(path.join(ROOT, 'Controller.html'), 'utf8');
const attrKeys = new Set();
let m;
const attrRe = /data-i18n(?:-ph|-aria)?="([^"]+)"/g;
while ((m = attrRe.exec(markup))) attrKeys.add(m[1]);
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
process.exit(errors ? 1 : 0);
