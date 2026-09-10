# GEMINI.md - Ashry Gaming (عشرى جيمينج) 🎮

## Project Overview
**Ashry Gaming** is a versatile Google Apps Script (GAS) web application designed for group entertainment. It serves as a central hub for various social games and utility tools, featuring a modern, responsive UI with multilingual support (Arabic and English) and dark mode.

### Main Technologies
- **Backend:** Google Apps Script (V8 Runtime)
- **Database:** Google Sheets (for players, word categories, and statistics)
- **Frontend:** HTML5, CSS3, Vanilla JavaScript
- **UI Framework:** Tailwind CSS v3, compiled locally to `Tailwind.html` (see *Styling*)
- **Deployment & Management:** `clasp` (Command Line Apps Script Projects)
- **External Libraries:** `canvas-confetti`

### Architecture
- **Server-side (`Code.js`):** Handles `doGet` for serving the web app, manages Google Sheets interactions (CRUD for players, scores, and game data), and injects initial data into the template to reduce client-side loading times.
- **Frontend Entry Point (`Controller.html`):** The main HTML structure that includes styles, scripts, and various game views.
- **Modular JavaScript (`JS_*.html`):** Game logic is organized into separate HTML files acting as JS modules (e.g., `JS_Core.html`, `JS_Monkey.html`, `JS_Utils.html`), included into the main template.
- **Styling (`Tailwind.html` + `Style.html`):** `Tailwind.html` is generated - it holds
  only the Tailwind utilities the markup actually uses. `Style.html` holds the
  hand-written component CSS (cards, buttons, the animated background, view
  transitions) and is edited directly.

## Key Features & Games
- **Group Games:** 
  - 🕵️‍♂️ **Imposter (الجاسوس):** Social deduction game.
  - 🐵 **Monkey (ربع قرد):** Turn-based group game.
  - 🤫 **Just One (كلمة واحدة):** Cooperative word guessing.
  - 🃏 **Screw (سكرو):** Card game scoring.
  - 🎭 **Charades (بدون كلام), 🗣️ Describe It (أوصف لي), ❓ Who Am I? (من أنا؟)**
- **Multiplayer-only (separate phones, see *Multiplayer rooms*):**
  - 🔠 **Codenames (أسماء الرموز):** two teams, a shared 5×5 board, a key only
    the spymasters hold. There is nowhere to hide that key on one phone.
  - 🎨 **Draw & Guess (ارسم وخمّن):** one phone draws, the rest watch it appear.
  - 🤥 **Fibbage (كذبة وصدقة):** invent an answer, then find the real one.
  - ⚖️ **Would You Rather (لو خيروك)** and 👉 **Most Likely To (مين أكثر واحد):**
    the voting engine; votes stay hidden until the round closes.
- **Puzzle/Logic Games:** Wordle, Guess the Number, 🔗 Connections (تشابه).
- **Utility Tools:** 
  - 🏆 Tournament Organizer, 👥 Team Generator, 🎡 Random Picker.
  - ♟️ Chess Clock, ⏱️ General Timers, 🎲 Dice & Coin.
  - 🀄 Domino Scorer, 🔢 Universal Counter.

## Building and Running

### Development Requirements
- Node.js and npm (for `clasp`)
- A Google account with access to Google Apps Script.

### Styling: rebuild the CSS after changing markup

Tailwind is **not** loaded from a CDN. `tools/` compiles just the classes the
markup uses into `Tailwind.html`, which `Controller.html` pulls in via
`include()`. The full v2 CDN file was 2.9 MB, and because the markup is written
against v3 (`slate`/`orange`/`teal`, `dark:`, `h-[85vh]`, `bg-black/20`) about a
quarter of the classes in it resolved to nothing at all.

```bash
cd tools && npm install        # once
npm run build:css              # regenerates ../Tailwind.html
```

**Any time you add a Tailwind class to the markup, re-run `npm run build:css`** -
a class that is not in a scanned file will simply not exist at runtime. Use
`npm run watch:css` while working. Class names assembled by interpolation
(`` `bg-${color}-500` ``) cannot be seen by the scanner and must be added to
`safelist` in `tools/tailwind.config.js`.

`tools/` and `.preview/` are excluded from `clasp push` by `.claspignore`.

### Previewing locally

