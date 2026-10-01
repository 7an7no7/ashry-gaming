# «اعمل مسابقتك» and «كلماتنا» - the builder's notes (30 Sep 2026)

Built on the worktree branch of the quiz agent. Not deployed, not pushed; GEMINI.md
untouched (a ready index line and a draft `notes/games/quiz.md` are at the end).

## What it is

- **«اعمل مسابقتك»** (your own quiz): written on the phone - a title, an emoji, up to 60
  questions, each four answers with one ticked right, words and emoji only. Saved, it gets
  a 6-letter code; played three ways: a room (room trivia, everyone on their phone, speed
  points, the TV shows the question), the team board (دوري المعرفة, two teams on one
  screen), and the buzzer (الجرس: the host reads, the answer on the host's phone only).
- **«كلماتنا»** (our words): one list of the family's words, names and inside jokes (up
  to 300, 40 letters each), written once, offered as a category in the word games.

## Files

| file | what |
| --- | --- |
| `Packs.js` | The one rule for what a pack may hold (`packCleanQuiz`, `packCleanWords`, `packClean`), the limits (`PACK_LIMITS`), the code alphabet and pattern (`PACK_CODE_RE`, 6 of the room alphabet), the year (`PACK_TTL_MS`). Shared: the page's shell lists (`SHELL_LISTS`, `SHARED_LISTS`) and the Worker (`FILES` in `rooms-worker/build.mjs`). Errors are codes; the page words them (`pk_err_<code>`). |
| `rooms-worker/src/packs.js` | `PackStore`, a Durable Object per code (`env.PACKS.idFromName('pack:' + code)`): `{ kind, pack, keyHash, created, updated, played }`. `create`, `get(touch)`, `save`, and an alarm a year after the last play or save (plus the same check on every read). |
| `rooms-worker/src/index.js` | `POST /pack/create { kind, pack }` → `{ code, key, pack }`; `/pack/get { code }`; `/pack/save { code, key, kind, pack }` (only with the key it was made with); `/pack/played { code }`. The server checks every pack with `packClean` again. Limits per address (per Worker instance, like `/create`): create 20, save 200, get 400 in 10 minutes. |
| `rooms-worker/src/room.js` | A `start` or `playAgain` naming `payload.pack` reads the pack from `PackStore` (`readPack`, as played) and hands it to that one move as `room._packIn`; `roomHostChanged(room)` after `makeHost` and the 2-minute handover. |
| `RoomGames.js` | `roomPackAdopt` (in `applyRoomAction`, before the games) keeps the pack as `room._pack` for the game (play again, the next round) - a code the server didn't load is refused, a `start` with no pack clears it; `roomPackQuiz`, `roomPackWords`, `roomPackDeck` (choices shuffled at the deal). Trivia, the buzzer (`buzzerQuizDeal`, `buzzerQuizSync`, `buzzerQuizReveal`, actions `quizReveal` and `quizNext`), الجاسوس, الحرباء and ارسم وخمّن deal from it. `clearGameState` drops `_pack`. |
| `JS_PackStore.html` | In the shell: the packs on this phone (`ashryPacks_v1`), the calls to `/pack/*`, and the helpers the lobbies and the word games use (`packRoomPick`, `packSourceFieldHtml`, `packWordsList`, `packWordsCatName`, `packWordsCode`, `spyCategoriesPlus`, `packCatsPlus`, `packWordsLobbyHtml`). |
| `JS_QuizMaker.html` | A chunk (`quizmaker` in `tools/lazy-split.mjs`): the hub (`setup-quizmaker`), the editor (`play-quizmaker`), the word pack (`setup-wordpack`), the sheet (`#qm-save-modal`). |
| `Style.html` | The last section: the editor, the rows, the open card, the sheet (at the foot of an upright phone), the word chips, the buzzer's quiz card, the board's quiz answers. |

## How it works

### On the phone

- **Everything is kept as it is typed** (`qmKeep` → `packQuizPut`), so a reload in the
  middle of a question comes back to it, open (`ashryQuizEdit_v1` keeps which quiz and
  which question; `qmRestore` from `restoreView`). A quiz with a code that is changed on
  the phone is `dirty` until «احفظ» sends it again. The server's answer to a save
  (`qmSave`, `wpSave`) goes to the quiz or word pack that was sent, by its id, never to
  whatever is open when it comes back; anything typed while it saved is kept and the
  pack stays `dirty` (its `updated` stamp changed), and one deleted meanwhile is left gone.
