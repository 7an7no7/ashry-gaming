# حرب السفن (id `battleship`)

Moved from GEMINI.md on 30 Sep 2026. GEMINI.md keeps the rules that apply to every game and an index; this file keeps the detail, word for word.

## From GEMINI.md: The owner's specs, as built

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

### حرب السفن

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
    every other frame when nothing is moving (a burning ship's particles
    count as nothing moving since 28 Sep 2026: they used to keep every frame
    going for the rest of the game). **A phone at rest draws 5 frames a
    second** (`bsResting`, `BS_REST_GAP`), sleeping on a timer in between:
    no touch for 10 s while it has nothing to do - the models say `mine`
    for placing and for this phone's shot, so the other player, a watcher,
    or the phone after the game. A touch anywhere (a document listener), a
    new state, a shell, a drag or this phone's move wakes it at once
    (`wake`, wrapped round every call that can start motion). The TV
    (`both`) never rests. Measured on 28 Sep 2026: the waiting phone 72 →
    4.8 renders a second idle (rAF 144 → 9.5), the TV and the phone to move
    unchanged.
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

**The board as it stands reaches the server (the review of 1 Oct 2026).** While placing, the phone sends its fleet as `draft { fleet }` after every move, turn and 🎲 (and once more after a reload that kept a board): checked with `bsFleetProblem`, stored in `room._bs.fleets[seat]` and the phone's own slice, never ready. So when the 90-second placing clock (with a turn clock on) runs out, or the host presses «sail for», everyone sails with the fleet on their own screen, not the server's first random one. A refused draft (ready already, at sea, an older server) is dropped quietly. The host's «play for» / «sail for» row has its own timer (`bsHostRowDue`), so it shows when its 40 seconds are up even if nothing else changes; the help says placing gets a minute and a half when the clock is on.

## «الرادار»: built 2 Oct 2026

