# docs/ — the app as a static site

Everything in this folder except this README is **generated**. Don't edit
`index.html` or `sw.js` by hand; change the source files and rebuild:

```bash
cd tools
npm run build:site
```

Published by GitHub Pages at **https://7an7no7.github.io/ashry-gaming/**
(Settings → Pages: branch `master`, folder `/docs`).

## What runs where

| part | where it runs |
| --- | --- |
| single-phone games, timers, tournaments, teams | entirely in the browser |
| saved names, groups, "don't repeat words" memory | the phone's `localStorage` |
| الجاسوس word lists | inside the page (from `SpyWords.js`) |
| **rooms** (playing on separate phones) | the rooms server on Cloudflare, `rooms-worker/` |

The page learns the rooms server's address from `tools/site.config.json`
(`roomsUrl`), which the build writes into it as `window.ROOMS_URL`.

## Updating

- **Anything the phone shows** (`JS_*.html`, `Controller.html`, `Style.html`,
  `SpyWords.js`, translations): `npm run build:site` in `tools/`, commit, push.
  Pages redeploys in about a minute.
- **Room rules or room word lists** (`RoomGames.js`, `PartyContent.js`,
  `CodenamesWords.js`, `SpyWords.js`): `npm run deploy` in `rooms-worker/` as
  well — rooms run whatever was last deployed there.
- **The rooms server itself** (`rooms-worker/src/`): `npm run deploy` there.
- Run `npm run check` in `tools/` first, and `npm test` in `rooms-worker/` (with
  `npm run dev` running) after touching anything rooms use.

`SpyWords.js` is on both lists: the page shows the words, and the room server
deals them.

A phone that has the site open picks up the new version the next time it loads
the page with a connection; the service worker only falls back to its cached
copy when there is no network.

## Things that will bite

- **Home screen on iPhone needs Safari.** Chrome and in-app browsers on iOS can't
  add to the home screen. Re-adding does not refresh a changed icon: delete the
  shortcut first.
- **Everything here is public**, including the word lists. The page can't keep a
  word secret; a game that must hide something from players does it in the rooms
  server.
- **`*.netlify.app` is blocked** on this internet connection (measured);
  `github.io` and `workers.dev` load. If `github.io` is ever blocked, the rooms
  server serves a copy of this folder at its own address.
- **The old Apps Script link** is a separate, frozen copy (the `G` folder, git
  tag `apps-script-v177`). Its rooms still run on Apps Script and it gets no
  updates.

## The icons

Generated, not downloaded — `npm run build:icons` in `tools/` redraws them.

| file | used by |
| --- | --- |
| `icon-180.png` | iOS home screen (full-bleed; iOS rounds it) |
| `icon-192.png` | Android install prompt |
| `icon-512.png` | splash screens |
| `icon-maskable-512.png` | Android launchers that crop to a circle |
| `favicon-64.png` | browser tab |
