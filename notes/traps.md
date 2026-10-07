# Traps this codebase has already fallen into

Moved out of GEMINI.md word for word on 7 Oct 2026 (the owner's pick G1: GEMINI.md is read at the start of every session, and this section was 61 KB of it). GEMINI.md keeps one line per trap under *Traps*; the whole story of each is here. A new trap goes here, with its line there.


**A file that patches another file's registry entry depends on load order.**
After the lazy split (30 Sep 2026) the tournament wrapped the duels when its own
chunk ran - before dots, X-O, خمّن مين, حرب السفن and شطرنج had registered - and
the quiz chunk overwrote the emoji router the solve chunk had installed: on the one
page the include order hid both, and no test switched a room to a tournament (the
audit of 1 Oct 2026). A game wraps itself when it registers (`tourWrap('dots')` at
the end of its file), a second writer of an entry yields to the first
(`svRouter`), and `checkRegistryOrder` in `tools/lazy-split.mjs` fails the build
on an entry set twice, read before it is set, or wrapped before it registers.

**Text from a player is never parsed as HTML, not even in an element that is never
shown.** `shareCardText` read the share card's footer (champions' names) through
`innerHTML` on a detached `div`; an `<img onerror>` fires there too, so two
room names of 20 and 11 letters ran script on the phone that tapped 📸 (the audit
of 1 Oct 2026). Read markup's text through `new DOMParser().parseFromString(...)`,
an inert document.

**A board is the roster's.** A latecomer watching is in `room.players`, so a
board built from it banked them on the night (in القنبلة, 0 strikes put a watcher
first), and a board with no `score` (ربع قرد) or no player rows (أسماء الرموز's
cards) banked nothing. `nightBoardOf` (RoomGames.js) keeps the people who played
and ranks teams through `PROGRAM_TEAMS`; a new game's board carries a `score`, best
first, and is read through it. A board that is a tally across play-again (كدّاب, الشايب, جمجمة)
is not this game's places: such a game registers its own result in `ROOM_RESULT_BOARDS`
(and `NIGHT_FROM_RESULT`), and the room's night and برنامج السهرة both place a game through
`nightPlacesOf` - one function, so the two tables never disagree (the review of 1 Oct 2026).

**A chunk runs after DOMContentLoaded.** A game file that paints at start-up
must paint at once when `document.readyState` isn't 'loading', and a registry a
shell file reads once (`SOLO_LATE`) has to take late entries. A chunk is
several scripts joined, so one that throws at load stops the rest of its chunk.

**A game's screen isn't in the page until its chunk has run** (7 Oct 2026).
`document.querySelectorAll('[id^="view-"]')` lists 32 screens, not 208: a test
or a tool that wants every screen walks the `<!--[lz:view-…]-->` comments too
(`ALL_VIEWS` in test-ui.mjs), and code that asks `getElementById('view-' + x)`
to tell whether a screen exists asks `lzChunksOfView(x)` as well. Code that
runs over the page's markup once at start-up has to run over a chunk's markup
as it comes: add it to `adoptMarkup` (JS_Core.html).

