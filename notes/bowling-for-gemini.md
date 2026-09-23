# بولينج — what GEMINI.md should gain

Written by the agent that built it (23 Sep 2026), for whoever merges it into
GEMINI.md. Three places: *The owner's specs, as built*, a section of its own
beside *لودو* / *المشنقة*, and *The log* (plus a line in *Traps*, and the
file lists in *Publishing* and the rooms *Files* table).

## The owner's specs, as built

- **بولينج (Bowling)** - the owner's spec of 23 Sep 2026, asked one at a time;
  look أ «صالة» from the lead's 3D prototype (*بولينج*):
  - **Solo (best score kept on the phone) and a room with the TV.** No
    one-phone pass-around, **no computer players**.
  - **5 or 10 frames, 5 by default**; real ten-pin scoring (strikes and spares
    carry; the last frame's bonus balls).
  - **Swipe the ball**: the direction aims, the swipe's speed is the ball's
    speed, **a curve in the swipe hooks it**; where the finger starts is where
    the ball is let go along the foul line.
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

## بولينج (a section of its own)

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
  when the ball rolls out (`HOOK_MAX`). The ball always carries on into the pit
  once it has hit (it used to stall among the lying pins). `hopAt`/`hopV` are
  for the page only (a pin hit hard is lifted into the air for a moment).
  The score sheet: `bowlScore`, `bowlFrameNext`, `bowlMarks` (X / - …),
  `bowlBallKind`, and a card: `bowlNewCard`, `bowlApply` (one ball onto it,
  and the rack for the next), `bowlTotal`. `bowlGentleShot` is the clock's
  ball. Tuned: a ball into the 1-3 pocket strikes more often than not; every
  throw settles within about 1.5 s of the first hit (the longest in the tests
  4.3 s from the release).
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
  - **The swipe** (`bowlShotFrom`): the start's screen x on the foul line is
    the release; the aim is the direction the finger drew *on the lane* (both
    ends ray-cast onto the lane, so perspective is the finger's own); the
    speed is the last 120 ms in screen heights a second; the spin how far the
    middle of the swipe bows off the straight line (middle to the left of the
    chord hooks right). `touch-action: none` only while it is your throw
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

## The log

- **23 Sep 2026, بولينج** - the owner's rules asked one at a time, the look
  from the approved 3D prototype; real 3D with three.js: `Bowling.js`
  (improved: belly circles, lying pins spinning, the hook rolling out, the
  ball never stalling, faster settling), `RoomBowling.js`, `JS_Bowling.html`,
  section 28. Rules tests: the sheet (300, 150s, open frames, marks), the
  shot clamping, 120 shots replayed across two copies of the rules to the
  same pins, a stepped replay equal to the server's throw, the pocket strike
  rate, settling, and the room (turns, stale taps, the clock's and the host's
  gentle ball, leaving, the end, play again). The leak check plays it; a
  robot round in `play-all.mjs`.

## Traps

- **`forceContextLoss()` fires `webglcontextlost` on the canvas being
  disposed.** The lane listened for a lost context to mark 3D as unavailable;
  leaving a bowling screen disposed the renderer, the event arrived a moment
  later and marked the *next* lane (already built) as "this device can't draw
  3D". The listener now ignores any canvas but the one in use, and dispose
  forgets the canvas before losing its context.
- **Headless Chrome with SwiftShader draws a frame in 100 ms or more**, so a
  throw looks slow and screenshots taken on a wall clock miss the moment. To
  look at the crash or the setter, replace the loop (`bowlGfxFrame = () =>
  {}`) and step `bowlGfxUpdate(1/60)` yourself, then render.
