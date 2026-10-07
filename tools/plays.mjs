// How often each game is played (notes/archive/plans/IMPROVEMENT_PLAN.md, Phase 0).
//   ASHRY_ADMIN_KEY=... npm run plays [-- <rooms address>] [--month=2026-09] [--json | --markdown]
// Prints every game by how often it was started, split into one phone,
// a room and a room with a TV, for every month or the one asked for.
//
// --json and --markdown (the monthly look on GitHub, .github/workflows/monthly-plays.yml,
// 7 Oct 2026): every game of GAME_LIST (Games.js) with its starts, by its card's id - a room
// counts a game by its room id (شطرنج is 'chess' in a room, and 'chess' on one phone is the
// chess clock) - with its name, whether it was ever started in any month, the ten least
// started and the games never started; --markdown is that as the body of a GitHub issue.
// --input=plays.json reads the server's list from a file instead (no key needed): for trying
// the report out.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import srcMod from './sources.cjs';
const { srcPath } = srcMod;

const here = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const opt = (name) => (args.find((a) => a.startsWith(`--${name}=`)) || '').slice(name.length + 3);
const month = opt('month');
const input = opt('input');
const JSON_OUT = args.includes('--json');
const MD_OUT = args.includes('--markdown');

let list;
if (input) {
  list = JSON.parse(readFileSync(input, 'utf8'));
} else {
  const key = process.env.ASHRY_ADMIN_KEY;
  if (!key) { console.error('Error: ASHRY_ADMIN_KEY environment variable is not set.'); process.exit(1); }
  let address = args.find((a) => !a.startsWith('--'))
    || JSON.parse(readFileSync(path.join(here, 'site.config.json'), 'utf8')).roomsUrl;
  address = address.replace(/\/+$/, '');
  const res = await fetch(`${address}/plays`, { headers: { Authorization: `Bearer ${key}` } });
  if (!res.ok) { console.error(`Request failed: ${res.status}`); process.exit(1); }
  list = await res.json();
}
if (!Array.isArray(list)) list = [];

if (!JSON_OUT && !MD_OUT) {
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
  process.exit(0);
}

/* --- the report: every game in the app, by its card --------------------------------------- */
const GAME_LIST = new Function(readFileSync(srcPath('Games.js'), 'utf8') + '\nreturn GAME_LIST;')();
// The games' names, as make-og.mjs reads them (every game's own words merged in).
const { default: gameText } = await import('./game-text.cjs');
const words = gameText.readMerged('JS_Translations.html');
const at = words.indexOf('const TRANSLATIONS = {');
const T = new Function(`return (${words.slice(words.indexOf('{', at), words.indexOf('\n  };', at) + 4)});`)();
const nameOf = (g, lang) => (T[lang] && T[lang][g.title]) || g.id;

const byCard = new Map(GAME_LIST.map((g) => [g.id, g]));
const byRoomId = new Map(GAME_LIST.filter((g) => g.room).map((g) => [g.room.id || g.id, g]));
const cardOf = (mode, word) => (mode === 'device' ? byCard.get(word) : byRoomId.get(word)) || null;

const rows = GAME_LIST.map((g) => ({ id: g.id, ar: nameOf(g, 'ar'), en: nameOf(g, 'en'), tool: g.group === 'tools', hub: g.hub || null, all: 0, device: 0, room: 0, tv: 0, ever: 0 }));
const rowOf = new Map(rows.map((r) => [r.id, r]));
const gone = new Map();   // ids counted that are no game of the app any more (a removed game)
for (const { lang: mode, cat: m, word, n } of list) {
  const g = cardOf(mode, word);
  if (!g) { if (!month || m === month) gone.set(word, (gone.get(word) || 0) + n); continue; }
  const r = rowOf.get(g.id);
  r.ever += n;
  if (month && m !== month) continue;
  r[mode] = (r[mode] || 0) + n;
  r.all += n;
}
rows.sort((a, b) => (b.all - a.all) || a.id.localeCompare(b.id));
const games = rows.filter((r) => !r.tool);
const tools = rows.filter((r) => r.tool);
const leastStarted = games.filter((r) => r.all > 0).sort((a, b) => (a.all - b.all) || a.id.localeCompare(b.id)).slice(0, 10);
const neverStarted = games.filter((r) => r.all === 0);
const total = rows.reduce((s, r) => ({ all: s.all + r.all, device: s.device + r.device, room: s.room + r.room, tv: s.tv + r.tv }), { all: 0, device: 0, room: 0, tv: 0 });
const report = { month: month || 'all', total, games, tools, leastStarted, neverStarted, gone: Object.fromEntries(gone) };

if (JSON_OUT) { console.log(JSON.stringify(report, null, 1)); process.exit(0); }

const label = (r) => `${r.ar} · ${r.en} \`${r.id}\``;
const table = (list) => ['| | game | all | one phone | room | room + TV |', '| ---: | --- | ---: | ---: | ---: | ---: |']
  .concat(list.map((r, i) => `| ${i + 1} | ${label(r)} | **${r.all}** | ${r.device} | ${r.room} | ${r.tv} |`)).join('\n');
const out = [];
const when = month ? `in ${month}` : 'in every month counted';
out.push(`How often each game was started ${when} (\`cd tools && npm run plays${month ? ' -- --month=' + month : ''}\`): ` +
  `**${total.all}** starts - ${total.device} on one phone, ${total.room} in a room, ${total.tv} in a room with a TV. ` +
  `${games.length - neverStarted.length} of ${games.length} games were started at least once.`);
out.push('A room game counts once when it is dealt from the lobby; a one-phone game when it starts. For deciding what to put forward on the home and what to fold away (never remove: GEMINI.md, *Everything built stays*).');
out.push(`## The ten least started\n\n${leastStarted.length ? table(leastStarted) : 'None: no game was started.'}`);
out.push(`## Never started ${when} (${neverStarted.length})\n\n` + (neverStarted.length
  ? neverStarted.map((r) => `- ${label(r)}${r.ever ? '' : ' - never started in any month counted'}${r.hub ? ` (a way inside \`${r.hub}\`)` : ''}`).join('\n')
  : 'Every game was started at least once.'));
out.push(`## Every game\n\n<details><summary>${games.length} games, most started first</summary>\n\n${table(games)}\n\n</details>`);
out.push(`## The tools\n\n<details><summary>${tools.length} tools</summary>\n\n${table(tools)}\n\n</details>`);
if (gone.size) out.push(`Counted under ids that are no game of the app any more: ${[...gone].map(([id, n]) => `\`${id}\` ${n}`).join(', ')}.`);
console.log(out.join('\n\n'));
