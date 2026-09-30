// Proves the split of GEMINI.md (30 Sep 2026) lost nothing.
//
//   node tools/prove-docs-split.mjs [ref]     (ref: the commit with the whole GEMINI.md, default 57c8f60, master when it was split)
//
// Every non-empty line of the old GEMINI.md (whitespace normalised) must appear,
// as many times as it appeared there, across the new GEMINI.md and the files that
// say "Moved from GEMINI.md on 30 Sep 2026" - no more and no fewer, so a line was
// moved to exactly one place. Lines that exist only in the new files are the new
// index, headings and pointers, and are listed by file.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ref = process.argv[2] || '57c8f60';
const oldText = execFileSync('git', ['show', `${ref}:GEMINI.md`], { cwd: root, encoding: 'utf8', maxBuffer: 64 << 20 });
const norm = (l) => l.replace(/\s+/g, ' ').trim();
const count = (lines) => { const m = new Map(); for (const l of lines) { const k = norm(l); if (k) m.set(k, (m.get(k) || 0) + 1); } return m; };

const files = ['GEMINI.md'];
const walk = (dir) => { for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
  const p = path.join(dir, e.name);
  if (e.isDirectory()) walk(p);
  else if (p.endsWith('.md') && fs.readFileSync(p, 'utf8').includes('Moved from GEMINI.md on 30 Sep 2026')) files.push(path.relative(root, p).replace(/\\/g, '/'));
} };
walk(path.join(root, 'notes'));

const oldCount = count(oldText.split('\n'));
const perFile = files.map((f) => [f, count(fs.readFileSync(path.join(root, f), 'utf8').split('\n'))]);
const newCount = new Map();
for (const [, m] of perFile) for (const [k, n] of m) newCount.set(k, (newCount.get(k) || 0) + n);

let oldLines = 0, missing = [], extra = [];
for (const [k, n] of oldCount) {
  oldLines += n;
  const got = newCount.get(k) || 0;
  if (got < n) missing.push([k, n, got]);
  if (got > n) extra.push([k, n, got]);
}
const added = {};
for (const [f, m] of perFile) for (const [k, n] of m) if (!oldCount.has(k)) (added[f] ||= 0), added[f] += n;

console.log(`old GEMINI.md at ${ref}: ${oldLines} non-empty lines (${oldCount.size} distinct)`);
console.log(`new files checked: ${files.length} (GEMINI.md + ${files.length - 1} moved files)`);
console.log(`missing (in the old file more times than in the new files): ${missing.length}`);
for (const [k, n, g] of missing.slice(0, 20)) console.log(`  ${n} -> ${g}: ${k.slice(0, 100)}`);
console.log(`duplicated (in the new files more times than in the old one): ${extra.length}`);
for (const [k, n, g] of extra.slice(0, 20)) console.log(`  ${n} -> ${g}: ${k.slice(0, 100)}`);
console.log('lines that are new (index, titles, pointers, the one-line decisions):');
for (const [f, n] of Object.entries(added)) console.log(`  ${String(n).padStart(4)}  ${f}`);
if (missing.length || extra.length) { console.log('FAIL'); process.exit(1); }
console.log('OK: every line of the old GEMINI.md is in exactly one place.');
