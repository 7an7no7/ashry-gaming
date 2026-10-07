# المزاد (id `box`)

Moved from GEMINI.md on 30 Sep 2026. GEMINI.md keeps the rules that apply to every game and an index; this file keeps the detail, word for word.

## From GEMINI.md: The owner's specs, as built

  - **المزاد** (bluffing auction; first called «مزاد خان الخليلي»):
    8 boxes on the TV (a treasure,
    a scorpion, «اسرق نص فلوس الأول»…), each phone one secret clue about
    the box, a minute of talk, then **a secret bid once** (highest takes
    it and pays), the box opens slowly. **Clues always true; lies come from
    people only.** **No computer players.** **8 boxes, 3-8 players.** The
    most money at the end wins.
    **The name: «المزاد» / "The Auction"** (the owner, 29 Sep 2026, after it
    was built as «افتح يا صندوق», the studio's name; «مزاد خان الخليلي» went
    with the old place; the host's drumroll still shouts «افتح يا صندوق!»).
    **The look: أ «استوديو الصندوق»** (the owner, 29 Sep 2026, from a second
    sheet, https://claude.ai/artifact/NUru7oBeMjHrECDpiXCynv - the first,
    Khan el-Khalili, was rejected: ordinary drawing, a dull opening, a
    crowded phone, and another place wanted): a TV game-show studio, the
    players at podiums with LED screens, a red lacquer box with a gold bow
    on a turntable; the opening is the star (a drumroll, the box shaking,
    light from the cracks, 3-2-1, a flash, the lid flying off: a coin
    fountain, or a funny scorpion in a bow tie and top hat scattering the
    winner's coins); the phone one step at a time (the clue, held to read;
    the bid, one big number with +/− and chips; waiting).
    **Built 29 Sep 2026** (*المزاد*); decided while building (open to
    change, each in one place):
    - **Everyone starts with 1,000 ج** (`BOX_START_MONEY`, play money).
    - **The eight boxes** (`boxDeal`): three treasures of 300-800 (in
      hundreds), a scorpion, and four more drawn from a thief, double or
      nothing, a key, a bill, an empty box, a fourth treasure and a second
      scorpion, shuffled; a key is never the last box.
    - **What each does to whoever takes it**: a treasure pays its value; the
      scorpion scatters 300 of their money (`BOX_SCORPION`, never below 0);
      the bill pays 50 to every other player (`BOX_BILL`); the thief takes
      half the money of the richest other player (to the nearest 10; ties by
      seat order); double or nothing tosses a coin - heads, twice the bid
      back; tails, nothing; the key shows them the next box, on their phone
      only, until that box opens; the empty box does nothing. The bid is paid
      first, whatever is inside.
    - **The clues** (`boxClueCandidates`): every clue is true of its box and
      none names it outright - "not a …", what it does (you gain, you lose,
      no money moves, it touches another player, it touches only you, luck
      decides, something shiny, something alive), "one of these two / three",
      a treasure's "more / less than …", and "the same kind as the last box /
      not". Every phone gets a different one, strong and weak mixed
      (`boxDealClues`), so the table has to pool them - and lies.
    - **The clock**: a minute of talk (`BOX_TALK_MS`), then 20 more seconds
      of «آخر نداء» (`BOX_LAST_CALL_MS`); a bid can be sent at any time in
      either, and **the box opens as soon as everyone has bid**. The host (or
      a stand-in once the host is away) can end the talk early («كفاية كلام،
      زايدوا») or open the box on the bids so far.
    - **A bid is sent once and locked**, up to the money you have; **0 is a
      pass**. Nobody bidding anything opens the box with nobody taking it.
    - **A tie goes to the poorer of the tied, then by lot** (said on every
      screen: «تعادل! راح للي فلوسه أقل» / «تعادل! والقرعة اختارت»).
    - **The opening is 10.6 s** (`BOX_SHOW_MS`) and **the next box comes by
      itself 6 s after it** (`BOX_AFTER_MS`, a countdown on every screen);
      the host can move on sooner once the show is done. The strips'
      money keeps the old numbers until the next box, so nothing tells the
      table before the show does.
    - **The most money after the eighth box wins** (ties share it), a podium
      and the night's board.
    - **Leaving**: a leaver's bid and clue go with them; if everyone left has
      bid, the box opens; fewer than two ends the game. A latecomer watches
      and plays the next game.
    - **The TV is the room's one voice** (the drumroll, the ticks, the boom,
      the coins, the scorpion); with no TV the host's phone.

### المزاد

