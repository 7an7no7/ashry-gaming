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
| the core (`RoomGames.js`, `rooms-worker/src/`, `JS_Core/Room/RoomTv/...`, `Controller.html`, `Style*.html`, the build and test scripts) or a file the map doesn't know | everything |

The sudoku race tile is in `RACE_GAMES` with the other puzzles (it was the one room
game no line of the map ever sent to the screen test). `--dry` shows the plan only; `--files=RoomUno.js,JS_Sudoku.html` asks what a change to
those files would run. A new game adds a line to `MAP` and a segment to `SEGMENTS`.

## The checks behind `npm run check` (1 Oct 2026)

- `check-i18n.js` reads `TRANSLATIONS` with a parser (acorn), not a line regex: the regex
  saw only the first key of a line, so seven `bank_col_*` keys written several to a line
  were invisible to the missing and duplicate checks.
- `check-css-vars.js` (run at the end of `check-i18n.js`) fails on a `var(--x)` in
  `Style*.html`, `Controller.html` or a `JS_*.html` that no stylesheet, inline style or
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

## On GitHub: every push, every week, every month (7 Oct 2026)

The owner picked three (E2, E1, D2): the robots and the screen test on every push, a weekly
robot that says when something broke, and a monthly look at what is played. All on GitHub
Actions with the workflow's own token: free (the repository is public, so the minutes are
too), no other service, nothing to look after.

### Every push to master and every pull request (`.github/workflows/checks.yml`)

| job | runs | expected |
| --- | --- | --- |
| `checks` | `npm run check`, `test:rules` and the leak check, the site's build under its budget (as before) | 2 min |
| `robots` | `cd rooms-worker && npm test`, `JOBS=4` | 8 min |
| `screens (screens)` | `npm run test:ui` with `ONLY=screens,fixes,site`, `JOBS=3` | 8 min |
| `screens (rooms)` | `npm run test:ui` with `ONLY=rooms,program,mission`, `JOBS=3` | 8 min |

The four run side by side on four runners (ubuntu-latest, 4 cores each), so the robots and
the screen test never share a machine (*Don't run `npm test` and `test:ui` at the same
time*). The times are expected, not measured: the first runs on GitHub will say.

- **The rooms server on the runner**: `.github/actions/rooms-server` (a composite step) runs
  `node build.mjs`, then `npm run dev -- --ip 127.0.0.1 --persist-to $RUNNER_TEMP/…` in the
  background - the wrangler version pinned in `rooms-worker/package.json` - and waits up to
  3 minutes for `/health`. `wrangler dev` is local by default (the Worker and its Durable
  Objects in workerd on the runner): no Cloudflare login, account or token. Checked on the
  PC by starting it with no reachable Cloudflare config (`USERPROFILE`, `APPDATA`,
  `XDG_CONFIG_HOME` pointed at an empty folder, `CLOUDFLARE_API_TOKEN` unset): it answered
  `/health`. `--ip 127.0.0.1` because the tests ask `127.0.0.1` and `localhost` may be
  `::1` alone on Linux; stdin is `/dev/null`, so it never waits on a prompt. No admin key
  there: the `err` robots skip reading the list, as on the PC.
- **Chrome on Linux** (`test-ui.mjs`): the runner's own Google Chrome
  (`CHROME=$(command -v google-chrome)`; the test also looks in `/usr/bin` by itself).
  `CHROME_ARGS` (new) adds flags: the workflow passes `--no-sandbox --disable-dev-shm-usage`
  (Ubuntu 24.04 restricts the user namespaces Chrome's sandbox needs, and `/dev/shm` is
  small for several browsers). On the PC nothing is added.
- **Fonts**: `fonts-noto-core` (Noto Sans / Kufi / Naskh Arabic) and
  `fonts-noto-color-emoji` are installed before the screen test. The page loads its own
  fonts from Google Fonts, but until they arrive the machine's stand in, and without an
  Arabic one the "text cut off" checks would measure boxes of another width.
- **Screenshots of failures** (`UI_SHOTS=folder`, new): at every ✗ the screen test takes a
  picture of the phone or TV it last spoke to (`lastPhone`, set by `ev`), at most 30 a
  shard, named after the shard and the check. The workflow keeps them, the test's output
  and the rooms server's log as the run's artifacts (14 days): the run's page → Artifacts.
