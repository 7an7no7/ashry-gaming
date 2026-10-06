# الليزر / Laser (id `laser`) - not built yet

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
