/**
 * The weekly check's report (.github/workflows/weekly-check.yml, 7 Oct 2026, the owner: "a
 * robot that says when something broke"). The workflow runs four things, each into a file in
 * WEEKLY_DIR, and this reads them and writes WEEKLY_DIR/report.md in plain words:
 *
 *   robots.log    npm run test:live (rooms-worker/): the robot players against the live rooms server
 *   robots.json   its --failed-out: the segments still failing after a second run, and the flaky ones
 *   live.log      npm run check:live: both addresses serve the build in master, the rooms server runs its rules
 *   songs.log     npm run check:songs -- --play: دندنها's songs all still play, Apple's saved addresses current
 *   errors.json   node errors.mjs --json: the errors phones reported (only with the ASHRY_ADMIN_KEY secret)
 *
 * and how each step ended, from the environment (success, failure, skipped):
 * ROBOTS_OUTCOME, LIVE_OUTCOME, SONGS_OUTCOME, ERRORS_OUTCOME; HAS_KEY=true when the secret is
 * set; RUN_URL, the run's page. It says `problem=true` (in $GITHUB_OUTPUT, and on the console)
 * when something needs a look: a robot or a live check failed, a song no longer plays or its
 * saved address went stale, or an error was first seen on a phone in the last seven days. The
 * workflow then opens or updates the issue labelled "weekly-check" (tools/ci-issue.mjs), or,
 * when nothing does, closes it.
 *
 *   WEEKLY_DIR=folder [the outcomes] node weekly-report.mjs
 */
import { readFileSync, writeFileSync, existsSync, appendFileSync } from 'node:fs';
import path from 'node:path';

const DIR = process.env.WEEKLY_DIR || '.';
const env = (k) => process.env[k] || '';
const read = (f) => { try { return readFileSync(path.join(DIR, f), 'utf8'); } catch (e) { return ''; } };
const WEEK_MS = 7 * 24 * 3600 * 1000;
// The robots' own report to /err (play-all.mjs, errRobots): a made-up build, posted by every
// test:live - never a phone's.
const ROBOT_BUILD = '20260930120000';
const MAX_LINES = 40;

const problems = [];
const notes = [];
const sections = [];
const ran = (outcome) => outcome === 'success' || outcome === 'failure';
const clip = (lines) => (lines.length > MAX_LINES ? lines.slice(0, MAX_LINES).concat([`… and ${lines.length - MAX_LINES} more (the run's log has them all)`]) : lines);
const block = (lines) => '```\n' + clip(lines).join('\n') + '\n```';

/* 1. the robots against the live rooms server */
{
  const outcome = env('ROBOTS_OUTCOME');
  const log = read('robots.log');
  const total = (log.match(/^\d+ passed, \d+ failed.*$/m) || [''])[0];
  const failedList = ((log.split(/^failed:\s*$/m)[1]) || '').split('\n').filter((l) => /^ - /.test(l)).map((l) => l.slice(3));
  // robots.json (play-all.mjs --retry --failed-out): a segment that failed once and passed when
  // played again alone is not a failure, but it is said, so a flaky one stays in sight.
  let second = { flaky: [], firstFailures: [] };
  try { second = Object.assign(second, JSON.parse(read('robots.json') || '{}')); } catch (e) {}
  const flakyNote = second.flaky.length
    ? `\n\nNeeded a second run (failed once, then passed alone): **${second.flaky.join(', ')}**\n\n${block(second.firstFailures)}`
    : '';
  if (second.flaky.length) notes.push(`The robots' segment${second.flaky.length > 1 ? 's' : ''} ${second.flaky.join(', ')} failed once on the live server and passed when played again: flaky, worth a look if it keeps coming back.`);
  if (outcome === 'success') sections.push(`### ✓ The robot players on the live rooms server\n\n${total || 'All passed.'}${flakyNote}`);
  else {
    problems.push(ran(outcome) ? 'the robot players failed on the live rooms server' : 'the robot players did not run');
    sections.push(`### ✗ The robot players on the live rooms server (\`cd rooms-worker && npm run test:live\`)\n\n` +
      (ran(outcome) ? `${total || 'The run ended without its count.'}\n\n${failedList.length ? block(failedList) + '\n\nThese failed twice (the second time played alone).' : block(log.trim().split('\n').slice(-15))}` : 'Did not run (an earlier step of the workflow failed).') +
      flakyNote);
  }
}

/* 2. both addresses and the rooms server serve what is in master */
{
  const outcome = env('LIVE_OUTCOME');
  const log = read('live.log');
  // A ✗ line and the indented lines under it (check-live prints what to do there).
  const bad = [];
  let inBad = false;
  for (const l of log.split('\n')) {
    if (/^✗ /.test(l)) { inBad = true; bad.push(l.slice(2)); } else if (inBad && /^\s+\S/.test(l)) bad.push(l); else inBad = false;
  }
  if (outcome === 'success') sections.push('### ✓ The link and the rooms server serve the build in master');
  else {
    problems.push('the link or the rooms server is not serving what is in master');
    sections.push('### ✗ The link and the rooms server (`cd tools && npm run check:live`)\n\n' +
      (ran(outcome) ? block(bad.length ? bad : log.trim().split('\n').slice(-10)) + '\n\nUsually a release step left out: build the site, deploy the rooms server or the site, or push.' : 'Did not run (an earlier step of the workflow failed).'));
  }
}

