# الأوضة المضلمة (id `darkroom`)

Moved from GEMINI.md on 30 Sep 2026. GEMINI.md keeps the rules that apply to every game and an index; this file keeps the detail, word for word.

## From GEMINI.md: The owner's specs, as built

  - **الأوضة المضلمة** (blind co-op maze), **its own card** (the owner chose
    it over a level inside سلك مقطوع): the TV shows a maze from above; one
    player moves with arrows on a black screen, every other phone sees a
    piece of the map, and they talk the mover through. **Two stories, a
    lobby choice**: the power cut at home (the kid to the fridge: toys on
    the floor, the cat, grandpa asleep) or a pharaoh's tomb (a torch,
    traps, cartoon mummies). **Movement, a lobby choice**: a step per tap on
    an arrow (squares) or continuous with a joystick. **A trap: back to the
    start and a heart lost** (3 hearts for the team). **Levels that get
    harder** (bigger maze, moving traps), **the mover changes each level**.
    **2-8 players** (two: one blind, one sees the whole map), **no TV
    needed**.
    **The look: ج «العدسة والصدى»** (the owner, 29 Sep 2026, took the
    recommendation, from a second sheet in 3D,
    https://claude.ai/artifact/EvE9c3QFCJ6Q41Tn48fhyn - the first was
    rejected: flat drawing, a boring grid of squares): real rooms in 3D
    (three.js), never a visible grid; each guide drags a lens over the dark
    plan and sees the other lenses as dashed rings (with two players the
    lens is the whole map); the mover sees nothing but an echo line where a
    wall or furniture is beside them; the TV in 3D with a 2D switch (2D is
    also the fallback). Borrowed from the other two looks: the house's rooms
    (grandpa snoring in his armchair, the cat's glowing eyes, the fridge
    glowing) and the tomb's torches, sarcophagus and mummy. **The owner:
    improve the maps and the traps while building** - varied, hand-made-
    feeling layouts per level, traps that belong to each story and move,
    near misses that react.
    **Built 29 Sep 2026** (*الأوضة المضلمة*). Decided while building (open
    to change, each in one place):
    - **Only the map's seed is secret** (`room._dark.seed`): the guides'
      slices and the screen carry `{ seed, story, level }` and draw the very
      map from it (`darkMap`, cached); the mover's slice is only the echo
      round its square (`darkEcho`). Where the mover stands, the hearts and
      the events are public (the table sees the walk anyway).
    - **The TV is sent the map through its own channel** (`room.screenOnly`,
      projected as `screen` to screens only, never to a phone), and is dark
      but where the lenses are, like a guide's phone; the mover is told to
      turn their back to it («ادي ضهرك للتلفزيون»).
    - **The map is never turned** for anyone, so "left" and "right" are the
      same on every phone and the TV.
    - **The levels** (`DARK_LEVELS`): 10×7 with 4 rooms and 3 still traps,
      then 12×8 / 5 rooms, 13×9 / 6, 15×9 / 7, 16×10 / 8 (and on at that
      size), 1-2 moving traps from level 2, loops in the plan from level 2;
      level 1 has no moving trap. A layout is BSP rooms, doors on a spanning
      tree plus loops, each room a kind (the kids' room, the kitchen,
      grandpa's room, the salon, the hall, the dining room; the tomb's
      entry, the treasure, the sarcophagus room, the pillars, the sand room,
      the jars) with its own floor and furniture against its walls.
    - **The traps**: home - Lego and a squeaky duck on the floor, a creaky
      tile beside grandpa's armchair, the cat pacing, a ball rolling across a
      room; tomb - pressure plates, sand pits, a plate beside the
      sarcophagus, a mummy patrolling, a swinging blade (open 6 ticks of 8).
      Moving traps run on a clock of 350 ms ticks from the level's start
      (`DARK_TICK`, `shared.t0`), the same on every screen. **Every level is
      checked walkable** by a (square, tick) search (`darkSolve`) before it
      is dealt; a map that isn't loses traps until it is.
    - **A near miss** (a trap on a square beside the mover's) is a private
      event to the guides and the TV (a toast, a sound); the sleeper wakes up
      a little (grandpa, or the mummy in the sarcophagus, stirs) as the
      mover comes near, and sits up on a trap beside it.
    - **Joystick mode is walked on the server**: each push carries the
      stick's direction and the server walks the last one for the time since
      (at most 0.35 s, `DARK_STICK_DT`, `darkAdvance`), sliding along walls.
      Steps are at least 110 ms apart (`DARK_STEP_GAP`).
    - **The times**: the level's name 2.6 s before anyone moves, a trap 2 s
      (back on the start at once, the stun after), a win 4.6 s, then **the
      next level deals itself** with the next mover in a shuffled order.
    - **Hearts are the whole game's** (3, never refilled); the game is over
      at 0, and its score is levels cleared, with the room's best kept on
      play again. No night-board points (it is co-op).
    - **Someone who joins mid-game becomes a guide** (up to 8), at once.
    - **A quiet mover**: the host's (or a stand-in's) «عدّي الدور» passes the
      walk to the next, from the start, with no heart lost - **on a new map
      of the same level** (the owner, 30 Sep 2026: the next mover watched the
      old one as a guide), as when the mover leaves mid-level.
    - **The lens**: 2 players - the one guide sees the whole map; more - each
      lens a circle of `darkLensR` (smaller with more guides), held 44 px
      above the finger on a touch screen; it goes to the other guides and
      the TV through the live channel (`relayLens`), never to the mover.
    - **Phones draw 2D only**; the TV 3D (or 2D, its switch remembered).
      The home, party section (`group: 'party'`), blue, a drawn icon
      (`art:darkroom`: a lens over a dark plan).

