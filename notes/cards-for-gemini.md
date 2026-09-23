# كدّاب and الشايب: what GEMINI.md should gain

Written by the agent that built the two games on its branch, for whoever
merges it into GEMINI.md. Each part says where in GEMINI.md it belongs.

## Key Features & Games (a line under "Multiplayer-only, also")

  **كدّاب (I Doubt It):** lay cards face down and say what they are;
  anyone can call «كدّاب!», the first tap wins; computer players (*كدّاب*).
  **الشايب (Old Maid):** draw a card blind from the next hand, pair up, and
  don't be left holding the drawn old man; drag your cards about while
  someone is lifting one (*الشايب*).

## The owner's specs, as built (a new entry for each)

- **كدّاب (I Doubt It)** - the owner's spec of 23 Sep 2026, every rule asked
  one at a time, look ب "بلوكات" picked from a design sheet of four games
  (*كدّاب*):
  - **A room and the TV, with computer players easy and hard**; not
    against the phone, not one phone.
  - **The same rank until a call**: whoever leads names any rank and lays
    **any number of cards** face down; everyone after lays cards claiming
    that same rank, or passes.
  - **Anyone can call كدّاب!, the first tap wins** (the order the server
    heard them in); the call is open **until the next player lays cards or
    passes**.
  - The called play turns over: **a lie, the liar takes the whole pile;
    true, the caller takes it; whoever was right leads** the next rank.
  - **Everyone passes after a play: the pile goes out of the game face
    down, and the last to play leads.**
  - The end is **a lobby choice: "first out wins" (the default) or "play
    on for places"** (a podium). **A last play still has to survive a
    call.** Play again keeps a tally of wins (the board).
  - **3-12 players (computer players count), one deck up to 6, two decks
    from 7.** Four of a rank is nothing special.
  - A turn clock **off by default, 30 or 60 seconds** (the phone passes, or
    when leading lays one card truthfully); the host's "play for" a quiet
    phone.
  - Decided here: only someone still holding cards can call (a player out
    in "for places" is out of it - calling wrong would hand them the pile
    back); a follow always claims the rank named, whatever it sends; a
    player who leaves keeps their seat on the server (so "the next seat"
    still means the same), their cards leave the game, their last play can
    no longer be called, and a turn of theirs passes (a lead goes to the
    next seat, a follow counts as a pass, which can put the pile out);
    fewer than two holding cards ends the game, and a first place nobody
    earned at the table (everyone else left) is not counted as a win; the
    clock's truthful card is one of the rank the hand holds most.

- **الشايب (Old Maid)** - the owner's spec of 23 Sep 2026, every rule asked
  one at a time, look ب "بلوكات" (*الشايب*):
  - **A room and the TV only; 2-8 players; no computer players, not against
    the phone.**
  - **A drawn الشايب card is added**; a pair is **the same rank and the same
    colour** (7♥ + 7♦, K♠ + K♣).
  - **The deck grows with the table: about 8 pairs a player, at most the 26
    pairs of a whole deck** (52 cards) and الشايب; the pairs of a dealt hand
    go out at the start, with their motion.
  - A turn: **draw one card blind from the next player still holding
    cards**; a pair it makes goes out; **an empty hand is safe** (the order
    they got out is shown); **the last one holding cards holds الشايب and
    loses.**
  - **Hand order, a lobby switch: "rearrange by dragging" (on by default)
    or "auto-shuffle".** The draw as a board game: the drawer taps a back
    to **lift** it - every phone and the TV see which one is up - and taps
    it again (or "take this card") to draw it; meanwhile the one being
    drawn from may **drag their cards about**, and the lifted card moves
    with its card (the aim is kept by card id and shown as a position); the
    drawer sees the backs move. With auto-shuffle the server shuffles every
    hand after each turn and nobody drags.
  - **One loser a game, and a tally across play again** (the board: fewest
    times الشايب first).
  - A turn clock **off by default, 15 or 30 seconds** (a random card is
    drawn - the lifted one if there is one); the host's "draw for" a quiet
    phone.
  - **Leaving: that player's cards go into the next hand still playing**
    (and its pairs go out); **fewer than two left ends the game** with no
    loser; if two or more are still in the room but only one holds cards,
    that one holds الشايب and loses as usual.
  - **The end:** الشايب turns over in the loser's hand, the order the others
    got out on a podium, and the tally.
  - Decided here: the one drawn from draws next (the turn goes round the
    table); **a drawn card goes into the drawer's hand at a random place
    under a fresh id**, so the player who gave it up (who knows what it
    was) can never follow it across the other hand - their phone sees only
    positions, and never an id of another hand; a drag is published as a
    move of a position (from, to), which is exactly what a table sees of a
    hand being rearranged; the pairs chosen for a smaller table are drawn
    at random from the 26 (a rank and a colour each); **the draw from a
    hand of one card stays a tap** - there is only one card to take, but
    the draw is the game itself (the owner's "the tap is the game" rule,
    like أونو! and العقل), so it is not made automatic; hands are laid out
    left to right in both languages, the drawer's row of backs in the same
    order the other player holds them.

