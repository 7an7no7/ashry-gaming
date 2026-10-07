import { DurableObject } from 'cloudflare:workers';
import { MOVE_TTL_MS, moveExpired } from '../generated/rules.js';

// A value is kept in pieces of this many characters: far under a stored value's limit
// whatever the letters (an Arabic letter is two bytes, an emoji four).
const PART_CHARS = 60 * 1024;

/**
 * «انقل بياناتي» (7 Oct 2026): one phone's data on its way to another, one
 * instance per code (env.MOVES.idFromName('move:' + code)). It keeps:
 *
 *   'meta' -> { at, keyHash, parts }     'p0' … -> the payload's text, in pieces
 *
 * The payload is what the phone sent, never read here (index.js checked its size
 * and shape) and never logged. The stop key is kept only as its SHA-256. Gone 24
 * hours after it was sent (MOVE_TTL_MS, app/MoveData.js): an alarm then, and the
 * same check whenever it is read, so an alarm that never came can't keep it.
 */
export class MoveStore extends DurableObject {
  async meta() {
    const meta = await this.ctx.storage.get('meta');
    if (!meta) return null;
    if (moveExpired(meta.at, Date.now())) { await this.ctx.storage.deleteAll(); return null; }
    return meta;
  }

  /** A new entry under this code; { taken } when the code already holds one. */
  async put(text, keyHash) {
    if (await this.meta()) return { taken: true };
    const at = Date.now();
    const parts = {};
    let n = 0;
    for (let i = 0; i < text.length; i += PART_CHARS) parts['p' + n++] = text.slice(i, i + PART_CHARS);
    await this.ctx.storage.put(parts);
    await this.ctx.storage.put('meta', { at, keyHash, parts: n });
    await this.ctx.storage.setAlarm(at + MOVE_TTL_MS + 1000);
    return { ok: true, until: at + MOVE_TTL_MS };
  }

  /** The payload's text and when it goes, or null. Read as often as wanted in its day. */
  async get() {
    const meta = await this.meta();
    if (!meta) return null;
    const keys = Array.from({ length: meta.parts }, (_, i) => 'p' + i);
    const got = await this.ctx.storage.get(keys);
    return { text: keys.map((k) => got.get(k) || '').join(''), until: meta.at + MOVE_TTL_MS };
  }

  /** «وقّف الكود»: the sender ends it early, with the key the send gave. */
  async drop(keyHash) {
    const meta = await this.meta();
    if (!meta) return { gone: true };
    if (meta.keyHash !== keyHash) return { denied: true };
    await this.ctx.storage.deleteAll();
    return { ok: true };
  }

  async alarm() {
    const meta = await this.ctx.storage.get('meta');
    if (!meta) return;
    if (moveExpired(meta.at, Date.now())) await this.ctx.storage.deleteAll();
    else await this.ctx.storage.setAlarm(meta.at + MOVE_TTL_MS + 1000);
  }
}
