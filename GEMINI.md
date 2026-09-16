# GEMINI.md - Ashry Gaming (عشرى جيمينج) 🎮

## Project Overview
**Ashry Gaming** is a party-games web app for phones: a hub of social games and utility tools with a responsive UI in Arabic and English, and dark mode. It began as a Google Apps Script web app; it is now a static site on GitHub Pages, with multiplayer rooms on Cloudflare.

- **App:** https://7an7no7.github.io/ashry-gaming/ (GitHub Pages, `master` → `/docs`)
- **Rooms server:** https://ashry-rooms.rooms-worker.workers.dev (`rooms-worker/`)
- **The old Apps Script version** is a frozen copy in `C:\Users\TPC\Apps Script\G`
  (git tag `apps-script-v177`). Its `/exec` link still works, with its own rooms; nothing
  changed here reaches it.

### Main Technologies
- **Hosting:** GitHub Pages (static files in `docs/`, built by `tools/build-site.mjs`)
- **Rooms:** Cloudflare Workers + Durable Objects over WebSockets (`rooms-worker/`, free plan)
- **Storage:** no database. Word lists are code (`SpyWords.js`, `PartyContent.js`, `ChameleonWords.js`, `SpyfallPlaces.js`, `BombPrompts.js`, the `JS_*.html` banks); names, groups and the "already dealt" memory live in each phone's `localStorage`; a room lives in its Durable Object's storage while it is played.
- **Frontend:** HTML5, CSS3, Vanilla JavaScript
- **UI Framework:** Tailwind CSS v3, compiled locally to `Tailwind.html` (see *Styling*)
- **External Libraries:** `canvas-confetti` and a QR code generator, pinned on jsDelivr

### Architecture
- **Source files at the root** are still written the Apps Script way: `Controller.html` pulls the other `.html` files in with `<?!= include('X'); ?>` and has a few `<?!= … ?>` template values. Nothing runs them on Apps Script any more; `tools/build-site.mjs` (and `build-preview.mjs`) inline the includes and fill the values in.
- **Rooms server (`rooms-worker/`):** one Durable Object per room code. The game rules are `RoomGames.js` at the root, bundled into the Worker with the word lists by `rooms-worker/build.mjs`. See *Multiplayer rooms*.
- **Frontend Entry Point (`Controller.html`):** The main HTML structure that includes styles, scripts, and various game views.
- **Modular JavaScript (`JS_*.html`):** Game logic is organized into separate HTML files acting as JS modules (e.g., `JS_Core.html`, `JS_Monkey.html`, `JS_Utils.html`), included into the main template.
- **Styling (`Tailwind.html` + `Style.html`):** `Tailwind.html` is generated - it holds
  only the Tailwind utilities the markup actually uses. `Style.html` holds the
  hand-written component CSS (cards, buttons, the animated background, view
  transitions) and is edited directly.

## Key Features & Games
- **Group Games:** 
  - 🕵️‍♂️ **Imposter (الجاسوس):** Social deduction game.
  - 🐵 **Monkey (ربع قرد):** the letter game with the phone as referee, plus
    the last-letter chain and one-name-a-turn; on one phone, in a room, on the TV.
  - 🤫 **Just One (كلمة واحدة):** Cooperative word guessing.
  - 🃏 **Screw (سكرو):** Card game scoring.
  - 🎭 **Charades (بدون كلام), 🗣️ Describe It (أوصف لي), ❓ Who Am I? (من أنا؟)**
  - 🧠 **Trivia (تحدي المعلومات):** two ways to play. *دوري المعرفة* is a board for
    two teams on one screen (five categories × 100–500 points, a host reads and
    awards); a room has everyone answer on their own phone, faster right answers
    scoring more.
- **Multiplayer-only (separate phones, see *Multiplayer rooms*):**
  - 🔠 **Codenames (أسماء الرموز):** two teams, a shared 5×5 board, a key only
    the spymasters hold. There is nowhere to hide that key on one phone.
  - 🎨 **Draw & Guess (ارسم وخمّن):** one phone draws, the rest watch it appear.
  - 🤥 **Fibbage (كذبة وصدقة):** invent an answer, then find the real one.
  - ⚖️ **Would You Rather (لو خيروك)** and 👉 **Most Likely To (مين أكثر واحد):**
    the voting engine; votes stay hidden until the round closes.
- **Puzzle/Logic Games:** Wordle, Guess the Number, 🔗 Connections (تشابه) in three
  levels: easy (3 groups, 12 cards), medium (4 groups, 16) and hard (5 groups, 20).
- **Party, one phone:** 💣 **The Bomb (القنبلة):** a category and a hidden,
  accelerating fuse, pass the phone; 🚏 **Stop the Bus (أتوبيس كومبليت):** the
  paper game with the phone as letter, clock and scorer; 5️⃣ **Five Seconds
  (خمس ثواني):** name three things in a category before the ring runs out.
- **Quiz cards, one phone or a room:** 🤔 **Emoji Riddles (فوازير إيموجي):**
  a film, a proverb, a dish or a place in emoji (`EmojiRiddles.js`); 📜
  **Complete the Proverb (كمّل المثل):** a proverb with one word missing
  (`Proverbs.js`).
- **Rooms only, no content at all:** 🙊 **Two Truths and a Lie (صدق ولا
  كذب):** everyone writes, everyone votes; 🖍️ **Draw & Write (ارسم واكتب):**
  the drawing telephone, drawn on phones and revealed on the TV.
- **Multiplayer-only, also:** 🔔 **Buzzer (الجرس):** the host asks out loud,
  every phone is a buzzer, the server keeps the order of presses.
- **Two players & solo:** 🎴 **Memory (لعبة الذاكرة)** solo against the clock
  or two on one phone; ⭕ **Tic Tac Toe (إكس أو)** against a friend or an
  unbeatable minimax.
- **Utility Tools:**
  - 👆 Who starts? (مين يبدأ؟), the finger chooser: one starts, two teams, or an order.
  - 🏆 Tournament Organizer, 👥 Team Generator, 🎡 Random Picker.
  - ♟️ Chess Clock, ⏱️ General Timers, 🎲 Dice & Coin.
  - 🀄 Domino Scorer, 🔢 Universal Counter.

## Building and Running

### Development Requirements
- Node.js 22+ and npm.
- For the rooms server: a Cloudflare login on this computer (`npx wrangler login`, once).
- For publishing the site: push access to https://github.com/7an7no7/ashry-gaming.

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

### Previewing locally

`npm run build:preview` (in `tools/`) inlines the `include()` calls and writes
`.preview/index.html`, so the whole app can be opened in a browser without
publishing. Its rooms talk to a local rooms server (`npm run dev` in
`rooms-worker/`, port 8787; `ROOMS_URL=… npm run build:preview` points it
elsewhere). Serve it over HTTP - the app writes to `localStorage`, which is
blocked on `file://`:

```bash
cd rooms-worker && npm run dev                          # one terminal
cd tools && npm run build && npx http-server ../.preview -p 4321
```

Two browser tabs on the preview behave like two phones in one room.

### Publishing
- **The app:** `npm run build:site` in `tools/`, then commit and push (`docs/`
  included). GitHub Pages redeploys in about a minute; `npm run check:live` in
  `tools/` waits for it and confirms the link serves the build in `docs/`.
- **The rooms server:** `npm run deploy` in `rooms-worker/`. Needed whenever
  `RoomGames.js`, the room word lists (`SpyWords.js`, `CodenamesWords.js`,
  `PartyContent.js`) or `rooms-worker/src/` change. Build `docs/` first: the
  deploy also uploads it as the copy of the app the Worker serves. A deploy
  restarts every open room, so wait about a minute before `npm run test:live`.