## Multiplayer rooms: two new sections (after *المشنقة*)

### كدّاب

The owner's rules are in *The owner's specs*.

- **`PlayingCards.js`** (shared, no DOM, every name `pc` / `PC_`): the deck
  (`pcDeck(decks)`), a card as rank + suit (`'7h'`, `'10s'`, `'Qd'`), الشايب
  as `'OM'`, `pcRank` / `pcSuit` / `pcRed`, `pcSorted` (rank, then suit, OM
  last), `pcPairs` (same rank, same colour) and `pcRankName`. The page
  inlines it (`SHARED_LISTS`) and the Worker bundles it before
  `RoomGames.js` (`FILES`).
- **`RoomDoubt.js`** (`doubtAction`, bundled after `RoomGames.js`): every
  hand and the pile (each play with its cards and its claimed rank) are
  `room._doubt`, never projected; a phone's own hand is
  `room.secrets[pid].hand`, sorted. `shared` carries `counts`, `rank`,
  `plays` (who laid how many in this rank), `last` (the play open to a
  call: `{ id, pid, n, rank }`), `passed`, `turn { pid, stage: 'lead' |
  'follow' }`, `pileCount`, `places`, `pendingOut` (a player whose last
  cards are still open to a call), `wins` / `board`, and the events
  (`deal`, `play`, `pass`, `call` - with the called play's faces only,
  `truth`, `taker`, `n` - `pileOut`, `out`, `auto`, `win`, `left`). A
  play's cards are ids; a call aimed at a play already covered (`play`,
  the id it saw) is dropped; turn moves carry `seq`. `doubtAfterPass` is
  the one place that decides "everyone passed: the pile goes out, the last
  to play leads" - a pass and a leaver's turn both go through it.
- **Computer players** (`ROOM_BOT_GAMES.doubt`, max 12): `pending` asks
  first whether a bot calls the play on top (decided once per play,
  `g.botCall`), then whether a bot is up; a bot up after a play waits
  1.9-2.9s so the table can call first. Hard knows a claim is a lie when
  the copies it has seen - in its hand and the true ones it laid on this
  pile itself - plus the claim are more than the decks hold, and calls on a
  hunch more often on a big claim or a last play; it leads the rank it
  holds most (sometimes slipping one extra card in), follows truthfully
  when it can, bluffs more when the pile is small or its hand nearly
  empty. Easy leads any rank, bluffs and calls at random. `rules.mjs` plays
  30 whole games (one person on the clock plus 2-6 bots, both endings) and
  checks no bot move is refused and no card is lost.
- **No forced moves**: a lead always has a choice of cards and rank, a
  follow can always bluff or pass.
- **`JS_RoomDoubt.html`**: the seats strip (a fan of backs and a count,
  «باص», «آخر ورق!», a medal once out), the table (the claim as a violet
  bubble, the pile of backs with its count, the rank, the plays of this
  rank; after a call, the called cards face up with the stamp «كدّاب!» or
  «صادق» until the next play), the big red **كدّاب!** for every other
  holding phone while a play is open (pulsing on a last play), your hand
  (tap to pick; rows of up to 13 upright, one overlapping row on a phone
  on its side and wider), and the bar: leading, 13 rank chips and
  "ارمي ٢ × سبعات"; following, that and باص. Picking cards of one rank
  when leading names it for you. The TV is a ring of seats round the big
  table with the turn and the moves beside it.
