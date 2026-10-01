# سكرو (id `screw`)

Moved from GEMINI.md on 30 Sep 2026. GEMINI.md keeps the rules that apply to every game and an index; this file keeps the detail, word for word.

## From GEMINI.md: The owner's specs, as built

- **سكرو (Skrew)** - the owner's spec of 17 Sep 2026 (*سكرو in rooms*, and
  *سكرو on the table* for the calculator): the Skrew card game (Kraken
  Studios) played on the phones, with every version and any mix of them - "this
  is the core main thing" - and the old score card kept for a game with real
  cards.
  - **Everyone sees every hand face down, in order, and every move**: who
    looked at which slot, who swapped which of their slots with which of whose,
    who gave a card to whom. Values stay hidden unless the rules show them.
  - **The deck as the owner counted it** (`SkrewCards.js`): 1-6 four each, 7
    and 8 (look at your own) four each, 9 and 10 (look at someone's) four each,
    خد وهات 4, بصرة 2, كعب داير 2 (one card of every player, or two of yours),
    +20 four, the red screw (+25) two, the green screw (0) two, −1 one; one of
    each version card. That is 57 base cards (the owner's "66-card" table
    adds up to 62 with four بصرة and the thief's three cards, which is what
    the app deals; the owner closed the question on 23 Sep 2026, as built).
  - **Versions**: Classic (the base deck); الحرامي (the thief, خد بس, شوف
    وبدّل); صاحب صاحبه (teams, بينج, بونج, على كيفك - a mimic of a command
    card on the pile, below); المسحراتي (المسحراتي, المدفع, الخشاف);
    أوسكار (صرخة أوسكار); العام (all of them); or any mix (`custom`).
  - **Throwing a matching card is only on your own turn** (owner). Command
    cards left in a hand count 10 (owner); 7-10 count their face.
  - **Singles or teams in any version** (owner, 17 Sep 2026): two sides
    alternating round the table, 2 against 2, 3 against 3 or 4 against 4; 7-12
    players play with two decks ("Skrew Double").
  - **Later the same day the owner added** (with two rulebooks written by
    other AIs, checked against the Skrew store's own card descriptions, which
    won where they disagreed: المسحراتي is a forced سكرو, المدفع shows a hand
    until the round ends, خد بس gives a card):
    - the deck running out: the top card of the pile stays, the rest is
      shuffled into a new deck; **sudden death** (موت مفاجئ) is an option, off by
      default: the last card drawn gives everyone one last turn, then the reveal;
    - **a hand emptied ends the round at once**; that player scores 0, beating
      even a negative total, and a caller who isn't them is doubled;
    - **a caller who ties the lowest wins** (0), and the tied player keeps their
      own total; **doubling applies to any sign** (−1 → −2);
    - **the thief is a table vote** before the reveal: caught, +25; unnoticed,
      the thief takes the lowest score and whoever had it takes the +25;
    - أوسكار also has **بوم** (an opponent's card straight onto the pile) and
      **اللايف جاكيت** (counts as the lowest other card in its hand);
    - **بصرة is 4 or 2**, a lobby option, 4 by default (the standard deck in
      the owner's card table; 2 in the first print);
    - the rules in 📘 carry every case, folded into sections (`.help-more`).
  - **The owner's answers** (17 Sep 2026, asked one by one): throwing a
    matching card is the whole turn, one card per throw, and a failed throw
    goes back face down with a blind penalty card in a new slot; a game is a
    fixed number of rounds; in teams only the caller's own hand is doubled,
    then added to the partners'; a hand emptied by someone else's card (بوم)
    still finishes and wins; المسحراتي after a سكرو reveals at once and the
    first caller stays the caller; memorising at the start is a lobby option
    (until everyone taps, 5 or 10 seconds); a life jacket alone counts 10; a
    tie in the thief vote goes the caller's way when the caller voted for one
    of the tied, otherwise nobody is accused; everyone tied on the lowest
    score takes the +25; the الخشاف pick counts as drawn from the deck, so an
    action card thrown straight away uses its power; after سكرو in teams the
    caller's whole team is protected; memory is the game - moves show as they
    happen and fade, and a "memory helper" option (off by default) keeps each
    card's story.
  - **بوم and صرخة أوسكار, as the owner described them later** (replacing the
    first reading): بوم makes every other player (not whoever played it, not
    the protected side) pick one of their own cards, and it goes onto the pile
    face up whatever it is, the red screw and the thief included; صرخة أوسكار
    gathers every unprotected hand, shuffles, and deals back the same count to
    each player, face down and unknown to all. After either, whoever played it
    takes a whole new turn.
  - Decided for the owner: the vote happens at the end of every round the
    thief card is in the deck, however the round ended; two decks keep one
    thief.
  - **No card carries a warning** (owner, 17 Sep 2026, night: "each card is
    treated the same"): a +20 or the red screw drawn from the deck is kept or
    thrown like any other card - kept, it can be thrown on a match later.
    The forced throw (and its ⚠️) is gone from the server and the phone. The
    thief and بونج still go into the hand and بينج and المسحراتي still play
    themselves - those are their versions' rules, said plainly, not alerts.
  - **The cards, checked one by one** (owner, 21 Sep 2026, after asking what the
    screws and +20 look like). Every face had been the middle blue since the
    card design of 17 Sep - `.skr-card`'s own default `--c` outranked the
    colour group on the same element; the default is `:where(.skr-card)` now,
    so every card shows its group. With the colours showing, المسحراتي's three
    became a Ramadan-night navy with a gold icon and صاحب صاحبه's an olive-lime
    (they had been a purple beside 7-10's violet and a cyan beside 1-3's teal).
    **+20 and −1 have no name band**: the numeral is the name (the band said
    عقاب and سالب واحد). **9 and 10 are شوف كارت حد** (شوف كارت غيرك was cut
    off on the card), a pair with شوف كارتك on 7 and 8. The corner 6 and 9 are
    underlined (the bottom corner is upside down), a 10 beside its corner icon
    is a size down, the upside-down corner sits above the name band, and بوم's
    bomb and بينج's paddle were redrawn: they read as ♂ and a magnifying glass.
  - **The two screws are one kind when throwing** (owner, 21 Sep 2026): a red
    screw goes on a green one, a green on a red, and either on its own colour
    (`SKREW_SCREWS` in `skrewMatches`). Before, only red on green (and red on
    red) was allowed, and the Help said red "only on green".
  - **The three kinds of card** (owner, 20 Sep 2026, laid out as groups and
    then confirmed one by one):
    - **Fires the moment it is drawn, and cannot be kept or skipped**: بوم and
      صرخة أوسكار ("the power of them must be activated when they are drawn in
      the ground - this is not an option"), and بينج and المسحراتي by their own
      versions' rules. They are `drawn: 'play'` in `SkrewCards.js`, so the
      server resolves them in `screwReceive` before a drawn card screen exists,
      and `skipPower` is refused for any of their powers
      (`SKREW_FORCED_POWERS`).
    - **Drawn, you choose**: throw it to use its power, or swap it into your
      hand and carry its value. 7, 8, 9, 10, خد وهات, شوف وبدّل, خد بس, كعب
      داير, الخشاف, **بصرة and المدفع** (the owner confirmed both belong here,
      20 Sep 2026).
    - **Held**: اللايف جاكيت, الحرامي, بونج, −1, the green screw, +20.
  - **على كيفك is a mimic** (owner, 20 Sep 2026: "you must point to a command
    card currently lying face-up in the discard history stack and declare: I am
    copying this card's power"). Not a free choice from a list: the choices are
    the command cards on the pile (`skrewPileCommands`), and it runs that
    card's own text. A card that plays itself is `kind: 'special'`, so it is
    never on the list, and على كيفك cannot copy itself. **With no command on
    the pile** - turn one, or a pile of nothing but numbers - the card is not
    dead: it goes down as a plain بصرة, because the deck's history has not
    unlocked anything else. Both sides read the same window the phones are
    shown (`SKREW_PILE_SHOWN`): you point at a card the table can see, not one
    buried under it.
  - **اللايف جاكيت equals the lowest card in your hand** (owner, 20 Sep 2026:
    "its automatic equal the lowest card i have in my hand"), automatically and
    with no choice; alone in a hand it counts 10. That is what
    `skrewHandValues` already did.
  - **المسحراتي stays a forced سكرو** (owner, 20 Sep 2026, asked directly):
    drawn, it plays itself and reveals the round with the drawer as caller.
    A later description of it as "flip every hand face-up for three seconds"
    was put to the owner beside the built rule, and they kept the built one -
    the 17 Sep reading from the Skrew store's own card text. Do not change it.
  - **Command cards count their face where they have one** (owner, 20 Sep
    2026, asked directly): a 7 counts 7 and an 8 counts 8, not 10. A later
    "fixed +10 for all of them" was put to the owner and they kept the face
    values.

## From GEMINI.md: Multiplayer rooms

**سكرو in rooms** (`screwAction`, `JS_RoomScrew.html`), the owner's spec
(see *The owner's specs*). The cards are `SkrewCards.js`, shared with the page:
`SKREW_CARDS` (value, kind, power, which version), `SKREW_EDITIONS`,
`skrewDeck(groups, decks)`, `skrewValue`, `skrewMatches(top, card)` and
`skrewDecksFor(players)` (two decks beyond six; the room keeps one thief even
then, since the vote is about "the" thief), `skrewHandValues` and
`skrewDeck(groups, decks, { basraCount })`. The lobby sends `{ edition,
groups, teams, rounds, screwFromLap, turnClock, suddenDeath, basraCount,
memorizeSecs, memoryHelp }` (`ashryScrewOpts` on the host's phone); teams need 4, 6 or 8 players and are two sides alternating
seats (`shared.teams`, keys `A` and `B`); صاحب صاحبه turns them on by
default. Seats are shuffled at start and at play again.

- **What is hidden.** The deck, the pile and every slot's card live in
  `room._screw`, never sent. `shared.hands` holds slot ids in order, with a
  card (`up`) only while the rules keep it face up - the cannon, the reveal -
  and such a card stays face up wherever a public move takes it (a card taken
  from the pile goes face down). A failed throw (owner, 17 Sep 2026) is shown
  to the table in its event and goes back face down in its slot; the penalty
  card goes face down into a new slot and nobody, its owner included, sees it. A phone's own slice holds only its
  memorize cards (slots 3 and 4, until it taps ready), the card it drew, the
  الخشاف four and its last look, until its next move.
- **Every move is an event** (`shared.events`, the last 40, numbered by their
  own `shared.eventSeq`): `draw`, `keep`, `takePile`, `match`, `penalty`,
  `screw`, `peekOwn`, `spyOther`, `blindSwap`, `basra`, `allAround`, `give`,
  `seeSwap`, `ping`, `pong`, `wakeUp`, `cannon`, `khoshaf`, `scream`,
  `reshuffle`, `skip`, `thiefGuess`, `reveal` - with the slots and players they
  moved, never a hidden value. This is what lets every phone show "Ahmed
  swapped his 2nd with Mona's 4th". In `seeSwap` `slot` is the other player's
  and `slot2` your own, the opposite of `blindSwap`.
- **Stale taps.** Every move carries `seq`; `screwApply` raises
  `shared.turnSeq` only when the phase, round, player up, stage, power or
  `pongOpen` changes, so a double tap is dropped and taps that arrive together
  in memorize are not.
- **A turn**: `draw` then `keep {slot}` or `discard` (a command card thrown
  straight from the deck opens `stage: 'power'`: `power {…}` or `skipPower`),
  `takePile {slot}`, `match {slot}` (one card, the whole turn; wrong: the card
  goes back face down in its slot, its event shows it, and a blind penalty
  card goes face down into a new slot), `screw` (from lap `screwFromLap`), or
  `pass` when the deck is empty and can't be refilled. The memorising at the
  start waits for every tap, or `memorizeSecs` (5 or 10) on a server clock.
  Laps count each time the turn passes the round's first seat, which moves on
  each round (from the last one, `g.startId`, so a leaver skips nobody; a first
  seat who left leaves `g.startSeat`). After سكرو only `finalLeft` plays, and the caller's side (the
  caller, and the partners in teams) can't be the target of a swap, give,
  see-and-swap or cannon, and takes no part in بوم or the scream; looking is
  allowed. بوم (`stage: 'boom'`, `shared.boom { waiting, picked }`,
  `boomPick { slot }` from every other player, hidden until all are in or the
  clock or host closes it with random picks) throws one card from each onto
  the pile, anything goes; the scream gathers the unprotected hands, shuffles
  and deals back the same counts with every look and known value wiped. After
  either, the player who played it has a whole new turn (`stage: 'choose'`).
  بصرة on the red screw or the thief shows it and puts it back face down. A
  الخشاف pick counts as drawn from the deck (its power works); a بينج or
  المسحراتي picked that way plays itself.
- **The end of a round.** A round ends on a سكرو's last turns; on المسحراتي
  (at once; after a سكرو the first caller stays the caller); on a hand that
  runs out (`shared.finisher`, however it was emptied, even by someone else's
  بوم); or, with `suddenDeath`, once everyone has had the last turn that the
  deck running out started (`shared.lastLap { by }`: no reshuffle, `pass`, no
  penalty card, no سكرو). With the thief in the deck (even if nobody holds it,
  or the phase would say someone does), every seated phone then votes who
  holds it (`thiefVote`, changeable until the close; the choices wait in
  `room._screw` and `shared.thiefVote.voted` says only who voted; it closes
  when all have voted, on `closeThiefVote` / `skipTurn`, or on the turn
  clock): the most votes accuse, and a tie goes to the caller's choice if it is
  among the tied, otherwise nobody. Scoring is `screwScoreRound`: hand values
  (`skrewHandValues`: a life jacket copies the lowest other card, 10 alone),
  team sums, `screwRoundScores` (a finisher's side 0; else a caller equal to or
  below every other side 0, the others their totals; a beaten caller doubled
  whatever the sign - in teams only the caller's own hand - and the lowest of
  the others 0; no caller, the lowest 0), then `screwThief` (caught: the
  holder's side +25; otherwise that side takes the lowest round score and every
  side that had it +25). `results` carries `hands`, `values`, `sums`, `totals`,
  `thief` (`holder`, `accused`, `votes` - published only now - `caught`,
  `stole`, `victims`, `score`, `skipped`), `round`, `lowest`, `caller`,
  `finisher` and `callerDouble`; in teams `totals` and `round` hold the team
  keys and every player. The last round goes straight to `gameover` with
  `winners` (and `winnerTeams`). The board is lowest first, so `renderPodium`
  (highest wins) is not used for it.
- **House rules** (`settings.thiefSteal`, `settings.teamBasra`, off by
  default; the owner asked for both as options, 17 Sep 2026). With سرقة
  الحرامي, a thief just drawn (or picked with الخشاف), or on top of the pile as
  a turn starts, can be played as a steal: `thiefSteal { target, slot }` shows
  that card on the stealer's phone alone (stage `steal`, `turn.look`),
  `stealSwap { slot }` is a forced swap, the thief goes up on the pile and is
  out for the round, and a round where nobody can hold it skips the vote. With
  بصرة الفريق, `match { slot, owner }` throws a teammate's card: a partner
  emptied this way finishes the round, and a wrong throw's penalty card is the
  thrower's.
- **What the table knows.** Every slot carries a public history,
  `shared.hands[pid][i].h = { how, by, from, at, known, looks }`: how its card
  arrived (deal, deck, pile, penalty, swap, give, scream, khoshaf), who moved
  it and from which slot, who has looked at that card (looks travel with the
  card), and `known` for a card the whole table saw face up (taken from the
  pile, or a failed throw back face down). It is what everyone watched happen,
  so it is public, and it reaches back further than the last 40 events at 12
  players. The phone draws it only with `memoryHelp` on (off by default: the
  owner's "memory is the game"); otherwise moves light up as they happen and
  fade.
- **Clocks and leaving.** The turn clock (0, 30 or 60 seconds) is a server
  deadline that does what the host's `skipTurn` does, and closes the thief
  vote too. A drawn card the skip cuts short goes on the pile, except الحرامي
  and بونج (`drawn: 'keep'`): those go into one of the player's slots at random
  and that slot's card goes on the pile (`screwDropPending`; the review of 1 Oct
  2026, the owner approved - it used to put the thief face up on the pile). A player who leaves puts their cards under the deck and their turn
  moves on; a caller who leaves brings the reveal at once, with no caller; and
  the game ends when fewer than two (or one side) are left, without scoring
  the round in progress. A latecomer watches
  until play again.

**سكرو on the phones and the TV** (`JS_RoomScrew.html`, `ROOM_GAMES.screw`
and `TV_GAMES.screw`; styles in section 16 of `Style.html`). Every hand is
face down in numbered slots on every phone and the TV, drawn by one card
builder, `skrCardHtml`, sized by `--skr-w`.

- **The cards and seats the owner picked** (17 Sep 2026, from a sheet of three
  card styles and three seat layouts; the first cards were a number or an
  emoji with a name, "not like real cards"): style 3, colour blocks - each
  card in its type's colour (`--skr-c-low` … `--skr-c-oscar`, the same in both
  themes; `SKR_DESIGN` / `skrCardDesign`), a big white numeral in Baloo
  Bhaijaan 2 or a white line icon (`skrIcon`, one set, also used for the
  powers in the bars), the value in two corners and the name on a band from
  56px wide up (a container query hides them below), and a violet dotted back
  with the Ashry mark. No emoji on a card. Seat layout أ: a round avatar with
  the first letter, the name and the tags on top, the cards in one row under
  it with each slot's number under its card. When a hand doesn't fit one row,
  `skrStackHands` (after every draw and on resize) stacks it in even rows, 2
  over 2 or 3 over 3, with an odd card beside them, centred - the owner's
  rule; a card left alone under three looked broken. Seats two a row give
  their slots no side padding (`.skr-opps--grid`), or rounding dropped the
  fourth card of a 375px phone.

- **Memory is the game.** By default the table remembers nothing, as at a real
  table: every move is drawn as it happens - a flight between exact
  `data-skr-at` places (`skrPlay`, one choreography per event: the deal, the
  riffle of a reshuffle, draw, keep, take, a right or failed throw, each power
  from the peek's lift to بوم's throws, the scream's gather, riffle and
  re-deal, the vote's pins and
  the reveal's stamps; Web Animations of transform and opacity on fixed
  layers) - the places it touched glow with a sign for about 3 seconds
  (`skrFlash`, carried across redraws by `--skr-flash-at`), the latest move
  sits at the top of the table (`skrLatestHtml`) and the log keeps two more. A
  phone back from the lock screen replays nothing (`skrWokeRecently`).
  `settings.memoryHelp` switches on each slot's story from the server's
  `hands[pid][i].h` (corner icons, words under your own cards, each seat's last
  move, a known value on the back, a story toast). A new animation calls
  `skrCanMove()`, registers its timers in `skrFx.timers` and pushes
  `skrFx.busyUntil`, so the table isn't redrawn under a flying card; positions
  are measured just before each redraw.
- **Picking.** A move is picked, then confirmed in the sticky action bar
  (`skrLocal.pick`, `skrNeed`, `skrPickPayload`). Someone else's card is two
  steps in the bar (`skrTargetsHtml`: the names, protected ones greyed, then
  that player's cards large), so twelve players keep a compact table of two
  columns; كعب داير steps through the players with a count. Protected hands
  after سكرو come from `skrProtected` (the caller's side in teams).
- **The thief vote** runs on every seated phone (`skrVoteHtml`; this phone's
  own choice is kept in sessionStorage, since a changed vote sends no event,
  and the server sends it back in the phone's own slice, `you.thiefVote`, so a
  reload or another tab shows it)
  and on the TV. The reveal plays the votes as `renderVoteResults` bars, then a
  `spyRevealParts` card, then the hands turning one by one, the ×2 stamp on a
  beaten caller and a life jacket's value turning into the card it copies. A
  round that ends on a move plays that move on the table first
  (`skrPlayEnding`; on the TV `frame` keeps drawing the table while
  `skrFx.tvEnding`). The lowest-wins podium mirrors the board through
  `renderPodium`.
- **Fitting.** On a phone upright the page scrolls your hand above the bar when
  it matters (`skrHandInView`: the memorising, your turn). On a phone on its
  side up to four opponents take a row each and the bar is one line of prompt
  with smaller buttons (a `:has()` rule counts the seats). Twelve seats fit the
  TV at 1280×720 without scrolling. Values inside a translated line are
  isolated (FSI/PDI in `skrT`) except plain numbers, or "Adam: +20" draws as
  "+20 :Adam" and "1/5" as "5/1". A few short sounds were added to `FX` in
  `JS_Sounds.html` (`skrFlick`, `skrRiffle`, `skrDrum`, `skrThump`), not on the
  soundboard; none depends on a hidden card.

#### Next batch: small (three owner-approved touches)

Page-side only: nothing the rooms server runs was touched (no rules tests needed).

**1. سكرو: «↺ شوف تاني» on the latest move (JS_RoomScrew.html)**

- `skrLatestHtml` draws a small pill `.skr-replay` (`data-skr-replay`) beside the
  latest move's line, on a phone only (never the TV, which has no tap), while the
  table is on (`memorize`, `play`, `thiefGuess`), with motion on, and not while this
  phone is picking a move (`skrLocal.pick`: the flights hold slots the pick is using).
  `skrReplayOffered(state)` is that test.
- `skrReplay()` plays the latest move (the same `e` the line names, from `skrMoves`)
  through `skrPlay(root, state, [e], 0)` - the very choreography the move had, holds,
  releases, `skrFx.timers` and `busyUntil` included. No server call; nobody else sees it.
- **Memory is the game**: the replay is given `state.you` with `seen: null`, so a look
  (7/8/9/10, كعب داير, شوف وبدّل…) flies face down: a face the looker saw is not shown
  again. The drawer's own drawn card stays as it is (it is face up in the hand anyway).
  Only the latest move, never a history.
- Places that are gone after the move (the "held" card after a keep) come from the
  rects measured before the move's redraw: `skrReplayRemember(evs)` keeps
  `skrFx.replay = { seqs, rects, scroll }` when `skrAfterDraw` plays events; the replay
  uses them (shifted by how far `#shell-main` has scrolled since). Cleared by `skrFxCancel`.
  After a reload there is nothing saved: live places only, a flight from a gone place is
  skipped (its hold released), as skrFly already does.
- The button is disabled while anything is flying (`skrReplaySync`, a timer until
  `busyUntil`), after the move's own flights and during a replay.
- GAME_RULES (both languages): a fifth line in سكرو's ordered list.

## History

The day-by-day log of the work on this game is in `notes/log.md` (search it for the game's name); a new entry goes there, and anything that changes how the game works goes in this file.
