# Ashry Gaming (عشرى جيمينج)

Arabic-first (RTL, ar/en) party-games web app for phones.

- **App:** static site in `docs/`, built from the root `*.html` / `*.js` sources
  by `tools/build-site.mjs`, published by GitHub Pages (`master` → `/docs`):
  https://7an7no7.github.io/ashry-gaming/
- **Rooms** (playing on separate phones): `rooms-worker/`, Cloudflare Workers +
  Durable Objects over WebSockets: https://ashry-rooms.rooms-worker.workers.dev
- **The old Apps Script version** is a frozen copy in `C:\Users\TPC\Apps Script\G`
  (git tag `apps-script-v177`). All new work happens here; don't change that folder.

The full guide is GEMINI.md — read it before changing anything:

@GEMINI.md

## Everyday commands

```bash
cd tools && npm run check           # content + translations
cd tools && npm run build:site      # rebuild docs/ (commit it)
cd rooms-worker && npm run dev      # local rooms server on :8787
cd rooms-worker && npm test         # robot players, every room game (needs npm run dev)
cd rooms-worker && npm run test:rules  # trivia scoring, no server needed
cd rooms-worker && npm run deploy   # publish the rooms server (build the site first)
cd rooms-worker && npm run test:live
```
