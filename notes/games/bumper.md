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

## History

The day-by-day log of the work on this game is in `notes/log.md` (search it for the game's name); a new entry goes there, and anything that changes how the game works goes in this file.