/* 3. دندنها's songs */
{
  const outcome = env('SONGS_OUTCOME');
  const log = read('songs.log');
  const summary = (log.match(/^songs: .*$/m) || [''])[0];
  const bad = log.split('\n').filter((l) => /^\s+✗/.test(l)).map((l) => l.trim());
  if (/iTunes did not answer/.test(log)) {
    notes.push('دندنها\'s songs were not checked: Apple did not answer GitHub this week (it refuses some servers). `cd tools && npm run check:songs -- --play` on the PC checks them.');
    sections.push('### ? دندنها\'s songs: not checked (Apple did not answer GitHub)');
  } else if (outcome === 'success' && !bad.length) sections.push(`### ✓ دندنها's songs all play\n\n${summary}`);
  else {
    problems.push('some of دندنها\'s songs no longer play, or their saved address changed');
    sections.push(`### ✗ دندنها's songs (\`cd tools && npm run check:songs -- --play\`)\n\n${summary}\n\n` +
      (ran(outcome) ? block(bad.length ? bad : log.trim().split('\n').slice(-10)) : 'Did not run (an earlier step of the workflow failed).') +
      '\n\nA saved address that is "not Apple\'s current one": `npm run check:songs -- --fix`, then build and deploy the rooms server. ' +
      'A song with nothing that plays: find its recording again (the top of `tools/check-songs.mjs` says how).');
  }
}

/* 4. errors on players' phones */
{
  if (env('HAS_KEY') !== 'true') {
    notes.push('The errors from phones were not read: the repository secret ASHRY_ADMIN_KEY is not set (Settings → Secrets and variables → Actions → New repository secret).');
    sections.push('### ? Errors from phones: not read (no ASHRY_ADMIN_KEY secret)');
  } else if (env('ERRORS_OUTCOME') !== 'success') {
    problems.push('the errors from phones could not be read');
    sections.push('### ✗ Errors from phones: could not be read\n\n' + block(read('errors.err').trim().split('\n').slice(-5)));
  } else {
    let rows = [];
    try { rows = JSON.parse(read('errors.json') || '[]'); } catch (e) { rows = []; }
    const now = Date.now();
    rows = rows.filter((r) => r.lang !== ROBOT_BUILD);
    const fresh = rows.filter((r) => r.first && now - r.first <= WEEK_MS).sort((a, b) => b.n - a.n);
    const again = rows.filter((r) => r.last && now - r.last <= WEEK_MS && !(r.first && now - r.first <= WEEK_MS)).sort((a, b) => b.n - a.n);
    const when = (ms) => new Date(ms).toISOString().slice(0, 10);
    const line = (r) => `- **${r.n}×** \`${String(r.word).replace(/`/g, "'").slice(0, 300)}\` - build ${r.lang}, screen ${r.cat}, ` +
      `${Object.entries(r.tags || {}).map(([k, v]) => `${k} ${v}`).join(', ') || '?'}, first ${when(r.first)}, last ${when(r.last)}`;
    if (fresh.length) {
      problems.push(`${fresh.length} new kind${fresh.length > 1 ? 's' : ''} of error on players' phones`);
      sections.push(`### ✗ New errors on players' phones (first seen in the last 7 days: ${fresh.length})\n\n${clip(fresh.map(line)).join('\n')}` +
        (again.length ? `\n\nOlder ones seen again this week (${again.length}):\n\n${clip(again.map(line)).join('\n')}` : '') +
        '\n\nAll of them: `cd tools && ASHRY_ADMIN_KEY=… npm run errors`; once fixed and released, `-- --clear` empties the list.');
    } else {
      sections.push(`### ✓ No new errors on players' phones this week` + (again.length ? ` (${again.length} older kind${again.length > 1 ? 's' : ''} seen again: \`npm run errors\` lists them)` : ''));
    }
  }
}

const runLine = env('RUN_URL') ? `The run, with every log: ${env('RUN_URL')}` : '';
const date = new Date().toISOString().slice(0, 10);
const problem = problems.length > 0;
const report = [
  problem
    ? `**The weekly check of ${date} found something to look at:** ${problems.join('; ')}.`
    : `**The weekly check of ${date}: everything works.**`,
  ...notes.map((n) => `> ${n}`),
  ...sections,
  runLine
].filter(Boolean).join('\n\n').slice(0, 60000);

writeFileSync(path.join(DIR, 'report.md'), report + '\n');
console.log(report);
console.log(`\nproblem=${problem}`);
if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `problem=${problem}\n`);
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, report + '\n');
if (!existsSync(path.join(DIR, 'report.md'))) process.exit(1);