`npm run build:preview` (in `tools/`) inlines the `include()` calls, stubs
`google.script.run` and writes `.preview/index.html`, so the whole app can be
opened in a browser without deploying. Serve it over HTTP - the app writes to
`localStorage`, which is blocked on `file://`:

```bash
cd tools && npm run build && npx http-server ../.preview -p 8777
```

### Deployment Commands
- `clasp login`: Authenticate with your Google account.
- `clasp clone <scriptId>`: Clone the project.
- `clasp push`: Push local changes to the Apps Script project.
- `clasp open`: Open the project in the Apps Script online editor.
- `clasp deploy`: Create a new version/deployment for the web app.

### Testing

Three checks run outside the browser and should pass before a push:

```bash
npm run check        # content + i18n
```

- `check:content` validates the game content: a Connections puzzle must be four
  groups of four with **no word repeated across groups** (a duplicate renders two
  identical tiles and makes the grid ambiguous), Fibbage questions must contain
  a `___` blank, and the Draw & Guess / Codenames banks must be duplicate-free
  and large enough to deal from.
- `check:i18n` compares the `ar` and `en` blocks key by key, fails on a key
  defined **twice** in one block (legal JS, and the last one silently wins — four
  strings were quietly the wrong ones before this check existed), and checks that
  every `data-i18n` attribute in the markup names a real key.
- Everything else is exercised in the local preview, which runs the real server
  files against a fake CacheService — see *Testing it locally* above.

Beyond that: deploy as a web app, or use "Test deployments" in the GAS editor.
Client-side logs are in the browser console; server-side logs are in the Apps
Script dashboard.

**Sweeping the UI.** The useful regression check is a computed-style pass over
every view in both themes, not a read of the markup: contrast ratio against the
*composited* background, tap-target size, and horizontal overflow. Two things
will make that pass lie to you:

- **Theme transitions.** `body` carries `transition-colors`, so a sweep taken
  straight after toggling `dark` reads the *old* colours mid-animation. Inject
  `* { transition: none !important; animation: none !important }` first.
- **Emoji.** They carry their own colour and ignore `color`, so every icon reads
  as a contrast failure. Skip elements whose text is only pictographic.

## Development Conventions

### Code Structure
- **Server-Side (`Code.js`):** Keep logic related to Spreadsheet interactions here. Use `google.script.run` for client-server communication.
- **Frontend Modularization:** When adding a new game, create a new `JS_GameName.html` file and include it in `Controller.html` using `<?!= include('JS_GameName'); ?>`.
- **Translations:** All UI text should be managed via the `TRANSLATIONS` object (likely in `JS_Core.html`) to support both Arabic and English.

### Multiplayer rooms

Games that hide information from some players can be played on separate phones
instead of passing one around. One device opens a room; the rest join with a
4-letter code or by scanning its QR.

**A room is a group of people, not a game.** It opens with no game selected and
sits in a hub. The host picks a game, they play it, and it returns to the hub for
the next one — the roster stays put all evening, and nobody re-joins between
games. `chooseGame` and `backToHub` are room-level actions in `applyRoomAction`,
handled before it dispatches to any game.

Someone can also **join mid-round**. They aren't in that round's roster, so they
watch and are dealt into the next game. This is why each game stamps
`shared.roster` when it starts, and why the games reason about the roster rather
than `room.players`: without it, a latecomer counts as a Just One writer who
never submits and the round never advances.

**Both modes always work.** The pass-the-phone flow is untouched — the setup
screens for الجاسوس, كلمة واحدة and من أنا؟ carry a `.mode-switch` that reveals
either `.mode-device-panel` (unchanged behaviour) or `.mode-online-panel`.
Codenames is the exception: it is multiplayer-only, because on one phone there
is nowhere to hide the key card.

**Files**

| File | Role |
|---|---|
| `Rooms.js` | Transport: create / join / poll / act / leave. Knows no game rules. |
| `RoomGames.js` | `applyRoomAction` — one branch per game. All rules live here. |
| `CodenamesWords.js` | Board words, ar + en. Server-side so the deck never ships to a client. |
| `JS_Room.html` | Client engine (polling, reconnect) + the generic lobby UI. |
| `JS_RoomImposter.html`, `JS_RoomCodenames.html`, `JS_RoomGames.html` | Per-game renderers. |

