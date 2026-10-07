# «انقل لموبايل تاني» - moving everything to another phone (7 Oct 2026)

The owner's pick A1 of 7 Oct 2026: everything a person keeps lived only in the
phone's `localStorage`, with no backup. Settings → «انقل لموبايل تاني» moves it.
And A2: the app asks the browser to keep its data.

## The owner's answers

- **Everything moves**: names and groups, «الشلة» and the quiz codes (with their
  keys), the streaks and the bests, the daily history, the saved chess games, the
  settings.
- **The code works for 24 hours and can be used more than once** in that time (a
  phone and a tablet).
- **On the new phone the data is merged, not wiped.**

## How it works

- **Files**: `app/MoveData.js` (shared: the page's chunk `move` and the rooms
  server's `FILES`) - what moves (`MOVE_KEYS`), the merge (`moveMerge`), the
  collector (`moveCollect`), the cap and its trimming (`moveFit`), the 24 hours
  (`moveExpired`); `app/JS_Move.html` (the chunk `move`) - the dialog;
  `rooms-worker/src/move.js` - `MoveStore`, one Durable Object per code
  (binding `MOVES`, migration `v7`); `rooms-worker/src/index.js` - the endpoints.
  In the shell: the Settings row, the empty popup `#move-modal` (Controller.html),
  `openMoveData()` (the door, `lzRun('move', …)`) and `keepDataAsk()` (JS_Core.html).
- **Endpoints** (bodies JSON as text/plain, answers `{ ok, … }`):
  - `POST /move/put { data }` → `{ code, key, until }`. `data` is
    `{ v: 1, at, keys: { key: text } }`; only keys of `MOVE_KEYS`, every value a
    string (else `bad`). The code is 6 letters of the packs' alphabet
    (`PACK_ALPHABET`, no O/0/I/1); `key` stops it early; `until` is 24 hours on.
  - `POST /move/get { code }` → `{ data, until }`, as often as wanted in the 24
    hours; a wrong, stopped or expired code → `not_found`.
  - `POST /move/drop { code, key }` → «وقّف الكود»: the entry is deleted
    (`denied` without the key).
- **Limits**: `MOVE_MAX_BYTES` 1 MB of UTF-8 (`too_big`; a body declared or read
  past it is answered 413 before it is parsed). A heavy phone built from the real
  shapes and word lists (every list half dealt, 20 chess games with reviews, a year
  of dailies, 60 nights, 10 quizzes) was 822 KB - the reviews 313, the "already
  dealt" lists 240, the quizzes 90 - and 459 KB without the reviews. Past the cap
  the phone trims what can be made again (`moveFit`): the chess reviews, then the
  dealt lists, then the oldest chess games, and the code sheet says what stayed
  behind. Rate limits per address, per Worker instance (`limiter`): 12 sends and
  60 reads/stops in 10 minutes - 32^6 codes can't be tried.
- **Storage**: `MoveStore` keeps `meta { at, keyHash, parts }` and the payload's
  text in pieces of 60K characters; the stop key only as its SHA-256. An alarm at
  24 hours deletes it, and every read checks the time too. Nothing is logged: an
  error names the path, never the body.

## What moves, and the merge rules (`MOVE_KEYS`, `moveMerge`)

| key | rule |
| --- | --- |
| `ashryName` | only when this phone has none |
| `ashryPlayers_v1` | both lists, each person once by the name fold (أحمد = احمد), this phone's spelling first |
| `ashry_saved_groups` | both; a group on both phones (by the fold of its name) keeps everyone in either |
| `ashryCrews_v1` | every crew with its key; one on both keeps this phone's key |
| `ashryPacks_v1` | every quiz (one code once: the later change, this phone's record id, the edit key from either); the family words: this phone's unless it has none (one pack a phone) |
| `ashryDaily_v1` | by date: both phones' days and games; a result beats a bare "done" (1) |
| `ashryDailyPlay_v1` | today's daily put aside: the other's only for a game this phone has none of |
| `ashrySoloBest_v1` | the better: `seconds`, `guesses`, `total` low, `score` high (then `tile`) |
| `ashryMemoryBest_v1` | fewer moves, then fewer seconds |
| `ashryChessGames_v1` | both, by id and by game key, newest 20 |
| `ashryNights_v1` | both, by room and day, the last 60 |
| `ashrySeen_v1` | each list's dealt items from both, this phone's order first |
| `ashryFirstPlay_v1`, `ashryPlayed_v1` | union |
| `ashryRecent_v1` | this phone's first, then the other's, 6 |
| `ashryOptions_v1` | a choice (or a field) this phone has never made comes from the other |
| `gameTrackerState_v1` | only `lang`, `gameLang`, `isDarkMode`, and only where this phone has its default; the sender sends only the ones it chose (a value at its own device's default is no choice: a light phone's default light used to turn a dark tablet light) |
| `ashryMotion`, `ashryColorShapes` | only while this phone has its default (`auto`, off) |
| the setups' own keys (`ashryTriviaCount`, `ashryStopRoomOpts`, … `ashryProgramDraft_v1`), `ashryConnections_v1`, `ashryTriviaTeams` | only when this phone has none |

Not moved, on purpose: a room's seat and the last room (`ashryRoom_*`,
`ashryLastRoom_v1`: two phones would be one player), a game in progress and
«كمّل», drafts of a round, the install prompts, the screen size (`ashryUiScale`:
a TV's 150% is no phone's), the crews' cached pages (fetched again with the key
that moved). Merging the same code twice changes nothing.

