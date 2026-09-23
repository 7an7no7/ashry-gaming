# ميني جولف: what GEMINI.md should gain

Written by the agent that built the game (23 Sep 2026), for whoever merges it
into GEMINI.md. Each part says where it goes.

## Key Features & Games (the list at the top)

Under a new line after the duels:

- **Sports, in real 3D:** ⛳ **Mini Golf (ميني جولف):** nine holes (a
  windmill, a bridge over water, camel humps, a pyramid, a waterwheel's beam,
  a curved wall under a lighthouse, a sliding gate, an oasis), pull back from
  the ball and let go; solo with the best kept on the phone, or a room with the
  TV where every ball plays the hole at once, or in turns (*ميني جولف*).

## The owner's specs, as built

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
  - **3, 6 or 9 holes, 6 by default** (the host's choice; solo a setup
    choice) - the first 3, 6 or 9 of the course, in order. About a minute a hole.
  - **6 strokes, then the ball is picked up and the hole counts 7.**
  - On the holes: **walls, slopes (hills), water (back to where you shot from,
    +1), sand (slows), and moving pieces** (the windmill, a sliding gate, a
    turning beam) on a clock every phone shares.
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
    nine holes and their pars (2, 3, 3, 3, 3, 3, 3, 3, 4 - 8 for three holes,
    17 for six, 27 for nine); in turns **the best score on the last hole tees
    off first** (golf's honour; ties keep their order); the card between two
    holes shows for **7 seconds** after the last ball stops, then the next hole
    comes by itself (the host can skip ahead); a player who leaves takes their
    ball and their card with them; the last player alone plays on; the winner
    of a room game (lowest total) counts a win for the evening only when there
    was somebody to beat; a latecomer watches the hole and plays the next game.

## Where the app is going: the log

- **23 Sep 2026, ميني جولف** - the owner's rules asked one at a time (*The
  owner's specs*) and the lead's 3D preview (look أ «نجيلة») turned into the
  game: nine holes in `MiniGolf.js` (deterministic physics, shared with the
  rooms server), the room in `RoomMiniGolf.js`, the 3D course, solo, the room's
  phones and the TV in `JS_MiniGolf.html`, section 29 of `Style.html`. Rules
  tests: a search gets into every hole within par + 1 and finds no ball
  resting where the cup can't be reached; 300 putts give the same result
  twice; water, sand, the humps, the windmill, the gate and the waterwheel;
  the pick-up at 6 → 7; both room modes, the t0 tolerance, stale taps, the
  clock's gentle putt, leaving, the podium. The leak check plays both modes
  (nothing is hidden: the generic rules). Robot tests: 1527 (a mini golf round
  in each mode on a live server). A deploy is needed for the rooms server.

## Multiplayer rooms: the Files table

| `MiniGolf.js` | ميني جولف's nine holes and one putt as plain arithmetic (only + - * / and `Math.sqrt` / `floor` / `abs` / `min` / `max`, never `Math.sin`), the way to the cup (`golfField`) and the clock's gentle putt (`golfAutoShot`): shared by the page (inlined, `SHARED_LISTS`) and the Worker, every name prefixed `golf`. |
| `RoomMiniGolf.js` | `minigolfAction`: all at once or in turns, the server's result of every putt, picking up at 6, the hole's card and the next hole on the server's clock, the putt clock, leaving. Bundled after `RoomGames.js`. |

The deploy list (*Publishing*) gains `MiniGolf.js` before `RoomGames.js` and
`RoomMiniGolf.js` after it.

## A new section: ### ميني جولف (after ### المشنقة)

The owner's rules are in *The owner's specs*.

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
  `nextAt` (7 s after the last ball stops), or on the host's `nextHole`.
- **`JS_MiniGolf.html`**:
  - **One 3D engine per page (`MG3`)**: one `WebGLRenderer` (pixel ratio ≤ 2,
    ACES tone mapping, soft shadows, a sky environment from `PMREMGenerator`),
    moved into whichever screen shows the course - solo, a room's phone, the
    TV - and **disposed when the course leaves the screen** (`onLeaveScreen`,
    and the loop lets go of a canvas that has been off the page 1.5 s). It
    draws at the screen's rate while something moves (a roll, a pull, a
    windmill), 30 frames a second when only the flag and the water move, and
    not at all while the page is hidden. Textures are drawn on canvases once
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
    back to where the ball ends. The best total per course length is
    `soloRecord('minigolf', '3' | '6' | '9')`.

## Traps

- **A class name for a wrapper and for a widget can collide.** The solo
  view's wrapper was `.mg-host` and so was the host's row of buttons,
  absolutely placed - the whole course collapsed to 0 × 240 px and nothing
  failed but the picture. Name a widget for what it is (`.mg-hostrow`).
- **A solid under a surface covers what goes down through it.** The course
  stands on a stone plinth (an extruded polygon); its top at the green's
  height z-fought with the grass, and the cup and a bowl, which go below the
  green, were covered by it. The plinth's top is 3 cm under the green and it
  has holes where the cup and the bowls are. Water lies *over* the green
  (with a polygon offset): a hole in the green shape for a pond that touches
  the rails' edge doesn't triangulate.
- **Headless Chrome needs a software GL for a 3D check, and it is slow**:
  `--use-angle=swiftshader --enable-unsafe-swiftshader`. At full frame rate
  it starves DevTools calls for seconds; `MG3.fpsCap = 3` in the page keeps a
  scripted check moving (the cap is 0, off, for everyone else).