**The rule that matters: hidden information is enforced on the server.**
Anything a player must not see goes in `room.secrets[playerId]`, and
`projectRoom` sends a player only their own slice. A Codenames operative's poll
response contains no colour information at all, and an imposter's payload never
contains the secret word — so there is nothing to find by inspecting network
traffic. Never move that logic client-side.

**Polls send the version they hold.** A room that has not moved answers with the
presence set alone — about 165 bytes against the 2.2 KB a full Codenames
projection costs, a 93% saving on the overwhelmingly common case. Measured: at
the watching cadence, eight players over a two-hour session went from ~13 MB
each to well under 2 MB. `pollRoom(code, playerId, knownVersion)` returns
`{ same: true, version, online }` on a match, and the client folds the online
flags into the state it already has. Presence has to travel either way — it is
the one thing that changes without bumping the version.

**Why polling.** Apps Script has no WebSockets, so `JS_Room.html` polls. Sync
lands in roughly 1-2 seconds, which suits turn-based games and nothing faster.

Cadence follows **attention, not role**: you poll fast (1.2s) when the screen is
about to change under you, and slow (2.6s) when everyone is waiting on *you* - a
spymaster typing a clue does not need updates, the operatives watching the board
do. Games declare this themselves via an optional `pollHint(state)` returning
`watching` | `acting` | `idle`; screens that only change on a deliberate button
press (the imposter discussion, the who-am-I board) return `idle` and back off to
3.2s. The lobby always polls fast, because that is where people watch for names
to appear.

Two things deliberately do **not** wait on a poll: whoever acts gets the new
state straight back from their own action call, and the imposter discussion clock
is computed locally from a shared start timestamp - so it ticks smoothly and
reads the same on every phone without any traffic at all.

**Where state lives.** `CacheService.getScriptCache()` — shared across all users,
100KB per key, 6h maximum, and no documented quota. `PropertiesService` is
deliberately **not** on the polling path: it is capped at 50,000 reads+writes per
day on a consumer account. Rooms are ephemeral by design; when one expires the
player is told the room ended rather than the app pretending to recover it.

**The voting engine.** لو خيروك, مين أكثر واحد and فيبج all run on one
implementation in `RoomGames.js`: `openVote` / `castVote` / `closeVote`, plus
`addScore` and `scoreboardOf` for the running board and `nextPrompt` for pulling
content a room hasn't seen yet.

The rule that makes voting work: **who** voted is public, **what** they voted for
is not, until the round closes. Choices live in `room._ballots` — server-side
scratch that is never projected — so a phone cannot watch the tally form and
change its mind. `openVote` takes an optional `ownerId` per option, which is how
Fibbage stops you voting for your own lie.

A vote closes on its own once every eligible player has voted, or when the host
presses `closeVote`.

**Draw & Guess and the latency ceiling.** This is the one game the polling model
is genuinely bad at, and it's built around that rather than pretending otherwise:
the drawer paints locally and immediately, strokes are **batched** and sent about
twice a second, and viewers repaint from the full stroke list so a dropped batch
repairs itself on the next poll. Expect the picture to arrive in chunks. If you
ever move the room layer to Firebase, this is the game that would improve most.

Coordinates are quantised to a 0–255 grid and packed flat (`[x,y,x,y,…]`), with a
hard budget of `DRAW_MAX_POINTS`; a stroke that would exceed it is truncated, not
dropped, so the drawing degrades rather than breaking.

**Content.** `PartyContent.js` holds Would You Rather, Most Likely To and Fibbage
server-side — Fibbage *must* be there, because its real answer cannot reach a
client before the votes are in. Draw & Guess has its own `DRAW_WORDS` list —
it used to borrow `CODENAMES_WORDS`, which is full of things nobody can draw
(وقت, حلم, صوت, سر).
Connections lives client-side in `JS_Connections.html`, because it is
single-device and has nothing to hide.

A Connections puzzle must have exactly four groups of four with **no word
repeated across groups** — a duplicate renders two identical tiles and makes the
grid ambiguous. There is a validator for this; run it after editing content.

**Adding a game to the room layer**

1. Add a branch to `applyRoomAction` in `RoomGames.js`. Put anything private in
   `room.secrets[playerId]`, anything shared in `room.shared`.
2. Register `ROOM_GAMES.<id>` on the client with `lobbyOptions(state)`,
   `startPayload()` and `render(state)`.