- **The editor, look ب «القايمة»**: a title card (the emoji tile cycles through ten; the
  title is an inline field; a line says how many questions, when it was last changed and
  whether it is saved). Every question is a row (its number, its text with its emoji, ✓
  and the right answer, or «⚠️ ناقص»; ⋮⋮ to drag). A tap opens it in place: the question,
  an emoji row (16 and «none»), four answers two by two each with a ✓ to tick (a radio
  group), ▲▼ to move, ⧉ copy, 🗑️ delete (asks when it has text), «تمام ✓». Enter in an
  answer goes to the next. «＋ سؤال جديد» adds one open. The sticky bar is «احفظ وخد
  الكود» (the Start bar's amber).
- **Drag to reorder**: pointer events on ⋮⋮ (`qmDragStart`): the row follows the finger,
  the others slide out of its way by their height, letting go puts it there (a bump). ▲▼
  do the same for a keyboard or a screen reader.
- **«احفظ»** checks with `packCleanQuiz` first: a mistake opens its question with the
  reason under it (`qmShowError`: a shake and a toast); then `/pack/create` (a new quiz:
  its code and edit key, kept on the phone) or `/pack/save` (the author's own). Offline:
  «مش متصل…» and the quiz stays on the phone (the board still plays it).
- **The sheet**: the title, how many questions, the code (a tap shares it), and the three
  ways: 📱 غرفة (the main one, amber) opens a trivia room with this quiz chosen
  (`rememberOptions('triviaRoom', { pack })` then `roomCreateFor('trivia')`), 🏆 لوحة
  الفرق opens the trivia setup's one-phone side with the quiz chosen, 🔔 الجرس opens a
  buzzer room with it. A quiz with no code offers only the board.
- **Opening by code** (`qmOpenCode` → `packOpenByCode`): a quiz joins the list (not the
  phone's own: it plays, and «اعمل نسخة ليا» copies it as a new quiz of one's own); a
  word pack's code typed there goes to «كلماتنا».

### In a room

- **Trivia**: the lobby's «الأسئلة» (`packSourceFieldHtml('triviaRoom', …)`): the app's
  questions, or a quiz on this phone that has a code (one without is listed, greyed,
  «احفظها الأول»); the count list hides for a quiz. The start carries `pack: code`; the
  server loads it (never the phone's copy), deals every question in the author's order,
  each one's choices shuffled, and plays it exactly as the bank (15 s, 10 + the speed
  bonus). `shared.quiz` = `{ title, emoji, code }` for the header. Play again plays it
  again, reshuffled.
- **The buzzer**: the lobby's «الأسئلة» (none - the host asks out loud, as always - or a
  quiz). `shared.quiz` = `{ title, emoji, code, n, total, q, choices, answer, done }`:
  the question and its four answers on every phone and the TV, `answer` null until it is
  shown; the right one in the host's slice only (`room.secrets[host].answer`; a TV host
  gets none and shows it with «اكشف الإجابة»). ✅ on a buzz scores as before and also
  shows the answer and locks the buzzers; `quizReveal { n }` shows it with nobody right;
  `quizNext { n }` deals the next (both host-only, stale taps dropped). After the last,
  `done`; play again starts over.
- **الجاسوس**: «✍️ كلماتنا» first in the lobby's list once the words have a code; the
  start carries the category and `pack`; the server deals from the family's words (its
  own prompt memory key, `imp_pack_<code>`). Not المختلف (it needs pairs).
- **الحرباء**: a lobby list «الكلمات» (the app's / the family's, `chameleonRoom`) when the
  phone has 16 or more: a board of 16 of them, the pack's title as the category.
- **ارسم وخمّن**: the same list (`drawRoom`): the drawer's word from the family's, the
  guesses judged against the family's list.
- **من أنا؟**: its characters come from the host's phone in rooms already, so «كلماتنا» is
  simply a category there (no code needed).

### On one phone

- **دوري المعرفة**: the setup's «الأسئلة» (the app's, or any quiz on the phone, with or
  without a code - it plays from the phone's copy, offline too). A quiz board: 25
  questions a board, a row at a time (the first five at 100, the next at 200…), columns
  named with the quiz and a number, fewer columns and rows for a short quiz, the last
  row's empty places blank; the rounds are as many boards as it fills (at most 4, the
  rounds field hides). The card shows the four answers under the question, the right one
  lit when the answer shows. Steal, double card, clock, undo: unchanged. No «في غلطة؟»
  on a family quiz.
- **The word games**: «✍️ <title>» as a category in الجاسوس (`spyCategoriesPlus`), بدون كلام
  and من أنا؟ (`packCatsPlus` on their dbs), على راسك (a deck `pack`, `huDecksNow`),
  الحرباء (16 words at least). Playing it touches the pack's year (`packPlayed`).

## Decided while building (open to change, each in one place)

- **The door**: «اعمل مسابقتك» is a way of تحدي المعلومات (`hub: 'trivia'` in
  `GAME_CATALOG`, `HUB_WAYS.trivia`: a ways row on the trivia and quiz screens) and a tool
  in الأدوات under a new section «اعملها بنفسك» (`kind: 'make'`), beside «كلماتنا». No home
  card. The trivia and buzzer lobbies and the board's setup each have «✍️ اعمل مسابقتك».