- **Motion** (`dbPlay`): the deal, cards laid face down onto the pile (your
  own fly from your hand turning over), باص on a seat, the call - «كدّاب!»
  bursting from the caller, the play's cards turned over one by one over
  the pile (`pcRevealRow`), the stamp slammed on them, the pile flying to
  whoever takes it - the pile going out (backs rising and fading), a medal
  for a player out. A game that ends on a move plays it on the table first
  (`dbPlayEnding`); your own move never waits behind the table's
  (`dbOwnMoveWaiting`). Sounds `pcCard`, `pcSlide`, `pcCall`, `pcLie`,
  `pcTrue` are added to `FX` from `JS_Cards.html`.

### الشايب

- **`RoomOldMaid.js`** (`oldMaidAction`): every hand, in the order it is
  held, is `room._om.hands` (`{ i, c }`), the lifted card `room._om.aimId`;
  never projected. A phone's own hand is `room.secrets[pid].hand` in its
  order. `shared`: `settings { mode: 'drag' | 'shuffle', turnClock }`,
  `counts`, `turn { pid, from }`, `aim { pos }` (where the lifted card sits
  now), `thrown` (every pair out, its faces public), `out` (the order they
  got out), `pairs` / `deckSize`, `loser`, `reveal` (the loser's hand,
  published at the end only), `losses` / `board`, and the events (`deal`,
  `pairs` - two by two, `deal: true` for the start - `draw` with the
  position taken and never the card, `move { pid, from, to }`, `out`,
  `shuffle`, `auto`, `over`, `left`). Actions: `lift { pos, seq }`, `take
  { seq }` (the lifted card; `pos` too, a lift and a take in one, which
  the phone does not use), `move { card, to }` (any player, their own hand,
  drag mode only, no `seq`), `skipTurn` (host) and the clock.
- **`JS_RoomOldMaid.html`**: the seats (the drawer "الدور", the hand being
  drawn from 🎯, ✓ and the place once safe, 🧓 for the loser), the draw
  (the other hand as a row of backs, the lifted one up in gold; buttons for
  the drawer, a picture for everyone else; for the one being drawn from, a
  line saying so and their own lifted card raised in their hand), the pairs
  out fanned in the middle, your hand, and the bar with "خد الكارت ده".
  **A lift and a drag change no frame**: the sig leaves out `aim`, the
  `move` events and the order of your own hand, and `omLive` puts the
  lifted back up, slides a moved back from its old place to its new one
  (FLIP), enables the take button, and puts your own cards in the server's
  order - except while a drag of yours is still on its way
  (`omLocal.pending`). Dragging is pointer events on the hand
  (`touch-action: pan-y`, so an upright swipe still scrolls): past 8px
  sideways the card follows the finger, the others slide out of its way,
  and letting go sends one `move`.
- **Motion** (`omPlay`): the deal, each dealt pair flying out of its hand
  to the middle two by two (a gold ring where they meet), a card flying
  from one hand to the other (face down, except on the two phones it
  concerns: the giver sees it leave face up and turn, the drawer sees it
  turn up as it lands), a player safe, the shuffle, a leaver's cards
  flying to the next hand; the end turns الشايب over in the loser's hand.

### The playing cards (`JS_Cards.html`, section 26 of `Style.html`)

