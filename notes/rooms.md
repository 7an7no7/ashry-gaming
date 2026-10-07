# Multiplayer rooms, the long version (the files, computer players, a host away, the voting engine, «التالي لوحده», the host menu, judging guesses, the chat, the live count, the audience, browsers, names, sharing)

Moved from GEMINI.md on 30 Sep 2026. GEMINI.md keeps the rules that apply to every game and an index; this file keeps the detail, word for word.

## From GEMINI.md: Multiplayer rooms

**Files**

| File | Role |
|---|---|
| `rooms-worker/src/index.js` | The Worker: `/create`, `/join`, `/act`, `/poll`, `/leave`, `/ws`. Knows no game rules. |
| `rooms-worker/src/room.js` | `Room` Durable Object, one per code: players, keys, sockets, saving, clocks, `project()`. |
| `rooms-worker/src/view.js` | `roomView(room, pid, online)`: what one device is sent, the projection itself - its own file so the leak check builds every view with the same function. A screen also gets `room.screenOnly` as `screen` (الأوضة المضلمة's map), never a phone. |
| `rooms-worker/src/memory.js` | `PromptMemory`: which prompts every room dealt lately. |
| `rooms-worker/src/live.js` | `LiveStats`: how many players are online across every room, for `GET /live`. |
| `Games.js` | `GAME_LIST`: one entry per game, shared with the page; the server's `ROOM_GAME_IDS`, `APP_GAME_IDS`, `PROGRAM_ROUNDS`, `CREW_TITLE_GAMES` and «التالي لوحده»'s list are built from it (2 Oct 2026). |
| `RoomGames.js` | The engine: `applyRoomAction` (the room actions, then one dispatch line per game), the voting engine, the server's clocks, leaving, computer players and forced moves, «التالي لوحده». Each game's rules are in its own file below (the older ones moved out on 2 Oct 2026). |
| `RoomStop.js`, `RoomChameleon.js`, `RoomSpyfall.js`, `RoomBomb.js`, `RoomBuzzer.js`, `RoomImposter.js`, `RoomJustOne.js`, `RoomWhoAmI.js`, `RoomCodenames.js`, `RoomWouldYou.js`, `RoomMostLikely.js`, `RoomFibbage.js`, `RoomDraw.js`, `RoomFakeArtist.js`, `RoomTrivia.js`, `RoomTwoTruths.js`, `RoomQuiz.js` (فوازير إيموجي, كمّل المثل), `RoomFiveSeconds.js`, `RoomTelephone.js`, `RoomMonkey.js`, `RoomHerd.js`, `RoomMind.js`, `RoomTimeline.js`, `RoomMafia.js`, `RoomScrew.js` | The older room games' rules, each in its own file, bundled right after `RoomGames.js` (whose helpers they use), in `FILES`' order. |
| `RoomDuels.js` | The duels' rooms (كونكت ٤, نقط ومربعات): winner stays on. Bundled after `RoomGames.js`, which only dispatches to it (*The duels*). |
| `Connect4.js`, `DotsBoxes.js` | The duels' rules and the phone's players, one copy for the page (inlined, `SHARED_LISTS`) and the Worker (bundled). No DOM; every name prefixed `c4` / `dots`. |
| `TicTacToe.js` | إكس أو's rules (`xoMark`, `xoWinner`, 3 marks only), one copy for the one-phone game, the room's phones and the Worker. |
| `RoomTournament.js` | The duels' knockout: the bracket, every match run as a small room through its game's own rules (`TOUR_KINDS`, one adapter a game), the clocks, leaving, the podium. Bundled after every duel's room file (*The duels' tournament*). |
| `RoomUno.js` | أونو's rules and its computer players, bundled after `RoomGames.js` (whose helpers it uses); `unoAction` is reached from `applyRoomAction`. |
| `UnoCards.js` | أونو's deck and what may go on what (`unoCanPlay`), inlined into the page and bundled into the Worker, so a phone lights exactly the cards the server takes. |
| `CodenamesWords.js`, `PartyContent.js`, `SpyWords.js`, `ChameleonWords.js`, `SpyfallPlaces.js`, `BombPrompts.js`, `EmojiRiddles.js`, `Proverbs.js`, `MonkeyWords.js`, `StopWords.js`, `TriviaQuestions.js`, `SkrewCards.js`, `TimelineEvents.js` | Word lists (and سكرو's cards, and قبل ولا بعد's dates) the rules deal from, bundled into the Worker. Nine of them are also inlined into the page by `tools/build-*.mjs` (the `SHARED_LISTS` comment in `Controller.html`), because the pass-the-phone versions of those games deal from the same lists, a Stop phone checks its boxes with the server's own rule, the solo games ask from the room trivia's questions, and a سكرو phone names and draws the cards the server deals. **Two stay server-only, on purpose:** `PartyContent.js`, because the Fibbage answers in it must never reach a page, and `TimelineEvents.js`, because the years of unplayed cards are قبل ولا بعد's whole secret. |
| `DominoTiles.js` | The domino tiles, the table, the ends and their points, a round's result and the table's layout: pure functions, shared by the page (inlined like the lists) and the Worker, every name prefixed `domino`. |
| `RoomDomino.js` | `dominoAction` and its clock, its leave and its computer players: bundled after `RoomGames.js`, so a game this size keeps its rules in a file of its own. |
| `Ludo.js` | لودو's board (the track, the home columns, the yards as cells), every rule as one plain game object, and the computer players: shared by the page (inlined, `SHARED_LISTS`) and the Worker, every name prefixed `ludo`. |
| `RoomLudo.js` | `ludoAction`: the lobby's colours and seats, the server's dice, the clock, leaving, the bots and the forced move. Bundled after `RoomGames.js`. |
| `Snakes.js` | السلم والتعبان's board, the map made from a seed and checked fair (`snakesGenMap`), and the rules as one plain game object: each roll one event with the variant of its animation and how long it takes to show (`snakesRoll`, `readyAt`). Shared by the page (inlined, `SHARED_LISTS`) and the Worker, every name prefixed `snakes` / `SNAKES_`. |
| `RoomSnakes.js` | `snakesAction`: the lobby's colours and seats, the server's dice, a roll waiting for `readyAt`, the clock, the host's "play for", leaving, the computer players. Bundled after `RoomLudo.js`. |
| `BankAlhaz.js` | بنك الحظ's board, its two decks (Arabic and English), every rule as two objects - the table (`g`, a room's `shared`) and what nobody sees (`priv`, the decks) - and the computer players: shared by the page and the Worker, every name prefixed `bank`. |
| `RoomBank.js` | `bankAction`: the lobby's pieces, seats and options, the server's dice, the turn clock, leaving, the bots and the forced moves; the decks live in `room._bank`, never projected. Bundled after `RoomGames.js`. |
| `GuessWho.js` | خمّن مين's faces (plain features, drawn by the page) and a board of them, no two looking the same: shared by the page and the Worker, every name prefixed `gw`. |
| `RoomGuessWho.js` | `guessWhoAction`: the duels' seats and line (`duelSeatNext`, `duelEnd` from `RoomDuels.js`, bundled before it), the secret faces in `room._gw`, questions out loud or typed, flipping, guessing, the clock. |
| `Hangman.js` | المشنقة's letters, the fold (one key a letter), a written word's rules, a board and a guess, and the race's words from the Chameleon boards: shared by the page and the Worker, every name prefixed `hm`. |
| `RoomHangman.js` | `hangmanAction`: one writes or a race, the word in `room._hm`, each board on its own phone, the points, the word clock, leaving. |
| `Battleship.js` | حرب السفن's fleets, the no-touching check, a random fleet, one shot and its result (a sinking marks the water round it), and the computer admiral: shared by the page (inlined, `SHARED_LISTS`) and the Worker, every name prefixed `bs` / `BS_`. |
| `RoomBattleship.js` | `battleshipAction`: the duels' seats and line (`duelSeatNext`, `duelEnd` from `RoomDuels.js`, bundled before it), placing and ready, the fleets in `room._bs`, the shots, the clock (`bsDeadline` / `bsTimeout`), leaving (`bsPlayerLeft`). |
| `Chess.js` | شطرنج's rules (every one, perft-checked), the clock, the rated computer, the coach's analysis and the review, and a tournament match's next game (`chessMatchNext`, Armageddon): shared by the page (inlined, `SHARED_LISTS`) and the Worker, every name prefixed `chess` / `CHESS_`. |
| `RoomChess.js` | `chessAction`: one board per game made and played through `chessBoard*` (the adapter a bracket uses), winner stays on (`duelSeatNext`, `duelEnd`), the clock on the server (`chessDeadline` / `chessTimeout`), a draw offered and answered, resigning, a forfeit (`chessPlayerLeft`). |
| `RoomVoteChess.js` | `voteChessAction`: شطرنج بالتصويت - the host's split (`sides`), one board through `chessBoard*`, the secret votes in `room._vc`, the close (`vcClose`: all voted, the clock, the host), the tally, resigning by vote, leaving (`vcPlayerLeft`). |
| `RoomHandBrain.js` | `handBrainAction`: المخ والإيد - the host's four seats (`seats`), the Brain's name and the Hand's move on one board, the clock per team, computer players (`ROOM_BOT_GAMES.handbrain`) and forced moves, a leaver's seat to a computer player (`hbPlayerLeft`). |
| `RoomBughouse.js` | `bughouseAction`: four seats on two boards (seat k plays board k >> 1 with colour k & 1; partners k and 3 - k), the moves and drops through `chessBugPlay`, a capture sent to the partner's hand (`chessBugGive`), both clocks on the server (`bughouseDeadline` / `bughouseTimeout`), the computer players (`ROOM_BOT_GAMES.bughouse`), a leaver replaced by one (`bughousePlayerLeft`), play again turning the partners. Bundled after `RoomChess.js`. |
| `Chess4.js` | شطرنج الأربعة's rules (the 160-square board, every piece, castling, promotion by mode, check from any opponent, mate and stalemate judged on the player's turn, grey walls, FFA points, the fifty-move rule) and the computer players: shared by the page (inlined, `SHARED_LISTS`) and the Worker, every name prefixed `chess4` / `CHESS4_`. |
| `RoomChess4.js` | `chess4Action`: the lobby (the way to play, the clock, the colours), bots in the empty colours, moves with `seq`, the clock on the server (`chess4Deadline` / `chess4Timeout`), the host's "play for", resigning, leaving (`chess4PlayerLeft`: FFA out, teams a bot in the seat), play again turning the table. |
| `PlayingCards.js` | The playing cards كدّاب and الشايب deal: the deck (one or two), a card's rank and suit, a hand sorted, what makes a pair in الشايب (same rank, same colour), the ranks' names: shared by the page and the Worker, every name prefixed `pc` / `PC_`. |
| `RoomDoubt.js` | `doubtAction`: كدّاب's claims, the call (first tap wins), the pile, passing and the pile going out, the places, the clock, leaving and the computer players; every hand in `room._doubt`. |
| `RoomOldMaid.js` | `oldMaidAction`: الشايب's deal (the deck grows with the table), the lift and the draw, dragging or shuffling a hand, pairs, the loser and the tally, the clock, leaving; every hand in `room._om`. |
| `Skull.js` | جمجمة's faces (a seat's flower, the skull), the bet's range, and the computer players' judgement as plain functions of what a bot may know: shared by the page (inlined, `SHARED_LISTS`) and the Worker, every name prefixed `skull` / `SKULL_`. |
| `RoomSkull.js` | `skullAction`: جمجمة - the laying, the adding and the auction, «هيعملها؟», the flips, a disc lost at random or chosen, the rounds, the clock (`skullDeadline` / `skullTimeout`), leaving (`skullPlayerLeft`), `ROOM_BOT_GAMES.skull` and the forced moves; every disc, hand, pile and answer in `room._skull`. |
| `Estimation.js` | إستميشن's rules: the bid order (`estBidBeats`), the calls allowed (`estCallChoices`: 0 to the caller's number, the last off 13), following suit (`estLegal`), a trick's winner, the score keeper's scoring (`estScoreRound`, `estMult`) and the computer players' judgement: shared by the page (inlined, `SHARED_LISTS`) and the Worker, every name prefixed `est` / `EST_`. |
| `RoomEstimation.js` | `estimationAction`: the seats (bots in the empty ones), the dash, the auction, the calls, the tricks, the round's score, the clock (`estDeadline` / `estTimeout`), the host's "play for", a leaver's seat to a hard computer player (`estPlayerLeft`), `ROOM_BOT_GAMES.estimation` and the forced card; every hand in `room._est`. |
| `Bowling.js` | بولينج's lane, pins and one throw as plain arithmetic (the same pins on every phone and the server from four whole numbers), and the score sheet: shared by the page and the Worker, every name prefixed `bowl`. |
| `RoomBowling.js` | `bowlingAction`: the order, each player's card, a throw run on the server (`bowlThrow`) and replayed by every phone, the clock and the host's gentle ball, leaving, the end. |
| `MiniGolf.js` | ميني جولف's sixty holes in three kinds and the draw of a game's holes (`golfDealCourse`), one putt as plain arithmetic (only + - * / and `Math.sqrt` / `floor` / `abs` / `min` / `max`, never `Math.sin`) - the other balls it knocks included - the pieces (ice, mud, pads, belts, portals, bumpers, ramps, gates), the most strokes (`golfMaxOf`), the way to the cup (`golfField`) and the clock's gentle putt (`golfAutoShot`): shared by the page (inlined, `SHARED_LISTS`) and the Worker, every name prefixed `golf`. |
| `RoomMiniGolf.js` | `minigolfAction`: the holes dealt through `nextPrompts` (`shared.holes`), all at once or in turns (the balls on the course knocking each other, `mgOthers`), the server's result of every putt, picking up past par + 3, the hole's card and the next hole on the server's clock, the putt clock, leaving. Bundled after `RoomGames.js`. |
| `WordleWords.js`, `Countries.js` | خمن الكلمة's lists and keypad (`WORDLE_DB`, `WORDLE_LAYOUTS`) and خمّن الدولة's table with the distances (`COUNTRIES`, `FLAG_ALIASES`, `FLAG_MODES`, `flagsDistance`, `flagsBearing`): moved out of `JS_Wordle.html` and `JS_Flags.html` for the rooms, shared by the page (inlined, `SHARED_LISTS`) and the Worker. |
| `SolveGames.js` | The four solve games' own rules (every name `sv` / `SV_`): a written word and its colours, the ranges and higher / lower, the country hints, an emoji clue's problems: shared by the page (a setter's form checks what it sends) and the Worker. |
| `RoomSolve.js` | `solveAction`: one sets, everyone solves - the engine (the order, the boards, the points, the clock, leaving) and its four plug-ins (`SOLVE_KINDS`). Bundled after `RoomGames.js`. |
| `RoomBumper.js` | `bumperAction`: عربيات التصادم - deals a round (the drivers, their colours, the countdown and the end), takes the TV's scores (`finish`, a screen only), ends on the server's clock with no scores when no screen reports; `bumperRelaying` says when `room.js` passes the controllers' messages on. |
| `Wire.js`, `RoomWire.js` | سلك مقطوع: the three places' controls, the levels and the order text (shared), and `wireAction` - the panels and values in `room._wire`, the orders, the damage and the clock, the surprises, `wireDeadline` / `wireTimeout`, `wirePlayerLeft`. `RoomWire.js` is bundled last. |
| `RoomChairs.js` | `chairsAction`: الكراسي الموسيقية - the secret stop and the fake pauses in `room._chairs`, the taps ranked by their stamps inside the provable window, the false start, the 3-second window, the rounds and the wins; `chairsDeadline` / `chairsTimeout`, `chairsPlayerLeft`. Bundled after `RoomGames.js`. |
| `Witness.js` | الشاهد's faces: a sketch cleaned (`witnessClean`, `witnessFix`), the blank sketch, and the lineup of six look-alikes (`witnessLineup`, `WITNESS_CHANGES`) on خمّن مين's faces: shared by the page (inlined, `SHARED_LISTS`) and the Worker, every name prefixed `witness` / `WITNESS_`. |
| `RoomBox.js` | `boxAction`: المزاد - the deck, the true clues (`boxClueCandidates`, `boxClueTrue`), the secret bids in `room._box`, the opening and every box's effect (`boxOpen`), the clocks (`boxDeadline` / `boxTimeout`), leaving (`boxPlayerLeft`). Bundled after `RoomWitness.js`. |
| `RoomWitness.js` | `witnessAction`: الشاهد - the witness's look (the face in `room._witness`, on the witness's slice only while it lasts), the sketch, the vote, the reveal and the points, the clocks (`witnessDeadline` / `witnessTimeout`), leaving (`witnessPlayerLeft`). Bundled last. |
| `Dark.js` | الأوضة المضلمة's maps from a seed (`darkMap`: rooms, doors, furniture, traps, checked walkable by `darkSolve`), the moving traps on the tick clock, the walls and the echo, the joystick's walk (`darkAdvance`), the lens size: shared by the page (inlined, `SHARED_LISTS`) and the Worker, every name prefixed `dark` / `DARK_`. |
| `RoomDark.js` | `darkAction`: الأوضة المضلمة - the seed in `room._dark`, the mover's steps or stick, traps, the levels and the hearts, the slices (`darkSync`: the guides and `room.screenOnly` the seed, the mover the echo), the clock (`darkDeadline` / `darkTimeout`), leaving (`darkPlayerLeft`), and `darkRelaying` for the lens relay. Bundled last. |
| `RoomExact.js` | `exactAction`: بالظبط ٣! - the deck of orders (`EXACT_KINDS`), each order dealt with its numbers and any screen secrets (`room._exact.mine`, each phone's own in `room.secrets`), the taps stamped with the server's time, the judge (whose hand, and why), the glasses and the levels, the clock (`exactDeadline` / `exactTimeout`), leaving (`exactPlayerLeft`). Bundled last. |
| `Songs.js`, `RoomHum.js` | دندنها: the 237 songs, each pinned to an Apple or a Deezer track (server-only: the page never needs them), and `humAction` - the hummer in turn or every phone on the server's clock, the typed answers through `guessVerdict`, the choices, the points, the clocks (`humDeadline` / `humTimeout`), leaving (`humPlayerLeft`). The sound is `GET /song/CODE/TOKEN` (`index.js` `songResponse`, `Room.songOf`): the preview looked up at play time and streamed for a song's opaque token (`src/songs.js`: Apple or Deezer, a second pin when the first fails). Bundled after `RoomBox.js`. |
| `JS_Room.html` | Client engine (WebSocket, reconnect, HTTP fallback) + the generic lobby UI. |
| `JS_RoomImposter.html`, `JS_RoomCodenames.html`, `JS_RoomGames.html`, `JS_RoomBuzzer.html`, … | Per-game renderers. |

**The host can hand the room on** (the owner, 24 Sep 2026: "tap a name, then a
menu"). For the host, every other person's name is a button - in the lobby's
list, the players strip under a game and the TV's strip (`roomNameHtml`, a
faint dotted underline) - that opens a small centred menu (`#room-player-menu`,
`roomPlayerMenu`): «👑 المضيف يبقى منى» (worded with the role as the subject,
so it reads right whatever the name), greyed with a line for a phone that is
away, and «شيله من الغرفة» for a phone that is gone. The move is `makeHost
{ playerId }`, handled in `room.js` beside `kick` (it needs to know who is
connected): the host only, a person (never a computer player) who is here
now; said in the chat as the `host` event every change of host already is.

**A host away doesn't stop the table** (the owner, 28 Sep 2026: a locked host
phone froze the round for the 2 minutes before the handover). While a game is
on, once the host has been away **20 s** (`HOST_STAND_IN_MS` in `room.js`) -
the socket closed that long ago (`lastSeen`), or a socket still open but not
heard from for 40 s (`HOST_QUIET_MS`: a locked iPhone keeps its socket), and
not polling over HTTP - **any person or screen in the room can press the
host's "move on" buttons**. The server decides: `room.js` stamps `_hostAway`
on the copy the rules run on for a move from anyone but the host
(`hostAway()`, taken off before saving), and the rules check
`requireMoveOn(room, pid)` (`requireHost(room, pid, true)`: the host, or
anyone but a computer player while `_hostAway`) instead of `requireHost` for
those actions. **Move-on actions**: `nextRound`, `nextQuestion`, `nextHole`,
`nextLevel`, `closeVote`, `closeWriting`, `closeWord`, `closeRound`,
`closeThiefVote`, `closeBoom`, `startVote`, `beginDiscussion`, `endNight`,
`startNight`, `lockDial`, `revealResult`, `revealNext` / `revealBack`, `reveal`
(من أنا؟), `judge` (كلمة واحدة, خمس ثواني), `score` (زي الكل), `skipGuess`,
`skipTurn` and "play for" in every game, `passTurn` (أسماء الرموز),
`beginRound` (سكرو), `playFor` (ميني جولف); a tournament's match carries the
stamp too (`tourRoomOf`). **Still the host's alone**: starting or choosing a
game (`start`, `playAgain`, `restart`, `chooseGame`, `backToHub`,
`tourNew`), settings and seats, computer players, `kick` / `makeHost`,
corrections (`adjust`, `markLoser`, `flip`, `penalty`, `merge`, `undo`,
`swap`, `setQuarters`), الجرس's verdicts (the host is the quizmaster),
مافيا's `moreTime`, `setSpymaster` (it would show a key), عربيات التصادم's
`endNow`, the TV's big match. Every such action kept its `staleTap` guard, so
two stand-ins pressing «التالي» together deal one round. Every projection
carries `hostAway` (`view.js`); `broadcast` sends it again when it flips
(`awayShown`, and the alarm wakes at the 20 s and the 40 s marks). On the
page `roomCanMoveOn(state)` is the host or `state.hostAway`, and a frame
draws a move-on button through `roomMoveOnHtml(state, html)`: the host always
gets it, anyone else a `.room-moveon` span shown only under
`body.room-host-away` (`paintRoomHostAway`, from `Room.onChange`), so the
buttons appear without rebuilding a frame someone is typing in; a small note
under the header says «المضيف مش متصل - أي حد يقدر يكمّل» (`room_host_away`).
The TV draws the same buttons (its signature has `hostAway`). The full
handover of the room still comes at 2 minutes.