The owner's rules are in *The owner's specs* (the five new room games). Game
id `box` everywhere (`room-box`, `ROOM_GAMES.box`, `TV_GAMES.box`, the
catalog, the help); the rules are named `box` / `BOX_`, the page's code
`bx` / `BX_`, the stylesheet section 59 (`.bx-*`). Rooms only, 3-8 people, no
computer players, the TV optional.

- **`RoomBox.js`** (bundled last, dispatched from `applyRoomAction`):
  `room._box = { deck, clues, bids, peeks }`, never projected - the eight
  boxes (`{ kind, value }`), each phone's clue for the box up, the bids of
  the box up, and a key's peeks (`{ pid: { box, kind, value } }`). A phone's
  slice is `{ box, clue, bid, peek }` (`boxWriteSecrets`): its clue and its
  own bid while the box is up, and a peek from the moment its key opens
  until the box it shows opens. `shared`: `roster`, `order`, `money`, `box`
  (0-7), `phase` ('talk' → 'bid' → 'open' → … → 'gameover'), `done` (who
  has bid, never how much), `talkEndsAt`, `bidEndsAt`, `openAt`, `nextAt`,
  `result` (`{ box, kind, value, bids, winnerId, bid, tie, tieBy, coin,
  victimId, peekFor, before, delta, moves }` - the bids published only
  here), `opened` (every box opened so far), `board` (money, richest first;
  **during an opening the money from before it**, `boxBoard`). Moves:
  `start` / `playAgain` (the host), `bid { box, amount }` (once, clamped to
  the money), the move-on actions `openBids` (the talk ends), `closeBids`
  (open on the bids so far) and `nextBox` (only once the show is nearly
  over); each carries `box` (`staleTap`). `boxClueTrue` is the one test a
  clue is held to, by the rules tests and the dealing alike.
- **`JS_RoomBox.html`** (look أ «استوديو الصندوق»):
  - **The studio** is one SVG scene of 1280 × 720 (`bxSceneSvg`: the
    arches, the lights, the turntable, the lacquer box with its bow,
    `bxBoxSvg`, and what is inside it, `bxObjectSvg`, drawn per kind: coins
    and gems, the scorpion in its bow tie and top hat `BX_SCORP`, a bill, a
    mask, a spinning coin, a key, a puff of dust), the podiums with their LED
    screens (`bxPodSvg`, placed by `bxSeats` either side of the turntable,
    four a side smaller), and a canvas over it for the particles; the words
    over it are HTML (`bxStageHtml`: the tag, the banner, the big word).
    Every id in the SVG carries the screen's suffix, so a phone and the TV
    can hold one each.
  - **The show** (`bxRunShow`) is a timeline from the server's `openAt`
    (read through the smallest `receivedAt − serverNow`, `bx.gap`), so a
    redraw or a reload in the middle seeks to where it is: the bids light up
    on the podiums, the winner pays (coins flying to the box), the drumroll
    and the shaking, light from the cracks, 3-2-1, the flash and the lid
    flying (`BX_TB`), then the box's own reveal - a coin fountain and
    confetti, the scorpion jumping out and scattering the winner's coins, a
    bill paying round the table, the thief's mask and the stolen coins, the
    coin toss, the key's glint, a sad puff - and the money on the podiums
    counting to their new numbers. Every event plays once (`ev`, the time it
    passes); the phone's own delta pops at the end (`.bx-mine`).
  - **The phone** is one step at a time (`bxStep`, remembered in
    sessionStorage so a reload comes back to it): the clue on a
    `.hold-card` (hold to read), the bid (one big number, − / +, the chips
    +50, +100, all in and zero, «أكّد المزايدة 🔒»), then waiting with who has
    bid as ticked avatars; during the opening a cropped view of the studio
    (`bx-stage--crop`) with the bids as chips. The opened boxes are a strip
    of icons (`bxOpenedHtml`); the end is the podium and the board.
  - **The TV** (`TV_GAMES.box`) is the whole studio as big as the screen
    allows, the talk's clock and the table's line beside it, the next box's
    countdown and the host's buttons under it; the end, the podium beside
    the board.
  - Sounds (`bxSound`: a whoosh, the drumroll, ticks, the boom, coins, a
    fanfare, a boing, a sneak, paper, a spin, a chime, a sad trombone) on
    the room's one voice. `roomTurnOf` asks a player who hasn't bid.
- **Layout** (section 59): upright one column; a phone on its side and from
  900 px the clue or the bid beside the studio's crop. The TV: a size
  container, the stage `min(100cqw, (100cqh − 9vmin) × 16/9)`.