- `docs/README.md` and `rooms-worker/README.md` have the details.

### Testing

These run outside the browser and should pass before a push (CLAUDE.md has the
full order of steps for a change):

```bash
npm run check        # content + i18n
```

- `check:content` validates the game content: a Connections puzzle must have its
  level's number of groups (3 / 4 / 5), four words each, with **no word repeated across groups** (a duplicate renders two
  identical tiles and makes the grid ambiguous), Fibbage questions must contain
  a `___` blank, and the Draw & Guess / Codenames banks must be duplicate-free
  and large enough to deal from. The trivia board bank needs at least five
  questions per category and level, no question twice, and no answer written
  inside its own question.
- `check:i18n` compares the `ar` and `en` blocks key by key, fails on a key
  defined **twice** in one block (legal JS, and the last one silently wins — four
  strings were quietly the wrong ones before this check existed), and checks that
  every `data-i18n` attribute in the markup names a real key.
- `npm test` in `rooms-worker/` (with `npm run dev` running) plays every room
  game with robot players: turns, votes, scores, that secrets never reach the
  wrong phone, reconnects, the server's clocks and the shared prompt memory.
  `npm run test:live` runs the same against the deployed server.
- `npm run test:rules` in `rooms-worker/` checks the trivia scoring and question
  count straight against `RoomGames.js`, no server needed.
- Everything else is exercised in the local preview.

Client-side logs are in the browser console; the rooms server's are
`npm run logs` in `rooms-worker/`.

**Sweeping the UI.** The useful regression check is a computed-style pass over
every view in both themes, not a read of the markup: contrast ratio against the
*composited* background, tap-target size, and horizontal overflow. Two things
will make that pass lie to you:

- **Theme transitions.** `body` carries `transition-colors`, so a sweep taken
  straight after toggling `dark` reads the *old* colours mid-animation. Inject
  `* { transition: none !important; animation: none !important }` first.
- **Emoji.** They carry their own colour and ignore `color`, so every icon reads
  as a contrast failure. Skip elements whose text is only pictographic.
- **A hidden browser window.** Under `prefers-reduced-motion` every property
  change is a 0.01ms transition, and a window that isn't painting never finishes
  one. So padding, heights and a card's flip read as their old values, as if a
  rule weren't applying. Disable transitions and animations (as above) before
  measuring anything. An emulated resize also fires no `resize` event:
  dispatch one yourself, or `--app-h` keeps the old height.

## Development Conventions

### Code Structure
- **No `google.script.run`:** the page talks to nothing but the rooms server, through `Room` in `JS_Room.html`.
- **Frontend Modularization:** When adding a new game, create a new `JS_GameName.html` file and include it in `Controller.html` using `<?!= include('JS_GameName'); ?>`.
- **Translations:** All UI text goes through the `TRANSLATIONS` object in `JS_Core.html`, with the same key in `ar` and `en` (`npm run check:i18n` compares them). `data-i18n` fills an element's text, `data-i18n-ph` a field's placeholder, and `data-i18n-title` an icon button's tooltip *and* its `aria-label` - a button whose whole label is a glyph (↶) needs the last one, or it says nothing in either language.

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
| `rooms-worker/src/index.js` | The Worker: `/create`, `/join`, `/act`, `/poll`, `/leave`, `/ws`. Knows no game rules. |
| `rooms-worker/src/room.js` | `Room` Durable Object, one per code: players, keys, sockets, saving, clocks, `project()`. |
| `rooms-worker/src/memory.js` | `PromptMemory`: which prompts every room dealt lately. |
| `rooms-worker/src/live.js` | `LiveStats`: how many players are online across every room, for `GET /live`. |
| `RoomGames.js` | `applyRoomAction` — one branch per game. All rules live here. |
| `CodenamesWords.js`, `PartyContent.js`, `SpyWords.js`, `ChameleonWords.js`, `SpyfallPlaces.js`, `BombPrompts.js`, `EmojiRiddles.js`, `Proverbs.js`, `MonkeyWords.js` | Word lists the rules deal from, bundled into the Worker. The last six are also inlined into the page by `tools/build-*.mjs` (the `SHARED_LISTS` comment in `Controller.html`), because the pass-the-phone versions of those games deal from the same lists. |
| `JS_Room.html` | Client engine (WebSocket, reconnect, HTTP fallback) + the generic lobby UI. |
| `JS_RoomImposter.html`, `JS_RoomCodenames.html`, `JS_RoomGames.html`, `JS_RoomBuzzer.html`, … | Per-game renderers. |

**The rule that matters: hidden information is enforced on the server.**
Anything a player must not see goes in `room.secrets[playerId]`, and
`Room.project()` sends a player only their own slice. A Codenames operative's
state contains no colour information at all, and an imposter's payload never
contains the secret word — so there is nothing to find by inspecting network
traffic. Never move that logic client-side. Player ids are visible to everyone,
so each phone also holds a `key` the server issued to it alone; the socket and
every HTTP call must present it.

**How a move travels.** Each phone keeps one WebSocket to its room
(`/ws?code&pid&key`). On connecting it is sent the full state; after that the
room pushes a fresh projection to every phone whenever anything changes —
presence included, which is simply "has an open socket". A move is
`{ t: 'act', id, action, payload }`; the phone that moved gets `{ t: 'ack', id,
ok, state | error }` and everyone else `{ t: 'state' }`. `Room.act()` resolves
with the new state, as it always did.

- **Heartbeat:** the phone sends `ping` every 25s and Cloudflare answers `pong`
  itself (`setWebSocketAutoResponse`) without waking the room. A socket that
  doesn't answer is replaced — a phone back from the lock screen can hold one
  that looks open and is dead. Waking the screen or getting the network back
  calls `Room.refresh()`.
- **Reconnect:** a dropped socket retries after 0.3s, 1s, 2s, 4s, 8s. From the
  second miss the phone also keeps playing over HTTP (`/act`, `/poll` every
  2.5s) until a socket connects again.
- **Strokes travel as patches.** `addStrokes` goes out as `{ t: 'strokes', from,
  v, add }` — just the new strokes, applied only onto exactly version `from`;
  anything else asks the room for a full `sync`. Resending a whole drawing to
  every phone several times a second would be most of a phone's data.
- **The line under the drawer's finger** goes out as `{ t: 'live' }` through
  `Room.sendLive` / `Room.onLive`: relayed to the other phones, never stored,
  and only accepted from the current drawer.

**Where state lives.** The room object is kept in memory and saved to the
Durable Object's storage on every move (drawing and the Wavelength dial at most
once a second). A sleeping room costs nothing and wakes with its state intact.
A room deletes itself after 6 hours with no moves and nobody connected, or 24
hours with no moves at all. A host whose phone has been gone 2 minutes hands the
room to someone still here.

**Clocks the server keeps.** A timed round has to end even when no phone is
awake to end it. `roomDeadline(room)` in `RoomGames.js` says when to look again
and `roomTimeout(room, now)` acts on it: a Trivia question closes, a Draw & Guess
round reveals its word. Phones still end rounds on time themselves; the server is
the backstop a moment later.

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
presses `closeVote`. On the client, `renderBallot(state, opts)` draws the ballot
*and* the host's close button in its progress row, so a game must not add a
second one; a vote on people passes `{ ownLabel: t.vote_you }` so your own row
says "you" rather than "your answer".

