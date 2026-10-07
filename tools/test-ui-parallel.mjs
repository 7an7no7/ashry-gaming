/**
 * The screen test (test-ui.mjs) in shards, several at once: `npm run test:ui`.
 *
 *   npm run test:ui                                   every part, 4 at a time
 *   JOBS=2 npm run test:ui                            2 at a time (JOBS=1: one after another)
 *   ONLY=screens,rooms npm run test:ui                some parts, still in shards
 *   UI_GAMES=uno,domino ONLY=rooms npm run test:ui    only those room games
 *   node test-ui-parallel.mjs http://127.0.0.1:8799   another rooms server
 *   node test-ui-parallel.mjs --retry                 a failed shard once more, alone (GitHub)
 *
 * The app is built once (the preview and the site, into a temporary folder); each shard is a
 * test-ui.mjs process with its own Chrome and its own copy of the site, told which screen size or
 * which share of the room games is its own (UI_SIZES, UI_ROOMS_SHARD). A shard's output is printed
 * whole when it ends, then one summary; the exit code is 1 when any check failed or a shard died
 * without a result. `npm run test:ui:one` is the old single process.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import srcMod from './sources.cjs';
const { srcPath } = srcMod;

const here = fileURLToPath(new URL('./', import.meta.url));
const root = path.join(here, '..');
const ROOMS = (process.argv.slice(2).find((a) => /^https?:/.test(a)) || process.env.ROOMS_URL || 'http://127.0.0.1:8787').replace(/\/$/, '');
const ONLY = (process.env.ONLY || 'screens,rooms,fixes,program,mission,site').split(',');
const JOBS = Math.max(1, Number(process.env.JOBS || 4));
const ROOM_SHARDS = Math.max(1, Number(process.env.UI_ROOM_SHARDS || 3));

// A part or a room game that names nothing used to run no check and print "0 passed, 0 failed",
// which reads as green (ONLY=screen, or UI_GAMES=tictactoe for xo): both are refused here.
const PARTS = ['screens', 'rooms', 'fixes', 'program', 'mission', 'site'];
const unknownParts = ONLY.filter((p) => !PARTS.includes(p));
if (unknownParts.length) {
  console.error(`ONLY=${unknownParts.join(',')} names no part (${PARTS.join(', ')})`);
  process.exit(1);
}
if (process.env.UI_GAMES) {
  const ids = new Set(new Function(fs.readFileSync(srcPath('Games.js'), 'utf8') + '\nreturn ROOM_GAME_IDS;')());
  const unknownGames = process.env.UI_GAMES.split(',').filter((g) => !ids.has(g));
  if (unknownGames.length) {
    console.error(`UI_GAMES=${unknownGames.join(',')} names no room game (ROOM_GAME_IDS, Games.js)`);
    process.exit(1);
  }
}

try {
  const res = await fetch(ROOMS + '/health');
  if (!res.ok) throw new Error(res.status);
} catch (e) {
  console.error(`No rooms server at ${ROOMS} (${e.message}). Start one: cd rooms-worker && npm run dev`);
  process.exit(1);
}

const t0 = Date.now();
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'ashry-uip-'));
const PREVIEW = path.join(TMP, 'preview');
const SITE = path.join(TMP, 'site');
const build = (script, env) => {
  const r = spawnSync(process.execPath, [path.join(here, script)], { env: Object.assign({}, process.env, env), encoding: 'utf8' });
  if (r.status !== 0) { console.error(r.stdout, r.stderr); process.exit(1); }
};
build('build-preview.mjs', { ROOMS_URL: ROOMS, PREVIEW_OUT: PREVIEW });
fs.mkdirSync(SITE, { recursive: true });
for (const f of ['icon-180.png', 'icon-192.png', 'icon-512.png', 'favicon-64.png', 'manifest.webmanifest']) {
  if (fs.existsSync(path.join(root, 'docs', f))) fs.copyFileSync(path.join(root, 'docs', f), path.join(SITE, f));
}
build('build-site.mjs', { ROOMS_URL: ROOMS, SITE_OUT: SITE });
console.log(`built the app once (${((Date.now() - t0) / 1000).toFixed(1)}s); rooms server ${ROOMS}`);

// The shards, the longest first (seconds on the owner's PC, 30 Sep 2026, four at a time).
const SHARDS = [];
if (ONLY.includes('rooms')) for (let i = 0; i < ROOM_SHARDS; i++) SHARDS.push({ name: `rooms ${i + 1}/${ROOM_SHARDS}`, env: { ONLY: 'rooms', UI_ROOMS_SHARD: `${i}/${ROOM_SHARDS}` }, secs: 200 });
if (ONLY.includes('screens')) for (const size of ['375x812', '1280x720', '667x375']) SHARDS.push({ name: `screens ${size}`, env: { ONLY: 'screens', UI_SIZES: size }, secs: size === '667x375' ? 100 : 180 });
if (ONLY.includes('fixes')) SHARDS.push({ name: 'fixes', env: { ONLY: 'fixes' }, secs: 60 });
if (ONLY.includes('site')) SHARDS.push({ name: 'site', env: { ONLY: 'site' }, secs: 60 });
if (ONLY.includes('program')) SHARDS.push({ name: 'program', env: { ONLY: 'program' }, secs: 50 });
if (ONLY.includes('mission')) SHARDS.push({ name: 'mission', env: { ONLY: 'mission' }, secs: 40 });
SHARDS.sort((a, b) => b.secs - a.secs);

const results = [];
const runOne = (shard) => new Promise((resolve) => {
  const t = Date.now();
  const env = Object.assign({}, process.env, shard.env, { UI_CHILD: '1', UI_PREVIEW: PREVIEW, UI_SITE: SITE, ROOMS_URL: ROOMS });
  const child = spawn(process.execPath, [path.join(here, 'test-ui.mjs'), ROOMS], { env, stdio: ['ignore', 'pipe', 'pipe'] });
  let text = '';
  child.stdout.on('data', (d) => { text += d; });
  child.stderr.on('data', (d) => { text += d; });
  child.on('close', (code) => {
    const m = text.match(/^@@RESULT (.*)$/m);
    const r = m ? JSON.parse(m[1]) : { passed: 0, failed: 1, died: `exit ${code}` };
    const secs = (Date.now() - t) / 1000;
    const body = text.replace(/^@@RESULT .*$/m, '').replace(/\n\d+ passed, \d+ failed\s*$/m, '').replace(/\n+$/, '');
    console.log(`\n── ${shard.name} (${secs.toFixed(1)}s, ${r.passed} passed, ${r.failed} failed${r.died ? ', ended without a result: ' + r.died : ''}) ──\n${body}`);
    const fails = (body.match(/^\s*✗ .*$/gm) || []).map((l) => `[${shard.name}] ${l.trim().slice(2)}`);
    if (r.died) fails.push(`[${shard.name}] the process ended without a result (${r.died})`);
    results.push({ name: shard.name, secs, passed: r.passed, failed: r.failed, fails });
    resolve();
  });
});
const queue = SHARDS.slice();
const worker = async () => { while (queue.length) await runOne(queue.shift()); };
console.log(`${SHARDS.length} shards, ${Math.min(JOBS, SHARDS.length)} at a time`);
await Promise.all(Array.from({ length: Math.min(JOBS, SHARDS.length) }, worker));

// --retry (GitHub, 7 Oct 2026): a shard that failed runs once more, alone, and only its second
// result counts. The ones that needed it are named at the end, so a flaky one stays in sight.
const flaky = [];
if (process.argv.includes('--retry')) {
  const again = SHARDS.filter((s) => results.some((r) => r.name === s.name && r.fails.length));
  if (again.length) console.log(`\n${again.length} shard${again.length > 1 ? 's' : ''} failed, run once more, one at a time: ${again.map((s) => s.name).join(', ')}`);
  for (const shard of again) {
    const first = results.splice(results.findIndex((r) => r.name === shard.name), 1)[0];
    await runOne(Object.assign({}, shard, { name: shard.name + ' (second run)' }));
    const second = results[results.length - 1];
    second.name = shard.name;
    if (!second.fails.length) flaky.push({ name: shard.name, first: first.fails });
  }
}

const passed = results.reduce((n, r) => n + r.passed, 0);
const failed = results.reduce((n, r) => n + r.failed, 0);
console.log('\nshards by time: ' + results.slice().sort((a, b) => b.secs - a.secs).map((r) => `${r.name} ${Math.round(r.secs)}s`).join(', '));
console.log(`\n${passed} passed, ${failed} failed, ${((Date.now() - t0) / 1000).toFixed(1)}s (${JOBS} at a time)`);
const fails = results.flatMap((r) => r.fails);
if (flaky.length) console.log(`needed a second run (failed once, then passed alone): ${flaky.map((f) => f.name).join(', ')}\n - ` + flaky.flatMap((f) => f.first).join('\n - '));
if (fails.length) console.log('failed:\n - ' + fails.join('\n - '));
// The job's page on GitHub: what failed, and what passed only the second time.
if (process.env.GITHUB_STEP_SUMMARY) {
  const md = [`### The screen test (${ONLY.join(', ')}): ${passed} passed, ${failed} failed`];
  if (flaky.length) md.push(`Needed a second run (failed once, then passed alone): **${flaky.map((f) => f.name).join(', ')}**`, ...flaky.flatMap((f) => f.first).map((x) => `- ${x}`));
  if (fails.length) md.push('Failed:', ...fails.map((x) => `- ${x}`));
  fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, md.join('\n') + '\n\n');
}
try { fs.rmSync(TMP, { recursive: true, force: true }); } catch (e) {}
// 1, never the count: a POSIX shell keeps the exit status mod 256, so 256 failures read as 0.
process.exit(failed || fails.length ? 1 : 0);
