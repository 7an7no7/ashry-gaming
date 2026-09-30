// Errors on players' phones (the page's reporter in JS_Core.html, POST /err on the
// rooms server, the "errors" log).
//   ASHRY_ADMIN_KEY=... npm run errors [-- <rooms address>] [--build=20260930123310] [--clear]
// Prints them by build, newest build first, and in each build by how often they
// happened: the count, the screen, the message and where in the page, the devices,
// and when it was first and last seen. --clear empties the log (after fixing).
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const key = process.env.ASHRY_ADMIN_KEY;
if (!key) { console.error('Error: ASHRY_ADMIN_KEY environment variable is not set.'); process.exit(1); }
const args = process.argv.slice(2);
const onlyBuild = (args.find((a) => a.startsWith('--build=')) || '').slice(8);
let address = args.find((a) => !a.startsWith('--'))
  || JSON.parse(readFileSync(path.join(here, 'site.config.json'), 'utf8')).roomsUrl;
address = address.replace(/\/+$/, '');
const auth = { Authorization: `Bearer ${key}` };

if (args.includes('--clear')) {
  const res = await fetch(`${address}/errors`, { method: 'DELETE', headers: auth });
  console.log(res.ok ? 'The errors log is empty now.' : `Request failed: ${res.status}`);
  process.exit(res.ok ? 0 : 1);
}

const res = await fetch(`${address}/errors`, { headers: auth });
if (!res.ok) { console.error(`Request failed: ${res.status}`); process.exit(1); }
const list = await res.json();
if (!Array.isArray(list) || !list.length) { console.log('No errors reported.'); process.exit(0); }

// A build id is the build's time (20260930123310), so the newest sorts last as text.
const when = (ms) => (ms ? new Date(ms).toISOString().replace('T', ' ').slice(0, 16) : '?');
const builds = new Map();
for (const e of list) {
  if (onlyBuild && e.lang !== onlyBuild) continue;
  if (!builds.has(e.lang)) builds.set(e.lang, []);
  builds.get(e.lang).push(e);
}
for (const build of [...builds.keys()].sort().reverse()) {
  const rows = builds.get(build).sort((a, b) => b.n - a.n);
  const total = rows.reduce((s, r) => s + r.n, 0);
  console.log(`\n== build ${build} (${total} in ${rows.length} kinds) ==`);
  for (const r of rows) {
    const devices = Object.entries(r.tags || {}).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(', ');
    console.log(`${String(r.n).padStart(5)}  [${r.cat}] ${r.word}`);
    console.log(`       ${devices || '?'} · first ${when(r.first)} · last ${when(r.last)}`);
  }
}