**One fold for typed text.** Every place one typed word meets another goes
through `normaliseClue` in `RoomGames.js`: a Just One clue against the other
clues, a Codenames clue against the board (and a room's own words against
the bank), a Fibbage lie against the truth and the other lies, a Draw & Guess
or Fake Artist guess against the word. It folds case, diacritics, the
tatweel, أ/إ/آ/ٱ to ا, ة to ه, ى to ي, ؤ to و, ئ to ي, punctuation, spaces,
and a leading "ال" or "the", so الأسد, أسد and اسد are one word. The client
has the same function as `foldWord` in `JS_Core.html` (the Codenames clue
check on the phone, the one-phone Just One) - keep the two identical - and
`tools/validate-content.js` folds the banks the same way, so a list cannot
hold one word in two spellings. `foldStopAnswer` is the exception because in
Stop the Bus the first letter matters (see *أتوبيس كومبليت on separate
phones*). Player names fold through `samePlayer` on the phone and the same
letters on the server's join.

**The room chat.** `chat` is a room-level action in `applyRoomAction`, next
to `chooseGame`: a message (`ROOM_CHAT_MAX_LEN` characters, five per five
seconds per phone) goes on `room.chat`, the last `ROOM_CHAT_MAX`, outside any
game, so it survives the hub and every deal, and `project()` sends it to
everyone. `JS_RoomChat.html` draws the 💬 button in the header (`body.has-chat`
with the soundboard's `has-fx`, never on the TV), the sheet, the unread badge, and a
toast for a message that arrives while the sheet is closed - once, with the
history at join counted as read.

**Who is playing right now.** The مع بعض tab says "دلوقتي فيه ٧ لاعبين في ٣ غرف"
under its pitch. It counts players in rooms, never phones with the app open:
opening the app still touches no server. A room reports its own number of
players online to `LiveStats` (one instance, named "live") through
`reportLive` in `room.js`, called wherever that number can change - a join, a
socket opening or closing, a poll that brings a phone back, a leave, a move
(a player becoming a screen) - and it only sends anything when the number
changed or the last report is `LIVE_REFRESH_MS` old; `destroy` reports 0. The
Worker answers `GET /live` from a copy at most `LIVE_CACHE_MS` old, and
`LiveStats` drops a room that hasn't reported for `LIVE_TTL_MS`, so a room
that died without saying so leaves the count within a quarter of an hour. A
phone on the HTTP fallback leaves no event when it stops asking, so `create`,
`join` and a returning `poll` set the room's alarm for when that phone would
fall out of `ONLINE_WINDOW_MS`, and `alarm()` counts again and comes back for
the next one: such a phone leaves the count in about half a minute. The
phone asks once when the tab opens and once a minute while it stays on screen
and awake (`refreshTogetherLive` in `JS_Catalog.html`), and shows nothing
below `LIVE_MIN_PLAYERS` or when the server can't be reached: a count that
says "1" advertises an empty app. It carries a room count and a player count
and nothing else - no codes, no names.

**The drawing tools** are one builder, `drawToolsHtml` in `JS_RoomDraw.html`,
used by Draw & Guess (undo on the server) and ارسم واكتب (undo on the phone):
pen, line, rectangle, circle, fill and eraser; fifteen colours and a custom
swatch over the phone's colour picker, in two rows of eight; four
thicknesses with undo, redo (`draw.redo`, the strokes undo took, until the
next new stroke) and clear; Ctrl+Z / Ctrl+Y on a laptop through
`draw.onUndo` / `onRedo`.
Freehand replays as one smooth path through the midpoints (`drawStroke`);
the finger's live preview is still segment by segment, and every canvas is
replayed from the list when the stroke lands, so the pixels agree. The
guessers get the word's shape (`shared.hint`, a dash per letter) and a
near miss is flagged `close` (`stringSimilarity` ≥ 0.7 on the folded words).

**Draw & Guess strokes carry a tool letter.** `t` is absent for freehand — which
is what every stroke made before the tools existed is, so old rooms replay
unchanged — and `l`/`r`/`o`/`b` for line, rectangle, ellipse and fill. Shapes
store their two corners (4 numbers) and a fill stores one point, so they are far
cheaper than the freehand strokes they replace: a hand-drawn circle is fifty
points, the circle tool is four. The eraser is not a tool letter at all, just a
freehand stroke in the paper colour, which replays with no special case.

**The drawer must see exactly what the room sees.** That property is easy to
lose and worth testing by rendering the shared list onto a blank canvas and
diffing it against the drawer's own, pixel by pixel. Three separate things broke
it while this was being built, all of the same shape — the drawer's canvas is
built from live input, everyone else's from a replay:

  * `Room.act` emits the new state to the renderer *before* it returns, so the
    drawer's own batch came back and was painted a second time on top of itself;
  * a poll landing mid-drag repainted underneath the stroke being drawn and
    threw away the snapshot the shape rubber-band restores from, so the preview
    stacked on itself and the edges went dark;
  * freehand was drawn segment by segment live but as one joined polyline on
    replay, which blends corners differently.

The first is now handled by replaying the shared list after every send rather
than trusting the canvas to already match, the second by refusing to repaint
while `draw.drawing`, and the third by replaying freehand segment by segment
too. A full replay costs well under a millisecond and happens after every send.

**Draw & Guess draws live.** The drawer paints locally and immediately, shares
the line under the finger every 80ms (`Room.sendLive`), and sends each finished
stroke 0.2s after the finger lifts (`addStrokes`). Viewers draw the live line as
it arrives, then repaint from the room's stroke list once the finished stroke
lands (`paintStrokes` replays from the paper up when a live line was showing),
so every phone ends with the same pixels and a lost piece repairs itself. Live
pieces overlap by one point and carry their start index, so a piece arriving
out of order is dropped rather than drawn in the wrong place. Shapes and fills
are not shared live; they appear when finished.

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

Connections has three lists, one per level: `CONNECTIONS_EASY` (3 groups),
`CONNECTIONS_DB` (4) and `CONNECTIONS_HARD` (5 groups of close neighbours, like
capitals of different continents). Every group is four words with **no word
repeated across groups** — a duplicate renders two identical tiles and makes the
grid ambiguous. There is a validator for this; run it after editing content.

**Codenames.** Only the key is secret. Everything else is in `shared`:

- `settings`: the host's options from the lobby. A turn clock (`CODENAMES_TIMERS`),
  spymasters rotating each game, and the room's own words, which go on the board
  first.
- `wins`: the evening's score.
- `marks`: who suspects which card. They are public, and cleared when that card
  turns or the turn ends.
- `log`: each clue, with the cards turned under it.

A clue can't be a word still on the board (compared through `normaliseClue`). A
clue of 0 or ∞ sets `guessesLeft` to -1: no limit. With a clock, `endsAt` covers
the clue and then the guessing, and `roomTimeout` passes the turn when it runs
out.

On a phone a tap marks the card and picks it. Revealing is a second, deliberate
press (`cnLocal.pending`), so a mis-tap never costs the turn. The sides, the
options and the score survive "play again" and a trip to the hub (`_teamsMemo`,
`_cnMemo`).

**الجاسوس in rooms** ends in a vote, like the Chameleon and Spyfall rooms:
after the discussion the host opens it (`startVote`), nobody can accuse
themselves, a tie lets the spy escape, and an accused spy picks the word from
six (`shared.options`, the secret among five others of the same category).
Caught and wrong, a point to every player; escaped or guessed, two to each spy.
`revealResult` is the host's way out without a vote and scores nothing. The
word is dealt through `nextPrompt`, and `restart` keeps the scores in
`room._impScores`. **من أنا؟ in rooms** has `gotIt`: the first to press
scores 3, the second 2, the rest 1 (`WHOAMI_ORDER_POINTS`), and the round
reveals itself once everyone present has pressed.

**الحرباء, الموقع السري and القنبلة in rooms** (`chameleonRoomAction`,
`spyfallRoomAction`, `bombRoomAction`). The chameleon's board is public; each
player's secret slice carries the index of the secret word, the chameleon's
carries only its role, and the word reaches `shared` only with the result.
The spy's slice is just `role: 'spy'`; everyone else's holds the place and a
job, and `shared.locations` is a card of 24 places with the real one among
them (`SPYFALL_CARD`), so the spy has something to guess from. Both vote
through the voting engine with `ownerId` set on every option, so nobody can
accuse themselves; a tie lets the impostor slip away, and an accused
impostor gets one guess (`guess` / `spyGuess`, `skipGuess` for the host). The
spy may also `spyGuess` at any time during `play`. The Spyfall clock is a
server deadline that opens the vote by itself. The bomb's fuse is
`room._bombEndsAt`, never projected: phones get `shared.heat` (0-3), bumped by
the alarm at 40%, 65% and 85% of the fuse, and tick faster with it
(`BOMB_TICK_MS`); the bomb itself is on one phone at a time (`shared.holderId`, moved along
`shared.order` by the holder's `pass`), so when the alarm sets it off the
server strikes the holder itself (`explodeBomb`); `markLoser` lets the host
move that strike, and the loser starts the next round. Only the holder's
phone and the TV tick out loud. The strikes are the board, fewest first. `swap` deals a
new category, so it is in `DEAL_ACTIONS` in `room.js`. The three phone
renderers carry their own `TV_GAMES` entries (`JS_RoomChameleon.html`,
`JS_RoomSpyfall.html`, `JS_RoomBomb.html`).

**The five games of 15 Sep 2026** share what was already there:

- **صدق ولا كذب** (`twoTruthsAction`): each phone `submit`s three statements
  and the index of the lie; the server shuffles the three (so the lie is
  never "always the third") and keeps the index in `room._tt`. One
  storyteller at a time: their statements become vote options that all
  carry `ownerId: subject`, so the voting engine keeps them out of their
  own vote. `resolveTwoTruths` gives `TT_CATCH_POINTS` to each voter who
  picked the lie and `TT_FOOL_POINTS` per fooled voter to the storyteller.
  `closeWriting` lets the host start with whoever has written.
- **فوازير إيموجي and كمّل المثل** run on one engine (`quizAction`,
  `QUIZ_GAMES`): the deck is dealt at `start` through `nextPrompts`, each
  card reaches `shared.card` with its answer and alternatives stripped,
  `guess` compares through `normaliseClue` against `a` and `alt`, and the
  right answers score like the trivia (`QUIZ_POINTS` plus a speed bonus by
  order). `retry: true` (emoji) lets a wrong guess be shown to the table
  in `shared.feed` and tried again; `retry: false` (proverbs) takes one
  answer each. The card closes when everyone has answered, when the host
  presses `closeQuestion`, or by the server clock (`QUIZ_GRACE_MS`).
- **خمس ثواني** (`fiveSecondsAction`) deals its whole game from
  `BOMB_PROMPTS` at `start` (`room._fiveDeck`, `order × rounds`), so no
  per-turn action has to be a `DEAL_ACTION`. `go` (the player up, or the
  host) starts a five-second server clock; `roomTimeout` moves it to
  `judging`, and the host's `judge` (allowed early too) scores and advances.
- **ارسم واكتب** (`telephoneAction`) starts one chain per player with a
  phrase from `DRAW_WORDS`. Step k gives chain c to player `(c + k) % n`,
  drawing on odd steps and writing on even ones; the previous step
  travels in `room.secrets[pid].task.prev`. Drawings arrive whole
  (`submit` with `strokes`, cleaned by `cleanStrokes` under the same
  budget as Draw & Guess) because the phone keeps them locally
  (`draw.local` in `JS_RoomDraw.html` turns the per-stroke flush off).
  A step ends when everyone has sent, or by the clock through a
  `collecting` grace like Stop's. The reveal publishes one chain at a
  time (`publishTelephoneChain`): a whole evening's drawings in every
  state push would be most of a phone's data. No scores.

**ربع قرد** (`JS_Monkey.html` on one phone, `monkeyRoomAction` and
`JS_RoomMonkey.html` in rooms) referees with `MonkeyWords.js`: countries and
cities in both languages, English animals and foods, and the spy words for
Arabic animals and foods (`monkeyPool`). `monkeyFold` keeps the letters only
(hamza forms, ة/ه, ى/ي, spaces and punctuation go; the article stays, since
الجزائر is spelt with it). Three modes: `letters` spells a name one letter a
turn - a prefix that equals a name (`monkeyExact`) is closed and costs its
closer a quarter; `liar` checks the prefix against the list
(`monkeyPrefixWords`): nothing starts like that and the bluffer pays,
something does and the caller pays and sees three examples; the table can
`flip` the verdict. `chain` and `names` take one real, unused name a turn,
the chain requiring the last letter of the name before. Four quarters make
a monkey, skipped in the order and unable to act, and the host's `swap`
puts them back in someone's place. A turn clock is a server deadline; with
`autoPenalty` it costs a quarter, otherwise it only flags `timedOut` for the
host. One-phone Monkey keeps its old helpers in `JS_Utils.html` (the reorder,
the switch, mid-game players, the status edit, the timeout sheet).

**The Buzzer (الجرس)** has no content at all: the host asks their own questions
out loud and every phone is a buzzer. `buzzerAction` in `RoomGames.js` keeps
`shared.buzzes` in the order the presses reached the server, which is the one
thing a phone cannot be trusted with. The host's verdict (`correct` scores the
first in line and clears the queue; `wrong` drops them so the next in line
answers the same question) and `lock` / `arm` (buzzers off while the question
is read) are host-only. A screen never buzzes: `buzz` from a device that is not
in `room.players` is ignored. Everything is in `shared` (`board` is the sorted
scoreboard the TV strip reads), and `TV_GAMES.buzzer` draws the first buzzer
big, the queue, the scores and the host's buttons when the screen is the host.

**أتوبيس كومبليت on separate phones** (`stopAction`). The same letter goes to
every phone, each player types an answer per category, and the first to press
وقف (`submit` with `stop: true`) moves the round to `collecting`: the other
phones send whatever they have typed the moment they see that phase - before
their frame is redrawn, because the inputs go with it (`ROOM_GAMES.stop.render`
does this first) - and the server scores once all are in or after
`STOP_COLLECT_MS`. Answers wait in `room._answers`, never projected, so a
phone that finished early cannot show its sheet. Scoring is by comparison
(`foldStopAnswer`: case, diacritics, the tatweel, hamza forms, ة/ه, ى/ي and
the definite article are folded before comparing, and an answer must start
with the letter; in a round on ا itself a bare "ال…" is kept, because ألمانيا
typed without its hamza is indistinguishable from an article, and only
"ال" + a hamza letter is stripped there): 10 for an
answer nobody else had, 5 for a shared one, 0 for a blank or a wrong initial.
The table is `shared.results`; the host taps a cell to cycle its points
(`adjust`, marked `manual`), and `nextRound` banks `roundTotals` into the
totals as corrected. A timer, when the host set one, is a server clock like
the trivia one (`roomDeadline` / `roomTimeout` move `writing` to `collecting`
and then score). The host's categories, timer and rounds are remembered on
their phone (`ashryStopRoomOpts`) and sent with `start`.

**Trivia, two modes.** The room version deals from `TRIVIA_QUESTIONS` on the
server. The host picks 5, 10, 15 or 20 questions (`TRIVIA_COUNTS`). A right
answer is `TRIVIA_POINTS` (10) plus a speed bonus: +5 for the first right
answer, +4 for the second, down to nothing from the sixth. The order is the
time the server received each answer, ties going to whoever arrived first
(`seq`), and `shared.order` publishes it so every phone can show its place.

The team board (*دوري المعرفة*) is single-screen: `JS_TriviaBoard.html`, with its
own bank in `JS_TriviaBoardBank.html` — ten categories, sixteen or more questions
at each of 100–500, the higher the harder. Only facts that don't change (no
records, current title holders or "the latest"). The validator only catches a
question written twice word for word, so before adding, compare new answers with
the existing ones across *all* categories: most repeats are the same fact asked
the other way round ("what is tahini made from?" against "which sauce is made
from sesame? — tahini"). `npm run export:trivia -- <path>` in `tools/`
writes the same bank as `trivia_bank.js` for the standalone trivia page
(`trivia.html`).

A board question can run on a clock: the setup screen's switch and 15–60 seconds
(`TB_TIMER_CHOICES`, on at 30 by default, remembered with the team names in
`ashryTriviaTeams`). Tapping the clock pauses it; when it runs out the answer
shows by itself, and the host still gives the points. The open card lives in
`appState.triviaBoard.open` with a deadline (`endsAt`, or `left` while paused),
so a reload reopens it with the time it really had left.

**Big screens (شاشة العرض).** A TV, or a laptop plugged into one, joins a room
as a *screen* rather than a player: `/create` or `/join` with `screen: true`
puts it in `room.screens`, not `room.players`.

- Nothing deals to a screen: it counts toward no player minimum and is on no
  roster.
- `project()` never gives it a secret: `you` is always null and `youAreScreen` is
  true.
- It can still be the host.
- `becomeScreen` and `becomePlayer` switch a device between the two in the lobby,
  for a phone mirrored to the TV, say.

On the client, `routeRoomState` hands a screen to `renderRoomTv` in
`JS_RoomTv.html`. It draws the lobby (the code, the QR, the game picker), and
each game through its `TV_GAMES.<id>` renderer:

- `sig(state)`: when to rebuild.
- `frame(state, t)`: the markup.
- `after(state, rebuilt)`: canvases and clocks.

Every renderer draws the host's buttons too, because a room hosted from a laptop
has no phone to press them on. Rules that let the table act from the screen check
`isRoomScreen`: a Codenames guess or pass counts for the team whose turn it is.
The Wavelength dial accepts anyone except the psychic.

The view is `room-tv`: full screen, with `body.is-tv-view` and sizes from `vmin`
in the BIG SCREEN block at the end of `Style.html`. Phone components reused there
sit in `.tv-scale`, which zooms them in steps. Phone and TV frames share element
ids (the canvas, the timers), so drawing one kind clears the other. A new room
game needs its `TV_GAMES` entry as well.

**Adding a game to the room layer**

1. Add a branch to `applyRoomAction` in `RoomGames.js`. Put anything private in
   `room.secrets[playerId]`, anything shared in `room.shared`.
2. Register `ROOM_GAMES.<id>` on the client with `lobbyOptions(state)`,
   `startPayload()` and `render(state)`.
3. Add a `view-room-<id>` container and a `VIEW_META` entry.
4. Add it to `ROOM_HUB_GAMES` in `JS_Room.html` (icon, i18n key, accent, and the
   minimum player count that greys out its hub tile) and to `ROOM_GAME_IDS` in
   `RoomGames.js`.

5. If it has a clock, add it to `roomDeadline` / `roomTimeout`. If it deals from
   a list, deal through `nextPrompts` from an action named `start`, `nextRound`
   or `playAgain` (`DEAL_ACTIONS` in `room.js`), so the shared prompt memory is
   loaded for it.
6. Add a round of it to `rooms-worker/test/play-all.mjs`, then `npm run build:site`
   in `tools/` and `npm run deploy` in `rooms-worker/` — in that order, because the
   deploy uploads `docs/`.
7. Give it a `GAME_CATALOG` entry (see *The catalog and the home screen*) with
   `modes: ['room', 'tv']`, or it is not on the menu, and a `TV_GAMES` entry.

Ask for the player's name with `promptForName()`, which opens the name sheet.
Never use `window.prompt` — it is blocked in some embedded browsers. The sheet
always opens, filled in with the name last used (`roomName`, localStorage
`ashryName`), so keeping it is one tap and a new name replaces the old one; the
join screen and Settings → your name read and write the same value. On tablets
and desktop every sheet is a centred dialog (the `min-width: 640px` block in
*Sheets, modals, toasts*); phones keep the bottom sheet.

**Getting people in.** The lobby's share button (`roomShareLink`) sends the join
link through the phone's share sheet, or copies it where there is none, for
friends who aren't in the room to scan the QR. `shareOrCopy` is that same
machinery on its own, and `shareAppLink` sends the app's own link (Settings →
شارك التطبيق, and a ghost button under the three ways in on the مع بعض tab -
which is where someone is already thinking about getting people in). The join field takes a pasted
link as well as a code: `extractRoomCode` pulls the code out of either.

