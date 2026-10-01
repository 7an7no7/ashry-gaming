# The static site, the icons, the home screen, the play counter and reports

Moved from GEMINI.md on 30 Sep 2026. GEMINI.md keeps the rules that apply to every game and an index; this file keeps the detail, word for word.

## From GEMINI.md: Multiplayer rooms

**How often each game is played** (the improvement plan, Phase 0, the owner's
yes of 25 Sep 2026). The same `WordLog` class keeps a second instance,
"plays": a count per mode, month and game id (`lang` is `device`, `room` or
`tv`, `cat` the month `2026-09`, `word` the game). A room counts when a game
is dealt from the lobby (`act` in `room.js`: `start` taking the room out of
`lobby`; `tv` when a screen is in the room). A game on one phone counts when
it is started from its setup screen: `countPlay` in `JS_Catalog.html` (an
`onLeaveScreen` hook from a `setup-*` view to a view whose `exitGameOf` is a
game) sends `navigator.sendBeacon(ROOMS_URL + '/count', { game })`, never
while offline. `POST /count` keeps the id and the month and nothing else - no
name, no address - and takes 120 an hour from one address (`COUNT_LIMIT`). It
keeps only an id the app has (`APP_GAME_IDS` in `GameIds.js`, bundled into the
Worker; `npm run check` fails when it and `GAME_CATALOG` differ, so a new game
goes in both), and the "plays" and "reports" logs keep what they have once full
(5,000 keys): an entry marked `keep` that would be a new key is dropped, never
an old one pushed out (the audit of 28 Sep 2026: any id was taken, and a full
log evicted its lowest counts, reading and sorting all 5,000 rows each time).
Opening the app still touches no server. `GET /plays` (the admin key, as
`/stop-words`) and `cd tools && ASHRY_ADMIN_KEY=… npm run plays [-- --month=2026-09]`
print every game by how often it was started, split phone / room / TV. What
it is for: the owner's rule that rarely played games go behind «كل الألعاب»
(still there and searchable), never removed.

