# السلم والتعبان (id `snakes`)

Moved from GEMINI.md on 30 Sep 2026. GEMINI.md keeps the rules that apply to every game and an index; this file keeps the detail, word for word.

## From GEMINI.md: The owner's specs, as built

- **السلم والتعبان (Snakes & Ladders) and جمجمة (Skull)** - picked by the
  owner from a list of ideas on 28 Sep 2026, every rule answered; to be built
  together and released together. **السلم والتعبان built 28 Sep 2026**
  (*السلم والتعبان*).
  - **السلم والتعبان**: **a room with the TV and against the phone** (you and
    computer players; not one phone passed round); **2-6 players**; **100 needs
    the exact number, too high bounces back** (98 + 5 → 100 → 97); **a 6 rolls
    again** (no penalty for three 6s, no 6 needed to start); **pieces share a
    square**; **the snakes and ladders are placed at random each game**, checked
    to be fair; **play on for places**, a podium; **pure classic**, no special
    squares; a turn clock **off by default, 15 or 30 seconds**; **computer
    players in rooms**, one level (there is no skill in it). **The look: أ
    «كلاسيك بلمستنا»** (the owner, 28 Sep 2026, from a design sheet of three
    full live boards, https://claude.ai/artifact/QcW9eYcizJZAhmBJQ2baT6, after
    sending a photo of a real board as the model): a true 10 × 10 checkerboard
    of mint `#d5f5dc` and teal `#4a9aa2` in a dark teal frame `#17454a`, big
    bold numbers **in the middle of each square**; long thin curving snakes
    with spots or bands in bright colours (orange, violet, sky, red, green,
    yellow, pink, sea-green), outlined in ink, a frontal cartoon face; wooden
    ladders; our touches: **one snake wears a طربوش and a moustache**, a gold
    cup at 100, «ابدأ» on 1, workers in hard hats who build the board. From
    the owner's review of the sheet: **nothing covers a number** (numbers drawn
    above the bodies and ladders with a halo of their square's colour, **a
    snake's head sits at the top corner of its square**, on the side its body
    goes, players stand in the lower half of theirs); snakes and ladders thin
    and not too many (the sheet: 5 of each, a ladder at least two rows, snakes
    that don't cross each other); a ladder climb ends on its top square, never
    off the board.
  - **السلم والتعبان's animations** (the owner, 28 Sep 2026: "not one animation
    for the same thing - maybe 5, happening at random", and "the map alive by
    itself"): **the pieces are little cartoon people** in each player's colour
    (the app's cast, المشنقة's style) whose faces react. **A snake plays one of
    six at random**: the gulp (a bulge down the body, spat out at the tail), the
    slide (down its back like a water slide), the chase (he runs, it catches
    him), the sneeze, the tail flick (a catapult, a bounce on landing), the
    squeeze (carried down, dizzy stars). **A ladder one of five**: rung by
    rung, a sprint, a slip and a catch, the ladder stretching like an elevator,
    a worker's boost. **The map is built in front of everyone at the start of
    every game** (about 5 s, a tap skips it, a few versions at random): the old
    map taken apart on play again (snakes slither off, workers carry the
    ladders away), the squares dropping in with their numbers, workers carrying
    in and hammering each ladder, snakes slithering in and curling up. **The
    board lives on its own**: snakes breathe, flick their tongues, blink, doze
    and yawn, and **watch a piece that comes within 6 squares of their head**;
    grass, butterflies, birds, a shine on the rungs. Also: a near miss past a
    snake's head (it snaps, he wipes his brow), a ladder just missed (he looks
    up sadly), the bounce at 100 off a wall, a cheer for a 6, a trophy dance at
    100. Decided here: **the server picks each variant** so every phone and the
    TV see the same one, never the same twice in a row; each 1.5-3 s, the next
    roll waiting for it; played once (a reload doesn't replay it), still under
    motion off.
  - **السلم والتعبان, decided while building** (open to change, each in one
    place):
    - **A piece starts off the board**, on a wooden mat under the first row,
      and the first roll brings it in (a 4 lands on 4) - the classic way.
    - **The map comes from a seed the server stores** (`g.map.seed`), so every
      phone and the TV draw the very same snakes (their curves, colours and the
      طربوش are seeded too), and a test can make the same map again. Fair means
      a game takes 12 to 36 turns a player on average over 120 simulated games.
    - **Seven snake moves, not six**: the six asked for and the sheet's
      hypnotise; the ladder's five as asked. Each 1-3 seconds
      (`SNAKES_MOVE_MS`), the server picking it and never the last one of its
      kind. A near miss is a snake's head one square either side of where you
      stop; a ladder missed, its foot one square either side.
    - **The next roll waits for the table**: every roll carries how long it
      takes to show (`snakesRollMs`) and the server's `readyAt`; a roll more
      than 0.4 s before it is dropped, the clock counts from it, and the
      computer players roll half a second to a second after it. The building
      (about 5.6 s, 2.6 s more to take the old map apart) counts too: a tap
      skips the building on that device, but the first roll still waits for
      the table.
    - **Who starts is drawn at random**, and the others follow in a random
      order (no roll-off: nobody has a choice in it, and the building already
      takes 5 seconds). A real shuffle (`shuffled`): the first version sorted
      with a random comparator, which let the first in the room start 44% of
      the time with three (the audit of 1 Oct 2026).
    - **Six colours** (red, blue, yellow, green, pink, violet), picked in the
      lobby like لودو's; with seven or more the host picks the six.
    - **One kind of computer player**: one lobby button with no level
      (`bots.one`), stored as `easy`.
    - **Pieces home stand on the top of the frame** over 100, in the order they
      got there, so nothing covers 100 or its cup.
    - A win counts on the night's board only against somebody; a player who
      leaves takes their piece off and the turn passes, one left ends it.
  - **السلم والتعبان, the second round** (the owner, 29 Sep 2026, asked one by
    one; none of it changes a rule or where a piece ends up - looks only).
    **Built 29 Sep 2026** (*السلم والتعبان*, "The second round"):
    - **The board takes all the space it can** without squeezing the rest: on a
      phone upright edge to edge (the page's gutter only); on a phone on its
      side, a laptop and the TV as tall as the play area with no scrolling (it
      was 291 px in a 261 px area sideways, 618 in 589 on a laptop), the
      players, the roll and the log in the column beside it.
    - **Landing on a snake's tail square**, one at random: **the tail tickles
      him** (he giggles and wriggles, the snake grins), **trips him (توقعني)**
      (he falls flat, gets up, dusts himself off), **pushes him a square back**
      (he stomps back to his own), or **curls into a seat** he sits on, then
      hops off.
    - **Landing one square before or after a ladder's foot: the sneak, about
      half the time.** He tiptoes to the ladder and starts up it fast, looking
      round; **the nearest snake crawls over** and pushes him down, or eats him
      and spits him back onto his own square.
    - **Walking past a snake's head** (not stopping on it): the head sits at the
      top edge of its square, so **he ducks and tiptoes under it** (the owner's
      point: more real than jumping), its eyes following him, now and then a
      snap just above him and a flinch; sometimes the snake lowers its head into
      the path and he **jumps over** it instead.
    - **A 1: «بس كده؟»**, one sad little step. **Sixes build up**: the first a
      cheer, the second a bigger one, the third fireworks. **Tension near
      100**: from 95 a drumroll, the snake nearest 100 licks its lips, the cup
      shines.
    - **Two on one square**: a high five, a bump, or a little dance together.
      **Waiting**: the players not up tap a foot, yawn, watch the snakes, sit
      down after a long wait. **The others react** when someone is eaten or
      climbs (a gasp, a laugh, a clap). **The cup giggles** at a bounce off 100.
    - **The board lives**: now and then a snake yawns, stretches or snaps at a
      passing butterfly; a worker walks in, tightens a ladder rung and walks
      off; at a win the snakes sway like a crowd and the ladders glow; **on the
      TV only**, the light slowly turns from day to night over a long game and
      the snakes doze more at night.
    - **Players**: those home sit on the frame by the cup and cheer the rest
      on; a player who leaves a room picks up a little suitcase and walks off
      the board; **a tap on a piece shows whose it is** in a bubble; **faces
      show the mood** (scared near a snake's head, happy by a ladder's foot,
      bored when far behind).
    - Decided while building (open to change, each in one place):
      - **The server picks every moment of a roll** (`snakesRoll`), in a
        fixed order on its random source so one source makes the same roll
        everywhere: each head walked past - **jump three times in ten**
        (`SNAKES_PASS_JUMP`), else a duck, **a snap in three of those**
        (`SNAKES_PASS_SNAP`); a tail square's move (never the last one); the
        sneak (`SNAKES_SNEAK_CHANCE` 0.5) and how it ends, push or eat, half
        and half; the meeting's move; the sixes in a row. Each has its time in
        `snakesRollMs`, so `readyAt` waits for it.
      - **The sneak is the "ladder just missed" case** (`near: 'l'`): a
        snake's head beside the square keeps its near miss, and a tail square
        its tail move, first. **"The nearest snake"** is the one whose head is
        nearest the ladder's foot; its front crawls over and its tail stays
        in its hole, the neck stretching (a cartoon: no snake is too far).
        *Replaced by the owner's review below*: the snake nearest to him, the
        whole snake crawling, the sneak 1 in 3.
      - **Walked past** means a square the walk goes through, the bounce off
        100 included, never the one it stops on (`snakesPathOf`).
      - **Two on one square** is anyone still playing on the square the roll
        ends on (1-99), the first in seat order.
      - **The tension is the roll from 95-99** (`tense`); the cup also shines
        whenever someone stands on 95-99.
      - **A leaver's suitcase walk** is 1.8 s and the next roll waits for it
        (`SNAKES_LEAVE_MS`, `readyAt` in `snakesPlayerLeft`).
      - **The TV's night follows the rolls, not the clock** (`g.rolls`, the
        same on every screen and after a reload): dusk from the 30th roll,
        night at the 140th (`snkNight`), stars on the frame from half way.
      - **The others' reactions** are chosen from the roll's own number and
        the map's seed, so every screen shows the same without the server
        storing them; the moods, the idle moments and the board's life are
        each screen's own.
      - **The moods**: scared with a snake's head 1-6 squares ahead, happy
        with a ladder's foot there (scared first), bored 30 or more behind
        the leader; **sitting down after 25 s** without moving
        (`SNK_SIT_AFTER`), never the one about to roll.
  - **السلم والتعبان, the owner's review of the second round** (29 Sep 2026,
    after playing it). **Built 29 Sep 2026** (*السلم والتعبان*, "The sneak and
    the crawl"):
    - **The sneak: he stops first, then sneaks.** He landed straight on the
      ladder's square as part of his walk, so the table took the ladder's square
      for his real one. Now he lands on his own square and stands there a beat
      (everyone sees where he is), looks round, then tiptoes to the ladder, is
      caught and brought back - all in his own turn. (The other way offered,
      sneaking in the background during the others' turns, was not chosen: it
      would play over their moves.)
    - **The snake that catches him crawls to him and back.** It stretched from
      its place to the ladder, which looked bad: now the whole snake crawls
      along the board to him, catches him (a push or an eat and spit), and
      crawls back to its own place. **It is the snake nearest to him**, not one
      snake for every ladder.
    - **Fun, never annoying** (the owner: "I don't want the animations to be too
      much"): the extras are kept special - the sneak about 1 in 3 (was half),
      the snake-tail moments about half the time (otherwise he just stands),
      ducking under a head quick and small with a snap only now and then, the
      idle waiting moments rarer, every big moment short. The moments that are
      the rules (a snake, a ladder, the win) always play.
    - Decided while building (open to change, each in one place):
      - **The sneak's order**: he stands 0.7 s on his own square with a ring of
        his colour round its edge (`snkMarkSquare`, never over its number), looks
        left and right 0.5 s, tiptoes to the foot 0.4 s and starts up 0.35 s;
        **the snake sets off when he starts to tiptoe** (so the catch comes as
        he climbs, 0.6-0.95 s of crawl by the distance), catches him, and **he
        is back on his square while the snake crawls home** (0.9 s, both at
        once). 3.5 s (push) and 3.8 s (eat) in the server's time
        (`SNAKES_SNEAK_MS`), the animation ending about 0.15 s inside it.
      - **The crawl follows one path, planned never to knot** (`snkCrawlPlan`):
        out from where the head points to beside him - straight on in gentle S
        bends only when he is ahead of its head, otherwise a wide arc (a radius
        of 48-75 units, 0.8-1.25 squares, either way round, tighter only along
        the board's edge) - trying both sides of him and above him, and keeping
        the shortest way whose body never crosses or overlaps itself at any of
        14 moments of the crawl and stays on the board (`snkCrawlKnots`; the
        straight way it replaced tangled in about 4 cases in 10, the owner's
        "hairpin knot"). `npm run check` plans 1,407 sneaks over 150 maps and
        fails on any that tangles. Every point of the body
        follows the head along its own resting body and then that path
        (`snkCrawlAt`), so the tail leaves its hole and the whole snake moves;
        **home it backs along the same path**, which lands it exactly in its own
        shape (checked: the body's outline before and after is the same
        string). Turning round and coming home head first was not built: it
        cannot end in the resting shape without a second trip.
      - **"The snake nearest to him"** is the snake whose head is nearest to the
        square he landed on (`snakesNearestSnake(map, walk)`).
      - **A tail square with no move** (half the time) shows nothing else
        either: no near miss, he just stands.
      - **The frequencies and times**, before → after: the sneak 1/2 → 1/3
        (`SNAKES_SNEAK_CHANCE`); a tail square's move always → 1/2
        (`SNAKES_TAIL_CHANCE`); walking past a head, a jump 3 → 2 in 10
        (`SNAKES_PASS_JUMP`), a snap 30% → 15% of the ducks
        (`SNAKES_PASS_SNAP`, so about 12 in 100 heads passed), a duck
        380 → 200 ms and smaller (no new face, a light squash), a snap
        700 → 450, a jump 420 → 380; the tail's moves tickle 1.5 → 1.2 s, trip
        1.7 → 1.4, push 1.6 → 1.3, seat 1.8 → 1.4; two on one square
        1.1 → 0.9 s; a 1 0.75 → 0.55 s; the drumroll 0.9 → 0.7 s; the sixes
        0.8 / 1.1 / 1.8 → 0.7 / 0.9 / 1.3 s; a near miss and a ladder just
        missed 1.3 → 1.0 s; the sneak 2.7 / 3.0 → 3.5 / 3.8 s (it now includes
        the stand and the crawl home). The waiting pieces' idle moments every
        2.5-6 s → 7-14 s, the board's own moments every 11-23 s → 18-35 s. The
        snake and ladder moves, the bounce, the win and the building are
        unchanged.

### السلم والتعبان

The owner's rules and look are in *The owner's specs* (السلم والتعبان and
جمجمة). Game id `snakes` everywhere (`setup-snakes`, `play-snakes`,
`room-snakes`, `ROOM_GAMES.snakes`, `TV_GAMES.snakes`, the catalog, the help);
the shared and server names are `snakes` / `SNAKES_`, the page's `snk` /
`SNK_`. Built the way لودو is:

- **`Snakes.js`** (shared, no DOM; inlined into the page through
  `SHARED_LISTS`, bundled into the Worker before `RoomGames.js`). The board is
  squares 1-100 boustrophedon from the bottom left, 60 units a square
  (`snakesCellXY`, `snakesRowOf`). **The map is made from a seed**
  (`snakesGenMap(seed)`, the sheet's generator on `snakesRng`, a seeded
  mulberry32): **6 to 8 snakes and 6 to 8 ladders, spread by bands** (the
  owner, 28 Sep 2026, after four games with no snake near 100: "organised
  correctly and fairly", then "at least 6 and at max 8"): each count drawn
  once per map (`SNAKES_COUNT`) and kept, the larger one giving one up only
  after 200 tries in vain - drawing again on every try had left 8 rare (a
  crowded board is harder to fit); measured over 1,500 seeds a third each of 6,
  7 and 8. A snake head in each of `SNAKES_SNAKE_BANDS`' rows - row 10 (91-99),
  row 9 (81-90), rows 7-8, 5-6, 3-4 - and the extras from row 2 up
  (`SNAKES_SNAKE_EXTRA`); a ladder foot in each of `SNAKES_LADDER_BANDS`' - row
  1, row 2, rows 3-4, 5-6, 7-8 - and the extras in rows 1-7
  (`SNAKES_LADDER_EXTRA`); on squares nothing else uses (never
  1 or 100), a head at least a row above its tail and no two snakes crossing, a
  ladder at least two rows long and never more than two columns aside, the
  snakes' total drop over the ladders' total climb within `SNAKES_BALANCE`
  (0.75-1.35), and **fair**: 120 seeded games simulated (`snakesFairness`),
  kept only when a game takes `SNAKES_FAIR_TURNS` (14-32) turns on average and
  never more than 220. Measured over 1,500 seeds: every map found without the
  fallback, 21-32 turns (median 29), a few ms to make (inside the room's
  Durable Object, whose CPU limit is 30 s, not the Worker's 10 ms). Before the bands a
  snake head's row was left to chance (row 2 got a quarter of what row 5 got,
  and one map in ten had no snake in the last two rows). **The die**
  (`snakesDie`) comes from `crypto.getRandomValues` on the phone and in the
  Worker, a byte of 252 or more drawn again so each face is exactly 1 in 6
  (`rules.mjs` rolls 600,000 and checks the spread). The same seed gives the same map everywhere, so the
  server stores only `g.map` (with its `seed`) and every screen draws the same
  snakes: their curves, colours and which one wears the طربوش come from the
  seed too (`snkMountMap`). A game is one plain object, a room's `shared`:
  `seats` (the order they play), `colors` (one of `SNAKES_COLORS`: r b y g p
  v), `pos` (0 off the board, 1..100), `turn { pid, sixes }`, `places`,
  `phase`, `turnSeq`, `events`, `eventSeq`, `map`, `lastS` / `lastL` (the last
  variant of each kind) and `readyAt`. `snakesRoll(g, pid, v, rnd, now)` is the
  one rule: the walk, the bounce off 100 (`over`), the snake or ladder at the
  end with **the variant of its animation picked here, never the last one of
  its kind** (`SNAKES_SNAKE_MOVES`: gulp, slide, chase, sneeze, flick, squeeze,
  hypno; `SNAKES_LADDER_MOVES`: climb, sprint, slip, lift, boost), a near miss
  (`near: 's'`, a snake's head one square either side) or a ladder just missed
  (`'l'`), a six rolling again, a finish, the last one left taking the last
  place (`snakesCheckOver`). **Every roll is one event** carrying all of it,
  with `ms`, how long every screen takes to show it (`snakesRollMs`: the die,
  a hop a square, the move's own time from `SNAKES_MOVE_MS`, the near miss,
  the six's cheer, the win dance), and `readyAt = now + ms`. A new game starts
  with a `build` event (a variant of three, `teardown` on play again) and
  `readyAt` after the building (`SNAKES_BUILD_MS`, `SNAKES_TEARDOWN_MS`).
- **`RoomSnakes.js`** (bundled after `RoomLudo.js`): the lobby (`color` - a
  seated player takes or lets go of one of six, the host may pick for a
  computer player; `seat` - with seven or more the host picks the six),
  `start` / `playAgain` (the order drawn at random; play again keeps the table
  and takes the old map apart), `roll { seq }`, the host's `skipTurn { seq }`
  (a move-on action), the clock (`snakesDeadline` / `snakesTimeout`: 0, 15 or
  30 seconds, counted from `readyAt`, the server rolls), leaving
  (`snakesPlayerLeft`: the piece goes, the turn passes, one left ends it; a
  player already home keeps their place), `ROOM_BOT_GAMES.snakes` (it rolls
  half a second to a second after `readyAt`). **A roll that comes more than
  0.4 s before `readyAt` is dropped** (`SNAKES_EARLY_MS`: the table is still
  watching the last one), and so is a stale `seq`. Nothing is hidden; the
  whole game is `shared`. No forced moves: the roll is the game's one tap.
- **`JS_Snakes.html`**: the board, ported from the design sheet
  (`notes/archive/sheets/snakes-looks-sheet.html`, look أ only), and a game against the phone.
  - **One board per page** (`snkView`): an `<svg>` (`snkBoardSvg`, a viewBox
    of 646 × 700, `SNK_VB`: the frame edge to edge, room above it for the
    pieces home, and under it the wooden mat the pieces wait on before their
    first roll) in a root element moved into whichever screen
    shows it (`snkShowIn`, into the frame's `[data-snk-host]`), so a room frame
    rebuilt with innerHTML never cuts an animation; thrown away (`snkDrop`)
    when no screen shows it. Layers, bottom up: the squares, the holes, the
    ladders, the snakes' bodies, **the numbers** (with a halo of their square's
    colour), the heads (at the top corner of their square), the cup, the
    workers, the pieces, the die, the bubbles and confetti.
  - **The snakes are drawn each frame** as outlined polygons along their
    sampled spline (`snkRenderSnake`: the body with its width, the spots or
    bands, the shine, the head turned and its pupils toward a piece within
    about three squares, a yawn, a doze with Zzz now and then when nobody is
    near). **One loop** (`snkFrame`): every frame while something moves, about
    12 a second at rest, nothing while the page is hidden or the board is off
    the page, and **with the motion setting off, drawn once and still**
    (`snkStillNow`, read once a frame). The tongues, blinks, butterflies, the
    cup and the rungs' shine are CSS loops (section 53), still under reduced
    motion.
  - **Playing the events** (`snkFeed(g, ctx)`): the board keeps the game's key
    and the last event it played; a new game seen for the first time is built
    in front of it only when `fresh` (it was dealt while this screen watched
    the room: `snkRoomLocal.watched`), otherwise the board is simply set where
    the game is (`snkSettleTo`: a reload, a late join). New `build`, `roll` and
    `left` events are queued and played one after another (`snkRunQueue`,
    `snkPlayRoll`: `snkRollDie`, `snkHopTo`, `snkBounceBack`, the variant from
    `SNK_SNAKE_ANIM` / `SNK_LADDER_ANIM`, `snkNearMiss`, `snkMissedLadder`,
    `snkWinDance`, the six's bubble); more than six at once, a hidden page or
    the motion off, and the board is set instead. Every tween is on the
    board's `gen` (a new game or a drop stops it) and finishes at once when
    `fast` - a tap on the board while it is being built sets it, so **a tap
    skips the building on that device**. While a roll is played the bar says
    whose roll it is, the ring is on their chip, the log tells only what has
    been shown (`c.shownSeq`) and your Roll button is out of sight
    (`snkSyncIdle`); when the queue drains `onIdle` enables the button.
  - **Where a piece stands** (`snkSpot`): in the lower half of its square, set
    apart from others there (two side by side, three to six in two rows,
    smaller); off the board on the mat in seat order; **at 100 on the top of
    the frame**, in the order they got there, so nothing covers 100 or its cup.
  - Against the phone (`appState.snakes`: 1-5 computer players, your colour),
    restored through `soloRegister` (a reload sets the board where the game
    is and the phone plays on); a computer player rolls 0.65-1.1 s after the
    board goes quiet (`snkLocalNext`).
  - The frame (`snkFrameHtml`): the board, the strip of players (colour,
    name, square), the bar (whose turn, 🎲 Roll), the last three moves, and at
    the end the podium of the first three (the rest under it). Sounds `snk*`
    added to `FX` (steps, a hiss, a gulp, a slide whistle, a sneeze, a boing,
    the climb, the lift, the hammer, a six, the win), heard on the device that
    plays the table's sounds (the TV, or every phone without one) or for your
    own move.
- **`JS_RoomSnakes.html`**: the lobby's six colours (`snkColorPickerHtml`),
  the seats with seven or more, the turn clock (`recallOptions('snakesRoom')`);
  `ROOM_GAMES.snakes` (`bots: { max: 6, one: true }`, `lateJoin`) and
  `TV_GAMES.snakes`; the roll button enabled once this screen has shown the
  last roll **and** the server's `readyAt` has passed on this phone's clock
  (the smallest `receivedAt − serverNow` seen, `snkReadyLocal`); the host's
  "play for" after 40 s on one turn or at once for a phone that's away.
- **One kind of computer player** (the owner: there is no skill in it):
  `bots.one` on a `ROOM_GAMES` entry makes the lobby show one «+ 🤖 لاعب
  كمبيوتر» button and no level on a bot's row (`roomBotControlsHtml`,
  `roomBotRowHtml` in `JS_Room.html`); the bot is stored as `easy`.
- **Layout** (section 53 of `Style_Rooms.html`): upright, the players on top, the
  board the width of the phone, the bar sticky under it; a phone on its side
  and from 900 px, the board takes the height beside a column; the TV, the
  board as tall as the stage beside the players, the bar and the log. The
  board keeps look أ's own colours in both themes. **The board's size is
  measured, not guessed** (the second round): wherever the frame is two
  columns, `snkFit` (from `snkShowIn` and on resize) sets `--snk-bw` (the
  board's width) from what is left of the play area under the frame's top -
  `#shell-main`'s height less its padding, or the TV frame's own height - and
  never so wide that the side column drops under its least width (13rem, 15rem
  from 900 px, 18rem on the TV), and `--snk-fh` holds the side column to that
  height, scrolling inside itself; a room's strip of people is in the side
  column (`k.strip`). So nothing scrolls. Measured in headless Chrome (the
  board's height, before → after): 667 × 375 291 → 296-304 px, a room's phone
  no longer scrolling (it scrolled 40 px); 1280 × 720 618 → 605-616, a room's
  phone no longer scrolling (59 px); the TV 896 → 907 at 1920 × 1080 and
  598 → 603 at 1280 × 720, filling the frame's height; upright the frame now
  reaches the page's gutter (the drawing's own margin cut from 30 units to 1
  a side, the board 338 × 358 → 338 × 366). The owner's own numbers (261 px
  of room sideways) were a phone with less height than the emulator's: the
  measuring is why it fits there too.
- **The second round** (the owner, 29 Sep 2026; *The owner's specs*):
  - **Decided on the server**, in the roll's event (`Snakes.js`): `pass`
    ([{ h, v: 'duck' | 'snap' | 'jump' }], each head walked past, in order),
    `tail` ({ v: tickle | trip | push | seat, h }, `g.lastT` never twice),
    `sneak` ({ f: the ladder's foot, h: the snake that crawls, v: push | eat }),
    `meet` ({ v: five | bump | dance, with }), `sixes` (1, 2, 3…), `tense`
    (from 95-99) and `rolls`; each with its time (`SNAKES_TAIL_MS`,
    `SNAKES_SNEAK_MS`, `SNAKES_PASS_MS`, `SNAKES_MEET_MS`, `SNAKES_ONE_MS`,
    `SNAKES_TENSE_MS`, `SNAKES_SIXES_MS`) in `snakesRollMs`. A leaver's `left`
    event carries `ms` and moves `readyAt` (`RoomSnakes.js`). Since the
    owner's review (29 Sep 2026) the extras are rarer and shorter: a tail
    square plays a move half the time (`SNAKES_TAIL_CHANCE`), the sneak is 1
    in 3 (`SNAKES_SNEAK_CHANCE`) with **the snake nearest to him** (his own
    square, `snakesNearestSnake(map, walk)`), a jump 2 in 10 and a snap 15%
    of the ducks (*The owner's specs*, the review, for every number before
    and after).
  - **Played on each screen** (`snkPlayRoll`): `snkTense` before the die (a
    drumroll `snkDrum`, the snake nearest 100 in `m-lick`, the cup's glow
    faster under `is-drum`), the walk with `passQ` (`snkPassHead`: ducked -
    squashed at the feet and on tiptoe - the snake's eyes on him by its usual
    tracking; a snap lunging just above him; or the head lowered into the path
    and a jump over it), `snkOne`, then the snake or ladder with the others'
    reactions (`snkReact`), a tail move (`SNK_TAIL_ANIM`: `snkTickle`,
    `snkTrip`, `snkTailPush`, `snkTailSeat` with a coil drawn under him) or
    the sneak (`snkSneak`: he stands on his own square with its edge ringed,
    `snkMarkSquare`, looks round, tiptoes to the ladder and starts up it; the
    snake crawls - `sn.crawl = { way, d }`, drawn by `snkRenderSnake` through
    `snkCrawlAt`: a body point `a` from the head sits at `d - a` along its
    resting body and then the way out (`snkCrawlPlan`, never a knot), so the body follows the
    head, the tail leaves its hole, and `d = 0` is exactly its own shape -
    catches him, and backs home along the same path while he lands back on
    his square), the
    meeting (`snkMeet`), the win (`c.crowd` sways every head, the ladders'
    glow pulses) or the sixes (`snkSixes`, fireworks `snkBurst` on the
    third); a leaver's `snkLeave` (the suitcase, «سلام!», walking off the
    nearer edge) - the piece is kept for it (`snkSyncPlayers`' `keep`) until
    the queue has played it. Each stays inside its server time: measured on a
    virtual clock, every one ends 300-600 ms before `readyAt`.
  - **The board's own life** (`snkAmbient`, from `snkFrame` at the resting
    rate, never with the motion off): once a second the moods (`snkMoods`:
    `mood-happy`, `mood-scared`, `mood-bored` on the piece, faces that are CSS
    over the piece's parts - `snk-grin`, `snk-wob`, `snk-eW`, `snk-lids`,
    `snk-flat` - only while nothing is being played) and sitting (`is-sat`,
    after `SNK_SIT_AFTER`); every few seconds one waiting piece taps a foot,
    yawns or watches the nearest snake (`snkIdleOnce`: `idle-*` classes, every 7-14 s since the owner's review); every
    18-35 s (was 11-23) one of the board's moments (`snkBoardLife`: a snake's yawn or
    stretch, a butterfly flying past a head that snaps at it -
    `snkButterflySnap` - or a worker tightening a rung, `snkWorkerRung`), each
    on `snkAmb`, a tween that gives way at once to a roll or a building. Pieces
    home sit on the frame and cheer (`is-home`, each at its own moment,
    `--snk-d`). A tap on a piece shows its name (`snkNameBubble`, even with the
    motion off). The TV's night is `snkNight` (`.snk-dusk`, `.snk-stars`, a
    slow CSS transition), and at night the snakes' naps come sooner and last
    longer.
  - **Cost**: one frame's own work (the snakes drawn and the board's life) at
    4× CPU throttle, 1.18 → 1.30 ms (measured over 600 frames, three runs
    each); the page at rest 26-38 → 34-42 ms of script a second.
- Tests: `rules.mjs` (80 maps: five of each, ends apart, heads above tails,
  ladders two rows, no crossing, fairness re-simulated; the rules on a map of
  our own: the first roll onto the board, a ladder, a snake, a six, a near
  miss, a ladder missed, the bounce, the places, the variants never twice in a
  row and every one coming up; the room: colours, the host's start, a roll
  during the building dropped, a stale tap, the clock and the host's "play
  for", a whole game with a computer player, the win on the night's board,
  play again with a teardown, leaving, seven people; the second round: the
  sneak about 1 in 3 and only beside a ladder's foot, with the snake nearest to
  him (a map where the one nearest the ladder is another), the tail's four
  moves about half the time, never twice in a row and only on a tail square,
  a head counted only when walked past, bouncing off 100 included, a jump
  about 2 in 10 and a snap about 12 in 100 (every rate over 2,000-3,000 rolls,
  the bounds five standard deviations out), the sixes counted, two on one square, every new
  moment in the roll's time, one random source making the same rolls, the
  leaver's walk waited for), `leaks.mjs` (a game with
  three computer players on the clock; nothing is hidden), `play-all.mjs`
  (`--only=snakes`: two people, a computer player and a TV on a live server).

**A reload on a wide screen** (the audit of 1 Oct 2026): `snkFit` doesn't measure a
layout that is still hidden (a reload paints before the screen shows, and set a 166px board);
it looks again on the next frames, up to 120 of them.

## The night, «مين هيكسب؟» and play again (the review of 1 Oct 2026)

- The board (`snakesBoard`, RoomSnakes.js) is still the evening's wins at this game, but level wins are told
  apart by this game's places (`tie`, as الكراسي and the bumper cars do, `boardRowKey` in
  RoomGames.js): one game of four banks 5 / 3 / 2 / 1 on the night, not 5 and a 3 for everyone else.
- «مين هيكسب؟» is settled on the game just played (`ROOM_RESULT_BOARDS` in RoomGames.js: its
  places once it is over), not on the evening's tally.
- «العب تاني» gives a free seat to someone who watched (joined late, or a seat emptied), never to
  anyone the host benched.
- One phone: who starts and the computer players' names are drawn with `shuffleArray`
  (Fisher-Yates), not `sort(() => Math.random() - 0.5)`, which favoured the first seats.

## The third round (the owner, 2 Oct 2026): built 2 Oct 2026

Picked by the owner from a list of ideas; every rule answered (each question with its options in the session of 2 Oct 2026); the looks picked from design sheets of three. **Built 2 Oct 2026** (*How the third round was built*, below).

- **Teams of 2** (rooms only; 4 or 6 people): a team wins when **both partners are home**; a partner home first **rolls for the teammate**, so nobody sits out. Pairs: **the host arranges them in the lobby, or «وزّع» draws them at random**.
- **Teams, as changed by the owner the same day** (it replaces the line above): **4 people → 2 teams of 2; 6 people → the host picks in the lobby between «٣ فرق × ٢» (three teams of 2) and «فريقين × ٣» (two teams of 3)**; «وزّع» and arranging by hand work for both. **A team wins when ALL its members are home. A member who is home rolls for the teammate who is FURTHEST BEHIND** (the lowest square; on a tie, the next in turn order); in a team of 2 that is simply the partner. **Places, the podium, the night points and «مين هيكسب؟» are per team**, for 2 or 3 teams.
- **«مربعات المفاجآت»**, a **switch, off by default** (the owner chose "pure classic" on 28 Sep; this does not change that game): good squares 🪈 الحاوي (a charm: the next snake you land on lets you pass), 🔄 swap places with the player just ahead of you, ⭐ roll again, 💨 a ladder worker carries you a few squares; **and a couple of bad ones** (e.g. 🍌 a peel, back 3; 😴 a nap, miss a turn).
- **«الخريطة بتتحرك»**, a **switch, off by default**: **every 3 rounds** (everyone rolled 3 times) one snake crawls to a new spot (the crawl already drawn by `snkCrawlAt`); **if its head lands on a piece's square, it eats him** (he slides down it). The server picks the snake and the spot; the map is still checked to be fair.
- **Themed maps, free to pick** (the lobby, or 🎲): 🐊 النيل (crocodiles, feluccas / palms, reeds), 🚇 المترو (escalators up, slides or broken stairs down), 🏜️ الصحرا (cobras, palm ladders, a pyramid at 100, camels), 🏙️ الحارة (cats and drainpipes, balconies and ropes, laundry lines). Same rules; each look from a design sheet of three.
- **The themed maps' look: أ «على الكلاسيك» for all four** (the owner, 2 Oct 2026, from the sheet https://claude.ai/artifact/BkcUaiWYKKnQMiPAtTyRHQ, files in `notes/archive/shots/snakes-themes/`): today's 10 × 10 checkerboard in its frame, dressed in the theme. النيل: sand and turquoise squares, a green frame with a gold lotus border, crocodiles (one in a طربوش), notched palm trunks with dates, papyrus, a sakia and egrets on the edges. المترو: station tiles in the three lines' colours, a platform-edge frame with «آخر محطة» and a train along the bottom, playground slides down, escalators with moving steps up. الصحرا: sand and terracotta, a carved-stone frame with a walking camel and a scarab, cobras (one in a Saidi turban), date palms, a small pyramid with the cup at 100. الحارة: old floor tiles in a mashrabiya frame, drainpipes with a street cat on top (one in a طربوش), rope and balcony ladders and the السَبَت on a pulley, laundry, pigeons, a ful cart and a tuk-tuk. Each theme's down and up moves are in its page of the sheet.
- **The surprise squares' look: ج «حاجة واقفة»** (the owner, 2 Oct 2026, from https://claude.ai/artifact/GkASUTH8PN66d8NLWMwgTC, `notes/archive/sheets/snakes-surprises-sheet.html`): a 2.5D object with a shadow standing at the top of its square (the charmer's basket with a flute, a two-arrow signpost, a star on a stick, the worker leaning on a ladder, a banana peel, a pillow with Zzz), moving a little by itself; landed on, the object acts (the star flies off, the peel spins, the worker carries you). **The awards' look: ج «لقطة»** (same sheet): a replay screen with a red «لقطة» tag, a mini board replaying the moment in slow motion (the fall down its snake, the climb rung by rung, the gulps with a tally, the sixes collecting with a crown), then the title, the name and a count-up; a «أبطال اللعبة» recap at the end. The server records each moment's squares for it.
- **Awards on the podium**: 🐍 أكتر واحد اتاكل, 🪜 أطول سلم, 🎲 ملك الستات, 😭 أنحس رمية - **up to 3 a game, the most dramatic**, revealed one by one.
- **Everywhere**: surprises, the moving map, themes and awards also in one-phone play against the computer; teams are rooms only.

## How the third round was built (2 Oct 2026)

Every part is optional on a game and decided on the server (or, on one phone, by the same `Snakes.js`), in the roll's event, so every phone and the TV play the same; with every switch off, the classic map and no teams a game is the very same object it was (no `theme`, `opts`, `charm`, `nap`, `teams`, `took`, no `map.surp`), rolled the same way (`rules.mjs` checks it). An older phone's start payload has none of the new fields and plays the classic.

- **Themes** (`SNAKES_THEMES`: classic, nile, metro, desert, hara; `g.theme`, absent for the classic). Each theme has its own down and up moves with their times in `SNAKES_THEME_MOVES` (Snakes.js): النيل gulp/ride/tears/chase and climb/rope/slip/egret, المترو whoosh/spin/ticket and ride/run/broken/wrong, الصحرا gulp/board/storm/mizmar and climb/camel/balloon/dates, الحارة chase/pole/water/ride and climb/sprint/basket/pigeons (the sheets' moves, each shortened to 1.3-3.2 s; a down move plays in its time less 150 ms, an up move less the 300 ms hop at the top). `snakesRoll` picks from the game's theme (`snakesMovesOf`), never the last one, and counts it (`snakesRollMs(e, theme)`). 🎲 («أي واحدة») draws a theme at each start, play again included (`settings.theme` keeps 'random'). The metro's look أ has slides only (its sheet's `kinds: ['slide']`; the broken stairs were look ب/ج), so no broken stairs.
- **The themes on the page**: each is a file of its own (`JS_SnakesNile.html`, `JS_SnakesMetro.html`, `JS_SnakesDesert.html`, `JS_SnakesHara.html`, in the `snakes` chunk after `JS_Snakes.html`) that registers `SNK_THEMES[id]`; the engine (`JS_Snakes.html`) keeps the board, the numbers, the pieces and every moment, and the theme dresses them: `back()` (the frame), `tile()` (each square, its halo and number colour), `cup()`, `outer()` (the edge props), `worker()`, `cols`, `way()`, `width()`, `mountDown`/`renderDown` (the down piece, drawn each frame from `snkBodyPts`, its head through `snkHeadLife`/`snkHeadMood`, so dozing, yawning, watching, the crowd at a win, a near miss, the sneak, the charm's dance all work on it), `mountUp` (`g`, `inner`, `glowL`, `base`, `pt`, `reset`), `downMoves`/`upMoves`, `crawls` (the classic's, the crocodiles and the cobras crawl; the slides and the drainpipes don't: the sneak then calls him back from where it stands, `snkSneakStill`, and the moving map takes the piece down and puts it up again), `amp` (`snkAmpOf`: 0 for a slide or a pipe). The board is recreated for another theme (`snkEnsure(themeId)`, `snkShowIn(host, themeId)`); the classic is no theme (`c.th` null) and keeps its own drawing. Classes are prefixed per theme (`snn-`, `snm-`, `snd-`, `snh-`), their CSS in section 53 with their reduced-motion lines, their words `snk_b_<theme>_*`. Everything stays inside the drawing's box (the frame band, the bottom band right of the mat, the top band right of the pieces home): nothing covers a number, the mat or the pieces home. **One fix for every map**: the snakes' colours were shuffled with a random comparator in `sort()`, which Safari and Chrome run differently, so an iPhone and the TV could draw a map's colours, its طربوش and every curve differently; it is a seeded Fisher-Yates now (`snakesShuffle`).
- **The surprise squares** (`g.opts.surprises`; `snakesGenMap(seed, { surprises: true })` adds `map.surp`, `{ square: kind }`): six a map, one of each (`SNAKES_SURPRISES`), placed by `snakesPlaceSurprises` on their own seeded source (the classic map of a seed never changes): squares 5-96 nothing else uses, not next to a snake's head, at least 4 apart, clear of the snakes' and ladders' lines (the object stands at the top of its square), the charm with a snake still ahead of it (below the highest head less 6), the peel's square 3 back free, and at least one of the worker's 3-5 free; and the map is kept only when it is still fair with them (`snakesFairness(…, surp)` plays the charm, the star, the worker, the peel and the nap; up to 12 placements, then another map). In `snakesRoll`, after the walk and only when no snake or ladder took him (a surprise square never is one): 🪈 `charm` sets `g.charm[pid]`, and the next snake's head he lands on is `charmed` (he stays on its head, the charm used up; it costs no random draw); 🔄 `swap` with the piece just ahead (the lowest square above his, home pieces left out; nobody ahead: `none`); ⭐ `again` keeps the turn; 💨 `worker` carries him 3, 4 or 5 (drawn in a random order, the first that is under 100 and not a head, a foot or a surprise; none free: `none`); 🍌 `peel` back 3 (`SNAKES_PEEL_BACK`); 😴 `nap` sets `g.nap[pid]` and ends his turn even on a six; when the turn would move a napping piece, `snakesPassTurn` passes it by with a `nap` event (`SNAKES_NAP_MS`, in `readyAt`), the nap used up. A surprise is the moment of its roll: no near miss, tail, sneak or «بس كده؟» on top. Times: `SNAKES_SURP_MS` (+ 300 ms a square for the worker), the charm's dance `SNAKES_CHARMED_MS`. Nothing chains (a swap or a carry onto another surprise does nothing more).
- **The surprise squares on the page** (look ج «حاجة واقفة», ported from `notes/archive/sheets/snakes-surprises-sheet.html`): `snkStandSvg` (the basket with a little snake and the flute, the signpost, the star on its stick, the worker leaning on a ladder, the peel, the pillow with Zzz), each in `.snk-surp` (above the numbers' row, under the heads) at the top of its square, scaled 1.22, moving by itself (`snk-sp-*` CSS loops); `snkMarkPop` (a squash and a stretch), `snkFxCharm` (the flute flies to his hand, a violet ring and the flute stay on him: `snkCharmOn`), `snkCharmSnake` (he plays, notes fly, the snake sways with `lunge.r`, «اتفضّل… عدّي»), `snkFxSwap` (both fly through the air to each other's square), `snkFxAgain` (the star flies off its stick and bursts), `snkFxWorker` (the worker standing there carries him on his shoulders square by square and walks back), `snkFxPeel` (the peel spins, he slides back on his back), `snkFxNap` (he lies down on a pillow, Zzz: `snkNapOn`, kept lying in `snkSettleAll`, his eyes shut in `snkFace`) and `snkNapSkip` (snoring, «نايم!», he wakes). A reload or a late join sets the charm and the nap from `g.charm`/`g.nap` (`snkSettleTo`). The objects pop up during the building and shrink away in the teardown.
- **«الخريطة بتتحرك»** (`g.opts.moving`, `g.took` counts each seat's turns - a nap's passed turn included - and `g.moves` the moves made): after a turn passes, once everyone still playing has had another 3 turns (`SNAKES_MOVE_EVERY`), `snakesMaybeMove` moves one snake: `snakesMoveSpot` draws the snake and a new spot (the head in its own band of `SNAKES_SNAKE_BANDS`, so a snake still lies near 100; the generator's rules for where a snake may lie; never on a surprise; the map's balance and fairness checked again, with its surprises); none found, no move that time. The snake keeps its index (its colour and face), gets `w` (the seed of its new curve) and `was` (where it was first drawn, so the draws its first curve took are still taken and every other snake keeps its curve), and `map.v` counts the moves (the board's key is `seed:v`, `snkMapKey`). Anyone still playing on its new head is eaten: down to the new tail, counted for the awards. A `move` event (`SNAKES_MOVE_SNAKE_MS`, + `SNAKES_MOVE_EAT_MS` with an eat) is in `readyAt`. On the page `snkMoveSnake`: a snake that crawls crawls there along one planned path (`snkCrawlTo`: `snkCrawlWayOf` and `snkCrawlKnots`, the sneak's crawl), its old hole closing as the tail leaves, then settles into its new curve (`snkPtsOf`, a 0.9 s morph), drawn again in place (`snkRemountSnake`) with its new hole popping up; one that can't is taken down where it was and put up at its new spot; the eaten are gulped at the new head, the bulge goes down, and they pop out at the tail (`snkMoveEat`).
- **Teams** (rooms only; `g.teams` as arranged, `g.teamPlaces` the teams in the order they finished, a roll's `by`): `SNAKES_TEAM_SIZES` (4 → 2; 6 → 2 or 3). In the lobby the host's `teamMode { size }` (0 off) draws the teams at once, `teamDeal` («وزّع») draws them again, `teamSwap { a, b }` swaps two people (a tap on a name, then on one in another team); `snakesTeamGroups(seated, size, groups)` (Snakes.js, so every phone draws the lobby's teams with the server's own function) keeps the arrangement as far as it goes and fills in whoever is unplaced, or cuts the table into teams again when their number no longer fits; a table of 5 refuses teams at the start with a word. The order is one of each team in turn (`snakesTeamOrder`: the teams and their members shuffled, then A1 B1 A2 B2). `snakesPieceOf(g, pid)`: a member home rolls for the teammate furthest behind (the lowest square, on a tie the next in turn order after him); `snakesActive` keeps a member of an unfinished team rolling, home or not; a team is done when all its members still at the table are home (`snakesTeamDone`, a `teamDone` event), the last team left takes the last team place (its members' places by square). Play again keeps the teams (`settings.teamSize`). A member leaving: their piece goes and the team plays on with the others; a member home who leaves keeps their place and no longer rolls (`g.gone`). The wins on the board go to each member of the winning team; the board's tie is the team's place; `ROOM_RESULT_BOARDS.snakes` and `PROGRAM_TEAMS.snakes` (RoomProgram.js, through `snakesTeamResult`) give the teams in their order, so the night (5 / 3 / 2 by team), «برنامج السهرة» and «مين هيكسب؟» are per team. On the page the strip is a box a team (`.snk-team`, its place on its label), a member home shows 🏠, the bar says «ترمي لـ …», the hints are for the piece the roll will move, the log says who rolled for whom, the podium is the teams' (their names joined, their colours), and a phone's confetti is for its team's win.
- **The awards** (`g.stats`, always kept: eaten counts with the last six heads and tails, sixes counts - the roller's -, `lead` the first to reach the most, the worst fall in one roll - a snake, a peel, a snake that moved onto him - and the longest ladder): at the end `snakesAwards` makes `g.awards`: of the four, those the game had (eaten at least once, at least two sixes), each scored over its cap (`SNAKES_AWARD_CAP`: 90 squares, 6 eats, 9 sixes), the three biggest, in the order they are revealed, the biggest last. On the page (look ج «لقطة», ported from the sheet's look ج): `snkAwardsShow` puts a dark replay over the board, inside the board's own root so a room's frame redrawn underneath doesn't cut it (its own `gen`, `snkAwTween`), with the red «لقطة» tag, a progress bar a clip, the little board in the map's own colours (`snkAwBoard`) replaying the moment (`snkAwClipFall`, `snkAwClipLadder`, `snkAwClipEaten`, `snkAwClipSixes`, «بالبطيء ×½»), the title, the name in its colour and a count-up (`snkAwTitle`), and «أبطال اللعبة» at the end with confetti (`snkAwRecap`). It plays once when the game ends in front of this screen (`c.liveEnd`, `duelOnce`), 1.7 s after the podium has risen, the board brought into sight on a phone held upright; a reload or a late join doesn't replay it; the over card's «🎬 اللقطات تاني» plays it again; with the motion off, the recap at once. The ✕ closes it.
- **The setup and the lobby**: one phone keeps the theme and the two switches in `appState.snakes` (`snkThemePickerHtml`, three tiles a row: كلاسيك, the four maps, 🎲; the switches in Controller.html); a room's host keeps them in `recallOptions('snakesRoom')` and sends them in the start payload (`theme`, `surprises`, `moving`, beside `turnClock`), and the teams are the lobby's shared state (`snkTeamsHtml`). The TV draws all of it in the game (the theme, the surprise squares, the moves, the teams' strip, the awards); its lobby shows the players as before.
- Tests: `rules.mjs` («Snakes & Ladders, the third round»: the classic unchanged; every theme's moves, never twice in a row, timed; the surprise squares' placement and fairness over 60 maps; each surprise's rule and time; the moving map over 40 games - when, where, fair, the eat; teams of 2, 3 teams of 2, 2 teams of 3, the furthest behind and the tie, a whole game; the lobby's teams; the awards' choice and order; the room: options, teams in the lobby, team wins, the night by team for 2 and 3 teams, play again, a teammate leaving, 5 refused, an old phone's start), `leaks.mjs` (teams of 2, the desert map and both switches, on the clock), `play-all.mjs --only=snakes` (teams arranged in the lobby on every phone and the TV, swapped, the alley map with both switches, people rolling in turn).

## The ideas of 7 Oct 2026, second batch (the owner's picks): built

- **959 «📌 خرايطنا»** (no rule asked; built as described). A board the family
  liked is kept by name **on the phone that keeps it**
  (`localStorage['ashrySnakesMaps_v1']`, twelve at most, newest first, one map
  kept once): its seed (`g.map.seed`) and its look (`g.theme`, the classic when
  none). «💾 احفظ الخريطة دي» sits under the log on every phone (not the TV),
  in the game and at its end (`snkMapSaveOpen`): a centred sheet
  (`#snk-save-modal`, made by `snkMapModalEl`) with the name filled in (the
  look's name and a number, 24 letters at most); a map already kept says its
  name instead. The map pickers - one phone's setup and the room's lobby, both
  `snkThemePickerHtml` - list the kept maps after 🎲 under «📌 خرايطنا», each a
  tile with its look's corner and its name, its value `map:<id>`
  (`snkMapChoiceOk` lets the pickers and `recallOptions` hold it); the picked
  one has «🗑️ امسحها من خرايطنا» (`snkMapForget`, back to the classic). A
  start deals from `snkMapResolve`: one phone passes the seed to
  `snakesNewGame`; a room's `startPayload` sends `{ theme, seed }` (seed 0: a
  new map) and the server (`snakesNewRoomGame`) takes a seed only when it is a
  whole number 1..2147483646, keeping it in `settings.seed`, so play again
  deals the same board as it keeps the look. Decided here: the surprises and
  the moving map stay their own switches (a kept map with surprises on gets its
  surprise squares placed as for that seed); the board's key (`snkMapKey`) now
  carries the surprise squares, so the same seed with and without them is drawn
  again. Tests: `rules.mjs` (a kept seed deals the same snakes and ladders in
  its look; bad seeds and an older phone's start make a new map).

## The ideas of 7 Oct 2026, third batch (the owner's picks): built

Picked from the ideas page of 7 Oct 2026 (round three); the owner asked no extra rule unless said: "build as described, choose simple family-friendly details".

- **962 Teams: who the roll is for.** When a member home rolls for the teammate furthest behind, the roll button names them with their face: their initial on their colour, then «ترمي لـ منى» (`snkBarHtml`, `snk_roll_btn_for`, `.snk-bar__roll--for`), and the line under «دورك!» says «منى الأبعد ورا في فريقك» (`snk_for_behind`). Their piece is the one that pulses on the board, on every phone and the TV (`snkSyncIdle`: `is-up`, the disc under the piece, goes to `snakesPieceOf(g, up)`, not to the roller whose piece is home); the reach hints were already for that piece.

## History

The day-by-day log of the work on this game is in `notes/log.md` (search it for the game's name); a new entry goes there, and anything that changes how the game works goes in this file.

**Two leftovers fixed (2 Oct 2026, the owner):** the log speaks each map's language - `snkEvKey` / `snkEvIcon` in JS_Snakes.html pick `snk_ev_snake_<theme>`, `snk_ev_ladder_<theme>`, `snk_ev_move(_eat)_<theme>` and the icon (🐊 🌴, 🛝 🪜, 🐍 🌴, 🐈 🪜), kept in `SNK_BUBBLES` (the chunk, not the shell); and a TV that isn't the host shows the teams in the lobby, a box each, through a new hook any room game can give: `ROOM_GAMES.<id>.tvLobbyPlayers(state, tile)` (JS_RoomTv.html's `tvLobby`), returning '' to keep the plain tiles.

**The moves play with the device's reduced motion (2 Oct 2026).** `snkStill()` (JS_Snakes.html) read `motionOff()`, so on a PC with Windows' animation effects off (the owner's) or an iPhone with Reduce Motion every roll, gulp, climb, surprise and the awards' replay was set without moving - against the spec ("still under motion off"). It now stills the board only for the app's own setting (الحركة → مقفولة) or a hidden page, as المشنقة's endings (`hmEndsStill`). Also on الحارة: a pipe whose head is in the top row, or on 81 (under 100's label, which sits low under the cup), seats its cat low at the funnel's corner and a little smaller (`sn.low`, JS_SnakesHara.html), not up on the frame where the pieces home stand.

**The moving map's crawl, the body following all the way (2 Oct 2026, the owner, from a filmed sheet https://claude.ai/artifact/AvjiiKp2mu7wvqRr55BRWZ: the body "just moved as one piece after the head arrived").** The crawl used to end at the new head and then morph the whole body into its new curve. `snkMoveWay` (JS_Snakes.html) now makes one path - from the head to just behind the new tail (in line with the curve, no hairpin), then up the new curve - picked like the sneak's (least tangled, `snkCrawlKnots`), spaced by `snkEvenly`; every body point follows the head along it, and the body eases to its new length on the way (`crawl.k`, read in `snkBodyPts`). When the head reaches its square the body already lies in its new shape; 2.6 s, inside `SNAKES_MOVE_SNAKE_MS`. Slides and pipes still come down and go up.

## The polish (3 Oct 2026, from the owner's before/after sheet)

Picked by the owner from https://claude.ai/artifact/V1HJsTHR2hs4u9rrkHcXjL ("apply all"). Styles in section 66 of `Style_Talk.html`.

- **Your piece and whose turn** (S1): every piece carries a disc at its feet (`.snk-updisc`, shown and pulsing under the piece whose turn it is, `is-up`, set in `snkSyncIdle`) and a plate «أنت» (`.snk-metag`, shown on `.is-mine`). **Decided while building**: the plate sits under the feet, not over the head as on the sheet, so it never covers a square's number (the rule of 28 Sep); hidden for a piece home.
- **The room lobby** (S2): the colours stay open; the map, the two switches and the turn clock fold into one «🗺️ الخريطة والقواعد» row (`.lobby-opts.snk-rules`, its open state in `lobbyOptsOpen['snakes-rules']`), its line filled by `lobbyOptsSummarise`, which now also reads a picked `[data-sum-pick]` tile (the map).
- **«كمّل اللعبة» on top of the setup** (S3): `#snakes-continue-card` in Controller.html, with where your piece is and whose turn it is (`snk_cont_line`); the old button at the bottom is gone.
- **One row of players on a phone** (S4): the strip is one row of up to six (face over name and square); in a room the second row of names under the board (`[data-room-strip]`) is hidden on an upright phone unless someone is away, since it holds the host's ✕.
- **The mat folds away** (S5, `snkMatSync`): once every piece is on the board the mat fades; on the maps whose strip under the frame is only the mat (classic, النيل, المترو) the drawing's viewBox loses those 40 units (`.is-short`, `snkFit` reads the board's own proportions). **Decided while building**: الصحرا and الحارة keep their strip (the camels, the road and its traffic) and only the mat fades.
- **The roll** (S6): `btn--lg`, at least 46% of the bar on an upright phone.
- **The TV shows the roll** (S7): `[data-snk-lastroll]` under the bar, the last roll this screen has played as a big die with «X جاب n» (`snkLastRollSync`, the roll event's `n` and `by || pid`), and a bigger turn line and log.
- **The marked squares explained** (S8): `[data-snk-reach]` under the bar while your roll's six squares are marked: a dashed, a green and a red swatch and «المربعات المعلّمة: فين ممكن تقف بالرمية دي. الأخضر سلّم والأحمر تعبان».
- **Each map's tile shows its board** (S9): `snkThemeMiniSvg` draws six by three of the map's real squares (its `tile()`) in its frame colour, with its icon on a badge; 🎲 keeps its icon.
- New words: `snk_reach_key`, `snk_rules_fold`, `snk_cont_line`, `snk_rolled` in `SNK_BUBBLES` (the chunk), `snk_cont_title` in `TRANSLATIONS` (the markup's `data-i18n`).

**Each map has its own sounds (4 Oct 2026, the owner: "the crocodile still makes the snake's sounds").** `snkSound` (JS_Snakes.html) looks the engine's sound up in `SNK_THEME_SOUNDS[theme]` first: النيل snaps a crocodile's jaws (`snkCrocSnap`), chomps (`snkCrocGulp`), splashes (`snkSplash`) and knocks up the palm (`snkPalm`); الصحرا's cobra hisses its own longer hiss with a rattle (`snkCobra`), the board swishes on sand (`snkSand`); المترو whooshes down the slide (`snkWhee`), hums up the escalator (`snkEscal`) and chimes where a snake would hiss (`snkChime`); الحارة's cat meows (`snkMeow`), the pipe clangs (`snkClang`) and rattles (`snkPipe`), and the bucket of water splashes. A sound a map doesn't name stays the classic's; a new map adds its line there.

**The audit fixes of 6 Oct 2026.** A team whose members still in the game have all left (home first, `g.gone`, or not) is neither done nor "left": it takes no place, and the team still at the table wins (`snakesTeamDone`, `snakesCheckOver`). A moved snake keeps off the square 3 behind the 🍌 peel too, as the deal does (`snakesMoveSpot`). A leave that passes the turn goes through the nap rule like any pass (`snakesNapSkip`, shared with `snakesPassTurn`), its hold counted from now when `readyAt` is older. An award whose holder leaves goes to the best of those still seated (`g.stats.ladders` and `g.stats.falls` keep each one's own best; the eaten and sixes counts were already per player). On the page: a new game built in front of the screen starts every piece clean (no charm ring, pillow or Zzz); dropping the board stops the awards replay (`snkDrop` → `snkAwClose`); a roll redraws only the frame's side column (`snkSideSwap`, on one phone, in a room and on the TV, whose `sig` is now the frame's shape and whose `after` swaps the side), so the board is never taken out and the maps' CSS loops play on; a language change makes a new board (`snkEnsure` compares `c.lang`), so «ابدأ», «أنت» and the signs follow it; a team member home reads «وصل» (no second 🏠).

**The audit of 7 Oct 2026.** A player home already who then leaves keeps their name (`shared.names`, read by `snkRoomCtx`) on the podium, the strip and the awards. A build cut short no longer clears `c.building` on the build that replaced it. The worst fall carries its `kind` (`snakesFallen`, `snake` or `peel`), and a 🍌 peel's is replayed as a slide back past the peel, not a snake.
