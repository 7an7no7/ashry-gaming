// How often each game is played (notes/IMPROVEMENT_PLAN.md, Phase 0).
//   ASHRY_ADMIN_KEY=... npm run plays [-- <rooms address>] [--month=2026-09]
// Prints every game by how often it was started, split into one phone,
// a room and a room with a TV, for every month or the one asked for.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const key = process.env.ASHRY_ADMIN_KEY;
if (!key) { console.error('Error: ASHRY_ADMIN_KEY environment variable is not set.'); process.exit(1); }
const args = process.argv.slice(2);
const month = (args.find((a) => a.startsWith('--month=')) || '').slice(8);
let address = args.find((a) => !a.startsWith('--'))
  || JSON.parse(readFileSync(path.join(here, 'site.config.json'), 'utf8')).roomsUrl;
address = address.replace(/\/+$/, '');

const res = await fetch(`${address}/plays`, { headers: { Authorization: `Bearer ${key}` } });
if (!res.ok) { console.error(`Request failed: ${res.status}`); process.exit(1); }
const list = await res.json();
const games = new Map();
for (const { lang: mode, cat: m, word: game, n } of list) {
  if (month && m !== month) continue;
  const g = games.get(game) || { device: 0, room: 0, tv: 0, all: 0 };
  g[mode] = (g[mode] || 0) + n;
  g.all += n;
  games.set(game, g);
}
const rows = [...games].sort((a, b) => b[1].all - a[1].all);
if (!rows.length) { console.log('Nothing counted yet.'); process.exit(0); }
console.log(`${'game'.padEnd(18)} ${'all'.padStart(6)} ${'phone'.padStart(6)} ${'room'.padStart(6)} ${'tv'.padStart(6)}`);
for (const [game, g] of rows) {
  console.log(`${game.padEnd(18)} ${String(g.all).padStart(6)} ${String(g.device).padStart(6)} ${String(g.room).padStart(6)} ${String(g.tv).padStart(6)}`);
}