3. Add a `view-room-<id>` container and a `VIEW_META` entry.
4. Add it to `ROOM_HUB_GAMES` in `JS_Room.html` (icon, i18n key, accent, and the
   minimum player count that greys out its hub tile) and to `ROOM_GAME_IDS` in
   `RoomGames.js`.

Ask for the player's name with `promptForName()`, which opens the name sheet.
Never use `window.prompt` — it is blocked in embedded contexts, including the
sandboxed iframe Apps Script serves this app in.

`?room=CODE` reaches the page through `doGet` → `template.initialRoom`, because
the app runs in a sandboxed iframe and cannot read its own query string.

**Testing it locally.** `npm run build:preview` inlines the *real* server files
and runs them against fake Cache/Lock/ScriptApp services, so the preview
exercises the same rules the deployment will. The fake cache is `localStorage`,
which is shared across tabs on one origin — so two browser tabs behave like two
phones in one room. `resetPreviewRooms()` in the console clears them.

### Player names live on the phone

`allPlayers` is a localStorage list (`PLAYER_LIBRARY_KEY` in `JS_Core.html`),
not a sheet column. It used to be the `اللاعبين` tab — one list for the whole
app, which meant every device that opened the web app saw every name anyone had
ever typed. Play once with family and the next friend to open it is looking at
your relatives. It also cost a spreadsheet write per new name before the `+`
button came back.

`getPlayerList` and `addGlobalPlayer` are gone from `Code.js` and the sheet is
neither read nor written. It is left in place in case there is something in it
worth keeping, but nothing in the app depends on it.

**Names are matched, not compared.** `samePlayer(a, b)` folds case, spaces,
diacritics and the interchangeable Arabic letters (أ إ آ → ا, ة → ه, ى → ي), so
typing `احمد` when `أحمد` is saved reuses the person you have rather than making
a twin. `addToPlayerLibrary` returns the *stored* spelling for that reason —
use its return value, not what was typed.

**Every setup screen renders the same picker.** `renderActiveChips(containerId)`
draws the library as chips you tap to put someone in the round; the seven
screens with a `*-player-list` container get it for free, and it tints itself
with whatever `data-accent` that screen carries. It renders the library *plus*
any active name that is not in it, so a saved group whose members were deleted
from the library still shows the people it selected.

A saved group is still just a named list of names in `ashry_saved_groups`,
per device. Deleting a name from the library does not touch the groups.

**The picker is sized against a long library, not a short one.** Forty saved
names wrap cleanly, but they are 850px of chips, which pushes the Start button
— the control pressed every single time — off the bottom of the screen. So the
chips scroll inside a four-row box (`.picker__chips`, 216px, measured: at that
height Start still lands on the first screen for six of the seven setup
screens), and whoever is in the round is floated to the top so you can see who
is playing without scrolling. That re-sort happens on arrival and when you add
someone, **never on a toggle** — chips that move under your finger are worse
than chips in a stale order. `pickerOrder` is what holds them still.

### The home-screen icon lives outside the app

`docs/` is a small static site — icons, a manifest, and a page that shows the
app in a full-window iframe. It exists because **the icon cannot be set from
inside the app at all**.

Apps Script serves a web app inside its own iframe, so `/exec` is two documents:
Google's wrapper on top, this app underneath. "Add to Home Screen" reads only
the top one, which means every `apple-touch-icon` link, the manifest and the
splash tags in `Controller.html` were invisible to Safari — iOS found nothing
and screenshotted the page instead, which is why the icon appeared only
sometimes. Apps Script offers no way to put a `<link>` on its wrapper page:
`addMetaTag()` takes a short whitelist of `<meta>` names, and `setFaviconUrl()`
only reaches the browser tab.

So `Code.js` uses `XFrameOptionsMode.ALLOWALL` and `docs/index.html` embeds the
app, keeping the top-level origin somewhere you control. It forwards any query
string, so a `?room=` link still joins. Setup steps are in `docs/README.md`.

Icons are **drawn**, by `npm run build:icons` — iOS fetches an apple-touch-icon
exactly once, at the moment you tap Add to Home Screen, and a slow or blocked
CDN at that instant means a screenshot with no way to retry. `icon-180.png` is
full-bleed and square on purpose: iOS rounds it itself.

### The Help sheet

Help is one of the two things in the bottom nav, so it has to earn that slot.
It answers two different questions and the split matters:

