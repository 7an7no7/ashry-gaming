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
    (`notes/archive/sheets/guesswho-looks-sheet.html`, https://claude.ai/artifact/SLPXLhRJAg9Tbh2rYRAU6V):
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

**The answer's clock is the answerer's (the review of 1 Oct 2026).** While a question waits for its answer (`stage: 'answer'`) the last five seconds tick on the answerer's phone, not the asker's. The TV's signature carries the seated two's presence, so the host's «play for» shows on the TV as soon as one of them is away.

## «غلطت»: an answer taken back (the review of 1 Oct 2026)

A mis-tapped أيوه / لأ could not be taken back. While the asker is putting faces down
(`stage: 'flip'`), the one who answered has «↶ غلطت» under a line saying what they answered
(`gwBarHtml`, `gw_undo`, `gw_undo_hint`), sending `unanswer { seq: turnSeq, log: logSeq }`.
The server (`gwUnanswer`) puts the asker's board back as it was when the answer came
(`room._gwUndo`, kept by `gwTakeAnswer` with the turn's and the log's numbers), takes the
answer out of the log and logs `{ kind: 'undo', seat }` in its place, and the question
waits for its answer again (`gwWaitAnswer`: the answerer's clock starts over). Only the
answerer, only that answer: a tap drawn for an older seq or log is dropped, and once the
asker taps «خلصت» the answer stands. Every phone and the TV play the take-back once as an
amber bubble («↶ منى رجّع إجابته», `gw_undone`, `.gw-bubble.is-undo`, `gwMoments`); the
history skips it.

## «فريق ضد فريق» (teams): built 2 Oct 2026 (the owner's answers of 2 Oct 2026)

Picked from the ideas page of 2 Oct 2026 (https://claude.ai/artifact/7Mhgw1ePSi3GhgEvDcSHxz, idea numbers in brackets) and every rule asked.

- **(241) Two teams, one secret face each and one shared board per team.** Everything stays by hand, as the rework of 29 Sep decided (no list, nothing automatic, no computer players).
  - **Everyone picks a side** on their phone in the lobby. Start needs at least one person on each side; lopsided sides are allowed.
  - **Anyone on the team flips faces down**, and a flip goes down on every phone of that team at once - the arguing out loud is the game.
  - **Anyone on the team answers** the other team's question: the first tap of نعم / لأ counts.
  - **The final guess needs two phones**: one teammate picks the face, a second taps «متفقين» before it is sent.
  - **A lobby switch from 4 people, off by default**; two-player خمّن مين stays as it is.

### How it is built

- **The switch and the sides are the room's**, so every phone sees them: `shared.lobby = { teams, sides { pid: 0 | 1 } }`
  (`gwLobby` in `RoomGuessWho.js`). The host's `gwTeams { on }` turns it on or off (lobby only); anyone in the room
  sends `side { side }` from their phone. On the page the host's «مين بيلعب» segment (`gwLobbyModeHtml`, shown from
  `GW_TEAMS_MIN` people, or while it is on) and everyone's two columns with «انضم» (`gwLobbySidesHtml`, reusing
  `.vc-sides` / `.hm-side--k`); `startBlock` greys Start until each side has someone; `tourOff` hides the duels'
  tournament choice (a hook added to `tourLobbyHtml` in `JS_RoomTournament.html`); a TV that isn't the host shows the
  two sides (`tvLobbyPlayers`). With the switch on, `start` goes to `gwNewTeamGame` *before* `tourAction`, so a
  tournament flag in the payload is ignored.
- **A "seat" is a team.** `settings.teams`, `teams [[red], [blue]]`, `down [red's board, blue's]`, `turn` the team up:
  `gwSeatOf` returns the team in this way, so `flip`, `done`, `answer`, the clock, `skipTurn` and the stages are the
  two-player code. No `seats`, `line` or `champ`; `nightPlayedIds` reads `teams`.
- **Secrets**: `room._gw.secret[k]` is team k's face; `gwWriteSecrets` gives it to every member still here
  (`secrets[pid].face`). Leak probes (`leaks.mjs`): a phone holds only its own team's face; the proposed face is only on
  the proposing team's phones and never in `shared`.
- **Asking and answering**: anyone on the team up sends `loud` / `typed` (`q.by`, `q.byName`); anyone on the other
  team answers - the first tap moves the stage on, so a second is dropped (`q.answerBy`, `answerByName`). «غلطت» is
  only the one who tapped (`room._gwUndo.by`).
- **The final guess**: `propose { face, seq }` → `room._gw.propose { team, by, face, n, endsAt }` and `shared.propose`
  without the face; a second teammate's `agree { n, seq }` makes it `gwGuess` (logged with `by` / `byName`); the
  proposer's «إلغاء» or a teammate's «لأ، استنى» is `unpropose { n }`; asking instead, the turn passing or the end drops
  it (`gwDropPropose`). It lapses after `GW_AGREE_SECS` on the server's clock (`gwDeadline` / `gwTimeout` do the
  proposal and the turn clock in one pass). A team with one member here (`gwTeamHere`) guesses at once; `guess` in
  one tap is refused in teams. On the page: `gwTeamBarHtml` (the proposer waits with the 20 s ticking, `gwTickAgree`;
  a teammate sees the face beside «متفق إنه …؟» with «🤝 متفقين» / «لأ، استنى», the `.gw-ask-me` card).