- **The team board with a quiz** fills a row at a time in the author's order (above).
- **One word pack per phone**: its own (with the key) or one opened by code (read-only,
  «اعمل نسخة ليا»). Opening another family's code over the phone's own words asks first.
- **Excluded from «كلماتنا»**: أوصف لي (every card needs forbidden words) and المختلف
  (pairs of close words). ارسم واكتب, كلمة واحدة and the others keep the app's lists.
- **The limits**: 60 questions of 140 characters, choices of 60, a title of 40, 300 words
  of 40, 6 words at least; an emoji field keeps no letters. Two answers the same after
  the fold (hamza forms, ة/ه, marks, spaces) are refused.
- **A room plays only a saved quiz** (the server loads it by code); the phone's changes
  since the last save are not in it (the list says «فيه تعديلات لسه متحفظتش»).
- **The edit key** is 24 characters, kept on the author's phone; the server keeps only its
  SHA-256. Lose the phone, lose the right to edit (the code still plays; a copy is one
  tap). The crew (الشلة) can give a crew its own packs later.
- **A year**: a pack neither played nor saved for 365 days is deleted (an alarm, and a
  check on every read). Played = dealt in a room, or the board, الجاسوس or الحرباء started on
  a phone with it (`/pack/played`, a beacon; at most one write a day per pack).
- **The save sheet** is a sheet at the foot of an upright phone (the owner's look ب) and a
  centred dialog everywhere else - the standing rule that popups are centred dialogs.
- Nothing personal: no name, no address, no room is stored with a pack.

## For «الشلة» (crews) - merged 30 Sep 2026

The crew already keeps pack codes: `crewAddPack(crewCode, { code, kind, title })`,
`crewRemovePack(crewCode, packCode)` on the page (JS_CrewCore.html), `attachPack` /
`listPacks` on its Durable Object, the list in `crew.packs` of `crewAct(code, 'get')`.
What this side offers it (JS_PackStore.html, the shell, always loaded):

- **`openPackByCode(code)`** - the one call from the crew's page: fetches the pack,
  keeps it on the phone, and shows it - a quiz's sheet (its code and the three ways to
  play: room, team board, buzzer), or «كلماتنا» for the words. It loads the editor's
  chunk itself (`lzRun('quizmaker', …)`); a bad code says why in a toast. Resolves to
  `{ kind, id }`, or null.
- `packOpenByCode(code)` → `{ kind, id }` (keeps it, shows nothing), `packFetch(code)` →
  `{ code, kind, pack }` (keeps nothing), `packsKnownCodes()` → `[{ code, kind, title }]`
  (every code on this phone: what «ضيف للشلة» could offer), `packQuizByCode(code)`,
  `packWordsLocal()`, `packErrorText(error)`. Server: `POST /pack/get { code }`.

**How a crew's packs should show (not built, the crew link's job):**

- On the crew's page, a «مسابقاتنا» list of `crew.packs` (title, kind icon ✍️ / 🧠, who
  added it); a tap is `openPackByCode(p.code)`. «＋ ضيف مسابقة» lists `packsKnownCodes()`
  not yet on the crew and calls `crewAddPack`; saving a new quiz in the editor could
  offer «ضيفها للشلة» on the sheet (one more button beside «ابعت الكود», shown when
  `crewCurrent()` is set).
- In the editor's hub (`qmPaintHub`), a section «من الشلة» under «مسابقاتك»: the crew's
  quiz codes not on this phone yet, each a row that opens with `openPackByCode` (so a
  member sees them without typing a code). The words: when the phone has no word pack
  and the crew has one, «كلماتنا» can offer «كلمات الشلة» the same way.
- In the lobbies (`packSourceFieldHtml`) nothing changes: a crew quiz opened once is on
  the phone, so it is in the list.

## Tests

- `rules.mjs` "packs" (40 checks): every validation rule, the code pattern, trivia with a
  quiz (every question, the shuffle, the right answer followed, scoring, play again, a
  start with no quiz), the buzzer (the answer on the host only, ✅ showing it, next with a
  double tap, reveal host-only, the end, play again, a new host), الجاسوس, الحرباء and
  ارسم وخمّن from the family's words.
- `leaks.mjs`: `trivia:quiz`, `buzzer:quiz` (a phone host and a TV host) and
  `imposter:words`; `act` hands a move its pack as room.js does. Proved: an answer put
  into the other phones' slices failed `buzzer:quiz`.
- `play-all.mjs --only=quiz` (44 checks on a local server): create, refuse, open by
  code, the key, edit, not found, played; a trivia room, a buzzer room and الجاسوس.
