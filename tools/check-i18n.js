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
const { srcPath, srcFiles } = require('./sources.cjs');

const ROOT = path.join(__dirname, '..');
// With every game's own words put in (games/<id>/<id>.text.js, tools/game-text.cjs).
const core = require('./game-text.cjs').readMerged('JS_Translations.html');

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

// GAME_RULES the same way (the Help rules, with every game's text file put in): a rule
// written twice - in two games' files, or a file and JS_GameRules.html - silently shows
// the later one, and a rule only in ar leaves English with none.
const rulesSrc = require('./game-text.cjs').readMerged('JS_GameRules.html');
const R = acorn.parseExpressionAt(rulesSrc, rulesSrc.indexOf('{', rulesSrc.indexOf('const GAME_RULES')), { ecmaVersion: 'latest' });
function ruleKeysOf(lang) {
  const block = R.properties.find((p) => p.type === 'Property' && propName(p) === lang);
  if (!block || block.value.type !== 'ObjectExpression') throw new Error('no ' + lang + ' block in GAME_RULES');
  const counts = new Map();
  for (const p of block.value.properties) {
    if (p.type !== 'Property' || p.computed) throw new Error(lang + ': a spread or computed key in GAME_RULES can\'t be checked');
    counts.set(propName(p), (counts.get(propName(p)) || 0) + 1);
  }
  return counts;
}
const rulesAr = ruleKeysOf('ar');
const rulesEn = ruleKeysOf('en');
for (const [lang, counts] of [['ar', rulesAr], ['en', rulesEn]]) {
  const twice = [...counts].filter(([, n]) => n > 1).map(([k, n]) => `${k} ×${n}`);
  if (twice.length) { errors++; console.log('GAME_RULES.%s defines %d rule(s) twice: %s', lang, twice.length, twice.join(', ')); }
}
const rulesOnlyAr = [...rulesAr.keys()].filter((k) => !rulesEn.has(k));
const rulesOnlyEn = [...rulesEn.keys()].filter((k) => !rulesAr.has(k));
if (rulesOnlyAr.length) { errors++; console.log('GAME_RULES missing from en (%d): %s', rulesOnlyAr.length, rulesOnlyAr.join(', ')); }
if (rulesOnlyEn.length) { errors++; console.log('GAME_RULES missing from ar (%d): %s', rulesOnlyEn.length, rulesOnlyEn.join(', ')); }

// --- 2. every data-i18n attribute must name a real key ---------------------
// Every attribute applyTranslations reads (-title fills a tooltip and aria-label),
// in the page and in the markup the JS files build. A key built at runtime
// ("${...}") can't be checked here and is skipped.
const markupFiles = ['Controller.html'].concat(srcFiles(/^JS_.*\.html$/));
const attrKeys = new Set();
let m;
const attrRe = /data-i18n(?:-ph|-aria|-title)?="([^"$]+)"/g;
for (const f of markupFiles) {
  const markup = fs.readFileSync(srcPath(f), 'utf8');
  while ((m = attrRe.exec(markup))) attrKeys.add(m[1]);
}
const unknownAttrs = [...attrKeys].filter(k => !ar.has(k) || !en.has(k));
if (unknownAttrs.length) {
  errors++;
  console.log('data-i18n keys with no translation (%d): %s',
              unknownAttrs.length, unknownAttrs.join(', '));
}

// --- 3. t.key reads with no fallback --------------------------------------
// Read with a parser, not a regex: `t` is also a texture, a touch, a tile or a
// number in places (forEach(t => t.dispose())), and a comment can say "t.xo_*".
// A read counts when the nearest `t` it refers to is a translation table: a
// variable made from TRANSLATIONS or a game's own helper (crewT(), xoTr(),
// tbText()), or a parameter of a function that isn't a callback. A key passes if
// TRANSLATIONS has it, or the file's own { ar: {…}, en: {…} } block does.
const walk = require('acorn-walk');
const isFn = (n) => /Function/.test(n.type);
const declares = (decl, name) => decl && decl.type === 'VariableDeclaration' &&
  decl.declarations.find((d) => d.id.type === 'Identifier' && d.id.name === name);
const paramNamed = (fn, name) => fn.params.some((p) => (p.type === 'Identifier' && p.name === name) ||
  (p.type === 'AssignmentPattern' && p.left.type === 'Identifier' && p.left.name === name));
const tableInit = (init, src) => !!init && (/TRANSLATIONS/.test(src.slice(init.start, init.end)) ||
  (init.type === 'CallExpression' && init.callee.type === 'Identifier' && /(T|Tr|Text)$/.test(init.callee.name)));

