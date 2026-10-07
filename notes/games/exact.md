# حط إيدك! (id `exact`, first called بالظبط ٣!)

Moved from GEMINI.md on 30 Sep 2026. GEMINI.md keeps the rules that apply to every game and an index; this file keeps the detail, word for word.

## From GEMINI.md: The owner's specs, as built

  - **حط إيدك! / "Hands Down!"** (first called «بالظبط ٣!»; renamed by the
    owner, 29 Sep 2026, on the recommendation: that name covered one order of
    fourteen; ids stay `exact`) (reflex sync): an order for all at once after a countdown
    («بالظبط ٣ منكم يدوسوا!», in order, «محدش يدوس», all at the same
    instant, the pulse in sequence). **Lives are the table's** (co-op, a
    room's best). **A wrong count: the table loses a life and the screen
    shows who was extra** (laughing, not shaming). **Only orders the phone
    can judge** (no battery - iPhone can't read it - no "wearing red" or
    "the youngest"). **Until the lives run out, getting harder.** **3-12
    players, no TV needed.** Taps judged by the phones' stamps of the
    server's time, as الكراسي الموسيقية. **Every order is about the phone
    only** (the owner, 29 Sep 2026, again: "all related to the phone so you
    know who failed" - nothing about the body, clothes, age or anything the
    phone can't see): counts, timing, order, holding, releasing, tapping a
    number of times, a colour or shape on your own screen, and the like;
    the server knows exactly who got it wrong. **The owner: improve the
    orders, the animation and the flow of a game while building.**
    **The look: أ «إيد على الترابيزة», improved** (the owner, 29 Sep 2026,
    from https://claude.ai/artifact/HyhEyTCYt2fBCYiHJh9UoU): a wooden table
    from above with a seat each, the order a paper card in the middle, the
    phone a pad you put your hand on; the reveal slams cartoon hands down in
    the order pressed. The owner's additions: **the extra hand gets a slap**
    (the others slap it lightly and it pulls back - laughing, not shaming);
    **the table fills as you win** (each level puts something on it: tea,
    foul, kahk) **and the lives are tea glasses that spill**; **in «محدش
    يدوس» the hands hover and tremble over the table**, and a hand that
    presses gets stung. (A photo-finish replay and each player's own hand
    were offered and not chosen.) A second sheet of three new worlds (a
    free-kick wall, a pigeon roof, a zaffa;
    https://claude.ai/artifact/V5zYDTFbbaud7qiPKRVaZk) was drawn at the
    owner's ask, and **the owner kept the improved table** (its fourth card,
    where a bee stings the hand that presses in the trap).
    **Built 29 Sep 2026** (*بالظبط ٣!*); decided while building (open to
    change, each in one place):
    - **Fourteen orders, all judged from the phones' own taps** (the deck,
      `EXACT_KINDS`, each with the level it first comes up at): exactly N
      hands down; everyone together (within a window that tightens with the
      level, 800 ms down to 220); everyone taps exactly N times; «محدش يحط
      إيده» (the trap, from level 2); in turn (a named order); exactly N
      still down at the bell; only those whose screen shows a colour, a shape
      or an odd / even number (from 3); the whole table taps exactly N times
      (from 3); the pulse round the table, a beat each (from 4); your secret
      numbers add up to exactly N (from 4, the longest read, it needs
      talking); down and lift on the counter at your own number, or lift one
      by one never two together, or do the opposite of your screen (from 5);
      exactly N of those whose screen shows… (from 6). A new order each level
      until all have come up, never the same twice running, the trap never
      within two of itself; round 1 is always «بالظبط ٣ منكم» (the game's
      name).
    - **Each order is read on a paper card during a countdown** (2.6-6 s by
      the order), then the pad opens for its window; an order already
      decided (everyone down, the trap pressed, the turn complete) closes
      0.3 s later instead of waiting out its window.
    - **Wrong names every hand that did it, and why**: extra (the latest
      down of one too many), missing, wrong screen, stung, early, late, the
      wrong number of taps, two let go together, out of turn - on the table
      as a bubble by the hand and a line under it («إيد منى زيادة 😂»),
      worded so it fits any name. A short count ("2 hands short") blames
      nobody.
    - **Three tea glasses; every fifth level cleared fills a spilt one
      again** (`EXACT_REFILL_EVERY`), so a good table plays on.
    - **The room's best is the orders cleared** (level − 1), kept across play
      again in the room; the night's board is each player's clean hands
      (orders they did right), not a win.
    - **The next order comes by itself** 3.6 s after a right one, 5.4 s after a
      wrong one (the slap, the bee, the spill); the host (or anyone once the
      host is away) can deal it sooner.
    - **Leaving mid-order deals the order again** (no glass lost: the numbers
      were for the old table); fewer than two ends the game; a latecomer
      watches and plays the next game. 3-12 people, no computer players.
    - **The voice** (the sounds of the slams, the slap, the bee, the spill) is
      the TV's, or the host's phone with no TV; your own tap clicks on your
      own phone.

### حط إيدك! (first بالظبط ٣!)

The owner's rules are in *The owner's specs* (the five new room games). Game
id `exact` everywhere (`room-exact`, `ROOM_GAMES.exact`, `TV_GAMES.exact`, the
catalog, the help); the rules are named `exact` / `EXACT_`, the page's code
`ex` / `EX_`, the stylesheet section 58 (`.ex-*`). Rooms only, 3-12 people,
the party section, orange, a drawn icon (`art:exact`: a paper card with a 3
and a hand on the table).

- **`RoomExact.js`** (bundled last). `shared`: `roster`, `round` (every order
  dealt, redeals included), `level`, `lives` / `maxLives`, `best`, `record`,
  `seen` / `last` (the orders shown, for the deck), `clean` (each player's
  right orders) and `board`, `phase` ('ready' → 'go' → 'reveal' → … →
  'gameover'), `order` (`{ kind, fresh, n?, seq?, beat?, sync?, attr?, want?,
  lead?, step?, gap? }`), `readAt` / `goAt` / `endAt` / `closeAt`, `live`
  (`{ down, taps, order }`: whose hand is down, how many taps, the order hands
  came down in - what a table sees), `result` (the verdict: `ok`, `bad` by
  player with `why`, `short`, `presses` with their ms after go, `taps`,
  `total`, `sum`, `held`, `lets`, `reveal` - every screen's secret - `food`,
  `refill`, `final`) and `nextAt`, `reached`. `room._exact = { mine, ev }`:
  each phone's secret for the orders that deal one (a colour, a shape, a
  number, «اعكس»), and every tap's events, never projected; a phone's own
  secret is `room.secrets[pid] = { mine, round }` while its order is on.
  Moves: `start` / `playAgain` (the host), `down` / `up { round, at }` (`at`
  the phone's stamp of the server's time, kept only between go − 150 ms and
  its arrival - `EXACT_GRACE_MS` - else the arrival counts; a tap that turns
  up before the server's alarm opens the window opens it), `nextRound {
  round }` (a move-on action). `exactJudge` is the one rule for every order
  (the list of `why`s in its comment). `exactPlayerLeft` deals the order
  again with a new round number, so a stale tap from the old one is dropped.
- **`JS_RoomExact.html`** (look أ «إيد على الترابيزة», the fourth card of the
  sheet): the table from above in container units (`--th`), its wood, a seat
  a player - the first half along the far edge, the rest along the near one,
  turned so your own seat is in the near row - each a cartoon hand in the
  player's colour and a name plate; the order a paper card in the middle
  (`exOrderCardHtml`: the level, the order, its sub line, a draining meter
  during the go); the tray of tea glasses (`.ex-cup`: a glass and its puddle,
  `is-spilt`) and the food the table has earned (`exFoodSvg`, eight dishes in
  turn: bread, foul, ta'meya, pickles, watermelon, kahk, dates, kunafa). Under it the pad (`exPadHtml`): one big round
  button for your hand with your secret on it (`exSecretHtml`), pointer and
  keyboard (Space) wired in `exWirePad`, `exPadDown` / `exPadUp` sending the
  stamp (`exStamp`: `Date.now()` less the smallest `receivedAt − serverNow`
  seen). The pad and the table are drawn once for the whole order (the
  frame's signature says `play` for both ready and go), and `exTick` paints
  the countdown, the meter, the pulse's lit seat, the counter, the bell and
  the table's hands in place (`exPaintLive`) - a finger on the pad is never
  redrawn under it. The TV: the table big beside the order or the verdict,
  the podium and the record at the end (`.ex-tv--over`, half and half).
- **The reveal** (`exReveal`, keyed with `motionFirst` on the round, and
  `exFirstSight` marks a reveal or an ending already on the table as seen the
  first time the page sees the room, so a reload, a latecomer or a TV coming on
  replays nothing): the hands lift off, then slam down
  one by one in the order pressed (their ms after go); then the verdict card;
  then each wrong hand's moment - an extra one gets a slap from its
  neighbours and pulls back (`exSlap`), a hand in the trap is stung by a bee
  (`exBee`), a missing one gets «كنت فين؟» - and a glass spills, or a new dish
  lands on the table (a glass fills again on a refill). The line under the
  table waits for the moments (`afterReveal`). In «محدش يحط إيده» the hands
  hover and tremble over the table while the window is open. The end: the
  level reached counting up, «رقم جديد للأوضة!», confetti, the podium of
  clean hands.
- Tests: `rules.mjs` ("Exactly 3": every order right and wrong, the stamps'
  clamp, the early close, the lives and the refill, the record, stale taps,
  the host away, leaving mid-order), `leaks.mjs` (`PROBES.exact`: a phone's
  secret on its own phone only and nobody's on the table before the verdict;
  proved by leaking both in a scratch build; `DRIVERS.exact`: five people
  from level 6 until every order has come up), `play-all.mjs`
  (`--only=exact`: four phones and a watcher on a live server, a right order
  and wrong ones to the end, play again with a latecomer, a leave mid-order).

- **A late alarm** (the audit of 6 Oct 2026): `exactTimeout` that opens the window after its `closeAt` closes it in the same pass, so the verdict never waits the room's 30 s rest.

## The ideas of 7 Oct 2026 (the owner's picks): built

- **820 الإيد الدهب** (no extra rule asked; built as described). `shared.streak`
  counts each hand's right orders in a row ("right" as the clean hands count
  it: not named in the verdict's `bad`); a mistake sets it to 0. At
  `EXACT_GOLD_AT` (5) the hand wears a gold ring (`result.ringWon`), and loses
  it on its next mistake (`result.ringLost`); `exactClose` does both. Chosen:
  the +1 counts **while the ring is worn** - the board's score is the clean
  hands plus 1 for a ring still on (`exactBoard`), so the night banks it only
  if it is protected to the end, and a lost ring takes its +1 with it; a ring
  kept past five is still one +1. On the table (phone and TV alike): a gold
  band with a stone on the hand's ring finger (`.ex-gold` in `exHandSvg`,
  `has-ring` on the seat, `exRingsPaint`), a gold glow round the hand; in the
  reveal the rings stay as they were until the verdict's moments, then a new
  one shines on with a «💍 إيد دهب!» bubble and a chime, a lost one slips off
  (`exRingsMoment`). Leaving drops the streak.
- Tests: `rules.mjs` ("Exactly 3": four in a row no ring, the fifth rings
  every right hand, +1 while worn, a mistake takes one ring and its +1).

## History

The day-by-day log of the work on this game is in `notes/log.md` (search it for the game's name); a new entry goes there, and anything that changes how the game works goes in this file.
