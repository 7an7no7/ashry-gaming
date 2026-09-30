# الدومينو (id `domino`)

Moved from GEMINI.md on 30 Sep 2026. GEMINI.md keeps the rules that apply to every game and an index; this file keeps the detail, word for word.

## From GEMINI.md: The owner's specs, as built

- **الدومينو (Domino)** - the owner's spec of 21 Sep 2026, asked one rule at
  a time, built the same day (*الدومينو in rooms*, *الدومينو on the phones and
  the TV*); the score keeper for real tiles is the setup screen's other side
  ("على الطاولة", `JS_Domino.html`, untouched).
  - **2 to 4 players**, people and/or computer players. **Solo or teams**;
    teams with four only, **partners opposite** (seats 1 & 3 against 2 & 4),
    **seated by the host in the lobby: at random, with swaps**.
  - **The double-six set, 7 each.** With 2 or 3 the rest are left to draw
    from: whoever can't play **draws until they can, and plays**, or passes
    once nothing is left; with 4 there is no drawing, and whoever can't play
    **passes**. The button says **باص / Pass** (the owner, 21 Sep 2026: it
    said دق / Knock, the table word, and "Pass" says what it does); the seat
    still gets the 👊 and the two knocks of a hand on the table. In the code
    the move is still `pass` and the table's memory of it `knocked`.
  - **Who starts**: round 1, whoever holds the double six plays it; nobody
    holds it (2-3 players), the highest double in anyone's hand; no double at
    all, the heaviest tile. **Later rounds: the winner of the last round
    leads with any tile.**
  - **عادي (Egyptian)**: a line with two ends; the round ends when someone
    plays their last tile or the table is blocked (قفلة). **Going out takes
    the pips left in the opponents' hands - in teams the two opponents only,
    the partner's leftovers counting for nobody. Blocked: the lowest hand
    takes the total of all the other hands; in teams the side with the lower
    total takes the other side's; a tie for the lowest scores nobody.**
    Target 101 by default (51 / 101 / 151 / 201).
  - **أمريكاني (All Fives)**: the first double played is the spinner, open on
    four sides (up and down once both of its sides have a tile). After every
    tile the open ends are added up (a double at an end both halves, the
    spinner alone both halves); **a multiple of 5 scores, 5 = 1 point**. The
    round's winner takes the others' pips (the same who-counts rules)
    **rounded to the nearest 5 and divided by 5**. Target 50 by default (30 /
    50 / 100).
  - **First to the target wins** (in teams the side's total); two past it in
    the same round, the higher total wins.
  - **The helpers are the host's, for the whole table, off by default and
    remembered**: light up the tiles that fit, and show a move's points
    (أمريكاني: the +2 each end would score). Off, nothing is lit - people use
    their heads - and a tile that doesn't fit is still refused.
  - **A turn clock**, off by default, 30 or 60 seconds: when it runs out the
    phone plays for the player (the first tile that fits, else draw, else
    knock). The host also gets a small button to play for a phone that went
    quiet, on the phone and the TV.
  - **Every lobby setting is remembered on the host's phone.**
  - **Computer players**: easy plays the first tile that fits; hard plays to
    win (heavy tiles out, a spread of numbers kept, the knocked numbers
    remembered and closed on whoever knocked, the partner helped; in
    أمريكاني the most points now, and no easy multiple of 5 left for the next
    player), from its own tiles and what the table can see only.
  - **A tile that fits more than one end**: tap it, the ends glow, tap one;
    one end, it goes straight there.
  - **The look**: option أ "عاجي" from the owner's design sheet (ivory, black
    pips, a brass pin); a snake that turns corners on a phone, a cross round
    the spinner in أمريكاني; an animation on every move that can have one.
  - **While a round is played the table gets most of the screen, at every
    size** (the owner, later the same day): on a laptop and the TV the line
    of tiles is big and uses the space, never small beside a wide panel of
    names and scores; seats, tile counts and scores are a compact strip -
    readable from the sofa on a TV, but not taking the room; on a phone held
    upright the line and your hand come first; the results can take over
    once the round or the game is over.
  - Decided for the owner, and open to change: **the game is decided at the
    end of a round**, so points scored mid-round in أمريكاني count toward it
    but the round is played out (the owner's "two past it in the same round"
    only happens that way); **two level on top play one more round**; **after
    a tied round nobody won, so the next round opens by the first round's
    rule**; **the opening tile of that rule is played by the server** (it is
    no choice); **a blocked table is declared the moment nothing can go**,
    rather than after everyone has knocked; **with a tile that goes on two
    ends that come to the same thing** (the same ends left, the same points)
    it goes straight on, with no question; **a player who leaves on their
    own has their tiles set aside** (seen and counted by nobody) and play
    goes on while two are left; **in teams a leave ends the game**, decided by
    the scores so far; **five or more in the room can't start it** (it is 2-4
    players - the rest can be a screen or wait); **the host's "skip" plays
    for the player** the way the clock would, rather than passing a turn they
    might have played; and the draw button **draws until a tile fits in one
    tap** (the table sees how many were drawn), with باص a tap of its own.