/** Whether the `t` read at the end of `anc` is a translation table. */
function tIsTable(anc, src) {
  for (let i = anc.length - 2; i >= 0; i--) {
    const a = anc[i];
    if (isFn(a) && paramNamed(a, 't')) {
      const outer = anc[i - 1];
      return !(outer && /CallExpression|NewExpression/.test(outer.type) && outer.arguments.includes(a));
    }
    if (a.type === 'CatchClause' && a.param && a.param.name === 't') return false;
    if (/^For(Of|In)?Statement$/.test(a.type) && declares(a.left || a.init, 't')) return false;
    const body = a.type === 'BlockStatement' || a.type === 'Program' ? a.body : a.type === 'SwitchCase' ? a.consequent : null;
    if (body) for (const s of body) { const d = declares(s, 't'); if (d) return tableInit(d.init, src); }
  }
  return true;   // no binding found: read as the translations, as before
}

const files = srcFiles(/^JS_.*\.html$/);
const bare = new Map();
for (const f of files) {
  const html = fs.readFileSync(srcPath(f), 'utf8');
  for (const [, src] of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)) {
    let ast;
    try { ast = acorn.parse(src, { ecmaVersion: 'latest' }); }
    catch (e) { errors++; console.log('%s: a script does not parse (%s)', f, e.message); continue; }
    const local = new Set();
    walk.simple(ast, { Property(p) {
      const k = !p.computed && propName(p);
      if ((k === 'ar' || k === 'en') && p.value.type === 'ObjectExpression') {
        for (const q of p.value.properties) if (q.type === 'Property' && !q.computed) local.add(propName(q));
      }
    } });
    walk.ancestor(ast, { MemberExpression(n, _, anc) {
      if (n.computed || n.object.type !== 'Identifier' || n.object.name !== 't') return;
      const key = n.property.name;
      const parent = anc[anc.length - 2];
      if (parent && parent.type === 'LogicalExpression' && /\|\||\?\?/.test(parent.operator) && parent.left === n) return;
      if ((ar.has(key) && en.has(key)) || local.has(key)) return;
      if (!tIsTable(anc, src)) return;
      if (!bare.has(key)) bare.set(key, f);
    } });
  }
}
if (bare.size) {
  console.log('warning: %d unfallback-ed t.<key> reads with no translation:', bare.size);
  for (const [k, f] of bare) console.log('  %s  (%s)', k, f);
}

// --- 4. keys defined but never used ---------------------------------------
// Dead strings are harmless but they read as live ones, so a translator keeps
// them in step for nothing — and one of them (sync_cloud) named a button that
// does not exist. Many keys are built from parts ('mg_h_' + id, `ch_piece_${p}`,
// key + '_line'): a key whose prefix or suffix the code builds with is live.
let hay = '';
for (const f of srcFiles()) {
  if (/\.(html|js)$/.test(f) && f !== 'Tailwind.html' && f !== 'JS_Translations.html' && !/\.text\.js$/.test(f)) hay += fs.readFileSync(srcPath(f), 'utf8');
}
const prefixes = new Set(), suffixes = new Set();
for (const [, p] of hay.matchAll(/['"`]([a-z][a-z0-9]*(?:_[a-z0-9]+)*_?)['"]\s*\+/g)) prefixes.add(p);
for (const [, p] of hay.matchAll(/[`}]([a-z][a-z0-9]*(?:_[a-z0-9]+)*_?)\$\{/g)) prefixes.add(p);
for (const [, s] of hay.matchAll(/\+\s*['"](_[a-z0-9_]+)['"]/g)) suffixes.add(s);
for (const [, s] of hay.matchAll(/\}(_[a-z0-9_]+)[`'"]/g)) suffixes.add(s);
// Read as a member anywhere (t.k, exT().k, (TRANSLATIONS[lang] || {}).k), or named in a string.
const members = new Set([...hay.matchAll(/\.([A-Za-z_][A-Za-z0-9_]*)/g)].map((m) => m[1]));
const strings = new Set([...hay.matchAll(/(['"`])([A-Za-z_][A-Za-z0-9_]*)\1/g)].map((m) => m[2]));
const literal = (k) => members.has(k) || strings.has(k);
const built = (k) => [...prefixes].some((p) => k.startsWith(p) && k.length > p.length && (p.endsWith('_') || (p.length >= 5 && /^([0-9_]|[a-z0-9]{1,2}$)/.test(k.slice(p.length)))));
const live = (k) => literal(k) || built(k) ||
  [...suffixes].some((s) => k.endsWith(s) && k.length > s.length && (literal(k.slice(0, -s.length)) || built(k.slice(0, -s.length))));
const unused = [...ar].filter(k => !live(k));
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
