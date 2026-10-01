# ارسم اللي بتسمعه (id `hear`) - Draw What You Hear

A room game of 1 Oct 2026. Game id `hear` everywhere (`room-hear`,
`ROOM_GAMES.hear`, `TV_GAMES.hear`, the catalog, the help); the rules are
named `hear` / `HEAR_`, the page's code `hr` / `HR_`, the stylesheet section
61 (`.hr-*`).

## The owner's spec (1 Oct 2026, decided)

- **Its own card** (not inside ارسم وخمّن's): one player describes, in turn,
  everyone else draws.
- **The describer's phone shows a picture the app made**, seeded, on the
  server, the describer's secret until the reveal: either shapes placed on a
  grid (circles, squares, triangles, lines, at sizes and positions) or a
  simple drawing built from shapes (a house, a car, a face, a tree, a boat, a
  fish...) - a generator of variants, not a fixed handful.
- **Talk only**: the drawers can't ask questions; the describer can't point
  or see the drawings during the round (their phone shows only the picture,
  the clock and «خلّصت»).
- **The drawers draw on their phone** (pen, eraser, undo, clear, a light grid
  - the existing drawing toolbox). The drawings are secret from the others
  until the reveal.
- **Scoring**: the app scores each drawing's closeness to the original
  automatically (a rough but right drawing scores well, a blank or a scribble
  low), 3 / 2 / 1 to the closest three with the % shown; then the table votes
  «أغرب رسمة» (not your own) for +1. The describer gets points by how close
  the drawers got on average (the sheet's proposal, taken: a point for every
  20% of the average, at most 3).
- **Ranking at the end** with `renderPodium`; the night's points (5/3/2/1)
  through the room's board.
- **The look: أ «كراسة الرسم»** (the design sheet
  https://claude.ai/artifact/TBBRDDCoxj5kJvooVtcC6W): the phone a squared
  exercise book with a red margin and the page taped on, the tools in a
  pencil case along the bottom, the clock a pencil getting shorter; the
  describer sees a chalk drawing on a green board; on the TV the board in
  the middle and the exercise books round it, marked in red pen with the %
  and stars for the first three.

## Decided while building (open to change, each in one place)

- **The pictures** (`Hear.js`): a 0..100 square; **shapes** are 3 (easy), 4
  (medium) or 5-7 (hard) on a 3 x 3 board, each in its own third, a kind used
  once before any comes again; easy only circles, squares and triangles, all
  big; medium adds wide and tall rectangles and lines; hard adds an upside-down
  triangle, a diamond, upright and slanted lines, more jitter, and now and then
  a small shape inside a big one. **Drawings** are 20 things (بيت، عربية، وش،
  شجرة، مركب، سمكة، رجل التلج، صاروخ، وردة، روبوت، طيارة ورق، آيس كريم، ساعة
  حيطة، شمس، قطر، أباجورة، كوباية شاي، عيش الغراب، بلالين، إشارة مرور), each a
  generator: its sizes and parts drawn from the seed, the core parts always,
  the extras by the level (easy none, medium half, hard all), then scaled to
  82-100% of the page and placed off the middle. A thing is dealt through the
  shared prompt memory (`nextPrompts`, key `hear_things`), so no thing comes
  back until all 20 have.
- **The mix** (the host's lobby choice, «الصور»): مخلوط (default: drawings on
  odd rounds, shapes on even), أشكال or رسومات. **The level** (الصعوبة):
  سهل / متوسط (default) / صعب.
- **The drawing's clock**: 60, 90 (default) or 120 s, the host's choice; it
  starts when the describer taps «🎙️ يلا، ابدأ الوصف». Before that the
  describer may ask for **another picture twice** (`HEAR_SWAPS`). **«✋
  خلّصت»** ends the describing: the drawers get **10 more seconds**
  (`HEAR_CUT_MS`), not an instant end - they are still drawing the last
  thing said. Everyone handed in («📒 سلّمت الكراسة») grades at once; time's
  up gives the phones 2.5 s to send (`HEAR_COLLECT_MS`). A page handed in
  can't change.
- **Rounds**: everyone describes once, or twice (the host's «كل واحد يوصف»:
  مرة / مرتين), in a shuffled order. **3-12 players.**
- **The judge** (`hearScore`): both the picture and the drawing on a 64 x 64
  grid (the picture's lines about 1.7 cells wide, the strokes their own width,
  the eraser rubbing out). For every ink cell of each, the nearest ink cell of
  the other (a chamfer distance transform that carries which cell): it counts
  fully within 1.2 cells and fades to nothing at 4.5 (about 7% of the page),
  and is weighed by how alike the two lines' **directions** are there (a
  structure tensor over 5 x 5; along the line full marks, across it 60% less,
  `HEAR_ORIENT_W`). Precision (the drawing's ink near the picture) and recall
  (the picture's ink the drawing reached) meet in an F-measure with recall
  weighed 1.5 times (`HEAR_BETA`: a part left out costs more than a shaky
  line); ink past twice the picture's scales it down (`HEAR_INK_SLACK`), and
  so does ink in the wrong parts of the page (the share of each one's ink in
  4 x 4 parts and how much they overlap, weighed 0.5, `HEAR_LAYOUT_W`).
  Measured over 150 pictures of every kind and level while tuning (60 of
  them re-measured in rules.mjs on every run): a trace 95-100%, a rough copy (shaken, shifted 4%, 92% the size)
  median 73%, a sloppy one (shifted 8%, 80% the size) about 40%, half the
  parts 55-70%, another picture 14-28%, five lines thrown across the page
  16%, a zigzag 21%, scribbling the page over 9%, a big X 14%, blank 0.
- **The points**: the closest three 3 / 2 / 1 by the %, the same % sharing a
  place and its points, a blank page (0%) never placed; the describer
  `floor(average / 20)`, at most 3 (nothing if they left); «أغرب رسمة» +1 to
  the most votes when that is at least 2 (`HEAR_WEIRD_MIN_VOTES`), a tie at
  the top all +1; one vote each is no weirdest. Everyone who played votes,
  the describer too, never for their own; fewer than two drawings: no vote.
- **The clocks of the reveal**: the grading stays up 6 s + 0.6 s a drawing
  (at most 13 s), then the vote opens by itself (the host or a stand-in may
  open it sooner, «🤪 يلا على أغرب رسمة»); the vote closes when all voted, the
  host closes it, or after 45 s; the result waits for the host's «الدور اللي
  بعده».
- **Leaving**: a describer gone before «يلا» passes the round on; gone while
  drawing, the pages go to the grading as they are (and the describer scores
  nothing); a drawer gone takes their page; a voter's ballot goes with them;
  fewer than three to start a round ends the game. A latecomer watches
  (`lateJoin`) and plays the next game.
- **The drawer's page is sent while the pencil rests** (`ink`, 0.9 s after
  the last change, the whole page each time, never sent back to the phone) and
  kept in the phone's `localStorage` (`ashryHearInk`, keyed on the deal and
  the round), so a reload or a rebuilt frame comes back with the drawing and
  the server already has it if the phone dies. One pencil colour (`#1f2a44`),
  width 5 (of 255), the eraser three times that. On the server `ink` is a
  quick action (`QUICK_ACTIONS` in `room.js`: saved at most once a second) and a
  silent one (`SILENT_ACTIONS`: it changes only `room._hear.ink`, so only the
  drawer's phone gets an answer - no broadcast to the table; the review of 1 Oct
  2026, when every page was a full write and a push to every phone).

## How it is built

- **`Hear.js`** (shared, no DOM; inlined into the page through
  `SHARED_LISTS` and the game's chunk, bundled into the Worker): the numbers
  (`HEAR_*`), the seeded random (`hearRng`), the things (`HEAR_THINGS`,
  `HEAR_THING_NAMES`), the shapes board (`hearShapes`), `hearPicture(seed,
  kind, level, thing)`, `hearPictureName`, `hearOutlines`, `hearSvg` (the
  page's drawing of a picture), and the judge: `hearRasterPicture`,
  `hearRasterStrokes`, `hearDistance`, `hearOrient`, `hearLayout`,
  `hearScore`, `hearDescPoints`.
- **`RoomHear.js`** (bundled after `RoomBox.js`): `hearAction` (start / play
  again with `{ seconds, kind, level, laps }`; `swap`, `go`, `done` from the
  describer; `ink`, `hand` from a drawer; the move-on actions `skipTurn`,
  `closeDraw`, `toVote`, `closeVote`, `nextRound`; `vote`), every move but the
  start carrying `{ round }` (`staleTap`). Hidden: `room._hear = { pic, ink }`,
  the describer's slice `{ pic }`; both gone at the grading, when `shared.pic`
  and `shared.drawings` (`[{ id, strokes, pct, place, pts }]`) are published.
  `shared`: `roster`, `order`, `turn`, `round`, `rounds`, `laps`, `seconds`,
  `kind`, `level`, `describerId`, `drawers`, `phase` ('ready' → 'draw' →
  'collect' → 'grade' → 'vote' → 'result' → … 'gameover'), `swaps`, `endsAt`,
  `cut`, `handed`, `collectEndsAt`, `gradeEndsAt`, `voteEndsAt`, `avg`,
  `descPts`, `vote` (the engine's), `weird`, `weirdVotes`, `gained`,
  `scores`, `board`, `history`. `hearDeadline` / `hearTimeout`,
  `hearPlayerLeft`. In `PROGRAM_RESULT_LONG` (12 s) and الشلة's «كلمات»
  title games.
- **`JS_RoomHear.html`**: the phone (`hrPhoneBody`: the board in chalk with
  the sticky note and «صورة تانية» / «يلا» / «خلّصت» for the describer; the
  taped page on Draw & Guess's surface in local mode - `draw.local`,
  `bindDrawSurface`, `paintStrokesFromScratch` - with the pencil case
  (`hrCaseHtml`: pen, eraser, undo, clear) and «سلّمت الكراسة» for a drawer,
  `hrBindPad` keeping the strokes across a rebuild and a reload; the pencil
  clock `hrPencilHtml`, painted from the server's time; the grading - my page
  with the model laid over it in faint green, the red circle counting up
  (`stageReveal`), stars and +points, everyone's exercise books
  (`hrNotebookHtml`), the describer's line; the vote on the books
  (`hrVote`, your own greyed «رسمتك»); the result with `renderVoteResults`,
  the round's points and the board; `renderPodium` at the end). Pages are
  painted from strokes on transparent canvases (`hrPaintInk`, the eraser as
  `destination-out`), so the squared paper shows. The TV (`TV_GAMES.hear`):
  the classroom - the board in the middle (the describer's turn, «؟» and the
  pencil clock, the model in chalk, the vote's chips, «كشف الدرجات»), the
  exercise books in seats round it (`hrTvSeats`: one column a side up to four
  drawers, two from five; each seat a size container), covers, then a pencil
  scribbling while they draw (nothing of the drawing shown), then the marked
  pages; the sticky note under the board. Sounds on the room's one voice
  (`hrVoice`): the pencil at «يلا», the school bell, the red pen's ticks, the
  last five seconds, the end.
- `roomTurnOf`: the describer in 'ready' (`turn_hear`), a drawer who hasn't
  handed in (`turn_draw`), and the vote. The catalog: the «كلمات ورسم وتمثيل»
  section, green, `players: [3, 12]`, 20 minutes, `faceToFace`, a drawn icon
  (`art:hear`: the taped exercise book with a chalked house, a pencil, the
  headphones).
- **Tests**: `rules.mjs` («Draw what you hear»: the pictures inside the page,
  the same from a seed, the levels' sizes, every thing at every level with
  both names, variants; the judge's cases above; a round start to end - the
  secret, the swaps, the stale and the wrong-player taps, ink to the server
  only, the describer drawing nothing, «خلّصت», a page handed in fixed,
  collect, the grading and its points, the vote and its ties, the host away,
  the clock alone; the defaults, the mix, the skip, the end and the night's
  board, play again; leaving at every phase; a latecomer), `leaks.mjs`
  (`PROBES.hear`: the picture on the describer's phone only, what it is too,
  no drawing on any phone before the grading - proved by leaking each),
  `play-all.mjs` (`--only=hear`: four phones and a TV through a round by
  hand and one on the server's clock, a leaver), `validate-content.js` (360
  pictures: inside the page, names, a trace scoring 90%+).

## History

The day-by-day log of the work on this game is in `notes/log.md` (search it for the game's name); a new entry goes there, and anything that changes how the game works goes in this file.
