# Room link previews and error reports (30 Sep 2026)

Two things, both free on the Cloudflare plan and with nothing to look after.

## A. A room link shows a preview in WhatsApp (and Telegram, Facebook, X, iMessage)

### How it works

- **The link is `https://play.3ashry.workers.dev/r/ABCD`** now, with `?g=<room game id>`
  when a game is chosen in the lobby, and `&l=en` / `?l=en` when the sharer's phone is in
  English. `roomInviteUrl(code, { game, lang })` in `JS_Room.html` builds it; the lobby's
  share button uses both options, the lobby's QR and the TV's QR and written address
  (`roomJoinUrl` in `JS_RoomTv.html`) use the bare `/r/CODE` (shorter, easier to scan).
  `SERVER_DATA.roomLinks` (Controller.html, filled by `build-site.mjs`: true when an
  `appUrl` is configured) switches it on; the preview build (`false`) keeps `?room=`.
  The GitHub Pages copy also shares Cloudflare links (appUrl), so `/r/` never has to work
  on GitHub. `extractRoomCode` reads a pasted `/r/ABCD` link too.
- **`site-worker/` now has a script** (`site-worker/src/index.js`) and `wrangler.toml` has
  `main`, `assets.binding = "ASSETS"` and `assets.run_worker_first = ["/r/*"]`. Only
  `/r/*` runs the script; every other request is a static-asset request as before
  (checked in `wrangler dev`: the observability spans show script runs for `/r/...` only,
  none for `/`, `/?room=`, `/og/*.jpg`). A request for a file that doesn't exist also
  reaches the script (it hands it back to the assets, a 404): a Worker request on the free
  plan's 100,000 a day, like `/r/`. Old `?room=` links, icons and QR codes are untouched.
- **`/r/CODE`** answers a small HTML page: `og:title` «ادخل الغرفة ABCD على عشرى جيمينج»,
  or with a game «تعالى نلعب الجاسوس - الغرفة ABCD» (English: "Join room ABCD on Ashry
  Gaming" / "Come play Imposter - room ABCD"), a description, `og:image` (1200x630),
  Twitter's `summary_large_image`, then a meta refresh and `location.replace` to
  `/?room=CODE` (a browser never stays on it). `cache-control: public, max-age=300`,
  `x-robots-tag: noindex`. A path under `/r/` that isn't a code: a file name (an asset
  asked for relative to `/r/` by an old offline copy, below) is served from the assets,
  anything else redirects to `/`.
- **The names** come from `docs/og/games.json`, read by the script through the assets
  binding (cached 10 minutes in the isolate), so a new room game needs nothing in the
  worker: it is in `ROOM_HUB_GAMES`, so it is in the file.
