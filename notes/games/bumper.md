# عربيات التصادم (id `bumper`) and the TV as the console

Moved from GEMINI.md on 30 Sep 2026. GEMINI.md keeps the rules that apply to every game and an index; this file keeps the detail, word for word.

## From GEMINI.md: The owner's specs, as built

- **عربيات التصادم, the full game** - the owner's answers of 28 Sep 2026
  after the test ("improve the UI and the play style, ask what you need"):
  - **Three ways to play, the host's choice in the lobby** (the owner: "3 modes
    in it we select"): **بالونات** (the default): 3 balloons a car, a knock
    pops one of the knocked car's, **a car with none left drives on as a ghost**
    (bumps and pushes, pops nothing, can't win), the last car with balloons
    wins; **نقط**: the most knocks landed when the clock runs out (the test's
    game); **الحلبة**: a round stage with no rail, push the others off, **both
    endings a lobby choice**: a point a push-off on the clock (the fallen back in
    after 3 s), or the last one on wins.
  - **The 3D fairground rink** on the TV (three.js), with the flat rink where
    3D can't draw.
  - **Computer players, easy and hard.** **No items** (bumping only).
  - **On the phone**: the car's own balloons, score and place big, a **turbo**
    button (every 4 s, a ring shows it filling) and a **horn** button (the car's
    own horn on the TV).
  - **Head-on at about the same speed is a draw** (the owner, 28 Sep 2026,
    asking "if we both hit while facing each other, who gets what?"): both
    cars driving in, within a quarter of each other's speed - a crash and a
    💥, nobody scores or loses a balloon (`bmpTvCollide`). A clearly faster car
    or a hit on the side or from behind scores one, whichever way (no double
    for a side hit, the owner's choice).
  - Decided here (open to change, each in one place): the TV drives the
    computer players (`bmpBotInput`: a target now and then - hard picks the one
    worth hitting and leads it, keeps off the ring's edge and turbos at a close
    target); a car just popped has a second's grace; a push-off counts for
    whoever touched the fallen car last within 2.5 s; Balloons and «آخر واحد»
    end 1.4 s after one car is left, with three minutes as their cap; Balloons
    or the ring alone needs two cars (a computer player makes the second); the
    delay and traffic numbers are behind a small 📶 on the TV; the test wording
    is gone.

- **The TV as the console, the phones as controllers** - the owner's idea of
  28 Sep 2026 ("like Mario Kart, each player controls his car from his phone,
  like PlayStation"). Asked whether it is possible: yes, with the TV running
  the game and the phones sending only their input; the owner said to build a
  test first. **Built as عربيات التصادم** (*عربيات التصادم*), which then
  became a game of its own; a racing game was planned and dropped the same day
  (the owner: bumper cars only, for now). Decided here (open to change):
  - **The TV runs the game** (the physics, the knocks, the score); the server
    only deals the round and takes the TV's scores. A phone's stick goes
    through the room's live channel to the screens only, never stored and
    never to another phone (`relayDrive` in `room.js`).
  - **The phone sends its input about 15 times a second, and only when it
    changes** (a stick held still is resent every 0.8 s), so a table of four
    is 20-60 messages a second. Cloudflare bills 20 WebSocket messages into a
    Durable Object as one request and the free plan gives 100,000 a day:
    measured with four drivers, an hour of play is about 5-7% of a day.
  - **Two controls**: a stick (the car turns toward the finger and goes, faster
    the further out) and tilt (the phone as a wheel, with Gas); tilt can be
    re-centred and flipped, since phones disagree about signs.
  - **The delay shown is half a ping's round trip**, phone → server → TV →
    server → phone, the median of the last seven.

### عربيات التصادم

The owner's rules are in *The owner's specs* (عربيات التصادم, the full game,
and *The TV as the console*). Game id `bumper` everywhere; the page's code is
`bmp` / `BMP_`, the server's `bumper` / `BUMPER_`.

- **The server** (`RoomBumper.js`) deals a round - `roster` (people and the
  computer players seated, `bots` their levels), `colors`, `settings { mode,
  ringWin, secs }`, `startAt` / `endsAt` (the clock, or three minutes for the
  ways that end by themselves) - and takes the TV's result with `finish {
  round, scores: { pid: { score, taken, lives, place } }, done }`: a screen (or
  the host) only; before the clock only with `done` in Balloons and «آخر
  واحد». The places the TV gave order the table (ties share one); the first
  place wins, against somebody. No screen reporting: the server ends it on its
  clock with no result. The board is the round's drivers (`s.roster`), the
  evening's wins first and level wins by this round's places (`tie`,
  `boardRowKey`): the night and the program rank a round by its places. `ROOM_BOT_GAMES.bumper` exists only so the lobby can
  seat computer players; it never moves for them.
- **The channel.** Nothing a car does goes through the rules. A phone sends
  `{ k: 'i', x, y }` (the stick) or `{ k: 'i', s, g }` (the tilt; `g` -100 is
  the brake) with `Room.sendLive`, every 66 ms when it changed and every 0.8 s
  when it didn't, `{ k: 'b' }` (turbo), `{ k: 'hn' }` (horn) and a ping every
  1.5 s. `room.js` asks `bumperRelaying(room)` and passes a player's message to
  every screen stamped with `from`, a screen's to the one phone it names
  (`to`): a ping's echo, a moment (`{ k: 'h', w: 'hit' | 'got' | 'pop' | 'fell' }`)
  and the car's status (`{ k: 's', l, sc, pl, of, gh, out }`, on change and
  every 3 s). Messages over 400 characters are dropped.
- **The TV** keeps the game in `bmp.tv`: the sim in centimetres (a 16 × 9 m
  rink, the ring a 4.4 m disc), cars as circles of 38 with a grip that kills the
  slide faster than the roll, knocks between equal masses, a knock scoring for
  the car that drove in harder (170 units a second or more, once a pair in 0.6
  s), balloons, ghosts, falls and respawns, the computer players' driving
  (`bmpBotInput`), the standings (`bmpTvRank`), the sound, and the result sent
  by the first screen online. With two screens both draw the rink, but only
  that lead screen (`bmpIsLead`) plays the sound and talks to the phones
  (`bmpTvSnd`, `bmpTvSend`); الكراسي الموسيقية's voice (`mchIsVoice`) is the
  same lead screen. `room.js` drops more than 30 controller messages a second
  from one phone (`DRIVE_PER_SEC`). A driver who leaves leaves the round's
  roster, and a driver the TV didn't report goes last in the result. **The view** is `bmp3dView` (three.js through
  `loadThree`: a checker-plate floor and a yellow-and-black rail, or the ring
  over a pit of mats; fairground bulbs, two sweeping coloured lights; cars
  with a rubber skirt, a clear-coated body, a seat, a driver, a pole with a
  spark, balloons tied behind, name tags; sparks and balloon bits; an overlay
  canvas for the countdown and «+1») or `bmpFlatView` (a canvas from above),
  drawn first and replaced by 3D once it loads. Canvas text is set left to
  right (`direction = 'ltr'`), or «+1» reads «1+» in an Arabic page.
- **The phone** (`ROOM_GAMES.bumper`, `bots: { max: 8 }`): the car's status
  (`bmpStatusHtml`, painted from the TV's `s` messages), the stick, turbo and
  horn, the stick / tilt switch; the tilt screen (`#bmp-land`) has the wheel,
  🎯 and ↔, auto gas, gas or brake, turbo and horn. The lobby's options are
  `bmpLobbyHtml` (the way to play, the ring's ending, the length for the clocked
  ways, remembered).
- **The tilt**: the phone's roll read from gravity, the always-sideways screen,
  auto gas - as described in the second round below.
- **The sound** (`bmpSnd`, `bmpEngine`): the TV plays the countdown, the start
  horn, an engine that follows the cars, crashes by how hard, a wall knock, a
  balloon's pop, a fall, turbo, each car's horn (pitched by its colour), a
  chime for a point, the last five seconds (clocked ways) and the end. A phone
  plays its own moments. A TV whose sound is asleep shows «🔊 اضغط هنا عشان
  الصوت».
- **The tilt, second round** (the owner, 28 Sep 2026, after the first test:
  "the stick was more accurate", "force landscape even if it's locked", an
  auto-drive button, and no sound). The steer is the phone's **roll read from
  gravity** (`bmpTiltRead`): the down vector in the phone's own axes from
  beta and gamma, turned into the controller's frame, `atan2` of it - so it
  reads the same however far the phone is leaned back. 28° is full lock, 3°
  dead zone, light smoothing. **The tilt screen is always sideways**
  (`bmpLandLayout`): an iPhone's rotation can't be forced from a page, so the
  controller is a layer over the page, turned a quarter by CSS while the page
  is upright - to the side the phone is really held - and not turned when the
  page is sideways already. Android also asks for fullscreen and
  `screen.orientation.lock('landscape')`. **⚡ Auto gas**: forward until tapped
  off, the big button then the brake.
- Tests: `rules.mjs` ("Bumper cars": the three ways, early ends, places, ties,
  computer players), `leaks.mjs` (a driver; nothing is hidden), `play-all.mjs`
  (`--only=bumper`: the relay on a live server).

**The review of 1 Oct 2026.** No round without a big screen: `start` and `playAgain` are refused unless a screen is online (`room._onlineScreens`, set by `room.js` for the one move; a test or a program's clock without it counts any screen in the room), and the lobby greys Start with «تبدأ لما شاشة العرض تفتح في الغرفة» under it (`ROOM_GAMES.bumper.startBlock`, read by the lobby in `JS_Room.html`). A TV reloaded mid-round picks the round up: the lead screen keeps the cars, scores, balloons and eliminations in `sessionStorage` (`ashryBmpTv`, keyed on `roomDealKey` and the round) every second, and `bmpTvStart` restores them (`bmpTvSave`, `bmpTvRestore`; a 3D car keeps only the balloons it had). With two screens only the lead one (`bmpIsLead`) runs the rink; the other shows «اللعبة شغالة على الشاشة التانية» (and the host's «end now») and takes over, from the start positions, if the lead goes.

## «كورة التصادم» - a fourth way: built 2 Oct 2026 (the owner's answers of 2 Oct 2026)

Picked from the ideas page of 2 Oct 2026 (https://claude.ai/artifact/7Mhgw1ePSi3GhgEvDcSHxz, idea numbers in brackets) and every rule asked.

- **(254) A big ball, two goals, two teams by car colour** - a fourth way in the lobby, inside the same card.
  - **The clock ends it** (2, 3 or 5 minutes, like the other clocked ways; 3 by default); **a draw goes to a golden goal**: the next goal wins, at most one more minute, then a draw.
  - **Everyone picks a side** (red or blue). Uneven sides are allowed; a computer player fills a side only when it is empty (1 v 1 works).
  - **After a goal**: «جوووول!» big on the TV with the scorer's name, cars back to their own halves, the ball to the middle, 3-2-1, play.
  - **Bumps push and score nothing**; only goals score. Turbo as always (every 4 s). No items (the 28 Sep decision stands).

### How it is built (2 Oct 2026)

The look is أ «بث مباشر» from the design sheet of three (the owner's pick): the pitch fills the TV's
stage edge to edge, the score a small broadcast bug at the top (blue | the clock | red), «جوووول!»
a tilted band across the whole screen in the scoring side's colour with the scorer and the new
score, the score number bumping; then the cars back to their halves, the ball to the middle, a big
3-2-1 and «يلا!». The phone: a team band at the top (the side's colour, a shirt with the player's
number, «بتجيب جون في الأزرق ←», the score and the clock) over the same stick / tilt, turbo and
horn; a «جوووول!» toast on every phone at a goal.

- **The server** (`RoomBumper.js`): the way is `settings.mode: 'ball'`, its length `settings.ballSecs`
  (120 / 180 / 300, 180 by default; `BUMPER_BALL_SECS`). `side { side }` is any person's pick, in the
  lobby or between matches (`shared.picks`); `lobbyMode { mode }` is the host's way put on the room so
  every phone's lobby shows the side picker. `bumperBallDeal` deals the sides (`shared.sides`): each
  person's pick, anyone who didn't on the smaller side; an empty side gets the room's first computer
  player the host seated, or the page's own filler (`shared.cpu`, id `cpu-red` / `cpu-blue`, easy, not a
  room player and not on the roster); the room's other computer players sit the way out. The TV sends
  each goal, `goal { round, n, side, by }` - a screen or the host only, `n` the goal's number so a
  resend counts once - and the server keeps `shared.score { red, blue }` and `shared.goals [{ side, by,
  own, name, at }]`. Its clock (`bumperBallDue`): at the whistle (+1.5 s for a goal on its way) the side
  ahead wins; level, `shared.golden` and one more minute (`BUMPER_GOLDEN_MS`), the next goal ending it at
  once (a goal after the whistle that breaks a tie); after the minute, a draw. `endNow` ends it as it
  stands (`shared.cut`, no golden goal). `finish` is ignored for the ball: the score is the server's.
  `bumperBallEnd` writes the rows (each driver's goals, own goals apart), every member of the winning
  side place 1 and the rest 2, a draw all 1; wins go to the winning side's members; latecomers who
  played join the roster; the board through the same `bumperBoard`. The night and the program place
  the match as a team game (`bumperBallTeams`, `PROGRAM_TEAMS.bumper`; 6 Oct 2026): the winning side
  first, the losing side second (3 points, not 1 behind every winner), a draw everyone first; the
  other ways place by the board as before. Someone who joins mid-match is put on the side with
  fewer cars there now, for good (`bumperJoined`, called by `room.js` on a join; `bumperSideOf` /
  `bmpSideOf` work one out the same way for a join the hook didn't see); `bumperPlayerLeft` gives a
  side left empty a filler, and a leaver's side stays written down.
- **The TV** (`JS_RoomBumper.html`, «كورة التصادم» section): `bmpBallInit` / `bmpBallTick` (the
  server's score adopted, the kick-off after a goal, the whistle, the golden goal, the end) /
  `bmpBallLive` (cars drive and the ball can go in only after a 3-2-1, outside a goal's moment, before
  the end) / `bmpBallGoal` / `bmpBallSend` (the goals sent in order, again until the server has them).
  The ball (`bmpBallStep`, `bmpBallHit`): 46 cm across (a car is 38), a car's mass 1 against its 0.55,
  the cars' knock (`bmpTvCollide`) with masses, rolling friction, bouncing off the rails and the posts,
  the side netting and the back of the net taking the pace off; a goal when the whole ball is over the
  line (`BMP_GOAL_HALF` 150 a side of the middle, `BMP_GOAL_D` 120 deep). Blue defends the left goal
  and red the right, and every score reads blue on the left and red on the right in both languages
  (the bug, the band, the banner, the result). Kick-off spots `BMP_SPOTS` (`bmpBallSpot`), numbered in
  each side's order (`bmpBallTeams`, the shirt numbers). Bumps push and score nothing (`bmpTvCollide`
  returns before scoring for the ball); turbo as always; no items. The computer players at the ball:
  `bmpBallBotInput`. A golden goal (or the host's end) ends the match on the server at once; the TV
  holds the pitch until «جوووول!» has had its moment (`bmpBallHold`, decided in `TV_GAMES.bumper.sig`).
  A TV reloaded mid-match keeps the ball, the score, the unsent goals and the moment it was in
  (`bmpTvSave` / `bmpTvRestore`). The views: `bmpPitchPaint` (the turf, the halves' tints, the lines)
  is the 3D pitch's texture and the flat view's floor; 3D adds the rails with gaps, two goals (posts and
  bar in the defending side's colour, nets that shake on a goal) and a rolling football
  (`bmpBallSkin`); the flat view draws the same from above (`bmpBallFlatDraw`, `bmpBallFlatBall`).
  Sounds `kick`, `whistle`, `goal` (the stands' roar and horns).
- **The phone**: `bmpBandHtml` (in place of `bmpStatusHtml`, compact on the tilt screen),
  `bmpBandPaint` (the score in place, so the finger on the stick is never dropped by a rebuild),
  `bmpBallClockText` (⭐ in the golden minute), `bmpBallPhone` (the toast from `shared.goals`; a
  reload or a latecomer plays nothing old), `bmpBallOverHtml` + `bmpBallOverAfter` (the final score
  counting up, the winners' confetti). The lobby: «⚽ كورة» beside the other three ways, the length,
  and `bmpSidesHtml` under the options for everyone (`ROOM_GAMES.bumper.lobbySeats`, a hook the lobby
  draws after the folded options: the sides are where the table is seated, never folded).
- **Its words and styles live in its chunk**: `BMP_TEXT` (read through `bmpX`) and `BMP_BALL_CSS`, put
  into the page once as the chunk runs - the shell was at its budget, and every class is the ball's own,
  so where they land can't change the cascade. Only the help line (`GAME_RULES.bumper`) and the card's
  line (`cat_bumper`) are in the shell.
- Tests: `rules.mjs` (the sides, uneven sides, a goal counted once, own goals, the whistle, the golden
  goal and its minute, a draw, «end now», 1 v 1 with a filler, the room's computer player first, a side
  left empty, a latecomer), `leaks.mjs` (a match with a golden goal), `play-all.mjs` (`--only=bumper`:
  the sides, the TV's goal on every phone, a phone can't score).

Decided here (open to change, each in one place):
- The clock keeps running through a goal's moment and the kick-off (as on television); the golden
  goal's minute starts at the whistle, with no kick-off.
- Someone who doesn't pick a side goes to the smaller side when the match is dealt (red on a tie); a
  latecomer the same, counted among the cars there at the moment they join (`bumperJoined`).
- The filler: the room's first computer player the host seated (its level), else one of the page's
  own, easy (`cpu-red` / `cpu-blue`, named «كمبيوتر»); it isn't on the night's board. A side emptied by
  someone leaving gets one too.
- A goal is credited to the last car that touched the ball; in your own net it is an own goal, the
  other side's point, and counts for nobody's goals.
- The score is the server's (`goal`), so every phone shows it and a screen taking over or reloaded
  starts from it; the TV still judges the goal.
- The night: the winning side's members share first place, the others second; a draw is everyone's
  first (as a board with nobody ahead is everywhere).
- The ball: 46 cm, 0.55 of a car's mass, a goal mouth of 3 m and a net 1.2 m deep, posts that bounce.

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
