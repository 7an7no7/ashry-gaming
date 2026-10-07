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
  /**
   * A room's players online; 0 takes the room out of the count. `game` is the id of the game
   * being played there, or '' in the lobby (the ideas of 7 Oct 2026, 1275): a game id and nothing
   * else, so the tab can say which game most people are playing.
   */
  async report(code, players, game) {
    const key = String(code || '');
    if (!key) return;
    const n = Math.max(0, Math.floor(Number(players) || 0));
    const g = /^[a-z0-9-]{1,24}$/.test(String(game || '')) ? String(game) : '';
    if (n > 0) await this.ctx.storage.put(key, g ? { players: n, at: Date.now(), game: g } : { players: n, at: Date.now() });
    else await this.ctx.storage.delete(key);
  }

  /**
   * The total across every room still reporting, how many rooms that is, and the game with the
   * most players in it right now ({ game, players }, or null; a tie goes to the game in more rooms).
   */
  async read() {
    const now = Date.now();
    const stale = [];
    let players = 0;
    let rooms = 0;
    const games = {};
    for (const [key, entry] of await this.ctx.storage.list()) {
      if (!entry || now - entry.at > LIVE_TTL_MS) { stale.push(key); continue; }
      players += entry.players;
      rooms++;
      if (entry.game) {
        const g = games[entry.game] || (games[entry.game] = { players: 0, rooms: 0 });
        g.players += entry.players;
        g.rooms++;
      }
    }
    // Storage deletes at most 128 keys a call.
    for (let i = 0; i < stale.length; i += 128) await this.ctx.storage.delete(stale.slice(i, i + 128));
    let top = null;
    Object.keys(games).forEach((id) => {
      const g = games[id];
      if (!top || g.players > top.players || (g.players === top.players && g.rooms > top.rooms)) top = { game: id, players: g.players, rooms: g.rooms };
    });
    return { players, rooms, top: top ? { game: top.game, players: top.players } : null };
  }
}