- **A second run for what failed** (the coordinator's follow-up, same day): the jobs pass
  `--retry`. `play-all.mjs --retry` plays each segment that failed once more, alone, after
  the others; `test-ui-parallel.mjs --retry` runs each failed shard once more, alone. Only a
  second failure fails the job, and the ones that needed it are printed («needed a second
  run (failed once, then passed alone): …», with their first failures) and written on the
  job's page (`GITHUB_STEP_SUMMARY`), so a flaky one stays in sight. `play-all.mjs
  --failed-out=file` writes `{ failed, flaky, failures, firstFailures }` as JSON (the weekly
  check reads it). Without the flags the output is as before. Checked with throwaway copies
  of the two runners: a segment and a shard made to fail once passed the second time and
  were named; a segment made to fail always failed the run.
- Nothing else in the scripts assumed Windows: paths go through `path` and `os.tmpdir()`,
  and the Windows-only traps (`taskkill`, a `wrangler dev` left on its port, long storage
  paths) don't arise on a runner that is thrown away after the job.

### Once a week (`.github/workflows/weekly-check.yml`, Mondays 05:17 UTC, and by hand)

Looks only at what is live, about 10 minutes:

1. `npm run test:live -- --retry --failed-out=robots.json` in `rooms-worker/` (the robots
   against the live rooms server; a segment that passes only the second time is a note in
   the report, not a failure);
2. `npm run check:live` in `tools/` (both addresses serve the build in master, the rooms
   server runs its rules) - on GitHub its "docs/ built after the last source edit" compares
   the last commit times of docs/ and the sources (`GITHUB_ACTIONS`: a fresh checkout's
   file times mean nothing), so the workflow checks out the whole history;
3. `npm run check:songs -- --play` (دندنها: a pin that no longer resolves, a preview that
   doesn't load, an Apple address saved in `Songs.js` that is no longer Apple's current one;
   when Apple's lookup doesn't answer GitHub, the report says "not checked", not broken);
4. `node errors.mjs --json` (new: the rows as JSON) when the secret `ASHRY_ADMIN_KEY` is set.

Each step goes on when one fails (`continue-on-error`); `tools/weekly-report.mjs` reads
their logs and outcomes and writes the report: what failed, in plain words, with what to
do, and the errors **first seen** on a phone in the last seven days (older ones seen again
are listed under them; the robots' own report to `/err`, build `20260930120000`, is left
out). Something to look at → `tools/ci-issue.mjs --mode=upsert`: the open issue labelled
`weekly-check` gets the report as a comment, or a new one is opened (GitHub emails the
owner either way). Nothing → `--mode=close`: that issue gets the report and is closed.
Without the secret the report says the errors were not read. The logs are the run's
artifacts (30 days), without the errors' list.

### Once a month (`.github/workflows/monthly-plays.yml`, the 1st, 06:23 UTC, and by hand)

`node plays.mjs --month=<last month> --markdown` (new: `--json` and `--markdown`, and
`--input=file` to try the report on a saved list without the key), then
`ci-issue.mjs --mode=once`: one issue a month, «What was played in 2026-10», labelled
`monthly-plays` - the month's starts (one phone, a room, a room with a TV), the ten least
started games, the games never started that month (and which were never started at all),
every game, and the tools, folded. A room counts a game by its room id, so the report maps
it back to its card (`shatranj` is `chess` in a room; `chess` on one phone is the chess
clock). Run by hand, it takes any month. Without the secret it only warns.

### Trying them on the PC

```bash
cd tools
DRY_RUN=1 node ci-issue.mjs --mode=upsert --label=weekly-check --title="…" --body-file=report.md   # prints, calls nothing
WEEKLY_DIR=folder ROBOTS_OUTCOME=success LIVE_OUTCOME=failure SONGS_OUTCOME=success HAS_KEY=false node weekly-report.mjs
node plays.mjs --input=plays.json --month=2026-09 --markdown
```

`actionlint` (built from its source: `go run github.com/rhysd/actionlint/cmd/actionlint@v1.7.7`)
passes on the three workflows.

### What the owner does once

1. **The admin key as a secret**: on GitHub, the repository → Settings → Secrets and
   variables → Actions → New repository secret, name `ASHRY_ADMIN_KEY`, the value the same
   key the rooms server has (its `ADMIN_KEY` secret; the one used with `npm run errors` and
   `npm run plays`). Until then the weekly check says the errors were not read and the
   monthly report only warns.
2. **Be told**: GitHub emails a new issue and its comments to whoever watches the
   repository: the repository's page → Watch → "All Activity" (or Custom → Issues), and on
   github.com → Settings → Notifications, "Email" ticked for watching. Issues are already on
   for the repository.
3. **Actions**: the repository → Settings → Actions → General keeps "Allow all actions" (the
   workflows use GitHub's own `actions/checkout`, `setup-node` and `upload-artifact`);
   "Workflow permissions" needs no change, each workflow asks for `issues: write` itself.
   GitHub turns scheduled workflows off after 60 days with no commit to the repository; a
   commit, or Actions → the workflow → "Enable workflow", turns them on again.
4. The repository is public, so the issues are too: the weekly one shows the errors'
   messages (the server already blanks typed text, addresses and room codes) and the
   monthly one the play counts.
