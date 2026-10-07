# «الشلة» (the crew) - the builder's notes (30 Sep 2026)

Built on the `crew` branch on 30 Sep 2026; live since (rooms server and site).
The keys and the manager's power were reworked in the review of 1 Oct 2026
(*The keys* below).

## What it is

A family or a group of friends kept across evenings: a code and a link / QR (no
accounts, no passwords, like rooms), the month's table (nights won, then points),
a champion a month on a wall kept for good, playful titles and records from real
play, and every night's history. A night counts only when its room was opened
«للشلة»; one-phone games never count. The page is look ج «كارنيه النادي»
(`notes/archive/sheets/next-level-looks.html`).

## How it works

### The rules (`Crew.js`, root, bundled into the rooms server; plain functions)

- `crewNewCode(rnd)`: 6 letters from `CREW_ALPHABET` (no I, L, O). `crewCleanCode`
  reads a typed code or a pasted `/s/CODE` / `?crew=CODE` link.
- `crewDateOf(ts)` / `crewMonthOf(ts)`: Cairo time (`Africa/Cairo`), the night's
  start less 6 hours - a night that runs past midnight stays on the day it began.
- `crewNightInput(room)`: what a room sends its crew: `{ id, start, games, rows:
  [{ name, member, points }], wins: [{ name, member, g }], best, tally, pred }`,
  from `room.night` (the night's leaderboard, 5/3/2 and 1 for everyone else who played, a game, `bankNightPoints`) and
  `room.nightx` (what `bankNightPoints` and `settlePredictions` note beside it:
  names, first places, record scores, the rooms' own tallies, right guesses).
  Computer players are left out; a leaver keeps their name.
- `crewCleanNight(input, members, now)`: a night as the crew keeps it; a row's
  member is the id the room proved (`crewLinks`) or the folded name (`crewFold`,
  أحمد = احمد); anyone else is a guest (`m: null`). One room name per member a
  night: a proven link claims first, then a name match; a second claim on a
  member already taken is a guest (and `crewTable` counts a member once a night).
- `crewTable(nights, members, month)`: every member, sorted by nights won, then
  points, then nights played. `crewNightWinners`: the rows on top (a tie is a win
  for each; a guest alone on top means no member won).
- `crewTitles`: the month's titles - `CREW_TITLE_GAMES` maps a first place in a game
  to a title (fast, liar, detective, cards, brain, words, sport, luck), the rooms'
  own tallies add to two (`s.fastest` → fast, `s.bestLiar` → liar), the audience's
  right guesses make `oracle`. A title needs someone alone on top with 2 or more.
- `crewRecords`: best bowling and trivia scores (`CREW_RECORD_GAMES`), most points
  in a night, most games won in a night, the longest run of nights won, the most
  nights in a month - over the nights kept.
- `crewView(meta, nights, now, you)`: the page's whole payload (worked out when
  asked). `crewFreezeChamps`: a past month's champion frozen into `meta.champs`
  two days after the month ends (kept even when old nights are dropped).

### The server (`rooms-worker/src/crew.js`, the `Crew` Durable Object, binding `CREWS`, migration v5)

- One object per code. Storage: `crew` (name, `managerId`, `members [{ id, name,
  at }]`, `keys { key: { m, at, u, mg, c } }` (*The keys* below), `keysV`, `pair`,
  `champs`, `packs`, `activeAt`) and one key a night, `n:<id>`. At most 30 members, 400
  nights (the oldest go; champions are frozen first), 30 packs, 6 keys a member
  (`CREW_KEYS_PER_MEMBER`; which one goes: *The keys*). The nights are read only after a key
  has been checked and a page is to be drawn (`loadMeta` / `loadNights`): a wrong key costs
  one storage read, not one per night (the review of 1 Oct 2026).
- Endpoints (`index.js`, JSON as text/plain like the rooms): `/crew/create { name,
  me }`, `/crew/join { code, claim | name }` (a name already there, folded, is
  refused as `NAME_TAKEN` with its id: the sheet says "tap your name"), `/crew/peek
  { code }` (name and members, never a key or a night), `/crew/get { code, key }`,
  `/crew/act { code, key, action, payload }`. `create` and `join` are limited per
  address (30 in 10 minutes, `CREW_LIMIT`), and `peek` too (120 in 10 minutes,
  `crewPeekAllowed`: a hit names every member, and a member is claimed with the code), and
  `get` / `act` (600 in 10 minutes, `crewUseAllowed`: a script trying keys).
- Actions: `rename`, `renameMember`, `removeMember`, `handOver`, `pairCode` (a manager key
  only: `crewKeyIsManager`), `pair { code }` (the manager's other phone), `leave` (anyone; a
  manager leaving hands the crew to whoever has been in longest; the last member leaving
  deletes the crew; from a phone in by a claim only that phone goes, `{ phoneOnly: true }`),
  `addPack` / `removePack` (any member / the one who added it or a manager key). The page
  gets `mgr` (this phone runs the crew) beside `managerId` and draws the manager's buttons
  from it (`crewIsMgr`; a page from before falls back to the id, the server decides).

### The keys (the review of 1 Oct 2026)

The code alone lets a phone in, and «إنت مين فيهم؟» (`/crew/join { claim }`) gives a key for
any name, so a member id proves nothing: anyone with the code could claim the manager's
name and take everyone out or delete the crew. The manager's power is now a **key's**
(`Crew.js`, `crewIssueKey`, `crewKeyIsManager`):

- a key is `{ m, at, u, mg, c }`: its member, issued, last used, a manager key, given by a claim;
- `create` gives a manager key; joining as someone new a member key (the member's own phone);
  a **claim** a member key marked `c` - never the manager's, whoever's name it is;
- **«ضيف موبايلك التاني»** (the manager's members sheet): `pairCode` makes 6 digits for 10
  minutes (`crewPairMake`); the manager's other phone taps their name, opens «الأعضاء» and
  types it (`pair`, `crewPairUse`): its key becomes a manager key. Five wrong tries void it;
  another member's key can't use it;
- **handing over** and the manager leaving (`crewSetManager`): the new manager's own keys (not
  claims) become manager keys - all of theirs if a claim gave every one, so a crew always has a
  way to be run - and every other key stops being one;
- **leaving from a claimed phone** forgets that phone only: a claim can't take a member out,
  nor end the crew and its history by leaving as its last member;
- **past 6 keys a member**, the least recently used *claimed* key goes (`u`, noted on every
  get and act, kept with the next write), so claiming a name again and again only pushes out
  other claims, never the phone the member joined with or a manager's; with no claimed key
  left, a claim is refused («الاسم ده داخل من موبايلات كتير») and a pairing drops the least
  recently used of the rest;
- **keys from before** (`crewKeysMigrate`, once, `keysV: 2`): every key the manager's id held
  becomes a manager key (a phone that ran the crew keeps running it, including one that
  claimed it before the change), and each member's first key is their own, the rest claims.
- A key that no longer proves a member answers `{ out: true }` (a member taken out:
  all their phones), a crew gone `{ gone: true }`; the page forgets it then.
- A crew nobody touches for a year deletes itself (an alarm at `activeAt` + 1
  year; a write moves it, a page view at most once a day).

### A room's night (`rooms-worker/src/room.js`)

- `setCrew { code, key }` (the host, in the lobby - the hub or a game chosen but
  not started): the room checks the key with the crew itself (`verify`, server to
  server) and keeps only `room.crew = { code, name }` (projected to every phone by
  `view.js`), `room.crewNight` (the night's id) and `room.crewLinks[pid] =
  memberId`. **The key is never kept in the room.** `setCrew {}` / `{ code: '' }`:
  not for a crew. Moving to another crew takes the night back from the old one
  (`dropNight`).
- `crewMe { code, key }`: any player's phone that is a member says which member it
  is (sent once a room by `JS_CrewCore.html`), so a room name that differs from the
  crew name still maps. Refused by the crew (the member taken out, the crew gone),
  it isn't sent again for that room - it used to go out on every state - and the
  phone asks the crew once (`crewRefresh`), which forgets it if it is out; a
  network failure tries again after 30 s.
- **When a night is sent**: whenever the night grows (a game banked on the way back
  to the hub, a guess settled - `act` compares `night` and `nightx` before and
  after) and when the room closes (`destroy`: the idle clean-up, or the last person
  leaving - the game still on the table is banked first, as the hub would). Always
  the whole night under one id, so the crew replaces it: never counted twice, never
  lost when nobody presses anything. Not waited on by the move.
- Server-to-server API for other features (a stub: `env.CREWS.get(env.CREWS.idFromName(code))`):
  `verify(key)` → `{ ok, memberId, memberName, name, code }`; `recordNight(input)`
  (the shape of `crewNightInput`: any results table can be sent, under an id of your
  own, and sent again to replace it); `dropNight(id)`; `attachPack({ code, kind,
  title, by })`; `listPacks()`.

### The page (`JS_CrewCore.html` in the shell, `JS_Crew.html` the chunk `crew`)

- The phone keeps `ashryCrews_v1` = `{ list: [{ code, name, memberId, key, me,
  at }] }` (`at`: used last) and a copy of each crew's last page, `ashryCrewCache_v1`
  (a reload or no network still shows it).
- Client API for other features (shell): `crewList()` (no keys, used last first),
  `crewCurrent()`, `crewApi(path, body)`, `crewAct(code, action, payload)`,
  `crewAddPack(code, { code, kind, title })`, `crewRemovePack(code, packCode)`,
  `crewInviteUrl(code, name)`, `openCrews(then)`.
- Doors: the مع بعض tab's card (`crewTogetherHtml`: make / join, or the last used
  and "+N"), Settings → الشلة, a link `/s/CODE?n=<name>` (the site worker's preview
  page «انضم لـ «X» على عشرى جيمينج», then `/?crew=CODE`; the offline copy
  redirects `/s/CODE` the same way), and `?crew=CODE` (read in `SERVER_DATA.crew`,
  taken off the address by the build's runtime). `initCrews` opens the join sheet.
- The view `crew` (`VIEW_META`: up `together`, violet; the مع بعض tab lights):
  several crews → chips on top; the card (name, code, faces, «موسم سبتمبر · اليوم 30
  من 30»; a tap opens the members); ادعي (the code big, its QR, the share sheet),
  الأعضاء, افتح غرفة (a room opened for this crew); the tabs (`.segmented`, the
  thumb slides; the pane slides in from its side): الشهر (a `.podium` of the top
  three by nights won - the cast figures dress it by themselves - the rest of the
  table, three peek cards), الأبطال (the wall), الألقاب (title cards, then the
  records), السهرات (date, games, winner, top three with guests marked).
- The sheets are one centred `#crew-modal`: make, join (code → «إنت مين فيهم؟» a
  chip a member, the one matching the phone's saved name ringed, or «أنا جديد»),
  invite, members (the manager's ✏️ 👑 ✕, rename the crew, leave), the room's pick.
- Joining adds every member's name to the phone's saved names
  (`addToPlayerLibrary`), and sets the phone's room name if it had none.
- The room: a phone in a crew opens a new room for the crew it used last
  (`crewAutoForRoom` after `Room.create`); the lobby shows «السهرة دي محسوبة لـ «X»
  ✏️» (the host's pick sheet) or «السهرة دي للشلة؟» to a host with crews; a guest
  sees the line with «انضم للشلة»; the hub's night board offers a guest «انضم لـ
  «X»» once the night has points. When a screen hosts the room, a member phone with
  crews gets the host's line and sends `setCrew` itself (the audit of 6 Oct 2026).
- Motion: the card rises in, the podium rises with the cheerers (`podium--rise`,
  once per state with `motionFirst`), numbers count up, cards pop in one after
  another, the tab's pane slides, confetti on a crew made or joined.

## Decided while building (open to change)

- **A night is one room session** opened for a crew: every game banked on its night
  board, 5/3/2 and 1 for everyone else who played, a game (the room's «ليلتنا» points, the rule of 30 Sep 2026). Its date is the room's
  opening, Cairo time, less 6 hours. The most points wins the night; a tie on top is
  a win for each tied member.
- **Guests count on the night** (they can win it; then no member does), never on the
  table. Computer players are left out of the crew's night.
- **The host changes the crew only in the lobby** (between games); switching takes
  the night from the old crew and gives the whole night to the new one.
- **A phone in a crew opens every new room for the crew it used last**; the host
  taps the line to change it or turn it off. (The owner: "the room shows the last
  used"; asking at every room would be a tap more each time.)
- **Leave = out of the crew** (the member and all their phones; from a phone that only
  tapped the name, just that phone - 1 Oct 2026); the manager leaving
  hands management to the longest-standing member; the last one leaving deletes it.
  The manager taking someone out is the same, from their side.
- **A member taken out keeps their past nights' rows** but leaves the table; a
  champion frozen on the wall keeps the name it had.
- **Claiming a member needs only the code** (as rooms need only the code): «إنت مين
  فيهم؟» gives any phone that member's key - a member's key: running the crew is a key's
  power (*The keys*, the owner, 1 Oct 2026). A member may have 6 phones.
- **Titles are the month's** (the season); records are over every night kept (400).
  Title groups: fast (الجرس، الكراسي، خمس ثواني، حط إيدك، عربيات التصادم، الحقوا! + the room
  trivia's first right answers), liar (كدّاب، كذبة وصدقة، صدق ولا كذب + its best
  liar, المزاد، جمجمة), detective (the spy games, مافيا، الفنان المزيف، الشاهد، خمّن
  مين), cards, brain (تحدي المعلومات، قبل ولا بعد، الخزنة, chess and puzzles, the duels,
  حرب السفن، العقل…), words (the talking and drawing games, دندنها، لو خيروك، مين
  أكثر واحد…), sport (بولينج، ميني جولف), luck (لودو، السلم، بنك الحظ، القنبلة), oracle
  (the audience's right guesses). Every room game is in one group (`rules.mjs` fails on one
  that isn't; the review of 1 Oct 2026 added seven and moved the trivia from words to
  brain); a tournament counts as its duel. Never a "worst" title.
- **The link carries the crew's name** (`/s/CODE?n=…`) so the site worker's preview
  needs no lookup (nothing to look after, no cross-worker call); `?crew=CODE` on the
  preview build and GitHub Pages.
- **Champions are frozen two days after the month ends** (a room open across the
  last midnight still sends its night); the wall shows an unfrozen past month
  worked out on the fly meanwhile.

## Traps met

- **Two `lzRun` calls share one key** ('nav'): `setView('crew')` (which waits for
  the chunk) and then `lzRun('crew', openSheet)` replaced the first, so a `?crew=`
  link opened the sheet over the home. `openCrews` does both in one `lzRun`.
- **The podium's cast figures are added by a MutationObserver (a microtask)**: a
  check in the same evaluate as the redraw sees none; look in the next task.
- `bankNightPoints` is called by older rules tests with rooms that have no
  `players`: guard `(room.players || [])`.
- `jsStringAttr` returns the value without quotes: write `onclick="f('${jsStringAttr(x)}')"`.

## Tests (30 Sep 2026, a local rooms server on :8791)

- `npm run check`: passes (4,719 keys in each language).
- `npm run test:rules`: 26 crew checks among the room rules (the date shift, codes,
  a night from a room with a leaver and a computer player, names folded to members,
  guests, the table, ties, the month's fresh start, titles from first places, the
  trivia tally and the audience, the records and the streak, the wall and its
  freeze, no keys in a view, a phone's room view without who is which member); all
  pass, the leak check clean.
- Robots `--only=crew`: 50 passed (create, peek without keys, join, a folded name
  offered as "is that you?", a second phone claiming a member, a wrong key; a room
  refusing a bad key and a non-host's `setCrew`; `crewMe`, a guest's refused; no
  crew key in any room state; a night recorded once and replaced by a second game;
  the guest on the night, not the table; a title from the buzzer; the manager's
  moves and a non-manager refused; hand over; packs; take out (every phone of the
  member out); the last leaving ends the crew; a room that closes with a game on
  the table still sends its night).
- Screen test `fixes`: a crew with a night, its page and four tabs at 375×812,
  667×375, 1280×720 and 1920×1080 in Arabic light and English dark laid out within
  the screen, the podium with the cast, a reload on the page, no errors. The empty
  page is swept by `screens` like every view.
- Looked at in headless Chrome: the whole flow on three phones (make, a link
  joined, a room for the crew, a guest, a buzzer game, the offer, the page, every
  tab, members, invite, the pick sheet, reload), four sizes, both languages and
  themes; no console errors (only Chrome's "vibrate before a tap", from scripted taps).
- Shell 629 KB gzipped (budget 710; +10 KB).

## For the other two features

- **اعمل مسابقتك / the family word pack**: keep a quiz's or a pack's code on a
  crew with `crewAddPack(crewCode, { code, kind: 'quiz' | 'words', title })` on the
  page (a member's key), or `attachPack` server to server; a member lists them in
  `crew.packs` of `crewAct(code, 'get')`. Show them on your own screen; the crew's
  page doesn't draw packs yet.
- **برنامج السهرة**: a room opened «للشلة» is `Room.state.crew`; the night is
  recorded by the room itself. To add your own results table, call
  `recordNight({ id, start, games, rows: [{ name, member?, points }], wins, … })`
  on the crew's stub with an id of your own (never the room's `room.crewNight`: the
  room sends that one again and would replace yours).

## Ready to paste into GEMINI.md's index ("The app around the games")

- «الشلة» (the crew: a family's or friends' monthly table, champions, titles; a
  room opened for it records its night; `Crew.js`, `rooms-worker/src/crew.js`,
  `JS_CrewCore.html`, `JS_Crew.html`, `/crew/*`, `/s/CODE`) - `notes/games/crew.md`.

## Draft of notes/games/crew.md

(The sections above from "What it is" to "Traps met", as they stand, plus the
owner's decisions:)

- A crew is joined by a code and a link / QR (no accounts, no passwords); one
  phone can be in several; the home/room shows the last used, and the host picks
  which one for a room.
- Table: nights won, then points. Season = a calendar month; a champion of the
  month; the table starts fresh on the 1st; every past month's champion kept.
- Titles playful, never mean, from real play; records.
- Joining asks «إنت مين فيهم؟» once (or "I'm new") and adds the group's names to
  the phone's saved names.
- A night counts only when the room was opened for the crew; rooms only.
- The creator manages it (rename, remove, fix a name, hand over); the rest can leave.
- Guests play and count on the night; offered «انضم للشلة» at the end of the night;
  not on the table unless they join.
- The page: this month's table and champion (the cast podium), the champions'
  wall, titles and records, the nights; look ج «كارنيه النادي».

## The links, 30 Sep 2026

The crew wired to «اعمل مسابقتك» / «كلماتنا» and «برنامج السهرة» (a branch of its own, on
master after the three merges), live since.

### A crew's packs (the owner: a شلة has its packs, visible to all members without codes)

- **The rule is `Crew.js`** now: `crewAddPackTo(meta, me, p)` (a member only - `me.server` for
  `attachPack` -, a code of six of A-Z/0-9, `kind` 'quiz' | 'words', at most `CREW_MAX_PACKS`
  = 30; the same code again is the same pack, whoever added it first keeps it) and
  `crewRemovePackFrom(meta, me, code)` (whoever added it, or the manager). The Durable Object
  (`rooms-worker/src/crew.js`) proves the key, then calls them; its own `addPack` is gone. A
  crew keeps codes only; the packs stay in `PackStore`. `crewView`'s packs carry `byId` (a
  member id, public on the page already) so the page knows who may take one off.
- **In the shell** (`JS_CrewCore.html`): the page cache moved here (`CREW_CACHE`,
  `crewCacheRead` / `crewCacheWrite`: `JS_Crew.html` declared it before, and two chunks can't
  both declare one const), `crewPacksOf(code)` (from the cache), `crewRefresh(code)`,
  `crewPackAddBtnHtml(code, kind, title)` (the «ضيفها للشلة» button: disabled with «موجودة في
  الشلة» once every crew on the phone has it), `crewPackAdd` (at once with one crew, a pick
  sheet with several), `crewPackAddTo`, `crewPacksChanged` (buttons, the crew page and the quiz
  list follow), `crewOpenPack(code, kind)`, `crewWordsSync()`, `crewIso` (a title inside a
  translated line, held apart). A phone in a crew asks for its page 5 s after start-up, at
  most every 6 hours (`ashryCrewPacksAt`), so a pack another member added reaches it without
  opening the crew's page.
- **Where the button is**: a quiz's sheet (`qmOpenSheet`, a saved quiz with no changes since),
  the words' sheet after saving (`wpOpenSheet`), and «كلماتنا» itself (`wpPaint`, a pack with a
  code - opened by code too).
- **The crew's page** (look ج, `JS_Crew.html`): a card «مسابقاتنا وكلماتنا» under the card and
  its buttons (the side column on a phone's side and wider; above the tabs upright), the four
  tabs untouched. The packs are a row that scrolls sideways (30 of them never push the tabs
  away), each 🧠 / ✍️, its title and who added it; a tap opens it (`crewOpenPack`); ✕ for its
  adder and the manager (a confirm); «＋ ضيف» lists what is on this phone with a code and not
  on the crew (`packsKnownCodes`), or «اعمل مسابقتك». The row pops in once per list
  (`motionFirst`), a pack just added alone.
- **«من الشلة»** in the quiz list (`qmCrewHtml` in `qmPaintHub`, `setup-quizmaker`, which is
  also the الأدوات entry): the current crew's packs, «على موبايلك» on the ones already here; the
  hub asks the crew again at most every 30 s (`qmCrewRefresh`) and repaints only when the list
  changed.
- **Opening a crew pack** (`crewOpenPack`): a quiz is `openPackByCode` (its sheet, kept on the
  phone). Words go through `openPackByCode` only when the phone has no word pack of its own (or
  has this one); otherwise a sheet shows the words - never over the family's own pack, since
  they are a category of their own anyway.
- **The words in the word games**: a crew's word pack is fetched once and kept in
  `ashryPacks_v1.crewWords` (`[{ code, title, words, crews, at }]`, `crewWordsSync`), dropped
  when no crew on the phone lists it. `packWordPacks(min)` (JS_PackStore.html) is every word
  pack the phone can deal from - its own first, id 'pack', then each crew's, id
  'pack:<code>' - and everything that offered «كلماتنا» reads it: `spyCategoriesPlus` and
  `packCatsPlus` (الجاسوس, بدون كلام, من أنا؟, a room's من أنا؟), الحرباء's list (`p.id` as the
  option), على راسك's decks, the room lobbies (`packWordsLobbyHtml` lists them all;
  `packWordsLobbyPick` returns the chosen code, the old saved value 'pack' still meaning the
  own), الجاسوس's room list and payload (`packWordsCodeOfCat`). A crew pack whose title is the
  same as the own one gets « · <crew name>».

**Decided here** (open to change, each one place): the packs sit under the card, not in a
tab (the owner's four tabs stay as they are); anyone in the crew adds, the adder or the
manager removes (the crew's existing rule); the crew's words never replace the phone's own
«كلماتنا» - they are a second category; the phone looks at its crew at most every 6 hours by
itself.

### «برنامج السهرة» on the crew's night

- The night already counted a program's games (each is banked on `room.night` by
  `programLeaveGame` → `bankNightPoints`, 5/3/2 and 1 for everyone else: `NIGHT_PLACES`).
  Checked: the night's points equal the program's own table, and a crew keeps one night under
  the room's id however many times it is sent.
- `crewNightInput` adds `programs` (the last `CREW_PROGRAMS_KEPT` = 3 of
  `room.nightx.programs`): `{ at, games: [ids, skipped left out], champions: [{ name, member }],
  awards: [{ name, member, k, v, g, with, from }] }` (8 at most, computer players left out).
  `crewCleanNight` keeps it as `prog: [{ at, g: [ids], c: [{ m, n }], aw: [{ m, n, k, v, g, w, f }] }]`;
  `crewNightSummary` gives the page `prog: { n, games, champs: [names], aw: [{ k, name, v, g,
  with, from }] }` (the night's last program). A program night is about 470 bytes more.
- **The السهرات tab** (`crewNightProgHtml`): under the night's top three, a dashed line, the
  badge «🌙 برنامج السهرة» (×2 when a night held two), «👑 بطل البرنامج: …», and the awards as
  chips (the program's icons `CREW_PROG_ICONS`, the titles its own `prog_aw_<k>` keys).
- Not done: program awards as crew titles (program.md's idea: buzz → fast …). They would
  double-count the first places a title already counts; left for the owner.

### Tests

- `rules.mjs` "the links" (24 checks): a stranger can't add, a bad code, a member adds, the same
  code again, 30 and the 31st refused, removing (not a member who didn't add it; the adder;
  the manager; not a stranger), a server's own call held to the limit, the page's packs with
  `byId` and no keys; a program of three buzzer games in a room opened for a crew: dealt,
  finished, the night 12 / 11 / 8 = the program's own table, sent many times and one night,
  the crew's night with its members and a guest, the program and its champion kept, the tab's
  summary with its awards, the season table, the size, and a guest's view with none of the
  crew's notes. `npm run test:rules`: all pass twice, the leak check clean.
- Robots `--only=crewlink` (41 checks): a quiz and words created, a member adds, a wrong key and
  another crew's key refused, the manager adds, a member sees them and no key, 30 and the 31st
  refused, removal rules; then a program of three buzzer games in a crew room to its finale:
  the night reaches the crew once, 5/3/2 a game (كريم 12, هالة 11), the program and its champion
  on the night, the guest a guest, no crew key or member map in any room state. The `crew`
  segment's points were updated to the 5/3/2 rule (it still expected 3/2/1 and failed on
  master). With `crew`, `quiz` and `program`: 211 passed.
- Screen test `fixes`: the crew's packs row (2 packs, ✕ for the manager), the crew's words in
  the word games, «من الشلة» (2 rows), «ضيفها للشلة» on a quiz the crew hasn't got, a program night's
  badge and awards, and the quiz list, the sheet and the nights tab swept at 375x812 and
  1280x720 in Arabic light and English dark.
- `tools/test-changed.mjs`: Crew.js / the crew's pages, the packs and the program map to the
  `crewlink` segment too.

## The ideas of 7 Oct 2026 (the owner's picks): built

- **785 «تاج البطل»** (no extra rule asked). The crew's reigning champion wears a 👑 on their chip in
  every room opened for the crew - the lobby rows, the player strip, the TV's strip and its lobby
  faces - and if someone beats them that night, the TV says «👑 التاج اتنقل!» («X عدّى Y الليلة»).
  Chosen: the reigning champion is this month's leader once a night of the month has been won
  (ties all crowned), else the last month's champion (`crown()` on the `Crew` object,
  `rooms-worker/src/crew.js`, from `crewView`'s table and wall; members still in the crew only).
  `setCrew` (room.js) asks it once and keeps the member ids private in `room._crewChamp`;
  `crewCrownSync` puts only player ids on `room.crew.crown` (the phone that proved the member,
  else an unlinked player of the same name, `sameRoomName`), again when a member's phone says who
  it is (`crewMe`, broadcast when the crown moves). "Beaten tonight": someone alone on top of the
  room's night board (`state.night`) while the champion has played this night - the crown is drawn
  on them instead (`crewCrownState`, `crewCrownHtml` in `JS_CrewCore.html`, called from
  `roomNameHtml` and the TV lobby's tile), and the TV (only a screen) slams «التاج اتنقل!» once
  (`slamBanner`, a toast with motion off), never for what it found on first sight (a reload).
  Tests: `play-all.mjs` (`crew`: a new room for the crew crowns the night's winner by name, still
  after their `crewMe`, no member id in any state).
- Shared files touched for it: `rooms/JS_Room.html` (`roomNameHtml` appends the crown),
  `rooms/JS_RoomTv.html` (the lobby tile's name and `tvLobbySig`), `rooms-worker/src/room.js`
  (`setCrew`, `crewCrownSync`, `crewMe`).

## The ideas of 7 Oct 2026, third batch (the owner's picks): built

- **1323, «سهرة الشلة» in the link preview.** A room opened «للشلة» shares `/r/CODE?c=1&n=<the crew's
  name>` (`roomInviteUrl` / `roomShareLink`, JS_Room.html; the name from `state.crew.name`), and the
  site worker titles it «سهرة الشلة «الاسم» - الغرفة ABCD» with the app's picture instead of one
  game (a room also running برنامج السهرة says «سهرة الليلة: ٥ ألعاب» instead). Details:
  `notes/previews-errors.md`.