**Computer players** (the owner, 21 Sep 2026: optional, easy and hard). In
the games that register them - أونو, الدومينو, لودو, السلم والتعبان (one kind, `bots.one`), بنك الحظ, باغ هاوس, شطرنج الأربعة, إستميشن and جمجمة - the host can seat a bot in
the lobby, to play alone or to make up a table of four for teams. A bot is an
ordinary entry in `room.players` with `bot` set to its level (`'easy'` or
`'hard'`): it holds a seat, is dealt like anyone, and its hand is in
`room.secrets` like anyone's. It has no key and no socket, so nothing can
ever speak for it from outside.

- **It moves through the same door as a phone.** `applyRoomAction` ends with
  `scheduleBots(room)`, which asks the game's hook
  (`ROOM_BOT_GAMES[game].pending(room)`) whether a bot has something to do now,
  and a key naming that moment. A new moment sets `room._botAt` a second or so
  ahead (`ROOM_BOT_DELAY_MS`, long enough to watch each move land); the same
  moment keeps the time it had, so a chat line never makes a bot wait longer.
  `roomDeadline` is the sooner of the game's own clock (`gameDeadline`) and
  `_botAt`, so the room's alarm wakes for it, and `roomTimeout` runs
  `runRoomBot`: the hook's `decide(room, pid)` - from the bot's own secret and
  what the table can see, never another hand - applied with `applyRoomAction`
  on a copy, exactly as if a phone had sent it. A move that is refused falls
  back to the game's always-legal move (`fallback`: draw, pass); if even that
  fails it tries again in 3s, three times, then waits for a person to move.
  `roomPlayerLeft` and a game's own timeout call `scheduleBots` too, since the
  turn may have passed to a bot. `pending` may ask for its own `delay` (a hard
  أونو bot waits a human's moment before catching someone), and a bot can act
  out of turn through the same hook (أونو's catch and jump in).
- **The lobby** (`roomBotControlsHtml`, `roomBotRowHtml` in `JS_Room.html`): a
  game that seats bots says so on its `ROOM_GAMES` entry (`bots: { max }`); the
  host gets "+ 🤖 سهل" and "+ 🤖 صعب", a bot's row shows 🤖 where the presence
  dot would be, and the host taps its level to change it or ✕ to take it out
  (`addBot`, `setBotLevel`, `removeBot`: room-level actions, lobby only). A TV
  host gets the same two buttons. The host's phone offers the name from
  `ROOM_BOT_NAMES` in its own language (زيزو, بندق…; Robo, Chip…), and the
  server makes it unique (`uniqueBotName`: "زيزو 2").
- **Bots belong to their game.** `backToHub`, and choosing a game without bots,
  park them in `room._botsMemo`; choosing a game that has them sits them back
  down while there are seats (`max`: four at a domino table), and the rest keep
  waiting. In the hub their seats are free, so the hub's minimum counts people;
  أونو and الدومينو open from one (`min: 1`).
- **What the room server does differently** (`room.js`): a bot is projected as
  always online (with `bot: level` on its row), never becomes host, and a room
  with nothing but bots and no screen is empty and deletes itself. It is not in
  the live player count (no socket). A phone can't join under a bot's name.
- **Forced moves ride on the same clock** (the owner's "one thing to do is
  done for you", *Decided, and why*). A game registers
  `ROOM_FORCED_GAMES.<id> = (room) => { pid, key, move: { action, payload },
  delay? }` for a person whose only legal move is known; when no bot is up,
  `scheduleBots` sets `_botAt` for that person `ROOM_FORCED_DELAY_MS` (1.2s)
  ahead, and `runRoomBot` asks the hook again when the beat is up and makes
  the move only if it is still the same moment (the key) and still the only
  move - so a person who tapped first, a jump in, or a turn that changed
  meanwhile is never overruled. A move refused is not tried again for that
  moment (`_forcedFailed`). Registered: أونو (take / draw; waiting as long as
  a bot while someone can be caught), الدومينو (with `helpFit` on, never
  the last tile), لودو (one piece that can move, or two on the same
  square; never the roll, never the last piece home) and بنك الحظ (a debt
  nothing can cover: bankrupt; a place there is no way to pay for: leave
  it) and إستميشن (the one card allowed, the last trick included) and جمجمة (your only disc laid, your own pile turned over). And the duels (1 Oct 2026: the last column, square or line, never a winning one; `notes/games/duels.md`). Before that they registered nothing: a last move there is often the
  winning one. `roomForcedMove` is exported for the rules tests. The phone draws a line (`uno_auto_*`, `dom_auto_*`) where the
  button would have been.
- A new game with bots registers `ROOM_BOT_GAMES.<id> = { max, pending,
  decide, fallback }` beside its rules and `bots: { max }` on its `ROOM_GAMES`
  entry, and plays a whole bot-filled game in `play-all.mjs` (one person plus
  bots, finished by the server's clock).

**The voting engine.** لو خيروك, مين أكثر واحد and فيبج all run on one
implementation in `RoomGames.js`: `openVote` / `castVote` / `closeVote`, plus
`addScore` and `scoreboardOf` for the running board and `nextPrompt` for pulling
content a room hasn't seen yet.

The rule that makes voting work: **who** voted is public, **what** they voted for
is not, until the round closes. Choices live in `room._ballots` — server-side
scratch that is never projected — so a phone cannot watch the tally form and
change its mind. `openVote` takes an optional `ownerId` per option, which is how
Fibbage stops you voting for your own lie.

**Player tiles on a ballot** (1 Oct 2026). When every option of a vote is a
player (مين أكتر واحد, and the accusations of الجاسوس, الحرباء, الموقع السري,
الفنان المزيف, مافيا - `ballotIsPeople`), `renderBallot` draws a grid of tiles
(`ballotPeopleHtml`, `.ballot-people`, `.ballot-person`: the initial in its bubble,
the name) instead of the bare rows; the one tapped is lit (`ballotPick`, kept per
vote in `ballotPicked`, keyed on the room, deal, round and turn, since the server
never says what a phone chose), and after voting the tiles stay, still, with the
pick lit, under «في انتظار باقي الأصوات». Any other ballot (لو خيروك, فيبج, صدق ولا
كذب) is the old rows. مين أكتر واحد passes `{ bar: true }` and draws
`renderBallotBar` at the foot: «صوّت: N/M» above the host's «🔒 اقفل التصويت» (anyone's
while the host is away). `roomPersonChip(name, extra, cls, title)` and
`roomInitial(name)` (JS_RoomImposter.html) draw a player as the talk's chip in any
room screen; `.room-bar__pair` is a room bar's main pair (`Style*.html`, beside
`.room-moveon`).


When whose option is whose is itself the secret, `openVote(room, options,
eligible, { hideOwners: true })` keeps the owners in `room._voteOwners` and
tells each owner only their own option (`you.voteOwn`); `results[].ownerId`
is filled once the vote closes. فيبج needs this: its options used to go out
as `{ id: 'truth', ownerId: null }` next to each lie's author, so the real
answer was in every phone's network traffic before anyone voted. Its option
ids are random now and `shared.truthId` comes with the result.

A vote closes on its own once every eligible player has voted, or when the host
presses `closeVote`. On the client, `renderBallot(state, opts)` draws the ballot
*and* the host's close button in its progress row, so a game must not add a
second one; a vote on people passes `{ ownLabel: t.vote_you }` so your own row
says "you" rather than "your answer".

**A guess is judged the way the table hears it.** The owner typed طماطم for
طماطماية and was told "wrong", with no nudge (17 Sep 2026). `guessVerdict(text,
answers)` in `RoomGames.js` says `right`, `close` or nothing: right for the
same word after the fold, the same stem (one unit or plural ending dropped:
طماطماية/طماطم, تفاحة/تفاح, مهندسين/مهندس, cats/cat, and the ending
swallowing a final و or ا, مانجاية/مانجو), the same once measure words are
dropped (`GUESS_MEASURE_WORDS`: حبة, كوب, عربية, slice of…), or one letter
off in a word of five letters or more (never in a short one: كباب is not
كتاب); close for most of the letters, the same first four, or all but one
word of a phrase. ارسم وخمّن, the fake artist's guess and the quiz cards
(فوازير إيموجي, كمّل المثل; a near miss shows "🔥 قريب!" in the feed) judge
through it; `rules.mjs` pins the cases. **A guess that is another word of the
same list is never right by the lenient rules** (22 Sep 2026): the callers
pass their bank (`guessVerdict(text, answers, bank)`: `DRAW_WORDS[lang]`, the
quiz game's own bank), and a guess that names a different card there skips
the stem and the one-letter rule - House was judged right for Horse, and
شمس for شمسية. It is `close` instead. An ending is only dropped when enough
is left to be a word (`guessStem`: three letters, four after `ون`). Fibbage lies, Just One clues and
Codenames still use the plain fold: there "the same word" is the point.

**The room chat.** `chat` is a room-level action in `applyRoomAction`, next
to `chooseGame`: a message (`ROOM_CHAT_MAX_LEN` characters, five per five
seconds per phone) goes on `room.chat`, the last `ROOM_CHAT_MAX`, outside any
game, so it survives the hub and every deal, and `project()` sends it to
everyone. `JS_RoomChat.html` draws the 💬 button in the header (`body.has-chat`
with the soundboard's `has-fx`, never on the TV), the sheet, the unread badge, and a
toast for a message that arrives while the sheet is closed - once, with the
history at join counted as read.

Three things ride on it. **Quick reactions** are one-tap lines from
`chat_quick` in the translations. **Room events** are chat lines the server
writes with `roomEvent(room, kind, details)` - `joined` and `left` in
`room.js`'s join and leave, `host` wherever the host changes, `started` after
a `start` that dealt, `hub` on `backToHub` - stored as a kind and its details
(`sys`, `p`) so each phone says them in its own language; they belong to
nobody, so they count against no rate limit, and they never light the badge
or pop a toast. **Team chat** is أسماء الرموز only: a message sent with
`to: 'team'` carries the sender's team, `chatFor(room, pid)` is what
`project()` sends, so the other team and any screen never receive it, and a
spymaster in play (`phase === 'playing'`) reads their team's channel but is
refused writing to it - in the real game they hear the table and can't talk.
Team lines are dropped when a board is dealt and in `clearGameState`, because
the next game can have other sides.

**"دورك!" when you come back to the app** (`JS_RoomTurn.html`). After the page
has been hidden `TURN_AWAY_MS` or longer, the room refreshes itself as always;
the turn check waits until `Room.heardAt` is later than the wake - a socket
can look open after the phone slept and still be dead - and then asks
`roomTurnOf(state)` whether the game is waiting on this phone alone: the
bomb's holder, the drawer, a Codenames spymaster with no clue given or
operatives with one, the psychic, a writer who hasn't sent, an unanswered
question, an uncast vote with an option that isn't their own, the player up
in خمس ثواني or ربع قرد, an accused spy or chameleon or a caught fake who
guesses, من أنا؟ while your own character is still to find (`turn_whoami`), أونو
when you are down to one card without saying it and can be caught (`s.unoCatch`,
`turn_uno`, before the turn itself; the review of 1 Oct 2026). If so, a banner (`#turn-banner`), a sound and a buzz, and a tap goes
back to the room. While hidden but still receiving, the tab title says it.
Nothing fires while the screen is being looked at. A new room game with a
turn needs its case in `roomTurnOf`.

**Who is playing right now.** The مع بعض tab says "دلوقتي فيه ٧ لاعبين في ٣ غرف"
under its pitch. It counts players in rooms, never phones with the app open:
opening the app still touches no server. A room reports its own number of
players online to `LiveStats` (one instance, named "live") through
`reportLive` in `room.js`, called wherever that number can change - a join, a
socket opening or closing, a poll that brings a phone back, a leave, a move
(a player becoming a screen) - and it only sends anything when the number
changed or the last report is `LIVE_REFRESH_MS` old; `destroy` reports 0. The
Worker answers `GET /live` from a copy at most `LIVE_CACHE_MS` old, and
`LiveStats` drops a room that hasn't reported for `LIVE_TTL_MS`, so a room
that died without saying so leaves the count within a quarter of an hour. A
phone on the HTTP fallback leaves no event when it stops asking, so `create`,
`join` and a returning `poll` set the room's alarm for when that phone would
fall out of `ONLINE_WINDOW_MS`, and `alarm()` counts again and comes back for
the next one: such a phone leaves the count in about half a minute. The
phone asks once when the tab opens and once a minute while it stays on screen
and awake (`refreshTogetherLive` in `JS_Catalog.html`), and shows nothing
below `LIVE_MIN_PLAYERS` or when the server can't be reached: a count that
says "1" advertises an empty app. It carries a room count and a player count
and nothing else - no codes, no names.

**The audience** (the improvement plan, Phase 4, Jackbox's idea; 25 Sep
2026). Whoever is watching a room game gets a bar at the foot of the screen
(`#room-audience`, `JS_RoomAudience.html`): six cheers
(`AUDIENCE_CHEERS`, `AUDIENCE_SHOUTS`: برافو، جامد!، هههه، يا نهار!، يا رب
and a زغروطة, each an emoji and its word in a bubble; on the TV برافو claps and
the زغروطة trills, `FX.zaghrouta`) that float up on every phone and big, with the name, on
the TV, and for the first 90 seconds of a game (`PREDICT_OPEN_MS`) "مين
هيكسب؟" with the players' names and how many picked each. **Once the game is
over the bar goes and the guessing closes** (the owner, 26 Sep 2026), however
much of the 90 seconds is left: `audienceGameOver` on the page and
`roomGameIsOver` in `RoomGames.js` (which refuses a late `predict`) - keep the
two in step - read `phase` 'gameover' or 'over' (the room's or `shared`'s), a
tournament's end, or the result of a game of one round (الجاسوس, الحرباء,
الموقع السري, الفنان المزيف). Watching is
`audienceWatching`: not in the game's roster (`inGame` false), or not in a
table's `shared.seats` / `shared.order` (the fifth person at لودو, the line of
a duel). Players are never shown the bar. The server keeps `room.cheer` (the
last one, `seq` rising; four a phone in three seconds) and `room.predict`
(`{ game, until, picks }`, opened when a game is dealt, public), both room-level
actions before a game's own (`cheer`, `predict`), projected by `view.js`.
`settlePredictions` runs at `backToHub` beside `bankNightPoints`: the first
row's score (a board is best-first, and القنبلة, الشايب, ميني جولف and سكرو win
low; ties all count, everyone level is nobody) against the picks, said in the
chat as a `predicted` event («توقعوا الكسبان صح: …»). **Play again and a new
tournament** after a game that was over settle the guesses on the board that
game ended on and open a fresh window (`applyRoomAction`, after the game's
branch), so old picks are never scored against a later game. The page repaints
the bar when the window closes (`audienceScheduleClose`), not at the next move.
A cheer the rules drop (four a phone in three seconds, or no game on) changes
nothing, so `room.js` saves and sends nothing for it - only the phone that
tapped gets its view back. A cheer with motion off shows still for 1.5 s.

**«ليالينا»** (the improvement plan, Phase 6, Plato's groups without accounts).
Every phone in a room keeps that evening's leaderboard of the night
(`rememberNight` in `JS_Room.html`, a `Room.onChange` listener; one entry per
room code and day, the last 60, `ashryNights_v1`), and أرقامي adds them up by
name, folded so أحمد and احمد are one person (`statsNightsHtml` in
`JS_Daily.html`): nights won, points, and the last five nights' champions. The
hub's night board has «ابعت صورة الليلة» (`shareRoomNight`, the share card of
the night with its champion crowned).

**Browsers the app runs in.** The page is written in ES2017 (`const`,
`async`, destructuring, spread - nothing newer, measured with esbuild on
17 Sep 2026) and its layout on CSS custom properties, grid, `inset`, logical
insets (`inset-inline-start`), flex `gap`, `:is()` and `aspect-ratio`; the
newer things it uses (`:has()`, container queries, `dvh`, `color-mix()`,
`text-wrap`) only lose polish when missing. That floor is Chromium 88 /
iOS 14.5 / Firefox 78 - every phone since 2021. The browsers built into TVs
run years behind: a Samsung sold in 2022 (Tizen 6.5) has Chromium 85, a 2024
one (Tizen 8) 108; LG's webOS 22 has 87. Older sets lack grid or even
custom properties, which is the white page with four stacked buttons the
owner saw. Nothing cheap fixes that (the design system *is* custom
properties), so the page carries a **gate**: an ES5 script in
`Controller.html`, right after the intro, tests `CSS.supports` for the
features above, compiles a line of ES2017 with `new Function`, and checks a
few runtime calls (`padStart`, `flatMap`, `Object.values`, `WebSocket`,
`fetch`). Where any fails it sets `window.ASHRY_UNSUPPORTED` (which
`initializeApp` obeys), removes the intro and draws a plain note with inline
styles - the mark, why, the three ways onto a big screen (a laptop on HDMI,
a phone mirrored with AirPlay or Smart View, a streaming stick's browser),
the link and its QR (the `qrcode` library is ES5 too) - in the saved
language, or the device's. Keep that script ES5 and free of CSS variables;
it is the one thing on the page that must run where nothing else does. The
app's own path in a TV browser is still *Big screens* above: the browser
shows the app in a tab with its bar, and the ⛶ in the TV bar
(`toggleTvFullscreen`) takes the whole screen. `loadFromLocal` reads storage
inside a try as well: a browser that blocks it used to stop the app before
its first screen.

**A room is opened and joined under the name the phone used last time,
without asking** (the owner, 26 Sep 2026; it used to be asked on every room,
one tap more each time). `roomNameOrAsk()` gives the saved name (`roomName`,
localStorage `ashryName`) and opens the name sheet (`promptForName()`) only
for a phone that has none; `roomCreateFor` goes through it. The join screen
folds its name field into «أنت: منى ✏️» (`roomJoinPaintName`, a tap brings the
field back), and a join link with its code goes straight into the room
(`roomOpenJoin`); a name someone in the room already has brings the field back
with the error. In the lobby «أنت: منى ✏️» (`#room-me`, `roomRenameMe`) opens
the name sheet and sends `rename { name }` - a room-level action in
`applyRoomAction`, lobby only (a game in play keeps its players' names), a
person only, refused for a name someone else has (`sameRoomName`). Becoming a
player from a screen still asks. Never use `window.prompt` — it is blocked in
some embedded browsers. The join screen and Settings → your name read and write
the same value. Every sheet is a centred dialog.

**The lobby's Start is always on screen** (the owner, 26 Sep 2026): the host's
Start, the "how many more" line (`#room-start-need`, the hub's `min` against
the people here) and a player's "waiting for the host" sit in a sticky
`.view-actions--start` bar (`.lobby-start`) under the game's options, like a
setup screen's. **The host's options are folded** under «⚙️ إعدادات اللعبة
(محفوظة) ▾» (`lobbyOptionsFold`), with a line of what is chosen read off the
controls themselves (`lobbyOptsSummarise`: the active segments, the lists'
picks, the switches that are on); they open by themselves the first time this
phone hosts that game (`recallOptions('lobbyOptsSeen')`, set when the host
starts it) and stay as the host left them while the lobby is redrawn
(`lobbyOptsOpen`). The games whose options are where the table is seated -
أسماء الرموز, الدومينو, لودو, شطرنج الأربعة, المخ والإيد, شطرنج بالتصويت,
بنك الحظ - are never folded (`LOBBY_OPTS_UNFOLDED`). The TV's lobby is as it
was.

**A result you can send as a picture** (`JS_ShareCard.html`). A result told as
text is a wall of characters in WhatsApp. `shareResultCard({ title, icon, rows,
footer, text, board })` draws it on a 1080x1920 canvas instead - the app's violet
ground, the game's icon and name, up to ten rows of name and score, a line of
the game's own, and the mark and the link at the foot - and sends it. Three
ways out (`board`, شطرنج's final position, is optional: with it the position
is drawn big by `chDrawBoardCanvas` and the rows go under it, in
`drawShareBoardCard`; without it the card is exactly as before), in order:
the phone's share sheet with the picture attached
(`navigator.canShare({ files })`), a download where that isn't offered, and the
plain text through `shareOrCopy` where neither works, which is exactly what the
app did before. **Nothing is drawn until a share button is pressed**: the
canvas is made, used and thrown away inside the call, so a result screen costs
nothing until somebody wants to send it. The colours are read off the mark in
the page (`shareCardColours`, the gradient stops of `#ashry-mark`) rather than
written again, so the card follows whatever colourway the app ships with; the
mark itself is that `<symbol>` wrapped in a standalone SVG as a `data:` URL,
which a canvas can draw and which leaves it untainted. Arabic is drawn with
`ctx.direction = 'rtl'`. The button is on the solo result sheet, the تحدي
اليوم hub and the six room games that end on a podium with a real board
(`roomShareBtnHtml`, never on a big screen and never when nobody scored), each
with the plain text beside it on a ghost button.

**Getting people in.** The lobby's share button (`roomShareLink`) sends the join
link through the phone's share sheet, or copies it where there is none, for
friends who aren't in the room to scan the QR. `shareOrCopy` is that same
machinery on its own, and `shareAppLink` sends the app's own link (Settings →
شارك التطبيق, and a ghost button under the three ways in on the مع بعض tab -
which is where someone is already thinking about getting people in). The join field takes a pasted
link as well as a code: `extractRoomCode` pulls the code out of either.

`?room=CODE` is read from the page's own address by the build
(`window.SERVER_DATA.room`), then removed from the address bar so a reload
doesn't reopen the join screen.

**Testing it locally.** Run the rooms server with `npm run dev` in
`rooms-worker/` and play in two tabs of the preview, or let the robots do it:
`npm test` in `rooms-worker/`.

### The owner's four picks after the ideas batch (30 Sep 2026)

Of the five questions the ideas batch left, the owner said yes to four (the «🚫 ممنوعة!» button in أوصف لي was not taken): an automatic «التالي» in the older room games, a replay of the latest move in سكرو, a hidden double card in دوري المعرفة, and domino's passed-on numbers under the helper switch. The details not given were decided while building and are open to change.

#### Next batch: «التالي لوحده» (autonext)

The owner approved a lobby switch «التالي لوحده» / "Next by itself" for the older
room games that wait for the host's «التالي» after each result: تحدي المعلومات
(room trivia), لو خيروك, مين أكثر واحد, فيبج, زي الكل, صدق ولا
كذب. Off by default, per game, the host's lobby choice, remembered on the host's
phone. Off is exactly today's flow (no new field in `shared`).

**How it works**

**Server (`RoomGames.js`, a block just before "CLOCKS THE SERVER KEEPS").**
- `room._autoNext` is the switch, set from `start` / `playAgain`'s `payload.autoNext`
  (a boolean) for the games in `AUTONEXT_GAMES`; a `start` without it is off; a
  `playAgain` without it keeps what the room had (trivia's and صدق ولا كذب's play
  again send no options).
- `AUTONEXT_GAMES[game] = { action, deals, ms, ready(s), key(s), args(s) }`: the
  host's own «التالي» action and its payload (`nextQuestion {qIndex}`,
  `nextRound {lang, round}`, `next {turn}`), whether it deals prompts, the pause,
  when the result is up, and a key for "this result".
- `autoNextSync(room)` runs after every move (end of `applyRoomAction`), after a
  leaver (`roomPlayerLeft`) and after a game's own timeout (`roomTimeout`): once
  per result it sets `shared.nextAt` (server time), `nextMs` (the whole pause),
  `nextFor` (the result's key) and `nextPaused: false`; when the result is gone or
  the switch is off it deletes the four fields.
- `gameDeadline` returns `autoNextDeadline(room)` first; `gameTimeout` fires
  `autoNextFire(room)`: the host's action through `applyRoomAction` on a copy (so
  every stale-tap guard, the generic `nextRound` round check, the deal id, the
  roster and the last-round → `gameover` path are the ones the host's tap takes).
  If the rules refuse it (too few left to deal a round) the count stops
  (`nextAt: null, nextPaused: true`) instead of retrying every 30 s.
- `autoPause { key }` (room-level branch in `applyRoomAction`, before the game's):
  a move-on action (`requireMoveOn`: the host, or a stand-in once the host is away),
  dropped when `key` is not the current `nextFor` (stale), clears `nextAt` and sets
  `nextPaused`. «التالي» by hand still works any time.
- Stale guards added: trivia's `nextQuestion` takes `{ qIndex }`, صدق ولا كذب's
  `next` takes `{ turn }` (both optional, as every stale field is). The phones and
  the TV now send them; زي الكل's `nextRound` sends `{ round }`.

**Prompt memory on a timeout (`rooms-worker/src/room.js`).** A host's «التالي» is a
`DEAL_ACTION`, so `act()` loads the shared prompt memory; a timeout never did. The
alarm now asks `roomTimeoutDeals(room, now)` (exported from the bundle; true when
the due timeout is an autonext deal of a game whose `deals` is true), reads the
memory, runs the timeout inside `withPromptMemory`, and writes what changed. The
room is re-read after the await (other messages may have come in). Trivia and صدق
ولا كذب deal nothing on «التالي» (the deck / the order is dealt at start), so they
don't load it.

**The pauses** (each is the reveal's own time plus time to enjoy it):
| game | pause | why |
| --- | --- | --- |
| trivia | 10 s | the staged answer takes ~3.7 s (`triviaRevealPlan`: wrong ones 0.8 s apart, the right one, the board) |
| لو خيروك, مين أكثر واحد | 12 s | the vote's bars ~3 s (`voteRevealTimes`) |
| فيبج | 9 s + 3.7 s + 0.9 s a lie past the first | the lies turn over 0.9 s apart, then the truth (+1.5 s) and the board (+1 s) (`fibRevealPlan`) |
| موجة | 11 s | the shutter and the verdict ~2.3 s (`wlReveal`) |
| زي الكل | 12 s | after the host's «احسب» (see below) |
| صدق ولا كذب | 13 s | the lie and who was fooled, the board |

**The page (`JS_RoomAutoNext.html`, new, included right after `JS_Room.html`).**
- `autoNextLobbyHtml(state, game)`: the host's switch row (host only, on a phone or a
  TV hosting the room; the TV lobby uses the same `lobbyOptions`), with a hint that
  changes in place. `autoNextChoice(game)` / `autoNextSet(game, on)` use
  `recallOptions('autoNext')` / `rememberOptions`. Each game's `startPayload` sends
  `autoNext`; its `lobbyOptions` appends the switch.
- `autoNextSlotHtml(state)`: an empty `[data-an-slot]` put just before each result's
  «التالي» row (the phones' frames and the TV's: trivia, `renderRoundFooter` for the
  three voting games and موجة, `tvNextFooter`, زي الكل, صدق ولا كذب). Drawn only when
  `'nextFor' in shared`, so with the switch off the markup is exactly as before.
- `autoNextPaint()` fills every slot from `Room.state` (a 250 ms interval while a slot
  exists, and on every `Room.onChange`), rebuilding only when the key (`nextFor`,
  `nextAt` / paused, can-move-on, last, language) changes, so a pause or the host
  going away never rebuilds the frame: «⏭️ الجولة الجاية خلال 5…» (or «النتيجة
  النهائية خلال 5…» on the last trivia question / the last storyteller), a draining
  bar (a linear Web Animation of `scaleX` from what is left to 0; with motion off
  the tick sets it), and «⏸ استنى» for `roomCanMoveOn(state)`. Paused: «⏸ العد
  واقف · «التالي» لما تجهزوا». The seconds are read from the server's time
  (`roomServerNow()`). The last 3 seconds bump (`motionBump`).
- While the count runs the non-host's «مستنيين المضيف…» line is hidden
  (`.an-slot[data-an-on="1"] ~ .room-moveon-not`).
- CSS: the `/* ===== NEXT BATCH: AUTONEXT ===== */` section of `Style_Night.html`
  (tokens only; bigger on the TV, `.an-slot--tv`).
- Keys: `an_switch`, `an_hint_on`, `an_hint_off`, `an_next_in`, `an_final_in`,
  `an_pause`, `an_paused` (one `// next batch: autonext` block per language). Help:
  a «⏭️ التالي لوحده» sub-head in the seven games' `GAME_RULES`, both languages
  (in trivia's under the rooms part, before دوري المعرفة).

**Decided here (open to change, one place each)**

- **زي الكل counts only after the result, not the reveal.** Its reveal is where the
  host merges answers that mean the same thing - a judgement - so «احسب» stays the
  host's; the count starts on the scored result.
- **The games with no end** (لو خيروك, مين أكثر واحد, فيبج, موجة) keep going round by
  round with the switch on until the host takes the room back to the hub; the count
  never starts a new game after a `gameover` (trivia, صدق ولا كذب, زي الكل).
- **A round the rules refuse** (e.g. مين أكثر واحد with fewer than 3 left) stops the
  count rather than trying again; the host decides.
- **Pause is for this result only**: the next result counts again.
- The lobby switch shows only for the host (a player's lobby shows nothing new).

**Tests**

- `rooms-worker/test/rules.mjs`: 46 `autonext/…` checks - off (no `nextAt`, nothing
  on the clock), on (the count, the timeout deals, a question the clock closed counts
  too), the host's tap then the old deadline (no double deal), stale «التالي» and
  stale pause dropped, a player refused / a stand-in allowed, pause, the last round to
  the end and never a new game, play again keeps it, a vote a leaver closed, a refused
  round stopping the count, فيبج's pause with its lies, موجة, زي الكل's reveal left to
  the host, صدق ولا كذب to the end, other games refuse `autoPause`.
- `npm run test:rules`: all pass, the leak check clean.
- `rooms-worker/test/play-all.mjs`: `autonextRobots()` (`--only=autonext`, and in the
  full run before سباق ألغاز): trivia and لو خيروك on a live server with three phones
  and a TV (the count everywhere, the server dealing - which exercises the alarm's
  prompt memory for لو خيروك -, pause, stale taps, the end, off). 55 passed.
- Looked at in headless Chrome: a trivia room and a فيبج room with three phones
  (375×812 ar light, 375×812 en dark, 667×375 ar dark) and a TV at 1920×1080; the
  lobby switch on a phone, a phone on its side and a TV host's lobby; the count, the
  auto-advance, «⏸ استنى» from the host's own button, a reload mid-count (the count
  comes back); no console errors.

**Traps met**

- A robot or a CDP phone that joins a room stays on the home until
  `roomReturnToActive()` (known; the look script calls it).
- Headless Chrome started with a fixed `--remote-debugging-port` writes no
  `DevToolsActivePort`; ask `http://127.0.0.1:<port>/json/version` instead.

### Finding a game in the room's list (30 Sep 2026)

The owner: "a search bar to reach games faster instead of scrolling a lot", in the room's
list and in برنامج السهرة's picker. Both draw `roomGameSearchHtml` (the home's box) over
their results: `roomGameHits(term)` (JS_Room.html) matches every room game by its name in
Arabic and English, its catalog title and line, and its family's name (the race's own, or
the first game's: «شطرنج» finds all five chess ways), folded by `helpNormalise`, names
before lines. Typing redraws only the results (`#room-hub-list`, `#prog-pick-results`), so
the box keeps its focus; the lobby's redraw already waits for a focused field
(`roomFieldInUse`). The search is on the whole list, not inside an opened family, and is
forgotten with the room (`roomHubSearch` cleared with `roomHubGroup`). Both lists are also
laid out under the home's section heads now (`roomGameSectionsHtml`), «تنفع دلوقتي» too,
where it used to be one long grid. The TV host's list has no search (no keyboard).

## The lobby: the people first (3 Oct 2026)

The owner's look 1B. The player list sits right under the code (`#room-people`, moved up in Controller.html), and the host's phone has two tabs (`#room-lobby-tabs`): «👥 اللاعبين (n)» - «الشلة» and the people, with «🎮 اختار لعبة» under them while no game is picked - and the game's tab: «اختار لعبة» (the hub, المهمة السرية, برنامج السهرة) or, once a game is chosen, «اللعبة: …» with its options. Picking a game turns the lobby to that tab by itself; «تغيير» goes back to the list there; a room opens on the people. `roomLobbyTabsSync(state, spectator)` keeps the tab per room code on this phone (`roomLobbyTabState`) and sets `#view-room-lobby[data-tab]`, which hides the other panel. Players who aren't the host, and a mid-round joiner, get no tabs: the people, then the game chosen. Start stays on screen on both tabs.

## The TV's lobby as a stage (3 Oct 2026)

The owner's look 2A. Every TV lobby is always dark: `#view-room-tv.tv-showtime` shares مافيا's night tokens (Style_Arcade.html), whatever the theme. A TV that isn't the host, with nothing of a game's own to draw there (teams, المهمة السرية's board), draws `tv-lobby--stage` (tvLobby, JS_RoomTv.html): «يلا نلعب!», the code in four colours beside the QR, the night's line under it (`tvNightLine`), the game chosen, and everyone as a big face along the foot - a colour per person all evening (`tvFaceAccent`), dimmed when away. A new face drops in with a bounce and a glow and a soft pop (`playSound('pop')`, once per draw, never on the TV's first draw of a room: `tvStageSeen`). The strip goes on the stage. A host TV keeps its columns (the QR, the game list) on the dark stage.

## The ideas of 7 Oct 2026, second batch (the owner's picks): built

Nine room ideas from the ideas page, each answered "build as described"; the details below were
chosen for a family table and are open to change. Styles: the section «ROOMS, THE IDEAS OF 7 OCT
2026» at the end of `Style_Night.html`. Words: `JS_Translations.html` (shared room words).

- **1215 = 1294, «دورك!» on the banner** (built once). While the phone is on another screen of the
  app and `roomTurnOf` names it, `updateRoomBanner` (JS_Room.html) turns `#active-room-banner`
  the pop colour (`.is-turn`) and writes «🔔 دورك! · ارسم» (`turn_title` + the turn's own key);
  `roomBannerTurnCue` buzzes once (`haptic('medium')`, a small scale bump with motion on) per
  moment - the code, `shared.dealId`, the game and the kind of turn; the key empties when the turn
  passes, so the next turn buzzes again. Nothing buzzes when the banner has just appeared (you
  stepped off the room screen on your own turn) or while the page is hidden (the title and the
  wake banner still say it there). A tap on the banner goes back, as before.
- **1273, a game on مع بعض opens a room for it.** The tab's posters are `togetherCard` (the
  catalog poster with another onclick); a tap opens `togetherGameSheet` (JS_Catalog.html) in the
  room's small popup `#room-sheet-modal` (Controller.html, in the shell): the game's icon, name,
  line and players, «🎮 افتح غرفة لـ …» first (`roomCreateFor(<its room id>)`, from
  `ROOM_GAME_LIST`), then «📱 العبوها على موبايل واحد» (its setup) - or, for a room-only game,
  «📘 القوانين والاختيارات» (its setup too) - and «إلغاء». The sheet takes the game's colour.
- **1280, the night on the people tab.** Every lobby row (`paintLobbyRows` in `renderRoomLobby`)
  carries the person's night points once they have any (`lobbyNightBadgeHtml`): 👑 for whoever
  leads (a tie crowns both), 🌙 for the rest; a number that rose since this phone last drew the
  lobby counts up (`lobbyNightCount`, `countUp`). The full table stays under the list.
- **1287, the TV's corner QR.** All through a game (not the lobby) `tvCornerSync` (JS_RoomTv.html)
  keeps a small QR, «ادخل» and the code fixed in the corner at the strip's end (`.tv-corner`,
  built once per code and language and moved back into each rebuilt frame, so the QR is drawn
  once). The host's phone asks for it big from the back arrow's sheet mid-game - «📺 كبّر الكود
  على الشاشة», shown only while a screen of the room is online (`roomHasScreenOn`, `roomTvQrAsk`;
  the row is in `openExitSheet`, JS_Utils.html) - room action **`tvQr`** (host only, before the
  game's dispatch in `applyRoomAction`) stamps `room.tvQrAt`, projected as `tvQrAt`; the TV grows
  the corner (transform only) for `TV_QR_BIG_MS` (10 s) counted on the server's clock.
- **1288, «إزاي نلعبها» on the TV's stage.** A TV that isn't the host, with a game chosen, shows
  the first three lines of its rules beside the game (`tvHowToHtml`: `firstPlaySteps(firstPlayKey(
  game, true))`, the same lines as the first-play card), in the stage (`.tv-show__pair`, the QR and
  code a little smaller then) and in the columns layout; the lines pop in one after another once
  per game chosen (`motionFirst`).
- **1306, those who left stay on the night.** The server projects `nightNames` (view.js,
  `nightLeftNames`): pid → name for every id with night points who is no longer a player, from
  `room.nightx.names` (never a computer player, `nightx.bots`; nothing else of nightx). The page's
  one list is `roomNightRows(state)` (JS_Room.html): everyone in, plus each leaver as `{ left:
  true }`; someone who left and came back under the same name (`samePlayer`) is one row with both
  their points. The board (`roomNightBoardHtml` → `renderScoreboard`, whose rows now take `left`:
  greyed, «مشي»), the TV's line (`tvNightLine`: «(مشي)»), the night's share card (`shareRoomNight`:
  the name with «(مشي)»; rows only) and ليالينا (`rememberNight`) all read it. Leak check: a
  GENERIC probe holds `nightNames` to names of people on the night and gone (and `played`,
  `tvQrAt` to their shapes).
- **1307, the audience bar for latecomers.** `paintAudience` shows the bar on `room-lobby` too when
  the state says this phone joined mid-round (`inGame === false`, a game on). The spectator's note
  is a small live card (`roomSpectatorCardHtml`): the game's icon and name, the round (and of how
  many, when the game says), the top three of its board when it keeps one, and the old line under
  a pulsing dot; redrawn as the round moves.
- **1314, «لعبناها» on the tiles.** `start` from the lobby appends the game to **`room.played`**
  (the last `ROOM_PLAYED_KEEP` = 60, RoomGames.js), projected as `played`. Every hub tile on the
  phone and the TV carries ✓ (✓×2 …) for the times tonight (`roomPlayedCount`; a family tile
  counts all its games, `roomPlayedBadgeHtml`), and the last game played, when it can start now,
  sits first under «🔁 تاني؟» and not again below (`roomPlayedLastTile`).
- **Shared functions changed:** `updateRoomBanner`, `renderRoomSpectator`, `roomNightBoardHtml`,
  `rememberNight`, `renderRoomLobby`, `roomHubPosterHtml`, `roomHubListHtml`, `roomShareLink`,
  `roomJoinFromForm`, `initRooms` (JS_Room.html); `renderScoreboard` (JS_RoomVoting.html);
  `renderRoomTv`, `tvNightLine`, `tvLobby` (JS_RoomTv.html); `paintAudience`; `renderTogether`;
  `shareRoomNight`; `openExitSheet`; `applyRoomAction`; `roomView`.
