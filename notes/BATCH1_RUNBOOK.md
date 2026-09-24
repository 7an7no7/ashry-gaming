# Batch 1 runbook - Stop «متسامح», the Stop word log, the first-play card, the daily golf hole

The owner approved these on 24 Sep 2026 (answers recorded here under
*Decisions already made*). Read CLAUDE.md and the GEMINI.md sections named in
each task before editing. This is feature work, not a repair: where a task says
"add", find the anchor by the function or constant name given.

## The executor's contract

- Branch `batch1`. One commit per task, message `T1.x: …`. Never push, never
  deploy (`npm run deploy`, `npm run deploy:site`, `wrangler deploy`), never
  `git add -A`.
- Every page file (`JS_*.html`, `Style.html`, `Controller.html`) is ONE global
  scope with every other page file. Before defining a top-level name, grep every
  `JS_*.html` and root `*.js` for it (GEMINI.md *Traps*: "One scope means one
  name"). Prefix new names with the feature (`stopLenient…`, `firstPlay…`,
  `mgDaily…`).
- All UI text goes through `TRANSLATIONS` in `JS_Core.html`, the same key in
  `ar` and `en` blocks. `cd tools && npm run check` must pass.
- No new Tailwind classes: styles go in `Style.html` using the design tokens
  (GEMINI.md *The design system*): no hardcoded colours, rem sizes, logical
  properties (`inset-inline-start`, `padding-inline`), no letter-spacing on
  Arabic. Buttons use `.btn` + a tier class, no padding utilities on them.
- Never edit `docs/` or `.preview/`. Never write `\u` escapes through an
  editor that decodes them (GEMINI.md *Traps*).