`?room=CODE` is read from the page's own address by the build
(`window.SERVER_DATA.room`), then removed from the address bar so a reload
doesn't reopen the join screen.

**Testing it locally.** Run the rooms server with `npm run dev` in
`rooms-worker/` and play in two tabs of the preview, or let the robots do it:
`npm test` in `rooms-worker/`.

### Team mode for بدون كلام and أوصف لي (the relay)

Both were one timed round for one player. `JS_TeamRelay.html` wraps that
round for two teams: `relayStart` names the teams and the turns each, a
handover card (`relayHandoverHtml`) says whose turn it is and starts the
round the game always ran (`charadesRunTurn`, `describeRunTurn`),
`relayTurnDone` banks the words guessed as that team's points, and the
summary card shows the turn's points and the next handover, or the final
board once every turn is played. The relay lives in the game's own slice
of `appState` (`appState.charades.relay`), the options (`teamOpts`: mode,
names, turns) too, painted back onto the setup screen by
`paintSetupOptions`. ثلاث جولات already split into teams on its own.

### Who asks whom (the ask director)

الجاسوس and من أنا؟ both end in a free discussion against a clock, and the
same two people always end up asking everything. The setup screens of both
carry a `مين يسأل مين؟` switch (`JS_Director.html`): off is the old free
discussion; `order` walks the seating order and moves the target one seat
each lap; `random` always picks the player who has asked least and the one
who has been asked least. The rotation lives in the game's own slice of
`appState` (`appState.imposter.dir`, `appState.whoami.dir`), so a reload keeps
the count, and `paintDirector` draws the "X يسأل Y" card into the play screen
(`#imposter-director`, `#whoami-director`) with a Next button. The mode is
saved per game (`appState.imposter.config.director`, `appState.whoami.director`)
and painted back onto the switch by `paintSetupOptions`.