1. **"What do I do on this screen?"** — the card at the top. `openHelpModal()`
   resolves `appState.currentView` through `HELP_FOR_VIEW` and renders that
   entry's rules already open, tinted in the game's own accent. In a room lobby
   with a game chosen it resolves to that game instead, because the lobby is not
   the thing you are confused about. On the menu there is no specific screen, so
   it shows a short "what this app is" card instead of a gap.
2. **"What games are there?"** — the list underneath, plus search.

Three pieces have to stay in step, all keyed by the same string:

| where | what it holds |
| --- | --- |
| `GAME_RULES` in `JS_Core.html` | the rules text, `ar` and `en` |
| `HELP_ENTRIES` in `JS_Utils.html` | title key, icon, accent, games-or-tools |
| `HELP_FOR_VIEW` in `JS_Utils.html` | which screens map to it |

**Adding a game means adding to all three.** An entry with no `GAME_RULES` text
is dropped from the list rather than rendered as an accordion that opens onto
nothing, so a missing third piece fails quietly — the browser check for it is
"does every view map to a topic, and does every topic have rules":

```js
[...document.querySelectorAll('[id^="view-"]')].map(v => v.id.replace('view-',''))
  .filter(v => v !== 'menu' && !HELP_FOR_VIEW[v])          // should be empty
```

The registry covers more than games and tools: `players` (the name field, the
shared name list, the 📂 saved-groups picker) and `settings` (everything behind
the gear) are entries too, because those were the two things with no explanation
anywhere in the app and no obvious place to put one.

**Search reads the rules, not just the titles** — people search for the thing
they are stuck on ("assassin", "قاتلة"), not for the game's name. It runs
through `helpNormalise`, which folds the Arabic spellings of the same word
together (أ إ آ → ا, ة → ه, ى → ي) and strips diacritics; without that, a search
for `اسماء` misses `أسماء الرموز`. A search that leaves exactly one result opens
it rather than asking for another tap.

**Nothing destructive lives here.** "Delete all data" used to sit in this
footer, one tap away from a rules sheet and styled almost as loudly as Close. It
belongs in Settings, which is where it now is — only.

### Traps this codebase has already fallen into

**`animationend` is never the only path.** A CSS animation that is suppressed or
cut very short fires *no* animation events at all — `prefers-reduced-motion:
reduce` sets `animation-duration: 0.01ms !important`, and at that length the
browser dispatches neither `animationstart` nor `animationend`. Any cleanup
hanging off that event therefore never runs. This has bitten twice: the ripple
(fixed with an 800ms fallback removal) and the view transition, where the
leftover `.view-enter` held its `fill-mode: both` transform and left every
screen scaled to 0.985 and shifted 26px — which also makes the view the
containing block for its `position: fixed` children. Both now have a timer
fallback *and* reduced motion drops the animation outright instead of shortening
it. If you add an animation whose end you depend on, do both.

**Opening a modal has to reset what it remembers.** The reorder list keeps a
"first tap" in `selectedReorderIndex`, and it was only cleared on confirm — so
arming a row, pressing Cancel and opening it again left the row armed, and the
next tap silently swapped two people instead of selecting one. All three callers
go through `openReorderModal(context, items, label)` now, which resets first.
Anything else with staged state across an open/close needs the same treatment.

**A poll re-renders on presence, not just on moves.** `Room`'s change signature
includes every player's online flag, so it fires whenever any phone locks or
wakes — several times a minute in a real room. A room screen that rewrites
`innerHTML` unconditionally will therefore throw away whatever the player is
typing at that moment. Use `renderRoomFrame(el, sig, build)` with a signature of
what the screen *actually shows*, and `refreshRoomPlayerStrip(el, state)` to
update the presence chips in place. When you are still composing an answer, the
count of who else has finished is not part of your screen — leave it out of the
signature or you have rebuilt the same bug.

**Server-side `start` is not idempotent by nature.** Dealing a game is guarded
centrally in `applyRoomAction` (`start` is refused unless `room.phase` is
`lobby`), because a double tap either side of a round trip used to re-deal a
board mid-turn. Per-round actions guard themselves: check the phase before
scoring, and remember that `closeVote` can be reached twice — once by the last
vote arriving and once by the host's button — so it returns whether it actually
closed anything.

