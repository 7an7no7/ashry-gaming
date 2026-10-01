# جمجمة (id `skull`)

Moved from GEMINI.md on 30 Sep 2026. GEMINI.md keeps the rules that apply to every game and an index; this file keeps the detail, word for word.

## From GEMINI.md: The owner's specs, as built

  - **جمجمة**: **rooms and the TV only**, your discs secret on your own phone,
    every pile face down on the TV; **3-8 players**; 4 discs each (3 flowers, 1
    skull); **two won bets wins, or the last one in**; **a skull hit takes one
    of the bidder's discs at random**, and only the bidder sees which; **your
    own skull: you choose** what to lose; **the skull's owner starts the next
    round** (the bidder, if it was their own); **computer players easy and
    hard**; **the look: Egyptian flowers** (a rose, jasmine, a lotus on each
    player's own colour) and a skull drawn our way; **our twist, «هيعملها؟»**:
    before the flips everyone else taps ✅ or ❌ on their phone, a point for
    guessing right, shown in the reveal; a turn clock **off by default, 30 or
    60 seconds** (it adds a flower if it can, else passes). **Built 28 Sep
    2026** (*جمجمة*); what the owner didn't say was decided while building:
    - **Every seat's three flowers are the same flower** (rose, jasmine and
      lotus in turn round the table): with a different flower a disc, the
      table could work out from the flips, round by round, which disc a
      player had lost - and whether their skull is still in hand.
    - **Your own pile is turned over all at once**; a skull anywhere in it is
      your own skull, even when its flowers alone would have made the bet.
    - **A won bet: the bidder starts the next round**; your own skull with one
      disc left needs no choice (it goes, and you are out).
    - **«هيعملها؟» is 8 seconds, whatever the turn clock**, answered by
      everyone seated at the game and still in the room but the bidder - out
      players too (they are at the table); the answers are secret on the
      server until the result. Its points are a side tally for this game,
      shown on every result and at the end; the night's board is games won.
    - **The result stays 6.5 s, then the next round deals itself**; the host
      (or anyone once the host is away) can deal it sooner.
    - **The clock before a bet adds a flower, else the skull, and bets 1 only
      when the hand is empty** (nobody can pass before a bet). It used to bet
      when only the skull was left, which told the table so (the review of
      1 Oct 2026, the owner approved the fix); in the first laying it
      lays a flower, or the skull; the host's "play for" lays for every quiet
      phone at once.
    - **Leaving**: a pile leaves the table with its player; a bet above what is
      left shrinks to all of it (which ends the auction), and flowers already
      turned from that pile no longer count; **the bidder leaving calls the
      round off** (nobody wins or loses a disc) and the next seat starts;
      fewer than two ends the game, not counted as a win.
    - **Forced moves**: laying the one disc you have left, and turning your own
      pile over (the rule says the flips start there) - never a bet, a pass, a
      disc added or «هيعملها؟».
    - The piles stay on the table, the turned discs beside them, until the next
      round is dealt; a latecomer watches and is dealt in by play again.

### جمجمة

The owner's rules are in *The owner's specs* (السلم والتعبان and جمجمة). Game
id `skull` everywhere (`room-skull`, `ROOM_GAMES.skull`, `TV_GAMES.skull`, the
catalog, the help); the rules are named `skull` / `SKULL_`, the page's code
`skl` / `SKL_`, the stylesheet section 54 (`.skl-*`).

