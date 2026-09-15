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

## The owner's rules

- People play on phones (the owner tests on iPhone), mostly in Arabic. A change
  has to look right at 375px wide, on a phone turned sideways (667×375) and on
  a laptop or TV (1280×720, 1920×1080), in Arabic (RTL) and English, light and
  dark.
- Popups are centred dialogs. Buttons and fields keep the app's sizes and
  spacing (*The design system* in GEMINI.md) — no one-off paddings.
- Content has to be clear to a family at a party: categories name a kind of
  thing, never a riddle ("حاجات بتدور"); trivia uses facts that don't change;
  nothing adult (the +18 spy words were removed on purpose).
- No version labels like "v9" in names, titles or on screen.
- Everything stays free and needs no looking after: GitHub Pages and the
  Cloudflare free plan. If Firebase is ever used, it goes on a different Google
  account from the one already tried.
- A finished change goes live. The owner judges by the link, not this folder, so
  follow the steps below to the end.

## Every change, in this order

1. **Edit the sources at the project root** (`Controller.html`, `JS_*.html`,
   `Style.html`, `RoomGames.js`, the word lists). Never edit `docs/` by hand.
2. Added a Tailwind class to the markup? `cd tools && npm run build:css`.
3. `cd tools && npm run check` — content and translations. Must pass.
4. Touched anything rooms run (`RoomGames.js`, `PartyContent.js`,
   `CodenamesWords.js`, `SpyWords.js`, `rooms-worker/src/`)?
   `cd rooms-worker && npm run test:rules`, then, with `npm run dev` running,
   `npm test`. Every check must pass.
5. **Look at it in the browser.** `cd tools && npm run build:preview`, then start
   `rooms-worker` and `preview` from `.claude/launch.json` (http://localhost:4321).
   At phone width, sideways and on a big screen (375×667, 667×375 and
   1280×720), in Arabic and English:
   play what you changed to the end,
   reload in the middle (it should come back, see *Reloading mid-game*), open
   Help 📘 on that screen, and check the console has no errors. A new game or
   rule needs its text in `GAME_RULES`, `HELP_ENTRIES` and `HELP_FOR_VIEW`.
6. `cd tools && npm run build:site`.
7. If step 4 applied: `cd rooms-worker && npm run deploy`, wait about a minute
   (a deploy restarts every room), then `npm run test:live`.
8. Update GEMINI.md if how something works changed. Commit everything, `docs/`
   included, and push to `master`.
9. `cd tools && npm run check:live` — waits for GitHub Pages, then confirms the
   link serves this build and the rooms server is up. Done when it says "Live."

## Everyday commands

```bash
cd tools && npm run check           # content + translations
cd tools && npm run build:preview   # the app in .preview/, rooms on :8787
cd tools && npm run build:site      # rebuild docs/ (commit it)
cd tools && npm run check:live      # is the link serving this build?
cd tools && npm run export:trivia -- <path>  # the board bank as trivia_bank.js
cd rooms-worker && npm run dev      # local rooms server on :8787
cd rooms-worker && npm test         # robot players, every room game (needs npm run dev)
cd rooms-worker && npm run test:rules  # trivia scoring, no server needed
cd rooms-worker && npm run deploy   # publish the rooms server (build the site first)
cd rooms-worker && npm run test:live
```