### الأوضة المضلمة

The owner's rules are in *The owner's specs* (the five new room games). Game
id `darkroom` everywhere (`room-darkroom`, `ROOM_GAMES.darkroom`,
`TV_GAMES.darkroom`, the catalog, the help); the rules are named `dark` /
`DARK_`, the page's code `dk` / `DK_`, the stylesheet section 57
(`.dk-*`). Rooms only, 2-8 people, no computer players, the TV optional.

- **`Dark.js`** (shared, no DOM): a map is `darkMap(story, level, seed)`
  (cached per key), made from the seed with `darkRng` (mulberry32): a BSP
  partition into rooms (`darkPartition`), doors on a spanning tree plus loops
  (`darkDoorOn`), each room's kind and furniture against its walls
  (`darkPlace`, never cutting the plan in two), the still traps (most on the
  shortest way, so the walk has to go round), the moving ones (a patrol path
  walked a square every `DARK_STEP_TICKS` ticks, a ball rolling across, a
  blade on `DARK_BLADE`'s period), the torches and the sleeper. A map has
  `w`, `h`, the rooms, `doors`, `blocks`, `start`, `goal`, `traps`, `dyn`,
  `segs` (the walls for drawing) and `solve` (the fewest ticks from the
  search). `darkBlocked(m, x, y, dx, dy)` is the one rule for a move (a wall,
  a door's edge, furniture, the edge), `darkEcho` what the mover's phone may
  know (which sides are blocked, and by what kind), `darkDynAt(m, tick)`
  where the moving traps are, `darkNextHit` the next tick one reaches a
  square (the server's alarm), `darkAdvance` the stick's walk,
  `darkLensR(m, guides)` the lens.
- **`RoomDark.js`**: `shared` holds `story`, `mode` ('steps' | 'stick'),
  `roster`, `order`, `turn`, `moverId`, `guides`, `level`, `hearts`,
  `cleared`, `best`, `run` (a count of starts; every move carries it,
  `staleTap`), `pos`, `face`, `vel`, `t0`, `phase` ('play' | 'trap' | 'won'
  | 'gameover'), `stunUntil`, `nextAt`, `steps` and the public events `ev`
  (`level`, `bump`, `trap`, `back`, `won`, `mover`, `over`). `room._dark`
  (never projected): the seed and the private events `pev` (a near miss or a
  trap with its square). Moves: `start` / `playAgain` (the host, `{ story,
  mode }`), `step { d, run }`, `stick { vx, vy, run }`, and the move-on
  `passMover { run }`. `darkSync` rewrites every slice after each move: the
  mover `{ mover: true, echo }`, a guide `{ g: { seed, story, level }, pev }`,
  and `room.screenOnly` the same for the screens.
- **The rooms server**: `view.js` sends `room.screenOnly` to a screen only
  (`screen`; a phone gets `null`), which is how a TV draws a map no phone
  but the guides' may have. `room.js` relays a guide's lens (`relayLens`,
  when `darkRelaying(room)`): from a roster guide only, to every socket but
  the sender's and the mover's, rate-limited like the bumper cars' sticks,
  never stored.
- **`JS_RoomDark.html`**: a guide's phone draws the map on a canvas
  (`dkPlan`: floors, furniture, walls with their shade, cached per level;
  the traps, the cat, the mummy, the ball, the blade, grandpa, the goal's
  glow and the torches live each frame, `dkDrawLive`), dark but under the
  lenses (`dkDark`, `dkLenses`); its own lens is dragged (`dkWireGuide`,
  sent `Room.sendLive({ k: 'lens' })` at most 11 times a second while dragging, every 2.5 s besides), the others'
  are dashed rings in their colours. The mover's phone is the sonar
  (`dkDrawMover`: rings and an echo line on each blocked side) and the
  arrows (steps; the keyboard's arrows too) or the stick (sent 8 times a
  second while held). The loop (`dkFrame`) draws at 30 frames a second
  while something moves, 6 on a phone untouched for 10 s, never on a hidden
  page; the TV never rests. The TV (`dkTvMount`): 3D through `loadThree`
  (`dkTv3D`: the rooms with their floors, walls, furniture, grandpa in his
  armchair, the cat's glowing eyes, the fridge's glow, the torches, the
  sarcophagus and the mummy; lit only under the lenses by spotlights; pixel
  ratio at most 2; drawn only when something changes or moves; disposed on
  leaving) or 2D (`dkTv2D`, also the fallback), a 3D / 2D switch
  (`dkTvSet`, remembered as `darkTv`). Events play once (keyed on the deal):
  a bump shakes the sonar, a trap is a banner and its sound, a win confetti,
  a new level a banner with the next mover's name. The room's one voice is
  the TV, else the host's phone (`dkVoice`); the mover's own phone plays its
  own steps, bumps and traps.
- **Layout** (section 57): upright the head, the map (or the sonar and the
  arrows), then the lens chips and the hint; a phone on its side and from
  900 px the map beside the column (the sonar beside the controls). The TV:
  the pills on top, the view full size, the chips and the switch at the foot.
- Tests: `rules.mjs` ("The dark room": 480 maps walkable by an independent
  (square, tick) search, the same map from a seed, one connected plan, the
  traps where they belong, the creaky tile beside grandpa, the levels
  growing, the lens, the stick stopping at a wall, and the room's rules),
  `leaks.mjs` (`PROBES.darkroom`: the seed never on the mover's phone or in
  `shared`, the mover sent nothing but the echo, no trap's square public;
  proved by planting each), `play-all.mjs` (`--only=darkroom`).

**The review of 1 Oct 2026.** The room's best is kept in `room._darkBest` (as `_wireBest`, `_exactBest`), so a trip to the hub and back no longer forgets it; `shared.best` is read from it at every start and win.

## The ideas of 7 Oct 2026 (the owner's picks): built

- **810 «الميكروفون»** (no extra rule asked; built as described). A lobby
  switch, **off by default** (chosen: it changes how the table talks), remembered
  on the host's phone (`darkRoom` options, `mic`) and kept by play again. On:
  `shared.mic`, and `shared.micId` is the guide who may talk - the first guide at
  the start, and always a guide still here (`darkSync`: when its holder becomes
  the mover or leaves, the first guide). `passMic { from, to? }`: the holder taps
  «عدّيه للي بعدي» (the next guide in `shared.guides`), the mover calls a guide by
  name (`to`, a guide only), or the host (anyone once the host is away,
  `requireMoveOn`) moves it; `from` is the holder the phone saw (`staleTap`), so a
  double tap passes it once; the public `mic { to }` event. Shown big on every
  phone (`dkMicPaint`: the holder «الميكروفون معاك: إنت بس اللي تتكلم!» and the pass
  button, the other guides «الميكروفون مع منى · اسكت واستنى دورك», the mover the
  holder and a chip for each other guide to call) and on the TV (a pill at the
  top in the holder's lens colour). With one guide there is nothing to pass and
  nothing is shown. Talking is the table's rule, not the app's.
- **813 دايخ!** (no extra rule asked). The premise needed one change: the cat
  is a trap in this game (touching it costs a heart), so "a bump into the cat"
  is built as **the cat brushing past** - the cat on a square beside the
  mover's as they arrive (`darkNear` = 'cat') - at home; in the tomb **a bump
  into a pillar** (`darkBlocked` = 'pillar', steps and joystick). From level 3
  (`DARK_DIZZY_FROM`) that makes the mover dizzy for 5 s (`DARK_DIZZY_MS`,
  `room._dark.dizzyUntil`, extended by another such bump): a step's left and
  right are swapped on the server (`darkSwapLR`; up and down stay), the
  joystick's x is turned round; the bump event still names the arrow pressed,
  so the mover's phone is never told. The guides' slices and the screen's carry
  `dz` (until when, by the server's clock) and the private `dizzy` event: a
  banner «😵 منى داخ! الشمال بقى يمين» and a wobbling note with the seconds left
  (`dkDizzyPaint`, painted every frame), a wobbly sound on the voice. Back at
  the start (a trap, a new map, a new mover) ends it.
- Tests: `rules.mjs` ("The dark room": the mic with the first guide, a guide
  without it refused, passed on, a double tap dropped, the mover calling,
  never the mover, its holder leaving, off by default; dizzy at level 3 from a
  pillar for 5 s, told to the guides and the screen and never the mover, left
  walks right, then left again, nothing at level 2), `leaks.mjs` (nothing
  dizzy on the mover's phone).

## History

The day-by-day log of the work on this game is in `notes/log.md` (search it for the game's name); a new entry goes there, and anything that changes how the game works goes in this file.
