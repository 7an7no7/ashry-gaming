// «في غلطة؟» reports (notes/IMPROVEMENT_PLAN.md, Phase 3).
//   ASHRY_ADMIN_KEY=... npm run reports [-- <rooms address>]
// Prints every reported item by game, most-reported first. Fix them in the
// bank by hand (npm run check afterwards).
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const key = process.env.ASHRY_ADMIN_KEY;
if (!key) { console.error('Error: ASHRY_ADMIN_KEY environment variable is not set.'); process.exit(1); }
let address = process.argv[2] || JSON.parse(readFileSync(path.join(here, 'site.config.json'), 'utf8')).roomsUrl;
address = address.replace(/\/+$/, '');

const res = await fetch(`${address}/reports`, { headers: { Authorization: `Bearer ${key}` } });
if (!res.ok) { console.error(`Request failed: ${res.status}`); process.exit(1); }
const list = await res.json();
if (!list.length) { console.log('No reports.'); process.exit(0); }
const byGame = new Map();
for (const r of list) {
  if (!byGame.has(r.cat)) byGame.set(r.cat, []);
  byGame.get(r.cat).push(r);
}
for (const [game, rows] of byGame) {
  console.log(`\n== ${game} ==`);
  rows.sort((a, b) => b.n - a.n).forEach((r) => console.log(`  ${String(r.n).padStart(3)}  [${r.lang}] ${r.word}`));
}
