# Faster tests, and GEMINI.md split (30 Sep 2026)

## GEMINI.md split

GEMINI.md (loaded into every AI session) was 900 KB. It now keeps the overview, an
index (one line per game and topic), each decision in a line, building and testing,
the core conventions, every trap and reloading: about 127 KB. Everything else moved
word for word: each game's spec and implementation to `notes/games/<id>.md` (47
files), the log to `notes/log.md`, the full decisions to `notes/decisions.md`, and
rooms / design / site / home / help / sound / players / content / ideas to their own
notes. `node tools/prove-docs-split.mjs --at=7067c31` (the split commit) shows every non-empty line of GEMINI.md at
57c8f60 (master when it was split) is in exactly one new file: 12,082 lines, 0
missing, 0 duplicated. CLAUDE.md says where the detail lives and to update a game's
file (and its index line) when changing it.

## The robots in segments (`rooms-worker/test/play-all.mjs`)

`main()` was one long run. It is now 38 named segments (`SEGMENTS` at the end of the
file), each playing in rooms of its own: `core` (one room of four through the party
games, the prompt memory across rooms, leaving), a segment per room game block
(`uno`, `domino`, `screw`, ... ; `uno`, `mafia` and `screw` used to borrow the core's
room and now open their own of the same four people, `fourPeople`), and the round
functions that already existed (`duels`, `chairs`, `autonext`, `err`, ...).

- `npm test` runs the segments in child processes, 4 at a time (`--jobs=N` or
  `JOBS=N`), the longest first (`secs`, measured), and prints each segment's output
  as one block when it ends, then one summary: all passes, every failure with its
  segment, the time of each. Exit 1 on any failure; a child that dies without a result
  is a failure of its own.
- `--only=a,b` runs some segments (the old single names still work: `--only=snakes`).
- `--jobs=1` / `npm run test:serial` runs everything in one process, in order.
- `EXCLUSIVE` in the file can make a segment run alone after the others, if a timing
  check ever proves flaky side by side. None needed it: five full runs at 4 and one at
  6 passed, but for one failure that was `box`'s own check (below).

## The screen test in shards (`tools/test-ui-parallel.mjs`)

`npm run test:ui` builds the preview and the site once, then runs `test-ui.mjs` as 8
shards, 4 at a time, each with its own Chrome and its own copy of the site: the
screens at 375x812, 667x375 and 1280x720 (`UI_SIZES`), the room games in thirds
(`UI_ROOMS_SHARD=i/k`; `UI_ROOM_SHARDS` sets k, 3; 4 was no faster), fixes and site.
`ONLY=` still picks parts; `UI_GAMES=uno,domino` plays only those room games.
`npm run test:ui:one` is the old single process. A part `ONLY` doesn't know, or a game
`UI_GAMES` names that isn't in `ROOM_HUB_GAMES` (`tictactoe` for `xo`), stops the run at
once: it used to run no check and print "0 passed, 0 failed", which read as green. The exit
code is 1 on any failure, never the count (a POSIX shell keeps it mod 256: 256 failures
exited 0).

Three things the load showed, fixed in `test-ui.mjs`:
- a check reading `appState` while the page was between two documents failed; `ev`
  now waits for the app (up to 60 s) and asks once more, and says the page's address
  if it never comes back;
- the play counter's beacon (`/count`) is sometimes dropped by the local `wrangler
  dev` proxy under load ("Network connection lost", a 500): no longer an error of the
  page (a 500 from anywhere else still is);
- Settings' new-build switch gets 40 s instead of 20 before it fails.

And one robot check that was flaky whatever the load: `box`'s "the highest takes
the box" compared with the bids the robots asked for, but a bid is capped at the
money a player has; it compares with the bids the server took, and checks the cap.

## Only what changed (`npm run test:changed`, tools/)

Reads the files changed since master (committed or not, new ones too; `--base=ref`
for another), maps them with `MAP` in `tools/test-changed.mjs`, prints the plan, runs:

| changed | runs |
| --- | --- |
| notes, `*.md`, `docs/`, `.github/` | nothing |
| anything else | `npm run check` |
| a root `*.js`, `rooms-worker/src/`, or `rooms-worker/test/rules.mjs` / `leaks.mjs` themselves | `npm run test:rules` |
| `Room<X>.js`, `<X>.js` rules, `JS_Room<X>.html` | the robot segments of that game, and its room game in the screen test |
| the party word lists, `JS_Room<party game>.html` | the `core` and `autonext` segments, the party room games |
| a one-phone page file `JS_<X>.html` | the screens (and the race room games for the solo puzzles) |
| `site-worker/`, the icons, `make-og.mjs` | the `site` part |
| the core (`RoomGames.js`, `rooms-worker/src/`, `JS_Core/Room/RoomTv/...`, `Controller.html`, `Style.html`, the build and test scripts) or a file the map doesn't know | everything |

The sudoku race tile is in `RACE_GAMES` with the other puzzles (it was the one room
game no line of the map ever sent to the screen test). `--dry` shows the plan only; `--files=RoomUno.js,JS_Sudoku.html` asks what a change to
those files would run. A new game adds a line to `MAP` and a segment to `SEGMENTS`.

## The checks behind `npm run check` (1 Oct 2026)

- `check-i18n.js` reads `TRANSLATIONS` with a parser (acorn), not a line regex: the regex
  saw only the first key of a line, so seven `bank_col_*` keys written several to a line
  were invisible to the missing and duplicate checks.
- `check-css-vars.js` (run at the end of `check-i18n.js`) fails on a `var(--x)` in
  `Style.html`, `Controller.html` or a `JS_*.html` that no stylesheet, inline style or
  `setProperty` defines. Its first run found seven (`--font-mono`, `--accent-btn`,
  `--shadow-md`, `--fs-xl`/`lg`/`md`, `--pad-w`); they read the real tokens now (`--sh-3`,
  `--fs-h1`/`h2`/`h3`, `--accent`, the pad's own `--pad`). `ALLOWED` in the file lets a name
  through with its reason, and says when an entry is no longer needed.
- `check-live.mjs` fails when a git call fails (it used to say nothing and could end on
  "Live." with commits unpushed).

## Times (this PC, local rooms server on its own port, 30 Sep 2026)

| suite | before (one process) | after (4 at a time) |
| --- | --- | --- |
| `npm test` | 983 s (16.4 min) | 249-299 s (4.2-5.0 min); 182 s at `--jobs=6` |
| `npm run test:ui` | 603 s (10.0 min) | 191-243 s (3.2-4.1 min) |

The "before" times were measured on 906fcfb (master before the four picks, which added
the `autonext` and `err` rounds, about 40 s serial). The longest segment (`duels`,
about 2 minutes) is the floor for the robots however many jobs run.
`.github/workflows/checks.yml` is unchanged: it already caches npm.
