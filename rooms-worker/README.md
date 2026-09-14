# rooms-worker — the rooms server (Cloudflare)

Multiplayer rooms for Ashry Gaming, on Cloudflare Workers + Durable Objects
(free plan). Every phone keeps a WebSocket open to its room, so a move reaches
the other phones in well under a tenth of a second, from any network.

- Live: https://ashry-rooms.rooms-worker.workers.dev
  (`/test` is a connection test page; `/` serves a copy of the app from `../docs`)
- The app finds it through `roomsUrl` in `../tools/site.config.json`.

## How it works

| file | role |
| --- | --- |
| `src/index.js` | the Worker: sends `/create`, `/join`, `/act`, `/poll`, `/leave` and `/ws` to the right room |
| `src/room.js` | `Room`, one Durable Object per room code: players, keys, WebSockets, saving, clocks |
| `src/memory.js` | `PromptMemory`: which prompts all rooms dealt lately |
| `src/page.js` | the `/test` page |
| `build.mjs` | bundles the rules and word lists from the project root into `generated/rules.js` |
| `test/play-all.mjs` | robot players for every game |

The game rules are **not** in this folder: they are `RoomGames.js` at the
project root, with the word lists in `SpyWords.js`, `CodenamesWords.js` and
`PartyContent.js`. `build.mjs` runs by itself before `dev` and `deploy`.

- **Secrets stay here.** A phone is only ever sent its own slice of
  `room.secrets`, and proves who it is with a key only it was given.
- **Clocks.** Trivia questions and Draw & Guess rounds end on the server when
  time is up (`roomDeadline` / `roomTimeout` in `RoomGames.js`); a host gone for
  2 minutes hands the room to someone still here; a room deletes itself after 6
  hours with nobody in it (24 hours at most).
- **Cheap on purpose.** Heartbeat pings are answered by Cloudflare without
  waking the room, quick moves (drawing, the dial) are saved at most once a
  second, and new strokes go out as just the new strokes.
- **Fallback.** A network that won't hold a WebSocket plays over plain HTTP
  (`/act`, `/poll`) instead, automatically.

## Commands

```bash
npm run dev        # local server on http://127.0.0.1:8787
npm test           # robot players against the local server (npm run dev first)
npm run deploy     # publish - also uploads ../docs, so build the site first
npm run test:live  # robot players against the live server
npm run logs       # live logs from the deployed server
```

`npx wrangler login` once per computer.

## Why it keeps working untouched

- `compatibility_date` in `wrangler.toml` pins the runtime's behaviour, so
  Cloudflare's updates don't change how this code runs.
- Free plan, no card: 100,000 requests a day (20 WebSocket messages count as
  one), 100,000 saved changes a day, 5 GB of storage; a sleeping room costs
  nothing. Past a limit, calls fail until 00:00 UTC — nothing is ever charged.
  A game night uses a few percent.
