/**
 * npm run test:live - the short check after a rooms deploy (the owner, 7 Oct 2026: the full
 * live run took 10 minutes and repeated the robots already run before the release).
 *
 * It plays, against the live rooms server, the segments that show the deploy works for
 * everyone (SMOKE: errors, the move code, the core room games, a leaver, a host away, the
 * seat claim's faces, the crew), plus the segments of the games changed since the last
 * release - what `npm run test:changed` maps the files changed since origin/master to (run it
 * after the deploy and before the push, as CLAUDE.md says, so origin/master is the release
 * before). When those changes touch the room engine itself ("everything"), only SMOKE runs
 * here: the full robots ran on this PC before the release, and GitHub runs them again on the
 * push. About 1-3 minutes instead of 10.
 *
 *   npm run test:live                      the short check
 *   npm run test:live -- --base=HEAD~2     changed since another ref
 *   npm run test:live -- --dry             only say which segments
 *   npm run test:live:full                 every segment (big releases; the weekly check)
 * Any other argument (--retry, --jobs=N) goes to play-all.mjs.
 */
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const LIVE = 'https://ashry-rooms.3ashry.workers.dev';
const SMOKE = ['err', 'move', 'core', 'leavemid', 'hostaway', 'faces', 'crew'];

const here = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const base = (args.find((a) => a.startsWith('--base=')) || '--base=origin/master').slice(7);
const dry = args.includes('--dry');
const pass = args.filter((a) => !a.startsWith('--base=') && a !== '--dry');

// What test:changed would give the robots for the changes since the last release.
const plan = spawnSync(process.execPath, [path.join(here, '..', '..', 'tools', 'test-changed.mjs'), '--dry', '--base=' + base], { encoding: 'utf8' });
const line = (plan.stdout || '').split(/\r?\n/).find((l) => /^\s*-\s*robots\b/.test(l)) || '';
const changed = /\(all\)/.test(line) ? [] : (line.replace(/^\s*-\s*robots\s*/, '').split(',').map((s) => s.trim()).filter(Boolean));
const segments = Array.from(new Set(SMOKE.concat(changed)));

console.log(`live check: ${segments.join(', ')}` + (/\(all\)/.test(line) ? ' (the room engine changed: the full robots ran before the release and run on GitHub)' : ''));
if (dry) process.exit(0);

const run = spawnSync(process.execPath, [path.join(here, 'play-all.mjs'), LIVE, '--only=' + segments.join(',')].concat(pass), { stdio: 'inherit' });
process.exit(run.status === null ? 1 : run.status);