### Player names live on the phone

`allPlayers` is a localStorage list (`PLAYER_LIBRARY_KEY` in `JS_Core.html`),
not a sheet column. It used to be the `اللاعبين` tab — one list for the whole
app, which meant every device that opened the web app saw every name anyone had
ever typed. Play once with family and the next friend to open it is looking at
your relatives. It also cost a spreadsheet write per new name before the `+`
button came back.

The app no longer reads or writes that sheet; nothing depends on it.

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

### The static site (docs/)

The app ships as a static site: `npm run build:site` (tools/build-site.mjs)
writes `docs/`, and GitHub Pages publishes it. It is the top-level page, so the
home-screen icon, the manifest, `?room=` links and the offline service worker
(`docs/sw.js`) all work. The build also writes the rooms server's address
(`roomsUrl` in `tools/site.config.json`) into the page as `window.ROOMS_URL`,
with a `preconnect` so creating a room doesn't wait for the connection.

So a change can need two releases. Client files only: rebuild `docs/` and push.
Anything the rooms server runs (`RoomGames.js`, `PartyContent.js`,
`CodenamesWords.js`, `SpyWords.js`, `rooms-worker/src/`): also `npm run deploy`
in `rooms-worker/`, or rooms keep the old rules. `docs/README.md` has the steps.

