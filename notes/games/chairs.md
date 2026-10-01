# الكراسي الموسيقية (id `chairs`)

Moved from GEMINI.md on 30 Sep 2026. GEMINI.md keeps the rules that apply to every game and an index; this file keeps the detail, word for word.

## From GEMINI.md: The owner's specs, as built

- **الكراسي الموسيقية (Musical chairs)** - the owner's idea of 27 Sep 2026
  ("each phone in a room, fastest to click sit when the music is off"),
  every rule picked from a list (*الكراسي الموسيقية*):
  - **Rooms and the TV only, 3 to 12 players; latecomers watch** until the
    next game. **Chairs = players − 1, one out a round** until one is left.
  - **The music plays on the TV, or the host's phone when there is none;
    every phone buzzes and flashes at the stop.** An Egyptian beat made with
    Web Audio (maqsum on a darbuka, a riff in hijaz), **its tempo climbing**.
  - **A false start** (a tap while the music plays) **puts that player out at
    once**, and the round ends.
  - **Fake stops: a lobby switch, off by default** («وقفات خداعية»): the
    music pauses for a moment and goes on; a tap in the pause is a false start.
  - **The music plays a random 5-20 s**, no choice.
  - **No tap within 3 s of the stop = last, so out**; no host button needed.
  - **Scoring: a wins tally across play again, and the places at the end**
    (the winner, then the last out first).
  - **Home: the party section, a drawn chair icon** (`art:chairs`).
  - **Look أ «الصالة»** from a design sheet of three
    (https://claude.ai/artifact/LsYSF3NPhCppEe3b6b3Zvm): the arcade violet
    ground, wooden chairs on a pale rug, round avatars with initials, the
    amber «اقعد!». The owner added mid-build: **animations everywhere in it**.
  - Decided here (open to change, each one place in the code):
    - **The stop moment is a server secret** (`room._chairs`, like the bomb's
      fuse), and so are the fake pauses until they come.
    - **Fair on the network**: a tap carries `at`, the phone's stamp of the
      server's time (`serverNow` / `receivedAt`, the chess clocks' gap), and
      the server keeps it only inside the window it can prove - not before the
      stop, not after the arrival; a stamp outside it counts as its arrival
      (`CHAIRS_GRACE_MS` of drift allowed). So a slow connection loses no
      chair and a phone can't claim a time it never saw. No stamp counts
      under `CHAIRS_MIN_REACT_MS` (120 ms) after the stop - `stopAt` is on
      every phone, so a changed page sent it and always sat first - and taps
      held to that floor go by arrival (the audit of 1 Oct 2026).
    - **The board is the roster's**: the wins tally for the people dealt in
      (a phone that joined to watch isn't on it), level wins told apart by the
      last game's places (`tie`, `boardRowKey`). So the night and the program
      rank one game by the order out (5 / 3 / 2 / 1), not everyone after the
      winner tied for second.
    - **The next round starts by itself 5.5 s after the result**
      (`CHAIRS_BETWEEN_MS`); the host can start it sooner. The game flows
      like the real one, and there is nothing to read on the result.
    - A win counts only against somebody (a game where everyone else left is
      nobody's: `s.left`); a player who leaves is out of the ring; fewer than
      two ends the game. Leaving while the chairs are being taken makes the
      leaver that round's one out («ساب الغرفة», `why: 'left'`), so nobody
      else loses a chair for it (the audit of 28 Sep 2026).
    - Someone who is out gets the audience bar and watches the ring.

### الكراسي الموسيقية

The owner's rules are in *The owner's specs*. Game id `chairs` everywhere
(`room-chairs`, `ROOM_GAMES.chairs`, `TV_GAMES.chairs`, the catalog, the
help); the rules are named `chairs` / `CHAIRS_`, the page's code `mch` / `MCH_`.

- **`RoomChairs.js`**: `shared` holds `settings { fake }`, `roster` (the
  first twelve people), `alive`, `outOrder`, `order` (the avatars' order
  round the ring, drawn each round), `round`, `chairs`, `phase` ('music' |
  'sit' | 'result' | 'gameover'), `startAt`, `pause { at, until }` (a fake
  pause, only while it lasts), `stopAt` (once stopped), `sits` ([{ id, name,
  ms }], ms null for no tap), `loserId` / `loserName` / `why` ('last' |
  'late' | 'early'), `nextAt`, `winnerId`, `places`, `wins`, `board` (the
  wins tally). `room._chairs = { stopAt, fakes, fakeAt }`, never projected.
  Moves: `start` / `playAgain { fake }` (the host), `sit { round, at }` (a
  stale round is dropped; while the music plays it is a false start),
  `nextRound` (the host). The clock (`chairsDeadline` / `chairsTimeout`)
  wakes for a fake pause's start and end, the stop, the window's close and
  the next round.
- **`JS_RoomChairs.html`** (section 50 of `Style.html`): `mchRingHtml` draws
  the ring - the rug, the chairs at 31% of the square, the avatars orbiting
  at 43% while the music plays (`.mch-orbit`, a Web Animation whose
  `playbackRate` follows the tempo and is 0 in a fake pause; each avatar
  counter-rotated to stay upright), on their chairs in tap order or standing
  between the chairs' angles once it stopped, the loser greyed and walking
  off (`is-walking`, once per round through `motionFirst`). The avatars
  that moved hop from where they were (`mchFlip`: rects measured before the
  redraw, and every paint tick during the music, so the hop starts from the
  orbit). The middle is the equalizer (bars on Web Animations), «وقفت!» with
  the draining 3-second bar, the result line with the countdown, or the
  winner. The button is one element: grey «استنى…» while the music plays
  (a tap is a real false start), amber «اقعد!» popping in at the stop,
  locked as soon as it is tapped (`mch.pressed`). `mchTapAt` is the stamp
  (`Date.now() − mch.gap`, the smallest `receivedAt − serverNow` seen). The
  music (`mchMusicSync`: a lookahead scheduler on `fxTone` / `fxNoise`,
  `MCH_MAQSUM` and `MCH_RIFF`, the tempo from `mchTempo`) plays only on
  the voice (`mchIsVoice`: the TV, else the host's phone); the stop's
  scratch, a note per seat taken, the out and the win sounds are the
  voice's too; every phone buzzes and the rug flashes at the stop
  (`mchOnce` keys, whatever the motion setting). The TV frame is the ring as
  tall as the stage beside the order (or who is in the ring while the music
  plays, and the places and the wins at the end).
- Tests: `rules.mjs` ("Musical chairs", 31 checks: the secret stop, the
  window, the stamps' clamp, a false start, no tap, the places and the wins,
  leaving, the 13th watching, the fake pauses), `leaks.mjs` (the stop moment
  and the fakes never reach a phone), `play-all.mjs` (`--only=chairs`: a
  false start, taps ranked by their stamps, a quiet phone, the end, play
  again with a latecomer, a leave).

## History

The day-by-day log of the work on this game is in `notes/log.md` (search it for the game's name); a new entry goes there, and anything that changes how the game works goes in this file.
