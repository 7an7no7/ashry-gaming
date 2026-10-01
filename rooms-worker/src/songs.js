/*
 * دندنها's sound: where a song's 30-second preview comes from (1 Oct 2026).
 *
 * A song in Songs.js is pinned to one source - { src: 'itunes', id } or
 * { src: 'deezer', id } - and may carry a second pin (`also`) to the same singer's
 * recording on the other one. /song (index.js) asks the room which song a token
 * stands for and streams its preview from here, the first pin first and the
 * second if the first fails. Nothing is stored but the ids: Apple's preview
 * addresses change now and then, and Deezer's are signed and expire within hours
 * (`hdnea=exp=…`), so each is looked up when it is played. Deezer's API sends no
 * CORS headers; that doesn't matter, the Worker is the one asking.
 *
 * Plain fetch, no Cloudflare-only modules: test/play-all.mjs imports this to
 * fetch a real preview from each source.
 */

const APPLE = /^https:\/\/[a-z0-9.-]+\.apple\.com\//;
const DEEZER = /^https:\/\/[a-z0-9.-]+\.dzcdn\.net\//;

/** The preview's address for one pin, or null. `cf` is Cloudflare's cache options (absent in node). */
export const SONG_SOURCES = {
  // Apple's lookup answers 403 to Cloudflare's servers (1 Oct 2026; its audio files load
  // fine from there), so an Apple pin carries its preview's address (`u`, kept current by
  // `npm run check:songs -- --fix` in tools/) and the lookup is only a fallback, for node.
  async itunes(id, cf, u) {
    if (u && APPLE.test(u)) return u;
    const res = await fetch('https://itunes.apple.com/lookup?id=' + Number(id), cf ? { cf: { cacheTtl: 86400, cacheEverything: true } } : {});
    const data = res.ok ? await res.json() : null;
    const hit = data && (data.results || []).find((r) => r.trackId === Number(id));
    return hit && APPLE.test(hit.previewUrl || '') ? hit.previewUrl : null;
  },
  async deezer(id, cf) {
    // Signed and short-lived: never cached for long.
    const res = await fetch('https://api.deezer.com/track/' + Number(id), cf ? { cf: { cacheTtl: 300, cacheEverything: true } } : {});
    const data = res.ok ? await res.json() : null;
    return data && !data.error && Number(data.id) === Number(id) && DEEZER.test(data.preview || '') ? data.preview : null;
  }
};

/** The pins of a song, in the order they are tried. */
export const songPins = (song) => [song, song && song.also].filter((p) => p && SONG_SOURCES[p.src] && Number(p.id) > 0);

/**
 * The first preview that answers, as { body, type, src }, or null. `body` is the
 * upstream stream; `type` is audio/mp4 for Apple (AAC) and audio/mpeg for Deezer (mp3).
 */
export async function songStream(song, cf) {
  for (const pin of songPins(song)) {
    try {
      const url = await SONG_SOURCES[pin.src](pin.id, cf, pin.u);
      if (!url) continue;
      const audio = await fetch(url, cf ? { cf: { cacheTtl: pin.src === 'itunes' ? 604800 : 3600, cacheEverything: true } } : {});
      if (!audio.ok || !audio.body) continue;
      // One plain type per source: Apple labels its AAC previews audio/x-m4p or x-m4a, which a
      // browser may not play from a blob; they are ordinary AAC in mp4. Deezer's are mp3.
      return { body: audio.body, type: pin.src === 'deezer' ? 'audio/mpeg' : 'audio/mp4', src: pin.src };
    } catch (e) { /* the next pin */ }
  }
  return null;
}