The rooms server also serves a copy of `docs/` at its own address, uploaded on
every deploy — a second address for the app if `github.io` is ever blocked.

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

### The catalog and the home screen

`GAME_CATALOG` in `JS_Catalog.html` is the registry of everything the app can
play: id, icon, title and description keys, accent, `players: [min, max]`,
`mins`, `modes` (`device` = pass one phone, `room` = everyone on their own
phone, `tv` = a room shown on a big screen), `group` (one of
`CATALOG_GROUPS`: deduce, words, party, quiz, table, duo, tools), the `setup`
view and an `open` function. **A game that is not in it is not on the menu.**
Three things are drawn from it:

- **The home** (`renderHome`): a hero with the three ways of playing together
  (open a room, join, big screen), a search box, filter chips by how you want
  to play (`HOME_FILTERS`: one phone, own phones, on the TV, two players,
  solo), the games opened recently on this phone (`ashryRecent_v1`, newest
  first, `catalogOpen` records it) and a section per group of cards -
  description, player count, minutes and mode badges. The tools are not on
  it: they have the الأدوات tab (`renderTools`), and the room games are
  listed again under مع بعض (`renderTogether`) with the three ways in and how
  a room works in three lines. `setView('menu')`
  redraws it, so the recent row is current and a search left behind is
  cleared; a language change redraws it through `applyTranslations`
  (`homeRenderedLang`). Search and the chips only toggle `hidden` on the cards
  and sections (`applyHomeFilter`), so the box keeps focus while you type.
- **The hero on every setup screen** (`syncGameHero`, called from
  `applyTranslations`, so it follows every `setView` and every language
  change): the icon, the one-line pitch, players, minutes, the modes as words
  and a 📘 rules button that opens the help sheet on that game. The setup
  screens themselves carry none of this.
- **The help sheet's** "is this a room game?" jump and the search both keep
  working from `HELP_ENTRIES`; the catalog does not replace them.

Descriptions are `cat_<id>` keys: one line, what you do, no emoji (the card
draws the icon). Titles are the game's `setup_<id>` key. A game's card, its
hero and its help entry must all agree on the icon and accent.

Setup screens whose options live in `appState` (a segmented control, the Stop
categories) are painted by `paintSetupOptions(viewId)` (`SETUP_PAINTERS` in
`JS_Core.html`) whenever the screen is reached - from a card, the back button
or a reload - so a game's `setupX()` entry point is not the only way in that
shows the saved options.

### The games' language

`contentLang()` in `JS_Core.html` is the language the games' *content* comes
in: Settings → "لغة الألعاب" (`appState.gameLang`: `auto`, `ar`, `en`,
cycled by `cycleGameLang`) can pin it, for a table that reads the app in
English but plays with Arabic words, or the reverse; `auto` follows the
app. Every bank lookup, `freshPick` key and room start payload goes through
it - `VOTE_LANG()` is now just `contentLang()` - and never through
`appState.lang`, which is the language of the interface only. The Wordle
keypad follows the content language too, since it types the word.

### The soundboard

`JS_Sounds.html` makes twelve sounds with the Web Audio API (`FX`,
`playFx(name)`): applause, ta-da, right, wrong, ba-dum-tss, the sad
trombone, a sad violin, crickets, boo, an air horn, a siren, a whistle.
Nothing is downloaded (the old board pulled mp3s from a meme site), so
they play at once and offline. `openSoundboard()` is the sheet; a 🔊
button in the header beside the gear (`#fx-fab`, shown through
`body.has-fx` which `setView` sets on `play-*` and `room-*` screens) keeps
it one tap away mid-game - it floated over the page once, where it covered
the drawing tools; and
`confetti` is wrapped so every celebration in the app brings the fanfare.

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

**The list is grouped the way the home is.** `helpSections()` in
`JS_Utils.html` puts the rooms, the big screen, the players and the settings
under "start here", then a section per `CATALOG_GROUPS` group with its games
in catalog order, then the tools; `HELP_ENTRIES` stays the registry of icon
and accent, and anything registered but not in the catalog lands in a "more"
section at the end. Every card's summary carries the catalog meta (players,
minutes, mode icons) and its body opens with the catalog's one-line pitch
(`.help-lead`) before the rules. The rules themselves have one shape: an
ordered list of how a round goes, then `.help-sub` sub-heads for
📱 separate phones, 📺 the TV, 👥 teams, 🎤 the director or 💡 tips where
they apply. Keep new rules in that shape, and never mention where content is
stored: it is code, and the sheet is not for that.

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

**A room re-renders on presence, not just on moves.** `Room`'s change signature
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

**Locked word categories carry their password in the data.** A `🔒` category
keeps its password as its first word (there are none now). Use
`spyWords(category)` / `unlockedSpyWords()` on the server rather than reading
`getSpyData()` directly, or the password gets dealt as a secret word.

**Code in `JS_*.html` does not exist on the server.** Fake Artist once dealt its
colours from `DRAW_COLOURS`, which is declared in `JS_RoomDraw.html`, and the
first `start` on the real server threw a ReferenceError. The rooms server has
only what `rooms-worker/build.mjs` bundles: `SpyWords.js`, `CodenamesWords.js`,
`PartyContent.js` and `RoomGames.js`. A constant both sides need is declared in
one of those (`FAKE_ARTIST_COLOURS` in `RoomGames.js`). `npm test` in
`rooms-worker/` starts every game, which is what catches this.

**The rules run in strict mode, on a copy.** The bundle is an ES module, so an
assignment to an undeclared variable in `RoomGames.js` throws on the server. The
rules work on a `structuredClone` of the room that only replaces it when the
move didn't throw, so a rule may throw halfway through without leaving the room
half-changed.

**`castVote` can close the vote by itself.** When the last eligible player votes
it calls `closeVote` and returns `true`. A game whose own close action does more
than close - Fake Artist reveals the fake and moves on to the guess - has to do
that same work when `castVote` returns `true`, or the table sits on a finished
vote with no way forward. And "most votes" is not `results[0]`: `results` is in
option order. Find the maximum, and decide what a tie means (in Fake Artist, a
tie lets the fake escape).

**A secret is published when it stops mattering, not when the round ends.** A
caught Fake Artist still gets to guess the word, so `secretWord` reaches
`shared` only after the guess, or after the host skips it. Put it in `shared`
at the vote and it is printed on the fake's own screen while they type.

**Ordered content leaks.** The trivia bank had the right answer second in 115 of
150 questions, so tapping B every time won. The server reorders each question's
choices as it deals. Anything with a positional answer is shuffled at deal time
rather than trusted to have been varied by hand.

**A physical axis stays left-to-right in Arabic.** Under `dir="rtl"` a range
input runs right to left while `left: 40%` still measures from the left, so
Wavelength's slider, needle and end labels disagreed in Arabic. The spectrum is
wrapped in `dir="ltr"`. The same goes for anything that maps a value to a
position on screen.