## From GEMINI.md: Decided, and why

- **Domino's "can't play" button says باص / Pass** (owner, 21 Sep 2026); it
  said دق / Knock, the table word.

## From GEMINI.md: Multiplayer rooms

**الدومينو in rooms** (`dominoAction` in `RoomDomino.js`, bundled after
`RoomGames.js`; the tiles in `DominoTiles.js`, shared with the page), the
owner's spec (see *The owner's specs*). 2 to 4 players, people or computer
players; everyone for themselves, or with four two sides with partners
opposite (seats 1 & 3 against 2 & 4, `shared.teams`, keys `A` and `B`).

- **The tiles** are their two numbers low first, `'0-0'` … `'6-6'`
  (`dominoSet`, `dominoParse`). The table is `shared.table = { line, root,
  spinner, up, down }`: `line` left to right, each `{ t, a, b }` with `a` the
  number facing the left end; `root` the first tile of the round; in
  أمريكاني `spinner` is the first double played (the lead included) and `up` /
  `down` its other two arms, which open once both of its sides on the line
  hold a tile (`dominoArmsOpen`). `dominoEnds` gives the open ends,
  `dominoFits` where a tile goes (an empty table takes anything, on `R`),
  `dominoPlace` the table after a move, `dominoEndsSum` the ends added up the
  way أمريكاني counts them (a double across an end both halves, a tile alone
  both halves, an arm of the spinner nothing is on yet nothing) and
  `dominoPointsOf` its points (a multiple of 5, 5 = 1). `dominoRoundResult`
  scores a round from the hands (going out, blocked, a tie, teams, rounding
  with `dominoRounded`), `dominoStarter` says who opens, `dominoGameWinner`
  who has won. `rules.mjs` pins every one of these.
- **What is hidden.** Every hand is `room._domino.hands` and reaches a phone
  only as its own `room.secrets[pid].hand`; the tiles left to draw
  (`room._domino.bone`) never leave the server, only their count
  (`shared.bone`). `shared.counts` says how many each player holds. The hands
  are published in `shared.result` when a round ends. A player's `knocked`
  numbers (the ends showing when they knocked) are public - the table saw
  them - and cleared when they draw new tiles or play one of those numbers.
