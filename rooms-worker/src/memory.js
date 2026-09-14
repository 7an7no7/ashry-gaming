import { DurableObject } from 'cloudflare:workers';

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

  /** Saves the lists a room just dealt from. */
  async write(changed) {
    if (changed && typeof changed === 'object' && Object.keys(changed).length) {
      await this.ctx.storage.put(changed);
    }
  }
}