**«في غلطة؟» reports** (the improvement plan, Phase 3, 25 Sep 2026). Under a
revealed answer - the trivia board's card, the emoji riddle and the proverb on
one phone - a quiet button (`reportBtnHtml(game, text)` in `JS_Catalog.html`)
sends the item to `POST /report` (the game, the content language and up to 160
characters of the item; no name, no address), kept by a third `WordLog`
instance, "reports" (`long: true` lifts the 40-letter cap for these; the game
must be in `APP_REPORT_IDS`, the catalog's ids and `triviaboard`, and a
`reportBtnHtml('<id>'` the check can't find there fails `npm run check`). `GET
/reports` and `npm run reports` list them by game, most-reported first; they
are fixed in the bank by hand, then `npm run check`. A new content game puts
the button under its revealed answer too.

### The static site (docs/)

The app ships as a static site: `npm run build:site` (tools/build-site.mjs)
writes `docs/`, and GitHub Pages publishes it. It is the top-level page, so the
home-screen icon, the manifest, `?room=` links and the offline service worker
(`docs/sw.js`) all work. **Opening the app answers from the copy on the phone**
(the owner's decision of 23 Sep 2026, after GitHub Pages sent the 1.6 MB page at
20-60 KB/s and the app sat on its logo for most of a minute): the worker of a
build saved that build's page when it was installed, and every open is that
page at once (73 ms, 0 bytes, measured). The network is asked only by a phone
with no copy yet. A new build is a new `sw.js`, which the browser looks for as
the app opens, and the page asks again when it comes back to the screen (at
most every 10 minutes, `reg.update()`); installing it downloads the page once,
past the browser's HTTP cache (`cache: 'reload'`: GitHub's `max-age=600` could
hand back the build before), and keeps it under `./` and `./index.html` both -
it used to download the whole page twice. Only good answers are cached,
and the pinned CDN files are cache first (an opaque answer from them is kept
too: the fonts' stylesheet is fetched without CORS, and refusing it left the
app with no fonts offline), in a cache of their own kept across builds,
`cdn-pinned` (1 Oct 2026: in the build's cache every release deleted
three.js, the fonts and the confetti and QR copies). **Everything outside rooms works offline after
one visit**: the fonts, confetti and the QR load before the worker is in
charge on a first visit, so once a worker controls the page it asks for them
again through it (`warm` in `registerServiceWorker`, five seconds in, almost
always answered from the browser's own cache). Checked on 22 Sep 2026 with the
server switched off: the home, the daily hub, Sudoku, Wordle, القنبلة and the
timers, in the app's own fonts. The build also writes the rooms server's address
(`roomsUrl` in `tools/site.config.json`) into the page as `window.ROOMS_URL`,
with a `preconnect` so creating a room doesn't wait for the connection.

So a change can need two releases. Client files only: rebuild `docs/` and push.
Anything the rooms server runs (`RoomGames.js`, the lists in `FILES` in
`rooms-worker/build.mjs`, `rooms-worker/src/`): also `npm run deploy`
in `rooms-worker/`, or rooms keep the old rules. `docs/README.md` has the steps.

**The app's second address: https://play.3ashry.workers.dev** (the
owner's decision of 23 Sep 2026, after GitHub Pages sent the page at 20-80 KB/s).
`site-worker/wrangler.toml` is a Cloudflare Worker with no code, only static
files - `docs/` - so it is free and unlimited (requests to static files cost
nothing), stores nothing, and publishing it restarts no room. Every release
publishes it (`npm run deploy:site` in `tools/`, CLAUDE.md step 7) and
`check:live` fails unless it serves the same build (`backupUrl` in
`tools/site.config.json`). GitHub stays the main link; this is the fast one to
share. A phone keeps separate saved data per address (names, settings, bests),
and a room link shared from a phone uses the address that phone is on - both
reach the same rooms. (A first try with `wrangler pages project create`, run
inside `rooms-worker/`, deployed a whole second rooms server named
`ashry-gaming` instead of a Pages project - wrangler's Pages is now Workers and
it took that folder's config. The owner deleted it the same evening. Run
wrangler for the second address from `site-worker/` only.)

The rooms server also serves a copy of `docs/` at its own address, uploaded on
every deploy — a third address for the app if `github.io` is ever blocked.

**The published page is minified, and has a size budget** (the improvement
plan, Phase 2, 25 Sep 2026). `build-site.mjs` runs every inline script and
style through esbuild (`transform`: whitespace and syntax, **names kept** -
every script shares one scope and the markup calls functions by name), drops
HTML comments and indentation, and fails the build when the page is over
`BUDGET_KB` (1,800 KB gzipped since 30 Sep 2026, the owner's word when the ideas batch reached 1,751; 1,750 from 29 Sep 2026, raised on purpose for the five new room games - الشاهد took the page to 1,609; 1,600 before, 1,347 at the start; loading a game's code only when it opens is the way to win room back). A script that parses as
ES5 is kept ES5 (it tries `target: 'es5'` first), so the browser gate still
runs where nothing else does; everything else stays within ES2017, the page's
floor. `charset: 'utf8'` matters: without it esbuild writes every Arabic
letter as `\uXXXX` and the page *grows* (*Traps*). `MINIFY=0` builds the page
as written; the preview (`build-preview.mjs`) is never minified, so debugging
reads the source. Raise the budget on purpose, never to get a build through.

**New builds reach an open app.** When a new build's worker takes over a page
(`controllerchange`) that is older than it (the build writes its id into the
page, `window.BUILD_ID`, the same stamp as the cache name in `sw.js`; the page
asks `sw.js` for its stamp and stays quiet when they match), the new build is
already on the phone, so switching is a fraction of a second. **It switches by
itself when nothing is lost** (`appUpdateQuiet`, `appUpdateSafeView` in
`JS_Core.html`): under the intro; on the home, مع بعض or الأدوات with no room
open, no popup, no field being typed in and no tap for 4 seconds; or when the
app goes to the background on one of those or a setup screen. Anywhere else -
a game, a room - a tappable toast says a new version is ready and the page
waits for one of those moments; a game is never reloaded under a player (a
timed round on one phone can't come back from a reload). So the first open
after a release can show the build before for a moment. Settings → تحديث
البيانات (`updateApp`) asks for `sw.js` first and opens the new build as soon
as it has downloaded; with nothing new it is a plain reload. Checked on 23 Sep
2026 against the built site with three builds in a row: idle on the home it
switched by itself, in a Sudoku game it showed the toast and stayed, back on
the home it switched, the game kept. A phone opening the
app for the first time starts in its own light or dark theme, and
`<meta name="theme-color">` follows the page's background.

**History: rooms used to run on Apps Script.** The page relayed calls through a
hidden iframe of the `/exec?bridge=1` page (`Bridge.html`): Apps Script has no
WebSockets, and a `fetch` to `doPost` went through a 302 that, under load,
returned the whole app page instead of the answer. Moves took 2–4 seconds to
reach the other phones. That version is frozen in the `G` folder (git tag
`apps-script-v177`).

The spy words used to be read from the `كلمات الجاسوس` sheet on every page load.
They are `SpyWords.js` now - shared by the page and the rooms server - and the
locked "+18" category was removed at the owner's request. A 🔒 category would
ship inside the public site anyway, so a lock only hides words from the menu; it
cannot keep them secret.

### The brand mark and the icons

The mark is the name twice on a deep violet: "Ashry" large in Poppins Black
with an amber full stop, and عشري smaller underneath in Reem Kufi with its
five dots in the same amber. `tools/make-icons.mjs` is the one source: it
writes `Logo.html` (an `<svg><symbol id="ashry-mark">` the page includes
once) and every PNG in `docs/` (`icon-180` full-bleed for iOS, `icon-192` /
`icon-512` rounded, `icon-maskable-512` with the artwork inside the safe
80%, `favicon-64`). Anywhere in the app draws it with
`<svg class="mark"><use href="#ashry-mark"/></svg>`: the loader, the header
on the home screen (`.shell__title--brand`) and the home hero. The words are
outlines in `tools/assets/wordmark.json`, written by
`tools/shape-wordmark.py` (fontTools + HarfBuzz, so the Arabic joins
properly; the five dots are whatever the dotless spelling عسرى lacks) from
the two fonts as downloaded from Google Fonts - the font files are not kept
in the repo - so the mark needs no font and renders identically before Cairo
loads, on a home screen and in the script. `npm run build:icons` in `tools/`
(sharp rasterises the SVG). Do not edit `Logo.html` or the PNGs by hand.

The owner chose this design (number 28) from a sheet of 28 wordmarks on
15 Sep 2026; the ع monogram it replaced is in the history before that commit.

**The icon has a version** (`iconVersion` in `tools/site.config.json`). The
build puts it on every icon address (`icon-192.png?v=2`, in the head links and
in `docs/manifest.webmanifest`, which it rewrites) and into the page as
`window.ICON_VERSION`. A changed address is what makes Android refresh an
installed icon by itself. iOS fetches the apple-touch-icon once, when the app
is added, and no page can add itself again, so `checkIconBanner` in
`JS_Utils.html` notices an iPhone copy running standalone whose marker
(`ashryInstalledIcon`) is older than the build's icon and shows one banner
with the steps: remove, "open in Safari" (a `_blank` link to
`?install=1`, which opens the add-to-home-screen sheet there), add again. A
copy with saved names but no marker was added before the marker existed, so
it counts as the old icon; a fresh install counts as the current one. "Later"
snoozes a week; "Done" or "keep it" writes the current version. Bump
`iconVersion` whenever the mark changes.

The mark comes in six colourways (`VARIANTS` in the script: deep, violet,
midnight, paper, ocean, sunset); `iconVariant` in `tools/site.config.json` is
the one the app ships with (deep), and `node make-icons.mjs --preview <dir>`
renders them all side by side to choose from. The words, the full stop and
the dots are the same in every one - only the colours change.

### Putting it on the home screen

A phone that opens the app in its browser is asked, once a visit, to add it
to the home screen (`#install-help-modal`, `maybeAskInstall` in
`JS_Utils.html`). `installTarget()` reads the user agent: an iPhone or an
Android phone (Android with "Mobile" - tablets and TVs don't say it; iPads
never count), and which browser, because the steps differ: Safari (Share,
then Add to Home Screen, with ⋯ first where the bar is folded), Chrome and
the others on iPhone (their Share button), Chrome, Samsung Internet and
Firefox on Android, and the browser inside Instagram, Facebook, TikTok or
the Google app, which cannot add anything, so its steps say to open the link
in Safari or Chrome first. The steps are translation keys (`inst_*`) with
`{share}`, `{add}`, `{more}`, `{dots}` and `{menu}` drawn as small key
glyphs; English menu names inside the Arabic steps are wrapped in `<bdi>` or
their brackets flip. On Android, when Chrome fires `beforeinstallprompt`,
the phone's own bar is suppressed and the sheet shows one "install" button
instead of steps (`installNow`); `appinstalled` closes it.