- Parse-check every page file you touch (each `<script>` block with
  node's `vm.Script`), `node --check` every `.js`.
- Tests you write go in the TESTS_DIR you were given, never in the repo.
  Rules changes are ALSO covered in the repo's own `rooms-worker/test/rules.mjs`
  (that is the project's test file; add cases there, in its existing style).

## Decisions already made (the owner, 24 Sep 2026)

1. **Stop «متسامح»**: a host lobby switch for أتوبيس كومبليت in rooms,
   **off by default**, remembered on the host's phone with the other Stop
   options (`ashryStopRoomOpts`). On, a word the dictionary doesn't know
   (`word: 'unknown'`) scores like a known one (10, or 5 if shared - but
   'unknown' is by definition not shared, so 10) and still shows ❓ on its
   amber cell; the host can still tap it (the ordinary `adjust`) down to 0.
   Off: exactly today's behaviour.
2. **The Stop word log**: every time a host's `adjust` raises a cell whose
   `word` is `'unknown'` or `'shared'` from 0 to more than 0, the word is logged
   on the rooms server (language, category, the word as typed, a count), so
   the dictionary can be grown from what tables really accept. Nothing about
   who typed it is stored. A tool reads the log.
3. **The first-play card**: the first time a phone opens a game's setup screen
   (and, for a room game, the first time that game is chosen in a room lobby
   this phone is in), a small card shows "how to play" in three short steps,
   with «فهمت» (dismiss, never again for that game on this phone) and
   «📘 القواعد كاملة» (opens Help on that game). Once per game per phone.
4. **The daily golf hole**: one hole a day, the same on every phone (seeded
   from the date, drawn from all 60 holes), a line in تحدي اليوم, the result
   shared as emoji: `⛳ 4 · 🎯 3` (strokes, what the hole asks for), with
   🟢 when at or under the target.

## Phase 1 (the only phase of this batch)

### T1.1 - Stop «متسامح» (rules)

- Files: `RoomGames.js` (the Stop branch, `stopAction` / its `start` options
  and the scoring around line 766: `const pts = !a.ok || word === 'unknown' ? 0 : …`),
  `rooms-worker/test/rules.mjs`.
- Add `lenient` (boolean, default false) to the options the host sends with
  `start` and keeps across rounds and play again, alongside the existing
  categories / timer / rounds options. Put it in `shared.settings` (or wherever
  the other Stop options are published) so every phone can show it.
- Scoring: `unknown` scores 10 when `lenient`, 0 otherwise. `shared` and
  `known` unchanged. The result cell keeps `word: 'unknown'` either way (the ❓).
- Accept when: rules tests show strict (unknown = 0) and lenient (unknown = 10)
  on the same answers; a host `adjust` to 0 on a lenient unknown works and
  updates `roundTotals`; an older phone sending no `lenient` gets strict.

### T1.2 - Stop «متسامح» (the phone and the TV)

- Files: `JS_RoomStop.html`, `JS_Core.html` (translations), `Style.html` only if
  needed.
- The host lobby gets a switch (the app's `.switch-row` / `.switch`, like the
  other lobby switches) «متسامح: الكلمة اللي مش في القاموس تاخد نقطها» /
  "Lenient: words not in the dictionary keep their points", with a hint line.
  Remembered in `ashryStopRoomOpts`, sent with `start`.
- The results table: with lenient on, the amber ❓ line under the table says
  the host can tap a wrong word down to 0 (instead of "tap it if it's right").
  Add the two strings to both languages.
- Accept when: the switch shows only for the host in the lobby, survives a
  reload of the host's phone, and the table's hint follows the setting.

### T1.3 - The Stop word log (server)

- Files: `RoomGames.js` (the Stop `adjust` branch, line ~697),
  `rooms-worker/src/room.js`, a new `rooms-worker/src/words.js`,
  `rooms-worker/src/index.js`, `rooms-worker/wrangler.toml`,
  `rooms-worker/test/rules.mjs`, a new `tools/stop-words.mjs` and its
  `package.json` script `stop-words` in `tools/`.
- Rules side: in `adjust`, when the cell's `word` is `'unknown'` or `'shared'`
  and its `pts` goes from 0 to > 0, push `{ lang: s.lang (or the round's
  language field as used there), cat, word: <the typed text of that cell> }`
  onto `room._stopTaps` (an array, created if missing). `room._*` is never
  projected (GEMINI.md *Multiplayer rooms*). The rules stay pure: no I/O.
- Room side (`room.js`, where an action's result is committed, near the
  existing prompt-memory `write`): if the new room has `_stopTaps` with
  entries, send them to a new Durable Object `WordLog` (one instance named
  "stop"), `.catch(() => {})` so it never blocks or fails a move, and clear
  `_stopTaps` from the saved room.
- `WordLog` (`src/words.js`, modelled on `src/live.js` / `src/memory.js`):
  `add(entries)` increments a count per key `lang|cat|word` (word trimmed, at
  most 40 characters, at most 20 entries per call); `list()` returns every
  `{ lang, cat, word, n }`. Keep at most 5,000 keys (drop the lowest counts).
- `wrangler.toml`: bind `WORDS` to `WordLog` and add a migration tag with
  `new_sqlite_classes = ["WordLog"]`, following the existing migrations'
  pattern exactly (read them; never change an existing tag).
- `index.js`: export `WordLog`; `GET /stop-words` answers JSON of `list()`
  sorted by count, ONLY when the request's `Authorization: Bearer <key>`
  equals `env.ADMIN_KEY` and `env.ADMIN_KEY` is set; otherwise 404.
- `tools/stop-words.mjs`: reads the key from the environment variable
  `ASHRY_ADMIN_KEY`, the address from `roomsUrl` in `tools/site.config.json`
  (or the first argument), prints a table grouped by language and category,
  most-tapped first, and says which are already in the dictionary
  (`stopWordKnown` from `StopWords.js`, loaded the way `tools/validate-content.js`
  loads shared files).
- Accept when: a rules test shows `_stopTaps` filled by a 0→10 tap on an
  unknown cell and not by a tap on a known cell or a tap down; the leak check
  (`npm run test:rules` runs it) still passes (`_stopTaps` is a `_` key);
  `rooms-worker` builds (`npm run build` or whatever `npm run dev` runs first).

### T1.4 - The first-play card

- Files: `JS_Catalog.html` (`syncGameHero`, `catalogHeroHtml`), `JS_Room.html`
  (the lobby, where the chosen game is shown), `JS_Core.html` (translations,
  the storage key cleared by "delete all data" - find how other `ashry…` keys
  are cleared there), `Style.html` (a section at the end of section 14 or a new
  numbered section after the last one).
- The steps come from `GAME_RULES` (`JS_Core.html`): take the first three
  `<li>` of the game's ordered list in the current language, as plain text
  (strip tags), each cut at ~90 characters on a word boundary. A game with no
  `<ol>` or no rules: no card. Use the help key the Help sheet uses for that
  game (`HELP_FOR_VIEW` / `ROOM_HELP_KEY` in `JS_Utils.html`) so the room chess
  maps to its rules correctly.
- Seen games are kept in `localStorage['ashryFirstPlay_v1']` (a JSON array of
  ids), read and written inside try/catch.
- On a setup screen: the card goes inside the hero area under the hero, in the
  game's accent (`--accent` tokens), with a numbered list and two buttons:
  «فهمت 👍» (`btn btn--sm btn--primary btn--auto`) marks it seen and removes it
  with a short fade (motion via the existing helpers; with `motionOff()` just
  remove), «📘 القواعد كاملة» (`btn btn--sm btn--ghost btn--auto`) opens Help on
  that game (the same call the hero's 📘 button makes) and also marks it seen.
- In a room lobby with a game chosen: the same card, once per game per phone,
  not on a big screen (`isRoomScreen`), and it must survive the lobby's
  re-renders without flashing (render it with the lobby markup from state
  plus the seen list; dismissing re-renders or removes the node).
- Accept when: first visit to a setup shows it, «فهمت» hides it for good for
  that game only, a reload does not bring it back, English shows English steps,
  and the card fits at 375px with no horizontal overflow.

### T1.5 - The daily golf hole

- Files: `JS_MiniGolf.html`, `JS_Daily.html` (`DAILY_GAMES`), `JS_Core.html`
  (translations), `MiniGolf.js` only if a helper is truly needed (it is shared
  with the server - prefer not).
- Read GEMINI.md *Solo games* (seeded randomness, "A daily is played once",
  `soloDailyResume` / `soloDailySetAside`, `soloMarkDaily`, `soloResult`) and
  *ميني جولف* first, and copy the shape Sudoku uses (`JS_Sudoku.html` around
  `soloDailyResume('sudoku')`).
- `startMiniGolf(daily)` (or the game's existing start function with a daily
  flag - find it): the daily is ONE hole, drawn with
  `soloRng(soloDaySeed('minigolf'))` from every id in `GOLF_HOLES`, the same
  on every phone. It plays as a normal one-hole solo game (the course is that
  single id). Its result, `soloMarkDaily('minigolf', { strokes, par })`
  (`par` = what the hole asks for), is not a solo best
  (`soloRecord` must not be called for the daily).
- Resuming: starting it again the same day resumes it (`soloDailyResume`); a
  free game started over it sets it aside first (`soloDailySetAside`).
- The mini golf setup screen gets the daily button the other solo games have
  (`soloDailyButtonHtml`).
- `DAILY_GAMES` gets `{ id: 'minigolf', start: …, line: (r) => … }`, placed
  after `mines`: the line is `⛳ ${r.strokes} · 🎯 ${r.par}` with a 🟢 in
  front when `strokes <= par`.
- Accept when: two different phones (clear storage between) get the same hole
  on the same date and a different one on another date (test with a mocked
  date); finishing marks the hub's line; replaying the same day resumes, not
  restarts; the hub's share text includes the golf line; no solo best is
  written by the daily.

## Report

Write `notes/phase-reports/batch1.md`: per task, the commit, files, and each
Accept-when marked VERIFIED (how) or UNVERIFIED (why). Commit it alone.
