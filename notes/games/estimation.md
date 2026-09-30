# إستميشن (id `estimation`)

Moved from GEMINI.md on 30 Sep 2026. GEMINI.md keeps the rules that apply to every game and an index; this file keeps the detail, word for word.

## From GEMINI.md: The owner's specs, as built

- **إستميشن (Estimation)** - the owner's rules of 25 Sep 2026, asked one by
  one (*إستميشن*):
  - **Four players, each for themselves**, one deck, 13 cards each; **rooms
    and the TV only**, a card of its own in **ورق وطاولة** (`group: 'table'`).
  - **The dash** (a call of 0) announced before the auction, **two at most a
    round**; a dash doesn't bid and its call is fixed at 0. Scored ±33 under /
    ±25 over, or the Egyptian +33 / −23 (a lobby choice, Jawaker's by default).
  - **The auction, the Jawaker way**: in turn from the left of the dealer
    (the dealer moves on one each round), a number of tricks and a trump suit,
    or a pass; **4 at least**; a bid beats the last with more tricks, or as many
    with a higher suit (no trumps > ♠ > ♥ > ♦ > ♣). It ends when the others
    have passed after a bid; **everyone passing deals again** (the same
    dealer). The winner is **the caller**: the bid is their call, its suit
    trumps.
  - **The others call** in turn after the caller, 0 up to the caller's number
    (nobody calls more than the caller; the same number is مع); **the last to
    call (the risk) can't make the total 13**.
  - **Play**: the caller leads; follow suit if you can; the highest trump, else
    the highest of the suit led, takes the trick and leads the next.
  - **Scoring is the score keeper's** (`CS_GAMES.estimation`), number for
    number: the same arithmetic in `estScoreRound`, and `rules.mjs` plays 4,000
    random rounds through both. The base 10 or 13 is a lobby choice; صعايدة
    doubles the next round (×4 after two).
  - **18 rounds by default** (13 + 5 speed rounds), or 13. **A speed round
    (14-18) has no auction**: trumps ♠, ♥, ♦, ♣, then none; everyone calls in
    turn from the left of the dealer, the last not making 13; no caller (no
    مع); the first to call leads.
  - The highest total wins (ties share it), a podium, and the night's board.
  - **Computer players easy and hard** fill the seats, from their own hand and
    the table only. A turn clock off by default, 30 or 60 s; the host's "play
    for". **Forced moves** where one card may be played.
  - **The look**: the playing cards of كدّاب and الشايب on a green felt; every
    card flies to the middle, every trick to its taker; bids and calls pop on
    the seats; trumps in the middle and in the head. **The three helpers**:
    the cards you may play lit; took / called on every seat; «آخر لمّة».
  - Decided here (open to change, each in one place):
    - **The dash is answered by all four at once**, not in turn
      (`estDash`): it is a yes or no before the auction, so a table waits for
      the slowest instead of for four taps in a row; the third to tap dash is
      refused («اتنين قالوا داش خلاص»). The clock, or the host's "play for" a
      phone that dropped, answers "no" for whoever hasn't.
    - **A dash doesn't count as the last caller**: the risk is the last
      non-dash caller in turn (the dashes' zeros are in the sum from the
      start), so a fixed 0 can never be what makes 13.
    - **A pass in the auction is final**, and the highest bidder is never
      asked again while someone else is still in (the turn skips them).
    - **"Left of the dealer" is the next seat in the order of play**; on the
      phone the next to play sits on your left (you at the bottom, the next on
      the left, the one after across, the last on the right), so "left" is
      literally left.
    - **In a speed round the first to call leads** is the first non-dash seat
      from the dealer's left.
    - **A card is played with two taps** (lift, then play, or the button): a
      mis-tap in a trick game costs a trick. A single card allowed is played
      for you after a beat (`ROOM_FORCED_GAMES.estimation`), **the last trick
      included** - every hand then holds one card and there is nothing to
      judge.
    - **Seats**: people first (with more than four, four of a random order
      play and the rest watch the table, `lateJoin`), then computer players the
      host added, then easy ones for any seat still empty, named from the
      host's phone (`estSeatTable`); the seats in a random order, the first
      dealer drawn. **Play again keeps the table.**
    - **A player who leaves: a hard computer player takes the seat** - the
      hand, the call and the points - under their name with 🤖 (المخ والإيد's
      way): four seats can't play three-handed.
    - **The clock** answers no dash, passes in the auction, calls what the hand
      looks good for (the hard computer's call) and plays the lowest card
      allowed.
    - **The next round is the host's tap** (a pause the table uses to read
      the round), like أونو's rounds.
    - **The multiplier keeps doubling** after three rounds nobody made (×8,
      ×16…), as the score keeper does; the owner's "×4 after two" is read as
      the start of that rule, not a cap.
    - Trumps are «الطرنيب» and no trumps «صن», the words the app's طرنيب
      score keeper already uses.
    - The icon is drawn (`art:estimation`: a spade card on the green felt and
      a target); 🎯 stays the score keeper's.
    - The score keeper stays a tool of its own (الأدوات → حاسبات النقط), under
      the same name; the game is the one on the home.

### إستميشن

The owner's rules are in *The owner's specs*. Game id `estimation`
everywhere (`room-estimation`, `ROOM_GAMES.estimation`, `TV_GAMES.estimation`,
the catalog, the help); the score keeper is `cs-estimation`, a tool. The rules
are named `est` / `EST_` (shared and server), the page's own code `es` / `ES_`.

- **`Estimation.js`** (shared, no DOM, after `PlayingCards.js`): a card is
  PlayingCards.js's, one deck, so a face is its own id; a bid `{ n, s }` with
  `s` one of `EST_BID_SUITS` (`c d h s n`, low to high). `estBidBeats`,
  `estLowestBid`, `estCallChoices(max, sumSoFar, last)`, `estLevels`,
  `estLegal(hand, trick)`, `estTrickWinner(trick, trump)`, `estSpeedTrump`,
  `estMult(history)`, `estScoreRound(input, opts, mult)` - the score keeper's
  `score` rewritten over seats, and `rules.mjs` loads `JS_CardRules.html` and
  compares the two on 4,000 random rounds. The computer players:
  `estHandTricks` (honours, trump length, ruffs), `estBotDash`, `estBotBid`
  (the lowest bid that beats the table in the suit its hand likes best, only
  what the hand holds for hard), `estBotCall`, `estBotCard` (wanting a trick:
  the cheapest winner, a card top of its suit to lead; not wanting one: the
  highest card that still loses, low leads). Hard makes its call about half
  the time against a third for easy.
- **`RoomEstimation.js`**: `shared` has `settings { rounds, base, dash,
  turnClock }`, `seats` (four ids, seat k), `names`, `round`, `dealer`, `deal`
  (every deal, redeals included: a dash tap carries it), `speed`, `trump`,
  `dash` ([null | true | false] ×4), `bids` and `high`, `passed`, `caller`,
  `bid`, `calls`, `callOrder`, `callMax`, `risk`, `took`, `trick` ([{ k, c }]),
  `lastTrick { cards, k, no }`, `tricks`, `counts`, `turn { k, pid, stage:
  'bid' | 'call' | 'play' }`, `turnSeq`, `endsAt`, `mult`, `totals`, `history`
  (every round: calls, took, dash, caller, risk, points, allMissed, mult,
  over, levels), `results`, `winners`, `wins`, `board`, and the events (`deal`
  with `again`, `dash`, `bid`, `pass`, `won`, `call` with `with`, `called`,
  `play`, `trick` with its cards and seats, `round`, `auto`, `took`, `over`) -
  **cleared at every deal**, since a card played last round is in a hand now.
  Phases `dash` → `bid` → `call` → `play` → `roundOver` (the host's
  `nextRound { round }`) → … → `gameover`; a speed round skips `bid`. Moves:
  `dash { yes, deal }`, `bid { n, s, seq }`, `pass`, `call { n, seq }`, `play
  { card, seq }`, the host's `skipTurn { seq }`, `start` / `playAgain` with the
  options and `botNames`. `room._est = { hands (by seat), gone }`; each seated
  phone's slice `{ seat, hand }`, sorted by suit, high first.
- **`JS_RoomEstimation.html`** (section 38 of `Style.html`): the green table
  (`esTableHtml`: a grid of the four seats round `es-mid`, left to right in
  every language, you at the bottom and the next to play on your left; four
  fixed places `slot:k` the cards land in, the trumps in the middle; the words
  inside keep the page's direction, `esDir`), your hand (`esHandHtml`, rows of
  7 upright, one overlapping row on a phone's side and wider; the cards you
  may play lit and the rest dim, a tap lifts, a second plays), the bar
  (`esActionsHtml`: the dash, the bid picker - numbers and drawn suits, only
  what beats the table - the call picker with the one the last caller can't
  make struck out, your card), the scores, the rounds' sheet
  (`esSheetHtml`), the round's result (`esResultHtml`, points counting up)
  and the end (the podium). **A trick stays on the table until it is
  gathered**: `esCenterCards` draws `lastTrick` in the places until the
  gathering flight (`esLocal.hideTrickNo`), so a redraw never makes the fourth
  card vanish; the round's last trick plays out before the result
  (`esPlayEnding`). Motion (`esPlay`): the deal, a dash, a bid and a call
  popping on the seat (`esPopHtml` draws a suit), the auction won, a card
  flying from its seat (or your hand) to its place, the trick flying to its
  taker with +1 and the took / called chip bumping. The TV
  (`TV_GAMES.estimation`): the table as tall as the stage beside the head, the
  turn, the latest move, the scores and the log; a round's result and the end
  side by side.
- Tests: `rules.mjs` (above), `leaks.mjs` (`PROBES.estimation`: a card in a
  hand only on its own seat's phone; a phone's hand its own seat's, whole;
  `DRIVERS.estimation`: one person and three computer players, 13 rounds on
  the clock), `play-all.mjs` (`estimationRobots`, `--only=estimation`: one
  person, three computer players and a TV through a round and into the next).

## History

The day-by-day log of the work on this game is in `notes/log.md` (search it for the game's name); a new entry goes there, and anything that changes how the game works goes in this file.
