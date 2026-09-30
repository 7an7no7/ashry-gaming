# بنك الحظ (id `bank`)

Moved from GEMINI.md on 30 Sep 2026. GEMINI.md keeps the rules that apply to every game and an index; this file keeps the detail, word for word.

## From GEMINI.md: The owner's specs, as built

- **بنك الحظ** - the owner's spec of 21 Sep 2026, every rule asked one at a
  time and then checked against another AI's rulebook; look أ "كلاسيك" and
  the places, prices and card texts approved from a design sheet (*بنك الحظ*):
  - the classic 40-square board and rules with **Egyptian cities and resorts**
    (22 places in 8 colours, cheapest to dearest: الفيوم، بني سويف · المنيا،
    أسيوط، سوهاج · الزقازيق، المنصورة، طنطا · السويس، الإسماعيلية، بورسعيد ·
    قنا، الأقصر، أسوان · مرسى مطروح، العلمين، الإسكندرية · دهب، الغردقة،
    شرم الشيخ · الجيزة، القاهرة), 4 stations (محطة رمسيس، محطة سيدي جابر،
    ميناء دمياط، مطار القاهرة), 2 companies (الكهرباء، المياه), money in
    جنيه: **1,500** to start, 200 for passing Start;
  - **room + TV and against the phone**; **2-6 players**; pieces picked in the
    lobby, a roll-off to start, 7+ in the room the host picks who plays;
  - length a lobby choice, **default 45 minutes** (or until one is left, 30,
    60); time up: **finish the lap**, then cash + place prices (half if
    mortgaged) + building cost, highest wins;
  - a place not bought **stays with the bank** (no auction); **trading on your
    own turn**, an offer the other accepts or refuses;
  - buildings are the Egyptian box's **جراج ← استراحة ← سوق**, on a whole
    colour, built evenly, no limit, with a **steeper rent table** (a full set
    doubles the rent; the three steps are classic Monopoly's 1 house, 3 houses
    and hotel rents; building costs 1x, 2x, 2x the group's price per step);
  - mortgage and selling back **classic**; jail **classic** (50, a card or
    doubles, rent collected inside, three doubles to jail); bankruptcy
    **classic** (to the player owed, or back to the bank);
  - the free-parking corner is **الأتوبيس السريع** (move again by the same
    number); the decks are **حظ** (moves, surprises) and **محاكمة** (money),
    16 each, family wording;
  - two lobby switches **off by default**: the free-parking pot and landing
    exactly on Start pays 400;
  - **buying starts after the first lap** (the owner, 22 Sep 2026, the day
    after the build): a lobby switch, **on by default**. Until a player has
    passed Start (or landed on it) a free place they land on stays with the
    bank, and **a trade can't give them a place** (money and jail cards
    still can); rent is paid as usual. A card that takes them to or past
    Start counts, jail doesn't, and the rest of the move that passes Start
    may already buy. Decided here: a bankruptcy still hands its places to
    the creditor either way (it isn't buying or trading), and a game saved
    before the switch existed plays on as it was;
  - **high rents from the start** (the owner, 22 Sep 2026, after noticing
    that بني سويف rents for 4: the classic numbers had been copied square for
    square from the international board, and the Egyptian box they remember
    runs about 15 to 50): a lobby switch, **off by default - the classic
    numbers stay the default**. On, a place with no buildings rents for 15
    on the cheapest up to 50 on القاهرة, by its price (`round(15 + (price -
    60) × 35 / 340)`), doubled for a whole colour (30 to 100); a جراج pays at
    least the whole colour's rent + 10, so every building still pays more
    than the step before; the استراحة and سوق rents are unchanged;
  - **one die** (the owner, 22 Sep 2026, the same day; a lobby switch,
    **off** - two dice by default): you move by one die and **a 6 is what a
    double is with two** - another roll, three 6s in a row to jail, and in
    jail a 6 gets you out and moves you 6 **with no roll after** (the
    owner's answer, like a double out of jail); after the third miss you
    pay 50 and move by that roll, as with two. **A company rents for the
    die x 8, or x 20 with both** (the owner's pick: the same money on
    average as two dice), and the "nearest company" card is the die x 20.
    Decided here: the roll-off rolls the same one die. Put to the owner
    first and kept on only as a switch: one die halves how far a lap goes,
    so a 45-minute game passes Start about half as often, and with buying
    after the first lap nobody can buy for about eleven turns each;
  - computer players **easy and hard**, answering trade offers but never
    making them; a turn clock off by default, 60 or 90 seconds.
  - **Clarified by the owner before the build** (another AI's notes, checked
    and corrected): "the nearest station" is the next one ahead (passing
    Start pays), the rent twice what the owner would charge; "the nearest
    company" the next one ahead, then a roll and 10 times it; upkeep and
    street repairs are per place (25 or 40 for a جراج or an استراحة, 100 or
    115 for a سوق); عزومة pays every other player still in the game 50, and
    عيد ميلادك has each of them pay 10; a get-out-of-jail card is a list,
    not a flag (two can be held, each goes back to its own deck, it can be
    traded); each deck is shuffled once and drawn from the top, a drawn card
    going to the bottom; a bankruptcy while paying everyone (عزومة) goes to
    the bank.
  - Decided for the owner: someone who can't pay the birthday 10 has the
    money raised for them (buildings sold back, then mortgages, as a
    computer player would), and goes bankrupt to the birthday player only if
    nothing covers it; the roll-off rolls the two dice for everyone, on the
    server; a bankruptcy's buildings are sold to the bank at half and the
    creditor takes the cash; the game's time counts continuously in a room
    and only while the screen is open against the phone; a player who leaves
    is out, their places back to the bank.
  - Tested but worth knowing: "until one is left" needs bankruptcies, and
    computer players never make offers, so a table of computer players can
    circle for ever. That way of playing is for people; the time limit is the
    default for this reason.

### بنك الحظ

The owner's rules are in *The owner's specs*. Built the way لودو is:

- **`BankAlhaz.js`** (shared, no DOM). `BANK_SQUARES` is the 40 squares from
  Start (a place has its colour, price and rents `[base, جراج, استراحة,
  سوق]`); `BANK_GROUPS` a colour's step price; `BANK_CARDS` the two decks,
  each card an effect (`go`, `near`, `back`, `jail`, `free`, `cash`,
  `repair`, `each`) with its Arabic and English text. A game is two objects:
  `g`, everything on the table (cash, positions, owners and levels, jail,
  jail cards, the turn and its stage, the pot, an offer, a debt, the events)
  - a room uses it as its `shared` - and `priv`, the order of the decks,
  which nobody may see. A turn's stages: `roll` → the move and the square
  (`bankLand`: buy, rent, tax, a card, the bus, jail) → `buy` / `debt` when
  a choice or a payment waits → `act` (build, trade, mortgage) → the next
  player (`bankNextTurn`, which also finishes the lap once the time is up and
  ends the game back at the first player). Money owed that the cash doesn't
  cover is a debt (`bankCharge`), and what was waiting on it (a jail fine's
  move) runs once it is paid. `bankRaise` sells back and mortgages for
  someone (the computer, the clock, the birthday); `bankAuto` plays a turn
  out for the clock or the host; `bankBotMove` is the computer players;
  `bankOnlyMove` the forced move. `bankRents(g, i)` is a place's four rents
  as the table plays them (the classic ones, or with `highRent`); the rent
  rule and the card on screen both read it, never `BANK_SQUARES[i].rent`
  directly. `bankDice(g, rnd)` is a roll for this table (one die or two,
  `settings.oneDie`) and every roll goes through it - the turn, the clock's
  roll, the company card's - and `bankRollOff(ids, rnd, 1 | 2)` the start;
  in `bankRoll` a 6 on one die is the `dbl` of two. The first lap is `g.lapped` (who has passed
  Start, set in `bankPassStart`, whose `start` event carries `first` the
  first time) and `bankCanBuyYet`, asked by `bankLand` (a free place writes
  a `notYet` event and the turn goes on), `bankBuy` and both sides of an
  offer (`bankTradeLapped`); the phone shows 🔄 on the chip of anyone not
  round yet, says so in the bar and on the card, and in the offer panel.
- **`RoomBank.js`**: the lobby (`token`, `seat`), `start` / `playAgain`
  with the host's options (`length`, `pot`, `go400`, `turnClock`), every
  turn move checked against `seq` (turnSeq) and every place move against
  `ev` (eventSeq), `answer` from the player an offer was made to, the turn
  clock (`clockEndsAt`, reset each new turn by `turnNo`), leaving, the bot
  hook (an offer to a bot is answered first) and the forced moves.
- **`JS_Bank.html`** draws a game on any screen. The ring is 40 buttons
  placed in percent of the board (`bankSqRect`: corners 13%, sides 8.2%),
  each with its colour band toward the middle, its owner's dot toward the
  edge and its buildings on the band; what a square shows sits in an inner
  box clear of the band (`.bank-sq__in`). The board is a container: from
  520px wide every square also shows its name and price, so the phone gets
  a map and the laptop and the TV the whole board. The middle holds the two
  dice (the app's 3D die) and the card in play: the square just landed on,
  the card just drawn, or the square the player tapped. Under the board: the
  players (their piece, cash, jail and jail cards), the game's time, the bar
  (only the player whose turn it is gets buttons), an offer card for the
  one it was made to, and two panels the player opens on their turn:
  🏗️ their places (build, sell back, mortgage, redeem, each only when the
  rules allow) and 🤝 an offer (who to, what to give, what to take). The
  motion: the dice tumble, the piece hops square by square, money flies
  from the one who pays to the one paid (`flyEmoji`) and the cash counts
  up, a purchase or a building pops, a card turns over. Against the phone
  lives here too (`appState.bank`, `bankLocalNext` for the computer players
  and the forced move), and its time stands still while the screen is shut.
- **`JS_RoomBank.html`**: the lobby's pieces, seats and options, the room
  and TV frames, the turn clock and the host's "play for" a phone that went
  quiet for a minute.

## History

The day-by-day log of the work on this game is in `notes/log.md` (search it for the game's name); a new entry goes there, and anything that changes how the game works goes in this file.
