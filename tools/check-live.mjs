/**
 * Is the link serving what is in this folder?
 *
 *   npm run check:live
 *
 * 1. This folder: nothing left uncommitted or unpushed, and docs/ built after
 *    the last source edit.
 * 2. GitHub Pages serves the docs/ build you have here. Every build:site gives
 *    the service worker a new cache name, so that name identifies the build.
 *    Pages takes about a minute after a push; this waits up to 4 minutes.
 * 3. The rooms server answers /health.
 * 4. The rooms server's own copy of the app (uploaded by npm run deploy) is the
 *    same build. If not, the last deploy came before the last build: fine when
 *    only the page changed, not when anything rooms run did.
 */
import { readFile, stat, readdir } from 'node:fs/promises';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, '..');
const config = JSON.parse(await readFile(path.join(here, 'site.config.json'), 'utf8'));
const SITE = 'https://7an7no7.github.io/ashry-gaming/';
const ROOMS = String(config.roomsUrl || 'https://ashry-rooms.rooms-worker.workers.dev').replace(/\/$/, '');
const WAIT_MS = 4 * 60 * 1000;

const cacheName = (text) => (String(text).match(/ashry-\d{8,}/) || [])[0] || null;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const git = (args) => {
  try {
    // trimEnd, not trim: `git status --porcelain` starts lines with a space.
    return execSync('git ' + args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trimEnd();
  } catch (e) {
    return null;
  }
};
async function get(url) {
  try {
    const res = await fetch(url + (url.includes('?') ? '&' : '?') + 't=' + Date.now(), {
      headers: { 'cache-control': 'no-cache' }
    });
    return { status: res.status, text: await res.text() };
  } catch (e) {
    return { status: 0, text: String((e && e.message) || e) };
  }
}

let failed = false;
const ok = (msg) => console.log('✓ ' + msg);
const warn = (msg) => console.log('! ' + msg);
const fail = (msg) => { failed = true; console.log('✗ ' + msg); };

/* 1. this folder */
const local = cacheName(await readFile(path.join(root, 'docs', 'sw.js'), 'utf8'));
console.log(`this folder's build: ${local}\n`);

const dirty = git('status --porcelain');
if (dirty) fail('uncommitted changes (commit them, docs/ included, and push):\n' + dirty.split('\n').map((l) => '    ' + l).join('\n'));
else if (dirty === '') ok('everything is committed');

git('fetch -q origin master');
const ahead = git('rev-list --count origin/master..HEAD');
if (ahead && ahead !== '0') fail(`${ahead} commit(s) not pushed yet: git push origin master`);
else if (ahead === '0') ok('everything is pushed');

const built = (await stat(path.join(root, 'docs', 'index.html'))).mtimeMs;
const sources = (await readdir(root)).filter((f) => /\.(html|js)$/.test(f));
const newer = [];
for (const f of sources) if ((await stat(path.join(root, f))).mtimeMs > built + 1000) newer.push(f);
if (newer.length) fail(`changed after the last build:site (cd tools && npm run build:site, then commit and push): ${newer.join(', ')}`);
else ok('docs/ was built after the last source edit');

/* 2. GitHub Pages */
const started = Date.now();
let live = null;
for (;;) {
  const r = await get(SITE + 'sw.js');
  live = cacheName(r.text);
  if (live === local || Date.now() - started > WAIT_MS) break;
  console.log(`  the link still serves ${live || 'nothing (HTTP ' + r.status + ')'}, waiting for GitHub Pages...`);
  await sleep(20000);
}
if (live === local) ok(`${SITE} serves this build`);
else fail(`${SITE} serves ${live}, not ${local}. Was docs/ committed and pushed to master?`);

/* 3. rooms server */
const health = await get(ROOMS + '/health');
if (health.status === 200 && /"ok"\s*:\s*true/.test(health.text)) ok(`${ROOMS} is up`);
else fail(`${ROOMS}/health answered HTTP ${health.status}`);

/* 4. the rooms server's copy of the app */
const workerBuild = cacheName((await get(ROOMS + '/sw.js')).text);
if (workerBuild === local) ok('the rooms server was deployed with this build');
else warn(`the rooms server's copy of the app is ${workerBuild || 'unknown'}: the last deploy came before this build.\n` +
  '  Fine if only the page changed. If RoomGames.js, PartyContent.js, CodenamesWords.js, SpyWords.js or\n' +
  '  rooms-worker/src changed: cd rooms-worker && npm run deploy, wait a minute, npm run test:live.');

console.log(failed ? '\nNOT LIVE YET - fix the ✗ lines above.' : '\nLive.');
process.exitCode = failed ? 1 : 0;
