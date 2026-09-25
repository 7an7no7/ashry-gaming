import { DurableObject } from 'cloudflare:workers';

const MAX_KEYS = 5000;
const MAX_BATCH = 20;
const MAX_WORD_LEN = 40;
const MAX_LONG_LEN = 160;
// How many words are kept. It has no '|', so it can never be a word's key.
const COUNT_KEY = '#count';

/**
 * Words accepted by host adjustments in Stop the bus, shared across all rooms.
 * One instance, named "stop".
 * Keeps at most 5,000 keys, dropping the lowest counts when full.
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

    for (const item of batch) {
      if (!item) continue;
      const lang = String(item.lang || 'ar').trim();
      const cat = String(item.cat || '').trim();
      // A reported question is longer than a word (the improvement plan's «في غلطة؟»).
      const word = String(item.word || '').trim().slice(0, item.long ? MAX_LONG_LEN : MAX_WORD_LEN);
      if (!cat || !word) continue;
      const key = `${lang}|${cat}|${word}`;
      const cur = updates.get(key);
      if (cur) {
        cur.n += 1;
      } else {
        updates.set(key, { lang, cat, word, n: 1 });
      }
    }

    if (!updates.size) return;

    let added = 0;
    for (const [key, item] of updates) {
      const existing = await this.ctx.storage.get(key);
      if (!existing) added++;
      const prevN = existing ? (typeof existing === 'number' ? existing : Number(existing.n) || 0) : 0;
      await this.ctx.storage.put(key, { lang: item.lang, cat: item.cat, word: item.word, n: prevN + item.n });
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

  /**
   * Returns every recorded word as { lang, cat, word, n }.
   */
  async list() {
    const all = await this.ctx.storage.list();
    const out = [];
    for (const [key, val] of all) {
      if (!val || key === COUNT_KEY) continue;
      if (typeof val === 'object' && val.word) {
        out.push({
          lang: String(val.lang || 'ar'),
          cat: String(val.cat || ''),
          word: String(val.word || ''),
          n: Number(val.n) || 0
        });
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