When: never in the home-screen copy, never over a game, a room or another
popup - it waits (`installAskSoon`, from `setView` on the home, مع بعض and
الأدوات and from the end of the intro) - **never before this phone has
played something** (`ashryPlayedOnce`, set when a game's `play-*` screen or
a room game's screen is left; opening a setup doesn't count; the owner
agreed, 22 Sep 2026: a first visit had the sheet straight after the intro,
before a single game, which is when it is easiest to dismiss), and at most
once a visit: a visit
is a page load at least `INSTALL_VISIT_GAP_MS` (30 minutes) after the last
ask (`ashryInstallAskedAt`), so a reload mid-evening doesn't ask again and
the next evening does. Dismissing it is just closing it. "ضفته خلاص"
(`ashryInstallHaveIt`) stops it in that browser for good, since a browser
cannot see the home-screen copy on its own. Settings → تثبيت التطبيق opens
the same sheet on any device, with computer steps off a phone.

**A link never opens the home-screen copy on an iPhone.** iOS gives a web app
on the home screen no way to claim its links: a room link from WhatsApp opens
Safari, and Safari cannot tell that the home-screen copy exists (their
storage is separate, which is also why names saved in one aren't in the
other). Nothing on the page can change that. On Android, an app installed
through Chrome usually does receive its own links.