- **The end**: `gwTeamEnd` - each member of the winning team still here scores a win (`scores`, so the night's board
  puts them all first: competition ranking, the others after), `tw` counts the teams' wins (the pills),
  `result { team: true, winner, reason: guess | wrong | left, winners, losers }`, both faces revealed. «الماتش اللي
  بعده» (`nextRound`) keeps the sides (`gwFitTeams`: a leaver off, a latecomer on the smaller side) and the other team
  starts (`first`); between games anyone moves themself with «روح الأحمر/الأزرق» (`side` in 'over', `gwTeamOverHtml`),
  written to `nextTeams` (what `nextRound` deals and the over screen draws), never to `teams`, which stays who played
  this game (the night's points read it, so a latecomer moving sides banks nothing).
- **Leaving** (`gwPlayerLeft`): a team with nobody left here loses by forfeit (`left`); otherwise the game goes on, and
  a proposal by the leaver, or one whose team has fewer than two here, is dropped. With teams on, the host's lobby
  options are never folded (`lobbyUnfolded`). The host's «عدّي الدور» shows when the whole team waited on is away or 40 s
  passed (`gwHostRow`).
- **The page**: `gwIsTeams`, `gwMySeat`, `gwNames` (the team names in sentences: «الفريق الأحمر»), the pills with the
  short names (`gw_short_k`) and each team's members (`<bdi>`), `gwTeamStatus`, `gwTeamCheer` (confetti on the winning
  team's phones), the turn alert (`roomTurnOf` in `JS_RoomTurn.html`: your team's turn, or its answer to give). The
  TV: both boards with the team's colour on its name (`.gw-tv-team--k`) and its members (`.gw-tv__members`), the line
  «الفريق الأزرق بيتفقوا على تخمين» while a proposal waits, and at the end both faces and a line a side for the next
  game. The words are in the chunk (`GW_TEXT` in `JS_GuessWho.html`, `gwT` falls back to it); the help in `GAME_RULES`
  (two lines each language: the shell's budget is full).
- Tests: `rules.mjs` («guesswho teams: …»), `leaks.mjs` (a five-person team game with proposals, cancels and a lapse,
  then a side moved and the next game), `play-all.mjs` (segment `guesswho`, «guess who in teams»).

- **The team pills on a phone** (2 Oct 2026): a team's members wrap onto as many lines as they need
  (`.gw-team-sub` inside the pill's sub line: the names, then «انت · باقي N»), the pill a rounded card
  (`.gw-team-pills`, `--r-lg`) - on a 375px phone the members used to be cut off after the first name.

### Decided here (open to change)

- **Every member's name stays on the pill**, wrapped (no count with names on a tap): a team is at most
  half a room, and two or three lines fit the pill on every size.
- **In teams the secret face is always dealt at random** (one face a team; "each picks" is a two-player switch and
  is hidden while teams is on).
- **Someone who didn't pick a side** when Start is pressed joins the smaller side (ties to red); Start still needs
  someone who picked on each side.
- **The proposal waits 20 seconds** (`GW_AGREE_SECS` in `GuessWho.js`), then lapses with the turn unchanged; only one
  at a time; the proposer cancels, and a teammate may also say «لأ، استنى» (which cancels it too).
- **Which faces a team put down is public, as in two-player** (the TV and anyone watching see both boards); a team's
  phones draw only their own board. The proposed face is the team's secret until it is agreed.
- **No winner stays / line in teams**: the sides stay for the next game, the other team starts, anyone moves
  themself between games, a latecomer joins the smaller side. The duels' tournament is not offered with teams on.
- Only the one who answered can take it back («غلطت»).
- A team's wins in a row of games show on its pill (`tw`); each member's wins are the room's board.

## History

The day-by-day log of the work on this game is in `notes/log.md` (search it for the game's name); a new entry goes there, and anything that changes how the game works goes in this file.
