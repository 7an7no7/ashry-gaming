# docs/ — the app as a static site

Everything in this folder except this README is **generated**. Don't edit
`index.html` or `sw.js` by hand; change the source files and rebuild:

```bash
cd tools
npm run build:site
```

## What it is

The whole app — every game, the rules, the word lists — as one static page
(`index.html`), plus the home-screen icons, the manifest and a service worker
(`sw.js`). It is the same app the Apps Script `/exec` link serves, assembled the
same way the local preview is (`tools/build-site.mjs`).

What runs where:

| part | where it runs |
| --- | --- |
| single-phone games, timers, tournaments, teams | entirely in the browser |
| saved names, groups, "don't repeat words" memory | the phone's `localStorage` |
| الجاسوس word lists | inside the page (from `SpyWords.js`) |
| **rooms** (playing on separate phones) | Apps Script — see below |

Rooms need a shared server, and a static host has none. The first time a room
is used, the page loads a tiny, invisible page from the Apps Script deployment
in `tools/site.config.json` (`/exec?bridge=1`, which is `Bridge.html`) and passes
each room call through it. That page makes the call with `google.script.run` —
the same way the Apps Script version of the app does — and hands the answer
back. Only the room functions are relayed.

(A direct `fetch` to a `doPost` handler was tried and dropped: Apps Script
answers every POST with a redirect, and under load that redirect returned the
whole app page or a Drive "file not found" page instead of the answer.)

## Why a static site instead of the /exec link

- **It opens faster.** Apps Script starts a script run and builds the page on
  every open. Here the files come straight from a CDN, and after the first
  visit the phone has them cached.
- **It works offline** for everything except rooms. Apps Script serves the
  page from a sandboxed frame that isn't allowed a service worker.
- **Add to Home Screen just works.** The page is the top-level document, so iOS
  and Android see its icon and manifest. (With `/exec`, Safari only ever saw
  script.google.com's page and screenshotted the app instead.)
- **Join links work directly** — the page can read `?room=CODE` from its own
  address.

## Publishing on GitHub Pages

One time:

1. Create a **public** repository on github.com (GitHub Pages is free for
   public repositories only) and push this project to it.
2. In the repository: **Settings → Pages → Build and deployment → Deploy from a
   branch**, branch `master`, folder **`/docs`**. Save.
3. About a minute later it is live at `https://<username>.github.io/<repo>/`.

Everything in the repository is public, including the word lists and the Apps
Script deployment URL. That URL was never secret — every player's phone already
talks to it.

## Updating

- **Games, screens, text, word lists on the phone side** (`JS_*.html`,
  `Controller.html`, `Style.html`, `SpyWords.js`): `npm run build:site`, then
  commit and push. Pages redeploys in about a minute.
- **Room rules or server word lists** (`Rooms.js`, `RoomGames.js`, `Code.js`,
  `PartyContent.js`, `CodenamesWords.js`, `SpyWords.js`): also update Apps Script,
  or rooms keep running the old rules —
  ```bash
  clasp push
  clasp deploy -i <production deployment id> -d "what changed"
  ```
  `SpyWords.js` is on both lists: the page shows the words, and the room server
  deals them.
- Run `npm run check` before either — it catches wrong-length Wordle words,
  duplicates and broken content.

A phone that has the site open picks up the new version the next time it loads
the page with a connection; the service worker only falls back to its cached copy
when the network is not there.

## Things that will bite

- **Home screen on iPhone needs Safari.** Chrome and in-app browsers on iOS can't
  add to the home screen. Re-adding does not refresh a changed icon: delete the
  shortcut first.
- **The old `/exec` link keeps working** and serves the same app, just slower.
  Shortcuts made from it stay on Apps Script until they are re-added from the
  new address.
- **`*.netlify.app` is blocked** on this internet connection (measured, not
  guessed): Netlify's dashboard loads, the site itself doesn't. `github.io`,
  `web.app` (Firebase Hosting) and `vercel.app` all load.

## The icons

Generated, not downloaded — `npm run build:icons` in `tools/` redraws them.

| file | used by |
| --- | --- |
| `icon-180.png` | iOS home screen (full-bleed; iOS rounds it) |
| `icon-192.png` | Android install prompt |
| `icon-512.png` | splash screens |
| `icon-maskable-512.png` | Android launchers that crop to a circle |
| `favicon-64.png` | browser tab |
