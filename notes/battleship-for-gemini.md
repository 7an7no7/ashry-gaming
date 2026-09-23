# حرب السفن (Battleship) - what GEMINI.md should gain

Written by the agent that built it (23 Sep 2026), for whoever merges the
branch to fold into GEMINI.md. Each part says where it belongs.

## Key Features & Games (the "Two players & solo" line)

Add beside كونكت ٤ and نقط ومربعات:

> 🚢 **Battleship (حرب السفن)**: the classic 10×10 with five ships, in real
> 3D (three.js): against the phone at three levels, or a room where two play
> and the rest watch, winner stays on (*حرب السفن*).

## The owner's specs, as built

- **حرب السفن (Battleship)** - the owner's spec of 23 Sep 2026, every rule
  asked one at a time (*حرب السفن*):
  - **A room: two duel, winner stays on** (the duels' line; the rest watch on
    their phones or the TV) **and against the phone** (a computer admiral,
    **easy / medium / hard**). **No computer players in rooms.**
  - **Classic 10×10, 5 ships**: حاملة طائرات 5، بارجة 4، طرّاد 3، غواصة 3،
    مدمّرة 2.
  - **A hit shoots again**; a miss passes the turn.
  - **Placing: drag a ship, tap it to turn it, or 🎲 for a random fleet;
    ships may not touch, not even at a corner.** Both place, then each taps
    ready; the first to fire is random in the first game, the challenger
    after that (the duels' seats).
  - **A ship sunk: the shooter learns which ship, it is shown whole on their
    target grid, and the water round it is marked** (nothing can be there).
  - **A turn clock, off by default, 15 or 30 seconds**: the phone fires at a
    random square the player hasn't fired at; the host has "play for" for a
    quiet phone.
  - **The look: a 3D sea "like the bowling and golf"** - crafted low-poly
    ships, moving water, a shell arcing over, a splash on a miss, fire and
    smoke on a hit, a ship listing and settling when it sinks, seen from
    above at an angle; the grid tappable and its squares named (A-J, 1-10);
    on your turn the enemy sea is big, and the camera glides between the
    seas. A clean flat board where WebGL can't draw.
  - **Home: the duels' section** (`group: 'duo'`, beside كونكت ٤), modes
    `['device', 'room', 'tv']` (device = against the phone).
  - **Hidden information on the server only**: each fleet in `room._bs`,
    each seated phone its own in `room.secrets[pid]`; shots and results
    public; a ship's cells public only once it sinks; both fleets shown at
    the end.
  - Decided here (open to change, each in one place):
    - **Firing is two taps**: the first aims (a crosshair, the square's name
      in the status line and on a big "🔥 اضرب B7" button), the second - or
      the button - fires. On a 375px phone a square is ~30px, and a mis-tap
      costs a shot.
    - **With the turn clock on, placing has a clock too: 90 seconds**
      (`BS_PLACE_SECS`), after which whoever isn't ready sails with the fleet
      on their board (the server deals everyone a random one to start from).
      With the clock off, the host's "play for" does the same.
    - **Ready can be taken back** ("✏️ غيّر أماكن السفن") while the other
      hasn't finished.
    - **A hit doesn't say which ship; a sinking does** (the classic rule).
    - **Against the phone, who fires first is drawn at random each game**,
      your last fleet is on the board again for the next game, and the score
      runs game after game (a tally of wins, like the duels).
    - The squares are named with Latin letters and western digits in both
      languages (a physical board, `dir="ltr"`, like the duels').
    - Watchers' phones and the TV follow the sea being fired at (the TV shows
      both seas side by side all the time); at the end each seated phone
      looks at the other's fleet, now revealed.
    - The phone's hard fleet is the least findable of twelve random ones (the
      least where a density search looks first, never most ships on an edge).

## Multiplayer rooms - the Files table

| `Battleship.js` | حرب السفن's fleets, the no-touching check, a random fleet, one shot and its result (a sinking marks the water round it), and the computer admiral: shared by the page (inlined, `SHARED_LISTS`) and the Worker, every name prefixed `bs` / `BS_`. |
| `RoomBattleship.js` | `battleshipAction`: the duels' seats and line (`duelSeatNext`, `duelEnd` from `RoomDuels.js`, bundled before it), placing and ready, the fleets in `room._bs`, the shots, the clock (`bsDeadline` / `bsTimeout`), leaving (`bsPlayerLeft`). |

And in *Publishing*, the FILES list gains `Battleship.js` (before
`RoomGames.js`) and `RoomBattleship.js` (after `RoomDuels.js`).

## A new section: ### حرب السفن

The owner's rules are in *The owner's specs*. Three files and a stylesheet
section (27):