**A round that ends without a winner still has to close.** Draw & Guess marks a
finished round by setting `shared.word`, not by setting `winnerId`; `giveUp`
sets the former and not the latter. Anything asking "is this round over?" must
read `word`, or it will keep accepting strokes and guesses for a word that is
already printed on every screen.

**Locked word categories carry their password in the data.** A `🔒` category in
the spy sheet keeps its password in the first cell of the column. Use
`spyWords(category)` / `unlockedSpyWords()` on the server rather than reading
`getSpyData()` directly, or the password gets dealt as a secret word — and note
that `getSpyData()` hits the spreadsheet on every call, so fetch once and reuse.

### Reloading mid-game

`restoreView` in `JS_Core.html` decides what happens when the page reloads while a
game is on screen. Every play view needs a branch there, or the player lands on a
blank template with no clock running and no way forward.

Two shapes:

- **Restorable** (Wordle, Guess the Number, Screw, Monkey, Domino, the counter,
  the bracket): the whole game is in `appState`, so the branch just redraws it.
  Anything that renders from state needs a `render…()` that rebuilds from
  `appState` alone — not one that only appends as events happen.
- **Not restorable** (Charades, Describe It, Just One, Who Am I, the reaction
  test): these are timed, and the remaining time is not persisted. Resuming would
  be a lie, so the branch returns to that game's setup screen and calls
  `toastRoundLost()` to say why.

When adding a timed game, prefer persisting a deadline (`Date.now() + ms`) over a
remaining-seconds count — then it becomes restorable for free.

### The design system

`Style.html` is a token-driven design system. Read its section header before
changing anything: colour, spacing, radius, duration and elevation all come from
custom properties in section 1, so a change happens in one place.

**Never hardcode a colour.** Use the tokens: `--accent` / `--accent-soft` /
`--accent-ink` / `--accent-on` for the current screen's colour, `--text` /
`--text-2` / `--text-3` for copy, `--surface` / `--surface-solid` /
`--surface-2` / `--surface-3` for backgrounds, `--success` / `--danger` /
`--warning` for meaning. Everything resolves correctly in both themes.

**Per-screen colour comes from `data-accent`.** `setView` reads `accent` out of
`VIEW_META` (in `JS_Core.html`) and sets it on the view, and every component
inside re-tints itself — that is what gives each game its own identity with no
per-game CSS. The eight palettes are violet, indigo, blue, teal, green, amber,
orange and rose. `--accent-on` is the ink that reads on a filled accent, and it
differs per palette per theme: white on violet, near-black on amber.

**Colours that text sits on need an "on" token.** `--accent-on` is not the only
one: `--success-on` / `--danger-on` / `--warning-on` (paired with
`--success-btn` / `--danger-btn` / `--warning-btn`) exist because white is not
readable on every semantic colour, and *which* one it fails on flips between the
themes — white on the light green is 3.8:1, on the dark amber 2.2:1. Solid
buttons, Wordle tiles and Wordle keys all read through these. Never put `#fff`
on `var(--success)` and assume it holds.

**For markup built in JS**, where a Tailwind palette class cannot follow the
theme, use the semantic text utilities: `.tx-success`, `.tx-danger`,
`.tx-warning`, `.tx-accent`, `.tx-muted`, `.tx-strong`, and the `.plate-danger`
/ `.plate-success` tinted plates. A hardcoded `text-slate-400` is 2.3:1 on the
page background; these resolve through the same tokens as everything else.

**Buttons carry importance, not decoration.** One `.btn` base plus a tier:
`.btn--primary` (the one action the screen exists for), `.btn--secondary`,
`.btn--ghost` (retreat/dismiss), `.btn--neutral`, and `.btn--danger` /
`--success` / `--warning` / `--danger-soft` for meaning. Sizes are `.btn--lg`,
default, `.btn--sm`, `.btn--xs`; `.btn--auto` opts out of full width. The old
`btn-blue`/`btn-orange`-style classes only survive as aliases so a stray one
still renders as a button — do not add new uses.

Other components: `.card`, `.section` + `.section__title`, `.eyebrow`,
`.game-card`, `.tool-item`, `.row` / `.status-row`, `.chip`, `.badge`,
`.metric`, `.empty`, `.field` + `.field__label`, `.input-group`, `.stepper`,
`.segmented`, `.keypad` + `.key`, `.wheel`, `.view-actions`, and the
`.modal-content` sheet (`.sheet__header` / `__body` / `__footer`).