Picked from the ideas page of 2 Oct 2026 (https://claude.ai/artifact/7Mhgw1ePSi3GhgEvDcSHxz, idea numbers in brackets) and every rule asked.

- **(366) One radar scan a game for every player**: a 3x3 area, the answer is how many ship squares are in it, never where.
  - **It is your turn**: scanning replaces that turn's shot.
  - **The opponent sees where the sweep went** over their own sea (not the count); the TV shows the sweep and the number.
  - **A lobby switch «الرادار», on by default**, the same on one phone, in rooms and against the computer (the computer uses its radar too).

How it is built:

- **`Battleship.js`** (shared): `bsRadarCentre(cell)` (the area's middle, kept a square off every
  edge), `bsRadarCells`, `bsRadarCount(fleet, centre)`, `bsRadarLeft(sea, scan)` (the area's open
  squares and how many ship squares are still to find there), and the phone's radar:
  `bsAiRadar(sea, level, shots)` (where to sweep, or -1) and `bsAiShotRadar(sea, level, rnd, scan)`
  (its shot with the count: an emptied area is kept clear of, an area with ships left is hunted
  first while there is no hit to follow; easy forgets the answer).
- **`RoomBattleship.js`**: `settings.radar` (`bsOptions`, on unless `radar: false`), the action
  `radar { cell, seq }` (`bsSweep`: the player whose turn it is, once a game, `staleTap` on `seq`;
  the turn passes). Public: `shared.radar[seat]` = `{ cell, mv }` (where), `shared.scan` (the newest
  sweep) and `mv`, which counts every move (a shot's `last.mv` too) so a page knows whether the
  last thing was a shot or a sweep. Hidden: `room._bs.radar[seat]` = `{ cell, count }`; the
  sweeper's phone gets its own as `room.secrets[pid].radar`, the screen both as
  `room.screenOnly.bsRadar` (`bsWriteSecrets`). The leak check has a probe for it (the count on no
  other phone, nowhere in `shared`), proved by handing the count to the other seat in a scratch
  build; `rules.mjs` and the robots (`battleship` segment) play it.
- **`JS_Battleship.html`**: a model's seas carry `radar` (the areas swept on that sea, with `n`, the
  count, where this screen may know it) and the model `scan` / `scanKey` / `onScan`, played once per
  phone like a shot. The 3D sea draws an area as a dashed green frame with the count in a badge on
  the board texture (`drawBoard`), aims an area with a frame of corner brackets (`areaAim`, the
  model's `aim.area`), and sweeps with a beam turning twice over a pulsing frame (`playScan`,
  `bsRadarBeamCanvas`, `bsRadarFrameCanvas`), holding the area's count and the camera until the
  beam is done (and 1.3 s after, so the count is seen on its area); the flat sea does the same in
  CSS (`.bs-fradar`, a conic beam turned by `transform`). With motion off it is simply drawn.
  The bar on your turn has «📡 استخدم الرادار» (`bsRadarBarHtml`): in radar mode a tap aims the
  area, a second tap on it or «📡 امسح حوالين E5» sweeps, «ارجع للضرب» goes back. Under the fleets,
  `bsRadarLogHtml` says each side's sweep (yours with its count). Against the phone:
  `appState.battleship.radarPref` (the setup switch), `radarOn`, `scans`, `scan`, `mv`,
  `radarMode` (`bsPhoneSweep`, `bsPhoneScanned`); the phone sweeps in `bsPhoneMaybeAi`. In a room:
  `bsRoomLocal.radar` / `sweeping` / `seenScan` (`bsRoomSweep`, `bsRoomNoteShot`, `bsRoomScanned`),
  the lobby switch `bsRadarSwitchHtml` (remembered in `battleshipRoom`, sent in `startPayload`;
  `duelLobbyHtml` takes an `extra` block for it), the TV the same log with the counts.
- **The game's words moved out of the shell's `TRANSLATIONS`** into `BS_TEXT` in
  JS_Battleship.html (read through `bsT`), as السلم والتعبان's bubbles did: the shell was at its
  710 KB budget, and with the radar it is 709.9 (master 710.06). Only the setup screen's words
  (`data-i18n` in Controller.html) stay in `TRANSLATIONS`.

Decided here (open to change):

- **The count is every ship square in the area**, hit or not, sunk or afloat (what a radar sees);
  the player subtracts what they already found (and so does the phone, `bsRadarLeft`).
- **The area is the 3x3 round the square tapped, pushed back onto the board at an edge** (a tap on
  A1 sweeps A1-C3), so it is always nine squares.
- **A sweep passes the turn like a miss**, even right after a hit.
- **The watchers' phones see where a sweep went, never its count** (only the sweeper and the TV).
- **In a tournament the TV shows where the sweeps went, not the counts** (several matches at once;
  `room.screenOnly` is the room's, not a match's). The sweeper's own phone has its count.
- **The phone sweeps** only with no hit to follow, after a few of its own shots (hard 4, the others
  6), with a chance each turn (easy 0.2, medium 0.35, hard 0.6), over the area with the most open
  water (hard: the most likely squares by `bsDensity`).
- **The radar button is on your turn only**, and a reload keeps what was swept (both sides) - the
  radar stays used.

**The server checks «play for» too (the audit of 6 Oct 2026).** `skipTurn` is refused («استنى شوية») while everyone it would play for is connected and their step began under 40 s ago (`BS_QUIET_MS`, `room._bs.quietAt`, stamped by `bsMarkQuiet` after every move and timeout), as بنك الحظ does.

## The ideas of 7 Oct 2026, second batch (the owner's picks): built

- **(1055) The fire button: one fixed place, big.** On your turn the bar under the sea always holds one `.btn--primary .btn--lg`: greyed «🎯 اختار مربع» until a square is aimed at, then «🔥 اضرب B7» (the second tap on the square still fires). In radar mode the same place is «📡 اختار مكان الرادار» greyed, then the sweep. While your own shell is flying (or sent) the greyed button stays, so the thumb's place never empties mid-turn (`bsRadarBarHtml` with `wait`, `bsPhoneBarHtml`, `bsRoomBarHtml`). The words are in the chunk's `BS_TEXT` (`bs_pick`, `bs_radar_pick_btn`), as the game's others; the old «اضغط على مربع…» line under the bar is gone (the status line says it).

## History

The day-by-day log of the work on this game is in `notes/log.md` (search it for the game's name); a new entry goes there, and anything that changes how the game works goes in this file.