**An outside service can answer your PC and refuse Cloudflare.** دندنها's songs
streamed on `wrangler dev` and in every local test, and gave 0 bytes on the
live server: Apple's lookup (`itunes.apple.com/lookup`) answers 403 to
Cloudflare's servers (its search 429), while its audio files load fine from
there (1 Oct 2026, found by `npm run test:live`). An Apple song keeps its
preview's address in `Songs.js` (`u`, refreshed by `npm run check:songs --
--fix`). Anything the rooms server fetches from outside is tried from the edge
(`wrangler dev --remote` with a scratch Worker) before it is relied on.

**A `wrangler dev` on a port already in use still prints "Ready".** Tests then
hit another session's server. Check the port's owner first
(`Get-NetTCPConnection -LocalPort …`). And two servers of the same Worker
on one PC (parallel builders) write one dev-registry file; one dies with
EPERM mid-test (1 Oct 2026). Give each its own `WRANGLER_REGISTRY_PATH`.

**A style a test adds to `<head>` loses to the app's own.** The page's stylesheets are
in `<body>` (the logo comes first), so a rule injected into the head with the same
weight is overridden and a "before" screenshot silently shows "after" (30 Sep 2026).
Append test styles to `document.body`, and read the computed value to be sure.

**A timeout must do everything that is due, or the room waits 30 s.**
`room.js` gives a timeout that leaves its own deadline still in the past a
30-second rest (`failedDeadline`, against an alarm that loops). سلك مقطوع's
card ended in one timeout and its first orders were due in the same moment,
so they came 30 s late and the robots never saw an order (29 Sep 2026). The
card's end falls through into the orders now (`wireTimeout`), and
`wireDeadline` doesn't count an order waiting on the shake. A game whose
timeout moves one phase into another that is already due does both in one
pass.

**A robot reads the server's time through the gap, never its own clock.** On 29 Sep 2026
`play-all.mjs --only=snakes` failed live twice ("people roll on their turn once the table has
seen the last roll") and passed locally: this PC's clock was 8.3 s behind Cloudflare's, and the
robot slept until `readyAt - Date.now()`, so every roll was 8 s late and only one fit in the
minute. The game was right - a phone turns `readyAt` into its own time with the smallest
`receivedAt - serverNow` seen (`snkReadyLocal`), so a fair roll is never dropped. The robot does
the same now, and counts a roll only when the ack's `turnSeq` moved (a dropped tap is acked ok
too). Any test that compares a server stamp (`readyAt`, `endsAt`, `nextAt`) with `Date.now()`
has to convert it first, or it passes on a local server and fails on the live one.

**A screen's signature must include everything its frame decides.**
`renderRoomTv` asks `TV_GAMES.<id>.sig(state)` before it calls `frame()`. المشنقة's TV
started its hold (`hmRoomHold`: the guessing frame kept on while the last moment plays)
inside `frame()`, so the signature said "no hold" while the held frame was drawn; when the
hold ended its timer redrew, found the same signature, and the TV stayed on the guessing
frame with no result and no "next word" until something else in the room changed (the audit of 28 Sep
2026). The signature now decides the hold first (`sig: (state) => { hmRoomHold(state,
true); return hmRoomSig(state); }`), as سكرو, أونو and the card games decide their
endings in `sig`. Anything a frame reads from page state - a hold, a busy flag, a moment -
is settled before (or inside) the signature, and a timer that redraws later goes through
`routeRoomState` only on a room screen (`onRoomView()`), or it drags a player back.

**A clock kept "for the same deadline" may be one `setView` stopped.** The
room renderers keep their turn clock while the deadline is the same
(`if (x.clockKey === endsAt && x.clock) return;`), but leaving the room screen
runs `clearAllIntervals`, which stops every clock; coming back found the dead
clock under the same key and the badge stood still (the audit of 28 Sep 2026,
eighteen renderers). The guard asks `x.clock.isRunning()` too - a new clock
kept for a deadline does the same.

**`onRoomClocksReset` runs for every game, not just its own** (the audit of
28 Sep 2026). The router calls every registered stop whenever the game, the
lobby or the deal changes, in any game. عربيات التصادم's stop left
fullscreen whenever `document.fullscreenElement` was set, so a laptop TV put
in ⛶ (`toggleTvFullscreen`) dropped out of it at every game's start; and
شطرنج and باغ هاوس each threw away the one chess board the other was about to
draw on. A stop undoes only what its own game started: remember it (bumper's
`bmp.locked` for the fullscreen it asked for) and touch nothing when that game
isn't running; leave shared pieces (the chess view) to whichever game uses
them next.

**A scheduler holding an old AudioContext goes silent after `wakeAudio`
replaces it** (the same audit). A lookahead loop or a long sound that kept
`const ctx = fxCtx()` from its start (the chairs' music, bumper's engine,
bowling's rumble) played on into a context iOS had left stuck, and when a tap
made a new one it heard nothing for the rest of the round. Read `fxCtx()` on
every tick, and when it has changed, rebuild the nodes (or reset the timeline
to the new `currentTime`) on the new one.

**A board is best-first, and some games win low: read row order, never the
biggest score.** Every game's `shared.board` is sorted with the winner first,
and القنبلة (strikes), الشايب (losses), ميني جولف (strokes) and سكرو (points)
sort ascending. `settlePredictions` took `Math.max` of the scores, so «مين
هيكسب؟» told the room that whoever picked the loser had called it (the audit of
28 Sep 2026). The winner is `board[0]` and whoever shares its score, as
`bankNightPoints`, `renderPodium`'s callers and `shareRoomResult` already read
it. A tally (votes, wins, the night's points) is higher-is-better and may use
`Math.max`; a game's board may not.

**A `:has()` above a universal subject taxes every DOM change.**
`[id^="view-setup-"] :is(.field, div):has(> .field__label:first-child + .stepper)
> :not(.field__label, .stepper)` looked scoped to the setup screens, but Chrome
matches right to left: every element's parent was checked with `:has()`, and
every `innerHTML` anywhere - a room's state push, a filter chip - re-checked
`:has()` state up and across the tree. That one rule was half the style
recalc of every room screen (8 s of أونو: 1,865 ms → 89 ms at 6x throttling
without it). Putting a class before the `:has()` in the same compound did not
help; a class in the markup did (*The design system*, *Performance*). Measure a
selector by removing it through the CSSOM and rebuilding a view's markup N
times (`Performance.getMetrics`' `RecalcStyleDuration`); Chrome's selector
stats in a trace inflate the matching time about ninefold and missed it.

**A plug-in's board field is the engine's once it is named the same.** The
solve engine stamps a done board with `b.at = Date.now()` (its seconds), and
إيه اللي يجمعهم؟'s race board kept its current round as `at` too - a finished
board pointed at round 1,790,512,033,850. A plug-in names its fields for
itself (`cur`); before adding one, read what the engine writes on a board.

**The rules tests read the built bundle, not the sources.** `rules.mjs` and
`leaks.mjs` import `generated/rules.js`; an edit to `Pinpoint.js` or
`ConnectionsWords.js` does nothing to them until `node build.mjs` has run
(the dev server rebuilds it, a test on its own does not). Three "failures"
of 27 Sep 2026 were a stale bundle.

**A script that inserts at an anchor must match the anchor only.** The
race's eight test blocks were meant to replace the trailing `// RACE:<id>`
anchors; the regex also matched `// RACE:engine` at the top, so the blocks
landed before the `let r` they used ("Cannot access 'r' before
initialization"). Anchor lines get a shape nothing else in the file has.

**A `<details>` drawn open fires its `toggle` too.** The lobby's folded
options remembered "the host opened it" from the toggle event, and a details
written into the page with `open` fires that event by itself - so the options
never folded again. The handlers (`lobbyOptsToggled`, `firstPlayToggled`)
compare with the state the markup was drawn in (`data-r`) and only count a
change.

**A minifier can make a page bigger.** esbuild escapes every character outside
ASCII by default, so the first minified build turned each Arabic letter (two
bytes) into `\u0627` (six): whitespace went and the page barely shrank. Pass
`charset: 'utf8'`, and measure the gzipped size, not the character count.

**"1 / 3" with spaces reads "3 / 1" in an Arabic line.** The slash joins two
numbers only when it touches them; with spaces round it each number is a run of
its own, and a right-to-left line lays them out right to left (measured in the
page: the 3 sits left of the 1). "1/3" with no spaces is safe. The party games'
counters (the relay's turn, خبّي الموبايل عن … · 1 / 4, كلمة واحدة's round,
ارسم واكتب's chain and step) go through `ltrFrac(a, b)` in `JS_TeamRelay.html`,
which holds them left to right (LRI … PDI); since 26 Sep 2026 the room files
and the TV do too (the trivia and vote counts, the quiz cards, صدق ولا كذب) -
grep `} / ${` before adding another.

**One lost brace puts the rest of the stylesheet under a media query.**
Section 34 of `Style.html` ended its `@media (prefers-reduced-motion: reduce)`
block without its `}` and lost the `/* ====` that opened section 35's
comment, so from 24 Sep 2026 every rule after it - باغ هاوس, شطرنج الأربعة,
the chess hub's row, the host's name menu - applied only on a device asking
for reduced motion. Nothing failed: a headless Chrome reports reduced motion,
so every screen test and screenshot saw the rules working. Found when a new
section (38) had no effect in a check run with motion on. After editing
a `Style*.html` part, count `{` against `}` and `/*` against `*/`, and look with
`prefers-reduced-motion: no-preference` emulated.

**A size container gives its grid column no width.** شطرنج الأربعة's board
sits in `.ch4-stage`, a `container-type: size` box (its pieces and chips are
sized in `cqw`), and on a phone on its side and a laptop that box was in an
`auto` grid column. Size containment means the box has no size from its
content, so the column came out narrower than the board and the column beside
it slid under the board's right side. Put the width on the grid item itself
(`.ch4-game__stage`, `.ch4-tv__stage`) and let the container fill it. And a
class name is one name in the whole page: `.ch4-dot` was first the legal-move
dot (absolute, a third of a square) and then the log's colour dot, and the
second rule inherited the first's `position: absolute`.

**A headless Chrome shows no animation unless told to.** It reports
`prefers-reduced-motion: reduce`, so `motionOff()` is true and every move
lands without its motion: a screenshot "mid-move" shows the move done. Emulate
`prefers-reduced-motion: no-preference` (`Emulation.setEmulatedMedia`), and
to photograph a 3D move mid-way replace the page's `performance.now` and
`requestAnimationFrame` with a manual clock in the test (virtual time did not
hold it).

**A vote on a chess board must give the piece back.** The chess board's
drag leaves a dropped piece on its new square when `onDrop` says it was
played, waiting for the next position to carry it; a vote plays nothing, so
the piece sat on the wrong square until the next redraw. A vote's `onDrop`
returns `'pre'` (the premove's answer): the piece goes home and only the
arrow stays. And in a CDP run the duels' pill scores of a tab that is not in
front stay at the old number (`countUp` waits for a frame): activate the
target before reading or screenshotting them.

**A page can't be opened from an answer that came through a redirect.** The
offline copy saved `./index.html`; GitHub Pages answers that directly, but
Cloudflare (the second address, and the rooms server's copy) answers it with a
307 to `./`. The worker kept the followed answer, and every open after the
first failed with ERR_FAILED - the owner found it on the second address the
evening it went up. The worker now saves the page from `./` (answered directly
everywhere) and rebuilds any redirected answer as a plain one (`clean` in the
worker, `tools/build-site.mjs`); `npm run test:ui`'s server redirects
`index.html` the way Cloudflare does, so the site part would catch it again. A
phone with the broken worker recovers by itself on the next open but one: the
failed open still fetches the new `sw.js`.

**What reads the address has to run before the build's script at the end of
`<head>`.** That script (`RUNTIME` in `tools/build-site.mjs`) takes `?room=`
and `?install=` off the address, so a reload doesn't reopen the join screen.
`window.SERVER_DATA.room` reads the code from the address, so it stays in
`<head>` above it. Moving it into `<body>` with the styles (23 Sep 2026, the
logo-first change) would have opened every room link on the home screen
with no code - caught before it shipped.

**The logo comes first in the page.** Controller.html keeps only the small
intro styles and the page data in `<head>`; `Tailwind.html`, the `Style*.html` parts and
the shared rule files (`SHARED_LISTS`) are in `<body>`, after the intro and
its two small scripts. A first visit on a slow connection used to be a black
and then a white screen until 1.4 MB (400 KB compressed) had arrived; the logo
now comes after 14 KB. Don't move anything big above `#app-loader`.

**A play-once key must carry the deal, not only the round.** A room's round
starts at 1 again at every new game from the hub and every new tournament, and
a capped list's length stops changing once it is full. The duels keyed their
motion, sounds and confetti on the room code and the round, خمّن مين its answer
bubble on the log's length (kept at 8): the next tournament's games, a second
game from the hub, and every question after the eighth played silently. The
keys carry `roomDealKey(state)` now, خمّن مين a counter that only goes up
(`s.logSeq`), and a tournament's game number is `t.no * 1000 + gameSeq`. The same
mistake kept only the first chess game of a room for review (`chRoomGameKey`
has the deal in it now).

**A translation key built from parts is invisible to the "never referenced"
warning.** `check:i18n` finds `t.together_how`, not `t['together_step' + n]`,
so the clean-up of 20 Sep 2026 removed the three «إزاي بتشتغل؟» steps of the
مع بعض tab as unused, and the tab showed 1, 2, 3 with no words until the
owner noticed on 24 Sep. Since 3 Oct 2026 the check counts a key as live when the
code builds its prefix or suffix (`'mg_h_' + id`, `` `ch_piece_${p}` ``,
`'together_step' + n`, `key + '_line'`), and its list of unused keys went from
662 to the few really dead. Still grep a key's prefix before removing it: a key
assembled any other way is invisible to it.

**A play-once memory is empty after a reload.** `motionFirst` and `duelOnce`
live in the page, so a reloaded phone, a late joiner and a TV coming on used
to replay the last disc, its sound, the win line and the confetti. A room
screen marks what is already on the board as seen the first time the page
sees that game (`duelRoomFirstSight`), before it draws; a new game from then
on animates as always. And a host button that moves a round on (skip, undo,
next) must send what it was pressed for, or a double tap does it twice: the
audit of 24 Sep 2026 found eight that didn't.

**A 3D screen has to ask, when three.js arrives, whether it is still wanted.**
Leaving mini golf while three.js was loading found nothing to dispose; the
course was then built into the hidden screen and drew 30 frames a second in
the background until golf was opened again. `mg3Mount` and `bowlGfxMount`
check the screen after loading and let go (chess and battleship already did).

**Redrawing a room screen with innerHTML wipes what is being typed.** المشنقة
rebuilt its frame on everyone's progress, so a name typed in the whole-word box
vanished whenever someone else guessed a letter. `hmKeepTyping` /
`hmRestoreTyping` keep the value, the caret and the focus across the rebuild
(خمّن مين does the same with `gwLocal.typed`). Any room screen with a text
field needs one of the two.

**A setter's place in the order is a number: move it when the order shrinks.**
المشنقة and "one sets, everyone solves" count the next setter from `setterAt`.
Someone before it leaving shifted everyone after them, so one player set twice
and the next was skipped; `setterAt` now moves back one when someone at or
before it leaves.

**`wrangler dev` on Windows fails when its storage path is too long.** A copy
of the project deep in a temp folder answered every room with "internal
error" (SQLite behind the Durable Objects hit the path limit); `--persist-to`
a short folder fixed it. Also: `.preview/` has one fixed place, so a second
session building its own preview overwrites the first's.

**A room screen's signature must carry the deal.** ارسم وخمّن keyed its frame
on the round, the drawer and the phase; going back to the hub and dealing the
game again is round 1 with the same drawer, so the drawer's phone kept the last
deal's frame - its word - while the server had dealt a new one (the owner, 23
Sep 2026: "the same word again and again"). `renderRoomFrame` now puts the
room's code, game and `shared.dealId` in front of every signature, the drawing
screen keys on `roomDealKey`, and the TV's signature has the deal too. A screen
that compares its own signature must do the same.

**A sound bug that a refresh fixes is a stale audio context.** On iOS a
context that was interrupted by another app (the camera, WhatsApp, the share
sheet) can stay silent however often a tap resumes it; only a new one works.
Detect it (not running, or its `currentTime` not moving, a moment after a tap)
and replace it in the next tap (*The soundboard*).

**A game's clock branch can catch a room that isn't playing that game.**
`gameTimeout` ends a card of any `QUIZ_GAMES` room (`if (QUIZ_GAMES[room.game])
{ closeQuizCard(room); return true; }`), so an emoji room on the engine
(one sets, everyone solves) would have had its deadline "handled" by the
quiz - nothing closed, `true` returned, and the round never timing out. The
engine's check comes first in `gameTimeout`. A game that gives an existing
room a second way checks every per-game branch (the clock, leaving, the turn)
for the room's own state, not just its `room.game`.

**A number secret is any count.** The leak check finds a value anywhere in
a view; a secret number (خمّن الرقم's 7) is also a score, a round or a try
count, and a solver's own narrowed range may land on it. Its probe looks for
the number outside the places that hold counts, and another probe checks
that a solver's board is exactly its own.

**Stopping `wrangler dev` through its shell leaves it running on Windows.**
The background task's shell dies and the node process under it, with its
`workerd` children, goes on holding the port; a second `wrangler dev` on the
same port then starts beside it, and requests to the port hang. Kill the
node process by its command line (`--port NNNN`) with `taskkill /T`.

**A name the app already uses is taken in every file.** The chess game
could not be `chess` on the page: the chess clock tool is the help entry
`chess`, the catalog tool `chess` and the screen `play-chess`, and the room
lobby asks `helpEntry(Room.state.game)` for the rules of the game chosen, so a
room game called `chess` would have opened the clock's rules. The game is
`shatranj` on the page and `chess` in rooms, and `ROOM_HELP_KEY` (JS_Utils)
maps a room game to its help. Before naming a game, grep its id in
`HELP_ENTRIES`, `GAME_CATALOG`, `VIEW_META` and the view ids.

**`scrollIntoView` on an item in a scrolling list scrolls the page too.** The
chess review kept the current move in sight with it, and on a phone every
step scrolled the board off the top of the screen. Set the list's own
`scrollTop` instead.

**A duel's `shared.board` is its scoreboard, and كونكت ٤'s `mode` is 4 or 5
in a row.** إكس أو's grid was first `shared.board`, and `duelAction`'s start
overwrote it with `scoreboardOf(room)` - the room game had no squares. It is
`cells`. And the tournament's start first said `mode: 'tour'`, which كونكت ٤'s
own start payload (`{ mode: 4 }`) overwrote, silently playing winner stays;
it is `tournament: true`. Before naming a field of a room game's shared state
or start payload, read what the game (and the duels' helpers) already put
there.

**Physics that passes a test can still be wrong everywhere else.** The first
bowling pins passed "a pocket hit strikes more often than not" - and struck
from 40% of head-on hits and more than half of the crossovers, because the
test only looked where a strike was expected. Measure a physics model over the
whole range of inputs against what should happen at each (a table of strike
rates by spot and angle, and the leaves), not at the one spot a test names.
And a formula written from absolute directions (`nx * 3.1 - ny * 1.7`) breaks
mirror symmetry: build it from the contact's own normal and relative velocity
(a cross product flips sign in a mirror, as it should).

**Read a gesture where it was drawn.** A bow in the bowling swing, measured on
the lane, was flattened to nothing by perspective (the far half of the push is
metres long on the lane and a few pixels on the screen); the same bow measured
on the screen is what the thumb drew. A direction, on the other hand, belongs
on the lane, where the ball rolls.

**A course's box is not the course.** ميني جولف's scattered trees kept off
the green grown outward from its box's middle, which is right for a rectangle
and wrong for a hole that turns a corner: bushes grew in the elbow of an L,
their crowns over the rail. They keep a distance from every edge of the green
now. And a tall piece of scenery placed "beside" the course can stand between
it and the camera: on a phone on its side and on a big screen the camera looks
from the +x side, so a building there hid half a hole in landscape while the
upright view was fine. Look at every hole both ways round.

**A maze written as a list of open passages must read them either way.** The
first hedge maze listed its passages as 'a|b' and checked only 'a|b', so the
ones written the other way round became walls and the maze had no way through
(the test's search said so at once). Normalise a pair before looking it up.

**The rules tests have no prompt memory across rooms.** `nextPrompts` reads
the shared memory through `PropertiesService`, which `rules.mjs` doesn't have,
so each room there only remembers its own deals. A test that holes don't come
back across games deals them in one room (back to the hub and start again);
across rooms is the live server's job.

**A half-pipe is a pipe until you check which half.** The bowling gutters
are half of a `CylinderGeometry` (`thetaStart`, `thetaLength` π) turned
along the lane, and with `thetaStart` π/2 the turn left the *upper* half: two
pipes lying on the lane's edges instead of two channels below it. Drawn dark
and one-sided, it read as "a black pipe on both sides" (the owner), and a
ball in the gutter was half inside it. `-π/2` gives the lower half; the
material is `DoubleSide` (you look at its inside) and the ball rests on its
floor (`BALL_R - GUTTER / 2`). Look at a new curved piece from the camera's
own angle, not only from above.

**A line that is clear for the ball's middle can still drop it in the
water.** ميني جولف's gentle putt aimed along lines checked only at the
ball's centre, every 0.2 units; on the oasis a line grazed the pond's corner,
the ball clipped it, went back to where it lay, and the same putt was chosen
again - for ever, a stroke each time. And on the gate hole the sliding door
always covers its own middle, so the straight putt at the cup bounced back
every time. The field and the clear line now keep off the water by more than a
ball's width and treat what a moving piece never leaves as solid. A check that
a helper "gets there" has to play it again and again, not once from the tee.

**A tab of the built-in browser that isn't in front gets no animation
frames.** Driving the app in a background tab of the desktop app's browser
pane, a golf roll never moved (`requestAnimationFrame` never came), and a
second roll then took the first one's balls. Test rolls in your own headless
Chrome (`--use-angle=swiftshader`, a browser context per phone), not in a
tab you don't own.

**A class name for a wrapper and for a widget can collide.** The solo
view's wrapper was `.mg-host` and so was the host's row of buttons,
absolutely placed - the whole course collapsed to 0 × 240 px and nothing
failed but the picture. Name a widget for what it is (`.mg-hostrow`).

**A solid under a surface covers what goes down through it.** The course
stands on a stone plinth (an extruded polygon); its top at the green's
height z-fought with the grass, and the cup and a bowl, which go below the
green, were covered by it. The plinth's top is 3 cm under the green and it
has holes where the cup and the bowls are. Water lies *over* the green
(with a polygon offset): a hole in the green shape for a pond that touches
the rails' edge doesn't triangulate.

**three.js's `render` is not on the prototype.** `WebGLRenderer` sets its
methods on each instance in its constructor, so counting frames by patching
`THREE.WebGLRenderer.prototype.render` counts nothing. Wrap the constructor
on `window.THREE` before a game builds its renderer and patch the instance.
And a frame-rate check under SwiftShader is bound by the CPU (three pages
rendering share it: 6 frames a second each), so it can't tell 30 from 5;
`--use-angle=d3d11` on this PC draws at the headless 144 Hz.

**Headless Chrome needs a software GL for a 3D check, and it is slow**:
`--use-angle=swiftshader --enable-unsafe-swiftshader`. At full frame rate
it starves DevTools calls for seconds; `MG3.fpsCap = 3` in the page keeps a
scripted check moving (the cap is 0, off, for everyone else).

**A margin rule on `.row > * + *` loses to the item's own `margin: 0`.**
The hand's overlap (`--pc-gap`) was set on `.pc-row > * + *` (one class
of weight) and the card buttons had `margin: 0` on their own class, later
in the file: the same weight, so the button won and no hand ever
overlapped - a phone's cards ran off both edges. `.pc-row >
:not(:first-child)` weighs two, and wins.

**An isolate inside an isolate hides its letters from the outer one.**
A claim was built as "2 × ⁨سبعات⁩" (the rank isolated by the translation
helper), then isolated whole inside a line: the outer isolate looks for
its first strong letter *outside* nested isolates, found none in "2 × ",
took left to right, and the Arabic line read "سبعات × 2". A phrase that
will be isolated as a whole is built without isolates inside
(`dbClaim`). And an Arabic name before ": 2" in an English line pulls
the number to its side: names in hand-built markup go in `<bdi>`.

**The scratchpad is shared by every agent of a session.** Another
agent's driver overwrote this one's `cdp.mjs` mid-run (and pointed it at
its own preview port). Keep test drivers, Chrome profiles and ports in a
folder and a port range of your own.

**The i18n check used to read every `t.x` as a translation.** Since 3 Oct 2026
`check-i18n.js` parses the scripts and follows each `t` to its binding: a table
made from `TRANSLATIONS` or a game's helper named `…T()`, `…Tr()` or `…Text()`
(`crewT()`, `xoTr()`, `tbText()`), or a parameter of a function that isn't a
callback. A texture, a touch or a tile called `t` is left alone, and so is a
comment; a key a file defines in its own `{ ar: {…}, en: {…} }` passes. A new
helper that returns the translations is named that way, or the check can't see it.

**Tailwind scans comments too.** A comment with the word "outline" in a
`JS_*.html` file made `npm run build:css` add a `.outline` utility. Only
rebuild the CSS when a class was really added, and check the diff.

**A room frame rebuilt with `innerHTML` takes its canvas with it.** A WebGL
canvas can't be in the frame's markup: keep it in a root the game owns and
append that root to the new host after every rebuild (a moved canvas
keeps its context).

**Headless Chrome draws WebGL only with SwiftShader**
(`--use-angle=swiftshader --enable-unsafe-swiftshader`), and its tabs share
one `localStorage` - so one room session: give each tab its own browser
context (`Target.createBrowserContext`) to act as separate phones.

**`forceContextLoss()` fires `webglcontextlost` on the canvas being
disposed.** The lane listened for a lost context to mark 3D as unavailable;
leaving a bowling screen disposed the renderer, the event arrived a moment
later and marked the *next* lane (already built) as "this device can't draw
3D". The listener now ignores any canvas but the one in use, and dispose
forgets the canvas before losing its context.

**Headless Chrome with SwiftShader draws a frame in 100 ms or more**, so a
throw looks slow and screenshots taken on a wall clock miss the moment. To
look at the crash or the setter, replace the loop (`bowlGfxFrame = () =>
{}`) and step `bowlGfxUpdate(1/60)` yourself, then render.

**A Durable Object alarm set in the past fires at once.** `scheduleAlarm`
took the soonest of the game's deadline, the presence check and the idle
clean-up; once a room was past its 6 idle hours with a phone still connected,
the clean-up time was behind it, the alarm fired, found the phone, and set
itself to the same moment in the past - a loop, each run a request on the free
plan. Every time handed to `setAlarm` is at least a second ahead now, and a
time that is already past is replaced by the next time worth looking.

**A keyframe that leaves a property out animates it back to the element's
own value.** خمّن مين's verdict («صح!») sits at `opacity: 0` until its turn,
and pops with `gwPop`, whose last keyframe names only `transform`. With
`fill: both` the pop ended by fading the verdict back to the 0 it started
from. The rule that starts the animation also sets the end state
(`opacity: 1; transform: none`), so the element's own value is the one the
animation ends on.

**An iPhone gives a password field only its English keyboard.** المشنقة's
writer types a word the others mustn't see, and `type="password"` looked like
the answer - but iOS lets a secure field use only an ASCII keyboard, so the
word could not be written in Arabic. The field is `type="text"`, and **not
`-webkit-text-security` either**: Safari takes a field drawn that way for a
password and offered to save the word whenever the game was left (the owner, 24
Sep 2026). A secret field is `.secret-field`: the input's letters are
transparent (`is-hidden`, which the eye toggles) and `.secret-field__dots` draws
one dot a letter over them (`secretDotsPaint`, JS_Hangman.html, run on every
`input` event and after a redraw restores what was typed). Hide typed text that
way everywhere.

**A flex item's intrinsic size ignores its flex-basis.** المشنقة's tiles were
`flex: 0 1 2.375rem` with no width, which was fine while they sat straight in
the row. Grouped into one flex container per word, each group took its
max-content width from its tiles' content - one letter each - and the tiles
shrank to a few pixels. A box that must keep a size inside a nested flex
gets a `width` (and a `min-width` to shrink to), not only a basis.

**Two preview tabs share one saved room session.** A room's session is saved
in `localStorage`, which every tab of the preview shares: a tab reloaded (or
opened) after another joined comes back as that other phone, and joining from
it as a TV makes that player leave. To act as several phones, open the tabs
and join from each without reloading - or check who a tab is (`Room.me`)
after a reload.

**Keeping only good answers loses the fonts offline.** The Google Fonts
stylesheet is a `<link>` without `crossorigin`, so it is fetched without CORS
and its answer is opaque: status 0, `ok` false. A worker that keeps only
`res.ok` never saved it, and offline the fonts were gone even though their
files were cached. Keep opaque answers from the pinned hosts. But an opaque copy answers only a no-CORS request: handed to a CORS
one for the same address (an extension, a preload) the browser turns it into a
network error and the fonts fail (2 Oct 2026); such a request goes to the network. And test
offline with the server really switched off (`curl` it): a page a worker
controls sends every one of its fetches through that worker, whatever the
address, so a fetch from the page can't tell you whether the server is up.

**A secret slice is sent whole.** `project()` gives each phone everything in
`room.secrets[pid]`. قبل ولا بعد kept each hand twice there - the cards with
their years for the server, the same cards without for the screen - so every
phone received its own answers in its traffic, while the screen showed none.
Anything the owner of a slice must not see (its own answers, a deck, a vote)
goes in a `room._*` field; the slice holds only what that phone may read.

**jsDelivr's `.min.js` files are made on request, so an SRI hash on one can
break.** jsDelivr says not to use SRI on its minified-on-the-fly files; the
confetti and QR scripts are pinned to files the packages ship themselves
(`dist/confetti.browser.js`, `qrcode.js`). To bump either, download that exact
file and hash it (`openssl dgst -sha384 -binary | openssl base64 -A`): a wrong
hash means the script never runs, silently.

**`defer` still holds `DOMContentLoaded`.** The app starts on
`DOMContentLoaded`, and a deferred script from a CDN that is slow (or blocked)
holds it until it arrives or fails - the whole app waited on the confetti.
The two CDN scripts are `async` now, and an ES5 stub in the head takes
`confetti()` calls until the library replaces it (`JS_Sounds.html` wraps
whichever is there, and wraps again on the library's `load`). Anything else
loaded from outside: `async`, a stub, and a page that works without it.

**A sticky bar can't rise above the box it lives in.** Every setup with the
«موبايل واحد / كل واحد بموبايله» switch kept its Start bar inside its panel
(`.mode-device-panel`); on a phone 667px tall the hero put that panel's top so
low that Start could only stick 55px under the visible edge, half under the bar
and «افتح غرفة», until the page was scrolled (3 Oct 2026). The panels are
`display: contents` now, so the bar lives in the card. A sticky bar's parent
must start high enough on the shortest phone; measure its button at scroll 0.

**A sticky box stops at the scroll area's padding, not at its edge.** The
Start bar of every setup screen (`.view-actions`, sticky at the foot of
`.shell__main`) reached down a fixed 8px while the scroll area's foot padding
was 24px (16px on a phone on its side), so a stuck bar floated 16px above the
edge and the page scrolled past in the strip beneath it - the owner saw
بنك الحظ's switches showing under its Start on a PC (21 Sep 2026). The
padding is a variable now, `--main-pb` on `.shell__main`, and the bar reaches
down by exactly that. Change the foot padding through `--main-pb`, never with
a plain `padding-bottom`, or the strip comes back. (The rounded action bars of
سكرو, أونو, لودو and بنك الحظ float above the edge on purpose.)

**A percentage padding is measured against the containing block's width.**
بنك الحظ's squares first kept their icon clear of the colour band with
`padding-top: 22%` and the like. On an absolutely placed square that is 22%
of the whole board's width, not of the square: the squares on two sides grew
wider than the board's corner, their bands slid under the middle, and a
square landed on was outlined halfway across the board. Anything sized
inside a small absolutely placed box goes in an inner box with `inset` (whose
percentages are the box's own), never in the box's own padding.

**A room game that looks right with no network can still feel wrong on a
phone.** On the local server the answer to a move comes back in a few
milliseconds, so two things only showed on the owner's phones (21 Sep 2026):
a preview that vanishes when the finger lifts and a real piece that appears a
round trip later reads as *two* moves (كونكت ٤'s aim disc), and a queue of
motion that makes every new state wait holds up the player's own next tap
(أونو after a Skip). Test a room move with the socket slowed down - wrap
`WebSocket.prototype.send` in a `setTimeout` of 250ms in the page - and time
your own move from the tap to the screen. Your own move is drawn at once (the
duels' `early`, أونو's `unoOwnMoveWaiting`); other people's may wait their
turn to animate.

**A restyle section at the end of the file still loses to a heavier
selector above it.** Section 39 (the arcade look) restyles classes the
earlier sections placed with heavier rules: `.gcard > *:not(.ripple)` weighs
(0,2,0), so a poster's badge placed by `.gcard__badge` stayed in the flow
until it was placed by `.gcard > .gcard__badge`; `body.dark .home-hero`
outweighs `.home-hero--compact`, so the compact row kept the old gradient in
dark mode until the dark selector was written too. And inside one section
order still counts: `.home-feat` written before `.gcard` lost `aspect-ratio`
and `min-height` to it (`.gcard.home-feat` now). When a later rule "doesn't
apply", compare specificity before adding `!important`.

**A custom property that doesn't exist is silently nothing.** The first-play
card used `var(--sp-3-5)` and `var(--sp-2-5)`; the scale has only whole steps
(`--sp-1` … `--sp-9`), so its padding and gaps were 0 and its text touched
the edge. No check fails on it. Grep `--name:` in `Style*.html` before using a
token.

**A default on the base class beats a modifier on the same element.** سكرو's
card set `--c` (its colour) on `.skr-card`, and each group set it on
`.skr-c--bad` and the rest - one class each, so the same specificity, and the
base rule came later in the file. Every card on every phone was the default
blue for four days, and nothing failed: the markup had the right classes and
the sweep found no contrast or overflow problem. A default that a modifier is
meant to override goes in `:where(.base) { … }` (no weight at all) or before
the modifiers; and a check of a coloured component reads the computed value,
not the class list.

**The Edit tool decodes `\u` escapes.** Writing `/[\u0000-\u001f]/` into a file
through it put real control characters in `RoomGames.js`, and git took the
file for binary. Write such a regex through a script, or check the file with
`git ls-files --eol` (it says `-text`) after the edit.

**One scope means one name, and the later file wins silently.** Every
`JS_*.html` is concatenated into one page, so two top-level `function`s with
the same name are not two functions: the file included later replaces the
earlier one, with no error anywhere. `JS_TriviaBoard.html` comes after
`JS_RoomTrivia.html` in `Controller.html`, so its `paintTriviaTimer(seconds)`
replaced the room's `paintTriviaTimer(endsAt)`, and the room trivia clock -
the badge on every phone and the big number on the TV - sat at the question's
full length and never counted down, on the live site, for as long as both
existed. The room's is `paintRoomTriviaTimer` now, game-qualified like
`paintStopRoomTimer` and `paintSpyfallRoomTimer` beside it. **Name anything
per-game after its game**. `npm run check` fails on a name declared twice in
the page or in the server's bundle (`check:names`, 5 Oct 2026). A name on both
sides - `startCodenamesClock` on the phone and on the server - is two scopes
and fine; a value both sides need is written once, in `app/Common.js` or
`rooms/RoomShared.js` (*Architecture*).

**A webfont swapping in moves everything measured against the fallback, and
it fires no event anyone listens to.** The segmented control's thumb and the
nav pill are placed by measuring the active item (`syncSegmented`,
`syncNavPill`), re-run by a `MutationObserver` on class changes and on
`resize`. A font arriving changes every label's width and is neither of
those, so on a cold cache a thumb sat where the fallback put it until
something else happened to redraw. `document.fonts.ready` now runs the same
coalesced pass (JS_Core.html). Anything else that measures text and caches
the number needs to be on that pass too.

**A component checked on a phone can still break on every wider layout,
through a rule on its parent.** The returning hero dropped its head on a
phone and was right there; the wide block had long made `.home-hero` a grid
of two columns expecting that head, and on a laptop the four tiles took the
first column and left most of the bar empty. Nothing overflowed, nothing
failed contrast, no tap was small - the regression sweep passed at every
size. What finds it is a **space check**: for every flex or grid container
wider than 560px whose visible children sit on one line, how much of the
width the children span (`fill`) and the biggest gap between two
neighbours (`hole`), and - the case that caught this one - a grid with more
column tracks than children, where the hole has no child in it to measure.
Run it over every view at 375x812, 667x375, 768x1024, 1024x768, 1280x720
and 1920x1080 and read the list: a toolbar with a clock at each end is a
hole by design, a row of three tiles in a column meant for four is not.

**A contrast sweep that cannot see gradients will drown you in false
failures.** The first run of the 20 Sep sweep reported 113 failures across
266 view/theme combinations; all but a handful were text on a `background-image`
- the violet hero, every `.btn--primary`, a segmented thumb drawn as a
`::before`, the chooser's translucent plates on its dark stage. Computed
style cannot composite those, so the walker must return *unknown* and count
it, never guess the page ground. With that fixed the same run reported 3,
and the way to tell a regression from an old friend is to run the sweep
twice - once with the new tokens and once with the old ones injected on
`body` - and diff the two sets of keys.

**A search with a time budget needs a ceiling as well as a clock.**
`rooms-worker/test/rules.mjs` replaces `Date.now` with a clock that only moves
when a test moves it, so the trivia and bomb deadlines can be stepped through.
The duels' hard players stop at a deadline read from `Date.now()`, so under
that clock their iterative deepening never stopped and `npm run test:rules`
hung. Their tests put the real clock back first, and both searches now also
stop at a node count (`C4_MAX_NODES`, `DOTS_MAX_NODES`), so a clock that
stands still - a test, a throttled tab - can't hold them for ever.

**A headless Chrome screenshot at a phone's width is laid out wider.** New
headless Chrome keeps a minimum window width of about 500px, so
`--window-size=375,812` screenshots a 375px slice of a page laid out at 500:
the pills and the board ran off the right edge in a picture of a page that was
fine. Emulate the viewport over the DevTools protocol instead
(`Emulation.setDeviceMetricsOverride`, `mobile: true` below 768) - and
`Emulation.setEmulatedMedia` for `prefers-reduced-motion`, since a headless
Chrome on this PC reports `reduce` and every animation is skipped.

**A parse check is per file, and it has to run after every edit.** A stray
newline inside a string literal in `JS_Solo.html` made the whole file fail to
parse in the browser - so nothing in it was defined, which took out
`soloRegister` and with it every solo game, the daily hub and the result
sheet. Nothing failed at the command line; the only sign was the browser
console. After touching any file:

```bash
node -e "const fs=require('fs'),vm=require('vm');const s=fs.readFileSync(process.argv[1],'utf8');
[...s.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].forEach((m,i)=>{try{new vm.Script(m[1])}
catch(e){console.log('FAIL',process.argv[1],e.message)}});" FILE.html
```

`Controller.html` always fails it - its Apps Script `<?!= … ?>` syntax is not
JavaScript - and that is not a regression.

**A class list write is a mutation even when it changes nothing.** The
segmented thumbs and the nav pill are re-measured by a `MutationObserver` on
class changes, and `syncNavPill` added `has-pill` on every pass - so the
observer fired again, every frame, forever, on an idle screen (59 passes a
second measuring 66 controls). Anything called from that observer only writes
a class or a custom property when the value differs.

**A face-down card must not take its size from its back.** `.hold-card` stacked
both faces in one grid cell, so the card's height was the taller face - and a
spy's one line made a shorter card than a citizen's word and category. The
table could spot the spy before anyone held the card. The back is laid over
the card now (`position: absolute`), and the card has one height for every
role (16rem, 14.5rem on a phone on its side, where the name and the button
sit beside it). Check a new role card's longest content fits.

**A dealt list that runs out must mark the whole deal.** `freshPick` used to
mark only the refill as seen when a list started over, so the last cards of
the old cycle could come straight back (على راسك deals 80 a turn and ran out
every few turns). Everything dealt opens the new cycle, and the refill comes
from what was dealt longest ago.

**Setting `lang` or `dir` on `<html>` restyles the whole page, even to the
value it already has.** `applyTranslations` runs on every `setView` and did
exactly that, which on the home was half of what a back tap cost (and every
`[data-i18n]` element was rewritten too). Both now write only on a change;
`syncChrome` compares the title with `textContent`, because reading
`innerText` forces a layout in the middle of a screen change. Anything that
runs on every `setView` has to be a no-op when nothing changed.

**Auto side margins shrink an item in a flex column.** `.sdk-pad` centred
itself with `margin: … auto`, which is fine in a block, but once the solo
layout made its side column `display: contents` the pad became an item of the
`.solo-layout` flex column, where auto margins stop an item stretching - and
the nine number keys were 13px wide on every phone for a day. An element that
is centred with auto margins inside `.solo-layout` needs `width: 100%` next to
its `max-width`. The audit checks for any board or control narrower than 70%
of its layout.

**Moving a list means finding every reader.** The ربع قرد rebuild moved the
country names into `MonkeyWords.js` and removed `COUNTRIES_DB`, but the
default category of the one-phone الجاسوس («دول العالم») still read it, so
Start threw and did nothing for a day. It deals from
`MONKEY_LISTS[contentLang()].countries` now. Before deleting a constant,
search every `JS_*.html` for it, not just the game it came from.

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
only what `rooms-worker/build.mjs` bundles (its `FILES`: the word lists and
`RoomGames.js`). A constant both sides need is declared in
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
input runs right to left while `left: 40%` still measures from the left, so a
slider, its needle and its end labels disagree in Arabic: wrap such a line in
`dir="ltr"`. The same goes for anything that maps a value to a
position on screen - and for the seats round a table: الدومينو's seat row is
the one before you on the left and the one after you on the right, and a grid
in an Arabic page put them the other way round until the row was given
`dir="ltr"` (each seat keeps the page's direction for its own name). Its
table, the buttons for its left and right ends, and the TV's strip of seats
are left to right for the same reason.

**A button stands in for something said out loud, so it has to be
take-back-able.** The phone cannot hear the table: someone presses "pass" in
القنبلة without saying a word, or "I know who I am" in من أنا؟ by mistake, and
the round is scored on it. Three shapes of answer are in the code, and a new
game should pick one rather than trusting the press: the host judges
(الجرس, خمس ثواني, دوري المعرفة), the table overrules (ربع قرد's `flip`,
أتوبيس كومبليت's `adjust`, القنبلة's `markLoser`), or the press itself can be
taken back. The last one is the newest: `sendBack` in `bombRoomAction` hands a
pass straight back to whoever made it (the holder for `BOMB_SEND_BACK_MS`, the
host at any time) and undoes the pass count - the holder's button goes away
when its time is up, counted from when that phone saw the pass
(`BOMB_SEND_BACK_SHOW_MS`, a second shorter, since a phone's clock can't be
compared with the server's), `notYet` in the من أنا؟ branch
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
While that sheet or Help is open over a round on one phone, the round's
clocks stand still (`pauseClocksForSheet`, resumed by `closeModal` /
`closeAllModals`): reading the rules no longer costs the turn. Rooms keep
running (their clocks are the server's) and so does the bomb (its fuse is a
secret). A TV hosting a room has no back arrow, so its bar carries a 🏠 for
the host that ends the round for everyone after a confirm.

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
rounds, or scored a round twice.

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