`ashryPlayed_v1` (the games a phone has started, `readPlayed` / `markPlayed` in
JS_Catalog.html) comes from another branch; it is handled by name.

## The dialog

One popup, its panes drawn by `JS_Move.html` into `#move-content`
(`modal-content--simple`): the two ways; the code shown big in six of the room
join's boxes (`.code-boxes--six`, section 70 of `Style_Talk.html`) with until
when, «الكود ده بيفتح بياناتك كلها، متدهوش لحد غيرك», share (the share sheet, or
copy) and «وقّف الكود»; six boxes to type into (an Arabic keyboard's digits are
read as 2-9, the sixth letter fetches by itself, a wrong code turns the boxes red
with a toast); and «جه: 3 أسامي، مجموعتين، شلة واحدة، … تحدي اليوم 12 يوم ورا بعض…»
(Arabic counts: one, two, 3-10 plural, 11+ singular; `mv_n_*` keys hold the four
forms). After a move the page reads its caches again (`loadPlayerLibrary`,
`seenLists`), applies the language and theme through `toggleLanguage` /
`toggleDarkMode`, the motion through `applyMotionPref`, and redraws the home, the
groups and Settings.

## A2: keeping the data

`keepDataAsk()` (JS_Core.html) calls `navigator.storage.persist()` once (after
`persisted()` says no), the first time something worth keeping is saved: a name
in the library or the room name, a crew, a pack, a daily, a move. Remembered in
`ashryPersistAsked` (kept through «حذف جميع البيانات»); never a prompt of ours -
Chrome and Safari decide by themselves, Firefox asks in its own bar.

## Tests

- `npm run test:rules`: the merge (a new phone, a phone with its own data, twice
  is a no-op, the theme's default, what is collected, the trimming, the 24 hours).
- `node test/play-all.mjs --only=move`: put, get twice (in pieces), a wrong code,
  the shape, the cap in bytes and before reading, 800 KB kept whole, stop.
  Expiry can't be stepped on a real server: the alarm and the read both use
  `moveExpired`, which the rules test steps.
- The look: `notes/archive/shots/move-data/` - a real move between two browser
  contexts and a tablet reading the same code again, at 375x667, 667x375 and
  1280x720, Arabic light and English dark.

Trap met: `wrangler dev` did not reload after `node build.mjs` rewrote
`generated/rules.js` (the old cap answered); restart it after a rebuild.