**A button stands in for something said out loud, so it has to be
take-back-able.** The phone cannot hear the table: someone presses "pass" in
القنبلة without saying a word, or "I know who I am" in من أنا؟ by mistake, and
the round is scored on it. Three shapes of answer are in the code, and a new
game should pick one rather than trusting the press: the host judges
(الجرس, خمس ثواني, دوري المعرفة), the table overrules (ربع قرد's `flip`,
أتوبيس كومبليت's `adjust`, القنبلة's `markLoser`), or the press itself can be
taken back. The last one is the newest: `sendBack` in `bombRoomAction` hands a
pass straight back to whoever made it (the holder for `BOMB_SEND_BACK_MS`, the
host at any time) and undoes the pass count, `notYet` in the من أنا؟ branch
removes a `gotIt` and refunds exactly what it paid (`shared.awards`, so the
refund cannot drift from the award, and nobody who pressed later loses
anything), and بدون كلام and أوصف لي keep a `judged` stack on the phone so
`undoCharadesCard` / `undoDescribeCard` put the last card and its point back.
A mis-tap under a clock is not rare enough to design around.

**A table that is bored has to be able to get out mid-round.** The room's
"another game" button only ever appeared once a round had ended, and on one
phone the back arrow dropped the round with no warning. `openExitSheet` in
`JS_Utils.html` now answers the header's back button (`goBack` calls it first
and does nothing else if it returns true) on any screen that would abandon
something: `exitGameOf` resolves the view's `up` through `GAME_CATALOG`, so
every game gets it and the tools do not. In a room it offers the host
`backToHub` mid-round, everyone else a "🙋 ask for another game" that posts to
the room chat, and both the menu (the room stays open) and leaving. On one
phone it offers another game, the game's own options, or carrying on.

**Leaving a room screen does not leave the room.** A player can go to the menu,
a timer or the rules mid-game; `#active-room-banner` under the header shows the
code and a way back. `Room.onChange` draws nothing while `appState.currentView`
is not a `room-*` view: every game's `render` calls `setView`, and that used to
drag people back on each poll. `roomReturnToActive()` drops the hidden view's
frame signature and goes through `routeRoomState(state)`. The shell grid pins
each child to its row, because a hidden banner otherwise lets the main area and
the nav slide up a row (a stretched nav, or none at all on a long page).

**Per-round buttons get double-tapped.** `nextRound`, `nextQuestion`, `lockDial`,
`closeVote` and `playAgain` each check the phase they are allowed from and return
quietly otherwise. Without that, a second tap skipped a trivia question, dealt two
rounds, or scored a Wavelength round twice.

**Random is not "new".** Players kept seeing the same cards after a couple of
games, and a longer list didn't fix it: most games picked with `Math.random()`,
and Charades and Describe It wiped their "already shown" list at the start of
every round. Every single-device game now deals through `freshPick(listId, pool,
count, { key, avoid })` in `JS_Core.html`, which remembers per phone
(`localStorage['ashrySeen_v1']`) what each list has dealt and only starts a list
over once all of it has been seen. `avoid` is for "already up this round" without
counting it as dealt. Rooms do the same on the server: `nextPrompts(room, pool,
key, count)` keeps the history across all rooms in the `PromptMemory` Durable
Object (through the `PropertiesService`-shaped calls it always made, which
`build.mjs` points there), because a room's own memory died with the room and
the next evening started every list from the top. A new word game should deal
through one of these, never `Math.random()` directly.

**Categories name a kind of thing.** Connections groups and the Chameleon, Who
Am I and Charades categories are kinds anyone recognises (زواحف, أندية كورة,
Months) - never riddles about a property ("حاجات بتدور", "Things with keys",
"Sea ___"), which were removed at the owner's request because players couldn't
see the link.

**Content goes in through the validator.** `npm run check` in `tools/` checks
every bank: Wordle words are exactly their length in letters the keypad has,
Describe It cards have three forbidden words, trivia choices are four different
answers, Connections tiles don't repeat inside a puzzle, and nothing is listed
twice (Arabic spelling variants count as the same word). Run it after editing any
list - a wrong-length Wordle word makes that game unwinnable, not just odd.

### Reloading mid-game

`restoreView` in `JS_Core.html` decides what happens when the page reloads while a
game is on screen. Every play view needs a branch there, or the player lands on a
blank template with no clock running and no way forward.

The view also has to be listed in `validViews` in `loadFromLocal`. A saved screen
missing from that list is reset to the menu *before* `restoreView` runs, so its
branch never fires: Connections had a branch and still reloaded to the menu until
both of its screens were added.

Two shapes:

- **Restorable** (Wordle, Guess the Number, Screw, Monkey, Domino, the counter,
  the bracket, the trivia board, and the Bomb, Stop the Bus, Memory and Tic Tac
  Toe through their `restoreX()` functions): the whole game is in `appState`,
  so the branch just redraws it. The Bomb's fuse and a Stop round's clock are
  deadlines, so they come back with the time they really had left.
  Anything that renders from state needs a `render…()` that rebuilds from
  `appState` alone — not one that only appends as events happen.
- **Not restorable** (Charades, Describe It, Just One, Who Am I, the reaction
  test): these are timed, and the remaining time is not persisted. Resuming would
  be a lie, so the branch returns to that game's setup screen and calls
  `toastRoundLost()` to say why.

When adding a timed game, prefer persisting a deadline (`Date.now() + ms`) over a
remaining-seconds count — then it becomes restorable for free. The trivia board
does this for an open question card.

A branch that reopens a popup has to wait a tick (`setTimeout(…, 0)`):
`initializeApp` closes every `.modal-overlay` *after* `loadFromLocal` has run
`restoreView`, so a card opened straight away is shut again with its clock still
running behind it.

### The design system

**Calm by default.** The backdrop is one still wash (the two cross-fading
gradient layers were a screen that never sat still); cards are white with a
hairline border and a soft shadow; the game's own colour sits on its icon
tile, the accent edge of a setup hero and the primary button, not washed
over whole cards; section titles are sentence case in the text colour; the
selected filter chip is ink on paper rather than another colour. Radii are
20px on cards and 12-14px on controls. When adding a screen, spend colour the
same way: one accented element, the rest neutral.

**The finish** is section 11 of `Style.html`: a still glow behind the top of
the page, a header that turns frosted with a hairline once the page has
scrolled under it (`.shell.is-scrolled`, set by a scroll listener in
`initializeApp`), a top light on `.btn--primary`, icon tiles with a soft
gradient and a hairline of the game's colour, grain on the home hero, hover
lifts only under a real mouse (`hover: hover` and `pointer: fine`), and the
home's cards rising in sequence. Nothing in it moves by itself; keep it that
way, and keep any new polish in that section rather than scattered.

**The dice and the coin** are section 13: a real cube of six pip faces in 3D
(`DIE_PIPS` draws the pips into a 3x3 grid, `DIE_LANDING` says what to rotate
the cube to for the value that was actually rolled, opposite faces adding to
seven) and a coin that is tossed on a wrapper while it turns on its own X axis
(`coinTurns` only ever grows, so it always spins forwards and lands heads at a
whole turn, tails half a turn past). `--die` is the cube's size, and the faces'
`translateZ` is half of it, so a short screen shrinks the whole die by changing
one value. Both fall back to the result with no motion under
`prefers-reduced-motion` - which the desktop app's preview pane reports, so
the tumble cannot be seen there without overriding both the CSS and
`matchMedia`.