- **A round.** `dominoDeal` deals seven each (the rest is the pile to draw
  from with two or three players, `shared.drawing`; set aside with four). The
  first round opens by itself: the double six, else the highest double in
  anyone's hand, else the heaviest tile (`dominoStarter`), played by the
  server as a `play` event with `forced`. Later rounds are led by the winner
  of the last one (`shared.lead`) with any tile; after a tie nobody won, so
  the first round's rule opens again. A turn is `play { tile, end, seq }`
  (the end may be left out when there is one), `draw { seq }` - refused while
  a tile fits; it draws until one that fits comes up, and the turn stays -
  or `pass { seq }`, the knock, refused while a tile fits or there is still
  something to draw. Every move raises `shared.turnSeq` and carries it, so a
  stale tap is dropped. After every move: a hand emptied ends the round
  (`out`); nothing anyone holds fitting and nothing left to draw ends it
  blocked (`قفلة`, detected at once rather than after everyone has knocked);
  otherwise the turn goes to the next seat. In أمريكاني each play is scored
  on the spot (`pts`, `sum` on its event; `shared.gained` keeps the round's).
  The round's result goes to `shared.result`, the totals to `shared.scores`
  (a player's id, or `A` / `B`), and the game ends when the round leaves a
  unit alone on top at or past the target (`gameover`, `winner`, `winners`);
  two level on top play one more round. `shared.board` is every seated
  player with their unit's score, best first, for the night's leaderboard.
- **The host's options** (`ashry…` memory: `recallOptions('dominoRoom')` on
  the host's phone): عادي or أمريكاني, teams (four only), the target (51 / 101
  / 151 / 201, or 30 / 50 / 100), the two helpers (`helpFit`, `helpPoints`,
  أمريكاني only) and the turn clock (0, 30, 60). The seats of a game of teams
  are the room's, not the phone's: `seats { teams, order | shuffle }` (host,
  lobby only) keeps `shared.lobby = { teams, order }`, so every phone sees the
  partners before the start; the host's phone sends it once (`domLobbySync`)
  when teams is on with four players and no seats are drawn for these four -
  at random, the owner's default - and two taps on the strip swap two seats.
  Play again keeps the seats.
- **Clocks, the host, leaving.** The turn clock is a server deadline
  (`dominoDeadline` / `dominoTimeout`); when it runs out the server plays for
  the player (`dominoAuto`: the first tile that fits, else it draws and plays
  what came, else it knocks) with an `auto` event. The host's `skipTurn`
  does the same for a phone that went quiet (the button shows for a phone
  that is away, or that has held the turn 40 seconds). A player who leaves
  on their own has their tiles set aside - out of the round, seen and counted
  by nobody - and the turn moves on; one player left ends the game. In teams
  a side one short can't play on, so a leave ends the game there
  (`shared.ended = 'left'`), decided by the scores so far.
- **Computer players** (`ROOM_BOT_GAMES.domino`): a bot's move is computed
  from its own `room.secrets` hand and the table - never another hand, never
  the pile. `easy` plays the first tile that fits; `hard` scores every legal
  move (`dominoBotScore`): heavy tiles and doubles first, a spread of numbers
  and ends it can follow, the next opponent's knocked numbers left open,
  nothing its partner knocked on; in أمريكاني what the move scores now, less
  what the unseen tiles would let the next player score.

**الدومينو on the phones and the TV** (`JS_RoomDomino.html`, section 21 of
`Style.html`).

- **The look the owner picked** (21 Sep 2026, option أ "عاجي" from a design
  sheet): ivory tiles (`--dom-ivory-*`, the same in both themes) with a
  thickness under them, black pips on a 3 × 3 grid per half (turned with the
  tile), a thin dark bar and a brass pin; the back ivory with an engraved
  frame. One builder, `domTileHtml` / `domBackHtml`, sized by `--u` (the short
  side; the default is on `:where(.dt)` so every context that sizes a tile
  wins). The felt carries the screen's accent.
- **The table is a physical layout** (`dir="ltr"` in every language), laid out
  by `dominoLayout` in grid units: a tile 2 × 1, a double across (1 × 2),
  arms running straight from the root until the next tile would pass the
  edge, then a corner and back the other way a row further out - the right
  arm snaking down, the left one up. In أمريكاني the spinner is the middle of
  a cross and each arm has its quarter (the line's arms keep out of the
  column above and below the spinner, its up and down arms out of the row
  beside it), the up arm snaking right and the down arm left. Every placement
  is checked against what is already down with a unit of look-ahead, so a run
  stops where its corner still fits; a corner tile and the one after it lie
  along the line even when they are doubles. `dominoFitLayout` tries widths
  and keeps the one that shows the tiles biggest in the box (keeping last
  move's width while it is nearly as good, so rows don't jump), and
  `domLayoutTable` scales it in, marks the open ends, and slides any tile
  whose place changed (a spinner re-centres the cross). It runs again on
  every resize. `rules.mjs` draws hundreds of full tables at phone, sideways
  and TV sizes and checks that no two tiles overlap.
- **Playing.** A tap on a tile in your hand plays it; when it goes on ends
  that come to different things (`domDistinctEnds`: the ends left and the
  points), those ends glow on the table and in the bar, and a second tap
  says which. A tile that doesn't fit is only refused (a shake and a line),
  and draw and knock are refused on the phone while something fits, without
  saying what. The host's helpers light up what fits (`is-fit`, the rest
  `is-dim`) and show a move's points on each end and on each tile. The seats
  are round the table as you sit (the one before you on the left, the one
  after you on the right - the turn goes right, as at an Egyptian table);
  each shows its tiles face down with a count.
