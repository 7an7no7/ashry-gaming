# الحقوا! (id `wire`, first called سلك مقطوع)

Moved from GEMINI.md on 30 Sep 2026. GEMINI.md keeps the rules that apply to every game and an index; this file keeps the detail, word for word.

## From GEMINI.md: The owner's specs, as built

- **Five new room games, not built yet** - the owner, 29 Sep 2026, from six
  ideas another AI suggested, reworked our way (`notes/archive/plans/new-game-ideas.pdf`,
  the Arabic sheet the owner decided from). Build all five; الجاسوس الأبكم
  was declined as a game (it repeats الجاسوس / المختلف / الحرباء; its
  "glitch" may become a switch in كلمة واحدة later). Every rule asked; the
  looks are still to be picked from design sheets. Each is its own card.
  - **الحقوا! / "Panic Stations!"** (first called «سلك مقطوع»; renamed by the
    owner, 29 Sep 2026, on the recommendation: there is no wire in the game,
    and «الحقوا!» is what the table shouts in all three places; ids stay
    `wire`) (co-op panic, like Spaceteam): each phone a panel of 4-6
    controls with funny names; each phone gets an order with a draining bar,
    usually for a control on someone else's panel, so it is shouted across
    the table. **Three places, the host picks in the lobby** (or random): the
    microbus broken down on the desert road, the kitchen an hour before the
    guests, the wedding with the power cut. **Levels that get harder until
    you lose** (a room's best). **A level is lost by both**: a damage bar
    (every missed order) and a clock, whichever runs out first. **3-8
    players.** **The TV's alarms loud and a bit tense.** **Without a TV it
    plays** (every phone shows damage and time, the host's phone the sound).
    **Surprises, all three, with a lobby switch to turn them off**: panels
    change every level, a control breaks suddenly (flipped / covered in
    smoke, wipe it), an order for everyone at once («الكل يهز الموبايل!»).
    **The look: each place its own layout** (the owner, 29 Sep 2026, from
    the sheet https://claude.ai/artifact/ME7L215iH5B9J1XfBK4mJ5): the
    microbus is «تابلوه الميكروباص» (a dashboard, the order on an LED screen
    with a segment timer, metal plates in a grid; the TV's road is the
    progress, the engine temperature the damage), the kitchen «ورقة ماما على
    التلاجة» (the order a note with a burning fuse amid the controls; the TV
    split, the kitchen and a column of every phone's order; plates filling
    the table, rising smoke), the wedding «عم الفرح والمكسر» (the uncle shouts
    the order, a ring timer round his face that angers, a DJ mixer's faders;
    the stage lights coming on, the guests' faces falling).
    **Built 29 Sep 2026** (*سلك مقطوع*); decided while building (open to
    change, each in one place):
    - **Random is one place for the whole game**, drawn at the start (and
      again at play again), not a new place every level.
    - **The orders are public, the panels secret.** `shared.orders` has every
      phone's order (the TV shows them all in every look - the fridge, the LED
      ticker, the uncle's bubble), but an order never says whose panel holds
      its control; a phone draws only its own order. The panels, the values
      and what is broken are the server's (`room._wire`), each phone sent only
      its own panel. Who did an order is told once it is done ("على إيد
      منى"), and a control breaking names the panel it broke on (the TV's
      "لوحة منى: دخان على «…» - امسحه!").
    - **The numbers** (`wireLevel` in `Wire.js`): 3-8 players, the ninth on
      watching; 6 controls a panel with three, 5 with four or five, 4 from six
      (8 × 4 = 32 of a place's 34); a level's target is
      `round(players × (2.5 + 0.5 × level)) + 2` orders; an order lasts 11.5 s,
      0.8 s less each level, never under 5 s; a level's clock 75 s; the damage
      a level takes is 5 with three players and one more for each player past
      three (every phone has an order running at once, so five misses at once
      would end a table of five in 11 s); a phone's next order 0.7 s after the
      last; 0.3 s of the network's grace; one order in four is for your own
      panel; a button is pressed once or twice, up to three times from level 3;
      a level's card 4 s before the orders start, and a won level moves on by
      itself 4.5 s later (the host can move on sooner, a move-on action).
    - **Losing a level ends the game** (the levels cleared are the score); the
      room's best is kept for the evening (`room._wireBest`, across play again
      and trips to the hub). It is co-op, so nothing goes on the night's board.
    - **The surprises** (a lobby switch, on): new panels at every level from
      level 2; a control breaks from level 1, 12-20 s in and then every 18 s
      (0.9 s less a level, never under 8 s), half the time a control an order
      is waiting on, two at once from level 4 - smoke (60%, wiped with 4 taps; since 7 Oct 2026 drawn as the place's own surprise, 792 below)
      or upside down (9 s, still works, drawn and read upside down); «الكل يهز
      الموبايل!» from level 2, seven times in ten, once 25-50 s into the level:
      7 s to shake (a hard jolt three times, or three taps where the phone has
      no sensor or it was refused), the orders' bars standing still meanwhile;
      everyone made it: +2 progress; anyone didn't: +1 damage.
    - **Without a TV** every phone shows the progress, the damage and the
      clock, and the host's phone plays the sounds; with one, the TV is the
      only voice. A phone plays its own control clicks and buzzes. The tense
      beep comes at one damage from the end, and the last 10 s tick.
    - **Mashing** (the review of 1 Oct 2026: mashing beat listening): every
      third pointless move in a row by one phone - a control changed or
      pressed that no open order waits on and that fills none - costs the
      table ¼ damage (`WIRE_MASH_EVERY` 3, `WIRE_MASH_DMG` 0.25) and buzzes
      that phone «شكلك بتلعب عشوائي! 🙉 −¼» (the `mash { pid }` event). A
      move on a control an order waits on never counts (the second of three
      presses, a dial on its way); filling an order starts the phone's count
      again, and so does a new level; nothing counts on the level's card.
      Judged on the server only (`room._wire.mash`).
    - **A player who leaves**: their panel goes and orders on its controls are
      cancelled with no damage (they are given again); fewer than two ends the
      game. A latecomer watches and is dealt in by play again.

### الحقوا! (first سلك مقطوع)

The owner's rules are in *The owner's specs* (five new room games). Game id
`wire` everywhere (`room-wire`, `ROOM_GAMES.wire`, `TV_GAMES.wire`, the
catalog, the help); the rules are named `wire` / `WIRE_`, the page's code
`wr` / `WR_`, the stylesheet section 55 (`.wr-*`).

- **`Wire.js`** (shared, no DOM; inlined into the page through
  `SHARED_LISTS`, bundled into the Worker): the three places
  (`WIRE_PLACES`, `WIRE_PLACE_NAMES`), the numbers (`WIRE_*`), `wirePanelSize`,
  `wireLevel(level, n)`, and `WIRE_CONTROLS` - 34 controls a place, each an id,
  its Arabic and English name and a kind: `btn` (a colour and what pressing it
  is called, `do`), `sw` (its on and off), `dial`, `slide` (`o: 'h'` for the
  microbus and the kitchen, `'v'` for the wedding's faders); `wireControl`,
  `wireName(cid, lang)`, `wireOrderText(order, lang)` (a button «اضرب الكلاكس
  مرتين», a switch its on or off, a dial or a slider «الكاسيت على 4»).
- **`RoomWire.js`** (bundled last): `room._wire = { panels, vals, presses,
  broken, pend, base, last, mash, seq, nextBreak, shakeAt }`, never projected; each
  seated phone's slice `{ lv, panel: [{ c, v?, b? }] }` (`wireWrite`: its own
  controls, their values, what is broken on them). `shared`: `settings { place,
  surprises }`, `place`, `roster`, `alive`, `level`, `levelsWon`, `best`,
  `newBest`, `progress`, `damage`, `target`, `dmgMax`, `orderMs`, `orders { pid:
  { id, c, at, ends, v | n } }`, `shake { id, ends, done } | null`, `events`
  (the last 30: `level`, `done { to, by, c, v | n }`, `miss`, `break { c, pid,
  k }`, `fixed`, `mash { pid }`, `shake`, `shakeOk`, `shakeFail`, `won`, `lost`), `phase`
  ('ready' → 'play' → 'won' → … → 'gameover'), `why` ('damage' | 'time' |
  'left'), `startAt`, `endsAt`, `nextAt`, `cover { pid: n }` (whose panel is
  under the place's surprise, 792). Moves: `ctl { c, v, lv }`, `press {
  c, lv }`, `wipe { c, lv }` (from the phone holding the control only; a
  stale level is dropped; a control in smoke takes nothing but wipes), `shake
  { id }`, the host's `start` / `playAgain { place, surprises }` and
  `nextLevel { lv }` (a move-on). `wireIssue` gives a phone an order for a
  control no order is on, not broken, not its last one, that asks for a
  change; a button's presses count from when it was asked (`base`).
  `wireTimeout` does everything that is due in one pass - the card's end
  **falls through into the first orders** (see *Traps*), misses, a flip
  ending, a break, the shake, the level's clock.
- **`JS_RoomWire.html`**: the phone (`wrPhoneHtml`): the head (level, place,
  clock), the two bars, and each place its own layout - the microbus the order
  on an LED screen with a segment timer over metal plates, the kitchen mum's
  note with a burning fuse amid the controls, the wedding the uncle's face in
  a ring timer that angers and a mixer of faders. The controls (`wrCtlHtml`):
  a button pressed, a switch flicked, a dial turned a notch a tap, a slider
  dragged (or the arrow keys); a change shows at once (`wr.local`, 1.5 s) and
  is sent; a broken one is smoke to tap away or turned upside down. `wrPaint`
  updates values, the order and the bars in place, and one loop (`wrFrame`)
  drains the bars and the clock from the server's time (the smallest
  `receivedAt - serverNow`). `wrEvents` plays each event once per deal (a
  stamp ✓ / ✗ / the level, a buzz, the voice's sounds: `wrSound` - the alarm,
  a chime, a crackle, a whistle, the danger beep, the ticks), and only events
  under 4 s old by the server's clock: a phone back from Help or a TV tab shown
  again used to play everything it missed at once. The shake: a
  layer over the panel, `devicemotion` asked for inside the first tap on iOS
  (`wrOnMotion`: 12 m/s² without gravity, or 10 off gravity), three jolts or
  three taps. The end: a card over the bars (the levels cleared counting up,
  the room's best, the host's buttons), the panel gone. The TV (`wrTvHtml`):
  the microbus on the road (the road is the progress, the gauge the engine's
  heat, the LED ticker the last order); the kitchen with its fridge of every
  phone's order, plates filling the table, smoke rising; the wedding's stage
  lights coming on, the guests' faces falling, the clock ring, the uncle's
  bubble; the level's card and the level won over the scene; the end is a frame of its own, the scene playing on to its ending (796, below).
- `roomTurnOf`: an order on this phone while a level is played. The catalog:
  the party section, orange, `players: [3, 8]`, `faceToFace`, a drawn icon
  (`art:wire`: a panel with a red button and two cables and a spark).
- Tests: `rules.mjs` ("Cut wire": the lists and the order text, the panel
  sizes and the levels, the start, panels secret, orders, holder only, stale
  taps, done and missed, a button's count, a level won, lost by the clock and
  by the damage, play again keeping the best, a break named, smoke and wipes,
  the shake both ways, new panels, leaving, random, a latecomer, eight and a
  ninth), `leaks.mjs` (`PROBES.wire`: a panel only on its own phone, an order
  never naming its holder, no panel or value in `shared`; proved by leaking
  both), `play-all.mjs` (`--only=wire`: three phones and a TV through a level
  won, a miss, the damage, play again with a latecomer, a leave).

**The review of 1 Oct 2026.** A slider is sent once, where the finger lets go: dragging it shows the value on the phone (`wr.dragging` keeps the local value showing however long the drag) and sends nothing until `pointerup`; it used to send every value it passed, and so filled every order on the way. The arrow keys still send each step.

## The ideas of 7 Oct 2026 (the owner's picks): built

- **793 «المنادي» للي بيتفرج** (no extra rule asked; built as described). A
  phone that is not in the level's table (`shared.alive`: a latecomer, the
  ninth) no longer shows only "watching": it shows every open order
  (`shared.orders`, public already; never a panel) as a list, soonest to burn
  first, each with whose phone it is on («موبايل منى») and its draining bar, the
  one about to burn lit (`is-next`) and pulsing under 35% (`is-hurry`), so the
  watcher calls it out to the table. Phone only (`wrCallerPaint` rebuilds the
  list when the orders change, `wrCallerFrame` drains the bars each frame from
  the server's time; the shake's pause is honoured as on the TV's fridge); the
  TV already shows every order. No server change. Styles `.wr-call*` in
  section 55; words `wr_caller_*`; the rules' list has a line for it.
- **792 «مفاجأة كل مكان», look أ «على لوحة واحدة»** (the owner's pick from the
  looks sheet of 7 Oct 2026). The rule is unchanged: a control breaks 'smoke'
  (60%, from 12-20 s into a level, then every 18 s less 0.9 s a level, two at
  once from level 4), only its holder clears it, `WIRE_WIPES` (4) wipes. What
  changed is how it looks and is wiped: the generic smoke on one control is
  gone, and each place has its own surprise over the panel (`wrFx*` in
  `JS_RoomWire.html`, a canvas the finger clears, built in `wrFxPaint` from
  `you.panel[].b` on every paint):
  - **the microbus: a sandstorm over the half of the panel the broken control
    is in** (`wrFxZones`: 'top' or 'bottom' by the control's middle; two
    breaks in both halves cover it all); swipe it: the finger leaves a clean
    trail in the sand;
  - **the kitchen: steam fogging the whole panel**, mum's note kept readable
    above it (`z-index`); rub it: the finger leaves a wiped streak;
  - **the wedding: a power cut, the whole mixer dark**; the finger is the
    torch (a round of light under it while it is down) and the lights come
    back a step with every wipe (`--left` on the canvas's opacity).
  Every `WR_FX_STEP` (56 px, or a fifth of a wide layer) of the finger's
  travel is one wipe, and so is a tap, so the old four taps still clear it
  (Enter / Space too, the layer is a button). The layer takes the touches
  over what it covers - in the sand, the other controls of that half are
  under it too until it is cleared (decided while building: a cover you can
  tap through would not read as a cover). Wiped clean: the cover fades
  (0.4 s) and the phone stamps «برافو! كمّل» (the `fixed` event). A phone with
  motion off (`motionOff`): the cover is there at once and gone at once (no
  blow-in, steam rising or flicker); the finger's trail and the torch are the
  finger's own, so they are drawn there too. **The TV says on whose panel**:
  the toast «🌪️ لوحة كريم: عاصفة رملية — اسحبها!» (♨️ steam, 🔌 the power
  cut; `wr_tv_fx_*`), and while it lasts a veil over the scene (sand
  streaks, a steam haze, the stage dimmed; `.wr-tvfx`) with a tag «لوحة كريم».
  The server now says whose panel is covered: `shared.cover { pid: n }`
  (`wireWrite`, a count per phone, never the control; the break event already
  named the panel). Rules test: "the table is told whose panel is covered,
  not which control".
- **796 «نهاية الحكاية», look أ «المشهد بيكمّل»**. At the game's end the TV no
  longer lays a card over the scene: its frame is the ending (`wrTvEndHtml`;
  `TV_GAMES.wire.sig` carries the levels, why, the best), the place's scene
  full screen, played once per deal and only just after the game ended (a
  `lost` event under 6 s old and `motionFirst`), the count rising (`countUp`)
  in a corner badge with the ending's line, and after the scene (2.9 s) why it
  ended, the room's best and the host's buttons. **The tiers, decided while
  building** (the sheet said "the oasis from 6, the middle 2-4" and showed the
  kitchen's good ending at 5): under 2 levels the bad ending, 2-4 the middle,
  5 and more the good one (`WR_END_MID`, `WR_END_GOOD`, `wrEndTier`):
  - the microbus drives in from the road's start and stops past the sign,
    broken down and steaming (bad), a little short of the oasis, steaming
    (middle), or rolls into the oasis; the sign reads «الواحة N كم» or
    «وصلنا!»;
  - the kitchen: the plates fill one by one (all, half, none), the guests eat
    their fill, half of them are still hungry, or all walk off to the door;
  - the wedding: the lanterns come on one by one over the zaffa (all, half),
    or the lights flicker and die and the guests hold up their phones.
  Confetti after a good ending or a new best (`afterReveal`). Every end state
  is the element's own value and the animations only run from the start
  (`.is-play`), so a TV with motion off, reloaded or joining later draws the
  ending as it ends. The badge sits top right in both languages (the scenes
  are drawn left to right; the kitchen's door is on the left). The phones'
  end card shows the ending's line too (`wrEndLine`). Words `wr_end_*`.

## History

The day-by-day log of the work on this game is in `notes/log.md` (search it for the game's name); a new entry goes there, and anything that changes how the game works goes in this file.
