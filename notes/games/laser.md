# الليزر / Laser (id `laser`)

The owner's idea of 6 Oct 2026, from a Roblox clip (a six-sided cage seen from
above, its floor falling away): everyone hides and aims in secret, then all
appear at once and fire; whoever stands in someone's line is out; the last one
standing wins. Our own touch: lasers in a neon arena, the reveal on the TV,
teams.

## The owner's rules (answered 6 Oct 2026, one question at a time)

- **A round:** (1) **hiding**: on their own phone each player sees only the empty
  arena, taps a spot to stand and drags to aim; (2) **the reveal**: everyone
  appears where they stood, facing their aim, and when the phase ends **all
  lasers fire at once**; a beam goes **through every player in its line** (it
  does not stop at the first). Two players aiming at each other both go out.
- **Where and how:** stand anywhere on the arena, aim at any angle (360°); a beam
  is a thin line and hits whoever's body circle it touches.
- **Nothing is seen while hiding**: not the others' spots, not last round's.
  Spots and aims are server secrets until the reveal.
- **The clock:** 15 s of hiding, or less once everyone has pressed ready. A
  player who chose nothing stays where they were with their last aim (round 1:
  a random spot and aim).
- **The arena shrinks every round**: its outer ring falls away, so there is less
  room each time and the game always ends.
- **A tie at the end** (the last two or more all out in one round): only they
  play again, on a small arena, until one is left.
- **The look:** lasers (a sci-fi neon arena; someone hit fizzles out). The look
  itself is picked from a design sheet of three.
- **Ways to play:** rooms (each phone hides and aims; the TV, or every phone,
  shows the reveal) and **teams**. No computer players, no one-phone way.
- **Teams:** the host picks 2-4 teams and players are dealt in at random (with a
  shuffle); a beam **passes through teammates safely**; the last team with
  anyone standing wins.
- **At least 3 players.**

## The look

The looks sheet (6 Oct 2026): https://claude.ai/artifact/J2oFSGWpBjLbDbQdaDtZ3W (source `notes/archive/sheets/laser-looks-sheet.html`): أ الحلبة من فوق (my pick), ب الرادار, ج مسرح الروبوتات. **The owner picked أ «الحلبة من فوق» (6 Oct 2026).**

## How it is built (6 Oct 2026)

