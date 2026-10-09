// العرّاف's misses: what players were thinking of when the oracle lost («كنت بتفكر في مين؟»).
//   ASHRY_ADMIN_KEY=... npm run oracle:misses [-- <rooms address>] [-- --answers] [-- --clear]
// Prints every name typed, most-sent first, folded together when they are one name written two
// ways, with the oracle's guesses; --answers adds each game's answers, question by question.
// Add the ones worth adding as entries (notes/games/oracle.md, "Writing entries"), run
// `npm run check:oracle`, then --clear empties the list once read.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { loadOracle, loadFold } = require('./oracle-data.cjs');

const here = path.dirname(fileURLToPath(import.meta.url));
const key = process.env.ASHRY_ADMIN_KEY;
if (!key) { console.error('Error: ASHRY_ADMIN_KEY environment variable is not set.'); process.exit(1); }
const args = process.argv.slice(2);
const withAnswers = args.includes('--answers');
const clear = args.includes('--clear');
let address = args.find((a) => !a.startsWith('--')) || JSON.parse(readFileSync(path.join(here, 'site.config.json'), 'utf8')).roomsUrl;
address = address.replace(/\/+$/, '');

if (clear) {
  const res = await fetch(`${address}/oracle-misses`, { method: 'DELETE', headers: { Authorization: `Bearer ${key}` } });
  console.log(res.ok ? 'Emptied.' : `Request failed: ${res.status}`);
  process.exit(res.ok ? 0 : 1);
}
const res = await fetch(`${address}/oracle-misses`, { headers: { Authorization: `Bearer ${key}` } });
if (!res.ok) { console.error(`Request failed: ${res.status}`); process.exit(1); }
const list = await res.json();
if (!list.length) { console.log('No misses.'); process.exit(0); }

const O = loadOracle();
const data = O.oracleData();
const fold = loadFold();
const known = new Map();
data.entries.forEach((e) => { known.set(fold(e.ar), e.id); known.set(fold(e.en), e.id); });
const ANS = { y: 'أيوه', py: 'غالباً أيوه', dk: 'مش عارف', pn: 'غالباً لأ', n: 'لأ' };

// One name written two ways is one row.
const byName = new Map();
for (const r of list) {
  const k = fold(r.cat) || r.cat;
  if (!byName.has(k)) byName.set(k, { names: new Set(), n: 0, games: [] });
  const row = byName.get(k);
  row.names.add(r.cat);
  row.n += r.n;
  row.games.push(r);
}
const rows = [...byName.entries()].sort((a, b) => b[1].n - a[1].n);
console.log(`${list.length} games lost, ${rows.length} names:\n`);
for (const [k, row] of rows) {
  const have = known.get(k);
  console.log(`${String(row.n).padStart(3)}  ${[...row.names].join(' / ')}${have ? `   (already an entry: ${have} - check its traits)` : ''}`);
  for (const g of row.games) {
    const [answers, guesses] = String(g.word).split('|').map((s) => s.trim());
    console.log(`       [${g.lang}] guessed: ${guesses || '-'}`);
    if (withAnswers) {
      (answers || '').split(/\s+/).filter(Boolean).forEach((a) => {
        const [qid, ans] = a.split(':');
        const q = data.questions[data.qIndex[qid]];
        console.log(`          ${q ? q.ar : qid}  ${ANS[ans] || ans}`);
      });
    }
  }
}
