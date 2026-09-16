import { DurableObject } from 'cloudflare:workers';

// A room that hasn't reported for this long is left out of the count. Rooms in
// use report at least every few minutes (LIVE_REFRESH_MS in room.js), so only a
// room that died without saying so - or sat with nobody touching anything for
// a quarter of an hour - drops out early.
const LIVE_TTL_MS = 15 * 60 * 1000;

/**
 * How many people are playing right now, for the line on the مع بعض tab. There
 * is one instance, named "live". Each room reports its own number of players
 * online when that number changes, and this adds them up.
 *
 * Nothing about who is playing is kept: a room code and a number, gone as soon
 * as the room is empty. Phones that merely have the app open never reach it -
 * only rooms do, and only when their players come and go.
 */
export class LiveStats extends DurableObject {
  /** A room's players online; 0 takes the room out of the count. */
  async report(code, players) {
    const key = String(code || '');
    if (!key) return;
    const n = Math.max(0, Math.floor(Number(players) || 0));
    if (n > 0) await this.ctx.storage.put(key, { players: n, at: Date.now() });
    else await this.ctx.storage.delete(key);
  }

  /** The total across every room still reporting, and how many rooms that is. */
  async read() {
    const now = Date.now();
    const stale = [];
    let players = 0;
    let rooms = 0;
    for (const [key, entry] of await this.ctx.storage.list()) {
      if (!entry || now - entry.at > LIVE_TTL_MS) { stale.push(key); continue; }
      players += entry.players;
      rooms++;
    }
    // Storage deletes at most 128 keys a call.
    for (let i = 0; i < stale.length; i += 128) await this.ctx.storage.delete(stale.slice(i, i + 128));
    return { players, rooms };
  }
}
