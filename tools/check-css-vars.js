/**
 * Every CSS custom property read is defined somewhere: `node check-css-vars.js`,
 * and part of `npm run check` (check-i18n.js runs it at its end).
 *
 * A `var(--x)` with no `--x` anywhere is silently nothing - the property it
 * sits in falls back to its initial value - and no other check sees it (the
 * first-play card's `--sp-3-5`, a step the spacing scale doesn't have, left its
 * text touching the edge). This reads every `var(--name)` in Style*.html,
 * Controller.html and the JS_*.html files, and fails on a name that is defined
 * nowhere in the page's sources: not in a stylesheet or an inline style
 * (`--name:`), and not set from a script (`setProperty('--name', …)`, or a
 * quoted '--name' handed to a helper that sets it).
 *
 * A `var(--name, fallback)` is counted too: a fallback is a choice, but a name
 * that exists nowhere is still a typo for the token that was meant. A name
 * built at runtime (`var(--pc-${suit})`) can't be checked and is skipped.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const { srcPath, srcFiles } = require('./sources.cjs');
const pageFiles = srcFiles(/^(JS_.*|Style(_\w+)?|Controller|Tailwind|Logo)\.html$/);
// The shared lists and rule files are in the page too, and may set a property for it.
const allFiles = pageFiles.concat(srcFiles(/^[A-Z][A-Za-z0-9]*\.js$/));
const READ_FROM = pageFiles.filter((f) => f !== 'Tailwind.html' && f !== 'Logo.html');

// Names read but declared nowhere, each with the reason it is let through. Keep it empty:
// an entry that is now defined or no longer read is reported, so it can be taken out.
const ALLOWED = new Map([]);

const defined = new Set();
const used = new Map(); // name -> first "file:line"
for (const f of allFiles) {
  const src = fs.readFileSync(srcPath(f), 'utf8');
  for (const m of src.matchAll(/(--[A-Za-z0-9_-]+)\s*:/g)) defined.add(m[1]);
  for (const m of src.matchAll(/['"`](--[A-Za-z0-9_-]+)['"`]/g)) defined.add(m[1]);
  if (!READ_FROM.includes(f)) continue;
  for (const m of src.matchAll(/var\(\s*(--[A-Za-z0-9_-]+)(?![A-Za-z0-9_$\-{])/g)) {
    if (used.has(m[1])) continue;
    used.set(m[1], `${f}:${src.slice(0, m.index).split('\n').length}`);
  }
}

const missing = [...used].filter(([name]) => !defined.has(name) && !ALLOWED.has(name));
for (const name of ALLOWED.keys()) {
  if (defined.has(name) || !used.has(name)) console.log(`warning: ${name} is allowed but no longer needs to be (take it out of ALLOWED)`);
}
for (const [name, where] of missing) console.log(`var(${name}) is read but defined nowhere (first at ${where})`);
console.log(`${used.size} custom properties read, ${defined.size} defined`);
console.log(missing.length ? 'FAILED' : 'css vars OK');
process.exit(missing.length ? 1 : 0);