- `test-ui.mjs` screens: at every size and both looks, the editor with a question open,
  a reload mid-question, and the sheet laid out within the screen.
- `test-changed.mjs`: `Packs.js`, `JS_PackStore.html`, `JS_QuizMaker.html` and
  `rooms-worker/src/packs.js` map to the quiz and core segments and the trivia, buzzer,
  word games' screens.

**Run after merging master (الشلة), 30 Sep 2026**: `npm run check` passes; `test:rules`
all pass and the leak check clean; the robots 3,352 passed, 0 failed (the quiz segment 44,
the crew's 50); the screen test's screens at 375x812, 667x375 and 1280x720 (both looks,
the editor, the reload, the sheet) and the rooms for trivia, the buzzer, الجاسوس, الحرباء,
ارسم وخمّن and من أنا؟ all pass; the site builds with the shell at 630 KB of its 710.
Looked at in headless Chrome at 375x812, 667x375, 1280x720 and 1920x1080, Arabic light
and English dark: the hub, the editor (emoji row, a question open, a reload mid-question,
an error on its question), the sheet, the team board with a quiz and its card, «كلماتنا»
and its sheet, the categories in the word games, a room of two phones and a TV through
trivia and the buzzer with a quiz (a guest reloaded mid-question), الحرباء and ارسم وخمّن
with the family's words; no console errors.

## Traps met

- **The tools decode `\u` escapes** - not only the Edit tool: the Write tool and even a
  Bash heredoc turned `\u0000-\u001f`, `​`, ` ` in a regex into the characters
  themselves (the file failed to parse). Build such a line with `chr(92) + 'u'` in a
  script, or use the letters themselves (Packs.js uses the Arabic letters as they are).
- **The hub's «＋ مسابقة جديدة» and the editor's «＋ سؤال جديد» are both `.qadd`**: a test
  that clicks `.qadd` hits the hidden hub's first and makes a new quiz. Scope a selector to
  its view (`#qm-editor .qadd`).
- **A screen opened from a chunk that names another chunk's screen** (`setView('setup-
  trivia')` in JS_QuizMaker) makes lazy-split see the screen in two chunks: it goes in
  `VIEW_CHUNKS` (`'setup-trivia': ['triviaboard']`).
- **A new Durable Object class needs a migration**: the crews' `Crew` is `v5`, so
  `PackStore` is `v6` in `rooms-worker/wrangler.toml` (the merge of master, 30 Sep).
- **A merge that adds to the end of the same file twice** (Style.html, rules.mjs):
  git's hunks there can split a shared closing line (`}`) between the two sides, so a
  union of both lost the crew block's last brace and cut a comment in two. Rebuild such a
  file from master's version plus the one block, and check `{`/`}` and `/*`/`*/`.
- **`wrangler dev` reloads itself when `wrangler.toml` changes**, and after the merge's
  new class it came back half-broken (a crash, requests hanging) while holding its
  `--persist-to` folder: kill its whole tree and start it on a fresh folder.

## To deploy

1. `cd tools && npm run build:site` and commit `docs/`.
2. `cd rooms-worker && npm run deploy` (a new Durable Object class and migration `v6`; no
   secret needed), wait a minute, `npm run test:live` (the quiz segment is in it).
3. `cd tools && npm run deploy:site`.

## For GEMINI.md

A line in *The games* index:

> - ✍️ «اعمل مسابقتك» (the family's own quiz: a room, the team board, the buzzer) and «كلماتنا» (the family's words as a category in the word games), kept by a 6-letter code - `notes/games/quiz.md`.

And under *Multiplayer rooms* (or in `notes/rooms.md`'s table of files): `Packs.js` (the rule),
`rooms-worker/src/packs.js` (`PackStore`, one per code), `JS_PackStore.html` (the phone's
copy, shell), `JS_QuizMaker.html` (the editors, a chunk); a room move naming `payload.pack`
gets `room._packIn` from room.js, kept as `room._pack` by `roomPackAdopt`.

A trap for GEMINI.md: *The tools decode `\u` escapes, the Write tool and Bash heredocs too*
(above).

## Draft `notes/games/quiz.md`

The sections above from "What it is" to "Traps met" are the draft: move them there as they
are, with the log line for `notes/log.md`:

> - **30 Sep 2026, «اعمل مسابقتك» and «كلماتنا»** - the family writes its own quiz (a
>   room, the team board, the buzzer) and its own words (a category in الجاسوس, الحرباء,
>   بدون كلام, على راسك, من أنا؟ and ارسم وخمّن), kept by a 6-letter code on the rooms
>   server (`PackStore`, deleted after a year unplayed) and on the phone; the editor is
>   look ب «القايمة». Rules tests, three leak drivers, a robot segment (`--only=quiz`), the
>   editor and the sheet in the screen test.
