import { DurableObject } from 'cloudflare:workers';

const MAX_KEYS = 5000;
const MAX_BATCH = 20;
const MAX_WORD_LEN = 40;

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
      const word = String(item.word || '').trim().slice(0, MAX_WORD_LEN);
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

    for (const [key, item] of updates) {
      const existing = await this.ctx.storage.get(key);
      const prevN = existing ? (typeof existing === 'number' ? existing : Number(existing.n) || 0) : 0;
      await this.ctx.storage.put(key, { lang: item.lang, cat: item.cat, word: item.word, n: prevN + item.n });
    }

    // Keep at most 5,000 keys (drop lowest counts)
    const all = await this.ctx.storage.list();
    if (all.size > MAX_KEYS) {
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
    }
  }

  /**
   * Returns every recorded word as { lang, cat, word, n }.
   */
  async list() {
    const all = await this.ctx.storage.list();
    const out = [];
    for (const [key, val] of all) {
      if (!val) continue;
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