- **Every move has its motion** (`domPlayEvents`, one choreography per event,
  Web Animations of transform and opacity on ghosts laid over the page, the
  landing tile hidden until then - `dom-hold` - and the table waiting for it,
  `domFx.busyUntil`): the deal flies seven backs to every seat and your own
  tiles into your hand; a play flies the tile from your hand (or face down
  from the player's seat, turning face up on the way) to its place, turning
  a quarter when it lies down, with a band for the opening double six;
  drawn tiles fly from the pile; a pass jolts the seat with 👊 باص and the
  knock sound; a scored move floats its +points up from the tile and pulses
  the ends' sum; the spinner rings as it becomes one and keeps an outline;
  going out and قفلة put a band across the table. A round's end shows the
  final table, then turns the hands over one by one counting their pips up,
  then says who took what and why (the pips, and in أمريكاني their rounding),
  then counts the totals up (`domRunReveal`). The game ends on the podium, or
  on the two sides with the winner crowned, and confetti after it. Nothing
  replays after a reload or the lock screen (`domWokeRecently`). The sounds
  are three short ones added to `FX` from this file (`domClack`, `domKnock`,
  `domScore`), not on the soundboard.
- **Fitting: while a round is played the table gets the screen** (the owner,
  21 Sep 2026, for every size): who is at the table is one compact strip
  (`dom-top`: the round, the mode, the clock and every score as chips, then
  the seats, each a short line of name, tiles face down and a count), the
  table takes most of what is left, and your hand with what to do is under
  it (`dom-play`). Upright on a 375 × 812 phone all of it fits with nothing
  scrolled; on your turn (and when a tile is picked) the page keeps the hand
  and the bar in sight (`domHandInView`). On a phone's side the table is one
  column, full height, and the strip, the seats (one line each) and your hand
  the other. On a laptop the table runs the whole width under the strip,
  with your hand and the bar in one row beneath it, and the tiles grow with
  the box (a phone's stop at 34px a side; here up to 90). The TV is the table
  under a strip of badges, the seats in turn order (the one up lit) and
  whose turn it is, with the TV's own score strip at the foot. Measured with
  the round under way: the table is 97% × 72% of the TV at 1280 × 720 and
  1920 × 1080, 86-89% × 56-66% of a laptop's window, 86% × 38% of an
  upright phone (the hand and the bar take the rest). The end of a round
  and of the game take the screen instead: the table beside the reveal and
  the totals on a TV and a laptop (the game's end on a TV shows the podium
  or the sides, the line and the totals, and leaves the last hands to the
  phones so it fits one screen).

## From GEMINI.md: Next batch: small (three owner-approved touches)

**3. الدومينو: the numbers each seat passed on (JS_RoomDomino.html)**

- `domLacksHtml(s, pid)` in `domSeatHtml`: a small gold chip `👊 4·6`
  (`.dom-seat__lacks`, the digits in a `<bdi dir="ltr">`, an aria-label «قال باص على:
  4 ، 6» / "Passed on: 4, 6") from `shared.knocked[pid]`, **only with the host's
  helpFit on** and while a round is played. Shown on the phone's seats and the TV's seat
  strip (the same builder). Off, nothing.
- On a phone upright (max-width 599px, portrait) the chip hangs on the seat's top edge
  (absolute) so three seats across keep their names; elsewhere it sits after the count.
- `domServerSig` carries `knocked` when helpFit is on, so the chip refreshes.
- `dom_help_fit_hint` and the room rules line in GAME_RULES say so (both languages).

**Tests**

- `npm run check` passes.
- Browser (own wrangler on 8821, preview on 4421, headless Chrome, motion on):
  سكرو with two phones at 375x812 Arabic, 667x375 English, 1280x720: the button disabled
  while the move flies, enabled after, a replay shows two ghosts and two holds mid-way and
  leaves nothing held after; no console errors. Trivia board at 375x812 Arabic,
  667x375 English, 1280x720: the switch remembered on and off, the double never on a
  100 and exactly one a board (300 deals), hidden on the board, the slam, ×2 · points,
  a reload mid-card (card back, double, no slam), a steal worth double, the ×2 mark,
  undo taking the doubled points off. Domino with three computer players and a TV
  (1920x1080), helpFit on: a seat's chip on the phone (375x812 Arabic, 667x375 English)
  and the TV; helpFit off: none.
- `ONLY=screens,rooms npm run test:ui http://127.0.0.1:8821`: see the final report.

## History

The day-by-day log of the work on this game is in `notes/log.md` (search it for the game's name); a new entry goes there, and anything that changes how the game works goes in this file.
