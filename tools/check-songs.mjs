/**
 * دندنها: is every song still playable? (npm run check:songs)
 *
 * Every trackId in Songs.js is looked up on iTunes (https://itunes.apple.com/lookup,
 * 50 at a time, a pause between, as the API asks), and the run reports a song that
 * no longer resolves, has lost its 30-second preview, or now answers with another
 * artist than the one written in the list (with --artists: `se` is our spelling and
 * iTunes has its own - Shadya, Mouhamed Fawzy - so these are only lines to read).
 * With --play it also fetches each preview's first bytes, to know the clip itself
 * is still there. A song that fails here is skipped by itself in a game (the
 * phone says it won't load and the round deals another), but it should be
 * replaced in Songs.js: find the original artist's recording with
 *   https://itunes.apple.com/search?entity=song&term=<artist and title, transliterated>
 * and check it with https://itunes.apple.com/lookup?id=<trackId>.
 *
 *   npm run check:songs              the lookups
 *   npm run check:songs -- --play    and the previews themselves
 *   npm run check:songs -- --artists the artist each trackId answers with, beside ours
 */
import { readFileSync } from 'node:fs';

const SONGS = new Function(readFileSync(new URL('../Songs.js', import.meta.url), 'utf8') + ';return HUM_SONGS;')();
const PLAY = process.argv.includes('--play');
const ARTISTS = process.argv.includes('--artists');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const loose = (s) => String(s || '').toLowerCase().replace(/[^a-z]/g, '');

const found = new Map();
for (let k = 0; k < SONGS.length; k += 50) {
  const ids = SONGS.slice(k, k + 50).map((x) => x.id);
  let data = null;
  for (let attempt = 0; attempt < 3 && !data; attempt++) {
    try {
      const res = await fetch('https://itunes.apple.com/lookup?id=' + ids.join(','));
      if (res.ok) data = await res.json();
    } catch (e) { /* tried again */ }
    if (!data) await sleep(4000);
  }
  if (!data) { console.error('iTunes did not answer; try again later'); process.exit(2); }
  (data.results || []).forEach((r) => found.set(r.trackId, r));
  await sleep(2500);
}

const broken = [];
const warnings = [];
for (const x of SONGS) {
  const r = found.get(x.id);
  if (!r) { broken.push(`${x.id} ${x.t} (${x.s}): no longer on iTunes`); continue; }
  if (!r.previewUrl) { broken.push(`${x.id} ${x.t} (${x.s}): no preview any more`); continue; }
  const a = loose(r.artistName), b = loose(x.se);
  if (ARTISTS && a && b && a.indexOf(b.slice(0, 5)) === -1 && b.indexOf(a.slice(0, 5)) === -1) warnings.push(`${x.id} ${x.t}: iTunes says "${r.artistName}", the list "${x.se}"`);
  if (PLAY) {
    try {
      const res = await fetch(r.previewUrl, { headers: { Range: 'bytes=0-1023' } });
      if (!res.ok && res.status !== 206) broken.push(`${x.id} ${x.t} (${x.s}): the preview answers ${res.status}`);
    } catch (e) { broken.push(`${x.id} ${x.t} (${x.s}): the preview did not load`); }
    await sleep(150);
  }
}

console.log(`songs: ${SONGS.length} looked up, ${SONGS.length - broken.length} playable`);
warnings.forEach((w) => console.log('  ? ' + w));
broken.forEach((b) => console.log('  ✗ ' + b));
process.exit(broken.length ? 1 : 0);