### Layout: the app shell

`Controller.html` is a three-row grid — header, scrolling `<main>`, nav — and
the nav is a **grid row, not a fixed overlay**, so content can never end up
hidden behind it. That used to clip the Wordle keyboard's Enter row and the tail
of every long player list.

- Put a bottom action bar in `.view-actions` (sticky inside the scroll area).
  Do not use `position: fixed` inside a view: the view is transformed while its
  enter animation runs, which makes it the containing block and the bar drifts
  into the middle of the content.
- A screen that must fit exactly rather than scroll (a board plus a keyboard)
  gets `class="view--fill"`.
- Respect the safe-area tokens (`--safe-top`, `--safe-bottom`) rather than
  guessing at notch padding.
- Minimum touch target is 44px (`--tap`); nothing interactive should measure
  under ~40px on a 375px-wide screen.

### Navigation

`VIEW_META` in `JS_Core.html` is the single registry of screens: `title` (an
i18n key for the header), `up` (where the header's back button goes) and
`accent`. Add an entry whenever you add a view — `syncChrome` derives the header
title, the back button and the nav state from it, and the slide direction comes
from comparing `up`-chain depth, so a screen with no entry gets no back button
and no title.

Theme, language and app-level actions live in the settings sheet
(`openSettings()`), not in the bottom bar.

### Feel

Taps are acknowledged centrally: a delegated `pointerdown` handler in
`JS_Core.html` plays the click, fires `haptic()` and paints a ripple for
everything matching `RIPPLE_TARGETS`. Individual handlers should **not** add
`playSound('click')` — they only raise meaningful sounds (`success`, `alarm`,
`tick`). `playSound` de-duplicates clicks within 70ms.

Motion uses the `--ease-*` and `--dur-*` tokens. Everything is gated behind
`prefers-reduced-motion`, and the drifting background animates `opacity` on a
fixed layer so it costs no repaints.

### Arabic and RTL

- Use logical properties (`padding-inline`, `inset-inline-start`,
  `margin-inline-start`), never `left`/`right`, or the layout mirrors wrongly.
- Do not apply `letter-spacing` to Arabic text — Arabic letters join, and
  spacing pulls the joins apart. `html[lang="ar"]` already neutralises it on the
  small-caps labels and on `.metric`; `text-transform: uppercase` is a no-op in
  Arabic anyway. If you hand-roll a label with `uppercase tracking-widest`
  instead of using `.eyebrow`, you have re-introduced the bug — use the class.
- Numerals and clocks use `.metric`, which isolates them to LTR. It also renders
  Arabic *words* (the Just One and Fibbage answers), which is why its tracking is
  reset for Arabic rather than left at -0.02em.
- A translation string must not carry an emoji when the element that shows it
  already renders an icon of its own — the home tiles, the tool rows and the room
  hub all do, and the emoji then appears twice as soon as the language is
  toggled (the markup's fallback text has no emoji, the translation did).

### UI/UX Standards
- **Responsive Design:** Use Tailwind CSS classes to ensure the app works well on mobile devices (the primary target).
- **Dark Mode:** Prefer the design-system tokens, which handle both themes. Raw
  `dark:` utilities do work (the build sets `darkMode: 'class'` and the toggle puts
  `dark` on `<body>`) but a token is almost always the better answer.
- **Timers:** Use `createClock()` from `JS_Core.html` for anything that counts
  seconds - never `setInterval` with a decrementing counter. Mobile browsers
  throttle background timers, which froze the old counters whenever the screen
  locked. `createClock` reads elapsed time from `Date.now()` and exposes
  `pause`/`resume`/`toggle`/`stop`/`value`.
- **Inline handlers:** When interpolating a value into an `onclick="fn('...')"`
  attribute, wrap it in `jsStringAttr()`, not `escapeHTML()` - the latter's `&#39;`
  is decoded back to a bare quote before the JS is parsed, which breaks the handler
  for any name containing an apostrophe. Use `escapeHTML()` for text content.
- **RTL Support:** The app defaults to RTL (`dir="rtl"`) but handles LTR for English.

### Data Management
- **Sheets:** Ensure `setupSheets()` is updated if new sheets or columns are required for a game.
- **LocalStorage:** Use local storage for transient game state (like current round scores) that doesn't need to persist across devices.