- **Files** (`games/laser/`): `Laser.js` the geometry both sides use (`LASER_BODY` 0.075, `laserK` the
  arena's size by round: 1, then 0.1 smaller a round down to 0.35, `laserClamp`, `laserAngle`,
  `laserHits`, `laserToWall`; in `SHARED_LISTS`, the `laser` chunk and the server's `FILES`);
  `RoomLaser.js` the rules (`ROOM_RULES.laser`, `PROGRAM_TEAMS.laser`); `JS_RoomLaser.html` the
  phone and TV screens and the canvas (its styles are `LASER_CSS`, put in the page when its chunk
  runs: none in the shell); `laser.text.js` the words and Help. The icon is drawn (`art:laser`).
- **The arena** is a flat-topped hexagon of circumradius k, middle at 0,0, players circles of
  LASER_BODY. Phases: `teams` (only with teams: the deal shown, the host's 🔀 and «يلا نبدأ»,
  `requireMoveOn`), `hide` (15 s, `endsAt`), `reveal` (7 s from `revealAt`), `gameover`.
- **Secrets**: a spot is `room.secrets[pid] = { x, y, a, ready, round }`; `place` and `ready` carry
  the round. Who is ready is a secret too (nothing is seen while hiding). A spot not moved stays from
  the last round, pulled inside the smaller arena; round one deals a random spot and aim.
- **The reveal**: `shared.shots` (everyone standing), `shared.hit`, `k` and `kNext` (the next
  round's arena; the same when this round ends the game), `tieNext`. Every phone and the TV play the
  same 7 s from `revealAt` on the server's clock (`roomServerNow`): pop in 0.5 s, charge 1.8, all
  fire 2.4 (flash, a zap), the hit fizzle 3.2, the ring falls 4.3-5.6. Motion off draws the end.
  The host (or anyone with the host away) has «التالي» to skip it.
- **After it**: the hit go out (`outRound`); one left (or one team) ends the game; nobody left is a
  tie: everyone who was standing plays on (`shared.tie`), the arena smaller.
- **The board**: score = the round you went out in, the winners one past the last round; in teams
  each player has their team's best. `PROGRAM_TEAMS.laser` places the teams for the night.
- **The phone view zooms in** as the arena shrinks (up to 1.6×, `lsrFrame`), so a small arena is
  still easy to touch; within a round it holds, so the shrink is seen in the reveal.
- **Leaving** mid-round: dropped from who is standing, the ready check runs again, the game ends if
  one is left; during the reveal it plays out and its end counts who is still here.
- **Tests**: `leaks.mjs` (a spot only on its own phone while hiding, no shots before the reveal; a
  driver with a three-way tie, the clock ending a round, and teams sparing a teammate),
  `play-all.mjs --only=laser` (26 checks), `test:ui` deals it to five phones and a TV.
- A test game of 5 random robot players took 10 rounds (about 4 minutes): the arena stops shrinking
  after round 7.

## Round two (22 ideas): answered (the owner, 6 Oct 2026); built and live 6 Oct except pickups (6), pillars (7), maps (8), falling pieces (9) and the best shot's replay (16), which wait for a design sheet

The owner took all 22 ideas, and my recommendation for every rule of the pickups.

**The lobby**
- Three presets and every switch under «خيارات أكتر»: «كلاسيك» (the defaults below), «فوضى» (pickups, bouncing, pillars, the ghosts' swap and the falling pieces on), «طويلة» (2 hearts, 20 s).

**Two people on one spot** (the game today, kept): allowed; nothing happens, they stand overlapped and a beam through them hits both.

**Ghosts (1)** - a switch, on by default
- Whoever is out drops one hidden mine a round (blind: positions are still secret). Standing on a mine at the reveal is a hit.
- A second switch, «تبديل الأماكن», off by default. Off: the mine counts as a ⚡ hit for the ghost (awards, tie-breaks) and the ghost stays out. On: the ghost comes back next round with one heart and the victim becomes a ghost.
- The mines are shown at the reveal, then cleared; new ones next round.
- In teams a mine spares the ghost's own team (no friendly fire anywhere).
- A ghost can't take a pickup but may put its mine on one (a trap).

**The shield (2)** - always on
- Once a game each player may raise a shield instead of firing: it blocks every beam that round; they don't fire. Chosen while hiding, hidden until the reveal.

**Bouncing beams (3)** - a switch, off by default: a beam bounces off the arena wall once.

**Hearts (4)** - 1 / 2 / 3, default 1
- A round costs at most one heart, however many beams hit. A ghost back by a swap has one heart. The 🛡️ saves a heart.

**Piercing or blocking (5)** - a switch, piercing by default (the owner's rule); the other way a beam stops at the first person it hits.

**Pickups (6)** - a switch, on by default; my recommendations, all taken
- One shared map: everyone sees the same pickups in the same places, on every phone and the TV, from the start of hiding. A random place each time, never the player's own, never in the ring that falls this round nor right by the wall.
- From round 2: one a round, two with 6+ players.
- Taken by standing on it at the reveal (the body touches it, as a beam must) and **only if you survive that round**; hit on it, you are out and it is gone. It is bait: everyone knows someone may stand there.
- Kept, and used by pressing «استخدمها» while hiding in any later round; one held at a time, a new one replaces the old. Lost when you go out. Everyone sees who holds what (beside the name on the TV and the phones); whether it is used this round is secret until the reveal.
- Two or more on one pickup: nobody gets it, it breaks with a spark («اتخانقوا عليه!»), teammates too.
- Nobody takes it: it goes at the round's end and a new one appears elsewhere. A beam crossing it does nothing.
- The powers: ⚡ double beam (forward and back), 🔄 a second beam at its own aim (drag twice), 🛡️ one extra shield (the shield's rules: block, don't fire), 🎯 a beam twice as wide for one round.
- Can't pass one to a teammate. A tie that plays on keeps them. A held one is safe from the shrink; one on the floor in the falling ring falls with it.
- The TV: a taken pickup flies to its new owner's name (`flyEmoji`), a hit holder's fizzles, a shared one sparks.

**Pillars (7)** - a switch, off by default: 1-3 (more with more players) at random places each game, seen by all; they stop beams; nobody stands in one; a pillar in the falling ring falls with it.

**Maps (8)** - random each game: the hexagon, a circle, a ring with a hole («دونات»), a cross.

**Shrinking (9)** - a switch, the ring by default; the other way random tiles fall each round, cracking one round before they fall so they are seen coming; a spot on a fallen tile is moved to the nearest floor.

**Sudden death (10)** - always on: two rounds in a row with nobody hit and the arena shrinks a step below today's floor every round until someone is hit; the TV says «موت مفاجئ!».

**Hiding time (11, 13)** - the host picks 10 / 15 / 20 s (default 15), one second less each round, never under 8 s.

**The reveal (12)** - 4 s when nobody is hit, 7 s with hits.

**Hits (14)** - each player's ⚡ count is on the board; places stay by survival, and among those out in the same round more hits ranks higher.

**Awards (15)** - all four: «القناص» (most hits), «الشبح» (longest without hitting anyone), «نجا بأعجوبة» (a beam passed closest without hitting), «ضرب وخرج» (hit someone in the round they went out). With the podium (`renderPodium`, `afterReveal`).

**Always on, no rule to ask** - (16) the best shot (the beam that took out the most) replayed slowly at the end; (17) who shot whom on the TV after each round («أحمد ⚡ منى»); (18) «مين ضربك؟»: the beam that got you, drawn on your phone with its shooter's name; (19) sounds: the charge's rising hum, beeps in the last 5 s, a buzz when hit; (20) fine aim: ⟲ ⟳ buttons and the beam's line drawn to the wall; (21) the ready button grows in the last 5 s, with a buzz.

**Teams see teammates (22)** - a switch, on by default: your teammates' spots and aims show on your phone while hiding (never the other side's).

**Needs a design sheet of three before building**: the pickups, mines and pillars on the arena; the maps; the falling pieces; the awards' podium and the best shot's replay.

## How round two is built (6 Oct 2026)

- **Options** (`laserOptsOf` in `RoomLaser.js`, the lobby's `LASER_DEFAULTS` / `LASER_PRESETS` in `JS_RoomLaser.html`): `teams, hearts, time, ghosts, swap, bounce, block, sight`, in `shared.opts`. The lobby shows the presets and the teams, and folds the rest under its own «خيارات أكتر» (`lobbyUnfolded`, a `details` keyed `laser-more`). A preset is lit when every field it sets matches; teams and team sight are outside the presets.
- **Beams are the server's** (`laserTrace` in `Laser.js`): each beam is `segs` (one, or two with a bounce off the wall, reflected on that wall's normal), its `hits`, and the closest miss per player (`near`, for «نجا بأعجوبة»). A shield fires nothing and ends any beam that reaches it; a teammate is passed and blocks nothing; a beam never hits its own shooter, bounced or not (my call); `block` ends a beam at the first person. `shared.beams` is what every screen draws; while hiding a phone draws its own aim with the same function (the bounce included).
- **Hearts**: `shared.hearts`; a round costs at most one heart (`shared.hit` is everyone hit, `shared.out` whoever that leaves at 0). A tie (everyone left out together) plays on with one heart each.
- **The shield**: `shield { round, on }` while hiding, once a game (`shared.shieldUsed`, spent at the reveal). It blocks beams, not mines (my call: you stood on the mine).
- **Ghosts**: whoever is out and still in the room, with ghosts on, has `secrets[pid] = { ghost, mine }`; `mine { round, x, y }` (x null takes it back). Ghosts never hold the round up: the reveal comes when everyone standing is ready (my call: phones that are out are often put down). A mine catches anyone standing whose body covers it, not the ghost's team. With the swap, a ghost whose mine takes someone's last heart stands again next round with one heart, at a random spot (`shared.back`); a mine that only takes a heart doesn't bring it back (my call).
- **Kills**: `shared.roundKills` `[{ r, from, to, by: 'beam' | 'mine' }]` at the reveal, added to `shared.kills` and `shared.hitsBy` after it; `lastKills` / `lastBeams` keep the last round's for the TV's «مين ضرب مين» and the out phone's «ضربك:» (its killing beam drawn faintly, clipped to the arena).
- **The arena** is `shared.k`, carried round to round (no longer `laserK(round)`): smaller each round to `LASER_K_MIN`; then two rounds in a row with nobody hit (`shared.quiet`) shrink it by `LASER_K_SUDDEN_STEP` every round down to `LASER_K_SUDDEN_MIN` (0.17) until someone is hit (`suddenNext`, the caption «موت مفاجئ!»). The phone zooms in further below the floor.
- **Time**: `shared.hideMs` = the host's 10/15/20 s less a second a round, never under 8; the reveal is `revealMs` 7 s with a hit, 4 s without (`LSR_T_QUIET` on the phones).
- **The board**: places by survival as before; each row's `tie` is its hits, so `boardRowKey` ranks more hits first among those out in the same round. `shared.awards` (`laserAwards`): sniper (most hits), ghost «الشبح» (best place among those with no hits), close (smallest `near`), both (hit someone in the round they went out); the end screen lists them under the podium.
- **Team sight**: with teams and `sight`, every standing player's slice carries `mates` (their standing teammates' spots, aims and shields), rebuilt on every `place`, `shield`, leave and new round (`laserShareMates`); drawn faint on the phone.
- **The phone**: ⟲ ⟳ turn the aim 3°, the shield button between them; the ready button grows in the last five seconds with a beep a second (the TV beeps too) and one buzz at 5; the charge hums as it rises; a phone that is hit buzzes hard.
- **Tests**: `rules.mjs` (the geometry, defaults, hearts, shield, ghosts and swap, team mines, sudden death, the hiding time, the short reveal, hits and awards), `leaks.mjs` (8 probes: also mines, mates, shields and no beams while hiding), `play-all.mjs --only=laser` (48 checks).

## Round two's looks sheet (6 Oct 2026)

https://claude.ai/artifact/UmuQcbh8YWUmBrCXy6FcXx (source `notes/archive/sheets/laser-round2-sheet.html`, built from the game's own drawing code): 1 the things on the arena (أ كبسولات نيون, ب هولوجرام, ج مرسوم على الأرض), 2 how a map is announced (أ الخريطة بترسم نفسها, ب عجلة الخرايط, ج بتنزل من فوق), 3 the falling floor (أ تشقق وبعدين يقع, ب بيرمش, ج شريط تحذير), 4 the end (أ إعادة بطيئة قبل المنصة, ب بلاطات الجوايز, ج المنصة على الحلبة); my pick أ in each. Part 5: 14 UI/UX ideas, before and after (my picks 1, 2, 3, 5, 6, 8, 9, 11, 12). Waiting for the owner's picks.

## The owner's picks from round two's sheet (6 Oct 2026)

- 1 أ «كبسولات نيون» (the pickups, pillars and mines); 2 أ «الخريطة بترسم نفسها»; 3 أ «تشقق وبعدين يقع», **with better cracks** (the owner: the red glowing lines looked like weird lines); 4 أ «إعادة بطيئة قبل المنصة».
- Part 5: **all 14** UI/UX ideas.
- **الدونات's hole stops a laser**: its edge is a wall (a beam ends there, or bounces off it with bouncing on); nobody stands in it.
- **The falling floor drops about the ring's worth** each round: as much floor as the shrinking ring would have taken, in random tiles.

## How the sheet's picks are built (6 Oct 2026)

- **Maps** (`Laser.js`): `shared.map` is one of `LASER_MAPS` at random each game (a test may name one in the start payload; the lobby never does). `laserDims` (circle R 0.93k; donut 0.95k with a hole of 0.34k; cross arms of half-width 0.34k reaching 0.95k), `laserInside`, `laserClampMap`, `laserWallHit` (polygons with each edge's normal turned toward the ray, the circle's exit, the hole's entry; pillars as circles a beam stops at). Sudden death's floor is per map (`LASER_K_SUDDEN_MIN_OF`: the donut 0.3, the cross 0.26, so a body still fits). Round one's clock starts after the 2 s the map takes to draw itself (`introUntil`, `LASER_INTRO_MS`); touches wait for it.
- **Pillars** (switch, off): 1 / 2 with 5+ / 3 with 8+, placed once a game apart and off the wall (`laserPlacePillars`); `laserFit` moves a spot out of one; a beam stops at one, bouncing or not; a pillar on floor that fell (the ring or a tile) goes.
- **The falling floor** (switch, off): the map's tiles are flat-topped hexagons of `LASER_TILE` 0.2 (`laserTiles`, the same on every phone); each round's hiding cracks about the ring's worth (`laserCrack`: the standing tiles above `tiles × laserK(round+1)²`), two more in sudden death, never the last three; they fall at the end of the reveal (`falling`, then `fallen`); a spot on a fallen tile moves onto the nearest standing one (`laserFit`). The arena keeps its size; a beam flies over a hole (my call: a hole is not a wall, unlike the donut's).
- **Pickups** (switch, on): `shared.pickups` from round two (one, two with 6+), off the next ring, the cracked tiles and the pillars (`laserSpawnPickups`); at the reveal `fates` (left / taken / broken / lost, `LASER_PICK_REACH`); `shared.held` is public (the TV shows it by the name); `use { round, on }` is a secret until the reveal, as is the second beam's aim (`a2` in `place`). A used pickup becomes the shot's `rays` (double: a+180; second: a2; wide: a ray hitting within twice the reach) or its shield (the game's own shield is kept).
- **The best shot**: `room._laserBest` while the game goes on (it holds last spots: nothing is on the table while hiding), `shared.best` at the end; replayed slowly (×¼, 7 s, «تخطّي») on the phones and the TV before the podium when it hit two or more (my call: one hit is not a replay), once a game per screen.
- **The cracks redrawn** (the owner: they looked like weird lines): a red glow from one point of impact with dark fracture lines over it and short branches, the tile's edge pulsing red; the tile trembles in the half second before it falls, then shrinks, turns and drops into a dark hole with dust (`lsrCrackedTile`, `lsrFallingTile`, `lsrHole`).
- **The 14 UI/UX ideas**, each marked `UX n` in `JS_RoomLaser.html`: 1 the hand in round one until the phone touches; 2 drag yourself to move, drag the aim handle to turn (a touch elsewhere still stands you there); 3 «اتضربت!» / «−❤ فاضلك n» / «نجيت!» on your own phone; 4 the time as a line round the arena; 5 the TV's radar, big clock and «بيستخبى…»; 6 a card for a second at each new round (round, how many left, what changed: `shared.lastRound`); 7 ready dims the arena with «جاهز 🔒» and locks it; 8 chips of what the options turn on under the presets; 9 names on small dark pills; 10 hearts as dots over the bodies; 11 who hit whom under the arena on the phones; 12 the full ranking folded under «كل الترتيب»; 13 whoever watches sees who is hiding (and the radar); 14 the wall flashes (and the phone buzzes) where a spot was pulled back in.
- **Drawing**: `laserDraw` takes the map, pillars, tiles, pickups and their fates; the floor's small hexagons are drawn once per size and kept (`lsrFloorTiles`); a hiding screen repaints at most 30 times a second while something moves, else at the clock's pace.
- **Tests**: `rules.mjs` (the maps, pillars, pickups and each power, the falling floor, the best shot), `leaks.mjs` (9 probes: a pickup used and a second aim stay secret; a circle game with pillars, the falling floor and team sight).

