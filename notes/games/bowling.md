# بولينج (id `bowling`)

Moved from GEMINI.md on 30 Sep 2026. GEMINI.md keeps the rules that apply to every game and an index; this file keeps the detail, word for word.

## From GEMINI.md: The owner's specs, as built

- **بولينج (Bowling)** - the owner's spec of 23 Sep 2026, asked one at a time;
  look أ «صالة» from the lead's 3D prototype (*بولينج*):
  - **Solo (best score kept on the phone) and a room with the TV.** No
    one-phone pass-around, **no computer players**.
  - **5 or 10 frames, 5 by default**; real ten-pin scoring (strikes and spares
    carry; the last frame's bonus balls).
  - **Swing the ball** (the owner, 23 Sep 2026, after playing the first
    build: "move it from back to front like in Plato and in real life - it
    affects the speed too, like I'm swinging it"): the ball follows the
    finger on the approach; **pull it back, then swing it forward and let
    go**. The forward swing's speed is the ball's speed and **a longer
    backswing adds to it** (a swing with none gives three quarters); its line
    aims, **a curve in it hooks**; where the ball is when it is let go is
    where it is released. (The first build only read an upward swipe.)
  - **The line holds still** (the owner, 23 Sep 2026, the same evening:
    "the shot assist is not working correctly ... the line is moved when I
    swing"; asked, they confirmed the line jumped and wobbled while swinging):
    **the backswing sets the line, like a pendulum** - pull back straight and
    the ball rolls straight, on a slant and it rolls on that slant - and on
    the way forward the ball swings along that line whatever the thumb does,
    so the aim guide starts at the ball in the hand and doesn't move; the
    thumb's sideways wander in the forward swing is the hook (the guide's far
    end bends as it forms). A throw with no backswing (a flick from the line)
    goes the way the flick went. Sliding the ball across first, to line up,
    is not part of the backswing.
  - **Pins that fall the way real ones do** (the owner, the same evening:
    "the accurate of what is falling based on what was hit, more real"): the
    pin physics were tuned against the shape of the USBC pin-carry study - a
    hook into the pocket at 5-6 degrees strikes about four times in five, a
    straight ball into the same pocket about one in three, a ball full on the
    head pin mostly splits (4-6, 7-10, 4-7-10), a light pocket hit leaves the
    5 or the 5-7, a high one the 6-10, a soft hit on the 3 the 2-4-5 bucket,
    and any touch of the ball takes a lone pin. A full hook now reaches the
    pins at 5-6 degrees (it was about 2.5, too little to carry), and the ball
    loses about 1 m/s down the lane, as a real one does.
  - **Seen from behind the ball, in perspective** (three.js, real 3D).
  - In a room **everyone bowls in turn and everyone watches every throw**, on
    their phones and the TV. **No bumpers.**
  - **The aim guide («مساعدة التصويب») is a switch, off by default**: a line
    showing where the ball will go while you swipe; no arrow otherwise. Solo a
    setup option, in a room the host's lobby option; remembered on the phone.
  - A turn clock **off by default, 20 or 40 seconds**: when it runs out the
    phone throws a gentle straight ball for the player; the host has a "play
    for" button for a quiet phone. **No daily.**
  - The home's **رياضة / Sports** section, 🎳, violet.
  - **No words in the hall** (the owner, 23 Sep 2026: "no «صالة عشري»"): the
    masking unit is a panel with a neon line, pinstripes and three glowing
    pins; the overhead screens are dots, the main lane's showing the pins
    really standing. No name or brand text anywhere in the scene.
  - Decided here: one person can open a room game of it (bowl alone with the
    TV); the order is the room's, whoever joins later watches (`lateJoin`)
    and bowls the next game; two level on top both win; a player who leaves
    takes their card off the board and the turn passes on; nobody left to
    bowl ends the game; the board (and the TV's score strip) stays empty
    until the game is over, or the strip would give a ball away before its
    pins fall on screen - so a game abandoned mid-way banks nothing on the
    night's table.

### بولينج

- **`Bowling.js`** (shared, no DOM; inlined into the page through
  `SHARED_LISTS` and bundled into the Worker before `RoomGames.js`). Plain
  arithmetic only (`+ - * /`, `Math.sqrt/floor/abs/min/max`, a polynomial
  `bowlSinCos`), so the server and every phone get the same pins down from the
  same four whole numbers `{ x, aim, speed, spin }` (`bowlCleanShot` clamps
  and rounds them). `bowlStart` / `bowlStep` (1/240 s) / `bowlRun` /
  `bowlThrow`; the pins are circles on the deck - a standing pin its base, a
  falling or lying one also its belly and its head along the way it fell - so
  a pin that goes down sweeps its neighbours (the pin action that turns a
  pocket hit into a strike). A lying pin spins round its middle (`spinZ`,
  capped and damped). The hook grips once the oil runs out (12.2 m) and stops
  when the ball rolls out (`HOOK_MAX`, 0.85 m/s: 5-6 degrees into the pins at
  full spin); the ball slows `BALL_DECEL` down the lane. The ball always carries on into the pit
  once it has hit (it used to stall among the lying pins). `hopAt`/`hopV` are
  for the page only (a pin hit hard is lifted into the air for a moment).
  The score sheet: `bowlScore`, `bowlFrameNext`, `bowlMarks` (X / - …),
  `bowlBallKind`, and a card: `bowlNewCard`, `bowlApply` (one ball onto it,
  and the rack for the next), `bowlTotal`. `bowlGentleShot` is the clock's
  ball. **Every number of the pins' physics is a named constant in `BOWL`**
  (restitutions, the knock thresholds - `KNOCK_BALL` for the ball, lower, and
  `KNOCK` for a pin, higher, so a gentle nudge rocks a pin rather than setting
  off a chain of dominoes - the frictions, how fast a pin goes over, the
  spin a glancing hit gives, the kickbacks), found by a search that rolled the
  ball into a full rack at every spot from 22 cm left of the head pin to 26
  right, at 0-8 degrees and three speeds, and matched the strike rate of each
  against the pin-carry study's shape. `rules.mjs` holds the result: the
  pocket at 6 degrees strikes at least 70%, a straight ball into it 20 points
  less, head-on mostly splits, a light hit and the far side seldom strike, the
  two pockets of a straight ball carry alike, a touch takes a lone pin, and a
  full hook reaches the head pin at 5-8 degrees. A ball hooking right (spin +)
  carries into the pocket left of the head pin (the 1-2), one hooking left
  into the 1-3. Every throw settles within about 1.5 s of the first hit.
- **`RoomBowling.js`**: `shared` holds the whole game (nothing is secret):
  `order`, `cards`, `turn`, `turnSeq` (raised every ball; a throw carries it,
  a stale one is dropped), `throwSeq` and `last { seq, pid, shot, before,
  after, down, kind, ms, auto }` - the ball every phone replays. The server
  runs the throw itself (`bowlRun`) and is the authority. `readyAt` is when
  that ball has been watched (`ms` + `BOWL_SET_MS` 4.2 s: the verdict, the
  sweep, the rack set again); the turn clock (`endsAt`) counts from it.
  `skipTurn` (host) and the clock throw `bowlGentleShot` with `auto: 'host' |
  'clock'`. `bowlPlayerLeft`, `bowlDeadline` / `bowlTimeout`. `board` only at
  the end; `wins` across play again; `winners`.
- **`JS_Bowling.html`**:
  - **The lane** (`bowlGfx`): one renderer per page, made when a bowling
    screen opens (`bowlGfxMount(stage)` loads three.js with `loadThree`, builds
    the hall once) and thrown away when it closes (`onLeaveScreen`, and
    `onRoomClocksReset` when the room leaves the game); the canvas moves into
    whichever screen shows the lane. Pixel ratio ≤ 2, smaller shadow maps and
    lathe on small screens, the loop runs only while something moves (a
    throw, the setter, the camera easing, a drag) and a hidden page plays a
    ball out at once. No WebGL, or three.js not loaded (offline the first
    time): a message over the lane (with "try again"); in a room that phone
    gets a "roll a plain ball" button so the game never waits on it. The
    context lost by the GPU rebuilds the lane; the loss we cause when
    disposing is ignored (see *Traps*).
  - **The hall**: the lane, deck, approach with dots, arrows, foul line, metal
    gutters, caps, kickbacks, the pit, four lanes beside it with their pins
    (one `InstancedMesh`), the masking unit (no words), light strips, overhead
    screens, a ball return with two house balls, blob shadows under the pins
    (the sun's shadows only cover the lane near the camera), PMREM reflections,
    ACES, soft shadows.
  - **A ball**: `bowlGfxThrow(standing, shot)` plays the sim in real time and
    resolves when the pins settle; the camera rides behind the ball and holds
    on the pins. `bowlGfxSet(next, { fresh, hold })` is the pinsetter: the
    sweep bar drops, the deck comes down and lifts what still stands, the bar
    sweeps the fallen pins into the pit, the rack (the lifted pins on their
    spots, or a new ten) is set down, then the camera comes home while the
    ball rolls back from the return. Sounds are made on the app's audio
    context (`bowlRumbleStart` a rolling rumble following the ball's speed, a
    hollower one in the gutter; `bowlSound('crash' | 'clack' | 'sweep' |
    'return')`), the strike: the deck lights flare, `tada`, confetti, the word
    in gold with pins flying out of it; the spare `ding`; a gutter the duels'
    sigh.
  - **The swing** (`bowlSwingShot`, a pure function of the finger's path;
    `bowlShotFrom`, `bowlSwingBall`): every point the finger passes
    (coalesced pointer events, each with its place on the screen and on the
    lane) is kept. The ball follows the finger across the approach
    (`bowlSwingSpot`: ray-cast onto the lane, up to `BOWL_BACK_MAX` 1.6 m
    behind the line and `BOWL_BALL_X_MAX` across); the farthest point back
    starts the forward swing. **The line is the backswing's**: a least-squares
    fit on the lane through the steady pull back that ended there (a sideways
    slide first isn't part of it, nor the top 15% where the finger turns),
    once it is `BOWL_PULL_MIN` 0.2 m long; with less, the push's own fit. On
    the way forward the ball is kept on that line (`tr.back`), so it crosses
    the foul line exactly where the guide starts and the guide holds still.
    The speed is the push's last 120 ms in screen heights a second, times 0.75
    to 1.25 by the backswing (how far back from where it was picked up, up to
    a sixth of the screen); the spin is the push's bow off its chord **on the
    screen** (on the lane perspective flattens the far half to nothing), with
    a dead zone (`BOWL_HOOK_DEAD`) so a nearly straight thumb throws straight;
    middle to the left of the chord hooks right. The throw is still the same
    four numbers, so rooms and replays are untouched; only your own ball
    starts from your hand (`g.release`, carried to the line in
    `BOWL_RELEASE_S`). `rules.mjs` pins it: an arcing push leaves the line
    where the backswing set it at every step and hooks; a slide across first
    doesn't aim; a slanted backswing aims along its slant. `touch-action: none` only while it is your throw
    (`.bowl-canvas.is-live`).
  - **Solo** (`appState.bowling`, `soloRegister('bowling')`): a ball's result
    is written and saved *before* it is shown (a reload can't take a bad ball
    back); the sheet shows the card from before the ball until the pins have
    fallen. Bests `soloRecord('bowling', '5' | '10', { score })`; the end is
    the solo result sheet (the score, strikes and spares, a new best) and a
    card over the lane (again / options). Reload mid-game comes back to the
    rack.
  - **A room** (`ROOM_GAMES.bowling`, `TV_GAMES.bowling`): every screen replays
    `shared.last` from its `before`, a ball behind the server - the sheet, the
    list and the overhead screen move on when the pins have fallen
    (`bowlRoom.cardsAt[throwSeq]`). The thrower's own phone plays the ball as
    the finger lifts and waits for the server's word; if the clock or the host
    threw for it a moment before, that ball is shown instead. Two balls
    behind, or a reload, or a late join: the lane just shows where the game
    is. The result screen waits for the last ball to be seen
    (`bowlRoomOver`). Host "play for" after 40 s from `readyAt`, or at once
    for a phone that's gone.
  - **Layout** (section 28 of `Style.html`): the lane gets the screen. A
    phone upright: the lane is the play area's height, everyone's sheet under
    it; on its side and from 900 px: the lane beside a narrow column (names
    and totals only on a phone's side); the TV: the lane big, every sheet
    beside it. The sheet over the lane is light on dark at every theme (it
    sits on the hall) and left to right in every language, like a real card.

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
