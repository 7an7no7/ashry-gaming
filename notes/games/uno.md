# أونو (id `uno`)

Moved from GEMINI.md on 30 Sep 2026. GEMINI.md keeps the rules that apply to every game and an index; this file keeps the detail, word for word.

## From GEMINI.md: The owner's specs, as built

- **أونو (Uno)** - the owner's spec of 21 Sep 2026, asked one rule at a time
  (*أونو in rooms*, *أونو on the phones and the TV*):
  - **The deck** is the standard 108 (each colour one 0 and two of every 1-9,
    Skip, Reverse and +2; four wilds and four wild +4s), 7 cards each; up to
    ten players one deck, eleven and twelve two decks shuffled together. The
    card turned up: a wild +4 goes back and another is turned; a wild lets the
    first player pick the colour; an action card acts on the first player. The
    draw pile running out: the pile but its top card is shuffled into a new one.
  - **Playing**: the colour, the number or the symbol, or a wild; **a +4 any
    time, no challenge**.
  - **Drawing, the official rule in the owner's words**: can't (or won't) play,
    draw one; if it fits you may play it at once or keep it and the turn ends;
    after drawing no other card from the hand. **"Draw until you can play"** is
    a lobby switch, off.
  - **Stacking** is a switch, **on by default** (the owner's table plays it),
    with a choice shown only then: **"+2 on +2, +4 on +4 only"** (default) or
    **"also +4 on a +2"** (a +2 never answers a +4). Facing a draw you stack it
    on or take the whole pile and lose the turn; without stacking the next
    player just draws and is skipped.
  - **7-0** (7 swaps your hand with a player you pick, 0 passes every hand on
    one seat) and **jump in** (the very same card as the top one, never a wild,
    out of turn; play carries on from you) are switches, off.
  - **Skip** skips; **Reverse** turns the direction (a Skip with two players).
  - **UNO: "press it, or get caught"**: the button shows with two cards (before
    or with the second to last) or one; down to one card without it, anyone else
    can press **امسكه!** until the next move, and caught means two cards.
    Computer players always say it, but an easy one sometimes forgets; a hard
    one catches whoever forgets, after a human moment.
  - **Game length**: **one round, first out wins** (the default) or **3 / 5 / 7
    rounds with points** (the winner scores the cards left in the other hands:
    face value, Skip/Reverse/+2 20, wilds 50; most points wins). "First to 500"
    was put to the owner and rejected. **One round has no points at all**
    (the owner's "No points", checked 21 Sep 2026 when the first build showed
    "+135"): the result says who won, the hands turn over for the table to see,
    and the board is the wins, counted across play again.
  - **A turn clock** (off, 30 or 60 seconds): when it runs out the phone plays
    for the player - takes a waiting draw, or draws one and passes - and the
    host has a skip for a phone that went quiet. A card drawn that fits leaves
    at least 10 seconds to play or keep it (`UNO_DRAW_MS`).
  - **Up to 12 players**: a 13th is refused at the start (`UNO_MAX_PLAYERS`).
  - **Cards you can play are always lit** (no switch); one that can't is refused.
  - **Every lobby choice is remembered** on the host's phone.
  - **Computer players**: easy plays the first card that fits; hard plays to
    win (keeps wilds, names its strongest colour, hits a player close to going
    out, stacks, sheds big cards when anyone is close, says UNO, catches) - both
    only from their own hand and what the table sees.
  - **The look** the owner picked, option أ "بلوكات" from a design sheet, the
    family of سكرو's cards (*أونو on the phones and the TV*), and **motion on
    every move that can have one**.
  - **The play area first** (21 Sep 2026, for every screen): while a round is
    played the pile and your hand get most of the screen, the seats, names and
    counts are a compact strip (a ring on the TV); the results may take over
    once the round is done.

## From GEMINI.md: Decided, and why

- **أونو's edge cases, decided while building it** (21 Sep 2026; each is one
  place in `RoomUno.js` if the owner wants another): a 7 or 0 as your last card
  ends the round with no swap; a hand of one that arrives by a 7 or a 0 can't be
  caught (only playing down to one counts), and a hand that changes owners
  forgets its UNO; the catch window closes at the next move anyone makes (a
  play, a draw, a take, a keep, a colour, a jump, the clock) and never on an UNO
  or a catch; UNO said with two cards is forgotten if the hand grows again
  (`g.saidAt` keeps the count it was said at, and `unoSync` drops the call
  once the hand has grown past it - before 22 Sep 2026 a card drawn back up to
  two left an old call standing, and the player could not be caught); a
  +2 or +4 as the last card still makes the next player draw (the whole stack),
  and those cards count (Mattel's rule); a Reverse turned up lets the dealer
  start the other way (Mattel's rule) and a +2 turned up with stacking on waits
  on the first player, who may stack on it; a jump in may land while the player
  up holds a card they drew (it stays in their hand) and on a +2 still waiting
  (the same +2 raises it, and it waits on the player after the jumper), never
  with a wild and never before the first colour; nothing left to draw passes
  the turn; a one-round game's board is the wins of the evening at this game
  (`shared.wins`, kept by play again, started over by a game from the hub), so
  the night's table ranks whoever won most; a game left with one player ends,
  that player winning a one-round game (not counted as a win).
  On the phone a card is played with one tap (سكرو picks, then confirms): Uno
  is quick and a jump in is a race, and a card that can't go is shaken and
  refused on the phone without a round trip.

## From GEMINI.md: Multiplayer rooms

**أونو in rooms** (`unoAction` in `RoomUno.js`, bundled after `RoomGames.js`;
the cards in `UnoCards.js`), the owner's spec (see *The owner's specs*).

- **Cards.** A kind is colour + value (`r7`, `gs` skip, `bv` reverse, `yd`
  +2) or `w` / `w4`; in play a card is `{ i, k }`, `i` a random id for the
  round (never published while the card is in a hand or the deck), and a wild
  on the pile carries `c`, its colour. `unoCanPlay(k, top, color, pending,
  settings)` is the one rule for what goes on what, stacking included; the
  phone lights cards with the same function.
- **What is hidden.** `room._uno` holds the deck, the whole pile, every hand
  and the id of a card just drawn; `room.secrets[pid]` is that phone's hand and
  `drawn`. `shared` carries `counts`, the top of the pile (`pile`, the last 8),
  `color`, `dir`, `turn { pid, stage }`, `pending { n, kind }` (a stacked draw:
  `kind` is the last draw card, `d` or `w4`), `said` (who has said UNO),
  `unoCatch` (who can be caught right now), `scores`, `board`, `results` and the
  events (`shared.events`, the last 40, `shared.eventSeq`): `deal`, `play`
  (with `jump`, `uno`, `color`, `left`, `pending`), `skip`, `reverse`, `hit`,
  `draw`, `take`, `keep`, `pass`, `color`, `uno`, `caught`, `swap`, `rotate`,
  `reshuffle`, `auto`, `win`, `left` - a draw says how many, never which.
- **A turn** (`turn.stage`): `color` when the round opened on a wild
  (`pickColor`), then `play` (`play { card, color?, target?, uno? }`, `draw`,
  or `take` when a draw waits), and `drawn` when the card drawn fits (`play`
  that card only, or `keep`). Out of turn: `callUno`, `catchUno { target }`,
  and with jump in `jump { card, top }`. Turn moves carry `seq`
  (`shared.turnSeq`, raised at every turn start and stage change) and a jump the
  id of the top card it aimed at: a late tap is dropped. The host's
  `skipTurn` and the clock (`unoDeadline` / `unoTimeout`) do the same thing:
  take a waiting draw, keep a drawn card, or draw one and pass.
- **The end.** `unoEndRound` counts the other hands (`unoHandPoints`); rounds
  mode banks it (`roundOver`, the host's `nextRound`, the first seat moving on
  one each round - from the last starter, `s.start`, so a leaver skips nobody;
  a starter who left leaves `s.startSeat`), one round adds a win to `shared.wins` and goes straight to
  `gameover` - the points are still in `results` but no screen shows them. A player who leaves
  (`unoPlayerLeft`) puts their cards under the deck and passes their turn; fewer
  than two ends the game.
- **Computer players** (`ROOM_BOT_GAMES.uno`): `pending` puts a hard bot's
  catch first (1.5-2.6s, a human's moment), then a hard bot's jump in, then the
  bot up - which waits 2.8-3.6s while somebody can be caught, so the table gets
  its chance. Easy plays the first card that fits and forgets UNO one time in
  three; hard scores each card that fits (`unoBotBest`: keep wilds, stay in the
  colour it holds most, hit a next player with two cards or fewer, shed big
  cards when anyone is close, swap with the smallest hand on a 7, a 0 only when
  the hand coming is smaller). `rules.mjs` plays 45 whole bot games across every
  variant and checks that no bot move is ever refused and no card is lost.

**أونو on the phones and the TV** (`JS_RoomUno.html`, `ROOM_GAMES.uno` and
`TV_GAMES.uno`; section 20 of `Style.html`).

- **The cards the owner picked** (option أ "بلوكات", the family of سكرو's): the
  whole card in its colour (`--uno-r` `#e5383b`, `--uno-y` `#f5b400` with dark
  ink, `--uno-g` `#1f9d55`, `--uno-b` `#1e6fd9`, the same in both themes) with a
  soft shine, a big Baloo numeral or a line icon (Skip a slashed circle,
  Reverse two arrows), the value small at the top of the reading direction's
  start and turned at the other end (so a hand overlapped in Arabic still shows
  it; a 6 and a 9 are underlined), the wilds near black with a four-colour
  wheel (the +4 over it), the back violet and dotted with "A.". One builder,
  `unoCardHtml(k, { size, color })`, sized by `--uno-w`, 1:1.5.
- **The play area first** (the owner, 21 Sep 2026): the other players are one
  strip of compact chips (avatar, name, a fan of backs with the count on it,
  أونو in red at one card; a sideways scroll on a phone, turned to the player
  up by `unoOppsInView`, fading at its edges), then the pile across the width,
  your hand (`unoFitHand` overlaps a row that doesn't fit, rows of up to 12),
  the bar, the last moves. A phone on its side puts the pile beside the hand
  and the bar; from 900px the pile spans the width and the hand sits beside the
  bar, cards sized by the screen's height. The TV is a ring of chips along the
  top and back along the bottom round a big table, the turn and the moves
  beside it. Measured with twelve at the table: the play area is 59-66% of the
  height and 87-95% of the width of a laptop player's screen, the TV's table
  65% by 66-69%, with nothing to scroll.
- **Playing.** One tap plays a card; a wild asks for its colour and a 7 (7-0)
  for a partner in the bar (`unoLocal.pick`); a card that can't go shakes. The
  bar carries the draw or take, play-or-keep after a draw, **أونو!** (two cards,
  or one not said yet - big and pulsing while you can be caught) and, for
  everyone else, **امسكه!**. `roomTurnOf` answers for the player up. A
  tapped card rises at once (`is-sent`, a `translate` on top of the
  screen's own lift for a playable card) while the server is asked - an
  iPhone has no buzz to say the tap landed - and flies from there; refused,
  it settles back.
- **Your own move never waits for the table** (the owner, 21 Sep 2026: a
  Skip and then the next card "takes a sec"). A new state normally waits
  while the last move's flights land (`unoFx.busyUntil`), so everyone sees
  each move in turn - but a Skip is ~1s of motion, and your next card sat
  behind it, 160-840ms after the server had already taken it (mean 480ms,
  measured against a bot). `unoOwnMoveWaiting` sees an event this phone made
  among the unshown ones (a card, a draw, a take, a keep, a colour, أونو!, a
  catch) and the table is redrawn at once: nothing is cancelled, what was
  still in the air plays on over the new table, and the places it is flying
  to stay hidden until it lands (`unoHeldKeys` / `unoHoldAgain` carry the
  holds across the redraw; a flight from before a new deal releases nothing,
  `unoFx.gen`). Other players' moves still wait their turn.
- **Motion on every move.** Each event plays once per device (`unoEventsToPlay`,
  keyed on the deal), flying between exact places measured just before the
  redraw (`data-uno-at`: `deck`, `pile`, `color`, `dir`, `pending`,
  `seat:<pid>`, `card:<id>`): the deal round the table and into your hand
  turning up, a card from a hand onto the pile with a turn, cards from the deck
  to a seat (backs) or into your hand (turning up, the new ones found by
  diffing the hand), ⊘ stamped on a skipped seat, the direction arrow spinning,
  a wild's colour rippling out of the pile, the +N growing on a stack,
  **أونو!** bursting from a seat, a catch stamped and its two cards flying, two
  hands crossing for a 7 and every hand moving on for a 0, the riffle of a
  reshuffle. The round's last card lands on the table before the result
  (`unoPlayEnding`), whose hands turn over one by one and whose points count
  up; the game ends on a podium with confetti. `motionOff()` gives the end
  state without any of it; a phone back from the lock screen replays nothing.
  Four short sounds (`unoCard`, `unoDraw`, `unoShout`, `unoCatch`) are added to
  `FX` from `JS_RoomUno.html`; with a big screen in the room only the TV plays
  the table's sounds, a phone its own moves.
- **Bidi.** A "+2", "+4" or "+85" inside an Arabic line is held left to right
  (`unoT` wraps it in LRI...PDI, and card names do the same), or it reads
  "2+".

## «أونو اتنين اتنين» (teams of two): answered, not built yet (the owner, 2 Oct 2026)

Picked from the ideas page of 2 Oct 2026 (https://claude.ai/artifact/7Mhgw1ePSi3GhgEvDcSHxz, idea numbers in brackets) and every rule asked.

- **(268) Partners, seated opposite each other** (play goes A1, B1, A2, B2…).
  - **Everyone picks a team** in the lobby; **every team is exactly two**, as many teams as pairs (4, 6, 8, 10 or 12 players). Start says who still has no partner; a computer player can fill an empty seat.
  - **The first partner out wins the round for both.** In rounds mode the pair scores the cards left in every opponent's hand; the partner's own leftover cards don't count against them.
  - **A Skip, +2 or +4 can't land on your own partner**: the phone refuses it and says why (it can only happen next to your partner, after a Reverse).
  - **You always see your partner's card count**, and can send one of three quick signals everyone sees: a colour (🔴🟢🔵🟡), «الحقني» or «سيبه ليا». Never the cards themselves.
  - A lobby switch, off by default; the normal game is unchanged.

## History

The day-by-day log of the work on this game is in `notes/log.md` (search it for the game's name); a new entry goes there, and anything that changes how the game works goes in this file.