- Tests: `rules.mjs` ("Open the box": the deck, every clue true against its
  own test over 150 games, the bids, ties to the poorer and by lot, every
  effect, paying, the end, leaving, the host's actions, the board kept during
  an opening), `leaks.mjs` (`PROBES.box`: the box's kind and another's clue
  on no phone before its opening, the bids on no other phone until all are
  in, a peek only on the key's holder - proved by leaking each in a scratch
  build; `DRIVERS.box`: five people, a key forced, a box on the clock, the
  host's calls, a leaver), `play-all.mjs` (`--only=box`: four phones and a TV
  through eight boxes, a leaver at the fifth, play again with the latecomer).

## The ideas of 7 Oct 2026 (the owner's picks): built

- **834 عرض الحاج** The owner: twice a game, at two random boxes (never the
  finale), 8 s to take the money or open. Built: `room._box.offerAt` (two of
  boxes 1-7, drawn at the start, secret). When the bids of such a box are in and
  someone won it, `boxOpen` stops at a new phase **'offer'** (the winner and the
  tie are decided, `room._box.pending`; nothing paid yet) with `shared.offer = {
  winnerId, bid, amount, endsAt }` (`BOX_OFFER_MS` 8000, on the server's clock).
  The amount (`boxOfferAmount`, chosen): 85% of the bid plus 45% of what the
  boxes still on the table (this one included) are worth on average to their
  taker, give or take a tenth, at least 50, to the 10. The winner's `deal { box,
  take }` (stale box dropped; anyone else ignored): taken - the winner pays the
  bid and pockets the offer, the box is opened only to be seen (no effect, no
  key's peek, no coin toss: `result.deal`); turned down, no answer in 8 s, or
  the winner leaving (nobody takes it then) - the box opens as always
  (`boxApply`, `result.offer` kept for the show). The phone (`bxPhoneOfferHtml`):
  the studio's crop, «🎩 عرض الحاج», the amount, the 8 s bar, and the winner's two
  buttons «💰 هات الفلوس» / «📦 لأ، افتح الصندوق!» (`bxDeal`); everyone else «…ياخد
  ولا يفتح؟ زعّقوا!». The TV: the banner and an offer card over the stage with
  the clock. A phone-ring sound on the voice. The show then says «خد … من الحاج!
  نشوف ساب إيه…» or «رفض عرض الحاج!», and a taken box's line is «… وكان جواه: …»
  with the money flying from above the stage. (`roomTurnOf` in
  `rooms/JS_RoomTurn.html` was left alone: the offer is 8 s on every screen.)
- **836 تأمين** (no extra rule asked). With the bid, `insure: true` (an older
  phone sends none): 50 (`BOX_INSURE`) on top, so the bid is capped 50 under the
  money, and refused without the 50. Chosen: the premium is paid at the opening
  by everyone who insured, whoever takes the box (like any insurance). An
  insured winner of a scorpion loses half of it; an insured victim of the
  thief loses half as much (`result.insPaid` says what it saved; the bill is not
  covered). Secret until the opening (`room._box.insured`; the phone's own slice
  `insured`); then `result.insured` - a 🛡 by the bid on the podiums and the
  phone's chips, «🛡 −50» floating up, and the saving said in the result line.
  The phone's bid step has the switch-card «🛡️ تأمين بـ50 ج» (`bxIns`, `bxMaxBid`).
- **837 صندوق الختام** (no extra rule asked). `shared.finale` (7, the eighth box)
  is announced from the start: its cell in the strip is gold-rimmed with «×2», its
  talk has a «🏁 صندوق الختام: كل حاجة جواه ×2!» bar on the phones and the TV's
  banner, and it opens with its own longer drumroll and a cymbal (`drumBig`,
  also at its talk's start). Everything inside counts double: the deck's
  treasure, scorpion (600) or bill (100 each) is doubled at the deal (so the
  clues and a key's peek tell the true value); the thief takes twice the half -
  everything, an insured victim half of that; heads pays four times the bid
  (chosen, for the thief and the coin). `result.x2`; the big word reads «×2 …».
  The finale never has an offer.
- Tests: `rules.mjs` ("Open the box": insurance paid by all who took it, half a
  scorpion, the cap, none without the 50, half of the thief's; the finale doubled
  in the deck, the thief and the coin; two offers never the finale, the offer
  phase and its clock, only the winner answers, taken, turned down, no answer,
  the winner leaving, none on the finale; the older tests start with no offers),
  `leaks.mjs` (the box shut and the insurance its own phone's through the
  offer; the driver takes an offer and insures), `play-all.mjs` (`--only=box`:
  an offer taken and one turned down when they come, an insured bid, the finale).

## History

The day-by-day log of the work on this game is in `notes/log.md` (search it for the game's name); a new entry goes there, and anything that changes how the game works goes in this file.
