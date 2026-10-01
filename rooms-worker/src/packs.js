import { DurableObject } from 'cloudflare:workers';
import { PACK_TTL_MS } from '../generated/rules.js';

// A pack played again within a day doesn't need its clock written again: the
// free plan meters writes, and a room dealing it every round would write each time.
const TOUCH_EVERY_MS = 24 * 60 * 60 * 1000;

/**
 * One pack («اعمل مسابقتك» or «كلماتنا»), one instance per code
 * (env.PACKS.idFromName(code)). It keeps:
 *
 *   'pack' -> { kind, pack, keyHash, created, updated, played }
 *
 * `pack` is already clean (Packs.js, checked by index.js before it gets here).
 * The edit key is never kept, only its SHA-256: the author's phone holds the key.
 * Nothing else - no name, no address, no room.
 *
 * A pack neither played nor saved for a year deletes itself: an alarm set a year
 * after the last touch, and the same check whenever it is read, so an alarm that
 * never came can't keep a pack alive.
 */
export class PackStore extends DurableObject {
  async read() {
    const row = await this.ctx.storage.get('pack');
    if (!row) return null;
    if (Date.now() - Math.max(row.played || 0, row.updated || 0) > PACK_TTL_MS) {
      await this.ctx.storage.deleteAll();
      return null;
    }
    return row;
  }

  async keep(row) {
    await this.ctx.storage.put('pack', row);
    await this.ctx.storage.setAlarm(Math.max(row.played || 0, row.updated || 0) + PACK_TTL_MS + 1000);
  }

  /** A new pack under this code; { taken } when the code already holds one. */
  async create(kind, pack, keyHash) {
    if (await this.read()) return { taken: true };
    const now = Date.now();
    await this.keep({ kind, pack, keyHash, created: now, updated: now, played: now });
    return { ok: true };
  }

  /**
   * The whole pack, right choices included: for the Worker and a Room (which deals a quiz on the
   * server); the Worker hides a quiz's answers from a phone without the edit key (index.js).
   * `touch` when it is being played (the year starts again); `keyHash`, when given, says whether
   * it is the author's key (`mine`).
   */
  async get(touch, keyHash) {
    const row = await this.read();
    if (!row) return null;
    const now = Date.now();
    if (touch && now - (row.played || 0) > TOUCH_EVERY_MS) {
      row.played = now;
      await this.keep(row);
    }
    return { kind: row.kind, pack: row.pack, updated: row.updated, mine: !!keyHash && row.keyHash === keyHash };
  }

  /** The author's change: only with the key the pack was made with, only the same kind. */
  async save(kind, pack, keyHash) {
    const row = await this.read();
    if (!row) return { gone: true };
    if (row.keyHash !== keyHash) return { denied: true };
    if (row.kind !== kind) return { denied: true };
    row.pack = pack;
    row.updated = Date.now();
    await this.keep(row);
    return { ok: true, updated: row.updated };
  }

  async alarm() {
    const row = await this.ctx.storage.get('pack');
    if (!row) return;
    const last = Math.max(row.played || 0, row.updated || 0);
    if (Date.now() - last > PACK_TTL_MS) await this.ctx.storage.deleteAll();
    else await this.ctx.storage.setAlarm(last + PACK_TTL_MS + 1000);
  }
}
