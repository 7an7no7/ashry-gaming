import { DurableObject } from 'cloudflare:workers';

const MAX_KEYS = 5000;
const MAX_BATCH = 20;
const MAX_WORD_LEN = 40;
const MAX_LONG_LEN = 160;
const MAX_XL_LEN = 600;     // العرّاف's misses: twenty answers and three guesses
const MAX_CAT_LEN = 60;
const MAX_TAG_LEN = 24;
const MAX_TAGS = 12;
// How many words are kept. It has no '|', so it can never be a word's key.
const COUNT_KEY = '#count';

/**
 * Words accepted by host adjustments in Stop the bus, shared across all rooms.
 * One instance, named "stop"; the same class keeps "plays" (how often each game
 * is played), "reports" («في غلطة؟»), "oracle" (العرّاف's misses) and "errors" (the page's own errors on
 * players' phones, with when each was first and last seen and on what devices).
 * Keeps at most 5,000 keys. The Stop log drops the lowest counts when full; an
 * entry marked `keep` (the plays and the reports) is dropped itself instead when
 * it would be a new key in a full log - what is kept is never pushed out by new
 * keys, and a full log costs no read of the whole table on every add.
 */
export class WordLog extends DurableObject {
  /**
   * Adds or increments counts for entries: [{ lang, cat, word }].
   * At most 20 entries per call.
   */
  async add(entries) {
    if (!Array.isArray(entries) || !entries.length) return;
    const batch = entries.slice(0, MAX_BATCH);
    const updates = new Map();

    let keep = false;
    for (const item of batch) {
      if (!item) continue;
      if (item.keep) keep = true;
      const lang = String(item.lang || 'ar').trim();
      const cat = String(item.cat || '').trim().slice(0, MAX_CAT_LEN);
      // A reported question is longer than a word (the improvement plan's «في غلطة؟»).
      const word = String(item.word || '').trim().slice(0, item.xl ? MAX_XL_LEN : item.long ? MAX_LONG_LEN : MAX_WORD_LEN);
      if (!cat || !word) continue;
      const key = `${lang}|${cat}|${word}`;
      // `tag` (the errors log: the kind of device, 'ios-safari') is counted per entry.
      const tag = item.tag ? String(item.tag).slice(0, MAX_TAG_LEN) : '';
      const cur = updates.get(key);
      if (cur) {
        cur.n += 1;
        if (tag) cur.tags[tag] = (cur.tags[tag] || 0) + 1;
      } else {
        updates.set(key, { lang, cat, word, n: 1, stamp: !!item.stamp, tags: tag ? { [tag]: 1 } : null });
      }
    }

    if (!updates.size) return;

    // A log that keeps what it has: how many keys are left before it is full.
    let room = Infinity;
    if (keep) {
      let have = await this.ctx.storage.get(COUNT_KEY);
      if (typeof have !== 'number') {
        const all = await this.ctx.storage.list();
        have = all.size - (all.has(COUNT_KEY) ? 1 : 0);
      }
      room = MAX_KEYS - have;
    }

    let added = 0;
    for (const [key, item] of updates) {
      const existing = await this.ctx.storage.get(key);
      if (!existing) {
        if (added >= room) continue;   // full: a new key is not kept
        added++;
      }
      const prevN = existing ? (typeof existing === 'number' ? existing : Number(existing.n) || 0) : 0;
      const row = { lang: item.lang, cat: item.cat, word: item.word, n: prevN + item.n };
      // The errors log keeps when an entry was first and last seen, and its devices.
      if (item.stamp) {
        const now = Date.now();
        row.first = (existing && existing.first) || now;
        row.last = now;
      }
      if (item.tags) {
        const tags = Object.assign({}, existing && existing.tags);
        for (const [k, v] of Object.entries(item.tags)) {
          if (k in tags || Object.keys(tags).length < MAX_TAGS) tags[k] = (tags[k] || 0) + v;
        }
        row.tags = tags;
      }
      await this.ctx.storage.put(key, row);
    }
    // A word counted again adds no key, so the cap can't have been passed.
    if (!added) return;

    // Keep at most 5,000 keys (drop lowest counts). The number of keys is kept
    // under COUNT_KEY rather than learnt by reading the whole table on every
    // add: rows read are what the free plan meters. A log from before the count
    // existed is counted once, the first time.
    let count = await this.ctx.storage.get(COUNT_KEY);
    if (typeof count !== 'number') {
      const all = await this.ctx.storage.list();
      count = all.size - (all.has(COUNT_KEY) ? 1 : 0);
    } else {
      count += added;
    }
    if (count > MAX_KEYS) {
      const all = await this.ctx.storage.list();
      all.delete(COUNT_KEY);
      const sorted = [...all.entries()].sort((a, b) => {
        const na = a[1] && typeof a[1] === 'object' ? a[1].n : Number(a[1]) || 0;
        const nb = b[1] && typeof b[1] === 'object' ? b[1].n : Number(b[1]) || 0;
        return na - nb;
      });
      const dropCount = all.size - MAX_KEYS;
      const dropKeys = sorted.slice(0, dropCount).map(([k]) => k);
      for (let i = 0; i < dropKeys.length; i += 128) {
        await this.ctx.storage.delete(dropKeys.slice(i, i + 128));
      }
      // The count is exact again after a trim: what the table held, less what went.
      count = all.size - dropKeys.length;
    }
    await this.ctx.storage.put(COUNT_KEY, count);
  }

  /** Empties the log (the errors log, once they have been read and fixed). */
  async clear() {
    await this.ctx.storage.deleteAll();
  }

  /**
   * Returns every recorded word as { lang, cat, word, n } (and first, last, tags
   * where the entry keeps them).
   */
  async list() {
    const all = await this.ctx.storage.list();
    const out = [];
    for (const [key, val] of all) {
      if (!val || key === COUNT_KEY) continue;
      if (typeof val === 'object' && val.word) {
        const row = {
          lang: String(val.lang || 'ar'),
          cat: String(val.cat || ''),
          word: String(val.word || ''),
          n: Number(val.n) || 0
        };
        if (val.first) { row.first = val.first; row.last = val.last; }
        if (val.tags) row.tags = val.tags;
        out.push(row);
      } else {
        const parts = key.split('|');
        out.push({
          lang: parts[0] || 'ar',
          cat: parts[1] || '',
          word: parts.slice(2).join('|'),
          n: Number(val) || 0
        });
      }
    }
    return out;
  }
}
