import { DurableObject } from 'cloudflare:workers';

/** The most lists the memory keeps (normal play makes a few hundred). */
const MEMORY_MAX_KEYS = 3000;

/**
 * Which prompts have been dealt lately, shared by every room - the history
 * RoomGames.js keeps per word list as "size|i,j,k" (see nextPrompts). There is
 * one instance, named "prompts", so tonight's room skips what last night's
 * room already showed.
 */
export class PromptMemory extends DurableObject {
  /** Every list's history, as { key: "size|i,j,k" }. */
  async read() {
    return Object.fromEntries(await this.ctx.storage.list());
  }

  /**
   * Saves the lists a room just dealt from. A list already kept is always
   * updated; a new one is taken only while there are fewer than MEMORY_MAX_KEYS,
   * so a script inventing categories can't grow the table every deal reads.
   */
  async write(changed) {
    if (!changed || typeof changed !== 'object') return;
    const keys = Object.keys(changed);
    if (!keys.length) return;
    if (this.known === undefined) this.known = new Set((await this.ctx.storage.list()).keys());
    const ok = {};
    for (const k of keys) {
      if (this.known.has(k) || this.known.size < MEMORY_MAX_KEYS) {
        this.known.add(k);
        ok[k] = changed[k];
      }
    }
    const list = Object.keys(ok);
    // put() takes at most 128 keys at once.
    for (let i = 0; i < list.length; i += 128) {
      await this.ctx.storage.put(Object.fromEntries(list.slice(i, i + 128).map((k) => [k, ok[k]])));
    }
  }
}