**Smoothness** is section 12 of `Style.html`, with its script in
`JS_Core.html` and `JS_Catalog.html`. A phone with recents gets the home hero
folded to one row of pills (`home-hero--compact`); a game card is one shape
(icon and mode icons on one row, two lines of text, players and minutes on
one line); every setup screen's Start is moved once at start-up into a
sticky `.view-actions--start` bar at the foot of its panel
(`stickySetupStarts`, keyed on the button's `data-i18n`); the filter and
recents rows fade at the edge they can still scroll toward (`hscroll-fade`,
`watchScrollFade`); the home, مع بعض and الأدوات animate in only the first
time in a session (`settleStagger`) and come back where they were scrolled
(`viewScroll` in `setView`, on the way back only); the segmented control's
thumb slides (`syncSegmented`: the active option's place as `--seg-x` /
`--seg-w`, re-read by a MutationObserver on class changes, on each
`setView` and on resize, `has-thumb` once measured); counts are steppers
(`stepField`, `data-min` / `data-max` / `data-step` on a read-only input
with the old id, so the games read `.value` as before); Settings rows carry
a hint (`setting-row__hint`); and the lobby shows a shimmering skeleton
(`lobbySkeleton`) while a room is created or joined.

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
`.segmented`, `.switch` (inside a `<label class="switch-row">`), `.keypad` +
`.key`, `.wheel`, `.view-actions`, and the
`.modal-content` sheet (`.sheet__header` / `__body` / `__footer`).

**Popups are centred dialogs, and live under `<body>`.** `hoistModals()` in
`JS_Core.html` moves every `.modal-overlay` there at start-up: most are written
inside `<main>`, and on iPhone a fixed element inside that scrolling area is drawn
inside it - the header and the bottom nav covered the "leave room?" buttons. A
simple dialog is `.modal-content.modal-content--simple`, built only from
`.modal-icon`, `.sheet__title`, `.sheet__subtitle`, fields, `.modal-list` and
`.modal-actions` (main action first and `btn--lg`, cancel `btn--ghost`). Its gap
does all the spacing, so don't add `mt-*` / `mb-*` inside one. Help and Settings
keep the header / body / footer sheet. Full-screen tools (`FULLSCREEN_VIEWS` in
`setView`) hide the header and nav through `body.is-fullscreen-view`.

**Buttons and fields size themselves.** `.btn` is 48px (`btn--lg` 54, `btn--sm`
42), fields are 48px with one font. Don't put `py-*`, `h-*`, `text-xl` or
`font-*` utilities on them - pick a size class. The Charades and Describe It
play buttons (`h-20`) are the one deliberate exception.

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
- Never size a play screen off the viewport height (`h-[85vh]`,
  `calc(100dvh - 460px)`). Both were taller than the main area, so on a phone
  held sideways the Describe It card clipped its own forbidden words with nothing
  to scroll to, and the Draw & Guess canvas got a negative size. A timed card
  screen is `.view--stage` + `.play-stage`, which fills the main area and only
  ever grows past it.
- The shell's height is `--app-h`, which `syncAppHeight` in `JS_Core.html`
  keeps at `window.innerHeight`: iOS goes on reporting the old `100dvh` for a
  moment after the phone turns.

**Landscape phones.** A phone on its side is 360–430px tall, and laid out like
portrait the app stayed a 520px column in the middle of the screen with a third
of the height gone to the header and nav. The *LANDSCAPE PHONES* block at the end
of `Style.html` (`orientation: landscape` and `max-height: 500px`, so tablets
keep portrait's layout) makes the app full width, turns the nav into a rail at
the inline-start edge, centres views in a readable column (the menu gets more
tiles per row) and tightens spacing that only existed to fill a tall screen.

Screens with a board and its controls put them side by side there, each through
a wrapper that is plain flow in portrait:

| wrapper | screen |
| --- | --- |
| `.play-stage__playing` (`__head` / `__card` / `__actions`) | Charades, Describe It |
| `.wordle-layout` | Wordle: board beside the keyboard |
| `.draw-layout` (`__head` / `.draw-wrap` / `__side`) | Draw & Guess, Fake Artist; the canvas is sticky so the tools can scroll |
| `.cn-layout` | Codenames: board beside the clue and controls |
| `.tb-play` | دوري المعرفة: board beside the scores |
| `#view-play-chess`, `#view-play-reaction` | the two halves split left and right |

A new screen like these needs its rule in that block, and every change gets a
look at 667×375 as well as 375×667. `docs/manifest.webmanifest` says
`"orientation": "any"` so an installed app turns too; nothing generates that
file, so it is the one thing in `docs/` edited by hand.

**Tablets, laptops and TVs.** Every size in `Style.html` is in rem: spacing,
radii, button and field heights, widths. So the font size on `<html>` scales the
whole app, while a phone keeps the default 16px.

- **Root size.** The ANY SCREEN block picks a larger one on big screens: 17px
  from 1024×700, up to 32px on a 4K TV.
- **Override.** Settings → Screen size (`html[data-ui-scale]`, `cycleUiScale` in
  `JS_Core.html`) sets it by hand, for a laptop driving a TV.
- **New sizes.** Write them in rem: a px size stays phone-sized next to text that
  grew. Borders and hairlines under 4px stay px.

The layout blocks:

- **Shared** (a phone on its side, and any screen at least 900 wide): the rail,
  the centred column, and the boards beside their controls.
- **Short** (a phone on its side, 500px tall at most): tightens spacing that only
  fills a tall phone screen.
- **Wide** (at least 900 wide): more padding, wider views and bigger keys.
- **Tablet held upright:** a 45rem column.
- **Big screen view** (`room-tv`): pins the root back to 16px, because it sizes
  itself in vmin.

Check a change at 375×812, 667×375, 1280×720 and 1920×1080.

### Navigation

`VIEW_META` in `JS_Core.html` is the single registry of screens: `title` (an
i18n key for the header), `up` (where the header's back button goes) and
`accent`. Add an entry whenever you add a view — `syncChrome` derives the header
title, the back button and the nav state from it, and the slide direction comes
from comparing `up`-chain depth, so a screen with no entry gets no back button
and no title.

**The bottom bar has four tabs**: الرئيسية (the games, `menu`), مع بعض (the
rooms: `together`, or the room this phone is already in - `goTogether()`),
الأدوات (`tools`) and مساعدة. `navTabFor(viewId)` in `JS_Core.html` decides
which one a screen lights: `room-*` screens and the Codenames setup belong to
مع بعض, a screen whose help entry is in the `tools` group to الأدوات,
everything else to الرئيسية. The header shows the screen's own emoji beside
its name (`screenIcon`, from the same help entry); the home shows the brand
mark instead. `together` and `tools` are root views drawn by `renderTogether`
and `renderTools` in `JS_Catalog.html`.

Theme, language and app-level actions live in the settings sheet
(`openSettings()`), not in the bottom bar.

### Feel

Taps are acknowledged centrally: a delegated `pointerdown` handler in
`JS_Core.html` plays the click, fires `haptic()` and paints a ripple for
everything matching `RIPPLE_TARGETS`. Individual handlers should **not** add
`playSound('click')` — they only raise meaningful sounds (`success`, `alarm`,
`tick`). The delegated handler calls `playSound('click', true)`; a handler
that still clicks for itself runs on the click event, 100-200ms after the
pointerdown, which sounded like a double click on every such button, so a
click without that flag is dropped for half a second after a tap's, and taps
only collapse among themselves within 70ms.

**Icons stand on their own.** The game and tool icons (`.gcard__icon`,
`.tool-icon`, the setup and tab heroes, the help sheet) are drawn without a
tile or frame: a little bigger, a soft drop shadow, and a faint round halo
of the game's colour behind them (a radial gradient with no edge), which
the owner asked for in place of the squares. A game's icon has to be the
same in `GAME_CATALOG`, `HELP_ENTRIES` and `ROOM_HUB_GAMES`.

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
- **No sheets, no database.** Content is code, checked by `npm run check`.
- **LocalStorage:** Use local storage for transient game state (like current round scores) that doesn't need to persist across devices.
- **Rooms:** anything several phones must share goes through the rooms server; anything a player must not see stays in `room.secrets`.