One card builder for both games, `pcCardHtml(c, { size })` - a face, the
back (`null`) or الشايب (`'OM'`) - sized by `--pc-w` (1 : 1.42, the
default on `:where(.pc-card)`, so every context that sizes a card wins),
laid out left to right in every language: the index (rank over a small
suit) top left where an overlapping hand leaves it showing, a big Baloo
numeral, the suit again bottom right, a soft shine; the suits are drawn
(`PC_SUIT_PATHS`), never glyphs, since ♥ and ♦ turn into emoji on an
iPhone. Red suits `--pc-red` (#e5383b), black `--pc-ink` (#23213a), the same
in both themes (an ink card gets a faint rim on the dark ground). الشايب:
deep violet, a gold frame, the old man drawn (`PC_OLD_MAN_SVG`: a red fez
and its tassel, white hair and brows, round glasses, a big white
moustache), the band «الشايب». A card under ~42px drops its corner (and
الشايب its band). `pcFitRows` overlaps a row to fit its width;
`pcFx()` is one table's motion state, and `pcFly`, `pcPop`, `pcRing`,
`pcStamp`, `pcShout`, `pcShake`, `pcRevealRow`, `pcHold` / `pcRelease`,
`pcEventsToPlay`, `pcDeferRedraw` are the flights both games use (the
same shape as أونو's). `pcPlacesPodium` is a podium of places with medals
and no numbers. Drawn icons `art:doubt` (three backs in a fan and a red ?)
and `art:oldmaid` (his card) are in `ICON_ART`.

## Catalog, hub, help

كدّاب (`doubt`, violet, 3-12, 15 min) and الشايب (`oldmaid`, amber, 2-8,
10 min) are in ورق وطاولة, `modes: ['room', 'tv']`, opening a room
(`roomCreateFor`). In the hub كدّاب opens from one person (bots make up the
three), الشايب from two. Both have `GAME_RULES`, `HELP_ENTRIES`
(`roomOnly`) and `HELP_FOR_VIEW` (`room-doubt`, `room-oldmaid`), and a
`roomTurnOf` case (`turn_up` for the player up). Lobby choices are kept on
the host's phone (`recallOptions('doubt' | 'oldmaid')`).

## Traps (for *Traps this codebase has already fallen into*)

- **A margin rule on `.row > * + *` loses to the item's own `margin: 0`.**
  The hand's overlap (`--pc-gap`) was set on `.pc-row > * + *` (one class
  of weight) and the card buttons had `margin: 0` on their own class, later
  in the file: the same weight, so the button won and no hand ever
  overlapped - a phone's cards ran off both edges. `.pc-row >
  :not(:first-child)` weighs two, and wins.
- **An isolate inside an isolate hides its letters from the outer one.**
  A claim was built as "2 × ⁨سبعات⁩" (the rank isolated by the translation
  helper), then isolated whole inside a line: the outer isolate looks for
  its first strong letter *outside* nested isolates, found none in "2 × ",
  took left to right, and the Arabic line read "سبعات × 2". A phrase that
  will be isolated as a whole is built without isolates inside
  (`dbClaim`). And an Arabic name before ": 2" in an English line pulls
  the number to its side: names in hand-built markup go in `<bdi>`.
- **The scratchpad is shared by every agent of a session.** Another
  agent's driver overwrote this one's `cdp.mjs` mid-run (and pointed it at
  its own preview port). Keep test drivers, Chrome profiles and ports in a
  folder and a port range of your own.

## Also decided while building (worth a line in the log)

- **A screen that fell behind catches up** (`dbCatchUp`): a call's reveal
  takes a few seconds, and computer players don't wait for it, so a phone
  or the TV that has several moves to show plays the last call and what
  came after it, and otherwise only the last three moves. A place a card
  flies to (the pile) is hidden only once the card is on its way, so a
  pile is never left blank while an earlier move plays.
- **No suit symbols in running text**: ♥ and ♦ are emoji on an iPhone and
  "7♥ و7♦" jumbles in a right-to-left line, so the rules and the lobby
  say it in words (7 كبة مع 7 ديناري; the 7 of hearts with the 7 of
  diamonds). The Egyptian suit names are كبة, ديناري, بستوني, سباتي.
- **A rank in a claim is plural** (`PC_RANK_PLURAL`: آسات … عشرات، ولاد،
  بنات، شياب; Aces … Kings); the King is شايب at an Egyptian table, which
  only appears in كدّاب's claims - الشايب's own card is the drawn old man,
  never a K.

## Tests, as run on the branch

- `npm run test:rules`: all room rules pass, 73 of them the cards' (the
  deck, every claim, call, pass, pile out, both endings, the clock, the
  host, leaving; 30 whole bot games of كدّاب with the cards counted after
  every move; الشايب's deck for 2-8, the lift and the drag, the draw kept
  secret, a fresh id, the loser, the tally, shuffled hands, the clock,
  leaving, 40 whole games). The leak check plays both (a hand on its own
  phone only, a face on the table only from a call, الشايب's holder and
  every drawn card hidden until the end).
- `npm test` (robots, a local server): 1730 passed, 0 failed, a round of
  each game included (a claim, a call turned over, passes and the pile
  out, first out and the tally, bots on the server's clock; الشايب's lift
  seen by every phone, a drag the lifted card follows, the draw, the
  loser, shuffled hands, a leaver). One earlier run stopped inside the
  سكرو robots ("draw: مش دلوقتي"), which none of this touches, and the next
  run passed: that test is flaky.
