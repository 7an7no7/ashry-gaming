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
 * 2b. The main address (appUrl: site-worker/, the same docs/ on Cloudflare) serves it too.
 * 3. The rooms server answers /health.
 * 4. The rooms server runs the rules in this folder: its /health fingerprint
 *    (rooms-worker/fingerprint.mjs) matches this folder's. Its own copy of the
 *    app (uploaded by npm run deploy) may be an older build when only the page
 *    changed since the last deploy; that is a note, not a failure.
 */
import { readFile, stat, readdir } from 'node:fs/promises';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, '..');
const config = JSON.parse(await readFile(path.join(here, 'site.config.json'), 'utf8'));
// GitHub Pages: the first address, kept for old icons and links (githubUrl).
const SITE = String(config.githubUrl || 'https://7an7no7.github.io/ashry-gaming/').replace(/\/?$/, '/');
const ROOMS = String(config.roomsUrl || 'https://ashry-rooms.3ashry.workers.dev').replace(/\/$/, '');
const WAIT_MS = 4 * 60 * 1000;
// The main address: the same build, served by Cloudflare (site-worker/, npm run deploy:site).
const MAIN = String(config.appUrl || '').replace(/\/?$/, '/');

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
if (live === local) ok(`${SITE} serves this build (the GitHub copy)`);
else fail(`${SITE} serves ${live}, not ${local}. Was docs/ committed and pushed to master?`);

/* 2b. the main address */
if (config.appUrl) {
  const main = cacheName((await get(MAIN + 'sw.js')).text);
  if (main === local) ok(`${MAIN} serves this build (the main address)`);
  else fail(`${MAIN} (the main address) serves ${main || 'nothing'}, not ${local}: cd tools && npm run deploy:site`);
}

/* 3. rooms server */
const health = await get(ROOMS + '/health');
if (health.status === 200 && /"ok"\s*:\s*true/.test(health.text)) ok(`${ROOMS} is up`);
else fail(`${ROOMS}/health answered HTTP ${health.status}`);

/* 4. the rooms server's rules, and its copy of the app. /health reports the
   fingerprint of what the server was built from (rooms-worker/fingerprint.mjs:
   the FILES build.mjs bundles, and rooms-worker/src), and this folder's is
   worked out the same way: a difference is a failure, not a warning - "Live."
   used to print with the rooms still on the old rules. Comparing contents, not
   dates, because a deploy comes before its commit. */
const { rulesFingerprint } = await import(new URL('../rooms-worker/fingerprint.mjs', import.meta.url));
const mine = await rulesFingerprint();
let theirs = null;
try { theirs = JSON.parse(health.text).rules || null; } catch (e) {}
if (theirs && theirs === mine) ok(`the rooms server runs the rules in this folder (${mine})`);
else if (theirs) fail(`the rooms server runs other rules (${theirs}) than this folder (${mine}):\n` +
  '  cd rooms-worker && npm run deploy, wait a minute, npm run test:live.');
else fail('the rooms server does not say what it was built from: deploy it - cd rooms-worker && npm run deploy');
const workerBuild = cacheName((await get(ROOMS + '/sw.js')).text);
if (workerBuild === local) ok('the rooms server\'s copy of the app is this build');
else warn(`the rooms server's copy of the app is ${workerBuild || 'unreadable'}, not this build.\n` +
  '  Fine when only the page changed since the last deploy: the link above is the app people open.');

console.log(failed ? '\nNOT LIVE YET - fix the ✗ lines above.' : '\nLive.');
process.exitCode = failed ? 1 : 0;