- **`Battleship.js`** (shared, no DOM). A fleet is five `{ x, y, d }` in
  `BS_SHIPS` order (x the column A-J, y the row 1-10, `d` 'h' running right or
  'v' running down); a cell is `y * 10 + x`. `bsFleetProblem` says why a fleet
  can't sail (`shape`, `out`, `overlap`, `touch` - touching includes a
  corner), `bsCanPlace` whether one ship fits beside the rest (the drag and
  the turn use it), `bsRandomFleet` deals one. A **sea** is what the other
  side knows: `{ grid, sunk }`, the grid 100 cells of `BS_SEA`, `BS_MISS`,
  `BS_HIT`, `BS_SUNK` or `BS_CLEAR` (water round a sunk ship, marked by the
  game). `bsFire(sea, fleet, cell)` is the one rule for a shot: it changes the
  sea and says `miss`, `hit` or `sunk` (with the ship, its cells, the water
  marked and `over`). **The admiral reads a sea, never a fleet**
  (`bsAiShot`): easy fires at random at water not marked; medium hunts at
  random and after a hit works along the ship (`bsTargetCells`); hard counts
  every way the ships afloat could still lie (`bsDensity`: a way is out if it
  covers a miss or marked water, or if a hit touches it without being on it,
  since ships never touch; with hits on the board only the ways through them
  count, weighted by how many they cover) and, hunting, keeps to the parity
  of the smallest ship afloat. Measured over 60 fleets: hard 41 shots, medium
  51, easy 87 to sink a fleet; hard beats easy 60 of 60 head to head.
- **`RoomBattleship.js`** is the room: `shared` carries the duel's fields plus
  `phase` ('place' | 'play' | 'over'), `settings.turnClock`, `ready`, `seas`
  (seat k fires at `seas[1 - k]`), `turn`, `turnSeq` (raised at every shot:
  a shot carries it as `seq`, so a double tap is dropped), `shots`, `last`
  (the newest shot: seat, cell, result, the ship on a sinking), `tally`,
  `endsAt` and `reveal`. The server deals each seat a random fleet at the
  start (`place` replaces it with the phone's, checked with
  `bsFleetProblem`; `unready` takes it back). A seated player who leaves loses
  by forfeit, as in the duels.