- **The pictures**: `tools/make-og.mjs` (`makeOg`, run by `build-site.mjs` on every build,
  or alone with `npm run build:og`) draws `docs/og/app.jpg` (the brand mark from
  `Logo.html` on its violet) and one `docs/og/<game>.jpg` per room game (the game's accent
  gradient from `Style.html`, its drawn `ICON_ART` icon big in the middle, the mark small
  in a corner). Everything is read from the page's own source (`TRANSLATIONS`,
  `ICON_ART`, `ROOM_HUB_GAMES`, the accents, the mark) by evaluating those literals.
  **No text in the pictures** (the title says it in the reader's language). Every room
  game has a drawn icon today; one with an emoji icon would get `app.jpg` (make-og
  reports it), since sharp's emoji rendering depends on the fonts of the machine that
  builds. The picture is centred so a square crop (WhatsApp's small preview) keeps it.
- **Size**: 71 files, 1,537 KB in `docs/og/` (JPEG q80 mozjpeg, ~22 KB each; a PNG of
  the same gradient was ~150-250 KB). `build-site` takes about 7 s more. Not in `sw.js`'s
  list and never fetched by the page, so a phone never downloads them.
- **The service worker** (`sw.js`, from `build-site.mjs`): a navigation to `/r/CODE`
  under its scope is answered with a redirect to `./?room=CODE`, so a phone with the app
  goes straight in, online or off. **A phone with an older worker** (the one live today)
  answers `/r/CODE` with the app's page itself; for that the page reads the code from the
  path too (`initialRoom` in `build-site.mjs`) and the early runtime script turns the
  address back to `/` with `history.replaceState` before anything else resolves a
  relative address; the icons and manifest the head asked for relative to `/r/` are
  served by the script from the assets. That case was reasoned through, not run (it
  needs a worker from before this change).

### Tested

- `wrangler dev` of `site-worker/` (port 8798): `/r/abcd?g=imposter` with a WhatsApp user
  agent gives the Arabic title, the game's image, the refresh and the replace;
  `?l=en` the English; a bad code redirects; `/r/icon-192.png` serves the icon; `/og/*.jpg`
  and `/?room=` never ran the script.
- Headless Chrome against a copy built with `APP_URL=http://127.0.0.1:8793/` and a local
  site worker + rooms server: the lobby QR is `/r/CODE`, the share button sends
  `/r/CODE?g=imposter`, a pasted `/r/` link gives its code, a fresh phone opening
  `/r/CODE?g=imposter` lands on `/` in the room, and a phone whose worker is in charge
  also lands in the room. (`APP_URL` is a new, test-only env for `build-site.mjs`.)

## B. Errors on players' phones reach the owner

- **The page** (`JS_Core.html`, its own first `<script>`, ES5): `error` and
  `unhandledrejection` listeners send `{ b: BUILD_ID, m: message, f: frame, v: view }` to
  `ROOMS_URL + '/err'` with `sendBeacon`. Only the published site (`STATIC_SITE`), or a
  page with `window.ASHRY_ERR_REPORT = true`; never offline; each (build, message, frame,
  view) once a page load; ten at most a load. Dropped as noise: a cross-origin
  "Script error.", the ResizeObserver loop, network failures ("Failed to fetch", "Load
  failed", AbortError...), anything from an extension, and **anything with no frame of
  the page's own code** (a console, another site's script, a missing image). The frame is
  the first stack line from the page's origin, "fn@index:line:col" (the page is one
  minified file, so line:col point into that build's `docs/index.html`).
- **The server** (`rooms-worker/src/index.js`): `POST /err` always answers 204. It keeps,
  in the `WordLog` Durable Object instance "errors": key = build | view | message @ frame.
  The message is cut to 100 characters, URLs become `<url>`, emails `<email>`, runs of 3+
  digits `#`, and **a quoted piece is kept only when it reads like code** (a property or a
  function name), so typed text, names and room codes don't survive. The frame keeps only
  `[\w$.@:<>/-]`, 56 characters. The device kind is worked out from the User-Agent header
  (ios/android/tv/desktop and chrome/safari/firefox/samsung/edge/inapp/other) and counted
  per entry (`tags`, 12 kinds at most); the UA itself and the address are never stored.
  `first` and `last` seen are kept. Rate limit: 40 an hour per address (`ERR_LIMIT`, per
  Worker instance like `/count`). The log keeps what it has once full (5,000 keys, the
  `keep` rule of 28 Sep): a new kind of error in a full log is dropped, never an old one
  pushed out - so **empty it after reading** (below).
- `WordLog` gained, used only by this log: `stamp` (first/last), `tag` (device counts) and
  `clear()`. The Stop, plays and reports logs are unchanged (their rows get no new fields).
- **Reading them**: `GET /errors` with `Authorization: Bearer <ADMIN_KEY>` (404 without),
  `DELETE /errors` empties it. `cd tools && ASHRY_ADMIN_KEY=... npm run errors` prints
  them by build, newest first, then by count, with the screen, the message, the frame, the
  devices and first/last seen; `-- --build=<id>` one build; `-- --clear` empties the log.
- **Tested**: `play-all.mjs` has `errRobots` (in the full run and alone with
  `--only=err`; reads the list when `ASHRY_ADMIN_KEY` is set): 204, one row counted twice,
  the build and view, the frame, a quoted Arabic sentence, a URL and a room code blanked,
  two device kinds, first/last, 405 for GET, 404 for the list without a key. Headless
  Chrome: an error thrown inside page code and an unhandled rejection both reached
  `/errors` under the build and `room-lobby`; the same error again in the same load was
  not sent again; an error with only console frames was not sent.

## To deploy (the owner or the lead)

1. `cd tools && npm run build:site` (writes `docs/og/` too) and commit `docs/`.
2. `cd rooms-worker && npm run deploy` (the `/err` endpoint and `WordLog` changes; no new
   Durable Object class, no migration). `ADMIN_KEY` is already a secret there.
3. `cd tools && npm run deploy:site`. **The site worker now has a script**: the first
   deploy uploads `src/index.js` with the assets; nothing to set up, no secret, no
   binding beyond `ASSETS` (in `wrangler.toml`). Check afterwards:
   `curl -A WhatsApp https://play.3ashry.workers.dev/r/ABCD?g=imposter` shows the og tags,
   and a phone opening it lands in the room. WhatsApp caches a link's preview; a link
   shared before the deploy keeps its old (generic) preview.
4. GEMINI.md: sections to add (*Getting people in*, *The static site*, a new *Errors on
   players' phones* next to *How often each game is played*, and *Traps* below). Not
   edited here, as asked.

## Decisions (open to change)

- JPEG, not PNG, for the previews (size; WhatsApp skips big images).
- The QR has no `?g=`/`?l=` (a denser QR scans worse; a scan opens a browser, which
  doesn't show a preview anyway).
- The redirect is for everyone (meta refresh + `location.replace`), not only for known
  crawlers: no user-agent list to keep up.
- The device kind is worked out on the server, not sent by the page.
- The errors log is per build in its key, so a fixed error stops appearing with the
  next build; the owner clears it with `npm run errors -- --clear`.

## Traps met

- **Port 8799 was another agent's rooms server.** A `wrangler dev` started on a port
  already in use still printed "Ready"; the test hit someone else's server. Check the
  port's owner (`Get-NetTCPConnection -LocalPort ...`) before trusting a dev server.
- **`wrangler dev` with `main` outside its folder watches from the drive root** and fails
  to rebuild ("Cannot read directory ../../../.."). Copy the script next to its
  `wrangler.toml` for a scratch config.
- **A scratch site built with `SITE_OUT` has no icons or manifest**, so its service
  worker's install (which fetches them) fails and no worker ever takes charge: copy them in.
- **Errors raised in code run through DevTools' `Runtime.evaluate` (or an injected
  `<script>`) have `<anonymous>` frames**, so the reporter rightly ignores them; to test,
  make page code throw (a `toString` that throws, passed to a page function).
- **Node 24 on Windows asserts** (`UV_HANDLE_CLOSING`, exit 127) when `process.exit`
  runs right after a few `fetch` calls; a 300 ms pause before exiting `--only=err` avoids it.
- `test:rules` failed once on the dark room's still-trap checks (a random map) and
  passed on the next two runs: unrelated to this change, but worth knowing it is flaky.
