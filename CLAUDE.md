# Ashry Gaming (عشرى جيمينج)

Arabic-first (RTL, ar/en) party-games web app for phones.

- **App:** static site in `docs/`, built from the sources in `app/`, `styles/`,
  `rooms/`, `content/` and `games/<id>/` (one folder per game) by
  `tools/build-site.mjs`. **The main address is Cloudflare**:
  https://play.3ashry.workers.dev (`site-worker/`, `npm run deploy:site`) - every
  link the app shares points there. The same build stays on GitHub Pages
  (`master` → `/docs`), https://7an7no7.github.io/ashry-gaming/, so old icons,
  links and QR codes keep working. Every release goes to both.
- **Rooms** (playing on separate phones): `rooms-worker/`, Cloudflare Workers +
  Durable Objects over WebSockets: https://ashry-rooms.3ashry.workers.dev
- **The old Apps Script version** is a frozen copy in `C:\Users\TPC\Apps Script\G`
  (git tag `apps-script-v177`). All new work happens here; don't change that folder.

The guide is GEMINI.md — read it before changing anything. It holds what applies
to the whole app (decisions, build and test, conventions, traps) and an index;
each game's full spec and how it is built is in `notes/games/<id>.md`, the log in
`notes/log.md`. Read a game's file before changing that game:

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
- A new way to play a game we already have is not a new card on the home: it
  goes inside that game's card, the way chess holds its six ways (`hub` in
  `GAME_CATALOG`, the ways row, one tile in a room's list; GEMINI.md, *Chess is
  one card*). Only a game of its own, with its own name, gets its own card.
- New games and screens use the motion toolkit wherever it fits (GEMINI.md,
  *Using the motion toolkit in a new game*): reveals, podiums, flights, count-ups.
- Keep the guide current, so the next person or AI can carry on. GEMINI.md
  (always loaded, keep it small): what applies to every game, the traps met on
  the way, the decisions, and one index line per game. The detail goes in the
  topic files: a game's spec and how it works in `notes/games/<id>.md` (a new
  game gets a new file and an index line), the day-by-day log in `notes/log.md`,
  ideas in `notes/ideas.md`, the long versions of rooms / design / site in
  `notes/rooms.md`, `notes/design.md`, `notes/site.md`. When changing a game,
  update its file and, if what it covers changed, its index line.
- A finished change goes live. The owner judges by the link, not this folder, so
  follow the steps below to the end.

## Every change, in this order

1. **Edit the sources**: a game's in its folder `games/<id>/` (its `JS_*.html`,
   `Room*.js`, lists, and its words and rules in `<id>.text.js`); the app's in
   `app/` (`Controller.html`, `JS_Core.html`, `JS_Translations.html` for words
   more than one game uses, `Games.js`, `Common.js`), `styles/`, `rooms/`
   (`RoomGames.js`), `content/` (the shared word lists). Never edit `docs/` by
   hand. A new game starts with `cd tools && npm run new:game -- <id> --ar "…"
   --en "…"` (GEMINI.md, *A new game, start to finish*).
2. Added a Tailwind class to the markup? `cd tools && npm run build:css`.
3. `cd tools && npm run check` — content, translations and names (a name
   declared twice, or used and never declared). Must pass.
4. Touched anything rooms run (`Games.js`, `RoomGames.js`, any `Room*.js`, any word list the server
   bundles - the `FILES` in `rooms-worker/build.mjs` - or `rooms-worker/src/`)?
   `cd rooms-worker && npm run test:rules`, then, with `npm run dev` running,
   `npm test`. Every check must pass.
5. **The screen test**: with `npm run dev` running in `rooms-worker/`,
   `cd tools && npm run test:ui` (every screen at three sizes, every room game on
   five phones and a TV, the offline copy and its updates; about 4 minutes in
   shards, or `ONLY=rooms` etc. for a part; `npm test` about 5). Every check
   must pass. **Test what changed** (the owner, 25 Sep 2026: the suites in a row
   took 35-40 minutes): `cd tools && npm run test:changed` runs the checks, the
   robot segments and the screen-test parts the changes since master need
   (`--dry` shows the plan); otherwise a small change runs `npm run check`, `test:rules` and only the parts it touches
   (`ONLY=screens` for a screen or a setup, `ONLY=rooms` for a room client,
   `ONLY=site` for the offline copy; `npm test` and `test:live` only when step 4
   applies); the full run is for big releases (an audit's fixes, a new game, a
   change to many games). When the owner wants to play something now, publish
   after the quick checks and the browser look, run the full tests afterwards,
   and put any fixes in a separate push. Then
   **look at it in the browser.** `cd tools && npm run build:preview`, then start
   `rooms-worker` and `preview` from `.claude/launch.json` (http://localhost:4321).
   At phone width, sideways and on a big screen (375×667, 667×375 and
   1280×720), in Arabic and English:
   play what you changed to the end,
   reload in the middle (it should come back, see *Reloading mid-game*), open
   Help 📘 on that screen, and check the console has no errors. A new game or
   rule needs its text in `GAME_RULES`, `HELP_ENTRIES` and `HELP_FOR_VIEW`.
6. `cd tools && npm run build:site`.
7. If step 4 applied: `cd rooms-worker && npm run deploy`, wait about a minute
   (a deploy restarts every room), then `npm run test:live`. Always:
   `cd tools && npm run deploy:site` - the app's second address on Cloudflare
   (https://play.3ashry.workers.dev), the same `docs/`; it restarts
   nothing.
8. Update the guide if how something works changed (the game's
   `notes/games/<id>.md`, a line in `notes/log.md`, GEMINI.md for anything
   app-wide). Commit everything, `docs/`
   included, and push to `master`. GitHub Actions checks every push (`npm run
   check`, `test:rules`, the site's build and budget): a red ✗ on the commit
   means fix it and push again.
9. `cd tools && npm run check:live` — waits for GitHub Pages, then confirms the
   link serves this build and the rooms server is up. Done when it says "Live."

## Everyday commands

```bash
cd tools && npm run check           # content + translations + names
cd tools && npm run new:game -- <id> --ar "…" --en "…" [--modes room,device] [--dry]  # a new game, wired in everywhere
cd tools && npm run build:preview   # the app in .preview/, rooms on :8787
cd tools && npm run build:site      # rebuild docs/ (commit it)
cd tools && npm run check:live      # are both addresses serving this build?
cd tools && npm run deploy:site     # the second address (Cloudflare) - every release
cd tools && npm run test:ui         # every screen, every room game, the offline copy, in shards (needs npm run dev)
cd tools && npm run test:changed    # only what the changes since master need (-- --dry: the plan)
cd tools && npm run export:trivia -- <path>  # the board bank as trivia_bank.js
cd tools && npm run build:icons     # the brand mark (Logo.html) and the icons in docs/
cd tools && npm run plays           # how often each game is started (ASHRY_ADMIN_KEY)
cd rooms-worker && npm run dev      # local rooms server on :8787
cd rooms-worker && npm test         # robot players, every room game, 4 segments at a time (needs npm run dev)
cd rooms-worker && npm run test:rules  # trivia scoring, no server needed
cd rooms-worker && npm run deploy   # publish the rooms server (build the site first)
cd rooms-worker && npm run test:live
```