- **`JS_Battleship.html`** is everything on the page:
  - **One sea view per page** (`bsView`): a root element holding the canvas,
    the labels, the peek pill and the result toast, **moved** into whichever
    screen shows a sea (`bsViewShow(host, model)`), so there is only ever one
    WebGL renderer, and a room frame that is rebuilt (`renderRoomFrame`) never
    loses its canvas - the root is appended to the new host. It is thrown
    away (`bsViewDrop`: geometries, materials, textures, the renderer, the
    context) when no screen shows a sea (`onLeaveScreen`, and
    `onRoomClocksReset` when the room leaves the game); the loop skips a
    frame while the root is out of the page or the tab is hidden, and draws
    every other frame when nothing is moving.
  - **A model** (`bsPhoneModel`, `bsRoomModel`) says what to show: two seas
    (side 0 is yours - or the first seat's for anyone watching and the TV -
    side 1 the other), their grids and sunk ships, the fleets that may be
    drawn (your own; a sunk ship; everything once over), which sea the camera
    frames (the one being fired at; `peek` lets a player look at the other
    for the turn), the newest shot and its key (animated once per phone),
    the aim, and the input (placing or firing).
  - **The 3D sea** (`bsMake3D`, three.js from `loadThree`): ACES tone
    mapping, a sky gradient as a PMREM environment (a dusk one in dark mode),
    a sun with soft shadows; the water is a `MeshPhysicalMaterial` whose two
    tileable canvas normal maps (sine waves with whole-number directions, so
    they repeat without a seam) scroll different ways under a clear coat;
    each sea's board is a transparent canvas texture on the water (the lines,
    the letters and numbers, the marks: a white ring for a miss, a glow for a
    hit, a red outline round a sunk ship, a dot on marked water), redrawn
    only when the sea changes. The ships are built from extruded hull
    outlines (a pointed bow, red below the waterline, the side's colour as a
    stripe), each kind with what makes it recognisable: the carrier's flight
    deck (a canvas texture), island and parked jets; the battleship's three
    turrets, tower and funnel; the cruiser's two turrets and radar; the
    submarine's low hull and sail; the destroyer's single gun; foam round
    every hull; radars turn, ships bob. A shot is a shell on a parabola from
    one of the shooter's ships (muzzle flash) or from over their sea, with a
    glowing tail and a smoke trail, then a splash (a water column, a ring) or
    a blast (a flash of light, fire, sparks, smoke, a small camera shake);
    hits keep burning and smoking; a sinking blows square by square, and the
    ship lists, dips and settles low, charred, still there to be seen; at
    the end the revealed fleet rises from the water. Particles are two pools
    (`bsParticles`: additive for fire, normal for smoke and spray) in one
    `Points` each, updated on the CPU. The camera frames a sea (or both on
    the TV) by searching for the distance at which the board's corners fit
    the canvas at the angle for its shape (58° upright, 52° wide, 46° for
    both), glides between seas, and puts the other sea away once settled.
    Picking is a ray onto the water plane (`pick`): the square under a
    finger. **A shot's result is never shown before its shell lands**: the
    sea keeps its state from just before the shot (`bsSeaBefore` works it
    out from the shot itself) until the landing, and the page holds its
    status, pills and camera the same way (`bsPhoneLocal.flying`,
    `bsRoomLocal.flying`), then `onLand` says it with a toast.
  - **Your own shot leaves as your finger lifts** (the duels' "your own move
    at once"): in a room `bsRoomFire` calls the renderer's `launch`, the
    shell flies, and the server's answer lands it; refused, it never lands.
  - **The flat sea** (`bsMakeFlat`, `bsFlatSeaHtml`): where WebGL can't draw
    or three.js can't load (offline before a first 3D visit), the same model
    as DOM - a 10×10 grid with its letters and numbers, bars for ships, the
    same marks, the same picking, drag and turn. The small map of the other
    sea beside the big one uses the same builder.
  - **Placing** (`bsWireInput`, `bsTurnShip`): a press on a ship picks it
    up, a drag moves it square by square (its footprint green or red), a drop
    where it touches another goes back with a shake; a tap turns it about its
    first square, pushed back onto the board or to the nearest place it
    fits. In a room the fleet being moved is kept in sessionStorage for a
    reload (`bsRoomDraft`).
  - Against the phone: `appState.battleship` (restored through
    `soloRegister`), the admiral fires after the shell has landed and the
    camera has come round (`bsPhoneMaybeAi`).
  - Sounds from `fxTone` / `fxNoise` (`bsSound`: the gun, the whistle, a
    splash, a blast, a sinking, a clunk when a ship is set down); the TV is
    the room's one voice (`duelRoomLoud`).
- **Layout** (section 27): upright, the pills and the status, then the sea
  (about square, sized so the bar under it stays on the first screen), then
  what to do, then the small map and the fleets; on a phone on its side and
  from 900px the sea takes the height and the rest is a column beside it;
  the TV is both seas across the stage with the pills, the fleets and the
  line beside them.

## Traps (worth adding)

- **The i18n check reads every `t.x` as a translation.** `check-i18n.js`
  warns about "unfallback-ed t.<key> reads" for any `t.something` in a page
  file - including a three.js texture called `t` (`t.wrapS`) or a GLSL
  variable (`t.a` in a shader string). Name such things anything but `t`.
- **Tailwind scans comments too.** A comment with the word "outline" in a
  `JS_*.html` file made `npm run build:css` add a `.outline` utility. Only
  rebuild the CSS when a class was really added, and check the diff.
- **A room frame rebuilt with `innerHTML` takes its canvas with it.** A WebGL
  canvas can't be in the frame's markup: keep it in a root the game owns and
  append that root to the new host after every rebuild (a moved canvas
  keeps its context).
- **Headless Chrome draws WebGL only with SwiftShader**
  (`--use-angle=swiftshader --enable-unsafe-swiftshader`), and its tabs share
  one `localStorage` - so one room session: give each tab its own browser
  context (`Target.createBrowserContext`) to act as separate phones.

## The log

- **23 Sep 2026, حرب السفن** - Battleship to the owner's rules, asked one at a
  time: the classic 10×10 and five ships that may not touch, a hit fires
  again, a sunk ship shown whole with its water marked; against the phone at
  three levels and in rooms (the duels' winner stays on, no computer
  players), a turn clock off by default. In real 3D with three.js (the
  owner's bar: "like the bowling and golf") with a flat board where WebGL
  can't draw. `Battleship.js` (shared), `RoomBattleship.js`,
  `JS_Battleship.html`, section 27 of `Style.html`. Rules tests: 44 new
  (fleets, touching at a corner, shots, sinking and its water, the admiral
  always legal and finishing, hard ahead of medium ahead of easy and hard
  beating easy head to head, and every room rule: placing, ready and back,
  turns, a double tap, winner stays on, the clocks, "play for", a forfeit).
  The leak check plays three games (one on the clock) with four probes (a
  fleet on its own phone only; no fleet or reveal on the table while it is
  played; a sunk ship public only where it really is; a square shows a ship
  only once hit); proved by putting a fleet into `shared` in a scratch build.
  Robot tests: 1553, a battleship round among them (placing, a refused
  fleet, turns, a hit, a sinking, a miss, a game to the end, winner stays on,
  the host's "play for").