- **`Skull.js`** (shared, no DOM): `SKULL_FLOWERS`, `skullFlowerOf(seat)` (rose,
  jasmine, lotus in turn), `skullStartFaces`, `skullBidRange(total, bid)`, and
  the bots: `skullBotPlace`, `skullBotTurn` (add or open the bet), `skullBotRaise`,
  `skullBotGuess`, `skullBotFlip`, `skullBotLose`, each a function of a view a
  bot may know (`skullBotView` in `RoomSkull.js`: its own hand and pile, the
  piles' sizes, the bids, the passes, the flips). Easy plays by luck; hard bids
  what its own pile and the tops of the others make likely, sets a trap with its
  skull now and then (a small bet over it, or the skull added on top), flips
  first the piles that look least like a skull (from the table: raises and
  discs added - the owner's word), and gives up a flower rather than its skull.
- **`RoomSkull.js`**: `room._skull = { discs, hands, piles, guesses, lost }` -
  every disc `{ i, f }` (ids at random across the table), the hands and piles
  as ids (a pile bottom to top), the «هيعملها؟» answers, and what each player
  lost (`{ i, f, round }`). Never projected. A phone's slice: `hand` and `pile`
  (faces), `discs` (all it has, to choose from), `lost` (only its own - only
  the bidder ever learns what a skull took), and its own `guess` while the flips
  wait. `shared`: `settings { turnClock }`, `order` (the seats, shuffled),
  `colors`, `flowers`, `alive`, `round`, `starter`, `phase` ('place' → 'add' →
  'bid' → 'guess' → 'flip' → ('lose') → 'result' → … → 'gameover'), `placed`,
  `turn { pid }`, `turnSeq`, `endsAt`, `bid { pid, n }`, `bids`, `passed`,
  `guessed` (who, never what), `guessEndsAt`, `flip { pid, n, got, own }`,
  `flipped` ([{ owner, f }], faces public once turned), `piles` / `hands` /
  `discs` (counts), `total`, `wins` (bets won this game), `guessPts`, `result`
  (the answers published here), `nextStarter`, `nextAt`, `winners`, `why`,
  `tally` / `board` (games won, across play again) and the events (`deal`,
  `round`, `place`, `add`, `bid`, `pass`, `won`, `guessed`, `flipOwn` with its
  faces, `flip` with its face, `betWon`, `skull`, `lost` - never its face -
  `out`, `void`, `shrink`, `auto`, `left`, `over`). Moves: `place { disc,
  round }` (all at once), `add { disc, seq }`, `bid { n, seq }`, `pass { seq }`,
  `guess { yes, round }`, `flip { target, seq }`, `lose { disc, seq }`, the
  host's (or a stand-in's) `skipTurn { seq }` and `nextRound { round }`,
  `start` / `playAgain { turnClock }`. The piles stay on the table through the
  result: `skullDealRound` puts every disc back in its hand.
- **`JS_RoomSkull.html`**: the discs are drawn our way (`sklDiscSvg`: the seat's
  colour as a rim, a cream face with a rose on two leaves, three jasmine sprigs
  or a Nile lotus, and a round friendly skull with shiny eyes, a grin and rosy
  cheeks; the back an eight-pointed star; flat cartoon with ink outlines, no
  ids). The phone: the head, the latest move, the table (`sklSeatHtml`: every
  seat a card in its colour - avatar, name, what it did, its pile face down with
  a count and the turned discs beside it, its mat with a rose once a bet is won,
  the discs it has left as dots, the hand's size), the bet (`sklBetHtml`: the
  bubble, a pip a flower to turn), your discs (`sklMineHtml`: the hand, what you
  laid, what you lost), and the bar (`sklActionsHtml`: pick a disc and lay it;
  add one or bet with number chips; raise or باص; ✅ / ❌ with the window
  draining and who has answered; «اقلب أقراصي», then a tap on a pile; the disc
  to lose). The result (`sklResultHtml`) stays beside the table: the outcome,
  your own lost disc (the bidder only), who guessed right, the countdown to the
  next round. The end: the winner's disc, the podium of bets won, the guesses
  and the night's board. The TV: the table big beside the head, whose turn, the
  bet, «هيعملها؟»'s answers (who, not what), the result, the log.
- **Motion** (`sklPlay`, the card games' flights from `JS_Cards.html`, keyed by
  `pcEventsToPlay` so a reload or a latecomer replays nothing): a disc flies from
  a seat (or from your hand) onto its pile, a bet pops on its seat, a pass, the
  auction won stamped «هيعملها؟», **the flips one by one** (`SKL_FLIP_STEP_MS`:
  `sklTurnOver` turns the disc where it lies - a flower blooms with a ring, the
  skull pops with «بوم!» and a shake), a won bet stamped «عملها!», a lost disc
  flying off face down (its face only on the bidder's phone), a player out; the
  result card waits for the flips (`sklRevealWait`, `--skl-wait`), then its
  guesses pop in; confetti after the podium. Sounds `sklDisc`, `sklBet`,
  `sklFlower`, `sklBoom` in `FX`; the TV is the room's one voice.
- `roomTurnOf`: a disc to lay, «هيعملها؟» to answer, or the player up. The
  catalog: ورق وطاولة (`group: 'table'`), rose, `players: [1, 8]`, a drawn icon
  (`art:skull`: a rose disc behind our skull on a disc).
- Tests: `rules.mjs` ("skull": the laying, adding, the bet's range and raises,
  passes final, the auction's end, «هيعملها؟» and its points, own pile first and
  from the top, a won bet and two, a skull on another pile and your own, out and
  the last one in, the clock in every phase, the host's "play for", stale taps,
  leaving in each phase, the forced moves, 36 whole games of bots, 3 to 8 at the
  table, easy and hard, every disc accounted for), `leaks.mjs` (`PROBES.skull`:
  a disc on its owner's phone only - a lost one too; a face on the table only
  where a disc was turned; the flips from the top of each pile; a lost face on
  no other phone; the answers hidden until the result - proved by leaking the
  answers, another's lost disc and a pile's faces in a scratch build; the driver
  plays again until a skull has taken a disc and a pile was half turned), and
  `play-all.mjs` (`--only=skull`: two people, a computer player and a TV to the
  end of a game, and play again).
- **The TV round a table (1 Oct 2026, the owner's sheet)**: `sklTvFrame` lays the
  seats round an oval table in the middle (`.skl-ring*`, section 54): the seats in
  turn order down one side and back up the other, one above the table from 3 and
  5 players and one below from 6 (7-8: three a side, smaller piles). Each seat is
  the phone's `sklSeatHtml` drawn big (the colour avatar, the name at 3.6vmin, the
  pile face down with its count and the turned discs, the bets won, the discs left,
  the hand); whose turn it is glows. The table holds the phase: «1/4» big and «كل
  واحد يحط قرص مقلوب» while discs are laid, otherwise whose turn it is and the bet
  (`sklBetHtml`, with the flip pips), «هيعملها؟» (`sklGuessHtml`) and the result
  (`sklResultHtml`, unboxed) - the table's corners open out for those two
  (`.is-wide`). The round, «رهانين = فوز» and the clock sit above; the latest move,
  the host's buttons (`data-skl-host`, refreshed in place) and the last two moves
  at the foot. The flights still find their places (`data-pc-at`: seat, pile, flip,
  and `mid` on the table). The end of the game keeps its own frame.

## History

The day-by-day log of the work on this game is in `notes/log.md` (search it for the game's name); a new entry goes there, and anything that changes how the game works goes in this file.
