# خمّن مين (id `guesswho`)

Moved from GEMINI.md on 30 Sep 2026. GEMINI.md keeps the rules that apply to every game and an index; this file keeps the detail, word for word.

## From GEMINI.md: The owner's specs, as built

- **خمّن مين, reworked** - the owner's decisions of 29 Sep 2026 ("improve the
  cards people look as style and look, and new things to ask about ... remove
  the question part, so the player always thinks about what he wants to ask
  ... and remove anything auto, since they don't know what we will answer"),
  every point asked first. They replace the list, the auto-flip, the "look
  again" refusal and the computer players of the spec below:
  - **No list of questions**: every question is **asked out loud or typed**.
    The bar has 🗣️ بصوتك (first), ✍️ اكتب and 🎯 خمّن, with a line of example
    questions over them.
  - **Nothing automatic**: the other player's yes or no is taken as given (the
    phone doesn't know the question), faces go down by hand only, and the
    clock never answers for anyone - a question left unanswered is dropped
    and the turn passes.
  - **No computer players** (they could only ask from a list): a room needs
    two people (`players: [2, 12]`, the hub's `min: 2`).
  - **Richer faces**, look ب «ألبوم ناعم» picked from a design sheet of three
    (`notes/guesswho-looks-sheet.html`, https://claude.ai/artifact/SLPXLhRJAg9Tbh2rYRAU6V):
    worn - glasses, sunglasses, a cap, **a hijab**, a scarf, a tie, a bow tie,
    headphones, earrings, a necklace, several on one face; the face - a
    smile, a big laugh or serious, freckles, rosy cheeks, a mole, thick
    eyebrows, wrinkles; hair - short, long, curly, a bun, a ponytail, braids,
    spiky, bald, beards and moustaches, five colours; clothes - a tee, a
    hoodie or a collar shirt, plain, striped or dotted, in eight colours a
    family names.
  - **Readable at a card's size** (the owner: "make sure the card in its
    actual size would be easy to see the details"): the details drawn bold,
    the picture cropped to the head and shoulders, **4 cards a row on a phone
    held upright for 16 and 24 faces, 5 for 30** (65-85px a card; the board
    scrolls under the bar), your own face bigger beside the board and the
    question, and **a face held down opens big** with every detail, on any
    board, the watchers' included.
  - Decided here (open to change, each one place in the code): **a hijab
    covers the hair, the ears and the neck**, so a face with one has no
    earrings, scarf, collar, tie or necklace (they couldn't be seen), and it
    ends on the chest so the shirt still shows; what "black hair?" means for
    her is the table's call. **A cap never sits on a bald head, a bun, a hijab
    or with headphones**; glasses or sunglasses, never both (sunglasses hide
    the eyes); a hijab, a cap or a scarf is never the shirt's own colour. Two
    faces on a board never look the same (`gwSignature`, what can be seen).
    The backdrops are pale and go by the face, never by a clothes colour.
    A room saved before the rework plays on (its faces draw with the plain
    fields, an old `hat` as a blue cap).

- **خمّن مين (Guess Who)** - the owner's spec of 22 Sep 2026, every rule
  asked one at a time, look ب "ألبوم" picked from a sheet of three
  (*خمّن مين*); the list, the auto-flip and the computer players below were
  removed on 29 Sep 2026 (above):
  - **A room only: two duel, the rest watch on their phones or the TV, the
    winner stays on** (the duels' line). Not against the phone, not one phone.
  - **Drawn faces** (hair, glasses, a cap, a beard, a moustache, earrings,
    eye colour) with Egyptian first names, a new mix each game; never photos.
  - **16, 24 or 30 faces**, a lobby choice, 24 by default.
  - A turn is **one question or one guess**, never both.
  - A question is **picked from the list**, **typed**, or **asked out loud**,
    and **the other player answers it**, yes or no, on their phone - a list
    question too (the owner, 23 Sep 2026, changing the first build, where
    the server answered a list question itself: "it's like playing vs the
    computer"). The list question shows big beside the answerer's own secret
    face, and **a wrong tap is refused** - the phone says «بص تاني على وشك»
    and sends nothing, and the server checks it the same way - so a slip
    never spoils a game. A typed or out-loud answer is taken as given.
  - **Faces are put down by hand, by default** (the owner, 23 Sep 2026: "like
    the board"); the lobby switch that lets a list question's ruled-out faces
    fall by themselves stays, **off by default**. A typed or out-loud
    question is always flipped by hand: the phone can't judge it.
  - **The table's moments** (the owner's picks, 23 Sep 2026): while the other
    decides, the asker sees «💭 الإجابة عند …» with three breathing dots; the
    answer lands as **a big أيوه / لأ bubble with a sound** on both phones, the
    watchers' and the TV; **a guess is a drum roll over «منى: هو مجدي؟»**, then
    صح or لأ, and the secret faces turn only after it. (Quick reactions were
    offered and not chosen.)
  - **A wrong guess loses the game**, a switch; the other way it loses the
    turn and that face goes down.
  - **The secret face is dealt at random**, a switch; the other way each
    picks their own.
  - A turn clock **off by default, 30 or 60 seconds**; it passes the turn.
  - **Computer players, easy and hard.**
  - Decided here: a computer player can't hear or read, so against one there
    is no out-loud or typed question; it asks from the list and answers a
    list question put to it (after a second's thought), hard taking the question that
    comes closest to halving what it has left; the watchers and the TV see
    both boards (how many faces each has put down is public, as on a real
    table) but a secret face only once the game is over; any face can be put
    down or back up by hand at any time; a seated player who leaves loses by
    forfeit, as in the duels; a board never holds two faces the list can't
    tell apart. **With the turn clock on, picking your own face has a clock
    of its own, 60 seconds** (`GW_PICK_SECS`, the audit of 23 Sep 2026: it had
    none, so one player could hold the game), and whoever hasn't picked is
    dealt a face; a turn skipped while the other was to answer says so
    («… ما ردّش»), not that the asker didn't ask.

### خمّن مين

The owner's rules are in *The owner's specs*. Built on the duels:

- **`GuessWho.js`** (shared, no DOM). A face is a set of plain features
  (the full list in the file's header: `g`, `skin`, `hair`, `style`, `hijab`,
  `beard`, `mous`, `brows`, `eyes`, `mouth`, `freckles`, `rosy`, `mole`,
  `wrinkles`, `glasses`, `sun`, `phones`, `cap`, `ear`, `necklace`, `scarf`,
  `top`, `tie`, `pattern`, `shirt`, and `name`, an index into `GW_NAMES[g]`,
  one name in both languages); a colour is an index into `GW_COLOURS`.
  `gwRandomFace` keeps the rules of what can go together (*The owner's
  specs*), and `gwDealBoard(size)` deals half men and half women, no two with
  the same `gwSignature` (everything that can be seen). There is no list of
  questions and no computer player: `rules.mjs` checks the boards, the rules
  of what goes together, and that every feature turns up.
- **`RoomGuessWho.js`** is the room, bundled after `RoomDuels.js`, whose line
  and seats it uses: `duelSeatNext` seats the next game, `duelEnd` scores
  one and moves the line, so the champion, the streak and the night's board
  are the duels' own. The secret faces are `room._gw.secret`, never
  projected; each seated phone gets its own in `room.secrets[pid].face`, and
  `shared.reveal` only once the game is over. The stages of a turn are
  `ask` (a typed question `typed { text }` - one line, 80 characters - an
  out-loud one `loud`, or a guess), `answer` (the other phone taps yes or
  no, taken as given: `gwTakeAnswer`) and `flip` (faces put down by hand,
  then `done`). `flip { face, down }` works any time in play, so a double
  tap is one flip. Every turn move carries `seq` (`turnSeq`). The clock
  restarts for whoever must act - the asker, then the one answering, then
  the asker flipping (`gwStartClock`); the clock and the host's `skipTurn`
  pass the turn, dropping a question nobody answered; in `pick` they deal a
  face to whoever hasn't picked. A guess leaves `shared.q = { kind: 'guess',
  face, right }` for the page's drum roll. No `ROOM_BOT_GAMES` entry, so the
  lobby can't seat a computer player.
- **`JS_GuessWho.html`** draws it: `gwFaceSvg` builds a face from its
  features (look ب, soft gradients and patterns with ids per picture,
  cropped to `viewBox="5 12 90 98"`), `gwBoardHtml` the board (`--gw-cols`
  where the board takes the height - 4 for 16, 6 for 24 and 30 - and
  `--gw-cols-n` on a phone upright - 4, 4, 5), `gwBarHtml` the one bar of
  what to do, and the pills, the line, the result and the "next game" card
  are the duels' (`duelPillsHtml`, `duelRoomOverHtml`, `duelRoomLineHtml`).
  **A hold opens a face big** (`gwWireHold`: 380 ms on a card without
  moving, `gwZoomOpen`, closed when the finger lifts, and the tap it ends in
  doesn't flip the card, `gwHold.until`); every card on every phone board
  can be held (`data-gw-face`, or `data-gw-zoom` where a tap does nothing),
  your own face too, and a long press's menu is kept off the pictures. A
  face flipped by hand is drawn at once and remembered, so the server's
  board doesn't make it fall again (`gwNewlyDown`, `gwFall`). The
  answerer's card is `gwAnswerCardHtml` (the question big beside their own
  face). `gwMoments` plays the newest log entry once per phone
  (`duelOnce`): an answer as the bubble, a guess as the drum roll
  (`gwLocal.drama` holds the reveal's turn until it is over, through
  `--gw-wait` and `data-reveal-ms`); the sounds are `gwSound`, heard where
  `duelRoomLoud` says. A typed question survives a redraw under it
  (`gwLocal.typed`, focus put back). Upright the board comes under your
  face and the last question, the bar sticky at the foot; on a phone on its
  side and from 900px the board takes the height (`--gw-aspect`) with
  everything else in a column beside it. The TV is both boards and the
  question between them.

## History

The day-by-day log of the work on this game is in `notes/log.md` (search it for the game's name); a new entry goes there, and anything that changes how the game works goes in this file.
