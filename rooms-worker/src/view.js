/*
 * What one device is sent of a room: the room's projection for `pid`.
 *
 * Its own file so the leak check (test/leaks.mjs) builds every phone's view
 * with this very function, after every move of every game, instead of a copy
 * of it that could drift. `online` is a Set of the ids with a live connection.
 *
 * Hidden information stays behind: `secrets` leaves only as `you`, and only
 * for the player it belongs to; a screen is never sent one.
 */
import { chatFor } from '../generated/rules.js';

export const roomView = (room, pid, online) => {
  const screens = room.screens || [];
  const isScreen = screens.some((s) => s.id === pid);
  return {
    code: room.code,
    version: room.version,
    game: room.game,
    phase: room.phase,
    hostId: room.hostId,
    youAreHost: room.hostId === pid,
    // A computer player (`bot`: its level) is always here: it has no phone to lose.
    players: room.players.map((p) => (p.bot
      ? { id: p.id, name: p.name, online: true, bot: p.bot }
      : { id: p.id, name: p.name, online: online.has(p.id) })),
    // Big screens showing the room. Not players: dealt nothing, counted nowhere.
    screens: screens.map((s) => ({ id: s.id, online: online.has(s.id) })),
    youAreScreen: isScreen,
    shared: room.shared || {},
    // The leaderboard of the night: room-level like the chat, so it survives
    // every deal and the trip back to the hub.
    night: room.night || {},
    // The audience (RoomGames.js): the last cheer, and the guesses of who will win.
    cheer: room.cheer || null,
    predict: room.predict ? { game: room.predict.game, until: room.predict.until, picks: room.predict.picks || {} } : null,
    // Less any other team's channel (أسماء الرموز); a screen reads no team's.
    chat: chatFor(room, pid),
    // A screen faces everyone, so it never receives a secret.
    you: isScreen ? null : ((room.secrets && room.secrets[pid]) || null),
    // False for someone who joined after this game was dealt.
    inGame: isScreen || !room.shared || !room.shared.roster ? true : room.shared.roster.indexOf(pid) !== -1,
    // The server's clock as this was sent: a phone that has just reloaded or joined can read a
    // running clock right away (a stamp of the last change is as old as that change).
    serverNow: Date.now()
  };
};
