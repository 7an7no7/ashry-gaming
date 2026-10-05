/**
 * دندنها: is every song still playable? (npm run check:songs)
 *
 * Every pin in Songs.js is asked about - a song's own source and its second pin
 * (`also`) if it has one. Apple: https://itunes.apple.com/lookup, 50 ids at a
 * time with a pause between, as the API asks. Deezer: https://api.deezer.com/track/<id>
 * one at a time (no key, no account; its limit is 50 calls in 5 s). The run
 * reports a pin that no longer resolves or has lost its 30-second preview, and a
 * song with no pin left that plays. With --play it also fetches the first bytes of
 * every preview (Deezer's addresses are signed and expire within hours, which is
 * why Songs.js keeps only ids and the rooms server looks a song up when it plays
 * it - see rooms-worker/src/songs.js). With --artists it prints the artist each
 * pin answers with beside ours (our spelling and theirs differ - Shadya, Mouhamed
 * Fawzy, ام كلثوم - so these are only lines to read).
 *
 * A song whose pins all fail is skipped by itself in a game (the phone says it
 * won't load and the round deals another), but it should be fixed in Songs.js:
 * find the original singer's recording with
 *   https://itunes.apple.com/search?entity=song&term=<artist and title, transliterated>
 *   https://api.deezer.com/search?q=<artist and title, Arabic or Latin>
 * and check it with the lookups above. Exit 1 when a song has nothing that plays.
 *
 *   npm run check:songs              the lookups
 *   npm run check:songs -- --play    and the previews themselves
 *   npm run check:songs -- --artists the artist each pin answers with, beside ours
 *   npm run check:songs -- --fix     write Apple's current preview addresses into Songs.js
 *
 * Apple's lookup answers 403 to Cloudflare's servers (and its search 429), while its
 * audio files load fine from there, so an Apple pin keeps its preview's address (`u`)
 * in Songs.js and the rooms server fetches that directly. Apple changes an address
 * now and then: this run reports a `u` that is missing or no longer Apple's current
 * one, and --fix writes the current ones in (then build and deploy the rooms server).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import srcMod from './sources.cjs';
const { srcPath } = srcMod;

const SONGS_FILE = srcPath('Songs.js');
const SONGS = new Function(readFileSync(SONGS_FILE, 'utf8') + ';return HUM_SONGS;')();
const PLAY = process.argv.includes('--play');
const ARTISTS = process.argv.includes('--artists');
const FIX = process.argv.includes('--fix');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const getJson = async (url) => {
  for (let attempt = 0; attempt < 3; attempt++) {
    try { const res = await fetch(url); if (res.ok) return await res.json(); } catch (e) { /* again */ }
    await sleep(3000);
  }
  return null;
};

const pins = [];
SONGS.forEach((x, i) => { pins.push({ i, src: x.src, id: x.id, u: x.u }); if (x.also) pins.push({ i, src: x.also.src, id: x.also.id, u: x.also.u, second: true }); });

// What each pin answers: { preview, artist, title } or null.
const found = new Map();
const itunes = pins.filter((p) => p.src === 'itunes');
for (let k = 0; k < itunes.length; k += 50) {
  const data = await getJson('https://itunes.apple.com/lookup?id=' + itunes.slice(k, k + 50).map((p) => p.id).join(','));
  if (!data) { console.error('iTunes did not answer; try again later'); process.exit(2); }
  (data.results || []).forEach((r) => found.set('itunes:' + r.trackId, { preview: r.previewUrl || '', artist: r.artistName, title: r.trackName }));
  await sleep(2500);
}
for (const p of pins.filter((x) => x.src === 'deezer')) {
  const d = await getJson('https://api.deezer.com/track/' + p.id);
  if (d && !d.error && Number(d.id) === p.id) found.set('deezer:' + p.id, { preview: d.preview || '', artist: d.artist && d.artist.name, title: d.title });
  await sleep(130);
}

const playable = new Set();
const broken = [];
const fixes = new Map();   // Apple id → its current preview address (--fix)
for (const p of pins) {
  const x = SONGS[p.i];
  const key = p.src + ':' + p.id;
  const tag = `${key}${p.second ? ' (second pin)' : ''} ${x.t} (${x.s})`;
  const r = found.get(key);
  if (!r) { broken.push(tag + ': no longer there'); continue; }
  if (!r.preview) { broken.push(tag + ': no preview any more'); continue; }
  if (ARTISTS) console.log(`  · ${tag}: ${r.artist} | ${r.title}`);
  if (p.src === 'itunes' && p.u !== r.preview) {
    if (FIX) fixes.set(p.id, r.preview);
    else { broken.push(tag + (p.u ? ': its saved address is not Apple\'s current one (--fix)' : ': no saved address (--fix)')); continue; }
  }
  if (PLAY) {
    try {
      const res = await fetch(r.preview, { headers: { Range: 'bytes=0-1023' } });
      if (!res.ok && res.status !== 206) { broken.push(tag + ': the preview answers ' + res.status); continue; }
    } catch (e) { broken.push(tag + ': the preview did not load'); continue; }
    await sleep(120);
  }
  playable.add(p.i);
}

if (fixes.size) {
  let src = readFileSync(SONGS_FILE, 'utf8');
  fixes.forEach((url, id) => {
    src = src.replace(new RegExp(`(src: 'itunes', id: ${id})(, u: '[^']*')?`, 'g'), `$1, u: '${url.replace(/'/g, '%27')}'`);
  });
  writeFileSync(SONGS_FILE, src);
  console.log(`--fix: wrote ${fixes.size} Apple preview addresses into Songs.js (build and deploy the rooms server)`);
}

const lost = SONGS.map((x, i) => i).filter((i) => !playable.has(i));
const bySrc = (src) => SONGS.filter((x) => x.src === src).length;
console.log(`songs: ${SONGS.length} (Apple ${bySrc('itunes')}, Deezer ${bySrc('deezer')}, ${SONGS.filter((x) => x.also).length} with a second pin); ` +
  `${pins.length} pins looked up${PLAY ? ' and played' : ''}; ${SONGS.length - lost.length} songs playable`);
broken.forEach((b) => console.log('  ✗ ' + b));
lost.forEach((i) => console.log(`  ✗✗ ${SONGS[i].t} (${SONGS[i].s}): nothing plays`));
process.exit(lost.length ? 1 : 0);
