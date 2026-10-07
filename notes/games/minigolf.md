# ميني جولف (id `minigolf`)

Moved from GEMINI.md on 30 Sep 2026. GEMINI.md keeps the rules that apply to every game and an index; this file keeps the detail, word for word.

## From GEMINI.md: The owner's specs, as built

- **ميني جولف (Mini Golf)** - the owner's rules of 23 Sep 2026, asked one at
  a time; look أ «نجيلة» picked from the lead's 3D preview (striped mown grass,
  wooden rails, a stone border, blue water with a stone bank, sand, a white
  windmill with red trim whose sails turn and block its tunnel, a cup with a
  waving flag, trees, bushes and flowers on the rough, soft shadows, the camera
  above at an angle) (*ميني جولف*):
  - **Solo** (the best total for each course length kept on the phone) and
    **a room with the TV**. No one-phone pass-around, **no computer players**.
  - In a room, **a lobby choice: all at once (the default) or in turns.** All
    at once: every ball on the same hole, each player putting from their own
    phone whenever ready; **the balls pass through each other** (the others'
    balls are faint on a phone); a hole moves on once every ball is in or
    picked up. In turns: one putt at a time round the table, everyone watching.
  - **3, 6, 9 or 18 holes, 6 by default** (the host's choice; solo a setup
    choice). About a minute a hole. (18 added by the owner later the same
    day; the first build had nine. Until the third round below, a game played
    the first holes of the course in order.)
  - **Par + 3 strokes at most** (the owner, later on 23 Sep 2026, replacing
    "6 strokes, then 7"): par 2 allows 5, par 3 six, par 4 seven, par 5
    eight; not in by then, the ball is picked up and the hole counts that most
    + 1. The strip shows «المطلوب 3 · أقصى 6» (the third round's word, below)
    and, before the final stroke, «آخر ضربة!». One place: `golfMaxOf` (a hole
    may carry its own `max`).
  - **Ball hits ball in the room's "in turns" only** (the owner, the same
    day). All at once the balls still pass through each other; solo has one
    ball. In turns a putt meets every ball lying on the course - **a ball is on
    the course once it has been hit from the tee** (Plato's way: the others
    wait off it) and until it drops. Equal balls, a slightly soft knock; a
    knocked ball rolls on with the ground and every piece, **the server
    deciding every ball** and each phone and the TV replaying the same roll.
    **A ball knocked into the cup is holed with its strokes so far** (no stroke
    added).
  - **Water, Plato's rule** (the owner, the same day): the ball goes back to
    where it lay (where it was hit from), a stroke added; **if another ball
    lies on that spot now, back to the tee**. **A ball knocked into the water
    by someone else goes back to its own spot with no stroke added** (the tee
    if that spot is taken).
  - On the holes: **walls, slopes (hills), water, sand (slows), and moving
    pieces** (the windmill, a sliding gate, a turning beam) on a clock every
    phone shares - and **eight new ones** (the owner, the same day, all
    eight asked for): **ice** (the ball barely slows), **mud** (slower than
    sand), **speed pads** (arrows that push), **conveyors** (carry the ball),
    **portals** (in one ring, out of the other at the same speed, a set way),
    **bumpers** (send it back harder than it came), **ramps** (fast enough and
    the ball flies over the water or a low wall; too slow and it rolls back)
    and **one-way gates** (through one way, a rail the other).
  - **Every hole unique** (the owner, the same day: "not all in one - each map
    unique, with some of what fits in it"): each of the nine new holes has its
    own place and only the one to three new pieces that fit it; the nine first
    holes were given better shapes (rounded ends, a chamfered top) and richer
    scenery, and a new piece only where it clearly fits (mud by the
    waterwheel's channel and by the oasis pond); the eighteen are ordered so
    the course gets harder, and the first 3, 6 and 9 make good short games.
  - **Top view at an angle; pull back from the ball like a slingshot and let
    go.** A short arrow while pulling shows the direction and the power - it is
    the control, always there. **The full aim guide (the predicted path) is a
    switch, «مساعدة التصويب», off by default** - the host's lobby option in a
    room, a setup option solo; remembered.
  - **A putt clock, off by default, 20 or 40 seconds**: when it runs out the
    phone putts gently toward the hole for the player. The host has a "putt for"
    button for a quiet phone.
  - On the home in the new **«رياضة / Sports»** section; icon ⛳.
  - Decided here (open to change, each one place in the code): the course's
    eighteen holes, their order and their pars - first 2, bridge 3, mill 3,
    souq 3, humps 3, fair 3, pyramid 3, nile 3, saqia 3, siwa 3, lighthouse 3,
    citadel 3, gate 3, port 3, temple 3, sinai 3, oasis 4, tower 4 (8 for
    three holes, 17 for six, 26 for nine, 55 for eighteen); which pieces go on
    which new hole (Siwa: dunes and mud; the souq: pads; the Nile: a ramp and a
    muddy bank; the funfair: bumpers; the Citadel: one-way gates, one of them
    the wrong door; the port: two conveyors, one running back; the temple: a
    portal between two shrines; Saint Catherine: ice with a zigzag of walls;
    Cairo Tower: a pad up the promenade and a portal as the tower's lift);
    a ramp and a portal are shortcuts - every hole can also be walked; a ball
    "lies on" a spot when it is within a ball's width of it; balls lying on
    each other when a putt starts pass through each other until they part; in turns **the best score on the last hole tees
    off first** (golf's honour; ties keep their order); the card between two
    holes shows for **7 seconds** after the last ball stops, then the next hole
    comes by itself (the host can skip ahead); a player who leaves takes their
    ball and their card with them; the last player alone plays on; the winner
    of a room game (lowest total) counts a win for the evening only when there
    was somebody to beat; a latecomer watches the hole and plays the next game.
  - **The third round** (the owner, later on 23 Sep 2026, every point asked
    first):
    - **The word «بار» goes**: the owner didn't know it. The strip says
      **«المطلوب 3 · أقصى 6»** ("Target 3 · max 6"), and every other place
      uses the same plain words: the scorecard's row «المطلوب», «+1 عن
      المطلوب», a result «زي المطلوب!» ("On target!"). The fun names of a
      score stay (هول إن وان، بيردي، إيجل، ألباتروس، بوجي، دبل بوجي) and are
      explained once in 📘 («🏅 أسامي النتايج»).
    - **Sixty holes: twenty easy, twenty medium, twenty hard.** The first
      eighteen sorted in by how they really play, and 42 new ones, each its
      own place, its own shape (a frying pan, a jigsaw piece, an egg, a
      rocket, a spiral, a pinball table, an island, a stadium, a figure of
      eight, a winding alley…) and only the 0-3 pieces that fit it. Easy:
      short, wide, forgiving, asks for 2 or 3. Medium: asks for 3, one or two
      pieces used cleverly. Hard: asks for 3 to 5, combinations, narrow
      lines, moving pieces to time.
    - **A difficulty choice, and random holes**: solo setup and the room's
      lobby choose **سهل / متوسط / صعب / مكس**; a game of 3, 6, 9 or 18
      draws its holes at random from that kind; **mixed** takes a third of
      each and **plays them easiest first**. **Holes played lately don't come
      back until the kind has gone round**: solo through `freshPick` (per
      phone), rooms through `nextPrompts` (the server's memory across rooms),
      so every phone in a room plays the same list (`shared.holes`, the ids
      in order). The order is never a fixed one.
    - Everything else as it was: the pieces' physics, knocks in turns, the
      water rule, at most what the hole asks for + 3, the putt clock, the
      guide, the TV, solo bests.
    - Decided here (open to change, each one place in the code): **mixed is
      the default** (solo and lobby); **the best total is kept per length and
      kind** (`'mix:6'`, `'hard:9'`…; the bests kept before, per length only
      over the fixed first holes, are no longer shown - they were a different
      course); **Cairo Tower moved to easy and now asks for 3** (its lift makes
      it the easiest of the old eighteen), **the bridge to medium**; which
      old hole is which kind: easy first, souq, humps, pyramid, siwa,
      lighthouse, tower; medium bridge, fair, nile, saqia, citadel, port,
      temple; hard mill, gate, sinai, oasis. The kinds were judged by the
      test's search and by a simulated player of middling skill (a spread on
      aim, strength and timing; about 2.9 strokes a hole on easy, 3.5 on
      medium, 4.8 on hard). A room saved before the holes were drawn plays the
      first holes (`mgCourse`); a solo game saved before gets them too.

### ميني جولف

The owner's rules are in *The owner's specs*.

- **The course** (the third round, 23 Sep 2026): `GOLF_HOLES` is sixty holes,
  each with `lvl` 1 easy, 2 medium, 3 hard (twenty each, the array in that
  order). `golfHoleById`, `golfLevelIds(lvl)`, `golfCourseSplit(count,
  level)` (one kind, or `'mix'`: a third of each, a hole left over going to
  the easier kinds) and `golfDealCourse(count, level, pick)`: the ids of a
  game in the order played, `pick(ids, n, lvl)` choosing within a kind - the
  page's `freshPick('golf_' + lvl, …)`, the server's `nextPrompts(room, ids,
  'golf_' + lvl, n)` (from `start` and `playAgain`, both `DEAL_ACTIONS`), a
  shuffle when none is given. `golfParOf(list)` adds up what a list asks for.
  `GOLF_LEVELS` is `easy`, `medium`, `hard`, `mix`. A room keeps the ids as
  `shared.holes` and `settings.level`; `s.hole` is an index into that list
  (`mgCourse`, `mgHole`). The new holes were drawn with a small geometry kit
  (arcs, rounded boxes, corridors round a centre line, blobs) and written out
  as plain numbers, as the old ones were; their comments say what each is.
- **`MiniGolf.js`** (shared, no DOM). A hole is x to the right and y away from
  the tee in course units (about 10 cm each): `green` (one polygon; its edges
  are rails), `walls` (more rails), `blocks` (solid polygons with a `look`:
  rock, mill, pyramid, tower, jar), `sand`, `water`, `hills` (a smooth hump -
  or a dip with `push < 0` - running along x or y, profile `16u²(1-u)²`, whose
  pull is its slope), `bowls` (a round dip pulling to its middle), and the
  moving pieces: `mills` (a tunnel's door shut while a sail hangs in front,
  `golfMillShut` - no trig), `sliders` (a gate eased to and fro,
  `golfSliderAt`) and `spinners` (a bar turning round a post; its ends from
  `golfSinCos`, a polynomial, because `Math.sin` may differ in the last bit
  between engines). A moving piece hits the ball with its own speed at the
  point of contact (`golfSegHit`'s `wvx, wvy`), so a beam or a gate knocks it.
  A putt is `{ dx, dy, power, t0 }`, whole numbers (`golfCleanShot`); `t0` is
  the hole's clock in ms at the putt, which is all the moving pieces read.
  `golfStart` / `golfStep` roll it at 240 steps a second; `golfPutt` rolls it
  to the end: `rest`, `cup` (slow enough over the cup - firmer over its
  middle than across its rim - or it lips out) or `water` (back to where it was
  hit from, 2 strokes). A ball can't come to rest where a moving piece will
  reach it (`golfInSweep`), so it is never left inside a door or a beam's
  circle. `golfField` is a grid of every place a ball can lie and how far each
  is from the cup round rails, blocks and water (Dijkstra, cached per hole);
  `golfAutoShot` aims straight at the cup when nothing is in the way, else at
  the square in sight that is farthest along, with only the strength to get
  there - the clock's gentle putt and the host's "putt for". `golfHeight` is
  the ground's height for the screen only.
- **The pieces added on 23 Sep 2026** (all in `golfMove`, one ball's step,
  kept bit for bit the old step for the old pieces): `ice` / `mud` polygons
  change the drag (`GOLF.ICE` 0.55, `GOLF.MUD` 24 against the green's 3 and
  sand's 13; `golfDragAt`); `pads` (`{ x, y, dx, dy, w, l, push? }`, a
  rectangle along its arrow) add `GOLF.PAD` along it; `belts` (an
  axis-aligned rectangle and `{ vx, vy }`) bring the ball to their speed
  (`GOLF.BELT_GRIP`) instead of the drag, and a ball can't rest on one;
  `portals` (`{ x, y, ox, oy, dx, dy }`) take a ball within three quarters of
  `GOLF.PORTAL_R` and put it out at `ox, oy` with its speed along `dx, dy`
  (`warp` on the ball for the screen); `bumpers` (`{ x, y, r }`) send the
  ball out at `GOLF.BUMPER` times its speed, between `BUMPER_MIN` and
  `BUMPER_MAX` (`bumped[k]` on the sim); `ramps` (`{ x, y, dx, dy, len, w }`,
  the foot and the way up) pull `GOLF.RAMP_G` back down, and a ball over the
  lip still going up flies (`air`, `z`, `vz`, `AIR_G`): in the air it meets
  only the fence and the blocks (`golfTallSegs`), lands at `GOLF.LAND` of its
  speed, and only then the water or the cup counts; `gates` (`{ x1, y1, x2,
  y2, dx, dy }`) are a rail only to a ball on their far side coming back
  (`golfGateHit`, `flaps[k]` when one swings). Rails beside a ramp are plain
  `walls`; the screen raises them with the ramp.
- **Other balls** (in turns): `golfStart(hole, from, shot, others)` makes a
  body of each (`golfBody`; the sim itself is the putter's body, so a sim
  with no others is exactly the old one), `golfStep` moves every body that
  isn't at rest and then `golfBallsMeet`: equal balls, the knock along the
  line between them with `GOLF.BALL_BOUNCE`; a ball at rest that is touched
  rolls again (`moved`); balls lying on each other at the start pass through
  until they part (`ghost`). `sim.done` is every ball stopped, sunk or wet.
  `golfPutt(..., others)` adds `moved: [{ id, end, at, wet }]`; a wet ball's
  spot is `golfWetSpot` - where it lay, or the tee when another ball's final
  place is within a ball's width. The order of the list (the room's order) is
  part of the result, so every phone lists them the same way.
- **The field and the gentle putt** know the new pieces: `golfGateBlocks`
  refuses a step against a gate or a conveyor (in `golfField`,
  `golfDistance` and `golfClearLine`); ramps, bumpers, the middle of a
  sliding gate and a beam's post are not places to lie (`golfOpen`); a clear
  line keeps 0.45 from the water on either side; `golfSpeedFor` is the speed
  that stops a ball at a point over this ground (drag in, pads out), which the
  gentle putt and the tests' search use. Portals and ramps are shortcuts the
  field never needs: every hole can be walked.
- **`RoomMiniGolf.js`**. Nothing is hidden: everything is `shared` (`phase`
  'play' | 'between' | 'gameover', `settings { mode, holes, guide, clock }`,
  `hole`, `startedAt` - the server's clock when the hole started - `stamp`,
  `order`, `balls { pid: { at, n, done, restAt, clockAt } }`, `shots { pid:
  the last putt }`, `shotSeq`, `turn`, `card`, `board` lowest first, `wins`).
  A putt carries `hole` and `n` (the strokes the phone saw), so a stale tap is
  dropped. **The phone's `t0` is taken when it is within 1.5 s of the server's
  own** (`MG_T0_SLACK`), else the server's; the server runs `golfPutt` and
  writes the result. The clock (`mgDeadline` / `mgTimeout`) is per ball all at
  once (from when it came to rest, or the hole's name card) and for the player
  up in turns; running out, it plays `golfAutoShot`. 'between' moves on at
  `nextAt` (7 s after the last ball stops), or on the host's `nextHole`. A
  ball is picked up at `golfMaxOf(h)` strokes and counts one more. In turns
  `mgOthers` is every other ball with `n > 0` and not done, in `order`; the
  putt keeps them as `shots[pid].others` (where they lay before it) and
  `moved`, and the server moves those balls (one knocked into the cup is done
  with its own `n`). The phone makes the very same list (`mgRoomOthers`).
- **`JS_MiniGolf.html`**:
  - **One 3D engine per page (`MG3`)**: one `WebGLRenderer` (pixel ratio ≤ 2,
    ACES tone mapping, soft shadows, a sky environment from `PMREMGenerator`),
    moved into whichever screen shows the course - solo, a room's phone, the
    TV - and **disposed when the course leaves the screen** (`onLeaveScreen`,
    and the loop lets go of a canvas that has been off the page 1.5 s). It
    draws at the screen's rate while something moves (a roll, a pull, a
    windmill), 30 frames a second when only the flag and the water move, and
    not at all while the page is hidden. **A phone at rest draws 5 frames a
    second** (the owner's battery, 28 Sep 2026; `mg3Resting`,
    `MG_REST_GAP`): the card between holes (and the end), or no touch for
    10 s (`MG_REST_AFTER_MS`) while it isn't this phone's putt - its ball is
    in, it's another player's turn, it only watches. The loop then sleeps on
    a timer (`MG3.sleep`) instead of waking every frame, and `mg3Kick` wakes
    it at once: a touch, key or wheel anywhere on the page (`mg3Poke`, a
    document listener), this phone's turn coming (`MG3.mine` turning true,
    noticed on every room state through `mgRoomCourse`), a roll starting
    (`mg3Play` → `mg3Start`), a pull, a splash, a new hole (`mg3SetHole`).
    A roll is always at the screen's rate; a windmill to time a putt against
    too, while it is this phone's putt. **The TV never rests** (plugged in,
    and the show). `MG3.input.play()` says whether the hole is in play;
    `fpsCap` still caps everything for the tests. Measured on 28 Sep 2026
    (headless Chrome at 144 Hz, render calls a second): the waiting phone in
    a room 28.8 → 4.8 idle (rAF callbacks 144 → 12), the card between holes
    28.8 → 4.8 (a windmill hole 144 → 4.8), a touch or a roll back to 28.5 /
    144 at once, the TV and your own putt unchanged. Textures are drawn on canvases once
    per engine (mown grass, rough, sand, rails, stone, sandstone, planks,
    clay, bark, ripple normals, the ball's dimples). A hole's meshes are built
    by `mg3SetHole` and thrown away with it (`mgKeep`); everything repeated
    (trees, bushes, flowers, fronds, studs) is one `InstancedMesh` each.
  - **The camera** (`mg3Fit`) finds the nearest distance that keeps the whole
    hole in view, both ways round - up the screen away from the tee, or the tee
    on the left - and turns it when that shows it clearly bigger: an upright
    phone gets the hole upright, a phone on its side, a laptop and the TV get it
    across. The HUD's margins are `MG3.pad`.
  - **The pull**: `pointerdown` anywhere on the course starts it, the arrow
    grows from the ball in the direction of the putt (green to red with the
    power), a dashed rubber band runs back to the finger, and with the guide on
    the path is dotted (`golfStep` from where the ball lies, at the hole's
    clock). Seven course units of pull is full power. Letting go sends it.
  - **A roll on the screen is `golfStep`**, the server's own steps, played in
    real time (`mg3Play`). A putt from another phone starts already
    `off` seconds in - the hole's clock now minus its `t0` - so every ball
    moves in the one timeline the windmill turns in; one that is over by the
    time it arrives (a reload, a phone that slept) is simply put where it lies.
    Your own putt rolls as your finger lifts, and the server's copy of it,
    when it comes, is recognised and not rolled twice (`mgRoom.pending`).
  - **The hole's clock on a phone** is the server's: `mgRoom.offset` is the
    smallest gap seen between `shared.stamp` (the server's time of the last
    change) and its arrival, so the phone's clock is at most one network
    delay behind the server's - well inside the 1.5 s the server allows.
  - Motion: a new hole's card flies in and up to the strip (`mgNameCard`,
    once per hole), a putt's tock, a rail's knock, sand puffs, a splash (rings
    and droplets) and the ball back on its spot, the ball sinking with the
    flag jumping and a ring, the word for the hole (هول إن وان!، بيردي!…) as a
    banner, the card's totals counting up (`mgCountTotals`, `countUp`), the
    podium at the end (lowest first: `renderPodium` given a mirrored board, as
    سكرو does) with confetti. Sounds are made with `fxTone` / `fxNoise`; with a
    TV in the room only the TV plays other people's balls.
  - Layout: the course takes the whole view at every size (`view--fill`), the
    strip of chips over it at the top, the players' chips and the line at the
    foot, the card between holes and the end as a card over it. The TV is the
    course with the players and the scorecard in a column beside it.
  - Solo lives in `appState.minigolf` and is restored through `soloRegister`;
    a putt's result is kept the moment it is hit, so a reload mid-roll comes
    back to where the ball ends. The game's holes are `s.game.course` (ids,
    drawn at start), its kind `s.game.level`. The best total per length and
    kind is `soloRecord('minigolf', 'mix:6' | 'hard:9' | …)` (`mgBestKey`).
  - **The strip and the cards read the game's own list** (`mgCourseOf`,
    `mgRoomHoles`, `mgRoomHole`, `mgSoloCourse`): the hole's name, a chip of
    its kind (سهل / متوسط / صعب), «المطلوب n · أقصى m» (`mgParMax`), and a
    scorecard whose «المطلوب» row is each played hole's own (`mgCardHtml(rows,
    course, …)`).
  - **The new pieces on the screen** (`mgPadMesh`, `mgBeltMesh`,
    `mgRampMesh`, `mgBumperMesh`, `mgPortalMesh`, `mgGateMesh`; ice and mud
    as flat glossy polygons with a rim): a pad's amber arrows and a belt's
    ribs run on their own texture (`mgOwnTex`) and a portal's swirls turn -
    ambient movers, so an idle hole still draws at 30 frames a second (5 at
    rest, above); a
    bumper's cap flashes and the post swells when `bumped[k]` changes, a
    gate's flap swings open the way through and falls back after `flaps[k]`.
    A flying ball is drawn at the rules' height (`z`); `mg3ShowBody` plays
    each ball's moments (sand, mud, ice, a pad, a jump and its landing, a
    portal's two rings, a knock, a bumper, the cup, the water) with sounds
    `knock`, `bump`, `warp`, `whoosh`, `mud`, `jump`, `land`, `flap`, `ice`.
  - **Knocked balls** move with the roll that hits them: `mg3Play` marks each
    ball of `sim.others` `drivenBy` the putter, `mg3SyncBalls` leaves it alone
    until the roll is done (`want` keeps where the table says it lies), and
    where a wet one goes back to comes from the putt's result (`returns`,
    from `moved`, or the phone's own `golfPutt` for its own putt). A newer
    roll that takes a ball another roll is still moving ends that one at once
    (a screen that fell behind). In turns a ball not yet hit from the tee is
    off the course: only the player up waits on the tee.
  - **The sixty holes' places** (the third round): `MG_LOOKS[id].ground` puts
    a course on the sea, the moon (with a night sky), a tiled floor or paving
    instead of the rough (no trees scattered there); `planks` / `kerbs` lay a
    plank walk; `MG_BLOCKS` draws a hole's obstacles as what they are there
    (a flagpole with Egypt's flag, a bench, training cones, toy blocks with
    studs, the giraffes' paddock, a lit Ramadan lantern, a sandcastle,
    painted eggs, a fountain, a dovecote, pylons, metro pillars, suitcases,
    Qaitbay's keep, the Sphinx, a golden sarcophagus, chalk mushrooms,
    corals, Abu Simbel's colossi, rams, a library desk, trays of kahk, a
    wheelhouse, deck chairs); new `MG_DECO` pieces (hot-air balloons that
    bob, buildings, giraffes, acacias, umbrellas, stadium stands, toy piles,
    a metro train, an airliner, planets, hills, crocodiles, bookcases,
    arcade machines, a small mosque, stars). The scattered trees keep 2.6
    units from every rail (`mgScenery`'s `edgeGap`), not just off the
    course's box. A tall piece never stands on a near side: the camera looks
    from the tee's end on an upright phone and from the +x side on a phone on
    its side or a big screen.
  - **Each hole's own place** is `MG_LOOKS` (its scenery from `MG_DECO`:
    palms, a felucca, a fountain, a ferris wheel, minarets, a crane and
    containers, Karnak's columns, pines, snowmen and the monastery, Cairo
    Tower…; `snow` and `desert` turn the rough to snow or sand), and new block
    looks `salt`, `snow`, `stall` and `obelisk`.
  - Past nine holes the scorecard is two tables (`mg-card--two`): the first
    nine with their sum («أول 9»), then the rest with the total.

**The review of 1 Oct 2026: «ضربة هادية».** A phone that can't draw the course (no WebGL, or three.js never arrived) shows a «⛳ ضربة هادية» button when it may putt (`mgRoomPlain`, shown by `mgRoomChrome` while `mgNo3d`, which `mgMountIn` sets through its new `onFail`); it sends `putt { hole, n, auto: true }` and the server plays the clock's gentle putt for that phone's own ball (`golfAutoShot`, `auto` on the shot), in turn as any putt - as bowling's plain throw does.

## The ideas of 7 Oct 2026, second batch (the owner's picks): built

- **(1065) «ماتش بلاي», hole by hole.** A lobby choice «طريقة الحساب: مجموع الضربات / ماتش بلاي» (`settings.scoring` 'stroke' | 'match', default stroke, remembered with the room's options). In match play each hole is a point for the fewest strokes, **half a point each on a tie** (two or more), and counts once every player still in the game has finished it (`golfMatchPoints(card, order, holes)` in `MiniGolf.js`). `mgBoard` makes the score the points, most first (strokes only order a tie; level points share the place on the night), keeps `shared.won` (who took each hole), and the winners are the most points. The page: the card between holes marks who took it (+1 / +½), a line of everyone's points (`mgMatchLineHtml`, also on the TV's side and the end), «نقطك 2½» in the strip, and the end's podium ranks the points (`mgMatchPodiumHtml`, a plain `renderPodium` call - the strokes' mirrored podium, `mgPodiumHtml`, is left as it was). Rooms only (solo has one ball). Help updated.
- **(1070) The pull's power as a number and a ring.** The arrow already went green to red; now a small «%» rides beside the ball in the arrow's colour (`mg3PowerShow`, `.mg-power`, the ball projected to the screen), and a faint ring is drawn round where the finger started, as far as a full pull reaches (`MG3.powerRing`, radius `MG_FULL_PULL`), brighter once reached; both go when the pull ends (`mg3PowerHide`). Solo and rooms. Help's first line says so.

Tests: `rules.mjs` («match play:»), `play-all.mjs` (minigolf: a match-play hole on three phones and the TV).

## The ideas of 7 Oct 2026, third batch (the owner's picks): built

- **1072 The strip on an upright phone.** `mgHudHtml` marks the hole's name, the level
  chip and «المطلوب 3 · أقصى 6» `.mg-hud__wide`, hidden on an upright phone
  (`orientation: portrait` and under 600px, never the TV): the strip there is the hole's
  number and «٢/٦ ضربات» (`mg_strokes_of`: the strokes over the most the hole allows,
  `golfMaxOf`; it replaced `mg_strokes` everywhere). The name card that flies in at each
  hole (`mgNameCard`) already holds the name, the level and the par. A phone on its side,
  a laptop and the TV keep every chip.

## History

The day-by-day log of the work on this game is in `notes/log.md` (search it for the game's name); a new entry goes there, and anything that changes how the game works goes in this file.

## Weak phones draw less (the review of 1 Oct 2026)

The renderer starts at pixel ratio 2 (`threeGfxRatio()`), antialias and soft shadows, and is
tuned by `threeGfxTuner` (JS_Three.html, the shell, shared by بولينج, ميني جولف and عربيات
التصادم): about 2 s of frames drawn back to back are measured after half a second of warm-up
(a pause, a hidden tab, a resting or 30-a-second course and a test's `fpsCap` are not counted);
under 45 a second it steps to ratio 1.25 with plain 1024 shadows, and if still slow to ratio 1
with no shadows. The level lasts the page's life, so the next 3D screen starts there; every
`setPixelRatio` (a resize too) asks `threeGfxRatio()`.

**The audit of 7 Oct 2026.** The gentle putt (the clock, the host's «putt for», «ضربة هادية») is played out before it is sent (`golfPutt` is the same everywhere): one that leaves the ball no nearer - a sliding door or a wheel the straight line can't see sent it back where it lay on «metro», putt after putt - tries the same line harder and softer and, in twelve directions, the farthest point in sight (and, when every way ends in the water, a short putt off the edge), and keeps the one that ends nearest the cup. Over every rest spot of every hole, the putts that got the ball no nearer went from 1.3% to 0.2% (metro 8.5% to 0.7%), and the spots never holed in 20 gentle putts from 46 to 1. A roll cut short on the screen runs to its end with today's clock (`settle` in `mg3Play`: it used a time 2.8 hours ahead, and a cup or a portal stamped with it kept a ball sinking and the flag bouncing). In turns the host's «⛳ اضرب بدل …» waits 30 s from the turn's start (the last roll anyone ended), not from that player's own last roll.
